import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const selectionStoragePath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-selection-storage.ts",
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

test("Top 5 delega somente a persistência da seleção", async () => {
  const [selectionStorage, page, selectedList] = await Promise.all([
    readFile(selectionStoragePath, "utf8"),
    readFile(pagePath, "utf8"),
    readFile(selectedListPath, "utf8"),
  ]);

  assert.match(selectionStorage, /import \{[\s\S]*lerStorageUsuarioTop5,[\s\S]*salvarJsonStorageUsuarioTop5,[\s\S]*from "\.\/top5-storage-utils";/);
  assert.match(
    selectionStorage,
    /const TOP_FIVE_STORAGE_KEY = "historietas-top-5-obras";/,
  );
  assert.match(selectionStorage, /export const TOP_FIVE_MAXIMO = 5;/);
  assert.match(selectionStorage, /export function carregarTop5Salvo/);
  assert.match(selectionStorage, /export function salvarTop5/);
  assert.match(selectionStorage, /userId\.trim\(\)/);
  assert.match(selectionStorage, /typeof window === "undefined"/);
  assert.match(selectionStorage, /JSON\.parse\(texto\)/);
  assert.match(selectionStorage, /new Set\(/);
  assert.match(selectionStorage, /id\.trim\(\)/);
  assert.match(selectionStorage, /\.slice\(0, TOP_FIVE_MAXIMO\)/);

  assert.doesNotMatch(page, /TOP_FIVE_MAXIMO/);
  assert.match(
    selectedList,
    /import \{ TOP_FIVE_MAXIMO \} from "\.\.\/lib\/top5-selection-storage";/,
  );
  assert.match(
    page,
    /import \{ persistirSelecaoTop5 \} from "\.\/lib\/top5-selection-save";/,
  );
  assert.doesNotMatch(page, /TOP_FIVE_STORAGE_KEY/);
  assert.doesNotMatch(page, /function carregarTop5Salvo/);
  assert.doesNotMatch(page, /function salvarTop5/);
  assert.doesNotMatch(page, /carregarTop5Salvo\(/);
  assert.doesNotMatch(page, /const STORAGE_KEY = "historietas-obras";/);
  assert.doesNotMatch(page, /function carregarObrasLocaisTop5/);
  assert.doesNotMatch(page, /carregarObrasLocaisTop5\(userId\)/);
  assert.match(page, /prepararConteudoInicialTop5\(\s*userId,\s*obrasSupabase,\s*\)/);
  assert.doesNotMatch(page, /function normalizarIdsSelecionadosTop5/);
  assert.doesNotMatch(page, /normalizarIdsSelecionadosTop5\(/);
  assert.doesNotMatch(page, /salvarTop5\(/);

  for (const forbidden of [
    "react",
    "useEffect",
    "supabase",
    "auth",
    "useRouter",
    "ObraTop5",
    "normalizar",
    "style={",
  ]) {
    assert.doesNotMatch(
      selectionStorage,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }

  assert.doesNotMatch(selectionStorage, /const STORAGE_KEY =/);
});
