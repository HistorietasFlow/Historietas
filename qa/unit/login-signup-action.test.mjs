import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/login/page.tsx", "utf8");
const source = readFileSync("app/login/actions/criar-conta-login.ts", "utf8");

test("action de cadastro preserva payload e delegação", () => {
  assert.match(source, /new Date\(\)\.toISOString\(\)/);
  assert.match(source, /criarMetadataAceiteTermos\(aceiteEm\)/);
  assert.match(source, /email: emailFinal/);
  assert.match(source, /password: senha/);
  assert.match(source, /nome: nomeFinal/);
  assert.match(source, /name: nomeFinal/);
  assert.match(source, /full_name: nomeFinal/);
  assert.match(source, /tipo: "leitor"/);
  assert.match(source, /\.\.\.metadataAceite/);
  assert.match(source, /supabase\.auth\.signUp/);
  assert.doesNotMatch(page, /supabase\.auth\.signUp/);
  assert.match(page, /criarContaLogin\(\{[\s\S]*?emailFinal,[\s\S]*?senha,[\s\S]*?nomeFinal,/);
  assert.match(page, /if \(error\)/);
  assert.match(page, /if \(!data\.user\)/);
  assert.match(page, /if \(data\.session\)/);
  assert.match(page, /registrarAceiteTermosPublicacao/);
  assert.doesNotMatch(source, /useState|useEffect|router|localStorage|<[A-Z][A-Za-z0-9]*/);
});
