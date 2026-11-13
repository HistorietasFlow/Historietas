import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {adiarSeguindo, concluirMicrotarefasSeguindo as tick, criarSeguindoHookHarness} from "../helpers/seguindo-hook-harness.mjs";

const hook = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-data-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const carregamentoPagina = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-page-data-loading.ts",
    import.meta.url,
  ),
  "utf8",
);
const sincronizacaoInicial = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-page-initial-sync.ts",
    import.meta.url,
  ),
  "utf8",
);

function preparar(t) {
  const requests = [], preparations = [], saves = [];
  let erroLocal = false;
  const h = criarSeguindoHookHarness(t, "app/seguindo/hooks/use-seguindo-data-loader.ts", {
    "../lib/seguindo-local-data-utils": {
      carregarDadosLocaisSeguindo: userId => {
        if (erroLocal) throw new Error("Leitura local falhou");
        return {obras: [{id: `local-${userId}`}], obrasSeguidas: [`seguida-${userId}`], autoresSeguidos: [`Autor-${userId}`],
          obrasFavoritas: [`favorita-${userId}`], obrasConcluidas: [`concluida-${userId}`]};
      },
      salvarDadosLocaisSeguindo: value => saves.push(value),
    },
    "../lib/seguindo-remote-data-utils": {
      carregarDadosRemotosSeguindo: params => {const pending = adiarSeguindo(); requests.push({params, ...pending}); return pending.promise;},
      prepararDadosRemotosSeguindo: params => {const pending = adiarSeguindo(); preparations.push({params, ...pending}); return pending.promise;},
    },
  });
  const params = {perfilSocialId: "", usuarioLogadoId: "A"};
  for (const key of ["Obras", "ObrasSeguidas", "AutoresSeguidos", "UsuariosSeguidos", "UsuariosSeguidores", "SolicitacoesSeguidores",
    "SolicitacoesEnviadasIds", "AtividadesSeguindo", "ObrasFavoritas", "ObrasConcluidas", "Carregando"]) params[`set${key}`] = h.setter(key);
  t.mock.method(console, "warn", () => {});
  return {...h, params, requests, preparations, saves, falharLocal: () => {erroLocal = true;},
    render: (patch = {}) => {Object.assign(params, patch); return h.render(h.module.useSeguindoDataLoader, params);}};
}
const remoto = id => ({dadosSupabase: {}, usuariosSeguidosSupabase: [{id}], usuariosSeguidoresSupabase: [{id: `follower-${id}`}],
  solicitacoesSeguidoresSupabase: [{id: `recebida-${id}`}], solicitacoesEnviadasSupabase: [`enviada-${id}`]});
const preparado = id => ({obras: [{id}], obrasSeguidas: [id], obrasFavoritas: [`favorita-${id}`], obrasConcluidas: [`concluida-${id}`], atividades: [{id: `atividade-${id}`}]});

test("falha remota e falha na preparação são tratadas sem perder fallback nem persistir carga parcial", async t => {
  for (const etapa of ["remote", "preparacao"]) {
    const h = preparar(t), carregar = h.render();
    const promise = carregar(); h.advance();
    if (etapa === "remote") h.requests[0].reject(new Error("Rede"));
    else {
      h.requests[0].resolve(remoto("A")); await tick();
      h.preparations[0].reject(new Error("Atividades indisponíveis"));
    }
    await assert.doesNotReject(promise); h.advance();
    assert.deepEqual(h.state.Obras, [{id: "local-A"}]);
    assert.equal(h.state.Carregando, false);
    assert.deepEqual(h.saves, []);
  }
});

test("exceção local não deixa timer de loading preso nem rejeição sem tratamento", async t => {
  const h = preparar(t), carregar = h.render();
  h.falharLocal();
  await assert.doesNotReject(carregar()); h.advance();
  assert.equal(h.state.Carregando, false);
  assert.equal(h.requests.length, 0);
});

test("carga mais recente vence, incluindo timers locais e persistência por usuário", async t => {
  const h = preparar(t), carregar = h.render();
  const antiga = carregar(), atual = carregar();
  h.advance();
  h.requests[1].resolve(remoto("novo")); await tick();
  h.preparations[0].resolve(preparado("novo")); await atual; h.advance();
  const updates = h.updates.length;
  h.requests[0].resolve(remoto("velho")); await tick();
  for (const preparation of h.preparations.slice(1)) preparation.resolve(preparado("velho"));
  await antiga; h.advance();
  assert.equal(h.updates.length, updates);
  assert.deepEqual(h.state.UsuariosSeguidos, [{id: "novo"}]);
  assert.deepEqual(h.state.SolicitacoesEnviadasIds, ["enviada-novo"]);
  assert.equal(h.saves.length, 1);
  assert.deepEqual(h.saves[0], {userId: "A", obras: [{id: "novo"}], obrasSeguidas: ["novo"],
    autoresSeguidos: ["Autor-A"], obrasFavoritas: ["favorita-novo"], obrasConcluidas: ["concluida-novo"]});
});

test("troca de conta limpa estado social e invalida timers e respostas A→B→A", async t => {
  const h = preparar(t);
  const antiga = h.render()();
  h.state.UsuariosSeguidos = [{id: "antigo"}];
  const deB = h.render({usuarioLogadoId: "B"})(); h.advance();
  assert.deepEqual(h.state.UsuariosSeguidos, []);
  assert.deepEqual(h.state.SolicitacoesEnviadasIds, []);
  assert.deepEqual(h.state.Obras, [{id: "local-B"}]);
  const atual = h.render({usuarioLogadoId: "A"})(); h.advance();
  h.requests[2].resolve(remoto("atual")); await tick();
  h.preparations[0].resolve(preparado("atual")); await atual; h.advance();
  const updates = h.updates.length;
  h.requests[0].resolve(remoto("obsoleto")); h.requests[1].resolve(remoto("de-B")); await tick();
  for (const preparation of h.preparations.slice(1)) preparation.resolve(preparado("obsoleto"));
  await Promise.all([antiga, deB]); h.advance();
  assert.equal(h.updates.length, updates);
  assert.equal(h.saves.length, 1);
  assert.deepEqual(h.state.Obras, [{id: "atual"}]);
});

test("troca de perfil social invalida preparação antiga e não reaplica solicitações anteriores", async t => {
  const h = preparar(t);
  const antiga = h.render()(); h.advance();
  h.requests[0].resolve(remoto("antigo")); await tick();
  const atual = h.render({perfilSocialId: "outro-perfil"})(); h.advance();
  assert.deepEqual(h.state.SolicitacoesSeguidores, []);
  assert.deepEqual(h.state.ObrasSeguidas, []);
  h.preparations[0].resolve(preparado("antigo")); await antiga; h.advance();
  assert.equal(h.saves.length, 0);
  h.requests[1].resolve({...remoto("perfil"), solicitacoesSeguidoresSupabase: [], solicitacoesEnviadasSupabase: []}); await tick();
  h.preparations[1].resolve(preparado("perfil")); await atual; h.advance();
  assert.deepEqual(h.state.UsuariosSeguidos, [{id: "perfil"}]);
  assert.deepEqual(h.state.SolicitacoesEnviadasIds, []);
});

test("logout limpa dados da conta anterior sem iniciar carga ou persistência", async t => {
  const h = preparar(t), promise = h.render()(); h.advance();
  h.state.UsuariosSeguidos = [{id: "privado"}];
  h.state.SolicitacoesEnviadasIds = ["solicitacao-privada"];
  h.render({usuarioLogadoId: ""}); h.advance();
  assert.deepEqual(h.state.UsuariosSeguidos, []);
  assert.deepEqual(h.state.SolicitacoesEnviadasIds, []);
  assert.deepEqual(h.state.Obras, []);
  assert.equal(h.state.Carregando, false);
  h.requests[0].resolve(remoto("antigo")); await promise; h.advance();
  assert.equal(h.requests.length, 1);
  assert.equal(h.saves.length, 0);
});

test("desmontagem invalida timers locais, preparação e aplicação remota pendente", async t => {
  for (const fase of ["local", "preparacao", "aplicacao"]) {
    const h = preparar(t), carregar = h.render(), promise = carregar();
    if (fase !== "local") {h.advance(); h.requests[0].resolve(remoto("A")); await tick();}
    if (fase === "aplicacao") {h.preparations[0].resolve(preparado("A")); await promise;}
    h.unmount();
    const anteriores = h.updates.length, gravacoes = h.saves.length;
    h.advance();
    if (fase === "local") {h.requests[0].resolve(remoto("A")); await tick();}
    if (fase !== "aplicacao") {
      for (const preparation of h.preparations) preparation.resolve(preparado("A"));
      await promise; h.advance();
    }
    assert.equal(h.updates.length, anteriores);
    assert.equal(h.saves.length, gravacoes);
  }
});
test("hook preserva a orquestração local, remota e persistência", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /return useCallback\(async \(\) => \{/);
  assert.match(
    hook,
    /const dadosLocaisSeguindo = carregarDadosLocaisSeguindo\(usuarioLogadoId\);/,
  );
  assert.match(
    hook,
    /await carregarDadosRemotosSeguindo\(\{[\s\S]*?perfilSocialId,[\s\S]*?usuarioLogadoId/,
  );
  assert.match(
    hook,
    /await prepararDadosRemotosSeguindo\(\{[\s\S]*?dadosSupabase,[\s\S]*?usuariosSeguidosSupabase,[\s\S]*?usuarioLogadoId/,
  );
  assert.match(
    hook,
    /salvarDadosLocaisSeguindo\(\{[\s\S]*?userId: usuarioLogadoId/,
  );
  assert.match(hook, /setUsuariosSeguidos\(usuariosSeguidosSupabase\);/);
  assert.match(hook, /setUsuariosSeguidores\(usuariosSeguidoresSupabase\);/);
  assert.match(hook, /setAtividadesSeguindo\(atividadesSeguindoSupabase\);/);
  assert.match(hook, /setCarregando\(false\);/);
});

test("a página delega o carregamento principal à fronteira de dados", () => {
  assert.match(
    carregamentoPagina,
    /^"use client";/,
  );
  assert.match(
    carregamentoPagina,
    /import \{ useSeguindoDataLoader \} from "\.\/use-seguindo-data-loader";/,
  );
  assert.match(
    carregamentoPagina,
    /const carregarDadosSeguindo = useSeguindoDataLoader\(parametros\);/,
  );
  assert.match(
    sincronizacaoInicial,
    /import \{ useSeguindoPageDataLoading \} from "\.\/use-seguindo-page-data-loading";/,
  );
  assert.match(
    sincronizacaoInicial,
    /useSeguindoPageDataLoading\(\{[\s\S]*?perfilSocialId,[\s\S]*?usuarioLogadoId,[\s\S]*?setObras,[\s\S]*?setCarregando,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /import \{ useSeguindoPageInitialSync \} from "\.\/hooks\/use-seguindo-page-initial-sync";/,
  );
  assert.match(pagina, /useSeguindoPageInitialSync\(\{/);
  assert.doesNotMatch(pagina, /carregarDadosLocaisSeguindo/);
  assert.doesNotMatch(pagina, /carregarDadosRemotosSeguindo/);
  assert.doesNotMatch(pagina, /prepararDadosRemotosSeguindo/);
  assert.doesNotMatch(pagina, /salvarDadosLocaisSeguindo/);
  assert.match(
    pagina,
    /import \{ useSeguindoPageState \} from "\.\/hooks\/use-seguindo-page-state";/,
  );
  assert.match(
    pagina,
    /import \{ useSeguindoPageState \} from "\.\/hooks\/use-seguindo-page-state";/,
  );
});

