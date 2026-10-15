import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-reading-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const javascriptModulo = typescript.transpileModule(modulo, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  calcularProgressoLeitura,
  encontrarCapituloParaContinuar,
  obterTempoUltimaLeitura,
  obterTempoUltimoCapitulo,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

const criarCapitulo = (id, overrides = {}) => ({
  id,
  criadoEm: "2025-01-01T00:00:00.000Z",
  lido: false,
  lidoEm: "",
  ...overrides,
});

const criarObra = (overrides = {}) => ({
  capitulos: [],
  criadaEm: "2024-01-01T00:00:00.000Z",
  ultimoCapituloLidoId: "",
  ultimaLeituraEm: "",
  ...overrides,
});

test("home-reading-utils calcula progresso vazio e percentual arredondado", () => {
  assert.equal(calcularProgressoLeitura([]), 0);
  assert.equal(
    calcularProgressoLeitura([
      criarCapitulo("capitulo-1", { lido: true }),
      criarCapitulo("capitulo-2", { lido: false }),
      criarCapitulo("capitulo-3", { lido: false }),
    ]),
    33,
  );
  assert.equal(
    calcularProgressoLeitura([
      criarCapitulo("capitulo-1", { lido: true }),
      criarCapitulo("capitulo-2", { lido: true }),
      criarCapitulo("capitulo-3", { lido: false }),
    ]),
    67,
  );
});

test("home-reading-utils preserva a continuação e seus fallbacks", () => {
  const capituloLido = criarCapitulo("capitulo-1", { lido: true });
  const proximoCapitulo = criarCapitulo("capitulo-2");
  const capituloSeguinte = criarCapitulo("capitulo-3");

  assert.equal(
    encontrarCapituloParaContinuar(criarObra({
      capitulos: [capituloLido, proximoCapitulo, capituloSeguinte],
      ultimoCapituloLidoId: capituloLido.id,
    })),
    proximoCapitulo,
  );
  assert.equal(
    encontrarCapituloParaContinuar(criarObra({
      capitulos: [proximoCapitulo, capituloLido, capituloSeguinte],
      ultimoCapituloLidoId: "ausente",
    })),
    proximoCapitulo,
  );
  assert.equal(
    encontrarCapituloParaContinuar(criarObra({ capitulos: [proximoCapitulo] })),
    null,
  );
  assert.equal(
    encontrarCapituloParaContinuar(criarObra({
      capitulos: [criarCapitulo("capitulo-1", { lido: true })],
      ultimoCapituloLidoId: "capitulo-1",
    })),
    null,
  );
});

test("home-reading-utils preserva os tempos de leitura e datas inválidas", () => {
  const tempoCapitulo = Date.parse("2025-02-01T00:00:00.000Z");
  const tempoObra = Date.parse("2025-03-01T00:00:00.000Z");
  const obra = criarObra({
    ultimaLeituraEm: "2025-01-01T00:00:00.000Z",
    capitulos: [
      criarCapitulo("capitulo-1", {
        lido: true,
        lidoEm: "2025-02-01T00:00:00.000Z",
      }),
    ],
  });

  assert.equal(obterTempoUltimaLeitura(obra), tempoCapitulo);
  assert.equal(
    obterTempoUltimaLeitura({ ...obra, ultimaLeituraEm: "2025-03-01T00:00:00.000Z" }),
    tempoObra,
  );
  assert.equal(
    obterTempoUltimaLeitura(criarObra({
      ultimaLeituraEm: "invalida",
      capitulos: [criarCapitulo("capitulo-1", { lido: true, lidoEm: "invalida" })],
    })),
    0,
  );
});

test("home-reading-utils preserva o tempo do último capítulo e fallback da obra", () => {
  const tempoCapitulo = Date.parse("2025-04-01T00:00:00.000Z");
  const tempoObra = Date.parse("2024-05-01T00:00:00.000Z");

  assert.equal(
    obterTempoUltimoCapitulo(criarObra({
      capitulos: [criarCapitulo("capitulo-1", { criadoEm: "2025-04-01T00:00:00.000Z" })],
    })),
    tempoCapitulo,
  );
  assert.equal(
    obterTempoUltimoCapitulo(criarObra({ criadaEm: "2024-05-01T00:00:00.000Z" })),
    tempoObra,
  );
  assert.equal(
    obterTempoUltimoCapitulo(criarObra({ criadaEm: "invalida" })),
    0,
  );
});

test("home-reading-utils estabelece a fronteira pura da Home", () => {
  for (const nomeFuncao of [
    "calcularProgressoLeitura",
    "encontrarCapituloParaContinuar",
    "obterTempoUltimaLeitura",
    "obterTempoUltimoCapitulo",
  ]) {
    assert.match(modulo, new RegExp(`export function ${nomeFuncao}\\b`));
    assert.doesNotMatch(pagina, new RegExp(`function ${nomeFuncao}\\b`));
  }
  assert.match(pagina, /from "\.\/lib\/home-reading-utils";/);
  assert.match(modulo, /\.some\(\(capitulo\) => capitulo\.lido\)/);
  assert.match(modulo, /\.slice\(indiceUltimoCapituloLido \+ 1\)/);
  assert.match(modulo, /Math\.max\(0, \.\.\.temposLeitura\)/);
  assert.doesNotMatch(modulo, /supabase|localStorage|useEffect|useState/);
});
