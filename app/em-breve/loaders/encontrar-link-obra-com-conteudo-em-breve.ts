import { ehClassificacao18 } from "../../../lib/historietasAdultContent";
import { supabase } from "../../../lib/supabase/client";
import { idObraSupabaseValido, normalizarTexto } from "../../../lib/utils";
import { criarLinkObraPublicadaEmBreve } from "../lib/em-breve-work-link-utils";
import {
  obraSupabaseTemArquivoEmBreve,
  type SupabaseObraEmBreveRow,
} from "../lib/em-breve-work-normalizers";

export async function encontrarLinkObraComConteudoEmBreve(
  obraIdBusca: string,
  tituloBusca: string
) {
  const obraIdLimpo = obraIdBusca.trim();
  const tituloLimpo = tituloBusca.trim();

  if (!obraIdLimpo && !tituloLimpo) {
    return "";
  }

  try {
    let obraEncontrada: Pick<SupabaseObraEmBreveRow, "id" | "titulo" | "slug" | "link" | "arquivo_url" | "publicado" | "classificacao_indicativa"> | null = null;

    if (idObraSupabaseValido(obraIdLimpo)) {
      const { data, error } = await supabase
        .from("obras")
        .select("id,titulo,slug,link,arquivo_url,publicado,classificacao_indicativa")
        .eq("id", obraIdLimpo)
        .eq("publicado", true)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        obraEncontrada = data;
      }
    }

    if (!obraEncontrada && tituloLimpo) {
      const { data: obrasBanco, error: erroObras } = await supabase
        .from("obras")
        .select("id,titulo,slug,link,arquivo_url,publicado,classificacao_indicativa")
        .ilike("titulo", tituloLimpo)
        .eq("publicado", true)
        .limit(5);

      if (erroObras || !Array.isArray(obrasBanco)) {
        return "";
      }

      const obrasEncontradas =
        obrasBanco;
      obraEncontrada =
        obrasEncontradas.find(
          (obra) =>
            normalizarTexto(obra.titulo || "") === normalizarTexto(tituloLimpo)
        ) || obrasEncontradas[0] || null;
    }

    if (ehClassificacao18(obraEncontrada?.classificacao_indicativa)) {
      return "";
    }

    if (!obraEncontrada?.id) {
      return "";
    }

    if (obraSupabaseTemArquivoEmBreve(obraEncontrada)) {
      return criarLinkObraPublicadaEmBreve(obraEncontrada);
    }

    const { data: capitulosBanco, error: erroCapitulos } = await supabase
      .from("capitulos")
      .select("obra_id")
      .eq("obra_id", obraEncontrada.id)
      .eq("publicado", true)
      .limit(1);

    if (erroCapitulos || !Array.isArray(capitulosBanco)) {
      return "";
    }

    return capitulosBanco.length > 0
      ? criarLinkObraPublicadaEmBreve(obraEncontrada)
      : "";
  } catch {
    return "";
  }
}
