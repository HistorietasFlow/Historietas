import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const persistencia = ler("../../app/ler-capitulo/lib/ler-capitulo-interaction-persistence.ts");
const metricas = ler("../../app/ler-capitulo/lib/ler-capitulo-metrics.ts");
const social = ler("../../app/ler-capitulo/lib/ler-capitulo-social-persistence.ts");
const commentPersistence = ler("../../app/ler-capitulo/lib/ler-capitulo-comment-persistence.ts");
const transpilar = (codigo) => typescript.transpileModule(codigo, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const importacao = (codigo) => import(`data:text/javascript;base64,${Buffer.from(transpilar(codigo)).toString("base64")}`);
const persistenciaMock = persistencia
  .replace('import { supabase } from "../../../lib/supabase/client";', 'const supabase = { auth: { getUser: (...args) => globalThis.__persistenciaLeitor.supabase.auth.getUser(...args) }, from: (...args) => globalThis.__persistenciaLeitor.supabase.from(...args) };')
  .replace('import { idObraSupabaseValido, obterNumeroSeguro } from "../../../lib/utils";', 'const idObraSupabaseValido = (...args) => globalThis.__persistenciaLeitor.idValido(...args); const obterNumeroSeguro = (...args) => globalThis.__persistenciaLeitor.numero(...args);')
  .replace('import { calcularProgressoLeitura, type ObraLocal } from "./ler-capitulo-work-normalization";', 'const calcularProgressoLeitura = (...args) => globalThis.__persistenciaLeitor.progresso(...args);');
const metricasMock = metricas
  .replace('import { carregarMetricasConteudos } from "../../../lib/metricas";', 'const carregarMetricasConteudos = (...args) => globalThis.__metricasLeitor(...args);');
const capitulo = { id: "capitulo", visualizacoes: 3, curtiu: true, salvo: false };
const obra = { id: "obra", capitulos: [capitulo] };

test("os seis helpers preservam literalmente os corpos e a nova fronteira", () => {
  const contratos = {
    incrementarVisualizacaoCapituloSupabase: "28a08f1ce01c4d393fd89ae94ed741f32969674f1c5e11642926fc839fe64728",
    salvarProgressoLeituraSupabase: "f833e163fa55dc13f54cff89fa880362da8fe5aad8bfb5bc5e9efc0f25c3ad1a",
    salvarRegistroCapituloSupabase: "f614e2d91baad1ae73b25f2b7ff75c020d130b0eb70bf659eba8a009e0939005",
    criarMetricasCapituloLocais: "530c4327e389c25dcb1a10f84e46f684d08beba3ee03dc0e2d0183530a5e670b",
    carregarMetricasCapituloSupabase: "14b55dd2ea91f612cd4fc840c69ddedab51e6ae13862a916ce265122d27ba536",
    formatarContadorCapituloLeitor: "8c6eac1d77d79f08413b7c28d420cb418a1e49bf315395f3b13d8d9c8300dda4",
  };
  for (const [nome, hash] of Object.entries(contratos)) {
    const modulo = (persistencia + "\n" + metricas).replace(/^export (async function|function) /gm, "$1 ");
    const corpo = modulo.match(new RegExp(`^(?:async )?function ${nome}\\([\\s\\S]*?^\\}`, "m"))?.[0];
    assert.ok(corpo, nome);
    assert.equal(createHash("sha256").update(corpo).digest("hex"), hash, nome);
    assert.doesNotMatch(pagina, new RegExp(`(?:async )?function ${nome}\\(`));
    assert.match(pagina, new RegExp(`\\b${nome}\\b`));
  }
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-interaction-persistence";/);
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-metrics";/);
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-comment-persistence";/);
  assert.doesNotMatch(pagina, /async function salvarComentarioCapituloSupabase\(/);
  assert.match(commentPersistence, /export async function salvarComentarioCapituloSupabase\(/);
  assert.doesNotMatch(persistencia + metricas, /function salvarComentarioCapituloSupabase\(/);
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-social-persistence"/);
  for (const movido of ["marcarNotificacaoCapituloComoLidaSupabase", "registrarAtividadeDiarioLeitor"]) {
    assert.match(social, new RegExp(`export async function ${movido}\\(`));
    assert.doesNotMatch(persistencia + metricas, new RegExp(`function ${movido}\\(`));
  }
});

async function cenario(opcoes, teste) {
  const eventos = [];
  const avisos = [];
  const fetchOriginal = globalThis.fetch;
  const warnOriginal = console.warn;
  const supabase = {
    auth: { async getUser() { eventos.push(["auth"]); if (opcoes.authErro) throw new Error("auth"); return { data: { user: opcoes.user === "" ? null : { id: opcoes.user || "usuario" } } }; } },
    from(tabela) {
      eventos.push(["from", tabela]);
      const builder = {
        delete() { eventos.push(["delete"]); return builder; },
        eq(campo, valor) { eventos.push(["eq", campo, valor]); return builder; },
        then(resolver, rejeitar) { return Promise.resolve({ error: opcoes.erroDelete || null }).then(resolver, rejeitar); },
        async insert(payload) { eventos.push(["insert", payload]); return { error: opcoes.erroInsert || null }; },
        async upsert(payload, options) { eventos.push(["upsert", payload, options]); return { error: opcoes.erroUpsert || null }; },
      };
      return builder;
    },
  };
  globalThis.__persistenciaLeitor = { supabase, idValido: (id) => id === "obra" || id === "capitulo", numero: (valor) => Number(valor), progresso: () => 75 };
  globalThis.fetch = async (...args) => { eventos.push(["fetch", ...args]); if (opcoes.fetchErro) throw new Error("fetch"); return opcoes.resposta || { ok: true, async json() { return { ok: true, total: 9 }; } }; };
  console.warn = (...args) => avisos.push(args);
  try { await teste({ modulo: await importacao(persistenciaMock), eventos, avisos }); }
  finally { globalThis.fetch = fetchOriginal; console.warn = warnOriginal; delete globalThis.__persistenciaLeitor; }
}

test("visualização preserva validação, endpoint, payload e fallbacks", async () => {
  await cenario({}, async ({ modulo, eventos }) => {
    assert.equal(await modulo.incrementarVisualizacaoCapituloSupabase(" inválido "), null);
    assert.deepEqual(eventos, []);
    assert.equal(await modulo.incrementarVisualizacaoCapituloSupabase(" capitulo "), 9);
    assert.deepEqual(eventos, [["fetch", "/api/visualizacoes", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: "capitulo", conteudoId: "capitulo" }) }]]);
  });
  for (const opcoes of [{ fetchErro: true }, { resposta: { ok: false, async json() { return { ok: true, total: 5 }; } } }, { resposta: { ok: true, async json() { throw new Error("json"); } } }]) {
    await cenario(opcoes, async ({ modulo }) => assert.equal(await modulo.incrementarVisualizacaoCapituloSupabase("capitulo"), null));
  }
  await cenario({ resposta: { ok: true, async json() { return { ok: true, total: -4 }; } } }, async ({ modulo }) => assert.equal(await modulo.incrementarVisualizacaoCapituloSupabase("capitulo"), 0));
});

test("progresso mantém autenticação, guards, upsert e delete com filtros", async () => {
  await cenario({}, async ({ modulo, eventos }) => {
    assert.equal(await modulo.salvarProgressoLeituraSupabase(obra, " capitulo ", true), true);
    assert.deepEqual(eventos.slice(0, 2), [["auth"], ["from", "progresso_leitura"]]);
    const payload = eventos[2][1];
    assert.deepEqual({ ...payload, atualizado_em: "data" }, { user_id: "usuario", obra_id: "obra", capitulo_id: "capitulo", progresso: 75, lido: true, atualizado_em: "data" });
    assert.ok(!Number.isNaN(Date.parse(payload.atualizado_em)));
    assert.deepEqual(eventos[2][2], { onConflict: "user_id,obra_id,capitulo_id" });
  });
  await cenario({}, async ({ modulo, eventos }) => {
    assert.equal(await modulo.salvarProgressoLeituraSupabase(obra, " capitulo ", false), true);
    assert.deepEqual(eventos, [["auth"], ["from", "progresso_leitura"], ["delete"], ["eq", "user_id", "usuario"], ["eq", "obra_id", "obra"], ["eq", "capitulo_id", "capitulo"]]);
  });
  for (const [opcoes, obraTeste, id] of [[{ user: "" }, obra, "capitulo"], [{}, { ...obra, id: "invalida" }, "capitulo"], [{}, obra, "   "]]) {
    await cenario(opcoes, async ({ modulo, eventos }) => { assert.equal(await modulo.salvarProgressoLeituraSupabase(obraTeste, id, true), false); assert.deepEqual(eventos, [["auth"]]); });
  }
  for (const opcoes of [{ authErro: true }, { erroUpsert: new Error("upsert") }, { erroDelete: new Error("delete") }]) {
    await cenario(opcoes, async ({ modulo, avisos }) => { assert.equal(await modulo.salvarProgressoLeituraSupabase(obra, "capitulo", !opcoes.erroDelete), false); assert.equal(avisos[0][0], "Não consegui salvar progresso de leitura no Supabase:"); });
  }
});

test("curtidas e salvos removem antes de inserir, preservando id e erros", async () => {
  for (const tabela of ["curtidas_capitulos", "salvos_capitulos"]) {
    await cenario({}, async ({ modulo, eventos }) => {
      assert.equal(await modulo.salvarRegistroCapituloSupabase(tabela, " capitulo ", true), true);
      assert.deepEqual(eventos, [["auth"], ["from", tabela], ["delete"], ["eq", "user_id", "usuario"], ["eq", "capitulo_id", " capitulo "], ["from", tabela], ["insert", { user_id: "usuario", capitulo_id: " capitulo " }]]);
    });
    await cenario({}, async ({ modulo, eventos }) => { assert.equal(await modulo.salvarRegistroCapituloSupabase(tabela, "capitulo", false), true); assert.ok(!eventos.some(([acao]) => acao === "insert")); });
  }
  for (const opcoes of [{ erroDelete: new Error("delete") }, { erroInsert: new Error("insert") }, { authErro: true }]) {
    await cenario(opcoes, async ({ modulo, avisos }) => { assert.equal(await modulo.salvarRegistroCapituloSupabase("curtidas_capitulos", "capitulo", true), false); assert.equal(avisos[0][0], "Não consegui salvar registro em curtidas_capitulos:"); });
  }
  await cenario({ user: "" }, async ({ modulo, eventos }) => { assert.equal(await modulo.salvarRegistroCapituloSupabase("salvos_capitulos", "capitulo", true), false); assert.deepEqual(eventos, [["auth"]]); });
  await cenario({}, async ({ modulo, eventos }) => { assert.equal(await modulo.salvarRegistroCapituloSupabase("salvos_capitulos", "   ", true), false); assert.deepEqual(eventos, [["auth"]]); });
});

test("métricas mantêm fallback local, consulta, combinação e formatação", async () => {
  const eventos = [];
  let contrato = { carregado: false, capitulos: new Map() };
  globalThis.__metricasLeitor = async (args) => { eventos.push(args); return contrato; };
  try {
    const modulo = await importacao(metricasMock);
    assert.equal(modulo.criarMetricasCapituloLocais(null), modulo.metricasCapituloVazias);
    assert.deepEqual(modulo.criarMetricasCapituloLocais(capitulo, 2), { totalVisualizacoes: 3, totalCurtidas: 1, totalSalvos: 0, totalComentarios: 2, curtiu: true, salvo: false, carregado: false });
    assert.equal(modulo.criarMetricasCapituloLocais({ ...capitulo, visualizacoes: -1 }).totalVisualizacoes, 0);
    assert.deepEqual(await modulo.carregarMetricasCapituloSupabase({ ...capitulo, id: " " }, 2), modulo.criarMetricasCapituloLocais(capitulo, 2));
    assert.deepEqual(eventos, []);
    assert.deepEqual(await modulo.carregarMetricasCapituloSupabase({ ...capitulo, id: " capitulo " }, 2), { ...modulo.criarMetricasCapituloLocais(capitulo, 2), carregado: true });
    assert.deepEqual(eventos, [{ capituloIds: ["capitulo"] }]);
    contrato = { carregado: true, capitulos: new Map([["capitulo", { visualizacoes: 12, interacoes: { curtidas: 4, salvos: 5, comentarios: 1 }, usuario: { curtiu: false, salvou: true } }]]) };
    assert.deepEqual(await modulo.carregarMetricasCapituloSupabase(capitulo, 2), { totalVisualizacoes: 12, totalCurtidas: 4, totalSalvos: 5, totalComentarios: 2, curtiu: false, salvo: true, carregado: true });
    assert.equal(modulo.formatarContadorCapituloLeitor(1234.6), "1.235");
    assert.equal(modulo.formatarContadorCapituloLeitor(-2), "0");
  } finally { delete globalThis.__metricasLeitor; }
});
