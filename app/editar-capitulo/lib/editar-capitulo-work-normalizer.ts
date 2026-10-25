import { criarSlugBase } from "../../../lib/utils";
import { normalizarCapitulo } from "./editar-capitulo-chapter-normalizer";
import { normalizarArquivoObra } from "./editar-capitulo-file-normalization";
import {
  calcularProgressoLeitura,
  normalizarNumeroEditarCapitulo,
} from "./editar-capitulo-metrics-utils";

type CapituloParaNormalizarObra = {
  id?: string;
  titulo?: string;
  texto?: string;
  curtiu?: boolean;
  salvo?: boolean;
  comentario?: string;
  criadoEm?: string;
  lido?: boolean;
  lidoEm?: string;
  publicado?: boolean;
  ordem?: number;
};

type ObraParaNormalizar = {
  id?: string;
  titulo?: string;
  autor?: string;
  autorId?: string;
  genero?: string;
  formato?: string;
  classificacaoIndicativa?: string;
  sinopse?: string;
  tags?: string[];
  capa?: string;
  capaNome?: string;
  arquivoObra?: unknown;
  publicado?: boolean;
  capitulos?: CapituloParaNormalizarObra[];
  criadaEm?: string;
  ultimoCapituloLidoId?: string;
  ultimaLeituraEm?: string;
  slug?: string;
  link?: string;
};

type ObraNormalizada = {
  id: string;
  titulo: string;
  autor: string;
  autorId: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  arquivoObra: ReturnType<typeof normalizarArquivoObra>;
  publicado: boolean;
  capitulos: ReturnType<typeof normalizarCapitulo>[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  visualizacoes: number;
  totalCurtidas: number;
  totalComentarios: number;
  totalSalvos: number;
  totalLidos: number;
  totalFavoritos: number;
  totalConcluidas: number;
  slug: string;
  link: string;
};

export function normalizarObra(
  obra: ObraParaNormalizar,
  index: number,
): ObraNormalizada {
  const capitulosNormalizados = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapitulo(capitulo, capituloIndex)
      )
    : [];

  const tagsNormalizadas = Array.isArray(obra.tags)
    ? obra.tags
        .filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
        .map((tag) => tag.trim())
    : [];

  return {
    id:
      typeof obra.id === "string" && obra.id.trim()
        ? obra.id
        : `obra-${index + 1}`,
    titulo:
      typeof obra.titulo === "string" && obra.titulo.trim()
        ? obra.titulo
        : "Obra sem título",
    autor:
      typeof obra.autor === "string" && obra.autor.trim()
        ? obra.autor
        : "Autor não informado",
    autorId:
      typeof obra.autorId === "string" && obra.autorId.trim()
        ? obra.autorId.trim()
        : "",
    genero:
      typeof obra.genero === "string" && obra.genero.trim()
        ? obra.genero
        : "Não informado",
    formato:
      typeof obra.formato === "string" && obra.formato.trim()
        ? obra.formato
        : "Não informado",
    classificacaoIndicativa:
      typeof obra.classificacaoIndicativa === "string" &&
      obra.classificacaoIndicativa.trim()
        ? obra.classificacaoIndicativa
        : "Não informada",
    sinopse:
      typeof obra.sinopse === "string" && obra.sinopse.trim()
        ? obra.sinopse
        : "Nenhuma sinopse informada.",
    tags: tagsNormalizadas.length > 0 ? tagsNormalizadas : ["sem tags"],
    capa: typeof obra.capa === "string" ? obra.capa : "",
    capaNome: typeof obra.capaNome === "string" ? obra.capaNome : "",
    arquivoObra: normalizarArquivoObra(obra.arquivoObra),
    publicado: Boolean(obra.publicado),
    capitulos: capitulosNormalizados,
    criadaEm: typeof obra.criadaEm === "string" ? obra.criadaEm : "",
    ultimoCapituloLidoId:
      typeof obra.ultimoCapituloLidoId === "string"
        ? obra.ultimoCapituloLidoId
        : "",
    ultimaLeituraEm:
      typeof obra.ultimaLeituraEm === "string" ? obra.ultimaLeituraEm : "",
    progressoLeitura: calcularProgressoLeitura(capitulosNormalizados),
    visualizacoes: normalizarNumeroEditarCapitulo(
      (obra as Record<string, unknown>).visualizacoes ??
        (obra as Record<string, unknown>).views ??
        (obra as Record<string, unknown>).visualizacoesTotal ??
        (obra as Record<string, unknown>).totalVisualizacoes ??
        (obra as Record<string, unknown>).total_visualizacoes,
    ),
    totalCurtidas: normalizarNumeroEditarCapitulo(
      (obra as Record<string, unknown>).totalCurtidas ??
        (obra as Record<string, unknown>).curtidas ??
        (obra as Record<string, unknown>).likes ??
        (obra as Record<string, unknown>).totalLikes ??
        (obra as Record<string, unknown>).total_curtidas,
      capitulosNormalizados.filter((capitulo) => capitulo.curtiu).length,
    ),
    totalComentarios: normalizarNumeroEditarCapitulo(
      (obra as Record<string, unknown>).totalComentarios ??
        (obra as Record<string, unknown>).comentarios ??
        (obra as Record<string, unknown>).totalComments ??
        (obra as Record<string, unknown>).total_comentarios,
      capitulosNormalizados.filter((capitulo) =>
        capitulo.comentario.trim(),
      ).length,
    ),
    totalSalvos: normalizarNumeroEditarCapitulo(
      (obra as Record<string, unknown>).totalSalvos ??
        (obra as Record<string, unknown>).salvos ??
        (obra as Record<string, unknown>).total_salvos,
      capitulosNormalizados.filter((capitulo) => capitulo.salvo).length,
    ),
    totalLidos: normalizarNumeroEditarCapitulo(
      (obra as Record<string, unknown>).totalLidos ??
        (obra as Record<string, unknown>).lidos ??
        (obra as Record<string, unknown>).leituras ??
        (obra as Record<string, unknown>).total_lidos,
      capitulosNormalizados.filter((capitulo) => capitulo.lido).length,
    ),
    totalFavoritos: normalizarNumeroEditarCapitulo(
      (obra as Record<string, unknown>).totalFavoritos ??
        (obra as Record<string, unknown>).favoritos ??
        (obra as Record<string, unknown>).total_favoritos,
    ),
    totalConcluidas: normalizarNumeroEditarCapitulo(
      (obra as Record<string, unknown>).totalConcluidas ??
        (obra as Record<string, unknown>).concluidas ??
        (obra as Record<string, unknown>).total_concluidas,
    ),
    slug:
      typeof obra.slug === "string" && obra.slug.trim()
        ? obra.slug
        : criarSlugBase(
            typeof obra.titulo === "string" && obra.titulo.trim()
              ? obra.titulo
              : `obra-${index + 1}`
          ),
    link:
      typeof obra.link === "string" && obra.link.trim()
        ? obra.link
        : `/obra/${
            typeof obra.slug === "string" && obra.slug.trim()
              ? obra.slug
              : criarSlugBase(
                  typeof obra.titulo === "string" && obra.titulo.trim()
                    ? obra.titulo
                    : `obra-${index + 1}`
                )
          }`,
  };
}
