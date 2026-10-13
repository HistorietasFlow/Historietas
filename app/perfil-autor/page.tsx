"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Suspense, useRef, useState } from "react";
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
  normalizarAbaPerfilAutor,
  normalizarUsernamePerfilAutor,
} from "./lib/profile-formatters";
import {
  type IdentidadeAutenticadaPerfilAutor,
} from "./lib/profile-auth-identity";
import { criarPerfilUsuarioRemotoComoAutor } from "./lib/data-normalizers";
import {
  obterAriaLabelsEstatisticasComunidadePerfilAutor,
  obterAvisoComunidadeVaziaPerfilAutor,
  comunidadeSemPublicacoesRecentesPerfilAutor,
  obterDadosPublicacaoRecenteComunidadePerfilAutor,
  obterPaddingInferiorPublicacaoComunidadePerfilAutor,
  obterTituloComunidadePerfilAutor,
  obterValoresEstatisticasComunidadePerfilAutor,
} from "./lib/profile-community-publication-utils";
import {
  dataDiarioPerfilFormatada,
  obterMensagemDiarioVazioPerfilAutor,
  obterTituloDiarioPerfilAutor,
} from "./lib/profile-diary-local-utils";
import {
  criarHrefListaDiarioPerfilAutor,
  diarioSemItensPerfilAutor,
} from "./lib/profile-diary-item-utils";
import { montarItensDiarioTudoPerfil } from "./lib/profile-diary-merge-utils";
import { criarLinksComunidadePerfilAutor } from "./lib/profile-community-links";
import { montarPerfisAutoresPorObras } from "./lib/profile-author-groups";
import {
  obterVisibilidadeAbasPerfilAutor,
  obterVisibilidadeConteudosAbasPerfilAutor,
} from "./lib/profile-tab-visibility-utils";
import { resolverEstadoPerfilAutor } from "./lib/profile-resolution-utils";
import {
  obterApresentacaoBotaoSeguimentoPerfilAutor,
  obterDadosAcaoSeguimentoPerfilAutor,
  obterEstadoSeguimentoPerfilAutor,
} from "./lib/profile-follow-display-utils";
import {
  alternarIdentificadorMenuPerfilAutor,
  obterAriaLabelCopiarUsernamePerfilAutor,
  obterBioSobreExibicaoPerfilAutor,
  obterDadosDenunciaConteudoPerfilAutor,
  obterDadosNotificacoesPerfilAutor,
  obterDadosDenunciaPerfilAutor,
  obterDadosExibicaoPerfilAutor,
  obterVisibilidadeDenunciasPerfilAutor,
  limitarTextoPerfilAutor,
  obterCaracteresRestantesPerfilAutor,
  obterIndicadorSelecaoPerfilAutor,
  obterInicialAvatarPerfilAutor,
  obterRotuloAcaoBloqueioPerfilAutor,
  obterTituloSobrePerfilAutor,
  obterUsernameExibidoPerfilAutor,
  obterRotuloVisibilidadeUsernamePerfilAutor,
  obterRotulosAcoesEditorPerfilAutor,
} from "./lib/profile-display-utils";
import {
  obterEstadoAvaliacaoPerfilAutor,
  obterVisibilidadeAcoesAvaliacaoPerfilAutor,
} from "./lib/profile-rating-display-utils";
import {
  obterDadosCardBibliotecaPerfilAutor,
  obterDadosCardObraPerfilAutor,
  obterDadosCurtidaTopFivePerfilAutor,
  obterMensagemObrasVaziasPerfilAutor,
  obterMensagemTopFiveVazioPerfilAutor,
  obterDadosSheetBibliotecaPerfilAutor,
  obterDadosSheetObraPerfilAutor,
  obterRotulosAcoesColecoesObraPerfilAutor,
  obterHrefObraPerfilAutor,
  obterObraMenuAbertaPerfilAutor,
  obterObrasDestaquePerfilAutor,
  obterObrasVisiveisPerfilAutor,
  obrasSemResultadosPerfilAutor,
  obterTotalObrasConcluidasPerfilAutor,
  obterVisibilidadeDestaquesPerfilAutor,
} from "./lib/profile-work-display-utils";
import { selecionarItensBibliotecaPerfil } from "./lib/profile-library-active-items";
import { montarItensBibliotecaPerfilAutor } from "./lib/profile-library-items-builder";
import { obterTotaisBibliotecaPerfilAutor } from "./lib/profile-library-totals";
import { obterResumoEstatisticasPerfilAutor } from "./lib/profile-summary-stats";
import {
  bibliotecaSemItensAtivosPerfilAutor,
  encontrarItemBibliotecaMenuAberto,
  obterMetaMenuBibliotecaPerfil,
  obterRotuloAcaoRemoverBibliotecaPerfil,
  obterMensagemBibliotecaVaziaPerfil,
  obterRotulosAcoesColecoesBibliotecaPerfil,
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
  obterEstilosResponsivosPerfilAutor,
  criarProfileSelectionDotStyle,
  criarCapaDestaquePerfilAutor,
  criarCapaGridPerfilAutor,
  workActionSheetItemStyle,
  workActionSheetDangerItemStyle,
  workActionSheetItemActiveStyle,
  perfilAutorThemeCss,
  pageStyle,
  logoMarkButtonStyle,
  logoTextButtonStyle,
  logoMarkStyle,
  logoTextStyle,
  profileHeaderLogoStyle,
  profileMenuButtonStyle,
  profileMenuIconStyle,
  profileMenuIconLineStyle,
  menuOverlayStyle,
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
  avatarErrorStyle,
  bioCounterStyle,
  profilePrimaryButtonStyle,
  profileActiveButtonStyle,
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
  const temAvatarPerfilEditor = Boolean(avatarPerfilEditor);
  const {
    rotuloAcaoAvatar,
    rotuloSalvarEditor,
  } = obterRotulosAcoesEditorPerfilAutor({
    temAvatar: temAvatarPerfilEditor,
    salvando: salvandoEditorPerfil,
  });
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
  const {
    notificacoesNaoLidasFormatadas,
    ariaLabelNotificacoes,
    ariaLabelBadgeNotificacoes,
    temNotificacoesNaoLidas,
  } = obterDadosNotificacoesPerfilAutor(notificacoesNaoLidas);

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

  const perfilUsuarioRemotoComoAutor = perfilUsuarioRemoto?.userId
    ? criarPerfilUsuarioRemotoComoAutor(perfilUsuarioRemoto)
    : null;

  const {
    autorNaoEncontrado,
    perfilDoUsuarioLogado,
    perfilParaMostrar,
    perfilPertenceAoUsuario,
    redirecionandoParaLogin,
  } = resolverEstadoPerfilAutor({
    perfisAutores,
    autorSelecionado,
    autorIdSelecionado,
    usuarioIdLogado,
    perfilUsuarioRemotoComoAutor,
    autenticacaoCarregada,
  });
  const perfilAutorId = perfilParaMostrar?.autorId || "";
  const perfilNome = perfilParaMostrar?.nome || "";
  const obrasPerfil = perfilParaMostrar?.obras || [];
  const totalObrasPerfil = obrasPerfil.length;

  usePerfilAutorLoginRedirect({
    redirecionandoParaLogin,
  });

  usePerfilAutorTopFiveStorageSync({
    perfilAutorId,
    usuarioIdLogado,
    setTopFiveObraIds,
  });

  usePerfilAutorTopFiveLikesSync({
    perfilAutorId,
    usuarioIdLogado,
    setTopFiveCurtidasTotal,
    setTopFiveCurtidoPorMim,
  });

  const podeEditarPerfil = perfilPertenceAoUsuario;
  const perfilVisitante = !podeEditarPerfil;
  const editorPerfilVisivel = podeEditarPerfil && editorPerfilAberto;
  const editorSobreVisivel = podeEditarPerfil && editorSobreAberto;
  const bloqueadoPorMim = estadoBloqueioPerfil.bloqueadoPorMim;
  const existeBloqueioPerfil = estadoBloqueioPerfil.existeBloqueio;
  const menuBloqueioStyle = bloqueadoPorMim
    ? menuItemStyle
    : menuDangerItemStyle;
  const rotuloAcaoBloqueioPerfil = obterRotuloAcaoBloqueioPerfilAutor({
    bloqueadoPorMim,
    salvando: bloqueioPerfilSalvando,
  });

  const {
    perfilBloqueadoEntreUsuarios,
    obrasPerfilVisivel,
    sobrePerfilVisivel,
    diarioPerfilVisivel,
    comunidadePerfilVisivel,
    bibliotecaPerfilVisivel,
    atividadesPerfilVisivel,
    totalAbasPerfilVisiveis,
    temAbasPerfilVisiveis,
    conteudoPrivadoBloqueado,
    primeiraAbaPerfilVisivel,
  } = obterVisibilidadeAbasPerfilAutor({
    perfilPertenceAoUsuario,
    existeBloqueio: existeBloqueioPerfil,
    privacidadeCarregando: privacidadePerfilCarregando,
    permissoes: permissoesAbasPerfil,
  });
  const {
    bibliotecaPerfilAtiva,
    diarioPerfilAtivo,
    comunidadePerfilAtiva,
    sobrePerfilAtivo,
    obrasPerfilAtivo,
  } = obterVisibilidadeConteudosAbasPerfilAutor({
    abaPerfil,
    obrasPerfilVisivel,
    sobrePerfilVisivel,
    diarioPerfilVisivel,
    comunidadePerfilVisivel,
    bibliotecaPerfilVisivel,
  });

  usePerfilAutorPrivacySync({
    perfilAutorId,
    perfilPertenceAoUsuario,
    estadoRelacionamentoPerfil,
    setPermissoesAbasPerfil,
    setPrivacidadePerfilCarregando,
  });

  usePerfilAutorCommunitySync({
    perfilAutorId,
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
    perfilAutorId,
    usuarioIdLogado,
    setEstadoBloqueioPerfil,
  });

  usePerfilAutorFollowStateSync({
    perfilAutorId,
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

  const {
    ariaLabelSeguimento,
    titleSeguimento,
    rotuloSeguimento,
  } = obterDadosAcaoSeguimentoPerfilAutor({
    seguindoPerfilAtual,
    solicitacaoSeguimentoPendente,
    salvando: seguirUsuarioSalvando,
  });
  const {
    botaoSeguimentoAtivo,
    opacidadeBotaoSeguimento,
    cursorBotaoSeguimento,
  } = obterApresentacaoBotaoSeguimentoPerfilAutor({
    seguindoPerfilAtual,
    solicitacaoSeguimentoPendente,
    salvando: seguirUsuarioSalvando,
  });
  const estiloBaseBotaoSeguimento = botaoSeguimentoAtivo
    ? profileActiveButtonStyle
    : profilePrimaryButtonStyle;

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
  const mostrarDestaquesAutor = perfilSalvoAutor.mostrarDestaques;

  const comunidadeSemPublicacoesRecentes =
    comunidadeSemPublicacoesRecentesPerfilAutor(
      comunidadePerfil.publicacoesRecentes,
    );
  const erroComunidadePerfil = comunidadePerfil.erro;
  const avisoComunidadeVazia = obterAvisoComunidadeVaziaPerfilAutor({
    podeEditarPerfil,
    nomePerfil: perfilNome,
  });
  const tituloComunidadePerfil = obterTituloComunidadePerfilAutor({
    language,
    nomePerfil: perfilNome,
  });
  const ariaLabelsEstatisticasComunidade =
    obterAriaLabelsEstatisticasComunidadePerfilAutor(
      perfilNome,
    );
  const valoresEstatisticasComunidade =
    obterValoresEstatisticasComunidadePerfilAutor({
      totalPublicacoes: comunidadePerfil.totalPublicacoes,
      totalTeorias: comunidadePerfil.totalTeorias,
      totalReviews: comunidadePerfil.totalReviews,
      formatarNumero: compactarNumeroPerfilAutor,
    });
  const paddingInferiorPublicacaoComunidade =
    obterPaddingInferiorPublicacaoComunidadePerfilAutor(podeEditarPerfil);

  const dadosDenunciaPerfil = obterDadosDenunciaPerfilAutor(
    perfilParaMostrar,
  );
  const dadosDenunciaConteudoPerfil =
    obterDadosDenunciaConteudoPerfilAutor(alvoDenunciaConteudoPerfil);
  const {
    denunciaPerfilVisivel,
    denunciaConteudoVisivel,
  } = obterVisibilidadeDenunciasPerfilAutor({
    denunciaPerfilAberta,
    podeEditarPerfil,
    perfilParaMostrar,
    alvoDenunciaConteudoPerfil,
  });

  const {
    bioSobreAutorExibido,
    bioSobreAutorUserContent,
  } = obterBioSobreExibicaoPerfilAutor({
    bioSobreAutor,
    bioSobreAutorEhPadrao,
    traduzirTexto: (texto) => traduzirTextoPerfilAutor(texto, language),
  });

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
  const {
    avaliacaoAutorAcaoVisivel,
    avaliacaoDiarioAcaoVisivel,
  } = obterVisibilidadeAcoesAvaliacaoPerfilAutor({
    autenticacaoCarregada,
    autorPodeReceberAvaliacao,
    perfilUsaAvaliacaoDiario,
    podeEditarPerfil,
    avaliacaoDiarioVisivel: avaliacaoDiario.visivel,
    avaliacaoDiarioPodeAvaliar: avaliacaoDiario.podeAvaliar,
  });

  const obrasDoPerfilFiltradas = obterObrasVisiveisPerfilAutor({
    perfilParaMostrar,
    perfilPertenceAoUsuario,
  });
  const mensagemObrasVazias = obterMensagemObrasVaziasPerfilAutor({
    totalObras: totalObrasPerfil,
    podeEditarPerfil,
  });
  const tituloDiarioPerfil = obterTituloDiarioPerfilAutor({
    podeEditarPerfil,
    nomePerfil: perfilNome,
  });

  const obrasEmDestaque = obterObrasDestaquePerfilAutor({
    topFiveObraIds,
    obras,
    obrasPerfil,
    perfilPertenceAoUsuario,
  });
  const totalObrasEmDestaque = obrasEmDestaque.length;

  const {
    temObrasEmDestaque,
    exibirSecaoDestaques,
  } = obterVisibilidadeDestaquesPerfilAutor({
      obrasPerfilVisivel,
      podeEditarPerfil,
      mostrarDestaquesAutor,
      mostrarDestaquesVisitante,
      totalObrasEmDestaque,
    });

  const dadosCurtidaTopFive = obterDadosCurtidaTopFivePerfilAutor({
    curtido: topFiveCurtidoPorMim,
    totalCurtidas: topFiveCurtidasTotal,
  });
  const mensagemTopFiveVazio = obterMensagemTopFiveVazioPerfilAutor({
    podeEditarPerfil,
    nomePerfil: perfilNome,
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
  const botaoCurtidaTopFive = temObrasEmDestaque ? (
    <ProfileHighlightsLikeButton
      onClick={() => void alternarCurtidaTopFivePerfil()}
      salvando={topFiveCurtidaSalvando}
      curtido={topFiveCurtidoPorMim}
      totalFormatado={dadosCurtidaTopFive.totalFormatado}
      ariaLabel={dadosCurtidaTopFive.ariaLabel}
    />
  ) : null;
  const acoesTituloTopFive = podeEditarPerfil ? botaoCurtidaTopFive : null;
  const acoesCabecalhoTopFive = podeEditarPerfil ? (
    <ProfileHighlightsEditLink href="/perfil-autor/top-5" />
  ) : (
    botaoCurtidaTopFive
  );

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
  const diarioPerfilCarregando = diarioPerfil.carregando;

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
    generosEspecialidadesPerfil,
    totalVisualizacoesPerfil,
    totalRascunhosPerfil,
    totalObrasSemCapitulosPerfil,
    temObrasSemCapitulosPerfil,
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

  const itensBibliotecaQueroLerTotal = itensBibliotecaQueroLer.length;
  const itensBibliotecaConcluidasTotal = itensBibliotecaConcluidas.length;
  const {
    obrasSeguidasPerfilTotal,
    obrasConcluidasPerfilTotal,
  } = obterTotaisBibliotecaPerfilAutor({
    obras,
    obrasSeguidasBiblioteca,
    obrasConcluidas,
    itensBibliotecaQueroLerTotal,
    itensBibliotecaConcluidasTotal,
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
  const mensagemBibliotecaVazia =
    obterMensagemBibliotecaVaziaPerfil(rotuloBibliotecaAtiva);

  const {
    containerAtualStyle,
    heroAtualStyle,
    authorTopRowAtualStyle,
    avatarActionsAtualStyle,
    avatarSmallButtonAtualStyle,
    avatarRemoveButtonAtualStyle,
    profileActionsAtualStyle,
    profileVisitorActionsAtualStyle,
    profileHeaderAtualStyle,
    topWaterFadeAtualStyle,
    menuSheetAtualStyle,
  } = obterEstilosResponsivosPerfilAutor(isDesktop);
  const profileActionsExibicaoStyle = podeEditarPerfil
    ? profileActionsAtualStyle
    : profileVisitorActionsAtualStyle;
  const {
    geral: comunidadeAutorHref,
    teorias: comunidadeAutorTeoriasHref,
    reviews: comunidadeAutorReviewsHref,
  } = criarLinksComunidadePerfilAutor(perfilNome);

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

      <div style={topWaterFadeAtualStyle} aria-hidden="true" />
      <section style={containerAtualStyle}>
        <header style={profileHeaderAtualStyle}>
          <div style={profileHeaderLogoStyle}>
            <button
              type="button"
              onClick={() =>
                setUsernameCabecalhoVisivel((visivel) => !visivel)
              }
              style={logoMarkButtonStyle}
              aria-label={obterRotuloVisibilidadeUsernamePerfilAutor(
                usernameCabecalhoVisivel,
              )}
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
                aria-label={obterAriaLabelCopiarUsernamePerfilAutor(autorHandlePerfil)}
                title="Copiar username"
              >
                <span
                  data-historietas-user-content="true"
                  data-historietas-i18n-ignore="true"
                  style={logoTextStyle}
                >
                  {obterUsernameExibidoPerfilAutor(autorHandlePerfil)}
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
                  {perfilVisitante ? (
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
                      aria-label={ariaLabelNotificacoes}
                    >
                      <span style={menuItemIconStyle}>
                        <MenuPerfilIcone tipo="notificacoes" />
                      </span>
                      <span style={menuNotificationLabelStyle}>
                        <strong style={menuItemTextStyle}>Notificações</strong>

                        {temNotificacoesNaoLidas ? (
                          <span
                            style={menuNotificationBadgeStyle}
                            aria-label={ariaLabelBadgeNotificacoes}
                          >
                            {notificacoesNaoLidasFormatadas}
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
                      style={menuBloqueioStyle}
                    >
                      <span style={menuItemIconStyle}>
                        <MenuPerfilIcone tipo="bloquear" />
                      </span>
                      <strong style={menuItemTextStyle}>
                        {rotuloAcaoBloqueioPerfil}
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

        {editorPerfilVisivel && (
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
                    {temAvatarPerfilEditor ? (
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
                        {obterInicialAvatarPerfilAutor(
                          nomePerfilEditor,
                          perfilParaMostrar.nome,
                        )}
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
                      {rotuloAcaoAvatar}
                    </button>

                    {temAvatarPerfilEditor && (
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
                      setNomePerfilEditor(
                        limitarTextoPerfilAutor(event.target.value, 80),
                      )
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
                        limitarTextoPerfilAutor(
                          event.target.value,
                          BIO_MAX_LENGTH,
                        ),
                      )
                    }
                    placeholder={bioPadraoAutor}
                    maxLength={BIO_MAX_LENGTH}
                    disabled={salvandoEditorPerfil}
                    style={profileEditorSheetTextareaStyle}
                  />
                </label>

                <span style={bioCounterStyle}>
                  {obterCaracteresRestantesPerfilAutor(
                    bioPerfilEditor,
                    BIO_MAX_LENGTH,
                  )} caracteres
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
                    {rotuloSalvarEditor}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        <DenunciaModal
          aberto={denunciaPerfilVisivel}
          alvoTipo="perfil"
          alvoId={dadosDenunciaPerfil.alvoId}
          alvoTitulo={dadosDenunciaPerfil.alvoTitulo}
          alvoUrl={dadosDenunciaPerfil.alvoUrl}
          onFechar={() => setDenunciaPerfilAberta(false)}
          onEnviada={() => {
            setDenunciaPerfilAberta(false);
            setMensagemAcao("Denúncia enviada para análise.");
          }}
        />

        <DenunciaModal
          aberto={denunciaConteudoVisivel}
          alvoTipo={dadosDenunciaConteudoPerfil.alvoTipo}
          alvoId={dadosDenunciaConteudoPerfil.alvoId}
          alvoTitulo={dadosDenunciaConteudoPerfil.alvoTitulo}
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

          <div style={profileActionsExibicaoStyle}>
            {podeEditarPerfil ? (
              <ProfileOwnerActions
                mostrarDestaques={mostrarDestaquesAutor}
                onEdit={abrirEditorPerfil}
                onShare={() => void copiarLinkPerfil()}
                onToggleHighlights={alternarDestaquesPerfil}
              />
            ) : (
              <>
                {!existeBloqueioPerfil && (
                <button
                  type="button"
                  onClick={() => void alternarSeguirAutor()}
                  disabled={seguirUsuarioSalvando}
                  aria-label={ariaLabelSeguimento}
                  title={titleSeguimento}
                  style={{
                    ...estiloBaseBotaoSeguimento,
                    opacity: opacidadeBotaoSeguimento,
                    cursor: cursorBotaoSeguimento,
                  }}
                >
                  {rotuloSeguimento}
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
                titleActions={acoesTituloTopFive}
                headerActions={acoesCabecalhoTopFive}
              />

              {!temObrasEmDestaque ? (
                <ProfileHighlightsEmptyState
                  message={mensagemTopFiveVazio}
                />
              ) : (
                <ProfileHighlightsList isDesktop={isDesktop}>
                  {obrasEmDestaque.map((obra) => {
                    const obraHref = obterHrefObraPerfilAutor(obra);
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

        {avaliacaoAutorAcaoVisivel && (
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

        {avaliacaoDiarioAcaoVisivel && (
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

        {temAbasPerfilVisiveis && (
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

        {bibliotecaPerfilAtiva && (
          <ProfileLibrarySection isDesktop={isDesktop}>
            <LibraryTabs
              abaAtiva={abaBibliotecaPerfil}
              isDesktop={isDesktop}
              onSelect={setAbaBibliotecaPerfil}
            />

            {diarioPerfilCarregando ? (
              <LoadingSpinner label="Carregando biblioteca" compacto />
            ) : bibliotecaSemItensAtivosPerfilAutor(itensBibliotecaAtivos) ? (
              <ProfileSectionEmptyState message={mensagemBibliotecaVazia} />
            ) : (
              <ProfileWorksGrid isDesktop={isDesktop}>
                {itensBibliotecaAtivos.map((item) => {
                  const {
                    capituloHref,
                    totalCurtidas: totalCurtidasBiblioteca,
                    totalComentarios: totalComentariosBiblioteca,
                    visualizacoesFormatadas: visualizacoesBiblioteca,
                    menuAberto,
                  } = obterDadosCardBibliotecaPerfilAutor(
                    item,
                    totaisInteracoesObras,
                    bibliotecaMenuAbertoChave,
                  );

                  return (
                    <LibraryItemCard
                      key={item.chave}
                      item={item}
                      href={capituloHref}
                      isDesktop={isDesktop}
                      menuAberto={menuAberto}
                      totalComentarios={totalComentariosBiblioteca}
                      totalCurtidas={totalCurtidasBiblioteca}
                      visualizacoes={visualizacoesBiblioteca}
                      onToggleMenu={() =>
                        setBibliotecaMenuAbertoChave((chaveAtual) =>
                          alternarIdentificadorMenuPerfilAutor(
                            chaveAtual,
                            item.chave,
                          ),
                        )
                      }
                    />
                  );
                })}
              </ProfileWorksGrid>
            )}
          </ProfileLibrarySection>
        )}

        {diarioPerfilAtivo && (
          <ProfileDiaryPanel
            isDesktop={isDesktop}
            title={tituloDiarioPerfil}
            href={criarHrefListaDiarioPerfilAutor(
              perfilAutorId,
            )}
            linkAriaLabel="Abrir tudo na página Listas"
            linkTitle="Ver tudo"
            linkLabel="+"
            getIsLoading={() => diarioPerfilCarregando}
            getIsEmpty={() => diarioSemItensPerfilAutor(itensDiarioTudo)}
            emptyMessage={obterMensagemDiarioVazioPerfilAutor(
              podeEditarPerfil,
            )}
            renderItems={() =>
              itensDiarioTudo.map((item) => {
                const obra = item.obra;

                if (!obra) {
                  return null;
                }

                const hrefLista = criarHrefListaDiarioPerfilAutor(
                  perfilAutorId,
                  obra.id,
                );

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

        {comunidadePerfilAtiva && (
          <ProfileCommunitySection isDesktop={isDesktop}>
            <ProfileCommunityHeader title={tituloComunidadePerfil} />

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
                    ariaLabel={ariaLabelsEstatisticasComunidade.publicacoes}
                    value={valoresEstatisticasComunidade.publicacoes}
                    title="PUBLICAÇÕES"
                    description="posts do perfil"
                  />

                  <ProfileCommunityStatCard
                    href={comunidadeAutorTeoriasHref}
                    ariaLabel={ariaLabelsEstatisticasComunidade.teorias}
                    value={valoresEstatisticasComunidade.teorias}
                    title="TEORIAS"
                    description="discussões"
                  />

                  <ProfileCommunityStatCard
                    href={comunidadeAutorReviewsHref}
                    ariaLabel={ariaLabelsEstatisticasComunidade.reviews}
                    value={valoresEstatisticasComunidade.reviews}
                    title="REVIEWS"
                    description="opiniões"
                  />
                </ProfileCommunityStatsGrid>

                {erroComunidadePerfil ? (
                  <ProfileCommunityNotice
                    icon="!"
                    title="Comunidade indisponível"
                    description={erroComunidadePerfil}
                  />
                ) : comunidadeSemPublicacoesRecentes ? (
                  <ProfileCommunityNotice
                    icon="💬"
                    title={avisoComunidadeVazia.title}
                    description={avisoComunidadeVazia.description}
                  />
                ) : (
                  <ProfileCommunityRecentPostsSection title="Publicações recentes">

                    <ProfileCommunityRecentPostsList isDesktop={isDesktop}>
                      {comunidadePerfil.publicacoesRecentes.map(
                        (publicacao) => {
                          const dadosPublicacao =
                            obterDadosPublicacaoRecenteComunidadePerfilAutor(
                              publicacao,
                            );

                          return (
                            <ProfileCommunityPostItem key={publicacao.id}>
                              <ProfileCommunityPostLink
                                href={dadosPublicacao.href}
                                paddingBottom={paddingInferiorPublicacaoComunidade}
                                ariaLabel={dadosPublicacao.ariaLabel}
                              >
                                <ProfileCommunityPostHeader
                                  typeLabel={publicacao.tipoPublicacao}
                                  dateLabel={dataDiarioPerfilFormatada(
                                    publicacao.criadoEm,
                                  )}
                                />

                                <ProfileCommunityPostBody>
                                  <ProfileCommunityPostSummary>
                                    {dadosPublicacao.resumo}
                                  </ProfileCommunityPostSummary>

                                  {dadosPublicacao.exibirInfoEnquete && (
                                    <ProfileCommunityPostPollInfo>
                                      Enquete
                                      <span aria-hidden="true">•</span>
                                      {dadosPublicacao.totalOpcoesEnquete}{" "}
                                      opções
                                    </ProfileCommunityPostPollInfo>
                                  )}
                                </ProfileCommunityPostBody>

                                {dadosPublicacao.exibirObraRelacionada && (
                                  <ProfileCommunityPostWork>
                                    <span>OBRA</span>
                                    <strong data-historietas-user-content="true">
                                      {publicacao.obraRelacionada}
                                    </strong>
                                  </ProfileCommunityPostWork>
                                )}
                              </ProfileCommunityPostLink>

                              {perfilVisitante && (
                                <ProfileCommunityPostReportButton
                                  onClick={() =>
                                    abrirDenunciaConteudoPerfil(
                                      "post",
                                      publicacao.id,
                                      dadosPublicacao.resumo,
                                    )
                                  }
                                />
                              )}
                            </ProfileCommunityPostItem>
                          );
                        },
                      )}
                    </ProfileCommunityRecentPostsList>
                  </ProfileCommunityRecentPostsSection>
                )}
              </>
            )}
          </ProfileCommunitySection>
        )}

        {sobrePerfilAtivo && (
          <ProfileAboutSection>
            <ProfileAboutHero>
              <ProfileAboutTitle>
                {obterTituloSobrePerfilAutor(perfilNome)}
              </ProfileAboutTitle>

              <ProfileAboutTextRow>
                <ProfileAboutText
                  userContent={bioSobreAutorUserContent}
                >
                  {bioSobreAutorExibido}
                </ProfileAboutText>

                {podeEditarPerfil && (
                  <ProfileAboutEditButton
                    onClick={() => setEditorSobreAberto((aberto) => !aberto)}
                  />
                )}
              </ProfileAboutTextRow>

              {editorSobreVisivel && (
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
                  {generosEspecialidadesPerfil.map((genero) => (
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
                    <strong>{totalObrasPerfil}</strong>
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
                  {temObrasSemCapitulosPerfil && (
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
                loading={diarioPerfilCarregando}
                items={diarioPerfil.atividades}
                onToggle={() =>
                  setAtividadeSobreAberta((valorAtual) => !valorAtual)
                }
              />
            )}
          </ProfileAboutSection>
        )}

        {obrasPerfilAtivo && (
          <ProfileWorksSection>
            {obrasSemResultadosPerfilAutor(obrasDoPerfilFiltradas) ? (
              <ProfileSectionEmptyState message={mensagemObrasVazias} />
            ) : (
              <ProfileWorksGrid isDesktop={isDesktop}>
                {obrasDoPerfilFiltradas.map((obra) => {
                  const {
                    obraHref,
                    totalCurtidas,
                    totalComentarios,
                    visualizacoesFormatadas: visualizacoesObra,
                    menuObraAberto,
                    ariaLabelOpcoes,
                  } = obterDadosCardObraPerfilAutor(
                    obra,
                    totaisInteracoesObras,
                    obraMenuAbertoId,
                  );

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
                              alternarIdentificadorMenuPerfilAutor(
                                idAtual,
                                obra.id,
                              ),
                            )
                          }
                          ariaLabel={ariaLabelOpcoes}
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
            const {
              temUltimoCapitulo,
              capituloHref,
              obraFavorita,
              obraConcluida,
              metaObraSheet,
              metricasObraSheet,
              ariaLabelSheetObra,
            } = obterDadosSheetObraPerfilAutor({
              obra,
              totaisInteracoesObras,
              obrasFavoritas,
              obrasConcluidas,
              obrasSeguidasBiblioteca,
              traduzirTexto: (item) =>
                traduzirTextoPerfilAutor(item, language),
            });
            const {
              rotuloFavorita,
              rotuloConcluida,
            } = obterRotulosAcoesColecoesObraPerfilAutor({
              obraFavorita,
              obraConcluida,
            });

            return (
              <ProfileWorkActionSheetOverlay
                onClick={() => setObraMenuAbertoId("")}
              >
                <ProfileWorkActionSheetPanel
                  ariaLabel={ariaLabelSheetObra}
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
                    {temUltimoCapitulo && (
                      <Link
                        href={capituloHref}
                        onClick={() => setObraMenuAbertoId("")}
                        style={workActionSheetItemStyle}
                      >
                        Ler
                      </Link>
                    )}

                    {perfilVisitante && (
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
                            {rotuloFavorita}
                          </span>
                          <span style={criarProfileSelectionDotStyle(obraFavorita)}>
                            {obterIndicadorSelecaoPerfilAutor(obraFavorita)}
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
                            {rotuloConcluida}
                          </span>
                          <span style={criarProfileSelectionDotStyle(obraConcluida)}>
                            {obterIndicadorSelecaoPerfilAutor(obraConcluida)}
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
            const {
              capituloHref,
              obraFavorita,
              obraConcluida,
              obraNoQueroLer,
              ariaLabelSheetBiblioteca,
            } = obterDadosSheetBibliotecaPerfilAutor({
              item,
              obrasFavoritas,
              obrasConcluidas,
              obrasSeguidasBiblioteca,
            });
            const metaSheet = obterMetaMenuBibliotecaPerfil(item);
            const {
              rotuloQueroLer,
              rotuloFavorita,
              rotuloConcluida,
            } = obterRotulosAcoesColecoesBibliotecaPerfil({
              obraNoQueroLer,
              obraFavorita,
              obraConcluida,
            });

            return (
              <ProfileWorkActionSheetOverlay
                onClick={() => setBibliotecaMenuAbertoChave("")}
              >
                <ProfileWorkActionSheetPanel
                  ariaLabel={ariaLabelSheetBiblioteca}
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
                        {rotuloQueroLer}
                      </span>
                      <span style={criarProfileSelectionDotStyle(obraNoQueroLer)}>
                        {obterIndicadorSelecaoPerfilAutor(obraNoQueroLer)}
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
                        {rotuloFavorita}
                      </span>
                      <span style={criarProfileSelectionDotStyle(obraFavorita)}>
                        {obterIndicadorSelecaoPerfilAutor(obraFavorita)}
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
                        {rotuloConcluida}
                      </span>
                      <span style={criarProfileSelectionDotStyle(obraConcluida)}>
                        {obterIndicadorSelecaoPerfilAutor(obraConcluida)}
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
                      {obterRotuloAcaoRemoverBibliotecaPerfil(
                        abaBibliotecaPerfil,
                      )}
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
