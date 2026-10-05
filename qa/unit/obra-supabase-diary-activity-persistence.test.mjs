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
  "        globalThis.chamadasDiario.push(chamada);",
  "        if (resposta.cancelar) globalThis.execucaoPermitida = false;",
  "        if (resposta.excecao) throw resposta.excecao;",
  "        const query = {",
  "          error: chamada.error,",
  "          eq(campo, valor) {",
  "            chamada.filtros.push([campo, valor]);",
  "            return query;",
  "          },",
  "        };",
  "        return query;",
  "      },",
  "      insert(payload) {",
  "        const resposta = globalThis.respostasInsert.shift() || { error: null };",
  "        globalThis.chamadasDiario.push({ tipo: 'insert', tabela, payload, error: resposta.error });",
  "        if (resposta.cancelar) globalThis.execucaoPermitida = false;",
  "        if (resposta.excecao) throw resposta.excecao;",
  "        return Promise.resolve({ error: resposta.error });",
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
    "../../app/obra/[slug]/lib/obra-supabase-diary-activity-persistence.ts",
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
  registrarAtividadeDiarioObra,
  removerAtividadeDiarioObra,
} = await import(criarUrlModulo(moduloJavascript));

const obra = {
  id: "obra-valida",
  titulo: "Obra de teste",
  slug: "obra-de-teste",
  autor: "Autora de teste",
  genero: "Fantasia",
  formato: "Webcomic",
};

function prepararRespostas({ deletes = [], inserts = [] } = {}) {
  globalThis.chamadasDiario = [];
  globalThis.respostasDelete = deletes;
  globalThis.respostasInsert = inserts;
  globalThis.execucaoPermitida = true;
}

test("guards impedem qualquer persistencia remota invalida ou cancelada", async () => {
  prepararRespostas();

  await removerAtividadeDiarioObra({
    userId: "",
    obra,
    tipo: "favoritou_obra",
  });
  await registrarAtividadeDiarioObra({
    userId: "usuario-a",
    obra: { ...obra, id: "obra-invalida" },
    tipo: "favoritou_obra",
    visibilidade: "parcial",
  });
  await registrarAtividadeDiarioObra({
    userId: "usuario-a",
    obra,
    tipo: "favoritou_obra",
    visibilidade: "parcial",
    execucaoAtual: () => false,
  });

  assert.deepEqual(globalThis.chamadasDiario, []);
});

test("remove atividade com a ordem de filtros atual", async () => {
  prepararRespostas();

  await removerAtividadeDiarioObra({
    userId: "usuario-a",
    obra,
    tipo: "concluiu_obra",
  });

  assert.deepEqual(globalThis.chamadasDiario, [
    {
      tipo: "delete",
      tabela: "diario_atividades",
      filtros: [
        ["user_id", "usuario-a"],
        ["obra_id", "obra-valida"],
        ["tipo", "concluiu_obra"],
      ],
      error: null,
    },
  ]);
});

test("registra com nota normalizada, payload e metadata atuais", async () => {
  prepararRespostas();

  await registrarAtividadeDiarioObra({
    userId: "usuario-a",
    obra,
    tipo: "avaliou_obra",
    nota: 4.26,
    texto: "  Avaliou a obra.  ",
    visibilidade: "publico",
  });

  assert.deepEqual(globalThis.chamadasDiario, [
    {
      tipo: "delete",
      tabela: "diario_atividades",
      filtros: [
        ["user_id", "usuario-a"],
        ["obra_id", "obra-valida"],
        ["tipo", "avaliou_obra"],
      ],
      error: null,
    },
    {
      tipo: "insert",
      tabela: "diario_atividades",
      payload: {
        user_id: "usuario-a",
        tipo: "avaliou_obra",
        obra_id: "obra-valida",
        texto: "Avaliou a obra.",
        visibilidade: "publico",
        metadata: {
          origem: "obra_publica",
          titulo: "Obra de teste",
          slug: "obra-de-teste",
          autor: "Autora de teste",
          genero: "Fantasia",
          formato: "Webcomic",
        },
        nota: 4.5,
      },
      error: null,
    },
  ]);
});

test("faz fallback sem nota quando o primeiro insert retorna erro", async () => {
  const erroPrimeiroInsert = new Error("nota indisponivel");
  prepararRespostas({ inserts: [{ error: erroPrimeiroInsert }, { error: null }] });

  await registrarAtividadeDiarioObra({
    userId: "usuario-a",
    obra,
    tipo: "avaliou_obra",
    nota: 3,
    visibilidade: "publico",
  });

  assert.equal(globalThis.chamadasDiario.length, 3);
  assert.equal(globalThis.chamadasDiario[1].payload.nota, 3);
  assert.deepEqual(globalThis.chamadasDiario[2].payload, {
    user_id: "usuario-a",
    tipo: "avaliou_obra",
    obra_id: "obra-valida",
    texto: null,
    visibilidade: "publico",
    metadata: {
      origem: "obra_publica",
      titulo: "Obra de teste",
      slug: "obra-de-teste",
      autor: "Autora de teste",
      genero: "Fantasia",
      formato: "Webcomic",
    },
  });
});

test("interrompe depois da remocao quando a execucao fica obsoleta", async () => {
  prepararRespostas({ deletes: [{ error: null, cancelar: true }] });

  await registrarAtividadeDiarioObra({
    userId: "usuario-a",
    obra,
    tipo: "salvou_obra",
    visibilidade: "publico",
    execucaoAtual: () => globalThis.execucaoPermitida,
  });

  assert.equal(globalThis.chamadasDiario.length, 1);
  assert.equal(globalThis.chamadasDiario[0].tipo, "delete");
});

test("absorve erros retornados e excecoes com aviso, sem rejeitar", async () => {
  const avisos = [];
  const warnOriginal = console.warn;
  console.warn = (...args) => avisos.push(args);

  try {
    const erroRemocao = new Error("remocao falhou");
    prepararRespostas({ deletes: [{ error: erroRemocao }] });
    await assert.doesNotReject(
      removerAtividadeDiarioObra({
        userId: "usuario-a",
        obra,
        tipo: "favoritou_obra",
      }),
    );

    const excecaoInsert = new Error("insert explodiu");
    prepararRespostas({ inserts: [{ excecao: excecaoInsert }] });
    await assert.doesNotReject(
      registrarAtividadeDiarioObra({
        userId: "usuario-a",
        obra,
        tipo: "favoritou_obra",
        visibilidade: "parcial",
      }),
    );

    assert.equal(avisos.length, 2);
    assert.deepEqual(avisos[0], [
      "Não consegui remover atividade do Diário da obra:",
      "remocao falhou",
    ]);
    assert.deepEqual(avisos[1], [
      "Não consegui acessar diario_atividades na obra:",
      excecaoInsert,
    ]);
  } finally {
    console.warn = warnOriginal;
  }
});
