import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/admin/problemas-tecnicos/page.tsx", "utf8");
const loader = readFileSync(
  "app/admin/problemas-tecnicos/loaders/buscar-problemas-tecnicos-admin.ts",
  "utf8",
);

test("loader preserva a query da fila de problemas técnicos", () => {
  assert.match(loader, /\.from\("problemas_tecnicos"\)/);
  assert.ok(
    loader.includes(
      '"id,user_id,email_contato,categoria,titulo,descricao,pagina_url,navegador,dispositivo,status,prioridade,observacao_admin,analisado_por,analisado_em,criado_em,atualizado_em"',
    ),
  );
  assert.match(loader, /\.order\("criado_em", \{ ascending: false \}\)/);
  assert.match(loader, /\.limit\(300\)/);
  assert.doesNotMatch(
    loader,
    /useState|useEffect|router|set[A-Z]|localStorage|sessionStorage|<[^>]+>/,
  );
});

test("página mantém normalização, erro e estados após delegar a query", () => {
  assert.match(page, /import \{ buscarProblemasTecnicosAdmin \} from "\.\/loaders\/buscar-problemas-tecnicos-admin";/);
  assert.match(page, /const \{ data, error \} = await buscarProblemasTecnicosAdmin\(\);/);
  assert.match(page, /if \(error\) \{\s*throw error;\s*\}/);
  assert.match(page, /const registros = \(data \|\| \[\]\)\.map/);
  assert.match(page, /normalizarCategoria\(registro\.categoria\)/);
  assert.match(page, /normalizarStatus\(registro\.status\)/);
  assert.match(page, /normalizarPrioridade\(registro\.prioridade\)/);
  assert.match(page, /setProblemas\(registros\)/);
  assert.match(page, /setObservacoes\(/);
  assert.match(page, /await carregarNomes\(registros\.map\(\(problema\) => problema\.userId\)\)/);
});
