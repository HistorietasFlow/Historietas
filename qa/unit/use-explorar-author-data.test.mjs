import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (caminho) =>
  readFileSync(new URL(caminho, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler("../../app/explorar/hooks/use-explorar-author-data.ts");
const hookEstado = ler(
  "../../app/explorar/hooks/use-explorar-author-data-state.ts",
);
const pagina = ler("../../app/explorar/page.tsx");

test("hook de autores preserva derivação, carregamento paralelo e cancelamento", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /const autorIds = obterAutorIdsExplorar\(obrasLocais\);/);
  assert.match(hook, /let cancelado = false;/);
  assert.match(hook, /if \(autorIds\.length === 0\) \{\s*await Promise\.resolve\(\);\s*if \(!cancelado\) \{\s*setPerfisAutores\(\{\}\);\s*setAvaliacoesAutores\(\{\}\);/);
  assert.match(hook, /Promise\.all\(\[\s*carregarPerfisAutoresExplorar\(autorIds\),\s*carregarAvaliacoesAutoresExplorar\(autorIds\),\s*\]\)/);
  assert.match(hook, /if \(!cancelado\) \{\s*setPerfisAutores\(perfis\);\s*setAvaliacoesAutores\(avaliacoes\);/);
  assert.match(hook, /void carregarDadosAutores\(\);/);
  assert.match(hook, /return \(\) => \{\s*cancelado = true;\s*\};/);
  assert.match(hook, /\}, \[\s*obrasLocais,\s*setPerfisAutores,\s*setAvaliacoesAutores,\s*\]\);/);
});

test("hook centraliza somente o estado de autores e página preserva lifecycle e derivações", () => {
  assert.match(hookEstado, /^"use client";/);
  assert.match(hookEstado, /import \{ useState \} from "react";/);
  assert.match(hookEstado, /PerfisAutoresExplorar/);
  assert.match(hookEstado, /AvaliacoesAutoresExplorar/);
  assert.match(hookEstado, /export function useExplorarAuthorDataState\(\)/);
  assert.match(
    hookEstado,
    /perfisAutores, setPerfisAutores\]\s*=\s*useState<PerfisAutoresExplorar>\(\{\}\)/,
  );
  assert.match(
    hookEstado,
    /avaliacoesAutores, setAvaliacoesAutores\]\s*=\s*useState<AvaliacoesAutoresExplorar>\(\{\}\)/,
  );
  assert.doesNotMatch(
    hookEstado,
    /useEffect|useMemo|supabase|Promise\.all|carregarPerfisAutoresExplorar|return\s*\(\s*</,
  );
  assert.match(pagina, /import \{ useExplorarAuthorData \} from "\.\/hooks\/use-explorar-author-data";/);
  assert.match(pagina, /import \{ useExplorarAuthorDataState \} from "\.\/hooks\/use-explorar-author-data-state";/);
  assert.match(pagina, /\} = useExplorarAuthorDataState\(\);/);
  assert.doesNotMatch(pagina, /const \[perfisAutores, setPerfisAutores\]/);
  assert.doesNotMatch(pagina, /const \[avaliacoesAutores, setAvaliacoesAutores\]/);
  assert.match(pagina, /useExplorarAuthorData\(\{\s*obrasLocais,\s*setPerfisAutores,\s*setAvaliacoesAutores,\s*\}\);/);
  assert.match(pagina, /criarAutoresExplorar\(/);
  assert.doesNotMatch(pagina, /const autorIds = obterAutorIdsExplorar|async function carregarDadosAutores/);
});
