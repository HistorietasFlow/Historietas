import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-catalog-theme-list-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const moduloExecutavel = modulo.replace(
  'import { obraCatalogoCombinaTemas } from "./home-discovery-utils";\n',
  `const normalizarTexto = (valor) => String(valor || "")
  .normalize("NFD")
  .replace(/[\\u0300-\\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();
const obraCatalogoCombinaTemas = (obra, temas) => {
  const textoObra = normalizarTexto(
    [obra.titulo, obra.autor, obra.genero, obra.status].join(" "),
  );
  return temas.some((tema) => textoObra.includes(normalizarTexto(tema)));
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
  criarObrasAcaoRivalidadesHome,
  criarObrasEmBreveHome,
  criarObrasFantasiaPoderesHome,
  criarObrasRomanceDramaHome,
  criarObrasScifiCodigoHome,
  criarObrasTerrorSuspenseHome,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function criarObra(titulo, sobrescritas = {}) {
  return {
    titulo,
    autor: "Autor",
    genero: "Aventura",
    classificacaoIndicativa: "Livre",
    status: "Publicado",
    disponivel: true,
    ...sobrescritas,
  };
}

function validarTemas(nome, criarLista, termos) {
  const obras = termos.map((termo, indice) =>
    criarObra(`${nome} ${indice + 1}`, { genero: termo }),
  );
  const semCorrespondencia = criarObra("Obra neutra");

  assert.deepEqual(
    criarLista([...obras, semCorrespondencia]).map((obra) => obra.titulo),
    obras.map((obra) => obra.titulo),
  );
}

test("home-catalog-theme-list-utils preserva os quatro temas de fantasia", () => {
  validarTemas("Fantasia", criarObrasFantasiaPoderesHome, [
    "fantasia",
    "sobrenatural",
    "poder",
    "magia",
  ]);
});

test("home-catalog-theme-list-utils preserva os quatro temas de terror", () => {
  validarTemas("Terror", criarObrasTerrorSuspenseHome, [
    "terror",
    "suspense",
    "mistério",
    "sombrio",
  ]);
});

test("home-catalog-theme-list-utils preserva os três temas de romance", () => {
  validarTemas("Romance", criarObrasRomanceDramaHome, [
    "romance",
    "drama",
    "emocional",
  ]);
});

test("home-catalog-theme-list-utils preserva as variantes de ação", () => {
  validarTemas("Ação", criarObrasAcaoRivalidadesHome, [
    "ação",
    "acao",
    "luta",
    "rivalidade",
    "guerra",
  ]);
});

test("home-catalog-theme-list-utils preserva os seis temas de sci-fi", () => {
  validarTemas("Sci-fi", criarObrasScifiCodigoHome, [
    "sci-fi",
    "scifi",
    "ficção",
    "futur",
    "código",
    "codigo",
  ]);
});

test("home-catalog-theme-list-utils preserva a semântica de obras em breve e a ordem", () => {
  const obras = [
    criarObra("Indisponível", { disponivel: false }),
    criarObra("Disponível", { disponivel: true }),
    criarObra("Falso", { disponivel: false }),
    criarObra("Ausente", { disponivel: undefined }),
  ];

  assert.deepEqual(
    criarObrasEmBreveHome(obras).map((obra) => obra.titulo),
    ["Indisponível", "Falso", "Ausente"],
  );
});

test("home-catalog-theme-list-utils estabelece a fronteira pura das seis listas", () => {
  assert.match(
    modulo,
    /import \{ obraCatalogoCombinaTemas \} from "\.\/home-discovery-utils";/,
  );
  for (const nome of [
    "criarObrasFantasiaPoderesHome",
    "criarObrasTerrorSuspenseHome",
    "criarObrasRomanceDramaHome",
    "criarObrasAcaoRivalidadesHome",
    "criarObrasScifiCodigoHome",
    "criarObrasEmBreveHome",
  ]) {
    assert.match(modulo, new RegExp(`export function ${nome}`));
    assert.match(pagina, new RegExp(`${nome}\\(obrasFiltradas\\)`));
  }
  assert.match(modulo, /\["fantasia", "sobrenatural", "poder", "magia"\]/);
  assert.match(modulo, /\["terror", "suspense", "mistério", "sombrio"\]/);
  assert.match(modulo, /\["romance", "drama", "emocional"\]/);
  assert.match(modulo, /\["ação", "acao", "luta", "rivalidade", "guerra"\]/);
  assert.match(modulo, /\["sci-fi", "scifi", "ficção", "futur", "código", "codigo"\]/);
  assert.match(modulo, /!obra\.disponivel/);
  assert.equal((modulo.match(/\.sort\(/g) || []).length, 0);
  assert.equal((modulo.match(/\.slice\(/g) || []).length, 0);
  assert.doesNotMatch(modulo, /supabase|localStorage|useEffect|useState|useMemo|from "react"/);
  assert.doesNotMatch(pagina, /obraCatalogoCombinaTemas\(obra,/);
  for (const nomeMemo of [
    "obrasFantasiaPoderes",
    "obrasTerrorSuspense",
    "obrasRomanceDrama",
    "obrasAcaoRivalidades",
    "obrasScifiCodigo",
    "obrasEmBreve",
  ]) {
    assert.match(
      pagina,
      new RegExp(`const ${nomeMemo} = useMemo\\(\\(\\) => \\{[\\s\\S]*?\\}, \\[obrasFiltradas\\]\\);`),
    );
  }
  assert.match(pagina, /<MobileObraCard/);
});
