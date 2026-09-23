import { CHAVE_VOTOS_ENQUETES_COMUNIDADE } from "./community-storage-keys";
import type { SalvarJsonUsuarioComunidade } from "./community-user-json-saver";

export function salvarVotosEnquetesLocais(
  salvarJsonUsuarioComunidade: SalvarJsonUsuarioComunidade,
  votos: Record<string, string>,
  userId = ""
) {
  salvarJsonUsuarioComunidade(
    CHAVE_VOTOS_ENQUETES_COMUNIDADE,
    userId,
    votos
  );
}
