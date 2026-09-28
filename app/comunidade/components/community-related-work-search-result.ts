import type { ObraRelacionadaSugestao } from "./community-related-work-suggestion";
import {
  normalizarSugestaoObraSupabase,
  type SupabaseObraPublicaRow,
} from "./community-related-work-supabase-normalizer";

export function obterPrimeiraSugestaoObraSupabaseComunidade(
  obrasEncontradas: SupabaseObraPublicaRow[] | null
): ObraRelacionadaSugestao | null {
  return (
    (obrasEncontradas || [])
      .map((obra, index) => normalizarSugestaoObraSupabase(obra, index))
      .find((obra): obra is ObraRelacionadaSugestao => Boolean(obra)) || null
  );
}
