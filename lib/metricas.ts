import { supabase } from "./supabase/client";

export const VERSAO_CONTRATO_METRICAS = 1 as const;

const LIMITE_OBRAS_METRICAS = 100;
const LIMITE_CAPITULOS_METRICAS = 600;
const LIMITE_AUTORES_METRICAS = 100;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type EstadoMetricaUsuario = Readonly<{
  curtiu: boolean;
  salvou: boolean;
  seguiu: boolean;
  favoritou: boolean;
  concluiu: boolean;
  leu: boolean;
  lidoEm: string;
}>;

export type MetricasObra = Readonly<{
  tipo: "obra";
  id: string;
  visualizacoes: number;
  interacoesDiretas: Readonly<{
    curtidas: number;
    comentarios: number;
    seguidores: number;
    favoritos: number;
    concluidas: number;
    bibliotecasUnicas: number;
  }>;
  audiencia: Readonly<{
    curtidoresUnicos: number;
    comentaristasUnicos: number;
    salvadoresUnicos: number;
  }>;
  avaliacao: Readonly<{
    media: number;
    total: number;
    minhaNota: number;
  }>;
  comunidade: Readonly<{
    teorias: number;
    reviews: number;
    posts: number;
  }>;
  usuario: EstadoMetricaUsuario;
}>;

export type MetricasCapitulo = Readonly<{
  tipo: "capitulo";
  id: string;
  obraId: string;
  visualizacoes: number;
  interacoes: Readonly<{
    curtidas: number;
    comentarios: number;
    salvos: number;
  }>;
  usuario: EstadoMetricaUsuario;
}>;

export type MetricasAutor = Readonly<{
  tipo: "autor";
  id: string;
  seguidores: number;
  avaliacao: Readonly<{
    media: number;
    total: number;
    minhaNota: number;
  }>;
  usuario: EstadoMetricaUsuario;
}>;

export type ContratoMetricas = Readonly<{
  versao: typeof VERSAO_CONTRATO_METRICAS;
  carregado: boolean;
  obras: ReadonlyMap<string, MetricasObra>;
  capitulos: ReadonlyMap<string, MetricasCapitulo>;
  autores: ReadonlyMap<string, MetricasAutor>;
}>;

type ParametrosMetricas = Readonly<{
  obraIds?: readonly string[];
  capituloIds?: readonly string[];
  autorIds?: readonly string[];
}>;

type LinhaMetricaRpc = Record<string, unknown>;

function normalizarNumero(valor: unknown, maximo = Number.MAX_SAFE_INTEGER) {
  const numero = typeof valor === "number" ? valor : Number(valor);

  if (!Number.isFinite(numero)) {
    return 0;
  }

  return Math.min(Math.max(numero, 0), maximo);
}

function normalizarContador(valor: unknown) {
  return Math.trunc(normalizarNumero(valor));
}

function normalizarBooleano(valor: unknown) {
  return valor === true;
}

function normalizarTexto(valor: unknown) {
  return typeof valor === "string" ? valor.trim() : "";
}

function normalizarIds(ids: readonly string[] | undefined) {
  return Array.from(
    new Set(
      (ids || [])
        .map((id) => (typeof id === "string" ? id.trim() : ""))
        .filter((id) => UUID_PATTERN.test(id)),
    ),
  );
}

function dividirEmLotes(ids: readonly string[], tamanho: number) {
  return Array.from(
    { length: Math.ceil(ids.length / tamanho) },
    (_, indice) => ids.slice(indice * tamanho, (indice + 1) * tamanho),
  );
}

function criarEstadoUsuario(linha: LinhaMetricaRpc): EstadoMetricaUsuario {
  return {
    curtiu: normalizarBooleano(linha.curtido_por_mim),
    salvou: normalizarBooleano(linha.salvo_por_mim),
    seguiu: normalizarBooleano(linha.seguido_por_mim),
    favoritou: normalizarBooleano(linha.favorito_por_mim),
    concluiu: normalizarBooleano(linha.concluido_por_mim),
    leu: normalizarBooleano(linha.lido_por_mim),
    lidoEm: normalizarTexto(linha.lido_em),
  };
}

function contratoMetricasVazio(carregado: boolean): ContratoMetricas {
  return {
    versao: VERSAO_CONTRATO_METRICAS,
    carregado,
    obras: new Map<string, MetricasObra>(),
    capitulos: new Map<string, MetricasCapitulo>(),
    autores: new Map<string, MetricasAutor>(),
  };
}

function normalizarRespostaMetricas(data: unknown): ContratoMetricas {
  if (!Array.isArray(data)) {
    return contratoMetricasVazio(false);
  }

  const obras = new Map<string, MetricasObra>();
  const capitulos = new Map<string, MetricasCapitulo>();
  const autores = new Map<string, MetricasAutor>();

  for (const item of data) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return contratoMetricasVazio(false);
    }

    const linha = item as LinhaMetricaRpc;
    const versao = normalizarContador(linha.contrato_versao);
    const tipo = normalizarTexto(linha.tipo_conteudo);
    const id = normalizarTexto(linha.conteudo_id);

    if (versao !== VERSAO_CONTRATO_METRICAS || !UUID_PATTERN.test(id)) {
      return contratoMetricasVazio(false);
    }

    const usuario = criarEstadoUsuario(linha);

    if (tipo === "obra") {
      obras.set(id, {
        tipo,
        id,
        visualizacoes: normalizarContador(linha.visualizacoes),
        interacoesDiretas: {
          curtidas: normalizarContador(linha.curtidas),
          comentarios: normalizarContador(linha.comentarios),
          seguidores: normalizarContador(linha.seguidores),
          favoritos: normalizarContador(linha.favoritos),
          concluidas: normalizarContador(linha.concluidas),
          bibliotecasUnicas: normalizarContador(linha.salvos),
        },
        audiencia: {
          curtidoresUnicos: normalizarContador(linha.curtidores_unicos),
          comentaristasUnicos: normalizarContador(
            linha.comentaristas_unicos,
          ),
          salvadoresUnicos: normalizarContador(linha.salvadores_unicos),
        },
        avaliacao: {
          media: normalizarNumero(linha.avaliacao_media, 5),
          total: normalizarContador(linha.avaliacoes),
          minhaNota: normalizarNumero(linha.minha_avaliacao, 5),
        },
        comunidade: {
          teorias: normalizarContador(linha.teorias),
          reviews: normalizarContador(linha.reviews),
          posts: normalizarContador(linha.posts),
        },
        usuario,
      });
      continue;
    }

    if (tipo === "capitulo") {
      const obraId = normalizarTexto(linha.obra_id);

      if (!UUID_PATTERN.test(obraId)) {
        return contratoMetricasVazio(false);
      }

      capitulos.set(id, {
        tipo,
        id,
        obraId,
        visualizacoes: normalizarContador(linha.visualizacoes),
        interacoes: {
          curtidas: normalizarContador(linha.curtidas),
          comentarios: normalizarContador(linha.comentarios),
          salvos: normalizarContador(linha.salvos),
        },
        usuario,
      });
      continue;
    }

    if (tipo !== "autor") {
      return contratoMetricasVazio(false);
    }

    autores.set(id, {
      tipo,
      id,
      seguidores: normalizarContador(linha.seguidores),
      avaliacao: {
        media: normalizarNumero(linha.avaliacao_media, 5),
        total: normalizarContador(linha.avaliacoes),
        minhaNota: normalizarNumero(linha.minha_avaliacao, 5),
      },
      usuario,
    });
  }

  return {
    versao: VERSAO_CONTRATO_METRICAS,
    carregado: true,
    obras,
    capitulos,
    autores,
  };
}

export async function carregarMetricasConteudos({
  obraIds,
  capituloIds,
  autorIds,
}: ParametrosMetricas): Promise<ContratoMetricas> {
  const obras = normalizarIds(obraIds);
  const capitulos = normalizarIds(capituloIds);
  const autores = normalizarIds(autorIds);

  if (obras.length === 0 && capitulos.length === 0 && autores.length === 0) {
    return contratoMetricasVazio(true);
  }

  const lotesObras = dividirEmLotes(obras, LIMITE_OBRAS_METRICAS);
  const lotesCapitulos = dividirEmLotes(
    capitulos,
    LIMITE_CAPITULOS_METRICAS,
  );
  const lotesAutores = dividirEmLotes(autores, LIMITE_AUTORES_METRICAS);
  const totalLotes = Math.max(
    lotesObras.length,
    lotesCapitulos.length,
    lotesAutores.length,
  );
  const obrasResultado = new Map<string, MetricasObra>();
  const capitulosResultado = new Map<string, MetricasCapitulo>();
  const autoresResultado = new Map<string, MetricasAutor>();

  try {
    for (let indice = 0; indice < totalLotes; indice += 1) {
      const { data, error } = await supabase.rpc("obter_metricas_conteudos", {
        p_obra_ids: lotesObras[indice] || [],
        p_capitulo_ids: lotesCapitulos[indice] || [],
        p_autor_ids: lotesAutores[indice] || [],
      });

      if (error) {
        console.warn(
          "Não consegui carregar o contrato de métricas:",
          error.message,
        );
        return contratoMetricasVazio(false);
      }

      const lote = normalizarRespostaMetricas(data);

      if (!lote.carregado) {
        return contratoMetricasVazio(false);
      }

      lote.obras.forEach((metrica, id) => obrasResultado.set(id, metrica));
      lote.capitulos.forEach((metrica, id) =>
        capitulosResultado.set(id, metrica),
      );
      lote.autores.forEach((metrica, id) =>
        autoresResultado.set(id, metrica),
      );
    }

    return {
      versao: VERSAO_CONTRATO_METRICAS,
      carregado: true,
      obras: obrasResultado,
      capitulos: capitulosResultado,
      autores: autoresResultado,
    };
  } catch (error) {
    console.warn("Não consegui acessar o contrato de métricas agora:", error);
    return contratoMetricasVazio(false);
  }
}
