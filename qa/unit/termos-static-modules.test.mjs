import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/termos/page.tsx", import.meta.url),
  "utf8",
);
const contentSource = readFileSync(
  new URL("../../app/termos/lib/termos-content.ts", import.meta.url),
  "utf8",
);
const iconSource = readFileSync(
  new URL("../../app/termos/components/TermosSvgIcon.tsx", import.meta.url),
  "utf8",
);
const stylesSource = readFileSync(
  new URL("../../app/termos/styles/termos-page-styles.ts", import.meta.url),
  "utf8",
);

test("conteúdo estático de Termos preserva os contratos e a ordem", () => {
  assert.match(contentSource, /export type TextoTraduzido/);
  assert.match(contentSource, /export type IconName/);
  assert.match(contentSource, /export const DOCUMENTOS_POLITICAS/);
  assert.match(contentSource, /export const PRINCIPIOS_PLATAFORMA/);
  assert.match(contentSource, /export const ETAPAS_LEITURA/);
  assert.match(contentSource, /export const ATALHOS_POLITICAS/);
  assert.match(contentSource, /href: "\/termos-de-uso"/);
  assert.match(contentSource, /href: "\/politica-de-privacidade"/);
  assert.match(contentSource, /href: "\/diretrizes-da-comunidade"/);
  assert.ok(
    contentSource.indexOf('href: "/termos-de-uso"') <
      contentSource.indexOf('href: "/politica-de-privacidade"'),
  );
  assert.ok(
    contentSource.indexOf('href: "/politica-de-privacidade"') <
      contentSource.indexOf('href: "/diretrizes-da-comunidade"'),
  );
  assert.match(contentSource, /href: "\/ajuda"/);
  assert.match(contentSource, /href: "\/configuracoes"/);
  assert.match(contentSource, /if \(language === "en"\)/);
  assert.match(contentSource, /if \(language === "es"\)/);
  assert.match(contentSource, /return texto\.pt;/);
});

test("TermosSvgIcon preserva ícones e acessibilidade", () => {
  assert.match(iconSource, /export function TermosSvgIcon/);
  for (const name of [
    "arrowLeft", "arrowRight", "file", "shield", "users", "scale",
    "book", "lock", "copyright", "check", "help", "settings", "info",
  ]) {
    assert.match(iconSource, new RegExp(`${name}:`));
  }
  assert.match(iconSource, /viewBox="0 0 24 24"/);
  assert.match(iconSource, /aria-hidden="true"/);
  assert.match(iconSource, /focusable="false"/);
  assert.match(iconSource, /d="M19 12H5"/);
  assert.match(iconSource, /d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/);
});

test("estilos estáticos de Termos preservam CSS e integração", () => {
  assert.match(stylesSource, /export const termosPageCss/);
  assert.match(stylesSource, /data-historietas-tema-visual="foco"/);
  assert.match(stylesSource, /prefers-reduced-motion/);
  assert.match(stylesSource, /max-width: 620px/);
  assert.match(stylesSource, /color-mix/);
  assert.match(stylesSource, /export const quickAccessGridStyle/);
  assert.doesNotMatch(pageSource, /const termosPageCss/);
  assert.doesNotMatch(pageSource, /const pageStyle: CSSProperties/);
  assert.match(pageSource, /\{`\$\{historietasThemeCss\}\$\{termosPageCss\}`\}/);
});

test("página mantém linguagem, tema e composição dos componentes", () => {
  assert.match(pageSource, /useHistorietasLanguage/);
  assert.match(pageSource, /useHistorietasTheme/);
  assert.match(pageSource, /function t\(texto: TextoTraduzido\)/);
  assert.match(pageSource, /<TermosHeaderHero t=\{t\} \/>/);
  assert.match(pageSource, /<TermosDocumentosSection t=\{t\} \/>/);
  assert.match(pageSource, /<TermosSupportingSections t=\{t\} \/>/);
  assert.doesNotMatch(pageSource, /DOCUMENTOS_POLITICAS\.map/);
  assert.doesNotMatch(pageSource, /PRINCIPIOS_PLATAFORMA\.map/);
  assert.doesNotMatch(pageSource, /ETAPAS_LEITURA\.map/);
  assert.doesNotMatch(pageSource, /ATALHOS_POLITICAS\.map/);
  assert.doesNotMatch(pageSource, /function SvgIcon/);
});
