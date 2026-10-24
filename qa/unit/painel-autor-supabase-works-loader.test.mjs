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
    "../../app/painel-autor/lib/painel-autor-supabase-works-loader.ts",
    import.meta.url,
  ),
  "utf8",
);

const estado = {
  chamadasPaginador: [],
  consultas: [],
  registros: [],
  erro: null,
};
globalThis.__painelAutorObrasSupabase = {
  from(tabela) {
    return {
      select(campos) {
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
globalThis.__painelAutorCarregarObrasPaginadas = async (configuracao) => {
  estado.chamadasPaginador.push({
    nomeColecao: configuracao.nomeColecao,
  });
  await configuracao.buscarPagina(9, 31);
  if (estado.erro) {
    throw estado.erro;
  }
  return estado.registros;
};

const loaderJavascript = typescript
  .transpileModule(
    loaderSource
      .replace(
        'import { supabase } from "../../../lib/supabase/client";',
        "const supabase = globalThis.__painelAutorObrasSupabase;",
      )
      .replace(
        'import { carregarTodasPaginasSupabase } from "../../../lib/supabase/paginacao.mjs";',
        "const carregarTodasPaginasSupabase = globalThis.__painelAutorCarregarObrasPaginadas;",
      ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  )
  .outputText;
const { carregarObrasPainelAutorSupabase } = await import(
  `data:text/javascript;base64,${Buffer.from(loaderJavascript).toString("base64")}`,
);

function prepararLoader({ registros = [], erro = null } = {}) {
  estado.chamadasPaginador.length = 0;
  estado.consultas.length = 0;
  estado.registros = registros;
  estado.erro = erro;
}

test("carregarObrasPainelAutorSupabase preserva paginação e query de obras", async () => {
  const registros = [{ id: "obra-1", titulo: "Obra" }];
  prepararLoader({ registros });

  assert.equal(await carregarObrasPainelAutorSupabase("usuario-1"), registros);
  assert.deepEqual(estado.chamadasPaginador, [
    { nomeColecao: "obras do Painel do Autor" },
  ]);
  assert.deepEqual(estado.consultas, [
    {
      tabela: "obras",
      campos:
        "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,visualizacoes,publicado,slug,link,criada_em,atualizado_em",
      campoUsuario: "user_id",
      userId: "usuario-1",
      ordenacoes: [
        { campo: "criada_em", opcoes: { ascending: false } },
        { campo: "id", opcoes: { ascending: false } },
      ],
      inicio: 9,
      fim: 31,
    },
  ]);
});

test("carregarObrasPainelAutorSupabase propaga a falha para o fallback do painel", async () => {
  const erro = new Error("falha da paginação");
  prepararLoader({ erro });

  await assert.rejects(
    () => carregarObrasPainelAutorSupabase("usuario-1"),
    erro,
  );
});

test("Painel do Autor delega somente o carregamento de obras Supabase", () => {
  assert.match(
    pagina,
    /import \{ carregarObrasPainelAutorSupabase \} from "\.\/lib\/painel-autor-supabase-works-loader";/,
  );
  assert.doesNotMatch(pagina, /carregarTodasPaginasSupabase/);
  assert.doesNotMatch(pagina, /type SupabaseObraRow =/);
  assert.match(
    pagina,
    /const obrasSupabaseBanco = await carregarObrasPainelAutorSupabase\(userId\);/,
  );
  assert.match(
    loaderSource,
    /carregarTodasPaginasSupabase<ObraPainelAutorSupabaseRow>\([\s\S]*?nomeColecao: "obras do Painel do Autor"/,
  );
  assert.match(
    loaderSource,
    /\.from\("obras"\)[\s\S]*?\.select\([\s\S]*?"id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,visualizacoes,publicado,slug,link,criada_em,atualizado_em"[\s\S]*?\)[\s\S]*?\.eq\("user_id", userId\)[\s\S]*?\.order\("criada_em", \{ ascending: false \}\)[\s\S]*?\.order\("id", \{ ascending: false \}\)[\s\S]*?\.range\(inicio, fim\)/,
  );
  assert.doesNotMatch(loaderSource, /try\s*\{|catch\s*\(/);
});
