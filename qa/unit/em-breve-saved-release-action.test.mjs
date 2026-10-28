import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagina = await readFile("app/em-breve/page.tsx", "utf8");
const action = await readFile(
  "app/em-breve/actions/sincronizar-aviso-lancamento-supabase-em-breve.ts",
  "utf8",
);

test("action preserva a sincronizacao de avisos salvos", () => {
  [
    "userId.trim()",
    "obraId.trim()",
    '.from("seguindo_obras")',
    ".delete()",
    '.eq("user_id", userIdLimpo)',
    '.eq("obra_id", obraIdLimpo)',
    '.select("obra_id")',
    ".limit(1)",
    ".maybeSingle()",
    "const payloadBase",
    'visibilidade: "publico"',
    ".insert({",
    ".insert(payloadBase)",
    "erroEhRegistroDuplicadoEmBreve(erroComVisibilidade)",
    "erroEhRegistroDuplicadoEmBreve(erroSemVisibilidade)",
    '"Não consegui remover o aviso real do Em breve:"',
    '"Não consegui ativar o aviso real do Em breve:"',
    '"Não consegui sincronizar aviso real do Em breve:"',
    "return false;",
  ].forEach((contrato) => assert.ok(action.includes(contrato), contrato));

  assert.doesNotMatch(
    action,
    /useEffect|useState|router|localStorage|MutationObserver|set[A-Z][A-Za-z]+\(/,
  );
});

test("pagina delega a action e preserva a orquestracao", () => {
  assert.match(
    pagina,
    /from "\.\/actions\/sincronizar-aviso-lancamento-supabase-em-breve"/,
  );
  assert.doesNotMatch(pagina, /async function sincronizarAvisoLancamentoSupabaseEmBreve/);
  assert.doesNotMatch(pagina, /from "\.\/lib\/em-breve-error-utils"/);
  assert.match(pagina, /async function carregarObrasReaisEmBreve/);
  assert.match(pagina, /supabase/);
});
