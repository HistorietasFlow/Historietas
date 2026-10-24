type CategoriaArquivoObra = "texto" | "documento" | "imagem" | "outro";

type ArquivoObraLocalEdicaoObra = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: CategoriaArquivoObra;
  criadoEm: string;
};

type ObraArquivoSupabaseEdicaoObra = {
  arquivo_url?: string | null;
  arquivo_nome?: string | null;
  arquivo_tipo?: string | null;
  arquivo_tamanho?: number | null;
  arquivo_categoria?: string | null;
  criada_em?: string | null;
};

export function normalizarCategoriaArquivoSupabase(
  categoria: string | null | undefined
): CategoriaArquivoObra {
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

export function criarArquivoObraDeSupabase(
  obra: ObraArquivoSupabaseEdicaoObra,
  arquivoLocal?: ArquivoObraLocalEdicaoObra | null
): ArquivoObraLocalEdicaoObra | null {
  const conteudo = obra.arquivo_url?.trim() || arquivoLocal?.conteudo || "";
  const nome = obra.arquivo_nome?.trim() || arquivoLocal?.nome || "";

  if (!conteudo || !nome) {
    return arquivoLocal || null;
  }

  return {
    nome,
    tipo: obra.arquivo_tipo || arquivoLocal?.tipo || "",
    tamanho:
      typeof obra.arquivo_tamanho === "number" &&
      Number.isFinite(obra.arquivo_tamanho)
        ? obra.arquivo_tamanho
        : arquivoLocal?.tamanho || 0,
    conteudo,
    categoria: normalizarCategoriaArquivoSupabase(
      obra.arquivo_categoria || arquivoLocal?.categoria || "outro"
    ),
    criadoEm: obra.criada_em || arquivoLocal?.criadoEm || "",
  };
}

export function criarArquivoRemotoEdicaoObra(
  obra: ObraArquivoSupabaseEdicaoObra
): ArquivoObraLocalEdicaoObra | null {
  const conteudo = obra.arquivo_url?.trim() || "";
  const nome = obra.arquivo_nome?.trim() || "";

  if (!conteudo || !nome) {
    return null;
  }

  return {
    nome,
    tipo: obra.arquivo_tipo || "",
    tamanho:
      typeof obra.arquivo_tamanho === "number" &&
      Number.isFinite(obra.arquivo_tamanho)
        ? obra.arquivo_tamanho
        : 0,
    conteudo,
    categoria: normalizarCategoriaArquivoSupabase(obra.arquivo_categoria),
    criadoEm: obra.criada_em || "",
  };
}
