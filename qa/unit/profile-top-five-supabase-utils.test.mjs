import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(new URL("../../app/perfil-autor/lib/profile-top-five-supabase-utils.ts", import.meta.url), "utf8");
const pagina = readFileSync(new URL("../../app/perfil-autor/page.tsx", import.meta.url), "utf8");
let indice = 0;

async function modulo(configurar) {
  const deps = { local: { total: 2, curtiu: false }, respostas: [], chamadas: [], valido: (id) => id.startsWith("usuario-") };
  deps.supabase = { from(tabela) { const resposta = deps.respostas.shift(); const chamada = { tabela, select: null, eq: [], delete: false, insert: null }; deps.chamadas.push(chamada); const q = { select: (v, o) => (chamada.select = [v, o], q), eq: (c, v) => (chamada.eq.push([c, v]), q), limit: () => q, maybeSingle: () => Promise.resolve(resposta), delete: () => (chamada.delete = true, q), insert: (v) => (chamada.insert = v, Promise.resolve(resposta)), then: (ok, erro) => Promise.resolve(resposta).then(ok, erro) }; return q; } };
  configurar(deps); globalThis.__top5 = deps;
  const js = typescript.transpileModule(source.replace('import { supabase } from "../../../lib/supabase/client";', 'const supabase = globalThis.__top5.supabase;').replace('import { idAutorSupabaseValido } from "./profile-formatters";', 'const idAutorSupabaseValido = globalThis.__top5.valido;').replace('import { carregarCurtidasTopFiveLocais } from "./profile-top-five-local-utils";', 'const carregarCurtidasTopFiveLocais = () => globalThis.__top5.local;'), { compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 } }).outputText;
  return { ...(await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}#${indice++}`)), deps };
}

test("carrega total remoto, curtida e fallback local", async () => {
  const { carregarCurtidasTopFivePerfil, deps } = await modulo((d) => d.respostas.push({ count: 5, error: null }, { data: { perfil_user_id: "usuario-2" }, error: null }));
  assert.deepEqual(await carregarCurtidasTopFivePerfil(" usuario-2 ", "usuario-1"), { total: 5, curtiu: true });
  assert.deepEqual(deps.chamadas[0].select, ["perfil_user_id", { count: "exact", head: true }]);
  assert.deepEqual(await carregarCurtidasTopFivePerfil("invalido", "usuario-1"), { total: 2, curtiu: false });
});

test("preserva cancelamento antes e após awaits", async () => {
  const leitura = await modulo((d) => d.respostas.push({ count: 9, error: null })); let verificacoesLeitura = 0;
  assert.deepEqual(await leitura.carregarCurtidasTopFivePerfil("usuario-2", "", () => ++verificacoesLeitura < 2), { total: 2, curtiu: false });
  assert.equal(leitura.deps.chamadas.length, 1);
  const antesInserir = await modulo((d) => d.respostas.push({ error: null })); let verificacoesAntesInserir = 0;
  assert.equal(await antesInserir.salvarCurtidaTopFiveSupabase("usuario-2", "usuario-1", true, () => ++verificacoesAntesInserir < 2), false);
  assert.equal(antesInserir.deps.chamadas.length, 1);
  const aposInserir = await modulo((d) => d.respostas.push({ error: null }, { error: null })); let verificacoesAposInserir = 0;
  assert.equal(await aposInserir.salvarCurtidaTopFiveSupabase("usuario-2", "usuario-1", true, () => ++verificacoesAposInserir < 3), false);
  assert.deepEqual(aposInserir.deps.chamadas[1].insert, { perfil_user_id: "usuario-2", usuario_id: "usuario-1" });
});

test("remove e insere na ordem original, preservando erros", async () => {
  const { salvarCurtidaTopFiveSupabase, deps } = await modulo((d) => d.respostas.push({ error: null }, { error: null }));
  assert.equal(await salvarCurtidaTopFiveSupabase(" usuario-2 ", " usuario-1 ", true), true);
  assert.equal(deps.chamadas[0].delete, true);
  assert.deepEqual(deps.chamadas[1].insert, { perfil_user_id: "usuario-2", usuario_id: "usuario-1" });
  assert.equal(await salvarCurtidaTopFiveSupabase("invalido", "usuario-1", true), false);
});

test("Página delega os helpers Top 5 e preserva as guardas", () => {
  assert.match(pagina, /from "\.\/lib\/profile-top-five-supabase-utils"/);
  for (const nome of ["carregarCurtidasTopFivePerfil", "salvarCurtidaTopFiveSupabase"]) { assert.match(source, new RegExp(`export async function ${nome}\\(`)); assert.doesNotMatch(pagina, new RegExp(`async function ${nome}\\(`)); }
  assert.equal((source.match(/operacaoAindaAtual && !operacaoAindaAtual\(\)/g) || []).length, 7);
});
