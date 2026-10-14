// Testes sobre o site já gerado em _site/.
// Garantem que nada interno (coluna "referencia") nem "PREENCHER" seja publicado.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { lerCsv } from '../../lib/csv.js';
import { PALAVRAS_PROIBIDAS, encontrarTermos } from '../../lib/produtos.js';

const PASTA = process.env.PASTA_SITE || '_site';
const EXTENSOES_TEXTO = ['.html', '.json', '.xml', '.txt', '.webmanifest', '.js', '.css', '.svg', '.md'];

function listar(pasta) {
  return fs.readdirSync(pasta, { withFileTypes: true }).flatMap((e) => {
    const completo = path.join(pasta, e.name);
    return e.isDirectory() ? listar(completo) : [completo];
  });
}

let arquivos = [];
before(() => {
  if (!fs.existsSync(path.join(PASTA, 'index.html'))) {
    console.log('Gerando o site para os testes (npm run build)...');
    execSync('npx @11ty/eleventy --quiet', { stdio: 'inherit' });
  }
  arquivos = listar(PASTA)
    .filter((a) => EXTENSOES_TEXTO.includes(path.extname(a).toLowerCase()))
    .map((a) => ({ arquivo: a, conteudo: fs.readFileSync(a, 'utf8') }));
});

test('o site gerado tem páginas', () => {
  assert.ok(arquivos.some((a) => a.arquivo.endsWith('index.html')));
});

test('nenhum valor da coluna "referencia" aparece no site', () => {
  const { linhas } = lerCsv(fs.readFileSync('src/_data/produtos.csv'));
  const referencias = linhas.map((l) => String(l.referencia || '').trim()).filter((r) => r.length >= 3);
  for (const { arquivo, conteudo } of arquivos) {
    for (const ref of referencias) {
      assert.ok(!conteudo.includes(ref), `"${ref}" (coluna referencia) apareceu em ${arquivo}`);
    }
  }
});

test('o campo "referencia" não existe em nenhum arquivo (HTML, JSON, metadados, sitemap)', () => {
  for (const { arquivo, conteudo } of arquivos) {
    assert.ok(!/referencia/i.test(conteudo), `a palavra "referencia" apareceu em ${arquivo}`);
  }
  const json = JSON.parse(fs.readFileSync(path.join(PASTA, 'produtos.json'), 'utf8'));
  for (const p of json.produtos) assert.ok(!('referencia' in p));
});

test('nenhum "PREENCHER" aparece no site', () => {
  for (const { arquivo, conteudo } of arquivos) {
    assert.ok(!conteudo.includes('PREENCHER'), `PREENCHER apareceu em ${arquivo}`);
  }
});

test('nenhum termo proibido aparece no texto das páginas', () => {
  for (const { arquivo, conteudo } of arquivos.filter((a) => a.arquivo.endsWith('.html'))) {
    const texto = conteudo.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ');
    assert.deepEqual(encontrarTermos(texto, PALAVRAS_PROIBIDAS), [], `termo proibido em ${arquivo}`);
  }
});

test('a concentração aparece sempre como "quase 30%"', () => {
  for (const { arquivo, conteudo } of arquivos.filter((a) => a.arquivo.endsWith('.html'))) {
    const ocorrencias = conteudo.match(/.{0,8}30\s?%/g) || [];
    for (const o of ocorrencias) assert.match(o, /quase 30\s?%/i, `"${o}" em ${arquivo}`);
  }
});

test('nenhum script de rastreamento por padrão', () => {
  for (const { arquivo, conteudo } of arquivos.filter((a) => a.arquivo.endsWith('.html'))) {
    assert.ok(!/goatcounter|plausible\.io|googletagmanager|google-analytics|facebook\.net/.test(conteudo), arquivo);
  }
});
