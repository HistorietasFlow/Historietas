import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

assert.ok(process.env.GITHUB_ENV, "Somente GitHub Actions");
const raw = execFileSync("supabase", ["status", "-o", "env"], { encoding: "utf8" });
const vars = Object.fromEntries(raw.split(/\r?\n/).map(line =>
  /^([A-Z0-9_]+)=(.*)$/.exec(line.trim())).filter(Boolean)
  .map(match => [match[1], match[2].startsWith('"')
    ? JSON.parse(match[2]) : match[2].replace(/^'|'$/g, "")]));
assert.ok(vars.API_URL && vars.DB_URL, "Supabase descartavel nao encontrado");
for (const input of [vars.API_URL, vars.DB_URL]) {
  const u = new URL(input);
  assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(u.hostname),
    "PROIBIDO acessar Supabase remoto");
}
const anon = vars.PUBLISHABLE_KEY || vars.ANON_KEY;
assert.ok(anon, "Chave anon local ausente");
appendFileSync(process.env.GITHUB_ENV,
  "NEXT_PUBLIC_SUPABASE_URL=" + vars.API_URL + "\n" +
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=" + anon + "\n" +
  "NEXT_PUBLIC_SUPABASE_ANON_KEY=" + anon + "\n");
console.log("Configuracao de Supabase anon apenas localhost pronta; nenhuma chave exibida.");
