import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cssPath = new URL(
  "../../app/em-breve/lib/em-breve-page-css.ts",
  import.meta.url,
);
const pagePath = new URL("../../app/em-breve/page.tsx", import.meta.url);

test("o CSS global de Em Breve fica no módulo dedicado", async () => {
  const cssModule = await readFile(cssPath, "utf8");
  const page = await readFile(pagePath, "utf8");

  assert.match(cssModule, /export const emBrevePageCss = `/);
  assert.match(
    page,
    /import \{ emBrevePageCss \} from "\.\/lib\/em-breve-page-css"/,
  );
  assert.doesNotMatch(page, /const emBrevePageCss\s*=/);
  assert.match(page, /<style>\{`\$\{historietasThemeCss\}\$\{emBrevePageCss\}`\}<\/style>/);

  for (const trecho of [
    "--historietas-em-breve-bg-page",
    "--historietas-em-breve-bg-deep",
    "--historietas-em-breve-surface",
    "--historietas-em-breve-notification-badge-bg",
    "--historietas-em-breve-notification-badge-text",
    "--historietas-em-breve-panel",
    "--historietas-em-breve-panel-strong",
    'html[data-historietas-tema-visual="original"] body',
    'html[data-historietas-tema-visual="original"] main',
    'a[href="/publicar"]',
    ".historietas-theme-logo-text",
    ".historietas-theme-title",
    "!important",
  ]) {
    assert.ok(cssModule.includes(trecho), `mantém ${trecho}`);
  }

  assert.equal((cssModule.match(/^  html \{$/gm) || []).length, 2);
  assert.match(
    cssModule,
    /--historietas-em-breve-notification-badge-text: #FFFFFF/,
  );
  assert.match(
    cssModule,
    /--historietas-em-breve-notification-badge-text: #000000/,
  );
  assert.doesNotMatch(
    cssModule,
    /from "react"|supabase|router|use(?:Effect|Memo|State)|localStorage/,
  );
});
