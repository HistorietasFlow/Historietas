import { criarSlugBase } from "../../lib/utils";
import { normalizarNumeroHome } from "./home-format-utils";
import { calcularProgressoLeitura } from "./home-reading-utils";

type CapituloLocalHome = {
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

type ObraLocalHome = {
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
  arquivoObra?: unknown;
  publicado: boolean;
  capitulos: CapituloLocalHome[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  visualizacoes: number;
  totalCurtidas: number;
  totalComentarios: number;
  slug: string;
  link: string;
};

type SupabaseObraHomeRow = {
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

type SupabaseCapituloHomeRow = {
  id: string;
  obra_id: string;
  titulo: string | null;
  ordem: number | null;
  criado_em: string | null;
};

export function normalizarCategoriaArquivoHome(categoria: string | null) {
  if (
    categoria === "texto" ||
    categoria === "documento" ||
    categoria === "imagem" ||
    categoria === "outro"
  ) {
    return categoria;
  }

  return "outro";
}

export function criarArquivoObraSupabaseHome(obra: SupabaseObraHomeRow) {
  const arquivoUrl = obra.arquivo_url?.trim() || "";

  if (!arquivoUrl) {
    return null;
  }

  const categoriaArquivo = normalizarCategoriaArquivoHome(
    obra.arquivo_categoria
  );
  const tipoArquivo =
    obra.arquivo_tipo?.trim() ||
    (categoriaArquivo === "documento"
      ? "application/pdf"
      : categoriaArquivo === "imagem"
      ? "image/*"
      : categoriaArquivo === "texto"
      ? "text/plain"
      : "");

  return {
    nome: obra.arquivo_nome?.trim() || "Arquivo da obra",
    tipo: tipoArquivo,
    tamanho:
      typeof obra.arquivo_tamanho === "number" &&
      Number.isFinite(obra.arquivo_tamanho)
        ? obra.arquivo_tamanho
        : 0,
    conteudo: arquivoUrl,
    categoria: categoriaArquivo,
    criadoEm: obra.criada_em || "",
  };
}

export function normalizarObraSupabaseHome(
  obra: SupabaseObraHomeRow,
  capitulosSupabase: SupabaseCapituloHomeRow[],
  obraLocal: ObraLocalHome | undefined,
  index: number
): ObraLocalHome {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo])
  );

  const capitulosOrdenados = [...capitulosSupabase].sort((capituloA, capituloB) => {
    return (capituloA.ordem ?? 0) - (capituloB.ordem ?? 0);
  });

  const capitulosRemotos = capitulosOrdenados.map((capitulo, capituloIndex) => {
    const capituloLocal = capitulosLocaisPorId.get(capitulo.id);

    return {
      id: capitulo.id,
      titulo:
        capitulo.titulo?.trim() ||
        `Capítulo ${capituloIndex + 1}`,
      texto: "",
      curtiu: Boolean(capituloLocal?.curtiu),
      salvo: Boolean(capituloLocal?.salvo),
      comentario: capituloLocal?.comentario || "",
      criadoEm: capitulo.criado_em || "",
      lido: Boolean(capituloLocal?.lido),
      lidoEm: capituloLocal?.lidoEm || "",
      publicado: true,
    } satisfies CapituloLocalHome;
  });

  const capitulosMesclados = capitulosRemotos;

  const tituloObra = obra.titulo?.trim() || "Obra sem título";
  const slugObra =
    obra.slug?.trim() ||
    criarSlugBase(tituloObra || `obra-${index + 1}`);

  return {
    id: obra.id || `obra-${index + 1}`,
    titulo: tituloObra,
    autor: obra.autor?.trim() || "Autor não informado",
    autorId: obra.user_id?.trim() || "",
    genero: obra.genero?.trim() || "Não informado",
    formato: obra.formato?.trim() || "Não informado",
    classificacaoIndicativa:
      obra.classificacao_indicativa?.trim() ||
      "Não informada",
    sinopse:
      obra.sinopse?.trim() ||
      "Nenhuma sinopse informada.",
    tags:
      Array.isArray(obra.tags) && obra.tags.length > 0
        ? obra.tags.filter((tag) => typeof tag === "string" && Boolean(tag.trim()))
        : ["sem tags"],
    capa: obra.capa_url?.trim() || "",
    capaNome: obra.capa_nome?.trim() || "",
    arquivoObra: criarArquivoObraSupabaseHome(obra),
    publicado: Boolean(obra.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obra.criada_em || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    visualizacoes: normalizarNumeroHome(obra.visualizacoes),
    totalCurtidas: capitulosMesclados.filter((capitulo) => capitulo.curtiu).length,
    totalComentarios: capitulosMesclados.filter((capitulo) =>
      capitulo.comentario.trim(),
    ).length,
    slug: slugObra,
    link: obra.link?.trim() || `/obra/${slugObra}`,
  };
}
