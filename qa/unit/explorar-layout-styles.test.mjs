import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/explorar/lib/explorar-layout-styles.ts", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");
const pagina = readFileSync(
  new URL("../../app/explorar/page.tsx", import.meta.url),
  "utf8",
);
const executavel = modulo + `\nexport { activeCategoryStyle, searchBoxStyle,
  mobileTopWaterFadeStyle, desktopTopWaterFadeStyle };\n`;
const javascript = typescript.transpileModule(executavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const estilos = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("a extração preserva literalmente o bloco visual original", () => {
  const original = modulo
    .replace(/^import type[^\n]+\n\n/, "")
    .replace(/^export (?=const|function)/gm, "")
    .trimEnd();
  assert.equal(
    createHash("sha256").update(original).digest("hex"),
    "5ab23e666d88713efe8c165e3c41cf2a3ac068fd113b3da3596190a94a6b4e74",
  );
});

test("shell, categoria e busca preservam bases e variantes desktop", () => {
  assert.equal(estilos.pageStyle.minHeight, "100vh");
  assert.equal(estilos.pageStyle.background, "#000000");
  assert.deepEqual(estilos.desktopContainerStyle, {
    ...estilos.containerStyle,
    width: "min(1180px, calc(100% - 64px))",
    maxWidth: "100%",
    padding: "34px 0 64px",
  });
  assert.deepEqual(estilos.desktopCategoriesStyle, {
    ...estilos.categoriesStyle,
    gap: "10px",
    padding: "2px 0 13px",
    marginBottom: "5px",
  });
  assert.deepEqual(estilos.criarActiveCategoryStyle(), {
    ...estilos.activeCategoryStyle,
    border: "1px solid #FFFFFF",
    background: "#FFFFFF",
    color: "#000000",
    boxShadow: "none",
  });
  assert.deepEqual(estilos.criarSearchBoxStyle(), {
    ...estilos.searchBoxStyle,
    marginBottom: "-6px",
    padding: 0,
    borderRadius: 0,
    background: "transparent",
    border: "none",
    overflow: "visible",
    boxShadow: "none",
  });
  assert.deepEqual(estilos.criarDesktopSearchBoxStyle(), {
    ...estilos.criarSearchBoxStyle(),
    gridTemplateColumns: "1fr",
    alignItems: "stretch",
    gap: "5px",
    marginTop: "12px",
    padding: 0,
    borderRadius: 0,
    background: "transparent",
    border: "none",
    overflow: "visible",
    boxShadow: "none",
  });
  for (const [desktop, base] of [[false, estilos.mobileTopWaterFadeStyle], [true, estilos.desktopTopWaterFadeStyle]]) {
    assert.deepEqual(estilos.criarExplorarTopWaterFadeStyle(desktop), {
      ...base,
      background: "transparent",
      opacity: 0,
    });
  }
  assert.deepEqual(estilos.criarExplorarPageStyle({ background: "blue", color: "red" }), {
    background: "blue",
    color: "var(--historietas-text-primary, #FFFFFF)",
  });
});

test("filtros, modal e confirmação de idade mantêm estilos e estados", () => {
  assert.equal(estilos.explorarModalOverlayStyle.position, "fixed");
  assert.equal(estilos.explorarModalOverlayStyle.zIndex, 240);
  assert.equal(estilos.explorarModalSheetStyle.borderRadius, "24px 24px 0 0");
  assert.deepEqual(estilos.desktopExplorarModalSheetStyle, {
    ...estilos.explorarModalSheetStyle,
    left: "50%",
    right: "auto",
    bottom: "24px",
    width: "min(560px, calc(100vw - 24px))",
    maxWidth: "560px",
    maxHeight: "82vh",
    transform: "translateX(-50%)",
    borderRadius: "24px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    margin: 0,
    paddingBottom: "18px",
  });
  assert.equal(estilos.criarExplorarModalOptionStyle(true).fontWeight, 900);
  assert.equal(estilos.criarExplorarModalOptionStyle(false).fontWeight, 650);
  assert.equal(estilos.criarExplorarModalRadioStyle(true).background, "#FFFFFF");
  assert.equal(estilos.criarExplorarModalRadioStyle(false).background, "transparent");
  assert.deepEqual(estilos.safeTextStyle, { overflowWrap: "anywhere", wordBreak: "break-word" });
  assert.equal(estilos.explorarAdultConfirmationCheckboxStyle.accentColor, "#FFFFFF");
  assert.deepEqual(estilos.explorarAdultConfirmationDisabledStyle, { opacity: 0.42, cursor: "not-allowed" });
});

test("a página importa os estilos, preserva os cards e o módulo não tem efeitos", () => {
  const importacao = pagina.match(/import \{\s*((?:\w+,\s*)+)\} from "\.\/lib\/explorar-layout-styles";/);
  assert.ok(importacao);
  const nomes = importacao[1].split(",").map((nome) => nome.trim()).filter(Boolean);
  for (const nome of nomes) {
    assert.match(modulo, new RegExp(`export (?:const|function) ${nome}\\b`));
    assert.doesNotMatch(pagina, new RegExp(`(?:const|function) ${nome}\\b`));
  }
  for (const nome of ["criarPublishedCardTemaStyle", "criarPublishedCoverTemaStyle", "criarProgressTrackStyle", "criarCardPrimaryActionStyle"]) {
    assert.match(pagina, new RegExp(`function ${nome}\\(`));
  }
  assert.match(modulo, /import type \{ CSSProperties \} from "react"/);
  const runtime = modulo.replace('import type { CSSProperties } from "react";', "");
  assert.doesNotMatch(runtime, /(?:from ["'](?:react|.*supabase)["']|\blocalStorage\b|\bwindow\b|\bdocument\b|\buse[A-Z]\w*\b)/i);
});
