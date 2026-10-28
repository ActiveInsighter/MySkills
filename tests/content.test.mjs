import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { collectContent } from '../scripts/content.mjs';
import { decodeUnicodeAssetName, normalizeStaticUnicodePaths } from '../scripts/normalize-static-unicode-paths.mjs';

test('Markdown routing preserves UTF-8 and does not publish starter examples', async () => {
  const pages = await collectContent();
  assert.ok(pages.some(p => p.url === '/docs/skills/shadcn'));
  assert.ok(!pages.some(p => /任务拆解与验收|文档整理与复用|guides/.test(p.url)));
  const dir = await mkdtemp(path.resolve('.unicode-test-'));
  try {
    const raw = '---\ntitle: 中文技能\n---\n\n你好，世界。🙂\n';
    await writeFile(path.join(dir, '中文技能.md'), raw);
    const [page] = await collectContent(dir);
    assert.equal(page.markdown, '/docs/中文技能.md');
    assert.equal(page.raw, raw);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('all Skills preserve every original resource and expose reference pages', async () => {
  const catalog = JSON.parse(await readFile('skills/catalog.json', 'utf8'));
  const summaries = JSON.parse(await readFile('public/skills.json', 'utf8'));
  assert.equal(catalog.length, 11);
  assert.equal(summaries.length, catalog.length);
  assert.ok(summaries.every(s => !Object.hasOwn(s, 'raw') && !Object.hasOwn(s, 'body')));
  for (const skill of catalog) {
    const manifest = JSON.parse(await readFile(`public/skill-files/${skill.id}/manifest.json`, 'utf8'));
    assert.ok(manifest.files.some(f => f.path === 'SKILL.md'));
    for (const file of manifest.files) {
      assert.deepEqual(await readFile(`public/skill-files/${skill.id}/${file.path}`), await readFile(`skills/${skill.id}/${file.path}`), `${skill.id}/${file.path}`);
    }
  }
  const pages = await collectContent();
  assert.ok(pages.some(p => p.url === '/docs/skills/shadcn/rules/base-vs-radix'));
  const myfumadocs = pages.find(p => p.url === '/docs/skills/myfumadocs');
  const custom = pages.find(p => p.url === '/docs/skills/myfumadocs/references/custom-components');
  assert.ok(myfumadocs, 'MyFumadocs entry is published');
  assert.ok(custom, 'MyFumadocs custom reference is published');
  assert.match(myfumadocs.raw, /\/docs\/skills\/myfumadocs\/references\/custom-components/);
  assert.match(myfumadocs.raw, /\$\.\.\.\$/);
  assert.match(myfumadocs.raw, /### 9\. Files \/ Folder \/ File/);
  assert.match(myfumadocs.raw, /remarkMdxFiles/);
  assert.match(myfumadocs.raw, /<Files>/);
  assert.match(custom.raw, /<Question/);
  const shadcn = pages.find(p => p.url === '/docs/skills/shadcn');
  assert.match(shadcn.raw, /\]\(\/docs\/skills\/shadcn\/rules\/base-vs-radix\)/);
  const playwright = pages.find(p => p.url === '/docs/skills/playwright-cli');
  assert.ok(playwright.raw.includes('[Snapshot](.playwright-cli/page-2026-02-14T19-22-42-679Z.yml)'));
  assert.ok(!playwright.raw.includes('/skill-files/playwright-cli/.playwright-cli/'));
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
