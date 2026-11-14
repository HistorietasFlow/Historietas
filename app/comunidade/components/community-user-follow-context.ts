export type ContextoSeguimentoComunidade = {
  usuarioId: string;
  vigente: () => boolean;
  alteracoes: Map<string, boolean>;
  idsCarregados: string[] | null;
};

export function aplicarAlteracoesSeguimentoComunidade(
  ids: string[],
  alteracoes: Map<string, boolean>
) {
  const resultado = new Set(ids);
  alteracoes.forEach((seguindo, id) => {
    if (seguindo) resultado.add(id);
    else resultado.delete(id);
  });
  return Array.from(resultado);
}
