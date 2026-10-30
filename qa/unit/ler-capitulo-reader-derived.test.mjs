import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const fonte = readFileSync(new URL("../../app/ler-capitulo/lib/ler-capitulo-reader-derived.ts", import.meta.url), "utf8");
const pagina = readFileSync(new URL("../../app/ler-capitulo/page.tsx", import.meta.url), "utf8");
const javascript = typescript.transpileModule(fonte, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const {
  obterObraAtualLeitor, obterCapituloAtualLeitor, obterIndiceCapituloLeitor,
  obterNumeroCapituloLeitor, obterCapituloAnteriorLeitor, obterProximoCapituloLeitor,
} = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);

const capitulos = [{ id: "c1" }, { id: "c2" }, { id: "c3" }];
const obra = { id: "obra", capitulos };

test("deriva obra, capítulo, índice e número com os fallbacks atuais", () => {
  assert.equal(obterObraAtualLeitor([obra], "obra"), obra);
  assert.equal(obterObraAtualLeitor([obra], "outra"), null);
  assert.equal(obterCapituloAtualLeitor(obra, "c2"), capitulos[1]);
  assert.equal(obterCapituloAtualLeitor(null, "c1"), null);
  assert.equal(obterCapituloAtualLeitor(obra, "outra"), null);
  assert.equal(obterIndiceCapituloLeitor(obra, capitulos[2]), 2);
  assert.equal(obterIndiceCapituloLeitor(null, capitulos[0]), -1);
  assert.equal(obterIndiceCapituloLeitor(obra, null), -1);
  assert.deepEqual([-1, 0, 1, 2].map(obterNumeroCapituloLeitor), [1, 1, 2, 3]);
});

test("deriva anterior e próximo preservando as guardas de índice", () => {
  assert.equal(obterCapituloAnteriorLeitor(obra, 0), null);
  assert.equal(obterCapituloAnteriorLeitor(obra, -1), null);
  assert.equal(obterCapituloAnteriorLeitor(obra, 2), capitulos[1]);
  assert.equal(obterProximoCapituloLeitor(obra, -1), null);
  assert.equal(obterProximoCapituloLeitor(obra, 1), capitulos[2]);
  assert.equal(obterProximoCapituloLeitor(obra, 2), null);
});

test("a página mantém os useMemo e dependências para cada derivação", () => {
  for (const [helper, dependencias] of [
    ["obterObraAtualLeitor", "[obras, obraId]"], ["obterCapituloAtualLeitor", "[obraAtual, capituloId]"],
    ["obterIndiceCapituloLeitor", "[obraAtual, capituloAtual]"], ["obterCapituloAnteriorLeitor", "[obraAtual, indiceCapitulo]"],
    ["obterProximoCapituloLeitor", "[obraAtual, indiceCapitulo]"],
  ]) {
    assert.match(pagina, new RegExp(`${helper}[\\s\\S]*?${dependencias.replace(/[\\[\\]]/g, "\\$&")}`));
  }
  assert.match(pagina, /const numeroCapitulo = obterNumeroCapituloLeitor\(indiceCapitulo\);/);
  assert.match(pagina, /const totalPalavras = capituloAtual \? contarPalavras\(capituloAtual\.texto\) : 0;/);
});
