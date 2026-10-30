import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const modulo = ler(
  "../../app/ler-capitulo/lib/ler-capitulo-reader-display.ts",
);
const pagina = ler("../../app/ler-capitulo/page.tsx");
const js = (source) =>
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const executavel = js(modulo).replace(
  /import \{[\s\S]*?\} from "\.\.\/\.\.\/\.\.\/lib\/utils";/,
  'const criarSlugBase = (titulo) => `slug-${titulo}`;\nconst formatarData = (data) => `data:${data}`;',
);
const { criarVoltarHrefLeitor, criarStatusLeituraTexto } = await import(
  `data:text/javascript;base64,${Buffer.from(executavel).toString("base64")}`,
);

test("cria o retorno da obra com slug preservado ou slug base do título", () => {
  assert.equal(
    criarVoltarHrefLeitor({ slug: "slug-existente", titulo: "Ignorado" }),
    "/obra/slug-existente",
  );
  assert.equal(
    criarVoltarHrefLeitor({ slug: "", titulo: "Título original" }),
    "/obra/slug-Título original",
  );
  assert.doesNotMatch(modulo, /encodeURIComponent|obra\.slug\.trim\(/);
});

test("deriva exatamente os três estados de leitura", () => {
  assert.equal(
    criarStatusLeituraTexto({ lido: false, lidoEm: "2026-10-30" }),
    "Leitura em andamento",
  );
  assert.equal(criarStatusLeituraTexto({ lido: true, lidoEm: "" }), "Lido");
  assert.equal(
    criarStatusLeituraTexto({ lido: true, lidoEm: "2026-10-30" }),
    "Lido em data:2026-10-30",
  );
});

test("página usa as duas derivações e o módulo permanece puramente visual", () => {
  assert.match(
    pagina,
    /from "\.\/lib\/ler-capitulo-reader-display"/,
  );
  assert.match(pagina, /criarVoltarHrefLeitor\(\s*obraAtual,?\s*\)/);
  assert.match(pagina, /criarStatusLeituraTexto\(\s*capituloAtual,?\s*\)/);
  assert.doesNotMatch(pagina, /const voltarHref = `\/obra\/\$\{/);
  assert.doesNotMatch(pagina, /const statusLeituraTexto = capituloAtual\.lido/);
  assert.match(modulo, /criarSlugBase\(obra\.titulo\)/);
  assert.match(modulo, /formatarData\(\s*capitulo\.lidoEm,?\s*\)/);
  assert.doesNotMatch(
    modulo,
    /react|supabase|localStorage|use(?:Effect|State|Memo)|router|\.(?:insert|update|delete|upsert)\(|<[A-Z][\w.]*\s+[^>]*>/i,
  );
});
