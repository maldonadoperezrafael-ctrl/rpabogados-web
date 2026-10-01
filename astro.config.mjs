import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

// Páginas estáticas (servidas desde la caché de Cloudflare); solo /api/contacto corre en el servidor.
export default defineConfig({
  output: 'static',
  adapter: cloudflare({ imageService: 'passthrough' }),
  integrations: [tailwind()],
  site: 'https://rpabogados.cl',
  // /abogados-santiago y no /abogados-santiago/: así están indexadas y así las lista el sitemap.
  build: { format: 'file' },
  trailingSlash: 'never',
  devToolbar: { enabled: process.env.CI !== 'true' },
  // Scripts siempre como archivo: la CSP (public/_headers) solo permite scripts de 'self', no en línea.
  vite: { build: { assetsInlineLimit: 0 } },
});
