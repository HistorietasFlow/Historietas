import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const loaderSource = readFileSync(
  new URL(
    "../../app/comunidade/components/community-posts-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const sourceFile = typescript.createSourceFile(
  "community-posts-loader.ts",
  loaderSource,
  typescript.ScriptTarget.ES2022,
  true,
  typescript.ScriptKind.TS,
);
const helperDeclaration = sourceFile.statements.find(
  (statement) =>
    typescript.isFunctionDeclaration(statement) &&
    statement.name?.text === "escaparFiltroObraRelacionadaLike",
);

assert.ok(helperDeclaration, "helper de escape do filtro deve existir");

const helperJavascript = typescript.transpileModule(
  helperDeclaration.getText(sourceFile),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const helperModuleUrl = `data:text/javascript;base64,${Buffer.from(
  helperJavascript,
).toString("base64")}`;
const { escaparFiltroObraRelacionadaLike } = await import(helperModuleUrl);

test("escapa barra invertida antes dos curingas de LIKE", () => {
  assert.equal(escaparFiltroObraRelacionadaLike("100%"), "100\\%");
  assert.equal(escaparFiltroObraRelacionadaLike("obra_parte"), "obra\\_parte");
  assert.equal(
    escaparFiltroObraRelacionadaLike("caminho\\obra"),
    "caminho\\\\obra",
  );
  assert.equal(
    escaparFiltroObraRelacionadaLike("obra\\%_final"),
    "obra\\\\\\%\\_final",
  );
});

test("preserva virgula, ponto e parenteses como texto literal", () => {
  assert.equal(
    escaparFiltroObraRelacionadaLike("Obra, volume 1. (final)"),
    "Obra, volume 1. (final)",
  );
  assert.equal(
    escaparFiltroObraRelacionadaLike("\\%_),.(%\\_"),
    "\\\\\\%\\_),.(\\%\\\\\\_",
  );
});

test("loader preserva limite, busca por prefixo, paginacao e ordenacao", () => {
  assert.match(
    loaderSource,
    /const obraFiltroLimpa = obraFiltro\.trim\(\)\.slice\(0, 90\);/,
  );
  assert.match(
    loaderSource,
    /const obraFiltroLike = escaparFiltroObraRelacionadaLike\(obraFiltroLimpa\);/,
  );
  assert.match(
    loaderSource,
    /\.like\(\s*"obra_relacionada",\s*`\$\{obraFiltroLike\}%`,\s*\)/,
  );
  assert.match(
    loaderSource,
    /calcularIntervaloPaginaSupabase\(\s*pagina,\s*POSTS_COMUNIDADE_POR_PAGINA,\s*\)/,
  );
  assert.match(
    loaderSource,
    /\.order\("criado_em", \{ ascending: false \}\)\s*\.order\("id", \{ ascending: false \}\)\s*\.range\(inicio, fim\)/,
  );
});
