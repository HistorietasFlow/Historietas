import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import "./private-cover-integration.test.mjs";

const migrationsDir = new URL("../../supabase/migrations/", import.meta.url);
const migrationName = readdirSync(migrationsDir).find((name) =>
  name.endsWith("_restringir_listagem_storage_ao_proprietario.sql"),
);

assert.ok(migrationName, "migration de isolamento da listagem ausente");

const migration = readFileSync(new URL(migrationName, migrationsDir), "utf8");

test("migration restringe SELECT de avatars e capas-obras ao proprietario", () => {
  assert.match(
    migration,
    /drop policy if exists "avatars_select_publico" on storage\.objects;/,
  );
  assert.match(
    migration,
    /drop policy if exists "storage_capas_select_publico" on storage\.objects;/,
  );

  for (const [policy, bucket] of [
    ["avatars_select_proprio", "avatars"],
    ["storage_capas_select_proprio", "capas-obras"],
  ]) {
    assert.match(
      migration,
      new RegExp(
        `create policy "${policy}"[\\s\\S]*?for select[\\s\\S]*?to authenticated[\\s\\S]*?bucket_id = '${bucket}'[\\s\\S]*?\\(storage\\.foldername\\(name\\)\\)\\[1\\] = auth\\.uid\\(\\)::text`,
        "i",
      ),
    );
  }
});

test("migration nao altera buckets nem policies de escrita", () => {
  assert.doesNotMatch(migration, /update\s+storage\.buckets/i);
  assert.doesNotMatch(migration, /for\s+(insert|update|delete)/i);
  assert.doesNotMatch(migration, /file_size_limit|allowed_mime_types/i);
});
