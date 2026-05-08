import { defineConfig } from 'astro/config';

// Site is served at https://directory.wearefounders.uk/* — a custom subdomain
// attached to Cloudflare Pages. No subdirectory prefix, so files live at the
// site root. When deploying to Pages directly the project also serves cleanly
// at [project].pages.dev/.
export default defineConfig({
  site: 'https://directory.wearefounders.uk',
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory',
  },
});
