import "server-only";
import type { Json } from "../../supabase/database.types";
import { lerEventosCache } from "./solicitar-invalidacao-cache";

type Acao = "preparar" | "executar" | "reconciliar";
const objeto = (v: Json): v is { [key: string]: Json | undefined } => !!v && typeof v === "object" && !Array.isArray(v);

/** Sem retry automatico, UUID gerado aqui, ACK ou fallback legado apos ambiguidade. */
export async function consumirOperacaoCache({ operacaoId, reconciliar, chamar, legado, consumir }: {
  operacaoId: string | null;
  reconciliar: boolean;
  chamar: (acao: Acao, id: string | null) => Promise<Json>;
  legado: () => Promise<Json>;
  consumir: (eventos: Json) => Promise<Record<string, unknown>>;
}): Promise<Record<string, unknown>> {
  const bloqueado = (estado: string) => ({ estado, operacaoId, solicitadas: 0, confirmadas: 0,
    publicacaoAutomaticaHabilitada: false });
  let modoLegado = false;
  // A mesma chave e devolvida mesmo se a resposta da admissao/execucao se perder.
  try {
    let r = await chamar(reconciliar ? "reconciliar" : "preparar", operacaoId);
    if (!objeto(r)) throw new Error("Contrato invalido.");
    if (r.estado === "legado" && !reconciliar) {
      modoLegado = true;
      return await consumir(await legado());
    }
    if (["admissao_bloqueada", "identificador_obrigatorio", "protocolo_desativado"].includes(String(r.estado))) {
      return bloqueado(String(r.estado));
    }
    if (!operacaoId || r.operacaoId !== operacaoId) throw new Error("Identidade divergente.");
    if (r.estado === "admitida") {
      if (r.nova !== true || reconciliar) return bloqueado("reconciliacao_necessaria");
      // Outra RPC = outra transacao; intencao duravel precede reivindicacao.
      r = await chamar("executar", operacaoId);
    } else if (r.estado === "confirmada" && !reconciliar) {
      // Preparar so informa estado; ler recibo e leases atuais sem reivindicar.
      r = await chamar("executar", operacaoId);
    }
    if (!objeto(r) || r.operacaoId !== operacaoId) throw new Error("Resposta invalida.");
    if (r.estado === "encerrada_sem_claim" || r.estado === "orcamento_bloqueado") return bloqueado(r.estado);
    if (r.estado !== "confirmada" || typeof r.leasesValidos !== "boolean") throw new Error("Recibo invalido.");
    const recibo = r.recibo ?? null;
    if (!objeto(recibo) || recibo.operacao_id !== operacaoId) throw new Error("Recibo invalido.");
    const eventos = lerEventosCache(recibo.resultado ?? null);
    if (recibo.debito !== eventos.length) throw new Error("Debito divergente.");
    if (!r.leasesValidos) return bloqueado("leases_indisponiveis");
    return { ...await consumir(recibo.resultado ?? null), operacaoId };
  } catch (erro) {
    if (modoLegado) throw erro;
    // Nao reconciliar/repetir automaticamente: pausa duravel conserva a incerteza.
    return bloqueado("reconciliacao_necessaria");
  }
}
