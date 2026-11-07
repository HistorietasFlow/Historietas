import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/painel-autor/components/painel-autor-work-card.tsx", import.meta.url),
  "utf8",
);
const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.CommonJS,
    target: typescript.ScriptTarget.ES2022,
    jsx: typescript.JsxEmit.React,
  },
}).outputText;
const Link = ({ children, ...props }) => React.createElement("a", props, children);
const styles = new Proxy({}, { get: () => ({}) });
const dependencies = {
  "next/link": { __esModule: true, default: Link },
  react: React,
  "../../../lib/utils": { criarSlugBase: () => "obra-teste" },
  "../hooks/use-painel-autor-work-actions-body-lock": {
    usePainelAutorWorkActionsBodyLock: () => {},
  },
  "../lib/painel-autor-cover-style-utils": {
    criarPainelCoverDesktopStyle: () => ({}),
    criarPainelCoverStyle: () => ({}),
  },
  "../lib/painel-autor-work-card-layout-style-utils": styles,
  "../lib/painel-autor-work-card-info-style-utils": styles,
  "../lib/painel-autor-work-card-stats-style-utils": styles,
  "../lib/painel-autor-work-actions-style-utils": styles,
  "../lib/painel-autor-work-action-sheet-style-utils": styles,
  "../lib/painel-autor-desktop-compositions-style-utils": styles,
  "../lib/painel-autor-work-status-utils": {
    obterStatusPainelAutor: () => "Publicada",
    obraPublicadaComConteudoPainel: () => true,
  },
  "../lib/painel-autor-route-utils": {
    criarHrefLeituraCapituloPainel: () => "",
    criarPerfilAutorHref: () => "/perfil-autor",
  },
  "../lib/painel-autor-reading-progress-utils": {
    obterCapitulosPublicadosPainel: () => [],
  },
};
const compiledModule = { exports: {} };
new Function("require", "module", "exports", "React", javascript)(
  (name) => {
    assert.ok(Object.hasOwn(dependencies, name), `dependência inesperada: ${name}`);
    return dependencies[name];
  },
  compiledModule,
  compiledModule.exports,
  React,
);
const { ObraPainelCard } = compiledModule.exports;

test("card do autor mostra seguidores da obra em mobile e desktop sem dados individuais", () => {
  for (const isDesktop of [false, true]) {
    const html = renderToStaticMarkup(React.createElement(ObraPainelCard, {
      obra: {
        id: "obra-1",
        titulo: "Obra teste",
        autor: "Autora",
        capa: "",
        publicado: true,
        capitulos: [],
        ultimoCapituloLido: null,
        visualizacoes: 7,
        totalCurtidas: 4,
        totalComentarios: 3,
        totalSalvos: 2,
        totalSeguidores: 9,
      },
      isDesktop,
      onAbrirArquivo: () => {},
      onCompartilhar: () => {},
      onExcluirObra: () => {},
    }));

    assert.match(html, /aria-label="Seguidores da obra: 9"/);
    assert.match(html, /👥 9/);
    assert.doesNotMatch(html, /user_id|email|seguidor_id/);
  }
});
