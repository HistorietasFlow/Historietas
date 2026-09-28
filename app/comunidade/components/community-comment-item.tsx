import type { ComentarioComunidade } from "./community-comment";
import { CommunityCommentActionsRow } from "./community-comment-actions-row";
import {
  obterAriaLabelCurtidaComentarioComunidade,
  obterTextoBotaoDenunciarComentarioComunidade,
  obterTextoBotaoRemoverComentarioComunidade,
  obterTextoBotaoResponderComentarioComunidade,
} from "./community-comment-action-text";
import { CommunityCommentAuthorLink } from "./community-comment-author-link";
import { CommunityCommentAuthorTimeRow } from "./community-comment-author-time-row";
import { CommunityCommentAvatar } from "./community-comment-avatar";
import { CommunityCommentContentContainer } from "./community-comment-content-container";
import { CommunityCommentHeartIcon } from "./community-comment-heart-icon";
import {
  comentarioEstaSendoCurtidoComunidade,
  comentarioEstaSendoDenunciadoComunidade,
  comentarioEstaSendoRemovidoComunidade,
  deveDesabilitarAcaoComentarioComunidade,
  deveDesabilitarCurtidaComentarioComunidade,
  usuarioCurtiuComentarioComunidade,
  usuarioPodeDenunciarComentarioComunidade,
  usuarioPodeRemoverComentarioComunidade,
} from "./community-comment-interaction-status";
import { CommunityCommentItemContainer } from "./community-comment-item-container";
import { CommunityCommentLikeButton } from "./community-comment-like-button";
import { CommunityCommentLikeContainer } from "./community-comment-like-container";
import { CommunityCommentLikeCount } from "./community-comment-like-count";
import { CommunityCommentRemoveButton } from "./community-comment-remove-button";
import { CommunityCommentReplyButton } from "./community-comment-reply-button";
import { CommunityCommentReportButton } from "./community-comment-report-button";
import { formatarTempoRelativoComentarioComunidade } from "./community-comment-relative-time";
import { CommunityCommentText } from "./community-comment-text";
import { CommunityCommentTime } from "./community-comment-time";
import { criarPerfilHrefComunidade } from "./community-profile-link";

type CommunityCommentItemProps = {
  comentario: ComentarioComunidade;
  comentarioRaizId: string;
  resposta?: boolean;
  usuarioId: string;
  podeComentar: boolean;
  agoraComentarios: number;
  postId: string;
  comentarioCurtindoId: string | null;
  comentarioRemovendoId: string | null;
  comentarioDenunciandoId: string | null;
  onResponderComentario: (
    comentario: ComentarioComunidade,
    comentarioRaizId: string
  ) => void;
  onCurtirComentario: (
    postId: string,
    comentarioId: string
  ) => void | Promise<void>;
  onRemoverComentario: (
    postId: string,
    comentarioId: string
  ) => void | Promise<void>;
  onDenunciarComentario: (comentarioId: string) => void | Promise<void>;
};

export function CommunityCommentItem({
  comentario,
  comentarioRaizId,
  resposta = false,
  usuarioId,
  podeComentar,
  agoraComentarios,
  postId,
  comentarioCurtindoId,
  comentarioRemovendoId,
  comentarioDenunciandoId,
  onResponderComentario,
  onCurtirComentario,
  onRemoverComentario,
  onDenunciarComentario,
}: CommunityCommentItemProps) {
  const usuarioCurtiuComentario = usuarioCurtiuComentarioComunidade(
    usuarioId,
    comentario
  );
  const podeRemoverComentario = usuarioPodeRemoverComentarioComunidade(
    usuarioId,
    comentario
  );
  const podeDenunciarComentario = usuarioPodeDenunciarComentarioComunidade(
    usuarioId,
    comentario
  );
  const comentarioCurtindo = comentarioEstaSendoCurtidoComunidade(
    comentarioCurtindoId,
    comentario
  );
  const comentarioRemovendo = comentarioEstaSendoRemovidoComunidade(
    comentarioRemovendoId,
    comentario
  );
  const comentarioDenunciando = comentarioEstaSendoDenunciadoComunidade(
    comentarioDenunciandoId,
    comentario
  );

  return (
    <CommunityCommentItemContainer isReply={resposta}>
      <CommunityCommentAvatar
        href={criarPerfilHrefComunidade(
          comentario.autorId,
          comentario.autorNome
        )}
        authorName={comentario.autorNome}
        avatar={comentario.autorAvatar}
        isReply={resposta}
      />

      <CommunityCommentContentContainer>
        <CommunityCommentAuthorTimeRow>
          <CommunityCommentAuthorLink
            href={criarPerfilHrefComunidade(
              comentario.autorId,
              comentario.autorNome
            )}
          >
            {comentario.autorNome}
          </CommunityCommentAuthorLink>

          <CommunityCommentTime>
            {formatarTempoRelativoComentarioComunidade(
              comentario.criadoEm,
              agoraComentarios
            )}
          </CommunityCommentTime>
        </CommunityCommentAuthorTimeRow>

        <CommunityCommentText>{comentario.texto}</CommunityCommentText>

        <CommunityCommentActionsRow>
          <CommunityCommentReplyButton
            onClick={() =>
              onResponderComentario(comentario, comentarioRaizId)
            }
            disabled={deveDesabilitarAcaoComentarioComunidade(podeComentar)}
          >
            {obterTextoBotaoResponderComentarioComunidade()}
          </CommunityCommentReplyButton>

          {podeRemoverComentario ? (
            <CommunityCommentRemoveButton
              onClick={() => onRemoverComentario(postId, comentario.id)}
              disabled={comentarioRemovendo}
            >
              {obterTextoBotaoRemoverComentarioComunidade(
                comentarioRemovendo
              )}
            </CommunityCommentRemoveButton>
          ) : null}

          {podeDenunciarComentario ? (
            <CommunityCommentReportButton
              onClick={() => onDenunciarComentario(comentario.id)}
              disabled={comentarioDenunciando}
            >
              {obterTextoBotaoDenunciarComentarioComunidade(
                comentarioDenunciando
              )}
            </CommunityCommentReportButton>
          ) : null}
        </CommunityCommentActionsRow>
      </CommunityCommentContentContainer>

      <CommunityCommentLikeContainer>
        <CommunityCommentLikeButton
          aria-pressed={usuarioCurtiuComentario}
          aria-label={obterAriaLabelCurtidaComentarioComunidade(
            usuarioCurtiuComentario,
            comentario.curtidas.length
          )}
          onClick={() => onCurtirComentario(postId, comentario.id)}
          disabled={deveDesabilitarCurtidaComentarioComunidade(
            podeComentar,
            comentarioCurtindo
          )}
        >
          <CommunityCommentHeartIcon liked={usuarioCurtiuComentario} />
        </CommunityCommentLikeButton>

        <CommunityCommentLikeCount>
          {comentario.curtidas.length}
        </CommunityCommentLikeCount>
      </CommunityCommentLikeContainer>
    </CommunityCommentItemContainer>
  );
}
