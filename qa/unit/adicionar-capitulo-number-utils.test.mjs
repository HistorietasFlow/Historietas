import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL("../../app/adicionar-capitulo/lib/adicionar-capitulo-number-utils.ts", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const utilsJavascript = typescript.transpileModule(utilsSource, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const {
  normalizarNumeroAdicionarCapitulo,
  obterCampoNumericoObraAdicionarCapitulo,
} = await import(`data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`);

test("normalizador numérico de Adicionar Capítulo preserva parsing e fallback", () => {
  assert.equal(normalizarNumeroAdicionarCapitulo(123), 123);
  assert.equal(normalizarNumeroAdicionarCapitulo(12.5), 13);
  assert.equal(normalizarNumeroAdicionarCapitulo(-2), 0);
  assert.equal(normalizarNumeroAdicionarCapitulo(Number.NaN, 4.5), 5);
  assert.equal(normalizarNumeroAdicionarCapitulo(Infinity, 4.5), 5);
  assert.equal(normalizarNumeroAdicionarCapitulo("", 4), 4);
  assert.equal(normalizarNumeroAdicionarCapitulo("   ", 4), 4);
  assert.equal(normalizarNumeroAdicionarCapitulo("123"), 123);
  assert.equal(normalizarNumeroAdicionarCapitulo("12,5"), 13);
  assert.equal(normalizarNumeroAdicionarCapitulo("1.234,56"), 1235);
  assert.equal(normalizarNumeroAdicionarCapitulo("-1,5"), 0);
  assert.equal(normalizarNumeroAdicionarCapitulo("abc", 4.5), 5);
  assert.equal(normalizarNumeroAdicionarCapitulo(undefined, -2.5), 0);
});

test("campos numéricos de obra preservam a primeira ocorrência elegível", () => {
  assert.equal(
    obterCampoNumericoObraAdicionarCapitulo({ primeiro: "abc", segundo: "123" }, ["primeiro", "segundo"], 8),
    8,
  );
  assert.equal(
    obterCampoNumericoObraAdicionarCapitulo({ primeiro: Number.NaN, segundo: "", terceiro: "12" }, ["primeiro", "segundo", "terceiro"], 8),
    12,
  );
  assert.equal(
    obterCampoNumericoObraAdicionarCapitulo({ primeiro: 4, segundo: "9" }, ["primeiro", "segundo"]),
    4,
  );
  assert.equal(obterCampoNumericoObraAdicionarCapitulo({}, ["ausente"], 6), 6);
});

test("Adicionar Capítulo delega somente os helpers numéricos puros", () => {
  assert.match(pageSource, /import \{[\s\S]*?normalizarNumeroAdicionarCapitulo,[\s\S]*?obterCampoNumericoObraAdicionarCapitulo,[\s\S]*?\} from "\.\/lib\/adicionar-capitulo-number-utils";/);
  assert.doesNotMatch(pageSource, /function normalizarNumeroAdicionarCapitulo\(/);
  assert.doesNotMatch(pageSource, /function obterCampoNumericoObraAdicionarCapitulo\(/);
  assert.equal((pageSource.match(/obterCampoNumericoObraAdicionarCapitulo\(/g) || []).length, 5);
  assert.equal((pageSource.match(/normalizarNumeroAdicionarCapitulo\(/g) || []).length, 5);
  assert.match(pageSource, /function normalizarObra\(/);
  assert.match(pageSource, /function normalizarObraSupabase\(/);
  assert.doesNotMatch(utilsSource, /supabase|localStorage|useState|useEffect|router|<[A-Z]/);
});
