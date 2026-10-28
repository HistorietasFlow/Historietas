export function erroEhRegistroDuplicadoEmBreve(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const registro = error as { code?: unknown; message?: unknown };
  const codigo = typeof registro.code === "string" ? registro.code : "";
  const mensagem =
    typeof registro.message === "string" ? registro.message.toLowerCase() : "";

  return codigo === "23505" || mensagem.includes("duplicate");
}
