import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesPath = new URL(
  "../../app/em-breve/lib/em-breve-styles.ts",
  import.meta.url,
);
const pagePath = new URL("../../app/em-breve/page.tsx", import.meta.url);

test("Em Breve delega os estilos inline para módulo dedicado", async () => {
  const styles = await readFile(stylesPath, "utf8");
  const page = await readFile(pagePath, "utf8");

  assert.match(styles, /import type \{ CSSProperties \} from "react"/);
  assert.match(
    styles,
    /import type \{ ObraEmBreveCard \} from "\.\/em-breve-work-normalizers"/,
  );
  assert.match(page, /from "\.\/lib\/em-breve-styles"/);
  assert.doesNotMatch(page, /: CSSProperties\s*=/);
  assert.doesNotMatch(page, /function criarCoverCardEmBreveStyle/);
  assert.doesNotMatch(page, /import type \{ CSSProperties \} from "react"/);

  for (const nome of [
    "pageStyle",
    "containerStyle",
    "titleHeaderStyle",
    "titleLinkStyle",
    "titleTextStyle",
    "accessMessageStyle",
    "relatedSectionStyle",
    "relatedGridStyle",
    "relatedCardStyle",
    "relatedCoverLinkStyle",
    "relatedContentStyle",
    "relatedTitleStyle",
    "relatedAuthorStyle",
    "relatedSaveButtonStyle",
    "relatedSavedButtonStyle",
    "desktopContainerStyle",
    "desktopRelatedSectionStyle",
    "desktopRelatedGridStyle",
    "desktopRelatedCardStyle",
    "desktopRelatedContentStyle",
    "desktopRelatedBottomRowStyle",
    "safeTextStyle",
    "buttonBaseStyle",
    "relatedCoverStyle",
    "desktopRelatedCoverStyle",
  ]) {
    assert.match(styles, new RegExp(`(?:export )?const ${nome}: CSSProperties`));
  }

  for (const trecho of [
    "desktopLayout ? desktopRelatedCoverStyle : relatedCoverStyle",
    "if (!obra.capa)",
    "backgroundImage: `url(${obra.capa})`",
    'backgroundSize: "cover"',
    'backgroundPosition: "center"',
  ]) {
    assert.ok(styles.includes(trecho), `mantém ${trecho}`);
  }

  assert.doesNotMatch(
    styles,
    /supabase|\.from\(|auth|use(?:Effect|Memo|State)|router|localStorage|MutationObserver|\.(?:insert|update|delete|upsert)\(/,
  );
});
