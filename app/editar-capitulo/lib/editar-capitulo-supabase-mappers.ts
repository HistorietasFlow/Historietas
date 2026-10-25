import { criarSlugBase } from "../../../lib/utils";
import {
  normalizarCategoriaArquivoSupabase,
  normalizarTagsSupabase,
} from "./editar-capitulo-supabase-normalization";
import {
  calcularProgressoLeitura,
  normalizarNumeroEditarCapitulo,
} from "./editar-capitulo-metrics-utils";

type CapituloLocalParaMapper = {
  id: string;
  titulo: string;
  texto: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  criadoEm: string;
  lido?: boolean;
  lidoEm?: string;
  publicado?: boolean;
  ordem?: number;
};

type CapituloSupabaseParaMapper = {
  id: string;
  titulo: string | null;
  texto: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
};

type ArquivoObraLocalParaMapper = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: "texto" | "documento" | "imagem" | "outro";
  criadoEm: string;
};

type ObraLocalParaMapper = {
  id: string;
  titulo: string;
  autor: string;
  autorId?: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  arquivoObra?: ArquivoObraLocalParaMapper | null;
  publicado: boolean;
  capitulos: CapituloLocalParaMapper[];
  criadaEm: string;
  ultimoCapituloLidoId?: string;
  ultimaLeituraEm?: string;
  progressoLeitura?: number;
  visualizacoes?: number;
  totalCurtidas?: number;
  totalComentarios?: number;
  totalSalvos?: number;
  totalLidos?: number;
  totalFavoritos?: number;
  totalConcluidas?: number;
  slug: string;
  link: string;
};

type ObraSupabaseParaMapper = {
  id: string;
  user_id: string;
  titulo: string | null;
  autor: string | null;
  genero: string | null;
  formato: string | null;
  classificacao_indicativa: string | null;
  sinopse: string | null;
  tags: string[] | null;
  capa_url: string | null;
  capa_nome: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  arquivo_tipo: string | null;
  arquivo_tamanho: number | null;
  arquivo_categoria: string | null;
  publicado: boolean | null;
  visualizacoes: number | null;
  slug: string | null;
  link: string | null;
  criada_em: string | null;
};

export function mapearCapituloSupabase(
  capitulo: CapituloSupabaseParaMapper,
  index: number,
  capituloLocal?: CapituloLocalParaMapper,
): CapituloLocalParaMapper {
  return {
    id: capitulo.id,
    titulo: capitulo.titulo?.trim() || capituloLocal?.titulo || `Capítulo ${index + 1}`,
    texto: typeof capitulo.texto === "string" ? capitulo.texto : capituloLocal?.texto || "",
    curtiu: Boolean(capituloLocal?.curtiu),
    salvo: Boolean(capituloLocal?.salvo),
    comentario:
      typeof capituloLocal?.comentario === "string"
        ? capituloLocal.comentario
        : "",
    criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
    lido: Boolean(capituloLocal?.lido),
    lidoEm: typeof capituloLocal?.lidoEm === "string" ? capituloLocal.lidoEm : "",
    publicado: capitulo.publicado !== false,
    ordem:
      typeof capitulo.ordem === "number" &&
      Number.isInteger(capitulo.ordem) &&
      capitulo.ordem > 0
        ? capitulo.ordem
        : index + 1,
  };
}

export function mapearObraSupabase(
  obra: ObraSupabaseParaMapper,
  capitulosSupabase: CapituloSupabaseParaMapper[],
  obraLocal?: ObraLocalParaMapper,
  nomeProfileAutor = "",
): ObraLocalParaMapper {
  const capitulosLocais = obraLocal?.capitulos || [];
  const capitulosMapeados = capitulosSupabase.map((capitulo, index) => {
    const capituloLocal = capitulosLocais.find(
      (capituloAtual) => capituloAtual.id === capitulo.id,
    );

    return mapearCapituloSupabase(capitulo, index, capituloLocal);
  });

  // Para obras do Supabase, a lista remota é a fonte de verdade.
  // Isso impede capítulos locais antigos/removidos de reaparecerem no editor.
  const capitulos = capitulosMapeados;
  const titulo = obra.titulo?.trim() || obraLocal?.titulo || "Obra sem título";
  const slug = obra.slug?.trim() || obraLocal?.slug || criarSlugBase(titulo);
  const arquivoObra = obra.arquivo_url
    ? {
        nome: obra.arquivo_nome?.trim() || obraLocal?.arquivoObra?.nome || "Arquivo da obra",
        tipo: obra.arquivo_tipo || obraLocal?.arquivoObra?.tipo || "",
        tamanho:
          typeof obra.arquivo_tamanho === "number" &&
          Number.isFinite(obra.arquivo_tamanho)
            ? obra.arquivo_tamanho
            : obraLocal?.arquivoObra?.tamanho || 0,
        conteudo: obra.arquivo_url,
        categoria: normalizarCategoriaArquivoSupabase(obra.arquivo_categoria),
        criadoEm: obra.criada_em || obraLocal?.arquivoObra?.criadoEm || "",
      }
    : obraLocal?.arquivoObra || null;

  return {
    id: obra.id,
    titulo,
    autor:
      nomeProfileAutor.trim() ||
      obra.autor?.trim() ||
      obraLocal?.autor ||
      "Autor não informado",
    autorId: obra.user_id || obraLocal?.autorId || "",
    genero: obra.genero?.trim() || obraLocal?.genero || "Não informado",
    formato: obra.formato?.trim() || obraLocal?.formato || "Não informado",
    classificacaoIndicativa:
      obra.classificacao_indicativa?.trim() ||
      obraLocal?.classificacaoIndicativa ||
      "Não informada",
    sinopse: obra.sinopse?.trim() || obraLocal?.sinopse || "Nenhuma sinopse informada.",
    tags: normalizarTagsSupabase(obra.tags || obraLocal?.tags),
    capa: obra.capa_url || obraLocal?.capa || "",
    capaNome: obra.capa_nome || obraLocal?.capaNome || "",
    arquivoObra,
    publicado: Boolean(obra.publicado),
    capitulos,
    criadaEm: obra.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulos),
    visualizacoes: normalizarNumeroEditarCapitulo(
      obra.visualizacoes ?? obraLocal?.visualizacoes,
    ),
    totalCurtidas: normalizarNumeroEditarCapitulo(
      obraLocal?.totalCurtidas,
      capitulos.filter((capitulo) => capitulo.curtiu).length,
    ),
    totalComentarios: normalizarNumeroEditarCapitulo(
      obraLocal?.totalComentarios,
      capitulos.filter((capitulo) => capitulo.comentario.trim()).length,
    ),
    totalSalvos: normalizarNumeroEditarCapitulo(
      obraLocal?.totalSalvos,
      capitulos.filter((capitulo) => capitulo.salvo).length,
    ),
    totalLidos: normalizarNumeroEditarCapitulo(
      obraLocal?.totalLidos,
      capitulos.filter((capitulo) => capitulo.lido).length,
    ),
    totalFavoritos: normalizarNumeroEditarCapitulo(
      obraLocal?.totalFavoritos,
    ),
    totalConcluidas: normalizarNumeroEditarCapitulo(
      obraLocal?.totalConcluidas,
    ),
    slug,
    link: obra.link?.trim() || obraLocal?.link || `/obra/${slug}`,
  };
}
