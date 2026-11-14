import {loadApplicationModule} from "./load-application-module.mjs";
export const tickModeracao = () => new Promise(resolve => setImmediate(resolve));
export function adiarModeracao() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {resolve = res; reject = rej;});
  return {promise, resolve, reject};
}
export function contextoModeracao(usuarioId = "A") {
  return {ativo: true, usuarioId, ehAdmin: !!usuarioId, leitura: 0, acao: null, incertos: new Set()};
}
export function denunciaModeracao(patch = {}) {
  return {id: "d1", alvoTipo: "post", alvoId: "post1", alvoAutorId: "autor", denuncianteId: "leitor", motivo: "Motivo", detalhe: "",
    status: "pendente", arquivada: false, observacaoAdmin: "", analisadoPor: null, analisadoEm: null,
    atualizadoEm: "2026-11-13T00:00:00.000001+00:00", criadoEm: "2026-11-12T00:00:00+00:00",
    denuncianteNome: "Leitor", alvoResumo: "Texto", alvoAutor: "Autor", alvoData: "", alvoPostId: "post1", ...patch};
}
export function criarModeracaoHarness(t) {
  const calls = [], updates = [], requests = [], rows = [denunciaModeracao()];
  const state = {denuncias: rows, denunciasPerfis: [{id: "p1", status: "pendente", atualizadoEm: "2026-11-13T00:00:00+00:00"}], observacoes: {}, acaoEmAndamento: "", erro: "", sucesso: "", menu: ""};
  const controleModeracao = {current: contextoModeracao()};
  const queue = []; let delayUpdates = false;
  let slots = [], cursor = 0, effects = [], confirmado = true, actor = "A";
  const previous = globalThis.window;
  globalThis.window = {confirm: () => {calls.push("confirm"); return confirmado;}};
  const depsIguais = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const effect = (fn, deps) => {const i = cursor++; if (!depsIguais(slots[i]?.deps, deps)) effects.push(() => {slots[i]?.cleanup?.(); slots[i] = {deps, cleanup: fn()};});};
  const react = {useRef: value => slots[cursor++] ??= {current: value}, useEffect: effect, useLayoutEffect: effect};
  const action = name => async params => {
    calls.push(name); const pending = adiarModeracao(); requests.push({name, params, ...pending}); return pending.promise;
  };
  const confirmed = loadApplicationModule("app/admin/comunidade/lib/admin-comunidade-confirmed-write.ts", {"../../../../lib/supabase/client": {supabase: {}}});
  const mocks = {react, "../lib/admin-comunidade-confirmed-write": confirmed,
    "../loaders/verificar-acesso-moderacao": {verificarAcessoModeracao: async () => ({user: actor ? {id: actor} : null, adminConfirmado: !!actor})},
    "../actions/atualizar-status-denuncia-moderacao": {persistirStatusDenunciaModeracao: action("status")},
    "../actions/arquivar-denuncia-moderacao": {persistirArquivamentoDenunciaModeracao: action("arquivar")},
    "../actions/restaurar-denuncia-moderacao": {persistirRestauracaoDenunciaModeracao: action("restaurar")},
    "../actions/remover-denuncia-resolvida-moderacao": {persistirRemocaoDenunciaResolvidaModeracao: action("excluir-denuncia")},
    "../actions/remover-conteudo-denunciado-moderacao": {removerConteudoDenunciadoModeracao: action("remover-conteudo")},
    "../actions/atualizar-status-denuncia-perfil-moderacao": {persistirStatusDenunciaPerfilModeracao: action("perfil-status")},
    "../actions/remover-denuncia-perfil-resolvida-moderacao": {persistirRemocaoDenunciaPerfilResolvidaModeracao: action("perfil-excluir")},
  };
  const {useAdminComunidadeContentReportActions: hook} = loadApplicationModule("app/admin/comunidade/hooks/use-admin-comunidade-content-report-actions.ts", mocks);
  const {useAdminComunidadeProfileReportActions: profileHook} = loadApplicationModule("app/admin/comunidade/hooks/use-admin-comunidade-profile-report-actions.ts", mocks);
  const params = {language: "pt-BR", usuarioId: "A", ehAdmin: true, acaoEmAndamento: "", denuncias: rows, observacoes: {}, controleModeracao};
  for (const [prop, key] of [["setDenuncias", "denuncias"], ["setDenunciasPerfis", "denunciasPerfis"], ["setObservacoes", "observacoes"], ["setAcaoEmAndamento", "acaoEmAndamento"],
    ["setErro", "erro"], ["setSucesso", "sucesso"], ["setMenuDenunciaAbertoId", "menu"]]) {
    params[prop] = value => {
      const apply = () => {state[key] = typeof value === "function" ? value(state[key]) : value; updates.push([key, state[key]]);};
      if (delayUpdates && typeof value === "function") queue.push(apply); else apply();
    };
  }
  function render(patch = {}) {
    Object.assign(params, patch); cursor = 0; effects = [];
    const result = {...hook(params), ...profileHook({...params, denunciasPerfis: state.denunciasPerfis})};
    effects.forEach(fn => fn()); return result;
  }
  function unmount() {for (const slot of slots) slot?.cleanup?.(); slots = []; controleModeracao.current.ativo = false;}
  t.after(() => {unmount(); globalThis.window = previous;});
  return {calls, updates, requests, state, params, mocks, controleModeracao, render, unmount, ErroEscritaModeracao: confirmed.ErroEscritaModeracao,
    delay() {delayUpdates = true;}, flush() {queue.splice(0).forEach(fn => fn());},
    confirmar: value => {confirmado = value;}, identity(id) {actor = id; controleModeracao.current.ativo = false; controleModeracao.current = contextoModeracao(id);}};
}
