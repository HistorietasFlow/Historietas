import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import typescript from "typescript";
import "./painel-autor-draft-chapters.test.mjs";

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
const Link = ({ children, prefetch, ...props }) => {
  if (prefetch !== undefined) assert.equal(prefetch, false);
  return React.createElement("a", props, children);
};
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
let acoesAbertasNoTeste = false;
dependencies.react = {...React, useState: () => [acoesAbertasNoTeste, () => {}]};
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

test("opções da obra publicada reutilizam o deep link de comentários em desktop e mobile", () => {
  acoesAbertasNoTeste = true;
  try {
    for (const isDesktop of [false, true]) {
      const html = renderToStaticMarkup(React.createElement(ObraPainelCard, {
        obra: {id: "obra-1", titulo: "Obra teste", slug: "obra-teste", autor: "Autora", publicado: true,
          capitulos: [], ultimoCapituloLido: null, visualizacoes: 0, totalCurtidas: 0,
          totalComentarios: 25, totalSalvos: 0, totalSeguidores: 0},
        isDesktop, onAbrirArquivo: () => {}, onCompartilhar: () => {}, onExcluirObra: () => {},
      }));
      assert.match(html, /href="\/obra\/obra-teste\?comentarios=1"[^>]*>Ver comentários<\/a>/);
    }
  } finally { acoesAbertasNoTeste = false; }
});

test("rascunhos confirmados: indicação, destino e Editar capítulo preservado, sem prefetch", () => {
  acoesAbertasNoTeste = true;
  try {
    for (const isDesktop of [false, true]) {
      for (const rascunhosConfirmados of [undefined, { total: 0, primeiro: null },
        { total: 1, primeiro: { id: "rascunho-7", titulo: "Capítulo em rascunho muito longo" } },
        { total: 2, primeiro: { id: "rascunho-7", titulo: "Capítulo em rascunho muito longo" } }]) {
        const html = renderToStaticMarkup(React.createElement(ObraPainelCard, {
          obra: { id: "obra-1", titulo: "Obra publicada", autor: "Autora", publicado: true,
            capitulos: [{ id: "publicado-1", publicado: true }], ultimoCapituloLido: null,
            visualizacoes: 0, totalCurtidas: 0, totalComentarios: 0, totalSalvos: 0, totalSeguidores: 0 },
          rascunhosConfirmados, isDesktop, onAbrirArquivo: () => {}, onCompartilhar: () => {}, onExcluirObra: () => {},
        }));
        assert.match(html, /capituloId=publicado-1[^>]*>Editar capítulo/);
        if (!rascunhosConfirmados) assert.doesNotMatch(html, /em rascunho|Continuar rascunho/);
        else assert.ok(html.includes(`${rascunhosConfirmados.total} ${rascunhosConfirmados.total === 1 ? "capítulo" : "capítulos"} em rascunho`));
        if (rascunhosConfirmados?.primeiro) assert.match(html, /capituloId=rascunho-7[^>]*>Continuar rascunho — Capítulo em rascunho muito longo/);
        else assert.doesNotMatch(html, /Continuar rascunho/);
      }
    }
    assert.match(source, /href=\{`\/editar-capitulo\?obraId=\$\{encodeURIComponent\(obra.id\)\}&capituloId=\$\{encodeURIComponent\(rascunhosConfirmados.primeiro.id\)\}`\}\s+prefetch=\{false\}/);
  } finally { acoesAbertasNoTeste = false; }
});
