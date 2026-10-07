import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const detalhes = readFileSync(new URL("../../app/obra/[slug]/components/obra-hero-details.tsx", import.meta.url), "utf8");
const cliente = readFileSync(new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url), "utf8");

test("detalhes do hero preservam titulo, desktop, metadados e sinopse", () => {
  for (const trecho of ["isDesktop: boolean;", "titulo: string;", "autorNome: string;", "autorHref: string;", "autorBio: string;", "genero: string;", "classificacaoIndicativa: string;", "sinopse: string;", "Obra em destaque", 'data-historietas-i18n-ignore="true"', 'className="historietas-theme-title"', "desktopTitleStyle : titleStyle", "href={autorHref}", "title={autorBio || undefined}", 'aria-hidden="true"', "{genero}", "{classificacaoIndicativa}", '"Nenhuma sinopse informada."']) assert.ok(detalhes.includes(trecho), trecho);
  assert.equal((detalhes.match(/desktopHeroMetaDividerStyle/g) || []).length, 3);
});

test("cliente preserva container, valores preparados e ordem dos componentes do hero", () => {
  for (const trecho of ["desktopHeroOverlayContentStyle", "heroOverlayContentStyle", "<ObraHeroDetails", "titulo={obra.titulo}", "autorHref={criarLinkPerfilAutor(autorObraNome, autorObraId)}", "genero={generoObraFormatado}", "sinopse={obra.sinopse}"]) assert.ok(cliente.includes(trecho), trecho);
  assert.ok(cliente.indexOf("<ObraHeroMetaBar") > cliente.indexOf("<ObraHeroDetails"));
  assert.ok(cliente.indexOf("<ObraHeroActions") > cliente.indexOf("<ObraHeroMetaBar"));
});
