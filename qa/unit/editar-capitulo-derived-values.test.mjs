import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const hookSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/hooks/useEditarCapituloDerivedValues.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);

const chamadasLeitura = [];
globalThis.__editarCapituloUseMemo = (calcular) => calcular();
globalThis.__editarCapituloCriarHrefLeitura = (...args) => {
  chamadasLeitura.push(args);
  return `/leitura/${args[1]}/${args[2]}`;
};

const hookJavascript = typescript.transpileModule(
  hookSource
    .replace(
      'import { useMemo } from "react";',
      "const useMemo = globalThis.__editarCapituloUseMemo;",
    )
    .replace(
      'import { criarHrefLeituraCapitulo } from "../lib/editar-capitulo-route-utils";',
      "const criarHrefLeituraCapitulo = globalThis.__editarCapituloCriarHrefLeitura;",
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const { useEditarCapituloDerivedValues } = await import(
  `data:text/javascript;base64,${Buffer.from(hookJavascript).toString("base64")}`,
);

function criarObras() {
  return [
    {
      id: "obra-primeira",
      titulo: "Primeira",
      slug: "primeira",
      publicado: true,
      autor: "Autora",
      capitulos: [{ id: "capitulo-primeiro", ordem: 3 }],
    },
    {
      id: "obra-alvo",
      titulo: "Obra alvo",
      slug: "obra-alvo",
      publicado: false,
      autor: "Autor",
      capitulos: [
        { id: "capitulo-sem-ordem" },
        { id: "capitulo-alvo", ordem: 7 },
      ],
    },
  ];
}

function calcularValores({
  obras = criarObras(),
  obraId = "obra-alvo",
  capituloId = "capitulo-alvo",
  titulo = "Título informado",
  texto = "Texto informado",
} = {}) {
  chamadasLeitura.length = 0;

  return useEditarCapituloDerivedValues({
    obras,
    obraId,
    capituloId,
    titulo,
    texto,
  });
}

test("valores derivados preservam a primeira obra, capítulo e ordem positiva", () => {
  const obras = [
    {
      ...criarObras()[1],
      titulo: "Primeira correspondência",
      capitulos: [{ id: "capitulo-alvo", ordem: 4 }],
    },
    ...criarObras(),
  ];
  const valores = calcularValores({ obras });

  assert.equal(valores.obraAtual, obras[0]);
  assert.equal(valores.capituloAtual, obras[0].capitulos[0]);
  assert.equal(valores.numeroCapitulo, 4);
  assert.equal(valores.capituloLabel, "Capítulo 04");
  assert.equal(valores.minhaObraHref, "/editar-obra?obraId=obra-alvo");
  assert.equal(valores.lerCapituloHref, "/leitura/capitulo-alvo/4");
  assert.deepEqual(chamadasLeitura, [[obras[0], "capitulo-alvo", 4]]);
});

test("valores derivados preservam fallbacks de ordem, links e prévia", () => {
  const obras = criarObras();
  obras[1].capitulos[1].ordem = 0;
  const comOrdemZero = calcularValores({ obras, titulo: "   ", texto: "   " });

  assert.equal(comOrdemZero.numeroCapitulo, 2);
  assert.equal(comOrdemZero.capituloLabel, "Capítulo 02");
  assert.equal(comOrdemZero.tituloPreview, "Capítulo 2");
  assert.equal(
    comOrdemZero.textoPreview,
    "O texto do capítulo vai aparecer aqui enquanto você edita.",
  );

  for (const ordem of [-1, 1.5, undefined, "2"]) {
    const obrasComOrdemInvalida = criarObras();
    obrasComOrdemInvalida[1].capitulos[1].ordem = ordem;
    assert.equal(calcularValores({ obras: obrasComOrdemInvalida }).numeroCapitulo, 2);
  }

  const semCapitulo = calcularValores({ capituloId: "capitulo-inexistente" });
  assert.equal(semCapitulo.capituloAtual, null);
  assert.equal(semCapitulo.numeroCapitulo, 0);
  assert.equal(semCapitulo.lerCapituloHref, "/painel-autor");

  const semObra = calcularValores({ obraId: "obra-inexistente", titulo: "", texto: "" });
  assert.equal(semObra.obraAtual, null);
  assert.equal(semObra.capituloAtual, null);
  assert.equal(semObra.numeroCapitulo, 0);
  assert.equal(semObra.capituloLabel, "Capítulo 01");
  assert.equal(semObra.minhaObraHref, "/painel-autor");
  assert.equal(semObra.lerCapituloHref, "/painel-autor");
  assert.equal(semObra.tituloPreview, "Capítulo");
});

test("Editar Capítulo delega somente os valores derivados ao hook", () => {
  assert.match(
    hookSource,
    /import \{ useMemo \} from "react";/,
  );
  assert.match(
    hookSource,
    /import \{ criarHrefLeituraCapitulo \} from "\.\.\/lib\/editar-capitulo-route-utils";/,
  );
  assert.match(hookSource, /const obraAtual(?:[^=]*) = useMemo\(\(\) => \{/);
  assert.match(hookSource, /\}, \[obras, obraId\]\);/);
  assert.match(hookSource, /const capituloAtual(?:[^=]*) = useMemo\(\(\) => \{/);
  assert.match(hookSource, /\}, \[obraAtual, capituloId\]\);/);
  assert.match(hookSource, /const numeroCapitulo = useMemo\(\(\) => \{/);
  assert.match(hookSource, /\}, \[obraAtual, capituloAtual\]\);/);
  assert.match(hookSource, /findIndex\(/);
  assert.match(hookSource, /numeroCapitulo \|\| 1/);
  assert.match(hookSource, /numeroCapitulo \|\| ""/);
  assert.doesNotMatch(hookSource, /supabase|localStorage|router|set[A-Z]|^\s*<[A-Za-z]/m);
  assert.match(
    pageSource,
    /import \{ useEditarCapituloDerivedValues \} from "\.\/hooks\/useEditarCapituloDerivedValues";/,
  );
  assert.match(pageSource, /\} = useEditarCapituloDerivedValues\(\{/);
  assert.doesNotMatch(pageSource, /const obraAtual = useMemo/);
  assert.doesNotMatch(pageSource, /const capituloAtual = useMemo/);
  assert.doesNotMatch(pageSource, /const numeroCapitulo = useMemo/);
  assert.doesNotMatch(pageSource, /import \{ useEffect, useMemo, useState \} from "react";/);
  assert.doesNotMatch(
    pageSource,
    /import \{\s*criarHrefLeituraCapitulo,/,
  );
  for (const consumidor of [
    "obraAtual",
    "capituloAtual",
    "numeroCapitulo",
    "capituloLabel",
    "minhaObraHref",
    "lerCapituloHref",
    "tituloPreview",
    "textoPreview",
  ]) {
    assert.match(pageSource, new RegExp(`\\b${consumidor}\\b`));
  }
});
