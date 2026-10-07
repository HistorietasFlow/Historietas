import { criarSlugBase } from "../../../../lib/utils";
import { sincronizarBackupArquivosObras } from "./obra-file-backup-utils";
import { aplicarMetricasObraPublica } from "./obra-metrics-application-utils";
import { carregarCapitulosPublicadosObraSupabase } from "./obra-supabase-chapters-utils";
import { consultarObraPublicaPorSlug } from "./obra-supabase-work-utils";
import {
  normalizarObraSupabase,
  removerObraLocalAusentePorSlug,
  substituirOuInserirObraLocal,
  type ObraLocal,
  type ResultadoCarregamentoObraPublica,
} from "./obra-data-utils";
import type { SupabaseCapituloRow } from "./obra-reading-utils";

export async function carregarObraSupabasePorSlug(
  slugBusca: string,
  obrasLocais: ObraLocal[],
  userId = "",
  operacaoAindaAtual?: () => boolean,
) {
  const slugLimpo = slugBusca.trim();
  const execucaoAtual = () => !operacaoAindaAtual || operacaoAindaAtual();

  async function aplicarMetricasSeAtual(obrasBase: ObraLocal[]) {
    if (!execucaoAtual()) {
      return obrasBase;
    }

    const obrasComMetricas = await aplicarMetricasObraPublica(
      obrasBase,
      userId,
    );

    return execucaoAtual() ? obrasComMetricas : obrasBase;
  }

  if (!slugLimpo) {
    return {
      obras: obrasLocais,
      status: "nao_encontrada",
    } satisfies ResultadoCarregamentoObraPublica;
  }

  if (!execucaoAtual()) {
    return {
      obras: obrasLocais,
      status: "cancelada",
    } satisfies ResultadoCarregamentoObraPublica;
  }

  try {
    const { data: obrasBanco, error: erroObra } =
      await consultarObraPublicaPorSlug(slugLimpo);

    if (!execucaoAtual()) {
      return {
        obras: obrasLocais,
        status: "cancelada",
      } satisfies ResultadoCarregamentoObraPublica;
    }

    if (erroObra) {
      console.warn(
        "Não consegui carregar a obra pública no Supabase:",
        erroObra.message
      );
      return {
        obras: await aplicarMetricasSeAtual(obrasLocais),
        status: "erro",
      } satisfies ResultadoCarregamentoObraPublica;
    }

    const obraBanco = (obrasBanco || [])[0] || null;

    if (!obraBanco) {
      return {
        obras: removerObraLocalAusentePorSlug(obrasLocais, slugLimpo),
        status: "nao_encontrada",
      } satisfies ResultadoCarregamentoObraPublica;
    }

    let capitulosBanco: SupabaseCapituloRow[] = [];

    try {
      capitulosBanco = await carregarCapitulosPublicadosObraSupabase(
        obraBanco.id,
      );
    } catch (error) {
      console.warn(
        "Não consegui carregar capítulos da obra pública no Supabase:",
        error,
      );
    }

    if (!execucaoAtual()) {
      return {
        obras: obrasLocais,
        status: "cancelada",
      } satisfies ResultadoCarregamentoObraPublica;
    }

    const obraLocal = obrasLocais.find((obraLocalAtual) => {
      const slugLocal = obraLocalAtual.slug || criarSlugBase(obraLocalAtual.titulo);

      return obraLocalAtual.id === obraBanco.id || slugLocal === slugLimpo;
    });

    const obraNormalizadaSemTotais = normalizarObraSupabase(
      obraBanco,
      capitulosBanco,
      obraLocal,
      0
    );
    const [obraNormalizada] = await aplicarMetricasSeAtual([
      obraNormalizadaSemTotais,
    ]);

    if (!execucaoAtual()) {
      return {
        obras: obrasLocais,
        status: "cancelada",
      } satisfies ResultadoCarregamentoObraPublica;
    }

    const obrasAtualizadas = substituirOuInserirObraLocal(
      obrasLocais,
      obraNormalizada,
    );

    if (!execucaoAtual()) {
      return {
        obras: obrasLocais,
        status: "cancelada",
      } satisfies ResultadoCarregamentoObraPublica;
    }

    sincronizarBackupArquivosObras(obrasAtualizadas, userId);

    return {
      obras: obrasAtualizadas,
      status: "carregada",
    } satisfies ResultadoCarregamentoObraPublica;
  } catch (error) {
    if (!execucaoAtual()) {
      return {
        obras: obrasLocais,
        status: "cancelada",
      } satisfies ResultadoCarregamentoObraPublica;
    }

    console.warn("Não consegui acessar o Supabase agora:", error);
    return {
      obras: await aplicarMetricasSeAtual(obrasLocais),
      status: "erro",
    } satisfies ResultadoCarregamentoObraPublica;
  }
}
