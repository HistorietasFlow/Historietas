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

test("página delega a leitura e normalização local ao snapshot", () => {
  assert.match(
    pagina,
    /import \{ carregarDadosLocaisSeguindo \} from "\.\/lib\/seguindo-local-data-utils";/,
  );
  assert.match(
    pagina,
    /\} = carregarDadosLocaisSeguindo\(usuarioLogadoId\);/,
  );
  assert.doesNotMatch(pagina, /lerJsonStorageUsuarioSeguindo/);
});
