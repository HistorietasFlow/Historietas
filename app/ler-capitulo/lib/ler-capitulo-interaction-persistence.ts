import { supabase } from "../../../lib/supabase/client";
import { idObraSupabaseValido, obterNumeroSeguro } from "../../../lib/utils";
import { calcularProgressoLeitura, type ObraLocal } from "./ler-capitulo-work-normalization";

export async function incrementarVisualizacaoCapituloSupabase(
  capituloId: string
): Promise<number | null> {
  const capituloIdLimpo = capituloId.trim();

  if (!idObraSupabaseValido(capituloIdLimpo)) {
    return null;
  }

  try {
    const response = await fetch("/api/visualizacoes", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "capitulo",
        conteudoId: capituloIdLimpo,
      }),
    });
    const data = (await response.json().catch(() => null)) as
      | { ok?: boolean; total?: unknown }
      | null;

    if (!response.ok || !data?.ok || typeof data.total !== "number") {
      return null;
    }

    return Math.max(0, obterNumeroSeguro(data.total, 0));
  } catch {
    // A leitura continua mesmo se a contagem remota falhar.
    return null;
  }
}

export async function salvarProgressoLeituraSupabase(
  obra: ObraLocal,
  capituloId: string,
  lido: boolean
) {
  try {
    const { data: dadosUsuario } = await supabase.auth.getUser();
    const userId = dadosUsuario.user?.id || "";
    const capituloIdLimpo = capituloId.trim();

    if (
      !userId ||
      !idObraSupabaseValido(obra.id) ||
      !capituloIdLimpo
    ) {
      return false;
    }

    if (!lido) {
      const { error: erroDelete } = await supabase
        .from("progresso_leitura")
        .delete()
        .eq("user_id", userId)
        .eq("obra_id", obra.id)
        .eq("capitulo_id", capituloIdLimpo);

      if (erroDelete) {
        throw erroDelete;
      }

      return true;
    }

    const payload = {
      user_id: userId,
      obra_id: obra.id,
      capitulo_id: capituloIdLimpo,
      progresso: calcularProgressoLeitura(obra.capitulos),
      lido: true,
      atualizado_em: new Date().toISOString(),
    };

    const { error: erroUpsert } = await supabase
      .from("progresso_leitura")
      .upsert(payload, {
        onConflict: "user_id,obra_id,capitulo_id",
      });

    if (erroUpsert) {
      throw erroUpsert;
    }

    return true;
  } catch (error) {
    console.warn("Não consegui salvar progresso de leitura no Supabase:", error);
    return false;
  }
}

export async function salvarRegistroCapituloSupabase(
  tabela: "curtidas_capitulos" | "salvos_capitulos",
  capituloId: string,
  ativo: boolean
) {
  try {
    const { data: dadosUsuario } = await supabase.auth.getUser();
    const userId = dadosUsuario.user?.id || "";

    if (!userId || !capituloId.trim()) {
      return false;
    }

    const { error: erroDelete } = await supabase
      .from(tabela)
      .delete()
      .eq("user_id", userId)
      .eq("capitulo_id", capituloId);

    if (erroDelete) {
      throw erroDelete;
    }

    if (!ativo) {
      return true;
    }

    const payloadBase = {
      user_id: userId,
      capitulo_id: capituloId,
    };

    const { error: erroSemVisibilidade } = await supabase
      .from(tabela)
      .insert(payloadBase);

    if (erroSemVisibilidade) {
      throw erroSemVisibilidade;
    }

    return true;
  } catch (error) {
    console.warn(`Não consegui salvar registro em ${tabela}:`, error);
    return false;
  }
}
