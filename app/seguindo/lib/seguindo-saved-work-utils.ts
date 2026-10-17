import { criarSlugBase } from "../../../lib/utils";
import { normalizarNumeroSeguindo } from "./seguindo-format-utils";
import { calcularProgressoLeitura } from "./seguindo-work-metrics-utils";

type CapituloSalvoSeguindo = Record<string, unknown>;

type ObraSalvaSeguindo = Record<string, unknown> & {
  capitulos?: CapituloSalvoSeguindo[];
};

function normalizarCapituloSalvo(
  capitulo: CapituloSalvoSeguindo,
  obraIndex: number,
  capituloIndex: number,
) {
  return {
    id:
      typeof capitulo.id === "string" && capitulo.id.trim()
        ? capitulo.id
        : `capitulo-${obraIndex + 1}-${capituloIndex + 1}`,
    titulo:
      typeof capitulo.titulo === "string" && capitulo.titulo.trim()
        ? capitulo.titulo
        : "Capítulo sem título",
    texto:
      typeof capitulo.texto === "string" && capitulo.texto.trim()
        ? capitulo.texto
        : "Nenhum texto foi escrito ainda.",
    curtiu: Boolean(capitulo.curtiu),
    salvo: Boolean(capitulo.salvo),
    comentario:
      typeof capitulo.comentario === "string" ? capitulo.comentario : "",
    criadoEm:
      typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
    lido: Boolean(capitulo.lido),
    lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
    publicado:
      typeof capitulo.publicado === "boolean" ? capitulo.publicado : true,
  };
}

export function normalizarObraSalva(
  obra: ObraSalvaSeguindo,
  obraIndex: number,
) {
  const capitulosNormalizadosTodos = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapituloSalvo(capitulo, obraIndex, capituloIndex),
      )
    : [];
  const capitulosNormalizados = capitulosNormalizadosTodos.filter(
    (capitulo) => capitulo.publicado !== false,
  );

  const titulo =
    typeof obra.titulo === "string" && obra.titulo.trim()
      ? obra.titulo
      : "Obra sem título";
  const slug =
    typeof obra.slug === "string" && obra.slug.trim()
      ? obra.slug
      : criarSlugBase(titulo || `obra-${obraIndex + 1}`);

  return {
    id:
      typeof obra.id === "string" && obra.id.trim()
        ? obra.id
        : `obra-${obraIndex + 1}`,
    titulo,
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
    tags: Array.isArray(obra.tags)
      ? obra.tags.filter((tag): tag is string => typeof tag === "string")
      : ["sem tags"],
    capa: typeof obra.capa === "string" ? obra.capa : "",
    capaNome: typeof obra.capaNome === "string" ? obra.capaNome : "",
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
    slug,
    link:
      typeof obra.link === "string" && obra.link.trim()
        ? obra.link
        : `/obra/${slug}`,
    totalCurtidas: normalizarNumeroSeguindo(
      obra.totalCurtidas ?? obra.curtidas ?? obra.likes ?? obra.total_curtidas,
      capitulosNormalizados.filter((capitulo) => capitulo.curtiu).length,
    ),
    totalComentarios: normalizarNumeroSeguindo(
      obra.totalComentarios ?? obra.comentarios ?? obra.total_comentarios,
      capitulosNormalizados.filter((capitulo) => capitulo.comentario.trim())
        .length,
    ),
    totalSalvos: normalizarNumeroSeguindo(
      obra.totalSalvos ?? obra.salvos ?? obra.total_salvos,
      capitulosNormalizados.filter((capitulo) => capitulo.salvo).length,
    ),
    totalLidos: normalizarNumeroSeguindo(
      obra.totalLidos ?? obra.lidos ?? obra.total_lidos,
      capitulosNormalizados.filter((capitulo) => capitulo.lido).length,
    ),
    totalSeguidores: normalizarNumeroSeguindo(
      obra.totalSeguidores ?? obra.seguidores ?? obra.total_seguidores,
      0,
    ),
    totalFavoritas: normalizarNumeroSeguindo(
      obra.totalFavoritas ?? obra.favoritas ?? obra.total_favoritas,
      0,
    ),
    totalConcluidas: normalizarNumeroSeguindo(
      obra.totalConcluidas ?? obra.concluidas ?? obra.total_concluidas,
      0,
    ),
  };
}
