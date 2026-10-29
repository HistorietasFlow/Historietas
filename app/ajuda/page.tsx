"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { supabase } from "../../lib/supabase/client";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import type { HistorietasLanguage } from "../../lib/i18n";
import { normalizarTexto } from "../../lib/utils";
import { SvgIcon } from "./components/ajuda-svg-icon";
import {
  ATALHOS_AJUDA,
  CATEGORIAS_AJUDA,
  PERGUNTAS_AJUDA,
  type CategoriaAjudaId,
  type TextoTraduzido,
} from "./lib/ajuda-content";
import {
  CATEGORIAS_PROBLEMA_TECNICO,
  type CategoriaProblemaTecnico,
  type ProblemaTecnicoResumo,
  type ProblemaTecnicoRpcRow,
  type StatusProblemaTecnico,
} from "./lib/ajuda-technical-support";

function traduzirTexto(
  texto: TextoTraduzido,
  idioma: HistorietasLanguage,
) {
  if (idioma === "en") {
    return texto.en;
  }

  if (idioma === "es") {
    return texto.es;
  }

  return texto.pt;
}

function textoSeguro(valor: unknown, fallback = "") {
  return typeof valor === "string" && valor.trim()
    ? valor.trim()
    : fallback;
}

function normalizarCategoriaProblemaTecnico(
  valor: unknown,
): CategoriaProblemaTecnico {
  const categorias = new Set<CategoriaProblemaTecnico>(
    CATEGORIAS_PROBLEMA_TECNICO.map((item) => item.valor),
  );

  return categorias.has(valor as CategoriaProblemaTecnico)
    ? (valor as CategoriaProblemaTecnico)
    : "outro";
}

function normalizarStatusProblemaTecnico(
  valor: unknown,
): StatusProblemaTecnico {
  return valor === "aberto" ||
    valor === "em_analise" ||
    valor === "aguardando_usuario" ||
    valor === "resolvido" ||
    valor === "fechado"
    ? valor
    : "aberto";
}

export default function AjudaPage() {
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] =
    useState<CategoriaAjudaId>("todos");
  const [categoriaProblema, setCategoriaProblema] =
    useState<CategoriaProblemaTecnico>("outro");
  const [tituloProblema, setTituloProblema] = useState("");
  const [descricaoProblema, setDescricaoProblema] = useState("");
  const [paginaProblema, setPaginaProblema] = useState("");
  const [enviandoProblema, setEnviandoProblema] = useState(false);
  const [mensagemProblema, setMensagemProblema] = useState("");
  const [erroProblema, setErroProblema] = useState("");
  const [usuarioAutenticado, setUsuarioAutenticado] =
    useState<boolean | null>(null);
  const [carregandoChamados, setCarregandoChamados] = useState(false);
  const [chamadosTecnicos, setChamadosTecnicos] = useState<
    ProblemaTecnicoResumo[]
  >([]);
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  function t(texto: TextoTraduzido) {
    return traduzirTexto(texto, language);
  }

  function rotuloStatusProblema(status: StatusProblemaTecnico) {
    const rotulos: Record<StatusProblemaTecnico, TextoTraduzido> = {
      aberto: { pt: "Aberto", en: "Open", es: "Abierto" },
      em_analise: { pt: "Em análise", en: "Under review", es: "En revisión" },
      aguardando_usuario: {
        pt: "Aguardando você",
        en: "Waiting for you",
        es: "Esperando tu respuesta",
      },
      resolvido: { pt: "Resolvido", en: "Resolved", es: "Resuelto" },
      fechado: { pt: "Fechado", en: "Closed", es: "Cerrado" },
    };

    return t(rotulos[status]);
  }

  function formatarDataChamado(data: string) {
    const timestamp = new Date(data).getTime();

    if (!Number.isFinite(timestamp)) {
      return "";
    }

    return new Intl.DateTimeFormat(
      language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR",
      { dateStyle: "medium", timeStyle: "short" },
    ).format(new Date(timestamp));
  }

  async function carregarChamadosTecnicos() {
    setCarregandoChamados(true);

    try {
      const { data, error } = await supabase.rpc(
        "listar_meus_problemas_tecnicos",
        { p_limite: 20 },
      );

      if (error) {
        throw error;
      }

      const registros: ProblemaTecnicoRpcRow[] = Array.isArray(data) ? data : [];

      const chamados = registros
        .map((item) => ({
          id: textoSeguro(item.problema_id),
          categoria: normalizarCategoriaProblemaTecnico(item.categoria),
          titulo: textoSeguro(item.titulo, "Problema técnico"),
          descricao: textoSeguro(item.descricao),
          paginaUrl: textoSeguro(item.pagina_url),
          status: normalizarStatusProblemaTecnico(item.status),
          prioridade: textoSeguro(item.prioridade, "normal"),
          observacaoAdmin: textoSeguro(item.observacao_admin),
          criadoEm: textoSeguro(item.criado_em),
          atualizadoEm: textoSeguro(item.atualizado_em),
        }))
        .filter((item) => Boolean(item.id));

      setChamadosTecnicos(chamados);
    } catch {
      setChamadosTecnicos([]);
    } finally {
      setCarregandoChamados(false);
    }
  }

  useEffect(() => {
    let cancelado = false;

    async function prepararSuporteTecnico() {
      if (typeof window !== "undefined") {
        setPaginaProblema(window.location.href);
      }

      try {
        const { data } = await supabase.auth.getUser();
        const autenticado = Boolean(data.user?.id);

        if (cancelado) {
          return;
        }

        setUsuarioAutenticado(autenticado);

        if (autenticado) {
          await carregarChamadosTecnicos();
        }
      } catch {
        if (!cancelado) {
          setUsuarioAutenticado(false);
        }
      }
    }

    void prepararSuporteTecnico();

    return () => {
      cancelado = true;
    };
  }, []);

  async function enviarProblemaTecnico(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (enviandoProblema) {
      return;
    }

    const titulo = tituloProblema.trim();
    const descricao = descricaoProblema.trim();

    setMensagemProblema("");
    setErroProblema("");

    if (titulo.length < 8) {
      setErroProblema(
        t({
          pt: "O título precisa ter pelo menos 8 caracteres.",
          en: "The title must have at least 8 characters.",
          es: "El título debe tener al menos 8 caracteres.",
        }),
      );
      return;
    }

    if (descricao.length < 20) {
      setErroProblema(
        t({
          pt: "Explique o problema com pelo menos 20 caracteres.",
          en: "Describe the problem using at least 20 characters.",
          es: "Describe el problema usando al menos 20 caracteres.",
        }),
      );
      return;
    }

    setEnviandoProblema(true);

    try {
      const { data: usuarioResposta } = await supabase.auth.getUser();

      if (!usuarioResposta.user?.id) {
        setUsuarioAutenticado(false);
        throw new Error(
          t({
            pt: "Entre na sua conta para enviar um chamado técnico.",
            en: "Sign in to submit a technical support ticket.",
            es: "Inicia sesión para enviar un caso de soporte técnico.",
          }),
        );
      }

      setUsuarioAutenticado(true);

      const navegador =
        typeof navigator !== "undefined" ? navigator.userAgent : "";
      const dispositivo =
        typeof window !== "undefined"
          ? `${window.innerWidth}x${window.innerHeight} · ${navigator.language || ""}`
          : "";

      const { error } = await supabase.rpc("criar_problema_tecnico", {
        p_categoria: categoriaProblema,
        p_titulo: titulo,
        p_descricao: descricao,
        p_pagina_url: paginaProblema.trim(),
        p_navegador: navegador,
        p_dispositivo: dispositivo,
      });

      if (error) {
        throw error;
      }

      setTituloProblema("");
      setDescricaoProblema("");
      setMensagemProblema(
        t({
          pt: "Problema técnico enviado. A equipe poderá acompanhar o chamado pelo painel administrativo.",
          en: "Technical issue submitted. The team can now review the ticket in the admin dashboard.",
          es: "Problema técnico enviado. El equipo podrá revisar el caso en el panel administrativo.",
        }),
      );
      await carregarChamadosTecnicos();
    } catch (error) {
      setErroProblema(
        error instanceof Error && error.message.trim()
          ? error.message
          : t({
              pt: "Não foi possível enviar o problema técnico agora.",
              en: "The technical issue could not be submitted right now.",
              es: "No se pudo enviar el problema técnico ahora.",
            }),
      );
    } finally {
      setEnviandoProblema(false);
    }
  }

  const perguntasFiltradas = useMemo(() => {
    const buscaNormalizada = normalizarTexto(busca);

    return PERGUNTAS_AJUDA.filter((item) => {
      const correspondeCategoria =
        categoriaAtiva === "todos" || item.categoria === categoriaAtiva;

      if (!correspondeCategoria) {
        return false;
      }

      if (!buscaNormalizada) {
        return true;
      }

      const conteudo = normalizarTexto(
        `${traduzirTexto(item.pergunta, language)} ${traduzirTexto(
          item.resposta,
          language,
        )} ${traduzirTexto(item.palavrasChave, language)}`,
      );

      return conteudo.includes(buscaNormalizada);
    });
  }, [busca, categoriaAtiva, language]);

  const categoriaSelecionada =
    CATEGORIAS_AJUDA.find((categoria) => categoria.id === categoriaAtiva) ||
    CATEGORIAS_AJUDA[0];

  return (
    <main
      style={pageThemeStyle}
      data-historietas-ajuda-root="true"
    >
      <style>{`${historietasThemeCss}${ajudaPageCss}`}</style>

      <div style={containerStyle}>
        <header style={headerStyle}>
          <Link
            href="/configuracoes"
            style={backButtonStyle}
            aria-label={t({
              pt: "Voltar para Configurações",
              en: "Back to Settings",
              es: "Volver a Configuración",
            })}
          >
            <SvgIcon name="arrowLeft" size={25} strokeWidth={2.35} />
          </Link>

          <div style={headerTextStyle}>
            <span style={eyebrowStyle}>
              {t({
                pt: "SUPORTE",
                en: "SUPPORT",
                es: "SOPORTE",
              })}
            </span>
            <h1 style={pageTitleStyle}>
              {t({
                pt: "Central de ajuda",
                en: "Help center",
                es: "Centro de ayuda",
              })}
            </h1>
          </div>
        </header>

        <section style={heroStyle}>
          <span style={heroIconStyle}>
            <SvgIcon name="help" size={31} strokeWidth={2.15} />
          </span>

          <div style={heroTextStyle}>
            <h2 style={heroTitleStyle}>
              {t({
                pt: "Como podemos ajudar?",
                en: "How can we help?",
                es: "¿Cómo podemos ayudarte?",
              })}
            </h2>
            <p style={heroDescriptionStyle}>
              {t({
                pt: "Encontre respostas sobre sua conta, publicação, leitura, comunidade e privacidade.",
                en: "Find answers about your account, publishing, reading, community, and privacy.",
                es: "Encuentra respuestas sobre tu cuenta, publicación, lectura, comunidad y privacidad.",
              })}
            </p>
          </div>

          <label style={searchBoxStyle} htmlFor="buscar-ajuda">
            <SvgIcon name="search" size={23} strokeWidth={2.3} />
            <input
              id="buscar-ajuda"
              className="ajuda-search-input"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder={t({
                pt: "Digite sua dúvida...",
                en: "Type your question...",
                es: "Escribe tu duda...",
              })}
              maxLength={100}
              autoComplete="off"
              style={searchInputStyle}
            />
            {busca ? (
              <button
                type="button"
                className="ajuda-clear-button"
                onClick={() => setBusca("")}
                aria-label={t({
                  pt: "Limpar busca",
                  en: "Clear search",
                  es: "Borrar búsqueda",
                })}
              >
                ×
              </button>
            ) : null}
          </label>
        </section>

        <section style={sectionStyle} aria-labelledby="categorias-ajuda-titulo">
          <div style={sectionHeadingStyle}>
            <div>
              <span style={sectionKickerStyle}>
                {t({
                  pt: "ASSUNTOS",
                  en: "TOPICS",
                  es: "TEMAS",
                })}
              </span>
              <h2 id="categorias-ajuda-titulo" style={sectionTitleStyle}>
                {t({
                  pt: "Escolha uma categoria",
                  en: "Choose a category",
                  es: "Elige una categoría",
                })}
              </h2>
            </div>
          </div>

          <div style={categoriesGridStyle}>
            {CATEGORIAS_AJUDA.map((categoria) => {
              const ativa = categoria.id === categoriaAtiva;

              return (
                <button
                  key={categoria.id}
                  type="button"
                  className="ajuda-category-button"
                  data-active={ativa ? "true" : "false"}
                  aria-pressed={ativa}
                  onClick={() => setCategoriaAtiva(categoria.id)}
                >
                  <span className="ajuda-category-icon">
                    <SvgIcon name={categoria.icon} size={23} strokeWidth={2.05} />
                  </span>
                  <span className="ajuda-category-copy">
                    <strong>{t(categoria.titulo)}</strong>
                    <span>{t(categoria.descricao)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section style={sectionStyle} aria-labelledby="perguntas-ajuda-titulo">
          <div style={sectionHeadingStyle}>
            <div>
              <span style={sectionKickerStyle}>
                {t({
                  pt: "PERGUNTAS FREQUENTES",
                  en: "FREQUENTLY ASKED QUESTIONS",
                  es: "PREGUNTAS FRECUENTES",
                })}
              </span>
              <h2 id="perguntas-ajuda-titulo" style={sectionTitleStyle}>
                {t(categoriaSelecionada.titulo)}
              </h2>
            </div>

            <span style={resultsCountStyle}>
              {perguntasFiltradas.length}{" "}
              {perguntasFiltradas.length === 1
                ? t({ pt: "resposta", en: "answer", es: "respuesta" })
                : t({ pt: "respostas", en: "answers", es: "respuestas" })}
            </span>
          </div>

          {perguntasFiltradas.length > 0 ? (
            <div style={faqListStyle}>
              {perguntasFiltradas.map((item) => {
                const categoria = CATEGORIAS_AJUDA.find(
                  (entrada) => entrada.id === item.categoria,
                );

                return (
                  <details key={item.id} className="ajuda-faq-details">
                    <summary className="ajuda-faq-summary">
                      <span className="ajuda-faq-icon">
                        <SvgIcon
                          name={categoria?.icon || "help"}
                          size={21}
                          strokeWidth={2.1}
                        />
                      </span>

                      <span className="ajuda-faq-question">
                        {t(item.pergunta)}
                      </span>

                      <span className="ajuda-faq-chevron">
                        <SvgIcon
                          name="chevronDown"
                          size={21}
                          strokeWidth={2.35}
                        />
                      </span>
                    </summary>

                    <div className="ajuda-faq-answer">
                      <p>{t(item.resposta)}</p>
                    </div>
                  </details>
                );
              })}
            </div>
          ) : (
            <div style={emptyStateStyle}>
              <span style={emptyIconStyle}>
                <SvgIcon name="search" size={28} strokeWidth={2.15} />
              </span>
              <strong style={emptyTitleStyle}>
                {t({
                  pt: "Nenhuma resposta encontrada",
                  en: "No answer found",
                  es: "No se encontró ninguna respuesta",
                })}
              </strong>
              <p style={emptyDescriptionStyle}>
                {t({
                  pt: "Tente pesquisar com outras palavras ou escolha Todas para ver os assuntos disponíveis.",
                  en: "Try different words or choose All to view the available topics.",
                  es: "Prueba con otras palabras o elige Todas para ver los temas disponibles.",
                })}
              </p>
              <button
                type="button"
                className="ajuda-reset-button"
                onClick={() => {
                  setBusca("");
                  setCategoriaAtiva("todos");
                }}
              >
                {t({
                  pt: "Mostrar todas as respostas",
                  en: "Show all answers",
                  es: "Mostrar todas las respuestas",
                })}
              </button>
            </div>
          )}
        </section>

        <section
          id="problema-tecnico"
          style={sectionStyle}
          aria-labelledby="problema-tecnico-titulo"
        >
          <div style={sectionHeadingStyle}>
            <div>
              <span style={sectionKickerStyle}>
                {t({
                  pt: "SUPORTE TÉCNICO",
                  en: "TECHNICAL SUPPORT",
                  es: "SOPORTE TÉCNICO",
                })}
              </span>
              <h2 id="problema-tecnico-titulo" style={sectionTitleStyle}>
                {t({
                  pt: "Relatar um problema técnico",
                  en: "Report a technical issue",
                  es: "Informar un problema técnico",
                })}
              </h2>
            </div>
          </div>

          <div style={supportCardStyle}>
            <div style={supportSeparationNoticeStyle}>
              <span style={supportSeparationIconStyle}>
                <SvgIcon name="settings" size={23} strokeWidth={2.1} />
              </span>
              <div style={supportSeparationTextStyle}>
                <strong>
                  {t({
                    pt: "Falha técnica não é denúncia",
                    en: "A technical issue is not a report",
                    es: "Una falla técnica no es una denuncia",
                  })}
                </strong>
                <p>
                  {t({
                    pt: "Use este formulário para erros, travamentos, páginas que não carregam ou recursos que não funcionam. Para conteúdo, perfis ou comentários que violem as regras, use o botão Denunciar no próprio conteúdo.",
                    en: "Use this form for errors, crashes, pages that do not load, or features that do not work. For content, profiles, or comments that violate the rules, use the Report button on that content.",
                    es: "Usa este formulario para errores, bloqueos, páginas que no cargan o funciones que no funcionan. Para contenido, perfiles o comentarios que infrinjan las reglas, usa el botón Denunciar en ese contenido.",
                  })}
                </p>
              </div>
            </div>

            {mensagemProblema ? (
              <div role="status" style={supportSuccessStyle}>
                {mensagemProblema}
              </div>
            ) : null}

            {erroProblema ? (
              <div role="alert" style={supportErrorStyle}>
                {erroProblema}
              </div>
            ) : null}

            {usuarioAutenticado === false ? (
              <div style={supportLoginNoticeStyle}>
                <span>
                  {t({
                    pt: "Você precisa entrar na conta para enviar e acompanhar chamados.",
                    en: "You need to sign in to submit and track tickets.",
                    es: "Debes iniciar sesión para enviar y seguir casos.",
                  })}
                </span>
                <Link
                  href="/login?redirectTo=%2Fajuda%23problema-tecnico"
                  style={supportLoginLinkStyle}
                >
                  {t({ pt: "Entrar", en: "Sign in", es: "Iniciar sesión" })}
                </Link>
              </div>
            ) : null}

            <form onSubmit={enviarProblemaTecnico} style={supportFormStyle}>
              <div style={supportFormGridStyle}>
                <label style={supportFieldStyle}>
                  <span style={supportLabelStyle}>
                    {t({ pt: "Categoria", en: "Category", es: "Categoría" })}
                  </span>
                  <select
                    className="ajuda-support-control"
                    value={categoriaProblema}
                    onChange={(event) =>
                      setCategoriaProblema(
                        normalizarCategoriaProblemaTecnico(event.target.value),
                      )
                    }
                    disabled={enviandoProblema}
                    style={supportInputStyle}
                  >
                    {CATEGORIAS_PROBLEMA_TECNICO.map((categoria) => (
                      <option key={categoria.valor} value={categoria.valor}>
                        {t(categoria.rotulo)}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={supportFieldStyle}>
                  <span style={supportLabelStyle}>
                    {t({
                      pt: "Página onde aconteceu",
                      en: "Page where it happened",
                      es: "Página donde ocurrió",
                    })}
                  </span>
                  <input
                    className="ajuda-support-control"
                    type="url"
                    value={paginaProblema}
                    onChange={(event) => setPaginaProblema(event.target.value)}
                    maxLength={700}
                    disabled={enviandoProblema}
                    placeholder="https://historietas.com.br/..."
                    style={supportInputStyle}
                  />
                </label>
              </div>

              <label style={supportFieldStyle}>
                <span style={supportLabelStyle}>
                  {t({
                    pt: "Título do problema",
                    en: "Issue title",
                    es: "Título del problema",
                  })}
                </span>
                <input
                  className="ajuda-support-control"
                  type="text"
                  value={tituloProblema}
                  onChange={(event) => setTituloProblema(event.target.value)}
                  maxLength={120}
                  disabled={enviandoProblema}
                  placeholder={t({
                    pt: "Ex.: o capítulo não abre",
                    en: "E.g.: the chapter will not open",
                    es: "Ej.: el capítulo no se abre",
                  })}
                  style={supportInputStyle}
                />
                <span style={supportCounterStyle}>
                  {tituloProblema.length}/120
                </span>
              </label>

              <label style={supportFieldStyle}>
                <span style={supportLabelStyle}>
                  {t({
                    pt: "O que aconteceu?",
                    en: "What happened?",
                    es: "¿Qué ocurrió?",
                  })}
                </span>
                <textarea
                  className="ajuda-support-control"
                  value={descricaoProblema}
                  onChange={(event) => setDescricaoProblema(event.target.value)}
                  maxLength={3000}
                  rows={6}
                  disabled={enviandoProblema}
                  placeholder={t({
                    pt: "Explique o que tentou fazer, o que apareceu na tela e se o problema continua acontecendo.",
                    en: "Explain what you tried to do, what appeared on screen, and whether the problem is still happening.",
                    es: "Explica qué intentaste hacer, qué apareció en pantalla y si el problema continúa.",
                  })}
                  style={supportTextareaStyle}
                />
                <span style={supportCounterStyle}>
                  {descricaoProblema.length}/3000
                </span>
              </label>

              <div style={supportFormActionsStyle}>
                <span style={supportEnvironmentNoteStyle}>
                  {t({
                    pt: "O navegador e o tamanho da tela serão enviados automaticamente para ajudar no diagnóstico.",
                    en: "Your browser and screen size will be sent automatically to help diagnose the issue.",
                    es: "El navegador y el tamaño de pantalla se enviarán automáticamente para ayudar en el diagnóstico.",
                  })}
                </span>
                <button
                  type="submit"
                  className="ajuda-submit-ticket-button"
                  disabled={enviandoProblema || usuarioAutenticado === false}
                >
                  {enviandoProblema
                    ? t({ pt: "Enviando...", en: "Submitting...", es: "Enviando..." })
                    : t({
                        pt: "Enviar problema técnico",
                        en: "Submit technical issue",
                        es: "Enviar problema técnico",
                      })}
                </button>
              </div>
            </form>

            {usuarioAutenticado &&
            (carregandoChamados || chamadosTecnicos.length > 0) ? (
              <div style={supportTicketsSectionStyle}>
                <div style={supportTicketsHeadingStyle}>
                  <strong>
                    {t({
                      pt: "Meus chamados recentes",
                      en: "My recent tickets",
                      es: "Mis casos recientes",
                    })}
                  </strong>
                  {carregandoChamados ? (
                    <span>
                      {t({ pt: "Carregando...", en: "Loading...", es: "Cargando..." })}
                    </span>
                  ) : null}
                </div>

                {!carregandoChamados ? (
                  <div style={supportTicketsListStyle}>
                    {chamadosTecnicos.map((chamado) => (
                      <article key={chamado.id} style={supportTicketStyle}>
                        <div style={supportTicketHeaderStyle}>
                          <strong style={supportTicketTitleStyle}>
                            {chamado.titulo}
                          </strong>
                          <span style={supportTicketStatusStyle}>
                            {rotuloStatusProblema(chamado.status)}
                          </span>
                        </div>
                        <p style={supportTicketDescriptionStyle}>
                          {chamado.descricao}
                        </p>
                        {chamado.observacaoAdmin ? (
                          <div style={supportAdminNoteStyle}>
                            <strong>
                              {t({
                                pt: "Resposta da equipe",
                                en: "Team response",
                                es: "Respuesta del equipo",
                              })}
                            </strong>
                            <span>{chamado.observacaoAdmin}</span>
                          </div>
                        ) : null}
                        <span style={supportTicketDateStyle}>
                          {formatarDataChamado(chamado.criadoEm)}
                        </span>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <section style={sectionStyle} aria-labelledby="atalhos-ajuda-titulo">
          <div style={sectionHeadingStyle}>
            <div>
              <span style={sectionKickerStyle}>
                {t({
                  pt: "ACESSO RÁPIDO",
                  en: "QUICK ACCESS",
                  es: "ACCESO RÁPIDO",
                })}
              </span>
              <h2 id="atalhos-ajuda-titulo" style={sectionTitleStyle}>
                {t({
                  pt: "Atalhos úteis",
                  en: "Useful shortcuts",
                  es: "Accesos útiles",
                })}
              </h2>
            </div>
          </div>

          <div style={shortcutsGridStyle}>
            {ATALHOS_AJUDA.map((atalho) => (
              <Link
                key={atalho.href}
                href={atalho.href}
                className="ajuda-shortcut-link"
              >
                <span className="ajuda-shortcut-icon">
                  <SvgIcon name={atalho.icon} size={23} strokeWidth={2.05} />
                </span>
                <span className="ajuda-shortcut-copy">
                  <strong>{t(atalho.titulo)}</strong>
                  <span>{t(atalho.descricao)}</span>
                </span>
                <span className="ajuda-shortcut-arrow">
                  <SvgIcon name="arrowRight" size={20} strokeWidth={2.25} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <aside style={noticeStyle}>
          <span style={noticeIconStyle}>
            <SvgIcon name="shield" size={24} strokeWidth={2.1} />
          </span>
          <div style={noticeTextStyle}>
            <strong>
              {t({
                pt: "Orientações da versão atual",
                en: "Current version guidance",
                es: "Orientaciones de la versión actual",
              })}
            </strong>
            <p>
              {t({
                pt: "Esta central descreve os recursos que já estão disponíveis no Historietas. Novas respostas serão adicionadas conforme a plataforma receber atualizações.",
                en: "This center describes features already available in Historietas. New answers will be added as the platform receives updates.",
                es: "Este centro describe las funciones que ya están disponibles en Historietas. Se agregarán nuevas respuestas a medida que la plataforma reciba actualizaciones.",
              })}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

const ajudaPageCss = `
  [data-historietas-ajuda-root="true"] {
    --ajuda-card: color-mix(in srgb, var(--historietas-surface, #120C1E) 88%, transparent);
    --ajuda-card-strong: color-mix(in srgb, var(--historietas-surface-strong, #120C1E) 94%, transparent);
    --ajuda-control: color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent);
    --ajuda-control-hover: color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 12%, transparent);
    --ajuda-border: var(--historietas-border-soft, rgba(255,255,255,0.10));
    --ajuda-muted: var(--historietas-text-secondary, #D4D4D8);
  }

  [data-historietas-ajuda-root="true"] .ajuda-search-input {
    appearance: none;
  }

  [data-historietas-ajuda-root="true"] .ajuda-search-input::-webkit-search-cancel-button {
    appearance: none;
  }

  [data-historietas-ajuda-root="true"] .ajuda-search-input::placeholder {
    color: color-mix(in srgb, var(--ajuda-muted) 70%, transparent);
    opacity: 1;
  }

  [data-historietas-ajuda-root="true"] .ajuda-clear-button {
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--ajuda-control);
    color: var(--historietas-text-primary, #FFFFFF);
    font: inherit;
    font-size: 21px;
    line-height: 1;
    cursor: pointer;
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-button {
    width: 100%;
    min-height: 82px;
    border: 1px solid var(--ajuda-border);
    border-radius: 17px;
    padding: 13px;
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    align-items: center;
    gap: 11px;
    background: var(--ajuda-card);
    color: var(--historietas-text-primary, #FFFFFF);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-button:hover {
    transform: translateY(-1px);
    background: var(--ajuda-control-hover);
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-button[data-active="true"] {
    border-color: color-mix(in srgb, var(--historietas-secondary, #7C3AED) 75%, white 8%);
    background: color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, var(--ajuda-card-strong));
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-icon,
  [data-historietas-ajuda-root="true"] .ajuda-shortcut-icon {
    width: 40px;
    height: 40px;
    border-radius: 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--ajuda-control);
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-button[data-active="true"] .ajuda-category-icon {
    background: var(--historietas-secondary, #7C3AED);
    color: #FFFFFF;
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-copy,
  [data-historietas-ajuda-root="true"] .ajuda-shortcut-copy {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-copy strong,
  [data-historietas-ajuda-root="true"] .ajuda-shortcut-copy strong {
    color: var(--historietas-text-primary, #FFFFFF);
    font-size: 14px;
    line-height: 1.15;
    font-weight: 820;
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-copy span,
  [data-historietas-ajuda-root="true"] .ajuda-shortcut-copy span {
    color: var(--ajuda-muted);
    font-size: 12px;
    line-height: 1.32;
    font-weight: 560;
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-details {
    border: 1px solid var(--ajuda-border);
    border-radius: 16px;
    background: var(--ajuda-card);
    overflow: hidden;
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-details[open] {
    background: var(--ajuda-card-strong);
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-summary {
    min-height: 64px;
    padding: 13px 14px;
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr) 30px;
    align-items: center;
    gap: 11px;
    color: var(--historietas-text-primary, #FFFFFF);
    cursor: pointer;
    list-style: none;
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-summary::-webkit-details-marker {
    display: none;
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-icon {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--ajuda-control);
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-question {
    min-width: 0;
    color: var(--historietas-text-primary, #FFFFFF);
    font-size: 14px;
    line-height: 1.3;
    font-weight: 760;
    overflow-wrap: anywhere;
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-chevron {
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--ajuda-muted);
    transition: transform 180ms ease;
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-details[open] .ajuda-faq-chevron {
    transform: rotate(180deg);
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-answer {
    padding: 0 16px 16px 63px;
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-answer p {
    margin: 0;
    padding-top: 13px;
    border-top: 1px solid var(--ajuda-border);
    color: var(--ajuda-muted);
    font-size: 13px;
    line-height: 1.62;
    font-weight: 540;
    overflow-wrap: anywhere;
  }

  [data-historietas-ajuda-root="true"] .ajuda-reset-button {
    min-height: 42px;
    border: 1px solid var(--ajuda-border);
    border-radius: 12px;
    padding: 9px 14px;
    background: var(--historietas-secondary, #7C3AED);
    color: #FFFFFF;
    font: inherit;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
  }

  [data-historietas-ajuda-root="true"] .ajuda-shortcut-link {
    min-height: 76px;
    border: 1px solid var(--ajuda-border);
    border-radius: 16px;
    padding: 12px;
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) 26px;
    align-items: center;
    gap: 10px;
    background: var(--ajuda-card);
    color: inherit;
    text-decoration: none;
    transition: transform 160ms ease, background 160ms ease;
  }

  [data-historietas-ajuda-root="true"] .ajuda-shortcut-link:hover {
    transform: translateY(-1px);
    background: var(--ajuda-control-hover);
  }

  [data-historietas-ajuda-root="true"] .ajuda-shortcut-arrow {
    width: 26px;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--ajuda-muted);
  }

  [data-historietas-ajuda-root="true"] .ajuda-support-control {
    transition: border-color 160ms ease, background 160ms ease;
  }

  [data-historietas-ajuda-root="true"] .ajuda-support-control:focus {
    border-color: var(--historietas-secondary, #7C3AED) !important;
  }

  [data-historietas-ajuda-root="true"] .ajuda-support-control::placeholder {
    color: color-mix(in srgb, var(--ajuda-muted) 68%, transparent);
    opacity: 1;
  }

  [data-historietas-ajuda-root="true"] .ajuda-submit-ticket-button {
    min-height: 44px;
    border: 0;
    border-radius: 13px;
    padding: 10px 16px;
    background: var(--historietas-secondary, #7C3AED);
    color: #FFFFFF;
    font: inherit;
    font-size: 13px;
    font-weight: 850;
    cursor: pointer;
  }

  [data-historietas-ajuda-root="true"] .ajuda-submit-ticket-button:disabled {
    opacity: 0.52;
    cursor: not-allowed;
  }

  html[data-historietas-tema-visual="foco"] [data-historietas-ajuda-root="true"] {
    --ajuda-card: #050505;
    --ajuda-card-strong: #000000;
    --ajuda-control: rgba(255,255,255,0.08);
    --ajuda-control-hover: rgba(255,255,255,0.10);
    --ajuda-border: rgba(255,255,255,0.18);
    --ajuda-muted: #A1A1AA;
  }

  html[data-historietas-tema-visual="foco"] [data-historietas-ajuda-root="true"] .ajuda-category-button[data-active="true"] {
    border-color: #FFFFFF;
    background: #000000;
  }

  html[data-historietas-tema-visual="foco"] [data-historietas-ajuda-root="true"] .ajuda-category-button[data-active="true"] .ajuda-category-icon,
  html[data-historietas-tema-visual="foco"] [data-historietas-ajuda-root="true"] .ajuda-reset-button {
    background: #FFFFFF;
    color: #000000;
  }

  @media (max-width: 680px) {
    [data-historietas-ajuda-root="true"] .ajuda-faq-answer {
      padding-left: 14px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [data-historietas-ajuda-root="true"] *,
    [data-historietas-ajuda-root="true"] *::before,
    [data-historietas-ajuda-root="true"] *::after {
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
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
  width: "min(920px, calc(100% - 32px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "16px 0 124px",
  boxSizing: "border-box",
};

const headerStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr)",
  alignItems: "center",
  gap: "11px",
  marginBottom: "17px",
};

const backButtonStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
};

const headerTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "2px",
};

const eyebrowStyle: CSSProperties = {
  color: "var(--historietas-secondary, #7C3AED)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: "0.16em",
};

const pageTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(21px, 5vw, 27px)",
  lineHeight: 1.08,
  fontWeight: 900,
  letterSpacing: "-0.04em",
};

const heroStyle: CSSProperties = {
  borderRadius: "24px",
  padding: "clamp(18px, 4vw, 28px)",
  display: "grid",
  gridTemplateColumns: "50px minmax(0, 1fr)",
  gap: "13px",
  background:
    "linear-gradient(145deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 26%, var(--historietas-surface-strong, #120C1E)) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, var(--historietas-surface-strong, #120C1E)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  marginBottom: "26px",
};

const heroIconStyle: CSSProperties = {
  width: "50px",
  height: "50px",
  borderRadius: "16px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.10)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const heroTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  alignContent: "center",
  gap: "6px",
};

const heroTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(24px, 6vw, 38px)",
  lineHeight: 1.02,
  fontWeight: 900,
  letterSpacing: "-0.055em",
};

const heroDescriptionStyle: CSSProperties = {
  margin: 0,
  maxWidth: "660px",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "14px",
  lineHeight: 1.5,
  fontWeight: 560,
};

const searchBoxStyle: CSSProperties = {
  gridColumn: "1 / -1",
  minHeight: "52px",
  marginTop: "8px",
  borderRadius: "16px",
  padding: "0 12px 0 15px",
  display: "grid",
  gridTemplateColumns: "24px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "10px",
  background: "var(--historietas-input-bg, #18181B)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "50px",
  border: 0,
  outline: "none",
  background: "transparent",
  color: "var(--historietas-input-text, #FFFFFF)",
  font: "inherit",
  fontSize: "15px",
  fontWeight: 650,
};

const sectionStyle: CSSProperties = {
  marginBottom: "27px",
};

const sectionHeadingStyle: CSSProperties = {
  display: "flex",
  alignItems: "end",
  justifyContent: "space-between",
  gap: "14px",
  marginBottom: "12px",
};

const sectionKickerStyle: CSSProperties = {
  display: "block",
  marginBottom: "4px",
  color: "var(--historietas-secondary, #7C3AED)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: "0.14em",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(18px, 4.5vw, 22px)",
  lineHeight: 1.1,
  fontWeight: 870,
  letterSpacing: "-0.035em",
};

const resultsCountStyle: CSSProperties = {
  flex: "0 0 auto",
  padding: "7px 10px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 7%, transparent)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 760,
};

const categoriesGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(210px, 100%), 1fr))",
  gap: "10px",
};

const faqListStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
};

const emptyStateStyle: CSSProperties = {
  minHeight: "240px",
  borderRadius: "19px",
  padding: "28px 18px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  background: "color-mix(in srgb, var(--historietas-surface, #120C1E) 88%, transparent)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
};

const emptyIconStyle: CSSProperties = {
  width: "52px",
  height: "52px",
  marginBottom: "13px",
  borderRadius: "16px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const emptyTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "17px",
  lineHeight: 1.15,
  fontWeight: 850,
};

const emptyDescriptionStyle: CSSProperties = {
  maxWidth: "520px",
  margin: "8px 0 16px",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.5,
  fontWeight: 540,
};

const shortcutsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
  gap: "10px",
};

const supportCardStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
  padding: "clamp(15px, 3vw, 22px)",
  borderRadius: "20px",
  background: "color-mix(in srgb, var(--historietas-surface, #120C1E) 90%, transparent)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
};

const supportSeparationNoticeStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr)",
  gap: "11px",
  padding: "13px",
  borderRadius: "15px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
};

const supportSeparationIconStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "13px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const supportSeparationTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "4px",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.45,
};

const supportSuccessStyle: CSSProperties = {
  padding: "11px 13px",
  borderRadius: "12px",
  background: "rgba(34,197,94,0.12)",
  border: "1px solid rgba(34,197,94,0.28)",
  color: "#BBF7D0",
  fontSize: "13px",
  lineHeight: 1.4,
  fontWeight: 680,
};

const supportErrorStyle: CSSProperties = {
  padding: "11px 13px",
  borderRadius: "12px",
  background: "rgba(239,68,68,0.12)",
  border: "1px solid rgba(239,68,68,0.28)",
  color: "#FCA5A5",
  fontSize: "13px",
  lineHeight: 1.4,
  fontWeight: 680,
};

const supportLoginNoticeStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  padding: "11px 13px",
  borderRadius: "12px",
  background: "var(--ajuda-control)",
  color: "var(--ajuda-muted)",
  fontSize: "13px",
  lineHeight: 1.4,
};

const supportLoginLinkStyle: CSSProperties = {
  flex: "0 0 auto",
  padding: "8px 11px",
  borderRadius: "10px",
  background: "var(--historietas-secondary, #7C3AED)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 820,
};

const supportFormStyle: CSSProperties = {
  display: "grid",
  gap: "13px",
};

const supportFormGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
  gap: "12px",
};

const supportFieldStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "7px",
};

const supportLabelStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  lineHeight: 1.2,
  fontWeight: 780,
};

const supportInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "44px",
  boxSizing: "border-box",
  border: "1px solid var(--ajuda-border)",
  borderRadius: "12px",
  padding: "10px 12px",
  outline: "none",
  background: "var(--historietas-input-bg, #18181B)",
  color: "var(--historietas-input-text, #FFFFFF)",
  font: "inherit",
  fontSize: "13px",
  fontWeight: 620,
};

const supportTextareaStyle: CSSProperties = {
  ...supportInputStyle,
  minHeight: "132px",
  resize: "vertical",
  lineHeight: 1.5,
};

const supportCounterStyle: CSSProperties = {
  justifySelf: "end",
  color: "var(--ajuda-muted)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 650,
};

const supportFormActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "14px",
  flexWrap: "wrap",
};

const supportEnvironmentNoteStyle: CSSProperties = {
  flex: "1 1 320px",
  color: "var(--ajuda-muted)",
  fontSize: "11px",
  lineHeight: 1.45,
};

const supportTicketsSectionStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  paddingTop: "15px",
  borderTop: "1px solid var(--ajuda-border)",
};

const supportTicketsHeadingStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
};

const supportTicketsListStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
};

const supportTicketStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  padding: "12px",
  borderRadius: "14px",
  background: "var(--ajuda-control)",
  border: "1px solid var(--ajuda-border)",
};

const supportTicketHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
};

const supportTicketTitleStyle: CSSProperties = {
  minWidth: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.25,
  fontWeight: 820,
};

const supportTicketStatusStyle: CSSProperties = {
  flex: "0 0 auto",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 800,
};

const supportTicketDescriptionStyle: CSSProperties = {
  margin: 0,
  color: "var(--ajuda-muted)",
  fontSize: "12px",
  lineHeight: 1.48,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

const supportAdminNoteStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  padding: "9px 10px",
  borderRadius: "10px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 12%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  lineHeight: 1.42,
};

const supportTicketDateStyle: CSSProperties = {
  color: "var(--ajuda-muted)",
  fontSize: "10px",
  lineHeight: 1.2,
};

const noticeStyle: CSSProperties = {
  borderRadius: "18px",
  padding: "15px",
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr)",
  alignItems: "start",
  gap: "12px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 12%, var(--historietas-surface, #120C1E))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
};

const noticeIconStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "13px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const noticeTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "5px",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.45,
};
