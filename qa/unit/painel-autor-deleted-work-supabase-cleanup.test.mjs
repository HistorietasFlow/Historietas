import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const cleanupSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-deleted-work-supabase-cleanup.ts",
    import.meta.url,
  ),
  "utf8",
);

const consultas = [];
let tabelaComFalha = "";
globalThis.__painelAutorSupabaseCleanup = {
  from(tabela) {
    if (tabela === tabelaComFalha) {
      throw new Error(`falha em ${tabela}`);
    }
    const filtros = [];
    const consulta = {
      delete() {
        return consulta;
      },
      eq(campo, valor) {
        filtros.push({ tipo: "eq", campo, valor });
        return consulta;
      },
      in(campo, valores) {
        filtros.push({ tipo: "in", campo, valores });
        return consulta;
      },
      then(resolve, reject) {
        consultas.push({ tabela, filtros: [...filtros] });
        return Promise.resolve({ error: null }).then(resolve, reject);
      },
    };
    return consulta;
  },
};

const cleanupJavascript = typescript.transpileModule(
  cleanupSource.replace(
    'import { supabase } from "../../../lib/supabase/client";',
    "const supabase = globalThis.__painelAutorSupabaseCleanup;",
  ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const { removerReferenciasSupabaseObraExcluidaPainel } = await import(
  `data:text/javascript;base64,${Buffer.from(cleanupJavascript).toString("base64")}`,
);

test("removerReferenciasSupabaseObraExcluidaPainel preserva normalização, relações e limpeza de capítulos", async () => {
  consultas.length = 0;

  await removerReferenciasSupabaseObraExcluidaPainel(
    " usuario-1 ",
    " obra-1 ",
    [" capitulo-1 ", "", " capitulo-2 "],
  );

  assert.deepEqual(consultas, [
    ...[
      "favoritos",
      "concluidas",
      "seguindo_obras",
      "obra_curtidas",
      "obra_avaliacoes",
      "progresso_leitura",
      "diario_atividades",
    ].map((tabela) => ({
      tabela,
      filtros: [
        { tipo: "eq", campo: "user_id", valor: "usuario-1" },
        { tipo: "eq", campo: "obra_id", valor: "obra-1" },
      ],
    })),
    {
      tabela: "comentarios_obras",
      filtros: [{ tipo: "eq", campo: "obra_id", valor: "obra-1" }],
    },
    ...["curtidas_capitulos", "salvos_capitulos", "comentarios_capitulos"].map(
      (tabela) => ({
        tabela,
        filtros: [
          { tipo: "eq", campo: "user_id", valor: "usuario-1" },
          {
            tipo: "in",
            campo: "capitulo_id",
            valores: ["capitulo-1", "capitulo-2"],
          },
        ],
      }),
    ),
  ]);
});

test("removerReferenciasSupabaseObraExcluidaPainel não consulta sem IDs válidos", async () => {
  consultas.length = 0;
  await removerReferenciasSupabaseObraExcluidaPainel(" ", "obra-1", ["capitulo-1"]);
  await removerReferenciasSupabaseObraExcluidaPainel("usuario-1", " ", ["capitulo-1"]);
  assert.deepEqual(consultas, []);
});

test("removerReferenciasSupabaseObraExcluidaPainel mantém a limpeza best-effort", async () => {
  consultas.length = 0;
  tabelaComFalha = "favoritos";
  try {
    await assert.doesNotReject(
      removerReferenciasSupabaseObraExcluidaPainel("usuario-1", "obra-1", ["capitulo-1"]),
    );
  } finally {
    tabelaComFalha = "";
  }
  assert.deepEqual(consultas, []);
});

test("Painel do Autor delega a limpeza social Supabase sem alterar excluirObra", () => {
  assert.match(
    pagina,
    /import \{ removerReferenciasSupabaseObraExcluidaPainel \} from "\.\/lib\/painel-autor-deleted-work-supabase-cleanup";/,
  );
  assert.doesNotMatch(
    pagina,
    /async function removerReferenciasSupabaseObraExcluidaPainel\(/,
  );
  assert.match(
    pagina,
    /await removerReferenciasSupabaseObraExcluidaPainel\([\s\S]*?obraExcluida\.capitulos\.map\(\(capitulo\) => capitulo\.id\)[\s\S]*?\);/,
  );
  assert.match(cleanupSource, /export async function removerReferenciasSupabaseObraExcluidaPainel\(/);
  assert.match(cleanupSource, /Promise\.allSettled\(\[/);
  for (const tabela of [
    "favoritos",
    "concluidas",
    "seguindo_obras",
    "obra_curtidas",
    "obra_avaliacoes",
    "progresso_leitura",
    "diario_atividades",
    "comentarios_obras",
    "curtidas_capitulos",
    "salvos_capitulos",
    "comentarios_capitulos",
  ]) {
    assert.match(cleanupSource, new RegExp(`\\.from\\("${tabela}"\\)`));
  }
  assert.match(cleanupSource, /if \(capitulosValidos\.length > 0\)/);
  assert.match(
    cleanupSource,
    /A exclusão principal da obra continua mesmo se a limpeza social falhar\./,
  );
});
