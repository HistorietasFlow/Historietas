import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const source = readFileSync(new URL("../../app/painel-autor/lib/painel-autor-desktop-header-style-utils.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../../app/painel-autor/page.tsx", import.meta.url), "utf8");
test("estilos de cabeçalho desktop preservam contratos", () => {
  for (const name of ["safeTextStyle", "desktopCommunityTopStyle", "desktopCommunityTopTitleStyle", "desktopCommunityTopActionsStyle", "desktopCommunitySearchShellStyle", "desktopCommunitySearchIconStyle", "desktopCommunitySearchInputStyle", "desktopCommunityFilterButtonStyle"]) assert.match(source, new RegExp(`export const ${name}`));
  assert.match(source, /\.\.\.safeTextStyle/);
  assert.match(source, /min\(390px, 34vw\)/);
  assert.match(source, /padding: "0 14px 0 42px"/);
});
test("página importa o cabeçalho e mantém consumidores compartilhados", () => {
  assert.match(page, /painel-autor-desktop-header-style-utils/);
  assert.doesNotMatch(page, /const safeTextStyle: CSSProperties/);
  assert.match(page, /\.\.\.safeTextStyle/);
  assert.match(page, /style=\{desktopCommunityTopStyle\}/);
});
