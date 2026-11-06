import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20261106212539_sincronizar_progresso_leitura_dispositivos.sql",
    import.meta.url,
  ),
  "utf8",
).replace(/\r\n/g, "\n");

test("a sincronização de progresso preserva somente a alteração mais recente", () => {
  assert.match(
    migration,
    /create or replace function public\.salvar_progresso_leitura\([\s\S]*?returns boolean[\s\S]*?security invoker[\s\S]*?set search_path = ''/,
  );
  assert.match(migration, /v_user_id uuid := auth\.uid\(\)/);
  assert.match(
    migration,
    /on conflict \(user_id, obra_id, capitulo_id\)[\s\S]*?do update set[\s\S]*?lido = excluded\.lido,[\s\S]*?atualizado_em = excluded\.atualizado_em[\s\S]*?where public\.progresso_leitura\.atualizado_em <= excluded\.atualizado_em/,
  );
  assert.doesNotMatch(migration, /delete from public\.progresso_leitura/i);
  assert.match(
    migration,
    /return coalesce\(v_estado_atual = p_lido, false\)/,
  );
});

test("a RPC continua restrita ao usuário autenticado e à RLS", () => {
  assert.match(
    migration,
    /revoke all on function public\.salvar_progresso_leitura\([\s\S]*?\) from public, anon/,
  );
  assert.match(
    migration,
    /grant execute on function public\.salvar_progresso_leitura\([\s\S]*?\) to authenticated/,
  );
  assert.doesNotMatch(migration, /security definer/i);
  assert.doesNotMatch(migration, /service_role/i);
});
