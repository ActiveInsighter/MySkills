import test from 'node:test';
import assert from 'node:assert/strict';
import { createMcp } from '../worker/mcp.ts';
const origin = 'https://myskills.any1.tech';
const raw = '---\ntitle: 中文技能\n---\n\n## 任务步骤\n你好，世界。🙂\n';
const files = new Map([['/docs/中文技能.md', raw], ['/docs/big.md', '中文正文'.repeat(800)], ['/docs/small.md', 'small'], ['/llms.txt', `- [中文技能](${origin}/docs/中文技能.md): 中文说明`]]);
function handler(allowed = true, fetched = []) {
  return createMcp({ SITES: { myskills: { origin, label: 'MySkills' } }, RATE_LIMITER: { limit: async () => ({ success: allowed }) }, ASSETS: { fetch: async req => { const path = decodeURIComponent(new URL(req.url).pathname); fetched.push(path); return files.has(path) ? new Response(files.get(path), { headers: { 'content-type': 'text/markdown; charset=utf-8' } }) : new Response('Not found', { status: 404 }); } } });
}
files.set('/skills.json', JSON.stringify([{ name: 'shadcn', title: '组件开发', description: 'shadcn 组件与样式', tags: ['组件', 'UI'], url: origin + '/docs/skills/shadcn', skill_url: origin + '/skill-files/shadcn/SKILL.md', files_count: 3 }]));
files.set('/skill-files/shadcn/manifest.json', JSON.stringify({ files: [{ path: 'SKILL.md', url: origin + '/skill-files/shadcn/SKILL.md', text: true, bytes: 100 }, { path: 'rules/base-vs-radix.md', url: origin + '/skill-files/shadcn/rules/base-vs-radix.md', text: true, bytes: 50 }, { path: 'assets/icon.png', url: origin + '/skill-files/shadcn/assets/icon.png', text: false, bytes: 100 }] }));
files.set('/skill-files/shadcn/SKILL.md', '---\nname: shadcn\ndescription: 组件开发\n---\n\nENTRY BODY: see rules/base-vs-radix.md');
files.set('/skill-files/shadcn/rules/base-vs-radix.md', '# Base UI\n中文参考正文');
const request = (message, extras = {}) => new Request(origin + '/mcp', { method: 'POST', headers: { 'content-type': 'application/json', ...extras }, body: JSON.stringify(message) });
async function call(name, args, h = handler()) {
  const res = await h(request({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }));
  assert.equal(res.status, 200); return (await res.json()).result;
}

test('initialize and list tools', async () => {
  const h = handler();
  const res = await h(request({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } }));
  const init = (await res.json()).result;
  assert.equal(init.protocolVersion, '2025-06-18');
  assert.match(init.instructions, /list_skills.*read_skill/);
  assert.match(init.instructions, /Do not eagerly load/);
  const list = await (await h(request({ jsonrpc: '2.0', id: 2, method: 'tools/list' }))).json();
  assert.deepEqual(list.result.tools.map(t => t.name).sort(), ['get_index', 'list_skills', 'read_doc', 'read_docs', 'read_skill']);
});

test('read UTF-8 identically through page, encoded markdown and path URLs', async () => {
  for (const args of [{ url: origin + '/docs/中文技能' }, { url: origin + '/docs/' + encodeURIComponent('中文技能') + '.md' }, { url: '/docs/中文技能/', site: 'myskills' }]) {
    assert.equal((await call('read_doc', args)).content[0].text, raw);
  }
  assert.match((await call('get_index', { site: 'myskills', query: '中文 技能' })).content[0].text, /中文说明/);
  assert.equal((await call('get_index', { site: 'myskills', query: 'missing' })).content[0].text, 'No matching entries.');
});

test('external hosts, non-doc paths, missing site and missing pages are tool errors', async () => {
  for (const args of [{ url: 'https://example.com/doc' }, { url: '//example.com/doc', site: 'myskills' }, { url: origin + '/mcp' }, { url: '/docs/中文技能' }, { url: '/docs/missing', site: 'myskills' }, { url: origin + '/docs/../private' }]) assert.equal((await call('read_doc', args)).isError, true);
});

test('batch returns whole first page, skips over budget, continues after failures', async () => {
  const r = await call('read_docs', { urls: ['/docs/big', '/docs/中文技能', 'https://example.com/x', '/docs/missing'], site: 'myskills', max_chars: 1000 });
  assert.equal(r.structuredContent.returned, 1);
  assert.deepEqual(r.structuredContent.items.map(i => i.status), ['ok', 'skipped', 'failed', 'failed']);
  assert.ok(r.content[0].text.endsWith(files.get('/docs/big.md')));
  assert.match(r.content.at(-1).text, /RETRY_URLS/);
  const small = await call('read_docs', { urls: ['/docs/中文技能', '/docs/big', '/docs/small'], site: 'myskills', max_chars: 1000 });
  assert.deepEqual(small.structuredContent.items.map(i => i.status), ['ok', 'skipped', 'ok']);
  assert.equal((await call('read_docs', { urls: Array(21).fill('/docs/中文技能'), site: 'myskills' })).isError, true);
  assert.equal((await call('read_docs', { urls: ['/docs/中文技能'], site: 'myskills', max_chars: 'wrong' })).isError, true);
});

test('transport validates inputs, rate limits and acknowledges notifications', async () => {
  const h = handler();
  assert.equal((await h(request({ jsonrpc: '2.0', method: 'notifications/initialized' }))).status, 202);
  for (const bad of [null, [], { jsonrpc: '1.0', id: 1, method: 'ping' }]) assert.equal((await (await h(request(bad))).json()).error.code, -32600);
  assert.equal((await h(request({ jsonrpc: '2.0', id: 1, method: 'ping' }, { origin: 'https://evil.example' }))).status, 403);
  assert.equal((await handler(false)(request({ jsonrpc: '2.0', id: 1, method: 'ping' }))).status, 429);
  assert.equal((await h(new Request(origin + '/mcp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: 'x'.repeat(65537) }))).status, 413);
});

test('Skill discovery loads metadata only, then reads an exact entry and reference on demand', async () => {
  const fetched = [];
  const list = await call('list_skills', { query: '组件' }, handler(true, fetched));
  assert.equal(list.structuredContent.count, 1);
  assert.equal(list.structuredContent.skills[0].name, 'shadcn');
  assert.deepEqual(fetched, ['/skills.json']);
  assert.ok(!list.content[0].text.includes('ENTRY BODY'));
  const entry = await call('read_skill', { name: 'shadcn' });
  assert.equal(entry.content[0].text, files.get('/skill-files/shadcn/SKILL.md'));
  assert.ok(entry.structuredContent.available_files.some(f => f.path === 'rules/base-vs-radix.md'));
  const byLink = await call('read_doc', { url: origin + '/skill-files/shadcn/SKILL.md' });
  assert.equal(byLink.content[0].text, files.get('/skill-files/shadcn/SKILL.md'));
  const rule = await call('read_skill', { name: 'shadcn', path: 'rules/base-vs-radix.md' });
  assert.equal(rule.content[0].text, files.get('/skill-files/shadcn/rules/base-vs-radix.md'));
  assert.ok(!Object.hasOwn(rule.structuredContent, 'available_files'));
  assert.equal((await call('list_skills', { query: 'missing' })).structuredContent.count, 0);
});

test('Skill reads reject unknown names, traversal, external URLs and binary content', async () => {
  for (const args of [{ name: 'unknown' }, { name: 'shadcn', path: '../supabase/SKILL.md' }, { name: 'shadcn', path: '%2e%2e/SKILL.md' }, { name: 'shadcn', path: 'https://example.com/private' }, { name: 'shadcn', path: 'assets/icon.png' }, { name: 'shadcn', path: false }]) assert.equal((await call('read_skill', args)).isError, true);
});
