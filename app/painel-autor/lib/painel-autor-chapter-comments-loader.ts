import { supabase } from "../../../lib/supabase/client";
import { carregarTodasPaginasPorLotesSupabase } from "../../../lib/supabase/paginacao.mjs";
import { criarChaveInteracao } from "./painel-autor-interaction-utils";

export async function carregarComentariosCapitulosUsuarioPainel(
  userId: string,
  capituloIds: string[],
) {
  const comentarios = new Map<string, string>();

  if (!userId.trim() || capituloIds.length === 0) {
    return comentarios;
  }

  try {
    const data = await carregarTodasPaginasPorLotesSupabase<
      { obra_id: string | null; capitulo_id: string; comentario: string },
      string
    >({
      nomeColecao: "comentários pessoais no Painel do Autor",
      itens: capituloIds,
      buscarPaginaLote: async (capituloIdsLote, inicio, fim) =>
        supabase
          .from("comentarios_capitulos")
          .select("id,obra_id,capitulo_id,comentario,atualizado_em")
          .eq("user_id", userId)
          .in("capitulo_id", capituloIdsLote)
          .order("atualizado_em", { ascending: false })
          .order("id", { ascending: false })
          .range(inicio, fim),
    });

    data.forEach((registro) => {
      const obraId = registro.obra_id?.trim() || "";
      const capituloId = registro.capitulo_id?.trim() || "";
      const comentario = registro.comentario?.trim() || "";

      if (!capituloId || !comentario) {
        return;
      }

      if (!comentarios.has(capituloId)) {
        comentarios.set(capituloId, comentario);
      }

      const chave = obraId ? criarChaveInteracao(obraId, capituloId) : "";

      if (chave && !comentarios.has(chave)) {
        comentarios.set(chave, comentario);
      }
    });
  } catch (error) {
    console.warn(
      "Não consegui acessar comentários pessoais no Painel do Autor:",
      error,
    );
  }

  return comentarios;
}
