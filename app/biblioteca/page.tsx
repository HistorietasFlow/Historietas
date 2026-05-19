"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
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
  | "favoritos"
  | "concluidos";

const STORAGE_KEY = "historietas-obras";
const FOLLOW_STORAGE_KEY = "historietas-obras-seguidas";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const NOTIFICATIONS_STORAGE_KEY = "historietas-notificacoes";

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

function criarBookCoverStyle(capa: string, isDesktop = false): CSSProperties {
  const baseStyle = isDesktop ? desktopBookCoverStyle : bookCoverStyle;

  if (!capa) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    background: "#18181B",
    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.82) 100%), url(${capa})`,
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


export default function BibliotecaPage() {
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [obrasSeguidas, setObrasSeguidas] = useState<string[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroObra, setFiltroObra] = useState("todas");
  const [abaAtiva, setAbaAtiva] = useState<AbaBiblioteca>("salvos");
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
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
    void carregarObras();
    carregarNotificacoes();
  }, []);

  function carregarNotificacoes() {
    try {
      const notificacoesTexto = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      const notificacoesJson = notificacoesTexto
        ? JSON.parse(notificacoesTexto)
        : [];

      const notificacoes = Array.isArray(notificacoesJson)
        ? notificacoesJson
        : [];

      const totalNaoLidas = notificacoes.filter((notificacao) => {
        return !Boolean(notificacao?.lida);
      }).length;

      setNotificacoesNaoLidas(totalNaoLidas);
    } catch {
      setNotificacoesNaoLidas(0);
    }
  }

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

    setObras(obrasNormalizadas);
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

  const obrasFavoritasLista = useMemo(() => {
    return obras.filter((obra) => obrasFavoritas.includes(obra.id));
  }, [obras, obrasFavoritas]);

  const obrasConcluidasLista = useMemo(() => {
    return obras.filter((obra) => obrasConcluidas.includes(obra.id));
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
      id: "favoritos" as const,
      titulo: "Favoritos",
      total: totais.favoritos,
    },
    {
      id: "concluidos" as const,
      titulo: "Concluídos",
      total: totais.concluidos,
    },
  ];

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

  function alternarFavorito(obraId: string) {
    const vaiFavoritar = !obrasFavoritas.includes(obraId);
    const novasObrasFavoritas = vaiFavoritar
      ? [...obrasFavoritas, obraId]
      : obrasFavoritas.filter((id) => id !== obraId);

    void sincronizarColecaoObraSupabase("favoritos", obraId, vaiFavoritar);

    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(novasObrasFavoritas)
    );

    setObrasFavoritas(novasObrasFavoritas);
  }

  function alternarConcluido(obraId: string) {
    const vaiConcluir = !obrasConcluidas.includes(obraId);
    const novasObrasConcluidas = vaiConcluir
      ? [...obrasConcluidas, obraId]
      : obrasConcluidas.filter((id) => id !== obraId);

    void sincronizarColecaoObraSupabase("concluidas", obraId, vaiConcluir);

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

  return (
    <main style={pageStyle}>
      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTopStyle : topStyle}>
          <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
            <span style={logoMarkStyle}>H</span>
            <span style={logoTextStyle}>istorietas</span>
          </Link>

          <span style={pagePillStyle}>Biblioteca</span>
        </header>

        <section style={isDesktop ? desktopHeroStyle : heroStyle}>
          <div style={heroGlowStyle} />

          <div style={isDesktop ? desktopHeroContentStyle : heroContentStyle}>
            <h1 style={isDesktop ? desktopTitleStyle : titleStyle}>Biblioteca</h1>

            <p style={isDesktop ? desktopDescriptionStyle : descriptionStyle}>
              Continue leituras, encontre capítulos salvos, acompanhe obras
              seguidas e organize favoritos sem transformar a página em painel.
            </p>
          </div>
        </section>

        <section style={isDesktop ? desktopSummaryBoxStyle : summaryBoxStyle}>
          <div style={isDesktop ? desktopSummaryItemStyle : summaryItemStyle}>
            <strong style={summaryNumberStyle}>{totais.capitulosSalvos}</strong>
            <span style={summaryLabelStyle}>
              {totais.capitulosSalvos === 1
                ? "capítulo salvo"
                : "capítulos salvos"}
            </span>
          </div>

          <div style={isDesktop ? desktopSummaryItemStyle : summaryItemStyle}>
            <strong style={summaryNumberStyle}>{totais.continuarLeitura}</strong>
            <span style={summaryLabelStyle}>continuar lendo</span>
          </div>

          <div style={isDesktop ? desktopSummaryItemStyle : summaryItemStyle}>
            <strong style={summaryNumberStyle}>{totais.favoritos}</strong>
            <span style={summaryLabelStyle}>
              {totais.favoritos === 1 ? "favorito" : "favoritos"}
            </span>
          </div>

          <div style={isDesktop ? desktopSummaryItemStyle : summaryItemStyle}>
            <strong style={summaryNumberStyle}>{totais.concluidos}</strong>
            <span style={summaryLabelStyle}>
              {totais.concluidos === 1 ? "concluído" : "concluídos"}
            </span>
          </div>

          <div style={isDesktop ? desktopSummaryItemStyle : summaryItemStyle}>
            <strong style={summaryNumberStyle}>{totais.obrasSeguidas}</strong>
            <span style={summaryLabelStyle}>seguindo</span>
          </div>

          <div style={isDesktop ? desktopSummaryItemStyle : summaryItemStyle}>
            <strong style={summaryNumberStyle}>{notificacoesNaoLidas}</strong>
            <span style={summaryLabelStyle}>avisos novos</span>
          </div>
        </section>
        <section style={isDesktop ? desktopTabsBoxStyle : tabsBoxStyle}>
          {abas.map((aba) => {
            const ativa = abaAtiva === aba.id;

            return (
              <button
                key={aba.id}
                type="button"
                onClick={() => setAbaAtiva(aba.id)}
                style={
                  ativa
                    ? isDesktop
                      ? desktopTabButtonActiveStyle
                      : tabButtonActiveStyle
                    : isDesktop
                      ? desktopTabButtonStyle
                      : tabButtonStyle
                }
              >
                <span style={tabTitleStyle}>{aba.titulo}</span>

                <span style={ativa ? tabCountActiveStyle : tabCountStyle}>
                  {aba.total}
                </span>
              </button>
            );
          })}
        </section>

        {abaAtiva === "salvos" && capitulosSalvos.length > 0 && (
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

            <div style={isDesktop ? desktopFilterFooterStyle : filterFooterStyle}>
              <span style={filterInfoStyle}>
                {totais.resultados} de {totais.capitulosSalvos} salvos
              </span>

              <button
                type="button"
                onClick={limparFiltros}
                style={clearButtonStyle}
              >
                Limpar filtros
              </button>
            </div>
          </section>
        )}

        {abaAtiva === "salvos" && (
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
                  const perfilAutorHref = `/perfil-autor?autor=${encodeURIComponent(
                    item.obra.autor
                  )}`;

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
                          <div style={bookCoverGlowStyle} />

                          <span style={bookCoverGenreStyle}>
                            {item.obra.genero}
                          </span>

                          {!item.obra.capa && (
                            <span style={bookNoCoverStyle}>Sem capa</span>
                          )}
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
                            {item.obra.titulo} • {item.obra.genero} •{" "}
                            {item.obra.formato} •{" "}
                            {item.obra.classificacaoIndicativa}
                          </p>

                          <Link href={perfilAutorHref} style={authorLinkStyle}>
                            por {item.obra.autor}
                          </Link>
                        </div>
                      </div>

                      {item.capitulo.comentario.trim() && (
                        <p style={commentTextStyle}>
                          Comentário: {item.capitulo.comentario}
                        </p>
                      )}

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
                          onClick={() => alternarFavorito(item.obra.id)}
                          style={
                            obrasFavoritas.includes(item.obra.id)
                              ? favoriteActiveButtonStyle
                              : favoriteButtonStyle
                          }
                        >
                          {obrasFavoritas.includes(item.obra.id)
                            ? "Favorita"
                            : "Favoritar"}
                        </button>

                        <button
                          type="button"
                          onClick={() => alternarConcluido(item.obra.id)}
                          style={
                            obrasConcluidas.includes(item.obra.id)
                              ? completedActiveButtonStyle
                              : completedButtonStyle
                          }
                        >
                          {obrasConcluidas.includes(item.obra.id)
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

        {abaAtiva === "seguindo" && (
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
                  const perfilAutorHref = `/perfil-autor?autor=${encodeURIComponent(
                    obra.autor
                  )}`;
                  const obraFavorita = obrasFavoritas.includes(obra.id);
                  const obraConcluida = obrasConcluidas.includes(obra.id);
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
                          <div style={bookCoverGlowStyle} />

                          <span style={bookCoverGenreStyle}>
                            {obra.genero}
                          </span>

                          {!obra.capa && (
                            <span style={bookNoCoverStyle}>Sem capa</span>
                          )}
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
                            {obra.genero} • {obra.formato}
                          </p>

                          <Link href={perfilAutorHref} style={authorLinkStyle}>
                            por {obra.autor}
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
                          onClick={() => alternarFavorito(obra.id)}
                          style={
                            obraFavorita
                              ? favoriteActiveButtonStyle
                              : favoriteButtonStyle
                          }
                        >
                          {obraFavorita ? "Favorita" : "Favoritar"}
                        </button>

                        <button
                          type="button"
                          onClick={() => alternarConcluido(obra.id)}
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

        {abaAtiva === "lendo-agora" && (
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
                  const perfilAutorHref = `/perfil-autor?autor=${encodeURIComponent(
                    obra.autor
                  )}`;
                  const obraFavorita = obrasFavoritas.includes(obra.id);
                  const obraConcluida = obrasConcluidas.includes(obra.id);

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
                          <div style={bookCoverGlowStyle} />

                          <span style={bookCoverGenreStyle}>
                            {obra.genero}
                          </span>

                          {!obra.capa && (
                            <span style={bookNoCoverStyle}>Sem capa</span>
                          )}
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
                            por {obra.autor}
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
                          onClick={() => alternarFavorito(obra.id)}
                          style={
                            obraFavorita
                              ? favoriteActiveButtonStyle
                              : favoriteButtonStyle
                          }
                        >
                          {obraFavorita ? "Favorita" : "Favoritar"}
                        </button>

                        <button
                          type="button"
                          onClick={() => alternarConcluido(obra.id)}
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

        {abaAtiva === "favoritos" && (
          <>
            {obrasFavoritasLista.length === 0 ? (
              <section style={emptyBoxStyle}>
                <h2 style={emptyTitleStyle}>Nenhuma obra favorita ainda</h2>

                <p style={emptyTextStyle}>
                  Use o botão Favoritar obra nos cards da Biblioteca para
                  guardar suas histórias preferidas aqui.
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
                  const perfilAutorHref = `/perfil-autor?autor=${encodeURIComponent(
                    obra.autor
                  )}`;
                  const obraConcluida = obrasConcluidas.includes(obra.id);
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
                          <div style={bookCoverGlowStyle} />

                          <span style={bookCoverGenreStyle}>
                            {obra.genero}
                          </span>

                          {!obra.capa && (
                            <span style={bookNoCoverStyle}>Sem capa</span>
                          )}
                        </Link>

                        <div style={isDesktop ? desktopSavedBookInfoStyle : savedBookInfoStyle}>
                          <div style={cardTopStyle}>
                            <span style={favoriteBadgeStyle}>★ Favorita</span>

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
                            {obra.genero} • {obra.formato}
                          </p>

                          <Link href={perfilAutorHref} style={authorLinkStyle}>
                            por {obra.autor}
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
                          onClick={() => alternarFavorito(obra.id)}
                          style={favoriteActiveButtonStyle}
                        >
                          Remover favorito
                        </button>

                        <button
                          type="button"
                          onClick={() => alternarConcluido(obra.id)}
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

        {abaAtiva === "concluidos" && (
          <>
            {obrasConcluidasLista.length === 0 ? (
              <section style={emptyBoxStyle}>
                <h2 style={emptyTitleStyle}>Nenhuma obra concluída ainda</h2>

                <p style={emptyTextStyle}>
                  Use o botão Marcar concluída nos cards da Biblioteca quando
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
                  const perfilAutorHref = `/perfil-autor?autor=${encodeURIComponent(
                    obra.autor
                  )}`;
                  const obraFavorita = obrasFavoritas.includes(obra.id);
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
                          <div style={bookCoverGlowStyle} />

                          <span style={bookCoverGenreStyle}>
                            {obra.genero}
                          </span>

                          {!obra.capa && (
                            <span style={bookNoCoverStyle}>Sem capa</span>
                          )}
                        </Link>

                        <div style={isDesktop ? desktopSavedBookInfoStyle : savedBookInfoStyle}>
                          <div style={cardTopStyle}>
                            <span style={completedBadgeStyle}>✓ Concluída</span>

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
                            {obra.genero} • {obra.formato}
                          </p>

                          <Link href={perfilAutorHref} style={authorLinkStyle}>
                            por {obra.autor}
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
                          onClick={() => alternarFavorito(obra.id)}
                          style={
                            obraFavorita
                              ? favoriteActiveButtonStyle
                              : favoriteButtonStyle
                          }
                        >
                          {obraFavorita ? "Favorita" : "Favoritar"}
                        </button>

                        <button
                          type="button"
                          onClick={() => alternarConcluido(obra.id)}
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

        <section style={isDesktop ? desktopInfoBoxStyle : infoBoxStyle}>
          <h2 style={infoTitleStyle}>Biblioteca integrada</h2>

          <p style={infoTextStyle}>
            Remover da Biblioteca não apaga o capítulo. Ele só deixa de aparecer
            nos seus salvos. A aba Seguindo agora reconhece obra por ID, slug e
            título normalizado, então fica compatível com a página pública da
            obra e com o Supabase. Favoritos, concluídos, salvos e progresso
            continuam com backup local.
          </p>
        </section>
      </section>
    </main>
  );
}

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background:
    "radial-gradient(circle at 12% -6%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 40%, transparent), transparent 31%), radial-gradient(circle at 88% 10%, color-mix(in srgb, var(--historietas-accent, #F97316) 22%, transparent), transparent 25%), radial-gradient(circle at 50% 100%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent), transparent 36%), radial-gradient(circle at 6% 72%, rgba(236,72,153,0.10), transparent 25%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 34%, var(--historietas-bg-end, #180B2D) 66%, #0B0614 100%)",
  color: "#FFFFFF",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
  isolation: "isolate",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(880px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "16px 0 78px",
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
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "24px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
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
  background: "linear-gradient(135deg, #F5F3FF 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 45%, #FFFFFF) 42%, var(--historietas-accent, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "0 0 26px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, transparent)",
};

const pagePillStyle: CSSProperties = {
  minHeight: "34px",
  padding: "0 12px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, rgba(255,255,255,0.08))",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  flex: "0 0 auto",
  maxWidth: "100%",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const topButtonStyle: CSSProperties = {
  minHeight: "40px",
  padding: "0 14px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.055) 100%)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  flex: "0 0 auto",
  maxWidth: "100%",
  boxSizing: "border-box",
  boxShadow: "none",
  ...safeTextStyle,
};

const topActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "7px",
  width: "100%",
  minWidth: 0,
};

const heroStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: "28px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, rgba(255,255,255,0.08))",
  background:
    "radial-gradient(circle at 8% 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent), transparent 32%), radial-gradient(circle at 88% 18%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 44%, transparent), transparent 34%), linear-gradient(135deg, rgba(32,14,53,0.96) 0%, rgba(13,7,25,0.99) 58%, rgba(9,7,18,0.99) 100%)",
  boxShadow:
    "0 18px 48px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06)",
  minWidth: 0,
};

const heroGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(115deg, rgba(255,255,255,0.11) 0%, transparent 22%, transparent 70%, rgba(255,255,255,0.055) 100%), radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--historietas-accent, #F97316) 42%, transparent), transparent 34%), radial-gradient(circle at 80% 24%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 62%, transparent), transparent 38%)",
  pointerEvents: "none",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "20px 16px",
  display: "grid",
  gap: "8px",
  minWidth: 0,
  textAlign: "center",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(36px, 9.4vw, 58px)",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.072em",
  maxWidth: "100%",
  paddingBottom: "3px",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 34%, var(--historietas-accent, #FDBA74) 72%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 42%, #FFFFFF) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "none",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: "0 auto",
  color: "#D4D4D8",
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
  marginTop: "12px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const summaryItemStyle: CSSProperties = {
  borderRadius: "20px",
  background:
    "linear-gradient(145deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 15%, rgba(255,255,255,0.06)) 0%, rgba(18,12,30,0.82) 100%)",
  border: "1px solid rgba(255,255,255,0.085)",
  padding: "12px 11px",
  display: "grid",
  gap: "3px",
  alignContent: "center",
  minWidth: 0,
  overflow: "hidden",
};

const summaryNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "20px",
  fontWeight: 950,
  lineHeight: 1.05,
  ...safeTextStyle,
};

const summaryLabelStyle: CSSProperties = {
  color: "#A1A1AA",
  fontSize: "10px",
  lineHeight: 1.18,
  fontWeight: 850,
  ...safeTextStyle,
};

const tabsBoxStyle: CSSProperties = {
  marginTop: "14px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(136px, 1fr))",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  padding: "8px",
  borderRadius: "22px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.07)",
};

const tabButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.035) 100%)",
  color: "#FFFFFF",
  padding: "0 10px",
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "none",
};

const tabButtonActiveStyle: CSSProperties = {
  ...tabButtonStyle,
  background:
    "linear-gradient(135deg, var(--historietas-secondary, #7C3AED) 0%, var(--historietas-accent, #F97316) 100%)",
  border: "1px solid rgba(255,255,255,0.22)",
  boxShadow: "none",
};

const tabTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "13px",
  lineHeight: 1.15,
  fontWeight: 950,
  textAlign: "left",
  minWidth: 0,
  ...safeTextStyle,
};

const tabCountStyle: CSSProperties = {
  minWidth: "28px",
  flex: "0 0 auto",
  height: "28px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#D4D4D8",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const tabCountActiveStyle: CSSProperties = {
  ...tabCountStyle,
  background: "rgba(255,255,255,0.2)",
  border: "1px solid rgba(255,255,255,0.22)",
  color: "#FFFFFF",
};

const filterBoxStyle: CSSProperties = {
  marginTop: "14px",
  display: "grid",
  gap: "10px",
  padding: "13px",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 10%, rgba(255,255,255,0.055)) 0%, rgba(18,12,30,0.86) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 14%, rgba(255,255,255,0.08))",
  boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
  minWidth: 0,
  overflow: "hidden",
};

const filterGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  minWidth: 0,
};

const fieldBoxStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const filterLabelStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  ...safeTextStyle,
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  height: "43px",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, #3F3F46)",
  background: "rgba(15,15,18,0.88)",
  color: "#FFFFFF",
  padding: "0 15px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 750,
  boxSizing: "border-box",
  minWidth: 0,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
};

const selectStyle: CSSProperties = {
  width: "100%",
  height: "43px",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, #3F3F46)",
  background: "rgba(15,15,18,0.88)",
  color: "#FFFFFF",
  padding: "0 15px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 850,
  boxSizing: "border-box",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
};

const filterFooterStyle: CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "wrap",
  minWidth: 0,
};

const filterInfoStyle: CSSProperties = {
  color: "#A1A1AA",
  fontSize: "13px",
  fontWeight: 850,
  ...safeTextStyle,
};

const clearButtonStyle: CSSProperties = {
  flex: "1 1 132px",
  minHeight: "40px",
  maxWidth: "100%",
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
  boxSizing: "border-box",
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
    "radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent), transparent 30%), radial-gradient(circle at 100% 8%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, transparent), transparent 30%), linear-gradient(145deg, rgba(33,24,50,0.96) 0%, rgba(18,12,30,0.99) 100%)",
  border: "1px solid rgba(255,255,255,0.09)",
  boxShadow: "0 14px 36px rgba(0,0,0,0.24)",
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
    "radial-gradient(circle at top left, color-mix(in srgb, var(--historietas-accent, #F97316) 40%, transparent), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 62%, transparent), transparent 38%), linear-gradient(145deg, #20162F 0%, #0F0F0F 100%)",
  border: "1px solid rgba(255,255,255,0.11)",
  display: "block",
  minWidth: 0,
  boxSizing: "border-box",
  boxShadow: "0 14px 28px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.08)",
};

const bookCoverGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.78) 100%)",
};

const bookCoverGenreStyle: CSSProperties = {
  position: "absolute",
  left: "6px",
  right: "6px",
  bottom: "6px",
  padding: "4px 6px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 70%, transparent)",
  color: "#FFFFFF",
  fontSize: "8px",
  fontWeight: 950,
  textAlign: "center",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const bookNoCoverStyle: CSSProperties = {
  position: "absolute",
  top: "8px",
  left: "8px",
  right: "8px",
  padding: "6px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#D4D4D8",
  fontSize: "10px",
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
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
  color: "#FFFFFF",
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
  color: "#A1A1AA",
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
  borderBottom: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const readingProgressTrackStyle: CSSProperties = {
  height: "5px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.07)",
  overflow: "hidden",
};

const readingProgressBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
};

const commentTextStyle: CSSProperties = {
  margin: 0,
  color: "#A1A1AA",
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
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#71717A",
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
    "radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, transparent), transparent 32%), linear-gradient(135deg, rgba(31,31,35,0.98) 0%, rgba(18,12,30,0.98) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, #2D2D32)",
  padding: "24px",
  display: "grid",
  gap: "12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "0 18px 42px rgba(0,0,0,0.26)",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "28px",
  fontWeight: 950,
  letterSpacing: "-0.05em",
  ...safeTextStyle,
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
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
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "16px",
  fontWeight: 950,
  ...safeTextStyle,
};

const infoTextStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#A1A1AA",
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

const desktopTopActionsStyle: CSSProperties = {
  ...topActionsStyle,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  width: "auto",
  flex: "0 0 auto",
};

const desktopTopButtonStyle: CSSProperties = {
  ...topButtonStyle,
  minHeight: "38px",
  padding: "0 18px",
};

const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  borderRadius: "28px",
  maxWidth: "100%",
};

const desktopHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  padding: "24px 30px",
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
  lineHeight: 1.08,
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
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: "10px",
  marginTop: "12px",
};

const desktopSummaryItemStyle: CSSProperties = {
  ...summaryItemStyle,
  borderRadius: "18px",
  padding: "12px 13px",
  minHeight: "74px",
};

const desktopTabsBoxStyle: CSSProperties = {
  ...tabsBoxStyle,
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "10px",
  marginTop: "12px",
};

const desktopTabButtonStyle: CSSProperties = {
  ...tabButtonStyle,
  minHeight: "42px",
  padding: "0 12px",
};

const desktopTabButtonActiveStyle: CSSProperties = {
  ...tabButtonActiveStyle,
  minHeight: "42px",
  padding: "0 12px",
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
  borderRadius: "16px",
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

