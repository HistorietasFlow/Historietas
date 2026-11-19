import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

// Entrada: saída de `supabase status -o env` da stack descartável.
const linha = readFileSync(0, "utf8").split(/\r?\n/).find((line) => line.startsWith("DB_URL="));
assert.ok(linha, "DB_URL do Supabase local ausente");
const valor = linha.slice("DB_URL=".length);
const db = new URL(valor.startsWith('"') ? JSON.parse(valor) : valor);
assert.ok(["postgres:", "postgresql:"].includes(db.protocol));
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(db.hostname));
assert.equal(db.search, "", "A conexão de QA deve ser direta");

const instalar = "supabase/migrations/20261119045900_recomendacoes_sinais_inativos.sql";
const reverter = "docs/sql/rollback-recomendacoes-sinais.sql";
const opcaoPsql = ["-XqAt", "-v", "ON_ERROR_STOP=1", "-d", db.href];

function sql(input) {
  return execFileSync("psql", opcaoPsql, { input, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
}

function executarArquivo(file) {
  const processo = spawnSync("psql", [...opcaoPsql, "-f", file], { encoding: "utf8" });
  if (processo.error) throw processo.error;
  return processo;
}

function conferirHash(file, expected) {
  assert.equal(createHash("sha256").update(readFileSync(file)).digest("hex"), expected, file);
}

const instalada = `select to_regprocedure('public.qa5_generos_interacoes_autorizadas()') is not null`;
const ausente = `select to_regnamespace('qa5_sinais_interno') is null
  and to_regprocedure('public.qa5_generos_interacoes_autorizadas()') is null`;
const dependencia = "public.qa5_qa_dependencia_reversao()";
const contrato = `
  select nspowner::regrole, nspacl from pg_namespace where nspname = 'qa5_sinais_interno';
  select proowner::regrole, proacl, pg_get_functiondef(oid) from pg_proc
  where oid in ('public.qa5_generos_interacoes_autorizadas()'::regprocedure,
    'qa5_sinais_interno.autores_visiveis(uuid[])'::regprocedure)
  order by proname;
`;

test("Reversão exata aborta com dependência e restaura o contrato de instalação", () => {
  conferirHash(instalar, "b9bcb3974c1da3415600482b41ea4e2228e3902d02cfe399adc98948c3529a29");
  conferirHash(reverter, "d22471e18375fc17835c9c6b2869f350fc53c19fc14b8cbea216cd5350653d68");
  assert.equal(sql(instalada), "t", "Supabase local deve estar com a migration instalada");
  const antes = sql(contrato);

  sql(`create function ${dependencia} returns text[] language sql security invoker set search_path = ''
    return public.qa5_generos_interacoes_autorizadas()`);
  try {
    const recusada = executarArquivo(reverter);
    assert.equal(recusada.status, 3);
    assert.match(recusada.stderr, /because other objects depend on it/);
    assert.equal(sql(instalada), "t");
    assert.equal(sql(`select to_regprocedure('qa5_sinais_interno.autores_visiveis(uuid[])') is not null`), "t");
  } finally {
    sql(`drop function ${dependencia} restrict`);
  }

  const rollback = executarArquivo(reverter);
  assert.equal(rollback.status, 0, rollback.stderr);
  try {
    assert.equal(sql(ausente), "t");
  } finally {
    const instalacao = executarArquivo(instalar);
    assert.equal(instalacao.status, 0, instalacao.stderr);
  }
  assert.equal(sql(contrato), antes, "Funções, proprietários e permissões após reinstalação");
});
