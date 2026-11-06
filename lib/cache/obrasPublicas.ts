import "server-only";

import { unstable_cache } from "next/cache";
import {
  ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO,
  ehClassificacao18,
  normalizarAvisosConteudo18,
} from "../historietasAdultContent";
import { idObraSupabaseValido } from "../utils";
import { carregarTodasPaginasSupabase } from "../supabase/paginacao.mjs";
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

type CapituloLeituraPublica = {
  id: string;
  ordem: number;
  titulo: string;
  texto: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
  publicado: boolean;
  visualizacoes: number;
};

export type LeituraCapituloPublico = {
  obraId: string;
  capituloId: string;
  numeroCapitulo: number;
  dadosEstruturados: {
    autor: string;
    sinopse: string;
    capa: string;
    textoCapitulo: string;
  };
  obra: {
    id: string;
    titulo: string;
    autor: string;
    autorId: string;
    genero: string;
    formato: string;
    classificacaoIndicativa: string;
    avisosConteudo: ReturnType<typeof normalizarAvisosConteudo18>;
    sinopse: string;
    tags: string[];
    capa: string;
    capaNome: string;
    arquivoObra: null;
    publicado: boolean;
    capitulos: CapituloLeituraPublica[];
    criadaEm: string;
    ultimoCapituloLidoId: string;
    ultimaLeituraEm: string;
    progressoLeitura: number;
    slug: string;
    link: string;
  };
};

type ObraLeituraPublicaRow = {
  id: string;
  user_id: string | null;
  titulo: string | null;
  autor: string | null;
  genero: string | null;
  formato: string | null;
  classificacao_indicativa: string | null;
  avisos_conteudo: string[] | null;
  sinopse: string | null;
  tags: string[] | null;
  capa_url: string | null;
  capa_nome: string | null;
  slug: string | null;
  link: string | null;
  criada_em: string | null;
};

type CapituloLeituraPublicaRow = {
  id: string;
  titulo: string | null;
  texto: string | null;
  ordem: number | null;
  publicado: boolean | null;
  visualizacoes: number | null;
  criado_em: string | null;
};

export const obterObraMetadataPublica = unstable_cache(
  async (slug: string): Promise<ObraMetadataPublica | null> => {
    if (!supabasePublicoConfigurado) {
      throw new Error("Supabase público não configurado.");
    }

    const supabase = criarSupabasePublicClient();
    const { data, error } = await supabase
      .from("obras")
      .select("titulo,autor,sinopse,capa_url,slug,classificacao_indicativa")
      .eq("slug", slug)
      .eq("publicado", true)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (
      !data ||
      (ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO &&
        ehClassificacao18(data.classificacao_indicativa))
    ) {
      return null;
    }

    return {
      titulo: data.titulo,
      autor: data.autor,
      sinopse: data.sinopse,
      capa_url: data.capa_url,
      slug: data.slug,
    };
  },
  ["historietas-obra-metadata-publica-v2"],
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
      .select("id,classificacao_indicativa")
      .eq("slug", slug)
      .eq("publicado", true)
      .limit(1)
      .maybeSingle();

    if (obraError) {
      throw obraError;
    }

    if (
      !obra ||
      !idObraSupabaseValido(obra.id) ||
      (ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO &&
        ehClassificacao18(obra.classificacao_indicativa))
    ) {
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
  ["historietas-rota-capitulo-publico-v2"],
  {
    revalidate: 60,
    tags: ["historietas-obras-publicas", "historietas-capitulos-publicos"],
  },
);

export const obterLeituraCapituloPublico = unstable_cache(
  async (
    slug: string,
    numeroCapitulo: number,
  ): Promise<LeituraCapituloPublico | null> => {
    if (!supabasePublicoConfigurado) {
      throw new Error("Supabase público não configurado.");
    }

    const supabase = criarSupabasePublicClient();
    const { data: obra, error: obraError } = await supabase
      .from("obras")
      .select(
        "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,sinopse,tags,capa_url,capa_nome,slug,link,criada_em",
      )
      .eq("slug", slug)
      .eq("publicado", true)
      .limit(1)
      .maybeSingle<ObraLeituraPublicaRow>();

    if (obraError) {
      throw obraError;
    }

    if (
      !obra ||
      !idObraSupabaseValido(obra.id) ||
      (ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO &&
        ehClassificacao18(obra.classificacao_indicativa))
    ) {
      return null;
    }

    const capitulos = await carregarTodasPaginasSupabase<CapituloLeituraPublicaRow>({
      nomeColecao: "capítulos públicos da leitura canônica",
      buscarPagina: async (inicio, fim) =>
        supabase
          .from("capitulos")
          .select("id,titulo,texto,ordem,publicado,visualizacoes,criado_em")
          .eq("obra_id", obra.id)
          .eq("publicado", true)
          .order("ordem", { ascending: true })
          .order("id", { ascending: true })
          .range(inicio, fim),
    });
    const capituloSolicitado = capitulos.find(
      (capitulo) => capitulo.ordem === numeroCapitulo,
    );

    if (!capituloSolicitado || !idObraSupabaseValido(capituloSolicitado.id)) {
      return null;
    }

    const tituloObra = obra.titulo?.trim() || "Obra sem título";
    const slugCanonico = obra.slug?.trim() || slug;
    const capitulosNormalizados = capitulos.map((capitulo, index) => ({
      id: capitulo.id,
      ordem:
        typeof capitulo.ordem === "number" &&
        Number.isInteger(capitulo.ordem) &&
        capitulo.ordem > 0
          ? capitulo.ordem
          : index + 1,
      titulo: capitulo.titulo?.trim() || `Capítulo ${index + 1}`,
      texto: typeof capitulo.texto === "string" ? capitulo.texto : "",
      curtiu: false,
      salvo: false,
      comentario: "",
      criadoEm: capitulo.criado_em || "",
      lido: false,
      lidoEm: "",
      publicado: Boolean(capitulo.publicado),
      visualizacoes: Math.max(0, Number(capitulo.visualizacoes) || 0),
    }));

    return {
      obraId: obra.id,
      capituloId: capituloSolicitado.id,
      numeroCapitulo,
      dadosEstruturados: {
        autor: obra.autor?.trim() || "",
        sinopse: obra.sinopse?.trim() || "",
        capa: obra.capa_url?.trim() || "",
        textoCapitulo:
          typeof capituloSolicitado.texto === "string"
            ? capituloSolicitado.texto.trim()
            : "",
      },
      obra: {
        id: obra.id,
        titulo: tituloObra,
        autor: obra.autor?.trim() || "Autor não informado",
        autorId: obra.user_id?.trim() || "",
        genero: obra.genero?.trim() || "Não informado",
        formato: obra.formato?.trim() || "Não informado",
        classificacaoIndicativa:
          obra.classificacao_indicativa?.trim() || "Não informada",
        avisosConteudo: normalizarAvisosConteudo18(
          obra.avisos_conteudo,
          obra.classificacao_indicativa,
        ),
        sinopse: obra.sinopse?.trim() || "Nenhuma sinopse informada.",
        tags:
          obra.tags?.filter(
            (tag): tag is string => typeof tag === "string" && Boolean(tag.trim()),
          ) || [],
        capa: obra.capa_url?.trim() || "",
        capaNome: obra.capa_nome?.trim() || "",
        arquivoObra: null,
        publicado: true,
        capitulos: capitulosNormalizados,
        criadaEm: obra.criada_em || "",
        ultimoCapituloLidoId: "",
        ultimaLeituraEm: "",
        progressoLeitura: 0,
        slug: slugCanonico,
        link: obra.link?.trim() || `/obra/${slugCanonico}`,
      },
    };
  },
  ["historietas-leitura-capitulo-publico-v1"],
  {
    revalidate: 60,
    tags: ["historietas-obras-publicas", "historietas-capitulos-publicos"],
  },
);
