import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadApplicationModule } from "../helpers/load-application-module.mjs";

const tick = () => new Promise(resolve => setImmediate(resolve));
function adiar() {
  let resolve, reject;
  const promise = new Promise((r, j) => { resolve = r; reject = j; });
  return { promise, resolve, reject };
}
function ambiente(t, { falharStorage = false } = {}) {
  const originais = Object.fromEntries(["window", "localStorage", "CustomEvent"].map(nome => [nome, Object.getOwnPropertyDescriptor(globalThis, nome)]));
  const dados = new Map();
  const eventos = [];
  Object.assign(globalThis, {
    window: { dispatchEvent: evento => eventos.push(evento) },
    localStorage: {
      getItem: chave => dados.get(chave) ?? null,
      setItem(chave, valor) { if (falharStorage) throw new Error("Quota"); dados.set(chave, valor); },
    },
    CustomEvent: class { constructor(type, opcoes) { this.type = type; this.detail = opcoes.detail; } },
  });
  t.after(() => {
    for (const [nome, descriptor] of Object.entries(originais)) {
      if (descriptor) Object.defineProperty(globalThis, nome, descriptor);
      else delete globalThis[nome];
    }
  });
  return { dados, eventos };
}
function privacidade(t, opcoes) {
  const dom = ambiente(t, opcoes);
  const chamadas = [];
  const supabase = { from(tabela) {
    assert.equal(tabela, "preferencias_privacidade");
    return { upsert(payload, opcoes) {
      const resposta = adiar();
      chamadas.push({ payload, opcoes, resposta });
      const consulta = {
        select() { return consulta; }, single() { return resposta.promise; },
        then(resolve, reject) { return resposta.promise.then(resolve, reject); },
      };
      return consulta;
    } };
  } };
  const modulo = loadApplicationModule("app/configuracoes/lib/configuracoes-privacy-preferences.ts", {
    "../../../lib/supabase/client": { supabase },
  });
  return { ...dom, ...modulo, chamadas,
    confirmar(indice) { const chamada = chamadas[indice]; chamada.resposta.resolve({ data: chamada.payload, error: null }); },
  };
}

test("falha local não publica evento de preferências salvas", t => {
  const c = ambiente(t, { falharStorage: true });
  const conta = loadApplicationModule("app/configuracoes/lib/configuracoes-account-preferences.ts");
  const ok = conta.salvarPreferencias({ nomeExibicao: "Ana", username: "ana", emailContato: "", receberAvisos: false }, "A");
  assert.equal(ok, false);
  assert.equal(c.eventos.length, 0);
});

test("privacidade só atualiza cache e evento após confirmação remota", async t => {
  const c = privacidade(t);
  const tarefa = c.salvarPreferenciasPrivacidade({ ...c.preferenciasPrivacidadePadrao, perfilPrivado: true }, "A");
  await tick();
  assert.equal(c.eventos.length, 0);
  assert.equal(c.dados.size, 0);
  c.confirmar(0);
  assert.equal((await tarefa).ok, true);
  assert.equal(c.eventos.length, 1);
  assert.equal(JSON.parse(c.dados.get("historietas-privacidade:A")).perfilPrivado, true);
});

test("escritas rápidas são serializadas antes de chegar ao servidor", async t => {
  const c = privacidade(t);
  const a = c.salvarPreferenciasPrivacidade({ ...c.preferenciasPrivacidadePadrao, perfilPrivado: true }, "A");
  const b = c.salvarPreferenciasPrivacidade({ ...c.preferenciasPrivacidadePadrao, perfilPrivado: false }, "A");
  await tick();
  assert.equal(c.chamadas.length, 1);
  c.confirmar(0);
  await a;
  await tick();
  assert.equal(c.chamadas.length, 2);
  c.confirmar(1);
  await b;
  assert.equal(JSON.parse(c.dados.get("historietas-privacidade:A")).perfilPrivado, false);
});

function hooks(t) {
  const slots = [], efeitos = [];
  let indice = 0, pendentes = [];
  const react = {
    useRef(valor) { const i = indice++; return slots[i] ??= { current: valor }; },
    useState(inicial) {
      const i = indice++;
      if (!slots[i]) slots[i] = { valor: typeof inicial === "function" ? inicial() : inicial };
      return [slots[i].valor, novo => { slots[i].valor = typeof novo === "function" ? novo(slots[i].valor) : novo; }];
    },
    useEffect(callback, deps) {
      const i = indice++;
      if (!efeitos[i] || !deps || deps.some((valor, j) => !Object.is(valor, efeitos[i].deps[j]))) {
        pendentes.push(() => { efeitos[i]?.cleanup?.(); efeitos[i] = { deps, cleanup: callback() }; });
      }
    },
    useLayoutEffect(callback, deps) { react.useEffect(callback, deps); },
  };
  const desmontar = () => { for (const efeito of efeitos) efeito?.cleanup?.(); efeitos.length = 0; };
  t.after(desmontar);
  return { react, desmontar, render(callback) {
    indice = 0; pendentes = [];
    const resultado = callback();
    for (const efeito of pendentes) efeito();
    return resultado;
  } };
}
function acoes(t, { falharStorage = false } = {}) {
  const dom = ambiente(t, { falharStorage });
  const runtime = hooks(t);
  const chamadas = [], mensagens = [];
  const identidadeContaRef = { current: { usuarioId: "A", versao: 1 } };
  let preferencias = { nomeExibicao: "Ana", username: "ana", emailContato: "", receberAvisos: true };
  let privacidade = {
    perfilPrivado: false, aprovarNovosSeguidores: false, visibilidadeObras: "publico", visibilidadeSobre: "publico",
    visibilidadeDiario: "publico", visibilidadeComunidade: "publico", visibilidadeBiblioteca: "somente_eu",
    visibilidadeAtividades: "seguidores", quemPodeComentarDiario: "seguidores", visibilidadeAvaliacaoDiario: "publico",
    mostrarAvaliacaoDiario: true, permitirAvaliacaoDiario: true, quemPodeAvaliarDiario: "seguidores",
  };
  const modulo = loadApplicationModule("app/configuracoes/hooks/use-configuracoes-preference-actions.ts", {
    react: runtime.react,
    "../lib/configuracoes-privacy-preferences": { salvarPreferenciasPrivacidade(desejada, userId, opcoes) {
      const resposta = adiar(); chamadas.push({ desejada, userId, opcoes, resposta }); return resposta.promise;
    } },
  });
  const setters = {
    setPreferencias: valor => { preferencias = typeof valor === "function" ? valor(preferencias) : valor; },
    setPrivacidade: valor => { privacidade = typeof valor === "function" ? valor(privacidade) : valor; },
    setMensagemAcao: valor => { if (valor) mensagens.push(valor); },
    mostrarMensagemAcao: (...args) => mensagens.push(args), traduzirTexto: pt => pt,
  };
  let usuarioIdLogado = "A";
  return { ...dom, chamadas, mensagens, identidadeContaRef, desmontar: runtime.desmontar,
    get preferencias() { return preferencias; }, get privacidade() { return privacidade; },
    trocarConta(id) { identidadeContaRef.current = { usuarioId: id, versao: identidadeContaRef.current.versao + 1 }; usuarioIdLogado = id; },
    render() { return runtime.render(() => modulo.useConfiguracoesPreferenceActions({
      preferencias, privacidade, usuarioIdLogado, identidadeContaRef, ...setters,
    })); },
    confirmar(indice, valores = chamadas[indice].desejada) { chamadas[indice].resposta.resolve({ ok: true, preferencias: valores }); },
  };
}

test("avisos: dois acionamentos no mesmo render se compõem e preservam campos editados", t => {
  const c = acoes(t);
  const acao = c.render();
  acao.atualizarPreferencia("nomeExibicao", "Novo nome");
  acao.alternarReceberAvisos();
  acao.alternarReceberAvisos();
  assert.equal(c.preferencias.receberAvisos, true);
  assert.equal(c.preferencias.nomeExibicao, "Novo nome");
  assert.equal(JSON.parse(c.dados.get("historietas-configuracoes-conta:A")).receberAvisos, true);
});

test("avisos: falha de storage mantém valor confirmado e mostra erro", t => {
  const c = acoes(t, { falharStorage: true });
  c.render().alternarReceberAvisos();
  assert.equal(c.preferencias.receberAvisos, true);
  assert.equal(c.eventos.length, 0);
  assert.equal(c.mensagens.at(-1)[0], "erro");
});

test("privacidade: toggles rápidos usam intenção atual e resposta antiga não substitui nova escolha", async t => {
  const c = acoes(t);
  const acao = c.render();
  acao.alternarPerfilPrivado();
  acao.alternarPerfilPrivado();
  assert.deepEqual(c.chamadas.map(c => c.desejada.perfilPrivado), [true, false]);
  assert.equal(c.privacidade.aprovarNovosSeguidores, true);
  assert.equal(c.render().statusPrivacidade, "salvando");
  c.confirmar(0);
  await tick();
  assert.equal(c.privacidade.perfilPrivado, false);
  assert.equal(c.render().statusPrivacidade, "salvando");
  c.confirmar(1);
  await tick();
  assert.equal(c.render().statusPrivacidade, "");
});

test("selects compostos no mesmo render preservam campos alterados independentemente", t => {
  const c = acoes(t);
  const acao = c.render(), antes = c.privacidade;
  acao.atualizarPrivacidade("visibilidadeObras", "somente_eu");
  acao.aplicarPrivacidadeAtualizada({ ...antes, quemPodeAvaliarDiario: "ninguem", permitirAvaliacaoDiario: false });
  assert.equal(c.chamadas.at(-1).desejada.visibilidadeObras, "somente_eu");
  assert.equal(c.chamadas.at(-1).desejada.quemPodeAvaliarDiario, "ninguem");
});

test("falha da última gravação restaura último confirmado, mantém erro e permite recuperação", async t => {
  const c = acoes(t);
  c.render().alternarPerfilPrivado();
  c.chamadas[0].resposta.resolve({ ok: false, erro: "Offline" });
  await tick();
  assert.equal(c.privacidade.perfilPrivado, false);
  assert.equal(c.render().statusPrivacidade, "erro");
  c.render().tentarSalvarPrivacidadeNovamente();
  assert.equal(c.chamadas[1].desejada.perfilPrivado, true);
  c.confirmar(1);
  await tick();
  assert.equal(c.privacidade.perfilPrivado, true);
  assert.equal(c.render().statusPrivacidade, "");
});

test("falha antiga não produz erro após gravação mais nova confirmada", async t => {
  const c = acoes(t);
  const acao = c.render();
  acao.alternarPerfilPrivado(); acao.atualizarPrivacidade("visibilidadeObras", "somente_eu");
  c.chamadas[0].resposta.resolve({ ok: false, erro: "Antigo" });
  await tick();
  assert.equal(c.render().statusPrivacidade, "salvando");
  c.confirmar(1);
  await tick();
  assert.equal(c.privacidade.visibilidadeObras, "somente_eu");
  assert.equal(c.render().statusPrivacidade, "");
});

test("troca de conta, ABA e unmount invalidam respostas e callbacks anteriores", async t => {
  const c = acoes(t);
  const acaoA = c.render(); acaoA.alternarPerfilPrivado();
  c.trocarConta("B"); c.render();
  assert.equal(c.chamadas[0].opcoes.execucaoEstaAtual(), false);
  acaoA.alternarReceberAvisos();
  assert.equal(c.dados.size, 0);
  c.trocarConta("A"); c.render();
  c.chamadas[0].resposta.resolve({ ok: false, erro: "A antiga" });
  await tick();
  assert.equal(c.render().statusPrivacidade, "");
  c.render().alternarPerfilPrivado();
  c.desmontar();
  assert.equal(c.chamadas[1].opcoes.execucaoEstaAtual(), false);
  c.chamadas[1].resposta.resolve({ ok: false, erro: "Após unmount" });
  await tick();
  assert.equal(c.mensagens.length, 0);
});

test("dados locais inválidos não quebram carregamento nem usam chave de outra conta", t => {
  const c = ambiente(t);
  const conta = loadApplicationModule("app/configuracoes/lib/configuracoes-account-preferences.ts");
  const padrao = { nomeExibicao: "", username: "", emailContato: "", receberAvisos: true };
  for (const valor of ["{", "null", "[]", "42", '"texto"']) {
    c.dados.set("historietas-configuracoes-conta:A", valor);
    assert.deepEqual(conta.carregarPreferencias("A"), padrao);
  }
  c.dados.set("historietas-configuracoes-conta:A", JSON.stringify({ nomeExibicao: 2, username: " @Ana Silva! ", emailContato: {}, receberAvisos: "false" }));
  const carregadas = conta.carregarPreferencias(" A ");
  assert.equal(carregadas.receberAvisos, true);
  assert.equal(carregadas.nomeExibicao, "");
  assert.equal(carregadas.username, "ana.silva");
  assert.deepEqual(conta.carregarPreferencias("B"), padrao);
  assert.equal(conta.salvarPreferencias(padrao, " "), false);
  assert.equal(c.eventos.length, 0);
});

test("erro remoto não muda cache, não emite evento e não repete escrita sem motivo de schema", async t => {
  const c = privacidade(t);
  c.dados.set("historietas-privacidade:A", "confirmado");
  const tarefa = c.salvarPreferenciasPrivacidade(c.preferenciasPrivacidadePadrao, "A");
  await tick();
  c.chamadas[0].resposta.resolve({ error: { code: "42501", message: "negado" }, data: null });
  assert.equal((await tarefa).ok, false);
  assert.equal(c.chamadas.length, 1);
  assert.equal(c.dados.get("historietas-privacidade:A"), "confirmado");
  assert.equal(c.eventos.length, 0);
});

test("resposta sem linha confirmada não é sucesso", async t => {
  const c = privacidade(t);
  const tarefa = c.salvarPreferenciasPrivacidade(c.preferenciasPrivacidadePadrao, "A");
  await tick();
  c.chamadas[0].resposta.resolve({ data: null, error: null });
  assert.equal((await tarefa).ok, false);
  assert.equal(c.eventos.length, 0);
});

test("identidade invalida escrita enfileirada e publicação de resultado antigo", async t => {
  const c = privacidade(t);
  let atual = true;
  const opcoes = { execucaoEstaAtual: () => atual };
  const a = c.salvarPreferenciasPrivacidade(c.preferenciasPrivacidadePadrao, "A", opcoes);
  const b = c.salvarPreferenciasPrivacidade({ ...c.preferenciasPrivacidadePadrao, perfilPrivado: true }, "A", opcoes);
  await tick();
  atual = false;
  c.confirmar(0);
  await a;
  assert.equal((await b).ok, false);
  assert.equal(c.chamadas.length, 1);
  assert.equal(c.eventos.length, 0);
});

test("cache indisponível não invalida confirmação remota nem amplia payload", async t => {
  const c = privacidade(t, { falharStorage: true });
  const tarefa = c.salvarPreferenciasPrivacidade({ ...c.preferenciasPrivacidadePadrao, perfilPrivado: true }, " A ");
  await tick();
  assert.equal(c.chamadas[0].payload.user_id, "A");
  assert.deepEqual(c.chamadas[0].opcoes, { onConflict: "user_id" });
  c.confirmar(0);
  const resultado = await tarefa;
  assert.equal(resultado.ok, true);
  assert.equal(resultado.preferencias.perfilPrivado, true);
  assert.equal(c.eventos.length, 0);
});

test("compatibilidade legada não publica granularidade que o servidor não suporta", async t => {
  const c = privacidade(t);
  const tarefa = c.salvarPreferenciasPrivacidade({ ...c.preferenciasPrivacidadePadrao, visibilidadeAvaliacaoDiario: "seguidores" }, "A");
  await tick();
  c.chamadas[0].resposta.resolve({ error: { code: "PGRST204", message: "visibilidade_avaliacao_diario ausente" }, data: null });
  assert.equal((await tarefa).ok, false);
  assert.equal(c.chamadas.length, 1);
  assert.equal(c.eventos.length, 0);
});

test("compatibilidade legada preserva somente-eu e mantém serialização", async t => {
  const c = privacidade(t);
  const tarefa = c.salvarPreferenciasPrivacidade({ ...c.preferenciasPrivacidadePadrao, visibilidadeAvaliacaoDiario: "somente_eu" }, "A");
  await tick();
  c.chamadas[0].resposta.resolve({ error: { code: "PGRST204", message: "visibilidade_avaliacao_diario ausente" }, data: null });
  await tick();
  assert.equal(c.chamadas.length, 2);
  assert.equal("visibilidade_avaliacao_diario" in c.chamadas[1].payload, false);
  assert.equal(c.chamadas[1].payload.mostrar_avaliacao_diario, false);
  c.confirmar(1);
  assert.equal((await tarefa).preferencias.visibilidadeAvaliacaoDiario, "somente_eu");
});

function carga(t, { primeiraIdentidade } = {}) {
  ambiente(t);
  const runtime = hooks(t), eventos = [], cargas = [];
  let conta = { id: "A", email: "a@test", user_metadata: {} }, authCallback, primeira = true;
  const estado = {};
  const modulo = loadApplicationModule("app/configuracoes/hooks/use-configuracoes-initial-access.ts", {
    react: runtime.react,
    "../../../lib/supabase/client": { supabase: { auth: {
      async getUser() { if (primeira && primeiraIdentidade) { primeira = false; return primeiraIdentidade; } return { data: { user: conta }, error: null }; },
      onAuthStateChange(callback) { authCallback = callback; return { data: { subscription: { unsubscribe() { eventos.push("unsubscribe"); } } } }; },
    } } },
    "../lib/configuracoes-profile-supabase-loader": { carregarPerfilConfiguracoesSupabase: async id => ({ nome: id, username: id }) },
    "../lib/configuracoes-account-summary-supabase": { carregarResumoContaSupabase: async id => ({ dono: id }) },
    "../lib/configuracoes-blocked-users-loader": { listarUsuariosBloqueadosConfiguracoes: async () => [] },
    "../lib/configuracoes-privacy-preferences": { preferenciasPrivacidadePadrao: { perfilPrivado: false },
      carregarPreferenciasPrivacidade(id, opcoes) { const resposta = adiar(); cargas.push({ id, opcoes, resposta }); return resposta.promise; },
    },
  });
  const setters = Object.fromEntries(["Usuario", "Preferencias", "Privacidade", "Resumo", "VerificandoAcesso", "Salvando", "ErroUsername", "UsuariosBloqueados"].map(nome => ["set" + nome, valor => { estado[nome] = valor; eventos.push([nome, valor]); }]));
  const props = { router: { replace: url => eventos.push(["redirect", url]) }, ...setters };
  return { cargas, estado, eventos, desmontar: runtime.desmontar,
    render() { return runtime.render(() => modulo.useConfiguracoesInitialAccess(props)); },
    trocarConta(id) { conta = id ? { id, email: `${id}@test`, user_metadata: {} } : null; authCallback(conta ? "SIGNED_IN" : "SIGNED_OUT", conta ? { user: conta } : null); },
  };
}

test("carga atrasada de A não aplica privacidade após troca para B; token da mesma conta não recarrega", async t => {
  const c = carga(t);
  const acesso = c.render(); await tick();
  assert.equal(c.cargas[0].id, "A");
  c.trocarConta("B"); await tick();
  assert.equal(c.estado.Usuario, null);
  assert.equal(c.estado.Salvando, false);
  assert.equal(c.cargas[0].opcoes.execucaoEstaAtual(), false);
  assert.equal(acesso.identidadeContaRef.current.usuarioId, "B");
  c.cargas[1].resposta.resolve({ perfilPrivado: true }); await tick();
  c.cargas[0].resposta.resolve({ perfilPrivado: false }); await tick();
  assert.equal(c.estado.Usuario.id, "B");
  assert.equal(c.estado.Privacidade.perfilPrivado, true);
  c.trocarConta("B"); await tick();
  assert.equal(c.cargas.length, 2);
  c.desmontar();
  assert.ok(c.eventos.includes("unsubscribe"));
});

test("erro de carga não apresenta fallback como confirmado; retry recupera conta e preferências", async t => {
  const c = carga(t);
  c.render(); await tick();
  assert.equal(c.cargas[0].opcoes.exigirConfirmacao, true);
  c.cargas[0].resposta.reject(new Error("Offline"));
  await tick();
  let acesso = c.render();
  assert.equal(acesso.erroPreferencias, true);
  assert.equal(c.estado.Usuario, null);
  assert.ok(!c.eventos.some(e => e[0] === "redirect"));
  acesso.tentarCarregarPreferencias(); c.render(); await tick();
  c.cargas[1].resposta.resolve({ perfilPrivado: true }); await tick();
  acesso = c.render();
  assert.equal(acesso.erroPreferencias, false);
  assert.equal(c.estado.Usuario.id, "A");
});

test("logout invalida carga e preserva o redirecionamento existente", async t => {
  const c = carga(t);
  const acesso = c.render(); await tick();
  c.trocarConta(""); await tick();
  assert.equal(acesso.identidadeContaRef.current.usuarioId, "");
  c.cargas[0].resposta.resolve({ perfilPrivado: true }); await tick();
  assert.equal(c.estado.Usuario, null);
  assert.ok(c.eventos.some(e => e[0] === "redirect" && e[1].startsWith("/login?")));
});

function perfil(t, opcoes) {
  const dom = ambiente(t, opcoes);
  const respostaPerfil = adiar(), mensagens = [], metadata = [], gravacoesPrivacidade = [];
  const id = "11111111-1111-4111-8111-111111111111";
  const preferenciaInicial = { nomeExibicao: " Ana ", username: "ana", emailContato: " a@test ", receberAvisos: true };
  const estado = { preferencias: { ...preferenciaInicial }, usuario: { id, nome: "Ana", email: "a@test" }, salvando: false };
  let atual = true;
  const modulo = loadApplicationModule("app/configuracoes/lib/configuracoes-profile-save-action.ts", {
    "../../../lib/supabase/client": { supabase: { auth: {
      getUser: async () => ({ data: { user: { id } }, error: null }),
      updateUser: async dados => { metadata.push(dados); return { error: null }; },
    } } },
    "./configuracoes-profile-supabase-saver": { salvarPerfilConfiguracoesSupabase: () => respostaPerfil.promise },
    "./configuracoes-account-summary-supabase": { carregarResumoContaSupabase: async () => ({ obras: 2 }) },
    "./configuracoes-privacy-preferences": { salvarPreferenciasPrivacidade: (...args) => { gravacoesPrivacidade.push(args); } },
  });
  return { ...dom, estado, metadata, mensagens, id, respostaPerfil, gravacoesPrivacidade,
    invalidar() { atual = false; },
    salvar() { return modulo.salvarConfiguracoesPerfil({
      salvando: false, usuarioIdLogado: id, preferencias: preferenciaInicial, privacidade: { perfilPrivado: false }, usuario: estado.usuario,
      language: "pt-BR", redirecionarLogin() { throw new Error("redirecionamento inesperado"); },
      execucaoEstaAtual: () => atual, setMensagemAcao() {}, mostrarMensagemAcao: (...args) => mensagens.push(args), traduzirTexto: pt => pt,
      setErroUsername: valor => { estado.erro = valor; }, setSalvando: valor => { estado.salvando = valor; },
      setPreferencias: valor => { estado.preferencias = typeof valor === "function" ? valor(estado.preferencias) : valor; },
      setUsuario: valor => { estado.usuario = typeof valor === "function" ? valor(estado.usuario) : valor; },
      setResumo: valor => { estado.resumo = valor; },
    }); },
  };
}

test("salvar perfil não reenvia privacidade antiga nem desfaz aviso e edição feitos durante a requisição", async t => {
  const c = perfil(t);
  const tarefa = c.salvar(); await tick();
  c.estado.preferencias = { ...c.estado.preferencias, receberAvisos: false, nomeExibicao: "Editado depois" };
  c.dados.set(`historietas-configuracoes-conta:${c.id}`, JSON.stringify(c.estado.preferencias));
  c.respostaPerfil.resolve({ ok: true }); await tarefa;
  assert.equal(c.gravacoesPrivacidade.length, 0);
  assert.equal(c.estado.preferencias.receberAvisos, false);
  assert.equal(c.estado.preferencias.nomeExibicao, "Editado depois");
  assert.equal(JSON.parse(c.dados.get(`historietas-configuracoes-conta:${c.id}`)).receberAvisos, false);
  assert.deepEqual(c.mensagens.at(-1), ["sucesso", "Perfil salvo com sucesso."]);
});

test("perfil confirmado com falha local não apresenta todas as preferências como salvas", async t => {
  const c = perfil(t, { falharStorage: true });
  const tarefa = c.salvar(); await tick();
  c.respostaPerfil.resolve({ ok: true }); await tarefa;
  assert.equal(c.mensagens.at(-1)[0], "aviso");
  assert.match(c.mensagens.at(-1)[1], /não foi possível confirmar/);
  assert.equal(c.eventos.length, 0);
});

test("perfil atrasado da conta anterior não aplica metadata, cache, mensagem ou estado", async t => {
  const c = perfil(t);
  const tarefa = c.salvar(); await tick();
  const antes = structuredClone(c.estado);
  c.invalidar(); c.respostaPerfil.resolve({ ok: true }); await tarefa;
  assert.deepEqual(c.estado, antes);
  assert.equal(c.metadata.length, 0);
  assert.equal(c.mensagens.length, 0);
  assert.equal(c.dados.size, 0);
});

test("carregamento estrito diferencia erro, registro ausente e cache; leitura cancelada não publica evento", async t => {
  const dom = ambiente(t);
  dom.dados.set("historietas-privacidade:A", JSON.stringify({ perfilPrivado: true }));
  let resposta = { error: { message: "Offline" }, data: null };
  const modulo = loadApplicationModule("app/configuracoes/lib/configuracoes-privacy-preferences.ts", {
    "../../../lib/supabase/client": { supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => resposta }) }) }) } },
  });
  await assert.rejects(modulo.carregarPreferenciasPrivacidade("A", { exigirConfirmacao: true }), /Offline/);
  assert.equal((await modulo.carregarPreferenciasPrivacidade("A")).perfilPrivado, true); // API legada preservada.
  assert.equal(dom.eventos.length, 0);
  resposta = { error: null, data: null };
  assert.equal((await modulo.carregarPreferenciasPrivacidade("A", { exigirConfirmacao: true })).perfilPrivado, false);
  resposta = { error: null, data: { perfil_privado: true } };
  await assert.rejects(modulo.carregarPreferenciasPrivacidade("A", { exigirConfirmacao: true, execucaoEstaAtual: () => false }), /Conta alterada/);
  assert.equal(dom.eventos.length, 0);
});

test("confirmação mais antiga não volta a ser base de recuperação após confirmação nova", async t => {
  const c = acoes(t);
  const acao = c.render();
  acao.atualizarPrivacidade("visibilidadeObras", "seguidores");
  acao.atualizarPrivacidade("visibilidadeObras", "somente_eu");
  c.confirmar(1); await tick();
  c.confirmar(0); await tick();
  c.render().atualizarPrivacidade("visibilidadeSobre", "somente_eu");
  c.chamadas[2].resposta.resolve({ ok: false, erro: "Offline" }); await tick();
  assert.equal(c.privacidade.visibilidadeObras, "somente_eu");
  assert.equal(c.render().statusPrivacidade, "erro");
});

test("SIGNED_OUT invalida até a identidade inicial ainda desconhecida", async t => {
  const respostaAuth = adiar();
  const c = carga(t, { primeiraIdentidade: respostaAuth.promise });
  c.render();
  c.trocarConta(""); await tick();
  respostaAuth.resolve({ data: { user: { id: "A", email: "a@test", user_metadata: {} } }, error: null }); await tick();
  assert.equal(c.cargas.length, 0);
  assert.equal(c.estado.Usuario, null);
  assert.ok(c.eventos.some(e => e[0] === "redirect"));
});

test("retorno A → B → A não reaplica a carga da primeira sessão de A", async t => {
  const c = carga(t);
  c.render(); await tick();
  c.trocarConta("B"); await tick(); c.trocarConta("A"); await tick();
  assert.equal(c.cargas.length, 3);
  c.cargas[2].resposta.resolve({ perfilPrivado: true }); await tick();
  c.cargas[0].resposta.resolve({ perfilPrivado: false }); c.cargas[1].resposta.resolve({ perfilPrivado: false }); await tick();
  assert.equal(c.estado.Usuario.id, "A");
  assert.equal(c.estado.Privacidade.perfilPrivado, true);
});

for (const [indiceIdioma, salvar, erro, retry] of [
  [0, "Salvando privacidade", "Não foi possível confirmar", "Tentar novamente"],
  [1, "Saving privacy", "Could not confirm", "Try again"],
  [2, "Guardando privacidad", "No se pudo confirmar", "Intentar de nuevo"],
]) {
  test(`feedback acessível no idioma ${indiceIdioma}: pendência, falha, recuperação e carga sem confirmação`, () => {
    let statusPrivacidade = "salvando", erroPreferencias = false;
    const { default: Pagina } = loadApplicationModule("app/configuracoes/page.tsx", {
      "next/navigation": { useRouter: () => ({}) },
      "../../lib/historietasTheme": { historietasThemeCss: "" },
      "./components/configuracoes-page-content": { ConfiguracoesPageContent: () => React.createElement("section", null, "DADOS DA CONTA") },
      "./components/configuracoes-page-overlays": { ConfiguracoesPageOverlays: () => null },
      "./hooks/use-configuracoes-action-message": { useConfiguracoesActionMessage: () => ({}) },
      "./hooks/use-configuracoes-access-orchestration": { useConfiguracoesAccessOrchestration: () => ({ erroPreferencias, tentarCarregarPreferencias() {} }) },
      "./hooks/use-configuracoes-account-action-handlers": { useConfiguracoesAccountActionHandlers: () => ({}) },
      "./hooks/use-configuracoes-preference-actions": { useConfiguracoesPreferenceActions: () => ({ statusPrivacidade, tentarSalvarPrivacidadeNovamente() {} }) },
      "./hooks/use-configuracoes-page-presentation": { useConfiguracoesPagePresentation: () => ({ pageThemeStyle: {}, t: (...textos) => textos[indiceIdioma] }) },
      "./hooks/use-configuracoes-page-state": { useConfiguracoesPageState: () => ({ verificandoAcesso: false }) },
      "./hooks/use-configuracoes-security-modal-body-lock": { useConfiguracoesSecurityModalBodyLock() {} },
      "./hooks/use-configuracoes-security-modal-state": { useConfiguracoesSecurityModalState: () => ({}) },
    });
    const render = () => renderToStaticMarkup(React.createElement(Pagina));
    assert.match(render(), /role="status"/);
    assert.ok(render().includes(salvar));
    statusPrivacidade = "erro";
    assert.match(render(), /role="alert"/);
    assert.ok(render().includes(erro));
    assert.ok(render().includes(retry));
    assert.match(render(), /<button type="button"/);
    erroPreferencias = true;
    const html = render();
    assert.match(html, /role="alert"/);
    assert.ok(html.includes(retry));
    assert.ok(!html.includes("DADOS DA CONTA"));
  });
}

test("representação retornada diferente da escolha não confirma sucesso e preserva fonte remota", async t => {
  const c = privacidade(t);
  const tarefa = c.salvarPreferenciasPrivacidade({ ...c.preferenciasPrivacidadePadrao, perfilPrivado: true }, "A");
  await tick();
  c.chamadas[0].resposta.resolve({ data: { ...c.chamadas[0].payload, perfil_privado: false }, error: null });
  const resultado = await tarefa;
  assert.equal(resultado.ok, false);
  assert.equal(resultado.preferencias.perfilPrivado, false);
  assert.equal(JSON.parse(c.dados.get("historietas-privacidade:A")).perfilPrivado, false);
});

test("rejeição de transporte não bloqueia a próxima escrita nem produz cache especulativo", async t => {
  const c = privacidade(t);
  const a = c.salvarPreferenciasPrivacidade({ ...c.preferenciasPrivacidadePadrao, perfilPrivado: true }, "A");
  const b = c.salvarPreferenciasPrivacidade(c.preferenciasPrivacidadePadrao, "A");
  await tick();
  c.chamadas[0].resposta.reject(new Error("Offline"));
  assert.equal((await a).ok, false);
  await tick();
  assert.equal(c.chamadas.length, 2);
  assert.equal(c.eventos.length, 0);
  c.confirmar(1);
  assert.equal((await b).ok, true);
});

test("unmount durante carga impede aplicação de dados e encerra observação", async t => {
  const c = carga(t);
  c.render(); await tick();
  c.desmontar();
  const antes = structuredClone(c.estado);
  c.cargas[0].resposta.resolve({ perfilPrivado: true }); await tick();
  assert.deepEqual(c.estado, antes);
  assert.ok(c.eventos.includes("unsubscribe"));
});

test("retorno à conta aguarda escrita em voo antes de confirmar privacidade atual", async t => {
  ambiente(t);
  const escrita = adiar();
  let leituras = 0;
  let remoto = { user_id: "A", perfil_privado: true };
  const modulo = loadApplicationModule("app/configuracoes/lib/configuracoes-privacy-preferences.ts", {
    "../../../lib/supabase/client": { supabase: { from: () => ({
      upsert(payload) { return { select: () => ({ single: async () => { await escrita.promise; remoto = payload; return { error: null, data: remoto }; } }) }; },
      select: () => ({ eq: () => ({ maybeSingle: async () => { leituras++; return { error: null, data: remoto }; } }) }),
    }) } },
  });
  const salvar = modulo.salvarPreferenciasPrivacidade(modulo.preferenciasPrivacidadePadrao, "A");
  const carregar = modulo.carregarPreferenciasPrivacidade("A", { exigirConfirmacao: true });
  await tick();
  assert.equal(leituras, 0);
  escrita.resolve();
  await salvar;
  assert.equal((await carregar).perfilPrivado, false);
  assert.equal(leituras, 1);
});
