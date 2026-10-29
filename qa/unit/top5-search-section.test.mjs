import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL(
  "../../app/perfil-autor/top-5/components/top5-search-section.tsx",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente a barra de busca controlada", async () => {
  const [component, page] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(
    component,
    /import \{[\s\S]*searchIconStyle,[\s\S]*searchInputStyle,[\s\S]*searchSectionStyle,[\s\S]*searchShellStyle,[\s\S]*from "\.\.\/lib\/top5-search-feedback-styles";/,
  );
  assert.match(component, /export function Top5SearchSection/);
  assert.match(component, /busca: string;/);
  assert.match(component, /onBuscaChange: \(valor: string\) => void;/);

  for (const value of [
    "Buscar obras",
    "buscar-obra-top-5",
    "Pesquisar obra, autor, gênero ou tag",
    "⌕",
    "value={busca}",
    "onBuscaChange(event.target.value)",
    'autoComplete="off"',
    'autoCorrect="off"',
    "spellCheck={false}",
    "maxLength={90}",
    'type="text"',
    "searchSectionStyle",
    "searchShellStyle",
    "searchIconStyle",
    "searchInputStyle",
  ]) {
    assert.ok(component.includes(value), `preserva ${value}`);
  }

  assert.match(
    page,
    /import \{ Top5SearchSection \} from "\.\/components\/top5-search-section";/,
  );
  assert.match(
    page,
    /<Top5SearchSection busca=\{busca\} onBuscaChange=\{setBusca\} \/>/,
  );
  assert.doesNotMatch(page, /<input\s+id="buscar-obra-top-5"/);
  assert.match(page, /const \[busca, setBusca\] = useState\(""\);/);
  assert.match(
    page,
    /\(\) => filtrarObrasTop5\(obras, idsSelecionados, busca\),\s*\[busca, idsSelecionados, obras\],/,
  );

  for (const searchStyle of [
    "searchSectionStyle",
    "searchShellStyle",
    "searchIconStyle",
    "searchInputStyle",
  ]) {
    assert.doesNotMatch(
      page,
      new RegExp(`import[\\s\\S]*${searchStyle}[\\s\\S]*top5-search-feedback-styles`),
    );
  }

  for (const forbidden of [
    "useState",
    "useEffect",
    "supabase",
    "auth",
    "router",
    "localStorage",
    "ObraTop5",
    "filtrarObrasTop5",
    "useMemo",
  ]) {
    assert.doesNotMatch(component, new RegExp(forbidden));
  }
});
