import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler(
  "../../app/explorar/hooks/use-explorar-personal-collections-state.ts",
);
const pagina = ler("../../app/explorar/page.tsx");
const initialLoad = ler("../../app/explorar/hooks/use-explorar-initial-load.ts");
const derived = ler("../../app/explorar/lib/explorar-derived-utils.ts");

test("hook centraliza somente as coleções pessoais de Explorar", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(hook, /export function useExplorarPersonalCollectionsState\(\)/);
  assert.match(
    hook,
    /obrasFavoritas, setObrasFavoritas\] = useState<string\[\]>\(\[\]\)/,
  );
  assert.match(
    hook,
    /obrasConcluidas, setObrasConcluidas\] = useState<string\[\]>\(\[\]\)/,
  );
  assert.doesNotMatch(
    hook,
    /useEffect|useMemo|supabase|localStorage|normalizar|carregar|return\s*\(\s*</,
  );
});

test("Explorar delega coleções e preserva carregamento e filtros pessoais", () => {
  assert.match(
    pagina,
    /import \{ useExplorarPersonalCollectionsState \} from "\.\/hooks\/use-explorar-personal-collections-state";/,
  );
  assert.match(pagina, /\} = useExplorarPersonalCollectionsState\(\);/);
  assert.doesNotMatch(pagina, /const \[obrasFavoritas, setObrasFavoritas\]/);
  assert.doesNotMatch(pagina, /const \[obrasConcluidas, setObrasConcluidas\]/);
  assert.match(
    pagina,
    /useExplorarInitialLoad\(\{[\s\S]*?setObrasFavoritas,[\s\S]*?setObrasConcluidas,/,
  );
  assert.match(
    pagina,
    /filtrarObrasBaseExplorar\(\{[\s\S]*?filtroColecao,[\s\S]*?usuarioLogado,[\s\S]*?ordenacao,[\s\S]*?obrasFavoritas,[\s\S]*?obrasConcluidas,[\s\S]*?colecaoTemObraExplorar,/,
  );
  assert.match(initialLoad, /setObrasFavoritas\(obrasFavoritasNormalizadas\);/);
  assert.match(initialLoad, /setObrasConcluidas\(obrasConcluidasNormalizadas\);/);
  assert.match(initialLoad, /setObrasFavoritas\(\[\]\);/);
  assert.match(initialLoad, /setObrasConcluidas\(\[\]\);/);
  assert.match(derived, /filtroColecao === "favoritas"/);
  assert.match(derived, /filtroColecao === "concluidas"/);
});
