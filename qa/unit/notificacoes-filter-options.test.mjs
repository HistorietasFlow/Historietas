import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const opcoes = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-filter-options.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);
const viewState = readFileSync(
  new URL(
    "../../app/notificacoes/hooks/use-notificacoes-page-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const executavel = opcoes.replace(
  /import type \{[\s\S]*?\} from "\.\/notificacoes-filter-utils";\n/,
  "",
);
const javascript = typescript.transpileModule(executavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  criarOpcoesFiltroNotificacoes,
  criarOpcoesOrdenacaoNotificacoes,
  filtrosNotificacoesEstaoAtivos,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("opcoes preservam filtros, ordenacao e rotulos", () => {
  assert.deepEqual(criarOpcoesFiltroNotificacoes(), [
    { valor: "todas", rotulo: "Todas" },
    { valor: "nao-lidas", rotulo: "Novas" },
    { valor: "lidas", rotulo: "Lidas" },
    { valor: "capitulos", rotulo: "Capítulos" },
    { valor: "comunidade", rotulo: "Comunidade" },
  ]);
  assert.deepEqual(criarOpcoesOrdenacaoNotificacoes(), [
    { valor: "recentes", rotulo: "Mais recentes" },
    { valor: "antigas", rotulo: "Mais antigas" },
  ]);
});

test("estado de filtros preserva busca, filtro e ordenacao", () => {
  assert.equal(
    filtrosNotificacoesEstaoAtivos("", "todas", "recentes"),
    false,
  );
  assert.equal(
    filtrosNotificacoesEstaoAtivos("  busca  ", "todas", "recentes"),
    true,
  );
  assert.equal(
    filtrosNotificacoesEstaoAtivos("", "lidas", "recentes"),
    true,
  );
  assert.equal(
    filtrosNotificacoesEstaoAtivos("", "todas", "antigas"),
    true,
  );
});

test("hook de estado visual delega opcoes e estado de filtros ao modulo puro", () => {
  assert.match(
    viewState,
    /from "\.\.\/lib\/notificacoes-filter-options";/,
  );
  assert.match(viewState, /criarOpcoesFiltroNotificacoes\(\)/);
  assert.match(viewState, /criarOpcoesOrdenacaoNotificacoes\(\)/);
  assert.match(
    viewState,
    /filtrosNotificacoesEstaoAtivos\(\s*busca,\s*filtro,\s*ordenacao,\s*\)/,
  );
  assert.match(
    pagina,
    /from "\.\/hooks\/use-notificacoes-page-view-state";/,
  );
  assert.doesNotMatch(pagina, /rotulo: "Capítulos"/);
});

test("modulo de opcoes nao adiciona runtime de React, Supabase ou storage", () => {
  assert.doesNotMatch(opcoes, /React|use[A-Z]|supabase|localStorage|window|document/);
});
