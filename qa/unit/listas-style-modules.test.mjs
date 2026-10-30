import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  new URL("../../app/listas/page.tsx", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");
const layout = readFileSync(
  new URL("../../app/listas/lib/listas-layout-styles.ts", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");
const work = readFileSync(
  new URL("../../app/listas/lib/listas-work-styles.ts", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");
const diary = readFileSync(
  new URL(
    "../../app/listas/lib/listas-diary-comments-styles.ts",
    import.meta.url,
  ),
  "utf8",
).replace(/\r\n/g, "\n");
const workActionSheetRenderer = readFileSync(
  new URL(
    "../../app/listas/hooks/use-listas-work-action-sheet-renderer.tsx",
    import.meta.url,
  ),
  "utf8",
).replace(/\r\n/g, "\n");

test("Listas delega todos os estilos estaticos aos tres modulos", () => {
  assert.match(page, /from "\.\/lib\/listas-layout-styles";/);
  assert.match(workActionSheetRenderer, /from "\.\.\/lib\/listas-work-styles";/);
  assert.match(page, /from "\.\/lib\/listas-diary-comments-styles";/);
  assert.doesNotMatch(page, /^const \w+Style: CSSProperties =/m);
  assert.doesNotMatch(page, /^function criarAvatar(?:Perfil|Comentario)DiarioListasStyle/m);

  for (const [source, style] of [
    [layout, "pageStyle"],
    [layout, "rowTitleStyle"],
    [layout, "stateStyle"],
    [layout, "footerStyle"],
    [work, "actionSheetStyle"],
    [work, "listDiaryAnnotationSaveStyle"],
    [work, "listDiaryCardAnnotationStyle"],
    [diary, "listDiaryProfileHeaderStyle"],
    [diary, "commentsSheetStyle"],
    [diary, "commentsSheetSendStyle"],
  ]) {
    assert.match(source, new RegExp(`export const ${style}: CSSProperties =`));
  }
});

test("spreads entre estilos preservam ordem e modulos base", () => {
  assert.match(layout, /export const listDiaryControlsStyle: CSSProperties = \{\n  \.\.\.controlsStyle,/);
  assert.match(layout, /export const tabActiveStyle: CSSProperties = \{\n  \.\.\.tabStyle,/);
  assert.match(layout, /export const rowAuthorLinkStyle: CSSProperties = \{\n  \.\.\.rowMainLinkStyle,/);
  assert.match(work, /export const actionSheetSelectionDotActiveStyle: CSSProperties = \{\n  \.\.\.actionSheetSelectionDotStyle,/);
  assert.match(work, /export const listDiaryActionSheetReportStyle: CSSProperties = \{\n  \.\.\.actionSheetButtonStyle,/);
  assert.match(work, /export const listDiaryAnnotationCancelStyle: CSSProperties = \{\n  \.\.\.listDiaryAnnotationSaveStyle,/);
  assert.match(diary, /import \{ rowTitleStyle \} from "\.\/listas-layout-styles";/);
  assert.match(diary, /export const listDiaryProfileTitleStyle: CSSProperties = \{\n  \.\.\.rowTitleStyle,/);
  assert.match(diary, /export const desktopCommentsSheetStyle: CSSProperties = \{\n  \.\.\.commentsSheetStyle,/);
  assert.match(diary, /export const commentReplyAvatarLinkStyle: CSSProperties = \{\n  \.\.\.commentAvatarLinkStyle,/);
});

test("helpers de avatar preservam trim, fundo, cor e fallback do estilo base", () => {
  assert.match(diary, /const avatarLimpo = avatar\.trim\(\);/);
  assert.match(diary, /\.\.\.listDiaryProfileAvatarStyle,/);
  assert.match(diary, /backgroundImage: `url\(\$\{avatarLimpo\}\)`,/);
  assert.match(diary, /backgroundSize: "cover",/);
  assert.match(diary, /backgroundPosition: "center",/);
  assert.match(diary, /color: "transparent",/);
  assert.match(diary, /: listDiaryProfileAvatarStyle;/);
  assert.match(diary, /\.\.\.estiloBase,/);
  assert.match(diary, /: estiloBase;/);
});

test("modulos de estilo permanecem puros e sem dados, hooks ou persistencia", () => {
  for (const source of [layout, work, diary]) {
    assert.doesNotMatch(
      source,
      /supabase|useState|useEffect|useMemo|localStorage|sessionStorage|\.insert\(|\.update\(|\.delete\(|\.rpc\(/,
    );
  }
});
