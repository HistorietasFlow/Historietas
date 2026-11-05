import {
  carregarMetricasConteudos,
  type ContratoMetricas,
} from "../../../../lib/metricas";

type ExecutarMetricasObra = (parametros: {
  obraIds: readonly string[];
}) => Promise<ContratoMetricas>;

export type CarregarMetricasObra = (
  obraId: string,
) => Promise<ContratoMetricas>;

type RequisicaoMetricasObraCompartilhada = {
  promise: Promise<ContratoMetricas>;
  consumidores: number;
  concluida: boolean;
};

const TOTAL_CONSUMIDORES_INICIAIS = 2;

export function criarCoordenadorMetricasObraEmVoo(
  executarMetricas: ExecutarMetricasObra = carregarMetricasConteudos,
) {
  // Os lifecycles de métricas e avaliação consomem o mesmo snapshot inicial.
  // Mantemos o resultado somente até ambos o receberem; chamadas seguintes
  // voltam a consultar a origem para não esconder atualizações legítimas.
  const requisicoesCompartilhadas = new Map<
    string,
    RequisicaoMetricasObraCompartilhada
  >();

  return function carregarMetricasObraEmVoo({
    obraId,
    usuarioId,
  }: {
    obraId: string;
    usuarioId: string;
  }) {
    const obraIdLimpo = obraId.trim();
    const usuarioIdLimpo = usuarioId.trim();
    const chave = JSON.stringify([usuarioIdLimpo, obraIdLimpo]);
    const requisicaoExistente = requisicoesCompartilhadas.get(chave);

    if (requisicaoExistente) {
      requisicaoExistente.consumidores += 1;

      if (
        requisicaoExistente.concluida &&
        requisicaoExistente.consumidores >= TOTAL_CONSUMIDORES_INICIAIS
      ) {
        requisicoesCompartilhadas.delete(chave);
      }

      return requisicaoExistente.promise;
    }

    const requisicaoCompartilhada: RequisicaoMetricasObraCompartilhada = {
      promise: executarMetricas({ obraIds: [obraIdLimpo] }),
      consumidores: 1,
      concluida: false,
    };
    requisicoesCompartilhadas.set(chave, requisicaoCompartilhada);

    const concluirRequisicaoCompartilhada = () => {
      requisicaoCompartilhada.concluida = true;

      if (
        requisicoesCompartilhadas.get(chave) === requisicaoCompartilhada &&
        requisicaoCompartilhada.consumidores >= TOTAL_CONSUMIDORES_INICIAIS
      ) {
        requisicoesCompartilhadas.delete(chave);
      }
    };

    void requisicaoCompartilhada.promise.then(
      concluirRequisicaoCompartilhada,
      concluirRequisicaoCompartilhada,
    );

    return requisicaoCompartilhada.promise;
  };
}
