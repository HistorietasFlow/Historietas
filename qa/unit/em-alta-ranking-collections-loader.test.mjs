import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const modulo = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-ranking-collections-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);

test("loader preserva leituras, ordem, normalização e persistência das coleções", () => {
  assert.match(modulo, /export async function carregarColecoesRankingEmAlta\(userIdAtual: string\)/);
  assert.match(modulo, /await Promise\.all\(\[\s*carregarIdsColecaoUsuarioSupabaseEmAlta\("favoritos", userIdAtual\),\s*carregarIdsColecaoUsuarioSupabaseEmAlta\("concluidas", userIdAtual\),/);
  assert.match(modulo, /carregarListaIdsLocalEmAlta\(FAVORITES_STORAGE_KEY, userIdAtual\)/);
  assert.match(modulo, /carregarListaIdsLocalEmAlta\(COMPLETED_STORAGE_KEY, userIdAtual\)/);
  assert.match(modulo, /normalizarListaIdsEmAlta\(\[/);
  assert.match(modulo, /salvarListaIdsLocalEmAlta\(\s*FAVORITES_STORAGE_KEY,\s*userIdAtual,\s*obrasFavoritasNormalizadas,/);
  assert.match(modulo, /salvarListaIdsLocalEmAlta\(\s*COMPLETED_STORAGE_KEY,\s*userIdAtual,\s*obrasConcluidasNormalizadas,/);
  assert.doesNotMatch(modulo, /supabase\.from|\.insert\(|\.update\(|\.delete\(/);
});

test("página delega somente o snapshot de coleções e preserva o lifecycle", () => {
  assert.match(pagina, /import \{ carregarColecoesRankingEmAlta \} from "\.\/lib\/em-alta-ranking-collections-loader";/);
  assert.match(pagina, /await carregarColecoesRankingEmAlta\(userIdAtual\)/);
  assert.match(pagina, /async function carregarRanking\(/);
  assert.doesNotMatch(pagina, /const \[favoritosSupabase, concluidasSupabase\]/);
});
