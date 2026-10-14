import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const page = readFileSync(new URL("../../app/listas/page.tsx", import.meta.url), "utf8");
const pageDataHook = readFileSync(
  new URL("../../app/listas/hooks/use-listas-page-data-loader.ts", import.meta.url),
  "utf8",
);
const interactionsHook = readFileSync(
  new URL("../../app/listas/hooks/use-listas-diary-interactions-sync.ts", import.meta.url),
  "utf8",
);

function prepararUseEffect() {
  const effects = [];
  globalThis.__listasUseEffect = (callback, dependencies) => {
    effects.push({ callback, dependencies });
  };
  return effects;
}

async function importarInteractionsHook() {
  const javascript = typescript.transpileModule(
    interactionsHook
      .replace(
        'import { useEffect, type Dispatch, type SetStateAction } from "react";',
        "const useEffect = globalThis.__listasUseEffect;",
      )
      .replace(
        /import \{[\s\S]*?\} from "\.\.\/lib\/listas-diary-interactions-loader";/,
        "const carregarInteracoesAnotacoesListas = globalThis.__listasCarregarInteracoes;",
      ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  ).outputText;

  return import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${Math.random()}`,
  );
}

test("página delega somente a leitura/orquestração aos hooks dedicados", () => {
  assert.match(page, /useListasPageDataLoader\(\{[\s\S]*?modo,[\s\S]*?origemPerfil,[\s\S]*?userIdUrl,[\s\S]*?secao,[\s\S]*?genero,/);
  assert.match(page, /useListasDiaryInteractionsSync\(\{[\s\S]*?listasPerfil,[\s\S]*?modo,[\s\S]*?usuarioAtualId,/);
  assert.doesNotMatch(pageDataHook, /\.insert\(|\.update\(|\.delete\(|\.upsert\(/);
  assert.doesNotMatch(interactionsHook, /\.insert\(|\.update\(|\.delete\(|\.upsert\(/);
});

test("carregamento principal preserva dependências, cancelamentos, privacidade e catálogo", () => {
  assert.match(pageDataHook, /\}, \[modo, origemPerfil, userIdUrl, secao, genero\]\);/);
  assert.equal((pageDataHook.match(/if \(cancelado\)/g) || []).length, 3);
  assert.match(pageDataHook, /await supabase\.auth\.getUser\(\)/);
  assert.match(pageDataHook, /perfilIdRecebido = userIdUrl\.trim\(\) \|\| usuarioLogadoId/);
  assert.match(pageDataHook, /usarFallbackLocal: proprioPerfil/);
  assert.match(pageDataHook, /origemPerfil === "biblioteca"[\s\S]*?permissoes\.biblioteca[\s\S]*?: permissoes\.diario/);
  assert.match(pageDataHook, /try \{[\s\S]*?carregarAvaliacaoDiarioListas\([\s\S]*?\} catch \(error\) \{/);
  assert.match(pageDataHook, /carregarListasDoPerfil<[\s\S]*?TCategoria,[\s\S]*?TItem[\s\S]*?>\(perfilUserId, proprioPerfil, storageKeys\)/);
  assert.match(pageDataHook, /!ehClassificacao18\(obra\.classificacaoIndicativa\)/);
  assert.match(pageDataHook, /normalizarTexto\(obra\.genero\)\.includes\(generoNormalizado\)/);
  assert.match(pageDataHook, /secao === "recomendacoes"[\s\S]*?carregarIdsInteracoesUsuario[\s\S]*?ordenarRecomendacoes/);
  assert.match(pageDataHook, /modo === "autores"[\s\S]*?carregarAutoresPublicos/);
});

test("interações limpam fora do perfil e preservam campos locais durante reload", async () => {
  const effects = prepararUseEffect();
  const chamadas = [];
  globalThis.__listasCarregarInteracoes = async (ids, usuario) => {
    chamadas.push([ids, usuario]);
    return {
      "nota-1": {
        novoComentario: "",
        respondendoComentarioId: "",
        respondendoAutorNome: "",
        ordenacaoComentarios: "relevantes",
        comentarios: [],
      },
    };
  };
  const { useListasDiaryInteractionsSync } = await importarInteractionsHook();

  const limpas = [];
  useListasDiaryInteractionsSync({
    listasPerfil: { tudo: [] },
    modo: "obras",
    usuarioAtualId: "leitor",
    setInteracoesAnotacoes: (valor) => limpas.push(valor),
  });
  effects[0].callback();
  assert.deepEqual(limpas, [{}]);

  const effectsPerfil = prepararUseEffect();
  const { useListasDiaryInteractionsSync: sincronizarInteracoesPerfil } =
    await importarInteractionsHook();
  let estado = {
    "nota-1": {
      novoComentario: "rascunho",
      respondendoComentarioId: "comentario-1",
      respondendoAutorNome: "Leitora",
      ordenacaoComentarios: "recentes",
    },
  };
  sincronizarInteracoesPerfil({
    listasPerfil: {
      tudo: [
        { anotacaoId: " nota-1 " },
        { anotacaoId: "nota-1" },
        { anotacaoId: "" },
      ],
    },
    modo: "perfil",
    usuarioAtualId: "leitor",
    setInteracoesAnotacoes: (valor) => {
      estado = typeof valor === "function" ? valor(estado) : valor;
    },
  });
  effectsPerfil[0].callback();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(chamadas, [[["nota-1"], "leitor"]]);
  assert.equal(estado["nota-1"].novoComentario, "rascunho");
  assert.equal(estado["nota-1"].respondendoComentarioId, "comentario-1");
  assert.equal(estado["nota-1"].respondendoAutorNome, "Leitora");
  assert.equal(estado["nota-1"].ordenacaoComentarios, "recentes");
});

test("interações canceladas não substituem o estado local", async () => {
  const effects = prepararUseEffect();
  let concluir;
  globalThis.__listasCarregarInteracoes = () => new Promise((resolve) => {
    concluir = resolve;
  });
  const { useListasDiaryInteractionsSync } = await importarInteractionsHook();
  let chamadas = 0;
  useListasDiaryInteractionsSync({
    listasPerfil: { tudo: [{ anotacaoId: "nota-1" }] },
    modo: "perfil",
    usuarioAtualId: "leitor",
    setInteracoesAnotacoes: () => {
      chamadas += 1;
    },
  });
  const cleanup = effects[0].callback();
  cleanup();
  concluir({ "nota-1": {} });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(chamadas, 0);
});
