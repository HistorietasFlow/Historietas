import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/admin/problemas-tecnicos/page.tsx", "utf8");
const source = readFileSync("app/admin/problemas-tecnicos/lib/admin-problemas-tecnicos-normalization-utils.ts", "utf8");

test("normalizadores de problemas técnicos preservam contratos e fallbacks", () => {
  assert.deepEqual([...source.matchAll(/"(aberto|em_analise|aguardando_usuario|resolvido|fechado)"/g)].slice(0, 5).map((match) => match[1]), ["aberto", "em_analise", "aguardando_usuario", "resolvido", "fechado"]);
  assert.match(source, /: "aberto"/);
  assert.match(source, /: "normal"/);
  assert.match(source, /: "outro"/);
  ["conta_acesso", "publicacao", "leitura", "comunidade", "diario", "notificacoes", "privacidade", "desempenho", "outro"].forEach((categoria) => assert.ok(source.includes(`"${categoria}"`), categoria));
  assert.match(source, /new Set<CategoriaProblemaTecnico>/);
  assert.doesNotMatch(source, /\.trim\(|\.toLowerCase\(|useState|useEffect|supabase|fetch\(|router|localStorage/);
});

test("página delega normalização e preserva o mapeamento Supabase", () => {
  assert.match(page, /from "\.\/lib\/admin-problemas-tecnicos-normalization-utils";/);
  assert.doesNotMatch(page, /function normalizarStatus/);
  assert.doesNotMatch(page, /function normalizarPrioridade/);
  assert.doesNotMatch(page, /function normalizarCategoria/);
  assert.match(page, /\.from\("problemas_tecnicos"\)/);
  ["normalizarCategoria(registro.categoria)", "normalizarStatus(registro.status)", "normalizarPrioridade(registro.prioridade)"].forEach((uso) => assert.ok(page.includes(uso), uso));
});
