import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

function transpilarModuloTypescript(caminho) {
  const texto = readFileSync(new URL(caminho, import.meta.url), "utf8");

  return typescript.transpileModule(texto, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
}

function criarUrlModulo(codigo) {
  return `data:text/javascript;base64,${Buffer.from(codigo).toString("base64")}`;
}

const supabaseJavascript = [
  "export const supabase = {",
  "  from(tabela) {",
  "    globalThis.consultasObra.push([\"from\", tabela]);",
  "    return {",
  "      select(colunas) { globalThis.consultasObra.push([\"select\", colunas]); return this; },",
  "      eq(coluna, valor) { globalThis.consultasObra.push([\"eq\", coluna, valor]); return this; },",
  "      limit(limite) {",
  "        globalThis.consultasObra.push([\"limit\", limite]);",
  "        if (globalThis.erroConsultaObra) throw globalThis.erroConsultaObra;",
  "        return globalThis.respostaConsultaObra;",
  "      },",
  "    };",
  "  },",
  "};",
].join("\n");
const supabaseUrl = criarUrlModulo(supabaseJavascript);
const workJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-supabase-work-utils.ts",
).replace('from "../../../../lib/supabase/client";', `from "${supabaseUrl}";`);
const { consultarObraPublicaPorSlug } = await import(
  criarUrlModulo(workJavascript),
);

function prepararConsulta({ resposta, erro = null }) {
  globalThis.consultasObra = [];
  globalThis.respostaConsultaObra = resposta;
  globalThis.erroConsultaObra = erro;
}

test("consulta obra pública por slug com tabela, colunas, filtros e limite preservados", async () => {
  const resposta = {
    data: [{ id: "obra-1", titulo: "Obra pública" }],
    error: null,
  };
  prepararConsulta({ resposta });

  const resultado = await consultarObraPublicaPorSlug("obra-publica");

  assert.equal(resultado, resposta);
  assert.deepEqual(globalThis.consultasObra, [
    ["from", "obras"],
    [
      "select",
      "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,visualizacoes,publicado,slug,link,criada_em,atualizado_em",
    ],
    ["eq", "slug", "obra-publica"],
    ["eq", "publicado", true],
    ["limit", 1],
  ]);
});

test("preserva o erro bruto retornado pelo cliente", async () => {
  const erro = { message: "obra indisponível", code: "PGRST000" };
  const resposta = { data: null, error: erro };
  prepararConsulta({ resposta });

  const resultado = await consultarObraPublicaPorSlug("obra-publica");

  assert.equal(resultado, resposta);
  assert.equal(resultado.error, erro);
});

test("propaga exceções do cliente sem transformá-las", async () => {
  const erro = new Error("falha de rede");
  prepararConsulta({ resposta: null, erro });

  await assert.rejects(
    consultarObraPublicaPorSlug("obra-publica"),
    (erroRecebido) => erroRecebido === erro,
  );
});
