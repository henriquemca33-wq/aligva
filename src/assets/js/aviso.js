// Mensagem curta que aparece na parte de baixo da tela e é anunciada por leitores de tela.
let temporizador;
export function avisar(texto) {
  const caixa = document.querySelector('[data-aviso-rapido]');
  if (!caixa) return;
  caixa.textContent = texto;
  caixa.classList.add('visivel');
  clearTimeout(temporizador);
  temporizador = setTimeout(() => caixa.classList.remove('visivel'), 2800);
}
