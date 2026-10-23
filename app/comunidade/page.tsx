"use client";

import { useRouter } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FormEvent } from "react";
import { useHistorietasTheme } from "../../lib/historietasTheme";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { useComunidadeDesktopMode } from "./hooks/use-comunidade-desktop-mode";
import { useComunidadeOverlayBodyLock } from "./hooks/use-comunidade-overlay-body-lock";
import { useComunidadeUserSearchSync } from "./hooks/use-comunidade-user-search-sync";
import { useComunidadeInitialUrlNavigation } from "./hooks/use-comunidade-initial-url-navigation";
import {
  useComunidadePollVotesSync,
  useComunidadeSavedPostsSync,
} from "./hooks/use-comunidade-personal-data-sync";
import { useComunidadeRelatedWorkDiarySync } from "./hooks/use-comunidade-related-work-diary-sync";
import { useComunidadeAuthAccountLifecycle } from "./hooks/use-comunidade-auth-account-lifecycle";
import { useComunidadeFeedLifecycle } from "./hooks/use-comunidade-feed-lifecycle";
import { useComunidadeComposerState } from "./hooks/use-comunidade-composer-state";
import { publicarPostComunidade } from "./components/community-composer-publication-action";
import { comentarPostComunidade } from "./components/community-comment-publication-action";
import { alternarCurtidaComentarioComunidade } from "./components/community-comment-like-action";
import { removerComentarioComunidade } from "./components/community-comment-removal-action";
import { alternarSeguirUsuarioBuscaComunidade } from "./components/community-search-follow-action";
import { atualizarVisibilidadePostComunidade } from "./components/community-post-visibility-action";
import { alternarFixadoPostComunidade } from "./components/community-post-pinning-action";
import { denunciarConteudoComunidade } from "./components/community-report-preparation-action";
import { useComunidadePostEngagementActions } from "./components/community-post-engagement-actions";
import DenunciaModal from "../../components/DenunciaModal";
import type { CategoriaComunidade } from "./components/community-category";
import type { VisibilidadePostComunidade } from "./components/community-post-visibility";
import { normalizarVisibilidadePostComunidade } from "./components/community-post-visibility-normalizer";
import type { TipoPublicacaoFiltro } from "./components/community-publication-filter";
import type { OrdenacaoComunidade } from "./components/community-sort-order";
import { temFiltrosAtivosComunidade } from "./components/community-active-filters-check";
import { normalizarTermoBuscaComunidade } from "./components/community-search-term-normalizer";
import { obterEstadoApresentacaoPostComunidade } from "./components/community-post-presentation-state";
import { criarAcoesPostComunidade } from "./components/community-post-action-factory";
import {
  removerPostDoEstadoComunidade,
  removerPostSalvoDoEstadoComunidade,
} from "./components/community-post-removal-state-updaters";
import { consultarPostParaRemocaoComunidade } from "./components/community-post-removal-query";
import { removerPostSupabaseComunidade } from "./components/community-post-removal-delete";
import { consultarUsuarioEhAdminComunidade } from "./components/community-admin-status-query";
import type { AbaFeedComunidade } from "./components/community-feed-tab";
import { limparFiltrosComunidade, selecionarAbaFeedComunidade } from "./components/community-feed-tabs";
import {
  selecionarOrdenacaoEmAltaComunidade,
  selecionarOrdenacaoMaisComentadasComunidade,
  selecionarOrdenacaoRecentesComunidade,
} from "./components/community-feed-order-actions";
import type {
  AlvoDenunciaComunidade,
  DenunciaAlvoComunidade,
} from "./components/community-report-target";
import type {
  UsuarioBuscaComunidade,
  UsuarioComunidade,
} from "./components/community-user";
import type { ObraRelacionadaSugestao } from "./components/community-related-work-suggestion";
import { obterSugestoesObrasRelacionadasVisiveisComunidade } from "./components/community-visible-related-work-suggestions";
import { aplicarSugestaoPublicacaoComunidade } from "./components/community-publication-suggestions";
import type { PostComunidade } from "./components/community-post-model";
import { obterPostComentariosAbertoComunidade } from "./components/community-open-comments-post";
import { CommunityFeedLoadingState } from "./components/community-feed-loading-state";
import { communityPageStyle } from "./components/community-page-style";
import { selecionarObraRelacionada } from "./components/community-related-work-selector";
import type { GrupoPublicacaoObra } from "./components/community-publication-group";
import { exigirLogin as exigirLoginComunidade } from "./components/community-login-requirement";
import { garantirAceiteAntesDePublicarComunidade as garantirAceiteAntesDePublicarComunidadeExtraido } from "./components/community-publication-terms-requirement";
import { formatarErroSupabase } from "./components/community-supabase-error-formatter";
import { obterUsuarioAutenticadoComunidadeAtual } from "./components/community-supabase-current-user-loader";
import { removerReviewComunidadeDoDiario } from "./components/community-diary-review-remover";
import type { ResultadoVotosEnquete } from "./components/community-poll-votes-result";
import { obterPostsVisiveisComunidade } from "./components/community-visible-posts";
import { ComentariosSheet } from "./components/community-comments-sheet";
import { fecharComentarios } from "./components/community-comments-closer";
import { abrirComentarios } from "./components/community-comments-opener";
import {
  prepararEnqueteComunidade,
  selecionarTipoPublicacaoPost,
} from "./components/community-poll-preparer";
import { abrirPublicacaoRapidaComunidade } from "./components/community-quick-publication-opener";
import {
  CHAVE_POSTS_SALVOS_COMUNIDADE,
} from "./components/community-storage-keys";
import { CommunityThemeStyles } from "./components/community-theme-styles";
import { CommunityPageContainer } from "./components/community-page-container";
import { CommunityContentContainer } from "./components/community-content-container";
import { CommunityTopWaterFade } from "./components/community-top-water-fade";
import { CommunityFeedTopComposition } from "./components/community-feed-top-composition";
import { CommunityFeedCenterComposition } from "./components/community-feed-center-composition";
import { CommunityMainLayout } from "./components/community-main-layout";
import { CommunityFeedColumn } from "./components/community-feed-column";
import { CommunityFeedErrorNotice } from "./components/community-feed-error-notice";
import {
  abrirBuscaComunidade,
  fecharBuscaComunidade,
} from "./components/community-search-controls-actions";
import {
  deveExibirResultadosBuscaComunidade,
} from "./components/community-search-controls-visibility";
import { CommunityPostComposerPortal } from "./components/community-post-composer-portal";
import { CommunityActionFeedbackToast, emitirFeedbackAcao } from "./components/community-action-feedback-toast";
import {
  finalizarAcaoComunidade,
  iniciarAcaoComunidade,
} from "./components/community-action-lock";
import { CommunityPostItem } from "./components/community-post-item";
import { traduzirTextoComunidade } from "./components/community-text-translator";
import { CommunityLanguageBridge } from "./components/community-language-bridge";
import {
  traduzirContagemResultadosComunidade,
} from "./components/community-results-count-translator";
import { salvarJsonUsuarioComunidade } from "./components/community-user-json-saver";

export default function ComunidadePage() {
  const router = useRouter();
  const { language } = useHistorietasLanguage();
  const [usuario, setUsuario] = useState<UsuarioComunidade | null>(null);
  const [usuarioEhAdmin, setUsuarioEhAdmin] = useState(false);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);
  const [posts, setPosts] = useState<PostComunidade[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaComunidade | "Todos">(
    "Todos"
  );
  const [tipoPublicacaoAtiva, setTipoPublicacaoAtiva] =
    useState<TipoPublicacaoFiltro>("Todos");
  const [obraRelacionadaFiltro, setObraRelacionadaFiltro] = useState("");
  const [grupoPublicacaoObra, setGrupoPublicacaoObra] =
    useState<GrupoPublicacaoObra>("");
  const [spoilersReveladosIds, setSpoilersReveladosIds] = useState<string[]>([]);
  const [termoBusca, setTermoBusca] = useState("");
  const termoBuscaAdiado = useDeferredValue(termoBusca);
  const [ordenacaoAtiva, setOrdenacaoAtiva] =
    useState<OrdenacaoComunidade>("Recentes");
  const [abaFeedAtiva, setAbaFeedAtiva] =
    useState<AbaFeedComunidade>("Para você");
  const [mostrarApenasSalvos, setMostrarApenasSalvos] = useState(false);
  const [postsSalvosIds, setPostsSalvosIds] = useState<string[]>([]);
  const [votosEnquetes, setVotosEnquetes] = useState<Record<string, string>>({});
  const [resultadosEnquetes, setResultadosEnquetes] =
    useState<ResultadoVotosEnquete>({});
  const [votandoEnqueteId, setVotandoEnqueteId] = useState<string | null>(null);
  const [feedbackAcao, setFeedbackAcao] = useState("");
  const [publicandoPost, setPublicandoPost] = useState(false);
  const [postCurtindoId, setPostCurtindoId] = useState<string | null>(null);
  const [postSalvandoId, setPostSalvandoId] = useState<string | null>(null);
  const [postCompartilhandoId, setPostCompartilhandoId] = useState<
    string | null
  >(null);
  const [postRemovendoId, setPostRemovendoId] = useState<string | null>(null);
  const [postFixandoId, setPostFixandoId] = useState<string | null>(null);
  const [postVisibilidadeAtualizandoId, setPostVisibilidadeAtualizandoId] =
    useState<string | null>(null);
  const [postMenuAbertoId, setPostMenuAbertoId] = useState<string | null>(null);
  const [denunciaAlvo, setDenunciaAlvo] =
    useState<DenunciaAlvoComunidade | null>(null);
  const [carregandoFeed, setCarregandoFeed] = useState(true);
  const [paginaFeedComunidade, setPaginaFeedComunidade] = useState(0);
  const [temMaisPostsComunidade, setTemMaisPostsComunidade] = useState(false);
  const [carregandoMaisPostsComunidade, setCarregandoMaisPostsComunidade] = useState(false);
  const [erro, setErro] = useState("");
  const [comentariosPostId, setComentariosPostId] = useState<string | null>(null);
  const [obrasRelacionadasSugestoes, setObrasRelacionadasSugestoes] = useState<
    ObraRelacionadaSugestao[]
  >([]);
  const feedbackTimerRef = useRef<number | null>(null);
  const autenticacaoComunidadeVersaoRef = useRef(0);
  const reviewsDiarioSincronizadasRef = useRef<Set<string>>(new Set<string>());
  const usuarioReviewsDiarioRef = useRef("");
  const acoesComunidadeRef = useRef<Set<string>>(new Set<string>());
  const carregarPostsComunidadeRef = useRef<
    (
      mostrarCarregamento?: boolean,
      pagina?: number,
      obraFiltro?: string,
    ) => Promise<void>
  >(null);
  const comentarioUrlAplicadoRef = useRef(false);
  const {
    categoriaPost,
    setCategoriaPost,
    tipoPublicacaoPost,
    setTipoPublicacaoPost,
    visibilidadePost,
    setVisibilidadePost,
    temSpoilerPost,
    setTemSpoilerPost,
    obraRelacionadaBusca,
    setObraRelacionadaBusca,
    capituloRelacionadoPost,
    setCapituloRelacionadoPost,
    sugestoesObrasAbertas,
    setSugestoesObrasAbertas,
    textoPostRef,
    obraRelacionadaRef,
    composerAberto,
    setComposerAberto,
  } = useComunidadeComposerState();
  const [menuAcoesRapidasComunidadeAberto, setMenuAcoesRapidasComunidadeAberto] =
    useState(false);
  const [buscaComunidadeAberta, setBuscaComunidadeAberta] = useState(false);
  const [usuariosBuscaComunidade, setUsuariosBuscaComunidade] = useState<
    UsuarioBuscaComunidade[]
  >([]);
  const [carregandoUsuariosBuscaComunidade, setCarregandoUsuariosBuscaComunidade] =
    useState(false);
  const [usuariosSeguidosIds, setUsuariosSeguidosIds] = useState<string[]>([]);
  const [usuarioSeguindoId, setUsuarioSeguindoId] = useState<string | null>(null);
  const isDesktop = useComunidadeDesktopMode();
  const { pageThemeStyle } = useHistorietasTheme(communityPageStyle);

  useComunidadeSavedPostsSync({
    usuarioId: usuario?.id,
    setPostsSalvosIds,
    setVotosEnquetes,
  });

  useEffect(() => {
    const feedbackTimer = feedbackTimerRef;

    return () => {
      if (feedbackTimer.current) {
        window.clearTimeout(feedbackTimer.current);
      }
    };
  }, []);

  useComunidadePollVotesSync({
    posts,
    usuarioId: usuario?.id,
    setVotosEnquetes,
    setResultadosEnquetes,
  });

  useComunidadeAuthAccountLifecycle({
    autenticacaoComunidadeVersaoRef,
    reviewsDiarioSincronizadasRef,
    usuarioReviewsDiarioRef,
    acoesComunidadeRef,
    textoPostRef,
    obraRelacionadaRef,
    setUsuario,
    setUsuarioEhAdmin,
    setCarregandoUsuario,
    setPostMenuAbertoId,
    setMenuAcoesRapidasComunidadeAberto,
    setComposerAberto,
    setComentariosPostId,
    setPostsSalvosIds,
    setVotosEnquetes,
    setResultadosEnquetes,
    setUsuariosSeguidosIds,
    setUsuarioSeguindoId,
    setPostCurtindoId,
    setPostSalvandoId,
    setPostCompartilhandoId,
    setPostRemovendoId,
    setPostFixandoId,
    setDenunciaAlvo,
    setFeedbackAcao,
    setObraRelacionadaBusca,
    setCapituloRelacionadoPost,
    setSugestoesObrasAbertas,
    setPosts,
    setCarregandoFeed,
    carregarPostsComunidade: (mostrarCarregamento, pagina, obraFiltro) =>
      carregarPostsComunidadeRef.current?.(
        mostrarCarregamento,
        pagina,
        obraFiltro,
      ),
  });

  useComunidadeRelatedWorkDiarySync({
    usuarioId: usuario?.id,
    posts,
    obrasRelacionadasSugestoes,
    setObrasRelacionadasSugestoes,
    reviewsDiarioSincronizadasRef,
    usuarioReviewsDiarioRef,
  });

  useComunidadeOverlayBodyLock({
    bloqueioPrimario: menuAcoesRapidasComunidadeAberto,
    bloqueioSecundario: postMenuAbertoId,
  });

  const {
    carregarPostsComunidadeDaPagina,
    carregarMaisPostsComunidadeDaPagina,
  } = useComunidadeFeedLifecycle({
    obraRelacionadaFiltro,
    carregandoFeed,
    carregandoMaisPostsComunidade,
    temMaisPostsComunidade,
    paginaFeedComunidade,
    setCarregandoFeed,
    setCarregandoMaisPostsComunidade,
    setPosts,
    setTemMaisPostsComunidade,
    setPaginaFeedComunidade,
    setObrasRelacionadasSugestoes,
    setErro,
  });

  useLayoutEffect(() => {
    carregarPostsComunidadeRef.current = carregarPostsComunidadeDaPagina;
  }, [carregarPostsComunidadeDaPagina]);

  useComunidadeInitialUrlNavigation({
    comentarioUrlAplicadoRef,
    comentariosPostId,
    posts,
    setTermoBusca,
    setObraRelacionadaFiltro,
    setGrupoPublicacaoObra,
    setTipoPublicacaoAtiva,
    setAbaFeedAtiva,
    setMenuAcoesRapidasComunidadeAberto,
    setMostrarApenasSalvos,
    setOrdenacaoAtiva,
    setComentariosPostId,
  });

  const termoBuscaNormalizado = useMemo(
    () => normalizarTermoBuscaComunidade(termoBuscaAdiado),
    [termoBuscaAdiado]
  );

  useComunidadeUserSearchSync({
    buscaComunidadeAberta,
    posts,
    termoBuscaAdiado,
    usuarioId: usuario?.id,
    setUsuariosBuscaComunidade,
    setCarregandoUsuariosBuscaComunidade,
    setUsuariosSeguidosIds,
  });

  const postsVisiveis = useMemo(() => {
    return obterPostsVisiveisComunidade({
      posts,
      categoriaAtiva,
      tipoPublicacaoAtiva,
      obraRelacionadaFiltro,
      grupoPublicacaoObra,
      abaFeedAtiva,
      usuariosSeguidosIds,
      mostrarApenasSalvos,
      postsSalvosIds,
      termoBuscaNormalizado,
      ordenacaoAtiva,
    });
  }, [
    abaFeedAtiva,
    categoriaAtiva,
    tipoPublicacaoAtiva,
    obraRelacionadaFiltro,
    grupoPublicacaoObra,
    mostrarApenasSalvos,
    ordenacaoAtiva,
    posts,
    postsSalvosIds,
    termoBuscaNormalizado,
    usuariosSeguidosIds,
  ]);

  const postComentariosAberto = useMemo(() => {
    return obterPostComentariosAbertoComunidade(posts, comentariosPostId);
  }, [comentariosPostId, posts]);

  const sugestoesObrasRelacionadasVisiveis = useMemo(() => {
    return obterSugestoesObrasRelacionadasVisiveisComunidade(
      obraRelacionadaBusca,
      obrasRelacionadasSugestoes
    );
  }, [obraRelacionadaBusca, obrasRelacionadasSugestoes]);

  useComunidadeOverlayBodyLock({ bloqueioPrimario: comentariosPostId });

  useComunidadeOverlayBodyLock({
    bloqueioPrimario: composerAberto,
    focoComposerRef: textoPostRef,
  });

  const filtrosAtivos = temFiltrosAtivosComunidade({
    categoriaAtiva,
    tipoPublicacaoAtiva,
    obraRelacionadaFiltro,
    grupoPublicacaoObra,
    termoBuscaNormalizado,
    mostrarApenasSalvos,
    ordenacaoAtiva,
  });
  function exigirLogin() {
    return exigirLoginComunidade({ usuario, setErro, router });
  }

  async function garantirAceiteAntesDePublicarComunidade() {
    return garantirAceiteAntesDePublicarComunidadeExtraido({
      exigirLogin,
      usuario,
      router,
    });
  }

  const alternarSeguirUsuarioBusca = (usuarioAlvo: UsuarioBuscaComunidade) =>
    alternarSeguirUsuarioBuscaComunidade({
      usuarioAlvo,
      exigirLogin,
      usuario,
      acoesComunidadeRef,
      usuariosSeguidosIds,
      setUsuariosSeguidosIds,
      setUsuarioSeguindoId,
      setErro,
      setFeedbackAcao,
      feedbackTimerRef,
    });

  const publicarPost = (event: FormEvent<HTMLFormElement>) =>
    publicarPostComunidade({
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
    });

  const {
    alternarCurtida,
    salvarPostComunidade,
    compartilharPostComunidade,
    votarEnquetePostComunidade,
    alternarSpoilerPostComunidade,
  } = useComunidadePostEngagementActions({
    acoesComunidadeRef,
    setPostCurtindoId,
    setErro,
    exigirLogin,
    usuario,
    posts,
    setPosts,
    setPostSalvandoId,
    postsSalvosIds,
    setPostsSalvosIds,
    setFeedbackAcao,
    feedbackTimerRef,
    setPostCompartilhandoId,
    votandoEnqueteId,
    votosEnquetes,
    setVotandoEnqueteId,
    setResultadosEnquetes,
    setVotosEnquetes,
    setSpoilersReveladosIds,
  });

  const comentarPost = (
    postId: string,
    textoRecebido: string,
    comentarioPaiId = ""
  ) =>
    comentarPostComunidade({
      postId,
      textoRecebido,
      comentarioPaiId,
      acoesComunidadeRef,
      setErro,
      exigirLogin,
      usuario,
      posts,
      setPosts,
      setFeedbackAcao,
      feedbackTimerRef,
    });

  const denunciarConteudo = (alvoTipo: AlvoDenunciaComunidade, alvoId: string) =>
    denunciarConteudoComunidade({ alvoTipo, alvoId, exigirLogin, usuario, posts, setErro, setPostMenuAbertoId, setDenunciaAlvo });

  const removerComentario = (postId: string, comentarioId: string) =>
    removerComentarioComunidade({
      postId,
      comentarioId,
      acoesComunidadeRef,
      setErro,
      exigirLogin,
      usuario,
      setUsuario,
      setUsuarioEhAdmin,
      setPostMenuAbertoId,
      posts,
      setPosts,
      language,
      setFeedbackAcao,
      feedbackTimerRef,
      carregarPostsComunidadeDaPagina,
      obraRelacionadaFiltro,
    });

  const alternarCurtidaComentario = (postId: string, comentarioId: string) =>
    alternarCurtidaComentarioComunidade({
      postId,
      comentarioId,
      acoesComunidadeRef,
      setErro,
      exigirLogin,
      usuario,
      posts,
      setPosts,
      setFeedbackAcao,
      feedbackTimerRef,
      carregarPostsComunidadeDaPagina,
    });

  const atualizarVisibilidadePost = (
    post: PostComunidade,
    novaVisibilidade: VisibilidadePostComunidade,
  ) =>
    atualizarVisibilidadePostComunidade({
      post,
      novaVisibilidade,
      acoesComunidadeRef,
      setPostVisibilidadeAtualizandoId,
      setErro,
      exigirLogin,
      usuario,
      obrasRelacionadasSugestoes,
      reviewsDiarioSincronizadasRef,
      setPosts,
      setPostMenuAbertoId,
      setFeedbackAcao,
      feedbackTimerRef,
    });

  const alternarFixadoPost = (post: PostComunidade) =>
    alternarFixadoPostComunidade({
      post,
      usuarioEhAdmin,
      postFixandoId,
      setPostFixandoId,
      setErro,
      setPosts,
      setFeedbackAcao,
      feedbackTimerRef,
    });

  async function removerPost(postId: string) {
    const chaveAcao = `remover-post:${postId}`;

    if (!iniciarAcaoComunidade(acoesComunidadeRef, chaveAcao)) {
      return;
    }

    setPostRemovendoId(postId);
    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
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
        setPostMenuAbertoId(null);
        setErro(
          "Sua conta mudou. Aguarde a Comunidade atualizar antes de tentar novamente."
        );
        return;
      }

      const usuarioAtualEhAdmin =
        await consultarUsuarioEhAdminComunidade();

      const resultadoConsultaPost =
        await consultarPostParaRemocaoComunidade(postId);

      if (!resultadoConsultaPost.sucesso) {
        setErro(
          formatarErroSupabase(
            "Erro ao conferir publicação",
            resultadoConsultaPost.erro
          )
        );
        return;
      }

      const postBanco = resultadoConsultaPost.postBanco;

      if (!postBanco) {
        setPosts((postsAtuais) =>
          removerPostDoEstadoComunidade(postsAtuais, postId)
        );
        setPostMenuAbertoId(null);
        setErro("Esta publicação já não existe.");
        return;
      }

      const autorPostId = postBanco.autor_id?.trim() || "";

      if (
        !usuarioAtualEhAdmin &&
        autorPostId !== usuarioAutenticadoId
      ) {
        setPostMenuAbertoId(null);
        setErro("Você só pode remover suas próprias publicações.");
        return;
      }

      if (
        !window.confirm(
          traduzirTextoComunidade("Remover esta publicação?", language)
        )
      ) {
        return;
      }

      const resultadoRemocaoPost = await removerPostSupabaseComunidade(
        postId,
        usuarioAutenticadoId,
        usuarioAtualEhAdmin
      );

      if (!resultadoRemocaoPost.sucesso) {
        setErro(
          formatarErroSupabase(
            "Erro ao remover publicação",
            resultadoRemocaoPost.erro
          )
        );
        return;
      }

      const postsRemovidos = resultadoRemocaoPost.postsRemovidos;

      if (!Array.isArray(postsRemovidos) || postsRemovidos.length === 0) {
        setErro(
          "A publicação não foi removida. A conta atual não possui permissão para essa ação."
        );
        await carregarPostsComunidadeDaPagina(false, 0, obraRelacionadaFiltro);
        return;
      }

      const postRemovido = postsRemovidos[0];

      if (postRemovido.tipo_publicacao === "Review") {
        await removerReviewComunidadeDoDiario({
          userId: postRemovido.autor_id || autorPostId,
          postId,
        });
        reviewsDiarioSincronizadasRef.current.delete(postId);
      }

      setUsuarioEhAdmin(usuarioAtualEhAdmin);
      setPosts((postsAtuais) =>
        removerPostDoEstadoComunidade(postsAtuais, postId)
      );

      const postsSalvosAtualizados = removerPostSalvoDoEstadoComunidade(
        postsSalvosIds,
        postId
      );

      setPostsSalvosIds(postsSalvosAtualizados);

      salvarJsonUsuarioComunidade(
        CHAVE_POSTS_SALVOS_COMUNIDADE,
        usuarioAutenticadoId,
        postsSalvosAtualizados
      );

      emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef, "Publicação removida.");
      await carregarPostsComunidadeDaPagina(false, 0, obraRelacionadaFiltro);
    } finally {
      finalizarAcaoComunidade(acoesComunidadeRef, chaveAcao);
      setPostRemovendoId((postAtualId) =>
        postAtualId === postId ? null : postAtualId
      );
    }
  }

  function alternarMenuOpcoesPostComunidade(postId: string) {
    setPostMenuAbertoId((postIdAtual) =>
      postIdAtual === postId ? null : postId
    );
  }

  function fecharMenuOpcoesPostComunidade() {
    setPostMenuAbertoId(null);
  }

  function denunciarPostComunidade(postId: string) {
    denunciarConteudo("post", postId);
  }

  function abrirComentariosPostComunidade(postId: string) {
    abrirComentarios({
      postId,
      setErro,
      comentarioUrlAplicadoRef,
      setComentariosPostId,
    });
  }

  const renderizarPostComunidade = (post: PostComunidade) => {
    const estadoPost = obterEstadoApresentacaoPostComunidade({
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
    });
    const acoesPost = criarAcoesPostComunidade({
      post,
      onAlternarMenu: alternarMenuOpcoesPostComunidade,
      onFecharMenu: fecharMenuOpcoesPostComunidade,
      onSalvar: salvarPostComunidade,
      onCompartilhar: compartilharPostComunidade,
      onAtualizarVisibilidade: atualizarVisibilidadePost,
      onAlternarFixado: alternarFixadoPost,
      onRemover: removerPost,
      onDenunciar: denunciarPostComunidade,
      onVotar: votarEnquetePostComunidade,
      onAlternarCurtida: alternarCurtida,
      onAbrirComentarios: abrirComentariosPostComunidade,
      onAlternarSpoiler: alternarSpoilerPostComunidade,
    });

    return (
      <CommunityPostItem
        key={post.id}
        post={post}
        desktop={isDesktop}
        estadoPost={estadoPost}
        acoesPost={acoesPost}
        postMenuAbertoId={postMenuAbertoId}
        usuarioEhAdmin={usuarioEhAdmin}
        obrasRelacionadasSugestoes={obrasRelacionadasSugestoes}
        votosEnquetes={votosEnquetes}
        resultadosEnquetes={resultadosEnquetes}
        votandoEnqueteId={votandoEnqueteId}
      />
    );
  };

  if (carregandoFeed) {
    return (
      <CommunityFeedLoadingState style={pageThemeStyle}>
        <CommunityLanguageBridge />
      </CommunityFeedLoadingState>
    );
  }

  return (
    <CommunityPageContainer style={pageThemeStyle}>
      <CommunityLanguageBridge />
      <CommunityThemeStyles />

      <CommunityTopWaterFade isDesktop={isDesktop} />

      <CommunityContentContainer isDesktop={isDesktop}>
        {isDesktop ? (
          <CommunityFeedTopComposition
            area="desktop-header"
            termoBusca={termoBusca}
            menuAcoesRapidasComunidadeAberto={menuAcoesRapidasComunidadeAberto}
            onAlterarTermoBusca={(event) => setTermoBusca(event.target.value)}
            onAlternarMenuAcoes={() =>
              setMenuAcoesRapidasComunidadeAberto((aberto) => !aberto)
            }
          />
        ) : null}

        <CommunityMainLayout isDesktop={isDesktop}>
          <CommunityFeedColumn isDesktop={isDesktop}>
            {usuario && erro && !composerAberto && (
              <CommunityFeedErrorNotice>{erro}</CommunityFeedErrorNotice>
            )}

            <CommunityFeedTopComposition
              area="feed-controls"
              desktop={isDesktop}
              termoBusca={termoBusca}
              buscaComunidadeAberta={buscaComunidadeAberta}
              menuAcoesRapidasComunidadeAberto={
                menuAcoesRapidasComunidadeAberto
              }
              abaFeedAtiva={abaFeedAtiva}
              onAlterarTermoBusca={(termoBuscaAtualizado) =>
                setTermoBusca(termoBuscaAtualizado)
              }
              onAlternarMenuAcoes={() =>
                setMenuAcoesRapidasComunidadeAberto((aberto) => !aberto)
              }
              onAbrirBusca={() =>
                abrirBuscaComunidade({ setBuscaComunidadeAberta })
              }
              onFecharBusca={() =>
                fecharBuscaComunidade({
                  setTermoBusca,
                  setBuscaComunidadeAberta,
                })
              }
              onSelecionarAba={(aba) =>
                selecionarAbaFeedComunidade({
                  aba,
                  setAbaFeedAtiva,
                  setCategoriaAtiva,
                  setTipoPublicacaoAtiva,
                  setObraRelacionadaFiltro,
                  setGrupoPublicacaoObra,
                  setMostrarApenasSalvos,
                  setOrdenacaoAtiva,
                  setMenuAcoesRapidasComunidadeAberto,
                })
              }
              filtrosAtivos={filtrosAtivos}
              mostrarApenasSalvos={mostrarApenasSalvos}
              ordenacaoAtiva={ordenacaoAtiva}
              onFecharAcoes={() => setMenuAcoesRapidasComunidadeAberto(false)}
              onPublicar={() =>
                abrirPublicacaoRapidaComunidade({
                  carregandoUsuario,
                  garantirAceiteAntesDePublicarComunidade,
                  setMenuAcoesRapidasComunidadeAberto,
                  setErro,
                  setComposerAberto,
                })
              }
              onMostrarTodas={() => {
                limparFiltrosComunidade({
                  setAbaFeedAtiva,
                  setCategoriaAtiva,
                  setTipoPublicacaoAtiva,
                  setObraRelacionadaFiltro,
                  setGrupoPublicacaoObra,
                  setTermoBusca,
                  setOrdenacaoAtiva,
                  setMostrarApenasSalvos,
                  carregarPostsComunidade: carregarPostsComunidadeDaPagina,
                });
                setMenuAcoesRapidasComunidadeAberto(false);
              }}
              onMostrarSalvos={() => {
                setMostrarApenasSalvos(true);
                setMenuAcoesRapidasComunidadeAberto(false);
              }}
              onSelecionarRecentes={() =>
                selecionarOrdenacaoRecentesComunidade({
                  setOrdenacaoAtiva,
                  setMostrarApenasSalvos,
                  setMenuAcoesRapidasComunidadeAberto,
                })
              }
              onSelecionarEmAlta={() =>
                selecionarOrdenacaoEmAltaComunidade({
                  setOrdenacaoAtiva,
                  setMostrarApenasSalvos,
                  setMenuAcoesRapidasComunidadeAberto,
                })
              }
              onSelecionarMaisComentadas={() =>
                selecionarOrdenacaoMaisComentadasComunidade({
                  setOrdenacaoAtiva,
                  setMostrarApenasSalvos,
                  setMenuAcoesRapidasComunidadeAberto,
                })
              }
            />

            <CommunityFeedCenterComposition
              exibirResultadosBusca={deveExibirResultadosBuscaComunidade(
                termoBuscaNormalizado,
              )}
              contagemPublicacoes={traduzirContagemResultadosComunidade(
                postsVisiveis.length,
                "publicacoes",
                language,
              )}
              userSearchProps={{
                termoBusca,
                carregandoUsuariosBuscaComunidade,
                usuariosBuscaComunidade,
                idioma: language,
                usuarioAtualId: usuario?.id,
                usuariosSeguidosIds,
                usuarioSeguindoId,
                onAlternarSeguir: alternarSeguirUsuarioBusca,
              }}
              feedProps={{
                desktop: isDesktop,
                carregandoFeed,
                postsVisiveis,
                abaFeedAtiva,
                usuario,
                mostrarApenasSalvos,
                filtrosAtivos,
                temMaisPostsComunidade,
                carregandoMaisPostsComunidade,
                renderizarPost: renderizarPostComunidade,
                onCarregarMais: carregarMaisPostsComunidadeDaPagina,
              }}
            />

          </CommunityFeedColumn>

        </CommunityMainLayout>
      </CommunityContentContainer>

      <CommunityPostComposerPortal
        composerAberto={composerAberto}
        usuario={usuario}
        composerProps={{
          desktop: isDesktop,
          publicandoPost,
          erro,
          temSpoilerPost,
          classificacao: {
            categoriaPost,
            tipoPublicacaoPost,
            visibilidadePost,
            onAlterarCategoria: (categoria) => setCategoriaPost(categoria),
            onAlterarTipoPublicacao: (tipo) =>
              selecionarTipoPublicacaoPost({
                tipo,
                setTipoPublicacaoPost,
                textoPostRef,
              }),
            onAlterarVisibilidade: (visibilidade) =>
              setVisibilidadePost(
                normalizarVisibilidadePostComunidade(visibilidade),
              ),
          },
          camposRelacionados: {
            obraRelacionadaBusca,
            capituloRelacionadoPost,
            sugestoesObrasAbertas,
            sugestoesObrasRelacionadasVisiveis,
            obraRelacionadaRef,
            onAlterarObraRelacionada: (valorDigitado) => {
              setObraRelacionadaBusca(valorDigitado);

              if (!valorDigitado.trim()) {
                setCapituloRelacionadoPost("");
              }

              setSugestoesObrasAbertas(Boolean(valorDigitado.trim()));
            },
            onFocarObraRelacionada: () => {
              setSugestoesObrasAbertas(
                Boolean(obraRelacionadaBusca.trim()),
              );
            },
            onDesfocarObraRelacionada: () => {
              window.setTimeout(() => {
                setSugestoesObrasAbertas(false);
              }, 120);
            },
            onSelecionarObraRelacionada: (obra) => {
              selecionarObraRelacionada({
                titulo: obra.titulo,
                setObraRelacionadaBusca,
                setSugestoesObrasAbertas,
                obraRelacionadaRef,
              });
            },
            onAlterarCapituloRelacionado: (valor) =>
              setCapituloRelacionadoPost(valor),
          },
          publicacao: {
            textoPostRef,
            onPrepararEnquete: () =>
              prepararEnqueteComunidade({
                garantirAceiteAntesDePublicarComunidade,
                setErro,
                setCategoriaPost,
                setTipoPublicacaoPost,
                setTemSpoilerPost,
                setComposerAberto,
                textoPostRef,
              }),
            onAplicarSugestao: (sugestao) =>
              aplicarSugestaoPublicacaoComunidade({
                sugestao,
                publicandoPost,
                setErro,
                setCategoriaPost,
                setTipoPublicacaoPost,
                textoPostRef,
                language,
              }),
          },
          onFechar: () => {
            if (!publicandoPost) {
              setErro("");
              setComposerAberto(false);
            }
          },
          onSubmit: publicarPost,
          onAlternarSpoiler: () =>
            setTemSpoilerPost((valorAtual) => !valorAtual),
        }}
      />

      <ComentariosSheet
        key={postComentariosAberto?.id || "comentarios-fechados"}
        post={postComentariosAberto}
        podeComentar={Boolean(usuario)}
        usuarioId={usuario?.id || ""}
        usuarioNome={usuario?.nome || "Usuário"}
        usuarioAvatar={usuario?.avatar || ""}
        erroInteracao={erro}
        isDesktop={isDesktop}
        onFechar={() => fecharComentarios({ setComentariosPostId })}
        onEnviar={comentarPost}
        onCurtirComentario={alternarCurtidaComentario}
        onRemoverComentario={removerComentario}
        onDenunciarComentario={(comentarioId) =>
          denunciarConteudo("comentario", comentarioId)
        }
      />

      <DenunciaModal
        aberto={Boolean(denunciaAlvo)}
        alvoTipo={denunciaAlvo?.alvoTipo || "post"}
        alvoId={denunciaAlvo?.alvoId || ""}
        alvoTitulo={denunciaAlvo?.alvoTitulo || ""}
        onFechar={() => setDenunciaAlvo(null)}
        onEnviada={() => {
          setErro("");
          emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef, "Denúncia enviada para análise.");
        }}
      />

      {feedbackAcao && (
        <CommunityActionFeedbackToast>
          {feedbackAcao}
        </CommunityActionFeedbackToast>
      )}
    </CommunityPageContainer>
  );
}
