"use client";

import { useMemo } from "react";
import type { ObraLocal } from "../lib/seguindo-page-types";
import { filtrarObrasSeguidasBase, filtrarObrasVisiveisSeguindo } from "../lib/seguindo-visible-works";

export function useSeguindoVisibleWorks(obras: ObraLocal[], obrasSeguidas: string[]) {
  const obrasVisiveisSeguindo = useMemo(
    () => filtrarObrasVisiveisSeguindo(obras),
    [obras],
  );

  const obrasSeguidasBase = useMemo(
    () => filtrarObrasSeguidasBase(obrasVisiveisSeguindo, obrasSeguidas),
    [obrasVisiveisSeguindo, obrasSeguidas],
  );
  return { obrasVisiveisSeguindo, obrasSeguidasBase };
}
