"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../../lib/supabase/client";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
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
  AjudaSupportMessages,
} from "./components/ajuda-support-messages";
import {
  AjudaSupportSectionShell,
} from "./components/ajuda-support-section-shell";
import {
  AjudaTechnicalSupportForm,
} from "./components/ajuda-technical-support-form";
import {
  ajudaPageCss,
} from "./lib/ajuda-page-css";
import {
  containerStyle,
  pageStyle,
} from "./lib/ajuda-layout-styles";
import {
  CATEGORIAS_AJUDA,
  PERGUNTAS_AJUDA,
  type CategoriaAjudaId,
  type TextoTraduzido,
} from "./lib/ajuda-content";
import {
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

        <AjudaSupportSectionShell
          language={language}
        >
          <AjudaSupportMessages
            mensagem={mensagemProblema}
            erro={erroProblema}
            usuarioAutenticado={usuarioAutenticado}
            language={language}
          />

          <AjudaTechnicalSupportForm
            categoria={categoriaProblema}
            pagina={paginaProblema}
            titulo={tituloProblema}
            descricao={descricaoProblema}
            enviando={enviandoProblema}
            usuarioAutenticado={usuarioAutenticado}
            language={language}
            onCategoriaChange={(valor) =>
              setCategoriaProblema(
                normalizarCategoriaProblemaTecnico(
                  valor,
                ),
              )
            }
            onPaginaChange={setPaginaProblema}
            onTituloChange={setTituloProblema}
            onDescricaoChange={setDescricaoProblema}
            onSubmit={enviarProblemaTecnico}
          />

          {usuarioAutenticado &&
            (carregandoChamados || chamadosTecnicos.length > 0) ? (
            <AjudaSupportTickets
              carregando={carregandoChamados}
              chamados={chamadosTecnicos}
              language={language}
            />
          ) : null}
        </AjudaSupportSectionShell>

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
