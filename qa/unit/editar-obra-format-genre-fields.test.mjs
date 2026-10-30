import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const fieldsSource = readFileSync(
  new URL(
    "../../app/editar-obra/components/EditarObraFormatGenreFields.tsx",
    import.meta.url,
  ),
  "utf8",
);
const sharedStylesSource = readFileSync(
  new URL(
    "../../app/editar-obra/styles/editar-obra-shared-styles.ts",
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

test("Editar Obra delega apenas a apresenta\u00e7\u00e3o de Formato e G\u00eanero", () => {
  assert.match(
    pageSource,
    /import \{ EditarObraFormatGenreFields \} from "\.\/components\/EditarObraFormatGenreFields";/,
  );
  assert.match(
    pageSource,
    /<EditarObraFormatGenreFields[\s\S]*?isDesktop=\{isDesktop\}[\s\S]*?formato=\{formato\}[\s\S]*?formatoPersonalizado=\{formatoPersonalizado\}[\s\S]*?formatoEhPersonalizado=\{formatoEhPersonalizado\}[\s\S]*?genero=\{genero\}[\s\S]*?generoPersonalizado=\{generoPersonalizado\}[\s\S]*?generoEhPersonalizado=\{generoEhPersonalizado\}[\s\S]*?\/>/,
  );
  assert.doesNotMatch(pageSource, /id="editar-obra-formato"/);
  assert.doesNotMatch(pageSource, /id="editar-obra-genero"/);
});

test("hook preserva regras e sanitiza\u00e7\u00e3o dos quatro callbacks", () => {
  assert.match(
    formChangeActionsSource,
    /function alterarFormato\(novoFormato: string\) \{[\s\S]*?setFormato\(novoFormato\);[\s\S]*?if \(novoFormato !== OUTRO_FORMATO_VALUE\) \{[\s\S]*?setFormatoPersonalizado\(""\);[\s\S]*?\}[\s\S]*?marcarAlteracao\(\);/,
  );
  assert.match(
    formChangeActionsSource,
    /function alterarFormatoPersonalizado\(novoFormatoPersonalizado: string\) \{[\s\S]*?setFormatoPersonalizado\([\s\S]*?limparTextoPersonalizado\([\s\S]*?novoFormatoPersonalizado,[\s\S]*?LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO[\s\S]*?\)[\s\S]*?\);[\s\S]*?marcarAlteracao\(\);/,
  );
  assert.match(
    formChangeActionsSource,
    /function alterarGenero\(novoGenero: string\) \{[\s\S]*?setGenero\(novoGenero\);[\s\S]*?if \(novoGenero !== OUTRO_GENERO_VALUE\) \{[\s\S]*?setGeneroPersonalizado\(""\);[\s\S]*?\}[\s\S]*?marcarAlteracao\(\);/,
  );
  assert.match(
    formChangeActionsSource,
    /function alterarGeneroPersonalizado\(novoGeneroPersonalizado: string\) \{[\s\S]*?setGeneroPersonalizado\([\s\S]*?limparTextoPersonalizado\([\s\S]*?novoGeneroPersonalizado,[\s\S]*?LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO[\s\S]*?\)[\s\S]*?\);[\s\S]*?marcarAlteracao\(\);/,
  );
});

test("campos preservam op\u00e7\u00f5es, valores especiais e acessibilidade", () => {
  for (const trecho of [
    'id="editar-obra-formato"',
    'id="editar-obra-genero"',
    "OPCOES_FORMATO_OBRA.map",
    "OPCOES_GENERO_OBRA.map",
    '<option value={OUTRO_FORMATO_VALUE}>Outro formato</option>',
    '<option value={OUTRO_GENERO_VALUE}>Outro g\u00eanero</option>',
    'aria-label="Outro formato"',
    'aria-label="Outro g\u00eanero"',
    'placeholder="Digite o formato"',
    'placeholder="Digite o g\u00eanero"',
    "maxLength={LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO}",
    'type="text"',
    "formatoEhPersonalizado &&",
    "generoEhPersonalizado &&",
    "onFormatoChange(event.target.value)",
    "onFormatoPersonalizadoChange(event.target.value)",
    "onGeneroChange(event.target.value)",
    "onGeneroPersonalizadoChange(event.target.value)",
  ]) {
    assert.ok(fieldsSource.includes(trecho), trecho);
  }
  assert.doesNotMatch(fieldsSource, /setFormato|setGenero|marcarAlteracao|limparTextoPersonalizado/);
});

test("campos concentram layout exclusivo e compartilham inputStyle", () => {
  assert.match(
    fieldsSource,
    /import \{[\s\S]*?fieldGroupStyle,[\s\S]*?inputStyle,[\s\S]*?labelStyle,[\s\S]*?\} from "\.\.\/styles\/editar-obra-shared-styles";/,
  );
  assert.match(sharedStylesSource, /export const inputStyle: CSSProperties/);
  for (const estilo of ["doubleFieldStyle", "desktopDoubleFieldStyle"]) {
    assert.match(fieldsSource, new RegExp(`const ${estilo}: CSSProperties`));
    assert.doesNotMatch(pageSource, new RegExp(`const ${estilo}: CSSProperties`));
  }
  assert.doesNotMatch(pageSource, /const inputStyle: CSSProperties/);
});
