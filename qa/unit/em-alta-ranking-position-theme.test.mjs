import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-ranking-position-theme.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url), "utf8");
const rankingCard = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-ranking-card.tsx",
    import.meta.url,
  ),
  "utf8",
);
const rankingSection = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-ranking-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const js = typescript.transpileModule(modulo, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { obterTemaPosicao } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
);

const camposTema = [
  "nome",
  "simbolo",
  "accent",
  "accentSoft",
  "deep",
  "border",
  "cardBackground",
  "coverBackground",
  "coverOverlay",
  "rankBackground",
  "rankText",
  "tierBackground",
  "tierText",
  "badgeBackground",
  "badgeBorder",
  "badgeText",
  "readColor",
  "shadow",
];

test("preserva literalmente o tema Diamante", () => {
  const tema = obterTemaPosicao(1);

  assert.equal(tema.nome, "Diamante");
  assert.equal(tema.simbolo, "◆");
  assert.equal(tema.accent, "var(--historietas-em-alta-hex-7dd3fc, #7DD3FC)");
  assert.equal(tema.deep, "var(--historietas-em-alta-hex-061523, #061523)");
  assert.equal(tema.border, "var(--historietas-em-alta-rgba-125-211-252-0-78, rgba(125,211,252,0.78))");
  assert.equal(tema.cardBackground, "var(--historietas-em-alta-hex-2486c2, #2486C2)");
  assert.match(tema.coverBackground, /radial-gradient/);
  assert.match(tema.rankBackground, /linear-gradient/);
  assert.match(tema.tierBackground, /linear-gradient/);
  assert.equal(tema.badgeText, "var(--historietas-em-alta-hex-bae6fd, #BAE6FD)");
  assert.equal(tema.readColor, "var(--historietas-em-alta-hex-7dd3fc, #7DD3FC)");
  assert.match(tema.shadow, /0 18px 38px/);
});

test("preserva os temas Rubi, Ouro e Prata", () => {
  const rubi = obterTemaPosicao(2);
  const ouro = obterTemaPosicao(3);
  const prata = obterTemaPosicao(4);

  assert.equal(rubi.nome, "Rubi");
  assert.equal(rubi.accent, "var(--historietas-em-alta-hex-fb7185, #FB7185)");
  assert.equal(rubi.cardBackground, "var(--historietas-em-alta-hex-a32a4b, #A32A4B)");
  assert.match(rubi.coverOverlay, /linear-gradient/);
  assert.equal(ouro.nome, "Ouro");
  assert.equal(ouro.accent, "var(--historietas-em-alta-hex-fbbf24, #FBBF24)");
  assert.equal(ouro.rankText, "var(--historietas-em-alta-hex-2b1407, #2B1407)");
  assert.equal(prata.nome, "Prata");
  assert.equal(prata.accent, "var(--historietas-em-alta-hex-cbd5e1, #CBD5E1)");
  assert.equal(prata.cardBackground, "var(--historietas-em-alta-hex-7b8aa3, #7B8AA3)");
});

test("aplica Bronze a todas as posições fora do top quatro", () => {
  for (const posicao of [0, 5, 99]) {
    const tema = obterTemaPosicao(posicao);
    assert.equal(tema.nome, "Bronze");
    assert.equal(tema.accent, "var(--historietas-em-alta-hex-fb923c, #FB923C)");
    assert.equal(tema.cardBackground, "var(--historietas-em-alta-hex-9a6535, #9A6535)");
  }
});

test("todos os temas mantêm o mesmo contrato visual", () => {
  for (const posicao of [1, 2, 3, 4, 5]) {
    assert.deepEqual(Object.keys(obterTemaPosicao(posicao)), camposTema);
  }
});

test("a fronteira preserva os ramos, os consumidores e a pureza", () => {
  assert.match(modulo, /export function obterTemaPosicao\(posicao: number\)/);
  for (const posicao of [1, 2, 3, 4]) {
    assert.match(modulo, new RegExp(`if \\(posicao === ${posicao}\\)`));
  }
  assert.match(modulo, /return \{\r?\n    nome: "Bronze"/);
  assert.match(
    pagina,
    /import \{ RankingSection \} from "\.\/components\/em-alta-ranking-section";/,
  );
  assert.match(
    rankingSection,
    /import \{ RankingCard \} from "\.\/em-alta-ranking-card";/,
  );
  assert.doesNotMatch(pagina, /function obterTemaPosicao\b/);
  assert.match(
    rankingCard,
    /from "\.\.\/lib\/em-alta-ranking-position-theme";/,
  );
  assert.match(rankingCard, /\bobterTemaPosicao\(posicao\)/);
  assert.match(rankingCard, /\bcriarCardRankingStyle\b/);
  assert.doesNotMatch(pagina, /function criarCardRankingStyle\b/);
  for (const proibido of [
    /react/i,
    /\buse[A-Z]\w*\b/,
    /CSSProperties/,
    /supabase/i,
    /localStorage/,
    /\bwindow\b/,
    /\bdocument\b/,
    /<[A-Z][\w.]*(?:\s|\/?>)/,
  ]) {
    assert.doesNotMatch(modulo, proibido);
  }
});
