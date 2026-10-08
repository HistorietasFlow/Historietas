import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL("../../app/listas/lib/listas-format-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/listas/page.tsx", import.meta.url),
  "utf8",
);
const utilsJavascript = typescript.transpileModule(utilsSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  compactarNumero,
  formatarDataCurta,
  formatarLeituraMesAno,
  formatarMesAno,
  formatarNotaListas,
  timestampData,
} = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

const dataValida = "2024-05-15T12:00:00.000Z";

test("timestampData preserva timestamps validos e fallback invalido", () => {
  assert.equal(timestampData(dataValida), new Date(dataValida).getTime());
  assert.equal(timestampData("data-invalida"), 0);
});

test("formatadores de data preservam locale, fallbacks e textos", () => {
  const data = new Date(dataValida);
  const dataCurtaEsperada = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(data)
    .replace(" de ", " ")
    .replace(" de ", " ");
  const mesAnoEsperado = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(data);

  assert.equal(formatarDataCurta("data-invalida"), "Data não informada");
  assert.equal(formatarDataCurta(dataValida), dataCurtaEsperada);
  assert.equal(formatarMesAno("data-invalida"), "SEM DATA");
  assert.equal(
    formatarMesAno(dataValida),
    mesAnoEsperado.toLocaleUpperCase("pt-BR"),
  );
  assert.equal(formatarLeituraMesAno("data-invalida"), "");
  assert.equal(formatarLeituraMesAno(dataValida), `Lido em ${mesAnoEsperado}`);
});

test("compactarNumero preserva a decisao de notacao e uma casa decimal", () => {
  const formatoNormal = new Intl.NumberFormat("pt-BR", {
    notation: "standard",
    maximumFractionDigits: 1,
  });
  const formatoCompacto = new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  assert.equal(compactarNumero(-12), formatoNormal.format(0));
  assert.equal(compactarNumero(999.94), formatoNormal.format(999.94));
  assert.equal(compactarNumero(1000), formatoCompacto.format(1000));
  assert.equal(compactarNumero(1234.56), formatoCompacto.format(1234.56));
});

test("formatarNotaListas preserva validacao e arredondamento decimal", () => {
  assert.equal(formatarNotaListas(Number.NaN), "0");
  assert.equal(formatarNotaListas(Infinity), "0");
  assert.equal(formatarNotaListas(0), "0");
  assert.equal(formatarNotaListas(-1), "0");
  assert.equal(formatarNotaListas(4), "4");
  assert.equal(formatarNotaListas(4.5), "4,5");
  assert.equal(formatarNotaListas(4.56), "4,6");
});

test("Listas delega somente os formatadores extraidos", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?compactarNumero,[\s\S]*?formatarDataCurta,[\s\S]*?formatarLeituraMesAno,[\s\S]*?formatarMesAno,[\s\S]*?formatarNotaListas,[\s\S]*?timestampData,[\s\S]*?\} from "\.\/lib\/listas-format-utils";/,
  );

  for (const helper of [
    "timestampData",
    "formatarDataCurta",
    "formatarMesAno",
    "formatarLeituraMesAno",
    "compactarNumero",
    "formatarNotaListas",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
    assert.match(pagina, new RegExp(`\\b${helper}\\(`));
  }

  assert.match(pagina, /await supabase\.auth\.getUser\(\)/);
  assert.match(pagina, /function iniciar\(\)/);
  assert.match(pagina, /function salvarAnotacaoListas\(\)/);
  assert.match(pagina, /function enviarComentarioAnotacaoListas\(/);
  assert.doesNotMatch(utilsSource, /useState|useEffect|supabase|localStorage/);
});
