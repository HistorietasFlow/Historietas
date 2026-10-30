"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { useNotificacoes } from "../../components/NotificacoesProvider";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
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
import { usePerfilAutorHighlightRenderer } from "./hooks/use-perfil-autor-highlight-renderer";
import { usePerfilAutorDiaryItemRenderer } from "./hooks/use-perfil-autor-diary-item-renderer";
import { usePerfilAutorWorkItemRenderer } from "./hooks/use-perfil-autor-work-item-renderer";
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
  PublicacaoComunidadePerfil,
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
  obterDadosCurtidaTopFivePerfilAutor,
  obterMensagemObrasVaziasPerfilAutor,
  obterMensagemTopFiveVazioPerfilAutor,
  obterDadosSheetBibliotecaPerfilAutor,
  obterDadosSheetObraPerfilAutor,
  obterRotulosAcoesColecoesObraPerfilAutor,
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
import { ProfileMenu } from "./components/profile-menu";
import { LoadingSpinner } from "./components/loading-spinner";
import { ProfilePageState } from "./components/profile-page-state";
import { LibraryItemCard } from "./components/library-item-card";
import { ProfileRatingsPanel } from "./components/profile-ratings-panel";
import { ProfileNavigationPanel } from "./components/profile-navigation-panel";
import { ProfileHero } from "./components/profile-hero";
import { ProfileHighlightsLikeButton } from "./components/profile-highlights-like-button";
import { ProfileHighlightsEditLink } from "./components/profile-highlights-edit-link";
import { ProfileHighlightsPanel } from "./components/profile-highlights-panel";
import { ProfileLibraryPanel } from "./components/profile-library-panel";
import { ProfileCommunityTab } from "./components/profile-community-tab";
import { ProfileTabContent } from "./components/profile-tab-content";
import { ProfileCommunityPostItem } from "./components/profile-community-post-item";
import { ProfileAboutSection } from "./components/profile-about-section";
import { ProfileDiaryPanel } from "./components/profile-diary-panel";
import { ProfileWorksPanel } from "./components/profile-works-panel";
import { ProfileActionSheets } from "./components/profile-action-sheets";
import { ProfileEditor } from "./components/profile-editor";
import { ProfileHeader } from "./components/profile-header";
import { ProfileReportModals } from "./components/profile-report-modals";
import {
  obterEstilosResponsivosPerfilAutor,
  perfilAutorThemeCss,
  pageStyle,
  menuItemStyle,
  menuDangerItemStyle,
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
  const inicialAvatarPerfilEditor = obterInicialAvatarPerfilAutor(
    nomePerfilEditor,
    perfilNome,
  );
  const caracteresRestantesBioPerfil = obterCaracteresRestantesPerfilAutor(
    bioPerfilEditor,
    BIO_MAX_LENGTH,
  );

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

  const publicacoesRecentesComunidade =
    comunidadePerfil.publicacoesRecentes;
  const comunidadeSemPublicacoesRecentes =
    comunidadeSemPublicacoesRecentesPerfilAutor(
      publicacoesRecentesComunidade,
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
  const renderizarPublicacaoRecenteComunidade = (
    publicacao: PublicacaoComunidadePerfil,
  ) => {
    const dadosPublicacao =
      obterDadosPublicacaoRecenteComunidadePerfilAutor(
        publicacao,
      );

    return (
      <ProfileCommunityPostItem
        key={publicacao.id}
        publicacao={publicacao}
        href={dadosPublicacao.href}
        ariaLabel={dadosPublicacao.ariaLabel}
        resumo={dadosPublicacao.resumo}
        totalOpcoesEnquete={
          dadosPublicacao.totalOpcoesEnquete
        }
        exibirInfoEnquete={
          dadosPublicacao.exibirInfoEnquete
        }
        exibirObraRelacionada={
          dadosPublicacao.exibirObraRelacionada
        }
        paddingBottom={
          paddingInferiorPublicacaoComunidade
        }
        dateLabel={dataDiarioPerfilFormatada(
          publicacao.criadoEm,
        )}
        showReportButton={perfilVisitante}
        onReport={() =>
          abrirDenunciaConteudoPerfil(
            "post",
            publicacao.id,
            dadosPublicacao.resumo,
          )
        }
      />
    );
  };

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

  const { renderizarObraDestaquePerfilAutor } =
    usePerfilAutorHighlightRenderer();

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
  const atividadesDiarioPerfil = diarioPerfil.atividades;
  const diarioPerfilCarregando = diarioPerfil.carregando;

  const { renderizarItemDiarioPerfil } =
    usePerfilAutorDiaryItemRenderer(perfilAutorId);

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

  const { renderizarObraPerfilAutor } = usePerfilAutorWorkItemRenderer({
    isDesktop,
    obraMenuAbertoId,
    setObraMenuAbertoId,
    totaisInteracoesObras,
  });


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
    atividades: atividadesDiarioPerfil,
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
  const renderizarItemBiblioteca = (
    item: (typeof itensBibliotecaAtivos)[number],
  ) => {
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
  };

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
  const ariaLabelAlternarUsernameCabecalho =
    obterRotuloVisibilidadeUsernamePerfilAutor(usernameCabecalhoVisivel);
  const ariaLabelCopiarUsernameCabecalho =
    obterAriaLabelCopiarUsernamePerfilAutor(autorHandlePerfil);
  const usernameExibidoCabecalho =
    obterUsernameExibidoPerfilAutor(autorHandlePerfil);
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

  const dadosSheetObraPerfil = obraMenuAberta
    ? obterDadosSheetObraPerfilAutor({
        obra: obraMenuAberta,
        totaisInteracoesObras,
        obrasFavoritas,
        obrasConcluidas,
        obrasSeguidasBiblioteca,
        traduzirTexto: (item) => traduzirTextoPerfilAutor(item, language),
      })
    : null;
  const rotulosSheetObraPerfil = dadosSheetObraPerfil
    ? obterRotulosAcoesColecoesObraPerfilAutor({
        obraFavorita: dadosSheetObraPerfil.obraFavorita,
        obraConcluida: dadosSheetObraPerfil.obraConcluida,
      })
    : null;
  const dadosSheetBibliotecaPerfil = bibliotecaMenuAberto
    ? obterDadosSheetBibliotecaPerfilAutor({
        item: bibliotecaMenuAberto,
        obrasFavoritas,
        obrasConcluidas,
        obrasSeguidasBiblioteca,
      })
    : null;
  const metaSheetBibliotecaPerfil = bibliotecaMenuAberto
    ? obterMetaMenuBibliotecaPerfil(bibliotecaMenuAberto)
    : "";
  const rotulosSheetBibliotecaPerfil = dadosSheetBibliotecaPerfil
    ? obterRotulosAcoesColecoesBibliotecaPerfil({
        obraNoQueroLer: dadosSheetBibliotecaPerfil.obraNoQueroLer,
        obraFavorita: dadosSheetBibliotecaPerfil.obraFavorita,
        obraConcluida: dadosSheetBibliotecaPerfil.obraConcluida,
      })
    : null;
  const rotuloRemoverSheetBibliotecaPerfil = bibliotecaMenuAberto
    ? obterRotuloAcaoRemoverBibliotecaPerfil(abaBibliotecaPerfil)
    : "";



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
        <ProfileHeader
          ariaLabelCopyUsername={ariaLabelCopiarUsernameCabecalho}
          ariaLabelToggleUsername={ariaLabelAlternarUsernameCabecalho}
          headerStyle={profileHeaderAtualStyle}
          menuOpen={menuPerfilAberto}
          onCopyUsername={copiarUsernameCabecalho}
          onOpenMenu={() => setMenuPerfilAberto(true)}
          onToggleUsername={() =>
            setUsernameCabecalhoVisivel((visivel) => !visivel)
          }
          username={usernameExibidoCabecalho}
          usernameVisible={usernameCabecalhoVisivel}
        />

        {menuPerfilAberto && (
          <ProfileMenu
            ariaLabelNotificationBadge={ariaLabelBadgeNotificacoes}
            ariaLabelNotifications={ariaLabelNotificacoes}
            blockActionLabel={rotuloAcaoBloqueioPerfil}
            blockActionStyle={menuBloqueioStyle}
            blockSaving={bloqueioPerfilSalvando}
            communityHref={comunidadeAutorHref}
            hasUnreadNotifications={temNotificacoesNaoLidas}
            isOwner={podeEditarPerfil}
            notificationsUnreadFormatted={notificacoesNaoLidasFormatadas}
            onBlock={() => void alternarBloqueioPerfil()}
            onClose={() => setMenuPerfilAberto(false)}
            onCopyLink={() => void copiarLinkPerfil()}
            onReport={abrirDenunciaPerfil}
            onSignOut={() => void sairDaConta()}
            profileName={perfilNome}
            sheetStyle={menuSheetAtualStyle}
          />
        )}

        {editorPerfilVisivel && (
          <ProfileEditor
            actionLabel={rotuloAcaoAvatar}
            avatar={avatarPerfilEditor}
            avatarActionsStyle={avatarActionsAtualStyle}
            avatarError={avatarErro}
            avatarRemoveButtonStyle={avatarRemoveButtonAtualStyle}
            avatarSmallButtonStyle={avatarSmallButtonAtualStyle}
            bio={bioPerfilEditor}
            bioPlaceholder={bioPadraoAutor}
            disabled={salvandoEditorPerfil}
            fallbackInitial={inicialAvatarPerfilEditor}
            hasAvatar={temAvatarPerfilEditor}
            maxBioLength={BIO_MAX_LENGTH}
            name={nomePerfilEditor}
            onBioChange={(value) =>
              setBioPerfilEditor(
                limitarTextoPerfilAutor(value, BIO_MAX_LENGTH),
              )
            }
            onCancel={fecharEditorPerfil}
            onChooseImage={() => avatarInputRef.current?.click()}
            onClose={fecharEditorPerfil}
            onNameChange={(value) =>
              setNomePerfilEditor(limitarTextoPerfilAutor(value, 80))
            }
            onRemoveImage={removerAvatarAutor}
            onSave={() => void salvarEdicaoPerfilAutor()}
            onUsernameChange={(value) =>
              setUsernamePerfilEditor(normalizarUsernamePerfilAutor(value))
            }
            remainingBioCharacters={caracteresRestantesBioPerfil}
            saveLabel={rotuloSalvarEditor}
            sheetStyle={menuSheetAtualStyle}
            username={usernamePerfilEditor}
          />
        )}

        <ProfileReportModals
          profileOpen={denunciaPerfilVisivel}
          profileTargetId={dadosDenunciaPerfil.alvoId}
          profileTargetTitle={dadosDenunciaPerfil.alvoTitulo}
          profileTargetUrl={dadosDenunciaPerfil.alvoUrl}
          contentOpen={denunciaConteudoVisivel}
          contentTargetType={dadosDenunciaConteudoPerfil.alvoTipo}
          contentTargetId={dadosDenunciaConteudoPerfil.alvoId}
          contentTargetTitle={dadosDenunciaConteudoPerfil.alvoTitulo}
          onProfileClose={() => setDenunciaPerfilAberta(false)}
          onProfileSent={() => {
            setDenunciaPerfilAberta(false);
            setMensagemAcao("Denúncia enviada para análise.");
          }}
          onContentClose={() => setAlvoDenunciaConteudoPerfil(null)}
          onContentSent={() => {
            setAlvoDenunciaConteudoPerfil(null);
            setMensagemAcao("Denúncia enviada para análise.");
          }}
        />

        <ProfileHero
          heroStyle={heroAtualStyle}
          identityRowStyle={authorTopRowAtualStyle}
          avatarInputRef={avatarInputRef}
          onSelectAvatar={selecionarAvatarAutor}
          autorNome={perfilNome}
          avatar={avatarAutor}
          isDesktop={isDesktop}
          podeEditar={podeEditarPerfil}
          onEdit={abrirEditorPerfil}
          avaliacaoDiarioPrivada={avaliacaoDiarioPrivada}
          avaliacaoEhDiario={avaliacaoResumoEhDiario}
          avaliacaoMedia={avaliacaoResumoPerfil.media}
          avaliacaoTotal={avaliacaoResumoPerfil.total}
          avaliacaoVisivel={avaliacaoResumoPerfilVisivel}
          language={language}
          obrasSeguidasHref={obrasSeguidasPerfilHref}
          obrasSeguidasTotal={obrasSeguidasPerfilTotal}
          seguidoresHref={seguidoresPerfilHref}
          seguidoresTotal={seguidoresTotal}
          seguindoHref={seguindoPerfilHref}
          seguindoTotal={seguindoTotalPerfil}
          bioFallback={bioAutor}
          bioPersonalizada={bioAutorPersonalizada}
          actionsStyle={profileActionsExibicaoStyle}
          mostrarDestaquesAutor={mostrarDestaquesAutor}
          onShare={() => void copiarLinkPerfil()}
          onToggleOwnerHighlights={alternarDestaquesPerfil}
          existeBloqueio={existeBloqueioPerfil}
          onFollow={() => void alternarSeguirAutor()}
          followDisabled={seguirUsuarioSalvando}
          followAriaLabel={ariaLabelSeguimento}
          followTitle={titleSeguimento}
          followBaseStyle={estiloBaseBotaoSeguimento}
          followOpacity={opacidadeBotaoSeguimento}
          followCursor={cursorBotaoSeguimento}
          followLabel={rotuloSeguimento}
          mostrarDestaquesVisitante={mostrarDestaquesVisitante}
          obrasVisiveis={obrasPerfilVisivel}
          onToggleVisitorHighlights={() =>
            setMostrarDestaquesVisitante((valorAtual) => !valorAtual)
          }
          message={mensagemAcao}
        />

        {exibirSecaoDestaques && (
          <ProfileHighlightsPanel
            headerActions={acoesCabecalhoTopFive}
            isDesktop={isDesktop}
            message={mensagemTopFiveVazio}
            obras={obrasEmDestaque}
            renderObra={renderizarObraDestaquePerfilAutor}
            temObras={temObrasEmDestaque}
            titleActions={acoesTituloTopFive}
          />
        )}

        <ProfileRatingsPanel
          avaliacaoAutorAcaoVisivel={avaliacaoAutorAcaoVisivel}
          avaliacaoAutorMinhaNota={avaliacaoAutor.minhaNota}
          avaliacaoDiarioAcaoVisivel={avaliacaoDiarioAcaoVisivel}
          avaliacaoDiarioMinhaNota={avaliacaoDiario.minhaNota}
          avaliacaoDiarioSalvando={avaliacaoDiario.salvando}
          isDesktop={isDesktop}
          onAvaliarAutor={avaliarAutor}
          onAvaliarDiarioPerfil={avaliarDiarioPerfil}
        />

        <ProfileNavigationPanel
          abaAtiva={abaPerfil}
          bibliotecaVisivel={bibliotecaPerfilVisivel}
          comunidadeVisivel={comunidadePerfilVisivel}
          conteudoPrivadoBloqueado={conteudoPrivadoBloqueado}
          diarioVisivel={diarioPerfilVisivel}
          obrasVisivel={obrasPerfilVisivel}
          perfilBloqueadoEntreUsuarios={perfilBloqueadoEntreUsuarios}
          sobreVisivel={sobrePerfilVisivel}
          temAbasPerfilVisiveis={temAbasPerfilVisiveis}
          totalAbasVisiveis={totalAbasPerfilVisiveis}
          onSelect={selecionarAbaPerfil}
        />

        <ProfileTabContent
          bibliotecaPerfilAtiva={bibliotecaPerfilAtiva}
          diarioPerfilAtivo={diarioPerfilAtivo}
          comunidadePerfilAtiva={comunidadePerfilAtiva}
          sobrePerfilAtivo={sobrePerfilAtivo}
          obrasPerfilAtivo={obrasPerfilAtivo}
          renderBiblioteca={() => (
            <ProfileLibraryPanel
            abaAtiva={abaBibliotecaPerfil}
            isDesktop={isDesktop}
            onSelect={setAbaBibliotecaPerfil}
            loading={diarioPerfilCarregando}
            empty={bibliotecaSemItensAtivosPerfilAutor(
              itensBibliotecaAtivos,
            )}
            emptyMessage={mensagemBibliotecaVazia}
            items={itensBibliotecaAtivos}
            renderItem={renderizarItemBiblioteca}
            />
          )}
          renderDiario={() => (
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
            items={itensDiarioTudo}
            renderItem={renderizarItemDiarioPerfil}
            />
          )}
          renderComunidade={() => (
            <ProfileCommunityTab
            empty={comunidadeSemPublicacoesRecentes}
            emptyDescription={avisoComunidadeVazia.description}
            emptyTitle={avisoComunidadeVazia.title}
            error={erroComunidadePerfil}
            isDesktop={isDesktop}
            loading={comunidadePerfil.carregando}
            publicacoes={{
              href: comunidadeAutorHref,
              ariaLabel: ariaLabelsEstatisticasComunidade.publicacoes,
              value: valoresEstatisticasComunidade.publicacoes,
            }}
            publicacoesRecentes={publicacoesRecentesComunidade}
            renderPost={renderizarPublicacaoRecenteComunidade}
            reviews={{
              href: comunidadeAutorReviewsHref,
              ariaLabel: ariaLabelsEstatisticasComunidade.reviews,
              value: valoresEstatisticasComunidade.reviews,
            }}
            teorias={{
              href: comunidadeAutorTeoriasHref,
              ariaLabel: ariaLabelsEstatisticasComunidade.teorias,
              value: valoresEstatisticasComunidade.teorias,
            }}
            title={tituloComunidadePerfil}
            />
          )}
          renderSobre={() => (
            <ProfileAboutSection
            heroTitle={obterTituloSobrePerfilAutor(perfilNome)}
            heroText={bioSobreAutorExibido}
            heroUserContent={bioSobreAutorUserContent}
            heroCanEdit={podeEditarPerfil}
            onToggleHeroEditor={() =>
              setEditorSobreAberto((aberto) => !aberto)
            }
            heroEditorVisible={editorSobreVisivel}
            heroEditorValue={perfilSalvoAutor.sobreBio}
            onHeroEditorChange={(event) =>
              atualizarBioSobreAutor(event.target.value)
            }
            heroEditorPlaceholder={bioAutor}
            heroEditorMaxLength={SOBRE_BIO_MAX_LENGTH}
            heroEditorRemainingCharacters={caracteresRestantesBioSobre}
            generosEspecialidadesPerfil={generosEspecialidadesPerfil}
            totalPublicadas={compactarNumeroPerfilAutor(
              perfilParaMostrar.totalPublicadas,
            )}
            totalCapitulos={compactarNumeroPerfilAutor(
              perfilParaMostrar.totalCapitulos,
            )}
            totalCurtidas={compactarNumeroPerfilAutor(
              perfilParaMostrar.totalCurtidas,
            )}
            totalVisualizacoes={compactarNumeroPerfilAutor(
              totalVisualizacoesPerfil,
            )}
            totalObras={totalObrasPerfil}
            totalRascunhos={totalRascunhosPerfil}
            totalComentarios={perfilParaMostrar.totalComentarios}
            totalConcluidas={obrasConcluidasPerfilTotal}
            mostrarObrasSemCapitulos={temObrasSemCapitulosPerfil}
            totalObrasSemCapitulos={totalObrasSemCapitulosPerfil}
            memberSince={entradaHistorietasPerfil}
            showRecentActivity={atividadesPerfilVisivel}
            recentActivityExpanded={atividadeSobreAberta}
            recentActivityLoading={diarioPerfilCarregando}
            recentActivityItems={atividadesDiarioPerfil}
            onToggleRecentActivity={() =>
              setAtividadeSobreAberta((valorAtual) => !valorAtual)
            }
            />
          )}
          renderObras={() => (
            <ProfileWorksPanel
            empty={obrasSemResultadosPerfilAutor(obrasDoPerfilFiltradas)}
            emptyMessage={mensagemObrasVazias}
            isDesktop={isDesktop}
            obras={obrasDoPerfilFiltradas}
            renderObra={renderizarObraPerfilAutor}
            />
          )}
        />

        <ProfileActionSheets
          bibliotecaMenuAberto={bibliotecaMenuAberto}
          dadosSheetBibliotecaPerfil={dadosSheetBibliotecaPerfil}
          dadosSheetObraPerfil={dadosSheetObraPerfil}
          exibirAcoesVisitante={perfilVisitante}
          metaSheetBibliotecaPerfil={metaSheetBibliotecaPerfil}
          obraMenuAberta={obraMenuAberta}
          rotuloRemoverSheetBibliotecaPerfil={rotuloRemoverSheetBibliotecaPerfil}
          rotulosSheetBibliotecaPerfil={rotulosSheetBibliotecaPerfil}
          rotulosSheetObraPerfil={rotulosSheetObraPerfil}
          onCloseBiblioteca={() => setBibliotecaMenuAbertoChave("")}
          onCloseObra={() => setObraMenuAbertoId("")}
          onReadBiblioteca={() => setBibliotecaMenuAbertoChave("")}
          onReadObra={() => setObraMenuAbertoId("")}
          onRemoveBiblioteca={() => {
            setBibliotecaMenuAbertoChave("");
            void removerItemBibliotecaPerfil(bibliotecaMenuAberto!);
          }}
          onReportObra={() =>
            abrirDenunciaConteudoPerfil(
              "obra",
              obraMenuAberta!.id,
              obraMenuAberta!.titulo,
            )
          }
          onShareBiblioteca={() => {
            setBibliotecaMenuAbertoChave("");
            void compartilharObraPerfilAutor(bibliotecaMenuAberto!.obra);
          }}
          onShareObra={() => void compartilharObraPerfilAutor(obraMenuAberta!)}
          onToggleBibliotecaCompleted={() => {
            setBibliotecaMenuAbertoChave("");
            void alternarConcluidoObra(bibliotecaMenuAberto!.obra.id);
          }}
          onToggleBibliotecaFavorite={() => {
            setBibliotecaMenuAbertoChave("");
            void alternarFavoritoObra(bibliotecaMenuAberto!.obra.id);
          }}
          onToggleBibliotecaWantToRead={() => {
            setBibliotecaMenuAbertoChave("");
            void alternarObraSeguindoBibliotecaPerfil(
              bibliotecaMenuAberto!.obra,
              !dadosSheetBibliotecaPerfil!.obraNoQueroLer,
            );
          }}
          onToggleObraCompleted={() => {
            setObraMenuAbertoId("");
            void alternarConcluidoObra(obraMenuAberta!.id);
          }}
          onToggleObraFavorite={() => {
            setObraMenuAbertoId("");
            void alternarFavoritoObra(obraMenuAberta!.id);
          }}
        />

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
