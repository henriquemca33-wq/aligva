// Script principal: menu do celular e utilidades comuns.
// Cada funcionalidade fica em seu próprio módulo e só é carregada quando a página precisa.

const menu = document.getElementById('menu');
const botaoMenu = document.querySelector('[data-botao-menu]');

if (menu && botaoMenu) {
  const fechar = () => {
    menu.classList.remove('aberto');
    botaoMenu.setAttribute('aria-expanded', 'false');
  };
  botaoMenu.addEventListener('click', () => {
    const aberto = menu.classList.toggle('aberto');
    botaoMenu.setAttribute('aria-expanded', String(aberto));
    if (aberto) menu.querySelector('a')?.focus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('aberto')) {
      fechar();
      botaoMenu.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (menu.classList.contains('aberto') && !menu.contains(e.target) && !botaoMenu.contains(e.target)) fechar();
  });
}

// Carrega a sacola em todas as páginas (contador no cabeçalho).
import('./sacola.js');

// Módulos específicos de cada página.
if (document.querySelector('[data-catalogo]')) import('./catalogo.js');
if (document.querySelector('[data-produto-pagina]')) import('./produto.js');
