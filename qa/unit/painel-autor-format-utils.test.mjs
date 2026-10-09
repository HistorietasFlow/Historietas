import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-format-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const utilsJavascript = typescript
  .transpileModule(utilsSource, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  })
  .outputText.replace(
    'import { normalizarTexto } from "../../../lib/utils";',
    'const normalizarTexto = (texto) => texto.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").trim().toLowerCase().replace(/\\s+/g, " ");',
  );
const { formatarGeneroPainelAutor, obterTimestamp } = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

test("formatarGeneroPainelAutor preserva normalização e fallbacks", () => {
  assert.equal(formatarGeneroPainelAutor(" Fantasia Sombria "), "Fantasia");
  assert.equal(formatarGeneroPainelAutor("SCI FI"), "Ficção");
  assert.equal(formatarGeneroPainelAutor("Aventura"), "Aventura");
  assert.equal(formatarGeneroPainelAutor("   "), "Não informado");
});

test("obterTimestamp preserva data válida e fallback inválido", () => {
  assert.equal(obterTimestamp("2024-01-01T00:00:00.000Z"), 1704067200000);
  assert.equal(obterTimestamp("invalida"), 0);
});

test("Painel do Autor delega somente os formatadores", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?formatarGeneroPainelAutor,[\s\S]*?obterTimestamp,[\s\S]*?\} from "\.\/lib\/painel-autor-format-utils";/,
  );
  assert.doesNotMatch(pagina, /function formatarGeneroPainelAutor\(/);
  assert.doesNotMatch(pagina, /function obterTimestamp\(/);
  assert.equal((pagina.match(/\bformatarGeneroPainelAutor\b/g) || []).length, 2);
  assert.equal((pagina.match(/\bobterTimestamp\b/g) || []).length, 5);
  assert.match(
    pagina,
    /import \{[\s\S]*?criarHrefLeituraCapituloPainel[\s\S]*?\} from "\.\/lib\/painel-autor-route-utils";/,
  );
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
});
