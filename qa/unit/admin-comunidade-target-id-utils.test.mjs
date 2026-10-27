import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/admin/comunidade/lib/admin-comunidade-target-id-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);

const javascript = typescript.transpileModule(
  source.replace(
    'import type { TipoAlvoDenuncia } from "./admin-comunidade-report-label-utils";',
    "",
  ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const utils = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("agrupamento preserva os oito tipos, ordem, IDs e imutabilidade", () => {
  const denuncias = [
    { alvoTipo: "post", alvoId: " post-1 " },
    { alvoTipo: "comentario", alvoId: "comentario-1" },
    { alvoTipo: "comentario_capitulo", alvoId: "capitulo-comentario-1" },
    { alvoTipo: "obra", alvoId: "obra-1" },
    { alvoTipo: "capitulo", alvoId: "capitulo-1" },
    { alvoTipo: "comentario_obra", alvoId: "obra-comentario-1" },
    { alvoTipo: "diario_anotacao", alvoId: "anotacao-1" },
    { alvoTipo: "comentario_diario", alvoId: "diario-comentario-1" },
    { alvoTipo: "post", alvoId: " post-1 " },
    { alvoTipo: "post", alvoId: "" },
  ];
  const antes = structuredClone(denuncias);

  assert.deepEqual(utils.agruparIdsAlvosDenunciados(denuncias), {
    postIds: [" post-1 "],
    comentarioIds: ["comentario-1"],
    comentarioCapituloIds: ["capitulo-comentario-1"],
    obraIdsDenunciadas: ["obra-1"],
    capituloIdsDenunciados: ["capitulo-1"],
    comentarioObraIds: ["obra-comentario-1"],
    diarioAnotacaoIds: ["anotacao-1"],
    comentarioDiarioIds: ["diario-comentario-1"],
  });
  assert.deepEqual(denuncias, antes);
});

test("Admin Comunidade delega somente o agrupamento de IDs de alvos", () => {
  assert.doesNotMatch(page, /const idsPorTipo/);
  assert.match(page, /from ".\/lib\/admin-comunidade-target-id-utils"/);
  assert.match(page, /agruparIdsAlvosDenunciados\(denunciasMapeadas\)/);
  for (const nome of [
    "postIds",
    "comentarioIds",
    "comentarioCapituloIds",
    "obraIdsDenunciadas",
    "capituloIdsDenunciados",
    "comentarioObraIds",
    "diarioAnotacaoIds",
    "comentarioDiarioIds",
  ]) assert.match(page, new RegExp(`\\b${nome}\\b`));
  assert.doesNotMatch(source, /useState|useEffect|useMemo|supabase|router|localStorage|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/);
});
