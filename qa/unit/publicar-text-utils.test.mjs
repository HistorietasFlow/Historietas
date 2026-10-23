import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL("../../app/publicar/lib/publicar-text-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/publicar/page.tsx", import.meta.url),
  "utf8",
);
const helpersArquivo = readFileSync(
  new URL("../../app/publicar/lib/publicar-file-utils.ts", import.meta.url),
  "utf8",
);
const helpersStorageUsuario = readFileSync(
  new URL("../../app/publicar/lib/publicar-user-storage-utils.ts", import.meta.url),
  "utf8",
);
const helpersOperacoesStorage = readFileSync(
  new URL("../../app/publicar/lib/publicar-storage-operations.ts", import.meta.url),
  "utf8",
);
const hookConteudoArquivo = readFileSync(
  new URL(
    "../../app/publicar/hooks/use-publicar-content-file-upload.ts",
    import.meta.url,
  ),
  "utf8",
);
const hookOpcoesPublicacao = readFileSync(
  new URL(
    "../../app/publicar/hooks/use-publicar-publication-options.ts",
    import.meta.url,
  ),
  "utf8",
);
const hookTags = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-tags.ts", import.meta.url),
  "utf8",
);
const hookValidacao = readFileSync(
  new URL(
    "../../app/publicar/hooks/use-publicar-form-validation.ts",
    import.meta.url,
  ),
  "utf8",
);
const metadadosFormulario = readFileSync(
  new URL(
    "../../app/publicar/lib/publicar-form-display-metadata.ts",
    import.meta.url,
  ),
  "utf8",
);
const utilsJavascript = typescript.transpileModule(utilsSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  calcularMinutosLeitura,
  campoValido,
  contarCaracteresValidos,
  contarPalavras,
  limparTextoPersonalizado,
  nomeArquivoParaTitulo,
  textoPersonalizadoValido,
} = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

test("contarCaracteresValidos e campoValido preservam letras, numeros e minimo", () => {
  assert.equal(contarCaracteresValidos(" Olá, mundo! 123 "), 11);
  assert.equal(contarCaracteresValidos("---"), 0);
  assert.equal(campoValido(" Ab1 ", 3), true);
  assert.equal(campoValido(" A- ", 2), false);
});

test("limparTextoPersonalizado preserva limpeza, espacos e limite", () => {
  assert.equal(
    limparTextoPersonalizado("  Nome!   com_ teste?  ", 40),
    "Nome com teste ",
  );
  assert.equal(limparTextoPersonalizado("abcdef", 4), "abcd");
});

test("textoPersonalizadoValido preserva minimo, limite e formato", () => {
  assert.equal(textoPersonalizadoValido("Nome válido-2", 5, 20), true);
  assert.equal(textoPersonalizadoValido("-Nome", 2, 20), false);
  assert.equal(textoPersonalizadoValido("A!", 1, 20), false);
  assert.equal(textoPersonalizadoValido("Nome longo", 2, 4), false);
});

test("contagem e minutos de leitura preservam divisor de 220 palavras", () => {
  assert.equal(contarPalavras("  uma\tduas\ntrês  "), 3);
  assert.equal(contarPalavras("   "), 0);
  assert.equal(calcularMinutosLeitura(""), 0);
  assert.equal(calcularMinutosLeitura("palavra"), 1);
  assert.equal(calcularMinutosLeitura(Array(220).fill("p").join(" ")), 1);
  assert.equal(calcularMinutosLeitura(Array(221).fill("p").join(" ")), 2);
});

test("nomeArquivoParaTitulo preserva extensoes, separadores e espacos", () => {
  assert.equal(nomeArquivoParaTitulo("meu-arquivo_final.md"), "meu arquivo final");
  assert.equal(nomeArquivoParaTitulo("  titulo   livre.txt  "), "titulo livre.txt");
  assert.equal(nomeArquivoParaTitulo("imagem.pdf"), "imagem.pdf");
});

test("Publicar delega os helpers puros de texto e arquivos", () => {
  assert.match(
    pagina,
    /import \{ campoValido \} from "\.\/lib\/publicar-text-utils";/,
  );

  assert.doesNotMatch(pagina, /function campoValido\(/);
  assert.equal((pagina.match(/\bcampoValido\b/g) || []).length, 2);
  for (const helper of [
    "calcularMinutosLeitura",
    "contarCaracteresValidos",
    "contarPalavras",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
    assert.match(metadadosFormulario, new RegExp(`\\b${helper}\\b`));
  }

  assert.match(
    hookConteudoArquivo,
    /import \{[\s\S]*?contarCaracteresValidos,[\s\S]*?nomeArquivoParaTitulo,[\s\S]*?\} from "\.\.\/lib\/publicar-text-utils";/,
  );
  assert.doesNotMatch(hookConteudoArquivo, /function nomeArquivoParaTitulo\(/);
  assert.equal(
    (hookConteudoArquivo.match(/\bcontarCaracteresValidos\b/g) || []).length,
    2,
  );
  assert.equal(
    (hookConteudoArquivo.match(/\bnomeArquivoParaTitulo\b/g) || []).length,
    2,
  );
  assert.match(
    hookOpcoesPublicacao,
    /import \{ limparTextoPersonalizado \} from "\.\.\/lib\/publicar-text-utils";/,
  );
  assert.doesNotMatch(hookOpcoesPublicacao, /function limparTextoPersonalizado\(/);
  assert.equal(
    (hookOpcoesPublicacao.match(/\blimparTextoPersonalizado\b/g) || []).length,
    3,
  );
  assert.match(
    hookTags,
    /import \{ limparTextoPersonalizado, textoPersonalizadoValido \} from "\.\.\/lib\/publicar-text-utils";/,
  );
  assert.doesNotMatch(hookTags, /function limparTextoPersonalizado\(/);
  assert.doesNotMatch(hookTags, /function textoPersonalizadoValido\(/);
  assert.equal((hookTags.match(/\blimparTextoPersonalizado\b/g) || []).length, 2);
  assert.equal((hookTags.match(/\btextoPersonalizadoValido\b/g) || []).length, 3);
  assert.match(
    hookValidacao,
    /import \{[\s\S]*?campoValido,[\s\S]*?contarCaracteresValidos,[\s\S]*?textoPersonalizadoValido,[\s\S]*?\} from "\.\.\/lib\/publicar-text-utils";/,
  );
  assert.doesNotMatch(hookValidacao, /function campoValido\(/);
  assert.doesNotMatch(hookValidacao, /function contarCaracteresValidos\(/);
  assert.doesNotMatch(hookValidacao, /function textoPersonalizadoValido\(/);
  assert.equal((hookValidacao.match(/\bcampoValido\b/g) || []).length, 4);
  assert.equal((hookValidacao.match(/\bcontarCaracteresValidos\b/g) || []).length, 2);
  assert.equal((hookValidacao.match(/\btextoPersonalizadoValido\b/g) || []).length, 4);

  assert.match(pagina, /usePublicarContentFileUpload/);
  assert.doesNotMatch(pagina, /from "\.\/lib\/publicar-file-utils";/);
  assert.match(hookConteudoArquivo, /from "\.\.\/lib\/publicar-file-utils";/);
  assert.doesNotMatch(pagina, /function arquivoTextoAceito\(/);
  assert.doesNotMatch(hookConteudoArquivo, /function arquivoTextoAceito\(/);
  assert.match(helpersArquivo, /export function arquivoTextoAceito\(/);
  assert.match(helpersArquivo, /arquivoTemExtensao\(arquivo\.name, \["\.txt", "\.md"\]\)/);
  assert.match(pagina, /async function salvarObra\(/);
  assert.match(pagina, /from "\.\/lib\/publicar-storage-operations";/);
  assert.match(pagina, /enviarArquivoStorage,/);
  assert.match(pagina, /desfazerPublicacaoParcialPublicar,/);
  assert.doesNotMatch(pagina, /supabase\.storage/);
  assert.match(helpersOperacoesStorage, /supabase\.storage/);
  assert.match(pagina, /from "\.\/lib\/publicar-user-storage-utils";/);
  assert.doesNotMatch(pagina, /localStorage/);
  assert.match(helpersStorageUsuario, /localStorage\.getItem\(chaveStorage\)/);
  assert.match(helpersStorageUsuario, /localStorage\.setItem\(chaveStorage, JSON\.stringify\(valor\)\)/);
  assert.match(pagina, /const isDesktop = usePublicarDesktopMode\(\);/);
  assert.doesNotMatch(utilsSource, /useState|useEffect|supabase|localStorage/);
});
