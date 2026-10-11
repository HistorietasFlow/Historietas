import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-rating-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

test("Perfil de Autor delega a sincronização da avaliação do autor", () => {
  assert.match(pagina, /usePerfilAutorRatingSync/);
  assert.match(
    pagina,
    /usePerfilAutorRatingSync\(\{[\s\S]*?perfilParaMostrar,[\s\S]*?autorPodeReceberAvaliacao,[\s\S]*?usuarioIdLogado,[\s\S]*?perfilPertenceAoUsuario,[\s\S]*?setAvaliacaoAutor,[\s\S]*?\}\)/,
  );
  assert.doesNotMatch(pagina, /async function carregarAvaliacaoRealAutor\(/);
});

test("hook preserva fallback local e limpeza no próprio perfil", () => {
  assert.match(
    source,
    /if \(!perfilParaMostrar \|\| !autorPodeReceberAvaliacao\)/,
  );
  assert.match(source, /setAvaliacaoAutor\(avaliacaoAutorVazia\)/);
  assert.match(source, /obterAvaliacaoAutorLocal\(/);
  assert.match(
    source,
    /if \(perfilPertenceAoUsuario && usuarioIdLogado\.trim\(\)\)/,
  );
  assert.match(source, /salvarAvaliacaoAutorLocal\(/);
});

test("hook preserva métricas remotas, proteção de estado, timer e cancelamento", () => {
  assert.match(source, /supabase\.auth\.getUser\(\)/);
  assert.match(source, /carregarMetricasConteudos\(\{/);
  assert.match(source, /contrato\.autores\.get\(autorId\)/);
  assert.match(source, /avaliacaoAtual\.salvando/);
  assert.match(source, /avaliacaoAtual\.minhaNota !== notaLocal/);
  assert.match(source, /let cancelado = false;/);
  assert.match(source, /if \(cancelado\) \{/);
  assert.match(
    source,
    /window\.setTimeout\(\(\) => \{\s*void carregarAvaliacaoRealAutor\(\);\s*\}, 0\)/,
  );
  assert.match(source, /cancelado = true;/);
  assert.match(source, /window\.clearTimeout\(carregarAvaliacaoAutorTimer\)/);
});
