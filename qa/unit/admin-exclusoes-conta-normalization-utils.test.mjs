import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/admin/exclusoes-conta/lib/admin-exclusoes-conta-normalization-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/admin/exclusoes-conta/page.tsx", import.meta.url),
  "utf8",
);

const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const utils = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("normalizarStatus preserva todos os status aceitos e fallback", () => {
  for (const status of [
    "pendente",
    "verificando",
    "concluida",
    "recusada",
    "cancelada",
  ]) {
    assert.equal(utils.normalizarStatus(status), status);
  }

  assert.equal(utils.normalizarStatus("desconhecido"), "pendente");
  assert.equal(utils.normalizarStatus(null), "pendente");
});

test("normalizarSolicitacao preserva IDs, campos e fallbacks", () => {
  assert.equal(utils.normalizarSolicitacao(null), null);
  assert.equal(utils.normalizarSolicitacao("solicitacao"), null);
  assert.equal(utils.normalizarSolicitacao({ email: "sem-id" }), null);

  assert.deepEqual(
    utils.normalizarSolicitacao({
      id: "  solicitacao-1  ",
      email: "pessoa@historietas.local",
      motivo: "Apagar conta",
      origem: "suporte",
      status: "recusada",
      user_agent: "Agent",
      criada_em: "2026-01-01T00:00:00.000Z",
      atualizada_em: "2026-01-02T00:00:00.000Z",
      processada_em: "2026-01-03T00:00:00.000Z",
      observacao_interna: "Verificada",
    }),
    {
      id: "solicitacao-1",
      email: "pessoa@historietas.local",
      motivo: "Apagar conta",
      origem: "suporte",
      status: "recusada",
      userAgent: "Agent",
      criadaEm: "2026-01-01T00:00:00.000Z",
      atualizadaEm: "2026-01-02T00:00:00.000Z",
      processadaEm: "2026-01-03T00:00:00.000Z",
      observacaoInterna: "Verificada",
    },
  );

  assert.deepEqual(utils.normalizarSolicitacao({ id: "id", status: "invalido" }), {
    id: "id",
    email: "",
    motivo: "",
    origem: "",
    status: "pendente",
    userAgent: "",
    criadaEm: "",
    atualizadaEm: "",
    processadaEm: "",
    observacaoInterna: "",
  });
});

test("normalizarOperacaoRecuperavel preserva status, listas e conversões", () => {
  assert.equal(utils.normalizarOperacaoRecuperavel(null), null);
  assert.equal(utils.normalizarOperacaoRecuperavel({ id: " " }), null);
  assert.equal(
    utils.normalizarOperacaoRecuperavel({ id: "operacao", status: "pendente" }),
    null,
  );

  const operacaoFalhou = utils.normalizarOperacaoRecuperavel({
    id: "  operacao-1 ",
    status: "falhou",
    buckets_pendentes: ["bucket", "", 2, " bucket "],
    buckets_concluidos: ["concluido", null, "concluido"],
    tentativas_storage: "3",
    tentativas_auth: "",
    ultimo_erro_codigo: "STORAGE",
    ultimo_erro_mensagem: "Falhou",
    ultima_falha_em: "falha-em",
    lock_expira_em: "expira-em",
    lock_ativo: 1,
    criada_em: "criada-em",
    atualizada_em: "atualizada-em",
    storage_limpo_em: "limpo-em",
    auth_excluido_em: "auth-em",
  });

  assert.deepEqual(operacaoFalhou, {
    id: "operacao-1",
    status: "falhou",
    bucketsPendentes: ["bucket", "", " bucket "],
    bucketsConcluidos: ["concluido", "concluido"],
    tentativasStorage: 3,
    tentativasAuth: 0,
    ultimoErroCodigo: "STORAGE",
    ultimoErroMensagem: "Falhou",
    ultimaFalhaEm: "falha-em",
    lockExpiraEm: "expira-em",
    lockAtivo: false,
    criadaEm: "criada-em",
    atualizadaEm: "atualizada-em",
    storageLimpoEm: "limpo-em",
    authExcluidoEm: "auth-em",
  });

  assert.equal(
    utils.normalizarOperacaoRecuperavel({
      id: "operacao-2",
      status: "excluindo_auth",
      lock_ativo: true,
    }).lockAtivo,
    true,
  );
});

test("Admin Exclusões de Conta delega somente os contratos de normalização", () => {
  assert.match(
    pageSource,
    /from "\.\/lib\/admin-exclusoes-conta-normalization-utils";/,
  );
  for (const nome of [
    "STATUS_SOLICITACOES",
    "normalizarSolicitacao",
    "normalizarOperacaoRecuperavel",
    "StatusSolicitacaoExclusao",
    "FiltroStatus",
    "SolicitacaoExclusao",
    "OperacaoRecuperavel",
  ]) {
    assert.match(pageSource, new RegExp(`\\b${nome}\\b`));
  }
  assert.doesNotMatch(pageSource, /function normalizarStatus\(/);
  assert.doesNotMatch(pageSource, /function normalizarSolicitacao\(/);
  assert.doesNotMatch(pageSource, /function normalizarOperacaoRecuperavel\(/);
  assert.doesNotMatch(
    source,
    /useState|useEffect|useMemo|useCallback|fetch\(|supabase|router|localStorage|sessionStorage|<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/i,
  );
});
