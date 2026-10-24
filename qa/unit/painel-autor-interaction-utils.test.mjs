import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

await import("./painel-autor-supabase-work-converter.test.mjs");

const utilsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-interaction-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const chapterCommentsLoaderSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-chapter-comments-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const utilsJavascript = typescript.transpileModule(utilsSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { criarChaveInteracao } = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

const chapterCommentsState = {
  chamadasPaginador: [],
  consultas: [],
  registros: [],
  lote: [],
  deveFalhar: false,
};
globalThis.__painelAutorComentariosSupabase = {
  from(tabela) {
    return {
      select(campos) {
        return {
          eq(campoUsuario, usuarioId) {
            return {
              in(campoCapitulo, capituloIds) {
                const ordenacoes = [];
                return {
                  order(campo, opcoes) {
                    ordenacoes.push({ campo, opcoes });
                    return this;
                  },
                  range(inicio, fim) {
                    chapterCommentsState.consultas.push({
                      tabela,
                      campos,
                      campoUsuario,
                      usuarioId,
                      campoCapitulo,
                      capituloIds,
                      ordenacoes,
                      inicio,
                      fim,
                    });
                    return { data: [], error: null };
                  },
                };
              },
            };
          },
        };
      },
    };
  },
};
globalThis.__painelAutorCarregarPaginasPorLotes = async (configuracao) => {
  chapterCommentsState.chamadasPaginador.push({
    nomeColecao: configuracao.nomeColecao,
    itens: configuracao.itens,
  });
  await configuracao.buscarPaginaLote(chapterCommentsState.lote, 12, 37);
  if (chapterCommentsState.deveFalhar) {
    throw new Error("falha da paginação");
  }
  return chapterCommentsState.registros;
};
globalThis.__painelAutorCriarChaveInteracao = (obraId, capituloId) =>
  `${obraId}::${capituloId}`;
const chapterCommentsLoaderJavascript = typescript
  .transpileModule(
    chapterCommentsLoaderSource
      .replace(
        'import { supabase } from "../../../lib/supabase/client";',
        "const supabase = globalThis.__painelAutorComentariosSupabase;",
      )
      .replace(
        'import { carregarTodasPaginasPorLotesSupabase } from "../../../lib/supabase/paginacao.mjs";',
        "const carregarTodasPaginasPorLotesSupabase = globalThis.__painelAutorCarregarPaginasPorLotes;",
      )
      .replace(
        'import { criarChaveInteracao } from "./painel-autor-interaction-utils";',
        "const criarChaveInteracao = globalThis.__painelAutorCriarChaveInteracao;",
      ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  )
  .outputText;
const { carregarComentariosCapitulosUsuarioPainel } = await import(
  `data:text/javascript;base64,${Buffer.from(chapterCommentsLoaderJavascript).toString("base64")}`,
);

function prepararChapterCommentsLoader({
  registros = [],
  lote = [],
  deveFalhar = false,
} = {}) {
  chapterCommentsState.chamadasPaginador.length = 0;
  chapterCommentsState.consultas.length = 0;
  chapterCommentsState.registros = registros;
  chapterCommentsState.lote = lote;
  chapterCommentsState.deveFalhar = deveFalhar;
}

test("criarChaveInteracao preserva assinatura e formato", () => {
  assert.equal(criarChaveInteracao("obra-1", "capitulo-2"), "obra-1::capitulo-2");
  assert.equal(criarChaveInteracao(" obra ", " capitulo "), " obra :: capitulo ");
});

test("carregarComentariosCapitulosUsuarioPainel preserva paginação, query e primeiras ocorrências", async () => {
  prepararChapterCommentsLoader({
    lote: ["capitulo-1", "capitulo-2"],
    registros: [
      { obra_id: " obra-1 ", capitulo_id: " capitulo-1 ", comentario: " Primeiro " },
      { obra_id: " obra-1 ", capitulo_id: " capitulo-1 ", comentario: " Segundo " },
      { obra_id: null, capitulo_id: " capitulo-2 ", comentario: " Sem obra " },
      { obra_id: "obra-3", capitulo_id: " ", comentario: " Ignorado " },
      { obra_id: "obra-4", capitulo_id: "capitulo-4", comentario: " " },
    ],
  });

  const comentarios = await carregarComentariosCapitulosUsuarioPainel(
    "usuario-1",
    ["capitulo-1", "capitulo-2"],
  );

  assert.deepEqual([...comentarios.entries()], [
    ["capitulo-1", "Primeiro"],
    ["obra-1::capitulo-1", "Primeiro"],
    ["capitulo-2", "Sem obra"],
  ]);
  assert.deepEqual(chapterCommentsState.chamadasPaginador, [
    {
      nomeColecao: "comentários pessoais no Painel do Autor",
      itens: ["capitulo-1", "capitulo-2"],
    },
  ]);
  assert.deepEqual(chapterCommentsState.consultas, [
    {
      tabela: "comentarios_capitulos",
      campos: "id,obra_id,capitulo_id,comentario,atualizado_em",
      campoUsuario: "user_id",
      usuarioId: "usuario-1",
      campoCapitulo: "capitulo_id",
      capituloIds: ["capitulo-1", "capitulo-2"],
      ordenacoes: [
        { campo: "atualizado_em", opcoes: { ascending: false } },
        { campo: "id", opcoes: { ascending: false } },
      ],
      inicio: 12,
      fim: 37,
    },
  ]);
});

test("carregarComentariosCapitulosUsuarioPainel mantém retornos vazios e falha silenciosa", async () => {
  prepararChapterCommentsLoader();
  assert.deepEqual(
    [...(await carregarComentariosCapitulosUsuarioPainel(" ", ["capitulo-1"]))],
    [],
  );
  assert.deepEqual(
    [...(await carregarComentariosCapitulosUsuarioPainel("usuario-1", []))],
    [],
  );
  assert.deepEqual(chapterCommentsState.chamadasPaginador, []);

  prepararChapterCommentsLoader({ lote: ["capitulo-1"], deveFalhar: true });
  const avisos = [];
  const warnOriginal = console.warn;
  console.warn = (...argumentos) => avisos.push(argumentos);
  try {
    assert.deepEqual(
      [...(await carregarComentariosCapitulosUsuarioPainel("usuario-1", ["capitulo-1"]))],
      [],
    );
  } finally {
    console.warn = warnOriginal;
  }
  assert.equal(avisos.length, 1);
  assert.equal(
    avisos[0][0],
    "Não consegui acessar comentários pessoais no Painel do Autor:",
  );
  assert.equal(avisos[0][1].message, "falha da paginação");
});

test("Painel do Autor delega somente a chave de interação ao helper extraído", () => {
  assert.match(
    pagina,
    /import \{ criarChaveInteracao \} from "\.\/lib\/painel-autor-interaction-utils";/,
  );
  assert.doesNotMatch(pagina, /function criarChaveInteracao\(/);
  assert.equal((pagina.match(/\bcriarChaveInteracao\b/g) || []).length, 2);
  assert.match(
    pagina,
    /import \{ carregarComentariosCapitulosUsuarioPainel \} from "\.\/lib\/painel-autor-chapter-comments-loader";/,
  );
  assert.doesNotMatch(pagina, /async function carregarComentariosCapitulosUsuarioPainel\(/);
  assert.equal(
    (pagina.match(/\bcarregarComentariosCapitulosUsuarioPainel\b/g) || []).length,
    2,
  );
  assert.match(
    chapterCommentsLoaderSource,
    /import \{ criarChaveInteracao \} from "\.\/painel-autor-interaction-utils";/,
  );
  assert.match(
    chapterCommentsLoaderSource,
    /carregarTodasPaginasPorLotesSupabase[\s\S]*?nomeColecao: "comentários pessoais no Painel do Autor"/,
  );
  assert.match(
    chapterCommentsLoaderSource,
    /\.from\("comentarios_capitulos"\)[\s\S]*?\.select\("id,obra_id,capitulo_id,comentario,atualizado_em"\)/,
  );
  assert.match(chapterCommentsLoaderSource, /\.eq\("user_id", userId\)/);
  assert.match(chapterCommentsLoaderSource, /\.in\("capitulo_id", capituloIdsLote\)/);
  assert.match(
    chapterCommentsLoaderSource,
    /\.order\("atualizado_em", \{ ascending: false \}\)[\s\S]*?\.order\("id", \{ ascending: false \}\)[\s\S]*?\.range\(inicio, fim\)/,
  );
  assert.match(
    chapterCommentsLoaderSource,
    /Não consegui acessar comentários pessoais no Painel do Autor:/,
  );
  assert.doesNotMatch(
    chapterCommentsLoaderSource,
    /useState|useEffect|localStorage|window|document/,
  );
  assert.doesNotMatch(utilsSource, /supabase|localStorage|useState|useEffect/);
});
