export function obterLimiteSuperiorArrasteComentariosComunidade(
  sheetExpandido: boolean
) {
  return sheetExpandido ? -46 : -58;
}

export function obterLimiteInferiorArrasteComentariosComunidade(
  sheetExpandido: boolean
) {
  return sheetExpandido ? 112 : 132;
}
