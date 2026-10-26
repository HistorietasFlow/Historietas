import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const orderSource = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/lib/adicionar-capitulo-chapter-order-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const orderJavascript = typescript.transpileModule(orderSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  obterOrdemCapitulo,
  obterProximaOrdemCapitulo,
  ordenarCapitulosPorOrdem,
} = await import(
  `data:text/javascript;base64,${Buffer.from(orderJavascript).toString("base64")}`,
);

test("helpers de ordenação preservam ordens válidas e fallbacks", () => {
  assert.equal(obterOrdemCapitulo({ ordem: 4 }, 2), 4);
  assert.equal(obterOrdemCapitulo({ ordem: 0 }, 2), 2);
  assert.equal(obterOrdemCapitulo({ ordem: -1 }, 2), 2);
  assert.equal(obterOrdemCapitulo({ ordem: 1.5 }, 2), 2);
  assert.equal(obterOrdemCapitulo({}, 2), 2);
  assert.equal(obterOrdemCapitulo({}, 0), 1);
});

test("helpers de ordenação calculam a próxima ordem pela maior ordem válida", () => {
  assert.equal(obterProximaOrdemCapitulo([]), 1);
  assert.equal(obterProximaOrdemCapitulo([{ ordem: 1 }, { ordem: 5 }, { ordem: 2 }]), 6);
  assert.equal(obterProximaOrdemCapitulo([{ ordem: 0 }, {}, { ordem: 7 }]), 8);
});

test("helpers de ordenação ordenam cópia por ordem e criadoEm", () => {
  const capitulos = [
    { id: "invalido", ordem: 0, criadoEm: "2024-01-01" },
    { id: "segundo-tarde", ordem: 2, criadoEm: "2024-04-01" },
    { id: "primeiro", ordem: 1, criadoEm: "2024-05-01" },
    { id: "segundo-cedo", ordem: 2, criadoEm: "2024-03-01" },
  ];
  const original = [...capitulos];
  const ordenados = ordenarCapitulosPorOrdem(capitulos);

  assert.notEqual(ordenados, capitulos);
  assert.deepEqual(capitulos, original);
  assert.deepEqual(ordenados.map((capitulo) => capitulo.id), [
    "primeiro",
    "segundo-cedo",
    "segundo-tarde",
    "invalido",
  ]);
  assert.equal(ordenados[0], capitulos[2]);
});

test("Adicionar Capítulo delega somente a ordenação ao módulo extraído", () => {
  assert.match(
    pageSource,
    /import \{[\s\S]*?obterOrdemCapitulo,[\s\S]*?obterProximaOrdemCapitulo,[\s\S]*?ordenarCapitulosPorOrdem,[\s\S]*?\} from "\.\/lib\/adicionar-capitulo-chapter-order-utils";/,
  );
  assert.doesNotMatch(pageSource, /function obterOrdemCapitulo\(/);
  assert.doesNotMatch(pageSource, /function obterProximaOrdemCapitulo\(/);
  assert.doesNotMatch(pageSource, /function ordenarCapitulosPorOrdem\(/);
  assert.equal((pageSource.match(/obterOrdemCapitulo\(/g) || []).length, 2);
  assert.equal((pageSource.match(/obterProximaOrdemCapitulo\(/g) || []).length, 2);
  assert.equal((pageSource.match(/ordenarCapitulosPorOrdem\(/g) || []).length, 1);
  assert.match(pageSource, /function normalizarCapitulo\(/);
  assert.match(orderSource, /return \[\.\.\.capitulos\]\.sort\(/);
  assert.match(orderSource, /capituloA\.criadoEm\.localeCompare\(capituloB\.criadoEm\)/);
  assert.doesNotMatch(
    orderSource,
    /supabase|localStorage|useState|useEffect|router|<[A-Z][A-Za-z]*(?:\s[^>]*)?>[\s\S]*?<\/[A-Z]/,
  );
});
