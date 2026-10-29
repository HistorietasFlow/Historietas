import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL(
  "../../app/perfil-autor/top-5/components/top5-selected-section.tsx",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente a composição controlada das obras selecionadas", async () => {
  const [component, page] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(component, /export function Top5SelectedSection/);
  assert.match(component, /import \{ Top5SelectedHeader \} from "\.\/top5-selected-header";/);
  assert.match(component, /import \{ Top5SelectedList \} from "\.\/top5-selected-list";/);
  assert.match(component, /import \{ selectedSectionStyle \} from "\.\.\/lib\/top5-selected-section-styles";/);
  assert.match(component, /import type \{ ObraTop5 \} from "\.\.\/lib\/top5-types";/);

  for (const prop of [
    "salvando: boolean;",
    "salvarDesabilitado: boolean;",
    "obrasSelecionadas: ObraTop5[];",
    "onSalvar: () => void;",
    "onRemover: (chave: string) => void;",
    "onMover: (chave: string, direcao: -1 | 1) => void;",
  ]) {
    assert.ok(component.includes(prop), `preserva ${prop}`);
  }

  assert.ok(component.includes('aria-label="Obras escolhidas para o TOP 5"'));
  assert.match(
    component,
    /<Top5SelectedHeader\s+salvando=\{salvando\}\s+salvarDesabilitado=\{salvarDesabilitado\}\s+onSalvar=\{onSalvar\}\s+\/>/,
  );
  assert.match(
    component,
    /<Top5SelectedList\s+obrasSelecionadas=\{obrasSelecionadas\}\s+onRemover=\{onRemover\}\s+onMover=\{onMover\}\s+\/>/,
  );

  assert.match(
    page,
    /import \{ Top5SelectedSection \} from "\.\/components\/top5-selected-section";/,
  );
  assert.match(
    page,
    /<Top5SelectedSection\s+salvando=\{salvando\}\s+salvarDesabilitado=\{salvando \|\| !usuario\?\.id\}\s+obrasSelecionadas=\{obrasSelecionadas\}\s+onSalvar=\{salvarEscolhasTop5\}\s+onRemover=\{removerSelecionadaTop5\}\s+onMover=\{moverSelecionadaTop5\}\s+\/>/,
  );
  assert.match(page, /function salvarEscolhasTop5\(\)/);
  assert.match(page, /function removerSelecionadaTop5\(chave: string\)/);
  assert.match(page, /function moverSelecionadaTop5\(chave: string, direcao: -1 \| 1\)/);
  assert.match(page, /const obrasSelecionadas = useMemo\(/);
  assert.match(page, /const \[usuario, setUsuario\] = useState<UsuarioTop5 \| null>\(null\);/);
  assert.doesNotMatch(page, /Top5SelectedHeader/);
  assert.doesNotMatch(page, /Top5SelectedList/);
  assert.doesNotMatch(page, /selectedSectionStyle/);

  for (const forbidden of [
    "useState",
    "useEffect",
    "useMemo",
    "supabase",
    "auth",
    "router",
    "localStorage",
    "setMensagem",
    "setIdsSelecionados",
    "persistirSelecaoTop5",
    "filtrarObrasTop5",
  ]) {
    assert.ok(!component.includes(forbidden), `nÃ£o contÃ©m ${forbidden}`);
  }
});
