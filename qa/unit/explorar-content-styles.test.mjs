import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/explorar/lib/explorar-content-styles.ts", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");
const layout = readFileSync(
  new URL("../../app/explorar/lib/explorar-layout-styles.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/explorar/page.tsx", import.meta.url),
  "utf8",
);
const autorCard = readFileSync(new URL("../../app/explorar/components/explorar-autor-card.tsx", import.meta.url), "utf8");
const obraCard = readFileSync(new URL("../../app/explorar/components/explorar-obra-publicada-card.tsx", import.meta.url), "utf8");
const auxiliares = readFileSync(new URL("../../app/explorar/components/explorar-section-components.tsx", import.meta.url), "utf8");
const secoesCriativasObras = readFileSync(new URL("../../app/explorar/components/explorar-creative-work-sections.tsx", import.meta.url), "utf8");
const secoesObrasGenero = readFileSync(new URL("../../app/explorar/components/explorar-genre-work-sections.tsx", import.meta.url), "utf8");
const secoesObrasFiltradas = readFileSync(new URL("../../app/explorar/components/explorar-filtered-works-section.tsx", import.meta.url), "utf8");
const compilar = (codigo) =>
  typescript.transpileModule(codigo, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
const layoutUrl = `data:text/javascript;base64,${Buffer.from(compilar(layout)).toString("base64")}`;
const executavel = modulo.replace("./explorar-layout-styles", layoutUrl) + `
export {
  explorarCarouselArrowBaseStyle,
  explorarCarouselArrowIconBaseStyle,
  publishedCardStyle,
  desktopPublishedCardStyle,
  publishedCoverStyle,
  desktopPublishedCoverStyle,
  progressTrackStyle,
  progressBarStyle,
  readStyle,
  cardPrimaryActionStyle,
  desktopCardPrimaryActionStyle,
};
`;
const estilos = await import(
  `data:text/javascript;base64,${Buffer.from(compilar(executavel)).toString("base64")}`,
);

test("o bloco visual preserva literalmente as declarações originais", () => {
  const original = modulo
    .replace(/export function criarPublishedCoverStyle\([\s\S]*?\n}\n\n/, "")
    .replace(/^import type[^\n]+\nimport \{[\s\S]*?\} from "\.\/explorar-layout-styles";\n\n/, "")
    .replace(/^export (?=const|function)/gm, "")
    .trimEnd();
  assert.equal(
    createHash("sha256").update(original).digest("hex"),
    "be0067a2e5048faadaed479d1537d25ddeb459675fa840b67ba5de080390ef4a",
  );
});

test("seções, carrosséis, setas e autores mantêm variantes e spreads", () => {
  assert.deepEqual(estilos.desktopSectionStyle, {
    ...estilos.sectionStyle,
    marginTop: "30px",
  });
  assert.deepEqual(estilos.desktopSectionHeaderStyle, estilos.sectionHeaderStyle);
  assert.deepEqual(estilos.desktopSectionTitleStyle, {
    ...estilos.sectionTitleStyle,
    fontSize: "24px",
  });
  assert.equal(estilos.obrasExplorarCarouselStyle.scrollSnapType, "x mandatory");
  assert.equal(estilos.desktopObrasExplorarCarouselStyle.width, "100vw");
  assert.equal(estilos.autoresExplorarCarouselStyle.gap, "12px");
  assert.equal(estilos.desktopAutoresExplorarCarouselStyle.gap, "16px");
  assert.deepEqual(estilos.explorarCarouselArrowLeftStyle, {
    ...estilos.explorarCarouselArrowBaseStyle,
    left: "-10px",
  });
  assert.deepEqual(estilos.explorarCarouselArrowRightIconStyle, {
    ...estilos.explorarCarouselArrowIconBaseStyle,
    transform: "rotate(45deg)",
  });
  assert.deepEqual(estilos.desktopAutoresExplorarGridStyle, {
    ...estilos.autoresExplorarGridStyle,
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "16px",
  });
  assert.equal(estilos.autorExplorarCardStyle.width, "min(318px, 84vw)");
  assert.equal(estilos.desktopAutorExplorarCardStyle.width, "356px");
  assert.equal(estilos.autorExplorarGridCardStyle.width, "100%");
  assert.equal(estilos.desktopAutorExplorarGridCardStyle.width, "100%");
});

test("cards de obras preservam temas, capas, progresso e ações", () => {
  assert.deepEqual(estilos.criarPublishedCardTemaStyle(), {
    ...estilos.publishedCardStyle,
    background: "transparent",
    border: "none",
    boxShadow: "none",
  });
  assert.deepEqual(estilos.criarDesktopPublishedCardTemaStyle(), {
    ...estilos.desktopPublishedCardStyle,
    background: "transparent",
    border: "none",
    boxShadow: "none",
  });
  const fundo = "linear-gradient(135deg, #050505 0%, #000000 100%)";
  assert.deepEqual(estilos.criarPublishedCoverTemaStyle(), {
    ...estilos.publishedCoverStyle,
    backgroundImage: fundo,
    backgroundSize: "cover",
    backgroundPosition: "center",
  });
  assert.deepEqual(estilos.criarPublishedCoverStyle(""), estilos.criarPublishedCoverTemaStyle());
  assert.deepEqual(estilos.criarPublishedCoverStyle("capa.png"), {
    ...estilos.criarPublishedCoverTemaStyle(),
    backgroundImage: "url(capa.png)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "none",
    opacity: 1,
  });
  const capaVazia = estilos.criarDesktopPublishedCoverStyle("");
  assert.deepEqual(capaVazia, {
    ...estilos.desktopPublishedCoverStyle,
    backgroundImage: fundo,
    backgroundSize: "cover",
    backgroundPosition: "center",
  });
  assert.deepEqual(estilos.criarDesktopPublishedCoverStyle("capa.png"), {
    ...capaVazia,
    backgroundImage: "url(capa.png)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "none",
    opacity: 1,
  });
  assert.equal(estilos.criarProgressTrackStyle(), estilos.progressTrackStyle);
  assert.equal(estilos.criarProgressBarStyle(), estilos.progressBarStyle);
  const leitura = {
    ...estilos.readStyle,
    color: "#FFFFFF",
    background: "var(--historietas-bg-start, #000000)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "none",
  };
  assert.deepEqual(estilos.criarCardPrimaryActionStyle(false), {
    ...leitura,
    ...estilos.cardPrimaryActionStyle,
  });
  assert.deepEqual(estilos.criarCardPrimaryActionStyle(true), {
    ...leitura,
    ...estilos.desktopCardPrimaryActionStyle,
  });
  assert.equal(estilos.desktopPublishedGridStyle.gridTemplateColumns, "repeat(auto-fit, 360px)");
  assert.equal(estilos.desktopPublishedTitleStyle.fontSize, "20px");
});

test("o módulo de estilos é estático e a página continua consumindo os estilos", () => {
  const importacao = pagina.match(/import \{\s*((?:\w+,\s*)+)\} from "\.\/lib\/explorar-content-styles";/);
  assert.ok(importacao);
  const nomes = importacao[1].split(",").map((nome) => nome.trim()).filter(Boolean);
  const importacaoAutor = autorCard.match(/import \{\s*((?:\w+,\s*)+)\} from "\.\.\/lib\/explorar-content-styles";/);
  const importacaoObra = obraCard.match(/import \{\s*((?:\w+,\s*)+)\} from "\.\.\/lib\/explorar-content-styles";/);
  const importacaoAuxiliares = auxiliares.match(/import \{\s*((?:\w+,\s*)+)\} from "\.\.\/lib\/explorar-content-styles";/);
  const importacaoCriativas = secoesCriativasObras.match(/import \{\s*((?:\w+,\s*)+)\} from "\.\.\/lib\/explorar-content-styles";/);
  const importacaoGenero = secoesObrasGenero.match(/import \{\s*((?:\w+,\s*)+)\} from "\.\.\/lib\/explorar-content-styles";/);
  const importacaoFiltradas = secoesObrasFiltradas.match(/import \{\s*((?:\w+,\s*)+)\} from "\.\.\/lib\/explorar-content-styles";/);
  assert.ok(importacaoAutor);
  assert.ok(importacaoObra);
  assert.ok(importacaoAuxiliares);
  assert.ok(importacaoCriativas);
  assert.ok(importacaoGenero);
  assert.ok(importacaoFiltradas);
  nomes.push(...importacaoAutor[1].split(",").map((nome) => nome.trim()).filter(Boolean));
  nomes.push(...importacaoObra[1].split(",").map((nome) => nome.trim()).filter(Boolean));
  nomes.push(...importacaoAuxiliares[1].split(",").map((nome) => nome.trim()).filter(Boolean));
  nomes.push(...importacaoCriativas[1].split(",").map((nome) => nome.trim()).filter(Boolean));
  nomes.push(...importacaoGenero[1].split(",").map((nome) => nome.trim()).filter(Boolean));
  nomes.push(...importacaoFiltradas[1].split(",").map((nome) => nome.trim()).filter(Boolean));
  assert.equal(nomes.length, 80);
  for (const nome of nomes) {
    assert.match(modulo, new RegExp(`export (?:const|function) ${nome}\\b`));
    assert.doesNotMatch(pagina, new RegExp(`(?:const|function) ${nome}\\b`));
  }
  assert.match(modulo, /from "\.\/explorar-layout-styles"/);
  assert.match(pagina, /isDesktop \? desktopSectionStyle : sectionStyle/);
  assert.match(secoesCriativasObras, /desktopExplorarObraCarouselItemStyle/);
  assert.match(secoesObrasGenero, /explorarObraCarouselItemStyle/);
  assert.match(secoesObrasFiltradas, /desktopPublishedGridStyle/);
  assert.match(obraCard, /criarDesktopPublishedCoverStyle\(obra\.capa/);
  assert.doesNotMatch(modulo, /\b(?:supabase|localStorage|window|document|useEffect|useState)\b/i);
  assert.doesNotMatch(modulo, /<(?:div|section|article)\b/);
});
