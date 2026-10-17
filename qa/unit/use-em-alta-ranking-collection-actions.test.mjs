import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const hook = readFileSync(
  new URL(
    "../../app/em-alta/hooks/use-em-alta-ranking-collection-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo() {
  const chamadas = [];
  globalThis.__emAltaRankingCollectionActions = {
    adicionar(obra, lista) {
      chamadas.push(["adicionar", obra.storageId, lista.slice()]);
      return [...lista, obra.storageId];
    },
    listaTem(obra, lista) {
      chamadas.push(["tem", obra.storageId, lista.slice()]);
      return lista.includes(obra.storageId);
    },
    normalizar(lista) {
      chamadas.push(["normalizar", lista.slice()]);
      return Array.from(new Set(lista));
    },
    remover(obra, lista) {
      chamadas.push(["remover", obra.storageId, lista.slice()]);
      return lista.filter((id) => id !== obra.storageId && id !== obra.id);
    },
    completedKey: "completed",
    favoritesKey: "favorites",
    salvar(chave, usuarioId, lista) {
      chamadas.push(["salvar", chave, usuarioId, lista.slice()]);
    },
    sincronizar(tabela, obra, ativo) {
      chamadas.push(["sincronizar", tabela, obra, ativo]);
    },
    registrar(tipo, obra) {
      chamadas.push(["diario", tipo, obra]);
    },
  };

  const executavel = hook
    .replace('import type { ObraRanking } from "../lib/em-alta-models";\n', "")
    .replace(
      /import \{[\s\S]*?\} from "\.\.\/lib\/em-alta-ranking-list-utils";/,
      `const {
  adicionar: adicionarRankingObraNaLista,
  listaTem: listaTemRankingObra,
  normalizar: normalizarListaIdsEmAlta,
  remover: removerRankingObraDaLista,
} = globalThis.__emAltaRankingCollectionActions;`,
    )
    .replace(
      /import \{[\s\S]*?\} from "\.\.\/lib\/em-alta-local-storage-utils";/,
      `const {
  completedKey: COMPLETED_STORAGE_KEY,
  favoritesKey: FAVORITES_STORAGE_KEY,
  salvar: salvarListaIdsLocalEmAlta,
} = globalThis.__emAltaRankingCollectionActions;`,
    )
    .replace(
      'import { sincronizarColecaoRankingSupabase } from "../lib/em-alta-collection-supabase-sync";',
      "const sincronizarColecaoRankingSupabase = globalThis.__emAltaRankingCollectionActions.sincronizar;",
    )
    .replace(
      'import { registrarColecaoRankingNoDiario } from "../lib/em-alta-diary-activity";',
      "const registrarColecaoRankingNoDiario = globalThis.__emAltaRankingCollectionActions.registrar;",
    );
  const javascript = typescript.transpileModule(executavel, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
  const modulo = await import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${indiceModulo++}`,
  );

  return { ...modulo, chamadas };
}

function criarAcoes(
  modulo,
  {
    logado = true,
    obrasFavoritas = [],
    obrasConcluidas = [],
    ranking = [{ id: "obra-1", storageId: "storage-1", titulo: "Obra" }],
  } = {},
) {
  const favoritos = [];
  const concluidas = [];
  const avisos = [];
  const acoes = modulo.useEmAltaRankingCollectionActions({
    ranking,
    obrasFavoritas,
    obrasConcluidas,
    usuarioLogadoId: "usuario-1",
    async usuarioTemSessaoAtiva() {
      modulo.chamadas.push(["sessao"]);
      return logado;
    },
    avisarLoginRanking() {
      avisos.push("login");
    },
    setObrasFavoritas(lista) {
      favoritos.push(lista);
    },
    setObrasConcluidas(lista) {
      concluidas.push(lista);
    },
  });

  return { ...acoes, avisos, favoritos, concluidas };
}

test("exige sessão antes de alterar qualquer coleção", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo, { logado: false });

  await acoes.alternarFavorito("obra-1");
  await acoes.alternarConcluido("obra-1");

  assert.deepEqual(acoes.avisos, ["login", "login"]);
  assert.deepEqual(acoes.favoritos, []);
  assert.deepEqual(acoes.concluidas, []);
  assert.deepEqual(modulo.chamadas, [["sessao"], ["sessao"]]);
});

test("favorito preserva atualização local, sincronização e Diário somente na inclusão", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo);

  await acoes.alternarFavorito("obra-1");

  assert.deepEqual(acoes.favoritos, [["storage-1"]]);
  assert.deepEqual(modulo.chamadas.slice(-3), [
    ["salvar", "favorites", "usuario-1", ["storage-1"]],
    ["sincronizar", "favoritos", { id: "obra-1", storageId: "storage-1", titulo: "Obra" }, true],
    ["diario", "favoritou_obra", { id: "obra-1", storageId: "storage-1", titulo: "Obra" }],
  ]);

  const moduloRemocao = await carregarModulo();
  const remocao = criarAcoes(moduloRemocao, {
    obrasFavoritas: ["storage-1"],
  });
  await remocao.alternarFavorito("obra-1");
  assert.deepEqual(remocao.favoritos, [[]]);
  assert.equal(
    moduloRemocao.chamadas.some((chamada) => chamada[0] === "diario"),
    false,
  );
});

test("conclusão preserva fallback sem obra de ranking e atividade de inclusão", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo, { ranking: [] });

  await acoes.alternarConcluido("obra-avulsa");

  assert.deepEqual(acoes.concluidas, [["obra-avulsa"]]);
  assert.deepEqual(modulo.chamadas.slice(-4), [
    ["normalizar", ["obra-avulsa"]],
    ["salvar", "completed", "usuario-1", ["obra-avulsa"]],
    ["sincronizar", "concluidas", null, true],
    ["diario", "concluiu_obra", null],
  ]);
});

test("a página delega as duas ações e o hook preserva suas fronteiras", () => {
  assert.match(hook, /export function useEmAltaRankingCollectionActions\b/);
  assert.match(hook, /async function alternarFavorito\(obraId: string\)/);
  assert.match(hook, /async function alternarConcluido\(obraId: string\)/);
  assert.match(hook, /return \{ alternarFavorito, alternarConcluido \};/);
  assert.match(hook, /void sincronizarColecaoRankingSupabase\(/);
  assert.match(hook, /void registrarColecaoRankingNoDiario\("favoritou_obra", obraRanking\)/);
  assert.match(hook, /void registrarColecaoRankingNoDiario\("concluiu_obra", obraRanking\)/);
  assert.doesNotMatch(hook, /lib\/supabase\/client/);
  assert.doesNotMatch(hook, /localStorage/);
  assert.doesNotMatch(hook, /<[A-Z][\w.]*\s+[\w-]+=/);

  assert.match(
    pagina,
    /import \{ useEmAltaRankingCollectionActions \} from "\.\/hooks\/use-em-alta-ranking-collection-actions";/,
  );
  assert.match(
    pagina,
    /const \{ alternarFavorito, alternarConcluido \} =\s*useEmAltaRankingCollectionActions\(/,
  );
  assert.doesNotMatch(pagina, /async function alternarFavorito\(obraId: string\)/);
  assert.doesNotMatch(pagina, /async function alternarConcluido\(obraId: string\)/);
  assert.match(pagina, /async function carregarRanking\(\)/);
  assert.match(pagina, /function avisarLoginRanking\(\)/);
});
