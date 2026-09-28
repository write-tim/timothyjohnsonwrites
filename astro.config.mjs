// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Set this to your production URL (no trailing slash)
  site: 'https://timothyjohnsonwrites.com',
  integrations: [sitemap()],
});

