import assert from "node:assert/strict";
import test from "node:test";
import {criarEdicaoHarness, adiarEdicao, tickEdicao} from "../helpers/editar-capitulo-save-harness.mjs";
import {loadApplicationModule} from "../helpers/load-application-module.mjs";

const updates = h => h.calls.filter(call => call === "capitulos:update").length;
test("clique duplo salva uma única vez, preservando o rascunho não publicado", async t => {
  const h = criarEdicaoHarness(t);
  await Promise.all([h.save(), h.save()]);
  assert.equal(updates(h), 1);
  assert.equal(h.row.publicado, false);
  assert.equal(h.state.salvou, true);
  assert.equal(h.calls.filter(call => call === "diario").length, 0);
});
test("erro antes de escrever preserva texto e permite repetição explícita", async t => {
  const h = criarEdicaoHarness(t), texto = h.params.texto;
  h.falhas.set("obras:select", () => ({data: null, error: {message: "Rede indisponível"}}));
  await h.save();
  assert.equal(updates(h), 0); assert.equal(h.state.salvou, false); assert.equal(h.state.processando, false);
  assert.equal(h.params.texto, texto);
  h.falhas.clear(); await h.save();
  assert.equal(updates(h), 1); assert.equal(h.state.salvou, true);
});
for (const modo of ["throw", "fetch", "vazio", "outro-id"]) {
  test(`resposta ${modo} após commit nunca confirma, persiste cache ou repete escrita`, async t => {
    const h = criarEdicaoHarness(t), cache = h.cache.get("historietas-obras:A");
    h.falhas.set("capitulos:update", escrever => {
      const response = escrever();
      if (modo === "throw") throw new TypeError("Resposta perdida");
      if (modo === "fetch") return {data: null, error: {code: "", message: "Failed to fetch"}};
      return {data: modo === "vazio" ? null : {...response.data, id: "outro"}, error: null};
    });
    await h.save();
    assert.equal(h.state.salvou, false);
    assert.equal(h.cache.get("historietas-obras:A"), cache);
    h.falhas.clear(); await h.save();
    assert.equal(updates(h), 1);
    assert.equal(h.calls.includes("diario"), false);
    assert.match(h.state.erro, /confirm|incert/i);
  });
}
test("referência antiga não sobrescreve capítulo alterado por outra sessão", async t => {
  const h = criarEdicaoHarness(t);
  Object.assign(h.row, {titulo: "Versão mais nova", atualizado_em: "2026-11-14T01:00:00+00:00"});
  await h.save();
  assert.equal(h.row.titulo, "Versão mais nova"); assert.equal(h.state.salvou, false);
  assert.match(h.state.erro, /versão|alterad|conflito/i);
});
test("navegação antes da escrita invalida a ação e preserva cópia recuperável do texto", async t => {
  const h = criarEdicaoHarness(t), pending = adiarEdicao();
  h.falhas.set("auth", () => pending.promise);
  const saving = h.save(); h.unmount();
  const count = h.calls.length;
  pending.resolve({data: {user: {id: "A"}}, error: null}); await saving;
  assert.equal(updates(h), 0); assert.equal(h.calls.length, count);
  assert.equal([...h.recovery.values()].some(value => value.includes(h.params.texto)), true);
});
test("troca de identidade A→B→A durante await invalida a escrita", async t => {
  const h = criarEdicaoHarness(t), pending = adiarEdicao();
  h.falhas.set("obras:select", () => pending.promise);
  const saving = h.save(); await tickEdicao(); h.auth("B"); h.auth("A");
  pending.resolve({data: {id: h.params.obraId}, error: null}); await saving;
  assert.equal(updates(h), 0); assert.equal(h.state.salvou, false);
});
test("digitação durante envio preserva texto novo sem marcar esse texto como salvo", async t => {
  const h = criarEdicaoHarness(t), pending = adiarEdicao();
  h.falhas.set("capitulos:update", escrever => pending.promise.then(() => escrever()));
  const saving = h.save(); await tickEdicao();
  h.render({texto: "Novo rascunho digitado enquanto a gravação anterior ainda estava pendente."});
  pending.resolve(); await saving;
  assert.equal(h.state.salvou, false);
  assert.equal(h.params.texto.startsWith("Novo rascunho"), true);
  assert.equal([...h.recovery.values()].some(value => value.includes("Novo rascunho")), true);
});

test("rejeição SQLSTATE comprovada permite repetir explicitamente sem duplicar efeitos", async t => {
  const h = criarEdicaoHarness(t);
  h.falhas.set("capitulos:update", () => ({data: null, error: {code: "42501", message: "Escrita recusada"}}));
  await h.save(); assert.equal(h.state.salvou, false);
  h.falhas.clear(); await h.save(); await h.save();
  assert.equal(updates(h), 2);
  assert.equal(h.calls.filter(call => call === "diario").length, 0);
  assert.equal(h.state.salvou, true);
});

test("falha de cache após confirmação recupera somente a etapa local, sem repetir UPDATE", async t => {
  const h = criarEdicaoHarness(t);
  h.falhas.set("cache", true);
  await h.save();
  assert.equal(updates(h), 1); assert.equal(h.state.salvou, false);
  assert.match(h.state.erro, /salvo no servidor/);
  h.falhas.delete("cache"); await h.save(); await h.save();
  assert.equal(updates(h), 1); assert.equal(h.state.salvou, true);
  assert.equal(h.calls.filter(call => call === "diario").length, 0);
});

test("capítulo local só confirma após persistência; repetição e recuperação preservam publicado=false", async t => {
  const h = criarEdicaoHarness(t, {local: true});
  h.falhas.set("cache", true); await h.save(); assert.equal(h.state.salvou, false);
  h.falhas.delete("cache"); await h.save(); await h.save();
  assert.equal(updates(h), 0); assert.equal(h.state.salvou, true);
  const salvo = JSON.parse(h.cache.get("historietas-obras:A"))[0].capitulos[0];
  assert.equal(salvo.publicado, false); assert.equal(salvo.texto, h.params.texto.trim());
});

test("quota da recuperação bloqueia escrita antes do envio e mantém os campos preenchidos", async t => {
  const h = criarEdicaoHarness(t), texto = h.params.texto;
  h.falhas.set("recovery", true); await h.save();
  assert.equal(updates(h), 0); assert.equal(h.params.texto, texto); assert.equal(h.state.salvou, false);
  h.falhas.delete("recovery"); await h.save(); assert.equal(h.state.salvou, true);
});

test("cópia ilegível não é substituída nem autoriza escrita", async t => {
  const h = criarEdicaoHarness(t), key = [...h.recovery.keys()][0];
  h.recovery.set(key, "{rascunho a recuperar"); await h.save();
  assert.equal(updates(h), 0); assert.equal(h.recovery.get(key), "{rascunho a recuperar");
});

test("cache atual preserva outras obras e capítulos acrescentados durante o envio", async t => {
  const h = criarEdicaoHarness(t), pending = adiarEdicao();
  h.falhas.set("capitulos:update", escrever => pending.promise.then(() => escrever()));
  const saving = h.save(); await tickEdicao();
  const obras = JSON.parse(h.cache.get("historietas-obras:A"));
  obras[0].capitulos.push({id: "novo-draft", titulo: "Novo", texto: "Rascunho preservado", publicado: false, ordem: 2});
  obras.push({id: "outra-obra", autorId: "A", titulo: "Outra obra", capitulos: []});
  h.cache.set("historietas-obras:A", JSON.stringify(obras)); pending.resolve(); await saving;
  const salvo = JSON.parse(h.cache.get("historietas-obras:A"));
  assert.equal(salvo.length, 2); assert.equal(salvo[0].capitulos[1].id, "novo-draft");
  assert.equal(salvo[0].capitulos[1].publicado, false);
});

test("alteração local mais nova ou remoção do alvo não é sobrescrita/recriada", async t => {
  const h = criarEdicaoHarness(t), pending = adiarEdicao();
  h.falhas.set("capitulos:update", escrever => pending.promise.then(() => escrever()));
  const saving = h.save(); await tickEdicao();
  const obras = JSON.parse(h.cache.get("historietas-obras:A"));
  obras[0].capitulos[0].texto = "Rascunho mais novo de outra aba.";
  const atual = JSON.stringify(obras); h.cache.set("historietas-obras:A", atual);
  pending.resolve(); await saving;
  assert.equal(h.cache.get("historietas-obras:A"), atual); assert.equal(h.state.salvou, false);
  obras[0].capitulos = []; const removido = JSON.stringify(obras);
  h.cache.set("historietas-obras:A", removido); await h.save();
  assert.equal(h.cache.get("historietas-obras:A"), removido); assert.equal(updates(h), 1);
});

test("resposta após navegação fica incerta e não permite repetição após remontar", async t => {
  const h = criarEdicaoHarness(t), pending = adiarEdicao();
  h.falhas.set("capitulos:update", escrever => pending.promise.then(() => escrever()));
  const saving = h.save(); await tickEdicao(); h.unmount();
  const antes = h.calls.length;
  pending.resolve(); await saving;
  assert.equal(h.calls.length, antes); assert.equal(h.state.salvou, false);
  h.falhas.clear(); const save = h.render(); await save({preventDefault() {}});
  assert.equal(updates(h), 1); assert.match(h.state.erro, /confirmar/);
});

test("nova intenção usa a referência retornada pelo servidor; repetição da mesma intenção não grava", async t => {
  const h = criarEdicaoHarness(t);
  await h.save(); await h.save(); assert.equal(updates(h), 1);
  const obra = h.state.obras[0];
  const save = h.render({obras: h.state.obras, obraAtual: obra, capituloAtual: obra.capitulos[0], texto: "Uma segunda revisão com mais de vinte letras preservadas."});
  await save({preventDefault() {}}); await save({preventDefault() {}});
  assert.equal(updates(h), 2); assert.equal(h.state.salvou, true);
  assert.equal(h.row.texto, h.params.texto);
});

test("identidade diferente recusa escrita", async t => {
  const h = criarEdicaoHarness(t);
  h.auth("B"); await h.save(); assert.equal(updates(h), 0);
});

test("referência ausente não é substituída por um SELECT novo no salvamento", async t => {
  const h = criarEdicaoHarness(t);
  h.recovery.clear(); const save = h.render({referenciaRemota: null});
  await save({preventDefault() {}});
  assert.equal(updates(h), 0); assert.equal(h.state.salvou, false);
});

test("conversão concorrente para imagens não pode ser atualizada pelo editor de texto", async t => {
  const h = criarEdicaoHarness(t), anterior = h.row.texto;
  h.row.tipo_conteudo = "imagens";
  await h.save();
  assert.equal(h.row.texto, anterior); assert.equal(h.state.salvou, false);
  assert.equal(h.calls.includes("diario"), false);
});

test("recuperação confirmada antiga não certifica nem sobrescreve a versão mais nova ao reabrir", async t => {
  const h = criarEdicaoHarness(t); await h.save(); h.unmount();
  Object.assign(h.row, {titulo: "Versão remota posterior", texto: "Texto de uma versão posterior que precisa permanecer intacta.", atualizado_em: "2026-11-15T00:00:00+00:00"});
  const obra = {...h.state.obras[0], capitulos: [{...h.state.obras[0].capitulos[0], titulo: h.row.titulo, texto: h.row.texto}]};
  const cache = JSON.stringify([obra]); h.cache.set("historietas-obras:A", cache);
  const save = h.render({referenciaRemota: {...h.row}, obras: [obra], obraAtual: obra, capituloAtual: obra.capitulos[0]});
  await save({preventDefault() {}});
  assert.equal(h.row.titulo, "Versão remota posterior");
  assert.equal(h.cache.get("historietas-obras:A"), cache); assert.equal(h.state.salvou, false);
});

test("validação inválida não consulta Auth nem grava capítulo", async t => {
  const h = criarEdicaoHarness(t), save = h.render({texto: "Curto"});
  await save({preventDefault() {}});
  assert.equal(h.calls.includes("auth"), false); assert.equal(updates(h), 0); assert.equal(h.params.texto, "Curto");
});

test("mutação pura recusa alvo removido, dono divergente e conteúdo local mais novo", () => {
  const {aplicarEdicaoCapituloNasObrasLocais} = loadApplicationModule("app/editar-capitulo/lib/editar-capitulo-local-save-mutation.ts");
  const original = {id: "cap", titulo: "Título", texto: "Texto original", ordem: 1, publicado: false};
  for (const [autorId, capitulos] of [["A", []], ["B", [original]], ["A", [{...original, texto: "Mais novo"}]]]) {
    const result = aplicarEdicaoCapituloNasObrasLocais({obras: [{id: "obra", autorId, capitulos}],
      obraId: "obra", capituloId: "cap", tituloFinal: "Revisado", textoFinal: "Revisão antiga", numeroCapituloFinal: 1,
      autorFinalObra: "Autora", userId: "A", capituloEsperado: original});
    assert.equal(result.obraAtualizadaParaAcoes, null);
    assert.equal(result.novasObras[0].capitulos.length, capitulos.length);
    if (capitulos.length) assert.equal(result.novasObras[0].capitulos[0].texto, capitulos[0].texto);
  }
});

test("recuperação local não troca sua referência pela versão mais nova ao reabrir", async t => {
  const h = criarEdicaoHarness(t, {local: true}); h.unmount();
  const obra = {...h.params.obraAtual, capitulos: [{...h.params.capituloAtual, texto: "Versão local posterior de outra edição."}]};
  const cache = JSON.stringify([obra]); h.cache.set("historietas-obras:A", cache);
  const save = h.render({obras: [obra], obraAtual: obra, capituloAtual: obra.capitulos[0]});
  await save({preventDefault() {}});
  assert.equal(h.cache.get("historietas-obras:A"), cache); assert.equal(h.state.salvou, false);
});

test("falha local repetida após reabrir não regrava capítulo já confirmado", async t => {
  const h = criarEdicaoHarness(t); h.falhas.set("cache", true); await h.save(); h.unmount();
  const save = h.render({referenciaRemota: {...h.row}}); await save({preventDefault() {}}); h.unmount();
  h.falhas.delete("cache"); const final = h.render({referenciaRemota: {...h.row}}); await final({preventDefault() {}});
  assert.equal(updates(h), 1); assert.equal(h.state.salvou, true);
});

test("texto digitado durante envio é recuperável após falha local e pode salvar sobre a referência confirmada", async t => {
  const h = criarEdicaoHarness(t), pending = adiarEdicao();
  h.falhas.set("capitulos:update", escrever => pending.promise.then(() => escrever())); h.falhas.set("cache", true);
  const saving = h.save(); await tickEdicao();
  h.render({texto: "Novo texto digitado durante o envio, para salvar depois."}); pending.resolve(); await saving; h.unmount();
  const obra = {...h.params.obraAtual, capitulos: [{...h.params.capituloAtual, titulo: h.row.titulo, texto: h.row.texto}]};
  h.cache.set("historietas-obras:A", JSON.stringify([obra])); h.falhas.clear();
  const save = h.render({referenciaRemota: {...h.row}, obras: [obra], obraAtual: obra, capituloAtual: obra.capitulos[0]});
  await save({preventDefault() {}});
  assert.equal(updates(h), 2); assert.equal(h.row.texto, h.params.texto); assert.equal(h.state.salvou, true);
});
