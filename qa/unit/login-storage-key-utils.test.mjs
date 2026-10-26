import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/login/lib/login-storage-key-utils.ts", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/login/page.tsx", import.meta.url),
  "utf8",
);

const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  STORAGE_KEY,
  criarStorageUsuarioLoginKey,
  criarStorageObrasUsuarioLoginKey,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("chaves de storage do Login preservam userId trimado e fallback vazio", () => {
  assert.equal(criarStorageUsuarioLoginKey("preferencias", " usuario-1 "), "preferencias:usuario-1");
  assert.equal(criarStorageUsuarioLoginKey("preferencias", "   "), "");
  assert.equal(criarStorageUsuarioLoginKey(" chave ", " usuario-1 "), " chave :usuario-1");
});

test("chave de obras do Login usa a constante de storage preservada", () => {
  assert.equal(STORAGE_KEY, "historietas-obras");
  assert.equal(criarStorageObrasUsuarioLoginKey(" usuario-1 "), "historietas-obras:usuario-1");
  assert.equal(criarStorageObrasUsuarioLoginKey(""), "");
});

test("Login delega chaves de storage ao módulo puro", () => {
  assert.match(source, /export const STORAGE_KEY = "historietas-obras";/);
  assert.match(source, /const userIdLimpo = userId\.trim\(\);/);
  assert.match(source, /return userIdLimpo \? `\$\{chave\}:\$\{userIdLimpo\}` : "";/);
  assert.doesNotMatch(source, /react|supabase|localStorage|router/i);
  assert.doesNotMatch(
    source,
    /<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
  assert.match(
    pageSource,
    /from "\.\/lib\/login-storage-key-utils";/,
  );
  assert.doesNotMatch(pageSource, /const STORAGE_KEY = "historietas-obras";/);
  assert.doesNotMatch(pageSource, /function criarStorageUsuarioLoginKey\(/);
  assert.doesNotMatch(pageSource, /function criarStorageObrasUsuarioLoginKey\(/);
  assert.match(pageSource, /criarStorageObrasUsuarioLoginKey\(userIdLimpo\)/);
  assert.match(pageSource, /criarStorageUsuarioLoginKey\(chave, userIdLimpo\)/);
});
