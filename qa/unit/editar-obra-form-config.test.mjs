import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-form-config.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const initialLoadSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-initial-load.ts",
    import.meta.url,
  ),
  "utf8",
);
const consumerSource = `${pageSource}\n${initialLoadSource}`;
const javascript = typescript
  .transpileModule(
    source.replace(
      'import { LIMITES_BYTES_STORAGE } from "../../../lib/storageUploads";',
      'const LIMITES_BYTES_STORAGE = { "capas-obras": 2 * 1024 * 1024, "arquivos-obras": 5 * 1024 * 1024 };',
    ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  )
  .outputText;
const config = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("configuração estática de Editar Obra preserva limites e opções", () => {
  assert.equal(config.TAMANHO_MAXIMO_CAPA, 2 * 1024 * 1024);
  assert.equal(config.TAMANHO_MAXIMO_ARQUIVO_OBRA, 5 * 1024 * 1024);
  assert.equal(config.LIMITE_TAGS_OBRA, 1);
  assert.equal(config.OUTRO_FORMATO_VALUE, "__outro_formato__");
  assert.equal(config.OUTRO_GENERO_VALUE, "__outro_genero__");
  assert.equal(config.OUTRA_TAG_VALUE, "__outra_tag__");
  assert.equal(config.LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO, 14);
  assert.equal(config.LIMITE_CARACTERES_TAG_PERSONALIZADA, 10);
  assert.deepEqual(config.OPCOES_FORMATO_OBRA, [
    "Webnovel",
    "Light novel",
    "Romance",
    "Conto",
    "Poesia",
    "HQ",
    "Mangá",
    "Fanfic",
  ]);
  assert.deepEqual(config.OPCOES_GENERO_OBRA, [
    "Fantasia",
    "Terror",
    "Ficção",
    "Romance",
    "Drama",
    "Ação",
    "Mistério",
    "Suspense",
    "Aventura",
    "Comédia",
  ]);
  assert.deepEqual(config.OPCOES_TAGS_OBRA, [
    "Sombria",
    "Psicológico",
    "Sci-fi",
    "Cyberpunk",
    "Espacial",
    "Isekai",
    "Distopia",
    "Apocalipse",
    "Escolar",
    "Máfia",
    "Investigação",
    "Religioso",
    "Mitologia",
    "Folclore",
    "Vampiro",
    "Lobisomem",
    "Zumbi",
    "Super-herói",
    "Magia",
    "Guerra",
    "Família",
    "Amizade",
    "Traição",
    "Vingança",
    "Sobrevivência",
  ]);
});

test("Editar Obra delega apenas a configuração estática do formulário", () => {
  assert.match(
    source,
    /import \{ LIMITES_BYTES_STORAGE \} from "\.\.\/\.\.\/\.\.\/lib\/storageUploads";/,
  );
  assert.match(source, /LIMITES_BYTES_STORAGE\["capas-obras"\]/);
  assert.match(source, /LIMITES_BYTES_STORAGE\["arquivos-obras"\]/);

  for (const constante of [
    "TAMANHO_MAXIMO_CAPA",
    "TAMANHO_MAXIMO_ARQUIVO_OBRA",
    "LIMITE_TAGS_OBRA",
    "OUTRO_FORMATO_VALUE",
    "OUTRO_GENERO_VALUE",
    "OUTRA_TAG_VALUE",
    "LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO",
    "LIMITE_CARACTERES_TAG_PERSONALIZADA",
    "OPCOES_FORMATO_OBRA",
    "OPCOES_GENERO_OBRA",
    "OPCOES_TAGS_OBRA",
  ]) {
    assert.match(source, new RegExp(`export const ${constante}`));
    assert.doesNotMatch(pageSource, new RegExp(`const ${constante}\\s*=`));
    assert.match(consumerSource, new RegExp(`\\b${constante}\\b`));
  }

  assert.match(
    pageSource,
    /from "\.\/lib\/editar-obra-form-config";/,
  );
  assert.doesNotMatch(pageSource, /LIMITES_BYTES_STORAGE/);
  assert.match(source, /\] as const;/);
});
