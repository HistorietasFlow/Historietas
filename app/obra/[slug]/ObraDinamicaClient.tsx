"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { SnapshotObraPublica } from "../../../lib/cache/obrasPublicas";
import { useObraPublicSnapshot } from "./hooks/use-obra-public-snapshot";
import { perfilDoAutorAtual } from "./lib/obra-public-snapshot";
import { obraSsrResponsiveCss } from "./lib/obra-ssr-responsive-css";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import { useParams, useRouter } from "next/navigation";
import DenunciaModal from "../../../components/DenunciaModal";
import AdultContentGate from "../../../components/AdultContentGate";
import { historietasThemeCss, useHistorietasTheme } from "../../../lib/historietasTheme";
import { formatarNumeroCompacto, normalizarTexto } from "../../../lib/utils";
import { ehClassificacao18 } from "../../../lib/historietasAdultContent";
import { manterFocoNoDialogo } from "./lib/obra-dialog-focus";
import { useObraDialogInitialFocus } from "./hooks/use-obra-dialog-initial-focus";
import { useObraAuthIdentityLifecycle } from "./hooks/use-obra-auth-identity-lifecycle";
import { useObraActionAuthGuards } from "./hooks/use-obra-action-auth-guards";
import { useObraPublicWorkLoad } from "./hooks/use-obra-public-work-load";
import { useObraAuthorPublicProfile } from "./hooks/use-obra-author-public-profile";
import { useObraCurrentUserPublicProfile } from "./hooks/use-obra-current-user-public-profile";
import { useObraCommentsNow } from "./hooks/use-obra-comments-now";
import { useObraCommentRepliesVisibility } from "./hooks/use-obra-comment-replies-visibility";
import { useObraCommentsOrdering } from "./hooks/use-obra-comments-ordering";
import { useObraCommentsLoadPagination } from "./hooks/use-obra-comments-load-pagination";
import { useObraCommentMutations } from "./hooks/use-obra-comment-mutations";
import { useObraWorkInteractions } from "./hooks/use-obra-work-interactions";
import { useObraRatingLifecycle } from "./hooks/use-obra-rating-lifecycle";
import { useObraWorkMetricsLifecycle } from "./hooks/use-obra-work-metrics-lifecycle";
import { useObraWorkMetricsRequest } from "./hooks/use-obra-work-metrics-request";
import { useObraActionsSheet } from "./hooks/use-obra-actions-sheet";
import { useObraClassificationPanel } from "./hooks/use-obra-classification-panel";
import { useObraCommentsSheetBodyLock } from "./hooks/use-obra-comments-sheet-body-lock";
import { useObraCommentsSheetInteractions } from "./hooks/use-obra-comments-sheet-interactions";
import { useObraCommentsDeepLink } from "./hooks/use-obra-comments-deep-link";
import { useObraContent18Access } from "./hooks/use-obra-content-18-access";
import { useObraDesktopMode } from "./hooks/use-obra-desktop-mode";
import { useObraViewRegistration } from "./hooks/use-obra-view-registration";
import {
  avaliacaoObraVazia,
  type AvaliacaoObraPublica,
} from "./lib/obra-rating-utils";
import { metricasComunidadeObraVazias, metricasObraVazias, type MetricasComunidadeObra, type MetricasObraPublica } from "./lib/obra-metric-utils";
import { obterClassificacaoIndicativaCompactaObra, obterContextoAutorObra, obterGeneroObraExibido, obterSinopseObraExibida, obterTextosPainelClassificacaoObra } from "./lib/obra-text-utils";
import { criarLinkComunidadeObra, criarLinkPerfilAutor } from "./lib/obra-navigation-utils";
import { ObraDinamicaLanguageBridge } from "./components/obra-dinamica-language-bridge";
import { capaObraPodeSerOtimizada, obterIniciaisCapaObra } from "./lib/obra-cover-utils";
import { obterAcaoLeituraPrincipalObra, obterCapitulosObraPublica, obterIndicadorConteudoObraPublica, obterObraDisponivelExibida, obterTextoDisponibilidadeCapitulosObra, type CapituloDinamico } from "./lib/obra-reading-utils";
import { criarEstruturaComentariosObra, obterObraIdComentarios, type ComentarioObraPublico, type RespostaComentarioObra } from "./lib/obra-comment-utils";
import { copiarLinkComFallback } from "./lib/obra-share-utils";
import { obraPageCss } from "./lib/obra-page-css";
import type { VersoesInteracoesObraPublica } from "./lib/obra-interaction-utils";
import type { AlvoDenunciaObraDinamica } from "./lib/obra-report-utils";
import { obterObraDinamicaPorSlug, type ObraLocal } from "./lib/obra-data-utils";
import LoadingSpinner from "./ObraLoadingSpinner";
import { containerStyle, desktopContainerStyle, pageStyle, heroContentStyle, heroGlowStyle, heroOverlayContentStyle, heroStyle, desktopHeroStyle, desktopHeroContentStyle, desktopHeroOverlayContentStyle } from "./lib/obra-style-utils";
import ObraCommentComposer from "./components/obra-comment-composer";
import ObraCommentsHeader from "./components/obra-comments-header";
import ObraCommentsHandle from "./components/obra-comments-handle";
import ObraCommentsList from "./components/obra-comments-list";
import ObraCommentsSheet from "./components/obra-comments-sheet";
import ObraClassificationPanel from "./components/obra-classification-panel";
import ObraActionsSheet from "./components/obra-actions-sheet";
import ObraRatingBox from "./components/obra-rating-box";
import ObraCommunitySection from "./components/obra-community-section";
import ObraStatsGrid from "./components/obra-stats-grid";
import ObraSynopsisSection from "./components/obra-synopsis-section";
import ObraChaptersSection from "./components/obra-chapters-section";
import ArquivoObraPublico from "./components/arquivo-obra-publico";
import ObraRatingSummary from "./components/obra-rating-summary";
import { textosStatusEditorial } from "../../../lib/statusEditorial";
import ObraHeroHeader from "./components/obra-hero-header";
import ObraHeroCover from "./components/obra-hero-cover";
import ObraHeroMetaBar from "./components/obra-hero-meta-bar";
import ObraHeroActions from "./components/obra-hero-actions";
import ObraHeroDetails from "./components/obra-hero-details";
import ObraActionToast from "./components/obra-action-toast";

const FOLLOWED_WORKS_STORAGE_KEY = "historietas-obras-seguidas";
const LIKED_WORKS_STORAGE_KEY = "historietas-obras-curtidas";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
export default function ObraDinamicaPage({ snapshotInicial }: { snapshotInicial?: SnapshotObraPublica } = {}) {
  const router = useRouter();
  const { language } = useHistorietasLanguage();
  const params = useParams<{ slug?: string | string[] }>();

  const slug = useMemo(() => {
    const parametro = params?.slug;

    if (Array.isArray(parametro)) {
      return parametro[0] || "";
    }

    return parametro || "";
  }, [params]);

  const [obrasLocais, setObrasLocais] = useState<ObraLocal[]>([]);
  const [carregandoObras, setCarregandoObras] = useState(true);
  const [erroCarregamentoObra, setErroCarregamentoObra] = useState(false);
  const [obraSeguida, setObraSeguida] = useState(false);
  const [obraFavoritada, setObraFavoritada] = useState(false);
  const [obraConcluida, setObraConcluida] = useState(false);
  const [metricasObra, setMetricasObra] =
    useState<MetricasObraPublica>(metricasObraVazias);
  const [metricasComunidadeObra, setMetricasComunidadeObra] =
    useState<MetricasComunidadeObra>(metricasComunidadeObraVazias);
  const versoesInteracoesRef = useRef<VersoesInteracoesObraPublica>({
    seguimento: 0,
    curtida: 0,
    favorito: 0,
    conclusao: 0,
  });
  const [avaliacaoObra, setAvaliacaoObra] =
    useState<AvaliacaoObraPublica>(avaliacaoObraVazia);
  const [mensagemAcao, setMensagemAcao] = useState("");
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [denunciaAlvo, setDenunciaAlvo] =
    useState<AlvoDenunciaObraDinamica | null>(null);
  const [sinopseAberta, setSinopseAberta] = useState(false);
  const [comentariosObra, setComentariosObra] = useState<ComentarioObraPublico[]>([]);
  const [totalComentariosObra, setTotalComentariosObra] = useState(0);
  const [comentariosCarregando, setComentariosCarregando] = useState(false);
  const [comentariosCarregandoMais, setComentariosCarregandoMais] =
    useState(false);
  const [comentariosTemMais, setComentariosTemMais] = useState(false);
  const [comentariosProximoOffset, setComentariosProximoOffset] = useState(0);
  const [comentarioTexto, setComentarioTexto] = useState("");
  const [comentarioStatus, setComentarioStatus] = useState("");
  const [comentarioEnviando, setComentarioEnviando] = useState(false);
  const [comentarioRemovendoId, setComentarioRemovendoId] = useState("");
  const [comentarioCurtindoId, setComentarioCurtindoId] = useState("");
  const [respostaComentario, setRespostaComentario] =
    useState<RespostaComentarioObra | null>(null);
  const {
    respostasVisiveisPorComentario,
    resetarRespostasVisiveis,
    garantirRespostaVisivel,
    mostrarRespostas,
    mostrarMaisRespostas,
    ocultarRespostas,
  } = useObraCommentRepliesVisibility();
  const {
    ordenacaoComentarios,
    menuOrdenacaoComentariosAberto,
    alternarMenuOrdenacaoComentarios,
    selecionarComentariosRelevantes,
    selecionarComentariosRecentes,
    fecharMenuOrdenacaoComentarios,
  } = useObraCommentsOrdering();
  const isDesktop = useObraDesktopMode();
  const {
    comentariosAbertos,
    comentariosSheetExpandido,
    comentariosSheetRef,
    comentariosDragResetTimerRef,
    abrirComentariosObra,
    fecharComentariosObra,
    iniciarArrasteComentariosObra,
    moverArrasteComentariosObra,
    finalizarArrasteComentariosObra,
    alternarExpansaoComentariosObra,
  } = useObraCommentsSheetInteractions({
    isDesktop,
    fecharMenuOrdenacaoComentarios,
    limparRespostaComentario: () => setRespostaComentario(null),
  });
  const {
    acoesObraAbertas,
    setAcoesObraAbertas,
    acoesObraDialogRef,
    fecharAcoesObra,
    alternarAcoesObra,
  } = useObraActionsSheet();
  const {
    painelClassificacaoAberto,
    classificacaoDialogRef,
    abrirPainelClassificacaoObra,
    fecharPainelClassificacaoObra,
    resetarPainelClassificacaoObra,
  } = useObraClassificationPanel();
  const comentarioInputRef = useRef<HTMLTextAreaElement | null>(null);
  const agoraComentarios = useObraCommentsNow(comentariosAbertos);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const invalidarAvaliacaoObraRef = useRef<() => void>(() => {});
  const fecharInteracoesAnterioresRef = useRef<() => void>(() => {});
  useLayoutEffect(() => {
    fecharInteracoesAnterioresRef.current = () => { fecharComentariosObra(); fecharAcoesObra(); };
  }, [fecharComentariosObra, fecharAcoesObra]);

  const limparEstadoContaAnterior = useCallback(() => {
    fecharInteracoesAnterioresRef.current();
    setObrasLocais([]);
    setCarregandoObras(true);
    setObraSeguida(false);
    setObraFavoritada(false);
    setObraConcluida(false);
    setMetricasObra(metricasObraVazias);
    setAvaliacaoObra(avaliacaoObraVazia);
    setComentariosObra([]);
    setTotalComentariosObra(0);
    setComentarioTexto("");
    setComentarioStatus("");
    setComentarioEnviando(false);
    setComentarioRemovendoId("");
    setComentarioCurtindoId("");
    setRespostaComentario(null);
    resetarRespostasVisiveis();
    setMensagemAcao("");
    invalidarAvaliacaoObraRef.current();
  }, [resetarRespostasVisiveis]);

  useEffect(() => {
    if (!mensagemAcao) {
      return;
    }

    const timerMensagemAcao = window.setTimeout(() => {
      setMensagemAcao("");
    }, 3000);

    return () => {
      window.clearTimeout(timerMensagemAcao);
    };
  }, [mensagemAcao]);

  const {
    usuarioIdLogado,
    erroAutenticacao,
    tentarAutenticacaoNovamente,
    autenticacaoCarregada,
    identidadeAutenticadaObraRef,
    versaoIdentidade,
  } = useObraAuthIdentityLifecycle({
    onIdentidadeMudou: limparEstadoContaAnterior,
  });
  const perfilUsuarioLogado =
    useObraCurrentUserPublicProfile(usuarioIdLogado);


  useObraCommentsSheetBodyLock(
    comentariosAbertos,
    comentariosDragResetTimerRef,
  );
  useObraDialogInitialFocus(comentariosAbertos, comentariosSheetRef);
  useObraPublicWorkLoad({
    habilitado: !snapshotInicial,
    autenticacaoCarregada,
    slug,
    usuarioIdLogado,
    identidadeAutenticadaObraRef,
    setObrasLocais,
    setCarregandoObras,
    setErroCarregamentoObra,
  });

  const obraLegada = useMemo(
    () => obterObraDinamicaPorSlug(obrasLocais, slug),
    [slug, obrasLocais]
  );
  const publica = useObraPublicSnapshot({ inicial: snapshotInicial, autenticacaoCarregada,
    usuarioIdLogado, identidadeRef: identidadeAutenticadaObraRef, versaoIdentidade,
    onIndisponivel: () => { fecharComentariosObra(); fecharAcoesObra(); resetarPainelClassificacaoObra(); } });
  const obra = snapshotInicial ? publica.obra : obraLegada;
  const obraLeitura = snapshotInicial ? publica.leitura : obra;
  // Estado privado não é inicializado com a identidade anônima do SSR.
  const obraInteracoes = snapshotInicial && !publica.pronta ? null : obra;
  useObraCommentsDeepLink({
    abrirComentariosObra,
    pronto: autenticacaoCarregada && (!snapshotInicial || publica.interativa),
    chaveRota: slug,
  });
  const contextoAcaoRef = useRef("");
  useLayoutEffect(() => {
    if (contextoAcaoRef.current && contextoAcaoRef.current !== publica.contexto) {
      limparEstadoContaAnterior();
    }
    contextoAcaoRef.current = publica.contexto;
  }, [publica.contexto, limparEstadoContaAnterior]);

  useEffect(() => {
    const fecharPaineisTimer = window.setTimeout(() => {
      setSinopseAberta(false);
      resetarPainelClassificacaoObra();
    }, 0);

    return () => {
      window.clearTimeout(fecharPaineisTimer);
    };
  }, [obra?.id, resetarPainelClassificacaoObra]);

  const { statusAcesso18, permitirAcesso18Atual } =
    useObraContent18Access(obra);

  useObraViewRegistration(obraInteracoes, statusAcesso18, setMetricasObra);

  const perfilAutorCarregado = useObraAuthorPublicProfile(
    obra?.autorId,
    obra?.autor ?? "",
  );
  const perfilAutorObra = perfilDoAutorAtual(perfilAutorCarregado, obra?.autorId);

  const obraNormalizada = obra ? normalizarTexto(obra.titulo) : "";
  const generoObraFormatado = obterGeneroObraExibido(obra);
  const {
    autorNome: autorObraNome,
    autorId: autorObraId,
    usuarioEhAutor: usuarioEhAutorDaObra,
  } = obterContextoAutorObra(perfilAutorObra, obra, usuarioIdLogado);
  const obraDisponivel = obterObraDisponivelExibida(obra);
  const sinopseObraExibida = obterSinopseObraExibida(obra);
  const textosPainelClassificacao = obterTextosPainelClassificacaoObra(language);

  const capitulosDaObra = useMemo<CapituloDinamico[]>(
    () => obterCapitulosObraPublica(obraLeitura),
    [obraLeitura]
  );

  const {
    icone: indicadorConteudoIcone,
    valor: indicadorConteudoValor,
  } = obterIndicadorConteudoObraPublica({
    capitulos: capitulosDaObra,
    arquivoObra: obra?.arquivoObra,
  });
  const obraIdComentarios = obterObraIdComentarios(obraInteracoes);
  const carregarMetricasObra = useObraWorkMetricsRequest(usuarioIdLogado);
  const { carregarMaisComentariosObra, comentariosRemotosConfirmados } = useObraCommentsLoadPagination({
    comentariosAbertos,
    obraIdComentarios,
    usuarioIdLogado,
    versaoIdentidade,
    identidadeAutenticadaObraRef,
    comentariosCarregando,
    comentariosCarregandoMais,
    comentariosTemMais,
    comentariosProximoOffset,
    setComentariosObra,
    setTotalComentariosObra,
    setComentariosCarregando,
    setComentariosCarregandoMais,
    setComentariosTemMais,
    setComentariosProximoOffset,
    setComentarioStatus,
  });

  useObraWorkMetricsLifecycle({
    obra: obraInteracoes,
    obraNormalizada,
    usuarioIdLogado,
    followedWorksStorageKey: FOLLOWED_WORKS_STORAGE_KEY,
    likedWorksStorageKey: LIKED_WORKS_STORAGE_KEY,
    favoritesStorageKey: FAVORITES_STORAGE_KEY,
    completedStorageKey: COMPLETED_STORAGE_KEY,
    versoesInteracoesRef,
    carregarMetricasObra,
    setObraSeguida,
    setObraFavoritada,
    setObraConcluida,
    setMetricasObra,
    setMetricasComunidadeObra,
    setTotalComentariosObra,
  });

  const {
    obterIdentidadeLogadaParaAcao,
    criarGuardIdentidadeAcao: criarGuardIdentidadeOriginal,
  } = useObraActionAuthGuards({
    identidadeAutenticadaObraRef,
    setMensagemAcao,
    redirecionarParaLogin: (href) => router.push(href),
  });
  function criarGuardIdentidadeAcao(identidade: Parameters<typeof criarGuardIdentidadeOriginal>[0]) {
    const guard = criarGuardIdentidadeOriginal(identidade);
    const preparada = !snapshotInicial || publica.interativa;
    const contexto = publica.contexto;
    const path = window.location.pathname;
    return () => preparada && guard() && window.location.pathname === path && contextoAcaoRef.current === contexto;
  }

  const {
    enviarComentarioObra,
    removerComentarioObra,
    alternarCurtidaComentarioObra,
  } = useObraCommentMutations({
    obra,
    comentarioTexto,
    comentarioEnviando,
    comentarioRemovendoId,
    comentarioCurtindoId,
    comentariosObra,
    respostaComentario,
    obterIdentidadeLogadaParaAcao,
    criarGuardIdentidadeAcao,
    garantirRespostaVisivel,
    setComentarioTexto,
    setComentarioStatus,
    setComentarioEnviando,
    setComentarioRemovendoId,
    setComentarioCurtindoId,
    setComentariosObra,
    setTotalComentariosObra,
    setComentariosProximoOffset,
    setRespostaComentario,
  });

  const {
    alternarSeguirObra,
    alternarCurtidaObra,
    alternarFavoritoObra,
    alternarConcluirObra,
  } = useObraWorkInteractions({
    obra: obraInteracoes,
    obraNormalizada,
    obraSeguida,
    obraFavoritada,
    obraConcluida,
    metricasObra,
    followedWorksStorageKey: FOLLOWED_WORKS_STORAGE_KEY,
    likedWorksStorageKey: LIKED_WORKS_STORAGE_KEY,
    favoritesStorageKey: FAVORITES_STORAGE_KEY,
    completedStorageKey: COMPLETED_STORAGE_KEY,
    versoesInteracoesRef,
    obterIdentidadeLogadaParaAcao,
    criarGuardIdentidadeAcao,
    setObraSeguida,
    setObraFavoritada,
    setObraConcluida,
    setMetricasObra,
    setMensagemAcao,
  });

  const {
    avaliarObra,
    invalidarAvaliacaoObra,
  } = useObraRatingLifecycle({
    obra: obraInteracoes,
    obraNormalizada,
    usuarioIdLogado,
    autorObraId,
    avaliacaoObra,
    carregarMetricasObra,
    obterIdentidadeLogadaParaAcao,
    criarGuardIdentidadeAcao,
    setAvaliacaoObra,
    setMensagemAcao,
  });

  useEffect(() => {
    invalidarAvaliacaoObraRef.current = invalidarAvaliacaoObra;
  }, [invalidarAvaliacaoObra]);

  function inserirNoComentarioObra(valor: string) {
    setComentarioTexto((textoAtual) => `${textoAtual}${valor}`.slice(0, 600));
    setComentarioStatus("");
  }

  function alterarTextoComentarioObra(valor: string) {
    setComentarioTexto(valor.slice(0, 600));
    setComentarioStatus("");
  }

  function responderComentarioObra(
    comentario: ComentarioObraPublico,
    comentarioRaizId: string
  ) {
    const nomeLimpo = comentario.nome.replace(/\s+/g, " ").trim();
    const raizIdLimpo = comentarioRaizId.trim();

    if (!nomeLimpo || !raizIdLimpo) {
      return;
    }

    setRespostaComentario({
      comentarioPaiId: raizIdLimpo,
      autorId: comentario.userId,
      autorNome: nomeLimpo,
    });
    setComentarioTexto(`@${nomeLimpo} `);
    setComentarioStatus("");

    window.setTimeout(() => {
      comentarioInputRef.current?.focus();
    }, 0);
  }

  async function compartilharObraAtual() {
    if (!obra) {
      return;
    }

    const linkAtual = window.location.href;
    const dadosCompartilhamento: ShareData = {
      title: `${obra.titulo} no HISTORIETAS`,
      text: `Confira a obra ${obra.titulo} de ${obra.autor} no HISTORIETAS.`,
      url: linkAtual,
    };

    if (typeof navigator.share === "function") {
      try {
        const compartilhamento = navigator.share(dadosCompartilhamento);

        setAcoesObraAbertas(false);
        await compartilhamento;
        setMensagemAcao("Compartilhamento da obra aberto.");
        return;
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }
      }
    }

    setAcoesObraAbertas(false);

    try {
      const linkFoiCopiado = await copiarLinkComFallback(linkAtual);

      if (!linkFoiCopiado) {
        throw new Error("Não foi possível copiar o link.");
      }

      setLinkCopiado(true);
      setMensagemAcao("");

      window.setTimeout(() => {
        setLinkCopiado(false);
      }, 1800);
    } catch {
      setLinkCopiado(false);
      setMensagemAcao(
        "Não consegui compartilhar nem copiar o link da obra neste navegador.",
      );
    }
  }

  const acaoLeituraPrincipal = obterAcaoLeituraPrincipalObra(obraLeitura);

  const resumoAvaliacaoCabecalho = (
    <ObraRatingSummary
      media={avaliacaoObra.media}
      total={avaliacaoObra.total}
    />
  );
  const salvarObraPeloMenu = () => {
    fecharAcoesObra();
    void alternarFavoritoObra();
  };

  const concluirObraPeloMenu = () => {
    fecharAcoesObra();
    void alternarConcluirObra();
  };

  const compartilharObraPeloMenu = () => {
    fecharAcoesObra();
    void compartilharObraAtual();
  };

  const alternarSinopseObra = () => {
    setSinopseAberta((aberta) => !aberta);
  };

  function abrirDenunciaObraAtual() {
    if (!obra) {
      return;
    }

    fecharAcoesObra(false);
    setDenunciaAlvo({
      alvoTipo: "obra",
      alvoId: obra.id,
      alvoTitulo: obra.titulo,
    });
  }

  function abrirDenunciaComentarioObra(
    comentario: ComentarioObraPublico
  ) {
    setDenunciaAlvo({
      alvoTipo: "comentario_obra",
      alvoId: comentario.id,
      alvoTitulo: `Comentário de ${comentario.nome}`,
    });
  }

  const estruturaComentariosObra = useMemo(
    () => criarEstruturaComentariosObra(comentariosObra, ordenacaoComentarios),
    [comentariosObra, ordenacaoComentarios]
  );

  const painelComentariosObra =
    obra && comentariosAbertos && typeof document !== "undefined"
      ? (
          <ObraCommentsSheet
            titulo={obra.titulo}
            sheetRef={comentariosSheetRef}
            isDesktop={isDesktop}
            expandido={comentariosSheetExpandido}
            onFechar={fecharComentariosObra}
            onKeyDown={(event) =>
              manterFocoNoDialogo(event, fecharComentariosObra)
            }
          >
              <ObraCommentsHandle
                expandido={comentariosSheetExpandido}
                onAlternarExpansao={alternarExpansaoComentariosObra}
                onTouchStart={iniciarArrasteComentariosObra}
                onTouchMove={moverArrasteComentariosObra}
                onTouchEnd={finalizarArrasteComentariosObra}
                onTouchCancel={finalizarArrasteComentariosObra}
              />

              <ObraCommentsHeader
                totalComentarios={totalComentariosObra}
                ordenacao={ordenacaoComentarios}
                menuAberto={menuOrdenacaoComentariosAberto}
                onAlternarMenu={alternarMenuOrdenacaoComentarios}
                onSelecionarRelevantes={selecionarComentariosRelevantes}
                onSelecionarRecentes={selecionarComentariosRecentes}
              />

              <ObraCommentsList
                comentariosCarregando={comentariosCarregando}
                comentariosRaiz={estruturaComentariosObra.comentariosRaiz}
                respostasPorRaiz={estruturaComentariosObra.respostasPorRaiz}
                comentariosTemMais={comentariosTemMais}
                comentariosCarregandoMais={comentariosCarregandoMais}
                respostasVisiveisPorComentario={respostasVisiveisPorComentario}
                usuarioIdLogado={usuarioIdLogado}
                obraAutorId={autorObraId}
                comentarioRemovendoId={comentarioRemovendoId}
                comentarioCurtindoId={comentarioCurtindoId}
                agoraComentarios={agoraComentarios}
                comentariosRemotosConfirmados={comentariosRemotosConfirmados}
                onResponder={responderComentarioObra}
                onRemover={removerComentarioObra}
                onDenunciar={abrirDenunciaComentarioObra}
                onCurtir={alternarCurtidaComentarioObra}
                onMostrarRespostas={mostrarRespostas}
                onMostrarMaisRespostas={mostrarMaisRespostas}
                onOcultarRespostas={ocultarRespostas}
                onCarregarMais={carregarMaisComentariosObra}
              />

              <ObraCommentComposer
                comentarioTexto={comentarioTexto}
                comentarioStatus={comentarioStatus}
                comentarioEnviando={comentarioEnviando}
                usuarioIdLogado={usuarioIdLogado}
                avatarUsuario={perfilUsuarioLogado?.avatar || ""}
                nomeUsuario={perfilUsuarioLogado?.nome || ""}
                comentarioInputRef={comentarioInputRef}
                onSubmit={enviarComentarioObra}
                onAlterarTexto={alterarTextoComentarioObra}
                onInserirNoComentario={inserirNoComentarioObra}
              />
          </ObraCommentsSheet>
        )
      : null;

  const painelClassificacao =
    obra && painelClassificacaoAberto && typeof document !== "undefined"
      ? (
          <ObraClassificationPanel
            classificacaoIndicativa={obra.classificacaoIndicativa}
            avisosConteudo={obra.avisosConteudo}
            language={language}
            textos={textosPainelClassificacao}
            dialogRef={classificacaoDialogRef}
            onFechar={fecharPainelClassificacaoObra}
            onKeyDown={(event) =>
              manterFocoNoDialogo(event, fecharPainelClassificacaoObra)
            }
          />
        )
      : null;

  if (erroAutenticacao) {
    return (
      <main data-historietas-obra-dinamica-root="true" style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${obraPageCss}`}</style>
        <ObraDinamicaLanguageBridge />
        <p role="alert">Não foi possível confirmar sua sessão agora.</p>
        <button type="button" onClick={tentarAutenticacaoNovamente}>Tentar novamente</button>
      </main>
    );
  }

  if ((snapshotInicial ? publica.carregando : carregandoObras) && !obra) {
    return (
      <main data-historietas-obra-dinamica-root="true" style={pageThemeStyle} aria-busy="true">
        <style>{`${historietasThemeCss}${obraPageCss}`}</style>

        <ObraDinamicaLanguageBridge />

        <LoadingSpinner label="Carregando obra" />
      </main>
    );
  }

  if (!obra) {
    return (
      <main data-historietas-obra-dinamica-root="true" style={pageThemeStyle} aria-busy={snapshotInicial ? publica.validando : false}
        data-public-work-state={snapshotInicial ? publica.erro ? "erro" : "ausente" : undefined}>
        <style>{`${historietasThemeCss}${obraPageCss}`}</style>

        <ObraDinamicaLanguageBridge />

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            {(snapshotInicial ? publica.erro : erroCarregamentoObra)
              ? "Não foi possível carregar a obra agora."
              : "Obra não encontrada"}
          </p>
          {snapshotInicial && publica.erro ? <button type="button" onClick={publica.tentarNovamente}>Tentar novamente</button> : null}
        </section>
      </main>
    );
  }

  if (
    ehClassificacao18(obra.classificacaoIndicativa) &&
    statusAcesso18 === "verificando"
  ) {
    return (
      <main data-historietas-obra-dinamica-root="true" style={pageThemeStyle} aria-busy="true">
        <style>{`${historietasThemeCss}${obraPageCss}`}</style>
        <LoadingSpinner label="Verificando acesso" />
      </main>
    );
  }

  if (
    ehClassificacao18(obra.classificacaoIndicativa) &&
    statusAcesso18 === "bloqueado"
  ) {
    return (
      <AdultContentGate
        titulo={obra.titulo}
        avisos={obra.avisosConteudo}
        language={language}
        onConfirmar={permitirAcesso18Atual}
        onVoltar={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.replace("/explorar");
          }
        }}
      />
    );
  }

  const classificacaoIndicativaCompacta =
    obterClassificacaoIndicativaCompactaObra(obra.classificacaoIndicativa);
  const ariaLabelCapaObra = acaoLeituraPrincipal.capituloPrincipal
    ? `${acaoLeituraPrincipal.rotulo}: ${obra.titulo}`
    : `Abrir ${obra.titulo}`;

  return (
    <>
      <main data-historietas-obra-dinamica-root="true" style={pageThemeStyle}
        aria-busy={snapshotInicial ? publica.validando || !publica.interativa : undefined}
        inert={Boolean(snapshotInicial && !publica.interativa)}
        data-public-work-state={snapshotInicial ? publica.pronta ? "confirmada" : "verificando" : undefined}>
      <style>{`${historietasThemeCss}${obraPageCss}`}</style>
      <style>{obraSsrResponsiveCss}</style>

        <ObraDinamicaLanguageBridge />

      <ObraActionToast mensagem={mensagemAcao} />

      <section style={isDesktop ? desktopContainerStyle : containerStyle} data-obra-responsive="container">
        <section style={isDesktop ? desktopHeroStyle : heroStyle} data-obra-responsive="hero">
          <ObraHeroHeader
            isDesktop={isDesktop}
            classificacaoIndicativa={obra.classificacaoIndicativa}
            classificacaoTexto={classificacaoIndicativaCompacta.texto}
            classificacaoLivre={classificacaoIndicativaCompacta.livre}
            classificacaoAdulto={ehClassificacao18(obra.classificacaoIndicativa)}
            rotuloAbrirClassificacao={textosPainelClassificacao.abrir}
            resumoAvaliacao={resumoAvaliacaoCabecalho}
            onAbrirClassificacao={abrirPainelClassificacaoObra}
          />

          <div style={heroGlowStyle} />

          <div style={isDesktop ? desktopHeroContentStyle : heroContentStyle} data-obra-responsive="hero-content">
            <ObraHeroCover
              isDesktop={isDesktop}
              href={acaoLeituraPrincipal.hrefPrincipal}
              ariaLabel={ariaLabelCapaObra}
              capa={obra.capa}
              capaOtimizada={capaObraPodeSerOtimizada(obra.capa)}
              iniciais={obterIniciaisCapaObra(obra.titulo)}
            />

            <div
              style={
                isDesktop
                  ? desktopHeroOverlayContentStyle
                  : heroOverlayContentStyle
              }
              data-obra-responsive="overlay"
            >
              <ObraHeroDetails
                isDesktop={isDesktop}
                titulo={obra.titulo}
                autorNome={autorObraNome}
                autorHref={criarLinkPerfilAutor(autorObraNome, autorObraId)}
                autorBio={perfilAutorObra?.bio || ""}
                genero={generoObraFormatado}
                classificacaoIndicativa={obra.classificacaoIndicativa}
                sinopse={obra.sinopse}
              />

              {snapshotInicial && publica.pronta && obra.statusEditorial !== undefined && (
                <p data-historietas-i18n-ignore="true" style={{ fontSize: 13, overflowWrap: "anywhere" }}>
                  {textosStatusEditorial(language).label}: {obra.statusEditorial === null
                    ? textosStatusEditorial(language).indefinido : textosStatusEditorial(language)[obra.statusEditorial]}
                </p>
              )}

              <ObraHeroMetaBar
                isDesktop={isDesktop}
                autorNome={autorObraNome}
                autorHref={criarLinkPerfilAutor(autorObraNome, autorObraId)}
                autorBio={perfilAutorObra?.bio || ""}
                visualizacoes={formatarNumeroCompacto(metricasObra.visualizacoes)}
                curtidas={formatarNumeroCompacto(metricasObra.curtidas)}
                comentarios={formatarNumeroCompacto(totalComentariosObra)}
              />

              <ObraHeroActions
                isDesktop={isDesktop}
                leituraHref={acaoLeituraPrincipal.hrefCta}
                leituraRotulo={acaoLeituraPrincipal.rotulo}
                leituraAriaLabel={`${acaoLeituraPrincipal.rotulo}: ${obra.titulo}`}
                seguindo={obraSeguida}
                acoesAbertas={acoesObraAbertas}
                onAlternarSeguir={alternarSeguirObra}
                onAlternarAcoes={alternarAcoesObra}
              />
            </div>
          </div>

        </section>

        {acoesObraAbertas && (
          <ObraActionsSheet
            titulo={obra.titulo}
            obraId={obra.id}
            autorNome={autorObraNome}
            autorHref={criarLinkPerfilAutor(autorObraNome, autorObraId)}
            autorBio={perfilAutorObra?.bio || ""}
            tags={[
              obra.formato,
              generoObraFormatado,
              ...obra.tags,
              obra.classificacaoIndicativa,
              obra.arquivoObra ? "Arquivo anexado" : "",
            ]}
            metricas={[
              formatarNumeroCompacto(metricasObra.visualizacoes),
              formatarNumeroCompacto(metricasObra.curtidas),
              formatarNumeroCompacto(totalComentariosObra),
              formatarNumeroCompacto(metricasObra.seguidores),
            ]}
            indicadorIcone={indicadorConteudoIcone}
            indicadorValor={indicadorConteudoValor}
            isDesktop={isDesktop}
            dialogRef={acoesObraDialogRef}
            obraFavoritada={obraFavoritada}
            obraConcluida={obraConcluida}
            linkCopiado={linkCopiado}
            mostrarDenuncia={!usuarioEhAutorDaObra}
            onFechar={fecharAcoesObra}
            onKeyDown={(event) =>
              manterFocoNoDialogo(event, () => fecharAcoesObra())
            }
            onSalvar={salvarObraPeloMenu}
            onConcluir={concluirObraPeloMenu}
            onDenunciar={abrirDenunciaObraAtual}
            onCompartilhar={compartilharObraPeloMenu}
          />
        )}

        {!autenticacaoCarregada || !usuarioEhAutorDaObra ? (
          <div style={{ display: "contents", visibility: autenticacaoCarregada ? "visible" : "hidden" }} aria-hidden={!autenticacaoCarregada} inert={!autenticacaoCarregada}>
          <ObraRatingBox
            isDesktop={isDesktop}
            minhaNota={avaliacaoObra.minhaNota}
            salvando={avaliacaoObra.salvando}
            onAvaliar={avaliarObra}
          />
          </div>
        ) : null}

        <ObraCommunitySection
          isDesktop={isDesktop}
          carregado={metricasComunidadeObra.carregado}
          teorias={formatarNumeroCompacto(metricasComunidadeObra.teorias)}
          reviews={formatarNumeroCompacto(metricasComunidadeObra.reviews)}
          posts={formatarNumeroCompacto(metricasComunidadeObra.posts)}
          hrefTeorias={criarLinkComunidadeObra(obra.titulo, "Teoria")}
          hrefReviews={criarLinkComunidadeObra(obra.titulo, "Review")}
          hrefPosts={criarLinkComunidadeObra(obra.titulo, "posts")}
        />

        <ObraStatsGrid
          isDesktop={isDesktop}
          seguidores={formatarNumeroCompacto(metricasObra.seguidores)}
          curtidas={formatarNumeroCompacto(metricasObra.curtidas)}
          curtidaAtiva={metricasObra.curtidaAtiva}
          comentarios={formatarNumeroCompacto(totalComentariosObra)}
          sinopseAberta={sinopseAberta}
          onCurtir={alternarCurtidaObra}
          onAbrirComentarios={abrirComentariosObra}
          onAlternarSinopse={alternarSinopseObra}
        />

        {sinopseAberta ? (
          <ObraSynopsisSection texto={sinopseObraExibida} />
        ) : (
          capitulosDaObra.length > 0 && (
            <ObraChaptersSection
              isDesktop={isDesktop}
              capitulos={capitulosDaObra}
              textoDisponibilidade={obterTextoDisponibilidadeCapitulosObra(
                capitulosDaObra.length,
                obraDisponivel,
              )}
            />
          )
        )}


        {obra.arquivoObra && (
          <ArquivoObraPublico
            key={publica.chaveAnexo}
            somenteAssinador={Boolean(snapshotInicial)}
            obraId={obra.id}
            arquivo={obra.arquivoObra}
            tituloObra={obra.titulo}
            isDesktop={isDesktop}
          />
        )}


      </section>
      </main>

      {painelComentariosObra}
      {painelClassificacao}

      <DenunciaModal
        aberto={Boolean(denunciaAlvo)}
        alvoTipo={denunciaAlvo?.alvoTipo || "obra"}
        alvoId={denunciaAlvo?.alvoId || ""}
        alvoTitulo={denunciaAlvo?.alvoTitulo || ""}
        onFechar={() => setDenunciaAlvo(null)}
      />
    </>
  );
}
