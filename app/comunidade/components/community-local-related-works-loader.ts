import { normalizarSugestaoObraLocal } from "./community-related-work-local-normalizer";
import type { ObraRelacionadaSugestao } from "./community-related-work-suggestion";
import { carregarJsonUsuarioComunidade } from "./community-user-json-loader";

export function carregarSugestoesObrasLocais(userId = "") {
  try {
    const obrasJson: unknown =
      carregarJsonUsuarioComunidade("historietas-obras", userId) || [];

    if (!Array.isArray(obrasJson)) {
      return [];
    }

    return obrasJson
      .map((obra, index) => normalizarSugestaoObraLocal(obra, index))
      .filter((obra): obra is ObraRelacionadaSugestao => Boolean(obra));
  } catch {
    return [];
  }
}
