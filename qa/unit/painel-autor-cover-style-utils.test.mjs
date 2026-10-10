import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-cover-style-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const utilsJavascript = typescript
  .transpileModule(utilsSource, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  })
  .outputText.replace('import {} from "react";\r\n', "")
  .replace('import {} from "react";\n', "");
const { criarPainelCoverStyle, criarPainelCoverDesktopStyle } = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

test("criarPainelCoverStyle preserva base, fallback e URL da capa", () => {
  const fallback = criarPainelCoverStyle("");
  const comCapa = criarPainelCoverStyle("https://cdn.example/capa.png");

  assert.deepEqual(fallback, {
    width: "100%",
    aspectRatio: "3 / 4",
    minHeight: "208px",
    borderRadius: "18px",
    position: "relative",
    overflow: "hidden",
    background: "#000000",
    backgroundImage: "linear-gradient(135deg, #050505 0%, #000000 100%)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    border: "0",
    outline: "none",
    minWidth: 0,
    maxWidth: "100%",
    boxSizing: "border-box",
    boxShadow: "none",
  });
  assert.equal(comCapa.background, "#000000");
  assert.equal(comCapa.backgroundImage, "url(https://cdn.example/capa.png)");
  assert.equal(comCapa.backgroundSize, "cover");
  assert.equal(comCapa.backgroundPosition, "center");
});

test("criarPainelCoverDesktopStyle preserva a base e sobrescreve dimensões desktop", () => {
  assert.deepEqual(criarPainelCoverDesktopStyle(""), {
    ...criarPainelCoverStyle(""),
    minHeight: "240px",
    borderRadius: "20px",
  });
});

test("Painel do Autor delega exclusivamente os estilos de capa ao módulo extraído", () => {
  assert.match(
    pagina,
    /import \{\s*criarPainelCoverDesktopStyle,\s*criarPainelCoverStyle,\s*\} from "\.\/lib\/painel-autor-cover-style-utils";/,
  );
  assert.doesNotMatch(pagina, /function criarPainelCoverStyle\(/);
  assert.doesNotMatch(pagina, /function criarPainelCoverDesktopStyle\(/);
  assert.doesNotMatch(pagina, /const coverStyle: CSSProperties = \{/);
  assert.equal((pagina.match(/\bcriarPainelCoverStyle\b/g) || []).length, 2);
  assert.equal((pagina.match(/\bcriarPainelCoverDesktopStyle\b/g) || []).length, 2);
  assert.match(pagina, /const coverGlowStyle: CSSProperties = \{/);
  assert.match(
    pagina,
    /isDesktop\s*\? criarPainelCoverDesktopStyle\(obra\.capa\)\s*: criarPainelCoverStyle\(obra\.capa\)/,
  );
  assert.match(utilsSource, /const coverStyle: CSSProperties = \{/);
  assert.match(utilsSource, /backgroundImage: `url\(\$\{capa\}\)`/);
  assert.doesNotMatch(utilsSource, /supabase|localStorage|useState|useEffect/);
});
