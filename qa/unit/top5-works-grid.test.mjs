import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL(
  "../../app/perfil-autor/top-5/components/top5-works-grid.tsx",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente o grid controlado de obras disponÃ­veis", async () => {
  const [component, page] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(component, /export function Top5WorksGrid/);
  assert.match(component, /import type \{ ObraTop5 \} from "\.\.\/lib\/top5-types";/);
  assert.match(component, /import \{ criarChaveObraTop5 \} from "\.\.\/lib\/top5-work-identifiers";/);
  assert.match(component, /import \{ criarCapaTop5Style \} from "\.\.\/lib\/top5-cover-styles";/);

  for (const styleName of [
    "worksGridStyle",
    "top5CardStyle",
    "top5CardSelectedStyle",
    "selectedBadgeStyle",
  ]) {
    assert.match(
      component,
      new RegExp(`import[\\s\\S]*${styleName}[\\s\\S]*top5-main-styles`),
    );
  }

  for (const prop of [
    "obras: ObraTop5[];",
    "idsSelecionados: string[];",
    "onAlternar: (obra: ObraTop5) => void;",
  ]) {
    assert.ok(component.includes(prop), `preserva ${prop}`);
  }

  assert.match(component, /obras\.map\(\(obra\) => \{/);
  assert.match(component, /const chave = criarChaveObraTop5\(obra\);/);
  assert.match(component, /idsSelecionados\.indexOf\(chave\) \+ 1/);
  assert.match(component, /const selecionada = posicaoSelecionada > 0;/);
  assert.match(component, /onClick=\{\(\) => onAlternar\(obra\)\}/);
  assert.match(component, /data-historietas-top5-works-grid="true"/);
  assert.match(component, /key=\{`obra-top-5-\$\{chave\}`\}/);
  assert.match(component, /Remover \$\{obra\.titulo\} do TOP 5/);
  assert.match(component, /Adicionar \$\{obra\.titulo\} ao TOP 5/);
  assert.match(
    component,
    /style=\{\s*selecionada\s*\? top5CardSelectedStyle\s*: top5CardStyle\s*\}/,
  );
  assert.match(component, /criarCapaTop5Style\(obra\.capa\)/);
  assert.match(component, /\{selecionada && \(/);
  assert.match(component, /\{posicaoSelecionada\}/);

  assert.match(
    page,
    /import \{ Top5WorksSection \} from "\.\/components\/top5-works-section";/,
  );
  assert.match(
    page,
    /<Top5WorksSection\s+carregando=\{carregando\}\s+obras=\{obrasFiltradas\}\s+idsSelecionados=\{idsSelecionados\}\s+onAlternar=\{alternarObraTop5\}\s+\/>/,
  );
  assert.match(page, /function alternarObraTop5\(obra: ObraTop5\)/);
  assert.match(page, /const obrasFiltradas = useMemo\(/);
  assert.doesNotMatch(page, /Top5WorksGrid/);
  assert.doesNotMatch(page, /Top5LoadingMessage/);
  assert.doesNotMatch(page, /Top5EmptyWorksMessage/);
  assert.doesNotMatch(page, /gridSectionStyle/);
  assert.doesNotMatch(page, /data-historietas-top5-works-grid/);
  assert.doesNotMatch(page, /obrasFiltradas\.map\(\(obra\) =>/);

  for (const forbidden of [
    "useState",
    "useEffect",
    "useMemo",
    "supabase",
    "auth",
    "router",
    "localStorage",
    "setIdsSelecionados",
    "filtrarObrasTop5",
    "Top5LoadingMessage",
    "Top5EmptyWorksMessage",
    "alternarIdSelecionadoTop5",
  ]) {
    assert.ok(!component.includes(forbidden), `nÃ£o contÃ©m ${forbidden}`);
  }
});
