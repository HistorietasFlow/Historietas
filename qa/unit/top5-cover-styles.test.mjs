import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-cover-styles.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente os estilos e helpers visuais de capa", async () => {
  const [styles, page] = await Promise.all([
    readFile(stylesPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(styles, /import type \{ CSSProperties \} from "react";/);
  assert.match(styles, /export function criarCapaTop5Style/);
  assert.match(styles, /export function criarCapaSelecionadaTop5Style/);

  for (const privateStyle of [
    "const selectedCoverStyle",
    "const selectedCoverEmptyStyle",
    "const top5CoverStyle",
    "const top5CoverEmptyStyle",
  ]) {
    assert.match(styles, new RegExp(privateStyle));
    assert.doesNotMatch(styles, new RegExp(`export ${privateStyle}`));
    assert.doesNotMatch(page, new RegExp(privateStyle));
  }

  assert.match(styles, /if \(!capa\)/);
  assert.match(styles, /backgroundImage: `url\(\$\{capa\}\)`/);
  assert.match(styles, /backgroundSize: "cover"/);
  assert.match(styles, /backgroundPosition: "center"/);

  for (const value of [
    'aspectRatio: "3 / 4"',
    'borderRadius: "12px"',
    'background: "#09090B"',
    'border: "none"',
    'boxShadow: "none"',
    "--historietas-top5-purple-empty",
    "--historietas-top5-orange-soft",
    "--historietas-top5-purple-cover",
    "--historietas-top5-orange-cover",
  ]) {
    assert.ok(styles.includes(value), `preserva ${value}`);
  }

  assert.match(
    page,
    /import \{\s*criarCapaSelecionadaTop5Style,\s*criarCapaTop5Style,\s*\} from "\.\/lib\/top5-cover-styles";/s,
  );
  assert.doesNotMatch(page, /function criarCapaTop5Style/);
  assert.doesNotMatch(page, /function criarCapaSelecionadaTop5Style/);
  assert.match(page, /criarCapaSelecionadaTop5Style\(obra\.capa\)/);
  assert.match(page, /criarCapaTop5Style\(obra\.capa\)/);
  assert.match(page, /import type \{ CSSProperties \} from "react";/);
  assert.match(
    page,
    /import \{[\s\S]*selectedSlotStyle,[\s\S]*from "\.\/lib\/top5-selected-section-styles";/,
  );
  assert.doesNotMatch(page, /const selectedSlotStyle: CSSProperties/);
  assert.match(page, /const top5CardStyle: CSSProperties/);

  for (const forbidden of [
    "useEffect",
    "supabase",
    "auth",
    "useRouter",
    "localStorage",
    "carregarObras",
    "ObraTop5",
    "<div",
  ]) {
    assert.doesNotMatch(
      styles,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
