import { test, expect } from '@playwright/test';

const PAGINAS = ['/', '/abogados-santiago', '/abogados-cardenal-caro', '/litigacion-vi-region', '/pichilemu-penal', '/privacidad'];
const DOMINIO = 'https://rpabogados.cl';
const esMovil = (testInfo) => testInfo.project.name === 'movil';

for (const ruta of PAGINAS) {
  test.describe(`página ${ruta}`, () => {
    test('carga sin errores, con un solo h1, imágenes y logos', async ({ page, request }) => {
      const errores = [];
      page.on('pageerror', (e) => errores.push(e.message));
      page.on('console', (m) => m.type() === 'error' && errores.push(m.text()));

      const res = await page.goto(ruta, { waitUntil: 'networkidle' });
      expect(res?.status()).toBe(200);
      await expect(page).toHaveTitle(/RP Abogados/);
      await expect(page.locator('h1')).toHaveCount(1);

      // Se descarga cada imagen: las de carga diferida fuera de pantalla todavía no las pidió el navegador.
      const rotas = [];
      for (const src of await page.$$eval('img', (imgs) => imgs.map((i) => i.getAttribute('src')))) {
        const r = await request.get(src);
        if (r.status() !== 200 || !(r.headers()['content-type'] ?? '').startsWith('image/')) rotas.push(src);
      }
      expect(rotas, 'imágenes rotas').toEqual([]);
      const noWebp = await page.$$eval('img', (imgs) => imgs.map((i) => i.getAttribute('src')).filter((s) => !/\.webp$/.test(s ?? '')));
      expect(noWebp, 'imágenes que no son WebP').toEqual([]);

      await expect(page.locator('header a[href="/"] svg[aria-label]')).toBeVisible();
      await expect(page.locator('footer svg[aria-label]').first()).toBeVisible();
      expect(errores, 'errores de consola').toEqual([]);
    });

    test('el footer está centrado', async ({ page }) => {
      await page.goto(ruta);
      const footer = page.locator('footer').last();
      await footer.scrollIntoViewIfNeeded();
      const ancho = page.viewportSize().width;
      const logo = await footer.locator('svg[aria-label]').first().boundingBox();
      expect(Math.abs(logo.x + logo.width / 2 - ancho / 2), 'logo fuera del centro (px)').toBeLessThan(8);
      const alineaciones = await footer.locator('h2, p').evaluateAll((els) => [...new Set(els.map((e) => getComputedStyle(e).textAlign))]);
      expect(alineaciones).toEqual(['center']);
      await expect(footer.locator('a[href="/privacidad"]')).toBeVisible();
    });

    test('SEO: canonical propio, datos estructurados e imagen para redes', async ({ page, request }) => {
      await page.goto(ruta);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', DOMINIO + ruta);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', DOMINIO + ruta);
      const ld = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
      expect(ld['@type']).toBe('LegalService');
      expect(ld.address.addressLocality).toBe('Providencia');
      for (const recurso of ['/og-rpabogados.png', '/favicon.svg', '/apple-touch-icon.png']) {
        expect((await request.get(recurso)).status(), recurso).toBe(200);
      }
    });

    test('los enlaces internos llevan a destinos que existen', async ({ page, request }) => {
      await page.goto(ruta);
      const hrefs = await page.$$eval('a[href^="/"], a[href^="#"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')))]);
      const idsHome = await (await request.get('/')).text();
      for (const href of hrefs) {
        const [camino, ancla] = href.split('#');
        if (camino) {
          const r = await request.get(camino);
          expect(r.status(), `${href} en ${ruta}`).toBe(200);
        }
        if (ancla) {
          const html = camino && camino !== '/' ? await (await request.get(camino)).text() : camino === '/' ? idsHome : await page.content();
          expect(html, `ancla #${ancla} de ${href} en ${ruta}`).toContain(`id="${ancla}"`);
        }
      }
    });
  });
}

test('navbar: enlaces dorados en reposo y más claros con resplandor al pasar el mouse', async ({ page }, testInfo) => {
  test.skip(esMovil(testInfo), 'en móvil el menú es desplegable');
  await page.goto('/');
  const enlace = page.locator('nav[aria-label="Navegación principal"] a', { hasText: 'Áreas' });
  await expect(enlace).toHaveCSS('color', 'rgb(197, 168, 128)');
  await enlace.hover();
  await expect(enlace).toHaveCSS('color', 'rgb(230, 204, 159)');
  await expect(enlace).not.toHaveCSS('text-shadow', 'none');
});

test('menú móvil abre, navega y se cierra', async ({ page }, testInfo) => {
  test.skip(!esMovil(testInfo), 'solo móvil');
  await page.goto('/');
  const boton = page.getByRole('button', { name: 'Abrir menú' });
  await boton.click();
  await expect(page.locator('#menu-movil')).toHaveClass(/active/);
  await expect(page.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#menu-movil a', { hasText: 'Socios' }).click();
  await expect(page.locator('#menu-movil')).not.toHaveClass(/active/);
  await expect(page).toHaveURL(/#equipo$/);
});

test('portada: título en Cormorant Garamond, descripción sans serif y sin botón CONFIDENCIAL', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#inicio h1')).toHaveCSS('font-family', /Cormorant Garamond/);
  await expect(page.locator('#inicio p')).toHaveCSS('font-family', /Raleway/);
  await expect(page.getByRole('link', { name: 'CONFIDENCIAL', exact: true })).toHaveCount(0);
});

test('Actualidad muestra 3 notas con enlace a su fuente', async ({ page }) => {
  await page.goto('/');
  const notas = page.locator('#actualidad article');
  await expect(notas).toHaveCount(3);
  for (const nota of await notas.all()) {
    await expect(nota.locator('h3 a[href^="https://"]')).toHaveCount(1);
  }
});

test('sitemap y robots listan todas las páginas públicas', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const ruta of PAGINAS) expect(sitemap, ruta).toContain(`<loc>${DOMINIO}${ruta}</loc>`);
  expect(sitemap).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain(`Sitemap: ${DOMINIO}/sitemap.xml`);
  expect(robots).not.toMatch(/Disallow: \/(areas|equipo|contacto)/);
});

test('el mapa de Google carga solo cuando se pide', async ({ page }) => {
  await page.goto('/#contacto');
  const mapa = page.locator('.mapa-google');
  await expect(mapa.locator('iframe')).toHaveCount(0);
  await mapa.getByRole('button', { name: 'Ver mapa' }).click();
  await expect(mapa.locator('iframe')).toHaveAttribute('src', /google\.com\/maps\/embed/);
});

test('cabeceras de seguridad en el sitio desplegado', async ({ request, baseURL }) => {
  test.skip(!baseURL?.startsWith('https://'), 'las cabeceras las pone Cloudflare, no el servidor local');
  const h = (await request.get('/')).headers();
  expect(h['content-security-policy']).toContain("script-src 'self'");
  expect(h['strict-transport-security']).toContain('max-age=');
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
});

test.describe('formulario de contacto', () => {
  const ENVIO_JSON = { headers: { Accept: 'application/json' } };
  const valido = () => ({
    nombre: 'Prueba Automática',
    email: 'prueba@ejemplo.cl',
    telefono: '+56 9 1234 5678',
    area: 'civil',
    mensaje: 'Consulta de prueba automática del sitio web.',
    consentimiento: 'si',
    t: String(Date.now() - 10_000),
  });

  test('la API rechaza datos inválidos con errores por campo', async ({ request }) => {
    const r = await request.post('/api/contacto', { ...ENVIO_JSON, form: { ...valido(), email: 'malo', consentimiento: '' } });
    expect(r.status()).toBe(422);
    const data = await r.json();
    expect(data.estado).toBe('error');
    expect(Object.keys(data.errores).sort()).toEqual(['consentimiento', 'email']);
  });

  test('la API descarta bots sin enviar correo', async ({ request }) => {
    const r = await request.post('/api/contacto', { ...ENVIO_JSON, form: { ...valido(), sitio_web: 'http://spam.example' } });
    expect(r.status()).toBe(200);
    expect((await r.json()).estado).toBe('ok');
  });

  test('sin JavaScript el servidor redirige de vuelta al formulario', async ({ request }) => {
    const r = await request.post('/api/contacto', { form: { ...valido(), email: 'malo' }, maxRedirects: 0 });
    expect(r.status()).toBe(303);
    expect(r.headers()['location']).toBe('/?contacto=error#contacto');
  });

  test('en pantalla muestra los errores del servidor junto a cada campo', async ({ page }) => {
    await page.goto('/#contacto');
    await page.fill('#nombre', 'Prueba Automática');
    await page.fill('#email', 'prueba@ejemplo.cl');
    await page.selectOption('#area', 'civil');
    await page.fill('#mensaje', 'Consulta de prueba automática del sitio web.');
    // Sin marcar el consentimiento el navegador bloquea el envío: se quita "required" para probar la validación del servidor.
    await page.$eval('input[name="consentimiento"]', (el) => el.removeAttribute('required'));
    await page.waitForTimeout(3_500);
    await page.click('#form-contacto button[type="submit"]');
    await expect(page.locator('#error-consentimiento')).toBeVisible();
    await expect(page.locator('input[name="consentimiento"]')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#estado-contacto')).toContainText('No pudimos enviar');
  });

  test('envío válido de punta a punta', async ({ page }) => {
    test.skip(!process.env.E2E_FORMULARIO, 'defina E2E_FORMULARIO=1 (puede enviar un correo real)');
    await page.goto('/#contacto');
    await page.fill('#nombre', 'Prueba Automática');
    await page.fill('#email', 'prueba@ejemplo.cl');
    await page.selectOption('#area', 'civil');
    await page.fill('#mensaje', 'Consulta de prueba automática del sitio web.');
    await page.check('input[name="consentimiento"]');
    await page.waitForTimeout(3_500);
    await page.click('#form-contacto button[type="submit"]');
    await expect(page.locator('#estado-contacto')).toContainText(/Recibimos su consulta|aún no está habilitado/);
  });
});
