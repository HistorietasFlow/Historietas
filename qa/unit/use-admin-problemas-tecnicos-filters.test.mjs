import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const hook = ler(
  "../../app/admin/problemas-tecnicos/hooks/use-admin-problemas-tecnicos-filters.ts",
);
const page = ler("../../app/admin/problemas-tecnicos/page.tsx");

test("hook centraliza busca, filtro e resultado memoizado dos chamados", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useAdminProblemasTecnicosFilters\(/);
  assert.match(hook, /const \[busca, setBusca\] = useState\(""\);/);
  assert.match(
    hook,
    /useState<FiltroStatusProblema>\("todos"\)/,
  );
  assert.match(hook, /const problemasFiltrados = useMemo\(/);
  assert.match(hook, /filtrarProblemasTecnicos\(\{[\s\S]*?problemas,[\s\S]*?busca,[\s\S]*?statusFiltro,[\s\S]*?nomesUsuarios,[\s\S]*?language,[\s\S]*?\}\)/);
  assert.match(
    hook,
    /\[busca, language, nomesUsuarios, problemas, statusFiltro\]/,
  );
  assert.match(
    hook,
    /return \{[\s\S]*?busca,[\s\S]*?setBusca,[\s\S]*?statusFiltro,[\s\S]*?setStatusFiltro,[\s\S]*?problemasFiltrados,[\s\S]*?\};/,
  );
  assert.doesNotMatch(
    hook,
    /\b(?:supabase|fetch\(|router|localStorage|useEffect|atualizarChamado)\b/,
  );
});

test("página delega busca e filtro sem alterar os controles existentes", () => {
  assert.match(
    page,
    /import \{ useAdminProblemasTecnicosFilters \} from "\.\/hooks\/use-admin-problemas-tecnicos-filters";/,
  );
  assert.match(
    page,
    /\} = useAdminProblemasTecnicosFilters\(\{[\s\S]*?problemas,[\s\S]*?nomesUsuarios,[\s\S]*?language,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(page, /const \[busca, setBusca\]/);
  assert.doesNotMatch(page, /const \[statusFiltro, setStatusFiltro\]/);
  assert.doesNotMatch(page, /filtrarProblemasTecnicos\(/);
  assert.match(page, /onChange=\{\(event\) => setBusca\(event\.target\.value\)\}/);
  assert.match(
    page,
    /setStatusFiltro\(event\.target\.value as FiltroStatusProblema\)/,
  );
  assert.match(page, /maxLength=\{140\}/);
  assert.match(page, /problemasFiltrados\.map\(/);
});
