import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-initial-data-loader.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(
  new URL("../../app/hooks/use-home-initial-data.ts", import.meta.url),
  "utf8",
);

const estado = {
  eventos: [],
  getUserErro: null,
  getUserChamadas: 0,
  listasLocais: {},
  listasRemotas: {},
  perfis: {},
  perfisChamadas: [],
  savesJson: [],
  savesListas: [],
  storage: {},
  storageChamadas: [],
  supabaseChamadas: [],
};
globalThis.__homeInitialDataLoaderState = estado;

const moduloExecutavel = modulo
  .replace(
    'import { supabase } from "../../lib/supabase/client";\n',
    `const supabase = {
  auth: {
    async getUser() {
      const estado = globalThis.__homeInitialDataLoaderState;
      estado.getUserChamadas += 1;
      if (estado.getUserErro) throw estado.getUserErro;
      return { data: { user: estado.usuario ?? null } };
    },
  },
};
`,
  )
  .replace(
    'import { normalizarListaIdsHome } from "./home-collection-utils";\n',
    `const normalizarListaIdsHome = (lista) => Array.from(new Set(
  lista.filter((id) => typeof id === "string").map((id) => id.trim()).filter(Boolean),
));
`,
  )
  .replace(
    'import { carregarIdsColecaoUsuarioHome } from "./home-collection-supabase-utils";\n',
    `const carregarIdsColecaoUsuarioHome = async (tabela, userId) => {
  const estado = globalThis.__homeInitialDataLoaderState;
  estado.supabaseChamadas.push([tabela, userId]);
  return estado.listasRemotas[tabela] || [];
};
`,
  )
  .replace(
    'import { carregarPerfisAutoresHomeSalvos } from "./home-author-storage-utils";\n',
    `const carregarPerfisAutoresHomeSalvos = (userId) => {
  const estado = globalThis.__homeInitialDataLoaderState;
  estado.perfisChamadas.push(userId);
  return estado.perfis[userId] || {};
};
`,
  )
  .replace(
    'import { normalizarObrasHomeSalvas } from "./home-local-work-normalizers";\n',
    `const normalizarObrasHomeSalvas = (obras) => {
  const estado = globalThis.__homeInitialDataLoaderState;
  estado.eventos.push(["normalizar", obras]);
  return Array.isArray(obras) ? obras.filter((obra) => obra && obra.publicado !== false) : [];
};
`,
  )
  .replace(
    [
      'import {',
      '  carregarListaIdsHome,',
      '  lerStorageUsuarioHome,',
      '  salvarJsonStorageUsuarioHome,',
      '  salvarListaIdsHome,',
      '} from "./home-storage-utils";',
      '',
    ].join("\n"),
    `const lerStorageUsuarioHome = (chave, userId) => {
  const estado = globalThis.__homeInitialDataLoaderState;
  estado.storageChamadas.push([chave, userId]);
  return estado.storage[\`${"${chave}"}:${"${userId}"}\`] ?? null;
};
const salvarJsonStorageUsuarioHome = (...args) => {
  globalThis.__homeInitialDataLoaderState.savesJson.push(args);
};
const carregarListaIdsHome = (chave, userId) =>
  globalThis.__homeInitialDataLoaderState.listasLocais[\`${"${chave}"}:${"${userId}"}\`] || [];
const salvarListaIdsHome = (...args) => {
  globalThis.__homeInitialDataLoaderState.savesListas.push(args);
};
`,
  );

const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { carregarSnapshotInicialHome } = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function resetarEstado() {
  Object.assign(estado, {
    eventos: [],
    getUserErro: null,
    getUserChamadas: 0,
    listasLocais: {},
    listasRemotas: {},
    perfis: {},
    perfisChamadas: [],
    savesJson: [],
    savesListas: [],
    storage: {},
    storageChamadas: [],
    supabaseChamadas: [],
    usuario: null,
  });
}

async function carregar(usuarioIdLogado, options = {}) {
  return carregarSnapshotInicialHome({
    usuarioIdLogado,
    storageKey: "obras",
    favoritesStorageKey: "favoritas",
    completedStorageKey: "concluidas",
    aoNormalizarObras: (obras) => {
      estado.eventos.push(["cache", obras]);
    },
    ...options,
  });
}

test("home-initial-data-loader usa o usuário logado limpo e preserva a ordem do cache", async () => {
  resetarEstado();
  estado.storage["obras:usuario"] = JSON.stringify([
    { id: "obra-1", publicado: true },
    { id: "obra-2", publicado: false },
  ]);
  estado.listasLocais["favoritas:usuario"] = [" local ", "local"];
  estado.listasLocais["concluidas:usuario"] = [" concluida "];
  estado.listasRemotas = {
    favoritos: ["remota", "local"],
    concluidas: ["concluida-remota"],
  };
  estado.perfis.usuario = { ana: { bio: "Bio" } };

  const resultado = await carregar(" usuario ");

  assert.equal(estado.getUserChamadas, 0);
  assert.equal(resultado.userIdHome, "usuario");
  assert.deepEqual(resultado.obrasNormalizadas, [{ id: "obra-1", publicado: true }]);
  assert.deepEqual(resultado.obrasFavoritasNormalizadas, ["local", "remota"]);
  assert.deepEqual(resultado.perfisAutoresNormalizados, { ana: { bio: "Bio" } });
  assert.deepEqual(estado.eventos.map(([evento]) => evento), ["normalizar", "cache"]);
  assert.deepEqual(estado.supabaseChamadas, [
    ["favoritos", "usuario"],
    ["concluidas", "usuario"],
  ]);
  assert.deepEqual(estado.savesJson, [
    ["obras", "usuario", [{ id: "obra-1", publicado: true }]],
  ]);
  assert.deepEqual(estado.savesListas, [
    ["favoritas", "usuario", ["local", "remota"]],
    ["concluidas", "usuario", ["concluida", "concluida-remota"]],
  ]);
  assert.deepEqual(estado.perfisChamadas, ["usuario"]);
});

test("home-initial-data-loader busca o usuário somente sem identificador e preserva fallback de erro", async () => {
  resetarEstado();
  estado.usuario = { id: "usuario-auth" };

  const comUsuarioAuth = await carregar("   ");

  assert.equal(estado.getUserChamadas, 1);
  assert.equal(comUsuarioAuth.userIdHome, "usuario-auth");
  assert.deepEqual(estado.supabaseChamadas, [
    ["favoritos", "usuario-auth"],
    ["concluidas", "usuario-auth"],
  ]);

  resetarEstado();
  estado.getUserErro = new Error("sessão indisponível");

  const comErro = await carregar("");

  assert.equal(estado.getUserChamadas, 1);
  assert.equal(comErro.userIdHome, "");
  assert.deepEqual(comErro.obrasNormalizadas, []);
  assert.deepEqual(estado.supabaseChamadas, []);
  assert.deepEqual(estado.savesListas, [
    ["favoritas", "", []],
    ["concluidas", "", []],
  ]);
});

test("home-initial-data-loader converte storage vazio em lista vazia e carrega perfis", async () => {
  resetarEstado();
  estado.perfis.visitante = { bia: { avatar: "bia.png" } };

  const resultado = await carregar("visitante");

  assert.deepEqual(resultado.obrasNormalizadas, []);
  assert.deepEqual(resultado.obrasFavoritasNormalizadas, []);
  assert.deepEqual(resultado.perfisAutoresNormalizados, {
    bia: { avatar: "bia.png" },
  });
  assert.deepEqual(estado.storageChamadas, [["obras", "visitante"]]);
});

test("home-initial-data-loader mantém fronteira do snapshot sem escritas remotas", () => {
  assert.match(modulo, /export async function carregarSnapshotInicialHome/);
  assert.match(modulo, /aoNormalizarObras\(obrasNormalizadas, userIdHome\)/);
  assert.doesNotMatch(modulo, /\.insert\(|\.update\(|\.delete\(/);
  assert.match(pagina, /useHomeInitialData/);
  assert.match(hook, /estaAtivo: \(\) => !cancelado/);
});

for (const raw of ["{invalid", "null", "{}", '"texto"']) {
  test(`storage inválido ${raw} não apaga coleções/perfis nem impede continuação`, async () => {
    resetarEstado();
    estado.storage["obras:usuario"] = raw;
    estado.listasLocais["favoritas:usuario"] = ["fav"];
    estado.perfis.usuario = { ana: { bio: "bio" } };
    let errors = 0;
    const value = await carregar("usuario", { aoFalhar: () => errors++ });
    assert.equal(errors, 2, "JSON inválido e favorito local não reconfirmado");
    assert.deepEqual(value.obrasFavoritasNormalizadas, ["fav"]);
    assert.deepEqual(value.perfisAutoresNormalizados, { ana: { bio: "bio" } });
    assert.equal(estado.savesJson.length, 0);
    assert.equal(estado.supabaseChamadas.length, 2);
  });
}

test("snapshot anterior só é fallback na mesma identidade e não consulta auth redundante", async () => {
  resetarEstado();
  estado.storage["obras:A"] = "invalid";
  const snapshotAnterior = { userIdHome: "A", obrasNormalizadas: [{ id: "old" }], obrasFavoritasNormalizadas: [], perfisAutoresNormalizados: { ana: { bio: "old" } } };
  const same = await carregar("A", { snapshotAnterior });
  assert.deepEqual(same.obrasNormalizadas, snapshotAnterior.obrasNormalizadas);
  assert.deepEqual(same.perfisAutoresNormalizados, snapshotAnterior.perfisAutoresNormalizados);
  const other = await carregar("B", { snapshotAnterior });
  assert.deepEqual(other.obrasNormalizadas, []);
  assert.deepEqual(other.perfisAutoresNormalizados, {});
  await carregar("", { resolverUsuario: false });
  assert.equal(estado.getUserChamadas, 0);
});

test("snapshot cancelado antes da leitura não chama callback, coleções nem persistência", async () => {
  resetarEstado();
  await carregar("A", { estaAtivo: () => false });
  assert.deepEqual(estado.eventos, []);
  assert.deepEqual(estado.storageChamadas, []);
  assert.deepEqual(estado.supabaseChamadas, []);
  assert.deepEqual(estado.savesJson, []);
  assert.deepEqual(estado.savesListas, []);
});

test("falha parcial em favoritos preserva locais e não descarta concluídas bem-sucedidas", async () => {
  resetarEstado();
  estado.listasLocais["favoritas:A"] = ["old"];
  estado.listasRemotas.favoritos = Promise.reject(Error("offline"));
  estado.listasRemotas.concluidas = ["done"];
  let falhas = 0;
  const value = await carregar("A", { aoFalhar: () => falhas++ });
  assert.equal(falhas, 2, "falha remota e favorito local não reconfirmado");
  assert.deepEqual(value.obrasFavoritasNormalizadas, ["old"]);
  assert.deepEqual(estado.savesListas, [["favoritas", "A", ["old"]], ["concluidas", "A", ["done"]]]);
});

test("cancelamento durante coleções não persiste nem relê perfis após a resposta", async () => {
  resetarEstado();
  let resolver;
  estado.listasRemotas.favoritos = new Promise(resolve => { resolver = resolve; });
  let ativo = true;
  const pending = carregar("A", { estaAtivo: () => ativo });
  const anteriores = estado.savesJson.length;
  ativo = false; resolver([]); await pending;
  assert.equal(estado.savesJson.length, anteriores);
  assert.deepEqual(estado.savesListas, []);
  assert.deepEqual(estado.perfisChamadas, []);
});

test("favoritos locais ausentes do resultado remoto são preservados sem confirmação", async () => {
  resetarEstado();
  estado.listasLocais["favoritas:A"] = ["local-only"];
  let incompleto = false;
  const value = await carregar("A", { aoFalhar: () => { incompleto = true; } });
  assert.deepEqual(value.obrasFavoritasNormalizadas, ["local-only"]);
  assert.equal(incompleto, true);
});
