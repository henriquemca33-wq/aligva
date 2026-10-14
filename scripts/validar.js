#!/usr/bin/env node
// npm run validar — confere o produtos.csv, o site.json e o faq.json.
// Erros impedem a publicação; avisos só chamam a atenção.
import { carregarDados, relatar } from '../lib/carregar.js';

const resultado = carregarDados();
relatar(resultado);

const { erros, avisos, produtos } = resultado;
console.log('');
console.log(`Produtos publicados: ${produtos.length}`);
console.log(`Avisos: ${avisos.length}`);
console.log(`Erros: ${erros.length}`);

if (erros.length) {
  console.error('\nA validação encontrou erros. Corrija os itens marcados com ❌ e tente de novo.');
  process.exit(1);
}
console.log('\n✅ Validação concluída sem erros.');
