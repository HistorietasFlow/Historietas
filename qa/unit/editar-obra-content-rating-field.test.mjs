import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const fieldSource = readFileSync(
  new URL(
    "../../app/editar-obra/components/EditarObraContentRatingField.tsx",
    import.meta.url,
  ),
  "utf8",
);
const formChangeActionsSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-form-change-actions.ts",
    import.meta.url,
  ),
  "utf8",
);

test("Editar Obra delega somente a apresenta\u00e7\u00e3o de classifica\u00e7\u00e3o e avisos 18+", () => {
  assert.match(
    pageSource,
    /import \{ EditarObraContentRatingField \} from "\.\/components\/EditarObraContentRatingField";/,
  );
  assert.match(
    pageSource,
    /<EditarObraContentRatingField[\s\S]*?classificacaoIndicativa=\{classificacaoIndicativa\}[\s\S]*?avisosConteudo18=\{avisosConteudo18\}[\s\S]*?language=\{language\}[\s\S]*?\/\>/,
  );
  assert.doesNotMatch(pageSource, /id="editar-obra-classificacao"/);
  assert.doesNotMatch(pageSource, /aria-label="Avisos de conte\u00fado 18\+"/);
});

test("hook preserva limpeza de avisos e toggle exato", () => {
  assert.match(
    formChangeActionsSource,
    /function alterarClassificacaoIndicativa\(novaClassificacao: string\) \{[\s\S]*?setClassificacaoIndicativa\(novaClassificacao\);[\s\S]*?if \(!ehClassificacao18\(novaClassificacao\)\) \{[\s\S]*?setAvisosConteudo18\(\[\]\);[\s\S]*?\}[\s\S]*?marcarAlteracao\(\);/,
  );
  assert.match(
    formChangeActionsSource,
    /function alternarAvisoConteudo18\(aviso: AvisoConteudo18\) \{[\s\S]*?setAvisosConteudo18\(\(avisosAtuais\) =>[\s\S]*?avisosAtuais\.includes\(aviso\)[\s\S]*?\? avisosAtuais\.filter\(\(item\) => item !== aviso\)[\s\S]*?: \[\.\.\.avisosAtuais, aviso\],[\s\S]*?\);[\s\S]*?marcarAlteracao\(\);/,
  );
});

test("campo preserva op\u00e7\u00f5es, avisos, tradu\u00e7\u00f5es e estilos selecionados", () => {
  for (const trecho of [
    'htmlFor="editar-obra-classificacao"',
    'id="editar-obra-classificacao"',
    '<option value="">Escolha a classifica\u00e7\u00e3o</option>',
    "<option>Livre</option>",
    "<option>10+</option>",
    "<option>12+</option>",
    "<option>14+</option>",
    "<option>16+</option>",
    "<option>18+</option>",
    "ehClassificacao18(classificacaoIndicativa)",
    'aria-label="Avisos de conte\u00fado 18+"',
    'traduzirTextoConteudo18("avisosObrigatorios", language)',
    'traduzirTextoConteudo18("descricaoPublicacao", language)',
    "AVISOS_CONTEUDO_18.map",
    "avisosConteudo18.includes(aviso)",
    'type="checkbox"',
    "checked={selecionado}",
    "onToggleAvisoConteudo18(aviso)",
    "traduzirAvisoConteudo18(aviso, language)",
    "...(selecionado ? adultWarningOptionSelectedStyle : {})",
  ]) {
    assert.ok(fieldSource.includes(trecho), trecho);
  }
  for (const estilo of [
    "adultWarningsBoxStyle",
    "adultWarningsTitleStyle",
    "adultWarningsDescriptionStyle",
    "adultWarningsGridStyle",
    "adultWarningOptionStyle",
    "adultWarningOptionSelectedStyle",
    "adultWarningCheckboxStyle",
  ]) {
    assert.match(fieldSource, new RegExp(`const ${estilo}: CSSProperties`));
    assert.doesNotMatch(pageSource, new RegExp(`const ${estilo}: CSSProperties`));
  }
});

test("componente recebe somente props de apresenta\u00e7\u00e3o sem muta\u00e7\u00e3o local", () => {
  assert.match(fieldSource, /language: HistorietasLanguage/);
  assert.match(fieldSource, /onClassificacaoChange: \(novaClassificacao: string\) => void/);
  assert.match(fieldSource, /onToggleAvisoConteudo18: \(aviso: AvisoConteudo18\) => void/);
  assert.doesNotMatch(fieldSource, /setClassificacaoIndicativa|setAvisosConteudo18|marcarAlteracao/);
});
