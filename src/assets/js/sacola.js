// Sacola de compras → pedido pelo WhatsApp (ou e-mail, se o WhatsApp não estiver configurado).
// Os itens ficam guardados no próprio aparelho (localStorage). Se o navegador bloquear
// o armazenamento, a sacola funciona só enquanto a página estiver aberta.
import { formatarPreco } from './lib/formato.js';
import { montarMensagemPedido, linkWhatsApp, linkEmail } from './lib/whatsapp.js';
import { avisar } from './aviso.js';

const CHAVE = 'aligva:sacola:v1';
const MAX_QTD = 20;
const html = document.documentElement;
const base = html.dataset.base || '/';
const mostrarPrecos = html.dataset.mostrarPrecos === 'sim';

const armazenamento = {
  ler() {
    try { return JSON.parse(window.localStorage.getItem(CHAVE) || 'null'); } catch { return null; }
  },
  gravar(valor) {
    try { window.localStorage.setItem(CHAVE, JSON.stringify(valor)); } catch { /* sem armazenamento: só memória */ }
  },
};

function limparItens(lista) {
  if (!Array.isArray(lista)) return [];
  return lista
    .filter((i) => i && typeof i.slug === 'string' && typeof i.nome === 'string')
    .map((i) => ({
      slug: i.slug,
      nome: i.nome,
      tamanho: Number(i.tamanho) || null,
      quantidade: Math.min(MAX_QTD, Math.max(1, Math.round(Number(i.quantidade) || 1))),
      preco: Number.isFinite(Number(i.preco)) && i.preco !== null ? Number(i.preco) : null,
      imagem: typeof i.imagem === 'string' ? i.imagem : '',
    }));
}

const salvo = armazenamento.ler() || {};
let itens = limparItens(salvo.itens);
let observacoes = typeof salvo.observacoes === 'string' ? salvo.observacoes : '';
let precosConferidos = false;

const ouvintes = new Set();
function mudou() {
  armazenamento.gravar({ itens, observacoes });
  for (const fn of ouvintes) fn(itens);
  renderizar();
}

/* ---------- API usada pelas outras páginas ---------- */
export function adicionar(item) {
  const existente = itens.find((i) => i.slug === item.slug && i.tamanho === item.tamanho);
  if (existente) existente.quantidade = Math.min(MAX_QTD, existente.quantidade + item.quantidade);
  else itens.push(...limparItens([item]));
  mudou();
  pulsar();
  avisar(`${item.nome} (${item.tamanho} mL) adicionado à sacola`);
}
export function obterItens() { return itens.map((i) => ({ ...i })); }
export function aoMudar(fn) { ouvintes.add(fn); }

/* ---------- Gaveta ---------- */
const dialogo = document.getElementById('sacola');
const lista = dialogo?.querySelector('[data-sacola-itens]');
const vazia = dialogo?.querySelector('[data-sacola-vazia]');
const rodape = dialogo?.querySelector('[data-sacola-rodape]');
const subtotal = dialogo?.querySelector('[data-sacola-subtotal]');
const campoObs = dialogo?.querySelector('[data-sacola-observacoes]');
const enviar = dialogo?.querySelector('[data-enviar-pedido]');
const contador = document.querySelector('[data-contador]');
const rotulo = document.querySelector('[data-sacola-rotulo]');

export function abrirSacola() {
  if (!dialogo) return;
  conferirPrecos();
  if (typeof dialogo.showModal === 'function') {
    if (!dialogo.open) dialogo.showModal();
  } else {
    dialogo.setAttribute('open', '');
  }
}
function fecharSacola() {
  if (dialogo?.open) dialogo.close();
}

function pulsar() {
  if (!contador) return;
  contador.classList.add('pulso');
  setTimeout(() => contador.classList.remove('pulso'), 220);
}

function mensagem() {
  return montarMensagemPedido(itens, { mostrarPrecos, observacoes });
}

function atualizarLinkEnvio() {
  if (!enviar) return;
  const texto = mensagem();
  if (enviar.dataset.canal === 'email') {
    enviar.href = linkEmail(html.dataset.email, 'Pedido pelo catálogo Aligva', texto);
  } else {
    enviar.href = linkWhatsApp(html.dataset.whatsapp, texto);
  }
}

function criar(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

const ICONE = (d) => `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">${d}</svg>`;

function renderizar() {
  const total = itens.reduce((s, i) => s + i.quantidade, 0);
  if (contador) {
    contador.textContent = String(total);
    contador.toggleAttribute('data-vazio', total === 0);
  }
  if (rotulo) rotulo.textContent = total === 0 ? 'Sacola, vazia' : `Sacola, ${total} ${total === 1 ? 'item' : 'itens'}`;
  if (!dialogo) return;

  vazia.hidden = itens.length > 0;
  rodape.hidden = itens.length === 0;
  lista.replaceChildren();

  itens.forEach((item, indice) => {
    const li = criar('li', 'sacola__item');

    const foto = criar('div', 'sacola__item-foto');
    if (item.imagem) {
      const img = criar('img');
      img.src = item.imagem;
      img.alt = '';
      img.width = 64;
      img.height = 80;
      img.loading = 'lazy';
      foto.append(img);
    } else {
      foto.innerHTML = '<svg aria-hidden="true" focusable="false" viewBox="0 0 64 80"><rect width="64" height="80" fill="#fbfaf7"/><use href="#coroa-aligva" x="20" y="29" width="24" height="22" fill="#7e6741"/></svg>';
    }
    li.append(foto);

    const meio = criar('div');
    const titulo = criar('h3');
    const link = criar('a', '', item.nome);
    link.href = `${base}perfume/${item.slug}/`;
    titulo.append(link);
    meio.append(titulo);
    meio.append(criar('p', 'sacola__item-detalhe', item.tamanho ? `${item.tamanho} mL` : ''));

    const acoes = criar('div', 'sacola__item-acoes');
    const qtd = criar('div', 'quantidade quantidade--pequena');
    const menos = criar('button');
    menos.type = 'button';
    menos.innerHTML = `${ICONE('<path d="M5 12h14"/>')}<span class="visualmente-oculto">Diminuir quantidade de ${item.nome}</span>`;
    const campo = criar('input');
    campo.type = 'number';
    campo.min = '1';
    campo.max = String(MAX_QTD);
    campo.inputMode = 'numeric';
    campo.value = String(item.quantidade);
    campo.setAttribute('aria-label', `Quantidade de ${item.nome} ${item.tamanho} mL`);
    const mais = criar('button');
    mais.type = 'button';
    mais.innerHTML = `${ICONE('<path d="M12 5v14M5 12h14"/>')}<span class="visualmente-oculto">Aumentar quantidade de ${item.nome}</span>`;
    menos.addEventListener('click', () => {
      if (item.quantidade <= 1) return;
      item.quantidade -= 1;
      mudou();
      lista.children[indice]?.querySelectorAll('.quantidade button')[0]?.focus();
    });
    mais.addEventListener('click', () => {
      item.quantidade = Math.min(MAX_QTD, item.quantidade + 1);
      mudou();
      lista.children[indice]?.querySelectorAll('.quantidade button')[1]?.focus();
    });
    campo.addEventListener('change', () => {
      item.quantidade = Math.min(MAX_QTD, Math.max(1, Math.round(Number(campo.value) || 1)));
      mudou();
    });
    qtd.append(menos, campo, mais);

    const remover = criar('button', 'sacola__remover', 'Remover');
    remover.type = 'button';
    remover.setAttribute('aria-label', `Remover ${item.nome} ${item.tamanho} mL da sacola`);
    remover.addEventListener('click', () => {
      itens.splice(indice, 1);
      mudou();
      avisar(`${item.nome} removido da sacola`);
      const proximo = lista.querySelector('.sacola__remover') || dialogo.querySelector('[data-sacola-vazia] a');
      proximo?.focus();
    });
    acoes.append(qtd, remover);
    meio.append(acoes);
    li.append(meio);

    if (mostrarPrecos) {
      const valor = item.preco !== null ? formatarPreco(item.preco * item.quantidade) : 'a confirmar';
      li.append(criar('p', 'sacola__item-preco', valor));
    }
    lista.append(li);
  });

  if (subtotal) {
    const algumSemPreco = itens.some((i) => i.preco === null);
    const soma = itens.reduce((s, i) => s + (i.preco ?? 0) * i.quantidade, 0);
    subtotal.textContent = algumSemPreco ? `${formatarPreco(soma)} + a confirmar` : formatarPreco(soma);
  }
  if (campoObs && campoObs.value !== observacoes) campoObs.value = observacoes;
  atualizarLinkEnvio();
}

// Confere nomes e preços atuais (caso tenham mudado desde que o item foi adicionado).
async function conferirPrecos() {
  if (precosConferidos || itens.length === 0) return;
  precosConferidos = true;
  try {
    const resposta = await fetch(`${base}produtos.json`, { cache: 'no-cache' });
    if (!resposta.ok) return;
    const { produtos } = await resposta.json();
    const porSlug = new Map(produtos.map((p) => [p.slug, p]));
    let alterou = false;
    for (const item of itens) {
      const p = porSlug.get(item.slug);
      if (!p) continue;
      const preco = mostrarPrecos ? (p.precos.find((x) => x.tamanho === item.tamanho)?.preco ?? null) : null;
      if (p.nome !== item.nome || preco !== item.preco) {
        item.nome = p.nome;
        item.preco = preco;
        alterou = true;
      }
    }
    if (alterou) mudou();
  } catch { /* sem internet: mantém o que já estava na sacola */ }
}

if (dialogo) {
  document.querySelectorAll('[data-abrir-sacola]').forEach((b) => b.addEventListener('click', abrirSacola));
  dialogo.querySelectorAll('[data-fechar-sacola]').forEach((b) => b.addEventListener('click', fecharSacola));
  // Clique fora da gaveta (no fundo escurecido) fecha.
  dialogo.addEventListener('click', (e) => { if (e.target === dialogo) fecharSacola(); });
  campoObs?.addEventListener('input', () => {
    observacoes = campoObs.value.slice(0, 500);
    armazenamento.gravar({ itens, observacoes });
    atualizarLinkEnvio();
  });
  enviar?.addEventListener('click', () => atualizarLinkEnvio());
}

// Mantém várias abas sincronizadas.
window.addEventListener('storage', (e) => {
  if (e.key !== CHAVE) return;
  const novo = armazenamento.ler() || {};
  itens = limparItens(novo.itens);
  observacoes = typeof novo.observacoes === 'string' ? novo.observacoes : '';
  renderizar();
});

renderizar();
