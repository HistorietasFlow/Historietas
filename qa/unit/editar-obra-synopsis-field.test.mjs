import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const fieldSource = readFileSync(
  new URL(
    "../../app/editar-obra/components/EditarObraSynopsisField.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("Editar Obra delega somente a apresentação do campo de Sinopse", () => {
  assert.match(
    pageSource,
    /import \{ EditarObraSynopsisField \} from "\.\/components\/EditarObraSynopsisField";/,
  );
  assert.match(
    pageSource,
    /<EditarObraSynopsisField[\s\S]*?isDesktop=\{isDesktop\}[\s\S]*?sinopse=\{sinopse\}[\s\S]*?onSinopseChange=\{\(novaSinopse\) => \{[\s\S]*?setSinopse\(novaSinopse\);[\s\S]*?marcarAlteracao\(\);[\s\S]*?\}\}[\s\S]*?\/\>/,
  );
  assert.doesNotMatch(pageSource, /id="editar-obra-sinopse"/);
  assert.doesNotMatch(pageSource, /const textareaStyle: CSSProperties/);
  assert.doesNotMatch(pageSource, /const desktopTextareaStyle: CSSProperties/);
});

test("campo preserva identificação, valor, placeholder e responsividade", () => {
  for (const trecho of [
    'htmlFor="editar-obra-sinopse"',
    "Sinopse",
    'id="editar-obra-sinopse"',
    "value={sinopse}",
    'placeholder="Escreva a sinopse da obra"',
    "onSinopseChange(event.target.value)",
    "isDesktop ? desktopTextareaStyle : textareaStyle",
  ]) {
    assert.ok(fieldSource.includes(trecho), trecho);
  }
});

test("campo concentra estilos exclusivos e recebe somente props de apresentação", () => {
  assert.match(fieldSource, /isDesktop: boolean/);
  assert.match(fieldSource, /sinopse: string/);
  assert.match(fieldSource, /onSinopseChange: \(sinopse: string\) => void/);
  assert.match(
    fieldSource,
    /import \{[\s\S]*?fieldGroupStyle,[\s\S]*?labelStyle,[\s\S]*?safeTextStyle,[\s\S]*?\} from "\.\.\/styles\/editar-obra-shared-styles";/,
  );
  for (const trecho of [
    "const textareaStyle: CSSProperties",
    'minHeight: "90px"',
    'borderRadius: "20px"',
    'border: "1px solid rgba(255,255,255,0.08)"',
    'background: "var(--historietas-editar-obra-bg-deep, #000000)"',
    'color: "#FFFFFF"',
    'padding: "14px"',
    "lineHeight: 1.58",
    'resize: "vertical"',
    "...safeTextStyle",
    "const desktopTextareaStyle: CSSProperties",
    'minHeight: "132px"',
  ]) {
    assert.ok(fieldSource.includes(trecho), trecho);
  }
  assert.doesNotMatch(fieldSource, /setSinopse|marcarAlteracao|useState|useEffect/);
});
