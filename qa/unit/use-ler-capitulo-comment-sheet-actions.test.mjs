import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const hook = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-comment-sheet-actions.ts");
const sheet = ler("../../app/ler-capitulo/components/ler-capitulo-comments-sheet.tsx");

test("hook centraliza locks e estados de loading das ações assíncronas por comentário", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useLerCapituloCommentSheetActions\(/);
  assert.match(hook, /useRef<Set<string>>\(new Set<string>\(\)\)/);
  assert.match(hook, /function iniciarAcaoComentario\(chave: string\)/);
  assert.match(hook, /comentarioAcoesRef\.current\.has\(chave\)/);
  assert.match(hook, /comentarioAcoesRef\.current\.add\(chave\)/);
  assert.match(hook, /function finalizarAcaoComentario\(chave: string\)/);
  assert.match(hook, /comentarioAcoesRef\.current\.delete\(chave\)/);

  for (const [nome, chave, callback, estado] of [
    ["curtirComentarioSeguro", "curtir-comentario", "onCurtirComentario", "setComentarioCurtindoId"],
    ["removerComentarioSeguro", "remover-comentario", "onRemoverComentario", "setComentarioRemovendoId"],
    ["denunciarComentarioSeguro", "denunciar-comentario", "onDenunciarComentario", "setComentarioDenunciandoId"],
  ]) {
    assert.match(hook, new RegExp(`async function ${nome}\\(`));
    assert.match(hook, new RegExp("`" + chave + ":\\$\\{comentarioId\\}`"));
    assert.match(hook, new RegExp(`await ${callback}\\(`));
    assert.match(hook, new RegExp(`${estado}\\(comentarioId\\)`));
    assert.match(hook, new RegExp(`${estado}\\(\\(comentarioAtualId\\) =>[\\s\\S]*?comentarioAtualId === comentarioId \\? null : comentarioAtualId`));
  }

  assert.equal((hook.match(/if \(!iniciarAcaoComentario\(chaveAcao\)\)/g) || []).length, 3);
  assert.equal((hook.match(/finally \{/g) || []).length, 3);
  assert.equal((hook.match(/finalizarAcaoComentario\(chaveAcao\)/g) || []).length, 3);
  assert.doesNotMatch(hook, /\b(?:supabase|localStorage|onEnviar|JSX)\b/);
});

test("sheet delega as ações seguras, mas mantém envio e renderização", () => {
  assert.match(sheet, /import \{ useLerCapituloCommentSheetActions \} from "\.\.\/hooks\/use-ler-capitulo-comment-sheet-actions";/);
  assert.match(sheet, /\} = useLerCapituloCommentSheetActions\(\{[\s\S]*?onCurtirComentario,[\s\S]*?onRemoverComentario,[\s\S]*?onDenunciarComentario,[\s\S]*?\}\);/);
  for (const nome of [
    "iniciarAcaoComentario",
    "finalizarAcaoComentario",
    "curtirComentarioSeguro",
    "removerComentarioSeguro",
    "denunciarComentarioSeguro",
  ]) {
    assert.match(sheet, new RegExp(`\\b${nome}\\b`));
    assert.doesNotMatch(sheet, new RegExp(`(?:async )?function ${nome}\\(`));
  }
  assert.match(sheet, /async function enviarComentario\(event: FormEvent<HTMLFormElement>\)/);
  assert.match(sheet, /const chaveAcao = `enviar-comentario:\$\{post\.id\}`;/);
  assert.match(sheet, /if \(!iniciarAcaoComentario\(chaveAcao\)\)/);
  assert.match(sheet, /finalizarAcaoComentario\(chaveAcao\);[\s\S]*?setComentarioEnviando\(false\);/);
});
