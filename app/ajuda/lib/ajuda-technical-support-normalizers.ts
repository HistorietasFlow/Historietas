import {
  CATEGORIAS_PROBLEMA_TECNICO,
  type CategoriaProblemaTecnico,
  type ProblemaTecnicoResumo,
  type ProblemaTecnicoRpcRow,
  type StatusProblemaTecnico,
} from "./ajuda-technical-support";

export function textoSeguro(
  valor: unknown,
  fallback = "",
) {
  return typeof valor === "string" &&
    valor.trim()
    ? valor.trim()
    : fallback;
}

export function normalizarCategoriaProblemaTecnico(
  valor: unknown,
): CategoriaProblemaTecnico {
  const categorias =
    new Set<CategoriaProblemaTecnico>(
      CATEGORIAS_PROBLEMA_TECNICO.map(
        (item) => item.valor,
      ),
    );

  return categorias.has(
    valor as CategoriaProblemaTecnico,
  )
    ? (valor as CategoriaProblemaTecnico)
    : "outro";
}

export function normalizarStatusProblemaTecnico(
  valor: unknown,
): StatusProblemaTecnico {
  return valor === "aberto" ||
    valor === "em_analise" ||
    valor === "aguardando_usuario" ||
    valor === "resolvido" ||
    valor === "fechado"
    ? valor
    : "aberto";
}

export function normalizarProblemasTecnicos(
  registros: ProblemaTecnicoRpcRow[],
): ProblemaTecnicoResumo[] {
  return registros
    .map((item) => ({
      id: textoSeguro(
        item.problema_id,
      ),
      categoria:
        normalizarCategoriaProblemaTecnico(
          item.categoria,
        ),
      titulo: textoSeguro(
        item.titulo,
        "Problema técnico",
      ),
      descricao: textoSeguro(
        item.descricao,
      ),
      paginaUrl: textoSeguro(
        item.pagina_url,
      ),
      status:
        normalizarStatusProblemaTecnico(
          item.status,
        ),
      prioridade: textoSeguro(
        item.prioridade,
        "normal",
      ),
      observacaoAdmin: textoSeguro(
        item.observacao_admin,
      ),
      criadoEm: textoSeguro(
        item.criado_em,
      ),
      atualizadoEm: textoSeguro(
        item.atualizado_em,
      ),
    }))
    .filter((item) =>
      Boolean(item.id)
    );
}
