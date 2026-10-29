import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const modulePath = path.join(root, "app/explorar/lib/explorar-storage-keys.ts");
const pagePath = path.join(root, "app/explorar/page.tsx");

test("as chaves de storage são exportadas com os valores e call sites atuais", async () => {
  const [source, page] = await Promise.all([
    readFile(modulePath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(
    source,
    /export const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";/,
  );
  assert.match(
    source,
    /export const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";/,
  );
  assert.match(
    page,
    /import \{\r?\n  COMPLETED_STORAGE_KEY,\r?\n  FAVORITES_STORAGE_KEY,\r?\n\} from "\.\/lib\/explorar-storage-keys";/,
  );
  assert.doesNotMatch(page, /^const FAVORITES_STORAGE_KEY/m);
  assert.doesNotMatch(page, /^const COMPLETED_STORAGE_KEY/m);
  assert.match(
    page,
    /useExplorarInitialLoad\(\{[\s\S]*?FAVORITES_STORAGE_KEY,[\s\S]*?COMPLETED_STORAGE_KEY,[\s\S]*?\}\);/,
  );
});
