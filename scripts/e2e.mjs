import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const endpoint = process.argv[2] ?? 'https://myskills.any1.tech/mcp';
const origin = new URL(endpoint).origin;
const client = new Client({ name: 'myskills-e2e', version: '2.0.0' });
const text = r => r.content.filter(c => c.type === 'text').map(c => c.text).join('');
const localCatalog = JSON.parse(await readFile('skills/catalog.json', 'utf8'));
try {
  await client.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
  assert.match(client.getInstructions(), /list_skills.*read_skill/);
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map(t => t.name).sort(), ['get_index', 'list_skills', 'read_doc', 'read_docs', 'read_skill']);
  const list = await client.callTool({ name: 'list_skills', arguments: {} });
  assert.equal(list.structuredContent.count, localCatalog.length);
  assert.deepEqual(list.structuredContent.skills.map(s => s.name).sort(), localCatalog.map(s => s.id).sort());
  for (const skill of list.structuredContent.skills) {
    const r = await client.callTool({ name: 'read_skill', arguments: { name: skill.name } });
    assert.equal(r.isError, false);
    assert.equal(r.content[0].text, await readFile(`skills/${skill.name}/SKILL.md`, 'utf8'));
    assert.equal(r.content[0].text, await fetch(skill.skill_url).then(r => r.text()));
    assert.ok(r.structuredContent.available_files.length > 0);
  }
  for (const [name, path] of [['shadcn', 'rules/base-vs-radix.md'], ['vercel-react-best-practices', 'rules/async-parallel.md']]) {
    const r = await client.callTool({ name: 'read_skill', arguments: { name, path } });
    assert.equal(r.content[0].text, await readFile(`skills/${name}/${path}`, 'utf8'));
  }
  const originalByLink = await client.callTool({ name: 'read_doc', arguments: { url: origin + '/skill-files/shadcn/SKILL.md' } });
  assert.equal(text(originalByLink), await readFile('skills/shadcn/SKILL.md', 'utf8'));
  const filtered = await client.callTool({ name: 'list_skills', arguments: { query: '组件' } });
  assert.ok(filtered.structuredContent.skills.some(s => s.name === 'shadcn'));
  for (const args of [{ name: 'unknown' }, { name: 'shadcn', path: '../supabase/SKILL.md' }, { name: 'shadcn', path: 'assets/shadcn.png' }]) assert.equal((await client.callTool({ name: 'read_skill', arguments: args })).isError, true);
  console.log('PASS discovery -> selected entry -> referenced rule; all 10 original Skills match local files byte for byte');

  const index = text(await client.callTool({ name: 'get_index', arguments: { site: 'myskills' } }));
  assert.match(index, /list_skills.*read_skill/);
  assert.ok(!index.includes('任务拆解与验收') && !index.includes('文档整理与复用'));
  const links = [...index.matchAll(/\]\((https:\/\/[^)]+\.md)\)/g)].map(m => m[1]);
  assert.equal(links.length, 13, 'Lightweight index: 10 Skills and 3 site pages, no expanded references');
  for (const link of links) {
    const upstream = await fetch(link);
    assert.equal(upstream.status, 200, link);
    assert.match(upstream.headers.get('content-type'), /markdown.*utf-8/i);
    const markdown = await upstream.text();
    assert.ok(!markdown.includes('\ufffd'));
    const r = await client.callTool({ name: 'read_doc', arguments: { url: link } });
    assert.equal(text(r), markdown);
  }
  const path = '/docs/skills/shadcn';
  const doc = await client.callTool({ name: 'read_doc', arguments: { site: 'myskills', url: path } });
  const response = await fetch(origin + path);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /shadcn 组件开发/);
  const download = await fetch(origin + '/api/download?path=' + encodeURIComponent(path + '.md'));
  assert.equal(download.status, 200);
  assert.match(download.headers.get('content-disposition'), /attachment/);
  assert.equal(await download.text(), text(doc));
  const batch = await client.callTool({ name: 'read_docs', arguments: { site: 'myskills', urls: [path, '/docs/ai', '/docs/missing', 'https://example.com/private'] } });
  assert.deepEqual(batch.structuredContent.items.map(i => i.status), ['ok', 'ok', 'failed', 'failed']);
  for (const old of ['任务拆解与验收', '文档整理与复用']) assert.equal((await fetch(origin + '/docs/skills/' + old)).status, 404);
  assert.equal((await fetch(origin + '/docs/guides/authoring')).status, 404);
  const manifest = await fetch(origin + '/documents.json').then(r => r.json());
  assert.ok(manifest.length > 100, 'Reading pages must include references');
  const reference = await fetch(origin + '/docs/skills/shadcn/rules/base-vs-radix');
  assert.equal(reference.status, 200);
  console.log(`PASS ${links.length} lightweight document exports, UTF-8 downloads, batch reads, ${manifest.length} reading pages and removal of starter docs`);
} finally { await client.close(); }
