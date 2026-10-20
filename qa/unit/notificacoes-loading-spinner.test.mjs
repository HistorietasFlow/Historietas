import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/notificacoes/components/notificacoes-loading-spinner.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);

test("spinner preserva acessibilidade, estilo e consumidor da pagina", () => {
  for (const contrato of [
    '"use client"',
    "role=\"status\"",
    "aria-live=\"polite\"",
    "aria-label={label}",
    "historietas-loading-spinner",
    "aria-hidden=\"true\"",
    "pageStyle",
    "spinnerStyle",
  ]) {
    assert.ok(componente.includes(contrato), "contrato ausente: " + contrato);
  }
  assert.match(pagina, /import NotificacoesLoadingSpinner/);
  assert.match(pagina, /<NotificacoesLoadingSpinner[\s\S]*?pageStyle=\{loadingPageStyle\}[\s\S]*?spinnerStyle=\{loadingSpinnerStyle\}/);
  assert.doesNotMatch(pagina, /function LoadingSpinner\(/);
});
