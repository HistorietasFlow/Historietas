"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../../lib/historietasTheme";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import {
  STATUS_LABEL,
  traduzir,
  type TextoTraduzido,
} from "./lib/admin-problemas-tecnicos-text-utils";
import { useAdminProblemasTecnicosActions } from "./hooks/use-admin-problemas-tecnicos-actions";
import { useAdminProblemasTecnicosInitialData } from "./hooks/use-admin-problemas-tecnicos-initial-data";
import { useAdminProblemasTecnicosActionState } from "./hooks/use-admin-problemas-tecnicos-action-state";
import { AdminProblemasTecnicosTicketCard } from "./components/admin-problemas-tecnicos-ticket-card";
import { calcularTotaisProblemasTecnicos } from "./lib/admin-problemas-tecnicos-stats-utils";
import {
  adminProblemasCss,
  containerStyle,
  emptyStyle,
  errorBannerStyle,
  errorStyle,
  filtersStyle,
  headerActionsStyle,
  headerCopyStyle,
  headerStyle,
  listStyle,
  pageStyle,
  resultsHeaderStyle,
  searchStyle,
  secondaryLinkStyle,
  selectFilterStyle,
  stateCardStyle,
  subtitleStyle,
  successBannerStyle,
  summaryCardStyle,
  summaryGridStyle,
  summaryLabelStyle,
  summaryNumberStyle,
  titleStyle,
  eyebrowStyle,
} from "./lib/admin-problemas-tecnicos-styles";
import {
  STATUS_PROBLEMAS,
  type FiltroStatusProblema,
} from "./lib/admin-problemas-tecnicos-normalization-utils";
import { useAdminProblemasTecnicosFilters } from "./hooks/use-admin-problemas-tecnicos-filters";

export default function AdminProblemasTecnicosPage() {
  const router = useRouter();
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  const {
    chamadoAbertoId,
    acaoEmAndamento,
    setAcaoEmAndamento,
    erro,
    setErro,
    sucesso,
    setSucesso,
    alternarChamadoAberto,
    recarregarProblemasTecnicos,
  } = useAdminProblemasTecnicosActionState();

  const t = useCallback(
    (texto: TextoTraduzido) => traduzir(texto, language),
    [language],
  );

  const {
    carregando,
    usuarioId,
    ehAdmin,
    problemas,
    setProblemas,
    nomesUsuarios,
    observacoes,
    setObservacoes,
    carregarProblemas,
  } = useAdminProblemasTecnicosInitialData({
    router,
    t,
    setErro,
    setSucesso,
  });

  const { atualizarChamado } = useAdminProblemasTecnicosActions({
    usuarioId,
    ehAdmin,
    t,
    setProblemas,
    setObservacoes,
    setAcaoEmAndamento,
    setErro,
    setSucesso,
  });

  const {
    busca,
    setBusca,
    statusFiltro,
    setStatusFiltro,
    problemasFiltrados,
  } = useAdminProblemasTecnicosFilters({
    problemas,
    nomesUsuarios,
    language,
  });

  const totais = useMemo(
    () => calcularTotaisProblemasTecnicos(problemas),
    [problemas],
  );

  if (carregando) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${adminProblemasCss}`}</style>
        <section style={containerStyle}>
          <div style={stateCardStyle}>
            <span className="admin-tech-loader" aria-hidden="true" />
            <strong>
              {t({
                pt: "Carregando problemas técnicos...",
                en: "Loading technical issues...",
                es: "Cargando problemas técnicos...",
              })}
            </strong>
          </div>
        </section>
      </main>
    );
  }

  if (!usuarioId) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${adminProblemasCss}`}</style>
        <section style={containerStyle}>
          <div style={stateCardStyle}>
            <strong>
              {t({
                pt: "Área restrita",
                en: "Restricted area",
                es: "Área restringida",
              })}
            </strong>
            {erro && <span style={errorStyle}>{erro}</span>}
          </div>
        </section>
      </main>
    );
  }

  if (!ehAdmin) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${adminProblemasCss}`}</style>
        <section style={containerStyle}>
          <div style={stateCardStyle}>
            <strong>
              {t({
                pt: "Acesso negado",
                en: "Access denied",
                es: "Acceso denegado",
              })}
            </strong>
            <Link href="/" style={secondaryLinkStyle}>
              {t({
                pt: "Voltar ao início",
                en: "Back to home",
                es: "Volver al inicio",
              })}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      style={pageThemeStyle}
      data-historietas-admin-problemas-root="true"
    >
      <style>{`${historietasThemeCss}${adminProblemasCss}`}</style>

      <section style={containerStyle}>
        <header style={headerStyle}>
          <div style={headerCopyStyle}>
            <span style={eyebrowStyle}>
              {t({
                pt: "SUPORTE",
                en: "SUPPORT",
                es: "SOPORTE",
              })}
            </span>
            <h1 style={titleStyle}>
              {t({
                pt: "Problemas técnicos",
                en: "Technical issues",
                es: "Problemas técnicos",
              })}
            </h1>
            <p style={subtitleStyle}>
              {t({
                pt: "Chamados de falhas do site, separados das denúncias por violação das regras.",
                en: "Website issue tickets kept separate from reports about rule violations.",
                es: "Solicitudes por fallas del sitio, separadas de las denuncias por infracciones.",
              })}
            </p>
          </div>

          <div style={headerActionsStyle}>
            <Link href="/admin/comunidade" style={secondaryLinkStyle}>
              {t({
                pt: "Denúncias",
                en: "Reports",
                es: "Denuncias",
              })}
            </Link>
            <button
              type="button"
              className="admin-tech-primary-button"
              disabled={acaoEmAndamento === "recarregar"}
              onClick={() =>
                void recarregarProblemasTecnicos(carregarProblemas)
              }
            >
              {acaoEmAndamento === "recarregar"
                ? t({
                    pt: "Atualizando...",
                    en: "Refreshing...",
                    es: "Actualizando...",
                  })
                : t({
                    pt: "Atualizar",
                    en: "Refresh",
                    es: "Actualizar",
                  })}
            </button>
          </div>
        </header>

        <div style={summaryGridStyle}>
          <div style={summaryCardStyle}>
            <strong style={summaryNumberStyle}>{totais.total}</strong>
            <span style={summaryLabelStyle}>
              {t({ pt: "Total", en: "Total", es: "Total" })}
            </span>
          </div>
          <div style={summaryCardStyle}>
            <strong style={summaryNumberStyle}>{totais.abertos}</strong>
            <span style={summaryLabelStyle}>
              {t({ pt: "Abertos", en: "Open", es: "Abiertos" })}
            </span>
          </div>
          <div style={summaryCardStyle}>
            <strong style={summaryNumberStyle}>{totais.analise}</strong>
            <span style={summaryLabelStyle}>
              {t({
                pt: "Em análise",
                en: "Under review",
                es: "En revisión",
              })}
            </span>
          </div>
          <div style={summaryCardStyle}>
            <strong style={summaryNumberStyle}>{totais.aguardando}</strong>
            <span style={summaryLabelStyle}>
              {t({
                pt: "Aguardando",
                en: "Waiting",
                es: "Esperando",
              })}
            </span>
          </div>
          <div style={summaryCardStyle}>
            <strong style={summaryNumberStyle}>{totais.urgentes}</strong>
            <span style={summaryLabelStyle}>
              {t({
                pt: "Urgentes",
                en: "Urgent",
                es: "Urgentes",
              })}
            </span>
          </div>
        </div>

        <section style={filtersStyle}>
          <label style={searchStyle}>
            <span aria-hidden="true">⌕</span>
            <input
              className="admin-tech-search-input"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              aria-label={t({
                pt: "Buscar chamados técnicos",
                en: "Search technical tickets",
                es: "Buscar solicitudes técnicas",
              })}
              placeholder={t({
                pt: "Buscar por título, descrição, usuário ou e-mail...",
                en: "Search by title, description, user, or email...",
                es: "Buscar por título, descripción, usuario o correo...",
              })}
              maxLength={140}
            />
          </label>

          <select
            value={statusFiltro}
            onChange={(event) =>
              setStatusFiltro(event.target.value as FiltroStatusProblema)
            }
            style={selectFilterStyle}
            aria-label={t({
              pt: "Filtrar por status",
              en: "Filter by status",
              es: "Filtrar por estado",
            })}
          >
            <option value="todos">
              {t({
                pt: "Todos os status",
                en: "All statuses",
                es: "Todos los estados",
              })}
            </option>
            {STATUS_PROBLEMAS.map((status) => (
              <option key={status} value={status}>
                {t(STATUS_LABEL[status])}
              </option>
            ))}
          </select>
        </section>

        {erro && <div style={errorBannerStyle}>{erro}</div>}
        {sucesso && <div style={successBannerStyle}>{sucesso}</div>}

        <div style={resultsHeaderStyle}>
          <strong>
            {problemasFiltrados.length}{" "}
            {problemasFiltrados.length === 1
              ? t({
                  pt: "chamado encontrado",
                  en: "ticket found",
                  es: "solicitud encontrada",
                })
              : t({
                  pt: "chamados encontrados",
                  en: "tickets found",
                  es: "solicitudes encontradas",
                })}
          </strong>
        </div>

        {problemasFiltrados.length === 0 ? (
          <div style={emptyStyle}>
            <strong>
              {t({
                pt: "Nenhum problema técnico encontrado",
                en: "No technical issue found",
                es: "No se encontró ningún problema técnico",
              })}
            </strong>
            <span>
              {t({
                pt: "Altere a busca ou o filtro para ver outros chamados.",
                en: "Change the search or filter to view other tickets.",
                es: "Cambia la búsqueda o el filtro para ver otras solicitudes.",
              })}
            </span>
          </div>
        ) : (
          <div style={listStyle}>
            {problemasFiltrados.map((problema) => (
              <AdminProblemasTecnicosTicketCard
                key={problema.id}
                problema={problema}
                chamadoAbertoId={chamadoAbertoId}
                acaoEmAndamento={acaoEmAndamento}
                nomesUsuarios={nomesUsuarios}
                observacoes={observacoes}
                setObservacoes={setObservacoes}
                alternarChamadoAberto={alternarChamadoAberto}
                atualizarChamado={atualizarChamado}
                t={t}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
