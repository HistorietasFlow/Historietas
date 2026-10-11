"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { criarSlugBase } from "../../lib/utils";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { useNotificacoes } from "../../components/NotificacoesProvider";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import DenunciaModal from "../../components/DenunciaModal";
import {
  type EstadoBloqueioPerfil,
  type EstadoRelacionamentoPerfil,
  type PermissoesAbasPerfil,
} from "../../lib/historietasPrivacy";
import { Suspense, useMemo, useRef, useState } from "react";
import { usePerfilAutorDesktopMode } from "./hooks/use-perfil-autor-desktop-mode";
import { usePerfilAutorActionMessage } from "./hooks/use-perfil-autor-action-message";
import { usePerfilAutorTabNavigation } from "./hooks/use-perfil-autor-tab-navigation";
import { usePerfilAutorSessionActions } from "./hooks/use-perfil-autor-session-actions";
import { usePerfilAutorAuthIdentitySync } from "./hooks/use-perfil-autor-auth-identity-sync";
import { usePerfilAutorProfileLoadSync } from "./hooks/use-perfil-autor-profile-load-sync";
import { usePerfilAutorLoginRedirect } from "./hooks/use-perfil-autor-login-redirect";
import { usePerfilAutorLibraryStorageActions } from "./hooks/use-perfil-autor-library-storage-actions";
import { usePerfilAutorAvatarEditorActions } from "./hooks/use-perfil-autor-avatar-editor-actions";
import { usePerfilAutorShareActions } from "./hooks/use-perfil-autor-share-actions";
import { usePerfilAutorReportActions } from "./hooks/use-perfil-autor-report-actions";
import { usePerfilAutorAboutActions } from "./hooks/use-perfil-autor-about-actions";
import { usePerfilAutorProfileEditorActions } from "./hooks/use-perfil-autor-profile-editor-actions";
import { usePerfilAutorLibraryCollectionActions } from "./hooks/use-perfil-autor-library-collection-actions";
import { usePerfilAutorRatingActions } from "./hooks/use-perfil-autor-rating-actions";
import { usePerfilAutorRatingSync } from "./hooks/use-perfil-autor-rating-sync";
import { usePerfilAutorDiaryRatingActions } from "./hooks/use-perfil-autor-diary-rating-actions";
import { usePerfilAutorDiaryRatingSync } from "./hooks/use-perfil-autor-diary-rating-sync";
import { usePerfilAutorDiarySync } from "./hooks/use-perfil-autor-diary-sync";
import { usePerfilAutorBlockActions } from "./hooks/use-perfil-autor-block-actions";
import { usePerfilAutorFollowActions } from "./hooks/use-perfil-autor-follow-actions";
import { usePerfilAutorTopFiveLikeActions } from "./hooks/use-perfil-autor-top-five-like-actions";
import { usePerfilAutorTopFiveStorageSync } from "./hooks/use-perfil-autor-top-five-storage-sync";
import { usePerfilAutorTopFiveLikesSync } from "./hooks/use-perfil-autor-top-five-likes-sync";
import { usePerfilAutorPrivacySync } from "./hooks/use-perfil-autor-privacy-sync";
import { usePerfilAutorVisibleTabSync } from "./hooks/use-perfil-autor-visible-tab-sync";
import { usePerfilAutorCommunitySync } from "./hooks/use-perfil-autor-community-sync";
import { usePerfilAutorBlockStateSync } from "./hooks/use-perfil-autor-block-state-sync";
import { usePerfilAutorFollowStateSync } from "./hooks/use-perfil-autor-follow-state-sync";
import { usePerfilAutorInteractionTotalsSync } from "./hooks/use-perfil-autor-interaction-totals-sync";
import { usePerfilAutorNotificationCountSync } from "./hooks/use-perfil-autor-notification-count-sync";
import { usePerfilAutorProfileSaveActions } from "./hooks/use-perfil-autor-profile-save-actions";
import { usePerfilAutorProfileEditorSaveActions } from "./hooks/use-perfil-autor-profile-editor-save-actions";
import type {
  AbaBibliotecaPerfil,
  AbaPerfilAutor,
  AlvoDenunciaConteudoPerfil,
  AvaliacaoAutorPublica,
  AvaliacaoDiarioPublica,
  ComunidadePerfilEstado,
  DiarioPerfilEstado,
  ObraLocal,
  PerfisAutoresSalvos,
  PerfilUsuarioRemoto,
  TotaisInteracoesObrasPerfilAutor,
} from "./types";
import {
  BIO_MAX_LENGTH,
  PERMISSOES_ABAS_PERFIL_PADRAO,
  SOBRE_BIO_MAX_LENGTH,
  avaliacaoAutorVazia,
  avaliacaoDiarioVazia,
  comunidadePerfilVazia,
  diarioPerfilVazio,
  totaisInteracoesObrasPerfilVazio,
} from "./constants";
import {
  PerfilAutorLanguageBridge,
  traduzirTextoPerfilAutor,
} from "./translations";
import {
  compactarNumeroPerfilAutor,
  criarHrefLeituraCapituloPerfilAutor,
  formatarFormatoPerfilAutor,
  formatarGeneroPerfilAutor,
  normalizarAbaPerfilAutor,
  normalizarUsernamePerfilAutor,
  obterTagPrincipalPerfilAutor,
} from "./lib/profile-formatters";
import {
  encontrarCapituloParaContinuar,
  mostrarClassificacao,
} from "./lib/work-normalizers";
import {
  type IdentidadeAutenticadaPerfilAutor,
} from "./lib/profile-auth-identity";
import { colecaoTemObraPerfilBiblioteca } from "./lib/library-normalizers";
import {
  criarPerfilUsuarioRemotoComoAutor,
  obterTotalComentariosObraPerfilAutor,
  obterTotalCurtidasObraPerfilAutor,
  obterTotalSalvosObraPerfilAutor,
} from "./lib/data-normalizers";
import {
  analisarEnquetePublicacaoComunidadePerfil,
  criarHrefPublicacaoComunidadePerfil,
  criarResumoPublicacaoComunidadePerfil,
} from "./lib/profile-community-publication-utils";
import { dataDiarioPerfilFormatada } from "./lib/profile-diary-local-utils";
import { montarItensDiarioTudoPerfil } from "./lib/profile-diary-merge-utils";
import { criarLinksComunidadePerfilAutor } from "./lib/profile-community-links";
import { montarPerfisAutoresPorObras } from "./lib/profile-author-groups";
import { obterVisibilidadeAbasPerfilAutor } from "./lib/profile-tab-visibility-utils";
import { resolverEstadoPerfilAutor } from "./lib/profile-resolution-utils";
import { obterEstadoSeguimentoPerfilAutor } from "./lib/profile-follow-display-utils";
import { obterDadosExibicaoPerfilAutor } from "./lib/profile-display-utils";
import { obterEstadoAvaliacaoPerfilAutor } from "./lib/profile-rating-display-utils";
import {
  obterObraMenuAbertaPerfilAutor,
  obterObrasDestaquePerfilAutor,
  obterObrasVisiveisPerfilAutor,
  obterTotalObrasConcluidasPerfilAutor,
  obterVisibilidadeDestaquesPerfilAutor,
} from "./lib/profile-work-display-utils";
import { selecionarItensBibliotecaPerfil } from "./lib/profile-library-active-items";
import { montarItensBibliotecaPerfilAutor } from "./lib/profile-library-items-builder";
import { obterTotaisBibliotecaPerfilAutor } from "./lib/profile-library-totals";
import { obterResumoEstatisticasPerfilAutor } from "./lib/profile-summary-stats";
import {
  encontrarItemBibliotecaMenuAberto,
  obterRotuloBibliotecaPerfil,
} from "./lib/profile-library-display-utils";
import { MenuPerfilIcone } from "./components/profile-icons";
import { LoadingSpinner } from "./components/loading-spinner";
import { ProfilePageState } from "./components/profile-page-state";
import { PrivateProfileNotice } from "./components/private-profile-notice";
import { DiarySummaryCard } from "./components/diary-summary-card";
import { LibraryItemCard } from "./components/library-item-card";
import { ProfileSectionTabs } from "./components/profile-section-tabs";
import { LibraryTabs } from "./components/library-tabs";
import { ProfileRatingBox } from "./components/profile-rating-box";
import { ProfileStats } from "./components/profile-stats";
import { ProfileBio } from "./components/profile-bio";
import { ProfileAvatar } from "./components/profile-avatar";
import { ProfileHeaderInfo } from "./components/profile-header-info";
import { ProfileOwnerActions } from "./components/profile-owner-actions";
import { ProfileVisitorSecondaryActions } from "./components/profile-visitor-secondary-actions";
import { ProfileActionToast } from "./components/profile-action-toast";
import { ProfileHighlightsEmptyState } from "./components/profile-highlights-empty-state";
import { ProfileHighlightItem } from "./components/profile-highlight-item";
import { ProfileHighlightsLikeButton } from "./components/profile-highlights-like-button";
import { ProfileHighlightsEditLink } from "./components/profile-highlights-edit-link";
import { ProfileHighlightsHeader } from "./components/profile-highlights-header";
import { ProfileHighlightsList } from "./components/profile-highlights-list";
import { ProfileHighlightsSection } from "./components/profile-highlights-section";
import { ProfileLibrarySection } from "./components/profile-library-section";
import { ProfileCommunitySection } from "./components/profile-community-section";
import { ProfileCommunityHeader } from "./components/profile-community-header";
import { ProfileCommunityStatsGrid } from "./components/profile-community-stats-grid";
import { ProfileCommunityStatCard } from "./components/profile-community-stat-card";
import { ProfileCommunityNotice } from "./components/profile-community-notice";
import { ProfileCommunityRecentPostsSection } from "./components/profile-community-recent-posts-section";
import { ProfileCommunityRecentPostsList } from "./components/profile-community-recent-posts-list";
import { ProfileCommunityPostItem } from "./components/profile-community-post-item";
import { ProfileCommunityPostLink } from "./components/profile-community-post-link";
import { ProfileCommunityPostHeader } from "./components/profile-community-post-header";
import { ProfileCommunityPostBody } from "./components/profile-community-post-body";
import { ProfileCommunityPostSummary } from "./components/profile-community-post-summary";
import { ProfileCommunityPostPollInfo } from "./components/profile-community-post-poll-info";
import { ProfileCommunityPostWork } from "./components/profile-community-post-work";
import { ProfileCommunityPostReportButton } from "./components/profile-community-post-report-button";
import { ProfileAboutSection } from "./components/profile-about-section";
import { ProfileAboutHero } from "./components/profile-about-hero";
import { ProfileAboutTitle } from "./components/profile-about-title";
import { ProfileAboutTextRow } from "./components/profile-about-text-row";
import { ProfileAboutText } from "./components/profile-about-text";
import { ProfileAboutEditButton } from "./components/profile-about-edit-button";
import { ProfileAboutEditor } from "./components/profile-about-editor";
import { ProfileAboutTextarea } from "./components/profile-about-textarea";
import { ProfileAboutCounter } from "./components/profile-about-counter";
import { ProfileAboutContentGrid } from "./components/profile-about-content-grid";
import { ProfileAboutPanel } from "./components/profile-about-panel";
import { ProfileAboutPanelTitle } from "./components/profile-about-panel-title";
import { ProfileAboutChips } from "./components/profile-about-chips";
import { ProfileAboutChip } from "./components/profile-about-chip";
import { ProfileAboutMetricsGrid } from "./components/profile-about-metrics-grid";
import { ProfileAboutMetricCard } from "./components/profile-about-metric-card";
import { ProfileAboutMetricNumber } from "./components/profile-about-metric-number";
import { ProfileAboutMetricLabel } from "./components/profile-about-metric-label";
import { ProfileAboutRows } from "./components/profile-about-rows";
import { ProfileAboutRow } from "./components/profile-about-row";
import { ProfileAboutMemberSince } from "./components/profile-about-member-since";
import { ProfileDiaryPanel } from "./components/profile-diary-panel";
import { ProfileWorksSection } from "./components/profile-works-section";
import { ProfileWorksGrid } from "./components/profile-works-grid";
import { ProfileWorkCard } from "./components/profile-work-card";
import { ProfileWorkCoverLink } from "./components/profile-work-cover-link";
import { ProfileWorkCoverOverlay } from "./components/profile-work-cover-overlay";
import { ProfileWorkCoverTitle } from "./components/profile-work-cover-title";
import { ProfileWorkCoverMetrics } from "./components/profile-work-cover-metrics";
import { ProfileWorkCoverLikeIcon } from "./components/profile-work-cover-like-icon";
import { ProfileWorkCoverCommentIcon } from "./components/profile-work-cover-comment-icon";
import { ProfileWorkMenuAnchor } from "./components/profile-work-menu-anchor";
import { ProfileWorkOptionsButton } from "./components/profile-work-options-button";
import { ProfileWorkActionSheetOverlay } from "./components/profile-work-action-sheet-overlay";
import { ProfileWorkActionSheetPanel } from "./components/profile-work-action-sheet-panel";
import { ProfileWorkActionSheetHandle } from "./components/profile-work-action-sheet-handle";
import { ProfileWorkActionSheetHeader } from "./components/profile-work-action-sheet-header";
import { ProfileWorkActionSheetActions } from "./components/profile-work-action-sheet-actions";
import { ProfileWorkActionSheetTitle } from "./components/profile-work-action-sheet-title";
import { ProfileWorkActionSheetMeta } from "./components/profile-work-action-sheet-meta";
import { ProfileWorkActionSheetAuthor } from "./components/profile-work-action-sheet-author";
import { ProfileWorkActionSheetMetrics } from "./components/profile-work-action-sheet-metrics";
import { ProfileSectionEmptyState } from "./components/profile-section-empty-state";
import { ProfileAboutRecentActivity } from "./components/profile-about-recent-activity";
import {
  criarProfileSelectionDotStyle,
  criarCapaDestaquePerfilAutor,
  criarCapaGridPerfilAutor,
  workActionSheetItemStyle,
  workActionSheetDangerItemStyle,
  workActionSheetItemActiveStyle,
  mobileTopWaterFadeStyle,
  desktopTopWaterFadeStyle,
  perfilAutorThemeCss,
  pageStyle,
  containerStyle,
  logoMarkButtonStyle,
  logoTextButtonStyle,
  logoMarkStyle,
  logoTextStyle,
  profileHeaderStyle,
  profileHeaderDesktopStyle,
  profileHeaderLogoStyle,
  profileMenuButtonStyle,
  profileMenuIconStyle,
  profileMenuIconLineStyle,
  menuOverlayStyle,
  menuSheetStyle,
  desktopMenuSheetStyle,
  menuHeaderStyle,
  menuTitleBlockStyle,
  menuTitleStyle,
  menuSubtitleStyle,
  menuCloseButtonStyle,
  menuListStyle,
  menuSectionTitleStyle,
  menuDividerStyle,
  menuItemStyle,
  menuDangerItemStyle,
  menuItemIconStyle,
  menuItemTextStyle,
  menuChevronStyle,
  menuNotificationLabelStyle,
  menuNotificationRightStyle,
  menuNotificationBadgeStyle,
  heroBoxStyle,
  authorTopRowStyle,
  avatarImageStyle,
  hiddenInputStyle,
  profileEditorSheetContentStyle,
  profileEditorAvatarBlockStyle,
  profileEditorAvatarPreviewStyle,
  profileEditorSheetFieldStyle,
  profileEditorSheetLabelStyle,
  profileEditorSheetInputStyle,
  profileEditorSheetTextareaStyle,
  profileEditorSheetActionsStyle,
  profileEditorCancelButtonStyle,
  profileEditorSaveButtonStyle,
  avatarActionsStyle,
  avatarSmallButtonStyle,
  avatarRemoveButtonStyle,
  avatarErrorStyle,
  bioCounterStyle,
  profileActionsStyle,
  desktopProfileActionsStyle,
  profileVisitorActionsStyle,
  desktopProfileVisitorActionsStyle,
  profilePrimaryButtonStyle,
  profileActiveButtonStyle,
  desktopContainerStyle,
  desktopHeroBoxStyle,
  desktopAuthorTopRowStyle,
  desktopAvatarActionsStyle,
  desktopAvatarSmallButtonStyle,
  desktopAvatarRemoveButtonStyle,
} from "./styles";



function PerfilAutorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useHistorietasLanguage();
  const queryPerfilAtual = searchParams.toString();
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [totaisInteracoesObras, setTotaisInteracoesObras] =
    useState<TotaisInteracoesObrasPerfilAutor>(totaisInteracoesObrasPerfilVazio);
  const [autorSelecionado, setAutorSelecionado] = useState("");
  const [autorIdSelecionado, setAutorIdSelecionado] = useState("");
  const [autoresSeguidos, setAutoresSeguidos] = useState<string[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [topFiveObraIds, setTopFiveObraIds] = useState<string[]>([]);
  const [topFiveCurtidasTotal, setTopFiveCurtidasTotal] = useState(0);
  const [topFiveCurtidoPorMim, setTopFiveCurtidoPorMim] = useState(false);
  const [topFiveCurtidaSalvando, setTopFiveCurtidaSalvando] = useState(false);
  const [mostrarDestaquesVisitante, setMostrarDestaquesVisitante] = useState(false);
  const [perfisAutoresSalvos, setPerfisAutoresSalvos] =
    useState<PerfisAutoresSalvos>({});
  const [avatarErro, setAvatarErro] = useState("");
  const { mensagemAcao, setMensagemAcao } = usePerfilAutorActionMessage();
  const [perfilUsuarioRemoto, setPerfilUsuarioRemoto] =
    useState<PerfilUsuarioRemoto | null>(null);
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const { salvarObrasBibliotecaPerfil } =
    usePerfilAutorLibraryStorageActions({
      usuarioIdLogado,
      setObras,
    });
  const [autenticacaoCarregada, setAutenticacaoCarregada] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const [usernameCabecalhoVisivel, setUsernameCabecalhoVisivel] =
    useState(false);
  const [editorPerfilAberto, setEditorPerfilAberto] = useState(false);
  const [nomePerfilEditor, setNomePerfilEditor] = useState("");
  const [usernamePerfilEditor, setUsernamePerfilEditor] = useState("");
  const [bioPerfilEditor, setBioPerfilEditor] = useState("");
  const [avatarPerfilEditor, setAvatarPerfilEditor] = useState("");
  const [avatarNomePerfilEditor, setAvatarNomePerfilEditor] = useState("");
  const [avatarArquivoPerfilEditor, setAvatarArquivoPerfilEditor] =
    useState<File | null>(null);
  const [salvandoEditorPerfil, setSalvandoEditorPerfil] = useState(false);
  const [editorSobreAberto, setEditorSobreAberto] = useState(false);
  const [abaPerfil, setAbaPerfil] = useState<AbaPerfilAutor>(() =>
    normalizarAbaPerfilAutor(searchParams.get("aba")),
  );
  const { selecionarAbaPerfil } = usePerfilAutorTabNavigation({
    setAbaPerfil,
  });
  const { avisarLoginNecessario, sairDaConta } =
    usePerfilAutorSessionActions({
      router,
      setMensagemAcao,
      setMenuPerfilAberto,
    });
  const [abaBibliotecaPerfil, setAbaBibliotecaPerfil] =
    useState<AbaBibliotecaPerfil>("tudo");
  const [obrasSeguidasBiblioteca, setObrasSeguidasBiblioteca] = useState<string[]>([]);
  const [versaoSincronizacaoBiblioteca, setVersaoSincronizacaoBiblioteca] =
    useState(0);
  const {
    alternarFavoritoObra,
    alternarConcluidoObra,
    alternarObraSeguindoBibliotecaPerfil,
    removerItemBibliotecaPerfil,
  } = usePerfilAutorLibraryCollectionActions({
    abaBibliotecaPerfil,
    obras,
    obrasFavoritas,
    obrasConcluidas,
    obrasSeguidasBiblioteca,
    usuarioIdLogado,
    avisarLoginNecessario,
    salvarObrasBibliotecaPerfil,
    setMensagemAcao,
    setObrasFavoritas,
    setObrasConcluidas,
    setObrasSeguidasBiblioteca,
    setVersaoSincronizacaoBiblioteca,
  });
  const [obraMenuAbertoId, setObraMenuAbertoId] = useState("");
  const [bibliotecaMenuAbertoChave, setBibliotecaMenuAbertoChave] = useState("");
  const [avaliacaoAutor, setAvaliacaoAutor] =
    useState<AvaliacaoAutorPublica>(avaliacaoAutorVazia);
  const [avaliacaoDiario, setAvaliacaoDiario] =
    useState<AvaliacaoDiarioPublica>(avaliacaoDiarioVazia);
  const [diarioPerfil, setDiarioPerfil] =
    useState<DiarioPerfilEstado>(diarioPerfilVazio);
  const [comunidadePerfil, setComunidadePerfil] =
    useState<ComunidadePerfilEstado>(comunidadePerfilVazia);
  const [atividadeSobreAberta, setAtividadeSobreAberta] = useState(false);
  const [seguindoUsuarioPerfil, setSeguindoUsuarioPerfil] = useState(false);
  const [seguidoresUsuarioPerfilTotal, setSeguidoresUsuarioPerfilTotal] =
    useState(0);
  const [seguindoUsuarioPerfilTotal, setSeguindoUsuarioPerfilTotal] =
    useState(0);
  const [seguirUsuarioSalvando, setSeguirUsuarioSalvando] = useState(false);
  const [estadoRelacionamentoPerfil, setEstadoRelacionamentoPerfil] =
    useState<EstadoRelacionamentoPerfil>("nenhum");
  const [permissoesAbasPerfil, setPermissoesAbasPerfil] =
    useState<PermissoesAbasPerfil>(PERMISSOES_ABAS_PERFIL_PADRAO);
  const [privacidadePerfilCarregando, setPrivacidadePerfilCarregando] =
    useState(true);
  const [denunciaPerfilAberta, setDenunciaPerfilAberta] = useState(false);
  const [
    alvoDenunciaConteudoPerfil,
    setAlvoDenunciaConteudoPerfil,
  ] = useState<AlvoDenunciaConteudoPerfil>(null);
  const [estadoBloqueioPerfil, setEstadoBloqueioPerfil] =
    useState<EstadoBloqueioPerfil>({
      bloqueadoPorMim: false,
      bloqueadoPeloPerfil: false,
      existeBloqueio: false,
    });
  const [bloqueioPerfilSalvando, setBloqueioPerfilSalvando] =
    useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const { selecionarAvatarAutor, removerAvatarAutor } =
    usePerfilAutorAvatarEditorActions({
      avatarInputRef,
      setAvatarErro,
      setAvatarPerfilEditor,
      setAvatarNomePerfilEditor,
      setAvatarArquivoPerfilEditor,
    });
  const identidadeAutenticadaPerfilRef =
    useRef<IdentidadeAutenticadaPerfilAutor>({
      usuarioId: "",
      versao: 0,
    });
  const versaoConsultaAutenticacaoPerfilRef = useRef(0);
  const isDesktop = usePerfilAutorDesktopMode();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const {
    usuarioId: usuarioNotificacoesId,
    notificacoesNaoLidas: notificacoesNaoLidasContexto,
  } = useNotificacoes();
  const [notificacoesNaoLidasPerfil, setNotificacoesNaoLidasPerfil] =
    useState<number | null>(null);
  const notificacoesNaoLidas =
    notificacoesNaoLidasPerfil ?? notificacoesNaoLidasContexto;

  usePerfilAutorAuthIdentitySync({
    avatarInputRef,
    identidadeAutenticadaPerfilRef,
    versaoConsultaAutenticacaoPerfilRef,
    setPerfilUsuarioRemoto,
    setObras,
    setTotaisInteracoesObras,
    setAutoresSeguidos,
    setObrasFavoritas,
    setObrasConcluidas,
    setObrasSeguidasBiblioteca,
    setPerfisAutoresSalvos,
    setEditorPerfilAberto,
    setNomePerfilEditor,
    setUsernamePerfilEditor,
    setBioPerfilEditor,
    setAvatarPerfilEditor,
    setAvatarNomePerfilEditor,
    setAvatarArquivoPerfilEditor,
    setAvatarErro,
    setSalvandoEditorPerfil,
    setTopFiveCurtidaSalvando,
    setAvaliacaoDiario,
    setMensagemAcao,
    setCarregando,
    setUsuarioIdLogado,
    setAutenticacaoCarregada,
  });

  usePerfilAutorNotificationCountSync({
    usuarioNotificacoesId,
    usuarioIdLogado,
    setNotificacoesNaoLidasPerfil,
  });

  usePerfilAutorInteractionTotalsSync({
    obras,
    setTotaisInteracoesObras,
  });


  usePerfilAutorProfileLoadSync({
    autenticacaoCarregada,
    queryPerfilAtual,
    usuarioIdLogado,
    identidadeAutenticadaPerfilRef,
    setAbaPerfil,
    setAutorSelecionado,
    setAutorIdSelecionado,
    setMostrarDestaquesVisitante,
    setUsernameCabecalhoVisivel,
    setPerfilUsuarioRemoto,
    setObras,
    setAutoresSeguidos,
    setObrasFavoritas,
    setObrasConcluidas,
    setObrasSeguidasBiblioteca,
    setPerfisAutoresSalvos,
    setCarregando,
  });

  const perfisAutores = montarPerfisAutoresPorObras(
    obras,
    totaisInteracoesObras,
  );

  const {
    autorNaoEncontrado,
    perfilDoUsuarioLogado,
    perfilParaMostrar,
    perfilPertenceAoUsuario,
    redirecionandoParaLogin,
  } = useMemo(() => {
    const perfilUsuarioRemotoComoAutor = perfilUsuarioRemoto?.userId
      ? criarPerfilUsuarioRemotoComoAutor(perfilUsuarioRemoto)
      : null;

    return resolverEstadoPerfilAutor({
      perfisAutores,
      autorSelecionado,
      autorIdSelecionado,
      usuarioIdLogado,
      perfilUsuarioRemotoComoAutor,
      autenticacaoCarregada,
    });
  }, [
    perfisAutores,
    autorSelecionado,
    autorIdSelecionado,
    usuarioIdLogado,
    perfilUsuarioRemoto,
    autenticacaoCarregada,
  ]);

  usePerfilAutorLoginRedirect({
    redirecionandoParaLogin,
  });

  usePerfilAutorTopFiveStorageSync({
    perfilAutorId: perfilParaMostrar?.autorId || "",
    usuarioIdLogado,
    setTopFiveObraIds,
  });

  usePerfilAutorTopFiveLikesSync({
    perfilAutorId: perfilParaMostrar?.autorId || "",
    usuarioIdLogado,
    setTopFiveCurtidasTotal,
    setTopFiveCurtidoPorMim,
  });

  const podeEditarPerfil = perfilPertenceAoUsuario;

  const {
    perfilBloqueadoEntreUsuarios,
    obrasPerfilVisivel,
    sobrePerfilVisivel,
    diarioPerfilVisivel,
    comunidadePerfilVisivel,
    bibliotecaPerfilVisivel,
    atividadesPerfilVisivel,
    totalAbasPerfilVisiveis,
    conteudoPrivadoBloqueado,
    primeiraAbaPerfilVisivel,
  } = obterVisibilidadeAbasPerfilAutor({
    perfilPertenceAoUsuario,
    existeBloqueio: estadoBloqueioPerfil.existeBloqueio,
    privacidadeCarregando: privacidadePerfilCarregando,
    permissoes: permissoesAbasPerfil,
  });

  usePerfilAutorPrivacySync({
    perfilAutorId: perfilParaMostrar?.autorId || "",
    perfilPertenceAoUsuario,
    estadoRelacionamentoPerfil,
    setPermissoesAbasPerfil,
    setPrivacidadePerfilCarregando,
  });

  usePerfilAutorCommunitySync({
    perfilAutorId: perfilParaMostrar?.autorId || "",
    comunidadePerfilVisivel,
    perfilPertenceAoUsuario,
    setComunidadePerfil,
  });

  usePerfilAutorVisibleTabSync({
    abaPerfil,
    obrasPerfilVisivel,
    diarioPerfilVisivel,
    comunidadePerfilVisivel,
    sobrePerfilVisivel,
    bibliotecaPerfilVisivel,
    primeiraAbaPerfilVisivel,
    setAbaPerfil,
  });

  usePerfilAutorBlockStateSync({
    perfilAutorId: perfilParaMostrar?.autorId || "",
    usuarioIdLogado,
    setEstadoBloqueioPerfil,
  });

  usePerfilAutorFollowStateSync({
    perfilAutorId: perfilParaMostrar?.autorId || "",
    usuarioIdLogado,
    setEstadoRelacionamentoPerfil,
    setSeguindoUsuarioPerfil,
    setSeguidoresUsuarioPerfilTotal,
    setSeguindoUsuarioPerfilTotal,
  });

  const {
    autorChavePerfil,
    autorNormalizadoParaSeguir,
    seguindoAutor,
    seguindoPerfilAtual,
    solicitacaoSeguimentoPendente,
    seguidoresTotal,
    seguindoTotalPerfil,
    seguidoresPerfilHref,
    seguindoPerfilHref,
    obrasSeguidasPerfilHref,
  } = obterEstadoSeguimentoPerfilAutor({
    perfilParaMostrar,
    autoresSeguidos,
    estadoRelacionamentoPerfil,
    seguindoUsuarioPerfil,
    seguidoresUsuarioPerfilTotal,
    seguindoUsuarioPerfilTotal,
    podeEditarPerfil,
  });

  const obrasConcluidasPerfilPorObrasDoAutor =
    obterTotalObrasConcluidasPerfilAutor({
      perfilParaMostrar,
      totaisInteracoesObras,
      obrasConcluidas,
    });
  const {
    perfilSalvoAutor,
    perfilUsuarioRemotoAtivo,
    bioPadraoAutor,
    bioAutorPersonalizada,
    bioAutor,
    bioSobrePersonalizada,
    bioSobreAutor,
    entradaHistorietasPerfil,
    caracteresRestantesBioSobre,
    bioSobreAutorEhPadrao,
    autorHandlePerfil,
    avatarAutor,
  } = obterDadosExibicaoPerfilAutor({
    perfilParaMostrar,
    perfilUsuarioRemoto,
    perfisAutoresSalvos,
    autorChavePerfil,
    autorNormalizadoParaSeguir,
  });

  const bioSobreAutorExibido = bioSobreAutorEhPadrao
    ? traduzirTextoPerfilAutor(bioSobreAutor, language)
    : bioSobreAutor;

  const {
    compartilharObraPerfilAutor,
    copiarLinkPerfil,
    copiarUsernameCabecalho,
  } = usePerfilAutorShareActions({
    autorHandlePerfil,
    perfilParaMostrar,
    perfilUsuarioRemotoAtivo,
    setMensagemAcao,
    setMenuPerfilAberto,
    setObraMenuAbertoId,
  });
  const { abrirDenunciaPerfil, abrirDenunciaConteudoPerfil } =
    usePerfilAutorReportActions({
      podeEditarPerfil,
      perfilParaMostrar,
      setMensagemAcao,
      setMenuPerfilAberto,
      setDenunciaPerfilAberta,
      setObraMenuAbertoId,
      setAlvoDenunciaConteudoPerfil,
    });
  const { abrirEditorPerfil, fecharEditorPerfil } =
    usePerfilAutorProfileEditorActions({
      podeEditarPerfil,
      perfilParaMostrar,
      perfilUsuarioRemotoAtivo,
      bioAutorPersonalizada,
      avatarAutor,
      avatarNomePerfil: perfilSalvoAutor.avatarNome || "",
      salvandoEditorPerfil,
      avatarInputRef,
      setNomePerfilEditor,
      setUsernamePerfilEditor,
      setBioPerfilEditor,
      setAvatarPerfilEditor,
      setAvatarNomePerfilEditor,
      setAvatarArquivoPerfilEditor,
      setAvatarErro,
      setMenuPerfilAberto,
      setEditorPerfilAberto,
    });
  const { salvarPerfilAutor } = usePerfilAutorProfileSaveActions({
    autorChavePerfil,
    perfisAutoresSalvos,
    usuarioIdLogado,
    perfilParaMostrar,
    podeEditarPerfil,
    perfilUsuarioRemotoAtivo,
    setPerfisAutoresSalvos,
    setPerfilUsuarioRemoto,
    setMensagemAcao,
  });

  const { atualizarBioSobreAutor, alternarDestaquesPerfil } =
    usePerfilAutorAboutActions({
      avatarAutor,
      perfilSalvoAutor,
      bioAutorPersonalizada,
      bioSobrePersonalizada,
      salvarPerfilAutor,
    });
  const {
    autorPodeReceberAvaliacao,
    perfilUsaAvaliacaoDiario,
    avaliacaoDiarioPrivada,
    avaliacaoResumoPerfilVisivel,
    avaliacaoResumoPerfil,
    avaliacaoResumoEhDiario,
  } = obterEstadoAvaliacaoPerfilAutor({
    perfilParaMostrar,
    podeEditarPerfil,
    avaliacaoAutor,
    avaliacaoDiario,
  });

  const obrasDoPerfilFiltradas = obterObrasVisiveisPerfilAutor({
    perfilParaMostrar,
    perfilPertenceAoUsuario,
  });

  const obrasEmDestaque = obterObrasDestaquePerfilAutor({
    topFiveObraIds,
    obras,
    obrasPerfil: perfilParaMostrar?.obras || [],
    perfilPertenceAoUsuario,
  });

  const { exibirSecaoDestaques } =
    obterVisibilidadeDestaquesPerfilAutor({
      obrasPerfilVisivel,
      podeEditarPerfil,
      mostrarDestaquesAutor: perfilSalvoAutor.mostrarDestaques,
      mostrarDestaquesVisitante,
      totalObrasEmDestaque: obrasEmDestaque.length,
    });

  const { alternarCurtidaTopFivePerfil } =
    usePerfilAutorTopFiveLikeActions({
      identidadeAutenticadaPerfilRef,
      perfilParaMostrar,
      usuarioIdLogado,
      topFiveCurtidaSalvando,
      topFiveCurtidoPorMim,
      setMensagemAcao,
      setTopFiveCurtidaSalvando,
      setTopFiveCurtidoPorMim,
      setTopFiveCurtidasTotal,
    });

  usePerfilAutorDiarySync({
    perfilParaMostrar,
    obras,
    obrasFavoritas,
    obrasConcluidas,
    obrasSeguidasBiblioteca,
    podeEditarPerfil,
    bibliotecaPerfilVisivel,
    abaPerfil,
    usuarioIdLogado,
    versaoSincronizacaoBiblioteca,
    permissoesAbasPerfil,
    diarioPerfilVisivel,
    atividadesPerfilVisivel,
    setDiarioPerfil,
  });

  const itensDiarioTudo = montarItensDiarioTudoPerfil(diarioPerfil);

  usePerfilAutorRatingSync({
    perfilParaMostrar,
    autorPodeReceberAvaliacao,
    usuarioIdLogado,
    perfilPertenceAoUsuario,
    setAvaliacaoAutor,
  });

  usePerfilAutorDiaryRatingSync({
    perfilParaMostrar,
    perfilUsuarioRemotoUserId: perfilUsuarioRemotoAtivo?.userId || "",
    perfilUsaAvaliacaoDiario,
    podeEditarPerfil,
    usuarioIdLogado,
    setAvaliacaoDiario,
  });

  const {
    generosPrincipaisPerfil,
    totalVisualizacoesPerfil,
    totalRascunhosPerfil,
    totalObrasSemCapitulosPerfil,
  } = obterResumoEstatisticasPerfilAutor(perfilParaMostrar);

  const obraMenuAberta = obterObraMenuAbertaPerfilAutor(
    obrasDoPerfilFiltradas,
    obraMenuAbertoId,
  );


  const {
    queroLer: itensBibliotecaQueroLer,
    lendoAgora: itensBibliotecaLendoAgora,
    favoritas: itensBibliotecaFavoritas,
    concluidas: itensBibliotecaConcluidas,
    historico: itensBibliotecaHistorico,
    salvos: itensBibliotecaSalvos,
  } = montarItensBibliotecaPerfilAutor({
    bibliotecaPerfilVisivel,
    queroLer: diarioPerfil.queroLer,
    lendoAgora: diarioPerfil.lendoAgora,
    favoritas: diarioPerfil.favoritas,
    concluidas: diarioPerfil.concluidas,
    atividades: diarioPerfil.atividades,
    obras,
  });

  const {
    obrasSeguidasPerfilTotal,
    obrasConcluidasPerfilTotal,
  } = obterTotaisBibliotecaPerfilAutor({
    obras,
    obrasSeguidasBiblioteca,
    obrasConcluidas,
    itensBibliotecaQueroLerTotal: itensBibliotecaQueroLer.length,
    itensBibliotecaConcluidasTotal: itensBibliotecaConcluidas.length,
    obrasConcluidasPerfilPorObrasDoAutor,
  });

  const itensBibliotecaAtivos = selecionarItensBibliotecaPerfil({
    aba: abaBibliotecaPerfil,
    queroLer: itensBibliotecaQueroLer,
    lendoAgora: itensBibliotecaLendoAgora,
    favoritas: itensBibliotecaFavoritas,
    concluidas: itensBibliotecaConcluidas,
    salvos: itensBibliotecaSalvos,
    historico: itensBibliotecaHistorico,
  });

  const bibliotecaMenuAberto = encontrarItemBibliotecaMenuAberto(
    itensBibliotecaAtivos,
    bibliotecaMenuAbertoChave,
  );

  const rotuloBibliotecaAtiva = obterRotuloBibliotecaPerfil(
    abaBibliotecaPerfil,
  );

  const containerAtualStyle = isDesktop
    ? desktopContainerStyle
    : containerStyle;
  const heroAtualStyle = isDesktop ? desktopHeroBoxStyle : heroBoxStyle;
  const authorTopRowAtualStyle = isDesktop
    ? desktopAuthorTopRowStyle
    : authorTopRowStyle;
  const avatarActionsAtualStyle = isDesktop
    ? desktopAvatarActionsStyle
    : avatarActionsStyle;
  const avatarSmallButtonAtualStyle = isDesktop
    ? desktopAvatarSmallButtonStyle
    : avatarSmallButtonStyle;
  const avatarRemoveButtonAtualStyle = isDesktop
    ? desktopAvatarRemoveButtonStyle
    : avatarRemoveButtonStyle;
  const profileActionsAtualStyle = isDesktop
    ? desktopProfileActionsStyle
    : profileActionsStyle;
  const profileVisitorActionsAtualStyle = isDesktop
    ? desktopProfileVisitorActionsStyle
    : profileVisitorActionsStyle;
  const menuSheetAtualStyle = isDesktop
    ? desktopMenuSheetStyle
    : menuSheetStyle;
  const {
    geral: comunidadeAutorHref,
    teorias: comunidadeAutorTeoriasHref,
    reviews: comunidadeAutorReviewsHref,
  } = criarLinksComunidadePerfilAutor(perfilParaMostrar?.nome || "");

  const { salvarEdicaoPerfilAutor } =
    usePerfilAutorProfileEditorSaveActions({
      identidadeAutenticadaPerfilRef,
      perfilParaMostrar,
      usuarioIdLogado,
      podeEditarPerfil,
      nomePerfilEditor,
      usernamePerfilEditor,
      perfilUsuarioRemotoAtivo,
      avatarPerfilEditor,
      avatarArquivoPerfilEditor,
      avatarNomePerfilEditor,
      bioPerfilEditor,
      bioSobrePersonalizada,
      perfilSalvoAutor,
      perfisAutoresSalvos,
      autorChavePerfil,
      avatarInputRef,
      setMensagemAcao,
      setSalvandoEditorPerfil,
      setPerfisAutoresSalvos,
      setPerfilUsuarioRemoto,
      setObras,
      setAvatarPerfilEditor,
      setAvatarArquivoPerfilEditor,
      setEditorPerfilAberto,
    });


  const { avaliarAutor } = usePerfilAutorRatingActions({
    identidadeAutenticadaPerfilRef,
    perfilParaMostrar,
    autorPodeReceberAvaliacao,
    perfilPertenceAoUsuario,
    usuarioIdLogado,
    avaliacaoAutor,
    avisarLoginNecessario,
    setAvaliacaoAutor,
    setMensagemAcao,
  });

  const { avaliarDiarioPerfil } = usePerfilAutorDiaryRatingActions({
    identidadeAutenticadaPerfilRef,
    perfilParaMostrar,
    perfilUsaAvaliacaoDiario,
    perfilUsuarioRemotoAtivo,
    perfilPertenceAoUsuario,
    usuarioIdLogado,
    avaliacaoDiario,
    avisarLoginNecessario,
    setAvaliacaoDiario,
    setMensagemAcao,
  });

  const { alternarBloqueioPerfil } = usePerfilAutorBlockActions({
    podeEditarPerfil,
    perfilParaMostrar,
    bloqueioPerfilSalvando,
    usuarioIdLogado,
    estadoBloqueioPerfil,
    avisarLoginNecessario,
    setMenuPerfilAberto,
    setMensagemAcao,
    setBloqueioPerfilSalvando,
    setEstadoBloqueioPerfil,
    setSeguindoUsuarioPerfil,
    setEstadoRelacionamentoPerfil,
    setPermissoesAbasPerfil,
  });

  const { alternarSeguirAutor } = usePerfilAutorFollowActions({
    perfilParaMostrar,
    seguirUsuarioSalvando,
    usuarioIdLogado,
    estadoRelacionamentoPerfil,
    seguindoUsuarioPerfil,
    perfilDoUsuarioLogado,
    seguindoAutor,
    autoresSeguidos,
    avisarLoginNecessario,
    setMensagemAcao,
    setSeguirUsuarioSalvando,
    setEstadoRelacionamentoPerfil,
    setSeguindoUsuarioPerfil,
    setSeguidoresUsuarioPerfilTotal,
    setAutoresSeguidos,
  });



  if (carregando || redirecionandoParaLogin) {
    return (
      <ProfilePageState
        isDesktop={isDesktop}
        pageThemeStyle={pageThemeStyle}
        loadingLabel="Carregando perfil"
      />
    );
  }

  if (autorNaoEncontrado) {
    return (
      <ProfilePageState
        isDesktop={isDesktop}
        pageThemeStyle={pageThemeStyle}
        message="Perfil não encontrado"
      />
    );
  }

  if (!perfilParaMostrar) {
    return (
      <ProfilePageState
        isDesktop={isDesktop}
        pageThemeStyle={pageThemeStyle}
        message="Nenhum autor encontrado"
      />
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${perfilAutorThemeCss}`}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      <section style={containerAtualStyle}>
        <header
          style={
            isDesktop ? profileHeaderDesktopStyle : profileHeaderStyle
          }
        >
          <div style={profileHeaderLogoStyle}>
            <button
              type="button"
              onClick={() =>
                setUsernameCabecalhoVisivel((visivel) => !visivel)
              }
              style={logoMarkButtonStyle}
              aria-label={
                usernameCabecalhoVisivel
                  ? "Esconder username"
                  : "Mostrar username"
              }
              aria-expanded={usernameCabecalhoVisivel}
            >
              <span style={logoMarkStyle} aria-hidden="true">
                @
              </span>
            </button>

            {usernameCabecalhoVisivel ? (
              <button
                type="button"
                onClick={copiarUsernameCabecalho}
                style={logoTextButtonStyle}
                aria-label={`Copiar ${autorHandlePerfil}`}
                title="Copiar username"
              >
                <span
                  data-historietas-user-content="true"
                  data-historietas-i18n-ignore="true"
                  style={logoTextStyle}
                >
                  {autorHandlePerfil.replace(/^@/, "")}
                </span>
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setMenuPerfilAberto(true)}
            style={profileMenuButtonStyle}
            aria-label="Abrir menu do perfil"
            aria-expanded={menuPerfilAberto}
          >
            <span style={profileMenuIconStyle} aria-hidden="true">
              <span style={profileMenuIconLineStyle} />
              <span style={profileMenuIconLineStyle} />
              <span style={profileMenuIconLineStyle} />
            </span>
          </button>
        </header>

        {menuPerfilAberto && (
          <div
            style={menuOverlayStyle}
            role="presentation"
            onClick={() => setMenuPerfilAberto(false)}
          >
            <section
              style={menuSheetAtualStyle}
              role="dialog"
              aria-label="Menu do perfil"
              onClick={(event) => event.stopPropagation()}
            >
              <div style={menuHeaderStyle}>
                <div style={menuTitleBlockStyle}>
                  <strong data-historietas-user-content="true" style={menuTitleStyle}>
                    {perfilParaMostrar.nome}
                  </strong>
                  {!podeEditarPerfil ? (
                    <span style={menuSubtitleStyle}>Ações do perfil</span>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setMenuPerfilAberto(false)}
                  style={menuCloseButtonStyle}
                  aria-label="Fechar menu"
                >
                  ×
                </button>
              </div>

              <div style={menuListStyle}>
                {podeEditarPerfil ? (
                  <>
                    <span style={menuSectionTitleStyle}>Conta e sistema</span>

                    <Link
                      href="/painel-autor"
                      style={menuItemStyle}
                      onClick={() => setMenuPerfilAberto(false)}
                    >
                      <span style={menuItemIconStyle}>
                        <MenuPerfilIcone tipo="painel" />
                      </span>
                      <strong style={menuItemTextStyle}>Painel do Autor</strong>
                      <span style={menuChevronStyle}>›</span>
                    </Link>

                    <Link
                      href="/notificacoes"
                      style={menuItemStyle}
                      onClick={() => setMenuPerfilAberto(false)}
                      aria-label={
                        notificacoesNaoLidas > 0
                          ? `Notificações: ${notificacoesNaoLidas} não lidas`
                          : "Notificações"
                      }
                    >
                      <span style={menuItemIconStyle}>
                        <MenuPerfilIcone tipo="notificacoes" />
                      </span>
                      <span style={menuNotificationLabelStyle}>
                        <strong style={menuItemTextStyle}>Notificações</strong>

                        {notificacoesNaoLidas > 0 ? (
                          <span
                            style={menuNotificationBadgeStyle}
                            aria-label={`${notificacoesNaoLidas > 99 ? "99+" : notificacoesNaoLidas} notificações não lidas`}
                          >
                            {notificacoesNaoLidas > 99
                              ? "99+"
                              : notificacoesNaoLidas}
                          </span>
                        ) : null}
                      </span>

                      <span style={menuNotificationRightStyle}>
                        <span style={menuChevronStyle}>›</span>
                      </span>
                    </Link>

                    <Link
                      href="/configuracoes"
                      style={menuItemStyle}
                      onClick={() => setMenuPerfilAberto(false)}
                    >
                      <span style={menuItemIconStyle}>
                        <MenuPerfilIcone tipo="configuracoes" />
                      </span>
                      <strong style={menuItemTextStyle}>
                        Configurações e atividade
                      </strong>
                      <span style={menuChevronStyle}>›</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => void copiarLinkPerfil()}
                      style={menuItemStyle}
                    >
                      <span style={menuItemIconStyle}>
                        <MenuPerfilIcone tipo="link" />
                      </span>
                      <strong style={menuItemTextStyle}>
                        Copiar link do perfil
                      </strong>
                      <span style={menuChevronStyle}>›</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void sairDaConta()}
                      style={menuDangerItemStyle}
                    >
                      <span style={menuItemIconStyle}>
                        <MenuPerfilIcone tipo="sair" />
                      </span>
                      <strong style={menuItemTextStyle}>Sair da conta</strong>
                      <span style={menuChevronStyle}>›</span>
                    </button>
                  </>
                ) : (
                  <>
                    <span style={menuSectionTitleStyle}>Perfil</span>

                    <button
                      type="button"
                      onClick={() => void copiarLinkPerfil()}
                      style={menuItemStyle}
                    >
                      <span style={menuItemIconStyle}><MenuPerfilIcone tipo="link" /></span>
                      <strong style={menuItemTextStyle}>
                        Copiar link do perfil
                      </strong>
                      <span style={menuChevronStyle}>›</span>
                    </button>

                    <Link
                      href={comunidadeAutorHref}
                      style={menuItemStyle}
                      onClick={() => setMenuPerfilAberto(false)}
                    >
                      <span style={menuItemIconStyle}><MenuPerfilIcone tipo="comunidade" /></span>
                      <strong style={menuItemTextStyle}>
                        Comunidade do autor
                      </strong>
                      <span style={menuChevronStyle}>›</span>
                    </Link>

                    <button
                      type="button"
                      onClick={abrirDenunciaPerfil}
                      style={menuDangerItemStyle}
                    >
                      <span style={menuItemIconStyle}>
                        <MenuPerfilIcone tipo="denunciar" />
                      </span>
                      <strong style={menuItemTextStyle}>
                        Denunciar perfil
                      </strong>
                      <span style={menuChevronStyle}>›</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void alternarBloqueioPerfil()}
                      disabled={bloqueioPerfilSalvando}
                      style={
                        estadoBloqueioPerfil.bloqueadoPorMim
                          ? menuItemStyle
                          : menuDangerItemStyle
                      }
                    >
                      <span style={menuItemIconStyle}>
                        <MenuPerfilIcone tipo="bloquear" />
                      </span>
                      <strong style={menuItemTextStyle}>
                        {bloqueioPerfilSalvando
                          ? estadoBloqueioPerfil.bloqueadoPorMim
                            ? "Desbloqueando..."
                            : "Bloqueando..."
                          : estadoBloqueioPerfil.bloqueadoPorMim
                            ? "Desbloquear usuário"
                            : "Bloquear usuário"}
                      </strong>
                      <span style={menuChevronStyle}>›</span>
                    </button>

                    <div style={menuDividerStyle} />
                    <span style={menuSectionTitleStyle}>Descoberta</span>

                    <Link
                      href="/explorar"
                      style={menuItemStyle}
                      onClick={() => setMenuPerfilAberto(false)}
                    >
                      <span style={menuItemIconStyle}><MenuPerfilIcone tipo="explorar" /></span>
                      <strong style={menuItemTextStyle}>
                        Explorar outras obras
                      </strong>
                      <span style={menuChevronStyle}>›</span>
                    </Link>
                  </>
                )}
              </div>
            </section>
          </div>
        )}

        {podeEditarPerfil && editorPerfilAberto && (
          <div
            style={menuOverlayStyle}
            role="presentation"
            onClick={fecharEditorPerfil}
          >
            <section
              style={menuSheetAtualStyle}
              role="dialog"
              aria-modal="true"
              aria-label="Editar perfil"
              onClick={(event) => event.stopPropagation()}
            >
              <div style={menuHeaderStyle}>
                <div style={menuTitleBlockStyle}>
                  <strong style={menuTitleStyle}>Editar perfil</strong>
                  <span style={menuSubtitleStyle}>
                    Atualize suas informações públicas
                  </span>
                </div>

                <button
                  type="button"
                  onClick={fecharEditorPerfil}
                  disabled={salvandoEditorPerfil}
                  style={menuCloseButtonStyle}
                  aria-label="Fechar edição do perfil"
                >
                  ×
                </button>
              </div>

              <div style={profileEditorSheetContentStyle}>
                <div style={profileEditorAvatarBlockStyle}>
                  <div style={profileEditorAvatarPreviewStyle}>
                    {avatarPerfilEditor ? (
                      <Image
                        src={avatarPerfilEditor}
                        alt="Prévia da imagem do perfil"
                        width={128}
                        height={128}
                        unoptimized
                        style={avatarImageStyle}
                      />
                    ) : (
                      <span>
                        {(nomePerfilEditor || perfilParaMostrar.nome)
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div style={avatarActionsAtualStyle}>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={salvandoEditorPerfil}
                      style={avatarSmallButtonAtualStyle}
                    >
                      {avatarPerfilEditor ? "Trocar imagem" : "Colocar imagem"}
                    </button>

                    {avatarPerfilEditor && (
                      <button
                        type="button"
                        onClick={removerAvatarAutor}
                        disabled={salvandoEditorPerfil}
                        style={avatarRemoveButtonAtualStyle}
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  {avatarErro && (
                    <span style={avatarErrorStyle}>{avatarErro}</span>
                  )}
                </div>

                <label style={profileEditorSheetFieldStyle}>
                  <span style={profileEditorSheetLabelStyle}>
                    Nome de usuário
                  </span>

                  <input
                    value={nomePerfilEditor}
                    onChange={(event) =>
                      setNomePerfilEditor(event.target.value.slice(0, 80))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void salvarEdicaoPerfilAutor();
                      }
                    }}
                    placeholder="Digite seu nome"
                    maxLength={80}
                    disabled={salvandoEditorPerfil}
                    style={profileEditorSheetInputStyle}
                    type="text"
                  />
                </label>

                <label style={profileEditorSheetFieldStyle}>
                  <span style={profileEditorSheetLabelStyle}>
                    @username público
                  </span>

                  <input
                    value={usernamePerfilEditor}
                    onChange={(event) =>
                      setUsernamePerfilEditor(
                        normalizarUsernamePerfilAutor(event.target.value),
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void salvarEdicaoPerfilAutor();
                      }
                    }}
                    placeholder="Digite seu username"
                    maxLength={30}
                    disabled={salvandoEditorPerfil}
                    style={profileEditorSheetInputStyle}
                    type="text"
                  />
                </label>

                <label style={profileEditorSheetFieldStyle}>
                  <span style={profileEditorSheetLabelStyle}>Biografia</span>

                  <textarea
                    value={bioPerfilEditor}
                    onChange={(event) =>
                      setBioPerfilEditor(
                        event.target.value.slice(0, BIO_MAX_LENGTH),
                      )
                    }
                    placeholder={bioPadraoAutor}
                    maxLength={BIO_MAX_LENGTH}
                    disabled={salvandoEditorPerfil}
                    style={profileEditorSheetTextareaStyle}
                  />
                </label>

                <span style={bioCounterStyle}>
                  {BIO_MAX_LENGTH - bioPerfilEditor.length} caracteres
                </span>

                <div style={profileEditorSheetActionsStyle}>
                  <button
                    type="button"
                    onClick={fecharEditorPerfil}
                    disabled={salvandoEditorPerfil}
                    style={profileEditorCancelButtonStyle}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={() => void salvarEdicaoPerfilAutor()}
                    disabled={salvandoEditorPerfil}
                    style={profileEditorSaveButtonStyle}
                  >
                    {salvandoEditorPerfil ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        <DenunciaModal
          aberto={
            denunciaPerfilAberta &&
            !podeEditarPerfil &&
            Boolean(perfilParaMostrar)
          }
          alvoTipo="perfil"
          alvoId={perfilParaMostrar?.autorId || ""}
          alvoTitulo={perfilParaMostrar?.nome || "Perfil"}
          alvoUrl={
            perfilParaMostrar?.autorId
              ? `/perfil-autor?userId=${encodeURIComponent(
                  perfilParaMostrar.autorId
                )}`
              : ""
          }
          onFechar={() => setDenunciaPerfilAberta(false)}
          onEnviada={() => {
            setDenunciaPerfilAberta(false);
            setMensagemAcao("Denúncia enviada para análise.");
          }}
        />

        <DenunciaModal
          aberto={
            Boolean(alvoDenunciaConteudoPerfil) &&
            !podeEditarPerfil
          }
          alvoTipo={alvoDenunciaConteudoPerfil?.alvoTipo || "post"}
          alvoId={alvoDenunciaConteudoPerfil?.alvoId || ""}
          alvoTitulo={
            alvoDenunciaConteudoPerfil?.alvoTitulo || "Conteúdo"
          }
          onFechar={() => setAlvoDenunciaConteudoPerfil(null)}
          onEnviada={() => {
            setAlvoDenunciaConteudoPerfil(null);
            setMensagemAcao("Denúncia enviada para análise.");
          }}
        />

        <section style={heroAtualStyle}>
          <div style={authorTopRowAtualStyle}>
            <ProfileAvatar
              autorNome={perfilParaMostrar.nome}
              avatar={avatarAutor}
              isDesktop={isDesktop}
              podeEditar={podeEditarPerfil}
              onEdit={abrirEditorPerfil}
            />

            <ProfileHeaderInfo
              autorNome={perfilParaMostrar.nome}
              isDesktop={isDesktop}
            >
              <ProfileStats
                avaliacaoDiarioPrivada={avaliacaoDiarioPrivada}
                avaliacaoEhDiario={avaliacaoResumoEhDiario}
                avaliacaoMedia={avaliacaoResumoPerfil.media}
                avaliacaoTotal={avaliacaoResumoPerfil.total}
                avaliacaoVisivel={avaliacaoResumoPerfilVisivel}
                autorNome={perfilParaMostrar.nome}
                isDesktop={isDesktop}
                language={language}
                obrasSeguidasHref={obrasSeguidasPerfilHref}
                obrasSeguidasTotal={obrasSeguidasPerfilTotal}
                seguidoresHref={seguidoresPerfilHref}
                seguidoresTotal={seguidoresTotal}
                seguindoHref={seguindoPerfilHref}
                seguindoTotal={seguindoTotalPerfil}
              />
            </ProfileHeaderInfo>
          </div>

          <ProfileBio
            bioFallback={bioAutor}
            bioPersonalizada={bioAutorPersonalizada}
            isDesktop={isDesktop}
            podeEditar={podeEditarPerfil}
            onEdit={abrirEditorPerfil}
          />

          <div
            style={
              podeEditarPerfil
                ? profileActionsAtualStyle
                : profileVisitorActionsAtualStyle
            }
          >
            {podeEditarPerfil ? (
              <ProfileOwnerActions
                mostrarDestaques={perfilSalvoAutor.mostrarDestaques}
                onEdit={abrirEditorPerfil}
                onShare={() => void copiarLinkPerfil()}
                onToggleHighlights={alternarDestaquesPerfil}
              />
            ) : (
              <>
                {!estadoBloqueioPerfil.existeBloqueio && (
                <button
                  type="button"
                  onClick={() => void alternarSeguirAutor()}
                  disabled={seguirUsuarioSalvando}
                  aria-label={
                    solicitacaoSeguimentoPendente
                      ? "Cancelar solicitação"
                      : seguindoPerfilAtual
                        ? "Deixar de seguir"
                        : "Seguir"
                  }
                  title={
                    solicitacaoSeguimentoPendente
                      ? "Cancelar solicitação"
                      : undefined
                  }
                  style={{
                    ...(seguindoPerfilAtual || solicitacaoSeguimentoPendente
                      ? profileActiveButtonStyle
                      : profilePrimaryButtonStyle),
                    opacity: seguirUsuarioSalvando ? 0.58 : 1,
                    cursor: seguirUsuarioSalvando ? "not-allowed" : "pointer",
                  }}
                >
                  {seguirUsuarioSalvando
                    ? "..."
                    : solicitacaoSeguimentoPendente
                      ? "Solicitado"
                      : seguindoPerfilAtual
                        ? "Seguindo"
                        : "Seguir"}
                </button>
                )}

                <ProfileVisitorSecondaryActions
                  mostrarDestaques={mostrarDestaquesVisitante}
                  obrasVisiveis={obrasPerfilVisivel}
                  onShare={() => void copiarLinkPerfil()}
                  onToggleHighlights={() =>
                    setMostrarDestaquesVisitante((valorAtual) => !valorAtual)
                  }
                />
              </>
            )}
          </div>

          <ProfileActionToast message={mensagemAcao} />

          {podeEditarPerfil && (
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={selecionarAvatarAutor}
              style={hiddenInputStyle}
            />
          )}

        </section>

        {exibirSecaoDestaques && (
            <ProfileHighlightsSection isDesktop={isDesktop}>
              <ProfileHighlightsHeader
                titleActions={
                  podeEditarPerfil && obrasEmDestaque.length > 0 ? (
                    <ProfileHighlightsLikeButton
                      onClick={() => void alternarCurtidaTopFivePerfil()}
                      salvando={topFiveCurtidaSalvando}
                      curtido={topFiveCurtidoPorMim}
                      totalFormatado={compactarNumeroPerfilAutor(topFiveCurtidasTotal)}
                      ariaLabel={`${
                        topFiveCurtidoPorMim
                          ? "Remover curtida do TOP 5"
                          : "Curtir TOP 5"
                      }. ${compactarNumeroPerfilAutor(topFiveCurtidasTotal)} ${
                        topFiveCurtidasTotal === 1 ? "curtida" : "curtidas"
                      }`}
                    />
                  ) : null
                }
                headerActions={
                  podeEditarPerfil ? (
                    <ProfileHighlightsEditLink href="/perfil-autor/top-5" />
                  ) : obrasEmDestaque.length > 0 ? (
                    <ProfileHighlightsLikeButton
                      onClick={() => void alternarCurtidaTopFivePerfil()}
                      salvando={topFiveCurtidaSalvando}
                      curtido={topFiveCurtidoPorMim}
                      totalFormatado={compactarNumeroPerfilAutor(topFiveCurtidasTotal)}
                      ariaLabel={`${
                        topFiveCurtidoPorMim
                          ? "Remover curtida do TOP 5"
                          : "Curtir TOP 5"
                      }. ${compactarNumeroPerfilAutor(topFiveCurtidasTotal)} ${
                        topFiveCurtidasTotal === 1 ? "curtida" : "curtidas"
                      }`}
                    />
                  ) : null
                }
              />

              {obrasEmDestaque.length === 0 ? (
                <ProfileHighlightsEmptyState
                  message={
                    podeEditarPerfil
                      ? "Monte seu TOP 5 para destacar suas obras favoritas."
                      : `${perfilParaMostrar.nome} nao montou top 5`
                  }
                />
              ) : (
                <ProfileHighlightsList isDesktop={isDesktop}>
                  {obrasEmDestaque.map((obra) => {
                    const obraHref =
                      obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
                    return (
                      <ProfileHighlightItem
                        key={`destaque-${obra.id}`}
                        href={obraHref}
                        titulo={obra.titulo}
                        capaStyle={criarCapaDestaquePerfilAutor(obra.capa)}
                      />
                    );
                  })}
                </ProfileHighlightsList>
              )}
            </ProfileHighlightsSection>
        )}

        {autenticacaoCarregada &&
          autorPodeReceberAvaliacao &&
          !perfilPertenceAoUsuario && (
          <ProfileRatingBox
            ariaLabel="Avaliação do autor"
            entidadeAvaliacao="autor"
            isDesktop={isDesktop}
            keyPrefix="avaliacao-autor"
            minhaNota={avaliacaoAutor.minhaNota}
            titulo="AVALIE ESTE AUTOR"
            onRate={avaliarAutor}
          />
        )}

        {autenticacaoCarregada &&
          perfilUsaAvaliacaoDiario &&
          !perfilPertenceAoUsuario &&
          avaliacaoDiario.visivel &&
          avaliacaoDiario.podeAvaliar && (
            <ProfileRatingBox
              ariaLabel="Avaliação do Diário"
              entidadeAvaliacao="Diário"
              isDesktop={isDesktop}
              keyPrefix="avaliacao-diario-perfil"
              minhaNota={avaliacaoDiario.minhaNota}
              salvando={avaliacaoDiario.salvando}
              titulo="AVALIE ESTE DIÁRIO"
              onRate={avaliarDiarioPerfil}
            />
          )}

        {totalAbasPerfilVisiveis > 0 && (
          <ProfileSectionTabs
            abaAtiva={abaPerfil}
            bibliotecaVisivel={bibliotecaPerfilVisivel}
            comunidadeVisivel={comunidadePerfilVisivel}
            diarioVisivel={diarioPerfilVisivel}
            obrasVisivel={obrasPerfilVisivel}
            sobreVisivel={sobrePerfilVisivel}
            totalAbasVisiveis={totalAbasPerfilVisiveis}
            onSelect={selecionarAbaPerfil}
          />
        )}

        {conteudoPrivadoBloqueado && (
          <PrivateProfileNotice
            perfilBloqueadoEntreUsuarios={perfilBloqueadoEntreUsuarios}
          />
        )}

        {abaPerfil === "biblioteca" && bibliotecaPerfilVisivel && (
          <ProfileLibrarySection isDesktop={isDesktop}>
            <LibraryTabs
              abaAtiva={abaBibliotecaPerfil}
              isDesktop={isDesktop}
              onSelect={setAbaBibliotecaPerfil}
            />

            {diarioPerfil.carregando ? (
              <LoadingSpinner label="Carregando biblioteca" compacto />
            ) : itensBibliotecaAtivos.length === 0 ? (
              <ProfileSectionEmptyState message={`Sua Biblioteca ainda não tem itens em ${rotuloBibliotecaAtiva}.`} />
            ) : (
              <ProfileWorksGrid isDesktop={isDesktop}>
                {itensBibliotecaAtivos.map((item) => {
                  const obraHref =
                    item.obra.link ||
                    `/obra/${
                      item.obra.slug || criarSlugBase(item.obra.titulo)
                    }`;
                  const capituloHref = item.capitulo
                    ? criarHrefLeituraCapituloPerfilAutor(
                        item.obra,
                        item.capitulo,
                        item.numeroCapitulo || 1,
                      )
                    : obraHref;
                  const totalCurtidasBiblioteca =
                    obterTotalCurtidasObraPerfilAutor(
                      item.obra,
                      totaisInteracoesObras,
                    );
                  const totalComentariosBiblioteca =
                    obterTotalComentariosObraPerfilAutor(
                      item.obra,
                      totaisInteracoesObras,
                    );
                  const visualizacoesBiblioteca = compactarNumeroPerfilAutor(
                    item.obra.visualizacoes || 0,
                  );

                  return (
                    <LibraryItemCard
                      key={item.chave}
                      item={item}
                      href={capituloHref}
                      isDesktop={isDesktop}
                      menuAberto={bibliotecaMenuAbertoChave === item.chave}
                      totalComentarios={totalComentariosBiblioteca}
                      totalCurtidas={totalCurtidasBiblioteca}
                      visualizacoes={visualizacoesBiblioteca}
                      onToggleMenu={() =>
                        setBibliotecaMenuAbertoChave((chaveAtual) =>
                          chaveAtual === item.chave ? "" : item.chave,
                        )
                      }
                    />
                  );
                })}
              </ProfileWorksGrid>
            )}
          </ProfileLibrarySection>
        )}

        {abaPerfil === "diario" && diarioPerfilVisivel && (
          <ProfileDiaryPanel
            isDesktop={isDesktop}
            title={
              podeEditarPerfil
                ? "Meu Diário"
                : `Diário de ${perfilParaMostrar.nome}`
            }
            href={`/listas?modo=perfil&origem=diario&categoria=tudo${
              perfilParaMostrar?.autorId.trim()
                ? `&usuario=${encodeURIComponent(
                    perfilParaMostrar.autorId.trim(),
                  )}`
                : ""
            }`}
            linkAriaLabel="Abrir tudo na página Listas"
            linkTitle="Ver tudo"
            linkLabel="+"
            getIsLoading={() => diarioPerfil.carregando}
            getIsEmpty={() => itensDiarioTudo.length === 0}
            emptyMessage={
              podeEditarPerfil
                ? "Suas obras e atividades de leitura aparecerão aqui."
                : "Este perfil ainda não compartilhou itens no Diário."
            }
            renderItems={() =>
              itensDiarioTudo.map((item) => {
                const obra = item.obra;

                if (!obra) {
                  return null;
                }

                const parametrosLista = new URLSearchParams({
                  modo: "perfil",
                  origem: "diario",
                  categoria: "tudo",
                  obra: obra.id,
                });
                const perfilIdLista =
                  perfilParaMostrar?.autorId.trim() || "";

                if (perfilIdLista) {
                  parametrosLista.set("usuario", perfilIdLista);
                }

                const hrefLista = `/listas?${parametrosLista.toString()}`;

                return (
                  <DiarySummaryCard
                    key={obra.id || item.chave}
                    href={hrefLista}
                    obra={obra}
                  />
                );
              })
            }
          />
        )}

        {abaPerfil === "comunidade" && comunidadePerfilVisivel && (
          <ProfileCommunitySection isDesktop={isDesktop}>
            <ProfileCommunityHeader
              title={
                language === "en"
                  ? `${perfilParaMostrar.nome}'s Community`
                  : language === "es"
                    ? `Comunidad de ${perfilParaMostrar.nome}`
                    : `Comunidade de ${perfilParaMostrar.nome}`
              }
            />

            {comunidadePerfil.carregando ? (
              <LoadingSpinner
                label="Carregando publicações da Comunidade"
                compacto
              />
            ) : (
              <>
                <ProfileCommunityStatsGrid isDesktop={isDesktop}>
                  <ProfileCommunityStatCard
                    href={comunidadeAutorHref}
                    ariaLabel={`Abrir publicações de ${perfilParaMostrar.nome} na comunidade`}
                    value={compactarNumeroPerfilAutor(
                      comunidadePerfil.totalPublicacoes,
                    )}
                    title="PUBLICAÇÕES"
                    description="posts do perfil"
                  />

                  <ProfileCommunityStatCard
                    href={comunidadeAutorTeoriasHref}
                    ariaLabel={`Abrir teorias de ${perfilParaMostrar.nome} na comunidade`}
                    value={compactarNumeroPerfilAutor(
                      comunidadePerfil.totalTeorias,
                    )}
                    title="TEORIAS"
                    description="discussões"
                  />

                  <ProfileCommunityStatCard
                    href={comunidadeAutorReviewsHref}
                    ariaLabel={`Abrir reviews de ${perfilParaMostrar.nome} na comunidade`}
                    value={compactarNumeroPerfilAutor(
                      comunidadePerfil.totalReviews,
                    )}
                    title="REVIEWS"
                    description="opiniões"
                  />
                </ProfileCommunityStatsGrid>

                {comunidadePerfil.erro ? (
                  <ProfileCommunityNotice
                    icon="!"
                    title="Comunidade indisponível"
                    description={comunidadePerfil.erro}
                  />
                ) : comunidadePerfil.publicacoesRecentes.length === 0 ? (
                  <ProfileCommunityNotice
                    icon="💬"
                    title={
                      podeEditarPerfil
                        ? "Sua comunidade ainda está vazia"
                        : "Nenhuma publicação por aqui ainda"
                    }
                    description={
                      podeEditarPerfil
                        ? "Publique avisos, bastidores, teorias e chamadas para aproximar leitores das suas obras."
                        : `Quando ${perfilParaMostrar.nome} publicar posts, teorias ou reviews, eles aparecerão nesta área.`
                    }
                  />
                ) : (
                  <ProfileCommunityRecentPostsSection title="Publicações recentes">

                    <ProfileCommunityRecentPostsList isDesktop={isDesktop}>
                      {comunidadePerfil.publicacoesRecentes.map(
                        (publicacao) => (
                          <ProfileCommunityPostItem key={publicacao.id}>
                            <ProfileCommunityPostLink
                              href={criarHrefPublicacaoComunidadePerfil(
                                publicacao.id,
                              )}
                              paddingBottom={
                                podeEditarPerfil ? "10px" : "42px"
                              }
                              ariaLabel={`Abrir ${publicacao.tipoPublicacao} na Comunidade`}
                            >
                              <ProfileCommunityPostHeader
                                typeLabel={publicacao.tipoPublicacao}
                                dateLabel={dataDiarioPerfilFormatada(
                                  publicacao.criadoEm,
                                )}
                              />

                              <ProfileCommunityPostBody>
                                <ProfileCommunityPostSummary>
                                  {criarResumoPublicacaoComunidadePerfil(
                                    publicacao,
                                  )}
                                </ProfileCommunityPostSummary>

                                {analisarEnquetePublicacaoComunidadePerfil(
                                  publicacao,
                                ).totalOpcoes >= 2 && (
                                  <ProfileCommunityPostPollInfo>
                                    Enquete
                                    <span aria-hidden="true">•</span>
                                    {
                                      analisarEnquetePublicacaoComunidadePerfil(
                                        publicacao,
                                      ).totalOpcoes
                                    }{" "}
                                    opções
                                  </ProfileCommunityPostPollInfo>
                                )}
                              </ProfileCommunityPostBody>

                              {publicacao.obraRelacionada && (
                                <ProfileCommunityPostWork>
                                  <span>OBRA</span>
                                  <strong data-historietas-user-content="true">
                                    {publicacao.obraRelacionada}
                                  </strong>
                                </ProfileCommunityPostWork>
                              )}
                            </ProfileCommunityPostLink>

                            {!podeEditarPerfil && (
                              <ProfileCommunityPostReportButton
                                onClick={() =>
                                  abrirDenunciaConteudoPerfil(
                                    "post",
                                    publicacao.id,
                                    criarResumoPublicacaoComunidadePerfil(
                                      publicacao,
                                    ),
                                  )
                                }
                              />
                            )}
                          </ProfileCommunityPostItem>
                        ),
                      )}
                    </ProfileCommunityRecentPostsList>
                  </ProfileCommunityRecentPostsSection>
                )}
              </>
            )}
          </ProfileCommunitySection>
        )}

        {abaPerfil === "sobre" && sobrePerfilVisivel && (
          <ProfileAboutSection>
            <ProfileAboutHero>
              <ProfileAboutTitle>
                Sobre {perfilParaMostrar.nome}
              </ProfileAboutTitle>

              <ProfileAboutTextRow>
                <ProfileAboutText
                  userContent={
                    bioSobreAutorEhPadrao ? undefined : "true"
                  }
                >
                  {bioSobreAutorExibido}
                </ProfileAboutText>

                {podeEditarPerfil && (
                  <ProfileAboutEditButton
                    onClick={() => setEditorSobreAberto((aberto) => !aberto)}
                  />
                )}
              </ProfileAboutTextRow>

              {podeEditarPerfil && editorSobreAberto && (
                <ProfileAboutEditor>
                  <ProfileAboutTextarea
                    value={perfilSalvoAutor.sobreBio}
                    onChange={(event) => atualizarBioSobreAutor(event.target.value)}
                    placeholder={bioAutor}
                    maxLength={SOBRE_BIO_MAX_LENGTH}
                  />

                  <ProfileAboutCounter>
                    {caracteresRestantesBioSobre} caracteres
                  </ProfileAboutCounter>
                </ProfileAboutEditor>
              )}
            </ProfileAboutHero>

            <ProfileAboutContentGrid>
              <ProfileAboutPanel>
                <ProfileAboutPanelTitle>Especialidades</ProfileAboutPanelTitle>

                <ProfileAboutChips>
                  {(generosPrincipaisPerfil.length > 0
                    ? generosPrincipaisPerfil
                    : ["Histórias variadas"]
                  ).map((genero) => (
                    <ProfileAboutChip key={`sobre-genero-${genero}`}>
                      {genero}
                    </ProfileAboutChip>
                  ))}
                </ProfileAboutChips>
              </ProfileAboutPanel>

              <ProfileAboutPanel>
                <ProfileAboutPanelTitle>Números do perfil</ProfileAboutPanelTitle>

                <ProfileAboutMetricsGrid>
                  <ProfileAboutMetricCard>
                    <ProfileAboutMetricNumber>
                      {compactarNumeroPerfilAutor(perfilParaMostrar.totalPublicadas)}
                    </ProfileAboutMetricNumber>
                    <ProfileAboutMetricLabel>publicadas</ProfileAboutMetricLabel>
                  </ProfileAboutMetricCard>

                  <ProfileAboutMetricCard>
                    <ProfileAboutMetricNumber>
                      {compactarNumeroPerfilAutor(perfilParaMostrar.totalCapitulos)}
                    </ProfileAboutMetricNumber>
                    <ProfileAboutMetricLabel>capítulos</ProfileAboutMetricLabel>
                  </ProfileAboutMetricCard>

                  <ProfileAboutMetricCard>
                    <ProfileAboutMetricNumber>
                      {compactarNumeroPerfilAutor(perfilParaMostrar.totalCurtidas)}
                    </ProfileAboutMetricNumber>
                    <ProfileAboutMetricLabel>curtidas</ProfileAboutMetricLabel>
                  </ProfileAboutMetricCard>

                  <ProfileAboutMetricCard>
                    <ProfileAboutMetricNumber>
                      {compactarNumeroPerfilAutor(totalVisualizacoesPerfil)}
                    </ProfileAboutMetricNumber>
                    <ProfileAboutMetricLabel>visualizações</ProfileAboutMetricLabel>
                  </ProfileAboutMetricCard>
                </ProfileAboutMetricsGrid>
              </ProfileAboutPanel>

              <ProfileAboutPanel>
                <ProfileAboutPanelTitle>Atividade</ProfileAboutPanelTitle>

                <ProfileAboutRows>
                  <ProfileAboutRow>
                    obras no perfil
                    <strong>{perfilParaMostrar.obras.length}</strong>
                  </ProfileAboutRow>
                  <ProfileAboutRow>
                    rascunhos em desenvolvimento
                    <strong>{totalRascunhosPerfil}</strong>
                  </ProfileAboutRow>
                  <ProfileAboutRow>
                    comentários recebidos
                    <strong>{perfilParaMostrar.totalComentarios}</strong>
                  </ProfileAboutRow>
                  <ProfileAboutRow>
                    concluídas por leitores
                    <strong>{obrasConcluidasPerfilTotal}</strong>
                  </ProfileAboutRow>
                  {totalObrasSemCapitulosPerfil > 0 && (
                    <ProfileAboutRow>
                      sem capítulos ainda
                      <strong>{totalObrasSemCapitulosPerfil}</strong>
                    </ProfileAboutRow>
                  )}
                </ProfileAboutRows>
              </ProfileAboutPanel>
            </ProfileAboutContentGrid>

            <ProfileAboutMemberSince>
              Na Historietas desde {entradaHistorietasPerfil}
            </ProfileAboutMemberSince>

            {atividadesPerfilVisivel && (
              <ProfileAboutRecentActivity
                expanded={atividadeSobreAberta}
                loading={diarioPerfil.carregando}
                items={diarioPerfil.atividades}
                onToggle={() =>
                  setAtividadeSobreAberta((valorAtual) => !valorAtual)
                }
              />
            )}
          </ProfileAboutSection>
        )}

        {abaPerfil === "obras" && obrasPerfilVisivel && (
          <ProfileWorksSection>
            {obrasDoPerfilFiltradas.length === 0 ? (
              <ProfileSectionEmptyState
                message={perfilParaMostrar.obras.length === 0
                  ? podeEditarPerfil
                    ? "Você ainda não publicou obras. Seu perfil continua ativo como leitor, com Diário e Comunidade."
                    : "Este perfil ainda não publicou obras. O Diário e a Comunidade continuam disponíveis."
                  : "Nenhuma obra encontrada."}
              />
            ) : (
              <ProfileWorksGrid isDesktop={isDesktop}>
                {obrasDoPerfilFiltradas.map((obra) => {
                  const obraHref =
                    obra.link ||
                    `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
                  const totalCurtidas = obterTotalCurtidasObraPerfilAutor(
                    obra,
                    totaisInteracoesObras,
                  );
                  const totalComentarios = obterTotalComentariosObraPerfilAutor(
                    obra,
                    totaisInteracoesObras,
                  );
                  const visualizacoesObra = compactarNumeroPerfilAutor(
                    obra.visualizacoes,
                  );
                  const menuObraAberto = obraMenuAbertoId === obra.id;

                  return (
                    <ProfileWorkCard key={obra.id}>
                      <ProfileWorkCoverLink href={obraHref}>
                        <div
                          style={criarCapaGridPerfilAutor(obra.capa, isDesktop)}
                        >
                          <ProfileWorkCoverOverlay>
                            <ProfileWorkCoverTitle>
                              {obra.titulo}
                            </ProfileWorkCoverTitle>

                            <ProfileWorkCoverMetrics>
                              <span>👁 {visualizacoesObra}</span>
                              <span>
                                <ProfileWorkCoverLikeIcon />{" "}
                                {totalCurtidas}
                              </span>
                              <span>
                                <ProfileWorkCoverCommentIcon />{" "}
                                {totalComentarios}
                              </span>
                            </ProfileWorkCoverMetrics>
                          </ProfileWorkCoverOverlay>
                        </div>
                      </ProfileWorkCoverLink>

                      <ProfileWorkMenuAnchor>
                        <ProfileWorkOptionsButton
                          onClick={() =>
                            setObraMenuAbertoId((idAtual) =>
                              idAtual === obra.id ? "" : obra.id,
                            )
                          }
                          ariaLabel={`Abrir opções de ${obra.titulo}`}
                          expanded={menuObraAberto}
                        />
                      </ProfileWorkMenuAnchor>
                    </ProfileWorkCard>
                  );
                })}
              </ProfileWorksGrid>
            )}
          </ProfileWorksSection>
        )}

        {obraMenuAberta &&
          (() => {
            const obra = obraMenuAberta;
            const ultimoCapitulo =
              encontrarCapituloParaContinuar(obra) ||
              obra.capitulos[obra.capitulos.length - 1] ||
              null;
            const numeroUltimoCapitulo = ultimoCapitulo
              ? obra.capitulos.findIndex(
                  (capitulo) => capitulo.id === ultimoCapitulo.id,
                ) + 1
              : 0;
            const capituloHref = ultimoCapitulo
              ? criarHrefLeituraCapituloPerfilAutor(
                  obra,
                  ultimoCapitulo,
                  numeroUltimoCapitulo || 1,
                )
              : "";
            const obraFavorita = colecaoTemObraPerfilBiblioteca(obrasFavoritas, obra);
            const obraConcluida = colecaoTemObraPerfilBiblioteca(obrasConcluidas, obra);
            const totalCurtidas = obterTotalCurtidasObraPerfilAutor(
              obra,
              totaisInteracoesObras,
            );
            const totalComentarios = obterTotalComentariosObraPerfilAutor(
              obra,
              totaisInteracoesObras,
            );
            const totalSalvos = obterTotalSalvosObraPerfilAutor(
              obra,
              totaisInteracoesObras,
            );
            const visualizacoesObra = compactarNumeroPerfilAutor(
              obra.visualizacoes,
            );
            const formatoObra = formatarFormatoPerfilAutor(obra.formato);
            const tagPrincipalObra = obterTagPrincipalPerfilAutor(obra);
            const metaObraSheet = [
              formatarGeneroPerfilAutor(obra.genero),
              formatoObra,
              tagPrincipalObra,
              mostrarClassificacao(obra) ? obra.classificacaoIndicativa : "",
            ]
              .filter(Boolean)
              .map((item) => traduzirTextoPerfilAutor(item, language))
              .join(" • ");
            const metricasObraSheet = [
              `👁 ${visualizacoesObra}`,
              `❤️ ${totalCurtidas}`,
              `💬 ${totalComentarios}`,
              `🔖 ${totalSalvos}`,
              `📚 ${obra.capitulos.length}`,
            ]
              .filter(Boolean)
              .join(" • ");

            return (
              <ProfileWorkActionSheetOverlay
                onClick={() => setObraMenuAbertoId("")}
              >
                <ProfileWorkActionSheetPanel
                  ariaLabel={`Ações da obra ${obra.titulo}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <ProfileWorkActionSheetHandle />

                  <ProfileWorkActionSheetHeader>
                      <ProfileWorkActionSheetTitle>
                        {obra.titulo}
                      </ProfileWorkActionSheetTitle>

                      <ProfileWorkActionSheetAuthor>
                        Por {obra.autor}
                      </ProfileWorkActionSheetAuthor>

                      <ProfileWorkActionSheetMeta>
                        {metaObraSheet}
                      </ProfileWorkActionSheetMeta>

                      <ProfileWorkActionSheetMetrics>
                        {metricasObraSheet}
                      </ProfileWorkActionSheetMetrics>
                  </ProfileWorkActionSheetHeader>

                  <ProfileWorkActionSheetActions>
                    {ultimoCapitulo && (
                      <Link
                        href={capituloHref}
                        onClick={() => setObraMenuAbertoId("")}
                        style={workActionSheetItemStyle}
                      >
                        Ler
                      </Link>
                    )}

                    {!podeEditarPerfil && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setObraMenuAbertoId("");
                            void alternarFavoritoObra(obra.id);
                          }}
                          style={
                            obraFavorita
                              ? workActionSheetItemActiveStyle
                              : workActionSheetItemStyle
                          }
                        >
                          <span>
                            {obraFavorita
                              ? "Remover da lista"
                              : "Adicionar à lista"}
                          </span>
                          <span style={criarProfileSelectionDotStyle(obraFavorita)}>
                            {obraFavorita ? "✓" : ""}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setObraMenuAbertoId("");
                            void alternarConcluidoObra(obra.id);
                          }}
                          style={
                            obraConcluida
                              ? workActionSheetItemActiveStyle
                              : workActionSheetItemStyle
                          }
                        >
                          <span>
                            {obraConcluida
                              ? "Marcar como não concluída"
                              : "Concluir"}
                          </span>
                          <span style={criarProfileSelectionDotStyle(obraConcluida)}>
                            {obraConcluida ? "✓" : ""}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            abrirDenunciaConteudoPerfil(
                              "obra",
                              obra.id,
                              obra.titulo,
                            )
                          }
                          style={workActionSheetDangerItemStyle}
                        >
                          Denunciar obra
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => void compartilharObraPerfilAutor(obra)}
                      style={workActionSheetItemStyle}
                    >
                      Compartilhar
                    </button>
                  </ProfileWorkActionSheetActions>
                </ProfileWorkActionSheetPanel>
              </ProfileWorkActionSheetOverlay>
            );
          })()}

        {bibliotecaMenuAberto &&
          (() => {
            const item = bibliotecaMenuAberto;
            const obra = item.obra;
            const obraHref =
              obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
            const capituloHref = item.capitulo
              ? criarHrefLeituraCapituloPerfilAutor(
                  obra,
                  item.capitulo,
                  item.numeroCapitulo || 1,
                )
              : obraHref;
            const obraFavorita = colecaoTemObraPerfilBiblioteca(
              obrasFavoritas,
              obra,
            );
            const obraConcluida = colecaoTemObraPerfilBiblioteca(
              obrasConcluidas,
              obra,
            );
            const obraNoQueroLer = colecaoTemObraPerfilBiblioteca(
              obrasSeguidasBiblioteca,
              obra,
            );
            const totalCapitulos = obra.capitulos.length;
            const progresso = Math.max(
              0,
              Math.min(100, Math.round(obra.progressoLeitura || 0)),
            );
            const metaSheet = `${
              item.tipoDiario === "lendo"
                ? "Lendo"
                : item.tipoDiario === "favorita"
                  ? "Favorita"
                  : item.tipoDiario === "concluida"
                    ? "Concluída"
                    : item.tipoDiario === "quero_ler"
                      ? "Quero ler"
                      : "Biblioteca"
            } • ${
              item.capitulo
                ? `Capítulo ${item.numeroCapitulo || 1} de ${totalCapitulos || 1}`
                : totalCapitulos > 0
                  ? `${totalCapitulos} ${totalCapitulos === 1 ? "capítulo" : "capítulos"}`
                  : "Obra"
            } • ${progresso}% concluído`;

            return (
              <ProfileWorkActionSheetOverlay
                onClick={() => setBibliotecaMenuAbertoChave("")}
              >
                <ProfileWorkActionSheetPanel
                  ariaLabel={`Ações da Biblioteca ${obra.titulo}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <ProfileWorkActionSheetHandle />

                  <ProfileWorkActionSheetHeader>
                      <ProfileWorkActionSheetTitle>
                        {obra.titulo}
                      </ProfileWorkActionSheetTitle>
                      <ProfileWorkActionSheetMeta>{metaSheet}</ProfileWorkActionSheetMeta>
                  </ProfileWorkActionSheetHeader>

                  <ProfileWorkActionSheetActions>
                    <Link
                      href={capituloHref}
                      onClick={() => setBibliotecaMenuAbertoChave("")}
                      style={workActionSheetItemStyle}
                    >
                      Ler capítulo
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setBibliotecaMenuAbertoChave("");
                        void alternarObraSeguindoBibliotecaPerfil(
                          obra,
                          !obraNoQueroLer,
                        );
                      }}
                      style={
                        obraNoQueroLer
                          ? workActionSheetItemActiveStyle
                          : workActionSheetItemStyle
                      }
                    >
                      <span>
                        {obraNoQueroLer ? "Remover do Quero ler" : "Quero ler"}
                      </span>
                      <span style={criarProfileSelectionDotStyle(obraNoQueroLer)}>
                        {obraNoQueroLer ? "✓" : ""}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBibliotecaMenuAbertoChave("");
                        void alternarFavoritoObra(obra.id);
                      }}
                      style={
                        obraFavorita
                          ? workActionSheetItemActiveStyle
                          : workActionSheetItemStyle
                      }
                    >
                      <span>
                        {obraFavorita ? "Remover favorita" : "Favoritar"}
                      </span>
                      <span style={criarProfileSelectionDotStyle(obraFavorita)}>
                        {obraFavorita ? "✓" : ""}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBibliotecaMenuAbertoChave("");
                        void alternarConcluidoObra(obra.id);
                      }}
                      style={
                        obraConcluida
                          ? workActionSheetItemActiveStyle
                          : workActionSheetItemStyle
                      }
                    >
                      <span>
                        {obraConcluida ? "Marcar como não concluída" : "Concluir"}
                      </span>
                      <span style={criarProfileSelectionDotStyle(obraConcluida)}>
                        {obraConcluida ? "✓" : ""}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBibliotecaMenuAbertoChave("");
                        void removerItemBibliotecaPerfil(item);
                      }}
                      style={workActionSheetItemStyle}
                    >
                      {abaBibliotecaPerfil === "lendo-agora"
                        ? "Parar leitura"
                        : abaBibliotecaPerfil === "historico"
                          ? "Limpar histórico"
                          : "Remover"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBibliotecaMenuAbertoChave("");
                        void compartilharObraPerfilAutor(obra);
                      }}
                      style={workActionSheetItemStyle}
                    >
                      Compartilhar
                    </button>
                  </ProfileWorkActionSheetActions>
                </ProfileWorkActionSheetPanel>
              </ProfileWorkActionSheetOverlay>
            );
          })()}

      </section>
    </main>
  );
}

export default function PerfilAutorPage() {
  return (
    <>
      <PerfilAutorLanguageBridge />
      <Suspense
      fallback={
        <main style={pageStyle}>
          <style>{`${historietasThemeCss}${perfilAutorThemeCss}`}</style>
          <LoadingSpinner label="Carregando perfil" />
        </main>
      }
    >
      <PerfilAutorPageContent />
      </Suspense>
    </>
  );
}
