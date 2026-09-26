export function deveExibirControlesBuscaComunidade(
  buscaComunidadeAberta: boolean,
  termoBusca: string
) {
  return buscaComunidadeAberta || Boolean(termoBusca.trim());
}
