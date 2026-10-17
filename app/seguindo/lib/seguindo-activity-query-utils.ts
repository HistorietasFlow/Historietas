import { supabase } from "../../../lib/supabase/client";
import {
  normalizarRegistrosSupabaseGenericos,
} from "./seguindo-record-utils";
import type { RegistroSupabaseGenerico } from "./seguindo-record-utils";

export async function carregarRegistrosAtividadesTabelaSeguindo(
  tabela: "diario_atividades" | "favoritos" | "concluidas" | "obra_avaliacoes",
  usuariosIds: string[],
): Promise<RegistroSupabaseGenerico[]> {
  const camposPorTabela = {
    diario_atividades:
      "id,user_id,tipo,obra_id,capitulo_id,texto,nota,visibilidade,metadata,criado_em,created_at,atualizado_em,updated_at",
    favoritos:
      "id,user_id,obra_id,visibilidade,criado_em,created_at,atualizado_em,updated_at",
    concluidas:
      "id,user_id,obra_id,visibilidade,criado_em,created_at,atualizado_em,updated_at",
    obra_avaliacoes:
      "id,user_id,obra_id,nota,rating,avaliacao,visibilidade,criado_em,created_at,atualizado_em,updated_at",
  } satisfies Record<typeof tabela, string>;

  try {
    const { data, error } = await supabase
      .from(tabela)
      .select(camposPorTabela[tabela])
      .in("user_id", usuariosIds)
      .limit(120);

    if (error || !Array.isArray(data)) {
      return [] as RegistroSupabaseGenerico[];
    }

    return normalizarRegistrosSupabaseGenericos(data);
  } catch (error) {
    console.warn(`Não consegui carregar ${tabela} no feed Seguindo:`, error);
    return [] as RegistroSupabaseGenerico[];
  }
}
