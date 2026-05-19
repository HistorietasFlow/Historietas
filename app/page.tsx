"use client";

import Link from "next/link";
import { Children, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { obras } from "./data/obras";
import type { Obra } from "./data/obras";
import { supabase } from "../lib/supabase/client";

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
  arquivoObra?: unknown;
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

type PerfilAutorSalvo = {
  avatar: string;
  avatarNome: string;
  bio: string;
};

type PerfisAutoresSalvos = Record<string, PerfilAutorSalvo>;

type AutorHome = {
  chave: string;
  nome: string;
  avatar: string;
  bio: string;
  totalObras: number;
  totalCapitulos: number;
  totalCurtidas: number;
  totalComentarios: number;
  generos: string[];
  href: string;
};

const STORAGE_KEY = "historietas-obras";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const NOTIFICATIONS_STORAGE_KEY = "historietas-notificacoes";
const AUTHOR_PROFILE_STORAGE_KEY = "historietas-perfis-autores";

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

function criarHrefObraCatalogoHome(obra: Obra) {
  if (!obra.disponivel) {
    return `/em-breve?obra=${encodeURIComponent(obra.titulo)}`;
  }

  const obraComLink = obra as Obra & { link?: string; slug?: string };
  const linkObra = obraComLink.link?.trim();

  if (linkObra) {
    return linkObra;
  }

  const slugObra = obraComLink.slug?.trim() || criarSlugBase(obra.titulo);

  return `/obra/${slugObra}`;
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

function obraLocalCombinaBusca(obra: ObraLocal, termoBusca: string) {
  if (!termoBusca) {
    return true;
  }

  const textoObra = normalizarTexto(
    [
      obra.titulo,
      obra.autor,
      obra.genero,
      obra.formato,
      obra.classificacaoIndicativa,
      obra.sinopse,
      obra.tags.join(" "),
      obra.capaNome,
      obra.capitulos.map((capitulo) => capitulo.titulo).join(" "),
    ].join(" ")
  );

  return textoObra.includes(termoBusca);
}

function obterTempoUltimaLeitura(obra: ObraLocal) {
  const capituloParaContinuar = encontrarCapituloParaContinuar(obra);
  const dataReferencia =
    obra.ultimaLeituraEm ||
    capituloParaContinuar?.lidoEm ||
    capituloParaContinuar?.criadoEm ||
    obra.criadaEm;

  const tempo = new Date(dataReferencia).getTime();

  return Number.isNaN(tempo) ? 0 : tempo;
}

function contarNotificacoesNaoLidas() {
  try {
    const notificacoesTexto = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const notificacoesJson = notificacoesTexto
      ? JSON.parse(notificacoesTexto)
      : [];

    if (!Array.isArray(notificacoesJson)) {
      return 0;
    }

    return notificacoesJson.filter((notificacao) => {
      return notificacao && typeof notificacao === "object" && !notificacao.lida;
    }).length;
  } catch {
    return 0;
  }
}

function criarCoverStyle(capa: string): CSSProperties {
  if (!capa) {
    return coverPlaceholderStyle;
  }

  return {
    ...coverPlaceholderStyle,
    backgroundImage: `linear-gradient(180deg, rgba(15, 8, 32, 0.04) 0%, rgba(15, 8, 32, 0.82) 100%), url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function obterImagemObraCatalogo(obra: Obra) {
  const obraComImagem = obra as Obra & {
    capa?: string;
    capaUrl?: string;
    cover?: string;
    imagem?: string;
  };

  return (
    [
      obraComImagem.capa,
      obraComImagem.capaUrl,
      obraComImagem.cover,
      obraComImagem.imagem,
    ].find((imagem): imagem is string => {
      return typeof imagem === "string" && Boolean(imagem.trim());
    }) || ""
  );
}

function criarHeroPosterStyle(obra: Obra): CSSProperties {
  const imagemObra = obterImagemObraCatalogo(obra);

  if (imagemObra) {
    return {
      ...desktopHeroPosterStyle,
      backgroundImage: `linear-gradient(180deg, rgba(8, 5, 18, 0.10) 0%, rgba(8, 5, 18, 0.86) 100%), url(${imagemObra})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  return {
    ...desktopHeroPosterStyle,
    backgroundImage:
      "radial-gradient(circle at 28% 18%, color-mix(in srgb, var(--historietas-accent, #F97316) 36%, transparent), transparent 30%), radial-gradient(circle at 74% 76%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 58%, transparent), transparent 38%), linear-gradient(145deg, rgba(17, 10, 34, 0.98) 0%, rgba(7, 6, 16, 0.99) 100%)",
  };
}

function criarHeroBackground(obra: Obra): CSSProperties {
  return {
    ...heroStyle,
    backgroundImage: `linear-gradient(90deg, rgba(8, 5, 18, 0.96) 0%, rgba(8, 5, 18, 0.82) 46%, rgba(8, 5, 18, 0.52) 100%), radial-gradient(circle at 82% 26%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)), transparent 24%), radial-gradient(circle at 20% 20%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 48%, transparent)), transparent 34%), radial-gradient(circle at 64% 96%, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent), transparent 24%), linear-gradient(135deg, var(--historietas-bg-mid, #160A2A) 0%, #090711 58%, var(--historietas-bg-end, #17101B) 100%)`,
    backgroundSize: "cover",
    backgroundPosition: obra.disponivel ? "center" : "center top",
  };
}

function criarDecoracaoHomeStyle(index: number): CSSProperties {
  const posicoes: CSSProperties[] = [
    { top: "7%", right: "8%", fontSize: "48px", transform: "rotate(-12deg)" },
    { top: "34%", right: "15%", fontSize: "26px", transform: "rotate(14deg)" },
    { bottom: "13%", right: "8%", fontSize: "36px", transform: "rotate(8deg)" },
    { top: "18%", left: "8%", fontSize: "24px", transform: "rotate(12deg)" },
  ];

  return {
    position: "absolute",
    color: "var(--historietas-accent, #FDBA74)",
    opacity: 0.08,
    lineHeight: 1,
    fontWeight: 950,
    filter: "drop-shadow(0 0 20px color-mix(in srgb, var(--historietas-accent, #F97316) 26%, transparent))",
    userSelect: "none",
    ...posicoes[index % posicoes.length],
  };
}


function contarCurtidasObraLocal(obra: ObraLocal) {
  return obra.capitulos.filter((capitulo) => capitulo.curtiu).length;
}

function contarComentariosObraLocal(obra: ObraLocal) {
  return obra.capitulos.filter((capitulo) => capitulo.comentario.trim()).length;
}

function obterTempoUltimoCapitulo(obra: ObraLocal) {
  const ultimoCapitulo = obra.capitulos[obra.capitulos.length - 1] || null;
  const dataReferencia = ultimoCapitulo?.criadoEm || obra.criadaEm;
  const tempo = new Date(dataReferencia).getTime();

  return Number.isNaN(tempo) ? 0 : tempo;
}

function obraTemArquivoAnexado(obra: ObraLocal) {
  const arquivo = obra.arquivoObra;

  if (!arquivo || typeof arquivo !== "object" || Array.isArray(arquivo)) {
    return false;
  }

  const arquivoValidado = arquivo as Record<string, unknown>;

  return Boolean(
    typeof arquivoValidado.nome === "string" &&
      arquivoValidado.nome.trim() &&
      typeof arquivoValidado.conteudo === "string" &&
      arquivoValidado.conteudo.trim()
  );
}

function obraCatalogoCombinaTemas(obra: Obra, temas: string[]) {
  const textoObra = normalizarTexto(
    [obra.titulo, obra.autor, obra.genero, obra.status].join(" ")
  );

  return temas.some((tema) => textoObra.includes(normalizarTexto(tema)));
}

function normalizarChaveAutor(nome: string) {
  return normalizarTexto(nome).replace(/\s+/g, " ").trim();
}

function criarIniciaisAutor(nome: string) {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) {
    return "H";
  }

  return partes
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

function normalizarPerfilAutorSalvo(valor: unknown): PerfilAutorSalvo | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return null;
  }

  const perfil = valor as Record<string, unknown>;

  return {
    avatar: typeof perfil.avatar === "string" ? perfil.avatar : "",
    avatarNome: typeof perfil.avatarNome === "string" ? perfil.avatarNome : "",
    bio: typeof perfil.bio === "string" ? perfil.bio : "",
  };
}

function normalizarPerfisAutoresSalvos(valor: unknown): PerfisAutoresSalvos {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return {};
  }

  const perfis = valor as Record<string, unknown>;

  return Object.entries(perfis).reduce<PerfisAutoresSalvos>(
    (perfisNormalizados, [chave, perfil]) => {
      const perfilNormalizado = normalizarPerfilAutorSalvo(perfil);

      if (perfilNormalizado) {
        perfisNormalizados[chave] = perfilNormalizado;
      }

      return perfisNormalizados;
    },
    {}
  );
}

function encontrarPerfilAutor(
  perfisAutores: PerfisAutoresSalvos,
  nomeAutor: string
) {
  const chaveNormalizada = normalizarChaveAutor(nomeAutor);
  const chaveSimples = nomeAutor.trim().replace(/\s+/g, " ").toLowerCase();

  return (
    perfisAutores[chaveNormalizada] ||
    perfisAutores[chaveSimples] ||
    perfisAutores[nomeAutor] ||
    Object.entries(perfisAutores).find(([chave]) => {
      return normalizarChaveAutor(chave) === chaveNormalizada;
    })?.[1] ||
    null
  );
}

function criarBioAutorPadrao(nomeAutor: string, generos: string[]) {
  const generoPrincipal = generos[0] || "histórias";

  return `Autor de ${generoPrincipal.toLowerCase()} na Historietas.`;
}

function criarAutorHome(
  nomeAutor: string,
  generos: string[],
  totalObras: number,
  totalCapitulos: number,
  totalCurtidas: number,
  totalComentarios: number,
  perfisAutores: PerfisAutoresSalvos
): AutorHome {
  const perfil = encontrarPerfilAutor(perfisAutores, nomeAutor);
  const generosUnicos = Array.from(
    new Set(generos.filter((genero) => Boolean(genero.trim())).map((genero) => genero.trim()))
  );
  const bioPerfil = perfil?.bio.trim() || "";

  return {
    chave: normalizarChaveAutor(nomeAutor),
    nome: nomeAutor.trim() || "Autor não informado",
    avatar: perfil?.avatar.trim() || "",
    bio: bioPerfil || criarBioAutorPadrao(nomeAutor, generosUnicos),
    totalObras,
    totalCapitulos,
    totalCurtidas,
    totalComentarios,
    generos: generosUnicos.slice(0, 2),
    href: `/perfil-autor?autor=${encodeURIComponent(nomeAutor)}`,
  };
}


function normalizarCapituloHome(
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

function normalizarObraHome(
  obra: Partial<ObraLocal> & Record<string, unknown>,
  index: number
): ObraLocal {
  const capitulosNormalizados: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapituloHome(
          capitulo as Partial<CapituloLocal>,
          capituloIndex
        )
      )
    : [];

  const titulo =
    typeof obra.titulo === "string" && obra.titulo.trim()
      ? obra.titulo.trim()
      : "Obra sem título";

  const slug =
    typeof obra.slug === "string" && obra.slug.trim()
      ? obra.slug.trim()
      : criarSlugBase(titulo || `obra-${index + 1}`);

  const tagsNormalizadas = Array.isArray(obra.tags)
    ? obra.tags
        .filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
        .map((tag) => tag.trim())
    : [];

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
    arquivoObra: obra.arquivoObra,
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
        ? obra.link.trim()
        : `/obra/${slug}`,
  };
}

function normalizarObrasHomeSalvas(valor: unknown) {
  return Array.isArray(valor)
    ? valor.map((obra, index) =>
        normalizarObraHome(
          obra as Partial<ObraLocal> & Record<string, unknown>,
          index
        )
      )
    : [];
}

function normalizarCategoriaArquivoHome(categoria: string | null) {
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

function criarArquivoObraSupabaseHome(
  obra: SupabaseObraRow,
  obraLocal: ObraLocal | undefined
) {
  const arquivoUrl = obra.arquivo_url?.trim() || "";

  if (!arquivoUrl) {
    return obraLocal?.arquivoObra || null;
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
    nome:
      obra.arquivo_nome?.trim() ||
      "Arquivo da obra",
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

function normalizarObraSupabaseHome(
  obra: SupabaseObraRow,
  capitulosSupabase: SupabaseCapituloRow[],
  obraLocal: ObraLocal | undefined,
  index: number
): ObraLocal {
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
        capituloLocal?.titulo ||
        `Capítulo ${capituloIndex + 1}`,
      texto: capitulo.texto || capituloLocal?.texto || "",
      curtiu: Boolean(capituloLocal?.curtiu),
      salvo: Boolean(capituloLocal?.salvo),
      comentario: capituloLocal?.comentario || "",
      criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
      lido: Boolean(capituloLocal?.lido),
      lidoEm: capituloLocal?.lidoEm || "",
    } satisfies CapituloLocal;
  });

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
    arquivoObra: criarArquivoObraSupabaseHome(obra, obraLocal),
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

async function carregarObrasSupabaseHome(obrasLocais: ObraLocal[]) {
  try {
    const { data: obrasBanco, error: erroObras } = await supabase
      .from("obras")
      .select("*")
      .eq("publicado", true)
      .order("criada_em", { ascending: false });

    if (erroObras) {
      console.warn(
        "Não consegui carregar obras da Home no Supabase:",
        erroObras.message
      );
      return obrasLocais;
    }

    const obrasSupabase = (obrasBanco || []) as SupabaseObraRow[];

    if (obrasSupabase.length === 0) {
      return obrasLocais;
    }

    const obrasIds = obrasSupabase
      .map((obra) => obra.id)
      .filter((id): id is string => typeof id === "string" && Boolean(id.trim()));

    const capitulosPorObraId = new Map<string, SupabaseCapituloRow[]>();

    if (obrasIds.length > 0) {
      const { data: capitulosBanco, error: erroCapitulos } = await supabase
        .from("capitulos")
        .select("*")
        .in("obra_id", obrasIds)
        .order("ordem", { ascending: true });

      if (erroCapitulos) {
        console.warn(
          "Não consegui carregar capítulos da Home no Supabase:",
          erroCapitulos.message
        );
      } else {
        ((capitulosBanco || []) as SupabaseCapituloRow[]).forEach((capitulo) => {
          const capitulosDaObra = capitulosPorObraId.get(capitulo.obra_id) || [];
          capitulosDaObra.push(capitulo);
          capitulosPorObraId.set(capitulo.obra_id, capitulosDaObra);
        });
      }
    }

    const obrasRemotas = obrasSupabase.map((obra, index) => {
      const obraLocal = obrasLocais.find((obraLocalAtual) => {
        const slugLocal = obraLocalAtual.slug || criarSlugBase(obraLocalAtual.titulo);
        const slugBanco = obra.slug?.trim() || "";

        return obraLocalAtual.id === obra.id || (slugBanco && slugLocal === slugBanco);
      });

      return normalizarObraSupabaseHome(
        obra,
        capitulosPorObraId.get(obra.id) || [],
        obraLocal,
        index
      );
    });

    const idsRemotos = new Set(obrasRemotas.map((obra) => obra.id));
    const slugsRemotos = new Set(
      obrasRemotas.map((obra) => obra.slug || criarSlugBase(obra.titulo))
    );

    const obrasApenasLocais = obrasLocais.filter((obraLocalAtual) => {
      const slugLocal = obraLocalAtual.slug || criarSlugBase(obraLocalAtual.titulo);

      return !idsRemotos.has(obraLocalAtual.id) && !slugsRemotos.has(slugLocal);
    });

    const obrasAtualizadas = [...obrasRemotas, ...obrasApenasLocais];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasAtualizadas));

    return obrasAtualizadas;
  } catch (error) {
    console.warn("Não consegui acessar o Supabase na Home:", error);
    return obrasLocais;
  }
}


export default function Home() {
  const [busca, setBusca] = useState("");
  const [obrasLocais, setObrasLocais] = useState<ObraLocal[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [perfisAutores, setPerfisAutores] = useState<PerfisAutoresSalvos>({});
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);
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

    async function carregarDadosHome() {
      try {
        const obrasSalvasTexto = localStorage.getItem(STORAGE_KEY);
        const obrasSalvasJson = obrasSalvasTexto
          ? JSON.parse(obrasSalvasTexto)
          : [];

        const obrasNormalizadas = normalizarObrasHomeSalvas(obrasSalvasJson);

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

        localStorage.setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify(obrasFavoritasNormalizadas)
        );

        localStorage.setItem(
          COMPLETED_STORAGE_KEY,
          JSON.stringify(obrasConcluidasNormalizadas)
        );

        const perfisAutoresTexto = localStorage.getItem(AUTHOR_PROFILE_STORAGE_KEY);
        const perfisAutoresJson: unknown = perfisAutoresTexto
          ? JSON.parse(perfisAutoresTexto)
          : {};
        const perfisAutoresNormalizados = normalizarPerfisAutoresSalvos(
          perfisAutoresJson
        );

        if (!cancelado) {
          setObrasLocais(obrasNormalizadas);
          setObrasFavoritas(obrasFavoritasNormalizadas);
          setObrasConcluidas(obrasConcluidasNormalizadas);
          setPerfisAutores(perfisAutoresNormalizados);
          setNotificacoesNaoLidas(contarNotificacoesNaoLidas());
        }

        const obrasComSupabase = await carregarObrasSupabaseHome(
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
          setPerfisAutores({});
          setNotificacoesNaoLidas(0);
        }
      }
    }

    carregarDadosHome();

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (obras.length <= 1) {
      return;
    }

    const intervalo = window.setInterval(() => {
      setHeroIndex((indexAtual) => (indexAtual + 1) % obras.length);
    }, 9000);

    return () => window.clearInterval(intervalo);
  }, []);

  const termoBusca = normalizarTexto(busca);
  const heroObra = obras[heroIndex] || obras[0];
  const heroObraHref = heroObra ? criarHrefObraCatalogoHome(heroObra) : "/explorar";


  const obrasPublicadas = useMemo(() => {
    return obrasLocais.filter((obra) => obra.publicado);
  }, [obrasLocais]);

  const obrasPublicadasFiltradas = useMemo(() => {
    return obrasPublicadas
      .filter((obra) => obraLocalCombinaBusca(obra, termoBusca))
      .sort((obraA, obraB) => {
        const dataA = new Date(obraA.criadaEm).getTime();
        const dataB = new Date(obraB.criadaEm).getTime();

        return (
          (Number.isNaN(dataB) ? 0 : dataB) -
          (Number.isNaN(dataA) ? 0 : dataA)
        );
      });
  }, [obrasPublicadas, termoBusca]);

  const obrasParaContinuar = useMemo(() => {
    return obrasPublicadas
      .filter((obra) => {
        return (
          Boolean(encontrarCapituloParaContinuar(obra)) &&
          obraLocalCombinaBusca(obra, termoBusca)
        );
      })
      .sort((obraA, obraB) => {
        return obterTempoUltimaLeitura(obraB) - obterTempoUltimaLeitura(obraA);
      })
      .slice(0, 5);
  }, [obrasPublicadas, termoBusca]);

  const resumoInicio = useMemo(() => {
    const totalCapitulosPublicados = obrasPublicadas.reduce((total, obra) => {
      return total + obra.capitulos.length;
    }, 0);

    const totalEmLeitura = obrasPublicadas.filter((obra) => {
      return Boolean(encontrarCapituloParaContinuar(obra));
    }).length;

    const totalFavoritas = obrasPublicadas.filter((obra) => {
      return obrasFavoritas.includes(obra.id);
    }).length;

    const totalConcluidas = obrasPublicadas.filter((obra) => {
      return obrasConcluidas.includes(obra.id);
    }).length;

    return {
      totalPublicadas: obrasPublicadas.length,
      totalCapitulosPublicados,
      totalEmLeitura,
      totalFavoritas,
      totalConcluidas,
    };
  }, [obrasPublicadas, obrasFavoritas, obrasConcluidas]);

  const obrasFiltradas = useMemo(() => {
    if (!termoBusca) {
      return obras;
    }

    return obras.filter((obra) => {
      const textoObra = normalizarTexto(
        [
          obra.titulo,
          obra.autor,
          obra.genero,
          obra.classificacaoIndicativa,
          obra.status,
        ].join(" ")
      );

      return textoObra.includes(termoBusca);
    });
  }, [termoBusca]);


  const obrasComNovosCapitulos = useMemo(() => {
    return obrasPublicadas
      .filter((obra) => obra.capitulos.length > 0 && obraLocalCombinaBusca(obra, termoBusca))
      .sort((obraA, obraB) => obterTempoUltimoCapitulo(obraB) - obterTempoUltimoCapitulo(obraA))
      .slice(0, 12);
  }, [obrasPublicadas, termoBusca]);

  const obrasMaisCurtidas = useMemo(() => {
    return obrasPublicadas
      .filter((obra) => contarCurtidasObraLocal(obra) > 0 && obraLocalCombinaBusca(obra, termoBusca))
      .sort((obraA, obraB) => contarCurtidasObraLocal(obraB) - contarCurtidasObraLocal(obraA))
      .slice(0, 12);
  }, [obrasPublicadas, termoBusca]);

  const obrasMaisComentadas = useMemo(() => {
    return obrasPublicadas
      .filter((obra) => contarComentariosObraLocal(obra) > 0 && obraLocalCombinaBusca(obra, termoBusca))
      .sort((obraA, obraB) => contarComentariosObraLocal(obraB) - contarComentariosObraLocal(obraA))
      .slice(0, 12);
  }, [obrasPublicadas, termoBusca]);

  const obrasComArquivoAnexado = useMemo(() => {
    return obrasPublicadas
      .filter((obra) => obraTemArquivoAnexado(obra) && obraLocalCombinaBusca(obra, termoBusca))
      .slice(0, 12);
  }, [obrasPublicadas, termoBusca]);

  const leiturasRapidas = useMemo(() => {
    return obrasPublicadas
      .filter((obra) => {
        return (
          obra.capitulos.length > 0 &&
          obra.capitulos.length <= 3 &&
          obraLocalCombinaBusca(obra, termoBusca)
        );
      })
      .sort((obraA, obraB) => obraA.capitulos.length - obraB.capitulos.length)
      .slice(0, 12);
  }, [obrasPublicadas, termoBusca]);

  const autoresParaConhecer = useMemo<AutorHome[]>(() => {
    const autoresMap = new Map<
      string,
      {
        nome: string;
        generos: string[];
        totalObras: number;
        totalCapitulos: number;
        totalCurtidas: number;
        totalComentarios: number;
      }
    >();

    function registrarAutor(
      nomeAutor: string,
      genero: string,
      capitulos = 0,
      curtidas = 0,
      comentarios = 0
    ) {
      const nomeLimpo = nomeAutor.trim() || "Autor não informado";
      const chave = normalizarChaveAutor(nomeLimpo);
      const autorRegistrado = autoresMap.get(chave);

      if (autorRegistrado) {
        autorRegistrado.totalObras += 1;
        autorRegistrado.totalCapitulos += capitulos;
        autorRegistrado.totalCurtidas += curtidas;
        autorRegistrado.totalComentarios += comentarios;

        if (genero.trim()) {
          autorRegistrado.generos.push(genero.trim());
        }

        return;
      }

      autoresMap.set(chave, {
        nome: nomeLimpo,
        generos: genero.trim() ? [genero.trim()] : [],
        totalObras: 1,
        totalCapitulos: capitulos,
        totalCurtidas: curtidas,
        totalComentarios: comentarios,
      });
    }

    obrasPublicadas
      .filter((obra) => obraLocalCombinaBusca(obra, termoBusca))
      .forEach((obra) => {
        registrarAutor(
          obra.autor,
          obra.genero,
          obra.capitulos.length,
          contarCurtidasObraLocal(obra),
          contarComentariosObraLocal(obra)
        );
      });

    obrasFiltradas.forEach((obra) => {
      registrarAutor(obra.autor, obra.genero);
    });

    return Array.from(autoresMap.values())
      .map((autor) =>
        criarAutorHome(
          autor.nome,
          autor.generos,
          autor.totalObras,
          autor.totalCapitulos,
          autor.totalCurtidas,
          autor.totalComentarios,
          perfisAutores
        )
      )
      .sort((autorA, autorB) => {
        return (
          autorB.totalObras - autorA.totalObras ||
          autorB.totalCapitulos - autorA.totalCapitulos ||
          autorA.nome.localeCompare(autorB.nome, "pt-BR")
        );
      })
      .slice(0, 12);
  }, [obrasPublicadas, obrasFiltradas, perfisAutores, termoBusca]);

  const obrasFantasiaPoderes = useMemo(() => {
    return obrasFiltradas.filter((obra) =>
      obraCatalogoCombinaTemas(obra, ["fantasia", "sobrenatural", "poder", "magia"])
    );
  }, [obrasFiltradas]);

  const obrasTerrorSuspense = useMemo(() => {
    return obrasFiltradas.filter((obra) =>
      obraCatalogoCombinaTemas(obra, ["terror", "suspense", "mistério", "sombrio"])
    );
  }, [obrasFiltradas]);

  const obrasRomanceDrama = useMemo(() => {
    return obrasFiltradas.filter((obra) =>
      obraCatalogoCombinaTemas(obra, ["romance", "drama", "emocional"])
    );
  }, [obrasFiltradas]);

  const obrasAcaoRivalidades = useMemo(() => {
    return obrasFiltradas.filter((obra) =>
      obraCatalogoCombinaTemas(obra, ["ação", "acao", "luta", "rivalidade", "guerra"])
    );
  }, [obrasFiltradas]);

  const obrasScifiCodigo = useMemo(() => {
    return obrasFiltradas.filter((obra) =>
      obraCatalogoCombinaTemas(obra, ["sci-fi", "scifi", "ficção", "futur", "código", "codigo"])
    );
  }, [obrasFiltradas]);

  const obrasEmBreve = useMemo(() => {
    return obrasFiltradas.filter((obra) => !obra.disponivel);
  }, [obrasFiltradas]);

  if (!heroObra) {
    return <main style={emptyPageStyle}>Nenhuma obra cadastrada.</main>;
  }

  return (
    <main style={pageStyle}>
      <div style={pageDecorationLayerStyle} aria-hidden="true">
        {["✦", "◌", "✧"].map((decoracao, index) => (
          <span key={`${decoracao}-${index}`} style={criarDecoracaoHomeStyle(index)}>
            {decoracao}
          </span>
        ))}
      </div>

      <header style={navStyle}>
        <div style={isDesktop ? desktopNavInnerStyle : navInnerStyle}>
          <div style={isDesktop ? desktopNavTopRowStyle : navTopRowStyle}>
            <Link href="/" style={logoStyle} aria-label="Historietas">
              <span style={logoMarkStyle}>H</span>
              <span style={logoTextStyle}>istorietas</span>
            </Link>

            <div style={navIconsStyle}>
              <Link href="/configuracoes" style={publishSmallButtonStyle}>
                Configurações
              </Link>

              <Link
                href="/notificacoes"
                style={notificationDotStyle}
                aria-label={notificacoesNaoLidas > 0 ? `Notificações: ${notificacoesNaoLidas} novas` : "Notificações"}
              >
                N
              </Link>
            </div>
          </div>

          <nav style={isDesktop ? desktopMenuStyle : menuStyle} aria-label="Navegação principal">
            <Link href="/" style={activeLinkStyle}>
              Início
            </Link>

            <Link href="/explorar" style={linkStyle}>
              Explorar
            </Link>

            <Link href="/em-alta" style={linkStyle}>
              Em Alta
            </Link>

            <Link href="/categorias" style={linkStyle}>
              Categorias
            </Link>

            <Link href="/minhas-obras" style={linkStyle}>
              Minhas Obras
            </Link>

            <Link href="/biblioteca" style={linkStyle}>
              Biblioteca
            </Link>

            <Link href="/seguindo" style={linkStyle}>
              Seguindo
            </Link>

            <Link href="/painel-autor" style={linkStyle}>
              Painel do Autor
            </Link>

            {isDesktop && (
              <div style={desktopInlineSearchAreaStyle}>
                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Buscar obras, autor, gênero..."
                  style={inputStyle}
                />
              </div>
            )}
          </nav>

          {!isDesktop && (
            <div style={searchAreaStyle}>
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar obras, autor, gênero..."
                style={inputStyle}
              />
            </div>
          )}
        </div>
      </header>

      <div style={isDesktop ? desktopContainerStyle : containerStyle}>
        <section style={isDesktop ? { ...criarHeroBackground(heroObra), ...desktopHeroStyle } : criarHeroBackground(heroObra)}>
          <div style={heroGlowStyle} />

          <div style={heroDecorationLayerStyle} aria-hidden="true">
            {["✦", "◌", "✧", "◇"].map((decoracao, index) => (
              <span key={`hero-${decoracao}-${index}`} style={criarDecoracaoHomeStyle(index)}>
                {decoracao}
              </span>
            ))}
          </div>

          {isDesktop ? (
            <div style={desktopHeroShellStyle}>
              <Link
                href={heroObraHref}
                style={criarHeroPosterStyle(heroObra)}
                aria-label={`Abrir destaque ${heroObra.titulo}`}
              >
                <span style={desktopHeroPosterGlowStyle} aria-hidden="true" />
                <span style={desktopHeroPosterBadgeStyle}>{heroObra.genero}</span>
                <strong style={desktopHeroPosterTitleStyle}>{heroObra.titulo}</strong>
                <span style={desktopHeroPosterStatusStyle}>{heroObra.status}</span>
              </Link>

              <div style={desktopHeroContentStyle}>
                <div style={heroMetaStyle}>
                  <span style={heroKickerStyle}>Destaque da Historietas</span>
                  <span style={heroPillStyle}>{heroObra.genero}</span>
                  <span style={heroPillStyle}>{heroObra.classificacaoIndicativa}</span>
                </div>

                <h1 style={desktopHeroTitleStyle}>{heroObra.titulo}</h1>

                <p style={desktopHeroDescriptionStyle}>{heroObra.sinopse}</p>

                <div style={heroStatsStyle}>
                  <span style={safeTextStyle}>👁 {heroObra.views}</span>
                  <span style={safeTextStyle}>♥ {heroObra.likes}</span>
                  <span style={safeTextStyle}>💬 {heroObra.comentarios}</span>
                  <span style={safeTextStyle}>{heroObra.status}</span>
                </div>

                <div style={desktopHeroButtonsStyle}>
                  <Link href={heroObraHref} style={primaryButtonStyle}>
                    {heroObra.disponivel ? "Ver obra" : "Ver detalhes"}
                  </Link>

                  <Link href="/explorar" style={secondaryButtonStyle}>
                    Explorar catálogo
                  </Link>
                </div>

                <div style={heroDotsStyle} aria-label="Obras em destaque">
                  {obras.map((obra, index) => (
                    <button
                      key={`${obra.titulo}-${index}`}
                      type="button"
                      onClick={() => setHeroIndex(index)}
                      aria-label={`Mostrar ${obra.titulo}`}
                      style={
                        index === heroIndex ? heroDotActiveStyle : heroDotStyle
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={heroContentStyle}>
              <div style={heroMetaStyle}>
                <span style={heroKickerStyle}>Destaque da Historietas</span>
                <span style={heroPillStyle}>{heroObra.genero}</span>
                <span style={heroPillStyle}>{heroObra.classificacaoIndicativa}</span>
              </div>

              <h1 style={heroTitleStyle}>{heroObra.titulo}</h1>

              <p style={heroDescriptionStyle}>{heroObra.sinopse}</p>

              <div style={heroStatsStyle}>
                <span style={safeTextStyle}>👁 {heroObra.views}</span>
                <span style={safeTextStyle}>♥ {heroObra.likes}</span>
                <span style={safeTextStyle}>💬 {heroObra.comentarios}</span>
                <span style={safeTextStyle}>{heroObra.status}</span>
              </div>

              <div style={heroButtonsStyle}>
                <Link href={heroObraHref} style={primaryButtonStyle}>
                  {heroObra.disponivel ? "Ver obra" : "Ver detalhes"}
                </Link>

                <Link href="/explorar" style={secondaryButtonStyle}>
                  Explorar catálogo
                </Link>
              </div>

              <div style={heroDotsStyle} aria-label="Obras em destaque">
                {obras.map((obra, index) => (
                  <button
                    key={`${obra.titulo}-${index}`}
                    type="button"
                    onClick={() => setHeroIndex(index)}
                    aria-label={`Mostrar ${obra.titulo}`}
                    style={
                      index === heroIndex ? heroDotActiveStyle : heroDotStyle
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        <section style={isDesktop ? desktopSummaryStripStyle : summaryStripStyle} aria-label="Resumo da plataforma">
          <div style={summaryItemStyle}>
            <strong style={summaryNumberStyle}>
              {resumoInicio.totalPublicadas}
            </strong>
            <span style={summaryLabelStyle}>publicadas</span>
          </div>

          <div style={summaryItemStyle}>
            <strong style={summaryNumberStyle}>
              {resumoInicio.totalEmLeitura}
            </strong>
            <span style={summaryLabelStyle}>em leitura</span>
          </div>

          <div style={summaryItemStyle}>
            <strong style={summaryNumberStyle}>
              {resumoInicio.totalCapitulosPublicados}
            </strong>
            <span style={summaryLabelStyle}>capítulos</span>
          </div>

          <div style={summaryItemStyle}>
            <strong style={summaryNumberStyle}>{notificacoesNaoLidas}</strong>
            <span style={summaryLabelStyle}>avisos</span>
          </div>
        </section>

        {obrasParaContinuar.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Continuar lendo"
              subtitle="Continue do ponto em que parou."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasParaContinuar.map((obra) => (
                <MobileObraLocalCard
                  key={`continuar-${obra.id}`}
                  obra={obra}
                  tipo="continuar"
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasPublicadasFiltradas.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Publicações recentes"
              subtitle={`${obrasPublicadasFiltradas.length} ${
                obrasPublicadasFiltradas.length === 1
                  ? "obra publicada"
                  : "obras publicadas"
              }`}
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasPublicadasFiltradas.map((obra) => (
                <MobileObraLocalCard
                  key={obra.id}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}


        {obrasComNovosCapitulos.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Novos capítulos"
              subtitle="Capítulos novos para acompanhar sem perder o ritmo."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasComNovosCapitulos.map((obra) => (
                <MobileObraLocalCard
                  key={`novos-capitulos-${obra.id}`}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasMaisCurtidas.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Mais curtidas"
              subtitle="Favoritas da comunidade nesta fase."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasMaisCurtidas.map((obra) => (
                <MobileObraLocalCard
                  key={`mais-curtidas-${obra.id}`}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasMaisComentadas.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Mais comentadas"
              subtitle="Histórias que estão puxando conversa."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasMaisComentadas.map((obra) => (
                <MobileObraLocalCard
                  key={`mais-comentadas-${obra.id}`}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasComArquivoAnexado.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Extras e arquivos"
              subtitle="Histórias com material extra para abrir depois."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasComArquivoAnexado.map((obra) => (
                <MobileObraLocalCard
                  key={`arquivo-anexado-${obra.id}`}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {leiturasRapidas.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Para ler agora"
              subtitle="Obras curtas para entrar rápido no universo."
            />

            <CarouselRow isDesktop={isDesktop}>
              {leiturasRapidas.map((obra) => (
                <MobileObraLocalCard
                  key={`leituras-rapidas-${obra.id}`}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {autoresParaConhecer.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Autores para conhecer"
              subtitle="Perfis que dão vida ao catálogo."
            />

            <CarouselRow isDesktop={isDesktop} variant="autor">
              {autoresParaConhecer.map((autor) => (
                <MobileAutorCard key={`autor-${autor.chave}`} autor={autor} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          </section>
        )}

        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <SectionHeader title="Em alta agora" subtitle="Histórias em evidência na plataforma." />

          {obrasFiltradas.length > 0 ? (
            <CarouselRow isDesktop={isDesktop}>
              {obrasFiltradas.map((obra) => (
                <MobileObraCard key={obra.titulo} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          ) : (
            <EmptySearch />
          )}
        </section>


        {obrasFantasiaPoderes.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Fantasia e poderes"
              subtitle="Mundos, poderes e mistérios para explorar."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasFantasiaPoderes.map((obra) => (
                <MobileObraCard key={`fantasia-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasTerrorSuspense.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Terror e suspense"
              subtitle="Atmosfera sombria, tensão e mistério."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasTerrorSuspense.map((obra) => (
                <MobileObraCard key={`terror-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasRomanceDrama.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Romance e drama"
              subtitle="Relações intensas e escolhas difíceis."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasRomanceDrama.map((obra) => (
                <MobileObraCard key={`romance-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasAcaoRivalidades.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Ação e rivalidades"
              subtitle="Conflitos, disputas e personagens intensos."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasAcaoRivalidades.map((obra) => (
                <MobileObraCard key={`acao-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasScifiCodigo.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Sci-fi e códigos"
              subtitle="Futuro, sistemas e universos alternativos."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasScifiCodigo.map((obra) => (
                <MobileObraCard key={`scifi-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasEmBreve.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Em breve na Historietas"
              subtitle="Obras chegando ao catálogo em breve."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasEmBreve.map((obra) => (
                <MobileObraCard key={`em-breve-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          </section>
        )}

        <section style={isDesktop ? desktopLastSectionStyle : lastSectionStyle}>
          <SectionHeader
            title="Obras em destaque"
            subtitle="Uma vitrine final para descobrir novas histórias."
          />

          {obrasFiltradas.length > 0 ? (
            <CarouselRow isDesktop={isDesktop}>
              {obrasFiltradas.map((obra) => (
                <MobileObraCard key={`destaque-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          ) : (
            <EmptySearch />
          )}
        </section>
      </div>
    </main>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div style={sectionHeaderStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      <span style={orangeTextStyle}>{subtitle}</span>
    </div>
  );
}

function MobileObraLocalCard({
  obra,
  tipo,
  isDesktop,
}: {
  obra: ObraLocal;
  tipo: "continuar" | "catalogo";
  isDesktop?: boolean;
}) {
  const totalCurtidas = obra.capitulos.filter((capitulo) => capitulo.curtiu)
    .length;

  const totalComentarios = obra.capitulos.filter((capitulo) =>
    capitulo.comentario.trim()
  ).length;

  const totalLidos = obra.capitulos.filter((capitulo) => capitulo.lido).length;
  const progressoLeitura = calcularProgressoLeitura(obra.capitulos);
  const capituloParaContinuar = encontrarCapituloParaContinuar(obra);
  const slugObra = obra.slug || criarSlugBase(obra.titulo);
  const verObraHref = obra.link?.trim() || `/obra/${slugObra}`;
  const continuarLeituraHref = capituloParaContinuar
    ? `/ler-capitulo?obraId=${obra.id}&capituloId=${capituloParaContinuar.id}`
    : verObraHref;
  const perfilAutorHref = `/perfil-autor?autor=${encodeURIComponent(
    obra.autor
  )}`;

  const actionHref = tipo === "continuar" ? continuarLeituraHref : verObraHref;
  const actionLabel = tipo === "continuar" ? "Continuar leitura" : "Ver obra";
  const capaStyle = isDesktop
    ? { ...criarCoverStyle(obra.capa), ...desktopCoverPlaceholderStyle }
    : criarCoverStyle(obra.capa);

  return (
    <article style={isDesktop ? desktopPublishedCardStyle : publishedCardStyle}>
      <Link href={verObraHref} style={capaStyle}>
        {!obra.capa && <span style={noCoverBadgeStyle}>Sem capa</span>}
        <span style={coverGenreStyle}>{obra.genero}</span>
      </Link>

      <div style={publishedInfoStyle}>
        <div style={cardTopRowStyle}>
          <h3 style={isDesktop ? desktopPublishedTitleStyle : publishedTitleStyle}>{obra.titulo}</h3>

          <div style={statusRowStyle}>
            <span style={formatBadgeStyle}>{obra.formato}</span>
            <span style={classificationBadgeStyle}>
              {obra.classificacaoIndicativa}
            </span>
          </div>
        </div>

        <Link href={perfilAutorHref} style={authorLinkStyle}>
          por {obra.autor}
        </Link>

        <div style={cardStatsStyle}>
          <span style={safeTextStyle}>📚 {obra.capitulos.length} cap.</span>
          <span style={safeTextStyle}>♥ {totalCurtidas}</span>
          <span style={safeTextStyle}>💬 {totalComentarios}</span>
          {totalLidos > 0 && <span style={safeTextStyle}>{totalLidos} lidos</span>}
        </div>

        {progressoLeitura > 0 && (
          <div style={progressCompactStyle}>
            <div style={progressTrackStyle}>
              <div
                style={{
                  ...progressBarStyle,
                  width: `${progressoLeitura}%`,
                }}
              />
            </div>

            <span style={progressTextStyle}>{progressoLeitura}% lido</span>
          </div>
        )}

        <Link href={actionHref} style={readNowStyle}>
          {actionLabel}
        </Link>
      </div>
    </article>
  );
}

function MobileAutorCard({ autor, isDesktop }: { autor: AutorHome; isDesktop?: boolean }) {
  const generosAutor = autor.generos.length > 0 ? autor.generos : ["Historietas"];

  return (
    <Link
      href={autor.href}
      style={isDesktop ? desktopAuthorCardStyle : authorCardStyle}
      aria-label={`Abrir perfil do autor ${autor.nome}`}
    >
      <span style={authorCardGlowStyle} aria-hidden="true" />

      <div style={authorCardTopStyle}>
        <div style={authorAvatarShellStyle}>
          {autor.avatar ? (
            <img
              src={autor.avatar}
              alt={`Avatar de ${autor.nome}`}
              style={authorAvatarImageStyle}
            />
          ) : (
            <span style={authorAvatarInitialsStyle}>
              {criarIniciaisAutor(autor.nome)}
            </span>
          )}
        </div>

        <div style={authorIdentityStyle}>
          <span style={authorMiniBadgeStyle}>CRIADOR</span>

          <h3 style={authorCardNameStyle}>{autor.nome}</h3>

          <p style={authorCardBioStyle}>{autor.bio}</p>
        </div>
      </div>

      <div style={authorMetaRowStyle}>
        <span style={authorMetaBadgeStyle}>
          {autor.totalObras} {autor.totalObras === 1 ? "obra" : "obras"}
        </span>

        {autor.totalCapitulos > 0 && (
          <span style={authorMetaBadgeStyle}>{autor.totalCapitulos} cap.</span>
        )}

        {autor.totalCurtidas > 0 && (
          <span style={authorMetaBadgeStyle}>♥ {autor.totalCurtidas}</span>
        )}

        {autor.totalComentarios > 0 && (
          <span style={authorMetaBadgeStyle}>💬 {autor.totalComentarios}</span>
        )}
      </div>

      <div style={authorBottomRowStyle}>
        <div style={authorGenreRowStyle}>
          {generosAutor.slice(0, 2).map((genero) => (
            <span key={`${autor.chave}-${genero}`} style={authorGenreBadgeStyle}>
              {genero}
            </span>
          ))}
        </div>

        <span style={authorProfileButtonStyle}>Ver perfil</span>
      </div>
    </Link>
  );
}

function MobileObraCard({ obra, isDesktop }: { obra: Obra; isDesktop?: boolean }) {
  const obraHref = criarHrefObraCatalogoHome(obra);

  const conteudoCard = (
    <>
      <div style={isDesktop ? desktopCoverThumbStyle : coverThumbStyle}>
        <span style={coverGenreStyle}>{obra.genero}</span>
      </div>

      <div style={obraInfoStyle}>
        <div style={cardTopRowStyle}>
          <h3 style={isDesktop ? desktopObraTitleStyle : obraTitleStyle}>{obra.titulo}</h3>

          <div style={statusRowStyle}>
            <span style={statusBadgeStyle}>{obra.status}</span>
            <span style={classificationBadgeStyle}>
              {obra.classificacaoIndicativa}
            </span>
            {!obra.disponivel && <span style={soonBadgeStyle}>Em breve</span>}
          </div>
        </div>

        <p style={authorStyle}>por {obra.autor}</p>

        <div style={cardStatsStyle}>
          <span style={safeTextStyle}>👁 {obra.views}</span>
          <span style={safeTextStyle}>♥ {obra.likes}</span>
          <span style={safeTextStyle}>💬 {obra.comentarios}</span>
        </div>

        <span style={obra.disponivel ? readNowStyle : soonLabelStyle}>
          {obra.disponivel ? "Ver obra" : "Ver detalhes"}
        </span>
      </div>
    </>
  );

  return (
    <Link
      href={obraHref}
      style={
        isDesktop
          ? obra.disponivel
            ? desktopObraCardStyle
            : desktopObraCardSoonStyle
          : obra.disponivel
            ? obraCardStyle
            : obraCardSoonStyle
      }
      aria-label={`Abrir página da obra ${obra.titulo}`}
    >
      {conteudoCard}
    </Link>
  );
}

function EmptySearch() {
  return <div style={emptyBoxStyle}>Nenhuma obra encontrada.</div>;
}

function CarouselRow({
  children,
  isDesktop,
  variant = "obra",
}: {
  children: ReactNode;
  isDesktop: boolean;
  variant?: "obra" | "autor";
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const totalItems = Children.count(children);
  const precisaDeCarrossel = isDesktop && totalItems > 3;

  const listStyle = !isDesktop
    ? variant === "autor"
      ? authorListStyle
      : storyListStyle
    : precisaDeCarrossel
      ? variant === "autor"
        ? desktopAuthorListStyle
        : desktopStoryListStyle
      : variant === "autor"
        ? desktopStaticAuthorListStyle
        : desktopStaticStoryListStyle;

  function rolarCarrossel(direcao: -1 | 1) {
    rowRef.current?.scrollBy({
      left: direcao * 430,
      behavior: "smooth",
    });
  }

  if (!isDesktop || !precisaDeCarrossel) {
    return <div style={listStyle}>{children}</div>;
  }

  return (
    <div style={desktopCarouselShellStyle}>
      <button
        type="button"
        onClick={() => rolarCarrossel(-1)}
        style={desktopCarouselArrowLeftStyle}
        aria-label="Rolar carrossel para a esquerda"
      >
        <span style={desktopCarouselArrowIconStyle}>‹</span>
      </button>

      <div ref={rowRef} style={listStyle}>
        {children}
      </div>

      <button
        type="button"
        onClick={() => rolarCarrossel(1)}
        style={desktopCarouselArrowRightStyle}
        aria-label="Rolar carrossel para a direita"
      >
        <span style={desktopCarouselArrowIconStyle}>›</span>
      </button>
    </div>
  );
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

const emptyPageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "var(--historietas-bg-mid, #12081F)",
  color: "#FFFFFF",
  padding: "40px",
  maxWidth: "100vw",
  overflowX: "hidden",
  ...safeTextStyle,
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background:
    "radial-gradient(circle at 12% 0%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)), transparent 28%), radial-gradient(circle at 88% 14%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)), transparent 22%), radial-gradient(circle at 50% 100%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)), transparent 30%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 38%, var(--historietas-bg-end, #17101B) 100%)",
  color: "#FFFFFF",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(820px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  boxSizing: "border-box",
  minWidth: 0,
};

const navStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 30,
  backdropFilter: "blur(18px)",
  background:
    "linear-gradient(180deg, rgba(10, 6, 18, 0.98) 0%, rgba(18, 8, 31, 0.92) 62%, rgba(18, 8, 31, 0.78) 100%)",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 18px 44px rgba(0,0,0,0.24)",
  maxWidth: "100vw",
  overflowX: "hidden",
};

const navInnerStyle: CSSProperties = {
  width: "min(820px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  padding: "14px 0 12px",
  boxSizing: "border-box",
  minWidth: 0,
};

const navTopRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "14px",
  flexWrap: "wrap",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1240px, calc(100% - 64px))",
};

const desktopNavInnerStyle: CSSProperties = {
  ...navInnerStyle,
  width: "min(1240px, calc(100% - 64px))",
  gridTemplateColumns: "1fr",
  gridTemplateAreas: '"top" "menu"',
  alignItems: "center",
  gap: "12px",
  padding: "14px 0 12px",
};

const desktopNavTopRowStyle: CSSProperties = {
  ...navTopRowStyle,
  gridArea: "top",
  flexWrap: "nowrap",
};

const logoStyle: CSSProperties = {
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "25px",
  fontWeight: 950,
  letterSpacing: 0,
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "min(100%, calc(100% - 96px))",
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
  letterSpacing: 0,
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background: "linear-gradient(135deg, #F5F3FF 0%, var(--historietas-secondary, #C4B5FD) 42%, var(--historietas-accent, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "0 0 26px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, transparent)",
};

const navIconsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flex: "0 0 auto",
  maxWidth: "100%",
};

const publishSmallButtonStyle: CSSProperties = {
  minHeight: "34px",
  padding: "0 13px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: 950,
  lineHeight: 1.15,
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "center",
  whiteSpace: "normal",
  boxShadow: "0 10px 28px color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  ...safeTextStyle,
};

const notificationDotStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 34%, transparent)",
  color: "#F5F3FF",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  fontWeight: 950,
  boxShadow: "0 10px 28px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, transparent)",
  flex: "0 0 auto",
};

const menuStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  overflowX: "auto",
  padding: "2px 0 6px",
  maxWidth: "100%",
  scrollbarWidth: "none",
};

const desktopMenuStyle: CSSProperties = {
  ...menuStyle,
  gridArea: "menu",
  gap: "9px",
  overflowX: "hidden",
  padding: "0 0 2px",
};

const desktopInlineSearchAreaStyle: CSSProperties = {
  flex: "1 1 320px",
  minWidth: "280px",
  maxWidth: "430px",
  marginLeft: "2px",
};

const linkStyle: CSSProperties = {
  position: "relative",
  color: "#C8C1D9",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 900,
  whiteSpace: "nowrap",
  flex: "0 0 auto",
  padding: "9px 13px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const activeLinkStyle: CSSProperties = {
  ...linkStyle,
  color: "#FFFFFF",
  background: "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 54%, transparent) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent) 100%)",
  border: "1px solid rgba(255,255,255,0.16)",
  boxShadow: "0 12px 32px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, transparent)",
};

const searchAreaStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: "44px",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent)",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.075) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 10%, transparent) 100%)",
  color: "#FFFFFF",
  padding: "0 15px",
  outline: "none",
  fontSize: "14px",
  fontWeight: 700,
  boxSizing: "border-box",
  maxWidth: "100%",
  minWidth: 0,
  boxShadow: "0 0 24px color-mix(in srgb, var(--historietas-accent, #F97316) 8%, transparent)",
};

const heroStyle: CSSProperties = {
  marginTop: "22px",
  borderRadius: "30px",
  overflow: "hidden",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent)",
  boxShadow: "0 34px 95px rgba(0,0,0,0.48), 0 0 46px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, transparent)",
  position: "relative",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopHeroStyle: CSSProperties = {
  marginTop: "20px",
  borderRadius: "32px",
  backgroundPosition: "center",
};

const desktopHeroShellStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gridTemplateColumns: "minmax(260px, 360px) minmax(0, 1fr)",
  alignItems: "stretch",
  gap: "30px",
  minHeight: "350px",
  padding: "28px 34px",
  boxSizing: "border-box",
};

const desktopHeroPosterStyle: CSSProperties = {
  position: "relative",
  minHeight: "294px",
  borderRadius: "28px",
  overflow: "hidden",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  boxShadow:
    "0 24px 58px rgba(0,0,0,0.42), 0 0 42px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent)",
  textDecoration: "none",
  color: "#FFFFFF",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  gap: "10px",
  padding: "22px",
  boxSizing: "border-box",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const desktopHeroPosterGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(8, 5, 18, 0.10) 0%, rgba(8, 5, 18, 0.90) 100%)",
  pointerEvents: "none",
};

const desktopHeroPosterBadgeStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "fit-content",
  maxWidth: "100%",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 32%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  fontWeight: 950,
  ...safeTextStyle,
};

const desktopHeroPosterTitleStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  color: "#FFFFFF",
  fontSize: "32px",
  lineHeight: 1,
  fontWeight: 950,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const desktopHeroPosterStatusStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "fit-content",
  maxWidth: "100%",
  color: "#D4D4D8",
  fontSize: "13px",
  fontWeight: 900,
  ...safeTextStyle,
};

const heroGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(8, 5, 18, 0.24) 0%, rgba(8, 5, 18, 0.90) 100%)",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minHeight: "min(500px, 72vh)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  gap: "16px",
  padding: "24px 16px 22px",
  boxSizing: "border-box",
  maxWidth: "100%",
  minWidth: 0,
};

const desktopHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  minHeight: "auto",
  justifyContent: "center",
  alignSelf: "stretch",
  padding: "10px 6px 10px 0",
  maxWidth: "100%",
  gap: "14px",
};

const heroMetaStyle: CSSProperties = {
  display: "flex",
  gap: "9px",
  flexWrap: "wrap",
  maxWidth: "100%",
  minWidth: 0,
};

const heroKickerStyle: CSSProperties = {
  maxWidth: "100%",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  fontWeight: 950,
  boxShadow: "0 12px 34px color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)",
  ...safeTextStyle,
};

const heroPillStyle: CSSProperties = {
  maxWidth: "100%",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 32%, transparent)",
  color: "var(--historietas-secondary, #DDD6FE)",
  fontSize: "12px",
  fontWeight: 950,
  boxShadow: "0 12px 34px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 10%, transparent)",
  ...safeTextStyle,
};

const heroTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(34px, 11vw, 72px)",
  lineHeight: 0.96,
  fontWeight: 950,
  letterSpacing: 0,
  maxWidth: "100%",
  ...safeTextStyle,
};

const desktopHeroTitleStyle: CSSProperties = {
  ...heroTitleStyle,
  fontSize: "clamp(38px, 4.4vw, 58px)",
  lineHeight: 0.98,
  maxWidth: "640px",
};

const heroDescriptionStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  fontSize: "15px",
  lineHeight: 1.55,
  fontWeight: 650,
  maxWidth: "100%",
  ...safeTextStyle,
};

const desktopHeroDescriptionStyle: CSSProperties = {
  ...heroDescriptionStyle,
  fontSize: "15px",
  lineHeight: 1.55,
  maxWidth: "600px",
};

const heroStatsStyle: CSSProperties = {
  display: "flex",
  gap: "11px",
  flexWrap: "wrap",
  color: "#B9B4C7",
  fontSize: "13px",
  fontWeight: 850,
  maxWidth: "100%",
  minWidth: 0,
};

const heroButtonsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(138px, 1fr))",
  gap: "10px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopHeroButtonsStyle: CSSProperties = {
  ...heroButtonsStyle,
  gridTemplateColumns: "repeat(2, minmax(164px, 198px))",
  justifyContent: "flex-start",
};

const primaryButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "52px",
  padding: "0 22px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "15px",
  fontWeight: 950,
  boxShadow: "0 14px 40px color-mix(in srgb, var(--historietas-accent, #F97316) 36%, transparent)",
  textAlign: "center",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const secondaryButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "52px",
  padding: "0 22px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.09)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "15px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,0.12)",
  textAlign: "center",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const heroDotsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "4px",
  flexWrap: "wrap",
  maxWidth: "100%",
};

const heroDotStyle: CSSProperties = {
  width: "18px",
  height: "5px",
  borderRadius: "999px",
  border: "0",
  background: "rgba(255,255,255,0.24)",
  cursor: "pointer",
};

const heroDotActiveStyle: CSSProperties = {
  ...heroDotStyle,
  width: "38px",
  background: "var(--historietas-accent, #F97316)",
};

const summaryStripStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))",
  gap: "8px",
  marginTop: "16px",
  padding: "10px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.065) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 8%, transparent) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  boxShadow: "0 18px 46px rgba(0,0,0,0.22)",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
  overflow: "hidden",
};

const desktopSummaryStripStyle: CSSProperties = {
  ...summaryStripStyle,
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "12px",
  padding: "14px",
  borderRadius: "26px",
};

const summaryItemStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  maxWidth: "100%",
  minWidth: 0,
};

const summaryNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #F97316)",
  fontSize: "20px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const summaryLabelStyle: CSSProperties = {
  color: "#D4D4D8",
  fontSize: "10px",
  fontWeight: 850,
  textAlign: "center",
  lineHeight: 1.25,
  ...safeTextStyle,
};

const sectionStyle: CSSProperties = {
  marginTop: "28px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const lastSectionStyle: CSSProperties = {
  marginTop: "28px",
  paddingBottom: "64px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  marginTop: "30px",
};

const desktopLastSectionStyle: CSSProperties = {
  ...lastSectionStyle,
  marginTop: "30px",
  paddingBottom: "76px",
};

const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "6px",
  marginBottom: "14px",
  maxWidth: "100%",
  minWidth: 0,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(24px, 4vw, 30px)",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const orangeTextStyle: CSSProperties = {
  color: "#D6C7FF",
  fontSize: "13px",
  fontWeight: 750,
  lineHeight: 1.45,
  maxWidth: "720px",
  opacity: 0.86,
  ...safeTextStyle,
};

const storyListStyle: CSSProperties = {
  display: "flex",
  gap: "13px",
  maxWidth: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  overflowX: "auto",
  overflowY: "hidden",
  padding: "2px 2px 14px",
  margin: "0 -2px",
  scrollSnapType: "x mandatory",
  scrollPaddingLeft: "2px",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
};

const desktopCarouselShellStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const desktopStoryListStyle: CSSProperties = {
  ...storyListStyle,
  gap: "16px",
  width: "100%",
  padding: "6px 0 18px",
  margin: 0,
  scrollPaddingLeft: "0px",
  scrollPaddingRight: "0px",
};

const desktopStaticStoryListStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
  gap: "16px",
  width: "100%",
  maxWidth: "100%",
  padding: "6px 0 8px",
  margin: 0,
  boxSizing: "border-box",
  overflow: "visible",
};

const desktopCarouselArrowBaseStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 4,
  width: "30px",
  height: "30px",
  padding: 0,
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.16)",
  background:
    "linear-gradient(135deg, rgba(18,8,31,0.90) 0%, rgba(38,20,62,0.92) 100%)",
  color: "#FFFFFF",
  fontSize: 0,
  lineHeight: 1,
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow:
    "0 8px 18px rgba(0,0,0,0.30), 0 0 16px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, transparent)",
};

const desktopCarouselArrowLeftStyle: CSSProperties = {
  ...desktopCarouselArrowBaseStyle,
  left: "6px",
};

const desktopCarouselArrowRightStyle: CSSProperties = {
  ...desktopCarouselArrowBaseStyle,
  right: "6px",
};

const desktopCarouselArrowIconStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  transform: "translateY(-1px)",
};

const authorListStyle: CSSProperties = {
  ...storyListStyle,
  gap: "12px",
  padding: "2px 2px 16px",
};

const desktopAuthorListStyle: CSSProperties = {
  ...authorListStyle,
  gap: "16px",
  width: "100%",
  padding: "6px 0 18px",
  margin: 0,
  scrollPaddingLeft: "0px",
  scrollPaddingRight: "0px",
};

const desktopStaticAuthorListStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
  gap: "16px",
  width: "100%",
  maxWidth: "100%",
  padding: "6px 0 8px",
  margin: 0,
  boxSizing: "border-box",
  overflow: "visible",
};

const authorCardStyle: CSSProperties = {
  position: "relative",
  flex: "0 0 min(318px, 84vw)",
  width: "min(318px, 84vw)",
  scrollSnapAlign: "start",
  padding: "12px",
  borderRadius: "24px",
  background:
    "radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent), transparent 34%), radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 34%, transparent), transparent 40%), linear-gradient(135deg, rgba(31, 18, 48, 0.98) 0%, rgba(14, 8, 26, 0.99) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)",
  color: "#FFFFFF",
  textDecoration: "none",
  display: "grid",
  gap: "10px",
  boxShadow:
    "0 18px 42px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 28px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 10%, transparent)",
  boxSizing: "border-box",
  overflow: "hidden",
};

const desktopAuthorCardStyle: CSSProperties = {
  ...authorCardStyle,
  flex: "0 0 356px",
  width: "356px",
  maxWidth: "356px",
  padding: "14px",
  borderRadius: "26px",
};

const authorCardGlowStyle: CSSProperties = {
  position: "absolute",
  top: "-54px",
  right: "-54px",
  width: "140px",
  height: "140px",
  borderRadius: "999px",
  background:
    "radial-gradient(circle, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 38%, transparent), transparent 68%)",
  pointerEvents: "none",
};

const authorCardTopStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gridTemplateColumns: "68px minmax(0, 1fr)",
  gap: "11px",
  alignItems: "center",
  minWidth: 0,
};

const authorAvatarShellStyle: CSSProperties = {
  width: "68px",
  height: "68px",
  borderRadius: "21px",
  padding: "3px",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  boxShadow:
    "0 12px 26px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, transparent)",
  overflow: "hidden",
  flex: "0 0 auto",
};

const authorAvatarImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "cover",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.08)",
};

const authorAvatarInitialsStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "18px",
  background:
    "radial-gradient(circle at 22% 18%, rgba(255,255,255,0.20), transparent 34%), linear-gradient(135deg, rgba(15,8,32,0.95) 0%, rgba(32,16,54,0.95) 100%)",
  color: "#FFFFFF",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.06em",
};

const authorIdentityStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  alignContent: "center",
  minWidth: 0,
};

const authorMiniBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 8px",
  borderRadius: "999px",
  background:
    "color-mix(in srgb, var(--historietas-accent, #F97316) 13%, transparent)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "9px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const authorCardNameStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "24px",
  lineHeight: 0.98,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const authorCardBioStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  fontSize: "12px",
  lineHeight: 1.35,
  fontWeight: 750,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const authorMetaRowStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
};

const authorMetaBadgeStyle: CSSProperties = {
  width: "100%",
  minHeight: "32px",
  padding: "0 6px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.075)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#E4E4E7",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  ...safeTextStyle,
};

const authorBottomRowStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "8px",
  minWidth: 0,
};

const authorGenreRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
};

const authorGenreBadgeStyle: CSSProperties = {
  width: "100%",
  minHeight: "30px",
  padding: "0 8px",
  borderRadius: "999px",
  background:
    "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)",
  color: "var(--historietas-secondary, #DDD6FE)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  ...safeTextStyle,
};

const authorProfileButtonStyle: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  minHeight: "40px",
  padding: "0 12px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 72%, var(--historietas-accent, #F97316)) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 35%, transparent)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  whiteSpace: "nowrap",
  boxShadow:
    "0 12px 26px color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent)",
  ...safeTextStyle,
};

const publishedCardStyle: CSSProperties = {
  flex: "0 0 min(352px, 86vw)",
  width: "min(352px, 86vw)",
  scrollSnapAlign: "start",
  display: "grid",
  gridTemplateColumns: "minmax(84px, 94px) minmax(0, 1fr)",
  gap: "13px",
  alignItems: "stretch",
  padding: "10px",
  borderRadius: "22px",
  background:
    "linear-gradient(145deg, rgba(26, 17, 43, 0.96) 0%, rgba(13, 9, 25, 0.98) 100%)",
  border: "1px solid rgba(255,255,255,0.09)",
  color: "#FFFFFF",
  textDecoration: "none",
  minWidth: 0,
  maxWidth: "86vw",
  overflow: "hidden",
  boxShadow: "0 16px 36px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.05)",
  boxSizing: "border-box",
};

const desktopPublishedCardStyle: CSSProperties = {
  ...publishedCardStyle,
  flex: "0 0 382px",
  width: "382px",
  maxWidth: "100%",
  gridTemplateColumns: "98px minmax(0, 1fr)",
  gap: "14px",
  padding: "12px",
  borderRadius: "24px",
  boxShadow:
    "0 18px 42px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05)",
};

const coverPlaceholderStyle: CSSProperties = {
  minHeight: "116px",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  backgroundImage:
    "radial-gradient(circle at top left, rgba(34,197,94,0.18), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 70%, transparent), transparent 38%), linear-gradient(135deg, #18181B 0%, #0F0F0F 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  textDecoration: "none",
  display: "block",
};

const desktopCoverPlaceholderStyle: CSSProperties = {
  minHeight: "126px",
  borderRadius: "18px",
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
  fontSize: "10px",
  fontWeight: 950,
  textAlign: "center",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const coverGenreStyle: CSSProperties = {
  position: "absolute",
  left: "8px",
  right: "8px",
  bottom: "8px",
  maxWidth: "calc(100% - 16px)",
  padding: "6px 8px",
  borderRadius: "999px",
  background: "rgba(11, 6, 20, 0.76)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 900,
  textAlign: "center",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const publishedInfoStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  display: "grid",
  alignContent: "center",
  gap: "7px",
};

const cardTopRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "8px",
  minWidth: 0,
};

const publishedTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "20px",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const desktopPublishedTitleStyle: CSSProperties = {
  ...publishedTitleStyle,
  fontSize: "21px",
  lineHeight: 1.06,
};

const statusRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  maxWidth: "100%",
  minWidth: 0,
};

const publishedBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.14)",
  border: "1px solid rgba(34, 197, 94, 0.3)",
  color: "#86EFAC",
  fontSize: "10px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const formatBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#E4E4E7",
  fontSize: "10px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const classificationBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)",
  color: "var(--historietas-secondary, #DDD6FE)",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const authorLinkStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  margin: 0,
  color: "#D8C8FF",
  fontSize: "12px",
  fontWeight: 800,
  textDecoration: "none",
  borderBottom: "1px solid rgba(216,200,255,0.20)",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const cardStatsStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  color: "#A1A1AA",
  fontSize: "11px",
  fontWeight: 800,
  maxWidth: "100%",
  minWidth: 0,
};

const progressCompactStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "8px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const progressTrackStyle: CSSProperties = {
  width: "100%",
  height: "7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.1)",
  overflow: "hidden",
  boxSizing: "border-box",
};

const progressBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
};

const progressTextStyle: CSSProperties = {
  color: "#D4D4D8",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

const readNowStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  minHeight: "31px",
  padding: "0 12px",
  marginTop: "3px",
  borderRadius: "999px",
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, #FB923C 100%)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#160A2A",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1.15,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "0 10px 20px color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)",
  ...safeTextStyle,
};

const obraCardStyle: CSSProperties = {
  flex: "0 0 min(352px, 86vw)",
  width: "min(352px, 86vw)",
  scrollSnapAlign: "start",
  display: "grid",
  gridTemplateColumns: "minmax(84px, 94px) minmax(0, 1fr)",
  gap: "13px",
  alignItems: "stretch",
  padding: "10px",
  borderRadius: "22px",
  background:
    "linear-gradient(145deg, rgba(26, 17, 43, 0.96) 0%, rgba(13, 9, 25, 0.98) 100%)",
  border: "1px solid rgba(255,255,255,0.09)",
  color: "#FFFFFF",
  textDecoration: "none",
  minWidth: 0,
  maxWidth: "86vw",
  overflow: "hidden",
  boxShadow: "0 16px 36px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.05)",
  boxSizing: "border-box",
};

const desktopObraCardStyle: CSSProperties = {
  ...obraCardStyle,
  flex: "0 0 382px",
  width: "382px",
  maxWidth: "100%",
  gridTemplateColumns: "98px minmax(0, 1fr)",
  gap: "14px",
  padding: "12px",
  borderRadius: "24px",
  boxShadow:
    "0 18px 42px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05)",
};

const obraCardSoonStyle: CSSProperties = {
  ...obraCardStyle,
  opacity: 0.9,
};

const desktopObraCardSoonStyle: CSSProperties = {
  ...desktopObraCardStyle,
  opacity: 0.9,
};

const coverThumbStyle: CSSProperties = {
  minHeight: "116px",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  backgroundImage:
    "radial-gradient(circle at top left, color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 62%, transparent), transparent 36%), linear-gradient(135deg, #18181B 0%, #0F0F0F 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopCoverThumbStyle: CSSProperties = {
  ...coverThumbStyle,
  minHeight: "126px",
  borderRadius: "18px",
};

const obraInfoStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  display: "grid",
  alignContent: "center",
  gap: "7px",
};

const obraTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "20px",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const desktopObraTitleStyle: CSSProperties = {
  ...obraTitleStyle,
  fontSize: "21px",
  lineHeight: 1.06,
};

const statusBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 850,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const soonBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "rgba(113, 113, 122, 0.18)",
  border: "1px solid rgba(161, 161, 170, 0.22)",
  color: "#D4D4D8",
  fontSize: "10px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const authorStyle: CSSProperties = {
  margin: 0,
  color: "#D8C8FF",
  fontSize: "12px",
  fontWeight: 750,
  maxWidth: "100%",
  ...safeTextStyle,
};

const soonLabelStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  minHeight: "31px",
  padding: "0 12px",
  marginTop: "3px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#FDBA74",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1.15,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const emptyBoxStyle: CSSProperties = {
  padding: "28px",
  borderRadius: "22px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#B3B3B3",
  fontWeight: 800,
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
  overflow: "hidden",
  ...safeTextStyle,
};
