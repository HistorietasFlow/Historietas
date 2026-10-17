import { criarSlugBase } from "../../../lib/utils";
import { normalizarNumeroSeguindo } from "./seguindo-format-utils";
import { encontrarObraLocalSeguindo } from "./seguindo-work-collection-utils";
import {
  calcularProgressoLeitura,
  obterTotalRegistroObraSeguindo,
  somarTotaisCapitulosSeguindo,
} from "./seguindo-work-metrics-utils";

type CapituloLocalConversao = {
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

export type ObraLocalConversao = {
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
  publicado: boolean;
  capitulos: CapituloLocalConversao[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  slug: string;
  link: string;
  totalCurtidas?: number;
  totalComentarios?: number;
  totalSalvos?: number;
  totalLidos?: number;
  totalSeguidores?: number;
  totalFavoritas?: number;
  totalConcluidas?: number;
};

type SupabaseObraConversao = {
  id: string;
  user_id?: string | null;
  titulo: string | null;
  autor: string | null;
  genero: string | null;
  formato: string | null;
  classificacao_indicativa: string | null;
  sinopse: string | null;
  tags: string[] | null;
  capa_url: string | null;
  capa_nome: string | null;
  publicado: boolean | null;
  slug: string | null;
  link: string | null;
  criada_em: string | null;
};

type SupabaseCapituloConversao = {
  id: string;
  titulo: string | null;
  criado_em: string | null;
};

type TotaisInteracoesConversao = {
  curtidasPorObra: Record<string, number>;
  comentariosPorObra: Record<string, number>;
  salvosPorObra: Record<string, number>;
  lidosPorObra: Record<string, number>;
  seguidoresPorObra: Record<string, number>;
  favoritasPorObra: Record<string, number>;
  concluidasPorObra: Record<string, number>;
  curtidasPorCapitulo: Record<string, number>;
  comentariosPorCapitulo: Record<string, number>;
  salvosPorCapitulo: Record<string, number>;
  lidosPorCapitulo: Record<string, number>;
};

const totaisInteracoesSeguindoVazios: TotaisInteracoesConversao = {
  curtidasPorObra: {},
  comentariosPorObra: {},
  salvosPorObra: {},
  lidosPorObra: {},
  seguidoresPorObra: {},
  favoritasPorObra: {},
  concluidasPorObra: {},
  curtidasPorCapitulo: {},
  comentariosPorCapitulo: {},
  salvosPorCapitulo: {},
  lidosPorCapitulo: {},
};

export function converterObraSupabaseParaLocal({
  obraBanco,
  capitulosBanco,
  obraLocal,
  capitulosSalvos,
  capitulosCurtidos,
  progressoPorCapitulo,
  progressoCarregado,
  comentariosCapitulos,
  totaisReais = totaisInteracoesSeguindoVazios,
  index,
}: {
  obraBanco: SupabaseObraConversao;
  capitulosBanco: SupabaseCapituloConversao[];
  obraLocal?: ObraLocalConversao;
  capitulosSalvos: Set<string>;
  capitulosCurtidos: Set<string>;
  progressoPorCapitulo: Map<string, string>;
  progressoCarregado: boolean;
  comentariosCapitulos: Map<string, string>;
  totaisReais?: TotaisInteracoesConversao;
  index: number;
}): ObraLocalConversao {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo]),
  );

  let ultimoCapituloLidoId = progressoCarregado
    ? ""
    : obraLocal?.ultimoCapituloLidoId || "";
  let ultimaLeituraEm = progressoCarregado
    ? ""
    : obraLocal?.ultimaLeituraEm || "";

  const capitulosRemotos = capitulosBanco.map((capitulo, capituloIndex) => {
    const capituloLocal = capitulosLocaisPorId.get(capitulo.id);
    const comentarioSupabase = comentariosCapitulos.get(capitulo.id) || "";
    const temProgressoRemoto = progressoPorCapitulo.has(capitulo.id);
    const lido = progressoCarregado
      ? temProgressoRemoto
      : Boolean(capituloLocal?.lido);
    const lidoEmRemoto = progressoPorCapitulo.get(capitulo.id) || "";
    const lidoEm = lido
      ? lidoEmRemoto || capituloLocal?.lidoEm || ""
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
        capituloLocal?.titulo ||
        `Capítulo ${capituloIndex + 1}`,
      texto: capituloLocal?.texto || "",
      curtiu:
        Boolean(capituloLocal?.curtiu) || capitulosCurtidos.has(capitulo.id),
      salvo:
        Boolean(capituloLocal?.salvo) || capitulosSalvos.has(capitulo.id),
      comentario: comentarioSupabase || capituloLocal?.comentario || "",
      criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
      lido,
      lidoEm,
      publicado: true,
    };
  });

  const capitulosMesclados = capitulosRemotos;
  const tituloObra =
    obraBanco.titulo?.trim() || obraLocal?.titulo || "Obra sem título";
  const slugObra =
    obraBanco.slug?.trim() ||
    obraLocal?.slug ||
    criarSlugBase(tituloObra || `obra-${index + 1}`);
  const totalCurtidasUsuariosObra = obterTotalRegistroObraSeguindo(
    obraBanco.id,
    totaisReais.curtidasPorObra,
  );
  const totalComentariosUsuariosObra = obterTotalRegistroObraSeguindo(
    obraBanco.id,
    totaisReais.comentariosPorObra,
  );
  const totalSalvosUsuariosObra = obterTotalRegistroObraSeguindo(
    obraBanco.id,
    totaisReais.salvosPorObra,
  );
  const totalLidosUsuariosObra = obterTotalRegistroObraSeguindo(
    obraBanco.id,
    totaisReais.lidosPorObra,
  );
  const totalSeguidoresObra = obterTotalRegistroObraSeguindo(
    obraBanco.id,
    totaisReais.seguidoresPorObra,
  );
  const totalFavoritasObra = obterTotalRegistroObraSeguindo(
    obraBanco.id,
    totaisReais.favoritasPorObra,
  );
  const totalConcluidasObra = obterTotalRegistroObraSeguindo(
    obraBanco.id,
    totaisReais.concluidasPorObra,
  );
  const totalCurtidasCapitulos = somarTotaisCapitulosSeguindo(
    capitulosBanco,
    totaisReais.curtidasPorCapitulo,
  );
  const totalComentariosCapitulos = somarTotaisCapitulosSeguindo(
    capitulosBanco,
    totaisReais.comentariosPorCapitulo,
  );
  const totalSalvosCapitulos = somarTotaisCapitulosSeguindo(
    capitulosBanco,
    totaisReais.salvosPorCapitulo,
  );
  const totalLidosCapitulos = somarTotaisCapitulosSeguindo(
    capitulosBanco,
    totaisReais.lidosPorCapitulo,
  );

  return {
    id: obraBanco.id || obraLocal?.id || `obra-${index + 1}`,
    titulo: tituloObra,
    autor:
      obraBanco.autor?.trim() || obraLocal?.autor || "Autor não informado",
    autorId: obraBanco.user_id?.trim() || obraLocal?.autorId || "",
    genero: obraBanco.genero?.trim() || obraLocal?.genero || "Não informado",
    formato: obraBanco.formato?.trim() || obraLocal?.formato || "Não informado",
    classificacaoIndicativa:
      obraBanco.classificacao_indicativa?.trim() ||
      obraLocal?.classificacaoIndicativa ||
      "Não informada",
    sinopse:
      obraBanco.sinopse?.trim() ||
      obraLocal?.sinopse ||
      "Nenhuma sinopse informada.",
    tags:
      Array.isArray(obraBanco.tags) && obraBanco.tags.length > 0
        ? obraBanco.tags.filter(
            (tag) => typeof tag === "string" && Boolean(tag.trim()),
          )
        : obraLocal?.tags || ["sem tags"],
    capa: obraBanco.capa_url?.trim() || obraLocal?.capa || "",
    capaNome: obraBanco.capa_nome?.trim() || obraLocal?.capaNome || "",
    publicado: Boolean(obraBanco.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obraBanco.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId,
    ultimaLeituraEm,
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    slug: slugObra,
    link: obraBanco.link?.trim() || obraLocal?.link || `/obra/${slugObra}`,
    totalCurtidas: Math.max(
      normalizarNumeroSeguindo(obraLocal?.totalCurtidas, 0),
      totalCurtidasUsuariosObra,
      totalCurtidasCapitulos,
    ),
    totalComentarios: Math.max(
      normalizarNumeroSeguindo(obraLocal?.totalComentarios, 0),
      totalComentariosUsuariosObra,
      totalComentariosCapitulos,
    ),
    totalSalvos: Math.max(
      normalizarNumeroSeguindo(obraLocal?.totalSalvos, 0),
      totalSalvosUsuariosObra,
      totalSalvosCapitulos,
      totalSeguidoresObra,
      totalFavoritasObra,
    ),
    totalLidos: Math.max(
      normalizarNumeroSeguindo(obraLocal?.totalLidos, 0),
      totalLidosUsuariosObra,
      totalLidosCapitulos,
    ),
    totalSeguidores: Math.max(
      normalizarNumeroSeguindo(obraLocal?.totalSeguidores, 0),
      totalSeguidoresObra,
    ),
    totalFavoritas: Math.max(
      normalizarNumeroSeguindo(obraLocal?.totalFavoritas, 0),
      totalFavoritasObra,
    ),
    totalConcluidas: Math.max(
      normalizarNumeroSeguindo(obraLocal?.totalConcluidas, 0),
      totalConcluidasObra,
    ),
  };
}

export function converterObrasSupabaseParaLocais({
  obrasBanco,
  capitulosBanco,
  obrasLocais,
  capitulosSalvos,
  capitulosCurtidos,
  progressoPorCapitulo,
  progressoCarregado,
  comentariosCapitulos,
  totaisReais,
}: {
  obrasBanco: SupabaseObraConversao[];
  capitulosBanco: Array<SupabaseCapituloConversao & { obra_id: string }>;
  obrasLocais: ObraLocalConversao[];
  capitulosSalvos: Set<string>;
  capitulosCurtidos: Set<string>;
  progressoPorCapitulo: Map<string, string>;
  progressoCarregado: boolean;
  comentariosCapitulos: Map<string, string>;
  totaisReais: TotaisInteracoesConversao;
}) {
  return obrasBanco.map((obraBanco, index) => {
    const obraLocal = encontrarObraLocalSeguindo(obrasLocais, obraBanco);
    const capitulosDaObra = capitulosBanco.filter(
      (capitulo) => capitulo.obra_id === obraBanco.id,
    );

    return converterObraSupabaseParaLocal({
      obraBanco,
      capitulosBanco: capitulosDaObra,
      obraLocal,
      capitulosSalvos,
      capitulosCurtidos,
      progressoPorCapitulo,
      progressoCarregado,
      comentariosCapitulos,
      totaisReais,
      index,
    });
  });
}
