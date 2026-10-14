// Página do produto: galeria de fotos, foto ampliada, tamanho/quantidade,
// "Adicionar à sacola", link do WhatsApp e compartilhamento.
import { formatarPreco } from './lib/formato.js';
import { linkWhatsApp, montarMensagemProduto } from './lib/whatsapp.js';
import { avisar } from './aviso.js';

const html = document.documentElement;

/* ---------- Galeria ---------- */
const galeria = document.querySelector('[data-galeria]');
const trilho = galeria?.querySelector('[data-trilho]');
const slides = trilho ? [...trilho.querySelectorAll('[data-slide]')] : [];
const status = galeria?.querySelector('[data-galeria-status]');
const miniaturas = galeria ? [...galeria.querySelectorAll('[data-miniatura]')] : [];
const ampliada = galeria?.querySelector('[data-ampliada]');
const imagemAmpliada = ampliada?.querySelector('[data-ampliada-img]');
const statusAmpliada = ampliada?.querySelector('[data-ampliada-status]');
let atual = 0;

function irPara(indice, { rolar = true } = {}) {
  if (!slides.length) return;
  atual = (indice + slides.length) % slides.length;
  if (rolar) {
    const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
    trilho.scrollTo({ left: slides[atual].offsetLeft, behavior: reduzir ? 'auto' : 'smooth' });
  }
  if (status) status.textContent = `Foto ${atual + 1} de ${slides.length}`;
  miniaturas.forEach((m, i) => m.setAttribute('aria-current', String(i === atual)));
  if (ampliada?.open) mostrarAmpliada();
}

function mostrarAmpliada() {
  const img = slides[atual].querySelector('img');
  imagemAmpliada.src = slides[atual].querySelector('a').getAttribute('href');
  imagemAmpliada.alt = img?.alt || '';
  if (statusAmpliada) statusAmpliada.textContent = `${atual + 1} de ${slides.length}`;
}

if (trilho && slides.length) {
  // Atualiza o indicador quando a pessoa arrasta (swipe) as fotos.
  let espera;
  trilho.addEventListener('scroll', () => {
    clearTimeout(espera);
    espera = setTimeout(() => {
      const indice = Math.round(trilho.scrollLeft / trilho.clientWidth);
      if (indice !== atual) irPara(indice, { rolar: false });
    }, 80);
  }, { passive: true });

  trilho.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); irPara(atual + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); irPara(atual - 1); }
  });
  galeria.querySelectorAll('.galeria__controles [data-anterior]').forEach((b) => b.addEventListener('click', () => irPara(atual - 1)));
  galeria.querySelectorAll('.galeria__controles [data-proxima]').forEach((b) => b.addEventListener('click', () => irPara(atual + 1)));
  miniaturas.forEach((m, i) => m.addEventListener('click', () => irPara(i)));

  // Foto ampliada (o <dialog> já cuida do foco e fecha com Esc).
  if (ampliada && typeof ampliada.showModal === 'function') {
    let origem = null;
    trilho.querySelectorAll('[data-ampliar]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        origem = link;
        atual = Number(link.dataset.ampliar);
        mostrarAmpliada();
        ampliada.showModal();
      });
    });
    ampliada.querySelector('[data-fechar-ampliada]').addEventListener('click', () => ampliada.close());
    ampliada.querySelector('[data-anterior]')?.addEventListener('click', () => irPara(atual - 1));
    ampliada.querySelector('[data-proxima]')?.addEventListener('click', () => irPara(atual + 1));
    ampliada.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') irPara(atual + 1);
      if (e.key === 'ArrowLeft') irPara(atual - 1);
    });
    ampliada.addEventListener('click', (e) => { if (e.target === ampliada) ampliada.close(); });
    ampliada.addEventListener('close', () => (origem || trilho).focus());
  }
}

/* ---------- Compra ---------- */
const form = document.querySelector('[data-form-compra]');
if (form) {
  const precos = Object.fromEntries((form.dataset.precos || '').split(',').filter(Boolean).map((p) => p.split(':').map(Number)));
  const precoAtual = form.querySelector('[data-preco-atual]');
  const quantidade = form.querySelector('input[name="quantidade"]');
  const linkWhats = form.querySelector('[data-whatsapp-produto]');
  const mostrarPrecos = html.dataset.mostrarPrecos === 'sim';

  const tamanho = () => Number(form.querySelector('input[name="tamanho"]:checked')?.value || 0);
  const qtd = () => Math.min(20, Math.max(1, Math.round(Number(quantidade?.value) || 1)));

  function atualizar() {
    if (precoAtual && precos[tamanho()]) precoAtual.textContent = formatarPreco(precos[tamanho()]);
    if (linkWhats && html.dataset.whatsapp) {
      const texto = montarMensagemProduto(form.dataset.nome, { tipo: form.dataset.tipo, tamanho: tamanho(), quantidade: qtd() });
      linkWhats.href = linkWhatsApp(html.dataset.whatsapp, texto);
    }
  }

  form.addEventListener('change', atualizar);
  quantidade?.addEventListener('input', atualizar);
  form.querySelectorAll('[data-qtd]').forEach((botao) => {
    botao.addEventListener('click', () => {
      quantidade.value = Math.min(20, Math.max(1, qtd() + Number(botao.dataset.qtd)));
      atualizar();
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { adicionar, abrirSacola } = await import('./sacola.js');
    adicionar({
      slug: form.dataset.slug,
      nome: form.dataset.nome,
      tamanho: tamanho(),
      quantidade: qtd(),
      preco: mostrarPrecos ? (precos[tamanho()] ?? null) : null,
      imagem: form.dataset.imagem || '',
    });
    abrirSacola();
  });

  atualizar();
}

/* ---------- Compartilhar ---------- */
document.querySelector('[data-compartilhar]')?.addEventListener('click', async () => {
  const dados = { title: document.title, url: location.href.split('?')[0] };
  if (navigator.share) {
    try { await navigator.share(dados); } catch { /* a pessoa cancelou */ }
    return;
  }
  try {
    await navigator.clipboard.writeText(dados.url);
    avisar('Link copiado');
  } catch {
    window.prompt('Copie o link do perfume:', dados.url);
  }
});
