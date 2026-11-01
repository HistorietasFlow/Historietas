import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/admin/problemas-tecnicos/page.tsx", "utf8");
const filterSource = readFileSync(
  "app/admin/problemas-tecnicos/lib/admin-problemas-tecnicos-filter-utils.ts",
  "utf8",
);
const statsSource = readFileSync(
  "app/admin/problemas-tecnicos/lib/admin-problemas-tecnicos-stats-utils.ts",
  "utf8",
);
const filterHookSource = readFileSync(
  "app/admin/problemas-tecnicos/hooks/use-admin-problemas-tecnicos-filters.ts",
  "utf8",
);

test("helper de filtro preserva status, busca e campos pesquisaveis", () => {
  assert.match(filterSource, /const termo = normalizarTexto\(busca\)/);
  assert.match(
    filterSource,
    /statusFiltro !== "todos" && problema\.status !== statusFiltro/,
  );
  assert.match(filterSource, /if \(!termo\) \{\s*return true;/);
  [
    "problema.titulo",
    "problema.descricao",
    "problema.emailContato",
    "problema.paginaUrl",
    "problema.navegador",
    "problema.dispositivo",
    'nomesUsuarios[problema.userId] || ""',
    "traduzir(CATEGORIA_LABEL[problema.categoria], language)",
    "traduzir(STATUS_LABEL[problema.status], language)",
    "traduzir(PRIORIDADE_LABEL[problema.prioridade], language)",
  ].forEach((field) => assert.ok(filterSource.includes(field)));
  assert.match(filterSource, /\]\.join\(" "\)/);
  assert.match(filterSource, /conteudo\.includes\(termo\)/);
  assert.doesNotMatch(
    filterSource,
    /useState|useEffect|supabase|fetch\(|router|localStorage|set[A-Z]/,
  );
});

test("helper de totais preserva os cinco criterios", () => {
  assert.match(statsSource, /total: problemas\.length/);
  assert.match(statsSource, /item\.status === "aberto"/);
  assert.match(statsSource, /item\.status === "em_analise"/);
  assert.match(statsSource, /item\.status === "aguardando_usuario"/);
  assert.match(statsSource, /item\.prioridade === "urgente"/);
  assert.doesNotMatch(
    statsSource,
    /useState|useEffect|supabase|fetch\(|router|localStorage|set[A-Z]/,
  );
});

test("pagina delega filtros e mantém totais como memoização local", () => {
  assert.match(filterHookSource, /filtrarProblemasTecnicos/);
  assert.match(
    filterHookSource,
    /\[busca, language, nomesUsuarios, problemas, statusFiltro\]/,
  );
  assert.match(page, /useAdminProblemasTecnicosFilters/);
  assert.match(page, /calcularTotaisProblemasTecnicos/);
  assert.match(page, /useMemo\(/);
  assert.match(page, /\[problemas\]/);
  assert.doesNotMatch(page, /filtrarProblemasTecnicos/);
  assert.doesNotMatch(page, /const termo = normalizarTexto\(busca\)/);
});
