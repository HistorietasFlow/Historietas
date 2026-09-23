import type { PerfilComunidadeRow } from "./community-supabase-profile-row";

export type ObterTextoProfileComunidade = (
  profile: PerfilComunidadeRow | undefined,
  chave: string
) => string;
