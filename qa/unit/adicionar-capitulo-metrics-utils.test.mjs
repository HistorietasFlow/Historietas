import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const metricsSource = readFileSync(
  new URL("../../app/adicionar-capitulo/lib/adicionar-capitulo-metrics-utils.ts", import.meta.url),
  "utf8",
);
const textSource = readFileSync(
  new URL("../../app/adicionar-capitulo/lib/adicionar-capitulo-text-utils.ts", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const transpilar = (source) => typescript.transpileModule(source, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const textDataUrl = `data:text/javascript;base64,${Buffer.from(transpilar(textSource)).toString("base64")}`;
const metricsJavascript = transpilar(metricsSource.replace("./adicionar-capitulo-text-utils", textDataUrl));
const { calcularEstatisticasCapitulo, calcularProgressoLeitura } = await import(
  `data:text/javascript;base64,${Buffer.from(metricsJavascript).toString("base64")}`,
);

test("métricas de Adicionar Capítulo preservam estatísticas", () => {
  const estatisticas = calcularEstatisticasCapitulo("  Título  ", "  um   dois  ", 4);
  assert.deepEqual(estatisticas, {
    tituloFinal: "Título", palavras: 2, caracteres: 13, caracteresValidos: 6,
    minutosLeitura: 1, tituloValido: true, textoValido: false, prontoParaCriar: false,
  });
  assert.equal(calcularEstatisticasCapitulo("", "", 7).tituloFinal, "Capítulo 7");
  assert.equal(calcularEstatisticasCapitulo("Título", " ", 1).minutosLeitura, 0);
  assert.equal(calcularEstatisticasCapitulo("Título", "a ".repeat(220), 1).minutosLeitura, 1);
  assert.equal(calcularEstatisticasCapitulo("Título", "a ".repeat(221), 1).minutosLeitura, 2);
  assert.equal(calcularEstatisticasCapitulo("ab", "a".repeat(20), 1).prontoParaCriar, false);
  assert.equal(calcularEstatisticasCapitulo("abc", "a".repeat(20), 1).prontoParaCriar, true);
});

test("métricas de Adicionar Capítulo preservam progresso", () => {
  assert.equal(calcularProgressoLeitura([]), 0);
  assert.equal(calcularProgressoLeitura([{ lido: false }, { lido: 1 }]), 50);
  assert.equal(calcularProgressoLeitura([{ lido: true }, { lido: true }]), 100);
  assert.equal(calcularProgressoLeitura([{ lido: true }, { lido: false }, { lido: false }]), 33);
});

test("Adicionar Capítulo delega somente métricas ao módulo extraído", () => {
  assert.match(metricsSource, /import \{ contarLetrasNumeros \} from "\.\/adicionar-capitulo-text-utils";/);
  assert.match(pageSource, /import \{[\s\S]*?calcularEstatisticasCapitulo,[\s\S]*?calcularProgressoLeitura,[\s\S]*?\} from "\.\/lib\/adicionar-capitulo-metrics-utils";/);
  assert.doesNotMatch(pageSource, /function calcularEstatisticasCapitulo\(/);
  assert.doesNotMatch(pageSource, /function calcularProgressoLeitura\(/);
  assert.equal((pageSource.match(/calcularEstatisticasCapitulo\(/g) || []).length, 1);
  assert.equal((pageSource.match(/calcularProgressoLeitura\(/g) || []).length, 4);
  assert.match(pageSource, /import \{[\s\S]*?contarLetrasNumeros,[\s\S]*?criarTituloPorNomeArquivo,[\s\S]*?\} from "\.\/lib\/adicionar-capitulo-text-utils";/);
  assert.doesNotMatch(metricsSource, /supabase|localStorage|useState|useEffect|router|<[A-Z]/);
});
