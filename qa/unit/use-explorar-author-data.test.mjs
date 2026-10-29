import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (caminho) =>
  readFileSync(new URL(caminho, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler("../../app/explorar/hooks/use-explorar-author-data.ts");
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

test("página mantém estados e derivações, delegando só o lifecycle dos autores", () => {
  assert.match(pagina, /import \{ useExplorarAuthorData \} from "\.\/hooks\/use-explorar-author-data";/);
  assert.match(pagina, /const \[perfisAutores, setPerfisAutores\] =\s*useState<PerfisAutoresExplorar>\(\{\}\);/);
  assert.match(pagina, /const \[avaliacoesAutores, setAvaliacoesAutores\] =\s*useState<AvaliacoesAutoresExplorar>\(\{\}\);/);
  assert.match(pagina, /useExplorarAuthorData\(\{\s*obrasLocais,\s*setPerfisAutores,\s*setAvaliacoesAutores,\s*\}\);/);
  assert.match(pagina, /criarAutoresExplorar\(/);
  assert.doesNotMatch(pagina, /const autorIds = obterAutorIdsExplorar|async function carregarDadosAutores/);
});
