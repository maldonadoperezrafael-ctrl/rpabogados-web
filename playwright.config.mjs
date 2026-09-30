import { defineConfig, devices } from '@playwright/test';

// Uso: BASE_URL=https://<preview>.rpabogados.pages.dev pnpm test:e2e
// E2E_FORMULARIO=1 además envía una consulta válida (si el sitio tiene RESEND_API_KEY, llega un correo real).
if (!process.env.BASE_URL) throw new Error('Defina BASE_URL (ej: http://127.0.0.1:4321 o la URL del preview).');

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  retries: 1,
  reporter: [['list']],
  use: { baseURL: process.env.BASE_URL, trace: 'retain-on-failure' },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'movil', use: { ...devices['Pixel 7'] } },
  ],
});
