import { criarSlugBase } from "../../../lib/utils";
import { normalizarCapitulo } from "./adicionar-capitulo-chapter-normalizer";
import { normalizarArquivoObra } from "./adicionar-capitulo-file-normalizer";
import { calcularProgressoLeitura } from "./adicionar-capitulo-metrics-utils";
import { obterCampoNumericoObraAdicionarCapitulo } from "./adicionar-capitulo-number-utils";

type ObraParaNormalizarAdicionarCapitulo = Record<string, unknown> & {
  id?: string; titulo?: string; autor?: string; autorId?: string; genero?: string; formato?: string;
  classificacaoIndicativa?: string; sinopse?: string; tags?: unknown; capa?: string; capaNome?: string;
  arquivoObra?: unknown; publicado?: unknown; capitulos?: Parameters<typeof normalizarCapitulo>[0][];
  criadaEm?: string; ultimoCapituloLidoId?: string; ultimaLeituraEm?: string; slug?: string; link?: string;
};
export function normalizarObra(obra: ObraParaNormalizarAdicionarCapitulo, index: number) {
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
  const obraComMetricas = obra as Record<string, unknown>;
  const totalCurtidasLocal = capitulosNormalizados.filter((capitulo) => capitulo.curtiu).length;
  const totalComentariosLocal = capitulosNormalizados.filter((capitulo) =>
    capitulo.comentario.trim()
  ).length;
  const totalSalvosLocal = capitulosNormalizados.filter((capitulo) => capitulo.salvo).length;
  const totalLidosLocal = capitulosNormalizados.filter((capitulo) => capitulo.lido).length;

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
        : typeof (obra as Record<string, unknown>).user_id === "string" &&
          ((obra as Record<string, unknown>).user_id as string).trim()
          ? ((obra as Record<string, unknown>).user_id as string).trim()
          : typeof (obra as Record<string, unknown>).userId === "string" &&
            ((obra as Record<string, unknown>).userId as string).trim()
            ? ((obra as Record<string, unknown>).userId as string).trim()
            : typeof (obra as Record<string, unknown>).autor_id === "string" &&
              ((obra as Record<string, unknown>).autor_id as string).trim()
              ? ((obra as Record<string, unknown>).autor_id as string).trim()
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
    visualizacoes: obterCampoNumericoObraAdicionarCapitulo(
      obraComMetricas,
      [
        "visualizacoes",
        "views",
        "visualizacoesTotal",
        "totalVisualizacoes",
        "total_visualizacoes",
      ]
    ),
    totalCurtidas: obterCampoNumericoObraAdicionarCapitulo(
      obraComMetricas,
      ["totalCurtidas", "curtidas", "likes", "totalLikes", "total_curtidas"],
      totalCurtidasLocal
    ),
    totalComentarios: obterCampoNumericoObraAdicionarCapitulo(
      obraComMetricas,
      [
        "totalComentarios",
        "comentarios",
        "comments",
        "totalComments",
        "total_comentarios",
      ],
      totalComentariosLocal
    ),
    totalSalvos: obterCampoNumericoObraAdicionarCapitulo(
      obraComMetricas,
      ["totalSalvos", "salvos", "favoritos", "totalFavoritos", "total_salvos"],
      totalSalvosLocal
    ),
    totalLidos: obterCampoNumericoObraAdicionarCapitulo(
      obraComMetricas,
      ["totalLidos", "lidos", "leituras", "totalLeituras", "total_lidos"],
      totalLidosLocal
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

