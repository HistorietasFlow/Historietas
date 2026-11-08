import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { AsyncLocalStorage } from "node:async_hooks";
import test from "node:test";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const modulo = { exports: {} };
  new Function("require", "module", "exports", code)((id) => {
    if (id === "server-only") return {};
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id.startsWith("node:")) return nativeRequire(id);
    throw new Error(`Import nao previsto: ${id}`);
  }, modulo, modulo.exports);
  return modulo.exports;
}
const tags = load("../../lib/cache/obra-publica-cache-tag.ts");
const consumer = load("../../lib/server/agendamento/solicitar-invalidacao-cache.ts");
const id = "bc300000-0000-4000-8000-000000000001";
const event = { id, leaseId: id, obraId: id, capituloId: id, revisao: 1, slug: "obra-a", slugAtual: "obra-a", numero: 2 };

test("consumidor somente solicita; repete sem ack/publicar e valida o lote antes de efeitos", async () => {
  const steps = [];
  const deps = { reivindicar: async () => [event], invalidar: () => steps.push("fila"), registrar: async () => steps.push("solicitacao") };
  for (let i = 0; i < 2; i++) {
    const result = await consumer.solicitarInvalidacaoCacheCapitulos(deps);
    assert.equal(result.confirmadas, 0); assert.equal(result.publicacaoAutomaticaHabilitada, false);
    assert.equal(result.estado, "solicitado_sem_confirmacao");
  }
  assert.deepEqual(steps, ["fila", "solicitacao", "fila", "solicitacao"]);
  await assert.rejects(consumer.solicitarInvalidacaoCacheCapitulos({ ...deps, reivindicar: async () => [event, { ...event, revisao: -1 }] }));
  assert.equal(steps.length, 4);
  await assert.rejects(consumer.solicitarInvalidacaoCacheCapitulos({ ...deps, invalidar: () => { throw new Error("falha fila"); } }), /falha fila/);
  assert.equal(steps.length, 4);
  await assert.rejects(consumer.solicitarInvalidacaoCacheCapitulos({ ...deps, registrar: async () => { throw new Error("resposta perdida"); } }), /resposta perdida/);
  assert.equal(steps.at(-1), "fila");
  for (const value of [null, {}, Array(6).fill(event), [{ ...event, id: "../outra" }]]) assert.throws(() => consumer.lerEventosCache(value));
});

test("caches aquecidos positivos/negativos e listas usam tag isolada por slug, sem alterar RLS/18+", async () => {
  const cache = new Map(), calls = new Map();
  const works = new Map();
  const client = { from(table) {
    const filters = {};
    const query = {
      select() { return this; }, eq(k, v) { filters[k] = v; return this; }, limit() { return this; }, order() { return this; }, range() { return this; },
      async maybeSingle() {
        const slug = filters.slug; calls.set(slug, (calls.get(slug) || 0) + 1);
        if (table === "obras") return { data: works.get(slug)?.publicado ? works.get(slug) : null, error: null };
        return { data: [...works.values()].flatMap((w) => w.capitulos).find((c) => c.obra_id === filters.obra_id && c.ordem === filters.ordem && c.publicado) || null, error: null };
      },
      then(resolve, reject) { return Promise.resolve({ data: [...works.values()].flatMap((w) => w.capitulos).filter((c) => c.obra_id === filters.obra_id && c.publicado), error: null }).then(resolve, reject); },
    }; return query;
  } };
  const loaders = load("../../lib/cache/obrasPublicas.ts", {
    "next/cache": { unstable_cache(fn, keys, options) { return async (...args) => {
      const key = JSON.stringify([keys, args]);
      if (!cache.has(key)) cache.set(key, { data: await fn(...args), tags: options.tags });
      return cache.get(key).data;
    }; } },
    "./obra-publica-cache-tag": tags,
    "../historietasAdultContent": { ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO: true, ehClassificacao18: (c) => c === "18+", normalizarAvisosConteudo18: () => [] },
    "../utils": { idObraSupabaseValido: (s) => typeof s === "string" && s.length === 36 },
    "../supabase/paginacao.mjs": { carregarTodasPaginasSupabase: async ({ buscarPagina }) => (await buscarPagina(0, 999)).data },
    "../supabase/public": { supabasePublicoConfigurado: true, criarSupabasePublicClient: () => client },
  });
  const expire = (slug) => { for (const [key, entry] of cache) if (entry.tags.includes(tags.tagObraPublica(slug))) cache.delete(key); };
  assert.equal(await loaders.obterObraMetadataPublica("obra-a"), null);
  assert.equal(await loaders.obterLeituraCapituloPublico("obra-a", 2), null);
  assert.equal(await loaders.obterRotaCapituloPublico("obra-a", 2), null);
  const work = { id, user_id: id, slug: "obra-a", titulo: "Obra A", publicado: true, classificacao_indicativa: "Livre", capitulos: [{ id, obra_id: id, titulo: "Um", texto: "Texto um", ordem: 1, publicado: true }] };
  works.set("obra-a", work);
  assert.equal(await loaders.obterObraMetadataPublica("obra-a"), null);
  expire("obra-a");
  assert.equal((await loaders.obterObraMetadataPublica("obra-a")).titulo, "Obra A");
  assert.equal((await loaders.obterLeituraCapituloPublico("obra-a", 1)).obra.capitulos.length, 1);
  assert.equal(await loaders.obterLeituraCapituloPublico("obra-a", 2), null);
  assert.equal(await loaders.obterRotaCapituloPublico("obra-a", 2), null);
  await loaders.obterObraMetadataPublica("obra-b"); const otherCalls = calls.get("obra-b");
  work.capitulos.push({ ...work.capitulos[0], id: id.replace(/1$/, "2"), ordem: 2, titulo: "Dois" });
  assert.equal((await loaders.obterLeituraCapituloPublico("obra-a", 1)).obra.capitulos.length, 1);
  expire("obra-a");
  assert.equal((await loaders.obterLeituraCapituloPublico("obra-a", 1)).obra.capitulos.length, 2);
  assert.equal((await loaders.obterLeituraCapituloPublico("obra-a", 2)).numeroCapitulo, 2);
  assert.equal((await loaders.obterRotaCapituloPublico("obra-a", 2)).capituloId, work.capitulos[1].id);
  await loaders.obterObraMetadataPublica("obra-b"); assert.equal(calls.get("obra-b"), otherCalls);
  work.classificacao_indicativa = "18+"; expire("obra-a");
  assert.equal(await loaders.obterLeituraCapituloPublico("obra-a", 1), null);
  assert.equal(await loaders.obterRotaCapituloPublico("obra-a", 1), null);
  assert.equal(await loaders.obterObraMetadataPublica("obra-a"), null);
  work.classificacao_indicativa = "Livre"; work.publicado = false; expire("obra-a");
  assert.equal(await loaders.obterLeituraCapituloPublico("obra-a", 1), null);
});

test("route exige origem, usuario e autorizacao atual; invalida somente slugs e sitemap sem ack", async () => {
  let user = false, auth = false, queued = [], rpc = [];
  const route = load("../../app/api/admin/cache-capitulos/route.ts", {
    "next/server": { NextResponse: { json: (data, opts) => Response.json(data, opts) } },
    "next/cache": { revalidateTag: (...a) => queued.push(["tag", ...a]), revalidatePath: (...a) => queued.push(["path", ...a]) },
    "@/lib/supabase/server": { supabaseServerConfigurado: true, criarSupabaseServerClient: async () => ({ auth: { getUser: async () => ({ data: { user: user ? { id } : null } }) }, rpc: async () => ({ data: auth }) }) },
    "@/lib/supabase/admin": { supabaseAdminConfigurado: true, criarSupabaseAdminClient: () => ({ rpc: async (name) => { rpc.push(name); return { data: name === "reivindicar_cache_capitulos" ? [event] : true }; } }) },
    "@/lib/cache/obra-publica-cache-tag": tags,
    "@/lib/server/agendamento/solicitar-invalidacao-cache": consumer,
  });
  const req = (origin = "http://localhost") => ({ headers: new Headers({ origin, host: "localhost" }), nextUrl: new URL("http://localhost/api/admin/cache-capitulos") });
  assert.equal((await route.POST(req("https://hostil.test"))).status, 403);
  assert.equal((await route.POST(req())).status, 401);
  assert.equal((await route.POST({ headers: new Headers({ origin: "http://127.0.0.1:3000", host: "127.0.0.1:3000" }), nextUrl: new URL("http://localhost:3000/api/admin/cache-capitulos") })).status, 401);
  user = true; assert.equal((await route.POST(req())).status, 403);
  assert.equal(rpc.length, 0);
  auth = true;
  const result = await route.POST(req()); assert.equal(result.status, 202); assert.equal((await result.json()).confirmadas, 0);
  assert.deepEqual(queued, [["tag", tags.tagObraPublica("obra-a"), { expire: 0 }], ["path", "/obra/obra-a"], ["path", "/obra/obra-a/capitulo/2"], ["path", "/sitemap.xml"]]);
  assert.deepEqual(rpc, ["reivindicar_cache_capitulos", "registrar_solicitacao_cache_capitulo"]);
});

test("Next real retorna antes de executar invalidacao; falha posterior nao e ack", async () => {
  globalThis.AsyncLocalStorage ||= AsyncLocalStorage;
  const { workAsyncStorage } = nativeRequire("next/dist/server/app-render/work-async-storage.external");
  const { revalidateTag } = nativeRequire("next/cache");
  const { executeRevalidates } = nativeRequire("next/dist/server/revalidation-utils");
  let calls = 0;
  const store = { incrementalCache: { revalidateTag: async () => { calls++; throw new Error("cache indisponivel apos retorno"); } } };
  workAsyncStorage.run(store, () => {
    assert.equal(revalidateTag("teste-privado", { expire: 0 }), undefined);
    assert.equal(calls, 0);
    assert.equal(store.pendingRevalidatedTags.length, 1);
  });
  await assert.rejects(executeRevalidates(store), /cache indisponivel apos retorno/);
  assert.equal(calls, 1);
});
