import { supabase } from "../../../lib/supabase/client";
import { carregarMetricasConteudos } from "../../../lib/metricas";
import { criarObraLista } from "./listas-profile-state-utils";
import { pegarNumero, pegarTexto } from "./listas-value-utils";

export const CAMPOS_OBRAS =
  "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,capa_url,publicado,visualizacoes,slug,criada_em";

type ObraLista = ReturnType<typeof criarObraLista>;

export async function carregarCapitulosDasObras(obras: ObraLista[]) {
  const ids = Array.from(new Set(obras.map((obra) => obra.id).filter(Boolean)));

  if (ids.length === 0) {
    return obras;
  }

  const capitulosPorObra = new Map<string, ObraLista["capitulos"]>();
  const tamanhoChunk = 100;

  for (let inicio = 0; inicio < ids.length; inicio += tamanhoChunk) {
    const chunk = ids.slice(inicio, inicio + tamanhoChunk);

    try {
      const { data, error } = await supabase
        .from("capitulos")
        .select("id,obra_id,titulo,ordem,publicado,criado_em")
        .in("obra_id", chunk)
        .eq("publicado", true)
        .order("ordem", { ascending: true })
        .limit(Math.max(chunk.length * 80, 100));

      if (error || !Array.isArray(data)) {
        continue;
      }

      data.forEach((registro, index) => {
        if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
          return;
        }

        const row = registro;
        const obraId = pegarTexto(row.obra_id);

        if (!obraId) {
          return;
        }

        const atuais = capitulosPorObra.get(obraId) || [];
        atuais.push({
          id: pegarTexto(row.id, `capitulo-${obraId}-${index + 1}`),
          obraId,
          titulo: pegarTexto(row.titulo, `Capítulo ${index + 1}`),
          ordem: Math.max(1, Math.round(pegarNumero(row.ordem, index + 1))),
          criadoEm: pegarTexto(row.criado_em),
        });
        capitulosPorObra.set(obraId, atuais);
      });
    } catch {
      // A lista continua funcionando mesmo sem os capítulos.
    }
  }

  return obras.map((obra) => ({
    ...obra,
    capitulos: capitulosPorObra.get(obra.id) || [],
  }));
}

export async function aplicarMetricasObrasListas(obras: ObraLista[]) {
  const obraIds = Array.from(
    new Set(obras.map((obra) => obra.id.trim()).filter(Boolean)),
  );

  if (obraIds.length === 0) {
    return obras;
  }

  const metricas = await carregarMetricasConteudos({ obraIds });

  if (!metricas.carregado) {
    return obras;
  }

  return obras.map((obra) => {
    const metrica = metricas.obras.get(obra.id);

    if (!metrica) {
      return obra;
    }

    return {
      ...obra,
      totalCurtidas: metrica.audiencia.curtidoresUnicos,
      totalComentarios: metrica.audiencia.comentaristasUnicos,
      notaMedia: metrica.avaliacao.media,
      totalAvaliacoes: metrica.avaliacao.total,
    };
  });
}

export async function carregarObrasPublicadas(idsEspecificos: string[] = []) {
  try {
    let consulta = supabase
      .from("obras")
      .select(CAMPOS_OBRAS)
      .eq("publicado", true)
      .order("criada_em", { ascending: false });

    if (idsEspecificos.length > 0) {
      consulta = consulta.in(
        "id",
        Array.from(new Set(idsEspecificos.map((id) => id.trim()).filter(Boolean))),
      );
    }

    const { data, error } = await consulta.limit(
      idsEspecificos.length > 0 ? Math.max(idsEspecificos.length, 1) : 500,
    );

    if (error || !Array.isArray(data)) {
      return [] as ObraLista[];
    }

    let obras = data.map((registro, index) =>
      criarObraLista(registro, index),
    );

    obras = await carregarCapitulosDasObras(obras);
    obras = await aplicarMetricasObrasListas(obras);

    return obras;
  } catch {
    return [] as ObraLista[];
  }
}
