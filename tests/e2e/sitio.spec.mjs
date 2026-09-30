import { test, expect } from '@playwright/test';

const PAGINAS = ['/', '/abogados-santiago', '/abogados-cardenal-caro', '/litigacion-vi-region', '/pichilemu-penal'];
const esMovil = (testInfo) => testInfo.project.name === 'movil';

for (const ruta of PAGINAS) {
  test.describe(`página ${ruta}`, () => {
    test('carga sin errores, con un solo h1, imágenes y logos', async ({ page }) => {
      const errores = [];
      page.on('pageerror', (e) => errores.push(e.message));
      page.on('console', (m) => m.type() === 'error' && errores.push(m.text()));

      const res = await page.goto(ruta, { waitUntil: 'networkidle' });
      expect(res?.status()).toBe(200);
      await expect(page).toHaveTitle(/RP Abogados/);
      await expect(page.locator('h1')).toHaveCount(1);

      const rotas = await page.$$eval('img', (imgs) =>
        imgs.filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => i.getAttribute('src')),
      );
      expect(rotas, 'imágenes rotas').toEqual([]);

      await expect(page.locator('header a[href="/"] svg[aria-label]')).toBeVisible();
      await expect(page.locator('footer svg[aria-label]').first()).toBeVisible();
      expect(errores, 'errores de consola').toEqual([]);
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
