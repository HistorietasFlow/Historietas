import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL("../../app/hooks/use-home-author-ratings.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/page.tsx", import.meta.url), "utf8");

test("useHomeAuthorRatings preserves the author ratings lifecycle", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useEffect, useState \} from "react";/);
  assert.match(
    hook,
    /export default function useHomeAuthorRatings\(\s*autores: ReadonlyArray<AutorHomeComId>,?\s*\)/,
  );
  assert.match(hook, /type AutorHomeComId = \{\s*autorId: string;\s*\};/);
  assert.match(
    hook,
    /const \[avaliacoesAutoresHome, setAvaliacoesAutoresHome\] =\s*useState<AvaliacoesAutoresHome>\(\{\}\);/,
  );
  assert.match(
    hook,
    /const autorIds = Array\.from\(\s*new Set\(\s*autores\s*\.map\(\(autor\) => autor\.autorId\.trim\(\)\)\s*\.filter\(\(autorId\) => idObraSupabaseValido\(autorId\)\),?\s*\),?\s*\);/,
  );
  assert.match(hook, /let cancelado = false;/);
  assert.match(
    hook,
    /if \(autorIds\.length === 0\) \{\s*await Promise\.resolve\(\);\s*if \(!cancelado\) \{\s*setAvaliacoesAutoresHome\(\{\}\);\s*\}\s*return;\s*\}/,
  );
  assert.match(
    hook,
    /const contrato = await carregarMetricasConteudos\(\{ autorIds \}\);/,
  );
  assert.match(
    hook,
    /if \(!contrato\.carregado\) \{\s*if \(!cancelado\) \{\s*setAvaliacoesAutoresHome\(\{\}\);\s*\}\s*return;\s*\}/,
  );
  assert.match(
    hook,
    /const avaliacoesAtualizadas = autorIds\.reduce<AvaliacoesAutoresHome>\([\s\S]*?const avaliacao = contrato\.autores\.get\(autorId\)\?\.avaliacao;[\s\S]*?if \(avaliacao && avaliacao\.total > 0\) \{\s*resultado\[autorId\] = \{\s*media: avaliacao\.media,\s*total: avaliacao\.total,\s*\};/,
  );
  assert.match(
    hook,
    /if \(!cancelado\) \{\s*setAvaliacoesAutoresHome\(avaliacoesAtualizadas\);\s*\}/,
  );
  assert.match(
    hook,
    /catch \{\s*if \(!cancelado\) \{\s*setAvaliacoesAutoresHome\(\{\}\);\s*\}\s*\}/,
  );
  assert.match(hook, /void carregarAvaliacoesAutoresHome\(\);/);
  assert.match(
    hook,
    /return \(\) => \{\s*cancelado = true;\s*\};\s*\}, \[autores\]\);/,
  );
  assert.match(hook, /return avaliacoesAutoresHome;/);
  assert.doesNotMatch(hook, /AbortController|Promise\.all|\.join\(|JSON\.stringify/);
});

test("Home delegates only author ratings to the hook", () => {
  assert.match(
    pagina,
    /import useHomeAuthorRatings from "\.\/hooks\/use-home-author-ratings";/,
  );
  assert.match(
    pagina,
    /const avaliacoesAutoresHome = useHomeAuthorRatings\(autoresParaConhecer\);/,
  );
  assert.doesNotMatch(pagina, /setAvaliacoesAutoresHome/);
  assert.doesNotMatch(pagina, /async function carregarAvaliacoesAutoresHome/);
  assert.match(pagina, /const autoresParaConhecer = useMemo<AutorHome\[\]>/);
  assert.match(pagina, /function formatarMediaAvaliacaoAutorHome\(/);
  assert.match(pagina, /type AvaliacaoAutorHome = \{/);
  assert.match(
    pagina,
    /avaliacao=\{avaliacoesAutoresHome\[autor\.autorId\]\}/,
  );
  assert.match(pagina, /carregarMetricasConteudos/);
  assert.match(pagina, /idObraSupabaseValido/);
});
