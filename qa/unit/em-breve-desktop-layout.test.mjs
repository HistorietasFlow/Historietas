import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const hookPath = new URL(
  "../../app/em-breve/hooks/use-em-breve-desktop-layout.ts",
  import.meta.url,
);
const pagePath = new URL("../../app/em-breve/page.tsx", import.meta.url);

test("Em Breve delega a detecção desktop ao hook dedicado", async () => {
  const hook = await readFile(hookPath, "utf8");
  const page = await readFile(pagePath, "utf8");

  assert.match(hook, /import \{ useEffect, useState \} from "react"/);
  assert.match(hook, /export function useEmBreveDesktopLayout/);
  for (const trecho of [
    "useState(false)",
    "window.matchMedia",
    '"(min-width: 900px)"',
    "window.setTimeout",
    "window.clearTimeout",
    "addEventListener",
    "removeEventListener",
    "addListener",
    "removeListener",
    '"change"',
    "consultaDesktop.matches",
    "}, []);",
    "return desktopLayout;",
  ]) {
    assert.ok(hook.includes(trecho), `mantém ${trecho}`);
  }

  assert.match(
    page,
    /import \{ useEmBreveDesktopLayout \} from "\.\/hooks\/use-em-breve-desktop-layout"/,
  );
  assert.match(page, /const desktopLayout = useEmBreveDesktopLayout\(\);/);
  assert.doesNotMatch(page, /function atualizarLayoutDesktop/);
  assert.doesNotMatch(page, /window\.matchMedia\("\(min-width: 900px\)"\)/);
  assert.doesNotMatch(
    hook,
    /supabase|\.from\(|auth|router|localStorage|traduzir|Style|\.(?:insert|update|delete|upsert)\(/,
  );
});
