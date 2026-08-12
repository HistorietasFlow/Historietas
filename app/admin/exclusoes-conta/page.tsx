"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../../lib/historietasTheme";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { formatarData, normalizarTexto } from "../../../lib/utils";

type StatusSolicitacaoExclusao =
  | "pendente"
  | "verificando"
  | "concluida"
  | "recusada"
  | "cancelada";

type FiltroStatus = StatusSolicitacaoExclusao | "todos";

type SolicitacaoExclusao = {
  id: string;
  email: string;
  motivo: string;
  origem: string;
  status: StatusSolicitacaoExclusao;
  userAgent: string;
  criadaEm: string;
  atualizadaEm: string;
  processadaEm: string;
  observacaoInterna: string;
};

type TextoTraduzido = {
  pt: string;
  en: string;
  es: string;
};


type StatusOperacaoRecuperavel = "falhou" | "excluindo_auth";

type OperacaoRecuperavel = {
  id: string;
  status: StatusOperacaoRecuperavel;
  bucketsPendentes: string[];
  bucketsConcluidos: string[];
  tentativasStorage: number;
  tentativasAuth: number;
  ultimoErroCodigo: string;
  ultimoErroMensagem: string;
  ultimaFalhaEm: string;
  lockExpiraEm: string;
  lockAtivo: boolean;
  criadaEm: string;
  atualizadaEm: string;
  storageLimpoEm: string;
  authExcluidoEm: string;
};

type RespostaOperacoes = {
  ok?: boolean;
  codigo?: string;
  mensagem?: string;
  operacoes?: unknown[];
};

type RespostaRecuperacao = {
  ok?: boolean;
  codigo?: string;
  mensagem?: string;
  exclusaoConcluida?: boolean;
  acompanhamentoPendente?: boolean;
  operacaoId?: string;
  statusOperacao?: string;
};

type RespostaLista = {
  ok?: boolean;
  codigo?: string;
  mensagem?: string;
  solicitacoes?: unknown[];
};

type RespostaAtualizacao = {
  ok?: boolean;
  codigo?: string;
  mensagem?: string;
  solicitacao?: unknown;
};

const STATUS_SOLICITACOES: StatusSolicitacaoExclusao[] = [
  "pendente",
  "verificando",
  "concluida",
  "recusada",
  "cancelada",
];

const STATUS_LABEL: Record<StatusSolicitacaoExclusao, TextoTraduzido> = {
  pendente: {
    pt: "Pendente",
    en: "Pending",
    es: "Pendiente",
  },
  verificando: {
    pt: "Verificando identidade",
    en: "Verifying identity",
    es: "Verificando identidad",
  },
  concluida: {
    pt: "Concluída",
    en: "Completed",
    es: "Completada",
  },
  recusada: {
    pt: "Recusada",
    en: "Rejected",
    es: "Rechazada",
  },
  cancelada: {
    pt: "Cancelada",
    en: "Canceled",
    es: "Cancelada",
  },
};

const ORIGEM_LABEL: Record<string, TextoTraduzido> = {
  pagina_publica: {
    pt: "Página pública",
    en: "Public page",
    es: "Página pública",
  },
  suporte: {
    pt: "Suporte",
    en: "Support",
    es: "Soporte",
  },
  administracao: {
    pt: "Administração",
    en: "Administration",
    es: "Administración",
  },
};

function traduzir(texto: TextoTraduzido, idioma: HistorietasLanguage) {
  if (idioma === "en") return texto.en;
  if (idioma === "es") return texto.es;
  return texto.pt;
}

function criarLoginHref() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/admin/exclusoes-conta";
  const destino =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/admin/exclusoes-conta";

  return `/login?${new URLSearchParams({ redirectTo: destino }).toString()}`;
}

function normalizarStatus(valor: unknown): StatusSolicitacaoExclusao {
  return STATUS_SOLICITACOES.includes(valor as StatusSolicitacaoExclusao)
    ? (valor as StatusSolicitacaoExclusao)
    : "pendente";
}

function normalizarSolicitacao(valor: unknown): SolicitacaoExclusao | null {
  if (!valor || typeof valor !== "object") {
    return null;
  }

  const registro = valor as Record<string, unknown>;
  const id = String(registro.id || "").trim();

  if (!id) {
    return null;
  }

  return {
    id,
    email: String(registro.email || ""),
    motivo: String(registro.motivo || ""),
    origem: String(registro.origem || ""),
    status: normalizarStatus(registro.status),
    userAgent: String(registro.user_agent || ""),
    criadaEm: String(registro.criada_em || ""),
    atualizadaEm: String(registro.atualizada_em || ""),
    processadaEm: String(registro.processada_em || ""),
    observacaoInterna: String(registro.observacao_interna || ""),
  };
}


function normalizarOperacaoRecuperavel(valor: unknown): OperacaoRecuperavel | null {
  if (!valor || typeof valor !== "object") {
    return null;
  }

  const registro = valor as Record<string, unknown>;
  const id = String(registro.id || "").trim();
  const status = String(registro.status || "").trim();

  if (!id || (status !== "falhou" && status !== "excluindo_auth")) {
    return null;
  }

  const listaStrings = (item: unknown) =>
    Array.isArray(item)
      ? item.filter((valorLista): valorLista is string => typeof valorLista === "string")
      : [];

  return {
    id,
    status,
    bucketsPendentes: listaStrings(registro.buckets_pendentes),
    bucketsConcluidos: listaStrings(registro.buckets_concluidos),
    tentativasStorage: Number(registro.tentativas_storage || 0),
    tentativasAuth: Number(registro.tentativas_auth || 0),
    ultimoErroCodigo: String(registro.ultimo_erro_codigo || ""),
    ultimoErroMensagem: String(registro.ultimo_erro_mensagem || ""),
    ultimaFalhaEm: String(registro.ultima_falha_em || ""),
    lockExpiraEm: String(registro.lock_expira_em || ""),
    lockAtivo: registro.lock_ativo === true,
    criadaEm: String(registro.criada_em || ""),
    atualizadaEm: String(registro.atualizada_em || ""),
    storageLimpoEm: String(registro.storage_limpo_em || ""),
    authExcluidoEm: String(registro.auth_excluido_em || ""),
  };
}

function corStatus(status: StatusSolicitacaoExclusao) {
  if (status === "pendente") return "#F59E0B";
  if (status === "verificando") return "#60A5FA";
  if (status === "concluida") return "#4ADE80";
  if (status === "recusada") return "#FB7185";
  return "#A1A1AA";
}

function origemTraduzida(origem: string, idioma: HistorietasLanguage) {
  const conhecida = ORIGEM_LABEL[origem];
  return conhecida ? traduzir(conhecida, idioma) : origem || "—";
}

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

    const response = await fetch("/api/admin/solicitacoes-exclusao", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const data = (await response.json().catch(() => null)) as RespostaLista | null;

    if (response.status === 401) {
      router.replace(criarLoginHref());
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
    const response = await fetch("/api/admin/operacoes-exclusao", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const data = (await response.json().catch(() => null)) as RespostaOperacoes | null;

    if (response.status === 401) {
      router.replace(criarLoginHref());
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

  const solicitacoesFiltradas = useMemo(() => {
    const termo = normalizarTexto(busca);

    return solicitacoes.filter((solicitacao) => {
      if (
        statusFiltro !== "todos" &&
        solicitacao.status !== statusFiltro
      ) {
        return false;
      }

      if (!termo) {
        return true;
      }

      const conteudo = normalizarTexto(
        [
          solicitacao.email,
          solicitacao.motivo,
          solicitacao.origem,
          solicitacao.status,
          solicitacao.userAgent,
          solicitacao.observacaoInterna,
          origemTraduzida(solicitacao.origem, language),
          t(STATUS_LABEL[solicitacao.status]),
        ].join(" "),
      );

      return conteudo.includes(termo);
    });
  }, [busca, language, solicitacoes, statusFiltro, t]);

  const totais = useMemo(
    () => ({
      total: solicitacoes.length,
      pendentes: solicitacoes.filter((item) => item.status === "pendente").length,
      verificando: solicitacoes.filter((item) => item.status === "verificando")
        .length,
      concluidas: solicitacoes.filter((item) => item.status === "concluida").length,
      encerradas: solicitacoes.filter(
        (item) => item.status === "recusada" || item.status === "cancelada",
      ).length,
    }),
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
      const response = await fetch("/api/admin/solicitacoes-exclusao", {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          id: solicitacao.id,
          status: novoStatus,
          observacaoInterna,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | RespostaAtualizacao
        | null;

      if (response.status === 401) {
        router.replace(criarLoginHref());
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
      const response = await fetch("/api/admin/operacoes-exclusao", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ id: operacao.id }),
      });

      const data = (await response.json().catch(() => null)) as
        | RespostaRecuperacao
        | null;

      if (response.status === 401) {
        router.replace(criarLoginHref());
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

const adminExclusoesCss = `
  [data-historietas-admin-exclusoes-root="true"] {
    --admin-delete-card: color-mix(
      in srgb,
      var(--historietas-surface, #120C1E) 92%,
      transparent
    );
    --admin-delete-border: var(
      --historietas-border-soft,
      rgba(255, 255, 255, 0.11)
    );
  }

  [data-historietas-admin-exclusoes-root="true"] .admin-delete-search-input {
    width: 100%;
    min-width: 0;
    min-height: 46px;
    border: 0;
    outline: none;
    background: transparent;
    color: var(--historietas-text-primary, #FFFFFF);
    font: inherit;
    font-size: 13px;
    font-weight: 650;
  }

  [data-historietas-admin-exclusoes-root="true"]
    .admin-delete-search-input::placeholder {
    color: var(--historietas-text-secondary, #A1A1AA);
    opacity: 0.75;
  }

  [data-historietas-admin-exclusoes-root="true"] .admin-delete-card-summary {
    width: 100%;
    border: 0;
    padding: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 14px;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  [data-historietas-admin-exclusoes-root="true"]
    .admin-delete-primary-button {
    min-height: 40px;
    border: 0;
    border-radius: 12px;
    padding: 9px 14px;
    background: var(--historietas-secondary, #7C3AED);
    color: #FFFFFF;
    font: inherit;
    font-size: 12px;
    font-weight: 850;
    cursor: pointer;
  }

  [data-historietas-admin-exclusoes-root="true"]
    .admin-delete-primary-button:disabled {
    opacity: 0.52;
    cursor: not-allowed;
  }

  .admin-delete-loader {
    width: 26px;
    height: 26px;
    border: 3px solid rgba(255, 255, 255, 0.18);
    border-top-color: var(--historietas-secondary, #7C3AED);
    border-radius: 999px;
    animation: admin-delete-spin 700ms linear infinite;
  }

  @keyframes admin-delete-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 760px) {
    [data-historietas-admin-exclusoes-root="true"]
      .admin-delete-card-summary {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [data-historietas-admin-exclusoes-root="true"] *,
    [data-historietas-admin-exclusoes-root="true"] *::before,
    [data-historietas-admin-exclusoes-root="true"] *::after {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
    }
  }
`;


const recoverySectionStyle: CSSProperties = {
  display: "grid",
  gap: 14,
  padding: 18,
  borderRadius: 18,
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.11))",
  background: "color-mix(in srgb, var(--historietas-surface, #120C1E) 94%, transparent)",
};

const recoveryHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  flexWrap: "wrap",
};

const recoveryTitleStyle: CSSProperties = {
  margin: "5px 0 0",
  fontSize: 20,
  lineHeight: 1.2,
};

const recoveryDescriptionStyle: CSSProperties = {
  margin: "7px 0 0",
  maxWidth: 820,
  color: "var(--historietas-text-secondary, #C9C3D3)",
  fontSize: 13,
  lineHeight: 1.6,
};

const recoveryCountStyle: CSSProperties = {
  minWidth: 42,
  height: 42,
  display: "grid",
  placeItems: "center",
  borderRadius: 999,
  background: "rgba(245, 158, 11, 0.14)",
  border: "1px solid rgba(245, 158, 11, 0.34)",
  color: "#FBBF24",
  fontSize: 16,
};

const recoveryEmptyStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 14,
  background: "rgba(74, 222, 128, 0.08)",
  border: "1px solid rgba(74, 222, 128, 0.2)",
  color: "var(--historietas-text-secondary, #C9C3D3)",
  fontSize: 13,
};

const recoveryListStyle: CSSProperties = {
  display: "grid",
  gap: 12,
};

const recoveryCardStyle: CSSProperties = {
  display: "grid",
  gap: 13,
  padding: 15,
  borderRadius: 15,
  background: "rgba(255,255,255,0.025)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.11))",
};

const recoveryCardTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const operationIdStyle: CSSProperties = {
  display: "block",
  marginTop: 5,
  color: "var(--historietas-text-secondary, #C9C3D3)",
  fontSize: 11,
  overflowWrap: "anywhere",
};

const recoveryMetaGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 10,
};

const recoveryDetailStyle: CSSProperties = {
  display: "grid",
  gap: 5,
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.025)",
  fontSize: 12,
};

const recoveryErrorStyle: CSSProperties = {
  display: "grid",
  gap: 5,
  padding: "11px 12px",
  borderRadius: 12,
  background: "rgba(251, 113, 133, 0.08)",
  border: "1px solid rgba(251, 113, 133, 0.2)",
  color: "var(--historietas-text-secondary, #E4DDEB)",
  fontSize: 12,
  lineHeight: 1.5,
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "var(--historietas-page-background, #070212)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily:
    "Inter, Poppins, Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const containerStyle: CSSProperties = {
  width: "min(1080px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "22px 0 120px",
  boxSizing: "border-box",
};

const stateCardStyle: CSSProperties = {
  minHeight: "240px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.1))",
  borderRadius: "22px",
  padding: "24px",
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: "14px",
  background: "var(--historietas-surface, #120C1E)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textAlign: "center",
};

const stateDescriptionStyle: CSSProperties = {
  maxWidth: "560px",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  lineHeight: 1.6,
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "18px",
  flexWrap: "wrap",
};

const headerCopyStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "720px",
  display: "grid",
  gap: "6px",
};

const eyebrowStyle: CSSProperties = {
  color: "var(--historietas-secondary, #A78BFA)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.16em",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(26px, 5vw, 42px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.05em",
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #C4B5FD)",
  fontSize: "13px",
  lineHeight: 1.55,
  fontWeight: 560,
};

const headerActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "9px",
  flexWrap: "wrap",
};

const secondaryLinkStyle: CSSProperties = {
  minHeight: "40px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  borderRadius: "12px",
  padding: "9px 14px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.05)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 820,
};

const warningStyle: CSSProperties = {
  marginBottom: "14px",
  border: "1px solid rgba(245,158,11,0.3)",
  borderRadius: "16px",
  padding: "13px 14px",
  display: "grid",
  gap: "5px",
  background: "rgba(120,53,15,0.14)",
  color: "#FDE68A",
  fontSize: "11px",
  lineHeight: 1.55,
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(126px, 1fr))",
  gap: "10px",
  marginBottom: "14px",
};

const summaryCardStyle: CSSProperties = {
  minHeight: "84px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.1))",
  borderRadius: "16px",
  padding: "13px",
  display: "grid",
  alignContent: "center",
  gap: "4px",
  background: "var(--historietas-surface, #120C1E)",
};

const summaryNumberStyle: CSSProperties = {
  fontSize: "24px",
  lineHeight: 1,
  fontWeight: 950,
};

const summaryLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 780,
};

const filtersStyle: CSSProperties = {
  marginBottom: "14px",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(180px, 240px)",
  gap: "10px",
};

const searchStyle: CSSProperties = {
  minHeight: "48px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.1))",
  borderRadius: "14px",
  padding: "0 13px",
  display: "grid",
  gridTemplateColumns: "22px minmax(0, 1fr)",
  alignItems: "center",
  gap: "8px",
  background: "var(--historietas-surface, #120C1E)",
  color: "var(--historietas-text-secondary, #A1A1AA)",
};

const selectFilterStyle: CSSProperties = {
  minHeight: "48px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.1))",
  borderRadius: "14px",
  padding: "0 12px",
  outline: "none",
  background: "var(--historietas-surface, #120C1E)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  font: "inherit",
  fontSize: "12px",
  fontWeight: 750,
};

const errorBannerStyle: CSSProperties = {
  marginBottom: "12px",
  border: "1px solid rgba(251,113,133,0.35)",
  borderRadius: "14px",
  padding: "11px 13px",
  background: "rgba(190,24,93,0.14)",
  color: "#FDA4AF",
  fontSize: "11px",
  fontWeight: 760,
  lineHeight: 1.45,
};

const successBannerStyle: CSSProperties = {
  marginBottom: "12px",
  border: "1px solid rgba(74,222,128,0.32)",
  borderRadius: "14px",
  padding: "11px 13px",
  background: "rgba(22,101,52,0.16)",
  color: "#86EFAC",
  fontSize: "11px",
  fontWeight: 760,
  lineHeight: 1.45,
};

const resultsHeaderStyle: CSSProperties = {
  margin: "0 2px 10px",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
};

const emptyStyle: CSSProperties = {
  minHeight: "180px",
  border: "1px dashed var(--historietas-border-soft, rgba(255,255,255,0.14))",
  borderRadius: "20px",
  padding: "22px",
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: "7px",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  textAlign: "center",
};

const listStyle: CSSProperties = {
  display: "grid",
  gap: "11px",
};

const cardStyle: CSSProperties = {
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.1))",
  borderRadius: "19px",
  padding: "15px",
  background: "var(--historietas-surface, #120C1E)",
  overflow: "hidden",
};

const cardHeadingStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "8px",
};

const badgesStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  flexWrap: "wrap",
};

const badgeStyle: CSSProperties = {
  minHeight: "23px",
  border: "1px solid",
  borderRadius: "999px",
  padding: "4px 8px",
  display: "inline-flex",
  alignItems: "center",
  fontSize: "9px",
  fontWeight: 900,
};

const sourceBadgeStyle: CSSProperties = {
  ...badgeStyle,
  borderColor: "rgba(167,139,250,0.35)",
  color: "#C4B5FD",
};

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "17px",
  lineHeight: 1.25,
  fontWeight: 900,
  overflowWrap: "anywhere",
};

const cardDescriptionPreviewStyle: CSSProperties = {
  margin: 0,
  maxWidth: "780px",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  lineHeight: 1.5,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const cardMetaStyle: CSSProperties = {
  display: "grid",
  justifyItems: "end",
  alignContent: "center",
  gap: "5px",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  fontWeight: 730,
  whiteSpace: "nowrap",
};

const detailsStyle: CSSProperties = {
  marginTop: "15px",
  paddingTop: "15px",
  borderTop: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  display: "grid",
  gap: "14px",
};

const detailGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "8px",
};

const detailItemStyle: CSSProperties = {
  minWidth: 0,
  borderRadius: "12px",
  padding: "10px",
  display: "grid",
  gap: "4px",
  background: "rgba(255,255,255,0.035)",
  overflowWrap: "anywhere",
};

const detailLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  fontWeight: 850,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
};

const contentBoxStyle: CSSProperties = {
  borderRadius: "14px",
  padding: "12px",
  display: "grid",
  gap: "7px",
  background: "rgba(255,255,255,0.035)",
};

const fullDescriptionStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 560,
  lineHeight: 1.62,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

const environmentStyle: CSSProperties = {
  borderRadius: "14px",
  padding: "12px",
  display: "grid",
  gap: "7px",
  background: "rgba(255,255,255,0.025)",
};

const environmentValueStyle: CSSProperties = {
  minWidth: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  lineHeight: 1.5,
  overflowWrap: "anywhere",
};

const controlsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  gap: "10px",
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
};

const fieldLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 820,
};

const fieldControlStyle: CSSProperties = {
  width: "100%",
  minHeight: "42px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  borderRadius: "12px",
  padding: "0 11px",
  outline: "none",
  background: "rgba(255,255,255,0.05)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  font: "inherit",
  fontSize: "12px",
  fontWeight: 750,
};

const statusHelpStyle: CSSProperties = {
  borderRadius: "12px",
  padding: "10px 11px",
  display: "grid",
  gap: "4px",
  alignContent: "center",
  background: "rgba(255,255,255,0.03)",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  lineHeight: 1.5,
};

const finalWarningStyle: CSSProperties = {
  border: "1px solid rgba(251,113,133,0.28)",
  borderRadius: "13px",
  padding: "11px 12px",
  display: "grid",
  gap: "4px",
  background: "rgba(159,18,57,0.12)",
  color: "#FDA4AF",
  fontSize: "10px",
  lineHeight: 1.5,
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "126px",
  resize: "vertical",
  boxSizing: "border-box",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  borderRadius: "13px",
  padding: "11px 12px",
  outline: "none",
  background: "rgba(255,255,255,0.045)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  font: "inherit",
  fontSize: "12px",
  lineHeight: 1.52,
};

const counterStyle: CSSProperties = {
  justifySelf: "end",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  fontWeight: 700,
};

const cardActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "10px",
  flexWrap: "wrap",
};

const unsavedStyle: CSSProperties = {
  color: "#FDE68A",
  fontSize: "10px",
  fontWeight: 760,
};