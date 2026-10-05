import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

function criarUrlModulo(codigo) {
  return `data:text/javascript;base64,${Buffer.from(codigo).toString("base64")}`;
}

const supabaseUrl = criarUrlModulo([
  "export const supabase = {",
  "  from(tabela) {",
  "    globalThis.chamadasPerfis.push({ tabela });",
  "    return {",
  "      select(campos) {",
  "        const chamada = globalThis.chamadasPerfis.at(-1);",
  "        chamada.campos = campos;",
  "        return {",
  "          in(campo, ids) {",
  "            chamada.campo = campo;",
  "            chamada.ids = ids;",
  "            return {",
  "              limit(limite) {",
  "                chamada.limite = limite;",
  "                const resposta = globalThis.respostasPerfis.shift();",
  "                if (resposta instanceof Error) throw resposta;",
  "                return Promise.resolve(resposta);",
  "              },",
  "            };",
  "          },",
  "        };",
  "      },",
  "    };",
  "  },",
  "};",
].join("\n"));

const moduloTypescript = readFileSync(
  new URL(
    "../../app/obra/[slug]/lib/obra-public-profile-query.ts",
    import.meta.url,
  ),
  "utf8",
);
const moduloJavascript = typescript
  .transpileModule(moduloTypescript, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  })
  .outputText.replace(
    'from "../../../../lib/supabase/client";',
    `from "${supabaseUrl}";`,
  );
const { consultarPerfisPublicosObraPorCampo } = await import(
  criarUrlModulo(moduloJavascript),
);

function prepararRespostas(...respostas) {
  globalThis.chamadasPerfis = [];
  globalThis.respostasPerfis = respostas;
}

const SELECOES_ESPERADAS = [
  "id,user_id,nome,avatar_url,bio",
  "id,user_id,nome,avatar_url",
  "id,user_id,nome",
];

test("consulta perfis pela selecao progressiva, campo recebido e limite atual", async () => {
  const registros = [{ id: "perfil-a", user_id: "usuario-a", nome: "A" }];
  prepararRespostas(
    { data: null, error: { message: "bio indisponivel" } },
    { data: { invalido: true }, error: null },
    { data: registros, error: null },
  );

  const resultado = await consultarPerfisPublicosObraPorCampo(
    ["usuario-a", "usuario-b"],
    "user_id",
  );

  assert.equal(resultado, registros);
  assert.deepEqual(
    globalThis.chamadasPerfis.map((chamada) => chamada.tabela),
    ["profiles_publicos", "profiles_publicos", "profiles_publicos"],
  );
  assert.deepEqual(
    globalThis.chamadasPerfis.map((chamada) => chamada.campos),
    SELECOES_ESPERADAS,
  );
  assert.deepEqual(
    globalThis.chamadasPerfis.map((chamada) => chamada.campo),
    ["user_id", "user_id", "user_id"],
  );
  assert.deepEqual(
    globalThis.chamadasPerfis.map((chamada) => chamada.ids),
    [["usuario-a", "usuario-b"], ["usuario-a", "usuario-b"], ["usuario-a", "usuario-b"]],
  );
  assert.deepEqual(
    globalThis.chamadasPerfis.map((chamada) => chamada.limite),
    [1000, 1000, 1000],
  );
});

test("continua para a selecao menor quando a consulta lança", async () => {
  const registros = [{ id: "perfil-b", nome: "B" }];
  prepararRespostas(new Error("coluna indisponivel"), { data: registros, error: null });

  const resultado = await consultarPerfisPublicosObraPorCampo(
    ["perfil-b"],
    "id",
  );

  assert.equal(resultado, registros);
  assert.deepEqual(
    globalThis.chamadasPerfis.map((chamada) => chamada.campos),
    SELECOES_ESPERADAS.slice(0, 2),
  );
  assert.deepEqual(
    globalThis.chamadasPerfis.map((chamada) => chamada.campo),
    ["id", "id"],
  );
});

test("retorna lista vazia quando todas as selecoes falham", async () => {
  prepararRespostas(
    { data: null, error: { message: "primeira falhou" } },
    { data: null, error: { message: "segunda falhou" } },
    new Error("terceira falhou"),
  );

  const resultado = await consultarPerfisPublicosObraPorCampo(
    ["usuario-a"],
    "user_id",
  );

  assert.deepEqual(resultado, []);
  assert.deepEqual(
    globalThis.chamadasPerfis.map((chamada) => chamada.campos),
    SELECOES_ESPERADAS,
  );
});
