import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const hookPath = new URL(
  "../../app/em-breve/hooks/use-em-breve-persistencia-lancamentos-salvos.ts",
  import.meta.url,
);
const pagePath = new URL("../../app/em-breve/page.tsx", import.meta.url);

test("Em Breve delega a persistência local de lançamentos salvos ao hook", async () => {
  const hook = await readFile(hookPath, "utf8");
  const page = await readFile(pagePath, "utf8");

  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useEffect \} from "react"/);
  assert.match(hook, /SAVED_RELEASES_STORAGE_KEY/);
  assert.match(hook, /salvarJsonUsuarioEmBreve/);
  assert.match(hook, /ObraEmBreveCard/);
  assert.match(hook, /export function useEmBrevePersistenciaLancamentosSalvos/);

  for (const trecho of [
    "!usuarioIdLogado",
    "obrasReaisEmBreve.length === 0",
    "salvarJsonUsuarioEmBreve(",
    "SAVED_RELEASES_STORAGE_KEY",
    "obrasReaisEmBreve.length",
    "obrasSalvasNormalizadas",
    "usuarioIdLogado",
  ]) {
    assert.ok(hook.includes(trecho), `mantém ${trecho}`);
  }

  assert.match(
    page,
    /import \{ useEmBrevePersistenciaLancamentosSalvos \} from "\.\/hooks\/use-em-breve-persistencia-lancamentos-salvos"/,
  );
  assert.match(page, /useEmBrevePersistenciaLancamentosSalvos\(/);
  assert.doesNotMatch(
    page,
    /useEffect\(\(\) => \{\s*if \(!usuarioIdLogado \|\| obrasReaisEmBreve\.length === 0\)/,
  );
  assert.doesNotMatch(
    hook,
    /supabase|\.from\(|auth|router|MutationObserver|<\w|Style|\.(?:insert|update|delete|upsert)\(/,
  );
});
