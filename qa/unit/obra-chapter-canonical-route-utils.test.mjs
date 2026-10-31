import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/obra/[slug]/capitulo/[numero]/lib/obra-chapter-canonical-route-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL(
    "../../app/obra/[slug]/capitulo/[numero]/page.tsx",
    import.meta.url,
  ),
  "utf8",
);
const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const routeUtils = await import(
  "data:text/javascript;base64," + Buffer.from(javascript).toString("base64"),
);

test("decodificarSlugSeguro preserva trim, decode e rejeições de segurança", () => {
  assert.equal(routeUtils.decodificarSlugSeguro("  obra%20nova  "), "obra nova");
  assert.equal(routeUtils.decodificarSlugSeguro(""), "");
  assert.equal(routeUtils.decodificarSlugSeguro("obra/parte"), "");
  assert.equal(routeUtils.decodificarSlugSeguro("obra\\parte"), "");
  assert.equal(routeUtils.decodificarSlugSeguro("obra\u0000nova"), "");
  assert.equal(routeUtils.decodificarSlugSeguro("obra\u007Fnova"), "");
  assert.equal(routeUtils.decodificarSlugSeguro("a".repeat(181)), "");
  assert.equal(routeUtils.decodificarSlugSeguro("%E0%A4%A"), "");
});

test("obterNumeroCapituloSeguro preserva o contrato de inteiros positivos seguros", () => {
  assert.equal(routeUtils.obterNumeroCapituloSeguro("1"), 1);
  assert.equal(routeUtils.obterNumeroCapituloSeguro("  12  "), 12);
  assert.equal(routeUtils.obterNumeroCapituloSeguro("0"), null);
  assert.equal(routeUtils.obterNumeroCapituloSeguro("01"), null);
  assert.equal(routeUtils.obterNumeroCapituloSeguro("-1"), null);
  assert.equal(routeUtils.obterNumeroCapituloSeguro("1.5"), null);
  assert.equal(routeUtils.obterNumeroCapituloSeguro("capitulo"), null);
  assert.equal(routeUtils.obterNumeroCapituloSeguro(""), null);
  assert.equal(
    routeUtils.obterNumeroCapituloSeguro(String(Number.MAX_SAFE_INTEGER + 1)),
    null,
  );
});

test("a página delega somente as validações e preserva a rota canônica", () => {
  [
    'from "./lib/obra-chapter-canonical-route-utils";',
    'decodificarSlugSeguro(slug || "")',
    'obterNumeroCapituloSeguro(numero || "")',
    'redirect("/explorar")',
    'const obraHref = \`/obra/\${encodeURIComponent(slugSeguro)}\`;',
    "await obterRotaCapituloPublico(",
    ").catch(() => null)",
    "new URLSearchParams({",
    "obraId: rotaCapitulo.obraId",
    "capituloId: rotaCapitulo.capituloId",
    "redirect(\`/ler-capitulo?\${leituraParams.toString()}\`)",
  ].forEach((contract) => assert.ok(page.includes(contract), contract));

  [
    "function decodificarSlugSeguro",
    "function obterNumeroCapituloSeguro",
  ].forEach((contract) => assert.ok(!page.includes(contract), contract));
});
