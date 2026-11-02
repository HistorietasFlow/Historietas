import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler("../../app/listas/hooks/use-listas-diary-annotation-state.ts");
const pagina = ler("../../app/listas/page.tsx");
const lifecycle = ler("../../app/listas/hooks/use-listas-work-menu-lifecycle.ts");
const annotationActions = ler(
  "../../app/listas/hooks/use-listas-diary-annotation-actions.ts",
);
const interactionActions = ler(
  "../../app/listas/hooks/use-listas-diary-interaction-actions.ts",
);
const interactionsSync = ler(
  "../../app/listas/hooks/use-listas-diary-interactions-sync.ts",
);

test("hook centraliza somente os estados das anotações do Diário de Listas", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(hook, /EDITOR_ANOTACAO_LISTAS_VAZIO/);
  assert.match(hook, /InteracoesAnotacoesListasEstado/);
  assert.match(hook, /EditorAnotacaoListasEstado/);
  assert.match(hook, /export function useListasDiaryAnnotationState\(\)/);
  assert.match(
    hook,
    /editorAnotacao, setEditorAnotacao\]\s*=\s*useState<EditorAnotacaoListasEstado>\(EDITOR_ANOTACAO_LISTAS_VAZIO\)/,
  );
  assert.match(
    hook,
    /interacoesAnotacoes, setInteracoesAnotacoes\]\s*=\s*useState<InteracoesAnotacoesListasEstado>\(\{\}\)/,
  );
  assert.match(
    hook,
    /anotacoesAbertas, setAnotacoesAbertas\]\s*=\s*useState<Record<string, boolean>>\(\{\}\)/,
  );
  assert.match(
    hook,
    /anotacoesSpoilerReveladas, setAnotacoesSpoilerReveladas\]\s*=\s*useState<Record<string, boolean>>\(\{\}\)/,
  );
  assert.doesNotMatch(hook, /useEffect|useMemo|supabase|localStorage|router|return\s*\(\s*</);
});

test("Listas delega os estados e preserva lifecycle, sincronização e mutations", () => {
  assert.match(
    pagina,
    /import \{ useListasDiaryAnnotationState \} from "\.\/hooks\/use-listas-diary-annotation-state";/,
  );
  assert.match(pagina, /\} = useListasDiaryAnnotationState\(\);/);

  for (const estadoLocal of [
    "const [editorAnotacao, setEditorAnotacao]",
    "const [interacoesAnotacoes, setInteracoesAnotacoes]",
    "const [anotacoesAbertas, setAnotacoesAbertas]",
    "const [anotacoesSpoilerReveladas, setAnotacoesSpoilerReveladas]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  assert.match(
    pagina,
    /useListasWorkMenuLifecycle\(\{[\s\S]*?setEditorAnotacao,[\s\S]*?editorAnotacaoVazio: EDITOR_ANOTACAO_LISTAS_VAZIO,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /useListasDiaryInteractionsSync\(\{[\s\S]*?listasPerfil,[\s\S]*?modo,[\s\S]*?usuarioAtualId,[\s\S]*?setInteracoesAnotacoes,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /useListasDiaryAnnotationActions\(\{[\s\S]*?editorAnotacao,[\s\S]*?interacoesAnotacoes,[\s\S]*?setAnotacoesAbertas,[\s\S]*?setAnotacoesSpoilerReveladas,[\s\S]*?setEditorAnotacao,[\s\S]*?setInteracoesAnotacoes,/,
  );
  assert.match(
    pagina,
    /useListasDiaryInteractionActions\(\{[\s\S]*?interacoesAnotacoes,[\s\S]*?setInteracoesAnotacoes,/,
  );
  assert.match(
    pagina,
    /useListasProfileItemRenderer\(\{[\s\S]*?anotacoesAbertas,[\s\S]*?anotacoesSpoilerReveladas,[\s\S]*?interacoesAnotacoes,[\s\S]*?setAnotacoesAbertas,[\s\S]*?setAnotacoesSpoilerReveladas,/,
  );

  assert.match(lifecycle, /setEditorAnotacao\(editorAnotacaoVazio\);/);
  assert.match(annotationActions, /setInteracoesAnotacoes\(\(atual\) =>/);
  assert.match(annotationActions, /delete proximo\[chaveAnotacaoRemovida\]/);
  assert.match(interactionActions, /function atualizarInteracaoAnotacaoListas\(/);
  assert.match(interactionsSync, /setInteracoesAnotacoes\(\([^)]+\) =>/);
});
