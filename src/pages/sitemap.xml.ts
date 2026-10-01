import type { APIRoute } from 'astro';
import { PAGINAS, urlCanonica } from '../lib/sitio';

// Se genera en cada build: la fecha de modificación queda siempre al día sin editarla a mano.
export const GET: APIRoute = () => {
  const hoy = new Date().toISOString().slice(0, 10);
  const urls = PAGINAS.map(
    (p) =>
      `  <url>\n    <loc>${urlCanonica(p.ruta)}</loc>\n    <lastmod>${hoy}</lastmod>\n    <changefreq>${p.frecuencia}</changefreq>\n    <priority>${p.prioridad.toFixed(1)}</priority>\n  </url>`,
  ).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};

export const prerender = true;
