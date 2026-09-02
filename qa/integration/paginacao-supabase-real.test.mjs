import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import { createClient } from "@supabase/supabase-js";

import { carregarTodasPaginasSupabase } from "../../lib/supabase/paginacao.mjs";

const QUANTIDADES = Object.freeze({
  posts: 137,
  comentarios: 2_501,
  curtidas: 5_001,
  obras: 1_201,
});

const POSTS_POR_PAGINA = 50;
const REGISTROS_POR_PAGINA = 500;
const OBRAS_POR_PAGINA = 200;
const LIMITE_PADRAO_DATA_API = 1_000;
const PRIMEIRO_POST_COM_INTERACOES = 88;
const POSTS_COM_INTERACOES = 50;

function removerAspas(valor) {
  const texto = valor.trim();

  if (texto.startsWith('"') && texto.endsWith('"')) {
    return JSON.parse(texto);
  }

  return texto;
}

function lerAmbienteSupabaseLocal() {
  if (
    process.env.SUPABASE_TEST_URL &&
    process.env.SUPABASE_TEST_ANON_KEY
  ) {
    return {
      url: process.env.SUPABASE_TEST_URL,
      anonKey: process.env.SUPABASE_TEST_ANON_KEY,
    };
  }

  let saida;

  try {
    saida = execFileSync("supabase", ["status", "-o", "env"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (erro) {
    throw new Error(
      "Inicie o Supabase local antes do teste (`supabase start`).",
      { cause: erro },
    );
  }

  const variaveis = Object.fromEntries(
    saida
      .split(/\r?\n/)
      .map((linha) => /^([A-Z0-9_]+)=(.*)$/.exec(linha.trim()))
      .filter(Boolean)
      .map((resultado) => [resultado[1], removerAspas(resultado[2])]),
  );

  if (!variaveis.API_URL || !variaveis.ANON_KEY) {
    throw new Error(
      "O CLI não retornou API_URL e ANON_KEY para o Supabase local.",
    );
  }

  return {
    url: variaveis.API_URL,
    anonKey: variaveis.ANON_KEY,
  };
}

function exigirDestinoLocal(url) {
  const destino = new URL(url);
  const hostsPermitidos = new Set(["127.0.0.1", "localhost", "[::1]"]);

  assert.ok(
    hostsPermitidos.has(destino.hostname),
    `O teste recusa Supabase remoto: ${destino.hostname}`,
  );
}

function uuidFixture(prefixo, indice) {
  return `${prefixo}-0000-0000-0000-${String(indice).padStart(12, "0")}`;
}

const POST_IDS_COM_INTERACOES = Array.from(
  { length: POSTS_COM_INTERACOES },
  (_, indice) => uuidFixture("10000000", PRIMEIRO_POST_COM_INTERACOES + indice),
);

function exigirRespostaSemErro(resposta, contexto) {
  assert.equal(
    resposta.error,
    null,
    `${contexto}: ${resposta.error?.message || "erro desconhecido"}`,
  );

  return resposta.data || [];
}

function exigirColecaoCompleta(registros, esperado, obterChave) {
  assert.equal(registros.length, esperado.length);

  const chaves = registros.map(obterChave);

  assert.equal(new Set(chaves).size, esperado.length);
  assert.deepEqual(chaves, esperado);
}

test("pagina dados reais pela Data API de um Supabase local descartável", async (t) => {
  const ambiente = lerAmbienteSupabaseLocal();
  exigirDestinoLocal(ambiente.url);

  const supabase = createClient(ambiente.url, ambiente.anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  const postsIniciais = exigirRespostaSemErro(
    await supabase
      .from("comunidade_posts")
      .select("id")
      .eq("obra_relacionada", "qa-paginacao"),
    "consulta sem range de posts",
  );
  const comentariosIniciais = exigirRespostaSemErro(
    await supabase
      .from("comunidade_comentarios")
      .select("id")
      .in("post_id", POST_IDS_COM_INTERACOES),
    "consulta sem range de comentários",
  );
  const curtidasIniciais = exigirRespostaSemErro(
    await supabase
      .from("comunidade_curtidas")
      .select("id")
      .in("post_id", POST_IDS_COM_INTERACOES),
    "consulta sem range de curtidas",
  );
  const obrasIniciais = exigirRespostaSemErro(
    await supabase
      .from("obras")
      .select("id")
      .like("slug", "qa-paginacao-obra-%"),
    "consulta sem range de obras",
  );

  await t.test("o ambiente reproduz o teto de 1.000 linhas da Data API", () => {
    assert.equal(postsIniciais.length, QUANTIDADES.posts);
    assert.equal(comentariosIniciais.length, LIMITE_PADRAO_DATA_API);
    assert.equal(curtidasIniciais.length, LIMITE_PADRAO_DATA_API);
    assert.equal(obrasIniciais.length, LIMITE_PADRAO_DATA_API);
  });

  const posts = await carregarTodasPaginasSupabase({
    nomeColecao: "posts reais da Comunidade",
    tamanhoPagina: POSTS_POR_PAGINA,
    buscarPagina: async (inicio, fim) =>
      supabase
        .from("comunidade_posts")
        .select("id, criado_em")
        .eq("obra_relacionada", "qa-paginacao")
        .order("criado_em", { ascending: false })
        .order("id", { ascending: false })
        .range(inicio, fim),
  });

  await t.test("carrega todos os posts em ordem determinística", () => {
    const esperados = Array.from(
      { length: QUANTIDADES.posts },
      (_, indice) => uuidFixture("10000000", QUANTIDADES.posts - indice),
    );

    exigirColecaoCompleta(posts, esperados, (registro) => registro.id);
  });

  const comentarios = await carregarTodasPaginasSupabase({
    nomeColecao: "comentários reais da Comunidade",
    tamanhoPagina: REGISTROS_POR_PAGINA,
    buscarPagina: async (inicio, fim) =>
      supabase
        .from("comunidade_comentarios")
        .select("id, criado_em")
        .in("post_id", POST_IDS_COM_INTERACOES)
        .order("criado_em", { ascending: true })
        .order("id", { ascending: true })
        .range(inicio, fim),
  });

  await t.test("atravessa o teto da API e carrega todos os comentários", () => {
    const esperados = Array.from(
      { length: QUANTIDADES.comentarios },
      (_, indice) => uuidFixture("20000000", indice + 1),
    );

    exigirColecaoCompleta(comentarios, esperados, (registro) => registro.id);
  });

  const curtidas = await carregarTodasPaginasSupabase({
    nomeColecao: "curtidas reais da Comunidade",
    tamanhoPagina: REGISTROS_POR_PAGINA,
    buscarPagina: async (inicio, fim) =>
      supabase
        .from("comunidade_curtidas")
        .select("id, post_id, usuario_id")
        .in("post_id", POST_IDS_COM_INTERACOES)
        .order("post_id", { ascending: true })
        .order("usuario_id", { ascending: true })
        .range(inicio, fim),
  });

  await t.test("carrega todas as curtidas sem lacunas nem duplicações", () => {
    const esperados = Array.from(
      { length: QUANTIDADES.curtidas },
      (_, indice) => {
        const numero = indice + 1;
        const post =
          ((numero - 1) % POSTS_COM_INTERACOES) +
          PRIMEIRO_POST_COM_INTERACOES;
        const usuario = Math.floor((numero - 1) / POSTS_COM_INTERACOES) + 1;

        return `${uuidFixture("10000000", post)}:${uuidFixture("a0000000", usuario)}`;
      },
    ).sort();

    exigirColecaoCompleta(
      curtidas,
      esperados,
      (registro) => `${registro.post_id}:${registro.usuario_id}`,
    );
  });

  const obras = await carregarTodasPaginasSupabase({
    nomeColecao: "obras reais publicadas",
    tamanhoPagina: OBRAS_POR_PAGINA,
    buscarPagina: async (inicio, fim) =>
      supabase
        .from("obras")
        .select("id, titulo, slug")
        .like("slug", "qa-paginacao-obra-%")
        .eq("publicado", true)
        .order("titulo", { ascending: true })
        .order("id", { ascending: true })
        .range(inicio, fim),
  });

  await t.test("carrega todas as obras publicadas além do teto da API", () => {
    const esperados = Array.from(
      { length: QUANTIDADES.obras },
      (_, indice) => uuidFixture("40000000", indice + 1),
    );

    exigirColecaoCompleta(obras, esperados, (registro) => registro.id);
  });
});
