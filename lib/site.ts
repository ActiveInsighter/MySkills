export const site = {
  name: 'MySkills',
  origin: 'https://myskills.any1.tech',
  description: '把实践整理成 Skill，让经验可以复用。',
  repository: 'https://github.com/ActiveInsighter/MySkills',
};
export function markdownPath(url: string) {
  return `${url.replace(/\/+$/, '')}.md`;
}
