"use client";

import { useHistorietasTheme } from "../../lib/historietasTheme";
import { useNotificacoes } from "../../components/NotificacoesProvider";
import { useState } from "react";
import NotificacoesLoadingSpinner from "./components/notificacoes-loading-spinner";
import NotificacoesSortingSheet from "./components/notificacoes-sorting-sheet";
import NotificacoesTopControls from "./components/notificacoes-top-controls";
import NotificacoesActionsSheet from "./components/notificacoes-actions-sheet";
import NotificacoesFeed from "./components/notificacoes-feed";
import NotificacoesPageShell from "./components/notificacoes-page-shell";
import { useNotificacoesDesktopMode } from "./hooks/use-notificacoes-desktop-mode";
import { useNotificacoesPageControls } from "./hooks/use-notificacoes-page-controls";
import { useNotificacoesPageViewState } from "./hooks/use-notificacoes-page-view-state";
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
import type {
  NotificacaoLocal,
  ObraLocal,
} from "./lib/notificacoes-models";
import { useNotificacoesInitialLoad } from "./hooks/use-notificacoes-initial-load";
import { criarAcoesMutacaoNotificacoes } from "./lib/notificacoes-mutation-actions";
import { criarAtualizadorNotificacoes } from "./lib/notificacoes-state-update-action";

export default function NotificacoesPage() {
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [notificacoes, setNotificacoes] = useState<NotificacaoLocal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [usuarioNotificacoesId, setUsuarioNotificacoesId] = useState("");
  const [solicitacaoRespondendoId, setSolicitacaoRespondendoId] = useState("");
  const {
    busca,
    buscaTopoAberta,
    filtro,
    ordenacao,
    menuNotificacaoAbertoId,
    mostrarPainelOrdenacao,
    setMostrarPainelOrdenacao,
    alternarMenuNotificacao,
    fecharMenuNotificacao,
    limparFiltros,
    atualizarBusca,
    alternarPainelOrdenacao,
    abrirBusca,
    fecharBusca,
    fecharPainelOrdenacao,
    atualizarFiltro,
    atualizarOrdenacao,
  } = useNotificacoesPageControls();
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

  const {
    totalNotificacoes,
    totalLidas,
    notificacoesFiltradas,
    filtrosAtivos,
    opcoesFiltro,
    opcoesOrdenacao,
    encontrarObra,
    encontrarCapitulo,
    notificacaoMenuAberta,
  } = useNotificacoesPageViewState({
    obras,
    notificacoes,
    busca,
    filtro,
    ordenacao,
    menuNotificacaoAbertoId,
  });

  const atualizarNotificacoes = criarAtualizadorNotificacoes({
    setNotificacoes,
    definirNotificacoesNaoLidas,
    usuarioNotificacoesId,
  });

  const {
    abrirNotificacao,
    apagarNotificacao,
    limparLidas,
    limparTodas,
    marcarComoLida,
    marcarComoNaoLida,
    marcarFiltradasComoLidas,
    marcarTodasComoLidas,
    responderSolicitacaoSeguidorNotificacao,
  } = criarAcoesMutacaoNotificacoes({
    notificacoes,
    notificacoesFiltradas,
    usuarioNotificacoesId,
    solicitacaoRespondendoId,
    atualizarNotificacoes,
    fecharMenuNotificacao,
    setSolicitacaoRespondendoId,
  });

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
            onBuscaChange={atualizarBusca}
            onAlternarPainelOrdenacao={alternarPainelOrdenacao}
            onAbrirBusca={abrirBusca}
            onFecharBusca={fecharBusca}
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
            onClose={fecharPainelOrdenacao}
            onFiltroChange={atualizarFiltro}
            onOrdenacaoChange={atualizarOrdenacao}
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
