import { obterLocaleDocumentoPerfilAutor } from "../translations";
import type { AutorPerfil, DiarioPerfilEstado, ObraLocal } from "../types";
import { pegarTexto } from "./data-normalizers";
import { colecaoTemObraPerfilBiblioteca } from "./library-normalizers";
import { criarItemDiarioPerfil } from "./profile-diary-item-utils";
import { ordenarItensDiarioPerfil } from "./profile-diary-merge-utils";

export function coletarObraIdsRegistrosDiarioPerfil(
  registros: Record<string, unknown>[],
) {
  return registros
    .map((registro) => pegarTexto(registro.obra_id ?? registro.obraId))
    .filter(Boolean);
}

export function dataDiarioPerfilFormatada(dataIso: string) {
  if (!dataIso) {
    return "Data não informada";
  }

  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return "Data não informada";
  }

  return data.toLocaleDateString(obterLocaleDocumentoPerfilAutor(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function montarDiarioPerfilLocal(
  perfil: AutorPerfil,
  obrasFavoritasIds: string[],
  obrasConcluidasIds: string[],
  obrasSeguidasIds: string[],
  obrasDisponiveis: ObraLocal[] = perfil.obras,
): Omit<DiarioPerfilEstado, "carregando"> {
  const obrasBiblioteca = obrasDisponiveis.length > 0 ? obrasDisponiveis : perfil.obras;

  const lendoAgora = ordenarItensDiarioPerfil(
    obrasBiblioteca
      .filter(
        (obra) =>
          obra.progressoLeitura > 0 &&
          !colecaoTemObraPerfilBiblioteca(obrasConcluidasIds, obra),
      )
      .map((obra) =>
        criarItemDiarioPerfil(
          "lendo",
          obra,
          obra.ultimaLeituraEm || obra.criadaEm,
          `Leitura em andamento • ${obra.progressoLeitura}% concluída`,
          { progresso: obra.progressoLeitura, visibilidade: "privado" },
        ),
      ),
  );

  const favoritas = ordenarItensDiarioPerfil(
    obrasBiblioteca
      .filter((obra) => colecaoTemObraPerfilBiblioteca(obrasFavoritasIds, obra))
      .map((obra) =>
        criarItemDiarioPerfil(
          "favorita",
          obra,
          obra.ultimaLeituraEm || obra.criadaEm,
          "Obra favoritada no perfil",
          { visibilidade: "parcial" },
        ),
      ),
  );

  const concluidas = ordenarItensDiarioPerfil(
    obrasBiblioteca
      .filter((obra) => colecaoTemObraPerfilBiblioteca(obrasConcluidasIds, obra))
      .map((obra) =>
        criarItemDiarioPerfil(
          "concluida",
          obra,
          obra.ultimaLeituraEm || obra.criadaEm,
          "Obra marcada como concluída",
          { visibilidade: "parcial" },
        ),
      ),
  );

  const queroLer = ordenarItensDiarioPerfil(
    obrasBiblioteca
      .filter(
        (obra) =>
          colecaoTemObraPerfilBiblioteca(obrasSeguidasIds, obra) &&
          !colecaoTemObraPerfilBiblioteca(obrasConcluidasIds, obra),
      )
      .map((obra) =>
        criarItemDiarioPerfil(
          "quero_ler",
          obra,
          obra.ultimaLeituraEm || obra.criadaEm,
          "Adicionada para acompanhar depois",
          { visibilidade: "publico" },
        ),
      ),
  );

  const atividades = ordenarItensDiarioPerfil([
    ...lendoAgora,
    ...favoritas,
    ...concluidas,
    ...queroLer,
  ]).slice(0, 8);

  return {
    lendoAgora,
    queroLer,
    favoritas,
    concluidas,
    avaliacoes: [],
    reviews: [],
    atividades,
  };
}
