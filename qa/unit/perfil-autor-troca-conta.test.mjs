import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  atualizarIdentidadeAutenticadaPerfilAutor,
  execucaoAutenticacaoPerfilAutorEstaAtual,
  execucaoCarregamentoPerfilAutorEstaAtual,
} from "../../app/perfil-autor/lib/profile-auth-identity.ts";

function criarPromessaControlada() {
  let resolver;
  const promessa = new Promise((resolve) => {
    resolver = resolve;
  });

  return { promessa, resolver };
}

test("descarta persistencia e commit de carregamento pertencente a conta anterior", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 1 };
  const carregamentoAControlado = criarPromessaControlada();
  const carregamentoBControlado = criarPromessaControlada();
  const cachesPersistidos = [];
  const estadosAplicados = [];

  async function carregarPerfil(usuarioId, carregamentoControlado) {
    const identidadeEsperada = identidadeAtual;
    const resultado = await carregamentoControlado.promessa;
    const execucaoAtual = execucaoCarregamentoPerfilAutorEstaAtual({
      cancelada: false,
      identidadeEsperada,
      identidadeAtual,
    });

    if (!execucaoAtual) {
      return;
    }

    cachesPersistidos.push(usuarioId);

    if (
      !execucaoCarregamentoPerfilAutorEstaAtual({
        cancelada: false,
        identidadeEsperada,
        identidadeAtual,
      })
    ) {
      return;
    }

    estadosAplicados.push(resultado);
  }

  const carregamentoA = carregarPerfil("usuario-a", carregamentoAControlado);
  const atualizacaoParaB = atualizarIdentidadeAutenticadaPerfilAutor(
    identidadeAtual,
    "usuario-b",
  );
  identidadeAtual = atualizacaoParaB.identidade;
  const carregamentoB = carregarPerfil("usuario-b", carregamentoBControlado);

  carregamentoBControlado.resolver("estado-b");
  await carregamentoB;

  assert.deepEqual(cachesPersistidos, ["usuario-b"]);
  assert.deepEqual(estadosAplicados, ["estado-b"]);

  carregamentoAControlado.resolver("estado-a");
  await carregamentoA;

  assert.deepEqual(cachesPersistidos, ["usuario-b"]);
  assert.deepEqual(estadosAplicados, ["estado-b"]);
});

test("getUser atrasado nao vence evento de autenticacao mais recente", async () => {
  let identidadeAtual = { usuarioId: "", versao: 0 };
  let versaoConsultaAutenticacao = 1;
  const versaoGetUser = versaoConsultaAutenticacao;
  const getUserControlado = criarPromessaControlada();

  const aplicarGetUser = getUserControlado.promessa.then((usuarioId) => {
    if (
      !execucaoAutenticacaoPerfilAutorEstaAtual({
        cancelada: false,
        versaoEsperada: versaoGetUser,
        versaoAtual: versaoConsultaAutenticacao,
      })
    ) {
      return;
    }

    identidadeAtual = atualizarIdentidadeAutenticadaPerfilAutor(
      identidadeAtual,
      usuarioId,
    ).identidade;
  });

  versaoConsultaAutenticacao += 1;
  identidadeAtual = atualizarIdentidadeAutenticadaPerfilAutor(
    identidadeAtual,
    "usuario-b",
  ).identidade;

  getUserControlado.resolver("usuario-a");
  await aplicarGetUser;

  assert.deepEqual(identidadeAtual, {
    usuarioId: "usuario-b",
    versao: 1,
  });
});

test("evento posterior da mesma identidade preserva a versao atual", () => {
  const identidadeAtual = { usuarioId: "usuario-b", versao: 7 };
  const identidadeEsperada = identidadeAtual;
  const resultado = atualizarIdentidadeAutenticadaPerfilAutor(
    identidadeAtual,
    "usuario-b",
  );

  assert.equal(resultado.mudou, false);
  assert.equal(resultado.identidade, identidadeAtual);
  assert.equal(resultado.identidade.versao, 7);
  assert.equal(
    execucaoCarregamentoPerfilAutorEstaAtual({
      cancelada: false,
      identidadeEsperada,
      identidadeAtual: resultado.identidade,
    }),
    true,
  );
});

test("mantem a autenticacao como unica proprietaria de usuarioIdLogado", () => {
  const paginaPerfilAutor = readFileSync(
    new URL("../../app/perfil-autor/page.tsx", import.meta.url),
    "utf8",
  );
  const escritasUsuarioIdLogado = paginaPerfilAutor.match(
    /setUsuarioIdLogado\(/g,
  );

  assert.equal(escritasUsuarioIdLogado?.length, 1);
});
