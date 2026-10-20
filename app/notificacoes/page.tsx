"use client";

import { supabase } from "../../lib/supabase/client";
import { useHistorietasTheme } from "../../lib/historietasTheme";
import { acessoConteudo18Confirmado } from "../../lib/historietasAdultContent";
import {
  filtrarEOrdenarNotificacoes,
  type FiltroNotificacao,
  type OrdenacaoNotificacao,
} from "./lib/notificacoes-filter-utils";
import {
  criarOpcoesFiltroNotificacoes,
  criarOpcoesOrdenacaoNotificacoes,
  filtrosNotificacoesEstaoAtivos,
} from "./lib/notificacoes-filter-options";
import { useNotificacoes } from "../../components/NotificacoesProvider";
import { idObraSupabaseValido, normalizarTexto } from "../../lib/utils";
import { useMemo, useState } from "react";
import NotificacoesLoadingSpinner from "./components/notificacoes-loading-spinner";
import NotificacoesSortingSheet from "./components/notificacoes-sorting-sheet";
import NotificacoesTopControls from "./components/notificacoes-top-controls";
import NotificacoesActionsSheet from "./components/notificacoes-actions-sheet";
import NotificacoesFeed from "./components/notificacoes-feed";
import NotificacoesPageShell from "./components/notificacoes-page-shell";
import { useNotificacoesDesktopMode } from "./hooks/use-notificacoes-desktop-mode";
import { useNotificacoesOverlayBodyLock } from "./hooks/use-notificacoes-overlay-body-lock";
import {
  containerStyle,
  desktopContainerStyle,
  desktopNotificationsControlsStyle,
  loadingPageStyle,
  loadingSpinnerStyle,
  notificationClearButtonStyle,
  notificacoesTopFilterBoxStyle,
  notificationsControlsStyle,
  pageStyle,
} from "./lib/notificacoes-shell-styles";
import {
  apagarNotificacaoSupabase,
  apagarNotificacoesSupabase,
  excluirNotificacoesLidasSupabase,
  sincronizarNotificacaoLidaSupabase,
  sincronizarNotificacoesLidasSupabase,
} from "./lib/notificacoes-supabase-sync";
import {
  mesclarNotificacoes,
} from "./lib/notificacoes-merge-utils";
import {
  prepararNotificacaoTexto,
  registrarNotificacoesApagadas,
  salvarNotificacoes,
} from "./lib/notificacoes-local-state-utils";
import type {
  NotificacaoLocal,
  ObraLocal,
} from "./lib/notificacoes-models";
import { useNotificacoesInitialLoad } from "./hooks/use-notificacoes-initial-load";
import {
  calcularTotalNotificacoesLidas,
  contarNotificacoesNaoLidas,
  criarObrasPorIdNotificacoes,
  encontrarCapituloNotificacao,
  encontrarObraNotificacao,
  obterNotificacaoMenuAberta,
} from "./lib/notificacoes-view-state-utils";
import {
  atualizarEstadoLeituraNotificacao,
  marcarNotificacoesFiltradasComoLidasLocal,
  marcarTodasNotificacoesComoLidasLocal,
  removerNotificacaoLocal,
  separarNotificacoesLidasLocal,
} from "./lib/notificacoes-local-actions-utils";
import {
  criarIdsNotificacoesRelacionadas,
  encontrarNotificacoesRelacionadasSolicitacaoSeguidor,
} from "./lib/notificacoes-follow-request-utils";

export default function NotificacoesPage() {
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [notificacoes, setNotificacoes] = useState<NotificacaoLocal[]>([]);
  const [busca, setBusca] = useState("");
  const [buscaTopoAberta, setBuscaTopoAberta] = useState(false);
  const [filtro, setFiltro] = useState<FiltroNotificacao>("todas");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoNotificacao>("recentes");
  const [carregando, setCarregando] = useState(true);
  const [usuarioNotificacoesId, setUsuarioNotificacoesId] = useState("");
  const [menuNotificacaoAbertoId, setMenuNotificacaoAbertoId] = useState("");
  const [solicitacaoRespondendoId, setSolicitacaoRespondendoId] = useState("");
  const [mostrarPainelOrdenacao, setMostrarPainelOrdenacao] = useState(false);
  const { definirNotificacoesNaoLidas } = useNotificacoes();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const isDesktop = useNotificacoesDesktopMode();
  useNotificacoesInitialLoad({
    definirNotificacoesNaoLidas,
    setCarregando,
    setNotificacoes,
    setObras,
    setUsuarioNotificacoesId,
  });

  const obrasPorId = useMemo(() => {
    return criarObrasPorIdNotificacoes(obras);
  }, [obras]);

  const totalNotificacoes = notificacoes.length;

  const totalNaoLidas = useMemo(() => {
    return contarNotificacoesNaoLidas(notificacoes);
  }, [notificacoes]);

  const totalLidas = calcularTotalNotificacoesLidas(
    totalNotificacoes,
    totalNaoLidas,
  );
  const termoBusca = normalizarTexto(busca);

  const acessoConteudo18Liberado = acessoConteudo18Confirmado();

  const notificacoesFiltradas = useMemo(() => {
    return filtrarEOrdenarNotificacoes({
      notificacoes,
      obrasPorId,
      termoBusca,
      filtro,
      ordenacao,
      acessoConteudo18Liberado,
    });
  }, [
    notificacoes,
    obrasPorId,
    termoBusca,
    filtro,
    ordenacao,
    acessoConteudo18Liberado,
  ]);

  const filtrosAtivos = filtrosNotificacoesEstaoAtivos(
    busca,
    filtro,
    ordenacao,
  );

  const opcoesFiltro = criarOpcoesFiltroNotificacoes();

  const opcoesOrdenacao = criarOpcoesOrdenacaoNotificacoes();

  function encontrarObra(obraId: string) {
    return encontrarObraNotificacao(obrasPorId, obraId);
  }

  function encontrarCapitulo(obraId: string, capituloId: string) {
    return encontrarCapituloNotificacao(obrasPorId, obraId, capituloId);
  }

  function atualizarNotificacoes(novasNotificacoes: NotificacaoLocal[]) {
    const notificacoesNormalizadas = mesclarNotificacoes(
      [],
      novasNotificacoes
    ).map((notificacao) => prepararNotificacaoTexto(notificacao));

    setNotificacoes(notificacoesNormalizadas);
    definirNotificacoesNaoLidas(
      notificacoesNormalizadas.filter((notificacao) => !notificacao.lida).length
    );
    salvarNotificacoes(notificacoesNormalizadas, usuarioNotificacoesId);
  }

  function marcarComoLida(id: string) {
    const notificacaoAtual = notificacoes.find((notificacao) => notificacao.id === id);
    const novasNotificacoes = atualizarEstadoLeituraNotificacao(
      notificacoes,
      id,
      true,
    );

    atualizarNotificacoes(novasNotificacoes);

    if (notificacaoAtual) {
      void sincronizarNotificacaoLidaSupabase(notificacaoAtual, true, usuarioNotificacoesId);
    }
  }

  function marcarComoNaoLida(id: string) {
    const notificacaoAtual = notificacoes.find((notificacao) => notificacao.id === id);
    const novasNotificacoes = atualizarEstadoLeituraNotificacao(
      notificacoes,
      id,
      false,
    );

    atualizarNotificacoes(novasNotificacoes);

    if (notificacaoAtual) {
      void sincronizarNotificacaoLidaSupabase(notificacaoAtual, false, usuarioNotificacoesId);
    }
  }

  function abrirNotificacao(id: string) {
    marcarComoLida(id);
  }

  async function responderSolicitacaoSeguidorNotificacao(
    notificacao: NotificacaoLocal,
    aceitar: boolean
  ) {
    const solicitacaoId = notificacao.solicitacaoId?.trim() || "";

    if (
      !solicitacaoId ||
      !idObraSupabaseValido(solicitacaoId) ||
      solicitacaoRespondendoId
    ) {
      return;
    }

    setSolicitacaoRespondendoId(solicitacaoId);

    try {
      const { data, error } = await supabase.rpc(
        "responder_solicitacao_seguidor",
        {
          p_solicitacao_id: solicitacaoId,
          p_aceitar: aceitar,
        }
      );

      if (error || (data !== "aceita" && data !== "recusada")) {
        window.alert(
          error?.message || "Não foi possível responder esta solicitação."
        );
        return;
      }

      const notificacoesRelacionadas =
        encontrarNotificacoesRelacionadasSolicitacaoSeguidor(
          notificacoes,
          notificacao,
          solicitacaoId,
        );
      const idsRelacionados = criarIdsNotificacoesRelacionadas(
        notificacoesRelacionadas,
      );

      registrarNotificacoesApagadas(
        usuarioNotificacoesId,
        Array.from(idsRelacionados)
      );
      atualizarNotificacoes(
        notificacoes.filter(
          (notificacaoAtual) => !idsRelacionados.has(notificacaoAtual.id.trim())
        )
      );

      if (notificacoesRelacionadas.length > 0) {
        void apagarNotificacoesSupabase(
          notificacoesRelacionadas,
          usuarioNotificacoesId
        );
      }

      fecharMenuNotificacao();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Não foi possível responder esta solicitação."
      );
    } finally {
      setSolicitacaoRespondendoId("");
    }
  }

  function marcarTodasComoLidas() {
    const { notificacoesParaSincronizar, novasNotificacoes } =
      marcarTodasNotificacoesComoLidasLocal(notificacoes);

    atualizarNotificacoes(novasNotificacoes);
    void sincronizarNotificacoesLidasSupabase(
      notificacoesParaSincronizar,
      true,
      usuarioNotificacoesId
    );
  }

  function marcarFiltradasComoLidas() {
    const { notificacoesParaSincronizar, novasNotificacoes } =
      marcarNotificacoesFiltradasComoLidasLocal(
        notificacoes,
        notificacoesFiltradas,
      );

    atualizarNotificacoes(novasNotificacoes);
    void sincronizarNotificacoesLidasSupabase(
      notificacoesParaSincronizar,
      true,
      usuarioNotificacoesId
    );
  }

  function apagarNotificacao(id: string) {
    const notificacaoAtual = notificacoes.find((notificacao) => notificacao.id === id);
    const novasNotificacoes = removerNotificacaoLocal(notificacoes, id);

    if (notificacaoAtual) {
      registrarNotificacoesApagadas(usuarioNotificacoesId, [notificacaoAtual.id]);
    }

    atualizarNotificacoes(novasNotificacoes);

    if (notificacaoAtual) {
      void apagarNotificacaoSupabase(notificacaoAtual, usuarioNotificacoesId);
    }
  }

  function limparTodas() {
    const notificacoesParaApagar = [...notificacoes];

    registrarNotificacoesApagadas(
      usuarioNotificacoesId,
      notificacoesParaApagar.map((notificacao) => notificacao.id)
    );
    atualizarNotificacoes([]);
    void apagarNotificacoesSupabase(
      notificacoesParaApagar,
      usuarioNotificacoesId
    );
  }

  function limparLidas() {
    const { notificacoesLidas, novasNotificacoes } =
      separarNotificacoesLidasLocal(notificacoes);

    registrarNotificacoesApagadas(
      usuarioNotificacoesId,
      notificacoesLidas.map((notificacao) => notificacao.id)
    );
    atualizarNotificacoes(novasNotificacoes);
    void excluirNotificacoesLidasSupabase(usuarioNotificacoesId).then((excluiu) => {
      if (!excluiu) {
        void apagarNotificacoesSupabase(
          notificacoesLidas,
          usuarioNotificacoesId
        );
      }
    });
  }

  function alternarMenuNotificacao(id: string) {
    setMostrarPainelOrdenacao(false);
    setMenuNotificacaoAbertoId((idAtual) => (idAtual === id ? "" : id));
  }

  function fecharMenuNotificacao() {
    setMenuNotificacaoAbertoId("");
  }

  function fecharMenusNotificacoes() {
    setMenuNotificacaoAbertoId("");
    setMostrarPainelOrdenacao(false);
  }

  function limparFiltros() {
    fecharMenusNotificacoes();
    setBusca("");
    setBuscaTopoAberta(false);
    setFiltro("todas");
    setOrdenacao("recentes");
  }

  const notificacaoMenuAberta = obterNotificacaoMenuAberta(
    menuNotificacaoAbertoId,
    notificacoes,
  );

  const menuOverlayAberto = Boolean(
    mostrarPainelOrdenacao || notificacaoMenuAberta
  );
  useNotificacoesOverlayBodyLock(menuOverlayAberto);

  if (carregando) {
    return (
      <NotificacoesPageShell
        isDesktop={isDesktop}
        pageThemeStyle={pageThemeStyle}
      >
        <NotificacoesLoadingSpinner
          label="Carregando notificações"
          pageStyle={loadingPageStyle}
          spinnerStyle={loadingSpinnerStyle}
        />
      </NotificacoesPageShell>
    );
  }

  return (
    <NotificacoesPageShell
      isDesktop={isDesktop}
      pageThemeStyle={pageThemeStyle}
    >
      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <section style={notificacoesTopFilterBoxStyle}>
          <NotificacoesTopControls
            isDesktop={isDesktop}
            busca={busca}
            buscaTopoAberta={buscaTopoAberta}
            mostrarPainelOrdenacao={mostrarPainelOrdenacao}
            onBuscaChange={(proximaBusca) => {
              fecharMenusNotificacoes();
              setBusca(proximaBusca);
            }}
            onAlternarPainelOrdenacao={() => {
              fecharMenusNotificacoes();
              setMostrarPainelOrdenacao((aberto) => !aberto);
            }}
            onAbrirBusca={() => {
              fecharMenusNotificacoes();
              setBuscaTopoAberta(true);
            }}
            onFecharBusca={() => {
              fecharMenusNotificacoes();
              setBusca("");
              setBuscaTopoAberta(false);
            }}
          />
        </section>

        {totalNotificacoes > 0 && filtrosAtivos && (
          <section
            style={
              isDesktop
                ? desktopNotificationsControlsStyle
                : notificationsControlsStyle
            }
          >
            <button
              type="button"
              onClick={limparFiltros}
              style={notificationClearButtonStyle}
            >
              Limpar busca e filtros
            </button>
          </section>
        )}

        {mostrarPainelOrdenacao && (
          <NotificacoesSortingSheet
            isDesktop={isDesktop}
            filtro={filtro}
            ordenacao={ordenacao}
            opcoesFiltro={opcoesFiltro}
            opcoesOrdenacao={opcoesOrdenacao}
            totalNotificacoes={notificacoes.length}
            totalNotificacoesFiltradas={notificacoesFiltradas.length}
            totalLidas={totalLidas}
            onClose={() => setMostrarPainelOrdenacao(false)}
            onFiltroChange={(proximoFiltro) => {
              setFiltro(proximoFiltro);
              setMostrarPainelOrdenacao(false);
            }}
            onOrdenacaoChange={(proximaOrdenacao) => {
              setOrdenacao(proximaOrdenacao);
              setMostrarPainelOrdenacao(false);
            }}
            onMarcarTodasComoLidas={() => {
              marcarTodasComoLidas();
              setMostrarPainelOrdenacao(false);
            }}
            onMarcarFiltradasComoLidas={() => {
              marcarFiltradasComoLidas();
              setMostrarPainelOrdenacao(false);
            }}
            onLimparLidas={() => {
              limparLidas();
              setMostrarPainelOrdenacao(false);
            }}
            onLimparTodas={() => {
              limparTodas();
              setMostrarPainelOrdenacao(false);
            }}
          />
        )}

        <NotificacoesFeed
          isDesktop={isDesktop}
          notificacoes={notificacoes}
          notificacoesFiltradas={notificacoesFiltradas}
          menuNotificacaoAbertoId={menuNotificacaoAbertoId}
          solicitacaoRespondendoId={solicitacaoRespondendoId}
          encontrarObra={encontrarObra}
          encontrarCapitulo={encontrarCapitulo}
          onAlternarMenuNotificacao={alternarMenuNotificacao}
          onResponderSolicitacaoSeguidor={(notificacao, aceitar) => {
            void responderSolicitacaoSeguidorNotificacao(notificacao, aceitar);
          }}
        />

        {notificacaoMenuAberta && (
          <NotificacoesActionsSheet
            isDesktop={isDesktop}
            notificacaoOriginal={notificacaoMenuAberta}
            encontrarObra={encontrarObra}
            solicitacaoRespondendoId={solicitacaoRespondendoId}
            onClose={fecharMenuNotificacao}
            onAbrirNotificacao={abrirNotificacao}
            onResponderSolicitacaoSeguidor={(notificacao, aceitar) => {
              void responderSolicitacaoSeguidorNotificacao(notificacao, aceitar);
            }}
            onMarcarComoLida={marcarComoLida}
            onMarcarComoNaoLida={marcarComoNaoLida}
            onApagarNotificacao={apagarNotificacao}
          />
        )}
      </section>
    </NotificacoesPageShell>
  );
}
