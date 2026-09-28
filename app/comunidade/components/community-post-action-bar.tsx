import {
  obterAriaLabelComentariosPostComunidade,
  obterAriaLabelCurtidaPostComunidade,
  obterTextoBotaoSpoilerPostComunidade,
} from "./community-post-action-text";
import { CommunityPostActions } from "./community-post-actions";
import { CommunityPostCommentsButton } from "./community-post-comments-button";
import { CommunityPostLikeButton } from "./community-post-like-button";
import type { PostComunidade } from "./community-post-model";
import { CommunityPostSpoilerButton } from "./community-post-spoiler-button";
import { contarComentaristasUnicosPostComunidade } from "./community-unique-post-commenters-count";
import { contarCurtidasUnicasPostComunidade } from "./community-unique-post-likes-count";

type CommunityPostActionBarProps = {
  post: PostComunidade;
  desktop: boolean;
  usuarioCurtiu: boolean;
  postCurtindo: boolean;
  ocultarTextoSpoiler: boolean;
  onAlternarCurtida: () => void;
  onAbrirComentarios: () => void;
  onAlternarSpoiler: () => void;
};

export function CommunityPostActionBar({
  post,
  desktop,
  usuarioCurtiu,
  postCurtindo,
  ocultarTextoSpoiler,
  onAlternarCurtida,
  onAbrirComentarios,
  onAlternarSpoiler,
}: CommunityPostActionBarProps) {
  return (
    <CommunityPostActions desktop={desktop}>
      <CommunityPostLikeButton
        onClick={() => onAlternarCurtida()}
        disabled={postCurtindo}
        liked={usuarioCurtiu}
        count={contarCurtidasUnicasPostComunidade(post)}
        ariaLabel={obterAriaLabelCurtidaPostComunidade(
          usuarioCurtiu,
          contarCurtidasUnicasPostComunidade(post)
        )}
      />

      <CommunityPostCommentsButton
        onClick={() => onAbrirComentarios()}
        count={contarComentaristasUnicosPostComunidade(post)}
        ariaLabel={obterAriaLabelComentariosPostComunidade(
          contarComentaristasUnicosPostComunidade(post)
        )}
      />

      {post.temSpoiler && (
        <CommunityPostSpoilerButton
          onClick={() => onAlternarSpoiler()}
        >
          {obterTextoBotaoSpoilerPostComunidade(
            ocultarTextoSpoiler
          )}
        </CommunityPostSpoilerButton>
      )}
    </CommunityPostActions>
  );
}
