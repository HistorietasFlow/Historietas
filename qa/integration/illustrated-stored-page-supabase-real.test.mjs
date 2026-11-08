import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import test from "node:test";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { criarInvocacaoStatusSupabase } from "../scripts/supabase-cli-invocation.mjs";
import { conferirPaginaArmazenada } from "../../lib/server/capitulos-ilustrados/conferir-pagina-armazenada.ts";
import { validarImagemPagina } from "../../lib/server/capitulos-ilustrados/validar-imagem-pagina.ts";

function ambienteLocal() {
  const invocation = criarInvocacaoStatusSupabase();
  const output = execFileSync(invocation.comando, invocation.argumentos,
    { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  const env = Object.fromEntries(output.split(/\r?\n/).filter((line) => /^[A-Z0-9_]+=/.test(line)).map((line) => {
    const i = line.indexOf("=");
    const value = line.slice(i + 1).trim();
    return [line.slice(0, i), value.startsWith('"') ? JSON.parse(value) : value];
  }));
  const api = new URL(env.API_URL), db = new URL(env.DB_URL);
  for (const url of [api, db]) assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(url.hostname), "Recusa Supabase remoto.");
  assert.equal(api.protocol, "http:");
  const containers = execFileSync("docker", ["ps", "--filter", `publish=${db.port}`, "--format", "{{.Names}}"],
    { encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/).filter(Boolean);
  assert.equal(containers.length, 1);
  assert.ok(containers[0].startsWith("supabase_db_"));
  assert.ok(env.ANON_KEY && env.SERVICE_ROLE_KEY);
  return { url: api.origin, key: env.ANON_KEY, secret: env.SERVICE_ROLE_KEY, container: containers[0] };
}
function sql(env, source) {
  return execFileSync("docker", ["exec", "-i", env.container, "psql", "-U", "postgres", "-d", "postgres", "-XAt",
    "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=terse"], {
    input: source, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}
function check(result) { assert.equal(result.error, null, result.error?.message); return result.data; }
function fechado(result) {
  assert.equal(result.terminalidadeComprovada, false);
  assert.equal(result.publicacaoHabilitada, false);
  assert.equal(result.limpezaHabilitada, false);
  assert.equal(result.liberacaoCotaHabilitada, false);
  return result.estado;
}
function reciboParaConferencia(r) {
  return { tentativaId: r.tentativa_id, reservaId: r.reserva_id, usuarioId: r.user_id,
    sessaoId: r.sessao_id, capituloId: r.capitulo_id, versaoEsperada: r.versao_esperada,
    storagePath: r.storage_path, objetoId: r.objeto_id, objetoVersao: r.objeto_versao,
    sha256: r.sha256, tamanhoBytes: r.tamanho_bytes, largura: r.largura, altura: r.altura, mimeType: r.mime_type };
}

test("conferencia real pela Storage API local, sem ativar writer/publicacao/limpeza", async (t) => {
  const env = ambienteLocal();
  const client = (key = env.key, signal) => createClient(env.url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal }) },
  });
  const admin = client(env.secret), author = client();
  const user = randomUUID(), work = randomUUID(), chapter = randomUUID();
  const paths = [], writers = [], releases = [];
  // Fonte ADMIN somente da fixture descartavel. Nao existe este adaptador ou
  // credencial no verificador de producao. Todas as leituras sao da Storage API.
  const fonte = {
    async informar(path, signal) {
      const { data, error } = await client(env.secret, signal).storage.from("arquivos-obras").info(path);
      if (error && (error.statusCode === "404" || error.code === "NoSuchKey")) return null;
      assert.equal(error, null, error?.message);
      return data;
    },
    async baixar(path, signal) {
      return check(await client(env.secret, signal).storage.from("arquivos-obras")
        .download(path, { cacheNonce: randomUUID() }, { cache: "no-store", signal }).asStream());
    },
    validar: validarImagemPagina,
  };
  const claims = () => {
    const session = sql(env, `select id from auth.sessions where user_id='${user}' order by created_at desc limit 1;`);
    assert.match(session, /^[0-9a-f-]{36}$/);
    return `select set_config('request.jwt.claim.sub','${user}',true);
      select set_config('request.jwt.claims','{"sub":"${user}","session_id":"${session}","role":"authenticated"}',true);`;
  };
  t.after(async () => {
    // Teardown administrativo de fixtures, NAO reconciliador. Junta TODOS os
    // writers que este teste criou; somente depois retira referencias proprias.
    releases.forEach((release) => release());
    await Promise.allSettled(writers);
    assert.equal(sql(env, `select count(*) from public.capitulo_paginas where capitulo_id='${chapter}';`), "0");
    sql(env, `begin;
      delete from historietas_privado.capitulo_upload_recibos where user_id='${user}';
      delete from historietas_privado.capitulo_upload_tentativas where user_id='${user}';
      delete from public.obras where id='${work}' and user_id='${user}'; commit;`);
    if (paths.length) check(await admin.storage.from("arquivos-obras").remove(paths));
    sql(env, `delete from historietas_privado.capitulo_arquivos_limpeza where storage_path like '${user}/capitulos/%';
      delete from public.profiles where user_id='${user}';`);
    check(await admin.auth.admin.deleteUser(user));
  });
  const password = randomBytes(24).toString("base64url"), email = `qa-observacao-${user}@historietas.test`;
  check(await admin.auth.admin.createUser({ id: user, email, password, email_confirm: true }));
  check(await author.auth.signInWithPassword({ email, password }));
  sql(env, `begin; ${claims()}
    insert into public.profiles(id,user_id,nome,tipo) values('${user}','${user}','QA observacao','autor');
    select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
    insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug)
      values('${work}','${user}','QA observacao','QA','Fantasia','HQ','Livre',false,'qa-observacao-${work}');
    insert into public.capitulos(id,obra_id,user_id,titulo,ordem,publicado)
      values('${chapter}','${work}','${user}','Draft',1,false); commit;`);
  const imagem = async (red) => validarImagemPagina(await sharp({ create: {
    width: 12, height: 18, channels: 3, background: { r: red, g: 60, b: 20 },
  } }).png().toBuffer());
  const a = await imagem(140);
  let b;
  for (let color = 141; color < 160; color++) {
    const candidate = await imagem(color);
    if (candidate.tamanhoBytes === a.tamanhoBytes && candidate.sha256 !== a.sha256) { b = candidate; break; }
  }
  assert.ok(b, "Dois arquivos reais com metadata igual e hashes diferentes.");
  async function tentativa() {
    const reserved = check(await author.rpc("reservar_pagina_capitulo", { p_capitulo_id: chapter,
      p_versao_esperada: 0, p_chave_requisicao: randomUUID(), p_mime_type: a.mimeType }));
    const reserva = reserved.reservaId;
    assert.ok(reserva);
    sql(env, `begin; ${claims()}
      select historietas_privado.preparar_tentativa_upload_pagina('${reserva}','${chapter}',0,'${randomUUID()}');
      select historietas_privado.iniciar_transferencia_pagina(id,lease_token,'${a.sha256}',${a.tamanhoBytes},${a.largura},${a.altura},'${a.mimeType}')
        from historietas_privado.capitulo_upload_tentativas where reserva_id='${reserva}'; commit;`);
    const attempt = JSON.parse(sql(env, `select row_to_json(t) from historietas_privado.capitulo_upload_tentativas t where reserva_id='${reserva}';`));
    paths.push(attempt.storage_path);
    return attempt;
  }
  async function observar(attempt) {
    const info = check(await admin.storage.from("arquivos-obras").info(attempt.storage_path));
    assert.match(info.id, /^[0-9a-f-]{36}$/);
    assert.ok(info.version);
    sql(env, `select historietas_privado.registrar_observacao_upload_pagina('${attempt.id}','${attempt.lease_token}',
      '${info.id}','${info.version}','${a.sha256}');`);
    return JSON.parse(sql(env, `select row_to_json(r) from historietas_privado.capitulo_upload_recibos r where tentativa_id='${attempt.id}';`));
  }
  const upload = (attempt, bytes, upsert = false) => {
    const writer = admin.storage.from("arquivos-obras").upload(attempt.storage_path, bytes,
      { upsert, contentType: a.mimeType, cacheControl: "0" }).then(check);
    writers.push(writer);
    return writer;
  };
  const primeiro = await tentativa();
  await upload(primeiro, a.copiarBytes());
  const r = await observar(primeiro), receipt = reciboParaConferencia(r);
  let reciboRespostaPerdida;
  const capacidade = () => sql(env, `select metadata->>'size' from historietas_privado.objetos_storage_com_reservas() where name='${primeiro.storage_path}';`);

  await t.test("recibo privado real e bytes conferidos nao abrem gate nem liberam quota", async () => {
    const result = await conferirPaginaArmazenada(receipt, fonte);
    assert.equal(fechado(result), "conferido_sem_terminalidade");
    assert.deepEqual(result, await conferirPaginaArmazenada(receipt, fonte));
    assert.equal(capacidade(), "2097152");
    assert.ok(sql(env, `begin; ${claims()} select historietas_privado.conferir_finalizacao_pagina('${primeiro.id}','${primeiro.lease_token}','${r.id}'); rollback;`)
      .includes('"publicacaoHabilitada": false'));
  });
  await t.test("observacao SQL sozinha aceita metadata igual; bytes diferentes sao detectados", async () => {
    const errado = await tentativa();
    await upload(errado, b.copiarBytes());
    const observado = await observar(errado);
    assert.equal(fechado(await conferirPaginaArmazenada(reciboParaConferencia(observado), fonte)), "divergente");
  });
  await t.test("resposta perdida apos gravacao reconcilia por leitura, sem reenviar", async () => {
    const perdido = await tentativa();
    // Simula perda do resultado APOS o efeito real, nao terminalidade do protocolo.
    await assert.rejects(upload(perdido, a.copiarBytes()).then(() => { throw new Error("resposta perdida"); }));
    sql(env, `select historietas_privado.encerrar_tentativa_upload_pagina('${perdido.id}','${perdido.lease_token}','resposta_ambigua');`);
    const observado = await observar(perdido), count = writers.length;
    reciboRespostaPerdida = reciboParaConferencia(observado);
    assert.equal(fechado(await conferirPaginaArmazenada(reciboParaConferencia(observado), fonte)), "conferido_sem_terminalidade");
    assert.equal(writers.length, count);
    assert.equal(sql(env, `select estado from historietas_privado.capitulo_upload_tentativas where id='${perdido.id}';`), "incerta");
  });
  await t.test("escritor adiado pode mudar objeto apos match: observacao nao comprova terminalidade", async () => {
    let release;
    const barrier = new Promise((resolve) => { release = resolve; });
    releases.push(release);
    // Interleaving deterministico ANTES da admissao; fencing de IO ja admitido
    // permanece o bloqueador comprovado no diagnostico local 392ee0f2.
    const late = barrier.then(() => upload(primeiro, b.copiarBytes(), true));
    writers.push(late);
    assert.equal(fechado(await conferirPaginaArmazenada(receipt, fonte)), "conferido_sem_terminalidade");
    release(); await late;
    assert.equal(fechado(await conferirPaginaArmazenada(receipt, fonte)), "divergente");
    assert.equal(capacidade(), "2097152");
  });
  await t.test("falha de leitura e retry nao mudam recibos, manifesto, gates ou capacidade", async () => {
    const fail = { ...fonte, informar: async () => { throw new Error("indisponivel"); } };
    assert.equal(fechado(await conferirPaginaArmazenada(receipt, fail)), "inconclusivo");
    assert.equal(capacidade(), "2097152");
    assert.equal(sql(env, `select count(*) from public.capitulo_paginas where capitulo_id='${chapter}';`), "0");
    assert.equal(check(await admin.rpc("ha_uploads_ilustrados_pendentes_exclusao", { p_user_id: user })), true);
  });
  await t.test("logout, lease vencido e cascata nao removem capacidade ou autorizam publicacao", async () => {
    const previousClaims = claims();
    sql(env, `delete from auth.sessions where user_id='${user}';
      update historietas_privado.capitulo_upload_tentativas set criado_em=clock_timestamp()-interval '1 hour',
        lease_ate=clock_timestamp()-interval '58 minutes' where user_id='${user}';`);
    assert.equal(fechado(await conferirPaginaArmazenada(reciboRespostaPerdida, fonte)), "conferido_sem_terminalidade");
    assert.equal(capacidade(), "2097152");
    assert.throws(() => sql(env, `begin; ${previousClaims}
      select historietas_privado.conferir_finalizacao_pagina('${primeiro.id}','${primeiro.lease_token}','${r.id}'); rollback;`),
      (error) => /Sessao indisponivel/.test(error.stderr?.toString()));
    sql(env, `delete from public.obras where id='${work}' and user_id='${user}';`);
    assert.equal(sql(env, `select count(*) from historietas_privado.capitulo_upload_recibos where user_id='${user}';`), "3");
    assert.equal(capacidade(), "2097152");
    assert.equal(check(await admin.rpc("ha_uploads_ilustrados_pendentes_exclusao", { p_user_id: user })), true);
  });
});
