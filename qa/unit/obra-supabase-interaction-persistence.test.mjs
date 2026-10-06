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
  "    return {",
  "      delete() {",
  "        const resposta = globalThis.respostasDelete.shift() || { error: null };",
  "        const chamada = { tipo: 'delete', tabela, filtros: [], error: resposta.error };",
  "        globalThis.chamadasPersistencia.push(chamada);",
  "        const query = {",
  "          data: resposta.data,",
  "          error: chamada.error,",
  "          eq(campo, valor) {",
  "            chamada.filtros.push([campo, valor]);",
  "            return query;",
  "          },",
  "        };",
  "        return query;",
  "      },",
  "      upsert(payload, opcoes) {",
  "        const resposta = globalThis.respostasUpsert.shift() || { error: null };",
  "        globalThis.chamadasPersistencia.push({ tipo: 'upsert', tabela, payload, opcoes });",
  "        if (resposta.cancelar) globalThis.execucaoPermitida = false;",
  "        if (resposta.excecao) throw resposta.excecao;",
  "        return Promise.resolve({ data: resposta.data, error: resposta.error });",
  "      },",
  "    };",
  "  },",
  "};",
].join("\n"));

const utilsUrl = criarUrlModulo(
  "export function idObraSupabaseValido(id) { return id === 'obra-valida'; }",
);

const moduloTypescript = readFileSync(
  new URL(
    "../../app/obra/[slug]/lib/obra-supabase-interaction-persistence.ts",
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
  )
  .replace(
    'from "../../../../lib/utils";',
    `from "${utilsUrl}";`,
  );
const {
  inserirSeguimentoObraPublicaSupabase,
  removerSeguimentoObraPublicaSupabase,
  salvarCurtidaObraPublicaSupabase,
  salvarRegistroObraPublicaSupabase,
} = await import(criarUrlModulo(moduloJavascript));

function prepararRespostas({ deletes = [], upserts = [] } = {}) {
  globalThis.chamadasPersistencia = [];
  globalThis.respostasDelete = deletes;
  globalThis.respostasUpsert = upserts;
  globalThis.execucaoPermitida = true;
}

test("guards impedem qualquer persistencia remota invalida ou cancelada", async () => {
  prepararRespostas();

  await salvarRegistroObraPublicaSupabase("favoritos", "", "obra-valida", true);
  await salvarRegistroObraPublicaSupabase(
    "favoritos",
    "usuario-a",
    "obra-invalida",
    true,
  );
  await salvarCurtidaObraPublicaSupabase(
    "usuario-a",
    "obra-valida",
    true,
    () => false,
  );

  assert.deepEqual(globalThis.chamadasPersistencia, []);
});

test("registro preserva delete, upsert e propagacao de erro", async () => {
  prepararRespostas();

  await salvarRegistroObraPublicaSupabase(
    "favoritos",
    "usuario-a",
    "obra-valida",
    false,
  );
  await salvarRegistroObraPublicaSupabase(
    "concluidas",
    "usuario-a",
    "obra-valida",
    true,
  );

  assert.deepEqual(globalThis.chamadasPersistencia, [
    {
      tipo: "delete",
      tabela: "favoritos",
      filtros: [
        ["user_id", "usuario-a"],
        ["obra_id", "obra-valida"],
      ],
      error: null,
    },
    {
      tipo: "upsert",
      tabela: "concluidas",
      payload: {
        user_id: "usuario-a",
        obra_id: "obra-valida",
        visibilidade: "publico",
      },
      opcoes: {
        onConflict: "user_id,obra_id",
        ignoreDuplicates: true,
      },
    },
  ]);

  const erroRegistro = new Error("registro falhou");
  prepararRespostas({ upserts: [{ error: erroRegistro }] });

  await assert.rejects(
    salvarRegistroObraPublicaSupabase(
      "favoritos",
      "usuario-a",
      "obra-valida",
      true,
    ),
    (erro) => erro === erroRegistro,
  );

  const erroDelete = new Error("delete falhou");
  prepararRespostas({ deletes: [{ error: erroDelete }] });

  await assert.rejects(
    salvarCurtidaObraPublicaSupabase(
      "usuario-a",
      "obra-valida",
      false,
    ),
    (erro) => erro === erroDelete,
  );
});

test("seguimento preserva queries e retorna respostas brutas", async () => {
  const dadosInsercao = { id: "seguimento-1" };
  const erroRemocao = new Error("remocao falhou");
  prepararRespostas({
    deletes: [{ data: null, error: erroRemocao }],
    upserts: [{ data: dadosInsercao, error: null }],
  });

  const respostaInsercao = await inserirSeguimentoObraPublicaSupabase(
    "obra-valida",
    "usuario-a",
  );
  const respostaRemocao = await removerSeguimentoObraPublicaSupabase(
    "obra-valida",
    "usuario-a",
  );

  assert.deepEqual(respostaInsercao, { data: dadosInsercao, error: null });
  assert.equal(respostaRemocao.data, null);
  assert.equal(respostaRemocao.error, erroRemocao);
  assert.deepEqual(globalThis.chamadasPersistencia, [
    {
      tipo: "upsert",
      tabela: "seguindo_obras",
      payload: {
        obra_id: "obra-valida",
        user_id: "usuario-a",
        visibilidade: "publico",
      },
      opcoes: {
        onConflict: "user_id,obra_id",
        ignoreDuplicates: true,
      },
    },
    {
      tipo: "delete",
      tabela: "seguindo_obras",
      filtros: [
        ["obra_id", "obra-valida"],
        ["user_id", "usuario-a"],
      ],
      error: erroRemocao,
    },
  ]);
});

test("curtida preserva delete e fallback de payload", async () => {
  prepararRespostas({
    upserts: [
      { error: new Error("visibilidade indisponivel") },
      { error: null },
    ],
  });

  await salvarCurtidaObraPublicaSupabase(
    "usuario-a",
    "obra-valida",
    false,
  );
  await salvarCurtidaObraPublicaSupabase(
    "usuario-a",
    "obra-valida",
    true,
  );

  assert.deepEqual(globalThis.chamadasPersistencia, [
    {
      tipo: "delete",
      tabela: "obra_curtidas",
      filtros: [
        ["obra_id", "obra-valida"],
        ["user_id", "usuario-a"],
      ],
      error: null,
    },
    {
      tipo: "upsert",
      tabela: "obra_curtidas",
      payload: {
        obra_id: "obra-valida",
        user_id: "usuario-a",
        visibilidade: "publico",
      },
      opcoes: {
        onConflict: "user_id,obra_id",
        ignoreDuplicates: true,
      },
    },
    {
      tipo: "upsert",
      tabela: "obra_curtidas",
      payload: {
        obra_id: "obra-valida",
        user_id: "usuario-a",
      },
      opcoes: {
        onConflict: "user_id,obra_id",
        ignoreDuplicates: true,
      },
    },
  ]);
});

test("curtida interrompe o fallback ao cancelar e propaga o ultimo erro", async () => {
  prepararRespostas({
    upserts: [{ error: new Error("primeira falhou"), cancelar: true }],
  });

  await salvarCurtidaObraPublicaSupabase(
    "usuario-a",
    "obra-valida",
    true,
    () => globalThis.execucaoPermitida,
  );

  assert.equal(globalThis.chamadasPersistencia.length, 1);

  const primeiroErro = new Error("primeiro erro");
  const ultimoErro = new Error("ultimo erro");
  prepararRespostas({
    upserts: [{ error: primeiroErro }, { error: ultimoErro }],
  });

  await assert.rejects(
    salvarCurtidaObraPublicaSupabase(
      "usuario-a",
      "obra-valida",
      true,
    ),
    (erro) => erro === ultimoErro,
  );
});
