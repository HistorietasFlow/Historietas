import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const hookPath = new URL(
  "../../app/em-breve/hooks/use-em-breve-salvar-lancamento.ts",
  import.meta.url,
);
const pagePath = new URL("../../app/em-breve/page.tsx", import.meta.url);

test("Em Breve delega somente a ação de salvar lançamento ao hook", async () => {
  const [hook, page] = await Promise.all([
    readFile(hookPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(hook, /^"use client";/);
  assert.match(hook, /useState/);
  assert.match(hook, /import \{ supabase \} from "\.\.\/\.\.\/\.\.\/lib\/supabase\/client";/);
  assert.match(hook, /sincronizarAvisoLancamentoSupabaseEmBreve/);
  assert.match(hook, /criarLoginHrefEmBreve/);
  assert.match(hook, /SAVED_RELEASES_STORAGE_KEY/);
  assert.match(hook, /salvarJsonUsuarioEmBreve/);
  assert.match(hook, /type ObraEmBreveCard/);
  assert.match(hook, /adicionarObraNaListaEmBreve/);
  assert.match(hook, /listaTemObraEmBreve/);
  assert.match(hook, /normalizarLancamentosSalvosComObrasEmBreve/);
  assert.match(hook, /obterIdentificadoresObraEmBreve/);
  assert.match(hook, /removerObraDaListaEmBreve/);
  assert.match(hook, /export function useEmBreveSalvarLancamento/);
  assert.match(hook, /const \[avisoAcesso, setAvisoAcesso\] = useState\(""\);/);
  assert.match(hook, /const \[obraProcessandoId, setObraProcessandoId\] = useState\(""\);/);
  assert.match(hook, /async function salvarLancamento\(obra: ObraEmBreveCard\)/);
  assert.match(hook, /obterIdentificadoresObraEmBreve\(obra\)/);
  assert.match(hook, /identificadoresObra\.length === 0 \|\| obraProcessandoId/);
  assert.match(hook, /supabase\.auth\.getUser\(\)/);
  assert.match(hook, /router\.push\(criarLoginHrefEmBreve\(\)\)/);
  assert.match(hook, /Entre na sua conta para ativar aviso de lançamento\./);
  assert.match(hook, /Não consegui salvar o aviso agora\. Tente novamente em instantes\./);
  assert.match(hook, /Não consegui confirmar sua conta agora\. Tente novamente\./);
  assert.match(hook, /setObraProcessandoId\(""\);/);
  assert.match(
    hook,
    /return \{\s*avisoAcesso,\s*obraProcessandoId,\s*salvarLancamento,\s*\};/s,
  );

  assert.match(
    page,
    /import \{ useEmBreveSalvarLancamento \} from "\.\/hooks\/use-em-breve-salvar-lancamento";/,
  );
  assert.match(page, /useEmBreveSalvarLancamento\(\{[\s\S]*?router,[\s\S]*?obrasSalvasNormalizadas,[\s\S]*?obrasReaisEmBreve,[\s\S]*?setUsuarioIdLogado,[\s\S]*?setObrasSalvas,/);
  assert.doesNotMatch(page, /async function salvarLancamento/);
  assert.doesNotMatch(page, /useState\(/);
  assert.doesNotMatch(page, /from "react"/);
  assert.doesNotMatch(page, /from "\.\.\/\.\.\/lib\/supabase\/client"/);
  assert.doesNotMatch(page, /sincronizarAvisoLancamentoSupabaseEmBreve/);
  assert.doesNotMatch(page, /criarLoginHrefEmBreve/);
  assert.doesNotMatch(page, /SAVED_RELEASES_STORAGE_KEY/);
  assert.doesNotMatch(page, /salvarJsonUsuarioEmBreve/);
  assert.doesNotMatch(page, /adicionarObraNaListaEmBreve/);
  assert.doesNotMatch(page, /listaTemObraEmBreve/);
  assert.doesNotMatch(page, /normalizarLancamentosSalvosComObrasEmBreve/);
  assert.doesNotMatch(page, /obterIdentificadoresObraEmBreve/);
  assert.doesNotMatch(page, /removerObraDaListaEmBreve/);
  assert.match(page, /removerObrasDuplicadasEmBreve/);
  assert.match(page, /<EmBreveWorksSection[\s\S]*?avisoAcesso=\{avisoAcesso\}[\s\S]*?obraProcessandoId=\{obraProcessandoId\}[\s\S]*?salvarLancamento=\{salvarLancamento\}/);
});
