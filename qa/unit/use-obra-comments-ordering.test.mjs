import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-comments-ordering.ts",
    import.meta.url,
  ),
  "utf8",
);
const cliente = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("hook preserva estados iniciais e callbacks estaveis de ordenacao", () => {
  assert.match(hook, /export function useObraCommentsOrdering\(\)/);
  assert.match(
    hook,
    /useState<OrdenacaoComentariosObra>\("relevantes"\)/,
  );
  assert.match(hook, /useState\(false\)/);
  assert.match(
    hook,
    /const alternarMenuOrdenacaoComentarios = useCallback\(\(\) => \{\s*setMenuOrdenacaoComentariosAberto\(\(aberto\) => !aberto\);\s*\}, \[\]\);/,
  );
  assert.match(
    hook,
    /const fecharMenuOrdenacaoComentarios = useCallback\(\(\) => \{\s*setMenuOrdenacaoComentariosAberto\(false\);\s*\}, \[\]\);/,
  );
});

test("hook preserva selecao antes do fechamento do menu", () => {
  const relevantes = hook.indexOf("const selecionarComentariosRelevantes");
  const recentes = hook.indexOf("const selecionarComentariosRecentes");

  assert.ok(relevantes >= 0);
  assert.ok(recentes > relevantes);
  assert.match(
    hook.slice(relevantes, recentes),
    /setOrdenacaoComentarios\("relevantes"\);\s*setMenuOrdenacaoComentariosAberto\(false\);/,
  );
  assert.match(
    hook.slice(recentes),
    /setOrdenacaoComentarios\("recentes"\);\s*setMenuOrdenacaoComentariosAberto\(false\);/,
  );
});

test("cliente preserva sheet, memoizacao e cabecalho como consumidores", () => {
  assert.match(
    cliente,
    /import \{ useObraCommentsOrdering \} from "\.\/hooks\/use-obra-comments-ordering";/,
  );
  assert.match(cliente, /\} = useObraCommentsOrdering\(\);/);
  assert.match(
    cliente,
    /const estruturaComentariosObra = useMemo\(\s*\(\) => criarEstruturaComentariosObra\(comentariosObra, ordenacaoComentarios\),/,
  );
  assert.match(cliente, /function abrirComentariosObra\(\)[\s\S]*?fecharMenuOrdenacaoComentarios\(\);/);
  assert.match(cliente, /function fecharComentariosObra\(\)[\s\S]*?fecharMenuOrdenacaoComentarios\(\);/);
  assert.match(cliente, /onAlternarMenu=\{alternarMenuOrdenacaoComentarios\}/);
  assert.match(cliente, /onSelecionarRelevantes=\{selecionarComentariosRelevantes\}/);
  assert.match(cliente, /onSelecionarRecentes=\{selecionarComentariosRecentes\}/);
  assert.doesNotMatch(cliente, /setOrdenacaoComentarios|setMenuOrdenacaoComentariosAberto/);
});
