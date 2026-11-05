import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const fonte = readFileSync(
  new URL(
    "../../app/obra/[slug]/lib/obra-work-metrics-request-coordinator.ts",
    import.meta.url,
  ),
  "utf8",
).replace(
  /import \{[\s\S]*?\} from "\.\.\/\.\.\/\.\.\/\.\.\/lib\/metricas";/,
  "const carregarMetricasConteudos = (...args) => globalThis.__metricasObraPadrao(...args);",
);
const javascript = typescript.transpileModule(fonte, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { criarCoordenadorMetricasObraEmVoo } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

function criarDeferred() {
  let resolver;
  let rejeitar;
  const promise = new Promise((resolve, reject) => {
    resolver = resolve;
    rejeitar = reject;
  });
  return { promise, resolver, rejeitar };
}

function criarExecutorControlado() {
  const chamadas = [];
  const pendentes = [];
  const executar = (parametros) => {
    chamadas.push(parametros);
    const deferred = criarDeferred();
    pendentes.push(deferred);
    return deferred.promise;
  };

  return { executar, chamadas, pendentes };
}

test("duas solicitacoes equivalentes compartilham uma unica RPC mesmo apos resolucao rapida", async () => {
  const controle = criarExecutorControlado();
  const carregar = criarCoordenadorMetricasObraEmVoo(controle.executar);
  const primeira = carregar({ obraId: "obra-a", usuarioId: "usuario-a" });
  const resultado = { carregado: true, obras: new Map() };

  controle.pendentes[0].resolver(resultado);
  assert.strictEqual(await primeira, resultado);

  const segunda = carregar({ obraId: "obra-a", usuarioId: "usuario-a" });

  assert.strictEqual(await segunda, resultado);
  assert.deepEqual(controle.chamadas, [{ obraIds: ["obra-a"] }]);
});

test("obra ou identidade diferente mantem consultas independentes", async () => {
  const controle = criarExecutorControlado();
  const carregar = criarCoordenadorMetricasObraEmVoo(controle.executar);
  const requisicoes = [
    carregar({ obraId: "obra-a", usuarioId: "usuario-a" }),
    carregar({ obraId: "obra-b", usuarioId: "usuario-a" }),
    carregar({ obraId: "obra-a", usuarioId: "usuario-b" }),
    carregar({ obraId: "obra-a", usuarioId: "" }),
  ];

  controle.pendentes.forEach((deferred, indice) =>
    deferred.resolver({ carregado: true, indice }),
  );
  const resultados = await Promise.all(requisicoes);

  assert.equal(controle.chamadas.length, 4);
  assert.deepEqual(
    resultados.map(({ indice }) => indice),
    [0, 1, 2, 3],
  );
});

test("falha compartilhada chega aos dois consumidores e retry posterior cria nova RPC", async () => {
  const controle = criarExecutorControlado();
  const carregar = criarCoordenadorMetricasObraEmVoo(controle.executar);
  const primeira = carregar({ obraId: "obra-a", usuarioId: "usuario-a" });
  const segunda = carregar({ obraId: "obra-a", usuarioId: "usuario-a" });
  const erro = new Error("metricas indisponiveis");
  const rejeicoes = [
    assert.rejects(primeira, (recebido) => recebido === erro),
    assert.rejects(segunda, (recebido) => recebido === erro),
  ];

  controle.pendentes[0].rejeitar(erro);
  await Promise.all(rejeicoes);

  const retry = carregar({ obraId: "obra-a", usuarioId: "usuario-a" });
  controle.pendentes[1].resolver({ carregado: true, tentativa: 2 });

  assert.deepEqual(await retry, { carregado: true, tentativa: 2 });
  assert.equal(controle.chamadas.length, 2);
});

test("trocas A para logout para B e navegacao entre obras nao reutilizam metricas antigas", async () => {
  const controle = criarExecutorControlado();
  const carregar = criarCoordenadorMetricasObraEmVoo(controle.executar);
  const requisicoes = [
    carregar({ obraId: "obra-a", usuarioId: "usuario-a" }),
    carregar({ obraId: "obra-a", usuarioId: "" }),
    carregar({ obraId: "obra-a", usuarioId: "usuario-b" }),
    carregar({ obraId: "obra-b", usuarioId: "usuario-b" }),
  ];

  controle.pendentes.forEach((deferred, indice) =>
    deferred.resolver({ carregado: true, origem: indice }),
  );
  const resultados = await Promise.all(requisicoes);

  assert.deepEqual(
    resultados.map(({ origem }) => origem),
    [0, 1, 2, 3],
  );
  assert.equal(controle.chamadas.length, 4);
});

test("depois dos dois consumidores uma atualizacao legitima busca dados novos", async () => {
  const controle = criarExecutorControlado();
  const carregar = criarCoordenadorMetricasObraEmVoo(controle.executar);
  const primeira = carregar({ obraId: "obra-a", usuarioId: "usuario-a" });
  const segunda = carregar({ obraId: "obra-a", usuarioId: "usuario-a" });

  controle.pendentes[0].resolver({ carregado: true, versao: 1 });
  await Promise.all([primeira, segunda]);

  const atualizacao = carregar({ obraId: "obra-a", usuarioId: "usuario-a" });
  controle.pendentes[1].resolver({ carregado: true, versao: 2 });

  assert.deepEqual(await atualizacao, { carregado: true, versao: 2 });
  assert.equal(controle.chamadas.length, 2);
});
