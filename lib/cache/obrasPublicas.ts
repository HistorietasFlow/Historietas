import "server-only";

import { unstable_cache } from "next/cache";
import { idObraSupabaseValido } from "../utils";
import {
  criarSupabasePublicClient,
  supabasePublicoConfigurado,
} from "../supabase/public";

export type ObraMetadataPublica = {
  titulo: string | null;
  autor: string | null;
  sinopse: string | null;
  capa_url: string | null;
  slug: string | null;
};

export type RotaCapituloPublico = {
  obraId: string;
  capituloId: string;
};

export const obterObraMetadataPublica = unstable_cache(
  async (slug: string): Promise<ObraMetadataPublica | null> => {
    if (!supabasePublicoConfigurado) {
      throw new Error("Supabase público não configurado.");
    }

    const supabase = criarSupabasePublicClient();
    const { data, error } = await supabase
      .from("obras")
      .select("titulo,autor,sinopse,capa_url,slug")
      .eq("slug", slug)
      .eq("publicado", true)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  },
  ["historietas-obra-metadata-publica-v1"],
  {
    revalidate: 300,
    tags: ["historietas-obras-publicas"],
  },
);

export const obterRotaCapituloPublico = unstable_cache(
  async (
    slug: string,
    numeroCapitulo: number,
  ): Promise<RotaCapituloPublico | null> => {
    if (!supabasePublicoConfigurado) {
      throw new Error("Supabase público não configurado.");
    }

    const supabase = criarSupabasePublicClient();

    const { data: obra, error: obraError } = await supabase
      .from("obras")
      .select("id")
      .eq("slug", slug)
      .eq("publicado", true)
      .limit(1)
      .maybeSingle();

    if (obraError) {
      throw obraError;
    }

    if (!obra || !idObraSupabaseValido(obra.id)) {
      return null;
    }

    const { data: capitulo, error: capituloError } = await supabase
      .from("capitulos")
      .select("id")
      .eq("obra_id", obra.id)
      .eq("ordem", numeroCapitulo)
      .eq("publicado", true)
      .limit(1)
      .maybeSingle();

    if (capituloError) {
      throw capituloError;
    }

    if (!capitulo || !idObraSupabaseValido(capitulo.id)) {
      return null;
    }

    return {
      obraId: obra.id,
      capituloId: capitulo.id,
    };
  },
  ["historietas-rota-capitulo-publico-v1"],
  {
    revalidate: 60,
    tags: ["historietas-obras-publicas", "historietas-capitulos-publicos"],
  },
);
