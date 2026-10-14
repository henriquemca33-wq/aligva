# Relatório de entrega: catálogo Aligva

## O que foi construído

Site estático em Eleventy 3, com fonte de dados em planilha CSV, publicado no GitHub Pages por GitHub Actions. Tudo em português.

- **Início:** abertura com frase de posicionamento e dois botões, faixa de diferenciais, destaques, novidades, bloco das linhas (Linha Aligva, Encomendas, Exclusif "Em breve") e "Como comprar" em 3 passos.
- **Catálogo:** grade de cards; filtros combináveis (linha, gênero, família, disponibilidade, faixa de preço); busca instantânea por nome **e por nota**, sem diferenciar acentos e maiúsculas; ordenação; estado na URL (`?genero=feminino&nota=baunilha`); contagem anunciada por `aria-live`; mensagem e botão de limpar quando nada é encontrado. Sem JavaScript, mostra todos os perfumes agrupados por linha e gênero.
- **Produto:** galeria acessível (setas, teclado, swipe e foto ampliada com Esc), pirâmide olfativa em HTML/CSS (cada nota leva ao catálogo filtrado por ela), tamanho e quantidade, sacola, "Pedir agora pelo WhatsApp" com a mensagem pronta, "Comprar na loja" quando há `link_loja`, selo "Extrato · quase 30% de fragrância" na Linha Aligva, "Você também pode gostar", trilha de navegação e compartilhar (Web Share API, com cópia do link como alternativa).
- **Sacola:** gaveta (`<dialog>`) com itens, quantidades, subtotal e observações; envio pelo WhatsApp com a mensagem formatada. Fica salva em `localStorage` dentro de `try/catch`, e confere nomes e preços atuais no `produtos.json`. Sem número de WhatsApp configurado, envia por e-mail.
- **Encomendas, Sobre, Como comprar (com FAQ em `<details>`), Privacidade, 404.**
- **Catálogo para impressão** (`/catalogo-impressao/`) em A4, com capa, índice, grade por linha e gênero, contracapa e numeração de páginas. O **PDF** (`catalogo-aligva.pdf`) é gerado automaticamente no deploy com o Chromium headless e fica linkado no menu e no rodapé.
- **SEO:** título e descrição por página, canonical, Open Graph e Twitter Cards, **imagem 1200×630 gerada por produto**, schema.org (`Organization`, `Product` + `Offer` em BRL com disponibilidade, `BreadcrumbList`), `sitemap.xml`, `robots.txt`, favicons e `manifest.webmanifest`.
- **Proteções:** `referencia` nunca é publicada (lista fechada de campos + teste); `PREENCHER` nunca é publicado (o bloco some e o build falha se a palavra vazar); termos proibidos e afirmações regulatórias bloqueiam a publicação; nenhum rastreamento ativo (GoatCounter e Plausible prontos, desligados).

## Testes e qualidade

| verificação | resultado |
|---|---|
| `npm run validar` | ✅ sem erros (11 avisos, todos de campos `PREENCHER`) |
| `npm test` (33 testes) | ✅ 33/33: CSV com `;`, `,` e BOM; slug; preço; mensagem do WhatsApp com e sem preços; ausência de `referencia` e de `PREENCHER` em todo o `_site/`; termos proibidos; "quase 30%"; nenhum rastreador |
| `npm run checar-links` | ✅ 288 links internos, 0 quebrados (testado também com o prefixo `/aligva-catalogo/`) |
| `html-validate` | ✅ 0 erros |
| Playwright (celular Pixel 7 + computador) | ✅ 10/10: home, filtro por gênero, busca por nota, `?nota=`, produto → sacola → link `wa.me` conferido, Esc fecha a gaveta, sacola persiste após recarregar, 404, impressão |
| Lighthouse (celular, local) | Desempenho 99–100 · Acessibilidade 100 · Boas práticas 100 · SEO 100 (início, catálogo, Circe, encomendas) |

Observações: o Lighthouse rodou num servidor local com só 6 produtos, então os números reais no GitHub Pages podem variar um pouco. No CI, ele roda num job separado que só reporta e não bloqueia.

## Abertura: 3 opções de frase

1. **"Perfumaria artesanal brasileira, em concentração de extrato."** ← **usada no site**
2. "Extratos produzidos em pequena escala, em Santa Catarina."
3. "Perfume com quase 30% de fragrância. Feito em pequena escala."

A opção 1 apresenta a marca e o diferencial técnico sem falar de preço. Para trocar, edite `site.json → abertura.frase`.

## Rascunho do "Sobre" (sem inventar fatos)

> A Aligva é uma perfumaria artesanal brasileira. Produzimos nossos perfumes em pequena escala, em Santa Catarina.
>
> A Linha Aligva reúne fragrâncias com nomes próprios, todas em concentração de extrato, com quase 30% de fragrância, em frascos de 50 mL e 100 mL.
>
> Além da linha, produzimos perfumes sob encomenda, organizados em femininos, masculinos e compartilháveis. E uma linha autoral está em desenvolvimento.
>
> Nossas embalagens são brancas, em papel com textura vergê.

O que só os donos podem escrever (fica oculto até ser preenchido): quem são os fundadores, quando e por que a marca começou, como é o processo de produção.

## Pendências para os donos (todos os `PREENCHER` e decisões)

**`src/_data/site.json`**
- `whatsapp.numero`: número do WhatsApp. Sem ele, os botões de WhatsApp somem e a sacola envia por e-mail.
- `instagram.usuario`
- `linhas.encomendas.prazoProducao`: prazo de produção das encomendas
- `sobre.quemSomos`, `sobre.historia`, `sobre.processo`
- `envio.prazo`
- `freteGratisAcima`: decidir (hoje `null`, desligado)
- `dominioProprio` / `url`: quando o `catalogo.aligva.com.br` for configurado
- `linhaAutoral.nome`: "Exclusif" é provisório

**`src/_data/faq.json`**: respostas para prazo das encomendas, formas de pagamento, prazo de entrega e trocas/devoluções.

**`src/_data/produtos.csv`**
- **Circe:** preços (vazios, aparece "Valor sob consulta"); **gênero** (cadastrei `feminino`, confirmar); **família** (cadastrei `floral`, confirmar); disponibilidade (cadastrei `sim`).
- Cadastrar os ~33 perfumes da Linha Aligva e as encomendas.
- Apagar os 5 produtos `EXEMPLO` e depois criar a variável `PRODUCAO=true` no GitHub.

**Arquivos:** logo (`src/assets/marca/logo.svg`), fotos dos perfumes e, opcionalmente, fotos da abertura e do Sobre.

## Decisões tomadas por bom senso

- **Fontes:** Cormorant Garamond (títulos), uma serifada de alto contraste, típica da perfumaria de nicho, e Jost (texto), geométrica, limpa e muito legível no celular. Há mecanismo pronto para fontes próprias (`site.json → fontes`).
- **Paleta:** branco `#FFFFFF`; papel `#F8F6F1` (eco da embalagem vergê); tinta `#1F1D1A` (preto suave e quente); cinza `#5E5A54` (6,9:1); dourado `#B08D57`, só decorativo (3,1:1, nunca em texto); **dourado-texto `#7D6135`** (5,8:1, passa AA) para textos dourados.
- **Sem WhatsApp configurado**, o pedido sai por e-mail para `atendimento@aligva.com.br`, para o site nunca ficar sem saída.
- **Sem preço cadastrado**, os dois tamanhos são oferecidos e a mensagem diz "valor a confirmar".
- **Exclusif:** produtos com `linha=exclusif` são ignorados (com aviso) enquanto a linha estiver "Em breve".
- **Imagens de compartilhamento:** geradas com as fontes da marca. Com foto, a foto aparece à direita.
- **Ícones:** WhatsApp e Instagram aparecem como ícones genéricos (balão de conversa e câmera), sem logos de terceiros.
- **Coluna `referencia`:** como o repositório é público, ela fica visível no GitHub, embora nunca no site. O validador avisa se ela tiver algo além de um código curto.

## Próximos passos sugeridos (não implementados)

1. Ler o CSV direto de uma **planilha do Google publicada em CSV**, com publicação agendada (ex.: diária) pelo Actions. Assim os sócios editam só no Google Planilhas.
2. Páginas próprias por linha e por família olfativa (`/linha-aligva/`, `/familia/floral/`), boas para SEO.
3. Versão em inglês.
4. Analytics sem cookies (GoatCounter), já pronto para ligar.
5. Página da linha Exclusif quando ela for lançada.
6. QR code no PDF apontando para o catálogo online.
