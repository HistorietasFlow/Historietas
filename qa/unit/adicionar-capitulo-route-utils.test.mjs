import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const routeSource = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/lib/adicionar-capitulo-route-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const utilsSource = readFileSync(
  new URL("../../lib/utils.ts", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const transpilar = (source) =>
  typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
const utilsDataUrl = `data:text/javascript;base64,${Buffer.from(
  transpilar(utilsSource),
).toString("base64")}`;
const routeJavascript = transpilar(
  routeSource.replace("../../../lib/utils", utilsDataUrl),
);
const { criarLoginHrefAdicionarCapitulo, criarHrefLeituraCapitulo } = await import(
  `data:text/javascript;base64,${Buffer.from(routeJavascript).toString("base64")}`,
);

const obraPublicada = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  slug: "obra-existente",
  titulo: "Obra Existente",
  publicado: true,
};

test("rotas de Adicionar Capítulo preservam redirect de login", () => {
  assert.equal(
    criarLoginHrefAdicionarCapitulo(),
    "/login?redirectTo=%2Fadicionar-capitulo",
  );
  assert.equal(
    criarLoginHrefAdicionarCapitulo(" obra 1 "),
    "/login?redirectTo=%2Fadicionar-capitulo%3FobraId%3Dobra%25201",
  );
  assert.equal(
    new URLSearchParams(
      criarLoginHrefAdicionarCapitulo(" obra/1 ").split("?")[1],
    ).get("redirectTo"),
    "/adicionar-capitulo?obraId=obra%2F1",
  );
});

test("rotas de Adicionar Capítulo preservam leitura pública e fallbacks", () => {
  assert.equal(
    criarHrefLeituraCapitulo(obraPublicada, { id: "capitulo-1" }, 2),
    "/obra/obra-existente/capitulo/2",
  );
  assert.equal(
    criarHrefLeituraCapitulo(
      { ...obraPublicada, slug: "  Minha Obra  " },
      { id: "capitulo-1" },
      2,
    ),
    "/obra/Minha%20Obra/capitulo/2",
  );
  assert.equal(
    criarHrefLeituraCapitulo(
      { ...obraPublicada, slug: "", titulo: "Minha Obra" },
      { id: "capitulo-1" },
      2,
    ),
    "/obra/minha-obra/capitulo/2",
  );
  assert.equal(
    criarHrefLeituraCapitulo(
      { ...obraPublicada, publicado: false, id: "obra/1" },
      { id: "capítulo/1" },
      2,
    ),
    "/ler-capitulo?obraId=obra%2F1&capituloId=cap%C3%ADtulo%2F1",
  );
  assert.equal(
    criarHrefLeituraCapitulo(
      { ...obraPublicada, id: "local" },
      { id: "capitulo" },
      2,
    ),
    "/ler-capitulo?obraId=local&capituloId=capitulo",
  );

  for (const numeroCapitulo of [0, -1, 1.5]) {
    assert.equal(
      criarHrefLeituraCapitulo(obraPublicada, { id: "capitulo" }, numeroCapitulo),
      "/ler-capitulo?obraId=123e4567-e89b-12d3-a456-426614174000&capituloId=capitulo",
    );
  }
});

test("Adicionar Capítulo delega somente os helpers de rota ao módulo extraído", () => {
  assert.match(
    routeSource,
    /import \{ criarSlugBase, idObraSupabaseValido \} from "\.\.\/\.\.\/\.\.\/lib\/utils";/,
  );
  assert.match(
    pageSource,
    /import \{[\s\S]*?criarHrefLeituraCapitulo,[\s\S]*?criarLoginHrefAdicionarCapitulo,[\s\S]*?\} from "\.\/lib\/adicionar-capitulo-route-utils";/,
  );
  assert.doesNotMatch(pageSource, /function criarLoginHrefAdicionarCapitulo\(/);
  assert.doesNotMatch(pageSource, /function criarHrefLeituraCapitulo\(/);
  assert.equal(
    (pageSource.match(/criarLoginHrefAdicionarCapitulo\(/g) || []).length,
    3,
  );
  assert.equal(
    (pageSource.match(/criarHrefLeituraCapitulo\(/g) || []).length,
    4,
  );
  assert.match(
    pageSource,
    /import \{ criarSlugBase, idObraSupabaseValido, normalizarTexto \} from "\.\.\/\.\.\/lib\/utils";/,
  );
  assert.match(routeSource, /const params = new URLSearchParams\(\{/);
  assert.match(routeSource, /Number\.isInteger\(numeroCapitulo\)/);
  assert.doesNotMatch(routeSource, /supabase|localStorage|useState|useEffect|router|<[A-Z]/);
});
