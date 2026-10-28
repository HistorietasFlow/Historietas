import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL(
  "../../app/em-breve/components/em-breve-empty-state.tsx",
  import.meta.url,
);
const pagePath = new URL("../../app/em-breve/page.tsx", import.meta.url);

test("Em Breve delega somente o estado visual vazio ao componente dedicado", async () => {
  const [component, page] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(component, /import \{ accessMessageStyle \} from "\.\.\/lib\/em-breve-styles";/);
  assert.match(component, /export function EmBreveEmptyState/);
  assert.match(component, /avisoAcesso/);
  assert.match(component, /nomeObra/);
  assert.match(component, /avisoAcesso &&/);
  assert.match(component, /style=\{accessMessageStyle\}/);
  assert.match(component, /Essa obra ainda não está disponível/);
  assert.match(component, /Ainda não há lançamentos em breve/);
  assert.match(component, /margin: "10px 0 0"/);
  assert.match(component, /color: "#FFFFFF"/);
  assert.match(component, /fontSize: "12px"/);
  assert.match(component, /fontWeight: 800/);
  assert.match(component, /textAlign: "center"/);

  assert.match(
    page,
    /import \{ EmBreveEmptyState \} from "\.\/components\/em-breve-empty-state";/,
  );
  assert.match(page, /<EmBreveEmptyState/);
  assert.match(page, /avisoAcesso=\{avisoAcesso\}/);
  assert.match(page, /nomeObra=\{nomeObra\}/);
  assert.doesNotMatch(page, /Essa obra ainda não está disponível/);
  assert.doesNotMatch(page, /Ainda não há lançamentos em breve/);
  assert.match(page, /accessMessageStyle/);
  assert.match(page, /outrasObrasEmBreve\.length > 0/);
  assert.match(page, /Sobre o aviso/);

  assert.doesNotMatch(
    component,
    /supabase|auth|router|localStorage|useEffect|useState|MutationObserver|<Link|\.(?:insert|update|delete|upsert)\(/,
  );
});
