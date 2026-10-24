import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-chapter-metrics-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const metricasObrasSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-work-metrics.ts",
    import.meta.url,
  ),
  "utf8",
);
const utilsJavascript = typescript.transpileModule(utilsSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { calcularCurtidas, calcularComentarios, calcularSalvos } = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

globalThis.__painelAutorCalcularCurtidas = (obra) =>
  obra.capitulos.filter((capitulo) => capitulo.curtiu).length;
globalThis.__painelAutorCalcularComentarios = (obra) =>
  obra.capitulos.filter((capitulo) => capitulo.comentario.trim()).length;
globalThis.__painelAutorCalcularSalvos = (obra) =>
  obra.capitulos.filter((capitulo) => capitulo.salvo).length;
globalThis.__painelAutorObterCapitulosPublicados = (capitulos) =>
  capitulos.filter((capitulo) => capitulo.publicado !== false);
globalThis.__painelAutorCalcularProgresso = (capitulos) => {
  const publicados = globalThis.__painelAutorObterCapitulosPublicados(capitulos);
  if (publicados.length === 0) {
    return 0;
  }
  return Math.round(
    (publicados.filter((capitulo) => capitulo.lido).length / publicados.length) * 100,
  );
};
globalThis.__painelAutorEncontrarCapitulo = (obra) => {
  const publicados = globalThis.__painelAutorObterCapitulosPublicados(obra.capitulos);
  if (!publicados.some((capitulo) => capitulo.lido)) {
    return null;
  }
  const indice = obra.ultimoCapituloLidoId
    ? publicados.findIndex((capitulo) => capitulo.id === obra.ultimoCapituloLidoId)
    : -1;
  if (indice >= 0) {
    const proximo = publicados.slice(indice + 1).find((capitulo) => !capitulo.lido);
    if (proximo) {
      return proximo;
    }
  }
  return publicados.find((capitulo) => !capitulo.lido) || publicados.at(-1) || null;
};

const metricasObrasJavascript = typescript.transpileModule(
  metricasObrasSource
    .replace(
      /import \{[\s\S]*?\} from "\.\/painel-autor-chapter-metrics-utils";/,
      [
        "const calcularComentarios = globalThis.__painelAutorCalcularComentarios;",
        "const calcularCurtidas = globalThis.__painelAutorCalcularCurtidas;",
        "const calcularSalvos = globalThis.__painelAutorCalcularSalvos;",
      ].join("\n"),
    )
    .replace(
      /import \{[\s\S]*?\} from "\.\/painel-autor-reading-progress-utils";/,
      [
        "const calcularProgressoLeitura = globalThis.__painelAutorCalcularProgresso;",
        "const encontrarCapituloParaContinuar = globalThis.__painelAutorEncontrarCapitulo;",
        "const obterCapitulosPublicadosPainel = globalThis.__painelAutorObterCapitulosPublicados;",
      ].join("\n"),
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const { obterObrasComMetricasPainel } = await import(
  `data:text/javascript;base64,${Buffer.from(metricasObrasJavascript).toString("base64")}`,
);

const obra = {
  capitulos: [
    { curtiu: true, salvo: false, comentario: "   " },
    { curtiu: false, salvo: true, comentario: "Comentado" },
    { curtiu: true, salvo: true, comentario: "  Outro comentario  " },
  ],
};

test("metricas preservam as contagens por capitulo", () => {
  assert.equal(calcularCurtidas(obra), 2);
  assert.equal(calcularSalvos(obra), 2);
});

test("comentarios ignora texto vazio ou somente espacos", () => {
  assert.equal(calcularComentarios(obra), 2);
  assert.equal(calcularComentarios({ capitulos: [] }), 0);
});

test("métricas de obras preservam fallbacks, pontuação e ordenação", () => {
  const obrasComMetricas = obterObrasComMetricasPainel([
    {
      id: "fallbacks",
      ultimoCapituloLidoId: "capitulo-1",
      capitulos: [
        {
          id: "capitulo-1",
          publicado: true,
          curtiu: true,
          salvo: false,
          comentario: "Comentado",
          lido: true,
        },
        {
          id: "rascunho",
          publicado: false,
          curtiu: true,
          salvo: true,
          comentario: "",
          lido: false,
        },
      ],
    },
    {
      id: "remotas",
      ultimoCapituloLidoId: "",
      totalCurtidasPainel: 7,
      totalComentariosPainel: 6,
      totalSalvosPainel: 5,
      totalLidosPainel: 4,
      capitulos: [
        {
          id: "capitulo-remoto-1",
          publicado: true,
          curtiu: false,
          salvo: false,
          comentario: "",
          lido: false,
        },
        {
          id: "capitulo-remoto-2",
          publicado: true,
          curtiu: false,
          salvo: false,
          comentario: "",
          lido: false,
        },
      ],
    },
  ]);

  assert.deepEqual(
    obrasComMetricas.map((obraComMetricas) => obraComMetricas.id),
    ["remotas", "fallbacks"],
  );
  assert.deepEqual(obrasComMetricas[0], {
    id: "remotas",
    ultimoCapituloLidoId: "",
    totalCurtidasPainel: 7,
    totalComentariosPainel: 6,
    totalSalvosPainel: 5,
    totalLidosPainel: 4,
    capitulos: [
      {
        id: "capitulo-remoto-1",
        publicado: true,
        curtiu: false,
        salvo: false,
        comentario: "",
        lido: false,
      },
      {
        id: "capitulo-remoto-2",
        publicado: true,
        curtiu: false,
        salvo: false,
        comentario: "",
        lido: false,
      },
    ],
    totalCurtidas: 7,
    totalComentarios: 6,
    totalSalvos: 5,
    totalLidos: 4,
    progressoLeitura: 0,
    ultimoCapituloLido: null,
    pontuacao: 119,
  });
  assert.equal(obrasComMetricas[1].totalCurtidas, 2);
  assert.equal(obrasComMetricas[1].totalComentarios, 1);
  assert.equal(obrasComMetricas[1].totalSalvos, 1);
  assert.equal(obrasComMetricas[1].totalLidos, 0);
  assert.equal(obrasComMetricas[1].progressoLeitura, 100);
  assert.equal(obrasComMetricas[1].ultimoCapituloLido?.id, "capitulo-1");
  assert.equal(obrasComMetricas[1].pontuacao, 24);
});

test("Painel do Autor delega somente o cálculo puro de métricas de obras", () => {
  assert.match(
    metricasObrasSource,
    /import \{[\s\S]*?calcularComentarios,[\s\S]*?calcularCurtidas,[\s\S]*?calcularSalvos,[\s\S]*?\} from "\.\/painel-autor-chapter-metrics-utils";/,
  );
  assert.match(
    metricasObrasSource,
    /import \{[\s\S]*?calcularProgressoLeitura,[\s\S]*?encontrarCapituloParaContinuar,[\s\S]*?obterCapitulosPublicadosPainel,[\s\S]*?\} from "\.\/painel-autor-reading-progress-utils";/,
  );
  assert.match(
    pagina,
    /import \{[\s\S]*?obterObrasComMetricasPainel,[\s\S]*?type ObraComMetricasPainel,[\s\S]*?\} from "\.\/lib\/painel-autor-work-metrics";/,
  );
  assert.doesNotMatch(pagina, /function calcularCurtidas\(/);
  assert.doesNotMatch(pagina, /function calcularComentarios\(/);
  assert.doesNotMatch(pagina, /function calcularSalvos\(/);
  assert.doesNotMatch(pagina, /function obterObrasComMetricasPainel\(/);
  assert.match(
    pagina,
    /const obrasComMetricas = useMemo<ObraComMetricas\[]>\([\s\S]*?\(\) => obterObrasComMetricasPainel\(obras\),[\s\S]*?\[obras\]/,
  );
  assert.match(
    readFileSync(new URL("../../app/painel-autor/hooks/use-painel-autor-auth-session.ts", import.meta.url), "utf8"),
    /supabase\.auth\.getUser\(\)/,
  );
  assert.doesNotMatch(utilsSource, /supabase|useState|useEffect/);
  assert.doesNotMatch(
    metricasObrasSource,
    /localStorage|supabase|useState|useEffect|window|document/,
  );
});
