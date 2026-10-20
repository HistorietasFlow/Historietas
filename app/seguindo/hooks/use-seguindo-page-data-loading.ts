"use client";

import { useSeguindoDataLoader } from "./use-seguindo-data-loader";
import { useSeguindoDataLoadTrigger } from "./use-seguindo-data-load-trigger";

type UseSeguindoPageDataLoadingParams = Parameters<
  typeof useSeguindoDataLoader
>[0];

export function useSeguindoPageDataLoading(
  parametros: UseSeguindoPageDataLoadingParams,
) {
  const carregarDadosSeguindo = useSeguindoDataLoader(parametros);

  useSeguindoDataLoadTrigger({
    usuarioLogadoId: parametros.usuarioLogadoId,
    carregarDadosSeguindo,
  });
}
