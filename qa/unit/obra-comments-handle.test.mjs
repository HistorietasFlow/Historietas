import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const handleComentarios = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-comments-handle.tsx",
    import.meta.url,
  ),
  "utf8",
);
const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("handle preserva atributos, estilos, toque e rotulo de expansao", () => {
  assert.match(handleComentarios, /data-comments-sheet-handle="true"/);
  assert.match(handleComentarios, /data-dialog-initial-focus="true"/);
  assert.match(handleComentarios, /style=\{commentsSheetHandleWrapStyle\}/);
  assert.match(handleComentarios, /<div style=\{commentsSheetHandleStyle\} \/>/);
  assert.match(handleComentarios, /role="button"/);
  assert.match(handleComentarios, /tabIndex=\{0\}/);
  assert.match(
    handleComentarios,
    /expandido \? "Recolher comentários" : "Expandir comentários"/,
  );
  assert.match(handleComentarios, /onClick=\{onAlternarExpansao\}/);
  assert.match(handleComentarios, /onTouchStart=\{onTouchStart\}/);
  assert.match(handleComentarios, /onTouchMove=\{onTouchMove\}/);
  assert.match(handleComentarios, /onTouchEnd=\{onTouchEnd\}/);
  assert.match(handleComentarios, /onTouchCancel=\{onTouchCancel\}/);
});

test("handle preserva teclado com Enter espaco e preventDefault", () => {
  assert.match(
    handleComentarios,
    /if \(event\.key === "Enter" \|\| event\.key === " "\) \{\s*event\.preventDefault\(\);\s*onAlternarExpansao\(\);\s*\}/,
  );
});

test("cliente preserva drag e fornece todos os handlers ao handle", () => {
  assert.match(
    paginaObra,
    /<ObraCommentsHandle\s*expandido=\{comentariosSheetExpandido\}\s*onAlternarExpansao=\{alternarExpansaoComentariosObra\}\s*onTouchStart=\{iniciarArrasteComentariosObra\}\s*onTouchMove=\{moverArrasteComentariosObra\}\s*onTouchEnd=\{finalizarArrasteComentariosObra\}\s*onTouchCancel=\{finalizarArrasteComentariosObra\}/,
  );
  assert.match(
    paginaObra,
    /function iniciarArrasteComentariosObra\(\s*event: TouchEvent<HTMLDivElement>/,
  );
  assert.match(
    paginaObra,
    /function moverArrasteComentariosObra\(\s*event: TouchEvent<HTMLDivElement>/,
  );
  assert.match(paginaObra, /function finalizarArrasteComentariosObra\(\)/);
  assert.match(paginaObra, /function alternarExpansaoComentariosObra\(\)/);
  assert.match(paginaObra, /comentariosDragStartYRef/);
  assert.match(paginaObra, /comentariosDragOffsetYRef/);
  assert.match(paginaObra, /comentariosDragIgnorarCliqueRef/);
  assert.match(paginaObra, /comentariosDragResetTimerRef/);
  assert.match(paginaObra, /comentariosSheetRef/);
  assert.match(paginaObra, /isDesktop/);
});

test("handle nao ganha estado refs ou logica de drag", () => {
  assert.match(
    handleComentarios,
    /onTouchStart: \(event: TouchEvent<HTMLDivElement>\) => void;/,
  );
  assert.match(
    handleComentarios,
    /onTouchMove: \(event: TouchEvent<HTMLDivElement>\) => void;/,
  );
  assert.match(
    handleComentarios,
    /onTouchEnd: \(event: TouchEvent<HTMLDivElement>\) => void;/,
  );
  assert.match(
    handleComentarios,
    /onTouchCancel: \(event: TouchEvent<HTMLDivElement>\) => void;/,
  );
  assert.doesNotMatch(handleComentarios, /useState|useRef|isDesktop|Drag|fecharComentariosObra/);
});
