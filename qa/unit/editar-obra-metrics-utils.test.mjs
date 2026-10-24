import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";
import "./editar-obra-ownership-utils.test.mjs";

const source = readFileSync(new URL("../../app/editar-obra/lib/editar-obra-metrics-utils.ts", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../../app/editar-obra/page.tsx", import.meta.url), "utf8");
const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { calcularProgressoLeitura, normalizarContadorEdicaoObra } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

test("normaliza contadores com arredondamento, limites e formatos existentes", () => {
  assert.equal(normalizarContadorEdicaoObra(4), 4);
  assert.equal(normalizarContadorEdicaoObra(1.6), 2);
  assert.equal(normalizarContadorEdicaoObra(-2), 0);
  assert.equal(normalizarContadorEdicaoObra("12"), 12);
  assert.equal(normalizarContadorEdicaoObra("1.234"), 1234);
  assert.equal(normalizarContadorEdicaoObra("1,6"), 2);
  assert.equal(normalizarContadorEdicaoObra("inválido", 4.6), 5);
  assert.equal(normalizarContadorEdicaoObra(Number.NaN, 3), 3);
  assert.equal(normalizarContadorEdicaoObra(Number.POSITIVE_INFINITY, -2), 0);
});

test("calcula progresso de leitura vazio, parcial e arredondado", () => {
  assert.equal(calcularProgressoLeitura([]), 0);
  assert.equal(calcularProgressoLeitura([{ lido: false }, { lido: false }]), 0);
  assert.equal(calcularProgressoLeitura([{ lido: true }, { lido: true }]), 100);
  assert.equal(calcularProgressoLeitura([{ lido: true }, { lido: false }, { lido: false }]), 33);
  assert.equal(calcularProgressoLeitura([{ lido: true }, { lido: true }, { lido: false }]), 67);
});

test("Editar Obra delega somente as métricas puras", () => {
  assert.match(pageSource, /from "\.\/lib\/editar-obra-metrics-utils";/);
  for (const helper of ["normalizarContadorEdicaoObra", "calcularProgressoLeitura"]) {
    assert.doesNotMatch(pageSource, new RegExp(`function ${helper}\\(`));
  }
  assert.ok(source.includes('Number(valor.replace(/\\./g, "").replace(",", "."))'));
  assert.match(source, /Math\.round\(\(capitulosLidos \/ capitulos\.length\) \* 100\)/);
  assert.doesNotMatch(source, /supabase|localStorage|useState|useEffect/);
});
