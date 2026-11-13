import {loadApplicationModule} from "./load-application-module.mjs";

export function adiarSeguindo() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {resolve = res; reject = rej;});
  return {promise, resolve, reject};
}
export const concluirMicrotarefasSeguindo = () => new Promise(resolve => setImmediate(resolve));
const windowsPorTeste = new WeakMap();

// Executa os hooks reais com commit/cleanup de efeitos, refs persistentes e
// relógio virtual. As respostas remotas são controladas separadamente.
export function criarSeguindoHookHarness(t, path, mocks = {}) {
  let slots = [], cursor = 0, effects = [], now = 0, timerId = 0;
  const timers = new Map(), updates = [], state = {};
  const depsIguais = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  const react = {
    useRef(value) {
      const i = cursor++;
      return slots[i] ??= {current: value};
    },
    useCallback(callback, deps) {
      const i = cursor++;
      if (!depsIguais(slots[i]?.deps, deps)) slots[i] = {callback, deps};
      return slots[i].callback;
    },
    useEffect(effect, deps) {
      const i = cursor++;
      if (!depsIguais(slots[i]?.deps, deps)) effects.push(() => {
        slots[i]?.cleanup?.();
        slots[i] = {deps, cleanup: effect()};
      });
    },
  };
  if (!windowsPorTeste.has(t)) {
    const previousWindow = globalThis.window;
    windowsPorTeste.set(t, previousWindow);
    t.after(() => {globalThis.window = previousWindow; windowsPorTeste.delete(t);});
  }
  const timerApi = {
    setTimeout(callback, delay = 0) {timers.set(++timerId, {callback, at: now + delay}); return timerId;},
    clearTimeout(id) {timers.delete(id);},
  };
  globalThis.window = timerApi;
  const modulo = loadApplicationModule(path, {...mocks, react});
  t.after(unmount);
  function unmount() {
    const previousWindow = globalThis.window;
    globalThis.window = timerApi;
    try {
      for (const slot of slots) slot?.cleanup?.();
      slots = [];
    } finally {globalThis.window = previousWindow;}
  }
  return {
    module: modulo, state, updates, timers, unmount,
    setter(key) {return value => {state[key] = typeof value === "function" ? value(state[key]) : value; updates.push([key, state[key]]);};},
    render(hook, params) {
      cursor = 0; effects = [];
      const value = hook(params);
      effects.forEach(effect => effect());
      return value;
    },
    advance(ms = 0) {
      const end = now + ms;
      for (;;) {
        const next = [...timers].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
        if (!next) break;
        const [id, timer] = next;
        timers.delete(id); now = timer.at; timer.callback();
      }
      now = end;
    },
  };
}
