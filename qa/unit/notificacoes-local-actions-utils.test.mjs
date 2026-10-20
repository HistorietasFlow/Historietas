import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const acoes = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-local-actions-utils.ts",
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
const executavel = acoes.replace(
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
  atualizarEstadoLeituraNotificacao,
  marcarNotificacoesFiltradasComoLidasLocal,
  marcarTodasNotificacoesComoLidasLocal,
  removerNotificacaoLocal,
  separarNotificacoesLidasLocal,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

function criarNotificacao(id, lida = false) {
  return { id, lida };
}

test("transicao individual preserva itens não alvo e a leitura solicitada", () => {
  const anterior = criarNotificacao("anterior", false);
  const alvo = criarNotificacao("alvo", false);
  const atualizadas = atualizarEstadoLeituraNotificacao(
    [anterior, alvo],
    "alvo",
    true,
  );

  assert.equal(atualizadas[0], anterior);
  assert.notEqual(atualizadas[1], alvo);
  assert.deepEqual(atualizadas, [
    { id: "anterior", lida: false },
    { id: "alvo", lida: true },
  ]);
  assert.deepEqual(
    atualizarEstadoLeituraNotificacao(atualizadas, "alvo", false),
    [
      { id: "anterior", lida: false },
      { id: "alvo", lida: false },
    ],
  );
});

test("marcacoes em lote preservam a lista de sincronizacao e os itens filtrados", () => {
  const notificacoes = [
    criarNotificacao("nova", false),
    criarNotificacao("lida", true),
    criarNotificacao("outra-nova", false),
  ];

  assert.deepEqual(marcarTodasNotificacoesComoLidasLocal(notificacoes), {
    notificacoesParaSincronizar: [notificacoes[0], notificacoes[2]],
    novasNotificacoes: [
      { id: "nova", lida: true },
      { id: "lida", lida: true },
      { id: "outra-nova", lida: true },
    ],
  });
  assert.deepEqual(
    marcarNotificacoesFiltradasComoLidasLocal(notificacoes, [
      notificacoes[1],
      notificacoes[2],
    ]),
    {
      notificacoesParaSincronizar: [notificacoes[2]],
      novasNotificacoes: [
        notificacoes[0],
        { id: "lida", lida: true },
        { id: "outra-nova", lida: true },
      ],
    },
  );
});

test("remoção e separação preservam as listas locais", () => {
  const notificacoes = [
    criarNotificacao("nova", false),
    criarNotificacao("lida", true),
  ];

  assert.deepEqual(removerNotificacaoLocal(notificacoes, "nova"), [
    notificacoes[1],
  ]);
  assert.deepEqual(separarNotificacoesLidasLocal(notificacoes), {
    notificacoesLidas: [notificacoes[1]],
    novasNotificacoes: [notificacoes[0]],
  });
});

test("pagina delega transições locais e preserva sincronização na orquestração", () => {
  assert.match(
    acoesMutaveis,
    /from "\.\/notificacoes-local-actions-utils";/,
  );
  for (const helper of [
    "atualizarEstadoLeituraNotificacao",
    "marcarTodasNotificacoesComoLidasLocal",
    "marcarNotificacoesFiltradasComoLidasLocal",
    "removerNotificacaoLocal",
    "separarNotificacoesLidasLocal",
  ]) {
    assert.match(acoesMutaveis, new RegExp(`${helper}\\(`));
  }
  assert.match(acoesMutaveis, /sincronizarNotificacaoLidaSupabase\(/);
  assert.match(acoesMutaveis, /sincronizarNotificacoesLidasSupabase\(/);
  assert.match(acoesMutaveis, /apagarNotificacaoSupabase\(/);
  assert.match(
    pagina,
    /from "\.\/lib\/notificacoes-mutation-actions";/,
  );
});

test("transições locais não adicionam React, Supabase ou storage", () => {
  assert.doesNotMatch(acoes, /React|use[A-Z]|supabase|localStorage|window|document/);
});
