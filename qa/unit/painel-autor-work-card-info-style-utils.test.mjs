import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-work-card-info-style-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);

test("estilos de informação dos cards preservam o contrato visual", () => {
  for (const name of [
    "workTitleStyle",
    "authorStyle",
    "workMetaLineStyle",
    "workCardHeartMetaStyle",
    "workCardCommentMetaStyle",
  ]) {
    assert.match(source, new RegExp(`export const ${name}: CSSProperties`));
  }

  assert.match(
    source,
    /import \{ safeTextStyle \} from "\.\/painel-autor-desktop-header-style-utils";/,
  );
  assert.match(source, /WebkitLineClamp: 2/);
  assert.match(source, /textOverflow: "ellipsis"/);
  assert.match(source, /gap: "10px"/);
  assert.match(source, /fontSize: "9px"/);
  assert.match(source, /var\(--historietas-painel-heart-meta, #FFFFFF\)/);
  assert.match(source, /\.\.\.safeTextStyle/);
});

test("página delega estilos de informação sem alterar consumidores", () => {
  assert.match(
    page,
    /from "\.\/lib\/painel-autor-work-card-info-style-utils";/,
  );

  for (const name of [
    "workTitleStyle",
    "authorStyle",
    "workMetaLineStyle",
    "workCardHeartMetaStyle",
    "workCardCommentMetaStyle",
  ]) {
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties`));
  }

  assert.match(page, /<h3 style=\{workTitleStyle\}>\{obra\.titulo\}<\/h3>/);
  assert.match(page, /style=\{authorStyle\}/);
  assert.match(page, /style=\{workMetaLineStyle\}/);
  assert.match(page, /style=\{workCardHeartMetaStyle\}/);
  assert.match(page, /style=\{workCardCommentMetaStyle\}/);
});
