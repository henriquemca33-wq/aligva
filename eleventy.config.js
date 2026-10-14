// Configuração do Eleventy (gerador do site estático).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { HtmlBasePlugin } from '@11ty/eleventy';
import markdownIt from 'markdown-it';
import { carregarSite, carregarJsonDeDados } from './lib/site.js';
import { formatarPreco, normalizar, gerarSlug } from './src/assets/js/lib/formato.js';
import { linkWhatsApp, montarMensagemProduto } from './src/assets/js/lib/whatsapp.js';

export default function (eleventyConfig) {
  const { site } = carregarSite();

  // site.json e faq.json passam pela regra do PREENCHER antes de chegar aos modelos.
  eleventyConfig.addDataExtension('json', {
    read: false,
    parser: (arquivo) => {
      if (path.basename(arquivo) === 'site.json') return carregarSite().site;
      return carregarJsonDeDados(arquivo).dados;
    },
  });

  // Arquivos de instrução (LEIA-ME) dentro de assets não viram páginas.
  eleventyConfig.ignores.add('src/assets/**');

  eleventyConfig.setNunjucksEnvironmentOptions({ autoescape: true, trimBlocks: true, lstripBlocks: true });

  // Acrescenta o pathPrefix (ex.: /aligva-catalogo/) em todos os links e imagens do HTML.
  eleventyConfig.addPlugin(HtmlBasePlugin);

  // Arquivos copiados sem alteração.
  eleventyConfig.addPassthroughCopy({ 'src/assets/css': 'assets/css' });
  eleventyConfig.addPassthroughCopy({ 'src/assets/js': 'assets/js' });
  eleventyConfig.addPassthroughCopy({ 'src/assets/marca': 'assets/marca' });
  eleventyConfig.addPassthroughCopy({ 'src/assets/fontes': 'assets/fontes' });

  eleventyConfig.addWatchTarget('src/_data/produtos.csv');
  eleventyConfig.addWatchTarget('src/assets/produtos/');
  eleventyConfig.addWatchTarget('lib/');
  eleventyConfig.setServerOptions({ watch: ['_site/assets/**/*.css', '_site/assets/**/*.js'] });

  // ---------- Filtros usados nos modelos ----------
  eleventyConfig.addFilter('preco', formatarPreco);
  eleventyConfig.addFilter('normalizar', normalizar);
  eleventyConfig.addFilter('slug', gerarSlug);
  eleventyConfig.addFilter('whatsapp', (texto) => (site.whatsapp?.numero ? linkWhatsApp(site.whatsapp.numero, texto) : ''));
  eleventyConfig.addFilter('mensagemProduto', (nome, tipo) => montarMensagemProduto(nome, { tipo }));
  // URL absoluta (para canonical, Open Graph, sitemap e dados estruturados).
  eleventyConfig.addFilter('absoluta', (caminho) => `${site.urlBase}${String(caminho || '/').startsWith('/') ? '' : '/'}${caminho || '/'}`);
  // Caminho com o prefixo, para atributos que o HtmlBasePlugin não altera (data-*).
  eleventyConfig.addFilter('comPrefixo', (caminho) => `${site.pathPrefix}${String(caminho).replace(/^\//, '')}`);
  eleventyConfig.addFilter('produtosPorSlug', (slugs, porSlug) => (slugs || []).map((s) => porSlug[s]).filter(Boolean));
  eleventyConfig.addFilter('jsonSeguro', (valor) => JSON.stringify(valor).replace(/</g, '\\u003c'));
  eleventyConfig.addFilter('ano', (data) => new Date(data || Date.now()).getFullYear());
  eleventyConfig.addFilter('dataIso', (data) => new Date(data || Date.now()).toISOString().slice(0, 10));
  eleventyConfig.addFilter('mesAno', (data) => new Date(data || Date.now()).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));
  eleventyConfig.addFilter('instagramUrl', (usuario) => (usuario ? `https://www.instagram.com/${String(usuario).replace(/^@/, '')}/` : ''));
  // "a partir de R$ 119" (ou só "R$ 119" quando há um tamanho); vazio se os preços estiverem ocultos.
  eleventyConfig.addFilter('precoAPartir', (produto) => {
    if (!site.mostrarPrecos || !produto?.precoMin) return '';
    return `${produto.precos.length > 1 ? 'a partir de ' : ''}${formatarPreco(produto.precoMin)}`;
  });
  eleventyConfig.addFilter('semAlt', (foto) => ({ ...foto, alt: '' }));
  // Quebra um nome em linhas de até N caracteres (placeholder em SVG).
  eleventyConfig.addFilter('quebrarLinhas', (texto, max = 12) => {
    const linhas = [];
    for (const palavra of String(texto).split(/\s+/).filter(Boolean)) {
      const atual = linhas[linhas.length - 1];
      if (atual && (atual + ' ' + palavra).length <= max) linhas[linhas.length - 1] = `${atual} ${palavra}`;
      else linhas.push(palavra);
    }
    return linhas;
  });
  // 5548999990000 -> +55 48 99999-0000
  eleventyConfig.addFilter('telefone', (numero) => {
    const d = String(numero || '').replace(/\D/g, '');
    const m = d.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
    return m ? `+55 ${m[1]} ${m[2]}-${m[3]}` : `+${d}`;
  });
  eleventyConfig.addFilter('limitar', (lista, n) => (lista || []).slice(0, n));

  const md = markdownIt({ html: false, linkify: true, breaks: true, typographer: true });
  eleventyConfig.addFilter('markdown', (texto) => (texto ? md.render(String(texto)) : ''));

  // Versão de arquivo (cache busting): /assets/css/estilo.css?v=abc123
  const versoes = new Map();
  eleventyConfig.addFilter('versao', (caminho) => {
    if (!versoes.has(caminho)) {
      const arquivo = path.join('src', caminho.replace(/^\//, ''));
      const hash = fs.existsSync(arquivo) ? crypto.createHash('md5').update(fs.readFileSync(arquivo)).digest('hex').slice(0, 8) : 'x';
      versoes.set(caminho, `${caminho}?v=${hash}`);
    }
    return versoes.get(caminho);
  });
  eleventyConfig.on('eleventy.beforeWatch', () => versoes.clear());

  // ---------- Proteções ----------
  // Nenhuma página pode sair com "PREENCHER": se acontecer, o build falha.
  eleventyConfig.addTransform('sem-preencher', function (conteudo) {
    if (typeof conteudo === 'string' && conteudo.includes('PREENCHER')) {
      throw new Error(`A página ${this.page.outputPath} contém "PREENCHER". Preencha o campo ou deixe-o vazio.`);
    }
    return conteudo;
  });

  // Domínio próprio: gera o arquivo CNAME quando "dominioProprio" estiver preenchido.
  eleventyConfig.on('eleventy.after', ({ dir }) => {
    // Imagens geradas pelo src/_data/catalogo.js em .cache/ (copiadas ao final,
    // porque são criadas durante o build).
    for (const [origem, alvo] of [['.cache/img', 'img'], ['.cache/og', 'og'], ['.cache/icones', '.']]) {
      if (fs.existsSync(origem)) fs.cpSync(origem, path.join(dir.output, alvo), { recursive: true });
    }
    const destino = path.join(dir.output, 'CNAME');
    if (site.dominioProprio) fs.writeFileSync(destino, `${site.dominioProprio}\n`);
    else if (fs.existsSync(destino)) fs.rmSync(destino);
  });

  return {
    dir: { input: 'src', output: '_site', includes: '_includes', data: '_data' },
    templateFormats: ['njk', 'md'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    pathPrefix: site.pathPrefix,
  };
}
