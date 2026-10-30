"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../../lib/supabase/client";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { SvgIcon } from "./components/ajuda-svg-icon";
import {
  AjudaCategoriesSection,
} from "./components/ajuda-categories-section";
import {
  AjudaFaqSection,
} from "./components/ajuda-faq-section";
import {
  AjudaHeaderHero,
} from "./components/ajuda-header-hero";
import {
  AjudaGuidanceNotice,
} from "./components/ajuda-guidance-notice";
import {
  AjudaShortcutsSection,
} from "./components/ajuda-shortcuts-section";
import {
  AjudaSupportTickets,
} from "./components/ajuda-support-tickets";
import {
  ajudaPageCss,
} from "./lib/ajuda-page-css";
import {
  containerStyle,
  pageStyle,
  sectionHeadingStyle,
  sectionKickerStyle,
  sectionStyle,
  sectionTitleStyle,
} from "./lib/ajuda-layout-styles";
import {
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
} from "./lib/ajuda-support-styles";
import {
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
        <AjudaHeaderHero
          busca={busca}
          language={language}
          onBuscaChange={setBusca}
          onLimparBusca={() => setBusca("")}
        />

        <AjudaCategoriesSection
          categoriaAtiva={categoriaAtiva}
          language={language}
          onSelecionarCategoria={setCategoriaAtiva}
        />

        <AjudaFaqSection
          perguntas={perguntasFiltradas}
          categoriaSelecionada={categoriaSelecionada}
          language={language}
          onReset={() => {
            setBusca("");
            setCategoriaAtiva("todos");
          }}
        />

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
              <AjudaSupportTickets
                carregando={carregandoChamados}
                chamados={chamadosTecnicos}
                language={language}
              />
            ) : null}
          </div>
        </section>

        <AjudaShortcutsSection
          language={language}
        />

        <AjudaGuidanceNotice
          language={language}
        />
      </div>
    </main>
  );
}
