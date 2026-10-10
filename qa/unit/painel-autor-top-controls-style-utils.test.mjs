import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-top-controls-style-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);

test("estilos dos controles superiores preservam o contrato visual", () => {
  for (const name of [
    "topFilterButtonStyle",
    "topFilterIconStyle",
    "topSearchButtonStyle",
    "topSearchShellStyle",
    "topSearchInputStyle",
  ]) {
    assert.match(source, new RegExp(`export const ${name}: CSSProperties`));
  }

  assert.match(
    source,
    /import \{ safeTextStyle \} from "\.\/painel-autor-desktop-header-style-utils";/,
  );
  assert.match(source, /\.\.\.safeTextStyle/);
  assert.match(source, /WebkitTapHighlightColor: "transparent"/);
  assert.match(source, /background: "#000000"/);
  assert.match(source, /padding: "0 0 0 13px"/);
  assert.match(source, /letterSpacing: "-0\.025em"/);
});

test("página delega controles superiores sem alterar seus consumidores", () => {
  assert.match(
    page,
    /from "\.\/lib\/painel-autor-top-controls-style-utils";/,
  );
  for (const name of [
    "topFilterButtonStyle",
    "topFilterIconStyle",
    "topSearchButtonStyle",
    "topSearchShellStyle",
    "topSearchInputStyle",
  ]) {
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties`));
    assert.match(page, new RegExp(`\\b${name}\\b`));
  }

  assert.match(page, /style=\{topFilterButtonStyle\}/);
  assert.match(page, /style=\{topSearchShellStyle\}/);
  assert.match(page, /style=\{topSearchInputStyle\}/);
});
