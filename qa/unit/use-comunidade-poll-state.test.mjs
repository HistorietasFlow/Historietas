import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler("../../app/comunidade/hooks/use-comunidade-poll-state.ts");
const pagina = ler("../../app/comunidade/page.tsx");

test("hook centraliza somente o estado das enquetes", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(
    hook,
    /import type \{ ResultadoVotosEnquete \} from "\.\.\/components\/community-poll-votes-result";/,
  );
  assert.match(hook, /export function useComunidadePollState\(\)/);
  assert.match(
    hook,
    /votosEnquetes, setVotosEnquetes\] = useState<Record<string, string>>\(\{\}\)/,
  );
  assert.match(
    hook,
    /resultadosEnquetes, setResultadosEnquetes\][\s\S]*?useState<ResultadoVotosEnquete>\(\{\}\)/,
  );
  assert.match(
    hook,
    /votandoEnqueteId, setVotandoEnqueteId\] = useState<string \| null>\(null\)/,
  );
  assert.doesNotMatch(hook, /useEffect|useMemo|supabase|localStorage|router|return\s*\(\s*</);
});

test("página delega o estado e preserva sincronização, reset e voto", () => {
  assert.match(
    pagina,
    /import \{ useComunidadePollState \} from "\.\/hooks\/use-comunidade-poll-state";/,
  );
  assert.match(pagina, /\} = useComunidadePollState\(\);/);

  for (const estadoLocal of [
    "const [votosEnquetes, setVotosEnquetes]",
    "const [resultadosEnquetes, setResultadosEnquetes]",
    "const [votandoEnqueteId, setVotandoEnqueteId]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  assert.match(
    pagina,
    /useComunidadeSavedPostsSync\(\{[\s\S]*?setPostsSalvosIds,[\s\S]*?setVotosEnquetes,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /useComunidadePollVotesSync\(\{[\s\S]*?posts,[\s\S]*?setVotosEnquetes,[\s\S]*?setResultadosEnquetes,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /useComunidadeAuthAccountLifecycle\(\{[\s\S]*?setVotosEnquetes,[\s\S]*?setResultadosEnquetes,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /useComunidadePostEngagementActions\(\{[\s\S]*?votandoEnqueteId,[\s\S]*?votosEnquetes,[\s\S]*?setVotandoEnqueteId,[\s\S]*?setResultadosEnquetes,[\s\S]*?setVotosEnquetes,[\s\S]*?\}\);/,
  );
  assert.match(pagina, /votarEnquetePostComunidade/);
  assert.match(
    pagina,
    /votosEnquetes,[\s\S]*?resultadosEnquetes,[\s\S]*?votandoEnqueteId,/,
  );
});
