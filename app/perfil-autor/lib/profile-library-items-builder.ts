import type { DiarioPerfilItem, ObraLocal } from "../types";
import {
  converterCapitulosSalvosParaBiblioteca,
  converterItensDiarioParaBiblioteca,
} from "./library-normalizers";

export function montarItensBibliotecaPerfilAutor({
  bibliotecaPerfilVisivel,
  queroLer,
  lendoAgora,
  favoritas,
  concluidas,
  atividades,
  obras,
}: {
  bibliotecaPerfilVisivel: boolean;
  queroLer: DiarioPerfilItem[];
  lendoAgora: DiarioPerfilItem[];
  favoritas: DiarioPerfilItem[];
  concluidas: DiarioPerfilItem[];
  atividades: DiarioPerfilItem[];
  obras: ObraLocal[];
}) {
  if (!bibliotecaPerfilVisivel) {
    return {
      queroLer: [],
      lendoAgora: [],
      favoritas: [],
      concluidas: [],
      historico: [],
      salvos: [],
    };
  }

  const atividadesLeitura = atividades.filter(
    (item) => item.tipo === "lendo",
  );

  return {
    queroLer: converterItensDiarioParaBiblioteca(queroLer, "quero-ler"),
    lendoAgora: converterItensDiarioParaBiblioteca(
      lendoAgora,
      "lendo-agora",
    ),
    favoritas: converterItensDiarioParaBiblioteca(favoritas, "favorita"),
    concluidas: converterItensDiarioParaBiblioteca(concluidas, "concluida"),
    historico: converterItensDiarioParaBiblioteca(
      atividadesLeitura,
      "historico",
    ),
    salvos: converterCapitulosSalvosParaBiblioteca(obras),
  };
}
