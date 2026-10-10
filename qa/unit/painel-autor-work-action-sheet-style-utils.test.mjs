import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-work-action-sheet-style-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);

test("estilos do painel de ações preservam o contrato visual", () => {
  for (const name of [
    "workActionSheetOverlayStyle",
    "workActionSheetStyle",
    "workActionSheetHandleStyle",
    "workActionSheetHeaderStyle",
    "workActionSheetTextBlockStyle",
    "workActionSheetTitleStyle",
  ]) {
    assert.match(source, new RegExp(`export const ${name}: CSSProperties`));
  }

  assert.match(
    source,
    /import \{ safeTextStyle \} from "\.\/painel-autor-desktop-header-style-utils";/,
  );
  assert.match(source, /height: "100dvh"/);
  assert.match(source, /zIndex: 9998/);
  assert.match(source, /touchAction: "none"/);
  assert.match(source, /maxHeight: "calc\(100dvh - 190px\)"/);
  assert.match(source, /borderRadius: "24px 24px 0 0"/);
  assert.match(source, /width: "72px"/);
  assert.match(source, /letterSpacing: "-0\.04em"/);
  assert.match(source, /\.\.\.safeTextStyle/);
});

test("página delega estilos do painel mantendo todos os consumidores", () => {
  assert.match(
    page,
    /from "\.\/lib\/painel-autor-work-action-sheet-style-utils";/,
  );

  for (const name of [
    "workActionSheetOverlayStyle",
    "workActionSheetStyle",
    "workActionSheetHandleStyle",
    "workActionSheetHeaderStyle",
    "workActionSheetTextBlockStyle",
    "workActionSheetTitleStyle",
  ]) {
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties`));
    assert.match(page, new RegExp(`style=\\{${name}\\}`));
  }
});
