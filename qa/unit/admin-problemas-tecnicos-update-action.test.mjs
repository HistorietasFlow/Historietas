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

test("pagina preserva orquestracao e estado da atualizacao", () => {
  assert.match(page, /atualizarProblemaTecnicoAdmin/);
  assert.match(page, /if \(!usuarioId \|\| !ehAdmin\)/);
  assert.match(
    page,
    /const payload: TablesUpdate<"problemas_tecnicos"> = \{\};/,
  );
  assert.match(page, /alteracoes\.observacaoAdmin\.trim\(\)/);
  assert.match(page, /id: problema\.id,\s*payload,/);
  assert.match(page, /if \(error\) \{\s*throw error;/);
  assert.match(
    page,
    /if \(!data\) \{\s*throw new Error\(\s*"O chamado não foi encontrado ou não pôde ser atualizado\."/,
  );
  assert.match(page, /setProblemas/);
  assert.match(page, /setObservacoes/);
  assert.match(page, /normalizarStatus\(atualizado\.status\)/);
  assert.match(page, /normalizarPrioridade\(atualizado\.prioridade\)/);
  assert.match(page, /catch \(error\)/);
  assert.match(page, /finally \{/);
});
