import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerCsv, detectarSeparador } from '../../lib/csv.js';

const CABECALHO = ['slug', 'nome', 'notas_saida'];

test('lê CSV separado por ponto e vírgula (Excel)', () => {
  const { linhas, separador, cabecalho } = lerCsv('slug;nome;notas_saida\ncirce;Circe;flor de maracujá\n');
  assert.equal(separador, ';');
  assert.deepEqual(cabecalho, CABECALHO);
  assert.equal(linhas[0].nome, 'Circe');
  assert.equal(linhas[0].notas_saida, 'flor de maracujá');
  assert.equal(linhas[0].__linha, 2);
});

test('lê CSV separado por vírgula (Google Sheets) com aspas', () => {
  const { linhas, separador } = lerCsv('slug,nome,notas_saida\ncirce,"Circe, a feiticeira",baunilha\n');
  assert.equal(separador, ',');
  assert.equal(linhas[0].nome, 'Circe, a feiticeira');
});

test('ignora o BOM do início do arquivo (UTF-8 com BOM)', () => {
  const comBom = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('slug;nome\ncirce;Circe\n')]);
  const { cabecalho, linhas } = lerCsv(comBom);
  assert.equal(cabecalho[0], 'slug');
  assert.equal(linhas[0].slug, 'circe');
});

test('BOM em string também é removido', () => {
  const { cabecalho } = lerCsv('﻿slug,nome\ncirce,Circe');
  assert.equal(cabecalho[0], 'slug');
});

test('aceita quebra de linha dentro de aspas e informa a linha correta', () => {
  const { linhas } = lerCsv('slug;descricao\ncirce;"linha 1\nlinha 2"\noutro;texto\n');
  assert.equal(linhas[0].descricao, 'linha 1\nlinha 2');
  assert.equal(linhas[1].slug, 'outro');
  assert.equal(linhas[1].__linha, 4);
});

test('aceita fim de linha do Windows e ignora linhas vazias e comentários', () => {
  const { linhas } = lerCsv('slug;nome\r\ncirce;Circe\r\n;\r\n# comentário;\r\n');
  assert.equal(linhas.length, 1);
});

test('detecta o separador ignorando vírgulas dentro de aspas', () => {
  assert.equal(detectarSeparador('"a,b";c;d\n'), ';');
  assert.equal(detectarSeparador('a,b,c\n'), ',');
});
