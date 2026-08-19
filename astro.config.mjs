import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://mindstack.example',
  adapter: vercel(),
  integrations: [react(), mdx(), sitemap()],
  build: { inlineStylesheets: 'auto' },
  vite: {
    build: { cssCodeSplit: false },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    },
  },
});
