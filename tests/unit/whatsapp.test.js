import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarMensagemPedido, montarMensagemProduto, linkWhatsApp } from '../../src/assets/js/lib/whatsapp.js';

const itens = [
  { nome: 'Circe', tamanho: 100, quantidade: 1, preco: 159 },
  { nome: 'Outro', tamanho: 50, quantidade: 2, preco: 119 },
];

test('mensagem com preços, subtotal e observações', () => {
  const msg = montarMensagemPedido(itens, { mostrarPrecos: true, observacoes: 'Presente' });
  assert.equal(msg, [
    'Olá, Aligva! Gostaria de fazer um pedido:',
    '',
    '• Circe — 100 mL × 1 — R$ 159',
    '• Outro — 50 mL × 2 — R$ 238',
    '',
    'Subtotal: R$ 397',
    'Observações: Presente',
    '',
    '(Pedido montado pelo catálogo online)',
  ].join('\n'));
});

test('mensagem sem preços não exibe valores', () => {
  const msg = montarMensagemPedido(itens, { mostrarPrecos: false });
  assert.doesNotMatch(msg, /R\$/);
  assert.doesNotMatch(msg, /Subtotal/);
  assert.match(msg, /• Circe — 100 mL × 1/);
});

test('item sem preço cadastrado fica como "valor a confirmar"', () => {
  const msg = montarMensagemPedido([{ nome: 'Circe', tamanho: 50, quantidade: 1, preco: null }, itens[0]]);
  assert.match(msg, /Circe — 50 mL × 1 — valor a confirmar/);
  assert.match(msg, /Subtotal parcial: R\$ 159/);
});

test('observações vazias não aparecem', () => {
  assert.doesNotMatch(montarMensagemPedido(itens, { observacoes: '   ' }), /Observações/);
});

test('mensagem curta de produto e encomenda', () => {
  assert.equal(montarMensagemProduto('Circe', { tamanho: 100 }), 'Olá, Aligva! Gostaria de pedir o perfume Circe (100 mL).');
  assert.equal(montarMensagemProduto('Circe', { tipo: 'encomenda' }), 'Olá, Aligva! Gostaria de encomendar o perfume Circe.');
});

test('link wa.me com texto codificado e número limpo', () => {
  assert.equal(linkWhatsApp('+55 (48) 99999-0000', 'Olá & até'), 'https://wa.me/5548999990000?text=Ol%C3%A1%20%26%20at%C3%A9');
  assert.equal(linkWhatsApp('', 'x'), '');
});
