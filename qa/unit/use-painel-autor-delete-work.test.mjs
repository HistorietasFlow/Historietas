import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const hook = readFileSync(
  new URL(
    "../../app/painel-autor/hooks/use-painel-autor-delete-work.ts",
    import.meta.url,
  ),
  "utf8",
);

test("hook de exclusão preserva autorização, limpeza remota e Storage", () => {
  for (const contrato of [
    "window.confirm(",
    "Tem certeza que deseja excluir a obra",
    "supabase.auth.getUser()",
    "dadosUsuario.user?.id || usuarioIdLogado",
    "router.replace(criarLoginHrefPainelAutor())",
    "criarSlugBase(tituloObra)",
    "idObraSupabaseValido(obraId)",
    '.from("obras")',
    '.select("id,user_id,capa_url,arquivo_url")',
    '.eq("id", obraId)',
    ".limit(1)",
    ".maybeSingle()",
    "erroAutorizacao",
    "normalizarIdUsuarioPainel",
    "Você não tem permissão para excluir esta obra.",
    "caminhoStoragePertenceAoUsuarioPainel",
    "obterCaminhoStoragePainel",
    'bucket: "capas-obras"',
    'bucket: "arquivos-obras"',
    "removerReferenciasSupabaseObraExcluidaPainel(",
    '.from("capitulos")',
    '.eq("obra_id", obraId)',
    '.eq("user_id", userId)',
    "obraRemovida?.id",
    "removerArquivosStorageObraExcluidaPainel(",
    "FOLLOW_STORAGE_KEY",
    "FAVORITES_STORAGE_KEY",
    "COMPLETED_STORAGE_KEY",
    "STORAGE_KEY",
    "limparReferenciasLocaisObraExcluidaPainel(",
    "salvarJsonStorageUsuarioPainel(",
    "salvarColecaoAposExcluirPainel(",
    "setObras(novasObras)",
    "setObrasFavoritas(novasObrasFavoritas)",
    "setObrasConcluidas(novasObrasConcluidas)",
    "console.warn(",
    "window.alert(",
  ]) {
    assert.ok(hook.includes(contrato), contrato);
  }

  assert.ok(
    hook.indexOf("removerReferenciasSupabaseObraExcluidaPainel(") <
      hook.indexOf('.from("capitulos")'),
  );
  assert.ok(
    hook.indexOf('.from("capitulos")') <
      hook.indexOf('.from("obras")\n            .delete()'),
  );
  assert.ok(
    hook.indexOf('.from("obras")\n            .delete()') <
      hook.indexOf("removerArquivosStorageObraExcluidaPainel("),
  );
});

test("página delega excluirObra ao hook e mantém PainelSecao", () => {
  assert.match(
    pagina,
    /import \{ usePainelAutorDeleteWork \} from "\.\/hooks\/use-painel-autor-delete-work";/,
  );
  assert.match(
    pagina,
    /const \{ excluirObra \} = usePainelAutorDeleteWork\(\{[\s\S]*?router,[\s\S]*?language,[\s\S]*?usuarioIdLogado,[\s\S]*?obras,[\s\S]*?obrasFavoritas,[\s\S]*?obrasConcluidas,[\s\S]*?setObras,[\s\S]*?setObrasFavoritas,[\s\S]*?setObrasConcluidas,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /async function excluirObra\(/);
  assert.match(pagina, /<PainelSecao<ObraComMetricas>[\s\S]*?onExcluirObra=\{excluirObra\}/);
});

test("hook não introduz callback de otimização", () => {
  assert.doesNotMatch(hook, /useCallback/);
});
