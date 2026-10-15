# Checklist de lançamento

Marque cada item antes de divulgar o catálogo (bio do Instagram, mensagens para clientes, PDF).

## Configuração (`src/_data/site.json`)

- [x] **WhatsApp** (`whatsapp.numero`): +55 48 99139-0993.
- [ ] Mensagem inicial do WhatsApp revisada (`whatsapp.mensagemInicial`).
- [x] **Instagram** (`instagram.usuario`): @usealigva.
- [ ] **Prazo de produção das encomendas** (`linhas.encomendas.prazoProducao`).
- [ ] Prazo de envio (`envio.prazo`), se fizer sentido mostrar.
- [ ] Frete grátis: decidir. Deixar `null` (desligado) ou colocar o valor em `freteGratisAcima`.
- [ ] Mostrar preços no site? (`mostrarPrecos`: `true`/`false`)
- [ ] Nome da linha autoral confirmado (`linhaAutoral.nome`, hoje "Exclusif", provisório).
- [ ] Frase e texto da abertura escolhidos (`abertura.frase`, `abertura.texto`).
- [ ] Endereço do site (`url`) e, se for usar, `dominioProprio`. Veja o [DOMINIO.md](DOMINIO.md).

## Textos

- [ ] "Sobre": `sobre.quemSomos`, `sobre.historia`, `sobre.processo`, só com fatos verdadeiros.
- [ ] Perguntas frequentes (`src/_data/faq.json`): responder pagamento, prazo de entrega, trocas e prazo das encomendas, ou deixar como estão (não aparecem).
- [ ] Nenhuma afirmação de saúde ou regulatória sem comprovação. Se houver, cadastrar em `afirmacoes`.

## Produtos (`src/_data/produtos.csv`)

- [x] Todos os perfumes da Linha Aligva cadastrados (34).
- [x] Encomendas: por enquanto sem lista; a página explica e convida a perguntar pelo WhatsApp. Para listar perfumes depois, cadastre linhas com `linha` = `encomenda`.
- [x] **Circe:** feminino, floriental, disponível, R$ 109 (50 mL) e R$ 179 (100 mL).
- [x] **Preços** terminando em 9 (conferidos pela validação). Vale uma última revisão de valores.
- [ ] Notas olfativas em português (ou nome comercial da matéria-prima).
- [x] Coluna `referencia` vazia. Se for usar, só códigos internos curtos, **nunca nomes de outras marcas** (o repositório é público).
- [x] **Produtos de exemplo apagados.**
- [x] Modo produção ligado por padrão no deploy: um produto de exemplo publicado por engano impede a publicação.
- [ ] `link_loja` preenchido nos perfumes que existem na Nuvemshop.

## Imagens

- [ ] Fotos novas de cada perfume (embalagem nova) em `src/assets/produtos/<slug>/<slug>-100ml.jpg`, `-50ml.jpg`, `-caixa.jpg`. Até lá, o site usa o quadro da marca.
- [x] Logo e coroa em `src/assets/marca/` (versão 2026 fina, bronze).
- [ ] (Opcional) foto da abertura e foto do "Sobre".

## Publicação

- [x] *Settings → Pages → Source:* **GitHub Actions**.
- [ ] Última publicação em **Actions** com ✅ verde.
- [ ] Nenhum aviso importante no passo "Validar planilha e configuração".
- [ ] (Opcional) domínio `catalogo.aligva.com.br` configurado, com **Enforce HTTPS** ativo.

## Teste no celular (5 minutos)

- [ ] Abrir o site pelo link da bio do Instagram.
- [ ] Buscar uma nota (ex.: "baunilha") no catálogo.
- [ ] Filtrar por gênero.
- [ ] Abrir um perfume, escolher o tamanho e adicionar à sacola.
- [ ] Enviar o pedido pelo WhatsApp e conferir se a mensagem chega certinha no número da Aligva.
- [ ] Tocar em "Pedir agora pelo WhatsApp" e em "Comprar na loja".
- [ ] Abrir o **Catálogo em PDF** e conferir capa, índice, preços e contatos.
- [ ] Compartilhar o link de um perfume no WhatsApp e ver se a prévia (imagem e título) aparece.
