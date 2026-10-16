import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-hero-selection-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");

const moduloExecutavel = modulo
  .replace(
    'import { normalizarTexto } from "../../lib/utils";\n',
    `const normalizarTexto = (valor) => String(valor || "")
  .normalize("NFD")
  .replace(/[\\u0300-\\u036f]/g, "")
  .toLowerCase()
  .trim();
`,
  )
  .replace(
    'import { criarObraHeroLocalHome } from "./home-hero-work-utils";\n',
    'const criarObraHeroLocalHome = (obra) => ({ ...obra, convertidaParaHero: true });\n',
  )
  .replace(
    'import { formatarGeneroHome } from "./home-metadata-utils";\n',
    'const formatarGeneroHome = (genero) => String(genero || "").trim() || "Não informado";\n',
  );
const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { criarObrasHeroHome } = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function criarObra(titulo, sobrescritas = {}) {
  return {
    id: `obra-${titulo}`,
    titulo,
    autor: "Autora",
    genero: "Fantasia",
    formato: "Webnovel",
    classificacaoIndicativa: "Livre",
    sinopse: "Uma sinopse",
    tags: [],
    capa: "",
    capitulos: [],
    visualizacoes: 0,
    totalCurtidas: 0,
    totalComentarios: 0,
    slug: titulo.toLowerCase(),
    link: `/obra/${titulo.toLowerCase()}`,
    ...sobrescritas,
  };
}

test("criarObrasHeroHome mantém as seis primeiras obras sem busca e normaliza a saída", () => {
  const obras = Array.from({ length: 7 }, (_, indice) => criarObra(`Obra ${indice + 1}`));
  const resultado = criarObrasHeroHome(obras, "");

  assert.deepEqual(resultado.map((obra) => obra.titulo), [
    "Obra 1",
    "Obra 2",
    "Obra 3",
    "Obra 4",
    "Obra 5",
    "Obra 6",
  ]);
  assert.ok(resultado.every((obra) => obra.convertidaParaHero));
});

test("criarObrasHeroHome preserva a prioridade de relevância e o desempate original", () => {
  const obras = [
    criarObra("O termo parcial"),
    criarObra("Termo inicial"),
    criarObra("Outra", { autor: "Termo autora" }),
    criarObra("Gênero", { genero: "Termo fantástico" }),
    criarObra("Tag", { tags: ["Termo-chave"] }),
    criarObra("Texto", { sinopse: "contém termo somente no texto" }),
    criarObra("Termo outro"),
  ];
  const resultado = criarObrasHeroHome(obras, "termo");

  assert.deepEqual(resultado.map((obra) => obra.titulo), [
    "Termo inicial",
    "Termo outro",
    "O termo parcial",
    "Outra",
    "Gênero",
    "Tag",
  ]);
});

test("criarObrasHeroHome remove não correspondentes e pesquisa gênero formatado e capítulos", () => {
  const obras = [
    criarObra("Sem correspondência"),
    criarObra("Gênero formatado", { genero: "  Mangá  " }),
    criarObra("Capítulo", {
      capitulos: [{ titulo: "O segredo do eclipse", curtiu: false, comentario: "" }],
    }),
  ];

  assert.deepEqual(
    criarObrasHeroHome(obras, "manga").map((obra) => obra.titulo),
    ["Gênero formatado"],
  );
  assert.deepEqual(
    criarObrasHeroHome(obras, "eclipse").map((obra) => obra.titulo),
    ["Capítulo"],
  );
});

test("home-hero-selection-utils estabelece a fronteira pura do useMemo", () => {
  assert.match(modulo, /import \{ normalizarTexto \} from "\.\.\/\.\.\/lib\/utils";/);
  assert.match(modulo, /import \{ formatarGeneroHome \} from "\.\/home-metadata-utils";/);
  assert.match(modulo, /import \{ criarObraHeroLocalHome \} from "\.\/home-hero-work-utils";/);
  assert.match(modulo, /export function criarObrasHeroHome/);
  assert.match(modulo, /titulo\.startsWith\(termoBusca\)/);
  assert.match(modulo, /autor\.startsWith\(termoBusca\)/);
  assert.match(modulo, /tags\.some\(\(tag\) => tag\.startsWith\(termoBusca\)\)/);
  assert.match(modulo, /resultadoA\.relevancia - resultadoB\.relevancia \|\|[\s\S]*?resultadoA\.ordem - resultadoB\.ordem/);
  assert.match(modulo, /\.slice\(0, 6\)/);
  assert.doesNotMatch(modulo, /useMemo|useState|useEffect|supabase|localStorage/);
  assert.match(pagina, /import \{ criarObrasHeroHome \} from "\.\/lib\/home-hero-selection-utils";/);
  assert.match(
    pagina,
    /const obrasHero = useMemo\(\(\) => \{\s*return criarObrasHeroHome\(obrasPublicadas, termoBusca\);\s*\}, \[obrasPublicadas, termoBusca\]\);/,
  );
  assert.doesNotMatch(pagina, /const relevancia = -1;/);
});
