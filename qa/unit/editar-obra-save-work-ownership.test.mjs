import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-save-work-ownership.ts",
    import.meta.url,
  ),
  "utf8",
);
const saveActionSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-save-action.ts",
    import.meta.url,
  ),
  "utf8",
);

let respostaConsulta;
const chamadas = [];

globalThis.__editarObraSaveWorkOwnershipDependencies = {
  supabase: {
    from(tabela) {
      chamadas.push(["from", tabela]);
      const consulta = {
        select(campos) {
          chamadas.push(["select", campos]);
          return consulta;
        },
        eq(campo, valor) {
          chamadas.push(["eq", campo, valor]);
          return consulta;
        },
        limit(valor) {
          chamadas.push(["limit", valor]);
          return consulta;
        },
        maybeSingle() {
          chamadas.push(["maybeSingle"]);
          return Promise.resolve(respostaConsulta);
        },
      };

      return consulta;
    },
  },
};

const javascript = typescript
  .transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  })
  .outputText.replace(
    'import { supabase } from "../../../lib/supabase/client";',
    "const { supabase } = globalThis.__editarObraSaveWorkOwnershipDependencies;",
  );

const { confirmarPropriedadeObraParaSalvamentoEdicao } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

function criarParametros(overrides = {}) {
  const erros = [];
  const salvou = [];

  return {
    parametros: {
      obras: [{ id: "obra-1", autorId: "usuario-1" }],
      obraId: "obra-1",
      userId: "usuario-1",
      setErro(mensagem) {
        erros.push(mensagem);
      },
      setSalvou(valor) {
        salvou.push(valor);
      },
      ...overrides,
    },
    erros,
    salvou,
  };
}

test("confirma a propriedade local e remota com a mesma consulta", async () => {
  respostaConsulta = {
    data: {
      id: "obra-1",
      user_id: "usuario-1",
      capa_url: "capa.png",
      capa_nome: "Capa",
      arquivo_url: "obra.pdf",
      arquivo_nome: "Obra",
      arquivo_tipo: "application/pdf",
      arquivo_tamanho: 2,
      arquivo_categoria: "documento",
      criada_em: "2026-01-01",
    },
    error: null,
  };
  chamadas.length = 0;
  const { parametros, erros, salvou } = criarParametros();

  assert.deepEqual(
    await confirmarPropriedadeObraParaSalvamentoEdicao(parametros),
    {
      obraLocalAtual: { id: "obra-1", autorId: "usuario-1" },
      obraRemotaAtual: respostaConsulta.data,
    },
  );
  assert.deepEqual(erros, []);
  assert.deepEqual(salvou, []);
  assert.deepEqual(chamadas, [
    ["from", "obras"],
    [
      "select",
      "id,user_id,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,criada_em",
    ],
    ["eq", "id", "obra-1"],
    ["eq", "user_id", "usuario-1"],
    ["limit", 1],
    ["maybeSingle"],
  ]);
});

test("bloqueia a obra local de outro usuario antes da consulta", async () => {
  chamadas.length = 0;
  const { parametros, erros, salvou } = criarParametros({
    obras: [{ id: "obra-1", autorId: "outro-usuario" }],
  });

  assert.equal(
    await confirmarPropriedadeObraParaSalvamentoEdicao(parametros),
    null,
  );
  assert.deepEqual(chamadas, []);
  assert.deepEqual(erros, ["Você não tem permissão para editar esta obra."]);
  assert.deepEqual(salvou, [false]);
});

test("preserva erros e ausencia de obra autorizada", async () => {
  respostaConsulta = { data: null, error: { message: "sem acesso" } };
  const comErro = criarParametros();

  assert.equal(
    await confirmarPropriedadeObraParaSalvamentoEdicao(comErro.parametros),
    null,
  );
  assert.deepEqual(comErro.erros, [
    "Não consegui confirmar sua permissão para editar esta obra: sem acesso",
  ]);
  assert.deepEqual(comErro.salvou, [false]);

  respostaConsulta = { data: null, error: null };
  const semObra = criarParametros();

  assert.equal(
    await confirmarPropriedadeObraParaSalvamentoEdicao(semObra.parametros), null);
  assert.deepEqual(semObra.erros, ["Você não tem permissão para editar esta obra."]);
  assert.deepEqual(semObra.salvou, [false]);
});

test("o hook delega somente a confirmacao de propriedade", () => {
  assert.match(
    saveActionSource,
    /import \{ confirmarPropriedadeObraParaSalvamentoEdicao \} from "\.\.\/lib\/editar-obra-save-work-ownership";/,
  );
  assert.match(
    saveActionSource,
    /await confirmarPropriedadeObraParaSalvamentoEdicao\(\{[\s\S]*?obras,[\s\S]*?obraId,[\s\S]*?userId,[\s\S]*?setErro,[\s\S]*?setSalvou,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(saveActionSource, /obraLocalAtual\?\.autorId/);
  assert.doesNotMatch(saveActionSource, /\.from\("obras"\)[\s\S]*?\.limit\(1\)[\s\S]*?\.maybeSingle\(\)/);
  assert.match(saveActionSource, /const backupArquivosObras = carregarBackupArquivosObras\(userId\);/);
  assert.match(saveActionSource, /prepararAssetsAtuaisEdicaoObra\(\{/);
  assert.match(source, /\.from\("obras"\)/);
  assert.match(source, /\.eq\("id", obraId\)/);
  assert.match(source, /\.eq\("user_id", userId\)/);
  assert.match(source, /\.limit\(1\)/);
  assert.match(source, /\.maybeSingle\(\)/);
});
