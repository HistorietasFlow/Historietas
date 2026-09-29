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

function criarExecutorDeduplicado() {
  const operacoes = new Map();

  return function executar(perfilAlvo, acao, contextoIdentidade) {
    const usuarioIdEsperado =
      contextoIdentidade?.usuarioIdEsperado.trim() || "";
    const chave = usuarioIdEsperado
      ? `${usuarioIdEsperado}:${perfilAlvo.trim()}`
      : perfilAlvo.trim();
    const operacaoExistente = operacoes.get(chave);

    if (operacaoExistente) {
      return operacaoExistente;
    }

    const novaOperacao = acao().finally(() => {
      if (operacoes.get(chave) === novaOperacao) {
        operacoes.delete(chave);
      }
    });

    operacoes.set(chave, novaOperacao);
    return novaOperacao;
  };
}

test("bloqueio obsoleto nao altera estado social nem libera lock de B", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 1 };
  let bloqueioSalvando = false;
  let bloqueio = "desbloqueado-a";
  let relacionamento = "seguindo-a";
  let permissoes = "permissoes-a";
  let mensagem = "";
  const bloqueioControlado = criarPromessaControlada();

  async function alternarBloqueio() {
    const identidadeEsperada = identidadeAtual;
    const operacaoAindaAtual = criarVerificadorIdentidade(
      identidadeEsperada,
      () => identidadeAtual,
    );

    bloqueioSalvando = true;
    const resultado = await bloqueioControlado.promessa;

    if (!operacaoAindaAtual()) {
      return;
    }

    bloqueioSalvando = false;
    bloqueio = resultado;
    relacionamento = "nenhum";
    permissoes = "bloqueadas";
    mensagem = "bloqueado";
  }

  const operacaoA = alternarBloqueio();

  identidadeAtual = atualizarIdentidadeAutenticadaPerfilAutor(
    identidadeAtual,
    "usuario-b",
  ).identidade;
  bloqueioSalvando = false;
  bloqueio = "bloqueio-b";
  relacionamento = "relacionamento-b";
  permissoes = "permissoes-b";
  mensagem = "mensagem-b";
  bloqueioSalvando = true;

  bloqueioControlado.resolver("bloqueado-a");
  await operacaoA;

  assert.equal(bloqueio, "bloqueio-b");
  assert.equal(relacionamento, "relacionamento-b");
  assert.equal(permissoes, "permissoes-b");
  assert.equal(mensagem, "mensagem-b");
  assert.equal(bloqueioSalvando, true);
});

test("seguimento obsoleto nao inicia notificacoes nem libera lock de B", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 3 };
  let seguirSalvando = false;
  let relacionamento = "nenhum-a";
  let seguidores = 4;
  let mensagem = "";
  const relacionamentoControlado = criarPromessaControlada();
  const notificacoes = [];

  async function seguir() {
    const identidadeEsperada = identidadeAtual;
    const operacaoAindaAtual = criarVerificadorIdentidade(
      identidadeEsperada,
      () => identidadeAtual,
    );

    seguirSalvando = true;
    const novoEstado = await relacionamentoControlado.promessa;

    if (!operacaoAindaAtual()) {
      return;
    }

    relacionamento = novoEstado;
    seguidores += 1;
    notificacoes.push("remover-antiga", "criar-nova");
    mensagem = "seguindo";

    if (operacaoAindaAtual()) {
      seguirSalvando = false;
    }
  }

  const operacaoA = seguir();

  identidadeAtual = atualizarIdentidadeAutenticadaPerfilAutor(
    identidadeAtual,
    "usuario-b",
  ).identidade;
  seguirSalvando = false;
  relacionamento = "relacionamento-b";
  seguidores = 20;
  mensagem = "mensagem-b";
  seguirSalvando = true;

  relacionamentoControlado.resolver("seguindo");
  await operacaoA;

  assert.deepEqual(notificacoes, []);
  assert.equal(relacionamento, "relacionamento-b");
  assert.equal(seguidores, 20);
  assert.equal(mensagem, "mensagem-b");
  assert.equal(seguirSalvando, true);
});

test("troca durante notificacao impede a proxima etapa e o evento global", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 5 };
  const remocaoControlada = criarPromessaControlada();
  const etapas = [];

  async function notificarSeguimento() {
    const identidadeEsperada = identidadeAtual;
    const operacaoAindaAtual = criarVerificadorIdentidade(
      identidadeEsperada,
      () => identidadeAtual,
    );

    if (!operacaoAindaAtual()) {
      return;
    }

    etapas.push("remover-notificacao");
    await remocaoControlada.promessa;

    if (!operacaoAindaAtual()) {
      return;
    }

    etapas.push("evento-remocao", "criar-notificacao", "evento-criacao");
  }

  const notificacaoA = notificarSeguimento();
  identidadeAtual = atualizarIdentidadeAutenticadaPerfilAutor(
    identidadeAtual,
    "usuario-b",
  ).identidade;
  remocaoControlada.resolver();
  await notificacaoA;

  assert.deepEqual(etapas, ["remover-notificacao"]);
});

test("operacao pendente de A nao e reutilizada por B no mesmo perfil", async () => {
  const executar = criarExecutorDeduplicado();
  const operacaoAControlada = criarPromessaControlada();
  const operacaoBControlada = criarPromessaControlada();
  const execucoes = [];
  const contextoA = {
    usuarioIdEsperado: "usuario-a",
    operacaoAindaAtual: () => true,
  };
  const contextoB = {
    usuarioIdEsperado: "usuario-b",
    operacaoAindaAtual: () => true,
  };

  const operacaoA = executar("perfil-alvo", async () => {
    execucoes.push("a");
    return operacaoAControlada.promessa;
  }, contextoA);
  const operacaoADuplicada = executar("perfil-alvo", async () => {
    execucoes.push("a-duplicada");
  }, contextoA);
  const operacaoB = executar("perfil-alvo", async () => {
    execucoes.push("b");
    return operacaoBControlada.promessa;
  }, contextoB);

  assert.equal(operacaoADuplicada, operacaoA);
  assert.notEqual(operacaoB, operacaoA);
  assert.deepEqual(execucoes, ["a", "b"]);

  operacaoAControlada.resolver("resultado-a");
  operacaoBControlada.resolver("resultado-b");
  await Promise.all([operacaoA, operacaoB]);
});

test("getUser diferente da identidade esperada impede RPC e evento", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 7 };
  const identidadeEsperada = identidadeAtual;
  const operacaoAindaAtual = criarVerificadorIdentidade(
    identidadeEsperada,
    () => identidadeAtual,
  );
  const etapas = [];

  async function mutacaoComIdentidadeConfirmada() {
    etapas.push("get-user");
    const usuarioIdConfirmado = await Promise.resolve("usuario-b");

    if (
      !operacaoAindaAtual() ||
      usuarioIdConfirmado !== identidadeEsperada.usuarioId
    ) {
      return;
    }

    etapas.push("rpc", "evento-global");
  }

  await mutacaoComIdentidadeConfirmada();
  assert.deepEqual(etapas, ["get-user"]);
});

test("evento da mesma identidade mantem relacionamento e notificacao validos", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 9 };
  const identidadeEsperada = identidadeAtual;
  const operacaoAindaAtual = criarVerificadorIdentidade(
    identidadeEsperada,
    () => identidadeAtual,
  );
  const mutacaoControlada = criarPromessaControlada();
  const etapas = [];

  const operacao = (async () => {
    etapas.push("mutacao");
    await mutacaoControlada.promessa;

    if (!operacaoAindaAtual()) {
      return;
    }

    etapas.push("notificacao", "estado", "mensagem", "liberar-lock");
  })();

  const mesmaIdentidade = atualizarIdentidadeAutenticadaPerfilAutor(
    identidadeAtual,
    "usuario-a",
  );
  identidadeAtual = mesmaIdentidade.identidade;
  mutacaoControlada.resolver();
  await operacao;

  assert.equal(mesmaIdentidade.mudou, false);
  assert.equal(identidadeAtual.versao, 9);
  assert.deepEqual(etapas, [
    "mutacao",
    "notificacao",
    "estado",
    "mensagem",
    "liberar-lock",
  ]);
});

test("consumidor legado sem contexto preserva deduplicacao por perfil", async () => {
  const executar = criarExecutorDeduplicado();
  const operacaoControlada = criarPromessaControlada();
  const execucoes = [];

  const primeira = executar("perfil-alvo", async () => {
    execucoes.push("legado");
    return operacaoControlada.promessa;
  });
  const segunda = executar("perfil-alvo", async () => {
    execucoes.push("legado-duplicado");
  });

  assert.equal(segunda, primeira);
  assert.deepEqual(execucoes, ["legado"]);

  operacaoControlada.resolver("ok");
  assert.equal(await primeira, "ok");
});
