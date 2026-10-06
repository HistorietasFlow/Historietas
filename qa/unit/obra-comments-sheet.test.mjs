import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const commentsSheet = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-comments-sheet.tsx",
    import.meta.url,
  ),
  "utf8",
);
const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("shell preserva portal raiz e backdrop do painel", () => {
  assert.match(commentsSheet, /createPortal\(/);
  assert.match(commentsSheet, /document\.body,/);
  assert.match(
    commentsSheet,
    /data-historietas-obra-comments-root="true"/,
  );
  assert.match(commentsSheet, /style=\{commentsSheetOverlayStyle\}/);
  assert.match(commentsSheet, /aria-label=\{`Comentários de \$\{titulo\}`\}/);
  assert.match(commentsSheet, /aria-label="Fechar comentários"/);
  assert.match(commentsSheet, /onClick=\{onFechar\}/);
  assert.match(commentsSheet, /style=\{commentsSheetBackdropStyle\}/);
});

test("shell preserva dialogo ref teclado estilos e filhos", () => {
  assert.match(
    commentsSheet,
    /sheetRef: RefObject<HTMLElement \| null>;/,
  );
  assert.match(
    commentsSheet,
    /onKeyDown: KeyboardEventHandler<HTMLElement>;/,
  );
  assert.match(commentsSheet, /ref=\{sheetRef\}/);
  assert.match(commentsSheet, /role="dialog"/);
  assert.match(commentsSheet, /aria-modal="true"/);
  assert.match(commentsSheet, /tabIndex=\{-1\}/);
  assert.match(commentsSheet, /onKeyDown=\{onKeyDown\}/);
  assert.match(
    commentsSheet,
    /isDesktop\s*\? desktopCommentsSheetStyle\s*: \{\s*\.\.\.commentsSheetStyle,\s*\.\.\.\(expandido\s*\? commentsSheetExpandedStyle\s*: commentsSheetCompactStyle\),\s*\}/,
  );
  assert.match(commentsSheet, /\{children\}/);
  assert.doesNotMatch(commentsSheet, /forwardRef|manterFocoNoDialogo|useState|useEffect/);
});

test("cliente preserva condicao foco ref e composicao dos filhos", () => {
  assert.match(
    paginaObra,
    /obra && comentariosAbertos && typeof document !== "undefined"/,
  );
  assert.match(
    paginaObra,
    /<ObraCommentsSheet\s*titulo=\{obra\.titulo\}\s*sheetRef=\{comentariosSheetRef\}\s*isDesktop=\{isDesktop\}\s*expandido=\{comentariosSheetExpandido\}\s*onFechar=\{fecharComentariosObra\}/,
  );
  assert.match(
    paginaObra,
    /onKeyDown=\{\(event\) =>\s*manterFocoNoDialogo\(event, fecharComentariosObra\)\s*\}/,
  );
  assert.match(paginaObra, /const comentariosSheetRef = useRef<HTMLElement \| null>\(null\)/);
  assert.match(paginaObra, /function fecharComentariosObra\(\)/);

  const inicioHandle = paginaObra.indexOf("<ObraCommentsHandle");
  const inicioHeader = paginaObra.indexOf("<ObraCommentsHeader");
  const inicioLista = paginaObra.indexOf("<ObraCommentsList");
  const inicioCompositor = paginaObra.indexOf("<ObraCommentComposer");

  assert.ok(inicioHandle >= 0);
  assert.ok(inicioHandle < inicioHeader);
  assert.ok(inicioHeader < inicioLista);
  assert.ok(inicioLista < inicioCompositor);
});
