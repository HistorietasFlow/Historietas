import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const fonte = ler("../../app/ler-capitulo/lib/ler-capitulo-reading-text-utils.ts");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const executavel = fonte.replace(
  /import \{[\s\S]*?\} from "\.\/ler-capitulo-layout-styles";/,
  `const chapterTextStyle = { origem: "mobile" };\nconst desktopChapterTextStyle = { origem: "desktop" };`,
);
const javascript = typescript.transpileModule(executavel, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const {
  FONT_SCALE_LEGACY_VALUES, contarPalavras, criarTextoLeituraStyle, criarTextoLeituraDesktopStyle,
} = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);

test("helpers preservam escala legada e contagem de palavras", () => {
  assert.deepEqual(FONT_SCALE_LEGACY_VALUES, { 1: 1, 2: 3, 3: 5, 4: 7, 5: 10 });
  assert.equal(contarPalavras(""), 0);
  assert.equal(contarPalavras("  uma   duas\ntrês  "), 3);
  assert.equal(contarPalavras("uma\tduas\ntrês quatro"), 4);
});

test("helpers preservam font-size, thresholds, line-height e spreads mobile e desktop", () => {
  const mobile = [[1, "13px", 1.78], [2, "15px", 1.78], [3, "17px", 1.9], [4, "19px", 1.9], [5, "22px", 1.98]];
  const desktop = [[1, "15px", 1.82], [2, "17px", 1.82], [3, "19px", 1.94], [4, "21px", 1.94], [5, "24px", 2.02]];
  for (const [tamanho, fontSize, lineHeight] of mobile) {
    assert.deepEqual(criarTextoLeituraStyle(tamanho), { origem: "mobile", fontSize, lineHeight });
  }
  for (const [tamanho, fontSize, lineHeight] of desktop) {
    assert.deepEqual(criarTextoLeituraDesktopStyle(tamanho), { origem: "desktop", fontSize, lineHeight });
  }
  assert.match(fonte, /\.\.\.chapterTextStyle/);
  assert.match(fonte, /\.\.\.desktopChapterTextStyle/);
  assert.match(fonte, /tamanhoLegado <= 3/);
  assert.match(fonte, /tamanhoLegado <= 7/);
});

test("a página mantém a derivação de palavras e as props do ReaderContent", () => {
  assert.match(pagina, /import \{[\s\S]*?contarPalavras,[\s\S]*?criarTextoLeituraStyle,[\s\S]*?criarTextoLeituraDesktopStyle,[\s\S]*?\} from "\.\/lib\/ler-capitulo-reading-text-utils";/);
  assert.match(pagina, /const totalPalavras = capituloAtual \? contarPalavras\(capituloAtual\.texto\) : 0;/);
  assert.match(pagina, /criarTextoLeituraDesktopStyle=\{criarTextoLeituraDesktopStyle\}/);
  assert.match(pagina, /criarTextoLeituraStyle=\{criarTextoLeituraStyle\}/);
  assert.doesNotMatch(pagina, /const FONT_SCALE_LEGACY_VALUES/);
  assert.doesNotMatch(pagina, /function contarPalavras\(/);
  assert.doesNotMatch(pagina, /function criarTextoLeituraStyle\(/);
});
