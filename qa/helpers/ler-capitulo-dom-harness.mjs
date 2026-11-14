import assert from "node:assert/strict";
import { loadApplicationModule } from "./load-application-module.mjs";

// DOM/History mínimos e lifecycle de hooks controlado, sem rede ou navegador.
// Efeitos só são aplicados após estabilizar os updates durante o render.
export function montarLeitor(t, {
  url = "/ler-capitulo?obraId=obra&capituloId=c1",
  state = { __NA: true, tree: { inicial: true } },
  altura = 2000,
  viewport = 1000,
  top = 0,
  observar = true,
} = {}) {
  const originais = Object.fromEntries(["window", "document", "ResizeObserver"].map(
    nome => [nome, Object.getOwnPropertyDescriptor(globalThis, nome)],
  ));
  const listeners = new Map();
  const timers = new Map();
  const observadores = [];
  const entradas = [{ url: new URL(url, "https://historietas.test"), state: structuredClone(state) }];
  const historico = [];
  const rolagens = [];
  let indiceEntrada = 0;
  let timerId = 0;
  const window = {
    get location() { return entradas[indiceEntrada].url; },
    innerHeight: viewport,
    scrollY: top,
    history: {
      get state() { return entradas[indiceEntrada].state; },
      get length() { return entradas.length; },
      replaceState(data, _title, href) {
        historico.push(["replace", structuredClone(data)]);
        entradas[indiceEntrada] = {
          state: structuredClone(data),
          url: href ? new URL(href, window.location) : window.location,
        };
      },
      pushState(data, _title, href) {
        historico.push(["push", structuredClone(data)]);
        entradas.splice(indiceEntrada + 1);
        entradas.push({ state: structuredClone(data), url: new URL(href, window.location) });
        indiceEntrada += 1;
      },
      go(delta) {
        const proximo = indiceEntrada + delta;
        assert.ok(proximo >= 0 && proximo < entradas.length);
        indiceEntrada = proximo;
        emitir("popstate", { state: this.state });
      },
      back() { this.go(-1); },
      forward() { this.go(1); },
    },
    scrollTo(opcoes) { rolagens.push(opcoes); }, // scroll suave termina em evento posterior
    setTimeout(callback, atraso) {
      assert.equal(atraso, 0);
      timers.set(++timerId, callback);
      return timerId;
    },
    clearTimeout(id) { timers.delete(id); },
    addEventListener(nome, callback) {
      if (!listeners.has(nome)) listeners.set(nome, new Set());
      listeners.get(nome).add(callback);
    },
    removeEventListener(nome, callback) { listeners.get(nome)?.delete(callback); },
  };
  function emitir(nome, dados = {}) {
    for (const callback of [...(listeners.get(nome) || [])]) callback(dados);
  }
  const document = { documentElement: { scrollHeight: altura }, body: {} };
  class Observador {
    alvos = [];
    ativo = true;
    constructor(callback) { this.callback = callback; observadores.push(this); }
    observe(alvo) { this.alvos.push(alvo); }
    disconnect() { this.ativo = false; }
  }
  Object.assign(globalThis, { window, document, ResizeObserver: observar ? Observador : undefined });

  const estados = [];
  const efeitos = [];
  let indiceEstado;
  let indiceEfeito;
  let pendentes;
  let mudou;
  const react = {
    useState(inicial) {
      const i = indiceEstado++;
      if (!estados[i]) {
        const slot = { valor: typeof inicial === "function" ? inicial() : inicial };
        slot.setter = novo => {
          const valor = typeof novo === "function" ? novo(slot.valor) : novo;
          if (!Object.is(valor, slot.valor)) { slot.valor = valor; mudou = true; }
        };
        estados[i] = slot;
      }
      return [estados[i].valor, estados[i].setter];
    },
    useEffect(callback, deps) { registrarEfeito("passivo", callback, deps); },
    useLayoutEffect(callback, deps) { registrarEfeito("layout", callback, deps); },
  };
  function registrarEfeito(tipo, callback, deps) {
    const i = indiceEfeito++;
    if (!efeitos[i] || deps.some((dep, j) => !Object.is(dep, efeitos[i].deps[j]))) {
      pendentes.push({ i, tipo, callback, deps });
    }
  }
  const navegacao = loadApplicationModule("app/ler-capitulo/lib/ler-capitulo-navigation-actions.ts", {
    "./ler-capitulo-chapter-route": {
      criarHrefLeituraCapituloLeitor: (obra, capituloId) =>
        `/ler-capitulo?obraId=${encodeURIComponent(obra.id)}&capituloId=${encodeURIComponent(capituloId)}`,
    },
  });
  const { useLerCapituloRouteIdentityState: executarIdentidade } = loadApplicationModule(
    "app/ler-capitulo/hooks/use-ler-capitulo-route-identity-state.ts",
    { react, "../lib/ler-capitulo-navigation-actions": navegacao },
  );
  const { useLerCapituloScrollProgress: executarProgresso } = loadApplicationModule(
    "app/ler-capitulo/hooks/use-ler-capitulo-scroll-progress.ts", { react },
  );
  const progresso = { valor: -1, atualizacoes: [] };
  const setProgressoRolagem = valor => { progresso.valor = valor; progresso.atualizacoes.push(valor); };
  let props = {};
  let identidade;
  function render(novasProps = {}, { medir = false, disponivel = true } = {}) {
    props = { ...props, ...novasProps };
    let tentativas = 0;
    do {
      assert.ok(++tentativas < 15, "Render não estabilizou");
      mudou = false;
      indiceEstado = 0;
      indiceEfeito = 0;
      pendentes = [];
      identidade = executarIdentidade(props);
      if (medir) executarProgresso({
        obraId: identidade.obraId,
        capituloId: disponivel ? identidade.capituloId : undefined,
        setProgressoRolagem,
      });
      if (mudou) continue;
      for (const tipo of ["layout", "passivo"]) {
        for (const efeito of pendentes.filter(efeito => efeito.tipo === tipo)) {
          efeitos[efeito.i]?.cleanup?.();
          efeitos[efeito.i] = { ...efeito, cleanup: efeito.callback() };
        }
      }
    } while (mudou);
    return identidade;
  }
  function desmontar() {
    for (const efeito of efeitos) efeito?.cleanup?.();
    efeitos.length = 0;
  }
  t.after(() => {
    desmontar();
    for (const [nome, descriptor] of Object.entries(originais)) {
      if (descriptor) Object.defineProperty(globalThis, nome, descriptor);
      else delete globalThis[nome];
    }
  });
  return {
    window, document, progresso, entradas, historico, rolagens, timers, listeners, observadores,
    render, emitir, desmontar, ...navegacao,
    executarTimers() {
      for (const [id, callback] of [...timers]) { timers.delete(id); callback(); }
    },
    redimensionarConteudo() {
      for (const observador of observadores) if (observador.ativo) observador.callback();
    },
  };
}
