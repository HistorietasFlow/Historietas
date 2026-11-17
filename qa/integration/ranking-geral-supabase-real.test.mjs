import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

function ambienteLocal() {
  const saida = execFileSync("supabase", ["status", "-o", "env"], { encoding: "utf8" });
  const env = Object.fromEntries(saida.split(/\r?\n/)
    .map(l => /^([A-Z0-9_]+)=(.*)$/.exec(l.trim())).filter(Boolean)
    .map(m => [m[1], m[2].startsWith('"') ? JSON.parse(m[2]) : m[2].replace(/^'|'$/g, "")]));
  const url = env.API_URL, dbUrl = env.DB_URL;
  for (const valor of [url, dbUrl]) {
    assert.ok(valor, "Supabase local requer API_URL/DB_URL");
    const destino = new URL(valor);
    assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(destino.hostname),
      "Proibido testar contra Supabase remoto");
  }
  assert.equal(new URL(url).protocol, "http:");
  const publica = env.PUBLISHABLE_KEY || env.ANON_KEY;
  const secreta = env.SERVICE_ROLE_KEY || env.SECRET_KEY;
  assert.ok(publica && secreta, "Chaves locais nao encontradas");
  return { url, dbUrl, publica, secreta };
}
const client = (url, key) => createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
function ok(response, descricao) {
  assert.equal(response.error, null, descricao + ": " + (response.error?.code || "erro"));
  return response.data;
}
async function lotes(items, n, fn) {
  for (let i = 0; i < items.length; i += n) await fn(items.slice(i, i + n));
}
function benchmarkSQL(dbUrl, body) {
  const porta = new URL(dbUrl).port;
  const lista = execFileSync("docker", ["ps", "--filter", "publish=" + porta,
    "--format", "{{.Names}}"], { encoding: "utf8" }).trim().split(/\r?\n/);
  const bancos = lista.filter(nome => /^supabase_db_/.test(nome));
  assert.equal(bancos.length, 1, "Container PostgreSQL local nao identificado");
  const sql = [
    "begin;", "set local role anon;", "set local statement_timeout='8s';",
    "explain (analyze, buffers, format json)", body + ";", "rollback;",
  ].join("\n");
  const output = execFileSync("docker", ["exec", "-i", bancos[0], "psql", "-U",
    "postgres", "-d", "postgres", "-X", "-q", "-A", "-t", "-v", "ON_ERROR_STOP=1"], {
    input: sql, encoding: "utf8", timeout: 60000,
  });
  const p = JSON.parse(output.trim())[0];
  return { ms: p["Execution Time"], hits: p.Plan["Shared Hit Blocks"] || 0,
    reads: p.Plan["Shared Read Blocks"] || 0 };
}

test("Ranking Geral: anon, edicao, revogacao, paginacao e escala", async t => {
  const { url, dbUrl, publica, secreta } = ambienteLocal();
  const admin = client(url, secreta), anon = client(url, publica);
  const outroAnon = client(url, publica), contas = [], obras = [];
  const senha = randomBytes(24).toString("base64url");
  const slug = "qa-rank-" + randomUUID();
  t.after(async () => {
    await lotes(obras, 120, async ids => { await admin.from("obras").delete().in("id", ids); });
    for (const u of contas) await admin.auth.admin.deleteUser(u.id);
  });
  async function criarConta(tipo) {
    const email = "qa-rank-" + randomUUID() + "@historietas.test";
    const id = ok(await admin.auth.admin.createUser({
      email, password: senha, email_confirm: true,
    }), "conta sintetica").user.id;
    contas.push({ id, email });
    ok(await admin.from("profiles").insert({
      id, user_id: id, nome: "QA ranking", tipo,
    }), "perfil sintetico");
    return id;
  }
  const autor = await criarConta("autor"), leitores = [];
  for (let i = 0; i < 7; i++) leitores.push(await criarConta("leitor"));
  const preferencias = leitores.map((id, i) => ({
    user_id: id, visibilidade_biblioteca: i === 5 ? "somente_eu" : "publico",
    mostrar_avaliacoes: i !== 6, perfil_privado: false,
  }));
  ok(await admin.from("preferencias_privacidade").upsert(preferencias),
    "preferencias sinteticas");
  async function obra(opts = {}) {
    const id = randomUUID();
    obras.push(id);
    ok(await admin.from("obras").insert({
      id, user_id: autor, titulo: "QA Ranking", autor: "QA",
      genero: "Fantasia", formato: "HQ",
      classificacao_indicativa: opts.adulta ? "18+" : "Livre",
      avisos_conteudo: opts.adulta ? ["violencia_intensa"] : [],
      publicado: !opts.draft,
      arquivo_url: opts.semConteudo ? null : "https://example.invalid/qa.txt",
      slug: slug + "-" + obras.length,
    }), "obra sintetica");
    return id;
  }
  const [a, b, c, d, privada, adulta, draft, semConteudo] = await Promise.all(
    Array.from({ length: 8 }, async (_, i) => obra({
      adulta: i === 5, draft: i === 6, semConteudo: i === 7,
    })),
  );
  async function votar(obraId, leitor, nota, visibilidade = "publico") {
    ok(await admin.from("obra_avaliacoes").insert({
      obra_id: obraId, user_id: leitor, nota, visibilidade,
    }), "avaliacao sintetica");
  }
  await votar(a, leitores[0], 5, "parcial");
  await votar(b, leitores[0], 4.5);
  await votar(b, leitores[1], 4.5, "parcial");
  await votar(b, leitores[5], 5); // Biblioteca privada.
  await votar(b, leitores[6], 5, "parcial"); // Mostrar avaliacoes=false.
  for (let i = 0; i < 5; i++) {
    await votar(c, leitores[i], 4);
    await votar(d, leitores[i], 5);
  }
  await votar(privada, leitores[0], 5, "privado");
  await votar(adulta, leitores[0], 5);
  await votar(draft, leitores[0], 5);
  await votar(semConteudo, leitores[0], 5);

  const listar = (id = null, assinatura = null, limite = 20, cli = anon) =>
    cli.rpc("listar_ranking_geral", {
      p_apos_obra: id, p_assinatura: assinatura, p_limite: limite,
    });
  await t.test("anon ve parciais legitimas e nao ve privadas", async () => {
    const primeiro = ok(await listar(), "anon A");
    const segundo = ok(await listar(null, null, 20, outroAnon), "anon B");
    assert.deepEqual(primeiro, segundo);
    assert.equal(primeiro.length, 4);
    assert.deepEqual(primeiro.map(x => x.obra_id), [d, c, b, a]);
    assert.equal(primeiro.find(x => x.obra_id === a).total_avaliacoes, 1);
    assert.ok(Math.abs(primeiro.find(x => x.obra_id === a).pontuacao - 35 / 11) < 1e-9);
    assert.equal(primeiro.find(x => x.obra_id === b).total_avaliacoes, 2);
    assert.ok(!primeiro.some(x => [privada, adulta, draft, semConteudo].includes(x.obra_id)));
  });
  await t.test("RPC direta nao aceita usuario autenticado", async () => {
    const cli = client(url, publica);
    ok(await cli.auth.signInWithPassword({ email: contas[2].email, password: senha }),
      "login local");
    const resposta = await listar(null, null, 20, cli);
    assert.ok(resposta.error);
  });
  await t.test("cursores sao invalidos apos editar, revogar e excluir", async () => {
    const p1 = ok(await listar(null, null, 2), "pagina 1");
    const p2 = ok(await listar(p1.at(-1).obra_id, p1[0].assinatura, 2), "pagina 2");
    assert.equal(p1.length, 2); assert.equal(p2.length, 2);
    assert.equal(p1[0].posicao, 1); assert.equal(p2[0].posicao, 3);
    assert.equal(new Set([...p1, ...p2].map(x => x.obra_id)).size, 4);
    assert.ok(p1[0].tem_mais); assert.ok(!p2[0].tem_mais);
    ok(await admin.from("obra_avaliacoes").update({ nota: 0.5 })
      .eq("obra_id", d).eq("user_id", leitores[0]), "alterar voto");
    const stale = ok(await listar(p1.at(-1).obra_id, p1[0].assinatura, 2), "stale 1");
    assert.equal(stale.length, 1); assert.equal(stale[0].estado, "cursor_desatualizado");
    assert.equal(stale[0].obra_id, null);
    const p3 = ok(await listar(null, null, 2), "ranking atualizado");
    assert.notEqual(p3[0].assinatura, p1[0].assinatura);
    ok(await admin.from("preferencias_privacidade").update({
      mostrar_avaliacoes: false,
    }).eq("user_id", leitores[0]), "revogar preferencia");
    const stale2 = ok(await listar(p3.at(-1).obra_id, p3[0].assinatura, 2), "stale 2");
    assert.equal(stale2[0].estado, "cursor_desatualizado");
    assert.ok(!ok(await listar(), "apos revogacao").some(x => x.obra_id === a));
    ok(await admin.from("obra_avaliacoes").delete()
      .eq("obra_id", b).eq("user_id", leitores[1]), "remover avaliacao");
    assert.ok(!ok(await listar(), "apos exclusao").some(x => x.obra_id === b));
  });
  await t.test("benchmark RLS anon: 1003 obras, 4012 avaliacoes", async () => {
    const extras = [];
    for (let i = 0; i < 1003; i++) {
      const id = randomUUID(); obras.push(id);
      extras.push({ id, user_id: autor, titulo: "QA escala " + i, autor: "QA",
        genero: "Fantasia", formato: "HQ", classificacao_indicativa: "Livre",
        avisos_conteudo: [], publicado: true,
        arquivo_url: "https://example.invalid/qa.txt", slug: slug + "-escala-" + i });
    }
    await lotes(extras, 140, async lote =>
      ok(await admin.from("obras").insert(lote), "obras escala"));
    const votantes = leitores.slice(1, 5), notas = [3, 4, 4.5, 5];
    const votos = extras.flatMap((obra, i) => votantes.map((reader, j) => ({
      obra_id: obra.id, user_id: reader,
      nota: notas[(i + j) % notas.length],
      visibilidade: j % 2 ? "parcial" : "publico",
    })));
    await lotes(votos, 280, async lote =>
      ok(await admin.from("obra_avaliacoes").insert(lote), "votos escala"));
    const pagina = ok(await listar(null, null, 20), "ranking em escala");
    assert.equal(pagina.length, 20);
    assert.equal(pagina[0].posicao, 1);
    assert.equal(pagina.at(-1).posicao, 20);

    const baseline = [
      "with obras as materialized (",
      "  select o.id,o.user_id from public.obras o",
      "  where o.publicado is true and o.classificacao_indicativa in ('Livre','10+','12+','14+','16+')",
      "  and (coalesce(nullif(btrim(o.arquivo_url),''),'')<>''",
      "       or exists(select 1 from public.capitulos c where c.obra_id=o.id and c.publicado is true))",
      "), votos as materialized (",
      "  select a.obra_id,count(*)::bigint n,sum(a.nota)::numeric soma",
      "  from public.obra_avaliacoes a join obras o on o.id=a.obra_id",
      "  where a.user_id<>o.user_id group by a.obra_id)",
      "select obra_id from votos order by (soma+30::numeric)/(n+10)::numeric desc,n desc,obra_id asc limit 20",
    ].join("\n");
    const simple = benchmarkSQL(dbUrl, baseline);
    const fingerprint = benchmarkSQL(dbUrl,
      "select * from public.listar_ranking_geral(null::uuid,null::text,20)");
    console.log(JSON.stringify({
      nome: "ranking-geral-benchmark-local",
      obrasSinteticas: extras.length, avaliacoesSinteticas: votos.length,
      baselineMs: Math.round(simple.ms * 100) / 100,
      fingerprintMs: Math.round(fingerprint.ms * 100) / 100,
      fator: Math.round(fingerprint.ms / Math.max(simple.ms,0.001) * 100) / 100,
      blocosLidos: [simple.reads,fingerprint.reads],
    }));
    assert.ok(Number.isFinite(fingerprint.ms) && fingerprint.ms < 8000,
      "Fingerprint excedeu orcamento preliminar de 8s; nao homologar");
  });
});
