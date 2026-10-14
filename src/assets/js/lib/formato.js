// Funções de formatação compartilhadas entre o build (Node) e o navegador.
// Não use nada específico de Node ou do navegador aqui.

/**
 * Remove acentos e deixa em minúsculas — usado na busca e em comparações.
 * @param {string} texto
 */
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Gera um slug para URL: minúsculas, sem acento, palavras separadas por hífen.
 * Ex.: "Flor de Maracujá" -> "flor-de-maracuja"
 * @param {string} texto
 */
export function gerarSlug(texto) {
  return normalizar(texto)
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/**
 * Formata um valor inteiro em reais no padrão da marca: "R$ 119", "R$ 1.299".
 * Retorna string vazia se o valor não for um número válido.
 * @param {number|string|null|undefined} valor
 */
export function formatarPreco(valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '';
  const inteiro = Math.round(numero);
  const comPontos = String(Math.abs(inteiro)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${inteiro < 0 ? '-' : ''}R$ ${comPontos}`;
}
