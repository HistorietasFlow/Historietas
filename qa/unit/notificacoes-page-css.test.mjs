import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-page-css.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);

test("notificacoesPageCss preserva as regras globais da página", () => {
  assert.match(css, /export const notificacoesPageCss = `/);
  assert.match(css, /@keyframes historietas-loading-spin/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(
    css,
    /html\[data-historietas-notificacoes-overlay-aberto="true"\] body/,
  );
  assert.match(css, /nav:has\(a\[href="\/publicar"\]\)/);
  assert.match(css, /a\[href="\/notificacoes"\]/);
  assert.match(css, /a\[href="\/publicar"\]/);
});

test("pagina consome o stylesheet externo exatamente duas vezes", () => {
  assert.match(
    pagina,
    /import \{ notificacoesPageCss \} from "\.\/lib\/notificacoes-page-css";/,
  );
  assert.doesNotMatch(pagina, /const notificacoesPageCss = `/);

  const consumidor = "<style>{`${historietasThemeCss}${notificacoesPageCss}`}</style>";
  assert.equal(pagina.split(consumidor).length - 1, 2);
});
