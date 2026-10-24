import { source } from '@/lib/source';
import { markdownPath, site } from '@/lib/site';
import { notFound } from 'next/navigation';
import defaultComponents, { createRelativeLink } from 'fumadocs-ui/mdx';
import { DocsPage, DocsBody, DocsTitle, DocsDescription, MarkdownCopyButton, ViewOptionsPopover } from 'fumadocs-ui/layouts/spacious/page';
import type { Metadata } from 'next';

type Props = { params: Promise<{ slug?: string[] }> };
export const dynamicParams = false;
export function generateStaticParams() {
  // Fumadocs supplies URI-encoded slugs. Next.js expects decoded params and
  // encodes them itself; passing encoded Chinese breaks client navigation.
  return source.generateParams().map(params => ({
    slug: params.slug?.map(segment => decodeURIComponent(segment)),
  }));
}
export default async function Page({ params }: Props) {
  const page = source.getPage((await params).slug);
  if (!page) notFound();
  const MDX = page.data.body;
  const md = markdownPath(page.url);
  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle className="docs-page-title font-medium">{page.data.title}</DocsTitle>
      <DocsDescription className="mb-1 font-normal">{page.data.description}</DocsDescription>
      <div id="docs-page-actions" className="flex flex-wrap items-center gap-2 pb-4 pt-2">
        <MarkdownCopyButton markdownUrl={md} className="docs-page-action" />
        <a className="docs-page-action inline-flex items-center rounded-lg px-3 py-2 text-sm" href={`/api/download?path=${encodeURIComponent(md)}`}>下载 Markdown</a>
        <ViewOptionsPopover markdownUrl={md} githubUrl={`${site.repository}/blob/main/content/docs/${page.path.split('/').map(encodeURIComponent).join('/')}`} className="docs-page-action" />
      </div>
      <DocsBody id="docs-body" className="pb-10 pt-4"><MDX components={{ ...defaultComponents, a: createRelativeLink(source, page) }} /></DocsBody>
    </DocsPage>
  );
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = source.getPage((await params).slug);
  if (!page) notFound();
  return { title: page.data.title, description: page.data.description, alternates: { canonical: page.url, types: { 'text/markdown': markdownPath(page.url) } } };
}
