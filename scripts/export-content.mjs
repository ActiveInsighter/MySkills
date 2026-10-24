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
const entries = pages.map(p => `- [${p.title}](${new URL(p.markdown, origin).href}): ${p.description}`).join('\n');
await writeFile('public/llms.txt', `# MySkills\n\n> 个人 Skill 知识库；所有文档均可按 Markdown 链接读取。\n\nMCP: ${origin}/mcp\n\n## 文档\n\n${entries}\n`, 'utf8');
await writeFile('public/llms-full.txt', pages.map(p => `===== ${new URL(p.markdown, origin).href} =====\n${p.raw}`).join('\n\n'), 'utf8');
await writeFile('public/skills.json', JSON.stringify(pages.map(({ raw, ...page }) => page), null, 2)+'\n', 'utf8');
console.log(`Exported ${pages.length} UTF-8 Markdown documents and AI indexes.`);
