"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { TablesUpdate } from "../../../lib/supabase/database.types";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../../lib/historietasTheme";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { formatarData, normalizarTexto } from "../../../lib/utils";

type StatusProblemaTecnico =
  | "aberto"
  | "em_analise"
  | "aguardando_usuario"
  | "resolvido"
  | "fechado";

type PrioridadeProblemaTecnico = "baixa" | "normal" | "alta" | "urgente";

type CategoriaProblemaTecnico =
  | "conta_acesso"
  | "publicacao"
  | "leitura"
  | "comunidade"
  | "diario"
  | "notificacoes"
  | "privacidade"
  | "desempenho"
  | "outro";

type FiltroStatusProblema = StatusProblemaTecnico | "todos";

type ProblemaTecnico = {
  id: string;
  userId: string;
  emailContato: string;
  categoria: CategoriaProblemaTecnico;
  titulo: string;
  descricao: string;
  paginaUrl: string;
  navegador: string;
  dispositivo: string;
  status: StatusProblemaTecnico;
  prioridade: PrioridadeProblemaTecnico;
  observacaoAdmin: string;
  analisadoPor: string;
  analisadoEm: string;
  criadoEm: string;
  atualizadoEm: string;
};


type TextoTraduzido = {
  pt: string;
  en: string;
  es: string;
};

const STATUS_PROBLEMAS: StatusProblemaTecnico[] = [
  "aberto",
  "em_analise",
  "aguardando_usuario",
  "resolvido",
  "fechado",
];

const PRIORIDADES_PROBLEMAS: PrioridadeProblemaTecnico[] = [
  "baixa",
  "normal",
  "alta",
  "urgente",
];

const STATUS_LABEL: Record<StatusProblemaTecnico, TextoTraduzido> = {
  aberto: {
    pt: "Aberto",
    en: "Open",
    es: "Abierto",
  },
  em_analise: {
    pt: "Em análise",
    en: "Under review",
    es: "En revisión",
  },
  aguardando_usuario: {
    pt: "Aguardando usuário",
    en: "Waiting for user",
    es: "Esperando al usuario",
  },
  resolvido: {
    pt: "Resolvido",
    en: "Resolved",
    es: "Resuelto",
  },
  fechado: {
    pt: "Fechado",
    en: "Closed",
    es: "Cerrado",
  },
};

const PRIORIDADE_LABEL: Record<PrioridadeProblemaTecnico, TextoTraduzido> = {
  baixa: {
    pt: "Baixa",
    en: "Low",
    es: "Baja",
  },
  normal: {
    pt: "Normal",
    en: "Normal",
    es: "Normal",
  },
  alta: {
    pt: "Alta",
    en: "High",
    es: "Alta",
  },
  urgente: {
    pt: "Urgente",
    en: "Urgent",
    es: "Urgente",
  },
};

const CATEGORIA_LABEL: Record<CategoriaProblemaTecnico, TextoTraduzido> = {
  conta_acesso: {
    pt: "Conta e acesso",
    en: "Account and access",
    es: "Cuenta y acceso",
  },
  publicacao: {
    pt: "Publicação",
    en: "Publishing",
    es: "Publicación",
  },
  leitura: {
    pt: "Leitura",
    en: "Reading",
    es: "Lectura",
  },
  comunidade: {
    pt: "Comunidade",
    en: "Community",
    es: "Comunidad",
  },
  diario: {
    pt: "Diário",
    en: "Journal",
    es: "Diario",
  },
  notificacoes: {
    pt: "Notificações",
    en: "Notifications",
    es: "Notificaciones",
  },
  privacidade: {
    pt: "Privacidade",
    en: "Privacy",
    es: "Privacidad",
  },
  desempenho: {
    pt: "Desempenho",
    en: "Performance",
    es: "Rendimiento",
  },
  outro: {
    pt: "Outro",
    en: "Other",
    es: "Otro",
  },
};

function traduzir(
  texto: TextoTraduzido,
  idioma: HistorietasLanguage,
) {
  if (idioma === "en") return texto.en;
  if (idioma === "es") return texto.es;
  return texto.pt;
}

function criarLoginHref() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/admin/problemas-tecnicos";
  const destino =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/admin/problemas-tecnicos";

  return `/login?${new URLSearchParams({ redirectTo: destino }).toString()}`;
}

function normalizarStatus(valor: unknown): StatusProblemaTecnico {
  return STATUS_PROBLEMAS.includes(valor as StatusProblemaTecnico)
    ? (valor as StatusProblemaTecnico)
    : "aberto";
}

function normalizarPrioridade(valor: unknown): PrioridadeProblemaTecnico {
  return PRIORIDADES_PROBLEMAS.includes(valor as PrioridadeProblemaTecnico)
    ? (valor as PrioridadeProblemaTecnico)
    : "normal";
}

function normalizarCategoria(valor: unknown): CategoriaProblemaTecnico {
  const categorias = new Set<CategoriaProblemaTecnico>([
    "conta_acesso",
    "publicacao",
    "leitura",
    "comunidade",
    "diario",
    "notificacoes",
    "privacidade",
    "desempenho",
    "outro",
  ]);

  return categorias.has(valor as CategoriaProblemaTecnico)
    ? (valor as CategoriaProblemaTecnico)
    : "outro";
}

function criarMensagemErro(acao: string, erro: unknown) {
  if (!erro || typeof erro !== "object") {
    return `${acao}: erro desconhecido.`;
  }

  const registro = erro as {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
  };
  const detalhes = [
    registro.message,
    registro.code ? `código ${registro.code}` : "",
    registro.details,
    registro.hint,
  ]
    .filter(Boolean)
    .join(" · ");

  return detalhes ? `${acao}: ${detalhes}` : `${acao}: erro desconhecido.`;
}

function corStatus(status: StatusProblemaTecnico) {
  if (status === "aberto") return "#F59E0B";
  if (status === "em_analise") return "#60A5FA";
  if (status === "aguardando_usuario") return "#C084FC";
  if (status === "resolvido") return "#4ADE80";
  return "#A1A1AA";
}

function corPrioridade(prioridade: PrioridadeProblemaTecnico) {
  if (prioridade === "urgente") return "#FB7185";
  if (prioridade === "alta") return "#F59E0B";
  if (prioridade === "baixa") return "#94A3B8";
  return "#60A5FA";
}

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

  async function verificarAdministrador() {
    const { data: respostaPrincipal, error: erroPrincipal } =
      await supabase.rpc("usuario_e_admin");

    if (!erroPrincipal) {
      return respostaPrincipal === true;
    }

    const { data: respostaSuporte, error: erroSuporte } =
      await supabase.rpc("suporte_usuario_e_admin");

    if (erroSuporte) {
      throw erroPrincipal;
    }

    return respostaSuporte === true;
  }

  const carregarNomes = useCallback(async (userIds: string[]) => {
    const ids = Array.from(
      new Set(userIds.map((id) => id.trim()).filter(Boolean)),
    );

    if (ids.length === 0) {
      setNomesUsuarios({});
      return;
    }

    const [porUserId, porId] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,user_id,nome,username")
        .in("user_id", ids)
        .limit(1000),
      supabase
        .from("profiles")
        .select("id,user_id,nome,username")
        .in("id", ids)
        .limit(1000),
    ]);

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

    const { data, error } = await supabase
      .from("problemas_tecnicos")
      .select(
        "id,user_id,email_contato,categoria,titulo,descricao,pagina_url,navegador,dispositivo,status,prioridade,observacao_admin,analisado_por,analisado_em,criado_em,atualizado_em",
      )
      .order("criado_em", { ascending: false })
      .limit(300);

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
            router.replace(criarLoginHref());
          }
          return;
        }

        const adminConfirmado = await verificarAdministrador();

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

  const problemasFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca);

    return problemas.filter((problema) => {
      if (statusFiltro !== "todos" && problema.status !== statusFiltro) {
        return false;
      }

      if (!termo) {
        return true;
      }

      const conteudo = normalizarTexto(
        [
          problema.titulo,
          problema.descricao,
          problema.emailContato,
          problema.paginaUrl,
          problema.navegador,
          problema.dispositivo,
          nomesUsuarios[problema.userId] || "",
          t(CATEGORIA_LABEL[problema.categoria]),
          t(STATUS_LABEL[problema.status]),
          t(PRIORIDADE_LABEL[problema.prioridade]),
        ].join(" "),
      );

      return conteudo.includes(termo);
    });
  }, [busca, nomesUsuarios, problemas, statusFiltro, t]);

  const totais = useMemo(
    () => ({
      total: problemas.length,
      abertos: problemas.filter((item) => item.status === "aberto").length,
      analise: problemas.filter((item) => item.status === "em_analise").length,
      aguardando: problemas.filter(
        (item) => item.status === "aguardando_usuario",
      ).length,
      urgentes: problemas.filter((item) => item.prioridade === "urgente").length,
    }),
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

      const { data, error } = await supabase
        .from("problemas_tecnicos")
        .update(payload)
        .eq("id", problema.id)
        .select(
          "id,user_id,email_contato,categoria,titulo,descricao,pagina_url,navegador,dispositivo,status,prioridade,observacao_admin,analisado_por,analisado_em,criado_em,atualizado_em",
        )
        .maybeSingle();

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
                  <button
                    type="button"
                    className="admin-tech-card-summary"
                    onClick={() =>
                      setChamadoAbertoId((atual) =>
                        atual === problema.id ? "" : problema.id,
                      )
                    }
                    aria-expanded={aberto}
                  >
                    <div style={cardHeadingStyle}>
                      <div style={badgesStyle}>
                        <span
                          style={{
                            ...badgeStyle,
                            borderColor: `${corStatus(problema.status)}70`,
                            color: corStatus(problema.status),
                          }}
                        >
                          {t(STATUS_LABEL[problema.status])}
                        </span>
                        <span
                          style={{
                            ...badgeStyle,
                            borderColor: `${corPrioridade(problema.prioridade)}70`,
                            color: corPrioridade(problema.prioridade),
                          }}
                        >
                          {t(PRIORIDADE_LABEL[problema.prioridade])}
                        </span>
                        <span style={categoryBadgeStyle}>
                          {t(CATEGORIA_LABEL[problema.categoria])}
                        </span>
                      </div>

                      <h2 style={cardTitleStyle}>{problema.titulo}</h2>
                      <p style={cardDescriptionPreviewStyle}>
                        {problema.descricao}
                      </p>
                    </div>

                    <div style={cardMetaStyle}>
                      <span>{nomeUsuario}</span>
                      <span>{formatarData(problema.criadoEm)}</span>
                      <span aria-hidden="true">{aberto ? "▲" : "▼"}</span>
                    </div>
                  </button>

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

const adminProblemasCss = `
  [data-historietas-admin-problemas-root="true"] {
    --admin-tech-card: color-mix(
      in srgb,
      var(--historietas-surface, #120C1E) 92%,
      transparent
    );
    --admin-tech-card-strong: color-mix(
      in srgb,
      var(--historietas-surface-strong, #181125) 96%,
      transparent
    );
    --admin-tech-border: var(
      --historietas-border-soft,
      rgba(255, 255, 255, 0.11)
    );
  }

  [data-historietas-admin-problemas-root="true"] .admin-tech-search-input {
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

  [data-historietas-admin-problemas-root="true"]
    .admin-tech-search-input::placeholder {
    color: var(--historietas-text-secondary, #A1A1AA);
    opacity: 0.75;
  }

  [data-historietas-admin-problemas-root="true"] .admin-tech-card-summary {
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

  [data-historietas-admin-problemas-root="true"] .admin-tech-primary-button {
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

  [data-historietas-admin-problemas-root="true"]
    .admin-tech-primary-button:disabled {
    opacity: 0.58;
    cursor: wait;
  }

  [data-historietas-admin-problemas-root="true"] .admin-tech-loader {
    width: 26px;
    height: 26px;
    border: 3px solid rgba(255, 255, 255, 0.18);
    border-top-color: var(--historietas-secondary, #7C3AED);
    border-radius: 999px;
    animation: admin-tech-spin 700ms linear infinite;
  }

  @keyframes admin-tech-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 720px) {
    [data-historietas-admin-problemas-root="true"] .admin-tech-card-summary {
      grid-template-columns: minmax(0, 1fr);
    }

    [data-historietas-admin-problemas-root="true"] {
      --admin-tech-mobile: 1;
    }
  }

  @media (max-width: 720px) {
    [data-historietas-admin-problemas-root="true"] .admin-tech-card-summary {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [data-historietas-admin-problemas-root="true"] *,
    [data-historietas-admin-problemas-root="true"] *::before,
    [data-historietas-admin-problemas-root="true"] *::after {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
    }
  }
`;

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
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: "14px",
  background: "var(--historietas-surface, #120C1E)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textAlign: "center",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "22px",
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

const errorStyle: CSSProperties = {
  color: "#FDA4AF",
  fontSize: "11px",
  fontWeight: 760,
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

const categoryBadgeStyle: CSSProperties = {
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
  gap: "9px",
  background: "rgba(255,255,255,0.025)",
};

const environmentRowStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gridTemplateColumns: "110px minmax(0, 1fr)",
  alignItems: "start",
  gap: "10px",
};

const environmentValueStyle: CSSProperties = {
  minWidth: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  lineHeight: 1.45,
  overflowWrap: "anywhere",
};

const environmentValueLinkStyle: CSSProperties = {
  ...environmentValueStyle,
  color: "#C4B5FD",
  textDecoration: "underline",
  textUnderlineOffset: "3px",
};

const controlsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "112px",
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
};

const lastReviewStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  fontWeight: 700,
};
