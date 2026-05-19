"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { obras } from "../data/obras";
import type { Obra } from "../data/obras";
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
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: "texto" | "documento" | "imagem" | "outro";
  criadoEm: string;
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
  arquivoObra?: ArquivoObraLocal | null;
  publicado: boolean;
  capitulos: CapituloLocal[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  slug: string;
  link: string;
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
  slug: string | null;
  link: string | null;
  criada_em: string | null;
  atualizado_em: string | null;
};

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

type OrdenacaoExplorar =
  | "relevancia"
  | "mais-curtidas"
  | "mais-salvas"
  | "mais-comentadas"
  | "mais-recentes"
  | "mais-capitulos";

type FiltroColecaoExplorar =
  | "todos"
  | "favoritas"
  | "concluidas"
  | "lendo"
  | "sem-leitura";

const STORAGE_KEY = "historietas-obras";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";

const categorias = [
  "Fantasia",
  "Romance",
  "Terror",
  "Ação",
  "Sci-fi",
  "Drama",
  "Aventura",
  "Comédia",
  "Sobrenatural",
];

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

function categoriaCombinaComGenero(categoria: string, genero: string) {
  const categoriaNormalizada = normalizarTexto(categoria);
  const generoNormalizado = normalizarTexto(genero);

  if (!categoriaNormalizada || !generoNormalizado) {
    return false;
  }

  return generoNormalizado.includes(categoriaNormalizada);
}

function converterMetricaParaNumero(valor: string) {
  const texto = valor.trim().toLowerCase().replace(",", ".");

  if (texto.endsWith("k")) {
    return Number(texto.replace("k", "")) * 1000;
  }

  return Number(texto) || 0;
}

function totalCurtidasObra(obra: ObraLocal) {
  return obra.capitulos.filter((capitulo) => capitulo.curtiu).length;
}

function totalComentariosObra(obra: ObraLocal) {
  return obra.capitulos.filter((capitulo) => capitulo.comentario.trim()).length;
}

function totalSalvosObra(obra: ObraLocal) {
  return obra.capitulos.filter((capitulo) => capitulo.salvo).length;
}

function totalLidosObra(obra: ObraLocal) {
  return obra.capitulos.filter((capitulo) => capitulo.lido).length;
}

function obraTemAtividadeLeitura(obra: ObraLocal) {
  return obra.capitulos.some((capitulo) => {
    return (
      capitulo.lido ||
      capitulo.salvo ||
      capitulo.curtiu ||
      Boolean(capitulo.comentario.trim())
    );
  });
}

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
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

function dataCriacaoObra(obra: ObraLocal) {
  const data = new Date(obra.criadaEm).getTime();

  return Number.isNaN(data) ? 0 : data;
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
    titulo: capitulo.titulo || "Capítulo sem título",
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

  if (
    typeof arquivo.nome !== "string" ||
    !arquivo.nome.trim() ||
    typeof arquivo.conteudo !== "string" ||
    !arquivo.conteudo.trim()
  ) {
    return null;
  }

  let categoria: ArquivoObraLocal["categoria"] = "outro";

  if (
    arquivo.categoria === "texto" ||
    arquivo.categoria === "documento" ||
    arquivo.categoria === "imagem" ||
    arquivo.categoria === "outro"
  ) {
    categoria = arquivo.categoria;
  }

  return {
    nome: arquivo.nome.trim(),
    tipo: typeof arquivo.tipo === "string" ? arquivo.tipo : "",
    tamanho:
      typeof arquivo.tamanho === "number" && Number.isFinite(arquivo.tamanho)
        ? arquivo.tamanho
        : 0,
    conteudo: arquivo.conteudo,
    categoria,
    criadoEm: typeof arquivo.criadoEm === "string" ? arquivo.criadoEm : "",
  };
}

function normalizarObra(
  obra: Partial<ObraLocal> & Record<string, unknown>,
  index: number
): ObraLocal {
  const capitulosNormalizados: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapitulo(capitulo, capituloIndex)
      )
    : [];

  const tagsNormalizadas = Array.isArray(obra.tags)
    ? obra.tags
        .filter((tag): tag is string => {
          return typeof tag === "string" && Boolean(tag.trim());
        })
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
    arquivoObra: normalizarArquivoObra(obra.arquivoObra),
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
  };
}

function normalizarCategoriaArquivoSupabase(
  categoria: string | null
): ArquivoObraLocal["categoria"] {
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

function normalizarObraSupabase(
  obra: SupabaseObraRow,
  capitulosSupabase: SupabaseCapituloRow[],
  obraLocal: ObraLocal | undefined,
  index: number
): ObraLocal {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo])
  );

  const capitulosRemotos: CapituloLocal[] = capitulosSupabase.map(
    (capitulo, capituloIndex) => {
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
      };
    }
  );

  const capitulosRemotosIds = new Set(
    capitulosRemotos.map((capitulo) => capitulo.id)
  );

  const capitulosApenasLocais = (obraLocal?.capitulos || []).filter(
    (capitulo) => !capitulosRemotosIds.has(capitulo.id)
  );

  const capitulosMesclados = [...capitulosRemotos, ...capitulosApenasLocais];
  const tituloObra = obra.titulo?.trim() || obraLocal?.titulo || "Obra sem título";
  const slugObra =
    obra.slug?.trim() ||
    obraLocal?.slug ||
    criarSlugBase(tituloObra || `obra-${index + 1}`);
  const arquivoUrl = obra.arquivo_url?.trim() || "";
  const arquivoCategoria = normalizarCategoriaArquivoSupabase(
    obra.arquivo_categoria
  );
  const arquivoTipo =
    obra.arquivo_tipo?.trim() ||
    obraLocal?.arquivoObra?.tipo ||
    (arquivoCategoria === "documento"
      ? "application/pdf"
      : arquivoCategoria === "imagem"
        ? "image/*"
        : arquivoCategoria === "texto"
          ? "text/plain"
          : "");

  return {
    id: obra.id || obraLocal?.id || `obra-${index + 1}`,
    titulo: tituloObra,
    autor: obra.autor?.trim() || obraLocal?.autor || "Autor não informado",
    genero: obra.genero?.trim() || obraLocal?.genero || "Não informado",
    formato: obra.formato?.trim() || obraLocal?.formato || "Não informado",
    classificacaoIndicativa:
      obra.classificacao_indicativa?.trim() ||
      obraLocal?.classificacaoIndicativa ||
      "Não informada",
    sinopse:
      obra.sinopse?.trim() ||
      obraLocal?.sinopse ||
      "Nenhuma sinopse informada.",
    tags:
      Array.isArray(obra.tags) && obra.tags.length > 0
        ? obra.tags.filter((tag) => typeof tag === "string" && Boolean(tag.trim()))
        : obraLocal?.tags || ["sem tags"],
    capa: obra.capa_url?.trim() || obraLocal?.capa || "",
    capaNome: obra.capa_nome?.trim() || obraLocal?.capaNome || "",
    arquivoObra: arquivoUrl
      ? {
          nome:
            obra.arquivo_nome?.trim() ||
            obraLocal?.arquivoObra?.nome ||
            "Arquivo da obra",
          tipo: arquivoTipo,
          tamanho:
            typeof obra.arquivo_tamanho === "number" &&
            Number.isFinite(obra.arquivo_tamanho)
              ? obra.arquivo_tamanho
              : obraLocal?.arquivoObra?.tamanho || 0,
          conteudo: arquivoUrl,
          categoria: arquivoCategoria,
          criadoEm: obra.criada_em || obraLocal?.arquivoObra?.criadoEm || "",
        }
      : obraLocal?.arquivoObra || null,
    publicado: Boolean(obra.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obra.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    slug: slugObra,
    link: obra.link?.trim() || obraLocal?.link || `/obra/${slugObra}`,
  };
}

function mesclarObrasSemDuplicar(
  obrasLocais: ObraLocal[],
  obrasSupabase: ObraLocal[]
) {
  const obrasMescladas: ObraLocal[] = [];
  const chavesUsadas = new Set<string>();

  [...obrasSupabase, ...obrasLocais].forEach((obra) => {
    const slug = obra.slug || criarSlugBase(obra.titulo);
    const chaves = [obra.id, slug].filter((chave) => Boolean(chave.trim()));
    const jaExiste = chaves.some((chave) => chavesUsadas.has(chave));

    if (jaExiste) {
      return;
    }

    obrasMescladas.push(obra);
    chaves.forEach((chave) => chavesUsadas.add(chave));
  });

  return obrasMescladas;
}

async function carregarObrasPublicadasSupabase(obrasLocais: ObraLocal[]) {
  try {
    const { data: obrasBanco, error: erroObras } = await supabase
      .from("obras")
      .select("*")
      .eq("publicado", true)
      .order("criada_em", { ascending: false });

    if (erroObras) {
      console.warn(
        "Não consegui carregar obras publicadas do Supabase:",
        erroObras.message
      );
      return obrasLocais;
    }

    const obrasSupabase = ((obrasBanco || []) as SupabaseObraRow[]).filter(
      (obra) => Boolean(obra.id)
    );

    if (obrasSupabase.length === 0) {
      return obrasLocais;
    }

    const idsObras = obrasSupabase.map((obra) => obra.id);
    const { data: capitulosBanco, error: erroCapitulos } = await supabase
      .from("capitulos")
      .select("*")
      .in("obra_id", idsObras)
      .order("ordem", { ascending: true });

    if (erroCapitulos) {
      console.warn(
        "Não consegui carregar capítulos do Supabase no Explorar:",
        erroCapitulos.message
      );
    }

    const capitulosPorObra = new Map<string, SupabaseCapituloRow[]>();

    ((erroCapitulos ? [] : capitulosBanco || []) as SupabaseCapituloRow[]).forEach(
      (capitulo) => {
        const capitulosAtuais = capitulosPorObra.get(capitulo.obra_id) || [];
        capitulosAtuais.push(capitulo);
        capitulosPorObra.set(capitulo.obra_id, capitulosAtuais);
      }
    );

    const obrasSupabaseNormalizadas = obrasSupabase.map((obraBanco, index) => {
      const slugBanco = obraBanco.slug?.trim() || "";
      const obraLocal = obrasLocais.find((obraLocalAtual) => {
        const slugLocal =
          obraLocalAtual.slug || criarSlugBase(obraLocalAtual.titulo);

        return obraLocalAtual.id === obraBanco.id || slugLocal === slugBanco;
      });

      return normalizarObraSupabase(
        obraBanco,
        capitulosPorObra.get(obraBanco.id) || [],
        obraLocal,
        index
      );
    });

    const obrasMescladas = mesclarObrasSemDuplicar(
      obrasLocais,
      obrasSupabaseNormalizadas
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasMescladas));

    return obrasMescladas;
  } catch (error) {
    console.warn("Não consegui acessar o Supabase no Explorar:", error);
    return obrasLocais;
  }
}

function ordenarObrasLocais(lista: ObraLocal[], ordenacao: OrdenacaoExplorar) {
  const novaLista = [...lista];

  if (ordenacao === "mais-curtidas") {
    return novaLista.sort(
      (a, b) => totalCurtidasObra(b) - totalCurtidasObra(a)
    );
  }

  if (ordenacao === "mais-salvas") {
    return novaLista.sort((a, b) => totalSalvosObra(b) - totalSalvosObra(a));
  }

  if (ordenacao === "mais-comentadas") {
    return novaLista.sort(
      (a, b) => totalComentariosObra(b) - totalComentariosObra(a)
    );
  }

  if (ordenacao === "mais-recentes") {
    return novaLista.sort((a, b) => dataCriacaoObra(b) - dataCriacaoObra(a));
  }

  if (ordenacao === "mais-capitulos") {
    return novaLista.sort((a, b) => b.capitulos.length - a.capitulos.length);
  }

  return novaLista;
}

function ordenarObrasFixas(lista: Obra[], ordenacao: OrdenacaoExplorar) {
  const novaLista = [...lista];

  if (ordenacao === "mais-curtidas") {
    return novaLista.sort(
      (a, b) =>
        converterMetricaParaNumero(b.likes) -
        converterMetricaParaNumero(a.likes)
    );
  }

  if (ordenacao === "mais-comentadas") {
    return novaLista.sort(
      (a, b) =>
        converterMetricaParaNumero(b.comentarios) -
        converterMetricaParaNumero(a.comentarios)
    );
  }

  return novaLista;
}

function criarPublishedCoverStyle(
  capa: string,
  tema?: ReturnType<typeof obterTemaCategoria>
): CSSProperties {
  const baseStyle = tema ? criarPublishedCoverTemaStyle(tema) : publishedCoverStyle;

  if (!capa) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    backgroundImage: `linear-gradient(180deg, rgba(15, 8, 32, 0.04) 0%, rgba(15, 8, 32, 0.82) 100%), url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function obterTemaCategoria(categoria: string) {
  const categoriaNormalizada = normalizarTexto(categoria);

  if (categoriaNormalizada === "fantasia") {
    return {
      accent: "#A78BFA",
      activeBackground: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
      pageBackground:
        "radial-gradient(circle at 18% 0%, rgba(124,58,237,0.36), transparent 30%), radial-gradient(circle at 90% 20%, rgba(167,139,250,0.16), transparent 24%), radial-gradient(circle at 50% 100%, rgba(249,115,22,0.08), transparent 30%), linear-gradient(180deg, #10071F 0%, #180B2D 42%, #1B1030 75%, #17101F 100%)",
      heroBackground:
        "radial-gradient(circle at 16% 0%, rgba(167,139,250,0.46), transparent 32%), radial-gradient(circle at 90% 45%, rgba(124,58,237,0.22), transparent 30%), linear-gradient(135deg, rgba(27,13,48,0.98) 0%, rgba(12,7,23,0.98) 100%)",
    };
  }

  if (categoriaNormalizada === "romance") {
    return {
      accent: "#F472B6",
      activeBackground: "linear-gradient(135deg, #BE185D 0%, #F472B6 100%)",
      pageBackground:
        "radial-gradient(circle at 18% 0%, rgba(244,114,182,0.30), transparent 30%), radial-gradient(circle at 90% 20%, rgba(124,58,237,0.18), transparent 24%), radial-gradient(circle at 50% 100%, rgba(249,115,22,0.08), transparent 30%), linear-gradient(180deg, #120718 0%, #1D0A23 42%, #21102D 75%, #17101F 100%)",
      heroBackground:
        "radial-gradient(circle at 16% 0%, rgba(244,114,182,0.42), transparent 32%), radial-gradient(circle at 90% 45%, rgba(190,24,93,0.20), transparent 30%), linear-gradient(135deg, rgba(34,13,40,0.98) 0%, rgba(12,7,23,0.98) 100%)",
    };
  }

  if (categoriaNormalizada === "terror") {
    return {
      accent: "#FB7185",
      activeBackground: "linear-gradient(135deg, #7F1D1D 0%, #FB7185 100%)",
      pageBackground:
        "radial-gradient(circle at 18% 0%, rgba(127,29,29,0.34), transparent 30%), radial-gradient(circle at 90% 20%, rgba(124,58,237,0.12), transparent 24%), radial-gradient(circle at 50% 100%, rgba(249,115,22,0.08), transparent 30%), linear-gradient(180deg, #0B060B 0%, #16080D 42%, #1B0E1E 75%, #161016 100%)",
      heroBackground:
        "radial-gradient(circle at 16% 0%, rgba(127,29,29,0.44), transparent 32%), radial-gradient(circle at 90% 45%, rgba(251,113,133,0.16), transparent 30%), linear-gradient(135deg, rgba(30,10,16,0.98) 0%, rgba(9,7,13,0.98) 100%)",
    };
  }

  if (categoriaNormalizada === "acao") {
    return {
      accent: "#F97316",
      activeBackground: "linear-gradient(135deg, #EA580C 0%, #F97316 100%)",
      pageBackground:
        "radial-gradient(circle at 18% 0%, rgba(249,115,22,0.22), transparent 30%), radial-gradient(circle at 90% 20%, rgba(124,58,237,0.18), transparent 24%), radial-gradient(circle at 50% 100%, rgba(249,115,22,0.09), transparent 30%), linear-gradient(180deg, #100712 0%, #170A22 42%, #1A0D2B 75%, #1A1217 100%)",
      heroBackground:
        "radial-gradient(circle at 16% 0%, rgba(249,115,22,0.28), transparent 32%), radial-gradient(circle at 90% 45%, rgba(124,58,237,0.20), transparent 30%), linear-gradient(135deg, rgba(27,13,33,0.98) 0%, rgba(12,7,23,0.98) 100%)",
    };
  }

  if (categoriaNormalizada === "sci-fi" || categoriaNormalizada === "sci fi") {
    return {
      accent: "#38BDF8",
      activeBackground: "linear-gradient(135deg, #0369A1 0%, #38BDF8 100%)",
      pageBackground:
        "radial-gradient(circle at 18% 0%, rgba(56,189,248,0.24), transparent 30%), radial-gradient(circle at 90% 20%, rgba(124,58,237,0.18), transparent 24%), radial-gradient(circle at 50% 100%, rgba(249,115,22,0.06), transparent 30%), linear-gradient(180deg, #06111F 0%, #091B2D 42%, #11172E 75%, #11111F 100%)",
      heroBackground:
        "radial-gradient(circle at 16% 0%, rgba(56,189,248,0.30), transparent 32%), radial-gradient(circle at 90% 45%, rgba(124,58,237,0.20), transparent 30%), linear-gradient(135deg, rgba(9,27,45,0.98) 0%, rgba(8,7,23,0.98) 100%)",
    };
  }

  if (categoriaNormalizada === "drama") {
    return {
      accent: "#C084FC",
      activeBackground: "linear-gradient(135deg, #581C87 0%, #C084FC 100%)",
      pageBackground:
        "radial-gradient(circle at 18% 0%, rgba(192,132,252,0.24), transparent 30%), radial-gradient(circle at 90% 20%, rgba(249,115,22,0.08), transparent 24%), radial-gradient(circle at 50% 100%, rgba(249,115,22,0.07), transparent 30%), linear-gradient(180deg, #0E0718 0%, #160A24 42%, #1B1029 75%, #17101F 100%)",
      heroBackground:
        "radial-gradient(circle at 16% 0%, rgba(192,132,252,0.30), transparent 32%), radial-gradient(circle at 90% 45%, rgba(88,28,135,0.22), transparent 30%), linear-gradient(135deg, rgba(24,13,39,0.98) 0%, rgba(12,7,23,0.98) 100%)",
    };
  }

  if (categoriaNormalizada === "aventura") {
    return {
      accent: "#FBBF24",
      activeBackground: "linear-gradient(135deg, #B45309 0%, #FBBF24 100%)",
      pageBackground:
        "radial-gradient(circle at 18% 0%, rgba(251,191,36,0.18), transparent 30%), radial-gradient(circle at 90% 20%, rgba(124,58,237,0.18), transparent 24%), radial-gradient(circle at 50% 100%, rgba(249,115,22,0.08), transparent 30%), linear-gradient(180deg, #100B06 0%, #181020 42%, #1B1129 75%, #17101F 100%)",
      heroBackground:
        "radial-gradient(circle at 16% 0%, rgba(251,191,36,0.24), transparent 32%), radial-gradient(circle at 90% 45%, rgba(124,58,237,0.20), transparent 30%), linear-gradient(135deg, rgba(31,20,12,0.98) 0%, rgba(12,7,23,0.98) 100%)",
    };
  }

  if (categoriaNormalizada === "comedia") {
    return {
      accent: "#FDE047",
      activeBackground: "linear-gradient(135deg, #CA8A04 0%, #FDE047 100%)",
      pageBackground:
        "radial-gradient(circle at 18% 0%, rgba(253,224,71,0.22), transparent 30%), radial-gradient(circle at 90% 20%, rgba(249,115,22,0.16), transparent 24%), radial-gradient(circle at 50% 100%, rgba(124,58,237,0.08), transparent 30%), linear-gradient(180deg, #100D05 0%, #18120A 42%, #1B1328 75%, #17101F 100%)",
      heroBackground:
        "radial-gradient(circle at 16% 0%, rgba(253,224,71,0.28), transparent 32%), radial-gradient(circle at 90% 45%, rgba(249,115,22,0.18), transparent 30%), linear-gradient(135deg, rgba(31,23,10,0.98) 0%, rgba(12,7,23,0.98) 100%)",
    };
  }

  if (categoriaNormalizada === "sobrenatural") {
    return {
      accent: "#34D399",
      activeBackground: "linear-gradient(135deg, #065F46 0%, #34D399 100%)",
      pageBackground:
        "radial-gradient(circle at 18% 0%, rgba(52,211,153,0.20), transparent 30%), radial-gradient(circle at 90% 20%, rgba(124,58,237,0.18), transparent 24%), radial-gradient(circle at 50% 100%, rgba(249,115,22,0.06), transparent 30%), linear-gradient(180deg, #06120D 0%, #0B1D1C 42%, #12172B 75%, #10171A 100%)",
      heroBackground:
        "radial-gradient(circle at 16% 0%, rgba(52,211,153,0.24), transparent 32%), radial-gradient(circle at 90% 45%, rgba(124,58,237,0.18), transparent 30%), linear-gradient(135deg, rgba(8,30,22,0.98) 0%, rgba(12,7,23,0.98) 100%)",
    };
  }

  return {
    accent: "#F97316",
    activeBackground: "linear-gradient(135deg, #7C3AED 0%, #F97316 100%)",
    pageBackground:
      "radial-gradient(circle at 14% 0%, rgba(124,58,237,0.22), transparent 28%), radial-gradient(circle at 86% 18%, rgba(91,33,182,0.14), transparent 22%), radial-gradient(circle at 50% 100%, rgba(249,115,22,0.10), transparent 28%), linear-gradient(180deg, #0D0618 0%, #12081F 26%, #170A28 52%, #1A0D2B 72%, #1B1026 86%, #1A1217 100%)",
    heroBackground:
      "radial-gradient(circle at 18% 0%, rgba(124,58,237,0.42), transparent 32%), radial-gradient(circle at 90% 45%, rgba(249,115,22,0.12), transparent 28%), linear-gradient(135deg, rgba(26,13,43,0.98) 0%, rgba(12,7,23,0.98) 100%)",
  };
}

function obterDecoracoesCategoria(categoria: string) {
  const categoriaNormalizada = normalizarTexto(categoria);

  if (categoriaNormalizada === "sobrenatural") {
    return ["☾", "✦", "👻", "✧", "◌"];
  }

  if (categoriaNormalizada === "terror") {
    return ["☾", "🕸", "✕", "◌", "✦"];
  }

  if (categoriaNormalizada === "fantasia") {
    return ["✦", "✧", "◇", "☾", "✶"];
  }

  if (categoriaNormalizada === "sci-fi" || categoriaNormalizada === "sci fi") {
    return ["⌁", "◇", "＋", "◌", "⌬"];
  }

  if (categoriaNormalizada === "romance") {
    return ["✦", "♡", "✧", "◌", "❀"];
  }

  if (categoriaNormalizada === "acao") {
    return ["✦", "╱", "⚡", "✕", "╲"];
  }

  if (categoriaNormalizada === "drama") {
    return ["☾", "✧", "◌", "✦", "◇"];
  }

  if (categoriaNormalizada === "aventura") {
    return ["✦", "⌖", "◇", "☾", "✧"];
  }

  if (categoriaNormalizada === "comedia") {
    return ["✦", "☺", "✧", "☆", "◌"];
  }

  return ["✦", "◌", "✧"];
}

function criarDecoracaoTemaStyle(
  index: number,
  tema: ReturnType<typeof obterTemaCategoria>
): CSSProperties {
  const posicoes: CSSProperties[] = [
    { top: "8%", right: "8%", fontSize: "42px", transform: "rotate(-12deg)" },
    { top: "48%", right: "15%", fontSize: "28px", transform: "rotate(16deg)" },
    { bottom: "12%", right: "6%", fontSize: "34px", transform: "rotate(8deg)" },
    { top: "16%", left: "8%", fontSize: "22px", transform: "rotate(14deg)" },
    { bottom: "16%", left: "18%", fontSize: "26px", transform: "rotate(-10deg)" },
  ];

  return {
    position: "absolute",
    color: tema.accent,
    opacity: 0.13,
    lineHeight: 1,
    fontWeight: 950,
    filter: `drop-shadow(0 0 18px ${tema.accent}55)`,
    userSelect: "none",
    ...posicoes[index % posicoes.length],
  };
}

export default function ExplorarPage() {
  const [obrasLocais, setObrasLocais] = useState<ObraLocal[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroFormato, setFiltroFormato] = useState("todos");
  const [filtroClassificacao, setFiltroClassificacao] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPublicacao, setFiltroPublicacao] = useState("todos");
  const [filtroCapa, setFiltroCapa] = useState("todos");
  const [filtroCapitulos, setFiltroCapitulos] = useState("todos");
  const [filtroColecao, setFiltroColecao] =
    useState<FiltroColecaoExplorar>("todos");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoExplorar>("relevancia");
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
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

    async function carregarExplorar() {
      const params = new URLSearchParams(window.location.search);
      const categoriaParam = params.get("categoria") || "";

      setCategoriaSelecionada(categoriaParam.trim());

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

        const obrasComSupabase = await carregarObrasPublicadasSupabase(
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

    carregarExplorar();

    return () => {
      cancelado = true;
    };
  }, []);

  const termoBusca = normalizarTexto(busca);

  const formatosDisponiveis = useMemo(() => {
    const formatos = obrasLocais
      .map((obra) => obra.formato)
      .filter((formato) => formato && formato !== "Não informado");

    return Array.from(new Set(formatos)).sort((a, b) => a.localeCompare(b));
  }, [obrasLocais]);

  const classificacoesDisponiveis = useMemo(() => {
    const classificacoesLocais = obrasLocais
      .map((obra) => obra.classificacaoIndicativa)
      .filter(
        (classificacao) => classificacao && classificacao !== "Não informada"
      );

    const classificacoesFixas = obras
      .map((obra) => obra.classificacaoIndicativa)
      .filter((classificacao) => classificacao && classificacao.trim());

    return Array.from(
      new Set([...classificacoesLocais, ...classificacoesFixas])
    ).sort((a, b) => a.localeCompare(b));
  }, [obrasLocais]);

  const obrasLocaisFiltradas = useMemo(() => {
    const filtradas = obrasLocais.filter((obra) => {
      const passaCategoria = categoriaSelecionada
        ? categoriaCombinaComGenero(categoriaSelecionada, obra.genero)
        : true;

      const passaFormato =
        filtroFormato === "todos" ? true : obra.formato === filtroFormato;

      const passaClassificacao =
        filtroClassificacao === "todos"
          ? true
          : obra.classificacaoIndicativa === filtroClassificacao;

      const passaStatus =
        filtroStatus === "todos"
          ? true
          : filtroStatus === "disponivel"
            ? obra.publicado
            : !obra.publicado;

      const passaPublicacao =
        filtroPublicacao === "todos"
          ? true
          : filtroPublicacao === "publicado"
            ? obra.publicado
            : !obra.publicado;

      const passaCapa =
        filtroCapa === "todos"
          ? true
          : filtroCapa === "com-capa"
            ? Boolean(obra.capa)
            : !obra.capa;

      const passaCapitulos =
        filtroCapitulos === "todos"
          ? true
          : filtroCapitulos === "com-capitulos"
            ? obra.capitulos.length > 0
            : obra.capitulos.length === 0;

      const passaColecao =
        filtroColecao === "todos"
          ? true
          : filtroColecao === "favoritas"
            ? obrasFavoritas.includes(obra.id)
            : filtroColecao === "concluidas"
              ? obrasConcluidas.includes(obra.id)
              : filtroColecao === "lendo"
                ? obraTemAtividadeLeitura(obra)
                : !obraTemAtividadeLeitura(obra);

      const textoBusca = normalizarTexto(
        [
          obra.titulo,
          obra.autor,
          obra.genero,
          obra.formato,
          obra.classificacaoIndicativa,
          obra.sinopse,
          obra.tags.join(" "),
          obra.capaNome,
          obra.arquivoObra?.nome || "",
          obra.capitulos.map((capitulo) => capitulo.titulo).join(" "),
          obra.capitulos.map((capitulo) => capitulo.texto).join(" "),
        ].join(" ")
      );

      const passaBusca = termoBusca ? textoBusca.includes(termoBusca) : true;

      return (
        passaCategoria &&
        passaFormato &&
        passaClassificacao &&
        passaStatus &&
        passaPublicacao &&
        passaCapa &&
        passaCapitulos &&
        passaColecao &&
        passaBusca
      );
    });

    return ordenarObrasLocais(filtradas, ordenacao);
  }, [
    obrasLocais,
    categoriaSelecionada,
    filtroFormato,
    filtroClassificacao,
    filtroStatus,
    filtroPublicacao,
    filtroCapa,
    filtroCapitulos,
    filtroColecao,
    termoBusca,
    ordenacao,
    obrasFavoritas,
    obrasConcluidas,
  ]);

  const obrasFixasFiltradas = useMemo(() => {
    const filtradas = obras.filter((obra) => {
      const passaCategoria = categoriaSelecionada
        ? categoriaCombinaComGenero(categoriaSelecionada, obra.genero)
        : true;

      const passaFormato = filtroFormato === "todos";

      const passaClassificacao =
        filtroClassificacao === "todos"
          ? true
          : obra.classificacaoIndicativa === filtroClassificacao;

      const passaStatus =
        filtroStatus === "todos"
          ? true
          : filtroStatus === "disponivel"
            ? obra.disponivel
            : !obra.disponivel;

      const passaPublicacao =
        filtroPublicacao === "todos"
          ? true
          : filtroPublicacao === "publicado"
            ? obra.disponivel
            : false;

      const passaCapa =
        filtroCapa === "todos"
          ? true
          : filtroCapa === "com-capa"
            ? false
            : true;

      const passaCapitulos =
        filtroCapitulos === "todos"
          ? true
          : filtroCapitulos === "com-capitulos"
            ? false
            : true;

      const passaColecao = filtroColecao === "todos";

      const textoBusca = normalizarTexto(
        [
          obra.titulo,
          obra.autor,
          obra.genero,
          obra.classificacaoIndicativa,
          obra.status,
        ].join(" ")
      );

      const passaBusca = termoBusca ? textoBusca.includes(termoBusca) : true;

      return (
        passaCategoria &&
        passaFormato &&
        passaClassificacao &&
        passaStatus &&
        passaPublicacao &&
        passaCapa &&
        passaCapitulos &&
        passaColecao &&
        passaBusca
      );
    });

    return ordenarObrasFixas(filtradas, ordenacao);
  }, [
    categoriaSelecionada,
    filtroFormato,
    filtroClassificacao,
    filtroStatus,
    filtroPublicacao,
    filtroCapa,
    filtroCapitulos,
    filtroColecao,
    termoBusca,
    ordenacao,
  ]);

  const totalResultados =
    obrasLocaisFiltradas.length + obrasFixasFiltradas.length;

  const totalFavoritasResultado = obrasLocaisFiltradas.filter((obra) =>
    obrasFavoritas.includes(obra.id)
  ).length;

  const totalConcluidasResultado = obrasLocaisFiltradas.filter((obra) =>
    obrasConcluidas.includes(obra.id)
  ).length;

  const totalLendoResultado = obrasLocaisFiltradas.filter((obra) =>
    obraTemAtividadeLeitura(obra)
  ).length;

  const filtroColecaoTexto =
    filtroColecao === "favoritas"
      ? "Favoritas"
      : filtroColecao === "concluidas"
        ? "Concluídas"
        : filtroColecao === "lendo"
          ? "Lendo agora"
          : filtroColecao === "sem-leitura"
            ? "Sem leitura"
            : "Todas";

  const filtrosAtivos = Boolean(
    categoriaSelecionada ||
      termoBusca ||
      filtroFormato !== "todos" ||
      filtroClassificacao !== "todos" ||
      filtroStatus !== "todos" ||
      filtroPublicacao !== "todos" ||
      filtroCapa !== "todos" ||
      filtroCapitulos !== "todos" ||
      filtroColecao !== "todos" ||
      ordenacao !== "relevancia"
  );

  const totalFiltrosAvancadosAtivos = [
    filtroFormato !== "todos",
    filtroClassificacao !== "todos",
    filtroStatus !== "todos",
    filtroPublicacao !== "todos",
    filtroCapa !== "todos",
    filtroCapitulos !== "todos",
    ordenacao !== "relevancia",
  ].filter(Boolean).length;

  const textoBotaoFiltrosAvancados =
    totalFiltrosAvancadosAtivos > 0
      ? `Filtros avançados (${totalFiltrosAvancadosAtivos})`
      : "Filtros avançados";

  const temaPagina = obterTemaCategoria(categoriaSelecionada);
  const decoracoesTema = obterDecoracoesCategoria(categoriaSelecionada);

  const textoTotalResultados =
    totalResultados === 1
      ? "1 história encontrada"
      : `${totalResultados} histórias encontradas`;

  const detalhesResumo = [
    obrasLocaisFiltradas.length > 0
      ? `${obrasLocaisFiltradas.length} ${
          obrasLocaisFiltradas.length === 1 ? "publicação" : "publicações"
        } da comunidade`
      : "",
    obrasFixasFiltradas.length > 0
      ? `${obrasFixasFiltradas.length} do catálogo inicial`
      : "",
    totalLendoResultado > 0 ? `${totalLendoResultado} em leitura` : "",
    totalFavoritasResultado > 0
      ? `${totalFavoritasResultado} ${
          totalFavoritasResultado === 1 ? "favorita" : "favoritas"
        }`
      : "",
    totalConcluidasResultado > 0
      ? `${totalConcluidasResultado} ${
          totalConcluidasResultado === 1 ? "concluída" : "concluídas"
        }`
      : "",
  ].filter(Boolean);

  const resumoCompacto = detalhesResumo.length > 0
    ? `${textoTotalResultados} • ${detalhesResumo.join(" • ")}`
    : textoTotalResultados;

  function atualizarUrl(categoria: string) {
    const novaUrl = categoria
      ? `/explorar?categoria=${encodeURIComponent(categoria)}`
      : "/explorar";

    window.history.pushState(null, "", novaUrl);
  }

  function selecionarCategoria(categoria: string) {
    setCategoriaSelecionada(categoria);
    atualizarUrl(categoria);
  }

  function limparFiltros() {
    setCategoriaSelecionada("");
    setBusca("");
    setFiltroFormato("todos");
    setFiltroClassificacao("todos");
    setFiltroStatus("todos");
    setFiltroPublicacao("todos");
    setFiltroCapa("todos");
    setFiltroCapitulos("todos");
    setFiltroColecao("todos");
    setOrdenacao("relevancia");
    setMostrarFiltrosAvancados(false);
    window.history.pushState(null, "", "/explorar");
  }

  return (
    <main style={{ ...pageStyle, background: temaPagina.pageBackground }}>
      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTopStyle : topStyle}>
          <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
            <span style={logoMarkStyle}>H</span>
            <span style={logoTextStyle}>istorietas</span>
          </Link>

          <div style={isDesktop ? desktopTopActionsStyle : topActionsStyle}>
            <Link href="/em-breve" style={soonTopButtonStyle}>
              Em breve
            </Link>
          </div>
        </header>

        <section style={{ ...(isDesktop ? desktopHeroStyle : heroStyle), background: temaPagina.heroBackground }}>
          <div style={heroDecorationLayerStyle} aria-hidden="true">
            {decoracoesTema.map((decoracao, index) => (
              <span
                key={`${decoracao}-${index}`}
                style={criarDecoracaoTemaStyle(index, temaPagina)}
              >
                {decoracao}
              </span>
            ))}
          </div>

          <span style={isDesktop ? desktopBadgeStyle : badgeStyle}>
            CATÁLOGO HISTORIETAS
          </span>

          <h1 style={isDesktop ? desktopTitleStyle : titleStyle}>
            {categoriaSelecionada
              ? `${categoriaSelecionada}`
              : "Explorar histórias"}
          </h1>

          <p style={isDesktop ? desktopDescriptionStyle : descriptionStyle}>
            Descubra histórias, mangás, fanfics e obras autorais por gênero,
            estilo de leitura e momento da sua biblioteca.
          </p>
        </section>

        <section style={isDesktop ? desktopCategoriesStyle : categoriesStyle} aria-label="Categorias">
          <button
            type="button"
            onClick={() => selecionarCategoria("")}
            style={!categoriaSelecionada ? criarActiveCategoryStyle(temaPagina) : categoryStyle}
          >
            Todas
          </button>

          {categorias.map((categoria) => (
            <button
              key={categoria}
              type="button"
              onClick={() => selecionarCategoria(categoria)}
              style={
                categoriaSelecionada === categoria
                  ? criarActiveCategoryStyle(temaPagina)
                  : categoryStyle
              }
            >
              {categoria}
            </button>
          ))}
        </section>

        <p style={isDesktop ? desktopCompactSummaryStyle : compactSummaryStyle}>{resumoCompacto}</p>

        <section style={isDesktop ? criarDesktopSearchBoxStyle(temaPagina) : criarSearchBoxStyle(temaPagina)}>
          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por título, autor, gênero ou tags..."
            style={isDesktop ? desktopSearchInputStyle : searchInputStyle}
            type="text"
          />

          <div style={isDesktop ? desktopQuickFiltersStyle : quickFiltersStyle}>
            <button
              type="button"
              onClick={() => setFiltroColecao("todos")}
              style={
                filtroColecao === "todos"
                  ? criarQuickFilterActiveStyle(temaPagina)
                  : quickFilterButtonStyle
              }
            >
              Todas
            </button>

            <button
              type="button"
              onClick={() => setFiltroColecao("lendo")}
              style={
                filtroColecao === "lendo"
                  ? criarQuickFilterActiveStyle(temaPagina)
                  : quickFilterButtonStyle
              }
            >
              Lendo agora
            </button>

            <button
              type="button"
              onClick={() => setFiltroColecao("favoritas")}
              style={
                filtroColecao === "favoritas"
                  ? criarQuickFilterActiveStyle(temaPagina)
                  : quickFilterButtonStyle
              }
            >
              Favoritas
            </button>

            <button
              type="button"
              onClick={() => setFiltroColecao("concluidas")}
              style={
                filtroColecao === "concluidas"
                  ? criarQuickFilterActiveStyle(temaPagina)
                  : quickFilterButtonStyle
              }
            >
              Concluídas
            </button>

            <button
              type="button"
              onClick={() => setFiltroColecao("sem-leitura")}
              style={
                filtroColecao === "sem-leitura"
                  ? criarQuickFilterActiveStyle(temaPagina)
                  : quickFilterButtonStyle
              }
            >
              Sem leitura
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMostrarFiltrosAvancados((valorAtual) => !valorAtual)}
            style={criarToggleFiltrosStyle(temaPagina)}
          >
            <span>{textoBotaoFiltrosAvancados}</span>
            <span>{mostrarFiltrosAvancados ? "↑" : "↓"}</span>
          </button>

          {mostrarFiltrosAvancados && (
            <div style={isDesktop ? desktopAdvancedFiltersStyle : advancedFiltersStyle}>
            <div style={fieldBoxStyle}>
              <label style={searchLabelStyle}>Formato</label>

              <select
                value={filtroFormato}
                onChange={(event) => setFiltroFormato(event.target.value)}
                style={selectStyle}
              >
                <option value="todos">Todos os formatos</option>

                {formatosDisponiveis.map((formato) => (
                  <option key={formato} value={formato}>
                    {formato}
                  </option>
                ))}
              </select>
            </div>

            <div style={fieldBoxStyle}>
              <label style={searchLabelStyle}>Classificação</label>

              <select
                value={filtroClassificacao}
                onChange={(event) => setFiltroClassificacao(event.target.value)}
                style={selectStyle}
              >
                <option value="todos">Todas</option>

                {classificacoesDisponiveis.map((classificacao) => (
                  <option key={classificacao} value={classificacao}>
                    {classificacao}
                  </option>
                ))}
              </select>
            </div>

            <div style={fieldBoxStyle}>
              <label style={searchLabelStyle}>Status</label>

              <select
                value={filtroStatus}
                onChange={(event) => setFiltroStatus(event.target.value)}
                style={selectStyle}
              >
                <option value="todos">Todos</option>
                <option value="disponivel">Disponível</option>
                <option value="em-breve">Em breve / rascunho</option>
              </select>
            </div>

            <div style={fieldBoxStyle}>
              <label style={searchLabelStyle}>Publicação</label>

              <select
                value={filtroPublicacao}
                onChange={(event) => setFiltroPublicacao(event.target.value)}
                style={selectStyle}
              >
                <option value="todos">Todos</option>
                <option value="publicado">Publicado</option>
                <option value="rascunho">Rascunho</option>
              </select>
            </div>

            <div style={fieldBoxStyle}>
              <label style={searchLabelStyle}>Capa</label>

              <select
                value={filtroCapa}
                onChange={(event) => setFiltroCapa(event.target.value)}
                style={selectStyle}
              >
                <option value="todos">Com ou sem capa</option>
                <option value="com-capa">Com capa</option>
                <option value="sem-capa">Sem capa</option>
              </select>
            </div>

            <div style={fieldBoxStyle}>
              <label style={searchLabelStyle}>Capítulos</label>

              <select
                value={filtroCapitulos}
                onChange={(event) => setFiltroCapitulos(event.target.value)}
                style={selectStyle}
              >
                <option value="todos">Com ou sem capítulos</option>
                <option value="com-capitulos">Com capítulos</option>
                <option value="sem-capitulos">Sem capítulos</option>
              </select>
            </div>

            <div style={fieldBoxStyle}>
              <label style={searchLabelStyle}>Ordenar</label>

              <select
                value={ordenacao}
                onChange={(event) =>
                  setOrdenacao(event.target.value as OrdenacaoExplorar)
                }
                style={selectStyle}
              >
                <option value="relevancia">Relevância</option>
                <option value="mais-curtidas">Mais curtidas</option>
                <option value="mais-salvas">Mais salvas</option>
                <option value="mais-comentadas">Mais comentadas</option>
                <option value="mais-recentes">Mais recentes</option>
                <option value="mais-capitulos">Mais capítulos</option>
              </select>
            </div>
            </div>
          )}

          {filtrosAtivos && (
            <div style={isDesktop ? criarDesktopFilterInfoBoxStyle(temaPagina) : criarFilterInfoBoxStyle(temaPagina)}>
              <div style={{ minWidth: 0 }}>
                <h2 style={filterInfoTitleStyle}>Busca refinada</h2>

                <p style={filterInfoTextStyle}>
                  {totalResultados === 1
                    ? "1 história combina com sua seleção."
                    : `${totalResultados} histórias combinam com sua seleção.`}{" "}
                  Exibindo: {filtroColecaoTexto}.
                </p>
              </div>

              <button
                type="button"
                onClick={limparFiltros}
                style={clearFilterButtonStyle}
              >
                Limpar filtros
              </button>
            </div>
          )}
        </section>

        {obrasLocaisFiltradas.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title={
                categoriaSelecionada
                  ? `Publicações em ${categoriaSelecionada}`
                  : "Publicações recentes"
              }
              subtitle="Obras da comunidade prontas para descobrir e acompanhar."
              tema={temaPagina}
              isDesktop={isDesktop}
            />

            <div style={isDesktop ? desktopPublishedGridStyle : gridStyle}>
              {obrasLocaisFiltradas.map((obra) => (
                <ObraPublicadaCard
                  key={obra.id}
                  obra={obra}
                  favorita={obrasFavoritas.includes(obra.id)}
                  concluida={obrasConcluidas.includes(obra.id)}
                  tema={temaPagina}
                  isDesktop={isDesktop}
                />
              ))}
            </div>
          </section>
        )}

        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <SectionHeader
            title={
              categoriaSelecionada
                ? `Catálogo em ${categoriaSelecionada}`
                : "Catálogo inicial"
            }
            subtitle="Histórias selecionadas para conhecer o universo da plataforma."
            tema={temaPagina}
            isDesktop={isDesktop}
          />

          {obrasFixasFiltradas.length > 0 ? (
            <div style={isDesktop ? desktopGridStyle : gridStyle}>
              {obrasFixasFiltradas.map((obra) => (
                <ObraFixaCard key={obra.titulo} obra={obra} tema={temaPagina} isDesktop={isDesktop} />
              ))}
            </div>
          ) : totalResultados > 0 ? (
            <div style={isDesktop ? desktopEmptyBoxStyle : emptyBoxStyle}>
              Nenhuma obra do catálogo inicial encontrada com esses filtros.
            </div>
          ) : null}
        </section>

        {totalResultados === 0 && (
          <section style={isDesktop ? desktopEmptyBoxStyle : emptyBoxStyle}>
            Nenhuma obra encontrada no Explorar. Tente limpar os filtros ou usar
            outra busca.
          </section>
        )}
      </section>
    </main>
  );
}

function SectionHeader({
  title,
  subtitle,
  tema,
  isDesktop,
}: {
  title: string;
  subtitle: string;
  tema: ReturnType<typeof obterTemaCategoria>;
  isDesktop?: boolean;
}) {
  return (
    <div style={isDesktop ? desktopSectionHeaderStyle : sectionHeaderStyle}>
      <h2 style={isDesktop ? desktopSectionTitleStyle : sectionTitleStyle}>{title}</h2>
      <span style={{ ...(isDesktop ? desktopSmallTextStyle : smallTextStyle), color: isDesktop ? "#B8AEC9" : tema.accent }}>{subtitle}</span>
    </div>
  );
}

function ObraFixaCard({ obra, tema, isDesktop }: { obra: Obra; tema: ReturnType<typeof obterTemaCategoria>; isDesktop?: boolean }) {
  const obraHref = obra.disponivel
    ? obra.link
    : `/em-breve?obra=${encodeURIComponent(obra.titulo)}`;

  const conteudoCard = (
    <>
      <div style={isDesktop ? criarDesktopCoverTemaStyle(tema) : criarCoverTemaStyle(tema)}>
        <span style={genreBadgeStyle}>{obra.genero}</span>
      </div>

      <div style={cardContentStyle}>
        <div style={cardTopStyle}>
          <h3 style={isDesktop ? desktopCardTitleStyle : cardTitleStyle}>{obra.titulo}</h3>

          <div style={statusRowStyle}>
            <span style={statusStyle}>{obra.status}</span>
            <span style={classificationBadgeStyle}>
              {obra.classificacaoIndicativa}
            </span>
            {!obra.disponivel && <span style={soonBadgeStyle}>Em breve</span>}
          </div>
        </div>

        <p style={authorStyle}>por {obra.autor}</p>

        <div style={statsStyle}>
          <span style={safeTextStyle}>👁 {obra.views}</span>
          <span style={safeTextStyle}>♥ {obra.likes}</span>
          <span style={safeTextStyle}>💬 {obra.comentarios}</span>
        </div>

        <span style={criarReadStyle(tema)}>
          {obra.disponivel ? "Ver obra" : "Ver detalhes"}
        </span>
      </div>
    </>
  );

  return (
    <Link
      href={obraHref}
      style={obra.disponivel ? (isDesktop ? criarDesktopCardTemaStyle(tema) : criarCardTemaStyle(tema)) : (isDesktop ? criarDesktopCardSoonTemaStyle(tema) : criarCardSoonTemaStyle(tema))}
      aria-label={`Abrir página da obra ${obra.titulo}`}
    >
      {conteudoCard}
    </Link>
  );
}

function ObraPublicadaCard({
  obra,
  favorita,
  concluida,
  tema,
  isDesktop,
}: {
  obra: ObraLocal;
  favorita: boolean;
  concluida: boolean;
  tema: ReturnType<typeof obterTemaCategoria>;
  isDesktop?: boolean;
}) {
  const totalCurtidas = totalCurtidasObra(obra);
  const totalComentarios = totalComentariosObra(obra);
  const totalLidos = totalLidosObra(obra);
  const progressoLeitura = calcularProgressoLeitura(obra.capitulos);
  const paginaPublicaHref =
    obra.link && obra.link.trim()
      ? obra.link
      : `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
  const perfilAutorHref = `/perfil-autor?autor=${encodeURIComponent(
    obra.autor
  )}`;

  return (
    <article style={isDesktop ? criarDesktopPublishedCardTemaStyle(tema) : criarPublishedCardTemaStyle(tema)}>
      <Link href={paginaPublicaHref} style={isDesktop ? criarDesktopPublishedCoverStyle(obra.capa, tema) : criarPublishedCoverStyle(obra.capa, tema)}>
        <span style={genreBadgeStyle}>{obra.genero}</span>
        {!obra.capa && <span style={noCoverBadgeStyle}>Sem capa</span>}
      </Link>

      <div style={isDesktop ? desktopPublishedInfoStyle : publishedInfoStyle}>
        <div style={cardTopStyle}>
          <h3 style={isDesktop ? desktopPublishedTitleStyle : publishedTitleStyle}>{obra.titulo}</h3>

          <div style={statusRowStyle}>
            {!obra.publicado && <span style={draftStatusStyle}>Rascunho</span>}

            <span style={formatBadgeStyle}>{obra.formato}</span>

            <span style={classificationBadgeStyle}>
              {obra.classificacaoIndicativa}
            </span>

            {obra.arquivoObra && <span style={fileStatusBadgeStyle}>Arquivo</span>}

            {favorita && <span style={favoriteBadgeStyle}>★</span>}

            {concluida && <span style={completedBadgeStyle}>✓</span>}
          </div>
        </div>

        <Link href={perfilAutorHref} style={authorLinkStyle}>
          por {obra.autor}
        </Link>

        {isDesktop && (
          <p style={desktopPublishedSynopsisStyle}>{obra.sinopse}</p>
        )}

        <div style={statsStyle}>
          <span style={safeTextStyle}>📚 {obra.capitulos.length} cap.</span>
          <span style={safeTextStyle}>♥ {totalCurtidas}</span>
          <span style={safeTextStyle}>💬 {totalComentarios}</span>
          {totalLidos > 0 && <span style={safeTextStyle}>{totalLidos} lidos</span>}
        </div>

        {progressoLeitura > 0 && (
          <div style={progressCompactStyle}>
            <div style={criarProgressTrackStyle(tema)}>
              <div
                style={{
                  ...criarProgressBarStyle(tema),
                  width: `${progressoLeitura}%`,
                }}
              />
            </div>

            <span style={progressTextStyle}>{progressoLeitura}%</span>
          </div>
        )}

        <Link href={paginaPublicaHref} style={criarReadStyle(tema)}>
          Ver obra
        </Link>
      </div>
    </article>
  );
}

function criarActiveCategoryStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...activeCategoryStyle,
    background: tema.activeBackground,
    boxShadow: `0 12px 32px ${tema.accent}2E`,
  };
}

function criarQuickFilterActiveStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...quickFilterActiveStyle,
    background: `color-mix(in srgb, ${tema.accent} 26%, rgba(255,255,255,0.06))`,
    border: `1px solid color-mix(in srgb, ${tema.accent} 38%, rgba(255,255,255,0.1))`,
    boxShadow: `0 12px 28px ${tema.accent}24`,
  };
}

function criarSearchBoxStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...searchBoxStyle,
    background: `linear-gradient(135deg, color-mix(in srgb, ${tema.accent} 10%, rgba(255,255,255,0.055)) 0%, rgba(255,255,255,0.045) 100%)`,
    border: `1px solid color-mix(in srgb, ${tema.accent} 26%, rgba(255,255,255,0.08))`,
    boxShadow: `0 18px 46px ${tema.accent}14`,
  };
}

function criarDesktopSearchBoxStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...criarSearchBoxStyle(tema),
    gridTemplateColumns: "1fr",
    alignItems: "stretch",
    gap: "8px",
    marginTop: "12px",
    padding: "10px 12px",
    borderRadius: "22px",
    overflow: "hidden",
    boxShadow: `0 14px 34px ${tema.accent}10, inset 0 1px 0 rgba(255,255,255,0.035)`,
  };
}

function criarFilterInfoBoxStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...filterInfoBoxStyle,
    background: `color-mix(in srgb, ${tema.accent} 14%, rgba(255,255,255,0.05))`,
    border: `1px solid color-mix(in srgb, ${tema.accent} 32%, rgba(255,255,255,0.08))`,
  };
}

function criarDesktopFilterInfoBoxStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...criarFilterInfoBoxStyle(tema),
    gridColumn: "1 / -1",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "center",
    gap: "12px",
    padding: "8px 10px",
  };
}

function criarCardTemaStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...cardStyle,
    border: `1px solid color-mix(in srgb, ${tema.accent} 24%, rgba(255,255,255,0.08))`,
    boxShadow: `0 18px 45px rgba(0,0,0,0.28), 0 0 34px ${tema.accent}12`,
  };
}

function criarCardSoonTemaStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...criarCardTemaStyle(tema),
    opacity: 0.9,
  };
}

function criarDesktopCardTemaStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...desktopCardStyle,
    border: `1px solid color-mix(in srgb, ${tema.accent} 24%, rgba(255,255,255,0.08))`,
    boxShadow: `0 18px 45px rgba(0,0,0,0.28), 0 0 34px ${tema.accent}12`,
  };
}

function criarDesktopCardSoonTemaStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...criarDesktopCardTemaStyle(tema),
    opacity: 0.9,
  };
}

function criarPublishedCardTemaStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...publishedCardStyle,
    border: `1px solid color-mix(in srgb, ${tema.accent} 24%, rgba(139,92,246,0.14))`,
    boxShadow: `0 16px 40px rgba(0,0,0,0.26), 0 0 28px ${tema.accent}10`,
  };
}

function criarDesktopPublishedCardTemaStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...desktopPublishedCardStyle,
    border: `1px solid color-mix(in srgb, ${tema.accent} 22%, rgba(139,92,246,0.14))`,
    boxShadow: `0 16px 38px rgba(0,0,0,0.24), 0 0 24px ${tema.accent}0E`,
  };
}

function criarCoverTemaStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...coverStyle,
    backgroundImage: `radial-gradient(circle at top left, color-mix(in srgb, ${tema.accent} 34%, transparent), transparent 34%), radial-gradient(circle at bottom right, rgba(124,58,237,0.58), transparent 36%), linear-gradient(135deg, #18181B 0%, #0F0F0F 100%)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarDesktopCoverTemaStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...desktopCoverStyle,
    backgroundImage: `radial-gradient(circle at top left, color-mix(in srgb, ${tema.accent} 34%, transparent), transparent 34%), radial-gradient(circle at bottom right, rgba(124,58,237,0.58), transparent 36%), linear-gradient(135deg, #18181B 0%, #0F0F0F 100%)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarPublishedCoverTemaStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...publishedCoverStyle,
    backgroundImage: `radial-gradient(circle at top left, color-mix(in srgb, ${tema.accent} 28%, transparent), transparent 34%), radial-gradient(circle at bottom right, rgba(124,58,237,0.62), transparent 38%), linear-gradient(135deg, #18181B 0%, #0F0F0F 100%)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarDesktopPublishedCoverStyle(
  capa: string,
  tema: ReturnType<typeof obterTemaCategoria>
): CSSProperties {
  const baseStyle = criarDesktopPublishedCoverTemaStyle(tema);

  if (!capa) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    backgroundImage: `linear-gradient(180deg, rgba(15, 8, 32, 0.04) 0%, rgba(15, 8, 32, 0.82) 100%), url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarDesktopPublishedCoverTemaStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...desktopPublishedCoverStyle,
    backgroundImage: `radial-gradient(circle at top left, color-mix(in srgb, ${tema.accent} 28%, transparent), transparent 34%), radial-gradient(circle at bottom right, rgba(124,58,237,0.62), transparent 38%), linear-gradient(135deg, #18181B 0%, #0F0F0F 100%)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarProgressTrackStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...progressTrackStyle,
    border: `1px solid color-mix(in srgb, ${tema.accent} 22%, rgba(255,255,255,0.1))`,
  };
}

function criarProgressBarStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...progressBarStyle,
    background: `linear-gradient(135deg, ${tema.accent} 0%, #7C3AED 100%)`,
  };
}

function criarReadStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...readStyle,
    color: "#FFFFFF",
    background: `linear-gradient(135deg, ${tema.accent} 0%, #7C3AED 100%)`,
    border: `1px solid color-mix(in srgb, ${tema.accent} 44%, rgba(255,255,255,0.16))`,
    boxShadow: `0 12px 28px ${tema.accent}24`,
  };
}

function criarToggleFiltrosStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    minHeight: "34px",
    borderRadius: "999px",
    border: `1px solid color-mix(in srgb, ${tema.accent} 22%, rgba(255,255,255,0.08))`,
    background: `linear-gradient(135deg, color-mix(in srgb, ${tema.accent} 8%, rgba(255,255,255,0.045)) 0%, rgba(255,255,255,0.032) 100%)`,
    color: "#FFFFFF",
    fontSize: "11px",
    fontWeight: 900,
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "center",
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    boxShadow: `0 8px 18px ${tema.accent}0F`,
    ...safeTextStyle,
  };
}

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background:
    "radial-gradient(circle at 12% 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 34%, transparent), transparent 30%), radial-gradient(circle at 88% 14%, color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent), transparent 24%), radial-gradient(circle at 50% 105%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent), transparent 32%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 36%, #170A28 62%, var(--historietas-bg-end, #17101B) 100%)",
  color: "#FFFFFF",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  width: "min(900px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "22px 0 82px",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "18px",
  padding: "2px 0",
  minWidth: 0,
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
  maxWidth: "calc(100% - 118px)",
  overflow: "hidden",
  ...safeTextStyle,
};

const logoMarkStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  boxShadow:
    "0 0 22px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent), inset 0 1px 0 rgba(255,255,255,0.22)",
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #DDD6FE 40%, var(--historietas-accent, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow:
    "0 0 28px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, transparent)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const backButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "40px",
  padding: "0 15px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.055) 100%)",
  border: "1px solid rgba(255,255,255,0.13)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  textAlign: "center",
  boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
  ...safeTextStyle,
};

const libraryButtonTopStyle: CSSProperties = {
  ...backButtonStyle,
  background: "rgba(124,58,237,0.18)",
  border: "1px solid rgba(139,92,246,0.28)",
  color: "#DDD6FE",
};

const soonTopButtonStyle: CSSProperties = {
  ...backButtonStyle,
  minHeight: "38px",
  padding: "0 13px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, transparent) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 38%, rgba(255,255,255,0.08))",
  color: "var(--historietas-accent, #FDBA74)",
  boxShadow: "none",
};

const heroStyle: CSSProperties = {
  position: "relative",
  borderRadius: "30px",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, rgba(255,255,255,0.08))",
  background:
    "radial-gradient(circle at 18% 0%, rgba(124,58,237,0.42), transparent 32%), radial-gradient(circle at 90% 45%, rgba(249,115,22,0.12), transparent 28%), linear-gradient(135deg, rgba(26,13,43,0.98) 0%, rgba(12,7,23,0.98) 100%)",
  padding: "22px",
  boxShadow:
    "0 26px 70px rgba(0,0,0,0.36), 0 0 46px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, transparent), inset 0 1px 0 rgba(255,255,255,0.08)",
  minWidth: 0,
  overflow: "hidden",
};

const badgeStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "fit-content",
  maxWidth: "100%",
  padding: "8px 12px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 18%, rgba(255,255,255,0.04)) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, rgba(255,255,255,0.04)) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 34%, rgba(255,255,255,0.08))",
  color: "#FDEDD3",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.10em",
  boxShadow:
    "0 0 24px color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent)",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const desktopBadgeStyle: CSSProperties = {
  ...badgeStyle,
  padding: "9px 13px",
  fontSize: "11px",
};

const heroDecorationLayerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 0,
};

const titleStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: "10px 0 0",
  fontSize: "clamp(38px, 11vw, 66px)",
  lineHeight: 0.92,
  fontWeight: 950,
  letterSpacing: "-0.085em",
  maxWidth: "100%",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 44%, var(--historietas-accent, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "0 18px 42px rgba(0,0,0,0.22)",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: "12px 0 0",
  color: "#E4E4E7",
  fontSize: "14px",
  lineHeight: 1.62,
  fontWeight: 650,
  maxWidth: "640px",
  ...safeTextStyle,
};

const categoriesStyle: CSSProperties = {
  display: "flex",
  gap: "9px",
  overflowX: "auto",
  padding: "18px 0 6px",
  maxWidth: "100%",
  scrollbarWidth: "none",
};

const categoryStyle: CSSProperties = {
  flex: "0 0 auto",
  maxWidth: "220px",
  padding: "10px 14px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.082) 0%, rgba(255,255,255,0.042) 100%)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#D4D4D8",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxShadow: "0 10px 24px rgba(0,0,0,0.16)",
  ...safeTextStyle,
};

const activeCategoryStyle: CSSProperties = {
  ...categoryStyle,
  background: "linear-gradient(135deg, #7C3AED 0%, #F97316 100%)",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "#FFFFFF",
  boxShadow: "0 12px 32px rgba(124, 58, 237, 0.22)",
};

const compactSummaryStyle: CSSProperties = {
  margin: "12px 0 0",
  padding: "10px 12px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.075)",
  color: "#C9C2D8",
  fontSize: "12px",
  fontWeight: 760,
  lineHeight: 1.55,
  boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
  ...safeTextStyle,
};

const searchBoxStyle: CSSProperties = {
  marginTop: "14px",
  display: "grid",
  gap: "10px",
  padding: "12px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.062) 0%, rgba(255,255,255,0.034) 100%)",
  border: "1px solid rgba(255,255,255,0.09)",
  boxShadow: "0 16px 42px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.045)",
  minWidth: 0,
  overflow: "hidden",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const searchLabelStyle: CSSProperties = {
  color: "#D4D4D8",
  fontSize: "11px",
  fontWeight: 870,
  ...safeTextStyle,
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  height: "46px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.11)",
  background: "rgba(8,5,18,0.62)",
  color: "#FFFFFF",
  padding: "0 16px",
  outline: "none",
  fontSize: "14px",
  fontWeight: 720,
  boxSizing: "border-box",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.045)",
  minWidth: 0,
};

const desktopSearchInputStyle: CSSProperties = {
  ...searchInputStyle,
  height: "40px",
  fontSize: "13px",
  padding: "0 14px",
};

const quickFiltersStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  overflowX: "auto",
  paddingBottom: "2px",
  maxWidth: "100%",
  scrollbarWidth: "none",
};

const quickFilterButtonStyle: CSSProperties = {
  flex: "0 0 auto",
  maxWidth: "210px",
  minHeight: "32px",
  padding: "0 11px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.038)",
  color: "#D4D4D8",
  fontSize: "10.5px",
  fontWeight: 880,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxShadow: "0 7px 16px rgba(0,0,0,0.09)",
  ...safeTextStyle,
};

const quickFilterActiveStyle: CSSProperties = {
  ...quickFilterButtonStyle,
  background: "rgba(124,58,237,0.28)",
  border: "1px solid rgba(139,92,246,0.34)",
  color: "#FFFFFF",
  boxShadow: "0 12px 28px rgba(124,58,237,0.18)",
};

const advancedFiltersStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "10px",
  minWidth: 0,
  paddingTop: "2px",
};

const fieldBoxStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
  padding: "8px",
  borderRadius: "15px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const selectStyle: CSSProperties = {
  width: "100%",
  height: "40px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.11)",
  background: "#120B1F",
  color: "#FFFFFF",
  padding: "0 12px",
  outline: "none",
  fontSize: "11.5px",
  fontWeight: 820,
  boxSizing: "border-box",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const filterInfoBoxStyle: CSSProperties = {
  marginTop: "0",
  padding: "9px 10px",
  borderRadius: "15px",
  background: "rgba(124, 58, 237, 0.07)",
  border: "1px solid rgba(139, 92, 246, 0.14)",
  display: "grid",
  gap: "7px",
  minWidth: 0,
  overflow: "hidden",
};

const filterInfoTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 930,
  letterSpacing: "-0.02em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const filterInfoTextStyle: CSSProperties = {
  margin: "2px 0 0",
  color: "#BFB7CF",
  fontSize: "11.5px",
  lineHeight: 1.42,
  fontWeight: 620,
  maxWidth: "100%",
  ...safeTextStyle,
};

const clearFilterButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.055)",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 12px",
  ...safeTextStyle,
};

const sectionStyle: CSSProperties = {
  marginTop: "30px",
  minWidth: 0,
};

const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  marginBottom: "15px",
  minWidth: 0,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(28px, 7vw, 38px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.065em",
  maxWidth: "100%",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 54%, var(--historietas-accent, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  ...safeTextStyle,
};

const smallTextStyle: CSSProperties = {
  color: "#F97316",
  fontSize: "12px",
  fontWeight: 760,
  lineHeight: 1.45,
  maxWidth: "100%",
  ...safeTextStyle,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "14px",
  minWidth: 0,
};

const publishedCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "96px minmax(0, 1fr)",
  gap: "14px",
  alignItems: "stretch",
  padding: "12px",
  borderRadius: "24px",
  background:
    "radial-gradient(circle at 96% 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 8%, transparent), transparent 30%), linear-gradient(135deg, rgba(31,21,49,0.95) 0%, rgba(16,10,28,0.985) 100%)",
  border: "1px solid rgba(139, 92, 246, 0.16)",
  color: "#FFFFFF",
  textDecoration: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxShadow:
    "0 16px 42px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.04)",
  boxSizing: "border-box",
};

const cardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "96px minmax(0, 1fr)",
  gap: "14px",
  alignItems: "stretch",
  padding: "12px",
  borderRadius: "24px",
  background:
    "radial-gradient(circle at 96% 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 10%, transparent), transparent 32%), linear-gradient(135deg, rgba(35,24,54,0.94) 0%, rgba(18,12,30,0.98) 100%)",
  border: "1px solid rgba(255,255,255,0.09)",
  color: "#FFFFFF",
  textDecoration: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxShadow:
    "0 20px 52px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.045)",
  boxSizing: "border-box",
};

const cardSoonStyle: CSSProperties = {
  ...cardStyle,
  opacity: 0.9,
};

const publishedCoverStyle: CSSProperties = {
  minHeight: "132px",
  borderRadius: "18px",
  position: "relative",
  overflow: "hidden",
  backgroundImage:
    "radial-gradient(circle at 24% 16%, rgba(249,115,22,0.24), transparent 34%), radial-gradient(circle at 84% 82%, rgba(124,58,237,0.72), transparent 40%), linear-gradient(135deg, #1D142C 0%, #0B0712 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  minWidth: 0,
  textDecoration: "none",
  display: "block",
  boxShadow: "inset 0 -42px 60px rgba(0,0,0,0.54), 0 14px 34px rgba(0,0,0,0.22)",
};

const coverStyle: CSSProperties = {
  minHeight: "132px",
  borderRadius: "18px",
  position: "relative",
  overflow: "hidden",
  backgroundImage:
    "radial-gradient(circle at 24% 16%, rgba(249,115,22,0.22), transparent 34%), radial-gradient(circle at 84% 82%, rgba(124,58,237,0.70), transparent 40%), linear-gradient(135deg, #1D142C 0%, #0B0712 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  minWidth: 0,
  boxShadow: "inset 0 -42px 60px rgba(0,0,0,0.54), 0 14px 34px rgba(0,0,0,0.22)",
};

const genreBadgeStyle: CSSProperties = {
  position: "absolute",
  left: "8px",
  right: "8px",
  bottom: "8px",
  maxWidth: "calc(100% - 16px)",
  padding: "7px 8px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 92%, rgba(0,0,0,0.18)), color-mix(in srgb, var(--historietas-accent, #F97316) 26%, rgba(0,0,0,0.18)))",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#FFFFFF",
  fontSize: "9px",
  fontWeight: 900,
  textAlign: "center",
  whiteSpace: "normal",
  boxShadow: "0 10px 22px rgba(0,0,0,0.22)",
  ...safeTextStyle,
};

const noCoverBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "8px",
  right: "8px",
  transform: "translateY(-50%)",
  maxWidth: "calc(100% - 16px)",
  padding: "6px 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#D4D4D8",
  fontSize: "9px",
  fontWeight: 900,
  textAlign: "center",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const cardContentStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  display: "grid",
  alignContent: "center",
  gap: "8px",
};

const cardTopStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "23px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const publishedTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "23px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
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
  gap: "5px",
  minWidth: 0,
};

const statusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(249, 115, 22, 0.14)",
  border: "1px solid rgba(249, 115, 22, 0.28)",
  color: "#FDBA74",
  fontSize: "9px",
  fontWeight: 850,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const soonBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(113, 113, 122, 0.18)",
  border: "1px solid rgba(161, 161, 170, 0.22)",
  color: "#D4D4D8",
  fontSize: "9px",
  fontWeight: 880,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const publishedStatusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(34, 197, 94, 0.22)",
  color: "#86EFAC",
  fontSize: "9px",
  fontWeight: 880,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const draftStatusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#D4D4D8",
  fontSize: "9px",
  fontWeight: 880,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const formatBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#E4E4E7",
  fontSize: "9px",
  fontWeight: 880,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const classificationBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(124, 58, 237, 0.16)",
  border: "1px solid rgba(139, 92, 246, 0.3)",
  color: "#DDD6FE",
  fontSize: "9px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const fileStatusBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(34, 197, 94, 0.24)",
  color: "#86EFAC",
  fontSize: "9px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const favoriteBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(249, 115, 22, 0.12)",
  border: "1px solid rgba(249, 115, 22, 0.24)",
  color: "#FDBA74",
  fontSize: "9px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const completedBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(34, 197, 94, 0.22)",
  color: "#86EFAC",
  fontSize: "9px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const authorStyle: CSSProperties = {
  margin: 0,
  color: "#B3B3B3",
  fontSize: "13px",
  fontWeight: 700,
  maxWidth: "100%",
  ...safeTextStyle,
};

const authorLinkStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  margin: 0,
  color: "#FDBA74",
  fontSize: "12px",
  fontWeight: 820,
  textDecoration: "none",
  borderBottom: "1px solid rgba(249, 115, 22, 0.18)",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const publishedInfoStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  display: "grid",
  alignContent: "center",
  gap: "8px",
};

const desktopPublishedInfoStyle: CSSProperties = {
  ...publishedInfoStyle,
  alignContent: "space-between",
  alignItems: "start",
  gap: "7px",
};

const desktopPublishedSynopsisStyle: CSSProperties = {
  margin: 0,
  color: "#BFB7CF",
  fontSize: "11.5px",
  lineHeight: 1.42,
  fontWeight: 620,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  maxWidth: "100%",
  ...safeTextStyle,
};

const statsStyle: CSSProperties = {
  display: "flex",
  gap: "7px",
  flexWrap: "wrap",
  color: "#AFA8BE",
  fontSize: "10.5px",
  fontWeight: 730,
  minWidth: 0,
};

const progressCompactStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
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
  background: "linear-gradient(135deg, #F97316 0%, #7C3AED 100%)",
};

const progressTextStyle: CSSProperties = {
  color: "#D4D4D8",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

const readStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  marginTop: "2px",
  padding: "9px 15px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  textDecoration: "none",
  boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  ...safeTextStyle,
};

const soonReadStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  marginTop: "2px",
  color: "#FDBA74",
  fontSize: "14px",
  fontWeight: 950,
  textDecoration: "none",
  ...safeTextStyle,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1220px, calc(100% - 64px))",
  padding: "26px 0 90px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "16px",
};

const desktopTopActionsStyle: CSSProperties = {
  ...topActionsStyle,
  gap: "10px",
};

const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  padding: "22px 28px",
  borderRadius: "32px",
  minHeight: "156px",
  display: "grid",
  alignContent: "center",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  marginTop: "12px",
  fontSize: "clamp(48px, 5vw, 76px)",
  lineHeight: 0.92,
  maxWidth: "760px",
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  margin: "10px 0 0",
  fontSize: "15px",
  lineHeight: 1.62,
  maxWidth: "680px",
};

const desktopCategoriesStyle: CSSProperties = {
  ...categoriesStyle,
  flexWrap: "wrap",
  overflowX: "visible",
  padding: "18px 0 8px",
};

const desktopCompactSummaryStyle: CSSProperties = {
  ...compactSummaryStyle,
  margin: "10px 0 0",
  padding: "8px 11px",
  fontSize: "12px",
  width: "fit-content",
  maxWidth: "100%",
  opacity: 0.86,
};

const desktopQuickFiltersStyle: CSSProperties = {
  ...quickFiltersStyle,
  flexWrap: "wrap",
  overflowX: "visible",
  paddingBottom: 0,
  gap: "8px",
  minWidth: 0,
  scrollbarWidth: "none",
};

const desktopAdvancedFiltersStyle: CSSProperties = {
  ...advancedFiltersStyle,
  gridColumn: "1 / -1",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "9px",
};

const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  marginTop: "30px",
};

const desktopSectionHeaderStyle: CSSProperties = {
  ...sectionHeaderStyle,
  gridTemplateColumns: "minmax(0, 1fr)",
  alignItems: "start",
  gap: "6px",
  marginBottom: "12px",
};

const desktopSectionTitleStyle: CSSProperties = {
  ...sectionTitleStyle,
  fontSize: "34px",
};

const desktopSmallTextStyle: CSSProperties = {
  ...smallTextStyle,
  maxWidth: "560px",
  color: "#B8AEC9",
  fontSize: "11.5px",
  fontWeight: 650,
  textAlign: "left",
  opacity: 0.86,
};

const desktopGridStyle: CSSProperties = {
  ...gridStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  justifyContent: "stretch",
  alignItems: "stretch",
  gap: "18px",
};

const desktopPublishedGridStyle: CSSProperties = {
  ...gridStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  justifyContent: "stretch",
  alignItems: "stretch",
  gap: "16px",
};

const desktopPublishedCardStyle: CSSProperties = {
  ...publishedCardStyle,
  gridTemplateColumns: "128px minmax(0, 1fr)",
  gap: "14px",
  padding: "12px",
  borderRadius: "26px",
  alignItems: "stretch",
  minHeight: "176px",
};

const desktopCardStyle: CSSProperties = {
  ...cardStyle,
  gridTemplateColumns: "118px minmax(0, 1fr)",
  gap: "16px",
  padding: "14px",
  borderRadius: "26px",
  minHeight: "178px",
};

const desktopPublishedCoverStyle: CSSProperties = {
  ...publishedCoverStyle,
  minHeight: "154px",
  borderRadius: "20px",
};

const desktopCoverStyle: CSSProperties = {
  ...coverStyle,
  minHeight: "152px",
  borderRadius: "20px",
};

const desktopCardTitleStyle: CSSProperties = {
  ...cardTitleStyle,
  fontSize: "22px",
};

const desktopPublishedTitleStyle: CSSProperties = {
  ...publishedTitleStyle,
  fontSize: "21px",
  lineHeight: 1.02,
  letterSpacing: "-0.045em",
};

const emptyBoxStyle: CSSProperties = {
  padding: "28px",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.04) 100%)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#D4D4D8",
  fontWeight: 850,
  boxShadow: "0 18px 42px rgba(0,0,0,0.20)",
  minWidth: 0,
  overflow: "hidden",
  ...safeTextStyle,
};


const desktopEmptyBoxStyle: CSSProperties = {
  ...emptyBoxStyle,
  padding: "34px",
};
