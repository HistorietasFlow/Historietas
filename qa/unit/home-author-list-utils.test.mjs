import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-author-list-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const secoes = readFileSync(
  new URL("../../components/HomeContentSections.tsx", import.meta.url),
  "utf8",
);const moduloExecutavel = modulo
  .replace(
    'import { criarAutorHome } from "./home-author-composition-utils";\n',
    `const criarAutorHome = (nome, autorId, generos, totalObras, totalCapitulos, totalCurtidas, totalComentarios, perfis) => ({
  chave: autorId.trim() || normalizarChaveAutor(nome),
  nome: nome.trim() || "Autor não informado",
  autorId: autorId.trim(),
  generos,
  totalObras,
  totalCapitulos,
  totalCurtidas,
  totalComentarios,
  perfil: perfis[autorId.trim() || normalizarChaveAutor(nome)] || null,
});\n`,
  )
  .replace(
    'import { obraLocalCombinaBusca } from "./home-discovery-utils";\n',
    `const obraLocalCombinaBusca = (obra, termo) => !termo || obra.titulo.toLowerCase().includes(termo);\n`,
  )
  .replace(
    'import { obterTotalComentariosObraHome, obterTotalCurtidasObraHome } from "./home-local-work-utils";\n',
    `const obterTotalCurtidasObraHome = (obra) => Math.max(obra.totalCurtidas || 0, obra.capitulos.filter((capitulo) => capitulo.curtiu).length);
const obterTotalComentariosObraHome = (obra) => Math.max(obra.totalComentarios || 0, obra.capitulos.filter((capitulo) => capitulo.comentario.trim()).length);\n`,
  )
  .replace(
    'import { normalizarChaveAutor } from "./home-author-profile-utils";\n',
    `const normalizarChaveAutor = (nome) => String(nome || "").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().replace(/\\s+/g, " ").trim();\n`,
  );
const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { criarAutoresParaConhecerHome } = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function criarObra(sobrescritas = {}) {
  return {
    titulo: "Obra de Ana",
    autor: " Ana Souza ",
    autorId: " ana-id ",
    genero: "Fantasia",
    formato: "Webnovel",
    classificacaoIndicativa: "Livre",
    sinopse: "Sinopse",
    tags: [],
    capaNome: "capa.jpg",
    capitulos: [{ titulo: "Capítulo 1", curtiu: true, comentario: "Comentário" }],
    totalCurtidas: 4,
    totalComentarios: 2,
    ...sobrescritas,
  };
}

function criarAutores(args = {}) {
  return criarAutoresParaConhecerHome({
    obrasPublicadas: [],
    obrasFiltradas: [],
    perfisAutores: {},
    termoBusca: "",
    ...args,
  });
}

test("home-author-list-utils agrega autores locais, preserva métricas e gêneros repetidos", () => {
  const autores = criarAutores({
    obrasPublicadas: [
      criarObra(),
      criarObra({ titulo: "Outra obra", genero: "Fantasia", capitulos: [{ titulo: "Capítulo 2", curtiu: false, comentario: "   " }], totalCurtidas: 0, totalComentarios: 0 }),
      criarObra({ titulo: "Sem gênero", genero: "", capitulos: [], totalCurtidas: 0, totalComentarios: 0 }),
    ],
    perfisAutores: { "ana-id": { avatar: "ana.jpg" } },
  });

  assert.equal(autores.length, 1);
  assert.deepEqual(autores[0], {
    chave: "ana-id",
    nome: "Ana Souza",
    autorId: "ana-id",
    generos: ["Fantasia", "Fantasia"],
    totalObras: 3,
    totalCapitulos: 2,
    totalCurtidas: 4,
    totalComentarios: 2,
    perfil: { avatar: "ana.jpg" },
  });
});

test("home-author-list-utils respeita busca, chaves normalizadas, catálogo e fallbacks", () => {
  const autores = criarAutores({
    obrasPublicadas: [
      criarObra({ titulo: "Sem correspondência", autor: "Ignorado" }),
      criarObra({ titulo: "Encontra Ana", autor: "   ", autorId: "", genero: "Romance" }),
    ],
    obrasFiltradas: [
      { autor: "Autor de Catálogo", genero: "Terror" },
      { autor: "Autor de Catálogo", genero: "" },
    ],
    termoBusca: "encontra",
  });

  assert.equal(autores.length, 2);
  assert.deepEqual(autores[0], {
    chave: "autor de catalogo",
    nome: "Autor de Catálogo",
    autorId: "",
    generos: ["Terror"],
    totalObras: 2,
    totalCapitulos: 0,
    totalCurtidas: 0,
    totalComentarios: 0,
    perfil: null,
  });
  assert.deepEqual(autores[1], {
    chave: "autor nao informado",
    nome: "Autor não informado",
    autorId: "",
    generos: ["Romance"],
    totalObras: 1,
    totalCapitulos: 1,
    totalCurtidas: 4,
    totalComentarios: 2,
    perfil: null,
  });
});

test("home-author-list-utils ordena por obras, capítulos e nome e limita a doze", () => {
  const obrasPublicadas = [
    criarObra({ autor: "Zeta", autorId: "zeta", capitulos: [{ titulo: "1", curtiu: false, comentario: "" }] }),
    criarObra({ autor: "Alfa", autorId: "alfa", capitulos: [{ titulo: "1", curtiu: false, comentario: "" }] }),
    criarObra({ autor: "Beta", autorId: "beta", capitulos: [{ titulo: "1", curtiu: false, comentario: "" }, { titulo: "2", curtiu: false, comentario: "" }] }),
  ];
  for (let indice = 0; indice < 11; indice += 1) {
    obrasPublicadas.push(criarObra({ autor: `Autor ${indice}`, autorId: `autor-${indice}`, capitulos: [] }));
  }

  const autores = criarAutores({ obrasPublicadas });
  assert.equal(autores.length, 12);
  assert.deepEqual(autores.slice(0, 3).map((autor) => autor.nome), ["Beta", "Alfa", "Zeta"]);
});

test("home-author-list-utils estabelece a fronteira pura da lista de autores", () => {
  assert.match(modulo, /import \{ criarAutorHome \} from "\.\/home-author-composition-utils";/);
  assert.match(modulo, /import \{ obraLocalCombinaBusca \} from "\.\/home-discovery-utils";/);
  assert.match(modulo, /import \{ obterTotalComentariosObraHome, obterTotalCurtidasObraHome \} from "\.\/home-local-work-utils";/);
  assert.match(modulo, /import \{ normalizarChaveAutor \} from "\.\/home-author-profile-utils";/);
  assert.match(modulo, /export function criarAutoresParaConhecerHome\(/);
  assert.match(modulo, /const autoresMap = new Map</);
  assert.match(modulo, /function registrarAutor\(/);
  assert.match(modulo, /obra\.autorId \|\| ""/);
  assert.match(modulo, /obra\.capitulos\.length/);
  assert.match(modulo, /autorA\.nome\.localeCompare\(autorB\.nome, "pt-BR"\)/);
  assert.match(modulo, /\.slice\(0, 12\);/);
  assert.doesNotMatch(modulo, /supabase|localStorage|useEffect|useState|useMemo|from "react"/);
  assert.match(pagina, /import \{ criarAutoresParaConhecerHome \} from "\.\/lib\/home-author-list-utils";/);
  assert.doesNotMatch(pagina, /function registrarAutor\(/);
  assert.match(pagina, /const autoresParaConhecer = useMemo<AutorHome\[\]>\(\(\) => \{[\s\S]*?return criarAutoresParaConhecerHome\(\{[\s\S]*?obrasPublicadas,[\s\S]*?obrasFiltradas,[\s\S]*?perfisAutores,[\s\S]*?termoBusca,[\s\S]*?\}\);[\s\S]*?\}, \[obrasPublicadas, obrasFiltradas, perfisAutores, termoBusca\]\);/);
  assert.match(pagina, /const avaliacoesAutoresHome = useHomeAuthorRatings\(autoresParaConhecer\);/);
  assert.match(secoes, /import MobileAutorCard from "\.\/HomeAuthorCard";/);
  assert.doesNotMatch(pagina, /function MobileAutorCard\(/);
});
