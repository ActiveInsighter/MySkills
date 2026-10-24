import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import assert from 'node:assert/strict';

const endpoint = process.argv[2] ?? 'https://myskills.any1.tech/mcp';
const origin = new URL(endpoint).origin;
const client = new Client({ name: 'myskills-e2e', version: '1.0.0' });
const text = r => r.content.filter(c => c.type === 'text').map(c => c.text).join('');
try {
  await client.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map(t => t.name).sort(), ['get_index', 'read_doc', 'read_docs']);
  const index = text(await client.callTool({ name: 'get_index', arguments: { site: 'myskills' } }));
  const links = [...index.matchAll(/\]\((https:\/\/[^)]+\.md)\)/g)].map(m => m[1]);
  assert.ok(links.length >= 7, 'All docs must appear in the live index');
  for (const link of links) {
    const url = new URL(link); url.host = new URL(origin).host; url.protocol = new URL(origin).protocol;
    const upstream = await fetch(url);
    assert.equal(upstream.status, 200, url.href);
    assert.match(upstream.headers.get('content-type'), /markdown.*utf-8/i);
    const markdown = await upstream.text();
    assert.ok(!markdown.includes('\ufffd'), 'UTF-8 replacement characters');
    const r = await client.callTool({ name: 'read_doc', arguments: { url: link } });
    assert.equal(r.isError, false);
    assert.equal(text(r), markdown, `MCP must match exported Markdown: ${link}`);
  }
  console.log(`PASS ${links.length} Markdown exports match MCP exactly`);
  const chinesePath = '/docs/skills/任务拆解与验收';
  const chinese = await client.callTool({ name: 'read_doc', arguments: { site: 'myskills', url: chinesePath } });
  assert.match(text(chinese), /交付证据/);
  const pageResponse = await fetch(origin + chinesePath);
  assert.equal(pageResponse.status, 200);
  assert.match(await pageResponse.text(), /任务拆解与验收/);
  const encodedResponse = await fetch(origin + encodeURI(chinesePath));
  assert.equal(encodedResponse.status, 200);
  const download = await fetch(origin + '/api/download?path=' + encodeURIComponent(chinesePath + '.md'));
  assert.equal(download.status, 200);
  const disposition = download.headers.get('content-disposition');
  assert.match(disposition, /attachment/);
  assert.equal(decodeURIComponent(disposition.split("filename*=UTF-8''")[1]), '任务拆解与验收.md');
  assert.equal(await download.text(), text(chinese));
  console.log('PASS Chinese HTML route, encoded URL, UTF-8 filename and download body');
  const batch = await client.callTool({ name: 'read_docs', arguments: { site: 'myskills', urls: [chinesePath, '/docs/skills/文档整理与复用', '/docs/missing', 'https://example.com/private'] } });
  assert.equal(batch.structuredContent.returned, 2);
  assert.deepEqual(batch.structuredContent.items.map(i => i.status), ['ok', 'ok', 'failed', 'failed']);
  assert.equal(batch.isError, false);
  const small = await client.callTool({ name: 'read_docs', arguments: { site: 'myskills', urls: [chinesePath, '/docs/skills/文档整理与复用'], max_chars: 1000 } });
  assert.equal(small.structuredContent.returned, 1);
  assert.equal(small.structuredContent.items[1].status, 'skipped');
  for (const url of ['https://example.com/private', '/docs/missing']) {
    assert.equal((await client.callTool({ name: 'read_doc', arguments: { site: 'myskills', url } })).isError, true);
  }
  const filtered = await client.callTool({ name: 'get_index', arguments: { site: 'myskills', query: '任务' } });
  assert.match(text(filtered), /任务拆解/);
  console.log('PASS batch reads, budget, index query and rejected links');
  const invalid = await fetch(origin + '/mcp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: 'null' });
  assert.equal((await invalid.json()).error.code, -32600);
  const missing = await fetch(origin + '/docs/does-not-exist');
  assert.equal(missing.status, 404);
  const manifest = await fetch(origin + '/skills.json').then(r => r.json());
  assert.equal(manifest.length, links.length);
  console.log('PASS live manifest, invalid RPC and missing page');
} finally { await client.close(); }
