import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/admin/comunidade/loaders/carregar-anotacoes-diario-contexto-moderacao.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);

async function importarLoader(supabase) {
  const javascript = typescript.transpileModule(
    source.replace(
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
    `data:text/javascript;base64,${Buffer.from(
      `${javascript}\n// ${Math.random()}`,
    ).toString("base64")}`
  );
}

function criarSupabase({ data = [], error = null } = {}) {
  const chamadas = [];

  return {
    chamadas,
    supabase: {
      from(tabela) {
        const chamada = { tabela };
        chamadas.push(chamada);

        return {
          select(select) {
            chamada.select = select;

            return {
              in(campo, ids) {
                chamada.campo = campo;
                chamada.ids = ids;

                return {
                  limit(limite) {
                    chamada.limite = limite;
                    return Promise.resolve({ data, error });
                  },
                };
              },
            };
          },
        };
      },
    },
  };
}

test("loader une IDs do Diário sem mutar arrays e preserva a primeira ocorrência", async () => {
  const diarioAnotacaoIds = [" anotacao-1 ", "anotacao-2", " anotacao-1 "];
  const comentariosDiario = [
    { anotacao_id: "anotacao-3" },
    { anotacao_id: "anotacao-2" },
    { anotacao_id: "" },
  ];
  const idsOriginais = [...diarioAnotacaoIds];
  const comentariosOriginais = structuredClone(comentariosDiario);
  const { chamadas, supabase } = criarSupabase({ data: [{ id: "anotacao-1" }] });
  const { buscarAnotacoesDiarioContextoModeracao } = await importarLoader(supabase);

  const resultado = await buscarAnotacoesDiarioContextoModeracao({
    diarioAnotacaoIds,
    comentariosDiario,
  });

  assert.deepEqual(resultado, [{ id: "anotacao-1" }]);
  assert.deepEqual(chamadas[0], {
    tabela: "diario_anotacoes",
    select:
      "id, obra_id, user_id, tipo, texto, visibilidade, contem_spoiler, criado_em, atualizado_em",
    campo: "id",
    ids: [" anotacao-1 ", "anotacao-2", "anotacao-3"],
    limite: 500,
  });
  assert.deepEqual(diarioAnotacaoIds, idsOriginais);
  assert.deepEqual(comentariosDiario, comentariosOriginais);
});

test("loader não consulta Supabase quando não há IDs de contexto", async () => {
  const { chamadas, supabase } = criarSupabase();
  const { buscarAnotacoesDiarioContextoModeracao } = await importarLoader(supabase);

  const resultado = await buscarAnotacoesDiarioContextoModeracao({
    diarioAnotacaoIds: [],
    comentariosDiario: [{ anotacao_id: "" }],
  });

  assert.deepEqual(resultado, []);
  assert.equal(chamadas.length, 0);
});

test("loader preserva dados válidos e absorve erro ou resposta nula", async () => {
  const dados = [{ id: "anotacao-1", texto: "Contexto" }];
  const comDados = criarSupabase({ data: dados });
  const { buscarAnotacoesDiarioContextoModeracao: buscarComDados } =
    await importarLoader(comDados.supabase);

  assert.equal(
    await buscarComDados({ diarioAnotacaoIds: ["anotacao-1"], comentariosDiario: [] }),
    dados,
  );

  const comErro = criarSupabase({ error: new Error("falha simulada") });
  const { buscarAnotacoesDiarioContextoModeracao: buscarComErro } =
    await importarLoader(comErro.supabase);
  assert.deepEqual(
    await buscarComErro({ diarioAnotacaoIds: ["anotacao-1"], comentariosDiario: [] }),
    [],
  );

  const comNulo = criarSupabase({ data: null });
  const { buscarAnotacoesDiarioContextoModeracao: buscarComNulo } =
    await importarLoader(comNulo.supabase);
  assert.deepEqual(
    await buscarComNulo({ diarioAnotacaoIds: ["anotacao-1"], comentariosDiario: [] }),
    [],
  );
});

test("Admin Comunidade delega apenas o contexto do Diário ao loader", () => {
  assert.doesNotMatch(page, /diarioAnotacaoIdsContexto/);
  assert.match(page, /buscarAnotacoesDiarioContextoModeracao\(\{/);
  assert.match(page, /capituloIdsContexto/);
  assert.match(page, /\.from\("capitulos"\)/);
  assert.match(page, /setDenuncias\(/);
  assert.doesNotMatch(
    source,
    /useState|useEffect|useMemo|router|localStorage|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
