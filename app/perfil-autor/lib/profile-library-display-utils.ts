import type { AbaBibliotecaPerfil, ItemBibliotecaPerfil } from "../types";

export function encontrarItemBibliotecaMenuAberto(
  itens: ItemBibliotecaPerfil[],
  chave: string,
): ItemBibliotecaPerfil | null {
  if (!chave) {
    return null;
  }

  return itens.find((item) => item.chave === chave) || null;
}

export function obterRotuloBibliotecaPerfil(aba: AbaBibliotecaPerfil) {
  switch (aba) {
    case "tudo":
      return "todos os itens";
    case "quero-ler":
      return "quero ler";
    case "lendo-agora":
      return "lendo agora";
    case "favoritas":
      return "na lista";
    case "concluidas":
      return "concluídas";
    case "salvos":
      return "capítulos salvos";
    case "historico":
      return "histórico";
  }
}


export function obterRotuloAcaoRemoverBibliotecaPerfil(
  aba: AbaBibliotecaPerfil,
) {
  if (aba === "lendo-agora") {
    return "Parar leitura";
  }

  if (aba === "historico") {
    return "Limpar histórico";
  }

  return "Remover";
}


export function obterMetaMenuBibliotecaPerfil(
  item: ItemBibliotecaPerfil,
) {
  const totalCapitulos = item.obra.capitulos.length;
  const progresso = Math.max(
    0,
    Math.min(100, Math.round(item.obra.progressoLeitura || 0)),
  );

  const rotuloTipo =
    item.tipoDiario === "lendo"
      ? "Lendo"
      : item.tipoDiario === "favorita"
        ? "Favorita"
        : item.tipoDiario === "concluida"
          ? "Concluída"
          : item.tipoDiario === "quero_ler"
            ? "Quero ler"
            : "Biblioteca";

  const detalheLeitura = item.capitulo
    ? `Capítulo ${item.numeroCapitulo || 1} de ${totalCapitulos || 1}`
    : totalCapitulos > 0
      ? `${totalCapitulos} ${totalCapitulos === 1 ? "capítulo" : "capítulos"}`
      : "Obra";

  return `${rotuloTipo} • ${detalheLeitura} • ${progresso}% concluído`;
}
