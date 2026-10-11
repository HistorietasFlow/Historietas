import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-diary-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

test("Perfil de Autor delega a sincronização do Diário", () => {
  assert.match(pagina, /usePerfilAutorDiarySync/);
  assert.match(
    pagina,
    /usePerfilAutorDiarySync\(\{[\s\S]*?perfilParaMostrar,[\s\S]*?obras,[\s\S]*?obrasFavoritas,[\s\S]*?obrasConcluidas,[\s\S]*?obrasSeguidasBiblioteca,[\s\S]*?podeEditarPerfil,[\s\S]*?bibliotecaPerfilVisivel,[\s\S]*?abaPerfil,[\s\S]*?usuarioIdLogado,[\s\S]*?versaoSincronizacaoBiblioteca,[\s\S]*?permissoesAbasPerfil,[\s\S]*?diarioPerfilVisivel,[\s\S]*?atividadesPerfilVisivel,[\s\S]*?setDiarioPerfil,[\s\S]*?\}\)/,
  );
  assert.doesNotMatch(pagina, /async function carregarDiarioPerfil\(/);
});

test("hook preserva fallback e fonte do Diário", () => {
  assert.match(source, /if \(!perfilAtual\)/);
  assert.match(source, /setDiarioPerfil\(diarioPerfilVazio\)/);
  assert.match(source, /bibliotecaPerfilVisivel/);
  assert.match(source, /abaPerfil === "biblioteca"/);
  assert.match(source, /usuarioIdLogado\.trim\(\)/);
  assert.match(source, /podeEditarPerfil/);
  assert.match(source, /criarEstadoDiarioPerfilVazio\(\)/);
});

test("hook preserva carregamento remoto, permissões, timer e cancelamento", () => {
  assert.match(source, /await carregarDiarioPerfilSupabase\(/);
  assert.match(source, /mesclarDiarioPerfilComLocal\(diarioSupabase, diarioLocal\)/);
  assert.match(source, /aplicarPermissoesAbasAoDiario\(/);
  assert.match(source, /let cancelado = false;/);
  assert.match(source, /if \(!cancelado\) \{/);
  assert.match(
    source,
    /window\.setTimeout\(\(\) => \{\s*void carregarDiarioPerfil\(\);\s*\}, 0\)/,
  );
  assert.match(source, /cancelado = true;/);
  assert.match(source, /window\.clearTimeout\(carregarDiarioTimer\)/);
});
