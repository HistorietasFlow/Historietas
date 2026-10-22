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
const loadingState = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-page-loading-state.tsx",
    import.meta.url,
  ),
  "utf8",
);
const loadingStateProps = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-page-loading-state-props.ts",
    import.meta.url,
  ),
  "utf8",
);
const secaoPrivacidadePerfil = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-profile-privacy-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const secaoConta = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-account-details-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const accountActionHandlers = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-account-action-handlers.ts",
    import.meta.url,
  ),
  "utf8",
);
const cssGlobal = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-page-css.ts",
    import.meta.url,
  ),
  "utf8",
);
const modalSenha = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-security-password-modal.tsx",
    import.meta.url,
  ),
  "utf8",
);
const modalExclusao = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-account-deletion-modal.tsx",
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

test("Configurações mantém os cinco consumidores nas fronteiras visuais", () => {
  assert.match(
    loadingState,
    /import \{ LoadingSpinner \} from "\.\/configuracoes-loading-spinner";/,
  );
  assert.match(
    loadingState,
    /import type \{ ConfiguracoesPageLoadingStateProps \} from "\.\/configuracoes-page-loading-state-props";/,
  );
  assert.match(
    loadingStateProps,
    /import type \{ CSSProperties \} from "react";/,
  );
  assert.match(
    loadingStateProps,
    /export type ConfiguracoesPageLoadingStateProps = \{\s+pageThemeStyle: CSSProperties;\s+themeCss: string;\s+pageCss: string;\s+label: string;\s+\};/,
  );
  assert.doesNotMatch(loadingState, /type ConfiguracoesPageLoadingStateProps =/);
  assert.doesNotMatch(pagina, /function LoadingSpinner\(/);
  assert.doesNotMatch(pagina, /const loadingPageStyle: CSSProperties =/);
  assert.doesNotMatch(pagina, /const loadingInlineStyle: CSSProperties =/);
  assert.doesNotMatch(pagina, /const loadingSpinnerStyle: CSSProperties =/);
  assert.doesNotMatch(pagina, /const loadingSpinnerCompactStyle: CSSProperties =/);

  assert.match(
    modalSenha,
    /import \{ LoadingSpinner \} from "\.\/configuracoes-loading-spinner";/,
  );
  assert.match(
    modalExclusao,
    /import \{ LoadingSpinner \} from "\.\/configuracoes-loading-spinner";/,
  );
  assert.match(
    secaoPrivacidadePerfil,
    /import \{ LoadingSpinner \} from "\.\/configuracoes-loading-spinner";/,
  );
  assert.match(
    secaoConta,
    /import \{ LoadingSpinner \} from "\.\/configuracoes-loading-spinner";/,
  );

  const consumidores = [
    loadingState,
    secaoConta,
    secaoPrivacidadePerfil,
    modalSenha,
    modalExclusao,
  ].reduce(
    (total, source) => total + (source.match(/<LoadingSpinner/g) || []).length,
    0,
  );
  assert.equal(consumidores, 5);
  const compactos = [
    loadingState,
    secaoConta,
    secaoPrivacidadePerfil,
    modalSenha,
    modalExclusao,
  ].reduce(
    (total, source) =>
      total + (source.match(/<LoadingSpinner[\s\S]*?compacto/g) || []).length,
    0,
  );
  assert.equal(compactos, 4);

  for (const label of [
    "Carregando configurações",
  ]) {
    assert.match(pagina, new RegExp(`label=\\{t\\(\\s*"${label}"`));
  }
  assert.match(secaoConta, /"Salvando alterações",/);
  assert.match(secaoPrivacidadePerfil, /"Carregando usuários bloqueados",/);
  assert.match(modalSenha, /"Alterando senha",/);
  assert.match(modalExclusao, /"Excluindo conta",/);

  assert.match(pagina, /if \(verificandoAcesso\) \{/);
  assert.match(
    pagina,
    /from "\.\/hooks\/use-configuracoes-account-action-handlers";/,
  );
  assert.match(pagina, /useConfiguracoesAccountActionHandlers\(\{/);
  assert.match(accountActionHandlers, /async function salvar\(/);
  assert.match(accountActionHandlers, /async function alterarSenha\(/);
  assert.match(accountActionHandlers, /async function excluirConta\(/);
});
