import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const solicitacoes = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-follow-request-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);
const acoesMutaveis = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-mutation-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const executavel = solicitacoes
  .replace(
    'import { notificacoesRepresentamMesmoEvento } from "./notificacoes-merge-utils";',
    "const notificacoesRepresentamMesmoEvento = (atual, origem) => atual.evento === origem.evento;",
  )
  .replace(
    'import type { NotificacaoLocal } from "./notificacoes-models";\n',
    "",
  );
const javascript = typescript.transpileModule(executavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  criarIdsNotificacoesRelacionadas,
  encontrarNotificacoesRelacionadasSolicitacaoSeguidor,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

function criarNotificacao(id, overrides = {}) {
  return {
    id,
    tipo: "solicitacao-seguidor",
    solicitacaoId: "solicitacao-1",
    evento: "evento-1",
    ...overrides,
  };
}

test("encontra solicitações por ID e pelo mesmo evento", () => {
  const origem = criarNotificacao("origem");
  const porId = criarNotificacao("por-id", { solicitacaoId: " solicitacao-1 " });
  const porEvento = criarNotificacao("por-evento", {
    solicitacaoId: "outra",
  });
  const diferente = criarNotificacao("diferente", {
    solicitacaoId: "outra",
    evento: "evento-2",
  });
  const outroTipo = criarNotificacao("outro-tipo", {
    tipo: "novo-seguidor",
  });

  assert.deepEqual(
    encontrarNotificacoesRelacionadasSolicitacaoSeguidor(
      [origem, porId, porEvento, diferente, outroTipo],
      origem,
      "solicitacao-1",
    ),
    [origem, porId, porEvento],
  );
});

test("cria IDs normalizados para registrar e remover solicitações relacionadas", () => {
  assert.deepEqual(
    Array.from(
      criarIdsNotificacoesRelacionadas([
        criarNotificacao(" id-1 "),
        criarNotificacao("id-1"),
        criarNotificacao("id-2"),
      ]),
    ),
    ["id-1", "id-2"],
  );
});

test("pagina delega somente a identificação da solicitação relacionada", () => {
  assert.match(
    acoesMutaveis,
    /from "\.\/notificacoes-follow-request-utils";/,
  );
  assert.match(
    acoesMutaveis,
    /encontrarNotificacoesRelacionadasSolicitacaoSeguidor\(\s*notificacoes,\s*notificacao,\s*solicitacaoId,\s*\)/,
  );
  assert.match(acoesMutaveis, /criarIdsNotificacoesRelacionadas\(/);
  assert.match(acoesMutaveis, /supabase\.rpc\(/);
  assert.match(acoesMutaveis, /apagarNotificacoesSupabase\(/);
  assert.match(
    pagina,
    /from "\.\/lib\/notificacoes-mutation-actions";/,
  );
});

test("identificação relacionada não adiciona React, Supabase ou storage", () => {
  assert.doesNotMatch(solicitacoes, /React|use[A-Z]|supabase|localStorage|window|document/);
});
