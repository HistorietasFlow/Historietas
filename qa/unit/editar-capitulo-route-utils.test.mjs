import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const routeSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-route-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const utilsSource = readFileSync(
  new URL("../../lib/utils.ts", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
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
const { criarLoginHrefEditarCapitulo, criarHrefLeituraCapitulo } = await import(
  `data:text/javascript;base64,${Buffer.from(routeJavascript).toString("base64")}`,
);

const obraPublicada = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  slug: "obra-existente",
  titulo: "Obra Existente",
  publicado: true,
};

test("rotas de Editar Capítulo preservam redirect de login", () => {
  assert.equal(criarLoginHrefEditarCapitulo(), "/login?redirectTo=%2Feditar-capitulo");
  assert.equal(
    criarLoginHrefEditarCapitulo(" obra 1 "),
    "/login?redirectTo=%2Feditar-capitulo%3FobraId%3Dobra%2B1",
  );
  assert.equal(
    criarLoginHrefEditarCapitulo(" obra 1 ", " capítulo/2 "),
    "/login?redirectTo=%2Feditar-capitulo%3FobraId%3Dobra%2B1%26capituloId%3Dcap%25C3%25ADtulo%252F2",
  );
});

test("rotas de Editar Capítulo preservam leitura pública e fallbacks", () => {
  assert.equal(
    criarHrefLeituraCapitulo(obraPublicada, "capitulo-1", 2),
    "/obra/obra-existente/capitulo/2",
  );
  assert.equal(
    criarHrefLeituraCapitulo({ ...obraPublicada, slug: "" }, "capitulo-1", 2),
    "/obra/obra-existente/capitulo/2",
  );
  assert.equal(
    criarHrefLeituraCapitulo({ ...obraPublicada, publicado: false }, "capítulo/1", 2),
    "/ler-capitulo?obraId=123e4567-e89b-12d3-a456-426614174000&capituloId=cap%C3%ADtulo%2F1",
  );
  assert.equal(
    criarHrefLeituraCapitulo({ ...obraPublicada, id: "local" }, "capitulo", 2),
    "/ler-capitulo?obraId=local&capituloId=capitulo",
  );
  assert.equal(
    criarHrefLeituraCapitulo(
      { ...obraPublicada, id: "obra/1", publicado: false },
      "capítulo/1",
      2,
    ),
    "/ler-capitulo?obraId=obra%2F1&capituloId=cap%C3%ADtulo%2F1",
  );
  assert.equal(
    criarHrefLeituraCapitulo(obraPublicada, "capitulo", 0),
    "/ler-capitulo?obraId=123e4567-e89b-12d3-a456-426614174000&capituloId=capitulo",
  );
  assert.equal(
    criarHrefLeituraCapitulo(obraPublicada, "capitulo", 1.5),
    "/ler-capitulo?obraId=123e4567-e89b-12d3-a456-426614174000&capituloId=capitulo",
  );
  assert.equal(
    criarHrefLeituraCapitulo(obraPublicada, "capitulo", -1),
    "/ler-capitulo?obraId=123e4567-e89b-12d3-a456-426614174000&capituloId=capitulo",
  );
});

test("Editar Capítulo delega somente os helpers de rota ao módulo extraído", () => {
  assert.match(
    routeSource,
    /import \{ criarSlugBase, idObraSupabaseValido \} from "\.\.\/\.\.\/\.\.\/lib\/utils";/,
  );
  assert.match(
    pageSource,
    /import \{[\s\S]*?criarHrefLeituraCapitulo,[\s\S]*?criarLoginHrefEditarCapitulo,[\s\S]*?\} from "\.\/lib\/editar-capitulo-route-utils";/,
  );
  assert.doesNotMatch(pageSource, /function criarLoginHrefEditarCapitulo\(/);
  assert.doesNotMatch(pageSource, /function criarHrefLeituraCapitulo\(/);
  assert.match(pageSource, /router\.replace\(\s*criarLoginHrefEditarCapitulo\(obraIdParam, capituloIdParam\)/);
  assert.match(pageSource, /router\.replace\(criarLoginHrefEditarCapitulo\(obraId, capituloId\)\)/);
  assert.match(pageSource, /const hrefCapitulo = criarHrefLeituraCapitulo\(/);
  assert.match(pageSource, /\? criarHrefLeituraCapitulo\(/);
  assert.doesNotMatch(routeSource, /supabase|localStorage|useState|useEffect/);
});
