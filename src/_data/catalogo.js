// Dados do catálogo montados a partir do produtos.csv (fonte da verdade).
// Este arquivo também processa as fotos e gera as imagens de compartilhamento.
import fs from 'node:fs';
import path from 'node:path';
import { carregarDados, relatar } from '../../lib/carregar.js';
import { GENEROS, GENEROS_PLURAL, LINHAS, relacionados } from '../../lib/produtos.js';
import { processarFoto, gerarImagemOg, gerarIcones, limparCache } from '../../lib/imagens.js';
import { normalizar } from '../assets/js/lib/formato.js';

const ORDEM_GENEROS = ['feminino', 'masculino', 'compartilhavel'];
const PASTA_MARCA = path.join('src', 'assets', 'marca');

function acharArquivoDeMarca(nomes) {
  for (const nome of nomes) {
    const arquivo = path.join(PASTA_MARCA, nome);
    if (fs.existsSync(arquivo)) return arquivo;
  }
  return null;
}

export default async function () {
  const dados = carregarDados();
  relatar(dados);
  if (dados.erros.length) {
    throw new Error(`O catálogo tem ${dados.erros.length} erro(s) nos dados. Rode "npm run validar" para ver os detalhes.`);
  }
  const { site, produtos } = dados;

  // Fotos e imagens de compartilhamento de cada produto.
  for (const produto of produtos) {
    produto.fotos = [];
    for (const [i, arquivo] of produto.arquivosFotos.entries()) {
      produto.fotos.push(await processarFoto(arquivo, {
        nomeBase: produto.slug,
        alt: i === 0 ? `Perfume ${produto.nome}, da ${produto.linhaRotulo}` : `Perfume ${produto.nome} — foto ${i + 1}`,
      }));
    }
    delete produto.arquivosFotos; // caminhos locais não vão para o site
    const subtitulo = [produto.linhaRotulo, produto.familiaRotulo].filter(Boolean).join(' · ');
    produto.imagemOg = await gerarImagemOg({
      nomeBase: produto.slug,
      titulo: produto.nome,
      subtitulo,
      foto: produto.fotos[0]?.arquivoJpeg || null,
    });
    for (const foto of produto.fotos) delete foto.arquivoJpeg;
    produto.busca = normalizar([produto.nome, produto.familia, ...produto.todasNotas].join(' '));
  }
  for (const produto of produtos) {
    produto.relacionados = relacionados(produto, produtos).map((p) => p.slug);
  }

  // Imagens da marca (todas opcionais).
  const logo = acharArquivoDeMarca(['logo.svg', 'logo.png', 'logo.webp']);
  let abertura = null;
  if (site.abertura?.imagem) {
    const arquivo = path.join(PASTA_MARCA, site.abertura.imagem);
    if (fs.existsSync(arquivo)) {
      abertura = await processarFoto(arquivo, { nomeBase: 'abertura', alt: site.abertura.imagemAlt || '', larguras: [600, 1000, 1600] });
    } else console.warn(`⚠️  Aviso: site.json → abertura.imagem "${site.abertura.imagem}" não existe em src/assets/marca/.`);
  }
  let fotoSobre = null;
  if (site.sobre?.foto) {
    const arquivo = path.join(PASTA_MARCA, site.sobre.foto);
    if (fs.existsSync(arquivo)) {
      fotoSobre = await processarFoto(arquivo, { nomeBase: 'sobre', alt: site.sobre.fotoAlt || '', larguras: [600, 1000, 1600] });
    } else console.warn(`⚠️  Aviso: site.json → sobre.foto "${site.sobre.foto}" não existe em src/assets/marca/.`);
  }
  const imagemOgPadrao = await gerarImagemOg({ nomeBase: 'aligva', titulo: 'Perfumaria artesanal', subtitulo: 'Extratos produzidos em pequena escala em Santa Catarina' });
  await gerarIcones();
  limparCache();

  // Agrupamentos usados nas páginas.
  const porSlug = Object.fromEntries(produtos.map((p) => [p.slug, p]));
  const agrupar = (lista) => ORDEM_GENEROS
    .map((genero) => ({ genero, rotulo: GENEROS_PLURAL[genero], produtos: lista.filter((p) => p.genero === genero) }))
    .filter((g) => g.produtos.length);

  const secoes = ['linha-aligva', 'encomenda']
    .map((linha) => ({ linha, rotulo: LINHAS[linha], grupos: agrupar(produtos.filter((p) => p.linha === linha)) }))
    .filter((s) => s.grupos.length);

  const familias = [...new Map(produtos.filter((p) => p.familia).map((p) => [p.familia, p.familiaRotulo])).entries()]
    .map(([valor, rotulo]) => ({ valor, rotulo }))
    .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));

  const precos = produtos.flatMap((p) => p.precos.map((x) => x.preco));
  const limites = site.faixasPreco || [];
  const faixas = [];
  limites.forEach((limite, i) => {
    const de = i === 0 ? 0 : limites[i - 1] + 1;
    faixas.push({ valor: `${de}-${limite}`, de, ate: limite });
  });
  if (limites.length) faixas.push({ valor: `${limites[limites.length - 1] + 1}-`, de: limites[limites.length - 1] + 1, ate: null });

  return {
    produtos,
    porSlug,
    secoes,
    linhaAligva: produtos.filter((p) => p.linha === 'linha-aligva'),
    encomendas: agrupar(produtos.filter((p) => p.linha === 'encomenda')),
    destaques: produtos.filter((p) => p.destaque),
    novidades: produtos.filter((p) => p.novo),
    familias,
    generos: ORDEM_GENEROS.map((valor) => ({ valor, rotulo: GENEROS[valor] })),
    faixasPreco: precos.length ? faixas.filter((f) => precos.some((v) => v >= f.de && (f.ate === null || v <= f.ate))) : [],
    temPrecos: precos.length > 0,
    marca: { logo: logo ? `/assets/marca/${path.basename(logo)}` : null, abertura, fotoSobre, imagemOgPadrao },
    atualizadoEm: new Date(),
  };
}
