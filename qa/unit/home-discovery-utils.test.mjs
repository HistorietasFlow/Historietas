import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-discovery-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const recomendacoes = readFileSync(
  new URL("../../app/lib/home-recommendation-list-utils.ts", import.meta.url),
  "utf8",
);
const moduloExecutavel = modulo
  .replace(
    'import { normalizarTexto } from "../../lib/utils";\n',
    `const normalizarTexto = (valor) => String(valor || "")
  .normalize("NFD")
  .replace(/[\\u0300-\\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();
`,
  )
  .replace(
    'import { formatarGeneroHome } from "./home-metadata-utils";\n',
    `const formatarGeneroHome = (genero) => {
  const generoLimpo = genero.trim();
  const generoNormalizado = normalizarTexto(generoLimpo);
  if (generoNormalizado === "fantasia sombria") return "Fantasia";
  if (["sci-fi", "sci fi", "scifi", "cyberpunk"].includes(generoNormalizado)) return "Ficção";
  return generoLimpo || "Não informado";
};
`,
  );
const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  obraCatalogoCombinaBuscaHome,
  obraCatalogoCombinaComTemasRecomendados,
  obraCatalogoCombinaTemas,
  obraCombinaComTemasRecomendados,
  obraLocalCombinaBusca,
  obterTemasRecomendacaoObra,
  obterTemasRecomendacaoObraCatalogo,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

const obraLocal = {
  titulo: "Aurora Distante",
  autor: "Ana Souza",
  genero: "Fantasia Sombria",
  formato: "Webnovel",
  classificacaoIndicativa: "12 anos",
  sinopse: "Uma jornada pela lua.",
  tags: ["Magia", "Lua"],
  capaNome: "aurora-capa.png",
  capitulos: [{ titulo: "Capítulo Eclipse" }],
};

const obraCatalogo = {
  titulo: "Código Lunar",
  autor: "Bruno Lima",
  genero: "Sci-Fi",
  classificacaoIndicativa: "Livre",
  status: "Em andamento",
};

test("home-discovery-utils preserva busca local vazia e seus campos pesquisáveis", () => {
  assert.equal(obraLocalCombinaBusca(obraLocal, ""), true);

  for (const termoBusca of ["aurora", "ana souza", "fantasia", "magia", "capitulo eclipse"]) {
    assert.equal(
      obraLocalCombinaBusca(obraLocal, termoBusca),
      true,
      `busca local deveria encontrar ${termoBusca}`,
    );
  }
  assert.equal(obraLocalCombinaBusca(obraLocal, "inexistente"), false);
});

test("home-discovery-utils preserva a busca do catálogo e o gênero formatado", () => {
  assert.equal(obraCatalogoCombinaBuscaHome(obraCatalogo, ""), true);
  assert.equal(obraCatalogoCombinaBuscaHome(obraCatalogo, "codigo lunar"), true);
  assert.equal(obraCatalogoCombinaBuscaHome(obraCatalogo, "bruno"), true);
  assert.equal(obraCatalogoCombinaBuscaHome(obraCatalogo, "ficcao"), true);
  assert.equal(obraCatalogoCombinaBuscaHome(obraCatalogo, "ausente"), false);
});

test("home-discovery-utils preserva temas, deduplicação e filtros literais", () => {
  assert.deepEqual(
    obterTemasRecomendacaoObra({
      ...obraLocal,
      formato: "Não informado",
      tags: ["Fantasia", "sem tags", "Aventura", "aventura"],
    }),
    ["fantasia sombria", "fantasia", "aventura"],
  );
  assert.deepEqual(
    obterTemasRecomendacaoObraCatalogo({
      ...obraCatalogo,
      status: "Não informado",
      classificacaoIndicativa: "Não informado",
    }),
    ["sci fi", "ficcao"],
  );
});

test("home-discovery-utils preserva matching de temas e Set vazio", () => {
  assert.equal(obraCombinaComTemasRecomendados(obraLocal, new Set()), false);
  assert.equal(
    obraCombinaComTemasRecomendados(obraLocal, new Set(["magia"])),
    true,
  );
  assert.equal(
    obraCatalogoCombinaComTemasRecomendados(obraCatalogo, new Set(["ficcao"])),
    true,
  );
  assert.equal(
    obraCatalogoCombinaComTemasRecomendados(obraCatalogo, new Set(["terror"])),
    false,
  );
  assert.equal(obraCatalogoCombinaTemas(obraCatalogo, ["código", "terror"]), true);
  assert.equal(obraCatalogoCombinaTemas(obraCatalogo, ["romance"]), false);
});

test("home-discovery-utils estabelece a fronteira pura da Home", () => {
  assert.match(modulo, /import \{ normalizarTexto \} from "\.\.\/\.\.\/lib\/utils";/);
  assert.match(modulo, /import \{ formatarGeneroHome \} from "\.\/home-metadata-utils";/);
  for (const nomeFuncao of [
    "obraLocalCombinaBusca",
    "obraCatalogoCombinaBuscaHome",
    "obterTemasRecomendacaoObra",
    "obterTemasRecomendacaoObraCatalogo",
    "obraCombinaComTemasRecomendados",
    "obraCatalogoCombinaComTemasRecomendados",
    "obraCatalogoCombinaTemas",
  ]) {
    assert.match(modulo, new RegExp(`export function ${nomeFuncao}\\b`));
    assert.doesNotMatch(pagina, new RegExp(`function ${nomeFuncao}\\b`));
  }
  assert.match(recomendacoes, /from "\.\/home-discovery-utils";/);
  assert.match(pagina, /from "\.\/lib\/home-recommendation-list-utils";/);
  assert.doesNotMatch(modulo, /supabase|localStorage|useEffect|useState/);
});
