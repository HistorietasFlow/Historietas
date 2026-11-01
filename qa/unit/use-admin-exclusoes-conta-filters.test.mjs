import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const hook = ler(
  "../../app/admin/exclusoes-conta/hooks/use-admin-exclusoes-conta-filters.ts",
);
const page = ler("../../app/admin/exclusoes-conta/page.tsx");

test("hook centraliza busca, filtro e resultado memoizado das solicitações", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useAdminExclusoesContaFilters\(/);
  assert.match(hook, /const \[busca, setBusca\] = useState\(""\);/);
  assert.match(hook, /useState<FiltroStatus>\("todos"\)/);
  assert.match(hook, /const solicitacoesFiltradas = useMemo\(/);
  assert.match(
    hook,
    /filtrarSolicitacoesExclusao\(\{[\s\S]*?solicitacoes,[\s\S]*?busca,[\s\S]*?statusFiltro,[\s\S]*?language,[\s\S]*?\}\)/,
  );
  assert.match(hook, /\[busca, language, solicitacoes, statusFiltro\]/);
  assert.match(
    hook,
    /return \{[\s\S]*?busca,[\s\S]*?setBusca,[\s\S]*?statusFiltro,[\s\S]*?setStatusFiltro,[\s\S]*?solicitacoesFiltradas,[\s\S]*?\};/,
  );
  assert.doesNotMatch(
    hook,
    /\b(?:supabase|fetch\(|router|localStorage|useEffect|salvarSolicitacao)\b/,
  );
});

test("página delega busca e filtro sem alterar os controles existentes", () => {
  assert.match(
    page,
    /import \{ useAdminExclusoesContaFilters \} from "\.\/hooks\/use-admin-exclusoes-conta-filters";/,
  );
  assert.match(
    page,
    /\} = useAdminExclusoesContaFilters\(\{[\s\S]*?solicitacoes,[\s\S]*?language,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(page, /const \[busca, setBusca\]/);
  assert.doesNotMatch(page, /const \[statusFiltro, setStatusFiltro\]/);
  assert.doesNotMatch(page, /filtrarSolicitacoesExclusao\(/);
  assert.match(page, /onChange=\{\(event\) => setBusca\(event\.target\.value\)\}/);
  assert.match(
    page,
    /setStatusFiltro\(event\.target\.value as FiltroStatus\)/,
  );
  assert.match(page, /maxLength=\{160\}/);
  assert.match(page, /solicitacoesFiltradas\.map\(/);
});
