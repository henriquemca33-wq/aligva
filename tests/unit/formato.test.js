import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gerarSlug, formatarPreco, normalizar } from '../../src/assets/js/lib/formato.js';

test('gera slug sem acentos, minúsculo e com hífens', () => {
  assert.equal(gerarSlug('Circe'), 'circe');
  assert.equal(gerarSlug('Flor de Maracujá'), 'flor-de-maracuja');
  assert.equal(gerarSlug('  Âmbar & Baunilha  N°2 '), 'ambar-e-baunilha-n-2');
  assert.equal(gerarSlug('Coração—Íris'), 'coracao-iris');
});

test('formata preço no padrão R$ 119 (sem centavos)', () => {
  assert.equal(formatarPreco(119), 'R$ 119');
  assert.equal(formatarPreco('159'), 'R$ 159');
  assert.equal(formatarPreco(1299), 'R$ 1.299');
  assert.equal(formatarPreco(null), '');
  assert.equal(formatarPreco(''), '');
  assert.equal(formatarPreco('abc'), '');
});

test('normaliza texto para busca (acentos e maiúsculas)', () => {
  assert.equal(normalizar('BAUNILHA'), 'baunilha');
  assert.equal(normalizar('Gardênia'), 'gardenia');
});
