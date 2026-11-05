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
};

export function criarCoordenadorMetricasObraEmVoo(
  executarMetricas: ExecutarMetricasObra = carregarMetricasConteudos,
) {
  // Os lifecycles de métricas e avaliação compartilham somente a requisição
  // em andamento. Depois da resolução, uma nova leitura consulta a origem.
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
      return requisicaoExistente.promise;
    }

    const requisicaoCompartilhada: RequisicaoMetricasObraCompartilhada = {
      promise: executarMetricas({ obraIds: [obraIdLimpo] }),
    };
    requisicoesCompartilhadas.set(chave, requisicaoCompartilhada);

    const concluirRequisicaoCompartilhada = () => {
      if (
        requisicoesCompartilhadas.get(chave) === requisicaoCompartilhada
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
