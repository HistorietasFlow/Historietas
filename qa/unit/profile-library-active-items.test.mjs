import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const helper = readFileSync(new URL("../../app/perfil-autor/lib/profile-library-active-items.ts", import.meta.url), "utf8");
const pagina = readFileSync(new URL("../../app/perfil-autor/page.tsx", import.meta.url), "utf8");

test("a página delega seleção de itens da Biblioteca", () => {
  assert.match(pagina, /import \{ selecionarItensBibliotecaPerfil \}/);
  assert.match(pagina, /const itensBibliotecaAtivos = useMemo\(\(\) => \{\s*return selecionarItensBibliotecaPerfil\(\{/);
  for (const campo of ["aba", "queroLer", "lendoAgora", "favoritas", "concluidas", "salvos", "historico"]) {
    assert.match(pagina, new RegExp(campo + ":"));
  }
});

test("todas as seis abas preservam o array original", () => {
  for (const [aba, retorno] of [
    ["quero-ler", "queroLer"],
    ["lendo-agora", "lendoAgora"],
    ["favoritas", "favoritas"],
    ["concluidas", "concluidas"],
    ["salvos", "salvos"],
    ["historico", "historico"],
  ]) {
    assert.ok(helper.includes('case "' + aba + '":\n      return ' + retorno + ';'), aba);
  }
});

test("aba tudo preserva a ordem original da mesclagem", () => {
  assert.match(helper, /default:\s*return mesclarItensBibliotecaPerfil\(\s*queroLer, lendoAgora, favoritas, concluidas, salvos, historico,/);
});
