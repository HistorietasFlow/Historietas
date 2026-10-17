import {
  normalizarListaTexto,
  normalizarNomeAutor,
} from "./seguindo-format-utils";
import { normalizarObraSalva } from "./seguindo-saved-work-utils";
import {
  AUTHOR_FOLLOW_STORAGE_KEY,
  COMPLETED_STORAGE_KEY,
  FAVORITES_STORAGE_KEY,
  FOLLOW_STORAGE_KEY,
  STORAGE_KEY,
  lerJsonStorageUsuarioSeguindo,
} from "./seguindo-storage-utils";

type ObraSalvaEntrada = Record<string, unknown> & {
  capitulos?: Record<string, unknown>[];
};

export function carregarDadosLocaisSeguindo(userId: string) {
  try {
    const obrasJson = lerJsonStorageUsuarioSeguindo(STORAGE_KEY, userId);
    const seguindoJson = lerJsonStorageUsuarioSeguindo(
      FOLLOW_STORAGE_KEY,
      userId,
    );
    const autoresJson = lerJsonStorageUsuarioSeguindo(
      AUTHOR_FOLLOW_STORAGE_KEY,
      userId,
    );
    const favoritasJson = lerJsonStorageUsuarioSeguindo(
      FAVORITES_STORAGE_KEY,
      userId,
    );
    const concluidasJson = lerJsonStorageUsuarioSeguindo(
      COMPLETED_STORAGE_KEY,
      userId,
    );

    return {
      obras: Array.isArray(obrasJson)
        ? obrasJson.map((obra, obraIndex) =>
            normalizarObraSalva(obra as ObraSalvaEntrada, obraIndex),
          )
        : [],
      obrasSeguidas: Array.isArray(seguindoJson)
        ? normalizarListaTexto(
            seguindoJson.filter(
              (id): id is string => typeof id === "string",
            ),
          )
        : [],
      autoresSeguidos: Array.isArray(autoresJson)
        ? autoresJson
            .filter((autor): autor is string => typeof autor === "string")
            .map((autor) => normalizarNomeAutor(autor))
        : [],
      obrasFavoritas: Array.isArray(favoritasJson)
        ? normalizarListaTexto(
            favoritasJson.filter(
              (id): id is string => typeof id === "string",
            ),
          )
        : [],
      obrasConcluidas: Array.isArray(concluidasJson)
        ? normalizarListaTexto(
            concluidasJson.filter(
              (id): id is string => typeof id === "string",
            ),
          )
        : [],
    };
  } catch {
    return {
      obras: [],
      obrasSeguidas: [],
      autoresSeguidos: [],
      obrasFavoritas: [],
      obrasConcluidas: [],
    };
  }
}
