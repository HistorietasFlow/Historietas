import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const textUtilsSource = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/lib/adicionar-capitulo-text-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const metricsSource = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/lib/adicionar-capitulo-metrics-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const textImportSource = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/lib/adicionar-capitulo-text-import.ts",
    import.meta.url,
  ),
  "utf8",
);
const validationSource = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/lib/adicionar-capitulo-validation.ts",
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
const { contarLetrasNumeros, criarTituloPorNomeArquivo } = await import(
  `data:text/javascript;base64,${Buffer.from(textUtilsJavascript).toString("base64")}`,
);

test("contarLetrasNumeros preserva letras, números e Unicode", () => {
  assert.equal(contarLetrasNumeros("abc"), 3);
  assert.equal(contarLetrasNumeros("123"), 3);
  assert.equal(contarLetrasNumeros("áéí"), 3);
  assert.equal(contarLetrasNumeros("Ж漢"), 2);
  assert.equal(contarLetrasNumeros("A 1-á漢"), 4);
});

test("contarLetrasNumeros ignora espaços, pontuação e símbolos", () => {
  assert.equal(contarLetrasNumeros("   "), 0);
  assert.equal(contarLetrasNumeros("!?.,;"), 0);
  assert.equal(contarLetrasNumeros("@#$%&*"), 0);
  assert.equal(contarLetrasNumeros(""), 0);
});

test("criarTituloPorNomeArquivo preserva extensões aceitas, separadores e espaços", () => {
  assert.equal(criarTituloPorNomeArquivo("capitulo.txt"), "capitulo");
  assert.equal(criarTituloPorNomeArquivo("capitulo.md"), "capitulo");
  assert.equal(criarTituloPorNomeArquivo("CAPITULO.TXT"), "CAPITULO");
  assert.equal(criarTituloPorNomeArquivo("capitulo.pdf"), "capitulo.pdf");
  assert.equal(
    criarTituloPorNomeArquivo("capitulo___-__final.txt"),
    "capitulo final",
  );
  assert.equal(
    criarTituloPorNomeArquivo("  Capítulo   final  .md  "),
    "Capítulo final .md",
  );
});

test("Adicionar Capítulo delega somente os helpers de texto ao módulo extraído", () => {
  assert.doesNotMatch(pageSource, /function contarLetrasNumeros\(/);
  assert.doesNotMatch(pageSource, /function criarTituloPorNomeArquivo\(/);
  assert.match(metricsSource, /import \{ contarLetrasNumeros \} from "\.\/adicionar-capitulo-text-utils";/);
  assert.match(metricsSource, /contarLetrasNumeros\(textoLimpo\)/);
  assert.match(
    textImportSource,
    /import \{[\s\S]*?contarLetrasNumeros,[\s\S]*?criarTituloPorNomeArquivo,[\s\S]*?\} from "\.\/adicionar-capitulo-text-utils";/,
  );
  assert.match(textImportSource, /contarLetrasNumeros\(textoImportado\)/);
  assert.match(textImportSource, /criarTituloPorNomeArquivo\(arquivo\.name\)/);
  assert.match(
    pageSource,
    /import \{ validarCapitulo \} from "\.\/lib\/adicionar-capitulo-validation";/,
  );
  assert.doesNotMatch(pageSource, /function validarCapitulo\(/);
  assert.match(
    pageSource,
    /const erroValidacao = validarCapitulo\(\s*titulo,\s*texto,\s*numeroNovoCapitulo\s*\);/,
  );
  assert.match(
    validationSource,
    /from "\.\/adicionar-capitulo-text-utils"/,
  );
  assert.match(validationSource, /contarLetrasNumeros\(tituloFinal\)/);
  assert.match(validationSource, /contarLetrasNumeros\(textoLimpo\)/);
  assert.ok(textUtilsSource.includes("/[\\p{L}\\p{N}]/gu"));
  assert.match(textUtilsSource, /\?\.length \|\| 0/);
  assert.match(textUtilsSource, /\.replace\(\/\\\.\(txt\|md\)\$\/i, ""\)/);
  assert.match(textUtilsSource, /\.replace\(\/\[_-\]\+\/g, " "\)/);
  assert.doesNotMatch(textUtilsSource, /supabase|localStorage|useState|useEffect|<\w+/i);
});
