import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-chapters-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const initialLoadSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-initial-load.ts",
    import.meta.url,
  ),
  "utf8",
);

function criarModulo({ carregarTodasPaginasSupabase, supabase }) {
  globalThis.__editarObraCarregarTodasPaginasSupabase =
    carregarTodasPaginasSupabase;
  globalThis.__editarObraSupabase = supabase;

  const javascript = typescript
    .transpileModule(
      source
        .replace(
          'import { supabase } from "../../../lib/supabase/client";',
          "const supabase = globalThis.__editarObraSupabase;",
        )
        .replace(
          'import { carregarTodasPaginasSupabase } from "../../../lib/supabase/paginacao.mjs";',
          "const carregarTodasPaginasSupabase = globalThis.__editarObraCarregarTodasPaginasSupabase;",
        ),
      {
        compilerOptions: {
          module: typescript.ModuleKind.ESNext,
          target: typescript.ScriptTarget.ES2022,
        },
      },
    )
    .outputText;

  return import(
    "data:text/javascript;base64," +
      Buffer.from(javascript).toString("base64") +
      "#" +
      Math.random(),
  );
}

test("carrega capítulos paginados preservando consulta, filtros e ordenação", async () => {
  const chamadas = [];
  const resultados = [{ id: "capitulo-1" }];
  const supabase = {
    from(tabela) {
      chamadas.push(["from", tabela]);
      return {
        select(campos) {
          chamadas.push(["select", campos]);
          return this;
        },
        eq(campo, valor) {
          chamadas.push(["eq", campo, valor]);
          return this;
        },
        order(campo, opcoes) {
          chamadas.push(["order", campo, opcoes]);
          return this;
        },
        range(inicio, fim) {
          chamadas.push(["range", inicio, fim]);
          return { data: resultados, error: null };
        },
      };
    },
  };
  let opcoesPaginacao;
  const { carregarCapitulosSupabaseEdicaoObra } = await criarModulo({
    supabase,
    carregarTodasPaginasSupabase: async (opcoes) => {
      opcoesPaginacao = opcoes;
      await opcoes.buscarPagina(0, 49);
      return resultados;
    },
  });

  assert.deepEqual(
    await carregarCapitulosSupabaseEdicaoObra("obra-1", "usuario-1"),
    resultados,
  );
  assert.equal(opcoesPaginacao.nomeColecao, "capítulos da edição de obra");
  assert.deepEqual(chamadas, [
    ["from", "capitulos"],
    [
      "select",
      "id,obra_id,user_id,titulo,texto,ordem,publicado,criado_em,atualizado_em",
    ],
    ["eq", "obra_id", "obra-1"],
    ["eq", "user_id", "usuario-1"],
    ["order", "ordem", { ascending: true }],
    ["order", "id", { ascending: true }],
    ["range", 0, 49],
  ]);
});

test("retorna lista vazia e mantém o warning quando a paginação falha", async () => {
  const warnings = [];
  const warnOriginal = console.warn;
  console.warn = (...args) => warnings.push(args);

  try {
    const { carregarCapitulosSupabaseEdicaoObra } = await criarModulo({
      supabase: {},
      carregarTodasPaginasSupabase: async () => {
        throw new Error("falha de paginação");
      },
    });

    assert.deepEqual(
      await carregarCapitulosSupabaseEdicaoObra("obra-1", "usuario-1"),
      [],
    );
  } finally {
    console.warn = warnOriginal;
  }

  assert.equal(warnings.length, 1);
  assert.equal(
    warnings[0][0],
    "Não consegui carregar capítulos da obra no Supabase:",
  );
  assert.equal(warnings[0][1].message, "falha de paginação");
});

test("Editar Obra delega somente o carregamento remoto de capítulos", () => {
  assert.match(
    initialLoadSource,
    /import \{ carregarCapitulosSupabaseEdicaoObra \} from "\.\.\/lib\/editar-obra-chapters-loader";/,
  );
  assert.match(
    initialLoadSource,
    /const capitulosSupabase = await carregarCapitulosSupabaseEdicaoObra\(\s*obraIdParam,\s*userId,\s*\);/,
  );
  assert.match(
    initialLoadSource,
    /normalizarObraSupabase\(\s*obraSupabase,\s*capitulosSupabase,/,
  );
  assert.doesNotMatch(pageSource, /carregarTodasPaginasSupabase/);
  assert.match(source, /nomeColecao: "capítulos da edição de obra"/);
  assert.match(source, /\.from\("capitulos"\)/);
  assert.match(
    source,
    /\.select\(\s*"id,obra_id,user_id,titulo,texto,ordem,publicado,criado_em,atualizado_em",/,
  );
  assert.match(source, /\.eq\("obra_id", obraId\)/);
  assert.match(source, /\.eq\("user_id", userId\)/);
  assert.match(source, /\.order\("ordem", \{ ascending: true \}\)/);
  assert.match(source, /\.order\("id", \{ ascending: true \}\)/);
  assert.match(source, /console\.warn\("Não consegui carregar capítulos da obra no Supabase:", error\)/);
});
