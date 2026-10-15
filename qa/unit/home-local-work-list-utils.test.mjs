import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-local-work-list-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const moduloExecutavel = modulo
  .replace(
    'import { obraLocalCombinaBusca } from "./home-discovery-utils";\n',
    'const obraLocalCombinaBusca = (obra, termo) => !termo || obra.titulo.toLowerCase().includes(termo);\n',
  )
  .replace(
    `import {
  obterTotalComentariosObraHome,
  obterTotalCurtidasObraHome,
  obraTemArquivoAnexado,
} from "./home-local-work-utils";\n`,
    `const obterTotalCurtidasObraHome = (obra) => Math.max(obra.totalCurtidas || 0, obra.capitulos.filter((capitulo) => capitulo.curtiu).length);
const obterTotalComentariosObraHome = (obra) => Math.max(obra.totalComentarios || 0, obra.capitulos.filter((capitulo) => capitulo.comentario.trim()).length);
const obraTemArquivoAnexado = (obra) => Boolean(obra.arquivoObra?.nome?.trim() && obra.arquivoObra?.conteudo?.trim());\n`,
  )
  .replace(
    'import { obterTempoUltimoCapitulo } from "./home-reading-utils";\n',
    'const obterTempoUltimoCapitulo = (obra) => new Date(obra.capitulos.at(-1)?.criadoEm || obra.criadaEm).getTime() || 0;\n',
  );
const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  criarLeiturasRapidasHome,
  criarObrasComArquivoAnexadoHome,
  criarObrasComNovosCapitulosHome,
  criarObrasMaisComentadasHome,
  criarObrasMaisCurtidasHome,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function criarCapitulos(total, sobrescritas = {}) {
  return Array.from({ length: total }, (_, indice) => ({
    titulo: `Capítulo ${indice + 1}`,
    curtiu: false,
    comentario: "",
    criadoEm: `2026-01-${String(indice + 1).padStart(2, "0")}`,
    id: `capitulo-${indice + 1}`,
    lido: false,
    lidoEm: "",
    ...sobrescritas,
  }));
}

function criarObra(titulo, sobrescritas = {}) {
  return {
    titulo,
    autor: "Autor",
    genero: "Fantasia",
    formato: "Webnovel",
    classificacaoIndicativa: "Livre",
    sinopse: "Sinopse",
    tags: [],
    capaNome: "capa.jpg",
    arquivoObra: undefined,
    capitulos: criarCapitulos(1),
    criadaEm: "2025-01-01",
    ultimoCapituloLidoId: "",
    ultimaLeituraEm: "",
    totalCurtidas: 0,
    totalComentarios: 0,
    ...sobrescritas,
  };
}

test("home-local-work-list-utils preserva novos capítulos, filtros, ordem e limite", () => {
  const obras = [
    criarObra("Antiga", { capitulos: criarCapitulos(1, { criadoEm: "2025-01-01" }) }),
    criarObra("Recente", { capitulos: criarCapitulos(1, { criadoEm: "2026-01-02" }) }),
    criarObra("Sem capítulos", { capitulos: [] }),
    criarObra("Fora da busca"),
  ];
  const resultado = criarObrasComNovosCapitulosHome(obras, "ente");

  assert.deepEqual(resultado.map((obra) => obra.titulo), ["Recente"]);
  assert.deepEqual(
    criarObrasComNovosCapitulosHome(obras, "").slice(0, 2).map((obra) => obra.titulo),
    ["Recente", "Fora da busca"],
  );
  assert.equal(criarObrasComNovosCapitulosHome(Array.from({ length: 13 }, (_, indice) => criarObra(`Obra ${indice}`)), "").length, 12);
});

test("home-local-work-list-utils preserva listas de curtidas e comentários", () => {
  const obras = [
    criarObra("Zero"),
    criarObra("Curtida maior", { totalCurtidas: 8 }),
    criarObra("Curtida local", { capitulos: criarCapitulos(3, { curtiu: true }) }),
    criarObra("Comentada", { totalComentarios: 6 }),
    criarObra("Comentada local", { capitulos: criarCapitulos(2, { comentario: "ok" }) }),
    criarObra("Fora da busca", { totalCurtidas: 20, totalComentarios: 20 }),
  ];

  assert.deepEqual(
    criarObrasMaisCurtidasHome(obras, "curtida").map((obra) => obra.titulo),
    ["Curtida maior", "Curtida local"],
  );
  assert.deepEqual(
    criarObrasMaisComentadasHome(obras, "comentada").map((obra) => obra.titulo),
    ["Comentada", "Comentada local"],
  );
  assert.equal(criarObrasMaisCurtidasHome(Array.from({ length: 13 }, (_, indice) => criarObra(`Curtida ${indice}`, { totalCurtidas: indice + 1 })), "").length, 12);
  assert.equal(criarObrasMaisComentadasHome(Array.from({ length: 13 }, (_, indice) => criarObra(`Comentada ${indice}`, { totalComentarios: indice + 1 })), "").length, 12);
});

test("home-local-work-list-utils preserva arquivos anexados sem ordenação", () => {
  const obras = [
    criarObra("Primeira Arquivo", { arquivoObra: { nome: "a.txt", conteudo: "A" } }),
    criarObra("Sem arquivo"),
    criarObra("Segunda Arquivo", { arquivoObra: { nome: "b.txt", conteudo: "B" } }),
    criarObra("Ignorada", { arquivoObra: { nome: "c.txt", conteudo: "C" } }),
  ];

  assert.deepEqual(
    criarObrasComArquivoAnexadoHome(obras, "arquivo").map((obra) => obra.titulo),
    ["Primeira Arquivo", "Segunda Arquivo"],
  );
  assert.equal(criarObrasComArquivoAnexadoHome(Array.from({ length: 13 }, (_, indice) => criarObra(`Arquivo ${indice}`, { arquivoObra: { nome: "a.txt", conteudo: "A" } })), "").length, 12);
});

test("home-local-work-list-utils preserva leituras rápidas, ordem e limite", () => {
  const obras = [
    criarObra("Quatro", { capitulos: criarCapitulos(4) }),
    criarObra("Três rápidos", { capitulos: criarCapitulos(3) }),
    criarObra("Zero", { capitulos: [] }),
    criarObra("Um rápido", { capitulos: criarCapitulos(1) }),
    criarObra("Ignorada", { capitulos: criarCapitulos(2) }),
  ];

  assert.deepEqual(
    criarLeiturasRapidasHome(obras, "rápid").map((obra) => obra.titulo),
    ["Um rápido", "Três rápidos"],
  );
  assert.equal(criarLeiturasRapidasHome(Array.from({ length: 13 }, (_, indice) => criarObra(`Rápida ${indice}`, { capitulos: criarCapitulos(1) })), "").length, 12);
});

test("home-local-work-list-utils estabelece a fronteira pura das cinco listas", () => {
  for (const nome of [
    "criarObrasComNovosCapitulosHome",
    "criarObrasMaisCurtidasHome",
    "criarObrasMaisComentadasHome",
    "criarObrasComArquivoAnexadoHome",
    "criarLeiturasRapidasHome",
  ]) {
    assert.match(modulo, new RegExp(`export function ${nome}`));
    assert.match(pagina, new RegExp(`${nome}\\(`));
  }
  assert.match(modulo, /obra\.capitulos\.length > 0/);
  assert.match(modulo, /obra\.capitulos\.length <= 3/);
  assert.match(modulo, /obterTotalCurtidasObraHome\(obra\) > 0/);
  assert.match(modulo, /obterTotalComentariosObraHome\(obra\) > 0/);
  assert.match(modulo, /obraTemArquivoAnexado\(obra\)/);
  assert.match(modulo, /obterTempoUltimoCapitulo\(obraB\) -/);
  assert.match(modulo, /obraA\.capitulos\.length - obraB\.capitulos\.length/);
  assert.equal((modulo.match(/\.sort\(/g) || []).length, 4);
  assert.equal((modulo.match(/\.slice\(0, 12\)/g) || []).length, 5);
  assert.doesNotMatch(modulo, /supabase|localStorage|useEffect|useState|useMemo|from "react"/);
  for (const nomeMemo of [
    "obrasComNovosCapitulos",
    "obrasMaisCurtidas",
    "obrasMaisComentadas",
    "obrasComArquivoAnexado",
    "leiturasRapidas",
  ]) {
    assert.match(pagina, new RegExp(`const ${nomeMemo} = useMemo\\(\\(\\) => \\{[\\s\\S]*?\\}, \\[obrasPublicadas, termoBusca\\]\\);`));
  }
  assert.match(pagina, /const autoresParaConhecer = useMemo<AutorHome\[\]>/);
  assert.match(pagina, /const obrasFiltradas = useMemo/);
});
