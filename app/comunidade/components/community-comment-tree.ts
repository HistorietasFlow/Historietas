import { dataComentarioComunidade } from "./community-comment-date";
import type { OrdenacaoComentariosComunidade } from "./community-comment-order";

type ComentarioEstruturaComunidade = {
  id: string;
  criadoEm: string;
  comentarioPaiId: string;
  curtidas: string[];
};

export function criarEstruturaComentariosComunidade<
  T extends ComentarioEstruturaComunidade,
>(comentarios: T[], ordenacao: OrdenacaoComentariosComunidade) {
  const comentariosPorId = new Map(
    comentarios.map((comentario) => [comentario.id, comentario])
  );
  const respostasPorRaiz = new Map<string, T[]>();
  const comentariosRaiz: T[] = [];

  function obterRaiz(comentario: T) {
    let atual = comentario;
    const visitados = new Set<string>([comentario.id]);

    while (atual.comentarioPaiId) {
      const pai = comentariosPorId.get(atual.comentarioPaiId);

      if (!pai || visitados.has(pai.id)) {
        break;
      }

      visitados.add(pai.id);
      atual = pai;
    }

    return atual;
  }

  comentarios.forEach((comentario) => {
    const paiExiste = Boolean(
      comentario.comentarioPaiId &&
        comentariosPorId.has(comentario.comentarioPaiId)
    );

    if (!paiExiste) {
      comentariosRaiz.push(comentario);
      return;
    }

    const raiz = obterRaiz(comentario);
    const respostasAtuais = respostasPorRaiz.get(raiz.id) || [];

    respostasPorRaiz.set(raiz.id, [...respostasAtuais, comentario]);
  });

  respostasPorRaiz.forEach((respostas, raizId) => {
    respostasPorRaiz.set(
      raizId,
      [...respostas].sort(
        (a, b) => dataComentarioComunidade(a) - dataComentarioComunidade(b)
      )
    );
  });

  comentariosRaiz.sort((a, b) => {
    if (ordenacao === "recentes") {
      return dataComentarioComunidade(b) - dataComentarioComunidade(a);
    }

    const relevanciaA =
      a.curtidas.length * 3 + (respostasPorRaiz.get(a.id)?.length || 0);
    const relevanciaB =
      b.curtidas.length * 3 + (respostasPorRaiz.get(b.id)?.length || 0);

    return (
      relevanciaB - relevanciaA ||
      dataComentarioComunidade(b) - dataComentarioComunidade(a)
    );
  });

  return {
    comentariosRaiz,
    respostasPorRaiz,
  };
}
