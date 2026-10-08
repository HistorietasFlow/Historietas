import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { idObraSupabaseValido } from "../../../../lib/utils";
import {
  incrementarVisualizacaoObraPublicaSupabase,
  type MetricasObraPublica,
} from "../lib/obra-metric-utils";
import type { ObraDinamica } from "../lib/obra-data-utils";

export function useObraViewRegistration(
  obra: ObraDinamica | null,
  statusAcesso18: string,
  setMetricasObra: Dispatch<SetStateAction<MetricasObraPublica>>,
) {
  const visualizacaoObraRegistradaRef = useRef("");

  useEffect(() => {
    if (
      !obra ||
      statusAcesso18 !== "permitido" ||
      !idObraSupabaseValido(obra.id)
    ) {
      return;
    }

    const obraIdAtual = obra.id;

    if (visualizacaoObraRegistradaRef.current === obraIdAtual) {
      return;
    }

    visualizacaoObraRegistradaRef.current = obraIdAtual;

    async function registrarVisualizacaoObraAtual() {
      const totalVisualizacoes =
        await incrementarVisualizacaoObraPublicaSupabase(obraIdAtual);

      if (totalVisualizacoes === null) {
        return;
      }

      setMetricasObra((metricasAtuais) => ({
        ...metricasAtuais,
        visualizacoes: Math.max(
          metricasAtuais.visualizacoes,
          totalVisualizacoes
        ),
      }));
    }

    void registrarVisualizacaoObraAtual();
  }, [obra, statusAcesso18, setMetricasObra]);
}
