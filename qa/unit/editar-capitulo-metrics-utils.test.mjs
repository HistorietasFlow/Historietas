import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const metricsSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-metrics-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
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
const workNormalizerSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-work-normalizer.ts",
    import.meta.url,
  ),
  "utf8",
);
const supabaseMappersSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-supabase-mappers.ts",
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
const localDeleteMutationSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-local-delete-mutation.ts",
    import.meta.url,
  ),
  "utf8",
);
const transpilar = (source) =>
  typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
const textUtilsDataUrl = `data:text/javascript;base64,${Buffer.from(
  transpilar(textUtilsSource),
).toString("base64")}`;
const metricsJavascript = transpilar(
  metricsSource.replace("./editar-capitulo-text-utils", textUtilsDataUrl),
);
const {
  normalizarNumeroEditarCapitulo,
  calcularEstatisticasCapitulo,
  calcularProgressoLeitura,
} = await import(
  `data:text/javascript;base64,${Buffer.from(metricsJavascript).toString("base64")}`,
);

test("métricas de Editar Capítulo preservam normalização numérica", () => {
  assert.equal(normalizarNumeroEditarCapitulo(3.6), 4);
  assert.equal(normalizarNumeroEditarCapitulo(-3.6), 0);
  assert.equal(normalizarNumeroEditarCapitulo("1.234,6"), 1235);
  assert.equal(normalizarNumeroEditarCapitulo("inválido", 4.6), 5);
  assert.equal(normalizarNumeroEditarCapitulo(Number.NaN, -4.6), 0);
});

test("métricas de Editar Capítulo preservam estatísticas e progresso", () => {
  const texto = `  ${"a".repeat(20)} palavra`;
  const estatisticas = calcularEstatisticasCapitulo("  ", texto, 7);

  assert.equal(estatisticas.tituloFinal, "Capítulo 7");
  assert.equal(estatisticas.caracteres, texto.length);
  assert.equal(estatisticas.palavras, 2);
  assert.equal(estatisticas.minutosLeitura, 1);
  assert.equal(estatisticas.tituloValido, true);
  assert.equal(estatisticas.textoValido, true);
  assert.equal(estatisticas.prontoParaSalvar, true);
  assert.equal(calcularEstatisticasCapitulo("ab", "texto curto", 1).tituloValido, false);
  assert.equal(calcularEstatisticasCapitulo("Título", "a".repeat(19), 1).textoValido, false);
  assert.equal(calcularProgressoLeitura([]), 0);
  assert.equal(calcularProgressoLeitura([{ lido: true }, { lido: false }, { lido: true }]), 67);
  assert.equal(calcularProgressoLeitura([{ lido: true }, { lido: true }]), 100);
});

test("Editar Capítulo delega somente as métricas ao módulo extraído", () => {
  assert.match(
    metricsSource,
    /import \{[\s\S]*?contarLetrasNumeros,[\s\S]*?contarPalavras,[\s\S]*?\} from "\.\/editar-capitulo-text-utils";/,
  );
  assert.doesNotMatch(
    pageSource,
    /import \{ calcularProgressoLeitura \} from "\.\/lib\/editar-capitulo-metrics-utils";/,
  );
  assert.match(
    localDeleteMutationSource,
    /import \{ calcularProgressoLeitura \} from "\.\/editar-capitulo-metrics-utils";/,
  );
  assert.match(
    supabaseMappersSource,
    /import \{[\s\S]*?calcularProgressoLeitura,[\s\S]*?normalizarNumeroEditarCapitulo,[\s\S]*?\} from "\.\/editar-capitulo-metrics-utils";/,
  );
  assert.doesNotMatch(pageSource, /function normalizarNumeroEditarCapitulo\(/);
  assert.doesNotMatch(pageSource, /function calcularEstatisticasCapitulo\(/);
  assert.doesNotMatch(pageSource, /function calcularProgressoLeitura\(/);
  assert.match(
    workNormalizerSource,
    /progressoLeitura: calcularProgressoLeitura\(capitulosNormalizados\)/,
  );
  assert.match(
    localDeleteMutationSource,
    /progressoLeitura: calcularProgressoLeitura\(capitulosRestantes\)/,
  );
  assert.match(textImportSource, /const estatisticasImportadas = calcularEstatisticasCapitulo\(/);
  assert.match(supabaseMappersSource, /progressoLeitura: calcularProgressoLeitura\(capitulos\)/);
  assert.match(supabaseMappersSource, /visualizacoes: normalizarNumeroEditarCapitulo\(/);
  assert.match(supabaseMappersSource, /totalCurtidas: normalizarNumeroEditarCapitulo\(/);
  assert.match(supabaseMappersSource, /totalComentarios: normalizarNumeroEditarCapitulo\(/);
  assert.match(supabaseMappersSource, /totalSalvos: normalizarNumeroEditarCapitulo\(/);
  assert.match(supabaseMappersSource, /totalLidos: normalizarNumeroEditarCapitulo\(/);
  assert.match(supabaseMappersSource, /totalFavoritos: normalizarNumeroEditarCapitulo\(/);
  assert.match(supabaseMappersSource, /totalConcluidas: normalizarNumeroEditarCapitulo\(/);
  assert.doesNotMatch(metricsSource, /supabase|localStorage|useState|useEffect/);
});
