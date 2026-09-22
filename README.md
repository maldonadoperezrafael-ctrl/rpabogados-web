# RP Abogados - Astro + Cloudflare Pages

Sitio web estilo "boutique law firm premium" inspirado en colombara.cl.

## Stack

- **Astro 4** - Framework estático
- **Tailwind CSS** - Estilos utility-first
- **Cloudflare Pages** - Hosting y deploy
- **AOS** - Animaciones on scroll
- **Raleway** - Tipografía (Google Fonts)

## Paleta de Colores

| Color | Hex | Uso |
|-------|-----|-----|
| Primary | `#212529` | Textos, fondos oscuros |
| Accent | `#FC5D23` | Botones, hover, acentos |
| BG Light | `#F8F8F8` | Fondos alternados |
| Text Light | `#6c757d` | Texto secundario |

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

## Deploy en Cloudflare Pages

### Opción 1: Dashboard (recomendada)

1. Subir este código a un repositorio GitHub
2. Ir a [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
3. Click "Create a project" → "Connect to Git"
4. Seleccionar el repositorio
5. Configurar build:
   - **Framework preset**: Astro
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. Click "Save and Deploy"

### Opción 2: Wrangler CLI

```bash
# Instalar Wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy
wrangler pages deploy dist
```

### Configurar Dominio Personalizado

1. En Cloudflare Pages → Tu proyecto → Custom domains
2. Agregar `rpabogados.cl`
3. Cloudflare configurará automáticamente el DNS

## Estructura

```
src/
├── components/      # Header, Footer reutilizables
├── layouts/         # Layout base con estilos globales
├── pages/           # Páginas (index.astro)
└── styles/          # Estilos adicionales si se necesitan
public/
└── assets/          # Imágenes, favicon, fuentes locales
```

## Características del Diseño (estilo Colombara)

- ✅ Header fullscreen con menú hamburguesa
- ✅ Tipografía Raleway (todos los pesos)
- ✅ Animaciones fade suaves al hacer scroll
- ✅ Paleta: gris oscuro #212529 + naranja #FC5D23
- ✅ Espaciado generoso entre secciones
- ✅ Botones estilo editorial (sin bordes redondeados)
- ✅ Tarjetas con hover elevation
- ✅ Secciones alternando fondos blanco/gris

## Editar Contenido

Todo el contenido está en `src/pages/index.astro`. Es HTML estándar con clases Tailwind.

Para agregar nuevas páginas, crear archivos `.astro` en `src/pages/`.

---

**Nota**: Este proyecto reemplaza completamente el HTML estático anterior con una base moderna, manteniendo 100% del contenido original.
