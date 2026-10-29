import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL(
  "../../app/perfil-autor/top-5/components/top5-status-message.tsx",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente a mensagem de status apresentacional", async () => {
  const [component, page] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(
    component,
    /import \{ messageStyle \} from "\.\.\/lib\/top5-search-feedback-styles";/,
  );
  assert.match(component, /export function Top5StatusMessage/);
  assert.match(component, /mensagem: string;/);

  for (const value of [
    'role="status"',
    'aria-live="polite"',
    "style={messageStyle}",
    "{mensagem}",
  ]) {
    assert.ok(component.includes(value), `preserva ${value}`);
  }

  assert.match(
    page,
    /import \{ Top5StatusMessage \} from "\.\/components\/top5-status-message";/,
  );
  assert.match(
    page,
    /\{mensagem && \(\s*<Top5StatusMessage mensagem=\{mensagem\} \/>\s*\)\}/,
  );
  assert.doesNotMatch(page, /<p role="status" aria-live="polite" style=\{messageStyle\}>/);
  assert.match(page, /const \[mensagem, setMensagem\] = useState\(""\);/);
  assert.ok(
    (page.match(/setMensagem\(/g) || []).length >= 5,
    "preserva os setters de mensagem na página",
  );
  assert.doesNotMatch(
    page,
    /import \{[\s\S]*messageStyle[\s\S]*top5-search-feedback-styles/,
  );

  for (const forbidden of [
    "useState",
    "useEffect",
    "supabase",
    "auth",
    "router",
    "localStorage",
    "setMensagem",
    "carregar",
    "salvar",
  ]) {
    assert.doesNotMatch(component, new RegExp(forbidden));
  }
});
