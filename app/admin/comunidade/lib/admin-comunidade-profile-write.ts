import { supabase } from "../../../../lib/supabase/client";
import { ErroEscritaModeracao, erroEscritaModeracao } from "./admin-comunidade-confirmed-write";
import { STATUS_DENUNCIAS_PERFIS, type StatusDenunciaPerfil } from "./admin-comunidade-status-utils";
export type EstadoPerfilModeracao = {id: string; status: StatusDenunciaPerfil; atualizadoEm: string};
export async function escreverPerfilModeracao(esperada: EstadoPerfilModeracao, payload: {status: StatusDenunciaPerfil; atualizado_em: string} | null) {
  if (!esperada.atualizadoEm || !Number.isFinite(Date.parse(esperada.atualizadoEm))) throw new ErroEscritaModeracao("conflito", "A versão da denúncia de perfil não foi confirmada.");
  try {
    const query = payload ? supabase.from("denuncias_perfis").update(payload) : supabase.from("denuncias_perfis").delete();
    const {data, error} = await query.eq("id", esperada.id).eq("status", esperada.status).eq("atualizado_em", esperada.atualizadoEm).select("id,status,atualizado_em");
    if (error) throw erroEscritaModeracao(error);
    if (Array.isArray(data) && data.length === 0) throw new ErroEscritaModeracao("conflito", "A denúncia de perfil mudou. Reabra o painel.");
    const row = Array.isArray(data) && data.length === 1 ? data[0] : null;
    if (!row || row.id !== esperada.id || !STATUS_DENUNCIAS_PERFIS.includes(row.status as StatusDenunciaPerfil) ||
        row.status !== (payload?.status || esperada.status) || typeof row.atualizado_em !== "string" || !Number.isFinite(Date.parse(row.atualizado_em)) ||
        (!payload && row.atualizado_em !== esperada.atualizadoEm) ||
        (payload && row.atualizado_em === esperada.atualizadoEm)) throw new ErroEscritaModeracao("incerto", "O resultado da denúncia de perfil não foi confirmado.");
    return {id: row.id, status: row.status as StatusDenunciaPerfil, atualizadoEm: row.atualizado_em};
  } catch (error) {throw erroEscritaModeracao(error);}
}
