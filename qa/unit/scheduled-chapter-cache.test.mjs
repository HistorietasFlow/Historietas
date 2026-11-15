import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { AsyncLocalStorage } from "node:async_hooks";
import test from "node:test";
import ts from "typescript";
import { solicitarEventoCacheEmLotes } from "../tests/scheduled-chapter-cache-batches.mjs";

const solicitacaoSemAck = (solicitadas) => ({ solicitadas, confirmadas: 0,
  estado: "solicitado_sem_confirmacao", publicacaoAutomaticaHabilitada: false });

for (const anteriores of [0, 7, 12]) {
  test(`QA percorre lotes com ${anteriores} pendencias anteriores sem remove-las ou inventar ACK`, async () => {
    const fila = Array.from({ length: anteriores + 1 }, (_, id) => ({ id, solicitada: false }));
    const idsAntes = fila.map(({ id }) => id);
    let chamadas = 0;
    const lotes = await solicitarEventoCacheEmLotes({
      eventosElegiveis: fila.length,
      solicitarLote: async () => {
        chamadas++;
        const lote = fila.filter((evento) => !evento.solicitada).slice(0, 5);
        for (const evento of lote) evento.solicitada = true;
        return solicitacaoSemAck(lote.length);
      },
      eventoSolicitado: () => fila.at(-1).solicitada,
    });
    assert.equal(lotes, Math.ceil(fila.length / 5));
    assert.equal(chamadas, lotes);
    assert.deepEqual(fila.map(({ id }) => id), idsAntes);
    assert.ok(fila.every(({ solicitada }) => solicitada));
  });
}

test("QA limita chamadas e nao aceita 202/solicitadas como prova do evento alvo", async () => {
  let chamadas = 0;
  await assert.rejects(solicitarEventoCacheEmLotes({ eventosElegiveis: 8,
    solicitarLote: async () => { chamadas++; return solicitacaoSemAck(5); },
    eventoSolicitado: () => false,
  }), /nao registrada apos 2 lotes/);
  assert.equal(chamadas, 2);
});

test("QA nao repete falhas, lotes vazios nem contratos que inventam confirmacao", async () => {
  for (const resultado of [solicitacaoSemAck(0), solicitacaoSemAck(6),
    { ...solicitacaoSemAck(1), confirmadas: 1 }]) {
    let chamadas = 0;
    await assert.rejects(solicitarEventoCacheEmLotes({ eventosElegiveis: 8,
      solicitarLote: async () => { chamadas++; return resultado; }, eventoSolicitado: () => true,
    }));
    assert.equal(chamadas, 1);
  }
  let chamadas = 0;
  await assert.rejects(solicitarEventoCacheEmLotes({ eventosElegiveis: 8,
    solicitarLote: async () => { chamadas++; throw new Error("HTTP 503"); },
    eventoSolicitado: () => false,
  }), /HTTP 503/);
  assert.equal(chamadas, 1);
});

test("QA recusa tamanho de fila invalido antes de chamar o consumidor", async () => {
  for (const eventosElegiveis of [0, -1, 1.5, Infinity, NaN]) {
    await assert.rejects(solicitarEventoCacheEmLotes({ eventosElegiveis,
      solicitarLote: () => assert.fail("Nao deve solicitar lote"), eventoSolicitado: () => false,
    }), /evento elegivel/);
  }
});

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
const operations = load("../../lib/server/agendamento/consumir-operacao-cache.ts", {
  "./solicitar-invalidacao-cache": consumer,
});
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
  const cache = new Map();
  const works = new Map();
  const client = { rpc: async (_name, args) => ({ data: { valida: true, link: null, capitulos: works.get(args.p_slug).capitulos.filter((c) => c.publicado) }, error: null }) };
  const projection = async (slug) => {
    const work = works.get(slug);
    if (!work?.publicado || work.classificacao_indicativa === "18+") return { estado: "obra_indisponivel" };
    return { estado: "obra_publica", obraId: work.id, geracao: id, revisao: JSON.stringify(work), slug,
      obra: { titulo: work.titulo, autorId: work.user_id, classificacaoIndicativa: work.classificacao_indicativa } };
  };
  const barrier = load("../../lib/cache/barreira-projecao-publica.ts");
  const loaders = load("../../lib/cache/obrasPublicas.ts", {
    "../server/agendamento/ler-projecao-publica": { lerProjecaoPublicaObra: projection },
    "./barreira-projecao-publica": barrier,
    "next/cache": { unstable_cache(fn, keys, options) { return async (...args) => {
      const key = JSON.stringify([keys, args]);
      if (!cache.has(key)) cache.set(key, { data: await fn(...args), tags: options.tags });
      return cache.get(key).data;
    }; } },
    "./obra-publica-cache-tag": tags,
    "../historietasAdultContent": { ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO: true, ehClassificacao18: (c) => c === "18+", normalizarAvisosConteudo18: () => [] },
    "../utils": { idObraSupabaseValido: (s) => typeof s === "string" && s.length === 36 },
    "../supabase/paginacao.mjs": { carregarTodasPaginasSupabase: async ({ buscarPagina }) => (await buscarPagina(0, 499)).data },
    "../supabase/public": { supabasePublicoConfigurado: true, criarSupabasePublicClient: () => client },
  });
  const expire = (slug) => { for (const [key, entry] of cache) if (entry.tags.includes(tags.tagObraPublica(slug))) cache.delete(key); };
  assert.equal(await loaders.obterObraMetadataPublica("obra-a"), null);
  assert.equal(await loaders.obterLeituraCapituloPublico("obra-a", 2), null);
  assert.equal(await loaders.obterRotaCapituloPublico("obra-a", 2), null);
  const work = { id, user_id: id, slug: "obra-a", titulo: "Obra A", publicado: true, classificacao_indicativa: "Livre", capitulos: [{ id, obra_id: id, titulo: "Um", texto: "Texto um", ordem: 1, publicado: true }] };
  works.set("obra-a", work);
  // Ausencia de slug nao e cacheada; publicar torna o resultado visivel sem flush.
  assert.equal((await loaders.obterObraMetadataPublica("obra-a")).titulo, "Obra A");
  assert.equal((await loaders.obterLeituraCapituloPublico("obra-a", 1)).obra.capitulos.length, 1);
  assert.equal(await loaders.obterLeituraCapituloPublico("obra-a", 2), null);
  assert.equal(await loaders.obterRotaCapituloPublico("obra-a", 2), null);
  works.set("obra-b", { ...work, id: id.replace(/1$/, "2"), slug: "obra-b", titulo: "Obra B" });
  await loaders.obterObraMetadataPublica("obra-b");
  const [otherKey, otherEntry] = [...cache.entries()].find(([, entry]) => entry.tags.includes(tags.tagObraPublica("obra-b")));
  work.capitulos.push({ ...work.capitulos[0], id: id.replace(/1$/, "2"), ordem: 2, titulo: "Dois" });
  assert.equal((await loaders.obterLeituraCapituloPublico("obra-a", 1)).obra.capitulos.length, 2);
  expire("obra-a");
  assert.equal((await loaders.obterLeituraCapituloPublico("obra-a", 1)).obra.capitulos.length, 2);
  assert.equal((await loaders.obterLeituraCapituloPublico("obra-a", 2)).numeroCapitulo, 2);
  assert.equal((await loaders.obterRotaCapituloPublico("obra-a", 2)).capituloId, work.capitulos[1].id);
  assert.equal((await loaders.obterObraMetadataPublica("obra-b")).titulo, "Obra B");
  assert.equal(cache.get(otherKey), otherEntry);
  work.classificacao_indicativa = "18+"; expire("obra-a");
  assert.equal(await loaders.obterLeituraCapituloPublico("obra-a", 1), null);
  assert.equal(await loaders.obterRotaCapituloPublico("obra-a", 1), null);
  assert.equal(await loaders.obterObraMetadataPublica("obra-a"), null);
  work.classificacao_indicativa = "Livre"; work.publicado = false; expire("obra-a");
  assert.equal(await loaders.obterLeituraCapituloPublico("obra-a", 1), null);
});

test("orcamento bloqueado nao e fila vazia e nao provoca efeitos; contrato desconhecido falha", async () => {
  for (const estado of ["orcamento_esgotado", "orcamento_pausado", "orcamento_nao_configurado"]) {
    const effects = [];
    assert.deepEqual(await consumer.solicitarInvalidacaoCacheCapitulos({
      reivindicar: async () => ({ estado }), invalidar: () => effects.push("invalidar"), registrar: async () => effects.push("registrar"),
    }), { solicitadas: 0, confirmadas: 0, estado, publicacaoAutomaticaHabilitada: false });
    assert.deepEqual(effects, []);
  }
  for (const data of [{ estado: "desconhecido" }, { estado: "orcamento_esgotado", eventos: [event] }]) {
    await assert.rejects(consumer.solicitarInvalidacaoCacheCapitulos({ reivindicar: async () => data,
      invalidar: () => assert.fail("sem efeitos"), registrar: async () => assert.fail("sem efeitos") }), /Outbox invalida/);
  }
});

test("route exige origem, usuario e autorizacao atual; invalida somente slugs e sitemap sem ack", async () => {
  let user = false, auth = false, queued = [], rpc = [], claim = [event];
  const route = load("../../app/api/admin/cache-capitulos/route.ts", {
    "next/server": { NextResponse: { json: (data, opts) => Response.json(data, opts) } },
    "next/cache": { revalidateTag: (...a) => queued.push(["tag", ...a]), revalidatePath: (...a) => queued.push(["path", ...a]) },
    "@/lib/supabase/server": { supabaseServerConfigurado: true, criarSupabaseServerClient: async () => ({ auth: { getUser: async () => ({ data: { user: user ? { id } : null } }) }, rpc: async (name) => ({ data: name === "operar_cache_capitulos" ? { estado: "legado" } : auth }) }) },
    "@/lib/supabase/admin": { supabaseAdminConfigurado: true, criarSupabaseAdminClient: () => ({ rpc: async (name) => { rpc.push(name); return { data: name === "reivindicar_cache_capitulos" ? claim : true }; } }) },
    "@/lib/cache/obra-publica-cache-tag": tags,
    "@/lib/server/agendamento/solicitar-invalidacao-cache": consumer,
    "@/lib/server/agendamento/consumir-operacao-cache": operations,
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
  for (const estado of ["orcamento_esgotado", "orcamento_pausado", "orcamento_nao_configurado"]) {
    claim = { estado }; queued = []; rpc = [];
    const blocked = await route.POST(req());
    assert.equal(blocked.status, 503); assert.equal((await blocked.json()).estado, estado);
    assert.equal(blocked.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(queued, []); assert.deepEqual(rpc, ["reivindicar_cache_capitulos"]);
  }
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

const receipt = (op = id) => ({ estado: "confirmada", operacaoId: op, leasesValidos: true,
  recibo: { operacao_id: op, resultado: [event], debito: 1 } });
function protocolDeps(chamar) {
  const steps = [];
  return { steps, deps: { operacaoId: id, reconciliar: false,
    chamar: async (acao, op) => { assert.equal(op, id); steps.push(acao); return chamar(acao); },
    legado: async () => assert.fail("Nao usar legado"),
    consumir: async (eventos) => { assert.deepEqual(eventos, [event]); steps.push("efeitos"); return solicitacaoSemAck(1); },
  } };
}
test("protocolo separa admissao/execucao, valida recibo e nunca confirma flush", async () => {
  const { steps, deps } = protocolDeps(acao => acao === "preparar" ? { estado: "admitida", operacaoId: id, nova: true } : receipt());
  assert.deepEqual(await operations.consumirOperacaoCache(deps), { ...solicitacaoSemAck(1), operacaoId: id });
  assert.deepEqual(steps, ["preparar", "executar", "efeitos"]);
});
test("intencao existente/timeout/resposta perdida exigem reconciliacao, sem retry ou novo ID", async () => {
  for (const etapa of ["preparar", "executar"]) {
    const { steps, deps } = protocolDeps(acao => {
      if (acao === etapa) throw Error("resposta perdida apos commit");
      return { estado: "admitida", operacaoId: id, nova: true };
    });
    assert.equal((await operations.consumirOperacaoCache(deps)).estado, "reconciliacao_necessaria");
    assert.deepEqual(steps, etapa === "preparar" ? ["preparar"] : ["preparar", "executar"]);
  }
  const { steps, deps } = protocolDeps(() => ({ estado: "admitida", operacaoId: id, nova: false }));
  assert.equal((await operations.consumirOperacaoCache(deps)).estado, "reconciliacao_necessaria");
  assert.deepEqual(steps, ["preparar"]);
});
test("replay confirmado e reconciliacao usam recibo sem nova admissao ou reivindicacao", async () => {
  for (const reconciliar of [false, true]) {
    const { steps, deps } = protocolDeps(() => receipt());
    await operations.consumirOperacaoCache({ ...deps, reconciliar });
    assert.deepEqual(steps, reconciliar ? ["reconciliar", "efeitos"] : ["preparar", "executar", "efeitos"]);
  }
});
test("reconciliacao encerrada, gate/saldo bloqueados e lease vencido nao executam efeitos", async () => {
  for (const r of [{ estado: "encerrada_sem_claim", operacaoId: id }, { estado: "orcamento_bloqueado", operacaoId: id },
    { estado: "admissao_bloqueada" }, { estado: "identificador_obrigatorio" }, { ...receipt(), leasesValidos: false }]) {
    const { steps, deps } = protocolDeps(() => r);
    await operations.consumirOperacaoCache({ ...deps, reconciliar: true });
    assert.deepEqual(steps, ["reconciliar"]);
  }
});
test("recibos malformados/divergentes nunca chegam ao Next nem ao registro", async () => {
  for (const r of [null, {}, { ...receipt(), operacaoId: "outro" },
    { ...receipt(), recibo: { ...receipt().recibo, debito: 2 } },
    { ...receipt(), recibo: { ...receipt().recibo, operacao_id: "outro" } },
    { ...receipt(), recibo: { ...receipt().recibo, resultado: [event, { ...event, revisao: -1 }] } }]) {
    const { steps, deps } = protocolDeps(() => r);
    assert.equal((await operations.consumirOperacaoCache({ ...deps, reconciliar: true })).estado, "reconciliacao_necessaria");
    assert.deepEqual(steps, ["reconciliar"]);
  }
});
test("falha apos recibo nao refaz RPC; modo legado preserva erros e estados anteriores", async () => {
  const { steps, deps } = protocolDeps(() => receipt());
  const r = await operations.consumirOperacaoCache({ ...deps, reconciliar: true, consumir: async () => { throw Error("Next indisponivel"); } });
  assert.equal(r.estado, "reconciliacao_necessaria"); assert.deepEqual(steps, ["reconciliar"]);
  await assert.rejects(operations.consumirOperacaoCache({ ...deps, chamar: async () => ({ estado: "legado" }),
    legado: async () => { throw Error("falha legada"); } }), /falha legada/);
});

test("route UUID usa sessao autenticada, nao service role; valida chave/acao e falha fechada", async () => {
  const calls = [];
  let lost = false;
  const route = load("../../app/api/admin/cache-capitulos/route.ts", {
    "next/server": { NextResponse: { json: (data, opts) => Response.json(data, opts) } },
    "next/cache": { revalidateTag: () => calls.push("tag"), revalidatePath: () => calls.push("path") },
    "@/lib/supabase/server": { supabaseServerConfigurado: true, criarSupabaseServerClient: async () => ({
      auth: { getUser: async () => ({ data: { user: { id } } }) },
      rpc: async (name, args) => {
        calls.push(["sessao", name, args]);
        if (name === "autorizar_consumidor_cache_capitulos") return { data: true };
        assert.deepEqual(Object.keys(args).sort(), ["p_acao", "p_id"]);
        assert.equal(args.p_id, id);
        if (lost) return { error: { code: "timeout" } };
        return { data: args.p_acao === "preparar" ? { estado: "admitida", operacaoId: id, nova: true } : receipt() };
      },
    }) },
    "@/lib/supabase/admin": { supabaseAdminConfigurado: true, criarSupabaseAdminClient: () => ({ rpc: async (name) => {
      assert.equal(name, "registrar_solicitacao_cache_capitulo"); calls.push("registro"); return { data: true };
    } }) },
    "@/lib/cache/obra-publica-cache-tag": tags,
    "@/lib/server/agendamento/solicitar-invalidacao-cache": consumer,
    "@/lib/server/agendamento/consumir-operacao-cache": operations,
  });
  const req = (key = id, action) => ({ headers: new Headers({ origin: "http://localhost", host: "localhost",
    "Idempotency-Key": key, ...action ? { "X-Cache-Operation": action } : {} }), nextUrl: new URL("http://localhost/api/admin/cache-capitulos") });
  assert.equal((await route.POST(req("invalido"))).status, 400);
  assert.equal((await route.POST(req(id, "retomar"))).status, 400);
  const response = await route.POST(req(id.toUpperCase()));
  assert.equal(response.status, 202); assert.equal((await response.json()).operacaoId, id);
  assert.equal(calls.filter(c => c === "registro").length, 1);
  lost = true; calls.length = 0;
  const failed = await route.POST(req());
  assert.equal(failed.status, 503); assert.equal((await failed.json()).estado, "reconciliacao_necessaria");
  assert.equal(calls.filter(Array.isArray).length, 2); assert.ok(!calls.includes("tag"));
});
