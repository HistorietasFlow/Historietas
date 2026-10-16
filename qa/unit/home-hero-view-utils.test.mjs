import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-hero-view-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");

const moduloExecutavel = modulo
  .replace(
    `import {
  criarIdentificadoresObraCatalogoHome,
  colecaoTemIdentificadorHome,
  obterIdentificadorFavoritoHome,
} from "./home-collection-utils";
`,
    `const criarIdentificadoresObraCatalogoHome = (obra) => [obra.id || "", obra.slug || "", obra.titulo.toLowerCase()];
const colecaoTemIdentificadorHome = (identificadores, colecao) => identificadores.some((identificador) => colecao.map((item) => item.trim()).includes(identificador));
const obterIdentificadorFavoritoHome = (obra) => obra.id?.trim() || obra.slug?.trim() || obra.titulo.toLowerCase();
`,
  )
  .replace(
    `import {
  obterImagemObraCatalogo,
  obterTotalCapitulosObraCatalogoHome,
  obraCatalogoTemArquivoAnexadoHome,
} from "./home-catalog-utils";
`,
    `const obterImagemObraCatalogo = (obra) => [obra.capa, obra.capaUrl, obra.cover, obra.imagem].find((imagem) => typeof imagem === "string" && imagem.trim()) || "";
const obterTotalCapitulosObraCatalogoHome = (obra) => Array.isArray(obra.capitulos) ? obra.capitulos.length : 0;
const obraCatalogoTemArquivoAnexadoHome = (obra) => Boolean(obra.arquivoObra?.nome?.trim() && obra.arquivoObra?.conteudo?.trim());
`,
  )
  .replace(
    'import { compactarNumeroHome } from "./home-format-utils";\n',
    'const compactarNumeroHome = (valor) => String(valor);\n',
  )
  .replace(
    'import { criarHrefObraCatalogoHome } from "./home-route-utils";\n',
    'const criarHrefObraCatalogoHome = (obra) => obra.link || `/obra/${obra.slug}`;\n',
  );
const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { criarDadosHeroHome } = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function criarObra(sobrescritas = {}) {
  return {
    id: "obra-1",
    titulo: "Obra Heroica",
    disponivel: true,
    slug: "obra-heroica",
    link: "/obra/obra-heroica",
    capa: "",
    capitulos: [],
    views: "12",
    likes: "8",
    comentarios: "3",
    ...sobrescritas,
  };
}

function criarDados(sobrescritas = {}) {
  return criarDadosHeroHome({
    obrasHero: [],
    heroIndex: 0,
    heroInicial: criarObra({
      id: "",
      titulo: "Historietas",
      link: "/explorar",
      views: "",
      likes: "",
      comentarios: "",
    }),
    usuarioLogado: false,
    obrasFavoritas: [],
    ...sobrescritas,
  });
}

test("criarDadosHeroHome preserva o Hero inicial e seus fallbacks", () => {
  const dados = criarDados();

  assert.equal(dados.usandoHeroInicial, true);
  assert.equal(dados.heroObra.titulo, "Historietas");
  assert.equal(dados.heroObraHref, "/explorar");
  assert.equal(dados.heroTemImagem, false);
  assert.equal(dados.heroFavoritoId, "");
  assert.equal(dados.heroTotalCapitulos, 0);
  assert.equal(dados.desktopHeroTemArquivo, false);
  assert.equal(dados.desktopHeroTotalConteudo, "0");
  assert.equal(dados.heroEstaSalvo, false);
});

test("criarDadosHeroHome seleciona o índice válido e cai na primeira obra quando inválido", () => {
  const primeira = criarObra({ id: "primeira", titulo: "Primeira", link: "/obra/primeira" });
  const segunda = criarObra({
    id: "segunda",
    titulo: "Segunda",
    link: "/obra/segunda",
    capa: "https://exemplo.test/capa.jpg",
    capitulos: [{}, {}],
  });

  const porIndice = criarDados({ obrasHero: [primeira, segunda], heroIndex: 1 });
  assert.equal(porIndice.usandoHeroInicial, false);
  assert.equal(porIndice.heroObra, segunda);
  assert.equal(porIndice.heroObraHref, "/obra/segunda");
  assert.equal(porIndice.heroTemImagem, true);
  assert.equal(porIndice.heroFavoritoId, "segunda");
  assert.equal(porIndice.heroTotalCapitulos, 2);
  assert.equal(porIndice.desktopMetricasHeroHome.at(-1).icone, "📚");
  assert.equal(porIndice.desktopMetricasHeroHome.at(-1).valor, "2");

  const indiceInvalido = criarDados({ obrasHero: [primeira, segunda], heroIndex: 99 });
  assert.equal(indiceInvalido.heroObra, primeira);
});

test("criarDadosHeroHome preserva arquivo, métricas e coleção de favoritos", () => {
  const obra = criarObra({
    id: "obra-salva",
    arquivoObra: { nome: "obra.txt", conteudo: "conteúdo" },
    views: "",
    likes: "",
    comentarios: "",
  });
  const dados = criarDados({
    obrasHero: [obra],
    usuarioLogado: true,
    obrasFavoritas: [" obra-salva "],
  });

  assert.deepEqual(dados.metricasHeroHome, [
    { icone: "👁️", valor: "0" },
    { icone: "❤️", valor: "0", destaque: true },
    { icone: "💬", valor: "0" },
  ]);
  assert.equal(dados.desktopHeroTemArquivo, true);
  assert.equal(dados.desktopHeroTotalConteudo, "1");
  assert.equal(dados.desktopMetricasHeroHome.at(-1).icone, "📄");
  assert.equal(dados.heroEstaSalvo, true);

  assert.equal(
    criarDados({ obrasHero: [obra], usuarioLogado: false, obrasFavoritas: ["obra-salva"] })
      .heroEstaSalvo,
    false,
  );
  assert.equal(
    criarDados({ obrasHero: [obra], usuarioLogado: true, obrasFavoritas: [] }).heroEstaSalvo,
    false,
  );
});

test("home-hero-view-utils estabelece uma fronteira pura para os dados do Hero", () => {
  assert.match(modulo, /import \{ criarHrefObraCatalogoHome \} from "\.\/home-route-utils";/);
  assert.match(modulo, /import \{ compactarNumeroHome \} from "\.\/home-format-utils";/);
  assert.match(modulo, /export function criarDadosHeroHome/);
  assert.match(modulo, /const usandoHeroInicial = obrasHero\.length === 0;/);
  assert.match(modulo, /obrasHero\[heroIndex\] \|\| obrasHero\[0\] \|\| heroInicial/);
  assert.match(modulo, /usandoHeroInicial \? "\/explorar" : criarHrefObraCatalogoHome\(heroObra\)/);
  assert.match(modulo, /icone: "👁️", valor: heroObra\.views \|\| "0"/);
  assert.match(modulo, /icone: "❤️", valor: heroObra\.likes \|\| "0", destaque: true/);
  assert.match(modulo, /icone: desktopHeroTemArquivo \? "📄" : "📚"/);
  assert.doesNotMatch(modulo, /useMemo|useState|useEffect|supabase|localStorage/);
  assert.match(pagina, /import \{ criarDadosHeroHome \} from "\.\/lib\/home-hero-view-utils";/);
  assert.match(pagina, /const \{[\s\S]*?heroEstaSalvo,[\s\S]*?\} = criarDadosHeroHome\(/);
  assert.match(pagina, /useHomeHeroCarousel\(/);
  assert.match(pagina, /function alternarHeroFavorito\(\)/);
  assert.doesNotMatch(pagina, /const usandoHeroInicial = obrasHero\.length === 0;/);
});
