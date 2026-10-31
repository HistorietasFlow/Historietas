import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const hookPath = new URL(
  "../../app/perfil-autor/top-5/hooks/use-top5-initial-load.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega o lifecycle inicial completo ao hook dedicado", async () => {
  const [hook, page] = await Promise.all([
    readFile(hookPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  for (const contract of [
    "export function useTop5InitialLoad",
    "useEffect(() => {",
    "let cancelado = false",
    "await carregarDadosIniciaisTop5()",
    'const userId = authData.user?.id || "";',
    "await resolverNomeUsuarioTop5(",
    "prepararConteudoInicialTop5(",
    "criarUsuarioTop5(",
    "setUsuario(",
    "setObras(obrasMescladas)",
    "setIdsSelecionados(idsNormalizados)",
    "sincronizarSelecaoInicialTop5(",
    "setUsuario(null)",
    "setObras([])",
    "setIdsSelecionados([])",
    "setCarregando(false)",
  ]) {
    assert.ok(hook.includes(contract), contract);
  }

  const primeiroCancelamento = hook.indexOf("if (cancelado)");
  const segundoCancelamento = hook.indexOf(
    "if (cancelado)",
    primeiroCancelamento + 1,
  );
  const prepararConteudo = hook.indexOf("prepararConteudoInicialTop5(");
  const setUsuario = hook.indexOf("setUsuario(");
  const setObras = hook.indexOf("setObras(obrasMescladas);");
  const setIds = hook.indexOf("setIdsSelecionados(idsNormalizados);");
  const sincronizar = hook.indexOf("sincronizarSelecaoInicialTop5(");

  assert.ok(primeiroCancelamento < segundoCancelamento);
  assert.ok(segundoCancelamento < prepararConteudo);
  assert.ok(prepararConteudo < setUsuario);
  assert.ok(setUsuario < setObras);
  assert.ok(setObras < setIds);
  assert.ok(setIds < sincronizar);

  assert.match(
    page,
    /import \{ useTop5InitialLoad \} from "\.\/hooks\/use-top5-initial-load";/,
  );
  assert.match(page, /useTop5InitialLoad\(\{\s*setUsuario,\s*setCarregando,\s*setObras,\s*setIdsSelecionados,\s*\}\);/);
  for (const forbidden of [
    "useEffect(",
    "carregarDadosIniciaisTop5(",
    "resolverNomeUsuarioTop5(",
    "prepararConteudoInicialTop5(",
    "sincronizarSelecaoInicialTop5(",
  ]) {
    assert.ok(!page.includes(forbidden), forbidden);
  }
});
