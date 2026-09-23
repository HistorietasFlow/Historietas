import type { PerfilComunidadeRow } from "./community-supabase-profile-row";

export type ObterDadoProfileComunidade = (
  profile: PerfilComunidadeRow | undefined
) => string;
