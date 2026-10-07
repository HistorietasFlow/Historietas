import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

function criarUrlModulo(codigo) {
  return `data:text/javascript;base64,${Buffer.from(codigo).toString("base64")}`;
}

const supabaseUrl = criarUrlModulo([
  "export const supabase = {",
  "  auth: {",
  "    async getUser() {",
  "      globalThis.chamadasLoaderAvaliacao.push('getUser');",
  "      const resposta = globalThis.respostasGetUser.shift();",
  "      if (resposta instanceof Error) throw resposta;",
  "      return { data: { user: resposta || null } };",
  "    },",
  "  },",
  "};",
].join("\n"));

const metricasUrl = criarUrlModulo([
  "export async function carregarMetricasConteudos(parametros) {",
  "  globalThis.chamadasLoaderAvaliacao.push(['metricas', parametros]);",
  "  const resposta = globalThis.respostasMetricas.shift();",
  "  if (resposta instanceof Error) throw resposta;",
  "  return resposta;",
  "}",
].join("\n"));

const moduloTypescript = readFileSync(
  new URL(
    "../../app/obra/[slug]/lib/obra-supabase-rating-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
test("loader nao conhece cache, guards de versao, cancelamento ou estado React", () => {
  assert.doesNotMatch(moduloTypescript, /salvarAvaliacaoLocal/);
  assert.doesNotMatch(moduloTypescript, /avaliacaoVersaoRef/);
  assert.doesNotMatch(moduloTypescript, /cancelado/);
  assert.doesNotMatch(moduloTypescript, /setAvaliacaoObra/);
});

const moduloJavascript = typescript
  .transpileModule(moduloTypescript, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  })
  .outputText.replace(
    'from "../../../../lib/metricas";',
    `from "${metricasUrl}";`,
  )
  .replace(
    'from "../../../../lib/supabase/client";',
    `from "${supabaseUrl}";`,
  );
const { carregarSnapshotRemotoAvaliacaoObra } = await import(
  criarUrlModulo(moduloJavascript),
);

function prepararRespostas({ usuarios = [], metricas = [] } = {}) {
  globalThis.chamadasLoaderAvaliacao = [];
  globalThis.respostasGetUser = usuarios;
  globalThis.respostasMetricas = metricas;
}

function criarContrato({ carregado = true, metrica } = {}) {
  return {
    carregado,
    obras: new Map(metrica ? [["obra-a", metrica]] : []),
  };
}

test("consulta sessao antes das metricas e preserva o fallback de usuario logado", async () => {
  prepararRespostas({
    usuarios: [null],
    metricas: [
      criarContrato({
        metrica: { avaliacao: { minhaNota: 4.5, media: 4.2, total: 8 } },
      }),
    ],
  });

  const snapshot = await carregarSnapshotRemotoAvaliacaoObra({
    obra: { id: "obra-a", autorId: "autor-a" },
    usuarioIdLogado: "usuario-fallback",
  });

  assert.deepEqual(globalThis.chamadasLoaderAvaliacao, [
    "getUser",
    ["metricas", { obraIds: ["obra-a"] }],
  ]);
  assert.deepEqual(snapshot, {
    userId: "usuario-fallback",
    usuarioEhAutorDaObraAtual: false,
    minhaNotaRemota: 4.5,
    minhaNota: 4.5,
    media: 4.2,
    total: 8,
  });
});

test("autor recebe nota zero e o identificador do autor continua usando trim", async () => {
  prepararRespostas({
    usuarios: [{ id: "autor-a" }],
    metricas: [
      criarContrato({
        metrica: { avaliacao: { minhaNota: 5, media: 4.6, total: 12 } },
      }),
    ],
  });

  const snapshot = await carregarSnapshotRemotoAvaliacaoObra({
    obra: { id: "obra-a", autorId: " autor-a " },
    usuarioIdLogado: "usuario-fallback",
  });

  assert.equal(snapshot.usuarioEhAutorDaObraAtual, true);
  assert.equal(snapshot.minhaNotaRemota, 0);
  assert.equal(snapshot.minhaNota, 0);
  assert.equal(snapshot.media, 4.6);
  assert.equal(snapshot.total, 12);
});

test("contrato nao carregado ou sem metrica devolve ausencia de snapshot", async () => {
  prepararRespostas({
    usuarios: [{ id: "usuario-a" }, { id: "usuario-a" }],
    metricas: [criarContrato({ carregado: false }), criarContrato()],
  });

  assert.equal(
    await carregarSnapshotRemotoAvaliacaoObra({
      obra: { id: "obra-a", autorId: "autor-a" },
      usuarioIdLogado: "",
    }),
    null,
  );
  assert.equal(
    await carregarSnapshotRemotoAvaliacaoObra({
      obra: { id: "obra-a", autorId: "autor-a" },
      usuarioIdLogado: "",
    }),
    null,
  );
});

test("excecoes de sessao e metricas continuam sendo propagadas", async () => {
  const erroSessao = new Error("sessao falhou");
  prepararRespostas({ usuarios: [erroSessao] });

  await assert.rejects(
    carregarSnapshotRemotoAvaliacaoObra({
      obra: { id: "obra-a", autorId: "autor-a" },
      usuarioIdLogado: "",
    }),
    (erro) => erro === erroSessao,
  );

  const erroMetricas = new Error("metricas falharam");
  prepararRespostas({
    usuarios: [{ id: "usuario-a" }],
    metricas: [erroMetricas],
  });

  await assert.rejects(
    carregarSnapshotRemotoAvaliacaoObra({
      obra: { id: "obra-a", autorId: "autor-a" },
      usuarioIdLogado: "",
    }),
    (erro) => erro === erroMetricas,
  );
});
