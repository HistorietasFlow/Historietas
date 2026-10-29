import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-main-styles.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);
const worksGridPath = new URL(
  "../../app/perfil-autor/top-5/components/top5-works-grid.tsx",
  import.meta.url,
);

test("Top 5 delega somente os estilos principais restantes", async () => {
  const [styles, page, worksGrid] = await Promise.all([
    readFile(stylesPath, "utf8"),
    readFile(pagePath, "utf8"),
    readFile(worksGridPath, "utf8"),
  ]);

  assert.match(styles, /import type \{ CSSProperties \} from "react";/);

  for (const styleName of [
    "pageStyle",
    "gridSectionStyle",
    "worksGridStyle",
    "top5CardStyle",
    "top5CardSelectedStyle",
    "selectedBadgeStyle",
  ]) {
    assert.match(styles, new RegExp(`export const ${styleName}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${styleName}: CSSProperties =`));
    const consumer = ["pageStyle", "gridSectionStyle"].includes(styleName)
      ? page
      : worksGrid;
    assert.match(consumer, new RegExp(styleName));
  }

  for (const value of [
    'minHeight: "100vh"',
    'padding: "12px 10px 48px"',
    "--historietas-top5-purple-page",
    'maxWidth: "980px"',
    'gridTemplateColumns: "repeat(3, minmax(0, 1fr))"',
    'rowGap: "10px"',
    'columnGap: "10px"',
    'background: "transparent"',
    'cursor: "pointer"',
    'textAlign: "left"',
    'background: "rgba(0,0,0,0.76)"',
    'boxShadow: "0 8px 18px rgba(0,0,0,0.32)"',
  ]) {
    assert.ok(styles.includes(value), `preserva ${value}`);
  }

  assert.match(
    styles,
    /export const top5CardSelectedStyle: CSSProperties = \{\s*\.\.\.top5CardStyle,\s*\};/,
  );
  assert.match(
    page,
    /import \{[\s\S]*gridSectionStyle,[\s\S]*pageStyle,[\s\S]*from "\.\/lib\/top5-main-styles";/,
  );
  assert.match(
    worksGrid,
    /import \{[\s\S]*selectedBadgeStyle,[\s\S]*top5CardSelectedStyle,[\s\S]*top5CardStyle,[\s\S]*worksGridStyle,[\s\S]*from "\.\.\/lib\/top5-main-styles";/,
  );
  assert.match(page, /useHistorietasTheme\(pageStyle\)/);
  assert.doesNotMatch(page, /CSSProperties/);

  for (const forbidden of [
    "useEffect",
    "supabase",
    "auth",
    "useRouter",
    "localStorage",
    "ObraTop5",
    "carregarObras",
    "function ",
    "<div",
    "top5PerfilAutorPageCss",
  ]) {
    assert.doesNotMatch(
      styles,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
