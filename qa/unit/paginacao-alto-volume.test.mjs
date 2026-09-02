import assert from "node:assert/strict";
import test from "node:test";

import {
  calcularIntervaloPaginaSupabase,
  carregarTodasPaginasSupabase,
  dividirEmLotesSupabase,
} from "../../lib/supabase/paginacao.mjs";

function criarRegistros(prefixo, quantidade) {
  return Array.from({ length: quantidade }, (_, indice) => ({
    id: `${prefixo}-${String(indice + 1).padStart(6, "0")}`,
    ordem: indice,
  }));
}

async function executarCenarioPaginado({
  nomeColecao,
  quantidade,
  tamanhoPagina,
}) {
  const origem = criarRegistros(nomeColecao, quantidade);
  const intervalos = [];
  const resultado = await carregarTodasPaginasSupabase({
    nomeColecao,
    tamanhoPagina,
    async buscarPagina(inicio, fim) {
      intervalos.push([inicio, fim]);

      return {
        data: origem.slice(inicio, fim + 1),
        error: null,
      };
    },
  });

  assert.equal(resultado.length, quantidade);
  assert.deepEqual(
    resultado.map((registro) => registro.id),
    origem.map((registro) => registro.id),
  );
  assert.equal(new Set(resultado.map((registro) => registro.id)).size, quantidade);

  return intervalos;
}

test("calcula ranges inclusivos sem lacunas entre páginas", () => {
  assert.deepEqual(calcularIntervaloPaginaSupabase(0, 50), {
    inicio: 0,
    fim: 49,
  });
  assert.deepEqual(calcularIntervaloPaginaSupabase(1, 50), {
    inicio: 50,
    fim: 99,
  });
  assert.deepEqual(calcularIntervaloPaginaSupabase(24, 500), {
    inicio: 12_000,
    fim: 12_499,
  });
});

test("pagina 137 posts em blocos de 50", async () => {
  const intervalos = await executarCenarioPaginado({
    nomeColecao: "posts",
    quantidade: 137,
    tamanhoPagina: 50,
  });

  assert.deepEqual(intervalos, [
    [0, 49],
    [50, 99],
    [100, 149],
  ]);
});

test("pagina 2.501 comentários além do teto padrão do Data API", async () => {
  const intervalos = await executarCenarioPaginado({
    nomeColecao: "comentarios",
    quantidade: 2_501,
    tamanhoPagina: 500,
  });

  assert.equal(intervalos.length, 6);
  assert.deepEqual(intervalos.at(-1), [2_500, 2_999]);
});

test("pagina 5.001 curtidas sem truncar nem duplicar registros", async () => {
  const intervalos = await executarCenarioPaginado({
    nomeColecao: "curtidas",
    quantidade: 5_001,
    tamanhoPagina: 500,
  });

  assert.equal(intervalos.length, 11);
  assert.deepEqual(intervalos.at(-1), [5_000, 5_499]);
});

test("pagina 1.201 obras em blocos menores que o limite do servidor", async () => {
  const intervalos = await executarCenarioPaginado({
    nomeColecao: "obras",
    quantidade: 1_201,
    tamanhoPagina: 200,
  });

  assert.equal(intervalos.length, 7);
  assert.deepEqual(intervalos.at(-1), [1_200, 1_399]);
});

test("consulta uma página vazia adicional quando o total é múltiplo exato", async () => {
  const intervalos = await executarCenarioPaginado({
    nomeColecao: "curtidas",
    quantidade: 1_000,
    tamanhoPagina: 500,
  });

  assert.deepEqual(intervalos, [
    [0, 499],
    [500, 999],
    [1_000, 1_499],
  ]);
});

test("propaga a página e a coleção quando o Supabase falha", async () => {
  await assert.rejects(
    carregarTodasPaginasSupabase({
      nomeColecao: "comentarios",
      tamanhoPagina: 500,
      async buscarPagina(inicio) {
        if (inicio === 500) {
          return {
            data: null,
            error: new Error("timeout simulado"),
          };
        }

        return {
          data: criarRegistros("comentario", 500),
          error: null,
        };
      },
    }),
    /página 2 de comentarios: timeout simulado/,
  );
});

test("divide muitos ids de comentários em lotes seguros para filtros in", () => {
  const ids = criarRegistros("comentario", 2_501).map((registro) => registro.id);
  const lotes = dividirEmLotesSupabase(ids, 100);

  assert.equal(lotes.length, 26);
  assert.equal(lotes[0].length, 100);
  assert.equal(lotes.at(-1).length, 1);
  assert.deepEqual(lotes.flat(), ids);
});
