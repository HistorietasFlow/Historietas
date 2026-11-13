import "server-only";
import { criarSupabaseAdminClient } from "../../supabase/admin";
import { isCoverUuid } from "../../private-covers/reference";

const BUCKET = "capas-obras-privadas";
const MAX_BYTES = 2 * 1024 * 1024;
const MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

/**
 * Fonte fornecida SOMENTE pelo futuro autorizador do banco.
 * Formato correto nao comprova propriedade, sessao ativa ou quota fisica.
 * Nenhuma rota ou escritor importa este modulo nesta fase.
 */
export type ObjetoPrivadoConferido = Readonly<{
  obraId: string;
  usuarioId: string;
  geracao: string;
  assetId: string;
  caminho: string;
  tipoMime: "image/png" | "image/jpeg" | "image/webp";
}>;

export function caminhoCapaPrivadaValido(input: ObjetoPrivadoConferido | null): boolean {
  if (!input || ![input.obraId, input.usuarioId, input.geracao, input.assetId].every(isCoverUuid)
    || !MIME.has(input.tipoMime)) return false;
  const ext = input.tipoMime === "image/jpeg" ? "jpg" : input.tipoMime === "image/png" ? "png" : "webp";
  return input.caminho === `${input.usuarioId}/${input.geracao}/${input.assetId}.${ext}`;
}

/** Transporte read-only via SDK Storage (sem signed/public URL).
 * O servidor de entrega ainda deve autorizar e REVALIDAR a mesma fonte
 * e sessao no primario antes de devolver qualquer byte.
 */
export async function baixarCapaPrivadaConferida(input: ObjetoPrivadoConferido | null): Promise<Blob | null> {
  if (!caminhoCapaPrivadaValido(input) || !input) return null;
  const admin = criarSupabaseAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).download(input.caminho);
  if (error || !data || data.size <= 0 || data.size > MAX_BYTES || data.type !== input.tipoMime) return null;
  return data;
}

// Sem upload, remove, assinatura, listagem ou URLs publicas.
// Nao ha produtor autorizado de retencoes nem fencing comprovado na conclusao fisica.
