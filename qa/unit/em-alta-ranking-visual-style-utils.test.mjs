import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-ranking-visual-style-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
const moduloTema = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-ranking-position-theme.ts",
    import.meta.url,
  ),
  "utf8",
);
const temaJs = typescript.transpileModule(moduloTema, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const temaUrl = `data:text/javascript;base64,${Buffer.from(temaJs).toString("base64")}`;
const executavel = modulo
  .replace(/import type \{ CSSProperties \} from "react";\r?\n/, "")
  .replace(
    /from "\.\/em-alta-ranking-position-theme";/,
    `from "${temaUrl}";`,
  );
const js = typescript.transpileModule(executavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const estilos = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
);

const gradient =
  "linear-gradient(135deg, var(--historietas-em-alta-hex-08030f, #08030F) 0%, var(--historietas-em-alta-hex-04000a, #04000A) 100%)";

test("preserva a base visual da capa mobile e desktop", () => {
  assert.equal(estilos.coverStyle.minHeight, "122px");
  assert.equal(estilos.coverStyle.borderRadius, "16px");
  assert.equal(estilos.coverStyle.backgroundImage, gradient);
  assert.equal(estilos.coverStyle.transform, "scaleX(1.125) scaleY(1.095)");
  assert.equal(estilos.coverStyle.transformOrigin, "center");
  assert.equal(estilos.coverStyle.border, "none");
  assert.equal(estilos.coverStyle.outline, "none");
  assert.equal(estilos.coverStyle.boxShadow, "none");
  assert.equal(estilos.desktopCoverStyle.backgroundImage, gradient);
  assert.equal(estilos.desktopCoverStyle.minHeight, "142px");
  assert.equal(estilos.desktopCoverStyle.borderRadius, "18px");
});

test("cria capas com fallbacks e URL literal em ambos os layouts", () => {
  const mobileVazia = estilos.criarRankingCoverStyle("", false);
  const desktopVazia = estilos.criarRankingCoverStyle("", true);
  const mobileComCapa = estilos.criarRankingCoverStyle("imagem.jpg", false);
  const desktopComCapa = estilos.criarRankingCoverStyle("imagem.jpg", true);

  assert.equal(mobileVazia.minHeight, "122px");
  assert.equal(mobileVazia.backgroundImage, gradient);
  assert.equal(mobileVazia.backgroundColor, "var(--historietas-em-alta-hex-04000a, #04000A)");
  assert.equal(mobileVazia.border, "none");
  assert.equal(desktopVazia.minHeight, "142px");
  assert.equal(desktopVazia.borderRadius, "18px");
  assert.equal(mobileComCapa.backgroundImage, "url(imagem.jpg)");
  assert.equal(mobileComCapa.backgroundSize, "cover");
  assert.equal(mobileComCapa.backgroundPosition, "center");
  assert.equal(desktopComCapa.minHeight, "142px");
  assert.equal(desktopComCapa.backgroundImage, "url(imagem.jpg)");
});

test("preserva posições, ciclo e propriedades comuns da decoração", () => {
  const primeira = estilos.criarDecoracaoPaginaStyle(0);
  const segunda = estilos.criarDecoracaoPaginaStyle(1);
  const ciclo = estilos.criarDecoracaoPaginaStyle(2);

  assert.deepEqual(
    { top: primeira.top, right: primeira.right, fontSize: primeira.fontSize, transform: primeira.transform },
    { top: "32%", right: "-18px", fontSize: "72px", transform: "rotate(-14deg)" },
  );
  assert.deepEqual(
    { top: segunda.top, left: segunda.left, fontSize: segunda.fontSize, transform: segunda.transform },
    { top: "64%", left: "-16px", fontSize: "58px", transform: "rotate(12deg)" },
  );
  assert.equal(ciclo.top, primeira.top);
  assert.equal(ciclo.right, primeira.right);
  assert.equal(primeira.position, "absolute");
  assert.equal(primeira.color, "var(--historietas-em-alta-rgba-139-92-246-0-18, rgba(139, 92, 246, 0.18))");
  assert.equal(primeira.opacity, 0.035);
  assert.equal(primeira.lineHeight, 1);
  assert.equal(primeira.fontWeight, 950);
  assert.equal(primeira.filter, "none");
  assert.equal(primeira.userSelect, "none");
});

test("cria avatar de autor com tema, fallback e bases responsivas", () => {
  const mobileComAvatar = estilos.criarAutorAvatarRankingStyle(
    "avatar.png",
    1,
    false,
  );
  const desktopSemAvatar = estilos.criarAutorAvatarRankingStyle("", 2, true);
  const prataSemAvatar = estilos.criarAutorAvatarRankingStyle("", 4, false);

  assert.equal(
    mobileComAvatar.backgroundImage,
    "linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.24)), url(avatar.png)",
  );
  assert.equal(
    mobileComAvatar.backgroundColor,
    "var(--historietas-em-alta-hex-061523, #061523)",
  );
  assert.equal(mobileComAvatar.minHeight, "122px");
  assert.equal(mobileComAvatar.borderRadius, "16px");
  assert.equal(mobileComAvatar.backgroundSize, "cover");
  assert.equal(mobileComAvatar.backgroundPosition, "center");
  assert.equal(mobileComAvatar.border, "none");
  assert.equal(mobileComAvatar.outline, "none");
  assert.equal(mobileComAvatar.boxShadow, "none");
  assert.equal(desktopSemAvatar.minHeight, "142px");
  assert.equal(desktopSemAvatar.borderRadius, "18px");
  assert.equal(
    desktopSemAvatar.backgroundColor,
    "var(--historietas-em-alta-hex-2a0716, #2A0716)",
  );
  assert.match(desktopSemAvatar.backgroundImage, /#3A1020/);
  assert.equal(
    prataSemAvatar.backgroundColor,
    "var(--historietas-em-alta-hex-101722, #101722)",
  );
  assert.match(prataSemAvatar.backgroundImage, /#26303D/);
});

test("a página delega toda a fronteira visual", () => {
  for (const nome of [
    "coverStyle",
    "desktopCoverStyle",
    "criarRankingCoverStyle",
    "criarAutorAvatarRankingStyle",
    "criarDecoracaoPaginaStyle",
  ]) {
    assert.match(modulo, new RegExp(`export (?:const|function) ${nome}\\b`));
  }
  for (const nome of [
    "criarRankingCoverStyle",
    "criarAutorAvatarRankingStyle",
    "criarDecoracaoPaginaStyle",
  ]) {
    assert.match(pagina, new RegExp(`\\b${nome}\\b`));
  }
  assert.match(pagina, /from "\.\/lib\/em-alta-ranking-visual-style-utils";/);
  assert.doesNotMatch(pagina, /function criarRankingCoverStyle\b/);
  assert.doesNotMatch(pagina, /function criarDecoracaoPaginaStyle\b/);
  assert.doesNotMatch(pagina, /const coverStyle: CSSProperties = \{/);
  assert.doesNotMatch(pagina, /const desktopCoverStyle: CSSProperties = \{/);
  assert.doesNotMatch(pagina, /function criarAutorAvatarRankingStyle\b/);
  assert.match(
    pagina,
    /style=\{criarAutorAvatarRankingStyle\(avatarAutor, posicao, isDesktop\)\}/,
  );
});

test("o módulo permanece visual e sem runtime externo", () => {
  assert.match(modulo, /^import type \{ CSSProperties \} from "react";$/m);
  assert.match(
    modulo,
    /^import \{ obterTemaPosicao \} from "\.\/em-alta-ranking-position-theme";$/m,
  );
  for (const proibido of [
    /supabase/i,
    /localStorage/,
    /\bwindow\b/,
    /\bdocument\b/,
    /\buse[A-Z]\w*\b/,
    /<[A-Z][\w.]*(?:\s|\/?>)/,
    /^import (?!type).*react/m,
  ]) {
    assert.doesNotMatch(modulo, proibido);
  }
});
