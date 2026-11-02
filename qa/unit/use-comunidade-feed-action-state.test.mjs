import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler(
  "../../app/comunidade/hooks/use-comunidade-feed-action-state.ts",
);
const pagina = ler("../../app/comunidade/page.tsx");

test("hook centraliza somente o estado de ações e feedback do feed", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(hook, /export function useComunidadeFeedActionState\(\)/);
  assert.match(hook, /feedbackAcao, setFeedbackAcao\] = useState\(""\)/);
  assert.match(hook, /publicandoPost, setPublicandoPost\] = useState\(false\)/);

  for (const estado of [
    "postCurtindoId, setPostCurtindoId",
    "postSalvandoId, setPostSalvandoId",
    "postCompartilhandoId, setPostCompartilhandoId",
    "postRemovendoId, setPostRemovendoId",
    "postFixandoId, setPostFixandoId",
    "postVisibilidadeAtualizandoId, setPostVisibilidadeAtualizandoId",
  ]) {
    assert.match(
      hook,
      new RegExp(`${estado}\\][\\s\\S]*?useState<string \\| null>\\(null\\)`),
    );
  }

  assert.doesNotMatch(hook, /useEffect|useMemo|supabase|localStorage|router|return\s*\(\s*</);
});

test("página delega o estado e preserva actions, feedback e consumidores", () => {
  assert.match(
    pagina,
    /import \{ useComunidadeFeedActionState \} from "\.\/hooks\/use-comunidade-feed-action-state";/,
  );
  assert.match(pagina, /\} = useComunidadeFeedActionState\(\);/);

  for (const estadoLocal of [
    "const [feedbackAcao, setFeedbackAcao]",
    "const [publicandoPost, setPublicandoPost]",
    "const [postCurtindoId, setPostCurtindoId]",
    "const [postSalvandoId, setPostSalvandoId]",
    "const [postCompartilhandoId, setPostCompartilhandoId]",
    "const [postRemovendoId, setPostRemovendoId]",
    "const [postFixandoId, setPostFixandoId]",
    "const [postVisibilidadeAtualizandoId, setPostVisibilidadeAtualizandoId]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  assert.match(
    pagina,
    /useComunidadeAuthAccountLifecycle\(\{[\s\S]*?setPostCurtindoId,[\s\S]*?setPostSalvandoId,[\s\S]*?setPostCompartilhandoId,[\s\S]*?setPostRemovendoId,[\s\S]*?setPostFixandoId,[\s\S]*?setFeedbackAcao,[\s\S]*?\}\);/,
  );
  assert.match(pagina, /publicarPostComunidade\(\{[\s\S]*?setPublicandoPost,/);
  assert.match(pagina, /useComunidadePostEngagementActions\(\{[\s\S]*?setPostCurtindoId,[\s\S]*?setPostSalvandoId,[\s\S]*?setPostCompartilhandoId,/);
  assert.match(pagina, /atualizarVisibilidadePostComunidade\(\{[\s\S]*?setPostVisibilidadeAtualizandoId,/);
  assert.match(pagina, /alternarFixadoPostComunidade\(\{[\s\S]*?postFixandoId,[\s\S]*?setPostFixandoId,/);
  assert.match(pagina, /removerPostComunidade\(\{[\s\S]*?setPostRemovendoId,/);
  assert.match(pagina, /emitirFeedbackAcao\([\s\S]*?setFeedbackAcao,[\s\S]*?feedbackTimerRef,/);
  assert.match(pagina, /publicandoPost/);
  assert.match(pagina, /feedbackAcao=\{feedbackAcao\}/);
});
