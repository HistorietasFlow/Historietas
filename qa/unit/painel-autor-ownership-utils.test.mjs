import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-ownership-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const utilsJavascript = typescript.transpileModule(utilsSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  filtrarObrasDoUsuarioPainel,
  marcarObrasComDonoPainel,
  normalizarIdUsuarioPainel,
  obraPertenceAoUsuarioPainel,
} = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

test("normalizarIdUsuarioPainel preserva trim e lowercase", () => {
  assert.equal(normalizarIdUsuarioPainel("  Usuario-ABC  "), "usuario-abc");
  assert.equal(normalizarIdUsuarioPainel("   "), "");
});

test("obraPertenceAoUsuarioPainel exige IDs normalizados, presentes e iguais", () => {
  assert.equal(obraPertenceAoUsuarioPainel({ autorId: " Autor-1 " }, "autor-1"), true);
  assert.equal(obraPertenceAoUsuarioPainel({ autorId: "" }, "autor-1"), false);
  assert.equal(obraPertenceAoUsuarioPainel({}, "autor-1"), false);
  assert.equal(obraPertenceAoUsuarioPainel({ autorId: "autor-1" }, ""), false);
  assert.equal(obraPertenceAoUsuarioPainel({ autorId: "autor-1" }, "autor-2"), false);
});

test("helpers de obras do usuário preservam guardas, propriedade e identidade", () => {
  const obras = [
    { id: "1", autorId: " Autor-1 ", titulo: "Primeira" },
    { id: "2", autorId: "autor-2", titulo: "Segunda" },
  ];

  assert.deepEqual(filtrarObrasDoUsuarioPainel(obras, "  autor-1  "), [obras[0]]);
  assert.deepEqual(filtrarObrasDoUsuarioPainel(obras, "   "), []);
  assert.deepEqual(marcarObrasComDonoPainel(obras, "  novo-autor  "), [
    { id: "1", autorId: "Autor-1", titulo: "Primeira" },
    { id: "2", autorId: "autor-2", titulo: "Segunda" },
  ]);
  assert.deepEqual(marcarObrasComDonoPainel([{ id: "3", titulo: "Terceira" }], " autor-3 "), [
    { id: "3", autorId: "autor-3", titulo: "Terceira" },
  ]);
  assert.deepEqual(marcarObrasComDonoPainel(obras, " "), []);
});

test("Painel do Autor delega somente identificação e propriedade ao helper extraído", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?filtrarObrasDoUsuarioPainel,[\s\S]*?marcarObrasComDonoPainel,[\s\S]*?normalizarIdUsuarioPainel,[\s\S]*?obraPertenceAoUsuarioPainel,[\s\S]*?\} from "\.\/lib\/painel-autor-ownership-utils";/,
  );
  assert.doesNotMatch(pagina, /function normalizarIdUsuarioPainel\(/);
  assert.doesNotMatch(pagina, /function obraPertenceAoUsuarioPainel\(/);
  assert.doesNotMatch(pagina, /function filtrarObrasDoUsuarioPainel\(/);
  assert.doesNotMatch(pagina, /function marcarObrasComDonoPainel\(/);
  assert.equal((pagina.match(/\bnormalizarIdUsuarioPainel\b/g) || []).length, 3);
  assert.equal((pagina.match(/\bobraPertenceAoUsuarioPainel\b/g) || []).length, 2);
  assert.doesNotMatch(utilsSource, /supabase|localStorage|useState|useEffect/);
});
