export function erroTabelaOpcionalComunidadeIgnoravel(erro: unknown) {
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
