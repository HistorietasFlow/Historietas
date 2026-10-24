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
const workCardSource = readFileSync(
  new URL(
    "../../app/painel-autor/components/painel-autor-work-card.tsx",
    import.meta.url,
  ),
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
    workCardSource,
    /from "\.\.\/lib\/painel-autor-work-card-info-style-utils";/,
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

  assert.match(
    page,
    /import \{ ObraPainelCard \} from "\.\/components\/painel-autor-work-card";/,
  );
  assert.doesNotMatch(page, /function ObraPainelCard\(/);
  assert.match(workCardSource, /<h3 style=\{workTitleStyle\}>\{obra\.titulo\}<\/h3>/);
  assert.match(workCardSource, /style=\{authorStyle\}/);
  assert.match(workCardSource, /style=\{workMetaLineStyle\}/);
  assert.match(workCardSource, /style=\{workCardHeartMetaStyle\}/);
  assert.match(workCardSource, /style=\{workCardCommentMetaStyle\}/);
});
