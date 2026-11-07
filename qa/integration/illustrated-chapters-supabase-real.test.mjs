import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { criarInvocacaoStatusSupabase } from "../scripts/supabase-cli-invocation.mjs";

const AUTHOR = "e8100000-0000-4000-8000-000000000001";
const OTHER = "e8100000-0000-4000-8000-000000000002";
const CHAPTER = "e8300000-0000-4000-8000-000000000001";
const TEXT_CHAPTER = "e8300000-0000-4000-8000-000000000005";
const WORK = "e8200000-0000-4000-8000-000000000001";
const PAGE = "e8400000-0000-4000-8000-000000000001";
const BLOCKED_UPLOAD = `${AUTHOR}/capitulos/${CHAPTER}/e8400000-0000-4000-8000-000000000099.png`;
const LEGACY_UPLOAD = `${AUTHOR}/qa-illustrated-legacy.png`;
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const PUBLIC_COLUMNS = "id,capitulo_id,ordem,largura,altura,tamanho_bytes,mime_type,descricao,criado_em";

function localUrl(value) {
  const url = new URL(value);
  assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(url.hostname), "Recusa Supabase remoto.");
  return url;
}

function environment() {
  const invocation = criarInvocacaoStatusSupabase();
  const output = execFileSync(invocation.comando, invocation.argumentos, {
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  const env = Object.fromEntries(output.split(/\r?\n/).filter((line) => /^[A-Z0-9_]+=/.test(line))
    .map((line) => {
      const index = line.indexOf("=");
      const value = line.slice(index + 1).trim();
      return [line.slice(0, index), value.startsWith('"') ? JSON.parse(value) : value];
    }));
  const url = localUrl(env.API_URL);
  const db = localUrl(env.DB_URL);
  assert.equal(url.protocol, "http:");
  assert.equal(db.protocol, "postgresql:");
  // Resolve o container pela porta do banco do MESMO status local, nao por nome fixo.
  const containers = execFileSync("docker", ["ps", "--filter", `publish=${db.port}`, "--format", "{{.Names}}"],
    { encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/).filter(Boolean);
  assert.equal(containers.length, 1, "Exige exatamente um banco local na porta informada pelo CLI.");
  assert.ok(containers[0].startsWith("supabase_db_"));
  assert.ok(env.ANON_KEY && env.SERVICE_ROLE_KEY);
  return { url: url.origin, key: env.ANON_KEY, secret: env.SERVICE_ROLE_KEY, container: containers[0] };
}

function sql(container, source) {
  // SQL fixo/fixture versionada; nenhuma credencial ou entrada HTTP e interpolada.
  return execFileSync("docker", ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres",
    "-X", "-v", "ON_ERROR_STOP=1"], { input: source, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
}

function client(url, key) {
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

function clean(container) {
  sql(container, `begin;
    delete from public.obras where id in ('e8200000-0000-4000-8000-000000000001',
      'e8200000-0000-4000-8000-000000000002','e8200000-0000-4000-8000-000000000003');
    delete from public.profiles where user_id in ('${AUTHOR}','${OTHER}');
    delete from auth.users where id in ('${AUTHOR}','${OTHER}');
    delete from historietas_privado.capitulo_arquivos_limpeza
      where storage_path like 'e8100000-0000-4000-8000-000000000001/capitulos/%';
    commit;`);
}

test("contrato ilustrado: RLS real, caminhos privados e nenhum bypass pela Data API", async (t) => {
  const env = environment();
  const admin = client(env.url, env.secret);
  const removeUpload = async () => {
    const result = await admin.storage.from("arquivos-obras").remove([BLOCKED_UPLOAD, LEGACY_UPLOAD]);
    assert.equal(result.error, null, result.error?.message);
  };
  await removeUpload();
  t.after(removeUpload);
  clean(env.container);
  t.after(() => clean(env.container));
  const accounts = [];
  for (const [id, email] of [[AUTHOR, "qa-pages-author@historietas.test"], [OTHER, "qa-pages-other@historietas.test"]]) {
    const password = randomBytes(24).toString("base64url");
    const created = await admin.auth.admin.createUser({ id, email, password, email_confirm: true });
    assert.equal(created.error, null, created.error?.message);
    accounts.push({ id, email, password });
  }
  const source = readFileSync(new URL("../../supabase/tests/database/capitulo_paginas.test.sql", import.meta.url), "utf8");
  const start = source.indexOf("-- BEGIN LOCAL FIXTURE");
  const contentStart = source.indexOf("\n", start) + 1;
  const end = source.indexOf("-- END LOCAL FIXTURE", contentStart);
  assert.ok(start >= 0 && end > contentStart, "Fixture local delimitada obrigatoria.");
  const fixture = source.slice(contentStart, end);
  sql(env.container, `begin;\n${fixture}\ncommit;`);
  const anon = client(env.url, env.key);
  const session = client(env.url, env.key);
  const ids = async (who) => {
    const result = await who.from("capitulo_paginas").select(PUBLIC_COLUMNS).in("capitulo_id", [1, 2, 3, 4]
      .map((n) => `e8300000-0000-4000-8000-${String(n).padStart(12, "0")}`));
    assert.equal(result.error, null, result.error?.message);
    return result.data.map((page) => page.id).sort();
  };
  const denied = (result) => assert.equal(result.error?.code, "42501", result.error?.message || "Escrita deveria ser recusada.");
  await t.test("anon: so publicado permitido, sem draft nem 18+", async () => {
    assert.deepEqual(await ids(anon), [PAGE]);
    denied(await anon.from("capitulo_paginas").select("storage_path"));
    denied(await anon.from("capitulo_paginas").insert({ id: PAGE }));
  });
  const login = async (account) => {
    const result = await session.auth.signInWithPassword({ email: account.email, password: account.password });
    assert.equal(result.error, null, result.error?.message);
    assert.equal(result.data.user.id, account.id);
  };
  await login(accounts[0]);
  await t.test("autor: le seus quatro manifestos mas nao grava nem obtem caminhos", async () => {
    assert.equal((await ids(session)).length, 4);
    denied(await session.from("capitulo_paginas").select("storage_path"));
    denied(await session.from("capitulo_paginas").insert({ id: PAGE }));
    denied(await session.from("capitulo_paginas").upsert({ id: PAGE }));
    denied(await session.from("capitulo_paginas").update({ descricao: "Forjada" }).eq("id", PAGE));
    denied(await session.from("capitulo_paginas").delete().eq("id", PAGE));
    denied(await session.from("capitulos").update({ tipo_conteudo: "imagens" }).eq("id", TEXT_CHAPTER));
    denied(await session.from("capitulos").update({ versao_paginas: 999 }).eq("id", CHAPTER));
    denied(await admin.from("capitulo_paginas").insert({ id: PAGE }));
  });
  await t.test("namespace privado nao habilita upload direto antes da finalizacao controlada", async () => {
    const result = await session.storage.from("arquivos-obras").upload(
      BLOCKED_UPLOAD, PNG,
      { contentType: "image/png", upsert: false },
    );
    assert.ok(result.error, "Upload do novo namespace deve permanecer bloqueado.");
    assert.equal(String(result.error.statusCode), "403");
  });
  await t.test("anexo privado preserva upload/upsert e restricao legada de UPDATE", async () => {
    const bucket = session.storage.from("arquivos-obras");
    for (const upsert of [false, true]) {
      const result = await bucket.upload(LEGACY_UPLOAD, PNG, { contentType: "image/png", upsert });
      assert.equal(result.error, null, result.error?.message);
    }
    // SELECT legado permite apenas object.upload; object.update continua negado.
    // Nao ampliar essa policy para satisfazer uma expectativa incorreta da fixture.
    const updated = await bucket.update(LEGACY_UPLOAD, PNG, { contentType: "image/png" });
    assert.equal(String(updated.error?.statusCode), "403");
  });
  await t.test("edicao e criacao legadas de texto continuam permitidas", async () => {
    const updated = await session.from("capitulos").update({ texto: "Texto atualizado" })
      .eq("id", TEXT_CHAPTER).select("texto,tipo_conteudo,versao_paginas").single();
    assert.equal(updated.error, null, updated.error?.message);
    assert.deepEqual(updated.data, { texto: "Texto atualizado", tipo_conteudo: "texto", versao_paginas: 0 });
    const created = await session.from("capitulos").insert({ obra_id: WORK, user_id: AUTHOR,
      titulo: "Texto novo", texto: "Texto", ordem: 9, publicado: false }).select("tipo_conteudo,versao_paginas").single();
    assert.equal(created.error, null, created.error?.message);
    assert.deepEqual(created.data, { tipo_conteudo: "texto", versao_paginas: 0 });
    denied(await session.from("capitulos").insert({ obra_id: WORK, user_id: AUTHOR,
      titulo: "Bypass", ordem: 10, publicado: false, tipo_conteudo: "imagens" }));
  });
  await login(accounts[1]);
  await t.test("troca para terceiro e logout nao reutilizam acesso do autor", async () => {
    assert.deepEqual(await ids(session), [PAGE]);
    const logout = await session.auth.signOut();
    assert.equal(logout.error, null);
    assert.deepEqual(await ids(session), [PAGE]);
  });
  await t.test("contratos privados e funcoes nao sao RPCs publicas", async () => {
    for (const who of [anon, session, admin]) {
      for (const name of ["capitulo_uploads_pendentes", "capitulo_arquivos_limpeza"]) {
        const result = await who.schema("historietas_privado").from(name).select("*");
        assert.ok(result.error, "Schema privado deve permanecer fora da Data API.");
      }
      const result = await who.rpc("enfileirar_arquivo_capitulo_removido");
      assert.ok(result.error, "Trigger privado nao pode ser chamado como RPC.");
    }
  });
});
