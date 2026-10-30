import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/listas/page.tsx", import.meta.url),
  "utf8",
);
const types = readFileSync(
  new URL("../../app/listas/types.ts", import.meta.url),
  "utf8",
);
const constants = readFileSync(
  new URL("../../app/listas/lib/listas-page-constants.ts", import.meta.url),
  "utf8",
);

const tipos = [
  "ModoLista",
  "OrigemPerfil",
  "CategoriaPerfil",
  "OrdenacaoLista",
  "VisibilidadeAnotacaoListas",
  "QuemPodeComentarAnotacaoListas",
  "VisibilidadeComentariosAnotacaoListas",
  "TipoDiarioListas",
  "CapituloLista",
  "ObraLista",
  "PerfilLista",
  "ItemObraLista",
  "AutorLista",
  "ListasPerfilEstado",
  "EditorAnotacaoListasEstado",
  "AlvoDenunciaDiarioListas",
];

const constantes = [
  "LISTAS_PERFIL_VAZIAS",
  "PERMISSOES_PROPRIO_PERFIL",
  "CATEGORIAS_PERFIL",
  "LIBRARY_FOLLOW_STORAGE_KEY",
  "FAVORITES_STORAGE_KEY",
  "COMPLETED_STORAGE_KEY",
  "DIARIO_ANOTACAO_MAX_LENGTH",
  "DIARIO_COMENTARIO_MAX_LENGTH",
  "NOTAS_AVALIACAO_LISTAS",
  "EDITOR_ANOTACAO_LISTAS_VAZIO",
];

test("Listas centraliza os contratos locais de tipo em types.ts", () => {
  for (const tipo of tipos) {
    assert.match(types, new RegExp(`export type ${tipo}\\b`));
    assert.doesNotMatch(pagina, new RegExp(`^type ${tipo}\\b`, "m"));
  }

  assert.match(types, /TipoAlvoDenuncia/);
  assert.match(types, /"perfil" \| "obras" \| "autores"/);
  assert.match(types, /"publico" \| "parcial" \| "privado"/);
  assert.match(types, /"diario_anotacao" \| "comentario_diario"/);
  assert.match(pagina, /from "\.\/types";/);
});

test("Listas centraliza as constantes estáticas sem alterar seus contratos", () => {
  for (const constante of constantes) {
    assert.match(constants, new RegExp(`export const ${constante}\\b`));
    assert.doesNotMatch(pagina, new RegExp(`^const ${constante}\\b`, "m"));
  }

  assert.match(constants, /"historietas-obras-seguidas"/);
  assert.match(constants, /"historietas-obras-favoritas"/);
  assert.match(constants, /"historietas-obras-concluidas"/);
  assert.match(constants, /DIARIO_ANOTACAO_MAX_LENGTH = 700/);
  assert.match(constants, /DIARIO_COMENTARIO_MAX_LENGTH = 700/);
  assert.match(constants, /NOTAS_AVALIACAO_LISTAS = \[1, 2, 3, 4, 5\] as const/);
  assert.match(constants, /tipo: "atividade"/);
  assert.match(constants, /visibilidade: "privado"/);
  assert.match(pagina, /from "\.\/lib\/listas-page-constants";/);
});

test("módulos extraídos permanecem declarativos", () => {
  for (const modulo of [types, constants]) {
    assert.doesNotMatch(modulo, /useState|useEffect|supabase|localStorage|fetch\(/);
    assert.doesNotMatch(modulo, /<[a-z][\w-]*(?:\s|>|\/)/);
  }
});
