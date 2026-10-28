import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const hookPath = new URL(
  "../../app/em-breve/hooks/use-em-breve-lancamentos-salvos-normalizados.ts",
  import.meta.url,
);
const pagePath = new URL("../../app/em-breve/page.tsx", import.meta.url);

test("Em Breve delega a normalizacao memoizada de lancamentos salvos ao hook", async () => {
  const hook = await readFile(hookPath, "utf8");
  const page = await readFile(pagePath, "utf8");

  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useMemo \} from "react"/);
  assert.match(hook, /ObraEmBreveCard/);
  assert.match(hook, /normalizarLancamentosSalvosComObrasEmBreve/);
  assert.match(hook, /export function useEmBreveLancamentosSalvosNormalizados/);
  assert.match(hook, /!usuarioIdLogado/);
  assert.match(hook, /obrasReaisEmBreve\.length === 0/);
  assert.match(hook, /return obrasSalvas;/);
  assert.match(hook, /normalizarLancamentosSalvosComObrasEmBreve\(/);
  assert.match(hook, /obrasSalvas,\s*obrasReaisEmBreve/);
  assert.match(
    hook,
    /\[obrasReaisEmBreve, obrasSalvas, usuarioIdLogado\]/,
  );
  assert.match(hook, /return obrasSalvasNormalizadas;/);

  assert.match(
    page,
    /import \{ useEmBreveLancamentosSalvosNormalizados \} from "\.\/hooks\/use-em-breve-lancamentos-salvos-normalizados"/,
  );
  assert.match(
    page,
    /const obrasSalvasNormalizadas =\s*useEmBreveLancamentosSalvosNormalizados\(/,
  );
  assert.doesNotMatch(page, /useMemo\(/);
  assert.doesNotMatch(page, /useEffect, useMemo, useState/);
  assert.match(page, /normalizarLancamentosSalvosComObrasEmBreve/);
  assert.match(page, /async function salvarLancamento\(/);
  assert.doesNotMatch(
    hook,
    /supabase|\.from\(|auth|router|localStorage|useEffect|useState|MutationObserver|<\/?(?:div|section|article|button|span|p|Link)\b|Style|\.(?:insert|update|delete|upsert)\(/,
  );
});
