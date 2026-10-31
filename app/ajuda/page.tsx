"use client";

import { useMemo, useState } from "react";
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
} from "./lib/ajuda-content";
import {
  filtrarPerguntasAjuda,
  obterCategoriaAjudaSelecionada,
} from "./lib/ajuda-faq-derived";
import { useAjudaTechnicalSupport } from "./hooks/use-ajuda-technical-support";

export default function AjudaPage() {
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] =
    useState<CategoriaAjudaId>("todos");
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const {
    categoriaProblema,
    tituloProblema,
    descricaoProblema,
    paginaProblema,
    enviandoProblema,
    mensagemProblema,
    erroProblema,
    usuarioAutenticado,
    carregandoChamados,
    chamadosTecnicos,
    atualizarCategoriaProblema,
    setPaginaProblema,
    setTituloProblema,
    setDescricaoProblema,
    enviarProblemaTecnico,
  } = useAjudaTechnicalSupport(language);

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
            onCategoriaChange={atualizarCategoriaProblema}
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
