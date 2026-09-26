export function deveLimparBuscaUsuariosComunidade(
  buscaComunidadeAberta: boolean,
  termoLimpo: string
) {
  return !buscaComunidadeAberta || termoLimpo.length < 2;
}
