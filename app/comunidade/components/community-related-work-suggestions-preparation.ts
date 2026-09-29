import { carregarSugestoesObrasLocais } from "./community-local-related-works-loader";
import { consultarObrasPublicadasComunidade } from "./community-published-works-query";
import { removerSugestoesObrasDuplicadas } from "./community-related-work-deduplicator";
import type { ObraRelacionadaSugestao } from "./community-related-work-suggestion";
import { normalizarSugestaoObraSupabase } from "./community-related-work-supabase-normalizer";

export async function prepararSugestoesObrasRelacionadasComunidade(
  usuarioId: string
): Promise<ObraRelacionadaSugestao[]> {
  const obrasLocais = carregarSugestoesObrasLocais(usuarioId);

  try {
    const resultadoConsultaObras =
      await consultarObrasPublicadasComunidade();

    if (resultadoConsultaObras.sucesso === false) {
      throw resultadoConsultaObras.erro;
    }

    const obrasSupabase = (resultadoConsultaObras.obrasEncontradas || [])
      .map((obra, index) =>
        normalizarSugestaoObraSupabase(obra, index)
      )
      .filter((obra): obra is ObraRelacionadaSugestao => Boolean(obra));

    return removerSugestoesObrasDuplicadas([...obrasSupabase, ...obrasLocais]);
  } catch {
    return removerSugestoesObrasDuplicadas(obrasLocais);
  }
}
