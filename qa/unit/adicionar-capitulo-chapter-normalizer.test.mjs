import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const normalizerSource = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/lib/adicionar-capitulo-chapter-normalizer.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const normalizerJavascript = typescript.transpileModule(normalizerSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { normalizarCapitulo } = await import(
  `data:text/javascript;base64,${Buffer.from(normalizerJavascript).toString("base64")}`,
);

test("normalizarCapitulo preserva strings válidas sem trim", () => {
  const normalizado = normalizarCapitulo({
    id: "  id existente  ",
    titulo: "  Título existente  ",
    texto: "  Texto sem trim  ",
    comentario: "  Comentário sem trim  ",
    criadoEm: "2024-01-01",
    lidoEm: "2024-01-02",
    publicado: true,
    ordem: 4,
  }, 2);

  assert.deepEqual(normalizado, {
    id: "  id existente  ",
    titulo: "  Título existente  ",
    texto: "  Texto sem trim  ",
    curtiu: false,
    salvo: false,
    comentario: "  Comentário sem trim  ",
    criadoEm: "2024-01-01",
    lido: false,
    lidoEm: "2024-01-02",
    publicado: true,
    ordem: 4,
  });
});

test("normalizarCapitulo aplica fallbacks e coerções atuais", () => {
  const normalizado = normalizarCapitulo({
    id: "   ",
    titulo: "   ",
    texto: null,
    curtiu: 1,
    salvo: 0,
    comentario: null,
    criadoEm: 1,
    lido: "sim",
    lidoEm: null,
    publicado: "true",
    ordem: 1.5,
  }, 3);

  assert.deepEqual(normalizado, {
    id: "capitulo-4",
    titulo: "Capítulo 4",
    texto: "",
    curtiu: true,
    salvo: false,
    comentario: "",
    criadoEm: "",
    lido: true,
    lidoEm: "",
    publicado: undefined,
    ordem: 4,
  });
  assert.equal(normalizarCapitulo({ publicado: false, ordem: 1 }, 0).publicado, false);
  assert.equal(normalizarCapitulo({ ordem: 0 }, 5).ordem, 6);
  assert.equal(normalizarCapitulo({ ordem: -1 }, 5).ordem, 6);
  assert.equal(normalizarCapitulo({}, 5).ordem, 6);
});

test("Adicionar Capítulo delega somente normalizarCapitulo ao módulo extraído", () => {
  assert.match(
    pageSource,
    /import \{ normalizarCapitulo \} from "\.\/lib\/adicionar-capitulo-chapter-normalizer";/,
  );
  assert.doesNotMatch(pageSource, /function normalizarCapitulo\(/);
  assert.match(
    pageSource,
    /obra\.capitulos\.map\(\(capitulo, capituloIndex\) =>\s*normalizarCapitulo\(capitulo, capituloIndex\)\s*\)/,
  );
  assert.match(pageSource, /function normalizarObra\(/);
  assert.match(normalizerSource, /Boolean\(capitulo\.curtiu\)/);
  assert.match(normalizerSource, /Boolean\(capitulo\.salvo\)/);
  assert.match(normalizerSource, /Boolean\(capitulo\.lido\)/);
  assert.doesNotMatch(normalizerSource, /supabase|localStorage|useState|useEffect|router|<[A-Z]/);
});
