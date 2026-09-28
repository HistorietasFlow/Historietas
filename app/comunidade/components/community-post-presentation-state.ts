import type { DenunciaAlvoComunidade } from "./community-report-target";
import type { PostComunidade } from "./community-post-model";
import {
  deveOcultarTextoSpoilerComunidade,
  menuOpcoesPostEstaAbertoComunidade,
  postEstaAtualizandoVisibilidade,
  postEstaSalvoComunidade,
  postEstaSendoCompartilhado,
  postEstaSendoCurtido,
  postEstaSendoDenunciadoComunidade,
  postEstaSendoFixado,
  postEstaSendoRemovido,
  postEstaSendoSalvo,
  spoilerPostEstaReveladoComunidade,
  usuarioCurtiuPostComunidade,
} from "./community-post-interaction-status";
import {
  usuarioPodeAlterarVisibilidadePostComunidade,
  usuarioPodeDenunciarPostComunidade,
  usuarioPodeRemoverPostComunidade,
} from "./community-post-permissions";
import { obterObraRelacionadaPermitida } from "./community-related-work-allowed-finder";
import type { ObraRelacionadaSugestao } from "./community-related-work-suggestion";
import type { UsuarioComunidade } from "./community-user";

type ObterEstadoApresentacaoPostComunidadeParams = {
  post: PostComunidade;
  usuario: UsuarioComunidade | null;
  postsSalvosIds: string[];
  carregandoUsuario: boolean;
  usuarioEhAdmin: boolean;
  postCurtindoId: string | null;
  postSalvandoId: string | null;
  postCompartilhandoId: string | null;
  postRemovendoId: string | null;
  postFixandoId: string | null;
  postVisibilidadeAtualizandoId: string | null;
  denunciaAlvo: DenunciaAlvoComunidade | null;
  spoilersReveladosIds: string[];
  obrasRelacionadasSugestoes: ObraRelacionadaSugestao[];
  postMenuAbertoId: string | null;
};

export function obterEstadoApresentacaoPostComunidade({
  post,
  usuario,
  postsSalvosIds,
  carregandoUsuario,
  usuarioEhAdmin,
  postCurtindoId,
  postSalvandoId,
  postCompartilhandoId,
  postRemovendoId,
  postFixandoId,
  postVisibilidadeAtualizandoId,
  denunciaAlvo,
  spoilersReveladosIds,
  obrasRelacionadasSugestoes,
  postMenuAbertoId,
}: ObterEstadoApresentacaoPostComunidadeParams) {
  const usuarioCurtiu = usuarioCurtiuPostComunidade(usuario, post);
  const postSalvo = postEstaSalvoComunidade(postsSalvosIds, post);
  const usuarioAtualId = usuario?.id.trim() || "";
  const autorPostId = post.autorId.trim();
  const podeRemover = usuarioPodeRemoverPostComunidade(
    carregandoUsuario,
    usuarioAtualId,
    autorPostId,
    usuarioEhAdmin
  );
  const podeDenunciarPost = usuarioPodeDenunciarPostComunidade(
    carregandoUsuario,
    usuarioAtualId,
    autorPostId
  );
  const postCurtindo = postEstaSendoCurtido(postCurtindoId, post);
  const postSalvando = postEstaSendoSalvo(postSalvandoId, post);
  const postCompartilhando = postEstaSendoCompartilhado(
    postCompartilhandoId,
    post
  );
  const postRemovendo = postEstaSendoRemovido(postRemovendoId, post);
  const postFixando = postEstaSendoFixado(postFixandoId, post);
  const postVisibilidadeAtualizando = postEstaAtualizandoVisibilidade(
    postVisibilidadeAtualizandoId,
    post
  );
  const podeAlterarVisibilidade =
    usuarioPodeAlterarVisibilidadePostComunidade(
      carregandoUsuario,
      usuarioAtualId,
      autorPostId
    );
  const postDenunciando = postEstaSendoDenunciadoComunidade(
    denunciaAlvo,
    post
  );
  const spoilerRevelado = spoilerPostEstaReveladoComunidade(
    spoilersReveladosIds,
    post
  );
  const ocultarTextoSpoiler = deveOcultarTextoSpoilerComunidade(
    post,
    spoilerRevelado
  );
  const obraRelacionadaPermitida = obterObraRelacionadaPermitida(
    post.obraRelacionada,
    obrasRelacionadasSugestoes
  );
  const menuOpcoesAberto = menuOpcoesPostEstaAbertoComunidade(
    postMenuAbertoId,
    post
  );

  return {
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
  };
}
