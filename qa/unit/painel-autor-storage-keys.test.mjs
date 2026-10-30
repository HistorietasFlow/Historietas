import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const keysSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-storage-keys.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const initialDataHookSource = readFileSync(
  new URL(
    "../../app/painel-autor/hooks/use-painel-autor-initial-data.ts",
    import.meta.url,
  ),
  "utf8",
);
const deleteWorkHookSource = readFileSync(
  new URL("../../app/painel-autor/hooks/use-painel-autor-delete-work.ts", import.meta.url),
  "utf8",
);
const keysJavaScript = typescript.transpileModule(keysSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  STORAGE_KEY,
  FOLLOW_STORAGE_KEY,
  FAVORITES_STORAGE_KEY,
  COMPLETED_STORAGE_KEY,
} = await import(
  `data:text/javascript;base64,${Buffer.from(keysJavaScript).toString("base64")}`,
);

test("chaves de armazenamento do Painel do Autor preservam valores e exports", () => {
  assert.equal(STORAGE_KEY, "historietas-obras");
  assert.equal(FOLLOW_STORAGE_KEY, "historietas-obras-seguidas");
  assert.equal(FAVORITES_STORAGE_KEY, "historietas-obras-favoritas");
  assert.equal(COMPLETED_STORAGE_KEY, "historietas-obras-concluidas");
});

test("hooks de lifecycle e exclusão usam somente as chaves necessárias", () => {
  assert.match(
    deleteWorkHookSource,
    /import \{[\s\S]*?COMPLETED_STORAGE_KEY,[\s\S]*?FAVORITES_STORAGE_KEY,[\s\S]*?FOLLOW_STORAGE_KEY,[\s\S]*?STORAGE_KEY,[\s\S]*?\} from "\.\.\/lib\/painel-autor-storage-keys";/,
  );
  assert.doesNotMatch(pageSource, /const STORAGE_KEY\s*=/);
  assert.doesNotMatch(pageSource, /const FOLLOW_STORAGE_KEY\s*=/);
  assert.doesNotMatch(pageSource, /const FAVORITES_STORAGE_KEY\s*=/);
  assert.doesNotMatch(pageSource, /const COMPLETED_STORAGE_KEY\s*=/);
  assert.match(
    initialDataHookSource,
    /import \{[\s\S]*?COMPLETED_STORAGE_KEY,[\s\S]*?FAVORITES_STORAGE_KEY,[\s\S]*?STORAGE_KEY,[\s\S]*?\} from "\.\.\/lib\/painel-autor-storage-keys";/,
  );
  assert.doesNotMatch(initialDataHookSource, /FOLLOW_STORAGE_KEY/);
});
