import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const diary = readFileSync(new URL("../../app/publicar/lib/publicar-diary-activity.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../../app/publicar/page.tsx", import.meta.url), "utf8");
test("atividade de Diário preserva payload, fallback e delegação", () => {
  assert.match(diary, /export async function registrarDiarioPublicacao\(/);
  assert.match(diary, /from\("diario_atividades"\)\.insert\(payload\)/);
  assert.match(diary, /visibilidade: "publico"/);
  assert.match(diary, /console\.warn\("Não consegui registrar a publicação no Diário:", error\)/);
  assert.match(page, /from "\.\/lib\/publicar-diary-activity";/);
  assert.doesNotMatch(page, /async function registrarDiarioPublicacao\(/);
  assert.match(page, /await registrarDiarioPublicacao\(/);
});
