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

test("Publicar delega somente os helpers puros de texto", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?calcularMinutosLeitura,[\s\S]*?campoValido,[\s\S]*?contarCaracteresValidos,[\s\S]*?contarPalavras,[\s\S]*?limparTextoPersonalizado,[\s\S]*?nomeArquivoParaTitulo,[\s\S]*?textoPersonalizadoValido,[\s\S]*?\} from "\.\/lib\/publicar-text-utils";/,
  );

  const consumidoresEsperados = {
    contarCaracteresValidos: 4,
    limparTextoPersonalizado: 4,
    textoPersonalizadoValido: 6,
    campoValido: 5,
    contarPalavras: 3,
    calcularMinutosLeitura: 2,
    nomeArquivoParaTitulo: 2,
  };

  for (const [helper, ocorrencias] of Object.entries(consumidoresEsperados)) {
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
    assert.equal((pagina.match(new RegExp(`\\b${helper}\\b`, "g")) || []).length, ocorrencias);
  }

  assert.match(pagina, /function arquivoTextoAceito\(/);
  assert.match(pagina, /async function salvarObra\(/);
  assert.match(pagina, /supabase\.storage/);
  assert.match(pagina, /localStorage/);
  assert.match(pagina, /const isDesktop = usePublicarDesktopMode\(\);/);
  assert.doesNotMatch(utilsSource, /useState|useEffect|supabase|localStorage/);
});
