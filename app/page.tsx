import Link from 'next/link';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { source } from '@/lib/source';
import { site } from '@/lib/site';
import { ArrowUpRight, BookOpen, Plug } from 'lucide-react';

export default function Home() {
  const skills = source.getPages().filter(page => page.url.startsWith('/docs/skills/'));
  return (
    <HomeLayout nav={{ title: site.name }} githubUrl={site.repository} links={[{ text: 'Skills', url: '/docs/skills' }, { text: '使用指南', url: '/docs/guides' }]}>
      <main className="mx-auto w-full max-w-5xl px-6 pb-16 pt-16 md:pt-24">
        <div className="max-w-2xl">
          <p className="mb-5 text-sm text-fd-muted-foreground">个人 Skill 知识库</p>
          <h1 className="text-4xl font-medium leading-tight tracking-tight md:text-5xl">把经验，写成下一次的起点。</h1>
          <p className="mt-6 text-lg leading-8 text-fd-muted-foreground">记录实践中的方法、步骤与判断。需要时自己查阅，也可以让 AI 读取同一份 Skill，一起把事情做好。</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link prefetch={false} href="/docs/skills" className="inline-flex items-center gap-2 rounded-xl bg-fd-primary px-5 py-3 text-sm font-medium text-fd-primary-foreground"><BookOpen size={17} />浏览 Skills</Link>
            <Link prefetch={false} href="/docs/guides/mcp" className="inline-flex items-center gap-2 rounded-xl bg-fd-secondary px-5 py-3 text-sm"><Plug size={17} />连接 AI</Link>
          </div>
        </div>
        <section className="mt-20" aria-labelledby="skills-heading">
          <div className="mb-2 flex items-baseline justify-between gap-4"><h2 id="skills-heading" className="text-xl font-medium">从这些 Skill 开始</h2><Link href="/docs/skills" prefetch={false} className="text-sm text-fd-muted-foreground">查看全部</Link></div>
          <div className="divide-y divide-fd-border">
            {skills.map(page => <Link key={page.url} href={page.url} prefetch={false} className="group flex items-center justify-between gap-5 py-6"><div><h3 className="font-medium group-hover:underline underline-offset-4">{page.data.title}</h3><p className="mt-2 text-sm leading-6 text-fd-muted-foreground">{page.data.description}</p></div><ArrowUpRight className="shrink-0 text-fd-muted-foreground" size={18} /></Link>)}
          </div>
        </section>
        <div className="mt-14 rounded-2xl bg-fd-muted p-6"><h2 className="font-medium">同一份内容，随手读，也交给 AI 读。</h2><p className="mt-2 text-sm leading-7 text-fd-muted-foreground">每篇文章都支持复制与下载 Markdown。通过 MCP 连接后，AI 可以检索目录、按链接读取正文或批量读取多篇 Skill。</p><Link className="mt-4 inline-flex text-sm underline underline-offset-4" href="/docs/guides/mcp" prefetch={false}>查看接入方法</Link></div>
        <footer className="mt-16 flex flex-wrap gap-x-6 gap-y-3 text-sm text-fd-muted-foreground"><span>MySkills · 持续积累，反复使用</span><a href={site.repository}>GitHub</a><a href="/llms.txt">AI 文档索引</a></footer>
      </main>
    </HomeLayout>
  );
}
