import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const callbacks = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-sorting-action-callbacks.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);

test("callbacks do painel preservam cada acao antes de fechar a ordenacao", () => {
  for (const contrato of [
    "export function criarAcoesPainelOrdenacaoNotificacoes",
    "function onMarcarTodasComoLidas() {\n    marcarTodasComoLidas();\n    setMostrarPainelOrdenacao(false);\n  }",
    "function onMarcarFiltradasComoLidas() {\n    marcarFiltradasComoLidas();\n    setMostrarPainelOrdenacao(false);\n  }",
    "function onLimparLidas() {\n    limparLidas();\n    setMostrarPainelOrdenacao(false);\n  }",
    "function onLimparTodas() {\n    limparTodas();\n    setMostrarPainelOrdenacao(false);\n  }",
  ]) {
    assert.ok(callbacks.includes(contrato), `contrato ausente: ${contrato}`);
  }
});

test("pagina delega os callbacks do painel sem reter as transicoes", () => {
  assert.match(
    pagina,
    /from "\.\/lib\/notificacoes-sorting-action-callbacks";/,
  );
  assert.match(pagina, /} = criarAcoesPainelOrdenacaoNotificacoes\(\{/);
  for (const callback of [
    "onMarcarTodasComoLidas",
    "onMarcarFiltradasComoLidas",
    "onLimparLidas",
    "onLimparTodas",
  ]) {
    assert.match(pagina, new RegExp(`${callback}=\\{${callback}\\}`));
    assert.doesNotMatch(
      pagina,
      new RegExp(`${callback}=\\{\\(\\) => \\{`),
    );
  }
});

test("modulo de callbacks nao adiciona React, Supabase ou storage", () => {
  assert.doesNotMatch(callbacks, /React|use[A-Z]|supabase|localStorage|window|document|JSX/);
});
