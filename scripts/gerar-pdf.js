#!/usr/bin/env node
// Gera _site/catalogo-aligva.pdf a partir da página /catalogo-impressao/,
// usando o Chromium (Playwright) em modo headless. Rode depois do build.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { criarServidor } from './servidor.js';
import { carregarSite } from '../lib/site.js';

const PASTA = process.argv[2] || '_site';
const DESTINO = path.join(PASTA, 'catalogo-aligva.pdf');

if (!fs.existsSync(path.join(PASTA, 'catalogo-impressao', 'index.html'))) {
  console.error(`❌ Não encontrei ${PASTA}/catalogo-impressao/. Rode "npm run build" antes.`);
  process.exit(1);
}

const { site } = carregarSite();
const servidor = criarServidor(PASTA, site.pathPrefix);
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
const { port } = servidor.address();
const url = `http://127.0.0.1:${port}${site.pathPrefix}catalogo-impressao/`;

const navegador = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
try {
  const pagina = await navegador.newPage();
  await pagina.goto(url, { waitUntil: 'networkidle' });
  await pagina.emulateMedia({ media: 'print' });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.pdf({ path: DESTINO, format: 'A4', printBackground: true, preferCSSPageSize: true, tagged: true, outline: true });
  const tamanho = (fs.statSync(DESTINO).size / 1024).toFixed(0);
  console.log(`✅ PDF gerado: ${DESTINO} (${tamanho} KB)`);
} finally {
  await navegador.close();
  servidor.close();
}
