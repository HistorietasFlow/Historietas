"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { criarSlugBase, idObraSupabaseValido, normalizarTexto } from "../../lib/utils";
import { ehClassificacao18 } from "../../lib/historietasAdultContent";
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
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePerfilAutorDesktopMode } from "./hooks/use-perfil-autor-desktop-mode";
import { usePerfilAutorActionMessage } from "./hooks/use-perfil-autor-action-message";
import { usePerfilAutorTabNavigation } from "./hooks/use-perfil-autor-tab-navigation";
import { usePerfilAutorSessionActions } from "./hooks/use-perfil-autor-session-actions";
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
import { usePerfilAutorProfileSaveActions } from "./hooks/use-perfil-autor-profile-save-actions";
import { usePerfilAutorProfileEditorSaveActions } from "./hooks/use-perfil-autor-profile-editor-save-actions";
import type {
  AbaBibliotecaPerfil,
  AbaPerfilAutor,
  AlvoDenunciaConteudoPerfil,
  AutorPerfil,
  AvaliacaoAutorPublica,
  AvaliacaoDiarioPublica,
  ComunidadePerfilEstado,
  DiarioPerfilEstado,
  DiarioPerfilItem,
  DiarioPerfilResumoItem,
  ItemBibliotecaPerfil,
  ObraLocal,
  ObraSalva,
  PerfisAutoresSalvos,
  PerfilUsuarioRemoto,
  TotaisInteracoesObrasPerfilAutor,
} from "./types";
import {
  AUTHOR_FOLLOW_STORAGE_KEY,
  BIO_MAX_LENGTH,
  COMPLETED_STORAGE_KEY,
  FAVORITES_STORAGE_KEY,
  LIBRARY_FOLLOW_STORAGE_KEY,
  PERMISSOES_ABAS_PERFIL_PADRAO,
  SOBRE_BIO_MAX_LENGTH,
  STORAGE_KEY,
  TOP_FIVE_MAXIMO,
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
  aplicarPermissoesAbasAoDiario,
  compactarNumeroPerfilAutor,
  criarChaveAutorPerfil,
  criarHandlePerfilAutor,
  criarHrefLeituraCapituloPerfilAutor,
  criarHrefListaSeguimentoPerfilAutor,
  formatarEntradaHistorietasPerfilAutor,
  formatarFormatoPerfilAutor,
  formatarGeneroPerfilAutor,
  idAutorSupabaseValido,
  normalizarAbaPerfilAutor,
  normalizarNomeAutor,
  normalizarNumeroPerfilAutor,
  normalizarUsernamePerfilAutor,
  obterTagPrincipalPerfilAutor,
  obterTimestampData,
} from "./lib/profile-formatters";
import {
  criarBioAutor,
  encontrarCapituloParaContinuar,
  filtrarObrasLocaisDoUsuarioPerfilAutor,
  mesclarObrasLocalStoragePerfilAutor,
  mostrarClassificacao,
  normalizarObra,
  obraPertenceAoUsuarioPerfilAutor,
} from "./lib/work-normalizers";
import {
  atualizarIdentidadeAutenticadaPerfilAutor,
  execucaoAutenticacaoPerfilAutorEstaAtual,
  execucaoCarregamentoPerfilAutorEstaAtual,
  type IdentidadeAutenticadaPerfilAutor,
} from "./lib/profile-auth-identity";
import {
  colecaoTemObraPerfilBiblioteca,
  converterCapitulosSalvosParaBiblioteca,
  converterItensDiarioParaBiblioteca,
  encontrarObraPorIdentificadorTopFivePerfil,
  mesclarItensBibliotecaPerfil,
} from "./lib/library-normalizers";
import {
  aplicarInteracoesNasObras,
  criarPerfilUsuarioRemotoComoAutor,
  mesclarObrasPorIdSlug,
  obterTotalComentariosObraPerfilAutor,
  obterTotalConcluidasObraPerfilAutor,
  obterTotalCurtidasObraPerfilAutor,
  obterTotalSalvosObraPerfilAutor,
} from "./lib/data-normalizers";
import { criarEstadoDiarioPerfilVazio } from "./lib/profile-diary-record-utils";
import {
  analisarEnquetePublicacaoComunidadePerfil,
  criarHrefPublicacaoComunidadePerfil,
  criarResumoPublicacaoComunidadePerfil,
} from "./lib/profile-community-publication-utils";
import { carregarPerfilUsuarioSupabase } from "./lib/profile-public-profile-loader";
import { carregarDiarioPerfilSupabase } from "./lib/profile-diary-loader";
import { mesclarDiarioPerfilComLocal } from "./lib/profile-diary-merge-utils";
import {
  carregarObrasPublicadasPorIdsSupabase,
  carregarObrasPublicadasSupabase,
} from "./lib/profile-published-works-loader";
import { carregarEstadoUsuarioSupabase } from "./lib/profile-user-state-loader";
import {
  carregarInteracoesCapitulosSupabase,
  carregarTotaisInteracoesObrasPerfilAutor,
} from "./lib/profile-interactions-loader";
import {
  dataDiarioPerfilFormatada,
  montarDiarioPerfilLocal,
} from "./lib/profile-diary-local-utils";
import {
  carregarJsonUsuarioPerfilAutor,
  carregarListaIdsPerfilBiblioteca,
  salvarJsonUsuarioPerfilAutor,
  salvarListaIdsPerfilBiblioteca,
} from "./lib/profile-local-storage-utils";
import { carregarPerfisAutores } from "./lib/profile-local-author-utils";
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

  useEffect(() => {
    let componenteAtivo = true;

    function limparEstadoContaAnterior() {
      setPerfilUsuarioRemoto(null);
      setObras([]);
      setTotaisInteracoesObras(totaisInteracoesObrasPerfilVazio);
      setAutoresSeguidos([]);
      setObrasFavoritas([]);
      setObrasConcluidas([]);
      setObrasSeguidasBiblioteca([]);
      setPerfisAutoresSalvos({});
      setEditorPerfilAberto(false);
      setNomePerfilEditor("");
      setUsernamePerfilEditor("");
      setBioPerfilEditor("");
      setAvatarPerfilEditor("");
      setAvatarNomePerfilEditor("");
      setAvatarArquivoPerfilEditor(null);
      setAvatarErro("");
      setSalvandoEditorPerfil(false);
      setTopFiveCurtidaSalvando(false);
      setAvaliacaoDiario((avaliacaoAtual) => ({
        ...avaliacaoAtual,
        salvando: false,
      }));
      setMensagemAcao("");

      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }

    function aplicarIdentidadeAutenticada(usuarioId: string) {
      const resultado = atualizarIdentidadeAutenticadaPerfilAutor(
        identidadeAutenticadaPerfilRef.current,
        usuarioId,
      );

      if (resultado.mudou) {
        identidadeAutenticadaPerfilRef.current = resultado.identidade;
        setCarregando(true);
        limparEstadoContaAnterior();
        setUsuarioIdLogado(resultado.identidade.usuarioId);
      }

      setAutenticacaoCarregada(true);
    }

    async function carregarUsuarioAutenticadoPerfil() {
      const versaoConsulta = versaoConsultaAutenticacaoPerfilRef.current + 1;
      versaoConsultaAutenticacaoPerfilRef.current = versaoConsulta;

      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id || "";

        if (
          execucaoAutenticacaoPerfilAutorEstaAtual({
            cancelada: !componenteAtivo,
            versaoEsperada: versaoConsulta,
            versaoAtual: versaoConsultaAutenticacaoPerfilRef.current,
          })
        ) {
          aplicarIdentidadeAutenticada(userId);
        }
      } catch {
        if (
          execucaoAutenticacaoPerfilAutorEstaAtual({
            cancelada: !componenteAtivo,
            versaoEsperada: versaoConsulta,
            versaoAtual: versaoConsultaAutenticacaoPerfilRef.current,
          })
        ) {
          aplicarIdentidadeAutenticada("");
        }
      }
    }

    void carregarUsuarioAutenticadoPerfil();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (componenteAtivo) {
        versaoConsultaAutenticacaoPerfilRef.current += 1;
        aplicarIdentidadeAutenticada(session?.user?.id || "");
      }
    });

    return () => {
      componenteAtivo = false;
      versaoConsultaAutenticacaoPerfilRef.current += 1;
      subscription.unsubscribe();
    };
  }, [setMensagemAcao]);

  useEffect(() => {
    const userIdSeguro = (
      usuarioNotificacoesId || usuarioIdLogado
    ).trim();

    if (!idAutorSupabaseValido(userIdSeguro)) {
      const limparContadorTimer = window.setTimeout(() => {
        setNotificacoesNaoLidasPerfil(null);
      }, 0);

      return () => {
        window.clearTimeout(limparContadorTimer);
      };
    }

    let cancelado = false;
    let timerAtualizacao: number | null = null;

    function limparTimerAtualizacao() {
      if (timerAtualizacao !== null) {
        window.clearTimeout(timerAtualizacao);
        timerAtualizacao = null;
      }
    }

    async function carregarContadorNotificacoesPerfil() {
      const [
        { data: notificacoesData, count: notificacoesCount, error: notificacoesError },
        { data: solicitacoesData, error: solicitacoesError },
      ] = await Promise.all([
        supabase
          .from("notificacoes")
          .select("notificacao_id", { count: "exact" })
          .eq("user_id", userIdSeguro)
          .eq("lida", false)
          .limit(1000),
        supabase
          .from("solicitacoes_seguidores")
          .select("solicitante_id")
          .eq("destinatario_id", userIdSeguro)
          .limit(1000),
      ]);

      if (cancelado) {
        return;
      }

      if (notificacoesError) {
        console.warn(
          "Não consegui atualizar o contador de notificações do perfil:",
          notificacoesError.message,
        );
        setNotificacoesNaoLidasPerfil(null);
        return;
      }

      const idsNotificacoesDiretas = new Set(
        (Array.isArray(notificacoesData) ? notificacoesData : [])
          .map((registro) => {
            const notificacaoId = (
              registro as { notificacao_id?: unknown }
            ).notificacao_id;

            return typeof notificacaoId === "string"
              ? notificacaoId.trim()
              : "";
          })
          .filter(Boolean),
      );

      let solicitacoesPendentesSemNotificacao = 0;

      if (!solicitacoesError && Array.isArray(solicitacoesData)) {
        const solicitantesPendentes = new Set(
          solicitacoesData
            .map((registro) => {
              const solicitanteId = (
                registro as { solicitante_id?: unknown }
              ).solicitante_id;

              return typeof solicitanteId === "string"
                ? solicitanteId.trim()
                : "";
            })
            .filter(Boolean),
        );

        solicitantesPendentes.forEach((solicitanteId) => {
          const notificacaoIdEsperado =
            `solicitacao-seguidor:${solicitanteId}:${userIdSeguro}`;

          if (!idsNotificacoesDiretas.has(notificacaoIdEsperado)) {
            solicitacoesPendentesSemNotificacao += 1;
          }
        });
      }

      const totalDiretas = Number(
        notificacoesCount ??
          (Array.isArray(notificacoesData) ? notificacoesData.length : 0),
      );
      const totalSeguro = Number.isFinite(totalDiretas)
        ? Math.max(
            0,
            Math.trunc(totalDiretas) + solicitacoesPendentesSemNotificacao,
          )
        : solicitacoesPendentesSemNotificacao;

      setNotificacoesNaoLidasPerfil(totalSeguro);
    }

    function agendarAtualizacaoContador() {
      limparTimerAtualizacao();

      timerAtualizacao = window.setTimeout(() => {
        timerAtualizacao = null;
        void carregarContadorNotificacoesPerfil();
      }, 180);
    }

    function atualizarAoRetomarPerfil() {
      if (document.visibilityState === "visible") {
        agendarAtualizacaoContador();
      }
    }

    void carregarContadorNotificacoesPerfil();

    const canalContador = supabase
      .channel(`perfil-autor-contador-notificacoes-${userIdSeguro}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notificacoes",
          filter: `user_id=eq.${userIdSeguro}`,
        },
        agendarAtualizacaoContador,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "solicitacoes_seguidores",
          filter: `destinatario_id=eq.${userIdSeguro}`,
        },
        agendarAtualizacaoContador,
      )
      .subscribe();

    const intervaloAtualizacao = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        agendarAtualizacaoContador();
      }
    }, 20000);

    window.addEventListener(
      "historietas:notificacoes-atualizadas",
      agendarAtualizacaoContador,
    );
    window.addEventListener("focus", agendarAtualizacaoContador);
    document.addEventListener("visibilitychange", atualizarAoRetomarPerfil);

    return () => {
      cancelado = true;
      limparTimerAtualizacao();
      window.clearInterval(intervaloAtualizacao);
      window.removeEventListener(
        "historietas:notificacoes-atualizadas",
        agendarAtualizacaoContador,
      );
      window.removeEventListener("focus", agendarAtualizacaoContador);
      document.removeEventListener(
        "visibilitychange",
        atualizarAoRetomarPerfil,
      );
      void supabase.removeChannel(canalContador);
    };
  }, [usuarioIdLogado, usuarioNotificacoesId]);

  useEffect(() => {
    let cancelado = false;

    async function carregarTotaisReaisPerfil() {
      if (obras.length === 0) {
        setTotaisInteracoesObras(totaisInteracoesObrasPerfilVazio);
        return;
      }

      const totaisReais = await carregarTotaisInteracoesObrasPerfilAutor(obras);

      if (!cancelado) {
        setTotaisInteracoesObras(totaisReais);
      }
    }

    void carregarTotaisReaisPerfil();

    return () => {
      cancelado = true;
    };
  }, [obras]);


  useEffect(() => {
    if (!autenticacaoCarregada) {
      return;
    }

    let componenteAtivo = true;
    const identidadeEsperada = identidadeAutenticadaPerfilRef.current;

    function execucaoCarregamentoEstaAtual() {
      return execucaoCarregamentoPerfilAutorEstaAtual({
        cancelada: !componenteAtivo,
        identidadeEsperada,
        identidadeAtual: identidadeAutenticadaPerfilRef.current,
      });
    }

    async function carregarPerfilAutor() {
      const params = new URLSearchParams(queryPerfilAtual);
      const autorParam = params.get("autor") || "";
      const autorIdParam =
        params.get("autorId") || params.get("id") || params.get("userId") || "";
      const abaParam = normalizarAbaPerfilAutor(params.get("aba"));
      setAbaPerfil(abaParam);
      setAutorSelecionado(autorParam.trim());
      setAutorIdSelecionado(autorIdParam.trim());
      setMostrarDestaquesVisitante(false);
      setUsernameCabecalhoVisivel(false);

      let obrasNormalizadas: ObraLocal[] = [];
      let autoresSeguidosNormalizados: string[] = [];
      let obrasFavoritasNormalizadas: string[] = [];
      let obrasConcluidasNormalizadas: string[] = [];
      let obrasSeguidasBibliotecaNormalizadas: string[] = [];
      let perfilUsuarioRemotoCarregado: PerfilUsuarioRemoto | null = null;

      const obrasSupabase = await carregarObrasPublicadasSupabase();

      if (!execucaoCarregamentoEstaAtual()) {
        return;
      }

      const resultadoEstadoUsuario = await carregarEstadoUsuarioSupabase();
      const estadoUsuarioSupabase = resultadoEstadoUsuario.estadoUsuario;
      const usuarioIdConfirmado = estadoUsuarioSupabase?.userId || "";
      const usuarioIdAtual = resultadoEstadoUsuario.identidadeConfirmada
        ? usuarioIdConfirmado
        : identidadeEsperada.usuarioId;

      if (
        !execucaoCarregamentoEstaAtual() ||
        (resultadoEstadoUsuario.identidadeConfirmada &&
          usuarioIdAtual !== identidadeEsperada.usuarioId)
      ) {
        return;
      }

      if (usuarioIdAtual) {
        try {
          const obrasSalvasJson = carregarJsonUsuarioPerfilAutor(
            STORAGE_KEY,
            usuarioIdAtual,
          );

          obrasNormalizadas = Array.isArray(obrasSalvasJson)
            ? (obrasSalvasJson as ObraSalva[]).map((obra, index) =>
                normalizarObra(obra, index),
              )
            : [];

          const autoresSeguidosJson = carregarJsonUsuarioPerfilAutor(
            AUTHOR_FOLLOW_STORAGE_KEY,
            usuarioIdAtual,
          );

          autoresSeguidosNormalizados = Array.isArray(autoresSeguidosJson)
            ? autoresSeguidosJson
                .filter(
                  (autor): autor is string =>
                    typeof autor === "string" && Boolean(autor.trim()),
                )
                .map((autor) => normalizarNomeAutor(autor))
            : [];

          obrasFavoritasNormalizadas = carregarListaIdsPerfilBiblioteca(
            FAVORITES_STORAGE_KEY,
            usuarioIdAtual,
          );

          obrasConcluidasNormalizadas = carregarListaIdsPerfilBiblioteca(
            COMPLETED_STORAGE_KEY,
            usuarioIdAtual,
          );

          obrasSeguidasBibliotecaNormalizadas =
            carregarListaIdsPerfilBiblioteca(
              LIBRARY_FOLLOW_STORAGE_KEY,
              usuarioIdAtual,
            );
        } catch {
          obrasNormalizadas = [];
          autoresSeguidosNormalizados = [];
          obrasFavoritasNormalizadas = [];
          obrasConcluidasNormalizadas = [];
          obrasSeguidasBibliotecaNormalizadas = [];
        }
      }

      const perfilUsuarioIdParaBuscar =
        autorIdParam.trim() || usuarioIdAtual;

      perfilUsuarioRemotoCarregado = await carregarPerfilUsuarioSupabase(
        perfilUsuarioIdParaBuscar,
        autorParam.trim(),
      );

      if (!execucaoCarregamentoEstaAtual()) {
        return;
      }

      const obrasLocaisDoUsuario = filtrarObrasLocaisDoUsuarioPerfilAutor(
        obrasNormalizadas,
        usuarioIdAtual,
      );

      let obrasMescladas = mesclarObrasPorIdSlug(
        obrasLocaisDoUsuario,
        obrasSupabase,
      );

      if (estadoUsuarioSupabase) {
        obrasFavoritasNormalizadas = Array.from(
          new Set([
            ...obrasFavoritasNormalizadas,
            ...estadoUsuarioSupabase.favoritas,
          ]),
        );
        obrasConcluidasNormalizadas = Array.from(
          new Set([
            ...obrasConcluidasNormalizadas,
            ...estadoUsuarioSupabase.concluidas,
          ]),
        );
        autoresSeguidosNormalizados = Array.from(
          new Set([
            ...autoresSeguidosNormalizados,
            ...estadoUsuarioSupabase.autoresSeguidos,
          ]),
        );
        obrasSeguidasBibliotecaNormalizadas = Array.from(
          new Set([
            ...obrasSeguidasBibliotecaNormalizadas,
            ...estadoUsuarioSupabase.obrasSeguidas,
          ]),
        );

      }

      const idsBibliotecaLocal = Array.from(
        new Set([
          ...obrasFavoritasNormalizadas,
          ...obrasConcluidasNormalizadas,
          ...obrasSeguidasBibliotecaNormalizadas,
        ]),
      ).filter((obraId) => idObraSupabaseValido(obraId));

      if (idsBibliotecaLocal.length > 0) {
        const idsObrasCarregadas = new Set(
          obrasMescladas.map((obra) => obra.id).filter(Boolean),
        );
        const idsObrasBibliotecaFaltantes = idsBibliotecaLocal.filter(
          (obraId) => !idsObrasCarregadas.has(obraId),
        );

        if (idsObrasBibliotecaFaltantes.length > 0) {
          const obrasBibliotecaFaltantes =
            await carregarObrasPublicadasPorIdsSupabase(
              idsObrasBibliotecaFaltantes,
            );

          if (!execucaoCarregamentoEstaAtual()) {
            return;
          }

          obrasMescladas = mesclarObrasPorIdSlug(
            obrasMescladas,
            obrasBibliotecaFaltantes,
          );
        }
      }

      if (estadoUsuarioSupabase) {
        const interacoes = await carregarInteracoesCapitulosSupabase(
          estadoUsuarioSupabase.userId,
          obrasMescladas,
        );

        if (!execucaoCarregamentoEstaAtual()) {
          return;
        }

        obrasMescladas = aplicarInteracoesNasObras(
          obrasMescladas,
          interacoes.curtidas,
          interacoes.salvos,
          interacoes.comentarios,
          interacoes.progresso,
          interacoes.progressoCarregado,
          interacoes.capitulosComMetricas,
        );
      }

      if (!execucaoCarregamentoEstaAtual()) {
        return;
      }

      if (usuarioIdAtual) {
        try {
          const obrasDoUsuarioParaPersistir = obrasMescladas.filter((obra) =>
            obraPertenceAoUsuarioPerfilAutor(obra, usuarioIdAtual),
          );
          const obrasParaPersistir = mesclarObrasLocalStoragePerfilAutor(
            obrasNormalizadas,
            obrasDoUsuarioParaPersistir,
            usuarioIdAtual,
          );

          salvarJsonUsuarioPerfilAutor(
            STORAGE_KEY,
            usuarioIdAtual,
            obrasParaPersistir,
          );

          salvarJsonUsuarioPerfilAutor(
            AUTHOR_FOLLOW_STORAGE_KEY,
            usuarioIdAtual,
            autoresSeguidosNormalizados,
          );
          salvarListaIdsPerfilBiblioteca(
            FAVORITES_STORAGE_KEY,
            usuarioIdAtual,
            obrasFavoritasNormalizadas,
          );
          salvarListaIdsPerfilBiblioteca(
            COMPLETED_STORAGE_KEY,
            usuarioIdAtual,
            obrasConcluidasNormalizadas,
          );
          salvarListaIdsPerfilBiblioteca(
            LIBRARY_FOLLOW_STORAGE_KEY,
            usuarioIdAtual,
            obrasSeguidasBibliotecaNormalizadas,
          );
        } catch {
          // Se o navegador bloquear localStorage, a página ainda usa o estado em memória.
        }
      }

      if (!execucaoCarregamentoEstaAtual()) {
        return;
      }

      setPerfilUsuarioRemoto(perfilUsuarioRemotoCarregado);
      setObras(obrasMescladas);
      setAutoresSeguidos(autoresSeguidosNormalizados);
      setObrasFavoritas(obrasFavoritasNormalizadas);
      setObrasConcluidas(obrasConcluidasNormalizadas);
      setObrasSeguidasBiblioteca(obrasSeguidasBibliotecaNormalizadas);
      setPerfisAutoresSalvos(carregarPerfisAutores(usuarioIdAtual));
      setCarregando(false);
    }

    void carregarPerfilAutor();

    return () => {
      componenteAtivo = false;
    };
  }, [autenticacaoCarregada, queryPerfilAtual, usuarioIdLogado]);

  const perfisAutores = useMemo<AutorPerfil[]>(() => {
    const mapa = new Map<
      string,
      { autorId: string; nome: string; obras: ObraLocal[] }
    >();

    obras.forEach((obra) => {
      const nomeAutor = obra.autor.trim() || "Autor não informado";
      const autorId = obra.autorId.trim();
      const chaveAutor = criarChaveAutorPerfil(autorId, nomeAutor);
      const autorExistente = mapa.get(chaveAutor);

      if (autorExistente) {
        mapa.set(chaveAutor, {
          ...autorExistente,
          autorId: autorExistente.autorId || autorId,
          obras: [...autorExistente.obras, obra],
        });
        return;
      }

      mapa.set(chaveAutor, {
        autorId,
        nome: nomeAutor,
        obras: [obra],
      });
    });

    return Array.from(mapa.values())
      .map((grupoAutor) => {
        const obrasDoAutor = grupoAutor.obras;

        const totalCapitulos = obrasDoAutor.reduce(
          (total, obra) => total + obra.capitulos.length,
          0,
        );

        const totalCurtidas = obrasDoAutor.reduce(
          (total, obra) =>
            total + obterTotalCurtidasObraPerfilAutor(
              obra,
              totaisInteracoesObras,
            ),
          0,
        );

        const totalComentarios = obrasDoAutor.reduce(
          (total, obra) =>
            total + obterTotalComentariosObraPerfilAutor(
              obra,
              totaisInteracoesObras,
            ),
          0,
        );

        return {
          autorId: grupoAutor.autorId,
          nome: grupoAutor.nome,
          obras: obrasDoAutor,
          totalCapitulos,
          totalPublicadas: obrasDoAutor.filter((obra) => obra.publicado).length,
          totalCurtidas,
          totalComentarios,
        };
      })
      .sort((autorA, autorB) => autorA.nome.localeCompare(autorB.nome));
  }, [obras, totaisInteracoesObras]);

  const perfilUsuarioRemotoComoAutor = useMemo(() => {
    if (!perfilUsuarioRemoto?.userId) {
      return null;
    }

    return criarPerfilUsuarioRemotoComoAutor(perfilUsuarioRemoto);
  }, [perfilUsuarioRemoto]);

  const perfilAtual = useMemo(() => {
    if (!autorSelecionado && !autorIdSelecionado) {
      return null;
    }

    const autorIdNormalizado = autorIdSelecionado.trim().toLowerCase();

    if (autorIdNormalizado) {
      const perfilPorId = perfisAutores.find(
        (perfil) => perfil.autorId.trim().toLowerCase() === autorIdNormalizado,
      );

      if (perfilPorId) {
        return perfilPorId;
      }

      if (
        perfilUsuarioRemotoComoAutor &&
        perfilUsuarioRemotoComoAutor.autorId.trim().toLowerCase() ===
          autorIdNormalizado
      ) {
        return perfilUsuarioRemotoComoAutor;
      }
    }

    const autorNormalizado = normalizarNomeAutor(autorSelecionado);

    return (
      perfisAutores.find(
        (perfil) => normalizarNomeAutor(perfil.nome) === autorNormalizado,
      ) || null
    );
  }, [
    perfisAutores,
    autorSelecionado,
    autorIdSelecionado,
    perfilUsuarioRemotoComoAutor,
  ]);

  const autorNaoEncontrado = Boolean(
    (autorSelecionado || autorIdSelecionado) && !perfilAtual,
  );

  const perfilDoUsuarioLogado = useMemo(() => {
    const usuarioIdNormalizado = usuarioIdLogado.trim().toLowerCase();

    if (!usuarioIdNormalizado) {
      return null;
    }

    return (
      perfisAutores.find(
        (perfil) =>
          perfil.autorId.trim().toLowerCase() === usuarioIdNormalizado,
      ) ||
      (perfilUsuarioRemotoComoAutor?.autorId.trim().toLowerCase() ===
      usuarioIdNormalizado
        ? perfilUsuarioRemotoComoAutor
        : null)
    );
  }, [perfisAutores, usuarioIdLogado, perfilUsuarioRemotoComoAutor]);

  const perfilSemParametro =
    !autorSelecionado.trim() && !autorIdSelecionado.trim();
  const perfilSemLoginSemParametro =
    perfilSemParametro && !usuarioIdLogado.trim();

  const perfilParaMostrar =
    autorSelecionado || autorIdSelecionado
      ? perfilAtual
      : perfilSemLoginSemParametro
        ? null
        : perfilDoUsuarioLogado || perfilUsuarioRemotoComoAutor || null;

  const redirecionandoParaLogin =
    autenticacaoCarregada && perfilSemLoginSemParametro;

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

  const perfilPertenceAoUsuario = useMemo(() => {
    const usuarioIdNormalizado = usuarioIdLogado.trim().toLowerCase();
    const autorIdPerfilNormalizado =
      perfilParaMostrar?.autorId.trim().toLowerCase() || "";
    const autorIdUrlNormalizado = autorIdSelecionado.trim().toLowerCase();
    const perfilSemParametro =
      !autorSelecionado.trim() && !autorIdSelecionado.trim();

    return Boolean(
      usuarioIdNormalizado &&
        (perfilSemParametro ||
          autorIdPerfilNormalizado === usuarioIdNormalizado ||
          autorIdUrlNormalizado === usuarioIdNormalizado),
    );
  }, [perfilParaMostrar, autorIdSelecionado, autorSelecionado, usuarioIdLogado]);
  const podeEditarPerfil = perfilPertenceAoUsuario;

  const perfilBloqueadoEntreUsuarios =
    !perfilPertenceAoUsuario && estadoBloqueioPerfil.existeBloqueio;
  const obrasPerfilVisivel =
    perfilPertenceAoUsuario ||
    (!perfilBloqueadoEntreUsuarios &&
      !privacidadePerfilCarregando &&
      permissoesAbasPerfil.obras);
  const sobrePerfilVisivel =
    perfilPertenceAoUsuario ||
    (!perfilBloqueadoEntreUsuarios &&
      !privacidadePerfilCarregando &&
      permissoesAbasPerfil.sobre);
  const diarioPerfilVisivel =
    perfilPertenceAoUsuario ||
    (!perfilBloqueadoEntreUsuarios &&
      !privacidadePerfilCarregando &&
      permissoesAbasPerfil.diario);
  const comunidadePerfilVisivel =
    perfilPertenceAoUsuario ||
    (!perfilBloqueadoEntreUsuarios &&
      !privacidadePerfilCarregando &&
      permissoesAbasPerfil.comunidade);
  const bibliotecaPerfilVisivel =
    perfilPertenceAoUsuario ||
    (!perfilBloqueadoEntreUsuarios &&
      !privacidadePerfilCarregando &&
      permissoesAbasPerfil.biblioteca);
  const atividadesPerfilVisivel =
    perfilPertenceAoUsuario ||
    (!perfilBloqueadoEntreUsuarios &&
      !privacidadePerfilCarregando &&
      permissoesAbasPerfil.atividades);
  const totalAbasPerfilVisiveis =
    (obrasPerfilVisivel ? 1 : 0) +
    (diarioPerfilVisivel ? 1 : 0) +
    (comunidadePerfilVisivel ? 1 : 0) +
    (sobrePerfilVisivel ? 1 : 0) +
    (bibliotecaPerfilVisivel ? 1 : 0);
  const conteudoPrivadoBloqueado = Boolean(
    !perfilPertenceAoUsuario &&
      !privacidadePerfilCarregando &&
      totalAbasPerfilVisiveis === 0,
  );
  const primeiraAbaPerfilVisivel: AbaPerfilAutor | null = obrasPerfilVisivel
    ? "obras"
    : diarioPerfilVisivel
      ? "diario"
      : comunidadePerfilVisivel
        ? "comunidade"
        : sobrePerfilVisivel
          ? "sobre"
          : bibliotecaPerfilVisivel
            ? "biblioteca"
            : null;

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

  const autorChavePerfil = perfilParaMostrar
    ? criarChaveAutorPerfil(perfilParaMostrar.autorId, perfilParaMostrar.nome)
    : "";
  const autorNormalizadoParaSeguir = perfilParaMostrar
    ? normalizarNomeAutor(perfilParaMostrar.nome)
    : "";

  const seguindoAutor = Boolean(
    autorChavePerfil &&
    (autoresSeguidos.includes(autorChavePerfil) ||
      autoresSeguidos.includes(autorNormalizadoParaSeguir)),
  );
  const perfilUserIdParaSeguir = perfilParaMostrar?.autorId.trim() || "";
  const podeUsarSeguimentoUsuario = Boolean(
    perfilUserIdParaSeguir && idAutorSupabaseValido(perfilUserIdParaSeguir),
  );
  const seguindoPerfilAtual = podeUsarSeguimentoUsuario
    ? estadoRelacionamentoPerfil === "seguindo" || seguindoUsuarioPerfil
    : seguindoAutor;
  const solicitacaoSeguimentoPendente = Boolean(
    podeUsarSeguimentoUsuario &&
      estadoRelacionamentoPerfil === "solicitado",
  );
  const seguidoresTotal = podeUsarSeguimentoUsuario
    ? seguidoresUsuarioPerfilTotal
    : seguindoAutor
      ? 1
      : 0;
  const seguindoTotalPerfil = podeUsarSeguimentoUsuario
    ? seguindoUsuarioPerfilTotal
    : podeEditarPerfil
      ? autoresSeguidos.length
      : 0;
  const seguidoresPerfilHref = podeEditarPerfil
    ? "/seguindo?conteudo=seguidores"
    : criarHrefListaSeguimentoPerfilAutor(
        "seguidores",
        perfilParaMostrar,
      );
  const seguindoPerfilHref = podeEditarPerfil
    ? "/seguindo?conteudo=pessoas"
    : criarHrefListaSeguimentoPerfilAutor(
        "seguindo",
        perfilParaMostrar,
      );
  const obrasSeguidasPerfilHref = "/seguindo?conteudo=obras";
  const obrasConcluidasPerfilPorObrasDoAutor = perfilParaMostrar
    ? perfilParaMostrar.obras.reduce((total, obra) => {
        const totalConcluidasReais = obterTotalConcluidasObraPerfilAutor(
          obra,
          totaisInteracoesObras,
        );
        const concluidaLocal = colecaoTemObraPerfilBiblioteca(
          obrasConcluidas,
          obra,
        )
          ? 1
          : 0;

        return total + Math.max(totalConcluidasReais, concluidaLocal);
      }, 0)
    : 0;
  const perfilSalvoAutor = autorChavePerfil
    ? perfisAutoresSalvos[autorChavePerfil] ||
      perfisAutoresSalvos[autorNormalizadoParaSeguir] || {
        avatar: "",
        avatarNome: "",
        bio: "",
        sobreBio: "",
        mostrarDestaques: false,
      }
    : {
        avatar: "",
        avatarNome: "",
        bio: "",
        sobreBio: "",
        mostrarDestaques: false,
      };
  const perfilUsuarioRemotoAtivo =
    perfilUsuarioRemoto &&
    perfilParaMostrar &&
    perfilUsuarioRemoto.userId.trim().toLowerCase() ===
      perfilParaMostrar.autorId.trim().toLowerCase()
      ? perfilUsuarioRemoto
      : null;
  const bioPadraoAutor = perfilParaMostrar
    ? criarBioAutor(perfilParaMostrar)
    : "";
  const bioAutorPersonalizada =
    perfilSalvoAutor.bio.trim() || perfilUsuarioRemotoAtivo?.bio.trim() || "";
  const bioAutor = bioAutorPersonalizada || bioPadraoAutor;
  const bioSobrePersonalizada =
    perfilSalvoAutor.sobreBio.trim() ||
    perfilUsuarioRemotoAtivo?.sobreBio.trim() ||
    "";
  const bioSobreAutor = bioSobrePersonalizada || bioAutor;
  const bioSobreAutorEhPadrao =
    bioSobreAutor.trim() === "Perfil de leitor no Historietas.";
  const bioSobreAutorExibido = bioSobreAutorEhPadrao
    ? traduzirTextoPerfilAutor(bioSobreAutor, language)
    : bioSobreAutor;
  const autorHandlePerfil = perfilParaMostrar
    ? criarHandlePerfilAutor(
        perfilParaMostrar.nome,
        perfilParaMostrar.autorId,
        perfilUsuarioRemotoAtivo?.username || "",
      )
    : "@autor.historietas";
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
  const avatarAutor = perfilSalvoAutor.avatar || perfilUsuarioRemotoAtivo?.avatar || "";
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
  const entradaHistorietasPerfil = formatarEntradaHistorietasPerfilAutor(
    perfilUsuarioRemotoAtivo?.criadoEm || "",
  );

  const caracteresRestantesBioSobre =
    SOBRE_BIO_MAX_LENGTH - bioSobrePersonalizada.length;
  const autorPodeReceberAvaliacao = Boolean(
    perfilParaMostrar && perfilParaMostrar.obras.length > 0,
  );
  const perfilUsaAvaliacaoDiario = Boolean(
    perfilParaMostrar && perfilParaMostrar.obras.length === 0,
  );
  const avaliacaoDiarioPrivada = Boolean(
    perfilUsaAvaliacaoDiario &&
      avaliacaoDiario.carregado &&
      !avaliacaoDiario.mostrar,
  );
  const avaliacaoDiarioResumoVisivel = Boolean(
    perfilUsaAvaliacaoDiario &&
      (
        avaliacaoDiarioPrivada ||
        podeEditarPerfil ||
        avaliacaoDiario.visivel
      ),
  );
  const avaliacaoResumoPerfilVisivel =
    autorPodeReceberAvaliacao || avaliacaoDiarioResumoVisivel;
  const avaliacaoResumoPerfil = autorPodeReceberAvaliacao
    ? avaliacaoAutor
    : avaliacaoDiario;
  const avaliacaoResumoEhDiario = !autorPodeReceberAvaliacao;

  const obrasDoPerfilFiltradas = useMemo(() => {
    if (!perfilParaMostrar) {
      return [];
    }

    const obrasVisiveis = perfilPertenceAoUsuario
      ? perfilParaMostrar.obras
      : perfilParaMostrar.obras.filter(
          (obra) => !ehClassificacao18(obra.classificacaoIndicativa),
        );

    return [...obrasVisiveis].sort(
      (obraA, obraB) =>
        obterTimestampData(obraB.criadaEm) - obterTimestampData(obraA.criadaEm),
    );
  }, [perfilParaMostrar, perfilPertenceAoUsuario]);

  const obrasEmDestaque = useMemo(() => {
    if (topFiveObraIds.length === 0) {
      return [] as ObraLocal[];
    }

    const obrasDisponiveis = mesclarObrasPorIdSlug(
      obras,
      perfilParaMostrar?.obras || [],
    ).filter(
      (obra) =>
        perfilPertenceAoUsuario ||
        !ehClassificacao18(obra.classificacaoIndicativa),
    );
    const obrasSelecionadas = new Map<string, ObraLocal>();

    topFiveObraIds.forEach((obraId) => {
      const obraEncontrada = encontrarObraPorIdentificadorTopFivePerfil(
        obrasDisponiveis,
        obraId,
      );

      if (!obraEncontrada) {
        return;
      }

      const chaveObra =
        obraEncontrada.id.trim() ||
        obraEncontrada.slug.trim() ||
        normalizarTexto(obraEncontrada.titulo);

      if (chaveObra && !obrasSelecionadas.has(chaveObra)) {
        obrasSelecionadas.set(chaveObra, obraEncontrada);
      }
    });

    return Array.from(obrasSelecionadas.values()).slice(0, TOP_FIVE_MAXIMO);
  }, [
    obras,
    perfilParaMostrar?.obras,
    perfilPertenceAoUsuario,
    topFiveObraIds,
  ]);

  const destaquesPerfilVisivel =
    obrasPerfilVisivel &&
    (podeEditarPerfil
      ? perfilSalvoAutor.mostrarDestaques
      : mostrarDestaquesVisitante);

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

  useEffect(() => {
    const perfilAtual = perfilParaMostrar;
    let cancelado = false;

    async function carregarDiarioPerfil() {
      if (!perfilAtual) {
        setDiarioPerfil(diarioPerfilVazio);
        return;
      }

      const perfilDiario = perfilAtual;
      const userIdPerfil = perfilDiario.autorId.trim();
      const bibliotecaUsaUsuarioLogado =
        bibliotecaPerfilVisivel &&
        abaPerfil === "biblioteca" &&
        Boolean(usuarioIdLogado.trim());
      const userIdFonteDiario = bibliotecaUsaUsuarioLogado
        ? usuarioIdLogado.trim()
        : userIdPerfil;

      const estaVendoProprioPerfil =
        Boolean(usuarioIdLogado.trim()) &&
        userIdPerfil === usuarioIdLogado.trim();

      const incluirItensPrivados =
        bibliotecaUsaUsuarioLogado ||
        podeEditarPerfil ||
        estaVendoProprioPerfil;

      setDiarioPerfil({
        ...diarioPerfilVazio,
        carregando: true,
      });

      const diarioLocal = incluirItensPrivados
        ? montarDiarioPerfilLocal(
            perfilDiario,
            obrasFavoritas,
            obrasConcluidas,
            obrasSeguidasBiblioteca,
            obras,
          )
        : criarEstadoDiarioPerfilVazio();

      if (!userIdFonteDiario || !idAutorSupabaseValido(userIdFonteDiario)) {
        if (!cancelado) {
          setDiarioPerfil({
            carregando: false,
            ...diarioLocal,
          });
        }

        return;
      }

      const diarioSupabase = await carregarDiarioPerfilSupabase(
        userIdFonteDiario,
        obras,
        incluirItensPrivados,
        diarioPerfilVisivel,
        atividadesPerfilVisivel,
        obrasConcluidas,
      );
      const diarioSemFiltro = incluirItensPrivados
        ? mesclarDiarioPerfilComLocal(diarioSupabase, diarioLocal)
        : diarioSupabase;
      const diarioFinal = incluirItensPrivados
        ? diarioSemFiltro
        : aplicarPermissoesAbasAoDiario(
            diarioSemFiltro,
            permissoesAbasPerfil,
          );

      if (!cancelado) {
        setDiarioPerfil({
          carregando: false,
          ...diarioFinal,
        });
      }
    }

    const carregarDiarioTimer = window.setTimeout(() => {
      void carregarDiarioPerfil();
    }, 0);

    return () => {
      cancelado = true;
      window.clearTimeout(carregarDiarioTimer);
    };
  }, [
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
  ]);

  const itensDiarioTudo = useMemo(() => {
    const prioridadeTipos: Record<DiarioPerfilItem["tipo"], number> = {
      lendo: 0,
      concluida: 1,
      quero_ler: 2,
      favorita: 3,
      avaliacao: 4,
      review: 5,
      atividade: 6,
    };
    const itens = [
      ...diarioPerfil.lendoAgora,
      ...diarioPerfil.queroLer,
      ...diarioPerfil.favoritas,
      ...diarioPerfil.concluidas,
      ...diarioPerfil.avaliacoes,
      ...diarioPerfil.reviews,
      ...diarioPerfil.atividades,
    ];
    const itensPorObra = new Map<string, DiarioPerfilResumoItem>();

    itens.forEach((item) => {
      const obra = item.obra;

      if (!obra) {
        return;
      }

      const chaveObra = (
        obra.id ||
        obra.slug ||
        criarSlugBase(obra.titulo)
      )
        .trim()
        .toLowerCase();

      if (!chaveObra) {
        return;
      }

      const existente = itensPorObra.get(chaveObra);

      if (!existente) {
        itensPorObra.set(chaveObra, {
          ...item,
          tipos: [item.tipo],
        });
        return;
      }

      const tipos = Array.from(
        new Set([...existente.tipos, item.tipo]),
      ).sort(
        (tipoA, tipoB) =>
          prioridadeTipos[tipoA] - prioridadeTipos[tipoB],
      );
      const itemMaisRecente =
        obterTimestampData(item.data) >
        obterTimestampData(existente.data);
      const base = itemMaisRecente ? item : existente;

      itensPorObra.set(chaveObra, {
        ...base,
        tipo: tipos[0] || base.tipo,
        tipos,
      });
    });

    return Array.from(itensPorObra.values()).sort(
      (itemA, itemB) =>
        obterTimestampData(itemB.data) -
        obterTimestampData(itemA.data),
    );
  }, [diarioPerfil]);

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

  const generosPrincipaisPerfil = useMemo(() => {
    if (!perfilParaMostrar) {
      return [] as string[];
    }

    const contagemGeneros = new Map<string, number>();

    perfilParaMostrar.obras.forEach((obra) => {
      const genero = formatarGeneroPerfilAutor(obra.genero);

      if (!genero || genero === "Não informado") {
        return;
      }

      contagemGeneros.set(genero, (contagemGeneros.get(genero) || 0) + 1);
    });

    return Array.from(contagemGeneros.entries())
      .sort((generoA, generoB) => {
        if (generoA[1] !== generoB[1]) {
          return generoB[1] - generoA[1];
        }

        return generoA[0].localeCompare(generoB[0]);
      })
      .slice(0, 5)
      .map(([genero]) => genero);
  }, [perfilParaMostrar]);

  const totalVisualizacoesPerfil = perfilParaMostrar
    ? perfilParaMostrar.obras.reduce(
        (total, obra) => total + normalizarNumeroPerfilAutor(obra.visualizacoes),
        0,
      )
    : 0;
  const totalRascunhosPerfil = perfilParaMostrar
    ? Math.max(0, perfilParaMostrar.obras.length - perfilParaMostrar.totalPublicadas)
    : 0;
  const totalObrasSemCapitulosPerfil = perfilParaMostrar
    ? perfilParaMostrar.obras.filter((obra) => obra.capitulos.length === 0).length
    : 0;

  const obraMenuAberta = useMemo(() => {
    if (!obraMenuAbertoId) {
      return null;
    }

    return (
      obrasDoPerfilFiltradas.find((obra) => obra.id === obraMenuAbertoId) ||
      null
    );
  }, [obraMenuAbertoId, obrasDoPerfilFiltradas]);


  const itensBibliotecaQueroLer = useMemo(() => {
    if (!bibliotecaPerfilVisivel) {
      return [] as ItemBibliotecaPerfil[];
    }

    return converterItensDiarioParaBiblioteca(
      diarioPerfil.queroLer,
      "quero-ler",
    );
  }, [bibliotecaPerfilVisivel, diarioPerfil.queroLer]);

  const itensBibliotecaLendoAgora = useMemo(() => {
    if (!bibliotecaPerfilVisivel) {
      return [] as ItemBibliotecaPerfil[];
    }

    return converterItensDiarioParaBiblioteca(
      diarioPerfil.lendoAgora,
      "lendo-agora",
    );
  }, [bibliotecaPerfilVisivel, diarioPerfil.lendoAgora]);

  const itensBibliotecaFavoritas = useMemo(() => {
    if (!bibliotecaPerfilVisivel) {
      return [] as ItemBibliotecaPerfil[];
    }

    return converterItensDiarioParaBiblioteca(
      diarioPerfil.favoritas,
      "favorita",
    );
  }, [bibliotecaPerfilVisivel, diarioPerfil.favoritas]);

  const itensBibliotecaConcluidas = useMemo(() => {
    if (!bibliotecaPerfilVisivel) {
      return [] as ItemBibliotecaPerfil[];
    }

    return converterItensDiarioParaBiblioteca(
      diarioPerfil.concluidas,
      "concluida",
    );
  }, [bibliotecaPerfilVisivel, diarioPerfil.concluidas]);

  const itensBibliotecaHistorico = useMemo(() => {
    if (!bibliotecaPerfilVisivel) {
      return [] as ItemBibliotecaPerfil[];
    }

    const atividadesLeitura = diarioPerfil.atividades.filter(
      (item) => item.tipo === "lendo",
    );

    return converterItensDiarioParaBiblioteca(
      atividadesLeitura,
      "historico",
    );
  }, [bibliotecaPerfilVisivel, diarioPerfil.atividades]);

  const itensBibliotecaSalvos = useMemo(() => {
    if (!bibliotecaPerfilVisivel) {
      return [] as ItemBibliotecaPerfil[];
    }

    return converterCapitulosSalvosParaBiblioteca(obras);
  }, [bibliotecaPerfilVisivel, obras]);

  const obrasSeguidasPerfilTotal = useMemo(() => {
    const totalPorObrasCarregadas = obras.filter((obra) =>
      colecaoTemObraPerfilBiblioteca(obrasSeguidasBiblioteca, obra),
    ).length;

    return Math.max(totalPorObrasCarregadas, itensBibliotecaQueroLer.length);
  }, [obras, obrasSeguidasBiblioteca, itensBibliotecaQueroLer.length]);

  const obrasConcluidasPerfilTotal = useMemo(() => {
    const totalPorObrasCarregadas = obras.filter((obra) =>
      colecaoTemObraPerfilBiblioteca(obrasConcluidas, obra),
    ).length;

    return Math.max(
      obrasConcluidasPerfilPorObrasDoAutor,
      totalPorObrasCarregadas,
      itensBibliotecaConcluidas.length,
    );
  }, [
    obras,
    obrasConcluidas,
    obrasConcluidasPerfilPorObrasDoAutor,
    itensBibliotecaConcluidas.length,
  ]);

  const itensBibliotecaAtivos = useMemo(() => {
    if (abaBibliotecaPerfil === "quero-ler") {
      return itensBibliotecaQueroLer;
    }

    if (abaBibliotecaPerfil === "lendo-agora") {
      return itensBibliotecaLendoAgora;
    }

    if (abaBibliotecaPerfil === "favoritas") {
      return itensBibliotecaFavoritas;
    }

    if (abaBibliotecaPerfil === "concluidas") {
      return itensBibliotecaConcluidas;
    }

    if (abaBibliotecaPerfil === "salvos") {
      return itensBibliotecaSalvos;
    }

    if (abaBibliotecaPerfil === "historico") {
      return itensBibliotecaHistorico;
    }

    return mesclarItensBibliotecaPerfil(
      itensBibliotecaQueroLer,
      itensBibliotecaLendoAgora,
      itensBibliotecaFavoritas,
      itensBibliotecaConcluidas,
      itensBibliotecaSalvos,
      itensBibliotecaHistorico,
    );
  }, [
    abaBibliotecaPerfil,
    itensBibliotecaConcluidas,
    itensBibliotecaFavoritas,
    itensBibliotecaHistorico,
    itensBibliotecaLendoAgora,
    itensBibliotecaQueroLer,
    itensBibliotecaSalvos,
  ]);

  const bibliotecaMenuAberto = useMemo(() => {
    if (!bibliotecaMenuAbertoChave) {
      return null;
    }

    return (
      itensBibliotecaAtivos.find(
        (item) => item.chave === bibliotecaMenuAbertoChave,
      ) || null
    );
  }, [bibliotecaMenuAbertoChave, itensBibliotecaAtivos]);

  const rotuloBibliotecaAtiva =
    abaBibliotecaPerfil === "tudo"
      ? "todos os itens"
      : abaBibliotecaPerfil === "quero-ler"
        ? "quero ler"
        : abaBibliotecaPerfil === "lendo-agora"
          ? "lendo agora"
          : abaBibliotecaPerfil === "favoritas"
            ? "na lista"
            : abaBibliotecaPerfil === "concluidas"
              ? "concluídas"
              : abaBibliotecaPerfil === "salvos"
                ? "capítulos salvos"
                : "histórico";

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
  const comunidadeAutorBusca = encodeURIComponent(
    perfilParaMostrar?.nome || "",
  );
  const comunidadeAutorHref = comunidadeAutorBusca
    ? `/comunidade?busca=${comunidadeAutorBusca}`
    : "/comunidade";
  const comunidadeAutorTeoriasHref = comunidadeAutorBusca
    ? `${comunidadeAutorHref}&tipo=Teoria`
    : "/comunidade?tipo=Teoria";
  const comunidadeAutorReviewsHref = comunidadeAutorBusca
    ? `${comunidadeAutorHref}&tipo=Review`
    : "/comunidade?tipo=Review";

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

        {destaquesPerfilVisivel &&
          (obrasEmDestaque.length > 0 || podeEditarPerfil || mostrarDestaquesVisitante) && (
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
