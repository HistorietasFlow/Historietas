import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(
  new URL("../../lib/aceiteTermos.ts", import.meta.url),
  "utf8",
);

const supabaseMockUrl = `data:text/javascript;base64,${Buffer.from(`
  export const supabase = {
    rpc: (...args) => globalThis.__aceiteTermosTeste.rpc(...args),
  };
`).toString("base64")}`;

const javascript = ts.transpileModule(
  source.replace('"./supabase/client"', JSON.stringify(supabaseMockUrl)),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;

const moduloUrl = `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`;
const { verificarAceiteTermosPublicacao } = await import(moduloUrl);

function configurarRespostas(respostas) {
  const chamadas = [];

  globalThis.__aceiteTermosTeste = {
    async rpc(nome) {
      chamadas.push(nome);
      const resposta = respostas.shift();

      if (resposta instanceof Error) {
        throw resposta;
      }

      return resposta;
    },
  };

  return chamadas;
}

test("status dos termos retorna imediatamente quando a primeira consulta confirma o aceite", async () => {
  const chamadas = configurarRespostas([{ data: true, error: null }]);

  assert.deepEqual(await verificarAceiteTermosPublicacao(), {
    aceito: true,
    erro: "",
  });
  assert.deepEqual(chamadas, ["status_aceite_termos_publicacao"]);
});

test("status dos termos não repete uma resposta negativa válida", async () => {
  const chamadas = configurarRespostas([{ data: false, error: null }]);

  assert.deepEqual(await verificarAceiteTermosPublicacao(), {
    aceito: false,
    erro: "",
  });
  assert.equal(chamadas.length, 1);
});

test("status dos termos recupera uma falha transitória com uma única nova leitura", async () => {
  const chamadas = configurarRespostas([
    { data: null, error: { message: "indisponível" } },
    { data: true, error: null },
  ]);

  assert.deepEqual(await verificarAceiteTermosPublicacao(), {
    aceito: true,
    erro: "",
  });
  assert.equal(chamadas.length, 2);
});

test("status dos termos preserva o erro final e limita o retry", async () => {
  const chamadas = configurarRespostas([
    new Error("rede indisponível"),
    { data: null, error: { message: "serviço indisponível" } },
  ]);

  assert.deepEqual(await verificarAceiteTermosPublicacao(), {
    aceito: false,
    erro: "serviço indisponível",
  });
  assert.equal(chamadas.length, 2);
});

test.after(() => {
  delete globalThis.__aceiteTermosTeste;
});
