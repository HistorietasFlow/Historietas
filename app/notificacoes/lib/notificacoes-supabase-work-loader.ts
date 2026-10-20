import { supabase } from "../../../lib/supabase/client";
import { calcularProgressoLeitura } from "./notificacoes-local-normalizers";
import {
  normalizarCapituloSupabase,
  normalizarObraSupabase,
} from "./notificacoes-record-normalizers";
import type {
  SupabaseCapituloRow,
  SupabaseObraRow,
} from "./notificacoes-record-normalizers";
import {
  criarObraFallbackNotificacaoDireta,
  extrairTituloCapituloDeMensagemNotificacao,
} from "./notificacoes-work-fallback-utils";
import type {
  CapituloLocal,
  NotificacaoLocal,
  ObraLocal,
} from "./notificacoes-models";

export async function carregarObrasPublicadasSupabase() {
  try {
    const { data: obrasData, error: obrasError } = await supabase
      .from("obras")
      .select(
        "id,titulo,autor,user_id,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,slug,link,publicado,criada_em"
      )
      .eq("publicado", true)
      .order("criada_em", { ascending: false })
      .limit(120);

    if (obrasError || !Array.isArray(obrasData)) {
      return [];
    }

    const obrasSupabase = obrasData.map((obra, index) =>
      normalizarObraSupabase(obra, index)
    );

    const idsObras = obrasSupabase.map((obra) => obra.id).filter(Boolean);

    if (idsObras.length === 0) {
      return obrasSupabase;
    }

    const { data: capitulosData, error: capitulosError } = await supabase
      .from("capitulos")
      .select("id,obra_id,titulo,ordem,publicado,criado_em")
      .in("obra_id", idsObras)
      .eq("publicado", true)
      .order("ordem", { ascending: true })
      .limit(1000);

    if (capitulosError || !Array.isArray(capitulosData)) {
      return obrasSupabase;
    }

    const capitulosPorObra = new Map<string, CapituloLocal[]>();

    capitulosData.forEach((capitulo, index) => {
      const capituloNormalizado = normalizarCapituloSupabase(
        capitulo,
        index
      );

      if (!capituloNormalizado.obraId) {
        return;
      }

      const capitulosAtuais =
        capitulosPorObra.get(capituloNormalizado.obraId) || [];
      const { obraId: _obraId, ...capituloSemObraId } = capituloNormalizado;
      void _obraId;

      capitulosPorObra.set(capituloNormalizado.obraId, [
        ...capitulosAtuais,
        capituloSemObraId,
      ]);
    });

    return obrasSupabase.map((obra) => {
      const capitulos = capitulosPorObra.get(obra.id) || [];

      return {
        ...obra,
        capitulos,
        progressoLeitura: calcularProgressoLeitura(capitulos),
      };
    });
  } catch {
    return [];
  }
}

export async function carregarObrasDasNotificacoesDiretasSupabase(
  notificacoesDiretas: NotificacaoLocal[]
): Promise<ObraLocal[]> {
  const obraIds = Array.from(
    new Set(
      notificacoesDiretas
        .map((notificacao) => notificacao.obraId.trim())
        .filter(Boolean)
    )
  );
  const capituloIds = Array.from(
    new Set(
      notificacoesDiretas
        .map((notificacao) => notificacao.capituloId.trim())
        .filter(Boolean)
    )
  );

  if (obraIds.length === 0 && capituloIds.length === 0) {
    return [];
  }

  const obrasPorId = new Map<string, ObraLocal>();
  const capitulosPorObra = new Map<string, CapituloLocal[]>();

  if (obraIds.length > 0) {
    const selecoesObras = [
      "id,titulo,autor,user_id,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,slug,publicado,criada_em",
      "id,titulo,autor,user_id,slug,publicado,criada_em",
      "id,titulo,slug,publicado,user_id",
      "id,titulo,slug,publicado",
      "id,titulo,slug",
    ];

    for (const campos of selecoesObras) {
      try {
        const { data: obrasData, error: obrasError } = await supabase
          .from("obras")
          .select(campos)
          .in("id", obraIds)
          .limit(obraIds.length);

        if (obrasError || !Array.isArray(obrasData)) {
          continue;
        }

        obrasData.forEach((obra, index) => {
          const obraNormalizada = normalizarObraSupabase(
            obra as unknown as SupabaseObraRow,
            index
          );

          if (obraNormalizada.id) {
            obrasPorId.set(obraNormalizada.id, obraNormalizada);
          }
        });

        break;
      } catch {
        // Tenta uma seleção menor abaixo.
      }
    }
  }

  if (capituloIds.length > 0) {
    const selecoesCapitulos = [
      "id,obra_id,titulo,ordem,numero,publicado,criado_em",
      "id,obra_id,titulo,numero,publicado,criado_em",
      "id,obra_id,titulo,ordem,publicado,criado_em",
      "id,obra_id,titulo,publicado,criado_em",
      "id,obra_id,titulo",
    ];

    for (const campos of selecoesCapitulos) {
      try {
        const { data: capitulosData, error: capitulosError } = await supabase
          .from("capitulos")
          .select(campos)
          .in("id", capituloIds)
          .limit(capituloIds.length);

        if (capitulosError || !Array.isArray(capitulosData)) {
          continue;
        }

        capitulosData.forEach((capitulo, index) => {
          const capituloNormalizado = normalizarCapituloSupabase(
            capitulo as unknown as SupabaseCapituloRow,
            index
          );

          if (!capituloNormalizado.obraId) {
            return;
          }

          const capitulosAtuais = capitulosPorObra.get(capituloNormalizado.obraId) || [];
          const { obraId: _obraId, ...capituloSemObraId } = capituloNormalizado;
          void _obraId;

          if (
            !capitulosAtuais.some(
              (capituloAtual) => capituloAtual.id === capituloSemObraId.id
            )
          ) {
            capitulosPorObra.set(capituloNormalizado.obraId, [
              ...capitulosAtuais,
              capituloSemObraId,
            ]);
          }
        });

        break;
      } catch {
        // Tenta uma seleção menor abaixo.
      }
    }
  }

  notificacoesDiretas.forEach((notificacao) => {
    if (!notificacao.obraId || obrasPorId.has(notificacao.obraId)) {
      return;
    }

    const obraFallback = criarObraFallbackNotificacaoDireta(notificacao);

    if (obraFallback) {
      obrasPorId.set(obraFallback.id, obraFallback);
    }
  });

  return Array.from(obrasPorId.values()).map((obra) => {
    const capitulosDiretos = capitulosPorObra.get(obra.id) || [];
    const capitulos = [...obra.capitulos];

    capitulosDiretos.forEach((capituloDireto) => {
      if (!capitulos.some((capitulo) => capitulo.id === capituloDireto.id)) {
        capitulos.push(capituloDireto);
      }
    });

    notificacoesDiretas
      .filter((notificacao) => notificacao.obraId === obra.id && notificacao.capituloId)
      .forEach((notificacao) => {
        if (capitulos.some((capitulo) => capitulo.id === notificacao.capituloId)) {
          return;
        }

        capitulos.push({
          id: notificacao.capituloId,
          titulo: extrairTituloCapituloDeMensagemNotificacao(notificacao),
          texto: "",
          curtiu: false,
          salvo: false,
          comentario: "",
          criadoEm: notificacao.criadaEm,
          lido: false,
          lidoEm: "",
        });
      });

    return {
      ...obra,
      capitulos,
      progressoLeitura: calcularProgressoLeitura(capitulos),
    };
  });
}
