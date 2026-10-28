"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { TablesUpdate } from "../../../lib/supabase/database.types";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../../lib/historietasTheme";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import { formatarData } from "../../../lib/utils";
import {
  CATEGORIA_LABEL,
  PRIORIDADE_LABEL,
  STATUS_LABEL,
  corPrioridade,
  corStatus,
  traduzir,
  type TextoTraduzido,
} from "./lib/admin-problemas-tecnicos-text-utils";
import { criarLoginHrefAdminProblemasTecnicos } from "./lib/admin-problemas-tecnicos-route-utils";
import { criarMensagemErro } from "./lib/admin-problemas-tecnicos-error-utils";
import { verificarAdministradorProblemasTecnicos } from "./loaders/verificar-administrador-problemas-tecnicos";
import { buscarProblemasTecnicosAdmin } from "./loaders/buscar-problemas-tecnicos-admin";
import { buscarPerfisProblemasTecnicosAdmin } from "./loaders/buscar-perfis-problemas-tecnicos-admin";
import { atualizarProblemaTecnicoAdmin } from "./actions/atualizar-problema-tecnico-admin";
import { AdminProblemasTecnicosTicketSummary } from "./components/admin-problemas-tecnicos-ticket-summary";
import { filtrarProblemasTecnicos } from "./lib/admin-problemas-tecnicos-filter-utils";
import { calcularTotaisProblemasTecnicos } from "./lib/admin-problemas-tecnicos-stats-utils";
import {
  adminProblemasCss,
  badgeStyle,
  badgesStyle,
  cardActionsStyle,
  cardDescriptionPreviewStyle,
  cardHeadingStyle,
  cardMetaStyle,
  cardStyle,
  cardTitleStyle,
  categoryBadgeStyle,
  containerStyle,
  contentBoxStyle,
  controlsGridStyle,
  counterStyle,
  detailGridStyle,
  detailItemStyle,
  detailLabelStyle,
  detailsStyle,
  emptyStyle,
  environmentRowStyle,
  environmentStyle,
  environmentValueLinkStyle,
  environmentValueStyle,
  errorBannerStyle,
  errorStyle,
  fieldControlStyle,
  fieldLabelStyle,
  fieldStyle,
  filtersStyle,
  fullDescriptionStyle,
  headerActionsStyle,
  headerCopyStyle,
  headerStyle,
  lastReviewStyle,
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
  textareaStyle,
  titleStyle,
  eyebrowStyle,
} from "./lib/admin-problemas-tecnicos-styles";
import {
  PRIORIDADES_PROBLEMAS,
  STATUS_PROBLEMAS,
  normalizarCategoria,
  normalizarPrioridade,
  normalizarStatus,
  type FiltroStatusProblema,
  type PrioridadeProblemaTecnico,
  type ProblemaTecnico,
  type StatusProblemaTecnico,
} from "./lib/admin-problemas-tecnicos-normalization-utils";

export default function AdminProblemasTecnicosPage() {
  const router = useRouter();
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  const [carregando, setCarregando] = useState(true);
  const [usuarioId, setUsuarioId] = useState("");
  const [ehAdmin, setEhAdmin] = useState(false);
  const [problemas, setProblemas] = useState<ProblemaTecnico[]>([]);
  const [nomesUsuarios, setNomesUsuarios] = useState<Record<string, string>>({});
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] =
    useState<FiltroStatusProblema>("todos");
  const [chamadoAbertoId, setChamadoAbertoId] = useState("");
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});
  const [acaoEmAndamento, setAcaoEmAndamento] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const t = useCallback(
    (texto: TextoTraduzido) => traduzir(texto, language),
    [language],
  );

  const carregarNomes = useCallback(async (userIds: string[]) => {
    const ids = Array.from(
      new Set(userIds.map((id) => id.trim()).filter(Boolean)),
    );

    if (ids.length === 0) {
      setNomesUsuarios({});
      return;
    }

    const { porUserId, porId } =
      await buscarPerfisProblemasTecnicosAdmin(ids);

    const perfis = [
      ...(porUserId.error
        ? []
        : (porUserId.data || [])),
      ...(porId.error
        ? []
        : (porId.data || [])),
    ];
    const mapa: Record<string, string> = {};

    perfis.forEach((perfil) => {
      const nome =
        perfil.nome?.trim() ||
        (perfil.username?.trim()
          ? `@${perfil.username.trim().replace(/^@+/, "")}`
          : "") ||
        t({
          pt: "Usuário",
          en: "User",
          es: "Usuario",
        });

      if (perfil.user_id?.trim()) mapa[perfil.user_id.trim()] = nome;
      if (perfil.id?.trim()) mapa[perfil.id.trim()] = nome;
    });

    setNomesUsuarios(mapa);
  }, [t]);

  const carregarProblemas = useCallback(async () => {
    setErro("");

    const { data, error } = await buscarProblemasTecnicosAdmin();

    if (error) {
      throw error;
    }

    const registros = (data || []).map(
      (registro): ProblemaTecnico => ({
        id: String(registro.id || ""),
        userId: String(registro.user_id || ""),
        emailContato: String(registro.email_contato || ""),
        categoria: normalizarCategoria(registro.categoria),
        titulo: String(registro.titulo || ""),
        descricao: String(registro.descricao || ""),
        paginaUrl: String(registro.pagina_url || ""),
        navegador: String(registro.navegador || ""),
        dispositivo: String(registro.dispositivo || ""),
        status: normalizarStatus(registro.status),
        prioridade: normalizarPrioridade(registro.prioridade),
        observacaoAdmin: String(registro.observacao_admin || ""),
        analisadoPor: String(registro.analisado_por || ""),
        analisadoEm: String(registro.analisado_em || ""),
        criadoEm: String(registro.criado_em || ""),
        atualizadoEm: String(registro.atualizado_em || ""),
      }),
    );

    setProblemas(registros);
    setObservacoes(
      registros.reduce<Record<string, string>>((estado, problema) => {
        estado[problema.id] = problema.observacaoAdmin;
        return estado;
      }, {}),
    );
    await carregarNomes(registros.map((problema) => problema.userId));
  }, [carregarNomes]);

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      setCarregando(true);
      setErro("");
      setSucesso("");

      try {
        const { data: usuarioResposta, error: usuarioErro } =
          await supabase.auth.getUser();

        if (usuarioErro) {
          throw usuarioErro;
        }

        const usuario = usuarioResposta.user || null;

        if (!usuario) {
          if (!cancelado) {
            setUsuarioId("");
            setEhAdmin(false);
            router.replace(criarLoginHrefAdminProblemasTecnicos());
          }
          return;
        }

        const adminConfirmado =
          await verificarAdministradorProblemasTecnicos();

        if (cancelado) return;

        setUsuarioId(usuario.id);
        setEhAdmin(adminConfirmado);

        if (adminConfirmado) {
          await carregarProblemas();
        }
      } catch (error) {
        if (!cancelado) {
          setErro(criarMensagemErro("Erro ao carregar problemas técnicos", error));
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
  }, [carregarProblemas, router]);

  const problemasFiltrados = useMemo(
    () =>
      filtrarProblemasTecnicos({
        problemas,
        busca,
        statusFiltro,
        nomesUsuarios,
        language,
      }),
    [busca, language, nomesUsuarios, problemas, statusFiltro],
  );

  const totais = useMemo(
    () => calcularTotaisProblemasTecnicos(problemas),
    [problemas],
  );

  async function atualizarChamado(
    problema: ProblemaTecnico,
    alteracoes: Partial<
      Pick<
        ProblemaTecnico,
        "status" | "prioridade" | "observacaoAdmin"
      >
    >,
    mensagemSucesso: string,
  ) {
    if (!usuarioId || !ehAdmin) {
      setErro(
        t({
          pt: "Apenas administradores podem atualizar chamados técnicos.",
          en: "Only administrators can update technical tickets.",
          es: "Solo los administradores pueden actualizar solicitudes técnicas.",
        }),
      );
      return;
    }

    setAcaoEmAndamento(problema.id);
    setErro("");
    setSucesso("");

    try {
      const payload: TablesUpdate<"problemas_tecnicos"> = {};

      if (alteracoes.status) payload.status = alteracoes.status;
      if (alteracoes.prioridade) payload.prioridade = alteracoes.prioridade;
      if (typeof alteracoes.observacaoAdmin === "string") {
        payload.observacao_admin = alteracoes.observacaoAdmin.trim();
      }

      const { data, error } = await atualizarProblemaTecnicoAdmin({
        id: problema.id,
        payload,
      });

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("O chamado não foi encontrado ou não pôde ser atualizado.");
      }

      const atualizado = data;

      setProblemas((atuais) =>
        atuais.map((item) =>
          item.id === problema.id
            ? {
                ...item,
                status: normalizarStatus(atualizado.status),
                prioridade: normalizarPrioridade(atualizado.prioridade),
                observacaoAdmin: String(atualizado.observacao_admin || ""),
                analisadoPor: String(atualizado.analisado_por || ""),
                analisadoEm: String(atualizado.analisado_em || ""),
                atualizadoEm: String(atualizado.atualizado_em || ""),
              }
            : item,
        ),
      );
      setObservacoes((atuais) => ({
        ...atuais,
        [problema.id]: String(atualizado.observacao_admin || ""),
      }));
      setSucesso(mensagemSucesso);
    } catch (error) {
      setErro(criarMensagemErro("Erro ao atualizar chamado técnico", error));
    } finally {
      setAcaoEmAndamento("");
    }
  }

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
              onClick={() => {
                setAcaoEmAndamento("recarregar");
                setErro("");
                setSucesso("");
                void carregarProblemas()
                  .catch((error) =>
                    setErro(
                      criarMensagemErro(
                        "Erro ao atualizar problemas técnicos",
                        error,
                      ),
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
            {problemasFiltrados.map((problema) => {
              const aberto = chamadoAbertoId === problema.id;
              const salvando = acaoEmAndamento === problema.id;
              const nomeUsuario =
                nomesUsuarios[problema.userId] ||
                t({
                  pt: "Usuário",
                  en: "User",
                  es: "Usuario",
                });

              return (
                <article key={problema.id} style={cardStyle}>
                  <AdminProblemasTecnicosTicketSummary
                    problema={problema}
                    aberto={aberto}
                    nomeUsuario={nomeUsuario}
                    t={t}
                    onAlternarAbertura={() =>
                      setChamadoAbertoId((atual) =>
                        atual === problema.id ? "" : problema.id,
                      )
                    }
                  />

                  {aberto && (
                    <div style={detailsStyle}>
                      <div style={detailGridStyle}>
                        <div style={detailItemStyle}>
                          <span style={detailLabelStyle}>
                            {t({
                              pt: "Usuário",
                              en: "User",
                              es: "Usuario",
                            })}
                          </span>
                          <strong>{nomeUsuario}</strong>
                        </div>
                        <div style={detailItemStyle}>
                          <span style={detailLabelStyle}>
                            {t({
                              pt: "E-mail",
                              en: "Email",
                              es: "Correo",
                            })}
                          </span>
                          <strong>{problema.emailContato || "—"}</strong>
                        </div>
                        <div style={detailItemStyle}>
                          <span style={detailLabelStyle}>
                            {t({
                              pt: "Criado em",
                              en: "Created",
                              es: "Creado",
                            })}
                          </span>
                          <strong>{formatarData(problema.criadoEm)}</strong>
                        </div>
                        <div style={detailItemStyle}>
                          <span style={detailLabelStyle}>
                            {t({
                              pt: "Atualizado em",
                              en: "Updated",
                              es: "Actualizado",
                            })}
                          </span>
                          <strong>{formatarData(problema.atualizadoEm)}</strong>
                        </div>
                      </div>

                      <section style={contentBoxStyle}>
                        <span style={detailLabelStyle}>
                          {t({
                            pt: "Descrição informada",
                            en: "Reported description",
                            es: "Descripción informada",
                          })}
                        </span>
                        <p style={fullDescriptionStyle}>{problema.descricao}</p>
                      </section>

                      {(problema.paginaUrl ||
                        problema.navegador ||
                        problema.dispositivo) && (
                        <section style={environmentStyle}>
                          {problema.paginaUrl && (
                            <div style={environmentRowStyle}>
                              <span style={detailLabelStyle}>
                                {t({
                                  pt: "Página",
                                  en: "Page",
                                  es: "Página",
                                })}
                              </span>
                              {problema.paginaUrl.startsWith("/") ? (
                                <Link
                                  href={problema.paginaUrl}
                                  style={environmentValueLinkStyle}
                                >
                                  {problema.paginaUrl}
                                </Link>
                              ) : (
                                <span style={environmentValueStyle}>
                                  {problema.paginaUrl}
                                </span>
                              )}
                            </div>
                          )}
                          {problema.dispositivo && (
                            <div style={environmentRowStyle}>
                              <span style={detailLabelStyle}>
                                {t({
                                  pt: "Dispositivo",
                                  en: "Device",
                                  es: "Dispositivo",
                                })}
                              </span>
                              <span style={environmentValueStyle}>
                                {problema.dispositivo}
                              </span>
                            </div>
                          )}
                          {problema.navegador && (
                            <div style={environmentRowStyle}>
                              <span style={detailLabelStyle}>
                                {t({
                                  pt: "Navegador",
                                  en: "Browser",
                                  es: "Navegador",
                                })}
                              </span>
                              <span style={environmentValueStyle}>
                                {problema.navegador}
                              </span>
                            </div>
                          )}
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
                            value={problema.status}
                            disabled={salvando}
                            onChange={(event) =>
                              void atualizarChamado(
                                problema,
                                {
                                  status: event.target
                                    .value as StatusProblemaTecnico,
                                },
                                t({
                                  pt: "Status do chamado atualizado.",
                                  en: "Ticket status updated.",
                                  es: "Estado de la solicitud actualizado.",
                                }),
                              )
                            }
                            style={fieldControlStyle}
                          >
                            {STATUS_PROBLEMAS.map((status) => (
                              <option key={status} value={status}>
                                {t(STATUS_LABEL[status])}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label style={fieldStyle}>
                          <span style={fieldLabelStyle}>
                            {t({
                              pt: "Prioridade",
                              en: "Priority",
                              es: "Prioridad",
                            })}
                          </span>
                          <select
                            value={problema.prioridade}
                            disabled={salvando}
                            onChange={(event) =>
                              void atualizarChamado(
                                problema,
                                {
                                  prioridade: event.target
                                    .value as PrioridadeProblemaTecnico,
                                },
                                t({
                                  pt: "Prioridade do chamado atualizada.",
                                  en: "Ticket priority updated.",
                                  es: "Prioridad de la solicitud actualizada.",
                                }),
                              )
                            }
                            style={fieldControlStyle}
                          >
                            {PRIORIDADES_PROBLEMAS.map((prioridade) => (
                              <option key={prioridade} value={prioridade}>
                                {t(PRIORIDADE_LABEL[prioridade])}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <label style={fieldStyle}>
                        <span style={fieldLabelStyle}>
                          {t({
                            pt: "Observação interna",
                            en: "Internal note",
                            es: "Observación interna",
                          })}
                        </span>
                        <textarea
                          value={observacoes[problema.id] || ""}
                          disabled={salvando}
                          onChange={(event) =>
                            setObservacoes((atuais) => ({
                              ...atuais,
                              [problema.id]: event.target.value,
                            }))
                          }
                          placeholder={t({
                            pt: "Registre o diagnóstico, a ação tomada ou o que ainda precisa ser verificado...",
                            en: "Record the diagnosis, action taken, or what still needs to be checked...",
                            es: "Registra el diagnóstico, la acción tomada o lo que aún debe verificarse...",
                          })}
                          maxLength={3000}
                          rows={5}
                          style={textareaStyle}
                        />
                        <span style={counterStyle}>
                          {(observacoes[problema.id] || "").length}/3000
                        </span>
                      </label>

                      <div style={cardActionsStyle}>
                        <button
                          type="button"
                          className="admin-tech-primary-button"
                          disabled={salvando}
                          onClick={() =>
                            void atualizarChamado(
                              problema,
                              {
                                observacaoAdmin:
                                  observacoes[problema.id] || "",
                              },
                              t({
                                pt: "Observação interna salva.",
                                en: "Internal note saved.",
                                es: "Observación interna guardada.",
                              }),
                            )
                          }
                        >
                          {salvando
                            ? t({
                                pt: "Salvando...",
                                en: "Saving...",
                                es: "Guardando...",
                              })
                            : t({
                                pt: "Salvar observação",
                                en: "Save note",
                                es: "Guardar observación",
                              })}
                        </button>
                      </div>

                      {problema.analisadoEm && (
                        <span style={lastReviewStyle}>
                          {t({
                            pt: "Última análise:",
                            en: "Last review:",
                            es: "Última revisión:",
                          })}{" "}
                          {formatarData(problema.analisadoEm)}
                        </span>
                      )}
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
