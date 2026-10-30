import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-navigation-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const saveActionSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-save-action.ts",
    import.meta.url,
  ),
  "utf8",
);
const derivedStateSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-form-derived-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const javascript = typescript
  .transpileModule(
    source.replace(
      'import { criarSlugBase } from "../../../lib/utils";',
      'const criarSlugBase = (titulo) => titulo.toLowerCase().replace(/\\s+/g, "-");',
    ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  )
  .outputText;
const { criarLoginHrefEditarObra, obterHrefsObraEditarObra } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("href de login de Editar Obra preserva trim, redirect e codificação", () => {
  assert.equal(criarLoginHrefEditarObra(), "/login?redirectTo=%2Feditar-obra");
  assert.equal(criarLoginHrefEditarObra("  obra/ 1  "), "/login?redirectTo=%2Feditar-obra%3FobraId%3Dobra%252F%25201");
});

test("hrefs da obra preservam prioridade, publicação e fallbacks", () => {
  assert.deepEqual(
    obterHrefsObraEditarObra({ link: "/obra/link", slug: "slug", publicado: true }, "Título"),
    { obraPublicaHref: "/obra/link", minhaObraHref: "/obra/link" },
  );
  assert.deepEqual(
    obterHrefsObraEditarObra({ slug: "slug", publicado: true }, "Título"),
    { obraPublicaHref: "/obra/slug", minhaObraHref: "/obra/slug" },
  );
  assert.deepEqual(
    obterHrefsObraEditarObra({ publicado: true }, "  Título da obra  "),
    { obraPublicaHref: "/obra/título-da-obra", minhaObraHref: "/obra/título-da-obra" },
  );
  assert.deepEqual(obterHrefsObraEditarObra({ publicado: true }, "  "), {
    obraPublicaHref: "/painel-autor",
    minhaObraHref: "/painel-autor",
  });
  assert.deepEqual(
    obterHrefsObraEditarObra({ link: "/obra/link", publicado: false }, "Título"),
    { obraPublicaHref: "/obra/link", minhaObraHref: "/painel-autor" },
  );
});

test("Editar Obra delega somente os cálculos de navegação", () => {
  assert.match(
    saveActionSource,
    /import \{ criarLoginHrefEditarObra \} from "\.\.\/lib\/editar-obra-navigation-utils";/,
  );
  assert.doesNotMatch(saveActionSource, /function criarLoginHrefEditarObra\(/);
  assert.match(
    derivedStateSource,
    /const \{ minhaObraHref \} = obterHrefsObraEditarObra\(obraAtual, titulo\);/,
  );
  assert.match(
    derivedStateSource,
    /import \{ obterHrefsObraEditarObra \} from "\.\.\/lib\/editar-obra-navigation-utils";/,
  );
  assert.doesNotMatch(pageSource, /void obraPublicaHref;/);
  assert.doesNotMatch(pageSource, /obraAtual\?\.publicado \? obraPublicaHref/);
  assert.match(source, /const obraIdLimpo = obraId\?\.trim\(\) \|\| "";/);
  assert.match(source, /encodeURIComponent\(obraIdLimpo\)/);
  assert.match(source, /obraAtual\?\.link \|\|/);
  assert.match(source, /criarSlugBase\(titulo\.trim\(\)\)/);
  assert.match(source, /obraAtual\?\.publicado \? obraPublicaHref : "\/painel-autor"/);
  assert.doesNotMatch(source, /supabase|localStorage|useState|useEffect/);
});
