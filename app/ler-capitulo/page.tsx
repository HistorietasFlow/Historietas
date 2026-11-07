"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { LerCapituloLanguageBridge } from "./components/ler-capitulo-language-bridge";
import { LoadingSpinner } from "./components/ler-capitulo-loading-spinner";
import LerCapituloLoadError from "./components/ler-capitulo-load-error";
import ComentariosCapituloSheet, { type ComentariosCapituloPost } from "./components/ler-capitulo-comments-sheet";
import LerCapituloReaderContent from "./components/ler-capitulo-reader-content";
import { supabase } from "../../lib/supabase/client";
import DenunciaModal from "../../components/DenunciaModal";
import AdultContentGate from "../../components/AdultContentGate";
import { historietasThemeCss } from "../../lib/historietasTheme";
import {
  ehClassificacao18,
} from "../../lib/historietasAdultContent";
import { useLerCapituloDesktopMode } from "./hooks/use-ler-capitulo-desktop-mode";
import { useLerCapituloCommentsBodyLock } from "./hooks/use-ler-capitulo-comments-body-lock";
import { useLerCapituloCommentReset } from "./hooks/use-ler-capitulo-comment-reset";
import { useLerCapituloScrollProgress } from "./hooks/use-ler-capitulo-scroll-progress";
import { useLerCapituloContent18Access } from "./hooks/use-ler-capitulo-content-18-access";
import { focusBottomNavigationCss } from "./lib/ler-capitulo-focus-bottom-navigation-css";
import { leitorPageCss } from "./lib/ler-capitulo-page-css";
import {
  obterAutorIdSeguro,
  salvarCurtidaComentarioCapituloLocal,
} from "./lib/ler-capitulo-local-storage";
import { FONT_SCALE_VALUES } from "./lib/ler-capitulo-reading-preferences";
import {
  criarLoginHrefLeitor,
} from "./lib/ler-capitulo-login-route";
import {
  criarHrefLeituraCapituloLeitor,
} from "./lib/ler-capitulo-chapter-route";
import {
  contarPalavras,
  criarTextoLeituraStyle,
  criarTextoLeituraDesktopStyle,
} from "./lib/ler-capitulo-reading-text-utils";
import {
  salvarComentarioCapituloSupabase,
  TABELA_COMENTARIOS_CAPITULOS_CURTIDAS,
} from "./lib/ler-capitulo-comment-persistence";
import {
  obterCapituloAnteriorLeitor,
  obterCapituloAtualLeitor,
  obterIndiceCapituloLeitor,
  obterNumeroCapituloLeitor,
  obterObraAtualLeitor,
  obterProximoCapituloLeitor,
} from "./lib/ler-capitulo-reader-derived";
import {
  carregarPerfilComentarioLeitor,
  obterTextoRegistroLeitor,
} from "./lib/ler-capitulo-comments-read-loader";
import {
  calcularProgressoLeitura,
  normalizarObra,
  type ObraLocal,
} from "./lib/ler-capitulo-work-normalization";
import { useLerCapituloInitialLoad } from "./hooks/use-ler-capitulo-initial-load";
import { useLerCapituloAuthIdentityLifecycle } from "./hooks/use-ler-capitulo-auth-identity-lifecycle";
import { useLerCapituloRouteIdentityState } from "./hooks/use-ler-capitulo-route-identity-state";
import { useLerCapituloLoadedDataState } from "./hooks/use-ler-capitulo-loaded-data-state";
import { useLerCapituloSessionPreferences } from "./hooks/use-ler-capitulo-session-preferences";
import { useLerCapituloSessionPreferencesState } from "./hooks/use-ler-capitulo-session-preferences-state";
import { useLerCapituloCommentsState } from "./hooks/use-ler-capitulo-comments-state";
import { useLerCapituloFeedbackOverlaysState } from "./hooks/use-ler-capitulo-feedback-overlays-state";
import { useLerCapituloInteractionData } from "./hooks/use-ler-capitulo-interaction-data";
import { useLerCapituloCommentsSpoilerAccess } from "./hooks/use-ler-capitulo-comments-spoiler-access";
import { useLerCapituloMetricsInteractionsState } from "./hooks/use-ler-capitulo-metrics-interactions-state";
import { useLerCapituloViewRegistration, useLerCapituloEntryActivity } from "./hooks/use-ler-capitulo-entry-lifecycle";
import { incrementarVisualizacaoCapituloSupabase, salvarProgressoLeituraSupabase, salvarRegistroCapituloSupabase } from "./lib/ler-capitulo-interaction-persistence";
import { metricasCapituloVazias, criarMetricasCapituloLocais, carregarMetricasCapituloSupabase, formatarContadorCapituloLeitor } from "./lib/ler-capitulo-metrics";
import { marcarNotificacaoCapituloComoLidaSupabase, criarRegistrarNotificacaoInteracaoCapituloSupabase, registrarAtividadeDiarioLeitor } from "./lib/ler-capitulo-social-persistence";
import { criarAcoesComentariosCapitulo } from "./lib/ler-capitulo-comment-actions";
import { criarAcoesInteracoesCapitulo } from "./lib/ler-capitulo-interaction-actions";
import { criarAcaoProgressoLeituraCapitulo } from "./lib/ler-capitulo-reading-progress-action";
import { criarAcoesAutenticacaoLeitor } from "./lib/ler-capitulo-auth-actions";
import {
  removerEstadoUsuarioObrasLeitor,
} from "./lib/ler-capitulo-auth-identity";
import {
  criarAcoesDenunciaLeitor,
} from "./lib/ler-capitulo-report-actions";
import {
  criarControlesComentariosCapitulo,
} from "./lib/ler-capitulo-comment-controls";
import {
  criarAcoesObraLocalLeitor,
} from "./lib/ler-capitulo-local-work-actions";
import {
  criarAcaoTrocaCapituloLeitor,
} from "./lib/ler-capitulo-navigation-actions";
import {
  criarStatusLeituraTexto,
  criarVoltarHrefLeitor,
} from "./lib/ler-capitulo-reader-display";
import {
  focusPageStyle,
  fixedReadingProgressOuterStyle,
  fixedReadingProgressInnerStyle,
  containerStyle,
  desktopContainerStyle,
} from "./lib/ler-capitulo-layout-styles";

const registrarNotificacaoInteracaoCapituloSupabase =
  criarRegistrarNotificacaoInteracaoCapituloSupabase(criarHrefLeituraCapituloLeitor);

export type DadosIniciaisLerCapitulo = {
  obraId: string;
  capituloId: string;
  obras: ObraLocal[];
};

export function LerCapituloClient({
  dadosIniciais,
}: {
  dadosIniciais?: DadosIniciaisLerCapitulo;
}) {
  const router = useRouter();
  const { language } = useHistorietasLanguage();
  const { obraId, setObraId, capituloId, setCapituloId } =
    useLerCapituloRouteIdentityState({
      obraIdInicial: dadosIniciais?.obraId,
      capituloIdInicial: dadosIniciais?.capituloId,
    });
  const {
    obras,
    setObras,
    carregando,
    setCarregando,
    erroCarregamento,
    setErroCarregamento,
    versaoCarregamento,
    tentarCarregarNovamente,
  } = useLerCapituloLoadedDataState(dadosIniciais?.obras);
  const {
    setComentarioDigitado,
    comentarioStatus,
    setComentarioStatus,
    comentariosCapitulo,
    setComentariosCapitulo,
    comentariosCarregando,
    setComentariosCarregando,
    mostrarComentario,
    setMostrarComentario,
  } = useLerCapituloCommentsState();
  const {
    denunciaAlvo,
    setDenunciaAlvo,
    mensagemAcao,
    setMensagemAcao,
    mostrarAjustes,
    setMostrarAjustes,
  } = useLerCapituloFeedbackOverlaysState();
  const {
    metricasCapitulo,
    setMetricasCapitulo,
    curtidaCapituloSalvando,
    setCurtidaCapituloSalvando,
    salvoCapituloSalvando,
    setSalvoCapituloSalvando,
    lidoCapituloSalvando,
    setLidoCapituloSalvando,
  } = useLerCapituloMetricsInteractionsState();
  const comentariosCapituloCarregadoIdRef = useRef("");
  const {
    perfilComentarioLeitor,
    setPerfilComentarioLeitor,
    usuarioIdLogado,
    setUsuarioIdLogado,
    tamanhoFonte,
    setTamanhoFonte,
    mostrarLinhaProgresso,
    setMostrarLinhaProgresso,
    preferenciasCarregadas,
    setPreferenciasCarregadas,
    identidadePreferenciasAplicada,
    setIdentidadePreferenciasAplicada,
  } = useLerCapituloSessionPreferencesState();
  const [progressoRolagem, setProgressoRolagem] = useState(0);
  const isDesktop = useLerCapituloDesktopMode();
  const visualizacaoCapituloRegistradaRef = useRef("");
  const atividadeDiarioRegistradaRef = useRef("");
  const curtidaCapituloSalvandoRef = useRef(false);
  const salvoCapituloSalvandoRef = useRef(false);
  const lidoCapituloSalvandoRef = useRef(false);
  const acoesComentariosCapituloRef = useRef<Set<string>>(new Set<string>());
  const [versaoContaComentarios, setVersaoContaComentarios] = useState(0);

  const limparEstadoContaAnterior = useCallback(() => {
    setVersaoContaComentarios((versao) => versao + 1);
    setObras((obrasAtuais) => removerEstadoUsuarioObrasLeitor(obrasAtuais));
    setComentariosCapitulo([]);
    setComentariosCarregando(false);
    setMetricasCapitulo((metricasAtuais) => ({
      ...metricasAtuais,
      curtiu: false,
      salvo: false,
      carregado: false,
    }));
    setCurtidaCapituloSalvando(false);
    setSalvoCapituloSalvando(false);
    setLidoCapituloSalvando(false);
    comentariosCapituloCarregadoIdRef.current = "";
    curtidaCapituloSalvandoRef.current = false;
    salvoCapituloSalvandoRef.current = false;
    lidoCapituloSalvandoRef.current = false;
    acoesComentariosCapituloRef.current.clear();
  }, [
    setComentariosCapitulo,
    setComentariosCarregando,
    setCurtidaCapituloSalvando,
    setLidoCapituloSalvando,
    setMetricasCapitulo,
    setObras,
    setSalvoCapituloSalvando,
  ]);

  const {
    autenticacaoCarregada,
    erroAutenticacao,
    identidadeAutenticadaLeitorRef,
    tentarCarregarAutenticacaoNovamente,
  } = useLerCapituloAuthIdentityLifecycle({
    onIdentidadeMudou: limparEstadoContaAnterior,
    setUsuarioIdLogado,
  });

  useLerCapituloCommentsBodyLock(
    mostrarComentario,
  );

  useLerCapituloSessionPreferences({
    usuarioIdLogado,
    tamanhoFonte,
    mostrarLinhaProgresso,
    preferenciasCarregadas,
    identidadePreferenciasAplicada,
    identidadeAutenticadaLeitorRef,
    setPerfilComentarioLeitor,
    setTamanhoFonte,
    setMostrarLinhaProgresso,
    setPreferenciasCarregadas,
    setIdentidadePreferenciasAplicada,
  });

  const { identidadeDadosAplicada } = useLerCapituloInitialLoad({
    autenticacaoCarregada,
    usuarioIdLogado,
    identidadeAutenticadaLeitorRef,
    setObraId,
    setCapituloId,
    setObras,
    setCarregando,
    setErroCarregamento,
    versaoCarregamento,
    obraIdInicial: dadosIniciais?.obraId,
    capituloIdInicial: dadosIniciais?.capituloId,
  });

  const {
    obterUsuarioLogadoIdAtual,
    exigirLogin,
    execucaoIdentidadeAcaoEstaAtual,
  } = criarAcoesAutenticacaoLeitor({
    obraId,
    capituloId,
    router,
    identidadeDadosAplicada,
    identidadeAutenticadaLeitorRef,
    setMensagemAcao,
  });
  const usuarioIdDadosAplicados = execucaoIdentidadeAcaoEstaAtual()
    ? usuarioIdLogado
    : "";

  const obraAtual = useMemo(
    () => obterObraAtualLeitor(obras, obraId),
    [obras, obraId],
  );

  const capituloAtual = useMemo(
    () => obterCapituloAtualLeitor(obraAtual, capituloId),
    [obraAtual, capituloId],
  );
  const erroCarregamentoInicial = erroAutenticacao || erroCarregamento;
  const tentarCarregamentoInicialNovamente = erroAutenticacao
    ? tentarCarregarAutenticacaoNovamente
    : tentarCarregarNovamente;

  const {
    salvarObras,
    atualizarCapitulo,
  } =
    criarAcoesObraLocalLeitor({
      obras,
      obraAtual,
      capituloAtual,
      usuarioIdLogado: usuarioIdDadosAplicados,
      execucaoIdentidadeAcaoEstaAtual,
      setObras,
    });

  const {
    statusAcesso18,
    permitirAcesso18Atual,
  } =
    useLerCapituloContent18Access(
      obraAtual,
    );


  const { comentariosLiberados, revelarComentarios } = useLerCapituloCommentsSpoilerAccess({
    obraId: obraAtual?.id || "",
    capituloId: capituloAtual?.id || "",
    aberto: mostrarComentario && statusAcesso18 === "permitido",
    lidoCapituloSalvando,
    dadosDaIdentidadeAtual: execucaoIdentidadeAcaoEstaAtual(),
    versaoConta: versaoContaComentarios,
    identidadeDadosAplicada,
    identidadeAutenticadaLeitorRef,
  });

  useLerCapituloInteractionData({
    comentariosLiberados,
    capituloAtual,
    comentariosCapitulo,
    usuarioIdLogado,
    identidadeDadosAplicada,
    identidadeAutenticadaLeitorRef,
    comentariosCapituloCarregadoIdRef,
    curtidaCapituloSalvandoRef,
    salvoCapituloSalvandoRef,
    setComentariosCapitulo,
    setComentariosCarregando,
    setMetricasCapitulo,
    metricasCapituloVazias,
    criarMetricasCapituloLocais,
    carregarMetricasCapituloSupabase,
    atualizarCapitulo,
    TABELA_COMENTARIOS_CAPITULOS_CURTIDAS,
  });

  const indiceCapitulo = useMemo(
    () => obterIndiceCapituloLeitor(obraAtual, capituloAtual),
    [obraAtual, capituloAtual],
  );

  const numeroCapitulo = obterNumeroCapituloLeitor(
    indiceCapitulo,
    capituloAtual,
  );

  const capituloAnterior = useMemo(
    () => obterCapituloAnteriorLeitor(obraAtual, indiceCapitulo),
    [obraAtual, indiceCapitulo],
  );

  const proximoCapitulo = useMemo(
    () => obterProximoCapituloLeitor(obraAtual, indiceCapitulo),
    [obraAtual, indiceCapitulo],
  );

  const totalPalavras = capituloAtual ? contarPalavras(capituloAtual.texto) : 0;
  const postComentariosCapitulo: ComentariosCapituloPost | null = capituloAtual
    ? {
        id: capituloAtual.id,
        comentarios: comentariosLiberados ? comentariosCapitulo : [],
      }
    : null;

  useLerCapituloViewRegistration({
    capituloAtual,
    statusAcesso18,
    visualizacaoCapituloRegistradaRef,
    setMetricasCapitulo,
    incrementarVisualizacaoCapituloSupabase,
  });

  useLerCapituloCommentReset({
    capituloId:
      capituloAtual?.id,
    comentarioAtual:
      capituloAtual?.comentario,
    usuarioIdLogado,
    setComentarioDigitado,
    setComentarioStatus,
    setMensagemAcao,
    setMostrarComentario,
  });

  useLerCapituloScrollProgress({
    capituloId:
      capituloAtual?.id,
    setProgressoRolagem,
  });

  useLerCapituloEntryActivity({
    usuarioIdLogado: usuarioIdDadosAplicados,
    obraAtual,
    capituloAtual,
    numeroCapitulo,
    statusAcesso18,
    atividadeDiarioRegistradaRef,
    marcarNotificacaoCapituloComoLidaSupabase,
    registrarAtividadeDiarioLeitor,
  });

  async function recarregarMetricasCapituloAtual() {
    if (!execucaoIdentidadeAcaoEstaAtual()) {
      return;
    }

    if (!capituloAtual) {
      setMetricasCapitulo(metricasCapituloVazias);
      return;
    }

    const metricas = await carregarMetricasCapituloSupabase(
      capituloAtual,
      comentariosCapitulo.length
    );

    if (!execucaoIdentidadeAcaoEstaAtual()) {
      return;
    }

    setMetricasCapitulo(metricas);

    if (
      metricas.curtiu !== capituloAtual.curtiu ||
      metricas.salvo !== capituloAtual.salvo
    ) {
      atualizarCapitulo({
        curtiu: metricas.curtiu,
        salvo: metricas.salvo,
      });
    }
  }

  const {
    alternarComentarioVisivel,
    fecharComentariosCapitulo,
    iniciarAcaoComentariosCapitulo,
    finalizarAcaoComentariosCapitulo,
  } =
    // A fábrica apenas cria callbacks; a ref é lida quando as ações são executadas.
    // eslint-disable-next-line react-hooks/refs
    criarControlesComentariosCapitulo({
      acoesComentariosCapituloRef,
      setComentarioStatus,
      setMostrarComentario,
    });

  // A fábrica apenas cria callbacks; as refs são lidas quando as ações são executadas.
  // eslint-disable-next-line react-hooks/refs
  const { alternarCurtida, alternarSalvo } = criarAcoesInteracoesCapitulo({
    obraAtual,
    capituloAtual,
    usuarioIdLogado,
    numeroCapitulo,
    metricasCapitulo,
    curtidaCapituloSalvandoRef,
    salvoCapituloSalvandoRef,
    exigirLogin,
    obterUsuarioLogadoIdAtual,
    execucaoIdentidadeAcaoEstaAtual,
    atualizarCapitulo,
    salvarRegistroCapituloSupabase,
    recarregarMetricasCapituloAtual,
    carregarPerfilComentarioLeitor,
    registrarNotificacaoInteracaoCapituloSupabase,
    criarHrefLeituraCapituloLeitor,
    registrarAtividadeDiarioLeitor,
    setCurtidaCapituloSalvando,
    setSalvoCapituloSalvando,
    setMensagemAcao,
    setMetricasCapitulo,
  });

  // A fábrica apenas cria o callback; a ref é lida quando a ação é executada.
  // eslint-disable-next-line react-hooks/refs
  const { alternarLido } = criarAcaoProgressoLeituraCapitulo({
    obraAtual,
    capituloAtual,
    obras,
    usuarioIdLogado,
    numeroCapitulo,
    lidoCapituloSalvandoRef,
    exigirLogin,
    obterUsuarioLogadoIdAtual,
    execucaoIdentidadeAcaoEstaAtual,
    normalizarObra,
    calcularProgressoLeitura,
    salvarObras,
    salvarProgressoLeituraSupabase,
    marcarNotificacaoCapituloComoLidaSupabase,
    registrarAtividadeDiarioLeitor,
    setLidoCapituloSalvando,
    setMensagemAcao,
  });

  const {
    enviarComentarioCapitulo,
    removerComentarioCapitulo,
    alternarCurtidaComentarioCapitulo,
  } = criarAcoesComentariosCapitulo({
    supabase,
    obraId,
    capituloId,
    obraAtual,
    capituloAtual,
    comentariosCapitulo,
    router,
    iniciarAcaoComentariosCapitulo,
    finalizarAcaoComentariosCapitulo,
    obterUsuarioLogadoIdAtual,
    execucaoIdentidadeAcaoEstaAtual,
    criarLoginHrefLeitor,
    criarHrefLeituraCapituloLeitor,
    carregarPerfilComentarioLeitor,
    salvarComentarioCapituloSupabase,
    obterTextoRegistroLeitor,
    registrarNotificacaoInteracaoCapituloSupabase,
    salvarCurtidaComentarioCapituloLocal,
    TABELA_COMENTARIOS_CAPITULOS_CURTIDAS,
    atualizarCapitulo,
    setComentarioStatus,
    setMensagemAcao,
    setPerfilComentarioLeitor,
    setComentarioDigitado,
    setComentariosCapitulo,
    setMetricasCapitulo,
    setMostrarComentario,
  });

  const {
    abrirDenunciaCapituloAtual,
    denunciarComentarioCapitulo,
  } =
    criarAcoesDenunciaLeitor({
      obraId,
      capituloId,
      capituloAtual,
      comentariosCapitulo,
      router,
      obterUsuarioLogadoIdAtual,
      setMensagemAcao,
      setMostrarAjustes,
      setComentarioStatus,
      setDenunciaAlvo,
    });
  const {
    trocarCapitulo,
  } =
    criarAcaoTrocaCapituloLeitor({
      obraAtual,
      capituloId,
      setCapituloId,
    });

  if (carregando && !erroAutenticacao) {
    return (
      <main data-historietas-ler-capitulo-root="true" style={focusPageStyle} aria-busy="true">
        <style>{`${historietasThemeCss}${leitorPageCss}`}</style>
        <LerCapituloLanguageBridge />
        <LoadingSpinner label="Carregando capítulo" />
      </main>
    );
  }

  if (erroCarregamentoInicial && (!obraAtual || !capituloAtual)) {
    return (
      <main data-historietas-ler-capitulo-root="true" style={focusPageStyle}>
        <style>{`${historietasThemeCss}${leitorPageCss}`}</style>
        <LerCapituloLanguageBridge />
        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <LerCapituloLoadError
            onTentarNovamente={tentarCarregamentoInicialNovamente}
          />
        </section>
      </main>
    );
  }

  if (!obraAtual || !capituloAtual) {
    return (
      <main data-historietas-ler-capitulo-root="true" style={focusPageStyle}>
        <style>{`${historietasThemeCss}${leitorPageCss}`}</style>
        <LerCapituloLanguageBridge />
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
            Capítulo não encontrado
          </p>
        </section>
      </main>
    );
  }

  if (
    ehClassificacao18(obraAtual.classificacaoIndicativa) &&
    statusAcesso18 === "verificando"
  ) {
    return (
      <main data-historietas-ler-capitulo-root="true" style={focusPageStyle} aria-busy="true">
        <style>{`${historietasThemeCss}${leitorPageCss}`}</style>
        <LoadingSpinner label="Verificando acesso" />
      </main>
    );
  }

  if (
    ehClassificacao18(obraAtual.classificacaoIndicativa) &&
    statusAcesso18 === "bloqueado"
  ) {
    return (
      <AdultContentGate
        titulo={obraAtual.titulo}
        avisos={obraAtual.avisosConteudo}
        language={language}
        onConfirmar={
          permitirAcesso18Atual
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

  const voltarHref =
    criarVoltarHrefLeitor(
      obraAtual,
    );
  const statusLeituraTexto =
    criarStatusLeituraTexto(
      capituloAtual,
    );

  return (
    <main data-historietas-ler-capitulo-root="true" style={focusPageStyle}>
      {mostrarLinhaProgresso && (
        <div style={fixedReadingProgressOuterStyle}>
          <div
            style={{
              ...fixedReadingProgressInnerStyle,
              width: `${progressoRolagem}%`,
            }}
          />
        </div>
      )}

      <style>{`${historietasThemeCss}${leitorPageCss}`}</style>

      <LerCapituloLanguageBridge />
      <style>{focusBottomNavigationCss}</style>

      {erroCarregamentoInicial && (
        <LerCapituloLoadError
          onTentarNovamente={tentarCarregamentoInicialNovamente}
        />
      )}

      <LerCapituloReaderContent
        obraAtual={obraAtual}
        capituloAtual={capituloAtual}
        isDesktop={isDesktop}
        mostrarAjustes={mostrarAjustes}
        setMostrarAjustes={setMostrarAjustes}
        language={language}
        metricasCapitulo={metricasCapitulo}
        tamanhoFonte={tamanhoFonte}
        setTamanhoFonte={setTamanhoFonte}
        mostrarLinhaProgresso={mostrarLinhaProgresso}
        setMostrarLinhaProgresso={setMostrarLinhaProgresso}
        usuarioIdLogado={usuarioIdDadosAplicados}
        obterAutorIdSeguro={obterAutorIdSeguro}
        statusLeituraTexto={statusLeituraTexto}
        totalPalavras={totalPalavras}
        trocarCapitulo={trocarCapitulo}
        abrirDenunciaCapituloAtual={abrirDenunciaCapituloAtual}
        criarTextoLeituraDesktopStyle={criarTextoLeituraDesktopStyle}
        criarTextoLeituraStyle={criarTextoLeituraStyle}
        curtidaCapituloSalvando={curtidaCapituloSalvando}
        alternarCurtida={alternarCurtida}
        salvoCapituloSalvando={salvoCapituloSalvando}
        alternarSalvo={alternarSalvo}
        alternarComentarioVisivel={alternarComentarioVisivel}
        mostrarComentario={mostrarComentario}
        lidoCapituloSalvando={lidoCapituloSalvando}
        alternarLido={alternarLido}
        mensagemAcao={mensagemAcao}
        capituloAnterior={capituloAnterior}
        proximoCapitulo={proximoCapitulo}
        voltarHref={voltarHref}
        formatarContadorCapituloLeitor={formatarContadorCapituloLeitor}
        FONT_SCALE_VALUES={FONT_SCALE_VALUES}
      />

      <ComentariosCapituloSheet
        key={mostrarComentario ? postComentariosCapitulo?.id || "comentarios-fechados" : "comentarios-fechados"}
        post={mostrarComentario ? postComentariosCapitulo : null}
        comentariosLiberados={comentariosLiberados}
        onRevelarComentarios={revelarComentarios}
        podeComentar={Boolean(usuarioIdDadosAplicados)}
        usuarioId={usuarioIdDadosAplicados}
        obraAutorId={obterAutorIdSeguro(obraAtual)}
        usuarioNome={perfilComentarioLeitor.nome}
        usuarioAvatar={perfilComentarioLeitor.avatar}
        erroInteracao={comentarioStatus}
        carregando={comentariosCarregando}
        isDesktop={isDesktop}
        onFechar={fecharComentariosCapitulo}
        onEnviar={enviarComentarioCapitulo}
        onCurtirComentario={alternarCurtidaComentarioCapitulo}
        onRemoverComentario={removerComentarioCapitulo}
        onDenunciarComentario={denunciarComentarioCapitulo}
      />

      <DenunciaModal
        aberto={Boolean(denunciaAlvo)}
        alvoTipo={denunciaAlvo?.alvoTipo || "capitulo"}
        alvoId={denunciaAlvo?.alvoId || ""}
        alvoTitulo={denunciaAlvo?.alvoTitulo || ""}
        onFechar={() => setDenunciaAlvo(null)}
      />

    </main>
  );
}

export default function LerCapituloPage() {
  return <LerCapituloClient />;
}
