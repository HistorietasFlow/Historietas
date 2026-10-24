import { criarSlugBase } from "../../../lib/utils";
import { normalizarAvisosConteudo18, type AvisoConteudo18 } from "../../../lib/historietasAdultContent";
import { normalizarCapitulo } from "./editar-obra-chapter-normalizer";
import { normalizarArquivoObra } from "./editar-obra-file-normalization";
import {
  calcularProgressoLeitura,
  normalizarContadorEdicaoObra,
} from "./editar-obra-metrics-utils";

type CapituloNormalizado = ReturnType<typeof normalizarCapitulo>;
type ArquivoObraNormalizado = NonNullable<ReturnType<typeof normalizarArquivoObra>>;

type ObraNormalizada = {
  id: string;
  titulo: string;
  autor: string;
  autorId: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  avisosConteudo: AvisoConteudo18[];
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  arquivoObra: ArquivoObraNormalizado | null;
  publicado: boolean;
  capitulos: CapituloNormalizado[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  visualizacoes: number;
  totalCurtidas: number;
  totalComentarios: number;
  totalSalvos: number;
  totalLidos: number;
  slug: string;
  link: string;
};

export function normalizarObra(
  obra: Partial<ObraNormalizada>,
  index: number,
): ObraNormalizada {
  const capitulosNormalizados: CapituloNormalizado[] = Array.isArray(obra.capitulos)
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
      obra.classificacaoIndicativa.trim() &&
      obra.classificacaoIndicativa.trim() !== "Não informada" &&
      obra.classificacaoIndicativa.trim() !== "Não informado"
        ? obra.classificacaoIndicativa.trim()
        : "Livre",
    avisosConteudo: normalizarAvisosConteudo18(
      obra.avisosConteudo,
      obra.classificacaoIndicativa,
    ),
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
    visualizacoes: normalizarContadorEdicaoObra(obra.visualizacoes, 0),
    totalCurtidas: normalizarContadorEdicaoObra(
      obra.totalCurtidas,
      capitulosNormalizados.filter((capitulo) => capitulo.curtiu).length
    ),
    totalComentarios: normalizarContadorEdicaoObra(
      obra.totalComentarios,
      capitulosNormalizados.filter((capitulo) => capitulo.comentario.trim()).length
    ),
    totalSalvos: normalizarContadorEdicaoObra(
      obra.totalSalvos,
      capitulosNormalizados.filter((capitulo) => capitulo.salvo).length
    ),
    totalLidos: normalizarContadorEdicaoObra(
      obra.totalLidos,
      capitulosNormalizados.filter((capitulo) => capitulo.lido).length
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
