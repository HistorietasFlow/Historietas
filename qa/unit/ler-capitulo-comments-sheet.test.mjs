import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const loader = ler("../../app/ler-capitulo/lib/ler-capitulo-comments-read-loader.ts");
const lifecycle = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-interaction-data.ts");
const acoes = ler("../../app/ler-capitulo/lib/ler-capitulo-comment-actions.ts");
const denuncias = ler("../../app/ler-capitulo/lib/ler-capitulo-report-actions.ts");
const sheet = ler("../../app/ler-capitulo/components/ler-capitulo-comments-sheet.tsx");
const acoesSheet = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-comment-sheet-actions.ts");
const compositorSheet = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-comment-sheet-composer.ts");
const gestosSheet = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-comment-sheet-gestures.ts");

test("sheet preserva efeitos, JSX e props enquanto delega ações assíncronas", () => {
  assert.match(sheet, /^"use client";/);
  assert.match(sheet, /const ComentariosCapituloSheet = memo\(function ComentariosCapituloSheet/);
  assert.match(sheet, /export default ComentariosCapituloSheet;/);
  assert.match(sheet, /if \(!post \|\| typeof document === "undefined"\)/);
  assert.match(sheet, /return createPortal\([\s\S]*?document\.body/);
  assert.match(sheet, /window\.setInterval\([\s\S]*?30000/);
  assert.match(sheet, /window\.clearInterval\(timer\)/);
  assert.match(gestosSheet, /window\.clearTimeout\(dragResetTimerRef\.current\)/);
  assert.match(sheet, /event\.key === "Enter" \|\| event\.key === " "[\s\S]*?event\.preventDefault\(\)/);
  assert.match(sheet, /\["💜", "🔥", "😂", "😮", "😭", "👏"\]/);
  assert.match(sheet, /maxLength=\{420\}/);
  assert.doesNotMatch(sheet, /\b(?:supabase|localStorage)\b/);
  assert.match(sheet, /useLerCapituloCommentSheetActions\(\{/);
  assert.match(acoesSheet, /async function curtirComentarioSeguro\(/);
  assert.match(acoesSheet, /async function removerComentarioSeguro\(/);
  assert.match(acoesSheet, /async function denunciarComentarioSeguro\(/);
  assert.doesNotMatch(sheet, /async function curtirComentarioSeguro\(/);
  assert.doesNotMatch(sheet, /async function removerComentarioSeguro\(/);
  assert.doesNotMatch(sheet, /async function denunciarComentarioSeguro\(/);
  assert.match(sheet, /useLerCapituloCommentSheetComposer\(\{/);
  assert.match(compositorSheet, /async function enviarComentario\(/);
  assert.match(compositorSheet, /function responderComentario\(/);
  assert.doesNotMatch(sheet, /async function enviarComentario\(/);
  assert.doesNotMatch(sheet, /function responderComentario\(/);
  assert.match(sheet, /useLerCapituloCommentSheetGestures\(\{/);
  assert.match(gestosSheet, /function iniciarArraste\(/);
  assert.match(gestosSheet, /function finalizarArraste\(/);
  assert.doesNotMatch(sheet, /function iniciarArraste\(/);
  assert.doesNotMatch(sheet, /function finalizarArraste\(/);
  assert.match(sheet, /from "\.\.\/lib\/ler-capitulo-comment-thread-structure";/);
  assert.match(sheet, /criarEstruturaComentariosCapitulo\(\s*post\?\.comentarios \|\| \[\],\s*ordenacaoComentarios\s*\)/);
  assert.doesNotMatch(sheet, /function criarEstruturaComentariosCapitulo\(/);
});
test("página mantém a integração e as ações de dados e persistência", () => {
  assert.match(pagina, /import ComentariosCapituloSheet,[\s\S]*?from "\.\/components\/ler-capitulo-comments-sheet";/);
  assert.doesNotMatch(pagina, /function ComentariosCapituloSheet\(/);
  for (const [prop, valor] of Object.entries({
    onFechar: "fecharComentariosCapitulo",
    onEnviar: "enviarComentarioCapitulo",
    onCurtirComentario: "alternarCurtidaComentarioCapitulo",
    onRemoverComentario: "removerComentarioCapitulo",
    onDenunciarComentario: "denunciarComentarioCapitulo",
  })) {
    assert.match(pagina, new RegExp(`${prop}=\\{${valor}\\}`));
  }
  assert.match(pagina, /post=\{mostrarComentario \? postComentariosCapitulo : null\}/);
  assert.match(pagina, /podeComentar=\{Boolean\(usuarioIdLogado\)\}/);
  assert.match(pagina, /criarAcoesComentariosCapitulo\(\{/);
  assert.match(acoes, /async function enviarComentarioCapitulo\(/);
  assert.match(pagina, /useLerCapituloInteractionData\(\{/);
  assert.match(lifecycle, /import \{ carregarComentariosCapituloSupabase \} from "\.\.\/lib\/ler-capitulo-comments-read-loader";/);
  assert.match(loader, /export async function carregarComentariosCapituloSupabase\(/);
  assert.match(lifecycle, /await carregarComentariosCapituloSupabase\(/);
  assert.doesNotMatch(pagina, /async function carregarComentariosCapituloSupabase\(/);
  assert.match(acoes, /function obterIdsComentarioCapituloComRespostas\(/);
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-report-actions";/);
  assert.match(pagina, /criarAcoesDenunciaLeitor\(\{/);
  assert.match(denuncias, /async function denunciarComentarioCapitulo\(/);
  assert.doesNotMatch(pagina, /async function denunciarComentarioCapitulo\(/);
});
