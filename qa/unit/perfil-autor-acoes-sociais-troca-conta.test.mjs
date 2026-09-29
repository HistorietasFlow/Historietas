import assert from "node:assert/strict";
import test from "node:test";
import {
  atualizarIdentidadeAutenticadaPerfilAutor,
  execucaoCarregamentoPerfilAutorEstaAtual,
} from "../../app/perfil-autor/lib/profile-auth-identity.ts";

function criarPromessaControlada() {
  let resolver;
  const promessa = new Promise((resolve) => {
    resolver = resolve;
  });

  return { promessa, resolver };
}

function criarVerificadorIdentidade(identidadeEsperada, obterIdentidadeAtual) {
  return () =>
    execucaoCarregamentoPerfilAutorEstaAtual({
      cancelada: false,
      identidadeEsperada,
      identidadeAtual: obterIdentidadeAtual(),
    });
}

test("TOP 5 obsoleto nao recarrega, nao sobrescreve B nem libera seu lock", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 1 };
  let salvando = false;
  let total = 4;
  let curtiu = false;
  let recargas = 0;
  const salvamentoControlado = criarPromessaControlada();

  async function alternarCurtidaTopFive() {
    const identidadeEsperada = identidadeAtual;
    const usuarioIdEsperado = identidadeEsperada.usuarioId;
    const operacaoAindaAtual = criarVerificadorIdentidade(
      identidadeEsperada,
      () => identidadeAtual,
    );

    assert.equal(usuarioIdEsperado, "usuario-a");
    salvando = true;
    curtiu = true;
    total += 1;

    const salvou = await salvamentoControlado.promessa;

    if (!operacaoAindaAtual()) {
      return;
    }

    if (salvou) {
      recargas += 1;
      total = 6;
      curtiu = true;
    }

    if (!operacaoAindaAtual()) {
      return;
    }

    salvando = false;
  }

  const operacaoA = alternarCurtidaTopFive();

  identidadeAtual = atualizarIdentidadeAutenticadaPerfilAutor(
    identidadeAtual,
    "usuario-b",
  ).identidade;
  salvando = false;
  total = 20;
  curtiu = false;
  salvando = true;

  salvamentoControlado.resolver(true);
  await operacaoA;

  assert.equal(recargas, 0);
  assert.equal(total, 20);
  assert.equal(curtiu, false);
  assert.equal(salvando, true);
});

test("troca de identidade depois do delete impede o insert do TOP 5", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 3 };
  const identidadeEsperada = identidadeAtual;
  const operacaoAindaAtual = criarVerificadorIdentidade(
    identidadeEsperada,
    () => identidadeAtual,
  );
  const deleteControlado = criarPromessaControlada();
  const operacoesRemotas = [];

  async function salvarCurtidaTopFive() {
    if (!operacaoAindaAtual()) {
      return false;
    }

    operacoesRemotas.push("delete");
    await deleteControlado.promessa;

    if (!operacaoAindaAtual()) {
      return false;
    }

    operacoesRemotas.push("insert");
    return true;
  }

  const salvamentoA = salvarCurtidaTopFive();
  identidadeAtual = atualizarIdentidadeAutenticadaPerfilAutor(
    identidadeAtual,
    "usuario-b",
  ).identidade;
  deleteControlado.resolver();

  assert.equal(await salvamentoA, false);
  assert.deepEqual(operacoesRemotas, ["delete"]);
});

test("avaliacao de autor de A nao grava cache de B nem faz commit final em B", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 1 };
  let avaliacaoVisivel = "avaliacao-inicial-a";
  const mutacaoControlada = criarPromessaControlada();
  const caches = [];
  const commits = [];

  async function avaliarAutor() {
    const identidadeEsperada = identidadeAtual;
    const usuarioIdEsperado = identidadeEsperada.usuarioId;
    const operacaoAindaAtual = criarVerificadorIdentidade(
      identidadeEsperada,
      () => identidadeAtual,
    );
    const userIdConfirmado = "usuario-a";

    if (!operacaoAindaAtual() || userIdConfirmado !== usuarioIdEsperado) {
      return;
    }

    avaliacaoVisivel = "otimista-a";
    caches.push(usuarioIdEsperado);
    await mutacaoControlada.promessa;

    if (!operacaoAindaAtual()) {
      return;
    }

    avaliacaoVisivel = "commit-a";
    commits.push(usuarioIdEsperado);
  }

  const avaliacaoA = avaliarAutor();
  identidadeAtual = atualizarIdentidadeAutenticadaPerfilAutor(
    identidadeAtual,
    "usuario-b",
  ).identidade;
  avaliacaoVisivel = "avaliacao-b";
  mutacaoControlada.resolver();
  await avaliacaoA;

  assert.deepEqual(caches, ["usuario-a"]);
  assert.deepEqual(commits, []);
  assert.equal(avaliacaoVisivel, "avaliacao-b");
});

test("getUser atrasado de A nao inicia avaliacao depois da troca para B", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 2 };
  const getUserControlado = criarPromessaControlada();
  const caches = [];
  const mutacoes = [];

  async function avaliarAutor() {
    const identidadeEsperada = identidadeAtual;
    const usuarioIdEsperado = identidadeEsperada.usuarioId;
    const operacaoAindaAtual = criarVerificadorIdentidade(
      identidadeEsperada,
      () => identidadeAtual,
    );
    const userIdConfirmado = await getUserControlado.promessa;

    if (
      !operacaoAindaAtual() ||
      userIdConfirmado !== usuarioIdEsperado
    ) {
      return;
    }

    caches.push(usuarioIdEsperado);
    mutacoes.push(usuarioIdEsperado);
  }

  const avaliacaoA = avaliarAutor();
  identidadeAtual = atualizarIdentidadeAutenticadaPerfilAutor(
    identidadeAtual,
    "usuario-b",
  ).identidade;
  getUserControlado.resolver("usuario-a");
  await avaliacaoA;

  assert.deepEqual(caches, []);
  assert.deepEqual(mutacoes, []);
});

test("avaliacao obsoleta do Diario nao aplica resposta nem rollback sobre B", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 5 };
  let avaliacaoVisivel = "avaliacao-anterior-a";
  let salvando = false;
  const rpcControlada = criarPromessaControlada();
  const normalizacoes = [];
  const rollbacks = [];

  async function avaliarDiario() {
    const identidadeEsperada = identidadeAtual;
    const operacaoAindaAtual = criarVerificadorIdentidade(
      identidadeEsperada,
      () => identidadeAtual,
    );
    const avaliacaoAnterior = avaliacaoVisivel;

    salvando = true;
    avaliacaoVisivel = "otimista-a";

    try {
      const resultado = await rpcControlada.promessa;

      if (!operacaoAindaAtual()) {
        return;
      }

      if (resultado instanceof Error) {
        throw resultado;
      }

      avaliacaoVisivel = "normalizada-a";
      salvando = false;
      normalizacoes.push("usuario-a");
    } catch {
      if (!operacaoAindaAtual()) {
        return;
      }

      avaliacaoVisivel = avaliacaoAnterior;
      salvando = false;
      rollbacks.push("usuario-a");
    }
  }

  const avaliacaoA = avaliarDiario();
  identidadeAtual = atualizarIdentidadeAutenticadaPerfilAutor(
    identidadeAtual,
    "usuario-b",
  ).identidade;
  avaliacaoVisivel = "avaliacao-b";
  salvando = false;
  salvando = true;
  rpcControlada.resolver(new Error("falha-a"));
  await avaliacaoA;

  assert.deepEqual(normalizacoes, []);
  assert.deepEqual(rollbacks, []);
  assert.equal(avaliacaoVisivel, "avaliacao-b");
  assert.equal(salvando, true);
});

test("evento da mesma identidade mantem a acao social valida", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 8 };
  const identidadeEsperada = identidadeAtual;
  const operacaoAindaAtual = criarVerificadorIdentidade(
    identidadeEsperada,
    () => identidadeAtual,
  );
  const operacaoControlada = criarPromessaControlada();
  const commits = [];

  const operacao = (async () => {
    await operacaoControlada.promessa;

    if (operacaoAindaAtual()) {
      commits.push("usuario-a");
    }
  })();

  const atualizacaoMesmaIdentidade = atualizarIdentidadeAutenticadaPerfilAutor(
    identidadeAtual,
    "usuario-a",
  );
  identidadeAtual = atualizacaoMesmaIdentidade.identidade;
  operacaoControlada.resolver();
  await operacao;

  assert.equal(atualizacaoMesmaIdentidade.mudou, false);
  assert.equal(identidadeAtual.versao, 8);
  assert.deepEqual(commits, ["usuario-a"]);
});
