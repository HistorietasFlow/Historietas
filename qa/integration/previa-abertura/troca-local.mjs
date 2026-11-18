import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as pausa } from "node:timers/promises";

async function aguardar(predicado, mensagem) {
  const fim = Date.now() + 8000;
  while (!predicado()) {
    assert.ok(Date.now() < fim, mensagem);
    await pausa(25);
  }
}

// Só na base descartável. O lock serve de barreira observável entre a autorização
// da consulta e a leitura do texto. O processo de aplicação não recebe privilégios extras.
export async function revogarDuranteLeitura({ db, sql, pausar, ponte, conferir, origem, esperado }) {
  const trava = spawn("psql", ["-XqAt", "-v", "ON_ERROR_STOP=1", "-d", db.href], {
    env: { ...process.env, PGAPPNAME: "historietas_qa_trava_capitulos" },
    stdio: ["pipe", "ignore", "inherit"],
  });
  const concluida = once(trava, "exit");
  const pedidos = [];
  let controle;
  let soltou = false;
  function soltarTabela() {
    if (soltou) return;
    soltou = true;
    trava.stdin.end("rollback;\n");
  }
  try {
    trava.stdin.write("begin; set local lock_timeout='4s'; lock table public.capitulos in access exclusive mode;\n");
    const temTrava = `select exists(select 1 from pg_locks l join pg_stat_activity a using(pid)
      where l.relation='public.capitulos'::regclass and l.granted and l.mode='AccessExclusiveLock'
        and a.application_name='historietas_qa_trava_capitulos');`;
    await aguardar(() => sql(temTrava) === "t", "A barreira do banco não foi adquirida");
    // A primeira requisição chega ao banco com a chave A válida.
    const emSQL = conferir(origem, "publicada", {}, 200, esperado);
    pedidos.push(emSQL);
    emSQL.catch(() => {});
    await aguardar(() => sql(`select exists(select 1 from pg_locks l
      join pg_stat_activity dono on dono.pid=any(pg_blocking_pids(l.pid))
      where not l.granted and l.mode='AccessShareLock' and l.relation='public.capitulos'::regclass
        and dono.application_name='historietas_qa_trava_capitulos');`) === "t",
    "A leitura da prévia não chegou à barreira no PostgreSQL");

    // A segunda já saiu do Next assinada, mas ainda está antes do PostgREST.
    controle = ponte.pausarProximaPrevia();
    const emTransito = conferir(origem, "publicada", {}, 503);
    pedidos.push(emTransito);
    emTransito.catch(() => {});
    let timer;
    let exp;
    try {
      exp = await Promise.race([controle.recebida, new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("A requisição não chegou à ponte")), 8000);
      })]);
    } finally { clearTimeout(timer); }

    pausar();
    assert.equal(sql("select count(*) from previa_assinatura.chave_ativa;"), "0");
    assert.equal(sql(`select bool_and(not has_function_privilege(r,'public.previa_abertura_assinada(text)','EXECUTE'))
      from unnest(array['anon','authenticated']) r;`), "t");
    controle.liberar();
    await emTransito;
    assert.ok(exp * 1000 > Date.now(), "A prova em trânsito ainda estava no prazo quando recusada");
    await conferir(origem, "publicada", {}, 503);
    soltarTabela();
    await emSQL;
  } finally {
    controle?.liberar();
    soltarTabela();
    await Promise.allSettled(pedidos);
    assert.equal((await concluida)[0], 0);
  }
}
