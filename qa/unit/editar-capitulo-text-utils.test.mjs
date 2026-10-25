import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const textUtilsSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-text-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const metricsSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-metrics-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const validationSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-validation.ts",
    import.meta.url,
  ),
  "utf8",
);
const textImportSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-text-import.ts",
    import.meta.url,
  ),
  "utf8",
);
const textUtilsJavascript = typescript.transpileModule(textUtilsSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { contarLetrasNumeros, contarPalavras, criarTituloPorNomeArquivo } =
  await import(
    `data:text/javascript;base64,${Buffer.from(textUtilsJavascript).toString("base64")}`,
  );

test("helpers de texto de Editar Capítulo preservam Unicode, palavras e títulos de arquivo", () => {
  assert.equal(contarLetrasNumeros("Árvore 42! _"), 8);
  assert.equal(contarLetrasNumeros("   !@#_-"), 0);
  assert.equal(contarLetrasNumeros(""), 0);
  assert.equal(contarPalavras("  uma\tduas\ntrês  "), 3);
  assert.equal(contarPalavras("   "), 0);
  assert.equal(criarTituloPorNomeArquivo("Capitulo_final.md"), "Capitulo final");
  assert.equal(criarTituloPorNomeArquivo("CAPITULO.TXT"), "CAPITULO");
  assert.equal(
    criarTituloPorNomeArquivo("  arco__final---v2  .txt "),
    "arco final v2 .txt",
  );
});

test("Editar Capítulo delega somente os helpers de texto ao módulo extraído", () => {
  assert.match(
    textImportSource,
    /import \{[\s\S]*?contarLetrasNumeros,[\s\S]*?criarTituloPorNomeArquivo,[\s\S]*?\} from "\.\/editar-capitulo-text-utils";/,
  );
  assert.match(
    metricsSource,
    /import \{[\s\S]*?contarLetrasNumeros,[\s\S]*?contarPalavras,[\s\S]*?\} from "\.\/editar-capitulo-text-utils";/,
  );
  assert.doesNotMatch(pageSource, /function contarLetrasNumeros\(/);
  assert.doesNotMatch(pageSource, /function contarPalavras\(/);
  assert.doesNotMatch(pageSource, /function criarTituloPorNomeArquivo\(/);
  assert.match(metricsSource, /const palavras = contarPalavras\(textoLimpo\);/);
  assert.match(metricsSource, /const caracteresValidos = contarLetrasNumeros\(textoLimpo\);/);
  assert.match(textImportSource, /const tituloArquivo = criarTituloPorNomeArquivo\(arquivo\.name\);/);
  assert.match(textImportSource, /if \(contarLetrasNumeros\(textoImportado\) < 20\)/);
  assert.match(
    validationSource,
    /import \{ contarLetrasNumeros \} from "\.\/editar-capitulo-text-utils";/,
  );
  assert.match(validationSource, /if \(contarLetrasNumeros\(tituloFinal\) < 3\)/);
  assert.match(validationSource, /if \(contarLetrasNumeros\(textoLimpo\) < 20\)/);
  assert.match(textUtilsSource, /texto\.match\(\/\[\\p\{L\}\\p\{N\}\]\/gu\)\?\.length \|\| 0/);
  assert.match(textUtilsSource, /texto\.trim\(\)\.split\(\/\\s\+\/\)\.filter\(Boolean\)\.length/);
  assert.match(textUtilsSource, /\.replace\(\/\\\.\(txt\|md\)\$\/i, ""\)/);
  assert.doesNotMatch(textUtilsSource, /supabase|localStorage|useState|useEffect/);
});
