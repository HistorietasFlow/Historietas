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

test("salvamento obsoleto do editor nao continua nem libera lock da conta seguinte", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 1 };
  let editorSalvando = false;
  const uploadControlado = criarPromessaControlada();
  const operacoesRemotas = [];
  const cachesPersistidos = [];
  const estadosAplicados = [];
  const mensagensEmitidas = [];

  async function salvarEditor() {
    const identidadeEsperada = identidadeAtual;
    const execucaoAtual = () =>
      execucaoCarregamentoPerfilAutorEstaAtual({
        cancelada: false,
        identidadeEsperada,
        identidadeAtual,
      });

    editorSalvando = true;
    operacoesRemotas.push("upload-avatar-a");
    await uploadControlado.promessa;

    if (!execucaoAtual()) {
      return;
    }

    operacoesRemotas.push("salvar-perfil-a");
    await Promise.resolve();

    if (!execucaoAtual()) {
      return;
    }

    operacoesRemotas.push("auth-update-user-a");
    await Promise.resolve();

    if (!execucaoAtual()) {
      return;
    }

    cachesPersistidos.push("cache-a");
    estadosAplicados.push("estado-a");
    mensagensEmitidas.push("mensagem-a");
    editorSalvando = false;
  }

  const salvamentoA = salvarEditor();

  identidadeAtual = atualizarIdentidadeAutenticadaPerfilAutor(
    identidadeAtual,
    "usuario-b",
  ).identidade;
  editorSalvando = false;
  editorSalvando = true;

  uploadControlado.resolver();
  await salvamentoA;

  assert.deepEqual(operacoesRemotas, ["upload-avatar-a"]);
  assert.deepEqual(cachesPersistidos, []);
  assert.deepEqual(estadosAplicados, []);
  assert.deepEqual(mensagensEmitidas, []);
  assert.equal(editorSalvando, true);
});

test("evento da mesma identidade mantem o salvamento do editor valido", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 4 };
  const identidadeEsperada = identidadeAtual;
  const uploadControlado = criarPromessaControlada();
  const operacoes = [];

  const salvamento = (async () => {
    operacoes.push("upload-avatar");
    await uploadControlado.promessa;

    if (
      !execucaoCarregamentoPerfilAutorEstaAtual({
        cancelada: false,
        identidadeEsperada,
        identidadeAtual,
      })
    ) {
      return;
    }

    operacoes.push(
      "salvar-perfil",
      "auth-update-user",
      "persistir-cache",
      "aplicar-estado",
      "emitir-mensagem",
      "liberar-lock",
    );
  })();

  const atualizacaoMesmaIdentidade = atualizarIdentidadeAutenticadaPerfilAutor(
    identidadeAtual,
    "usuario-a",
  );
  identidadeAtual = atualizacaoMesmaIdentidade.identidade;
  uploadControlado.resolver();
  await salvamento;

  assert.equal(atualizacaoMesmaIdentidade.mudou, false);
  assert.equal(identidadeAtual.versao, 4);
  assert.deepEqual(operacoes, [
    "upload-avatar",
    "salvar-perfil",
    "auth-update-user",
    "persistir-cache",
    "aplicar-estado",
    "emitir-mensagem",
    "liberar-lock",
  ]);
});

test("mantem guards do editor entre as etapas assincronas e os commits", () => {
  const paginaPerfilAutor = readFileSync(
    new URL("../../app/perfil-autor/page.tsx", import.meta.url),
    "utf8",
  );
  const inicioSalvamento = paginaPerfilAutor.indexOf(
    "async function salvarEdicaoPerfilAutor()",
  );
  const fimSalvamento = paginaPerfilAutor.indexOf(
    "function atualizarBioSobreAutor",
    inicioSalvamento,
  );
  const blocoSalvamento = paginaPerfilAutor.slice(
    inicioSalvamento,
    fimSalvamento,
  );
  const guardsDepoisDeEtapas = blocoSalvamento.match(
    /if \(!salvamentoEditorPerfilAindaAtual\(\)\)/g,
  );

  assert.ok(inicioSalvamento >= 0);
  assert.ok(fimSalvamento > inicioSalvamento);
  assert.ok((guardsDepoisDeEtapas?.length || 0) >= 10);
  assert.ok(
    blocoSalvamento.indexOf("const identidadeEsperada") <
      blocoSalvamento.indexOf("await enviarAvatarPerfilUsuarioSupabase"),
  );
  assert.ok(
    blocoSalvamento.indexOf("if (!salvamentoEditorPerfilAindaAtual())") <
      blocoSalvamento.indexOf("await supabase.auth.updateUser"),
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
