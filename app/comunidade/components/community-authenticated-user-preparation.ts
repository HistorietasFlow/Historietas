import { consultarUsuarioEhAdminComunidade } from "./community-admin-status-query";
import { obterAvatarProfileComunidade } from "./community-profile-avatar";
import { obterNomeProfileComunidade } from "./community-profile-name";
import { obterTextoProfileComunidade } from "./community-profile-text";
import { carregarProfilesComunidadePorUsuarios } from "./community-supabase-profiles-loader";

type DadosPerfilEAdminComunidade = {
  nomeProfile: string;
  avatarProfile: string;
  usuarioAdmin: boolean;
};

export async function prepararPerfilEStatusAdminComunidade(
  usuarioId: string
): Promise<DadosPerfilEAdminComunidade> {
  let nomeProfile = "";
  let avatarProfile = "";

  try {
    const profilesPorUsuario = await carregarProfilesComunidadePorUsuarios(
      [usuarioId],
      obterTextoProfileComunidade
    );
    const profile = profilesPorUsuario.get(usuarioId);

    nomeProfile = obterNomeProfileComunidade(profile);
    avatarProfile = obterAvatarProfileComunidade(profile);
  } catch {
    nomeProfile = "";
    avatarProfile = "";
  }

  const usuarioAdmin = await consultarUsuarioEhAdminComunidade();

  return {
    nomeProfile,
    avatarProfile,
    usuarioAdmin,
  };
}
