import { criarSlugBase } from "../../../lib/utils";
import {
  normalizarAvisosConteudo18,
  type AvisoConteudo18,
} from "../../../lib/historietasAdultContent";
import { criarArquivoObraDeSupabase } from "./editar-obra-supabase-file-converter";
import {
  calcularProgressoLeitura,
  normalizarContadorEdicaoObra,
} from "./editar-obra-metrics-utils";

type CapituloLocalEdicaoObra = {
  id: string;
  titulo: string;
  texto: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
  publicado?: boolean;
};

type ArquivoObraLocalEdicaoObra = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: "texto" | "documento" | "imagem" | "outro";
  criadoEm: string;
};

type ObraLocalEdicaoObra = {
  id: string;
  titulo: string;
  autor: string;
  autorId?: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  avisosConteudo: AvisoConteudo18[];
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  arquivoObra?: ArquivoObraLocalEdicaoObra | null;
  publicado: boolean;
  capitulos: CapituloLocalEdicaoObra[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  visualizacoes?: number;
  totalCurtidas?: number;
  totalComentarios?: number;
  totalSalvos?: number;
  totalLidos?: number;
  slug: string;
  link: string;
};

type ObraSupabaseEdicaoObra = {
  id: string;
  user_id: string;
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
  arquivo_url: string | null;
  arquivo_nome: string | null;
  arquivo_tipo: string | null;
  arquivo_tamanho: number | null;
  arquivo_categoria: string | null;
  publicado: boolean | null;
  visualizacoes?: number | null;
  slug: string | null;
  link: string | null;
  criada_em: string | null;
};

type CapituloSupabaseEdicaoObra = {
  id: string;
  titulo: string | null;
  texto: string | null;
  publicado: boolean | null;
  criado_em: string | null;
};

export function normalizarObraSupabase(
  obraSupabase: ObraSupabaseEdicaoObra,
  capitulosSupabase: CapituloSupabaseEdicaoObra[],
  obraLocal: ObraLocalEdicaoObra | undefined,
  index: number,
) {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo]),
  );

  const capitulosRemotos = capitulosSupabase.map((capitulo, capituloIndex) => {
    const capituloLocal = capitulosLocaisPorId.get(capitulo.id);

    return {
      id: capitulo.id,
      titulo:
        capitulo.titulo?.trim() ||
        capituloLocal?.titulo ||
        `Capítulo ${capituloIndex + 1}`,
      texto: capitulo.texto || capituloLocal?.texto || "",
      curtiu: Boolean(capituloLocal?.curtiu),
      salvo: Boolean(capituloLocal?.salvo),
      comentario: capituloLocal?.comentario || "",
      criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
      lido: Boolean(capituloLocal?.lido),
      lidoEm: capituloLocal?.lidoEm || "",
      publicado: capitulo.publicado !== false,
    } satisfies CapituloLocalEdicaoObra;
  });

  // Para uma obra já existente no Supabase, a lista remota é a fonte
  // de verdade. Isso impede capítulos apagados de reaparecerem pelo cache local.
  const capitulosMesclados = capitulosRemotos;
  const tituloObra =
    obraSupabase.titulo?.trim() || obraLocal?.titulo || "Obra sem título";
  const slug =
    obraSupabase.slug?.trim() ||
    obraLocal?.slug ||
    criarSlugBase(tituloObra || `obra-${index + 1}`);

  return {
    id: obraSupabase.id || obraLocal?.id || `obra-${index + 1}`,
    titulo: tituloObra,
    autor: obraSupabase.autor?.trim() || obraLocal?.autor || "Autor não informado",
    autorId: obraSupabase.user_id?.trim() || obraLocal?.autorId || "",
    genero: obraSupabase.genero?.trim() || obraLocal?.genero || "Não informado",
    formato: obraSupabase.formato?.trim() || obraLocal?.formato || "Não informado",
    classificacaoIndicativa:
      obraSupabase.classificacao_indicativa?.trim() ||
      obraLocal?.classificacaoIndicativa ||
      "Livre",
    avisosConteudo: normalizarAvisosConteudo18(
      obraSupabase.avisos_conteudo ?? obraLocal?.avisosConteudo,
      obraSupabase.classificacao_indicativa ?? obraLocal?.classificacaoIndicativa,
    ),
    sinopse:
      obraSupabase.sinopse?.trim() ||
      obraLocal?.sinopse ||
      "Nenhuma sinopse informada.",
    tags:
      Array.isArray(obraSupabase.tags) && obraSupabase.tags.length > 0
        ? obraSupabase.tags
        : obraLocal?.tags || ["sem tags"],
    capa: obraSupabase.capa_url?.trim() || obraLocal?.capa || "",
    capaNome: obraSupabase.capa_nome?.trim() || obraLocal?.capaNome || "",
    arquivoObra: criarArquivoObraDeSupabase(
      obraSupabase,
      obraLocal?.arquivoObra || null,
    ),
    publicado: Boolean(obraSupabase.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obraSupabase.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    visualizacoes: normalizarContadorEdicaoObra(
      obraSupabase.visualizacoes,
      obraLocal?.visualizacoes || 0,
    ),
    totalCurtidas: normalizarContadorEdicaoObra(
      obraLocal?.totalCurtidas,
      capitulosMesclados.filter((capitulo) => capitulo.curtiu).length,
    ),
    totalComentarios: normalizarContadorEdicaoObra(
      obraLocal?.totalComentarios,
      capitulosMesclados.filter((capitulo) => capitulo.comentario.trim()).length,
    ),
    totalSalvos: normalizarContadorEdicaoObra(
      obraLocal?.totalSalvos,
      capitulosMesclados.filter((capitulo) => capitulo.salvo).length,
    ),
    totalLidos: normalizarContadorEdicaoObra(
      obraLocal?.totalLidos,
      capitulosMesclados.filter((capitulo) => capitulo.lido).length,
    ),
    slug,
    link: obraSupabase.link?.trim() || obraLocal?.link || `/obra/${slug}`,
  };
}
