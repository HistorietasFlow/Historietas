import type { SupabaseClient } from "@supabase/supabase-js";
import { confirmarEditorialRemoto, ehStatusEditorial, type ConfirmacaoEditorial, type StatusEditorial } from "../../../lib/statusEditorial";

export type ResultadoEdicaoRemota =
  | { estado: "confirmada"; confirmacao: ConfirmacaoEditorial }
  | { estado: "rejeitada" | "sem_linha" | "incerta" | "contexto_invalido" };

// Uma única instrução protege TODOS os metadados quando há intenção editorial.
// Nenhum cleanup, retry, persistência ou refresh de versão acontece aqui.
export async function escreverMetadadosObra(
  cliente: SupabaseClient,
  { id, userId, payload, editorial, vigente = () => true }: {
    id: string;
    userId: string;
    payload: Record<string, unknown>;
    editorial?: { confirmado: ConfirmacaoEditorial; escolha: StatusEditorial | null };
    vigente?: () => boolean;
  },
): Promise<ResultadoEdicaoRemota> {
  if (!id || !userId || !vigente() || Object.hasOwn(payload, "status_editorial") ||
      Object.hasOwn(payload, "status_editorial_versao")) return { estado: "contexto_invalido" };
  if (editorial && (editorial.confirmado.id !== id || editorial.confirmado.userId !== userId ||
      !confirmarEditorialRemoto({ id, user_id: userId, status_editorial: editorial.confirmado.status,
        status_editorial_versao: editorial.confirmado.versao }, id, userId) ||
      !(editorial.escolha === null || ehStatusEditorial(editorial.escolha)))) return { estado: "contexto_invalido" };
  try {
    let escrita = cliente.from("obras").update({ ...payload,
      ...(editorial ? { status_editorial: editorial.escolha } : {}) }).eq("id", id).eq("user_id", userId);
    if (editorial) escrita = editorial.confirmado.versao === null
      ? escrita.is("status_editorial_versao", null)
      : escrita.eq("status_editorial_versao", editorial.confirmado.versao);
    const { data, error } = await escrita.select("id,user_id,status_editorial,status_editorial_versao");
    if (!vigente()) return { estado: "contexto_invalido" };
    if (error) {
      // Somente um SQLSTATE retornado pelo banco comprova rejeição. Proxies,
      // falhas HTTP e respostas ausentes podem ocorrer depois do commit.
      return { estado: /^[0-9A-Z]{5}$/.test(error.code || "") ? "rejeitada" : "incerta" };
    }
    if (Array.isArray(data) && data.length === 0) return { estado: "sem_linha" };
    if (!Array.isArray(data) || data.length !== 1) return { estado: "incerta" };
    const confirmacao = confirmarEditorialRemoto(data[0], id, userId);
    return confirmacao ? { estado: "confirmada", confirmacao } : { estado: "incerta" };
  } catch {
    return { estado: "incerta" };
  }
}
