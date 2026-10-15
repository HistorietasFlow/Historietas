import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-reading-progress-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const moduloExecutavel = modulo.replace(
  'import { calcularProgressoLeitura } from "./home-reading-utils";\n',
  `const calcularProgressoLeitura = (capitulos) => {
  if (capitulos.length === 0) return 0;
  return Math.round((capitulos.filter((capitulo) => capitulo.lido).length / capitulos.length) * 100);
};
`,
);
const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { aplicarProgressoLeituraHome } = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

const obra = (overrides = {}) => ({
  id: "obra-1",
  capitulos: [
    { id: "cap-1", lido: false, lidoEm: "", campoPreservado: "primeiro" },
    { id: "cap-2", lido: true, lidoEm: "2025-01-01T00:00:00.000Z", campoPreservado: "segundo" },
  ],
  ultimoCapituloLidoId: "cap-2",
  ultimaLeituraEm: "2025-01-01T00:00:00.000Z",
  progressoLeitura: 50,
  ...overrides,
});

test("home-reading-progress-utils preserva a obra original sem progresso carregado", () => {
  const obraOriginal = obra();
  assert.strictEqual(
    aplicarProgressoLeituraHome(obraOriginal, new Map(), false),
    obraOriginal,
  );
});

test("home-reading-progress-utils aplica progresso e conserva campos dos capítulos", () => {
  const resultado = aplicarProgressoLeituraHome(
    obra(),
    new Map([
      ["cap-1", { lido: true, atualizado_em: "2025-02-01T00:00:00.000Z" }],
      ["cap-2", { lido: false, atualizado_em: "2025-03-01T00:00:00.000Z" }],
    ]),
    true,
  );

  assert.deepEqual(resultado.capitulos, [
    { id: "cap-1", lido: true, lidoEm: "2025-02-01T00:00:00.000Z", campoPreservado: "primeiro" },
    { id: "cap-2", lido: false, lidoEm: "", campoPreservado: "segundo" },
  ]);
  assert.equal(resultado.ultimoCapituloLidoId, "cap-1");
  assert.equal(resultado.ultimaLeituraEm, "2025-02-01T00:00:00.000Z");
  assert.equal(resultado.progressoLeitura, 50);
});

test("home-reading-progress-utils preserva fallback local, datas inválidas e desempate", () => {
  const resultado = aplicarProgressoLeituraHome(
    obra({
      capitulos: [
        { id: "cap-1", lido: false, lidoEm: "invalida", campoPreservado: "primeiro" },
        { id: "cap-2", lido: false, lidoEm: "2025-01-02T00:00:00.000Z", campoPreservado: "segundo" },
      ],
    }),
    new Map([
      ["cap-1", { lido: true, atualizado_em: null }],
      ["cap-2", { lido: true, atualizado_em: "invalida" }],
    ]),
    true,
  );

  assert.equal(resultado.capitulos[0].lidoEm, "invalida");
  assert.equal(resultado.capitulos[1].lidoEm, "invalida");
  assert.equal(resultado.ultimoCapituloLidoId, "cap-2");
  assert.equal(resultado.ultimaLeituraEm, "invalida");
  assert.equal(resultado.progressoLeitura, 100);
});

test("home-reading-progress-utils estabelece a fronteira pura do progresso", () => {
  assert.match(
    pagina,
    /import \{ aplicarProgressoLeituraHome \} from "\.\/lib\/home-reading-progress-utils";/,
  );
  assert.match(modulo, /export function aplicarProgressoLeituraHome\b/);
  assert.doesNotMatch(pagina, /function aplicarProgressoLeituraHome\b/);
  assert.match(modulo, /import \{ calcularProgressoLeitura \} from "\.\/home-reading-utils";/);
  assert.match(modulo, /tempoAtualSeguro >= tempoUltimaLeituraSeguro/);
  assert.doesNotMatch(modulo, /supabase|localStorage|useEffect|useState/);
});
