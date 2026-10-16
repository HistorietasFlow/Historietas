import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL("../../components/HomeCatalogWorkCard.tsx", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const secoes = readFileSync(
  new URL("../../components/HomeContentSections.tsx", import.meta.url),
  "utf8",
);
test("HomeCatalogWorkCard preserva a composição do MobileObraCard", () => {
  assert.match(componente, /^"use client";/);
  assert.match(componente, /export default function MobileObraCard\(/);
  assert.match(componente, /obra: ObraCatalogoCardHome;/);
  assert.match(componente, /isDesktop\?: boolean \}\)/);
  assert.match(componente, /const \{ language \} = useHistorietasLanguage\(\);/);
  assert.match(componente, /criarDadosObraCatalogoCardHome\(obra\)/);
  assert.match(componente, /criarMobileCoverThumbStyle\(obra\)/);
  assert.match(componente, /minHeight: "122px"/);
  assert.match(componente, /borderRadius: "16px"/);
  assert.match(componente, /\{obra\.titulo\}/);
  assert.match(componente, />Por \{obra\.autor\}</);
  assert.match(componente, /traduzirFormatoHome\(obterFormatoObraCatalogoHome\(obra\), language\)/);
  assert.match(componente, /traduzirClassificacaoHome\(obra\.classificacaoIndicativa, language\)/);
  assert.match(componente, /👁️/);
  assert.match(componente, /❤️/);
  assert.match(componente, /💬/);
  assert.match(componente, /\{iconeConteudoObra\}/);
  assert.match(componente, /traduzirGeneroHome\(obra\.genero, language\)/);
  assert.match(componente, /\{obra\.disponivel \? "Ver obra" : "Ver detalhes"\}/);
  assert.match(componente, /aria-label=\{`Abrir página da obra \$\{obra\.titulo\}`\}/);
  assert.match(componente, /from "\.\.\/app\/lib\/home-work-card-styles";/);
});

test("Home delega o MobileObraCard sem manter sua implementação local", () => {
  assert.match(secoes, /import MobileObraCard from "\.\/HomeCatalogWorkCard";/);
  assert.match(secoes, /<MobileObraCard key=\{obra\.titulo\} obra=\{obra\} isDesktop=\{isDesktop\} \/>/);
  assert.doesNotMatch(pagina, /function MobileObraCard\(/);
});
