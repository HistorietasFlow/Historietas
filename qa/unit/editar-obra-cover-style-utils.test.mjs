import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-cover-style-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { criarMiniCoverStyle, criarPreviewCoverStyle } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

test("helpers de capa de Editar Obra preservam estilos-base e imagem", () => {
  const miniBase = { minHeight: "96px", background: "gradiente" };
  const previewBase = { minHeight: "116px", background: "pre-visualizacao" };

  assert.equal(criarMiniCoverStyle("", miniBase), miniBase);
  assert.equal(criarPreviewCoverStyle("", previewBase), previewBase);
  assert.deepEqual(criarMiniCoverStyle("https://exemplo.com/capa.png", miniBase), {
    ...miniBase,
    border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
    background: "var(--historietas-editar-obra-cover-surface, #0B0714)",
    backgroundImage: "url(https://exemplo.com/capa.png)",
    backgroundSize: "cover",
    backgroundPosition: "center",
  });
  assert.deepEqual(criarPreviewCoverStyle("https://exemplo.com/capa.png", previewBase), {
    ...previewBase,
    background: "var(--historietas-editar-obra-bg-deep, #000000)",
    backgroundImage: "url(https://exemplo.com/capa.png)",
    backgroundSize: "cover",
    backgroundPosition: "center",
  });
});

test("Editar Obra delega os estilos de capa mantendo as bases locais", () => {
  assert.match(
    pageSource,
    /import \{[\s\S]*?criarMiniCoverStyle,[\s\S]*?criarPreviewCoverStyle,[\s\S]*?\} from "\.\/lib\/editar-obra-cover-style-utils";/,
  );
  assert.doesNotMatch(pageSource, /function criarMiniCoverStyle\(/);
  assert.doesNotMatch(pageSource, /function criarPreviewCoverStyle\(/);
  assert.match(pageSource, /criarMiniCoverStyle\(capa, coverPlaceholderStyle\)/);
  assert.match(pageSource, /criarPreviewCoverStyle\(capa, previewCoverStyle\)/);
  assert.match(pageSource, /const coverPlaceholderStyle: CSSProperties/);
  assert.match(pageSource, /const previewCoverStyle: CSSProperties/);
  assert.match(source, /export function criarMiniCoverStyle\(/);
  assert.match(source, /export function criarPreviewCoverStyle\(/);
  assert.doesNotMatch(source, /supabase|localStorage|useState|useEffect/);
});
