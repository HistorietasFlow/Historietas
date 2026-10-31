"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../../lib/historietasTheme";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import {
  STATUS_SOLICITACOES,
  type FiltroStatus,
} from "./lib/admin-exclusoes-conta-normalization-utils";
import {
  STATUS_LABEL,
  traduzir,
  type TextoTraduzido,
} from "./lib/admin-exclusoes-conta-text-utils";
import { filtrarSolicitacoesExclusao } from "./lib/admin-exclusoes-conta-filter-utils";
import { calcularTotaisSolicitacoesExclusao } from "./lib/admin-exclusoes-conta-stats-utils";
import { useAdminExclusoesContaInitialData } from "./hooks/use-admin-exclusoes-conta-initial-data";
import { useAdminExclusoesContaActions } from "./hooks/use-admin-exclusoes-conta-actions";
import { AdminExclusoesContaRecoverySection } from "./components/admin-exclusoes-conta-recovery-section";
import { AdminExclusoesContaRequestCard } from "./components/admin-exclusoes-conta-request-card";
import {
  adminExclusoesCss,
  containerStyle,
  emptyStyle,
  errorBannerStyle,
  eyebrowStyle,
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
  stateDescriptionStyle,
  subtitleStyle,
  successBannerStyle,
  summaryCardStyle,
  summaryGridStyle,
  summaryLabelStyle,
  summaryNumberStyle,
  titleStyle,
  warningStyle,
} from "./lib/admin-exclusoes-conta-styles";

export default function AdminExclusoesContaPage() {
  const router = useRouter();
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<FiltroStatus>("todos");
  const [abertaId, setAbertaId] = useState("");
  const [acaoEmAndamento, setAcaoEmAndamento] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const t = useCallback(
    (texto: TextoTraduzido) => traduzir(texto, language),
    [language],
  );

  const {
    carregando,
    acessoNegado,
    setAcessoNegado,
    solicitacoes,
    setSolicitacoes,
    operacoesRecuperaveis,
    statusRascunho,
    setStatusRascunho,
    observacoes,
    setObservacoes,
    carregarSolicitacoes,
    carregarOperacoesRecuperaveis,
  } = useAdminExclusoesContaInitialData({
    router,
    t,
    setErro,
    setSucesso,
  });

  const solicitacoesFiltradas = useMemo(
    () =>
      filtrarSolicitacoesExclusao({
        solicitacoes,
        busca,
        statusFiltro,
        language,
      }),
    [busca, language, solicitacoes, statusFiltro],
  );

  const totais = useMemo(
    () => calcularTotaisSolicitacoesExclusao(solicitacoes),
    [solicitacoes],
  );

  const { salvarSolicitacao, recuperarOperacao } =
    useAdminExclusoesContaActions({
      router,
      t,
      statusRascunho,
      observacoes,
      carregarOperacoesRecuperaveis,
      setAcessoNegado,
      setSolicitacoes,
      setStatusRascunho,
      setObservacoes,
      setAcaoEmAndamento,
      setErro,
      setSucesso,
    });

  if (carregando) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${adminExclusoesCss}`}</style>
        <section style={containerStyle}>
          <div style={stateCardStyle}>
            <span className="admin-delete-loader" aria-hidden="true" />
            <strong>
              {t({
                pt: "Carregando solicitações de exclusão...",
                en: "Loading deletion requests...",
                es: "Cargando solicitudes de eliminación...",
              })}
            </strong>
          </div>
        </section>
      </main>
    );
  }

  if (acessoNegado) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${adminExclusoesCss}`}</style>
        <section style={containerStyle}>
          <div style={stateCardStyle}>
            <strong>
              {t({
                pt: "Acesso negado",
                en: "Access denied",
                es: "Acceso denegado",
              })}
            </strong>
            <span style={stateDescriptionStyle}>
              {t({
                pt: "Esta fila contém dados privados e está disponível apenas para administradores.",
                en: "This queue contains private data and is available only to administrators.",
                es: "Esta cola contiene datos privados y está disponible solo para administradores.",
              })}
            </span>
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
      data-historietas-admin-exclusoes-root="true"
    >
      <style>{`${historietasThemeCss}${adminExclusoesCss}`}</style>

      <section style={containerStyle}>
        <header style={headerStyle}>
          <div style={headerCopyStyle}>
            <span style={eyebrowStyle}>
              {t({
                pt: "PRIVACIDADE",
                en: "PRIVACY",
                es: "PRIVACIDAD",
              })}
            </span>
            <h1 style={titleStyle}>
              {t({
                pt: "Exclusões de conta",
                en: "Account deletions",
                es: "Eliminaciones de cuenta",
              })}
            </h1>
            <p style={subtitleStyle}>
              {t({
                pt: "Fila privada para analisar pedidos enviados por usuários que não conseguem excluir a própria conta pela área autenticada.",
                en: "Private queue for reviewing requests from users who cannot delete their own account from the authenticated area.",
                es: "Cola privada para revisar solicitudes de usuarios que no pueden eliminar su propia cuenta desde el área autenticada.",
              })}
            </p>
          </div>

          <div style={headerActionsStyle}>
            <Link href="/admin/problemas-tecnicos" style={secondaryLinkStyle}>
              {t({
                pt: "Problemas técnicos",
                en: "Technical issues",
                es: "Problemas técnicos",
              })}
            </Link>
            <Link href="/admin/comunidade" style={secondaryLinkStyle}>
              {t({
                pt: "Denúncias",
                en: "Reports",
                es: "Denuncias",
              })}
            </Link>
            <button
              type="button"
              className="admin-delete-primary-button"
              disabled={acaoEmAndamento === "recarregar"}
              onClick={() => {
                setAcaoEmAndamento("recarregar");
                setErro("");
                setSucesso("");
                void Promise.all([
                  carregarSolicitacoes(),
                  carregarOperacoesRecuperaveis(),
                ])
                  .catch((error) =>
                    setErro(
                      error instanceof Error
                        ? error.message
                        : t({
                            pt: "Não foi possível atualizar a fila.",
                            en: "The queue could not be refreshed.",
                            es: "No se pudo actualizar la cola.",
                          }),
                    ),
                  )
                  .finally(() => setAcaoEmAndamento(""));
              }}
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

        <div style={warningStyle}>
          <strong>
            {t({
              pt: "Importante antes de concluir",
              en: "Important before completing",
              es: "Importante antes de completar",
            })}
          </strong>
          <span>
            {t({
              pt: "Esta tela gerencia a fila e o registro do atendimento. Alterar o status para “Concluída” não apaga a conta por si só. Verifique a identidade do solicitante e só finalize o pedido depois que a exclusão real da conta e dos dados aplicáveis tiver sido executada.",
              en: "This screen manages the queue and service record. Changing the status to “Completed” does not delete the account by itself. Verify the requester’s identity and only close the request after the actual account and applicable data deletion has been carried out.",
              es: "Esta pantalla gestiona la cola y el registro de atención. Cambiar el estado a “Completada” no elimina la cuenta por sí solo. Verifica la identidad del solicitante y finaliza la solicitud solo después de que se haya realizado la eliminación real de la cuenta y de los datos aplicables.",
            })}
          </span>
        </div>


        <AdminExclusoesContaRecoverySection
          operacoesRecuperaveis={operacoesRecuperaveis}
          acaoEmAndamento={acaoEmAndamento}
          t={t}
          onRecuperarOperacao={(operacao) => void recuperarOperacao(operacao)}
        />

        <div style={summaryGridStyle}>
          <div style={summaryCardStyle}>
            <strong style={summaryNumberStyle}>{totais.total}</strong>
            <span style={summaryLabelStyle}>
              {t({ pt: "Total", en: "Total", es: "Total" })}
            </span>
          </div>
          <div style={summaryCardStyle}>
            <strong style={summaryNumberStyle}>{totais.pendentes}</strong>
            <span style={summaryLabelStyle}>
              {t({ pt: "Pendentes", en: "Pending", es: "Pendientes" })}
            </span>
          </div>
          <div style={summaryCardStyle}>
            <strong style={summaryNumberStyle}>{totais.verificando}</strong>
            <span style={summaryLabelStyle}>
              {t({
                pt: "Verificando",
                en: "Verifying",
                es: "Verificando",
              })}
            </span>
          </div>
          <div style={summaryCardStyle}>
            <strong style={summaryNumberStyle}>{totais.concluidas}</strong>
            <span style={summaryLabelStyle}>
              {t({
                pt: "Concluídas",
                en: "Completed",
                es: "Completadas",
              })}
            </span>
          </div>
          <div style={summaryCardStyle}>
            <strong style={summaryNumberStyle}>{totais.encerradas}</strong>
            <span style={summaryLabelStyle}>
              {t({
                pt: "Recusadas/canceladas",
                en: "Rejected/canceled",
                es: "Rechazadas/canceladas",
              })}
            </span>
          </div>
        </div>

        <section style={filtersStyle}>
          <label style={searchStyle}>
            <span aria-hidden="true">⌕</span>
            <input
              className="admin-delete-search-input"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              aria-label={t({
                pt: "Buscar solicitações de exclusão",
                en: "Search deletion requests",
                es: "Buscar solicitudes de eliminación",
              })}
              placeholder={t({
                pt: "Buscar por e-mail, motivo, origem ou observação...",
                en: "Search by email, reason, source, or note...",
                es: "Buscar por correo, motivo, origen u observación...",
              })}
              maxLength={160}
            />
          </label>

          <select
            value={statusFiltro}
            onChange={(event) =>
              setStatusFiltro(event.target.value as FiltroStatus)
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
            {STATUS_SOLICITACOES.map((status) => (
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
            {solicitacoesFiltradas.length}{" "}
            {solicitacoesFiltradas.length === 1
              ? t({
                  pt: "solicitação encontrada",
                  en: "request found",
                  es: "solicitud encontrada",
                })
              : t({
                  pt: "solicitações encontradas",
                  en: "requests found",
                  es: "solicitudes encontradas",
                })}
          </strong>
        </div>

        {solicitacoesFiltradas.length === 0 ? (
          <div style={emptyStyle}>
            <strong>
              {t({
                pt: "Nenhuma solicitação encontrada",
                en: "No request found",
                es: "No se encontró ninguna solicitud",
              })}
            </strong>
            <span>
              {t({
                pt: "Altere a busca ou o filtro para visualizar outros pedidos.",
                en: "Change the search or filter to view other requests.",
                es: "Cambia la búsqueda o el filtro para ver otras solicitudes.",
              })}
            </span>
          </div>
        ) : (
          <div style={listStyle}>
            {solicitacoesFiltradas.map((solicitacao) => {
              const aberta = abertaId === solicitacao.id;
              const salvando = acaoEmAndamento === solicitacao.id;
              const statusAtual =
                statusRascunho[solicitacao.id] || solicitacao.status;
              const observacaoAtual =
                observacoes[solicitacao.id] || "";
              const alterado =
                statusAtual !== solicitacao.status ||
                observacaoAtual.trim() !== solicitacao.observacaoInterna.trim();

              return (
                <AdminExclusoesContaRequestCard
                  key={solicitacao.id}
                  solicitacao={solicitacao}
                  aberta={aberta}
                  salvando={salvando}
                  statusAtual={statusAtual}
                  observacaoAtual={observacaoAtual}
                  alterado={alterado}
                  language={language}
                  t={t}
                  onAlternarAbertura={() =>
                    setAbertaId((atual) =>
                      atual === solicitacao.id ? "" : solicitacao.id,
                    )
                  }
                  onAlterarStatus={(status) =>
                    setStatusRascunho((atuais) => ({
                      ...atuais,
                      [solicitacao.id]: status,
                    }))
                  }
                  onAlterarObservacao={(observacao) =>
                    setObservacoes((atuais) => ({
                      ...atuais,
                      [solicitacao.id]: observacao,
                    }))
                  }
                  onSalvar={() => void salvarSolicitacao(solicitacao)}
                />
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
