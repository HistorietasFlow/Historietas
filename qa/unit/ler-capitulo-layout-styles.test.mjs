import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const conteudo = ler("../../app/ler-capitulo/components/ler-capitulo-reader-content.tsx");
const fonte = ler("../../app/ler-capitulo/lib/ler-capitulo-layout-styles.ts");
const textoLeitura = ler("../../app/ler-capitulo/lib/ler-capitulo-reading-text-utils.ts");
const texto = ler("../../app/ler-capitulo/lib/ler-capitulo-text-style.ts");
const compilar = (source) => typescript.transpileModule(source, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const url = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const fonteExecutavel = fonte.replace(
  'from "./ler-capitulo-text-style";',
  `from "${url(compilar(texto))}";`,
);
const estilos = await import(url(compilar(fonteExecutavel)));

test("estilos e função de título preservam literalmente o bloco original", () => {
  const bloco = fonte.slice(fonte.indexOf("const pageStyle: CSSProperties = {"))
    .trimEnd()
    .replace(/^export const /gm, "const ")
    .replace(/^export function criarEstiloTituloCapitulo/m, "function criarEstiloTituloCapitulo");
  assert.equal((bloco.match(/^const \w+: CSSProperties = \{/gm) || []).length, 77);
  assert.equal(
    createHash("sha256").update(bloco).digest("hex"),
    "fb9a3bc3fec3884d9de809b3f04c23e655b46ba42fa98bb1fbd4869e0ecad874",
  );
  assert.match(fonte, /\.\.\.safeTextStyle,/);
  assert.match(fonte, /\.\.\.chapterTextStyle,/);
  assert.match(fonte, /\.\.\.desktopChapterNavigationStyle,/);
});

test("helper preserva tamanhos e line-height de títulos mobile e desktop", () => {
  for (const [titulo, desktop, tamanho, altura] of [
    ["123456789012345", false, "clamp(26px, 7.4vw, 38px)", 0.96],
    [" 123456789012345 ", true, "clamp(34px, 4vw, 52px)", 1.04],
    ["1234567890123456", false, "clamp(23px, 6.4vw, 33px)", 1.02],
    ["12345678901234567890123456789012345", true, "clamp(30px, 3.4vw, 44px)", 1.06],
    ["123456789012345678901234567890123456", false, "clamp(20px, 5.5vw, 28px)", 1.06],
    ["123456789012345678901234567890123456", true, "clamp(26px, 3vw, 38px)", 1.08],
  ]) {
    const style = estilos.criarEstiloTituloCapitulo(titulo, desktop);
    assert.equal(style.fontSize, tamanho);
    assert.equal(style.lineHeight, altura);
    assert.equal(style.textAlign, "center");
  }
});

test("página e conteúdo consomem os estilos sem duplicá-los", () => {
  const nomes = [...fonte.matchAll(/^export const (\w+): CSSProperties = \{/gm)].map((m) => m[1]);
  assert.equal(nomes.length, 56);
  const importacao = pagina.match(/import \{([^}]*)\} from "\.\/lib\/ler-capitulo-layout-styles";/);
  const importacaoConteudo = conteudo.match(/import \{([^}]*)\} from "\.\.\/lib\/ler-capitulo-layout-styles";/);
  assert.ok(importacao);
  assert.ok(importacaoConteudo);
  for (const nome of nomes) {
    const consumidor = ["chapterTextStyle", "desktopChapterTextStyle"].includes(nome)
      ? textoLeitura
      : importacao[1] + importacaoConteudo[1];
    assert.match(consumidor, new RegExp(`\\b${nome}\\b`));
    assert.doesNotMatch(pagina, new RegExp(`const ${nome}: CSSProperties`));
    assert.doesNotMatch(conteudo, new RegExp(`const ${nome}: CSSProperties`));
  }
  assert.match(importacaoConteudo[1], /\bcriarEstiloTituloCapitulo\b/);
  assert.doesNotMatch(pagina, /function criarEstiloTituloCapitulo\(/);
  assert.match(
    pagina,
    /import \{[\s\S]*?criarTextoLeituraStyle,[\s\S]*?criarTextoLeituraDesktopStyle,[\s\S]*?\} from "\.\/lib\/ler-capitulo-reading-text-utils";/,
  );
  assert.doesNotMatch(pagina, /function criarTextoLeituraStyle\(/);
  assert.match(textoLeitura, /export function criarTextoLeituraStyle\(/);
  assert.match(pagina, /<ComentariosCapituloSheet/);
  assert.match(pagina, /export default function LerCapituloPage\(/);
  assert.match(conteudo, /style=\{criarEstiloTituloCapitulo\(/);
});

test("módulo é somente visual, sem hooks ou persistência", () => {
  assert.match(fonte, /import type \{ CSSProperties \} from "react";/);
  assert.match(fonte, /import \{ safeTextStyle \} from "\.\/ler-capitulo-text-style";/);
  assert.doesNotMatch(fonte, /\b(?:supabase|localStorage|window|document|useEffect|useState)\b/i);
});
