import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { collectContent } from './content.mjs';
const origin = 'https://myskills.any1.tech';
const pages = await collectContent();
await rm('public/docs', { recursive: true, force: true });
for (const page of pages) {
  const file = path.join('public', page.markdown);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, page.raw, 'utf8');
}
const indexPages = pages.filter(p => !p.url.startsWith('/docs/skills/') || p.url.split('/').length === 4);
const entries = indexPages.map(p => `- [${p.title}](${new URL(p.markdown, origin).href}): ${p.description}`).join('\n');
await writeFile('public/llms.txt', `# MySkills\n\n> 个人 Skill 知识库；所有文档均可按 Markdown 链接读取。\n\nMCP: ${origin}/mcp\n\n## AI 按需读取\n\n先调用 list_skills 查询名称和适用场景，再用 read_skill(name) 读取选中的 SKILL.md；需要具体规则时用 read_skill(name, path) 沿引用读取。不要预先加载全部正文。\n\n## 文档\n\n${entries}\n`, 'utf8');
await writeFile('public/llms-full.txt', pages.map(p => `===== ${new URL(p.markdown, origin).href} =====\n${p.raw}`).join('\n\n'), 'utf8');
await writeFile('public/documents.json', JSON.stringify(pages.map(({ raw, ...page }) => page), null, 2)+'\n', 'utf8');
console.log(`Exported ${pages.length} UTF-8 Markdown documents and AI indexes.`);
