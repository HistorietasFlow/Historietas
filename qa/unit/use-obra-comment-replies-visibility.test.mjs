import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-comment-replies-visibility.ts",
    import.meta.url,
  ),
  "utf8",
);
const cliente = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("hook possui o estado e as cinco operacoes semanticas de visibilidade", () => {
  assert.match(hook, /export function useObraCommentRepliesVisibility\(\)/);
  assert.match(hook, /useState<Record<string, number>>\(\{\}\)/);
  assert.match(hook, /const resetarRespostasVisiveis = useCallback/);
  assert.match(hook, /const garantirRespostaVisivel = useCallback/);
  assert.match(hook, /const mostrarRespostas = useCallback/);
  assert.match(hook, /const mostrarMaisRespostas = useCallback/);
  assert.match(hook, /const ocultarRespostas = useCallback/);
  assert.match(hook, /respostasVisiveisPorComentario,/);
});

test("hook preserva reset, resposta nova e blocos de cinco", () => {
  assert.match(hook, /setRespostasVisiveisPorComentario\(\{\}\);/);
  assert.match(
    hook,
    /\[comentarioPaiId\]: Math\.max\(\s*5,\s*estadoAtual\[comentarioPaiId\] \|\| 0,\s*\)/,
  );
  assert.match(hook, /\[comentarioId\]: Math\.min\(5, totalRespostas\)/);
  assert.match(
    hook,
    /\[comentarioId\]: Math\.min\(\s*totalRespostas,\s*\(estadoAtual\[comentarioId\] \|\| 0\) \+ 5,\s*\)/,
  );
  assert.match(hook, /\[comentarioId\]: 0,/);
});

test("cliente preserva os pontos de reset, resposta enviada e composicao", () => {
  assert.match(
    cliente,
    /import \{ useObraCommentRepliesVisibility \} from "\.\/hooks\/use-obra-comment-replies-visibility";/,
  );
  assert.match(cliente, /\} = useObraCommentRepliesVisibility\(\);/);
  assert.match(cliente, /resetarRespostasVisiveis\(\);/);
  assert.match(
    cliente,
    /if \(comentarioTemporario\.comentarioPaiId\) \{\s*garantirRespostaVisivel\(comentarioTemporario\.comentarioPaiId\);\s*\}\s*\n\s*setComentariosObra/,
  );
  assert.match(cliente, /onMostrarRespostas=\{mostrarRespostas\}/);
  assert.match(cliente, /onMostrarMaisRespostas=\{mostrarMaisRespostas\}/);
  assert.match(cliente, /onOcultarRespostas=\{ocultarRespostas\}/);
  assert.doesNotMatch(cliente, /setRespostasVisiveisPorComentario/);
});
