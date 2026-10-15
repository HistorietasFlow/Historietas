import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-cover-hero-style-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const catalogoCard = readFileSync(
  new URL("../../components/HomeCatalogWorkCard.tsx", import.meta.url),
  "utf8",
);
const obraLocalCard = readFileSync(
  new URL("../../components/HomeLocalWorkCard.tsx", import.meta.url),
  "utf8",
);

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
  criarDesktopHeroPosterStyle,
  criarMobileCoverStyle,
  criarMobileCoverThumbStyle,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

test("home-cover-hero-style-utils preserva a capa mobile e seu placeholder", () => {
  const placeholder = criarMobileCoverStyle("");

  assert.equal(criarMobileCoverStyle(""), placeholder);
  assert.deepEqual(placeholder, {
    minHeight: "116px",
    borderRadius: "16px",
    position: "relative",
    overflow: "hidden",
    backgroundImage: "linear-gradient(135deg, #050505 0%, #0B0B0D 100%)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    minWidth: 0,
    maxWidth: "100%",
    boxSizing: "border-box",
    textDecoration: "none",
    display: "block",
  });
  assert.deepEqual(criarMobileCoverStyle(" capa.jpg "), {
    ...placeholder,
    backgroundImage: "url( capa.jpg )",
    backgroundSize: "cover",
    backgroundPosition: "center",
  });
});

test("home-cover-hero-style-utils preserva a miniatura e sua posição por disponibilidade", () => {
  const semImagem = criarMobileCoverThumbStyle({ disponivel: true });

  assert.equal(criarMobileCoverThumbStyle({ disponivel: false }), semImagem);
  assert.deepEqual(semImagem, {
    minHeight: "122px",
    borderRadius: "16px",
    position: "relative",
    overflow: "hidden",
    backgroundImage: "linear-gradient(135deg, #050505 0%, #0B0B0D 100%)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    maxWidth: "100%",
    boxSizing: "border-box",
    minWidth: 0,
  });
  assert.deepEqual(
    criarMobileCoverThumbStyle({ capaUrl: "thumb.jpg", disponivel: true }),
    {
      ...semImagem,
      backgroundImage: "url(thumb.jpg)",
      backgroundSize: "cover",
      backgroundPosition: "center",
    },
  );
  assert.deepEqual(
    criarMobileCoverThumbStyle({ imagem: "thumb.jpg", disponivel: false }),
    {
      ...semImagem,
      backgroundImage: "url(thumb.jpg)",
      backgroundSize: "cover",
      backgroundPosition: "center top",
    },
  );
});

test("home-cover-hero-style-utils preserva poster desktop com imagem e gradiente literal", () => {
  const semImagem = criarDesktopHeroPosterStyle({ disponivel: false });

  assert.notEqual(criarDesktopHeroPosterStyle({ disponivel: true }), semImagem);
  assert.deepEqual(semImagem, {
    position: "relative",
    width: "100%",
    height: "100%",
    minHeight: 0,
    borderRadius: "22px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "none",
    textDecoration: "none",
    color: "#FFFFFF",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    gap: "10px",
    padding: "22px",
    boxSizing: "border-box",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundImage:
      "linear-gradient(145deg, #050505 0%, #0B0B0D 52%, #000000 100%)",
  });
  assert.deepEqual(
    criarDesktopHeroPosterStyle({ cover: "poster.jpg", disponivel: true }),
    {
      ...semImagem,
      backgroundImage: "url(poster.jpg)",
      backgroundSize: "cover",
      backgroundPosition: "center",
    },
  );
});

test("home-cover-hero-style-utils estabelece a fronteira dos estilos de capa e poster", () => {
  assert.match(
    pagina,
    /import \{ criarDesktopHeroPosterStyle \} from "\.\/lib\/home-cover-hero-style-utils";/,
  );
  assert.doesNotMatch(pagina, /function criarMobileCoverStyle\(/);
  assert.doesNotMatch(pagina, /function criarMobileCoverThumbStyle\(/);
  assert.doesNotMatch(pagina, /function criarDesktopHeroPosterStyle\(/);
  assert.doesNotMatch(pagina, /const coverPlaceholderStyle: CSSProperties/);
  assert.doesNotMatch(pagina, /const coverThumbStyle: CSSProperties/);
  assert.doesNotMatch(pagina, /const desktopHeroPosterStyle: CSSProperties/);
  assert.doesNotMatch(pagina, /function criarMobileHeroFrameBackground\(/);
  assert.doesNotMatch(pagina, /function criarMobileHeroImageLayerStyle\(/);
  assert.doesNotMatch(pagina, /function criarDecoracaoHomeStyle\(/);
  assert.doesNotMatch(pagina, /const heroStyle: CSSProperties/);
  assert.match(modulo, /import type \{ CSSProperties \} from "react";/);
  assert.match(modulo, /import \{ obterImagemObraCatalogo \} from "\.\/home-catalog-utils";/);
  assert.match(modulo, /const coverPlaceholderStyle: CSSProperties/);
  assert.match(modulo, /const coverThumbStyle: CSSProperties/);
  assert.match(modulo, /const desktopHeroPosterStyle: CSSProperties/);
  assert.doesNotMatch(modulo, /export const (?:coverPlaceholderStyle|coverThumbStyle|desktopHeroPosterStyle)/);
  assert.match(modulo, /export function criarMobileCoverStyle\(/);
  assert.match(modulo, /export function criarMobileCoverThumbStyle\(/);
  assert.match(
    catalogoCard,
    /import \{ criarMobileCoverThumbStyle \} from "\.\.\/app\/lib\/home-cover-hero-style-utils";/,
  );
  assert.match(catalogoCard, /criarMobileCoverThumbStyle\(obra\)/);
  assert.match(
    obraLocalCard,
    /import \{ criarMobileCoverStyle \} from "\.\.\/app\/lib\/home-cover-hero-style-utils";/,
  );
  assert.match(obraLocalCard, /criarMobileCoverStyle\(obra\.capa\)/);
  assert.match(modulo, /export function criarDesktopHeroPosterStyle\(/);
  assert.doesNotMatch(modulo, /supabase|localStorage|useEffect|useState/);
});
