import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

function carregar(caminho, mocks = {}) {
  const cache = new Map();
  function modulo(url) {
    if (cache.has(url.href)) return cache.get(url.href);
    const exports = {};
    cache.set(url.href, exports);
    const js = typescript.transpileModule(readFileSync(url, "utf8"), {
      compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2022 },
    }).outputText;
    new Function("require", "exports", js)((nome) => {
      if (Object.hasOwn(mocks, nome)) return mocks[nome];
      assert.ok(nome.startsWith("."), nome);
      const destino = [".ts", ".mjs"].map(ext => new URL(nome + ext, url)).find(existsSync);
      assert.ok(destino, nome);
      return modulo(destino);
    }, exports);
    return exports;
  }
  return modulo(new URL(`../../app/painel-autor/${caminho}`, import.meta.url));
}
const { confirmarRascunhosPainel } = carregar("lib/painel-autor-draft-chapters.ts");
const obras = [{ id: "obra", user_id: "A", publicado: true }];
const capitulo = (id, publicado, extra = {}) => ({ id, obra_id: "obra", user_id: "A", titulo: id, publicado, ...extra });

test("rascunhos explícitos: nenhum, um, vários e obra publicada; preserva a ordem remota", () => {
  for (const lista of [[], [capitulo("publicado", true)], [capitulo("único", false)],
    [capitulo("publicado", true), capitulo("z", false, { ordem: 7 }), capitulo("a", false, { ordem: 20 })],
    [capitulo("agendado", false, { agendado: true })]]) {
    const antes = structuredClone(lista);
    const resumo = confirmarRascunhosPainel("A", obras, lista).porObra.get("obra");
    const esperados = lista.filter(c => c.publicado === false);
    assert.equal(resumo.total, esperados.length);
    assert.equal(resumo.primeiro?.id, esperados[0]?.id);
    assert.deepEqual(lista, antes);
  }
});

test("legados ou identidade/propriedade não confirmadas omitem a indicação, sem falso zero", () => {
  for (const lista of [[capitulo("legado", undefined)], [capitulo("legado", null)],
    [capitulo("terceiro", false, { user_id: "B" })], [capitulo("sem-id", false, { id: "" })]]) {
    assert.equal(confirmarRascunhosPainel("A", obras, lista).porObra.has("obra"), false);
  }
  assert.equal(confirmarRascunhosPainel("B", obras, []).porObra.size, 0);
  assert.equal(confirmarRascunhosPainel("", obras, []).porObra.size, 0);
  assert.equal(confirmarRascunhosPainel("A", [{ id: "local" }], []).porObra.size, 0);
});

test("contrato agregado confirma apenas sucesso completo remoto, sem consultas adicionais", async () => {
  for (const modo of ["sucesso", "capitulos-falham", "erro", "vazio", "sem-sessao"]) {
    const chamadas = [], confirmacoes = [];
    const mesclagens = [];
    const resultadoMesclado = Object.freeze({ obras: Object.freeze([]), favoritas: Object.freeze([]), concluidas: Object.freeze([]) });
    const { carregarPainelAutorSupabase } = carregar("lib/painel-autor-supabase-data-loader.ts", {
      "../../../lib/supabase/client": { supabase: { auth: { getUser: async () => ({ data: { user: modo === "sem-sessao" ? null : { id: "A" } } }) } } },
      "../../../lib/utils": { criarSlugBase: v => v },
      "./painel-autor-profile-loader": { carregarProfilePainelAutor: async () => ({}) },
      "./painel-autor-supabase-works-loader": { carregarObrasPainelAutorSupabase: async () => {
        chamadas.push("obras"); return modo === "vazio" ? [] : obras;
      } },
      "./painel-autor-supabase-chapters-loader": { carregarCapitulosPainelAutorSupabase: async (_id, _obras, confirmar) => {
        chamadas.push("capitulos");
        if (modo === "capitulos-falham") return [];
        const lista = [capitulo("remoto", false)]; confirmar(lista); return lista;
      } },
      "../../../lib/metricas": { carregarMetricasConteudos: async () => {
        chamadas.push("metricas"); if (modo === "erro") throw new Error("rede"); return { obras: new Map() };
      } },
      "./painel-autor-chapter-comments-loader": { carregarComentariosCapitulosUsuarioPainel: async () => new Map() },
      "./painel-autor-metrics-state": { prepararEstadoMetricasPainel: () => ({}) },
      "./painel-autor-supabase-work-converter": { converterObraSupabaseParaLocalPainel: () => ({ id: "obra", titulo: "Obra", slug: "obra", autorId: "A", capitulos: [capitulo("somente-local", false)] }) },
      "./painel-autor-supabase-result-merge": { mesclarResultadoSupabasePainelAutor: parametros => {
        mesclagens.push(parametros); return resultadoMesclado;
      } },
    });
    const warn = console.warn; console.warn = () => {};
    let resultado;
    try {
      resultado = await carregarPainelAutorSupabase([], [], [], dados => {
        assert.equal(mesclagens.length, 1, "a confirmação ocorre após a mesclagem");
        confirmacoes.push(dados);
      });
    } finally { console.warn = warn; }
    assert.equal(confirmacoes.length, modo === "sucesso" ? 1 : 0, modo);
    if (modo === "sucesso" || modo === "capitulos-falham") {
      assert.equal(mesclagens.length, 1, modo);
      assert.strictEqual(resultado, resultadoMesclado, "devolve o mesmo resultado, sem alterar o contrato legado");
      assert.deepEqual(Object.keys(mesclagens[0]).sort(), [
        "obrasLocaisUsuario", "obrasSupabase", "userId", "nomeProfileAutor",
        "obrasFavoritasUsuario", "obrasConcluidasUsuario", "favoritosSupabase", "concluidasSupabase",
      ].sort());
      assert.equal(mesclagens[0].userId, "A");
      assert.equal(mesclagens[0].obrasSupabase[0].id, "obra");
    } else {
      assert.equal(mesclagens.length, 0, modo);
    }
    if (modo === "sucesso") {
      assert.deepEqual(chamadas, ["obras", "capitulos", "metricas"]);
      assert.equal(confirmacoes[0].porObra.get("obra").primeiro.id, "remoto");
    }
  }
});

function criarHook() {
  const slots = [], pendentes = [], gravacoes = [];
  let cursor, efeito, anterior, cleanup, contexto, atual;
  const iguais = (a, b) => a && b.every((v, i) => Object.is(v, a[i]));
  const react = {
    useState(inicial) {
      const i = cursor++; if (!(i in slots)) slots[i] = inicial;
      return [slots[i], v => { slots[i] = v; }];
    },
    useMemo(fn, deps) {
      const i = cursor++;
      if (!iguais(slots[i]?.deps, deps)) slots[i] = { deps, valor: fn() };
      return slots[i].valor;
    },
    useEffect(fn, deps) { if (!iguais(anterior, deps)) { efeito = fn; anterior = deps; } },
  };
  const { usePainelAutorInitialData } = carregar("hooks/use-painel-autor-initial-data.ts", {
    react,
    "../lib/painel-autor-supabase-data-loader": { carregarPainelAutorSupabase: (_o, _f, _c, confirmar) => new Promise(resolve => pendentes.push({ resolver(dados) {
      if (dados) confirmar(dados); resolve({ obras: [], favoritas: [], concluidas: [] });
    } })) },
    "../lib/painel-autor-profile-loader": { carregarProfilePainelAutor: async () => ({}) },
    "../lib/painel-autor-file-backup-storage": { carregarBackupArquivosObras: () => ({}), sincronizarBackupArquivosObras: () => {} },
    "../lib/painel-autor-storage-utils": {
      carregarListaIdsPainel: () => [], lerStorageUsuarioPainel: () => "[]",
      salvarJsonStorageUsuarioPainel: (...args) => gravacoes.push(args), salvarListaIdsUsuarioPainel: () => {},
    },
  });
  const noop = () => {};
  const setters = { setObras: noop, setObrasFavoritas: noop, setObrasConcluidas: noop, setCarregandoDados: noop };
  return {
    pendentes, gravacoes,
    render(id = contexto?.id || "", verificando = false) {
      contexto = { id, verificando }; cursor = 0;
      atual = Reflect.apply(usePainelAutorInitialData, null, [{ usuarioIdLogado: id, verificandoUsuario: verificando, ...setters }]);
      return atual;
    },
    async efeitos() {
      if (efeito) { cleanup?.(); cleanup = efeito(); efeito = null; }
      // Drenar as promises reais do loader, sem relógios/sleeps.
      for (let i = 0; i < 12; i++) await Promise.resolve();
    },
  };
}

test("confirmação transitória: sucesso, fallback e ausência de persistência", async () => {
  for (const confirmado of [true, false]) {
    const h = criarHook(); assert.equal(h.render("A"), undefined); await h.efeitos();
    const dados = confirmarRascunhosPainel("A", obras, [capitulo("rascunho", false)]);
    h.pendentes[0].resolver(confirmado ? dados : null); await h.efeitos();
    assert.equal(h.render("A")?.get("obra").total, confirmado ? 1 : undefined);
    assert.ok(h.gravacoes.every(args => !JSON.stringify(args).includes("porObra")));
  }
});

test("troca A/B/logout/A invalida imediatamente e descarta respostas antigas e identidade divergente", async () => {
  const h = criarHook(); h.render("A"); await h.efeitos();
  const dadosA = confirmarRascunhosPainel("A", obras, [capitulo("rascunho-A", false)]);
  h.pendentes[0].resolver(dadosA); await h.efeitos();
  assert.equal(h.render("A").get("obra").primeiro.id, "rascunho-A");
  assert.equal(h.render("B"), undefined); await h.efeitos();
  assert.equal(h.render(""), undefined); await h.efeitos();
  assert.equal(h.render("A"), undefined); await h.efeitos();
  h.pendentes[1].resolver(dadosA); await h.efeitos();
  assert.equal(h.render("A"), undefined);
  h.pendentes[2].resolver({ ...dadosA, usuarioId: "B" }); await h.efeitos();
  assert.equal(h.render("A"), undefined);
});
