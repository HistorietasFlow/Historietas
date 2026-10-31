import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/admin/comunidade/loaders/carregar-perfis-contexto-moderacao.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);
const contextoLoader = readFileSync(
  new URL(
    "../../app/admin/comunidade/loaders/carregar-denuncias-contexto-moderacao.ts",
    import.meta.url,
  ),
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

function criarSupabase(respostas) {
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
                    return Promise.resolve(respostas[chamadas.length - 1]);
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

function criarParametros() {
  return {
    denunciasMapeadas: [
      { denuncianteId: " denunciante-1 " },
      { denuncianteId: "" },
    ],
    comentariosCapitulos: [{ user_id: "capitulo-1" }],
    comentariosObras: [{ user_id: "obra-1" }, { user_id: "capitulo-1" }],
    comentariosDiario: [{ user_id: "diario-comentario-1" }],
    diarioAnotacoes: [{ user_id: "diario-1" }],
    capitulos: [{ user_id: "capitulo-autor-1" }],
    obras: [{ user_id: "obra-autor-1" }],
  };
}

test("loader reúne as sete fontes sem mutar arrays e preserva ordem dos IDs", async () => {
  const parametros = criarParametros();
  const originais = structuredClone(parametros);
  const respostaUserId = { data: [{ id: "perfil-user-id" }], error: null };
  const respostaId = { data: [{ id: "perfil-id" }], error: null };
  const { chamadas, supabase } = criarSupabase([respostaUserId, respostaId]);
  const { buscarPerfisContextoModeracao } = await importarLoader(supabase);

  const resultado = await buscarPerfisContextoModeracao(parametros);

  assert.deepEqual(resultado, [{ id: "perfil-user-id" }, { id: "perfil-id" }]);
  assert.deepEqual(
    chamadas,
    [
      {
        tabela: "profiles",
        select: "id, user_id, nome",
        campo: "user_id",
        ids: [
          " denunciante-1 ",
          "capitulo-1",
          "obra-1",
          "diario-comentario-1",
          "diario-1",
          "capitulo-autor-1",
          "obra-autor-1",
        ],
        limite: 1000,
      },
      {
        tabela: "profiles",
        select: "id, user_id, nome",
        campo: "id",
        ids: [
          " denunciante-1 ",
          "capitulo-1",
          "obra-1",
          "diario-comentario-1",
          "diario-1",
          "capitulo-autor-1",
          "obra-autor-1",
        ],
        limite: 1000,
      },
    ],
  );
  assert.deepEqual(parametros, originais);
});

test("loader não consulta Supabase sem IDs e trata dados nulos como lista vazia", async () => {
  const { chamadas, supabase } = criarSupabase([]);
  const { buscarPerfisContextoModeracao } = await importarLoader(supabase);
  const semIds = {
    denunciasMapeadas: [{ denuncianteId: "" }],
    comentariosCapitulos: [{ user_id: "" }],
    comentariosObras: [{ user_id: "" }],
    comentariosDiario: [{ user_id: "" }],
    diarioAnotacoes: [{ user_id: "" }],
    capitulos: [{ user_id: "" }],
    obras: [{ user_id: "" }],
  };

  assert.deepEqual(await buscarPerfisContextoModeracao(semIds), []);
  assert.equal(chamadas.length, 0);

  const comNulos = criarSupabase([
    { data: null, error: null },
    { data: null, error: null },
  ]);
  const { buscarPerfisContextoModeracao: buscarComNulos } =
    await importarLoader(comNulos.supabase);
  assert.deepEqual(await buscarComNulos(criarParametros()), []);
});

test("erro de cada consulta preserva os resultados válidos da outra", async () => {
  const erroUserId = criarSupabase([
    { data: [], error: new Error("falha user_id") },
    { data: [{ id: "por-id" }], error: null },
  ]);
  const { buscarPerfisContextoModeracao: buscarErroUserId } =
    await importarLoader(erroUserId.supabase);
  assert.deepEqual(await buscarErroUserId(criarParametros()), [{ id: "por-id" }]);

  const erroId = criarSupabase([
    { data: [{ id: "por-user-id" }], error: null },
    { data: [], error: new Error("falha id") },
  ]);
  const { buscarPerfisContextoModeracao: buscarErroId } =
    await importarLoader(erroId.supabase);
  assert.deepEqual(await buscarErroId(criarParametros()), [{ id: "por-user-id" }]);
});

test("Admin Comunidade delega apenas o contexto de perfis ao loader", () => {
  assert.doesNotMatch(page, /const perfilIds/);
  assert.doesNotMatch(page, /buscarPerfisContextoModeracao\(/);
  assert.doesNotMatch(page, /criarMapasContextoModeracao\(/);
  assert.doesNotMatch(page, /montarDenunciasComContextoModeracao\(/);
  assert.match(contextoLoader, /buscarPerfisContextoModeracao\(\{/);
  assert.match(contextoLoader, /criarMapasContextoModeracao\(\{/);
  assert.match(contextoLoader, /montarDenunciasComContextoModeracao\(\{/);
  assert.match(page, /setDenuncias\(/);
  assert.doesNotMatch(
    source,
    /useState|useEffect|useMemo|router|localStorage|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
