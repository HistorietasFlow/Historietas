import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const acoes = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-mutation-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);

test("acoes mutaveis preservam as dependencias explicitas da pagina", () => {
  assert.match(acoes, /export function criarAcoesMutacaoNotificacoes\(/);
  for (const dependencia of [
    "notificacoes",
    "notificacoesFiltradas",
    "usuarioNotificacoesId",
    "solicitacaoRespondendoId",
    "atualizarNotificacoes",
    "fecharMenuNotificacao",
    "setSolicitacaoRespondendoId",
  ]) {
    assert.match(acoes, new RegExp(`${dependencia}:`));
  }
});

test("acoes de leitura e limpeza preservam transicoes locais e sincronizacao", () => {
  for (const acao of [
    "marcarComoLida",
    "marcarComoNaoLida",
    "marcarTodasComoLidas",
    "marcarFiltradasComoLidas",
    "apagarNotificacao",
    "limparTodas",
    "limparLidas",
  ]) {
    assert.match(acoes, new RegExp(`function ${acao}\\(`));
  }

  for (const contrato of [
    "atualizarEstadoLeituraNotificacao",
    "marcarTodasNotificacoesComoLidasLocal",
    "marcarNotificacoesFiltradasComoLidasLocal",
    "removerNotificacaoLocal",
    "separarNotificacoesLidasLocal",
    "sincronizarNotificacaoLidaSupabase",
    "sincronizarNotificacoesLidasSupabase",
    "apagarNotificacaoSupabase",
    "apagarNotificacoesSupabase",
    "excluirNotificacoesLidasSupabase",
  ]) {
    assert.match(acoes, new RegExp(`${contrato}\\(`));
  }
  assert.match(
    acoes,
    /excluirNotificacoesLidasSupabase\(usuarioNotificacoesId\)\.then\(\(excluiu\) =>/,
  );
});

test("resposta de solicitacao preserva RPC, validacao e remocao relacionada", () => {
  assert.match(
    acoes,
    /async function responderSolicitacaoSeguidorNotificacao\(/,
  );
  assert.match(acoes, /idObraSupabaseValido\(solicitacaoId\)/);
  assert.match(acoes, /"responder_solicitacao_seguidor"/);
  assert.match(acoes, /p_solicitacao_id: solicitacaoId/);
  assert.match(acoes, /p_aceitar: aceitar/);
  assert.match(acoes, /data !== "aceita" && data !== "recusada"/);
  assert.match(
    acoes,
    /encontrarNotificacoesRelacionadasSolicitacaoSeguidor\(/,
  );
  assert.match(acoes, /criarIdsNotificacoesRelacionadas\(/);
  assert.match(acoes, /registrarNotificacoesApagadas\(/);
  assert.match(acoes, /fecharMenuNotificacao\(\)/);
  assert.match(acoes, /setSolicitacaoRespondendoId\(""\)/);
});

test("pagina delega orquestracao mutavel e atualizador local", () => {
  assert.match(
    pagina,
    /import \{ criarAcoesMutacaoNotificacoes \} from "\.\/lib\/notificacoes-mutation-actions";/,
  );
  assert.match(pagina, /\} = criarAcoesMutacaoNotificacoes\(\{/);
  assert.match(
    pagina,
    /import \{ criarAtualizadorNotificacoes \} from "\.\/lib\/notificacoes-state-update-action";/,
  );
  assert.match(pagina, /const atualizarNotificacoes = criarAtualizadorNotificacoes\(/);
  assert.doesNotMatch(pagina, /function atualizarNotificacoes\(/);
  assert.doesNotMatch(pagina, /async function responderSolicitacaoSeguidorNotificacao\(/);
  assert.doesNotMatch(pagina, /function marcarTodasComoLidas\(\)/);
  assert.doesNotMatch(pagina, /function limparLidas\(\)/);
});
