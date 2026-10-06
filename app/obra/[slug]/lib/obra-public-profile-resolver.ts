import { supabase } from "../../../../lib/supabase/client";
import { idObraSupabaseValido } from "../../../../lib/utils";
import { carregarPerfisPublicosObra } from "./obra-public-profile-loader";
import {
  normalizarPerfilPublicoObra,
  obterTextoPerfilObra,
  type PerfilPublicoObra,
} from "./obra-text-utils";

export async function carregarPerfilPublicoObra(
  userId: string,
  nomeFallback: string
): Promise<PerfilPublicoObra | null> {
  const userIdLimpo = userId.trim();

  if (!idObraSupabaseValido(userIdLimpo)) {
    return null;
  }

  const perfis = await carregarPerfisPublicosObra([userIdLimpo]);
  const perfil = perfis.get(userIdLimpo);

  if (perfil) {
    return perfil;
  }

  try {
    const { data } = await supabase.auth.getUser();
    const usuario = data.user;

    if (usuario?.id === userIdLimpo) {
      const metadata =
        usuario.user_metadata && typeof usuario.user_metadata === "object"
          ? (usuario.user_metadata as Record<string, unknown>)
          : {};
      const nomeMetadata =
        obterTextoPerfilObra(metadata, "nome") ||
        obterTextoPerfilObra(metadata, "name") ||
        obterTextoPerfilObra(metadata, "full_name") ||
        usuario.email?.split("@")[0]?.trim() ||
        nomeFallback;
      const avatarMetadata =
        obterTextoPerfilObra(metadata, "avatar_url") ||
        obterTextoPerfilObra(metadata, "avatar") ||
        obterTextoPerfilObra(metadata, "picture");

      return {
        userId: userIdLimpo,
        nome: (nomeMetadata || "Usuário").slice(0, 80),
        avatar: avatarMetadata,
        bio: "",
      };
    }
  } catch {
    // O fallback de autenticação não deve bloquear o perfil.
  }

  return normalizarPerfilPublicoObra(null, userIdLimpo, nomeFallback || "Usuário");
}
