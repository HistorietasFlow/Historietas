"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import type {
  ObraComMetricas,
  ObraLocal,
} from "./lib/painel-autor-types";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { PainelAutorLanguageBridge } from "./components/painel-autor-language-bridge";
import { LoadingSpinner } from "./components/painel-autor-loading-spinner";
import { usePainelAutorAuthSession } from "./hooks/use-painel-autor-auth-session";
import { usePainelAutorDesktopMode } from "./hooks/use-painel-autor-desktop-mode";
import { usePainelAutorFiltersBodyLock } from "./hooks/use-painel-autor-filters-body-lock";
import { usePainelAutorFilterState } from "./hooks/use-painel-autor-filter-state";
import { usePainelAutorInitialData } from "./hooks/use-painel-autor-initial-data";
import { usePainelAutorDeleteWork } from "./hooks/use-painel-autor-delete-work";
import { usePainelAutorLoginRedirect } from "./hooks/use-painel-autor-login-redirect";
import { usePainelAutorSummaryPreference } from "./hooks/use-painel-autor-summary-preference";
import { painelAutorPageCss } from "./lib/painel-autor-page-css";
import {
  containerStyle,
  desktopTopWaterFadeStyle,
  mobileTopWaterFadeStyle,
  pageStyle,
  topStyle,
} from "./lib/painel-autor-layout-style-utils";
import {
  desktopCommunityFilterButtonStyle,
  desktopCommunitySearchIconStyle,
  desktopCommunitySearchInputStyle,
  desktopCommunitySearchShellStyle,
  desktopCommunityTopActionsStyle,
  desktopCommunityTopStyle,
  desktopCommunityTopTitleStyle,
} from "./lib/painel-autor-desktop-header-style-utils";
import {
  topFilterButtonStyle,
  topFilterIconStyle,
  topSearchButtonStyle,
  topSearchInputStyle,
  topSearchShellStyle,
} from "./lib/painel-autor-top-controls-style-utils";
import {
  statCardStyle,
  statLabelStyle,
  statNumberStyle,
  statsBoxStyle,
  studioClearButtonStyle,
  studioControlsStyle,
} from "./lib/painel-autor-summary-style-utils";
import {
  criarFilterSheetOptionStyle,
  criarFilterSheetRadioStyle,
  desktopFilterSheetStyle,
  filterSheetClearDividerStyle,
  filterSheetClearStyle,
  filterSheetContentStyle,
  filterSheetHandleStyle,
  filterSheetOverlayStyle,
  filterSheetSectionLabelStyle,
  filterSheetStyle,
  filterSheetTitleStyle,
} from "./lib/painel-autor-filter-sheet-style-utils";
import {
  desktopContainerStyle,
  desktopStatsBoxStyle,
  desktopStudioControlsStyle,
} from "./lib/painel-autor-desktop-compositions-style-utils";
import {
  emptyMiniBoxStyle,
  emptyMiniButtonStyle,
  emptyMiniTextStyle,
  emptyMiniTitleStyle,
} from "./lib/painel-autor-empty-state-style-utils";
import { PainelSecao } from "./components/painel-autor-section";
import { ObraPainelCard } from "./components/painel-autor-work-card";
import {
  FILTROS_PAINEL,
  ORDENACOES_PAINEL,
} from "./lib/painel-autor-filter-options";
import { obterObrasComMetricasPainel } from "./lib/painel-autor-work-metrics";
import { obterObrasFiltradasPainel } from "./lib/painel-autor-work-filtering";
import { obterResumoMetricasPainel } from "./lib/painel-autor-summary-metrics";
import { compartilharObraPainel } from "./lib/painel-autor-share-action";
import { abrirArquivoObraPainel } from "./lib/painel-autor-open-file-action";
export default function PainelAutorPage() {
  const router = useRouter();
  const { language } = useHistorietasLanguage();

  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const {
    busca,
    setBusca,
    buscaPainelAberta,
    setBuscaPainelAberta,
    filtro,
    setFiltro,
    ordenacao,
    setOrdenacao,
    mostrarFiltrosPainel,
    setMostrarFiltrosPainel,
    filtrosAtivos,
    limparFiltros,
  } = usePainelAutorFilterState();

  const { pageThemeStyle } = useHistorietasTheme(pageStyle);


  const isDesktop = usePainelAutorDesktopMode();

  const { usuarioIdLogado, verificandoUsuario } =
    usePainelAutorAuthSession();

  const { mostrarResumoPainel, alternarResumoPainel } =
    usePainelAutorSummaryPreference(usuarioIdLogado);

  usePainelAutorFiltersBodyLock(mostrarFiltrosPainel);

  usePainelAutorLoginRedirect({
    router,
    usuarioIdLogado,
    verificandoUsuario,
  });

  usePainelAutorInitialData({
    usuarioIdLogado,
    verificandoUsuario,
    setObras,
    setObrasFavoritas,
    setObrasConcluidas,
    setCarregandoDados,
  });

  const obrasComMetricas = useMemo<ObraComMetricas[]>(
    () => obterObrasComMetricasPainel(obras),
    [obras]
  );

  const obrasFiltradas = useMemo<ObraComMetricas[]>(
    () =>
      obterObrasFiltradasPainel({
        obrasComMetricas,
        busca,
        filtro,
        ordenacao,
        obrasFavoritas,
        obrasConcluidas,
      }),
    [
      obrasComMetricas,
      busca,
      filtro,
      ordenacao,
      obrasFavoritas,
      obrasConcluidas,
    ]
  );

  const {
    obrasPublicadas,
    obrasRascunhos,
    totalCapitulos,
    totalCurtidas,
    totalComentarios,
    totalSalvos,
    totalArquivos,
  } = obterResumoMetricasPainel(obrasComMetricas);

  const usuarioLogado = Boolean(usuarioIdLogado);
  const { excluirObra } = usePainelAutorDeleteWork({
    router,
    language,
    usuarioIdLogado,
    obras,
    obrasFavoritas,
    obrasConcluidas,
    setObras,
    setObrasFavoritas,
    setObrasConcluidas,
  });

  function abrirArquivoObra(obra: ObraLocal) {
    return abrirArquivoObraPainel(obra, language);
  }

  function compartilharObra(obra: ObraLocal) {
    return compartilharObraPainel(obra, language);
  }

  if (verificandoUsuario || !usuarioLogado || carregandoDados) {
    return (
      <main data-historietas-painel-autor-root="true" style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${painelAutorPageCss}`}</style>
        <PainelAutorLanguageBridge />

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <LoadingSpinner label="Carregando Painel do Autor" />
      </main>
    );
  }


  return (
    <main data-historietas-painel-autor-root="true" style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${painelAutorPageCss}`}</style>
      <PainelAutorLanguageBridge />

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        {isDesktop ? (
          <header style={desktopCommunityTopStyle}>
            <h1 style={desktopCommunityTopTitleStyle}>Painel do autor</h1>

            <div style={desktopCommunityTopActionsStyle}>
              <label style={desktopCommunitySearchShellStyle}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  style={desktopCommunitySearchIconStyle}
                >
                  <circle
                    cx="10.85"
                    cy="10.85"
                    r="6.65"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M16.05 16.05L20.25 20.25"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>

                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  aria-label="Buscar obra..."
                  placeholder="Buscar obra..."
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={90}
                  style={desktopCommunitySearchInputStyle}
                  type="text"
                />
              </label>

              <button
                type="button"
                onClick={() => setMostrarFiltrosPainel(true)}
                style={desktopCommunityFilterButtonStyle}
                aria-label="Abrir painel do autor"
              >
                <span>Filtros</span>
                <span aria-hidden="true">+</span>
              </button>
            </div>
          </header>
        ) : (
          <header style={topStyle}>
            <button
              type="button"
              onClick={() => setMostrarFiltrosPainel(true)}
              style={topFilterButtonStyle}
              aria-label="Abrir painel do autor"
            >
              <span>Painel do autor</span>
              <span style={topFilterIconStyle} aria-hidden="true">
                +
              </span>
            </button>

            {buscaPainelAberta ? (
              <>
                <label style={topSearchShellStyle}>
                  <input
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    aria-label="Buscar obra..."
                  placeholder="Buscar obra..."
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={90}
                    style={topSearchInputStyle}
                    type="text"
                    autoFocus
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setBusca("");
                    setBuscaPainelAberta(false);
                  }}
                  aria-label="Fechar busca"
                  aria-expanded="true"
                  style={topSearchButtonStyle}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <circle
                      cx="10.85"
                      cy="10.85"
                      r="6.65"
                      stroke="currentColor"
                      strokeWidth="2.15"
                    />
                    <path
                      d="M16.05 16.05L20.25 20.25"
                      stroke="currentColor"
                      strokeWidth="2.15"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setBuscaPainelAberta(true)}
                aria-label="Abrir busca"
                aria-expanded="false"
                style={topSearchButtonStyle}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle
                    cx="10.85"
                    cy="10.85"
                    r="6.65"
                    stroke="currentColor"
                    strokeWidth="2.15"
                  />
                  <path
                    d="M16.05 16.05L20.25 20.25"
                    stroke="currentColor"
                    strokeWidth="2.15"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </header>
        )}

        <section style={isDesktop ? desktopStudioControlsStyle : studioControlsStyle}>
          {mostrarResumoPainel && (
            <section style={isDesktop ? desktopStatsBoxStyle : statsBoxStyle}>
          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{obrasComMetricas.length}</strong>
            <span style={statLabelStyle}>
              {obrasComMetricas.length === 1 ? "obra" : "obras"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{obrasPublicadas.length}</strong>
            <span style={statLabelStyle}>
              {obrasPublicadas.length === 1 ? "publicada" : "publicadas"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{obrasRascunhos.length}</strong>
            <span style={statLabelStyle}>
              {obrasRascunhos.length === 1 ? "rascunho" : "rascunhos"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totalCapitulos}</strong>
            <span style={statLabelStyle}>
              {totalCapitulos === 1 ? "capítulo" : "capítulos"}
            </span>
          </div>


          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totalCurtidas}</strong>
            <span style={statLabelStyle}>
              {totalCurtidas === 1 ? "curtida" : "curtidas"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totalComentarios}</strong>
            <span style={statLabelStyle}>
              {totalComentarios === 1 ? "comentário" : "comentários"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totalSalvos}</strong>
            <span style={statLabelStyle}>
              {totalSalvos === 1 ? "salvo" : "salvos"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totalArquivos}</strong>
            <span style={statLabelStyle}>
              {totalArquivos === 1 ? "arquivo" : "arquivos"}
            </span>
          </div>
            </section>
          )}

          {filtrosAtivos && (
            <button type="button" onClick={limparFiltros} style={studioClearButtonStyle}>
              Limpar filtros
            </button>
          )}
        </section>

        {mostrarFiltrosPainel && (
          <div
            style={filterSheetOverlayStyle}
            onClick={() => setMostrarFiltrosPainel(false)}
          >
            <section
              style={isDesktop ? desktopFilterSheetStyle : filterSheetStyle}
              onClick={(event) => event.stopPropagation()}
              aria-label="Painel do autor"
            >
              <span style={filterSheetHandleStyle} aria-hidden="true" />

              <h2 style={filterSheetTitleStyle}>Painel do autor</h2>

              <div style={filterSheetContentStyle}>
                <p style={filterSheetSectionLabelStyle}>MOSTRAR</p>

                {FILTROS_PAINEL.map((opcao) => {
                  const ativo = filtro === opcao.valor;

                  return (
                    <button
                      key={opcao.valor}
                      type="button"
                      onClick={() => {
                        setFiltro(opcao.valor);
                        setMostrarFiltrosPainel(false);
                      }}
                      style={criarFilterSheetOptionStyle(ativo)}
                    >
                      <span>{opcao.rotulo}</span>
                      <span
                        style={criarFilterSheetRadioStyle(ativo)}
                        aria-hidden="true"
                      >
                        {ativo ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}

                <p style={filterSheetSectionLabelStyle}>ORDENAR</p>

                {ORDENACOES_PAINEL.map((opcao) => {
                  const ativo = ordenacao === opcao.valor;

                  return (
                    <button
                      key={opcao.valor}
                      type="button"
                      onClick={() => {
                        setOrdenacao(opcao.valor);
                        setMostrarFiltrosPainel(false);
                      }}
                      style={criarFilterSheetOptionStyle(ativo)}
                    >
                      <span>{opcao.rotulo}</span>
                      <span
                        style={criarFilterSheetRadioStyle(ativo)}
                        aria-hidden="true"
                      >
                        {ativo ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}

                <p style={filterSheetSectionLabelStyle}>RESUMO</p>

                <button
                  type="button"
                  onClick={alternarResumoPainel}
                  style={criarFilterSheetOptionStyle(mostrarResumoPainel)}
                  aria-pressed={mostrarResumoPainel}
                >
                  <span>Mostrar os 8 mini cards</span>
                  <span
                    style={criarFilterSheetRadioStyle(mostrarResumoPainel)}
                    aria-hidden="true"
                  >
                    {mostrarResumoPainel ? "✓" : ""}
                  </span>
                </button>

                {filtrosAtivos && (
                  <>
                    <span style={filterSheetClearDividerStyle} aria-hidden="true" />

                    <button type="button" onClick={limparFiltros} style={filterSheetClearStyle}>
                      Limpar filtros
                    </button>
                  </>
                )}
              </div>
            </section>
          </div>
        )}

        {obrasComMetricas.length === 0 ? (
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Não tem obra criada
          </p>
        ) : obrasFiltradas.length === 0 ? (
          <section style={emptyMiniBoxStyle}>
            <strong style={emptyMiniTitleStyle}>Nenhuma obra encontrada</strong>
            <span style={emptyMiniTextStyle}>
              Ajuste a busca ou limpe os filtros para voltar a ver suas obras.
            </span>
            <button type="button" onClick={limparFiltros} style={emptyMiniButtonStyle}>
              Limpar filtros
            </button>
          </section>
        ) : (
          <PainelSecao<ObraComMetricas>
            obras={obrasFiltradas}
            isDesktop={isDesktop}
            onAbrirArquivo={abrirArquivoObra}
            onCompartilhar={compartilharObra}
            onExcluirObra={excluirObra}
            Card={ObraPainelCard}
          />
        )}
      </section>
    </main>
  );
}
