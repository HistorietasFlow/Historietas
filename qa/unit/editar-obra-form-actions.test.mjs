import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const actionsSource = readFileSync(
  new URL(
    "../../app/editar-obra/components/EditarObraFormActions.tsx",
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

test("Editar Obra delega ações e progresso dentro do formulário existente", () => {
  assert.match(
    pageSource,
    /import \{ EditarObraFormActions \} from "\.\/components\/EditarObraFormActions";/,
  );
  assert.match(
    pageSource,
    /<form onSubmit=\{salvarEdicao\}[\s\S]*?<EditarObraFormActions[\s\S]*?isDesktop=\{isDesktop\}[\s\S]*?processando=\{processando\}[\s\S]*?salvou=\{salvou\}[\s\S]*?minhaObraHref=\{minhaObraHref\}[\s\S]*?progresso=\{progresso\}[\s\S]*?\/>[\s\S]*?<\/form>/,
  );
  assert.doesNotMatch(pageSource, /<button\s+type="submit"/);
  assert.doesNotMatch(pageSource, /const buttonAreaStyle: CSSProperties/);
  assert.doesNotMatch(pageSource, /const progressBoxStyle: CSSProperties/);
});

test("ações preservam submit, estados, links, SVG e progresso", () => {
  for (const trecho of [
    'type="submit"',
    "disabled={processando}",
    '"Salvando..."',
    "<span>Atualizada</span>",
    '"Salvar alterações"',
    'viewBox="0 0 24 24"',
    'd="M20 6 9 17l-5-5"',
    'strokeWidth="2.4"',
    'strokeLinecap="round"',
    'strokeLinejoin="round"',
    "href={minhaObraHref}",
    "Ver obra",
    'href="/painel-autor"',
    "Cancelar",
    "Progresso",
    "{progresso}%",
    "width: `${progresso}%`",
  ]) {
    assert.ok(actionsSource.includes(trecho), trecho);
  }
});

test("ações concentram estilos exclusivos e compartilham safeTextStyle", () => {
  assert.match(
    actionsSource,
    /import \{ safeTextStyle \} from "\.\.\/styles\/editar-obra-shared-styles";/,
  );
  assert.match(
    sharedStylesSource,
    /export const safeTextStyle: CSSProperties = \{\s*overflowWrap: "anywhere",\s*wordBreak: "break-word",\s*\};/,
  );
  for (const estilo of [
    "buttonAreaStyle",
    "saveButtonStyle",
    "disabledButtonStyle",
    "secondaryButtonStyle",
    "cancelButtonStyle",
    "progressBoxStyle",
    "progressTopStyle",
    "progressLabelStyle",
    "progressNumberStyle",
    "progressTrackStyle",
    "progressFillStyle",
    "desktopButtonAreaStyle",
    "desktopProgressBoxStyle",
    "desktopSaveButtonStyle",
    "desktopDisabledButtonStyle",
    "desktopSecondaryButtonStyle",
    "desktopCancelButtonStyle",
  ]) {
    assert.match(actionsSource, new RegExp(`const ${estilo}: CSSProperties`));
    assert.doesNotMatch(pageSource, new RegExp(`const ${estilo}: CSSProperties`));
  }
  assert.doesNotMatch(pageSource, /const safeTextStyle: CSSProperties/);
});
