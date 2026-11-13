import { supabase } from "../../../lib/supabase/client";
import { criarSlugBase } from "../../../lib/utils";
import { carregarMetricasConteudos } from "../../../lib/metricas";
import {
  listarPaginaCatalogo,
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

export type ResultadoCarregamentoCatalogoExplorar = {
  obras: ObraLocal[];
  pagina: PaginaCatalogo | null;
  falhaTemporaria: boolean;
};

export type FiltroColecaoCatalogoExplorar = Readonly<{
  tipo: "favoritas" | "concluidas" | "lendo" | "sem-leitura";
  obraIds: readonly string[];
}>;

type ResultadoIdsColecaoExplorar = {
  ids: string[];
  falhaTemporaria: boolean;
};

async function carregarIdsColecaoUsuarioExplorarComStatus(
  tabela: "favoritos" | "concluidas" | "progresso_leitura",
  userId: string,
): Promise<ResultadoIdsColecaoExplorar> {
  if (!userId.trim()) {
    return { ids: [], falhaTemporaria: false };
  }

  try {
    const data = await carregarTodasPaginasSupabase<{ obra_id: string }>({
      nomeColecao: `${tabela} do Explorar`,
      buscarPagina: async (inicio, fim) => {
        const consultas = {
          favoritos: () =>
            supabase
              .from("favoritos")
              .select("obra_id")
              .eq("user_id", userId)
              .order("obra_id", { ascending: true })
              .range(inicio, fim),
          concluidas: () =>
            supabase
              .from("concluidas")
              .select("obra_id")
              .eq("user_id", userId)
              .order("obra_id", { ascending: true })
              .range(inicio, fim),
          progresso_leitura: () =>
            supabase
              .from("progresso_leitura")
              .select("obra_id")
              .eq("user_id", userId)
              .eq("lido", true)
              .order("obra_id", { ascending: true })
              .range(inicio, fim),
        };

        return consultas[tabela]();
      },
    });

    return {
      ids: Array.from(
        new Set(
          data
            .map((registro) => {
              if (
                !registro ||
                typeof registro !== "object" ||
                Array.isArray(registro)
              ) {
                return "";
              }

              const obraId = (registro as Record<string, unknown>).obra_id;

              return typeof obraId === "string" ? obraId.trim() : "";
            })
            .filter(Boolean),
        ),
      ),
      falhaTemporaria: false,
    };
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} no Explorar:`, error);
    return { ids: [], falhaTemporaria: true };
  }
}

export async function carregarIdsColecaoUsuarioExplorar(
  tabela: "favoritos" | "concluidas",
  userId: string
) {
  return (
    await carregarIdsColecaoUsuarioExplorarComStatus(tabela, userId)
  ).ids;
}

export async function carregarColecoesUsuarioExplorar(userId: string) {
  const [favoritas, concluidas, comLeitura] = await Promise.all([
    carregarIdsColecaoUsuarioExplorarComStatus("favoritos", userId),
    carregarIdsColecaoUsuarioExplorarComStatus("concluidas", userId),
    carregarIdsColecaoUsuarioExplorarComStatus("progresso_leitura", userId),
  ]);

  return {
    favoritas: favoritas.ids,
    concluidas: concluidas.ids,
    comLeitura: comLeitura.ids,
    falhaTemporaria:
      favoritas.falhaTemporaria ||
      concluidas.falhaTemporaria ||
      comLeitura.falhaTemporaria,
  };
}

export async function listarPaginaCatalogoColecaoExplorar(
  consulta: ConsultaCatalogo,
  filtroColecao: FiltroColecaoCatalogoExplorar,
): Promise<PaginaCatalogo> {
  const obraIdsColecao = new Set(
    filtroColecao.obraIds.map((id) => id.trim()).filter(Boolean),
  );
  const incluiColecao = filtroColecao.tipo !== "sem-leitura";
  const limite = Math.min(50, Math.max(1, consulta.limite || 24));

  if (incluiColecao && obraIdsColecao.size === 0) {
    return { obraIds: [], proximoCursor: null, temMais: false };
  }

  const obraIdsEncontrados: string[] = [];
  let cursor = consulta.cursor || null;
  let proximoCursor: PaginaCatalogo["proximoCursor"] = null;

  do {
    const pagina = await listarPaginaCatalogo({
      ...consulta,
      limite,
      cursor,
    });

    pagina.obraIds.forEach((obraId) => {
      const pertenceColecao = obraIdsColecao.has(obraId);

      if (
        (incluiColecao && pertenceColecao) ||
        (!incluiColecao && !pertenceColecao)
      ) {
        obraIdsEncontrados.push(obraId);
      }
    });

    proximoCursor = pagina.proximoCursor;
    cursor = pagina.proximoCursor;
  } while (obraIdsEncontrados.length < limite && proximoCursor);

  return {
    obraIds: Array.from(new Set(obraIdsEncontrados)),
    proximoCursor,
    temMais: Boolean(proximoCursor),
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
  filtroColecao: FiltroColecaoCatalogoExplorar | null = null,
  acumularObrasLocais = false,
): Promise<ResultadoCarregamentoCatalogoExplorar> {
  try {
    let obraIdsCatalogo: readonly string[] = [];
    let catalogoDisponivel = true;
    let paginaCatalogo: PaginaCatalogo | null = null;
    let falhaTemporaria = false;

    try {
      let selecao;

      if (filtroColecao) {
        const paginaColecao = await listarPaginaCatalogoColecaoExplorar(
          consultasCatalogo[0] || {},
          filtroColecao,
        );
        selecao = {
          obraIds: paginaColecao.obraIds,
          paginas: [paginaColecao],
        };
      } else {
        selecao = await listarSelecaoCatalogo(consultasCatalogo);
      }
      obraIdsCatalogo = selecao.obraIds;
      paginaCatalogo = selecao.paginas.length === 1 ? selecao.paginas[0] : null;
    } catch (error) {
      if (consultasCatalogo.some(consulta => consulta.palavrasMinimas != null || consulta.palavrasMaximas != null)) {
        // Cache is preserved but cannot certify a measured range. Never retry
        // this failed bounded request with an unbounded table sample.
        return { obras: obrasLocais, pagina: null, falhaTemporaria: true };
      }
      if (filtroColecao) {
        const obraIdsColecao = new Set(filtroColecao.obraIds);
        const obrasFallback = acumularObrasLocais
          ? obrasLocais
          : obrasLocais.filter((obra) =>
              filtroColecao.tipo === "sem-leitura"
                ? !obraIdsColecao.has(obra.id)
                : obraIdsColecao.has(obra.id),
            );

        return {
          obras: await aplicarMetricasExplorar(obrasFallback, userId),
          pagina: null,
          falhaTemporaria: true,
        };
      }

      catalogoDisponivel = false;
      falhaTemporaria = true;
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
          obras: await aplicarMetricasExplorar(
            filtroColecao ? [] : obrasLocais,
            userId,
          ),
          pagina: paginaCatalogo,
          falhaTemporaria,
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

    const obrasLocaisSelecionadas = filtroColecao && !acumularObrasLocais
      ? obrasLocais.filter((obra) => obraIdsCatalogo.includes(obra.id))
      : obrasLocais;
    const idsObras = obrasSupabase.map((obra) => obra.id);
    // As mesmas leituras públicas, sem serializar perfis antes dos capítulos.
    const [nomesProfiles, capitulosBanco] = await Promise.all([
      carregarNomesProfilesExplorar([
        ...obrasLocaisSelecionadas.map((obra) => obra.autorId || ""),
        ...obrasSupabase.map((obra) => obra.user_id || ""),
      ]),
      (async () => {
        let capitulosBanco: SupabaseCapituloRow[] = [];
        if (idsObras.length === 0) return capitulosBanco;

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
          falhaTemporaria = true;
          console.warn("Não consegui carregar capítulos do Supabase no Explorar:", error);
        }
        return capitulosBanco;
      })(),
    ]);
    const obrasLocaisComProfiles = aplicarNomesProfilesEmObrasExplorar(
      obrasLocaisSelecionadas,
      nomesProfiles
    );

    if (obrasSupabase.length === 0) {
      return {
        obras: await aplicarMetricasExplorar(obrasLocaisComProfiles, userId),
        pagina: paginaCatalogo,
        falhaTemporaria,
      };
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
        const obraLocal = obrasLocaisSelecionadas.find((obraLocalAtual) => {
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

    if (!filtroColecao) {
      salvarBackupsArquivosObras(obrasComProgresso, userId);
      salvarJsonStorageUsuarioExplorar(STORAGE_KEY, userId, obrasComProgresso);
    }

    return {
      obras: obrasComProgresso,
      pagina: paginaCatalogo,
      falhaTemporaria,
    };
  } catch (error) {
    console.warn("Não consegui acessar o Supabase no Explorar:", error);
    const obraIdsColecao = new Set(filtroColecao?.obraIds || []);
    const obrasFallback = filtroColecao && !acumularObrasLocais
      ? obrasLocais.filter((obra) =>
          filtroColecao.tipo === "sem-leitura"
            ? !obraIdsColecao.has(obra.id)
            : obraIdsColecao.has(obra.id),
        )
      : obrasLocais;

    return {
      obras: await aplicarMetricasExplorar(obrasFallback, userId),
      pagina: null,
      falhaTemporaria: true,
    };
  }
}
