# RP Abogados · rpabogados.cl

Sitio del estudio jurídico RP Abogados: Astro 5 + Tailwind, publicado en Cloudflare Pages.
Las páginas son estáticas (servidas desde la caché de Cloudflare); solo `/api/contacto` corre en el servidor.

## Cómo se trabaja

1. **Nunca editar `main` directo** (ni desde el editor web de GitHub): todo cambio va en una rama y un Pull Request.
2. Cada rama genera un **preview** automático en Cloudflare (`<rama>.rpabogados.pages.dev`), que se revisa en el navegador.
3. El PR corre las pruebas (workflow **Pruebas**). Con el preview aprobado y las pruebas en verde, se hace merge.
4. El merge a `main` publica en **rpabogados.cl**.

## Dónde se cambia cada cosa

| Qué | Dónde |
| --- | --- |
| Datos del estudio (dirección, teléfono, correos, socios, horario, áreas) | `src/lib/sitio.ts` — una sola fuente para footer, Google y privacidad |
| Destinatario del formulario por área | `src/lib/contacto.ts` (`AREAS`, `COPIA_SIEMPRE`) |
| Textos de la portada, áreas, socios y Actualidad | `src/pages/index.astro` |
| Páginas locales (Santiago, VI Región, Cardenal Caro, Pichilemu) | `src/pages/*.astro` |
| Política de privacidad | `src/pages/privacidad.astro` |
| Logos | `src/assets/logos/*.svg` (se insertan con `src/components/Logo.astro`) |
| Colores y tipografías | `tailwind.config.mjs` (`oro`, `oro-oscuro`, `tinta`, `font-cormorant`) |
| Cabeceras de seguridad y caché | `public/_headers` |

**Colores:** `oro` (#C5A880) solo sobre fondos oscuros; sobre blanco o gris claro usar `oro-oscuro` (#7A5C2E) para cumplir el contraste WCAG AA.
**Imágenes:** en `public/fotos/`, en formato WebP y al ancho en que se muestran.

## Formulario de contacto

`/api/contacto` valida los datos, filtra spam y envía el correo con [Resend](https://resend.com). Requiere en Cloudflare Pages → Settings → Variables:

- `RESEND_API_KEY` (secreta): clave de Resend, con el dominio `rpabogados.cl` verificado.
- `CONTACTO_REMITENTE` (opcional): por defecto `Sitio web RP Abogados <formulario@rpabogados.cl>`.

Sin la clave, el formulario avisa que el envío en línea no está habilitado y ofrece correo y WhatsApp.

## Comandos

```bash
pnpm install        # dependencias (pnpm 9, ver packageManager)
pnpm dev            # servidor local en http://localhost:4321
pnpm build          # build de producción en dist/
pnpm test           # pruebas unitarias del formulario
BASE_URL=https://<rama>.rpabogados.pages.dev pnpm test:e2e   # pruebas de navegador contra un preview
```

`E2E_FORMULARIO=1` agrega un envío real del formulario (si el sitio tiene `RESEND_API_KEY`, llega un correo).
