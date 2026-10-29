import { criarSlugBase } from "../../../../lib/utils";
import type {
  ArquivoObraLocal,
  CapituloLocal,
  ObraTop5,
  ObraTop5Salva,
  SupabaseObraTop5Row,
} from "./top5-types";

export function pegarTexto(valor: unknown, fallback = "") {
  return typeof valor === "string" && valor.trim() ? valor.trim() : fallback;
}

function pegarNumero(valor: unknown, fallback = 0) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return Math.max(0, Math.round(valor));
  }

  if (typeof valor === "string" && valor.trim()) {
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));

    if (Number.isFinite(numero)) {
      return Math.max(0, Math.round(numero));
    }
  }

  return fallback;
}

function pegarBooleano(valor: unknown, fallback = false) {
  return typeof valor === "boolean" ? valor : fallback;
}

function pegarTags(valor: unknown): string[] {
  if (Array.isArray(valor)) {
    const tags = valor
      .filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
      .map((tag) => tag.trim());

    return tags.length > 0 ? tags : ["sem tags"];
  }

  if (typeof valor === "string" && valor.trim()) {
    const tags = valor
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    return tags.length > 0 ? tags : ["sem tags"];
  }

  return ["sem tags"];
}

function normalizarCategoriaArquivo(tipo: string): ArquivoObraLocal["categoria"] {
  const tipoNormalizado = tipo.toLowerCase();

  if (tipoNormalizado.startsWith("image/")) {
    return "imagem";
  }

  if (tipoNormalizado.includes("pdf") || tipoNormalizado.includes("document")) {
    return "documento";
  }

  if (tipoNormalizado.startsWith("text/") || tipoNormalizado.includes("markdown")) {
    return "texto";
  }

  return "outro";
}

function normalizarArquivoObra(valor: unknown): ArquivoObraLocal | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return null;
  }

  const arquivo = valor as Partial<ArquivoObraLocal>;

  if (
    typeof arquivo.nome !== "string" ||
    !arquivo.nome.trim() ||
    typeof arquivo.conteudo !== "string" ||
    !arquivo.conteudo.trim()
  ) {
    return null;
  }

  const tipo = typeof arquivo.tipo === "string" ? arquivo.tipo : "";

  return {
    nome: arquivo.nome.trim(),
    tipo,
    tamanho:
      typeof arquivo.tamanho === "number" && Number.isFinite(arquivo.tamanho)
        ? arquivo.tamanho
        : 0,
    conteudo: arquivo.conteudo,
    categoria:
      arquivo.categoria === "texto" ||
      arquivo.categoria === "documento" ||
      arquivo.categoria === "imagem" ||
      arquivo.categoria === "outro"
        ? arquivo.categoria
        : normalizarCategoriaArquivo(tipo),
    criadoEm: typeof arquivo.criadoEm === "string" ? arquivo.criadoEm : "",
  };
}

function normalizarCapituloTop5(
  capitulo: Partial<CapituloLocal>,
  capituloIndex: number,
  obraIndex: number,
): CapituloLocal {
  return {
    id:
      typeof capitulo.id === "string" && capitulo.id.trim()
        ? capitulo.id
        : `capitulo-${obraIndex + 1}-${capituloIndex + 1}`,
    titulo:
      typeof capitulo.titulo === "string" && capitulo.titulo.trim()
        ? capitulo.titulo
        : "Capítulo sem título",
    texto: typeof capitulo.texto === "string" ? capitulo.texto : "",
    curtiu: Boolean(capitulo.curtiu),
    salvo: Boolean(capitulo.salvo),
    comentario: typeof capitulo.comentario === "string" ? capitulo.comentario : "",
    criadoEm: typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
    lido: Boolean(capitulo.lido),
    lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
  };
}

export function normalizarObraLocalTop5(obra: ObraTop5Salva, obraIndex: number): ObraTop5 {
  const titulo = pegarTexto(obra.titulo, `Obra ${obraIndex + 1}`);
  const slug = pegarTexto(obra.slug, criarSlugBase(titulo));
  const capitulos = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapituloTop5(capitulo as Partial<CapituloLocal>, capituloIndex, obraIndex),
      )
    : [];

  return {
    id: pegarTexto(obra.id, `obra-${obraIndex + 1}`),
    titulo,
    autorId: pegarTexto(obra.autorId ?? obra.user_id ?? obra.autor_id, ""),
    autor: pegarTexto(obra.autor ?? obra.nome_autor ?? obra.autor_nome, "Autor não informado"),
    genero: pegarTexto(obra.genero, "Não informado"),
    formato: pegarTexto(obra.formato, "Não informado"),
    classificacaoIndicativa: pegarTexto(
      obra.classificacaoIndicativa ?? obra.classificacao_indicativa,
      "Não informada",
    ),
    sinopse: pegarTexto(obra.sinopse, ""),
    tags: pegarTags(obra.tags),
    capa: pegarTexto(obra.capa ?? obra.capa_url ?? obra.capaUrl, ""),
    capaNome: pegarTexto(obra.capaNome ?? obra.capa_nome, ""),
    arquivoObra: normalizarArquivoObra(obra.arquivoObra),
    publicado: pegarBooleano(obra.publicado, false),
    capitulos,
    criadaEm: pegarTexto(obra.criadaEm ?? obra.criada_em ?? obra.created_at, ""),
    ultimoCapituloLidoId: pegarTexto(obra.ultimoCapituloLidoId, ""),
    ultimaLeituraEm: pegarTexto(obra.ultimaLeituraEm, ""),
    progressoLeitura: pegarNumero(obra.progressoLeitura, 0),
    visualizacoes: pegarNumero(
      obra.visualizacoes ??
        obra.views ??
        obra.visualizacoesTotal ??
        obra.totalVisualizacoes ??
        obra.total_visualizacoes,
      0,
    ),
    slug,
    link: pegarTexto(obra.link, `/obra/${slug}`),
  };
}

export function normalizarObraSupabaseTop5(row: SupabaseObraTop5Row, index: number): ObraTop5 {
  const titulo = pegarTexto(row.titulo, `Obra ${index + 1}`);
  const slug = pegarTexto(row.slug, criarSlugBase(titulo));

  return {
    id: pegarTexto(row.id, `supabase-${index + 1}`),
    titulo,
    autorId: pegarTexto(row.user_id ?? row.autor_id ?? row.autorId, ""),
    autor: pegarTexto(row.autor ?? row.nome_autor ?? row.autor_nome, "Autor não informado"),
    genero: pegarTexto(row.genero, "Não informado"),
    formato: pegarTexto(row.formato, "Não informado"),
    classificacaoIndicativa: pegarTexto(
      row.classificacao_indicativa ?? row.classificacaoIndicativa,
      "Não informada",
    ),
    sinopse: pegarTexto(row.sinopse, ""),
    tags: pegarTags(row.tags),
    capa: pegarTexto(row.capa_url ?? row.capaUrl ?? row.capa, ""),
    capaNome: pegarTexto(row.capa_nome ?? row.capaNome, ""),
    arquivoObra: null,
    publicado: pegarBooleano(row.publicado, false),
    capitulos: [],
    criadaEm: pegarTexto(row.created_at ?? row.criada_em ?? row.criadaEm, ""),
    ultimoCapituloLidoId: "",
    ultimaLeituraEm: "",
    progressoLeitura: 0,
    visualizacoes: pegarNumero(
      row.visualizacoes ??
        row.views ??
        row.visualizacoes_total ??
        row.total_visualizacoes ??
        row.totalVisualizacoes,
      0,
    ),
    slug,
    link: `/obra/${slug}`,
  };
}
