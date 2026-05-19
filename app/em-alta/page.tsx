"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { obras } from "../data/obras";
import { supabase } from "../../lib/supabase/client";

type CapituloLocal = {
  id: string;
  titulo: string;
  texto: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
};

type ArquivoObraLocal = {
  nome: string;
  tipo: "imagem" | "documento" | "texto" | "outro";
  tamanho: number;
  conteudo: string;
  enviadoEm: string;
};

type ObraLocal = {
  id: string;
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  publicado: boolean;
  capitulos: CapituloLocal[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  slug: string;
  link: string;
  arquivoObra: ArquivoObraLocal | null;
  totalCurtidasRanking?: number;
  totalComentariosRanking?: number;
  totalSalvosRanking?: number;
  totalViewsRanking?: number;
};

type SupabaseObraRow = {
  id: string;
  user_id: string | null;
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
  slug: string | null;
  link: string | null;
  criada_em: string | null;
  atualizado_em: string | null;
};

type SupabaseCapituloRow = {
  id: string;
  obra_id: string;
  user_id: string | null;
  titulo: string | null;
  texto: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

type SupabaseInteracaoCapituloRow = {
  capitulo_id: string | null;
};

type ObraRanking = {
  id: string;
  storageId: string;
  tipo: "fixa" | "local";
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  status: string;
  href: string;
  disponivel: boolean;
  capa: string;
  capaNome: string;
  capitulos: number;
  capitulosLidos: number;
  progressoLeitura: number;
  ultimoCapituloLidoTitulo: string;
  ultimoCapituloLidoHref: string;
  ultimaLeituraEm: string;
  curtidas: number;
  comentarios: number;
  salvos: number;
  views: number;
  pontuacao: number;
  criadaEmTimestamp: number;
};

type TipoRanking =
  | "geral"
  | "lidas"
  | "curtidas"
  | "comentadas"
  | "salvas"
  | "recentes"
  | "capitulos";

type FiltroEmAlta =
  | "todos"
  | "catalogo"
  | "publicadas"
  | "em-leitura"
  | "favoritas"
  | "concluidas";

const STORAGE_KEY = "historietas-obras";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";

function normalizarTexto(texto: string) {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function criarSlugBase(titulo: string) {
  const slug = normalizarTexto(titulo)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "obra";
}

function criarLinkEmBreve(titulo: string) {
  const tituloLimpo = titulo.trim();

  if (!tituloLimpo) {
    return "/em-breve";
  }

  return `/em-breve?obra=${encodeURIComponent(tituloLimpo)}`;
}


function converterMetrica(valor: unknown) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return valor;
  }

  const texto = String(valor ?? "")
    .trim()
    .toLowerCase()
    .replace(",", ".");

  if (!texto) {
    return 0;
  }

  const numero = parseFloat(texto.replace(/[^\d.]/g, ""));

  if (!Number.isFinite(numero)) {
    return 0;
  }

  if (texto.includes("k")) {
    return Math.round(numero * 1000);
  }

  if (texto.includes("m")) {
    return Math.round(numero * 1000000);
  }

  return Math.round(numero);
}

function formatarNumero(numero: number) {
  if (!Number.isFinite(numero)) {
    return "0";
  }

  return numero.toLocaleString("pt-BR");
}

function formatarDataRanking(timestamp: number) {
  if (!timestamp) {
    return "Sem data";
  }

  const data = new Date(timestamp);

  if (Number.isNaN(data.getTime())) {
    return "Sem data";
  }

  return data.toLocaleDateString("pt-BR");
}

function formatarDataLeitura(dataIso: string) {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return "Não registrada";
  }

  return data.toLocaleDateString("pt-BR");
}

function calcularCapitulosLidos(capitulos: CapituloLocal[]) {
  return capitulos.filter((capitulo) => capitulo.lido).length;
}

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  return Math.round((calcularCapitulosLidos(capitulos) / capitulos.length) * 100);
}

function normalizarCapitulo(
  capitulo: Partial<CapituloLocal>,
  index: number
): CapituloLocal {
  return {
    id:
      typeof capitulo.id === "string" && capitulo.id.trim()
        ? capitulo.id
        : `capitulo-${index + 1}`,
    titulo:
      typeof capitulo.titulo === "string" && capitulo.titulo.trim()
        ? capitulo.titulo
        : "Capítulo sem título",
    texto: typeof capitulo.texto === "string" ? capitulo.texto : "",
    curtiu: Boolean(capitulo.curtiu),
    salvo: Boolean(capitulo.salvo),
    comentario:
      typeof capitulo.comentario === "string" ? capitulo.comentario : "",
    criadoEm: typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
    lido: Boolean(capitulo.lido),
    lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
  };
}

function normalizarArquivoObra(valor: unknown): ArquivoObraLocal | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return null;
  }

  const arquivo = valor as Partial<ArquivoObraLocal>;

  const nome =
    typeof arquivo.nome === "string" && arquivo.nome.trim()
      ? arquivo.nome.trim()
      : "arquivo-da-obra";

  const tipo =
    arquivo.tipo === "imagem" ||
    arquivo.tipo === "documento" ||
    arquivo.tipo === "texto" ||
    arquivo.tipo === "outro"
      ? arquivo.tipo
      : "outro";

  const tamanho =
    typeof arquivo.tamanho === "number" && Number.isFinite(arquivo.tamanho)
      ? arquivo.tamanho
      : 0;

  const conteudo = typeof arquivo.conteudo === "string" ? arquivo.conteudo : "";
  const enviadoEm =
    typeof arquivo.enviadoEm === "string" ? arquivo.enviadoEm : "";

  if (!conteudo) {
    return null;
  }

  return {
    nome,
    tipo,
    tamanho,
    conteudo,
    enviadoEm,
  };
}


function normalizarTipoArquivoSupabase(tipo: string | null): ArquivoObraLocal["tipo"] {
  if (tipo === "imagem" || tipo === "documento" || tipo === "texto" || tipo === "outro") {
    return tipo;
  }

  return "outro";
}

function contarPorCapitulo(linhas: SupabaseInteracaoCapituloRow[]) {
  return linhas.reduce<Record<string, number>>((contagem, linha) => {
    const capituloId = linha.capitulo_id?.trim();

    if (!capituloId) {
      return contagem;
    }

    contagem[capituloId] = (contagem[capituloId] || 0) + 1;

    return contagem;
  }, {});
}

async function buscarContagemInteracoesCapitulos(
  tabela: "curtidas_capitulos" | "salvos_capitulos" | "comentarios_capitulos",
  capituloIds: string[]
) {
  if (capituloIds.length === 0) {
    return {};
  }

  try {
    const { data, error } = await supabase
      .from(tabela)
      .select("capitulo_id")
      .in("capitulo_id", capituloIds);

    if (error) {
      console.warn(`Não consegui carregar ${tabela}:`, error.message);
      return {};
    }

    return contarPorCapitulo((data || []) as SupabaseInteracaoCapituloRow[]);
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} agora:`, error);
    return {};
  }
}

function somarContagensCapitulos(
  capitulos: SupabaseCapituloRow[],
  contagem: Record<string, number>
) {
  return capitulos.reduce((total, capitulo) => {
    return total + (contagem[capitulo.id] || 0);
  }, 0);
}

function converterObraSupabaseParaLocal(
  obra: SupabaseObraRow,
  capitulos: SupabaseCapituloRow[],
  obraLocal: ObraLocal | undefined,
  index: number,
  curtidasPorCapitulo: Record<string, number>,
  salvosPorCapitulo: Record<string, number>,
  comentariosPorCapitulo: Record<string, number>
): ObraLocal {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo])
  );

  const capitulosNormalizados = capitulos.map((capitulo, capituloIndex) => {
    const capituloLocal = capitulosLocaisPorId.get(capitulo.id);
    const totalCurtidas = curtidasPorCapitulo[capitulo.id] || 0;
    const totalSalvos = salvosPorCapitulo[capitulo.id] || 0;
    const totalComentarios = comentariosPorCapitulo[capitulo.id] || 0;

    return {
      id: capitulo.id,
      titulo:
        capitulo.titulo?.trim() ||
        capituloLocal?.titulo ||
        `Capítulo ${capituloIndex + 1}`,
      texto: capitulo.texto || capituloLocal?.texto || "",
      curtiu: Boolean(capituloLocal?.curtiu) || totalCurtidas > 0,
      salvo: Boolean(capituloLocal?.salvo) || totalSalvos > 0,
      comentario:
        capituloLocal?.comentario || (totalComentarios > 0 ? `${totalComentarios} comentário(s)` : ""),
      criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
      lido: Boolean(capituloLocal?.lido),
      lidoEm: capituloLocal?.lidoEm || "",
    } satisfies CapituloLocal;
  });

  const capitulosRemotosIds = new Set(
    capitulosNormalizados.map((capitulo) => capitulo.id)
  );
  const capitulosApenasLocais = (obraLocal?.capitulos || []).filter(
    (capitulo) => !capitulosRemotosIds.has(capitulo.id)
  );
  const capitulosMesclados = [...capitulosNormalizados, ...capitulosApenasLocais];
  const titulo = obra.titulo?.trim() || obraLocal?.titulo || "Obra sem título";
  const slug = obra.slug?.trim() || obraLocal?.slug || criarSlugBase(titulo || `obra-${index + 1}`);
  const arquivoUrl = obra.arquivo_url?.trim() || "";
  const arquivoTipo = normalizarTipoArquivoSupabase(obra.arquivo_categoria);

  return {
    id: obra.id || obraLocal?.id || `obra-${index + 1}`,
    titulo,
    autor: obra.autor?.trim() || obraLocal?.autor || "Autor não informado",
    genero: obra.genero?.trim() || obraLocal?.genero || "Não informado",
    formato: obra.formato?.trim() || obraLocal?.formato || "Não informado",
    classificacaoIndicativa:
      obra.classificacao_indicativa?.trim() ||
      obraLocal?.classificacaoIndicativa ||
      "Não informada",
    sinopse:
      obra.sinopse?.trim() || obraLocal?.sinopse || "Nenhuma sinopse informada.",
    tags:
      Array.isArray(obra.tags) && obra.tags.length > 0
        ? obra.tags.filter((tag) => typeof tag === "string" && Boolean(tag.trim()))
        : obraLocal?.tags || ["sem tags"],
    capa: obra.capa_url?.trim() || obraLocal?.capa || "",
    capaNome: obra.capa_nome?.trim() || obraLocal?.capaNome || "",
    publicado: Boolean(obra.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obra.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    slug,
    link: obra.link?.trim() || obraLocal?.link || `/obra/${slug}`,
    arquivoObra: arquivoUrl
      ? {
          nome: obra.arquivo_nome?.trim() || obraLocal?.arquivoObra?.nome || "Arquivo da obra",
          tipo: arquivoTipo,
          tamanho:
            typeof obra.arquivo_tamanho === "number" && Number.isFinite(obra.arquivo_tamanho)
              ? obra.arquivo_tamanho
              : obraLocal?.arquivoObra?.tamanho || 0,
          conteudo: arquivoUrl,
          enviadoEm: obra.criada_em || obraLocal?.arquivoObra?.enviadoEm || "",
        }
      : obraLocal?.arquivoObra || null,
    totalCurtidasRanking: Math.max(
      obraLocal?.totalCurtidasRanking || 0,
      somarContagensCapitulos(capitulos, curtidasPorCapitulo)
    ),
    totalComentariosRanking: Math.max(
      obraLocal?.totalComentariosRanking || 0,
      somarContagensCapitulos(capitulos, comentariosPorCapitulo)
    ),
    totalSalvosRanking: Math.max(
      obraLocal?.totalSalvosRanking || 0,
      somarContagensCapitulos(capitulos, salvosPorCapitulo)
    ),
    totalViewsRanking: obraLocal?.totalViewsRanking || 0,
  };
}

async function carregarObrasSupabasePublicadas(obrasLocais: ObraLocal[]) {
  try {
    const { data: obrasBanco, error: erroObras } = await supabase
      .from("obras")
      .select("*")
      .eq("publicado", true)
      .order("criada_em", { ascending: false })
      .limit(80);

    if (erroObras) {
      console.warn("Não consegui carregar obras publicadas do Supabase:", erroObras.message);
      return obrasLocais;
    }

    const obrasSupabase = (obrasBanco || []) as SupabaseObraRow[];

    if (obrasSupabase.length === 0) {
      return obrasLocais;
    }

    const obraIds = obrasSupabase.map((obra) => obra.id).filter(Boolean);

    const { data: capitulosBanco, error: erroCapitulos } = await supabase
      .from("capitulos")
      .select("*")
      .in("obra_id", obraIds)
      .order("ordem", { ascending: true });

    if (erroCapitulos) {
      console.warn("Não consegui carregar capítulos do ranking:", erroCapitulos.message);
    }

    const capitulosSupabase = erroCapitulos
      ? []
      : ((capitulosBanco || []) as SupabaseCapituloRow[]);
    const capituloIds = capitulosSupabase.map((capitulo) => capitulo.id).filter(Boolean);

    const [curtidasPorCapitulo, salvosPorCapitulo, comentariosPorCapitulo] =
      await Promise.all([
        buscarContagemInteracoesCapitulos("curtidas_capitulos", capituloIds),
        buscarContagemInteracoesCapitulos("salvos_capitulos", capituloIds),
        buscarContagemInteracoesCapitulos("comentarios_capitulos", capituloIds),
      ]);

    const capitulosPorObra = capitulosSupabase.reduce<Record<string, SupabaseCapituloRow[]>>(
      (grupos, capitulo) => {
        if (!grupos[capitulo.obra_id]) {
          grupos[capitulo.obra_id] = [];
        }

        grupos[capitulo.obra_id].push(capitulo);

        return grupos;
      },
      {}
    );

    const obrasLocaisPorId = new Map(obrasLocais.map((obra) => [obra.id, obra]));
    const obrasLocaisPorSlug = new Map(obrasLocais.map((obra) => [obra.slug, obra]));

    const obrasSupabaseNormalizadas = obrasSupabase.map((obra, index) => {
      const slug = obra.slug?.trim() || criarSlugBase(obra.titulo || `obra-${index + 1}`);
      const obraLocal = obrasLocaisPorId.get(obra.id) || obrasLocaisPorSlug.get(slug);

      return converterObraSupabaseParaLocal(
        obra,
        capitulosPorObra[obra.id] || [],
        obraLocal,
        index,
        curtidasPorCapitulo,
        salvosPorCapitulo,
        comentariosPorCapitulo
      );
    });

    const idsRemotos = new Set(obrasSupabaseNormalizadas.map((obra) => obra.id));
    const slugsRemotos = new Set(obrasSupabaseNormalizadas.map((obra) => obra.slug));
    const obrasLocaisSemDuplicar = obrasLocais.filter((obra) => {
      return !idsRemotos.has(obra.id) && !slugsRemotos.has(obra.slug);
    });
    const obrasAtualizadas = [...obrasSupabaseNormalizadas, ...obrasLocaisSemDuplicar];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasAtualizadas));

    return obrasAtualizadas;
  } catch (error) {
    console.warn("Não consegui acessar o Supabase no Em Alta agora:", error);
    return obrasLocais;
  }
}

function normalizarObra(obra: Partial<ObraLocal>, index: number): ObraLocal {
  const capitulosNormalizados: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapitulo(capitulo, capituloIndex)
      )
    : [];

  const tagsNormalizadas = Array.isArray(obra.tags)
    ? obra.tags
        .filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
        .map((tag) => tag.trim())
    : [];

  const titulo =
    typeof obra.titulo === "string" && obra.titulo.trim()
      ? obra.titulo.trim()
      : "Obra sem título";

  const slug =
    typeof obra.slug === "string" && obra.slug.trim()
      ? obra.slug.trim()
      : criarSlugBase(titulo || `obra-${index + 1}`);

  return {
    id:
      typeof obra.id === "string" && obra.id.trim()
        ? obra.id
        : `obra-${index + 1}`,
    titulo,
    autor:
      typeof obra.autor === "string" && obra.autor.trim()
        ? obra.autor
        : "Autor não informado",
    genero:
      typeof obra.genero === "string" && obra.genero.trim()
        ? obra.genero
        : "Não informado",
    formato:
      typeof obra.formato === "string" && obra.formato.trim()
        ? obra.formato
        : "Não informado",
    classificacaoIndicativa:
      typeof obra.classificacaoIndicativa === "string" &&
      obra.classificacaoIndicativa.trim()
        ? obra.classificacaoIndicativa
        : "Não informada",
    sinopse:
      typeof obra.sinopse === "string" && obra.sinopse.trim()
        ? obra.sinopse
        : "Nenhuma sinopse informada.",
    tags: tagsNormalizadas.length > 0 ? tagsNormalizadas : ["sem tags"],
    capa: typeof obra.capa === "string" ? obra.capa : "",
    capaNome: typeof obra.capaNome === "string" ? obra.capaNome : "",
    publicado: Boolean(obra.publicado),
    capitulos: capitulosNormalizados,
    criadaEm: typeof obra.criadaEm === "string" ? obra.criadaEm : "",
    ultimoCapituloLidoId:
      typeof obra.ultimoCapituloLidoId === "string"
        ? obra.ultimoCapituloLidoId
        : "",
    ultimaLeituraEm:
      typeof obra.ultimaLeituraEm === "string" ? obra.ultimaLeituraEm : "",
    progressoLeitura: calcularProgressoLeitura(capitulosNormalizados),
    slug,
    link:
      typeof obra.link === "string" && obra.link.trim()
        ? obra.link
        : `/obra/${slug}`,
    arquivoObra: normalizarArquivoObra(obra.arquivoObra),
    totalCurtidasRanking:
      typeof obra.totalCurtidasRanking === "number" && Number.isFinite(obra.totalCurtidasRanking)
        ? obra.totalCurtidasRanking
        : 0,
    totalComentariosRanking:
      typeof obra.totalComentariosRanking === "number" && Number.isFinite(obra.totalComentariosRanking)
        ? obra.totalComentariosRanking
        : 0,
    totalSalvosRanking:
      typeof obra.totalSalvosRanking === "number" && Number.isFinite(obra.totalSalvosRanking)
        ? obra.totalSalvosRanking
        : 0,
    totalViewsRanking:
      typeof obra.totalViewsRanking === "number" && Number.isFinite(obra.totalViewsRanking)
        ? obra.totalViewsRanking
        : 0,
  };
}

function encontrarCapituloParaContinuar(obra: ObraLocal) {
  const capituloRegistrado = obra.ultimoCapituloLidoId
    ? obra.capitulos.find(
        (capitulo) => capitulo.id === obra.ultimoCapituloLidoId
      )
    : null;

  if (capituloRegistrado) {
    return capituloRegistrado;
  }

  const capitulosAtivos = obra.capitulos.filter((capitulo) => {
    return (
      capitulo.lido ||
      capitulo.salvo ||
      capitulo.curtiu ||
      Boolean(capitulo.comentario.trim())
    );
  });

  return capitulosAtivos[capitulosAtivos.length - 1] || null;
}

function criarRankingCoverStyle(capa: string, isDesktop = false): CSSProperties {
  const baseStyle = isDesktop ? desktopCoverStyle : coverStyle;

  if (!capa) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    backgroundColor: "#18181B",
    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.82) 100%), url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function ordenarRanking(lista: ObraRanking[], tipo: TipoRanking) {
  const novaLista = [...lista];

  if (tipo === "geral") {
    return novaLista.sort((obraA, obraB) => obraB.pontuacao - obraA.pontuacao);
  }

  if (tipo === "lidas") {
    return novaLista.sort((obraA, obraB) => obraB.views - obraA.views);
  }

  if (tipo === "curtidas") {
    return novaLista.sort((obraA, obraB) => obraB.curtidas - obraA.curtidas);
  }

  if (tipo === "comentadas") {
    return novaLista.sort(
      (obraA, obraB) => obraB.comentarios - obraA.comentarios
    );
  }

  if (tipo === "salvas") {
    return novaLista.sort((obraA, obraB) => obraB.salvos - obraA.salvos);
  }

  if (tipo === "recentes") {
    return novaLista.sort(
      (obraA, obraB) => obraB.criadaEmTimestamp - obraA.criadaEmTimestamp
    );
  }

  if (tipo === "capitulos") {
    return novaLista.sort((obraA, obraB) => obraB.capitulos - obraA.capitulos);
  }

  return novaLista;
}

function pegarTopRanking(lista: ObraRanking[], tipo: TipoRanking) {
  return ordenarRanking(lista, tipo).slice(0, 5);
}

function obraRankingCombinaBusca(obra: ObraRanking, termoBusca: string) {
  if (!termoBusca) {
    return true;
  }

  const textoBusca = normalizarTexto(
    [
      obra.titulo,
      obra.autor,
      obra.genero,
      obra.formato,
      obra.classificacaoIndicativa,
      obra.status,
      obra.capaNome,
      obra.ultimoCapituloLidoTitulo,
    ].join(" ")
  );

  return textoBusca.includes(termoBusca);
}

function obraRankingPassaFiltro(
  obra: ObraRanking,
  filtro: FiltroEmAlta,
  obrasFavoritas: string[],
  obrasConcluidas: string[]
) {
  if (filtro === "catalogo") {
    return obra.tipo === "fixa";
  }

  if (filtro === "publicadas") {
    return obra.tipo === "local";
  }

  if (filtro === "em-leitura") {
    return obra.tipo === "local" && obra.progressoLeitura > 0;
  }

  if (filtro === "favoritas") {
    return Boolean(obra.storageId) && obrasFavoritas.includes(obra.storageId);
  }

  if (filtro === "concluidas") {
    return Boolean(obra.storageId) && obrasConcluidas.includes(obra.storageId);
  }

  return true;
}

function criarDecoracaoEmAltaStyle(index: number): CSSProperties {
  const posicoes: CSSProperties[] = [
    { top: "8%", right: "8%", fontSize: "48px", transform: "rotate(-12deg)" },
    { top: "45%", right: "14%", fontSize: "28px", transform: "rotate(16deg)" },
    { bottom: "12%", right: "7%", fontSize: "36px", transform: "rotate(8deg)" },
    { top: "18%", left: "8%", fontSize: "22px", transform: "rotate(14deg)" },
    { bottom: "18%", left: "18%", fontSize: "26px", transform: "rotate(-10deg)" },
  ];

  return {
    position: "absolute",
    color: "var(--historietas-accent, #FDBA74)",
    opacity: 0.105,
    lineHeight: 1,
    fontWeight: 950,
    filter: "drop-shadow(0 0 22px color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent))",
    userSelect: "none",
    ...posicoes[index % posicoes.length],
  };
}

function criarDecoracaoPaginaStyle(index: number): CSSProperties {
  const posicoes: CSSProperties[] = [
    { top: "32%", right: "-18px", fontSize: "72px", transform: "rotate(-14deg)" },
    { top: "64%", left: "-16px", fontSize: "58px", transform: "rotate(12deg)" },
    { bottom: "8%", right: "10%", fontSize: "52px", transform: "rotate(8deg)" },
  ];

  return {
    position: "absolute",
    color: "var(--historietas-accent, #FDBA74)",
    opacity: 0.045,
    lineHeight: 1,
    fontWeight: 950,
    filter: "blur(0.2px) drop-shadow(0 0 24px color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent))",
    userSelect: "none",
    ...posicoes[index % posicoes.length],
  };
}

export default function EmAltaPage() {
  const [obrasLocais, setObrasLocais] = useState<ObraLocal[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [buscaRanking, setBuscaRanking] = useState("");
  const [filtroRanking, setFiltroRanking] = useState<FiltroEmAlta>("todos");
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const atualizarModoDesktop = () => {
      setIsDesktop(mediaQuery.matches);
    };

    atualizarModoDesktop();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", atualizarModoDesktop);

      return () => {
        mediaQuery.removeEventListener("change", atualizarModoDesktop);
      };
    }

    mediaQuery.addListener(atualizarModoDesktop);

    return () => {
      mediaQuery.removeListener(atualizarModoDesktop);
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregarRanking() {
      try {
        const obrasSalvasTexto = localStorage.getItem(STORAGE_KEY);
        const obrasSalvasJson = obrasSalvasTexto
          ? JSON.parse(obrasSalvasTexto)
          : [];

        const obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
          ? obrasSalvasJson.map((obra, index) => normalizarObra(obra, index))
          : [];

        localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasNormalizadas));

        const obrasFavoritasTexto = localStorage.getItem(FAVORITES_STORAGE_KEY);
        const obrasFavoritasJson = obrasFavoritasTexto
          ? JSON.parse(obrasFavoritasTexto)
          : [];

        const obrasFavoritasNormalizadas: string[] = Array.isArray(
          obrasFavoritasJson
        )
          ? obrasFavoritasJson.filter(
              (id): id is string => typeof id === "string"
            )
          : [];

        const obrasConcluidasTexto = localStorage.getItem(COMPLETED_STORAGE_KEY);
        const obrasConcluidasJson = obrasConcluidasTexto
          ? JSON.parse(obrasConcluidasTexto)
          : [];

        const obrasConcluidasNormalizadas: string[] = Array.isArray(
          obrasConcluidasJson
        )
          ? obrasConcluidasJson.filter(
              (id): id is string => typeof id === "string"
            )
          : [];

        if (!cancelado) {
          setObrasLocais(obrasNormalizadas);
          setObrasFavoritas(obrasFavoritasNormalizadas);
          setObrasConcluidas(obrasConcluidasNormalizadas);
        }

        const obrasComSupabase = await carregarObrasSupabasePublicadas(
          obrasNormalizadas
        );

        if (!cancelado) {
          setObrasLocais(obrasComSupabase);
        }
      } catch {
        if (!cancelado) {
          setObrasLocais([]);
          setObrasFavoritas([]);
          setObrasConcluidas([]);
        }
      }
    }

    carregarRanking();

    return () => {
      cancelado = true;
    };
  }, []);

  const ranking = useMemo<ObraRanking[]>(() => {
    const obrasFixasRanking: ObraRanking[] = obras.map((obra) => {
      const views = converterMetrica(obra.views);
      const curtidas = converterMetrica(obra.likes);
      const comentarios = converterMetrica(obra.comentarios);

      return {
        id: `fixa-${obra.titulo}`,
        storageId: "",
        tipo: "fixa",
        titulo: obra.titulo,
        autor: obra.autor,
        genero: obra.genero,
        formato: "Catálogo",
        classificacaoIndicativa:
          typeof obra.classificacaoIndicativa === "string" &&
          obra.classificacaoIndicativa.trim()
            ? obra.classificacaoIndicativa
            : "Não informada",
        status: obra.status,
        href: obra.disponivel ? obra.link : criarLinkEmBreve(obra.titulo),
        disponivel: obra.disponivel,
        capa: "",
        capaNome: "",
        capitulos: 0,
        capitulosLidos: 0,
        progressoLeitura: 0,
        ultimoCapituloLidoTitulo: "",
        ultimoCapituloLidoHref: "",
        ultimaLeituraEm: "",
        curtidas,
        comentarios,
        salvos: 0,
        views,
        pontuacao: views + curtidas * 3 + comentarios * 5,
        criadaEmTimestamp: 0,
      };
    });

    const obrasLocaisRanking: ObraRanking[] = obrasLocais
      .filter((obra) => obra.publicado)
      .map((obra) => {
        const totalCurtidasLocais = obra.capitulos.filter(
          (capitulo) => capitulo.curtiu
        ).length;

        const totalComentariosLocais = obra.capitulos.filter((capitulo) =>
          capitulo.comentario.trim()
        ).length;

        const totalSalvosLocais = obra.capitulos.filter(
          (capitulo) => capitulo.salvo
        ).length;

        const totalCurtidas = Math.max(
          totalCurtidasLocais,
          obra.totalCurtidasRanking || 0
        );
        const totalComentarios = Math.max(
          totalComentariosLocais,
          obra.totalComentariosRanking || 0
        );
        const totalSalvos = Math.max(
          totalSalvosLocais,
          obra.totalSalvosRanking || 0
        );

        const capitulosLidos = Math.max(
          calcularCapitulosLidos(obra.capitulos),
          obra.totalViewsRanking || 0
        );
        const progressoLeitura = calcularProgressoLeitura(obra.capitulos);
        const capituloParaContinuar = encontrarCapituloParaContinuar(obra);
        const ultimoCapituloLidoTitulo = capituloParaContinuar
          ? capituloParaContinuar.titulo
          : "";
        const ultimoCapituloLidoHref = capituloParaContinuar
          ? `/ler-capitulo?obraId=${obra.id}&capituloId=${capituloParaContinuar.id}`
          : "";
        const ultimaLeituraEm =
          obra.ultimaLeituraEm || capituloParaContinuar?.lidoEm || "";

        const criadaEmTimestamp = new Date(obra.criadaEm).getTime();
        const dataValida = Number.isNaN(criadaEmTimestamp)
          ? 0
          : criadaEmTimestamp;

        const pontuacao =
          obra.capitulos.length * 2 +
          totalCurtidas * 5 +
          totalComentarios * 8 +
          totalSalvos * 4 +
          capitulosLidos * 3;

        return {
          id: `local-${obra.id}`,
          storageId: obra.id,
          tipo: "local",
          titulo: obra.titulo,
          autor: obra.autor,
          genero: obra.genero,
          formato: obra.formato,
          classificacaoIndicativa: obra.classificacaoIndicativa,
          status: "Publicado",
          href: obra.link || `/obra/${obra.slug}`,
          disponivel: true,
          capa: obra.capa,
          capaNome: obra.capaNome,
          capitulos: obra.capitulos.length,
          capitulosLidos,
          progressoLeitura,
          ultimoCapituloLidoTitulo,
          ultimoCapituloLidoHref,
          ultimaLeituraEm,
          curtidas: totalCurtidas,
          comentarios: totalComentarios,
          salvos: totalSalvos,
          views: capitulosLidos,
          pontuacao,
          criadaEmTimestamp: dataValida,
        };
      });

    return [...obrasFixasRanking, ...obrasLocaisRanking];
  }, [obrasLocais]);

  const termoBuscaRanking = normalizarTexto(buscaRanking);

  const rankingFiltrado = useMemo(() => {
    return ranking.filter((obra) => {
      return (
        obraRankingCombinaBusca(obra, termoBuscaRanking) &&
        obraRankingPassaFiltro(
          obra,
          filtroRanking,
          obrasFavoritas,
          obrasConcluidas
        )
      );
    });
  }, [ranking, termoBuscaRanking, filtroRanking, obrasFavoritas, obrasConcluidas]);

  const filtrosAtivos = Boolean(buscaRanking.trim() || filtroRanking !== "todos");

  const rankingGeral = useMemo(() => pegarTopRanking(rankingFiltrado, "geral"), [
    rankingFiltrado,
  ]);

  const rankingMaisLidas = useMemo(() => pegarTopRanking(rankingFiltrado, "lidas"), [
    rankingFiltrado,
  ]);

  const rankingMaisCurtidas = useMemo(
    () => pegarTopRanking(rankingFiltrado, "curtidas"),
    [rankingFiltrado]
  );

  const rankingMaisComentadas = useMemo(
    () => pegarTopRanking(rankingFiltrado, "comentadas"),
    [rankingFiltrado]
  );

  const rankingMaisSalvas = useMemo(() => pegarTopRanking(rankingFiltrado, "salvas"), [
    rankingFiltrado,
  ]);

  const rankingMaisRecentes = useMemo(
    () => pegarTopRanking(rankingFiltrado, "recentes"),
    [rankingFiltrado]
  );

  const rankingMaisCapitulos = useMemo(
    () => pegarTopRanking(rankingFiltrado, "capitulos"),
    [rankingFiltrado]
  );

  const totalPublicadasLocais = obrasLocais.filter(
    (obra) => obra.publicado
  ).length;

  const totalCapitulosLidos = ranking.reduce(
    (total, obra) => total + obra.capitulosLidos,
    0
  );

  const totalObrasEmLeitura = ranking.filter(
    (obra) => obra.progressoLeitura > 0
  ).length;

  const totalResultadosFiltrados = rankingFiltrado.length;
  const totalCatalogoFiltrado = rankingFiltrado.filter(
    (obra) => obra.tipo === "fixa"
  ).length;
  const totalPublicadasFiltradas = rankingFiltrado.filter(
    (obra) => obra.tipo === "local"
  ).length;

  const resumoCompacto = `${ranking.length} obras no ranking • ${totalPublicadasLocais} publicadas • ${totalObrasEmLeitura} em leitura • ${totalCapitulosLidos} capítulos lidos`;

  const resumoFiltroCompacto = `${totalResultadosFiltrados} resultados • ${totalCatalogoFiltrado} catálogo • ${totalPublicadasFiltradas} publicadas locais`;

  function limparFiltrosRanking() {
    setBuscaRanking("");
    setFiltroRanking("todos");
  }

  function alternarFavorito(obraId: string) {
    const novasObrasFavoritas = obrasFavoritas.includes(obraId)
      ? obrasFavoritas.filter((id) => id !== obraId)
      : [...obrasFavoritas, obraId];

    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(novasObrasFavoritas)
    );

    setObrasFavoritas(novasObrasFavoritas);
  }

  function alternarConcluido(obraId: string) {
    const novasObrasConcluidas = obrasConcluidas.includes(obraId)
      ? obrasConcluidas.filter((id) => id !== obraId)
      : [...obrasConcluidas, obraId];

    localStorage.setItem(
      COMPLETED_STORAGE_KEY,
      JSON.stringify(novasObrasConcluidas)
    );

    setObrasConcluidas(novasObrasConcluidas);
  }

  return (
    <main style={pageStyle}>
      <div style={pageDecorationLayerStyle} aria-hidden="true">
        {["#", "★", "↑"].map((decoracao, index) => (
          <span key={`${decoracao}-${index}`} style={criarDecoracaoPaginaStyle(index)}>
            {decoracao}
          </span>
        ))}
      </div>

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTopStyle : topStyle}>
          <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
            <span style={logoMarkStyle}>H</span>
            <span style={logoTextStyle}>istorietas</span>
          </Link>

        </header>

        <section style={isDesktop ? desktopHeroStyle : heroStyle}>
          <div style={heroDecorationLayerStyle} aria-hidden="true">
            {["👑", "✦", "◆", "↑"].map((decoracao, index) => (
              <span
                key={`hero-${decoracao}-${index}`}
                style={criarDecoracaoEmAltaStyle(index)}
              >
                {decoracao}
              </span>
            ))}
          </div>

          <div style={heroPremiumShineStyle} aria-hidden="true" />

          <h1 style={isDesktop ? desktopTitleStyle : titleStyle}>Histórias mais populares</h1>

          <p style={isDesktop ? desktopDescriptionStyle : descriptionStyle}>
            Rankings das obras que estão dominando leituras, curtidas,
            comentários e favoritos na Historietas.
          </p>
        </section>

        <p style={isDesktop ? desktopCompactSummaryStyle : compactSummaryStyle}>{resumoCompacto}</p>

        <section style={isDesktop ? desktopFilterBoxStyle : filterBoxStyle}>
          <div style={isDesktop ? desktopFilterHeaderStyle : filterHeaderStyle}>
            <div style={{ minWidth: 0 }}>
              <span style={filterMiniTitleStyle}>FILTRAR RANKING</span>

              <p style={filterSummaryTextStyle}>{resumoFiltroCompacto}</p>
            </div>

            {filtrosAtivos && (
              <button
                type="button"
                onClick={limparFiltrosRanking}
                style={clearFilterButtonStyle}
              >
                Limpar
              </button>
            )}
          </div>

          <input
            value={buscaRanking}
            onChange={(event) => setBuscaRanking(event.target.value)}
            placeholder="Buscar por título, autor, gênero, formato ou classificação..."
            style={isDesktop ? desktopSearchInputStyle : searchInputStyle}
            type="text"
          />

          <div style={isDesktop ? desktopQuickFiltersGridStyle : quickFiltersGridStyle}>
            {[
              { id: "todos", titulo: "Todos" },
              { id: "catalogo", titulo: "Catálogo" },
              { id: "publicadas", titulo: "Publicadas" },
              { id: "em-leitura", titulo: "Em leitura" },
              { id: "favoritas", titulo: "Favoritas" },
              { id: "concluidas", titulo: "Concluídas" },
            ].map((filtro) => (
              <button
                key={filtro.id}
                type="button"
                onClick={() => setFiltroRanking(filtro.id as FiltroEmAlta)}
                style={
                  filtroRanking === filtro.id
                    ? quickFilterActiveStyle
                    : quickFilterButtonStyle
                }
              >
                {filtro.titulo}
              </button>
            ))}
          </div>

        </section>

        <RankingSection
          titulo="Coroa Suprema"
          descricao="O ranking principal das obras com maior força na plataforma."
          obras={rankingGeral}
          tipo="geral"
          obrasFavoritas={obrasFavoritas}
          obrasConcluidas={obrasConcluidas}
          onAlternarFavorito={alternarFavorito}
          onAlternarConcluido={alternarConcluido}
          isDesktop={isDesktop}
        />

        <RankingSection
          titulo="Olhares Dominantes"
          descricao="As histórias que mais chamaram atenção dos leitores."
          obras={rankingMaisLidas}
          tipo="lidas"
          obrasFavoritas={obrasFavoritas}
          obrasConcluidas={obrasConcluidas}
          onAlternarFavorito={alternarFavorito}
          onAlternarConcluido={alternarConcluido}
          isDesktop={isDesktop}
        />

        <RankingSection
          titulo="Favoritas do Público"
          descricao="As obras que mais receberam curtidas e reações positivas."
          obras={rankingMaisCurtidas}
          tipo="curtidas"
          obrasFavoritas={obrasFavoritas}
          obrasConcluidas={obrasConcluidas}
          onAlternarFavorito={alternarFavorito}
          onAlternarConcluido={alternarConcluido}
          isDesktop={isDesktop}
        />

        <RankingSection
          titulo="Vozes da Comunidade"
          descricao="As histórias que mais puxaram conversa entre os leitores."
          obras={rankingMaisComentadas}
          tipo="comentadas"
          obrasFavoritas={obrasFavoritas}
          obrasConcluidas={obrasConcluidas}
          onAlternarFavorito={alternarFavorito}
          onAlternarConcluido={alternarConcluido}
          isDesktop={isDesktop}
        />

        <RankingSection
          titulo="Tesouros Guardados"
          descricao="Obras guardadas pelos leitores para acompanhar depois."
          obras={rankingMaisSalvas}
          tipo="salvas"
          obrasFavoritas={obrasFavoritas}
          obrasConcluidas={obrasConcluidas}
          onAlternarFavorito={alternarFavorito}
          onAlternarConcluido={alternarConcluido}
          isDesktop={isDesktop}
        />

        <RankingSection
          titulo="Novas Promessas"
          descricao="Publicações recentes começando a aparecer no radar."
          obras={rankingMaisRecentes}
          tipo="recentes"
          obrasFavoritas={obrasFavoritas}
          obrasConcluidas={obrasConcluidas}
          onAlternarFavorito={alternarFavorito}
          onAlternarConcluido={alternarConcluido}
          isDesktop={isDesktop}
        />

        <RankingSection
          titulo="Grandes Jornadas"
          descricao="Histórias com mais capítulos e conteúdo publicado."
          obras={rankingMaisCapitulos}
          tipo="capitulos"
          obrasFavoritas={obrasFavoritas}
          obrasConcluidas={obrasConcluidas}
          onAlternarFavorito={alternarFavorito}
          onAlternarConcluido={alternarConcluido}
          isDesktop={isDesktop}
        />

        {ranking.length > 0 && rankingFiltrado.length === 0 && (
          <section style={emptyBoxStyle}>
            <h2 style={emptyTitleStyle}>Nenhuma obra encontrada</h2>

            <p style={emptyTextStyle}>
              Mude a busca ou limpe os filtros para ver mais rankings.
            </p>

            <button
              type="button"
              onClick={limparFiltrosRanking}
              style={emptyButtonStyle}
            >
              Limpar filtros
            </button>
          </section>
        )}

        {ranking.length === 0 && (
          <section style={emptyBoxStyle}>
            <h2 style={emptyTitleStyle}>Nenhuma obra para ranquear</h2>

            <p style={emptyTextStyle}>
              Crie e publique uma obra para ela aparecer no Em Alta.
            </p>

            <Link href="/publicar" style={emptyButtonStyle}>
              Criar obra
            </Link>
          </section>
        )}

        <section style={infoBoxStyle}>
          <h2 style={infoTitleStyle}>Como o ranking funciona</h2>

          <p style={infoTextStyle}>
            O Em Alta combina obras do catálogo com publicações locais, usando
            leituras, curtidas, comentários, capítulos salvos e progresso de leitura.
          </p>
        </section>
      </section>
    </main>
  );
}

function obterTemaRanking(tipo: TipoRanking) {
  if (tipo === "geral") {
    return {
      icone: "👑",
      label: "Ranking Mestre",
      titleColor: "#FFFFFF",
      accent: "var(--historietas-accent, #FDBA74)",
      border: "color-mix(in srgb, var(--historietas-accent, #F97316) 42%, transparent)",
      borderStrong: "color-mix(in srgb, var(--historietas-accent, #F97316) 58%, transparent)",
      glow: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
      background:
        "linear-gradient(135deg, rgba(41,27,53,0.82) 0%, rgba(18,12,30,0.92) 100%)",
    };
  }

  if (tipo === "lidas") {
    return {
      icone: "👁",
      label: "Alcance",
      titleColor: "#FFFFFF",
      accent: "#38BDF8",
      border: "rgba(56,189,248,0.42)",
      borderStrong: "rgba(56,189,248,0.58)",
      glow: "rgba(56,189,248,0.12)",
      background:
        "linear-gradient(135deg, rgba(18,36,54,0.82) 0%, rgba(11,17,32,0.92) 100%)",
    };
  }

  if (tipo === "curtidas") {
    return {
      icone: "❤",
      label: "Reação",
      titleColor: "#FFFFFF",
      accent: "#FB7185",
      border: "rgba(251,113,133,0.42)",
      borderStrong: "rgba(251,113,133,0.58)",
      glow: "rgba(251,113,133,0.12)",
      background:
        "linear-gradient(135deg, rgba(54,20,38,0.82) 0%, rgba(29,13,27,0.92) 100%)",
    };
  }

  if (tipo === "comentadas") {
    return {
      icone: "💬",
      label: "Discussão",
      titleColor: "#FFFFFF",
      accent: "#C084FC",
      border: "rgba(192,132,252,0.42)",
      borderStrong: "rgba(192,132,252,0.58)",
      glow: "rgba(192,132,252,0.12)",
      background:
        "linear-gradient(135deg, rgba(40,25,62,0.82) 0%, rgba(20,12,34,0.92) 100%)",
    };
  }

  if (tipo === "salvas") {
    return {
      icone: "🔖",
      label: "Coleção",
      titleColor: "#FFFFFF",
      accent: "#34D399",
      border: "rgba(52,211,153,0.42)",
      borderStrong: "rgba(52,211,153,0.58)",
      glow: "rgba(52,211,153,0.11)",
      background:
        "linear-gradient(135deg, rgba(17,48,39,0.82) 0%, rgba(10,29,25,0.92) 100%)",
    };
  }

  if (tipo === "recentes") {
    return {
      icone: "✨",
      label: "Novidade",
      titleColor: "#FFFFFF",
      accent: "#F472B6",
      border: "rgba(244,114,182,0.42)",
      borderStrong: "rgba(244,114,182,0.58)",
      glow: "rgba(244,114,182,0.11)",
      background:
        "linear-gradient(135deg, rgba(54,22,45,0.82) 0%, rgba(30,13,31,0.92) 100%)",
    };
  }

  return {
    icone: "📚",
    label: "Conteúdo",
    titleColor: "#FFFFFF",
    accent: "#A78BFA",
    border: "rgba(167,139,250,0.42)",
    borderStrong: "rgba(167,139,250,0.58)",
    glow: "rgba(167,139,250,0.12)",
    background:
      "linear-gradient(135deg, rgba(37,27,60,0.82) 0%, rgba(18,12,34,0.92) 100%)",
  };
}
function criarSectionHeaderTemaStyle(
  tema: ReturnType<typeof obterTemaRanking>
): CSSProperties {
  return {
    ...sectionHeaderStyle,
    background: tema.background,
    border: `1px solid ${tema.border}`,
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
  };
}

function criarDesktopSectionHeaderTemaStyle(
  tema: ReturnType<typeof obterTemaRanking>
): CSSProperties {
  return {
    ...desktopSectionHeaderStyle,
    background: tema.background,
    border: `1px solid ${tema.border}`,
    boxShadow: "0 14px 32px rgba(0,0,0,0.20)",
  };
}

function criarSectionIconStyle(
  tema: ReturnType<typeof obterTemaRanking>
): CSSProperties {
  return {
    width: "40px",
    height: "40px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.065)",
    border: `1px solid ${tema.border}`,
    color: tema.accent,
    fontSize: "23px",
    lineHeight: 1,
    flex: "0 0 auto",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
  };
}

function RankingSection({
  titulo,
  descricao,
  obras,
  tipo,
  obrasFavoritas,
  obrasConcluidas,
  onAlternarFavorito: _onAlternarFavorito,
  onAlternarConcluido: _onAlternarConcluido,
  isDesktop,
}: {
  titulo: string;
  descricao: string;
  obras: ObraRanking[];
  tipo: TipoRanking;
  obrasFavoritas: string[];
  obrasConcluidas: string[];
  onAlternarFavorito: (obraId: string) => void;
  onAlternarConcluido: (obraId: string) => void;
  isDesktop: boolean;
}) {
  void _onAlternarFavorito;
  void _onAlternarConcluido;

  const tema = obterTemaRanking(tipo);
  const carrosselRef = useRef<HTMLDivElement | null>(null);
  const obrasEmOrdemDeSuspense = obras
    .map((obra, index) => ({ obra, posicao: index + 1 }))
    .reverse();

  function rolarCarrossel(direcao: "esquerda" | "direita") {
    const carrossel = carrosselRef.current;

    if (!carrossel) {
      return;
    }

    const distancia = Math.max(320, Math.floor(carrossel.clientWidth * 0.82));

    carrossel.scrollBy({
      left: direcao === "direita" ? distancia : -distancia,
      behavior: "smooth",
    });
  }

  return (
    <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
      <div style={isDesktop ? criarDesktopSectionHeaderTemaStyle(tema) : criarSectionHeaderTemaStyle(tema)}>
        <div style={sectionHeaderContentStyle}>
          <span style={criarSectionIconStyle(tema)}>{tema.icone}</span>

          <div style={{ minWidth: 0 }}>
            <h2 style={{ ...sectionTitleStyle, color: tema.titleColor }}>
              {titulo}
            </h2>

            <span style={{ ...smallTextStyle, color: tema.accent }}>
              {tema.label} - {descricao}
            </span>
          </div>
        </div>
      </div>

      {obras.length > 0 ? (
        <div style={isDesktop ? desktopCarouselShellStyle : carouselShellStyle}>
          {isDesktop && (
            <button
              type="button"
              aria-label={`Voltar carrossel ${titulo}`}
              onClick={(event) => {
                event.stopPropagation();
                rolarCarrossel("esquerda");
              }}
              style={carouselArrowLeftStyle}
            >
              <span style={carouselArrowIconStyle}>‹</span>
            </button>
          )}

          <div
            ref={carrosselRef}
            style={isDesktop ? desktopCarouselStyle : carouselStyle}
            aria-label={`${titulo} em carrossel`}
          >
            {obrasEmOrdemDeSuspense.map(({ obra, posicao }) => (
              <RankingCard
                key={`${tipo}-${obra.id}`}
                obra={obra}
                posicao={posicao}
                tipo={tipo}
                favorita={
                  obra.storageId ? obrasFavoritas.includes(obra.storageId) : false
                }
                concluida={
                  obra.storageId
                    ? obrasConcluidas.includes(obra.storageId)
                    : false
                }
                isDesktop={isDesktop}
              />
            ))}
          </div>

          {isDesktop && (
            <button
              type="button"
              aria-label={`Avançar carrossel ${titulo}`}
              onClick={(event) => {
                event.stopPropagation();
                rolarCarrossel("direita");
              }}
              style={carouselArrowRightStyle}
            >
              <span style={carouselArrowIconStyle}>›</span>
            </button>
          )}
        </div>
      ) : (
        <div style={emptyMiniBoxStyle}>Nada para mostrar neste ranking.</div>
      )}
    </section>
  );
}
function RankingCard({
  obra,
  posicao,
  tipo,
  favorita,
  concluida,
  isDesktop,
}: {
  obra: ObraRanking;
  posicao: number;
  tipo: TipoRanking;
  favorita: boolean;
  concluida: boolean;
  isDesktop: boolean;
}) {
  const router = useRouter();
  const mostrarClassificacao =
    obra.classificacaoIndicativa &&
    obra.classificacaoIndicativa !== "Não informada";

  const destaque =
    tipo === "geral"
      ? `${formatarNumero(obra.pontuacao)} pts`
      : tipo === "lidas"
      ? `${formatarNumero(obra.views)} leituras`
      : tipo === "curtidas"
      ? `${formatarNumero(obra.curtidas)} curtidas`
      : tipo === "comentadas"
      ? `${formatarNumero(obra.comentarios)} comentários`
      : tipo === "salvas"
      ? `${formatarNumero(obra.salvos)} salvos`
      : tipo === "recentes"
      ? formatarDataRanking(obra.criadaEmTimestamp)
      : `${formatarNumero(obra.capitulos)} capítulos`;

  function abrirObra() {
    router.push(obra.href);
  }

  return (
    <article
      style={criarCardRankingStyle(posicao, obra.disponivel, tipo, isDesktop)}
      role="link"
      tabIndex={0}
      aria-label={`Abrir página da obra ${obra.titulo}`}
      onClick={abrirObra}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          abrirObra();
        }
      }}
    >
      <div style={criarCoroaRankingStyle(posicao)} aria-label={`Posição ${posicao}`}>
        <span style={rankCrownMiniStyle}>♛</span>
        <span style={coroaNumberStyle}>{posicao}</span>
      </div>

      <div style={criarRankingCoverStyle(obra.capa, isDesktop)}>
        <span style={genreBadgeStyle}>{obra.genero}</span>

        {obra.tipo === "local" && !obra.capa && (
          <span style={noCoverBadgeStyle}>Sem capa</span>
        )}
      </div>

      <div style={isDesktop ? desktopCardContentStyle : cardContentStyle}>
        <div style={cardTopStyle}>
          <h3 style={cardTitleStyle}>{obra.titulo}</h3>

          <div style={statusRowStyle}>
            <span
              style={obra.tipo === "local" ? publishedStatusStyle : statusStyle}
            >
              {obra.status}
            </span>

            <span style={formatBadgeStyle}>{obra.formato}</span>

            {mostrarClassificacao && (
              <span style={classificationBadgeStyle}>
                {obra.classificacaoIndicativa}
              </span>
            )}

            <span style={highlightBadgeStyle}>{destaque}</span>

            {favorita && <span style={favoriteBadgeStyle}>★ Favorita</span>}

            {concluida && <span style={completedBadgeStyle}>✓ Concluída</span>}

            {!obra.disponivel && <span style={soonBadgeStyle}>Em breve</span>}
          </div>
        </div>

        <p style={authorStyle}>por {obra.autor}</p>

        <div style={statsStyle}>
          <span style={safeTextStyle}>👁 {formatarNumero(obra.views)}</span>

          {obra.capitulos > 0 && (
            <span style={safeTextStyle}>📚 {formatarNumero(obra.capitulos)}</span>
          )}

          <span style={safeTextStyle}>♥ {formatarNumero(obra.curtidas)}</span>

          <span style={safeTextStyle}>💬 {formatarNumero(obra.comentarios)}</span>
        </div>

        {obra.tipo === "local" && obra.capitulos > 0 && (
          <div style={progressCompactStyle}>
            <div style={progressTrackStyle}>
              <div
                style={{
                  ...progressBarStyle,
                  width: `${obra.progressoLeitura}%`,
                }}
              />
            </div>

            <span style={progressTextStyle}>{obra.progressoLeitura}% lido</span>
          </div>
        )}

        <span style={obra.disponivel ? readStyle : soonReadStyle}>
          {obra.disponivel ? "Abrir obra →" : "Ver detalhes →"}
        </span>
      </div>
    </article>
  );
}

function obterTemaPosicao(posicao: number) {
  if (posicao === 1) {
    return {
      nome: "Diamante",
      accent: "#7DD3FC",
      border: "rgba(125,211,252,0.56)",
      cardBackground:
        "radial-gradient(circle at 0% 0%, rgba(125,211,252,0.18), transparent 34%), linear-gradient(135deg, rgba(32,52,68,0.99) 0%, rgba(18,22,45,0.99) 52%, rgba(13,12,25,0.99) 100%)",
      rankBackground:
        "linear-gradient(135deg, #ECFEFF 0%, #7DD3FC 48%, #A78BFA 100%)",
      rankText: "#07111F",
    };
  }

  if (posicao === 2) {
    return {
      nome: "Rubi",
      accent: "#FB7185",
      border: "rgba(251,113,133,0.56)",
      cardBackground:
        "radial-gradient(circle at 0% 0%, rgba(251,113,133,0.17), transparent 34%), linear-gradient(135deg, rgba(62,27,42,0.99) 0%, rgba(39,17,34,0.99) 52%, rgba(15,10,24,0.99) 100%)",
      rankBackground:
        "linear-gradient(135deg, #FFE4E6 0%, #FB7185 48%, #BE123C 100%)",
      rankText: "#FFFFFF",
    };
  }

  if (posicao === 3) {
    return {
      nome: "Ouro",
      accent: "#FBBF24",
      border: "color-mix(in srgb, var(--historietas-accent, #F97316) 56%, transparent)",
      cardBackground:
        "radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 17%, transparent), transparent 34%), linear-gradient(135deg, rgba(62,45,17,0.99) 0%, rgba(38,25,15,0.99) 52%, rgba(15,11,22,0.99) 100%)",
      rankBackground:
        "linear-gradient(135deg, #FEF3C7 0%, #FBBF24 48%, var(--historietas-accent, #F97316) 100%)",
      rankText: "#2B1407",
    };
  }

  if (posicao === 4) {
    return {
      nome: "Prata",
      accent: "#CBD5E1",
      border: "rgba(203,213,225,0.46)",
      cardBackground:
        "radial-gradient(circle at 0% 0%, rgba(203,213,225,0.12), transparent 34%), linear-gradient(135deg, rgba(45,52,64,0.99) 0%, rgba(29,33,45,0.99) 52%, rgba(15,12,25,0.99) 100%)",
      rankBackground:
        "linear-gradient(135deg, #F8FAFC 0%, #CBD5E1 52%, #64748B 100%)",
      rankText: "#111827",
    };
  }

  return {
    nome: "Bronze",
    accent: "#FB923C",
    border: "rgba(251,146,60,0.48)",
    cardBackground:
      "radial-gradient(circle at 0% 0%, rgba(251,146,60,0.14), transparent 34%), linear-gradient(135deg, rgba(62,36,21,0.99) 0%, rgba(36,22,17,0.99) 52%, rgba(15,11,22,0.99) 100%)",
    rankBackground:
      "linear-gradient(135deg, #FED7AA 0%, #FB923C 48%, #9A3412 100%)",
    rankText: "#FFFFFF",
  };
}
function criarCardRankingStyle(
  posicao: number,
  disponivel: boolean,
  tipo: TipoRanking,
  isDesktop = false
): CSSProperties {
  const temaRanking = obterTemaRanking(tipo);
  const temaPosicao = obterTemaPosicao(posicao);

  return {
    ...(disponivel ? (isDesktop ? desktopCardStyle : cardStyle) : (isDesktop ? desktopCardSoonStyle : cardSoonStyle)),
    background: temaPosicao.cardBackground,
    border: `1px solid ${temaRanking.border}`,
    boxShadow: "0 18px 42px rgba(0,0,0,0.34)",
    outline: `1px solid ${temaPosicao.border}`,
    outlineOffset: "-2px",
  };
}

function criarCoroaRankingStyle(posicao: number): CSSProperties {
  const temaPosicao = obterTemaPosicao(posicao);

  return {
    position: "absolute",
    top: "10px",
    right: "10px",
    minWidth: "46px",
    height: "34px",
    padding: "0 10px",
    borderRadius: "999px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    background: temaPosicao.rankBackground,
    color: temaPosicao.rankText,
    border: `1px solid ${temaPosicao.border}`,
    boxShadow: "0 10px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.28)",
    zIndex: 4,
    pointerEvents: "none",
  };
}


const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const pageDecorationLayerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 0,
};

const heroDecorationLayerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 0,
};

const heroPremiumShineStyle: CSSProperties = {
  position: "absolute",
  left: "12%",
  right: "12%",
  top: "14px",
  height: "1px",
  background:
    "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 42%, transparent) 45%, color-mix(in srgb, var(--historietas-secondary, #C4B5FD) 28%, transparent) 70%, transparent 100%)",
  filter: "blur(0.2px)",
  zIndex: 0,
};


const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background:
    "radial-gradient(circle at 10% -6%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 42%, transparent), transparent 30%), radial-gradient(circle at 92% 10%, color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent), transparent 25%), radial-gradient(circle at 50% 104%, color-mix(in srgb, var(--historietas-accent, #F97316) 13%, transparent), transparent 34%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 28%, var(--historietas-bg-end, #180B2D) 56%, #14091F 78%, var(--historietas-bg-end, #17101B) 100%)",
  color: "#FFFFFF",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(820px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "14px 0 76px",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "18px 0 84px",
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "14px",
  minWidth: 0,
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "14px",
};

const topActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  flex: "0 0 auto",
};

const logoStyle: CSSProperties = {
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "25px",
  fontWeight: 950,
  letterSpacing: "-0.06em",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  ...safeTextStyle,
};

const logoMarkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background: "linear-gradient(135deg, #F5F3FF 0%, var(--historietas-secondary, #C4B5FD) 42%, var(--historietas-accent, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "0 0 26px color-mix(in srgb, var(--historietas-secondary, #8B5CF6) 24%, transparent)",
};

const backButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "38px",
  padding: "0 13px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 900,
  textAlign: "center",
  boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
  ...safeTextStyle,
};

const libraryButtonTopStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "40px",
  padding: "0 14px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.14)",
  border: "1px solid rgba(34, 197, 94, 0.3)",
  color: "#86EFAC",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const heroStyle: CSSProperties = {
  position: "relative",
  borderRadius: "34px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent)",
  background:
    "radial-gradient(circle at 12% -4%, color-mix(in srgb, var(--historietas-accent, #F97316) 26%, transparent), transparent 30%), radial-gradient(circle at 18% 42%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 52%, transparent), transparent 35%), radial-gradient(circle at 94% 36%, color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent), transparent 32%), linear-gradient(135deg, rgba(31,16,52,0.99) 0%, rgba(12,7,23,0.99) 100%)",
  padding: "30px 18px",
  boxShadow: "0 30px 78px rgba(0,0,0,0.40), 0 0 54px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent), inset 0 1px 0 rgba(255,255,255,0.08)",
  minWidth: 0,
  overflow: "hidden",
  textAlign: "center",
};

const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  padding: "38px 46px",
  textAlign: "left",
  borderRadius: "34px",
};

const badgeStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "inline-flex",
  maxWidth: "100%",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 36%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const titleStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: 0,
  fontSize: "clamp(34px, 9vw, 54px)",
  lineHeight: 0.95,
  fontWeight: 950,
  letterSpacing: "-0.082em",
  maxWidth: "100%",
  textAlign: "center",
  background: "linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 38%, var(--historietas-accent, #FDBA74) 72%, var(--historietas-secondary, #C4B5FD) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "0 0 30px color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  ...safeTextStyle,
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  fontSize: "clamp(42px, 5vw, 66px)",
  maxWidth: "760px",
  textAlign: "left",
};

const descriptionStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: "10px auto 0",
  color: "#D4D4D8",
  fontSize: "13px",
  lineHeight: 1.55,
  fontWeight: 700,
  maxWidth: "560px",
  textAlign: "center",
  ...safeTextStyle,
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  margin: "12px 0 0",
  maxWidth: "620px",
  textAlign: "left",
  fontSize: "14px",
};

const compactSummaryStyle: CSSProperties = {
  margin: "12px 0 0",
  color: "#B9B4C7",
  fontSize: "12px",
  fontWeight: 850,
  lineHeight: 1.55,
  ...safeTextStyle,
};

const desktopCompactSummaryStyle: CSSProperties = {
  ...compactSummaryStyle,
  marginTop: "14px",
  padding: "10px 14px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.07)",
};

const filterSummaryTextStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#B9B4C7",
  fontSize: "12px",
  fontWeight: 850,
  lineHeight: 1.45,
  ...safeTextStyle,
};

const rankingBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  marginTop: "18px",
  minWidth: 0,
};

const rankingItemStyle: CSSProperties = {
  borderRadius: "22px",
  background: "linear-gradient(135deg, rgba(38,28,58,0.96) 0%, rgba(18,12,30,0.98) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)",
  padding: "18px 16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  minWidth: 0,
  overflow: "hidden",
};

const rankingNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #F97316)",
  fontSize: "26px",
  lineHeight: 1,
  fontWeight: 950,
  flex: "0 0 auto",
  ...safeTextStyle,
};

const rankingLabelStyle: CSSProperties = {
  color: "#D4D4D8",
  fontSize: "14px",
  fontWeight: 900,
  textAlign: "right",
  minWidth: 0,
  maxWidth: "100%",
  ...safeTextStyle,
};

const sectionStyle: CSSProperties = {
  marginTop: "30px",
  minWidth: 0,
};

const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  marginTop: "34px",
};

const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  marginBottom: "12px",
  padding: "10px 11px",
  borderRadius: "19px",
  minWidth: 0,
  overflow: "hidden",
};

const desktopSectionHeaderStyle: CSSProperties = {
  ...sectionHeaderStyle,
  padding: "13px 16px",
  borderRadius: "22px",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "31px",
  lineHeight: 0.98,
  fontWeight: 950,
  letterSpacing: "-0.065em",
  maxWidth: "100%",
  textShadow: "0 12px 32px rgba(0,0,0,0.34)",
  ...safeTextStyle,
};

const sectionLabelStyle: CSSProperties = {
  display: "block",
  marginBottom: "4px",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  ...safeTextStyle,
};


const smallTextStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  lineHeight: 1.38,
  fontWeight: 850,
  maxWidth: "100%",
  ...safeTextStyle,
};

const listStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "14px",
  minWidth: 0,
};

const carouselShellStyle: CSSProperties = {
  position: "relative",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopCarouselShellStyle: CSSProperties = {
  ...carouselShellStyle,
  marginTop: "0",
};

const carouselArrowButtonStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  zIndex: 8,
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(11,6,20,0.86)",
  color: "#FFFFFF",
  boxShadow: "0 12px 28px rgba(0,0,0,0.34), 0 0 18px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent)",
  backdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "25px",
  lineHeight: 1,
  fontWeight: 950,
  transform: "translateY(-50%)",
};

const carouselArrowIconStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  transform: "translateY(-1px)",
};

const carouselArrowLeftStyle: CSSProperties = {
  ...carouselArrowButtonStyle,
  left: "7px",
};

const carouselArrowRightStyle: CSSProperties = {
  ...carouselArrowButtonStyle,
  right: "7px",
};

const carouselStyle: CSSProperties = {
  display: "grid",
  gridAutoFlow: "column",
  gridAutoColumns: "318px",
  gap: "14px",
  overflowX: "auto",
  overflowY: "hidden",
  padding: "1px 2px 12px",
  scrollSnapType: "x mandatory",
  scrollPaddingLeft: "2px",
  scrollbarWidth: "none",
  overscrollBehaviorX: "contain",
  minWidth: 0,
};

const desktopCarouselStyle: CSSProperties = {
  ...carouselStyle,
  gridAutoColumns: "minmax(380px, 420px)",
  gap: "16px",
  padding: "2px 4px 14px",
  scrollPaddingLeft: "4px",
};

const sectionHeaderContentStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  minWidth: 0,
};


const cardStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gridTemplateColumns: "118px minmax(0, 1fr)",
  gap: "13px",
  padding: "12px",
  paddingRight: "62px",
  borderRadius: "26px",
  background:
    "radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent), transparent 32%), linear-gradient(135deg, rgba(38, 28, 58, 0.98) 0%, rgba(18, 12, 30, 0.99) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent)",
  color: "#FFFFFF",
  textDecoration: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxShadow: "0 22px 54px rgba(0,0,0,0.36), 0 0 38px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 13%, transparent), inset 0 1px 0 rgba(255,255,255,0.045)",
  boxSizing: "border-box",
  cursor: "pointer",
  scrollSnapAlign: "start",
  scrollSnapStop: "always",
};

const desktopCardStyle: CSSProperties = {
  ...cardStyle,
  gridTemplateColumns: "132px minmax(0, 1fr)",
  gap: "15px",
  padding: "13px",
  paddingRight: "58px",
  borderRadius: "26px",
  minHeight: "184px",
};

const cardSoonStyle: CSSProperties = {
  ...cardStyle,
  opacity: 0.9,
};

const desktopCardSoonStyle: CSSProperties = {
  ...desktopCardStyle,
  opacity: 0.9,
};

const rankCrownMiniStyle: CSSProperties = {
  fontSize: "13px",
  lineHeight: 1,
  fontWeight: 950,
};

const coroaNumberStyle: CSSProperties = {
  fontSize: "15px",
  fontWeight: 950,
  lineHeight: 1,
  textShadow: "0 1px 4px rgba(0,0,0,0.28)",
};


const coverStyle: CSSProperties = {
  minHeight: "132px",
  borderRadius: "18px",
  position: "relative",
  overflow: "hidden",
  backgroundImage:
    "radial-gradient(circle at top left, color-mix(in srgb, var(--historietas-accent, #F97316) 34%, transparent), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 72%, transparent), transparent 38%), linear-gradient(135deg, #1F102F 0%, #0F0F0F 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  minWidth: 0,
  boxShadow: "inset 0 -38px 62px rgba(0,0,0,0.52), inset 0 1px 0 rgba(255,255,255,0.06)",
};

const desktopCoverStyle: CSSProperties = {
  ...coverStyle,
  minHeight: "146px",
  borderRadius: "17px",
};

const coverClassificationBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "8px",
  left: "8px",
  right: "8px",
  maxWidth: "calc(100% - 16px)",
  padding: "6px 8px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 90%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #8B5CF6) 42%, transparent)",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 950,
  textAlign: "center",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const genreBadgeStyle: CSSProperties = {
  position: "absolute",
  left: "8px",
  right: "8px",
  bottom: "8px",
  maxWidth: "calc(100% - 16px)",
  padding: "6px 8px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 92%, transparent)",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 900,
  textAlign: "center",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const noCoverBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "42px",
  left: "8px",
  right: "8px",
  maxWidth: "calc(100% - 16px)",
  padding: "6px 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#D4D4D8",
  fontSize: "10px",
  fontWeight: 950,
  textAlign: "center",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const coverStatusBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #8B5CF6) 28%, transparent)",
  color: "var(--historietas-secondary-soft, #DDD6FE)",
  fontSize: "11px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const cardContentStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  display: "grid",
  alignContent: "center",
  gap: "7px",
};

const desktopCardContentStyle: CSSProperties = {
  ...cardContentStyle,
  gap: "7px",
  alignContent: "center",
};

const cardTopStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "21px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.05em",
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const statusRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  minWidth: 0,
};

const statusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 850,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const publishedStatusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.14)",
  border: "1px solid rgba(34, 197, 94, 0.3)",
  color: "#86EFAC",
  fontSize: "11px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const formatBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#E4E4E7",
  fontSize: "11px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const classificationBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #8B5CF6) 30%, transparent)",
  color: "var(--historietas-secondary-soft, #DDD6FE)",
  fontSize: "11px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const highlightBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const soonBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "rgba(113, 113, 122, 0.18)",
  border: "1px solid rgba(161, 161, 170, 0.22)",
  color: "#D4D4D8",
  fontSize: "11px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const favoriteBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 32%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const completedBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.16)",
  border: "1px solid rgba(34, 197, 94, 0.32)",
  color: "#86EFAC",
  fontSize: "11px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const readingBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #8B5CF6) 30%, transparent)",
  color: "var(--historietas-secondary-soft, #DDD6FE)",
  fontSize: "11px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const readBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.14)",
  border: "1px solid rgba(34, 197, 94, 0.3)",
  color: "#86EFAC",
  fontSize: "11px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const authorStyle: CSSProperties = {
  margin: 0,
  color: "#B3B3B3",
  fontSize: "13px",
  fontWeight: 700,
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const statsStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  color: "#A1A1AA",
  fontSize: "12px",
  fontWeight: 850,
  minWidth: 0,
};

const progressCompactStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
};

const progressBoxStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "10px",
  borderRadius: "18px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 10%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #8B5CF6) 22%, transparent)",
  minWidth: 0,
  overflow: "hidden",
};

const progressHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  minWidth: 0,
};

const progressTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const progressPercentStyle: CSSProperties = {
  color: "var(--historietas-secondary-soft, #DDD6FE)",
  fontSize: "12px",
  fontWeight: 950,
  ...safeTextStyle,
};

const progressTrackStyle: CSSProperties = {
  width: "100%",
  height: "7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.1)",
  overflow: "hidden",
};

const progressBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
};

const progressTextStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

const continueButtonStyle: CSSProperties = {
  minHeight: "38px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 10px",
  ...safeTextStyle,
};

const cardActionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "8px",
  minWidth: 0,
};

const favoriteButtonStyle: CSSProperties = {
  minHeight: "40px",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 32%, transparent)",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 10px",
  ...safeTextStyle,
};

const favoriteActiveButtonStyle: CSSProperties = {
  ...favoriteButtonStyle,
  background: "var(--historietas-accent, #F97316)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 70%, transparent)",
  color: "#FFFFFF",
  boxShadow: "0 12px 28px color-mix(in srgb, var(--historietas-accent, #F97316) 22%, transparent)",
};

const completedButtonStyle: CSSProperties = {
  minHeight: "40px",
  borderRadius: "999px",
  border: "1px solid rgba(34, 197, 94, 0.32)",
  background: "rgba(34, 197, 94, 0.12)",
  color: "#86EFAC",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 10px",
  ...safeTextStyle,
};

const completedActiveButtonStyle: CSSProperties = {
  ...completedButtonStyle,
  background: "#22C55E",
  border: "1px solid rgba(34, 197, 94, 0.7)",
  color: "#FFFFFF",
  boxShadow: "0 12px 28px rgba(34, 197, 94, 0.2)",
};

const readStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  marginTop: "2px",
  color: "var(--historietas-accent, #F97316)",
  fontSize: "14px",
  fontWeight: 950,
  ...safeTextStyle,
};

const soonReadStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  marginTop: "4px",
  color: "#A1A1AA",
  fontSize: "14px",
  fontWeight: 950,
  ...safeTextStyle,
};

const filterBoxStyle: CSSProperties = {
  marginTop: "14px",
  display: "grid",
  gap: "10px",
  padding: "13px",
  borderRadius: "24px",
  background:
    "radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 13%, transparent), transparent 34%), linear-gradient(135deg, rgba(255,255,255,0.074) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 10%, transparent) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent)",
  boxShadow: "0 22px 54px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)",
  backdropFilter: "blur(18px)",
  minWidth: 0,
  overflow: "hidden",
};

const desktopFilterBoxStyle: CSSProperties = {
  ...filterBoxStyle,
  gridTemplateColumns: "minmax(0, 1.05fr) minmax(320px, 0.95fr)",
  gap: "12px",
  padding: "14px",
  alignItems: "end",
};

const filterHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
  minWidth: 0,
};

const desktopFilterHeaderStyle: CSSProperties = {
  ...filterHeaderStyle,
  gridColumn: "1 / -1",
};

const filterMiniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const filterTitleStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "#FFFFFF",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

const clearFilterButtonStyle: CSSProperties = {
  minHeight: "42px",
  padding: "0 14px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  ...safeTextStyle,
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  height: "46px",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent)",
  background:
    "linear-gradient(135deg, rgba(12,7,23,0.86) 0%, rgba(255,255,255,0.085) 100%)",
  color: "#FFFFFF",
  padding: "0 15px",
  outline: "none",
  fontSize: "14px",
  fontWeight: 800,
  boxSizing: "border-box",
  minWidth: 0,
  boxShadow: "0 0 28px color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent), inset 0 1px 0 rgba(255,255,255,0.055)",
};

const desktopSearchInputStyle: CSSProperties = {
  ...searchInputStyle,
  height: "44px",
};

const quickFiltersGridStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  overflowX: "auto",
  paddingBottom: "2px",
  maxWidth: "100%",
  scrollbarWidth: "none",
};

const desktopQuickFiltersGridStyle: CSSProperties = {
  ...quickFiltersGridStyle,
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  overflowX: "visible",
  paddingBottom: 0,
};

const quickFilterButtonStyle: CSSProperties = {
  flex: "0 0 auto",
  minHeight: "38px",
  maxWidth: "210px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.13)",
  background: "rgba(255,255,255,0.075)",
  color: "#D4D4D8",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 12px",
  ...safeTextStyle,
};

const quickFilterActiveStyle: CSSProperties = {
  ...quickFilterButtonStyle,
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "#FFFFFF",
  boxShadow: "0 14px 34px color-mix(in srgb, var(--historietas-accent, #F97316) 26%, transparent), inset 0 1px 0 rgba(255,255,255,0.18)",
};

const filterStatsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "10px",
  minWidth: 0,
};

const filterStatCardStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  padding: "14px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  minWidth: 0,
  overflow: "hidden",
};

const filterStatNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #F97316)",
  fontSize: "26px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

const filterStatLabelStyle: CSSProperties = {
  color: "#D4D4D8",
  fontSize: "12px",
  fontWeight: 900,
  ...safeTextStyle,
};

const infoBoxStyle: CSSProperties = {
  marginTop: "24px",
  padding: "16px",
  borderRadius: "22px",
  background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 7%, transparent) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent)",
  minWidth: 0,
  overflow: "hidden",
};

const infoTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "22px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const infoTextStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "#D4D4D8",
  fontSize: "14px",
  lineHeight: 1.7,
  fontWeight: 600,
  maxWidth: "100%",
  ...safeTextStyle,
};

const emptyBoxStyle: CSSProperties = {
  marginTop: "18px",
  padding: "22px",
  borderRadius: "24px",
  background: "rgba(31,31,35,0.96)",
  border: "1px solid #2D2D32",
  display: "grid",
  gap: "12px",
  minWidth: 0,
  overflow: "hidden",
};

const emptyMiniBoxStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "20px",
  background: "rgba(31,31,35,0.96)",
  border: "1px solid #2D2D32",
  color: "#A1A1AA",
  fontSize: "14px",
  fontWeight: 800,
  lineHeight: 1.6,
  minWidth: 0,
  overflow: "hidden",
  ...safeTextStyle,
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "24px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  fontSize: "14px",
  lineHeight: 1.7,
  fontWeight: 600,
  maxWidth: "100%",
  ...safeTextStyle,
};

const emptyButtonStyle: CSSProperties = {
  minHeight: "50px",
  borderRadius: "999px",
  background: "var(--historietas-secondary, #7C3AED)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 12px",
  ...safeTextStyle,
};