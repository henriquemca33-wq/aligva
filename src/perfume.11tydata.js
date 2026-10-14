// Dados calculados de cada página de perfume: título, descrição, imagem de
// compartilhamento e dados estruturados (schema.org Product + Offer + BreadcrumbList).
const DISPONIBILIDADE_SCHEMA = {
  sim: 'https://schema.org/InStock',
  nao: 'https://schema.org/OutOfStock',
  'sob-encomenda': 'https://schema.org/MadeToOrder',
};

const absoluta = (site, caminho) => `${site.urlBase}${caminho}`;

function listaNotas(produto) {
  const notas = produto.todasNotas;
  if (notas.length === 0) return '';
  if (notas.length === 1) return notas[0];
  return `${notas.slice(0, -1).join(', ')} e ${notas[notas.length - 1]}`;
}

export default {
  eleventyComputed: {
    title: (data) => data.produto.nome,
    imagemOg: (data) => data.produto.imagemOg,
    tipoOg: 'product',
    description: (data) => {
      const p = data.produto;
      const partes = [`${p.nome}: perfume ${p.generoRotulo.toLowerCase()} da ${p.linhaRotulo === 'Encomendas' ? 'Aligva, sob encomenda' : p.linhaRotulo}.`];
      if (p.todasNotas.length) partes.push(`Notas de ${listaNotas(p)}.`);
      if (p.descricaoCurta) partes.push(p.descricaoCurta);
      return partes.join(' ');
    },
    dadosEstruturados: (data) => {
      const { produto: p, site } = data;
      const url = absoluta(site, `/perfume/${p.slug}/`);
      const imagens = p.fotos.length ? p.fotos.map((f) => absoluta(site, f.src)) : [absoluta(site, p.imagemOg)];
      const produto = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: p.nome,
        url,
        image: imagens,
        brand: { '@type': 'Brand', name: site.nome },
        category: `Perfume ${p.generoRotulo.toLowerCase()}`,
        description: p.descricaoCurta || (p.todasNotas.length ? `Notas de ${listaNotas(p)}.` : `${p.nome}, da ${p.linhaRotulo}.`),
      };
      if (site.mostrarPrecos && p.precos.length) {
        produto.offers = p.precos.map((x) => ({
          '@type': 'Offer',
          name: `${p.nome} ${x.tamanho} mL`,
          price: String(x.preco),
          priceCurrency: 'BRL',
          availability: DISPONIBILIDADE_SCHEMA[p.disponivel],
          itemCondition: 'https://schema.org/NewCondition',
          url,
        }));
      }
      const trilha = [
        { nome: 'Início', url: absoluta(site, '/') },
        { nome: 'Catálogo', url: absoluta(site, '/catalogo/') },
      ];
      if (p.linha === 'encomenda') trilha.push({ nome: 'Encomendas', url: absoluta(site, '/encomendas/') });
      trilha.push({ nome: p.nome, url });
      return [produto, {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: trilha.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.nome, item: t.url })),
      }];
    },
  },
};
