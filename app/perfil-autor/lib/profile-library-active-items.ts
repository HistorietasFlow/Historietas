import type { AbaBibliotecaPerfil, ItemBibliotecaPerfil } from "../types";
import { mesclarItensBibliotecaPerfil } from "./library-normalizers";

export function selecionarItensBibliotecaPerfil({
  aba,
  queroLer,
  lendoAgora,
  favoritas,
  concluidas,
  salvos,
  historico,
}: {
  aba: AbaBibliotecaPerfil;
  queroLer: ItemBibliotecaPerfil[];
  lendoAgora: ItemBibliotecaPerfil[];
  favoritas: ItemBibliotecaPerfil[];
  concluidas: ItemBibliotecaPerfil[];
  salvos: ItemBibliotecaPerfil[];
  historico: ItemBibliotecaPerfil[];
}): ItemBibliotecaPerfil[] {
  switch (aba) {
    case "quero-ler":
      return queroLer;
    case "lendo-agora":
      return lendoAgora;
    case "favoritas":
      return favoritas;
    case "concluidas":
      return concluidas;
    case "salvos":
      return salvos;
    case "historico":
      return historico;
    default:
      return mesclarItensBibliotecaPerfil(
        queroLer, lendoAgora, favoritas, concluidas, salvos, historico,
      );
  }
}
