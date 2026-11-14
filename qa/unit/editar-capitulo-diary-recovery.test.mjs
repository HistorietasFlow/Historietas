import assert from "node:assert/strict";
import test from "node:test";
import {criarEdicaoHarness, adiarEdicao, tickEdicao} from "../helpers/editar-capitulo-save-harness.mjs";
const count = (h, name) => h.calls.filter(c => c === name).length;
const record = h => JSON.parse([...h.recovery.values()][0]);
const params = h => h.calls.filter(c => Array.isArray(c) && c[0] === "diario-params").map(c => c[1]);
test("sem migration/token no PATCH: salva e notifica, sem inferir token do GET", async t => {
  const h = criarEdicaoHarness(t, {publicado: true});
  h.params.referenciaRemota.diario_edicao_versao = "11111111-1111-4111-8111-111111111111";
  h.falhas.set("capitulos:update", write => {const r = write(); delete r.data[0].diario_edicao_versao; return r;});
  await h.save(); assert.equal(h.state.salvou, true); assert.equal(count(h, "capitulos:update"), 1);
  assert.equal(count(h, "diario"), 0); assert.equal(count(h, "notificacao"), 1); assert.deepEqual(record(h).diario, []);
});
for (const result of ["incerto", "indisponivel", "conflito"]) {
  test(`RPC ${result} preserva token e nunca repete capítulo ou notificação`, async t => {
    const h = criarEdicaoHarness(t, {publicado: true}); h.falhas.set("diario", () => result);
    await h.save(); const token = h.row.diario_edicao_versao;
    assert.equal(record(h).diario[0].versao, token); assert.equal(record(h).diario[0].estado, result);
    assert.equal(h.state.salvou, true); assert.match(h.state.erro, /capítulo foi salvo/);
    h.falhas.delete("diario"); await Promise.all([h.save(), h.save()]);
    assert.equal(count(h, "capitulos:update"), 1); assert.equal(count(h, "notificacao"), 1);
    assert.equal(count(h, "diario"), result === "conflito" ? 1 : 2);
    assert.equal(record(h).diario[0].estado, result === "conflito" ? "conflito" : "confirmado");
    for (const p of params(h)) assert.deepEqual(p, {capituloId: h.params.capituloId, versao: token});
  });
}
test("reabertura recupera somente RPC com token guardado, sem ler versão nova", async t => {
  const h = criarEdicaoHarness(t, {publicado: true}); h.falhas.set("diario", () => "incerto"); await h.save();
  const token = record(h).diario[0].versao; h.unmount(); h.falhas.delete("diario");
  const saved = h.state.obras[0];
  const save = h.render({referenciaRemota: {...h.row, diario_edicao_versao: "99999999-9999-4999-8999-999999999999"}, obras: h.state.obras, obraAtual: saved, capituloAtual: saved.capitulos[0]});
  await save({preventDefault() {}});
  assert.equal(count(h, "capitulos:update"), 1); assert.equal(count(h, "notificacao"), 1);
  assert.equal(params(h).at(-1).versao, token); assert.equal(record(h).diario[0].estado, "confirmado");
});
test("logout/A-B-A durante RPC conserva incerteza sem efeitos de outra identidade", async t => {
  const h = criarEdicaoHarness(t, {publicado: true}), pending = adiarEdicao(); h.falhas.set("diario", () => pending.promise);
  const saving = h.save(); await tickEdicao(); h.auth("B"); h.auth("A"); const before = h.calls.length;
  pending.resolve("confirmado"); await saving;
  assert.equal(record(h).diario[0].estado, "incerto"); assert.equal(count(h, "notificacao"), 0);
  assert.equal(h.calls.slice(before).includes("setSalvou"), false);
  await h.save(); assert.equal(count(h, "capitulos:update"), 1);
});
test("digitação durante RPC não perde rascunho nem token da intenção anterior", async t => {
  const h = criarEdicaoHarness(t, {publicado: true}), pending = adiarEdicao(); h.falhas.set("diario", () => pending.promise);
  const saving = h.save(); await tickEdicao();
  h.render({texto: "Novo rascunho privado enquanto a RPC continua pendente."});
  pending.resolve("confirmado"); await saving;
  assert.equal(record(h).texto, h.params.texto); assert.equal(h.state.salvou, false);
  assert.equal(record(h).diario[0].versao, h.row.diario_edicao_versao);
});
test("incerteza do PATCH com token aparente não autoriza RPC", async t => {
  const h = criarEdicaoHarness(t, {publicado: true}); h.falhas.set("capitulos:update", write => {write(); return {data: null, error: null};});
  await h.save(); await h.save(); assert.equal(count(h, "capitulos:update"), 1); assert.equal(count(h, "diario"), 0);
  assert.equal(record(h).estado, "incerto"); assert.deepEqual(record(h).diario, []);
});
test("intenção de Diário ilegível bloqueia escrita sem apagar recuperação", async t => {
  const h = criarEdicaoHarness(t, {publicado: true}), key = [...h.recovery.keys()][0];
  const corrupt = {...record(h), diario: [{versao: "invalida", estado: "incerto"}]};
  h.recovery.set(key, JSON.stringify(corrupt)); await h.save();
  assert.equal(count(h, "capitulos:update"), 0); assert.equal(h.recovery.get(key), JSON.stringify(corrupt));
});

test("nova edição preserva intenção anterior e usa token distinto retornado pelo segundo PATCH", async t => {
  const h = criarEdicaoHarness(t, {publicado: true}); h.falhas.set("diario", () => "incerto"); await h.save();
  const first = record(h).diario[0].versao;
  const saved = h.state.obras[0];
  const save = h.render({obras: h.state.obras, obraAtual: saved, capituloAtual: saved.capitulos[0], texto: "Uma segunda edição privada com texto diferente e suficientemente longo."});
  await save({preventDefault() {}});
  assert.equal(count(h, "capitulos:update"), 2); assert.equal(count(h, "notificacao"), 2);
  assert.equal(record(h).diario.length, 2); assert.equal(record(h).diario[0].versao, first);
  assert.notEqual(record(h).diario[1].versao, first);
  assert.equal(count(h, "diario"), 3, "uma tentativa por intenção em cada ação explícita, sem replay imediato");
});
test("quota antes da RPC conserva confirmação remota em memória sem outro UPDATE", async t => {
  const h = criarEdicaoHarness(t, {publicado: true});
  h.falhas.set("capitulos:update", write => {const result = write(); h.falhas.set("recovery", true); return result;});
  await h.save(); assert.equal(count(h, "capitulos:update"), 1); assert.equal(count(h, "diario"), 0);
  h.falhas.delete("recovery"); h.falhas.delete("capitulos:update"); await h.save();
  assert.equal(count(h, "capitulos:update"), 1); assert.equal(count(h, "diario"), 1);
  assert.equal(record(h).diario[0].versao, h.row.diario_edicao_versao);
});
test("revalidação de conta falha após a RPC: estado permanece incerto e não notifica", async t => {
  const h = criarEdicaoHarness(t, {publicado: true});
  h.falhas.set("diario", () => {h.falhas.set("auth", () => ({data: {user: {id: "B"}}, error: null})); return "confirmado";});
  await h.save(); assert.equal(record(h).diario[0].estado, "incerto");
  assert.equal(count(h, "notificacao"), 0); assert.equal(h.state.salvou, false); assert.equal(count(h, "capitulos:update"), 1);
});

test("draft guarda token sem RPC ou aviso de falha e preserva publicação", async t => {
  const h = criarEdicaoHarness(t); await h.save();
  assert.equal(h.row.publicado, false); assert.equal(h.state.salvou, true); assert.equal(h.state.erro, "");
  assert.equal(count(h, "diario"), 0); assert.equal(record(h).diario[0].versao, h.row.diario_edicao_versao);
  assert.equal(record(h).diario[0].estado, "inelegivel");
});

test("GET indisponível na reabertura não autoriza repetir PATCH já confirmado", async t => {
  const h = criarEdicaoHarness(t, {publicado: true}); h.falhas.set("diario", () => "incerto"); await h.save();
  const token = record(h).diario[0].versao; h.unmount(); h.falhas.delete("diario");
  const saved = h.state.obras[0];
  const save = h.render({referenciaRemota: null, obras: h.state.obras, obraAtual: saved, capituloAtual: saved.capitulos[0]});
  await save({preventDefault() {}});
  assert.equal(count(h, "capitulos:update"), 1); assert.equal(count(h, "notificacao"), 1);
  assert.equal(params(h).at(-1).versao, token); assert.equal(record(h).diario[0].estado, "confirmado");
});
test("erro antes de outra edição não apaga a confirmação da intenção anterior", async t => {
  const h = criarEdicaoHarness(t, {publicado: true}); h.falhas.set("diario", () => "incerto"); await h.save();
  const originalTitle = h.params.titulo, originalText = h.params.texto, saved = h.state.obras[0];
  const saveNew = h.render({texto: "Outra tentativa de edição que falha antes de gravar.", obras: h.state.obras, obraAtual: saved, capituloAtual: saved.capitulos[0]});
  h.falhas.set("obras:select", () => ({data: null, error: {message: "Sem rede"}}));
  await saveNew({preventDefault() {}}); assert.equal(record(h).estado, "pronto"); assert.equal(record(h).escritaConfirmada, true);
  h.unmount(); h.falhas.clear();
  const recover = h.render({titulo: originalTitle, texto: originalText, referenciaRemota: null});
  await recover({preventDefault() {}});
  assert.equal(count(h, "capitulos:update"), 1); assert.equal(count(h, "notificacao"), 1);
  assert.equal(record(h).diario[0].estado, "confirmado");
});

test("leitura divergente após reabertura recupera RPC sem sobrescrever versão nova nem marcá-la salva", async t => {
  const h = criarEdicaoHarness(t, {publicado: true}); h.falhas.set("diario", () => "incerto"); await h.save();
  h.unmount(); h.falhas.clear();
  const newer = structuredClone(h.state.obras); newer[0].capitulos[0].texto = "Versão mais nova de outro dispositivo.";
  h.cache.set("historietas-obras:A", JSON.stringify(newer));
  const cache = h.cache.get("historietas-obras:A"), countBefore = count(h, "setObras");
  const recover = h.render({referenciaRemota: {...h.row, texto: newer[0].capitulos[0].texto, atualizado_em: "2026-11-15T00:00:00Z"}, obras: newer, obraAtual: newer[0], capituloAtual: newer[0].capitulos[0]});
  await recover({preventDefault() {}});
  assert.equal(count(h, "capitulos:update"), 1); assert.equal(count(h, "notificacao"), 1);
  assert.equal(count(h, "setObras"), countBefore); assert.equal(h.cache.get("historietas-obras:A"), cache);
  assert.equal(record(h).diario[0].estado, "confirmado"); assert.equal(h.state.salvou, false);
  assert.match(h.state.erro, /versão carregada difere/);
});

test("confirmação de nova versão invalida conclusão antiga mesmo se o cache falhar", async t => {
  const h = criarEdicaoHarness(t, {publicado: true}); await h.save();
  const titleA = h.params.titulo, textA = h.params.texto, savedA = h.state.obras[0];
  const saveB = h.render({obras: h.state.obras, obraAtual: savedA, capituloAtual: savedA.capitulos[0], texto: "Versão B confirmada no servidor antes da falha de cache."});
  h.falhas.set("cache", true); await saveB({preventDefault() {}});
  assert.equal(h.row.texto, "Versão B confirmada no servidor antes da falha de cache.");
  assert.equal(count(h, "capitulos:update"), 2); h.falhas.delete("cache");
  const restoreA = h.render({titulo: titleA, texto: textA}); await restoreA({preventDefault() {}});
  assert.equal(count(h, "capitulos:update"), 3, "restaurar A é nova escrita explícita baseada em B");
  assert.equal(h.row.texto, textA.trim()); assert.equal(h.state.salvou, true);
});
