import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const acoesHero = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-hero-actions.tsx",
    import.meta.url,
  ),
  "utf8",
);
const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("acoes do hero preservam props, CTA condicional e estilos responsivos", () => {
  for (const trecho of [
    "isDesktop: boolean;",
    "leituraHref?: string;",
    "leituraRotulo: string;",
    "leituraAriaLabel: string;",
    "seguindo: boolean;",
    "acoesAbertas: boolean;",
    "onAlternarSeguir: () => void | Promise<void>;",
    "onAlternarAcoes: () => void;",
    "style={isDesktop ? desktopHeroActionsStyle : heroActionsStyle}",
    "{leituraHref ? (",
    "href={leituraHref}",
    "aria-label={leituraAriaLabel}",
    "desktopPrimaryReadingButtonStyle",
    "primaryReadingButtonStyle",
  ]) {
    assert.ok(acoesHero.includes(trecho), trecho);
  }
});

test("acoes do hero preservam seguir, estilos na ordem atual e menu acessivel", () => {
  const indiceDesktop = acoesHero.indexOf("isDesktop\n            ? seguindo");
  const indiceSeguindoDesktop = acoesHero.indexOf(
    "? desktopFollowedButtonStyle",
  );
  const indiceSecundarioDesktop = acoesHero.indexOf(
    ": desktopSecondaryFollowButtonStyle",
  );
  const indiceSeguindoMobile = acoesHero.indexOf("? followedButtonStyle");
  const indiceSecundarioMobile = acoesHero.indexOf(": secondaryButtonStyle");

  assert.ok(acoesHero.includes('type="button"'));
  assert.ok(acoesHero.includes("onClick={onAlternarSeguir}"));
  assert.ok(indiceDesktop >= 0);
  assert.ok(indiceSeguindoDesktop > indiceDesktop);
  assert.ok(indiceSecundarioDesktop > indiceSeguindoDesktop);
  assert.ok(indiceSeguindoMobile > indiceSecundarioDesktop);
  assert.ok(indiceSecundarioMobile > indiceSeguindoMobile);
  assert.ok(acoesHero.includes('{seguindo ? "✓ Seguindo" : "Seguir obra"}'));
  assert.ok(acoesHero.includes("onClick={onAlternarAcoes}"));
  assert.ok(
    acoesHero.includes(
      "style={isDesktop ? desktopObraAddButtonStyle : obraAddButtonStyle}",
    ),
  );
  assert.ok(acoesHero.includes('aria-label="Abrir ações da obra"'));
  assert.ok(acoesHero.includes("aria-expanded={acoesAbertas}"));
  assert.ok(acoesHero.includes('aria-haspopup="dialog"'));
  assert.match(acoesHero, />\s*\+\s*<\/button>/);
});

test("cliente preserva a decisao de leitura, hook e callbacks do hero", () => {
  for (const trecho of [
    "const acaoLeituraPrincipal = obterAcaoLeituraPrincipalObra(obra)",
    "const [obraSeguida, setObraSeguida]",
    "async function alternarSeguirObra()",
    'import { useObraActionsSheet } from "./hooks/use-obra-actions-sheet"',
    "} = useObraActionsSheet();",
    "<ObraHeroActions",
    "leituraHref={acaoLeituraPrincipal.hrefCta}",
    "leituraRotulo={acaoLeituraPrincipal.rotulo}",
    "leituraAriaLabel={`${acaoLeituraPrincipal.rotulo}: ${obra.titulo}`}",
    "seguindo={obraSeguida}",
    "acoesAbertas={acoesObraAbertas}",
    "onAlternarSeguir={alternarSeguirObra}",
    "onAlternarAcoes={alternarAcoesObra}",
  ]) {
    assert.ok(paginaObra.includes(trecho), trecho);
  }
});
