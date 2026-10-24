import test from 'node:test';
import assert from 'node:assert/strict';
import { createMcp } from '../worker/mcp.ts';
const origin = 'https://myskills.any1.tech';
const raw = '---\ntitle: 中文技能\n---\n\n## 任务步骤\n你好，世界。🙂\n';
const files = new Map([['/docs/中文技能.md', raw], ['/docs/big.md', '中文正文'.repeat(800)], ['/docs/small.md', 'small'], ['/llms.txt', `- [中文技能](${origin}/docs/中文技能.md): 中文说明`]]);
function handler(allowed = true) {
  return createMcp({ SITES: { myskills: { origin, label: 'MySkills' } }, RATE_LIMITER: { limit: async () => ({ success: allowed }) }, ASSETS: { fetch: async req => { const path = decodeURIComponent(new URL(req.url).pathname); return files.has(path) ? new Response(files.get(path), { headers: { 'content-type': 'text/markdown; charset=utf-8' } }) : new Response('Not found', { status: 404 }); } } });
}
const request = (message, extras = {}) => new Request(origin + '/mcp', { method: 'POST', headers: { 'content-type': 'application/json', ...extras }, body: JSON.stringify(message) });
async function call(name, args, h = handler()) {
  const res = await h(request({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }));
  assert.equal(res.status, 200); return (await res.json()).result;
}

test('initialize and list tools', async () => {
  const h = handler();
  const res = await h(request({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } }));
  assert.equal((await res.json()).result.protocolVersion, '2025-06-18');
  const list = await (await h(request({ jsonrpc: '2.0', id: 2, method: 'tools/list' }))).json();
  assert.deepEqual(list.result.tools.map(t => t.name).sort(), ['get_index', 'read_doc', 'read_docs']);
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
