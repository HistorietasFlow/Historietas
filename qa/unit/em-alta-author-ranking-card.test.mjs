import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-author-ranking-card.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);

test("AutorRankingCard preserva apresentação, navegação e acessibilidade", () => {
  assert.match(componente, /^"use client";/);
  assert.match(componente, /export function AutorRankingCard\(/);
  assert.match(componente, /autor: AutorRanking;/);
  assert.match(componente, /posicao: number;/);
  assert.match(componente, /isDesktop: boolean;/);
  assert.match(componente, /import \{ useRouter \} from "next\/navigation";/);
  assert.match(componente, /import \{ obterTemaPosicao \} from "\.\.\/lib\/em-alta-ranking-position-theme";/);
  assert.match(componente, /const inicialAutor = autor\.nome\.trim\(\)\.charAt\(0\)\.toUpperCase\(\) \|\| "A";/);
  assert.match(componente, /const temaPosicao = obterTemaPosicao\(posicao\);/);
  assert.match(componente, /const avatarAutor = autor\.avatar\.trim\(\);/);
  assert.match(componente, /function abrirPerfil\(\) \{\s*router\.push\(autor\.href\);\s*\}/);
  assert.match(componente, /role="link"/);
  assert.match(componente, /tabIndex=\{0\}/);
  assert.match(componente, /aria-label=\{`Abrir perfil de \$\{autor\.nome\}`\}/);
  assert.match(componente, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(componente, /event\.preventDefault\(\);/);
  assert.match(componente, /className="historietas-ranking-card historietas-ranking-author-card"/);
  assert.match(componente, /data-ranking-level=\{temaPosicao\.nome\.toLowerCase\(\)\}/);
  assert.match(componente, /criarAutorAvatarRankingStyle\(avatarAutor, posicao, isDesktop\)/);
  assert.match(componente, /!avatarAutor && \([\s\S]*?authorRankingAvatarInitialStyle[\s\S]*?\{inicialAutor\}/);
  assert.match(componente, /formatarNumero\(autor\.obras\)/);
  assert.match(componente, /autor\.obras === 1 \? "Obra Publicada" : "Obras Publicadas"/);
  assert.match(componente, /\{formatarNumero\(autor\.pontuacao\)\} pts/);

  for (const emoji of ["💬", "👥", "📚", "👁", "❤️", "★"]) {
    assert.ok(componente.includes(emoji));
  }

  for (const nome of [
    "formatarMediaRanking",
    "formatarNumero",
    "criarAutorCardTitleRankingStyle",
    "criarAutorPointsBadgeStyle",
    "criarAutorTierInlineBadgeStyle",
    "criarCardRankingStyle",
    "statsStyle",
    "ratingStatsStyle",
  ]) {
    assert.match(componente, new RegExp(`\\b${nome}\\b`));
  }
});

test("Em Alta delega AutorRankingCard sem mover sua seção de autores", () => {
  assert.match(
    pagina,
    /import \{ AutorRankingCard \} from "\.\/components\/em-alta-author-ranking-card";/,
  );
  assert.doesNotMatch(pagina, /function AutorRankingCard\(/);
  assert.match(pagina, /function AutoresEmAltaSection\b/);
  assert.match(
    pagina,
    /<AutorRankingCard[\s\S]*?autor=\{autor\}[\s\S]*?posicao=\{posicao\}[\s\S]*?isDesktop=\{isDesktop\}/,
  );
});

test("AutorRankingCard permanece sem dados, sessão ou efeitos", () => {
  for (const termoProibido of [
    /supabase/i,
    /localStorage/,
    /sessionStorage/,
    /\bauth\b/i,
    /useEffect/,
    /useState/,
  ]) {
    assert.doesNotMatch(componente, termoProibido);
  }
});
