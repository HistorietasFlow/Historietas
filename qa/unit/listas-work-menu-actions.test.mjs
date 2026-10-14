import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const page = readFileSync(new URL("../../app/listas/page.tsx", import.meta.url), "utf8");
const persistenceSource = readFileSync(
  new URL("../../app/listas/lib/listas-want-to-read-persistence.ts", import.meta.url),
  "utf8",
);
const shareSource = readFileSync(
  new URL("../../app/listas/lib/listas-work-menu-share-utils.ts", import.meta.url),
  "utf8",
);
const hookSource = readFileSync(
  new URL("../../app/listas/hooks/use-listas-work-menu-actions.ts", import.meta.url),
  "utf8",
);

function importarModulo(source) {
  const javascript = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
  return import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${Math.random()}`,
  );
}

function criarSupabasePersistencia(respostas = {}) {
  const chamadas = [];
  const deletes = [...(respostas.deletes || [])];
  const inserts = [...(respostas.inserts || [])];
  const proxima = (fila) => fila.shift() || { error: null };
  const supabase = {
    from(tabela) {
      const filtros = [];
      const query = {
        eq(campo, valor) {
          filtros.push([campo, valor]);
          return query;
        },
        then(resolve, reject) {
          return Promise.resolve(proxima(deletes)).then(resolve, reject);
        },
      };
      return {
        delete() {
          chamadas.push({ tipo: "delete", tabela, filtros });
          return query;
        },
        insert(payload) {
          chamadas.push({ tipo: "insert", tabela, payload });
          return Promise.resolve(proxima(inserts));
        },
      };
    },
  };
  return { chamadas, supabase };
}

async function importarPersistencia(supabase) {
  globalThis.__listasWantToReadSupabase = supabase;
  return importarModulo(
    persistenceSource.replace(
      'import { supabase } from "../../../lib/supabase/client";',
      "const supabase = globalThis.__listasWantToReadSupabase;",
    ),
  );
}

async function importarAcoesMenu() {
  return importarModulo(
    hookSource
      .replace('import { supabase } from "../../../lib/supabase/client";', "const supabase = globalThis.__listasMenuSupabase;")
      .replace('import { colecaoTemObraListas, removerObraDaColecaoListas } from "../lib/listas-local-work-utils";', "const { colecaoTemObraListas, removerObraDaColecaoListas } = globalThis.__listasMenuColecao;")
      .replace('import { criarLoginHrefListas, carregarListaIdsListas, salvarListaIdsListas } from "../lib/listas-storage-utils";', "const { criarLoginHrefListas, carregarListaIdsListas, salvarListaIdsListas } = globalThis.__listasMenuStorage;")
      .replace('import { copiarTextoComFallback } from "../lib/listas-work-menu-share-utils";', "const copiarTextoComFallback = globalThis.__listasMenuCopiar;")
      .replace('import { sincronizarQueroLerListas } from "../lib/listas-want-to-read-persistence";', "const sincronizarQueroLerListas = globalThis.__listasMenuSincronizar;"),
  );
}

function criarSupabaseMenu({ userId = "", remoto = { data: [], error: null } } = {}) {
  const chamadas = [];
  const query = {
    eq(campo, valor) {
      chamadas.push(["eq", campo, valor]);
      return query;
    },
    limit(valor) {
      chamadas.push(["limit", valor]);
      return Promise.resolve(remoto);
    },
  };
  return {
    chamadas,
    supabase: {
      auth: { getUser: async () => ({ data: { user: userId ? { id: userId } : null } }) },
      from(tabela) {
        chamadas.push(["from", tabela]);
        return {
          select(campos) {
            chamadas.push(["select", campos]);
            return query;
          },
        };
      },
    },
  };
}

function prepararAcoesMenu({
  obraMenuAberta = null,
  obraMenuNoQueroLer = false,
  salvandoQueroLer = false,
  usuarioAtualId = "",
  remoto,
  lista = [],
} = {}) {
  const chamadas = [];
  const salvos = [];
  const syncs = [];
  const router = { push: (href) => chamadas.push(["push", href]) };
  const { supabase, chamadas: chamadasSupabase } = criarSupabaseMenu({
    userId: usuarioAtualId,
    remoto,
  });
  globalThis.__listasMenuSupabase = supabase;
  globalThis.__listasMenuColecao = {
    colecaoTemObraListas: (colecao, obra) => colecao.includes(obra.id),
    removerObraDaColecaoListas: (colecao, obra) => colecao.filter((id) => id !== obra.id),
  };
  globalThis.__listasMenuStorage = {
    criarLoginHrefListas: () => "/login?redirectTo=%2Flistas",
    carregarListaIdsListas: () => [...lista],
    salvarListaIdsListas: (...args) => salvos.push(args),
  };
  globalThis.__listasMenuCopiar = () => true;
  globalThis.__listasMenuSincronizar = async (...args) => syncs.push(args);

  return {
    chamadas,
    chamadasSupabase,
    editorVazio: { salvando: false },
    props: {
      editorAnotacao: { salvando: false },
      editorAnotacaoVazio: { salvando: false },
      obraMenuAberta,
      obraMenuNoQueroLer,
      router,
      salvandoQueroLer,
      setCategoriaMenuAberta: (valor) => chamadas.push(["categoria", valor]),
      setEditorAnotacao: (valor) => chamadas.push(["editor", valor]),
      setItemPerfilMenuAberto: (valor) => chamadas.push(["item", valor]),
      setObraMenuAberta: (valor) => chamadas.push(["obra", valor]),
      setObraMenuNoQueroLer: (valor) => chamadas.push(["quero", valor]),
      setSalvandoQueroLer: (valor) => chamadas.push(["salvando", valor]),
      storageKey: "historietas-obras-seguidas",
      usuarioAtualId,
    },
    salvos,
    syncs,
  };
}

test("persistência de Quero ler preserva delete, insert público e fallback sem visibilidade", async () => {
  const principal = criarSupabasePersistencia({
    inserts: [{ error: null }],
  });
  const { sincronizarQueroLerListas } = await importarPersistencia(principal.supabase);

  await sincronizarQueroLerListas("usuario-a", "obra-a", true);

  assert.deepEqual(principal.chamadas, [
    {
      tipo: "delete",
      tabela: "seguindo_obras",
      filtros: [
        ["user_id", "usuario-a"],
        ["obra_id", "obra-a"],
      ],
    },
    {
      tipo: "insert",
      tabela: "seguindo_obras",
      payload: {
        user_id: "usuario-a",
        obra_id: "obra-a",
        visibilidade: "publico",
      },
    },
  ]);

  const fallback = criarSupabasePersistencia({
    inserts: [{ error: new Error("coluna ausente") }, { error: null }],
  });
  const moduloFallback = await importarPersistencia(fallback.supabase);
  await moduloFallback.sincronizarQueroLerListas("usuario-b", "obra-b", true);
  assert.deepEqual(fallback.chamadas.slice(1), [
    {
      tipo: "insert",
      tabela: "seguindo_obras",
      payload: { user_id: "usuario-b", obra_id: "obra-b", visibilidade: "publico" },
    },
    {
      tipo: "insert",
      tabela: "seguindo_obras",
      payload: { user_id: "usuario-b", obra_id: "obra-b" },
    },
  ]);
});

test("persistência de Quero ler ignora IDs vazios e desativa somente com delete", async () => {
  const mock = criarSupabasePersistencia();
  const { sincronizarQueroLerListas } = await importarPersistencia(mock.supabase);

  await sincronizarQueroLerListas(" ", "obra", true);
  await sincronizarQueroLerListas("usuario", " ", true);
  assert.deepEqual(mock.chamadas, []);

  await sincronizarQueroLerListas("usuario", "obra", false);
  assert.equal(mock.chamadas.length, 1);
  assert.equal(mock.chamadas[0].tipo, "delete");
});

test("fallback de cópia preserva textarea temporário e sua limpeza", async () => {
  const { copiarTextoComFallback } = await importarModulo(shareSource);
  const anteriorDocumento = globalThis.document;
  const chamadas = [];
  const campo = {
    style: {},
    setAttribute: (...args) => chamadas.push(["atributo", ...args]),
    select: () => chamadas.push(["select"]),
  };
  globalThis.document = {
    createElement: (tag) => {
      chamadas.push(["criar", tag]);
      return campo;
    },
    body: {
      appendChild: (elemento) => chamadas.push(["adicionar", elemento]),
      removeChild: (elemento) => chamadas.push(["remover", elemento]),
    },
    execCommand: (comando) => {
      chamadas.push(["executar", comando]);
      return true;
    },
  };

  try {
    assert.equal(copiarTextoComFallback("link"), true);
    assert.equal(campo.value, "link");
    assert.equal(campo.style.position, "fixed");
    assert.equal(campo.style.left, "-9999px");
    assert.deepEqual(chamadas.map(([tipo]) => tipo), [
      "criar",
      "atributo",
      "adicionar",
      "select",
      "executar",
      "remover",
    ]);
  } finally {
    globalThis.document = anteriorDocumento;
  }
});

test("menu espelha Quero ler remoto no storage e mantém a ordem inicial dos setters", async () => {
  const obra = { id: "obra-1", slug: "obra-1", titulo: "Obra", autor: "Autora", link: "/obra/obra-1" };
  const preparo = prepararAcoesMenu({
    usuarioAtualId: "usuario-1",
    remoto: { data: [{ obra_id: "obra-1" }], error: null },
  });
  const { useListasWorkMenuActions } = await importarAcoesMenu();
  const acoes = useListasWorkMenuActions(preparo.props);

  await acoes.abrirMenuObra(obra, { chave: "item" }, "favoritas");

  assert.deepEqual(preparo.chamadas.slice(0, 6), [
    ["obra", obra],
    ["item", { chave: "item" }],
    ["categoria", "favoritas"],
    ["quero", false],
    ["editor", preparo.editorVazio],
    ["quero", false],
  ]);
  assert.deepEqual(preparo.salvos, [[
    "historietas-obras-seguidas",
    "usuario-1",
    ["obra-1"],
  ]]);
  assert.deepEqual(preparo.chamadasSupabase, [
    ["from", "seguindo_obras"],
    ["select", "obra_id"],
    ["eq", "user_id", "usuario-1"],
    ["eq", "obra_id", "obra-1"],
    ["limit", 1],
  ]);
});

test("menu persiste localmente antes da sincronização, redireciona login e sempre restaura salvando", async () => {
  const obra = { id: "obra-2", slug: "obra-2", titulo: "Obra", autor: "Autora", link: "/obra/obra-2" };
  const preparo = prepararAcoesMenu({ obraMenuAberta: obra, usuarioAtualId: "usuario-2" });
  const { useListasWorkMenuActions } = await importarAcoesMenu();
  const acoes = useListasWorkMenuActions(preparo.props);

  await acoes.alternarObraNoQueroLer();
  assert.deepEqual(preparo.salvos, [[
    "historietas-obras-seguidas",
    "usuario-2",
    ["obra-2"],
  ]]);
  assert.deepEqual(preparo.syncs, [["usuario-2", "obra-2", true]]);
  assert.deepEqual(preparo.chamadas.filter(([tipo]) => tipo === "salvando"), [
    ["salvando", true],
    ["salvando", false],
  ]);

  const visitante = prepararAcoesMenu({ obraMenuAberta: obra });
  const { useListasWorkMenuActions: useListasWorkMenuActionsVisitante } = await importarAcoesMenu();
  const acoesVisitante = useListasWorkMenuActionsVisitante(visitante.props);
  await acoesVisitante.alternarObraNoQueroLer();
  assert.deepEqual(visitante.chamadas.slice(-3), [
    ["obra", null],
    ["push", "/login?redirectTo=%2Flistas"],
    ["salvando", false],
  ]);
});

test("menu preserva bloqueio de fechamento e compartilhamento nativo, cancelado e por Clipboard", async () => {
  const obra = { id: "obra-3", slug: "obra-3", titulo: "Obra", autor: "Autora", link: "/obra/obra-3" };
  const bloqueado = prepararAcoesMenu({ obraMenuAberta: obra, salvandoQueroLer: true });
  const { useListasWorkMenuActions: useListasBloqueado } = await importarAcoesMenu();
  useListasBloqueado(bloqueado.props).fecharMenuObra();
  assert.deepEqual(bloqueado.chamadas, []);

  const janelaAnterior = Object.getOwnPropertyDescriptor(globalThis, "window");
  const navegadorAnterior = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const compartilhamentos = [];
  const nativo = prepararAcoesMenu({ obraMenuAberta: obra });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location: { origin: "https://historietas.app" }, isSecureContext: true },
  });
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { share: async (dados) => compartilhamentos.push(dados) },
  });
  try {
    const { useListasWorkMenuActions: useListasNativo } = await importarAcoesMenu();
    await useListasNativo(nativo.props).compartilharObraDoMenu();
    assert.deepEqual(compartilhamentos, [{
      title: "Obra no HISTORIETAS",
      text: "Confira Obra de Autora no HISTORIETAS.",
      url: "https://historietas.app/obra/obra-3",
    }]);
    assert.deepEqual(nativo.chamadas.slice(-4), [
      ["obra", null],
      ["item", null],
      ["quero", false],
      ["editor", nativo.editorVazio],
    ]);

    const cancelado = prepararAcoesMenu({ obraMenuAberta: obra });
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        share: async () => {
          throw new DOMException("cancelado", "AbortError");
        },
      },
    });
    const { useListasWorkMenuActions: useListasCancelado } = await importarAcoesMenu();
    await useListasCancelado(cancelado.props).compartilharObraDoMenu();
    assert.deepEqual(cancelado.chamadas, []);

    const textosCopiados = [];
    const clipboard = prepararAcoesMenu({ obraMenuAberta: obra });
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { clipboard: { writeText: async (texto) => textosCopiados.push(texto) } },
    });
    const { useListasWorkMenuActions: useListasClipboard } = await importarAcoesMenu();
    await useListasClipboard(clipboard.props).compartilharObraDoMenu();
    assert.deepEqual(textosCopiados, ["https://historietas.app/obra/obra-3"]);
    assert.deepEqual(clipboard.chamadas.slice(-4), [
      ["obra", null],
      ["item", null],
      ["quero", false],
      ["editor", clipboard.editorVazio],
    ]);
  } finally {
    if (janelaAnterior) {
      Object.defineProperty(globalThis, "window", janelaAnterior);
    } else {
      delete globalThis.window;
    }
    if (navegadorAnterior) {
      Object.defineProperty(globalThis, "navigator", navegadorAnterior);
    } else {
      delete globalThis.navigator;
    }
  }
});

test("Listas delega as ações do menu sem reintroduzir mutações ou compartilhamento na página", () => {
  assert.match(
    page,
    /import \{ useListasWorkMenuActions \} from "\.\/hooks\/use-listas-work-menu-actions";/,
  );
  assert.match(page, /useListasWorkMenuActions\(\{/);
  for (const helper of [
    "sincronizarQueroLerListas",
    "abrirMenuObra",
    "fecharMenuObra",
    "alternarObraNoQueroLer",
    "compartilharObraDoMenu",
  ]) {
    assert.doesNotMatch(page, new RegExp(`function ${helper}\\(`));
  }
  assert.doesNotMatch(page, /\.from\("seguindo_obras"\)/);
  assert.doesNotMatch(page, /function copiarTextoComFallback\(/);
  assert.match(
    persistenceSource,
    /\.from\("seguindo_obras"\)[\s\S]*?\.delete\(\)[\s\S]*?\.eq\("user_id", userId\)[\s\S]*?\.eq\("obra_id", obraId\)/,
  );
  assert.match(persistenceSource, /if \(!ativo\) \{\s*return;/);
  assert.match(persistenceSource, /visibilidade: "publico"/);
  assert.match(persistenceSource, /\.insert\(payloadBase\)/);
  assert.match(hookSource, /\.select\("obra_id"\)[\s\S]*?\.limit\(1\)/);
  assert.match(hookSource, /Array\.from\(new Set\(\[\.\.\.listaAtual, obra\.id\]\)\)/);
  assert.match(hookSource, /await sincronizarQueroLerListas\(userId, obra\.id, proximoEstado\)/);
  assert.match(hookSource, /finally \{\s*setSalvandoQueroLer\(false\);/);
  assert.match(hookSource, /new URL\(obraMenuAberta\.link, window\.location\.origin\)/);
  assert.match(hookSource, /error instanceof DOMException && error\.name === "AbortError"/);
  assert.match(hookSource, /navigator\.clipboard\.writeText\(link\)/);
  assert.doesNotMatch(hookSource, /\.upsert\(/);
});
