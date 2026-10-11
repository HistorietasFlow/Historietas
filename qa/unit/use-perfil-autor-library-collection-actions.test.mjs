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
    libraryFollowKey: "library-follow",
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
      .replace(
        'import type { AbaBibliotecaPerfil, ItemBibliotecaPerfil, ObraLocal } from "../types";\n',
        "",
      )
      .replace(
        /import \{[\s\S]*?\} from "\.\.\/constants";/,
        "const COMPLETED_STORAGE_KEY = globalThis.__profileLibraryCollectionDependencies.completedKey;\nconst FAVORITES_STORAGE_KEY = globalThis.__profileLibraryCollectionDependencies.favoritesKey;\nconst LIBRARY_FOLLOW_STORAGE_KEY = globalThis.__profileLibraryCollectionDependencies.libraryFollowKey;",
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
    abaBibliotecaPerfil = "tudo",
    obrasFavoritas = [],
    obrasConcluidas = [],
    obrasSeguidasBiblioteca = [],
    obras = [{
      id: "obra-1",
      capitulos: [{ id: "cap-1", salvo: false }],
    }],
  } = {},
) {
  const mensagens = [];
  const avisos = [];
  const favoritos = [];
  const concluidas = [];
  const seguidas = [];
  const obrasSalvas = [];
  const historicosRemovidos = [];
  const versoes = [];

  return {
    ...modulo.usePerfilAutorLibraryCollectionActions({
      abaBibliotecaPerfil,
      obras,
      obrasFavoritas,
      obrasConcluidas,
      obrasSeguidasBiblioteca,
      usuarioIdLogado: "usuario-1",
      avisarLoginNecessario(mensagem) {
        avisos.push(mensagem);
      },
      async removerHistoricoLeituraBibliotecaPerfil(obra) {
        historicosRemovidos.push(obra.id);
      },
      salvarObrasBibliotecaPerfil(lista) {
        obrasSalvas.push(lista);
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
      setObrasSeguidasBiblioteca(lista) {
        seguidas.push(lista);
      },
      setVersaoSincronizacaoBiblioteca(atualizar) {
        versoes.push(atualizar(7));
      },
    }),
    mensagens,
    avisos,
    favoritos,
    concluidas,
    seguidas,
    obrasSalvas,
    historicosRemovidos,
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

test("alterna capítulo salvo preservando estado, sync privado e mensagem", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo);

  await acoes.alternarSalvoCapituloBibliotecaPerfil("obra-1", "cap-1");

  assert.equal(acoes.obrasSalvas.length, 1);
  assert.equal(acoes.obrasSalvas[0][0].capitulos[0].salvo, true);
  assert.deepEqual(
    modulo.chamadas.filter((chamada) => chamada[0] === "sync"),
    [["sync", "salvos_capitulos", "cap-1", true, "privado"]],
  );
  assert.deepEqual(acoes.mensagens, [
    "",
    "Capítulo salvo na Biblioteca.",
  ]);
});

test("respeita estado explícito ao remover capítulo dos salvos", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo, {
    obras: [{
      id: "obra-1",
      capitulos: [{ id: "cap-1", salvo: true }],
    }],
  });

  await acoes.alternarSalvoCapituloBibliotecaPerfil(
    "obra-1",
    "cap-1",
    false,
  );

  assert.equal(acoes.obrasSalvas[0][0].capitulos[0].salvo, false);
  assert.deepEqual(acoes.mensagens.at(-1), "Capítulo removido dos salvos.");
});

test("alterna Quero ler persistindo e sincronizando como público", async () => {
  const modulo = await carregarModulo();
  const obra = {
    id: "obra-1",
    capitulos: [],
  };
  const acoes = criarAcoes(modulo, { obras: [obra] });

  await acoes.alternarObraSeguindoBibliotecaPerfil(obra);

  assert.deepEqual(acoes.seguidas, [["obra-1"]]);
  assert.deepEqual(acoes.versoes, [8]);
  assert.deepEqual(
    modulo.chamadas.filter((chamada) =>
      ["salvar", "sync"].includes(chamada[0]),
    ),
    [
      ["salvar", "library-follow", "usuario-1", ["obra-1"]],
      ["sync", "seguindo_obras", "obra-1", true, "publico"],
    ],
  );
  assert.deepEqual(acoes.mensagens.at(-1), "Obra adicionada ao Quero ler.");
});

test("remove obra do Quero ler quando já segue", async () => {
  const modulo = await carregarModulo();
  const obra = { id: "obra-1", capitulos: [] };
  const acoes = criarAcoes(modulo, {
    obras: [obra],
    obrasSeguidasBiblioteca: ["obra-1"],
  });

  await acoes.alternarObraSeguindoBibliotecaPerfil(obra);

  assert.deepEqual(acoes.seguidas, [[]]);
  assert.deepEqual(
    modulo.chamadas.filter((chamada) => chamada[0] === "sync"),
    [["sync", "seguindo_obras", "obra-1", false, "publico"]],
  );
  assert.deepEqual(acoes.mensagens.at(-1), "Obra removida do Quero ler.");
});

test("remove item salvo priorizando capítulo salvo na aba tudo", async () => {
  const modulo = await carregarModulo();
  const item = {
    obra: { id: "obra-1", capitulos: [{ id: "cap-1", salvo: true }] },
    capitulo: { id: "cap-1", salvo: true },
    tipoDiario: "salvo",
  };
  const acoes = criarAcoes(modulo, {
    obras: [item.obra],
  });

  await acoes.removerItemBibliotecaPerfil(item);

  assert.equal(acoes.obrasSalvas.length, 1);
  assert.equal(acoes.obrasSalvas[0][0].capitulos[0].salvo, false);
  assert.deepEqual(acoes.historicosRemovidos, []);
});

test("remove Quero ler pela ação existente na aba tudo", async () => {
  const modulo = await carregarModulo();
  const obra = { id: "obra-1", capitulos: [] };
  const item = {
    obra,
    capitulo: null,
    tipoDiario: "quero_ler",
  };
  const acoes = criarAcoes(modulo, {
    obras: [obra],
    obrasSeguidasBiblioteca: ["obra-1"],
  });

  await acoes.removerItemBibliotecaPerfil(item);

  assert.deepEqual(acoes.seguidas, [[]]);
  assert.deepEqual(acoes.historicosRemovidos, []);
});

test("remove favorita e concluída conforme a aba atual", async () => {
  const moduloFavorita = await carregarModulo();
  const obra = { id: "obra-1", capitulos: [] };
  const favorita = criarAcoes(moduloFavorita, {
    abaBibliotecaPerfil: "favoritas",
    obras: [obra],
    obrasFavoritas: ["obra-1"],
  });

  await favorita.removerItemBibliotecaPerfil({
    obra,
    capitulo: null,
    tipoDiario: "favorita",
  });
  assert.deepEqual(favorita.favoritos, [[]]);

  const moduloConcluida = await carregarModulo();
  const concluida = criarAcoes(moduloConcluida, {
    abaBibliotecaPerfil: "concluidas",
    obras: [obra],
    obrasConcluidas: ["obra-1"],
  });

  await concluida.removerItemBibliotecaPerfil({
    obra,
    capitulo: null,
    tipoDiario: "concluida",
  });
  assert.deepEqual(concluida.concluidas, [[]]);
});

test("delega ao histórico quando nenhuma coleção específica se aplica", async () => {
  const modulo = await carregarModulo();
  const obra = { id: "obra-1", capitulos: [] };
  const acoes = criarAcoes(modulo, {
    abaBibliotecaPerfil: "historico",
    obras: [obra],
  });

  await acoes.removerItemBibliotecaPerfil({
    obra,
    capitulo: null,
    tipoDiario: "leu_capitulo",
  });

  assert.deepEqual(acoes.historicosRemovidos, ["obra-1"]);
});

test("Perfil de Autor delega coleções da Biblioteca para o hook", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorLibraryCollectionActions \} from "\.\/hooks\/use-perfil-autor-library-collection-actions";/,
  );
  assert.match(
    pagina,
    /const \{[\s\S]*?alternarFavoritoObra,[\s\S]*?alternarConcluidoObra,[\s\S]*?alternarSalvoCapituloBibliotecaPerfil,[\s\S]*?alternarObraSeguindoBibliotecaPerfil,[\s\S]*?removerItemBibliotecaPerfil,[\s\S]*?\} = usePerfilAutorLibraryCollectionActions\(\{/,
  );
  assert.doesNotMatch(pagina, /async function alternarFavoritoObra\(/);
  assert.doesNotMatch(pagina, /async function alternarConcluidoObra\(/);
  assert.doesNotMatch(
    pagina,
    /async function alternarSalvoCapituloBibliotecaPerfil\(/,
  );
  assert.doesNotMatch(
    pagina,
    /async function alternarObraSeguindoBibliotecaPerfil\(/,
  );
  assert.doesNotMatch(
    pagina,
    /async function removerItemBibliotecaPerfil\(/,
  );
  assert.match(source, /await usuarioEstaLogado\(\)/);
  assert.match(source, /await sincronizarTabelaUsuario\(/);
  assert.match(source, /setVersaoSincronizacaoBiblioteca/);
  assert.doesNotMatch(source, /useEffect/);
});
