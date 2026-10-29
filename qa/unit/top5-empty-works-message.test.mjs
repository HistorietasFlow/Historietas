import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL(
  "../../app/perfil-autor/top-5/components/top5-empty-works-message.tsx",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente o estado visual de lista vazia", async () => {
  const [component, page] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(component, /export function Top5EmptyWorksMessage\(\)/);

  for (const value of [
    "Nenhuma obra encontrada",
    'margin: "10px 0 0"',
    'color: "#FFFFFF"',
    'fontSize: "12px"',
    "fontWeight: 800",
    'textAlign: "center"',
  ]) {
    assert.ok(component.includes(value), `preserva ${value}`);
  }

  assert.match(
    page,
    /import \{ Top5WorksSection \} from "\.\/components\/top5-works-section";/,
  );
  assert.match(
    page,
    /<Top5WorksSection\s+carregando=\{carregando\}\s+obras=\{obrasFiltradas\}\s+idsSelecionados=\{idsSelecionados\}\s+onAlternar=\{alternarObraTop5\}\s+\/>/,
  );
  assert.doesNotMatch(page, /Nenhuma obra encontrada/);
  assert.doesNotMatch(page, /Top5EmptyWorksMessage/);

  for (const forbidden of [
    "useState",
    "useEffect",
    "supabase",
    "auth",
    "router",
    "localStorage",
    "set",
    "props",
    "ObraTop5",
    "if (",
    "?",
    "carregar",
  ]) {
    assert.ok(!component.includes(forbidden), `não contém ${forbidden}`);
  }
});
