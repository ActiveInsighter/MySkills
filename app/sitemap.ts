import { source } from '@/lib/source';
import { site } from '@/lib/site';
export const dynamic = 'force-static';
export default function sitemap() { return [{ url: site.origin }, ...source.getPages().map(page => ({ url: new URL(page.url, site.origin).href }))]; }
