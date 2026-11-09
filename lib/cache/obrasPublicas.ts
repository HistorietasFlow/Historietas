import "server-only";

import { unstable_cache } from "next/cache";
import { lerProjecaoPublicaObra, type ProjecaoPublicaObra } from "../server/agendamento/ler-projecao-publica";
import { lerComBarreiraPublica, ProjecaoPublicaAlterada } from "./barreira-projecao-publica";
import { tagObraPublica } from "./obra-publica-cache-tag";
import {
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
  geracao: string;
  revisao: string;
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

type CapituloLeituraPublicaRow = {
  id: string;
  titulo: string | null;
  texto: string | null;
  ordem: number | null;
  publicado: boolean | null;
  visualizacoes: number | null;
  criado_em: string | null;
};

function chaveProjecao(projecao: ProjecaoPublicaObra) {
  return projecao.estado === "obra_indisponivel" ? projecao.estado
    : JSON.stringify([projecao.obraId, projecao.geracao, projecao.revisao, projecao.slug]);
}

function comProjecao<T>(slug: string, tipo: string, numero: number | null,
  carregar: (projecao: Exclude<ProjecaoPublicaObra, { estado: "obra_indisponivel" }>) => Promise<T>) {
  return lerComBarreiraPublica({
    lerVersao: () => lerProjecaoPublicaObra(slug),
    chave: chaveProjecao,
    carregar: async (projecao) => {
      // Slug desconhecido nao tem geracao: nunca persistir o null por slug.
      if (projecao.estado === "obra_indisponivel") return null;
      return unstable_cache(() => carregar(projecao),
        ["historietas-projecao-publica-v1", tipo, chaveProjecao(projecao), String(numero)],
        { revalidate: 60, tags: [tagObraPublica(slug)] })();
    },
  });
}

const texto = (valor: unknown) => typeof valor === "string" ? valor : null;

export const obterObraMetadataPublica = (slug: string): Promise<ObraMetadataPublica | null> =>
  comProjecao(slug, "metadata", null, async ({ obra, slug }) => ({
    titulo: texto(obra.titulo), autor: texto(obra.autor), sinopse: texto(obra.sinopse),
    capa_url: texto(obra.capa), slug,
  }));

/** DTO publico independente de ObraLocal: nunca deve substituir drafts/cache pessoal.
 * Preparado para SSR; a pagina e o lifecycle atuais ainda NAO o consomem. */
export type SnapshotObraPublica = {
  obraId: string;
  geracao: string;
  revisao: string;
  slug: string;
  obra: {
    titulo: string; autor: string; autorId: string; genero: string; formato: string;
    classificacaoIndicativa: string; avisosConteudo: string[]; sinopse: string;
    tags: string[]; capa: string; capaNome: string; criadaEm: string;
  };
  anexo: { nome: string | null; tipo: string | null; tamanho: number | null; categoria: string | null } | null;
  capitulos: { id: string; ordem: number; titulo: string; tipoConteudo: "texto" | "imagens";
    criadoEm: string | null; atualizadoEm: string | null; href: string }[];
};

function capaSemAssinatura(valor: unknown) {
  const capa = texto(valor) || "";
  try {
    const url = new URL(capa, "https://public.invalid");
    if (!['http:', 'https:'].includes(url.protocol) ||
      /\/(?:object|render\/image)\/sign\//i.test(url.pathname) ||
      [...url.searchParams.keys()].some((chave) => /^(?:token|sig|signature|x-amz-.+|x-goog-.+)$/i.test(chave))) return "";
    return capa;
  } catch { return ""; }
}

export const obterSnapshotObraPublica = (slug: string): Promise<SnapshotObraPublica | null> =>
  comProjecao(slug, "obra-leve-v1", null, async (projecao) => {
    const supabase = criarSupabasePublicClient({ fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) });
    let cursor: { ordem: number; id: string } | null = null;
    let anexo: SnapshotObraPublica["anexo"] = null;
    const capitulos = await carregarTodasPaginasSupabase<SnapshotObraPublica["capitulos"][number]>({
      nomeColecao: "capítulos leves da obra pública",
      // O helper limita a coleta; o banco pagina por cursor, não por OFFSET.
      buscarPagina: async () => {
        const { data, error } = await supabase.rpc("listar_capitulos_leves_projecao_publica", {
          p_slug: projecao.slug, p_geracao: projecao.geracao, p_revisao: projecao.revisao,
          p_depois_ordem: cursor?.ordem ?? null, p_depois_id: cursor?.id ?? null, p_limite: 500,
        });
        if (error) throw error;
        if (!data || typeof data !== "object" || Array.isArray(data) || typeof data.valida !== "boolean" || !Array.isArray(data.capitulos)) {
          throw new Error("Resposta de capítulos leves inválida.");
        }
        if (!data.valida) throw new ProjecaoPublicaAlterada();
        if (data.obraId !== projecao.obraId || data.slug !== projecao.slug ||
          data.geracao !== projecao.geracao || data.revisao !== projecao.revisao) throw new ProjecaoPublicaAlterada();
        if (data.anexo === null) anexo = null;
        else if (data.anexo && typeof data.anexo === "object" && !Array.isArray(data.anexo)) {
          anexo = { nome: texto(data.anexo.nome), tipo: texto(data.anexo.tipo),
            tamanho: typeof data.anexo.tamanho === "number" && Number.isSafeInteger(data.anexo.tamanho) && data.anexo.tamanho >= 0 ? data.anexo.tamanho : null,
            categoria: texto(data.anexo.categoria) };
        } else throw new Error("Metadados de anexo inválidos.");
        const rows = data.capitulos.map((row) => {
          if (!row || typeof row !== "object" || Array.isArray(row) ||
            typeof row.id !== "string" || !idObraSupabaseValido(row.id) ||
            typeof row.ordem !== "number" || !Number.isInteger(row.ordem) || row.ordem < 1 || row.ordem > 2147483647 ||
            typeof row.titulo !== "string" || !["texto", "imagens"].includes(String(row.tipo_conteudo))) throw new Error("Capítulo leve inválido.");
          if (cursor && (row.ordem < cursor.ordem || (row.ordem === cursor.ordem && row.id <= cursor.id))) throw new Error("Cursor de capítulos não avançou.");
          cursor = { ordem: row.ordem, id: row.id };
          return { id: row.id, ordem: row.ordem, titulo: row.titulo,
            tipoConteudo: row.tipo_conteudo as "texto" | "imagens",
            criadoEm: texto(row.criado_em), atualizadoEm: texto(row.atualizado_em),
            href: `/obra/${encodeURIComponent(projecao.slug)}/capitulo/${row.ordem}` };
        });
        return { data: rows, error: null };
      },
    });
    const campos = projecao.obra;
    const lista = (valor: unknown): string[] => Array.isArray(valor) ? valor.filter((v): v is string => typeof v === "string") : [];
    return { obraId: projecao.obraId, geracao: projecao.geracao, revisao: projecao.revisao, slug: projecao.slug,
      obra: { titulo: texto(campos.titulo) || "Obra sem título", autor: texto(campos.autor) || "",
        autorId: texto(campos.autorId) || "", genero: texto(campos.genero) || "", formato: texto(campos.formato) || "",
        classificacaoIndicativa: texto(campos.classificacaoIndicativa) || "", avisosConteudo: lista(campos.avisosConteudo),
        sinopse: texto(campos.sinopse) || "", tags: lista(campos.tags), capa: capaSemAssinatura(campos.capa),
        capaNome: texto(campos.capaNome) || "", criadaEm: texto(campos.criadaEm) || "" }, anexo, capitulos };
  });

export const obterRotaCapituloPublico = async (slug: string, numeroCapitulo: number): Promise<RotaCapituloPublico | null> => {
  const leitura = await obterLeituraCapituloPublico(slug, numeroCapitulo);
  return leitura ? { obraId: leitura.obraId, capituloId: leitura.capituloId } : null;
};

export const obterLeituraCapituloPublico = (slug: string, numeroCapitulo: number): Promise<LeituraCapituloPublico | null> =>
  comProjecao(slug, "leitura-versionada", numeroCapitulo, async (projecao) => {
    if (!supabasePublicoConfigurado) {
      throw new Error("Supabase público não configurado.");
    }

    const supabase = criarSupabasePublicClient({ fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) });
    const campos = projecao.obra;
    const obra = {
      id: projecao.obraId, slug: projecao.slug, titulo: texto(campos.titulo), autor: texto(campos.autor),
      user_id: texto(campos.autorId), genero: texto(campos.genero), formato: texto(campos.formato),
      classificacao_indicativa: texto(campos.classificacaoIndicativa),
      avisos_conteudo: Array.isArray(campos.avisosConteudo) ? campos.avisosConteudo.filter((v): v is string => typeof v === "string") : [],
      sinopse: texto(campos.sinopse), tags: Array.isArray(campos.tags) ? campos.tags.filter((v): v is string => typeof v === "string") : [],
      capa_url: texto(campos.capa), capa_nome: texto(campos.capaNome), criada_em: texto(campos.criadaEm), link: null as string | null,
    };

    const capitulos = await carregarTodasPaginasSupabase<CapituloLeituraPublicaRow>({
      nomeColecao: "capítulos públicos da leitura canônica",
      buscarPagina: async (inicio, fim) => {
        const { data, error } = await supabase.rpc("listar_capitulos_projecao_publica", {
          p_slug: slug, p_geracao: projecao.geracao, p_revisao: projecao.revisao,
          p_inicio: inicio, p_limite: fim - inicio + 1,
        });
        if (error) throw error;
        if (!data || typeof data !== "object" || Array.isArray(data) || typeof data.valida !== "boolean" || !Array.isArray(data.capitulos)) {
          throw new Error("Resposta de capítulos públicos inválida.");
        }
        if (!data.valida) throw new ProjecaoPublicaAlterada();
        obra.link = texto(data.link);
        return { data: data.capitulos as CapituloLeituraPublicaRow[], error: null };
      },
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
      geracao: projecao.geracao,
      revisao: projecao.revisao,
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
  });
