// Montagem da mensagem de pedido e do link do WhatsApp.
// Compartilhado entre o build (Node), os testes e o navegador.
import { formatarPreco } from './formato.js';

/**
 * @typedef {Object} ItemPedido
 * @property {string} nome      Nome do perfume
 * @property {number} tamanho   Tamanho em mL (50 ou 100)
 * @property {number} quantidade
 * @property {number|null} [preco] Preço unitário em reais (inteiro)
 */

/**
 * Monta o texto do pedido.
 * @param {ItemPedido[]} itens
 * @param {{ mostrarPrecos?: boolean, observacoes?: string, saudacao?: string }} [opcoes]
 */
export function montarMensagemPedido(itens, opcoes = {}) {
  const { mostrarPrecos = true, observacoes = '', saudacao = 'Olá, Aligva! Gostaria de fazer um pedido:' } = opcoes;
  const linhas = [saudacao, ''];
  let subtotal = 0;
  let subtotalCompleto = true;

  for (const item of itens) {
    const quantidade = Math.max(1, Math.round(Number(item.quantidade) || 1));
    const tamanho = item.tamanho ? ` — ${item.tamanho} mL` : '';
    let linha = `• ${item.nome}${tamanho} × ${quantidade}`;
    const preco = Number(item.preco);
    if (mostrarPrecos) {
      if (item.preco !== null && item.preco !== undefined && item.preco !== '' && Number.isFinite(preco)) {
        const total = preco * quantidade;
        subtotal += total;
        linha += ` — ${formatarPreco(total)}`;
      } else {
        subtotalCompleto = false;
        linha += ' — valor a confirmar';
      }
    }
    linhas.push(linha);
  }

  if (mostrarPrecos && itens.length > 0) {
    linhas.push('');
    linhas.push(subtotalCompleto
      ? `Subtotal: ${formatarPreco(subtotal)}`
      : `Subtotal parcial: ${formatarPreco(subtotal)} (alguns valores a confirmar)`);
  }

  const obs = String(observacoes || '').trim();
  if (obs) {
    if (!mostrarPrecos) linhas.push('');
    linhas.push(`Observações: ${obs}`);
  }

  linhas.push('');
  linhas.push('(Pedido montado pelo catálogo online)');
  // Troca espaços não separáveis por espaços comuns para o texto colar bem no WhatsApp.
  return linhas.join('\n').replace(/ /g, ' ');
}

/**
 * Mensagem curta para pedir/encomendar um único perfume.
 * @param {string} nome
 * @param {{ tipo?: 'pedido'|'encomenda'|'duvida', tamanho?: number, quantidade?: number }} [opcoes]
 */
export function montarMensagemProduto(nome, opcoes = {}) {
  const { tipo = 'pedido', tamanho, quantidade } = opcoes;
  const detalhes = [tamanho ? `${tamanho} mL` : '', quantidade && quantidade > 1 ? `${quantidade} unidades` : '']
    .filter(Boolean).join(', ');
  const sufixo = detalhes ? ` (${detalhes})` : '';
  if (tipo === 'encomenda') return `Olá, Aligva! Gostaria de encomendar o perfume ${nome}${sufixo}.`;
  if (tipo === 'duvida') return `Olá, Aligva! Tenho interesse no perfume ${nome}. Pode me ajudar?`;
  return `Olá, Aligva! Gostaria de pedir o perfume ${nome}${sufixo}.`;
}

/**
 * Link wa.me com o texto já codificado. O número deve estar em formato
 * internacional (ex.: 5548999999999); qualquer caractere que não seja dígito é removido.
 * @param {string} numero
 * @param {string} [texto]
 */
export function linkWhatsApp(numero, texto = '') {
  const digitos = String(numero || '').replace(/\D/g, '');
  if (!digitos) return '';
  const base = `https://wa.me/${digitos}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}

/**
 * Link de e-mail (alternativa quando o WhatsApp ainda não foi configurado).
 * @param {string} email
 * @param {string} assunto
 * @param {string} corpo
 */
export function linkEmail(email, assunto, corpo) {
  return `mailto:${email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
}
