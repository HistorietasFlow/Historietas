import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import typescript from "typescript";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const modulePath = path.join(root, "app/explorar/lib/explorar-filter-button-label.ts");
const translationsPath = path.join(root, "app/explorar/lib/explorar-translations.ts");
const utilsPath = path.join(root, "lib/utils.ts");
const pagePath = path.join(root, "app/explorar/page.tsx");
const options = {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
};

async function carregarCriarTextoBotaoFiltrosAvancadosExplorar() {
  const [source, translations, utils] = await Promise.all([
    readFile(modulePath, "utf8"),
    readFile(translationsPath, "utf8"),
    readFile(utilsPath, "utf8"),
  ]);
  const utilsJs = typescript.transpileModule(utils, options).outputText;
  const utilsUrl = `data:text/javascript;base64,${Buffer.from(utilsJs).toString("base64")}`;
  const translationsJs = typescript.transpileModule(
    translations.replace('"../../../lib/utils"', JSON.stringify(utilsUrl)),
    options,
  ).outputText;
  const translationsUrl = `data:text/javascript;base64,${Buffer.from(translationsJs).toString("base64")}`;
  const executable = typescript.transpileModule(
    source.replace('"./explorar-translations"', JSON.stringify(translationsUrl)),
    options,
  ).outputText;
  const helperModule = await import(
    `data:text/javascript;base64,${Buffer.from(executable).toString("base64")}`,
  );

  return helperModule.criarTextoBotaoFiltrosAvancadosExplorar;
}

test("preserva condição, interpolação e tradução dinâmica do botão", async () => {
  const criarTextoBotaoFiltrosAvancadosExplorar =
    await carregarCriarTextoBotaoFiltrosAvancadosExplorar();

  assert.equal(criarTextoBotaoFiltrosAvancadosExplorar(0, "pt-BR"), "Explorar");
  assert.equal(criarTextoBotaoFiltrosAvancadosExplorar(1, "pt-BR"), "Explorar (1)");
  assert.equal(criarTextoBotaoFiltrosAvancadosExplorar(3, "pt-BR"), "Explorar (3)");
  assert.equal(criarTextoBotaoFiltrosAvancadosExplorar(0, "en"), "Explore");
  assert.equal(criarTextoBotaoFiltrosAvancadosExplorar(3, "en"), "Explore (3)");
  assert.equal(criarTextoBotaoFiltrosAvancadosExplorar(3, "es"), "Explorar (3)");
});

test("delega para traduzirTextoExplorar e remove a composição inline da página", async () => {
  const [source, pageRaw] = await Promise.all([
    readFile(modulePath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);
  const page = pageRaw.replace(/\r\n/g, "\n");

  assert.match(source, /traduzirTextoExplorar\(/);
  assert.match(source, /totalFiltrosAvancadosAtivos > 0/);
  assert.match(source, /`Explorar \(\$\{totalFiltrosAvancadosAtivos\}\)`/);
  assert.match(source, /: "Explorar"/);
  assert.match(
    page,
    /import \{ criarTextoBotaoFiltrosAvancadosExplorar \} from "\.\/lib\/explorar-filter-button-label";/,
  );
  assert.match(
    page,
    /const textoBotaoFiltrosAvancados =\n    criarTextoBotaoFiltrosAvancadosExplorar\(\n      totalFiltrosAvancadosAtivos,\n      language,\n    \);/,
  );
  assert.doesNotMatch(
    page,
    /const textoBotaoFiltrosAvancados = traduzirTextoExplorar\(/,
  );
});
