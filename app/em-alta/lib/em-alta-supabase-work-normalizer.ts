import { criarSlugBase } from "../../../lib/utils";
import {
  obterAvatarProfileAutorRanking,
  obterNomeProfileAutorRanking,
} from "./em-alta-author-profile-utils";
import { obterAvatarAutorLocalEmAlta } from "./em-alta-local-storage-utils";
import {
  calcularProgressoLeitura,
} from "./em-alta-ranking-data-utils";
import type {
  ArquivoObraLocal,
  AvaliacaoRankingObra,
  CapituloLocal,
  ObraLocal,
  SupabaseCapituloRow,
  SupabaseObraRow,
  SupabaseProfileAutorRankingRow,
  SupabaseProgressoLeituraEmAltaRow,
} from "./em-alta-models";

function normalizarTipoArquivoSupabase(
  tipo: string | null,
): ArquivoObraLocal["tipo"] {
  if (
    tipo === "imagem" ||
    tipo === "documento" ||
    tipo === "texto" ||
    tipo === "outro"
  ) {
    return tipo;
  }

  return "outro";
}

export function converterObraSupabaseParaLocal(
  obra: SupabaseObraRow,
  capitulos: SupabaseCapituloRow[],
  obraLocal: ObraLocal | undefined,
  index: number,
  curtidasUnicasPorObra: Record<string, number>,
  comentariosTotaisPorObra: Record<string, number>,
  salvosUnicosPorObra: Record<string, number>,
  seguidoresPorObra: Record<string, number>,
  avaliacoesPorObra: Record<string, AvaliacaoRankingObra>,
  profilesAutores: Map<string, SupabaseProfileAutorRankingRow>,
  seguidoresAutores: Record<string, number>,
  avataresLocaisAutores: Map<string, string>,
  progressoPorCapitulo:
    Map<string, SupabaseProgressoLeituraEmAltaRow>,
  progressoCarregado: boolean,
): ObraLocal {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo]),
  );

  let ultimoCapituloLidoId = progressoCarregado
    ? ""
    : obraLocal?.ultimoCapituloLidoId || "";
  let ultimaLeituraEm = progressoCarregado
    ? ""
    : obraLocal?.ultimaLeituraEm || "";

  const capitulosNormalizados = capitulos.map((capitulo, capituloIndex) => {
    const capituloLocal = capitulosLocaisPorId.get(capitulo.id);
    const chaveProgresso = `${obra.id}::${capitulo.id}`;
    const registroProgresso = progressoPorCapitulo.get(chaveProgresso);
    const lido = progressoCarregado
      ? registroProgresso?.lido === true
      : Boolean(capituloLocal?.lido);
    const lidoEm =
      lido && typeof registroProgresso?.atualizado_em === "string"
        ? registroProgresso.atualizado_em
        : lido
          ? capituloLocal?.lidoEm || ""
          : "";

    if (lido) {
      const tempoAtual = new Date(lidoEm).getTime();
      const tempoUltimo = new Date(ultimaLeituraEm).getTime();
      const tempoAtualSeguro = Number.isNaN(tempoAtual) ? 0 : tempoAtual;
      const tempoUltimoSeguro = Number.isNaN(tempoUltimo) ? 0 : tempoUltimo;

      if (!ultimoCapituloLidoId || tempoAtualSeguro >= tempoUltimoSeguro) {
        ultimoCapituloLidoId = capitulo.id;
        ultimaLeituraEm = lidoEm;
      }
    }

    return {
      id: capitulo.id,
      titulo:
        capitulo.titulo?.trim() ||
        `Capítulo ${capituloIndex + 1}`,
      texto: "",
      curtiu: Boolean(capituloLocal?.curtiu),
      salvo: Boolean(capituloLocal?.salvo),
      comentario: capituloLocal?.comentario || "",
      criadoEm: capitulo.criado_em || "",
      lido,
      lidoEm,
    } satisfies CapituloLocal;
  });

  const capitulosMesclados = capitulosNormalizados;
  const titulo = obra.titulo?.trim() || "Obra sem título";
  const slug =
    obra.slug?.trim() ||
    criarSlugBase(titulo || `obra-${index + 1}`);
  const arquivoUrl = obra.arquivo_url?.trim() || "";
  const arquivoTipo = normalizarTipoArquivoSupabase(obra.arquivo_categoria);
  const totalSeguidoresObra = seguidoresPorObra[obra.id] || 0;
  const avaliacaoObra = avaliacoesPorObra[obra.id] || { total: 0, media: 0 };
  const autorId = obra.user_id?.trim() || "";
  const profileAutor = autorId ? profilesAutores.get(autorId) || null : null;
  const nomeAutorProfile = obterNomeProfileAutorRanking(profileAutor);
  const nomeAutorObra = obra.autor?.trim() || "";
  const nomeAutor = nomeAutorProfile || nomeAutorObra || "Autor não informado";
  const avatarAutor =
    obterAvatarProfileAutorRanking(profileAutor) ||
    obterAvatarAutorLocalEmAlta(avataresLocaisAutores, nomeAutor, autorId) ||
    obterAvatarAutorLocalEmAlta(
      avataresLocaisAutores,
      nomeAutorObra,
      autorId,
    ) ||
    "";
  const totalSeguidoresAutor = autorId ? seguidoresAutores[autorId] || 0 : 0;

  return {
    id: obra.id || `obra-${index + 1}`,
    titulo,
    autor: nomeAutor,
    autorId,
    autorAvatarRanking: avatarAutor,
    genero: obra.genero?.trim() || "Não informado",
    formato: obra.formato?.trim() || "Não informado",
    classificacaoIndicativa:
      obra.classificacao_indicativa?.trim() ||
      "Não informada",
    sinopse:
      obra.sinopse?.trim() ||
      "Nenhuma sinopse informada.",
    tags:
      Array.isArray(obra.tags) && obra.tags.length > 0
        ? obra.tags.filter(
            (tag) => typeof tag === "string" && Boolean(tag.trim()),
          )
        : ["sem tags"],
    capa: obra.capa_url?.trim() || "",
    capaNome: obra.capa_nome?.trim() || "",
    publicado: Boolean(obra.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obra.criada_em || "",
    ultimoCapituloLidoId,
    ultimaLeituraEm,
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    slug,
    link: obra.link?.trim() || `/obra/${slug}`,
    arquivoObra: arquivoUrl
      ? {
          nome:
            obra.arquivo_nome?.trim() ||
            "Arquivo da obra",
          tipo: arquivoTipo,
          tamanho:
            typeof obra.arquivo_tamanho === "number" &&
            Number.isFinite(obra.arquivo_tamanho)
              ? obra.arquivo_tamanho
              : 0,
          conteudo: arquivoUrl,
          enviadoEm: obra.criada_em || "",
        }
      : null,
    totalCurtidasRanking: curtidasUnicasPorObra[obra.id] || 0,
    totalComentariosRanking: comentariosTotaisPorObra[obra.id] || 0,
    totalSalvosRanking: salvosUnicosPorObra[obra.id] || 0,
    totalViewsRanking:
      typeof obra.visualizacoes === "number" &&
      Number.isFinite(obra.visualizacoes)
        ? obra.visualizacoes
        : 0,
    totalSeguidoresRanking: totalSeguidoresObra,
    totalSeguidoresAutorRanking: totalSeguidoresAutor,
    totalAvaliacoesRanking: avaliacaoObra.total,
    mediaAvaliacoesRanking: avaliacaoObra.media,
  };
}
