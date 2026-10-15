# Guia de edição do catálogo Aligva

Este guia é para quem **não programa**. Tudo pode ser feito pelo navegador, no site do GitHub, sem instalar nada.

> **Como funciona, em uma frase:** você altera um arquivo no GitHub → o GitHub refaz o site sozinho em uns 3 minutos → o catálogo atualizado aparece no ar.

---

## 🚫 O que NUNCA colocar no repositório

O repositório é **público**: qualquer pessoa pode abrir e ler todos os arquivos, inclusive a planilha inteira e o histórico de mudanças. Por isso, **nunca** coloque aqui:

- custos, margens, preços de compra, fornecedores;
- estoque real e quantidades;
- dados de clientes (nomes, telefones, endereços, pedidos);
- dados pessoais dos sócios, valores e números da empresa;
- senhas, tokens, chaves de acesso;
- nomes, logos ou fotos de **outras marcas de perfume**, em qualquer coluna, inclusive na `referencia`.

A coluna `referencia` **não aparece no site**, mas **aparece no GitHub**. Use nela só um código interno curto (ex.: `R-014`) e guarde o significado desse código numa planilha **privada**, fora daqui.

Também não use, em nenhum texto, as palavras "réplica", "cópia", "contratipo", "imitação", "barato", "preço baixo" ou "custo-benefício". O sistema bloqueia a publicação se encontrar alguma delas.

---

## 1. Editar os perfumes (a planilha)

Os perfumes ficam no arquivo **`src/_data/produtos.csv`**. Cada linha é um perfume.

### Passo a passo

1. Abra o repositório no GitHub e entre em `src` → `_data` → `produtos.csv`.
2. Clique no botão **⋯** (ou no ícone de download) e escolha **Download raw file** para baixar o arquivo.
3. Abra no **Excel** ou no **Google Planilhas**:
   - **Excel:** abra o arquivo normalmente. Se as colunas aparecerem todas juntas numa só, use *Dados → Texto para Colunas* com separador **ponto e vírgula**.
   - **Google Planilhas:** *Arquivo → Importar → Fazer upload*, separador "Detectar automaticamente".
4. Faça as alterações (veja as colunas abaixo).
5. Salve como CSV:
   - **Excel:** *Arquivo → Salvar como →* **CSV UTF-8 (delimitado por vírgulas)**. Use esse tipo, porque é ele que mantém os acentos.
   - **Google Planilhas:** *Arquivo → Fazer download →* **Valores separados por vírgula (.csv)**.
6. Renomeie o arquivo baixado para **`produtos.csv`**, se o nome tiver mudado.
7. No GitHub, volte para a pasta `src/_data`, clique em **Add file → Upload files**, arraste o `produtos.csv` e clique em **Commit changes**.

Pequenas correções podem ser feitas direto no GitHub: abra o `produtos.csv`, clique no **lápis ✏️ (Edit this file)**, altere e clique em **Commit changes**. Só cuide para não apagar nenhum `;`.

### As colunas

| coluna | o que colocar | exemplo |
|---|---|---|
| `slug` | endereço do perfume no site: minúsculas, sem acento, palavras separadas por hífen. **Não mude depois de publicado**, porque os links antigos quebram. | `flor-de-ambar` |
| `nome` | nome do perfume como o cliente vê | `Flor de Âmbar` |
| `linha` | `linha-aligva`, `encomenda` ou `exclusif` | `linha-aligva` |
| `genero` | `feminino`, `masculino` ou `compartilhavel` | `feminino` |
| `familia` | família olfativa (opcional) | `floral` |
| `notas_saida`, `notas_coracao`, `notas_fundo` | notas separadas por **barra vertical** `\|`, sempre em português ou pelo nome comercial | `bergamota\|pimenta-rosa` |
| `descricao_curta` | uma frase para o card, com até ~120 letras | |
| `descricao` | texto da página do perfume. Aceita `**negrito**` e `*itálico*`. | |
| `preco_50`, `preco_100` | preço em reais, **só o número inteiro** | `119` |
| `disponivel` | `sim`, `nao` (esgotado) ou `sob-encomenda` | `sim` |
| `destaque` | `sim` para aparecer em "Destaques" na página inicial | |
| `novo` | `sim` para o selo "Novo" | |
| `ordem` | número para ordenar (menor aparece primeiro) | `10` |
| `link_loja` | link do perfume na loja online (Nuvemshop). Cria o botão "Comprar na loja". | `https://aligva.com.br/produtos/...` |
| `fotos` | nomes das fotos, separados por `\|`. Se ficar vazio, usa todas as fotos da pasta. | `1-frasco.jpg\|2-caixa.jpg` |
| `referencia` | **uso interno, nunca aparece no site** (mas aparece no GitHub, veja o aviso acima) | `R-014` |
| `exemplo` | `sim` só nos produtos de exemplo | |
| `publicar` | `sim` para aparecer no site, `nao` para rascunho | `sim` |

> 💡 A barra vertical `|` fica no teclado brasileiro junto da tecla `\`, à esquerda do Z (use Shift).

Há um arquivo **`modelo-produtos.csv`** na raiz do repositório com o cabeçalho certo e uma linha de exemplo.

### Tarefas comuns

| quero… | faça assim |
|---|---|
| **esconder** um perfume | `publicar` = `nao` (a linha fica guardada como rascunho) |
| marcar como **esgotado** | `disponivel` = `nao` |
| marcar como **sob encomenda** | `disponivel` = `sob-encomenda` |
| colocar o selo **Novo** | `novo` = `sim` (e tire depois de um tempo) |
| colocar nos **destaques** da página inicial | `destaque` = `sim` (até 6 aparecem) |
| mudar a **ordem** | ajuste a coluna `ordem` (10, 20, 30… deixa espaço para encaixar outros depois) |
| mudar **preço** | altere `preco_50` / `preco_100`. Os preços da marca terminam em 9; outro final só gera um aviso. |
| **apagar** os exemplos | apague as linhas com `exemplo` = `sim` (nomes começam com "EXEMPLO") |

---

## 2. Fotos dos perfumes

> **Situação atual:** ainda não há fotos novas. As fotos antigas mostram a embalagem antiga e **não devem ser usadas**. Enquanto isso, todos os perfumes aparecem com o quadro da marca: coroa em bronze, nome do perfume e família olfativa. Quando uma foto é enviada, ela substitui o quadro sozinha.

### Como as fotos devem ser nomeadas

Cada perfume tem uma pasta com o seu **slug** (a primeira coluna do CSV), com até três fotos:

```
src/assets/produtos/circe/circe-100ml.jpg   ← foto principal (aparece no card e no topo da página)
src/assets/produtos/circe/circe-50ml.jpg
src/assets/produtos/circe/circe-caixa.jpg
```

O site mostra as fotos nessa ordem (100 mL, 50 mL, caixa). Se faltar alguma, ele usa as que existirem.

### Passo a passo no GitHub

1. Entre em `src/assets/produtos/` no repositório.
2. Clique em **Add file → Upload files**.
3. **Arraste a pasta inteira** do perfume (ex.: a pasta `circe`, com as fotos dentro), não só as fotos soltas. O GitHub cria a pasta sozinho.
   - Para enviar várias de uma vez, arraste várias pastas juntas.
4. Clique em **Commit changes** e acompanhe a publicação na aba **Actions** (seção 4).

**Recomendações:**

- formato **JPG**;
- **vertical, proporção 4:5**, com pelo menos **1600 × 2000 pixels**;
- fundo claro (branco ou off-white), combinando com o site;
- nomes exatamente como acima: minúsculas, sem acento, sem espaço;
- não precisa diminuir o tamanho: o site gera versões leves sozinho;
- **somente fotos próprias da Aligva, com a embalagem nova**.

### Logo e coroa

Ficam em `src/assets/marca/`: `logo.svg` (bronze, cabeçalho e PDF), `logo-preto.svg`, `logo-branco.svg` e `coroa.svg` (ícone do site). Os PNG originais estão guardados em `recursos/marca/`. Para trocar o logo, substitua o arquivo **com o mesmo nome**.

---

## 3. WhatsApp, Instagram, textos e configurações

Tudo fica em **`src/_data/site.json`**. Para editar: abra o arquivo no GitHub → **lápis ✏️** → altere → **Commit changes**.

⚠️ Cuidado com a pontuação: mantenha as **aspas** `"` em volta dos textos e as **vírgulas** no fim das linhas. Se o site não publicar depois de uma edição, é quase sempre uma vírgula ou aspa faltando (veja a seção 5).

| o quê | onde no `site.json` | exemplo |
|---|---|---|
| **número do WhatsApp** | `"whatsapp"` → `"numero"`: 55 + DDD + número, só dígitos | `"5548991390993"` |
| mensagem inicial do WhatsApp | `"whatsapp"` → `"mensagemInicial"` | |
| **Instagram** | `"instagram"` → `"usuario"`: sem @ | `"usealigva"` |
| mostrar ou esconder preços | `"mostrarPrecos"`: `true` ou `false` | `true` |
| frete grátis acima de | `"freteGratisAcima"`: `null` (desligado) ou o valor | `null` ou `399` |
| frase e texto da abertura | `"abertura"` → `"frase"`, `"texto"` | |
| foto da abertura | `"abertura"` → `"imagem"` (arquivo em `src/assets/marca/`) e `"imagemAlt"` (descrição) | `"abertura.jpg"` |
| **prazo das encomendas** | `"linhas"` → `"encomendas"` → `"prazoProducao"` | `"até 15 dias úteis"` |
| **nome da linha autoral** | `"linhaAutoral"` → `"nome"` e `"status"` | `"Exclusif"`, `"Em breve"` |
| textos do Sobre | `"sobre"` → `"quemSomos"`, `"historia"`, `"processo"` | |
| prazo de envio | `"envio"` → `"prazo"` | |
| afirmações permitidas | `"afirmacoes"`: só se a Aligva tiver como comprovar (ex.: registro na Anvisa) | `["vegano"]` |
| estatísticas sem cookies | `"analytics"` → `"ativo": true`, `"provedor"` e o código | |
| fontes próprias | `"fontes"` → `"origem": "proprias"` (veja abaixo) | |

### O que é `PREENCHER`?

Campos com a palavra **`PREENCHER`** ainda não foram definidos. Enquanto estiverem assim, o bloco correspondente **simplesmente não aparece no site**: nada de "PREENCHER" na tela. Quando você troca pelo texto certo, o bloco aparece sozinho.

### Perguntas frequentes

Ficam em **`src/_data/faq.json`**. Uma pergunta com `"resposta": "PREENCHER"` não aparece até ser respondida. Para incluir uma nova, copie um bloco `{ "pergunta": "...", "resposta": "..." }`, cole antes do `]` final e lembre da vírgula entre os blocos.

### Fontes próprias da marca (opcional)

Só use se a Aligva tiver **licença de uso na web** das fontes.

1. Envie os arquivos `.woff2` para `src/assets/fontes/`.
2. No `site.json`, em `"fontes"`, troque `"origem": "google"` por `"origem": "proprias"` e preencha, por exemplo:

```json
"proprias": {
  "titulo": { "familia": "Nome da Fonte Serifada", "arquivos": [ { "arquivo": "serifada-regular.woff2", "peso": 400 } ] },
  "texto":  { "familia": "Nome da Fonte Sem Serifa", "arquivos": [ { "arquivo": "sem-serifa-regular.woff2", "peso": 400 } ] }
}
```

---

## 4. Como saber se a publicação deu certo

1. Depois de salvar (**Commit changes**), clique na aba **Actions** do repositório.
2. A publicação mais recente aparece no topo, chamada **"Publicar catálogo"**:
   - 🟡 **bolinha amarela girando:** está trabalhando (leva uns 3 a 5 minutos);
   - ✅ **verde:** publicado! Atualize o site (no celular, puxe a tela para baixo);
   - ❌ **vermelha:** deu erro e **o site antigo continua no ar**, nada quebrou.

## 5. Deu erro (❌). E agora?

1. Clique na publicação com ❌ e depois em **"Validar, gerar e testar"**.
2. Abra o passo que ficou vermelho (geralmente **"Validar planilha e configuração"**). A mensagem diz **o que** está errado e **onde**, por exemplo:

   ```
   ❌ Erro: Linha 7, coluna "genero": valor "unissex" não é permitido. Use: feminino, masculino ou compartilhavel.
   ```

   A "Linha 7" é a linha 7 do CSV, contando o cabeçalho como linha 1.
3. Corrija o arquivo e salve de novo. A publicação recomeça sozinha.

Erros comuns:

| mensagem | solução |
|---|---|
| `não foi possível ler o arquivo` (site.json) | falta uma vírgula ou aspa. Cole o conteúdo em [jsonlint.com](https://jsonlint.com) para achar a linha. |
| `faltam as colunas obrigatórias` | o cabeçalho do CSV mudou. Copie a primeira linha do `modelo-produtos.csv`. |
| `repete o slug da linha…` | dois perfumes com o mesmo `slug`. Cada um precisa de um diferente. |
| `tem centavos` | escreva só o número inteiro: `119`, não `119,90`. |
| `contém termo que não pode ser usado` | reescreva o texto sem a palavra indicada. |
| `produto de exemplo… PRODUCAO=true` | apague as linhas de exemplo do CSV. |

**Avisos** (⚠️ amarelos) não impedem a publicação. São só lembretes, como preço que não termina em 9, foto não encontrada ou campo `PREENCHER`.

Se não conseguir resolver, copie a mensagem de erro e envie para quem cuida do site.

---

## 6. Catálogo em PDF

O PDF é **gerado automaticamente** a cada publicação e fica disponível no link **"Catálogo em PDF"** do menu e do rodapé (`/catalogo-aligva.pdf`). Ele está sempre igual ao site.

Para gerar na hora, pelo navegador:

1. Abra a página **Versão para impressão** (link no rodapé do site).
2. Toque em **Baixar PDF**.
3. Na janela de impressão, em **Destino**, escolha **Salvar como PDF** e clique em **Salvar**.
   - No computador, deixe **Margens: Padrão** e marque **Gráficos de plano de fundo**.
   - No iPhone, use **Compartilhar → Imprimir** e, na prévia, abra com dois dedos (gesto de "zoom") para salvar como PDF.

---

## 7. Antes de divulgar

Confira o **[CHECKLIST-LANCAMENTO.md](CHECKLIST-LANCAMENTO.md)**.
