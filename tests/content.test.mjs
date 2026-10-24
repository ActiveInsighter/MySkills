import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { collectContent } from '../scripts/content.mjs';
import { decodeUnicodeAssetName, normalizeStaticUnicodePaths } from '../scripts/normalize-static-unicode-paths.mjs';

test('Markdown route mapping and raw Chinese content are preserved', async () => {
  const pages = await collectContent();
  const chinese = pages.find(p => p.url === '/docs/skills/任务拆解与验收');
  assert.ok(chinese);
  assert.equal(chinese.markdown, '/docs/skills/任务拆解与验收.md');
  assert.equal(chinese.raw, await readFile('content/docs/skills/任务拆解与验收.md', 'utf8'));
  assert.ok(pages.some(p => p.markdown === '/docs.md'));
  assert.ok(pages.some(p => p.markdown === '/docs/skills.md'));
});

test('encoded nested Chinese static files normalize without changing payload', async () => {
  const dir = await mkdtemp(path.resolve('.unicode-test-'));
  try {
    const child = path.join(dir, encodeURIComponent('中文'));
    await mkdir(child);
    await writeFile(path.join(child, encodeURIComponent('任务') + '.html'), '中文正文');
    assert.equal(await normalizeStaticUnicodePaths(dir), 2);
    assert.equal(await readFile(path.join(dir, '中文/任务.html'), 'utf8'), '中文正文');
    assert.equal(decodeUnicodeAssetName('literal%2Fpath'), 'literal%2Fpath');
    assert.equal(decodeUnicodeAssetName('bad%FF'), 'bad%FF');
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('normalization refuses collisions', async () => {
  const dir = await mkdtemp(path.resolve('.unicode-test-'));
  try {
    await writeFile(path.join(dir, '中文.html'), 'first');
    await writeFile(path.join(dir, encodeURIComponent('中文') + '.html'), 'second');
    await assert.rejects(normalizeStaticUnicodePaths(dir), /collision/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
