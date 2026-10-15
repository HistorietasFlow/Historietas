import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL("../../components/HomeLocalWorkCard.tsx", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");

test("HomeLocalWorkCard preserva a composição do MobileObraLocalCard", () => {
  assert.match(componente, /^"use client";/);
  assert.match(componente, /export default function MobileObraLocalCard\(/);
  assert.match(componente, /obra: ObraLocalWorkCard;/);
  assert.match(componente, /tipo: "continuar" \| "catalogo" \| "novo-capitulo";/);
  assert.match(componente, /isDesktop\?: boolean;/);
  assert.match(componente, /const \{ language \} = useHistorietasLanguage\(\);/);
  assert.match(componente, /criarDadosObraLocalCardHome\(obra, tipo\)/);
  assert.match(componente, /desktopPublishedCardCompactHeightStyle/);
  assert.match(componente, /publishedCardCompactHeightStyle/);
  assert.match(componente, /criarMobileCoverStyle\(obra\.capa\)/);
  assert.match(componente, /\{obra\.titulo\}/);
  assert.match(componente, /<Link href=\{perfilAutorHref\} style=\{authorLinkStyle\}>[\s\S]*?Por \{obra\.autor\}/);
  assert.match(componente, /traduzirFormatoHome\(obra\.formato, language\)/);
  assert.match(componente, /traduzirClassificacaoHome\(obra\.classificacaoIndicativa, language\)/);
  assert.match(componente, /tipo === "novo-capitulo" && ultimoCapituloPublicado/);
  assert.match(componente, /Novo cap \{numeroUltimoCapitulo\}/);
  assert.match(componente, /👁️/);
  assert.match(componente, /❤️/);
  assert.match(componente, /💬/);
  assert.match(componente, /\{iconeConteudoObra\}/);
  assert.match(componente, /progressoLeitura > 0/);
  assert.match(componente, /\{progressoLeitura\}% lido/);
  assert.match(componente, /traduzirGeneroHome\(obra\.genero, language\)/);
  assert.match(componente, /href=\{actionHref\}/);
  assert.match(componente, /actionLabel === "Ver obra" \|\|[\s\S]*?actionLabel === "Continuar" \|\|[\s\S]*?actionLabel === "Ler agora"/);
  assert.match(componente, /from "\.\.\/app\/lib\/home-work-card-styles";/);
});

test("Home delega o MobileObraLocalCard sem manter sua implementação local", () => {
  assert.match(pagina, /import MobileObraLocalCard from "\.\.\/components\/HomeLocalWorkCard";/);
  assert.match(pagina, /<MobileObraLocalCard[\s\S]*?obra=\{obra\}[\s\S]*?tipo="continuar"[\s\S]*?isDesktop=\{isDesktop\}/);
  assert.doesNotMatch(pagina, /function MobileObraLocalCard\(/);
});
