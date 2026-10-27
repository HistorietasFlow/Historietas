export function criarMensagemErro(acao: string, erro: unknown) {
  if (!erro || typeof erro !== "object") {
    return `${acao}: erro desconhecido.`;
  }

  const registro = erro as {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
  };
  const detalhes = [
    registro.message,
    registro.code ? `código ${registro.code}` : "",
    registro.details,
    registro.hint,
  ]
    .filter(Boolean)
    .join(" · ");

  return detalhes ? `${acao}: ${detalhes}` : `${acao}: erro desconhecido.`;
}
