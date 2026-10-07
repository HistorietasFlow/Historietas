import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const capaHero = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-hero-cover.tsx",
    import.meta.url,
  ),
  "utf8",
);
const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("capa do hero preserva props, link, arte e acessibilidade", () => {
  for (const trecho of [
    "isDesktop: boolean;",
    "href: string;",
    "ariaLabel: string;",
    "capa: string;",
    "capaOtimizada: boolean;",
    "iniciais: string;",
    "href={href}",
    "style={isDesktop ? desktopHeroCoverLinkStyle : heroCoverLinkStyle}",
    "aria-label={ariaLabel}",
    "style={isDesktop ? desktopCoverArtStyle : coverArtStyle}",
    'aria-hidden="true"',
    "{capa ? (",
    "<Image",
    "src={capa}",
    'alt=""',
    "fill",
    'sizes="(min-width: 1300px) 650px, (min-width: 1024px) 50vw, 100vw"',
    "preload",
    "unoptimized={!capaOtimizada}",
    'objectFit: "cover"',
    'objectPosition: isDesktop ? "center" : "center top"',
    "<strong style={coverTitleStyle}>{iniciais}</strong>",
  ]) {
    assert.ok(capaHero.includes(trecho), trecho);
  }
});

test("cliente preserva decisao de leitura e prepara os valores da capa", () => {
  for (const trecho of [
    "const acaoLeituraPrincipal = obterAcaoLeituraPrincipalObra(obra)",
    "const ariaLabelCapaObra = acaoLeituraPrincipal.capituloPrincipal",
    "? `${acaoLeituraPrincipal.rotulo}: ${obra.titulo}`",
    ": `Abrir ${obra.titulo}`",
    "capaObraPodeSerOtimizada(obra.capa)",
    "obterIniciaisCapaObra(obra.titulo)",
    "<ObraHeroCover",
    "href={acaoLeituraPrincipal.hrefPrincipal}",
    "ariaLabel={ariaLabelCapaObra}",
  ]) {
    assert.ok(paginaObra.includes(trecho), trecho);
  }
});
