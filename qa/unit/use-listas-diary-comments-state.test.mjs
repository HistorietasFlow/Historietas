import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler("../../app/listas/hooks/use-listas-diary-comments-state.ts");
const pagina = ler("../../app/listas/page.tsx");
const lifecycle = ler(
  "../../app/listas/hooks/use-listas-diary-comments-sheet-lifecycle.ts",
);
const controls = ler("../../app/listas/hooks/use-listas-diary-comments-controls.ts");
const interactionActions = ler(
  "../../app/listas/hooks/use-listas-diary-interaction-actions.ts",
);

test("hook centraliza somente os estados do sheet de comentários do Diário de Listas", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(hook, /ItemObraLista/);
  assert.match(hook, /export function useListasDiaryCommentsState\(\)/);
  assert.match(hook, /comentarioCurtindoId, setComentarioCurtindoId\] = useState\(""\)/);
  assert.match(hook, /comentarioRemovendoId, setComentarioRemovendoId\] = useState\(""\)/);
  assert.match(
    hook,
    /comentariosDiarioItem, setComentariosDiarioItem\]\s*=\s*useState<ItemObraLista \| null>\(null\)/,
  );
  assert.match(
    hook,
    /comentariosDiarioExpandido, setComentariosDiarioExpandido\]\s*=\s*useState\(false\)/,
  );
  assert.match(
    hook,
    /menuOrdenacaoComentariosDiarioAberto, setMenuOrdenacaoComentariosDiarioAberto\]\s*=\s*useState\(false\)/,
  );
  assert.match(
    hook,
    /respostasVisiveisComentariosDiario, setRespostasVisiveisComentariosDiario\]\s*=\s*useState<Record<string, number>>\(\{\}\)/,
  );
  assert.doesNotMatch(hook, /useEffect|useMemo|supabase|localStorage|router|return\s*\(\s*</);
});

test("Listas delega os estados e preserva lifecycle, controles e mutations", () => {
  assert.match(
    pagina,
    /import \{ useListasDiaryCommentsState \} from "\.\/hooks\/use-listas-diary-comments-state";/,
  );
  assert.match(pagina, /\} = useListasDiaryCommentsState\(\);/);

  for (const estadoLocal of [
    "const [comentarioCurtindoId, setComentarioCurtindoId]",
    "const [comentarioRemovendoId, setComentarioRemovendoId]",
    "const [comentariosDiarioItem, setComentariosDiarioItem]",
    "const [comentariosDiarioExpandido, setComentariosDiarioExpandido]",
    "const [menuOrdenacaoComentariosDiarioAberto, setMenuOrdenacaoComentariosDiarioAberto]",
    "const [respostasVisiveisComentariosDiario, setRespostasVisiveisComentariosDiario]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  assert.match(
    pagina,
    /useListasDiaryCommentsSheetLifecycle\(\{[\s\S]*?comentariosDiarioItem,[\s\S]*?setComentariosDiarioItem,[\s\S]*?setComentariosDiarioExpandido,[\s\S]*?setMenuOrdenacaoComentariosDiarioAberto,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /useListasDiaryInteractionActions\(\{[\s\S]*?comentarioCurtindoId,[\s\S]*?setComentarioCurtindoId,[\s\S]*?setComentarioRemovendoId,[\s\S]*?setRespostasVisiveisComentariosDiario,/,
  );
  assert.match(
    pagina,
    /useListasDiaryCommentsControls\(\{[\s\S]*?comentariosDiarioExpandido,[\s\S]*?comentariosDiarioItem,[\s\S]*?setComentariosDiarioExpandido,[\s\S]*?setComentariosDiarioItem,[\s\S]*?setMenuOrdenacaoComentariosDiarioAberto,[\s\S]*?setRespostasVisiveisComentariosDiario,/,
  );
  assert.match(
    pagina,
    /useListasDiaryCommentsRenderer\(\{[\s\S]*?comentarioCurtindoId,[\s\S]*?comentarioRemovendoId,[\s\S]*?comentariosDiarioExpandido,[\s\S]*?comentariosDiarioItem,[\s\S]*?menuOrdenacaoComentariosDiarioAberto,[\s\S]*?respostasVisiveisComentariosDiario,[\s\S]*?setMenuOrdenacaoComentariosDiarioAberto,[\s\S]*?setRespostasVisiveisComentariosDiario,/,
  );

  assert.match(lifecycle, /document\.body\.style\.overflow = "hidden";/);
  assert.match(lifecycle, /event\.key === "Escape"/);
  assert.match(controls, /setRespostasVisiveisComentariosDiario\(\{\}\);/);
  assert.match(controls, /comentariosDragOffsetYRef/);
  assert.match(interactionActions, /if \(!comentario\.id \|\| comentarioCurtindoId\) return;/);
  assert.match(interactionActions, /setComentarioRemovendoId\(comentario\.id\);/);
});
