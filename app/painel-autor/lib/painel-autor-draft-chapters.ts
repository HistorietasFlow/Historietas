export type RascunhosCapitulosPainel = {
  total: number;
  primeiro: { id: string; titulo: string } | null;
};

export type ConfirmacaoRascunhosPainel = {
  usuarioId: string;
  porObra: ReadonlyMap<string, RascunhosCapitulosPainel>;
};

// Somente linhas remotas da paginação concluída, antes da mescla com cache.
// Não ordenar novamente nem deduzir número/última edição pela posição.
export function confirmarRascunhosPainel(
  usuarioId: string,
  obras: { id: string; user_id?: string | null }[],
  capitulos: { id: string; obra_id: string; user_id?: string | null; publicado?: boolean | null; titulo: string | null }[],
): ConfirmacaoRascunhosPainel {
  const porObra = new Map<string, RascunhosCapitulosPainel>();
  if (!usuarioId) return { usuarioId, porObra };
  for (const obra of obras) {
    if (obra.user_id === usuarioId) porObra.set(obra.id, { total: 0, primeiro: null });
  }
  for (const capitulo of capitulos) {
    const resumo = porObra.get(capitulo.obra_id);
    if (!resumo) continue;
    if (!capitulo.id || capitulo.user_id !== usuarioId || typeof capitulo.publicado !== "boolean") {
      porObra.delete(capitulo.obra_id);
      continue;
    }
    if (capitulo.publicado === false) {
      resumo.total++;
      resumo.primeiro ??= { id: capitulo.id, titulo: capitulo.titulo?.trim() || "Capítulo sem título" };
    }
  }
  return { usuarioId, porObra };
}
