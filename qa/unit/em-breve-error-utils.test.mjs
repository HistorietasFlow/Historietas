import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagina = await readFile("app/em-breve/page.tsx", "utf8");
const modulo = await readFile("app/em-breve/lib/em-breve-error-utils.ts", "utf8");

test("helper de duplicidade preserva os criterios atuais", () => {
  [
    "error: unknown",
    'typeof error !== "object"',
    "code?: unknown",
    "message?: unknown",
    'typeof registro.code === "string"',
    'typeof registro.message === "string"',
    ".toLowerCase()",
    '"23505"',
    '.includes("duplicate")',
    "return false;",
  ].forEach((contrato) => assert.ok(modulo.includes(contrato), contrato));
  assert.doesNotMatch(modulo, /supabase|\.from\(|\.insert\(|\.delete\(|useEffect|router|localStorage/);
});

test("pagina delega o helper e preserva a sincronizacao", () => {
  assert.match(pagina, /from "\.\/lib\/em-breve-error-utils"/);
  assert.doesNotMatch(pagina, /function erroEhRegistroDuplicadoEmBreve/);
  assert.match(pagina, /async function sincronizarAvisoLancamentoSupabaseEmBreve/);
  assert.equal((pagina.match(/erroEhRegistroDuplicadoEmBreve\(/g) || []).length, 2);
});
