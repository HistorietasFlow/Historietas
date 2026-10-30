import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const fonte = ler("../../app/ler-capitulo/lib/ler-capitulo-login-route.ts");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const javascript = typescript.transpileModule(fonte, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { criarLoginHrefLeitor } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);
const obterRedirect = (href) =>
  new URLSearchParams(href.slice(href.indexOf("?") + 1)).get("redirectTo");

test("criarLoginHrefLeitor preserva trims, omissões e encoding dos parâmetros", () => {
  assert.equal(obterRedirect(criarLoginHrefLeitor()), "/ler-capitulo");
  assert.equal(obterRedirect(criarLoginHrefLeitor("  obra-1  ")), "/ler-capitulo?obraId=obra-1");
  assert.equal(obterRedirect(criarLoginHrefLeitor(undefined, "  capitulo-1  ")), "/ler-capitulo?capituloId=capitulo-1");
  const href = criarLoginHrefLeitor(" obra /? & ", " capítulo ?& ");
  assert.match(href, /^\/login\?redirectTo=/);
  assert.equal(obterRedirect(href), "/ler-capitulo?obraId=obra+%2F%3F+%26&capituloId=cap%C3%ADtulo+%3F%26");
  assert.match(fonte, /new URLSearchParams\(\)/);
  assert.match(fonte, /new URLSearchParams\(\{[\s\S]*?redirectTo,/);
});

test("a página usa a rota de login extraída sem redefini-la", () => {
  assert.match(pagina, /import \{[\s\S]*?criarLoginHrefLeitor,[\s\S]*?\} from "\.\/lib\/ler-capitulo-login-route";/);
  assert.doesNotMatch(pagina, /function criarLoginHrefLeitor\(/);
  assert.match(pagina, /criarLoginHrefLeitor\(/);
});
