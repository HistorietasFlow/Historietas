export function extrairPostIdSalvoComunidade(registro: Record<string, unknown>) {
  const valor = registro.post_id ?? registro.publicacao_id ?? registro.comunidade_post_id;

  return typeof valor === "string" && valor.trim() ? valor.trim() : "";
}
