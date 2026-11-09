import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function load(path, mocks = {}) {
  const js = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", js)((id) => {
    if (id in mocks) return mocks[id];
    throw new Error(`Import não mockado: ${id}`);
  }, mod, mod.exports);
  return mod.exports;
}
const snapshot = load("../../app/ler-capitulo/lib/ler-capitulo-public-snapshot.ts");
const auth = load("../../app/ler-capitulo/lib/ler-capitulo-auth-identity.ts");
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const tick = () => new Promise((r) => setImmediate(r));
const chapter = (n) => ({ id: `cap-${n}`, ordem: n, titulo: `Capítulo ${n}`, texto: `Texto ${n}`, publicado: true, lido: false, lidoEm: "", curtiu: false, salvo: false, comentario: "" });
const work = () => ({ id: "obra", slug: "obra", titulo: "Obra", autorId: "autor", publicado: true,
  capitulos: [chapter(1), chapter(2)], ultimoCapituloLidoId: "", ultimaLeituraEm: "", progressoLeitura: 0 });
const version = () => ({ obraId: "obra", geracao: "geracao-1", revisao: "1", slug: "obra", numeroCapitulo: 1 });
const available = (revisao = "1", numero = 1) => ({ ...version(), estado: "disponivel", revisao, capituloId: `cap-${numero}`, numeroCapitulo: numero, obra: work() });
const unchanged = (numero = 1) => ({ ...version(), estado: "inalterada", capituloId: `cap-${numero}`, numeroCapitulo: numero });

async function harness(run, { user = "", localFalha = false } = {}) {
  const previous = { window: globalThis.window, document: globalThis.document, fetch: globalThis.fetch };
  const win = new EventTarget(), doc = new EventTarget(), frames = new Map();
  win.location = { pathname: "/obra/obra/capitulo/1", search: "?obraId=atacante&capituloId=atacante" };
  win.requestAnimationFrame = (fn) => { const id = Math.random(); frames.set(id, fn); return id; };
  win.cancelAnimationFrame = (id) => frames.delete(id);
  doc.visibilityState = "visible";
  globalThis.window = win; globalThis.document = doc;
  const calls = [], fetches = [], privateCalls = [];
  globalThis.fetch = async (url, options) => {
    const d = deferred(); fetches.push(d); calls.push({ url, options }); return d.promise;
  };
  let slots = [], index = 0, dirty = true, pending = [], result;
  const props = { projecao: version(), obras: [work()], obraId: "obra", capituloId: "cap-1",
    autenticacaoCarregada: true, usuarioIdLogado: user,
    identidadeAutenticadaLeitorRef: { current: { usuarioId: user, versao: 0 } }, versaoCarregamento: 0 };
  for (const [setter, field] of [["setObras", "obras"], ["setObraId", "obraId"], ["setCapituloId", "capituloId"],
    ["setCarregando", "carregando"], ["setErroCarregamento", "erro"]]) {
    props[setter] = value => { const next = typeof value === "function" ? value(props[field]) : value;
      if (!Object.is(next, props[field])) { props[field] = next; dirty = true; } };
  }
  const react = {
    useState(initial) {
      const i = index++;
      if (!slots[i]) slots[i] = { value: typeof initial === "function" ? initial() : initial };
      return [slots[i].value, value => { const next = typeof value === "function" ? value(slots[i].value) : value;
        if (!Object.is(next, slots[i].value)) { slots[i].value = next; dirty = true; } }];
    },
    useRef(initial) { const i = index++; slots[i] ||= { current: initial }; return slots[i]; },
    useEffectEvent(fn) { const i = index++; slots[i] ||= { wrapper: (...args) => slots[i].fn(...args) }; slots[i].fn = fn; return slots[i].wrapper; },
    useEffect(fn, deps) {
      const i = index++, prior = slots[i];
      if (!prior || deps.some((v, n) => !Object.is(v, prior.deps[n]))) {
        slots[i] = { deps, cleanup: prior?.cleanup };
        pending.push(() => { slots[i].cleanup?.(); slots[i].cleanup = fn(); });
      }
    },
  };
  const hook = load("../../app/ler-capitulo/hooks/use-ler-capitulo-public-load.ts", {
    react, "next/navigation": { usePathname: () => win.location.pathname },
    "../lib/ler-capitulo-auth-identity": auth,
    "../lib/ler-capitulo-public-snapshot": snapshot,
    "../lib/ler-capitulo-local-storage": { carregarObrasLocaisNormalizadas: () => { if (localFalha) throw new Error("cache corrompido"); return []; } },
    "../lib/ler-capitulo-public-personal-storage": { persistirEstadoPessoalLeituraPublica() {} },
    "../lib/ler-capitulo-work-read-loader": { aplicarInteracoesCapitulosSupabase: async (obra, id) => {
      const d = deferred(); privateCalls.push({ id, obra, ...d }); return d.promise;
    } },
  }).useLerCapituloPublicLoad;
  async function flush() {
    for (let i = 0; i < 12; i++) {
      if (dirty) { dirty = false; index = 0; result = hook(props); const effects = pending; pending = []; effects.forEach(fn => fn()); }
      for (const [id, fn] of frames) { frames.delete(id); fn(); }
      await tick();
      if (!dirty) break;
    }
    assert.equal(dirty, false, "lifecycle não deve entrar em loop");
  }
  async function respond(value, n = fetches.length - 1) { fetches[n].resolve({ ok: true, json: async () => value }); await flush(); }
  async function returnToTab() {
    win.dispatchEvent(new Event("blur")); win.dispatchEvent(new Event("focus")); doc.dispatchEvent(new Event("visibilitychange"));
    for (const [id, fn] of frames) { frames.delete(id); fn(); }
    await flush();
  }
  function identity(id) {
    props.usuarioIdLogado = id;
    props.identidadeAutenticadaLeitorRef.current = { usuarioId: id, versao: props.identidadeAutenticadaLeitorRef.current.versao + 1 };
    props.obras = props.obras.map(o => ({ ...o, capitulos: o.capitulos.map(c => ({ ...c, lido: false, salvo: false, curtiu: false })) }));
    dirty = true;
  }
  try {
    await flush();
    await run({ props, calls, fetches, privateCalls, flush, respond, returnToTab, identity,
      result: () => result, change: () => { dirty = true; }, win, frames });
  } finally {
    for (const slot of slots) slot?.cleanup?.();
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
  }
}

test("hidratação confirma rota canônica, ignora query e não refaz conteúdo legado", async () => {
  await harness(async h => {
    assert.equal(h.calls.length, 1);
    assert.ok(h.calls[0].url.includes("slug=obra&numero=1"));
    assert.ok(!h.calls[0].url.includes("atacante"));
    assert.equal(h.calls[0].options.cache, "no-store");
    assert.equal(h.calls[0].options.credentials, "same-origin", "não remover cookies da proteção do deployment");
    const original = h.props.obras[0];
    await h.respond(unchanged());
    assert.equal(h.props.obras[0], original);
    assert.equal(h.result().identidadeDadosAplicada.usuarioId, "");
  });
});

test("foco/visibilidade simultâneos agrupam; revisão igual não refaz métricas privadas", async () => {
  await harness(async h => {
    await h.respond(unchanged());
    const original = h.props.obras[0], identity = h.result().identidadeDadosAplicada;
    await h.returnToTab();
    h.win.dispatchEvent(new Event("focus"));
    await h.flush();
    assert.equal(h.calls.length, 2);
    await h.respond(unchanged());
    assert.equal(h.props.obras[0], original);
    assert.equal(h.result().identidadeDadosAplicada, identity);
    assert.equal(h.privateCalls.length, 0);
  });
});

test("retorno/BFCache não reutilizam pedido iniciado antes de sair, mesmo com URL idêntica", async () => {
  await harness(async h => {
    await h.returnToTab();
    assert.equal(h.calls.length, 2, "retorno precisa de leitura iniciada depois do evento");
    const event = new Event("pageshow"); event.persisted = true; h.win.dispatchEvent(event);
    for (const [id, fn] of h.frames) { h.frames.delete(id); fn(); }
    await h.flush(); assert.equal(h.calls.length, 3);
    const current = available("3"); current.obra.capitulos[0].texto = "Atual após retorno";
    await h.respond(current, 2);
    await h.respond(available("2"), 1); await h.respond(available("1"), 0);
    assert.equal(h.props.obras[0].capitulos[0].texto, "Atual após retorno");
    assert.equal(h.props.erro, false);
  });
});

test("refresh RSC com novo objeto da mesma projeção não duplica a hidratação", async () => {
  await harness(async h => {
    await h.respond(unchanged());
    h.props.projecao = { ...h.props.projecao }; h.change(); await h.flush();
    assert.equal(h.calls.length, 1);
    h.props.projecao = { ...h.props.projecao, revisao: "2" }; h.change(); await h.flush();
    assert.equal(h.calls.length, 2);
    await h.respond(available("2"));
  });
});

test("edição atualiza conteúdo sem perder interações recentes, nem repetir consulta privada", async () => {
  await harness(async h => {
    await h.respond(unchanged());
    h.privateCalls[0].resolve({ ...work(), capitulos: [{ ...chapter(1), lido: true }, chapter(2)] }); await h.flush();
    await h.returnToTab();
    h.props.obras[0].capitulos[0].salvo = true;
    const next = available("2"); next.obra.capitulos[0].texto = "Texto editado";
    await h.respond(next);
    assert.equal(h.props.obras[0].capitulos[0].texto, "Texto editado");
    assert.equal(h.props.obras[0].capitulos[0].lido, true);
    assert.equal(h.props.obras[0].capitulos[0].salvo, true);
    assert.equal(h.privateCalls.length, 1);
  }, { user: "A" });
});

test("interações atrasadas não substituem conteúdo revisado; geração nova não herda estado pessoal", async () => {
  await harness(async h => {
    await h.respond(unchanged()); await h.returnToTab();
    const edited = available("2"); edited.obra.capitulos[0].texto = "Revisão confirmada";
    await h.respond(edited);
    const personal = work(); personal.capitulos[0].lido = true;
    h.privateCalls[0].resolve(personal); await h.flush();
    assert.equal(h.props.obras[0].capitulos[0].texto, "Revisão confirmada");
    assert.equal(h.props.obras[0].capitulos[0].lido, true);
    await h.returnToTab(); const recreated = available("3"); recreated.geracao = "geracao-2";
    await h.respond(recreated);
    assert.equal(h.props.obras[0].capitulos[0].lido, false);
    assert.equal(h.privateCalls.length, 2);
    h.privateCalls[1].resolve(work()); await h.flush();
  }, { user: "A" });
});

test("cache pessoal corrompido não bloqueia confirmação pública e interações remotas", async () => {
  await harness(async h => {
    await h.respond(unchanged());
    assert.equal(h.privateCalls.length, 1);
    h.privateCalls[0].resolve(work()); await h.flush();
    assert.equal(h.result().identidadeDadosAplicada.usuarioId, "A");
    assert.equal(h.props.erro, false);
  }, { user: "A", localFalha: true });
});

test("persistência canônica não apaga drafts, texto local ou obras da biblioteca do autor", () => {
  const local = work(), outra = { ...work(), id: "outra" };
  local.titulo = "Título editado localmente";
  local.capitulos[0].texto = "Edição local não publicada";
  local.capitulos.push({ ...chapter(3), publicado: false, texto: "Rascunho privado" });
  let saved;
  const storage = load("../../app/ler-capitulo/lib/ler-capitulo-public-personal-storage.ts", {
    "./ler-capitulo-local-storage": {
      carregarObrasLocaisNormalizadas: id => { assert.equal(id, "A"); return [local, outra]; },
      salvarObrasPreservandoContas: (obras, id) => { assert.equal(id, "A"); saved = obras; },
    },
    "./ler-capitulo-public-snapshot": snapshot,
  });
  const updated = work(); updated.capitulos[0].lido = true;
  storage.persistirEstadoPessoalLeituraPublica([updated], "A");
  assert.equal(saved[0].titulo, local.titulo);
  assert.equal(saved[0].capitulos[0].texto, local.capitulos[0].texto);
  assert.equal(saved[0].capitulos[0].lido, true);
  assert.equal(saved[0].capitulos[2].texto, "Rascunho privado");
  assert.equal(saved[1], outra);
});

test("ausência confirmada remove conteúdo; publicação posterior permite nova leitura", async () => {
  await harness(async h => {
    await h.respond(unchanged()); await h.returnToTab(); await h.respond({ estado: "ausente" });
    assert.deepEqual(h.props.obras, []); assert.equal(h.result().identidadeDadosAplicada, null);
    await h.returnToTab(); await h.respond(available("3"));
    assert.equal(h.props.obras[0].id, "obra"); assert.equal(h.props.erro, false);
  });
});

test("falha não é ausência; retry novo descarta resposta antiga e revisão menor", async () => {
  await harness(async h => {
    h.fetches[0].reject(new Error("rede")); await h.flush();
    assert.equal(h.props.erro, true); assert.equal(h.props.obras.length, 1);
    assert.equal(h.result().identidadeDadosAplicada, null);
    h.props.versaoCarregamento++; h.change(); await h.flush();
    h.props.versaoCarregamento++; h.change(); await h.flush();
    await h.respond(available("3"), 2);
    await h.respond(available("2"), 1);
    assert.equal(h.props.erro, false);
    await h.returnToTab(); await h.respond(available("2"));
    assert.equal(h.props.erro, true, "revisão menor nunca substitui a atual");
  });
});

test("Back/Forward e resposta antiga: URL atual decide número, não IDs do histórico", async () => {
  await harness(async h => {
    h.win.location.pathname = "/obra/obra/capitulo/2"; h.props.capituloId = "cap-2";
    h.change(); await h.flush();
    await h.respond(unchanged(2), 1);
    await h.respond(available("1", 1), 0);
    assert.equal(h.props.capituloId, "cap-2");
    h.win.location.pathname = "/obra/obra/capitulo/1"; h.win.dispatchEvent(new Event("popstate"));
    h.change(); await h.flush(); assert.equal(h.calls.length, 3);
    const reorder = available("2", 1); reorder.capituloId = "cap-novo"; reorder.obra.capitulos[0].id = "cap-novo";
    await h.respond(reorder); assert.equal(h.props.capituloId, "cap-novo");
    assert.equal(h.result().aguardandoRota, false);
  });
});

test("troca rápida A/B/C e logout descartam confirmações e interações da identidade anterior", async () => {
  await harness(async h => {
    await h.respond(unchanged());
    h.identity("B"); await h.flush();
    h.identity("C"); await h.flush();
    await h.respond(unchanged(), 2);
    await h.respond(available("2"), 1);
    h.privateCalls[0].resolve({ ...work(), titulo: "privado A" });
    h.privateCalls[1].resolve(work()); await h.flush();
    assert.equal(h.result().identidadeDadosAplicada.usuarioId, "C");
    assert.equal(h.props.obras[0].titulo, "Obra");
    h.identity(""); await h.flush(); await h.respond(unchanged());
    assert.equal(h.result().identidadeDadosAplicada.usuarioId, "");
    assert.equal(h.privateCalls.length, 2);
  }, { user: "A" });
});

test("restauração BFCache revalida; cleanup invalida resposta e remove listeners", async () => {
  let pending;
  await harness(async h => {
    await h.respond(unchanged());
    h.win.dispatchEvent(new Event("blur"));
    const event = new Event("pageshow"); event.persisted = true; h.win.dispatchEvent(event);
    for (const [id, fn] of h.frames) { h.frames.delete(id); fn(); }
    await h.flush();
    h.win.dispatchEvent(new Event("focus")); await h.flush();
    assert.equal(h.calls.length, 2); pending = h.fetches[1];
  });
  pending.resolve({ ok: true, json: async () => available("9") }); await tick();
});

test("coordenador não guarda respostas: falha compartilhada e retry posterior fazem nova consulta", async () => {
  const c = snapshot.criarCoordenadorLeituraPublica(), d = deferred(); let reads = 0, errors = 0;
  const args = { chave: "A", carregar: () => { reads++; return d.promise; }, aplicar() {}, falhar: () => errors++ };
  const a = c.executar(args), b = c.executar(args); assert.equal(a, b);
  d.reject(new Error("rede")); await a; assert.equal(errors, 1); assert.equal(reads, 1);
  await c.executar({ ...args, carregar: async () => { reads++; return null; } }); assert.equal(reads, 2);
});

test("rota inválida e merge pessoal nunca recuperam texto privado ou capítulo removido", () => {
  assert.equal(snapshot.lerRotaPublicaLeitor("/obra/obra/capitulo/-1"), null);
  assert.equal(snapshot.lerRotaPublicaLeitor("/obra/%2f/capitulo/1"), null);
  const personal = work(); personal.capitulos.push({ ...chapter(3), texto: "draft secreto" });
  personal.capitulos[0].texto = "texto antigo";
  const result = snapshot.preservarEstadoPessoalLeitor(work(), personal);
  assert.equal(result.capitulos.length, 2); assert.equal(result.capitulos[0].texto, "Texto 1");
});

test("mutation/rollback pessoal atrasado não restaura texto antigo, capítulos excluídos ou desfaz outra interação", () => {
  const before = work(), mutation = structuredClone(before), current = structuredClone(before);
  mutation.capitulos[0].lido = true;
  current.capitulos[0].texto = "Revisão atual";
  current.capitulos[1].salvo = true;
  const result = snapshot.reconciliarMutacaoPessoalLeitor([current], [before], [mutation])[0];
  assert.equal(result.capitulos[0].texto, "Revisão atual");
  assert.equal(result.capitulos[0].lido, true);
  assert.equal(result.capitulos[1].salvo, true);
  const rollback = snapshot.reconciliarMutacaoPessoalLeitor([result], [mutation], [before])[0];
  assert.equal(rollback.capitulos[0].texto, "Revisão atual");
  assert.equal(rollback.capitulos[0].lido, false);
  assert.equal(rollback.capitulos[1].salvo, true);
  assert.deepEqual(snapshot.reconciliarMutacaoPessoalLeitor([], [before], [mutation]), []);
});

test("endpoint público: ausência, erro 503, no-store e payload inalterado sem textos", async () => {
  let value = available(), fail = false;
  const { GET } = load("../../app/api/leitura-publica/route.ts", {
    "../../../lib/cache/obrasPublicas": { obterLeituraCapituloPublico: async () => { if (fail) throw new Error("infra"); return value; } },
    "../../ler-capitulo/lib/ler-capitulo-public-snapshot": snapshot,
  });
  const url = "http://localhost/api/leitura-publica?slug=obra&numero=1";
  const response = await GET(new Request(`${url}&obraId=obra&geracao=geracao-1&revisao=1`));
  assert.equal((await response.json()).estado, "inalterada");
  for (const name of ["cache-control", "cdn-cache-control", "vercel-cdn-cache-control"]) assert.match(response.headers.get(name), /no-store/);
  const full = await GET(new Request(url));
  assert.equal(full.headers.get("content-length"), null);
  assert.equal((await full.json()).obra.capitulos[0].texto, "Texto 1");
  const withCookies = await GET(new Request(url, { headers: { cookie: "deployment_protection=fixture", authorization: "Bearer fixture" } }));
  assert.equal((await withCookies.json()).obra.capitulos[0].texto, "Texto 1");
  value = null; assert.equal((await (await GET(new Request(url))).json()).estado, "ausente");
  fail = true; const error = await GET(new Request(url)); assert.equal(error.status, 503);
  assert.equal((await error.json()).estado, undefined);
  assert.equal((await GET(new Request(url.replace("numero=1", "numero=-1")))).status, 400);
});
