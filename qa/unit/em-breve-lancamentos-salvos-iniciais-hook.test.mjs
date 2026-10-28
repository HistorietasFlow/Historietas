import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const hookPath = new URL(
  "../../app/em-breve/hooks/use-em-breve-lancamentos-salvos-iniciais.ts",
  import.meta.url,
);
const pagePath = new URL("../../app/em-breve/page.tsx", import.meta.url);

test("Em Breve delega somente estado e ciclo inicial de lançamentos salvos ao hook", async () => {
  const [hook, page] = await Promise.all([
    readFile(hookPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useEffect, useState \} from "react";/);
  assert.match(hook, /import \{ supabase \} from "\.\.\/\.\.\/\.\.\/lib\/supabase\/client";/);
  assert.match(hook, /encontrarLinkObraComConteudoEmBreve/);
  assert.match(hook, /pegarParametro/);
  assert.match(hook, /SAVED_RELEASES_STORAGE_KEY/);
  assert.match(hook, /carregarJsonUsuarioEmBreve/);
  assert.match(hook, /salvarJsonUsuarioEmBreve/);
  assert.match(hook, /normalizarListaIdsEmBreve/);
  assert.match(hook, /carregarLancamentosSalvosSupabaseEmBreve/);
  assert.match(hook, /export function useEmBreveLancamentosSalvosIniciais/);
  assert.match(hook, /const \[nomeObra, setNomeObra\] = useState\(""\);/);
  assert.match(hook, /const \[obraIdConsultada, setObraIdConsultada\] = useState\(""\);/);
  assert.match(hook, /const \[obrasSalvas, setObrasSalvas\] = useState<string\[\]>\(\[\]\);/);
  assert.match(hook, /const \[usuarioIdLogado, setUsuarioIdLogado\] = useState\(""\);/);
  assert.match(hook, /new URLSearchParams\(window\.location\.search\)/);
  assert.match(hook, /parametros\.get\("obraId"\)/);
  assert.match(hook, /parametros\.get\("obra"\)/);
  assert.match(hook, /router\.replace\(linkObraComConteudo\)/);
  assert.match(hook, /supabase\.auth\.getUser\(\)/);
  assert.equal((hook.match(/window\.setTimeout/g) || []).length, 5);
  assert.match(hook, /componenteAtivo = false/);
  assert.match(hook, /\}, \[router\]\);/);
  assert.match(
    hook,
    /return \{\s*nomeObra,\s*obraIdConsultada,\s*obrasSalvas,\s*setObrasSalvas,\s*usuarioIdLogado,\s*setUsuarioIdLogado,\s*\};/s,
  );

  assert.match(
    page,
    /import \{ useEmBreveLancamentosSalvosIniciais \} from "\.\/hooks\/use-em-breve-lancamentos-salvos-iniciais";/,
  );
  assert.match(page, /useEmBreveLancamentosSalvosIniciais\(router\)/);
  assert.doesNotMatch(page, /useEffect\(/);
  assert.doesNotMatch(page, /async function carregarLancamentosSalvos\(\)/);
  assert.doesNotMatch(page, /pegarParametro/);
  assert.doesNotMatch(page, /encontrarLinkObraComConteudoEmBreve/);
  assert.doesNotMatch(page, /carregarJsonUsuarioEmBreve/);
  assert.doesNotMatch(page, /carregarLancamentosSalvosSupabaseEmBreve/);
  assert.doesNotMatch(page, /normalizarListaIdsEmBreve/);
  assert.match(page, /import \{ supabase \} from "\.\.\/\.\.\/lib\/supabase\/client";/);
  assert.match(page, /SAVED_RELEASES_STORAGE_KEY/);
  assert.match(page, /salvarJsonUsuarioEmBreve/);
  assert.match(page, /async function salvarLancamento/);
});
