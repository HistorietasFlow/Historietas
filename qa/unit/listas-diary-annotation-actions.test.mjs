import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(new URL("../../app/listas/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(
  new URL("../../app/listas/hooks/use-listas-diary-annotation-actions.ts", import.meta.url),
  "utf8",
);
const persistencia = readFileSync(
  new URL("../../app/listas/lib/listas-diary-annotation-persistence.ts", import.meta.url),
  "utf8",
);

test("Listas delega ações de anotação sem reintroduzir escrita na página", () => {
  assert.match(
    pagina,
    /import \{ useListasDiaryAnnotationActions \} from "\.\/hooks\/use-listas-diary-annotation-actions";/,
  );
  assert.match(pagina, /useListasDiaryAnnotationActions\(\{/);
  for (const nome of [
    "atualizarAnotacaoNosItensListas",
    "abrirEditorAnotacaoListas",
    "salvarAnotacaoListas",
    "removerAnotacaoListas",
  ]) {
    assert.match(hook, new RegExp(`function ${nome}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`function ${nome}\\(`));
  }
  assert.doesNotMatch(pagina, /\.from\("diario_anotacoes"\)/);
});

test("persistência preserva os contratos de update, busca, insert, duplicadas e remoção", () => {
  assert.match(persistencia, /\.from\("diario_anotacoes"\)[\s\S]*?\.update\([\s\S]*?\.eq\("id", id\)[\s\S]*?\.eq\("user_id", userId\)[\s\S]*?\.select\(CAMPOS_ANOTACAO_LISTAS\)[\s\S]*?\.maybeSingle\(\)/);
  assert.match(persistencia, /\.select\(CAMPOS_ANOTACAO_LISTAS\)[\s\S]*?\.eq\("user_id", userId\)[\s\S]*?\.eq\("obra_id", obraId\)[\s\S]*?\.order\("atualizado_em", \{ ascending: false \}\)[\s\S]*?\.limit\(1\)[\s\S]*?\.maybeSingle\(\)/);
  assert.match(persistencia, /\.insert\(payload\)[\s\S]*?\.select\(CAMPOS_ANOTACAO_LISTAS\)[\s\S]*?\.single\(\)/);
  assert.match(persistencia, /\.delete\(\)[\s\S]*?\.eq\("user_id", userId\)[\s\S]*?\.eq\("obra_id", obraId\)[\s\S]*?\.neq\("id", anotacaoId\)/);
  assert.match(persistencia, /Não consegui remover anotações duplicadas:/);
  assert.doesNotMatch(persistencia, /\.upsert\(/);
});

test("hook preserva validações, normalização, storage e limpeza local", () => {
  for (const texto of [
    "Entre na sua conta para salvar a anotação.",
    "A obra ainda não possui um ID válido no Supabase.",
    "Escreva uma anotação antes de salvar.",
    "Anotação salva.",
    "Anotação removida.",
    "Remover esta anotação?",
  ]) assert.match(hook, new RegExp(texto));
  assert.match(hook, /textoAnotacao\.slice\(0, diarioAnotacaoMaxLength\)/);
  assert.match(hook, /normalizarTipoDiarioListas/);
  assert.match(hook, /normalizarVisibilidadeAnotacaoListas/);
  assert.match(hook, /salvarAnotacaoLocalListas/);
  assert.match(hook, /removerAnotacaoLocalListas/);
  assert.match(hook, /criarInteracaoAnotacaoListasVazia/);
  assert.match(hook, /delete proximo\[chaveAnotacaoRemovida\]/);
});
