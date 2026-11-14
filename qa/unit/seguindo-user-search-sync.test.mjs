import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {adiarSeguindo, concluirMicrotarefasSeguindo as tick, criarSeguindoHookHarness} from "../helpers/seguindo-hook-harness.mjs";

const hook = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-user-search-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const interacoes = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-page-content-interactions.ts",
    import.meta.url,
  ),
  "utf8",
);

function preparar(t) {
  const requests = [];
  const h = criarSeguindoHookHarness(t, "app/seguindo/hooks/use-seguindo-user-search-sync.ts", {
    "../lib/seguindo-user-search-utils": {buscarUsuariosParaSeguirSupabase: termo => {
      const pending = adiarSeguindo(); requests.push({termo, ...pending}); return pending.promise;
    }},
  });
  const params = {busca: "ana", buscaSugestoesUsuariosAtiva: true, usuarioLogadoId: "A", usuariosSeguidos: [],
    setUsuariosSugestoesBusca: h.setter("usuarios"), setCarregandoUsuariosSugestoes: h.setter("carregando")};
  return {...h, params, requests, render: (patch = {}) => {
    Object.assign(params, patch); return h.render(h.module.useSeguindoUserSearchSync, params);
  }};
}

test("falha remota é tratada, limpa sugestões e encerra loading; próxima digitação recupera", async t => {
  const h = preparar(t);
  h.state.usuarios = [{id: "obsoleto"}];
  h.render(); h.advance(220);
  h.requests[0].reject(new Error("Falha remota"));
  await tick();
  assert.deepEqual(h.state.usuarios, []);
  assert.equal(h.state.carregando, false);
  h.render({busca: "bia"}); h.advance(220);
  h.requests[1].resolve([{id: "B", nome: "Bia"}]);
  await tick();
  assert.deepEqual(h.state.usuarios, [{id: "B", nome: "Bia"}]);
  assert.equal(h.state.carregando, false);
});

test("debounce conserva apenas o último termo e oculta resultados anteriores durante a espera", async t => {
  const h = preparar(t);
  h.state.usuarios = [{id: "antigo"}];
  h.render(); h.advance(100);
  h.render({busca: "bi"}); h.advance(100);
  h.render({busca: "bia"}); h.advance(0);
  assert.deepEqual(h.state.usuarios, []);
  assert.equal(h.state.carregando, true);
  assert.equal(h.requests.length, 0);
  h.advance(220);
  assert.deepEqual(h.requests.map(r => r.termo), ["bia"]);
  h.requests[0].resolve([{id: "B"}]); await tick();
  assert.equal(h.state.carregando, false);
});

for (const falha of [false, true]) {
  test(`resposta antiga ${falha ? "rejeitada" : "resolvida"} não altera resultado nem loading da busca atual`, async t => {
    const h = preparar(t);
    h.render(); h.advance(220);
    h.render({busca: "bia"}); h.advance(220);
    if (falha) h.requests[0].reject(new Error("Falha antiga"));
    else h.requests[0].resolve([{id: "antigo"}]);
    await tick();
    assert.equal(h.state.carregando, true);
    assert.deepEqual(h.state.usuarios, []);
    h.requests[1].resolve([{id: "atual"}]); await tick();
    assert.deepEqual(h.state.usuarios, [{id: "atual"}]);
    assert.equal(h.state.carregando, false);
  });
}

test("troca de usuário A→B→A invalida respostas e limpa sugestões da conta anterior", async t => {
  const h = preparar(t);
  h.render(); h.advance(220);
  h.state.usuarios = [{id: "da-conta-A"}];
  h.render({usuarioLogadoId: "B"}); h.advance(0);
  assert.deepEqual(h.state.usuarios, []);
  h.advance(220);
  h.render({usuarioLogadoId: "A"}); h.advance(220);
  h.requests[2].resolve([{id: "A"}, {id: "atual"}]); await tick();
  h.requests[0].resolve([{id: "antigo"}]); h.requests[1].resolve([{id: "de-B"}]); await tick();
  assert.deepEqual(h.state.usuarios, [{id: "atual"}]);
});

test("desativar, encurtar termo e logout encerram loading sem consulta nova", async t => {
  for (const patch of [{buscaSugestoesUsuariosAtiva: false}, {busca: "a", buscaSugestoesUsuariosAtiva: false},
    {usuarioLogadoId: ""}]) {
    const h = preparar(t);
    h.render(); h.advance(220);
    h.render(patch); h.advance(220);
    h.requests[0].resolve([{id: "antigo"}]); await tick();
    assert.equal(h.requests.length, 1);
    assert.deepEqual(h.state.usuarios, []);
    assert.equal(h.state.carregando, false);
  }
});

test("usuário atual e já seguidos continuam excluídos, inclusive após seguir durante a busca", async t => {
  const h = preparar(t);
  h.render(); h.advance(220);
  h.render({usuariosSeguidos: [{id: "B"}]}); h.advance(220);
  h.requests[0].resolve([{id: "A"}, {id: "B"}, {id: "C"}]);
  h.requests[1].resolve([{id: "A"}, {id: "B"}, {id: "C"}]); await tick();
  assert.deepEqual(h.state.usuarios, [{id: "C"}]);
});

test("desmontagem cancela debounce e ignora sucesso ou rejeição de requisição em voo", async t => {
  for (const fase of ["debounce", "sucesso", "erro"]) {
    const h = preparar(t);
    h.render();
    if (fase !== "debounce") h.advance(220);
    h.unmount();
    const anteriores = h.updates.length;
    h.advance(1000);
    if (fase === "sucesso") h.requests[0].resolve([{id: "tardio"}]);
    if (fase === "erro") h.requests[0].reject(new Error("Rejeição após desmontar"));
    await tick();
    assert.equal(h.updates.length, anteriores);
    assert.equal(h.requests.length, fase === "debounce" ? 0 : 1);
  }
});

test("hook preserva debounce, filtros, cancelamento e cleanup da busca", () => {
  assert.match(hook, /^"use client";/);
  assert.match(
    hook,
    /const timerBusca = window\.setTimeout\(/,
  );
  assert.match(
    hook,
    /buscaSugestoesUsuariosAtiva \? 220 : 0/,
  );
  assert.match(
    hook,
    /if \(!buscaSugestoesUsuariosAtiva \|\| !usuarioLogadoId\) \{[\s\S]*?setUsuariosSugestoesBusca\(\[\]\);[\s\S]*?setCarregandoUsuariosSugestoes\(false\);/,
  );
  assert.match(
    hook,
    /void buscarUsuariosParaSeguirSupabase\(busca\)/,
  );
  assert.match(
    hook,
    /const idsJaSeguidos = new Set\([\s\S]*?usuariosSeguidos\.map/,
  );
  assert.match(
    hook,
    /usuarioEncontrado\.id !== usuarioLogadoId[\s\S]*?!idsJaSeguidos\.has\(usuarioEncontrado\.id\)/,
  );
  assert.match(
    hook,
    /return \(\) => \{[\s\S]*?cancelado = true;[\s\S]*?window\.clearTimeout\(timerBusca\);[\s\S]*?\};/,
  );
});

test("página delega a busca de sugestões ao hook", () => {
  assert.match(
    interacoes,
    /import \{ useSeguindoUserSearchSync \} from "\.\/use-seguindo-user-search-sync";/,
  );
  assert.match(
    interacoes,
    /useSeguindoUserSearchSync\(\{[\s\S]*?busca,[\s\S]*?buscaSugestoesUsuariosAtiva,[\s\S]*?usuarioLogadoId,[\s\S]*?usuariosSeguidos,[\s\S]*?setUsuariosSugestoesBusca,[\s\S]*?setCarregandoUsuariosSugestoes,[\s\S]*?\}\);/,
  );
  assert.match(pagina, /useSeguindoPageContentInteractions\(/);
  assert.doesNotMatch(pagina, /buscarUsuariosParaSeguirSupabase/);
  assert.doesNotMatch(pagina, /const timerBusca = window\.setTimeout/);
});
