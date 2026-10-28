import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL(
  "../../app/em-breve/components/em-breve-water-fade.tsx",
  import.meta.url,
);
const pagePath = new URL("../../app/em-breve/page.tsx", import.meta.url);

test("Em Breve delega somente as camadas responsivas de water fade", async () => {
  const [component, page] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(component, /desktopTopWaterFadeStyle/);
  assert.match(component, /mobileTopWaterFadeStyle/);
  assert.match(component, /export function EmBreveWaterFade/);
  assert.match(component, /desktopLayout/);
  assert.match(component, /desktopLayout &&/);
  assert.match(component, /!desktopLayout &&/);
  assert.match(component, /style=\{desktopTopWaterFadeStyle\}/);
  assert.match(component, /style=\{mobileTopWaterFadeStyle\}/);
  assert.equal((component.match(/aria-hidden="true"/g) || []).length, 2);

  assert.match(
    page,
    /import \{ EmBreveWaterFade \} from "\.\/components\/em-breve-water-fade";/,
  );
  assert.match(page, /<EmBreveWaterFade desktopLayout=\{desktopLayout\} \/>/);
  assert.doesNotMatch(page, /desktopTopWaterFadeStyle/);
  assert.doesNotMatch(page, /mobileTopWaterFadeStyle/);
  assert.match(
    page,
    /<EmBreveLanguageBridge \/>\s*<EmBreveWaterFade desktopLayout=\{desktopLayout\} \/>\s*<section style=\{desktopLayout \? desktopContainerStyle : containerStyle\}>/,
  );

  assert.doesNotMatch(
    component,
    /supabase|auth|router|localStorage|useEffect|useState|MutationObserver|<Link|\.(?:insert|update|delete|upsert)\(/,
  );
});
