import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const hook = readFileSync(new URL("../../app/hooks/use-home-initial-data.ts", import.meta.url), "utf8");
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const javascript = ts.transpileModule(hook, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
const obra = (id) => ({ id, titulo: id });

function montar({ snapshot, remote, profiles = () => ({}) } = {}) {
  const slots = [], effects = [], pending = [], calls = [], updates = [];
  let index = 0, effectIndex = 0, output, mounted = true;
  const cache = { current: [] };
  const react = {
    useState(initial) {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = initial;
      return [slots[slot], value => {
        updates.push({ mounted, slot });
        slots[slot] = typeof value === "function" ? value(slots[slot]) : value;
      }];
    },
    useCallback(fn) { return fn; },
    useEffect(fn, deps) {
      const slot = effectIndex++;
      const previous = effects[slot];
      if (!previous || deps.some((dep, i) => dep !== previous.deps[i])) {
        pending.push(() => {
          previous?.cleanup?.();
          effects[slot] = { deps, cleanup: fn() };
        });
      }
    },
  };
  const dependencies = {
    react,
    "../lib/home-author-storage-utils": { carregarPerfisAutoresHomeSalvos: profiles },
    "../lib/home-initial-data-loader": {
      async carregarSnapshotInicialHome(options) {
        calls.push(["snapshot", options.usuarioIdLogado]);
        if (snapshot) return snapshot(options);
        options.aoNormalizarObras([obra(`local-${options.usuarioIdLogado}`)], options.usuarioIdLogado);
        return {
          userIdHome: options.usuarioIdLogado,
          obrasNormalizadas: [obra(`local-${options.usuarioIdLogado}`)],
          obrasFavoritasNormalizadas: [`fav-${options.usuarioIdLogado}`],
          perfisAutoresNormalizados: { [options.usuarioIdLogado]: { bio: "bio" } },
        };
      },
    },
    "../lib/home-supabase-works-loader": {
      async carregarObrasSupabaseHome(...args) {
        calls.push(["works", args[1]]);
        return remote ? remote(...args) : [obra(`remote-${args[1]}`)];
      },
    },
  };
  const mod = { exports: {} };
  new Function("require", "module", "exports", javascript)(name => {
    assert.ok(name in dependencies, name);
    return dependencies[name];
  }, mod, mod.exports);
  function commit() { while (pending.length) pending.shift()(); }
  function render(user = "A", commitEffects = true) {
    index = 0; effectIndex = 0;
    output = mod.exports.default(user, cache);
    if (commitEffects) commit();
    return output;
  }
  function unmount() { mounted = false; for (const effect of effects) effect.cleanup?.(); }
  return { render, commit, unmount, calls, cache, updates, get output() { return output; } };
}

test("Home normal mantém loading até snapshot e obras; sem consultas extras em rerender", async () => {
  const snapshotDone = deferred(), worksDone = deferred();
  const h = montar({
    snapshot: async options => {
      options.aoNormalizarObras([obra("local")], "A");
      await snapshotDone.promise;
      return { userIdHome: "A", obrasNormalizadas: [obra("local")], obrasFavoritasNormalizadas: ["fav"], perfisAutoresNormalizados: { ana: { bio: "local" } } };
    },
    remote: () => worksDone.promise,
    profiles: () => ({ bia: { bio: "remote" } }),
  });
  assert.equal(h.render().dadosHomeCarregados, false);
  await flush();
  assert.deepEqual(h.calls, [["snapshot", "A"], ["works", "A"]], "obras iniciam sem esperar coleções");
  worksDone.resolve([obra("remote")]);
  await flush();
  assert.equal(h.render().dadosHomeCarregados, false);
  snapshotDone.resolve(); await flush();
  const value = h.render();
  assert.equal(value.dadosHomeCarregados, true);
  assert.equal(value.erroCarregamentoHome, false);
  assert.deepEqual(value.obrasLocais, [obra("remote")]);
  assert.deepEqual(value.obrasFavoritas, ["fav"]);
  assert.deepEqual(value.perfisAutores, { ana: { bio: "local" }, bia: { bio: "remote" } });
  assert.equal(h.calls.length, 2);
});

test("snapshot primeiro não confirma antes das obras", async () => {
  const pending = deferred();
  const h = montar({ remote: () => pending.promise });
  h.render(); await flush();
  assert.equal(h.render().dadosHomeCarregados, false);
  pending.resolve([]); await flush();
  assert.equal(h.render().dadosHomeCarregados, true);
  assert.deepEqual(h.output.obrasLocais, []);
  assert.equal(h.output.erroCarregamentoHome, false, "vazio confirmado é distinto de erro");
});

for (const mode of ["throw", "soft"]) {
  test(`falha remota ${mode} conserva obras/favoritos/perfis locais e sinaliza desatualização`, async () => {
    const h = montar({ remote: async (local, _id, _queries, fail) => {
      if (mode === "throw") throw Error("offline");
      fail(); return local;
    } });
    h.render(); await flush();
    const value = h.render();
    assert.deepEqual(value.obrasLocais, [obra("local-A")]);
    assert.deepEqual(value.obrasFavoritas, ["fav-A"]);
    assert.deepEqual(value.perfisAutores, { A: { bio: "bio" } });
    assert.equal(value.dadosHomeCarregados, true);
    assert.equal(value.erroCarregamentoHome, true);
  });
}

test("retry com snapshot quebrado conserva o último conjunto válido do usuário atual", async () => {
  let broken = false;
  const h = montar({ snapshot: async options => {
    if (broken) throw Error("storage");
    options.aoNormalizarObras([obra("local")], "A");
    return { obrasNormalizadas: [obra("local")], obrasFavoritasNormalizadas: ["fav"], perfisAutoresNormalizados: { ana: { bio: "bio" } } };
  } });
  h.render(); await flush();
  const previous = h.render();
  broken = true;
  previous.recarregarDadosHome();
  assert.equal(h.render().dadosHomeCarregados, false);
  await flush();
  const value = h.render();
  assert.deepEqual(value.obrasLocais, previous.obrasLocais);
  assert.deepEqual(value.obrasFavoritas, previous.obrasFavoritas);
  assert.deepEqual(value.perfisAutores, previous.perfisAutores);
  assert.equal(value.erroCarregamentoHome, true);
});

test("retry recupera a falha e mantém setters funcionais", async () => {
  let broken = true;
  const h = montar({ remote: async () => { if (broken) throw Error("offline"); return [obra("fresh")]; } });
  h.render(); await flush();
  let value = h.render();
  assert.equal(value.erroCarregamentoHome, true);
  value.setObrasFavoritas(ids => [...ids, "new"]);
  value.setObrasLocais(works => [...works, obra("extra")]);
  value = h.render();
  assert.equal(value.obrasLocais.length, 2);
  assert.ok(value.obrasFavoritas.includes("new"));
  broken = false; value.recarregarDadosHome(); h.render(); await flush();
  value = h.render();
  assert.equal(value.erroCarregamentoHome, false);
  assert.deepEqual(value.obrasLocais, [obra("fresh")]);
});

test("troca de conta mascara o estado no render anterior ao cleanup e ignora resposta antiga", async () => {
  const delayed = deferred();
  let hold = false;
  const h = montar({ remote: async (_local, id) => id === "A" && hold ? delayed.promise : [obra(id)] });
  h.render("A"); await flush();
  let value = h.render("A");
  hold = true; value.recarregarDadosHome(); h.render("A"); await flush();
  const cacheA = h.cache.current;
  value = h.render("B", false);
  assert.deepEqual(value.obrasLocais, []);
  assert.deepEqual(value.obrasFavoritas, []);
  assert.deepEqual(value.perfisAutores, {});
  assert.equal(value.dadosHomeCarregados, false);
  h.commit(); await flush();
  value = h.render("B");
  assert.deepEqual(value.obrasLocais, [obra("B")]);
  delayed.resolve([obra("late-A")]); await flush();
  assert.deepEqual(h.render("B").obrasLocais, [obra("B")]);
  assert.notEqual(h.cache.current, cacheA);
  assert.deepEqual(h.cache.current, [obra("local-B")]);
});

test("falha da conta nova e logout nunca preservam o conjunto pessoal anterior", async () => {
  const h = montar({ snapshot: async options => {
    if (options.usuarioIdLogado !== "A") throw Error("offline");
    options.aoNormalizarObras([obra("A")], "A");
    return { obrasNormalizadas: [obra("A")], obrasFavoritasNormalizadas: ["A"], perfisAutoresNormalizados: { A: { bio: "A" } } };
  } });
  h.render("A"); await flush(); h.render("A");
  for (const id of ["B", ""]) {
    h.render(id); await flush();
    const value = h.render(id);
    assert.deepEqual(value.obrasLocais, []);
    assert.deepEqual(value.obrasFavoritas, []);
    assert.deepEqual(value.perfisAutores, {});
    assert.equal(value.erroCarregamentoHome, true);
    assert.deepEqual(h.cache.current, []);
  }
});

for (const stage of ["snapshot", "works"]) {
  test(`desmontagem durante ${stage} bloqueia setters e callback atrasado no cache`, async () => {
    const pending = deferred();
    const h = montar(stage === "snapshot" ? {
      snapshot: async options => {
        await pending.promise;
        options.aoNormalizarObras([obra("late")], "A");
        return { obrasNormalizadas: [], obrasFavoritasNormalizadas: [], perfisAutoresNormalizados: {} };
      },
    } : { remote: () => pending.promise });
    h.render(); await flush();
    const before = h.cache.current;
    h.unmount(); pending.resolve([]); await flush();
    assert.equal(h.updates.length, 0);
    assert.equal(h.cache.current, before);
    assert.equal(h.calls.filter(([name]) => name === "works").length, stage === "snapshot" ? 0 : 1);
  });
}

test("cleanup imediato não inicia snapshot nem consultas", async () => {
  const h = montar(); h.render(); h.unmount(); await flush();
  assert.deepEqual(h.calls, []);
});

test("Home mantém suas fronteiras e diferencia falha de vazio confirmado", () => {
  assert.match(pagina, /useHomeInitialData\(usuarioIdLogado, obrasCacheLocalHomeRef\)/);
  assert.match(pagina, /useHomeCatalogSearch\(/);
  assert.match(pagina, /!erroCarregamentoHome && !termoBusca/);
  assert.match(pagina, /erroCarregamentoHome && <HomeDataWarning/);
  assert.match(hook, /resolverUsuario: false/);
  assert.doesNotMatch(hook, /setTimeout|\.insert\(|\.update\(|\.delete\(/);
});
