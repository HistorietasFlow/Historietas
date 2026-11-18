// Stack de QA descartável, com JWT curto como no workflow previa-explorar-qa.yml.
// supabase status -o env | node qa/integration/arquivo-obra-proxy-local.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { setTimeout as pausa } from "node:timers/promises";
import { createClient } from "@supabase/supabase-js";
import { createChunks, stringToBase64URL } from "@supabase/ssr";
import { iniciarNext, urlLocal } from "./previa-abertura/next-local.mjs";

const config = Object.fromEntries(readFileSync(0, "utf8").split(/\r?\n/).filter(linha => /^[A-Z_0-9]+=/.test(linha)).map(linha => {
  const i = linha.indexOf("=");
  const valor = linha.slice(i + 1);
  return [linha.slice(0, i), valor.startsWith('"') ? JSON.parse(valor) : valor];
}));
const api = urlLocal(config.API_URL, ["http:"]);
const db = urlLocal(config.DB_URL, ["postgres:", "postgresql:"]);
const opcoes = { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } };
const admin = createClient(api.origin, config.SERVICE_ROLE_KEY, opcoes);
const login = createClient(api.origin, config.ANON_KEY, opcoes).auth;
const chaveCookie = "sb-" + api.hostname.split(".")[0] + "-auth-token";

function cookie(sessao) {
  return createChunks(chaveCookie, "base64-" + stringToBase64URL(JSON.stringify(sessao)))
    .map(({ name, value }) => name + "=" + value).join("; ");
}

function sql(comando, variaveis) {
  const args = ["-XqAt", "-v", "ON_ERROR_STOP=1", "-d", db.href];
  for (const [nome, valor] of Object.entries(variaveis)) args.push("-v", nome + "=" + valor);
  return execFileSync("psql", args, { input: comando, encoding: "utf8" }).trim();
}

test("arquivo público pelo proxy real distingue visitante, sessão ativa, encerrada e vencida", async () => {
  const contas = [];
  const slug = "qa-arquivo-proxy-" + randomUUID();
  const bucket = admin.storage.from("arquivos-obras");
  const bytes = Buffer.from("Abertura fictícia para testar a assinatura do arquivo.");
  let instancia, caminho;
  async function criarConta() {
    const credenciais = { email: "qa-arquivo-" + randomUUID() + "@example.test", password: randomUUID() };
    const { data, error } = await admin.auth.admin.createUser({ ...credenciais, email_confirm: true });
    assert.ifError(error);
    contas.push(data.user.id);
    return credenciais;
  }
  try {
    await criarConta();
    const leitor = await criarConta();
    const autor = contas[0];
    caminho = autor + "/" + randomUUID() + ".txt";
    assert.ifError((await bucket.upload(caminho, bytes, { contentType: "text/plain" })).error);
    const obraId = sql(`
      begin;
      select set_config('request.jwt.claim.sub', :'autor', true) as autor_claim \\gset
      select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05') as aceite \\gset
      insert into public.preferencias_privacidade(user_id,perfil_privado,visibilidade_obras)
        values (:'autor',false,'publico') on conflict (user_id)
        do update set perfil_privado=false,visibilidade_obras='publico';
      insert into public.obras(user_id,titulo,autor,genero,formato,slug,publicado,classificacao_indicativa,arquivo_url)
        values (:'autor','Abertura fictícia','QA','Fantasia','Romance',:'slug',true,'Livre',:'caminho') returning id;
      commit;`, { autor, slug, caminho });
    assert.match(obraId, /^[0-9a-f-]{36}$/);

    instancia = await iniciarNext(api.origin, config.ANON_KEY, false, undefined, config.SERVICE_ROLE_KEY);
    async function conferir(cookieOriginal, status) {
      const headers = new Headers({ origin: instancia.origem, "content-type": "application/json" });
      if (cookieOriginal) headers.set("cookie", cookieOriginal);
      const resposta = await fetch(instancia.origem + "/api/arquivos-obras/url", {
        method: "POST", headers, body: JSON.stringify({ obraId }), redirect: "error",
      });
      assert.equal(resposta.status, status, "HTTP da assinatura");
      assert.equal(resposta.headers.has("set-cookie"), false, "O download preserva os cookies");
      const corpo = await resposta.json();
      if (status === 401) {
        assert.equal(corpo.codigo, "sessao_invalida");
        assert.equal(Object.hasOwn(corpo, "url"), false);
        return;
      }
      assert.equal(corpo.ok, true);
      assert.equal(new URL(corpo.url).origin, api.origin);
      const download = await fetch(corpo.url, { redirect: "error" });
      assert.equal(download.status, 200);
      assert.deepEqual(Buffer.from(await download.arrayBuffer()), bytes);
    }
    async function entrar() {
      const { data, error } = await login.signInWithPassword(leitor);
      assert.ifError(error);
      return data.session;
    }

    await conferir(null, 200);
    const paraExpirar = await entrar();
    assert.ok(paraExpirar.refresh_token);
    const vencimento = paraExpirar.expires_at * 1000;
    assert.ok(vencimento > Date.now() && vencimento - Date.now() <= 65000, "Usar JWT curto na stack de QA");
    await conferir(cookie(paraExpirar), 200);
    const paraEncerrar = await entrar();
    assert.ifError((await admin.auth.admin.signOut(paraEncerrar.access_token, "local")).error);
    await conferir(cookie(paraEncerrar), 401);
    assert.ok(Date.now() < paraEncerrar.expires_at * 1000, "Sessão encerrada antes do vencimento do JWT");
    await pausa(Math.max(0, vencimento - Date.now() + 1200));
    await conferir(cookie(paraExpirar), 401);
    const renovacao = await login.refreshSession({ refresh_token: paraExpirar.refresh_token });
    assert.ifError(renovacao.error);
    assert.equal(renovacao.data.user.id, contas[1], "A sessão ativa ainda pode ser renovada pelo leitor");
    await conferir(cookie(renovacao.data.session), 200);
  } finally {
    if (instancia) await instancia.parar();
    if (caminho) assert.ifError((await bucket.remove([caminho])).error);
    if (contas.length) sql("delete from public.obras where user_id=:'autor' and slug=:'slug';", { autor: contas[0], slug });
    for (const id of contas.reverse()) assert.ifError((await admin.auth.admin.deleteUser(id)).error);
  }
});
