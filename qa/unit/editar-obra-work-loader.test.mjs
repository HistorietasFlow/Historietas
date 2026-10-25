import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-work-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);

function criarModulo(supabase) {
  globalThis.__editarObraSupabase = supabase;

  const javascript = typescript
    .transpileModule(
      source.replace(
        'import { supabase } from "../../../lib/supabase/client";',
        "const supabase = globalThis.__editarObraSupabase;",
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

test("carrega a obra remota preservando seleção, filtros e limite", async () => {
  const chamadas = [];
  const obra = { id: "obra-1", titulo: "Obra" };
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
        limit(quantidade) {
          chamadas.push(["limit", quantidade]);
          return this;
        },
        maybeSingle() {
          chamadas.push(["maybeSingle"]);
          return { data: obra, error: null };
        },
      };
    },
  };

  const { carregarObraSupabaseEdicaoObra } = await criarModulo(supabase);

  assert.equal(
    await carregarObraSupabaseEdicaoObra("obra-1", "usuario-1"),
    obra,
  );
  assert.deepEqual(chamadas, [
    ["from", "obras"],
    [
      "select",
      "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,visualizacoes,slug,link,criada_em,atualizado_em",
    ],
    ["eq", "id", "obra-1"],
    ["eq", "user_id", "usuario-1"],
    ["limit", 1],
    ["maybeSingle"],
  ]);
});

test("retorna nulo e mantém o warning quando a consulta da obra falha", async () => {
  const warnings = [];
  const warnOriginal = console.warn;
  console.warn = (...args) => warnings.push(args);

  try {
    const { carregarObraSupabaseEdicaoObra } = await criarModulo({
      from() {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          limit() {
            return this;
          },
          maybeSingle() {
            return { data: null, error: { message: "sem acesso" } };
          },
        };
      },
    });

    assert.equal(
      await carregarObraSupabaseEdicaoObra("obra-1", "usuario-1"),
      null,
    );
  } finally {
    console.warn = warnOriginal;
  }

  assert.deepEqual(warnings, [
    ["Não consegui carregar a obra no Supabase:", "sem acesso"],
  ]);
});

test("retorna nulo quando não há obra remota", async () => {
  const { carregarObraSupabaseEdicaoObra } = await criarModulo({
    from() {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        limit() {
          return this;
        },
        maybeSingle() {
          return { data: null, error: null };
        },
      };
    },
  });

  assert.equal(
    await carregarObraSupabaseEdicaoObra("obra-1", "usuario-1"),
    null,
  );
});

test("Editar Obra delega somente a consulta remota da obra principal", () => {
  assert.match(
    pageSource,
    /import \{ carregarObraSupabaseEdicaoObra \} from "\.\/lib\/editar-obra-work-loader";/,
  );
  assert.match(
    pageSource,
    /const obraSupabase = await carregarObraSupabaseEdicaoObra\(\s*obraIdParam,\s*userId,\s*\);/,
  );
  assert.match(pageSource, /if \(!obraSupabase\) \{\s*return;\s*\}/);
  assert.match(
    pageSource,
    /const capitulosSupabase = await carregarCapitulosSupabaseEdicaoObra\(\s*obraIdParam,\s*userId,\s*\);/,
  );
  assert.match(source, /\.from\("obras"\)/);
  assert.match(
    source,
    /\.select\(\s*"id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,visualizacoes,slug,link,criada_em,atualizado_em",/,
  );
  assert.match(source, /\.eq\("id", obraId\)/);
  assert.match(source, /\.eq\("user_id", userId\)/);
  assert.match(source, /\.limit\(1\)/);
  assert.match(source, /\.maybeSingle\(\)/);
  assert.match(
    source,
    /console\.warn\("Não consegui carregar a obra no Supabase:", erroObraSupabase\.message\)/,
  );
});

