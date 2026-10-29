import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cssPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-page-css.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 move somente o CSS global da página para módulo dedicado", async () => {
  const [css, page] = await Promise.all([
    readFile(cssPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(css, /export const top5PerfilAutorPageCss = `/);

  for (const variable of [
    "--historietas-top5-message",
    "--historietas-top5-purple-page",
    "--historietas-top5-purple-empty",
    "--historietas-top5-purple-cover",
    "--historietas-top5-orange-soft",
    "--historietas-top5-orange-cover",
    "--historietas-top5-orange-border",
  ]) {
    assert.ok(css.includes(variable), `preserva ${variable}`);
  }

  for (const selector of [
    "html {",
    'html[data-historietas-tema-visual="foco"]',
    'html[data-historietas-tema-visual="original"] body',
    'html[data-historietas-tema-visual="foco"] body,',
    'html[data-historietas-tema-visual] input::placeholder',
    'html[data-historietas-tema-visual="foco"] input,',
    '[data-historietas-top5-works-grid="true"]',
  ]) {
    assert.ok(css.includes(selector), `preserva ${selector}`);
  }

  for (const rule of [
    "@media (min-width: 768px)",
    "minmax(138px, 1fr)",
    "row-gap: 12px !important",
    "column-gap: 14px !important",
  ]) {
    assert.ok(css.includes(rule), `preserva ${rule}`);
  }

  assert.match(
    page,
    /import \{ top5PerfilAutorPageCss \} from "\.\/lib\/top5-page-css";/,
  );
  assert.doesNotMatch(page, /const top5PerfilAutorPageCss = `/);
  assert.match(
    page,
    /<style>\{`\$\{historietasThemeCss\}\$\{top5PerfilAutorPageCss\}`\}<\/style>/,
  );

  for (const forbidden of [
    "react",
    "useEffect",
    "supabase",
    "auth",
    "useRouter",
    "localStorage",
    "carregarObras",
    "ObraTop5",
    "<div",
    "CSSProperties",
  ]) {
    assert.doesNotMatch(
      css,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
