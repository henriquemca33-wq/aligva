# Checklist de lançamento

Marque cada item antes de divulgar o catálogo (bio do Instagram, mensagens para clientes, PDF).

## Configuração (`src/_data/site.json`)

- [ ] **WhatsApp** (`whatsapp.numero`) no formato `55` + DDD + número, só dígitos. Sem ele, os botões de WhatsApp não aparecem e a sacola envia o pedido por e-mail.
- [ ] Mensagem inicial do WhatsApp revisada (`whatsapp.mensagemInicial`).
- [ ] **Instagram** (`instagram.usuario`), sem @.
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

- [ ] Todos os perfumes da Linha Aligva cadastrados (cerca de 33).
- [ ] Encomendas cadastradas, em femininos, masculinos e compartilháveis.
- [ ] **Circe:** conferir gênero (cadastrado como `feminino`), família (cadastrada como `floral`), disponibilidade e **preços** (ainda vazios, aparece "Valor sob consulta").
- [ ] **Preços** conferidos, todos terminando em 9.
- [ ] Notas olfativas em português (ou nome comercial da matéria-prima).
- [ ] Coluna `referencia` só com códigos internos curtos, **nunca nomes de outras marcas** (o repositório é público).
- [ ] **Produtos de exemplo apagados** (linhas com `EXEMPLO` no nome / `exemplo=sim`).
- [ ] Depois de apagar os exemplos: criar a variável **`PRODUCAO` = `true`** em *Settings → Secrets and variables → Actions → Variables*. Isso impede que um exemplo volte por engano.
- [ ] `link_loja` preenchido nos perfumes que existem na Nuvemshop.

## Imagens

- [ ] Fotos de cada perfume em `src/assets/produtos/<slug>/` (verticais 4:5, ≥ 1600×2000 px).
- [ ] Logo em `src/assets/marca/logo.svg` (ou `.png`).
- [ ] (Opcional) foto da abertura e foto do "Sobre".

## Publicação

- [ ] *Settings → Pages → Source:* **GitHub Actions**.
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
