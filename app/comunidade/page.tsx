"use client";

import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FormEvent } from "react";
import { supabase } from "../../lib/supabase/client";
import { normalizarTexto } from "../../lib/utils";
import { useHistorietasTheme } from "../../lib/historietasTheme";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import DenunciaModal from "../../components/DenunciaModal";
import type { CategoriaComunidade } from "./components/community-category";
import { CATEGORIAS_COMUNIDADE } from "./components/community-categories";
import { normalizarCategoria } from "./components/community-category-normalizer";
import type { VisibilidadePostComunidade } from "./components/community-post-visibility";
import { VISIBILIDADES_POST_COMUNIDADE, obterRotuloVisibilidadePostComunidade } from "./components/community-post-visibility-options";
import { normalizarVisibilidadePostComunidade } from "./components/community-post-visibility-normalizer";
import type { TipoPublicacaoComunidade } from "./components/community-publication-type";
import { TIPOS_PUBLICACAO_COMUNIDADE } from "./components/community-publication-types";
import { normalizarTipoPublicacao } from "./components/community-publication-type-normalizer";
import type { TipoPublicacaoFiltro } from "./components/community-publication-filter";
import type { OrdenacaoComunidade } from "./components/community-sort-order";
import { temFiltrosAtivosComunidade } from "./components/community-active-filters-check";
import { normalizarTermoBuscaComunidade } from "./components/community-search-term-normalizer";
import { postCombinaTermoBuscaComunidade } from "./components/community-post-search-match";
import {
  postCombinaAbaFeedComunidade,
  postCombinaCategoriaComunidade,
  postCombinaGrupoPublicacaoComunidade,
  postCombinaObraRelacionadaComunidade,
  postCombinaTipoPublicacaoComunidade,
} from "./components/community-post-basic-filter-matches";
import { normalizarTermoBuscaUsuariosComunidade } from "./components/community-user-search-term-normalizer";
import type { AbaFeedComunidade } from "./components/community-feed-tab";
import { ABAS_FEED_COMUNIDADE, limparFiltrosComunidade, selecionarAbaFeedComunidade } from "./components/community-feed-tabs";
import type {
  AlvoDenunciaComunidade,
  DenunciaAlvoComunidade,
} from "./components/community-report-target";
import { obterTituloDenunciaComunidade } from "./components/community-report-title";
import type {
  UsuarioBuscaComunidade,
  UsuarioComunidade,
} from "./components/community-user";
import { obterNomeUsuario } from "./components/community-user-name";
import { obterNomeSeguroUsuarioComunidade } from "./components/community-safe-user-name";
import type { ObraRelacionadaSugestao } from "./components/community-related-work-suggestion";
import { obterSugestoesObrasRelacionadasVisiveisComunidade } from "./components/community-visible-related-work-suggestions";
import { aplicarSugestaoPublicacaoComunidade, SUGESTOES_PUBLICACAO_COMUNIDADE } from "./components/community-publication-suggestions";
import type { PostComunidade } from "./components/community-post-model";
import { obterPostComentariosAbertoComunidade } from "./components/community-open-comments-post";
import { CommunityLoadingSpinner } from "./components/community-loading-spinner";
import { CommunityFeedLoadingState } from "./components/community-feed-loading-state";
import { communityPageStyle } from "./components/community-page-style";
import { juntarObraECapituloRelacionados } from "./components/community-related-chapter-utils";
import { criarLinkObraRelacionada } from "./components/community-related-work-link";
import { selecionarObraRelacionada } from "./components/community-related-work-selector";
import { obterTipoPublicacaoPorParametro } from "./components/community-publication-type-parameter";
import type { GrupoPublicacaoObra } from "./components/community-publication-group";
import { obterGrupoPublicacaoObraPorParametro } from "./components/community-publication-group-parameter";
import { carregarSugestoesObrasLocais } from "./components/community-local-related-works-loader";
import { normalizarSugestaoObraSupabase } from "./components/community-related-work-supabase-normalizer";
import { mapearComentarioSupabase } from "./components/community-supabase-comment-mapper";
import type { SupabaseComentarioRow } from "./components/community-supabase-comment-row";
import { mapearPostSupabase } from "./components/community-supabase-post-mapper";
import type { SupabasePostRow } from "./components/community-supabase-post-row";
import type { PerfilComunidadeRow } from "./components/community-supabase-profile-row";
import { obterTextoProfileComunidade } from "./components/community-profile-text";
import { obterNomeProfileComunidade } from "./components/community-profile-name";
import { obterAvatarProfileComunidade } from "./components/community-profile-avatar";
import { buscarUsuariosComunidadeSupabase } from "./components/community-supabase-user-search";
import { buscarUsuariosComunidadeNosPosts } from "./components/community-post-user-search";
import { carregarUsuariosSeguidosComunidade } from "./components/community-supabase-followed-users-loader";
import { salvarSeguindoUsuarioComunidade } from "./components/community-follow-user-saver";
import { exigirLogin as exigirLoginComunidade } from "./components/community-login-requirement";
import { garantirAceiteAntesDePublicarComunidade as garantirAceiteAntesDePublicarComunidadeExtraido } from "./components/community-publication-terms-requirement";
import { formatarErroSupabase } from "./components/community-supabase-error-formatter";
import { carregarPostsSalvosSupabaseComunidade } from "./components/community-supabase-saved-posts-loader";
import { erroEhSessaoAusenteComunidade } from "./components/community-supabase-missing-session-error-check";
import { idSupabaseValidoComunidade } from "./components/community-supabase-id-validator";
import { obterUsuarioAutenticadoComunidadeAtual } from "./components/community-supabase-current-user-loader";
import { carregarProfilesComunidadePorUsuarios } from "./components/community-supabase-profiles-loader";
import { removerSugestoesObrasDuplicadas } from "./components/community-related-work-deduplicator";
import { obterObraRelacionadaPermitida } from "./components/community-related-work-allowed-finder";
import { removerReviewComunidadeDoDiario } from "./components/community-diary-review-remover";
import { registrarReviewComunidadeNoDiario } from "./components/community-diary-review-registrar";
import { obterLinhasTexto } from "./components/community-text-lines";
import { obterTodasOpcoesEnquete } from "./components/community-all-poll-options";
import { obterPerguntaEnquete } from "./components/community-poll-question";
import { obterOpcoesEnquete } from "./components/community-valid-poll-options";
import { carregarVotosEnquetesLocais } from "./components/community-local-poll-votes-loader";
import type { ResultadoVotosEnquete } from "./components/community-poll-votes-result";
import { carregarVotosEnquetesSupabase } from "./components/community-supabase-poll-votes-loader";
import { criarNotificacaoComunidadeSupabase } from "./components/community-supabase-notification-creator";
import { contarCurtidasUnicasPostComunidade } from "./components/community-unique-post-likes-count";
import { contarComentaristasUnicosPostComunidade } from "./components/community-unique-post-commenters-count";
import { obterDataOrdenacaoPostComunidade } from "./components/community-post-order-dates";
import { compararDatasOrdenacaoPostsComunidade, compararPostsFixadosPorDataComunidade, compararPostsPorComentariosComunidade, compararPostsPorPontuacaoComunidade, obterPrioridadeFixacaoPostComunidade } from "./components/community-post-order-comparators";
import { compararPrioridadesAutoresSeguidosComunidade, obterPrioridadeAutorSeguidoComunidade } from "./components/community-followed-post-priority";
import { criarPerfilHrefComunidade } from "./components/community-profile-link";
import type { ComentarioComunidade } from "./components/community-comment";
import { obterIdsComentarioComRespostasComunidade } from "./components/community-comment-response-ids";
import { ComentariosSheet } from "./components/community-comments-sheet";
import { fecharComentarios } from "./components/community-comments-closer";
import { abrirComentarios } from "./components/community-comments-opener";
import { salvarVotosEnquetesLocais } from "./components/community-local-poll-votes-saver";
import { calcularTotalVotosEnquete } from "./components/community-poll-total-votes";
import { calcularPorcentagemOpcaoEnquete } from "./components/community-poll-option-percentage";
import { postEhEnquete } from "./components/community-post-poll-check";
import { obterTipoVisualPublicacao } from "./components/community-publication-visual-type";
import {
  MAX_OPCOES_ENQUETE,
  MIN_OPCOES_ENQUETE,
} from "./components/community-poll-constants";
import {
  prepararEnqueteComunidade,
  selecionarTipoPublicacaoPost,
} from "./components/community-poll-preparer";
import { votarEnquete } from "./components/community-poll-voter";
import { alternarSpoilerRevelado } from "./components/community-spoiler-revealed-toggler";
import { abrirPublicacaoRapidaComunidade } from "./components/community-quick-publication-opener";
import { alternarPostSalvo } from "./components/community-saved-post-toggler";
import { deveOcultarPostPorFiltroSalvosComunidade } from "./components/community-saved-post-filter";
import { compartilharPublicacao } from "./components/community-post-sharer";
import { carregarPostsComunidade } from "./components/community-posts-loader";
import { carregarMaisPostsComunidade } from "./components/community-more-posts-loader";
import {
  CHAVE_POSTS_SALVOS_COMUNIDADE,
} from "./components/community-storage-keys";
import { CommunityThemeStyles } from "./components/community-theme-styles";
import { CommunityPageContainer } from "./components/community-page-container";
import { CommunityContentContainer } from "./components/community-content-container";
import { CommunityTopWaterFade } from "./components/community-top-water-fade";
import { CommunityDesktopHeader } from "./components/community-desktop-header";
import { CommunityDesktopTitle } from "./components/community-desktop-title";
import { CommunityDesktopHeaderActions } from "./components/community-desktop-header-actions";
import { CommunityDesktopSearchContainer } from "./components/community-desktop-search-container";
import { CommunityDesktopSearchIcon } from "./components/community-desktop-search-icon";
import { CommunityDesktopSearchInput } from "./components/community-desktop-search-input";
import { CommunityDesktopFilterButton } from "./components/community-desktop-filter-button";
import { CommunityMainLayout } from "./components/community-main-layout";
import { CommunityFeedColumn } from "./components/community-feed-column";
import { CommunityFeedErrorNotice } from "./components/community-feed-error-notice";
import { CommunityFeedFiltersContainer } from "./components/community-feed-filters-container";
import { CommunityFilterControlsRow } from "./components/community-filter-controls-row";
import { CommunitySearchContainer } from "./components/community-search-container";
import { CommunitySearchInput } from "./components/community-search-input";
import { CommunitySearchToggleButton } from "./components/community-search-toggle-button";
import { CommunitySearchIcon } from "./components/community-search-icon";
import { CommunityAdvancedFiltersButton, textoBotaoFiltrosAvancadosComunidade } from "./components/community-advanced-filters-button";
import { CommunityAdvancedFiltersIcon } from "./components/community-advanced-filters-icon";
import { CommunityFeedTabsContainer } from "./components/community-feed-tabs-container";
import { CommunityFeedTabButton } from "./components/community-feed-tab-button";
import { CommunitySheetOverlay } from "./components/community-sheet-overlay";
import { CommunitySheetSurface } from "./components/community-sheet-surface";
import { CommunitySheetHandle } from "./components/community-sheet-handle";
import { CommunitySheetTitle } from "./components/community-sheet-title";
import { CommunitySheetSectionLabel } from "./components/community-sheet-section-label";
import { CommunitySheetFilterOption } from "./components/community-sheet-filter-option";
import { CommunitySheetPrimaryAction } from "./components/community-sheet-primary-action";
import { CommunitySheetMenuAction } from "./components/community-sheet-menu-action";
import { CommunitySheetDangerAction } from "./components/community-sheet-danger-action";
import { CommunitySheetVisibilityMenu } from "./components/community-sheet-visibility-menu";
import { CommunitySheetVisibilityTitle } from "./components/community-sheet-visibility-title";
import { CommunitySheetVisibilityOption } from "./components/community-sheet-visibility-option";
import { CommunityUserSearchSection } from "./components/community-user-search-section";
import { CommunitySearchResultsHeader } from "./components/community-search-results-header";
import { CommunitySearchResultsTitle } from "./components/community-search-results-title";
import { CommunitySearchResultsCount } from "./components/community-search-results-count";
import { CommunitySearchResultsEmpty } from "./components/community-search-results-empty";
import { CommunityUserSearchLoading } from "./components/community-user-search-loading";
import { CommunityUserSearchList } from "./components/community-user-search-list";
import { CommunityUserSearchCard } from "./components/community-user-search-card";
import { CommunityUserSearchAvatar } from "./components/community-user-search-avatar";
import { CommunityUserSearchInfo } from "./components/community-user-search-info";
import { CommunityUserSearchName } from "./components/community-user-search-name";
import { CommunityUserSearchUsername } from "./components/community-user-search-username";
import { CommunityUserSearchFollowButton } from "./components/community-user-search-follow-button";
import { CommunityUserSearchSelfBadge } from "./components/community-user-search-self-badge";
import { CommunityPostsList } from "./components/community-posts-list";
import { CommunityFeedEmptyMessage } from "./components/community-feed-empty-message";
import { CommunityPostComposerOverlay } from "./components/community-post-composer-overlay";
import { CommunityPostComposerBackdrop } from "./components/community-post-composer-backdrop";
import { CommunityPostComposerPanel } from "./components/community-post-composer-panel";
import { CommunityPostComposerHeader } from "./components/community-post-composer-header";
import { CommunityPostComposerForm } from "./components/community-post-composer-form";
import { CommunityPostComposerFields } from "./components/community-post-composer-fields";
import { CommunityPostComposerField } from "./components/community-post-composer-field";
import { CommunityPostComposerFieldLabel } from "./components/community-post-composer-field-label";
import { CommunityPostComposerSelect } from "./components/community-post-composer-select";
import { CommunityPostComposerInput } from "./components/community-post-composer-input";
import { getCommunityPostComposerRelatedChapterInputStyle } from "./components/community-post-composer-related-chapter-input-style";
import { CommunityPostComposerRelatedWorkSearch } from "./components/community-post-composer-related-work-search";
import { CommunityPostComposerRelatedWorkSuggestions } from "./components/community-post-composer-related-work-suggestions";
import { CommunityPostComposerRelatedWorkSuggestionButton } from "./components/community-post-composer-related-work-suggestion-button";
import { CommunityPostComposerRelatedWorkSuggestionContent } from "./components/community-post-composer-related-work-suggestion-content";
import { CommunityPostComposerRelatedWorkSuggestionTitle } from "./components/community-post-composer-related-work-suggestion-title";
import { CommunityPostComposerRelatedWorkSuggestionAuthor } from "./components/community-post-composer-related-work-suggestion-author";
import { CommunityPostComposerRelatedWorkSuggestionBadge } from "./components/community-post-composer-related-work-suggestion-badge";
import { CommunityPostComposerPublicationHeader } from "./components/community-post-composer-publication-header";
import { CommunityPostComposerPublicationTools } from "./components/community-post-composer-publication-tools";
import { CommunityPostComposerPollTemplateButton } from "./components/community-post-composer-poll-template-button";
import { CommunityPostComposerCharacterCount } from "./components/community-post-composer-character-count";
import { CommunityPostComposerSuggestionsSection } from "./components/community-post-composer-suggestions-section";
import { CommunityPostComposerSuggestionsLabel } from "./components/community-post-composer-suggestions-label";
import { CommunityPostComposerSuggestionsList } from "./components/community-post-composer-suggestions-list";
import { CommunityPostComposerSuggestionButton } from "./components/community-post-composer-suggestion-button";
import { CommunityPostComposerTextarea } from "./components/community-post-composer-textarea";
import { CommunityPostComposerErrorMessage } from "./components/community-post-composer-error-message";
import { CommunityPostComposerActionRow } from "./components/community-post-composer-action-row";
import { CommunityPostComposerSpoilerButton } from "./components/community-post-composer-spoiler-button";
import { CommunityPostComposerSpoilerLabel } from "./components/community-post-composer-spoiler-label";
import { CommunityPostComposerSpoilerIndicator } from "./components/community-post-composer-spoiler-indicator";
import { CommunityPostComposerPublishButton } from "./components/community-post-composer-publish-button";
import { CommunityActionFeedbackToast, emitirFeedbackAcao } from "./components/community-action-feedback-toast";
import {
  finalizarAcaoComunidade,
  iniciarAcaoComunidade,
} from "./components/community-action-lock";
import { CommunityLoadMorePostsContainer } from "./components/community-load-more-posts-container";
import { CommunityLoadMorePostsButton } from "./components/community-load-more-posts-button";
import { CommunityPostCard } from "./components/community-post-card";
import { CommunityPostHeader } from "./components/community-post-header";
import { CommunityPostAuthorAvatar } from "./components/community-post-author-avatar";
import { CommunityPostAuthorMeta } from "./components/community-post-author-meta";
import { CommunityPostAuthorLink } from "./components/community-post-author-link";
import { CommunityPostStatusLine } from "./components/community-post-status-line";
import { CommunityPostStatusSeparator } from "./components/community-post-status-separator";
import { CommunityPostBadgesRow } from "./components/community-post-badges-row";
import { CommunityPostBadgeSeparator } from "./components/community-post-badge-separator";
import { CommunityPostOptionsContainer } from "./components/community-post-options-container";
import { CommunityPostOptionsButton } from "./components/community-post-options-button";
import { CommunityPostPinnedBadge } from "./components/community-post-pinned-badge";
import { CommunityPostVisibilityBadge } from "./components/community-post-visibility-badge";
import { CommunityPostTypeBadge } from "./components/community-post-type-badge";
import { CommunitySpoilerHiddenTitle } from "./components/community-spoiler-hidden-title";
import { CommunityPostText } from "./components/community-post-text";
import { CommunityPostActions } from "./components/community-post-actions";
import { CommunityPostLikeButton } from "./components/community-post-like-button";
import { CommunityPostCommentsButton } from "./components/community-post-comments-button";
import { CommunityPostSpoilerButton } from "./components/community-post-spoiler-button";
import { CommunityPollBox } from "./components/community-poll-box";
import { CommunityPollOptions } from "./components/community-poll-options";
import { CommunityPollOptionButton } from "./components/community-poll-option-button";
import { CommunityPollResultBar } from "./components/community-poll-result-bar";
import { CommunityPollOptionText } from "./components/community-poll-option-text";
import { CommunityPollOptionStatus } from "./components/community-poll-option-status";
import { CommunityRelatedWorkBadge } from "./components/community-related-work-badge";
import { CommunityRelatedChapterBadge } from "./components/community-related-chapter-badge";
import { traduzirTextoComunidade } from "./components/community-text-translator";
import { CommunityLanguageBridge } from "./components/community-language-bridge";
import { traduzirContagemResultadosComunidade } from "./components/community-results-count-translator";
import { formatarDataComunidade } from "./components/community-post-date-formatter";
import { carregarJsonUsuarioComunidade } from "./components/community-user-json-loader";
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
  const [categoriaPost, setCategoriaPost] =
    useState<CategoriaComunidade>("Geral");
  const [tipoPublicacaoPost, setTipoPublicacaoPost] =
    useState<TipoPublicacaoComunidade>("Discussão");
  const [visibilidadePost, setVisibilidadePost] =
    useState<VisibilidadePostComunidade>("publico");
  const [temSpoilerPost, setTemSpoilerPost] = useState(false);
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
  const [obraRelacionadaBusca, setObraRelacionadaBusca] = useState("");
  const [capituloRelacionadoPost, setCapituloRelacionadoPost] = useState("");
  const [obrasRelacionadasSugestoes, setObrasRelacionadasSugestoes] = useState<
    ObraRelacionadaSugestao[]
  >([]);
  const [sugestoesObrasAbertas, setSugestoesObrasAbertas] = useState(false);
  const textoPostRef = useRef<HTMLTextAreaElement | null>(null);
  const obraRelacionadaRef = useRef<HTMLInputElement | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const autenticacaoComunidadeVersaoRef = useRef(0);
  const reviewsDiarioSincronizadasRef = useRef<Set<string>>(new Set<string>());
  const usuarioReviewsDiarioRef = useRef("");
  const acoesComunidadeRef = useRef<Set<string>>(new Set<string>());
  const parametrosComunidadeAplicadosRef = useRef(false);
  const comentarioUrlAplicadoRef = useRef(false);
  const [composerAberto, setComposerAberto] = useState(false);
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
  const [isDesktop, setIsDesktop] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(communityPageStyle);
  const carregarPostsComunidadeNoEfeito = useEffectEvent(
    (mostrarCarregamento: boolean, pagina: number, obraFiltro: string) =>
      carregarPostsComunidadeDaPagina(mostrarCarregamento, pagina, obraFiltro),
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const atualizarModoDesktop = () => {
      setIsDesktop(mediaQuery.matches);
    };

    const atualizarModoDesktopTimer = window.setTimeout(
      atualizarModoDesktop,
      0
    );

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", atualizarModoDesktop);

      return () => {
        window.clearTimeout(atualizarModoDesktopTimer);
        mediaQuery.removeEventListener("change", atualizarModoDesktop);
      };
    }

    mediaQuery.addListener(atualizarModoDesktop);

    return () => {
      window.clearTimeout(atualizarModoDesktopTimer);
      mediaQuery.removeListener(atualizarModoDesktop);
    };
  }, []);

  useEffect(() => {
    const userId = usuario?.id || "";
    let cancelado = false;

    const carregarLocaisTimer = window.setTimeout(() => {
      try {
        const postsSalvosParseados =
          carregarJsonUsuarioComunidade(CHAVE_POSTS_SALVOS_COMUNIDADE, userId) ||
          [];

        if (Array.isArray(postsSalvosParseados)) {
          setPostsSalvosIds(
            postsSalvosParseados.filter(
              (postId): postId is string => typeof postId === "string"
            )
          );
        } else {
          setPostsSalvosIds([]);
        }
      } catch {
        setPostsSalvosIds([]);
      }

      setVotosEnquetes(carregarVotosEnquetesLocais(carregarJsonUsuarioComunidade, userId));

      if (!userId) {
        return;
      }

      void carregarPostsSalvosSupabaseComunidade(userId).then((postsSalvosReais) => {
        if (cancelado || !postsSalvosReais) {
          return;
        }

        setPostsSalvosIds(postsSalvosReais);
        salvarJsonUsuarioComunidade(
          CHAVE_POSTS_SALVOS_COMUNIDADE,
          userId,
          postsSalvosReais
        );
      });
    }, 0);

    return () => {
      cancelado = true;
      window.clearTimeout(carregarLocaisTimer);
    };
  }, [usuario?.id]);

  useEffect(() => {
    const feedbackTimer = feedbackTimerRef;

    return () => {
      if (feedbackTimer.current) {
        window.clearTimeout(feedbackTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregarVotosReaisEnquetes() {
      const postsEnqueteIds = posts
        .filter((post) => postEhEnquete(post))
        .map((post) => post.id)
        .filter(Boolean);

      if (postsEnqueteIds.length === 0) {
        window.setTimeout(() => {
          if (!cancelado) {
            setResultadosEnquetes({});
          }
        }, 0);
        return;
      }

      const votosLocais = carregarVotosEnquetesLocais(
        carregarJsonUsuarioComunidade,
        usuario?.id || ""
      );

      window.setTimeout(() => {
        if (!cancelado) {
          setVotosEnquetes((votosAtuais) => ({
            ...votosLocais,
            ...votosAtuais,
          }));
        }
      }, 0);

      if (!usuario?.id) {
        return;
      }

      const votosReais = await carregarVotosEnquetesSupabase(
        postsEnqueteIds,
        usuario.id
      );

      if (cancelado || !votosReais) {
        return;
      }

      window.setTimeout(() => {
        if (cancelado) {
          return;
        }

        setResultadosEnquetes(votosReais.resultados);

        setVotosEnquetes((votosAtuais) => {
          const votosAtualizados = {
            ...votosAtuais,
            ...votosReais.meusVotos,
          };

          salvarVotosEnquetesLocais(
            salvarJsonUsuarioComunidade,
            votosAtualizados,
            usuario.id
          );

          return votosAtualizados;
        });
      }, 0);
    }

    void carregarVotosReaisEnquetes();

    return () => {
      cancelado = true;
    };
  }, [posts, usuario?.id]);

  useEffect(() => {
    let cancelado = false;
    const timersAutenticacao = new Set<number>();

    function limparEstadoContaAnterior() {
      setUsuario(null);
      setUsuarioEhAdmin(false);
      setPostMenuAbertoId(null);
      setMenuAcoesRapidasComunidadeAberto(false);
      setComposerAberto(false);
      setComentariosPostId(null);
      setPostsSalvosIds([]);
      setVotosEnquetes({});
      setResultadosEnquetes({});
      setUsuariosSeguidosIds([]);
      setUsuarioSeguindoId(null);
      setPostCurtindoId(null);
      setPostSalvandoId(null);
      setPostCompartilhandoId(null);
      setPostRemovendoId(null);
      setPostFixandoId(null);
      setDenunciaAlvo(null);
      setFeedbackAcao("");
      setObraRelacionadaBusca("");
      setCapituloRelacionadoPost("");
      setSugestoesObrasAbertas(false);
      reviewsDiarioSincronizadasRef.current.clear();
      usuarioReviewsDiarioRef.current = "";
      acoesComunidadeRef.current.clear();

      if (textoPostRef.current) {
        textoPostRef.current.value = "";
      }

      if (obraRelacionadaRef.current) {
        obraRelacionadaRef.current.value = "";
      }
    }

    async function carregarUsuario() {
      const versaoCarregamento =
        autenticacaoComunidadeVersaoRef.current + 1;

      autenticacaoComunidadeVersaoRef.current = versaoCarregamento;
      setCarregandoUsuario(true);

      try {
        const { data, error: usuarioErro } = await supabase.auth.getUser();

        if (
          cancelado ||
          versaoCarregamento !== autenticacaoComunidadeVersaoRef.current
        ) {
          return;
        }

        if (usuarioErro) {
          if (!erroEhSessaoAusenteComunidade(usuarioErro)) {
            console.warn(
              "Não consegui carregar usuário da Comunidade:",
              usuarioErro.message
            );
          }

          setUsuario(null);
          setUsuarioEhAdmin(false);
          return;
        }

        const user = data.user || null;

        if (!user) {
          setUsuario(null);
          setUsuarioEhAdmin(false);
          return;
        }

        let nomeProfile = "";
        let avatarProfile = "";
        let usuarioAdmin = false;

        try {
          const profilesPorUsuario =
            await carregarProfilesComunidadePorUsuarios(
              [user.id],
              obterTextoProfileComunidade
            );
          const profile = profilesPorUsuario.get(user.id);

          nomeProfile = obterNomeProfileComunidade(profile);
          avatarProfile = obterAvatarProfileComunidade(profile);
        } catch {
          nomeProfile = "";
          avatarProfile = "";
        }

        try {
          const { data: adminData, error: adminError } = await supabase.rpc(
            "usuario_e_admin"
          );

          usuarioAdmin = !adminError && adminData === true;
        } catch {
          usuarioAdmin = false;
        }

        if (
          cancelado ||
          versaoCarregamento !== autenticacaoComunidadeVersaoRef.current
        ) {
          return;
        }

        const usuarioConfirmado = await obterUsuarioAutenticadoComunidadeAtual();

        if (
          cancelado ||
          versaoCarregamento !== autenticacaoComunidadeVersaoRef.current ||
          !usuarioConfirmado ||
          usuarioConfirmado.id !== user.id
        ) {
          return;
        }

        setUsuarioEhAdmin(usuarioAdmin);
        setUsuario({
          id: user.id,
          email: user.email || "",
          nome: obterNomeUsuario(user.email || "", nomeProfile),
          avatar: avatarProfile,
        });
      } catch (error) {
        if (!erroEhSessaoAusenteComunidade(error)) {
          console.warn("Não consegui iniciar usuário da Comunidade:", error);
        }

        if (
          !cancelado &&
          versaoCarregamento === autenticacaoComunidadeVersaoRef.current
        ) {
          setUsuario(null);
          setUsuarioEhAdmin(false);
        }
      } finally {
        if (
          !cancelado &&
          versaoCarregamento === autenticacaoComunidadeVersaoRef.current
        ) {
          setCarregandoUsuario(false);
        }
      }
    }

    void carregarUsuario();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      autenticacaoComunidadeVersaoRef.current += 1;
      limparEstadoContaAnterior();
      setCarregandoUsuario(true);
      setPosts([]);
      setCarregandoFeed(true);

      const timer = window.setTimeout(() => {
        timersAutenticacao.delete(timer);

        if (cancelado) {
          return;
        }

        void carregarUsuario();

        const obraFiltroUrl = (
          new URLSearchParams(window.location.search).get("obra") || ""
        )
          .trim()
          .slice(0, 90);

        void carregarPostsComunidadeNoEfeito(true, 0, obraFiltroUrl);
      }, 0);

      timersAutenticacao.add(timer);
    });

    return () => {
      cancelado = true;
      autenticacaoComunidadeVersaoRef.current += 1;
      timersAutenticacao.forEach((timer) => window.clearTimeout(timer));
      timersAutenticacao.clear();
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregarObrasRelacionadas() {
      const obrasLocais = carregarSugestoesObrasLocais(usuario?.id || "");

      try {
        const { data, error } = await supabase
          .from("obras")
          .select("id, user_id, titulo, autor, classificacao_indicativa, publicado, slug, link")
          .eq("publicado", true)
          .order("criada_em", { ascending: false })
          .limit(120);

        if (error) {
          throw error;
        }

        const obrasSupabase = (data || [])
          .map((obra, index) => normalizarSugestaoObraSupabase(obra, index))
          .filter((obra): obra is ObraRelacionadaSugestao => Boolean(obra));

        if (!cancelado) {
          setObrasRelacionadasSugestoes(
            removerSugestoesObrasDuplicadas([...obrasSupabase, ...obrasLocais])
          );
        }
      } catch {
        if (!cancelado) {
          setObrasRelacionadasSugestoes(
            removerSugestoesObrasDuplicadas(obrasLocais)
          );
        }
      }
    }

    void carregarObrasRelacionadas();

    return () => {
      cancelado = true;
    };
  }, [usuario?.id]);

  useEffect(() => {
    const userId = usuario?.id.trim() || "";

    if (!userId) {
      reviewsDiarioSincronizadasRef.current.clear();
      usuarioReviewsDiarioRef.current = "";
      return;
    }

    if (usuarioReviewsDiarioRef.current !== userId) {
      reviewsDiarioSincronizadasRef.current.clear();
      usuarioReviewsDiarioRef.current = userId;
    }

    const reviewsPendentes = posts.filter((post) => {
      return (
        post.autorId.trim() === userId &&
        post.tipoPublicacao === "Review" &&
        !reviewsDiarioSincronizadasRef.current.has(post.id)
      );
    });

    if (reviewsPendentes.length === 0) {
      return;
    }

    let cancelado = false;

    reviewsPendentes.forEach((post) => {
      reviewsDiarioSincronizadasRef.current.add(post.id);
    });

    async function sincronizarReviewsPendentes() {
      for (const post of reviewsPendentes) {
        if (cancelado) {
          return;
        }

        const sincronizou = await registrarReviewComunidadeNoDiario({
          userId,
          texto: post.texto,
          obraRelacionada: post.obraRelacionada,
          postId: post.id,
          criadaEm: post.criadoEm,
          sugestoesObras: obrasRelacionadasSugestoes,
          visibilidade: post.visibilidade,
        });

        if (!sincronizou) {
          reviewsDiarioSincronizadasRef.current.delete(post.id);
        }
      }
    }

    void sincronizarReviewsPendentes();

    return () => {
      cancelado = true;
    };
  }, [usuario?.id, posts, obrasRelacionadasSugestoes]);

  useEffect(() => {
    if (composerAberto) {
      return;
    }

    const fecharSugestoesTimer = window.setTimeout(() => {
      setSugestoesObrasAbertas(false);
      setObraRelacionadaBusca("");
      setVisibilidadePost("publico");
    }, 0);

    return () => {
      window.clearTimeout(fecharSugestoesTimer);
    };
  }, [composerAberto]);

  useEffect(() => {
    if (!menuAcoesRapidasComunidadeAberto && !postMenuAbertoId) {
      return;
    }

    const overflowAnterior = document.body.style.getPropertyValue("overflow");
    const overscrollAnterior = document.documentElement.style.getPropertyValue(
      "overscroll-behavior"
    );

    document.body.style.setProperty("overflow", "hidden");
    document.documentElement.style.setProperty("overscroll-behavior", "none");

    return () => {
      if (overflowAnterior) {
        document.body.style.setProperty("overflow", overflowAnterior);
      } else {
        document.body.style.removeProperty("overflow");
      }

      if (overscrollAnterior) {
        document.documentElement.style.setProperty(
          "overscroll-behavior",
          overscrollAnterior
        );
      } else {
        document.documentElement.style.removeProperty("overscroll-behavior");
      }
    };
  }, [menuAcoesRapidasComunidadeAberto, postMenuAbertoId]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    const parametrosUrl = new URLSearchParams(window.location.search);
    const obraUrl = (parametrosUrl.get("obra") || "").trim().slice(0, 90);

    const carregarFeedTimer = window.setTimeout(() => {
      void carregarPostsComunidadeNoEfeito(true, 0, obraUrl);
    }, 0);

    return () => {
      window.clearTimeout(carregarFeedTimer);
    };
  }, []);

  useEffect(() => {
    if (parametrosComunidadeAplicadosRef.current) {
      return;
    }

    parametrosComunidadeAplicadosRef.current = true;

    const parametrosUrl = new URLSearchParams(window.location.search);
    const buscaUrl = (parametrosUrl.get("busca") || "").trim();
    const obraUrl = (parametrosUrl.get("obra") || "").trim().slice(0, 90);
    const tipoUrl = obterTipoPublicacaoPorParametro(
      parametrosUrl.get("tipo") || ""
    );
    const grupoObraUrl = obterGrupoPublicacaoObraPorParametro(
      parametrosUrl.get("grupo") || ""
    );

    if (!buscaUrl && !obraUrl && !tipoUrl && !grupoObraUrl) {
      return;
    }

    const aplicarParametrosTimer = window.setTimeout(() => {
      if (buscaUrl) {
        setTermoBusca(buscaUrl.slice(0, 90));
      }

      setObraRelacionadaFiltro(obraUrl);
      setGrupoPublicacaoObra(tipoUrl ? "" : grupoObraUrl);

      if (tipoUrl) {
        setTipoPublicacaoAtiva(tipoUrl);
        setAbaFeedAtiva(
          tipoUrl === "Teoria"
            ? "Teorias"
            : tipoUrl === "Review"
              ? "Reviews"
              : "Recentes"
        );
        setMenuAcoesRapidasComunidadeAberto(true);
      } else if (grupoObraUrl) {
        setTipoPublicacaoAtiva("Todos");
      }

      setMostrarApenasSalvos(false);
      setOrdenacaoAtiva("Recentes");
    }, 0);

    return () => {
      window.clearTimeout(aplicarParametrosTimer);
    };
  }, []);

  useEffect(() => {
    if (comentarioUrlAplicadoRef.current || comentariosPostId || posts.length === 0) {
      return;
    }

    const postIdUrl = new URLSearchParams(window.location.search).get("post");

    if (postIdUrl && posts.some((post) => post.id === postIdUrl)) {
      comentarioUrlAplicadoRef.current = true;

      const abrirComentariosTimer = window.setTimeout(() => {
        setComentariosPostId(postIdUrl);
      }, 0);

      return () => {
        window.clearTimeout(abrirComentariosTimer);
      };
    }
  }, [comentariosPostId, posts]);

  const termoBuscaNormalizado = useMemo(
    () => normalizarTermoBuscaComunidade(termoBuscaAdiado),
    [termoBuscaAdiado]
  );

  useEffect(() => {
    let cancelado = false;
    const userId = usuario?.id || "";

    if (!userId) {
      const limparUsuariosSeguidosTimer = window.setTimeout(() => {
        if (!cancelado) {
          setUsuariosSeguidosIds([]);
        }
      }, 0);

      return () => {
        cancelado = true;
        window.clearTimeout(limparUsuariosSeguidosTimer);
      };
    }

    void carregarUsuariosSeguidosComunidade(userId).then((idsSeguidos) => {
      if (!cancelado) {
        setUsuariosSeguidosIds(idsSeguidos);
      }
    });

    return () => {
      cancelado = true;
    };
  }, [usuario?.id]);

  useEffect(() => {
    let cancelado = false;
    const termoLimpo = normalizarTermoBuscaUsuariosComunidade(termoBuscaAdiado);

    if (!buscaComunidadeAberta || termoLimpo.length < 2) {
      const limparBuscaUsuariosTimer = window.setTimeout(() => {
        if (!cancelado) {
          setUsuariosBuscaComunidade([]);
          setCarregandoUsuariosBuscaComunidade(false);
        }
      }, 0);

      return () => {
        cancelado = true;
        window.clearTimeout(limparBuscaUsuariosTimer);
      };
    }

    const buscaTimer = window.setTimeout(() => {
      if (cancelado) {
        return;
      }

      setCarregandoUsuariosBuscaComunidade(true);

      const usuariosLocais = buscarUsuariosComunidadeNosPosts(
        posts,
        termoLimpo
      );

      void buscarUsuariosComunidadeSupabase(termoLimpo)
        .then((usuariosSupabase) => {
          if (cancelado) {
            return;
          }

          const usuariosPorId = new Map<string, UsuarioBuscaComunidade>();

          [...usuariosSupabase, ...usuariosLocais].forEach((usuarioBusca) => {
            const usuarioExistente = usuariosPorId.get(usuarioBusca.id);

            usuariosPorId.set(usuarioBusca.id, {
              id: usuarioBusca.id,
              nome: usuarioBusca.nome || usuarioExistente?.nome || "Usuário",
              username:
                usuarioBusca.username || usuarioExistente?.username || "",
              avatar: usuarioBusca.avatar || usuarioExistente?.avatar || "",
            });
          });

          const termoNormalizado = normalizarTexto(termoLimpo);
          const usuariosOrdenados = Array.from(usuariosPorId.values())
            .sort((usuarioA, usuarioB) => {
              const textoA = normalizarTexto(
                `${usuarioA.nome} ${usuarioA.username}`
              );
              const textoB = normalizarTexto(
                `${usuarioB.nome} ${usuarioB.username}`
              );
              const prefixoA = textoA.startsWith(termoNormalizado);
              const prefixoB = textoB.startsWith(termoNormalizado);

              if (prefixoA !== prefixoB) {
                return prefixoA ? -1 : 1;
              }

              return usuarioA.nome.localeCompare(usuarioB.nome, "pt-BR");
            })
            .slice(0, 12);

          setUsuariosBuscaComunidade(usuariosOrdenados);
        })
        .finally(() => {
          if (!cancelado) {
            setCarregandoUsuariosBuscaComunidade(false);
          }
        });
    }, 220);

    return () => {
      cancelado = true;
      window.clearTimeout(buscaTimer);
    };
  }, [buscaComunidadeAberta, posts, termoBuscaAdiado]);

  const postsVisiveis = useMemo(() => {
    const postsFiltrados = posts.filter((post) => {
      const categoriaCombina = postCombinaCategoriaComunidade(
        post,
        categoriaAtiva
      );
      const tipoVisualPublicacao = obterTipoVisualPublicacao(post);
      const tipoPublicacaoCombina = postCombinaTipoPublicacaoComunidade(
        tipoVisualPublicacao,
        tipoPublicacaoAtiva
      );
      const obraRelacionadaCombina = postCombinaObraRelacionadaComunidade(
        post,
        obraRelacionadaFiltro
      );
      const grupoPublicacaoCombina = postCombinaGrupoPublicacaoComunidade(
        tipoVisualPublicacao,
        grupoPublicacaoObra
      );
      const abaFeedCombina = postCombinaAbaFeedComunidade(
        post,
        tipoVisualPublicacao,
        abaFeedAtiva,
        usuariosSeguidosIds
      );

      if (
        !categoriaCombina ||
        !tipoPublicacaoCombina ||
        !obraRelacionadaCombina ||
        !grupoPublicacaoCombina ||
        !abaFeedCombina
      ) {
        return false;
      }

      if (
        deveOcultarPostPorFiltroSalvosComunidade(
          post,
          mostrarApenasSalvos,
          postsSalvosIds
        )
      ) {
        return false;
      }

      return postCombinaTermoBuscaComunidade(post, termoBuscaNormalizado);
    });

    return [...postsFiltrados].sort((postA, postB) => {
      const dataOrdenacaoA = obterDataOrdenacaoPostComunidade(postA);
      const dataOrdenacaoB = obterDataOrdenacaoPostComunidade(postB);

      if (postA.fixado !== postB.fixado) {
        return obterPrioridadeFixacaoPostComunidade(postA);
      }

      if (postA.fixado && postB.fixado) {
        return compararPostsFixadosPorDataComunidade(
          postA,
          postB,
          dataOrdenacaoA,
          dataOrdenacaoB
        );
      }

      if (abaFeedAtiva === "Para você" && ordenacaoAtiva === "Recentes") {
        const seguindoA = obterPrioridadeAutorSeguidoComunidade(
          postA,
          usuariosSeguidosIds
        );
        const seguindoB = obterPrioridadeAutorSeguidoComunidade(
          postB,
          usuariosSeguidosIds
        );

        if (seguindoA !== seguindoB) {
          return compararPrioridadesAutoresSeguidosComunidade(
            seguindoA,
            seguindoB
          );
        }

        return compararPostsPorPontuacaoComunidade(
          postA,
          postB,
          dataOrdenacaoA,
          dataOrdenacaoB
        );
      }

      if (ordenacaoAtiva === "Mais comentadas") {
        return compararPostsPorComentariosComunidade(
          postA,
          postB,
          dataOrdenacaoA,
          dataOrdenacaoB
        );
      }

      if (ordenacaoAtiva === "Em alta") {
        return compararPostsPorPontuacaoComunidade(
          postA,
          postB,
          dataOrdenacaoA,
          dataOrdenacaoB
        );
      }

      return compararDatasOrdenacaoPostsComunidade(
        dataOrdenacaoA,
        dataOrdenacaoB
      );
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

  useEffect(() => {
    if (!comentariosPostId) {
      return;
    }

    const overflowAnterior = document.body.style.getPropertyValue("overflow");
    const overscrollAnterior = document.documentElement.style.getPropertyValue(
      "overscroll-behavior"
    );

    document.body.style.setProperty("overflow", "hidden");
    document.documentElement.style.setProperty("overscroll-behavior", "none");

    return () => {
      if (overflowAnterior) {
        document.body.style.setProperty("overflow", overflowAnterior);
      } else {
        document.body.style.removeProperty("overflow");
      }

      if (overscrollAnterior) {
        document.documentElement.style.setProperty(
          "overscroll-behavior",
          overscrollAnterior
        );
      } else {
        document.documentElement.style.removeProperty("overscroll-behavior");
      }
    };
  }, [comentariosPostId]);

  useEffect(() => {
    if (!composerAberto) {
      return;
    }

    const overflowAnterior = document.body.style.getPropertyValue("overflow");
    const overscrollAnterior = document.documentElement.style.getPropertyValue(
      "overscroll-behavior"
    );

    document.body.style.setProperty("overflow", "hidden");
    document.documentElement.style.setProperty("overscroll-behavior", "none");

    const focoTimer = window.setTimeout(() => {
      textoPostRef.current?.focus();
    }, 80);

    return () => {
      window.clearTimeout(focoTimer);

      if (overflowAnterior) {
        document.body.style.setProperty("overflow", overflowAnterior);
      } else {
        document.body.style.removeProperty("overflow");
      }

      if (overscrollAnterior) {
        document.documentElement.style.setProperty(
          "overscroll-behavior",
          overscrollAnterior
        );
      } else {
        document.documentElement.style.removeProperty("overscroll-behavior");
      }
    };
  }, [composerAberto]);

  const filtrosAtivos = temFiltrosAtivosComunidade({
    categoriaAtiva,
    tipoPublicacaoAtiva,
    obraRelacionadaFiltro,
    grupoPublicacaoObra,
    termoBuscaNormalizado,
    mostrarApenasSalvos,
    ordenacaoAtiva,
  });
  function carregarPostsComunidadeDaPagina(
    mostrarCarregamento = false,
    pagina = 0,
    obraFiltro = obraRelacionadaFiltro
  ) {
    return carregarPostsComunidade({
      mostrarCarregamento,
      pagina,
      obraFiltro,
      setCarregandoFeed,
      setCarregandoMaisPostsComunidade,
      setPosts,
      setTemMaisPostsComunidade,
      setPaginaFeedComunidade,
      setObrasRelacionadasSugestoes,
      setErro,
    });
  }

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

  async function alternarSeguirUsuarioBusca(
    usuarioAlvo: UsuarioBuscaComunidade
  ) {
    if (!exigirLogin() || !usuario) {
      return;
    }

    if (usuarioAlvo.id === usuario.id) {
      return;
    }

    const chaveAcao = `seguir-usuario:${usuarioAlvo.id}`;

    if (!iniciarAcaoComunidade(acoesComunidadeRef, chaveAcao)) {
      return;
    }

    const estavaSeguindo = usuariosSeguidosIds.includes(usuarioAlvo.id);
    const deveSeguir = !estavaSeguindo;
    const idsAnteriores = usuariosSeguidosIds;

    setUsuarioSeguindoId(usuarioAlvo.id);
    setUsuariosSeguidosIds((idsAtuais) =>
      deveSeguir
        ? Array.from(new Set([...idsAtuais, usuarioAlvo.id]))
        : idsAtuais.filter((id) => id !== usuarioAlvo.id)
    );

    try {
      const resultado = await salvarSeguindoUsuarioComunidade(
        usuario.id,
        usuarioAlvo.id,
        deveSeguir
      );

      if (!resultado.ok) {
        setUsuariosSeguidosIds(idsAnteriores);
        setErro(
          resultado.erro || "Não foi possível atualizar este usuário agora."
        );
        return;
      }

      const seguindoAgora = resultado.estado === "seguindo";

      setUsuariosSeguidosIds((idsAtuais) =>
        seguindoAgora
          ? Array.from(new Set([...idsAtuais, usuarioAlvo.id]))
          : idsAtuais.filter((id) => id !== usuarioAlvo.id)
      );
      setErro("");
      emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef,
        resultado.estado === "solicitado"
          ? `Solicitação para seguir ${usuarioAlvo.nome} enviada.`
          : seguindoAgora
          ? `Você começou a seguir ${usuarioAlvo.nome}.`
          : `Você deixou de seguir ${usuarioAlvo.nome}.`
      );
    } finally {
      finalizarAcaoComunidade(acoesComunidadeRef, chaveAcao);
      setUsuarioSeguindoId((idAtual) =>
        idAtual === usuarioAlvo.id ? null : idAtual
      );
    }
  }

  async function publicarPost(event: FormEvent<HTMLFormElement>) {
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
        const { data: obrasEncontradas, error: erroObraRelacionada } =
          await supabase
            .from("obras")
            .select("id, user_id, titulo, autor, classificacao_indicativa, publicado, slug, link")
            .eq("publicado", true)
            .eq("titulo", obraLimpa)
            .limit(5);

        if (!erroObraRelacionada) {
          obraRelacionadaPermitida = (
            obrasEncontradas || []
          )
            .map((obra, index) => normalizarSugestaoObraSupabase(obra, index))
            .find((obra): obra is ObraRelacionadaSugestao => Boolean(obra)) || null;

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

      if (textoLimpo.length < 8) {
        setErro("Escreva uma publicação com pelo menos 8 caracteres.");
        return;
      }

      const linhasPost = obterLinhasTexto(textoLimpo);
      const primeiraLinhaPost = linhasPost[0] || "";
      const publicacaoEhEnquete =
        tipoPublicacaoPost === "Enquete" || /^enquete\s*[:\-]/i.test(primeiraLinhaPost);

      if (publicacaoEhEnquete) {
        const perguntaEnquete = obterPerguntaEnquete(textoLimpo);
        const opcoesEnquete = obterTodasOpcoesEnquete(textoLimpo);

        if (!/^enquete\s*[:\-]/i.test(primeiraLinhaPost) || !perguntaEnquete.trim()) {
          setErro("Escreva a pergunta da enquete na primeira linha.");
          return;
        }

        if (opcoesEnquete.length < MIN_OPCOES_ENQUETE) {
          setErro("A enquete precisa ter pelo menos 2 opções preenchidas.");
          return;
        }

        if (opcoesEnquete.length > MAX_OPCOES_ENQUETE) {
          setErro("A enquete pode ter no máximo 4 opções.");
          return;
        }
      }

      const autorNomeSeguro = await obterNomeSeguroUsuarioComunidade(usuario);

      const textoPostBanco = textoLimpo.slice(0, 700);
      const obraPostBanco = juntarObraECapituloRelacionados(
        obraRelacionadaPermitida?.titulo || "",
        capituloLimpo,
      );

      // Não use INSERT ... RETURNING aqui. O RETURNING também passa pela
      // política SELECT da tabela e pode fazer um INSERT válido ser rejeitado.
      const { error } = await supabase
        .from("comunidade_posts")
        .insert({
          autor_id: usuarioAutenticadoId,
          autor_nome: autorNomeSeguro,
          categoria: categoriaPost,
          tipo_publicacao: publicacaoEhEnquete ? "Discussão" : tipoPublicacaoPost,
          tem_spoiler: temSpoilerPost,
          texto: textoPostBanco,
          obra_relacionada: obraPostBanco,
          visibilidade: visibilidadeSegura,
        });

      if (error) {
        setErro(formatarErroSupabase("Erro ao publicar", error));
        return;
      }

      // A leitura é feita em uma consulta separada, depois que o INSERT termina.
      const { data: postCriado } = await supabase
        .from("comunidade_posts")
        .select(
          "id, autor_id, autor_nome, categoria, tipo_publicacao, tem_spoiler, texto, obra_relacionada, criado_em, fixado, fixado_em, fixado_por, visibilidade"
        )
        .eq("autor_id", usuarioAutenticadoId)
        .eq("texto", textoPostBanco)
        .order("criado_em", { ascending: false })
        .limit(1)
        .maybeSingle();

      let novoPost: PostComunidade | null = null;

      if (postCriado) {
        const profilesPostNovo = new Map<string, PerfilComunidadeRow>([
          [
            usuarioAutenticadoId,
            {
              nome: autorNomeSeguro,
              avatar_url: usuario.avatar,
            },
          ],
        ]);

        novoPost = mapearPostSupabase(
          postCriado as SupabasePostRow,
          new Map<string, ComentarioComunidade[]>(),
          new Map<string, string[]>(),
          profilesPostNovo,
          obterNomeProfileComunidade,
          obterAvatarProfileComunidade,
          normalizarCategoria,
          normalizarTipoPublicacao,
          normalizarVisibilidadePostComunidade
        );

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

  async function alternarCurtida(postId: string) {
    const chaveAcao = `curtir-post:${postId}`;

    if (!iniciarAcaoComunidade(acoesComunidadeRef, chaveAcao)) {
      return;
    }

    setPostCurtindoId(postId);
    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      const postAtual = posts.find((post) => post.id === postId);
      const jaCurtiu = Boolean(postAtual?.curtidas.includes(usuario.id));

      const { error: erroLimparCurtida } = await supabase
        .from("comunidade_curtidas")
        .delete()
        .eq("post_id", postId)
        .eq("usuario_id", usuario.id);

      if (erroLimparCurtida) {
        setErro(formatarErroSupabase("Erro ao atualizar curtida", erroLimparCurtida));
        return;
      }

      if (!jaCurtiu) {
        const { error: erroInserirCurtida } = await supabase
          .from("comunidade_curtidas")
          .insert({
            post_id: postId,
            usuario_id: usuario.id,
          });

        if (erroInserirCurtida) {
          setErro(formatarErroSupabase("Erro ao curtir", erroInserirCurtida));
          return;
        }

        if (postAtual?.autorId) {
          await criarNotificacaoComunidadeSupabase({
            destinatarioId: postAtual.autorId,
            tipo: "comunidade-curtida-post",
            titulo: "Nova curtida na Comunidade",
            mensagem: `${usuario.nome} curtiu sua publicação.`,
            link: `/comunidade?post=${encodeURIComponent(postId)}`,
            notificacaoId: `comunidade-curtida-post:${postId}:${usuario.id}`,
          }, idSupabaseValidoComunidade);
        }
      }

      setPosts((postsAtuais) => {
        return postsAtuais.map((post) => {
          if (post.id !== postId) {
            return post;
          }

          return {
            ...post,
            curtidas: jaCurtiu
              ? post.curtidas.filter((curtidaId) => curtidaId !== usuario.id)
              : Array.from(new Set([...post.curtidas, usuario.id])),
          };
        });
      });

    } finally {
      finalizarAcaoComunidade(acoesComunidadeRef, chaveAcao);
      setPostCurtindoId((postAtualId) =>
        postAtualId === postId ? null : postAtualId
      );
    }
  }

  async function comentarPost(
    postId: string,
    textoRecebido: string,
    comentarioPaiId = ""
  ) {
    const chaveAcao = `comentar-post:${postId}`;

    if (!iniciarAcaoComunidade(acoesComunidadeRef, chaveAcao)) {
      return false;
    }

    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return false;
      }

      const textoComentario = textoRecebido.trim();

      if (textoComentario.length < 1) {
        setErro("Escreva um comentário antes de enviar.");
        return false;
      }

      const autorNomeSeguro = await obterNomeSeguroUsuarioComunidade(usuario);
      const postAtual = posts.find((post) => post.id === postId) || null;
      const comentarioPaiIdLimpo = comentarioPaiId.trim();
      const comentarioPai = comentarioPaiIdLimpo
        ? postAtual?.comentarios.find(
            (comentario) => comentario.id === comentarioPaiIdLimpo
          ) || null
        : null;

      if (comentarioPaiIdLimpo && !comentarioPai) {
        setErro("O comentário respondido não foi encontrado.");
        return false;
      }

      const { data, error } = await supabase
        .from("comunidade_comentarios")
        .insert({
          post_id: postId,
          autor_id: usuario.id,
          autor_nome: autorNomeSeguro,
          texto: textoComentario.slice(0, 420),
          comentario_pai_id: comentarioPaiIdLimpo || null,
        })
        .select(
          "id, post_id, autor_id, autor_nome, texto, comentario_pai_id, criado_em"
        )
        .single();

      if (error || !data) {
        setErro(
          error
            ? formatarErroSupabase("Erro ao comentar", error)
            : "Erro ao comentar: o Supabase não retornou o comentário criado."
        );
        return false;
      }

      const profilesComentarioNovo = new Map<string, PerfilComunidadeRow>([
        [
          usuario.id,
          {
            nome: autorNomeSeguro,
            avatar_url: usuario.avatar,
          },
        ],
      ]);
      const novoComentario = mapearComentarioSupabase(
        data as SupabaseComentarioRow,
        new Map<string, string[]>(),
        profilesComentarioNovo,
        obterNomeProfileComunidade,
        obterAvatarProfileComunidade
      );

      if (!comentarioPaiIdLimpo && postAtual?.autorId) {
        await criarNotificacaoComunidadeSupabase({
          destinatarioId: postAtual.autorId,
          tipo: "comunidade-comentario-post",
          titulo: "Novo comentário na Comunidade",
          mensagem: `${autorNomeSeguro} comentou na sua publicação.`,
          link: `/comunidade?post=${encodeURIComponent(postId)}`,
          notificacaoId: `comunidade-comentario-post:${postId}:${novoComentario.id}`,
        }, idSupabaseValidoComunidade);
      }

      setPosts((postsAtuais) =>
        postsAtuais.map((post) =>
          post.id === postId
            ? {
                ...post,
                comentarios: [...post.comentarios, novoComentario],
              }
            : post
        )
      );

      emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef, "Comentário enviado.");
      return true;
    } finally {
      finalizarAcaoComunidade(acoesComunidadeRef, chaveAcao);
    }
  }

  function denunciarConteudo(
    alvoTipo: AlvoDenunciaComunidade,
    alvoId: string
  ) {
    if (!exigirLogin() || !usuario) {
      return;
    }

    const alvoIdLimpo = alvoId.trim();

    if (!alvoIdLimpo) {
      setErro("O conteúdo que você tentou denunciar é inválido.");
      return;
    }

    const alvoTitulo = obterTituloDenunciaComunidade(
      alvoTipo,
      alvoIdLimpo,
      posts
    );

    setErro("");
    setPostMenuAbertoId(null);
    setDenunciaAlvo({
      alvoTipo,
      alvoId: alvoIdLimpo,
      alvoTitulo,
    });
  }

  async function removerComentario(postId: string, comentarioId: string) {
    const chaveAcao = `remover-comentario:${comentarioId}`;

    if (!iniciarAcaoComunidade(acoesComunidadeRef, chaveAcao)) {
      return;
    }

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

      const comentariosDoPost =
        posts.find((post) => post.id === postId)?.comentarios || [];
      const comentarioAtual = comentariosDoPost.find(
        (comentario) => comentario.id === comentarioId
      );

      if (
        !comentarioAtual ||
        comentarioAtual.autorId.trim() !== usuarioAutenticadoId
      ) {
        setErro("Você só pode remover seus próprios comentários.");
        return;
      }

      const { data: comentarioBanco, error: comentarioBancoError } =
        await supabase
          .from("comunidade_comentarios")
          .select("id, post_id, autor_id")
          .eq("id", comentarioId)
          .maybeSingle();

      if (comentarioBancoError) {
        setErro(
          formatarErroSupabase(
            "Erro ao conferir comentário",
            comentarioBancoError
          )
        );
        return;
      }

      if (!comentarioBanco) {
        setPosts((postsAtuais) =>
          postsAtuais.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  comentarios: post.comentarios.filter(
                    (comentario) => comentario.id !== comentarioId
                  ),
                }
              : post
          )
        );
        setErro("Este comentário já não existe.");
        return;
      }

      if (comentarioBanco.autor_id !== usuarioAutenticadoId) {
        setErro("Você só pode remover seus próprios comentários.");
        return;
      }

      if (
        !window.confirm(
          traduzirTextoComunidade("Remover este comentário?", language)
        )
      ) {
        return;
      }

      const idsParaRemover = obterIdsComentarioComRespostasComunidade(
        comentariosDoPost,
        comentarioId
      );

      const { data: comentariosRemovidos, error } = await supabase
        .from("comunidade_comentarios")
        .delete()
        .eq("id", comentarioId)
        .eq("autor_id", usuarioAutenticadoId)
        .select("id");

      if (error) {
        setErro(formatarErroSupabase("Erro ao remover comentário", error));
        return;
      }

      if (!Array.isArray(comentariosRemovidos) || comentariosRemovidos.length === 0) {
        setErro(
          "O comentário não foi removido. A conta atual não possui permissão para essa ação."
        );
        await carregarPostsComunidadeDaPagina(false, 0, obraRelacionadaFiltro);
        return;
      }

      setPosts((postsAtuais) =>
        postsAtuais.map((post) =>
          post.id === postId
            ? {
                ...post,
                comentarios: post.comentarios.filter(
                  (comentario) => !idsParaRemover.has(comentario.id)
                ),
              }
            : post
        )
      );

      emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef, "Comentário removido.");
    } finally {
      finalizarAcaoComunidade(acoesComunidadeRef, chaveAcao);
    }
  }

  async function alternarCurtidaComentario(postId: string, comentarioId: string) {
    const chaveAcao = `curtir-comentario:${comentarioId}`;

    if (!iniciarAcaoComunidade(acoesComunidadeRef, chaveAcao)) {
      return;
    }

    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      const postAtual = posts.find((post) => post.id === postId);
      const comentarioAtual = postAtual?.comentarios.find(
        (comentario) => comentario.id === comentarioId
      );
      const jaCurtiu = Boolean(comentarioAtual?.curtidas.includes(usuario.id));

      const { error: erroLimparCurtida } = await supabase
        .from("comunidade_comentario_curtidas")
        .delete()
        .eq("comentario_id", comentarioId)
        .eq("usuario_id", usuario.id);

      if (erroLimparCurtida) {
        setErro(
          formatarErroSupabase(
            "Erro ao atualizar curtida do comentário",
            erroLimparCurtida
          )
        );
        return;
      }

      if (!jaCurtiu) {
        const { error: erroInserirCurtida } = await supabase
          .from("comunidade_comentario_curtidas")
          .insert({
            comentario_id: comentarioId,
            usuario_id: usuario.id,
          });

        if (erroInserirCurtida) {
          setErro(formatarErroSupabase("Erro ao curtir comentário", erroInserirCurtida));
          return;
        }

        if (comentarioAtual?.autorId) {
          await criarNotificacaoComunidadeSupabase({
            destinatarioId: comentarioAtual.autorId,
            tipo: "comunidade-curtida-comentario",
            titulo: "Nova curtida no seu comentário",
            mensagem: `${usuario.nome} curtiu seu comentário na Comunidade.`,
            link: `/comunidade?post=${encodeURIComponent(postId)}`,
            notificacaoId: `comunidade-curtida-comentario:${comentarioId}:${usuario.id}`,
          }, idSupabaseValidoComunidade);
        }
      }

      setPosts((postsAtuais) =>
        postsAtuais.map((post) => {
          if (post.id !== postId) {
            return post;
          }

          return {
            ...post,
            comentarios: post.comentarios.map((comentario) => {
              if (comentario.id !== comentarioId) {
                return comentario;
              }

              return {
                ...comentario,
                curtidas: jaCurtiu
                  ? comentario.curtidas.filter((curtidaId) => curtidaId !== usuario.id)
                  : Array.from(new Set([...comentario.curtidas, usuario.id])),
              };
            }),
          };
        })
      );

      emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef,
        jaCurtiu ? "Curtida do comentário removida." : "Comentário curtido."
      );
      await carregarPostsComunidadeDaPagina();
    } finally {
      finalizarAcaoComunidade(acoesComunidadeRef, chaveAcao);
    }
  }

  async function atualizarVisibilidadePost(
    post: PostComunidade,
    novaVisibilidade: VisibilidadePostComunidade,
  ) {
    const chaveAcao = `visibilidade-post:${post.id}`;

    if (!iniciarAcaoComunidade(acoesComunidadeRef, chaveAcao)) {
      return;
    }

    setPostVisibilidadeAtualizandoId(post.id);
    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      if (post.autorId.trim() !== usuario.id.trim()) {
        return;
      }

      const visibilidadeSegura = normalizarVisibilidadePostComunidade(
        novaVisibilidade,
      );

      if (post.visibilidade === visibilidadeSegura) {
        return;
      }

      const reviewPrecisaSerProtegidaAntes =
        post.tipoPublicacao === "Review" && visibilidadeSegura !== "publico";

      if (reviewPrecisaSerProtegidaAntes) {
        const reviewSincronizada = await registrarReviewComunidadeNoDiario({
          userId: usuario.id,
          texto: post.texto,
          obraRelacionada: post.obraRelacionada,
          postId: post.id,
          criadaEm: post.criadoEm,
          sugestoesObras: obrasRelacionadasSugestoes,
          visibilidade: visibilidadeSegura,
        });

        if (!reviewSincronizada) {
          setErro(
            "Não foi possível atualizar a privacidade da review no Diário.",
          );
          return;
        }
      }

      const { data, error } = await supabase
        .from("comunidade_posts")
        .update({ visibilidade: visibilidadeSegura })
        .eq("id", post.id)
        .eq("autor_id", usuario.id)
        .select("id, visibilidade")
        .maybeSingle();

      if (error || !data) {
        if (post.tipoPublicacao === "Review") {
          reviewsDiarioSincronizadasRef.current.delete(post.id);
        }

        setErro(
          error
            ? formatarErroSupabase("Erro ao atualizar visibilidade", error)
            : "Erro ao atualizar visibilidade: a publicação não foi retornada.",
        );
        return;
      }

      if (post.tipoPublicacao === "Review") {
        if (reviewPrecisaSerProtegidaAntes) {
          reviewsDiarioSincronizadasRef.current.add(post.id);
        } else {
          reviewsDiarioSincronizadasRef.current.delete(post.id);
        }
      }

      setPosts((postsAtuais) =>
        postsAtuais.map((postAtual) =>
          postAtual.id === post.id
            ? { ...postAtual, visibilidade: visibilidadeSegura }
            : postAtual,
        ),
      );
      setPostMenuAbertoId(null);
      emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef, "Visibilidade da publicação atualizada.");
    } finally {
      finalizarAcaoComunidade(acoesComunidadeRef, chaveAcao);
      setPostVisibilidadeAtualizandoId((postAtualId) =>
        postAtualId === post.id ? null : postAtualId,
      );
    }
  }

  async function alternarFixadoPost(post: PostComunidade) {
    if (!usuarioEhAdmin) {
      setErro("Apenas administradores podem fixar publicações.");
      return;
    }

    if (postFixandoId === post.id) {
      return;
    }

    setPostFixandoId(post.id);
    setErro("");

    try {
      const novoEstadoFixado = !post.fixado;

      const { data, error } = await supabase
        .from("comunidade_posts")
        .update({ fixado: novoEstadoFixado })
        .eq("id", post.id)
        .select("fixado, fixado_em, fixado_por")
        .single();

      if (error) {
        setErro(formatarErroSupabase("Erro ao atualizar fixado", error));
        return;
      }

      const dadosFixado = data as {
        fixado?: boolean | null;
        fixado_em?: string | null;
        fixado_por?: string | null;
      } | null;

      setPosts((postsAtuais) =>
        postsAtuais.map((postAtual) => {
          if (postAtual.id !== post.id) {
            return postAtual;
          }

          return {
            ...postAtual,
            fixado: Boolean(dadosFixado?.fixado),
            fixadoEm: dadosFixado?.fixado_em || "",
            fixadoPor: dadosFixado?.fixado_por || "",
          };
        })
      );

      emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef,
        novoEstadoFixado
          ? "Publicação fixada no topo."
          : "Publicação desafixada."
      );
    } finally {
      setPostFixandoId((postAtualId) =>
        postAtualId === post.id ? null : postAtualId
      );
    }
  }

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

      let usuarioAtualEhAdmin = false;

      try {
        const { data: adminData, error: adminError } = await supabase.rpc(
          "usuario_e_admin"
        );

        usuarioAtualEhAdmin = !adminError && adminData === true;
      } catch {
        usuarioAtualEhAdmin = false;
      }

      const { data: postBanco, error: postBancoError } = await supabase
        .from("comunidade_posts")
        .select("id, autor_id, tipo_publicacao")
        .eq("id", postId)
        .maybeSingle();

      if (postBancoError) {
        setErro(
          formatarErroSupabase(
            "Erro ao conferir publicação",
            postBancoError
          )
        );
        return;
      }

      if (!postBanco) {
        setPosts((postsAtuais) =>
          postsAtuais.filter((post) => post.id !== postId)
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

      let removerPostQuery = supabase
        .from("comunidade_posts")
        .delete()
        .eq("id", postId);

      if (!usuarioAtualEhAdmin) {
        removerPostQuery = removerPostQuery.eq(
          "autor_id",
          usuarioAutenticadoId
        );
      }

      const { data: postsRemovidos, error } = await removerPostQuery.select(
        "id, autor_id, tipo_publicacao"
      );

      if (error) {
        setErro(formatarErroSupabase("Erro ao remover publicação", error));
        return;
      }

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
        postsAtuais.filter((post) => post.id !== postId)
      );

      const postsSalvosAtualizados = postsSalvosIds.filter(
        (postSalvoId) => postSalvoId !== postId
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
          <CommunityDesktopHeader>
            <CommunityDesktopTitle>Comunidade</CommunityDesktopTitle>

            <CommunityDesktopHeaderActions>
              <CommunityDesktopSearchContainer>
                <CommunityDesktopSearchIcon />

                <CommunityDesktopSearchInput
                  value={termoBusca}
                  onChange={(event) => setTermoBusca(event.target.value)}
                />
              </CommunityDesktopSearchContainer>

              <CommunityDesktopFilterButton
                onClick={() =>
                  setMenuAcoesRapidasComunidadeAberto((aberto) => !aberto)
                }
                expanded={menuAcoesRapidasComunidadeAberto}
              />

            </CommunityDesktopHeaderActions>
          </CommunityDesktopHeader>
        ) : null}

        <CommunityMainLayout isDesktop={isDesktop}>
          <CommunityFeedColumn isDesktop={isDesktop}>
            {usuario && erro && !composerAberto && (
              <CommunityFeedErrorNotice>{erro}</CommunityFeedErrorNotice>
            )}

            <CommunityFeedFiltersContainer isDesktop={isDesktop}>
              <CommunityFilterControlsRow>
                <CommunityAdvancedFiltersButton
                  type="button"
                  aria-label="Abrir filtros, ordenação e ações da comunidade"
                  aria-expanded={menuAcoesRapidasComunidadeAberto}
                  onClick={() =>
                    setMenuAcoesRapidasComunidadeAberto((aberto) => !aberto)
                  }
                >
                  <span>{textoBotaoFiltrosAvancadosComunidade}</span>
                  <CommunityAdvancedFiltersIcon>
                    +
                  </CommunityAdvancedFiltersIcon>
                </CommunityAdvancedFiltersButton>

                {buscaComunidadeAberta || Boolean(termoBusca.trim()) ? (
                  <>
                    <CommunitySearchContainer>
                      <CommunitySearchInput
                        aria-label="Buscar publicações ou usuários"
                        value={termoBusca}
                        onChange={(event) => setTermoBusca(event.target.value)}
                        placeholder="Buscar publicações ou usuários"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        maxLength={90}
                        autoFocus
                      />
                    </CommunitySearchContainer>

                    <CommunitySearchToggleButton
                      type="button"
                      onClick={() => {
                        setTermoBusca("");
                        setBuscaComunidadeAberta(false);
                      }}
                      aria-label="Fechar busca"
                      aria-expanded="true"
                    >
                      <CommunitySearchIcon />
                    </CommunitySearchToggleButton>
                  </>
                ) : (
                  <CommunitySearchToggleButton
                    type="button"
                    onClick={() => setBuscaComunidadeAberta(true)}
                    aria-label="Abrir busca"
                    aria-expanded="false"
                  >
                    <CommunitySearchIcon />
                  </CommunitySearchToggleButton>
                )}
              </CommunityFilterControlsRow>

            </CommunityFeedFiltersContainer>

            <CommunityFeedTabsContainer isDesktop={isDesktop}>
              {ABAS_FEED_COMUNIDADE.map((aba) => {
                const ativa = abaFeedAtiva === aba;

                return (
                  <CommunityFeedTabButton
                    key={aba}
                    active={ativa}
                    onClick={() =>
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
                  >
                    {aba}
                  </CommunityFeedTabButton>
                );
              })}
            </CommunityFeedTabsContainer>

            {menuAcoesRapidasComunidadeAberto && (
              <CommunitySheetOverlay
                ariaLabel="Filtros, ordenação e ações da comunidade"
                closeAriaLabel="Fechar filtros e ações da comunidade"
                onClose={() => setMenuAcoesRapidasComunidadeAberto(false)}
              >
                <CommunitySheetSurface>
                  <CommunitySheetHandle />

                  <CommunitySheetTitle>
                    Filtrar e ordenar
                  </CommunitySheetTitle>

                  <CommunitySheetSectionLabel>
                    Ações
                  </CommunitySheetSectionLabel>

                  <CommunitySheetPrimaryAction
                    onClick={() =>
                      abrirPublicacaoRapidaComunidade({
                        carregandoUsuario,
                        garantirAceiteAntesDePublicarComunidade,
                        setMenuAcoesRapidasComunidadeAberto,
                        setErro,
                        setComposerAberto,
                      })
                    }
                  >
                    Publicar
                  </CommunitySheetPrimaryAction>

                  <CommunitySheetSectionLabel>
                    Mostrar
                  </CommunitySheetSectionLabel>

                  <CommunitySheetFilterOption
                    active={!filtrosAtivos}
                    onClick={() => {
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
                  >
                    Todas
                  </CommunitySheetFilterOption>

                  <CommunitySheetFilterOption
                    active={mostrarApenasSalvos}
                    onClick={() => {
                      setMostrarApenasSalvos(true);
                      setMenuAcoesRapidasComunidadeAberto(false);
                    }}
                  >
                    Posts salvos
                  </CommunitySheetFilterOption>

                  <CommunitySheetSectionLabel>
                    Ordenar
                  </CommunitySheetSectionLabel>

                  <CommunitySheetFilterOption
                    active={
                      ordenacaoAtiva === "Recentes" && !mostrarApenasSalvos
                    }
                    onClick={() => {
                      setOrdenacaoAtiva("Recentes");
                      setMostrarApenasSalvos(false);
                      setMenuAcoesRapidasComunidadeAberto(false);
                    }}
                  >
                    Recentes
                  </CommunitySheetFilterOption>

                  <CommunitySheetFilterOption
                    active={
                      ordenacaoAtiva === "Em alta" && !mostrarApenasSalvos
                    }
                    onClick={() => {
                      setOrdenacaoAtiva("Em alta");
                      setMostrarApenasSalvos(false);
                      setMenuAcoesRapidasComunidadeAberto(false);
                    }}
                  >
                    Em alta
                  </CommunitySheetFilterOption>

                  <CommunitySheetFilterOption
                    active={
                      ordenacaoAtiva === "Mais comentadas" && !mostrarApenasSalvos
                    }
                    onClick={() => {
                      setOrdenacaoAtiva("Mais comentadas");
                      setMostrarApenasSalvos(false);
                      setMenuAcoesRapidasComunidadeAberto(false);
                    }}
                  >
                    Mais comentadas
                  </CommunitySheetFilterOption>

                </CommunitySheetSurface>
              </CommunitySheetOverlay>
            )}

            {termoBuscaNormalizado ? (
              <CommunityUserSearchSection ariaLabel="Usuários encontrados">
                <CommunitySearchResultsHeader>
                  <CommunitySearchResultsTitle>
                    Usuários
                  </CommunitySearchResultsTitle>
                  <CommunitySearchResultsCount>
                    {carregandoUsuariosBuscaComunidade
                      ? traduzirTextoComunidade("Buscando...", language)
                      : traduzirContagemResultadosComunidade(
                          usuariosBuscaComunidade.length,
                          "usuarios",
                          language
                        )}
                  </CommunitySearchResultsCount>
                </CommunitySearchResultsHeader>

                {normalizarTermoBuscaUsuariosComunidade(termoBusca).length < 2 ? (
                  <CommunitySearchResultsEmpty>
                    Digite pelo menos 2 caracteres para encontrar usuários.
                  </CommunitySearchResultsEmpty>
                ) : carregandoUsuariosBuscaComunidade ? (
                  <CommunityUserSearchLoading>
                    <CommunityLoadingSpinner
                      compacto
                      label="Buscando usuários"
                    />
                  </CommunityUserSearchLoading>
                ) : usuariosBuscaComunidade.length > 0 ? (
                  <CommunityUserSearchList>
                    {usuariosBuscaComunidade.map((usuarioBusca) => {
                      const ehUsuarioAtual = usuario?.id === usuarioBusca.id;
                      const seguindoUsuario = usuariosSeguidosIds.includes(
                        usuarioBusca.id
                      );
                      const atualizandoSeguindo =
                        usuarioSeguindoId === usuarioBusca.id;

                      return (
                        <CommunityUserSearchCard key={usuarioBusca.id}>
                          <CommunityUserSearchAvatar
                            href={criarPerfilHrefComunidade(
                              usuarioBusca.id,
                              usuarioBusca.nome
                            )}
                            ariaLabel={`Abrir perfil de ${usuarioBusca.nome}`}
                            avatar={usuarioBusca.avatar}
                          >
                            {!usuarioBusca.avatar &&
                              (usuarioBusca.nome.slice(0, 1).toUpperCase() ||
                                "U")}
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
                              {usuarioBusca.username
                                ? `@${usuarioBusca.username}`
                                : "Perfil da comunidade"}
                            </CommunityUserSearchUsername>
                          </CommunityUserSearchInfo>

                          {ehUsuarioAtual ? (
                            <CommunityUserSearchSelfBadge>
                              Você
                            </CommunityUserSearchSelfBadge>
                          ) : (
                            <CommunityUserSearchFollowButton
                              onClick={() =>
                                alternarSeguirUsuarioBusca(usuarioBusca)
                              }
                              disabled={atualizandoSeguindo}
                              following={seguindoUsuario}
                            >
                              {atualizandoSeguindo
                                ? "..."
                                : seguindoUsuario
                                  ? "Seguindo"
                                  : "Seguir"}
                            </CommunityUserSearchFollowButton>
                          )}
                        </CommunityUserSearchCard>
                      );
                    })}
                  </CommunityUserSearchList>
                ) : (
                  <CommunitySearchResultsEmpty>
                    Nenhum usuário encontrado.
                  </CommunitySearchResultsEmpty>
                )}
              </CommunityUserSearchSection>
            ) : null}

            {termoBuscaNormalizado ? (
              <CommunitySearchResultsHeader>
                <CommunitySearchResultsTitle>
                  Publicações
                </CommunitySearchResultsTitle>
                <CommunitySearchResultsCount>
                  {traduzirContagemResultadosComunidade(
                    postsVisiveis.length,
                    "publicacoes",
                    language
                  )}
                </CommunitySearchResultsCount>
              </CommunitySearchResultsHeader>
            ) : null}

            <CommunityPostsList isDesktop={isDesktop}>
              {!carregandoFeed && (
                postsVisiveis.length > 0 ? (
                postsVisiveis.map((post) => {
                  const usuarioCurtiu = Boolean(
                    usuario && post.curtidas.includes(usuario.id)
                  );
                  const postSalvo = postsSalvosIds.includes(post.id);
                  const usuarioAtualId = usuario?.id.trim() || "";
                  const autorPostId = post.autorId.trim();
                  const podeRemover = Boolean(
                    !carregandoUsuario &&
                      usuarioAtualId &&
                      (autorPostId === usuarioAtualId || usuarioEhAdmin)
                  );
                  const podeDenunciarPost = Boolean(
                    !carregandoUsuario &&
                      usuarioAtualId &&
                      autorPostId !== usuarioAtualId
                  );
                  const postCurtindo = postCurtindoId === post.id;
                  const postSalvando = postSalvandoId === post.id;
                  const postCompartilhando = postCompartilhandoId === post.id;
                  const postRemovendo = postRemovendoId === post.id;
                  const postFixando = postFixandoId === post.id;
                  const postVisibilidadeAtualizando =
                    postVisibilidadeAtualizandoId === post.id;
                  const podeAlterarVisibilidade = Boolean(
                    !carregandoUsuario &&
                      usuarioAtualId &&
                      autorPostId === usuarioAtualId
                  );
                  const postDenunciando = Boolean(
                    denunciaAlvo?.alvoTipo === "post" &&
                      denunciaAlvo.alvoId === post.id
                  );
                  const spoilerRevelado = spoilersReveladosIds.includes(post.id);
                  const ocultarTextoSpoiler = post.temSpoiler && !spoilerRevelado;
                  const obraRelacionadaPermitida = obterObraRelacionadaPermitida(
                    post.obraRelacionada,
                    obrasRelacionadasSugestoes
                  );
                  const opcoesPublicacao = (
                    <CommunityPostOptionsContainer>
                      <CommunityPostOptionsButton
                        type="button"
                        aria-label="Abrir opções da publicação"
                        aria-haspopup="menu"
                        aria-expanded={postMenuAbertoId === post.id}
                        onClick={() =>
                          setPostMenuAbertoId((postIdAtual) =>
                            postIdAtual === post.id ? null : post.id
                          )
                        }
                        menuOpen={Boolean(postMenuAbertoId)}
                      >
                        ⋮
                      </CommunityPostOptionsButton>

                      {postMenuAbertoId === post.id && typeof document !== "undefined"
                        ? createPortal(
                        <CommunitySheetOverlay
                          ariaLabel="Ações da publicação"
                          closeAriaLabel="Fechar ações da publicação"
                          onClose={() => setPostMenuAbertoId(null)}
                        >
                          <CommunitySheetSurface role="menu">
                            <CommunitySheetHandle />

                            <CommunitySheetTitle>
                              Ações da publicação
                            </CommunitySheetTitle>

                            <CommunitySheetMenuAction
                              onClick={() => {
                                setPostMenuAbertoId(null);
                                alternarPostSalvo({
                                  postId: post.id,
                                  acoesComunidadeRef,
                                  setErro,
                                  exigirLogin,
                                  usuario,
                                  setPostSalvandoId,
                                  postsSalvosIds,
                                  setPostsSalvosIds,
                                  setFeedbackAcao,
                                  feedbackTimerRef,
                                });
                              }}
                              disabled={postSalvando}
                            >
                              {postSalvando
                                ? "Salvando..."
                                : postSalvo
                                  ? "Remover dos salvos"
                                  : "Salvar publicação"}
                            </CommunitySheetMenuAction>

                            <CommunitySheetMenuAction
                              onClick={() => {
                                setPostMenuAbertoId(null);
                                compartilharPublicacao({
                                  post,
                                  acoesComunidadeRef,
                                  setPostCompartilhandoId,
                                  setFeedbackAcao,
                                  feedbackTimerRef,
                                  setErro,
                                });
                              }}
                              disabled={postCompartilhando}
                            >
                              {postCompartilhando ? "Compartilhando..." : "Compartilhar"}
                            </CommunitySheetMenuAction>

                            {podeAlterarVisibilidade && (
                              <CommunitySheetVisibilityMenu>
                                <CommunitySheetVisibilityTitle>
                                  Quem pode ver esta publicação?
                                </CommunitySheetVisibilityTitle>

                                {VISIBILIDADES_POST_COMUNIDADE.map((opcao) => {
                                  const ativa = post.visibilidade === opcao.valor;

                                  return (
                                    <CommunitySheetVisibilityOption
                                      key={`${post.id}-visibilidade-${opcao.valor}`}
                                      active={ativa}
                                      onClick={() =>
                                        void atualizarVisibilidadePost(
                                          post,
                                          opcao.valor,
                                        )
                                      }
                                      disabled={postVisibilidadeAtualizando}
                                    >
                                      {opcao.rotulo}
                                    </CommunitySheetVisibilityOption>
                                  );
                                })}
                              </CommunitySheetVisibilityMenu>
                            )}

                            {usuarioEhAdmin && (
                              <CommunitySheetMenuAction
                                onClick={() => {
                                  setPostMenuAbertoId(null);
                                  alternarFixadoPost(post);
                                }}
                                disabled={postFixando}
                              >
                                {postFixando
                                  ? "Atualizando..."
                                  : post.fixado
                                    ? "Desfixar publicação"
                                    : "Fixar publicação"}
                              </CommunitySheetMenuAction>
                            )}

                            {podeRemover && (
                              <CommunitySheetDangerAction
                                onClick={() => {
                                  setPostMenuAbertoId(null);
                                  removerPost(post.id);
                                }}
                                disabled={postRemovendo}
                              >
                                {postRemovendo ? "Removendo..." : "Remover publicação"}
                              </CommunitySheetDangerAction>
                            )}

                            {podeDenunciarPost && (
                              <CommunitySheetDangerAction
                                onClick={() => {
                                  setPostMenuAbertoId(null);
                                  denunciarConteudo("post", post.id);
                                }}
                                disabled={postDenunciando}
                              >
                                {postDenunciando ? "Enviando..." : "Denunciar"}
                              </CommunitySheetDangerAction>
                            )}
                          </CommunitySheetSurface>
                        </CommunitySheetOverlay>,
                            document.body
                          )
                        : null}
                    </CommunityPostOptionsContainer>
                  );

                  return (
                    <CommunityPostCard key={post.id} isDesktop={isDesktop}>
                      <CommunityPostHeader>
                        <CommunityPostAuthorAvatar
                          href={criarPerfilHrefComunidade(
                            post.autorId,
                            post.autorNome
                          )}
                          ariaLabel={`Abrir perfil de ${post.autorNome}`}
                          avatar={post.autorAvatar}
                        >
                          {!post.autorAvatar && post.autorNome.slice(0, 1).toUpperCase()}
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

                        {opcoesPublicacao}
                      </CommunityPostHeader>

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

                        <CommunityPostTypeBadge
                          isPoll={postEhEnquete(post)}
                        >
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
                            <CommunityPollBox>
                              <CommunityPollOptions>
                                {obterOpcoesEnquete(post.texto).map((opcao) => {
                                  const votoAtual = votosEnquetes[post.id] || "";
                                  const selecionada = votoAtual === opcao;
                                  const usuarioVotouNaEnquete = Boolean(votoAtual);
                                  const totalVotos = usuarioVotouNaEnquete
                                    ? calcularTotalVotosEnquete(
                                        resultadosEnquetes,
                                        post.id
                                      )
                                    : 0;
                                  const porcentagem = usuarioVotouNaEnquete
                                    ? calcularPorcentagemOpcaoEnquete(
                                        resultadosEnquetes,
                                        post.id,
                                        opcao
                                      )
                                    : 0;
                                  const larguraResultado =
                                    usuarioVotouNaEnquete && totalVotos > 0
                                      ? `${porcentagem}%`
                                      : usuarioVotouNaEnquete && selecionada
                                        ? "100%"
                                        : "0%";

                                  return (
                                    <CommunityPollOptionButton
                                      key={opcao}
                                      onClick={() =>
                                        votarEnquete({
                                          postId: post.id,
                                          opcao,
                                          votandoEnqueteId,
                                          votosEnquetes,
                                          exigirLogin,
                                          usuario,
                                          setVotandoEnqueteId,
                                          setErro,
                                          setFeedbackAcao,
                                          feedbackTimerRef,
                                          setResultadosEnquetes,
                                          setVotosEnquetes,
                                        })
                                      }
                                      disabled={Boolean(votoAtual) || votandoEnqueteId === post.id}
                                      selected={selecionada}
                                    >
                                      <CommunityPollResultBar
                                        width={larguraResultado}
                                        visible={usuarioVotouNaEnquete}
                                      />

                                      <CommunityPollOptionText
                                        selected={selecionada}
                                      >
                                        {opcao}
                                      </CommunityPollOptionText>

                                      <CommunityPollOptionStatus
                                        selected={selecionada}
                                      >
                                        {usuarioVotouNaEnquete
                                          ? selecionada
                                            ? `${totalVotos > 0 ? porcentagem : 100}%`
                                            : `${porcentagem}%`
                                          : votandoEnqueteId === post.id
                                            ? "..."
                                            : "Votar"}
                                      </CommunityPollOptionStatus>
                                    </CommunityPollOptionButton>
                                  );
                                })}
                              </CommunityPollOptions>
                            </CommunityPollBox>
                          ) : (
                            <CommunityPostText>{post.texto}</CommunityPostText>
                          )}
                        </>
                      )}

                      <CommunityPostActions desktop={isDesktop}>
                        <CommunityPostLikeButton
                          onClick={() => alternarCurtida(post.id)}
                          disabled={postCurtindo}
                          liked={usuarioCurtiu}
                          count={contarCurtidasUnicasPostComunidade(post)}
                          ariaLabel={`${usuarioCurtiu
                              ? "Remover curtida da publicação"
                              : "Curtir publicação"
                          }. ${contarCurtidasUnicasPostComunidade(post)} ${contarCurtidasUnicasPostComunidade(post) === 1
                              ? "curtida"
                              : "curtidas"
                          }`}
                        />

                        <CommunityPostCommentsButton
                          onClick={() =>
                            abrirComentarios({
                              postId: post.id,
                              setErro,
                              comentarioUrlAplicadoRef,
                              setComentariosPostId,
                            })
                          }
                          count={contarComentaristasUnicosPostComunidade(post)}
                          ariaLabel={`${contarComentaristasUnicosPostComunidade(post)} comentários`}
                        />

                        {post.temSpoiler && (
                          <CommunityPostSpoilerButton
                            onClick={() =>
                              alternarSpoilerRevelado({
                                postId: post.id,
                                setSpoilersReveladosIds,
                              })
                            }
                          >
                            {ocultarTextoSpoiler ? "REVELAR" : "OCULTAR"}
                          </CommunityPostSpoilerButton>
                        )}
                      </CommunityPostActions>
                    </CommunityPostCard>
                  );
                })
              ) : (
                <CommunityFeedEmptyMessage desktop={isDesktop}>
                  {abaFeedAtiva === "Seguindo"
                    ? usuario
                      ? "Nenhuma publicação de pessoas que você segue."
                      : "Entre na sua conta para ver publicações de quem você segue."
                    : mostrarApenasSalvos
                      ? "Nenhuma publicação salva"
                      : filtrosAtivos
                        ? "Nenhuma publicação encontrada"
                        : "Nenhuma publicação ainda"}
                </CommunityFeedEmptyMessage>
              )
              )}
            </CommunityPostsList>

            {!carregandoFeed && postsVisiveis.length > 0 && temMaisPostsComunidade && (
              <CommunityLoadMorePostsContainer>
                <CommunityLoadMorePostsButton
                  onClick={() =>
                    carregarMaisPostsComunidade({
                      carregandoFeed,
                      carregandoMaisPostsComunidade,
                      temMaisPostsComunidade,
                      paginaFeedComunidade,
                      carregarPostsComunidadeDaPagina,
                    })
                  }
                  disabled={carregandoMaisPostsComunidade}
                >
                  {carregandoMaisPostsComunidade ? (
                    <CommunityLoadingSpinner
                      compacto
                      label="Carregando mais publicações"
                    />
                  ) : (
                    "Carregar mais publicações"
                  )}
                </CommunityLoadMorePostsButton>
              </CommunityLoadMorePostsContainer>
            )}

          </CommunityFeedColumn>

        </CommunityMainLayout>
      </CommunityContentContainer>

      {composerAberto && usuario && typeof document !== "undefined"
        ? createPortal(
            <CommunityPostComposerOverlay>
          <CommunityPostComposerBackdrop
            onClick={() => {
              if (!publicandoPost) {
                setErro("");
                setComposerAberto(false);
              }
            }}
          />

          <CommunityPostComposerPanel desktop={isDesktop}>
            <CommunitySheetHandle />

            <CommunityPostComposerHeader>
              Nova publicação
            </CommunityPostComposerHeader>

            <CommunityPostComposerForm onSubmit={publicarPost}>
              <CommunityPostComposerFields desktop={isDesktop}>
                <CommunityPostComposerField>
                  <CommunityPostComposerFieldLabel>Categoria</CommunityPostComposerFieldLabel>

                  <CommunityPostComposerSelect
                    disabled={publicandoPost}
                    value={categoriaPost}
                    onChange={(event) =>
                      setCategoriaPost(event.target.value as CategoriaComunidade)
                    }
                  >
                    {CATEGORIAS_COMUNIDADE.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </CommunityPostComposerSelect>
                </CommunityPostComposerField>

                <CommunityPostComposerField>
                  <CommunityPostComposerFieldLabel>Tipo</CommunityPostComposerFieldLabel>

                  <CommunityPostComposerSelect
                    disabled={publicandoPost}
                    value={tipoPublicacaoPost}
                    onChange={(event) =>
                      selecionarTipoPublicacaoPost({
                        tipo: event.target.value as TipoPublicacaoComunidade,
                        setTipoPublicacaoPost,
                        textoPostRef,
                      })
                    }
                  >
                    {TIPOS_PUBLICACAO_COMUNIDADE.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </CommunityPostComposerSelect>
                </CommunityPostComposerField>

                <CommunityPostComposerField>
                  <CommunityPostComposerFieldLabel>Quem pode ver esta publicação?</CommunityPostComposerFieldLabel>

                  <CommunityPostComposerSelect
                    disabled={publicandoPost}
                    value={visibilidadePost}
                    onChange={(event) =>
                      setVisibilidadePost(
                        normalizarVisibilidadePostComunidade(event.target.value),
                      )
                    }
                  >
                    {VISIBILIDADES_POST_COMUNIDADE.map((opcao) => (
                      <option key={opcao.valor} value={opcao.valor}>
                        {opcao.rotulo}
                      </option>
                    ))}
                  </CommunityPostComposerSelect>
                </CommunityPostComposerField>

                <CommunityPostComposerField>
                  <CommunityPostComposerFieldLabel>Obra relacionada</CommunityPostComposerFieldLabel>

                  <CommunityPostComposerRelatedWorkSearch>
                    <CommunityPostComposerInput
                      ref={obraRelacionadaRef}
                      disabled={publicandoPost}
                      value={obraRelacionadaBusca}
                      onChange={(event) => {
                        const valorDigitado = event.target.value;

                        setObraRelacionadaBusca(valorDigitado);

                        if (!valorDigitado.trim()) {
                          setCapituloRelacionadoPost("");
                        }

                        setSugestoesObrasAbertas(Boolean(valorDigitado.trim()));
                      }}
                      onFocus={() => {
                        setSugestoesObrasAbertas(
                          Boolean(obraRelacionadaBusca.trim())
                        );
                      }}
                      onBlur={() => {
                        window.setTimeout(() => {
                          setSugestoesObrasAbertas(false);
                        }, 120);
                      }}
                      placeholder="Opcional: nome da obra"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      maxLength={90}
                    />

                    {sugestoesObrasAbertas &&
                      sugestoesObrasRelacionadasVisiveis.length > 0 && (
                        <CommunityPostComposerRelatedWorkSuggestions>
                          {sugestoesObrasRelacionadasVisiveis.map((obra) => (
                            <CommunityPostComposerRelatedWorkSuggestionButton
                              key={obra.id}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                selecionarObraRelacionada({
                                  titulo: obra.titulo,
                                  setObraRelacionadaBusca,
                                  setSugestoesObrasAbertas,
                                  obraRelacionadaRef,
                                });
                              }}
                            >
                              <CommunityPostComposerRelatedWorkSuggestionContent>
                                <CommunityPostComposerRelatedWorkSuggestionTitle>
                                  {obra.titulo}
                                </CommunityPostComposerRelatedWorkSuggestionTitle>

                                <CommunityPostComposerRelatedWorkSuggestionAuthor>
                                  {obra.autor}
                                </CommunityPostComposerRelatedWorkSuggestionAuthor>
                              </CommunityPostComposerRelatedWorkSuggestionContent>

                              <CommunityPostComposerRelatedWorkSuggestionBadge>
                                OBRA
                              </CommunityPostComposerRelatedWorkSuggestionBadge>
                            </CommunityPostComposerRelatedWorkSuggestionButton>
                          ))}
                        </CommunityPostComposerRelatedWorkSuggestions>
                      )}
                  </CommunityPostComposerRelatedWorkSearch>
                </CommunityPostComposerField>

                <CommunityPostComposerField>
                  <CommunityPostComposerFieldLabel>Capítulo relacionado</CommunityPostComposerFieldLabel>

                  <CommunityPostComposerInput
                    disabled={publicandoPost || !obraRelacionadaBusca.trim()}
                    value={capituloRelacionadoPost}
                    onChange={(event) =>
                      setCapituloRelacionadoPost(event.target.value)
                    }
                    placeholder="Opcional: número ou título do capítulo"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={60}
                    style={getCommunityPostComposerRelatedChapterInputStyle(
                      Boolean(obraRelacionadaBusca.trim()),
                    )}
                  />
                </CommunityPostComposerField>
              </CommunityPostComposerFields>

              <CommunityPostComposerField>
                <CommunityPostComposerPublicationHeader>
                  <CommunityPostComposerFieldLabel>Publicação</CommunityPostComposerFieldLabel>

                  <CommunityPostComposerPublicationTools>
                    <CommunityPostComposerPollTemplateButton
                      disabled={publicandoPost}
                      onClick={() =>
                        prepararEnqueteComunidade({
                          garantirAceiteAntesDePublicarComunidade,
                          setErro,
                          setCategoriaPost,
                          setTipoPublicacaoPost,
                          setTemSpoilerPost,
                          setComposerAberto,
                          textoPostRef,
                        })
                      }
                    >
                      Modelo de enquete
                    </CommunityPostComposerPollTemplateButton>

                    <CommunityPostComposerCharacterCount>
                      máx. 700
                    </CommunityPostComposerCharacterCount>
                  </CommunityPostComposerPublicationTools>
                </CommunityPostComposerPublicationHeader>

                <CommunityPostComposerSuggestionsSection>
                  <CommunityPostComposerSuggestionsLabel>
                    Sugestões para começar
                  </CommunityPostComposerSuggestionsLabel>

                  <CommunityPostComposerSuggestionsList>
                    {SUGESTOES_PUBLICACAO_COMUNIDADE.map((sugestao) => (
                      <CommunityPostComposerSuggestionButton
                        key={sugestao.rotulo}
                        disabled={publicandoPost}
                        onClick={() =>
                          aplicarSugestaoPublicacaoComunidade({
                            sugestao,
                            publicandoPost,
                            setErro,
                            setCategoriaPost,
                            setTipoPublicacaoPost,
                            textoPostRef,
                            language,
                          })
                        }
                      >
                        {sugestao.rotulo}
                      </CommunityPostComposerSuggestionButton>
                    ))}
                  </CommunityPostComposerSuggestionsList>
                </CommunityPostComposerSuggestionsSection>

                <CommunityPostComposerTextarea
                  ref={textoPostRef}
                  disabled={publicandoPost}
                />
              </CommunityPostComposerField>

              {erro && (
                <CommunityPostComposerErrorMessage>
                  {erro}
                </CommunityPostComposerErrorMessage>
              )}

              <CommunityPostComposerActionRow>
                <CommunityPostComposerSpoilerButton
                  active={temSpoilerPost}
                  disabled={publicandoPost}
                  onClick={() => setTemSpoilerPost((valorAtual) => !valorAtual)}
                >
                  <CommunityPostComposerSpoilerLabel>
                    Este post contém spoiler
                  </CommunityPostComposerSpoilerLabel>

                  <CommunityPostComposerSpoilerIndicator
                    active={temSpoilerPost}
                  >
                    {temSpoilerPost ? "✓" : ""}
                  </CommunityPostComposerSpoilerIndicator>
                </CommunityPostComposerSpoilerButton>

                <CommunityPostComposerPublishButton
                  disabled={publicandoPost}
                >
                  {publicandoPost ? "Publicando..." : "Publicar"}
                </CommunityPostComposerPublishButton>
              </CommunityPostComposerActionRow>
            </CommunityPostComposerForm>
          </CommunityPostComposerPanel>
            </CommunityPostComposerOverlay>,
            document.body
          )
        : null}

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



















































































































































