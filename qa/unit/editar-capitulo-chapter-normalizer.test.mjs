import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const normalizerSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-chapter-normalizer.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const saveActionSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/hooks/useEditarCapituloSaveAction.ts",
    import.meta.url,
  ),
  "utf8",
);
const workNormalizerSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-work-normalizer.ts",
    import.meta.url,
  ),
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

test("normalizarCapitulo preserva valores válidos sem trim e aplica fallbacks", () => {
  assert.deepEqual(
    normalizarCapitulo(
      {
        id: " capítulo-1 ",
        titulo: " Título original ",
        texto: " texto ",
        curtiu: 1,
        salvo: "sim",
        comentario: " comentário ",
        criadoEm: " 2026-10-25 ",
        lido: true,
        lidoEm: " 2026-10-26 ",
        publicado: false,
        ordem: 3,
      },
      1,
    ),
    {
      id: " capítulo-1 ",
      titulo: " Título original ",
      texto: " texto ",
      curtiu: true,
      salvo: true,
      comentario: " comentário ",
      criadoEm: " 2026-10-25 ",
      lido: true,
      lidoEm: " 2026-10-26 ",
      publicado: false,
      ordem: 3,
    },
  );

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
    ordem: 3,
  });
});

test("normalizarCapitulo preserva coerções e validação estrita de ordem", () => {
  const invalido = normalizarCapitulo(
    {
      texto: 1,
      curtiu: 0,
      salvo: null,
      comentario: 2,
      criadoEm: false,
      lido: "sim",
      lidoEm: 3,
      publicado: "true",
      ordem: 0,
    },
    4,
  );

  assert.deepEqual(invalido, {
    id: "capitulo-5",
    titulo: "Capítulo 5",
    texto: "",
    curtiu: false,
    salvo: false,
    comentario: "",
    criadoEm: "",
    lido: true,
    lidoEm: "",
    publicado: undefined,
    ordem: 5,
  });

  assert.equal(normalizarCapitulo({ publicado: true, ordem: 1 }, 0).publicado, true);
  assert.equal(normalizarCapitulo({ publicado: false, ordem: -1 }, 1).publicado, false);

  for (const ordem of [-1, 1.5, "2", undefined]) {
    assert.equal(normalizarCapitulo({ ordem }, 3).ordem, 4);
  }
});

test("Editar Capítulo delega somente normalizarCapitulo ao módulo extraído", () => {
  assert.match(
    saveActionSource,
    /import \{ normalizarObra \} from "\.\.\/lib\/editar-capitulo-work-normalizer";/,
  );
  assert.doesNotMatch(pageSource, /function normalizarCapitulo\(/);
  assert.doesNotMatch(
    pageSource,
    /import \{ normalizarCapitulo \} from "\.\/lib\/editar-capitulo-chapter-normalizer";/,
  );
  assert.match(
    workNormalizerSource,
    /obra\.capitulos\.map\(\(capitulo, capituloIndex\) =>\s*normalizarCapitulo\(capitulo, capituloIndex\)\s*\)/,
  );
  assert.match(
    workNormalizerSource,
    /import \{ normalizarCapitulo \} from "\.\/editar-capitulo-chapter-normalizer";/,
  );
  assert.match(normalizerSource, /typeof capitulo\.publicado === "boolean"/);
  assert.match(normalizerSource, /Number\.isInteger\(capitulo\.ordem\)/);
  assert.match(normalizerSource, /capitulo\.ordem > 0/);
  assert.doesNotMatch(normalizerSource, /supabase|localStorage|useState|useEffect|window|document/);
});
