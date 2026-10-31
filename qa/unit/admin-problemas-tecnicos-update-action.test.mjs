import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  "app/admin/problemas-tecnicos/page.tsx",
  "utf8",
);
const source = readFileSync(
  "app/admin/problemas-tecnicos/actions/atualizar-problema-tecnico-admin.ts",
  "utf8",
);
const hook = readFileSync(
  "app/admin/problemas-tecnicos/hooks/use-admin-problemas-tecnicos-actions.ts",
  "utf8",
);

test("action preserva a mutation isolada do chamado tecnico", () => {
  const fields =
    "id,user_id,email_contato,categoria,titulo,descricao,pagina_url,navegador,dispositivo,status,prioridade,observacao_admin,analisado_por,analisado_em,criado_em,atualizado_em";

  assert.match(source, /\.from\("problemas_tecnicos"\)/);
  assert.match(source, /\.update\(payload\)/);
  assert.match(source, /\.eq\("id", id\)/);
  assert.match(source, new RegExp(`\\.select\\(\\s*"${fields}"`));
  assert.match(source, /\.maybeSingle\(\)/);
  assert.doesNotMatch(
    source,
    /useState|useEffect|router|localStorage|set[A-Z]|fetch\(|<\w/,
  );
});

test("hook preserva orquestracao e estado da atualizacao", () => {
  assert.match(hook, /atualizarProblemaTecnicoAdmin/);
  assert.match(hook, /if \(!usuarioId \|\| !ehAdmin\)/);
  assert.match(
    hook,
    /const payload: TablesUpdate<"problemas_tecnicos"> = \{\};/,
  );
  assert.match(hook, /alteracoes\.observacaoAdmin\.trim\(\)/);
  assert.match(hook, /id: problema\.id,\s*payload,/);
  assert.match(hook, /if \(error\) \{\s*throw error;/);
  assert.match(
    hook,
    /if \(!data\) \{\s*throw new Error\(\s*"O chamado não foi encontrado ou não pôde ser atualizado\."/,
  );
  assert.match(hook, /setProblemas/);
  assert.match(hook, /setObservacoes/);
  assert.match(hook, /normalizarStatus\(atualizado\.status\)/);
  assert.match(hook, /normalizarPrioridade\(atualizado\.prioridade\)/);
  assert.match(hook, /catch \(error\)/);
  assert.match(hook, /finally \{/);
  assert.match(page, /useAdminProblemasTecnicosActions/);
  assert.doesNotMatch(page, /async function atualizarChamado/);
});
