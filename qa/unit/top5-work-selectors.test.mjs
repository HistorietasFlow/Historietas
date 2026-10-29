import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const selectorsPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-work-selectors.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente os seletores puros de obras", async () => {
  const [selectors, page] = await Promise.all([
    readFile(selectorsPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(
    selectors,
    /import \{ obterIdentificadoresObraTop5 \} from "\.\/top5-work-identifiers";/,
  );
  assert.match(selectors, /import type \{ ObraTop5 \} from "\.\/top5-types";/);
  assert.match(selectors, /export function criarMapaObrasTop5/);
  assert.match(selectors, /export function selecionarObrasTop5/);
  assert.match(selectors, /new Map<string, ObraTop5>\(\)/);
  assert.match(selectors, /obterIdentificadoresObraTop5\(obra\)/);
  assert.match(selectors, /mapa\.set\(chave, obra\)/);
  assert.match(selectors, /return mapa;/);
  assert.match(selectors, /idsSelecionados\s*\.map\(/);
  assert.match(selectors, /obrasPorChave\.get\(id\)/);
  assert.match(
    selectors,
    /\(obra\): obra is ObraTop5 =>\s*Boolean\(obra\)/,
  );

  assert.match(
    page,
    /import \{\s*criarMapaObrasTop5,\s*selecionarObrasTop5,\s*\} from "\.\/lib\/top5-work-selectors";/s,
  );
  assert.match(
    page,
    /const obrasPorChave = useMemo\(\s*\(\) => criarMapaObrasTop5\(obras\),\s*\[obras\],\s*\);/s,
  );
  assert.match(
    page,
    /const obrasSelecionadas = useMemo\(\s*\(\) =>\s*selecionarObrasTop5\(\s*idsSelecionados,\s*obrasPorChave,\s*\),\s*\[idsSelecionados, obrasPorChave\],\s*\);/s,
  );
  assert.doesNotMatch(page, /new Map<string, ObraTop5>\(\)/);
  assert.doesNotMatch(page, /obrasPorChave\.get\(id\)/);
  assert.doesNotMatch(page, /obterIdentificadoresObraTop5/);
  assert.match(page, /criarChaveObraTop5/);

  for (const forbidden of [
    "react",
    "useMemo",
    "supabase",
    "auth",
    "useRouter",
    "localStorage",
    "carregarObras",
    ".insert(",
    ".delete(",
    "<div",
    "CSSProperties",
  ]) {
    assert.doesNotMatch(
      selectors,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
