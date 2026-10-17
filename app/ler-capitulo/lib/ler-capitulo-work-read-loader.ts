import { supabase } from "../../../lib/supabase/client";
import { carregarMetricasConteudos } from "../../../lib/metricas";
import {
  carregarTodasPaginasPorLotesSupabase,
  carregarTodasPaginasSupabase,
} from "../../../lib/supabase/paginacao.mjs";
import {
  calcularProgressoLeitura,
  mesclarObraSupabaseComLocal,
  type CapituloSupabaseRow,
  type ObraLocal,
} from "./ler-capitulo-work-normalization";

type RegistroComentarioCapitulo = {
  capitulo_id?: unknown;
  comentario?: unknown;
};

export async function carregarObraSupabase(
  obraId: string,
  obraLocal?: ObraLocal | null,
  userId = ""
) {
  const { data: obraSupabase, error: erroObra } = await supabase
    .from("obras")
    .select(
      "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,slug,link,criada_em,atualizado_em"
    )
    .eq("id", obraId)
    .limit(1)
    .maybeSingle();

  if (erroObra || !obraSupabase) {
    return null;
  }

  const obraBanco = obraSupabase;
  const autorId = obraBanco.user_id?.trim() || "";
  const usuarioEhDono = Boolean(userId && autorId === userId);

  if (!obraBanco.publicado && !usuarioEhDono) {
    return null;
  }

  let capitulosSupabase: CapituloSupabaseRow[] = [];

  try {
    capitulosSupabase = await carregarTodasPaginasSupabase<CapituloSupabaseRow>({
      nomeColecao: "capítulos da leitura",
      buscarPagina: async (inicio, fim) => {
        let query = supabase
          .from("capitulos")
          .select("id,obra_id,user_id,titulo,texto,ordem,publicado,visualizacoes,criado_em,atualizado_em")
          .eq("obra_id", obraId);

        if (!usuarioEhDono) {
          query = query.eq("publicado", true);
        }

        return query
          .order("ordem", { ascending: true })
          .order("id", { ascending: true })
          .range(inicio, fim);
      },
    });
  } catch {
    capitulosSupabase = [];
  }

  return mesclarObraSupabaseComLocal(
    obraBanco,
    capitulosSupabase,
    obraLocal,
    usuarioEhDono
  );
}

export async function aplicarInteracoesCapitulosSupabase(
  obra: ObraLocal,
  userId: string
): Promise<ObraLocal> {
  const capituloIds = obra.capitulos.map((capitulo) => capitulo.id).filter(Boolean);

  if (capituloIds.length === 0) {
    return obra;
  }

  const [metricas, comentariosResposta] = await Promise.all([
    carregarMetricasConteudos({
      obraIds: [obra.id],
      capituloIds,
    }),
    carregarTodasPaginasPorLotesSupabase<RegistroComentarioCapitulo, string>({
      nomeColecao: "comentários do leitor nos capítulos",
      itens: capituloIds,
      buscarPaginaLote: async (capituloIdsLote, inicio, fim) =>
        supabase
          .from("comentarios_capitulos")
          .select("id,capitulo_id,comentario,atualizado_em")
          .eq("user_id", userId)
          .in("capitulo_id", capituloIdsLote)
          .order("atualizado_em", { ascending: false })
          .order("id", { ascending: false })
          .range(inicio, fim),
    }).catch(() => [] as RegistroComentarioCapitulo[]),
  ]);
  const comentarios = new Map<string, string>();

  if (Array.isArray(comentariosResposta)) {
    comentariosResposta.forEach((item: unknown) => {
      const registro = item as RegistroComentarioCapitulo;

      if (
        typeof registro.capitulo_id === "string" &&
        typeof registro.comentario === "string"
      ) {
        comentarios.set(registro.capitulo_id, registro.comentario);
      }
    });
  }

  const progressoCarregado = metricas.carregado;
  let ultimoCapituloLidoId = "";
  let ultimaLeituraEm = "";

  const capitulos = obra.capitulos.map((capitulo) => {
    const metrica = metricas.capitulos.get(capitulo.id);
    const progressoRemotoDisponivel =
      progressoCarregado && Boolean(metrica);
    const lidoRemoto = progressoRemotoDisponivel
      ? Boolean(metrica?.usuario.leu)
      : capitulo.lido;
    const lidoEmRemoto = metrica?.usuario.lidoEm || "";
    const lidoEm = progressoRemotoDisponivel
      ? lidoRemoto
        ? lidoEmRemoto || capitulo.lidoEm
        : ""
      : capitulo.lidoEm;

    if (lidoRemoto) {
      const tempoAtual = new Date(lidoEm).getTime();
      const tempoUltimo = new Date(ultimaLeituraEm).getTime();

      if (
        !ultimoCapituloLidoId ||
        (Number.isFinite(tempoAtual) ? tempoAtual : 0) >=
          (Number.isFinite(tempoUltimo) ? tempoUltimo : 0)
      ) {
        ultimoCapituloLidoId = capitulo.id;
        ultimaLeituraEm = lidoEm;
      }
    }

    return {
      ...capitulo,
      curtiu: capitulo.curtiu || Boolean(metrica?.usuario.curtiu),
      salvo: capitulo.salvo || Boolean(metrica?.usuario.salvou),
      comentario: comentarios.has(capitulo.id)
        ? comentarios.get(capitulo.id) || ""
        : capitulo.comentario,
      lido: lidoRemoto,
      lidoEm,
    };
  });

  return {
    ...obra,
    capitulos,
    ultimoCapituloLidoId: progressoCarregado
      ? ultimoCapituloLidoId
      : obra.ultimoCapituloLidoId,
    ultimaLeituraEm: progressoCarregado
      ? ultimaLeituraEm
      : obra.ultimaLeituraEm,
    progressoLeitura: calcularProgressoLeitura(capitulos),
  };
}
