import type { ProblemaTecnicoRpcRow } from "./ajuda-technical-support";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function lerChamadosConfirmados(data: unknown): ProblemaTecnicoRpcRow[] {
  if (!Array.isArray(data) || data.some(item =>
    !item || typeof item.problema_id !== "string" || !uuid.test(item.problema_id)
  )) throw new Error("Resposta de chamados inválida");
  return data;
}

export function criacaoConfirmada(data: unknown) {
  if (!Array.isArray(data) || data.length !== 1) return false;
  const row = data[0];
  return Boolean(row && typeof row.problema_id === "string" && uuid.test(row.problema_id) &&
    ["aberto", "em_analise", "aguardando_usuario", "resolvido", "fechado"].includes(row.problema_status) &&
    typeof row.problema_criado_em === "string" && Number.isFinite(Date.parse(row.problema_criado_em)));
}

// Only explicit SQL rejections known to roll the RPC back permit a new attempt.
// Transport errors, unknown codes and missing/malformed receipts stay uncertain.
export function criacaoRejeitada(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  return ["42501", "P0001", "23514", "23502", "23505", "22001", "22P02"].includes(String(error.code));
}
