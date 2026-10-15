import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-hero-visual-style-utils.ts", import.meta.url),
  "utf8",
);
const moduloCapas = readFileSync(
  new URL("../../app/lib/home-cover-hero-style-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");

const moduloExecutavel = modulo.replace(
  'import { obterImagemObraCatalogo } from "./home-catalog-utils";\n',
  [
    "const obterImagemObraCatalogo = (obra) =>",
    '  [obra.capa, obra.capaUrl, obra.cover, obra.imagem].find(',
    '    (imagem) => typeof imagem === "string" && Boolean(imagem.trim()),',
    '  ) || "";',
    "",
  ].join("\n"),
);
const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  criarDecoracaoHomeStyle,
  criarMobileHeroFrameBackground,
  criarMobileHeroImageLayerStyle,
  heroStyle,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

test("home-hero-visual-style-utils preserva heroStyle e seu fundo mobile", () => {
  assert.deepEqual(heroStyle, {
    marginTop: "8px",
    borderRadius: "28px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "none",
    position: "relative",
    minWidth: 0,
    maxWidth: "100%",
    boxSizing: "border-box",
  });
  assert.deepEqual(criarMobileHeroFrameBackground(), {
    ...heroStyle,
    backgroundColor: "#000000",
    backgroundImage:
      "linear-gradient(145deg, #000000 0%, #050505 58%, #0B0B0D 100%)",
    backgroundSize: "cover",
    backgroundPosition: "center",
  });
});

test("home-hero-visual-style-utils preserva camada mobile com imagem e fallback", () => {
  assert.deepEqual(
    criarMobileHeroImageLayerStyle({ capa: "hero.jpg", disponivel: true }),
    {
      position: "absolute",
      zIndex: 0,
      inset: "5px",
      borderRadius: "24px",
      backgroundImage: "url(hero.jpg)",
      backgroundSize: "cover",
      backgroundPosition: "center",
      pointerEvents: "none",
    },
  );
  assert.deepEqual(
    criarMobileHeroImageLayerStyle({ disponivel: false }),
    {
      position: "absolute",
      zIndex: 0,
      inset: "5px",
      borderRadius: "24px",
      backgroundImage:
        "linear-gradient(145deg, #050505 0%, #0B0B0D 58%, #000000 100%)",
      backgroundSize: "cover",
      backgroundPosition: "center top",
      pointerEvents: "none",
    },
  );
});

test("home-hero-visual-style-utils preserva a decoração vazia", () => {
  assert.deepEqual(criarDecoracaoHomeStyle(), { display: "none" });
});

test("home-hero-visual-style-utils estabelece a fronteira visual do Hero", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?criarDecoracaoHomeStyle,[\s\S]*?criarMobileHeroFrameBackground,[\s\S]*?criarMobileHeroImageLayerStyle,[\s\S]*?heroStyle,[\s\S]*?\} from "\.\/lib\/home-hero-visual-style-utils";/,
  );
  assert.doesNotMatch(pagina, /function criarMobileHeroFrameBackground\(/);
  assert.doesNotMatch(pagina, /function criarMobileHeroImageLayerStyle\(/);
  assert.doesNotMatch(pagina, /function criarDecoracaoHomeStyle\(/);
  assert.doesNotMatch(pagina, /const heroStyle: CSSProperties/);
  assert.match(pagina, /style=\{\s*isDesktop\s*\? \{[\s\S]*?\.\.\.heroStyle,[\s\S]*?\.\.\.desktopHeroStyle,/);
  assert.match(pagina, /const desktopHeroStyle: CSSProperties/);
  assert.match(pagina, /const desktopHeroShellStyle: CSSProperties/);
  assert.match(modulo, /import type \{ CSSProperties \} from "react";/);
  assert.match(modulo, /import \{ obterImagemObraCatalogo \} from "\.\/home-catalog-utils";/);
  assert.match(modulo, /export const heroStyle: CSSProperties/);
  assert.match(modulo, /export function criarMobileHeroFrameBackground\(/);
  assert.match(modulo, /export function criarMobileHeroImageLayerStyle\(/);
  assert.match(modulo, /export function criarDecoracaoHomeStyle\(/);
  assert.match(moduloCapas, /export function criarMobileCoverStyle\(/);
  assert.match(moduloCapas, /export function criarMobileCoverThumbStyle\(/);
  assert.match(moduloCapas, /export function criarDesktopHeroPosterStyle\(/);
  assert.doesNotMatch(modulo, /supabase|localStorage|useEffect|useState/);
});
