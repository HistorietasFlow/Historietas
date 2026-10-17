import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/seguindo/lib/seguindo-format-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const utilsSource = readFileSync(
  new URL("../../lib/utils.ts", import.meta.url),
  "utf8",
);
const options = {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
};
const utilsJs = typescript.transpileModule(utilsSource, options).outputText;
const utilsUrl =
  `data:text/javascript;base64,${Buffer.from(utilsJs).toString("base64")}`;
const executable = source.replace(
  '"../../../lib/utils"',
  JSON.stringify(utilsUrl),
);
const javascript = typescript.transpileModule(executable, options).outputText;
const {
  formatarGeneroSeguindo,
  normalizarListaTexto,
  normalizarNomeAutor,
  normalizarNumeroSeguindo,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

test("nome do autor preserva trim, espaços internos e normalização", () => {
  assert.equal(
    normalizarNomeAutor("  Ana   Maria  "),
    "ana maria",
  );
  assert.equal(normalizarNomeAutor(""), "");
});

test("gênero preserva aliases e fallback", () => {
  assert.equal(formatarGeneroSeguindo(" Fantasia Sombria "), "Fantasia");
  assert.equal(formatarGeneroSeguindo("sci-fi"), "Ficção");
  assert.equal(formatarGeneroSeguindo("SCI FI"), "Ficção");
  assert.equal(formatarGeneroSeguindo(" Romance "), "Romance");
  assert.equal(formatarGeneroSeguindo("   "), "Não informado");
});

test("lista de texto preserva trim, deduplicação e ordem", () => {
  assert.deepEqual(
    normalizarListaTexto([" a ", "", "b", "a", " b "]),
    ["a", "b"],
  );
});

test("número preserva arredondamento, formato pt-BR, piso zero e fallback", () => {
  assert.equal(normalizarNumeroSeguindo(12.6), 13);
  assert.equal(normalizarNumeroSeguindo(-4), 0);
  assert.equal(normalizarNumeroSeguindo("1.234,6"), 1235);
  assert.equal(normalizarNumeroSeguindo(" -2 "), 0);
  assert.equal(normalizarNumeroSeguindo("x", 7), 7);
  assert.equal(normalizarNumeroSeguindo(null, 9), 9);
});

test("página delega normalização e formatação ao módulo dedicado", () => {
  assert.match(
    pagina,
    /formatarGeneroSeguindo,[\s\S]*?normalizarListaTexto,[\s\S]*?normalizarNomeAutor,[\s\S]*?normalizarNumeroSeguindo,[\s\S]*?from "\.\/lib\/seguindo-format-utils";/,
  );

  for (const nome of [
    "normalizarNomeAutor",
    "formatarGeneroSeguindo",
    "normalizarListaTexto",
    "normalizarNumeroSeguindo",
  ]) {
    assert.doesNotMatch(
      pagina,
      new RegExp(`function ${nome}\\(`),
    );
  }
});
