"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../../lib/historietasTheme";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import { formatarData } from "../../../lib/utils";
import {
  STATUS_SOLICITACOES,
  normalizarSolicitacao,
  normalizarOperacaoRecuperavel,
  type FiltroStatus,
  type OperacaoRecuperavel,
  type SolicitacaoExclusao,
  type StatusSolicitacaoExclusao,
} from "./lib/admin-exclusoes-conta-normalization-utils";
import {
  STATUS_LABEL,
  corStatus,
  origemTraduzida,
  traduzir,
  type TextoTraduzido,
} from "./lib/admin-exclusoes-conta-text-utils";
import { filtrarSolicitacoesExclusao } from "./lib/admin-exclusoes-conta-filter-utils";
import { calcularTotaisSolicitacoesExclusao } from "./lib/admin-exclusoes-conta-stats-utils";
import { criarLoginHrefAdminExclusoesConta } from "./lib/admin-exclusoes-conta-route-utils";
import { buscarSolicitacoesExclusaoAdmin } from "./loaders/buscar-solicitacoes-exclusao-admin";
import { buscarOperacoesRecuperaveisAdmin } from "./loaders/buscar-operacoes-recuperaveis-admin";
import { atualizarSolicitacaoExclusaoAdmin } from "./actions/atualizar-solicitacao-exclusao-admin";
import { recuperarOperacaoExclusaoAdmin } from "./actions/recuperar-operacao-exclusao-admin";
import {
  adminExclusoesCss,
  badgesStyle,
  badgeStyle,
  cardActionsStyle,
  cardDescriptionPreviewStyle,
  cardHeadingStyle,
  cardMetaStyle,
  cardStyle,
  cardTitleStyle,
  containerStyle,
  contentBoxStyle,
  controlsGridStyle,
  counterStyle,
  detailGridStyle,
  detailItemStyle,
  detailLabelStyle,
  detailsStyle,
  emptyStyle,
  environmentStyle,
  environmentValueStyle,
  errorBannerStyle,
  eyebrowStyle,
  fieldControlStyle,
  fieldLabelStyle,
  fieldStyle,
  filtersStyle,
  finalWarningStyle,
  fullDescriptionStyle,
  headerActionsStyle,
  headerCopyStyle,
  headerStyle,
  listStyle,
  operationIdStyle,
  pageStyle,
  recoveryCardStyle,
  recoveryCardTopStyle,
  recoveryCountStyle,
  recoveryDescriptionStyle,
  recoveryDetailStyle,
  recoveryEmptyStyle,
  recoveryErrorStyle,
  recoveryHeaderStyle,
  recoveryListStyle,
  recoveryMetaGridStyle,
  recoverySectionStyle,
  recoveryTitleStyle,
  resultsHeaderStyle,
  searchStyle,
  secondaryLinkStyle,
  selectFilterStyle,
  sourceBadgeStyle,
  stateCardStyle,
  stateDescriptionStyle,
  statusHelpStyle,
  subtitleStyle,
  successBannerStyle,
  summaryCardStyle,
  summaryGridStyle,
  summaryLabelStyle,
  summaryNumberStyle,
  textareaStyle,
  titleStyle,
  unsavedStyle,
  warningStyle,
} from "./lib/admin-exclusoes-conta-styles";

export default function AdminExclusoesContaPage() {
  const router = useRouter();
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  const [carregando, setCarregando] = useState(true);
  const [acessoNegado, setAcessoNegado] = useState(false);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoExclusao[]>([]);
  const [operacoesRecuperaveis, setOperacoesRecuperaveis] = useState<OperacaoRecuperavel[]>([]);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<FiltroStatus>("todos");
  const [abertaId, setAbertaId] = useState("");
  const [statusRascunho, setStatusRascunho] = useState<
    Record<string, StatusSolicitacaoExclusao>
  >({});
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});
  const [acaoEmAndamento, setAcaoEmAndamento] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const t = useCallback(
    (texto: TextoTraduzido) => traduzir(texto, language),
    [language],
  );

  const carregarSolicitacoes = useCallback(async () => {
    setErro("");

    const { response, data } = await buscarSolicitacoesExclusaoAdmin();

    if (response.status === 401) {
      router.replace(criarLoginHrefAdminExclusoesConta());
      return;
    }

    if (response.status === 403) {
      setAcessoNegado(true);
      setSolicitacoes([]);
      return;
    }

    if (!response.ok || !data?.ok) {
      throw new Error(
        data?.mensagem ||
          t({
            pt: "Não foi possível carregar as solicitações de exclusão.",
            en: "Deletion requests could not be loaded.",
            es: "No se pudieron cargar las solicitudes de eliminación.",
          }),
      );
    }

    const registros = (data.solicitacoes || [])
      .map(normalizarSolicitacao)
      .filter((item): item is SolicitacaoExclusao => Boolean(item));

    setAcessoNegado(false);
    setSolicitacoes(registros);
    setStatusRascunho(
      registros.reduce<Record<string, StatusSolicitacaoExclusao>>(
        (estado, item) => {
          estado[item.id] = item.status;
          return estado;
        },
        {},
      ),
    );
    setObservacoes(
      registros.reduce<Record<string, string>>((estado, item) => {
        estado[item.id] = item.observacaoInterna;
        return estado;
      }, {}),
    );
  }, [router, t]);


  const carregarOperacoesRecuperaveis = useCallback(async () => {
    const { response, data } = await buscarOperacoesRecuperaveisAdmin();

    if (response.status === 401) {
      router.replace(criarLoginHrefAdminExclusoesConta());
      return;
    }

    if (response.status === 403) {
      setAcessoNegado(true);
      setOperacoesRecuperaveis([]);
      return;
    }

    if (!response.ok || !data?.ok) {
      throw new Error(
        data?.mensagem ||
          t({
            pt: "Não foi possível carregar as recuperações pendentes.",
            en: "Pending recoveries could not be loaded.",
            es: "No se pudieron cargar las recuperaciones pendientes.",
          }),
      );
    }

    setOperacoesRecuperaveis(
      (data.operacoes || [])
        .map(normalizarOperacaoRecuperavel)
        .filter((item): item is OperacaoRecuperavel => Boolean(item)),
    );
  }, [router, t]);

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      setCarregando(true);
      setErro("");
      setSucesso("");

      try {
        await Promise.all([carregarSolicitacoes(), carregarOperacoesRecuperaveis()]);
      } catch (error) {
        if (!cancelado) {
          setErro(
            error instanceof Error
              ? error.message
              : t({
                  pt: "Não foi possível carregar as solicitações de exclusão.",
                  en: "Deletion requests could not be loaded.",
                  es: "No se pudieron cargar las solicitudes de eliminación.",
                }),
          );
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    void iniciar();

    return () => {
      cancelado = true;
    };
  }, [carregarOperacoesRecuperaveis, carregarSolicitacoes, t]);

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

  async function salvarSolicitacao(solicitacao: SolicitacaoExclusao) {
    const novoStatus = statusRascunho[solicitacao.id] || solicitacao.status;
    const observacaoInterna = observacoes[solicitacao.id] || "";

    if (observacaoInterna.length > 4000) {
      setErro(
        t({
          pt: "A observação interna pode ter no máximo 4000 caracteres.",
          en: "The internal note can have at most 4000 characters.",
          es: "La observación interna puede tener como máximo 4000 caracteres.",
        }),
      );
      return;
    }

    setAcaoEmAndamento(solicitacao.id);
    setErro("");
    setSucesso("");

    try {
      const { response, data } = await atualizarSolicitacaoExclusaoAdmin({
        id: solicitacao.id,
        status: novoStatus,
        observacaoInterna,
      });

      if (response.status === 401) {
        router.replace(criarLoginHrefAdminExclusoesConta());
        return;
      }

      if (response.status === 403) {
        setAcessoNegado(true);
        return;
      }

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.mensagem ||
            t({
              pt: "Não foi possível atualizar a solicitação.",
              en: "The request could not be updated.",
              es: "No se pudo actualizar la solicitud.",
            }),
        );
      }

      const atualizada = normalizarSolicitacao(data.solicitacao);

      if (!atualizada) {
        throw new Error(
          t({
            pt: "O servidor não retornou a solicitação atualizada.",
            en: "The server did not return the updated request.",
            es: "El servidor no devolvió la solicitud actualizada.",
          }),
        );
      }

      setSolicitacoes((atuais) =>
        atuais.map((item) => (item.id === atualizada.id ? atualizada : item)),
      );
      setStatusRascunho((atuais) => ({
        ...atuais,
        [atualizada.id]: atualizada.status,
      }));
      setObservacoes((atuais) => ({
        ...atuais,
        [atualizada.id]: atualizada.observacaoInterna,
      }));
      setSucesso(
        t({
          pt: "Solicitação atualizada com segurança.",
          en: "Request updated safely.",
          es: "Solicitud actualizada de forma segura.",
        }),
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : t({
              pt: "Não foi possível atualizar a solicitação.",
              en: "The request could not be updated.",
              es: "No se pudo actualizar la solicitud.",
            }),
      );
    } finally {
      setAcaoEmAndamento("");
    }
  }


  async function recuperarOperacao(operacao: OperacaoRecuperavel) {
    const chaveAcao = `operacao:${operacao.id}`;
    setAcaoEmAndamento(chaveAcao);
    setErro("");
    setSucesso("");

    try {
      const { response, data } = await recuperarOperacaoExclusaoAdmin({
        id: operacao.id,
      });

      if (response.status === 401) {
        router.replace(criarLoginHrefAdminExclusoesConta());
        return;
      }

      if (response.status === 403) {
        setAcessoNegado(true);
        return;
      }

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.mensagem ||
            t({
              pt: "Não foi possível retomar esta exclusão.",
              en: "This deletion could not be resumed.",
              es: "No se pudo reanudar esta eliminación.",
            }),
        );
      }

      await carregarOperacoesRecuperaveis();

      setSucesso(
        data.exclusaoConcluida
          ? t({
              pt: "A recuperação foi concluída e a operação foi finalizada.",
              en: "Recovery completed and the operation was finalized.",
              es: "La recuperación se completó y la operación fue finalizada.",
            })
          : t({
              pt: "A recuperação foi executada, mas ainda há acompanhamento pendente.",
              en: "Recovery ran, but follow-up is still pending.",
              es: "La recuperación se ejecutó, pero aún requiere seguimiento.",
            }),
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : t({
              pt: "Não foi possível retomar esta exclusão.",
              en: "This deletion could not be resumed.",
              es: "No se pudo reanudar esta eliminación.",
            }),
      );
    } finally {
      setAcaoEmAndamento("");
    }
  }

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


        <section style={recoverySectionStyle}>
          <div style={recoveryHeaderStyle}>
            <div>
              <span style={eyebrowStyle}>
                {t({
                  pt: "RECUPERAÇÃO OPERACIONAL",
                  en: "OPERATIONAL RECOVERY",
                  es: "RECUPERACIÓN OPERATIVA",
                })}
              </span>
              <h2 style={recoveryTitleStyle}>
                {t({
                  pt: "Exclusões interrompidas",
                  en: "Interrupted deletions",
                  es: "Eliminaciones interrumpidas",
                })}
              </h2>
              <p style={recoveryDescriptionStyle}>
                {t({
                  pt: "Aqui aparecem apenas operações que o servidor considera seguras para recuperação administrativa: exclusões interrompidas na etapa do Auth ou falhas ocorridas depois que o Auth já foi removido.",
                  en: "Only operations the server considers safe for administrative recovery appear here: deletions interrupted during the Auth step or failures after Auth was already removed.",
                  es: "Aquí solo aparecen operaciones que el servidor considera seguras para recuperación administrativa: eliminaciones interrumpidas en la etapa de Auth o fallos después de que Auth ya fue eliminado.",
                })}
              </p>
            </div>
            <strong style={recoveryCountStyle}>{operacoesRecuperaveis.length}</strong>
          </div>

          {operacoesRecuperaveis.length === 0 ? (
            <div style={recoveryEmptyStyle}>
              {t({
                pt: "Nenhuma exclusão precisa de recuperação administrativa agora.",
                en: "No deletion needs administrative recovery right now.",
                es: "Ninguna eliminación necesita recuperación administrativa ahora.",
              })}
            </div>
          ) : (
            <div style={recoveryListStyle}>
              {operacoesRecuperaveis.map((operacao) => {
                const recuperando = acaoEmAndamento === `operacao:${operacao.id}`;
                const bloqueadoPorLock = operacao.lockAtivo && !recuperando;

                return (
                  <article key={operacao.id} style={recoveryCardStyle}>
                    <div style={recoveryCardTopStyle}>
                      <div>
                        <strong>
                          {operacao.status === "excluindo_auth"
                            ? t({
                                pt: "Auth interrompido",
                                en: "Auth interrupted",
                                es: "Auth interrumpido",
                              })
                            : t({
                                pt: "Falha pós-Auth",
                                en: "Post-Auth failure",
                                es: "Fallo posterior a Auth",
                              })}
                        </strong>
                        <code style={operationIdStyle}>{operacao.id}</code>
                      </div>
                      <button
                        type="button"
                        className="admin-delete-primary-button"
                        disabled={
                          bloqueadoPorLock ||
                          recuperando ||
                          Boolean(acaoEmAndamento && !recuperando)
                        }
                        onClick={() => void recuperarOperacao(operacao)}
                        title={
                          bloqueadoPorLock
                            ? t({
                                pt: "Esta exclusão ainda está sendo processada. Atualize a lista após o lock expirar.",
                                en: "This deletion is still being processed. Refresh the list after the lock expires.",
                                es: "Esta eliminación todavía se está procesando. Actualiza la lista después de que expire el bloqueo.",
                              })
                            : undefined
                        }
                      >
                        {recuperando
                          ? t({
                              pt: "Retomando...",
                              en: "Resuming...",
                              es: "Reanudando...",
                            })
                          : bloqueadoPorLock
                            ? t({
                                pt: "Em processamento",
                                en: "Processing",
                                es: "En proceso",
                              })
                            : t({
                                pt: "Retomar recuperação",
                                en: "Resume recovery",
                                es: "Reanudar recuperación",
                              })}
                      </button>
                    </div>

                    <div style={recoveryMetaGridStyle}>
                      <div style={detailItemStyle}>
                        <span style={detailLabelStyle}>
                          {t({ pt: "Atualizada", en: "Updated", es: "Actualizada" })}
                        </span>
                        <strong>{formatarData(operacao.atualizadaEm)}</strong>
                      </div>
                      <div style={detailItemStyle}>
                        <span style={detailLabelStyle}>
                          {t({ pt: "Tentativas Storage", en: "Storage attempts", es: "Intentos Storage" })}
                        </span>
                        <strong>{operacao.tentativasStorage}</strong>
                      </div>
                      <div style={detailItemStyle}>
                        <span style={detailLabelStyle}>
                          {t({ pt: "Tentativas Auth", en: "Auth attempts", es: "Intentos Auth" })}
                        </span>
                        <strong>{operacao.tentativasAuth}</strong>
                      </div>
                      {operacao.lockExpiraEm && (
                        <div style={detailItemStyle}>
                          <span style={detailLabelStyle}>
                            {t({ pt: "Lock expira", en: "Lock expires", es: "Bloqueo expira" })}
                          </span>
                          <strong>{formatarData(operacao.lockExpiraEm)}</strong>
                        </div>
                      )}
                    </div>

                    {operacao.bucketsPendentes.length > 0 && (
                      <div style={recoveryDetailStyle}>
                        <span style={detailLabelStyle}>
                          {t({ pt: "Buckets pendentes", en: "Pending buckets", es: "Buckets pendientes" })}
                        </span>
                        <span>{operacao.bucketsPendentes.join(", ")}</span>
                      </div>
                    )}

                    {operacao.ultimoErroMensagem && (
                      <div style={recoveryErrorStyle}>
                        <strong>
                          {operacao.ultimoErroCodigo ||
                            t({ pt: "Último erro", en: "Last error", es: "Último error" })}
                        </strong>
                        <span>{operacao.ultimoErroMensagem}</span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

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
                <article key={solicitacao.id} style={cardStyle}>
                  <button
                    type="button"
                    className="admin-delete-card-summary"
                    onClick={() =>
                      setAbertaId((atual) =>
                        atual === solicitacao.id ? "" : solicitacao.id,
                      )
                    }
                    aria-expanded={aberta}
                  >
                    <div style={cardHeadingStyle}>
                      <div style={badgesStyle}>
                        <span
                          style={{
                            ...badgeStyle,
                            borderColor: `${corStatus(solicitacao.status)}70`,
                            color: corStatus(solicitacao.status),
                          }}
                        >
                          {t(STATUS_LABEL[solicitacao.status])}
                        </span>
                        <span style={sourceBadgeStyle}>
                          {origemTraduzida(solicitacao.origem, language)}
                        </span>
                      </div>

                      <h2 style={cardTitleStyle}>{solicitacao.email || "—"}</h2>
                      <p style={cardDescriptionPreviewStyle}>
                        {solicitacao.motivo ||
                          t({
                            pt: "Nenhum motivo informado.",
                            en: "No reason provided.",
                            es: "No se informó ningún motivo.",
                          })}
                      </p>
                    </div>

                    <div style={cardMetaStyle}>
                      <span>{formatarData(solicitacao.criadaEm)}</span>
                      <span aria-hidden="true">{aberta ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  {aberta && (
                    <div style={detailsStyle}>
                      <div style={detailGridStyle}>
                        <div style={detailItemStyle}>
                          <span style={detailLabelStyle}>
                            {t({
                              pt: "E-mail",
                              en: "Email",
                              es: "Correo",
                            })}
                          </span>
                          <strong>{solicitacao.email || "—"}</strong>
                        </div>
                        <div style={detailItemStyle}>
                          <span style={detailLabelStyle}>
                            {t({
                              pt: "Origem",
                              en: "Source",
                              es: "Origen",
                            })}
                          </span>
                          <strong>
                            {origemTraduzida(solicitacao.origem, language)}
                          </strong>
                        </div>
                        <div style={detailItemStyle}>
                          <span style={detailLabelStyle}>
                            {t({
                              pt: "Criada em",
                              en: "Created",
                              es: "Creada",
                            })}
                          </span>
                          <strong>{formatarData(solicitacao.criadaEm)}</strong>
                        </div>
                        <div style={detailItemStyle}>
                          <span style={detailLabelStyle}>
                            {t({
                              pt: "Atualizada em",
                              en: "Updated",
                              es: "Actualizada",
                            })}
                          </span>
                          <strong>{formatarData(solicitacao.atualizadaEm)}</strong>
                        </div>
                        {solicitacao.processadaEm && (
                          <div style={detailItemStyle}>
                            <span style={detailLabelStyle}>
                              {t({
                                pt: "Processada em",
                                en: "Processed",
                                es: "Procesada",
                              })}
                            </span>
                            <strong>
                              {formatarData(solicitacao.processadaEm)}
                            </strong>
                          </div>
                        )}
                      </div>

                      <section style={contentBoxStyle}>
                        <span style={detailLabelStyle}>
                          {t({
                            pt: "Motivo informado",
                            en: "Provided reason",
                            es: "Motivo informado",
                          })}
                        </span>
                        <p style={fullDescriptionStyle}>
                          {solicitacao.motivo ||
                            t({
                              pt: "Nenhum motivo informado.",
                              en: "No reason provided.",
                              es: "No se informó ningún motivo.",
                            })}
                        </p>
                      </section>

                      {solicitacao.userAgent && (
                        <section style={environmentStyle}>
                          <span style={detailLabelStyle}>User-Agent</span>
                          <span style={environmentValueStyle}>
                            {solicitacao.userAgent}
                          </span>
                        </section>
                      )}

                      <div style={controlsGridStyle}>
                        <label style={fieldStyle}>
                          <span style={fieldLabelStyle}>
                            {t({
                              pt: "Status",
                              en: "Status",
                              es: "Estado",
                            })}
                          </span>
                          <select
                            value={statusAtual}
                            disabled={salvando}
                            onChange={(event) =>
                              setStatusRascunho((atuais) => ({
                                ...atuais,
                                [solicitacao.id]: event.target
                                  .value as StatusSolicitacaoExclusao,
                              }))
                            }
                            style={fieldControlStyle}
                          >
                            {STATUS_SOLICITACOES.map((status) => (
                              <option key={status} value={status}>
                                {t(STATUS_LABEL[status])}
                              </option>
                            ))}
                          </select>
                        </label>

                        <div style={statusHelpStyle}>
                          <strong>
                            {t({
                              pt: "Fluxo recomendado",
                              en: "Recommended flow",
                              es: "Flujo recomendado",
                            })}
                          </strong>
                          <span>
                            {t({
                              pt: "Pendente → Verificando identidade → Concluída. Use Recusada ou Cancelada somente quando houver motivo registrado.",
                              en: "Pending → Verifying identity → Completed. Use Rejected or Canceled only when the reason is documented.",
                              es: "Pendiente → Verificando identidad → Completada. Usa Rechazada o Cancelada solo cuando el motivo esté registrado.",
                            })}
                          </span>
                        </div>
                      </div>

                      {statusAtual === "concluida" &&
                        solicitacao.status !== "concluida" && (
                          <div style={finalWarningStyle}>
                            <strong>
                              {t({
                                pt: "Atenção",
                                en: "Warning",
                                es: "Atención",
                              })}
                            </strong>
                            <span>
                              {t({
                                pt: "Você está prestes a registrar este pedido como concluído. Confirme antes que a identidade foi verificada e que a exclusão real já foi executada.",
                                en: "You are about to record this request as completed. First confirm that identity was verified and the actual deletion was already carried out.",
                                es: "Estás a punto de registrar esta solicitud como completada. Confirma antes que la identidad fue verificada y que la eliminación real ya se realizó.",
                              })}
                            </span>
                          </div>
                        )}

                      <label style={fieldStyle}>
                        <span style={fieldLabelStyle}>
                          {t({
                            pt: "Observação interna",
                            en: "Internal note",
                            es: "Observación interna",
                          })}
                        </span>
                        <textarea
                          value={observacaoAtual}
                          disabled={salvando}
                          onChange={(event) =>
                            setObservacoes((atuais) => ({
                              ...atuais,
                              [solicitacao.id]: event.target.value,
                            }))
                          }
                          placeholder={t({
                            pt: "Registre a verificação de identidade, contatos realizados e o resultado do processamento...",
                            en: "Record identity verification, contacts made, and the processing outcome...",
                            es: "Registra la verificación de identidad, los contactos realizados y el resultado del procesamiento...",
                          })}
                          maxLength={4000}
                          rows={6}
                          style={textareaStyle}
                        />
                        <span style={counterStyle}>
                          {observacaoAtual.length}/4000
                        </span>
                      </label>

                      <div style={cardActionsStyle}>
                        {alterado && (
                          <span style={unsavedStyle}>
                            {t({
                              pt: "Alterações não salvas",
                              en: "Unsaved changes",
                              es: "Cambios sin guardar",
                            })}
                          </span>
                        )}
                        <button
                          type="button"
                          className="admin-delete-primary-button"
                          disabled={salvando || !alterado}
                          onClick={() => void salvarSolicitacao(solicitacao)}
                        >
                          {salvando
                            ? t({
                                pt: "Salvando...",
                                en: "Saving...",
                                es: "Guardando...",
                              })
                            : t({
                                pt: "Salvar alterações",
                                en: "Save changes",
                                es: "Guardar cambios",
                              })}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
