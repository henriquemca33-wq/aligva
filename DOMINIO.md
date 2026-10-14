# Domínio próprio: `catalogo.aligva.com.br`

Por padrão, o catálogo fica em `https://<usuario>.github.io/aligva-catalogo/`. Este guia aponta o **subdomínio** `catalogo.aligva.com.br` para ele.

> ⚠️ **Importante:** o domínio principal **`aligva.com.br` continua na Nuvemshop e não deve ser alterado.** Não mexa nos registros que já existem (o `@`, o `www` e os de e-mail). Você só vai **criar um registro novo**, para o subdomínio `catalogo`.

## 1. Criar o registro CNAME no Registro.br

1. Entre em [registro.br](https://registro.br) com a conta dona do domínio `aligva.com.br`.
2. Em **Domínios**, clique em `aligva.com.br`.
3. Procure a seção **DNS** e clique em **Editar zona** (ou **Configurar zona DNS**).
   - Se o DNS do domínio estiver em outro serviço (por exemplo, a própria Nuvemshop ou o Cloudflare), o registro deve ser criado **lá**, e não no Registro.br. O passo é o mesmo.
4. Clique em **Nova entrada** e preencha:

   | campo | valor |
   |---|---|
   | Tipo | `CNAME` |
   | Nome | `catalogo` |
   | Dados / Destino | `<usuario>.github.io` (troque `<usuario>` pelo nome da conta ou organização do GitHub dona do repositório, **sem** `/aligva-catalogo`) |

5. Salve. A propagação pode levar de alguns minutos até 24 horas.

## 2. Configurar no GitHub

1. No repositório, vá em **Settings → Pages**.
2. Em **Build and deployment → Source**, confirme que está **GitHub Actions**.
3. Em **Custom domain**, digite `catalogo.aligva.com.br` e clique em **Save**. O GitHub verifica o DNS, o que pode demorar alguns minutos.
4. Quando a verificação passar, marque **Enforce HTTPS**. Se a opção estiver cinza, espere o certificado ficar pronto (até algumas horas) e tente de novo.

## 3. Arquivo `CNAME` no site

No `src/_data/site.json`, preencha:

```json
"url": "https://catalogo.aligva.com.br",
"dominioProprio": "catalogo.aligva.com.br",
```

Com isso, o build gera o arquivo `CNAME` dentro do site publicado. Na publicação via GitHub Actions, o que vale é a configuração do passo 2, e o arquivo serve de registro. Os endereços do site (links, sitemap, imagens de compartilhamento) passam a usar o domínio próprio automaticamente: o GitHub Actions informa o endereço certo para o build.

## 4. Conferir

- Abra `https://catalogo.aligva.com.br`: o catálogo deve aparecer com cadeado (HTTPS).
- Abra `https://aligva.com.br`: a **loja** continua funcionando normalmente.
- O endereço antigo (`<usuario>.github.io/aligva-catalogo/`) passa a redirecionar para o novo.

## Problemas comuns

| sintoma | causa provável |
|---|---|
| "DNS check unsuccessful" no GitHub | o registro ainda não propagou ou o destino está errado (deve ser `<usuario>.github.io`, sem barra). Espere e clique em **Check again**. |
| site sem estilo ou com links quebrados | o build antigo ainda está no ar. Rode a publicação de novo em **Actions → Publicar catálogo → Run workflow**. |
| "Enforce HTTPS" indisponível | o certificado ainda está sendo emitido. Aguarde algumas horas. |
| loja fora do ar | algum registro existente foi alterado por engano. Desfaça a mudança e mantenha **só** o novo `CNAME catalogo`. |
