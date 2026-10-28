import { readdir, readFile, mkdir, writeFile, rm, cp } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { createHash } from 'node:crypto';

const origin = 'https://myskills.any1.tech';
export const skillCatalog = JSON.parse(await readFile('skills/catalog.json', 'utf8'));
const textFile = name => /\.(md|txt|json|ya?ml|toml|[cm]?js|tsx?|css|py|sh)$/i.test(name) || /(^|\/)(LICENSE|NOTICE)$/i.test(name);
async function walk(dir, base = dir) {
  const files = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, item.name);
    if (item.isDirectory()) files.push(...await walk(absolute, base));
    else if (item.isFile()) files.push(path.relative(base, absolute).split(path.sep).join('/'));
    else throw new Error(`Unsupported Skill resource: ${absolute}`);
  }
  return files.sort();
}
function rewriteLinks(body, id, file, markdownFiles) {
  let fence;
  return body.split('\n').map(line => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = undefined;
      return line;
    }
    if (marker) { fence = marker[1]; return line; }
    return line.replace(/(!?\[[^\]\n]*\]\()([^\s)]+)(\))/g, (match, start, href, end) => {
      if (/^(?:[a-z]+:|\/|#)/i.test(href)) return match;
      const [pathname, anchor = ''] = href.split('#');
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), decodeURIComponent(pathname)));
      if (resolved.startsWith('../')) return match;
      const destination = markdownFiles.has(resolved)
        ? `/docs/skills/${id}/${resolved === 'SKILL.md' ? '' : resolved.replace(/\.md$/, '')}`
        : `/skill-files/${id}/${resolved}`;
      return start + encodeURI(destination) + (anchor ? '#' + anchor : '') + end;
    });
  }).join('\n');
}
const summaries = [];
await rm('public/skill-files', { recursive: true, force: true });
await mkdir('public/skill-files', { recursive: true });
for (const item of skillCatalog) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)) throw new Error(`Invalid Skill id: ${item.id}`);
  const sourceDir = path.join('skills', item.id);
  const raw = await readFile(path.join(sourceDir, 'SKILL.md'), 'utf8');
  const { data } = matter(raw);
  if (data.name !== item.id || typeof data.description !== 'string') throw new Error(`Invalid Skill metadata: ${item.id}`);
  const docsDir = path.join('content/docs/skills', item.id);
  await rm(docsDir, { recursive: true, force: true });
  await mkdir(docsDir, { recursive: true });
  await cp(sourceDir, path.join('public/skill-files', item.id), { recursive: true });
  const paths = await walk(sourceDir);
  // Aggregated AGENTS and release notes remain accessible as original resources;
  // individual rules get reading pages without duplicating those large bundles.
  const markdownFiles = new Set(paths.filter(f => f.endsWith('.md') && !['AGENTS.md', 'CHANGELOG.md'].includes(f) && !f.startsWith('assets/')));
  const files = [];
  for (const file of paths) {
    const bytes = await readFile(path.join(sourceDir, file));
    const view = markdownFiles.has(file) ? `/docs/skills/${item.id}${file === 'SKILL.md' ? '' : '/' + file.replace(/\.md$/, '')}` : undefined;
    files.push({ path: file, url: new URL(`/skill-files/${item.id}/${file}`, origin).href, bytes: bytes.length, text: textFile(file), sha256: createHash('sha256').update(bytes).digest('hex'), ...(view ? { view } : {}) });
    if (!view) continue;
    const parsed = matter(bytes.toString('utf8'));
    const title = file === 'SKILL.md' ? item.title : String(parsed.data.title ?? parsed.content.match(/^#\s+(.+)$/m)?.[1] ?? file.replace(/\.md$/, ''));
    const description = file === 'SKILL.md' ? item.description : `${item.title} · ${file}`;
    // DocsTitle already renders the article heading; keep the original heading in raw files.
    const body = rewriteLinks(parsed.content.replace(/^\s*# [^\n]*(?:\r?\n|$)/, ''), item.id, file, markdownFiles);
    const fm = `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\n---\n\n`;
    const destination = path.join(docsDir, file === 'SKILL.md' ? 'index.md' : file);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, fm + body, 'utf8');
  }
  await writeFile(path.join(docsDir, 'meta.json'), JSON.stringify({ title: item.title, pages: ['index', '...'] }) + '\n');
  const summary = { name: item.id, title: item.title, description: item.description, originalDescription: data.description, tags: item.tags, source: item.source, url: `${origin}/docs/skills/${item.id}`, markdown: `${origin}/docs/skills/${item.id}.md`, skill_url: `${origin}/skill-files/${item.id}/SKILL.md`, files_count: files.length };
  summaries.push(summary);
  await writeFile(`public/skill-files/${item.id}/manifest.json`, JSON.stringify({ ...summary, files }, null, 2) + '\n');
}
await writeFile('public/skills.json', JSON.stringify(summaries, null, 2) + '\n');
await writeFile('content/docs/skills/meta.json', JSON.stringify({ title: 'Skills', pages: ['index', ...skillCatalog.map(s => s.id)] }) + '\n');
const intro = `---\ntitle: Skills\ndescription: 两个 Fumadocs 项目相关的 ${skillCatalog.length} 个 Skill，按任务选择并读取。\n---\n\n以下 Skill 包含可直接使用的规则、示例和参考资料。\n\n## 按任务选择\n\n`;
const rows = skillCatalog.map(s => `| [${s.title}](/docs/skills/${s.id}) | \`${s.id}\` | ${s.description} |`).join('\n');
await writeFile('content/docs/skills/index.md', intro + '| Skill | 名称 | 适用场景 |\n| --- | --- | --- |\n' + rows + '\n\n## 让 AI 按需读取\n\n通过 [MCP 使用说明](/docs/ai) 连接后，先调用 `list_skills` 查询名称和适用场景，再调用 `read_skill` 读取相关入口。需要具体规则时，沿入口中的引用继续读取，无需一次加载全部内容。\n');
console.log(`Synced ${summaries.length} Skills with original resources and reading pages.`);
