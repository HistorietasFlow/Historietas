import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const hook = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-comment-sheet-composer.ts");
const sheet = ler("../../app/ler-capitulo/components/ler-capitulo-comments-sheet.tsx");

test("hook centraliza resposta e envio preservando o contrato do comentário", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useLerCapituloCommentSheetComposer\(/);
  assert.match(hook, /const \[comentarioEnviando, setComentarioEnviando\] = useState\(false\);/);
  assert.match(hook, /const \[respostaComentario, setRespostaComentario\] =\s*useState<RespostaComentarioCapitulo \| null>\(null\);/);
  assert.match(hook, /function responderComentario\(/);
  assert.match(hook, /if \(!podeComentar\) \{\s*return;/);
  assert.match(hook, /comentario\.nome\.replace\(\/\\s\+\/g, " "\)\.trim\(\)/);
  assert.match(hook, /const mencao = `@\$\{nomeLimpo\} `;/);
  assert.match(hook, /comentarioRef\.current\.focus\(\);/);
  assert.match(hook, /comentarioRef\.current\.setSelectionRange\(mencao\.length, mencao\.length\);/);

  assert.match(hook, /async function enviarComentario\(event: FormEvent<HTMLFormElement>\)/);
  assert.match(hook, /event\.preventDefault\(\);/);
  assert.match(hook, /const chaveAcao = `enviar-comentario:\$\{post\.id\}`;/);
  assert.match(hook, /if \(!iniciarAcaoComentario\(chaveAcao\)\)/);
  assert.match(hook, /await onEnviar\(\s*post\.id,\s*conteudoComentario,\s*respostaAnterior\?\.comentarioPaiId \|\| ""/);
  assert.match(hook, /comentarioRef\.current\.value = "";/);
  assert.match(hook, /setRespostaComentario\(null\);/);
  assert.match(hook, /\[respostaAnterior\.comentarioPaiId\]: Math\.max\(\s*5,/);
  assert.match(hook, /finally \{\s*finalizarAcaoComentario\(chaveAcao\);\s*setComentarioEnviando\(false\);/);
  assert.doesNotMatch(hook, /\b(?:supabase|localStorage|curtirComentarioSeguro|removerComentarioSeguro|denunciarComentarioSeguro|JSX)\b/);
});

test("sheet delega envio e resposta, mantendo os locks da Fase 1", () => {
  assert.match(sheet, /import \{ useLerCapituloCommentSheetComposer \} from "\.\.\/hooks\/use-ler-capitulo-comment-sheet-composer";/);
  assert.match(sheet, /\} = useLerCapituloCommentSheetComposer\(\{[\s\S]*?comentarioRef,[\s\S]*?post,[\s\S]*?onEnviar,[\s\S]*?iniciarAcaoComentario,[\s\S]*?finalizarAcaoComentario,[\s\S]*?setRespostasVisiveisPorComentario,[\s\S]*?\}\);/);
  for (const nome of ["responderComentario", "enviarComentario"]) {
    assert.match(sheet, new RegExp(`\\b${nome}\\b`));
    assert.doesNotMatch(sheet, new RegExp(`(?:async )?function ${nome}\\(`));
  }
  assert.match(sheet, /limparRespostaComentario\(\);/);
  assert.match(sheet, /<form onSubmit=\{enviarComentario\}/);
  assert.match(sheet, /onClick=\{\(\) =>\s*responderComentario\(comentario, comentarioRaizId\)\s*\}/);
});
