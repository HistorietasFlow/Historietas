import { CHAVE_VOTOS_ENQUETES_COMUNIDADE } from "./community-storage-keys";

type SalvarJsonUsuarioComunidade = (
  chave: string,
  userId: string,
  valor: unknown
) => void;

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
