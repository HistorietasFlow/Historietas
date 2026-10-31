import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-comments-load-pagination.ts",
    import.meta.url,
  ),
  "utf8",
);
const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("lifecycle de leitura e paginacao de comentarios esta delegado ao hook", () => {
  assert.match(hook, /export function useObraCommentsLoadPagination/);
  assert.match(hook, /const comentariosConsultaVersaoRef = useRef\(0\)/);
  assert.match(hook, /if \(!comentariosAbertos\) \{\s*return;\s*\}/);
  assert.match(
    hook,
    /carregarComentariosObraLocais\(usuarioIdLogado, obraIdComentarios\)/,
  );
  assert.match(
    hook,
    /carregarPaginaComentariosObraSupabase\(\s*obraIdComentarios,\s*0,/,
  );
  assert.match(hook, /salvarComentariosObraLocais\(/);
  assert.match(hook, /return \(\) => \{\s*cancelado = true;/);
  assert.match(hook, /async function carregarMaisComentariosObra\(\)/);
  assert.match(hook, /execucaoIdentidadeObraEstaAtual/);
  assert.match(hook, /mesclarComentariosObraPorId/);
  assert.match(hook, /comentariosConsultaVersaoRef\.current === versaoConsulta/);
  assert.match(
    paginaObra,
    /const \{ carregarMaisComentariosObra \} = useObraCommentsLoadPagination\(/,
  );
  assert.doesNotMatch(paginaObra, /async function carregarMaisComentariosObra\(\)/);
  assert.doesNotMatch(paginaObra, /const comentariosConsultaVersaoRef = useRef\(0\)/);
});
