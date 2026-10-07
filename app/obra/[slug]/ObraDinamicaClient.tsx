"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import { useParams, useRouter } from "next/navigation";
import type {
  FormEvent,
  TouchEvent,
} from "react";
import { supabase } from "../../../lib/supabase/client";
import DenunciaModal from "../../../components/DenunciaModal";
import AdultContentGate from "../../../components/AdultContentGate";
import { historietasThemeCss, useHistorietasTheme } from "../../../lib/historietasTheme";
import { criarSlugBase, formatarNumeroCompacto, idObraSupabaseValido, normalizarTexto } from "../../../lib/utils";
import {
  acessoConteudo18Confirmado,
  ehClassificacao18,
} from "../../../lib/historietasAdultContent";
import { carregarMetricasConteudos } from "../../../lib/metricas";
import { carregarSnapshotRemotoAvaliacaoObra } from "./lib/obra-supabase-rating-loader";
import {
  atualizarIdentidadeAutenticadaObra,
  execucaoAutenticacaoObraEstaAtual,
  execucaoIdentidadeObraEstaAtual,
  type IdentidadeAutenticadaObra,
} from "./lib/obra-auth-identity";
import {
  manterFocoNoDialogo,
  obterElementoComFocoAtual,
  restaurarFocoAnterior,
} from "./lib/obra-dialog-focus";
import { useObraDialogInitialFocus } from "./hooks/use-obra-dialog-initial-focus";
import {
  carregarListaLocalObraPublica,
  lerStorageUsuarioObraPublica,
  salvarStorageUsuarioObraPublica,
} from "./lib/obra-user-storage";
import {
  carregarComentariosObraLocais,
  salvarComentariosObraLocais,
} from "./lib/obra-local-comment-storage-utils";
import { carregarObrasLocaisComBackup } from "./lib/obra-local-works-utils";
import { carregarObraSupabasePorSlug } from "./lib/obra-public-work-loader";
import { carregarPerfilPublicoObra } from "./lib/obra-public-profile-resolver";
import { carregarPaginaComentariosObraSupabase } from "./lib/obra-supabase-comments-page-loader";
import { normalizarComentariosObraSupabase } from "./lib/obra-supabase-comment-normalizer";
import {
  inserirComentarioObraSupabase,
  removerComentarioObraSupabase,
} from "./lib/obra-supabase-comment-persistence";
import {
  inserirCurtidaComentarioObraSupabase,
  removerCurtidaComentarioObraSupabase,
} from "./lib/obra-supabase-comment-like-persistence";
import {
  inserirSeguimentoObraPublicaSupabase,
  removerSeguimentoObraPublicaSupabase,
  salvarCurtidaObraPublicaSupabase,
  salvarRegistroObraPublicaSupabase,
} from "./lib/obra-supabase-interaction-persistence";
import { salvarAvaliacaoRemotaObra } from "./lib/obra-supabase-rating-persistence";
import {
  registrarAtividadeDiarioObra,
  removerAtividadeDiarioObra,
} from "./lib/obra-supabase-diary-activity-persistence";
import {
  avaliacaoObraVazia,
  calcularProximaAvaliacao,
  type AvaliacaoObraPublica,
} from "./lib/obra-rating-utils";
import {
  obterAvaliacaoLocalDetalhada,
  salvarAvaliacaoLocal,
} from "./lib/obra-local-rating-storage-utils";
import { criarMetricasBaseObra, incrementarVisualizacaoObraPublicaSupabase, metricasComunidadeObraVazias, metricasObraVazias, type MetricasComunidadeObra, type MetricasObraPublica } from "./lib/obra-metric-utils";
import { obterClassificacaoIndicativaCompactaObra, obterGeneroObraExibido, obterNomeAutorObraExibido, obterSinopseObraExibida, obterTextosPainelClassificacaoObra, type PerfilPublicoObra } from "./lib/obra-text-utils";
import { criarLinkComunidadeObra, criarLinkPerfilAutor, criarLoginHrefObraPublica } from "./lib/obra-navigation-utils";
import { ObraDinamicaLanguageBridge } from "./components/obra-dinamica-language-bridge";
import { capaObraPodeSerOtimizada, obterIniciaisCapaObra } from "./lib/obra-cover-utils";
import { obterAcaoLeituraPrincipalObra, obterCapitulosObraPublica, obterIndicadorConteudoObraPublica, obterObraDisponivelExibida, obterTextoDisponibilidadeCapitulosObra, type CapituloDinamico } from "./lib/obra-reading-utils";
import { obraEstaEmListaLocalObraPublica, salvarListaLocalObraPublica } from "./lib/obra-interaction-utils";
import { criarComentarioObraId, criarEstruturaComentariosObra, mesclarComentariosObraPorId, obterIdsComentarioComRespostas, obterObraIdComentarios, type ComentarioObraPublico, type OrdenacaoComentariosObra, type RespostaComentarioObra } from "./lib/obra-comment-utils";
import { copiarLinkComFallback } from "./lib/obra-share-utils";
import { obraPageCss } from "./lib/obra-page-css";
import type { AlvoDenunciaObraDinamica } from "./lib/obra-report-utils";
import { converterObraLocalParaDinamica, type ObraDinamica, type ObraLocal } from "./lib/obra-data-utils";
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
export default function ObraDinamicaPage() {
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
  const [avaliacaoObra, setAvaliacaoObra] =
    useState<AvaliacaoObraPublica>(avaliacaoObraVazia);
  const [perfilAutorObra, setPerfilAutorObra] =
    useState<PerfilPublicoObra | null>(null);
  const [mensagemAcao, setMensagemAcao] = useState("");
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [acoesObraAbertas, setAcoesObraAbertas] = useState(false);
  const [denunciaAlvo, setDenunciaAlvo] =
    useState<AlvoDenunciaObraDinamica | null>(null);
  const [sinopseAberta, setSinopseAberta] = useState(false);
  const [painelClassificacaoAberto, setPainelClassificacaoAberto] =
    useState(false);
  const [comentariosObra, setComentariosObra] = useState<ComentarioObraPublico[]>([]);
  const [totalComentariosObra, setTotalComentariosObra] = useState(0);
  const [comentariosCarregando, setComentariosCarregando] = useState(false);
  const [comentariosCarregandoMais, setComentariosCarregandoMais] =
    useState(false);
  const [comentariosTemMais, setComentariosTemMais] = useState(false);
  const [comentariosProximoOffset, setComentariosProximoOffset] = useState(0);
  const [comentariosAbertos, setComentariosAbertos] = useState(false);
  const [comentariosSheetExpandido, setComentariosSheetExpandido] = useState(false);
  const [comentarioTexto, setComentarioTexto] = useState("");
  const [comentarioStatus, setComentarioStatus] = useState("");
  const [comentarioEnviando, setComentarioEnviando] = useState(false);
  const [comentarioRemovendoId, setComentarioRemovendoId] = useState("");
  const [comentarioCurtindoId, setComentarioCurtindoId] = useState("");
  const [respostaComentario, setRespostaComentario] =
    useState<RespostaComentarioObra | null>(null);
  const [respostasVisiveisPorComentario, setRespostasVisiveisPorComentario] =
    useState<Record<string, number>>({});
  const [ordenacaoComentarios, setOrdenacaoComentarios] =
    useState<OrdenacaoComentariosObra>("relevantes");
  const [menuOrdenacaoComentariosAberto, setMenuOrdenacaoComentariosAberto] =
    useState(false);
  const [agoraComentarios, setAgoraComentarios] = useState(() => Date.now());
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [autenticacaoCarregada, setAutenticacaoCarregada] = useState(false);
  const [controleAcesso18, setControleAcesso18] = useState<{
    obraId: string;
    status: "verificando" | "permitido" | "bloqueado";
  }>({ obraId: "", status: "verificando" });
  const [perfilUsuarioLogado, setPerfilUsuarioLogado] =
    useState<PerfilPublicoObra | null>(null);
  const comentarioInputRef = useRef<HTMLTextAreaElement | null>(null);
  const comentariosSheetRef = useRef<HTMLElement | null>(null);
  const classificacaoDialogRef = useRef<HTMLElement | null>(null);
  const acoesObraDialogRef = useRef<HTMLElement | null>(null);
  const focoAntesComentariosRef = useRef<HTMLElement | null>(null);
  const focoAntesClassificacaoRef = useRef<HTMLElement | null>(null);
  const focoAntesAcoesObraRef = useRef<HTMLElement | null>(null);
  const comentariosDragStartYRef = useRef(0);
  const comentariosDragOffsetYRef = useRef(0);
  const comentariosDragIgnorarCliqueRef = useRef(false);
  const comentariosDragResetTimerRef = useRef<number | null>(null);
  const comentariosConsultaVersaoRef = useRef(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const visualizacaoObraRegistradaRef = useRef("");
  const avaliacaoVersaoRef = useRef(0);
  const identidadeAutenticadaObraRef =
    useRef<IdentidadeAutenticadaObra>({
      usuarioId: "",
      versao: 0,
    });
  const versaoConsultaAutenticacaoObraRef = useRef(0);

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

  useEffect(() => {
    let componenteAtivo = true;

    function limparEstadoContaAnterior() {
      setObrasLocais([]);
      setCarregandoObras(true);
      setObraSeguida(false);
      setObraFavoritada(false);
      setObraConcluida(false);
      setMetricasObra(metricasObraVazias);
      setAvaliacaoObra(avaliacaoObraVazia);
      setPerfilUsuarioLogado(null);
      setComentariosObra([]);
      setTotalComentariosObra(0);
      setComentarioTexto("");
      setComentarioStatus("");
      setComentarioEnviando(false);
      setComentarioRemovendoId("");
      setComentarioCurtindoId("");
      setRespostaComentario(null);
      setRespostasVisiveisPorComentario({});
      setMensagemAcao("");
      avaliacaoVersaoRef.current += 1;
    }

    function aplicarIdentidadeAutenticada(usuarioId: string) {
      const resultado = atualizarIdentidadeAutenticadaObra(
        identidadeAutenticadaObraRef.current,
        usuarioId,
      );

      if (resultado.mudou) {
        identidadeAutenticadaObraRef.current = resultado.identidade;
        limparEstadoContaAnterior();
        setUsuarioIdLogado(resultado.identidade.usuarioId);
      }

      setAutenticacaoCarregada(true);
    }

    async function carregarUsuarioLogado() {
      const versaoConsulta = versaoConsultaAutenticacaoObraRef.current + 1;
      versaoConsultaAutenticacaoObraRef.current = versaoConsulta;

      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id || "";

        if (
          execucaoAutenticacaoObraEstaAtual({
            cancelada: !componenteAtivo,
            versaoEsperada: versaoConsulta,
            versaoAtual: versaoConsultaAutenticacaoObraRef.current,
          })
        ) {
          aplicarIdentidadeAutenticada(userId);
        }
      } catch {
        if (
          execucaoAutenticacaoObraEstaAtual({
            cancelada: !componenteAtivo,
            versaoEsperada: versaoConsulta,
            versaoAtual: versaoConsultaAutenticacaoObraRef.current,
          })
        ) {
          aplicarIdentidadeAutenticada("");
        }
      }
    }

    void carregarUsuarioLogado();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (componenteAtivo) {
        versaoConsultaAutenticacaoObraRef.current += 1;
        aplicarIdentidadeAutenticada(session?.user?.id || "");
      }
    });

    return () => {
      componenteAtivo = false;
      versaoConsultaAutenticacaoObraRef.current += 1;
      subscription.unsubscribe();
    };
  }, []);


  useEffect(() => {
    let cancelado = false;

    async function carregarPerfilUsuarioAtual() {
      if (!usuarioIdLogado) {
        setPerfilUsuarioLogado(null);
        return;
      }

      const perfil = await carregarPerfilPublicoObra(
        usuarioIdLogado,
        "Você"
      );

      if (!cancelado) {
        setPerfilUsuarioLogado(perfil);
      }
    }

    void carregarPerfilUsuarioAtual();

    return () => {
      cancelado = true;
    };
  }, [usuarioIdLogado]);


  useEffect(() => {
    if (!comentariosAbertos) {
      return;
    }

    const overflowAnterior = document.body.style.overflow;
    const overscrollAnterior = document.body.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.body.style.overscrollBehavior = overscrollAnterior;

      if (comentariosDragResetTimerRef.current !== null) {
        window.clearTimeout(comentariosDragResetTimerRef.current);
        comentariosDragResetTimerRef.current = null;
      }
    };
  }, [comentariosAbertos]);


  useEffect(() => {
    if (!comentariosAbertos) {
      return;
    }

    const inicioRelogioComentarios = window.setTimeout(() => {
      setAgoraComentarios(Date.now());
    }, 0);

    const relogioComentarios = window.setInterval(() => {
      setAgoraComentarios(Date.now());
    }, 1000);

    return () => {
      window.clearTimeout(inicioRelogioComentarios);
      window.clearInterval(relogioComentarios);
    };
  }, [comentariosAbertos]);

  useObraDialogInitialFocus(comentariosAbertos, comentariosSheetRef);
  useObraDialogInitialFocus(
    painelClassificacaoAberto,
    classificacaoDialogRef,
  );
  useObraDialogInitialFocus(acoesObraAbertas, acoesObraDialogRef);


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
    if (!autenticacaoCarregada) {
      return;
    }

    let cancelado = false;
    const identidadeEsperada = identidadeAutenticadaObraRef.current;

    if (identidadeEsperada.usuarioId !== usuarioIdLogado.trim()) {
      return;
    }

    function execucaoCarregamentoEstaAtual() {
      return execucaoIdentidadeObraEstaAtual({
        cancelada: cancelado,
        identidadeEsperada,
        identidadeAtual: identidadeAutenticadaObraRef.current,
      });
    }

    async function carregarObraPublica() {
      window.setTimeout(() => {
        if (execucaoCarregamentoEstaAtual()) {
          setCarregandoObras(true);
          setErroCarregamentoObra(false);
        }
      }, 0);

      try {
        const obrasNormalizadas = carregarObrasLocaisComBackup(
          identidadeEsperada.usuarioId,
        );

        if (!execucaoCarregamentoEstaAtual()) {
          return;
        }

        window.setTimeout(() => {
          if (execucaoCarregamentoEstaAtual()) {
            setObrasLocais(obrasNormalizadas);
          }
        }, 0);

        const resultadoSupabase = await carregarObraSupabasePorSlug(
          slug,
          obrasNormalizadas,
          identidadeEsperada.usuarioId,
          execucaoCarregamentoEstaAtual,
        );

        if (!execucaoCarregamentoEstaAtual()) {
          return;
        }

        window.setTimeout(() => {
          if (execucaoCarregamentoEstaAtual()) {
            setObrasLocais(resultadoSupabase.obras);
            setErroCarregamentoObra(resultadoSupabase.status === "erro");
          }
        }, 0);
      } catch {
        if (!execucaoCarregamentoEstaAtual()) {
          return;
        }

        window.setTimeout(() => {
          if (execucaoCarregamentoEstaAtual()) {
            setErroCarregamentoObra(true);
          }
        }, 0);
      } finally {
        if (!execucaoCarregamentoEstaAtual()) {
          return;
        }

        window.setTimeout(() => {
          if (execucaoCarregamentoEstaAtual()) {
            setCarregandoObras(false);
          }
        }, 0);
      }
    }

    void carregarObraPublica();

    return () => {
      cancelado = true;
    };
  }, [autenticacaoCarregada, slug, usuarioIdLogado]);

  const obra = useMemo<ObraDinamica | null>(() => {
    const obraLocal = obrasLocais.find((item) => {
      return item.slug === slug || criarSlugBase(item.titulo) === slug;
    });

    if (obraLocal) {
      return converterObraLocalParaDinamica(obraLocal);
    }

    return null;
  }, [slug, obrasLocais]);

  useEffect(() => {
    const fecharPaineisTimer = window.setTimeout(() => {
      setSinopseAberta(false);
      setPainelClassificacaoAberto(false);
    }, 0);

    return () => {
      window.clearTimeout(fecharPaineisTimer);
    };
  }, [obra?.id]);

  const statusAcesso18 =
    obra && controleAcesso18.obraId === obra.id
      ? controleAcesso18.status
      : "verificando";

  useEffect(() => {
    const atualizarAcessoTimer = window.setTimeout(() => {
      if (!obra) {
        setControleAcesso18({ obraId: "", status: "verificando" });
        return;
      }

      const proximoStatus = !ehClassificacao18(obra.classificacaoIndicativa)
        ? "permitido"
        : acessoConteudo18Confirmado()
          ? "permitido"
          : "bloqueado";

      setControleAcesso18((controleAtual) => {
        if (
          controleAtual.obraId === obra.id &&
          controleAtual.status === proximoStatus
        ) {
          return controleAtual;
        }

        return { obraId: obra.id, status: proximoStatus };
      });
    }, 0);

    return () => {
      window.clearTimeout(atualizarAcessoTimer);
    };
  }, [obra]);

  useEffect(() => {
    if (
      !obra ||
      statusAcesso18 !== "permitido" ||
      !idObraSupabaseValido(obra.id)
    ) {
      return;
    }

    const obraIdAtual = obra.id;

    if (visualizacaoObraRegistradaRef.current === obraIdAtual) {
      return;
    }

    visualizacaoObraRegistradaRef.current = obraIdAtual;

    async function registrarVisualizacaoObraAtual() {
      const totalVisualizacoes =
        await incrementarVisualizacaoObraPublicaSupabase(obraIdAtual);

      if (totalVisualizacoes === null) {
        return;
      }

      setMetricasObra((metricasAtuais) => ({
        ...metricasAtuais,
        visualizacoes: Math.max(
          metricasAtuais.visualizacoes,
          totalVisualizacoes
        ),
      }));
    }

    void registrarVisualizacaoObraAtual();
  }, [obra, statusAcesso18]);

  useEffect(() => {
    let cancelado = false;

    async function carregarPerfilAutorDaObra() {
      if (!obra?.autorId) {
        window.setTimeout(() => {
          if (!cancelado) {
            setPerfilAutorObra(null);
          }
        }, 0);
        return;
      }

      const perfilAutor = await carregarPerfilPublicoObra(
        obra.autorId,
        obra.autor
      );

      window.setTimeout(() => {
        if (!cancelado) {
          setPerfilAutorObra(perfilAutor);
        }
      }, 0);
    }

    void carregarPerfilAutorDaObra();

    return () => {
      cancelado = true;
    };
  }, [obra?.autorId, obra?.autor]);

  const obraNormalizada = obra ? normalizarTexto(obra.titulo) : "";
  const generoObraFormatado = obterGeneroObraExibido(obra);
  const autorObraNome = obterNomeAutorObraExibido(perfilAutorObra, obra);
  const autorObraId = perfilAutorObra?.userId || obra?.autorId || "";
  const usuarioEhAutorDaObra = Boolean(
    usuarioIdLogado &&
      autorObraId &&
      usuarioIdLogado === autorObraId
  );
  const obraDisponivel = obterObraDisponivelExibida(obra);
  const sinopseObraExibida = obterSinopseObraExibida(obra);
  const textosPainelClassificacao = obterTextosPainelClassificacaoObra(language);

  const capitulosDaObra = useMemo<CapituloDinamico[]>(
    () => obterCapitulosObraPublica(obra),
    [obra]
  );

  const {
    icone: indicadorConteudoIcone,
    valor: indicadorConteudoValor,
  } = obterIndicadorConteudoObraPublica({
    capitulos: capitulosDaObra,
    arquivoObra: obra?.arquivoObra,
  });
  const obraIdComentarios = obterObraIdComentarios(obra);


  useEffect(() => {
    const versaoConsulta = comentariosConsultaVersaoRef.current + 1;
    comentariosConsultaVersaoRef.current = versaoConsulta;

    if (!comentariosAbertos) {
      return;
    }

    let cancelado = false;
    const execucaoAtual = () =>
      !cancelado && comentariosConsultaVersaoRef.current === versaoConsulta;

    async function carregarComentariosObra() {
      setComentarioStatus("");
      setComentariosCarregandoMais(false);
      setComentariosTemMais(false);
      setComentariosProximoOffset(0);

      if (!obraIdComentarios) {
        setComentariosObra([]);
        setTotalComentariosObra(0);
        setComentariosCarregando(false);
        return;
      }

      const comentariosLocais = usuarioIdLogado
        ? carregarComentariosObraLocais(usuarioIdLogado, obraIdComentarios)
        : [];

      if (!idObraSupabaseValido(obraIdComentarios)) {
        setComentariosObra(comentariosLocais);
        setTotalComentariosObra(comentariosLocais.length);
        setComentariosCarregando(false);
        return;
      }

      setComentariosCarregando(true);
      setComentariosObra([]);

      try {
        const pagina = await carregarPaginaComentariosObraSupabase(
          obraIdComentarios,
          0,
        );

        if (!execucaoAtual()) {
          return;
        }

        setComentariosObra(pagina.comentarios);
        setComentariosTemMais(pagina.temMais);
        setComentariosProximoOffset(pagina.proximoOffset);
        setTotalComentariosObra((totalAtual) =>
          Math.max(totalAtual, pagina.comentarios.length),
        );

        if (usuarioIdLogado) {
          salvarComentariosObraLocais(
            usuarioIdLogado,
            obraIdComentarios,
            pagina.comentarios,
          );
        }
      } catch {
        if (execucaoAtual()) {
          setComentariosObra(comentariosLocais);
          setTotalComentariosObra((totalAtual) =>
            Math.max(totalAtual, comentariosLocais.length),
          );
          setComentarioStatus(
            "Não foi possível carregar os comentários agora.",
          );
        }
      } finally {
        if (execucaoAtual()) {
          setComentariosCarregando(false);
        }
      }
    }

    void carregarComentariosObra();

    return () => {
      cancelado = true;
    };
  }, [comentariosAbertos, obraIdComentarios, usuarioIdLogado]);

  useEffect(() => {
    if (!obraNormalizada) {
      return;
    }

    try {
      const obrasSeguidasTexto = lerStorageUsuarioObraPublica(
        FOLLOWED_WORKS_STORAGE_KEY,
        usuarioIdLogado
      );
      const obrasSeguidasJson: unknown = obrasSeguidasTexto
        ? JSON.parse(obrasSeguidasTexto)
        : [];

      const obrasSeguidas = Array.isArray(obrasSeguidasJson)
        ? obrasSeguidasJson.filter(
            (titulo): titulo is string =>
              typeof titulo === "string" && Boolean(titulo.trim())
          )
        : [];
      const seguida = obrasSeguidas.includes(obraNormalizada);

      window.setTimeout(() => {
        setObraSeguida(seguida);
      }, 0);
    } catch {
      window.setTimeout(() => {
        setObraSeguida(false);
      }, 0);
    }
  }, [obraNormalizada, usuarioIdLogado]);

  useEffect(() => {
    if (!obra) {
      const resetColecoesTimer = window.setTimeout(() => {
        setObraFavoritada(false);
        setObraConcluida(false);
      }, 0);

      return () => {
        window.clearTimeout(resetColecoesTimer);
      };
    }

    const obraAtual = obra;
    const estadoFavoritadaLocal = obraEstaEmListaLocalObraPublica(
      obraAtual,
      FAVORITES_STORAGE_KEY,
      usuarioIdLogado
    );
    const estadoConcluidaLocal = obraEstaEmListaLocalObraPublica(
      obraAtual,
      COMPLETED_STORAGE_KEY,
      usuarioIdLogado
    );

    const aplicarEstadoColecoesTimer = window.setTimeout(() => {
      setObraFavoritada(estadoFavoritadaLocal);
      setObraConcluida(estadoConcluidaLocal);
    }, 0);

    return () => {
      window.clearTimeout(aplicarEstadoColecoesTimer);
    };
  }, [obra, obraNormalizada, usuarioIdLogado]);

  useEffect(() => {
    if (!obra) {
      const resetMetricasTimer = window.setTimeout(() => {
        setMetricasObra(metricasObraVazias);
        setTotalComentariosObra(0);
      }, 0);

      return () => {
        window.clearTimeout(resetMetricasTimer);
      };
    }

    const obraAtual = obra;
    const obraId = obraAtual.id;
    const metricasBase = criarMetricasBaseObra(obraAtual);
    let curtidaLocalAtiva = false;
    let seguindoLocalAtivo = false;
    try {
      const curtidasTexto = lerStorageUsuarioObraPublica(
        LIKED_WORKS_STORAGE_KEY,
        usuarioIdLogado
      );
      const curtidasJson: unknown = curtidasTexto
        ? JSON.parse(curtidasTexto)
        : [];
      const obrasCurtidas = Array.isArray(curtidasJson)
        ? curtidasJson.filter(
            (titulo): titulo is string =>
              typeof titulo === "string" && Boolean(titulo.trim())
          )
        : [];

      curtidaLocalAtiva = obrasCurtidas.includes(obraNormalizada);
    } catch {
      curtidaLocalAtiva = false;
    }

    try {
      const seguidasTexto = lerStorageUsuarioObraPublica(
        FOLLOWED_WORKS_STORAGE_KEY,
        usuarioIdLogado
      );
      const seguidasJson: unknown = seguidasTexto
        ? JSON.parse(seguidasTexto)
        : [];
      const obrasSeguidas = Array.isArray(seguidasJson)
        ? seguidasJson.filter(
            (titulo): titulo is string =>
              typeof titulo === "string" && Boolean(titulo.trim())
          )
        : [];

      seguindoLocalAtivo = obrasSeguidas.includes(obraNormalizada);
    } catch {
      seguindoLocalAtivo = false;
    }

    const aplicarMetricasLocaisTimer = window.setTimeout(() => {
      setObraSeguida(seguindoLocalAtivo);
      setMetricasComunidadeObra({
        ...metricasComunidadeObraVazias,
        carregado: true,
      });
      setMetricasObra({
        ...metricasBase,
        curtidaAtiva: curtidaLocalAtiva,
        curtidas: Math.max(
          metricasBase.curtidas,
          curtidaLocalAtiva ? 1 : 0
        ),
        seguidores: Math.max(
          metricasBase.seguidores,
          seguindoLocalAtivo ? 1 : 0
        ),
        carregado: true,
      });
      setTotalComentariosObra(metricasBase.comentarios);
    }, 0);

    if (
      obraAtual.origem !== "local" ||
      !obraId ||
      !idObraSupabaseValido(obraId)
    ) {
      return () => {
        window.clearTimeout(aplicarMetricasLocaisTimer);
      };
    }

    let cancelado = false;

    async function carregarMetricasReaisObra() {
      try {
        const contrato = await carregarMetricasConteudos({
          obraIds: [obraId],
        });
        const metrica = contrato.obras.get(obraId);

        if (!contrato.carregado || !metrica) {
          throw new Error("Métricas da obra indisponíveis.");
        }

        const curtidaAtiva = metrica.usuario.curtiu;
        const seguindoAtivo = metrica.usuario.seguiu;
        const favoritadaAtiva = metrica.usuario.favoritou;
        const concluidaAtiva = metrica.usuario.concluiu;

        if (cancelado) {
          return;
        }

        if (usuarioIdLogado) {
          const obrasCurtidas = carregarListaLocalObraPublica(
            LIKED_WORKS_STORAGE_KEY,
            usuarioIdLogado,
          );
          const novasObrasCurtidas = curtidaAtiva
            ? Array.from(new Set([...obrasCurtidas, obraNormalizada]))
            : obrasCurtidas.filter((titulo) => titulo !== obraNormalizada);

          salvarStorageUsuarioObraPublica(
            LIKED_WORKS_STORAGE_KEY,
            usuarioIdLogado,
            novasObrasCurtidas,
          );

          const obrasSeguidas = carregarListaLocalObraPublica(
            FOLLOWED_WORKS_STORAGE_KEY,
            usuarioIdLogado,
          );
          const chavesObraAtual = Array.from(
            new Set(
              [
                obraNormalizada,
                obraAtual.id || "",
                obraAtual.slug || "",
                obraAtual.link || "",
              ].filter((chave) => Boolean(chave.trim())),
            ),
          );
          const novasObrasSeguidas = seguindoAtivo
            ? Array.from(new Set([...obrasSeguidas, ...chavesObraAtual]))
            : obrasSeguidas.filter(
                (chave) => !chavesObraAtual.includes(chave),
              );

          salvarStorageUsuarioObraPublica(
            FOLLOWED_WORKS_STORAGE_KEY,
            usuarioIdLogado,
            novasObrasSeguidas,
          );
          salvarListaLocalObraPublica(
            obraAtual,
            FAVORITES_STORAGE_KEY,
            favoritadaAtiva,
            usuarioIdLogado,
          );
          salvarListaLocalObraPublica(
            obraAtual,
            COMPLETED_STORAGE_KEY,
            concluidaAtiva,
            usuarioIdLogado,
          );
        }

        setObraSeguida(seguindoAtivo);
        setObraFavoritada(favoritadaAtiva);
        setObraConcluida(concluidaAtiva);
        setMetricasObra({
          visualizacoes: metrica.visualizacoes,
          curtidas: metrica.interacoesDiretas.curtidas,
          comentarios: metrica.interacoesDiretas.comentarios,
          seguidores: metrica.interacoesDiretas.seguidores,
          curtidaAtiva,
          carregado: true,
        });
        setTotalComentariosObra(metrica.interacoesDiretas.comentarios);
        setMetricasComunidadeObra({
          teorias: metrica.comunidade.teorias,
          reviews: metrica.comunidade.reviews,
          posts: metrica.comunidade.posts,
          carregado: true,
        });
      } catch {
        if (!cancelado) {
          setMetricasObra((metricasAtuais) => ({
            ...metricasAtuais,
            carregado: true,
          }));
        }
      }
    }

    void carregarMetricasReaisObra();

    return () => {
      cancelado = true;
      window.clearTimeout(aplicarMetricasLocaisTimer);
    };
  }, [obra, obraNormalizada, usuarioIdLogado]);

  useEffect(() => {
    if (!obra) {
      const resetAvaliacaoTimer = window.setTimeout(() => {
        setAvaliacaoObra(avaliacaoObraVazia);
      }, 0);

      return () => {
        window.clearTimeout(resetAvaliacaoTimer);
      };
    }

    const obraAtual = obra;
    const versaoAoIniciar = avaliacaoVersaoRef.current;
    const usuarioLogadoEhAutorInicial = Boolean(
      usuarioIdLogado &&
        obraAtual.autorId &&
        usuarioIdLogado === obraAtual.autorId
    );
    const avaliacaoLocalInicial = usuarioLogadoEhAutorInicial
      ? { encontrada: false, nota: 0 }
      : obterAvaliacaoLocalDetalhada(obraAtual, usuarioIdLogado);

    const aplicarAvaliacaoLocalTimer = window.setTimeout(() => {
      if (avaliacaoVersaoRef.current !== versaoAoIniciar) {
        return;
      }

      setAvaliacaoObra({
        media: avaliacaoLocalInicial.nota > 0 ? avaliacaoLocalInicial.nota : 0,
        total: avaliacaoLocalInicial.nota > 0 ? 1 : 0,
        minhaNota: avaliacaoLocalInicial.nota,
        carregado: true,
        salvando: false,
      });
    }, 0);

    if (!obraAtual.id || !idObraSupabaseValido(obraAtual.id)) {
      return () => {
        window.clearTimeout(aplicarAvaliacaoLocalTimer);
      };
    }

    let cancelado = false;

    async function carregarAvaliacaoRealObra() {
      try {
        const snapshotRemoto = await carregarSnapshotRemotoAvaliacaoObra({
          obra: obraAtual,
          usuarioIdLogado,
        });

        if (!snapshotRemoto) {
          return;
        }

        if (
          cancelado ||
          avaliacaoVersaoRef.current !== versaoAoIniciar
        ) {
          return;
        }

        if (
          snapshotRemoto.userId &&
          !snapshotRemoto.usuarioEhAutorDaObraAtual
        ) {
          salvarAvaliacaoLocal(
            obraAtual,
            snapshotRemoto.minhaNotaRemota,
            snapshotRemoto.userId,
          );
        }

        setAvaliacaoObra({
          media: snapshotRemoto.media,
          total: snapshotRemoto.total,
          minhaNota: snapshotRemoto.minhaNota,
          carregado: true,
          salvando: false,
        });
      } catch (error) {
        console.warn("Não consegui carregar a avaliação da obra:", error);

        if (
          !cancelado &&
          avaliacaoVersaoRef.current === versaoAoIniciar
        ) {
          setAvaliacaoObra((avaliacaoAtual) => ({
            ...avaliacaoAtual,
            carregado: true,
            salvando: false,
          }));
        }
      }
    }

    void carregarAvaliacaoRealObra();

    return () => {
      cancelado = true;
      window.clearTimeout(aplicarAvaliacaoLocalTimer);
    };
  }, [
    obra,
    obraNormalizada,
    usuarioIdLogado,
  ]);

  async function obterIdentidadeLogadaParaAcao(mensagem: string) {
    const identidadeEsperada = identidadeAutenticadaObraRef.current;
    const execucaoAtual = () =>
      execucaoIdentidadeObraEstaAtual({
        cancelada: false,
        identidadeEsperada,
        identidadeAtual: identidadeAutenticadaObraRef.current,
      });

    try {
      const { data } = await supabase.auth.getUser();

      if (!execucaoAtual()) {
        return null;
      }

      const userId = data.user?.id || "";

      if (userId && userId === identidadeEsperada.usuarioId) {
        return identidadeEsperada;
      }

      if (!userId && !identidadeEsperada.usuarioId) {
        const loginHref = await criarLoginHrefObraPublica();

        if (execucaoAtual()) {
          setMensagemAcao(mensagem);
          router.push(loginHref);
        }
      }

      return null;
    } catch {
      if (!execucaoAtual()) {
        return null;
      }

      const loginHref = await criarLoginHrefObraPublica();

      if (execucaoAtual()) {
        setMensagemAcao(mensagem);
        router.push(loginHref);
      }

      return null;
    }
  }

  function criarGuardIdentidadeAcao(
    identidadeEsperada: IdentidadeAutenticadaObra,
  ) {
    return () =>
      execucaoIdentidadeObraEstaAtual({
        cancelada: false,
        identidadeEsperada,
        identidadeAtual: identidadeAutenticadaObraRef.current,
      });
  }

  async function alternarSeguirObra() {
    if (!obraNormalizada) {
      return;
    }

    const identidadeAcao = await obterIdentidadeLogadaParaAcao(
      "Entre na sua conta para seguir esta obra."
    );

    if (!identidadeAcao) {
      return;
    }

    const userId = identidadeAcao.usuarioId;
    const execucaoAcaoEstaAtual = criarGuardIdentidadeAcao(identidadeAcao);

    if (!execucaoAcaoEstaAtual()) {
      return;
    }

    const seguindo = !obraSeguida;
    const obraAtual = obra;
    const seguidoresDelta = seguindo ? 1 : -1;

    try {
      const obrasSeguidasTexto = lerStorageUsuarioObraPublica(
        FOLLOWED_WORKS_STORAGE_KEY,
        userId
      );
      const obrasSeguidasJson: unknown = obrasSeguidasTexto
        ? JSON.parse(obrasSeguidasTexto)
        : [];

      const obrasSeguidas = Array.isArray(obrasSeguidasJson)
        ? obrasSeguidasJson.filter(
            (titulo): titulo is string =>
              typeof titulo === "string" && Boolean(titulo.trim())
          )
        : [];

      const chavesObraAtual = Array.from(
        new Set(
          [
            obraNormalizada,
            obraAtual?.id || "",
            obraAtual?.slug || "",
            obraAtual?.link || "",
          ].filter((chave) => Boolean(chave.trim()))
        )
      );

      const novasObrasSeguidas = seguindo
        ? Array.from(new Set([...obrasSeguidas, ...chavesObraAtual]))
        : obrasSeguidas.filter((titulo) => !chavesObraAtual.includes(titulo));

      salvarStorageUsuarioObraPublica(
        FOLLOWED_WORKS_STORAGE_KEY,
        userId,
        novasObrasSeguidas
      );

      setObraSeguida(seguindo);
      setMetricasObra((metricasAtuais) => ({
        ...metricasAtuais,
        seguidores: Math.max(0, metricasAtuais.seguidores + seguidoresDelta),
      }));
      setMensagemAcao("");

      if (
        !obraAtual ||
        obraAtual.origem !== "local" ||
        !obraAtual.id ||
        !idObraSupabaseValido(obraAtual.id)
      ) {
        return;
      }

      const obraId = obraAtual.id;

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      if (seguindo) {
        const inserirResposta = await inserirSeguimentoObraPublicaSupabase(
          obraId,
          userId,
        );

        if (inserirResposta.error) {
          throw inserirResposta.error;
        }
      } else {
        const removerResposta = await removerSeguimentoObraPublicaSupabase(
          obraId,
          userId,
        );

        if (removerResposta.error) {
          throw removerResposta.error;
        }
      }

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      if (seguindo) {
        await registrarAtividadeDiarioObra({
          userId,
          obra: obraAtual,
          tipo: "salvou_obra",
          visibilidade: "publico",
          texto: `Adicionou ${obraAtual.titulo} para acompanhar.`,
          execucaoAtual: execucaoAcaoEstaAtual,
        });
      } else {
        await removerAtividadeDiarioObra({
          userId,
          obra: obraAtual,
          tipo: "salvou_obra",
          execucaoAtual: execucaoAcaoEstaAtual,
        });
      }
    } catch (error) {
      console.warn("Não consegui salvar seguimento da obra no Supabase:", error);

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setMensagemAcao(
        seguindo
          ? "Obra salva no navegador. Verifique o Supabase/RLS se não sincronizar online."
          : "Obra removida da lista no navegador. Verifique o Supabase/RLS se voltar depois."
      );
    }
  }

  async function alternarCurtidaObra() {
    if (!obraNormalizada) {
      return;
    }

    const identidadeAcao = await obterIdentidadeLogadaParaAcao(
      "Entre na sua conta para curtir esta obra."
    );

    if (!identidadeAcao) {
      return;
    }

    const userId = identidadeAcao.usuarioId;
    const execucaoAcaoEstaAtual = criarGuardIdentidadeAcao(identidadeAcao);

    if (!execucaoAcaoEstaAtual()) {
      return;
    }

    const proximaCurtidaAtiva = !metricasObra.curtidaAtiva;

    setMetricasObra((metricasAtuais) => ({
      ...metricasAtuais,
      curtidaAtiva: proximaCurtidaAtiva,
      curtidas: Math.max(
        0,
        metricasAtuais.curtidas + (proximaCurtidaAtiva ? 1 : -1)
      ),
    }));
    setMensagemAcao("");

    if (!obra || obra.origem !== "local" || !obra.id || !idObraSupabaseValido(obra.id)) {
      try {
        const curtidasTexto = lerStorageUsuarioObraPublica(
        LIKED_WORKS_STORAGE_KEY,
        userId
      );
        const curtidasJson: unknown = curtidasTexto ? JSON.parse(curtidasTexto) : [];
        const obrasCurtidas = Array.isArray(curtidasJson)
          ? curtidasJson.filter(
              (titulo): titulo is string =>
                typeof titulo === "string" && Boolean(titulo.trim())
            )
          : [];

        const novasObrasCurtidas = proximaCurtidaAtiva
          ? Array.from(new Set([...obrasCurtidas, obraNormalizada]))
          : obrasCurtidas.filter((titulo) => titulo !== obraNormalizada);

        salvarStorageUsuarioObraPublica(
          LIKED_WORKS_STORAGE_KEY,
          userId,
          novasObrasCurtidas
        );
      } catch {
        if (!execucaoAcaoEstaAtual()) {
          return;
        }

        setMetricasObra((metricasAtuais) => ({
          ...metricasAtuais,
          curtidaAtiva: !proximaCurtidaAtiva,
          curtidas: Math.max(
            0,
            metricasAtuais.curtidas + (proximaCurtidaAtiva ? -1 : 1)
          ),
        }));
        setMensagemAcao("Não foi possível salvar a curtida agora.");
      }

      return;
    }

    const obraId = obra.id;

    try {
      await salvarCurtidaObraPublicaSupabase(
        userId,
        obraId,
        proximaCurtidaAtiva,
        execucaoAcaoEstaAtual,
      );

      if (execucaoAcaoEstaAtual()) {
        setMensagemAcao("");
      }
    } catch {
      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setMetricasObra((metricasAtuais) => ({
        ...metricasAtuais,
        curtidaAtiva: !proximaCurtidaAtiva,
        curtidas: Math.max(
          0,
          metricasAtuais.curtidas + (proximaCurtidaAtiva ? -1 : 1)
        ),
      }));
      setMensagemAcao("Não foi possível salvar a curtida agora.");
    }
  }


  async function enviarComentarioObra(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!obra || comentarioEnviando) {
      return;
    }

    const textoDigitado = comentarioTexto.replace(/\s+/g, " ").trim();

    if (textoDigitado.length < 2) {
      setComentarioStatus("Escreva um comentário antes de enviar.");
      return;
    }

    const identidadeAcao = await obterIdentidadeLogadaParaAcao(
      respostaComentario
        ? "Entre na sua conta para responder este comentário."
        : "Entre na sua conta para comentar esta obra."
    );

    if (!identidadeAcao) {
      return;
    }

    const userId = identidadeAcao.usuarioId;
    const execucaoAcaoEstaAtual = criarGuardIdentidadeAcao(identidadeAcao);
    const respostaAnterior = respostaComentario;
    const textoFinal = textoDigitado.slice(0, 600);
    const perfil = await carregarPerfilPublicoObra(userId, "Você");

    if (!execucaoAcaoEstaAtual()) {
      return;
    }

    const comentarioTemporario: ComentarioObraPublico = {
      id: criarComentarioObraId(),
      obraId: obra.id,
      userId,
      nome: perfil?.nome || "Você",
      avatar: perfil?.avatar || "",
      texto: textoFinal,
      criadoEm: new Date().toISOString(),
      comentarioPaiId: respostaAnterior?.comentarioPaiId || "",
      local: true,
      curtidas: [],
    };

    setComentarioEnviando(true);
    setComentarioStatus("");
    setComentarioTexto("");
    setRespostaComentario(null);

    if (comentarioTemporario.comentarioPaiId) {
      setRespostasVisiveisPorComentario((estadoAtual) => ({
        ...estadoAtual,
        [comentarioTemporario.comentarioPaiId]: Math.max(
          5,
          estadoAtual[comentarioTemporario.comentarioPaiId] || 0
        ),
      }));
    }

    setComentariosObra((comentariosAtuais) => [
      comentarioTemporario,
      ...comentariosAtuais,
    ]);
    setTotalComentariosObra((totalAtual) => totalAtual + 1);

    if (!idObraSupabaseValido(obra.id)) {
      const comentariosLocais = [
        comentarioTemporario,
        ...comentariosObra,
      ].slice(0, 120);

      salvarComentariosObraLocais(userId, obra.id, comentariosLocais);
      setComentarioStatus(
        respostaAnterior
          ? "Resposta salva neste aparelho."
          : "Comentário salvo neste aparelho."
      );
      setComentarioEnviando(false);
      return;
    }

    try {
      const { data, error } = await inserirComentarioObraSupabase({
        obra_id: obra.id,
        user_id: userId,
        comentario: comentarioTemporario.texto,
        comentario_pai_id: comentarioTemporario.comentarioPaiId || null,
      });

      if (error || !data) {
        throw error || new Error("Comentário não retornado pelo Supabase.");
      }

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      const [comentarioSincronizado] = await normalizarComentariosObraSupabase([
        data,
      ]);

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      if (!comentarioSincronizado) {
        throw new Error("Comentário inválido retornado pelo Supabase.");
      }

      setComentariosObra((comentariosAtuais) => {
        const proximosComentarios = comentariosAtuais.map((comentario) =>
          comentario.id === comentarioTemporario.id
            ? comentarioSincronizado
            : comentario
        );

        salvarComentariosObraLocais(userId, obra.id, proximosComentarios);
        return proximosComentarios;
      });

      if (!comentarioSincronizado.comentarioPaiId) {
        setComentariosProximoOffset((offsetAtual) => offsetAtual + 1);
      }

      setComentarioStatus("");
    } catch {
      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setComentariosObra((comentariosAtuais) =>
        comentariosAtuais.filter(
          (comentario) => comentario.id !== comentarioTemporario.id
        )
      );
      setTotalComentariosObra((totalAtual) =>
        Math.max(0, totalAtual - 1)
      );
      setComentarioTexto(textoDigitado);
      setRespostaComentario(respostaAnterior);
      setComentarioStatus(
        respostaAnterior
          ? "Não foi possível enviar a resposta agora."
          : "Não foi possível enviar o comentário agora."
      );
    } finally {
      if (execucaoAcaoEstaAtual()) {
        setComentarioEnviando(false);
      }
    }
  }

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

  async function removerComentarioObra(comentario: ComentarioObraPublico) {
    if (!obra || comentarioRemovendoId) {
      return;
    }

    const identidadeAcao = await obterIdentidadeLogadaParaAcao(
      "Entre na sua conta para remover este comentário."
    );

    if (!identidadeAcao) {
      return;
    }

    const userId = identidadeAcao.usuarioId;
    const execucaoAcaoEstaAtual = criarGuardIdentidadeAcao(identidadeAcao);

    if (!execucaoAcaoEstaAtual() || comentario.userId !== userId) {
      return;
    }

    const idsParaRemover = obterIdsComentarioComRespostas(
      comentariosObra,
      comentario.id
    );

    setComentarioRemovendoId(comentario.id);
    setComentarioStatus("");

    try {
      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      if (!comentario.local && idObraSupabaseValido(obra.id)) {
        const { error } = await removerComentarioObraSupabase(
          comentario.id,
          obra.id,
          userId,
        );

        if (!execucaoAcaoEstaAtual()) {
          return;
        }

        if (error) {
          throw error;
        }
      }

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setComentariosObra((comentariosAtuais) => {
        if (!execucaoAcaoEstaAtual()) {
          return comentariosAtuais;
        }

        const proximosComentarios = comentariosAtuais.filter(
          (comentarioAtual) => !idsParaRemover.has(comentarioAtual.id)
        );

        if (!execucaoAcaoEstaAtual()) {
          return comentariosAtuais;
        }

        salvarComentariosObraLocais(userId, obra.id, proximosComentarios);

        return proximosComentarios;
      });

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setTotalComentariosObra((totalAtual) => {
        if (!execucaoAcaoEstaAtual()) {
          return totalAtual;
        }

        return Math.max(0, totalAtual - idsParaRemover.size);
      });

      if (!comentario.comentarioPaiId) {
        if (!execucaoAcaoEstaAtual()) {
          return;
        }

        setComentariosProximoOffset((offsetAtual) => {
          if (!execucaoAcaoEstaAtual()) {
            return offsetAtual;
          }

          return Math.max(0, offsetAtual - 1);
        });
      }

      if (
        respostaComentario &&
        (idsParaRemover.has(respostaComentario.comentarioPaiId) ||
          idsParaRemover.has(comentario.id))
      ) {
        if (!execucaoAcaoEstaAtual()) {
          return;
        }

        setRespostaComentario(null);
      }
    } catch {
      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setComentarioStatus("Não foi possível remover o comentário agora.");
    } finally {
      if (execucaoAcaoEstaAtual()) {
        setComentarioRemovendoId("");
      }
    }
  }

  async function alternarCurtidaComentarioObra(
    comentario: ComentarioObraPublico
  ) {
    if (!obra || comentarioCurtindoId) {
      return;
    }

    const identidadeAcao = await obterIdentidadeLogadaParaAcao(
      "Entre na sua conta para curtir comentários."
    );

    if (!identidadeAcao) {
      return;
    }

    const userId = identidadeAcao.usuarioId;
    const execucaoAcaoEstaAtual = criarGuardIdentidadeAcao(identidadeAcao);

    if (!execucaoAcaoEstaAtual()) {
      return;
    }

    const jaCurtiu = comentario.curtidas.includes(userId);

    if (!execucaoAcaoEstaAtual()) {
      return;
    }

    setComentarioCurtindoId(comentario.id);
    setComentarioStatus("");
    setComentariosObra((comentariosAtuais) => {
      if (!execucaoAcaoEstaAtual()) {
        return comentariosAtuais;
      }

      return comentariosAtuais.map((comentarioAtual) =>
        comentarioAtual.id === comentario.id
          ? {
              ...comentarioAtual,
              curtidas: jaCurtiu
                ? comentarioAtual.curtidas.filter(
                    (usuarioCurtidaId) => usuarioCurtidaId !== userId
                  )
                : Array.from(
                    new Set([...comentarioAtual.curtidas, userId])
                  ),
            }
          : comentarioAtual
      );
    });

    if (comentario.local || !idObraSupabaseValido(obra.id)) {
      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setComentariosObra((comentariosAtuais) => {
        if (!execucaoAcaoEstaAtual()) {
          return comentariosAtuais;
        }

        salvarComentariosObraLocais(userId, obra.id, comentariosAtuais);
        return comentariosAtuais;
      });

      if (execucaoAcaoEstaAtual()) {
        setComentarioCurtindoId("");
      }

      return;
    }

    try {
      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      const { error: erroRemoverCurtida } =
        await removerCurtidaComentarioObraSupabase(comentario.id, userId);

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      if (erroRemoverCurtida) {
        throw erroRemoverCurtida;
      }

      if (!jaCurtiu) {
        if (!execucaoAcaoEstaAtual()) {
          return;
        }

        const { error: erroInserirCurtida } =
          await inserirCurtidaComentarioObraSupabase(comentario.id, userId);

        if (!execucaoAcaoEstaAtual()) {
          return;
        }

        if (erroInserirCurtida) {
          throw erroInserirCurtida;
        }
      }
    } catch {
      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setComentariosObra((comentariosAtuais) => {
        if (!execucaoAcaoEstaAtual()) {
          return comentariosAtuais;
        }

        return comentariosAtuais.map((comentarioAtual) =>
          comentarioAtual.id === comentario.id
            ? {
                ...comentarioAtual,
                curtidas: jaCurtiu
                  ? Array.from(
                      new Set([...comentarioAtual.curtidas, userId])
                    )
                  : comentarioAtual.curtidas.filter(
                      (usuarioCurtidaId) => usuarioCurtidaId !== userId
                    ),
              }
            : comentarioAtual
        );
      });

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setComentarioStatus(
        "Não foi possível atualizar a curtida do comentário agora."
      );
    } finally {
      if (execucaoAcaoEstaAtual()) {
        setComentarioCurtindoId("");
      }
    }
  }

  async function alternarFavoritoObra() {
    if (!obra) {
      return;
    }

    const identidadeAcao = await obterIdentidadeLogadaParaAcao(
      "Entre na sua conta para salvar esta obra."
    );

    if (!identidadeAcao) {
      return;
    }

    const userId = identidadeAcao.usuarioId;
    const execucaoAcaoEstaAtual = criarGuardIdentidadeAcao(identidadeAcao);

    if (!execucaoAcaoEstaAtual()) {
      return;
    }

    const proximoFavorito = !obraFavoritada;
    const favoritoAnterior = obraFavoritada;

    setObraFavoritada(proximoFavorito);
    salvarListaLocalObraPublica(
      obra,
      FAVORITES_STORAGE_KEY,
      proximoFavorito,
      userId
    );
    setMensagemAcao("");

    try {
      if (obra.id && idObraSupabaseValido(obra.id)) {
        await salvarRegistroObraPublicaSupabase(
          "favoritos",
          userId,
          obra.id,
          proximoFavorito
        );
      }

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      if (proximoFavorito) {
        await registrarAtividadeDiarioObra({
          userId,
          obra,
          tipo: "favoritou_obra",
          visibilidade: "parcial",
          texto: `Adicionou ${obra.titulo} à lista.`,
          execucaoAtual: execucaoAcaoEstaAtual,
        });
      } else {
        await removerAtividadeDiarioObra({
          userId,
          obra,
          tipo: "favoritou_obra",
          execucaoAtual: execucaoAcaoEstaAtual,
        });
      }

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setMensagemAcao(
        proximoFavorito ? "" : "Obra removida da lista."
      );
    } catch (error) {
      console.warn("Não consegui salvar favorito da obra:", error);

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setObraFavoritada(favoritoAnterior);
      salvarListaLocalObraPublica(
        obra,
        FAVORITES_STORAGE_KEY,
        favoritoAnterior,
        userId
      );
      setMensagemAcao("Não foi possível salvar na lista agora.");
    }
  }

  async function alternarConcluirObra() {
    if (!obra) {
      return;
    }

    const identidadeAcao = await obterIdentidadeLogadaParaAcao(
      "Entre na sua conta para marcar esta obra como concluída."
    );

    if (!identidadeAcao) {
      return;
    }

    const userId = identidadeAcao.usuarioId;
    const execucaoAcaoEstaAtual = criarGuardIdentidadeAcao(identidadeAcao);

    if (!execucaoAcaoEstaAtual()) {
      return;
    }

    const proximaConcluida = !obraConcluida;
    const concluidaAnterior = obraConcluida;

    setObraConcluida(proximaConcluida);
    salvarListaLocalObraPublica(
      obra,
      COMPLETED_STORAGE_KEY,
      proximaConcluida,
      userId
    );
    setMensagemAcao("");

    try {
      if (obra.id && idObraSupabaseValido(obra.id)) {
        await salvarRegistroObraPublicaSupabase(
          "concluidas",
          userId,
          obra.id,
          proximaConcluida
        );
      }

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      if (proximaConcluida) {
        await registrarAtividadeDiarioObra({
          userId,
          obra,
          tipo: "concluiu_obra",
          visibilidade: "parcial",
          texto: `Concluiu ${obra.titulo}.`,
          execucaoAtual: execucaoAcaoEstaAtual,
        });
      } else {
        await removerAtividadeDiarioObra({
          userId,
          obra,
          tipo: "concluiu_obra",
          execucaoAtual: execucaoAcaoEstaAtual,
        });
      }

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setMensagemAcao(
        proximaConcluida ? "Obra marcada como concluída." : "Obra removida das concluídas."
      );
    } catch (error) {
      console.warn("Não consegui salvar conclusão da obra:", error);

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setObraConcluida(concluidaAnterior);
      salvarListaLocalObraPublica(
        obra,
        COMPLETED_STORAGE_KEY,
        concluidaAnterior,
        userId
      );
      setMensagemAcao("Não foi possível marcar como concluída agora.");
    }
  }

  async function avaliarObra(nota: number) {
    if (!obra || nota < 0 || nota > 5) {
      return;
    }

    const identidadeAcao = await obterIdentidadeLogadaParaAcao(
      "Entre na sua conta para avaliar esta obra."
    );

    if (!identidadeAcao) {
      return;
    }

    const userId = identidadeAcao.usuarioId;
    const execucaoAcaoEstaAtual = criarGuardIdentidadeAcao(identidadeAcao);

    if (!execucaoAcaoEstaAtual()) {
      return;
    }

    if (autorObraId && userId === autorObraId) {
      return;
    }

    if (!execucaoAcaoEstaAtual()) {
      return;
    }

    const notaNormalizada = nota <= 0 ? 0 : Math.round(nota * 2) / 2;
    const avaliacaoAnterior = avaliacaoObra;
    const versaoAvaliacao = avaliacaoVersaoRef.current + 1;
    avaliacaoVersaoRef.current = versaoAvaliacao;
    const execucaoAvaliacaoEstaAtual = () =>
      execucaoAcaoEstaAtual() &&
      avaliacaoVersaoRef.current === versaoAvaliacao;

    if (!execucaoAvaliacaoEstaAtual()) {
      return;
    }

    const proximaAvaliacao = calcularProximaAvaliacao(
      avaliacaoAnterior,
      notaNormalizada
    );

    if (!execucaoAvaliacaoEstaAtual()) {
      return;
    }

    setAvaliacaoObra(proximaAvaliacao);

    if (!execucaoAvaliacaoEstaAtual()) {
      return;
    }

    setMensagemAcao("");

    if (!execucaoAvaliacaoEstaAtual()) {
      return;
    }

    salvarAvaliacaoLocal(obra, notaNormalizada, userId);

    if (!obra.id || !idObraSupabaseValido(obra.id)) {
      if (execucaoAvaliacaoEstaAtual()) {
        setAvaliacaoObra((avaliacaoAtual) => {
          if (!execucaoAvaliacaoEstaAtual()) {
            return avaliacaoAtual;
          }

          return {
            ...avaliacaoAtual,
            salvando: false,
          };
        });
      }
      return;
    }

    try {
      if (!execucaoAvaliacaoEstaAtual()) {
        return;
      }

      await salvarAvaliacaoRemotaObra({
        obraId: obra.id,
        userId,
        nota: notaNormalizada,
      });

      if (!execucaoAvaliacaoEstaAtual()) {
        return;
      }
    } catch (error) {
      if (!execucaoAvaliacaoEstaAtual()) {
        return;
      }

      console.warn("Não consegui salvar a avaliação da obra:", error);

      salvarAvaliacaoLocal(
        obra,
        avaliacaoAnterior.minhaNota,
        userId,
      );
      setAvaliacaoObra({
        ...avaliacaoAnterior,
        carregado: true,
        salvando: false,
      });
      setMensagemAcao("Não foi possível salvar a avaliação agora.");
      return;
    }

    if (!execucaoAvaliacaoEstaAtual()) {
      return;
    }

    setMensagemAcao("");

    try {
      if (!execucaoAvaliacaoEstaAtual()) {
        return;
      }

      if (notaNormalizada > 0) {
        await registrarAtividadeDiarioObra({
          userId,
          obra,
          tipo: "avaliou_obra",
          nota: notaNormalizada,
          visibilidade: "publico",
          texto: `Avaliou ${obra.titulo} com ${notaNormalizada.toFixed(1).replace(".", ",")} estrelas.`,
          execucaoAtual: execucaoAvaliacaoEstaAtual,
        });
      } else {
        await removerAtividadeDiarioObra({
          userId,
          obra,
          tipo: "avaliou_obra",
          execucaoAtual: execucaoAvaliacaoEstaAtual,
        });
      }

      if (!execucaoAvaliacaoEstaAtual()) {
        return;
      }
    } catch (error) {
      if (!execucaoAvaliacaoEstaAtual()) {
        return;
      }

      console.warn(
        "A avaliação foi salva, mas não consegui sincronizar o Diário:",
        error,
      );
    }

    if (!execucaoAvaliacaoEstaAtual()) {
      return;
    }

    setAvaliacaoObra((avaliacaoAtual) => {
      if (!execucaoAvaliacaoEstaAtual()) {
        return avaliacaoAtual;
      }

      return {
        ...avaliacaoAtual,
        salvando: false,
      };
    });
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

  const acaoLeituraPrincipal = obterAcaoLeituraPrincipalObra(obra);

  const resumoAvaliacaoCabecalho = (
    <ObraRatingSummary
      media={avaliacaoObra.media}
      total={avaliacaoObra.total}
    />
  );


  function abrirPainelClassificacaoObra() {
    focoAntesClassificacaoRef.current = obterElementoComFocoAtual();
    setPainelClassificacaoAberto(true);
  }

  function fecharPainelClassificacaoObra() {
    const focoAnterior = focoAntesClassificacaoRef.current;
    focoAntesClassificacaoRef.current = null;
    setPainelClassificacaoAberto(false);
    restaurarFocoAnterior(focoAnterior);
  }

  function abrirAcoesObra() {
    focoAntesAcoesObraRef.current = obterElementoComFocoAtual();
    setAcoesObraAbertas(true);
  }

  function fecharAcoesObra(restaurarFoco = true) {
    const focoAnterior = focoAntesAcoesObraRef.current;
    focoAntesAcoesObraRef.current = null;
    setAcoesObraAbertas(false);

    if (restaurarFoco) {
      restaurarFocoAnterior(focoAnterior);
    }
  }

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

  function alternarAcoesObra() {
    if (acoesObraAbertas) {
      fecharAcoesObra();
      return;
    }

    abrirAcoesObra();
  }

  function abrirComentariosObra() {
    focoAntesComentariosRef.current = obterElementoComFocoAtual();
    setComentariosSheetExpandido(false);
    setMenuOrdenacaoComentariosAberto(false);
    setComentariosAbertos(true);
  }

  const alternarSinopseObra = () => {
    setSinopseAberta((aberta) => !aberta);
  };

  function fecharComentariosObra() {
    const focoAnterior = focoAntesComentariosRef.current;
    focoAntesComentariosRef.current = null;
    setComentariosAbertos(false);
    setComentariosSheetExpandido(false);
    setMenuOrdenacaoComentariosAberto(false);
    setRespostaComentario(null);
    comentariosDragOffsetYRef.current = 0;
    restaurarFocoAnterior(focoAnterior);
  }

  const alternarMenuOrdenacaoComentarios = () => {
    setMenuOrdenacaoComentariosAberto((aberto) => !aberto);
  };

  const selecionarComentariosRelevantes = () => {
    setOrdenacaoComentarios("relevantes");
    setMenuOrdenacaoComentariosAberto(false);
  };

  const selecionarComentariosRecentes = () => {
    setOrdenacaoComentarios("recentes");
    setMenuOrdenacaoComentariosAberto(false);
  };

  function iniciarArrasteComentariosObra(
    event: TouchEvent<HTMLDivElement>
  ) {
    if (isDesktop) {
      return;
    }

    comentariosDragStartYRef.current = event.touches[0]?.clientY || 0;
    comentariosDragOffsetYRef.current = 0;
    comentariosDragIgnorarCliqueRef.current = false;

    if (comentariosDragResetTimerRef.current !== null) {
      window.clearTimeout(comentariosDragResetTimerRef.current);
      comentariosDragResetTimerRef.current = null;
    }

    if (comentariosSheetRef.current) {
      comentariosSheetRef.current.style.transition = "none";
    }
  }

  function moverArrasteComentariosObra(
    event: TouchEvent<HTMLDivElement>
  ) {
    if (isDesktop) {
      return;
    }

    const posicaoAtual =
      event.touches[0]?.clientY || comentariosDragStartYRef.current;
    const limiteSuperior = comentariosSheetExpandido ? -46 : -58;
    const limiteInferior = comentariosSheetExpandido ? 112 : 132;
    const deslocamento = Math.max(
      limiteSuperior,
      Math.min(
        limiteInferior,
        posicaoAtual - comentariosDragStartYRef.current
      )
    );

    comentariosDragOffsetYRef.current = deslocamento;

    if (Math.abs(deslocamento) > 6) {
      comentariosDragIgnorarCliqueRef.current = true;
    }

    if (comentariosSheetRef.current) {
      const handle = comentariosSheetRef.current.querySelector(
        "[data-comments-sheet-handle='true']"
      ) as HTMLElement | null;

      if (handle) {
        handle.style.transform = `translate3d(0, ${deslocamento}px, 0)`;
      }
    }
  }

  function finalizarArrasteComentariosObra() {
    if (isDesktop) {
      return;
    }

    const deslocamento = comentariosDragOffsetYRef.current;

    if (comentariosSheetRef.current) {
      comentariosSheetRef.current.style.transition = "height 220ms ease";

      const handle = comentariosSheetRef.current.querySelector(
        "[data-comments-sheet-handle='true']"
      ) as HTMLElement | null;

      if (handle) {
        handle.style.transition = "transform 160ms ease";
        handle.style.transform = "";
      }
    }

    if (comentariosDragIgnorarCliqueRef.current) {
      comentariosDragResetTimerRef.current = window.setTimeout(() => {
        comentariosDragIgnorarCliqueRef.current = false;
        comentariosDragResetTimerRef.current = null;
      }, 350);
    }

    if (deslocamento < -34) {
      setComentariosSheetExpandido(true);
      return;
    }

    if (deslocamento > 52 && comentariosSheetExpandido) {
      setComentariosSheetExpandido(false);
      return;
    }

    if (deslocamento > 118 && !comentariosSheetExpandido) {
      fecharComentariosObra();
    }
  }

  function alternarExpansaoComentariosObra() {
    if (isDesktop || comentariosDragIgnorarCliqueRef.current) {
      return;
    }

    setComentariosSheetExpandido((expandidoAtual) => !expandidoAtual);
  }

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

  async function carregarMaisComentariosObra() {
    if (
      !comentariosAbertos ||
      comentariosCarregando ||
      comentariosCarregandoMais ||
      !comentariosTemMais ||
      !obraIdComentarios ||
      !idObraSupabaseValido(obraIdComentarios)
    ) {
      return;
    }

    const versaoConsulta = comentariosConsultaVersaoRef.current;
    const identidadeEsperada = identidadeAutenticadaObraRef.current;
    const execucaoAtual = () =>
      comentariosConsultaVersaoRef.current === versaoConsulta &&
      execucaoIdentidadeObraEstaAtual({
        cancelada: false,
        identidadeEsperada,
        identidadeAtual: identidadeAutenticadaObraRef.current,
      });

    setComentariosCarregandoMais(true);
    setComentarioStatus("");

    try {
      const pagina = await carregarPaginaComentariosObraSupabase(
        obraIdComentarios,
        comentariosProximoOffset,
      );

      if (!execucaoAtual()) {
        return;
      }

      setComentariosObra((comentariosAtuais) => {
        if (!execucaoAtual()) {
          return comentariosAtuais;
        }

        return mesclarComentariosObraPorId(
          comentariosAtuais,
          pagina.comentarios,
        );
      });
      setComentariosTemMais(pagina.temMais);
      setComentariosProximoOffset(pagina.proximoOffset);
      setTotalComentariosObra((totalAtual) => {
        if (!execucaoAtual()) {
          return totalAtual;
        }

        return Math.max(totalAtual, pagina.proximoOffset);
      });
    } catch {
      if (execucaoAtual()) {
        setComentarioStatus(
          "Não foi possível carregar mais comentários agora.",
        );
      }
    } finally {
      if (execucaoAtual()) {
        setComentariosCarregandoMais(false);
      }
    }
  }


  const estruturaComentariosObra = useMemo(
    () => criarEstruturaComentariosObra(comentariosObra, ordenacaoComentarios),
    [comentariosObra, ordenacaoComentarios]
  );

  const mostrarRespostasComentario = (
    comentarioId: string,
    totalRespostas: number,
  ) => {
    setRespostasVisiveisPorComentario((estadoAtual) => ({
      ...estadoAtual,
      [comentarioId]: Math.min(5, totalRespostas),
    }));
  };

  const mostrarMaisRespostasComentario = (
    comentarioId: string,
    totalRespostas: number,
  ) => {
    setRespostasVisiveisPorComentario((estadoAtual) => ({
      ...estadoAtual,
      [comentarioId]: Math.min(
        totalRespostas,
        (estadoAtual[comentarioId] || 0) + 5,
      ),
    }));
  };

  const ocultarRespostasComentario = (comentarioId: string) => {
    setRespostasVisiveisPorComentario((estadoAtual) => ({
      ...estadoAtual,
      [comentarioId]: 0,
    }));
  };

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
                comentarioRemovendoId={comentarioRemovendoId}
                comentarioCurtindoId={comentarioCurtindoId}
                agoraComentarios={agoraComentarios}
                onResponder={responderComentarioObra}
                onRemover={removerComentarioObra}
                onDenunciar={abrirDenunciaComentarioObra}
                onCurtir={alternarCurtidaComentarioObra}
                onMostrarRespostas={mostrarRespostasComentario}
                onMostrarMaisRespostas={mostrarMaisRespostasComentario}
                onOcultarRespostas={ocultarRespostasComentario}
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

  if (carregandoObras && !obra) {
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
      <main data-historietas-obra-dinamica-root="true" style={pageThemeStyle}>
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
            {erroCarregamentoObra
              ? "Não foi possível carregar a obra agora."
              : "Obra não encontrada"}
          </p>
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
        onConfirmar={() =>
          setControleAcesso18({ obraId: obra.id, status: "permitido" })
        }
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
      <main data-historietas-obra-dinamica-root="true" style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${obraPageCss}`}</style>

        <ObraDinamicaLanguageBridge />

      <ObraActionToast mensagem={mensagemAcao} />

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <section style={isDesktop ? desktopHeroStyle : heroStyle}>
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

          <div style={isDesktop ? desktopHeroContentStyle : heroContentStyle}>
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

        {autenticacaoCarregada && !usuarioEhAutorDaObra ? (
          <ObraRatingBox
            isDesktop={isDesktop}
            minhaNota={avaliacaoObra.minhaNota}
            salvando={avaliacaoObra.salvando}
            onAvaliar={avaliarObra}
          />
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
