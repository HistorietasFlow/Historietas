import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utils = readFileSync(
  new URL("../../app/listas/lib/listas-row-media-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/listas/page.tsx", import.meta.url),
  "utf8",
);
const executavel = utils
  .replace(/\r\n/g, "\n")
  .replace('import type { CSSProperties } from "react";\n\n', "");
const javascript = typescript.transpileModule(executavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { criarAvatarStyle, criarCapaStyle } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("criarCapaStyle preserva fallback, URL e valores da capa", () => {
  const fallback = criarCapaStyle("");
  const capa = criarCapaStyle(" https://cdn.test/capa.png ");

  assert.equal(fallback.width, "62px");
  assert.equal(fallback.height, "86px");
  assert.equal(fallback.borderRadius, "9px");
  assert.equal(
    fallback.background,
    "linear-gradient(145deg, rgba(124,58,237,0.28), rgba(249,115,22,0.14)), #111111",
  );
  assert.equal(capa.backgroundImage, "url( https://cdn.test/capa.png )");
  assert.equal(capa.backgroundSize, "cover");
  assert.equal(capa.backgroundPosition, "center");
  assert.equal(criarCapaStyle("   ").backgroundImage, "url(   )");
});

test("criarAvatarStyle preserva fallback, URL e valores do avatar", () => {
  const fallback = criarAvatarStyle("");
  const avatar = criarAvatarStyle(" https://cdn.test/avatar.png ");

  assert.equal(fallback.width, "62px");
  assert.equal(fallback.height, "62px");
  assert.equal(fallback.borderRadius, "999px");
  assert.equal(fallback.fontSize, "24px");
  assert.equal(fallback.fontWeight, 950);
  assert.equal(
    fallback.background,
    "linear-gradient(145deg, rgba(124,58,237,0.34), rgba(249,115,22,0.18)), #111111",
  );
  assert.equal(avatar.backgroundImage, "url( https://cdn.test/avatar.png )");
  assert.equal(avatar.backgroundSize, "cover");
  assert.equal(avatar.backgroundPosition, "center");
  assert.equal(criarAvatarStyle("   ").backgroundImage, "url(   )");
});

test("Listas delega somente os helpers de mídia das linhas", () => {
  assert.match(
    pagina,
    /import \{ criarAvatarStyle, criarCapaStyle \} from "\.\/lib\/listas-row-media-utils";/,
  );
  assert.doesNotMatch(pagina, /function criarCapaStyle\(/);
  assert.doesNotMatch(pagina, /function criarAvatarStyle\(/);
  for (const estilo of [
    "coverStyle",
    "coverEmptyStyle",
    "authorAvatarStyle",
    "authorAvatarEmptyStyle",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`\\b${estilo}\\b`));
  }
  assert.equal((pagina.match(/criarCapaStyle\(/g) || []).length, 2);
  assert.equal((pagina.match(/criarAvatarStyle\(/g) || []).length, 1);
  assert.match(pagina, /function criarAvatarPerfilDiarioListasStyle\(/);
  assert.match(pagina, /function criarAvatarComentarioDiarioListasStyle\(/);
  assert.match(
    pagina,
    /\{!autor\.avatar\s*\? autor\.nome\.slice\(0, 1\)\.toLocaleUpperCase\("pt-BR"\)\s*: ""\}/,
  );
  assert.equal((pagina.match(/aria-hidden="true"/g) || []).length >= 3, true);
  assert.doesNotMatch(utils, /\.trim\(/);
  assert.doesNotMatch(utils, /supabase|useState|useEffect/);
});
