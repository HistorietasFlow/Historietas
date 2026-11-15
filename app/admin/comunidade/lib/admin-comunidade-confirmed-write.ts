import { supabase } from "../../../../lib/supabase/client";
import { STATUS_DENUNCIAS } from "./admin-comunidade-status-utils";
import type { DenunciaComunidade } from "../loaders/carregar-denuncias-base-moderacao";

export class ErroEscritaModeracao extends Error {
  constructor(public estado: "incerto" | "conflito" | "rejeitado", mensagem: string) {super(mensagem);}
}
export const CAMPOS_ESTADO_DENUNCIA = "id,alvo_tipo,alvo_id,status,arquivada,observacao_admin,analisado_por,analisado_em,atualizado_em";
export type EstadoDenuncia = Pick<DenunciaComunidade, "id" | "alvoTipo" | "alvoId" | "status" | "arquivada" | "observacaoAdmin" | "analisadoPor" | "analisadoEm" | "atualizadoEm">;
export function mesmaDenunciaModeracao(a: EstadoDenuncia | undefined, b: EstadoDenuncia | undefined) {
  return !!a && !!b && a.id === b.id && a.atualizadoEm === b.atualizadoEm && a.status === b.status && a.arquivada === b.arquivada &&
    a.alvoTipo === b.alvoTipo && a.alvoId === b.alvoId && a.observacaoAdmin === b.observacaoAdmin && a.analisadoPor === b.analisadoPor && a.analisadoEm === b.analisadoEm;
}
export function estadoDenunciaModeracao(valor: unknown): EstadoDenuncia | null {
  if (!valor || typeof valor !== "object") return null;
  const row = valor as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.alvo_tipo !== "string" || typeof row.alvo_id !== "string" ||
      !STATUS_DENUNCIAS.includes(row.status as EstadoDenuncia["status"]) || typeof row.arquivada !== "boolean" ||
      typeof row.observacao_admin !== "string" || !(row.analisado_por === null || typeof row.analisado_por === "string") ||
      !(row.analisado_em === null || typeof row.analisado_em === "string") ||
      typeof row.atualizado_em !== "string" || !Number.isFinite(Date.parse(row.atualizado_em))) return null;
  return {id: row.id, alvoTipo: row.alvo_tipo as EstadoDenuncia["alvoTipo"], alvoId: row.alvo_id,
    status: row.status as EstadoDenuncia["status"], arquivada: row.arquivada, observacaoAdmin: row.observacao_admin,
    analisadoPor: row.analisado_por, analisadoEm: row.analisado_em, atualizadoEm: row.atualizado_em};
}
export function erroEscritaModeracao(error: unknown): ErroEscritaModeracao {
  if (error instanceof ErroEscritaModeracao) return error;
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  // Somente rejeições explícitas do PostgreSQL comprovam que não houve escrita.
  return new ErroEscritaModeracao(/^(?:22|23|42|44|P0)[0-9A-Z]{3}$/.test(code) ? "rejeitado" : "incerto",
    error && typeof error === "object" && "message" in error ? String(error.message) : "O resultado da operação não foi confirmado.");
}
export async function escreverEstadoDenunciaModeracao(esperada: EstadoDenuncia, payload: {
  status?: EstadoDenuncia["status"]; arquivada?: boolean; observacao_admin?: string; analisado_por?: string; analisado_em?: string;
} | null) {
  if (!esperada.atualizadoEm || !Number.isFinite(Date.parse(esperada.atualizadoEm))) throw new ErroEscritaModeracao("conflito", "A versão da denúncia não foi confirmada. Reabra o painel.");
  try {
    // O snapshot faz parte do WHERE: outra decisão administrativa impede esta escrita.
    const operacao = payload ? supabase.from("comunidade_denuncias").update(payload) : supabase.from("comunidade_denuncias").delete();
    const {data, error} = await operacao.eq("id", esperada.id).eq("status", esperada.status).eq("arquivada", esperada.arquivada)
      .eq("alvo_tipo", esperada.alvoTipo).eq("alvo_id", esperada.alvoId).eq("atualizado_em", esperada.atualizadoEm)
      .select(CAMPOS_ESTADO_DENUNCIA);
    if (error) throw erroEscritaModeracao(error);
    if (Array.isArray(data) && data.length === 0) throw new ErroEscritaModeracao("conflito", "A denúncia foi alterada ou removida. Reabra o painel antes de decidir novamente.");
    const confirmada = Array.isArray(data) && data.length === 1 ? estadoDenunciaModeracao(data[0]) : null;
    if (!confirmada || confirmada.id !== esperada.id || confirmada.alvoTipo !== esperada.alvoTipo || confirmada.alvoId !== esperada.alvoId ||
        (!payload && !mesmaDenunciaModeracao(confirmada, esperada)) ||
        (payload && (confirmada.status !== (payload.status ?? esperada.status) || confirmada.arquivada !== (payload.arquivada ?? esperada.arquivada) ||
          confirmada.atualizadoEm === esperada.atualizadoEm)) ||
        (payload?.observacao_admin !== undefined && confirmada.observacaoAdmin !== payload.observacao_admin.trim()) ||
        (payload?.status === "pendente" && (confirmada.analisadoPor !== null || confirmada.analisadoEm !== null)) ||
        (payload?.status && payload.status !== "pendente" && confirmada.analisadoPor !== payload.analisado_por)) {
      throw new ErroEscritaModeracao("incerto", "O resultado da operação não foi confirmado. Confira a denúncia; não repita a ação automaticamente.");
    }
    return confirmada;
  } catch (error) {throw erroEscritaModeracao(error);}
}
