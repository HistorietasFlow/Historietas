import { timestampData } from "./listas-format-utils";

export type ComentarioAnotacaoListas = {
  id: string;
  anotacaoId: string;
  userId: string;
  autorNome: string;
  autorUsername: string;
  autorAvatar: string;
  texto: string;
  criadoEm: string;
  atualizadoEm: string;
  parentId: string;
  curtidas: string[];
};

export type InteracaoAnotacaoListas = {
  carregando: boolean;
  totalCurtidas: number;
  curtiu: boolean;
  comentarios: ComentarioAnotacaoListas[];
  novoComentario: string;
  respondendoComentarioId: string;
  respondendoAutorNome: string;
  ordenacaoComentarios: "relevantes" | "recentes";
  salvandoCurtida: boolean;
  enviandoComentario: boolean;
  erro: string;
};

export function criarInteracaoAnotacaoListasVazia(
  carregando = false,
): InteracaoAnotacaoListas {
  return {
    carregando,
    totalCurtidas: 0,
    curtiu: false,
    comentarios: [],
    novoComentario: "",
    respondendoComentarioId: "",
    respondendoAutorNome: "",
    ordenacaoComentarios: "relevantes",
    salvandoCurtida: false,
    enviandoComentario: false,
    erro: "",
  };
}

export function ordenarComentariosRaizDiarioListas<T extends ComentarioAnotacaoListas>(
  comentarios: T[],
  ordenacao: "relevantes" | "recentes",
) {
  const respostasPorPai = new Map<string, number>();

  comentarios.forEach((comentario) => {
    if (!comentario.parentId) return;
    respostasPorPai.set(
      comentario.parentId,
      (respostasPorPai.get(comentario.parentId) || 0) + 1,
    );
  });

  return comentarios
    .filter((comentario) => !comentario.parentId)
    .sort((a, b) => {
      if (ordenacao === "recentes") {
        return timestampData(b.criadoEm) - timestampData(a.criadoEm);
      }

      const relevanciaA =
        a.curtidas.length * 3 + (respostasPorPai.get(a.id) || 0) * 2;
      const relevanciaB =
        b.curtidas.length * 3 + (respostasPorPai.get(b.id) || 0) * 2;

      return (
        relevanciaB - relevanciaA ||
        timestampData(b.criadoEm) - timestampData(a.criadoEm)
      );
    });
}

export function obterRespostasComentarioDiarioListas<T extends ComentarioAnotacaoListas>(
  comentarios: T[],
  comentarioId: string,
) {
  return comentarios
    .filter((comentario) => comentario.parentId === comentarioId)
    .sort((a, b) => timestampData(a.criadoEm) - timestampData(b.criadoEm));
}
