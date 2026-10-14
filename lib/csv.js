// Leitura do CSV de produtos.
// Aceita separador ";" (padrão do Excel em português) ou "," (Google Sheets),
// com ou sem BOM no início do arquivo.
import { parse } from 'csv-parse/sync';

/** Remove o BOM (marca invisível que o Excel coloca no início do arquivo). */
export function removerBom(texto) {
  return texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto;
}

/**
 * Descobre o separador olhando a linha de cabeçalho (fora de aspas).
 * @param {string} texto
 * @returns {';'|','}
 */
export function detectarSeparador(texto) {
  const primeiraLinha = texto.split(/\r?\n/, 1)[0] ?? '';
  let pontoEVirgula = 0;
  let virgula = 0;
  let dentroDeAspas = false;
  for (const caractere of primeiraLinha) {
    if (caractere === '"') dentroDeAspas = !dentroDeAspas;
    else if (!dentroDeAspas && caractere === ';') pontoEVirgula++;
    else if (!dentroDeAspas && caractere === ',') virgula++;
  }
  return pontoEVirgula >= virgula && pontoEVirgula > 0 ? ';' : ',';
}

/**
 * Lê o conteúdo de um CSV e devolve o cabeçalho e as linhas.
 * Cada linha vem com `__linha`: o número da linha no arquivo (o cabeçalho é a linha 1),
 * para que as mensagens de erro digam exatamente onde está o problema.
 * @param {string|Buffer} conteudo
 */
export function lerCsv(conteudo) {
  const texto = removerBom(Buffer.isBuffer(conteudo) ? conteudo.toString('utf8') : String(conteudo));
  const separador = detectarSeparador(texto);
  let cabecalho = [];
  const registros = parse(texto, {
    delimiter: separador,
    columns: (colunas) => {
      cabecalho = colunas.map((c) => String(c).trim().toLowerCase());
      return cabecalho;
    },
    bom: true,
    trim: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
    info: true,
  });

  const linhas = registros
    .map(({ record, info }) => ({ ...record, __linha: info.lines }))
    // Ignora linhas totalmente vazias (ex.: ";;;;;" que o Excel às vezes deixa no fim)
    // e linhas de comentário começando com "#".
    .filter((linha) => {
      const valores = cabecalho.map((c) => linha[c] ?? '');
      if (valores.every((v) => v === '')) return false;
      return !String(valores[0]).startsWith('#');
    });

  return { cabecalho, linhas, separador };
}
