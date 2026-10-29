import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL(
  "../../app/perfil-autor/top-5/components/top5-login-notice.tsx",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente o aviso apresentacional de login", async () => {
  const [component, page] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(component, /import Link from "next\/link";/);
  assert.match(
    component,
    /import \{[\s\S]*loginButtonStyle,[\s\S]*noticeStyle,[\s\S]*noticeTextStyle,[\s\S]*noticeTitleStyle,[\s\S]*from "\.\.\/lib\/top5-search-feedback-styles";/,
  );
  assert.match(component, /export function Top5LoginNotice/);

  for (const value of [
    "Entre para salvar seu TOP 5",
    "Você pode ver as obras, mas precisa estar logado para salvar suas escolhas.",
    "/login?redirectTo=/perfil-autor/top-5",
    "Entrar",
    "noticeStyle",
    "noticeTitleStyle",
    "noticeTextStyle",
    "loginButtonStyle",
  ]) {
    assert.ok(component.includes(value), `preserva ${value}`);
  }

  assert.match(
    page,
    /import \{ Top5LoginNotice \} from "\.\/components\/top5-login-notice";/,
  );
  assert.match(
    page,
    /\{!usuario && !carregando && \(\s*<Top5LoginNotice \/>\s*\)\}/,
  );
  assert.doesNotMatch(page, /Entre para salvar seu TOP 5/);
  assert.doesNotMatch(page, /\/login\?redirectTo=\/perfil-autor\/top-5/);
  assert.match(page, /import Link from "next\/link";/);
  assert.match(page, /<Link href="\/perfil-autor" style=\{cancelButtonStyle\}>/);
  assert.match(page, /loadingStyle/);
  assert.match(page, /messageStyle/);

  for (const noticeStyleName of [
    "loginButtonStyle",
    "noticeStyle",
    "noticeTextStyle",
    "noticeTitleStyle",
  ]) {
    assert.doesNotMatch(
      page,
      new RegExp(`import[\\s\\S]*${noticeStyleName}[\\s\\S]*top5-search-feedback-styles`),
    );
  }

  for (const forbidden of [
    "useState",
    "useEffect",
    "supabase",
    "auth",
    "router",
    "localStorage",
    "set",
    "UsuarioTop5",
    "carregando",
  ]) {
    assert.doesNotMatch(component, new RegExp(forbidden));
  }
});
