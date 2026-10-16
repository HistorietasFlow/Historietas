import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-ranking-card.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);

test("RankingCard preserva props, navegação e acessibilidade", () => {
  assert.match(componente, /^"use client";/);
  assert.match(componente, /export function RankingCard\(/);
  for (const prop of [
    "obra: ObraRanking;",
    "posicao: number;",
    "tipo: TipoRanking;",
    "favorita: boolean;",
    "concluida: boolean;",
    "isDesktop: boolean;",
  ]) {
    assert.match(componente, new RegExp(prop.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(componente, /void favorita;/);
  assert.match(componente, /void concluida;/);
  assert.match(componente, /const router = useRouter\(\);/);
  assert.match(
    componente,
    /function abrirObra\(\) \{\s*router\.push\(obra\.href\);\s*\}/,
  );
  assert.match(componente, /role="link"/);
  assert.match(componente, /tabIndex=\{0\}/);
  assert.match(componente, /aria-label=\{`Abrir página da obra \$\{obra\.titulo\}`\}/);
  assert.match(componente, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(componente, /event\.preventDefault\(\);\s*abrirObra\(\);/);
});

test("RankingCard preserva metadata, destaque, autor, métricas e capa", () => {
  assert.match(componente, /obra\.classificacaoIndicativa !== "Não informada"/);
  assert.match(componente, /formatarGeneroCard\(obra\.genero\)/);
  assert.match(componente, /obra\.formato\.trim\(\) \|\| "História"/);
  assert.match(componente, /normalizarTexto\(obra\.status\) !== "publicado"/);
  assert.match(componente, /tipo === "geral"/);
  assert.match(componente, /tipo === "lidas"/);
  assert.match(componente, /tipo === "curtidas"/);
  assert.match(componente, /tipo === "comentadas"/);
  assert.match(componente, /tipo === "salvas"/);
  assert.match(componente, /tipo === "recentes"/);
  assert.match(componente, /formatarDataRanking\(obra\.criadaEmTimestamp\)/);
  assert.match(componente, /formatarNumero\(obra\.capitulos\).*capítulos/s);
  assert.match(
    componente,
    /href=\{criarLinkPerfilAutorRanking\(obra\.autor, obra\.autorId\)\}/,
  );
  assert.match(componente, /event\.stopPropagation\(\);/);
  assert.match(componente, /Por\{" "\}/);
  assert.match(componente, /criarRankingCoverStyle\(obra\.capa, isDesktop\)/);
  assert.match(componente, /\{null\}/);
  for (const emoji of ["💬", "👥", "📚", "👁", "❤️", "★"]) {
    assert.match(componente, new RegExp(emoji));
  }
  assert.match(componente, /obra\.tipo === "local" \? publishedStatusStyle : statusStyle/);
  assert.match(componente, /aria-label=\{`Posição \$\{posicao\}º — \$\{temaPosicao\.nome\}`\}/);
  assert.match(componente, /\{posicao\}º/);
  assert.match(componente, /\{temaPosicao\.nome\}/);
});

test("Em Alta delega RankingCard sem mover as seções", () => {
  assert.match(
    pagina,
    /import \{ RankingCard \} from "\.\/components\/em-alta-ranking-card";/,
  );
  assert.doesNotMatch(pagina, /function RankingCard\b/);
  assert.match(pagina, /function RankingSection\b/);
  assert.match(pagina, /<RankingCard[\s\S]*?isDesktop=\{isDesktop\}/);
});

test("RankingCard permanece visual, sem dados persistentes ou lifecycle", () => {
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
