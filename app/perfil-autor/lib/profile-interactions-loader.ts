import { carregarMetricasConteudos } from "../../../lib/metricas";
import { supabase } from "../../../lib/supabase/client";
import { carregarTodasPaginasPorLotesSupabase } from "../../../lib/supabase/paginacao.mjs";
import { idObraSupabaseValido } from "../../../lib/utils";
import { totaisInteracoesObrasPerfilVazio } from "../constants";
import type {
  ObraLocal,
  TotaisInteracoesObrasPerfilAutor,
} from "../types";
import { pegarTexto } from "./data-normalizers";

export async function carregarTotaisInteracoesObrasPerfilAutor(
  obrasParaContar: ObraLocal[],
): Promise<TotaisInteracoesObrasPerfilAutor> {
  const obraIds = Array.from(
    new Set(obrasParaContar.map((obra) => obra.id.trim()).filter(Boolean)),
  );
  const capituloIds = Array.from(
    new Set(
      obrasParaContar.flatMap((obra) =>
        obra.capitulos.map((capitulo) => capitulo.id.trim()).filter(Boolean),
      ),
    ),
  );

  if (obraIds.length === 0 && capituloIds.length === 0) {
    return totaisInteracoesObrasPerfilVazio;
  }

  const metricas = await carregarMetricasConteudos({ obraIds, capituloIds });

  if (!metricas.carregado) {
    return totaisInteracoesObrasPerfilVazio;
  }

  const totais: TotaisInteracoesObrasPerfilAutor = {
    curtidasPorObra: {},
    comentariosPorObra: {},
    curtidasPorCapitulo: {},
    comentariosPorCapitulo: {},
    salvosPorObra: {},
    salvosPorCapitulo: {},
    concluidasPorObra: {},
  };

  metricas.obras.forEach((metrica) => {
    totais.curtidasPorObra[metrica.id] =
      metrica.audiencia.curtidoresUnicos;
    totais.comentariosPorObra[metrica.id] =
      metrica.audiencia.comentaristasUnicos;
    totais.salvosPorObra[metrica.id] =
      metrica.audiencia.salvadoresUnicos;
    totais.concluidasPorObra[metrica.id] =
      metrica.interacoesDiretas.concluidas;
  });

  metricas.capitulos.forEach((metrica) => {
    totais.curtidasPorCapitulo[metrica.id] = metrica.interacoes.curtidas;
    totais.comentariosPorCapitulo[metrica.id] =
      metrica.interacoes.comentarios;
    totais.salvosPorCapitulo[metrica.id] = metrica.interacoes.salvos;
  });

  return totais;
}

export async function carregarInteracoesCapitulosSupabase(
  userId: string,
  obras: ObraLocal[],
) {
  const capituloIds = Array.from(
    new Set(
      obras.flatMap((obra) =>
        obra.capitulos
          .map((capitulo) => capitulo.id.trim())
          .filter(idObraSupabaseValido),
      ),
    ),
  );
  const metricas = await carregarMetricasConteudos({ capituloIds });
  const curtidas = new Set<string>();
  const salvos = new Set<string>();
  const comentarios = new Map<string, string>();
  const progresso = new Map<string, string>();
  const progressoCarregado = metricas.carregado;

  metricas.capitulos.forEach((metrica) => {
    if (metrica.usuario.curtiu) {
      curtidas.add(metrica.id);
    }

    if (metrica.usuario.salvou) {
      salvos.add(metrica.id);
    }

    if (metrica.usuario.leu && metrica.usuario.lidoEm) {
      progresso.set(metrica.id, metrica.usuario.lidoEm);
    }
  });

  if (capituloIds.length > 0) {
    try {
      const data =
        await carregarTodasPaginasPorLotesSupabase<Record<string, unknown>, string>({
          nomeColecao: "comentários pessoais do perfil do autor",
          itens: capituloIds,
          buscarPaginaLote: async (capituloIdsLote, inicio, fim) =>
            supabase
              .from("comentarios_capitulos")
              .select("id,capitulo_id,comentario")
              .eq("user_id", userId)
              .in("capitulo_id", capituloIdsLote)
              .order("capitulo_id", { ascending: true })
              .order("id", { ascending: true })
              .range(inicio, fim),
        });

      data.forEach((item) => {
          const registro = item as Record<string, unknown>;
          const capituloId = pegarTexto(registro.capitulo_id);
          const texto = pegarTexto(registro.comentario);

          if (capituloId && texto) {
            comentarios.set(capituloId, texto);
          }
      });
    } catch {
      // Comentários continuam apenas localmente se houver erro.
    }
  }

  return {
    curtidas,
    salvos,
    comentarios,
    progresso,
    progressoCarregado,
    capitulosComMetricas: new Set(metricas.capitulos.keys()),
  };
}
