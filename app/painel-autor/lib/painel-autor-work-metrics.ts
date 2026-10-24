import {
  calcularComentarios,
  calcularCurtidas,
  calcularSalvos,
} from "./painel-autor-chapter-metrics-utils";
import {
  calcularProgressoLeitura,
  encontrarCapituloParaContinuar,
  obterCapitulosPublicadosPainel,
} from "./painel-autor-reading-progress-utils";

type CapituloParaMetricasPainel = {
  id: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  lido: boolean;
  publicado?: boolean;
};

type ObraParaMetricasPainel<
  TCapitulo extends CapituloParaMetricasPainel,
> = {
  capitulos: TCapitulo[];
  ultimoCapituloLidoId: string;
  totalCurtidasPainel?: number;
  totalComentariosPainel?: number;
  totalSalvosPainel?: number;
  totalLidosPainel?: number;
};

export type ObraComMetricasPainel<
  TObra extends ObraParaMetricasPainel<CapituloParaMetricasPainel>,
> = TObra & {
  totalCurtidas: number;
  totalComentarios: number;
  totalSalvos: number;
  totalLidos: number;
  progressoLeitura: number;
  ultimoCapituloLido: TObra["capitulos"][number] | null;
  pontuacao: number;
};

export function obterObrasComMetricasPainel<
  TCapitulo extends CapituloParaMetricasPainel,
  TObra extends ObraParaMetricasPainel<TCapitulo>,
>(obras: TObra[]): ObraComMetricasPainel<TObra>[] {
  return obras
    .map((obra) => {
      const totalCurtidas =
        typeof obra.totalCurtidasPainel === "number"
          ? obra.totalCurtidasPainel
          : calcularCurtidas(obra);
      const totalComentarios =
        typeof obra.totalComentariosPainel === "number"
          ? obra.totalComentariosPainel
          : calcularComentarios(obra);
      const totalSalvos =
        typeof obra.totalSalvosPainel === "number"
          ? obra.totalSalvosPainel
          : calcularSalvos(obra);
      const totalLidos =
        typeof obra.totalLidosPainel === "number"
          ? obra.totalLidosPainel
          : 0;
      const progressoLeitura = calcularProgressoLeitura(obra.capitulos);
      const ultimoCapituloLido = encontrarCapituloParaContinuar(obra);

      return {
        ...obra,
        totalCurtidas,
        totalComentarios,
        totalSalvos,
        totalLidos,
        progressoLeitura,
        ultimoCapituloLido,
        pontuacao:
          obterCapitulosPublicadosPainel(obra.capitulos).length * 2 +
          totalCurtidas * 5 +
          totalComentarios * 8 +
          totalSalvos * 4 +
          totalLidos * 3,
      };
    })
    .sort((obraA, obraB) => obraB.pontuacao - obraA.pontuacao);
}
