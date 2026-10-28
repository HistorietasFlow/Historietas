import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const componentPath = new URL(
  "../../app/em-breve/components/em-breve-about-notice.tsx",
  import.meta.url,
);
const pagePath = new URL("../../app/em-breve/page.tsx", import.meta.url);

test("Em Breve delega somente o rodapé visual Sobre o aviso", async () => {
  const [component, page] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(component, /export function EmBreveAboutNotice/);
  assert.match(component, /visivel: boolean/);
  assert.match(component, /\{visivel && \(/);
  assert.match(component, /Sobre o aviso/);
  assert.match(component, /margin: "12px 0 0"/);
  assert.match(component, /color: "#FFFFFF"/);
  assert.match(component, /fontSize: "12px"/);
  assert.match(component, /fontWeight: 800/);
  assert.match(component, /textAlign: "center"/);

  assert.doesNotMatch(
    component,
    /supabase|useEffect|useState|localStorage|MutationObserver|<Link\b|router|\.insert\(|\.delete\(/i,
  );

  assert.match(
    page,
    /import \{ EmBreveAboutNotice \} from "\.\/components\/em-breve-about-notice";/,
  );
  assert.match(page, /<EmBreveAboutNotice\s+[\s\S]*?visivel=\{outrasObrasEmBreve\.length > 0\}/);
  assert.doesNotMatch(page, /Sobre o aviso/);
  assert.match(page, /<EmBreveWorksSection/);
  assert.match(page, /<EmBreveEmptyState/);
  assert.match(page, /async function salvarLancamento/);
  assert.match(page, /useEffect\(\(\) =>/);
});
