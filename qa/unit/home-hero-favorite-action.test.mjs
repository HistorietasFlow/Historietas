import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-hero-favorite-action.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");

const estado = {
  getUser: { id: "usuario-1" },
  erroGetUser: null,
  chamadasGetUser: 0,
  storage: [],
  sincronizacoes: [],
  atividades: [],
  respostaSincronizacao: true,
};
globalThis.__homeHeroFavoriteActionState = estado;

const moduloExecutavel = modulo
  .replace(
    'import { supabase } from "../../lib/supabase/client";\n',
    `const supabase = {
  auth: {
    async getUser() {
      globalThis.__homeHeroFavoriteActionState.chamadasGetUser += 1;
      if (globalThis.__homeHeroFavoriteActionState.erroGetUser) {
        throw globalThis.__homeHeroFavoriteActionState.erroGetUser;
      }
      return { data: { user: globalThis.__homeHeroFavoriteActionState.getUser } };
    },
  },
};
`,
  )
  .replace(
    `import {
  colecaoTemIdentificadorHome,
  criarIdentificadoresObraCatalogoHome,
  criarIdentificadoresObraLocalHome,
  normalizarListaIdsHome,
  removerIdentificadoresDaListaHome,
} from "./home-collection-utils";\n`,
    `const normalizarListaIdsHome = (lista) => Array.from(new Set(lista.map((item) => item.trim()).filter(Boolean)));
const criarIdentificadoresObraCatalogoHome = (obra) => normalizarListaIdsHome([obra.id || "", obra.slug || "", obra.titulo.toLowerCase()]);
const criarIdentificadoresObraLocalHome = (obra) => normalizarListaIdsHome([obra.id, obra.slug, obra.titulo.toLowerCase()]);
const colecaoTemIdentificadorHome = (identificadores, colecao) => identificadores.some((identificador) => colecao.map((item) => item.trim()).includes(identificador));
const removerIdentificadoresDaListaHome = (lista, identificadores) => normalizarListaIdsHome(lista.filter((item) => !new Set(identificadores).has(item.trim())));
`,
  )
  .replace(
    'import { salvarListaIdsHome } from "./home-storage-utils";\n',
    'const salvarListaIdsHome = (...args) => globalThis.__homeHeroFavoriteActionState.storage.push(args);\n',
  )
  .replace(
    'import { sincronizarColecaoObraHome } from "./home-collection-supabase-utils";\n',
    `const sincronizarColecaoObraHome = async (...args) => {
  globalThis.__homeHeroFavoriteActionState.sincronizacoes.push(args);
  return globalThis.__homeHeroFavoriteActionState.respostaSincronizacao;
};
`,
  )
  .replace(
    'import { registrarAtividadeDiarioHome } from "./home-diary-activity-utils";\n',
    'const registrarAtividadeDiarioHome = (atividade) => globalThis.__homeHeroFavoriteActionState.atividades.push(atividade);\n',
  )
  .replace(
    'import { encontrarObraLocalPorHeroHome } from "./home-hero-work-utils";\n',
    `const encontrarObraLocalPorHeroHome = (obrasLocais, heroObra, heroFavoritoId) =>
  obrasLocais.find((obra) => [obra.id, obra.slug, obra.titulo.toLowerCase()].includes(heroFavoritoId)) || null;
`,
  );

const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { alternarHeroFavoritoHome } = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

const heroObra = {
  id: "obra-local",
  titulo: "História Heroica",
  autor: "Autora",
  genero: "Fantasia",
  classificacaoIndicativa: "Livre",
  status: "Publicado",
  views: "0",
  likes: "0",
  comentarios: "0",
  link: "/obra/historia-heroica",
  disponivel: true,
  slug: "historia-heroica",
  formato: "Webnovel",
  sinopse: "Sinopse",
  tags: [],
};

const obraLocalHero = {
  ...heroObra,
  id: "obra-local",
  capa: "",
  capitulos: [],
  visualizacoes: 0,
  totalCurtidas: 0,
  totalComentarios: 0,
};

function resetarEstado() {
  estado.getUser = { id: "usuario-1" };
  estado.erroGetUser = null;
  estado.chamadasGetUser = 0;
  estado.storage.length = 0;
  estado.sincronizacoes.length = 0;
  estado.atividades.length = 0;
  estado.respostaSincronizacao = true;
}

async function executarAcao({
  hero = heroObra,
  heroFavoritoId = "obra-local",
  obrasLocais = [obraLocalHero],
  obrasFavoritas = [],
  podeSalvar = true,
} = {}) {
  const favoritosDefinidos = [];
  const avisos = [];
  const mensagensLogin = [];

  await alternarHeroFavoritoHome({
    heroObra: hero,
    heroFavoritoId,
    obrasLocais,
    obrasFavoritas,
    exigirLoginHome: async (mensagem) => {
      mensagensLogin.push(mensagem);
      return podeSalvar;
    },
    favoritesStorageKey: "historietas-obras-favoritas",
    setObrasFavoritas: (favoritos) => favoritosDefinidos.push(favoritos),
    setAvisoLogin: (aviso) => avisos.push(aviso),
  });

  return { favoritosDefinidos, avisos, mensagensLogin };
}

test("home-hero-favorite-action ignora Hero ausente e login negado", async () => {
  resetarEstado();
  await executarAcao({ heroFavoritoId: "" });
  assert.equal(estado.chamadasGetUser, 0);
  assert.equal(estado.storage.length, 0);

  const resultado = await executarAcao({ podeSalvar: false });
  assert.deepEqual(resultado.mensagensLogin, [
    "Entre na sua conta para salvar obras na sua lista.",
  ]);
  assert.equal(estado.chamadasGetUser, 0);
  assert.equal(estado.storage.length, 0);
  assert.equal(resultado.favoritosDefinidos.length, 0);
});

test("home-hero-favorite-action adiciona, normaliza, persiste e sincroniza favorito", async () => {
  resetarEstado();
  const resultado = await executarAcao({ obrasFavoritas: [" outra-obra ", ""] });

  assert.deepEqual(resultado.favoritosDefinidos, [["outra-obra", "obra-local"]]);
  assert.deepEqual(estado.storage, [[
    "historietas-obras-favoritas",
    "usuario-1",
    ["outra-obra", "obra-local"],
  ]]);
  assert.deepEqual(estado.sincronizacoes, [["favoritos", "obra-local", true]]);
  assert.deepEqual(estado.atividades, [{
    userId: "usuario-1",
    tipo: "favoritou_obra",
    obra: obraLocalHero,
    texto: "Adicionou História Heroica à lista",
  }]);
});

test("home-hero-favorite-action remove todos os identificadores sem registrar atividade", async () => {
  resetarEstado();
  const resultado = await executarAcao({
    obrasFavoritas: [" obra-local ", "historia-heroica", "outra-obra"],
  });

  assert.deepEqual(resultado.favoritosDefinidos, [["outra-obra"]]);
  assert.deepEqual(estado.storage.at(-1), [
    "historietas-obras-favoritas",
    "usuario-1",
    ["outra-obra"],
  ]);
  assert.deepEqual(estado.sincronizacoes, [["favoritos", "obra-local", false]]);
  assert.equal(estado.atividades.length, 0);
});

test("home-hero-favorite-action sincroniza somente com obra local e preserva fallback de getUser", async () => {
  resetarEstado();
  estado.erroGetUser = new Error("sessão indisponível");
  const semObraLocal = await executarAcao({ obrasLocais: [] });

  assert.deepEqual(semObraLocal.favoritosDefinidos, [["obra-local"]]);
  assert.deepEqual(estado.storage, [[
    "historietas-obras-favoritas",
    "",
    ["obra-local"],
  ]]);
  assert.equal(estado.sincronizacoes.length, 0);
  assert.equal(estado.atividades.length, 0);
});

test("home-hero-favorite-action informa falha de sync somente ao adicionar", async () => {
  resetarEstado();
  estado.respostaSincronizacao = false;
  const resultado = await executarAcao();

  assert.deepEqual(resultado.avisos, [
    "A obra ficou salva no aparelho, mas não sincronizou agora.",
  ]);
  assert.equal(estado.atividades.length, 1);
});

test("home-hero-favorite-action estabelece a fronteira da ação do Hero", () => {
  assert.match(modulo, /export async function alternarHeroFavoritoHome\b/);
  assert.match(modulo, /supabase\.auth\.getUser\(\)/);
  assert.match(modulo, /encontrarObraLocalPorHeroHome\(/);
  assert.match(modulo, /salvarListaIdsHome\(favoritesStorageKey, userIdAtual, favoritosAtualizados\)/);
  assert.match(modulo, /sincronizarColecaoObraHome\(\s*"favoritos",\s*obraLocalHero\.id,\s*novoStatusFavorito/);
  assert.match(modulo, /tipo: "favoritou_obra"/);
  assert.match(modulo, /Adicionou \$\{obraLocalHero\.titulo\} à lista/);
  assert.doesNotMatch(modulo, /useEffect|useState|localStorage|from "react"/);
  assert.match(pagina, /import \{ alternarHeroFavoritoHome \} from "\.\/lib\/home-hero-favorite-action";/);
  assert.match(pagina, /function alternarHeroFavorito\(\) \{[\s\S]*?return alternarHeroFavoritoHome\(/);
  assert.doesNotMatch(pagina, /async function alternarHeroFavorito\b/);
});
