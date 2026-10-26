import type { TablesInsert } from "../../../lib/supabase/database.types";

export type PerfilExistenteLogin = {
  id?: string | null;
  user_id?: string | null;
  nome?: string | null;
  bio?: string | null;
  sobre_bio?: string | null;
  avatar_url?: string | null;
};

export function criarPayloadProfileLogin(
  perfilAtual: PerfilExistenteLogin | null,
  userIdLimpo: string,
  nomeFinal: string,
  atualizadoEm: string,
): TablesInsert<"profiles"> {
  return {
    user_id: userIdLimpo,
    nome: perfilAtual?.nome?.trim() || nomeFinal,
    bio: perfilAtual?.bio?.trim() || "Perfil de leitor no Historietas.",
    sobre_bio:
      perfilAtual?.sobre_bio?.trim() ||
      perfilAtual?.bio?.trim() ||
      "Perfil de leitor no Historietas.",
    avatar_url: perfilAtual?.avatar_url || "",
    atualizado_em: atualizadoEm,
  };
}
