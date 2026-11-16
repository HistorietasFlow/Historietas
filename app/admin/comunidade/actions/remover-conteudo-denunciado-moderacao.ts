import { supabase } from "../../../../lib/supabase/client";
import type { TipoAlvoDenuncia } from "../lib/admin-comunidade-report-label-utils";
import { CAMPOS_ESTADO_DENUNCIA, ErroEscritaModeracao, erroEscritaModeracao, estadoDenunciaModeracao, mesmaDenunciaModeracao, type EstadoDenuncia } from "../lib/admin-comunidade-confirmed-write";

export async function removerConteudoDenunciadoModeracao({alvoTipo, alvoId, observacaoFinal, usuarioId, esperada, denunciasIds, vigente}: {
  alvoTipo: TipoAlvoDenuncia; alvoId: string; observacaoFinal: string; usuarioId: string; esperada: EstadoDenuncia; denunciasIds: string[]; vigente: () => boolean;
}) {
  let envioIniciado = false;
  try {
    if (!vigente()) throw new ErroEscritaModeracao("conflito", "O contexto da moderação mudou.");
    if (esperada.alvoTipo !== alvoTipo || esperada.alvoId !== alvoId || esperada.arquivada || !["pendente", "em_analise"].includes(esperada.status)) {
      throw new ErroEscritaModeracao("conflito", "A denúncia não autoriza mais a remoção deste conteúdo.");
    }
    const atual = await supabase.from("comunidade_denuncias").select(CAMPOS_ESTADO_DENUNCIA).eq("id", esperada.id).maybeSingle();
    if (!vigente()) throw new ErroEscritaModeracao("conflito", "O contexto da moderação mudou.");
    if (atual.error) throw new ErroEscritaModeracao("rejeitado", "Não consegui confirmar a denúncia antes da remoção.");
    if (!mesmaDenunciaModeracao(estadoDenunciaModeracao(atual.data) || undefined, esperada)) throw new ErroEscritaModeracao("conflito", "A denúncia mudou antes da remoção. Reabra o painel.");
    envioIniciado = true;
    const {data, error} = await supabase.rpc("remover_conteudo_denunciado_transacional", {
      p_alvo_tipo: alvoTipo, p_alvo_id: alvoId, p_observacao_admin: observacaoFinal.slice(0, 800),
    });
    if (!vigente()) throw new ErroEscritaModeracao("incerto", "O contexto mudou durante a remoção.");
    if (error) throw erroEscritaModeracao(error);
    const recibo = data as Record<string, unknown> | null;
    if (!recibo || recibo.alvo_tipo !== alvoTipo || recibo.alvo_id !== alvoId || recibo.analisado_por !== usuarioId ||
        recibo.conteudos_removidos !== 1 || typeof recibo.denuncias_resolvidas !== "number" || recibo.denuncias_resolvidas < 1 ||
        typeof recibo.analisado_em !== "string" || !Number.isFinite(Date.parse(recibo.analisado_em))) {
      throw new ErroEscritaModeracao("incerto", "O resultado da remoção não foi confirmado. Confira o conteúdo antes de outra ação.");
    }
    const resposta = await supabase.from("comunidade_denuncias").select(CAMPOS_ESTADO_DENUNCIA)
      .eq("alvo_tipo", alvoTipo).eq("alvo_id", alvoId).in("id", denunciasIds);
    if (resposta.error || !Array.isArray(resposta.data)) throw new ErroEscritaModeracao("incerto", "A remoção foi confirmada, mas o estado das denúncias não pôde ser carregado.");
    const denuncias = resposta.data.map(estadoDenunciaModeracao);
    if (denuncias.some(d => !d || d.alvoTipo !== alvoTipo || d.alvoId !== alvoId || !denunciasIds.includes(d.id)) ||
        denuncias.length !== denunciasIds.length || new Set(denuncias.map(d => d?.id)).size !== denunciasIds.length) {
      throw new ErroEscritaModeracao("incerto", "A remoção foi confirmada, mas a lista mudou. Reabra o painel.");
    }
    if (denuncias.find(d => d?.id === esperada.id)?.status !== "resolvida") {
      throw new ErroEscritaModeracao("incerto", "A remoção foi confirmada, mas a denúncia mudou em seguida. Reabra o painel para conferir o estado atual.");
    }
    return {denuncias: denuncias as EstadoDenuncia[]};
  } catch (error) {
    if (!envioIniciado && !(error instanceof ErroEscritaModeracao)) throw new ErroEscritaModeracao("rejeitado", "Não consegui confirmar a denúncia antes da remoção.");
    throw erroEscritaModeracao(error);
  }
}
