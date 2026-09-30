import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);
const nextConfig = readFileSync(
  new URL("../../next.config.ts", import.meta.url),
  "utf8",
);

function obterBloco(texto, inicioTexto, fimTexto) {
  const inicio = texto.indexOf(inicioTexto);
  const fim = texto.indexOf(fimTexto, inicio);

  assert.ok(inicio >= 0);
  assert.ok(fim > inicio);

  return texto.slice(inicio, fim);
}

test("capa principal usa next image responsivo e priorizado para LCP", () => {
  const bloco = obterBloco(
    paginaObra,
    "<Link\n              href={hrefPrincipalObra}",
    "<div\n              style={",
  );

  assert.match(bloco, /<Image/);
  assert.match(bloco, /src=\{obra\.capa\}/);
  assert.match(bloco, /fill/);
  assert.match(
    bloco,
    /sizes="\(min-width: 1300px\) 650px, \(min-width: 1024px\) 50vw, 100vw"/,
  );
  assert.match(bloco, /preload/);
  assert.match(
    bloco,
    /unoptimized=\{!capaObraPodeSerOtimizada\(obra\.capa\)\}/,
  );
});

test("capa preserva crop mobile desktop e fallback sem imagem", () => {
  const bloco = obterBloco(
    paginaObra,
    "{obra.capa ? (",
    "</div>\n            </Link>",
  );

  assert.match(
    bloco,
    /objectPosition: isDesktop \? "center" : "center top"/,
  );
  assert.match(bloco, /<strong style=\{coverTitleStyle\}>/);
  assert.match(bloco, /obra\.titulo/);
});

test("capa nao volta a usar background image dinamico", () => {
  assert.doesNotMatch(paginaObra, /function criarCoverArtStyle/);
  assert.doesNotMatch(paginaObra, /function criarDesktopCoverArtStyle/);
  assert.doesNotMatch(
    paginaObra,
    /backgroundImage: `url\(\$\{capa\}\)`/,
  );
});

test("otimizacao so aceita capa publica do Supabase configurado", () => {
  const bloco = obterBloco(
    paginaObra,
    "function capaObraPodeSerOtimizada(",
    "function criarLinkPerfilAutor(",
  );

  assert.match(bloco, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(bloco, /urlSupabase\.protocol === "https:"/);
  assert.match(bloco, /urlCapa\.origin === urlSupabase\.origin/);
  assert.match(
    bloco,
    /\/storage\/v1\/object\/public\/capas-obras\//,
  );
});

test("next config restringe image optimizer ao bucket capas obras", () => {
  assert.match(nextConfig, /remotePatterns: supabaseCoverRemotePatterns/);
  assert.match(nextConfig, /protocol: "https"/);
  assert.match(nextConfig, /hostname: url\.hostname/);
  assert.match(
    nextConfig,
    /pathname: "\/storage\/v1\/object\/public\/capas-obras\/\*\*"/,
  );
  assert.doesNotMatch(nextConfig, /hostname:\s*"\*"/);
});
