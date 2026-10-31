import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const normalizerPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-selection-normalizer.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);
const selectedListPath = new URL(
  "../../app/perfil-autor/top-5/components/top5-selected-list.tsx",
  import.meta.url,
);

test("Top 5 delega somente a normalização pura da seleção", async () => {
  const [normalizer, page, selectedList] = await Promise.all([
    readFile(normalizerPath, "utf8"),
    readFile(pagePath, "utf8"),
    readFile(selectedListPath, "utf8"),
  ]);

  assert.match(normalizer, /criarChaveObraTop5,/);
  assert.match(normalizer, /obterIdentificadoresObraTop5,/);
  assert.match(normalizer, /import \{ TOP_FIVE_MAXIMO \} from "\.\/top5-selection-storage";/);
  assert.match(normalizer, /import type \{ ObraTop5 \} from "\.\/top5-types";/);
  assert.match(normalizer, /export function normalizarIdsSelecionadosTop5/);
  assert.match(normalizer, /new Map<string, ObraTop5>\(\)/);
  assert.match(normalizer, /obterIdentificadoresObraTop5\(obra\)/);
  assert.match(normalizer, /id\.trim\(\)/);
  assert.match(normalizer, /criarChaveObraTop5\(obra\)/);
  assert.match(normalizer, /new Set<string>\(\)/);
  assert.match(normalizer, /chavesUsadas\.has\(chaveCanonica\)/);
  assert.match(normalizer, /chavesUsadas\.add\(chaveCanonica\);\s*idsNormalizados\.push\(chaveCanonica\)/);
  assert.match(normalizer, /idsNormalizados\.slice\(0, TOP_FIVE_MAXIMO\)/);

  assert.match(
    page,
    /import \{ persistirSelecaoTop5 \} from "\.\/lib\/top5-selection-save";/,
  );
  assert.doesNotMatch(page, /function normalizarIdsSelecionadosTop5/);
  assert.doesNotMatch(page, /normalizarIdsSelecionadosTop5\(/);
  assert.doesNotMatch(page, /TOP_FIVE_MAXIMO/);
  assert.match(
    selectedList,
    /import \{ TOP_FIVE_MAXIMO \} from "\.\.\/lib\/top5-selection-storage";/,
  );
  assert.match(
    page,
    /import \{ useTop5InitialLoad \} from "\.\/hooks\/use-top5-initial-load";/,
  );
  assert.doesNotMatch(page, /prepararConteudoInicialTop5\(/);
  assert.match(
    page,
    /import \{\s*criarMapaObrasTop5,\s*selecionarObrasTop5,\s*\} from "\.\/lib\/top5-work-selectors";/,
  );
  assert.doesNotMatch(page, /obterIdentificadoresObraTop5/);

  for (const forbidden of [
    "react",
    "useEffect",
    "supabase",
    "auth",
    "useRouter",
    "localStorage",
    "carregarObras",
    "style={",
    "<div",
  ]) {
    assert.doesNotMatch(
      normalizer,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
