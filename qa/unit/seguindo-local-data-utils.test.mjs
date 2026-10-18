import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/seguindo/lib/seguindo-local-data-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const carregador = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-data-loader.ts",
    import.meta.url,
  ),
  "utf8",
);

test("snapshot local preserva as cinco coleções e seus normalizadores", () => {
  for (const chave of [
    "STORAGE_KEY",
    "FOLLOW_STORAGE_KEY",
    "AUTHOR_FOLLOW_STORAGE_KEY",
    "FAVORITES_STORAGE_KEY",
    "COMPLETED_STORAGE_KEY",
  ]) {
    assert.match(source, new RegExp(`lerJsonStorageUsuarioSeguindo\\(\\s*${chave}`));
  }

  assert.match(source, /normalizarObraSalva\(/);
  assert.match(source, /normalizarListaTexto\(/);
  assert.match(source, /normalizarNomeAutor\(/);
  assert.match(
    source,
    /catch \{[\s\S]*?obras: \[\],[\s\S]*?obrasSeguidas: \[\],[\s\S]*?autoresSeguidos: \[\],[\s\S]*?obrasFavoritas: \[\],[\s\S]*?obrasConcluidas: \[\]/,
  );
});

test("carregador principal delega a leitura e normalização local ao snapshot", () => {
  assert.match(
    carregador,
    /carregarDadosLocaisSeguindo,[\s\S]*?salvarDadosLocaisSeguindo,[\s\S]*?from "\.\.\/lib\/seguindo-local-data-utils";/,
  );
  assert.match(
    carregador,
    /const dadosLocaisSeguindo = carregarDadosLocaisSeguindo\(usuarioLogadoId\);/,
  );
  assert.doesNotMatch(pagina, /lerJsonStorageUsuarioSeguindo/);
});

test("persistência local preserva as cinco coleções do snapshot", () => {
  for (const chave of [
    "STORAGE_KEY",
    "FOLLOW_STORAGE_KEY",
    "AUTHOR_FOLLOW_STORAGE_KEY",
    "FAVORITES_STORAGE_KEY",
    "COMPLETED_STORAGE_KEY",
  ]) {
    assert.match(
      source,
      new RegExp(`salvarJsonStorageUsuarioSeguindo\\(\\s*${chave}`),
    );
  }

  assert.match(
    carregador,
    /salvarDadosLocaisSeguindo\(\{[\s\S]*?userId: usuarioLogadoId,[\s\S]*?obras: obrasNormalizadas,[\s\S]*?obrasSeguidas: seguindoNormalizado,[\s\S]*?autoresSeguidos: autoresNormalizados,[\s\S]*?obrasFavoritas: favoritasNormalizadas,[\s\S]*?obrasConcluidas: concluidasNormalizadas,[\s\S]*?\}\);/,
  );
});

