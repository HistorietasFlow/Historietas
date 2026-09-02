export const TAMANHO_PAGINA_SUPABASE = 500;

const MAXIMO_PAGINAS_SUPABASE = 10_000;

function exigirInteiroPositivo(valor, nome) {
  if (!Number.isSafeInteger(valor) || valor <= 0) {
    throw new TypeError(`${nome} deve ser um inteiro positivo.`);
  }
}

export function calcularIntervaloPaginaSupabase(
  pagina,
  tamanhoPagina = TAMANHO_PAGINA_SUPABASE,
) {
  if (!Number.isSafeInteger(pagina) || pagina < 0) {
    throw new TypeError("pagina deve ser um inteiro maior ou igual a zero.");
  }

  exigirInteiroPositivo(tamanhoPagina, "tamanhoPagina");

  const inicio = pagina * tamanhoPagina;

  if (!Number.isSafeInteger(inicio)) {
    throw new RangeError("O intervalo solicitado excede o limite seguro.");
  }

  return {
    inicio,
    fim: inicio + tamanhoPagina - 1,
  };
}

function criarErroPagina(nomeColecao, pagina, erro) {
  const mensagem =
    erro instanceof Error
      ? erro.message
      : typeof erro === "object" && erro && "message" in erro
        ? String(erro.message)
        : String(erro || "erro desconhecido");

  return new Error(
    `Falha ao carregar a página ${pagina + 1} de ${nomeColecao}: ${mensagem}`,
    erro instanceof Error ? { cause: erro } : undefined,
  );
}

/**
 * Percorre uma consulta Supabase por ranges inclusivos até receber uma página
 * incompleta. A consulta fornecida deve aplicar uma ordenação determinística.
 *
 * @template T
 * @param {{
 *   nomeColecao: string;
 *   buscarPagina: (
 *     inicio: number,
 *     fim: number,
 *     pagina: number,
 *   ) => Promise<{ data: T[] | null; error: unknown }>;
 *   tamanhoPagina?: number;
 *   maximoPaginas?: number;
 * }} opcoes
 * @returns {Promise<T[]>}
 */
export async function carregarTodasPaginasSupabase({
  nomeColecao,
  buscarPagina,
  tamanhoPagina = TAMANHO_PAGINA_SUPABASE,
  maximoPaginas = MAXIMO_PAGINAS_SUPABASE,
}) {
  if (typeof buscarPagina !== "function") {
    throw new TypeError("buscarPagina deve ser uma função.");
  }

  exigirInteiroPositivo(tamanhoPagina, "tamanhoPagina");
  exigirInteiroPositivo(maximoPaginas, "maximoPaginas");

  const nomeSeguro = String(nomeColecao || "registros").trim() || "registros";
  const registros = [];

  for (let pagina = 0; pagina < maximoPaginas; pagina += 1) {
    const { inicio, fim } = calcularIntervaloPaginaSupabase(
      pagina,
      tamanhoPagina,
    );
    const resposta = await buscarPagina(inicio, fim, pagina);

    if (resposta?.error) {
      throw criarErroPagina(nomeSeguro, pagina, resposta.error);
    }

    const dadosPagina = resposta?.data ?? [];

    if (!Array.isArray(dadosPagina)) {
      throw new TypeError(
        `A página ${pagina + 1} de ${nomeSeguro} não retornou uma lista.`,
      );
    }

    if (dadosPagina.length > tamanhoPagina) {
      throw new RangeError(
        `A página ${pagina + 1} de ${nomeSeguro} excedeu ${tamanhoPagina} registros.`,
      );
    }

    registros.push(...dadosPagina);

    if (dadosPagina.length < tamanhoPagina) {
      return registros;
    }
  }

  throw new RangeError(
    `${nomeSeguro} excedeu o máximo de ${maximoPaginas} páginas.`,
  );
}

/**
 * @template T
 * @param {T[]} itens
 * @param {number} tamanhoLote
 * @returns {T[][]}
 */
export function dividirEmLotesSupabase(itens, tamanhoLote) {
  exigirInteiroPositivo(tamanhoLote, "tamanhoLote");

  if (!Array.isArray(itens)) {
    throw new TypeError("itens deve ser uma lista.");
  }

  const lotes = [];

  for (let indice = 0; indice < itens.length; indice += tamanhoLote) {
    lotes.push(itens.slice(indice, indice + tamanhoLote));
  }

  return lotes;
}
