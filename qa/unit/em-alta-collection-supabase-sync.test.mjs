import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(new URL("../../app/em-alta/lib/em-alta-collection-supabase-sync.ts", import.meta.url), "utf8");
const pagina = readFileSync(new URL("../../app/em-alta/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../../app/em-alta/hooks/use-em-alta-ranking-collection-actions.ts", import.meta.url), "utf8");
const estado = { usuario: { id: "usuario-1" }, chamadas: [], respostasInsert: [], falharAuth: null, falharDelete: null };
globalThis.__emAltaCollectionSyncState = estado;
const executavel = modulo
  .replace('import { supabase } from "../../../lib/supabase/client";\n', `const supabase = {
  auth: { async getUser() { if (globalThis.__emAltaCollectionSyncState.falharAuth) throw globalThis.__emAltaCollectionSyncState.falharAuth; return { data: { user: globalThis.__emAltaCollectionSyncState.usuario } }; } },
  from(tabela) { const chamada = { tabela, operacoes: [] }; globalThis.__emAltaCollectionSyncState.chamadas.push(chamada); let deletePendente = false; const builder = {
    delete() { chamada.operacoes.push(["delete"]); deletePendente = true; return this; },
    eq(campo, valor) { chamada.operacoes.push(["eq", campo, valor]); return this; },
    async insert(payload) { chamada.operacoes.push(["insert", payload]); return globalThis.__emAltaCollectionSyncState.respostasInsert.shift() || { error: null }; },
  }; builder.then = (resolver, rejeitar) => { if (!deletePendente) return undefined; const erro=globalThis.__emAltaCollectionSyncState.falharDelete; return erro ? rejeitar(erro) : resolver({ error: null }); }; return builder; }
};\n`)
  .replace('import { idObraSupabaseValido } from "../../../lib/utils";\n', 'const idObraSupabaseValido = (id) => id === "obra-valida";\n')
  .replace('import type { ObraRanking } from "./em-alta-models";\n', "");
const js = typescript.transpileModule(executavel, { compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 } }).outputText;
const { sincronizarColecaoRankingSupabase } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
function resetar() { estado.usuario = { id: "usuario-1" }; estado.chamadas.length = 0; estado.respostasInsert.length = 0; estado.falharAuth = null; estado.falharDelete = null; }
const obra = { storageId: " obra-valida ", titulo: "Obra" };

test("guards de usuário, obra e id inválido não escrevem", async () => {
  resetar(); estado.usuario = null;
  await sincronizarColecaoRankingSupabase("favoritos", obra, true);
  await sincronizarColecaoRankingSupabase("favoritos", null, true);
  await sincronizarColecaoRankingSupabase("favoritos", { storageId: "invalida", titulo: "Obra" }, true);
  assert.equal(estado.chamadas.length, 0);
});
test("inativo executa somente delete com user_id e obra_id", async () => {
  resetar(); await sincronizarColecaoRankingSupabase("concluidas", obra, false);
  assert.deepEqual(estado.chamadas, [{ tabela: "concluidas", operacoes: [["delete"], ["eq", "user_id", "usuario-1"], ["eq", "obra_id", "obra-valida"]] }]);
});
test("ativo preserva delete antes do insert parcial para favoritos", async () => {
  resetar(); await sincronizarColecaoRankingSupabase("favoritos", obra, true);
  assert.deepEqual(estado.chamadas[0].operacoes, [["delete"], ["eq", "user_id", "usuario-1"], ["eq", "obra_id", "obra-valida"]]);
  assert.deepEqual(estado.chamadas[1].operacoes, [["insert", { user_id: "usuario-1", obra_id: "obra-valida", visibilidade: "parcial" }]]);
  assert.equal(estado.chamadas.length, 2);
});
test("erro no primeiro insert preserva fallback sem visibilidade", async () => {
  resetar(); estado.respostasInsert.push({ error: { message: "coluna ausente" } });
  await sincronizarColecaoRankingSupabase("concluidas", obra, true);
  assert.deepEqual(estado.chamadas.slice(1).map((chamada) => chamada.operacoes), [
    [["insert", { user_id: "usuario-1", obra_id: "obra-valida", visibilidade: "parcial" }]],
    [["insert", { user_id: "usuario-1", obra_id: "obra-valida" }]],
  ]);
});
test("exceções não propagam e preservam aviso literal", async () => {
  resetar(); estado.falharAuth = new Error("auth indisponível"); const avisos=[]; const original=console.warn; console.warn=(...args)=>avisos.push(args);
  try { await assert.doesNotReject(() => sincronizarColecaoRankingSupabase("favoritos", obra, true)); } finally { console.warn=original; }
  assert.equal(avisos[0][0], "Não consegui sincronizar favoritos pelo Em Alta:");
});
test("fronteira mantém somente a sincronização esperada", () => {
  assert.match(modulo, /export async function sincronizarColecaoRankingSupabase\b/);
  assert.match(modulo, /\.from\(tabela\)\s*\.delete\(\)\s*\.eq\("user_id", userId\)\s*\.eq\("obra_id", obraId\)/);
  assert.match(modulo, /visibilidade: "parcial"/); assert.match(modulo, /await supabase\.from\(tabela\)\.insert\(payloadBase\)/);
  for (const proibido of [/\.upsert\(/, /\.update\(/, /diario_atividades/, /localStorage/, /from ["']react["']/i, /\buse[A-Z]\w*\b/, /<[A-Z][\w.]*\s+[\w-]+=/]) assert.doesNotMatch(modulo, proibido);
  assert.match(hook, /import \{ sincronizarColecaoRankingSupabase \} from "\.\.\/lib\/em-alta-collection-supabase-sync";/);
  assert.doesNotMatch(pagina, /async function sincronizarColecaoRankingSupabase\b/);
  assert.match(hook, /sincronizarColecaoRankingSupabase\(\s*"favoritos",\s*obraRanking,\s*obraVaiFicarFavorita/);
  assert.match(hook, /sincronizarColecaoRankingSupabase\(\s*"concluidas",\s*obraRanking,\s*obraVaiFicarConcluida/);
});
