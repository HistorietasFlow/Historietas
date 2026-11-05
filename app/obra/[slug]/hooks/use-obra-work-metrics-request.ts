import { useCallback, useRef } from "react";
import {
  criarCoordenadorMetricasObraEmVoo,
  type CarregarMetricasObra,
} from "../lib/obra-work-metrics-request-coordinator";

export function useObraWorkMetricsRequest(
  usuarioIdLogado: string,
): CarregarMetricasObra {
  const coordenadorRef = useRef<
    ReturnType<typeof criarCoordenadorMetricasObraEmVoo> | null
  >(null);

  if (coordenadorRef.current == null) {
    coordenadorRef.current = criarCoordenadorMetricasObraEmVoo();
  }

  return useCallback(
    (obraId: string) =>
      coordenadorRef.current!({
        obraId,
        usuarioId: usuarioIdLogado,
      }),
    [usuarioIdLogado],
  );
}
