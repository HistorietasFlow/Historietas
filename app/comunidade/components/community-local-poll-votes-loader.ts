import { CHAVE_VOTOS_ENQUETES_COMUNIDADE } from "./community-storage-keys";
import type { CarregarJsonUsuarioComunidade } from "./community-user-json-loader";

export function carregarVotosEnquetesLocais(
  carregarJsonUsuarioComunidade: CarregarJsonUsuarioComunidade,
  userId = ""
) {
  if (typeof window === "undefined" || !userId.trim()) {
    return {} as Record<string, string>;
  }

  try {
    const json: unknown =
      carregarJsonUsuarioComunidade(CHAVE_VOTOS_ENQUETES_COMUNIDADE, userId) ||
      {};

    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return {} as Record<string, string>;
    }

    return Object.fromEntries(
      Object.entries(json).filter((entrada): entrada is [string, string] => {
        return typeof entrada[0] === "string" && typeof entrada[1] === "string";
      })
    );
  } catch {
    return {} as Record<string, string>;
  }
}
