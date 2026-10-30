"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../../lib/supabase/client";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { SvgIcon } from "./components/ajuda-svg-icon";
import {
  ajudaPageCss,
} from "./lib/ajuda-page-css";
import {
  backButtonStyle,
  categoriesGridStyle,
  containerStyle,
  emptyDescriptionStyle,
  emptyIconStyle,
  emptyStateStyle,
  emptyTitleStyle,
  eyebrowStyle,
  faqListStyle,
  headerStyle,
  headerTextStyle,
  heroDescriptionStyle,
  heroIconStyle,
  heroStyle,
  heroTextStyle,
  heroTitleStyle,
  noticeIconStyle,
  noticeStyle,
  noticeTextStyle,
  pageStyle,
  pageTitleStyle,
  resultsCountStyle,
  searchBoxStyle,
  searchInputStyle,
  sectionHeadingStyle,
  sectionKickerStyle,
  sectionStyle,
  sectionTitleStyle,
  shortcutsGridStyle,
} from "./lib/ajuda-layout-styles";
import {
  supportAdminNoteStyle,
  supportCardStyle,
  supportCounterStyle,
  supportEnvironmentNoteStyle,
  supportErrorStyle,
  supportFieldStyle,
  supportFormActionsStyle,
  supportFormGridStyle,
  supportFormStyle,
  supportInputStyle,
  supportLabelStyle,
  supportLoginLinkStyle,
  supportLoginNoticeStyle,
  supportSeparationIconStyle,
  supportSeparationNoticeStyle,
  supportSeparationTextStyle,
  supportSuccessStyle,
  supportTextareaStyle,
  supportTicketDateStyle,
  supportTicketDescriptionStyle,
  supportTicketHeaderStyle,
  supportTicketStatusStyle,
  supportTicketStyle,
  supportTicketTitleStyle,
  supportTicketsHeadingStyle,
  supportTicketsListStyle,
  supportTicketsSectionStyle,
} from "./lib/ajuda-support-styles";
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
} from "./lib/ajuda-technical-support";
import {
  formatarDataChamado,
  rotuloStatusProblema,
  traduzirTexto,
} from "./lib/ajuda-display-utils";
import {
  filtrarPerguntasAjuda,
  obterCategoriaAjudaSelecionada,
} from "./lib/ajuda-faq-derived";
import {
  normalizarCategoriaProblemaTecnico,
  normalizarProblemasTecnicos,
} from "./lib/ajuda-technical-support-normalizers";

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

      const chamados =
        normalizarProblemasTecnicos(
          registros,
        );

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

  const perguntasFiltradas =
    useMemo(() => {
      return filtrarPerguntasAjuda({
        perguntas: PERGUNTAS_AJUDA,
        busca,
        categoriaAtiva,
        language,
      });
    }, [
      busca,
      categoriaAtiva,
      language,
    ]);

  const categoriaSelecionada =
    obterCategoriaAjudaSelecionada(
      CATEGORIAS_AJUDA,
      categoriaAtiva,
    );

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
                            {rotuloStatusProblema(chamado.status, language)}
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
                          {formatarDataChamado(chamado.criadoEm, language)}
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
