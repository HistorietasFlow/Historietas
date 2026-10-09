import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const translations = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-translations.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const translationsJavascript = typescript.transpileModule(translations, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  PAINEL_AUTOR_UI_TRANSLATIONS,
  traduzirTextoPainelAutor,
} = await import(
  `data:text/javascript;base64,${Buffer.from(translationsJavascript).toString("base64")}`,
);

test("exporta a tabela integral e o helper de traduções do Painel do Autor", () => {
  assert.match(translations, /export type PainelAutorTranslationEntry = \{/);
  assert.match(translations, /export const PAINEL_AUTOR_UI_TRANSLATIONS/);
  assert.match(translations, /export function traduzirTextoPainelAutor\(/);
  assert.deepEqual(PAINEL_AUTOR_UI_TRANSLATIONS["Todas as obras"], {
    en: "All works",
    es: "Todas las obras",
  });
  assert.deepEqual(PAINEL_AUTOR_UI_TRANSLATIONS["Carregando Painel do Autor"], {
    en: "Loading Author Dashboard",
    es: "Cargando el Panel del Autor",
  });
  assert.deepEqual(PAINEL_AUTOR_UI_TRANSLATIONS["Livre"], {
    en: "All ages",
    es: "Todo público",
  });
});

test("preserva traduções exatas, whitespace e fallback em português", () => {
  assert.equal(
    traduzirTextoPainelAutor("Painel do autor", "pt-BR"),
    "Painel do autor",
  );
  assert.equal(
    traduzirTextoPainelAutor("  Painel do autor\n", "en"),
    "  Author dashboard\n",
  );
  assert.equal(
    traduzirTextoPainelAutor("  Carregando Painel do Autor  ", "es"),
    "  Cargando el Panel del Autor  ",
  );
  assert.equal(
    traduzirTextoPainelAutor("Texto sem mapeamento", "en"),
    "Texto sem mapeamento",
  );
  assert.equal(traduzirTextoPainelAutor("", "es"), "");
});

test("preserva expressões regulares e textos dinâmicos", () => {
  assert.equal(
    traduzirTextoPainelAutor("Abrir opções de Ação", "en"),
    "Open options for Ação",
  );
  assert.equal(
    traduzirTextoPainelAutor("Ações de Uma obra", "es"),
    "Acciones de Uma obra",
  );
  assert.equal(
    traduzirTextoPainelAutor("Capítulo 12", "en"),
    "Chapter 12",
  );
  assert.equal(
    traduzirTextoPainelAutor("8 comentários", "es"),
    "8 comentarios",
  );
  assert.equal(
    traduzirTextoPainelAutor("Uma obra no HISTORIETAS", "en"),
    "Uma obra on HISTORIETAS",
  );
  assert.equal(
    traduzirTextoPainelAutor(
      "Confira a obra Aurora de Ana no HISTORIETAS.",
      "es",
    ),
    "Descubre la obra Aurora de Ana en HISTORIETAS.",
  );
  assert.equal(
    traduzirTextoPainelAutor(
      'Tem certeza que deseja excluir a obra "Aurora"? Todos os capítulos e registros dessa obra serão removidos. Essa ação não pode ser desfeita.',
      "en",
    ),
    'Are you sure you want to delete the work "Aurora"? All chapters and records for this work will be removed. This action cannot be undone.',
  );
  assert.equal(
    traduzirTextoPainelAutor(
      "Não consegui excluir os capítulos da obra: falha",
      "es",
    ),
    "No se pudieron eliminar los capítulos de la obra: falha",
  );
});

test("mantém os consumidores de tradução e delega o bridge na página", () => {
  assert.match(
    pagina,
    /import \{ traduzirTextoPainelAutor \} from "\.\/lib\/painel-autor-translations";/,
  );
  assert.doesNotMatch(pagina, /type PainelAutorTranslationEntry = \{/);
  assert.doesNotMatch(pagina, /const PAINEL_AUTOR_UI_TRANSLATIONS/);
  assert.doesNotMatch(pagina, /function traduzirTextoPainelAutor\(/);
  assert.match(
    pagina,
    /import \{ PainelAutorLanguageBridge \} from "\.\/components\/painel-autor-language-bridge";/,
  );
  assert.doesNotMatch(pagina, /function PainelAutorLanguageBridge\(\)/);
  assert.equal((pagina.match(/<PainelAutorLanguageBridge \/>/g) || []).length, 2);
  assert.ok((pagina.match(/traduzirTextoPainelAutor\(/g) || []).length >= 7);
});
