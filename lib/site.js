// Carrega e prepara o src/_data/site.json.
// Regra: qualquer texto com "PREENCHER" vira null (o bloco correspondente não é
// renderizado) e gera um aviso no build.
import fs from 'node:fs';
import path from 'node:path';

export const MARCADOR = 'PREENCHER';

/**
 * Percorre um valor (objeto, lista ou texto) trocando "PREENCHER" por null.
 * Em listas, itens que contêm algum PREENCHER são removidos por inteiro
 * (ex.: uma pergunta do FAQ sem resposta não aparece).
 * @param {any} valor
 * @param {string} caminho  nome do campo, para a mensagem de aviso
 * @param {string[]} avisos lista que recebe os avisos
 */
export function limparPreencher(valor, caminho = '', avisos = []) {
  if (typeof valor === 'string') {
    if (valor.includes(MARCADOR)) {
      avisos.push(caminho || '(raiz)');
      return null;
    }
    return valor;
  }
  if (Array.isArray(valor)) {
    const resultado = [];
    valor.forEach((item, indice) => {
      const avisosItem = [];
      const limpo = limparPreencher(item, `${caminho}[${indice}]`, avisosItem);
      avisos.push(...avisosItem);
      if (avisosItem.length === 0) resultado.push(limpo);
    });
    return resultado;
  }
  if (valor && typeof valor === 'object') {
    const resultado = {};
    for (const [chave, item] of Object.entries(valor)) {
      if (chave.startsWith('_')) continue; // campos "_comentario" são só para quem edita
      resultado[chave] = limparPreencher(item, caminho ? `${caminho}.${chave}` : chave, avisos);
    }
    return resultado;
  }
  return valor;
}

/** Garante o formato "/", "/pasta/" etc. */
export function normalizarPrefixo(prefixo) {
  let p = String(prefixo || '/').trim();
  if (!p.startsWith('/')) p = `/${p}`;
  if (!p.endsWith('/')) p = `${p}/`;
  return p.replace(/\/{2,}/g, '/');
}

/**
 * Lê o site.json e aplica as variáveis de ambiente usadas no deploy:
 *  - SITE_URL     endereço público (o GitHub Actions informa automaticamente)
 *  - PATH_PREFIX  subpasta do site (ex.: /aligva-catalogo/)
 *  - SITE_WHATSAPP número usado só nos testes automáticos
 * @param {{ raiz?: string, env?: Record<string,string|undefined> }} [opcoes]
 */
export function carregarSite({ raiz = process.cwd(), env = process.env } = {}) {
  const arquivo = path.join(raiz, 'src', '_data', 'site.json');
  const bruto = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  const campos = [];
  const site = limparPreencher(bruto, '', campos);

  if (env.SITE_WHATSAPP) {
    site.whatsapp = { ...(site.whatsapp || {}), numero: env.SITE_WHATSAPP };
  }

  const url = new URL(env.SITE_URL || site.url || 'http://localhost:8080');
  const prefixoDaUrl = url.pathname && url.pathname !== '/' ? url.pathname : null;
  site.pathPrefix = normalizarPrefixo(env.PATH_PREFIX || prefixoDaUrl || site.pathPrefix || '/');
  site.origem = url.origin;
  // Endereço completo do site, sem barra final: https://exemplo.github.io/aligva-catalogo
  site.urlBase = `${url.origin}${site.pathPrefix}`.replace(/\/$/, '');

  if (site.whatsapp?.numero) {
    site.whatsapp.numero = String(site.whatsapp.numero).replace(/\D/g, '') || null;
  }

  // Analytics só fica ativo se tudo estiver preenchido.
  const a = site.analytics || {};
  site.analytics = {
    ...a,
    ativo: Boolean(a.ativo && ((a.provedor === 'goatcounter' && a.goatcounter) || (a.provedor === 'plausible' && a.plausible))),
  };

  return { site, avisos: campos.map((c) => `site.json → campo "${c}" ainda está como PREENCHER (o bloco não aparece no site).`) };
}

/** Lê um JSON de dados qualquer (ex.: faq.json) aplicando a mesma regra do PREENCHER. */
export function carregarJsonDeDados(arquivo) {
  const bruto = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  const campos = [];
  const dados = limparPreencher(bruto, '', campos);
  const nome = path.basename(arquivo);
  return { dados, avisos: campos.map((c) => `${nome} → "${c}" ainda está como PREENCHER (não aparece no site).`) };
}
