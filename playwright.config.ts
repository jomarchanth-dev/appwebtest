import { defineConfig, devices } from '@playwright/test';

// Configuración de pruebas E2E de la webapp, dentro del mismo repositorio.
// Jenkins ejecuta: npm ci && npx playwright install chromium && npm test
const WEBAPP_URL = process.env.WEBAPP_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  reporter: [['list'], ['junit', { outputFile: 'test-results/junit.xml' }]],
  use: {
    baseURL: WEBAPP_URL,
    headless: process.env.HEADLESS !== 'false',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Levanta la app si no está corriendo. Si ya está en marcha, la reutiliza.
  webServer: {
    command: 'node server.js',
    cwd: '.',
    url: `${WEBAPP_URL}/health`,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
