import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const sheet = ler("../../app/ler-capitulo/components/ler-capitulo-comments-sheet.tsx");
const item = ler("../../app/ler-capitulo/components/ler-capitulo-comment-item.tsx");
const estilos = ler("../../app/ler-capitulo/lib/ler-capitulo-comments-styles.ts");
const texto = ler("../../app/ler-capitulo/lib/ler-capitulo-text-style.ts");

test("estilos de comentários preservam literalmente os 55 objetos originais", () => {
  const bloco = estilos.slice(estilos.indexOf("export const commentsSheetOverlayStyle"))
    .trimEnd()
    .replace(/^export const /gm, "const ");
  assert.equal((bloco.match(/^const \w+: CSSProperties = \{/gm) || []).length, 55);
  assert.equal(
    createHash("sha256").update(bloco).digest("hex"),
    "9842c706506a329642ee206e648270f8b5bebcfd7f5cb0d09d4acff02fd793dd",
  );
  assert.match(estilos, /\.\.\.commentsSheetStyle,/);
  assert.match(estilos, /\.\.\.commentAvatarStyle,/);
  assert.match(estilos, /\.\.\.commentAvatarLinkStyle,/);
  assert.match(estilos, /\.\.\.safeTextStyle,/);
  assert.match(texto, /export const safeTextStyle: CSSProperties = \{\n  minWidth: 0,\n  overflowWrap: "anywhere",\n  wordBreak: "break-word",\n\};/);
});

test("sheet consome os estilos sem duplicar declarações", () => {
  const nomes = [...estilos.matchAll(/^export const (\w+): CSSProperties = \{/gm)].map((m) => m[1]);
  assert.equal(nomes.length, 53);
  const importacaoSheet = sheet.match(/import \{([\s\S]*?)\} from "\.\.\/lib\/ler-capitulo-comments-styles";/);
  const importacaoItem = item.match(/import \{([\s\S]*?)\} from "\.\.\/lib\/ler-capitulo-comments-styles";/);
  assert.ok(importacaoSheet);
  assert.ok(importacaoItem);
  for (const nome of nomes) {
    const estiloImportado = new RegExp(`\\b${nome}\\b`);
    assert.ok(
      estiloImportado.test(importacaoSheet[1]) ||
        estiloImportado.test(importacaoItem[1]),
    );
    assert.doesNotMatch(pagina, new RegExp(`const ${nome}: CSSProperties`));
    assert.doesNotMatch(sheet, new RegExp(`const ${nome}: CSSProperties`));
    assert.doesNotMatch(item, new RegExp(`const ${nome}: CSSProperties`));
  }
  assert.match(pagina, /<ComentariosCapituloSheet/);
  assert.match(sheet, /function ComentariosCapituloSheet\(/);
  assert.match(sheet, /style=\{commentsSheetOverlayStyle\}/);
  assert.match(sheet, /\.\.\.commentsSheetStyle,/);
  assert.match(sheet, /sheetExpandido\s*\? commentsSheetExpandedStyle\s*: commentsSheetCompactStyle/);
  assert.match(sheet, /style=\{commentsQuickReactionsStyle\}/);
  assert.match(sheet, /\.\.\.commentsSheetSendStyle,/);
});

test("módulos visuais não adicionam efeitos ou persistência", () => {
  assert.match(estilos, /import type \{ CSSProperties \} from "react";/);
  assert.match(estilos, /import \{ safeTextStyle \} from "\.\/ler-capitulo-text-style";/);
  for (const fonte of [estilos, texto]) {
    assert.doesNotMatch(fonte, /\b(?:supabase|localStorage|window|document|useEffect|useState)\b/i);
  }
});
