import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const loaderSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/actions/carregar-nome-profile-editar-capitulo.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);

function criarSupabase(consultas, chamadas) {
  return {
    from(tabela) {
      chamadas.push(["from", tabela]);

      return {
        select(colunas) {
          chamadas.push(["select", colunas]);

          return {
            eq(campo, valor) {
              chamadas.push(["eq", campo, valor]);

              return {
                limit(limite) {
                  chamadas.push(["limit", limite]);

                  return {
                    async maybeSingle() {
                      chamadas.push(["maybeSingle"]);
                      const consulta = consultas.shift() || {
                        data: null,
                        error: null,
                      };

                      if (consulta instanceof Error) throw consulta;

                      return consulta;
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
}

async function carregarModulo(consultas) {
  const chamadas = [];
  const parser = [];
  const javascript = typescript.transpileModule(loaderSource, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText
    .replace(
      'import { supabase } from "../../../lib/supabase/client";',
      "const supabase = globalThis.__editarCapituloProfileLoaderSupabase;",
    )
    .replace(
      'import { obterNomeProfileEditarCapitulo } from "../lib/editar-capitulo-profile-utils";',
      "const obterNomeProfileEditarCapitulo = globalThis.__editarCapituloProfileLoaderParser;",
    );

  globalThis.__editarCapituloProfileLoaderSupabase = criarSupabase(
    [...consultas],
    chamadas,
  );
  globalThis.__editarCapituloProfileLoaderParser = (profile) => {
    parser.push(profile);
    return typeof profile?.nome === "string" ? profile.nome.trim() : "";
  };

  const modulo = await import(
    `data:text/javascript;base64,${Buffer.from(
      `${javascript}\n// ${Math.random()}`,
    ).toString("base64")}`,
  );

  return { ...modulo, chamadas, parser };
}

test("loader de profile retorna sem consultar quando userId e vazio", async () => {
  const modulo = await carregarModulo([]);

  assert.equal(await modulo.carregarNomeProfileEditarCapitulo("  "), "");
  assert.deepEqual(modulo.chamadas, []);
});

test("loader consulta user_id primeiro, usa parser e interrompe ao encontrar nome", async () => {
  const modulo = await carregarModulo([
    { data: { nome: "  Nome por user_id  " }, error: null },
  ]);

  assert.equal(
    await modulo.carregarNomeProfileEditarCapitulo("  usuario-1  "),
    "Nome por user_id",
  );
  assert.deepEqual(modulo.chamadas, [
    ["from", "profiles"],
    ["select", "nome"],
    ["eq", "user_id", "usuario-1"],
    ["limit", 1],
    ["maybeSingle"],
  ]);
  assert.deepEqual(modulo.parser, [{ nome: "  Nome por user_id  " }]);
});

test("loader faz fallback por id quando user_id falha ou nao produz nome", async () => {
  const modulo = await carregarModulo([
    { data: { nome: "   " }, error: null },
    { data: { nome: "Nome por id" }, error: null },
  ]);

  assert.equal(
    await modulo.carregarNomeProfileEditarCapitulo(" usuario-2 "),
    "Nome por id",
  );
  assert.deepEqual(
    modulo.chamadas.filter(([tipo]) => tipo === "eq"),
    [
      ["eq", "user_id", "usuario-2"],
      ["eq", "id", "usuario-2"],
    ],
  );
  assert.deepEqual(modulo.parser, [{ nome: "   " }, { nome: "Nome por id" }]);
});

test("loader retorna vazio quando a segunda consulta falha e absorve excecoes", async () => {
  const moduloComErro = await carregarModulo([
    { data: null, error: { message: "sem user_id" } },
    { data: null, error: { message: "sem id" } },
  ]);

  assert.equal(
    await moduloComErro.carregarNomeProfileEditarCapitulo("usuario-3"),
    "",
  );
  assert.deepEqual(moduloComErro.parser, []);

  const erro = new Error("falha inesperada");
  const moduloComExcecao = await carregarModulo([erro]);
  const avisos = [];
  const warnOriginal = console.warn;
  console.warn = (...argumentos) => avisos.push(argumentos);

  try {
    assert.equal(
      await moduloComExcecao.carregarNomeProfileEditarCapitulo("usuario-4"),
      "",
    );
  } finally {
    console.warn = warnOriginal;
  }

  assert.equal(avisos.length, 1);
  assert.equal(
    avisos[0][0],
    "Não consegui carregar profiles.nome no Editor de Capítulo:",
  );
  assert.strictEqual(avisos[0][1], erro);
});

test("Editar Capitulo delega o loader de profile sem reintroduzir a consulta", () => {
  assert.match(
    loaderSource,
    /import \{ supabase \} from "\.\.\/\.\.\/\.\.\/lib\/supabase\/client";/,
  );
  assert.match(
    loaderSource,
    /import \{ obterNomeProfileEditarCapitulo \} from "\.\.\/lib\/editar-capitulo-profile-utils";/,
  );
  assert.match(
    loaderSource,
    /\.from\("profiles"\)[\s\S]*?\.select\("nome"\)[\s\S]*?\.eq\("user_id", userIdLimpo\)[\s\S]*?\.limit\(1\)[\s\S]*?\.maybeSingle\(\)/,
  );
  assert.match(
    loaderSource,
    /\.eq\("id", userIdLimpo\)[\s\S]*?\.limit\(1\)[\s\S]*?\.maybeSingle\(\)/,
  );
  assert.match(
    loaderSource,
    /console\.warn\("Não consegui carregar profiles\.nome no Editor de Capítulo:", error\);/,
  );
  assert.match(
    pageSource,
    /import \{ carregarNomeProfileEditarCapitulo \} from "\.\/actions\/carregar-nome-profile-editar-capitulo";/,
  );
  assert.doesNotMatch(pageSource, /async function carregarNomeProfileEditarCapitulo\(/);
  assert.equal(
    (pageSource.match(/carregarNomeProfileEditarCapitulo\(userId\)/g) || []).length,
    2,
  );
});
