import { formatarDataCurta } from "./listas-format-utils";

type ItemPerfilTextoLista = {
  progresso: number;
  capituloAtual: string;
  data: string;
  categorias: string[];
  obra: {
    genero: string;
    formato: string;
  };
};

export function tituloSecaoPublica(secao: string, genero: string) {
  if (genero) {
    return genero;
  }

  if (secao === "recomendacoes") {
    return "Recomendações para você";
  }

  if (secao === "em-alta") {
    return "Em alta";
  }

  if (secao === "recentes") {
    return "Publicações recentes";
  }

  if (secao === "novos-capitulos") {
    return "Novos capítulos";
  }

  if (secao === "mais-curtidas") {
    return "Mais curtidas";
  }

  if (secao === "mais-comentadas") {
    return "Mais comentadas";
  }

  if (secao === "para-ler-agora") {
    return "Para ler agora";
  }

  if (secao === "autores") {
    return "Autores para conhecer";
  }

  return "Todas as obras";
}

export function rotuloCategoria(categoria: string) {
  const rotulos: Record<string, string> = {
    tudo: "Tudo",
    lendo: "Lendo",
    "quero-ler": "Quero ler",
    favoritas: "Favoritas",
    concluidas: "Concluídas",
    avaliacoes: "Avaliações",
    historico: "Histórico",
  };

  return rotulos[categoria] || "Tudo";
}

export function textoCategorias(categorias: string[]) {
  const ordem = [
    "lendo",
    "quero-ler",
    "favoritas",
    "concluidas",
    "avaliacoes",
    "historico",
  ];

  return ordem
    .filter((categoria) => categorias.includes(categoria))
    .map(rotuloCategoria)
    .join(" • ");
}

export function textoSecundarioItem(
  item: ItemPerfilTextoLista,
  categoria: string,
) {
  if (categoria === "lendo") {
    return `${item.progresso}% concluído${
      item.capituloAtual ? ` • ${item.capituloAtual}` : ""
    }`;
  }

  if (categoria === "historico") {
    return `Última leitura em ${formatarDataCurta(item.data)}${
      item.progresso ? ` • ${item.progresso}%` : ""
    }`;
  }

  if (categoria === "quero-ler") {
    return `Adicionada em ${formatarDataCurta(item.data)}`;
  }

  if (categoria === "favoritas") {
    return `Favoritada em ${formatarDataCurta(item.data)}`;
  }

  if (categoria === "concluidas") {
    return `Concluída em ${formatarDataCurta(item.data)}`;
  }

  return textoCategorias(item.categorias) || `${item.obra.genero} • ${item.obra.formato}`;
}
