import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const cutoff = "20261030000000";
const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "..", "..", "supabase", "migrations");

const migrationFiles = readdirSync(migrationsDir)
  .filter((name) => /^\d{14}_.+\.sql$/.test(name))
  .filter((name) => name.slice(0, 14) >= cutoff)
  .sort();

const failures = [];

for (const file of migrationFiles) {
  const sql = readFileSync(join(migrationsDir, file), "utf8");
  const createdTables = [
    ...sql.matchAll(
      /create\s+table\s+(?:if\s+not\s+exists\s+)?public\.("?([a-zA-Z0-9_]+)"?)/gi,
    ),
  ].map((match) => match[1]);

  for (const table of createdTables) {
    const escapedTable = table.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
    const explicitAcl = new RegExp(
      "\\b(?:grant|revoke)\\b[\\s\\S]*?\\bon\\s+(?:table\\s+)?public\\.\"?" +
        escapedTable +
        "\"?\\b",
      "i",
    );

    if (!explicitAcl.test(sql)) {
      failures.push(file + ": public." + table + " sem GRANT/REVOKE explícito");
    }
  }
}

if (failures.length > 0) {
  console.error("Falha na regra de acesso da Data API:");
  for (const failure of failures) {
    console.error("- " + failure);
  }
  process.exit(1);
}

console.log(
  "OK: " +
    migrationFiles.length +
    " migration(s) nova(s) verificada(s) para GRANT/REVOKE explícito em tabelas public.",
);
