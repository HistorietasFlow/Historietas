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

test("oito acoes sociais usam identidade versionada", () => {
  const handlers = [
    ["async function alternarSeguirObra()", "async function alternarCurtidaObra()"],
    ["async function alternarCurtidaObra()", "async function enviarComentarioObra("],
    ["async function enviarComentarioObra(", "function inserirNoComentarioObra("],
    ["async function removerComentarioObra(", "async function alternarCurtidaComentarioObra("],
    ["async function alternarCurtidaComentarioObra(", "async function alternarFavoritoObra()"],
    ["async function alternarFavoritoObra()", "async function alternarConcluirObra()"],
    ["async function alternarConcluirObra()", "async function avaliarObra("],
    ["async function avaliarObra(", "async function compartilharObraAtual()"],
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

test("curtida de comentario obsoleta nao altera dados, cache, mensagem ou lock da conta B", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 1 };
  const identidadeAcao = identidadeAtual;
  const deleteControlado = criarPromessaControlada();
  let comentarios = [{ id: "comentario-b", curtidas: ["usuario-b"] }];
  let status = "estado-b";
  let lock = "comentario-a";
  let insercoes = 0;
  const cachesSalvos = [];
  const execucaoAcaoEstaAtual = () =>
    execucaoIdentidadeObraEstaAtual({
      cancelada: false,
      identidadeEsperada: identidadeAcao,
      identidadeAtual,
    });

  async function curtirComentario() {
    try {
      await deleteControlado.promessa;

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      insercoes += 1;
    } catch {
      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      comentarios = comentarios.map((comentario) =>
        comentario.id === "comentario-a"
          ? { ...comentario, curtidas: [] }
          : comentario,
      );

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      status = "Não foi possível atualizar a curtida do comentário agora.";
    } finally {
      if (execucaoAcaoEstaAtual()) {
        lock = "";
      }
    }
  }

  const curtidaA = curtirComentario();

  identidadeAtual = atualizarIdentidadeAutenticadaObra(
    identidadeAtual,
    "usuario-b",
  ).identidade;
  comentarios = [{ id: "comentario-b", curtidas: ["usuario-b"] }];
  status = "estado-b";
  lock = "comentario-b";

  deleteControlado.resolver();
  await curtidaA;

  assert.deepEqual(comentarios, [
    { id: "comentario-b", curtidas: ["usuario-b"] },
  ]);
  assert.deepEqual(cachesSalvos, []);
  assert.equal(status, "estado-b");
  assert.equal(insercoes, 0);
  assert.equal(lock, "comentario-b");
});

test("erro tardio da curtida de comentario nao faz rollback, mensagem ou unlock da conta B", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 1 };
  const identidadeAcao = identidadeAtual;
  const deleteControlado = criarPromessaControlada();
  let comentarios = [{ id: "comentario-b", curtidas: ["usuario-b"] }];
  let status = "estado-b";
  let lock = "comentario-a";
  const execucaoAcaoEstaAtual = () =>
    execucaoIdentidadeObraEstaAtual({
      cancelada: false,
      identidadeEsperada: identidadeAcao,
      identidadeAtual,
    });

  async function curtirComentario() {
    try {
      await deleteControlado.promessa;
    } catch {
      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      comentarios = comentarios.map((comentario) =>
        comentario.id === "comentario-a"
          ? { ...comentario, curtidas: [] }
          : comentario,
      );
      status = "Não foi possível atualizar a curtida do comentário agora.";
    } finally {
      if (execucaoAcaoEstaAtual()) {
        lock = "";
      }
    }
  }

  const curtidaA = curtirComentario();

  identidadeAtual = atualizarIdentidadeAutenticadaObra(
    identidadeAtual,
    "usuario-b",
  ).identidade;
  lock = "comentario-b";

  deleteControlado.rejeitar(new Error("falha remota"));
  await curtidaA;

  assert.deepEqual(comentarios, [
    { id: "comentario-b", curtidas: ["usuario-b"] },
  ]);
  assert.equal(status, "estado-b");
  assert.equal(lock, "comentario-b");
});

test("curtida de comentario valida insere e libera o lock", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 1 };
  const identidadeAcao = identidadeAtual;
  const deleteControlado = criarPromessaControlada();
  const insertControlado = criarPromessaControlada();
  const operacoes = [];
  let lock = "comentario-a";
  const execucaoAcaoEstaAtual = () =>
    execucaoIdentidadeObraEstaAtual({
      cancelada: false,
      identidadeEsperada: identidadeAcao,
      identidadeAtual,
    });

  async function curtirComentario() {
    try {
      operacoes.push("delete");
      await deleteControlado.promessa;

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      operacoes.push("insert");
      await insertControlado.promessa;

      if (!execucaoAcaoEstaAtual()) {
        return;
      }
    } finally {
      if (execucaoAcaoEstaAtual()) {
        lock = "";
      }
    }
  }

  const curtida = curtirComentario();
  deleteControlado.resolver();
  await Promise.resolve();

  assert.deepEqual(operacoes, ["delete", "insert"]);

  identidadeAtual = atualizarIdentidadeAutenticadaObra(
    identidadeAtual,
    "usuario-a",
  ).identidade;
  insertControlado.resolver();
  await curtida;

  assert.deepEqual(operacoes, ["delete", "insert"]);
  assert.equal(lock, "");
});

test("updater local tardio da curtida nao grava cache da conta A depois da troca", () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 1 };
  const identidadeAcao = identidadeAtual;
  const cachesSalvos = [];
  const execucaoAcaoEstaAtual = () =>
    execucaoIdentidadeObraEstaAtual({
      cancelada: false,
      identidadeEsperada: identidadeAcao,
      identidadeAtual,
    });
  const atualizarComentariosLocais = (comentariosAtuais) => {
    if (!execucaoAcaoEstaAtual()) {
      return comentariosAtuais;
    }

    cachesSalvos.push({ usuarioId: "usuario-a", comentarios: comentariosAtuais });
    return comentariosAtuais;
  };

  identidadeAtual = atualizarIdentidadeAutenticadaObra(
    identidadeAtual,
    "usuario-b",
  ).identidade;

  const comentariosB = [{ id: "comentario-b", curtidas: ["usuario-b"] }];

  assert.deepEqual(atualizarComentariosLocais(comentariosB), comentariosB);
  assert.deepEqual(cachesSalvos, []);
});

test("curtida de comentario revalida identidade nos limites remoto, local, rollback e finally", () => {
  const bloco = obterBloco(
    "async function alternarCurtidaComentarioObra(",
    "async function alternarFavoritoObra()",
  );
  const indiceIdentidade = bloco.indexOf("await obterIdentidadeLogadaParaAcao");
  const indiceOtimista = bloco.indexOf("setComentariosObra((comentariosAtuais) =>");
  const indiceGuardOtimista = bloco.indexOf(
    "if (!execucaoAcaoEstaAtual())",
    indiceOtimista,
  );
  const indiceLocal = bloco.indexOf("if (comentario.local");
  const indiceUpdaterLocal = bloco.indexOf(
    "setComentariosObra((comentariosAtuais) => {",
    indiceLocal,
  );
  const indiceGuardUpdaterLocal = bloco.indexOf(
    "if (!execucaoAcaoEstaAtual())",
    indiceUpdaterLocal,
  );
  const indiceCache = bloco.indexOf("salvarComentariosObraLocais");
  const indiceDelete = bloco.indexOf(
    "await removerCurtidaComentarioObraSupabase",
    indiceLocal,
  );
  const indiceGuardAntesDelete = bloco.lastIndexOf(
    "if (!execucaoAcaoEstaAtual())",
    indiceDelete,
  );
  const indiceGuardAposDelete = bloco.indexOf(
    "if (!execucaoAcaoEstaAtual())",
    indiceDelete,
  );
  const indiceErroDelete = bloco.indexOf("if (erroRemoverCurtida)");
  const indiceInsert = bloco.indexOf(
    "await inserirCurtidaComentarioObraSupabase",
    indiceErroDelete,
  );
  const indiceGuardAntesInsert = bloco.lastIndexOf(
    "if (!execucaoAcaoEstaAtual())",
    indiceInsert,
  );
  const indiceGuardAposInsert = bloco.indexOf(
    "if (!execucaoAcaoEstaAtual())",
    indiceInsert,
  );
  const indiceErroInsert = bloco.indexOf("if (erroInserirCurtida)");
  const indiceCatch = bloco.indexOf("} catch {");
  const indiceRollback = bloco.indexOf("setComentariosObra", indiceCatch);
  const indiceGuardRollback = bloco.indexOf(
    "if (!execucaoAcaoEstaAtual())",
    indiceRollback,
  );
  const indiceStatus = bloco.indexOf("setComentarioStatus", indiceCatch);
  const indiceFinally = bloco.indexOf("} finally {");
  const indiceGuardFinally = bloco.indexOf(
    "if (execucaoAcaoEstaAtual())",
    indiceFinally,
  );

  assert.doesNotMatch(bloco, /obterUsuarioLogadoParaAcao/);
  assert.ok(indiceIdentidade >= 0);
  assert.match(bloco, /const userId = identidadeAcao\.usuarioId/);
  assert.match(bloco, /criarGuardIdentidadeAcao\(identidadeAcao\)/);
  assert.match(
    bloco,
    /setComentariosObra\(\(comentariosAtuais\) => \{\s*if \(!execucaoAcaoEstaAtual\(\)\)/,
  );
  assert.ok(indiceOtimista > indiceIdentidade);
  assert.ok(indiceGuardOtimista > indiceOtimista);
  assert.ok(indiceCache > indiceLocal);
  assert.ok(indiceGuardUpdaterLocal > indiceUpdaterLocal);
  assert.ok(indiceCache > indiceGuardUpdaterLocal);
  assert.ok(indiceDelete > indiceCache);
  assert.ok(indiceGuardAntesDelete < indiceDelete);
  assert.ok(indiceGuardAposDelete > indiceDelete);
  assert.ok(indiceErroDelete > indiceGuardAposDelete);
  assert.ok(indiceInsert > indiceErroDelete);
  assert.ok(indiceGuardAntesInsert < indiceInsert);
  assert.ok(indiceGuardAposInsert > indiceInsert);
  assert.ok(indiceErroInsert > indiceGuardAposInsert);
  assert.ok(indiceRollback > indiceCatch);
  assert.ok(indiceGuardRollback > indiceRollback);
  assert.ok(indiceStatus > indiceRollback);
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

test("avaliacao obsoleta nao altera estado, cache, mensagem nem inicia Diario da conta B", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 1 };
  const identidadeAcao = identidadeAtual;
  const remotoControlado = criarPromessaControlada();
  let versaoAvaliacaoAtual = 0;
  let avaliacao = { usuarioId: "usuario-a", salvando: true };
  let mensagem = "estado-a";
  const cachesDepoisDaTroca = [];
  let sincronizacoesDiario = 0;
  let trocaConcluida = false;
  const versaoAvaliacao = versaoAvaliacaoAtual + 1;
  versaoAvaliacaoAtual = versaoAvaliacao;
  const execucaoAvaliacaoEstaAtual = () =>
    execucaoIdentidadeObraEstaAtual({
      cancelada: false,
      identidadeEsperada: identidadeAcao,
      identidadeAtual,
    }) && versaoAvaliacaoAtual === versaoAvaliacao;

  async function avaliar() {
    if (!execucaoAvaliacaoEstaAtual()) {
      return;
    }

    avaliacao = { usuarioId: "usuario-a", salvando: true };
    mensagem = "";

    await remotoControlado.promessa;

    if (!execucaoAvaliacaoEstaAtual()) {
      return;
    }

    if (trocaConcluida) {
      cachesDepoisDaTroca.push("cache-a");
    }
    sincronizacoesDiario += 1;
  }

  const avaliacaoA = avaliar();

  identidadeAtual = atualizarIdentidadeAutenticadaObra(
    identidadeAtual,
    "usuario-b",
  ).identidade;
  versaoAvaliacaoAtual += 1;
  trocaConcluida = true;
  avaliacao = { usuarioId: "usuario-b", salvando: true };
  mensagem = "estado-b";

  remotoControlado.resolver();
  await avaliacaoA;

  assert.deepEqual(avaliacao, { usuarioId: "usuario-b", salvando: true });
  assert.equal(mensagem, "estado-b");
  assert.deepEqual(cachesDepoisDaTroca, []);
  assert.equal(sincronizacoesDiario, 0);
});

test("falha remota obsoleta da avaliacao nao faz rollback nem mostra mensagem da conta A", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 1 };
  const identidadeAcao = identidadeAtual;
  const remotoControlado = criarPromessaControlada();
  let versaoAvaliacaoAtual = 1;
  const versaoAvaliacao = versaoAvaliacaoAtual;
  let avaliacao = { usuarioId: "usuario-a", salvando: true };
  let mensagem = "estado-a";
  let rollbackExecutado = false;
  const execucaoAvaliacaoEstaAtual = () =>
    execucaoIdentidadeObraEstaAtual({
      cancelada: false,
      identidadeEsperada: identidadeAcao,
      identidadeAtual,
    }) && versaoAvaliacaoAtual === versaoAvaliacao;

  async function avaliar() {
    try {
      await remotoControlado.promessa;
    } catch {
      if (!execucaoAvaliacaoEstaAtual()) {
        return;
      }

      rollbackExecutado = true;
      avaliacao = { usuarioId: "usuario-a", salvando: false };
      mensagem = "Não foi possível salvar a avaliação agora.";
    }
  }

  const avaliacaoA = avaliar();

  identidadeAtual = atualizarIdentidadeAutenticadaObra(
    identidadeAtual,
    "usuario-b",
  ).identidade;
  versaoAvaliacaoAtual += 1;
  avaliacao = { usuarioId: "usuario-b", salvando: true };
  mensagem = "estado-b";

  remotoControlado.rejeitar(new Error("falha remota"));
  await avaliacaoA;

  assert.equal(rollbackExecutado, false);
  assert.deepEqual(avaliacao, { usuarioId: "usuario-b", salvando: true });
  assert.equal(mensagem, "estado-b");
});

test("Diario pendente da avaliacao A nao finaliza estado da conta B", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 1 };
  const identidadeAcao = identidadeAtual;
  const diarioControlado = criarPromessaControlada();
  let versaoAvaliacaoAtual = 1;
  const versaoAvaliacao = versaoAvaliacaoAtual;
  let avaliacao = { usuarioId: "usuario-a", salvando: true };
  let diarioRecebeuGuard = null;
  const execucaoAvaliacaoEstaAtual = () =>
    execucaoIdentidadeObraEstaAtual({
      cancelada: false,
      identidadeEsperada: identidadeAcao,
      identidadeAtual,
    }) && versaoAvaliacaoAtual === versaoAvaliacao;

  async function sincronizarDiario(execucaoAtual) {
    diarioRecebeuGuard = execucaoAtual;
    await diarioControlado.promessa;

    if (!execucaoAtual()) {
      return;
    }
  }

  async function avaliar() {
    await sincronizarDiario(execucaoAvaliacaoEstaAtual);

    if (!execucaoAvaliacaoEstaAtual()) {
      return;
    }

    avaliacao = { usuarioId: "usuario-a", salvando: false };
  }

  const avaliacaoA = avaliar();
  await Promise.resolve();

  assert.equal(diarioRecebeuGuard, execucaoAvaliacaoEstaAtual);

  identidadeAtual = atualizarIdentidadeAutenticadaObra(
    identidadeAtual,
    "usuario-b",
  ).identidade;
  versaoAvaliacaoAtual += 1;
  avaliacao = { usuarioId: "usuario-b", salvando: true };

  diarioControlado.resolver();
  await avaliacaoA;

  assert.deepEqual(avaliacao, { usuarioId: "usuario-b", salvando: true });
  assert.equal(diarioRecebeuGuard(), false);
});

test("avaliacao valida para a mesma identidade finaliza e uma versao mais nova bloqueia a anterior", async () => {
  let identidadeAtual = { usuarioId: "usuario-a", versao: 1 };
  const identidadeAcao = identidadeAtual;
  const remotoControlado = criarPromessaControlada();
  const diarioAntigoControlado = criarPromessaControlada();
  let versaoAvaliacaoAtual = 1;
  const versaoAvaliacao = versaoAvaliacaoAtual;
  let salvando = true;
  let diarioIniciado = 0;
  let diarioAntigoSincronizado = 0;
  let guardDiarioAntigo = null;
  const execucaoAvaliacaoEstaAtual = () =>
    execucaoIdentidadeObraEstaAtual({
      cancelada: false,
      identidadeEsperada: identidadeAcao,
      identidadeAtual,
    }) && versaoAvaliacaoAtual === versaoAvaliacao;

  async function avaliar() {
    await remotoControlado.promessa;

    if (!execucaoAvaliacaoEstaAtual()) {
      return;
    }

    diarioIniciado += 1;
    salvando = false;
  }

  const avaliacaoA = avaliar();
  identidadeAtual = atualizarIdentidadeAutenticadaObra(
    identidadeAtual,
    "usuario-a",
  ).identidade;
  remotoControlado.resolver();
  await avaliacaoA;

  assert.equal(diarioIniciado, 1);
  assert.equal(salvando, false);

  const remotoAntigo = criarPromessaControlada();
  salvando = true;
  const avaliacaoAntiga = (async () => {
    await remotoAntigo.promessa;

    if (!execucaoAvaliacaoEstaAtual()) {
      return;
    }

    guardDiarioAntigo = execucaoAvaliacaoEstaAtual;
    await diarioAntigoControlado.promessa;

    if (!guardDiarioAntigo()) {
      return;
    }

    diarioAntigoSincronizado += 1;
    salvando = false;
  })();

  remotoAntigo.resolver();
  await Promise.resolve();

  assert.equal(guardDiarioAntigo, execucaoAvaliacaoEstaAtual);

  versaoAvaliacaoAtual += 1;
  salvando = true;
  diarioAntigoControlado.resolver();
  await avaliacaoAntiga;

  assert.equal(diarioAntigoSincronizado, 0);
  assert.equal(salvando, true);
});

test("avaliacao usa identidade versionada nos limites de persistencia, Diario e finalizacao", () => {
  const bloco = obterBloco(
    "async function avaliarObra(nota: number)",
    "async function compartilharObraAtual()",
  );
  const indiceIdentidade = bloco.indexOf("await obterIdentidadeLogadaParaAcao");
  const indiceOtimista = bloco.indexOf("setAvaliacaoObra(proximaAvaliacao)");
  const indiceRemoto = bloco.indexOf("await salvarAvaliacaoRemotaObra");
  const indiceGuardAposRemoto = bloco.indexOf(
    "if (!execucaoAvaliacaoEstaAtual())",
    indiceRemoto,
  );
  const indiceDiario = bloco.indexOf("await registrarAtividadeDiarioObra");
  const indiceGuardAposDiario = bloco.indexOf(
    "if (!execucaoAvaliacaoEstaAtual())",
    indiceDiario,
  );
  const indiceFinalizacao = bloco.lastIndexOf("salvando: false");

  assert.doesNotMatch(bloco, /obterUsuarioLogadoParaAcao/);
  assert.ok(indiceIdentidade >= 0);
  assert.match(bloco, /const userId = identidadeAcao\.usuarioId/);
  assert.match(bloco, /criarGuardIdentidadeAcao\(identidadeAcao\)/);
  assert.match(
    bloco,
    /const execucaoAvaliacaoEstaAtual = \(\) =>\s*execucaoAcaoEstaAtual\(\) &&\s*avaliacaoVersaoRef\.current === versaoAvaliacao/,
  );
  assert.ok(indiceOtimista > indiceIdentidade);
  assert.ok(indiceRemoto > indiceOtimista);
  assert.ok(indiceGuardAposRemoto > indiceRemoto);
  assert.ok(indiceDiario > indiceGuardAposRemoto);
  assert.ok(indiceGuardAposDiario > indiceDiario);
  assert.ok(indiceFinalizacao > indiceGuardAposDiario);
  assert.match(
    bloco,
    /registrarAtividadeDiarioObra\(\{[\s\S]*?execucaoAtual: execucaoAvaliacaoEstaAtual/,
  );
  assert.match(
    bloco,
    /removerAtividadeDiarioObra\(\{[\s\S]*?execucaoAtual: execucaoAvaliacaoEstaAtual/,
  );
});
