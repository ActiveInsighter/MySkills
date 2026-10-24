import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

export async function collectContent(root = 'content/docs') {
  const pages = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (/\.mdx?$/.test(entry.name)) {
        if (entry.name.endsWith('.mdx')) throw new Error(`Use .md for portable Skill content: ${file}`);
        const raw = await readFile(file, 'utf8');
        const { data } = matter(raw);
        if (typeof data.title !== 'string' || !data.title.trim()) throw new Error(`Missing title: ${file}`);
        const relative = path.relative(root, file).split(path.sep).join('/').replace(/\.md$/, '');
        const slug = relative.replace(/(^|\/)index$/, '');
        const url = `/docs${slug ? `/${slug}` : ''}`;
        pages.push({ title: data.title, description: data.description ?? '', url, markdown: `${url}.md`, raw });
      }
    }
  }
  await walk(root);
  pages.sort((a, b) => a.url.localeCompare(b.url, 'zh-CN'));
  if (new Set(pages.map(p => p.url)).size !== pages.length) throw new Error('Duplicate documentation URL');
  return pages;
}
