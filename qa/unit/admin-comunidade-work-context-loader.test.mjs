import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/admin/comunidade/loaders/carregar-obras-contexto-moderacao.ts",
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

test("loader une IDs de obras sem mutar arrays e preserva a primeira ocorrência", async () => {
  const obraIdsDenunciadas = [" obra-1 ", "obra-2", " obra-1 "];
  const capitulos = [{ obra_id: "obra-3" }, { obra_id: "obra-2" }];
  const comentariosObras = [{ obra_id: "obra-4" }, { obra_id: "" }];
  const diarioAnotacoes = [{ obra_id: "obra-5" }, { obra_id: "obra-3" }];
  const entradasOriginais = structuredClone({
    obraIdsDenunciadas,
    capitulos,
    comentariosObras,
    diarioAnotacoes,
  });
  const { chamadas, supabase } = criarSupabase({ data: [{ id: "obra-1" }] });
  const { buscarObrasContextoModeracao } = await importarLoader(supabase);

  const resultado = await buscarObrasContextoModeracao({
    obraIdsDenunciadas,
    capitulos,
    comentariosObras,
    diarioAnotacoes,
  });

  assert.deepEqual(resultado, [{ id: "obra-1" }]);
  assert.deepEqual(chamadas[0], {
    tabela: "obras",
    select: "id, user_id, titulo, autor, slug, link, publicado, criada_em",
    campo: "id",
    ids: [" obra-1 ", "obra-2", "obra-3", "obra-4", "obra-5"],
    limite: 500,
  });
  assert.deepEqual(
    { obraIdsDenunciadas, capitulos, comentariosObras, diarioAnotacoes },
    entradasOriginais,
  );
});

test("loader não consulta Supabase quando não há IDs de contexto", async () => {
  const { chamadas, supabase } = criarSupabase();
  const { buscarObrasContextoModeracao } = await importarLoader(supabase);

  const resultado = await buscarObrasContextoModeracao({
    obraIdsDenunciadas: [],
    capitulos: [{ obra_id: "" }],
    comentariosObras: [{ obra_id: "" }],
    diarioAnotacoes: [{ obra_id: "" }],
  });

  assert.deepEqual(resultado, []);
  assert.equal(chamadas.length, 0);
});

test("loader preserva dados válidos e absorve erro ou resposta nula", async () => {
  const dados = [{ id: "obra-1", titulo: "Contexto" }];
  const comDados = criarSupabase({ data: dados });
  const { buscarObrasContextoModeracao: buscarComDados } =
    await importarLoader(comDados.supabase);
  const parametros = {
    obraIdsDenunciadas: ["obra-1"],
    capitulos: [],
    comentariosObras: [],
    diarioAnotacoes: [],
  };

  assert.equal(await buscarComDados(parametros), dados);

  const comErro = criarSupabase({ error: new Error("falha simulada") });
  const { buscarObrasContextoModeracao: buscarComErro } =
    await importarLoader(comErro.supabase);
  assert.deepEqual(await buscarComErro(parametros), []);

  const comNulo = criarSupabase({ data: null });
  const { buscarObrasContextoModeracao: buscarComNulo } =
    await importarLoader(comNulo.supabase);
  assert.deepEqual(await buscarComNulo(parametros), []);
});

test("Admin Comunidade delega apenas o contexto de obras ao loader", () => {
  assert.doesNotMatch(page, /obraIdsContexto/);
  assert.match(page, /buscarObrasContextoModeracao\(\{/);
  assert.match(page, /const perfilIds = Array\.from/);
  assert.match(page, /\.from\("profiles"\)/);
  assert.match(page, /setDenuncias\(/);
  assert.doesNotMatch(
    source,
    /useState|useEffect|useMemo|router|localStorage|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
