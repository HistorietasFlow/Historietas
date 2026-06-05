"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { obras as obrasCatalogo } from "../data/obras";
import type { Obra as ObraCatalogo } from "../data/obras";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";

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
  autorId?: string;
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
  user_id?: string | null;
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
  user_id?: string | null;
  titulo: string | null;
  texto: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

type RegistroSupabaseGenerico = Record<string, unknown>;

type CapituloSalvo = {
  obra: ObraLocal;
  capitulo: CapituloLocal;
  numeroCapitulo: number;
};

type ObraContinuarLeitura = {
  obra: ObraLocal;
  capitulo: CapituloLocal;
  numeroCapitulo: number;
  ultimaAtividade: string;
  tempoAtividade: number;
  progressoLeitura: number;
  capitulosLidos: number;
};

type AbaBiblioteca =
  | "salvos"
  | "seguindo"
  | "lendo-agora"
  | "historico"
  | "favoritos"
  | "concluidos";

const STORAGE_KEY = "historietas-obras";
const FOLLOW_STORAGE_KEY = "historietas-obras-seguidas";
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

function formatarGeneroBiblioteca(genero: string) {
  const generoLimpo = genero.trim();
  const generoNormalizado = normalizarTexto(generoLimpo);

  if (generoNormalizado === "fantasia sombria") {
    return "Fantasia";
  }

  if (generoNormalizado === "sci-fi" || generoNormalizado === "sci fi") {
    return "Ficção";
  }

  return generoLimpo || "Não informado";
}

function criarPerfilAutorHrefBiblioteca(
  obra: Pick<ObraLocal, "autor" | "autorId">
) {
  const params = new URLSearchParams();
  const autor = obra.autor.trim();

  if (autor) {
    params.set("autor", autor);
  }

  if (obra.autorId?.trim()) {
    params.set("autorId", obra.autorId.trim());
  }

  return `/perfil-autor?${params.toString()}`;
}


function obterImagemObraCatalogoBiblioteca(obra: ObraCatalogo) {
  const obraComImagem = obra as ObraCatalogo & {
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

function criarObraCatalogoBiblioteca(
  obra: ObraCatalogo,
  index: number
): ObraLocal {
  const obraComCamposExtras = obra as ObraCatalogo & {
    id?: string;
    slug?: string;
    link?: string;
    formato?: string;
  };
  const titulo = obra.titulo.trim() || `Obra ${index + 1}`;
  const slug = obraComCamposExtras.slug?.trim() || criarSlugBase(titulo);
  const link =
    obraComCamposExtras.link?.trim() ||
    (obra.disponivel
      ? `/obra/${slug}`
      : `/em-breve?obra=${encodeURIComponent(titulo)}`);

  return {
    id: obraComCamposExtras.id?.trim() || slug,
    titulo,
    autor: obra.autor.trim() || "Autor não informado",
    autorId: "",
    genero: formatarGeneroBiblioteca(obra.genero),
    formato: obraComCamposExtras.formato?.trim() || "História",
    classificacaoIndicativa:
      obra.classificacaoIndicativa.trim() || "Não informada",
    sinopse: obra.sinopse.trim() || "Nenhuma sinopse informada.",
    tags: [formatarGeneroBiblioteca(obra.genero) || "sem tags"],
    capa: obterImagemObraCatalogoBiblioteca(obra),
    capaNome: "",
    arquivoObra: null,
    publicado: Boolean(obra.disponivel),
    capitulos: [],
    criadaEm: "",
    ultimoCapituloLidoId: "",
    ultimaLeituraEm: "",
    progressoLeitura: 0,
    slug,
    link,
  };
}


function criarBookCoverStyle(capa: string, isDesktop = false): CSSProperties {
  const baseStyle = isDesktop ? desktopBookCoverStyle : bookCoverStyle;

  if (!capa) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    background: "#18181B",
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function mostrarClassificacao(obra: ObraLocal) {
  return (
    obra.classificacaoIndicativa &&
    obra.classificacaoIndicativa !== "Não informada"
  );
}

function obterIdentificadoresObra(obra: Pick<ObraLocal, "id" | "slug" | "titulo">) {
  return Array.from(
    new Set(
      [
        obra.id,
        obra.slug,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ].filter((valor): valor is string => typeof valor === "string" && Boolean(valor.trim()))
    )
  );
}

function colecaoTemObra(colecao: string[], obra: Pick<ObraLocal, "id" | "slug" | "titulo">) {
  const ids = new Set(colecao.filter((item) => typeof item === "string"));

  return obterIdentificadoresObra(obra).some((identificador) => ids.has(identificador));
}

function removerObraDaColecao(colecao: string[], obra: Pick<ObraLocal, "id" | "slug" | "titulo">) {
  const identificadores = new Set(obterIdentificadoresObra(obra));

  return colecao.filter((item) => !identificadores.has(item));
}

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
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
        : `Capítulo ${index + 1}`,
    texto:
      typeof capitulo.texto === "string" && capitulo.texto.trim()
        ? capitulo.texto
        : "Nenhum texto foi escrito ainda.",
    curtiu: Boolean(capitulo.curtiu),
    salvo: Boolean(capitulo.salvo),
    comentario:
      typeof capitulo.comentario === "string" ? capitulo.comentario : "",
    criadoEm:
      typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
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

function normalizarObra(obra: Partial<ObraLocal>, index: number): ObraLocal {
  const capitulosNormalizados: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapitulo(capitulo, capituloIndex)
      )
    : [];

  const ultimoCapituloLidoId =
    typeof obra.ultimoCapituloLidoId === "string" &&
    capitulosNormalizados.some(
      (capitulo) => capitulo.id === obra.ultimoCapituloLidoId
    )
      ? obra.ultimoCapituloLidoId
      : "";

  return {
    id:
      typeof obra.id === "string" && obra.id.trim()
        ? obra.id
        : `obra-${index + 1}`,
    titulo:
      typeof obra.titulo === "string" && obra.titulo.trim()
        ? obra.titulo
        : "Obra sem título",
    autor:
      typeof obra.autor === "string" && obra.autor.trim()
        ? obra.autor
        : "Autor não informado",
    autorId:
      typeof obra.autorId === "string" && obra.autorId.trim()
        ? obra.autorId.trim()
        : "",
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
    tags: Array.isArray(obra.tags)
      ? obra.tags.filter((tag): tag is string => typeof tag === "string")
      : ["sem tags"],
    capa: typeof obra.capa === "string" ? obra.capa : "",
    capaNome: typeof obra.capaNome === "string" ? obra.capaNome : "",
    arquivoObra: normalizarArquivoObra(obra.arquivoObra),
    publicado: Boolean(obra.publicado),
    capitulos: capitulosNormalizados,
    criadaEm: typeof obra.criadaEm === "string" ? obra.criadaEm : "",
    ultimoCapituloLidoId,
    ultimaLeituraEm:
      typeof obra.ultimaLeituraEm === "string" ? obra.ultimaLeituraEm : "",
    progressoLeitura: calcularProgressoLeitura(capitulosNormalizados),
    slug:
      typeof obra.slug === "string" && obra.slug.trim()
        ? obra.slug
        : criarSlugBase(
            typeof obra.titulo === "string" && obra.titulo.trim()
              ? obra.titulo
              : `obra-${index + 1}`
          ),
    link:
      typeof obra.link === "string" && obra.link.trim()
        ? obra.link
        : `/obra/${
            typeof obra.slug === "string" && obra.slug.trim()
              ? obra.slug
              : criarSlugBase(
                  typeof obra.titulo === "string" && obra.titulo.trim()
                    ? obra.titulo
                    : `obra-${index + 1}`
                )
          }`,
  };
}

function formatarData(dataIso: string) {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return "Não registrada";
  }

  return data.toLocaleDateString("pt-BR");
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

  const capitulosAtivos = obra.capitulos.filter(
    (capitulo) =>
      capitulo.lido ||
      capitulo.salvo ||
      capitulo.curtiu ||
      capitulo.comentario.trim()
  );

  return capitulosAtivos[capitulosAtivos.length - 1] || null;
}

function obterTempoData(dataIso: string) {
  const tempo = new Date(dataIso).getTime();

  if (Number.isNaN(tempo)) {
    return 0;
  }

  return tempo;
}

function obterUltimaAtividadeDaObra(obra: ObraLocal) {
  const tempos = [
    obterTempoData(obra.ultimaLeituraEm),
    ...obra.capitulos.map((capitulo) =>
      Math.max(
        obterTempoData(capitulo.lidoEm),
        obterTempoData(capitulo.criadoEm)
      )
    ),
  ];

  return Math.max(0, ...tempos);
}

function normalizarCategoriaArquivoSupabase(
  categoria: string | null | undefined,
  tipo?: string | null
): ArquivoObraLocal["categoria"] {
  if (
    categoria === "texto" ||
    categoria === "documento" ||
    categoria === "imagem" ||
    categoria === "outro"
  ) {
    return categoria;
  }

  const tipoNormalizado = (tipo || "").toLowerCase();

  if (tipoNormalizado.startsWith("image/")) {
    return "imagem";
  }

  if (tipoNormalizado.includes("pdf")) {
    return "documento";
  }

  if (
    tipoNormalizado.startsWith("text/") ||
    tipoNormalizado.includes("markdown")
  ) {
    return "texto";
  }

  return "outro";
}

function obterTextoRegistro(registro: RegistroSupabaseGenerico, chave: string) {
  const valor = registro[chave];

  if (typeof valor === "string") {
    return valor.trim();
  }

  if (typeof valor === "number" || typeof valor === "boolean") {
    return String(valor);
  }

  return "";
}

function obterIdObraRegistro(registro: RegistroSupabaseGenerico) {
  return (
    obterTextoRegistro(registro, "obra_id") ||
    obterTextoRegistro(registro, "obraId") ||
    obterTextoRegistro(registro, "id_obra")
  );
}

function obterIdCapituloRegistro(registro: RegistroSupabaseGenerico) {
  return (
    obterTextoRegistro(registro, "capitulo_id") ||
    obterTextoRegistro(registro, "capituloId") ||
    obterTextoRegistro(registro, "id_capitulo")
  );
}

function criarChaveInteracao(obraId: string, capituloId: string) {
  return `${obraId}::${capituloId}`;
}

function obterTextoComentarioRegistro(registro: RegistroSupabaseGenerico) {
  return (
    obterTextoRegistro(registro, "comentario") ||
    obterTextoRegistro(registro, "texto") ||
    obterTextoRegistro(registro, "conteudo")
  );
}

async function carregarLinhasUsuarioSupabase(
  tabela: string,
  userId: string,
  obraIds: string[]
) {
  if (!userId) {
    return [] as RegistroSupabaseGenerico[];
  }

  try {
    const consultaComObra = obraIds.length > 0
      ? await supabase
          .from(tabela)
          .select("*")
          .eq("user_id", userId)
          .in("obra_id", obraIds)
      : await supabase.from(tabela).select("*").eq("user_id", userId);

    if (!consultaComObra.error) {
      return Array.isArray(consultaComObra.data)
        ? (consultaComObra.data as RegistroSupabaseGenerico[])
        : [];
    }

    const consultaSemObra = await supabase
      .from(tabela)
      .select("*")
      .eq("user_id", userId);

    if (consultaSemObra.error) {
      console.warn(
        `Não consegui carregar ${tabela} no Supabase:`,
        consultaSemObra.error.message
      );
      return [];
    }

    return Array.isArray(consultaSemObra.data)
      ? (consultaSemObra.data as RegistroSupabaseGenerico[])
      : [];
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} no Supabase:`, error);
    return [];
  }
}

function criarSetObrasPorRegistro(registros: RegistroSupabaseGenerico[]) {
  return new Set(
    registros
      .map((registro) => obterIdObraRegistro(registro))
      .filter((obraId) => Boolean(obraId))
  );
}

function criarSetCapitulosPorRegistro(registros: RegistroSupabaseGenerico[]) {
  return new Set(
    registros
      .flatMap((registro) => {
        const obraId = obterIdObraRegistro(registro);
        const capituloId = obterIdCapituloRegistro(registro);

        if (!capituloId) {
          return [] as string[];
        }

        return obraId
          ? [criarChaveInteracao(obraId, capituloId), capituloId]
          : [capituloId];
      })
      .filter((chave) => Boolean(chave))
  );
}

function criarMapaComentariosPorRegistro(
  registros: RegistroSupabaseGenerico[]
) {
  const mapa = new Map<string, string>();

  registros.forEach((registro) => {
    const obraId = obterIdObraRegistro(registro);
    const capituloId = obterIdCapituloRegistro(registro);
    const comentario = obterTextoComentarioRegistro(registro);

    if (!capituloId || !comentario) {
      return;
    }

    if (obraId) {
      mapa.set(criarChaveInteracao(obraId, capituloId), comentario);
    }

    mapa.set(capituloId, comentario);
  });

  return mapa;
}

function converterObraSupabaseParaLocal({
  obraBanco,
  capitulosBanco,
  obraLocal,
  capitulosSalvos,
  capitulosCurtidos,
  capitulosLidos,
  comentariosCapitulos,
  index,
}: {
  obraBanco: SupabaseObraRow;
  capitulosBanco: SupabaseCapituloRow[];
  obraLocal?: ObraLocal;
  capitulosSalvos: Set<string>;
  capitulosCurtidos: Set<string>;
  capitulosLidos: Set<string>;
  comentariosCapitulos: Map<string, string>;
  index: number;
}): ObraLocal {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo])
  );

  const capitulosRemotos = capitulosBanco.map((capitulo, capituloIndex) => {
    const capituloLocal = capitulosLocaisPorId.get(capitulo.id);
    const chaveInteracao = criarChaveInteracao(obraBanco.id, capitulo.id);
    const comentarioSupabase =
      comentariosCapitulos.get(chaveInteracao) ||
      comentariosCapitulos.get(capitulo.id) ||
      "";
    const lidoSupabase = capitulosLidos.has(chaveInteracao) || capitulosLidos.has(capitulo.id);

    return {
      id: capitulo.id,
      titulo:
        capitulo.titulo?.trim() ||
        capituloLocal?.titulo ||
        `Capítulo ${capituloIndex + 1}`,
      texto:
        typeof capitulo.texto === "string"
          ? capitulo.texto
          : capituloLocal?.texto || "Nenhum texto foi escrito ainda.",
      curtiu:
        Boolean(capituloLocal?.curtiu) ||
        capitulosCurtidos.has(chaveInteracao) ||
        capitulosCurtidos.has(capitulo.id),
      salvo:
        Boolean(capituloLocal?.salvo) ||
        capitulosSalvos.has(chaveInteracao) ||
        capitulosSalvos.has(capitulo.id),
      comentario: comentarioSupabase || capituloLocal?.comentario || "",
      criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
      lido: Boolean(capituloLocal?.lido) || lidoSupabase,
      lidoEm:
        capituloLocal?.lidoEm ||
        (lidoSupabase ? capitulo.atualizado_em || capitulo.criado_em || "" : ""),
    } satisfies CapituloLocal;
  });

  const capitulosRemotosIds = new Set(
    capitulosRemotos.map((capitulo) => capitulo.id)
  );
  const capitulosApenasLocais = (obraLocal?.capitulos || []).filter(
    (capitulo) => !capitulosRemotosIds.has(capitulo.id)
  );
  const capitulosMesclados = [...capitulosRemotos, ...capitulosApenasLocais];

  const tituloObra =
    obraBanco.titulo?.trim() || obraLocal?.titulo || "Obra sem título";
  const slugObra =
    obraBanco.slug?.trim() ||
    obraLocal?.slug ||
    criarSlugBase(tituloObra || `obra-${index + 1}`);
  const arquivoUrl = obraBanco.arquivo_url?.trim() || "";
  const arquivoCategoria = normalizarCategoriaArquivoSupabase(
    obraBanco.arquivo_categoria,
    obraBanco.arquivo_tipo
  );

  return {
    id: obraBanco.id || obraLocal?.id || `obra-${index + 1}`,
    titulo: tituloObra,
    autor: obraBanco.autor?.trim() || obraLocal?.autor || "Autor não informado",
    autorId: obraBanco.user_id?.trim() || obraLocal?.autorId || "",
    genero: obraBanco.genero?.trim() || obraLocal?.genero || "Não informado",
    formato: obraBanco.formato?.trim() || obraLocal?.formato || "Não informado",
    classificacaoIndicativa:
      obraBanco.classificacao_indicativa?.trim() ||
      obraLocal?.classificacaoIndicativa ||
      "Não informada",
    sinopse:
      obraBanco.sinopse?.trim() ||
      obraLocal?.sinopse ||
      "Nenhuma sinopse informada.",
    tags:
      Array.isArray(obraBanco.tags) && obraBanco.tags.length > 0
        ? obraBanco.tags.filter((tag) => typeof tag === "string" && Boolean(tag.trim()))
        : obraLocal?.tags || ["sem tags"],
    capa: obraBanco.capa_url?.trim() || obraLocal?.capa || "",
    capaNome: obraBanco.capa_nome?.trim() || obraLocal?.capaNome || "",
    arquivoObra: arquivoUrl
      ? {
          nome:
            obraBanco.arquivo_nome?.trim() ||
            obraLocal?.arquivoObra?.nome ||
            "Arquivo da obra",
          tipo: obraBanco.arquivo_tipo?.trim() || obraLocal?.arquivoObra?.tipo || "",
          tamanho:
            typeof obraBanco.arquivo_tamanho === "number" &&
            Number.isFinite(obraBanco.arquivo_tamanho)
              ? obraBanco.arquivo_tamanho
              : obraLocal?.arquivoObra?.tamanho || 0,
          conteudo: arquivoUrl,
          categoria: arquivoCategoria,
          criadoEm: obraBanco.criada_em || obraLocal?.arquivoObra?.criadoEm || "",
        }
      : obraLocal?.arquivoObra || null,
    publicado: Boolean(obraBanco.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obraBanco.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    slug: slugObra,
    link: obraBanco.link?.trim() || obraLocal?.link || `/obra/${slugObra}`,
  };
}

function mesclarObrasBiblioteca(
  obrasLocais: ObraLocal[],
  obrasSupabase: ObraLocal[]
) {
  const obrasMescladas: ObraLocal[] = [...obrasLocais];

  obrasSupabase.forEach((obraSupabase) => {
    const indiceExistente = obrasMescladas.findIndex((obraLocal) => {
      const slugLocal = obraLocal.slug || criarSlugBase(obraLocal.titulo);
      const slugSupabase = obraSupabase.slug || criarSlugBase(obraSupabase.titulo);

      return obraLocal.id === obraSupabase.id || slugLocal === slugSupabase;
    });

    if (indiceExistente >= 0) {
      obrasMescladas[indiceExistente] = {
        ...obrasMescladas[indiceExistente],
        ...obraSupabase,
      };
      return;
    }

    obrasMescladas.unshift(obraSupabase);
  });

  return obrasMescladas;
}

async function carregarBibliotecaSupabase(
  obrasLocais: ObraLocal[],
  obrasFavoritasLocais: string[],
  obrasConcluidasLocais: string[]
) {
  try {
    let userId = "";

    try {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id || "";
    } catch {
      userId = "";
    }

    const { data: obrasBanco, error: erroObras } = await supabase
      .from("obras")
      .select("*")
      .eq("publicado", true)
      .order("criada_em", { ascending: false });

    if (erroObras) {
      console.warn(
        "Não consegui carregar obras publicadas na Biblioteca:",
        erroObras.message
      );

      return {
        obras: obrasLocais,
        favoritas: obrasFavoritasLocais,
        concluidas: obrasConcluidasLocais,
      };
    }

    const obrasSupabaseBanco = Array.isArray(obrasBanco)
      ? (obrasBanco as SupabaseObraRow[])
      : [];
    const obraIds = obrasSupabaseBanco
      .map((obra) => obra.id)
      .filter((obraId) => Boolean(obraId));

    if (obraIds.length === 0) {
      return {
        obras: obrasLocais,
        favoritas: obrasFavoritasLocais,
        concluidas: obrasConcluidasLocais,
      };
    }

    const { data: capitulosBanco, error: erroCapitulos } = await supabase
      .from("capitulos")
      .select("*")
      .in("obra_id", obraIds)
      .order("ordem", { ascending: true });

    if (erroCapitulos) {
      console.warn(
        "Não consegui carregar capítulos na Biblioteca:",
        erroCapitulos.message
      );
    }

    const capitulosSupabaseBanco = erroCapitulos
      ? []
      : Array.isArray(capitulosBanco)
      ? (capitulosBanco as SupabaseCapituloRow[])
      : [];

    const [
      favoritosBanco,
      concluidasBanco,
      salvosCapitulosBanco,
      curtidasCapitulosBanco,
      comentariosCapitulosBanco,
      progressoLeituraBanco,
    ] = await Promise.all([
      carregarLinhasUsuarioSupabase("favoritos", userId, obraIds),
      carregarLinhasUsuarioSupabase("concluidas", userId, obraIds),
      carregarLinhasUsuarioSupabase("salvos_capitulos", userId, obraIds),
      carregarLinhasUsuarioSupabase("curtidas_capitulos", userId, obraIds),
      carregarLinhasUsuarioSupabase("comentarios_capitulos", userId, obraIds),
      carregarLinhasUsuarioSupabase("progresso_leitura", userId, obraIds),
    ]);

    const favoritosSupabase = criarSetObrasPorRegistro(favoritosBanco);
    const concluidasSupabase = criarSetObrasPorRegistro(concluidasBanco);
    const capitulosSalvos = criarSetCapitulosPorRegistro(salvosCapitulosBanco);
    const capitulosCurtidos = criarSetCapitulosPorRegistro(curtidasCapitulosBanco);
    const capitulosLidos = criarSetCapitulosPorRegistro(progressoLeituraBanco);
    const comentariosCapitulos = criarMapaComentariosPorRegistro(
      comentariosCapitulosBanco
    );

    const obrasSupabase = obrasSupabaseBanco.map((obraBanco, index) => {
      const obraLocal = obrasLocais.find((obraAtual) => {
        const slugLocal = obraAtual.slug || criarSlugBase(obraAtual.titulo);
        const slugBanco = obraBanco.slug?.trim() || criarSlugBase(obraBanco.titulo || "");

        return obraAtual.id === obraBanco.id || slugLocal === slugBanco;
      });

      const capitulosDaObra = capitulosSupabaseBanco.filter(
        (capitulo) => capitulo.obra_id === obraBanco.id
      );

      return converterObraSupabaseParaLocal({
        obraBanco,
        capitulosBanco: capitulosDaObra,
        obraLocal,
        capitulosSalvos,
        capitulosCurtidos,
        capitulosLidos,
        comentariosCapitulos,
        index,
      });
    });

    const obrasMescladas = mesclarObrasBiblioteca(obrasLocais, obrasSupabase);

    return {
      obras: obrasMescladas,
      favoritas: Array.from(
        new Set([...obrasFavoritasLocais, ...Array.from(favoritosSupabase)])
      ),
      concluidas: Array.from(
        new Set([...obrasConcluidasLocais, ...Array.from(concluidasSupabase)])
      ),
    };
  } catch (error) {
    console.warn("Não consegui acessar o Supabase na Biblioteca:", error);

    return {
      obras: obrasLocais,
      favoritas: obrasFavoritasLocais,
      concluidas: obrasConcluidasLocais,
    };
  }
}

async function carregarObrasSeguidasSupabase(obrasDisponiveis: ObraLocal[]) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    if (!userId) {
      return [] as string[];
    }

    const obraIds = obrasDisponiveis.map((obra) => obra.id).filter(Boolean);
    const registros = await carregarLinhasUsuarioSupabase(
      "seguindo_obras",
      userId,
      obraIds
    );

    return Array.from(criarSetObrasPorRegistro(registros));
  } catch (error) {
    console.warn("Não consegui carregar obras seguidas no Supabase:", error);
    return [] as string[];
  }
}

async function sincronizarSeguirObraSupabase(obraId: string, ativo: boolean) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;

    if (!userId || !obraId) {
      return;
    }

    if (ativo) {
      await supabase.from("seguindo_obras").upsert(
        {
          user_id: userId,
          obra_id: obraId,
        },
        { onConflict: "user_id,obra_id" }
      );
      return;
    }

    await supabase
      .from("seguindo_obras")
      .delete()
      .eq("user_id", userId)
      .eq("obra_id", obraId);
  } catch (error) {
    console.warn("Não consegui sincronizar seguindo no Supabase:", error);
  }
}

async function sincronizarColecaoObraSupabase(
  tabela: "favoritos" | "concluidas",
  obraId: string,
  ativo: boolean
) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;

    if (!userId) {
      return;
    }

    await supabase
      .from(tabela)
      .delete()
      .eq("user_id", userId)
      .eq("obra_id", obraId);

    if (ativo) {
      await supabase.from(tabela).insert({
        user_id: userId,
        obra_id: obraId,
      });
    }
  } catch (error) {
    console.warn(`Não consegui sincronizar ${tabela} no Supabase:`, error);
  }
}

async function removerCapituloSalvoSupabase(obraId: string, capituloId: string) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    let query = supabase
      .from("salvos_capitulos")
      .delete()
      .eq("obra_id", obraId)
      .eq("capitulo_id", capituloId);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    await query;
  } catch (error) {
    console.warn("Não consegui remover salvo no Supabase:", error);
  }
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

function criarDecoracaoBibliotecaStyle(index: number): CSSProperties {
  const posicoes: CSSProperties[] = [
    { top: "8%", right: "8%", fontSize: "42px", transform: "rotate(-12deg)" },
    { top: "45%", right: "14%", fontSize: "28px", transform: "rotate(16deg)" },
    { bottom: "12%", right: "7%", fontSize: "34px", transform: "rotate(8deg)" },
    { top: "18%", left: "8%", fontSize: "22px", transform: "rotate(14deg)" },
  ];

  return {
    position: "absolute",
    color: "var(--historietas-accent, #FDBA74)",
    opacity: 0.105,
    lineHeight: 1,
    fontWeight: 950,
    filter: "drop-shadow(0 0 18px color-mix(in srgb, var(--historietas-accent, #F97316) 26%, transparent))",
    userSelect: "none",
    ...posicoes[index % posicoes.length],
  };
}

export default function BibliotecaPage() {
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [obrasSeguidas, setObrasSeguidas] = useState<string[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroObra, setFiltroObra] = useState("todas");
  const [abaAtiva, setAbaAtiva] = useState<AbaBiblioteca | "">("salvos");
  const [isDesktop, setIsDesktop] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

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
    void carregarObras();
  }, []);

  async function carregarObras() {
    let obrasNormalizadas: ObraLocal[] = [];
    let obrasSeguidasNormalizadas: string[] = [];
    let obrasFavoritasNormalizadas: string[] = [];
    let obrasConcluidasNormalizadas: string[] = [];

    try {
      const obrasSalvasTexto = localStorage.getItem(STORAGE_KEY);
      const obrasSalvasJson = obrasSalvasTexto
        ? JSON.parse(obrasSalvasTexto)
        : [];

      const obrasSalvas: ObraLocal[] = Array.isArray(obrasSalvasJson)
        ? obrasSalvasJson
        : [];

      obrasNormalizadas = obrasSalvas.map(normalizarObra);

      const obrasSeguidasTexto = localStorage.getItem(FOLLOW_STORAGE_KEY);
      const obrasSeguidasJson = obrasSeguidasTexto
        ? JSON.parse(obrasSeguidasTexto)
        : [];

      obrasSeguidasNormalizadas = Array.isArray(obrasSeguidasJson)
        ? obrasSeguidasJson.filter(
            (id): id is string => typeof id === "string"
          )
        : [];

      const obrasFavoritasTexto = localStorage.getItem(FAVORITES_STORAGE_KEY);
      const obrasFavoritasJson = obrasFavoritasTexto
        ? JSON.parse(obrasFavoritasTexto)
        : [];

      obrasFavoritasNormalizadas = Array.isArray(obrasFavoritasJson)
        ? obrasFavoritasJson.filter(
            (id): id is string => typeof id === "string"
          )
        : [];

      const obrasConcluidasTexto = localStorage.getItem(COMPLETED_STORAGE_KEY);
      const obrasConcluidasJson = obrasConcluidasTexto
        ? JSON.parse(obrasConcluidasTexto)
        : [];

      obrasConcluidasNormalizadas = Array.isArray(obrasConcluidasJson)
        ? obrasConcluidasJson.filter(
            (id): id is string => typeof id === "string"
          )
        : [];
    } catch {
      obrasNormalizadas = [];
      obrasSeguidasNormalizadas = [];
      obrasFavoritasNormalizadas = [];
      obrasConcluidasNormalizadas = [];
    }

    const bibliotecaSupabase = await carregarBibliotecaSupabase(
      obrasNormalizadas,
      obrasFavoritasNormalizadas,
      obrasConcluidasNormalizadas
    );

    obrasNormalizadas = bibliotecaSupabase.obras.map(normalizarObra);
    obrasFavoritasNormalizadas = bibliotecaSupabase.favoritas;
    obrasConcluidasNormalizadas = bibliotecaSupabase.concluidas;

    const obrasSeguidasSupabase = await carregarObrasSeguidasSupabase(
      obrasNormalizadas
    );

    obrasSeguidasNormalizadas = Array.from(
      new Set([...obrasSeguidasNormalizadas, ...obrasSeguidasSupabase])
    );

    const obrasCatalogoNormalizadas = obrasCatalogo.map(
      criarObraCatalogoBiblioteca
    );
    const obrasParaExibir = mesclarObrasBiblioteca(
      obrasCatalogoNormalizadas,
      obrasNormalizadas
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasNormalizadas));
    localStorage.setItem(
      FOLLOW_STORAGE_KEY,
      JSON.stringify(obrasSeguidasNormalizadas)
    );
    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(obrasFavoritasNormalizadas)
    );
    localStorage.setItem(
      COMPLETED_STORAGE_KEY,
      JSON.stringify(obrasConcluidasNormalizadas)
    );

    setObras(obrasParaExibir);
    setObrasSeguidas(obrasSeguidasNormalizadas);
    setObrasFavoritas(obrasFavoritasNormalizadas);
    setObrasConcluidas(obrasConcluidasNormalizadas);
  }

  const capitulosSalvos = useMemo(() => {
    const salvos: CapituloSalvo[] = [];

    obras.forEach((obra) => {
      obra.capitulos.forEach((capitulo, index) => {
        if (capitulo.salvo) {
          salvos.push({
            obra,
            capitulo,
            numeroCapitulo: index + 1,
          });
        }
      });
    });

    return salvos;
  }, [obras]);

  const obrasComSalvos = useMemo(() => {
    return obras.filter((obra) =>
      obra.capitulos.some((capitulo) => capitulo.salvo)
    );
  }, [obras]);

  const obrasSeguidasLista = useMemo(() => {
    return obras.filter((obra) => colecaoTemObra(obrasSeguidas, obra));
  }, [obras, obrasSeguidas]);

  const obrasLendoAgora = useMemo(() => {
    return obras.filter((obra) =>
      obra.capitulos.some(
        (capitulo) =>
          capitulo.lido ||
          capitulo.salvo ||
          capitulo.curtiu ||
          capitulo.comentario.trim()
      )
    );
  }, [obras]);

  const obrasContinuarLeitura = useMemo<ObraContinuarLeitura[]>(() => {
    return obrasLendoAgora
      .map((obra) => {
        const capitulo = encontrarCapituloParaContinuar(obra);

        if (!capitulo) {
          return null;
        }

        const numeroCapitulo =
          obra.capitulos.findIndex((item) => item.id === capitulo.id) + 1;
        const ultimaAtividade =
          obra.ultimaLeituraEm || capitulo.lidoEm || capitulo.criadoEm;
        const capitulosLidos = obra.capitulos.filter((item) => item.lido).length;

        return {
          obra,
          capitulo,
          numeroCapitulo,
          ultimaAtividade,
          tempoAtividade: Math.max(
            obterTempoData(ultimaAtividade),
            obterUltimaAtividadeDaObra(obra)
          ),
          progressoLeitura: calcularProgressoLeitura(obra.capitulos),
          capitulosLidos,
        };
      })
      .filter((item): item is ObraContinuarLeitura => Boolean(item))
      .sort((itemA, itemB) => itemB.tempoAtividade - itemA.tempoAtividade)
      .slice(0, 3);
  }, [obrasLendoAgora]);

  const obrasHistoricoLeitura = useMemo<ObraContinuarLeitura[]>(() => {
    return obrasLendoAgora
      .map((obra) => {
        const capitulo = encontrarCapituloParaContinuar(obra);

        if (!capitulo) {
          return null;
        }

        const numeroCapitulo =
          obra.capitulos.findIndex((item) => item.id === capitulo.id) + 1;
        const ultimaAtividade =
          obra.ultimaLeituraEm || capitulo.lidoEm || capitulo.criadoEm;
        const capitulosLidos = obra.capitulos.filter((item) => item.lido).length;

        return {
          obra,
          capitulo,
          numeroCapitulo,
          ultimaAtividade,
          tempoAtividade: Math.max(
            obterTempoData(ultimaAtividade),
            obterUltimaAtividadeDaObra(obra)
          ),
          progressoLeitura: calcularProgressoLeitura(obra.capitulos),
          capitulosLidos,
        };
      })
      .filter((item): item is ObraContinuarLeitura => Boolean(item))
      .sort((itemA, itemB) => itemB.tempoAtividade - itemA.tempoAtividade);
  }, [obrasLendoAgora]);

  const obrasFavoritasLista = useMemo(() => {
    return obras.filter((obra) => colecaoTemObra(obrasFavoritas, obra));
  }, [obras, obrasFavoritas]);

  const obrasConcluidasLista = useMemo(() => {
    return obras.filter((obra) => colecaoTemObra(obrasConcluidas, obra));
  }, [obras, obrasConcluidas]);

  const termoBusca = normalizarTexto(busca);

  const capitulosFiltrados = useMemo(() => {
    return capitulosSalvos.filter((item) => {
      const passaObra =
        filtroObra === "todas" ? true : item.obra.id === filtroObra;

      const textoBusca = normalizarTexto(
        [
          item.capitulo.titulo,
          item.capitulo.texto,
          item.capitulo.comentario,
          item.obra.titulo,
          item.obra.autor,
          item.obra.genero,
          formatarGeneroBiblioteca(item.obra.genero),
          item.obra.formato,
          item.obra.classificacaoIndicativa,
          item.obra.tags.join(" "),
        ].join(" ")
      );

      const passaBusca = termoBusca ? textoBusca.includes(termoBusca) : true;

      return passaObra && passaBusca;
    });
  }, [capitulosSalvos, filtroObra, termoBusca]);

  const totais = useMemo(() => {
    const capitulosLidos = obras.reduce((total, obra) => {
      return total + obra.capitulos.filter((capitulo) => capitulo.lido).length;
    }, 0);

    return {
      obrasComSalvos: obrasComSalvos.length,
      capitulosSalvos: capitulosSalvos.length,
      capitulosLidos,
      resultados: capitulosFiltrados.length,
      comentarios: capitulosSalvos.filter((item) =>
        item.capitulo.comentario.trim()
      ).length,
      curtidas: capitulosSalvos.filter((item) => item.capitulo.curtiu).length,
      obrasSeguidas: obrasSeguidasLista.length,
      lendoAgora: obrasLendoAgora.length,
      continuarLeitura: obrasContinuarLeitura.length,
      historico: obrasHistoricoLeitura.length,
      favoritos: obrasFavoritasLista.length,
      concluidos: obrasConcluidasLista.length,
      comClassificacao: obras.filter((obra) => mostrarClassificacao(obra))
        .length,
    };
  }, [
    obras,
    obrasComSalvos,
    capitulosSalvos,
    capitulosFiltrados,
    obrasSeguidasLista,
    obrasLendoAgora,
    obrasContinuarLeitura,
    obrasHistoricoLeitura,
    obrasFavoritasLista,
    obrasConcluidasLista,
  ]);

  const abas = [
    {
      id: "salvos" as const,
      titulo: "Salvos",
      total: totais.capitulosSalvos,
    },
    {
      id: "seguindo" as const,
      titulo: "Seguindo",
      total: totais.obrasSeguidas,
    },
    {
      id: "lendo-agora" as const,
      titulo: "Lendo agora",
      total: totais.lendoAgora,
    },
    {
      id: "historico" as const,
      titulo: "Histórico",
      total: totais.historico,
    },
    {
      id: "favoritos" as const,
      titulo: "Minha lista",
      total: totais.favoritos,
    },
    {
      id: "concluidos" as const,
      titulo: "Concluídos",
      total: totais.concluidos,
    },
  ];

  const abaSelecionada: AbaBiblioteca = abaAtiva || "salvos";
  function removerDosSalvos(obraId: string, capituloId: string) {
    void removerCapituloSalvoSupabase(obraId, capituloId);

    const novasObras = obras.map((obra, obraIndex) => {
      const obraNormalizada = normalizarObra(obra, obraIndex);

      if (obraNormalizada.id !== obraId) {
        return obraNormalizada;
      }

      return {
        ...obraNormalizada,
        capitulos: obraNormalizada.capitulos.map((capitulo) => {
          if (capitulo.id !== capituloId) {
            return capitulo;
          }

          return {
            ...capitulo,
            salvo: false,
          };
        }),
      };
    });

    const obrasNormalizadas = novasObras.map((obra, index) =>
      normalizarObra(obra, index)
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasNormalizadas));
    setObras(obrasNormalizadas);
  }

  function deixarDeSeguir(obra: ObraLocal) {
    const novasObrasSeguidas = removerObraDaColecao(obrasSeguidas, obra);

    void sincronizarSeguirObraSupabase(obra.id, false);

    localStorage.setItem(
      FOLLOW_STORAGE_KEY,
      JSON.stringify(novasObrasSeguidas)
    );

    setObrasSeguidas(novasObrasSeguidas);
  }

  function alternarFavorito(obra: ObraLocal) {
    const vaiFavoritar = !colecaoTemObra(obrasFavoritas, obra);
    const novasObrasFavoritas = vaiFavoritar
      ? [...removerObraDaColecao(obrasFavoritas, obra), obra.id]
      : removerObraDaColecao(obrasFavoritas, obra);

    void sincronizarColecaoObraSupabase("favoritos", obra.id, vaiFavoritar);

    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(novasObrasFavoritas)
    );

    setObrasFavoritas(novasObrasFavoritas);
  }

  function alternarConcluido(obra: ObraLocal) {
    const vaiConcluir = !colecaoTemObra(obrasConcluidas, obra);
    const novasObrasConcluidas = vaiConcluir
      ? [...removerObraDaColecao(obrasConcluidas, obra), obra.id]
      : removerObraDaColecao(obrasConcluidas, obra);

    void sincronizarColecaoObraSupabase("concluidas", obra.id, vaiConcluir);

    localStorage.setItem(
      COMPLETED_STORAGE_KEY,
      JSON.stringify(novasObrasConcluidas)
    );

    setObrasConcluidas(novasObrasConcluidas);
  }

  function limparFiltros() {
    setBusca("");
    setFiltroObra("todas");
  }

  const cardsBiblioteca = (
    <section
      className="biblioteca-summary-carousel"
      style={isDesktop ? desktopSummaryBoxStyle : summaryBoxStyle}
      aria-label="Atalhos da Biblioteca"
    >
      {abas.map((aba) => {
        const ativa = abaAtiva === aba.id;

        return (
          <button
            key={aba.id}
            type="button"
            onClick={() => setAbaAtiva((abaAtual) => (abaAtual === aba.id ? "" : aba.id))}
            style={
              ativa
                ? isDesktop
                  ? desktopSummaryItemActiveStyle
                  : summaryItemActiveStyle
                : isDesktop
                  ? desktopSummaryItemStyle
                  : summaryItemStyle
            }
          >
            <strong style={ativa ? summaryNumberActiveStyle : summaryNumberStyle}>
              {aba.total}
            </strong>

            <span style={ativa ? summaryLabelActiveStyle : summaryLabelStyle}>
              {aba.titulo}
            </span>
          </button>
        );
      })}
    </section>
  );

  const mostrarCardsAbaixoDoFiltro =
    abaSelecionada === "salvos" && capitulosSalvos.length > 0;

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${bibliotecaPageCss}`}</style>

      <div style={pageDecorationLayerStyle} aria-hidden="true">
        {["✦", "◇", "▣"].map((decoracao, index) => (
          <span key={`${decoracao}-${index}`} style={criarDecoracaoPaginaStyle(index)}>
            {decoracao}
          </span>
        ))}
      </div>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTitleHeaderStyle : titleHeaderStyle}>
          <Link
            href="/"
            style={isDesktop ? desktopTitleHomeLinkStyle : titleHomeLinkStyle}
            aria-label="Voltar para a Home"
          >
            <span
              className="historietas-theme-title"
              style={isDesktop ? desktopPageTitleTextStyle : pageTitleTextStyle}
            >
              BIBLIOTECA
            </span>
          </Link>
        </header>

        {!mostrarCardsAbaixoDoFiltro && cardsBiblioteca}

        {abaSelecionada === "salvos" && capitulosSalvos.length > 0 && (
          <section style={isDesktop ? desktopFilterBoxStyle : filterBoxStyle}>
            <div style={isDesktop ? desktopFilterGridStyle : filterGridStyle}>
              <div style={fieldBoxStyle}>
                <label style={filterLabelStyle}>Buscar na Biblioteca</label>

                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Capítulo, obra, autor, gênero, classificação..."
                  style={searchInputStyle}
                />
              </div>

              <div style={fieldBoxStyle}>
                <label style={filterLabelStyle}>Filtrar por obra</label>

                <select
                  value={filtroObra}
                  onChange={(event) => setFiltroObra(event.target.value)}
                  style={selectStyle}
                >
                  <option value="todas">Todas as obras</option>

                  {obrasComSalvos.map((obra) => (
                    <option key={obra.id} value={obra.id}>
                      {obra.titulo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {cardsBiblioteca}

            <div style={isDesktop ? desktopFilterFooterStyle : filterFooterStyle}>
              <span style={filterInfoStyle}>
                {totais.resultados} de {totais.capitulosSalvos} salvos
              </span>

            </div>
          </section>
        )}

        {abaSelecionada === "salvos" && (
          <>
            {capitulosSalvos.length === 0 ? (
              <section style={emptyBoxStyle}>
                <h2 style={emptyTitleStyle}>Nenhum capítulo salvo ainda</h2>

                <p style={emptyTextStyle}>
                  Abra um capítulo no leitor e toque em salvar. Depois ele
                  aparecerá aqui.
                </p>

                <Link href="/minhas-obras" style={isDesktop ? desktopEmptyButtonStyle : emptyButtonStyle}>
                  Ir para Minhas Obras
                </Link>
              </section>
            ) : capitulosFiltrados.length === 0 ? (
              <section style={emptyBoxStyle}>
                <h2 style={emptyTitleStyle}>Nenhum resultado encontrado</h2>

                <p style={emptyTextStyle}>
                  Mude a busca ou selecione outra obra no filtro.
                </p>

                <button
                  type="button"
                  onClick={limparFiltros}
                  style={isDesktop ? desktopEmptyButtonStyle : emptyButtonStyle}
                >
                  Limpar filtros
                </button>
              </section>
            ) : (
              <section style={isDesktop ? desktopSavedGridStyle : savedGridStyle}>
                {capitulosFiltrados.map((item) => {
                  const lerHref = `/ler-capitulo?obraId=${item.obra.id}&capituloId=${item.capitulo.id}`;
                  const obraHref =
                    item.obra.link ||
                    `/obra/${item.obra.slug || criarSlugBase(item.obra.titulo)}`;
                  const perfilAutorHref = criarPerfilAutorHrefBiblioteca(item.obra);

                  return (
                    <article
                      key={`${item.obra.id}-${item.capitulo.id}`}
                      style={isDesktop ? desktopSavedCardStyle : savedCardStyle}
                    >
                      <div style={isDesktop ? desktopSavedBookHeaderStyle : savedBookHeaderStyle}>
                        <Link
                          href={obraHref}
                          style={criarBookCoverStyle(item.obra.capa, isDesktop)}
                          aria-label={`Abrir ${item.obra.titulo}`}
                        >
                        </Link>

                        <div style={isDesktop ? desktopSavedBookInfoStyle : savedBookInfoStyle}>
                          <div style={cardTopStyle}>
                            <span style={chapterBadgeStyle}>
                              CAPÍTULO {item.numeroCapitulo}
                            </span>

                            <span style={savedBadgeStyle}>✓ Salvo</span>

                            {item.capitulo.lido && (
                              <span style={readBadgeStyle}>✓ Lido</span>
                            )}

                          </div>

                          <h2 style={chapterTitleStyle}>
                            {item.capitulo.titulo}
                          </h2>

                          <p style={bookInfoStyle}>
                            {item.obra.titulo} • {formatarGeneroBiblioteca(item.obra.genero)} •{" "}
                            {item.obra.formato} •{" "}
                            {item.obra.classificacaoIndicativa}
                          </p>

                          <Link href={perfilAutorHref} style={authorLinkStyle}>
                            Por {item.obra.autor}
                          </Link>

                          {item.capitulo.comentario.trim() && (
                            <p style={commentTextStyle}>
                              Comentário: {item.capitulo.comentario}
                            </p>
                          )}
                        </div>
                      </div>

                      <div style={isDesktop ? desktopPrimaryActionsStyle : primaryActionsStyle}>
                        <Link href={lerHref} style={primaryActionStyle}>
                          Ler capítulo
                        </Link>

                        <Link href={obraHref} style={secondaryActionStyle}>
                          Ver obra
                        </Link>
                      </div>

                      <div style={isDesktop ? desktopSecondaryActionsRowStyle : secondaryActionsRowStyle}>
                        <button
                          type="button"
                          onClick={() => alternarFavorito(item.obra)}
                          style={
                            colecaoTemObra(obrasFavoritas, item.obra)
                              ? favoriteActiveButtonStyle
                              : favoriteButtonStyle
                          }
                        >
                          {colecaoTemObra(obrasFavoritas, item.obra)
                            ? "Na lista"
                            : "Adicionar à lista"}
                        </button>

                        <button
                          type="button"
                          onClick={() => alternarConcluido(item.obra)}
                          style={
                            colecaoTemObra(obrasConcluidas, item.obra)
                              ? completedActiveButtonStyle
                              : completedButtonStyle
                          }
                        >
                          {colecaoTemObra(obrasConcluidas, item.obra)
                            ? "Concluída"
                            : "Concluir"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removerDosSalvos(item.obra.id, item.capitulo.id)
                          }
                          style={removeButtonStyle}
                        >
                          Remover
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        )}

        {abaSelecionada === "seguindo" && (
          <>
            {obrasSeguidasLista.length === 0 ? (
              <section style={emptyBoxStyle}>
                <h2 style={emptyTitleStyle}>Nenhuma obra seguida ainda</h2>

                <p style={emptyTextStyle}>
                  Abra uma obra e toque em Seguir obra. Depois ela aparecerá
                  nesta aba.
                </p>

                <Link href="/explorar" style={isDesktop ? desktopEmptyButtonStyle : emptyButtonStyle}>
                  Explorar obras
                </Link>
              </section>
            ) : (
              <section style={isDesktop ? desktopSavedGridStyle : savedGridStyle}>
                {obrasSeguidasLista.map((obra) => {
                  const obraHref =
                    obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
                  const perfilAutorHref = criarPerfilAutorHrefBiblioteca(obra);
                  const obraFavorita = colecaoTemObra(obrasFavoritas, obra);
                  const obraConcluida = colecaoTemObra(obrasConcluidas, obra);
                  const capituloParaContinuar =
                    encontrarCapituloParaContinuar(obra);
                  const capituloInicial =
                    capituloParaContinuar || obra.capitulos[0] || null;
                  const capituloInicialHref = capituloInicial
                    ? `/ler-capitulo?obraId=${obra.id}&capituloId=${capituloInicial.id}`
                    : "";
                  const capitulosLidos = obra.capitulos.filter(
                    (capitulo) => capitulo.lido
                  ).length;
                  const progressoLeitura = calcularProgressoLeitura(
                    obra.capitulos
                  );

                  return (
                    <article key={obra.id} style={isDesktop ? desktopSavedCardStyle : savedCardStyle}>
                      <div style={isDesktop ? desktopSavedBookHeaderStyle : savedBookHeaderStyle}>
                        <Link
                          href={obraHref}
                          style={criarBookCoverStyle(obra.capa, isDesktop)}
                          aria-label={`Abrir ${obra.titulo}`}
                        >
                        </Link>

                        <div style={isDesktop ? desktopSavedBookInfoStyle : savedBookInfoStyle}>
                          <div style={cardTopStyle}>
                            <span style={followedBadgeStyle}>✓ Seguindo</span>

                            <span style={chapterBadgeStyle}>
                              {obra.capitulos.length}{" "}
                              {obra.capitulos.length === 1
                                ? "capítulo"
                                : "capítulos"}
                            </span>

                            {progressoLeitura > 0 && (
                              <span style={readingBadgeStyle}>
                                {progressoLeitura}% lido
                              </span>
                            )}

                          </div>

                          <h2 style={chapterTitleStyle}>{obra.titulo}</h2>

                          <p style={bookInfoStyle}>
                            {formatarGeneroBiblioteca(obra.genero)} • {obra.formato}
                          </p>

                          <Link href={perfilAutorHref} style={authorLinkStyle}>
                            Por {obra.autor}
                          </Link>
                        </div>
                      </div>

                      <div style={readingProgressTrackStyle}>
                        <div
                          style={{
                            ...readingProgressBarStyle,
                            width: `${progressoLeitura}%`,
                          }}
                        />
                      </div>

                      <div style={isDesktop ? desktopPrimaryActionsStyle : primaryActionsStyle}>
                        <Link href={obraHref} style={secondaryActionStyle}>
                          Ver obra
                        </Link>

                        {capituloInicial ? (
                          <Link
                            href={capituloInicialHref}
                            style={primaryActionStyle}
                          >
                            {capituloParaContinuar
                              ? "Continuar leitura"
                              : "Começar leitura"}
                          </Link>
                        ) : (
                          <span style={disabledActionStyle}>Sem capítulos</span>
                        )}
                      </div>

                      <div style={isDesktop ? desktopSecondaryActionsRowStyle : secondaryActionsRowStyle}>
                        <button
                          type="button"
                          onClick={() => alternarFavorito(obra)}
                          style={
                            obraFavorita
                              ? favoriteActiveButtonStyle
                              : favoriteButtonStyle
                          }
                        >
                          {obraFavorita ? "Na lista" : "Adicionar à lista"}
                        </button>

                        <button
                          type="button"
                          onClick={() => alternarConcluido(obra)}
                          style={
                            obraConcluida
                              ? completedActiveButtonStyle
                              : completedButtonStyle
                          }
                        >
                          {obraConcluida ? "Concluída" : "Concluir"}
                        </button>

                        <button
                          type="button"
                          onClick={() => deixarDeSeguir(obra)}
                          style={removeButtonStyle}
                        >
                          Deixar de seguir
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        )}

        {abaSelecionada === "lendo-agora" && (
          <>
            {obrasLendoAgora.length === 0 ? (
              <section style={emptyBoxStyle}>
                <h2 style={emptyTitleStyle}>Nada em leitura ainda</h2>

                <p style={emptyTextStyle}>
                  Quando você abrir um capítulo no leitor, ele será marcado como
                  lido automaticamente e a obra aparecerá aqui como leitura em
                  andamento.
                </p>

                <Link href="/minhas-obras" style={isDesktop ? desktopEmptyButtonStyle : emptyButtonStyle}>
                  Ir para Minhas Obras
                </Link>
              </section>
            ) : (
              <section style={isDesktop ? desktopSavedGridStyle : savedGridStyle}>
                {obrasLendoAgora.map((obra) => {
                  const obraHref =
                    obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
                  const perfilAutorHref = criarPerfilAutorHrefBiblioteca(obra);
                  const obraFavorita = colecaoTemObra(obrasFavoritas, obra);
                  const obraConcluida = colecaoTemObra(obrasConcluidas, obra);

                  const capitulosAtivos = obra.capitulos.filter(
                    (capitulo) =>
                      capitulo.lido ||
                      capitulo.salvo ||
                      capitulo.curtiu ||
                      capitulo.comentario.trim()
                  );

                  const ultimoCapituloAtivo = encontrarCapituloParaContinuar(obra);

                  const ultimoCapituloIndex = ultimoCapituloAtivo
                    ? obra.capitulos.findIndex(
                        (capitulo) => capitulo.id === ultimoCapituloAtivo.id
                      ) + 1
                    : 0;

                  const continuarHref = ultimoCapituloAtivo
                    ? `/ler-capitulo?obraId=${obra.id}&capituloId=${ultimoCapituloAtivo.id}`
                    : "";

                  const capitulosLidos = obra.capitulos.filter(
                    (capitulo) => capitulo.lido
                  ).length;

                  const progressoLeitura = calcularProgressoLeitura(
                    obra.capitulos
                  );

                  const ultimaLeitura =
                    obra.ultimaLeituraEm ||
                    ultimoCapituloAtivo?.lidoEm ||
                    "";

                  return (
                    <article key={obra.id} style={isDesktop ? desktopSavedCardStyle : savedCardStyle}>
                      <div style={isDesktop ? desktopSavedBookHeaderStyle : savedBookHeaderStyle}>
                        <Link
                          href={obraHref}
                          style={criarBookCoverStyle(obra.capa, isDesktop)}
                          aria-label={`Abrir ${obra.titulo}`}
                        >
                        </Link>

                        <div style={isDesktop ? desktopSavedBookInfoStyle : savedBookInfoStyle}>
                          <div style={cardTopStyle}>
                            <span style={readingBadgeStyle}>Lendo agora</span>

                            <span style={readBadgeStyle}>
                              {capitulosLidos} lidos
                            </span>

                            <span style={chapterBadgeStyle}>
                              {progressoLeitura}% lido
                            </span>

                          </div>

                          <h2 style={chapterTitleStyle}>{obra.titulo}</h2>

                          <p style={bookInfoStyle}>
                            Último capítulo: {ultimoCapituloIndex || "nenhum"} •{" "}
                            Última leitura: {formatarData(ultimaLeitura)}
                          </p>

                          <Link href={perfilAutorHref} style={authorLinkStyle}>
                            Por {obra.autor}
                          </Link>
                        </div>
                      </div>

                      <div style={readingProgressTrackStyle}>
                        <div
                          style={{
                            ...readingProgressBarStyle,
                            width: `${progressoLeitura}%`,
                          }}
                        />
                      </div>

                      <div style={isDesktop ? desktopPrimaryActionsStyle : primaryActionsStyle}>
                        {ultimoCapituloAtivo ? (
                          <Link href={continuarHref} style={primaryActionStyle}>
                            Continuar leitura
                          </Link>
                        ) : (
                          <span style={disabledActionStyle}>Sem leitura</span>
                        )}

                        <Link href={obraHref} style={secondaryActionStyle}>
                          Ver obra
                        </Link>
                      </div>

                      <div style={isDesktop ? desktopSecondaryActionsRowStyle : secondaryActionsRowStyle}>
                        <button
                          type="button"
                          onClick={() => alternarFavorito(obra)}
                          style={
                            obraFavorita
                              ? favoriteActiveButtonStyle
                              : favoriteButtonStyle
                          }
                        >
                          {obraFavorita ? "Na lista" : "Adicionar à lista"}
                        </button>

                        <button
                          type="button"
                          onClick={() => alternarConcluido(obra)}
                          style={
                            obraConcluida
                              ? completedActiveButtonStyle
                              : completedButtonStyle
                          }
                        >
                          {obraConcluida ? "Concluída" : "Concluir"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        )}

        {abaSelecionada === "historico" && (
          <>
            {obrasHistoricoLeitura.length === 0 ? (
              <section style={emptyBoxStyle}>
                <h2 style={emptyTitleStyle}>Nenhum histórico ainda</h2>

                <p style={emptyTextStyle}>
                  Abra capítulos no leitor para criar seu histórico de leitura.
                </p>

                <Link href="/explorar" style={isDesktop ? desktopEmptyButtonStyle : emptyButtonStyle}>
                  Explorar obras
                </Link>
              </section>
            ) : (
              <section style={isDesktop ? desktopSavedGridStyle : savedGridStyle}>
                {obrasHistoricoLeitura.map((item) => {
                  const obra = item.obra;
                  const obraHref =
                    obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
                  const perfilAutorHref = criarPerfilAutorHrefBiblioteca(obra);
                  const continuarHref = `/ler-capitulo?obraId=${obra.id}&capituloId=${item.capitulo.id}`;
                  const obraFavorita = colecaoTemObra(obrasFavoritas, obra);
                  const obraConcluida = colecaoTemObra(obrasConcluidas, obra);

                  return (
                    <article key={`historico-${obra.id}`} style={isDesktop ? desktopSavedCardStyle : savedCardStyle}>
                      <div style={isDesktop ? desktopSavedBookHeaderStyle : savedBookHeaderStyle}>
                        <Link
                          href={obraHref}
                          style={criarBookCoverStyle(obra.capa, isDesktop)}
                          aria-label={`Abrir ${obra.titulo}`}
                        >
                        </Link>

                        <div style={isDesktop ? desktopSavedBookInfoStyle : savedBookInfoStyle}>
                          <div style={cardTopStyle}>
                            <span style={readingBadgeStyle}>Histórico</span>

                            <span style={chapterBadgeStyle}>
                              CAPÍTULO {item.numeroCapitulo}
                            </span>

                            {item.progressoLeitura > 0 && (
                              <span style={readBadgeStyle}>
                                {item.progressoLeitura}% lido
                              </span>
                            )}
                          </div>

                          <h2 style={chapterTitleStyle}>{obra.titulo}</h2>

                          <p style={bookInfoStyle}>
                            Último acesso: {formatarData(item.ultimaAtividade)} •{" "}
                            {item.capitulosLidos}{" "}
                            {item.capitulosLidos === 1 ? "capítulo lido" : "capítulos lidos"}
                          </p>

                          <Link href={perfilAutorHref} style={authorLinkStyle}>
                            Por {obra.autor}
                          </Link>
                        </div>
                      </div>

                      <div style={readingProgressTrackStyle}>
                        <div
                          style={{
                            ...readingProgressBarStyle,
                            width: `${item.progressoLeitura}%`,
                          }}
                        />
                      </div>

                      <div style={isDesktop ? desktopPrimaryActionsStyle : primaryActionsStyle}>
                        <Link href={continuarHref} style={primaryActionStyle}>
                          Continuar leitura
                        </Link>

                        <Link href={obraHref} style={secondaryActionStyle}>
                          Ver obra
                        </Link>
                      </div>

                      <div style={isDesktop ? desktopSecondaryActionsRowStyle : secondaryActionsRowStyle}>
                        <button
                          type="button"
                          onClick={() => alternarFavorito(obra)}
                          style={
                            obraFavorita
                              ? favoriteActiveButtonStyle
                              : favoriteButtonStyle
                          }
                        >
                          {obraFavorita ? "Na lista" : "Adicionar à lista"}
                        </button>

                        <button
                          type="button"
                          onClick={() => alternarConcluido(obra)}
                          style={
                            obraConcluida
                              ? completedActiveButtonStyle
                              : completedButtonStyle
                          }
                        >
                          {obraConcluida ? "Concluída" : "Concluir"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        )}

        {abaSelecionada === "favoritos" && (
          <>
            {obrasFavoritasLista.length === 0 ? (
              <section style={emptyBoxStyle}>
                <h2 style={emptyTitleStyle}>Nenhuma obra na sua lista ainda</h2>

                <p style={emptyTextStyle}>
                  Use o botão Adicionar à lista nos cards da Biblioteca para
                  guardar histórias na sua lista.
                </p>

                <Link href="/explorar" style={isDesktop ? desktopEmptyButtonStyle : emptyButtonStyle}>
                  Explorar obras
                </Link>
              </section>
            ) : (
              <section style={isDesktop ? desktopSavedGridStyle : savedGridStyle}>
                {obrasFavoritasLista.map((obra) => {
                  const obraHref =
                    obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
                  const perfilAutorHref = criarPerfilAutorHrefBiblioteca(obra);
                  const obraConcluida = colecaoTemObra(obrasConcluidas, obra);
                  const capituloParaContinuar =
                    encontrarCapituloParaContinuar(obra);
                  const capituloInicial =
                    capituloParaContinuar || obra.capitulos[0] || null;
                  const capituloInicialHref = capituloInicial
                    ? `/ler-capitulo?obraId=${obra.id}&capituloId=${capituloInicial.id}`
                    : "";
                  const progressoLeitura = calcularProgressoLeitura(
                    obra.capitulos
                  );

                  return (
                    <article key={obra.id} style={isDesktop ? desktopSavedCardStyle : savedCardStyle}>
                      <div style={isDesktop ? desktopSavedBookHeaderStyle : savedBookHeaderStyle}>
                        <Link
                          href={obraHref}
                          style={criarBookCoverStyle(obra.capa, isDesktop)}
                          aria-label={`Abrir ${obra.titulo}`}
                        >
                        </Link>

                        <div style={isDesktop ? desktopSavedBookInfoStyle : savedBookInfoStyle}>
                          <div style={cardTopStyle}>
                            <span style={favoriteBadgeStyle}>Na lista</span>

                            <span style={chapterBadgeStyle}>
                              {obra.capitulos.length}{" "}
                              {obra.capitulos.length === 1
                                ? "capítulo"
                                : "capítulos"}
                            </span>

                            {progressoLeitura > 0 && (
                              <span style={readingBadgeStyle}>
                                {progressoLeitura}% lido
                              </span>
                            )}

                          </div>

                          <h2 style={chapterTitleStyle}>{obra.titulo}</h2>

                          <p style={bookInfoStyle}>
                            {formatarGeneroBiblioteca(obra.genero)} • {obra.formato}
                          </p>

                          <Link href={perfilAutorHref} style={authorLinkStyle}>
                            Por {obra.autor}
                          </Link>
                        </div>
                      </div>

                      {progressoLeitura > 0 && (
                        <div style={readingProgressTrackStyle}>
                          <div
                            style={{
                              ...readingProgressBarStyle,
                              width: `${progressoLeitura}%`,
                            }}
                          />
                        </div>
                      )}

                      <div style={isDesktop ? desktopPrimaryActionsStyle : primaryActionsStyle}>
                        <Link href={obraHref} style={secondaryActionStyle}>
                          Ver obra
                        </Link>

                        {capituloInicial ? (
                          <Link
                            href={capituloInicialHref}
                            style={primaryActionStyle}
                          >
                            {capituloParaContinuar
                              ? "Continuar leitura"
                              : "Começar leitura"}
                          </Link>
                        ) : (
                          <span style={disabledActionStyle}>Sem capítulos</span>
                        )}
                      </div>

                      <div style={isDesktop ? desktopSecondaryActionsRowStyle : secondaryActionsRowStyle}>
                        <button
                          type="button"
                          onClick={() => alternarFavorito(obra)}
                          style={favoriteActiveButtonStyle}
                        >
                          Remover da lista
                        </button>

                        <button
                          type="button"
                          onClick={() => alternarConcluido(obra)}
                          style={
                            obraConcluida
                              ? completedActiveButtonStyle
                              : completedButtonStyle
                          }
                        >
                          {obraConcluida ? "Concluída" : "Concluir"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        )}

        {abaSelecionada === "concluidos" && (
          <>
            {obrasConcluidasLista.length === 0 ? (
              <section style={emptyBoxStyle}>
                <h2 style={emptyTitleStyle}>Nenhuma obra concluída ainda</h2>

                <p style={emptyTextStyle}>
                  Use o botão Concluir nos cards da Biblioteca quando
                  terminar uma obra.
                </p>

                <Link href="/biblioteca" style={isDesktop ? desktopEmptyButtonStyle : emptyButtonStyle}>
                  Voltar para Biblioteca
                </Link>
              </section>
            ) : (
              <section style={isDesktop ? desktopSavedGridStyle : savedGridStyle}>
                {obrasConcluidasLista.map((obra) => {
                  const obraHref =
                    obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
                  const perfilAutorHref = criarPerfilAutorHrefBiblioteca(obra);
                  const obraFavorita = colecaoTemObra(obrasFavoritas, obra);
                  const capituloParaContinuar =
                    encontrarCapituloParaContinuar(obra);
                  const capituloInicial =
                    capituloParaContinuar || obra.capitulos[0] || null;
                  const capituloInicialHref = capituloInicial
                    ? `/ler-capitulo?obraId=${obra.id}&capituloId=${capituloInicial.id}`
                    : "";
                  const progressoLeitura = calcularProgressoLeitura(
                    obra.capitulos
                  );

                  return (
                    <article key={obra.id} style={isDesktop ? desktopSavedCardStyle : savedCardStyle}>
                      <div style={isDesktop ? desktopSavedBookHeaderStyle : savedBookHeaderStyle}>
                        <Link
                          href={obraHref}
                          style={criarBookCoverStyle(obra.capa, isDesktop)}
                          aria-label={`Abrir ${obra.titulo}`}
                        >
                        </Link>

                        <div style={isDesktop ? desktopSavedBookInfoStyle : savedBookInfoStyle}>
                          <div style={cardTopStyle}>
                            <span style={completedBadgeStyle}>Concluída</span>

                            <span style={chapterBadgeStyle}>
                              {obra.capitulos.length}{" "}
                              {obra.capitulos.length === 1
                                ? "capítulo"
                                : "capítulos"}
                            </span>

                            {progressoLeitura > 0 && (
                              <span style={readingBadgeStyle}>
                                {progressoLeitura}% lido
                              </span>
                            )}

                          </div>

                          <h2 style={chapterTitleStyle}>{obra.titulo}</h2>

                          <p style={bookInfoStyle}>
                            {formatarGeneroBiblioteca(obra.genero)} • {obra.formato}
                          </p>

                          <Link href={perfilAutorHref} style={authorLinkStyle}>
                            Por {obra.autor}
                          </Link>
                        </div>
                      </div>

                      {progressoLeitura > 0 && (
                        <div style={readingProgressTrackStyle}>
                          <div
                            style={{
                              ...readingProgressBarStyle,
                              width: `${progressoLeitura}%`,
                            }}
                          />
                        </div>
                      )}

                      <div style={isDesktop ? desktopPrimaryActionsStyle : primaryActionsStyle}>
                        <Link href={obraHref} style={secondaryActionStyle}>
                          Ver obra
                        </Link>

                        {capituloInicial ? (
                          <Link
                            href={capituloInicialHref}
                            style={primaryActionStyle}
                          >
                            Reler obra
                          </Link>
                        ) : (
                          <span style={disabledActionStyle}>Sem capítulos</span>
                        )}
                      </div>

                      <div style={isDesktop ? desktopSecondaryActionsRowStyle : secondaryActionsRowStyle}>
                        <button
                          type="button"
                          onClick={() => alternarFavorito(obra)}
                          style={
                            obraFavorita
                              ? favoriteActiveButtonStyle
                              : favoriteButtonStyle
                          }
                        >
                          {obraFavorita ? "Na lista" : "Adicionar à lista"}
                        </button>

                        <button
                          type="button"
                          onClick={() => alternarConcluido(obra)}
                          style={completedActiveButtonStyle}
                        >
                          Remover concluída
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}

const bibliotecaPageCss = `
  html[data-historietas-tema-visual] nav a[href="/biblioteca"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/biblioteca"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/biblioteca"] {
    background: var(--historietas-bottom-nav-hover-bg, var(--historietas-active-surface, rgba(249,115,22,0.16))) !important;
    border-color: color-mix(in srgb, var(--historietas-accent, #F97316) 32%, transparent) !important;
    color: var(--historietas-accent, #F97316) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/publicar"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"] {
    background: var(--historietas-bottom-nav-main-bg, linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)) !important;
    border-color: var(--historietas-bottom-nav-main-border, color-mix(in srgb, var(--historietas-accent, #F97316) 55%, transparent)) !important;
    color: #FFFFFF !important;
    box-shadow: var(--historietas-bottom-nav-main-shadow, none) !important;
  }

  .biblioteca-summary-carousel {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .biblioteca-summary-carousel::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
`;

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

const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(340px, 48vh)",
  pointerEvents: "none",
  zIndex: 0,
  background:
    "radial-gradient(ellipse at 8% 74%, var(--historietas-glow-primary, rgba(42,20,76,0.54)) 0%, transparent 62%), radial-gradient(ellipse at 76% 68%, var(--historietas-glow-secondary, rgba(32,13,58,0.36)) 0%, transparent 64%), linear-gradient(180deg, var(--historietas-bg-start, rgba(10,6,18,0.98)) 0%, var(--historietas-bg-mid, rgba(18,8,31,0.96)) 42%, transparent 100%)",
  WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 76%, transparent 100%)",
  maskImage: "linear-gradient(180deg, #000 0%, #000 76%, transparent 100%)",
};

const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background:
    "linear-gradient(180deg, var(--historietas-bg-start, rgba(10,6,18,0.98)) 0%, var(--historietas-bg-mid, rgba(14,7,25,0.96)) 34%, transparent 100%), radial-gradient(ellipse 62% 86% at 19% 52%, var(--historietas-glow-primary, rgba(124,58,237,0.32)) 0%, transparent 76%), radial-gradient(ellipse 38% 62% at 91% 54%, var(--historietas-glow-secondary, rgba(249,115,22,0.10)) 0%, transparent 76%)",
  WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 78%, transparent 100%)",
  maskImage: "linear-gradient(180deg, #000 0%, #000 78%, transparent 100%)",
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
  filter: "none",
  zIndex: 0,
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background:
    "radial-gradient(circle at 12% 0%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)), transparent 28%), radial-gradient(circle at 88% 14%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)), transparent 22%), radial-gradient(circle at 50% 100%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)), transparent 30%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 38%, var(--historietas-bg-end, #17101B) 100%)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
  isolation: "isolate",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(880px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "16px 0 12px",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "nowrap",
  marginBottom: "14px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  backdropFilter: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "25px",
  fontWeight: 950,
  letterSpacing: "-0.06em",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
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
  background: "linear-gradient(135deg, var(--historietas-title-from, #F5F3FF) 0%, var(--historietas-title-mid, #F5F3FF) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "var(--historietas-logo-shadow, 0 0 26px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, transparent))",
};


const titleHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  flexWrap: "nowrap",
  margin: "0 auto 14px",
  padding: 0,
  minWidth: 0,
  textAlign: "center",
};

const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  marginBottom: "18px",
};

const titleHomeLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "23px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  flex: "0 1 auto",
  ...safeTextStyle,
};

const desktopTitleHomeLinkStyle: CSSProperties = {
  ...titleHomeLinkStyle,
};

const pageTitleTextStyle: CSSProperties = {
  display: "inline-block",
  marginLeft: 0,
  paddingRight: "0.2em",
  paddingBottom: "0.04em",
  whiteSpace: "nowrap",
  overflow: "visible",
  fontSize: "23px",
  lineHeight: 1.04,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  wordSpacing: "0.11em",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
  textAlign: "center",
  textShadow: "none",
};

const desktopPageTitleTextStyle: CSSProperties = {
  ...pageTitleTextStyle,
};


const heroStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: "30px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent)",
  background:
    "radial-gradient(circle at 12% -4%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 26%, transparent)), transparent 30%), radial-gradient(circle at 18% 42%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 52%, transparent)), transparent 35%), linear-gradient(135deg, var(--historietas-surface, rgba(31,16,52,0.99)) 0%, var(--historietas-surface-strong, rgba(12,7,23,0.99)) 100%)",
  boxShadow: "var(--historietas-hero-shadow, none)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "24px 16px",
  display: "grid",
  gap: "8px",
  minWidth: 0,
  textAlign: "center",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(36px, 9.4vw, 58px)",
  lineHeight: 1.04,
  fontWeight: 950,
  letterSpacing: "-0.072em",
  maxWidth: "100%",
  paddingBottom: "3px",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "none",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: "0 auto",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.55,
  fontWeight: 700,
  maxWidth: "560px",
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const summaryBoxStyle: CSSProperties = {
  marginTop: "8px",
  marginLeft: "-12px",
  marginRight: "-12px",
  display: "flex",
  alignItems: "stretch",
  justifyContent: "flex-start",
  gap: "5px",
  width: "calc(100% + 24px)",
  minWidth: 0,
  maxWidth: "calc(100% + 24px)",
  overflowX: "auto",
  overflowY: "hidden",
  padding: "0 12px",
  scrollSnapType: "x proximity",
  boxSizing: "border-box",
};

const summaryItemStyle: CSSProperties = {
  flex: "0 0 84px",
  scrollSnapAlign: "start",
  borderRadius: "11px",
  background:
    "linear-gradient(145deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 11%, var(--historietas-surface, rgba(255,255,255,0.06))) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.82)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.085))",
  padding: "4px 4px",
  minHeight: "46px",
  display: "grid",
  gap: "1px",
  alignContent: "center",
  justifyItems: "center",
  minWidth: 0,
  overflow: "hidden",
  color: "var(--historietas-text-primary, #FFFFFF)",
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  appearance: "none",
  boxShadow: "none",
};

const summaryItemActiveStyle: CSSProperties = {
  ...summaryItemStyle,
  background:
    "linear-gradient(135deg, var(--historietas-secondary, #7C3AED) 0%, var(--historietas-accent, #F97316) 100%)",
  border: "1px solid rgba(255,255,255,0.22)",
};

const summaryNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "16px",
  fontWeight: 950,
  lineHeight: 1,
  textAlign: "center",
  ...safeTextStyle,
};

const summaryNumberActiveStyle: CSSProperties = {
  ...summaryNumberStyle,
  color: "#FFFFFF",
};

const summaryLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7.2px",
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: "0.02em",
  textTransform: "uppercase",
  textAlign: "center",
  ...safeTextStyle,
};

const summaryLabelActiveStyle: CSSProperties = {
  ...summaryLabelStyle,
  color: "#FFFFFF",
};

const filterBoxStyle: CSSProperties = {
  marginTop: "14px",
  display: "grid",
  justifyItems: "center",
  gap: "10px",
  padding: "13px",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 8%, var(--historietas-surface, rgba(255,255,255,0.055))) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.86)) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 14%, var(--historietas-border-soft, rgba(255,255,255,0.08)))",
  boxShadow: "var(--historietas-card-shadow, none)",
  minWidth: 0,
  overflow: "hidden",
};

const filterGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  justifyItems: "center",
  gap: "12px",
  width: "100%",
  minWidth: 0,
};

const fieldBoxStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "8px",
  width: "100%",
  minWidth: 0,
  textAlign: "center",
};

const filterLabelStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "13px",
  fontWeight: 950,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  textAlign: "center",
  ...safeTextStyle,
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  height: "43px",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, #3F3F46)",
  background: "var(--historietas-input-bg, rgba(15,15,18,0.88))",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 15px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 750,
  textAlign: "center",
  boxSizing: "border-box",
  minWidth: 0,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
};

const selectStyle: CSSProperties = {
  width: "100%",
  height: "43px",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, #3F3F46)",
  background: "var(--historietas-input-bg, rgba(15,15,18,0.88))",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 15px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 850,
  textAlign: "center",
  boxSizing: "border-box",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
};

const filterFooterStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  flexWrap: "wrap",
  minWidth: 0,
};

const filterInfoStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "13px",
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const savedGridStyle: CSSProperties = {
  marginTop: "14px",
  display: "grid",
  gap: "12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const savedCardStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  padding: "11px",
  borderRadius: "24px",
  background:
    "linear-gradient(145deg, var(--historietas-surface, rgba(33,24,50,0.96)) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.99)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  boxShadow: "var(--historietas-card-shadow, none)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const savedBookHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(58px, 66px) minmax(0, 1fr)",
  gap: "9px",
  alignItems: "stretch",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const savedBookInfoStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: "4px",
  minWidth: 0,
  maxWidth: "100%",
};

const bookCoverStyle: CSSProperties = {
  minHeight: "102px",
  maxHeight: "116px",
  height: "100%",
  aspectRatio: "2 / 3",
  borderRadius: "17px",
  position: "relative",
  overflow: "hidden",
  textDecoration: "none",
  background:
    "radial-gradient(circle at top left, color-mix(in srgb, var(--historietas-accent, #F97316) 22%, transparent), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 28%, transparent), transparent 38%), linear-gradient(145deg, var(--historietas-surface, #20162F) 0%, var(--historietas-surface-strong, #0F0F0F) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.11))",
  display: "block",
  minWidth: 0,
  boxSizing: "border-box",
  boxShadow: "var(--historietas-card-shadow, none)",
};



const cardTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  flexWrap: "wrap",
  minWidth: 0,
};

const chapterBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "9px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const savedBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.10)",
  border: "1px solid rgba(34, 197, 94, 0.22)",
  color: "#86EFAC",
  fontSize: "9px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const readBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.10)",
  border: "1px solid rgba(34, 197, 94, 0.22)",
  color: "#86EFAC",
  fontSize: "9px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const followedBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.10)",
  border: "1px solid rgba(34, 197, 94, 0.22)",
  color: "#86EFAC",
  fontSize: "9px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const readingBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 11%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, transparent)",
  color: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 35%, #FFFFFF)",
  fontSize: "9px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const favoriteBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "9px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const completedBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.10)",
  border: "1px solid rgba(34, 197, 94, 0.22)",
  color: "#86EFAC",
  fontSize: "9px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const chapterTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "18px",
  lineHeight: 1.16,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  maxWidth: "100%",
  paddingBottom: "2px",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const bookInfoStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  lineHeight: 1.25,
  fontWeight: 700,
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const authorLinkStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  fontWeight: 900,
  textDecoration: "none",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const readingProgressTrackStyle: CSSProperties = {
  height: "5px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.07))",
  overflow: "hidden",
};

const readingProgressBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
};

const commentTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  lineHeight: 1.25,
  fontWeight: 700,
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const primaryActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(128px, 1fr))",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const primaryActionStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 58%, var(--historietas-secondary, #7C3AED)) 100%)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 10px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

const secondaryActionStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, rgba(255,255,255,0.035))",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 28%, transparent)",
  color: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 35%, #FFFFFF)",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 10px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

const disabledActionStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.04))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  color: "var(--historietas-text-secondary, #71717A)",
  fontSize: "11px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 9px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const secondaryActionsRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "stretch",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  paddingTop: "1px",
  marginTop: "0",
};

const favoriteButtonStyle: CSSProperties = {
  flex: "1 1 104px",
  minHeight: "30px",
  width: "auto",
  maxWidth: "100%",
  padding: "0 9px",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent)",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 920,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxShadow: "none",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const favoriteActiveButtonStyle: CSSProperties = {
  ...favoriteButtonStyle,
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  boxShadow: "none",
};

const completedButtonStyle: CSSProperties = {
  flex: "1 1 104px",
  minHeight: "30px",
  width: "auto",
  maxWidth: "100%",
  padding: "0 9px",
  borderRadius: "999px",
  border: "1px solid rgba(34,197,94,0.20)",
  background: "rgba(34,197,94,0.085)",
  color: "#86EFAC",
  fontSize: "10px",
  fontWeight: 920,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxShadow: "none",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const completedActiveButtonStyle: CSSProperties = {
  ...completedButtonStyle,
  background: "rgba(34, 197, 94, 0.16)",
  border: "1px solid rgba(34, 197, 94, 0.30)",
  color: "#86EFAC",
  boxShadow: "none",
};

const removeButtonStyle: CSSProperties = {
  flex: "1 1 104px",
  minHeight: "30px",
  width: "auto",
  maxWidth: "100%",
  padding: "0 9px",
  borderRadius: "999px",
  border: "1px solid rgba(239,68,68,0.18)",
  background: "rgba(239,68,68,0.075)",
  color: "#FCA5A5",
  fontSize: "10px",
  fontWeight: 920,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxShadow: "none",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const emptyBoxStyle: CSSProperties = {
  marginTop: "24px",
  borderRadius: "28px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(31,31,35,0.98)) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.98)) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, var(--historietas-border-soft, #2D2D32))",
  padding: "24px",
  display: "grid",
  gap: "12px",
  textAlign: "center",
  justifyItems: "center",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "var(--historietas-card-shadow, none)",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  textAlign: "center",
  fontSize: "28px",
  fontWeight: 950,
  letterSpacing: "-0.05em",
  ...safeTextStyle,
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  textAlign: "center",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "14px",
  lineHeight: 1.7,
  fontWeight: 600,
  ...safeTextStyle,
};

const emptyButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "48px",
  borderRadius: "999px",
  border: "none",
  background: "var(--historietas-secondary, #7C3AED)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

const desktopEmptyButtonStyle: CSSProperties = {
  ...emptyButtonStyle,
  width: "fit-content",
  minWidth: "220px",
  maxWidth: "280px",
  padding: "0 22px",
};

const infoBoxStyle: CSSProperties = {
  marginTop: "18px",
  textAlign: "center",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 7%, transparent) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 8%, transparent) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent)",
  borderRadius: "22px",
  padding: "14px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "none",
};

const infoTitleStyle: CSSProperties = {
  margin: 0,
  textAlign: "center",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "16px",
  fontWeight: 950,
  ...safeTextStyle,
};

const infoTextStyle: CSSProperties = {
  margin: "6px auto 0",
  textAlign: "center",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  lineHeight: 1.45,
  fontWeight: 600,
  ...safeTextStyle,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1120px, calc(100% - 56px))",
  padding: "22px 0 72px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "16px",
};


const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  borderRadius: "32px",
  maxWidth: "100%",
};

const desktopHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  padding: "30px 40px",
  textAlign: "center",
  justifyItems: "center",
  margin: "0 auto",
  width: "100%",
  gap: "7px",
  maxWidth: "760px",
  boxSizing: "border-box",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  fontSize: "46px",
  lineHeight: 1.04,
  letterSpacing: "-0.065em",
  paddingBottom: "4px",
  textAlign: "center",
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  margin: "0 auto",
  maxWidth: "610px",
  fontSize: "14px",
  lineHeight: 1.55,
  textAlign: "center",
  WebkitLineClamp: 2,
};

const desktopSummaryBoxStyle: CSSProperties = {
  ...summaryBoxStyle,
  justifyContent: "center",
  gap: "6px",
  marginTop: "8px",
  marginLeft: 0,
  marginRight: 0,
  width: "100%",
  maxWidth: "100%",
  padding: 0,
};

const desktopSummaryItemStyle: CSSProperties = {
  ...summaryItemStyle,
  flex: "0 0 92px",
  borderRadius: "12px",
  padding: "4px 5px",
  minHeight: "48px",
};

const desktopSummaryItemActiveStyle: CSSProperties = {
  ...summaryItemActiveStyle,
  flex: "0 0 92px",
  borderRadius: "12px",
  padding: "4px 5px",
  minHeight: "48px",
};

const desktopFilterBoxStyle: CSSProperties = {
  ...filterBoxStyle,
  padding: "14px",
  gap: "10px",
};

const desktopFilterGridStyle: CSSProperties = {
  ...filterGridStyle,
  gridTemplateColumns: "minmax(0, 1.5fr) minmax(240px, 0.7fr)",
  gap: "12px",
  alignItems: "end",
  justifyItems: "center",
};

const desktopFilterFooterStyle: CSSProperties = {
  ...filterFooterStyle,
  alignItems: "center",
};

const desktopSavedGridStyle: CSSProperties = {
  ...savedGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
  alignItems: "start",
};

const desktopSavedCardStyle: CSSProperties = {
  ...savedCardStyle,
  padding: "12px",
  borderRadius: "22px",
  gap: "9px",
};

const desktopSavedBookHeaderStyle: CSSProperties = {
  ...savedBookHeaderStyle,
  gridTemplateColumns: "minmax(76px, 88px) minmax(0, 1fr)",
  gap: "12px",
};

const desktopSavedBookInfoStyle: CSSProperties = {
  ...savedBookInfoStyle,
  gap: "5px",
};

const desktopBookCoverStyle: CSSProperties = {
  ...bookCoverStyle,
  minHeight: "124px",
  maxHeight: "134px",
  borderRadius: "13px",
};

const desktopPrimaryActionsStyle: CSSProperties = {
  ...primaryActionsStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "7px",
};

const desktopSecondaryActionsRowStyle: CSSProperties = {
  ...secondaryActionsRowStyle,
  gap: "6px",
};

const desktopInfoBoxStyle: CSSProperties = {
  ...infoBoxStyle,
  marginTop: "18px",
  padding: "14px 16px",
};