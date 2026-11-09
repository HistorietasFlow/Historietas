import { supabase } from "../../../../lib/supabase/client";
import { carregarTodasPaginasSupabase } from "../../../../lib/supabase/paginacao.mjs";
import type { ProgressoObra } from "./obra-public-snapshot";

// Estado pessoal separado; nenhuma coluna de conteúdo entra pelo cache local.
export async function carregarProgressoObraPublica(obraId: string, usuarioId: string): Promise<ProgressoObra> {
  if (!usuarioId) return [];
  const rows = await carregarTodasPaginasSupabase<{ capitulo_id: string | null; atualizado_em: string }>({ nomeColecao: "progresso pessoal da obra",
    buscarPagina: async (inicio, fim) => supabase.from("progresso_leitura")
      .select("capitulo_id,atualizado_em").eq("obra_id", obraId).eq("user_id", usuarioId).eq("lido", true)
      .order("capitulo_id").range(inicio, fim) });
  return rows.flatMap(row => row.capitulo_id ? [{ capitulo_id: row.capitulo_id, lido_em: row.atualizado_em }] : []);
}
