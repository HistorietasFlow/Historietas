export function deveExpandirComentariosPorArrasteComunidade(
  deslocamento: number
) {
  return deslocamento < -34;
}

export function deveRecolherComentariosPorArrasteComunidade(
  deslocamento: number,
  sheetExpandido: boolean
) {
  return deslocamento > 52 && sheetExpandido;
}

export function deveFecharComentariosPorArrasteComunidade(
  deslocamento: number,
  sheetExpandido: boolean
) {
  return deslocamento > 118 && !sheetExpandido;
}
