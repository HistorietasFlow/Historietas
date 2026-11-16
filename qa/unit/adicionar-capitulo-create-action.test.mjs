import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import "./adicionar-capitulo-recovery.test.mjs";

const source = readFileSync(new URL("../../app/adicionar-capitulo/hooks/useAdicionarCapituloCreateAction.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url), "utf8");

test("formulário delega criação e recuperação e exige nova intenção após sucesso", () => {
  assert.match(page, /from "\.\/hooks\/useAdicionarCapituloCreateAction"/);
  assert.match(page, /<form onSubmit=\{criarCapitulo\}/);
  assert.match(page, /onClick=\{verificarCriacao\}/);
  assert.match(page, /onClick=\{iniciarNovoCapitulo\}/);
  assert.match(page, /disabled=\{criacaoBloqueada\}/);
  assert.match(page, /preservarCriacao: true/);
  assert.doesNotMatch(page, /\.insert\(/);
});

test("autoria mantém filtros e cancelamento; recuperação usa somente leitura", () => {
  assert.match(source, /\.from\("obras"\)\.select\("id"\)\s*\.eq\("id", contexto\.obraId\)\.eq\("user_id", user\.id\)/);
  assert.match(source, /user\.id !== contexto\.userId/);
  assert.match(source, /supabase\.auth\.onAuthStateChange/);
  const recovery = source.slice(source.indexOf("async function verificarCriacao"), source.indexOf("function iniciarNovoCapitulo"));
  assert.match(recovery, /\.eq\("id", registro\.id\)\.eq\("obra_id", contexto\.obraId\)\.eq\("user_id", contexto\.userId\)/);
  assert.doesNotMatch(recovery, /\.insert\(|registrarDiario|registrarNotificacoes/);
});

test("INSERT preserva publicação e UUID registrado, sem retry e sem compensação destrutiva", () => {
  assert.match(source, /id: tentativa\.id, obra_id: contexto\.obraId, user_id: user\.id/);
  assert.match(source, /publicado: true,\s*\}\)\.select\(CAMPOS_CONFIRMACAO_CAPITULO\)\.single\(\)\.retry\(false\)/);
  assert.match(source, /\.order\("ordem", \{ ascending: false \}\)\.limit\(1\)/);
  assert.ok(source.indexOf("guardar(tentativa)") < source.indexOf('.insert({'));
  assert.doesNotMatch(source, /\.delete\(|\.upsert\(|ilustrad|storage\.from/);
});
