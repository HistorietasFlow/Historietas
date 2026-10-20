import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const loadedState = readFileSync(new URL("../../app/seguindo/components/seguindo-page-loaded-state.tsx", import.meta.url), "utf8");
const controls = readFileSync(new URL("../../app/seguindo/components/seguindo-page-controls.tsx", import.meta.url), "utf8");
const toolbar = readFileSync(new URL("../../app/seguindo/components/seguindo-social-toolbar.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-social-toolbar-styles.ts", import.meta.url), "utf8");

test("estilos de barra e abas sociais foram extraídos", () => {
  assert.match(page, /import \{ SeguindoPageLoadedState \} from "\.\/components\/seguindo-page-loaded-state";/);
  assert.match(loadedState, /import \{ SeguindoPageControls \} from "\.\/seguindo-page-controls";/);
  assert.match(controls, /import \{ SeguindoSocialToolbar \} from "\.\/seguindo-social-toolbar";/);
  assert.match(toolbar, /from "\.\.\/lib\/seguindo-social-toolbar-styles";/);
  for (const name of ["socialToolbarStyle", "desktopSocialToolbarStyle", "socialTabsStyle", "socialTabStyle", "socialTabActiveStyle", "mobileThreeSocialTabStyle", "socialTabCountStyle", "mobileThreeSocialTabCountStyle"]) {
    assert.match(styles, new RegExp(`export const ${name}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties =`));
  }
  assert.match(styles, /\.\.\.socialToolbarStyle/);
  assert.match(styles, /\.\.\.socialTabStyle/);
  assert.match(styles, /\.\.\.socialTabCountStyle/);
});

test("barra social preserva abas, contagens e variantes responsivas", () => {
  assert.match(toolbar, /^"use client";/);
  assert.match(toolbar, /export function SeguindoSocialToolbar/);
  assert.match(toolbar, /onClick=\{\(\) => trocarAbaConteudo\("seguidores"\)\}/);
  assert.match(toolbar, /onClick=\{\(\) => trocarAbaConteudo\("obras"\)\}/);
  assert.match(toolbar, /onClick=\{\(\) => trocarAbaConteudo\("pessoas"\)\}/);
  assert.match(toolbar, /Seguidores/);
  assert.match(toolbar, /Obras seguidas/);
  assert.match(toolbar, /Pessoas seguidas/);
  assert.match(toolbar, /totalSeguidores/);
  assert.match(toolbar, /totalObrasSeguidas/);
  assert.match(toolbar, /totalPessoasSeguidas/);
  assert.match(toolbar, /isDesktop \? desktopSocialToolbarStyle : socialToolbarStyle/);
  assert.match(toolbar, /\? desktopSocialTabsStyle/);
  assert.match(toolbar, /gridTemplateColumns: "repeat\(3, minmax\(0, 1fr\)\)"/);
  assert.match(toolbar, /mobileThreeSocialTabStyle/);
  assert.doesNotMatch(toolbar, /supabase|localStorage|useEffect|useState/);
  assert.match(controls, /<SeguindoSocialToolbar\s+isDesktop=\{isDesktop\}/);
});
