import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/lib/sitemap-public-content-utils.ts", import.meta.url),
  "utf8",
);
const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { criarRotasConteudoPublicoSitemap } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

test("sitemap preserva obras públicas e usa a ordem real dos capítulos", () => {
  const atualizadoEm = "2026-10-31T12:00:00.000Z";
  const { rotasObras, rotasCapitulos } = criarRotasConteudoPublicoSitemap({
    siteUrl: "https://www.historietas.com.br",
    conteudo18Bloqueado: true,
    ehClassificacao18: (classificacao) => classificacao === "18+",
    obras: [
      {
        id: "obra-publica",
        slug: "obra-publica",
        atualizado_em: "2026-10-30T12:00:00.000Z",
        classificacao_indicativa: "Livre",
        publicado: true,
      },
      {
        id: "obra-privada",
        slug: "obra-privada",
        atualizado_em: atualizadoEm,
        classificacao_indicativa: "Livre",
        publicado: false,
      },
      {
        id: "obra-adulta",
        slug: "obra-adulta",
        atualizado_em: atualizadoEm,
        classificacao_indicativa: "18+",
        publicado: true,
      },
    ],
    capitulos: [
      {
        obra_id: "obra-publica",
        ordem: 7,
        atualizado_em: atualizadoEm,
        publicado: true,
      },
      {
        obra_id: "obra-publica",
        ordem: 2,
        atualizado_em: atualizadoEm,
        publicado: false,
      },
      {
        obra_id: "obra-privada",
        ordem: 1,
        atualizado_em: atualizadoEm,
        publicado: true,
      },
      {
        obra_id: "obra-adulta",
        ordem: 1,
        atualizado_em: atualizadoEm,
        publicado: true,
      },
    ],
  });

  assert.deepEqual(
    rotasObras.map(({ url }) => url),
    ["https://www.historietas.com.br/obra/obra-publica"],
  );
  assert.deepEqual(
    rotasCapitulos.map(({ url }) => url),
    ["https://www.historietas.com.br/obra/obra-publica/capitulo/7"],
  );
  assert.equal(
    rotasCapitulos[0].lastModified.toISOString(),
    atualizadoEm,
  );
});

test("sitemap rejeita slug e ordem inválidos e não duplica capítulo", () => {
  const { rotasObras, rotasCapitulos } = criarRotasConteudoPublicoSitemap({
    siteUrl: "https://www.historietas.com.br",
    conteudo18Bloqueado: false,
    ehClassificacao18: () => false,
    obras: [
      {
        id: "obra-valida",
        slug: "obra-valida",
        atualizado_em: null,
        classificacao_indicativa: null,
        publicado: true,
      },
      {
        id: "obra-invalida",
        slug: "slug/invalido",
        atualizado_em: null,
        classificacao_indicativa: null,
        publicado: true,
      },
    ],
    capitulos: [
      { obra_id: "obra-valida", ordem: 0, atualizado_em: null, publicado: true },
      { obra_id: "obra-valida", ordem: 1.5, atualizado_em: null, publicado: true },
      { obra_id: "obra-valida", ordem: 3, atualizado_em: null, publicado: true },
      { obra_id: "obra-valida", ordem: 3, atualizado_em: null, publicado: true },
      { obra_id: "obra-invalida", ordem: 1, atualizado_em: null, publicado: true },
    ],
  });

  assert.equal(rotasObras.length, 1);
  assert.deepEqual(
    rotasCapitulos.map(({ url }) => url),
    ["https://www.historietas.com.br/obra/obra-valida/capitulo/3"],
  );
});
