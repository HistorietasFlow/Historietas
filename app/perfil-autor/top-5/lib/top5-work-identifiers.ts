import { criarSlugBase, normalizarTexto } from "../../../../lib/utils";
import type { ObraTop5 } from "./top5-types";

export function obterIdentificadoresObraTop5(
  obra: Pick<ObraTop5, "id" | "slug" | "titulo">,
) {
  return Array.from(
    new Set(
      [
        obra.id,
        obra.slug,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ]
        .map((identificador) => identificador.trim())
        .filter(Boolean),
    ),
  );
}

export function criarChaveObraTop5(obra: Pick<ObraTop5, "id" | "slug" | "titulo">) {
  return obterIdentificadoresObraTop5(obra)[0] || "";
}
