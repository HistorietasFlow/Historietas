import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

function obterBloco(inicioTexto, fimTexto) {
  const inicio = paginaObra.indexOf(inicioTexto);
  const fim = paginaObra.indexOf(fimTexto, inicio);

  assert.ok(inicio >= 0);
  assert.ok(fim > inicio);

  return paginaObra.slice(inicio, fim);
}

test("cta principal reutiliza a logica existente de continuar leitura", () => {
  const bloco = obterBloco(
    "const capituloPrincipalObra = obra",
    "const resumoAvaliacaoCabecalho",
  );

  assert.match(
    bloco,
    /encontrarCapituloParaContinuarObraPublica\(obra\)/,
  );
  assert.match(bloco, /obra\.ultimoCapituloLidoId/);
  assert.match(bloco, /obra\.progressoLeitura > 0/);
  assert.match(bloco, /obra\.capitulos\.some\(\(capitulo\) => capitulo\.lido\)/);
  assert.match(
    bloco,
    /obraTemLeituraIniciada[\s\S]*?"Continuar leitura"[\s\S]*?: "Começar a ler"/,
  );
});

test("cta de leitura aparece antes de seguir e so existe com capitulo disponivel", () => {
  const bloco = obterBloco(
    '<div style={isDesktop ? desktopHeroActionsStyle : heroActionsStyle}>',
    "</div>\n            </div>\n          </div>",
  );

  const indiceCta = bloco.indexOf("{capituloPrincipalObra ? (");
  const indiceSeguir = bloco.indexOf("onClick={alternarSeguirObra}");
  const indiceAcoes = bloco.indexOf("onClick={alternarAcoesObra}");

  assert.ok(indiceCta >= 0);
  assert.ok(indiceSeguir > indiceCta);
  assert.ok(indiceAcoes > indiceSeguir);
  assert.match(bloco, /href=\{capituloPrincipalObra\.href\}/);
  assert.match(bloco, /\{rotuloLeituraPrincipal\}/);
});

test("cta de leitura e visualmente primario e seguir fica secundario", () => {
  const mobile = obterBloco(
    "const primaryReadingButtonStyle",
    "const secondaryButtonStyle",
  );
  const desktop = obterBloco(
    "const desktopPrimaryReadingButtonStyle",
    "const desktopObraAddButtonStyle",
  );

  assert.match(mobile, /gridColumn: "1 \/ -1"/);
  assert.match(mobile, /background: "#FFFFFF"/);
  assert.match(mobile, /color: "#08080A"/);

  assert.match(desktop, /const desktopPrimaryReadingButtonStyle/);
  assert.match(desktop, /background: "#FFFFFF"/);
  assert.match(desktop, /const desktopSecondaryFollowButtonStyle/);
  assert.match(
    desktop,
    /desktopSecondaryFollowButtonStyle[\s\S]*?background: "rgba\(10,10,12,0\.74\)"/,
  );
  assert.doesNotMatch(paginaObra, /desktopPrimaryFollowButtonStyle/);
});

test("capa comunica a mesma acao principal de leitura", () => {
  const bloco = obterBloco(
    "<Link\n              href={hrefPrincipalObra}",
    "<div\n                style={",
  );

  assert.match(bloco, /capituloPrincipalObra/);
  assert.match(bloco, /rotuloLeituraPrincipal/);
  assert.match(bloco, /Abrir \$\{obra\.titulo\}/);
});

test("rotulos principais de leitura possuem traducoes", () => {
  assert.match(
    paginaObra,
    /"Começar a ler": \{ en: "Start reading", es: "Empezar a leer" \}/,
  );
  assert.match(
    paginaObra,
    /"Continuar leitura": \{ en: "Continue reading", es: "Continuar leyendo" \}/,
  );
});
