import type { Dispatch, FormEvent, RefObject, SetStateAction } from "react";
import { emitirFeedbackAcao } from "./community-action-feedback-toast";
import {
  finalizarAcaoComunidade,
  iniciarAcaoComunidade,
} from "./community-action-lock";
import type { CategoriaComunidade } from "./community-category";
import { consultarPostCriadoComunidade } from "./community-created-post-query";
import { mapearPostCriadoComunidade } from "./community-created-post-mapper";
import { registrarReviewComunidadeNoDiario } from "./community-diary-review-registrar";
import { prepararDadosInsercaoPostComunidade } from "./community-post-insert-payload";
import { inserirPostSupabaseComunidade } from "./community-post-insert";
import type { PostComunidade } from "./community-post-model";
import { validarConteudoPublicacaoComunidade } from "./community-post-publication-validation";
import type { VisibilidadePostComunidade } from "./community-post-visibility";
import { normalizarVisibilidadePostComunidade } from "./community-post-visibility-normalizer";
import type { TipoPublicacaoComunidade } from "./community-publication-type";
import { obterObraRelacionadaPermitida } from "./community-related-work-allowed-finder";
import { removerSugestoesObrasDuplicadas } from "./community-related-work-deduplicator";
import { obterPrimeiraSugestaoObraSupabaseComunidade } from "./community-related-work-search-result";
import type { ObraRelacionadaSugestao } from "./community-related-work-suggestion";
import { consultarObrasPorTituloComunidade } from "./community-related-work-title-query";
import { obterNomeSeguroUsuarioComunidade } from "./community-safe-user-name";
import { formatarErroSupabase } from "./community-supabase-error-formatter";
import { obterUsuarioAutenticadoComunidadeAtual } from "./community-supabase-current-user-loader";
import type { SupabasePostRow } from "./community-supabase-post-row";
import type { UsuarioComunidade } from "./community-user";

type SetState<T> = Dispatch<SetStateAction<T>>;

type PublicarPostComunidadeParams = {
  event: FormEvent<HTMLFormElement>;
  acoesComunidadeRef: { current: Set<string> };
  setPublicandoPost: SetState<boolean>;
  setErro: SetState<string>;
  exigirLogin: () => boolean;
  usuario: UsuarioComunidade | null;
  garantirAceiteAntesDePublicarComunidade: () => Promise<boolean>;
  setUsuario: SetState<UsuarioComunidade | null>;
  setUsuarioEhAdmin: SetState<boolean>;
  visibilidadePost: VisibilidadePostComunidade;
  textoPostRef: RefObject<HTMLTextAreaElement | null>;
  obraRelacionadaRef: RefObject<HTMLInputElement | null>;
  capituloRelacionadoPost: string;
  obrasRelacionadasSugestoes: ObraRelacionadaSugestao[];
  setObrasRelacionadasSugestoes: SetState<ObraRelacionadaSugestao[]>;
  tipoPublicacaoPost: TipoPublicacaoComunidade;
  categoriaPost: CategoriaComunidade;
  temSpoilerPost: boolean;
  setPosts: SetState<PostComunidade[]>;
  carregarPostsComunidadeDaPagina: (
    mostrarCarregamento?: boolean,
    pagina?: number,
    obraFiltro?: string,
  ) => Promise<void>;
  obraRelacionadaFiltro: string;
  reviewsDiarioSincronizadasRef: RefObject<Set<string>>;
  setObraRelacionadaBusca: SetState<string>;
  setCapituloRelacionadoPost: SetState<string>;
  setSugestoesObrasAbertas: SetState<boolean>;
  setCategoriaPost: SetState<CategoriaComunidade>;
  setTipoPublicacaoPost: SetState<TipoPublicacaoComunidade>;
  setVisibilidadePost: SetState<VisibilidadePostComunidade>;
  setTemSpoilerPost: SetState<boolean>;
  setComposerAberto: SetState<boolean>;
  setFeedbackAcao: SetState<string>;
  feedbackTimerRef: { current: number | null };
};

export async function publicarPostComunidade({
  event,
  acoesComunidadeRef,
  setPublicandoPost,
  setErro,
  exigirLogin,
  usuario,
  garantirAceiteAntesDePublicarComunidade,
  setUsuario,
  setUsuarioEhAdmin,
  visibilidadePost,
  textoPostRef,
  obraRelacionadaRef,
  capituloRelacionadoPost,
  obrasRelacionadasSugestoes,
  setObrasRelacionadasSugestoes,
  tipoPublicacaoPost,
  categoriaPost,
  temSpoilerPost,
  setPosts,
  carregarPostsComunidadeDaPagina,
  obraRelacionadaFiltro,
  reviewsDiarioSincronizadasRef,
  setObraRelacionadaBusca,
  setCapituloRelacionadoPost,
  setSugestoesObrasAbertas,
  setCategoriaPost,
  setTipoPublicacaoPost,
  setVisibilidadePost,
  setTemSpoilerPost,
  setComposerAberto,
  setFeedbackAcao,
  feedbackTimerRef,
}: PublicarPostComunidadeParams) {
  event.preventDefault();

  const chaveAcao = "publicar-post";

  if (!iniciarAcaoComunidade(acoesComunidadeRef, chaveAcao)) {
    return;
  }

  setPublicandoPost(true);
  setErro("");

  try {
    if (!exigirLogin() || !usuario) {
      return;
    }

    if (!(await garantirAceiteAntesDePublicarComunidade())) {
      return;
    }

    const usuarioAutenticado = await obterUsuarioAutenticadoComunidadeAtual();
    const usuarioAutenticadoId = usuarioAutenticado?.id?.trim() || "";
    const usuarioEstadoId = usuario.id.trim();

    if (
      !usuarioAutenticadoId ||
      usuarioAutenticadoId !== usuarioEstadoId
    ) {
      setUsuario(null);
      setUsuarioEhAdmin(false);
      setErro(
        "Sua sessão expirou ou a conta mudou. Entre novamente antes de publicar."
      );
      return;
    }

    const visibilidadeSegura =
      normalizarVisibilidadePostComunidade(visibilidadePost);
    const textoLimpo = textoPostRef.current?.value.trim() || "";
    const obraLimpa = obraRelacionadaRef.current?.value.trim() || "";
    const capituloLimpo = capituloRelacionadoPost.trim();
    let obraRelacionadaPermitida = obraLimpa
      ? obterObraRelacionadaPermitida(
          obraLimpa,
          obrasRelacionadasSugestoes
        )
      : null;

    if (capituloLimpo && !obraLimpa) {
      setErro("Selecione uma obra antes de informar o capítulo.");
      return;
    }

    if (obraLimpa && !obraRelacionadaPermitida) {
      const resultadoConsultaObras =
        await consultarObrasPorTituloComunidade(obraLimpa);

      if (resultadoConsultaObras.sucesso) {
        obraRelacionadaPermitida =
          obterPrimeiraSugestaoObraSupabaseComunidade(
            resultadoConsultaObras.obrasEncontradas
          );

        if (obraRelacionadaPermitida) {
          setObrasRelacionadasSugestoes((obrasAtuais) =>
            removerSugestoesObrasDuplicadas([
              obraRelacionadaPermitida as ObraRelacionadaSugestao,
              ...obrasAtuais,
            ])
          );
        }
      }
    }

    if (obraLimpa && !obraRelacionadaPermitida) {
      setErro("Selecione uma obra publicada disponível nas sugestões.");
      return;
    }

    const resultadoValidacaoConteudo = validarConteudoPublicacaoComunidade(
      textoLimpo,
      tipoPublicacaoPost
    );

    if (!resultadoValidacaoConteudo.valido) {
      setErro(resultadoValidacaoConteudo.erro);
      return;
    }

    const { publicacaoEhEnquete } = resultadoValidacaoConteudo;

    const autorNomeSeguro = await obterNomeSeguroUsuarioComunidade(usuario);

    const { textoPostBanco, dadosPostBanco } =
      prepararDadosInsercaoPostComunidade({
        usuarioAutenticadoId,
        autorNomeSeguro,
        categoriaPost,
        tipoPublicacaoPost,
        publicacaoEhEnquete,
        temSpoilerPost,
        textoLimpo,
        obraRelacionadaTitulo: obraRelacionadaPermitida?.titulo || "",
        capituloLimpo,
        visibilidadeSegura,
      });

    // Não use INSERT ... RETURNING aqui. O RETURNING também passa pela
    // política SELECT da tabela e pode fazer um INSERT válido ser rejeitado.
    const resultadoInsercaoPost =
      await inserirPostSupabaseComunidade(dadosPostBanco);

    if (!resultadoInsercaoPost.sucesso) {
      setErro(
        formatarErroSupabase("Erro ao publicar", resultadoInsercaoPost.erro)
      );
      return;
    }

    // A leitura é feita em uma consulta separada, depois que o INSERT termina.
    const postCriado = await consultarPostCriadoComunidade(
      usuarioAutenticadoId,
      textoPostBanco
    );

    let novoPost: PostComunidade | null = null;

    if (postCriado) {
      novoPost = mapearPostCriadoComunidade({
        postCriado: postCriado as SupabasePostRow,
        usuarioAutenticadoId,
        autorNomeSeguro,
        usuarioAvatar: usuario.avatar,
      });

      setPosts((postsAtuais) => [novoPost as PostComunidade, ...postsAtuais]);
    } else {
      await carregarPostsComunidadeDaPagina(false, 0, obraRelacionadaFiltro);
    }

    if (
      novoPost &&
      !publicacaoEhEnquete &&
      tipoPublicacaoPost === "Review"
    ) {
      reviewsDiarioSincronizadasRef.current.add(novoPost.id);

      const reviewSincronizada = await registrarReviewComunidadeNoDiario({
        userId: usuarioAutenticadoId,
        texto: textoLimpo,
        obraRelacionada: obraLimpa,
        postId: novoPost.id,
        criadaEm: novoPost.criadoEm,
        sugestoesObras: obrasRelacionadasSugestoes,
        visibilidade: novoPost.visibilidade,
      });

      if (!reviewSincronizada) {
        reviewsDiarioSincronizadasRef.current.delete(novoPost.id);
      }
    }

    if (textoPostRef.current) {
      textoPostRef.current.value = "";
    }

    if (obraRelacionadaRef.current) {
      obraRelacionadaRef.current.value = "";
    }

    setObraRelacionadaBusca("");
    setCapituloRelacionadoPost("");
    setSugestoesObrasAbertas(false);
    setCategoriaPost("Geral");
    setTipoPublicacaoPost("Discussão");
    setVisibilidadePost("publico");
    setTemSpoilerPost(false);
    setComposerAberto(false);
    emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef, "Publicação enviada para a Comunidade.");
  } finally {
    finalizarAcaoComunidade(acoesComunidadeRef, chaveAcao);
    setPublicandoPost(false);
  }
}
