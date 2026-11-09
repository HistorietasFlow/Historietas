import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function load(path, mocks = {}) {
  const js = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", js)(id => {
    if (id in mocks) return mocks[id]; throw new Error(`Import não mockado: ${id}`);
  }, mod, mod.exports);
  return mod.exports;
}
const coordinator = load("../../app/ler-capitulo/lib/ler-capitulo-public-snapshot.ts");
const auth = load("../../app/obra/[slug]/lib/obra-auth-identity.ts");
const utils = load("../../app/obra/[slug]/lib/obra-public-snapshot.ts", {
  "../../../../lib/historietasAdultContent": { normalizarAvisosConteudo18: () => [] },
});
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const snapshot = (revisao = "9007199254740993", slug = "obra") => ({ obraId: "work", geracao: "generation", revisao, slug,
  obra: { titulo: "Obra", autor: "Autor", autorId: "author", genero: "Fantasia", formato: "Romance", classificacaoIndicativa: "Livre", avisosConteudo: [], sinopse: "Sinopse", tags: ["tag"], capa: "/capa.png", capaNome: "", criadaEm: "" },
  anexo: null, capitulos: [2, 7].map(ordem => ({ id: `chapter-${ordem}`, ordem, titulo: `Capítulo ${ordem}`, href: `/obra/${slug}/capitulo/${ordem}` })) });
const available = s => ({ estado: "disponivel", snapshot: s });
const unchanged = s => ({ estado: "inalterada", obraId: s.obraId, geracao: s.geracao, revisao: s.revisao, slug: s.slug });

async function harness(run, user = "") {
  const previous = { window: globalThis.window, document: globalThis.document, fetch: globalThis.fetch };
  const win = new EventTarget(), doc = new EventTarget(), frames = new Map(), calls = [], privateCalls = [];
  win.location = { pathname: "/obra/obra", search: "?slug=intruso" }; win.scrollY = 600;
  win.scrollTo = options => { win.scrollY = options.top; };
  win.requestAnimationFrame = fn => { const id = Math.random(); frames.set(id, fn); return id; };
  win.cancelAnimationFrame = id => frames.delete(id); doc.visibilityState = "visible";
  globalThis.window = win; globalThis.document = doc;
  globalThis.fetch = (url, options) => { const d = deferred(); calls.push({ ...d, url, options }); return d.promise; };
  let slots = [], index = 0, dirty = true, pending = [], result;
  const same = (a, b) => a && b && a.length === b.length && a.every((v, n) => Object.is(v, b[n]));
  const react = {
    useState(initial) { const i = index++; slots[i] ||= { value: typeof initial === "function" ? initial() : initial };
      return [slots[i].value, value => { const next = typeof value === "function" ? value(slots[i].value) : value;
        if (!Object.is(next, slots[i].value)) { slots[i].value = next; dirty = true; } }]; },
    useRef(initial) { const i = index++; slots[i] ||= { current: initial }; return slots[i]; },
    useMemo(fn, deps) { const i = index++; if (!slots[i] || !same(slots[i].deps, deps)) slots[i] = { value: fn(), deps }; return slots[i].value; },
    useEffectEvent(fn) { const i = index++; slots[i] ||= { wrapper: (...args) => slots[i].fn(...args) }; slots[i].fn = fn; return slots[i].wrapper; },
    useEffect(fn, deps) { const i = index++, old = slots[i]; if (!old || !same(old.deps, deps)) {
      slots[i] = { deps, cleanup: old?.cleanup }; pending.push(() => { slots[i].cleanup?.(); slots[i].cleanup = fn(); }); } },
  };
  const props = { inicial: snapshot(), autenticacaoCarregada: true, usuarioIdLogado: user, versaoIdentidade: 0, identidadeRef: { current: { usuarioId: user, versao: 0 } } };
  const hook = load("../../app/obra/[slug]/hooks/use-obra-public-snapshot.ts", { react,
    "next/navigation": { usePathname: () => win.location.pathname },
    "../../../ler-capitulo/lib/ler-capitulo-public-snapshot": coordinator,
    "../lib/obra-auth-identity": auth, "../lib/obra-public-snapshot": utils,
    "../lib/obra-public-reading-progress": { carregarProgressoObraPublica: async (work, user) => {
      if (!user) return []; const d = deferred(); privateCalls.push({ ...d, work, user }); return d.promise;
    } },
  }).useObraPublicSnapshot;
  async function flush() {
    for (let n = 0; n < 12; n++) {
      if (dirty) { dirty = false; index = 0; result = hook(props); const effects = pending; pending = []; effects.forEach(fn => fn()); }
      for (const [id, fn] of frames) { frames.delete(id); fn(); }
      await new Promise(r => setImmediate(r));
      if (!dirty) break;
    }
    assert.equal(dirty, false, "Sem loop de efeitos");
  }
  const respond = async (body, n = calls.length - 1) => { calls[n].resolve({ ok: true, json: async () => body }); await flush(); };
  const rerender = async () => { props.versaoIdentidade = props.identidadeRef.current.versao; dirty = true; await flush(); };
  const focus = async () => { win.dispatchEvent(new Event("focus")); doc.dispatchEvent(new Event("visibilitychange")); await flush(); };
  try { await flush(); await run({ props, win, doc, calls, privateCalls, flush, respond, rerender, focus, get result() { return result; } }); }
  finally { slots.forEach(s => s?.cleanup?.()); Object.assign(globalThis, previous); }
}

test("SSR já tem conteúdo e ordens reais; hidratação confirma sem consultar backup local", async () => harness(async h => {
  const original = h.result.obra;
  assert.deepEqual(original.capitulos.map(c => c.href), ["/obra/obra/capitulo/2", "/obra/obra/capitulo/7"]);
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0].options.cache, "no-store"); assert.equal(h.calls[0].options.credentials, "same-origin");
  assert.equal(new URL(h.calls[0].url, "http://localhost").searchParams.get("slug"), "obra");
  await h.respond(unchanged(h.props.inicial)); assert.equal(h.result.obra, original); assert.equal(h.result.pronta, true);
  await h.focus(); assert.equal(h.calls.length, 2); await h.respond(unchanged(h.props.inicial)); assert.equal(h.result.obra, original);
  assert.equal(h.privateCalls.length, 0);
}));
test("edição/publicação/remoção não recuperam sinopse, capa, tags nem capítulos do objeto anterior", async () => harness(async h => {
  await h.respond(unchanged(h.props.inicial)); await h.focus();
  const next = snapshot("9007199254740994"); Object.assign(next.obra, { sinopse: "", capa: "", tags: [] }); next.capitulos = [];
  await h.respond(available(next)); assert.equal(h.result.obra.sinopse, ""); assert.equal(h.result.obra.capa, "");
  assert.deepEqual(h.result.obra.tags, []); assert.deepEqual(h.result.obra.capitulos, []); assert.equal(h.result.obra.id, "work");
}));
test("ausência confirmada remove conteúdo; retry pode encontrar uma nova geração no mesmo slug", async () => harness(async h => {
  await h.respond({ estado: "ausente" }); assert.equal(h.result.obra, null); assert.equal(h.result.erro, false); assert.equal(h.result.carregando, false);
  h.result.tentarNovamente(); await h.flush();
  const next = { ...snapshot("9007199254740998"), geracao: "recreated" }; await h.respond(available(next)); assert.equal(h.result.obra.id, "work");
}));
test("erro temporário oculta conteúdo, retry não faz reload e restaura scroll", async () => harness(async h => {
  h.calls[0].reject(new Error("rede")); await h.flush(); assert.equal(h.result.erro, true); assert.equal(h.result.obra, null);
  h.win.scrollY = 0; h.result.tentarNovamente(); await h.flush(); await h.respond(unchanged(h.props.inicial));
  assert.equal(h.result.erro, false); assert.equal(h.result.obra.titulo, "Obra"); assert.equal(h.win.scrollY, 600);
}));
test("eventos agrupados, BFCache e popstate invalidam respostas iniciadas antes do evento", async () => harness(async h => {
  await h.focus(); assert.equal(h.calls.length, 2);
  await h.respond(available(snapshot("9007199254740994")), 1);
  await h.respond(available(snapshot()), 0); assert.equal(h.result.obra.titulo, "Obra"); assert.equal(h.result.erro, false);
  const event = new Event("pageshow"); Object.defineProperty(event, "persisted", { value: true }); h.win.dispatchEvent(event);
  h.win.dispatchEvent(new Event("popstate")); await h.flush(); assert.equal(h.calls.length, 3);
}));
test("troca de rota/rename e resposta antiga não aplicam conteúdo do slug anterior", async () => harness(async h => {
  h.win.location.pathname = "/obra/renomeada"; await h.rerender(); assert.equal(h.result.obra, null);
  assert.equal(h.result.carregando, true);
  await h.respond(available(snapshot()), 0); assert.equal(h.result.obra, null);
  const next = snapshot("9007199254740994", "renomeada"); await h.respond(available(next));
  assert.equal(h.result.obra.slug, "renomeada"); assert.equal(h.result.obra.capitulos[1].href, "/obra/renomeada/capitulo/7");
  assert.equal(h.result.carregando, false);
}));
test("login/logout/troca A→B→A descartam progresso e respostas de identidades anteriores", async () => harness(async h => {
  await h.respond(unchanged(h.props.inicial)); assert.equal(h.privateCalls.length, 1);
  assert.equal(h.result.pronta, true); assert.equal(h.result.interativa, false);
  const original = h.result.obra;
  h.props.identidadeRef.current = { usuarioId: "B", versao: 1 }; h.props.usuarioIdLogado = "B"; await h.rerender();
  assert.equal(h.result.pronta, false); await h.respond(unchanged(h.props.inicial));
  h.privateCalls[0].resolve([{ capitulo_id: "chapter-2", lido_em: "2026-11-09" }]); await h.flush();
  assert.equal(h.result.leitura.progressoLeitura, 0); assert.equal(h.result.obra, original);
  h.props.identidadeRef.current = { usuarioId: "A", versao: 2 }; h.props.usuarioIdLogado = "A"; await h.rerender();
  await h.respond(unchanged(h.props.inicial)); h.privateCalls[2].resolve([{ capitulo_id: "chapter-7", lido_em: "2026-11-09" }]); await h.flush();
  assert.equal(h.result.interativa, true);
  assert.equal(h.result.leitura.ultimoCapituloLidoId, "chapter-7");
  h.props.identidadeRef.current = { usuarioId: "", versao: 3 }; h.props.usuarioIdLogado = ""; await h.rerender();
  assert.equal(h.result.leitura.progressoLeitura, 0); await h.respond(unchanged(h.props.inicial));
  assert.equal(h.result.leitura.progressoLeitura, 0);
}, "A"));

test("falha pessoal não bloqueia a página indefinidamente nem usa progresso de outra conta; evento permite retry", async () => harness(async h => {
  await h.respond(unchanged(h.props.inicial)); assert.equal(h.result.interativa, false);
  h.privateCalls[0].reject(new Error("indisponível")); await h.flush();
  assert.equal(h.result.interativa, true); assert.equal(h.result.leitura.progressoLeitura, 0);
  await h.focus(); await h.respond(unchanged(h.props.inicial));
  h.privateCalls[1].resolve([{ capitulo_id: "chapter-2", lido_em: "2026-11-09" }]); await h.flush();
  assert.equal(h.result.leitura.progressoLeitura, 50);
}, "A"));
test("revisão menor é recusada; novo objeto RSC da mesma versão não repete hidratação", async () => harness(async h => {
  await h.respond(unchanged(h.props.inicial)); h.props.inicial = structuredClone(h.props.inicial); await h.rerender(); assert.equal(h.calls.length, 1);
  await h.focus(); await h.respond(available(snapshot("1"))); assert.equal(h.result.erro, true);
}));
test("anexo só adapta metadados e progresso só aplica IDs presentes, nunca ressuscita capítulos", () => {
  const s = snapshot(); s.anexo = { nome: "Legado.pdf", tipo: "application/pdf", tamanho: 123, categoria: "documento" };
  const obra = utils.snapshotParaObra(s); assert.equal(obra.arquivoObra.conteudo, "");
  s.anexo.tipo = null; assert.equal(utils.snapshotParaObra(s).arquivoObra.tipo, "application/pdf");
  assert.equal(obra.arquivoObra.criadoEm, s.obra.criadaEm);
  const result = utils.aplicarProgressoObra(obra, [{ capitulo_id: "removido", lido_em: "2026" }, { capitulo_id: "chapter-7", lido_em: "2026" }]);
  assert.equal(result.capitulos.length, 2); assert.equal(result.progressoLeitura, 50); assert.equal(result.ultimoCapituloLidoId, "chapter-7");
});

test("perfil público do autor anterior não altera nome, link ou propriedade da obra nova", () => {
  const old = { userId: "A", nome: "Autor anterior" }, current = { userId: "B", nome: "Autor atual" };
  assert.equal(utils.perfilDoAutorAtual(old, "B"), null);
  assert.equal(utils.perfilDoAutorAtual(current, "B"), current);
  assert.equal(utils.perfilDoAutorAtual(old, undefined), null);
});

test("guard real da página bloqueia ação pré-confirmação e invalida rota, contexto e identidade", () => {
  const file = ts.createSourceFile("page.tsx", readFileSync(new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let declaration;
  const visit = node => { if (ts.isFunctionDeclaration(node) && node.name?.text === "criarGuardIdentidadeAcao") declaration = node; ts.forEachChild(node, visit); };
  visit(file); assert.ok(declaration);
  const js = ts.transpileModule(declaration.getText(file), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const create = new Function("snapshotInicial", "publica", "criarGuardIdentidadeOriginal", "contextoAcaoRef", "window", `${js}; return criarGuardIdentidadeAcao;`);
  const state = { interativa: false, contexto: "work/generation" }, context = { current: state.contexto }, win = { location: { pathname: "/obra/obra" } };
  let identity = true;
  const pageGuard = create(snapshot(), state, () => () => identity, context, win);
  const pending = pageGuard({}); assert.equal(pending(), false);
  state.interativa = true; assert.equal(pending(), false); // Ação iniciada no contexto pendente não é retomada.
  const confirmed = pageGuard({}); assert.equal(confirmed(), true);
  win.location.pathname = "/obra/outra"; assert.equal(confirmed(), false);
  win.location.pathname = "/obra/obra"; context.current = "another/generation"; assert.equal(confirmed(), false);
  context.current = state.contexto; identity = false; assert.equal(confirmed(), false);
});

test("CSS SSR usa exatamente a geometria desktop existente, unidades válidas e o breakpoint atual", () => {
  const styles = load("../../app/obra/[slug]/lib/obra-style-utils.ts");
  const { obraSsrResponsiveCss: css } = load("../../app/obra/[slug]/lib/obra-ssr-responsive-css.ts", { "./obra-style-utils": styles });
  assert.ok(css.includes("@media (min-width: 1024px)"));
  assert.ok(css.includes(`width:${styles.desktopContainerStyle.width} !important`));
  assert.ok(css.includes(`min-height:${styles.desktopHeroContentStyle.minHeight} !important`));
  assert.ok(css.includes(`grid-template-columns:${styles.desktopHeroContentStyle.gridTemplateColumns} !important`));
  assert.doesNotMatch(css, /font-weight:\d+px|z-index:\d+px|undefined|NaN|\[object Object\]/);
  assert.match(css, /data-obra-desktop-only[^}]+display:none !important/);
  assert.match(css, /data-obra-mobile-author[^}]+display:none !important/);
  assert.ok(css.includes(':where([data-historietas-obra-dinamica-root="true"] [data-obra-responsive="title"])'));
});

test("resposta tardia da visualização da obra anterior não altera as métricas atuais", async () => {
  let cleanup, deps, registered = { current: "" }; const pending = [], updates = [];
  const hook = load("../../app/obra/[slug]/hooks/use-obra-view-registration.ts", {
    react: { useRef: () => registered, useEffect: (fn, next) => { if (!deps || !Object.is(deps[0], next[0])) { cleanup?.(); cleanup = fn(); deps = next; } } },
    "../../../../lib/utils": { idObraSupabaseValido: () => true },
    "../lib/obra-metric-utils": { incrementarVisualizacaoObraPublicaSupabase: () => { const d = deferred(); pending.push(d); return d.promise; } },
  }).useObraViewRegistration;
  const set = value => updates.push(value({ visualizacoes: 0 }));
  hook({ id: "A" }, "permitido", set); hook({ id: "B" }, "permitido", set);
  pending[0].resolve(100); await new Promise(r => setImmediate(r)); assert.equal(updates.length, 0);
  pending[1].resolve(5); await new Promise(r => setImmediate(r)); assert.deepEqual(updates, [{ visualizacoes: 5 }]); cleanup?.();
});

test("endpoint confirma snapshot antes de declarar inalterada; ausência e falha permanecem distintas/no-store", async () => {
  let value = snapshot(), calls = 0, error = false;
  const handler = load("../../app/api/obra-publica/route.ts", {
    "../../../lib/cache/obrasPublicas": { obterSnapshotObraPublica: async () => { calls++; if (error) throw new Error("infra"); return value; } },
    "../../obra/[slug]/lib/obra-public-snapshot": utils,
  });
  const query = new URLSearchParams({ slug: "obra", obraId: value.obraId, geracao: value.geracao, revisao: value.revisao });
  const request = () => new Request(`http://localhost/api/obra-publica?${query}`);
  const response = await handler.GET(request()); assert.equal((await response.json()).estado, "inalterada"); assert.equal(calls, 1);
  for (const header of ["cache-control", "cdn-cache-control", "vercel-cdn-cache-control"]) assert.match(response.headers.get(header), /no-store/);
  value = snapshot("9007199254740994"); assert.equal((await (await handler.GET(request())).json()).estado, "disponivel");
  value = null; assert.equal((await (await handler.GET(request())).json()).estado, "ausente");
  error = true; assert.equal((await handler.GET(request())).status, 503);
  assert.equal((await handler.GET(new Request("http://localhost/api/obra-publica?slug=%2F"))).status, 400);
});
