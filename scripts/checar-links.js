#!/usr/bin/env node
// Verifica links internos quebrados no site gerado (_site/): href, src e srcset.
// Uso: npm run checar-links  (ou: node scripts/checar-links.js pasta)
import fs from 'node:fs';
import path from 'node:path';
import { carregarSite } from '../lib/site.js';

const PASTA = path.resolve(process.argv[2] || '_site');
const { site } = carregarSite();
const prefixo = site.pathPrefix;
// O PDF só existe depois do "npm run gerar-pdf"; sem ele, é apenas um aviso.
const OPCIONAIS = ['catalogo-aligva.pdf'];

function listar(pasta) {
  return fs.readdirSync(pasta, { withFileTypes: true }).flatMap((e) => {
    const completo = path.join(pasta, e.name);
    return e.isDirectory() ? listar(completo) : [completo];
  });
}

const paginas = listar(PASTA).filter((a) => a.endsWith('.html'));
const idsPorArquivo = new Map();
const lerIds = (arquivo) => {
  if (!idsPorArquivo.has(arquivo)) {
    const html = fs.readFileSync(arquivo, 'utf8');
    idsPorArquivo.set(arquivo, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idsPorArquivo.get(arquivo);
};

function resolver(url, paginaAtual) {
  const [semHash, hash] = url.split('#');
  const caminho = semHash.split('?')[0];
  let alvo;
  if (caminho === '') alvo = paginaAtual;
  else if (caminho.startsWith('/')) {
    if (!caminho.startsWith(prefixo) && `${caminho}/` !== prefixo) return { erro: `fora do prefixo ${prefixo}` };
    alvo = path.join(PASTA, decodeURIComponent(caminho.slice(prefixo.length)));
  } else {
    alvo = path.resolve(path.dirname(paginaAtual), decodeURIComponent(caminho));
  }
  if (fs.existsSync(alvo) && fs.statSync(alvo).isDirectory()) alvo = path.join(alvo, 'index.html');
  if (!fs.existsSync(alvo)) return { erro: 'arquivo não existe', opcional: OPCIONAIS.some((o) => alvo.endsWith(o)) };
  if (hash && alvo.endsWith('.html') && !lerIds(alvo).has(decodeURIComponent(hash))) return { erro: `âncora #${hash} não existe` };
  return {};
}

let erros = 0;
let avisos = 0;
const avisados = new Set();
let verificados = 0;
for (const pagina of paginas) {
  const html = fs.readFileSync(pagina, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
  const urls = new Set();
  for (const m of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) urls.add(m[1]);
  // URLs absolutas do próprio site (og:image, canonical...) também são conferidas.
  for (const m of html.matchAll(/\s(?:href|content)="([^"]*)"/g)) {
    if (m[1].startsWith(`${site.urlBase}/`)) urls.add(m[1].slice(site.origem.length));
  }
  for (const m of html.matchAll(/\ssrcset="([^"]*)"/g)) for (const parte of m[1].split(',')) urls.add(parte.trim().split(/\s+/)[0]);
  for (const url of urls) {
    if (!url || /^(https?:|mailto:|tel:|data:|javascript:)/i.test(url) || url.startsWith('//')) continue;
    verificados++;
    const r = resolver(url, pagina);
    if (!r.erro) continue;
    const relativo = path.relative(PASTA, pagina);
    if (r.opcional) { if (avisados.has(url)) continue; avisados.add(url); avisos++; console.warn(`⚠️  ${relativo}: ${url} (${r.erro} — rode "npm run gerar-pdf")`); }
    else { erros++; console.error(`❌ ${relativo}: link quebrado ${url} (${r.erro})`); }
  }
}

console.log(`\n${paginas.length} páginas, ${verificados} links internos verificados, ${erros} quebrados, ${avisos} avisos.`);
if (erros) process.exit(1);
