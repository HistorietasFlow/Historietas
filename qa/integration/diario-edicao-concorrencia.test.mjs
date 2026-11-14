import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {readFileSync} from "node:fs";
import {randomUUID} from "node:crypto";
import {promisify} from "node:util";
import test from "node:test";

const run = promisify(execFile);
const container = process.env.HISTORIETAS_DIARIO_LOCAL_CONTAINER;
assert.match(container || "", /^supabase_db_[a-zA-Z0-9_-]+$/, "indique explicitamente o container Supabase LOCAL descartável");
async function sql(query) {
  const {stdout} = await run("docker", ["exec", container, "psql", "-U", "postgres", "-d", "postgres", "-Atq", "-v", "ON_ERROR_STOP=1", "-c", query]);
  return stdout.trim();
}

test("duas conexões, commit sem resposta consumida e exclusão não duplicam Diário", async () => {
  const {stdout: endpoint} = await run("docker", ["context", "inspect", "--format", "{{.Endpoints.docker.Host}}"]);
  assert.match(process.env.DOCKER_HOST || endpoint.trim(), /^(unix:\/\/|npipe:\/\/)/, "Docker deve usar socket local, nunca endpoint TCP remoto");
  const actor = randomUUID(), work = randomUUID(), chapter = randomUUID(), session = randomUUID();
  const claims = JSON.stringify({sub: actor, role: "authenticated", session_id: session});
  const auth = `set local request.jwt.claim.sub='${actor}'; set local request.jwt.claims='${claims}';`;
  assert.equal(await sql("select habilitado from historietas_privado.diario_edicao_config"), "f", "teste exige gate inicialmente fechado");
  const pending = [];
  try {
    await sql(`begin; ${auth}
      insert into auth.users(id) values('${actor}');
      insert into public.profiles(id,user_id,nome,tipo) values('${actor}','${actor}','QA Diario','autor');
      select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
      insert into auth.sessions(id,user_id) values('${session}','${actor}');
      insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug)
      values('${work}','${actor}','QA Diario','QA','Fantasia','Romance','Livre',true,'qa-diario-${work}');
      insert into public.capitulos(id,obra_id,user_id,titulo,texto,ordem,publicado)
      values('${chapter}','${work}','${actor}','QA','Inicial',1,true);
      update public.capitulos set texto='Edicao real' where id='${chapter}';
      update historietas_privado.diario_edicao_config set habilitado=true; commit;`);
    const version = await sql(`select diario_edicao_versao from public.capitulos where id='${chapter}'`);
    assert.match(version, /^[a-f0-9-]{36}$/);
    const call = `select public.registrar_diario_edicao_capitulo('${chapter}','${version}');`;
    const firstName = `qa-diario-first-${actor}`, secondName = `qa-diario-second-${actor}`;
    async function waitForState(name, predicate) {
      for (let i = 0; i < 25; i++) {
        if (await sql(`select count(*) from pg_stat_activity where application_name='${name}' and ${predicate}`) === "1") return;
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      assert.fail(`conexão não atingiu estado esperado: ${name}`);
    }
    pending.push(sql(`begin; set local application_name='${firstName}'; ${auth} set local role authenticated; ${call} select pg_sleep(3); commit;`));
    await waitForState(firstName, "wait_event='PgSleep'");
    pending.push(sql(`begin; set local application_name='${secondName}'; ${auth} set local role authenticated; ${call} commit;`));
    await waitForState(secondName, "wait_event_type='Lock'");
    const [first, second] = await Promise.all(pending);
    const receipt = first.trim(); assert.equal(receipt, second.trim());
    assert.match(receipt, /^[a-f0-9-]{36}$/);
    const rollback = readFileSync(new URL("../../docs/sql/rollback-diario-edicao-evento-seguro.sql", import.meta.url), "utf8");
    await assert.rejects(() => sql(rollback), /Rollback fisico recusado/);
    // Commit da primeira chamada ja ocorreu; simula cliente que perdeu seu recibo.
    assert.equal(await sql(`begin; ${auth} set local role authenticated; ${call} commit;`), receipt);
    assert.equal(await sql(`select count(*) from public.diario_atividades where capitulo_id='${chapter}' and tipo='editou_capitulo'`), "1");
    assert.equal(await sql(`select count(*) from historietas_privado.diario_edicao_recibos where capitulo_id='${chapter}'`), "1");
    await sql(`begin; ${auth} set local role authenticated; delete from public.diario_atividades where id='${receipt}'; commit;`);
    assert.equal(await sql(`begin; ${auth} set local role authenticated; ${call} commit;`), "");
    assert.equal(await sql(`select count(*) from public.diario_atividades where capitulo_id='${chapter}' and tipo='editou_capitulo'`), "0");
  } finally {
    await Promise.allSettled(pending);
    await sql(`begin;
      update historietas_privado.diario_edicao_config set habilitado=false;
      delete from historietas_privado.diario_edicao_recibos where autor_id='${actor}';
      delete from public.diario_atividades where user_id='${actor}';
      delete from auth.users where id='${actor}'; commit;`);
  }
});
