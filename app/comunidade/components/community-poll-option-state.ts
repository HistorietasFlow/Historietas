export function obterLarguraResultadoOpcaoEnqueteComunidade(
  usuarioVotouNaEnquete: boolean,
  totalVotos: number,
  selecionada: boolean,
  porcentagem: number
): string {
  return usuarioVotouNaEnquete && totalVotos > 0
    ? `${porcentagem}%`
    : usuarioVotouNaEnquete && selecionada
      ? "100%"
      : "0%";
}

export function obterTextoStatusOpcaoEnqueteComunidade(
  usuarioVotouNaEnquete: boolean,
  selecionada: boolean,
  totalVotos: number,
  porcentagem: number,
  postEstaSendoVotado: boolean
): string {
  return usuarioVotouNaEnquete
    ? selecionada
      ? `${totalVotos > 0 ? porcentagem : 100}%`
      : `${porcentagem}%`
    : postEstaSendoVotado
      ? "..."
      : "Votar";
}

export function deveDesabilitarOpcaoEnqueteComunidade(
  votoAtual: string,
  votandoEnqueteId: string | null,
  postId: string
): boolean {
  return Boolean(votoAtual) || votandoEnqueteId === postId;
}
