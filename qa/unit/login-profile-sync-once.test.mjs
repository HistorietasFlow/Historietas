import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/login/page.tsx", "utf8");
const source = readFileSync(
  "app/login/actions/sincronizar-profile-login-uma-vez.ts",
  "utf8",
);

test("sincronização única de profile preserva consultas e mutações Supabase", () => {
  assert.match(source, /\.from\("profiles_publicos"\)[\s\S]*?\.eq\("user_id", userIdLimpo\)/);
  assert.match(source, /\.eq\("id", userIdLimpo\)/);
  assert.match(source, /select\("id,user_id,nome,bio,sobre_bio,avatar_url"\)/);
  assert.match(source, /\.limit\(1\)[\s\S]*?\.maybeSingle\(\)/);
  assert.match(source, /throw erroPorUserId \|\| erroPorId/);
  assert.match(source, /const agora = new Date\(\)\.toISOString\(\)/);
  assert.match(source, /\.from\("profiles"\)[\s\S]*?\.update\(perfilPayload\)/);
  assert.match(source, /\.upsert\([\s\S]*?tipo: "leitor",[\s\S]*?onConflict: "id",[\s\S]*?ignoreDuplicates: false/);
  assert.match(source, /O perfil existente não pôde ser atualizado ou não ficou visível após a atualização/);
  assert.match(source, /O perfil não pôde ser criado ou não ficou visível após a criação/);
});

test("Login mantém a orquestração de tentativas na página", () => {
  assert.doesNotMatch(page, /async function sincronizarUmaVez/);
  assert.match(page, /for \(let tentativa = 1; tentativa <= 2; tentativa \+= 1\)/);
  assert.match(page, /await sincronizarProfileLoginUmaVez\(\{ userIdLimpo, nomeFinal \}\)/);
  assert.match(page, /aguardarLogin\(350\)/);
  assert.match(page, /sessionStorage\.removeItem\(PROFILE_SYNC_FAILURE_STORAGE_KEY\)/);
  assert.doesNotMatch(source, /useState|useEffect|localStorage|router|<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/);
});
