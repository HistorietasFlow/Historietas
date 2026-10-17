import { supabase } from "../../../lib/supabase/client";
import { criarSlugBase } from "../../../lib/utils";
import { carregarMetricasConteudos } from "../../../lib/metricas";
import {
  listarSelecaoCatalogo,
  type ConsultaCatalogo,
  type PaginaCatalogo,
} from "../../../lib/catalogo";
import {
  carregarTodasPaginasPorLotesSupabase,
  carregarTodasPaginasSupabase,
} from "../../../lib/supabase/paginacao.mjs";
import {
  normalizarContadorExplorar,
  calcularProgressoLeitura,
  obraTemConteudoPublicadoExplorar,
  normalizarObraSupabase,
  mesclarObrasSemDuplicar,
} from "./explorar-work-normalizers";
import type {
  ObraLocal,
  SupabaseObraRow,
  SupabaseCapituloRow,
} from "./explorar-work-normalizers";
import {
  salvarJsonStorageUsuarioExplorar,
  salvarBackupsArquivosObras,
} from "./explorar-local-storage";
import {
  carregarNomesProfilesExplorar,
  aplicarNomesProfilesEmObrasExplorar,
} from "./explorar-author-profile-utils";

export const STORAGE_KEY = "historietas-obras";
export const CONSULTAS_INICIAIS_CATALOGO_EXPLORAR = [
  { ordenacao: "recentes", limite: 50 },
  { ordenacao: "geral", limite: 24 },
  { ordenacao: "curtidas", limite: 12 },
  { ordenacao: "comentadas", limite: 12 },
  { ordenacao: "salvas", limite: 12 },
  { ordenacao: "capitulos", limite: 12 },
] as const satisfies readonly ConsultaCatalogo[];

export async function carregarIdsColecaoUsuarioExplorar(
  tabela: "favoritos" | "concluidas",
  userId: string
) {
  if (!userId.trim()) {
    return [] as string[];
  }

  try {
    const data = await carregarTodasPaginasSupabase<{ obra_id: string }>({
      nomeColecao: `${tabela} do Explorar`,
      buscarPagina: async (inicio, fim) =>
        supabase
          .from(tabela)
          .select("obra_id")
          .eq("user_id", userId)
          .order("obra_id", { ascending: true })
          .range(inicio, fim),
    });

    return data
      .map((registro) => {
        if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
          return "";
        }

        const obraId = (registro as Record<string, unknown>).obra_id;

        return typeof obraId === "string" ? obraId.trim() : "";
      })
      .filter(Boolean);
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} no Explorar:`, error);
    return [] as string[];
  }
}

export async function carregarColecoesUsuarioExplorar(userId: string) {
  const [favoritas, concluidas] = await Promise.all([
    carregarIdsColecaoUsuarioExplorar("favoritos", userId),
    carregarIdsColecaoUsuarioExplorar("concluidas", userId),
  ]);

  return {
    favoritas,
    concluidas,
  };
}


export async function aplicarMetricasExplorar(
  obrasParaAtualizar: ObraLocal[],
  userId: string,
) {
  const obraIds = Array.from(
    new Set(obrasParaAtualizar.map((obra) => obra.id.trim()).filter(Boolean)),
  );
  const capituloIds = Array.from(
    new Set(
      obrasParaAtualizar.flatMap((obra) =>
        obra.capitulos.map((capitulo) => capitulo.id.trim()).filter(Boolean),
      ),
    ),
  );

  if (obraIds.length === 0 && capituloIds.length === 0) {
    return obrasParaAtualizar;
  }

  const metricas = await carregarMetricasConteudos({ obraIds, capituloIds });

  if (!metricas.carregado) {
    return obrasParaAtualizar;
  }

  const aplicarProgresso = Boolean(userId.trim());

  return obrasParaAtualizar.map((obra) => {
    const metricaObra = metricas.obras.get(obra.id);
    let ultimoCapituloLidoId = aplicarProgresso
      ? ""
      : obra.ultimoCapituloLidoId;
    let ultimaLeituraEm = aplicarProgresso ? "" : obra.ultimaLeituraEm;

    const capitulos = obra.capitulos.map((capitulo) => {
      const metricaCapitulo = metricas.capitulos.get(capitulo.id);
      const progressoRemotoDisponivel =
        aplicarProgresso && Boolean(metricaCapitulo);
      const lido = progressoRemotoDisponivel
        ? Boolean(metricaCapitulo?.usuario.leu)
        : capitulo.lido;
      const lidoEm = progressoRemotoDisponivel && lido
        ? metricaCapitulo?.usuario.lidoEm || ""
        : capitulo.lidoEm;

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
        ...capitulo,
        lido,
        lidoEm,
        totalCurtidas:
          metricaCapitulo?.interacoes.curtidas ??
          normalizarContadorExplorar(capitulo.totalCurtidas),
        totalComentarios:
          metricaCapitulo?.interacoes.comentarios ??
          normalizarContadorExplorar(capitulo.totalComentarios),
        totalSalvos:
          metricaCapitulo?.interacoes.salvos ??
          normalizarContadorExplorar(capitulo.totalSalvos),
        // O contrato nunca transforma progresso privado em total publico.
        totalLidos: normalizarContadorExplorar(capitulo.totalLidos),
      };
    });

    return {
      ...obra,
      capitulos,
      ultimoCapituloLidoId,
      ultimaLeituraEm,
      progressoLeitura: calcularProgressoLeitura(capitulos),
      totalCurtidas:
        metricaObra?.audiencia.curtidoresUnicos ??
        normalizarContadorExplorar(obra.totalCurtidas),
      totalComentarios:
        metricaObra?.audiencia.comentaristasUnicos ??
        normalizarContadorExplorar(obra.totalComentarios),
      totalSalvos:
        metricaObra?.audiencia.salvadoresUnicos ??
        normalizarContadorExplorar(obra.totalSalvos),
      totalLidos: normalizarContadorExplorar(obra.totalLidos),
      totalFavoritos:
        metricaObra?.interacoesDiretas.favoritos ??
        normalizarContadorExplorar(obra.totalFavoritos),
      totalConcluidas:
        metricaObra?.interacoesDiretas.concluidas ??
        normalizarContadorExplorar(obra.totalConcluidas),
    };
  });
}
export async function carregarObrasPublicadasSupabase(
  obrasLocais: ObraLocal[],
  userId = "",
  consultasCatalogo: readonly ConsultaCatalogo[] =
    CONSULTAS_INICIAIS_CATALOGO_EXPLORAR,
): Promise<{ obras: ObraLocal[]; pagina: PaginaCatalogo | null }> {
  try {
    let obraIdsCatalogo: readonly string[] = [];
    let catalogoDisponivel = true;
    let paginaCatalogo: PaginaCatalogo | null = null;

    try {
      const selecao = await listarSelecaoCatalogo(consultasCatalogo);
      obraIdsCatalogo = selecao.obraIds;
      paginaCatalogo = selecao.paginas.length === 1 ? selecao.paginas[0] : null;
    } catch (error) {
      catalogoDisponivel = false;
      console.warn(
        "O catálogo paginado do Explorar ainda não está disponível; usando uma amostra limitada:",
        error,
      );
    }

    let consultaObras = supabase
      .from("obras")
      .select(
        "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,visualizacoes,slug,link,criada_em,atualizado_em"
      )
      .eq("publicado", true);

    if (catalogoDisponivel) {
      if (obraIdsCatalogo.length === 0) {
        return {
          obras: await aplicarMetricasExplorar(obrasLocais, userId),
          pagina: paginaCatalogo,
        };
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

    const obrasBanco = (obrasData || []) as SupabaseObraRow[];

    const obrasSupabase = obrasBanco.filter(
      (obra) => Boolean(obra.id)
    );

    const nomesProfiles = await carregarNomesProfilesExplorar([
      ...obrasLocais.map((obra) => obra.autorId || ""),
      ...obrasSupabase.map((obra) => obra.user_id || ""),
    ]);
    const obrasLocaisComProfiles = aplicarNomesProfilesEmObrasExplorar(
      obrasLocais,
      nomesProfiles
    );

    if (obrasSupabase.length === 0) {
      return {
        obras: await aplicarMetricasExplorar(obrasLocaisComProfiles, userId),
        pagina: paginaCatalogo,
      };
    }

    const idsObras = obrasSupabase.map((obra) => obra.id);
    let capitulosBanco: SupabaseCapituloRow[] = [];

    try {
      capitulosBanco =
        await carregarTodasPaginasPorLotesSupabase<SupabaseCapituloRow, string>({
          nomeColecao: "capítulos publicados do Explorar",
          itens: idsObras,
          buscarPaginaLote: async (obraIdsLote, inicio, fim) =>
            supabase
              .from("capitulos")
              .select("id,obra_id,user_id,titulo,ordem,publicado,criado_em,atualizado_em")
              .in("obra_id", obraIdsLote)
              .eq("publicado", true)
              .order("obra_id", { ascending: true })
              .order("ordem", { ascending: true })
              .order("id", { ascending: true })
              .range(inicio, fim),
        });
    } catch (error) {
      console.warn(
        "Não consegui carregar capítulos do Supabase no Explorar:",
        error,
      );
    }

    const capitulosPorObra = new Map<string, SupabaseCapituloRow[]>();

    capitulosBanco.forEach(
      (capitulo) => {
        const capitulosAtuais = capitulosPorObra.get(capitulo.obra_id) || [];
        capitulosAtuais.push(capitulo);
        capitulosPorObra.set(capitulo.obra_id, capitulosAtuais);
      }
    );

    const obrasSupabaseNormalizadas = obrasSupabase
      .map((obraBanco, index) => {
        const slugBanco = obraBanco.slug?.trim() || "";
        const obraLocal = obrasLocais.find((obraLocalAtual) => {
          const slugLocal =
            obraLocalAtual.slug || criarSlugBase(obraLocalAtual.titulo);

          return obraLocalAtual.id === obraBanco.id || slugLocal === slugBanco;
        });

        const obraNormalizada = normalizarObraSupabase(
          obraBanco,
          capitulosPorObra.get(obraBanco.id) || [],
          obraLocal,
          index
        );
        const nomeProfile =
          nomesProfiles.get(obraNormalizada.autorId || "") || "";

        return nomeProfile
          ? {
              ...obraNormalizada,
              autor: nomeProfile,
            }
          : obraNormalizada;
      })
      .filter((obra) => obraTemConteudoPublicadoExplorar(obra));

    const obrasMescladas = mesclarObrasSemDuplicar(
      obrasLocaisComProfiles,
      obrasSupabaseNormalizadas
    );
    const obrasComProgresso = await aplicarMetricasExplorar(
      obrasMescladas,
      userId,
    );

    salvarBackupsArquivosObras(obrasComProgresso, userId);
    salvarJsonStorageUsuarioExplorar(STORAGE_KEY, userId, obrasComProgresso);

    return {
      obras: obrasComProgresso,
      pagina: paginaCatalogo,
    };
  } catch (error) {
    console.warn("Não consegui acessar o Supabase no Explorar:", error);
    return {
      obras: await aplicarMetricasExplorar(obrasLocais, userId),
      pagina: null,
    };
  }
}
