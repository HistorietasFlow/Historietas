"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import { useParams, useRouter } from "next/navigation";
import type { TouchEvent } from "react";
import { supabase } from "../../../lib/supabase/client";
import DenunciaModal from "../../../components/DenunciaModal";
import AdultContentGate from "../../../components/AdultContentGate";
import { historietasThemeCss, useHistorietasTheme } from "../../../lib/historietasTheme";
import { formatarNumeroCompacto, idObraSupabaseValido, normalizarTexto } from "../../../lib/utils";
import { ehClassificacao18 } from "../../../lib/historietasAdultContent";
import { carregarMetricasConteudos } from "../../../lib/metricas";
import { carregarSnapshotRemotoAvaliacaoObra } from "./lib/obra-supabase-rating-loader";
import {
  execucaoIdentidadeObraEstaAtual,
  type IdentidadeAutenticadaObra,
} from "./lib/obra-auth-identity";
import {
  manterFocoNoDialogo,
  obterElementoComFocoAtual,
  restaurarFocoAnterior,
} from "./lib/obra-dialog-focus";
import { useObraDialogInitialFocus } from "./hooks/use-obra-dialog-initial-focus";
import { useObraAuthIdentityLifecycle } from "./hooks/use-obra-auth-identity-lifecycle";
import { useObraPublicWorkLoad } from "./hooks/use-obra-public-work-load";
import { useObraAuthorPublicProfile } from "./hooks/use-obra-author-public-profile";
import { useObraCommentsNow } from "./hooks/use-obra-comments-now";
import { useObraCommentRepliesVisibility } from "./hooks/use-obra-comment-replies-visibility";
import { useObraCommentsOrdering } from "./hooks/use-obra-comments-ordering";
import { useObraCommentsLoadPagination } from "./hooks/use-obra-comments-load-pagination";
import { useObraCommentMutations } from "./hooks/use-obra-comment-mutations";
import { useObraWorkInteractions } from "./hooks/use-obra-work-interactions";
import { useObraActionsSheet } from "./hooks/use-obra-actions-sheet";
import { useObraClassificationPanel } from "./hooks/use-obra-classification-panel";
import { useObraCommentsSheetBodyLock } from "./hooks/use-obra-comments-sheet-body-lock";
import { useObraContent18Access } from "./hooks/use-obra-content-18-access";
import { useObraDesktopMode } from "./hooks/use-obra-desktop-mode";
import { useObraViewRegistration } from "./hooks/use-obra-view-registration";
import {
  carregarListaLocalObraPublica,
  lerStorageUsuarioObraPublica,
  salvarStorageUsuarioObraPublica,
} from "./lib/obra-user-storage";
import { carregarPerfilPublicoObra } from "./lib/obra-public-profile-resolver";
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
  obterAvaliacaoLocalInicialObra,
  salvarAvaliacaoLocal,
} from "./lib/obra-local-rating-storage-utils";
import { criarMetricasBaseObra, metricasComunidadeObraVazias, metricasObraVazias, type MetricasComunidadeObra, type MetricasObraPublica } from "./lib/obra-metric-utils";
import { obterClassificacaoIndicativaCompactaObra, obterContextoAutorObra, obterGeneroObraExibido, obterSinopseObraExibida, obterTextosPainelClassificacaoObra, type PerfilPublicoObra } from "./lib/obra-text-utils";
import { criarLinkComunidadeObra, criarLinkPerfilAutor, criarLoginHrefObraPublica } from "./lib/obra-navigation-utils";
import { ObraDinamicaLanguageBridge } from "./components/obra-dinamica-language-bridge";
import { capaObraPodeSerOtimizada, obterIniciaisCapaObra } from "./lib/obra-cover-utils";
import { obterAcaoLeituraPrincipalObra, obterCapitulosObraPublica, obterIndicadorConteudoObraPublica, obterObraDisponivelExibida, obterTextoDisponibilidadeCapitulosObra, type CapituloDinamico } from "./lib/obra-reading-utils";
import { obraEstaEmListaLocalObraPublica, salvarListaLocalObraPublica } from "./lib/obra-interaction-utils";
import { criarEstruturaComentariosObra, obterObraIdComentarios, type ComentarioObraPublico, type RespostaComentarioObra } from "./lib/obra-comment-utils";
import { copiarLinkComFallback } from "./lib/obra-share-utils";
import { obraPageCss } from "./lib/obra-page-css";
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
  const [comentariosAbertos, setComentariosAbertos] = useState(false);
  const [comentariosSheetExpandido, setComentariosSheetExpandido] = useState(false);
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
  const [perfilUsuarioLogado, setPerfilUsuarioLogado] =
    useState<PerfilPublicoObra | null>(null);
  const comentarioInputRef = useRef<HTMLTextAreaElement | null>(null);
  const comentariosSheetRef = useRef<HTMLElement | null>(null);
  const focoAntesComentariosRef = useRef<HTMLElement | null>(null);
  const comentariosDragStartYRef = useRef(0);
  const comentariosDragOffsetYRef = useRef(0);
  const comentariosDragIgnorarCliqueRef = useRef(false);
  const comentariosDragResetTimerRef = useRef<number | null>(null);
  const agoraComentarios = useObraCommentsNow(comentariosAbertos);
  const isDesktop = useObraDesktopMode();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const avaliacaoVersaoRef = useRef(0);

  const limparEstadoContaAnterior = useCallback(() => {
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
    resetarRespostasVisiveis();
    setMensagemAcao("");
    avaliacaoVersaoRef.current += 1;
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
    autenticacaoCarregada,
    identidadeAutenticadaObraRef,
  } = useObraAuthIdentityLifecycle({
    onIdentidadeMudou: limparEstadoContaAnterior,
  });


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


  useObraCommentsSheetBodyLock(
    comentariosAbertos,
    comentariosDragResetTimerRef,
  );
  useObraDialogInitialFocus(comentariosAbertos, comentariosSheetRef);
  useObraPublicWorkLoad({
    autenticacaoCarregada,
    slug,
    usuarioIdLogado,
    identidadeAutenticadaObraRef,
    setObrasLocais,
    setCarregandoObras,
    setErroCarregamentoObra,
  });

  const obra = useMemo(
    () => obterObraDinamicaPorSlug(obrasLocais, slug),
    [slug, obrasLocais]
  );

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

  useObraViewRegistration(obra, statusAcesso18, setMetricasObra);

  const perfilAutorObra = useObraAuthorPublicProfile(
    obra?.autorId,
    obra?.autor ?? "",
  );

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
  const { carregarMaisComentariosObra } = useObraCommentsLoadPagination({
    comentariosAbertos,
    obraIdComentarios,
    usuarioIdLogado,
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
    const avaliacaoLocalInicial = obterAvaliacaoLocalInicialObra(
      obraAtual,
      usuarioIdLogado,
    );

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
    obra,
    obraNormalizada,
    obraSeguida,
    obraFavoritada,
    obraConcluida,
    metricasObra,
    followedWorksStorageKey: FOLLOWED_WORKS_STORAGE_KEY,
    likedWorksStorageKey: LIKED_WORKS_STORAGE_KEY,
    favoritesStorageKey: FAVORITES_STORAGE_KEY,
    completedStorageKey: COMPLETED_STORAGE_KEY,
    obterIdentidadeLogadaParaAcao,
    criarGuardIdentidadeAcao,
    setObraSeguida,
    setObraFavoritada,
    setObraConcluida,
    setMetricasObra,
    setMensagemAcao,
  });

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

  function abrirComentariosObra() {
    focoAntesComentariosRef.current = obterElementoComFocoAtual();
    setComentariosSheetExpandido(false);
    fecharMenuOrdenacaoComentarios();
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
    fecharMenuOrdenacaoComentarios();
    setRespostaComentario(null);
    comentariosDragOffsetYRef.current = 0;
    restaurarFocoAnterior(focoAnterior);
  }

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
                comentarioRemovendoId={comentarioRemovendoId}
                comentarioCurtindoId={comentarioCurtindoId}
                agoraComentarios={agoraComentarios}
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
