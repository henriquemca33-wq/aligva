import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { lerCsv } from '../../lib/csv.js';
import { prepararProdutos, lerPreco } from '../../lib/produtos.js';
import { limparPreencher } from '../../lib/site.js';

const pastaProdutos = fs.mkdtempSync(path.join(os.tmpdir(), 'aligva-'));
const CAB = 'slug;nome;linha;genero;familia;notas_saida;notas_coracao;notas_fundo;preco_50;preco_100;disponivel;referencia;exemplo;publicar';
const preparar = (linhas, opcoes = {}) => prepararProdutos(lerCsv(`${CAB}\n${linhas.join('\n')}\n`), { pastaProdutos, ...opcoes });

test('produto válido é publicado sem a coluna referencia', () => {
  const r = preparar(['circe;Circe;linha-aligva;feminino;floral;flor de maracujá;gardênia;baunilha;119;159;sim;R-001;;sim']);
  assert.deepEqual(r.erros, []);
  assert.equal(r.produtos.length, 1);
  assert.equal(r.produtos[0].precoMin, 119);
  assert.ok(!('referencia' in r.produtos[0]));
  assert.ok(!JSON.stringify(r.produtos).includes('R-001'));
});

test('valores inválidos geram erro com linha e coluna', () => {
  const r = preparar(['circe;Circe;linha-aligva;unissex;;;;;;;sim;;;sim']);
  assert.match(r.erros[0], /Linha 2, coluna "genero"/);
});

test('slugs repetidos geram erro', () => {
  const r = preparar(['a;A;encomenda;feminino;;;;;;;sim;;;sim', 'a;B;encomenda;feminino;;;;;;;sim;;;sim']);
  assert.match(r.erros[0], /Linha 3, coluna "slug".*repete/);
});

test('slug vazio é gerado a partir do nome, com aviso', () => {
  const r = preparar([';Flor de Âmbar;encomenda;feminino;;;;;;;sim;;;sim']);
  assert.equal(r.produtos[0].slug, 'flor-de-ambar');
  assert.ok(r.avisos.some((a) => a.includes('flor-de-ambar')));
});

test('preço que não termina em 9 gera aviso (não erro)', () => {
  const r = preparar(['a;A;encomenda;feminino;;;;;120;;sim;;;sim']);
  assert.equal(r.erros.length, 0);
  assert.ok(r.avisos.some((a) => a.includes('não termina em 9')));
});

test('preço com centavos é erro; "R$ 119" é aceito', () => {
  assert.equal(lerPreco('R$ 119').valor, 119);
  assert.equal(lerPreco('119,00').valor, 119);
  assert.ok(lerPreco('119,90').erro);
  assert.ok(lerPreco('abc').erro);
});

test('exemplo publicado vira erro só com PRODUCAO=true', () => {
  const linha = ['ex;EXEMPLO X;encomenda;feminino;;;;;;;sim;;sim;sim'];
  assert.equal(preparar(linha).erros.length, 0);
  assert.match(preparar(linha, { producao: true }).erros[0], /PRODUCAO=true/);
});

test('palavras proibidas no texto público geram erro', () => {
  const r = preparar(['a;Contratipo X;encomenda;feminino;;;;;;;sim;;;sim']);
  assert.match(r.erros[0], /contratipo/);
});

test('rascunhos (publicar=nao) não vão para o site e não travam o build', () => {
  const r = preparar(['a;A;linha-errada;feminino;;;;;;;sim;;;nao']);
  assert.equal(r.erros.length, 0);
  assert.equal(r.produtos.length, 0);
});

test('PREENCHER vira null e itens de lista com PREENCHER somem', () => {
  const avisos = [];
  const r = limparPreencher({ a: 'PREENCHER', b: 'ok', lista: [{ p: '1', r: 'PREENCHER' }, { p: '2', r: 'ok' }], _comentario: 'x' }, '', avisos);
  assert.deepEqual(r, { a: null, b: 'ok', lista: [{ p: '2', r: 'ok' }] });
  assert.equal(avisos.length, 2);
});
