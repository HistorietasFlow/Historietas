import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL(
  "../../app/perfil-autor/top-5/components/top5-works-section.tsx",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente a composiÃ§Ã£o controlada das obras disponÃ­veis", async () => {
  const [component, page] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(component, /export function Top5WorksSection/);
  assert.match(component, /import \{ Top5LoadingMessage \} from "\.\/top5-loading-message";/);
  assert.match(component, /import \{ Top5WorksGrid \} from "\.\/top5-works-grid";/);
  assert.match(component, /import \{ Top5EmptyWorksMessage \} from "\.\/top5-empty-works-message";/);
  assert.match(component, /import \{ gridSectionStyle \} from "\.\.\/lib\/top5-main-styles";/);
  assert.match(component, /import type \{ ObraTop5 \} from "\.\.\/lib\/top5-types";/);

  for (const prop of [
    "carregando: boolean;",
    "obras: ObraTop5[];",
    "idsSelecionados: string[];",
    "onAlternar: (obra: ObraTop5) => void;",
  ]) {
    assert.ok(component.includes(prop), `preserva ${prop}`);
  }

  assert.ok(component.includes('aria-label="Lista de obras disponíveis"'));
  assert.match(component, /\{carregando && \(\s*<Top5LoadingMessage \/>\s*\)\}/);
  assert.match(component, /\{!carregando && \(/);
  assert.match(component, /obras\.length > 0 \? \(/);
  assert.match(
    component,
    /<Top5WorksGrid\s+obras=\{obras\}\s+idsSelecionados=\{idsSelecionados\}\s+onAlternar=\{onAlternar\}\s+\/>/,
  );
  assert.match(component, /<Top5EmptyWorksMessage \/>/);

  assert.match(
    page,
    /import \{ Top5WorksSection \} from "\.\/components\/top5-works-section";/,
  );
  assert.match(
    page,
    /<Top5WorksSection\s+carregando=\{carregando\}\s+obras=\{obrasFiltradas\}\s+idsSelecionados=\{idsSelecionados\}\s+onAlternar=\{alternarObraTop5\}\s+\/>/,
  );
  assert.match(page, /const obrasFiltradas = useMemo\(/);
  assert.match(page, /\(\) => filtrarObrasTop5\(obras, idsSelecionados, busca\)/);
  assert.match(page, /function alternarObraTop5\(obra: ObraTop5\)/);
  assert.match(page, /const \[carregando, setCarregando\] = useState\(true\);/);
  assert.match(page, /const \[idsSelecionados, setIdsSelecionados\] = useState<string\[\]>\(\[\]\);/);

  for (const directImport of [
    "Top5LoadingMessage",
    "Top5WorksGrid",
    "Top5EmptyWorksMessage",
    "gridSectionStyle",
  ]) {
    assert.doesNotMatch(page, new RegExp(directImport));
  }

  for (const forbidden of [
    "useState",
    "useEffect",
    "useMemo",
    "supabase",
    "auth",
    "router",
    "localStorage",
    "set",
    "filtrarObrasTop5",
    "alternarIdSelecionadoTop5",
    "persistirSelecaoTop5",
  ]) {
    assert.ok(!component.includes(forbidden), `nÃ£o contÃ©m ${forbidden}`);
  }
});
