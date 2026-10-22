import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/publicar/page.tsx", import.meta.url),
  "utf8",
);
const layout = readFileSync(
  new URL("../../app/publicar/lib/publicar-layout-styles.ts", import.meta.url),
  "utf8",
);
const formulario = readFileSync(
  new URL("../../app/publicar/lib/publicar-form-upload-styles.ts", import.meta.url),
  "utf8",
);
const previa = readFileSync(
  new URL("../../app/publicar/lib/publicar-preview-styles.ts", import.meta.url),
  "utf8",
);
const componentePrevia = readFileSync(
  new URL("../../app/publicar/components/PublicarWorkPreview.tsx", import.meta.url),
  "utf8",
);

test("Publicar isola a base e o layout responsivo", () => {
  for (const nome of [
    "safeTextStyle",
    "pageStyle",
    "containerStyle",
    "titleHeaderStyle",
    "progressBoxStyle",
    "desktopContainerStyle",
    "desktopProgressBoxStyle",
    "mobileTopWaterFadeStyle",
    "desktopTopWaterFadeStyle",
  ]) {
    assert.match(layout, new RegExp(`export const ${nome}: CSSProperties =`));
  }

  assert.match(layout, /\.\.\.topStyle/);
  assert.match(layout, /\.\.\.containerStyle/);
  assert.match(layout, /\.\.\.progressBoxStyle/);
  assert.match(layout, /overflowWrap: "anywhere"/);
  assert.match(layout, /height: "min\(620px, 68vh\)"/);
  assert.match(pagina, /from "\.\/lib\/publicar-layout-styles";/);
  assert.doesNotMatch(pagina, /const pageStyle: CSSProperties =/);
  assert.doesNotMatch(pagina, /const desktopContainerStyle: CSSProperties =/);
});

test("Publicar isola estilos de formulario e upload com variantes desktop", () => {
  for (const nome of [
    "formPanelStyle",
    "inputStyle",
    "textareaStyle",
    "chapterImportBoxStyle",
    "adultWarningsBoxStyle",
    "desktopFormPanelStyle",
    "desktopDoubleFieldStyle",
    "desktopChapterImportBoxStyle",
    "desktopButtonAreaStyle",
  ]) {
    assert.match(formulario, new RegExp(`export const ${nome}: CSSProperties =`));
  }

  assert.match(formulario, /import \{ safeTextStyle \} from "\.\/publicar-layout-styles";/);
  assert.match(formulario, /export function criarCoverUploadIconBoxStyle\(/);
  assert.match(formulario, /\.\.\.chapterImportIconBoxStyle/);
  assert.match(formulario, /\.\.\.desktopDoubleFieldStyle/);
  assert.match(formulario, /backgroundImage: `url\(\$\{capaAtual\}\)`/);
  assert.match(pagina, /from "\.\/lib\/publicar-form-upload-styles";/);
  assert.doesNotMatch(pagina, /const chapterImportBoxStyle: CSSProperties =/);
  assert.doesNotMatch(pagina, /function criarCoverUploadIconBoxStyle\(/);
});

test("Publicar isola a previa e mantem modulos visuais puros", () => {
  for (const nome of [
    "previewPanelStyle",
    "previewCardStyle",
    "previewCoverStyle",
    "previewProgressTrackStyle",
    "previewActionBadgeStyle",
    "desktopPreviewPanelStyle",
    "desktopPreviewCardStyle",
    "desktopEmptyPreviewBoxStyle",
  ]) {
    assert.match(previa, new RegExp(`export const ${nome}: CSSProperties =`));
  }

  assert.match(previa, /import \{ safeTextStyle \} from "\.\/publicar-layout-styles";/);
  assert.match(previa, /export function criarPreviewCoverStyle\(/);
  assert.match(previa, /\.\.\.previewCoverStyle/);
  assert.match(previa, /backgroundImage: `url\(\$\{capa\}\)`/);
  assert.match(previa, /\.\.\.previewPanelStyle/);
  assert.match(pagina, /from "\.\/components\/PublicarWorkPreview";/);
  assert.match(componentePrevia, /from "\.\.\/lib\/publicar-preview-styles";/);
  assert.doesNotMatch(pagina, /const previewPanelStyle: CSSProperties =/);
  assert.doesNotMatch(pagina, /function criarPreviewCoverStyle\(/);
  assert.match(componentePrevia, /criarPreviewCoverStyle\(capa\)/);

  for (const modulo of [layout, formulario, previa]) {
    assert.doesNotMatch(modulo, /supabase|localStorage|useEffect|window\.|document\.|<\w/);
  }
});
