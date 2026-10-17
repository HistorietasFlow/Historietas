import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(new URL("../../app/em-alta/lib/em-alta-diary-activity.ts", import.meta.url), "utf8");
const pagina = readFileSync(new URL("../../app/em-alta/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../../app/em-alta/hooks/use-em-alta-ranking-collection-actions.ts", import.meta.url), "utf8");
const estado = { usuario: { id: "usuario-1" }, inserts: [], respostas: [], erroAuth: null, erroInsert: null };
globalThis.__emAltaDiaryActivityState = estado;
const executavel = modulo
  .replace('import { supabase } from "../../../lib/supabase/client";\n', `const supabase = {
  auth: { async getUser() { if (globalThis.__emAltaDiaryActivityState.erroAuth) throw globalThis.__emAltaDiaryActivityState.erroAuth; return { data: { user: globalThis.__emAltaDiaryActivityState.usuario } }; } },
  from(tabela) { return { async insert(payload) { const estado = globalThis.__emAltaDiaryActivityState; estado.inserts.push({ tabela, payload }); if (estado.erroInsert) throw estado.erroInsert; return estado.respostas.shift() || { error: null }; } }; },
};\n`)
  .replace('import { idObraSupabaseValido } from "../../../lib/utils";\n', 'const idObraSupabaseValido = (id) => id === "obra-valida";\n')
  .replace('import type { ObraRanking } from "./em-alta-models";\n', "");
const js = typescript.transpileModule(executavel, { compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 } }).outputText;
const { registrarColecaoRankingNoDiario } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
const obra = { storageId: " obra-valida ", titulo: "Obra teste" };
function resetar() { estado.usuario = { id: "usuario-1" }; estado.inserts.length = 0; estado.respostas.length = 0; estado.erroAuth = null; estado.erroInsert = null; }

test("guards não inserem sem usuário, obra ou id válido", async () => {
  resetar(); estado.usuario = null;
  await registrarColecaoRankingNoDiario("favoritou_obra", obra);
  await registrarColecaoRankingNoDiario("favoritou_obra", null);
  await registrarColecaoRankingNoDiario("favoritou_obra", { storageId: "invalida", titulo: "Obra" });
  assert.deepEqual(estado.inserts, []);
});
test("favorito preserva o payload do Diário", async () => {
  resetar(); await registrarColecaoRankingNoDiario("favoritou_obra", obra);
  assert.deepEqual(estado.inserts, [{ tabela: "diario_atividades", payload: { user_id: "usuario-1", obra_id: "obra-valida", tipo: "favoritou_obra", texto: "adicionou Obra teste à lista", visibilidade: "parcial", metadata: { obra_titulo: "Obra teste", origem: "em-alta" } } }]);
});
test("conclusão e título ausente preservam os textos literais", async () => {
  resetar(); await registrarColecaoRankingNoDiario("concluiu_obra", { storageId: "obra-valida", titulo: "" });
  assert.equal(estado.inserts[0].payload.texto, "concluiu uma obra");
  resetar(); await registrarColecaoRankingNoDiario("favoritou_obra", { storageId: "obra-valida", titulo: "" });
  assert.equal(estado.inserts[0].payload.texto, "adicionou uma obra à lista");
});
test("erro do primeiro insert usa fallback sem visibilidade", async () => {
  resetar(); estado.respostas.push({ error: { message: "coluna ausente" } });
  await registrarColecaoRankingNoDiario("concluiu_obra", obra);
  assert.equal(estado.inserts.length, 2);
  assert.equal("visibilidade" in estado.inserts[1].payload, false);
  assert.deepEqual(estado.inserts[1].payload, { user_id: "usuario-1", obra_id: "obra-valida", tipo: "concluiu_obra", texto: "concluiu Obra teste", metadata: { obra_titulo: "Obra teste", origem: "em-alta" } });
});
test("exceções de autenticação ou insert permanecem silenciosas", async () => {
  resetar(); estado.erroAuth = new Error("auth indisponível");
  await assert.doesNotReject(() => registrarColecaoRankingNoDiario("favoritou_obra", obra));
  resetar(); estado.erroInsert = new Error("insert indisponível");
  await assert.doesNotReject(() => registrarColecaoRankingNoDiario("favoritou_obra", obra));
});
test("fronteira preserva somente a persistência de atividade", () => {
  assert.match(modulo, /export async function registrarColecaoRankingNoDiario\b/);
  assert.match(modulo, /from\("diario_atividades"\)\.insert\(payload\)/);
  assert.match(modulo, /origem: "em-alta"/); assert.match(modulo, /O ranking não deve falhar por causa do Diário\./);
  for (const proibido of [/\.upsert\(/, /\.update\(/, /\.delete\(/, /localStorage/, /from ["']react["']/i, /\buse[A-Z]\w*\b/, /<[A-Z][\w.]*\s+[\w-]+=/]) assert.doesNotMatch(modulo, proibido);
  assert.match(hook, /import \{ registrarColecaoRankingNoDiario \} from "\.\.\/lib\/em-alta-diary-activity";/);
  assert.doesNotMatch(pagina, /async function registrarColecaoRankingNoDiario\b/);
  assert.match(hook, /void registrarColecaoRankingNoDiario\("favoritou_obra", obraRanking\)/);
  assert.match(hook, /void registrarColecaoRankingNoDiario\("concluiu_obra", obraRanking\)/);
});
