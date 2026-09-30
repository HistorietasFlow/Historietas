import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

function obterBloco(inicioTexto, fimTexto) {
  const inicio = paginaObra.indexOf(inicioTexto);
  const fim = paginaObra.indexOf(fimTexto, inicio);

  assert.ok(inicio >= 0);
  assert.ok(fim > inicio);

  return paginaObra.slice(inicio, fim);
}

test("troca de nota usa upsert sem apagar previamente a avaliacao existente", () => {
  const bloco = obterBloco(
    "async function salvarAvaliacaoRemotaObra(",
    "type DiarioAtividadeObraTipo",
  );
  const indiceRemocaoCondicional = bloco.indexOf("if (nota <= 0)");
  const indiceDelete = bloco.indexOf(".delete()", indiceRemocaoCondicional);
  const indiceRetornoRemocao = bloco.indexOf("return;", indiceDelete);
  const indiceUpsert = bloco.indexOf(".upsert(", indiceRetornoRemocao);

  assert.ok(indiceRemocaoCondicional >= 0);
  assert.ok(indiceDelete > indiceRemocaoCondicional);
  assert.ok(indiceRetornoRemocao > indiceDelete);
  assert.ok(indiceUpsert > indiceRetornoRemocao);
  assert.match(bloco, /onConflict: "obra_id,user_id"/);
  assert.doesNotMatch(bloco, /\.insert\(/);
});

test("falha de escrita restaura avaliacao e cache anteriores", () => {
  const bloco = obterBloco(
    "async function avaliarObra(nota: number)",
    "async function compartilharObraAtual()",
  );
  const indiceAnterior = bloco.indexOf(
    "const avaliacaoAnterior = avaliacaoObra;",
  );
  const indiceFalha = bloco.indexOf(
    'console.warn("Não consegui salvar a avaliação da obra:", error);',
  );
  const indiceGuard = bloco.indexOf(
    "avaliacaoVersaoRef.current !== versaoAvaliacao",
    indiceFalha,
  );
  const indiceRollbackCache = bloco.indexOf(
    "avaliacaoAnterior.minhaNota",
    indiceGuard,
  );
  const indiceRollbackEstado = bloco.indexOf(
    "...avaliacaoAnterior",
    indiceRollbackCache,
  );
  const indiceMensagem = bloco.indexOf(
    'setMensagemAcao("Não foi possível salvar a avaliação agora.");',
    indiceRollbackEstado,
  );

  assert.ok(indiceAnterior >= 0);
  assert.ok(indiceFalha > indiceAnterior);
  assert.ok(indiceGuard > indiceFalha);
  assert.ok(indiceRollbackCache > indiceGuard);
  assert.ok(indiceRollbackEstado > indiceRollbackCache);
  assert.ok(indiceMensagem > indiceRollbackEstado);
});

test("falha do Diario nao reverte avaliacao remota ja salva", () => {
  const bloco = obterBloco(
    "async function avaliarObra(nota: number)",
    "async function compartilharObraAtual()",
  );
  const indiceSalvarRemoto = bloco.indexOf("await salvarAvaliacaoRemotaObra({");
  const indiceMensagemFalha = bloco.indexOf(
    'setMensagemAcao("Não foi possível salvar a avaliação agora.");',
    indiceSalvarRemoto,
  );
  const indiceGuardSucesso = bloco.indexOf(
    "if (avaliacaoVersaoRef.current !== versaoAvaliacao)",
    indiceMensagemFalha,
  );
  const indiceFinalizarAvaliacao = bloco.indexOf(
    "setAvaliacaoObra((avaliacaoAtual) => ({",
    indiceGuardSucesso,
  );
  const indiceDiario = bloco.indexOf(
    "await registrarAtividadeDiarioObra({",
    indiceFinalizarAvaliacao,
  );
  const indiceAvisoDiario = bloco.indexOf(
    '"A avaliação foi salva, mas não consegui sincronizar o Diário:"',
    indiceDiario,
  );

  assert.ok(indiceSalvarRemoto >= 0);
  assert.ok(indiceMensagemFalha > indiceSalvarRemoto);
  assert.ok(indiceGuardSucesso > indiceMensagemFalha);
  assert.ok(indiceFinalizarAvaliacao > indiceGuardSucesso);
  assert.ok(indiceDiario > indiceFinalizarAvaliacao);
  assert.ok(indiceAvisoDiario > indiceDiario);
});
