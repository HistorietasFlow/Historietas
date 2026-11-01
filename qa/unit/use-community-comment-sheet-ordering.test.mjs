import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const hook = ler(
  "../../app/comunidade/hooks/use-community-comment-sheet-ordering.ts",
);
const sheet = ler(
  "../../app/comunidade/components/community-comments-sheet.tsx",
);

test("hook centraliza estado, estrutura memoizada e acoes semanticas de ordenacao", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useCommunityCommentSheetOrdering\(/);
  assert.match(
    hook,
    /useState<OrdenacaoComentariosComunidade>\("relevantes"\)/,
  );
  assert.match(hook, /const \[menuOrdenacaoAberto, setMenuOrdenacaoAberto\] = useState\(false\);/);
  assert.match(
    hook,
    /criarEstruturaComentariosComunidade\(\s*comentarios \|\| \[\],\s*ordenacaoComentarios\s*\)/,
  );
  assert.match(hook, /\[ordenacaoComentarios, comentarios\]/);
  for (const helper of [
    "alternarMenuOrdenacaoComentariosComunidade",
    "selecionarOrdenacaoComentariosRelevantesComunidade",
    "selecionarOrdenacaoComentariosRecentesComunidade",
    "ordenacaoComentariosEhRelevantesComunidade",
    "ordenacaoComentariosEhRecentesComunidade",
  ]) {
    assert.match(hook, new RegExp(`\\b${helper}\\b`));
  }
  assert.match(hook, /function fecharMenuOrdenacao\(\) \{\s*setMenuOrdenacaoAberto\(false\);/);
  assert.doesNotMatch(
    hook,
    /\b(?:supabase|localStorage|onEnviar|iniciarArraste|JSX)\b/,
  );
});

test("sheet delega ordenacao e preserva menu, estados ativos e fechamento geral", () => {
  assert.match(
    sheet,
    /import \{ useCommunityCommentSheetOrdering \} from "\.\.\/hooks\/use-community-comment-sheet-ordering";/,
  );
  assert.match(
    sheet,
    /\} = useCommunityCommentSheetOrdering\(\{\s*comentarios: post\?\.comentarios,\s*\}\);/,
  );
  for (const nome of [
    "alternarMenuOrdenacao",
    "selecionarOrdenacaoRelevantes",
    "selecionarOrdenacaoRecentes",
    "fecharMenuOrdenacao",
  ]) {
    assert.match(sheet, new RegExp(`\\b${nome}\\b`));
  }
  assert.doesNotMatch(sheet, /const \[ordenacaoComentarios/);
  assert.doesNotMatch(sheet, /const \[menuOrdenacaoAberto/);
  assert.doesNotMatch(sheet, /criarEstruturaComentariosComunidade\(/);
  assert.match(sheet, /onClick=\{alternarMenuOrdenacao\}/);
  assert.match(sheet, /aria-expanded=\{menuOrdenacaoAberto\}/);
  assert.match(sheet, /onClick=\{selecionarOrdenacaoRelevantes\}/);
  assert.match(sheet, /active=\{ordenacaoRelevantesAtiva\}/);
  assert.match(sheet, /onClick=\{selecionarOrdenacaoRecentes\}/);
  assert.match(sheet, /active=\{ordenacaoRecentesAtiva\}/);
  assert.match(sheet, /function fecharComentarios\(\) \{\s*fecharMenuOrdenacao\(\);/);
});
