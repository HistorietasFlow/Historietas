import { supabase } from "../../../lib/supabase/client";
import { idObraSupabaseValido } from "../../../lib/utils";
import type { ObraRanking } from "./em-alta-models";

const filas = new Map<string, { usuarioId: string; tarefa: Promise<{ ok: boolean; erro: string }> }>();
const versoes = new Map<string, number>();
export const obterVersaoColecoesEmAlta = (usuarioId: string) => versoes.get(usuarioId) || 0;
export async function aguardarColecoesEmAlta(usuarioId: string) {
  await Promise.all([...filas.values()].filter(fila => fila.usuarioId === usuarioId).map(fila => fila.tarefa));
}

export async function sincronizarColecaoRankingSupabase(
  tabela: "favoritos" | "concluidas",
  obra: Pick<ObraRanking, "storageId" | "titulo"> | null,
  ativo: boolean,
  userIdEsperado = "",
  execucaoEstaAtual: () => boolean = () => true,
) {
  const userId = typeof userIdEsperado === "string" ? userIdEsperado.trim() : "";
  const obraId = typeof obra?.storageId === "string" ? obra.storageId.trim() : "";
  if (!userId || !idObraSupabaseValido(obraId)) return { ok: false, erro: "Identidade inválida." };
  const chave = JSON.stringify([tabela, userId, obraId]);
  versoes.set(userId, obterVersaoColecoesEmAlta(userId) + 1);
  const anterior = filas.get(chave)?.tarefa ?? Promise.resolve();
  const tarefa = anterior.then(async () => {
    try {
      if (!execucaoEstaAtual()) return { ok: false, erro: "Conta alterada." };
      const { data, error } = await supabase.auth.getUser();
      if (error || data.user?.id !== userId || !execucaoEstaAtual()) return { ok: false, erro: "Conta alterada." };
      if (!ativo) {
        const resultado = await supabase.from(tabela).delete().eq("user_id", userId).eq("obra_id", obraId);
        return { ok: !resultado.error, erro: resultado.error?.message || "" };
      }
      // DO NOTHING no conflito conserva a visibilidade de uma coleção existente.
      const resultado = await supabase.from(tabela).upsert({ user_id: userId, obra_id: obraId, visibilidade: "parcial" }, {
        onConflict: "user_id,obra_id", ignoreDuplicates: true,
      }).select("obra_id").maybeSingle();
      if (resultado.error) return { ok: false, erro: resultado.error.message };
      if (resultado.data?.obra_id === obraId) return { ok: true, erro: "" };
      const existente = await supabase.from(tabela).select("obra_id").eq("user_id", userId).eq("obra_id", obraId).maybeSingle();
      const ok = !existente.error && existente.data?.obra_id === obraId;
      return { ok, erro: ok ? "" : existente.error?.message || "Coleção não confirmada." };
    } catch (error) {
      return { ok: false, erro: error instanceof Error ? error.message : "Coleção não confirmada." };
    }
  });
  filas.set(chave, { usuarioId: userId, tarefa });
  try { return await tarefa; }
  finally { if (filas.get(chave)?.tarefa === tarefa) filas.delete(chave); }
}
