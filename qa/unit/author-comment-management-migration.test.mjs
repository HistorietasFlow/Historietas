import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20261106222208_permitir_autor_gerenciar_comentarios.sql",
    import.meta.url,
  ),
  "utf8",
);

test("policies de remoção preservam comentarista, admin e autor da obra", () => {
  assert.match(migration, /for delete\s+to authenticated/gi);
  assert.match(migration, /user_id = \(select auth\.uid\(\)\)/g);
  assert.match(migration, /public\.usuario_e_admin\(\)/g);
  assert.match(
    migration,
    /from public\.obras obra[\s\S]*?obra\.id = comentarios_obras\.obra_id[\s\S]*?obra\.user_id = \(select auth\.uid\(\)\)/,
  );
  assert.match(
    migration,
    /from public\.capitulos capitulo[\s\S]*?join public\.obras obra on obra\.id = capitulo\.obra_id[\s\S]*?capitulo\.id = comentarios_capitulos\.capitulo_id[\s\S]*?obra\.user_id = \(select auth\.uid\(\)\)/,
  );
  assert.doesNotMatch(migration, /\bto\s+(?:anon|public)\b/i);
});
