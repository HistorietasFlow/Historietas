import { normalizarComentariosObraSupabase } from "./obra-supabase-comment-normalizer";
import { carregarRespostasComentariosObraSupabase } from "./obra-supabase-comment-replies-query";
import { consultarPaginaRaizesComentariosObraSupabase } from "./obra-supabase-root-comments-query";
import type {
  PaginaComentariosObra,
  SupabaseComentarioObraRow,
} from "./obra-comment-utils";

const WORK_COMMENTS_PAGE_SIZE = 20;

export async function carregarPaginaComentariosObraSupabase(
  obraId: string,
  offset: number,
): Promise<PaginaComentariosObra> {
  const inicio = Math.max(0, offset);
  const fim = inicio + WORK_COMMENTS_PAGE_SIZE;
  const { data: comentariosRaizData, error: erroComentariosRaiz } =
    await consultarPaginaRaizesComentariosObraSupabase(obraId, inicio, fim);

  if (erroComentariosRaiz) {
    throw erroComentariosRaiz;
  }

  const comentariosRaizTodos = Array.isArray(comentariosRaizData)
    ? (comentariosRaizData as SupabaseComentarioObraRow[])
    : [];
  const temMais = comentariosRaizTodos.length > WORK_COMMENTS_PAGE_SIZE;
  const comentariosRaiz = comentariosRaizTodos.slice(
    0,
    WORK_COMMENTS_PAGE_SIZE,
  );
  const idsConhecidos = new Set(
    comentariosRaiz
      .map((comentario) => comentario.id?.trim() || "")
      .filter(Boolean),
  );

  async function carregarDescendentes(
    idsPais: string[],
  ): Promise<SupabaseComentarioObraRow[]> {
    if (idsPais.length === 0) {
      return [];
    }

    const respostas = await carregarRespostasComentariosObraSupabase(
      obraId,
      idsPais,
    );
    const respostasNovas: SupabaseComentarioObraRow[] = [];
    const proximosIdsPais: string[] = [];

    respostas.forEach((resposta) => {
      const respostaId = resposta.id?.trim() || "";

      if (!respostaId || idsConhecidos.has(respostaId)) {
        return;
      }

      idsConhecidos.add(respostaId);
      respostasNovas.push(resposta);
      proximosIdsPais.push(respostaId);
    });

    return [
      ...respostasNovas,
      ...(await carregarDescendentes(proximosIdsPais)),
    ];
  }

  const comentariosDescendentes = await carregarDescendentes(
    Array.from(idsConhecidos),
  );
  const comentarios = await normalizarComentariosObraSupabase([
    ...comentariosRaiz,
    ...comentariosDescendentes,
  ]);

  return {
    comentarios,
    temMais,
    proximoOffset: inicio + comentariosRaiz.length,
  };
}
