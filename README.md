# Catálogo Aligva

Catálogo online estático da **Aligva**, perfumaria artesanal brasileira. É uma vitrine leve que mostra a linha completa com notas olfativas, recebe pedidos pelo WhatsApp, apresenta as encomendas e gera uma versão em PDF para imprimir ou enviar.

> A loja online continua sendo a Nuvemshop, em **aligva.com.br**. Este catálogo não a substitui: ele é publicado à parte, de graça, no GitHub Pages.

- **Quem não programa:** leia o [GUIA-DE-EDICAO.md](GUIA-DE-EDICAO.md). Lá estão todas as tarefas do dia a dia: produtos, fotos, preços e textos.
- **Antes de divulgar:** confira o [CHECKLIST-LANCAMENTO.md](CHECKLIST-LANCAMENTO.md).
- **Domínio próprio** (`catalogo.aligva.com.br`): veja o [DOMINIO.md](DOMINIO.md).

---

## ⚠️ Este repositório é público

O GitHub Pages gratuito exige que o repositório seja **público**. **Qualquer pessoa na internet pode ver todos os arquivos daqui**, inclusive o histórico de alterações e a planilha `produtos.csv` inteira (com a coluna `referencia`).

**Nunca coloque aqui:** custos, margens, fornecedores, estoque real, dados de clientes, dados dos sócios, valores da empresa, senhas ou nomes de marcas de terceiros. A coluna `referencia` do CSV não aparece no site, mas aparece no GitHub: use nela só códigos internos curtos (ex.: `R-014`) e guarde o significado deles numa planilha privada.

Se algo assim for enviado por engano, apagar o arquivo **não basta**, porque ele continua no histórico. Fale com quem cuida do repositório.

---

## Como funciona

```
produtos.csv + site.json + fotos  ──►  Eleventy (build)  ──►  _site/  ──►  GitHub Pages
```

1. Os produtos ficam em `src/_data/produtos.csv`, que é a fonte da verdade, e as configurações em `src/_data/site.json`.
2. A cada alteração na branch `main`, o GitHub Actions valida os dados, gera o site, as imagens otimizadas e o PDF, roda os testes e publica.
3. Se algo estiver errado, a publicação **não acontece** e o site antigo continua no ar.

### Tecnologias

- [Eleventy 3](https://www.11ty.dev/) com templates Nunjucks, gerando um site 100% estático.
- `csv-parse` para ler a planilha, aceitando `;` ou `,` e UTF-8 com ou sem BOM.
- `@11ty/eleventy-img` para gerar fotos em AVIF, WebP e JPEG em vários tamanhos. `sharp` gera as imagens de compartilhamento (1200×630) e os ícones.
- Um único CSS próprio, sem frameworks, e módulos JavaScript pequenos, sem React/Vue. O site funciona sem JavaScript.
- Playwright (Chromium) para o PDF do catálogo e para o teste de fumaça.

## Rodar no seu computador

Requisitos: [Node.js 22](https://nodejs.org/) (LTS).

```bash
npm install
npm run dev          # abre em http://localhost:8080 e atualiza a cada alteração
```

Comandos:

| comando | o que faz |
|---|---|
| `npm run validar` | confere `produtos.csv`, `site.json` e `faq.json` (erros e avisos em português) |
| `npm run build` | gera o site em `_site/` |
| `npm run gerar-pdf` | gera `_site/catalogo-aligva.pdf` a partir de `/catalogo-impressao/` (rode depois do build) |
| `npm test` | testes automáticos (CSV, slug, preço, WhatsApp, ausência de `referencia` e de `PREENCHER` no site) |
| `npm run checar-links` | procura links internos quebrados em `_site/` |
| `npm run validar-html` | valida o HTML gerado (`html-validate`) |
| `npm run teste-fumaca` | Playwright no celular e no computador: home, filtros, busca, produto, sacola, WhatsApp |
| `npm run verificar` | validar + build + testes + links + HTML, tudo de uma vez |

Para o PDF e o teste de fumaça é preciso o Chromium do Playwright (`npx playwright install chromium`). Se você já tiver um Chromium instalado, aponte para ele com `CHROMIUM_PATH=/caminho/do/chromium`.

Variáveis de ambiente (opcionais):

| variável | uso |
|---|---|
| `SITE_URL` | endereço público do site. O GitHub Actions preenche sozinho. |
| `PATH_PREFIX` | subpasta do site (ex.: `/aligva-catalogo/`). O GitHub Actions preenche sozinho. |
| `PRODUCAO` | `true` faz o build falhar se houver produto de exemplo publicado |
| `SITE_WHATSAPP` | número usado **só nos testes** automáticos |

## Estrutura de pastas

```
.github/workflows/deploy.yml   publicação automática (GitHub Actions → GitHub Pages)
eleventy.config.js             configuração do gerador, filtros e proteções
lib/                           leitura do CSV, validação, imagens (código do build)
scripts/                       validar, checar-links, gerar-pdf, servidor local
recursos/fontes-og/            fontes (licença OFL) usadas nas imagens de compartilhamento
src/
  _data/
    produtos.csv               ← os perfumes (editar aqui)
    site.json                  ← WhatsApp, Instagram, textos, preços visíveis etc.
    faq.json                   ← perguntas frequentes
    catalogo.js                monta os dados do site a partir do CSV
  _includes/                   layout, cabeçalho, rodapé, sacola, componentes
  assets/
    css/estilo.css             design system + todos os estilos
    js/                        principal, catálogo (filtros), produto, sacola
    js/lib/                    formatação e mensagem do WhatsApp (usados também nos testes)
    marca/                     logo (opcional), favicon, fotos de abertura/sobre
    produtos/<slug>/           fotos de cada perfume
    fontes/                    fontes próprias da marca (opcional)
  *.njk                        páginas
tests/unit/                    testes com o test runner do Node
tests/e2e/                     teste de fumaça (Playwright)
modelo-produtos.csv            planilha modelo
```

## Páginas

| endereço | conteúdo |
|---|---|
| `/` | abertura, diferenciais, destaques, novidades, linhas, como comprar |
| `/catalogo/` | todos os perfumes, com filtros, busca por nome **e por nota**, ordenação e estado na URL (`?genero=feminino&nota=baunilha`) |
| `/perfume/<slug>/` | galeria, pirâmide olfativa, tamanhos, sacola, WhatsApp, loja, relacionados |
| `/encomendas/` | perfumes sob pedido, em femininos, masculinos e compartilháveis |
| `/sobre/` | história da marca (os blocos aparecem quando preenchidos) |
| `/como-comprar/` | passo a passo, envio e perguntas frequentes |
| `/catalogo-impressao/` | versão A4 para imprimir e salvar em PDF |
| `/catalogo-aligva.pdf` | PDF gerado automaticamente a cada publicação |
| `/privacidade/`, `/404.html`, `/sitemap.xml`, `/robots.txt`, `/produtos.json` | |

## Publicar

1. Em **Settings → Pages → Build and deployment → Source**, escolha **GitHub Actions** (uma vez só).
2. Cada push na `main` publica automaticamente. Também dá para publicar manualmente em **Actions → Publicar catálogo → Run workflow**.
3. O endereço fica em `https://<usuario>.github.io/aligva-catalogo/` até o domínio próprio ser configurado ([DOMINIO.md](DOMINIO.md)).

## Proteções automáticas

- **`referencia` nunca é publicada.** Os produtos públicos são montados a partir de uma lista fechada de campos (`lib/produtos.js → montarProdutoPublico`), e um teste varre todo o `_site/` para garantir.
- **`PREENCHER` nunca é publicado.** Campos com `PREENCHER` viram "vazio" e o bloco correspondente não aparece. O build falha se a palavra chegar a alguma página.
- **Termos proibidos** ("réplica", "contratipo", "barato", "custo-benefício" etc.) e **afirmações regulatórias** (Anvisa, "hipoalergênico", "vegano"...) no CSV impedem a publicação. As afirmações só são permitidas se forem listadas em `site.json → afirmacoes`.
- **Sem rastreamento:** nenhum cookie, pixel ou analytics. Há suporte opcional, desligado, a GoatCounter ou Plausible (sem cookies) em `site.json → analytics`.
- A sacola usa `localStorage` sempre dentro de `try/catch`. Se o navegador bloquear, ela funciona só na memória da página.

## Licenças

Código do site: uso da Aligva. As fontes Cormorant Garamond e Jost, em `recursos/fontes-og/`, são distribuídas sob a SIL Open Font License 1.1 (textos de licença na mesma pasta).
