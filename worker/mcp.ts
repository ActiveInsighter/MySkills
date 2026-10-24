/** Stateless Streamable HTTP MCP, matching the existing docs-md-mcp tools. */
type Json = Record<string, unknown>;
type Rpc = { jsonrpc: '2.0'; id?: string | number | null; method: string; params?: Json };
type Site = { origin: string; label: string };
type SkillSummary = { name: string; title: string; description: string; originalDescription?: string; tags: string[]; url: string; skill_url: string; files_count: number };
type SkillFile = { path: string; url: string; text: boolean; bytes: number; view?: string };
const SKILL_INSTRUCTIONS = 'This server is a library of 10 reusable Skills for Fumadocs, frontend development, browser verification, Supabase and Postgres. Before starting a relevant task: (1) call list_skills(query?) to discover names, descriptions and triggers without loading bodies; broaden the query or omit it if no match. (2) Select only Skills relevant to the current task and call read_skill(name) to load their original SKILL.md. (3) Read only the specific rules/references needed using read_skill(name, path), resolving paths relative to that Skill root; available resource paths are returned with the entry. Do not eagerly load all Skills, all rules or large AGENTS.md bundles. Apply the selected guidance in the current project, respecting the user request and existing authorization. This server reads files only; it does not execute scripts, install dependencies or grant permission for external actions. Use get_index/read_doc/read_docs for reading website documentation by link. All content is public.';
type Bindings = Pick<Env, 'ASSETS' | 'RATE_LIMITER'> & { SITES: Record<string, Site> };
const versions = ['2025-11-25', '2025-06-18', '2025-03-26'];
const block = (text: string) => ({ type: 'text' as const, text });
const result = (text: string, isError = false) => ({ content: [block(text)], isError });
const MAX_BYTES = 2_000_000;
const headers = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, GET, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, accept, mcp-session-id, mcp-protocol-version',
  'cache-control': 'no-store',
};

export function createMcp(env: Bindings) {
  // Configuration is request-local: no cross-request mutable state.
  const sites = env.SITES;
  const origins = new Set(Object.values(sites).map(s => new URL(s.origin).origin));
  const names = Object.keys(sites);
  const siteProperty = { type: 'string', enum: names, description: 'Required for relative paths; selects a configured site.' };
  const tools = [
    { name: 'list_skills', description: 'Start here before a task: discover reusable Skills by name, description and trigger tags, WITHOUT loading their bodies. Optional query matches all space-separated keywords in Chinese or English. If no match, shorten the query or omit it. Select relevant Skills, then call read_skill(name). Do not load every Skill.', inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Task keywords, e.g. 组件, React, 性能, 登录, Supabase, RLS.' } } } },
    { name: 'read_skill', description: 'Read a selected Skill on demand. Omit path to read its original SKILL.md and discover available resource paths. Then follow only task-relevant references with path relative to the Skill root, e.g. name=shadcn, path=rules/base-vs-radix.md. For a link inside a reference, resolve it relative to that reference directory. Do not preload all rules or large AGENTS.md bundles. Returns text only; scripts are never executed.', inputSchema: { type: 'object', properties: { name: { type: 'string', description: 'Exact Skill name returned by list_skills.' }, path: { type: 'string', description: 'Optional exact relative file path from the resource list. Default SKILL.md.' } }, required: ['name'] } },
    { name: 'get_index', description: 'Get the lightweight website index, including Skill entry links and AI usage instructions. To choose a Skill for a task, prefer list_skills followed by read_skill. Optional query filters by all space-separated keywords.', inputSchema: { type: 'object', properties: { site: siteProperty, query: { type: 'string' } }, required: ['site'] } },
    { name: 'read_doc', description: 'Read one document as verbatim UTF-8 Markdown. Accepts a page URL or .md URL; paths require site.', inputSchema: { type: 'object', properties: { url: { type: 'string' }, site: siteProperty }, required: ['url'] } },
    { name: 'read_docs', description: 'Read up to 20 whole documents in parallel. Default max_chars 50000, maximum 100000. The first successful page is always returned whole; skipped/failed pages have structured retry status.', inputSchema: { type: 'object', properties: { urls: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 20 }, site: siteProperty, max_chars: { type: 'integer', minimum: 1000, maximum: 100000 } }, required: ['urls'] } },
  ].map(tool => ({ ...tool, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }));

  function resolve(ref: unknown, site: unknown) {
    if (typeof ref !== 'string' || !ref.trim()) throw new Error('url must be a non-empty string');
    let url: URL;
    if (/^https?:\/\//i.test(ref)) url = new URL(ref);
    else {
      if (typeof site !== 'string' || !Object.hasOwn(sites, site)) throw new Error(`Path requires site: ${names.join(', ')}`);
      url = new URL(ref, sites[site].origin);
    }
    if (url.protocol !== 'https:' || url.username || url.password || !origins.has(url.origin)) throw new Error('Host not allowed');
    url.search = ''; url.hash = '';
    url.pathname = url.pathname.replace(/\/+$/, '');
    if (!url.pathname.endsWith('.md')) url.pathname += '.md';
    if (url.pathname !== '/docs.md' && !url.pathname.startsWith('/docs/') && !url.pathname.startsWith('/skill-files/')) throw new Error('Only documentation or Skill Markdown links are allowed');
    return url;
  }

  let fetchedBytes = 0;
  async function fetchText(url: URL) {
    // The Assets binding reads the exact same deployment as the website;
    // external redirects and arbitrary fetch destinations are never followed.
    const response = await env.ASSETS.fetch(new Request(url, { signal: AbortSignal.timeout(10_000) }));
    if (!response.ok) throw new Error(`Document returned HTTP ${response.status}: ${url}`);
    if (!response.body) return '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
    let bytes = 0, text = '';
    try {
      for (;;) {
        const part = await reader.read();
        if (part.done) break;
        bytes += part.value.byteLength;
        fetchedBytes += part.value.byteLength;
        if (fetchedBytes > 8_000_000) throw new Error('Request exceeds 8 MB aggregate read limit');
        if (bytes > MAX_BYTES) throw new Error('Document exceeds 2 MB limit');
        text += decoder.decode(part.value, { stream: true });
      }
      return text + decoder.decode();
    } finally { await reader.cancel(); }
  }

  const catalogOrigin = Object.values(sites)[0]?.origin;
  let catalogPromise: Promise<SkillSummary[]> | undefined;
  const getCatalog = () => catalogPromise ??= fetchText(new URL('/skills.json', catalogOrigin)).then(text => {
    const value: unknown = JSON.parse(text);
    if (!Array.isArray(value)) throw new Error('Invalid Skill catalog');
    return value as SkillSummary[];
  });

  async function call(name: string, args: Json) {
    if (name === 'list_skills') {
      if (args.query !== undefined && typeof args.query !== 'string') throw new Error('query must be a string');
      const keywords = typeof args.query === 'string' ? args.query.toLowerCase().split(/\s+/).filter(Boolean) : [];
      const all = await getCatalog();
      const selected = all.filter(skill => {
        const haystack = [skill.name, skill.title, skill.description, skill.originalDescription, ...skill.tags].join(' ').toLowerCase();
        return keywords.every(word => haystack.includes(word));
      });
      const summaries = selected.map(({ name, title, description, tags, url, skill_url, files_count }) => ({ name, title, description, tags, url, skill_url, files_count }));
      const guidance = selected.length ? 'Choose only relevant Skills, then call read_skill with the exact name. Bodies have not been loaded.' : 'No matching Skills. Shorten the query or call list_skills without query; do not guess names.';
      return { content: [block(`${guidance}\n\n${summaries.map(skill => `- ${skill.name} | ${skill.title}: ${skill.description}\n  Triggers: ${skill.tags.join(', ')}\n  Entry: ${skill.skill_url}`).join('\n')}`)], structuredContent: { count: selected.length, total: all.length, skills: summaries, next_step: guidance } };
    }
    if (name === 'read_skill') {
      const skill = (await getCatalog()).find(skill => skill.name === args.name);
      if (!skill) throw new Error('Unknown Skill. Use list_skills to discover valid names.');
      if (args.path !== undefined && typeof args.path !== 'string') throw new Error('path must be a string');
      const requested = args.path === undefined ? 'SKILL.md' : String(args.path).replace(/^\.\//, '');
      const manifest = JSON.parse(await fetchText(new URL(`/skill-files/${skill.name}/manifest.json`, catalogOrigin))) as { files: SkillFile[] };
      // Exact manifest membership prevents traversal and access to other Skills.
      const file = manifest.files.find(file => file.path === requested);
      if (!file) throw new Error('Unknown file in this Skill. Read its SKILL.md to see available paths.');
      if (!file.text) throw new Error(`Binary resource: open ${file.url} in a client that supports this asset type.`);
      const fileUrl = new URL(`/skill-files/${skill.name}/${file.path}`, catalogOrigin);
      const text = await fetchText(fileUrl);
      const available = requested === 'SKILL.md' ? manifest.files.map(({ path, url, text, bytes, view }) => ({ path, url, text, bytes, ...(view ? { view } : {}) })) : undefined;
      const content = [block(text)];
      if (available) content.push(block(`Available files (read only what the task needs, using read_skill(name, path)):\n${available.map(file => `- ${file.path}${file.text ? '' : ' [binary asset]'}`).join('\n')}`));
      return { content, structuredContent: { name: skill.name, path: file.path, url: fileUrl.href, ...(available ? { available_files: available } : {}) }, isError: false };
    }
    if (name === 'get_index') {
      if (typeof args.site !== 'string' || !Object.hasOwn(sites, args.site)) throw new Error(`site must be one of: ${names.join(', ')}`);
      const text = await fetchText(new URL('/llms.txt', sites[args.site].origin));
      const words = typeof args.query === 'string' ? args.query.toLowerCase().split(/\s+/).filter(Boolean) : [];
      return result(words.length ? text.split('\n').filter(line => words.every(word => line.toLowerCase().includes(word))).slice(0, 200).join('\n') || 'No matching entries.' : text);
    }
    if (name === 'read_doc') return result(await fetchText(resolve(args.url, args.site)));
    if (name === 'read_docs') {
      if (!Array.isArray(args.urls) || !args.urls.length || args.urls.length > 20) throw new Error('urls must contain 1 to 20 entries');
      if (args.max_chars !== undefined && (!Number.isInteger(args.max_chars) || Number(args.max_chars) < 1000 || Number(args.max_chars) > 100000)) throw new Error('max_chars must be an integer from 1000 to 100000');
      const budget = typeof args.max_chars === 'number' ? args.max_chars : 50000;
      const fetched = await Promise.all(args.urls.map(async ref => {
        try { const url = resolve(ref, args.site); return { url: url.href, text: await fetchText(url) }; }
        catch (error) { return { url: String(ref), error: error instanceof Error ? error.message : String(error) }; }
      }));
      const content = [], items = [];
      let used = 0, returned = 0;
      for (const item of fetched) {
        if (item.text === undefined) { items.push({ url: item.url, status: 'failed', retryable: !/not allowed|requires site|HTTP 404|2 MB|non-empty/.test(item.error ?? ''), reason: item.error }); continue; }
        if (returned && used + item.text.length > budget) { items.push({ url: item.url, status: 'skipped', chars: item.text.length, retryable: true, reason: 'Over output budget' }); continue; }
        used += item.text.length; returned++;
        content.push(block(`===== ${item.url} (${item.text.length} chars) =====\n${item.text}`));
        items.push({ url: item.url, status: 'ok', chars: item.text.length });
      }
      const problems = items.filter(i => i.status !== 'ok');
      if (problems.length) content.push(block(`Returned ${returned} of ${items.length} pages.\n${problems.map(i => `${i.status.toUpperCase()} ${i.url}: ${i.reason}`).join('\n')}\nRETRY_URLS: ${JSON.stringify([...new Set(problems.filter(i => i.retryable).map(i => i.url))])}`));
      return { content, structuredContent: { returned, total: items.length, chars_used: used, budget, items }, isError: returned === 0 };
    }
    throw new Error(`Unknown tool: ${name}`);
  }

  async function rpc(message: unknown) {
    const error = (id: unknown, code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
    if (!message || typeof message !== 'object' || Array.isArray(message)) return error(null, -32600, 'Invalid Request');
    const m = message as Rpc;
    if (m.jsonrpc !== '2.0' || typeof m.method !== 'string' || (m.id !== undefined && m.id !== null && typeof m.id !== 'string' && typeof m.id !== 'number') || (m.params !== undefined && (!m.params || typeof m.params !== 'object' || Array.isArray(m.params)))) return error(m.id, -32600, 'Invalid Request');
    if (m.id === undefined) return null;
    const reply = (result: unknown) => ({ jsonrpc: '2.0', id: m.id, result });
    if (m.method === 'initialize') return reply({ protocolVersion: versions.includes(String(m.params?.protocolVersion)) ? m.params?.protocolVersion : versions[0], capabilities: { tools: {} }, serverInfo: { name: 'myskills', version: '2.0.0' }, instructions: SKILL_INSTRUCTIONS });
    if (m.method === 'ping') return reply({});
    if (m.method === 'tools/list') return reply({ tools });
    if (m.method === 'tools/call') {
      const args = m.params?.arguments ?? {};
      if (!args || typeof args !== 'object' || Array.isArray(args)) return error(m.id, -32602, 'arguments must be an object');
      try { return reply(await call(String(m.params?.name), args as Json)); }
      catch (e) { return reply(result(e instanceof Error ? e.message : String(e), true)); }
    }
    return error(m.id, -32601, 'Method not found');
  }

  return async (request: Request) => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return new Response('Use Streamable HTTP POST /mcp', { status: 405, headers: { ...headers, allow: 'POST, OPTIONS' } });
    const origin = request.headers.get('origin');
    if (origin && !origins.has(origin)) return new Response('Origin not allowed', { status: 403, headers });
    if (!(request.headers.get('content-type') ?? '').toLowerCase().includes('application/json')) return new Response('Expected application/json', { status: 415, headers });
    if (!(await env.RATE_LIMITER.limit({ key: request.headers.get('cf-connecting-ip') ?? 'unknown' })).success) return new Response('Rate limit exceeded', { status: 429, headers: { ...headers, 'retry-after': '60' } });
    if (Number(request.headers.get('content-length')) > 65536) return new Response('Request too large', { status: 413, headers });
    let body;
    try {
      // Bounded input, including requests without Content-Length.
      const reader = request.body?.getReader();
      let size = 0, raw = '';
      const decoder = new TextDecoder();
      if (reader) {
        try {
          for (;;) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > 65536) { await reader.cancel(); return new Response('Request too large', { status: 413, headers }); } raw += decoder.decode(part.value, { stream: true }); }
        } finally { reader.releaseLock(); }
      }
      body = JSON.parse(raw + decoder.decode());
    } catch { return Response.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, { status: 400, headers }); }
    // MCP 2025-06-18+ does not support JSON-RPC batch envelopes.
    const value = await rpc(body);
    return value ? Response.json(value, { headers }) : new Response(null, { status: 202, headers });
  };
}
