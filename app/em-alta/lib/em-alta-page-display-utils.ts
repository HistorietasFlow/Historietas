export function obterObrasFavoritasProtegidasEmAlta(
  usuarioLogado: boolean,
  obrasFavoritas: string[],
) {
  return usuarioLogado ? obrasFavoritas : [];
}

export function obterObrasConcluidasProtegidasEmAlta(
  usuarioLogado: boolean,
  obrasConcluidas: string[],
) {
  return usuarioLogado ? obrasConcluidas : [];
}

export function obterTituloCabecalhoEmAlta(
  carregandoRanking: boolean,
  rankingTemAtividadeReal: boolean,
) {
  return carregandoRanking
    ? "ISTORIETAS"
    : rankingTemAtividadeReal
      ? "ISTORIETAS POPULARES"
      : "ISTORIETAS PUBLICADAS";
}
