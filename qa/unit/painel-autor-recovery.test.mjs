import assert from "node:assert/strict";
import test from "node:test";
import { loadApplicationModule } from "../helpers/load-application-module.mjs";

const adiar = () => {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};
const tick = () => new Promise(resolve => setImmediate(resolve));
const arquivo = { nome: "rascunho.txt", conteudo: "texto preservado", tipo: "text/plain", categoria: "texto", tamanho: 16, criadoEm: "2026-01-01" };
const ambienteOriginal = { window: globalThis.window, localStorage: globalThis.localStorage, warn: console.warn };
const obra = (id, autorId = "A", extra = {}) => ({ id, autorId, titulo: id, slug: id, autor: autorId, publicado: false,
  capitulos: [{ id: `${id}-rascunho`, titulo: "Rascunho", texto: "texto local", publicado: false }], ...extra });
const remota = (id, user_id = "A", extra = {}) => ({ id, user_id, titulo: id, slug: id, autor: user_id, publicado: false, ...extra });

function preparar(t, inicial = {}) {
  const antes = ambienteOriginal;
  const storage = new Map(Object.entries(inicial)), gravacoes = [], chamadas = [], estado = {};
  globalThis.window = {};
  globalThis.localStorage = {
    getItem: chave => storage.get(chave) ?? null,
    setItem(chave, texto) { gravacoes.push([chave, texto]); storage.set(chave, texto); },
  };
  const warn = ambienteOriginal.warn; console.warn = () => {};
  t.after(() => { globalThis.window = antes.window; globalThis.localStorage = antes.localStorage; console.warn = warn; });
  const config = { usuario: "A", obras: new Map([["A", []], ["B", []]]), capitulos: [], falha: false,
    gates: new Map(), profileGates: new Map(), capitulosFalham: false, metricasCarregadas: true };
  const slots = []; let posicao, efeito, cleanup, depsEfeito;
  const iguais = (a, b) => a && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    useState(inicial) { const i = posicao++; if (!(i in slots)) slots[i] = inicial; return [slots[i], v => { slots[i] = v; }]; },
    useMemo(fn, deps) { const i = posicao++; if (!iguais(slots[i]?.deps, deps)) slots[i] = { deps, valor: fn() }; return slots[i].valor; },
    useEffect(fn, deps) { if (!iguais(depsEfeito, deps)) { efeito = fn; depsEfeito = deps; } },
  };
  const mocks = {
    react,
    "../../../lib/supabase/client": { supabase: { auth: { getUser: async () => {
      chamadas.push(["sessao", config.usuario]); return { data: { user: config.usuario ? { id: config.usuario } : null } };
    } } } },
    "../lib/painel-autor-profile-loader": { carregarProfilePainelAutor: async id => {
      await config.profileGates.get(id); return { nome: `Perfil ${id}` };
    } },
    "./painel-autor-profile-loader": { carregarProfilePainelAutor: async () => null },
    "./painel-autor-supabase-works-loader": { carregarObrasPainelAutorSupabase: async id => {
      chamadas.push(["obras", id]); const lista = structuredClone(config.obras.get(id) || []);
      const falha = config.falha; await config.gates.get(id);
      if (falha) throw new Error("falha remota"); return lista;
    } },
    "./painel-autor-supabase-chapters-loader": { carregarCapitulosPainelAutorSupabase: async (id, _ids, confirmar) => {
      chamadas.push(["capitulos", id]); if (config.capitulosFalham) return [];
      const lista = structuredClone(config.capitulos); confirmar(lista); return lista;
    } },
    "../../../lib/metricas": { carregarMetricasConteudos: async () => ({ carregado: config.metricasCarregadas, obras: new Map(), capitulos: new Map() }) },
    "./painel-autor-chapter-comments-loader": { carregarComentariosCapitulosUsuarioPainel: async () => new Map() },
  };
  const { usePainelAutorInitialData } = loadApplicationModule("app/painel-autor/hooks/use-painel-autor-initial-data.ts", mocks);
  const setters = {};
  for (const nome of ["Obras", "ObrasFavoritas", "ObrasConcluidas", "CarregandoDados"]) setters[`set${nome}`] = v => { estado[nome] = v; };
  let usuarioIdLogado = "A", verificandoUsuario = false;
  const render = (id = usuarioIdLogado, verificando = false) => {
    usuarioIdLogado = id; verificandoUsuario = verificando; posicao = 0;
    const resultado = Reflect.apply(usePainelAutorInitialData, null, [{ usuarioIdLogado, verificandoUsuario, ...setters }]);
    if (efeito) { cleanup?.(); const fn = efeito; efeito = null; cleanup = fn(); }
    return resultado;
  };
  return { config, storage, gravacoes, chamadas, estado, render, cleanup: () => cleanup?.(), mocks };
}

test("JSON local inválido não bloqueia carga remota nem é sobrescrito na recuperação", async t => {
  for (const texto of ["{inválido", "null", '{"obras":[]}', '[null,42]']) {
    const h = preparar(t, { "historietas-obras:A": texto }); h.config.obras.set("A", [remota("remota")]);
    h.render(); await tick();
    assert.deepEqual(h.chamadas.filter(c => c[0] === "obras"), [["obras", "A"]], texto);
    assert.deepEqual(h.estado.Obras.map(o => o.id), ["remota"], texto);
    assert.equal(h.estado.CarregandoDados, false);
    assert.equal(h.storage.get("historietas-obras:A"), texto);
    assert.deepEqual(h.gravacoes, [], "o conteúdo bruto inválido continua recuperável");
  }
});

test("registro/chapter inválido não esconde obras e rascunhos válidos da mesma lista", async t => {
  const local = obra("local", "A", { capitulos: [null, { id: "rascunho", texto: "preservar", publicado: false }] });
  const texto = JSON.stringify([null, local, obra("outra")]);
  const h = preparar(t, { "historietas-obras:A": texto }); h.render(); await tick();
  assert.deepEqual(h.estado.Obras.map(o => o.id), ["local", "outra"]);
  assert.equal(h.estado.Obras[0].capitulos.find(c => c.id === "rascunho").texto, "preservar");
  assert.equal(h.storage.get("historietas-obras:A"), texto);
});

test("falha remota preserva cache e backups byte a byte; nova carga recupera sem perder rascunhos", async t => {
  const texto = JSON.stringify([obra("local", "A", { arquivoObra: arquivo })]);
  const backup = JSON.stringify({ legado: arquivo, desconhecido: { dado: "não apagar" } });
  const h = preparar(t, { "historietas-obras:A": texto, "historietas-arquivos-obras-backup:A": backup });
  h.config.falha = true; h.render(); await tick();
  assert.equal(h.estado.Obras[0].arquivoObra.conteudo, arquivo.conteudo);
  assert.equal(h.storage.get("historietas-obras:A"), texto);
  assert.equal(h.storage.get("historietas-arquivos-obras-backup:A"), backup);
  assert.deepEqual(h.gravacoes, []);
  h.config.falha = false; h.config.obras.set("A", [remota("local")]);
  h.render("A", true); h.render("A"); await tick();
  assert.equal(h.estado.CarregandoDados, false);
  assert.equal(h.estado.Obras[0].capitulos[0].texto, "texto local");
  assert.equal(h.estado.Obras[0].arquivoObra.conteudo, arquivo.conteudo);
  assert.ok(h.gravacoes.some(([chave]) => chave === "historietas-obras:A"));
  assert.deepEqual(JSON.parse(h.storage.get("historietas-arquivos-obras-backup:A")).desconhecido, { dado: "não apagar" });
});

test("backup corrompido nunca é zerado pela leitura ou sincronização", t => {
  const h = preparar(t, { "historietas-arquivos-obras-backup:A": "{backup original" });
  const b = loadApplicationModule("app/painel-autor/lib/painel-autor-file-backup-storage.ts");
  assert.deepEqual(b.carregarBackupArquivosObras("A"), {});
  b.sincronizarBackupArquivosObras([obra("local", "A", { arquivoObra: arquivo })], "A");
  assert.equal(h.storage.get("historietas-arquivos-obras-backup:A"), "{backup original");
  assert.deepEqual(h.gravacoes, []);
});

test("sessão divergente não mistura obras de B nem persiste sob a chave A", async t => {
  const texto = JSON.stringify([obra("rascunho-A")]);
  const h = preparar(t, { "historietas-obras:A": texto });
  h.config.usuario = "B"; h.config.obras.set("B", [remota("privada-B", "B")]);
  h.render("A"); await tick();
  assert.deepEqual(h.estado.Obras.map(o => o.id), ["rascunho-A"]);
  assert.deepEqual(h.chamadas.filter(c => c[0] === "obras"), []);
  assert.deepEqual(h.gravacoes, []);
  assert.equal(h.storage.get("historietas-obras:A"), texto);
});

test("sessão ausente não substitui rascunhos e backups locais por vazio", async t => {
  const texto = JSON.stringify([obra("rascunho-A")]);
  const h = preparar(t, { "historietas-obras:A": texto }); h.config.usuario = "";
  h.render(); await tick();
  assert.deepEqual(h.estado.Obras.map(o => o.id), ["rascunho-A"]);
  assert.equal(h.storage.get("historietas-obras:A"), texto);
  assert.deepEqual(h.gravacoes, []);
});

test("cargas A/B fora de ordem descartam A; falha no storage de B não exibe A", async t => {
  const textoA = JSON.stringify([obra("A-local")]);
  const h = preparar(t, { "historietas-obras:A": textoA, "historietas-obras:B": "{inválido" });
  const gate = adiar(); h.config.gates.set("A", gate.promise);
  h.config.obras.set("A", [remota("A-remota")]); h.render(); await tick();
  h.config.usuario = "B"; h.config.obras.set("B", [remota("B-remota", "B")]);
  h.render("B"); await tick();
  assert.deepEqual(h.estado.Obras.map(o => o.id), ["B-remota"]);
  const gravacoes = [...h.gravacoes]; gate.resolve(); await tick();
  assert.deepEqual(h.estado.Obras.map(o => o.id), ["B-remota"]);
  assert.deepEqual(h.gravacoes, gravacoes);
  assert.equal(h.storage.get("historietas-obras:A"), textoA);
  assert.equal(h.estado.CarregandoDados, false);
});

test("cleanup durante perfil/carga remota não grava dados nem encerra loading da nova carga", async t => {
  const h = preparar(t); const gate = adiar(); h.config.profileGates.set("A", gate.promise);
  h.render(); await tick(); h.cleanup(); gate.resolve(); await tick();
  assert.deepEqual(h.gravacoes, []);
  assert.deepEqual(h.chamadas, [], "não inicia carga remota depois do cleanup do perfil");
});

test("capítulos sem confirmação não autorizam regravar cache nem certificar rascunhos", async t => {
  const texto = JSON.stringify([obra("local")]);
  const h = preparar(t, { "historietas-obras:A": texto });
  h.config.capitulosFalham = true; h.config.obras.set("A", [remota("local")]);
  h.render(); await tick();
  assert.equal(h.estado.Obras[0].capitulos[0].texto, "texto local");
  assert.equal(h.render(), undefined);
  assert.deepEqual(h.gravacoes, []);
});

test("IDs distintos com mesmo slug não substituem obras ou cruzam rascunhos", async t => {
  const local = obra("local", "A", { slug: "igual", arquivoObra: arquivo });
  const h = preparar(t, { "historietas-obras:A": JSON.stringify([local]) });
  h.config.obras.set("A", [remota("remota", "A", { slug: "igual" })]); h.render(); await tick();
  assert.deepEqual(new Set(h.estado.Obras.map(o => o.id)), new Set(["local", "remota"]));
  const r = h.estado.Obras.find(o => o.id === "remota"); assert.deepEqual(r.capitulos, []); assert.equal(r.arquivoObra, null);
  assert.equal(h.estado.Obras.find(o => o.id === "local").capitulos[0].texto, "texto local");
});

test("cópias locais do mesmo ID preservam capítulos únicos e arquivo sem duplicar cards", async t => {
  const um = obra("mesma", "A", { arquivoObra: arquivo });
  const dois = obra("mesma", "A", { capitulos: [{ id: "outro-rascunho", texto: "outro texto", publicado: false }] });
  const texto = JSON.stringify([um, dois]);
  const h = preparar(t, { "historietas-obras:A": texto }); h.config.obras.set("A", [remota("mesma")]);
  h.render(); await tick();
  assert.equal(h.estado.Obras.length, 1);
  assert.deepEqual(new Set(h.estado.Obras[0].capitulos.map(c => c.id)), new Set(["mesma-rascunho", "outro-rascunho"]));
  assert.equal(h.estado.Obras[0].arquivoObra.conteudo, arquivo.conteudo);
  assert.equal(h.storage.get("historietas-obras:A"), texto, "não descarta cópias locais conflitantes do storage");
});

test("obra de outro autor não remove obra própria antes da validação de autoria", () => {
  const { mesclarResultadoSupabasePainelAutor } = loadApplicationModule("app/painel-autor/lib/painel-autor-supabase-result-merge.ts");
  const local = obra("mesma", "A");
  const resultado = mesclarResultadoSupabasePainelAutor({ obrasLocaisUsuario: [local], obrasSupabase: [obra("mesma", "B")], userId: "A",
    nomeProfileAutor: "", obrasFavoritasUsuario: ["mesma", "mesma"], obrasConcluidasUsuario: [], favoritosSupabase: new Set(), concluidasSupabase: new Set() });
  assert.deepEqual(resultado.obras, [local]); assert.deepEqual(resultado.favoritas, ["mesma"]);
});

test("cache editado durante rede pendente não é substituído; próxima carga recupera o novo rascunho", async t => {
  const h = preparar(t, { "historietas-obras:A": JSON.stringify([obra("primeira")]) });
  const gate = adiar(); h.config.gates.set("A", gate.promise); h.config.obras.set("A", [remota("primeira")]);
  h.render(); await tick();
  const atual = JSON.stringify([obra("primeira"), obra("novo-rascunho")]); h.storage.set("historietas-obras:A", atual);
  gate.resolve(); await tick();
  assert.equal(h.storage.get("historietas-obras:A"), atual); assert.deepEqual(h.gravacoes, []);
  assert.ok(h.estado.Obras.some(o => o.id === "novo-rascunho"), "o snapshot antigo não esconde a edição concorrente");
  h.render("A", true); h.render("A"); await tick();
  assert.deepEqual(new Set(h.estado.Obras.map(o => o.id)), new Set(["primeira", "novo-rascunho"]));
  assert.equal(h.estado.Obras.find(o => o.id === "novo-rascunho").capitulos[0].texto, "texto local");
});

test("storage negado continua carga remota sem escrever sobre dados que não puderam ser lidos", async t => {
  const h = preparar(t); h.config.obras.set("A", [remota("remota")]);
  globalThis.localStorage.getItem = () => { throw new Error("acesso negado"); };
  h.render(); await tick();
  assert.deepEqual(h.estado.Obras.map(o => o.id), ["remota"]);
  assert.equal(h.estado.CarregandoDados, false); assert.deepEqual(h.gravacoes, []);
});

test("coleções inválidas e registros de outra autoria permanecem intactos no storage", async t => {
  const texto = JSON.stringify([obra("propria"), obra("terceiro", "B")]);
  const h = preparar(t, { "historietas-obras:A": texto, "historietas-obras-favoritas:A": "{original" });
  h.config.obras.set("A", [remota("propria")]); h.render(); await tick();
  assert.deepEqual(h.estado.Obras.map(o => o.id), ["propria"]);
  assert.equal(h.storage.get("historietas-obras:A"), texto);
  assert.equal(h.storage.get("historietas-obras-favoritas:A"), "{original");
  assert.deepEqual(h.gravacoes, []);
});

test("cópia de outra autoria no mesmo cache não sobrescreve a própria antes da deduplicação", async t => {
  const texto = JSON.stringify([obra("mesma", "A"), obra("mesma", "B")]);
  const h = preparar(t, { "historietas-obras:A": texto }); h.render(); await tick();
  assert.equal(h.estado.Obras.length, 1); assert.equal(h.estado.Obras[0].autorId, "A");
  assert.equal(h.estado.Obras[0].capitulos[0].texto, "texto local");
  assert.equal(h.storage.get("historietas-obras:A"), texto); assert.deepEqual(h.gravacoes, []);
});

test("métricas indisponíveis não autorizam substituir os dados já persistidos", async t => {
  const texto = JSON.stringify([obra("local", "A", { totalCurtidasPainel: 13 })]);
  const h = preparar(t, { "historietas-obras:A": texto });
  h.config.obras.set("A", [remota("local")]); h.config.metricasCarregadas = false;
  h.render(); await tick();
  assert.equal(h.storage.get("historietas-obras:A"), texto); assert.deepEqual(h.gravacoes, []);
  assert.equal(h.estado.Obras[0].capitulos[0].texto, "texto local");
});

test("resposta de A durante a carga de B não muda dados, storage nem o loading de B", async t => {
  const h = preparar(t, { "historietas-obras:A": JSON.stringify([obra("A")]),
    "historietas-obras:B": JSON.stringify([obra("B", "B")]) });
  const a = adiar(), b = adiar(); h.config.gates.set("A", a.promise); h.config.gates.set("B", b.promise);
  h.config.obras.set("A", [remota("A-remota")]); h.config.obras.set("B", [remota("B-remota", "B")]);
  h.render(); await tick(); h.config.usuario = "B"; h.render("B"); await tick();
  a.resolve(); await tick();
  assert.equal(h.estado.CarregandoDados, true); assert.deepEqual(h.estado.Obras.map(o => o.id), ["B"]);
  assert.deepEqual(h.gravacoes, []);
  b.resolve(); await tick();
  assert.equal(h.estado.CarregandoDados, false);
  assert.deepEqual(new Set(h.estado.Obras.map(o => o.id)), new Set(["B", "B-remota"]));
  assert.ok(h.gravacoes.every(([chave]) => chave.endsWith(":B")));
});

test("sincronização de leitura acrescenta chaves sem substituir arquivo já preservado", t => {
  const anterior = { ...arquivo, conteudo: "versão preservada" };
  const h = preparar(t, { "historietas-arquivos-obras-backup:A": JSON.stringify({ "id:local": anterior }) });
  const { sincronizarBackupArquivosObras } = loadApplicationModule("app/painel-autor/lib/painel-autor-file-backup-storage.ts");
  sincronizarBackupArquivosObras([obra("local", "A", { arquivoObra: arquivo })], "A");
  const backup = JSON.parse(h.storage.get("historietas-arquivos-obras-backup:A"));
  assert.deepEqual(backup["id:local"], anterior);
  assert.equal(backup["slug:local"].conteudo, arquivo.conteudo);
});
