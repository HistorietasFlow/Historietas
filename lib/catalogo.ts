import { supabase } from "./supabase/client";
import { normalizarTagCatalogo } from "./catalogo-tag";
import { normalizarNotaMinimaCatalogo } from "./catalogo-nota-minima";

export type OrdenacaoCatalogo =
  | "relevancia"
  | "geral"
  | "lidas"
  | "mais-curtidas"
  | "curtidas"
  | "mais-comentadas"
  | "comentadas"
  | "mais-salvas"
  | "salvas"
  | "mais-recentes"
  | "recentes"
  | "mais-capitulos"
  | "capitulos";

export type FiltroCapitulosCatalogo =
  | "todos"
  | "com-capitulos"
  | "sem-capitulos";

export type CursorCatalogo = Readonly<{
  valor: number;
  data: string;
  id: string;
}>;

export type ConsultaCatalogo = Readonly<{
  busca?: string;
  genero?: string;
  formato?: string;
  tag?: string;
  tagExcluida?: string;
  notaMinima?: number | null;
  classificacao?: string;
  filtroCapitulos?: FiltroCapitulosCatalogo;
  ordenacao?: OrdenacaoCatalogo;
  limite?: number;
  cursor?: CursorCatalogo | null;
}>;

export type PaginaCatalogo = Readonly<{
  obraIds: readonly string[];
  proximoCursor: CursorCatalogo | null;
  temMais: boolean;
}>;

type LinhaCatalogo = Readonly<{
  obra_id: string;
  cursor_valor: number;
  cursor_data: string;
  cursor_id: string;
  tem_mais: boolean;
}>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIMITE_PADRAO_CATALOGO = 24;
const LIMITE_MAXIMO_CATALOGO = 50;

function normalizarLimite(limite: number | undefined) {
  if (!Number.isFinite(limite)) {
    return LIMITE_PADRAO_CATALOGO;
  }

  return Math.min(
    LIMITE_MAXIMO_CATALOGO,
    Math.max(1, Math.trunc(limite || LIMITE_PADRAO_CATALOGO)),
  );
}

function normalizarLinhaCatalogo(linha: LinhaCatalogo) {
  const valor = Number(linha.cursor_valor);
  const data = typeof linha.cursor_data === "string" ? linha.cursor_data : "";
  const id = typeof linha.cursor_id === "string" ? linha.cursor_id : "";
  const obraId = typeof linha.obra_id === "string" ? linha.obra_id : "";

  if (
    !Number.isFinite(valor) ||
    !data ||
    Number.isNaN(new Date(data).getTime()) ||
    !UUID_PATTERN.test(id) ||
    !UUID_PATTERN.test(obraId) ||
    id !== obraId
  ) {
    return null;
  }

  return {
    obraId,
    cursor: {
      valor,
      data,
      id,
    } satisfies CursorCatalogo,
    temMais: linha.tem_mais === true,
  };
}

export async function listarPaginaCatalogo(
  consulta: ConsultaCatalogo = {},
): Promise<PaginaCatalogo> {
  const cursor = consulta.cursor || null;
  const tag = normalizarTagCatalogo(consulta.tag);
  const tagExcluida = normalizarTagCatalogo(consulta.tagExcluida);
  const notaMinima = normalizarNotaMinimaCatalogo(consulta.notaMinima);
  const parametros = {
    p_busca: consulta.busca?.trim() || "",
    p_genero: consulta.genero?.trim() || "",
    p_formato: consulta.formato?.trim() || "",
    p_classificacao: consulta.classificacao?.trim() || "",
    p_filtro_capitulos: consulta.filtroCapitulos || "todos",
    p_ordenacao: consulta.ordenacao || "relevancia",
    p_limite: normalizarLimite(consulta.limite),
    p_cursor_valor: cursor?.valor,
    p_cursor_data: cursor?.data,
    p_cursor_id: cursor?.id,
  };
  const { data, error } = await supabase.rpc("listar_obras_catalogo", tagExcluida ? {
    ...parametros, p_tag: tag, p_nota_minima: notaMinima, p_tag_excluida: tagExcluida,
    p_cursor_valor: cursor?.valor ?? null,
    p_cursor_data: cursor?.data ?? null,
    p_cursor_id: cursor?.id ?? null,
  } : notaMinima !== null ? {
    ...parametros, p_tag: tag, p_nota_minima: notaMinima,
    p_cursor_valor: cursor?.valor ?? null,
    p_cursor_data: cursor?.data ?? null,
    p_cursor_id: cursor?.id ?? null,
  } : tag ? {
    ...parametros, p_tag: tag,
    p_cursor_valor: cursor?.valor ?? null,
    p_cursor_data: cursor?.data ?? null,
    p_cursor_id: cursor?.id ?? null,
  } : parametros);

  if (error) {
    throw new Error(`Não foi possível consultar o catálogo: ${error.message}`);
  }

  const linhas = (data || [])
    .map((linha) => normalizarLinhaCatalogo(linha as LinhaCatalogo))
    .filter((linha): linha is NonNullable<typeof linha> => Boolean(linha));
  const ultimaLinha = linhas.at(-1);

  return {
    obraIds: Array.from(new Set(linhas.map((linha) => linha.obraId))),
    proximoCursor: ultimaLinha?.temMais ? ultimaLinha.cursor : null,
    temMais: Boolean(ultimaLinha?.temMais),
  };
}

export async function listarSelecaoCatalogo(
  consultas: readonly ConsultaCatalogo[],
) {
  const paginas = await Promise.all(
    consultas.map((consulta) => listarPaginaCatalogo(consulta)),
  );

  return {
    obraIds: Array.from(
      new Set(paginas.flatMap((pagina) => pagina.obraIds)),
    ),
    paginas,
  } as const;
}
