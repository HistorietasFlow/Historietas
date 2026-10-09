import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-loading-spinner.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/configuracoes/page.tsx", import.meta.url),
  "utf8",
);
const cssGlobal = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-page-css.ts",
    import.meta.url,
  ),
  "utf8",
);

test("LoadingSpinner de Configurações preserva seus modos e estilos", () => {
  assert.match(componente, /export function LoadingSpinner\(/);
  assert.match(componente, /label = "Carregando"/);
  assert.match(componente, /compacto = false/);
  assert.match(componente, /if \(compacto\) \{/);
  assert.match(componente, /<span[\s\S]*?role="status"/);
  assert.match(componente, /<div[\s\S]*?role="status"/);
  assert.match(componente, /aria-live="polite"/);
  assert.match(componente, /aria-label=\{label\}/);
  assert.match(componente, /className="historietas-loading-spinner"/);
  assert.match(componente, /aria-hidden="true"/);
  assert.match(componente, /const loadingPageStyle: CSSProperties =/);
  assert.match(componente, /const loadingInlineStyle: CSSProperties =/);
  assert.match(componente, /const loadingSpinnerStyle: CSSProperties =/);
  assert.match(componente, /const loadingSpinnerCompactStyle: CSSProperties =/);
  assert.match(
    componente,
    /animation: "historietas-loading-spin 0\.78s linear infinite"/,
  );
  assert.match(componente, /\.\.\.loadingSpinnerStyle,/);
  assert.doesNotMatch(componente, /@keyframes historietas-loading-spin/);
  assert.match(cssGlobal, /@keyframes historietas-loading-spin/);
});

test("Configurações mantém os cinco consumidores na página", () => {
  assert.match(
    pagina,
    /import \{ LoadingSpinner \} from "\.\/components\/configuracoes-loading-spinner";/,
  );
  assert.doesNotMatch(pagina, /function LoadingSpinner\(/);
  assert.doesNotMatch(pagina, /const loadingPageStyle: CSSProperties =/);
  assert.doesNotMatch(pagina, /const loadingInlineStyle: CSSProperties =/);
  assert.doesNotMatch(pagina, /const loadingSpinnerStyle: CSSProperties =/);
  assert.doesNotMatch(pagina, /const loadingSpinnerCompactStyle: CSSProperties =/);

  const consumidores = pagina.match(/<LoadingSpinner/g);
  assert.equal(consumidores?.length, 5);
  const compactos = pagina.match(/<LoadingSpinner[\s\S]*?compacto/g);
  assert.equal(compactos?.length, 4);

  for (const label of [
    "Carregando configurações",
    "Salvando alterações",
    "Carregando usuários bloqueados",
    "Alterando senha",
    "Excluindo conta",
  ]) {
    assert.match(pagina, new RegExp(`t\\(\\s*"${label}"`));
  }

  assert.match(pagina, /if \(verificandoAcesso\) \{/);
  assert.match(pagina, /function salvar\(/);
  assert.match(pagina, /function alterarSenha\(/);
  assert.match(pagina, /function excluirConta\(/);
});
