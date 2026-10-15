import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-hero-work-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");

const moduloExecutavel = modulo
  .replace(
    'import { normalizarTexto } from "../../lib/utils";\n',
    'const normalizarTexto = (texto) => String(texto).normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().trim();\n',
  )
  .replace(
    [
      'import {',
      '  criarIdentificadoresObraCatalogoHome,',
      '  criarIdentificadoresObraLocalHome,',
      '  normalizarListaIdsHome,',
      '} from "./home-collection-utils";',
      '',
    ].join("\n"),
    [
      'const normalizarListaIdsHome = (lista) => Array.from(new Set(lista.map((item) => item.trim()).filter(Boolean)));',
      'const criarIdentificadoresObraCatalogoHome = (obra) => obra.identificadoresCatalogo || normalizarListaIdsHome([obra.id || "", obra.slug || "", normalizarTexto(obra.titulo)]);',
      'const criarIdentificadoresObraLocalHome = (obra) => obra.identificadoresLocais || normalizarListaIdsHome([obra.id, obra.slug, normalizarTexto(obra.titulo)]);',
      '',
    ].join("\n"),
  )
  .replace(
    'import { compactarNumeroHome } from "./home-format-utils";\n',
    'const compactarNumeroHome = (valor) => `compacto:${valor}`;\n',
  )
  .replace(
    'import { obterTotalComentariosObraHome, obterTotalCurtidasObraHome } from "./home-local-work-utils";\n',
    'const obterTotalCurtidasObraHome = (obra) => Math.max(obra.totalCurtidas || 0, obra.capitulos.filter((capitulo) => capitulo.curtiu).length);\nconst obterTotalComentariosObraHome = (obra) => Math.max(obra.totalComentarios || 0, obra.capitulos.filter((capitulo) => capitulo.comentario.trim()).length);\n',
  )
  .replace(
    'import { formatarGeneroHome } from "./home-metadata-utils";\n',
    'const formatarGeneroHome = (genero) => genero === "fantasia sombria" ? "Fantasia" : genero.trim() || "Não informado";\n',
  );

const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  criarObraHeroLocalHome,
  encontrarObraLocalPorHeroHome,
  formatarSinopseHeroMobile,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function criarObraLocal(sobrescritas = {}) {
  return {
    id: "obra-local",
    titulo: "Obra Local",
    autor: "Autora Local",
    genero: "fantasia sombria",
    formato: "Webnovel",
    classificacaoIndicativa: "Livre",
    sinopse: "Sinopse local",
    tags: ["fantasia"],
    capa: "https://exemplo.test/capa.jpg",
    arquivoObra: { nome: "obra.txt", conteudo: "conteúdo" },
    capitulos: [{ curtiu: true, comentario: "comentário" }],
    visualizacoes: 1200,
    totalCurtidas: 4,
    totalComentarios: 2,
    slug: "obra-local",
    link: "/obra/obra-local",
    ...sobrescritas,
  };
}

function criarHero(sobrescritas = {}) {
  return {
    titulo: "Hero da Home",
    autor: "Autor",
    genero: "Fantasia",
    classificacaoIndicativa: "Livre",
    status: "Publicado",
    views: "",
    likes: "",
    comentarios: "",
    link: "/obra/hero",
    disponivel: true,
    slug: "hero-da-home",
    formato: "História",
    sinopse: "Sinopse",
    tags: [],
    ...sobrescritas,
  };
}

test("home-hero-work-utils cria a obra do Hero com campos, métricas e fallbacks", () => {
  const obraHero = criarObraHeroLocalHome(criarObraLocal());

  assert.deepEqual(obraHero, {
    id: "obra-local",
    titulo: "Obra Local",
    autor: "Autora Local",
    genero: "Fantasia",
    formato: "Webnovel",
    classificacaoIndicativa: "Livre",
    sinopse: "Sinopse local",
    tags: ["fantasia"],
    status: "Em andamento",
    views: "compacto:1200",
    likes: "compacto:4",
    comentarios: "compacto:2",
    disponivel: true,
    capa: "https://exemplo.test/capa.jpg",
    capaUrl: "https://exemplo.test/capa.jpg",
    arquivoObra: { nome: "obra.txt", conteudo: "conteúdo" },
    slug: "obra-local",
    link: "/obra/obra-local",
    capitulos: [{ curtiu: true, comentario: "comentário" }],
  });

  const obraComFallbacks = criarObraHeroLocalHome(criarObraLocal({
    formato: "",
    sinopse: "",
    capitulos: [],
  }));
  assert.equal(obraComFallbacks.formato, "História");
  assert.equal(obraComFallbacks.sinopse, "Nenhuma sinopse informada.");
  assert.equal(obraComFallbacks.status, "Publicado");
  assert.equal(obraComFallbacks.disponivel, true);
});

test("home-hero-work-utils encontra obra local pela ordem atual de identificadores", () => {
  const porFavorito = criarObraLocal({ id: "favorito-hero" });
  assert.equal(
    encontrarObraLocalPorHeroHome([porFavorito], criarHero(), "favorito-hero"),
    porFavorito,
  );

  const porCatalogo = criarObraLocal({ id: "catalogo-hero" });
  assert.equal(
    encontrarObraLocalPorHeroHome([porCatalogo], criarHero({ id: "catalogo-hero" }), ""),
    porCatalogo,
  );

  const porTitulo = criarObraLocal({
    id: "local-titulo",
    titulo: "História Com Acento",
  });
  assert.equal(
    encontrarObraLocalPorHeroHome([porTitulo], criarHero({
      titulo: "historia com acento",
      id: "",
      slug: "",
    }), ""),
    porTitulo,
  );

  const porIdentificadorLocal = criarObraLocal({
    id: "local-diferente",
    identificadoresLocais: ["identificador-local"],
  });
  assert.equal(
    encontrarObraLocalPorHeroHome([porIdentificadorLocal], criarHero({
      identificadoresCatalogo: ["identificador-local"],
    }), ""),
    porIdentificadorLocal,
  );
  assert.equal(encontrarObraLocalPorHeroHome([], criarHero(), ""), null);
});

test("home-hero-work-utils formata a sinopse mobile com espaços, limites e reticências", () => {
  assert.equal(formatarSinopseHeroMobile(undefined), "Nenhuma sinopse informada.");
  assert.equal(formatarSinopseHeroMobile(""), "Nenhuma sinopse informada.");
  assert.equal(formatarSinopseHeroMobile("   "), "Nenhuma sinopse informada.");
  assert.equal(formatarSinopseHeroMobile("  texto    curto "), "texto curto");
  assert.equal(formatarSinopseHeroMobile("abcdefghijklmnopqr"), "abcdefghijklmnopqr");
  assert.equal(formatarSinopseHeroMobile("abcdefghijklmnopqrs"), "abcdefghijklmnop…");

  const textoCom132Caracteres = Array.from(
    { length: 12 },
    (_, indice) => indice === 11 ? "abcdefghijk" : "abcdefghij",
  ).join(" ");
  assert.equal(textoCom132Caracteres.length, 132);
  assert.equal(formatarSinopseHeroMobile(textoCom132Caracteres), textoCom132Caracteres);

  const textoLongo = Array.from({ length: 20 }, () => "palavra").join(" ");
  const sinopseLonga = formatarSinopseHeroMobile(textoLongo);
  assert.equal(sinopseLonga, `${textoLongo.slice(0, 129).trim()}…`);
  assert.equal(sinopseLonga.endsWith("…"), true);
  assert.equal(sinopseLonga.includes("..."), false);
});

test("home-hero-work-utils estabelece a fronteira pura dos dados do Hero", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?criarObraHeroLocalHome,[\s\S]*?encontrarObraLocalPorHeroHome,[\s\S]*?formatarSinopseHeroMobile,[\s\S]*?\} from "\.\/lib\/home-hero-work-utils";/,
  );
  assert.doesNotMatch(pagina, /function criarObraHeroLocalHome\(/);
  assert.doesNotMatch(pagina, /function encontrarObraLocalPorHeroHome\(/);
  assert.doesNotMatch(pagina, /function formatarSinopseHeroMobile\(/);
  assert.match(modulo, /export function criarObraHeroLocalHome(?:<[^>]+>)?\(/);
  assert.match(modulo, /export function encontrarObraLocalPorHeroHome\(/);
  assert.match(modulo, /export function formatarSinopseHeroMobile\(/);
  assert.match(modulo, /palavra\.length <= 18/);
  assert.match(modulo, /palavra\.slice\(0, 16\)}/);
  assert.match(modulo, /textoComPalavrasSeguras\.length <= 132/);
  assert.match(modulo, /textoComPalavrasSeguras\.slice\(0, 129\)/);
  assert.doesNotMatch(modulo, /supabase|localStorage|useEffect|useState|from "react"/);
  assert.doesNotMatch(pagina, /function criarMobileCoverStyle\(/);
  assert.doesNotMatch(pagina, /function criarDesktopHeroPosterStyle\(/);
  assert.doesNotMatch(pagina, /function criarMobileHeroFrameBackground\(/);
});
