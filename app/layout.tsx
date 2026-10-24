import './global.css';
import './flat-ui.css';
import { Providers } from '@/components/providers';
import { site } from '@/lib/site';
import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';

export const metadata: Metadata = {
  metadataBase: new URL(site.origin),
  icons: { icon: '/favicon.svg' },
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { title: site.name, description: site.description, locale: 'zh_CN', type: 'website' },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" style={{ '--font-inter': "'Inter', 'Arial'", '--font-source-serif': "'Source Serif 4', Georgia" } as CSSProperties} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans"><Providers>{children}</Providers></body>
    </html>
  );
}
