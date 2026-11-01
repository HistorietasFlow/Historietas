import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { ObraLocal } from "../types";

type ObraRemotaAutorizadaEdicaoObra = {
  id: string;
  user_id: string;
  capa_url: string | null;
  capa_nome: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  arquivo_tipo: string | null;
  arquivo_tamanho: number | null;
  arquivo_categoria: string | null;
  criada_em: string | null;
};

type ConfirmarPropriedadeObraParaSalvamentoEdicaoParams = {
  obras: ObraLocal[];
  obraId: string;
  userId: string;
  setErro: Dispatch<SetStateAction<string>>;
  setSalvou: Dispatch<SetStateAction<boolean>>;
};

export async function confirmarPropriedadeObraParaSalvamentoEdicao({
  obras,
  obraId,
  userId,
  setErro,
  setSalvou,
}: ConfirmarPropriedadeObraParaSalvamentoEdicaoParams) {
  const obraLocalAtual = obras.find((obra) => obra.id === obraId) || null;

  if (obraLocalAtual?.autorId && obraLocalAtual.autorId !== userId) {
    setErro("Você não tem permissão para editar esta obra.");
    setSalvou(false);
    return null;
  }

  const { data: obraAutorizadaSupabase, error: erroConfirmarObra } =
    await supabase
      .from("obras")
      .select(
        "id,user_id,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,criada_em"
      )
      .eq("id", obraId)
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

  if (erroConfirmarObra) {
    setErro(
      `Não consegui confirmar sua permissão para editar esta obra: ${erroConfirmarObra.message}`
    );
    setSalvou(false);
    return null;
  }

  if (!obraAutorizadaSupabase?.id) {
    setErro("Você não tem permissão para editar esta obra.");
    setSalvou(false);
    return null;
  }

  return {
    obraLocalAtual,
    obraRemotaAtual:
      obraAutorizadaSupabase as ObraRemotaAutorizadaEdicaoObra,
  };
}
