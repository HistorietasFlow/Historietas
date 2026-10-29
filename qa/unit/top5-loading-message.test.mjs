import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL(
  "../../app/perfil-autor/top-5/components/top5-loading-message.tsx",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente o indicador apresentacional de carregamento", async () => {
  const [component, page] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(
    component,
    /import \{ loadingStyle \} from "\.\.\/lib\/top5-search-feedback-styles";/,
  );
  assert.match(component, /export function Top5LoadingMessage\(\)/);

  for (const value of [
    'role="status"',
    'aria-live="polite"',
    "style={loadingStyle}",
    "Carregando obras...",
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
  assert.doesNotMatch(page, /Carregando obras\.\.\./);
  assert.doesNotMatch(page, /<p role="status" aria-live="polite" style=\{loadingStyle\}>/);
  assert.match(page, /const \[carregando, setCarregando\] = useState\(true\);/);
  assert.match(page, /setCarregando\(true\);/);
  assert.match(page, /setCarregando\(false\);/);
  assert.doesNotMatch(page, /Top5LoadingMessage/);
  assert.doesNotMatch(page, /top5-search-feedback-styles/);

  for (const forbidden of [
    "useState",
    "useEffect",
    "supabase",
    "auth",
    "router",
    "localStorage",
    "set",
    "carregar",
    "props",
    "if (",
    "?",
    "Obra",
  ]) {
    assert.ok(!component.includes(forbidden), `não contém ${forbidden}`);
  }
});
