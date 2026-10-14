// Teste de fumaça (Playwright): abre o site no celular e no computador e
// confere o caminho principal de compra. Rode com: npm run teste-fumaca
import { defineConfig, devices } from '@playwright/test';

const PORTA = 4173;
const executavel = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORTA}/`,
    trace: 'retain-on-failure',
    launchOptions: executavel,
  },
  projects: [
    { name: 'celular', use: { ...devices['Pixel 7'], launchOptions: executavel } },
    { name: 'computador', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 }, launchOptions: executavel } },
  ],
  // Gera uma cópia do site com um número de WhatsApp de teste (não é o número real).
  webServer: {
    command: `npx @11ty/eleventy --quiet --output=_site-teste && node scripts/servidor.js _site-teste ${PORTA} /`,
    url: `http://127.0.0.1:${PORTA}/`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { SITE_WHATSAPP: '5500000000000', PATH_PREFIX: '/', SITE_URL: 'http://127.0.0.1:4173' },
  },
});
