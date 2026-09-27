export function obterPosicaoAtualArrasteComentariosComunidade(
  posicaoToque: number | undefined,
  posicaoInicial: number
) {
  return posicaoToque || posicaoInicial;
}

export function calcularDeslocamentoArrasteComentariosComunidade(
  limiteSuperior: number,
  limiteInferior: number,
  posicaoAtual: number,
  posicaoInicial: number
) {
  return Math.max(
    limiteSuperior,
    Math.min(limiteInferior, posicaoAtual - posicaoInicial)
  );
}

export function deveIgnorarCliqueAposArrasteComunidade(deslocamento: number) {
  return Math.abs(deslocamento) > 6;
}
