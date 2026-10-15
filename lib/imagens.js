// Processamento de imagens no build: fotos responsivas (AVIF/WebP/JPEG),
// imagens de compartilhamento (Open Graph 1200×630) e ícones do site.
// Tudo é gerado em .cache/ (reaproveitado entre builds) e copiado para o site.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Image from '@11ty/eleventy-img';
import sharp from 'sharp';

export const PASTA_CACHE = '.cache';
const PASTA_IMG = path.join(PASTA_CACHE, 'img');
const PASTA_OG = path.join(PASTA_CACHE, 'og');
const PASTA_ICONES = path.join(PASTA_CACHE, 'icones');
const FONTE_TITULO = path.resolve('recursos/fontes-og/CormorantGaramond-Medium.ttf');
const FONTE_TEXTO = path.resolve('recursos/fontes-og/Jost-Regular.ttf');
const LOGO = path.resolve('src/assets/marca/logo.svg');
const COROA = path.resolve('src/assets/marca/coroa.svg');
const existe = (arquivo) => fs.existsSync(arquivo);
const assinaturaArquivo = (arquivo) => (existe(arquivo) ? `${arquivo}:${fs.statSync(arquivo).mtimeMs}` : '');

const CORES = { fundo: '#F8F6F1', tinta: '#1F1D1A', cinza: '#5E5A54', dourado: '#7E6741' };
const MIME = { avif: 'image/avif', webp: 'image/webp', jpeg: 'image/jpeg', png: 'image/png' };

// Arquivos usados neste build — o restante do cache é apagado no fim (limparCache).
const usados = new Set();

/**
 * Gera as versões responsivas de uma foto.
 * @param {string} arquivo caminho da foto original
 * @param {{ nomeBase: string, alt: string, larguras?: number[] }} opcoes
 */
export async function processarFoto(arquivo, { nomeBase, alt, larguras = [400, 800, 1200] }) {
  const meta = await Image(arquivo, {
    widths: larguras,
    formats: ['avif', 'webp', 'jpeg'],
    outputDir: PASTA_IMG,
    urlPath: '/img/',
    sharpAvifOptions: { quality: 55 },
    sharpWebpOptions: { quality: 78 },
    sharpJpegOptions: { quality: 80, mozjpeg: true, progressive: true },
    filenameFormat: (id, _src, largura, formato) => `${nomeBase}-${id}-${largura}.${formato}`,
  });
  for (const lista of Object.values(meta)) for (const item of lista) usados.add(path.resolve(item.outputPath));
  const jpegs = meta.jpeg;
  const maior = jpegs[jpegs.length - 1];
  return {
    alt,
    largura: maior.width,
    altura: maior.height,
    src: maior.url,
    miniatura: jpegs[0].url,
    medio: (jpegs.find((j) => j.width >= 800) || maior).url,
    arquivoJpeg: maior.outputPath,
    fontes: ['avif', 'webp', 'jpeg'].map((f) => ({ tipo: MIME[f], srcset: meta[f].map((m) => m.srcset).join(', ') })),
  };
}

const escapar = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function texto(conteudo, { fonte, arquivoFonte, tamanho, cor, largura, espacamento = 0, alinhar = 'left' }) {
  const markup = `<span foreground="${cor}"${espacamento ? ` letter_spacing="${espacamento * 1024}"` : ''}>${escapar(conteudo)}</span>`;
  return sharp({
    text: { text: markup, font: `${fonte} ${tamanho}`, fontfile: arquivoFonte, rgba: true, dpi: 72, width: largura, align: alinhar, wrap: 'word' },
  }).png().toBuffer({ resolveWithObject: true });
}

/**
 * Imagem de compartilhamento 1200×630 (WhatsApp, Instagram, Facebook...).
 * Com foto: foto à direita e texto à esquerda. Sem foto: composição tipográfica.
 * @returns {Promise<string>} URL pública (sem prefixo), ex.: /og/circe-ab12cd.jpg
 */
export async function gerarImagemOg({ nomeBase, titulo, subtitulo = '', foto = null }) {
  const assinatura = crypto.createHash('sha1')
    .update(JSON.stringify({ titulo, subtitulo, v: 5 }))
    .update(assinaturaArquivo(LOGO))
    .update(foto ? `${foto}:${fs.statSync(foto).mtimeMs}` : '')
    .digest('hex').slice(0, 10);
  const nomeArquivo = `${nomeBase}-${assinatura}.jpg`;
  const destino = path.join(PASTA_OG, nomeArquivo);
  usados.add(path.resolve(destino));
  if (fs.existsSync(destino)) return `/og/${nomeArquivo}`;
  fs.mkdirSync(PASTA_OG, { recursive: true });

  const L = 1200;
  const A = 630;
  const larguraFoto = foto ? 500 : 0;
  const larguraTexto = L - larguraFoto - 160;
  const camadas = [];

  const moldura = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${A}">
    <rect x="28" y="28" width="${L - 56}" height="${A - 56}" fill="none" stroke="${CORES.dourado}" stroke-width="1.5"/>
  </svg>`);
  camadas.push({ input: moldura, top: 0, left: 0 });

  if (foto) {
    const imagem = await sharp(foto).rotate().resize(larguraFoto, A - 56, { fit: 'cover' }).toBuffer();
    camadas.push({ input: imagem, top: 28, left: L - larguraFoto - 28 });
  }

  // Composição centralizada na área de texto: logo (ou "ALIGVA"), nome do perfume e subtítulo.
  const areaTexto = L - larguraFoto - (foto ? 28 : 0);
  const centro = (largura) => Math.round((areaTexto - largura) / 2);
  const marca = existe(LOGO)
    ? await sharp(LOGO, { density: 300 }).resize({ height: 150 }).png().toBuffer({ resolveWithObject: true })
    : await texto('ALIGVA', { fonte: 'Jost', arquivoFonte: FONTE_TEXTO, tamanho: 26, cor: CORES.dourado, espacamento: 10 });
  const tituloImg = await texto(titulo, { fonte: 'Cormorant Garamond Medium', arquivoFonte: FONTE_TITULO, tamanho: titulo.length > 22 ? 64 : 84, cor: CORES.tinta, largura: larguraTexto, alinhar: 'centre' });
  const sub = subtitulo ? await texto(subtitulo, { fonte: 'Jost', arquivoFonte: FONTE_TEXTO, tamanho: 28, cor: CORES.cinza, largura: larguraTexto, alinhar: 'centre' }) : null;

  const alturaTotal = marca.info.height + 44 + tituloImg.info.height + (sub ? 20 + sub.info.height : 0);
  let topo = Math.round((A - alturaTotal) / 2);
  camadas.push({ input: marca.data, top: topo, left: centro(marca.info.width) });
  topo += marca.info.height + 44;
  camadas.push({ input: tituloImg.data, top: topo, left: centro(tituloImg.info.width) });
  topo += tituloImg.info.height + 20;
  if (sub) camadas.push({ input: sub.data, top: topo, left: centro(sub.info.width) });

  await sharp({ create: { width: L, height: A, channels: 3, background: CORES.fundo } })
    .composite(camadas)
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(destino);
  return `/og/${nomeArquivo}`;
}

/** Ícones PNG (favicon, apple-touch-icon e manifest) com a coroa da marca. */
export async function gerarIcones() {
  fs.mkdirSync(PASTA_ICONES, { recursive: true });
  const versao = crypto.createHash('sha1').update(assinaturaArquivo(COROA)).digest('hex').slice(0, 8);
  const marcador = path.join(PASTA_ICONES, `.versao-${versao}`);
  const tamanhos = { 'favicon-32.png': 32, 'apple-touch-icon.png': 180, 'icone-192.png': 192, 'icone-512.png': 512 };
  const atualizados = existe(marcador);
  for (const [nome, tamanho] of Object.entries(tamanhos)) {
    const destino = path.join(PASTA_ICONES, nome);
    usados.add(path.resolve(destino));
    if (atualizados && existe(destino)) continue;
    const proporcao = tamanho <= 32 ? 0.86 : 0.62;
    const desenho = existe(COROA)
      ? (await sharp(COROA, { density: 600 }).resize({ width: Math.round(tamanho * proporcao), height: Math.round(tamanho * proporcao), fit: 'inside' }).png().toBuffer())
      : (await texto('A', { fonte: 'Cormorant Garamond Medium', arquivoFonte: FONTE_TITULO, tamanho: Math.round(tamanho * 0.72), cor: CORES.dourado })).data;
    await sharp({ create: { width: tamanho, height: tamanho, channels: 4, background: tamanho <= 32 ? { r: 0, g: 0, b: 0, alpha: 0 } : CORES.fundo } })
      .composite([{ input: desenho, gravity: 'center' }])
      .png()
      .toFile(destino);
  }
  for (const f of fs.readdirSync(PASTA_ICONES)) if (f.startsWith('.versao-')) fs.rmSync(path.join(PASTA_ICONES, f));
  fs.writeFileSync(marcador, '');
}

/** Apaga do cache as imagens que não foram usadas neste build (fotos removidas etc.). */
export function limparCache() {
  for (const pasta of [PASTA_IMG, PASTA_OG]) {
    if (!fs.existsSync(pasta)) continue;
    for (const arquivo of fs.readdirSync(pasta)) {
      const completo = path.resolve(pasta, arquivo);
      if (!usados.has(completo)) fs.rmSync(completo, { force: true });
    }
  }
}
