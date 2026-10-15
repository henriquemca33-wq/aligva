// Teste de fumaça: o caminho principal de quem compra pelo catálogo.
import { test, expect } from '@playwright/test';

const NUMERO_TESTE = '5500000000000';

test('home abre com abertura e destaques', async ({ page }) => {
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto('./');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.card').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Falar no WhatsApp/ }).first()).toHaveAttribute('href', new RegExp(`wa\\.me/${NUMERO_TESTE}`));
  expect(erros).toEqual([]);
});

test('catálogo: filtrar por gênero e buscar por nota', async ({ page, isMobile }) => {
  await page.goto('catalogo/');
  if (isMobile) await page.getByRole('button', { name: 'Filtrar e ordenar' }).click();
  await page.getByLabel('Gênero').selectOption('feminino');
  await expect(page).toHaveURL(/genero=feminino/);
  const visiveis = page.locator('[data-grade] .card:visible');
  await expect(visiveis.first()).toBeVisible();
  for (const genero of await visiveis.evaluateAll((els) => els.map((e) => e.dataset.genero))) {
    expect(genero).toBe('feminino');
  }
  await expect(page.locator('[data-contagem]')).toContainText(/perfume/);

  await page.getByLabel('Gênero').selectOption('');
  await page.getByLabel('Buscar por nome ou nota').fill('BAUNILHA');
  await expect(page).toHaveURL(/q=BAUNILHA/);
  await expect(page.locator('[data-grade] .card:visible', { hasText: 'Circe' })).toBeVisible();
  for (const notas of await page.locator('[data-grade] .card:visible').evaluateAll((els) => els.map((e) => e.dataset.busca))) {
    expect(notas).toContain('baunilha');
  }

  await page.getByLabel('Buscar por nome ou nota').fill('nota-que-nao-existe');
  await expect(page.getByText('Nenhum perfume encontrado').first()).toBeVisible();
  await page.locator('[data-vazio] [data-limpar]').click();
  await expect(page.locator('[data-agrupado]')).toBeVisible();
});

test('link compartilhável do catálogo com ?nota= funciona', async ({ page }) => {
  await page.goto('catalogo/?nota=gardenia');
  const cards = page.locator('[data-grade] .card:visible');
  await expect(cards.first()).toBeVisible();
  for (const notas of await cards.evaluateAll((els) => els.map((e) => e.dataset.notas))) expect(notas).toContain('gardenia');
  await expect(page.locator('[data-filtro-nota]')).toContainText('gardenia');
});

test('produto: adicionar à sacola e gerar o link do WhatsApp', async ({ page }) => {
  await page.goto('catalogo/');
  await page.getByRole('link', { name: 'Circe' }).first().click();
  await expect(page).toHaveURL(/perfume\/circe\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Circe');
  await expect(page.getByText('Extrato · quase 30% de fragrância')).toBeVisible();
  await expect(page.locator('.piramide')).toContainText('flor de maracujá');

  await page.locator('#tamanho-100').check();
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click();
  await page.getByRole('button', { name: /Adicionar à sacola/ }).click();

  const sacola = page.getByRole('dialog', { name: 'Sua sacola' });
  await expect(sacola).toBeVisible();
  await expect(sacola).toContainText('Circe');
  await expect(sacola).toContainText('100 mL');
  await sacola.getByLabel('Observações (opcional)').fill('Teste automático');

  const href = await sacola.getByRole('link', { name: /Enviar pedido pelo WhatsApp/ }).getAttribute('href');
  expect(href).toMatch(new RegExp(`^https://wa\\.me/${NUMERO_TESTE}\\?text=`));
  const texto = decodeURIComponent(href.split('text=')[1]);
  expect(texto).toContain('Olá, Aligva! Gostaria de fazer um pedido:');
  expect(texto).toContain('• Circe — 100 mL × 2');
  expect(texto).toContain('Observações: Teste automático');

  // Esc fecha a gaveta e o contador continua no cabeçalho.
  await page.keyboard.press('Escape');
  await expect(sacola).toBeHidden();
  await expect(page.locator('[data-contador]')).toHaveText('2');

  // A sacola continua lá depois de recarregar a página.
  await page.reload();
  await expect(page.locator('[data-contador]')).toHaveText('2');
});

test('página 404 e impressão abrem', async ({ page }) => {
  await page.goto('pagina-que-nao-existe/');
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
  await page.goto('catalogo-impressao/');
  await expect(page.getByRole('heading', { name: 'Catálogo de perfumes' })).toBeVisible();
});
