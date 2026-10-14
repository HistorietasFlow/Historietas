export function normalizarQuemPodeComentarAnotacaoListas(
  valor: unknown,
  fallback: "herdar" | "todos" | "seguidores" | "ninguem" = "herdar",
) {
  return valor === "todos" ||
    valor === "seguidores" ||
    valor === "ninguem" ||
    valor === "herdar"
    ? valor
    : fallback;
}

export function normalizarVisibilidadeComentariosAnotacaoListas(
  valor: unknown,
  fallback: "herdar" | "publico" | "seguidores" | "somente_eu" = "herdar",
) {
  return valor === "publico" ||
    valor === "seguidores" ||
    valor === "somente_eu" ||
    valor === "herdar"
    ? valor
    : fallback;
}

export function normalizarQuemPodeAvaliarDiarioListas(valor: unknown) {
  return valor === "seguidores" || valor === "ninguem" || valor === "todos"
    ? valor
    : "todos";
}

export function normalizarVisibilidadeAnotacaoListas(
  valor: unknown,
  fallback: "publico" | "parcial" | "privado" = "privado",
) {
  return valor === "publico" || valor === "parcial" || valor === "privado"
    ? valor
    : fallback;
}

export function normalizarTipoDiarioListas(valor: unknown) {
  return valor === "lendo" ||
    valor === "quero_ler" ||
    valor === "favorita" ||
    valor === "concluida" ||
    valor === "avaliacao" ||
    valor === "review" ||
    valor === "atividade"
    ? valor
    : "";
}

export function obterTipoDiarioDoItemListas(
  categoria: string,
  item?: { categorias: string[] } | null,
) {
  const categoriaEfetiva =
    categoria === "tudo"
      ? [
          "lendo",
          "quero-ler",
          "favoritas",
          "concluidas",
          "avaliacoes",
          "historico",
        ].find((valor) => item?.categorias.includes(valor)) || "historico"
      : categoria;

  if (categoriaEfetiva === "lendo") return "lendo";
  if (categoriaEfetiva === "quero-ler") return "quero_ler";
  if (categoriaEfetiva === "favoritas") return "favorita";
  if (categoriaEfetiva === "concluidas") return "concluida";
  if (categoriaEfetiva === "avaliacoes") return "avaliacao";
  return "atividade";
}
