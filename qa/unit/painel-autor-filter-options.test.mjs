import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const optionsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-filter-options.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const filterStateHook = readFileSync(
  new URL(
    "../../app/painel-autor/hooks/use-painel-autor-filter-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const optionsJavascript = typescript.transpileModule(optionsSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { FILTROS_PAINEL, ORDENACOES_PAINEL } = await import(
  `data:text/javascript;base64,${Buffer.from(optionsJavascript).toString("base64")}`,
);

test("opções de filtro preservam valores, rótulos e ordem", () => {
  assert.deepEqual(FILTROS_PAINEL, [
    { valor: "todas", rotulo: "Todas as obras" },
    { valor: "publicadas", rotulo: "Publicadas" },
    { valor: "rascunhos", rotulo: "Rascunhos" },
    { valor: "sem-capitulos", rotulo: "Sem capítulos" },
    { valor: "favoritas", rotulo: "Na lista" },
    { valor: "concluidas", rotulo: "Concluídas" },
    { valor: "em-leitura", rotulo: "Em leitura" },
  ]);
});

test("opções de ordenação preservam valores, rótulos e ordem", () => {
  assert.deepEqual(ORDENACOES_PAINEL, [
    { valor: "pontuacao", rotulo: "Melhor desempenho" },
    { valor: "recentes", rotulo: "Mais recentes" },
    { valor: "titulo", rotulo: "Título" },
    { valor: "capitulos", rotulo: "Mais capítulos" },
    { valor: "progresso", rotulo: "Maior progresso" },
  ]);
});

test("Painel do Autor delega somente tipos e opções de filtro e ordenação", () => {
  assert.match(
    optionsSource,
    /export type FiltroPainel =\s*\| "todas"[\s\S]*?\| "em-leitura";/,
  );
  assert.match(
    optionsSource,
    /export type OrdenacaoPainel =\s*\| "pontuacao"[\s\S]*?\| "progresso";/,
  );
  assert.match(
    pagina,
    /import \{[\s\S]*?FILTROS_PAINEL,[\s\S]*?ORDENACOES_PAINEL,[\s\S]*?\} from "\.\/lib\/painel-autor-filter-options";/,
  );
  assert.doesNotMatch(pagina, /type FiltroPainel =/);
  assert.doesNotMatch(pagina, /type OrdenacaoPainel =/);
  assert.doesNotMatch(pagina, /const FILTROS_PAINEL:/);
  assert.doesNotMatch(pagina, /const ORDENACOES_PAINEL:/);
  assert.equal((pagina.match(/\bFILTROS_PAINEL\b/g) || []).length, 2);
  assert.equal((pagina.match(/\bORDENACOES_PAINEL\b/g) || []).length, 2);
  assert.match(
    pagina,
    /import \{ usePainelAutorFilterState \} from "\.\/hooks\/use-painel-autor-filter-state";/,
  );
  assert.match(pagina, /\} = usePainelAutorFilterState\(\);/);
  assert.doesNotMatch(pagina, /const \[filtro, setFiltro\] = useState<FiltroPainel>/);
  assert.doesNotMatch(
    pagina,
    /const \[ordenacao, setOrdenacao\] = useState<OrdenacaoPainel>/,
  );
  assert.match(filterStateHook, /^"use client";/);
  assert.match(filterStateHook, /const \[busca, setBusca\] = useState\(""\);/);
  assert.match(
    filterStateHook,
    /const \[buscaPainelAberta, setBuscaPainelAberta\] = useState\(false\);/,
  );
  assert.match(
    filterStateHook,
    /import type \{[\s\S]*?FiltroPainel,[\s\S]*?OrdenacaoPainel,[\s\S]*?\} from "\.\.\/lib\/painel-autor-filter-options";/,
  );
  assert.match(filterStateHook, /const \[filtro, setFiltro\] = useState<FiltroPainel>\("todas"\);/);
  assert.match(
    filterStateHook,
    /const \[ordenacao, setOrdenacao\] = useState<OrdenacaoPainel>\("pontuacao"\);/,
  );
  assert.match(
    filterStateHook,
    /const filtrosAtivos =\s*Boolean\(busca\.trim\(\)\) \|\| filtro !== "todas" \|\| ordenacao !== "pontuacao";/,
  );
  assert.match(
    filterStateHook,
    /function limparFiltros\(\) \{\s*setBusca\(""\);\s*setFiltro\("todas"\);\s*setOrdenacao\("pontuacao"\);\s*\}/,
  );
  assert.match(
    pagina,
    /import \{[\s\S]*?criarHrefLeituraCapituloPainel[\s\S]*?\} from "\.\/lib\/painel-autor-route-utils";/,
  );
  assert.match(
    readFileSync(new URL("../../app/painel-autor/hooks/use-painel-autor-auth-session.ts", import.meta.url), "utf8"),
    /supabase\.auth\.getUser\(\)/,
  );
  assert.doesNotMatch(optionsSource, /supabase|useState|useEffect|localStorage/);
  assert.doesNotMatch(filterStateHook, /supabase|useEffect|localStorage|window|document/);
});
