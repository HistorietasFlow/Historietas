import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const hook = ler(
  "../../app/comunidade/hooks/use-community-comment-sheet-replies-visibility.ts",
);
const sheet = ler(
  "../../app/comunidade/components/community-comments-sheet.tsx",
);
const thread = ler("../../app/comunidade/components/community-comment-thread.tsx");
const composer = ler(
  "../../app/comunidade/hooks/use-community-comment-sheet-composer.ts",
);

test("hook centraliza a visibilidade das respostas e reutiliza os helpers atuais", () => {
  assert.match(hook, /^"use client";/);
  assert.match(
    hook,
    /export function useCommunityCommentSheetRepliesVisibility\(\)/,
  );
  assert.match(
    hook,
    /const \[respostasVisiveisPorComentario, setRespostasVisiveisPorComentario\] =\s*useState<Record<string, number>>\(\{\}\);/,
  );
  for (const helper of [
    "mostrarRespostasIniciaisComunidade",
    "mostrarMaisRespostasComunidade",
    "ocultarRespostasComunidade",
    "obterQuantidadeRespostasVisiveisComunidade",
    "obterRespostasVisiveisComunidade",
    "obterQuantidadeRespostasOcultasComunidade",
    "respostasEstaoExpandidasComunidade",
  ]) {
    assert.match(hook, new RegExp(`\\b${helper}\\b`));
  }
  assert.match(hook, /function abrirRespostasComentario\(/);
  assert.match(hook, /function carregarMaisRespostasComentario\(/);
  assert.match(hook, /function ocultarRespostasComentario\(/);
  assert.match(hook, /function garantirRespostasVisiveis\(comentarioId: string\)/);
  assert.match(
    hook,
    /\[comentarioId\]: Math\.max\(5, estadoAtual\[comentarioId\] \|\| 0\)/,
  );
  assert.match(hook, /function obterVisibilidadeRespostas\(/);
  assert.doesNotMatch(hook, /\b(?:supabase|localStorage|useEffect|JSX)\b/);
});

test("sheet e thread delegam visibilidade por ações semânticas", () => {
  assert.match(
    sheet,
    /import \{ useCommunityCommentSheetRepliesVisibility \} from "\.\.\/hooks\/use-community-comment-sheet-replies-visibility";/,
  );
  assert.match(sheet, /\} = useCommunityCommentSheetRepliesVisibility\(\);/);
  assert.doesNotMatch(sheet, /const \[respostasVisiveisPorComentario/);
  assert.doesNotMatch(sheet, /setRespostasVisiveisPorComentario/);
  for (const prop of [
    "obterVisibilidadeRespostas",
    "onAbrirRespostas",
    "onCarregarMaisRespostas",
    "onOcultarRespostas",
  ]) {
    assert.match(sheet, new RegExp(`\\b${prop}\\b`));
  }
  assert.match(
    thread,
    /obterVisibilidadeRespostas\(respostas, comentario\)/,
  );
  assert.match(
    thread,
    /onAbrirRespostas\(respostas, comentario\)/,
  );
  assert.match(
    thread,
    /onCarregarMaisRespostas\(respostas, comentario\)/,
  );
  assert.match(thread, /onOcultarRespostas\(comentario\)/);
  assert.doesNotMatch(thread, /setRespostasVisiveisPorComentario/);
  assert.doesNotMatch(thread, /respostasVisiveisPorComentario/);
});

test("composer recebe a garantia semântica após enviar resposta", () => {
  assert.match(
    composer,
    /garantirRespostasVisiveis: \(comentarioId: string\) => void;/,
  );
  assert.match(
    composer,
    /garantirRespostasVisiveis\(respostaAnterior\.comentarioPaiId\);/,
  );
  assert.doesNotMatch(composer, /setRespostasVisiveisPorComentario/);
});
