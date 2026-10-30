import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const modulo = ler(
  "../../app/ler-capitulo/lib/ler-capitulo-local-work-mutations.ts",
);
const normalizacao = ler(
  "../../app/ler-capitulo/lib/ler-capitulo-work-normalization.ts",
);
const js = (source) =>
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const dataUrl = (source) =>
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const utilsUrl = dataUrl(js(ler("../../lib/utils.ts")));
const adultoUrl = dataUrl(js(ler("../../lib/historietasAdultContent.ts")));
const normalizacaoUrl = dataUrl(
  js(normalizacao)
    .replace('"../../../lib/utils"', JSON.stringify(utilsUrl))
    .replace(
      '"../../../lib/historietasAdultContent"',
      JSON.stringify(adultoUrl),
    ),
);
const executavel = js(modulo).replace(
  '"./ler-capitulo-work-normalization"',
  JSON.stringify(normalizacaoUrl),
);
const {
  normalizarObrasLeitor,
  atualizarCapituloNasObrasLeitor,
} = await import(dataUrl(executavel));

test("normaliza cada obra local na ordem e com o índice correspondente", () => {
  assert.match(
    modulo,
    /obras\.map\(\s*\(obra, index\) =>\s*normalizarObra\(\s*obra,\s*index,?\s*\),?\s*\)/,
  );

  const obras = normalizarObrasLeitor([
    { titulo: "Primeira" },
    { titulo: "Segunda" },
  ]);

  assert.deepEqual(
    obras.map((obra) => obra.id),
    ["obra-1", "obra-2"],
  );
  assert.deepEqual(
    obras.map((obra) => obra.titulo),
    ["Primeira", "Segunda"],
  );
});

test("atualiza somente o capítulo alvo e recalcula o progresso da obra alvo", () => {
  const resultado = atualizarCapituloNasObrasLeitor({
    obras: [
      {
        id: "obra-alvo",
        titulo: "Alvo",
        capitulos: [
          { id: "capitulo-1", titulo: "Um", lido: false },
          { id: "capitulo-2", titulo: "Dois", lido: false },
        ],
      },
      {
        id: "obra-outra",
        titulo: "Outra",
        capitulos: [{ id: "capitulo-3", titulo: "Três", lido: false }],
      },
    ],
    obraAtualId: "obra-alvo",
    capituloAtualId: "capitulo-2",
    dados: { lido: true, lidoEm: "2026-10-30" },
  });

  assert.deepEqual(
    resultado.map((obra) => obra.id),
    ["obra-alvo", "obra-outra"],
  );
  assert.equal(resultado[0].capitulos[0].lido, false);
  assert.equal(resultado[0].capitulos[1].lido, true);
  assert.equal(resultado[0].capitulos[1].lidoEm, "2026-10-30");
  assert.equal(resultado[0].progressoLeitura, 50);
  assert.equal(resultado[1].capitulos[0].lido, false);
  assert.equal(resultado[1].progressoLeitura, 0);
});

test("módulo mantém as transformações puras, sem React, Supabase ou persistência", () => {
  assert.match(modulo, /export function normalizarObrasLeitor\(/);
  assert.match(modulo, /export function atualizarCapituloNasObrasLeitor\(/);
  assert.match(modulo, /obraNormalizada\.id !==\s*obraAtualId/);
  assert.match(modulo, /capitulo\.id !==\s*capituloAtualId/);
  assert.match(modulo, /\.\.\.capitulo,\s*\.\.\.dados,/);
  assert.match(modulo, /calcularProgressoLeitura\(\s*capitulosAtualizados,?\s*\)/);
  assert.doesNotMatch(
    modulo,
    /react|supabase|localStorage|use(?:Effect|State|Memo)|router|\.(?:insert|update|delete|upsert)\(|<[A-Z][\w.]*\s+[^>]*>/i,
  );
});
