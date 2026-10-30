import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/redefinir-senha/page.tsx", import.meta.url),
  "utf8",
);
const recoveryUtilsSource = readFileSync(
  new URL(
    "../../app/redefinir-senha/lib/redefinir-senha-recovery-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const recoveryValidationSource = readFileSync(
  new URL(
    "../../app/redefinir-senha/hooks/use-redefinir-senha-recovery-validation.ts",
    import.meta.url,
  ),
  "utf8",
);

test("helpers de recovery preservam o contrato de erro e sessão", () => {
  assert.match(
    recoveryUtilsSource,
    /export type EstadoLink = "verificando" \| "valido" \| "invalido";/,
  );
  assert.match(
    recoveryUtilsSource,
    /if \(!error \|\| typeof error !== "object"\) \{\s*return fallback;/,
  );
  assert.match(
    recoveryUtilsSource,
    /"message" in error && typeof error\.message === "string"/,
  );
  assert.match(recoveryUtilsSource, /error\.message\.trim\(\)/);
  assert.match(recoveryUtilsSource, /return mensagem \|\| fallback;/);
  assert.match(recoveryUtilsSource, /supabase\.auth\.getClaims\(\)/);
  assert.match(
    recoveryUtilsSource,
    /if \(error \|\| !data\?\.claims \|\| typeof data\.claims !== "object"\) \{/,
  );
  assert.match(
    recoveryUtilsSource,
    /const amr = \(data\.claims as \{ amr\?: unknown \}\)\.amr;/,
  );
  assert.match(recoveryUtilsSource, /if \(!Array\.isArray\(amr\)\) \{/);
  assert.match(recoveryUtilsSource, /return amr\.some\(\(item\) => \{/);
  assert.match(
    recoveryUtilsSource,
    /if \(!item \|\| typeof item !== "object"\) \{\s*return false;/,
  );
  assert.match(
    recoveryUtilsSource,
    /const metodo = \(item as \{ method\?: unknown \}\)\.method;/,
  );
  assert.match(
    recoveryUtilsSource,
    /metodo\.trim\(\)\.toLowerCase\(\) === "recovery"/,
  );
  assert.match(recoveryUtilsSource, /catch \{\s*return false;/);
});

test("hook preserva o lifecycle de validação do link de recovery", () => {
  assert.match(
    recoveryValidationSource,
    /export function useRedefinirSenhaRecoveryValidation\(/,
  );
  assert.match(recoveryValidationSource, /useEffect\(\(\) => \{/);
  assert.match(recoveryValidationSource, /let ativo = true;/);
  assert.match(
    recoveryValidationSource,
    /new URLSearchParams\(window\.location\.search\)/,
  );
  assert.match(
    recoveryValidationSource,
    /params\.get\("recuperacao"\) === "1"/,
  );
  assert.match(
    recoveryValidationSource,
    /params\.get\("erro"\) === "link-invalido"/,
  );
  assert.match(
    recoveryValidationSource,
    /if \(!retornoConfirmado \|\| erroNoLink\)/,
  );
  assert.match(
    recoveryValidationSource,
    /if \(ativo\) \{\s*setEstadoLink\("invalido"\);/,
  );
  assert.match(recoveryValidationSource, /supabase\.auth\.getUser\(\)/);

  const getUserIndex = recoveryValidationSource.indexOf(
    "supabase.auth.getUser()",
  );
  const recoverySessionIndex = recoveryValidationSource.indexOf(
    "await sessaoEhRecuperacao()",
  );

  assert.ok(getUserIndex >= 0);
  assert.ok(recoverySessionIndex > getUserIndex);
  assert.match(
    recoveryValidationSource,
    /!error && data\.user\s*\? await sessaoEhRecuperacao\(\)\s*: false/,
  );
  assert.match(recoveryValidationSource, /if \(!ativo\) \{\s*return;/);
  assert.match(
    recoveryValidationSource,
    /setEstadoLink\(\s*recuperacaoValida \? "valido" : "invalido",\s*\);/,
  );
  assert.match(recoveryValidationSource, /void validarRecuperacao\(\);/);
  assert.match(
    recoveryValidationSource,
    /return \(\) => \{\s*ativo = false;\s*\};/,
  );
  assert.match(recoveryValidationSource, /\[setEstadoLink\]\);/);
});

test("página mantém estado e delega só o lifecycle inicial de recovery", () => {
  assert.match(
    pageSource,
    /import \{ useRedefinirSenhaRecoveryValidation \} from "\.\/hooks\/use-redefinir-senha-recovery-validation";/,
  );
  assert.match(
    pageSource,
    /import type \{ EstadoLink \} from "\.\/lib\/redefinir-senha-recovery-utils";/,
  );
  assert.doesNotMatch(pageSource, /^type EstadoLink =/m);
  assert.doesNotMatch(pageSource, /^function obterMensagemErro\(/m);
  assert.doesNotMatch(pageSource, /^async function sessaoEhRecuperacao\(/m);
  assert.doesNotMatch(pageSource, /useEffect\(/);
  assert.match(
    pageSource,
    /const \[estadoLink, setEstadoLink\] =\s*useState<EstadoLink>\("verificando"\);/,
  );
  assert.match(
    pageSource,
    /useRedefinirSenhaRecoveryValidation\(setEstadoLink\);/,
  );
  assert.doesNotMatch(pageSource, /async function salvarNovaSenha\(/);
});
