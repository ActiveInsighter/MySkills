import './docs-typography.css';
import { DocsLayout } from 'fumadocs-ui/layouts/spacious';
import { source } from '@/lib/source';
import { site } from '@/lib/site';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout tree={source.getPageTree()} nav={{ title: site.name, url: '/' }} githubUrl={site.repository}
      links={[{ text: 'Skills', url: '/docs/skills' }, { text: 'AI 按需读取', url: '/docs/ai' }]}
      sidebar={{ defaultOpenLevel: 1 }}>
      {children}
    </DocsLayout>
  );
}
