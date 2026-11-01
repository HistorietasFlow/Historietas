import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);
const lifecycleAvaliacao = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-rating-lifecycle.ts",
    import.meta.url,
  ),
  "utf8",
);

test("cliente delega o lifecycle de avaliacao ao hook", () => {
  assert.match(
    paginaObra,
    /import \{ useObraRatingLifecycle \} from "\.\/hooks\/use-obra-rating-lifecycle";/,
  );
  assert.match(
    paginaObra,
    /const \{[\s\S]*?avaliarObra,[\s\S]*?invalidarAvaliacaoObra,[\s\S]*?\} = useObraRatingLifecycle\(\{[\s\S]*?obra,[\s\S]*?obraNormalizada,[\s\S]*?usuarioIdLogado,[\s\S]*?autorObraId,[\s\S]*?avaliacaoObra,[\s\S]*?obterIdentidadeLogadaParaAcao,[\s\S]*?criarGuardIdentidadeAcao,[\s\S]*?setAvaliacaoObra,[\s\S]*?setMensagemAcao,[\s\S]*?\}\);/,
  );
  assert.match(
    paginaObra,
    /useEffect\(\(\) => \{\s*invalidarAvaliacaoObraRef\.current = invalidarAvaliacaoObra;\s*\}, \[invalidarAvaliacaoObra\]\);/,
  );
  assert.match(
    paginaObra,
    /invalidarAvaliacaoObraRef\.current\(\);/,
  );
  assert.doesNotMatch(paginaObra, /async function carregarAvaliacaoRealObra\(/);
  assert.doesNotMatch(paginaObra, /async function avaliarObra\(nota: number\)/);
  assert.doesNotMatch(paginaObra, /avaliacaoVersaoRef/);
});

test("hook preserva fallback local, snapshot remoto e cancelamento versionado", () => {
  for (const trecho of [
    "export function useObraRatingLifecycle",
    "const avaliacaoVersaoRef = useRef(0);",
    "function invalidarAvaliacaoObra()",
    "avaliacaoVersaoRef.current += 1;",
    "obterAvaliacaoLocalInicialObra(",
    "const aplicarAvaliacaoLocalTimer = window.setTimeout(",
    "async function carregarAvaliacaoRealObra()",
    "await carregarSnapshotRemotoAvaliacaoObra({",
    "cancelado ||",
    "avaliacaoVersaoRef.current !== versaoAoIniciar",
    "salvarAvaliacaoLocal(",
    "window.clearTimeout(aplicarAvaliacaoLocalTimer);",
  ]) {
    assert.ok(lifecycleAvaliacao.includes(trecho), trecho);
  }

  const indiceSnapshot = lifecycleAvaliacao.indexOf(
    "await carregarSnapshotRemotoAvaliacaoObra({",
  );
  const indiceGuard = lifecycleAvaliacao.indexOf(
    "avaliacaoVersaoRef.current !== versaoAoIniciar",
    indiceSnapshot,
  );
  const indiceCache = lifecycleAvaliacao.indexOf(
    "salvarAvaliacaoLocal(",
    indiceGuard,
  );

  assert.ok(indiceGuard > indiceSnapshot);
  assert.ok(indiceCache > indiceGuard);
});

test("hook preserva mutation otimista, rollback, Diario e guards de identidade", () => {
  const inicio = lifecycleAvaliacao.indexOf("async function avaliarObra(nota: number)");
  const fim = lifecycleAvaliacao.indexOf(
    "\n  return {\n    avaliarObra,",
    inicio,
  );

  assert.ok(inicio >= 0);
  assert.ok(fim > inicio);

  const mutation = lifecycleAvaliacao.slice(inicio, fim);

  for (const trecho of [
    "await obterIdentidadeLogadaParaAcao(",
    "criarGuardIdentidadeAcao(identidadeAcao)",
    "const execucaoAvaliacaoEstaAtual = () =>",
    "avaliacaoVersaoRef.current === versaoAvaliacao",
    "calcularProximaAvaliacao(",
    "setAvaliacaoObra(proximaAvaliacao);",
    "salvarAvaliacaoLocal(obra, notaNormalizada, userId);",
    "await salvarAvaliacaoRemotaObra({",
    "avaliacaoAnterior.minhaNota",
    "Não foi possível salvar a avaliação agora.",
    "await registrarAtividadeDiarioObra({",
    "await removerAtividadeDiarioObra({",
    "execucaoAtual: execucaoAvaliacaoEstaAtual",
  ]) {
    assert.ok(mutation.includes(trecho), trecho);
  }

  assert.ok(
    mutation.indexOf("setAvaliacaoObra(proximaAvaliacao);") <
      mutation.indexOf("await salvarAvaliacaoRemotaObra({"),
  );
  assert.ok(
    mutation.indexOf("await salvarAvaliacaoRemotaObra({") <
      mutation.indexOf("await registrarAtividadeDiarioObra({"),
  );
});

test("hook permanece limitado a avaliacao", () => {
  for (const trecho of [
    "comentario",
    "alternarSeguirObra",
    "alternarCurtidaObra",
    "alternarFavoritoObra",
    "alternarConcluirObra",
    "carregarMetricasConteudos",
    "compartilharObra",
    "<Obra",
  ]) {
    assert.doesNotMatch(lifecycleAvaliacao, new RegExp(trecho, "i"));
  }
});
