type CategoriaArquivoAdicionarCapitulo =
  | "texto"
  | "documento"
  | "imagem"
  | "outro";

type CapituloSupabaseParaNormalizar = {
  id: string;
  titulo: string | null;
  texto: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
};

type CapituloLocalComplementar = {
  curtiu?: unknown;
  salvo?: unknown;
  comentario?: string;
  lido?: unknown;
  lidoEm?: string;
};

export function normalizarCategoriaSupabase(
  categoria: string | null
): CategoriaArquivoAdicionarCapitulo {
  if (
    categoria === "texto" ||
    categoria === "documento" ||
    categoria === "imagem" ||
    categoria === "outro"
  ) {
    return categoria;
  }

  return "outro";
}

export function normalizarCapituloSupabase(
  capitulo: CapituloSupabaseParaNormalizar,
  index: number,
  capituloLocal?: CapituloLocalComplementar
) {
  return {
    id: capitulo.id,
    titulo: capitulo.titulo?.trim() || `Capítulo ${index + 1}`,
    texto: capitulo.texto || "",
    curtiu: Boolean(capituloLocal?.curtiu),
    salvo: Boolean(capituloLocal?.salvo),
    comentario: capituloLocal?.comentario || "",
    criadoEm: capitulo.criado_em || "",
    lido: Boolean(capituloLocal?.lido),
    lidoEm: capituloLocal?.lidoEm || "",
    publicado: Boolean(capitulo.publicado),
    ordem:
      typeof capitulo.ordem === "number" &&
      Number.isInteger(capitulo.ordem) &&
      capitulo.ordem >= 1
        ? capitulo.ordem
        : index + 1,
  };
}
