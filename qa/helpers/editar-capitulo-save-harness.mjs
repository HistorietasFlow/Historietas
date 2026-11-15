import {loadApplicationModule} from "./load-application-module.mjs";
const globalsPorTeste = new WeakSet();

export const tickEdicao = () => new Promise(resolve => setImmediate(resolve));
export function adiarEdicao() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {resolve = res; reject = rej;});
  return {promise, resolve, reject};
}
export function criarEdicaoHarness(t, {local = false} = {}) {
  const obraId = local ? "obra-local" : "00000000-0000-4000-8000-000000000001";
  const capituloId = local ? "capitulo-local" : "00000000-0000-4000-8000-000000000002";
  const row = {id: capituloId, obra_id: obraId, user_id: "A", titulo: "Título original", texto: "Texto original suficientemente longo.",
    ordem: 1, publicado: false, tipo_conteudo: "texto", atualizado_em: "2026-11-13T00:00:00.000001+00:00"};
  const capitulo = {id: capituloId, titulo: row.titulo, texto: row.texto, ordem: 1, publicado: false};
  const obra = {id: obraId, autorId: "A", titulo: "Obra", autor: "Autora", publicado: false, capitulos: [capitulo]};
  const cache = new Map([["historietas-obras:A", JSON.stringify([obra])]]), recovery = new Map();
  const calls = [], falhas = new Map(), state = {obras: [obra], erro: "", salvou: false, processando: false};
  const previous = {window: globalThis.window, localStorage: globalThis.localStorage, sessionStorage: globalThis.sessionStorage};
  if (!globalsPorTeste.has(t)) {
    globalsPorTeste.add(t);
    t.after(() => {Object.assign(globalThis, previous); globalsPorTeste.delete(t);});
  }
  let authListener, authUser = "A", slots = [], cursor = 0, effects = [];
  const storage = (map, name) => ({getItem: key => map.get(key) ?? null, setItem(key, value) {
    if (falhas.has(name)) throw new DOMException("Cheio", "QuotaExceededError"); map.set(key, value);
  }});
  globalThis.localStorage = storage(cache, "cache");
  globalThis.sessionStorage = storage(recovery, "recovery");
  globalThis.window = {scrollTo() {calls.push("scroll");}, sessionStorage: globalThis.sessionStorage,
    location: {search: `?obraId=${obraId}&capituloId=${capituloId}`}};
  const depsIguais = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  const react = {
    useRef(value) {return slots[cursor++] ??= {current: value};},
    useLayoutEffect(effect, deps) {
      const i = cursor++;
      if (!depsIguais(slots[i]?.deps, deps)) effects.push(() => {slots[i]?.cleanup?.(); slots[i] = {deps, cleanup: effect()};});
    },
  };
  async function executar(etapa, action) {calls.push(etapa); return falhas.has(etapa) ? falhas.get(etapa)(action) : action();}
  const client = {
    auth: {
      getUser: () => executar("auth", () => ({data: {user: authUser ? {id: authUser} : null}, error: null})),
      onAuthStateChange(listener) {authListener = listener; return {data: {subscription: {unsubscribe() {authListener = null;}}}};},
    },
    from(table) {
      let operation = "select", payload, singular = false;
      const filters = [];
      const query = {select: () => query, limit: () => query, maybeSingle: () => {singular = true; return query;},
        update(value) {operation = "update"; payload = value; return query;},
        eq(key, value) {filters.push([key, value]); return query;}, is(key, value) {filters.push([key, value]); return query;},
        filter(key, operator, value) {if (operator !== "eq") throw new Error("Operador não esperado"); filters.push([key, value]); return query;},
        then(resolve, reject) {
          return executar(`${table}:${operation}`, () => {
            if (table === "obras") return {data: {id: obraId}, error: null};
            const matches = filters.every(([key, value]) => row[key] === value);
            if (matches && operation === "update") Object.assign(row, payload, {atualizado_em: `2026-11-14T00:00:00.${String(calls.length).padStart(6, "0")}+00:00`});
            return {data: singular ? (matches ? {...row} : null) : (matches ? [{...row}] : []), error: null};
          }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  const mocks = {react, "../../../lib/supabase/client": {supabase: client},
    "../actions/carregar-nome-profile-editar-capitulo": {carregarNomeProfileEditarCapitulo: async () => ""},
    "../actions/registrar-diario-edicao-capitulo": {registrarDiarioEdicaoCapitulo: async () => {calls.push("diario");}},
    "../actions/atualizar-notificacao-capitulo": {atualizarNotificacaoCapituloSupabase: async () => {calls.push("notificacao");}},
  };
  const {useEditarCapituloSaveAction: executarHook} = loadApplicationModule("app/editar-capitulo/hooks/useEditarCapituloSaveAction.ts", mocks);
  const params = {router: {replace: () => calls.push("replace")}, obraId, capituloId, usuarioEdicaoId: "A", referenciaRemota: local ? null : {...row},
    obras: [obra], obraAtual: obra, capituloAtual: capitulo, numeroCapitulo: 1,
    titulo: " Título revisado ", texto: " Texto revisado com conteúdo suficientemente longo. ", processando: false, excluindo: false,
    setObras: value => {state.obras = typeof value === "function" ? value(state.obras) : value; calls.push("setObras");},
  };
  for (const key of ["Processando", "Erro", "TipoErro", "Salvou"]) params[`set${key}`] = value => {state[key[0].toLowerCase() + key.slice(1)] = value; calls.push(`set${key}`);};
  function render(patch = {}) {
    Object.assign(params, patch); cursor = 0; effects = [];
    const result = executarHook(params); effects.forEach(effect => effect()); return result.salvarEdicao;
  }
  function unmount() {for (const slot of slots) slot?.cleanup?.(); slots = [];}
  t.after(unmount);
  const save = render();
  return {params, state, calls, falhas, cache, recovery, row, render, unmount, mocks, client,
    save: () => save({preventDefault() {}}),
    auth(userId) {authUser = userId; authListener?.("SIGNED_IN", userId ? {user: {id: userId}} : null);},
  };
}
