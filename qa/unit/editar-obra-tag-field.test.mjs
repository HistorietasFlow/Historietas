import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const fieldSource = readFileSync(
  new URL(
    "../../app/editar-obra/components/EditarObraTagField.tsx",
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

test("Editar Obra delega somente a apresenta\u00e7\u00e3o do campo de Tag", () => {
  assert.match(
    pageSource,
    /import \{ EditarObraTagField \} from "\.\/components\/EditarObraTagField";/,
  );
  assert.match(
    pageSource,
    /<EditarObraTagField[\s\S]*?usarTagPersonalizada=\{usarTagPersonalizada\}[\s\S]*?tagsTratadas=\{tagsTratadas\}[\s\S]*?tagPersonalizada=\{tagPersonalizada\}[\s\S]*?onTagChange=\{adicionarTagSelecionada\}[\s\S]*?onTagPersonalizadaChange=\{atualizarTagPersonalizada\}[\s\S]*?\/\>/,
  );
  assert.doesNotMatch(pageSource, /id="editar-obra-tag"/);
});

test("hook preserva integralmente os handlers e helpers de Tag", () => {
  assert.match(
    tagActionsSource,
    /function atualizarTagPersonalizada\(valor: string\) \{[\s\S]*?prepararAtualizacaoTagPersonalizada\([\s\S]*?LIMITE_CARACTERES_TAG_PERSONALIZADA[\s\S]*?\);[\s\S]*?setTagPersonalizada\(proximaTag\.tagPersonalizada\);[\s\S]*?setTags\(proximaTag\.tags\);[\s\S]*?marcarAlteracao\(\);[\s\S]*?\}/,
  );
  assert.match(
    tagActionsSource,
    /function adicionarTagSelecionada\(tag: string\) \{[\s\S]*?prepararSelecaoTagEdicaoObra\([\s\S]*?OUTRA_TAG_VALUE,[\s\S]*?LIMITE_CARACTERES_TAG_PERSONALIZADA,[\s\S]*?\);[\s\S]*?setUsarTagPersonalizada\(proximaTag\.usarTagPersonalizada\);[\s\S]*?setTags\(proximaTag\.tags\);[\s\S]*?marcarAlteracao\(\);[\s\S]*?\}/,
  );
});

test("campo preserva op\u00e7\u00f5es, valor especial e entrada personalizada", () => {
  for (const trecho of [
    'htmlFor="editar-obra-tag"',
    'id="editar-obra-tag"',
    'usarTagPersonalizada ? OUTRA_TAG_VALUE : tagsTratadas[0] || ""',
    '<option value="">Escolha uma tag</option>',
    "OPCOES_TAGS_OBRA.map",
    '<option key={tag} value={tag}>',
    '<option value={OUTRA_TAG_VALUE}>Outra tag</option>',
    "usarTagPersonalizada &&",
    'aria-label="Outra tag"',
    "value={tagPersonalizada}",
    'placeholder="Digite a tag"',
    "maxLength={LIMITE_CARACTERES_TAG_PERSONALIZADA}",
    'type="text"',
    "onTagChange(event.target.value)",
    "onTagPersonalizadaChange(event.target.value)",
  ]) {
    assert.ok(fieldSource.includes(trecho), trecho);
  }
});

test("campo recebe somente props de apresenta\u00e7\u00e3o e estilos compartilhados", () => {
  assert.match(fieldSource, /tagsTratadas: readonly string\[\]/);
  assert.match(fieldSource, /onTagChange: \(tag: string\) => void/);
  assert.match(fieldSource, /onTagPersonalizadaChange: \(valor: string\) => void/);
  assert.match(
    fieldSource,
    /import \{[\s\S]*?fieldGroupStyle,[\s\S]*?inputStyle,[\s\S]*?labelStyle,[\s\S]*?\} from "\.\.\/styles\/editar-obra-shared-styles";/,
  );
  assert.doesNotMatch(
    fieldSource,
    /setTagPersonalizada|setTags|setUsarTagPersonalizada|marcarAlteracao|prepararAtualizacaoTagPersonalizada|prepararSelecaoTagEdicaoObra/,
  );
});
