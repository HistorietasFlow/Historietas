import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-search-params.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const initialLoadSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-initial-load.ts",
    import.meta.url,
  ),
  "utf8",
);
const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { obterObraIdEdicaoObra } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("lê obraId pelos search params preservando URLSearchParams e fallbacks", () => {
  assert.equal(obterObraIdEdicaoObra("?obraId=obra-1"), "obra-1");
  assert.equal(obterObraIdEdicaoObra("?obraId=%20obra%202%20"), " obra 2 ");
  assert.equal(obterObraIdEdicaoObra("?outro=obra-3"), "");
  assert.equal(obterObraIdEdicaoObra("?obraId="), "");
});

test("Editar Obra delega somente a leitura de obraId dos search params", () => {
  assert.match(
    initialLoadSource,
    /import \{ obterObraIdEdicaoObra \} from "\.\.\/lib\/editar-obra-search-params";/,
  );
  assert.match(
    initialLoadSource,
    /const obraIdParam = obterObraIdEdicaoObra\(window\.location\.search\);/,
  );
  assert.doesNotMatch(
    initialLoadSource,
    /new URLSearchParams\(window\.location\.search\)/,
  );
  assert.match(source, /new URLSearchParams\(searchParams\)/);
  assert.match(source, /params\.get\("obraId"\) \|\| ""/);
  assert.doesNotMatch(source, /\.trim\(\)|decodeURIComponent/);
});
