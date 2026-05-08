import { defineConfig } from 'astro/config';

// Site is served at https://wearefounders.uk/tools/* via a Cloudflare
// Worker proxy. The `base` setting ensures all internal links and asset
// paths are prefixed correctly. When deploying to Cloudflare Pages directly
// for testing, the project will live at [project].pages.dev/tools/.
export default defineConfig({
  site: 'https://wearefounders.uk',
  base: '/tools',
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory',
  },
});
