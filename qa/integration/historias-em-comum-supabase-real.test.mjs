import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import "../env.mjs";

// Teste destructivo exclusivamente no Supabase local descartavel.
function ambienteLocal() {
  let url = process.env.SUPABASE_TEST_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let publica = process.env.SUPABASE_TEST_PUBLIC_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  let secreta = process.env.SUPABASE_TEST_SECRET_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!(url && publica && secreta)) {
    const output = execFileSync("supabase", ["status", "-o", "env"], {
      encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    });
    const env = Object.fromEntries(
      output.split(/\r?\n/).map(l => /^([A-Z0-9_]+)=(.*)$/.exec(l.trim()))
        .filter(Boolean).map(m => [m[1], m[2].replace(/^["']|["']$/g, "")]),
    );
    url = env.API_URL || ""; publica = env.ANON_KEY || env.PUBLISHABLE_KEY || "";
    secreta = env.SERVICE_ROLE_KEY || env.SECRET_KEY || "";
  }
  assert.ok(url && publica && secreta, "Configurar credenciais do Supabase local");
  const u = new URL(url);
  assert.equal(u.protocol, "http:", "Recusado banco remoto");
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(u.hostname),
    "A fixture proibe conexoes a bancos remotos");
  return { url, publica, secreta };
}

function cliente(url, chave) {
  return createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
function ok(res, acao) {
  assert.equal(res.error, null, acao + ": " + (
    /^[A-Z0-9_]{1,32}$/.test(res.error?.code || "") ? res.error.code : "falha"));
  return res.data;
}

test("Histórias em Comum: Auth e Data API reais, permissões, bloqueios e revogações", async t => {
  const { url, publica, secreta } = ambienteLocal();
  const admin = cliente(url, secreta), anon = cliente(url, publica);
  const contas = [], obras = [];
  const nome = "QA Historias em Comum";
  async function criarConta(tipo) {
    const email = "qa-comum-" + randomUUID() + "@historietas.test";
    const password = randomBytes(24).toString("base64url");
    const user = ok(await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    }), "criar conta");
    const account = { id: user.user.id, email, password, client: cliente(url, publica) };
    contas.push(account);
    ok(await account.client.auth.signInWithPassword({ email, password }), "login real");
    ok(await account.client.from("profiles").insert({
      id: account.id, user_id: account.id, nome, tipo,
      username: "qa.comum." + randomBytes(5).toString("hex"),
    }), "criar profile");
    ok(await account.client.rpc("aceitar_termos_publicacao", {
      p_termos_versao: "2026-08-05", p_diretrizes_versao: "2026-08-05",
      p_politica_versao: "2026-08-05",
    }), "aceitar termos");
    return account;
  }
  async function prefs(account, fields = {}) {
    ok(await account.client.from("preferencias_privacidade").upsert({
      user_id: account.id, visibilidade_biblioteca: "publico",
      mostrar_favoritos: true, perfil_privado: false, ...fields,
    }, { onConflict: "user_id" }), "atualizar privacidade");
  }
  async function consultar(account, other, opts = {}) {
    return ok(await account.client.rpc("listar_historias_em_comum", {
      p_outro_usuario: other, p_apos_obra: null, p_limite: 20, ...opts,
    }), "consultar RPC");
  }
  async function obra(author, n, cls = "Livre", publicado = true) {
    const id = randomUUID();
    obras.push(id);
    ok(await author.client.from("obras").insert({
      id, user_id: author.id, titulo: "QA comum obra " + n, autor: nome,
      genero: "Fantasia", formato: "Conto", classificacao_indicativa: cls,
      avisos_conteudo: cls === "18+" ? ["terror"] : [],
      sinopse: "Obra sintetica para teste de privacidade",
      publicado: false, slug: "qa-comum-" + randomUUID(),
    }), "criar obra");
    if (publicado) {
      ok(await author.client.from("obras").update({ publicado: true })
        .eq("id", id).eq("user_id", author.id), "publicar obra");
    }
    return id;
  }
  try {
    const author = await criarConta("autor");
    const a = await criarConta("leitor");
    const b = await criarConta("leitor");
    const c = await criarConta("leitor");
    await prefs(a); await prefs(b); await prefs(c);
    const w1 = await obra(author, 1);
    const w2 = await obra(author, 2);
    const w3 = await obra(author, 3);
    const w4 = await obra(author, 4, "Livre", false);
    const w5 = await obra(author, 5, "18+", true);
    const w6 = await obra(author, 6);
    const w7 = await obra(author, 7);
    // Admin semeia referencias legacy. A leitura sempre usa JWT real ou anon.
    const entries = [
      [a.id,w1,"publico"],[a.id,w2,"parcial"],[a.id,w3,"publico"],
      [a.id,w4,"publico"],[a.id,w5,"publico"],[a.id,w6,"privado"],
      [a.id,w7,"publico"],
      [b.id,w1,"publico"],[b.id,w2,"publico"],[b.id,w3,"parcial"],
      [b.id,w4,"publico"],[b.id,w5,"publico"],[b.id,w6,"publico"],
      [b.id,w7,"publico"],[c.id,w7,"publico"],
    ];
    ok(await admin.from("favoritos").insert(entries.map(
      ([user_id,obra_id,visibilidade]) => ({user_id,obra_id,visibilidade}),
    )), "semear favoritos");
    const esperadas = [w1,w7].sort();
    await t.test("própria Biblioteca não autoriza publicar favoritos ocultos", async () => {
      const own = ok(await a.client.from("favoritos").select("obra_id")
        .eq("user_id", a.id), "leitura pessoal");
      assert.equal(own.length, 7);
      const result = await consultar(a,b.id);
      assert.deepEqual(result.map(x => x.obra_id), esperadas);
      assert.ok(result.every(x => x.slug && x.titulo
        && !("user_id" in x) && !("visibilidade" in x)));
    });
    await t.test("reciprocidade, limites e cursor sem count", async () => {
      assert.deepEqual((await consultar(b,a.id)).map(x => x.obra_id), esperadas);
      assert.deepEqual((await consultar(a,b.id,{p_limite:1})).map(x=>x.obra_id),
        [esperadas[0]]);
      assert.deepEqual((await consultar(a,b.id,{
        p_apos_obra:esperadas[0],p_limite:1,
      })).map(x=>x.obra_id),[esperadas[1]]);
      assert.deepEqual(await consultar(a,b.id,{
        p_apos_obra:esperadas[1],p_limite:20,
      }),[]);
      assert.deepEqual(await consultar(a,b.id,{p_limite:0}),[]);
      assert.deepEqual(await consultar(a,b.id,{p_limite:21}),[]);
    });
    await t.test("anonimo nao executa e terceiro nao consulta par de terceiros", async () => {
      const anonResult = await anon.rpc("listar_historias_em_comum", {
        p_outro_usuario:b.id,p_limite:20,
      });
      assert.ok(anonResult.error);
      assert.deepEqual((await consultar(c,a.id)).map(x=>x.obra_id),[w7]);
      assert.deepEqual((await consultar(c,b.id)).map(x=>x.obra_id),[w7]);
      assert.deepEqual(await consultar(a,a.id),[]);
    });
    await t.test("privacidade e perfil fechado revogam os dois sentidos", async () => {
      await prefs(a,{mostrar_favoritos:false});
      assert.deepEqual(await consultar(a,b.id),[]);
      assert.deepEqual(await consultar(b,a.id),[]);
      await prefs(a);
      await prefs(b,{visibilidade_biblioteca:"somente_eu"});
      assert.deepEqual(await consultar(a,b.id),[]);
      assert.deepEqual(await consultar(b,a.id),[]);
      await prefs(b);
      await prefs(a,{perfil_privado:true});
      assert.deepEqual(await consultar(a,b.id),[]);
      assert.deepEqual(await consultar(b,a.id),[]);
      await prefs(a);
      assert.deepEqual((await consultar(a,b.id)).map(x=>x.obra_id),esperadas);
    });
    await t.test("bloqueio bidirecional revoga sem perder outros dados", async () => {
      for (const [de,para] of [[a.id,b.id],[b.id,a.id]]) {
        ok(await admin.from("usuarios_bloqueados").insert({
          bloqueador_id:de,bloqueado_id:para,
        }),"bloquear");
        assert.deepEqual(await consultar(a,b.id),[]);
        assert.deepEqual(await consultar(b,a.id),[]);
        ok(await admin.from("usuarios_bloqueados").delete()
          .eq("bloqueador_id",de).eq("bloqueado_id",para),"desbloquear");
      }
      assert.deepEqual((await consultar(a,b.id)).map(x=>x.obra_id),esperadas);
    });
    await t.test("despublicar, 18+ e remocao revogam no proximo SELECT", async () => {
      ok(await author.client.from("obras").update({publicado:false})
        .eq("id",w1).eq("user_id",author.id),"despublicar");
      assert.deepEqual((await consultar(a,b.id)).map(x=>x.obra_id),[w7]);
      ok(await author.client.from("obras").update({publicado:true})
        .eq("id",w1).eq("user_id",author.id),"republicar");
      ok(await author.client.from("obras").update({
        classificacao_indicativa:"18+",avisos_conteudo:["terror"],
      }).eq("id",w1).eq("user_id",author.id),"mudar para 18+");
      assert.deepEqual((await consultar(a,b.id)).map(x=>x.obra_id),[w7]);
      ok(await author.client.from("obras").update({
        classificacao_indicativa:"Livre",avisos_conteudo:[],
      }).eq("id",w1).eq("user_id",author.id),"restaurar Livre");
      ok(await a.client.from("favoritos").delete()
        .eq("user_id",a.id).eq("obra_id",w1),"excluir favorito");
      assert.deepEqual((await consultar(a,b.id)).map(x=>x.obra_id),[w7]);
    });
    await t.test("troca real de conta no mesmo cliente não reaproveita identidade", async () => {
      ok(await a.client.auth.signOut(),"logout");
      ok(await a.client.auth.signInWithPassword({
        email:c.email,password:c.password,
      }),"login C");
      const res=ok(await a.client.auth.getUser(),"identidade");
      assert.equal(res.user.id,c.id);
      assert.deepEqual((await consultar(a,b.id)).map(x=>x.obra_id),[w7]);
    });
  } finally {
    if (contas.length) {
      await admin.from("favoritos").delete().in("user_id",contas.map(c=>c.id));
      if (obras.length) await admin.from("obras").delete().in("id",obras);
      for (const conta of contas) await admin.auth.admin.deleteUser(conta.id);
    }
  }
});
