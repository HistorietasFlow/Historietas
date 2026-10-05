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
  "        globalThis.chamadasAvaliacao.push(chamada);",
  "        const query = {",
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
  "        globalThis.chamadasAvaliacao.push({ tipo: 'upsert', tabela, payload, opcoes });",
  "        return Promise.resolve({ error: resposta.error });",
  "      },",
  "    };",
  "  },",
  "};",
].join("\n"));

const moduloTypescript = readFileSync(
  new URL(
    "../../app/obra/[slug]/lib/obra-supabase-rating-persistence.ts",
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
const { salvarAvaliacaoRemotaObra } = await import(criarUrlModulo(moduloJavascript));

function prepararRespostas({ deletes = [], upserts = [] } = {}) {
  globalThis.chamadasAvaliacao = [];
  globalThis.respostasDelete = deletes;
  globalThis.respostasUpsert = upserts;
}

test("guards de IDs vazios nao iniciam persistencia", async () => {
  prepararRespostas();

  await salvarAvaliacaoRemotaObra({
    obraId: " ",
    userId: "usuario-a",
    nota: 4,
  });
  await salvarAvaliacaoRemotaObra({
    obraId: "obra-a",
    userId: " ",
    nota: 4,
  });

  assert.deepEqual(globalThis.chamadasAvaliacao, []);
});

test("nota nao positiva remove na ordem de filtros atual", async () => {
  prepararRespostas();

  await salvarAvaliacaoRemotaObra({
    obraId: "obra-a",
    userId: "usuario-a",
    nota: 0,
  });
  await salvarAvaliacaoRemotaObra({
    obraId: "obra-b",
    userId: "usuario-a",
    nota: -1,
  });

  assert.deepEqual(globalThis.chamadasAvaliacao, [
    {
      tipo: "delete",
      tabela: "obra_avaliacoes",
      filtros: [
        ["obra_id", "obra-a"],
        ["user_id", "usuario-a"],
      ],
      error: null,
    },
    {
      tipo: "delete",
      tabela: "obra_avaliacoes",
      filtros: [
        ["obra_id", "obra-b"],
        ["user_id", "usuario-a"],
      ],
      error: null,
    },
  ]);
});

test("nota positiva usa payload e conflito exatos", async () => {
  prepararRespostas();

  await salvarAvaliacaoRemotaObra({
    obraId: "obra-a",
    userId: "usuario-a",
    nota: 3.5,
  });

  assert.deepEqual(globalThis.chamadasAvaliacao, [
    {
      tipo: "upsert",
      tabela: "obra_avaliacoes",
      payload: {
        obra_id: "obra-a",
        user_id: "usuario-a",
        nota: 3.5,
      },
      opcoes: {
        onConflict: "obra_id,user_id",
      },
    },
  ]);
});

test("propaga erros brutos de delete e upsert", async () => {
  const erroRemocao = new Error("remocao falhou");
  prepararRespostas({ deletes: [{ error: erroRemocao }] });

  await assert.rejects(
    salvarAvaliacaoRemotaObra({
      obraId: "obra-a",
      userId: "usuario-a",
      nota: 0,
    }),
    (erro) => erro === erroRemocao,
  );

  const erroSalvar = new Error("upsert falhou");
  prepararRespostas({ upserts: [{ error: erroSalvar }] });

  await assert.rejects(
    salvarAvaliacaoRemotaObra({
      obraId: "obra-a",
      userId: "usuario-a",
      nota: 4,
    }),
    (erro) => erro === erroSalvar,
  );
});
