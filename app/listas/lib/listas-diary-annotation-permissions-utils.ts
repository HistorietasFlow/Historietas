type AnotacaoPermissoesListas = {
  anotacaoVisibilidadeComentarios?: string;
  anotacaoQuemPodeComentar?: string;
  anotacaoPermitirCurtidas?: boolean;
};

export function obterPermissoesAnotacaoListas({
  item,
  perfilEhProprio,
  relacionamentoPerfil,
  quemPodeComentarDiario,
}: {
  item: AnotacaoPermissoesListas;
  perfilEhProprio: boolean;
  relacionamentoPerfil: string;
  quemPodeComentarDiario: string;
}) {
  const visibilidadeComentarios =
    item.anotacaoVisibilidadeComentarios || "herdar";
  const quemPodeComentar = item.anotacaoQuemPodeComentar || "herdar";
  const seguidor = relacionamentoPerfil === "seguindo";
  const podeVerComentarios =
    perfilEhProprio ||
    visibilidadeComentarios === "publico" ||
    visibilidadeComentarios === "herdar" ||
    (visibilidadeComentarios === "seguidores" && seguidor);
  const regraComentarioEfetiva =
    quemPodeComentar === "herdar"
      ? quemPodeComentarDiario
      : quemPodeComentar;
  const podeComentar =
    podeVerComentarios &&
    (perfilEhProprio ||
      regraComentarioEfetiva === "todos" ||
      (regraComentarioEfetiva === "seguidores" && seguidor));

  return {
    podeVerComentarios,
    podeComentar,
    podeCurtirAnotacao: item.anotacaoPermitirCurtidas !== false,
  };
}
