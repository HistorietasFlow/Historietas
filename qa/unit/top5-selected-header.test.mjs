import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL(
  "../../app/perfil-autor/top-5/components/top5-selected-header.tsx",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente o cabeçalho visual da seleção", async () => {
  const [component, page] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(component, /import Link from "next\/link";/);
  assert.match(component, /export function Top5SelectedHeader/);

  for (const styleName of [
    "cancelButtonStyle",
    "footerActionsStyle",
    "saveButtonDisabledStyle",
    "saveButtonStyle",
    "selectedHeaderStyle",
    "selectedTitleStyle",
  ]) {
    assert.match(
      component,
      new RegExp(`import[\\s\\S]*${styleName}[\\s\\S]*top5-selected-section-styles`),
    );
    assert.doesNotMatch(
      page,
      new RegExp(`import[\\s\\S]*${styleName}[\\s\\S]*top5-selected-section-styles`),
    );
  }

  for (const prop of [
    "salvando: boolean;",
    "salvarDesabilitado: boolean;",
    "onSalvar: () => void;",
  ]) {
    assert.ok(component.includes(prop), `preserva ${prop}`);
  }

  for (const value of [
    "Seu TOP 5",
    "Cancelar",
    "Salvar",
    "Salvando...",
    'href="/perfil-autor"',
    'type="button"',
    "onClick={onSalvar}",
    "disabled={salvarDesabilitado}",
    'salvando ? "Salvando..." : "Salvar"',
  ]) {
    assert.ok(component.includes(value), `preserva ${value}`);
  }
  assert.match(
    component,
    /salvarDesabilitado\s*\? saveButtonDisabledStyle\s*: saveButtonStyle/,
  );

  assert.match(
    page,
    /import \{ Top5SelectedHeader \} from "\.\/components\/top5-selected-header";/,
  );
  assert.match(
    page,
    /<Top5SelectedHeader\s+salvando=\{salvando\}\s+salvarDesabilitado=\{salvando \|\| !usuario\?\.id\}\s+onSalvar=\{salvarEscolhasTop5\}\s+\/>/,
  );
  assert.match(page, /function salvarEscolhasTop5\(\)/);
  assert.match(page, /const \[salvando, setSalvando\] = useState\(false\);/);
  assert.match(page, /const \[usuario, setUsuario\] = useState<UsuarioTop5 \| null>\(null\);/);
  assert.match(
    page,
    /<Top5SelectedHeader[\s\S]*?\/>\s*<Top5SelectedList\s/,
  );
  assert.doesNotMatch(page, /import Link from "next\/link";/);

  for (const forbidden of [
    "useState",
    "useEffect",
    "supabase",
    "auth",
    "UsuarioTop5",
    "router",
    "localStorage",
    "set",
    "slot",
    "ObraTop5",
    "if (",
    "salvarEscolhasTop5",
  ]) {
    assert.ok(!component.includes(forbidden), `não contém ${forbidden}`);
  }
});
