import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  atualizarIdentidadeAutenticadaObra,
  execucaoAutenticacaoObraEstaAtual,
  execucaoIdentidadeObraEstaAtual,
} from "../../app/obra/[slug]/lib/obra-auth-identity.ts";

function criarPromessaControlada() {
  let resolver;
  const promessa = new Promise((resolve) => {
    resolver = resolve;
  });

  return { promessa, resolver };
}

test("descarta cache e commit de carregamento da obra pertencente a conta anterior", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 1 };
  const carregamentoAControlado = criarPromessaControlada();
  const carregamentoBControlado = criarPromessaControlada();
  const cachesPersistidos = [];
  const estadosAplicados = [];

  async function carregarObra(usuarioId, carregamentoControlado) {
    const identidadeEsperada = identidadeAtual;
    const resultado = await carregamentoControlado.promessa;

    if (
      !execucaoIdentidadeObraEstaAtual({
        cancelada: false,
        identidadeEsperada,
        identidadeAtual,
      })
    ) {
      return;
    }

    cachesPersistidos.push(usuarioId);

    if (
      !execucaoIdentidadeObraEstaAtual({
        cancelada: false,
        identidadeEsperada,
        identidadeAtual,
      })
    ) {
      return;
    }

    estadosAplicados.push(resultado);
  }

  const carregamentoA = carregarObra("usuario-a", carregamentoAControlado);

  identidadeAtual = atualizarIdentidadeAutenticadaObra(
    identidadeAtual,
    "usuario-b",
  ).identidade;

  const carregamentoB = carregarObra("usuario-b", carregamentoBControlado);

  carregamentoBControlado.resolver("estado-b");
  await carregamentoB;

  assert.deepEqual(cachesPersistidos, ["usuario-b"]);
  assert.deepEqual(estadosAplicados, ["estado-b"]);

  carregamentoAControlado.resolver("estado-a");
  await carregamentoA;

  assert.deepEqual(cachesPersistidos, ["usuario-b"]);
  assert.deepEqual(estadosAplicados, ["estado-b"]);
});

test("getUser atrasado nao vence evento de autenticacao mais recente na obra", async () => {
  let identidadeAtual = { usuarioId: "", versao: 0 };
  let versaoConsultaAutenticacao = 1;
  const versaoGetUser = versaoConsultaAutenticacao;
  const getUserControlado = criarPromessaControlada();

  const aplicarGetUser = getUserControlado.promessa.then((usuarioId) => {
    if (
      !execucaoAutenticacaoObraEstaAtual({
        cancelada: false,
        versaoEsperada: versaoGetUser,
        versaoAtual: versaoConsultaAutenticacao,
      })
    ) {
      return;
    }

    identidadeAtual = atualizarIdentidadeAutenticadaObra(
      identidadeAtual,
      usuarioId,
    ).identidade;
  });

  versaoConsultaAutenticacao += 1;
  identidadeAtual = atualizarIdentidadeAutenticadaObra(
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

test("evento posterior da mesma identidade preserva a execucao da obra", () => {
  const identidadeAtual = { usuarioId: "usuario-b", versao: 7 };
  const identidadeEsperada = identidadeAtual;
  const resultado = atualizarIdentidadeAutenticadaObra(
    identidadeAtual,
    "usuario-b",
  );

  assert.equal(resultado.mudou, false);
  assert.equal(resultado.identidade, identidadeAtual);
  assert.equal(resultado.identidade.versao, 7);
  assert.equal(
    execucaoIdentidadeObraEstaAtual({
      cancelada: false,
      identidadeEsperada,
      identidadeAtual: resultado.identidade,
    }),
    true,
  );
});

test("mantem autenticacao como unica proprietaria e protege backup do carregamento", () => {
  const paginaObra = readFileSync(
    new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
    "utf8",
  );
  const escritasUsuarioIdLogado = paginaObra.split("setUsuarioIdLogado(").length - 1;

  assert.equal(escritasUsuarioIdLogado, 1);
  assert.match(
    paginaObra,
    /carregarObraSupabasePorSlug\([\s\S]*?execucaoCarregamentoEstaAtual,[\s\S]*?\);/,
  );

  const inicioCarregador = paginaObra.indexOf(
    "async function carregarObraSupabasePorSlug(",
  );
  const fimCarregador = paginaObra.indexOf(
    "export default function ObraDinamicaPage()",
    inicioCarregador,
  );
  const blocoCarregador = paginaObra.slice(inicioCarregador, fimCarregador);
  const indiceBackup = blocoCarregador.indexOf(
    "sincronizarBackupArquivosObras(obrasAtualizadas, userId);",
  );
  const indiceGuardBackup = blocoCarregador.lastIndexOf(
    "if (!execucaoAtual())",
    indiceBackup,
  );

  assert.ok(inicioCarregador >= 0);
  assert.ok(fimCarregador > inicioCarregador);
  assert.ok(indiceGuardBackup >= 0);
  assert.ok(indiceBackup > indiceGuardBackup);
});
