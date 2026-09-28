import type { AcoesPostComunidade } from "./community-post-action-factory";
import { CommunityPostActionBar } from "./community-post-action-bar";
import { CommunityPostCard } from "./community-post-card";
import { CommunityPostContent } from "./community-post-content";
import { CommunityPostHeader } from "./community-post-header";
import { CommunityPostHeaderMetadata } from "./community-post-header-metadata";
import type { PostComunidade } from "./community-post-model";
import { CommunityPostOptionsMenu } from "./community-post-options-menu";
import type { obterEstadoApresentacaoPostComunidade } from "./community-post-presentation-state";
import type { ResultadoVotosEnquete } from "./community-poll-votes-result";
import type { ObraRelacionadaSugestao } from "./community-related-work-suggestion";

type CommunityPostItemProps = {
  post: PostComunidade;
  desktop: boolean;
  estadoPost: ReturnType<typeof obterEstadoApresentacaoPostComunidade>;
  acoesPost: AcoesPostComunidade;
  postMenuAbertoId: string | null;
  usuarioEhAdmin: boolean;
  obrasRelacionadasSugestoes: ObraRelacionadaSugestao[];
  votosEnquetes: Record<string, string>;
  resultadosEnquetes: ResultadoVotosEnquete;
  votandoEnqueteId: string | null;
};

export function CommunityPostItem({
  post,
  desktop,
  estadoPost,
  acoesPost,
  postMenuAbertoId,
  usuarioEhAdmin,
  obrasRelacionadasSugestoes,
  votosEnquetes,
  resultadosEnquetes,
  votandoEnqueteId,
}: CommunityPostItemProps) {
  const {
    usuarioCurtiu,
    postSalvo,
    podeRemover,
    podeDenunciarPost,
    postCurtindo,
    postSalvando,
    postCompartilhando,
    postRemovendo,
    postFixando,
    postVisibilidadeAtualizando,
    podeAlterarVisibilidade,
    postDenunciando,
    ocultarTextoSpoiler,
    obraRelacionadaPermitida,
    menuOpcoesAberto,
  } = estadoPost;

  return (
    <CommunityPostCard isDesktop={desktop}>
      <CommunityPostHeader>
        <CommunityPostHeaderMetadata post={post} />

        <CommunityPostOptionsMenu
          post={post}
          postMenuAbertoId={postMenuAbertoId}
          menuOpcoesAberto={menuOpcoesAberto}
          postSalvo={postSalvo}
          postSalvando={postSalvando}
          postCompartilhando={postCompartilhando}
          podeAlterarVisibilidade={podeAlterarVisibilidade}
          postVisibilidadeAtualizando={postVisibilidadeAtualizando}
          usuarioEhAdmin={usuarioEhAdmin}
          postFixando={postFixando}
          podeRemover={podeRemover}
          postRemovendo={postRemovendo}
          podeDenunciarPost={podeDenunciarPost}
          postDenunciando={postDenunciando}
          onAlternarMenu={acoesPost.alternarMenu}
          onFecharMenu={acoesPost.fecharMenu}
          onSalvar={acoesPost.salvar}
          onCompartilhar={acoesPost.compartilhar}
          onAtualizarVisibilidade={acoesPost.atualizarVisibilidade}
          onAlternarFixado={acoesPost.alternarFixado}
          onRemover={acoesPost.remover}
          onDenunciar={acoesPost.denunciar}
        />
      </CommunityPostHeader>

      <CommunityPostContent
        post={post}
        obraRelacionadaPermitida={obraRelacionadaPermitida}
        obrasRelacionadasSugestoes={obrasRelacionadasSugestoes}
        ocultarTextoSpoiler={ocultarTextoSpoiler}
        votosEnquetes={votosEnquetes}
        resultadosEnquetes={resultadosEnquetes}
        votandoEnqueteId={votandoEnqueteId}
        onVotar={acoesPost.votar}
      />

      <CommunityPostActionBar
        post={post}
        desktop={desktop}
        usuarioCurtiu={usuarioCurtiu}
        postCurtindo={postCurtindo}
        ocultarTextoSpoiler={ocultarTextoSpoiler}
        onAlternarCurtida={acoesPost.alternarCurtida}
        onAbrirComentarios={acoesPost.abrirComentarios}
        onAlternarSpoiler={acoesPost.alternarSpoiler}
      />
    </CommunityPostCard>
  );
}
