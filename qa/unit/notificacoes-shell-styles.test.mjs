import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const estilos = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-shell-styles.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);

const exportsEsperados = [
  "safeTextStyle",
  "mobileTopWaterFadeStyle",
  "desktopTopWaterFadeStyle",
  "loadingPageStyle",
  "loadingSpinnerStyle",
  "pageStyle",
  "containerStyle",
  "desktopContainerStyle",
  "notificacoesTopFilterBoxStyle",
  "titleHeaderStyle",
  "desktopTitleHeaderStyle",
  "desktopNotificationsTitleStyle",
  "desktopNotificationsTopActionsStyle",
  "desktopNotificationsSearchShellStyle",
  "desktopNotificationsSearchIconStyle",
  "desktopNotificationsSearchInputStyle",
  "desktopNotificationsFilterButtonStyle",
  "mobileSearchToggleStyle",
  "notificacoesHeaderFilterButtonStyle",
  "notificacoesHeaderFilterIconStyle",
  "notificationsControlsStyle",
  "desktopNotificationsControlsStyle",
  "notificationSearchShellStyle",
  "notificationSearchInputStyle",
  "notificationClearButtonStyle",
  "notificationSortingBackdropStyle",
  "notificationSortingSheetStyle",
  "desktopNotificationSortingSheetStyle",
  "notificationSortingHandleStyle",
  "notificationSortingTitleStyle",
  "notificationSortingOptionsListStyle",
  "notificationSortingSectionLabelStyle",
  "notificationSortingOptionStyle",
  "notificationSortingOptionActiveStyle",
  "notificationSortingOptionRadioStyle",
  "notificationSortingOptionRadioActiveStyle",
  "notificationActionsSheetStyle",
  "desktopNotificationActionsSheetStyle",
  "notificationActionsOptionStyle",
  "notificationActionsOptionLinkStyle",
  "notificationActionsOptionDisabledStyle",
  "notificationActionsDangerOptionStyle",
  "notificationActionsDangerOptionDisabledStyle",
];

test("shell de estilos exporta os contratos visuais de Notificações", () => {
  for (const nome of exportsEsperados) {
    assert.match(estilos, new RegExp(`export const ${nome}: CSSProperties`));
  }

  for (const contrato of [
    'overflowWrap: "anywhere"',
    'wordBreak: "break-word"',
    'animation: "historietas-loading-spin 0.78s linear infinite"',
    'background: "var(--historietas-notificacoes-bg-page, #000000)"',
    'height: "min(620px, 68vh)"',
    'width: "min(560px, calc(100vw - 24px))"',
    'zIndex: 2147483647',
    "...safeTextStyle,",
    "...notificationSortingSheetStyle,",
    "...desktopNotificationSortingSheetStyle,",
  ]) {
    assert.ok(estilos.includes(contrato), `contrato ausente: ${contrato}`);
  }
});

test("página consome o shell extraído sem redefinir estilos", () => {
  assert.match(
    pagina,
    /from "\.\/lib\/notificacoes-shell-styles";/,
  );

  for (const nome of exportsEsperados) {
    assert.doesNotMatch(
      pagina,
      new RegExp(`const ${nome}: CSSProperties =`),
    );
  }
});

test("módulo visual não carrega runtime, efeitos ou persistência", () => {
  for (const proibido of ["useEffect", "useState", "supabase", "localStorage", "window", "document", "<"]) {
    assert.ok(!estilos.includes(proibido), `referência indevida: ${proibido}`);
  }
});
