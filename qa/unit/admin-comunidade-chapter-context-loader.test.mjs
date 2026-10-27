import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/admin/comunidade/loaders/carregar-capitulos-contexto-moderacao.ts",
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

test("loader une IDs de capítulos sem mutar arrays e preserva a primeira ocorrência", async () => {
  const capituloIdsDenunciados = [" capitulo-1 ", "capitulo-2", " capitulo-1 "];
  const comentariosCapitulos = [
    { capitulo_id: "capitulo-3" },
    { capitulo_id: "capitulo-2" },
    { capitulo_id: "" },
  ];
  const idsOriginais = [...capituloIdsDenunciados];
  const comentariosOriginais = structuredClone(comentariosCapitulos);
  const { chamadas, supabase } = criarSupabase({ data: [{ id: "capitulo-1" }] });
  const { buscarCapitulosContextoModeracao } = await importarLoader(supabase);

  const resultado = await buscarCapitulosContextoModeracao({
    capituloIdsDenunciados,
    comentariosCapitulos,
  });

  assert.deepEqual(resultado, [{ id: "capitulo-1" }]);
  assert.deepEqual(chamadas[0], {
    tabela: "capitulos",
    select: "id, obra_id, user_id, titulo, texto, ordem, publicado, criado_em",
    campo: "id",
    ids: [" capitulo-1 ", "capitulo-2", "capitulo-3"],
    limite: 500,
  });
  assert.deepEqual(capituloIdsDenunciados, idsOriginais);
  assert.deepEqual(comentariosCapitulos, comentariosOriginais);
});

test("loader não consulta Supabase quando não há IDs de contexto", async () => {
  const { chamadas, supabase } = criarSupabase();
  const { buscarCapitulosContextoModeracao } = await importarLoader(supabase);

  const resultado = await buscarCapitulosContextoModeracao({
    capituloIdsDenunciados: [],
    comentariosCapitulos: [{ capitulo_id: "" }],
  });

  assert.deepEqual(resultado, []);
  assert.equal(chamadas.length, 0);
});

test("loader preserva dados válidos e absorve erro ou resposta nula", async () => {
  const dados = [{ id: "capitulo-1", titulo: "Contexto" }];
  const comDados = criarSupabase({ data: dados });
  const { buscarCapitulosContextoModeracao: buscarComDados } =
    await importarLoader(comDados.supabase);

  assert.equal(
    await buscarComDados({ capituloIdsDenunciados: ["capitulo-1"], comentariosCapitulos: [] }),
    dados,
  );

  const comErro = criarSupabase({ error: new Error("falha simulada") });
  const { buscarCapitulosContextoModeracao: buscarComErro } =
    await importarLoader(comErro.supabase);
  assert.deepEqual(
    await buscarComErro({ capituloIdsDenunciados: ["capitulo-1"], comentariosCapitulos: [] }),
    [],
  );

  const comNulo = criarSupabase({ data: null });
  const { buscarCapitulosContextoModeracao: buscarComNulo } =
    await importarLoader(comNulo.supabase);
  assert.deepEqual(
    await buscarComNulo({ capituloIdsDenunciados: ["capitulo-1"], comentariosCapitulos: [] }),
    [],
  );
});

test("Admin Comunidade delega apenas o contexto de capítulos ao loader", () => {
  assert.doesNotMatch(page, /capituloIdsContexto/);
  assert.match(page, /buscarCapitulosContextoModeracao\(\{/);
  assert.match(page, /obraIdsContexto/);
  assert.match(page, /\.from\("obras"\)/);
  assert.match(page, /setDenuncias\(/);
  assert.doesNotMatch(
    source,
    /useState|useEffect|useMemo|router|localStorage|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
