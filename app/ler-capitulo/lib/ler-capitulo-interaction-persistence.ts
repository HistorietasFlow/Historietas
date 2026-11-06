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
  lido: boolean,
  userIdEsperado = "",
  ocorridoEm = new Date().toISOString(),
) {
  try {
    const { data: dadosUsuario } = await supabase.auth.getUser();
    const userId = dadosUsuario.user?.id || "";
    const capituloIdLimpo = capituloId.trim();

    if (
      !userId ||
      (userIdEsperado && userId !== userIdEsperado) ||
      !idObraSupabaseValido(obra.id) ||
      !capituloIdLimpo ||
      Number.isNaN(Date.parse(ocorridoEm))
    ) {
      return false;
    }

    const { data: sincronizado, error: erroSincronizacao } = await supabase.rpc(
      "salvar_progresso_leitura",
      {
        p_obra_id: obra.id,
        p_capitulo_id: capituloIdLimpo,
        p_lido: lido,
        p_progresso: calcularProgressoLeitura(obra.capitulos),
        p_ocorrido_em: ocorridoEm,
      },
    );

    if (erroSincronizacao) {
      throw erroSincronizacao;
    }

    return sincronizado === true;
  } catch (error) {
    console.warn("Não consegui salvar progresso de leitura no Supabase:", error);
    return false;
  }
}

export async function salvarRegistroCapituloSupabase(
  tabela: "curtidas_capitulos" | "salvos_capitulos",
  capituloId: string,
  ativo: boolean,
  userIdEsperado = "",
) {
  try {
    const { data: dadosUsuario } = await supabase.auth.getUser();
    const userId = dadosUsuario.user?.id || "";

    if (
      !userId ||
      (userIdEsperado && userId !== userIdEsperado) ||
      !capituloId.trim()
    ) {
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
