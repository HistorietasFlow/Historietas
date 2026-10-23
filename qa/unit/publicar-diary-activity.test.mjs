import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const diary = readFileSync(new URL("../../app/publicar/lib/publicar-diary-activity.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../../app/publicar/page.tsx", import.meta.url), "utf8");
const pageController = readFileSync(new URL("../../app/publicar/hooks/use-publicar-page-controller.ts", import.meta.url), "utf8");
const formController = readFileSync(new URL("../../app/publicar/hooks/use-publicar-form-controller.ts", import.meta.url), "utf8");
const submissionAction = readFileSync(
  new URL("../../app/publicar/lib/publicar-submission-action.ts", import.meta.url),
  "utf8",
);
const submissionHook = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-submission.ts", import.meta.url),
  "utf8",
);
test("atividade de Diário preserva payload, fallback e delegação", () => {
  assert.match(diary, /export async function registrarDiarioPublicacao\(/);
  assert.match(diary, /from\("diario_atividades"\)\.insert\(payload\)/);
  assert.match(diary, /visibilidade: "publico"/);
  assert.match(diary, /console\.warn\("Não consegui registrar a publicação no Diário:", error\)/);
  assert.match(page, /import \{ usePublicarPageController \} from "\.\/hooks\/use-publicar-page-controller";/);
  assert.match(pageController, /import \{ usePublicarFormController \} from "\.\/use-publicar-form-controller";/);
  assert.match(formController, /import \{ usePublicarSubmission \} from "\.\/use-publicar-submission";/);
  assert.doesNotMatch(page, /from "\.\/lib\/publicar-submission-action";/);
  assert.doesNotMatch(page, /async function registrarDiarioPublicacao\(/);
  assert.doesNotMatch(page, /await registrarDiarioPublicacao\(/);
  assert.match(submissionAction, /from "\.\/publicar-diary-activity";/);
  assert.match(submissionAction, /await registrarDiarioPublicacao\(/);
  assert.match(submissionHook, /from "\.\.\/lib\/publicar-submission-action";/);
});
