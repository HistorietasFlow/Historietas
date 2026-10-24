import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const loaderSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-supabase-chapters-loader.ts",
    import.meta.url,
  ),
  "utf8",
);

const estado = {
  chamadasPaginador: [],
  consultas: [],
  registros: [],
  lote: [],
  deveFalhar: false,
};
globalThis.__painelAutorCapitulosSupabase = {
  from(tabela) {
    return {
      select(campos) {
        return {
          in(campoObra, obraIds) {
            return {
              eq(campoUsuario, userId) {
                const ordenacoes = [];
                return {
                  order(campo, opcoes) {
                    ordenacoes.push({ campo, opcoes });
                    return this;
                  },
                  range(inicio, fim) {
                    estado.consultas.push({
                      tabela,
                      campos,
                      campoObra,
                      obraIds,
                      campoUsuario,
                      userId,
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
globalThis.__painelAutorCarregarCapitulosPorLotes = async (configuracao) => {
  estado.chamadasPaginador.push({
    nomeColecao: configuracao.nomeColecao,
    itens: configuracao.itens,
  });
  await configuracao.buscarPaginaLote(estado.lote, 18, 43);
  if (estado.deveFalhar) {
    throw new Error("falha da paginação");
  }
  return estado.registros;
};

const loaderJavascript = typescript
  .transpileModule(
    loaderSource
      .replace(
        'import { supabase } from "../../../lib/supabase/client";',
        "const supabase = globalThis.__painelAutorCapitulosSupabase;",
      )
      .replace(
        'import { carregarTodasPaginasPorLotesSupabase } from "../../../lib/supabase/paginacao.mjs";',
        "const carregarTodasPaginasPorLotesSupabase = globalThis.__painelAutorCarregarCapitulosPorLotes;",
      ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  )
  .outputText;
const { carregarCapitulosPainelAutorSupabase } = await import(
  `data:text/javascript;base64,${Buffer.from(loaderJavascript).toString("base64")}`,
);

function prepararLoader({ registros = [], lote = [], deveFalhar = false } = {}) {
  estado.chamadasPaginador.length = 0;
  estado.consultas.length = 0;
  estado.registros = registros;
  estado.lote = lote;
  estado.deveFalhar = deveFalhar;
}

test("carregarCapitulosPainelAutorSupabase preserva paginação e query de capítulos", async () => {
  const registros = [{ id: "capitulo-1", obra_id: "obra-1" }];
  prepararLoader({ registros, lote: ["obra-1", "obra-2"] });

  assert.equal(
    await carregarCapitulosPainelAutorSupabase("usuario-1", ["obra-1", "obra-2"]),
    registros,
  );
  assert.deepEqual(estado.chamadasPaginador, [
    {
      nomeColecao: "capítulos do Painel do Autor",
      itens: ["obra-1", "obra-2"],
    },
  ]);
  assert.deepEqual(estado.consultas, [
    {
      tabela: "capitulos",
      campos: "id,obra_id,user_id,titulo,texto,ordem,publicado,criado_em,atualizado_em",
      campoObra: "obra_id",
      obraIds: ["obra-1", "obra-2"],
      campoUsuario: "user_id",
      userId: "usuario-1",
      ordenacoes: [
        { campo: "obra_id", opcoes: { ascending: true } },
        { campo: "ordem", opcoes: { ascending: true } },
        { campo: "id", opcoes: { ascending: true } },
      ],
      inicio: 18,
      fim: 43,
    },
  ]);
});

test("carregarCapitulosPainelAutorSupabase mantém fallback vazio e warning", async () => {
  prepararLoader({ lote: ["obra-1"], deveFalhar: true });
  const avisos = [];
  const warnOriginal = console.warn;
  console.warn = (...argumentos) => avisos.push(argumentos);
  try {
    assert.deepEqual(
      await carregarCapitulosPainelAutorSupabase("usuario-1", ["obra-1"]),
      [],
    );
  } finally {
    console.warn = warnOriginal;
  }
  assert.equal(avisos.length, 1);
  assert.equal(avisos[0][0], "Não consegui carregar capítulos no Painel do Autor:");
  assert.equal(avisos[0][1].message, "falha da paginação");
});

test("Painel do Autor delega somente o carregamento de capítulos Supabase", () => {
  assert.match(
    pagina,
    /import \{ carregarCapitulosPainelAutorSupabase \} from "\.\/lib\/painel-autor-supabase-chapters-loader";/,
  );
  assert.doesNotMatch(pagina, /carregarTodasPaginasPorLotesSupabase/);
  assert.doesNotMatch(pagina, /type SupabaseCapituloRow =/);
  assert.match(
    pagina,
    /const capitulosSupabaseBanco = await carregarCapitulosPainelAutorSupabase\([\s\S]*?userId,[\s\S]*?obraIds[\s\S]*?\);/,
  );
  assert.match(
    loaderSource,
    /carregarTodasPaginasPorLotesSupabase<CapituloPainelAutorSupabaseRow, string>\([\s\S]*?nomeColecao: "capítulos do Painel do Autor"/,
  );
  assert.match(
    loaderSource,
    /\.from\("capitulos"\)[\s\S]*?\.select\("id,obra_id,user_id,titulo,texto,ordem,publicado,criado_em,atualizado_em"\)[\s\S]*?\.in\("obra_id", obraIdsLote\)[\s\S]*?\.eq\("user_id", userId\)[\s\S]*?\.order\("obra_id", \{ ascending: true \}\)[\s\S]*?\.order\("ordem", \{ ascending: true \}\)[\s\S]*?\.order\("id", \{ ascending: true \}\)[\s\S]*?\.range\(inicio, fim\)/,
  );
});
