// Ensaio visual isolado: fonte real, estados sintéticos, sem servidor/Supabase.
// Não substitui navegação/hidratação da página integrada.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "@playwright/test";
import { carregarFonteStory } from "./story-source-loader.mjs";

const output = resolve("qa/reports/ranking-geral-visual");
await mkdir(output, { recursive: true });
const layout = await readFile("app/layout.tsx", "utf8");
const navCss = layout.match(/\.historietas-bottom-nav\s*\{[^}]+\}/)?.[0];
assert.ok(navCss, "CSS da navegação existente localizado");
const browser = await chromium.launch();
const axe = await readFile(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const resultados = [];
try {
  for (const width of [1440, 390, 320]) {
    const desktop = width >= 1024;
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    await page.route("**/*", route => route.abort());
    const itens = ["O jardim das histórias", "Uma viagem pelas memórias de uma cidade que nunca dorme e pelas histórias que atravessam gerações", "A última biblioteca"].map((titulo, index) => ({
      id: `00000000-0000-0000-0000-00000000000${index + 1}`, slug: "sintetica", titulo,
      posicao: 21 + index, nota: index === 0 ? 4.5 : 4.25, avaliacoes: index === 0 ? 4 : 128,
    }));
    const cursor = { obra: itens[0].id, assinatura: "a".repeat(32) };
    const states = [{ cursor, versao: 1 }, { estado: "ok", itens, proximo: { ...cursor, obra: itens[2].id } }, "pronto"];
    const load = carregarFonteStory({
      react: { ...React, useState: () => [states.shift(), () => {}], useRef: () => ({ current: null }), useEffect: () => {} },
      "next/link": ({ href, children, className }) => React.createElement("a", { href, className }, children),
    });
    const Component = load("app/em-alta/components/ranking-geral-historias.tsx").RankingGeralHistorias;
    const css = load("app/em-alta/lib/em-alta-page-css.ts").emAltaPageCss;
    const styles = load("app/em-alta/lib/em-alta-ranking-visual-style-utils.ts");
    const body = renderToStaticMarkup(React.createElement("main", { style: styles.pageStyle },
      React.createElement("div", { style: desktop ? styles.desktopContainerStyle : styles.containerStyle },
        React.createElement("h1", {style:{fontSize:16,color:"#a1a1aa",fontWeight:500}}, "Em Alta — ensaio visual isolado"),
        React.createElement(Component, { isDesktop: desktop }))));
    await page.setContent(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Ranking Geral — ensaio visual sintético</title><style>body{margin:0}*{box-sizing:border-box}${css}${navCss}.historietas-bottom-nav{display:flex;justify-content:space-around;align-items:center;color:#fff;background:#000;font:12px Arial}.historietas-bottom-nav span{padding:12px 4px}</style></head><body>${body}<nav class="historietas-bottom-nav" aria-label="Navegação inferior simulada"><span>Home</span><span>Explorar</span><span>Publicar</span><span>Biblioteca</span><span>Perfil</span></nav></body></html>`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "sem overflow");
    const back = page.getByRole("button", { name: "Voltar ao início" });
    await back.focus();
    await back.scrollIntoViewIfNeeded();
    const box = await back.boundingBox();
    assert.ok(box.height >= 44 && box.width >= 44, "área de toque");
    const navBox = await page.getByRole("navigation", { name:"Navegação inferior simulada" }).boundingBox();
    console.log(JSON.stringify({width, button:box, bottomNavigation:navBox}));
    await page.screenshot({ path: resolve(output, `${width}-diagnostico.png`) });
    assert.ok(box.y + box.height <= navBox.y, "botão inteiro acima da navegação inferior");
    // Pontos dentro da borda arredondada, não no exterior transparente dos cantos.
    assert.equal(await back.evaluate(element => {
      const r = element.getBoundingClientRect();
      return [[r.left+16,r.top+16],[r.right-16,r.bottom-16],[(r.left+r.right)/2,(r.top+r.bottom)/2]]
        .every(([x,y]) => element.contains(document.elementFromPoint(x,y)));
    }), true, "botão não encoberto pela navegação inferior");
    await page.keyboard.press("Tab");
    assert.equal(await page.getByRole("button", {name:"Próxima página"}).evaluate(el => el === document.activeElement), true);
    assert.equal(await page.getByRole("button", {name:"Próxima página"}).evaluate(el => getComputedStyle(el).outlineStyle), "solid");
    await page.addScriptTag({content:axe});
    const violations = await page.evaluate(async () => (await window.axe.run()).violations.map(v => ({id:v.id,impact:v.impact})));
    assert.deepEqual(violations, [], "axe sem violações no ensaio isolado");
    await page.screenshot({ path: resolve(output, `${width}-paginacao.png`) });
    await page.screenshot({ path: resolve(output, `${width}-completo.png`), fullPage: true });
    resultados.push({ width, overflow:false, touchTarget:box.height, backButtonUncovered:true, keyboardFocus:true });
    await page.close();
  }
} finally { await browser.close(); }
await writeFile(resolve(output, "resultados.json"), JSON.stringify({ tipo:"componente-isolado-sintetico", resultados }, null, 2));
console.log(JSON.stringify(resultados));
