import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const assetActionsSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-asset-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const tagActionsSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-tag-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const saveActionSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-save-action.ts",
    import.meta.url,
  ),
  "utf8",
);

test("ações de assets preservam validação, FileReader e ordem dos setters", () => {
  assert.match(assetActionsSource, /export function useEditarObraAssetActions\(/);
  assert.match(assetActionsSource, /function selecionarCapa\(event: ChangeEvent<HTMLInputElement>\)/);
  assert.match(assetActionsSource, /arquivoImagemAceito\(arquivo\)/);
  assert.match(assetActionsSource, /arquivo\.size > TAMANHO_MAXIMO_CAPA/);
  assert.match(assetActionsSource, /const leitor = new FileReader\(\)/);
  assert.match(assetActionsSource, /leitor\.readAsDataURL\(arquivo\)/);
  assert.match(assetActionsSource, /function removerCapa\(\)[\s\S]*?setCapa\(""\);[\s\S]*?setCapaNome\(""\);[\s\S]*?setCapaArquivo\(null\);[\s\S]*?setCapaRemovidaManualmente\(true\);/);
  assert.match(assetActionsSource, /function selecionarArquivoObra\(event: ChangeEvent<HTMLInputElement>\)/);
  assert.match(assetActionsSource, /arquivoObraAceito\(arquivo\)/);
  assert.match(assetActionsSource, /arquivo\.size > TAMANHO_MAXIMO_ARQUIVO_OBRA/);
  assert.match(assetActionsSource, /categoria: identificarCategoriaArquivo\(arquivo\)/);
  assert.match(assetActionsSource, /criadoEm: new Date\(\)\.toISOString\(\)/);
  assert.match(assetActionsSource, /function removerArquivoObra\(\)[\s\S]*?setArquivoObra\(null\);[\s\S]*?setArquivoObraArquivo\(null\);[\s\S]*?setArquivoObraRemovidoManualmente\(true\);/);
  assert.doesNotMatch(assetActionsSource, /useCallback|useState|useEffect|supabase|localStorage/);
});

test("ações de tags preservam helpers, setters e atualização", () => {
  assert.match(tagActionsSource, /export function useEditarObraTagActions\(/);
  assert.match(tagActionsSource, /function atualizarTagPersonalizada\(valor: string\)/);
  assert.match(tagActionsSource, /prepararAtualizacaoTagPersonalizada\([\s\S]*?LIMITE_CARACTERES_TAG_PERSONALIZADA/);
  assert.match(tagActionsSource, /function adicionarTagSelecionada\(tag: string\)/);
  assert.match(tagActionsSource, /prepararSelecaoTagEdicaoObra\([\s\S]*?tagPersonalizada,[\s\S]*?OUTRA_TAG_VALUE,[\s\S]*?LIMITE_CARACTERES_TAG_PERSONALIZADA,/);
  assert.match(tagActionsSource, /if \(proximaTag\.tagPersonalizada !== undefined\)/);
  assert.doesNotMatch(tagActionsSource, /useCallback|useState|useEffect|supabase|localStorage/);
});

test("página delega as ações e preserva o salvamento", () => {
  assert.match(pageSource, /useEditarObraAssetActions\(/);
  assert.match(pageSource, /useEditarObraTagActions\(/);
  assert.match(pageSource, /import \{ useEditarObraSaveAction \} from "\.\/hooks\/use-editar-obra-save-action";/);
  assert.match(pageSource, /const \{ salvarEdicao \} = useEditarObraSaveAction\(/);
  assert.match(saveActionSource, /async function salvarEdicao\(event: FormEvent<HTMLFormElement>\)/);
  assert.doesNotMatch(pageSource, /function selecionarCapa\(event: ChangeEvent<HTMLInputElement>\)/);
  assert.doesNotMatch(pageSource, /function atualizarTagPersonalizada\(valor: string\)/);
});
