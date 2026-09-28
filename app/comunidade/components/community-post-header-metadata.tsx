import {
  CommunityPostAuthorAvatar,
  obterInicialAvatarAutorPostComunidade,
} from "./community-post-author-avatar";
import { CommunityPostAuthorLink } from "./community-post-author-link";
import { CommunityPostAuthorMeta } from "./community-post-author-meta";
import { formatarDataComunidade } from "./community-post-date-formatter";
import type { PostComunidade } from "./community-post-model";
import { CommunityPostPinnedBadge } from "./community-post-pinned-badge";
import { CommunityPostStatusLine } from "./community-post-status-line";
import { CommunityPostStatusSeparator } from "./community-post-status-separator";
import { CommunityPostVisibilityBadge } from "./community-post-visibility-badge";
import { obterRotuloVisibilidadePostComunidade } from "./community-post-visibility-options";
import {
  criarPerfilHrefComunidade,
  obterAriaLabelPerfilComunidade,
} from "./community-profile-link";

type CommunityPostHeaderMetadataProps = {
  post: PostComunidade;
};

export function CommunityPostHeaderMetadata({
  post,
}: CommunityPostHeaderMetadataProps) {
  return (
    <>
      <CommunityPostAuthorAvatar
        href={criarPerfilHrefComunidade(
          post.autorId,
          post.autorNome
        )}
        ariaLabel={obterAriaLabelPerfilComunidade(
          post.autorNome
        )}
        avatar={post.autorAvatar}
      >
        {!post.autorAvatar &&
          obterInicialAvatarAutorPostComunidade(
            post.autorNome
          )}
      </CommunityPostAuthorAvatar>

      <CommunityPostAuthorMeta>
        <CommunityPostAuthorLink
          href={criarPerfilHrefComunidade(
            post.autorId,
            post.autorNome
          )}
        >
          {post.autorNome}
        </CommunityPostAuthorLink>
        <CommunityPostStatusLine>
          {formatarDataComunidade(post.criadoEm)}
          {post.fixado && (
            <>
              {" "}
              <CommunityPostStatusSeparator />
              {" "}
              <CommunityPostPinnedBadge>Fixado</CommunityPostPinnedBadge>
            </>
          )}
          {post.visibilidade !== "publico" && (
            <>
              {" "}
              <CommunityPostStatusSeparator />
              {" "}
              <CommunityPostVisibilityBadge>
                {obterRotuloVisibilidadePostComunidade(
                  post.visibilidade,
                )}
              </CommunityPostVisibilityBadge>
            </>
          )}
        </CommunityPostStatusLine>
      </CommunityPostAuthorMeta>
    </>
  );
}
