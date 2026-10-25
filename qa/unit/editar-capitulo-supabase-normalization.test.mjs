import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const normalizationSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-supabase-normalization.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const mappersSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-supabase-mappers.ts",
    import.meta.url,
  ),
  "utf8",
);
const normalizationJavascript = typescript.transpileModule(normalizationSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { normalizarCategoriaArquivoSupabase, normalizarTagsSupabase } = await import(
  `data:text/javascript;base64,${Buffer.from(normalizationJavascript).toString("base64")}`,
);

test("normalizarTagsSupabase preserva filtros, ordem e duplicados", () => {
  assert.deepEqual(normalizarTagsSupabase(undefined), ["sem tags"]);
  assert.deepEqual(normalizarTagsSupabase([]), ["sem tags"]);
  assert.deepEqual(
    normalizarTagsSupabase(["  ação  ", "", "   ", "ação", 3, null, {}]),
    ["ação", "ação"],
  );
  assert.deepEqual(
    normalizarTagsSupabase([" segunda ", "primeira", " segunda "]),
    ["segunda", "primeira", "segunda"],
  );
});

test("normalizarCategoriaArquivoSupabase preserva somente categorias explícitas", () => {
  for (const categoria of ["texto", "documento", "imagem", "outro"]) {
    assert.equal(normalizarCategoriaArquivoSupabase(categoria), categoria);
  }

  for (const categoria of [null, undefined, "", " texto ", "pdf", "TEXTO"]) {
    assert.equal(normalizarCategoriaArquivoSupabase(categoria), "outro");
  }
});

test("Editar Capítulo delega somente normalizadores Supabase ao módulo extraído", () => {
  assert.match(
    mappersSource,
    /import \{[\s\S]*?normalizarCategoriaArquivoSupabase,[\s\S]*?normalizarTagsSupabase,[\s\S]*?\} from "\.\/editar-capitulo-supabase-normalization";/,
  );
  assert.doesNotMatch(pageSource, /function normalizarTagsSupabase\(/);
  assert.doesNotMatch(pageSource, /function normalizarCategoriaArquivoSupabase\(/);
  assert.doesNotMatch(pageSource, /editar-capitulo-supabase-normalization/);
  assert.match(
    mappersSource,
    /categoria: normalizarCategoriaArquivoSupabase\(obra\.arquivo_categoria\)/,
  );
  assert.match(
    mappersSource,
    /tags: normalizarTagsSupabase\(obra\.tags \|\| obraLocal\?\.tags\)/,
  );
  assert.match(normalizationSource, /if \(!Array\.isArray\(tags\)\)/);
  assert.match(normalizationSource, /return \["sem tags"\];/);
  assert.match(
    normalizationSource,
    /categoria === "texto"[\s\S]*?categoria === "documento"[\s\S]*?categoria === "imagem"[\s\S]*?categoria === "outro"/,
  );
});
