'use client';
import { RootProvider } from 'fumadocs-ui/provider/next';
import type { ReactNode } from 'react';
import { IntentLink } from './intent-link';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      components={{ Link: IntentLink }}
      i18n={{ locale: 'zh-CN', translations: {
        'Search(search trigger)': '搜索 Skill',
        'Search(search dialog)': '搜索 Skill',
        'No results found(search dialog)': '没有找到相关内容',
        'Search failed(search dialog)': '搜索失败，请重试',
        'Close Search(search dialog)(aria-label)': '关闭搜索',
        'On this page(table of contents)': '本页目录',
        'No Headings(table of contents)': '本页没有标题',
        'Copy Markdown(page actions)': '复制 Markdown',
        'Copied Markdown(page actions)': '已复制 Markdown',
        'Open(page actions)': '打开',
        'View as Markdown(page actions)': '查看 Markdown',
        'Open in GitHub(page actions)': '在 GitHub 中打开',
        'Previous Page(pagination)': '上一页',
        'Next Page(pagination)': '下一页',
        'Toggle Theme(theme switcher)(aria-label)': '切换主题',
        'Light(theme switcher)(aria-label)': '浅色',
        'Dark(theme switcher)(aria-label)': '深色',
        'System(theme switcher)(aria-label)': '跟随系统',
        'Options(aria-label)': '选项',
        'Open Sidebar(sidebar)(aria-label)': '打开侧边栏',
        'Close Sidebar(sidebar)(aria-label)': '关闭侧边栏',
        'Collapse Sidebar(sidebar)(aria-label)': '折叠侧边栏',
        'Theme(site menu)': '主题',
      } }}
      search={{ options: { type: 'static', api: '/api/search' } }}
    >{children}</RootProvider>
  );
}
