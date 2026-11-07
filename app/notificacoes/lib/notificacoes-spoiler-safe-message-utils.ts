type MensagemSocialSemSpoilerParametros = {
  autorNome: string;
  contextoTitulo?: string;
  contextoSecundario?: string;
};

export function criarMensagemComentarioComunidadeSemSpoiler({
  autorNome,
}: MensagemSocialSemSpoilerParametros) {
  return `${autorNome} comentou na sua publicação.`;
}

export function criarMensagemComentarioCapituloSemSpoiler({
  autorNome,
}: MensagemSocialSemSpoilerParametros) {
  return `${autorNome} comentou em um capítulo.`;
}

export function criarMensagemReviewComunidadeSemSpoiler({
  autorNome,
  contextoTitulo,
}: MensagemSocialSemSpoilerParametros) {
  return `${autorNome} publicou uma review sobre ${contextoTitulo || "sua obra"}.`;
}

export function criarMensagemComentarioDiarioSemSpoiler({
  autorNome,
  contextoTitulo,
  contextoSecundario,
}: MensagemSocialSemSpoilerParametros) {
  const tipoAnotacao = contextoTitulo || "anotação";
  const obra = contextoSecundario ? ` sobre ${contextoSecundario}` : "";

  return `${autorNome} comentou na sua ${tipoAnotacao}${obra}.`;
}
