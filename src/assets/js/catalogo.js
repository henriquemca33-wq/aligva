// Filtros, busca e ordenação do catálogo.
// Sem JavaScript a página continua mostrando todos os perfumes agrupados por linha e gênero.
import { normalizar } from './lib/formato.js';

const raiz = document.querySelector('[data-catalogo]');
const form = raiz.querySelector('[data-filtros]');
const agrupado = raiz.querySelector('[data-agrupado]');
const resultados = raiz.querySelector('[data-resultados]');
const grade = raiz.querySelector('[data-grade]');
const vazio = raiz.querySelector('[data-vazio]');
const contagem = raiz.querySelector('[data-contagem]');
const botoesLimpar = raiz.querySelectorAll('[data-limpar]');
const filtroNota = raiz.querySelector('[data-filtro-nota]');
const filtroNotaTexto = raiz.querySelector('[data-filtro-nota-texto]');
const CAMPOS = ['q', 'linha', 'genero', 'familia', 'disponivel', 'preco', 'ordem'];

// Cópias dos cards para a visão "filtrada" (uma grade única, sem grupos).
const originais = [...agrupado.querySelectorAll('.card')];
const vistos = new Set();
const cards = [];
for (const original of originais) {
  if (vistos.has(original.dataset.produto)) continue;
  vistos.add(original.dataset.produto);
  const copia = original.cloneNode(true);
  const titulo = copia.querySelector('.card__nome');
  if (titulo && titulo.tagName !== 'H3') {
    const h3 = document.createElement('h3');
    h3.className = titulo.className;
    h3.innerHTML = titulo.innerHTML;
    titulo.replaceWith(h3);
  }
  cards.push(copia);
  grade.append(copia);
}

let nota = '';

function lerUrl() {
  const params = new URLSearchParams(location.search);
  for (const nome of CAMPOS) {
    const campo = form.elements[nome];
    if (!campo) continue;
    const valor = params.get(nome) || '';
    if (campo.tagName === 'SELECT' && valor && ![...campo.options].some((o) => o.value === valor)) continue;
    campo.value = valor;
  }
  nota = params.get('nota') || '';
}

function estado() {
  const e = {};
  for (const nome of CAMPOS) {
    const campo = form.elements[nome];
    if (campo && campo.value.trim()) e[nome] = campo.value.trim();
  }
  if (nota) e.nota = nota;
  return e;
}

function atualizarUrl(e) {
  const params = new URLSearchParams(e);
  const busca = params.toString();
  const url = `${location.pathname}${busca ? `?${busca}` : ''}${location.hash}`;
  history.replaceState(null, '', url);
}

function combina(card, e) {
  const d = card.dataset;
  if (e.linha && d.linha !== e.linha) return false;
  if (e.genero && d.genero !== e.genero) return false;
  if (e.familia && d.familia !== e.familia) return false;
  if (e.disponivel && d.disponivel !== e.disponivel) return false;
  if (e.preco) {
    const [de, ate] = e.preco.split('-').map((v) => (v === '' ? null : Number(v)));
    const preco = d.preco ? Number(d.preco) : null;
    if (preco === null) return false;
    if (de !== null && preco < de) return false;
    if (ate !== null && preco > ate) return false;
  }
  if (e.nota) {
    const alvo = normalizar(e.nota);
    if (!d.notas.split('|').some((n) => n.includes(alvo))) return false;
  }
  if (e.q) {
    const termos = normalizar(e.q).split(/\s+/).filter(Boolean);
    if (!termos.every((t) => d.busca.includes(t))) return false;
  }
  return true;
}

function ordenar(lista, ordem) {
  const porOrdem = (a, b) => Number(a.dataset.ordem) - Number(b.dataset.ordem) || a.dataset.nome.localeCompare(b.dataset.nome, 'pt-BR');
  const preco = (c) => (c.dataset.preco ? Number(c.dataset.preco) : Infinity);
  if (ordem === 'nome') return lista.sort((a, b) => a.dataset.nome.localeCompare(b.dataset.nome, 'pt-BR'));
  if (ordem === 'preco') return lista.sort((a, b) => preco(a) - preco(b) || porOrdem(a, b));
  if (ordem === 'preco-desc') return lista.sort((a, b) => (preco(b) === Infinity ? -1 : preco(b)) - (preco(a) === Infinity ? -1 : preco(a)) || porOrdem(a, b));
  return lista.sort(porOrdem);
}

function aplicar({ anunciar = true } = {}) {
  const e = estado();
  atualizarUrl(e);
  const ativos = Object.keys(e).filter((k) => k !== 'ordem');
  const filtrando = ativos.length > 0 || Boolean(e.ordem);

  filtroNota.hidden = !nota;
  filtroNotaTexto.textContent = nota;
  botoesLimpar[0].hidden = !filtrando;

  let total = cards.length;
  if (!filtrando) {
    agrupado.hidden = false;
    resultados.hidden = true;
    vazio.hidden = true;
  } else {
    const visiveis = [];
    for (const card of cards) {
      const ok = combina(card, e);
      card.hidden = !ok;
      if (ok) visiveis.push(card);
    }
    for (const card of ordenar(visiveis, e.ordem)) grade.append(card);
    total = visiveis.length;
    agrupado.hidden = true;
    resultados.hidden = total === 0;
    vazio.hidden = total !== 0;
  }

  const texto = total === 0 ? 'Nenhum perfume encontrado' : `${total} ${total === 1 ? 'perfume encontrado' : 'perfumes encontrados'}`;
  // Evita anunciar a contagem ao abrir a página (só quando a pessoa filtra).
  if (anunciar || contagem.textContent === '') contagem.textContent = texto;
}

let espera;
form.addEventListener('input', (evento) => {
  clearTimeout(espera);
  espera = setTimeout(aplicar, evento.target.type === 'search' ? 180 : 0);
});
form.addEventListener('submit', (evento) => {
  evento.preventDefault();
  aplicar();
});
for (const botao of botoesLimpar) {
  botao.addEventListener('click', () => {
    form.reset();
    nota = '';
    aplicar();
    form.elements.q.focus();
  });
}
raiz.querySelector('[data-remover-nota]').addEventListener('click', () => {
  nota = '';
  aplicar();
  form.elements.q.focus();
});

// No celular, os filtros ficam recolhidos atrás de um botão.
const alternar = form.querySelector('[data-alternar-filtros]');
function abrirFiltros(aberto) {
  form.classList.toggle('aberto', aberto);
  alternar.setAttribute('aria-expanded', String(aberto));
}
alternar.addEventListener('click', () => abrirFiltros(!form.classList.contains('aberto')));

lerUrl();
const inicial = estado();
if (Object.keys(inicial).some((k) => k !== 'q' && k !== 'nota')) abrirFiltros(true);
aplicar({ anunciar: false });
