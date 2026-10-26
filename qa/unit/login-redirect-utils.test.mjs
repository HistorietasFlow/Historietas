import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/login/lib/login-redirect-utils.ts", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/login/page.tsx", import.meta.url),
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
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${indiceModulo++}`,
  );
}

test("obterRedirectToSeguro preserva pathname, query e hash válidos", async () => {
  const { obterRedirectToSeguro } = await carregarModulo();

  assert.equal(
    obterRedirectToSeguro("  /obra/aurora?aba=capitulos#capitulo-2  ", "/perfil-autor"),
    "/obra/aurora?aba=capitulos#capitulo-2",
  );
  assert.equal(obterRedirectToSeguro("/obra/aurora/", "/perfil-autor"), "/obra/aurora/");
});

test("obterRedirectToSeguro bloqueia destinos inválidos ou maliciosos", async () => {
  const { obterRedirectToSeguro } = await carregarModulo();
  const fallback = "/perfil-autor";

  [
    null,
    "",
    "obra/aurora",
    "//externo.example",
    "/\\externo.example",
    "/obra\u0000aurora",
    "/login",
    "/login/recuperar",
  ].forEach((destino) => {
    assert.equal(obterRedirectToSeguro(destino, fallback), fallback);
  });
});

test("obterRedirectToAtual preserva SSR e lê somente redirectTo da URL", async () => {
  const windowAnterior = globalThis.window;

  try {
    delete globalThis.window;
    const { obterRedirectToAtual } = await carregarModulo();
    assert.equal(obterRedirectToAtual("/perfil-autor"), "/perfil-autor");

    globalThis.window = {
      location: {
        search: "?redirectTo=%2Fobra%2Faurora%3Faba%3Dcapitulos%23capitulo-2",
      },
    };
    assert.equal(
      obterRedirectToAtual("/perfil-autor"),
      "/obra/aurora?aba=capitulos#capitulo-2",
    );
  } finally {
    if (windowAnterior === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = windowAnterior;
    }
  }
});

test("Login delega redirects seguros ao módulo extraído", () => {
  assert.match(source, /const destino = typeof valor === "string" \? valor\.trim\(\) : "";/);
  assert.match(source, /destino\.startsWith\("\/\/"\)/);
  assert.match(source, /destino\.includes\("\\\\"\)/);
  assert.match(source, /\[\\u0000-\\u001F\\u007F\]/);
  assert.match(source, /"https:\/\/historietas\.local"/);
  assert.match(source, /pathname === "\/login"/);
  assert.match(source, /pathname\.startsWith\("\/login\/"\)/);
  assert.match(source, /\$\{urlDestino\.pathname\}\$\{urlDestino\.search\}\$\{urlDestino\.hash\}/);
  assert.match(source, /typeof window === "undefined"/);
  assert.doesNotMatch(source, /react|supabase|localStorage|router/i);
  assert.match(
    pageSource,
    /import \{ obterRedirectToAtual \} from "\.\/lib\/login-redirect-utils";/,
  );
  assert.doesNotMatch(pageSource, /function obterRedirectToSeguro\(/);
  assert.doesNotMatch(pageSource, /function obterRedirectToAtual\(/);
  assert.equal((pageSource.match(/obterRedirectToAtual\("\/perfil-autor"\)/g) || []).length, 3);
});
