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
