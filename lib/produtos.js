// Validação e preparação dos produtos vindos do CSV.
//
// IMPORTANTE: os produtos publicados são montados a partir de uma LISTA FECHADA
// de campos (veja `montarProdutoPublico`). A coluna `referencia` é de uso interno
// e nunca é copiada para o objeto público — por isso não chega ao HTML, ao JSON,
// aos metadados nem ao sitemap.
import fs from 'node:fs';
import path from 'node:path';
import { gerarSlug, normalizar } from '../src/assets/js/lib/formato.js';

export const COLUNAS = [
  'slug', 'nome', 'linha', 'genero', 'familia', 'notas_saida', 'notas_coracao', 'notas_fundo',
  'descricao_curta', 'descricao', 'preco_50', 'preco_100', 'disponivel', 'destaque', 'novo',
  'ordem', 'link_loja', 'fotos', 'referencia', 'exemplo', 'publicar',
];
export const COLUNAS_OBRIGATORIAS = ['slug', 'nome', 'linha', 'genero', 'disponivel', 'publicar'];

export const LINHAS = {
  'linha-aligva': 'Linha Aligva',
  encomenda: 'Encomendas',
  exclusif: 'Exclusif',
};
export const GENEROS = {
  feminino: 'Feminino',
  masculino: 'Masculino',
  compartilhavel: 'Compartilhável',
};
export const GENEROS_PLURAL = {
  feminino: 'Femininos',
  masculino: 'Masculinos',
  compartilhavel: 'Compartilháveis',
};
export const DISPONIBILIDADES = {
  sim: 'Disponível',
  nao: 'Esgotado',
  'sob-encomenda': 'Sob encomenda',
};
export const TAMANHOS = [50, 100];
export const EXTENSOES_FOTO = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

// Palavras que nunca podem aparecer em texto público (posicionamento da marca).
export const PALAVRAS_PROIBIDAS = [
  'replica', 'replicas', 'copia', 'copias', 'contratipo', 'contratipos', 'imitacao', 'imitacoes',
  'barato', 'barata', 'baratos', 'baratas', 'preco baixo', 'precos baixos', 'custo-beneficio',
  'custo beneficio', 'produto popular',
];
// Afirmações regulatórias/de saúde: só com respaldo dos donos (campo "afirmacoes" do site.json).
export const AFIRMACOES_RESTRITAS = [
  'anvisa', 'hipoalergenico', 'hipoalergenica', 'vegano', 'vegana', 'cruelty-free', 'cruelty free',
  'livre de crueldade', 'dermatologicamente testado', '100% natural', 'organico', 'organica',
];

/** Procura termos (já normalizados) em um texto, respeitando limites de palavra. */
export function encontrarTermos(texto, termos) {
  const alvo = normalizar(texto);
  return termos.filter((termo) => {
    const escapado = termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${escapado}($|[^a-z0-9])`).test(alvo);
  });
}

const sim = (v) => normalizar(v) === 'sim';
const separarNotas = (v) => String(v || '').split('|').map((n) => n.trim()).filter(Boolean);
const capitalizar = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

/**
 * Lê um preço digitado na planilha. Aceita "119", "R$ 119" e "119,00".
 * @returns {{ valor: number|null, erro?: string, aviso?: string }}
 */
export function lerPreco(bruto) {
  const texto = String(bruto ?? '').replace(/R\$/i, '').replace(/\s/g, '');
  if (!texto) return { valor: null };
  const m = texto.match(/^(\d{1,3}(?:\.\d{3})+|\d+)(?:[.,](\d{1,2}))?$/);
  if (!m) return { valor: null, erro: `"${bruto}" não é um preço válido. Use só números inteiros, ex.: 119` };
  const inteiro = Number(m[1].replace(/\./g, ''));
  if (m[2] && Number(m[2]) !== 0) {
    return { valor: null, erro: `"${bruto}" tem centavos. Os preços da Aligva são inteiros, ex.: 119` };
  }
  return { valor: inteiro, aviso: m[2] ? `"${bruto}" foi lido como ${inteiro}. Prefira digitar só o número inteiro.` : undefined };
}

/** Lista as fotos de um produto (na ordem do CSV ou, se vazio, em ordem alfabética). */
export function listarFotos(slug, campoFotos, pastaProdutos) {
  const pasta = path.join(pastaProdutos, slug);
  const existentes = fs.existsSync(pasta)
    ? fs.readdirSync(pasta).filter((f) => EXTENSOES_FOTO.includes(path.extname(f).toLowerCase())).sort((a, b) => a.localeCompare(b, 'pt-BR'))
    : [];
  const pedidas = separarNotas(campoFotos);
  if (pedidas.length === 0) {
    return { arquivos: existentes.map((f) => path.join(pasta, f)), faltando: [] };
  }
  const arquivos = [];
  const faltando = [];
  for (const nome of pedidas) {
    const encontrado = existentes.find((f) => f === nome) || existentes.find((f) => f.toLowerCase() === nome.toLowerCase());
    if (encontrado) arquivos.push(path.join(pasta, encontrado));
    else faltando.push(nome);
  }
  return { arquivos, faltando };
}

/**
 * Valida as linhas do CSV e devolve os produtos prontos para publicação.
 * @param {{ cabecalho: string[], linhas: Record<string,string>[] }} csv
 * @param {{ pastaProdutos: string, producao?: boolean, afirmacoesPermitidas?: string[] }} opcoes
 */
export function prepararProdutos(csv, { pastaProdutos, producao = false, afirmacoesPermitidas = [] }) {
  const erros = [];
  const avisos = [];
  const produtos = [];
  const slugs = new Map();

  const faltandoNoCabecalho = COLUNAS_OBRIGATORIAS.filter((c) => !csv.cabecalho.includes(c));
  if (faltandoNoCabecalho.length) {
    erros.push(`Cabeçalho do CSV (linha 1): faltam as colunas obrigatórias ${faltandoNoCabecalho.map((c) => `"${c}"`).join(', ')}. Copie o cabeçalho do arquivo modelo-produtos.csv.`);
    return { produtos, erros, avisos };
  }
  const desconhecidas = csv.cabecalho.filter((c) => c && !COLUNAS.includes(c));
  if (desconhecidas.length) {
    avisos.push(`Cabeçalho do CSV (linha 1): colunas desconhecidas serão ignoradas: ${desconhecidas.map((c) => `"${c}"`).join(', ')}.`);
  }

  const restritas = AFIRMACOES_RESTRITAS.filter((t) => !afirmacoesPermitidas.map(normalizar).some((p) => p.includes(t)));

  for (const linha of csv.linhas) {
    const n = linha.__linha;
    const publicar = sim(linha.publicar);
    // Em rascunhos (publicar=nao), problemas viram avisos para não travar a publicação.
    const problema = (coluna, mensagem) => {
      const texto = `Linha ${n}, coluna "${coluna}": ${mensagem}`;
      (publicar ? erros : avisos).push(publicar ? texto : `${texto} (produto em rascunho)`);
    };
    const aviso = (coluna, mensagem) => avisos.push(`Linha ${n}, coluna "${coluna}": ${mensagem}`);

    const nome = String(linha.nome || '').trim();
    if (!nome) { problema('nome', 'o nome do perfume é obrigatório.'); continue; }

    if (!['sim', 'nao', 'não'].includes(normalizar(linha.publicar)) ) {
      erros.push(`Linha ${n}, coluna "publicar": use "sim" ou "nao" (está "${linha.publicar || 'vazio'}").`);
      continue;
    }

    let slug = String(linha.slug || '').trim();
    if (!slug) {
      slug = gerarSlug(nome);
      aviso('slug', `estava vazio; foi gerado automaticamente "${slug}". Copie esse valor para a planilha para a URL não mudar se o nome mudar.`);
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      problema('slug', `"${slug}" é inválido. Use só letras minúsculas sem acento, números e hífens (sugestão: "${gerarSlug(slug)}").`);
      continue;
    }
    if (slugs.has(slug)) {
      problema('slug', `"${slug}" repete o slug da linha ${slugs.get(slug)}. Cada perfume precisa de um slug único.`);
      continue;
    }
    slugs.set(slug, n);

    const linhaProduto = normalizar(linha.linha);
    if (!LINHAS[linhaProduto]) {
      problema('linha', `valor "${linha.linha || 'vazio'}" não é permitido. Use: linha-aligva, encomenda ou exclusif.`);
      continue;
    }
    const genero = normalizar(linha.genero).replace('compartilhável', 'compartilhavel');
    if (!GENEROS[genero]) {
      problema('genero', `valor "${linha.genero || 'vazio'}" não é permitido. Use: feminino, masculino ou compartilhavel.`);
      continue;
    }
    const disponivel = normalizar(linha.disponivel).replace('não', 'nao');
    if (!DISPONIBILIDADES[disponivel]) {
      problema('disponivel', `valor "${linha.disponivel || 'vazio'}" não é permitido. Use: sim, nao ou sob-encomenda.`);
      continue;
    }

    const precos = [];
    let precoInvalido = false;
    for (const tamanho of TAMANHOS) {
      const coluna = `preco_${tamanho}`;
      const lido = lerPreco(linha[coluna]);
      if (lido.erro) { problema(coluna, lido.erro); precoInvalido = true; continue; }
      if (lido.aviso) aviso(coluna, lido.aviso);
      if (lido.valor !== null) {
        if (lido.valor % 10 !== 9) aviso(coluna, `o preço R$ ${lido.valor} não termina em 9 (padrão da marca). Confira se está certo.`);
        precos.push({ tamanho, preco: lido.valor });
      }
    }
    if (precoInvalido) continue;

    let ordem = 9999;
    if (String(linha.ordem || '').trim()) {
      ordem = Number(String(linha.ordem).replace(',', '.'));
      if (!Number.isFinite(ordem)) { aviso('ordem', `"${linha.ordem}" não é um número; o produto vai para o fim da lista.`); ordem = 9999; }
    }

    const linkLoja = String(linha.link_loja || '').trim();
    if (linkLoja && !/^https:\/\/\S+$/.test(linkLoja)) {
      problema('link_loja', `"${linkLoja}" não parece um endereço válido. Copie o link completo da loja, começando com https://`);
      continue;
    }

    const exemplo = sim(linha.exemplo);
    if (exemplo && publicar && producao) {
      erros.push(`Linha ${n}: o produto de exemplo "${nome}" está com publicar=sim e o site está em modo de produção (PRODUCAO=true). Apague a linha ou mude publicar para "nao".`);
      continue;
    }
    if (!exemplo && /exemplo/i.test(nome)) aviso('exemplo', `"${nome}" parece ser um exemplo; marque exemplo=sim ou corrija o nome.`);

    const referencia = String(linha.referencia || '').trim();
    if (referencia && !/^[A-Za-z0-9._-]{1,24}$/.test(referencia)) {
      aviso('referencia', 'atenção: o repositório é público e esta coluna fica visível no GitHub (não no site). Use apenas um código interno curto (ex.: R-014), nunca nomes de outras marcas.');
    }

    const textosPublicos = {
      nome, familia: linha.familia, descricao_curta: linha.descricao_curta, descricao: linha.descricao,
      notas_saida: linha.notas_saida, notas_coracao: linha.notas_coracao, notas_fundo: linha.notas_fundo,
    };
    let textoProibido = false;
    for (const [coluna, texto] of Object.entries(textosPublicos)) {
      if (!texto) continue;
      if (String(texto).includes('PREENCHER')) { problema(coluna, 'ainda contém "PREENCHER". Escreva o texto ou deixe a célula vazia.'); textoProibido = true; }
      const proibidas = encontrarTermos(texto, PALAVRAS_PROIBIDAS);
      if (proibidas.length) { problema(coluna, `contém termo que não pode ser usado em texto público: ${proibidas.join(', ')}.`); textoProibido = true; }
      const afirmacoes = encontrarTermos(texto, restritas);
      if (afirmacoes.length) { problema(coluna, `contém afirmação regulatória/de saúde sem respaldo cadastrado em site.json ("afirmacoes"): ${afirmacoes.join(', ')}.`); textoProibido = true; }
    }
    if (textoProibido) continue;

    const descricaoCurta = String(linha.descricao_curta || '').trim();
    if (descricaoCurta.length > 140) aviso('descricao_curta', `tem ${descricaoCurta.length} caracteres; o ideal é até ~120 para caber no card.`);

    if (!publicar) continue;

    if (linhaProduto === 'exclusif') {
      aviso('linha', `"${nome}" é da linha Exclusif, que ainda aparece como "Em breve". O produto não será exibido por enquanto.`);
      continue;
    }

    const fotos = listarFotos(slug, linha.fotos, pastaProdutos);
    for (const f of fotos.faltando) aviso('fotos', `a foto "${f}" não foi encontrada em src/assets/produtos/${slug}/.`);

    produtos.push(montarProdutoPublico({
      slug, nome, linha: linhaProduto, genero, disponivel, precos, ordem, linkLoja, exemplo,
      familia: String(linha.familia || '').trim(),
      notas: { saida: separarNotas(linha.notas_saida), coracao: separarNotas(linha.notas_coracao), fundo: separarNotas(linha.notas_fundo) },
      descricaoCurta,
      descricao: String(linha.descricao || '').trim(),
      destaque: sim(linha.destaque),
      novo: sim(linha.novo),
      arquivosFotos: fotos.arquivos,
    }));
  }

  produtos.sort(compararOrdem);
  return { produtos, erros, avisos };
}

export function compararOrdem(a, b) {
  return a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR');
}

/**
 * Monta o objeto público de um produto. Somente os campos listados aqui
 * chegam ao site. Não adicione `referencia` (nem nenhum dado interno) aqui.
 */
export function montarProdutoPublico(d) {
  const familia = d.familia ? normalizar(d.familia) : '';
  const todasNotas = [...d.notas.saida, ...d.notas.coracao, ...d.notas.fundo];
  const principais = [d.notas.saida[0], d.notas.coracao[0], d.notas.fundo[0]].filter(Boolean);
  for (const nota of todasNotas) {
    if (principais.length >= 3) break;
    if (!principais.includes(nota)) principais.push(nota);
  }
  const valores = d.precos.map((p) => p.preco);
  return {
    slug: d.slug,
    nome: d.nome,
    linha: d.linha,
    linhaRotulo: LINHAS[d.linha],
    genero: d.genero,
    generoRotulo: GENEROS[d.genero],
    familia,
    familiaRotulo: capitalizar(d.familia ? d.familia.trim().toLowerCase() : ''),
    notas: d.notas,
    todasNotas,
    notasPrincipais: principais.slice(0, 3),
    descricaoCurta: d.descricaoCurta,
    descricao: d.descricao,
    precos: d.precos,
    precoMin: valores.length ? Math.min(...valores) : null,
    precoMax: valores.length ? Math.max(...valores) : null,
    // Sem preço cadastrado, os dois tamanhos são oferecidos com "valor a confirmar".
    tamanhos: d.precos.length ? d.precos.map((p) => p.tamanho) : [...TAMANHOS],
    disponivel: d.disponivel,
    disponivelRotulo: DISPONIBILIDADES[d.disponivel],
    destaque: d.destaque,
    novo: d.novo,
    ordem: d.ordem,
    linkLoja: d.linkLoja || null,
    exemplo: d.exemplo,
    arquivosFotos: d.arquivosFotos,
  };
}

/** Produtos relacionados: mesma família e notas em comum pesam mais. */
export function relacionados(produto, todos, quantidade = 4) {
  const notas = new Set(produto.todasNotas.map(normalizar));
  return todos
    .filter((p) => p.slug !== produto.slug)
    .map((p) => {
      let pontos = 0;
      if (produto.familia && p.familia === produto.familia) pontos += 3;
      for (const nota of p.todasNotas) if (notas.has(normalizar(nota))) pontos += 1;
      if (p.genero === produto.genero) pontos += 0.5;
      if (p.linha === produto.linha) pontos += 0.25;
      return { p, pontos };
    })
    .filter(({ pontos }) => pontos > 0.5)
    .sort((a, b) => b.pontos - a.pontos || compararOrdem(a.p, b.p))
    .slice(0, quantidade)
    .map(({ p }) => p);
}
