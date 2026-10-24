'use client';
import { RootProvider } from 'fumadocs-ui/provider/next';
import type { ReactNode } from 'react';
import { IntentLink } from './intent-link';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      components={{ Link: IntentLink }}
      i18n={{ locale: 'cn', translations: { search: '搜索 Skill', searchNoResult: '没有找到相关内容', toc: '本页目录', tocNoHeadings: '本页没有标题', lastUpdate: '最后更新', chooseLanguage: '选择语言', nextPage: '下一页', previousPage: '上一页', chooseTheme: '切换主题' } }}
      search={{ options: { type: 'static', api: '/api/search' } }}
    >{children}</RootProvider>
  );
}
