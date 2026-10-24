import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/editar-obra/lib/editar-obra-update-payload.ts", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { criarPayloadAtualizacaoObra } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

const valoresBase = {
  tituloFinal: "Obra",
  autorFinal: "Autora",
  generoFinalSalvo: "Fantasia",
  formatoFinalSalvo: "HQ",
  classificacaoFinal: "Livre",
  avisosConteudoFinal: ["violencia"],
  sinopseFinal: "Sinopse",
  tagsFinais: ["aventura"],
  capaFinal: "capas/capa.png",
  capaNomeFinal: "Capa.png",
  agora: "2026-10-24T00:00:00.000Z",
};

test("cria o payload de atualização preservando todas as colunas e arquivo", () => {
  assert.deepEqual(
    criarPayloadAtualizacaoObra({
      ...valoresBase,
      arquivoObraFinal: {
        nome: "obra.pdf",
        tipo: "application/pdf",
        tamanho: 42,
        conteudo: "arquivos/obra.pdf",
        categoria: "documento",
      },
    }),
    {
      titulo: "Obra",
      autor: "Autora",
      genero: "Fantasia",
      formato: "HQ",
      classificacao_indicativa: "Livre",
      avisos_conteudo: ["violencia"],
      sinopse: "Sinopse",
      tags: ["aventura"],
      capa_url: "capas/capa.png",
      capa_nome: "Capa.png",
      arquivo_url: "arquivos/obra.pdf",
      arquivo_nome: "obra.pdf",
      arquivo_tipo: "application/pdf",
      arquivo_tamanho: 42,
      arquivo_categoria: "documento",
      atualizado_em: "2026-10-24T00:00:00.000Z",
    },
  );
});

test("preserva os fallbacks do arquivo ausente", () => {
  const payload = criarPayloadAtualizacaoObra({
    ...valoresBase,
    arquivoObraFinal: null,
  });

  assert.equal(payload.arquivo_url, "");
  assert.equal(payload.arquivo_nome, "");
  assert.equal(payload.arquivo_tipo, "");
  assert.equal(payload.arquivo_tamanho, 0);
  assert.equal(payload.arquivo_categoria, "outro");
});

test("Editar Obra delega somente a construção pura do payload de atualização", () => {
  assert.match(
    pageSource,
    /import \{ criarPayloadAtualizacaoObra \} from "\.\/lib\/editar-obra-update-payload";/,
  );
  assert.match(pageSource, /\.from\("obras"\)/);
  assert.match(
    pageSource,
    /\.update\(\s*criarPayloadAtualizacaoObra\(\{[\s\S]*?tituloFinal,[\s\S]*?arquivoObraFinal,[\s\S]*?agora,[\s\S]*?\}\),\s*\)/,
  );
  assert.match(pageSource, /\.eq\("id", obraId\)/);
  assert.match(pageSource, /\.eq\("user_id", userId\)/);
  assert.match(pageSource, /\.select\("id"\)/);
  assert.match(pageSource, /\.maybeSingle\(\)/);
  assert.match(pageSource, /erroAtualizarObra/);
  assert.match(pageSource, /obraAtualizadaSupabase\?\.id/);
  assert.match(source, /arquivoObraFinal\?\.conteudo \|\| ""/);
  assert.match(source, /arquivoObraFinal\?\.categoria \|\| "outro"/);
  assert.doesNotMatch(source, /supabase|localStorage|useState|useEffect|await|new Date/);
});
