import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagina = await readFile("app/em-breve/page.tsx", "utf8");
const modulo = await readFile("app/em-breve/lib/em-breve-storage-utils.ts", "utf8");

test("storage de Em Breve preserva chave, isolamento por usuario e fallbacks", () => {
  [
    '"historietas-lancamentos-salvos"',
    "function criarStorageKeyUsuarioEmBreve",
    "userId.trim()",
    "`${chave}:${userIdLimpo}`",
    'typeof window === "undefined"',
    "localStorage.getItem",
    "JSON.parse",
    "localStorage.setItem",
    "JSON.stringify(valor)",
    "return null;",
    "// localStorage é fallback; a tela continua com estado em memória.",
  ].forEach((contrato) => assert.ok(modulo.includes(contrato), contrato));

  assert.doesNotMatch(modulo, /export function criarStorageKeyUsuarioEmBreve/);
  assert.doesNotMatch(
    modulo,
    /supabase|useEffect|useState|router|MutationObserver|\.from\(|\.update\(/,
  );
});

test("pagina usa os tres exports sem manter as implementacoes locais", () => {
  assert.match(
    pagina,
    /import \{\s*SAVED_RELEASES_STORAGE_KEY,\s*carregarJsonUsuarioEmBreve,\s*salvarJsonUsuarioEmBreve,\s*\} from "\.\/lib\/em-breve-storage-utils"/s,
  );
  assert.doesNotMatch(pagina, /const SAVED_RELEASES_STORAGE_KEY =/);
  assert.doesNotMatch(pagina, /function criarStorageKeyUsuarioEmBreve/);
  assert.doesNotMatch(pagina, /function carregarJsonUsuarioEmBreve/);
  assert.doesNotMatch(pagina, /function salvarJsonUsuarioEmBreve/);
  assert.match(
    pagina,
    /carregarJsonUsuarioEmBreve\(SAVED_RELEASES_STORAGE_KEY,/,
  );
  assert.equal(
    (pagina.match(/salvarJsonUsuarioEmBreve\(\s*SAVED_RELEASES_STORAGE_KEY,/g) || [])
      .length,
    3,
  );
});
