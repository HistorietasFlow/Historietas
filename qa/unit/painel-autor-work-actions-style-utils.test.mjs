import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-work-actions-style-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);

test("estilos dos botões de ações preservam o contrato visual", () => {
  for (const name of [
    "actionsGridStyle",
    "openButtonStyle",
    "readButtonStyle",
    "editButtonStyle",
    "chapterButtonStyle",
    "fileButtonStyle",
    "shareButtonStyle",
    "deleteButtonStyle",
    "workCardDotsButtonStyle",
  ]) {
    assert.match(source, new RegExp(`export const ${name}: CSSProperties`));
  }

  assert.match(
    source,
    /import \{ safeTextStyle \} from "\.\/painel-autor-desktop-header-style-utils";/,
  );
  assert.match(source, /WebkitAppearance: "none"/);
  assert.match(source, /minHeight: "44px"/);
  assert.match(source, /padding: "0 30px"/);
  assert.match(source, /\.\.\.openButtonStyle/);
  assert.match(source, /var\(--historietas-danger-button-text, #FFFFFF\)/);
  assert.match(source, /zIndex: 4/);
  assert.match(source, /width: "24px"/);
  assert.match(source, /\.\.\.safeTextStyle/);
});

test("página delega ações mantendo composição desktop e consumidores", () => {
  assert.match(
    page,
    /from "\.\/lib\/painel-autor-work-actions-style-utils";/,
  );

  for (const name of [
    "actionsGridStyle",
    "openButtonStyle",
    "readButtonStyle",
    "editButtonStyle",
    "chapterButtonStyle",
    "fileButtonStyle",
    "shareButtonStyle",
    "deleteButtonStyle",
    "workCardDotsButtonStyle",
  ]) {
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties`));
  }

  assert.match(
    page,
    /const desktopCardActionsGridStyle: CSSProperties = \{\s*\.\.\.actionsGridStyle,/,
  );
  assert.match(page, /style=\{workCardDotsButtonStyle\}/);
  assert.match(
    page,
    /style=\{isDesktop \? desktopCardActionsGridStyle : actionsGridStyle\}/,
  );
  for (const name of [
    "openButtonStyle",
    "readButtonStyle",
    "editButtonStyle",
    "chapterButtonStyle",
    "fileButtonStyle",
    "shareButtonStyle",
    "deleteButtonStyle",
  ]) {
    assert.match(page, new RegExp(`style=\\{${name}\\}`));
  }
});
