import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/admin/comunidade/loaders/carregar-alvos-primarios-moderacao.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("loader preserva as cinco consultas e seus fallbacks independentes", () => {
  for (const tabela of [
    "comunidade_posts",
    "comunidade_comentarios",
    "comentarios_capitulos",
    "comentarios_obras",
    "diario_anotacao_comentarios",
  ]) assert.match(source, new RegExp(`from\\("${tabela}"\\)`));
  for (const select of [
    "id, autor_nome, categoria, tipo_publicacao, tem_spoiler, texto, obra_relacionada, criado_em",
    "id, post_id, autor_nome, texto, criado_em",
    "id, capitulo_id, user_id, comentario, criado_em",
    "id, obra_id, user_id, comentario, criado_em",
    "id, anotacao_id, user_id, texto, criado_em, atualizado_em",
  ]) assert.match(source, new RegExp(select));
  assert.equal((source.match(/\.in\("id",/g) || []).length, 5);
  assert.equal((source.match(/\.limit\(500\)/g) || []).length, 5);
  assert.equal((source.match(/Promise\.resolve\(\{ data: \[\], error: null \}\)/g) || []).length, 5);
  for (const nome of ["posts", "comentarios", "comentariosCapitulos", "comentariosObras", "comentariosDiario"]) {
    assert.match(source, new RegExp(`const ${nome} =`));
  }
});

test("Admin Comunidade delega apenas alvos primários e preserva contexto", () => {
  assert.match(page, /buscarAlvosPrimariosModeracao\(\{/);
  assert.match(page, /capituloIdsContexto/);
  assert.match(page, /setDenuncias\(/);
  assert.doesNotMatch(source, /useState|useEffect|useMemo|router|localStorage|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/);
});
