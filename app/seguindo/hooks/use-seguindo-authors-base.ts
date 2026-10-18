"use client";

import { useMemo } from "react";
import type { AutorSeguido, ObraLocal } from "../lib/seguindo-page-types";
import { montarAutoresBaseSeguindo } from "../lib/seguindo-author-base-builder";

export function useSeguindoAuthorsBase(
  obrasVisiveisSeguindo: ObraLocal[],
  autoresSeguidos: string[],
  obrasFavoritas: string[],
  obrasConcluidas: string[],
): AutorSeguido[] {
  const autoresBase = useMemo<AutorSeguido[]>(
    () => montarAutoresBaseSeguindo(
      obrasVisiveisSeguindo,
      autoresSeguidos,
      obrasFavoritas,
      obrasConcluidas,
    ),
    [obrasVisiveisSeguindo, autoresSeguidos, obrasFavoritas, obrasConcluidas],
  );
  return autoresBase;
}
