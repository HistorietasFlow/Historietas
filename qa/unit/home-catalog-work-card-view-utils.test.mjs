import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL(
    "../../app/lib/home-catalog-work-card-view-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const secoes = readFileSync(
  new URL("../../components/HomeContentSections.tsx", import.meta.url),
  "utf8",
);const componente = readFileSync(
  new URL("../../components/HomeCatalogWorkCard.tsx", import.meta.url),
  "utf8",
);
const moduloExecutavel = modulo
  .replace(
    /import \{[\s\S]*?\} from "\.\/home-catalog-utils";\r?\n/,
    `const obterTotalCapitulosObraCatalogoHome = (obra) => Array.isArray(obra.capitulos) ? obra.capitulos.length : 0;
const obraCatalogoTemArquivoAnexadoHome = (obra) => Boolean(obra.arquivoObra?.nome?.trim() && obra.arquivoObra?.conteudo?.trim());
`,
  )
  .replace(
    /import \{ compactarNumeroHome \} from "\.\/home-format-utils";\r?\n/,
    `const compactarNumeroHome = (valor) => \`compacto:\${valor}\`;
`,
  )
  .replace(
    /import \{ criarHrefObraCatalogoHome \} from "\.\/home-route-utils";\r?\n/,
    `const criarHrefObraCatalogoHome = (obra) => {
  if (obra.link?.trim()) return obra.link.trim();
  if (!obra.disponivel) return "/explorar";
  return \`/obra/\${obra.slug?.trim() || obra.titulo.toLowerCase().replaceAll(" ", "-")}\`;
};
`,
  );
const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { criarDadosObraCatalogoCardHome } = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function criarObra(sobrescritas = {}) {
  return {
    arquivoObra: undefined,
    capitulos: [],
    disponivel: true,
    link: "",
    slug: "obra-catalogo",
    titulo: "Obra de Catálogo",
    ...sobrescritas,
  };
}

test("home-catalog-work-card-view-utils preserva href e conteúdo por capítulos", () => {
  const dados = criarDadosObraCatalogoCardHome(
    criarObra({
      capitulos: [{ id: "capitulo-1" }, { id: "capitulo-2" }],
      link: "/obra/link-original",
    }),
  );

  assert.deepEqual(dados, {
    obraHref: "/obra/link-original",
    iconeConteudoObra: "📚",
    totalConteudoObra: "compacto:2",
  });
});

test("home-catalog-work-card-view-utils preserva arquivo como conteúdo único", () => {
  const dados = criarDadosObraCatalogoCardHome(
    criarObra({
      arquivoObra: { conteudo: "conteúdo", nome: "obra.pdf" },
      capitulos: [{ id: "capitulo-1" }, { id: "capitulo-2" }],
    }),
  );

  assert.deepEqual(dados, {
    obraHref: "/obra/obra-catalogo",
    iconeConteudoObra: "📄",
    totalConteudoObra: "compacto:1",
  });
});

test("home-catalog-work-card-view-utils preserva o fallback da rota da obra", () => {
  assert.equal(
    criarDadosObraCatalogoCardHome(criarObra({ disponivel: false })).obraHref,
    "/explorar",
  );
});

test("home-catalog-work-card-view-utils estabelece a fronteira pura do card de catálogo", () => {
  assert.match(modulo, /export function criarDadosObraCatalogoCardHome\(/);
  assert.match(modulo, /const obraHref = criarHrefObraCatalogoHome\(obra\);/);
  assert.match(modulo, /const obraTemArquivo = obraCatalogoTemArquivoAnexadoHome\(obra\);/);
  assert.match(modulo, /obraTemArquivo \? "📄" : "📚"/);
  assert.match(
    modulo,
    /obraTemArquivo \? 1 : obterTotalCapitulosObraCatalogoHome\(obra\)/,
  );
  assert.match(modulo, /const totalConteudoObra = compactarNumeroHome\(/);
  assert.doesNotMatch(modulo, /supabase|localStorage|useEffect|useState|from "react"/);
  assert.match(componente, /export default function MobileObraCard\(/);
  assert.match(componente, /from "\.\.\/app\/lib\/home-catalog-work-card-view-utils";/);
  assert.match(componente, /criarDadosObraCatalogoCardHome\(obra\)/);
  assert.match(componente, /\{obra\.disponivel \? "Ver obra" : "Ver detalhes"\}/);
  assert.match(secoes, /import MobileObraCard from "\.\/HomeCatalogWorkCard";/);
  assert.doesNotMatch(pagina, /function MobileObraCard\(/);
  assert.doesNotMatch(
    pagina,
    /const obraTemArquivo = obraCatalogoTemArquivoAnexadoHome\(obra\);/,
  );
});
