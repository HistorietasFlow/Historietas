import { listarSelecaoCatalogo } from "../../../lib/catalogo";
import { carregarMetricasConteudos } from "../../../lib/metricas";
import { supabase } from "../../../lib/supabase/client";
import {
  carregarTodasPaginasPorLotesSupabase,
} from "../../../lib/supabase/paginacao.mjs";
import { criarSlugBase } from "../../../lib/utils";
import { carregarProfilesAutoresRanking } from "./em-alta-author-profile-loader";
import { carregarAvataresAutoresLocaisEmAlta } from "./em-alta-local-storage-utils";
import type {
  AvaliacaoRankingObra,
  ObraLocal,
  SupabaseCapituloRow,
  SupabaseObraRow,
  SupabaseProgressoLeituraEmAltaRow,
} from "./em-alta-models";
import { converterObraSupabaseParaLocal } from "./em-alta-supabase-work-normalizer";

export async function carregarObrasSupabasePublicadas(
  obrasLocais: ObraLocal[],
  userId = "",
) {
  try {
    let obraIdsCatalogo: readonly string[] = [];
    let catalogoDisponivel = true;

    try {
      const selecao = await listarSelecaoCatalogo(
        [
          { ordenacao: "geral", limite: 50 },
          { ordenacao: "lidas", limite: 5 },
          { ordenacao: "curtidas", limite: 5 },
          { ordenacao: "comentadas", limite: 5 },
          { ordenacao: "salvas", limite: 5 },
          { ordenacao: "recentes", limite: 5 },
          { ordenacao: "capitulos", limite: 5 },
        ] as const,
      );
      obraIdsCatalogo = selecao.obraIds;
    } catch (error) {
      catalogoDisponivel = false;
      console.warn(
        "O ranking paginado ainda não está disponível; usando uma amostra limitada:",
        error,
      );
    }

    let consultaObras = supabase
      .from("obras")
      .select(
        "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,visualizacoes,publicado,slug,link,criada_em,atualizado_em",
      )
      .eq("publicado", true);

    if (catalogoDisponivel) {
      if (obraIdsCatalogo.length === 0) {
        return [] as ObraLocal[];
      }

      consultaObras = consultaObras.in("id", [...obraIdsCatalogo]);
    } else {
      consultaObras = consultaObras
        .order("criada_em", { ascending: false })
        .order("id", { ascending: false })
        .range(0, 49);
    }

    const { data: obrasData, error: obrasError } = await consultaObras;

    if (obrasError) {
      throw obrasError;
    }

    const obrasSupabase = (obrasData || []) as SupabaseObraRow[];

    if (obrasSupabase.length === 0) {
      return [] as ObraLocal[];
    }

    const obraIds = obrasSupabase.map((obra) => obra.id).filter(Boolean);
    const autorIds = obrasSupabase
      .map((obra) => obra.user_id?.trim() || "")
      .filter(Boolean);
    const avataresLocaisAutores = carregarAvataresAutoresLocaisEmAlta(autorIds);

    let capitulosSupabase: SupabaseCapituloRow[] = [];

    try {
      capitulosSupabase =
        await carregarTodasPaginasPorLotesSupabase<SupabaseCapituloRow, string>({
          nomeColecao: "capítulos publicados do ranking",
          itens: obraIds,
          buscarPaginaLote: async (obraIdsLote, inicio, fim) =>
            supabase
              .from("capitulos")
              .select(
                "id,obra_id,user_id,titulo,ordem,publicado,criado_em,atualizado_em",
              )
              .in("obra_id", obraIdsLote)
              .eq("publicado", true)
              .order("obra_id", { ascending: true })
              .order("ordem", { ascending: true })
              .order("id", { ascending: true })
              .range(inicio, fim),
        });
    } catch (error) {
      console.warn(
        "Não consegui carregar capítulos publicados do ranking:",
        error,
      );
    }
    const capituloIds = capitulosSupabase
      .map((capitulo) => capitulo.id)
      .filter(Boolean);
    const [metricas, profilesAutores] = await Promise.all([
      carregarMetricasConteudos({
        obraIds,
        capituloIds,
        autorIds,
      }),
      carregarProfilesAutoresRanking(autorIds),
    ]);
    const curtidasUnicasPorObra: Record<string, number> = {};
    const comentariosTotaisPorObra: Record<string, number> = {};
    const salvosUnicosPorObra: Record<string, number> = {};
    const seguidoresPorObra: Record<string, number> = {};
    const avaliacoesPorObra: Record<string, AvaliacaoRankingObra> = {};
    const seguidoresAutores: Record<string, number> = {};
    const progressoPorCapitulo =
      new Map<string, SupabaseProgressoLeituraEmAltaRow>();

    metricas.obras.forEach((metrica) => {
      curtidasUnicasPorObra[metrica.id] =
        metrica.interacoesDiretas.curtidas;
      comentariosTotaisPorObra[metrica.id] =
        metrica.interacoesDiretas.comentarios;
      salvosUnicosPorObra[metrica.id] =
        metrica.interacoesDiretas.bibliotecasUnicas;
      seguidoresPorObra[metrica.id] =
        metrica.interacoesDiretas.seguidores;
      avaliacoesPorObra[metrica.id] = {
        total: metrica.avaliacao.total,
        media: metrica.avaliacao.media,
      };
    });

    metricas.autores.forEach((metrica) => {
      seguidoresAutores[metrica.id] = metrica.seguidores;
    });

    if (metricas.carregado && userId.trim()) {
      metricas.capitulos.forEach((metrica) => {
        if (!metrica.usuario.leu) {
          return;
        }

        progressoPorCapitulo.set(`${metrica.obraId}::${metrica.id}`, {
          obra_id: metrica.obraId,
          capitulo_id: metrica.id,
          lido: true,
          atualizado_em: metrica.usuario.lidoEm,
        });
      });
    }

    const progressoUsuario = {
      progressoPorCapitulo,
      carregado: metricas.carregado && Boolean(userId.trim()),
    };

    const capitulosPorObra = capitulosSupabase.reduce<
      Record<string, SupabaseCapituloRow[]>
    >((grupos, capitulo) => {
      if (!grupos[capitulo.obra_id]) {
        grupos[capitulo.obra_id] = [];
      }

      grupos[capitulo.obra_id].push(capitulo);

      return grupos;
    }, {});

    const obrasLocaisPorId = new Map(
      obrasLocais.map((obra) => [obra.id, obra]),
    );
    const obrasLocaisPorSlug = new Map(
      obrasLocais.map((obra) => [obra.slug, obra]),
    );

    return obrasSupabase
      .map((obra, index) => {
        const slug =
          obra.slug?.trim() || criarSlugBase(obra.titulo || `obra-${index + 1}`);
        const obraLocal =
          obrasLocaisPorId.get(obra.id) || obrasLocaisPorSlug.get(slug);

        return converterObraSupabaseParaLocal(
          obra,
          capitulosPorObra[obra.id] || [],
          obraLocal,
          index,
          curtidasUnicasPorObra,
          comentariosTotaisPorObra,
          salvosUnicosPorObra,
          seguidoresPorObra,
          avaliacoesPorObra,
          profilesAutores,
          seguidoresAutores,
          avataresLocaisAutores,
          progressoUsuario.progressoPorCapitulo,
          progressoUsuario.carregado,
        );
      })
      .filter((obra) => obra.capitulos.length > 0 || Boolean(obra.arquivoObra));
  } catch (error) {
    console.warn("Não consegui acessar o Supabase no Em Alta agora:", error);
    return [] as ObraLocal[];
  }
}
