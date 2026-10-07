import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);
const estilosObra = readFileSync(
  new URL("../../app/obra/[slug]/lib/obra-style-utils.ts", import.meta.url),
  "utf8",
);
const textosObra = readFileSync(
  new URL("../../app/obra/[slug]/lib/obra-text-utils.ts", import.meta.url),
  "utf8",
);
const leituraUtils = readFileSync(
  new URL("../../app/obra/[slug]/lib/obra-reading-utils.ts", import.meta.url),
  "utf8",
);
const acoesHero = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-hero-actions.tsx",
    import.meta.url,
  ),
  "utf8",
);

function obterBloco(inicioTexto, fimTexto, fonte = paginaObra) {
  const inicio = fonte.indexOf(inicioTexto);
  const fim = fimTexto ? fonte.indexOf(fimTexto, inicio) : fonte.length;

  assert.ok(inicio >= 0);
  assert.ok(fim > inicio);

  return fonte.slice(inicio, fim);
}

test("cta principal reutiliza a logica existente de continuar leitura", () => {
  const bloco = obterBloco(
    "export function obterAcaoLeituraPrincipalObra",
    "export function obterObraDisponivelExibida",
    leituraUtils,
  );

  assert.match(
    bloco,
    /const capituloPrincipal = encontrarCapituloParaContinuarObraPublica\(obra\)/,
  );
  assert.match(bloco, /obra\.ultimoCapituloLidoId/);
  assert.match(bloco, /obra\.progressoLeitura > 0/);
  assert.match(bloco, /obra\.capitulos\.some\(\(capitulo\) => capitulo\.lido\)/);
  assert.match(
    bloco,
    /leituraIniciada \? "Continuar leitura" : "Começar a ler"/,
  );
  assert.match(bloco, /hrefPrincipal: "\/explorar"/);
  assert.match(
    bloco,
    /capituloPrincipal\?\.href \|\| obra\.link \|\| `\/obra\/\$\{obra\.slug\}`/,
  );
  assert.match(bloco, /hrefCta: capituloPrincipal\?\.href/);
});

test("cta de leitura aparece antes de seguir e so existe com capitulo disponivel", () => {
  const bloco = obterBloco(
    "<ObraHeroActions",
    "/>\n            </div>",
  );

  const indiceCta = acoesHero.indexOf("{leituraHref ? (");
  const indiceSeguir = acoesHero.indexOf("onClick={onAlternarSeguir}");
  const indiceAcoes = acoesHero.indexOf("onClick={onAlternarAcoes}");

  assert.ok(indiceCta >= 0);
  assert.ok(indiceSeguir > indiceCta);
  assert.ok(indiceAcoes > indiceSeguir);
  assert.match(acoesHero, /href=\{leituraHref\}/);
  assert.match(acoesHero, /\{leituraRotulo\}/);
  assert.match(bloco, /leituraHref=\{acaoLeituraPrincipal\.hrefCta\}/);
  assert.match(bloco, /leituraRotulo=\{acaoLeituraPrincipal\.rotulo\}/);
  assert.match(bloco, /onAlternarSeguir=\{alternarSeguirObra\}/);
  assert.match(bloco, /onAlternarAcoes=\{alternarAcoesObra\}/);
});

test("cta de leitura e visualmente primario e seguir fica secundario", () => {
  const mobile = obterBloco(
    "export const primaryReadingButtonStyle",
    null,
    estilosObra,
  );
  const desktopPrimary = obterBloco(
    "export const desktopPrimaryReadingButtonStyle",
    null,
    estilosObra,
  );
  const desktopSecondary = obterBloco(
    "export const desktopSecondaryFollowButtonStyle",
    null,
    estilosObra,
  );

  assert.match(mobile, /gridColumn: "1 \/ -1"/);
  assert.match(mobile, /background: "#FFFFFF"/);
  assert.match(mobile, /color: "#08080A"/);

  assert.match(desktopPrimary, /export const desktopPrimaryReadingButtonStyle/);
  assert.match(desktopPrimary, /background: "#FFFFFF"/);
  assert.match(desktopSecondary, /export const desktopSecondaryFollowButtonStyle/);
  assert.match(desktopSecondary, /background: "rgba\(10,10,12,0\.74\)"/);
  assert.doesNotMatch(paginaObra, /desktopPrimaryFollowButtonStyle/);
});

test("capa comunica a mesma acao principal de leitura", () => {
  const bloco = obterBloco(
    "const ariaLabelCapaObra = acaoLeituraPrincipal.capituloPrincipal",
    "return (",
  );

  assert.match(bloco, /acaoLeituraPrincipal\.capituloPrincipal/);
  assert.match(bloco, /acaoLeituraPrincipal\.rotulo/);
  assert.match(bloco, /Abrir \$\{obra\.titulo\}/);
  assert.match(paginaObra, /<ObraHeroCover/);
  assert.match(paginaObra, /href=\{acaoLeituraPrincipal\.hrefPrincipal\}/);
  assert.match(paginaObra, /ariaLabel=\{ariaLabelCapaObra\}/);
});

test("rotulos principais de leitura possuem traducoes", () => {
  assert.match(
    textosObra,
    /"Começar a ler": \{ en: "Start reading", es: "Empezar a leer" \}/,
  );
  assert.match(
    textosObra,
    /"Continuar leitura": \{ en: "Continue reading", es: "Continuar leyendo" \}/,
  );
});
