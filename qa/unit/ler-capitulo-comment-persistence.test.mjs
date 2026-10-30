import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const fonte = readFileSync(new URL("../../app/ler-capitulo/lib/ler-capitulo-comment-persistence.ts", import.meta.url), "utf8");
const executavel = fonte.replace(
  'import { supabase } from "../../../lib/supabase/client";',
  `const supabase = {
    get auth() { return globalThis.__commentPersistence.supabase.auth; },
    from(...args) { return globalThis.__commentPersistence.supabase.from(...args); },
  };`,
);
const javascript = typescript.transpileModule(executavel, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const { salvarComentarioCapituloSupabase, TABELA_COMENTARIOS_CAPITULOS_CURTIDAS } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

function configurar({ userId = "u1", respostas = [] } = {}) {
  const eventos = [];
  globalThis.__commentPersistence = {
    supabase: {
      auth: { async getUser() { eventos.push(["getUser"]); return { data: { user: userId ? { id: userId } : null } }; } },
      from(tabela) {
        eventos.push(["from", tabela]);
        return {
          insert(payload) {
            eventos.push(["insert", payload]);
            return {
              select(campos) {
                eventos.push(["select", campos]);
                return { async single() { return respostas.shift() || { data: null, error: new Error("falha") }; } };
              },
            };
          },
        };
      },
    },
  };
  return eventos;
}

test("persistência preserva guards, trims, limite e primeira tentativa", async () => {
  for (const [userId, capitulo, comentario] of [["", "cap", "texto"], ["u", " ", "texto"], ["u", "cap", " "]]) {
    const eventos = configurar({ userId });
    assert.equal(await salvarComentarioCapituloSupabase(capitulo, comentario), null);
    assert.equal(eventos.filter(([tipo]) => tipo === "from").length, 0);
  }
  const eventos = configurar({ respostas: [{ data: { id: "c1" }, error: null }] });
  const resultado = await salvarComentarioCapituloSupabase(" cap ", ` ${"x".repeat(430)} `, " ");
  assert.deepEqual(resultado, { id: "c1" });
  assert.equal(eventos[1][1], "comentarios_capitulos");
  assert.equal(eventos[2][1].capitulo_id, "cap");
  assert.equal(eventos[2][1].comentario.length, 420);
  assert.equal(eventos[2][1].comentario_pai_id, null);
  assert.match(eventos[2][1].atualizado_em, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(eventos[3][1], "id,user_id,comentario,comentario_pai_id,atualizado_em,criado_em");
});

test("persistência preserva segunda tentativa, bloqueio do legado para respostas e fallback legado", async () => {
  const eventosSegunda = configurar({ respostas: [{ data: null, error: new Error("primeira") }, { data: { id: "c2" }, error: null }] });
  assert.deepEqual(await salvarComentarioCapituloSupabase("cap", "texto", "pai"), { id: "c2" });
  assert.equal(eventosSegunda.filter(([tipo]) => tipo === "insert").length, 2);
  assert.equal(eventosSegunda[5][1].atualizado_em, undefined);
  assert.equal(eventosSegunda[6][1], "id,user_id,comentario,comentario_pai_id,criado_em");

  const eventosPai = configurar({ respostas: [{ data: null, error: new Error("primeira") }, { data: null, error: new Error("segunda") }] });
  assert.equal(await salvarComentarioCapituloSupabase("cap", "texto", "pai"), null);
  assert.equal(eventosPai.filter(([tipo]) => tipo === "insert").length, 2);

  const eventosLegado = configurar({ respostas: [{ data: null, error: new Error("primeira") }, { data: null, error: new Error("segunda") }, { data: { id: "c3" }, error: null }] });
  assert.deepEqual(await salvarComentarioCapituloSupabase("cap", "texto"), { id: "c3" });
  assert.equal(eventosLegado.filter(([tipo]) => tipo === "insert").length, 3);
  assert.equal(eventosLegado[9][1], "id,user_id,comentario,criado_em");
});

test("persistência preserva warning e retorno nulo na falha final", async () => {
  const warningOriginal = console.warn;
  const avisos = [];
  console.warn = (...args) => avisos.push(args);
  try {
    configurar({ respostas: [{ data: null, error: new Error("primeira") }, { data: null, error: new Error("segunda") }, { data: null, error: new Error("legado") }] });
    assert.equal(await salvarComentarioCapituloSupabase("cap", "texto"), null);
  } finally {
    console.warn = warningOriginal;
  }
  assert.equal(avisos[0][0], "Não consegui salvar comentário do capítulo no Supabase:");
  assert.equal(TABELA_COMENTARIOS_CAPITULOS_CURTIDAS, "comentarios_capitulos_curtidas");
});
