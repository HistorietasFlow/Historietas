import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-library-collection-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo({ logado = true } = {}) {
  const chamadas = [];
  globalThis.__profileLibraryCollectionDependencies = {
    completedKey: "completed",
    favoritesKey: "favorites",
    colecaoTemObra(lista, obra) {
      chamadas.push(["tem", lista.slice(), obra.id]);
      return lista.includes(obra.id);
    },
    removerObra(lista, obra) {
      chamadas.push(["remover", lista.slice(), obra.id]);
      return lista.filter((id) => id !== obra.id);
    },
    async usuarioEstaLogado() {
      chamadas.push(["logado"]);
      return logado;
    },
    salvarLista(chave, userId, lista) {
      chamadas.push(["salvar", chave, userId, lista.slice()]);
    },
    async sincronizar(tabela, id, ativo, visibilidade) {
      chamadas.push(["sync", tabela, id, ativo, visibilidade]);
    },
  };

  const javascript = typescript.transpileModule(
    source
      .replace('import type { ObraLocal } from "../types";\n', "")
      .replace(
        /import \{[\s\S]*?\} from "\.\.\/constants";/,
        "const COMPLETED_STORAGE_KEY = globalThis.__profileLibraryCollectionDependencies.completedKey;\nconst FAVORITES_STORAGE_KEY = globalThis.__profileLibraryCollectionDependencies.favoritesKey;",
      )
      .replace(
        /import \{[\s\S]*?\} from "\.\.\/lib\/library-normalizers";/,
        "const colecaoTemObraPerfilBiblioteca = globalThis.__profileLibraryCollectionDependencies.colecaoTemObra;\nconst removerObraDaColecaoPerfilBiblioteca = globalThis.__profileLibraryCollectionDependencies.removerObra;",
      )
      .replace(
        'import { usuarioEstaLogado } from "../lib/profile-auth-session-utils";',
        "const usuarioEstaLogado = globalThis.__profileLibraryCollectionDependencies.usuarioEstaLogado;",
      )
      .replace(
        'import { salvarListaIdsPerfilBiblioteca } from "../lib/profile-local-storage-utils";',
        "const salvarListaIdsPerfilBiblioteca = globalThis.__profileLibraryCollectionDependencies.salvarLista;",
      )
      .replace(
        'import { sincronizarTabelaUsuario } from "../lib/profile-user-collections-sync";',
        "const sincronizarTabelaUsuario = globalThis.__profileLibraryCollectionDependencies.sincronizar;",
      ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  ).outputText;

  const modulo = await import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${indiceModulo++}`,
  );

  return { ...modulo, chamadas };
}

function criarAcoes(
  modulo,
  {
    obrasFavoritas = [],
    obrasConcluidas = [],
    obras = [{ id: "obra-1" }],
  } = {},
) {
  const mensagens = [];
  const avisos = [];
  const favoritos = [];
  const concluidas = [];
  const versoes = [];

  return {
    ...modulo.usePerfilAutorLibraryCollectionActions({
      obras,
      obrasFavoritas,
      obrasConcluidas,
      usuarioIdLogado: "usuario-1",
      avisarLoginNecessario(mensagem) {
        avisos.push(mensagem);
      },
      setMensagemAcao(mensagem) {
        mensagens.push(mensagem);
      },
      setObrasFavoritas(lista) {
        favoritos.push(lista);
      },
      setObrasConcluidas(lista) {
        concluidas.push(lista);
      },
      setVersaoSincronizacaoBiblioteca(atualizar) {
        versoes.push(atualizar(7));
      },
    }),
    mensagens,
    avisos,
    favoritos,
    concluidas,
    versoes,
  };
}

test("exige login antes de alterar favoritos", async () => {
  const modulo = await carregarModulo({ logado: false });
  const acoes = criarAcoes(modulo);

  await acoes.alternarFavoritoObra("obra-1");

  assert.deepEqual(acoes.mensagens, [""]);
  assert.deepEqual(acoes.avisos, [
    "Entre na sua conta para adicionar obras à lista.",
  ]);
  assert.deepEqual(acoes.favoritos, []);
  assert.equal(
    modulo.chamadas.some((chamada) => chamada[0] === "sync"),
    false,
  );
});

test("adiciona favorito, persiste, sincroniza e incrementa a versão", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo);

  await acoes.alternarFavoritoObra("obra-1");

  assert.deepEqual(acoes.favoritos, [["obra-1"]]);
  assert.deepEqual(acoes.versoes, [8]);
  assert.deepEqual(
    modulo.chamadas.filter((chamada) =>
      ["salvar", "sync"].includes(chamada[0]),
    ),
    [
      ["salvar", "favorites", "usuario-1", ["obra-1"]],
      ["sync", "favoritos", "obra-1", true, "parcial"],
    ],
  );
});

test("remove favorito existente usando o normalizador da coleção", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo, { obrasFavoritas: ["obra-1"] });

  await acoes.alternarFavoritoObra("obra-1");

  assert.deepEqual(acoes.favoritos, [[]]);
  assert.deepEqual(
    modulo.chamadas.filter((chamada) => chamada[0] === "sync"),
    [["sync", "favoritos", "obra-1", false, "parcial"]],
  );
});

test("alterna obra concluída preservando persistência e sincronização", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo);

  await acoes.alternarConcluidoObra("obra-1");

  assert.deepEqual(acoes.concluidas, [["obra-1"]]);
  assert.deepEqual(acoes.versoes, [8]);
  assert.deepEqual(
    modulo.chamadas.filter((chamada) =>
      ["salvar", "sync"].includes(chamada[0]),
    ),
    [
      ["salvar", "completed", "usuario-1", ["obra-1"]],
      ["sync", "concluidas", "obra-1", true, "parcial"],
    ],
  );
});

test("mantém fallback por id quando a obra não está na lista carregada", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo, {
    obras: [],
    obrasConcluidas: ["obra-x"],
  });

  await acoes.alternarConcluidoObra("obra-x");

  assert.deepEqual(acoes.concluidas, [[]]);
});

test("Perfil de Autor delega favoritos e concluídas para o hook", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorLibraryCollectionActions \} from "\.\/hooks\/use-perfil-autor-library-collection-actions";/,
  );
  assert.match(
    pagina,
    /const \{ alternarFavoritoObra, alternarConcluidoObra \} =[\s\S]*?usePerfilAutorLibraryCollectionActions\(\{/,
  );
  assert.doesNotMatch(pagina, /async function alternarFavoritoObra\(/);
  assert.doesNotMatch(pagina, /async function alternarConcluidoObra\(/);
  assert.match(source, /await usuarioEstaLogado\(\)/);
  assert.match(source, /await sincronizarTabelaUsuario\(/);
  assert.match(source, /setVersaoSincronizacaoBiblioteca/);
  assert.doesNotMatch(source, /useEffect/);
});
