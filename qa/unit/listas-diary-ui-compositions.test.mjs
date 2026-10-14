import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile("app/listas/page.tsx", "utf8");
const controls = await readFile(
  "app/listas/hooks/use-listas-diary-comments-controls.ts",
  "utf8",
);
const panel = await readFile(
  "app/listas/components/listas-diary-comments-panel.tsx",
  "utf8",
);
const workItem = await readFile(
  "app/listas/components/listas-profile-work-item.tsx",
  "utf8",
);

test("Listas delega os controles e as apresentações do Diário sem persistência", () => {
  assert.match(page, /useListasDiaryCommentsControls\(/);
  assert.match(page, /<ListasDiaryCommentsPanel\b/);
  assert.match(page, /<ListasProfileWorkItem\b/);
  assert.match(controls, /event\.touches\[0\]\?\.clientY/);
  assert.match(controls, /limiteSuperior = comentariosDiarioExpandido \? -46 : -58/);
  assert.match(controls, /limiteInferior = comentariosDiarioExpandido \? 112 : 132/);
  assert.match(controls, /Math\.abs\(deslocamento\) > 6/);
  assert.match(controls, /deslocamento < -34/);
  assert.match(controls, /deslocamento > 52/);
  assert.match(controls, /deslocamento > 118/);
  assert.match(controls, /texto !== "@" \? " " : ""/);
  assert.match(panel, /quickReactions=\{\["💜", "🔥", "😂", "😮", "😭", "👏"\]\}/);
  assert.match(panel, /Math\.min\(5, respostas\.length\)/);
  assert.match(panel, /key=\{comentario\.id\}/);
  assert.match(page, /historietas-list-row-highlight/);
  assert.match(page, /<ListasProfileWorkItem\s+key=\{item\.chave\}/);
  for (const source of [controls, panel, workItem]) {
    assert.doesNotMatch(source, /supabase|\.from\(|\.rpc\(|\.insert\(|\.update\(|\.delete\(/);
  }
});
