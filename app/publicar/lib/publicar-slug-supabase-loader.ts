import { supabase } from "../../../lib/supabase/client";
import { criarSlugBase } from "../../../lib/utils";
import type { ObraLocal } from "./publicar-models";
import { criarSlugUnico } from "./publicar-work-utils";

export async function criarSlugUnicoSupabase(
  titulo: string,
  obrasExistentes: ObraLocal[]
) {
  const slugLocal = criarSlugUnico(titulo, obrasExistentes);
  const slugBase = criarSlugBase(slugLocal);
  let contador = 1;

  while (contador <= 20) {
    const slugAtual = contador === 1 ? slugBase : `${slugBase}-${contador}`;

    const { data, error } = await supabase
      .from("obras")
      .select("id")
      .eq("slug", slugAtual)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Não consegui preparar o endereço da obra: ${error.message}`);
    }

    if (!data) {
      return slugAtual;
    }

    contador += 1;
  }

  return `${slugBase}-${Date.now().toString(36)}`;
}


