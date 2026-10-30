import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const hookPath = new URL(
  "../../app/editar-obra/hooks/use-editar-obra-initial-load.ts",
  import.meta.url,
);
const typesPath = new URL("../../app/editar-obra/types.ts", import.meta.url);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const hookSource = readFileSync(hookPath, "utf8");
const typesSource = readFileSync(typesPath, "utf8");

test("tipos locais de Editar Obra foram movidos sem alterar contratos", () => {
  assert.equal(existsSync(typesPath), true);
  for (const typeName of [
    "CapituloLocal",
    "ArquivoObraLocal",
    "ObraLocal",
  ]) {
    assert.match(typesSource, new RegExp(`export type ${typeName} =`));
    assert.doesNotMatch(pageSource, new RegExp(`type ${typeName} =`));
  }
  assert.match(typesSource, /avisosConteudo: AvisoConteudo18\[\];/);
  assert.match(typesSource, /arquivoObra\?: ArquivoObraLocal \| null;/);
  assert.match(typesSource, /capitulos: CapituloLocal\[\];/);
  assert.match(pageSource, /import type \{ ArquivoObraLocal, ObraLocal \} from "\.\/types";/);
  assert.match(hookSource, /import type \{ ArquivoObraLocal, ObraLocal \} from "\.\.\/types";/);
});

test("página delega somente o carregamento inicial para o hook", () => {
  assert.equal(existsSync(hookPath), true);
  assert.match(
    pageSource,
    /import \{ useEditarObraInitialLoad \} from "\.\/hooks\/use-editar-obra-initial-load";/,
  );
  assert.match(pageSource, /useEditarObraInitialLoad\(\{[\s\S]*?router,[\s\S]*?setObraId,[\s\S]*?setObras,[\s\S]*?setCarregando,/);
  assert.doesNotMatch(pageSource, /function aplicarObraNoFormulario\(/);
  assert.doesNotMatch(pageSource, /async function carregarObra\(\)/);
});

test("hook preserva sequência, cancelamento, auth e reconciliação inicial", () => {
  assert.match(hookSource, /useEffect\(\(\) => \{/);
  assert.match(hookSource, /let cancelado = false;/);
  assert.match(hookSource, /const obraIdParam = obterObraIdEdicaoObra\(window\.location\.search\);/);
  assert.match(hookSource, /await supabase\.auth\.getUser\(\)/);
  assert.match(hookSource, /router\.replace\(criarLoginHrefEditarObra\(obraIdParam\)\)/);
  assert.match(hookSource, /carregarObrasLocalStorageEdicaoObra\(userId\)[\s\S]*?carregarObraSupabaseEdicaoObra\(/);
  assert.match(hookSource, /carregarCapitulosSupabaseEdicaoObra\([\s\S]*?normalizarObraSupabase\([\s\S]*?prepararObrasCarregadasEdicaoObra\(/);
  assert.match(hookSource, /sincronizarBackupArquivosObras\(obrasAtualizadasDoUsuario, userId\)/);
  assert.match(hookSource, /return \(\) => \{\s*cancelado = true;\s*\};/);
  assert.match(
    hookSource,
    /\}, \[\s*router,[\s\S]*?setObraId,[\s\S]*?setArquivoObraRemovidoManualmente,\s*\]\);/,
  );
  assert.doesNotMatch(hookSource, /useState|useMemo|useCallback|useRef/);
});
