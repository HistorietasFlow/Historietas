import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

function transpilarModuloTypescript(caminho) {
  const texto = readFileSync(new URL(caminho, import.meta.url), "utf8");

  return typescript.transpileModule(texto, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
}

function criarUrlModulo(codigo) {
  return `data:text/javascript;base64,${Buffer.from(codigo).toString("base64")}`;
}

const metricasJavascript = [
  "export async function carregarMetricasConteudos(parametros) {",
  "  globalThis.metricasChamadas.push(parametros);",
  "  return globalThis.metricasResultado;",
  "}",
].join("\n");
const normalizacaoJavascript = [
  "export function normalizarContadorObraPublica(valor) {",
  "  if (typeof valor === \"number\" && Number.isFinite(valor)) return Math.max(0, Math.round(valor));",
  "  if (typeof valor === \"string\" && valor.trim()) {",
  "    const numero = Number(valor.replace(/\\./g, \"\").replace(\",\", \".\"));",
  "    if (Number.isFinite(numero)) return Math.max(0, Math.round(numero));",
  "  }",
  "  return 0;",
  "}",
].join("\n");
const leituraJavascript = [
  "export function calcularProgressoLeitura(capitulos) {",
  "  if (capitulos.length === 0) return 0;",
  "  return Math.round((capitulos.filter((capitulo) => capitulo.lido).length / capitulos.length) * 100);",
  "}",
].join("\n");
const metricasUrl = criarUrlModulo(metricasJavascript);
const normalizacaoUrl = criarUrlModulo(normalizacaoJavascript);
const leituraUrl = criarUrlModulo(leituraJavascript);
const aplicacaoMetricasJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-metrics-application-utils.ts",
)
  .replace('from "../../../../lib/metricas";', `from "${metricasUrl}";`)
  .replace('from "./obra-metric-utils";', `from "${normalizacaoUrl}";`)
  .replace('from "./obra-reading-utils";', `from "${leituraUrl}";`);
const { aplicarMetricasObraPublica } = await import(
  criarUrlModulo(aplicacaoMetricasJavascript),
);

function criarContratoMetricas({ carregado = true, obras = [], capitulos = [] } = {}) {
  return {
    carregado,
    obras: new Map(obras),
    capitulos: new Map(capitulos),
  };
}

function criarCapitulo({
  id,
  curtiu = false,
  salvo = false,
  lido = false,
  lidoEm = "",
  totalCurtidas = 0,
  totalComentarios = 0,
  totalSalvos = 0,
  totalLidos = 0,
}) {
  return {
    id,
    curtiu,
    salvo,
    lido,
    lidoEm,
    totalCurtidas,
    totalComentarios,
    totalSalvos,
    totalLidos,
  };
}

function criarObra({
  id,
  capitulos = [],
  ultimoCapituloLidoId = "",
  ultimaLeituraEm = "",
  visualizacoes = 0,
  totalCurtidas = 0,
  totalComentarios = 0,
  totalFavoritos = 0,
  totalConcluidas = 0,
}) {
  return {
    id,
    capitulos,
    ultimoCapituloLidoId,
    ultimaLeituraEm,
    visualizacoes,
    totalCurtidas,
    totalComentarios,
    totalFavoritos,
    totalConcluidas,
  };
}

function prepararMetricas(resultado) {
  globalThis.metricasChamadas = [];
  globalThis.metricasResultado = resultado;
}

test("retorna a coleção original sem consultar métricas quando não há IDs", async () => {
  const obras = [criarObra({ id: " ", capitulos: [criarCapitulo({ id: " " })] })];
  prepararMetricas(criarContratoMetricas());

  const resultado = await aplicarMetricasObraPublica(obras, "usuario-a");

  assert.equal(resultado, obras);
  assert.deepEqual(globalThis.metricasChamadas, []);
});

test("preserva a coleção original quando o contrato de métricas não carrega", async () => {
  const obras = [criarObra({ id: "obra-1", capitulos: [criarCapitulo({ id: "capitulo-1" })] })];
  prepararMetricas(criarContratoMetricas({ carregado: false }));

  const resultado = await aplicarMetricasObraPublica(obras, "usuario-a");

  assert.equal(resultado, obras);
  assert.deepEqual(globalThis.metricasChamadas, [
    { obraIds: ["obra-1"], capituloIds: ["capitulo-1"] },
  ]);
});

test("aplica métricas remotas, fallbacks locais e preserva totalLidos local", async () => {
  const obras = [
    criarObra({
      id: "obra-1",
      capitulos: [
        criarCapitulo({
          id: "capitulo-remoto",
          totalLidos: "17",
        }),
        criarCapitulo({
          id: "capitulo-local",
          curtiu: true,
          salvo: true,
          lido: true,
          lidoEm: "2026-01-01T00:00:00.000Z",
          totalCurtidas: "4",
          totalComentarios: "5",
          totalSalvos: "6",
          totalLidos: "8",
        }),
      ],
      visualizacoes: "3",
      totalCurtidas: "4",
      totalComentarios: "5",
      totalFavoritos: "6",
      totalConcluidas: "7",
    }),
  ];
  prepararMetricas(
    criarContratoMetricas({
      obras: [
        [
          "obra-1",
          {
            visualizacoes: 30,
            interacoesDiretas: {
              curtidas: 40,
              comentarios: 50,
              favoritos: 60,
              concluidas: 70,
            },
          },
        ],
      ],
      capitulos: [
        [
          "capitulo-remoto",
          {
            usuario: {
              curtiu: true,
              salvou: true,
              leu: true,
              lidoEm: "2026-02-02T00:00:00.000Z",
            },
            interacoes: {
              curtidas: 10,
              comentarios: 11,
              salvos: 12,
            },
          },
        ],
      ],
    }),
  );

  const [resultado] = await aplicarMetricasObraPublica(obras, "usuario-a");

  assert.notEqual(resultado, obras[0]);
  assert.equal(resultado.visualizacoes, 30);
  assert.equal(resultado.totalCurtidas, 40);
  assert.equal(resultado.totalComentarios, 50);
  assert.equal(resultado.totalFavoritos, 60);
  assert.equal(resultado.totalConcluidas, 70);
  assert.equal(resultado.capitulos[0].curtiu, true);
  assert.equal(resultado.capitulos[0].salvo, true);
  assert.equal(resultado.capitulos[0].lido, true);
  assert.equal(resultado.capitulos[0].totalCurtidas, 10);
  assert.equal(resultado.capitulos[0].totalComentarios, 11);
  assert.equal(resultado.capitulos[0].totalSalvos, 12);
  assert.equal(resultado.capitulos[0].totalLidos, 17);
  assert.equal(resultado.capitulos[1].totalCurtidas, 4);
  assert.equal(resultado.capitulos[1].totalComentarios, 5);
  assert.equal(resultado.capitulos[1].totalSalvos, 6);
  assert.equal(resultado.capitulos[1].totalLidos, 8);
  assert.equal(resultado.ultimoCapituloLidoId, "capitulo-remoto");
  assert.equal(resultado.ultimaLeituraEm, "2026-02-02T00:00:00.000Z");
  assert.equal(resultado.progressoLeitura, 100);
});

test("mantém o progresso local quando não há usuário autenticado", async () => {
  const obras = [
    criarObra({
      id: "obra-1",
      ultimoCapituloLidoId: "capitulo-local",
      ultimaLeituraEm: "2026-01-01T00:00:00.000Z",
      capitulos: [
        criarCapitulo({
          id: "capitulo-local",
          lido: false,
          lidoEm: "2026-01-01T00:00:00.000Z",
        }),
      ],
    }),
  ];
  prepararMetricas(
    criarContratoMetricas({
      capitulos: [
        [
          "capitulo-local",
          {
            usuario: {
              curtiu: false,
              salvou: false,
              leu: true,
              lidoEm: "2026-02-02T00:00:00.000Z",
            },
            interacoes: { curtidas: 0, comentarios: 0, salvos: 0 },
          },
        ],
      ],
    }),
  );

  const [resultado] = await aplicarMetricasObraPublica(obras, "");

  assert.equal(resultado.capitulos[0].lido, false);
  assert.equal(resultado.capitulos[0].lidoEm, "2026-01-01T00:00:00.000Z");
  assert.equal(resultado.ultimoCapituloLidoId, "capitulo-local");
  assert.equal(resultado.ultimaLeituraEm, "2026-01-01T00:00:00.000Z");
  assert.equal(resultado.progressoLeitura, 0);
});
