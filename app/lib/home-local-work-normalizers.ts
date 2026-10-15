import { criarSlugBase } from "../../lib/utils";
import { normalizarNumeroHome } from "./home-format-utils";
import { obraTemConteudoPublicoHome } from "./home-local-work-utils";
import { calcularProgressoLeitura } from "./home-reading-utils";

type CapituloLocalHome = {
  id: string;
  titulo: string;
  texto: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
  publicado?: boolean;
};

type ObraLocalHome = {
  id: string;
  titulo: string;
  autor: string;
  autorId?: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  arquivoObra?: unknown;
  publicado: boolean;
  capitulos: CapituloLocalHome[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  visualizacoes: number;
  totalCurtidas: number;
  totalComentarios: number;
  slug: string;
  link: string;
};

export function normalizarCapituloHome(
  capitulo: Partial<CapituloLocalHome>,
  index: number
): CapituloLocalHome {
  return {
    id:
      typeof capitulo.id === "string" && capitulo.id.trim()
        ? capitulo.id
        : `capitulo-${index + 1}`,
    titulo:
      typeof capitulo.titulo === "string" && capitulo.titulo.trim()
        ? capitulo.titulo
        : "Capítulo sem título",
    texto: typeof capitulo.texto === "string" ? capitulo.texto : "",
    curtiu: Boolean(capitulo.curtiu),
    salvo: Boolean(capitulo.salvo),
    comentario:
      typeof capitulo.comentario === "string" ? capitulo.comentario : "",
    criadoEm: typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
    lido: Boolean(capitulo.lido),
    lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
    publicado: capitulo.publicado !== false,
  };
}

export function normalizarObraHome(
  obra: Partial<ObraLocalHome> & Record<string, unknown>,
  index: number
): ObraLocalHome {
  const capitulosNormalizadosTodos: CapituloLocalHome[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapituloHome(
          capitulo as Partial<CapituloLocalHome>,
          capituloIndex
        )
      )
    : [];

  const capitulosNormalizados = capitulosNormalizadosTodos.filter(
    (capitulo) => capitulo.publicado !== false
  );

  const titulo =
    typeof obra.titulo === "string" && obra.titulo.trim()
      ? obra.titulo.trim()
      : "Obra sem título";

  const slug =
    typeof obra.slug === "string" && obra.slug.trim()
      ? obra.slug.trim()
      : criarSlugBase(titulo || `obra-${index + 1}`);

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
    titulo,
    autor:
      typeof obra.autor === "string" && obra.autor.trim()
        ? obra.autor
        : "Autor não informado",
    autorId:
      typeof obra.autorId === "string" && obra.autorId.trim()
        ? obra.autorId.trim()
        : typeof obra.user_id === "string" && obra.user_id.trim()
          ? obra.user_id.trim()
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
    arquivoObra: obra.arquivoObra,
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
    visualizacoes: normalizarNumeroHome(
      obra.visualizacoes ??
        obra.views ??
        obra.visualizacoesTotal ??
        obra.totalVisualizacoes ??
        obra.total_visualizacoes,
    ),
    totalCurtidas: normalizarNumeroHome(
      obra.totalCurtidas ??
        obra.curtidas ??
        obra.likes ??
        obra.totalLikes ??
        obra.total_curtidas,
      capitulosNormalizados.filter((capitulo) => capitulo.curtiu).length,
    ),
    totalComentarios: normalizarNumeroHome(
      obra.totalComentarios ??
        obra.comentarios ??
        obra.totalComments ??
        obra.total_comentarios,
      capitulosNormalizados.filter((capitulo) =>
        capitulo.comentario.trim(),
      ).length,
    ),
    slug,
    link:
      typeof obra.link === "string" && obra.link.trim()
        ? obra.link.trim()
        : `/obra/${slug}`,
  };
}

export function normalizarObrasHomeSalvas(valor: unknown) {
  if (!Array.isArray(valor)) {
    return [];
  }

  return valor
    .map((obra, index) =>
      normalizarObraHome(
        obra as Partial<ObraLocalHome> & Record<string, unknown>,
        index
      )
    )
    .filter((obra) => obra.publicado && obraTemConteudoPublicoHome(obra));
}
