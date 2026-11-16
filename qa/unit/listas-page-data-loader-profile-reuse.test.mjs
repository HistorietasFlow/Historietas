import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import "./listas-identity-concurrency.test.mjs";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/listas/hooks/use-listas-page-data-loader.ts",
    import.meta.url,
  ),
  "utf8",
);

const USUARIO_A = "11111111-1111-4111-8111-111111111111";
const USUARIO_B = "22222222-2222-4222-8222-222222222222";
const USUARIO_C = "33333333-3333-4333-8333-333333333333";

function prepararSource() {
  return source
    .replace(
      'import { useEffect, type Dispatch, type SetStateAction } from "react";',
      "const useEffect = (...args) => globalThis.__listasPageDataLoader.useEffect(...args);",
    )
    .replace(
      'import { supabase } from "../../../lib/supabase/client";',
      "const { supabase } = globalThis.__listasPageDataLoader;",
    )
    .replace(
      'import { ehClassificacao18 } from "../../../lib/historietasAdultContent";',
      "const { ehClassificacao18 } = globalThis.__listasPageDataLoader;",
    )
    .replace(
      /import \{[\s\S]*?\} from "\.\.\/\.\.\/\.\.\/lib\/historietasPrivacy";/,
      "const { carregarEstadoRelacionamentoPerfil, carregarPermissoesAbasPerfil, carregarPreferenciasPrivacidade } = globalThis.__listasPageDataLoader;",
    )
    .replace(
      'import { normalizarTexto } from "../../../lib/utils";',
      "const { normalizarTexto } = globalThis.__listasPageDataLoader;",
    )
    .replace(
      /import \{[\s\S]*?\} from "\.\.\/lib\/listas-profile-records-loader";/,
      "const { carregarAvaliacaoDiarioListas, carregarPerfil } = globalThis.__listasPageDataLoader;",
    )
    .replace(
      'import { carregarListasDoPerfil } from "../lib/listas-profile-loader";',
      "const { carregarListasDoPerfil } = globalThis.__listasPageDataLoader;",
    )
    .replace(
      'import { carregarObrasPublicadas } from "../lib/listas-published-works-loader";',
      "const { carregarObrasPublicadas } = globalThis.__listasPageDataLoader;",
    )
    .replace(
      /import \{[\s\S]*?\} from "\.\.\/lib\/listas-public-catalog-loader";/,
      "const { carregarAutoresPublicos, carregarIdsInteracoesUsuario } = globalThis.__listasPageDataLoader;",
    )
    .replace(
      /import \{[\s\S]*?\} from "\.\.\/lib\/listas-public-catalog-utils";/,
      "const { ordenarObrasDaSecao, ordenarRecomendacoes } = globalThis.__listasPageDataLoader;",
    )
    .replace(
      /import \{[\s\S]*?\} from "\.\.\/lib\/listas-diary-rating-utils";/,
      "",
    )
    .replace(
      /import \{[\s\S]*?\} from "\.\.\/lib\/listas-value-utils";/,
      "const { idUsuarioValido, obterMensagemErroListas, pegarTexto } = globalThis.__listasPageDataLoader;",
    );
}

async function importarHook() {
  const javascript = typescript.transpileModule(prepararSource(), {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;

  return import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${Math.random()}`,
  );
}

function criarPerfil(userId, nome) {
  return {
    userId,
    nome,
    username: nome.toLowerCase(),
    avatar: "",
    bio: "Perfil no Historietas.",
  };
}

async function executarCenario({
  usuario = null,
  userIdUrl = "",
  permissoes = { biblioteca: true, diario: true },
  carregarPerfil,
} = {}) {
  const efeitos = [];
  const chamadas = {
    perfis: [],
    preferencias: [],
    permissoes: [],
    relacionamentos: [],
    avaliacoes: [],
    listas: [],
  };
  const estados = {
    carregando: [],
    bloqueado: [],
    erro: [],
    usuarioAtualId: [],
    usuarioAtualPerfil: [],
    perfil: [],
    listasPerfil: [],
  };
  let finalizar;
  const finalizado = new Promise((resolve) => {
    finalizar = resolve;
  });
  const perfis = new Map([
    [USUARIO_A, criarPerfil(USUARIO_A, "Usuário A")],
    [USUARIO_B, criarPerfil(USUARIO_B, "Usuário B")],
    [USUARIO_C, criarPerfil(USUARIO_C, "Usuário C")],
  ]);

  globalThis.__listasPageDataLoader = {
    useEffect(callback, dependencies) {
      efeitos.push({ callback, dependencies });
    },
    supabase: {
      auth: {
        async getUser() {
          return { data: { user: usuario } };
        },
      },
    },
    ehClassificacao18: () => false,
    async carregarPerfil(userId, fallback) {
      chamadas.perfis.push([userId, fallback]);
      if (carregarPerfil) return carregarPerfil(userId, fallback, chamadas.perfis.length);
      return perfis.get(userId) || criarPerfil(userId, fallback || "Usuário");
    },
    async carregarPreferenciasPrivacidade(userId, opcoes) {
      chamadas.preferencias.push([userId, opcoes]);
      return { visibilidadeDiario: "publico" };
    },
    async carregarPermissoesAbasPerfil(userId, preferencias) {
      chamadas.permissoes.push([userId, preferencias]);
      return permissoes;
    },
    async carregarEstadoRelacionamentoPerfil(perfilId, usuarioId) {
      chamadas.relacionamentos.push([perfilId, usuarioId]);
      return usuarioId ? "seguindo" : "nenhum";
    },
    async carregarAvaliacaoDiarioListas(userId) {
      chamadas.avaliacoes.push(userId);
      return { media: 0, total: 0, minhaNota: 0, carregando: false };
    },
    async carregarListasDoPerfil(userId, proprioPerfil, storageKeys) {
      chamadas.listas.push([userId, proprioPerfil, storageKeys]);
      return { tudo: [] };
    },
    async carregarObrasPublicadas() {
      return [];
    },
    async carregarAutoresPublicos() {
      return [];
    },
    async carregarIdsInteracoesUsuario() {
      return [];
    },
    ordenarObrasDaSecao: (obras) => obras,
    ordenarRecomendacoes: (obras) => obras,
    normalizarTexto: (valor) => String(valor || "").trim().toLowerCase(),
    idUsuarioValido: (valor) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        String(valor || "").trim(),
      ),
    obterMensagemErroListas: (erro, fallback) => erro?.message || fallback,
    pegarTexto: (valor, fallback = "") =>
      typeof valor === "string" && valor.trim() ? valor.trim() : fallback,
  };

  const { useListasPageDataLoader } = await importarHook();
  const listasPerfilVazias = { tudo: [] };
  const setAvaliacaoDiario = () => {};

  const executarLoader = useListasPageDataLoader;
  executarLoader({
    modo: "perfil",
    origemPerfil: "diario",
    userIdUrl,
    secao: "catalogo",
    genero: "",
    listasPerfilVazias,
    permissoesProprioPerfil: { biblioteca: true, diario: true },
    storageKeys: {
      seguindo: "seguindo",
      favoritas: "favoritas",
      concluidas: "concluidas",
    },
    avaliacaoDiarioVazia: { media: 0, total: 0, minhaNota: 0 },
    setCarregando(valor) {
      estados.carregando.push(valor);
      if (valor === false) finalizar();
    },
    setBloqueado: (valor) => estados.bloqueado.push(valor),
    setErro: (valor) => estados.erro.push(valor),
    setAvaliacaoDiario,
    setUsuarioAtualId: (valor) => estados.usuarioAtualId.push(valor),
    setUsuarioAtualPerfil: (valor) => estados.usuarioAtualPerfil.push(valor),
    setPerfil: (valor) => estados.perfil.push(valor),
    setListasPerfil: (valor) => estados.listasPerfil.push(valor),
    setPreferenciasPerfil: () => {},
    setRelacionamentoPerfil: () => {},
    setObrasPublicas: () => {},
    setAutores: () => {},
  });

  assert.equal(efeitos.length, 1);
  const cleanup = efeitos[0].callback();
  await finalizado;

  return { chamadas, cleanup, estados };
}

function usuario(userId, nome) {
  return {
    id: userId,
    email: `${nome.toLowerCase()}@historietas.test`,
    user_metadata: { nome },
  };
}

test("reutiliza o perfil autenticado nas próprias listas sem segunda consulta", async () => {
  const resultado = await executarCenario({ usuario: usuario(USUARIO_A, "Autora A") });

  assert.deepEqual(
    resultado.chamadas.perfis.map(([userId]) => userId),
    [USUARIO_A],
  );
  assert.strictEqual(
    resultado.estados.perfil.at(-1),
    resultado.estados.usuarioAtualPerfil.at(-1),
  );
  assert.deepEqual(resultado.chamadas.permissoes, []);
  assert.deepEqual(resultado.chamadas.relacionamentos, []);
  assert.equal(resultado.chamadas.listas[0][1], true);
  resultado.cleanup();
});

test("mantém consulta independente, privacidade e relacionamento para terceiros", async () => {
  const resultado = await executarCenario({
    usuario: usuario(USUARIO_A, "Autora A"),
    userIdUrl: USUARIO_B,
  });

  assert.deepEqual(
    resultado.chamadas.perfis.map(([userId]) => userId),
    [USUARIO_A, USUARIO_B],
  );
  assert.deepEqual(resultado.chamadas.permissoes.map(([userId]) => userId), [USUARIO_B]);
  assert.deepEqual(resultado.chamadas.relacionamentos, [[USUARIO_B, USUARIO_A]]);
  assert.equal(resultado.chamadas.listas[0][1], false);
  resultado.cleanup();
});

test("visitante preserva perfil público, perfil ausente e identidade vazia", async () => {
  const publico = await executarCenario({ userIdUrl: USUARIO_B });
  assert.deepEqual(publico.chamadas.perfis.map(([userId]) => userId), [USUARIO_B]);
  assert.deepEqual(publico.estados.usuarioAtualPerfil, [null]);
  assert.deepEqual(publico.chamadas.relacionamentos, [[USUARIO_B, ""]]);
  assert.equal(publico.chamadas.listas[0][1], false);
  publico.cleanup();

  const inexistente = await executarCenario({
    userIdUrl: USUARIO_C,
    carregarPerfil: async (userId, fallback) =>
      criarPerfil(userId, fallback || "Usuário"),
  });
  assert.equal(inexistente.estados.perfil.at(-1).userId, USUARIO_C);
  assert.equal(inexistente.chamadas.listas[0][1], false);
  inexistente.cleanup();

  const semIdentidade = await executarCenario();
  assert.deepEqual(semIdentidade.chamadas.perfis, []);
  assert.equal(
    semIdentidade.estados.erro.at(-1),
    "Não foi possível identificar o perfil desta lista.",
  );
  semIdentidade.cleanup();
});

test("lista privada continua bloqueada sem carregar registros privados", async () => {
  const publica = await executarCenario({
    usuario: usuario(USUARIO_A, "Autora A"),
    userIdUrl: USUARIO_B,
  });
  assert.equal(publica.chamadas.listas.length, 1);
  publica.cleanup();

  const privada = await executarCenario({
    usuario: usuario(USUARIO_A, "Autora A"),
    userIdUrl: USUARIO_B,
    permissoes: { biblioteca: false, diario: false },
  });
  assert.equal(privada.estados.bloqueado.at(-1), true);
  assert.equal(privada.chamadas.listas.length, 0);
  assert.deepEqual(privada.estados.listasPerfil.at(-1), { tudo: [] });
  privada.cleanup();
});

test("login, logout e troca de conta não reutilizam perfil de execução anterior", async () => {
  const contaA = await executarCenario({ usuario: usuario(USUARIO_A, "Autora A") });
  const logout = await executarCenario({ userIdUrl: USUARIO_B });
  const contaC = await executarCenario({ usuario: usuario(USUARIO_C, "Autora C") });

  assert.deepEqual(contaA.chamadas.perfis.map(([id]) => id), [USUARIO_A]);
  assert.deepEqual(logout.chamadas.perfis.map(([id]) => id), [USUARIO_B]);
  assert.deepEqual(contaC.chamadas.perfis.map(([id]) => id), [USUARIO_C]);
  assert.equal(contaC.estados.perfil.at(-1).userId, USUARIO_C);
  contaA.cleanup();
  logout.cleanup();
  contaC.cleanup();
});

test("falha no primeiro carregamento preserva a consulta de retry do perfil-alvo", async () => {
  const perfilRecuperado = criarPerfil(USUARIO_A, "Perfil recuperado");
  const resultado = await executarCenario({
    usuario: usuario(USUARIO_A, "Autora A"),
    carregarPerfil: async (_userId, _fallback, numeroChamada) => {
      if (numeroChamada === 1) throw new Error("falha temporária");
      return perfilRecuperado;
    },
  });

  assert.deepEqual(
    resultado.chamadas.perfis.map(([userId]) => userId),
    [USUARIO_A, USUARIO_A],
  );
  assert.equal(resultado.estados.usuarioAtualPerfil.at(-1).nome, "Autora A");
  assert.strictEqual(resultado.estados.perfil.at(-1), perfilRecuperado);
  assert.equal(resultado.chamadas.listas[0][1], true);
  resultado.cleanup();
});
