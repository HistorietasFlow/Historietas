import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const normalizerSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-chapter-normalizer.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
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

test("normalizarCapitulo preserva IDs e títulos padrão com numeração", () => {
  assert.deepEqual(normalizarCapitulo({}, 2, 4), {
    id: "capitulo-5-3",
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

  assert.equal(
    normalizarCapitulo({ id: "  ", titulo: "\t" }, 0, 0).titulo,
    "Capítulo 1",
  );
});

test("normalizarCapitulo preserva valores textuais sem trim e booleanos", () => {
  const capitulo = normalizarCapitulo(
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
    0,
  );

  assert.deepEqual(capitulo, {
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
  });
});

test("normalizarCapitulo usa undefined quando publicado não é booleano", () => {
  assert.equal(normalizarCapitulo({ publicado: "true" }, 0, 0).publicado, undefined);
  assert.equal(normalizarCapitulo({ publicado: true }, 0, 0).publicado, true);
});

test("Painel do Autor delega somente normalizarCapitulo ao módulo extraído", () => {
  assert.match(
    pagina,
    /import \{ normalizarCapitulo \} from "\.\/lib\/painel-autor-chapter-normalizer";/,
  );
  assert.doesNotMatch(pagina, /function normalizarCapitulo\(/);
  assert.equal((pagina.match(/\bnormalizarCapitulo\b/g) || []).length, 2);
  assert.match(
    normalizerSource,
    /`capitulo-\$\{obraIndex \+ 1\}-\$\{capituloIndex \+ 1\}`/,
  );
  assert.match(normalizerSource, /`Capítulo \$\{capituloIndex \+ 1\}`/);
  assert.match(normalizerSource, /typeof capitulo\.publicado === "boolean"/);
  assert.match(normalizerSource, /: undefined/);
  assert.doesNotMatch(normalizerSource, /supabase|localStorage|useState|useEffect/);
});
