import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20261105203938_corrigir_aceite_termos_profile_ausente.sql",
  "utf8",
);

test("aceite preserva validacoes antes de recuperar profile ausente", () => {
  const autenticacao = migration.indexOf("if v_user_id is null then");
  const versoes = migration.indexOf("if p_termos_versao is distinct from");
  const primeiroUpdate = migration.indexOf("update public.profiles");
  const insert = migration.indexOf("insert into public.profiles");

  assert.ok(autenticacao >= 0);
  assert.ok(versoes > autenticacao);
  assert.ok(primeiroUpdate > versoes);
  assert.ok(insert > primeiroUpdate);
  assert.match(migration, /using errcode = '42501'/);
  assert.match(migration, /using errcode = '22023'/);
});

test("profile minimo usa somente a identidade autenticada para autorizacao", () => {
  assert.match(migration, /v_user_id uuid := auth\.uid\(\)/);
  assert.match(
    migration,
    /values \(\s*v_user_id,\s*v_user_id,\s*v_nome,\s*'leitor'/,
  );
  assert.doesNotMatch(migration, /raw_user_meta_data\s*->>?\s*'tipo'/);
  assert.doesNotMatch(migration, /raw_user_meta_data\s*->>?\s*'is_admin'/);
});

test("nome de exibicao e limitado, normalizado e possui fallback", () => {
  assert.match(migration, /pg_catalog\.jsonb_typeof/);
  assert.match(migration, /\[\[:cntrl:\]\]\+/);
  assert.match(migration, /\[<>\]/);
  assert.match(migration, /\[\[:space:\]\]\+/);
  assert.match(migration, /pg_catalog\.left\([\s\S]*?80\s*\)/);
  assert.match(migration, /v_nome := 'Usuário'/);
});

test("concorrencia e retry reconciliam o profile vencedor", () => {
  assert.match(migration, /on conflict do nothing/);
  assert.equal(
    (migration.match(/update public\.profiles/g) || []).length,
    2,
  );
  assert.match(
    migration,
    /if found then\s*return true;\s*end if;[\s\S]*on conflict do nothing;[\s\S]*update public\.profiles/,
  );
});

test("ACL e fronteira SECURITY DEFINER permanecem restritas", () => {
  assert.match(migration, /security definer/);
  assert.match(migration, /set search_path = ''/);
  assert.match(
    migration,
    /revoke all on function historietas_privado\.aceitar_termos_publicacao[\s\S]*from public, anon, service_role/,
  );
  assert.match(
    migration,
    /grant execute on function historietas_privado\.aceitar_termos_publicacao[\s\S]*to authenticated/,
  );
  assert.match(
    migration,
    /revoke all on function public\.aceitar_termos_publicacao[\s\S]*from public, anon, service_role/,
  );
});
