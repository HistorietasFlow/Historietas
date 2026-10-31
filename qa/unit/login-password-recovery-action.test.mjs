import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/login/page.tsx", "utf8");
const source = readFileSync("app/login/actions/solicitar-recuperacao-senha-login.ts", "utf8");
const submitActionSource = readFileSync(
  "app/login/hooks/useLoginSubmitAction.ts",
  "utf8",
);

test("recuperação de senha preserva a action e a orquestração", () => {
  assert.match(source, /window\.location\.origin/);
  assert.match(source, /\/auth\/callback\?next=\$\{encodeURIComponent\(/);
  assert.match(source, /"\/redefinir-senha"/);
  assert.match(source, /resetPasswordForEmail\(\s*emailFinal,\s*\{ redirectTo \}/);
  assert.match(source, /if \(error\) \{\s*return \{ ok: false \}/);
  assert.match(source, /return \{ ok: true \}/);
  assert.doesNotMatch(page, /resetPasswordForEmail/);
  assert.match(page, /useLoginSubmitAction/);
  assert.match(submitActionSource, /solicitarRecuperacaoSenhaLogin\(emailFinal\)/);
  assert.match(submitActionSource, /genericFailure/);
  assert.match(submitActionSource, /recoveryEmailSent/);
  assert.doesNotMatch(source, /useState|useEffect|router|localStorage|<[A-Z][A-Za-z0-9]*/);
});
