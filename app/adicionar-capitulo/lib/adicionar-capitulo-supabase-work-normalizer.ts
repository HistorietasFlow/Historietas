import { criarSlugBase } from "../../../lib/utils";
import { calcularProgressoLeitura } from "./adicionar-capitulo-metrics-utils";
import { normalizarNumeroAdicionarCapitulo } from "./adicionar-capitulo-number-utils";
import {
  normalizarCapituloSupabase,
  normalizarCategoriaSupabase,
} from "./adicionar-capitulo-supabase-normalization";

type SupabaseCapituloRow = {
  id: string;
  obra_id: string;
  user_id: string;
  titulo: string | null;
  texto: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

type SupabaseObraRow = {
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
  visualizacoes?: number | null;
  views?: number | null;
  total_visualizacoes?: number | null;
  total_curtidas?: number | null;
  total_comentarios?: number | null;
  total_salvos?: number | null;
  total_lidos?: number | null;
  slug: string | null;
  link: string | null;
  criada_em: string | null;
  atualizado_em: string | null;
  capitulos?: SupabaseCapituloRow[] | null;
};

type ArquivoObraLocal = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: "texto" | "documento" | "imagem" | "outro";
  criadoEm: string;
};

type CapituloLocal = {
  id: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  lido: boolean;
  lidoEm: string;
};

type ObraLocal = {
  autor?: string;
  autorId?: string;
  capa?: string;
  capaNome?: string;
  arquivoObra?: ArquivoObraLocal | null;
  capitulos?: CapituloLocal[];
  criadaEm?: string;
  ultimoCapituloLidoId?: string;
  ultimaLeituraEm?: string;
  visualizacoes?: number;
  totalCurtidas?: number;
  totalComentarios?: number;
  totalSalvos?: number;
  totalLidos?: number;
};

export function normalizarObraSupabase(
  obra: SupabaseObraRow,
  index: number,
  obraLocal?: ObraLocal,
  autorProfile = ""
) {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo])
  );

  const capitulosSupabase = Array.isArray(obra.capitulos)
    ? [...obra.capitulos].sort((capituloA, capituloB) => {
        const ordemA =
          typeof capituloA.ordem === "number" ? capituloA.ordem : 999999;
        const ordemB =
          typeof capituloB.ordem === "number" ? capituloB.ordem : 999999;

        return ordemA - ordemB;
      })
    : [];

  const capitulosNormalizados = capitulosSupabase.map((capitulo, capituloIndex) =>
    normalizarCapituloSupabase(
      capitulo,
      capituloIndex,
      capitulosLocaisPorId.get(capitulo.id)
    )
  );

  const arquivoObraSupabase: ArquivoObraLocal | null = obra.arquivo_url
    ? {
        nome: obra.arquivo_nome?.trim() || "Arquivo da obra",
        tipo: obra.arquivo_tipo || "",
        tamanho:
          typeof obra.arquivo_tamanho === "number"
            ? obra.arquivo_tamanho
            : 0,
        conteudo: obra.arquivo_url,
        categoria: normalizarCategoriaSupabase(obra.arquivo_categoria),
        criadoEm: obra.criada_em || "",
      }
    : null;

  const titulo = obra.titulo?.trim() || "Obra sem título";
  const slug = obra.slug?.trim() || criarSlugBase(titulo || `obra-${index + 1}`);
  const totalCurtidasLocal = capitulosNormalizados.filter((capitulo) => capitulo.curtiu).length;
  const totalComentariosLocal = capitulosNormalizados.filter((capitulo) =>
    capitulo.comentario.trim()
  ).length;
  const totalSalvosLocal = capitulosNormalizados.filter((capitulo) => capitulo.salvo).length;
  const totalLidosLocal = capitulosNormalizados.filter((capitulo) => capitulo.lido).length;

  return {
    id: obra.id,
    titulo,
    autor:
      autorProfile.trim() ||
      obra.autor?.trim() ||
      obraLocal?.autor ||
      "Autor não informado",
    autorId: obra.user_id || obraLocal?.autorId || "",
    genero: obra.genero?.trim() || "Não informado",
    formato: obra.formato?.trim() || "Não informado",
    classificacaoIndicativa:
      obra.classificacao_indicativa?.trim() || "Não informada",
    sinopse: obra.sinopse?.trim() || "Nenhuma sinopse informada.",
    tags:
      Array.isArray(obra.tags) && obra.tags.length > 0
        ? obra.tags.filter((tag) => typeof tag === "string" && Boolean(tag.trim()))
        : ["sem tags"],
    capa: obra.capa_url || obraLocal?.capa || "",
    capaNome: obra.capa_nome || obraLocal?.capaNome || "",
    arquivoObra: arquivoObraSupabase || obraLocal?.arquivoObra || null,
    publicado: Boolean(obra.publicado),
    capitulos: capitulosNormalizados,
    criadaEm: obra.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulosNormalizados),
    visualizacoes: normalizarNumeroAdicionarCapitulo(
      obra.visualizacoes ?? obra.views ?? obra.total_visualizacoes,
      obraLocal?.visualizacoes || 0
    ),
    totalCurtidas: normalizarNumeroAdicionarCapitulo(
      obra.total_curtidas,
      Math.max(obraLocal?.totalCurtidas || 0, totalCurtidasLocal)
    ),
    totalComentarios: normalizarNumeroAdicionarCapitulo(
      obra.total_comentarios,
      Math.max(obraLocal?.totalComentarios || 0, totalComentariosLocal)
    ),
    totalSalvos: normalizarNumeroAdicionarCapitulo(
      obra.total_salvos,
      Math.max(obraLocal?.totalSalvos || 0, totalSalvosLocal)
    ),
    totalLidos: normalizarNumeroAdicionarCapitulo(
      obra.total_lidos,
      Math.max(obraLocal?.totalLidos || 0, totalLidosLocal)
    ),
    slug,
    link: obra.link?.trim() || `/obra/${slug}`,
  };
}
