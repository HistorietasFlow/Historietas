import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const hook = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-comment-replies-visibility.ts");
const sheet = ler("../../app/ler-capitulo/components/ler-capitulo-comments-sheet.tsx");
const composer = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-comment-sheet-composer.ts");

test("hook centraliza a visibilidade das respostas com os limites atuais", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useLerCapituloCommentRepliesVisibility\(\)/);
  assert.match(hook, /const \[respostasVisiveisPorComentario, setRespostasVisiveisPorComentario\] =\s*useState<Record<string, number>>\(\{\}\);/);
  assert.match(hook, /function abrirRespostasComentario\(/);
  assert.match(hook, /\[comentarioId\]: Math\.min\(5, quantidadeRespostas\)/);
  assert.match(hook, /function carregarMaisRespostasComentario\(/);
  assert.match(hook, /\[comentarioId\]: Math\.min\(\s*quantidadeRespostas,\s*\(estadoAtual\[comentarioId\] \|\| 0\) \+ 5,/);
  assert.match(hook, /function ocultarRespostasComentario\(comentarioId: string\)/);
  assert.match(hook, /\[comentarioId\]: 0,/);
  assert.match(hook, /function garantirRespostasVisiveis\(comentarioId: string\)/);
  assert.match(hook, /\[comentarioId\]: Math\.max\(5, estadoAtual\[comentarioId\] \|\| 0\)/);
  assert.match(hook, /const quantidadeVisivel = Math\.min\(\s*respostas\.length,\s*respostasVisiveisPorComentario\[comentarioId\] \|\| 0,/);
  assert.match(hook, /const respostasVisiveis = respostas\.slice\(0, quantidadeVisivel\);/);
  assert.match(hook, /const respostasOcultas = Math\.max\(\s*0,\s*respostas\.length - quantidadeVisivel,/);
  assert.match(hook, /respostasExpandidas: quantidadeVisivel > 0,/);
  assert.doesNotMatch(hook, /\b(?:supabase|localStorage|useEffect|JSX)\b/);
});

test("sheet delega estado e controles de respostas ao hook", () => {
  assert.match(sheet, /import \{ useLerCapituloCommentRepliesVisibility \} from "\.\.\/hooks\/use-ler-capitulo-comment-replies-visibility";/);
  assert.match(sheet, /\} = useLerCapituloCommentRepliesVisibility\(\);/);
  assert.match(sheet, /obterVisibilidadeRespostas\(comentario\.id, respostas\)/);
  assert.match(sheet, /abrirRespostasComentario\(\s*comentario\.id,\s*respostas\.length,/);
  assert.match(sheet, /carregarMaisRespostasComentario\(\s*comentario\.id,\s*respostas\.length,/);
  assert.match(sheet, /ocultarRespostasComentario\(comentario\.id\)/);
  assert.doesNotMatch(sheet, /setRespostasVisiveisPorComentario/);
  assert.doesNotMatch(sheet, /const \[respostasVisiveisPorComentario/);
});

test("composer recebe ação semântica e preserva a expansão após resposta enviada", () => {
  assert.match(composer, /garantirRespostasVisiveis: \(comentarioId: string\) => void;/);
  assert.match(composer, /garantirRespostasVisiveis\(respostaAnterior\.comentarioPaiId\);/);
  assert.doesNotMatch(composer, /setRespostasVisiveisPorComentario/);
});
