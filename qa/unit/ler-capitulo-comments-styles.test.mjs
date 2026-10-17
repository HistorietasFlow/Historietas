import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const pagina = ler("../../app/ler-capitulo/page.tsx");
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

test("página continua consumindo os estilos sem duplicar declarações", () => {
  const nomes = [...estilos.matchAll(/^export const (\w+): CSSProperties = \{/gm)].map((m) => m[1]);
  assert.equal(nomes.length, 53);
  const importacao = pagina.match(/import \{([\s\S]*?)\} from "\.\/lib\/ler-capitulo-comments-styles";/);
  assert.ok(importacao);
  for (const nome of nomes) {
    assert.match(importacao[1], new RegExp(`\\b${nome}\\b`));
    assert.doesNotMatch(pagina, new RegExp(`const ${nome}: CSSProperties`));
  }
  assert.match(pagina, /function ComentariosCapituloSheet\(/);
  assert.match(pagina, /style=\{commentsSheetOverlayStyle\}/);
  assert.match(pagina, /\.\.\.commentsSheetStyle,/);
  assert.match(pagina, /sheetExpandido\s*\? commentsSheetExpandedStyle\s*: commentsSheetCompactStyle/);
  assert.match(pagina, /style=\{commentsQuickReactionsStyle\}/);
  assert.match(pagina, /\.\.\.commentsSheetSendStyle,/);
});

test("módulos visuais não adicionam efeitos ou persistência", () => {
  assert.match(estilos, /import type \{ CSSProperties \} from "react";/);
  assert.match(estilos, /import \{ safeTextStyle \} from "\.\/ler-capitulo-text-style";/);
  for (const fonte of [estilos, texto]) {
    assert.doesNotMatch(fonte, /\b(?:supabase|localStorage|window|document|useEffect|useState)\b/i);
  }
});
