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
  const promessa = new Promise((resolve) => {
    resolver = resolve;
  });

  return { promessa, resolver };
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

test("cinco acoes sociais usam identidade versionada", () => {
  const handlers = [
    ["async function alternarSeguirObra()", "async function alternarCurtidaObra()"],
    ["async function alternarCurtidaObra()", "async function enviarComentarioObra("],
    ["async function enviarComentarioObra(", "function inserirNoComentarioObra("],
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
  const indiceInsert = bloco.indexOf('.from("comentarios_obras")');
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
