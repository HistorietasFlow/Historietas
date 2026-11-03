import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/login/lib/login-redirect-utils.ts", import.meta.url),
  "utf8",
);

let indiceModulo = 0;

async function carregarModulo() {
  const javascript = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;

  return import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${indiceModulo++}`
  );
}

test("redirectTo bloqueia esquemas e origens perigosas", async () => {
  const { obterRedirectToSeguro } = await carregarModulo();
  const fallback = "/perfil-autor";

  [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "https://evil.example/",
    "http://evil.example/",
    "//evil.example/",
    "/\\evil.example/",
    "/login",
    "/login/recuperar",
  ].forEach((destino) => {
    assert.equal(obterRedirectToSeguro(destino, fallback), fallback);
  });
});

test("redirectTo codifica caracteres que poderiam quebrar atributo HTML", async () => {
  const { obterRedirectToSeguro } = await carregarModulo();
  const fallback = "/perfil-autor";

  assert.equal(
    obterRedirectToSeguro('/" onmouseover="alert(1)', fallback),
    "/%22%20onmouseover=%22alert(1)",
  );
  assert.equal(
    obterRedirectToSeguro('/?x=" onmouseover="alert(1)', fallback),
    "/?x=%22%20onmouseover=%22alert(1)",
  );
  assert.equal(
    obterRedirectToSeguro('/#"><script>alert(1)</script>', fallback),
    "/#%22%3E%3Cscript%3Ealert(1)%3C/script%3E",
  );
});

test("redirectTo válido permanece restrito ao mesmo site", async () => {
  const { obterRedirectToSeguro } = await carregarModulo();

  assert.equal(
    obterRedirectToSeguro(
      "/publicar?origem=login#formulario",
      "/perfil-autor",
    ),
    "/publicar?origem=login#formulario",
  );
});
