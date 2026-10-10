import { supabase } from "../../../lib/supabase/client";
import {
  carregarTodasPaginasPorLotesSupabase,
  carregarTodasPaginasSupabase,
} from "../../../lib/supabase/paginacao.mjs";
import type {
  CapituloLocal,
  ObraLocal,
  SupabaseCapituloRow,
  SupabaseObraRow,
} from "../types";
import {
  normalizarCapituloSupabase,
  normalizarObraSupabase,
} from "./data-normalizers";
import { calcularProgressoLeitura } from "./work-normalizers";

export async function carregarObrasPublicadasSupabase() {
  try {
    const obrasData = await carregarTodasPaginasSupabase<SupabaseObraRow>({
      nomeColecao: "obras publicadas do perfil do autor",
      buscarPagina: async (inicio, fim) =>
        supabase
          .from("obras")
          .select(
            "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,visualizacoes,slug,criada_em,atualizado_em"
          )
          .eq("publicado", true)
          .order("criada_em", { ascending: false })
          .order("id", { ascending: false })
          .range(inicio, fim),
    });

    const obrasSupabase = obrasData.map((obra, index) =>
      normalizarObraSupabase(obra, index),
    );

    const idsObras = obrasSupabase.map((obra) => obra.id).filter(Boolean);

    if (idsObras.length === 0) {
      return obrasSupabase;
    }

    try {
      const capitulosData =
        await carregarTodasPaginasPorLotesSupabase<SupabaseCapituloRow, string>({
          nomeColecao: "capítulos publicados do perfil do autor",
          itens: idsObras,
          buscarPaginaLote: async (obraIdsLote, inicio, fim) =>
            supabase
              .from("capitulos")
              .select("id,obra_id,titulo,ordem,publicado,criado_em,atualizado_em")
              .in("obra_id", obraIdsLote)
              .eq("publicado", true)
              .order("obra_id", { ascending: true })
              .order("ordem", { ascending: true })
              .order("id", { ascending: true })
              .range(inicio, fim),
        });
      const capitulosPorObra = new Map<string, CapituloLocal[]>();

      capitulosData.forEach((capitulo, index) => {
        const capituloNormalizado = normalizarCapituloSupabase(
          capitulo,
          index,
          index,
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
      // Se capítulos falhar, a página continua mostrando as obras.
    }

    return obrasSupabase;
  } catch {
    return [];
  }
}

export async function carregarObrasPublicadasPorIdsSupabase(obraIds: string[]) {
  const idsUnicos = Array.from(
    new Set(obraIds.map((obraId) => obraId.trim()).filter(Boolean)),
  );

  if (idsUnicos.length === 0) {
    return [] as ObraLocal[];
  }

  try {
    const { data: obrasData, error: obrasError } = await supabase
      .from("obras")
      .select(
        "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,visualizacoes,slug,criada_em,atualizado_em"
      )
      .in("id", idsUnicos)
      .eq("publicado", true)
      .limit(Math.max(idsUnicos.length, 1));

    if (obrasError || !Array.isArray(obrasData)) {
      return [] as ObraLocal[];
    }

    const obrasSupabase = obrasData.map((obra, index) =>
      normalizarObraSupabase(obra, index),
    );
    const idsEncontrados = obrasSupabase.map((obra) => obra.id).filter(Boolean);

    if (idsEncontrados.length === 0) {
      return obrasSupabase;
    }

    try {
      const { data: capitulosData } = await supabase
        .from("capitulos")
        .select("id,obra_id,titulo,ordem,publicado,criado_em,atualizado_em")
        .in("obra_id", idsEncontrados)
        .eq("publicado", true)
        .order("ordem", { ascending: true })
        .limit(Math.max(idsEncontrados.length * 20, 1));

      if (Array.isArray(capitulosData)) {
        const capitulosPorObra = new Map<string, CapituloLocal[]>();

        capitulosData.forEach((capitulo, index) => {
          const capituloNormalizado = normalizarCapituloSupabase(
            capitulo,
            index,
            index,
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
      }
    } catch {
      // Se capítulos falhar, a Biblioteca ainda mostra a obra salva.
    }

    return obrasSupabase;
  } catch {
    return [] as ObraLocal[];
  }
}
