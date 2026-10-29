import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL(
  "../../app/perfil-autor/top-5/components/top5-selected-list.tsx",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente a lista controlada de obras selecionadas", async () => {
  const [component, page] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(component, /export function Top5SelectedList/);
  assert.match(component, /import type \{ ObraTop5 \} from "\.\.\/lib\/top5-types";/);
  assert.match(component, /import \{ TOP_FIVE_MAXIMO \} from "\.\.\/lib\/top5-selection-storage";/);
  assert.match(component, /import \{ criarChaveObraTop5 \} from "\.\.\/lib\/top5-work-identifiers";/);
  assert.match(component, /import \{ criarCapaSelecionadaTop5Style \} from "\.\.\/lib\/top5-cover-styles";/);

  for (const styleName of [
    "emptySelectedSlotStyle",
    "selectedActionsStyle",
    "selectedListStyle",
    "selectedMoveButtonStyle",
    "selectedNumberStyle",
    "selectedRemoveButtonStyle",
    "selectedSlotStyle",
  ]) {
    assert.match(
      component,
      new RegExp(`import[\\s\\S]*${styleName}[\\s\\S]*top5-selected-section-styles`),
    );
    assert.doesNotMatch(page, new RegExp(styleName));
  }

  for (const prop of [
    "obrasSelecionadas: ObraTop5[];",
    "onRemover: (chave: string) => void;",
    "onMover: (chave: string, direcao: -1 | 1) => void;",
  ]) {
    assert.ok(component.includes(prop), `preserva ${prop}`);
  }

  assert.match(component, /Array\.from\(\{ length: TOP_FIVE_MAXIMO \}\)\.map/);
  assert.match(component, /const obra = obrasSelecionadas\[index\];/);
  assert.match(
    component,
    /const chave = obra \? criarChaveObraTop5\(obra\) : "";/,
  );

  for (const value of [
    "onRemover(chave)",
    "onMover(chave, -1)",
    "onMover(chave, 1)",
    "Remover ${obra.titulo} do TOP 5",
    "Subir ${obra.titulo}",
    "Descer ${obra.titulo}",
    "disabled={index === 0}",
    "index === obrasSelecionadas.length - 1",
    "×",
    "↑",
    "↓",
    ">+</div>",
  ]) {
    assert.ok(component.includes(value), `preserva ${value}`);
  }

  assert.match(
    page,
    /import \{ Top5SelectedList \} from "\.\/components\/top5-selected-list";/,
  );
  assert.match(
    page,
    /<Top5SelectedHeader[\s\S]*?\/>\s*<Top5SelectedList\s+obrasSelecionadas=\{obrasSelecionadas\}\s+onRemover=\{removerSelecionadaTop5\}\s+onMover=\{moverSelecionadaTop5\}\s+\/>/,
  );
  assert.match(page, /function removerSelecionadaTop5\(chave: string\)/);
  assert.match(page, /function moverSelecionadaTop5\(chave: string, direcao: -1 \| 1\)/);
  assert.match(page, /const obrasSelecionadas = useMemo\(/);
  assert.match(page, /style=\{selectedSectionStyle\}/);
  assert.match(page, /import \{ criarChaveObraTop5 \} from "\.\/lib\/top5-work-identifiers";/);
  assert.doesNotMatch(page, /slot-top-5-/);

  for (const forbidden of [
    "useState",
    "useEffect",
    "supabase",
    "auth",
    "router",
    "localStorage",
    "setMensagem",
    "setIdsSelecionados",
    "removerIdSelecionadoTop5",
    "moverIdSelecionadoTop5",
    "salvarTop5",
  ]) {
    assert.ok(!component.includes(forbidden), `não contém ${forbidden}`);
  }
});
