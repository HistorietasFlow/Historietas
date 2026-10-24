import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-chapter-normalizer.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const workNormalizerSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-work-normalizer.ts",
    import.meta.url,
  ),
  "utf8",
);
const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { normalizarCapitulo } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("normaliza capítulos completos sem alterar valores textuais válidos", () => {
  assert.deepEqual(
    normalizarCapitulo(
      {
        id: " capítulo-1 ",
        titulo: " Título original ",
        texto: " conteúdo ",
        curtiu: 1,
        salvo: "sim",
        comentario: " comentário ",
        criadoEm: " 2026-10-10 ",
        lido: true,
        lidoEm: " 2026-10-11 ",
        publicado: false,
      },
      0,
    ),
    {
      id: " capítulo-1 ",
      titulo: " Título original ",
      texto: " conteúdo ",
      curtiu: true,
      salvo: true,
      comentario: " comentário ",
      criadoEm: " 2026-10-10 ",
      lido: true,
      lidoEm: " 2026-10-11 ",
      publicado: false,
    },
  );
});

test("normaliza fallbacks, coerções e publicação de capítulos", () => {
  assert.deepEqual(normalizarCapitulo({ id: " ", titulo: "\t" }, 2), {
    id: "capitulo-3",
    titulo: "Capítulo 3",
    texto: "",
    curtiu: false,
    salvo: false,
    comentario: "",
    criadoEm: "",
    lido: false,
    lidoEm: "",
    publicado: undefined,
  });
  assert.equal(normalizarCapitulo({ publicado: true }, 0).publicado, true);
  assert.equal(normalizarCapitulo({ publicado: false }, 0).publicado, false);
  assert.equal(normalizarCapitulo({ publicado: "true" }, 0).publicado, undefined);
  assert.deepEqual(normalizarCapitulo({ curtiu: 0, salvo: null, lido: "lido" }, 0), {
    id: "capitulo-1",
    titulo: "Capítulo 1",
    texto: "",
    curtiu: false,
    salvo: false,
    comentario: "",
    criadoEm: "",
    lido: true,
    lidoEm: "",
    publicado: undefined,
  });
});

test("Editar Obra delega somente a normalização de capítulos", () => {
  assert.match(
    workNormalizerSource,
    /import \{ normalizarCapitulo \} from "\.\/editar-obra-chapter-normalizer";/,
  );
  assert.doesNotMatch(pageSource, /function normalizarCapitulo\(/);
  assert.doesNotMatch(pageSource, /import \{ normalizarCapitulo \}/);
  assert.match(
    workNormalizerSource,
    /obra\.capitulos\.map\(\(capitulo, capituloIndex\) =>\s*normalizarCapitulo\(capitulo, capituloIndex\)/,
  );
  assert.match(source, /typeof capitulo\.id === "string" && capitulo\.id\.trim\(\)/);
  assert.match(source, /\? capitulo\.id/);
  assert.match(source, /`Capítulo \$\{index \+ 1\}`/);
  assert.doesNotMatch(source, /supabase|localStorage|useState|useEffect/);
});
