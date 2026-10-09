import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-collection-utils.ts",
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
    'import { criarSlugBase, normalizarTexto } from "../../../lib/utils";',
    `const criarSlugBase = (texto) => texto.trim().toLowerCase().replace(/\\s+/g, "-");
const normalizarTexto = (texto) => texto
  .normalize("NFD")
  .replace(/[\\u0300-\\u036f]/g, "")
  .trim()
  .toLowerCase()
  .replace(/\\s+/g, " ");`,
  );
const {
  obterIdentificadoresObraPainel,
  colecaoTemObraPainel,
  removerObraDaColecaoPainel,
} = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

const obra = {
  id: " obra-1 ",
  slug: "fantasia-sombria",
  titulo: "Fantasia Sombria",
};

test("identificadores preservam normalizacao, ordem e deduplicacao", () => {
  assert.deepEqual(obterIdentificadoresObraPainel(obra), [
    "obra-1",
    "fantasia-sombria",
    "fantasia sombria",
  ]);
});

test("colecao reconhece identificadores normalizados da obra", () => {
  assert.equal(colecaoTemObraPainel([" outra-obra ", "fantasia sombria"], obra), true);
  assert.equal(colecaoTemObraPainel(["outra-obra"], obra), false);
});

test("remocao preserva itens nao relacionados e remove todos os identificadores", () => {
  assert.deepEqual(
    removerObraDaColecaoPainel(
      ["obra-1", " fantasia-sombria ", "fantasia sombria", "outra-obra"],
      obra,
    ),
    ["outra-obra"],
  );
});

test("Painel do Autor delega somente helpers puros de colecao", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?colecaoTemObraPainel,[\s\S]*?obterIdentificadoresObraPainel,[\s\S]*?removerObraDaColecaoPainel,[\s\S]*?\} from "\.\/lib\/painel-autor-collection-utils";/,
  );
  assert.doesNotMatch(pagina, /function obterIdentificadoresObraPainel\(/);
  assert.doesNotMatch(pagina, /function colecaoTemObraPainel\(/);
  assert.doesNotMatch(pagina, /function removerObraDaColecaoPainel\(/);
  assert.equal((pagina.match(/\bobterIdentificadoresObraPainel\b/g) || []).length, 2);
  assert.equal((pagina.match(/\bcolecaoTemObraPainel\b/g) || []).length, 3);
  assert.equal((pagina.match(/\bremoverObraDaColecaoPainel\b/g) || []).length, 4);
  assert.match(pagina, /function limparReferenciasLocaisObraExcluidaPainel\(/);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
  assert.doesNotMatch(utilsSource, /supabase|localStorage|useState|useEffect/);
});
