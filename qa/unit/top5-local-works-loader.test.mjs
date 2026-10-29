import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const loaderPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-local-works-loader.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente o carregamento local de obras", async () => {
  const [loader, page] = await Promise.all([
    readFile(loaderPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(loader, /import \{ lerStorageUsuarioTop5 \} from "\.\/top5-storage-utils";/);
  assert.match(loader, /import \{ normalizarObraLocalTop5 \} from "\.\/top5-work-normalizers";/);
  assert.match(loader, /ObraTop5,/);
  assert.match(loader, /ObraTop5Salva,/);
  assert.match(loader, /const STORAGE_KEY = "historietas-obras";/);
  assert.match(loader, /export function carregarObrasLocaisTop5/);
  assert.match(loader, /userId\.trim\(\)/);
  assert.match(loader, /typeof window === "undefined"/);
  assert.match(loader, /lerStorageUsuarioTop5\(STORAGE_KEY, userIdLimpo\)/);
  assert.match(loader, /JSON\.parse\(texto\)/);
  assert.match(loader, /Array\.isArray\(obrasSalvas\)/);
  assert.match(loader, /normalizarObraLocalTop5\(/);
  assert.match(loader, /obra as ObraTop5Salva/);
  assert.match(loader, /obra, index/);
  assert.match(loader, /\[\] as ObraTop5\[\]/);

  assert.match(
    page,
    /import \{ carregarObrasLocaisTop5 \} from "\.\/lib\/top5-local-works-loader";/,
  );
  assert.doesNotMatch(page, /const STORAGE_KEY =/);
  assert.doesNotMatch(page, /function carregarObrasLocaisTop5/);
  assert.match(page, /carregarObrasLocaisTop5\(userId\)/);
  assert.doesNotMatch(page, /async function carregarObrasSupabaseTop5/);
  assert.match(page, /carregarObrasSupabaseTop5\(\)/);
  assert.match(page, /function mesclarObrasTop5/);

  for (const forbidden of [
    "react",
    "useEffect",
    "supabase",
    "auth",
    "useRouter",
    "TOP_FIVE_MAXIMO",
    "top5-selection-storage",
    "style={",
    "18+",
  ]) {
    assert.doesNotMatch(
      loader,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
