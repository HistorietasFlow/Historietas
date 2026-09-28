import type { UsuarioBuscaComunidade } from "./community-user";
import {
  obterInicialAvatarUsuarioBuscaComunidade,
  obterTextoBotaoSeguirUsuarioBuscaComunidade,
  obterTextoUsernameUsuarioBuscaComunidade,
} from "./community-user-search-display";
import {
  usuarioBuscaEhSeguidoComunidade,
  usuarioBuscaEhUsuarioAtualComunidade,
  usuarioBuscaEstaAtualizandoSeguimentoComunidade,
} from "./community-user-search-status";
import {
  criarPerfilHrefComunidade,
  obterAriaLabelPerfilComunidade,
} from "./community-profile-link";
import { CommunityUserSearchCard } from "./community-user-search-card";
import { CommunityUserSearchAvatar } from "./community-user-search-avatar";
import { CommunityUserSearchInfo } from "./community-user-search-info";
import { CommunityUserSearchName } from "./community-user-search-name";
import { CommunityUserSearchUsername } from "./community-user-search-username";
import { CommunityUserSearchFollowButton } from "./community-user-search-follow-button";
import { CommunityUserSearchSelfBadge } from "./community-user-search-self-badge";

type CommunityUserSearchResultProps = {
  usuarioBusca: UsuarioBuscaComunidade;
  usuarioAtualId: string | undefined;
  usuariosSeguidosIds: string[];
  usuarioSeguindoId: string | null;
  onAlternarSeguir: (
    usuarioBusca: UsuarioBuscaComunidade
  ) => void | Promise<void>;
};

export function CommunityUserSearchResult({
  usuarioBusca,
  usuarioAtualId,
  usuariosSeguidosIds,
  usuarioSeguindoId,
  onAlternarSeguir,
}: CommunityUserSearchResultProps) {
  const ehUsuarioAtual = usuarioBuscaEhUsuarioAtualComunidade(
    usuarioAtualId,
    usuarioBusca.id
  );
  const seguindoUsuario = usuarioBuscaEhSeguidoComunidade(
    usuariosSeguidosIds,
    usuarioBusca.id
  );
  const atualizandoSeguindo =
    usuarioBuscaEstaAtualizandoSeguimentoComunidade(
      usuarioSeguindoId,
      usuarioBusca.id
    );

  return (
    <CommunityUserSearchCard>
      <CommunityUserSearchAvatar
        href={criarPerfilHrefComunidade(
          usuarioBusca.id,
          usuarioBusca.nome
        )}
        ariaLabel={obterAriaLabelPerfilComunidade(usuarioBusca.nome)}
        avatar={usuarioBusca.avatar}
      >
        {!usuarioBusca.avatar &&
          obterInicialAvatarUsuarioBuscaComunidade(usuarioBusca.nome)}
      </CommunityUserSearchAvatar>

      <CommunityUserSearchInfo>
        <CommunityUserSearchName
          href={criarPerfilHrefComunidade(
            usuarioBusca.id,
            usuarioBusca.nome
          )}
        >
          {usuarioBusca.nome}
        </CommunityUserSearchName>

        <CommunityUserSearchUsername>
          {obterTextoUsernameUsuarioBuscaComunidade(usuarioBusca.username)}
        </CommunityUserSearchUsername>
      </CommunityUserSearchInfo>

      {ehUsuarioAtual ? (
        <CommunityUserSearchSelfBadge>Você</CommunityUserSearchSelfBadge>
      ) : (
        <CommunityUserSearchFollowButton
          onClick={() => onAlternarSeguir(usuarioBusca)}
          disabled={atualizandoSeguindo}
          following={seguindoUsuario}
        >
          {obterTextoBotaoSeguirUsuarioBuscaComunidade(
            atualizandoSeguindo,
            seguindoUsuario
          )}
        </CommunityUserSearchFollowButton>
      )}
    </CommunityUserSearchCard>
  );
}
