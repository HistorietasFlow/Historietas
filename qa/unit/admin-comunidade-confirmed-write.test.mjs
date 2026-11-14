import assert from "node:assert/strict";
import test from "node:test";
import {createClient} from "@supabase/supabase-js";
import {loadApplicationModule as load} from "../helpers/load-application-module.mjs";

const before = {id: "d1", alvo_tipo: "post", alvo_id: "post1", status: "em_analise", arquivada: false, observacao_admin: "",
  analisado_por: "A", analisado_em: "2026-11-13T00:00:00+00:00", atualizado_em: "2026-11-13T00:00:00.000001+00:00"};
const {estadoDenunciaModeracao} = load("app/admin/comunidade/lib/admin-comunidade-confirmed-write.ts", {"../../../../lib/supabase/client": {supabase: {}}});
const esperada = estadoDenunciaModeracao(before);
function client(responder) {
  const requests = [];
  const supabase = createClient("http://127.0.0.1:59999", "chave-ficticia", {
    auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false},
    global: {fetch: async (url, options) => {
      const request = {url: new URL(url), ...options}; requests.push(request); return responder(request);
    }},
  });
  return {supabase, requests};
}
const json = (data, status = 200) => new Response(JSON.stringify(data), {status, headers: {"Content-Type": "application/json"}});
for (const operacao of ["status", "pendente", "arquivar", "restaurar", "excluir"]) {
  test(`SDK real: ${operacao} protege a referência e usa representação do servidor`, async () => {
    const base = {...esperada, ...(operacao === "restaurar" ? {arquivada: true} : {}), ...(operacao === "excluir" ? {status: "resolvida"} : {})};
    const s = client(req => {
      const payload = req.body ? JSON.parse(req.body) : {};
      return json([{...before, status: base.status, arquivada: base.arquivada, ...payload,
        ...(operacao !== "excluir" ? {atualizado_em: "2026-11-14T00:00:00.000002+00:00"} : {}),
        ...(operacao === "pendente" ? {analisado_por: null, analisado_em: null} : {})}]);
    });
    const mocks = {"../../../../lib/supabase/client": {supabase: s.supabase}};
    let result;
    if (operacao === "status" || operacao === "pendente") {
      const {persistirStatusDenunciaModeracao} = load("app/admin/comunidade/actions/atualizar-status-denuncia-moderacao.ts", mocks);
      result = await persistirStatusDenunciaModeracao({denunciaId: "d1", novoStatus: operacao === "status" ? "resolvida" : "pendente", usuarioId: "A", analisadoEm: "2026-11-14T00:00:00Z", observacaoAtual: "Nota", esperada: base});
    } else {
      const [file, fn] = operacao === "arquivar" ? ["arquivar-denuncia-moderacao", "persistirArquivamentoDenunciaModeracao"] : operacao === "restaurar" ?
        ["restaurar-denuncia-moderacao", "persistirRestauracaoDenunciaModeracao"] : ["remover-denuncia-resolvida-moderacao", "persistirRemocaoDenunciaResolvidaModeracao"];
      result = await load(`app/admin/comunidade/actions/${file}.ts`, mocks)[fn]({denunciaId: "d1", esperada: base});
    }
    assert.equal(s.requests.length, 1);
    const req = s.requests[0]; assert.equal(req.method, operacao === "excluir" ? "DELETE" : "PATCH");
    for (const [key, value] of [["id", "d1"], ["status", base.status], ["arquivada", base.arquivada], ["atualizado_em", base.atualizadoEm], ["alvo_tipo", "post"], ["alvo_id", "post1"]]) assert.equal(req.url.searchParams.get(key), `eq.${value}`);
    assert.equal(new Headers(req.headers).get("Prefer"), "return=representation");
    assert.equal(result.id, "d1");
    if (operacao === "pendente") {assert.equal(result.analisadoPor, null); assert.equal(result.analisadoEm, null);}
    assert.equal(s.requests.some(req => req.url.pathname.includes("moderacao_historico")), false);
  });
}
for (const resposta of ["rejeitada", "rede", "http", "vazia", "nula", "outro-id", "outro-status", "versao-antiga"]) {
  test(`SDK real: resposta ${resposta} não confirma arquivamento`, async () => {
    const s = client(() => {
      if (resposta === "rede") throw new TypeError("Resposta perdida");
      if (resposta === "rejeitada") return json({code: "42501", message: "Recusado"}, 403);
      if (resposta === "http") return json({message: "Gateway"}, 503);
      if (resposta === "vazia") return json([]);
      if (resposta === "nula") return json(null);
      return json([{...before, arquivada: true, atualizado_em: resposta === "versao-antiga" ? before.atualizado_em : "2026-11-14T00:00:00+00:00",
        ...(resposta === "outro-id" ? {id: "d2"} : {}), ...(resposta === "outro-status" ? {status: "rejeitada"} : {})}]);
    });
    const {persistirArquivamentoDenunciaModeracao} = load("app/admin/comunidade/actions/arquivar-denuncia-moderacao.ts", {"../../../../lib/supabase/client": {supabase: s.supabase}});
    await assert.rejects(() => persistirArquivamentoDenunciaModeracao({denunciaId: "d1", esperada}), error =>
      error.estado === (resposta === "rejeitada" ? "rejeitado" : resposta === "vazia" ? "conflito" : "incerto"));
    assert.equal(s.requests.length, 1, "nenhum retry de escrita");
  });
}
for (const cenario of ["sucesso", "rejeitada", "incerta", "outro-ator", "mudou", "logout", "status-posterior"]) {
  test(`remoção transacional: ${cenario} preserva escopo e recibo`, async () => {
    let ativo = true;
    const s = client(req => {
      if (req.method === "POST") {
        if (cenario === "rejeitada") return json({code: "42501", message: "Recusado"}, 403);
        if (cenario === "incerta") throw new TypeError("Resposta perdida após commit");
        return json({alvo_tipo: "post", alvo_id: "post1", analisado_por: cenario === "outro-ator" ? "B" : "A", analisado_em: "2026-11-14T00:00:00Z", conteudos_removidos: 1, denuncias_resolvidas: 1});
      }
      if (req.url.searchParams.get("id") === "eq.d1") {
        if (cenario === "logout") ativo = false;
        return json({...before, ...(cenario === "mudou" ? {arquivada: true} : {})});
      }
      return json([{...before, status: cenario === "status-posterior" ? "rejeitada" : "resolvida", atualizado_em: "2026-11-14T00:00:00Z"}]);
    });
    const {removerConteudoDenunciadoModeracao} = load("app/admin/comunidade/actions/remover-conteudo-denunciado-moderacao.ts", {"../../../../lib/supabase/client": {supabase: s.supabase}});
    const executar = () => removerConteudoDenunciadoModeracao({alvoTipo: "post", alvoId: "post1", observacaoFinal: "Nota", usuarioId: "A", esperada, denunciasIds: ["d1"], vigente: () => ativo});
    if (cenario === "sucesso") assert.equal((await executar()).denuncias[0].status, "resolvida");
    else await assert.rejects(executar);
    const writes = s.requests.filter(req => req.method === "POST");
    assert.equal(writes.length, ["mudou", "logout"].includes(cenario) ? 0 : 1);
    if (writes.length) {
      assert.equal(writes[0].url.pathname, "/rest/v1/rpc/remover_conteudo_denunciado_transacional");
      assert.deepEqual(JSON.parse(writes[0].body), {p_alvo_tipo: "post", p_alvo_id: "post1", p_observacao_admin: "Nota"});
    }
    assert.equal(s.requests.some(req => req.method === "DELETE"), false);
  });
}

for (const operacao of ["status", "excluir"]) {
  for (const resposta of ["sucesso", "vazia", "rede", "recusada", "outro-id", "versao-antiga"]) {
    test(`perfil SDK real: ${operacao}/${resposta} respeita versão e confirmação`, async () => {
      const base = {id: "p1", status: operacao === "excluir" ? "resolvida" : "pendente", atualizadoEm: before.atualizado_em};
      const s = client(() => {
        if (resposta === "rede") throw new TypeError("Resposta perdida");
        if (resposta === "recusada") return json({code: "42501", message: "Recusado"}, 403);
        if (resposta === "vazia") return json([]);
        return json([{id: resposta === "outro-id" ? "p2" : "p1", status: "resolvida", atualizado_em:
          operacao === "excluir" || resposta === "versao-antiga" ? base.atualizadoEm : "2026-11-14T00:00:00Z"}]);
      });
      const [file, name] = operacao === "status" ? ["atualizar-status-denuncia-perfil-moderacao", "persistirStatusDenunciaPerfilModeracao"] :
        ["remover-denuncia-perfil-resolvida-moderacao", "persistirRemocaoDenunciaPerfilResolvidaModeracao"];
      const executar = () => load(`app/admin/comunidade/actions/${file}.ts`, {"../../../../lib/supabase/client": {supabase: s.supabase}})[name]({denunciaId: "p1", novoStatus: "resolvida", atualizadoEm: "2026-11-14T00:00:00Z", esperada: base});
      if (resposta === "sucesso" || (operacao === "excluir" && resposta === "versao-antiga")) assert.equal((await executar()).status, "resolvida");
      else await assert.rejects(executar);
      assert.equal(s.requests.length, 1); const req = s.requests[0];
      assert.equal(req.url.pathname, "/rest/v1/denuncias_perfis");
      assert.equal(req.method, operacao === "status" ? "PATCH" : "DELETE");
      for (const [field, value] of [["id", base.id], ["status", base.status], ["atualizado_em", base.atualizadoEm]]) assert.equal(req.url.searchParams.get(field), `eq.${value}`);
    });
  }
}
for (const second of ["arquivar", "restaurar"]) {
  test(`dois moderadores: status e ${second} não sobrescrevem a mesma versão`, async () => {
    let row = {...before, arquivada: second === "restaurar"};
    const original = estadoDenunciaModeracao(row);
    const s = client(req => {
      if (req.url.searchParams.get("atualizado_em") !== `eq.${row.atualizado_em}`) return json([]);
      const payload = JSON.parse(req.body);
      row = {...row, ...payload, atualizado_em: "2026-11-14T00:00:00.000002+00:00"};
      return json([row]);
    });
    const mocks = {"../../../../lib/supabase/client": {supabase: s.supabase}};
    const status = load("app/admin/comunidade/actions/atualizar-status-denuncia-moderacao.ts", mocks).persistirStatusDenunciaModeracao;
    const [file, name] = second === "arquivar" ? ["arquivar-denuncia-moderacao", "persistirArquivamentoDenunciaModeracao"] : ["restaurar-denuncia-moderacao", "persistirRestauracaoDenunciaModeracao"];
    const outra = load(`app/admin/comunidade/actions/${file}.ts`, mocks)[name];
    const results = await Promise.allSettled([status({denunciaId: "d1", novoStatus: "resolvida", observacaoAtual: "Nota", usuarioId: "A", analisadoEm: "2026-11-14T00:00:00Z", esperada: original}), outra({denunciaId: "d1", esperada: original})]);
    assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
    assert.equal(results.find(r => r.status === "rejected").reason.estado, "conflito");
    assert.equal(s.requests.length, 2, "uma tentativa explícita por moderador; nenhuma repetição");
    assert.equal(row.status, "resolvida"); assert.equal(row.arquivada, original.arquivada);
  });
}
