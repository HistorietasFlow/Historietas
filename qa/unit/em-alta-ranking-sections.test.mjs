import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
const rankingSection = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-ranking-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const authorsSection = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-authors-ranking-section.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("RankingSection preserva composição, rolagem, posições e acessibilidade", () => {
  assert.match(rankingSection, /^"use client";/);
  assert.match(rankingSection, /export function RankingSection\(/);
  for (const prop of [
    "titulo: string;",
    "descricao: string;",
    "obras: ObraRanking[];",
    "tipo: TipoRanking;",
    "obrasFavoritas: string[];",
    "obrasConcluidas: string[];",
    "onAlternarFavorito: (obraId: string) => void;",
    "onAlternarConcluido: (obraId: string) => void;",
    "isDesktop: boolean;",
  ]) {
    assert.ok(rankingSection.includes(prop));
  }
  assert.match(rankingSection, /onAlternarFavorito: _onAlternarFavorito,/);
  assert.match(rankingSection, /onAlternarConcluido: _onAlternarConcluido,/);
  assert.match(rankingSection, /void _onAlternarFavorito;/);
  assert.match(rankingSection, /void _onAlternarConcluido;/);
  assert.match(rankingSection, /const tema = obterTemaRanking\(tipo\);/);
  assert.match(rankingSection, /useRef<HTMLDivElement \| null>\(null\)/);
  assert.match(rankingSection, /posicao: index \+ 1,/);
  assert.match(rankingSection, /const obrasEmOrdem = \[\.\.\.obrasComPosicao\]\.reverse\(\);/);
  assert.match(rankingSection, /function rolarCarrossel\(direcao: "esquerda" \| "direita"\)/);
  assert.match(rankingSection, /Math\.max\(320, Math\.floor\(carrossel\.clientWidth \* 0\.82\)\)/);
  assert.match(rankingSection, /behavior: "smooth"/);
  assert.match(rankingSection, /isDesktop && obras\.length > 3/);
  assert.match(rankingSection, /event\.stopPropagation\(\);/);
  assert.match(rankingSection, /listaTemRankingObra\(obra, obrasFavoritas\)/);
  assert.match(rankingSection, /listaTemRankingObra\(obra, obrasConcluidas\)/);
  assert.match(rankingSection, /<RankingCard[\s\S]*?key=\{`\$\{tipo\}-\$\{obra\.id\}`\}[\s\S]*?isDesktop=\{isDesktop\}/);
  assert.match(rankingSection, /Nada para mostrar neste ranking/);
});

test("AutoresEmAltaSection preserva composição, rolagem, posições e acessibilidade", () => {
  assert.match(authorsSection, /^"use client";/);
  assert.match(authorsSection, /export function AutoresEmAltaSection\(/);
  assert.match(authorsSection, /autores: AutorRanking\[\];/);
  assert.match(authorsSection, /isDesktop: boolean;/);
  assert.match(authorsSection, /const tema = obterTemaRanking\("geral"\);/);
  assert.match(authorsSection, /useRef<HTMLDivElement \| null>\(null\)/);
  assert.match(authorsSection, /posicao: index \+ 1,/);
  assert.match(authorsSection, /const autoresEmOrdem = \[\.\.\.autoresComPosicao\]\.reverse\(\);/);
  assert.match(authorsSection, /function rolarCarrossel\(direcao: "esquerda" \| "direita"\)/);
  assert.match(authorsSection, /Math\.max\(320, Math\.floor\(carrossel\.clientWidth \* 0\.82\)\)/);
  assert.match(authorsSection, /behavior: "smooth"/);
  assert.match(authorsSection, /if \(autores\.length === 0\) \{\s*return null;/);
  assert.ok(authorsSection.includes("👤"));
  assert.match(authorsSection, /Autores em Alta/);
  assert.match(authorsSection, /isDesktop && autores\.length > 3/);
  assert.match(authorsSection, /event\.stopPropagation\(\);/);
  assert.match(authorsSection, /<AutorRankingCard[\s\S]*?key=\{`autor-ranking-\$\{autor\.id\}`\}[\s\S]*?isDesktop=\{isDesktop\}/);
});

test("Em Alta delega as seções sem manter as implementações locais", () => {
  assert.match(
    pagina,
    /import \{ RankingSection \} from "\.\/components\/em-alta-ranking-section";/,
  );
  assert.match(
    pagina,
    /import \{ AutoresEmAltaSection \} from "\.\/components\/em-alta-authors-ranking-section";/,
  );
  assert.doesNotMatch(pagina, /function RankingSection\b/);
  assert.doesNotMatch(pagina, /function AutoresEmAltaSection\b/);
  assert.match(pagina, /<RankingSection[\s\S]*?onAlternarConcluido=\{alternarConcluido\}/);
  assert.match(pagina, /<AutoresEmAltaSection[\s\S]*?autores=\{rankingAutores\}[\s\S]*?isDesktop=\{isDesktop\}/);
});

test("as seções permanecem de apresentação, sem persistência ou lifecycle", () => {
  for (const modulo of [rankingSection, authorsSection]) {
    for (const proibido of [
      /supabase/i,
      /localStorage/,
      /sessionStorage/,
      /\bauth\b/i,
      /useEffect/,
      /useState/,
    ]) {
      assert.doesNotMatch(modulo, proibido);
    }
  }
});
