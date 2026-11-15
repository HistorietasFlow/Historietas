import assert from "node:assert/strict";
import test from "node:test";
import {criarModeracaoHarness, denunciaModeracao, tickModeracao} from "../helpers/admin-moderacao-harness.mjs";

const receipt = patch => denunciaModeracao({atualizadoEm: "2026-11-14T00:00:00.000002+00:00", ...patch});
test("duplo status e ação concorrente compartilham trava antes do rerender", async t => {
  const h = criarModeracaoHarness(t), a = h.render();
  const p1 = a.atualizarStatusDenuncia("d1", "resolvida"), p2 = a.arquivarDenuncia("d1"); await tickModeracao();
  assert.equal(h.requests.length, 1);
  h.requests[0].resolve(receipt({status: "resolvida", analisadoPor: "A", analisadoEm: "2026-11-14T00:00:00+00:00"}));
  await Promise.all([p1, p2]); assert.equal(h.state.denuncias[0].status, "resolvida");
});
test("servidor rejeita ação sem confirmar estado nem sucesso na interface", async t => {
  const h = criarModeracaoHarness(t), a = h.render(), before = h.state.denuncias;
  const pending = a.atualizarStatusDenuncia("d1", "resolvida"); await tickModeracao();
  h.requests[0].reject({code: "42501", message: "Operação recusada"}); await pending;
  assert.equal(h.state.denuncias, before); assert.equal(h.state.sucesso, ""); assert.match(h.state.erro, /recusada/);
  assert.equal(h.state.acaoEmAndamento, "");
});
for (const fase of ["logout", "A-B-A", "unmount"]) {
  test(`resposta tardia após ${fase} não aplica estado, erro ou sucesso`, async t => {
    const h = criarModeracaoHarness(t), a = h.render(), p = a.arquivarDenuncia("d1"); await tickModeracao();
    if (fase === "unmount") h.unmount(); else {h.identity(""); if (fase === "A-B-A") {h.identity("B"); h.identity("A");}}
    const before = h.updates.length;
    h.requests[0].resolve(receipt({arquivada: true})); await p;
    assert.equal(h.updates.length, before); assert.equal(h.state.denuncias[0].arquivada, false);
  });
}
test("resposta antiga não desfaz status/arquivamento mais recentes", async t => {
  const h = criarModeracaoHarness(t), a = h.render(), p = a.atualizarStatusDenuncia("d1", "resolvida"); await tickModeracao();
  const novo = denunciaModeracao({status: "rejeitada", arquivada: true, atualizadoEm: "2026-11-15T00:00:00+00:00"});
  h.state.denuncias = [novo]; h.render({denuncias: [novo]});
  h.requests[0].resolve(receipt({status: "resolvida"})); await p;
  assert.equal(h.state.denuncias[0], novo); assert.equal(h.state.sucesso, "");
});
test("pendente usa metadados realmente retornados, sem inventar responsável/análise", async t => {
  const h = criarModeracaoHarness(t), a = h.render(), p = a.atualizarStatusDenuncia("d1", "pendente"); await tickModeracao();
  const retorno = receipt({status: "pendente", analisadoPor: null, analisadoEm: null}); h.requests[0].resolve(retorno); await p;
  assert.equal(h.state.denuncias[0].analisadoPor, null); assert.equal(h.state.denuncias[0].analisadoEm, null);
});
test("remoção de conteúdo continua exigindo confirmação explícita", async t => {
  const h = criarModeracaoHarness(t); h.confirmar(false); const a = h.render();
  await a.removerConteudoDenunciado(h.params.denuncias[0]);
  assert.equal(h.calls.includes("confirm"), true); assert.equal(h.requests.length, 0);
});
test("card antigo já arquivado não autoriza remover conteúdo", async t => {
  const h = criarModeracaoHarness(t), original = h.params.denuncias[0];
  const a = h.render({denuncias: [denunciaModeracao({arquivada: true})]});
  const p = a.removerConteudoDenunciado(original); await tickModeracao();
  assert.equal(h.requests.length, 0); await p;
});
test("remover conteúdo não resolve denúncias arquivadas/rejeitadas apenas por compartilhar alvo", async t => {
  const h = criarModeracaoHarness(t), original = h.params.denuncias[0];
  const arquivada = denunciaModeracao({id: "d2", arquivada: true, status: "rejeitada"});
  h.state.denuncias = [original, arquivada]; const a = h.render({denuncias: h.state.denuncias});
  const p = a.removerConteudoDenunciado(original); await tickModeracao();
  h.requests[0].resolve({denuncias: [receipt({status: "resolvida"}), arquivada]}); await p;
  assert.equal(h.state.denuncias[1].status, "rejeitada"); assert.equal(h.state.denuncias[1].arquivada, true);
});

test("ações de conteúdo e perfil não disputam a mesma trava visual", async t => {
  const h = criarModeracaoHarness(t), a = h.render();
  const perfil = a.atualizarStatusDenunciaPerfil("p1", "resolvida"), conteudo = a.arquivarDenuncia("d1"); await tickModeracao();
  assert.equal(h.requests.length, 1); assert.equal(h.requests[0].name, "perfil-status");
  h.requests[0].resolve({id: "p1", status: "resolvida", atualizadoEm: "2026-11-14T00:00:00+00:00"});
  await Promise.all([perfil, conteudo]); assert.equal(h.state.denuncias[0].arquivada, false);
});
test("finally antigo não limpa ação iniciada pela nova identidade", async t => {
  const h = criarModeracaoHarness(t), a = h.render(), antiga = a.arquivarDenuncia("d1"); await tickModeracao();
  h.identity("B"); h.state.acaoEmAndamento = "";
  const b = h.render({usuarioId: "B"}), atual = b.restaurarDenunciaArquivada("d1"); await tickModeracao();
  h.requests[0].resolve(receipt({arquivada: true})); await antiga;
  assert.equal(h.state.acaoEmAndamento, "d1-restaurar");
  h.requests[1].resolve(receipt({arquivada: false})); await atual;
  assert.equal(h.state.acaoEmAndamento, "");
});
test("resultado incerto bloqueia repetição no alvo sem marcar sucesso", async t => {
  const h = criarModeracaoHarness(t), a = h.render();
  const {ErroEscritaModeracao} = h;
  const p = a.arquivarDenuncia("d1"); await tickModeracao();
  h.requests[0].reject(new ErroEscritaModeracao("incerto", "Resposta perdida")); await p;
  assert.equal(h.state.sucesso, "");
  await a.restaurarDenunciaArquivada("d1");
  assert.equal(h.requests.length, 1, "resposta incerta não autoriza nova escrita");
  assert.match(h.state.erro, /resultado anterior não foi confirmado/);
});

test("updater adiado pelo React aplica recibo mesmo após liberação da trava", async t => {
  const h = criarModeracaoHarness(t), a = h.render(); h.delay();
  const p = a.arquivarDenuncia("d1"); await tickModeracao();
  h.requests[0].resolve(receipt({arquivada: true})); await p;
  assert.equal(h.state.acaoEmAndamento, ""); h.flush();
  assert.equal(h.state.denuncias[0].arquivada, true);
});
test("updater adiado não apaga versão nova de denúncia removida", async t => {
  const h = criarModeracaoHarness(t); h.state.denuncias = [denunciaModeracao({status: "resolvida"})];
  const a = h.render({denuncias: h.state.denuncias}); h.delay();
  const p = a.removerDenunciaResolvida("d1"); await tickModeracao(); h.requests[0].resolve({}); await p;
  const newer = receipt({status: "rejeitada"}); h.state.denuncias = [newer]; h.flush();
  assert.deepEqual(h.state.denuncias, [newer]);
});
test("updater adiado não aplica estado em outra identidade", async t => {
  const h = criarModeracaoHarness(t), a = h.render(); h.delay();
  const p = a.arquivarDenuncia("d1"); await tickModeracao(); h.requests[0].resolve(receipt({arquivada: true})); await p;
  h.identity("B"); h.flush(); assert.equal(h.state.denuncias[0].arquivada, false);
});
test("revalidação administrativa recusada impede dispatch e libera trava", async t => {
  const h = criarModeracaoHarness(t), a = h.render();
  h.mocks["../loaders/verificar-acesso-moderacao"].verificarAcessoModeracao = async () => ({user: {id: "A"}, adminConfirmado: false});
  await a.arquivarDenuncia("d1"); assert.equal(h.requests.length, 0); assert.match(h.state.erro, /autorização/); assert.equal(h.state.acaoEmAndamento, "");
});
test("identidade trocada na revalidação impede envio sob outro usuário", async t => {
  const h = criarModeracaoHarness(t), a = h.render();
  h.mocks["../loaders/verificar-acesso-moderacao"].verificarAcessoModeracao = async () => ({user: {id: "B"}, adminConfirmado: true});
  await a.arquivarDenuncia("d1"); assert.equal(h.requests.length, 0); assert.equal(h.state.sucesso, "");
});

for (const action of ["status", "arquivar", "restaurar", "excluir-denuncia", "remover-conteudo", "perfil-status", "perfil-excluir"]) {
  test(`${action}: rejeição preserva registros e observações, sem mensagem de sucesso`, async t => {
    const h = criarModeracaoHarness(t);
    const deletion = action === "excluir-denuncia";
    h.state.denuncias = [denunciaModeracao({status: deletion ? "resolvida" : "pendente"})];
    h.state.denunciasPerfis[0].status = action === "perfil-excluir" ? "resolvida" : "pendente";
    h.state.observacoes = {d1: "Rascunho da análise"};
    const original = h.state.denuncias, profiles = h.state.denunciasPerfis;
    const a = h.render({denuncias: original, observacoes: h.state.observacoes});
    const calls = {
      status: () => a.atualizarStatusDenuncia("d1", "resolvida"), arquivar: () => a.arquivarDenuncia("d1"),
      restaurar: () => a.restaurarDenunciaArquivada("d1"), "excluir-denuncia": () => a.removerDenunciaResolvida("d1"),
      "remover-conteudo": () => a.removerConteudoDenunciado(original[0]), "perfil-status": () => a.atualizarStatusDenunciaPerfil("p1", "resolvida"),
      "perfil-excluir": () => a.removerDenunciaPerfilResolvida("p1"),
    };
    const p = calls[action](); await tickModeracao();
    assert.equal(h.requests.length, 1); h.requests[0].reject(new h.ErroEscritaModeracao("rejeitado", "Operação recusada")); await p;
    assert.equal(h.state.denuncias, original); assert.equal(h.state.denunciasPerfis, profiles);
    assert.deepEqual(h.state.observacoes, {d1: "Rascunho da análise"}); assert.equal(h.state.sucesso, "");
    assert.match(h.state.erro, /Operação recusada/); assert.equal(h.state.acaoEmAndamento, "");
  });
}
test("remoção confirmada preserva observação editada enquanto aguardava resposta", async t => {
  const h = criarModeracaoHarness(t), a = h.render({observacoes: {d1: "Nota enviada"}});
  h.state.observacoes = {d1: "Nota enviada"}; const p = a.removerConteudoDenunciado(h.params.denuncias[0]); await tickModeracao();
  h.state.observacoes = {d1: "Próxima revisão"};
  h.requests[0].resolve({denuncias: [receipt({status: "resolvida"})]}); await p;
  assert.equal(h.state.observacoes.d1, "Próxima revisão");
});
test("falha definitiva admite nova ação explícita com a mesma versão ainda não escrita", async t => {
  const h = criarModeracaoHarness(t), a = h.render();
  const first = a.arquivarDenuncia("d1"); await tickModeracao(); h.requests[0].reject(new h.ErroEscritaModeracao("rejeitado", "Sem acesso")); await first;
  const second = a.arquivarDenuncia("d1"); await tickModeracao(); assert.equal(h.requests.length, 2);
  h.requests[1].resolve(receipt({arquivada: true})); await second; assert.equal(h.state.denuncias[0].arquivada, true);
});

test("validação rejeitada não mantém mensagem de sucesso da ação anterior", async t => {
  const h = criarModeracaoHarness(t); h.state.sucesso = "Sucesso anterior";
  const original = h.params.denuncias[0], a = h.render({denuncias: [denunciaModeracao({arquivada: true})]});
  await a.removerConteudoDenunciado(original);
  assert.equal(h.requests.length, 0); assert.equal(h.state.sucesso, ""); assert.match(h.state.erro, /Somente denúncias ativas/);
});

test("perfil descarta resposta tardia e finally após logout", async t => {
  const h = criarModeracaoHarness(t), a = h.render(), p = a.atualizarStatusDenunciaPerfil("p1", "resolvida"); await tickModeracao();
  h.identity(""); const count = h.updates.length;
  h.requests[0].resolve({id: "p1", status: "resolvida", atualizadoEm: "2026-11-14T00:00:00Z"}); await p;
  assert.equal(h.updates.length, count); assert.equal(h.state.denunciasPerfis[0].status, "pendente");
});

test("troca de identidade entre revalidação e continuação não despacha escrita", async t => {
  const h = criarModeracaoHarness(t), a = h.render();
  h.mocks["../loaders/verificar-acesso-moderacao"].verificarAcessoModeracao = async () => {
    queueMicrotask(() => queueMicrotask(() => h.identity("B")));
    return {user: {id: "A"}, adminConfirmado: true};
  };
  await a.arquivarDenuncia("d1"); assert.equal(h.requests.length, 0); assert.equal(h.state.sucesso, "");
});
