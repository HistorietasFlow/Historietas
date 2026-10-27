import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const loaderSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/loaders/carregar-reincidencias-moderacao.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);

async function importarLoader(supabase) {
  const javascript = typescript.transpileModule(
    loaderSource.replace(
      'import { supabase } from "../../../../lib/supabase/client";',
      "const supabase = globalThis.__supabaseTeste;",
    ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  globalThis.__supabaseTeste = supabase;
  return import(
    `data:text/javascript;base64,${Buffer.from(`${javascript}\n// ${Math.random()}`).toString("base64")}`,
  );
}

test("loader de reincidências preserva RPC, transformação e últimos IDs", async () => {
  const chamadas = [];
  const loader = await importarLoader({
    rpc(nome) {
      chamadas.push(nome);
      return Promise.resolve({
        data: [
          { user_id: " usuario-1 ", total_denuncias: "2" },
          { user_id: "usuario-2", total_denuncias: 3 },
          { user_id: "usuario-1", total_denuncias: 4 },
          { user_id: " ", total_denuncias: 9 },
          { user_id: 10, total_denuncias: 9 },
          { user_id: "zero", total_denuncias: 0 },
          { user_id: "negativo", total_denuncias: -1 },
          { user_id: "nan", total_denuncias: "invalido" },
        ],
        error: null,
      });
    },
  });

  assert.deepEqual(await loader.buscarReincidenciasModeracao(), {
    "usuario-1": 4,
    "usuario-2": 3,
  });
  assert.deepEqual(chamadas, ["listar_reincidencias_moderacao"]);
});

test("loader preserva vazio e propaga erro da RPC", async () => {
  const vazio = await importarLoader({
    rpc() {
      return Promise.resolve({ data: null, error: null });
    },
  });
  assert.deepEqual(await vazio.buscarReincidenciasModeracao(), {});

  const erro = new Error("falha simulada");
  const comErro = await importarLoader({
    rpc() {
      return Promise.resolve({ data: [], error: erro });
    },
  });
  await assert.rejects(() => comErro.buscarReincidenciasModeracao(), erro);
});

test("Admin Comunidade mantém a orquestração de reincidências na página", () => {
  assert.match(
    pageSource,
    /import \{ buscarReincidenciasModeracao \} from ".\/loaders\/carregar-reincidencias-moderacao";/,
  );
  assert.doesNotMatch(pageSource, /type ReincidenciaModeracaoRow =/);
  assert.doesNotMatch(pageSource, /supabase\.rpc\(\s*"listar_reincidencias_moderacao"/);
  assert.match(
    pageSource,
    /async function carregarReincidenciasModeracao\(\) \{\s*const proximoMapa = await buscarReincidenciasModeracao\(\);\s*setReincidenciasPorUsuario\(proximoMapa\);\s*\}/,
  );
  assert.match(pageSource, /Promise\.all\([\s\S]*?carregarReincidenciasModeracao\(\)/);
  assert.doesNotMatch(
    loaderSource,
    /useState|useEffect|useMemo|router|localStorage|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
