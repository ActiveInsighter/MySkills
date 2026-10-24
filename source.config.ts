import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins/rehype-code';

export const docs = defineDocs({ dir: 'content/docs' });
export default defineConfig({
  mdxOptions: {
    remarkImageOptions: { external: false },
    rehypeCodeOptions: { ...rehypeCodeDefaultOptions, fallbackLanguage: 'text' },
  },
});
