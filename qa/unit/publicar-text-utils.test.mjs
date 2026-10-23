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
    /import \{[\s\S]*?calcularMinutosLeitura,[\s\S]*?campoValido,[\s\S]*?contarCaracteresValidos,[\s\S]*?contarPalavras,[\s\S]*?limparTextoPersonalizado,[\s\S]*?textoPersonalizadoValido,[\s\S]*?\} from "\.\/lib\/publicar-text-utils";/,
  );

  const consumidoresEsperados = {
    contarCaracteresValidos: 3,
    limparTextoPersonalizado: 2,
    textoPersonalizadoValido: 6,
    campoValido: 5,
    contarPalavras: 3,
    calcularMinutosLeitura: 2,
  };

  for (const [helper, ocorrencias] of Object.entries(consumidoresEsperados)) {
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
    assert.equal((pagina.match(new RegExp(`\\b${helper}\\b`, "g")) || []).length, ocorrencias);
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
