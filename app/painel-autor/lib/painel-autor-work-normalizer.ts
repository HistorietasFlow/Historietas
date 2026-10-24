import { criarSlugBase } from "../../../lib/utils";
import { normalizarCapitulo } from "./painel-autor-chapter-normalizer";
import { normalizarArquivoObra } from "./painel-autor-file-normalizer";
import { calcularProgressoLeitura } from "./painel-autor-reading-progress-utils";

type ObraParaNormalizacaoPainel = {
  id?: unknown;
  autorId?: unknown;
  user_id?: unknown;
  userId?: unknown;
  titulo?: unknown;
  autor?: unknown;
  genero?: unknown;
  formato?: unknown;
  classificacaoIndicativa?: unknown;
  sinopse?: unknown;
  tags?: unknown[];
  capa?: unknown;
  capaNome?: unknown;
  arquivoObra?: unknown;
  publicado?: unknown;
  capitulos?: Array<Record<string, unknown>>;
  criadaEm?: unknown;
  ultimoCapituloLidoId?: unknown;
  ultimaLeituraEm?: unknown;
  visualizacoes?: unknown;
  views?: unknown;
  total_visualizacoes?: unknown;
  slug?: unknown;
  link?: unknown;
  totalCurtidasPainel?: unknown;
  totalComentariosPainel?: unknown;
  totalSalvosPainel?: unknown;
  totalLidosPainel?: unknown;
};

type ObraNormalizadaPainel = {
  id: string;
  autorId: string;
  titulo: string;
  autor: string;
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
  slug: string;
  link: string;
  totalCurtidasPainel: number | undefined;
  totalComentariosPainel: number | undefined;
  totalSalvosPainel: number | undefined;
  totalLidosPainel: number | undefined;
};

export function normalizarObraPainel(
  obra: ObraParaNormalizacaoPainel,
  obraIndex: number
): ObraNormalizadaPainel {
  const capitulosNormalizados = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapitulo(capitulo, capituloIndex, obraIndex)
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
        : `obra-${obraIndex + 1}`,
    autorId:
      typeof obra.autorId === "string" && obra.autorId.trim()
        ? obra.autorId.trim()
        : typeof obra.user_id === "string" && obra.user_id.trim()
        ? obra.user_id.trim()
        : typeof obra.userId === "string" && obra.userId.trim()
        ? obra.userId.trim()
        : "",
    titulo:
      typeof obra.titulo === "string" && obra.titulo.trim()
        ? obra.titulo
        : "Obra sem título",
    autor:
      typeof obra.autor === "string" && obra.autor.trim()
        ? obra.autor
        : "Autor não informado",
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
    visualizacoes:
      typeof obra.visualizacoes === "number" &&
      Number.isFinite(obra.visualizacoes)
        ? Math.max(0, Math.round(obra.visualizacoes))
        : typeof obra.views === "number" && Number.isFinite(obra.views)
          ? Math.max(0, Math.round(obra.views))
          : typeof obra.total_visualizacoes === "number" &&
              Number.isFinite(obra.total_visualizacoes)
            ? Math.max(0, Math.round(obra.total_visualizacoes))
            : 0,
    slug:
      typeof obra.slug === "string" && obra.slug.trim()
        ? obra.slug
        : criarSlugBase(
            typeof obra.titulo === "string" && obra.titulo.trim()
              ? obra.titulo
              : `obra-${obraIndex + 1}`
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
                    : `obra-${obraIndex + 1}`
                )
          }`,
    totalCurtidasPainel:
      typeof obra.totalCurtidasPainel === "number" &&
      Number.isFinite(obra.totalCurtidasPainel)
        ? Math.max(0, Math.round(obra.totalCurtidasPainel))
        : undefined,
    totalComentariosPainel:
      typeof obra.totalComentariosPainel === "number" &&
      Number.isFinite(obra.totalComentariosPainel)
        ? Math.max(0, Math.round(obra.totalComentariosPainel))
        : undefined,
    totalSalvosPainel:
      typeof obra.totalSalvosPainel === "number" &&
      Number.isFinite(obra.totalSalvosPainel)
        ? Math.max(0, Math.round(obra.totalSalvosPainel))
        : undefined,
    totalLidosPainel:
      typeof obra.totalLidosPainel === "number" &&
      Number.isFinite(obra.totalLidosPainel)
        ? Math.max(0, Math.round(obra.totalLidosPainel))
        : undefined,
  };
}
