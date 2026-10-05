import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const textosObraTypescript = readFileSync(
  new URL("../../app/obra/[slug]/lib/obra-text-utils.ts", import.meta.url),
  "utf8",
).replace(/import \{ normalizarTexto \} from "\.\.\/\.\.\/\.\.\/\.\.\/lib\/utils";\r?\n/, "");
const textosObraJavascript = typescript.transpileModule(
  textosObraTypescript,
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const { traduzirTextoObraDinamica } = await import(
  `data:text/javascript;base64,${Buffer.from(textosObraJavascript).toString("base64")}`,
);

test("traduz textos exatos pela tabela dinâmica", () => {
  assert.equal(
    traduzirTextoObraDinamica("Começar a ler", "en"),
    "Start reading",
  );
  assert.equal(
    traduzirTextoObraDinamica("Continuar leitura", "es"),
    "Continuar leyendo",
  );
});

test("preserva whitespace inicial e final ao traduzir", () => {
  assert.equal(
    traduzirTextoObraDinamica("  Carregando obra\n", "en"),
    "  Loading work\n",
  );
});

test("prioriza regex específicos antes do fallback genérico", () => {
  assert.equal(
    traduzirTextoObraDinamica("Abrir arquivo roteiro.pdf", "en"),
    "Open file roteiro.pdf",
  );
  assert.equal(
    traduzirTextoObraDinamica("Abrir posts desta obra na Comunidade", "en"),
    "Open this work's posts in Community",
  );
});

test("interpola quantidade e pluralização", () => {
  assert.equal(
    traduzirTextoObraDinamica("Ver 2 respostas", "en"),
    "View 2 replies",
  );
  assert.equal(
    traduzirTextoObraDinamica("há 1 dia", "es"),
    "hace 1 día",
  );
});

test("mantém o texto original quando não há tradução", () => {
  assert.equal(
    traduzirTextoObraDinamica("Texto sem mapeamento", "en"),
    "Texto sem mapeamento",
  );
  assert.equal(
    traduzirTextoObraDinamica("Começar a ler", "pt-BR"),
    "Começar a ler",
  );
});
