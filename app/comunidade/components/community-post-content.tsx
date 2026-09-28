import { CommunityPostBadgeSeparator } from "./community-post-badge-separator";
import { CommunityPostBadgesRow } from "./community-post-badges-row";
import type { PostComunidade } from "./community-post-model";
import { CommunityPostPoll } from "./community-post-poll";
import { postEhEnquete } from "./community-post-poll-check";
import { CommunityPostText } from "./community-post-text";
import { CommunityPostTypeBadge } from "./community-post-type-badge";
import { obterPerguntaEnquete } from "./community-poll-question";
import type { ResultadoVotosEnquete } from "./community-poll-votes-result";
import { CommunityRelatedChapterBadge } from "./community-related-chapter-badge";
import { criarLinkObraRelacionada } from "./community-related-work-link";
import { CommunityRelatedWorkBadge } from "./community-related-work-badge";
import type { ObraRelacionadaSugestao } from "./community-related-work-suggestion";
import { CommunitySpoilerHiddenTitle } from "./community-spoiler-hidden-title";
import { obterTipoVisualPublicacao } from "./community-publication-visual-type";

type CommunityPostContentProps = {
  post: PostComunidade;
  obraRelacionadaPermitida: ObraRelacionadaSugestao | null;
  obrasRelacionadasSugestoes: ObraRelacionadaSugestao[];
  ocultarTextoSpoiler: boolean;
  votosEnquetes: Record<string, string>;
  resultadosEnquetes: ResultadoVotosEnquete;
  votandoEnqueteId: string | null;
  onVotar: (opcao: string) => void;
};

export function CommunityPostContent({
  post,
  obraRelacionadaPermitida,
  obrasRelacionadasSugestoes,
  ocultarTextoSpoiler,
  votosEnquetes,
  resultadosEnquetes,
  votandoEnqueteId,
  onVotar,
}: CommunityPostContentProps) {
  return (
    <>
      <CommunityPostBadgesRow>
        {obraRelacionadaPermitida && (
          <>
            <CommunityRelatedWorkBadge
              href={criarLinkObraRelacionada(
                obraRelacionadaPermitida.titulo,
                obrasRelacionadasSugestoes
              )}
            >
              {obraRelacionadaPermitida.titulo}
            </CommunityRelatedWorkBadge>

            <CommunityPostBadgeSeparator />
          </>
        )}

        {obraRelacionadaPermitida && post.capituloRelacionado && (
          <>
            <CommunityRelatedChapterBadge>
              {post.capituloRelacionado}
            </CommunityRelatedChapterBadge>

            <CommunityPostBadgeSeparator />
          </>
        )}

        <CommunityPostTypeBadge isPoll={postEhEnquete(post)}>
          {postEhEnquete(post)
            ? obterPerguntaEnquete(post.texto)
            : obterTipoVisualPublicacao(post)}
        </CommunityPostTypeBadge>
      </CommunityPostBadgesRow>

      {ocultarTextoSpoiler ? (
        <CommunitySpoilerHiddenTitle>
          Conteúdo com spoiler oculto
        </CommunitySpoilerHiddenTitle>
      ) : (
        <>
          {postEhEnquete(post) ? (
            <CommunityPostPoll
              post={post}
              votosEnquetes={votosEnquetes}
              resultadosEnquetes={resultadosEnquetes}
              votandoEnqueteId={votandoEnqueteId}
              onVotar={(opcao) => onVotar(opcao)}
            />
          ) : (
            <CommunityPostText>{post.texto}</CommunityPostText>
          )}
        </>
      )}
    </>
  );
}
