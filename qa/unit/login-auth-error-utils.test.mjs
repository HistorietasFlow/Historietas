import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/login/lib/login-auth-error-utils.ts", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/login/page.tsx", import.meta.url),
  "utf8",
);
const submitActionSource = readFileSync(
  new URL("../../app/login/hooks/useLoginSubmitAction.ts", import.meta.url),
  "utf8",
);

const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { obterMensagemErroAuth, obterCodigoErroAuth } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("helpers de erro de autenticação aceitam somente objetos com strings trimadas", () => {
  const erro = { message: "  falha de autenticação  ", code: "  invalid_credentials  " };

  assert.equal(obterMensagemErroAuth(erro), "falha de autenticação");
  assert.equal(obterCodigoErroAuth(erro), "invalid_credentials");
  assert.equal(obterMensagemErroAuth({ message: 1 }), "");
  assert.equal(obterCodigoErroAuth({ code: 1 }), "");
  assert.equal(obterMensagemErroAuth(null), "");
  assert.equal(obterCodigoErroAuth("erro"), "");
});

test("Login delega leitores e formatter de erro aos módulos extraídos", () => {
  assert.match(source, /export type ErroAuthSupabase/);
  assert.match(source, /typeof erroAuth\.message === "string" \? erroAuth\.message\.trim\(\) : ""/);
  assert.match(source, /typeof erroAuth\.code === "string" \? erroAuth\.code\.trim\(\) : ""/);
  assert.doesNotMatch(
    source,
    /from\s+["']react["']|useState|useEffect|localStorage|router|import\s+\{\s*supabase\s*\}|supabase\.(?:auth|from|rpc)/i,
  );
  assert.match(pageSource, /useLoginSubmitAction/);
  assert.match(
    submitActionSource,
    /from "\.\.\/lib\/login-auth-error-formatter";/,
  );
  assert.doesNotMatch(pageSource, /type ErroAuthSupabase =/);
  assert.doesNotMatch(pageSource, /function obterMensagemErroAuth\(/);
  assert.doesNotMatch(pageSource, /function obterCodigoErroAuth\(/);
  assert.doesNotMatch(pageSource, /function formatarErroAuth\(/);
});
