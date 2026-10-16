import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-author-ranking-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
const executavel = modulo
  .replace(
    /import \{ normalizarTexto \} from "\.\.\/\.\.\/\.\.\/lib\/utils";\r?\n/,
    `const normalizarTexto = (texto) => String(texto || "")
  .normalize("NFD")
  .replace(/[\\u0300-\\u036f]/g, "")
  .toLowerCase()
  .trim();\n`,
  )
  .replace(
    /import type \{ AutorRanking, ObraRanking \} from "\.\/em-alta-models";\r?\n/,
    "",
  )
  .replace(
    /import \{ criarLinkPerfilAutorRanking \} from "\.\/em-alta-route-utils";\r?\n/,
    'const criarLinkPerfilAutorRanking = (nome, autorId) => `${nome}|${autorId || ""}`;\n',
  );
const js = typescript.transpileModule(executavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { calcularRankingAutores } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
);

function criarObra(overrides = {}) {
  return {
    autor: "Ana",
    autorId: "autor-ana",
    autorAvatar: "",
    capitulos: 2,
    seguidoresAutor: 3,
    salvos: 4,
    views: 5,
    curtidas: 6,
    comentarios: 7,
    avaliacoes: 2,
    mediaAvaliacao: 4,
    ...overrides,
  };
}

test("ignora autor vazio e autor não informado", () => {
  const autores = calcularRankingAutores([
    criarObra({ autor: "   " }),
    criarObra({ autor: " Autor não informado ", autorId: "nao-informado" }),
  ]);

  assert.deepEqual(autores, []);
});

test("agrupa por autorId ou nome normalizado, preservando totais e avatar", () => {
  const autores = calcularRankingAutores([
    criarObra({ autor: "Ana", autorId: "ana", autorAvatar: "" }),
    criarObra({
      autor: "Ana diferente",
      autorId: "ana",
      autorAvatar: "avatar-ana",
      capitulos: 3,
      seguidoresAutor: 9,
      salvos: 8,
      views: 7,
      curtidas: 5,
      comentarios: 4,
      avaliacoes: 1,
      mediaAvaliacao: 2,
    }),
    criarObra({ autor: "Bia Ágil", autorId: "" }),
    criarObra({ autor: " bia agil ", autorId: "", views: 10 }),
  ]);
  const ana = autores.find((autor) => autor.autorId === "ana");
  const bia = autores.find((autor) => autor.nome === "Bia Ágil");

  assert.deepEqual(
    {
      obras: ana?.obras,
      capitulos: ana?.capitulos,
      seguidores: ana?.seguidores,
      seguidoresObras: ana?.seguidoresObras,
      views: ana?.views,
      curtidas: ana?.curtidas,
      comentarios: ana?.comentarios,
      avaliacoes: ana?.avaliacoes,
      avatar: ana?.avatar,
    },
    {
      obras: 2,
      capitulos: 5,
      seguidores: 9,
      seguidoresObras: 12,
      views: 12,
      curtidas: 11,
      comentarios: 11,
      avaliacoes: 3,
      avatar: "avatar-ana",
    },
  );
  assert.equal(bia?.obras, 2);
  assert.equal(bia?.id, "nome:bia agil");
});

test("preserva o preenchimento posterior de autorId e href", () => {
  assert.match(
    modulo,
    /if \(!existente\.autorId && autorId\) \{[\s\S]*?existente\.autorId = autorId;[\s\S]*?criarLinkPerfilAutorRanking\(existente\.nome, autorId\)/,
  );
});

test("calcula média ponderada, fallback de peso e pontuação literal", () => {
  const autores = calcularRankingAutores([
    criarObra({
      autor: "Média",
      autorId: "media",
      capitulos: 1,
      seguidoresAutor: 2,
      salvos: 3,
      views: 4,
      curtidas: 5,
      comentarios: 6,
      avaliacoes: 2,
      mediaAvaliacao: 4,
    }),
    criarObra({
      autor: "Média",
      autorId: "media",
      capitulos: 1,
      seguidoresAutor: 1,
      salvos: 1,
      views: 1,
      curtidas: 1,
      comentarios: 1,
      avaliacoes: 0,
      mediaAvaliacao: 2,
    }),
    criarObra({
      autor: "Sem nota",
      autorId: "sem-nota",
      avaliacoes: 0,
      mediaAvaliacao: 0,
    }),
  ]);
  const media = autores.find((autor) => autor.autorId === "media");
  const semNota = autores.find((autor) => autor.autorId === "sem-nota");

  assert.equal(media?.mediaAvaliacao, 10 / 3);
  assert.equal(
    media?.pontuacao,
    2 + 2 * 4 + 4 * 4 + 5 + 6 * 2 + 7 * 3 + 2 * 4 + Math.round((10 / 3) * 4),
  );
  assert.equal(semNota?.mediaAvaliacao, 0);
});

test("ordena por pontuação, views e nome pt-BR e limita a cinco", () => {
  const metricasNeutras = {
    capitulos: 0,
    seguidoresAutor: 0,
    salvos: 0,
    curtidas: 0,
    comentarios: 0,
    avaliacoes: 0,
    mediaAvaliacao: 0,
  };
  const autores = calcularRankingAutores([
    criarObra({ ...metricasNeutras, autor: "Zulu", autorId: "zulu", views: 10 }),
    criarObra({ ...metricasNeutras, autor: "Álvaro", autorId: "alvaro", views: 10 }),
    criarObra({ ...metricasNeutras, autor: "Bia", autorId: "bia", views: 11 }),
    criarObra({ ...metricasNeutras, autor: "C", autorId: "c", views: 1 }),
    criarObra({ ...metricasNeutras, autor: "D", autorId: "d", views: 1 }),
    criarObra({ ...metricasNeutras, autor: "E", autorId: "e", views: 1 }),
    criarObra({ ...metricasNeutras, autor: "F", autorId: "f", views: 1 }),
  ]);

  assert.equal(autores.length, 5);
  assert.deepEqual(autores.slice(0, 3).map((autor) => autor.nome), [
    "Bia",
    "Álvaro",
    "Zulu",
  ]);
  assert.equal("somaNotas" in autores[0], false);
  assert.equal("pesoNotas" in autores[0], false);
});

test("fronteira mantém o useMemo da página e permanece pura", () => {
  assert.match(modulo, /export function calcularRankingAutores\(/);
  assert.match(modulo, /import \{ normalizarTexto \} from "\.\.\/\.\.\/\.\.\/lib\/utils";/);
  assert.match(modulo, /import type \{ AutorRanking, ObraRanking \} from "\.\/em-alta-models";/);
  assert.match(modulo, /import \{ criarLinkPerfilAutorRanking \} from "\.\/em-alta-route-utils";/);
  assert.doesNotMatch(modulo, /\b(useMemo|React|supabase|localStorage|window|document)\b/);
  assert.doesNotMatch(modulo, /<[A-Z][A-Za-z]/);
  assert.match(pagina, /import \{ calcularRankingAutores \} from "\.\/lib\/em-alta-author-ranking-utils";/);
  assert.match(
    pagina,
    /const rankingAutores = useMemo\(\s*\(\) => calcularRankingAutores\(ranking\),\s*\[ranking\],\s*\);/,
  );
  assert.doesNotMatch(pagina, /type AutorRankingAcumulado/);
  assert.doesNotMatch(pagina, /const autoresPorChave = new Map/);
  assert.match(
    pagina,
    /import \{ criarVisaoRankingEmAlta \} from "\.\/lib\/em-alta-ranking-view-utils";/,
  );
  assert.match(
    pagina,
    /\} = useMemo\(\(\) => criarVisaoRankingEmAlta\(ranking\), \[ranking\]\);/,
  );
  for (const dadoDerivado of [
    "rankingGeral",
    "rankingMaisLidas",
    "rankingMaisCurtidas",
    "rankingMaisComentadas",
    "rankingMaisSalvas",
    "rankingMaisRecentes",
    "rankingMaisCapitulos",
    "rankingTemAtividadeReal",
    "rankingParaCatalogoInicial",
  ]) {
    assert.match(pagina, new RegExp(`\\b${dadoDerivado}\\b`));
  }
});
