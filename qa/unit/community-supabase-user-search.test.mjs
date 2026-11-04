import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/comunidade/components/community-supabase-user-search.ts",
    import.meta.url
  ),
  "utf8"
);

const criarModuloData = (codigo) =>
  `data:text/javascript;base64,${Buffer.from(codigo).toString("base64")}`;

const supabaseMockUrl = criarModuloData(`
  export const supabase = {
    from(tabela) {
      globalThis.__communityUserSearchTabelas.push(tabela);
      return {
        select(campos) {
          return {
            ilike(coluna, padrao) {
              globalThis.__communityUserSearchConsultas.push({ campos, coluna, padrao });
              return {
                limit(limite) {
                  globalThis.__communityUserSearchLimites.push(limite);
                  return Promise.resolve({
                    data: globalThis.__communityUserSearchDados,
                    error: null,
                  });
                },
              };
            },
          };
        },
      };
    },
  };
`);

const utilsMockUrl = criarModuloData(`
  export function normalizarTexto(valor) {
    return String(valor ?? "")
      .normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  }
`);

const normalizerMockUrl = criarModuloData(`
  export function normalizarUsuarioBuscaComunidade(profile) {
    if (!profile?.id || !profile?.nome) return null;
    return {
      id: profile.id,
      nome: profile.nome,
      username: profile.username ?? "",
      avatar: profile.avatar_url ?? "",
    };
  }
`);

const javascript = typescript.transpileModule(
  source
    .replace('"../../../lib/supabase/client"', JSON.stringify(supabaseMockUrl))
    .replace('"../../../lib/utils"', JSON.stringify(utilsMockUrl))
    .replace(
      '"./community-search-user-normalizer"',
      JSON.stringify(normalizerMockUrl)
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }
).outputText;

const {
  buscarUsuariosComunidadeSupabase,
  escaparTermoBuscaLiteralIlike,
} = await import(criarModuloData(javascript));

function prepararSupabaseMock(dados = []) {
  globalThis.__communityUserSearchTabelas = [];
  globalThis.__communityUserSearchConsultas = [];
  globalThis.__communityUserSearchLimites = [];
  globalThis.__communityUserSearchDados = dados;
}

test("escapa os caracteres especiais de ILIKE e preserva pontuacao literal", () => {
  assert.equal(escaparTermoBuscaLiteralIlike("100%"), "100\\%");
  assert.equal(escaparTermoBuscaLiteralIlike("nome_usuario"), "nome\\_usuario");
  assert.equal(escaparTermoBuscaLiteralIlike("barra\\final"), "barra\\\\final");
  assert.equal(
    escaparTermoBuscaLiteralIlike("ana%_\\,.(teste)"),
    "ana\\%\\_\\\\,.(teste)"
  );
});

test("envia somente um padrao ILIKE literal com curingas externos", async () => {
  prepararSupabaseMock([
    {
      id: "usuario-literal",
      nome: "Ana%_\\,.(teste)",
      username: "ana.literal",
      avatar_url: "",
    },
    {
      id: "usuario-diferente",
      nome: "Ana comum",
      username: "ana",
      avatar_url: "",
    },
  ]);

  const resultado = await buscarUsuariosComunidadeSupabase(
    "  @Ana%_\\,.(teste)  "
  );

  assert.deepEqual(
    globalThis.__communityUserSearchConsultas.map(({ coluna, padrao }) => ({
      coluna,
      padrao,
    })),
    [
      { coluna: "nome", padrao: "%Ana\\%\\_\\\\,.(teste)%" },
      { coluna: "username", padrao: "%Ana\\%\\_\\\\,.(teste)%" },
    ]
  );
  assert.deepEqual(globalThis.__communityUserSearchLimites, [20, 20]);
  assert.deepEqual(
    resultado.map(({ id }) => id),
    ["usuario-literal"]
  );
});

test("mantem a busca parcial e o limite final de resultados", async () => {
  prepararSupabaseMock(
    Array.from({ length: 15 }, (_, indice) => ({
      id: `usuario-${indice}`,
      nome: `Ana ${String(indice).padStart(2, "0")}`,
      username: `ana${indice}`,
      avatar_url: "",
    }))
  );

  const resultado = await buscarUsuariosComunidadeSupabase("Ana");

  assert.equal(resultado.length, 12);
  assert.equal(globalThis.__communityUserSearchConsultas[0].padrao, "%Ana%");
});
