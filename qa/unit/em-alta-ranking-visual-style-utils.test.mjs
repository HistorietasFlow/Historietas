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
const componenteAutor = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-author-ranking-card.tsx",
    import.meta.url,
  ),
  "utf8",
);
const componenteObra = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-ranking-card.tsx",
    import.meta.url,
  ),
  "utf8",
);
const rankingSection = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-ranking-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const authorsSection = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-authors-ranking-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const header = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-header.tsx",
    import.meta.url,
  ),
  "utf8",
);
const moduloTema = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-ranking-position-theme.ts",
    import.meta.url,
  ),
  "utf8",
);
const moduloCategoria = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-ranking-category-theme.ts",
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
const categoriaJs = typescript.transpileModule(moduloCategoria, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const categoriaUrl = `data:text/javascript;base64,${Buffer.from(categoriaJs).toString("base64")}`;
const executavel = modulo
  .replace(/import type \{ CSSProperties \} from "react";\r?\n/, "")
  .replace(
    /from "\.\/em-alta-ranking-category-theme";/,
    `from "${categoriaUrl}";`,
  )
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

test("preserva a base segura e os títulos dos cards de ranking", () => {
  assert.deepEqual(estilos.safeTextStyle, {
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  });

  assert.equal(estilos.cardTitleStyle.fontSize, "20px");
  assert.equal(estilos.cardTitleStyle.lineHeight, 1.05);
  assert.equal(estilos.cardTitleStyle.fontWeight, 500);
  assert.equal(estilos.cardTitleStyle.letterSpacing, "-0.01em");
  assert.equal(estilos.cardTitleStyle.WebkitLineClamp, 2);
  assert.equal(estilos.cardTitleStyle.overflow, "hidden");
  assert.equal(estilos.cardTitleStyle.overflowWrap, "anywhere");
  assert.equal(estilos.cardTitleStyle.wordBreak, "break-word");

  assert.equal(estilos.authorRankingCardTitleStyle.fontSize, "19px");
  assert.equal(estilos.authorRankingCardTitleStyle.lineHeight, 1.05);
  assert.equal(estilos.authorRankingCardTitleStyle.fontWeight, 500);
  assert.equal(estilos.authorRankingCardTitleStyle.letterSpacing, "-0.01em");
  assert.equal(estilos.authorRankingCardTitleStyle.WebkitLineClamp, 2);
  assert.equal(estilos.authorRankingCardTitleStyle.overflow, "hidden");
  assert.equal(estilos.authorRankingCardTitleStyle.overflowWrap, "anywhere");
  assert.equal(estilos.authorRankingCardTitleStyle.wordBreak, "break-word");

  assert.deepEqual(estilos.criarObraCardTitleRankingStyle(), {
    ...estilos.cardTitleStyle,
    color: "#FFFFFF",
  });
  assert.deepEqual(estilos.criarAutorCardTitleRankingStyle(), {
    ...estilos.authorRankingCardTitleStyle,
    color: "#FFFFFF",
  });
});

test("preserva o shell e o cabeçalho principal de Em Alta", () => {
  assert.deepEqual(estilos.pageDecorationLayerStyle, {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: 0,
  });
  assert.deepEqual(estilos.mobileTopWaterFadeStyle, {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "min(340px, 48vh)",
    pointerEvents: "none",
    zIndex: 0,
    background: "transparent",
    WebkitMaskImage: "none",
    maskImage: "none",
  });
  assert.deepEqual(estilos.desktopTopWaterFadeStyle, {
    ...estilos.mobileTopWaterFadeStyle,
    height: "min(620px, 68vh)",
  });
  assert.deepEqual(estilos.pageStyle, {
    position: "relative",
    minHeight: "100vh",
    width: "100%",
    maxWidth: "100vw",
    overflowX: "hidden",
    backgroundColor: "var(--historietas-em-alta-hex-070212, #000000)",
    background: "var(--historietas-em-alta-hex-070212, #000000)",
    color: "var(--historietas-text-primary, #FFFFFF)",
    fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
  });
  assert.deepEqual(estilos.containerStyle, {
    position: "relative",
    zIndex: 1,
    width: "min(820px, calc(100% - 28px))",
    maxWidth: "100%",
    margin: "0 auto",
    padding: "14px 0 116px",
    boxSizing: "border-box",
    minWidth: 0,
  });
  assert.deepEqual(estilos.desktopContainerStyle, {
    ...estilos.containerStyle,
    width: "min(1180px, calc(100% - 64px))",
    padding: "18px 0 84px",
  });
  assert.deepEqual(estilos.topStyle, {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "14px",
    minWidth: 0,
  });
  assert.deepEqual(estilos.titleStyle, {
    position: "relative",
    zIndex: 1,
    margin: 0,
    fontSize: "clamp(30px, 8vw, 46px)",
    lineHeight: 1.04,
    fontWeight: 950,
    letterSpacing: "-0.074em",
    maxWidth: "100%",
    textAlign: "center",
    background:
      "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, var(--historietas-em-alta-hex-f5f3ff, #F5F3FF)) 42%, var(--historietas-title-to, var(--historietas-em-alta-hex-fdba74, #FDBA74)) 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    textShadow: "none",
    ...estilos.safeTextStyle,
  });
  assert.deepEqual(estilos.titleHeaderStyle, {
    ...estilos.topStyle,
    justifyContent: "center",
    marginTop: "4px",
    marginBottom: "18px",
    textAlign: "center",
  });
  assert.deepEqual(estilos.desktopTitleHeaderStyle, {
    ...estilos.titleHeaderStyle,
    position: "relative",
    marginTop: "6px",
    marginBottom: "22px",
  });
  assert.deepEqual(estilos.headerTitleLinkStyle, {
    color: "var(--historietas-text-primary, #FFFFFF)",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "3px",
    width: "100%",
    maxWidth: "100%",
    margin: "0 auto",
    minWidth: 0,
    textAlign: "center",
  });
  assert.deepEqual(estilos.desktopHeaderTitleLinkStyle, {
    ...estilos.headerTitleLinkStyle,
    gap: "4px",
  });
  assert.deepEqual(estilos.headerTitleMarkStyle, {
    width: "clamp(36px, 8vw, 48px)",
    height: "clamp(36px, 8vw, 48px)",
    borderRadius: "clamp(12px, 2.6vw, 16px)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--historietas-em-alta-hex-04000a, #04000A)",
    color: "#FFFFFF",
    fontSize: "clamp(18px, 4.3vw, 24px)",
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: "-0.04em",
    flex: "0 0 auto",
    border: "1px solid var(--historietas-em-alta-rgba-59-7-100-0-58, rgba(59, 7, 100, 0.58))",
    boxShadow: "none",
  });
  assert.deepEqual(estilos.desktopHeaderTitleMarkStyle, {
    ...estilos.headerTitleMarkStyle,
    width: "50px",
    height: "50px",
    borderRadius: "17px",
    fontSize: "25px",
  });
  assert.deepEqual(estilos.headerTitleTextStyle, {
    ...estilos.titleStyle,
    margin: 0,
    fontSize: "clamp(26px, 6.8vw, 40px)",
    maxWidth: "calc(100vw - 86px)",
    textAlign: "center",
    background: "none",
    WebkitBackgroundClip: "initial",
    backgroundClip: "initial",
    color: "#FFFFFF",
    textShadow: "none",
    textTransform: "uppercase",
    wordSpacing: "0.1em",
    whiteSpace: "nowrap",
  });
  assert.deepEqual(estilos.desktopHeaderTitleTextStyle, {
    ...estilos.headerTitleTextStyle,
    fontSize: "clamp(34px, 3.6vw, 44px)",
    maxWidth: "760px",
  });
});

test("preserva as bases e helpers dos badges do ranking", () => {
  assert.deepEqual(estilos.highlightBadgeStyle, {
    width: "fit-content",
    maxWidth: "100%",
    minHeight: "34px",
    padding: "0 10px",
    marginTop: "4px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "var(--historietas-text-primary, #FFFFFF)",
    fontSize: "11px",
    fontWeight: 900,
    lineHeight: 1.12,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    boxSizing: "border-box",
    whiteSpace: "normal",
    overflow: "hidden",
    textOverflow: "ellipsis",
    ...estilos.safeTextStyle,
  });
  assert.deepEqual(estilos.rankingHighlightBadgeInlineStyle, {
    flex: "1 1 auto",
    minWidth: 0,
    marginTop: 0,
    padding: "0 12px",
    textAlign: "center",
  });
  assert.deepEqual(estilos.authorRankingTierBadgeStyle, {
    position: "absolute",
    left: "6px",
    right: "6px",
    bottom: "6px",
    zIndex: 3,
    minHeight: "24px",
    padding: "0 7px",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    fontSize: "8px",
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: "0.055em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    boxShadow: "0 6px 12px rgba(0,0,0,0.22)",
    ...estilos.safeTextStyle,
  });

  const diamante = estilos.criarRankingTierInlineBadgeStyle(1);
  const prata = estilos.criarRankingTierInlineBadgeStyle(4);
  assert.equal(
    diamante.background,
    "var(--historietas-em-alta-rgba-125-211-252-0-16, rgba(125,211,252,0.16))",
  );
  assert.equal(diamante.padding, "0 12px");
  assert.equal(diamante.minHeight, "34px");
  assert.equal(diamante.boxShadow, "none");
  assert.equal(
    prata.background,
    "var(--historietas-em-alta-rgba-203-213-225-0-13, rgba(203,213,225,0.13))",
  );

  const autor = estilos.criarAutorTierInlineBadgeStyle(2);
  assert.equal(autor.position, "static");
  assert.equal(autor.left, "auto");
  assert.equal(autor.right, "auto");
  assert.equal(autor.bottom, "auto");
  assert.equal(autor.minHeight, "34px");
  assert.equal(autor.padding, "0 16px");
  assert.equal(autor.width, "fit-content");
  assert.equal(autor.flex, "0 0 auto");
  assert.equal(
    autor.background,
    "var(--historietas-em-alta-rgba-251-113-133-0-16, rgba(251,113,133,0.16))",
  );

  assert.deepEqual(estilos.criarAutorPointsBadgeStyle(), {
    ...estilos.highlightBadgeStyle,
    marginTop: 0,
    minHeight: "34px",
    padding: "0 16px",
    color: "#FFFFFF",
    flex: "0 0 auto",
  });
});

test("preserva os shells, setas e trilhos dos carrosséis", () => {
  assert.deepEqual(estilos.carouselShellStyle, {
    position: "relative",
    minWidth: 0,
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    overflow: "visible",
  });
  assert.deepEqual(estilos.desktopCarouselShellStyle, {
    ...estilos.carouselShellStyle,
    width: "100%",
    maxWidth: "100%",
    marginLeft: 0,
    marginRight: 0,
    overflow: "visible",
    marginTop: "0",
  });
  assert.deepEqual(estilos.carouselArrowButtonStyle, {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 8,
    width: "52px",
    height: "96px",
    padding: 0,
    borderRadius: 0,
    border: "none",
    background: "transparent",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "none",
    outline: "none",
    WebkitTapHighlightColor: "transparent",
    touchAction: "manipulation",
  });
  assert.deepEqual(estilos.carouselArrowIconStyle, {
    display: "block",
    width: "18px",
    height: "18px",
    borderTop: "4px solid #FFFFFF",
    borderRight: "4px solid #FFFFFF",
    filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.92))",
    pointerEvents: "none",
    boxSizing: "border-box",
  });
  assert.deepEqual(estilos.carouselArrowLeftIconStyle, {
    ...estilos.carouselArrowIconStyle,
    transform: "rotate(-135deg)",
  });
  assert.deepEqual(estilos.carouselArrowRightIconStyle, {
    ...estilos.carouselArrowIconStyle,
    transform: "rotate(45deg)",
  });
  assert.deepEqual(estilos.carouselArrowLeftStyle, {
    ...estilos.carouselArrowButtonStyle,
    left: "-10px",
  });
  assert.deepEqual(estilos.carouselArrowRightStyle, {
    ...estilos.carouselArrowButtonStyle,
    right: "-10px",
  });
  assert.deepEqual(estilos.carouselStyle, {
    display: "flex",
    alignItems: "stretch",
    gap: "16px",
    width: "calc(100% + 24px)",
    maxWidth: "calc(100% + 24px)",
    minWidth: 0,
    boxSizing: "border-box",
    overflowX: "auto",
    overflowY: "hidden",
    padding: "4px 12px 22px",
    margin: "0 -12px",
    scrollSnapType: "x mandatory",
    scrollPaddingLeft: "12px",
    scrollPaddingRight: "12px",
    scrollbarWidth: "none",
    overscrollBehaviorX: "contain",
  });
  assert.deepEqual(estilos.desktopCarouselStyle, {
    ...estilos.carouselStyle,
    gap: "22px",
    width: "calc(100% + 24px)",
    maxWidth: "calc(100% + 24px)",
    padding: "8px 12px 30px",
    margin: "0 -12px",
    scrollPaddingLeft: "12px",
    scrollPaddingRight: "12px",
  });
});

test("preserva estilos e helpers dos cabeçalhos das seções", () => {
  assert.deepEqual(estilos.sectionStyle, {
    marginTop: "32px",
    paddingBottom: "14px",
    maxWidth: "100%",
    boxSizing: "border-box",
    minWidth: 0,
  });
  assert.deepEqual(estilos.desktopSectionStyle, {
    ...estilos.sectionStyle,
    marginTop: "40px",
    paddingBottom: "18px",
  });
  assert.deepEqual(estilos.sectionHeaderStyle, {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    justifyItems: "center",
    gap: "6px",
    marginBottom: "14px",
    maxWidth: "100%",
    minWidth: 0,
    textAlign: "center",
  });
  assert.deepEqual(estilos.desktopSectionHeaderStyle, {
    ...estilos.sectionHeaderStyle,
    padding: "8px 0 12px",
    borderRadius: 0,
  });
  assert.deepEqual(estilos.sectionTitleStyle, {
    margin: 0,
    color: "#FFFFFF",
    fontSize: "clamp(24px, 4vw, 30px)",
    lineHeight: 1.05,
    fontWeight: 950,
    letterSpacing: "-0.03em",
    maxWidth: "100%",
    textAlign: "center",
    textShadow: "none",
    ...estilos.safeTextStyle,
  });
  assert.deepEqual(estilos.sectionHeaderContentStyle, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    minWidth: 0,
    textAlign: "center",
  });
  assert.deepEqual(estilos.desktopSectionHeaderContentStyle, {
    ...estilos.sectionHeaderContentStyle,
    justifyContent: "center",
    textAlign: "center",
  });
  assert.deepEqual(estilos.sectionTextBlockStyle, {
    minWidth: 0,
    display: "grid",
    justifyItems: "center",
    textAlign: "center",
  });
  assert.deepEqual(estilos.desktopSectionTextBlockStyle, {
    ...estilos.sectionTextBlockStyle,
    maxWidth: "760px",
    textAlign: "center",
  });

  const tema = { accent: "#ABCDEF" };
  assert.deepEqual(estilos.criarSectionHeaderTemaStyle(tema), {
    ...estilos.sectionHeaderStyle,
    background: "transparent",
    border: "none",
    boxShadow: "none",
  });
  assert.deepEqual(estilos.criarDesktopSectionHeaderTemaStyle(tema), {
    ...estilos.desktopSectionHeaderStyle,
    background: "transparent",
    border: "none",
    boxShadow: "none",
  });
  assert.deepEqual(estilos.criarSectionIconStyle(tema), {
    width: "auto",
    height: "auto",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    color: "#ABCDEF",
    fontSize: "28px",
    lineHeight: 1,
    flex: "0 0 auto",
    boxShadow: "none",
  });
});

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

test("preserva as bases mobile, desktop e indisponíveis dos cards", () => {
  assert.equal(estilos.cardStyle.flex, "0 0 min(360px, 88vw)");
  assert.equal(estilos.cardStyle.width, "min(360px, 88vw)");
  assert.equal(
    estilos.cardStyle.gridTemplateColumns,
    "minmax(88px, 98px) minmax(0, 1fr)",
  );
  assert.equal(estilos.cardStyle.padding, "11px");
  assert.equal(estilos.cardStyle.borderRadius, "22px");
  assert.equal(
    estilos.cardStyle.background,
    "var(--historietas-em-alta-rgba-4-0-10-0-72, rgba(4, 0, 10, 0.72))",
  );
  assert.equal(estilos.cardStyle.border, "1px solid rgba(255,255,255,0.06)");
  assert.equal(estilos.cardStyle.maxWidth, "88vw");
  assert.equal(estilos.cardStyle.cursor, "pointer");
  assert.equal(estilos.cardStyle.touchAction, "manipulation");
  assert.equal(estilos.cardStyle.userSelect, "none");

  assert.equal(estilos.desktopCardStyle.flex, "0 0 calc((100% - 44px) / 3)");
  assert.equal(estilos.desktopCardStyle.width, "calc((100% - 44px) / 3)");
  assert.equal(estilos.desktopCardStyle.gridTemplateColumns, "112px minmax(0, 1fr)");
  assert.equal(estilos.desktopCardStyle.gap, "15px");
  assert.equal(estilos.desktopCardStyle.padding, "13px");
  assert.equal(estilos.desktopCardStyle.borderRadius, "24px");
  assert.equal(estilos.cardSoonStyle.opacity, 0.9);
  assert.equal(estilos.cardSoonStyle.width, estilos.cardStyle.width);
  assert.equal(estilos.desktopCardSoonStyle.opacity, 0.9);
  assert.equal(
    estilos.desktopCardSoonStyle.width,
    estilos.desktopCardStyle.width,
  );
});

test("cria cards de ranking com a base e o tema de cada posição", () => {
  const mobileDisponivel = estilos.criarCardRankingStyle(1, true, "geral");
  const desktopDisponivel = estilos.criarCardRankingStyle(2, true, "lidas", true);
  const mobileIndisponivel = estilos.criarCardRankingStyle(3, false, "curtidas");
  const desktopIndisponivel = estilos.criarCardRankingStyle(
    4,
    false,
    "comentadas",
    true,
  );

  assert.equal(mobileDisponivel.width, estilos.cardStyle.width);
  assert.equal(
    mobileDisponivel.background,
    "var(--historietas-em-alta-hex-2486c2, #2486C2)",
  );
  assert.equal(
    mobileDisponivel.border,
    "1px solid var(--historietas-em-alta-rgba-125-211-252-0-78, rgba(125,211,252,0.78))",
  );
  assert.equal(desktopDisponivel.width, estilos.desktopCardStyle.width);
  assert.equal(desktopDisponivel.gap, "15px");
  assert.equal(mobileIndisponivel.opacity, 0.9);
  assert.equal(mobileIndisponivel.width, estilos.cardSoonStyle.width);
  assert.equal(desktopIndisponivel.opacity, 0.9);
  assert.equal(desktopIndisponivel.width, estilos.desktopCardSoonStyle.width);
  assert.equal(
    desktopIndisponivel.backgroundColor,
    "var(--historietas-em-alta-hex-7b8aa3, #7B8AA3)",
  );
  assert.equal(desktopIndisponivel.outline, "none");
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

test("preserva estrutura, metadata e status visuais dos cards", () => {
  assert.deepEqual(estilos.coroaNumberStyle, {
    fontSize: "11px",
    fontWeight: 950,
    lineHeight: 1,
    color: "#FFFFFF",
    textShadow: "0 1px 4px rgba(0,0,0,0.28)",
  });
  assert.deepEqual(estilos.cardContentStyle, {
    minWidth: 0,
    maxWidth: "100%",
    boxSizing: "border-box",
    display: "grid",
    alignContent: "center",
    gap: "7px",
  });
  assert.deepEqual(estilos.desktopCardContentStyle, {
    ...estilos.cardContentStyle,
    gap: "7px",
    alignContent: "center",
  });
  assert.deepEqual(estilos.cardTopStyle, {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "8px",
    minWidth: 0,
  });
  assert.deepEqual(estilos.statusRowStyle, {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    minWidth: 0,
  });
  assert.deepEqual(estilos.cardMetaRowStyle, {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    maxWidth: "100%",
    minWidth: 0,
  });
  assert.deepEqual(estilos.rankingCardActionRowStyle, {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "2px",
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    boxSizing: "border-box",
  });
  assert.deepEqual(estilos.desktopRankingCardActionRowStyle, {
    ...estilos.rankingCardActionRowStyle,
    overflow: "visible",
  });
  assert.deepEqual(estilos.rankingThemeBadgeStyle, {
    flex: "0 1 42%",
    maxWidth: "42%",
    minHeight: "34px",
    padding: "0 10px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "var(--historietas-text-primary, #FFFFFF)",
    fontSize: "11px",
    fontWeight: 900,
    lineHeight: 1.12,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    boxSizing: "border-box",
    ...estilos.safeTextStyle,
  });
  assert.deepEqual(estilos.desktopRankingThemeBadgeStyle, {
    ...estilos.rankingThemeBadgeStyle,
    flex: "0 1 46%",
    maxWidth: "46%",
    padding: "0 8px",
    textAlign: "center",
    whiteSpace: "normal",
    overflow: "visible",
    textOverflow: "clip",
  });

  assert.deepEqual(estilos.statusStyle, {
    width: "fit-content",
    maxWidth: "100%",
    padding: "6px 9px",
    borderRadius: "999px",
    background:
      "color-mix(in srgb, var(--historietas-accent, #FFFFFF) 14%, transparent)",
    border:
      "1px solid color-mix(in srgb, var(--historietas-accent, #FFFFFF) 28%, transparent)",
    color: "var(--historietas-accent, var(--historietas-em-alta-hex-fdba74, #FDBA74))",
    fontSize: "11px",
    fontWeight: 850,
    whiteSpace: "normal",
    ...estilos.safeTextStyle,
  });
  assert.deepEqual(estilos.publishedStatusStyle, {
    width: "fit-content",
    maxWidth: "100%",
    padding: "6px 9px",
    borderRadius: "999px",
    background: "var(--historietas-em-alta-rgba-34-197-94-0-14, rgba(34, 197, 94, 0.14))",
    border: "1px solid var(--historietas-em-alta-rgba-34-197-94-0-3, rgba(34, 197, 94, 0.3))",
    color: "var(--historietas-em-alta-hex-86efac, #86EFAC)",
    fontSize: "11px",
    fontWeight: 900,
    whiteSpace: "normal",
    ...estilos.safeTextStyle,
  });
  assert.deepEqual(estilos.formatBadgeStyle, {
    width: "fit-content",
    maxWidth: "100%",
    padding: "5px 8px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.06)",
    border: "none",
    color: "var(--historietas-text-primary, #FFFFFF)",
    fontSize: "10px",
    fontWeight: 900,
    whiteSpace: "normal",
    ...estilos.safeTextStyle,
  });
  assert.deepEqual(estilos.classificationBadgeStyle, {
    width: "fit-content",
    maxWidth: "100%",
    padding: "5px 8px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.06)",
    border: "none",
    color: "var(--historietas-text-primary, #FFFFFF)",
    fontSize: "10px",
    fontWeight: 950,
    whiteSpace: "normal",
    ...estilos.safeTextStyle,
  });
  assert.deepEqual(estilos.authorStyle, {
    margin: 0,
    color: "var(--historietas-text-secondary, var(--historietas-em-alta-hex-d8c8ff, #D8C8FF))",
    fontSize: "12px",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: 450,
    lineHeight: 1.25,
    maxWidth: "100%",
    display: "-webkit-box",
    WebkitLineClamp: 1,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    ...estilos.safeTextStyle,
  });
  assert.deepEqual(estilos.authorLinkStyle, {
    ...estilos.authorStyle,
    textDecoration: "none",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    touchAction: "manipulation",
  });
});

test("preserva métricas e estilos finais dos cards de autor", () => {
  assert.deepEqual(estilos.statsStyle, {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    color: "var(--historietas-text-secondary, #A1A1AA)",
    fontSize: "11px",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: 850,
    maxWidth: "100%",
    minWidth: 0,
  });
  assert.deepEqual(estilos.ratingStatsStyle, {
    ...estilos.statsStyle,
    flexWrap: "nowrap",
  });
  assert.deepEqual(estilos.statsItemStyle, {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    minWidth: 0,
    whiteSpace: "nowrap",
    lineHeight: 1,
  });
  assert.deepEqual(estilos.metricIconStyle, {
    width: "14px",
    minWidth: "14px",
    height: "17px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
    fontSize: "13px",
  });
  assert.deepEqual(estilos.metricValueStyle, {
    display: "inline-block",
    lineHeight: 1,
    whiteSpace: "nowrap",
    color: "#FFFFFF",
  });
  assert.deepEqual(estilos.heartMetricIconStyle, {
    ...estilos.metricIconStyle,
    width: "16px",
    minWidth: "16px",
    fontSize: "13px",
    color: "var(--historietas-em-alta-hex-ef4444, #EF4444)",
  });
  assert.deepEqual(estilos.starMetricIconStyle, {
    ...estilos.metricIconStyle,
    color: "var(--historietas-em-alta-hex-fbbf24, #FBBF24)",
    transform: "translateY(-1px)",
  });
  assert.deepEqual(estilos.authorRankingAvatarInitialStyle, {
    color: "#FFFFFF",
    fontSize: "34px",
    lineHeight: 1,
    fontWeight: 950,
    textShadow: "0 4px 12px rgba(0,0,0,0.42)",
  });
  assert.deepEqual(estilos.authorRankingTitleAreaStyle, {
    ...estilos.cardTopStyle,
    minHeight: "21px",
    paddingRight: "2px",
  });
  assert.deepEqual(estilos.authorRankingMetaStackStyle, {
    display: "grid",
    justifyItems: "start",
    alignItems: "start",
    gap: "5px",
    width: "100%",
    minWidth: 0,
  });
  assert.deepEqual(estilos.authorRankingWorksBadgeStyle, {
    margin: 0,
    color: "var(--historietas-text-secondary, var(--historietas-em-alta-hex-d8c8ff, #D8C8FF))",
    fontSize: "12px",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: 450,
    lineHeight: 1.25,
    width: "fit-content",
    maxWidth: "100%",
    background: "transparent",
    border: "none",
    padding: 0,
    borderRadius: 0,
    whiteSpace: "normal",
    ...estilos.safeTextStyle,
  });
  assert.deepEqual(estilos.authorRankingScoreRowStyle, {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "4px",
    maxWidth: "100%",
    minWidth: 0,
  });
});

test("a página delega toda a fronteira visual", () => {
  const consumidoresVisuais = [
    pagina,
    rankingSection,
    authorsSection,
    header,
  ];
  for (const nome of [
    "coverStyle",
    "desktopCoverStyle",
    "cardStyle",
    "desktopCardStyle",
    "cardSoonStyle",
    "desktopCardSoonStyle",
    "criarCardRankingStyle",
    "safeTextStyle",
    "pageDecorationLayerStyle",
    "mobileTopWaterFadeStyle",
    "desktopTopWaterFadeStyle",
    "pageStyle",
    "containerStyle",
    "desktopContainerStyle",
    "topStyle",
    "titleStyle",
    "titleHeaderStyle",
    "desktopTitleHeaderStyle",
    "headerTitleLinkStyle",
    "desktopHeaderTitleLinkStyle",
    "headerTitleMarkStyle",
    "desktopHeaderTitleMarkStyle",
    "headerTitleTextStyle",
    "desktopHeaderTitleTextStyle",
    "cardTitleStyle",
    "authorRankingCardTitleStyle",
    "criarObraCardTitleRankingStyle",
    "criarAutorCardTitleRankingStyle",
    "highlightBadgeStyle",
    "rankingHighlightBadgeInlineStyle",
    "authorRankingTierBadgeStyle",
    "criarRankingTierInlineBadgeStyle",
    "criarAutorTierInlineBadgeStyle",
    "criarAutorPointsBadgeStyle",
    "carouselShellStyle",
    "desktopCarouselShellStyle",
    "carouselArrowButtonStyle",
    "carouselArrowIconStyle",
    "carouselArrowLeftIconStyle",
    "carouselArrowRightIconStyle",
    "carouselArrowLeftStyle",
    "carouselArrowRightStyle",
    "carouselStyle",
    "desktopCarouselStyle",
    "sectionStyle",
    "desktopSectionStyle",
    "sectionHeaderStyle",
    "desktopSectionHeaderStyle",
    "sectionTitleStyle",
    "sectionHeaderContentStyle",
    "desktopSectionHeaderContentStyle",
    "sectionTextBlockStyle",
    "desktopSectionTextBlockStyle",
    "criarSectionHeaderTemaStyle",
    "criarDesktopSectionHeaderTemaStyle",
    "criarSectionIconStyle",
    "criarRankingCoverStyle",
    "criarAutorAvatarRankingStyle",
    "criarDecoracaoPaginaStyle",
    "coroaNumberStyle",
    "cardContentStyle",
    "desktopCardContentStyle",
    "cardTopStyle",
    "statusRowStyle",
    "cardMetaRowStyle",
    "rankingCardActionRowStyle",
    "desktopRankingCardActionRowStyle",
    "rankingThemeBadgeStyle",
    "desktopRankingThemeBadgeStyle",
    "statusStyle",
    "publishedStatusStyle",
    "formatBadgeStyle",
    "classificationBadgeStyle",
    "authorStyle",
    "authorLinkStyle",
    "statsStyle",
    "ratingStatsStyle",
    "statsItemStyle",
    "metricIconStyle",
    "metricValueStyle",
    "heartMetricIconStyle",
    "starMetricIconStyle",
    "authorRankingAvatarInitialStyle",
    "authorRankingTitleAreaStyle",
    "authorRankingMetaStackStyle",
    "authorRankingWorksBadgeStyle",
    "authorRankingScoreRowStyle",
  ]) {
    assert.match(modulo, new RegExp(`export (?:const|function) ${nome}\\b`));
  }
  for (const nome of [
    "pageDecorationLayerStyle",
    "mobileTopWaterFadeStyle",
    "desktopTopWaterFadeStyle",
    "pageStyle",
    "containerStyle",
    "desktopContainerStyle",
    "titleHeaderStyle",
    "desktopTitleHeaderStyle",
    "headerTitleLinkStyle",
    "desktopHeaderTitleLinkStyle",
    "headerTitleMarkStyle",
    "desktopHeaderTitleMarkStyle",
    "headerTitleTextStyle",
    "desktopHeaderTitleTextStyle",
    "carouselShellStyle",
    "desktopCarouselShellStyle",
    "carouselArrowLeftIconStyle",
    "carouselArrowRightIconStyle",
    "carouselArrowLeftStyle",
    "carouselArrowRightStyle",
    "carouselStyle",
    "desktopCarouselStyle",
    "sectionStyle",
    "desktopSectionStyle",
    "sectionTitleStyle",
    "sectionHeaderContentStyle",
    "desktopSectionHeaderContentStyle",
    "sectionTextBlockStyle",
    "desktopSectionTextBlockStyle",
    "criarSectionHeaderTemaStyle",
    "criarDesktopSectionHeaderTemaStyle",
    "criarSectionIconStyle",
    "criarDecoracaoPaginaStyle",
  ]) {
    assert.ok(
      consumidoresVisuais.some((consumidor) =>
        new RegExp(`\\b${nome}\\b`).test(consumidor),
      ),
      `${nome} permanece consumido pela fronteira visual`,
    );
  }
  for (const nome of [
    "criarRankingCoverStyle",
    "criarCardRankingStyle",
    "criarObraCardTitleRankingStyle",
    "criarRankingTierInlineBadgeStyle",
    "coroaNumberStyle",
    "cardContentStyle",
    "desktopCardContentStyle",
    "cardTopStyle",
    "statusRowStyle",
    "cardMetaRowStyle",
    "rankingCardActionRowStyle",
    "desktopRankingCardActionRowStyle",
    "rankingThemeBadgeStyle",
    "desktopRankingThemeBadgeStyle",
    "statusStyle",
    "publishedStatusStyle",
    "formatBadgeStyle",
    "classificationBadgeStyle",
    "authorLinkStyle",
    "statsStyle",
    "ratingStatsStyle",
    "statsItemStyle",
    "metricIconStyle",
    "metricValueStyle",
    "heartMetricIconStyle",
    "starMetricIconStyle",
  ]) {
    assert.match(componenteObra, new RegExp(`\\b${nome}\\b`));
  }
  assert.match(pagina, /from "\.\/lib\/em-alta-ranking-visual-style-utils";/);
  assert.doesNotMatch(pagina, /function criarRankingCoverStyle\b/);
  assert.doesNotMatch(pagina, /function criarDecoracaoPaginaStyle\b/);
  assert.doesNotMatch(pagina, /const coverStyle: CSSProperties = \{/);
  assert.doesNotMatch(pagina, /const desktopCoverStyle: CSSProperties = \{/);
  assert.doesNotMatch(pagina, /const cardStyle: CSSProperties = \{/);
  assert.doesNotMatch(pagina, /const desktopCardStyle: CSSProperties = \{/);
  assert.doesNotMatch(pagina, /const cardSoonStyle: CSSProperties = \{/);
  assert.doesNotMatch(pagina, /const desktopCardSoonStyle: CSSProperties = \{/);
  assert.doesNotMatch(pagina, /function criarCardRankingStyle\b/);
  for (const nome of [
    "coroaNumberStyle",
    "cardContentStyle",
    "desktopCardContentStyle",
    "cardTopStyle",
    "statusRowStyle",
    "cardMetaRowStyle",
    "rankingCardActionRowStyle",
    "desktopRankingCardActionRowStyle",
    "rankingThemeBadgeStyle",
    "desktopRankingThemeBadgeStyle",
    "statusStyle",
    "publishedStatusStyle",
    "formatBadgeStyle",
    "classificationBadgeStyle",
    "authorStyle",
    "authorLinkStyle",
    "statsStyle",
    "ratingStatsStyle",
    "statsItemStyle",
    "metricIconStyle",
    "metricValueStyle",
    "heartMetricIconStyle",
    "starMetricIconStyle",
    "authorRankingAvatarInitialStyle",
    "authorRankingTitleAreaStyle",
    "authorRankingMetaStackStyle",
    "authorRankingWorksBadgeStyle",
    "authorRankingScoreRowStyle",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`const ${nome}: CSSProperties = \\{`));
  }
  assert.doesNotMatch(pagina, /const safeTextStyle: CSSProperties = \{/);
  assert.doesNotMatch(
    pagina,
    /const pageDecorationLayerStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const mobileTopWaterFadeStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const desktopTopWaterFadeStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(pagina, /const pageStyle: CSSProperties = \{/);
  assert.doesNotMatch(pagina, /const containerStyle: CSSProperties = \{/);
  assert.doesNotMatch(
    pagina,
    /const desktopContainerStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(pagina, /const topStyle: CSSProperties = \{/);
  assert.doesNotMatch(pagina, /const titleStyle: CSSProperties = \{/);
  assert.doesNotMatch(
    pagina,
    /const titleHeaderStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const desktopTitleHeaderStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const headerTitleLinkStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const desktopHeaderTitleLinkStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const headerTitleMarkStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const desktopHeaderTitleMarkStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const headerTitleTextStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const desktopHeaderTitleTextStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(pagina, /const cardTitleStyle: CSSProperties = \{/);
  assert.doesNotMatch(
    pagina,
    /const authorRankingCardTitleStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(pagina, /function criarObraCardTitleRankingStyle\b/);
  assert.doesNotMatch(pagina, /function criarAutorCardTitleRankingStyle\b/);
  assert.doesNotMatch(pagina, /const highlightBadgeStyle: CSSProperties = \{/);
  assert.doesNotMatch(
    pagina,
    /const rankingHighlightBadgeInlineStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const authorRankingTierBadgeStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(pagina, /function criarRankingTierInlineBadgeStyle\b/);
  assert.doesNotMatch(pagina, /function criarAutorTierInlineBadgeStyle\b/);
  assert.doesNotMatch(pagina, /function criarAutorPointsBadgeStyle\b/);
  assert.doesNotMatch(pagina, /const carouselShellStyle: CSSProperties = \{/);
  assert.doesNotMatch(
    pagina,
    /const desktopCarouselShellStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const carouselArrowButtonStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const carouselArrowIconStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const carouselArrowLeftIconStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const carouselArrowRightIconStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const carouselArrowLeftStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const carouselArrowRightStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(pagina, /const carouselStyle: CSSProperties = \{/);
  assert.doesNotMatch(
    pagina,
    /const desktopCarouselStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(pagina, /const sectionStyle: CSSProperties = \{/);
  assert.doesNotMatch(
    pagina,
    /const desktopSectionStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const sectionHeaderStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const desktopSectionHeaderStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const sectionTitleStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const sectionHeaderContentStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const desktopSectionHeaderContentStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const sectionTextBlockStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(
    pagina,
    /const desktopSectionTextBlockStyle: CSSProperties = \{/,
  );
  assert.doesNotMatch(pagina, /function criarSectionHeaderTemaStyle\b/);
  assert.doesNotMatch(
    pagina,
    /function criarDesktopSectionHeaderTemaStyle\b/,
  );
  assert.doesNotMatch(pagina, /function criarSectionIconStyle\b/);
  assert.match(rankingSection, /export function RankingSection\b/);
  assert.match(authorsSection, /export function AutoresEmAltaSection\b/);
  assert.match(
    rankingSection,
    /import \{ RankingCard \} from "\.\/em-alta-ranking-card";/,
  );
  assert.doesNotMatch(rankingSection, /function RankingCard\b/);
  assert.match(componenteObra, /export function RankingCard\b/);
  assert.match(
    authorsSection,
    /import \{ AutorRankingCard \} from "\.\/em-alta-author-ranking-card";/,
  );
  assert.doesNotMatch(authorsSection, /function AutorRankingCard\b/);
  assert.match(componenteAutor, /export function AutorRankingCard\b/);
  assert.doesNotMatch(pagina, /const \w+Style: CSSProperties = \{/);
  assert.doesNotMatch(pagina, /import type \{ CSSProperties \} from "react";/);
  assert.doesNotMatch(pagina, /\bsafeTextStyle\b/);
  assert.match(componenteObra, /<div style=\{cardTopStyle\}>/);
  assert.match(pagina, /useHistorietasTheme\(pageStyle\)/);
  assert.match(
    header,
    /<header style=\{isDesktop \? desktopTitleHeaderStyle : titleHeaderStyle\}>/,
  );
  assert.match(
    modulo,
    /export function criarCardRankingStyle\(\s*posicao: number,\s*disponivel: boolean,\s*_tipo: TipoRanking,\s*isDesktop = false,/,
  );
  assert.doesNotMatch(pagina, /function criarAutorAvatarRankingStyle\b/);
  assert.match(
    componenteAutor,
    /style=\{criarAutorAvatarRankingStyle\(avatarAutor, posicao, isDesktop\)\}/,
  );
  assert.match(
    modulo,
    /export function criarSectionHeaderTemaStyle\(\s*_tema: ReturnType<typeof obterTemaRanking>,\s*\): CSSProperties \{\s*void _tema;/,
  );
  assert.match(
    modulo,
    /export function criarDesktopSectionHeaderTemaStyle\(\s*_tema: ReturnType<typeof obterTemaRanking>,\s*\): CSSProperties \{\s*void _tema;/,
  );
});

test("o módulo permanece visual e sem runtime externo", () => {
  assert.match(modulo, /^import type \{ CSSProperties \} from "react";$/m);
  assert.match(
    modulo,
    /^import \{ obterTemaPosicao \} from "\.\/em-alta-ranking-position-theme";$/m,
  );
  assert.match(
    modulo,
    /^import \{ obterTemaRanking \} from "\.\/em-alta-ranking-category-theme";$/m,
  );
  assert.match(
    modulo,
    /^import type \{ TipoRanking \} from "\.\/em-alta-models";$/m,
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
