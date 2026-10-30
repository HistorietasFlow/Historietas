import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/editar-obra/lib/editar-obra-tags-list-utils.ts", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const derivedStateSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-form-derived-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const savePreparationSource = readFileSync(
  new URL("../../app/editar-obra/lib/editar-obra-save-preparation.ts", import.meta.url),
  "utf8",
);
const javascript = typescript.transpileModule(source, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const { prepararTagsEdicaoObra, obterTagsFinaisEdicaoObra } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("prepara tags preservando split, ordem, trim, vazios e limite", () => {
  assert.deepEqual(prepararTagsEdicaoObra("  ação, , aventura , terror ", 2), ["ação", "aventura"]);
  assert.deepEqual(prepararTagsEdicaoObra(" , ", 1), []);
});

test("preserva fallback de tags finais", () => {
  assert.deepEqual(obterTagsFinaisEdicaoObra(["ação"]), ["ação"]);
  assert.deepEqual(obterTagsFinaisEdicaoObra([]), ["sem tags"]);
});

test("Editar Obra delega a lista e o fallback de tags às fronteiras puras", () => {
  assert.match(
    pageSource,
    /import \{ useEditarObraFormDerivedState \} from "\.\/hooks\/use-editar-obra-form-derived-state";/,
  );
  assert.match(
    derivedStateSource,
    /import \{ prepararTagsEdicaoObra \} from "\.\.\/lib\/editar-obra-tags-list-utils";/,
  );
  assert.match(derivedStateSource, /const tagsTratadas = useMemo\(\(\) => \{\s*return prepararTagsEdicaoObra\(tags, LIMITE_TAGS_OBRA\);/);
  assert.doesNotMatch(pageSource, /obterTagsFinaisEdicaoObra/);
  assert.match(
    savePreparationSource,
    /import \{ obterTagsFinaisEdicaoObra \} from "\.\/editar-obra-tags-list-utils";/,
  );
  assert.match(savePreparationSource, /const tagsFinais = obterTagsFinaisEdicaoObra\(tagsTratadas\);/);
  assert.match(source, /\.split\(","\)/);
  assert.match(source, /\.map\(\(tag\) => tag\.trim\(\)\)/);
  assert.match(source, /\.filter\(Boolean\)/);
  assert.match(source, /\.slice\(0, limiteTagsObra\)/);
  assert.doesNotMatch(source, /supabase|localStorage|useState|useEffect/);
});
