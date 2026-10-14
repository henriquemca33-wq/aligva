// Ponto único de leitura dos dados: usado pelo build (src/_data/catalogo.js)
// e pelo comando `npm run validar`.
import fs from 'node:fs';
import path from 'node:path';
import { lerCsv } from './csv.js';
import { carregarSite, carregarJsonDeDados } from './site.js';
import { prepararProdutos } from './produtos.js';

export function carregarDados({ raiz = process.cwd(), env = process.env } = {}) {
  const erros = [];
  const avisos = [];

  let site = null;
  try {
    const r = carregarSite({ raiz, env });
    site = r.site;
    avisos.push(...r.avisos);
  } catch (e) {
    erros.push(`site.json: não foi possível ler o arquivo (${e.message}). Confira vírgulas e aspas — dica: cole o conteúdo em https://jsonlint.com para achar o erro.`);
  }

  let faq = { perguntas: [] };
  const arquivoFaq = path.join(raiz, 'src', '_data', 'faq.json');
  if (fs.existsSync(arquivoFaq)) {
    try {
      const r = carregarJsonDeDados(arquivoFaq);
      faq = r.dados;
      avisos.push(...r.avisos);
    } catch (e) {
      erros.push(`faq.json: não foi possível ler o arquivo (${e.message}).`);
    }
  }

  let produtos = [];
  const arquivoCsv = path.join(raiz, 'src', '_data', 'produtos.csv');
  if (!fs.existsSync(arquivoCsv)) {
    erros.push('produtos.csv: arquivo não encontrado em src/_data/produtos.csv.');
  } else {
    try {
      const csv = lerCsv(fs.readFileSync(arquivoCsv));
      const r = prepararProdutos(csv, {
        pastaProdutos: path.join(raiz, 'src', 'assets', 'produtos'),
        producao: env.PRODUCAO === 'true',
        afirmacoesPermitidas: site?.afirmacoes || [],
      });
      produtos = r.produtos;
      erros.push(...r.erros);
      avisos.push(...r.avisos);
      if (produtos.length === 0 && r.erros.length === 0) avisos.push('produtos.csv: nenhum produto com publicar=sim.');
    } catch (e) {
      erros.push(`produtos.csv: não foi possível ler a planilha (${e.message}). Salve como "CSV UTF-8" e tente de novo.`);
    }
  }

  return { site, faq, produtos, erros, avisos };
}

/** Imprime avisos e erros de forma legível no terminal / no log do GitHub Actions. */
export function relatar({ erros, avisos }, { github = process.env.GITHUB_ACTIONS === 'true' } = {}) {
  for (const a of avisos) console.warn(github ? `::warning::${a}` : `⚠️  Aviso: ${a}`);
  for (const e of erros) console.error(github ? `::error::${e}` : `❌ Erro: ${e}`);
}
