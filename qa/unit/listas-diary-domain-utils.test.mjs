import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const page = readFileSync(new URL("../../app/listas/page.tsx", import.meta.url), "utf8");
const values = readFileSync(new URL("../../app/listas/lib/listas-value-utils.ts", import.meta.url), "utf8");
const normalizers = readFileSync(new URL("../../app/listas/lib/listas-diary-normalizer-utils.ts", import.meta.url), "utf8");
const formatters = readFileSync(new URL("../../app/listas/lib/listas-format-utils.ts", import.meta.url), "utf8");
const annotations = readFileSync(new URL("../../app/listas/lib/listas-diary-annotation-utils.ts", import.meta.url), "utf8");
const ratings = readFileSync(new URL("../../app/listas/lib/listas-diary-rating-utils.ts", import.meta.url), "utf8");
const comments = readFileSync(new URL("../../app/listas/lib/listas-diary-comment-utils.ts", import.meta.url), "utf8");
const profileState = readFileSync(new URL("../../app/listas/lib/listas-profile-state-utils.ts", import.meta.url), "utf8");
const profileLoader = readFileSync(new URL("../../app/listas/lib/listas-profile-loader.ts", import.meta.url), "utf8");
const commentsPanel = readFileSync(
  new URL("../../app/listas/components/listas-diary-comments-panel.tsx", import.meta.url),
  "utf8",
);
const annotationActions = readFileSync(
  new URL(
    "../../app/listas/hooks/use-listas-diary-annotation-actions.ts",
    import.meta.url,
  ),
  "utf8",
);

async function importModule(source) {
  const javascript = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);
}

const valueUtils = await importModule(values);
const diaryNormalizers = await importModule(normalizers);
const formatUtils = await importModule(formatters);
const annotationUtils = await importModule(
  annotations
    .replace('import { timestampData } from "./listas-format-utils";', `const timestampData = ${formatUtils.timestampData.toString()};`)
    .replace(/import \{[\s\S]*?\} from "\.\/listas-diary-normalizer-utils";/, `const normalizarQuemPodeComentarAnotacaoListas = ${diaryNormalizers.normalizarQuemPodeComentarAnotacaoListas.toString()}; const normalizarTipoDiarioListas = ${diaryNormalizers.normalizarTipoDiarioListas.toString()}; const normalizarVisibilidadeAnotacaoListas = ${diaryNormalizers.normalizarVisibilidadeAnotacaoListas.toString()}; const normalizarVisibilidadeComentariosAnotacaoListas = ${diaryNormalizers.normalizarVisibilidadeComentariosAnotacaoListas.toString()};`)
    .replace('import { pegarBooleanoListas, pegarTexto } from "./listas-value-utils";', `const pegarBooleanoListas = ${valueUtils.pegarBooleanoListas.toString()}; const pegarTexto = ${valueUtils.pegarTexto.toString()};`),
);
const ratingUtils = await importModule(
  ratings
    .replace('import { normalizarQuemPodeAvaliarDiarioListas } from "./listas-diary-normalizer-utils";', `const normalizarQuemPodeAvaliarDiarioListas = ${diaryNormalizers.normalizarQuemPodeAvaliarDiarioListas.toString()};`)
    .replace('import { pegarBooleanoListas, pegarNumero } from "./listas-value-utils";', `const pegarBooleanoListas = ${valueUtils.pegarBooleanoListas.toString()}; const pegarNumero = ${valueUtils.pegarNumero.toString()};`),
);
const commentUtils = await importModule(
  comments.replace('import { timestampData } from "./listas-format-utils";', `const timestampData = ${formatUtils.timestampData.toString()};`),
);

test("Listas delega somente o domínio puro do Diário", () => {
  for (const helper of [
    "normalizarAvaliacaoDiarioListas",
    "obterProximaNotaAvaliacaoListas",
    "calcularProximaAvaliacaoDiarioListas",
    "obterPreenchimentoEstrelaListas",
    "criarInteracaoAnotacaoListasVazia",
  ]) {
    assert.match(page, new RegExp(`import[\\s\\S]*?\\b${helper}\\b`));
    assert.doesNotMatch(page, new RegExp(`function ${helper}\\(`));
  }
  for (const helper of [
    "salvarAnotacaoLocalListas",
    "removerAnotacaoLocalListas",
  ]) {
    assert.match(annotationActions, new RegExp(`import[\\s\\S]*?\\b${helper}\\b`));
    assert.doesNotMatch(page, new RegExp(`function ${helper}\\(`));
  }
  assert.match(
    commentsPanel,
    /import \{[\s\S]*?ordenarComentariosRaizDiarioListas,[\s\S]*?\} from "\.\.\/lib\/listas-diary-comment-utils";/,
  );
  assert.match(commentsPanel, /ordenarComentariosRaizDiarioListas\(/);
  assert.match(commentsPanel, /obterRespostasComentarioDiarioListas\(/);
  assert.doesNotMatch(page, /\bordenarComentariosRaizDiarioListas\b/);
  assert.doesNotMatch(page, /\bobterRespostasComentarioDiarioListas\b/);

  for (const helper of [
    "dataRegistro",
    "montarMapaAnotacoesPorObraListas",
    "aplicarAnotacoesAosItensListas",
  ]) {
    assert.match(profileState, new RegExp(`import[\\s\\S]*?\\b${helper}\\b`));
  }
  assert.doesNotMatch(page, /function dataRegistro\(/);
  assert.match(annotations, /export function criarChaveStorageAnotacoesListas\(/);
  assert.match(
    profileLoader,
    /import \{[\s\S]*?carregarAnotacoesLocaisListas,[\s\S]*?\} from "\.\/listas-diary-annotation-utils";/,
  );

  for (const source of [annotations, ratings, comments]) {
    assert.doesNotMatch(source, /supabase|\.from\(|\.rpc\(/);
  }
  assert.doesNotMatch(profileState, /supabase|\.rpc\(/);
});

test("anotações locais preservam chave por usuário, vazio, corrupção, substituição e remoção", () => {
  const values = new Map();
  const originalWindow = globalThis.window;
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  };

  assert.equal(
    annotationUtils.criarChaveStorageAnotacoesListas(" Usuario-A "),
    "historietas-diario-anotacoes:usuario-a",
  );
  assert.deepEqual(annotationUtils.carregarAnotacoesLocaisListas("usuario-a"), []);
  values.set("historietas-diario-anotacoes:usuario-a", "{");
  assert.deepEqual(annotationUtils.carregarAnotacoesLocaisListas("usuario-a"), []);

  annotationUtils.salvarAnotacaoLocalListas("usuario-a", { obra_id: "obra-1", texto: "antiga" });
  annotationUtils.salvarAnotacaoLocalListas("usuario-a", { obra_id: "obra-1", texto: "nova" });
  annotationUtils.salvarAnotacaoLocalListas("usuario-b", { obra_id: "obra-1", texto: "outra conta" });
  assert.deepEqual(annotationUtils.carregarAnotacoesLocaisListas("usuario-a"), [{ obra_id: "obra-1", texto: "nova" }]);
  assert.deepEqual(annotationUtils.carregarAnotacoesLocaisListas("usuario-b"), [{ obra_id: "obra-1", texto: "outra conta" }]);

  annotationUtils.removerAnotacaoLocalListas("usuario-a", " obra-1 ");
  assert.deepEqual(annotationUtils.carregarAnotacoesLocaisListas("usuario-a"), []);
  globalThis.window = originalWindow;
});

test("anotações selecionam a mais recente e são aplicadas aos itens", () => {
  const annotationsByWork = annotationUtils.montarMapaAnotacoesPorObraListas([
    { id: "antiga", obra_id: "Obra-1", tipo: "lendo", texto: "antiga", atualizado_em: "2024-01-01" },
    { id: "nova", obra_id: "Obra-1", tipo: "review", texto: "nova", atualizado_em: "2024-02-01", visibilidade: "parcial", contem_spoiler: true },
    { obra_id: "obra-2", tipo: "review", texto: "" },
  ]);
  const result = annotationUtils.aplicarAnotacoesAosItensListas(
    [{ obra: { id: "obra-1" }, anotacao: "original" }, { obra: { id: "obra-2" } }],
    annotationsByWork,
  );

  assert.equal(result[0].anotacaoId, "nova");
  assert.equal(result[0].anotacao, "nova");
  assert.equal(result[0].anotacaoTipo, "review");
  assert.equal(result[0].anotacaoVisibilidade, "parcial");
  assert.equal(result[0].anotacaoSpoiler, true);
  assert.deepEqual(result[1], { obra: { id: "obra-2" } });
});

test("avaliação do Diário preserva normalização, meia estrela e cálculo otimista", () => {
  const empty = ratingUtils.AVALIACAO_DIARIO_LISTAS_VAZIA;
  assert.deepEqual(ratingUtils.normalizarAvaliacaoDiarioListas({}), empty);
  assert.equal(ratingUtils.normalizarAvaliacaoDiarioListas({ minha_nota: 0.6 }).minhaNota, 0.5);
  assert.equal(ratingUtils.normalizarAvaliacaoDiarioListas({ minha_nota: 9, media: -2, total: -1 }).minhaNota, 5);
  assert.equal(ratingUtils.obterProximaNotaAvaliacaoListas(1, 0), 0.5);
  assert.equal(ratingUtils.obterProximaNotaAvaliacaoListas(1, 0.5), 1);
  assert.equal(ratingUtils.obterProximaNotaAvaliacaoListas(1, 1), 0);
  assert.deepEqual(
    ratingUtils.calcularProximaAvaliacaoDiarioListas(empty, 0.5),
    { ...empty, media: 0.5, total: 1, minhaNota: 0.5, salvando: true },
  );
  const changed = ratingUtils.calcularProximaAvaliacaoDiarioListas(
    { ...empty, media: 4, total: 2, minhaNota: 3 },
    5,
  );
  assert.equal(changed.media, 5);
  assert.equal(changed.total, 2);
  assert.equal(changed.minhaNota, 5);
  assert.deepEqual(
    ratingUtils.calcularProximaAvaliacaoDiarioListas({ ...empty, media: 4, total: 1, minhaNota: 4 }, 0),
    { ...empty, media: 0, total: 0, minhaNota: 0, salvando: true },
  );
  assert.equal(ratingUtils.obterPreenchimentoEstrelaListas(1, 0), "0%");
  assert.equal(ratingUtils.obterPreenchimentoEstrelaListas(1, 0.5), "50%");
  assert.equal(ratingUtils.obterPreenchimentoEstrelaListas(1, 1), "100%");
});

test("comentários preservam estado inicial, relevância, recentes e respostas cronológicas", () => {
  const empty = commentUtils.criarInteracaoAnotacaoListasVazia(true);
  assert.equal(empty.carregando, true);
  assert.equal(empty.ordenacaoComentarios, "relevantes");
  assert.deepEqual(empty.comentarios, []);

  const comments = [
    { id: "raiz-antiga", parentId: "", criadoEm: "2024-01-01", curtidas: ["a"] },
    { id: "raiz-relevante", parentId: "", criadoEm: "2024-01-02", curtidas: ["a", "b"] },
    { id: "raiz-recente", parentId: "", criadoEm: "2024-01-03", curtidas: [] },
    { id: "resposta-2", parentId: "raiz-relevante", criadoEm: "2024-01-04", curtidas: [] },
    { id: "resposta-1", parentId: "raiz-relevante", criadoEm: "2024-01-01", curtidas: [] },
  ].map((comment) => ({
    ...comment,
    anotacaoId: "anotacao",
    userId: "usuario",
    autorNome: "Leitor",
    autorUsername: "leitor",
    autorAvatar: "",
    texto: comment.id,
    atualizadoEm: comment.criadoEm,
  }));

  assert.deepEqual(
    commentUtils.ordenarComentariosRaizDiarioListas(comments, "recentes").map((comment) => comment.id),
    ["raiz-recente", "raiz-relevante", "raiz-antiga"],
  );
  assert.deepEqual(
    commentUtils.ordenarComentariosRaizDiarioListas(comments, "relevantes").map((comment) => comment.id),
    ["raiz-relevante", "raiz-antiga", "raiz-recente"],
  );
  assert.deepEqual(
    commentUtils.obterRespostasComentarioDiarioListas(comments, "raiz-relevante").map((comment) => comment.id),
    ["resposta-1", "resposta-2"],
  );
});
