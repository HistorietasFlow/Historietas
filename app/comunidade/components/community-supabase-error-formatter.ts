export function formatarErroSupabase(acao: string, erro: unknown) {
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
