import { listarSelecaoCatalogo, type ConsultaCatalogo } from "../../lib/catalogo";
import { carregarMetricasConteudos } from "../../lib/metricas";
import { supabase } from "../../lib/supabase/client";
import { carregarTodasPaginasPorLotesSupabase } from "../../lib/supabase/paginacao.mjs";
import { criarSlugBase } from "../../lib/utils";
import { carregarPerfisSupabaseHome } from "./home-author-profile-loader";
import { obraTemConteudoPublicoHome } from "./home-local-work-utils";
import { aplicarProgressoLeituraHome } from "./home-reading-progress-utils";
import { normalizarObraSupabaseHome } from "./home-supabase-work-normalizers";

type CapituloLocal = {
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

type ObraLocal = {
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
  capitulos: CapituloLocal[];
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

type SupabaseObraRow = {
  id: string;
  user_id: string;
  titulo: string | null;
  autor: string | null;
  genero: string | null;
  formato: string | null;
  classificacao_indicativa: string | null;
  sinopse: string | null;
  tags: string[] | null;
  capa_url: string | null;
  capa_nome: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  arquivo_tipo: string | null;
  arquivo_tamanho: number | null;
  arquivo_categoria: string | null;
  publicado: boolean | null;
  visualizacoes: number | null;
  slug: string | null;
  link: string | null;
  criada_em: string | null;
  atualizado_em: string | null;
};

type SupabaseCapituloRow = {
  id: string;
  obra_id: string;
  user_id: string | null;
  titulo: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

type SupabaseProgressoLeituraHomeRow = {
  obra_id: string | null;
  capitulo_id: string | null;
  lido: boolean | null;
  atualizado_em: string | null;
};

export const CONSULTAS_INICIAIS_CATALOGO_HOME = [
  { ordenacao: "recentes", limite: 50 },
  { ordenacao: "geral", limite: 12 },
  { ordenacao: "curtidas", limite: 12 },
  { ordenacao: "comentadas", limite: 12 },
  { ordenacao: "salvas", limite: 12 },
  { ordenacao: "capitulos", limite: 12 },
] as const satisfies readonly ConsultaCatalogo[];

export async function carregarObrasSupabaseHome(
  obrasLocais: ObraLocal[],
  userId = "",
  consultasCatalogo: readonly ConsultaCatalogo[] =
    CONSULTAS_INICIAIS_CATALOGO_HOME,
) {
  try {
    let obraIdsCatalogo: readonly string[] = [];
    let catalogoDisponivel = true;

    try {
      const selecao = await listarSelecaoCatalogo(consultasCatalogo);
      obraIdsCatalogo = selecao.obraIds;
    } catch (error) {
      catalogoDisponivel = false;
      console.warn(
        "O catálogo paginado da Home ainda não está disponível; usando uma amostra limitada:",
        error,
      );
    }

    let consultaObras = supabase
      .from("obras")
      .select(
        "id, user_id, titulo, autor, genero, formato, classificacao_indicativa, sinopse, tags, capa_url, capa_nome, arquivo_url, arquivo_nome, arquivo_tipo, arquivo_tamanho, arquivo_categoria, publicado, visualizacoes, slug, link, criada_em, atualizado_em"
      )
      .eq("publicado", true);

    if (catalogoDisponivel) {
      if (obraIdsCatalogo.length === 0) {
        return obrasLocais;
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
      return obrasLocais;
    }

    const perfisAutoresSupabase = await carregarPerfisSupabaseHome(
      obrasSupabase
        .map((obra) => obra.user_id || "")
        .filter(Boolean),
      userId
    );

    const obrasIds = obrasSupabase
      .map((obra) => obra.id)
      .filter((id): id is string => typeof id === "string" && Boolean(id.trim()));

    const capitulosPorObraId = new Map<string, SupabaseCapituloRow[]>();

    if (obrasIds.length > 0) {
      let capitulosBanco: SupabaseCapituloRow[] = [];

      try {
        capitulosBanco =
          await carregarTodasPaginasPorLotesSupabase<SupabaseCapituloRow, string>({
            nomeColecao: "capítulos publicados da Home",
            itens: obrasIds,
            buscarPaginaLote: async (obraIdsLote, inicio, fim) =>
              supabase
                .from("capitulos")
                .select("id, obra_id, user_id, titulo, ordem, publicado, criado_em, atualizado_em")
                .in("obra_id", obraIdsLote)
                .eq("publicado", true)
                .order("obra_id", { ascending: true })
                .order("ordem", { ascending: true })
                .order("id", { ascending: true })
                .range(inicio, fim),
          });
      } catch (error) {
        console.warn(
          "Não consegui carregar capítulos da Home no Supabase:",
          error,
        );
      }

      capitulosBanco.forEach((capitulo) => {
        const capitulosDaObra = capitulosPorObraId.get(capitulo.obra_id) || [];
        capitulosDaObra.push(capitulo);
        capitulosPorObraId.set(capitulo.obra_id, capitulosDaObra);
      });
    }

    const capituloParaObraId = new Map<string, string>();
    const progressoPorCapituloId =
      new Map<string, SupabaseProgressoLeituraHomeRow>();

    capitulosPorObraId.forEach((capitulosDaObra, obraId) => {
      capitulosDaObra.forEach((capitulo) => {
        if (capitulo.id) {
          capituloParaObraId.set(capitulo.id, obraId);
        }
      });
    });

    const capituloIdsPublicados = Array.from(capituloParaObraId.keys());
    const userIdLimpo = userId.trim();
    const metricas = await carregarMetricasConteudos({
      obraIds: obrasIds,
      capituloIds: capituloIdsPublicados,
    });
    const progressoHomeCarregado = metricas.carregado && Boolean(userIdLimpo);

    if (progressoHomeCarregado) {
      metricas.capitulos.forEach((metrica) => {
        if (!metrica.usuario.leu) {
          return;
        }

        progressoPorCapituloId.set(metrica.id, {
          obra_id: metrica.obraId,
          capitulo_id: metrica.id,
          lido: true,
          atualizado_em: metrica.usuario.lidoEm,
        });
      });
    }

    const obrasRemotas = obrasSupabase.map((obra, index) => {
      const obraLocal = obrasLocais.find((obraLocalAtual) => {
        const slugLocal = obraLocalAtual.slug || criarSlugBase(obraLocalAtual.titulo);
        const slugBanco = obra.slug?.trim() || "";

        return obraLocalAtual.id === obra.id || (slugBanco && slugLocal === slugBanco);
      });

      const perfilAutor = perfisAutoresSupabase.get(obra.user_id || "");
      const obraComAutorProfile: SupabaseObraRow = perfilAutor?.nome
        ? {
            ...obra,
            autor: perfilAutor.nome,
          }
        : obra;

      const obraNormalizada = aplicarProgressoLeituraHome(
        normalizarObraSupabaseHome(
          obraComAutorProfile,
          capitulosPorObraId.get(obra.id) || [],
          obraLocal,
          index
        ),
        progressoPorCapituloId,
        progressoHomeCarregado
      );
      const metrica = metricas.obras.get(obra.id);

      return {
        ...obraNormalizada,
        totalCurtidas: Math.max(
          obraNormalizada.totalCurtidas,
          metrica?.audiencia.curtidoresUnicos || 0,
        ),
        totalComentarios: Math.max(
          obraNormalizada.totalComentarios,
          metrica?.audiencia.comentaristasUnicos || 0,
        ),
      };
    });

    const idsRemotos = new Set(obrasRemotas.map((obra) => obra.id));
    const slugsRemotos = new Set(
      obrasRemotas.map((obra) => obra.slug || criarSlugBase(obra.titulo))
    );

    const obrasApenasLocais = obrasLocais.filter((obraLocalAtual) => {
      const slugLocal = obraLocalAtual.slug || criarSlugBase(obraLocalAtual.titulo);

      return !idsRemotos.has(obraLocalAtual.id) && !slugsRemotos.has(slugLocal);
    });

    const obrasAtualizadas = [...obrasRemotas, ...obrasApenasLocais].filter(
      (obra) => obra.publicado && obraTemConteudoPublicoHome(obra)
    );

    return obrasAtualizadas;
  } catch (error) {
    console.warn("Não consegui acessar o Supabase na Home:", error);
    return obrasLocais;
  }
}
