import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  atualizarIdentidadeAutenticadaObra,
  execucaoIdentidadeObraEstaAtual,
} from "../../app/obra/[slug]/lib/obra-auth-identity.ts";

const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);
const persistenciaInteracoesObra = readFileSync(
  new URL(
    "../../app/obra/[slug]/lib/obra-supabase-interaction-persistence.ts",
    import.meta.url,
  ),
  "utf8",
);

function criarPromessaControlada() {
  let resolver;
  let rejeitar;
  const promessa = new Promise((resolve, reject) => {
    resolver = resolve;
    rejeitar = reject;
  });

  return { promessa, resolver, rejeitar };
}

function obterBloco(inicioTexto, fimTexto) {
  const inicio = paginaObra.indexOf(inicioTexto);
  const fim = paginaObra.indexOf(fimTexto, inicio);

  assert.ok(inicio >= 0);
  assert.ok(fim > inicio);

  return paginaObra.slice(inicio, fim);
}

function obterBlocoPersistencia(inicioTexto, fimTexto) {
  const inicio = persistenciaInteracoesObra.indexOf(inicioTexto);
  const fim = persistenciaInteracoesObra.indexOf(fimTexto, inicio);

  assert.ok(inicio >= 0);
  assert.ok(fim > inicio);

  return persistenciaInteracoesObra.slice(inicio, fim);
}

test("resultado social da conta A nao e aplicado depois da troca para B", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 1 };
  const identidadeAcao = identidadeAtual;
  const remotoControlado = criarPromessaControlada();
  const estadosAplicados = [];
  const rollbacksAplicados = [];

  async function executarAcao() {
    try {
      await remotoControlado.promessa;

      if (
        !execucaoIdentidadeObraEstaAtual({
          cancelada: false,
          identidadeEsperada: identidadeAcao,
          identidadeAtual,
        })
      ) {
        return;
      }

      estadosAplicados.push("sucesso-a");
    } catch {
      if (
        !execucaoIdentidadeObraEstaAtual({
          cancelada: false,
          identidadeEsperada: identidadeAcao,
          identidadeAtual,
        })
      ) {
        return;
      }

      rollbacksAplicados.push("rollback-a");
    }
  }

  const acao = executarAcao();

  identidadeAtual = atualizarIdentidadeAutenticadaObra(
    identidadeAtual,
    "usuario-b",
  ).identidade;

  remotoControlado.resolver();
  await acao;

  assert.deepEqual(estadosAplicados, []);
  assert.deepEqual(rollbacksAplicados, []);
  assert.deepEqual(identidadeAtual, {
    usuarioId: "usuario-b",
    versao: 2,
  });
});

test("helper de acao valida versao e user id apos getUser", () => {
  const bloco = obterBloco(
    "async function obterIdentidadeLogadaParaAcao(",
    "async function alternarSeguirObra()",
  );

  assert.match(bloco, /const identidadeEsperada = identidadeAutenticadaObraRef\.current/);
  assert.match(bloco, /execucaoIdentidadeObraEstaAtual/);
  assert.match(bloco, /if \(!execucaoAtual\(\)\)/);
  assert.match(bloco, /userId === identidadeEsperada\.usuarioId/);
});

test("seis acoes sociais usam identidade versionada", () => {
  const handlers = [
    ["async function alternarSeguirObra()", "async function alternarCurtidaObra()"],
    ["async function alternarCurtidaObra()", "async function enviarComentarioObra("],
    ["async function enviarComentarioObra(", "function inserirNoComentarioObra("],
    ["async function removerComentarioObra(", "async function alternarCurtidaComentarioObra("],
    ["async function alternarFavoritoObra()", "async function alternarConcluirObra()"],
    ["async function alternarConcluirObra()", "async function avaliarObra("],
  ];

  for (const [inicio, fim] of handlers) {
    const bloco = obterBloco(inicio, fim);

    assert.match(bloco, /obterIdentidadeLogadaParaAcao/);
    assert.match(bloco, /criarGuardIdentidadeAcao/);
    assert.match(bloco, /execucaoAcaoEstaAtual/);
  }
});

test("remocao de comentario obsoleta nao altera dados nem libera lock da conta B", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 1 };
  const identidadeAcao = identidadeAtual;
  const remotoControlado = criarPromessaControlada();
  const idsParaRemover = new Set(["comentario-a", "resposta-a"]);
  let comentarios = [{ id: "comentario-a" }];
  let total = 2;
  let proximoOffset = 1;
  let resposta = { comentarioPaiId: "comentario-a" };
  let status = "";
  let lock = "comentario-a";
  const cachesSalvos = [];
  const execucaoAcaoEstaAtual = () =>
    execucaoIdentidadeObraEstaAtual({
      cancelada: false,
      identidadeEsperada: identidadeAcao,
      identidadeAtual,
    });

  async function removerComentario() {
    try {
      await remotoControlado.promessa;

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      const proximosComentarios = comentarios.filter(
        (comentario) => !idsParaRemover.has(comentario.id),
      );

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      cachesSalvos.push(proximosComentarios);
      comentarios = proximosComentarios;
      total = Math.max(0, total - idsParaRemover.size);
      proximoOffset = Math.max(0, proximoOffset - 1);
      resposta = null;
    } catch {
      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      status = "Não foi possível remover o comentário agora.";
    } finally {
      if (execucaoAcaoEstaAtual()) {
        lock = "";
      }
    }
  }

  const remocaoA = removerComentario();

  identidadeAtual = atualizarIdentidadeAutenticadaObra(
    identidadeAtual,
    "usuario-b",
  ).identidade;
  comentarios = [{ id: "comentario-b" }];
  total = 7;
  proximoOffset = 4;
  resposta = { comentarioPaiId: "comentario-b" };
  status = "estado-b";
  lock = "comentario-b";

  remotoControlado.resolver();
  await remocaoA;

  assert.deepEqual(comentarios, [{ id: "comentario-b" }]);
  assert.equal(total, 7);
  assert.equal(proximoOffset, 4);
  assert.deepEqual(resposta, { comentarioPaiId: "comentario-b" });
  assert.equal(status, "estado-b");
  assert.deepEqual(cachesSalvos, []);
  assert.equal(lock, "comentario-b");
});

test("remocao de comentario valida aplica o fluxo normal", async () => {
  const identidadeAtual = { usuarioId: "usuario-a", versao: 1 };
  const identidadeAcao = identidadeAtual;
  const remotoControlado = criarPromessaControlada();
  const idsParaRemover = new Set(["comentario-a", "resposta-a"]);
  let comentarios = [{ id: "comentario-a" }, { id: "comentario-b" }];
  let total = 3;
  let proximoOffset = 2;
  let resposta = { comentarioPaiId: "comentario-a" };
  let lock = "comentario-a";
  const cachesSalvos = [];
  const execucaoAcaoEstaAtual = () =>
    execucaoIdentidadeObraEstaAtual({
      cancelada: false,
      identidadeEsperada: identidadeAcao,
      identidadeAtual,
    });

  async function removerComentario() {
    try {
      await remotoControlado.promessa;

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      const proximosComentarios = comentarios.filter(
        (comentario) => !idsParaRemover.has(comentario.id),
      );
      cachesSalvos.push(proximosComentarios);
      comentarios = proximosComentarios;
      total = Math.max(0, total - idsParaRemover.size);
      proximoOffset = Math.max(0, proximoOffset - 1);
      resposta = null;
    } finally {
      if (execucaoAcaoEstaAtual()) {
        lock = "";
      }
    }
  }

  const remocao = removerComentario();
  remotoControlado.resolver();
  await remocao;

  assert.deepEqual(comentarios, [{ id: "comentario-b" }]);
  assert.deepEqual(cachesSalvos, [[{ id: "comentario-b" }]]);
  assert.equal(total, 1);
  assert.equal(proximoOffset, 1);
  assert.equal(resposta, null);
  assert.equal(lock, "");
});

test("falha obsoleta de remocao de comentario nao mostra erro nem libera lock de B", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 1 };
  const identidadeAcao = identidadeAtual;
  const remotoControlado = criarPromessaControlada();
  let status = "estado-b";
  let lock = "comentario-a";
  const execucaoAcaoEstaAtual = () =>
    execucaoIdentidadeObraEstaAtual({
      cancelada: false,
      identidadeEsperada: identidadeAcao,
      identidadeAtual,
    });

  async function removerComentario() {
    try {
      await remotoControlado.promessa;
    } catch {
      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      status = "Não foi possível remover o comentário agora.";
    } finally {
      if (execucaoAcaoEstaAtual()) {
        lock = "";
      }
    }
  }

  const remocaoA = removerComentario();

  identidadeAtual = atualizarIdentidadeAutenticadaObra(
    identidadeAtual,
    "usuario-b",
  ).identidade;
  lock = "comentario-b";

  remotoControlado.rejeitar(new Error("falha remota"));
  await remocaoA;

  assert.equal(status, "estado-b");
  assert.equal(lock, "comentario-b");
});

test("remocao de comentario revalida identidade apos o delete e antes dos efeitos", () => {
  const bloco = obterBloco(
    "async function removerComentarioObra(",
    "async function alternarCurtidaComentarioObra(",
  );
  const indiceDelete = bloco.indexOf("await removerComentarioObraSupabase");
  const indiceGuardAposDelete = bloco.indexOf(
    "if (!execucaoAcaoEstaAtual())",
    indiceDelete,
  );
  const indiceComentarios = bloco.indexOf("setComentariosObra");
  const indiceCache = bloco.indexOf("salvarComentariosObraLocais");
  const indiceTotal = bloco.indexOf("setTotalComentariosObra");
  const indiceOffset = bloco.indexOf("setComentariosProximoOffset");
  const indiceResposta = bloco.indexOf("setRespostaComentario(null)");
  const indiceCatch = bloco.indexOf("} catch {");
  const indiceGuardCatch = bloco.indexOf(
    "if (!execucaoAcaoEstaAtual())",
    indiceCatch,
  );
  const indiceFinally = bloco.indexOf("} finally {");
  const indiceGuardFinally = bloco.indexOf(
    "if (execucaoAcaoEstaAtual())",
    indiceFinally,
  );

  assert.match(bloco, /const userId = identidadeAcao\.usuarioId/);
  assert.ok(indiceDelete >= 0);
  assert.ok(indiceGuardAposDelete > indiceDelete);
  assert.ok(indiceComentarios > indiceGuardAposDelete);
  assert.ok(indiceCache > indiceComentarios);
  assert.ok(indiceTotal > indiceCache);
  assert.ok(indiceOffset > indiceTotal);
  assert.ok(indiceResposta > indiceOffset);
  assert.ok(indiceGuardCatch > indiceCatch);
  assert.ok(indiceGuardFinally > indiceFinally);
});

test("comentario revalida identidade depois dos awaits e antes de rollback", () => {
  const bloco = obterBloco(
    "async function enviarComentarioObra(",
    "function inserirNoComentarioObra(",
  );

  const indicePerfil = bloco.indexOf("await carregarPerfilPublicoObra");
  const indiceGuardPerfil = bloco.indexOf(
    "if (!execucaoAcaoEstaAtual())",
    indicePerfil,
  );
  const indiceInsert = bloco.indexOf("await inserirComentarioObraSupabase");
  const indiceGuardInsert = bloco.indexOf(
    "if (!execucaoAcaoEstaAtual())",
    indiceInsert,
  );
  const indiceNormalizar = bloco.indexOf(
    "await normalizarComentariosObraSupabase",
  );
  const indiceGuardNormalizar = bloco.indexOf(
    "if (!execucaoAcaoEstaAtual())",
    indiceNormalizar,
  );
  const indiceCatch = bloco.indexOf("} catch {");
  const indiceGuardCatch = bloco.indexOf(
    "if (!execucaoAcaoEstaAtual())",
    indiceCatch,
  );

  assert.ok(indiceGuardPerfil > indicePerfil);
  assert.ok(indiceGuardInsert > indiceInsert);
  assert.ok(indiceGuardNormalizar > indiceNormalizar);
  assert.ok(indiceGuardCatch > indiceCatch);
});

test("ativacao social nao apaga registro antes de inserir", () => {
  const registro = obterBlocoPersistencia(
    "export async function salvarRegistroObraPublicaSupabase(",
    "export async function salvarCurtidaObraPublicaSupabase(",
  );
  const curtida = obterBlocoPersistencia(
    "export async function salvarCurtidaObraPublicaSupabase(",
    "throw ultimoErro || new Error",
  );
  const seguir = obterBloco(
    "async function alternarSeguirObra()",
    "async function alternarCurtidaObra()",
  );

  assert.match(registro, /if \(!ativo\)[\s\S]*?\.delete\(\)/);
  assert.match(registro, /\.upsert\([\s\S]*?ignoreDuplicates: true/);
  assert.match(curtida, /if \(!ativo\)[\s\S]*?\.delete\(\)/);
  assert.match(curtida, /\.upsert\([\s\S]*?ignoreDuplicates: true/);
  assert.match(seguir, /if \(seguindo\)[\s\S]*?\.upsert\(/);
});

test("curtida local usa o user id capturado pela acao", () => {
  const bloco = obterBloco(
    "async function alternarCurtidaObra()",
    "async function enviarComentarioObra(",
  );

  assert.match(
    bloco,
    /lerStorageUsuarioObraPublica\(\s*LIKED_WORKS_STORAGE_KEY,\s*userId/,
  );
  assert.doesNotMatch(
    bloco,
    /lerStorageUsuarioObraPublica\(\s*LIKED_WORKS_STORAGE_KEY,\s*usuarioIdLogado/,
  );
});
