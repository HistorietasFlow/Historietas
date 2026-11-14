import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { loadApplicationModule as load } from "../helpers/load-application-module.mjs";

const A = "00000000-0000-4000-8000-000000000001", B = "00000000-0000-4000-8000-000000000002", C = "00000000-0000-4000-8000-000000000003";
const adiar = () => { let resolve, reject; const promise = new Promise((res, rej) => { resolve = res; reject = rej; }); return { promise, resolve, reject }; };
const tick = () => new Promise(resolve => setImmediate(resolve));
const constants = load("app/perfil-autor/constants.ts", { "../../lib/storageUploads": { LIMITES_BYTES_STORAGE: { avatars: 1 } } });
function hooks() {
  const slots = []; let posicao = 0, efeitos = [], cleanups = [];
  const igual = (a, b) => a && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    ...React,
    useState(inicial) { const i = posicao++; if (!(i in slots)) slots[i] = inicial; return [slots[i], valor => { slots[i] = typeof valor === "function" ? valor(slots[i]) : valor; }]; },
    useMemo(fn, deps) { const i = posicao++; if (!igual(slots[i]?.deps, deps)) slots[i] = { deps, valor: fn() }; return slots[i].valor; },
    useEffect(fn, deps) { const i = posicao++; if (!igual(slots[i], deps)) { slots[i] = deps; efeitos.push([i, fn]); } },
    useRef(inicial) { const i = posicao++; if (!(i in slots)) slots[i] = { current: inicial }; return slots[i]; },
  };
  return { react, render(fn) { posicao = 0; return fn(); }, commit() { const fila = efeitos; efeitos = []; for (const [i, fn] of fila) { cleanups[i]?.(); cleanups[i] = fn(); } }, cleanup() { for (const fn of cleanups) fn?.(); } };
}
function state(props, nomes, estado, eventos = []) {
  for (const nome of nomes) props[`set${nome}`] = v => { estado[nome] = typeof v === "function" ? v(estado[nome]) : v; eventos.push([nome, estado[nome]]); };
}
function perfil(t) {
  const h = hooks(), estado = {}, gravacoes = [], chamadas = [], config = { perfis: new Map(), falha: false, userId: A };
  const mocks = {
    react: h.react, "../constants": constants,
    "../lib/profile-published-works-loader": { carregarObrasPublicadasSupabase: async () => [], carregarObrasPublicadasPorIdsSupabase: async () => [] },
    "../lib/profile-user-state-loader": { carregarEstadoUsuarioSupabase: async () => ({ identidadeConfirmada: true,
      estadoUsuario: config.userId ? { userId: config.userId, favoritas: [], concluidas: [], obrasSeguidas: [], autoresSeguidos: [] } : null }) },
    "../lib/profile-public-profile-loader": { carregarPerfilUsuarioSupabase: async id => {
      chamadas.push(id); if (config.falha) throw new Error("rede"); return await config.perfis.get(id) || { userId: id, nome: id };
    } },
    "../lib/profile-interactions-loader": { carregarInteracoesCapitulosSupabase: async () => ({ curtidas: new Set(), salvos: new Set(), comentarios: new Map(), progresso: new Map(), progressoCarregado: true, capitulosComMetricas: new Set() }) },
    "../lib/profile-local-storage-utils": { carregarJsonUsuarioPerfilAutor: () => [], carregarListaIdsPerfilBiblioteca: () => [], salvarJsonUsuarioPerfilAutor: (...args) => gravacoes.push(args), salvarListaIdsPerfilBiblioteca: (...args) => gravacoes.push(args) },
    "../lib/profile-local-author-utils": { carregarPerfisAutores: () => ({}) },
  };
  const { usePerfilAutorProfileLoadSync } = load("app/perfil-autor/hooks/use-perfil-autor-profile-load-sync.ts", mocks);
  const props = { autenticacaoCarregada: true, queryPerfilAtual: `autorId=${A}`, usuarioIdLogado: A, versaoIdentidade: 1,
    identidadeAutenticadaPerfilRef: { current: { usuarioId: A, versao: 1 } } };
  state(props, ["AbaPerfil", "AutorSelecionado", "AutorIdSelecionado", "MostrarDestaquesVisitante", "UsernameCabecalhoVisivel", "PerfilUsuarioRemoto", "Obras", "AutoresSeguidos", "ObrasFavoritas", "ObrasConcluidas", "ObrasSeguidasBiblioteca", "PerfisAutoresSalvos", "Carregando"], estado);
  const warn = console.warn; console.warn = () => {}; t.after(() => { console.warn = warn; h.cleanup(); });
  return { ...h, estado, config, props, gravacoes, chamadas,
    render(alteracoes = {}) { Object.assign(props, alteracoes); return h.render(() => Reflect.apply(usePerfilAutorProfileLoadSync, null, [props])); } };
}
function privacidade(privacyMocks, confirmarPermissoes) {
  const h = hooks(), estado = {}, chamadas = [], config = { gates: new Map(), falhas: false };
  let ultimoResultado;
  const confirmar = confirmarPermissoes || (async id => {
    chamadas.push(["permissoes", id]); if (config.falhas) throw new Error("rede");
    return await config.gates.get(id) || constants.PERMISSOES_ABAS_PERFIL_PADRAO;
  });
  const { usePerfilAutorPrivacySync } = load("app/perfil-autor/hooks/use-perfil-autor-privacy-sync.ts", {
    react: h.react, "../constants": constants,
    "../lib/profile-tab-permissions-loader": { carregarPermissoesAbasPerfilConfirmadas: confirmar },
    "../../../lib/historietasPrivacy": privacyMocks || {
      carregarPreferenciasPrivacidade: async (id, opts) => { chamadas.push(["preferencias", id, opts]); return {}; },
      carregarPermissoesAbasPerfil: confirmar,
    },
  });
  const props = { perfilAutorId: B, perfilPertenceAoUsuario: false, estadoRelacionamentoPerfil: "nenhum", usuarioIdLogado: A, versaoIdentidade: 1,
    identidadeAutenticadaPerfilRef: { current: { usuarioId: A, versao: 1 } } };
  state(props, ["PermissoesAbasPerfil", "PrivacidadePerfilCarregando"], estado);
  return { ...h, estado, props, chamadas, config, resultado: () => h.render(() => Reflect.apply(usePerfilAutorPrivacySync, null, [props])), render(alteracoes = {}) {
    Object.assign(props, alteracoes); ultimoResultado = h.render(() => Reflect.apply(usePerfilAutorPrivacySync, null, [props]));
    return typeof ultimoResultado === "object" ? ultimoResultado.privacidadeAtual : ultimoResultado;
  } };
}

test("navegação A → B oculta o snapshot A já no render e limpa dados antes da resposta", async t => {
  const p = perfil(t); p.render(); p.commit(); await tick();
  assert.equal(p.estado.PerfilUsuarioRemoto.userId, A);
  const gate = adiar(); p.config.perfis.set(B, gate.promise);
  const inicio = p.render({ queryPerfilAtual: `autorId=${B}` });
  const { obterEstadoAlvoPerfilAutor } = load("app/perfil-autor/lib/profile-target-view-state.ts");
  const frame = obterEstadoAlvoPerfilAutor({ obras: [], totaisInteracoesObras: {},
    perfilUsuarioRemoto: p.estado.PerfilUsuarioRemoto, autorSelecionado: p.estado.AutorSelecionado,
    autorIdSelecionado: p.estado.AutorIdSelecionado, usuarioIdLogado: A, autenticacaoCarregada: true,
    carregamentoAtual: inicio?.carregamentoAtual ?? true });
  assert.equal(frame.perfilParaMostrar, null, "o perfil anterior não participa do render da nova rota");
  assert.equal(frame.perfilPertenceAoUsuario, false);
  p.commit(); assert.equal(p.estado.Carregando, true); assert.equal(p.estado.PerfilUsuarioRemoto, null);
  gate.resolve({ userId: B, nome: "B" }); await tick();
  assert.equal(p.estado.PerfilUsuarioRemoto.userId, B); assert.equal(p.render().carregamentoAtual, true);
});

test("A → B → C com resposta B atrasada não aplica nem persiste B", async t => {
  const p = perfil(t); p.render(); p.commit(); await tick();
  const gate = adiar(); p.config.perfis.set(B, gate.promise);
  p.render({ queryPerfilAtual: `autorId=${B}` }); p.commit(); await tick();
  p.render({ queryPerfilAtual: `autorId=${C}` }); p.commit(); await tick();
  const gravacoes = [...p.gravacoes]; gate.resolve({ userId: B }); await tick();
  assert.equal(p.estado.PerfilUsuarioRemoto.userId, C); assert.deepEqual(p.gravacoes, gravacoes); assert.equal(p.estado.Carregando, false);
});

test("falha de rede encerra loading, descarta perfil anterior e permite recuperação", async t => {
  const p = perfil(t); p.render(); p.commit(); await tick(); p.config.falha = true;
  p.render({ queryPerfilAtual: `autorId=${B}` }); p.commit(); await tick();
  assert.equal(p.estado.Carregando, false); assert.equal(p.estado.PerfilUsuarioRemoto, null);
  assert.equal(p.render().erroCarregamento, true);
  p.config.falha = false; p.render({ queryPerfilAtual: `autorId=${C}` }); p.commit(); await tick();
  assert.equal(p.estado.PerfilUsuarioRemoto.userId, C); assert.equal(p.render().erroCarregamento, false);
});

test("sessão divergente não deixa loading preso nem reutiliza o perfil anterior", async t => {
  const p = perfil(t); p.render(); p.commit(); await tick(); p.config.userId = B;
  p.render({ queryPerfilAtual: `autorId=${C}` }); p.commit(); await tick();
  assert.equal(p.estado.Carregando, false); assert.equal(p.estado.PerfilUsuarioRemoto, null); assert.equal(p.render().erroCarregamento, true);
});

test("logout durante resposta pendente não aplica nem persiste dados da conta anterior", async t => {
  const p = perfil(t), gate = adiar(); p.config.perfis.set(A, gate.promise); p.render(); p.commit(); await tick();
  p.props.identidadeAutenticadaPerfilRef.current = { usuarioId: "", versao: 2 }; p.config.userId = "";
  p.render({ usuarioIdLogado: "", versaoIdentidade: 2, queryPerfilAtual: `autorId=${B}` }); p.commit(); await tick();
  const gravacoes = [...p.gravacoes]; gate.resolve({ userId: A, bio: "privado A" }); await tick();
  assert.deepEqual(p.gravacoes, gravacoes); assert.equal(p.estado.PerfilUsuarioRemoto.userId, B); assert.equal(p.estado.Carregando, false);
});

test("versão A → B → A inicia nova carga mesmo com os mesmos valores finais de conta/rota", async t => {
  const p = perfil(t); p.render(); p.commit(); await tick(); const count = p.chamadas.length;
  p.props.identidadeAutenticadaPerfilRef.current = { usuarioId: A, versao: 3 };
  p.render({ versaoIdentidade: 3 }); p.commit(); await tick();
  assert.equal(p.chamadas.length, count + 1); assert.equal(p.render().carregamentoAtual, true);
});

test("privacidade pertence ao alvo atual e não reutiliza permissão de outro perfil no primeiro render", async () => {
  const p = privacidade(); p.config.gates.set(B, Promise.resolve(constants.PERMISSOES_ABAS_PERFIL_PROPRIO));
  p.render(); p.commit(); await tick();
  const gate = adiar(); p.config.gates.set(C, gate.promise);
  const atual = p.render({ perfilAutorId: C });
  const { obterVisibilidadeAbasPerfilAutor } = load("app/perfil-autor/lib/profile-tab-visibility-utils.ts");
  const frame = obterVisibilidadeAbasPerfilAutor({ perfilPertenceAoUsuario: false, existeBloqueio: false,
    privacidadeCarregando: p.estado.PrivacidadePerfilCarregando || atual === false, permissoes: p.estado.PermissoesAbasPerfil });
  assert.equal(frame.bibliotecaPerfilVisivel, false, "não exibe a aba com a permissão do perfil anterior");
  p.commit();
  assert.equal(p.estado.PrivacidadePerfilCarregando, true); assert.equal(p.estado.PermissoesAbasPerfil.biblioteca, false);
  gate.resolve(constants.PERMISSOES_ABAS_PERFIL_PADRAO); await tick(); assert.equal(p.render(), true); p.cleanup();
});

test("troca de conta no mesmo perfil/relacionamento revalida privacidade e rejeita resposta atrasada", async () => {
  const p = privacidade(), gate = adiar(); p.config.gates.set(B, gate.promise); p.render(); p.commit(); await tick();
  p.props.identidadeAutenticadaPerfilRef.current = { usuarioId: C, versao: 2 }; p.config.gates.set(B, Promise.resolve(constants.PERMISSOES_ABAS_PERFIL_PADRAO));
  p.render({ usuarioIdLogado: C, versaoIdentidade: 2 }); p.commit(); await tick();
  gate.resolve(constants.PERMISSOES_ABAS_PERFIL_PROPRIO); await tick();
  assert.equal(p.chamadas.filter(c => c[0] === "permissoes").length, 2); assert.equal(p.estado.PermissoesAbasPerfil.biblioteca, false); p.cleanup();
});

test("rejeição na privacidade encerra loading sem conservar biblioteca anteriormente liberada", async () => {
  const p = privacidade(); p.config.gates.set(B, Promise.resolve(constants.PERMISSOES_ABAS_PERFIL_PROPRIO));
  p.render(); p.commit(); await tick(); p.config.falhas = true; p.render({ perfilAutorId: C }); p.commit(); await tick();
  assert.equal(p.estado.PrivacidadePerfilCarregando, false); assert.equal(p.estado.PermissoesAbasPerfil.biblioteca, false); p.cleanup();
});

const { resolverEstadoPerfilAutor } = load("app/perfil-autor/lib/profile-resolution-utils.ts");
const autor = (id, nome) => ({ autorId: id, nome, obras: [] });
test("ID explícito desconhecido não cai no perfil de mesmo nome nem recebe privilégios do visitante", () => {
  const r = resolverEstadoPerfilAutor({ perfisAutores: [autor(B, "Nome")], autorSelecionado: "Nome", autorIdSelecionado: A,
    usuarioIdLogado: A, perfilUsuarioRemotoComoAutor: null, autenticacaoCarregada: true });
  assert.equal(r.perfilParaMostrar, null); assert.equal(r.perfilPertenceAoUsuario, false);
});
test("sem parâmetro a conta A nunca recebe o perfil remoto B como próprio", () => {
  const r = resolverEstadoPerfilAutor({ perfisAutores: [], autorSelecionado: "", autorIdSelecionado: "", usuarioIdLogado: A,
    perfilUsuarioRemotoComoAutor: autor(B, "B"), autenticacaoCarregada: true }); assert.equal(r.perfilParaMostrar, null);
});

function autenticacao(t) {
  const h = hooks(), estado = {}, eventos = [], getUser = adiar(); let onAuth, saiu = false;
  const { usePerfilAutorAuthIdentitySync } = load("app/perfil-autor/hooks/use-perfil-autor-auth-identity-sync.ts", {
    react: h.react, "../constants": constants,
    "../../../lib/supabase/client": { supabase: { auth: { getUser: () => getUser.promise,
      onAuthStateChange(fn) { onAuth = fn; return { data: { subscription: { unsubscribe() { saiu = true; } } } }; } } } },
  });
  const props = { avatarInputRef: { current: { value: "avatar-A" } }, identidadeAutenticadaPerfilRef: { current: { usuarioId: "", versao: 0 } }, versaoConsultaAutenticacaoPerfilRef: { current: 0 } };
  state(props, ["PerfilUsuarioRemoto", "Obras", "TotaisInteracoesObras", "AutoresSeguidos", "ObrasFavoritas", "ObrasConcluidas", "ObrasSeguidasBiblioteca", "PerfisAutoresSalvos", "EditorPerfilAberto", "NomePerfilEditor", "UsernamePerfilEditor", "BioPerfilEditor", "AvatarPerfilEditor", "AvatarNomePerfilEditor", "AvatarArquivoPerfilEditor", "AvatarErro", "SalvandoEditorPerfil", "TopFiveCurtidaSalvando", "AvaliacaoDiario", "MensagemAcao", "Carregando", "UsuarioIdLogado", "AutenticacaoCarregada"], estado, eventos);
  t.after(() => h.cleanup());
  return { ...h, estado, eventos, props, getUser, evento: id => onAuth("SIGNED_IN", id ? { user: { id } } : null), saiu: () => saiu,
    render: () => h.render(() => Reflect.apply(usePerfilAutorAuthIdentitySync, null, [props])) };
}

test("auth real: getUser atrasado não vence evento; token da mesma conta não limpa nem muda versão", async t => {
  const a = autenticacao(t); a.render(); a.commit(); a.evento(B);
  const versao = a.render(); const eventos = a.eventos.length; a.evento(B);
  assert.equal(a.render(), versao); assert.equal(a.eventos.length, eventos + 1, "apenas confirma auth carregada");
  a.getUser.resolve({ data: { user: { id: A } } }); await tick();
  assert.equal(a.estado.UsuarioIdLogado, B); assert.equal(a.props.identidadeAutenticadaPerfilRef.current.usuarioId, B);
});

test("auth A → B → A em um lote torna a nova versão observável mesmo com o mesmo ID final", async t => {
  const a = autenticacao(t); a.render(); a.commit(); a.evento(A); const primeira = a.render();
  a.evento(B); a.evento(A); const final = a.render();
  assert.ok(final > primeira); assert.equal(a.estado.UsuarioIdLogado, A);
  assert.deepEqual(a.estado.Obras, []); assert.equal(a.estado.EditorPerfilAberto, false); assert.equal(a.props.avatarInputRef.current.value, "");
  a.getUser.resolve({ data: { user: null } }); await tick(); assert.equal(a.estado.UsuarioIdLogado, A);
});

test("auth: logout limpa a conta anterior e cleanup rejeita getUser atrasado", async t => {
  const a = autenticacao(t); a.render(); a.commit(); a.evento(A); a.evento("");
  assert.equal(a.estado.UsuarioIdLogado, ""); assert.equal(a.estado.PerfilUsuarioRemoto, null); assert.deepEqual(a.estado.ObrasFavoritas, []);
  a.cleanup(); const eventos = a.eventos.length; a.getUser.resolve({ data: { user: { id: A } } }); await tick();
  assert.equal(a.eventos.length, eventos); assert.equal(a.saiu(), true);
});

test("falha de A durante carga B não termina loading nem exibe erro de A", async t => {
  const p = perfil(t), a = adiar(), b = adiar(); p.config.perfis.set(A, a.promise); p.config.perfis.set(B, b.promise);
  p.render(); p.commit(); await tick(); p.render({ queryPerfilAtual: `autorId=${B}` }); p.commit(); await tick();
  a.reject(new Error("rede antiga")); await tick(); assert.equal(p.estado.Carregando, true); assert.equal(p.render().erroCarregamento, false);
  b.resolve({ userId: B }); await tick(); assert.equal(p.estado.Carregando, false); assert.equal(p.estado.PerfilUsuarioRemoto.userId, B);
});

test("carregamento reinicia conteúdos derivados e não aplica dados após unmount", async t => {
  const p = perfil(t), gate = adiar(); let diario = { privado: "A" }, comunidade = { autor: "A" };
  p.props.limparEstadoPerfilAnterior = () => { diario = null; comunidade = null; };
  p.config.perfis.set(A, gate.promise); p.render(); p.commit(); await tick();
  assert.equal(diario, null); assert.equal(comunidade, null); p.cleanup();
  const gravacoes = [...p.gravacoes]; gate.resolve({ userId: A }); await tick();
  assert.equal(p.estado.PerfilUsuarioRemoto, null); assert.deepEqual(p.gravacoes, gravacoes);
});

test("privacidade: mudança de versão A/B/A e relacionamento invalidam contexto; cleanup rejeita resposta", async () => {
  const p = privacidade(); p.render(); p.commit(); await tick(); assert.equal(p.render(), true);
  p.props.identidadeAutenticadaPerfilRef.current = { usuarioId: A, versao: 3 };
  assert.equal(p.render({ versaoIdentidade: 3 }), false); p.commit(); await tick();
  const gate = adiar(); p.config.gates.set(B, gate.promise);
  assert.equal(p.render({ estadoRelacionamentoPerfil: "seguindo" }), false); p.commit(); await tick(); p.cleanup();
  const antes = p.estado.PermissoesAbasPerfil; gate.resolve(constants.PERMISSOES_ABAS_PERFIL_PROPRIO); await tick();
  assert.deepEqual(p.estado.PermissoesAbasPerfil, antes);
});

test("resolução mantém links legados por nome e propriedade somente do autor efetivamente exibido", () => {
  const r = resolverEstadoPerfilAutor({ perfisAutores: [autor(B, "Nome")], autorSelecionado: "Nome", autorIdSelecionado: "", usuarioIdLogado: A,
    perfilUsuarioRemotoComoAutor: null, autenticacaoCarregada: true }); assert.equal(r.perfilParaMostrar.autorId, B); assert.equal(r.perfilPertenceAoUsuario, false);
  const proprio = resolverEstadoPerfilAutor({ perfisAutores: [autor(A, "Meu")], autorSelecionado: "", autorIdSelecionado: "", usuarioIdLogado: A,
    perfilUsuarioRemotoComoAutor: null, autenticacaoCarregada: true }); assert.equal(proprio.perfilParaMostrar.autorId, A); assert.equal(proprio.perfilPertenceAoUsuario, true);
});

test("próprio A → terceiro B → próprio A exige nova resposta de A antes de reabrir informações", async t => {
  const p = perfil(t); p.render(); p.commit(); await tick(); const gate = adiar();
  p.config.perfis.set(B, gate.promise); p.render({ queryPerfilAtual: `autorId=${B}` }); p.commit(); await tick();
  const a = adiar(); p.config.perfis.set(A, a.promise);
  assert.equal(p.render({ queryPerfilAtual: `autorId=${A}` }).carregamentoAtual, false); p.commit(); await tick();
  assert.equal(p.estado.PerfilUsuarioRemoto, null); gate.resolve({ userId: B }); await tick(); assert.equal(p.estado.Carregando, true);
  a.resolve({ userId: A }); await tick(); assert.equal(p.estado.PerfilUsuarioRemoto.userId, A); assert.equal(p.render().carregamentoAtual, true);
});

test("permissões de perfil próprio não permanecem liberadas ao navegar para terceiro", async () => {
  const p = privacidade(); p.render({ perfilAutorId: A, perfilPertenceAoUsuario: true }); p.commit(); await tick();
  assert.equal(p.estado.PermissoesAbasPerfil.biblioteca, true);
  const gate = adiar(); p.config.gates.set(B, gate.promise);
  assert.equal(p.render({ perfilAutorId: B, perfilPertenceAoUsuario: false }), false); p.commit(); await tick();
  assert.equal(p.estado.PermissoesAbasPerfil.biblioteca, false);
  gate.resolve(constants.PERMISSOES_ABAS_PERFIL_PADRAO); await tick(); assert.equal(p.render(), true); p.cleanup();
});

test("falha das RPCs não certifica permissões públicas nem consulta cache privado de terceiro", async t => {
  const chamadas = [];
  const supabase = { rpc: async (nome, args) => {
    chamadas.push([nome, args]); return { data: null, error: { message: "rede" } };
  } };
  const privacy = load("lib/historietasPrivacy.ts", { "./supabase/client": { supabase } });
  const { carregarPermissoesAbasPerfilConfirmadas } = load("app/perfil-autor/lib/profile-tab-permissions-loader.ts", {
    "../../../lib/supabase/client": { supabase },
  });
  const anterior = { window: globalThis.window, localStorage: globalThis.localStorage };
  globalThis.window = {};
  globalThis.localStorage = { getItem() { assert.fail("preferências privadas locais não são fallback de outro perfil"); } };
  t.after(() => { globalThis.window = anterior.window; globalThis.localStorage = anterior.localStorage; });
  const p = privacidade(privacy, carregarPermissoesAbasPerfilConfirmadas); p.render(); p.commit(); await tick();
  assert.deepEqual(chamadas, [
    ["carregar_preferencias_privacidade_publicas", { p_user_id: B }],
    ["carregar_permissoes_abas_perfil", { p_user_id: B }],
  ]);
  assert.equal(p.estado.PrivacidadePerfilCarregando, false);
  assert.ok(Object.values(p.estado.PermissoesAbasPerfil).every(valor => valor === false));
  assert.equal(p.resultado().erroPrivacidade, true); assert.equal(p.render(), false); p.cleanup();
});

for (const [nome, alvo, owner, fonteEsperada, privados] of [
  ["terceiro com Biblioteca visível", B, false, B, false],
  ["flag de proprietário obsoleta", B, true, B, false],
  ["próprio perfil", A, true, A, true],
]) {
  test(`Diário/Biblioteca usa identidade do perfil: ${nome}`, async t => {
    const h = hooks(), chamadas = [], jobs = []; let locais = 0, estado;
    const anterior = globalThis.window; globalThis.window = { setTimeout(fn) { jobs.push(fn); return jobs.length; }, clearTimeout() {} };
    t.after(() => { h.cleanup(); globalThis.window = anterior; });
    const vazio = constants.diarioPerfilVazio;
    const { usePerfilAutorDiarySync } = load("app/perfil-autor/hooks/use-perfil-autor-diary-sync.ts", {
      react: h.react, "../constants": constants,
      "../lib/profile-diary-loader": { carregarDiarioPerfilSupabase: async (...args) => { chamadas.push(args); return vazio; } },
      "../lib/profile-diary-local-utils": { montarDiarioPerfilLocal: () => { locais++; return vazio; } },
      "../lib/profile-diary-record-utils": { criarEstadoDiarioPerfilVazio: () => vazio },
      "../lib/profile-diary-merge-utils": { mesclarDiarioPerfilComLocal: remoto => remoto },
    });
    h.render(() => Reflect.apply(usePerfilAutorDiarySync, null, [{ perfilParaMostrar: { autorId: alvo, nome }, obras: [], obrasFavoritas: ["privada-A"], obrasConcluidas: [],
      obrasSeguidasBiblioteca: [], podeEditarPerfil: owner, bibliotecaPerfilVisivel: true, abaPerfil: "biblioteca", usuarioIdLogado: A,
      versaoSincronizacaoBiblioteca: 0, permissoesAbasPerfil: constants.PERMISSOES_ABAS_PERFIL_PROPRIO, diarioPerfilVisivel: true,
      atividadesPerfilVisivel: true, setDiarioPerfil: valor => { estado = valor; } }]));
    h.commit(); jobs[0](); await tick();
    assert.equal(chamadas[0][0], fonteEsperada); assert.equal(chamadas[0][2], privados);
    assert.equal(locais, privados ? 1 : 0, "cache privado só participa do próprio perfil"); assert.equal(estado.carregando, false);
  });
}

test("permissões confirmadas preservam todos os valores da RPC e rejeitam dados incompletos", async () => {
  const permitidas = { obras: true, sobre: false, diario: true, comunidade: false, biblioteca: true, atividades: false };
  for (const data of [permitidas, null, [], { ...permitidas, sobre: undefined }, { ...permitidas, biblioteca: "true" }]) {
    const chamadas = [];
    const { carregarPermissoesAbasPerfilConfirmadas } = load("app/perfil-autor/lib/profile-tab-permissions-loader.ts", {
      "../../../lib/supabase/client": { supabase: { rpc: async (...args) => { chamadas.push(args); return { data, error: null }; } } },
    });
    if (data === permitidas) assert.deepEqual(await carregarPermissoesAbasPerfilConfirmadas(B), permitidas);
    else await assert.rejects(carregarPermissoesAbasPerfilConfirmadas(B), /não confirmadas/);
    assert.deepEqual(chamadas, [["carregar_permissoes_abas_perfil", { p_user_id: B }]]);
  }
});

test("privacidade indisponível recupera no próximo contexto sem reter erro ou permissão anterior", async () => {
  const p = privacidade(); p.config.falhas = true; p.render(); p.commit(); await tick();
  assert.equal(p.resultado().erroPrivacidade, true); assert.equal(p.estado.PrivacidadePerfilCarregando, false);
  p.config.falhas = false; p.config.gates.set(C, Promise.resolve(constants.PERMISSOES_ABAS_PERFIL_PADRAO));
  p.render({ perfilAutorId: C }); p.commit(); await tick();
  assert.equal(p.render(), true); assert.equal(p.resultado().erroPrivacidade, false); p.cleanup();
});

test("página inteira aguarda a privacidade atual e mostra erro sem revelar o perfil em falha", () => {
  const { obterEstadoVisualPaginaPerfilAutor } = load("app/perfil-autor/lib/profile-page-view-state.ts");
  const base = { carregando: false, redirecionandoParaLogin: false, autorNaoEncontrado: false, perfilParaMostrar: autor(B, "Bio privada") };
  assert.equal(obterEstadoVisualPaginaPerfilAutor({ ...base, privacidadeAtual: false }), "carregando");
  assert.equal(obterEstadoVisualPaginaPerfilAutor({ ...base, carregamentoAtual: false }), "carregando");
  assert.equal(obterEstadoVisualPaginaPerfilAutor({ ...base, privacidadeAtual: false, erroPrivacidade: true }), "erro-carregamento");
  assert.equal(obterEstadoVisualPaginaPerfilAutor({ ...base, erroCarregamento: true }), "erro-carregamento");
  assert.equal(obterEstadoVisualPaginaPerfilAutor({ ...base, privacidadeAtual: true }), "pronto");
});
