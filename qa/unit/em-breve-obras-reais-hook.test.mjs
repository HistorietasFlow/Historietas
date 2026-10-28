import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const hookPath = new URL(
  "../../app/em-breve/hooks/use-em-breve-obras-reais.ts",
  import.meta.url,
);
const pagePath = new URL("../../app/em-breve/page.tsx", import.meta.url);

test("Em Breve delega o carregamento inicial das obras reais ao hook", async () => {
  const hook = await readFile(hookPath, "utf8");
  const page = await readFile(pagePath, "utf8");

  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useEffect, useState \} from "react"/);
  assert.match(hook, /carregarObrasReaisEmBreve/);
  assert.match(hook, /ObraEmBreveCard/);
  assert.match(hook, /export function useEmBreveObrasReais/);
  assert.match(hook, /useState<ObraEmBreveCard\[\]>\(\[\]\)/);
  assert.match(hook, /let componenteAtivo = true/);
  assert.match(hook, /async function carregarObrasReais\(\)/);
  assert.match(hook, /await carregarObrasReaisEmBreve\(\)/);
  assert.match(hook, /window\.setTimeout/);
  assert.match(hook, /if \(componenteAtivo\)/);
  assert.match(hook, /setObrasReaisEmBreve\(obrasSemConteudo\)/);
  assert.match(hook, /\}, 0\);/);
  assert.match(hook, /void carregarObrasReais\(\)/);
  assert.match(hook, /componenteAtivo = false/);
  assert.match(hook, /\}, \[\]\);/);
  assert.match(hook, /return obrasReaisEmBreve;/);

  assert.match(
    page,
    /import \{ useEmBreveObrasReais \} from "\.\/hooks\/use-em-breve-obras-reais"/,
  );
  assert.match(page, /const obrasReaisEmBreve = useEmBreveObrasReais\(\);/);
  assert.doesNotMatch(page, /setObrasReaisEmBreve/);
  assert.doesNotMatch(page, /async function carregarObrasReais\(\)/);
  assert.doesNotMatch(
    page,
    /\.\/loaders\/carregar-obras-reais-em-breve/,
  );
  assert.match(page, /async function carregarLancamentosSalvos\(\)/);
  assert.doesNotMatch(
    hook,
    /supabase|\.from\(|auth|router|localStorage|MutationObserver|<\/?(?:div|section|article|button|span|p|Link)\b|Style|\.(?:insert|update|delete|upsert)\(/,
  );
});
