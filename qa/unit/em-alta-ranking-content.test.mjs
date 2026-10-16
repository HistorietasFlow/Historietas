import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
const componente = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-ranking-content.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("a composição preserva autores, oito seções e estados do catálogo", () => {
  assert.match(componente, /^"use client";/);
  assert.match(componente, /export function EmAltaRankingContent\(/);
  assert.match(
    componente,
    /import \{ AutoresEmAltaSection \} from "\.\/em-alta-authors-ranking-section";/,
  );
  assert.match(
    componente,
    /import \{ RankingSection \} from "\.\/em-alta-ranking-section";/,
  );
  assert.equal((componente.match(/<RankingSection/g) || []).length, 8);
  assert.equal((componente.match(/<\/RankingSection>/g) || []).length, 0);
  assert.match(componente, /<AutoresEmAltaSection autores=\{rankingAutores\} isDesktop=\{isDesktop\} \/>/);

  for (const tipo of [
    "geral",
    "lidas",
    "curtidas",
    "comentadas",
    "salvas",
    "recentes",
    "capitulos",
  ]) {
    assert.match(componente, new RegExp(`tipo="${tipo}"`));
  }

  for (const texto of [
    "Ranking Mestre",
    "Alcance Dominante",
    "Preferidas do Público",
    "Mais Comentadas",
    "Mais Seguidas",
    "Novas Promessas",
    "Grandes Jornadas",
    "Catálogo em formação",
    "Obras publicadas",
    "Ainda não há obras publicadas",
  ]) {
    assert.ok(componente.includes(texto));
  }
});

test("preserva os ramos, props e a fronteira de apresentação", () => {
  assert.match(
    componente,
    /if \(ranking\.length > 0 && rankingTemAtividadeReal\)/,
  );
  assert.match(componente, /if \(ranking\.length > 0\)/);
  assert.match(componente, /obras=\{rankingParaCatalogoInicial\}/);

  for (const prop of [
    "obrasFavoritas={obrasFavoritas}",
    "obrasConcluidas={obrasConcluidas}",
    "onAlternarFavorito={onAlternarFavorito}",
    "onAlternarConcluido={onAlternarConcluido}",
    "isDesktop={isDesktop}",
  ]) {
    assert.ok(componente.includes(prop));
  }

  assert.match(
    pagina,
    /import \{ EmAltaRankingContent \} from "\.\/components\/em-alta-ranking-content";/,
  );
  assert.match(
    pagina,
    /<EmAltaRankingContent[\s\S]*?ranking=\{ranking\}[\s\S]*?onAlternarConcluido=\{alternarConcluido\}[\s\S]*?isDesktop=\{isDesktop\}/,
  );
  assert.doesNotMatch(pagina, /import \{ RankingSection \} from "\.\/components\/em-alta-ranking-section";/);
  assert.doesNotMatch(pagina, /import \{ AutoresEmAltaSection \} from "\.\/components\/em-alta-authors-ranking-section";/);

  for (const proibido of [
    /supabase/i,
    /localStorage/,
    /sessionStorage/,
    /\bauth\b/i,
    /useEffect/,
    /useState/,
  ]) {
    assert.doesNotMatch(componente, proibido);
  }
});
