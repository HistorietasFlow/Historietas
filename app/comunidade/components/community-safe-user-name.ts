import type { UsuarioComunidade } from "./community-user";
import { carregarProfilesComunidadePorUsuarios } from "./community-supabase-profiles-loader";
import { obterTextoProfileComunidade } from "./community-profile-text";
import { obterNomeProfileComunidade } from "./community-profile-name";
import { obterNomeUsuario } from "./community-user-name";

export async function obterNomeSeguroUsuarioComunidade(usuario: UsuarioComunidade) {
  try {
    const profilesPorUsuario = await carregarProfilesComunidadePorUsuarios(
      [usuario.id],
      obterTextoProfileComunidade
    );
    const profile = profilesPorUsuario.get(usuario.id);
    const nomeProfile = obterNomeProfileComunidade(profile);

    return obterNomeUsuario(usuario.email, nomeProfile || usuario.nome).slice(
      0,
      80
    );
  } catch {
    return obterNomeUsuario(usuario.email, usuario.nome).slice(0, 80);
  }
}
