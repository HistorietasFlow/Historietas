import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const suggestedCard = readFileSync(new URL("../../app/seguindo/components/seguindo-suggested-user-card.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/seguindo/lib/seguindo-suggested-user-action-styles.ts", import.meta.url), "utf8");

test("estilos de seguir e solicitações são extraídos sem alteração de referência", () => {
  assert.match(suggestedCard, /from "\.\.\/lib\/seguindo-suggested-user-action-styles";/);
  for (const name of ["suggestedUserFollowButtonStyle", "suggestedUserRequestPendingButtonStyle", "followRequestContentStyle", "followRequestActionsStyle", "followRequestAcceptButtonStyle", "followRequestDeclineButtonStyle"]) {
    assert.match(styles, new RegExp(`export const ${name}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties =`));
  }
  assert.match(styles, /\.\.\.suggestedUserFollowButtonStyle/);
  assert.match(styles, /\.\.\.followRequestAcceptButtonStyle/);
});
