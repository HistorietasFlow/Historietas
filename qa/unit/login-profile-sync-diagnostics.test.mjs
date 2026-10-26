import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/login/lib/login-profile-sync-diagnostics.ts", import.meta.url),
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

test("obterDetalhesErroPerfil preserva string, campos Supabase e fallback", async () => {
  const { obterDetalhesErroPerfil } = await carregarModulo();

  assert.equal(obterDetalhesErroPerfil("  erro simples  "), "erro simples");
  assert.equal(
    obterDetalhesErroPerfil({
      message: "falha",
      code: "23505",
      details: "registro duplicado",
      hint: "tente novamente",
    }),
    "falha | código 23505 | registro duplicado | tente novamente",
  );
  assert.equal(obterDetalhesErroPerfil({ message: "   ", code: "" }), "erro desconhecido");
  assert.equal(obterDetalhesErroPerfil(null), "erro desconhecido");
});

test("registrarFalhaSincronizacaoPerfil registra o diagnóstico sem bloquear SSR ou storage", async () => {
  const windowAnterior = globalThis.window;
  const sessionStorageAnterior = globalThis.sessionStorage;
  const consoleErrorAnterior = console.error;
  const chamadasErro = [];
  const chamadasStorage = [];

  console.error = (...argumentos) => {
    chamadasErro.push(argumentos);
  };

  try {
    delete globalThis.window;
    let modulo = await carregarModulo();
    assert.doesNotThrow(() => modulo.registrarFalhaSincronizacaoPerfil("falha", "usuario-1"));
    assert.equal(chamadasErro.length, 1);

    globalThis.window = {};
    globalThis.sessionStorage = {
      setItem(chave, valor) {
        chamadasStorage.push([chave, valor]);
      },
    };
    modulo = await carregarModulo();
    modulo.registrarFalhaSincronizacaoPerfil(
      { message: "falha", code: "P0001", details: "detalhe", hint: "dica" },
      "usuario-2",
    );

    assert.equal(chamadasErro.length, 2);
    assert.deepEqual(chamadasErro[1], [
      "[Historietas] Falha ao sincronizar o perfil após a autenticação.",
      {
        userId: "usuario-2",
        detalhes: "falha | código P0001 | detalhe | dica",
      },
    ]);
    assert.equal(chamadasStorage.length, 1);
    assert.equal(chamadasStorage[0][0], "historietas-profile-sync-failure");
    const payload = JSON.parse(chamadasStorage[0][1]);
    assert.equal(payload.userId, "usuario-2");
    assert.equal(payload.detalhes, "falha | código P0001 | detalhe | dica");
    assert.equal(Number.isNaN(Date.parse(payload.registradoEm)), false);

    globalThis.sessionStorage = {
      setItem() {
        throw new Error("falha simulada");
      },
    };
    assert.doesNotThrow(() => modulo.registrarFalhaSincronizacaoPerfil("falha", "usuario-3"));
  } finally {
    console.error = consoleErrorAnterior;

    if (windowAnterior === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = windowAnterior;
    }

    if (sessionStorageAnterior === undefined) {
      delete globalThis.sessionStorage;
    } else {
      globalThis.sessionStorage = sessionStorageAnterior;
    }
  }
});

test("Login delega diagnóstico do profile e preserva os consumidores de salvarProfile", () => {
  assert.match(source, /export const PROFILE_SYNC_FAILURE_STORAGE_KEY/);
  assert.match(source, /`código \$\{erroSupabase\.code\}`/);
  assert.match(source, /\.join\(" \| "\) \|\| "erro desconhecido"/);
  assert.match(source, /console\.error\(/);
  assert.match(source, /registradoEm: new Date\(\)\.toISOString\(\)/);
  assert.match(source, /typeof window === "undefined"/);
  assert.doesNotMatch(
    source,
    /from\s+["']react["']|useState|useEffect|localStorage|router|import\s+\{\s*supabase\s*\}|supabase\.(?:auth|from|rpc)/i,
  );
  assert.match(
    pageSource,
    /from "\.\/lib\/login-profile-sync-diagnostics";/,
  );
  assert.doesNotMatch(pageSource, /const PROFILE_SYNC_FAILURE_STORAGE_KEY/);
  assert.doesNotMatch(pageSource, /function obterDetalhesErroPerfil\(/);
  assert.doesNotMatch(pageSource, /function registrarFalhaSincronizacaoPerfil\(/);
  assert.match(pageSource, /sessionStorage\.removeItem\(PROFILE_SYNC_FAILURE_STORAGE_KEY\)/);
  assert.equal(
    (pageSource.match(/registrarFalhaSincronizacaoPerfil\(/g) || []).length,
    2,
  );
});
