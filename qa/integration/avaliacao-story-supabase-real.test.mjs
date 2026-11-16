import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import ts from "typescript";
import "../env.mjs";

// Este teste cria apenas fixtures novas. Não remove dados nem aplica migrations.
const api = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
const check = r => {
  const code = /^[A-Z0-9_]{1,32}$/.test(r.error?.code ?? "") ? r.error.code : "indisponivel";
  assert.equal(r.error === null, true, `Operação da fixture local deve concluir (${code})`);
  return r.data;
};
function importar(path, mocks) {
  const js = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", js)(name => {
    if (name === "server-only") return {};
    assert.ok(name in mocks, "Import previsto pelo harness"); return mocks[name];
  }, mod, mod.exports);
  return mod.exports;
}

test("story: fontes reais locais, publicação, privacidade e identidade pública", async t => {
  assert.ok(api && key && secret, "Configurar explicitamente credenciais do Supabase LOCAL");
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(api).hostname), "PROIBIDO usar projeto remoto");
  const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  const admin = createClient(api, secret, options);
  const anon = createClient(api, key, options);
  async function conta(nome, username, tipo) {
    const email = `qa-story-${randomUUID()}@historietas.test`, password = randomBytes(24).toString("base64url");
    const created = check(await admin.auth.admin.createUser({ email, password, email_confirm: true }));
    const client = createClient(api, key, options);
    const signedIn = check(await client.auth.signInWithPassword({ email, password }));
    const id = created.user.id;
    check(await client.from("profiles").insert({ id, user_id: id, nome, username, tipo }));
    check(await client.rpc("aceitar_termos_publicacao", { p_termos_versao: "2026-08-05", p_diretrizes_versao: "2026-08-05", p_politica_versao: "2026-08-05" }));
    return { id, client, session: signedIn.session };
  }
  const username = `story.${randomBytes(5).toString("hex")}`;
  const author = await conta("Autor público sintético", username, "autor");
  const reader = await conta("Leitor público sintético", null, "leitor");
  const prefs = patch => reader.client.from("preferencias_privacidade").upsert({ user_id: reader.id, visibilidade_biblioteca: "publico", mostrar_avaliacoes: true, ...patch }, { onConflict: "user_id" });
  check(await prefs({}));
  async function obra(classificacao, publicado) {
    const id = randomUUID(), slug = `qa-story-${randomUUID()}`;
    check(await author.client.from("obras").insert({ id, user_id: author.id, titulo: "Obra real da fixture", autor: "Autor público sintético", genero: "Fantasia", formato: "Conto", classificacao_indicativa: classificacao, avisos_conteudo: classificacao === "18+" ? ["terror"] : [], sinopse: "Fixture sintética local de segurança do story.", publicado: false, slug }));
    if (publicado) check(await author.client.from("obras").update({ publicado: true }).eq("id", id).eq("user_id", author.id));
    return { id, slug };
  }
  const published = await obra("Livre", true), draft = await obra("Livre", false), adult = await obra("18+", true);
  check(await reader.client.from("obra_avaliacoes").insert({ obra_id: published.id, user_id: reader.id, nota: 4.5, visibilidade: "publico" }));
  const dto = importar("../../lib/stories/avaliacao-story-payload.ts", {});
  // Só Next cookies/execução TS são adaptados: SSR, getUser, HTTP e RLS são reais.
  const jar = new Map();
  const cookieStore = {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    set(name, value) { if (value) jar.set(name, value); else jar.delete(name); },
  };
  async function usarSessao(account) {
    jar.clear();
    const ssr = createServerClient(api, key, { cookies: {
      getAll: () => [], setAll: values => values.forEach(v => cookieStore.set(v.name, v.value)),
    } });
    check(await ssr.auth.setSession(account.session));
    assert.ok(jar.size > 0, "Cookies SSR reais devem existir");
  }
  const server = importar("../../lib/supabase/server.ts", {
    "@supabase/ssr": { createServerClient }, "next/headers": { cookies: async () => cookieStore },
  });
  const { criarSupabasePublicClient: publicClient } = importar("../../lib/supabase/public.ts", {
    "@supabase/supabase-js": { createClient },
  });
  const projection = importar("../../lib/server/agendamento/ler-projecao-publica.ts", { "../../supabase/public": { criarSupabasePublicClient: publicClient } });
  const { carregarStoryAvaliacaoObra } = importar("../../lib/server/stories/carregar-story-avaliacao.ts", {
    "../../supabase/public": { criarSupabasePublicClient: publicClient },
    "../../supabase/server": server,
    "../../utils": { idObraSupabaseValido: id => /^[0-9a-f-]{36}$/i.test(id.trim()) },
    "../agendamento/ler-projecao-publica": projection,
    "../../stories/avaliacao-story-payload": dto,
  });
  const load = slug => carregarStoryAvaliacaoObra({ slug: slug ?? published.slug, leitorId: reader.id });
  const rating = visibilidade => reader.client.from("obra_avaliacoes").update({ visibilidade }).eq("obra_id", published.id).eq("user_id", reader.id);
  await t.test("sem cookies não autoriza gerar story de avaliação pública", async () => {
    assert.equal(check(await anon.from("obra_avaliacoes").select("nota").eq("obra_id", published.id)).length, 1);
    assert.deepEqual(await load(), { estado: "indisponivel", motivo: "autenticacao_necessaria", payload: null });
  });
  await t.test("cookies SSR reais de outra conta não autorizam a avaliação do leitor", async () => {
    await usarSessao(author);
    assert.deepEqual(await load(), { estado: "indisponivel", motivo: "avaliacao_de_outro_leitor", payload: null });
  });
  await usarSessao(reader);
  await t.test("público retorna nota 4.5 e username reais sem dados privados", async () => {
    const r = await load(); assert.equal(r.estado, "disponivel");
    assert.equal(r.payload.autor.username, username); assert.equal(r.payload.autor.handle, `@${username}`);
    assert.equal(r.payload.avaliacao.nota, 4.5); assert.equal(r.payload.avaliacao.meiaEstrela, true);
    assert.equal(r.payload.leitor.nome.texto, "Leitor público sintético");
    assert.equal(r.payload.ausencias.capa, true); assert.equal(r.payload.ausencias.fotoAutor, true);
    assert.ok(!JSON.stringify(r).includes(reader.id));
  });
  await t.test("dono lê avaliação privada via RLS mas story público a rejeita", async () => {
    check(await rating("privado"));
    assert.equal(check(await reader.client.from("obra_avaliacoes").select("nota").eq("obra_id", published.id)).length, 1);
    assert.equal(check(await anon.from("obra_avaliacoes").select("nota").eq("obra_id", published.id)).length, 0);
    assert.equal((await load()).motivo, "avaliacao_nao_publica");
  });
  await t.test("avaliação parcial não habilita story mesmo se a RLS permitir leitura", async () => {
    check(await rating("parcial")); assert.equal((await load()).motivo, "avaliacao_nao_publica");
  });
  await t.test("preferências ocultas e biblioteca privada bloqueiam avaliação pública", async () => {
    check(await rating("publico"));
    check(await prefs({ mostrar_avaliacoes: false })); assert.equal((await load()).motivo, "avaliacao_nao_publica");
    check(await prefs({ visibilidade_biblioteca: "somente_eu" })); assert.equal((await load()).motivo, "avaliacao_nao_publica");
    check(await prefs({})); assert.equal((await load()).estado, "disponivel");
  });
  await t.test("draft, 18+, inexistente e obra despublicada nunca oferecem payload", async () => {
    for (const slug of [draft.slug, adult.slug, `inexistente-${randomUUID()}`]) {
      const r = await load(slug); assert.equal(r.motivo, "obra_indisponivel"); assert.equal(r.payload, null);
    }
    check(await author.client.from("obras").update({ publicado: false }).eq("id", published.id).eq("user_id", author.id));
    assert.equal((await load()).motivo, "obra_indisponivel");
    check(await author.client.from("obras").update({ publicado: true }).eq("id", published.id).eq("user_id", author.id));
  });
  await t.test("username ausente oculta @ e & sem inventar dados", async () => {
    check(await author.client.from("profiles").update({ username: null }).eq("user_id", author.id));
    const r = await load(); assert.equal(r.estado, "disponivel");
    assert.equal(r.payload.autor.username, null); assert.equal(r.payload.autor.mostrarSeparador, false);
  });
  await t.test("alteração de nota e exclusão usam a fonte atual, sem avaliação inventada", async () => {
    for (const nota of [3, 3.5, 0.5]) {
      check(await reader.client.from("obra_avaliacoes").update({ nota }).eq("obra_id", published.id).eq("user_id", reader.id));
      const result = await load(); assert.equal(result.estado, "disponivel");
      assert.equal(result.payload.avaliacao.nota, nota);
      assert.equal(result.payload.avaliacao.meiaEstrela, nota % 1 === 0.5);
    }
    check(await reader.client.from("obra_avaliacoes").delete().eq("obra_id", published.id).eq("user_id", reader.id));
    const removed = await load(); assert.equal(removed.estado, "indisponivel");
    assert.equal(removed.payload, null); assert.equal(removed.motivo, "avaliacao_nao_publica");
    check(await reader.client.from("obra_avaliacoes").insert({ obra_id: published.id, user_id: reader.id, nota: 4.5, visibilidade: "publico" }));
  });
  // Mantém as fixtures para diagnóstico, sem alterar dados anteriores do stack.
  console.log(JSON.stringify({ local: true, novasContas: 2, novasObras: 3, migrations: 0, segredosRegistrados: false }));
});
