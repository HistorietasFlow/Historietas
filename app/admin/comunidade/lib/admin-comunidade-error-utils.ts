export function criarMensagemErro(acao: string, erro: unknown) {
  if (!erro || typeof erro !== "object") {
    return `${acao}: erro desconhecido.`;
  }

  const supabaseErro = erro as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };

  const detalhes = [
    supabaseErro.message,
    supabaseErro.code ? `código ${supabaseErro.code}` : "",
    supabaseErro.details,
    supabaseErro.hint,
  ]
    .filter(Boolean)
    .join(" · ");

  return detalhes ? `${acao}: ${detalhes}` : `${acao}: erro desconhecido.`;
}

export function erroOpcionalIgnoravel(erro: unknown) {
  if (!erro || typeof erro !== "object") {
    return false;
  }

  const supabaseErro = erro as { code?: string; message?: string };
  const codigo = supabaseErro.code || "";
  const mensagem = (supabaseErro.message || "").toLowerCase();

  return (
    codigo === "42P01" ||
    codigo === "42703" ||
    mensagem.includes("does not exist") ||
    mensagem.includes("schema cache") ||
    mensagem.includes("could not find")
  );
}
