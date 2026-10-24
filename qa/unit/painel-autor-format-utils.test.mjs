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
const converterSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-supabase-work-converter.ts",
    import.meta.url,
  ),
  "utf8",
);
const workFilteringSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-work-filtering.ts",
    import.meta.url,
  ),
  "utf8",
);
const workCardSource = readFileSync(
  new URL(
    "../../app/painel-autor/components/painel-autor-work-card.tsx",
    import.meta.url,
  ),
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

test("Painel do Autor delega os formatadores às fronteiras corretas", () => {
  assert.match(
    converterSource,
    /import \{ obterTimestamp \} from "\.\/painel-autor-format-utils";/,
  );
  assert.doesNotMatch(pagina, /function formatarGeneroPainelAutor\(/);
  assert.doesNotMatch(pagina, /function obterTimestamp\(/);
  assert.equal((pagina.match(/\bformatarGeneroPainelAutor\b/g) || []).length, 0);
  assert.equal((pagina.match(/\bobterTimestamp\b/g) || []).length, 0);
  assert.equal((converterSource.match(/\bobterTimestamp\b/g) || []).length, 3);
  assert.match(converterSource, /obterTimestamp\(lidoEm\)/);
  assert.match(converterSource, /obterTimestamp\(ultimaLeituraEm\)/);
  assert.match(
    workFilteringSource,
    /import \{[\s\S]*?formatarGeneroPainelAutor,[\s\S]*?obterTimestamp,[\s\S]*?\} from "\.\/painel-autor-format-utils";/,
  );
  assert.match(workFilteringSource, /formatarGeneroPainelAutor\(obra\.genero\)/);
  assert.match(workFilteringSource, /obterTimestamp\(obraB\.criadaEm\)/);
  assert.match(
    workCardSource,
    /import \{[\s\S]*?criarHrefLeituraCapituloPainel[\s\S]*?\} from "\.\.\/lib\/painel-autor-route-utils";/,
  );
  assert.match(
    readFileSync(new URL("../../app/painel-autor/hooks/use-painel-autor-auth-session.ts", import.meta.url), "utf8"),
    /supabase\.auth\.getUser\(\)/,
  );
});
