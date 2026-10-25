import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const previewSource = readFileSync(
  new URL(
    "../../app/editar-obra/components/EditarObraPreview.tsx",
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

test("Editar Obra delega somente a prévia visual mantendo a orquestração na página", () => {
  assert.match(
    pageSource,
    /import \{ EditarObraPreview \} from "\.\/components\/EditarObraPreview";/,
  );
  assert.doesNotMatch(pageSource, /<aside style=\{isDesktop \? desktopPreviewPanelStyle/);
  assert.match(
    pageSource,
    /<EditarObraPreview[\s\S]*?isDesktop=\{isDesktop\}[\s\S]*?capa=\{capa\}[\s\S]*?titulo=\{titulo\}[\s\S]*?formatoFinal=\{formatoFinal\}[\s\S]*?classificacaoIndicativa=\{classificacaoIndicativa\}[\s\S]*?autorPreview=\{autorPreview\}[\s\S]*?quantidadeCapitulos=\{obraAtual\?\.capitulos\.length \|\| 0\}[\s\S]*?progresso=\{progresso\}[\s\S]*?generoFinal=\{generoFinal\}[\s\S]*?publicado=\{obraAtual\?\.publicado\}/,
  );
  assert.doesNotMatch(pageSource, /const previewPanelStyle: CSSProperties/);
  assert.doesNotMatch(pageSource, /const desktopPreviewPanelStyle: CSSProperties/);
});

test("prévia preserva conteúdo, fallbacks, acessibilidade e progresso", () => {
  for (const trecho of [
    "export function EditarObraPreview",
    '<aside style={isDesktop ? desktopPreviewPanelStyle : previewPanelStyle}>',
    "PRÉVIA DA OBRA",
    "titulo.trim()",
    'data-historietas-i18n-ignore="true"',
    '"Obra sem título"',
    'formatoFinal || "Formato"',
    'classificacaoIndicativa === "Não informada"',
    'classificacaoIndicativa === "Não informado"',
    ': classificacaoIndicativa || "Livre"',
    'Por{" "}',
    '"Autor não informado"',
    '"1 cap."',
    "`${quantidadeCapitulos} cap.`",
    "width: `${progresso}%`",
    "{progresso}% pronto",
    'generoFinal || "Gênero"',
    'publicado ? "Publicado" : "Rascunho"',
    "criarPreviewCoverStyle(capa, previewCoverStyle)",
  ]) {
    assert.ok(previewSource.includes(trecho), trecho);
  }
});

test("prévia concentra os estilos exclusivos e compartilha safeTextStyle", () => {
  assert.match(
    previewSource,
    /import \{ safeTextStyle \} from "\.\.\/styles\/editar-obra-shared-styles";/,
  );
  assert.match(
    sharedStylesSource,
    /export const safeTextStyle: CSSProperties = \{\s*overflowWrap: "anywhere",\s*wordBreak: "break-word",\s*\};/,
  );
  assert.doesNotMatch(pageSource, /const safeTextStyle: CSSProperties/);
  for (const estilo of [
    "previewPanelStyle",
    "desktopPreviewPanelStyle",
    "previewCardStyle",
    "desktopPreviewCardStyle",
    "previewProgressFillStyle",
    "previewActionBadgeStyle",
  ]) {
    assert.match(previewSource, new RegExp(`const ${estilo}: CSSProperties`));
    assert.doesNotMatch(pageSource, new RegExp(`const ${estilo}: CSSProperties`));
  }
});
