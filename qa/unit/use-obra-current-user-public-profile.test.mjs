import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const fonte = ler(
  "../../app/obra/[slug]/hooks/use-obra-current-user-public-profile.ts",
);
const cliente = ler("../../app/obra/[slug]/ObraDinamicaClient.tsx");
const fonteMockada = fonte
  .replace(
    'import { useEffect, useState } from "react";',
    "const useEffect = (...args) => globalThis.__obraCurrentUserProfile.useEffect(...args); const useState = (...args) => globalThis.__obraCurrentUserProfile.useState(...args);",
  )
  .replace(
    'import { carregarPerfilPublicoObra } from "../lib/obra-public-profile-resolver";',
    "const carregarPerfilPublicoObra = (...args) => globalThis.__obraCurrentUserProfile.carregarPerfil(...args);",
  );
const javascript = typescript.transpileModule(fonteMockada, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { useObraCurrentUserPublicProfile } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

function criarDeferred() {
  let resolver;
  const promise = new Promise((resolve) => {
    resolver = resolve;
  });
  return { promise, resolver };
}

function montarHook() {
  const estados = [];
  const efeitos = [];
  const chamadas = [];
  const carregamentos = [];
  let indiceEstado = 0;
  let indiceEfeito = 0;

  globalThis.__obraCurrentUserProfile = {
    useState(valorInicial) {
      const indice = indiceEstado++;
      if (!(indice in estados)) estados[indice] = valorInicial;
      return [
        estados[indice],
        (novoValor) => {
          estados[indice] =
            typeof novoValor === "function"
              ? novoValor(estados[indice])
              : novoValor;
        },
      ];
    },
    useEffect(efeito, dependencias) {
      const indice = indiceEfeito++;
      const anterior = efeitos[indice];
      const mudou =
        !anterior ||
        dependencias.some(
          (dependencia, posicao) =>
            !Object.is(dependencia, anterior.dependencias[posicao]),
        );
      if (!mudou) return;
      anterior?.cleanup?.();
      efeitos[indice] = { dependencias, cleanup: efeito() };
    },
    carregarPerfil(...args) {
      chamadas.push(args);
      const deferred = criarDeferred();
      carregamentos.push(deferred);
      return deferred.promise;
    },
  };

  return {
    chamadas,
    carregamentos,
    obterEstado() {
      return estados[0];
    },
    useRenderHook(usuarioId) {
      indiceEstado = 0;
      indiceEfeito = 0;
      return useObraCurrentUserPublicProfile(usuarioId);
    },
    desmontar() {
      for (const efeito of efeitos) efeito?.cleanup?.();
      delete globalThis.__obraCurrentUserProfile;
    },
  };
}

test("mantem null sem usuario e carrega o perfil com o fallback exato", async () => {
  const cenario = montarHook();
  try {
    assert.equal(cenario.useRenderHook(""), null);
    assert.deepEqual(cenario.chamadas, []);

    assert.equal(cenario.useRenderHook("usuario-a"), null);
    assert.deepEqual(cenario.chamadas, [["usuario-a", "Você"]]);
    const perfilA = { userId: "usuario-a", nome: "A", avatar: "", bio: "" };
    cenario.carregamentos[0].resolver(perfilA);
    await Promise.resolve();

    assert.deepEqual(cenario.useRenderHook("usuario-a"), perfilA);
  } finally {
    cenario.desmontar();
  }
});

test("descarta resultado antigo e nao expoe perfil entre troca e logout", async () => {
  const cenario = montarHook();
  try {
    assert.equal(cenario.useRenderHook("usuario-a"), null);
    assert.equal(cenario.useRenderHook("usuario-b"), null);
    assert.deepEqual(cenario.chamadas, [
      ["usuario-a", "Você"],
      ["usuario-b", "Você"],
    ]);

    const perfilA = { userId: "usuario-a", nome: "A", avatar: "", bio: "" };
    cenario.carregamentos[0].resolver(perfilA);
    await Promise.resolve();
    assert.equal(cenario.useRenderHook("usuario-b"), null);

    const perfilB = { userId: "usuario-b", nome: "B", avatar: "", bio: "" };
    cenario.carregamentos[1].resolver(perfilB);
    await Promise.resolve();
    assert.deepEqual(cenario.useRenderHook("usuario-b"), perfilB);

    assert.equal(cenario.useRenderHook(""), null);
    assert.deepEqual(cenario.chamadas, [
      ["usuario-a", "Você"],
      ["usuario-b", "Você"],
    ]);
  } finally {
    cenario.desmontar();
  }
});

test("cleanup impede aplicar resultado assincrono depois da desmontagem", async () => {
  const cenario = montarHook();
  assert.equal(cenario.useRenderHook("usuario-a"), null);
  cenario.desmontar();
  cenario.carregamentos[0].resolver({
    userId: "usuario-a",
    nome: "A",
    avatar: "",
    bio: "",
  });
  await Promise.resolve();
  assert.deepEqual(cenario.obterEstado(), { usuarioId: "", perfil: null });
});

test("cliente delega somente o lifecycle do perfil do usuario atual", () => {
  assert.match(
    cliente,
    /const perfilUsuarioLogado =\s*useObraCurrentUserPublicProfile\(usuarioIdLogado\);/,
  );
  assert.doesNotMatch(cliente, /async function carregarPerfilUsuarioAtual/);
  assert.doesNotMatch(cliente, /setPerfilUsuarioLogado/);
});
