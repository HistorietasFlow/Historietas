export function deveExibirControlesBuscaComunidade(
  buscaComunidadeAberta: boolean,
  termoBusca: string
) {
  return buscaComunidadeAberta || Boolean(termoBusca.trim());
}

export function deveExibirResultadosBuscaComunidade(
  termoBuscaNormalizado: string
) {
  return Boolean(termoBuscaNormalizado);
}
