import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const headerHero = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-hero-header.tsx",
    import.meta.url,
  ),
  "utf8",
);
const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("header do hero preserva classificacao, acessibilidade e estilos", () => {
  for (const trecho of [
    'import type { ReactNode } from "react";',
    "isDesktop: boolean;",
    "classificacaoIndicativa: string;",
    "classificacaoTexto: string;",
    "classificacaoLivre: boolean;",
    "classificacaoAdulto: boolean;",
    "rotuloAbrirClassificacao: string;",
    "resumoAvaliacao: ReactNode;",
    "onAbrirClassificacao: () => void;",
    "style={isDesktop ? desktopHeroTopOverlayStyle : heroTopOverlayStyle}",
    'type="button"',
    "onClick={onAbrirClassificacao}",
    "aria-label={`${rotuloAbrirClassificacao}: ${classificacaoIndicativa}`}",
    "title={`${rotuloAbrirClassificacao}: ${classificacaoIndicativa}`}",
    'data-historietas-i18n-ignore="true"',
    "{classificacaoTexto}",
  ]) {
    assert.ok(headerHero.includes(trecho), trecho);
  }

  const indiceBase = headerHero.indexOf("...classificationTriggerStyle,");
  const indiceAdulto = headerHero.indexOf("? classificationTriggerAdultStyle");
  assert.ok(indiceBase >= 0);
  assert.ok(indiceAdulto > indiceBase);
  assert.match(
    headerHero,
    /classificacaoAdulto\r?\n\s*\? classificationTriggerAdultStyle\r?\n\s*: \{\}/,
  );
  assert.match(
    headerHero,
    /classificacaoLivre\r?\n\s*\? classificationTriggerTextLivreStyle\r?\n\s*: classificationTriggerTextStyle/,
  );
});

test("header preserva o resumo no desktop e no mobile", () => {
  const indiceDesktop = headerHero.indexOf("{isDesktop ? (");
  const indiceWrapper = headerHero.indexOf(
    "<div style={desktopHeaderRightStyle}>",
    indiceDesktop,
  );
  const indiceResumoDesktop = headerHero.indexOf(
    "{resumoAvaliacao}",
    indiceWrapper,
  );
  const indiceResumoMobile = headerHero.indexOf(
    "resumoAvaliacao\n      )}",
  );

  assert.ok(indiceDesktop >= 0);
  assert.ok(indiceWrapper > indiceDesktop);
  assert.ok(indiceResumoDesktop > indiceWrapper);
  assert.ok(indiceResumoMobile > indiceResumoDesktop);
});

test("cliente preserva calculos, foco e integracao do header", () => {
  for (const trecho of [
    "function abrirPainelClassificacaoObra()",
    "focoAntesClassificacaoRef.current = obterElementoComFocoAtual();",
    "setPainelClassificacaoAberto(true);",
    "const classificacaoIndicativaCompacta =",
    "ehClassificacao18(obra.classificacaoIndicativa)",
    "textosPainelClassificacao.abrir",
    "const resumoAvaliacaoCabecalho = (",
    "<ObraHeroHeader",
    "classificacaoTexto={classificacaoIndicativaCompacta.texto}",
    "classificacaoLivre={classificacaoIndicativaCompacta.livre}",
    "classificacaoAdulto={ehClassificacao18(obra.classificacaoIndicativa)}",
    "resumoAvaliacao={resumoAvaliacaoCabecalho}",
    "onAbrirClassificacao={abrirPainelClassificacaoObra}",
  ]) {
    assert.ok(paginaObra.includes(trecho), trecho);
  }
});
