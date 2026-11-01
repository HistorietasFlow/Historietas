import type { ComentarioCapituloPublico } from "../components/ler-capitulo-comments-sheet";

export type OrdenacaoComentariosCapitulo = "relevantes" | "recentes";

export function dataComentarioCapitulo(comentario: ComentarioCapituloPublico) {
  const data = new Date(comentario.criadoEm).getTime();

  return Number.isNaN(data) ? 0 : data;
}

export function criarEstruturaComentariosCapitulo(
  comentarios: ComentarioCapituloPublico[],
  ordenacao: OrdenacaoComentariosCapitulo
) {
  const comentariosPorId = new Map(
    comentarios.map((comentario) => [comentario.id, comentario])
  );
  const respostasPorRaiz = new Map<string, ComentarioCapituloPublico[]>();
  const comentariosRaiz: ComentarioCapituloPublico[] = [];

  function obterRaiz(comentario: ComentarioCapituloPublico) {
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
        (a, b) => dataComentarioCapitulo(a) - dataComentarioCapitulo(b)
      )
    );
  });

  comentariosRaiz.sort((a, b) => {
    if (ordenacao === "recentes") {
      return dataComentarioCapitulo(b) - dataComentarioCapitulo(a);
    }

    const relevanciaA =
      a.curtidas.length * 3 + (respostasPorRaiz.get(a.id)?.length || 0);
    const relevanciaB =
      b.curtidas.length * 3 + (respostasPorRaiz.get(b.id)?.length || 0);

    return (
      relevanciaB - relevanciaA ||
      dataComentarioCapitulo(b) - dataComentarioCapitulo(a)
    );
  });

  return {
    comentariosRaiz,
    respostasPorRaiz,
  };
}
