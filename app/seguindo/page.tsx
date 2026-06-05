"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
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
  publicado: boolean;
  capitulos: CapituloLocal[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  slug: string;
  link: string;
};

type CapituloSalvo = Partial<CapituloLocal> & Record<string, unknown>;

type ObraSalva = Partial<ObraLocal> & {
  capitulos?: CapituloSalvo[];
} & Record<string, unknown>;

type AutorSeguido = {
  chave: string;
  nome: string;
  autorId: string;
  obras: ObraLocal[];
  totalCapitulos: number;
  totalPublicadas: number;
  totalRascunhos: number;
  totalCurtidas: number;
  totalComentarios: number;
  totalSalvos: number;
  totalFavoritas: number;
  totalConcluidas: number;
  totalComClassificacao: number;
  totalLidos: number;
  totalEmLeitura: number;
  progressoMedio: number;
};

type NotificacaoLocal = {
  id: string;
  obraId: string;
  capituloId: string;
  titulo: string;
  mensagem: string;
  tipo: "novo-capitulo";
  lida: boolean;
  criadaEm: string;
};

type NotificacaoSalva = Partial<NotificacaoLocal> & Record<string, unknown>;


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

type FiltroSeguindo =
  | "todos"
  | "obras"
  | "autores"
  | "em-leitura"
  | "favoritas"
  | "concluidas";

type OrdenacaoSeguindo = "recentes" | "titulo" | "progresso" | "capitulos";

const STORAGE_KEY = "historietas-obras";
const FOLLOW_STORAGE_KEY = "historietas-obras-seguidas";
const AUTHOR_FOLLOW_STORAGE_KEY = "historietas-autores-seguidos";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const NOTIFICATIONS_STORAGE_KEY = "historietas-notificacoes";

function normalizarNomeAutor(nome: string) {
  return nome.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizarTexto(texto: string) {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatarGeneroSeguindo(genero: string) {
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

function criarSlugBase(titulo: string) {
  const slug = normalizarTexto(titulo)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "obra";
}

function criarHrefPerfilAutorSeguindo(nomeAutor: string, autorId?: string) {
  const params = new URLSearchParams();
  const nomeAutorLimpo = nomeAutor.trim() || "Autor não informado";
  const autorIdLimpo = autorId?.trim() || "";

  params.set("autor", nomeAutorLimpo);

  if (autorIdLimpo) {
    params.set("autorId", autorIdLimpo);
  }

  return `/perfil-autor?${params.toString()}`;
}

function normalizarListaTexto(lista: string[]) {
  return Array.from(
    new Set(
      lista
        .map((item) => item.trim())
        .filter((item) => Boolean(item))
    )
  );
}

function criarChavesObra(obra: Pick<ObraLocal, "id" | "titulo" | "slug" | "link">) {
  return normalizarListaTexto([
    obra.id,
    obra.slug,
    criarSlugBase(obra.titulo),
    normalizarTexto(obra.titulo),
    obra.link,
  ]);
}

function obraEstaNaLista(obra: Pick<ObraLocal, "id" | "titulo" | "slug" | "link">, lista: string[]) {
  const listaNormalizada = new Set(normalizarListaTexto(lista));

  return criarChavesObra(obra).some((chave) => listaNormalizada.has(chave));
}

function removerObraDaLista(obra: Pick<ObraLocal, "id" | "titulo" | "slug" | "link">, lista: string[]) {
  const chavesParaRemover = new Set(criarChavesObra(obra));

  return normalizarListaTexto(lista).filter((item) => !chavesParaRemover.has(item));
}

function adicionarObraNaLista(obra: Pick<ObraLocal, "id" | "titulo" | "slug" | "link">, lista: string[]) {
  return normalizarListaTexto([...lista, obra.id]);
}

function dataAtividadeObra(obra: ObraLocal) {
  const datas = [obra.ultimaLeituraEm, obra.criadaEm]
    .map((data) => new Date(data).getTime())
    .filter((data) => Number.isFinite(data));

  return datas.length > 0 ? Math.max(...datas) : 0;
}

function textoBuscaObra(obra: ObraLocal) {
  return normalizarTexto(
    [
      obra.titulo,
      obra.autor,
      obra.genero,
      formatarGeneroSeguindo(obra.genero),
      obra.formato,
      obra.classificacaoIndicativa,
      obra.sinopse,
      obra.tags.join(" "),
      obra.capaNome,
      obra.capitulos.map((capitulo) => capitulo.titulo).join(" "),
    ].join(" ")
  );
}

function mostrarClassificacao(obra: ObraLocal) {
  return (
    obra.classificacaoIndicativa &&
    obra.classificacaoIndicativa !== "Não informada"
  );
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

function obraEmLeitura(obra: ObraLocal) {
  return obra.capitulos.some((capitulo) => {
    return (
      capitulo.lido ||
      capitulo.salvo ||
      capitulo.curtiu ||
      Boolean(capitulo.comentario.trim())
    );
  });
}

function criarCoverStyle(capa: string, isDesktop = false): CSSProperties {
  const baseStyle = isDesktop ? desktopCoverStyle : coverStyle;

  if (!capa) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function contarNotificacoesNaoLidas() {
  try {
    const notificacoesTexto = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const notificacoesJson = notificacoesTexto
      ? JSON.parse(notificacoesTexto)
      : [];

    const notificacoesNormalizadas: NotificacaoSalva[] = Array.isArray(
      notificacoesJson
    )
      ? notificacoesJson
      : [];

    return notificacoesNormalizadas.filter((notificacao) => {
      return !Boolean(notificacao.lida);
    }).length;
  } catch {
    return 0;
  }
}

function normalizarCapituloSalvo(
  capitulo: CapituloSalvo,
  obraIndex: number,
  capituloIndex: number
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

function normalizarObraSalva(obra: ObraSalva, obraIndex: number): ObraLocal {
  const capitulosNormalizados: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo: CapituloSalvo, capituloIndex: number) =>
        normalizarCapituloSalvo(capitulo, obraIndex, capituloIndex)
      )
    : [];

  const titulo =
    typeof obra.titulo === "string" && obra.titulo.trim()
      ? obra.titulo
      : "Obra sem título";
  const slug =
    typeof obra.slug === "string" && obra.slug.trim()
      ? obra.slug
      : criarSlugBase(titulo || `obra-${obraIndex + 1}`);

  return {
    id:
      typeof obra.id === "string" && obra.id.trim()
        ? obra.id
        : `obra-${obraIndex + 1}`,
    titulo,
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

function obterTextoComentarioRegistro(registro: RegistroSupabaseGenerico) {
  return (
    obterTextoRegistro(registro, "comentario") ||
    obterTextoRegistro(registro, "texto") ||
    obterTextoRegistro(registro, "conteudo")
  );
}

function registroIndicaLido(registro: RegistroSupabaseGenerico) {
  const valor = registro.lido;

  if (typeof valor === "boolean") {
    return valor;
  }

  if (typeof valor === "string") {
    return valor.toLowerCase() === "true";
  }

  return true;
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
      .map((registro) => obterIdCapituloRegistro(registro))
      .filter((capituloId) => Boolean(capituloId))
  );
}

function criarSetCapitulosLidosPorRegistro(
  registros: RegistroSupabaseGenerico[]
) {
  return new Set(
    registros
      .filter((registro) => registroIndicaLido(registro))
      .map((registro) => obterIdCapituloRegistro(registro))
      .filter((capituloId) => Boolean(capituloId))
  );
}

function criarMapaComentariosPorCapitulo(
  registros: RegistroSupabaseGenerico[]
) {
  const mapa = new Map<string, string>();

  registros.forEach((registro) => {
    const capituloId = obterIdCapituloRegistro(registro);
    const comentario = obterTextoComentarioRegistro(registro);

    if (capituloId && comentario) {
      mapa.set(capituloId, comentario);
    }
  });

  return mapa;
}

async function carregarIdsObrasUsuarioSupabase(
  tabela: "seguindo_obras" | "favoritos" | "concluidas",
  userId: string
) {
  if (!userId) {
    return [] as RegistroSupabaseGenerico[];
  }

  try {
    const { data, error } = await supabase
      .from(tabela)
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.warn(`Não consegui carregar ${tabela} no Supabase:`, error.message);
      return [];
    }

    return Array.isArray(data) ? (data as RegistroSupabaseGenerico[]) : [];
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} no Supabase:`, error);
    return [];
  }
}

async function carregarRegistrosCapitulosUsuarioSupabase(
  tabela:
    | "salvos_capitulos"
    | "curtidas_capitulos"
    | "comentarios_capitulos"
    | "progresso_leitura",
  userId: string,
  capituloIds: string[]
) {
  if (!userId || capituloIds.length === 0) {
    return [] as RegistroSupabaseGenerico[];
  }

  try {
    const { data, error } = await supabase
      .from(tabela)
      .select("*")
      .eq("user_id", userId)
      .in("capitulo_id", capituloIds);

    if (error) {
      console.warn(`Não consegui carregar ${tabela} no Supabase:`, error.message);
      return [];
    }

    return Array.isArray(data) ? (data as RegistroSupabaseGenerico[]) : [];
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} no Supabase:`, error);
    return [];
  }
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
    const comentarioSupabase = comentariosCapitulos.get(capitulo.id) || "";
    const lidoSupabase = capitulosLidos.has(capitulo.id);

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
      curtiu: Boolean(capituloLocal?.curtiu) || capitulosCurtidos.has(capitulo.id),
      salvo: Boolean(capituloLocal?.salvo) || capitulosSalvos.has(capitulo.id),
      comentario: comentarioSupabase || capituloLocal?.comentario || "",
      criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
      lido: Boolean(capituloLocal?.lido) || lidoSupabase,
      lidoEm:
        capituloLocal?.lidoEm ||
        (lidoSupabase ? capitulo.atualizado_em || capitulo.criado_em || "" : ""),
    };
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

function mesclarObrasSeguindo(
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

async function carregarSeguindoSupabase(
  obrasLocais: ObraLocal[],
  obrasSeguidasLocais: string[],
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
      console.warn("Não consegui carregar obras no Seguindo:", erroObras.message);

      return {
        obras: obrasLocais,
        obrasSeguidas: obrasSeguidasLocais,
        obrasFavoritas: obrasFavoritasLocais,
        obrasConcluidas: obrasConcluidasLocais,
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
        obrasSeguidas: obrasSeguidasLocais,
        obrasFavoritas: obrasFavoritasLocais,
        obrasConcluidas: obrasConcluidasLocais,
      };
    }

    const { data: capitulosBanco, error: erroCapitulos } = await supabase
      .from("capitulos")
      .select("*")
      .in("obra_id", obraIds)
      .order("ordem", { ascending: true });

    if (erroCapitulos) {
      console.warn("Não consegui carregar capítulos no Seguindo:", erroCapitulos.message);
    }

    const capitulosSupabaseBanco = erroCapitulos
      ? []
      : Array.isArray(capitulosBanco)
      ? (capitulosBanco as SupabaseCapituloRow[])
      : [];
    const capituloIds = capitulosSupabaseBanco
      .map((capitulo) => capitulo.id)
      .filter((capituloId) => Boolean(capituloId));

    const [
      seguidasBanco,
      favoritasBanco,
      concluidasBanco,
      salvosCapitulosBanco,
      curtidasCapitulosBanco,
      comentariosCapitulosBanco,
      progressoLeituraBanco,
    ] = await Promise.all([
      carregarIdsObrasUsuarioSupabase("seguindo_obras", userId),
      carregarIdsObrasUsuarioSupabase("favoritos", userId),
      carregarIdsObrasUsuarioSupabase("concluidas", userId),
      carregarRegistrosCapitulosUsuarioSupabase(
        "salvos_capitulos",
        userId,
        capituloIds
      ),
      carregarRegistrosCapitulosUsuarioSupabase(
        "curtidas_capitulos",
        userId,
        capituloIds
      ),
      carregarRegistrosCapitulosUsuarioSupabase(
        "comentarios_capitulos",
        userId,
        capituloIds
      ),
      carregarRegistrosCapitulosUsuarioSupabase(
        "progresso_leitura",
        userId,
        capituloIds
      ),
    ]);

    const seguidasSupabase = criarSetObrasPorRegistro(seguidasBanco);
    const favoritasSupabase = criarSetObrasPorRegistro(favoritasBanco);
    const concluidasSupabase = criarSetObrasPorRegistro(concluidasBanco);
    const capitulosSalvos = criarSetCapitulosPorRegistro(salvosCapitulosBanco);
    const capitulosCurtidos = criarSetCapitulosPorRegistro(curtidasCapitulosBanco);
    const capitulosLidos = criarSetCapitulosLidosPorRegistro(progressoLeituraBanco);
    const comentariosCapitulos = criarMapaComentariosPorCapitulo(
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

    const obrasMescladas = mesclarObrasSeguindo(obrasLocais, obrasSupabase);

    return {
      obras: obrasMescladas,
      obrasSeguidas: Array.from(
        new Set([...obrasSeguidasLocais, ...Array.from(seguidasSupabase)])
      ),
      obrasFavoritas: Array.from(
        new Set([...obrasFavoritasLocais, ...Array.from(favoritasSupabase)])
      ),
      obrasConcluidas: Array.from(
        new Set([...obrasConcluidasLocais, ...Array.from(concluidasSupabase)])
      ),
    };
  } catch (error) {
    console.warn("Não consegui acessar o Supabase no Seguindo:", error);

    return {
      obras: obrasLocais,
      obrasSeguidas: obrasSeguidasLocais,
      obrasFavoritas: obrasFavoritasLocais,
      obrasConcluidas: obrasConcluidasLocais,
    };
  }
}

async function sincronizarObraUsuarioSupabase(
  tabela: "seguindo_obras" | "favoritos" | "concluidas",
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

export default function SeguindoPage() {
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [obrasSeguidas, setObrasSeguidas] = useState<string[]>([]);
  const [autoresSeguidos, setAutoresSeguidos] = useState<string[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [, setCarregando] = useState(false);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroSeguindo>("todos");
  const [ordenacao, setOrdenacao] =
    useState<OrdenacaoSeguindo>("recentes");
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
    void carregarDadosSeguindo();
  }, []);

  async function carregarDadosSeguindo() {
    setCarregando(true);

    let obrasNormalizadas: ObraLocal[] = [];
    let seguindoNormalizado: string[] = [];
    let autoresNormalizados: string[] = [];
    let favoritasNormalizadas: string[] = [];
    let concluidasNormalizadas: string[] = [];
    let totalNotificacoesNaoLidas = 0;

    try {
      const obrasTexto = localStorage.getItem(STORAGE_KEY);
      const obrasJson = obrasTexto ? JSON.parse(obrasTexto) : [];

      obrasNormalizadas = Array.isArray(obrasJson)
        ? (obrasJson as ObraSalva[]).map((obra, obraIndex) =>
            normalizarObraSalva(obra, obraIndex)
          )
        : [];

      const seguindoTexto = localStorage.getItem(FOLLOW_STORAGE_KEY);
      const seguindoJson = seguindoTexto ? JSON.parse(seguindoTexto) : [];

      seguindoNormalizado = Array.isArray(seguindoJson)
        ? normalizarListaTexto(
            seguindoJson.filter((id): id is string => typeof id === "string")
          )
        : [];

      const autoresTexto = localStorage.getItem(AUTHOR_FOLLOW_STORAGE_KEY);
      const autoresJson = autoresTexto ? JSON.parse(autoresTexto) : [];

      autoresNormalizados = Array.isArray(autoresJson)
        ? autoresJson
            .filter((autor): autor is string => typeof autor === "string")
            .map((autor) => normalizarNomeAutor(autor))
        : [];

      const favoritasTexto = localStorage.getItem(FAVORITES_STORAGE_KEY);
      const favoritasJson = favoritasTexto ? JSON.parse(favoritasTexto) : [];

      favoritasNormalizadas = Array.isArray(favoritasJson)
        ? normalizarListaTexto(
            favoritasJson.filter((id): id is string => typeof id === "string")
          )
        : [];

      const concluidasTexto = localStorage.getItem(COMPLETED_STORAGE_KEY);
      const concluidasJson = concluidasTexto ? JSON.parse(concluidasTexto) : [];

      concluidasNormalizadas = Array.isArray(concluidasJson)
        ? normalizarListaTexto(
            concluidasJson.filter((id): id is string => typeof id === "string")
          )
        : [];

      totalNotificacoesNaoLidas = contarNotificacoesNaoLidas();
    } catch {
      obrasNormalizadas = [];
      seguindoNormalizado = [];
      autoresNormalizados = [];
      favoritasNormalizadas = [];
      concluidasNormalizadas = [];
      totalNotificacoesNaoLidas = 0;
    }

    setObras(obrasNormalizadas);
    setObrasSeguidas(seguindoNormalizado);
    setAutoresSeguidos(autoresNormalizados);
    setObrasFavoritas(favoritasNormalizadas);
    setObrasConcluidas(concluidasNormalizadas);
    setNotificacoesNaoLidas(totalNotificacoesNaoLidas);
    setCarregando(false);

    const dadosSupabase = await carregarSeguindoSupabase(
      obrasNormalizadas,
      seguindoNormalizado,
      favoritasNormalizadas,
      concluidasNormalizadas
    );

    obrasNormalizadas = dadosSupabase.obras.map((obra, index) =>
      normalizarObraSalva(obra as ObraSalva, index)
    );
    seguindoNormalizado = normalizarListaTexto(dadosSupabase.obrasSeguidas);
    favoritasNormalizadas = normalizarListaTexto(dadosSupabase.obrasFavoritas);
    concluidasNormalizadas = normalizarListaTexto(dadosSupabase.obrasConcluidas);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasNormalizadas));
    localStorage.setItem(FOLLOW_STORAGE_KEY, JSON.stringify(seguindoNormalizado));
    localStorage.setItem(
      AUTHOR_FOLLOW_STORAGE_KEY,
      JSON.stringify(autoresNormalizados)
    );
    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(favoritasNormalizadas)
    );
    localStorage.setItem(
      COMPLETED_STORAGE_KEY,
      JSON.stringify(concluidasNormalizadas)
    );

    setObras(obrasNormalizadas);
    setObrasSeguidas(seguindoNormalizado);
    setAutoresSeguidos(autoresNormalizados);
    setObrasFavoritas(favoritasNormalizadas);
    setObrasConcluidas(concluidasNormalizadas);
    setNotificacoesNaoLidas(totalNotificacoesNaoLidas);
    setCarregando(false);
  }

  const termoBusca = normalizarTexto(busca);

  const obrasSeguidasBase = useMemo(() => {
    return obras.filter((obra) => obraEstaNaLista(obra, obrasSeguidas));
  }, [obras, obrasSeguidas]);

  const autoresBase = useMemo<AutorSeguido[]>(() => {
    const mapa = new Map<string, { nome: string; obras: ObraLocal[] }>();

    obras.forEach((obra) => {
      const nomeAutor = obra.autor.trim() || "Autor não informado";
      const chaveAutor = normalizarNomeAutor(nomeAutor);

      if (!autoresSeguidos.includes(chaveAutor)) {
        return;
      }

      const autorExistente = mapa.get(chaveAutor);

      if (autorExistente) {
        mapa.set(chaveAutor, {
          ...autorExistente,
          obras: [...autorExistente.obras, obra],
        });

        return;
      }

      mapa.set(chaveAutor, {
        nome: nomeAutor,
        obras: [obra],
      });
    });

    return Array.from(mapa.entries())
      .map(([chave, grupoAutor]) => {
        const obrasDoAutor = grupoAutor.obras;

        const totalCapitulos = obrasDoAutor.reduce(
          (total, obra) => total + obra.capitulos.length,
          0
        );

        const totalCurtidas = obrasDoAutor.reduce((total, obra) => {
          return (
            total + obra.capitulos.filter((capitulo) => capitulo.curtiu).length
          );
        }, 0);

        const totalComentarios = obrasDoAutor.reduce((total, obra) => {
          return (
            total +
            obra.capitulos.filter((capitulo) => capitulo.comentario.trim())
              .length
          );
        }, 0);

        const totalSalvos = obrasDoAutor.reduce((total, obra) => {
          return (
            total + obra.capitulos.filter((capitulo) => capitulo.salvo).length
          );
        }, 0);

        const totalFavoritas = obrasDoAutor.filter((obra) =>
          obraEstaNaLista(obra, obrasFavoritas)
        ).length;

        const totalConcluidas = obrasDoAutor.filter((obra) =>
          obraEstaNaLista(obra, obrasConcluidas)
        ).length;

        const totalComClassificacao = obrasDoAutor.filter((obra) =>
          mostrarClassificacao(obra)
        ).length;

        const totalLidos = obrasDoAutor.reduce((total, obra) => {
          return total + obra.capitulos.filter((capitulo) => capitulo.lido).length;
        }, 0);

        const totalEmLeitura = obrasDoAutor.filter((obra) =>
          obraEmLeitura(obra)
        ).length;

        const progressoMedio =
          obrasDoAutor.length > 0
            ? Math.round(
                obrasDoAutor.reduce((total, obra) => {
                  return total + calcularProgressoLeitura(obra.capitulos);
                }, 0) / obrasDoAutor.length
              )
            : 0;

        return {
          chave,
          nome: grupoAutor.nome,
          autorId:
            obrasDoAutor.find((obra) => Boolean(obra.autorId?.trim()))
              ?.autorId?.trim() || "",
          obras: obrasDoAutor,
          totalCapitulos,
          totalPublicadas: obrasDoAutor.filter((obra) => obra.publicado).length,
          totalRascunhos: obrasDoAutor.filter((obra) => !obra.publicado).length,
          totalCurtidas,
          totalComentarios,
          totalSalvos,
          totalFavoritas,
          totalConcluidas,
          totalComClassificacao,
          totalLidos,
          totalEmLeitura,
          progressoMedio,
        };
      })
      .sort((autorA, autorB) => autorA.nome.localeCompare(autorB.nome));
  }, [obras, autoresSeguidos, obrasFavoritas, obrasConcluidas]);

  const obrasFiltradas = useMemo(() => {
    const filtradas = obrasSeguidasBase.filter((obra) => {
      if (filtro === "autores") {
        return false;
      }

      const passaBusca = termoBusca
        ? textoBuscaObra(obra).includes(termoBusca)
        : true;

      const passaFiltro =
        filtro === "todos" ||
        filtro === "obras" ||
        (filtro === "em-leitura" && obraEmLeitura(obra)) ||
        (filtro === "favoritas" && obraEstaNaLista(obra, obrasFavoritas)) ||
        (filtro === "concluidas" && obraEstaNaLista(obra, obrasConcluidas));

      return passaBusca && passaFiltro;
    });

    return [...filtradas].sort((obraA, obraB) => {
      if (ordenacao === "titulo") {
        return obraA.titulo.localeCompare(obraB.titulo);
      }

      if (ordenacao === "progresso") {
        return (
          calcularProgressoLeitura(obraB.capitulos) -
          calcularProgressoLeitura(obraA.capitulos)
        );
      }

      if (ordenacao === "capitulos") {
        return obraB.capitulos.length - obraA.capitulos.length;
      }

      return dataAtividadeObra(obraB) - dataAtividadeObra(obraA);
    });
  }, [
    obrasSeguidasBase,
    termoBusca,
    filtro,
    ordenacao,
    obrasFavoritas,
    obrasConcluidas,
  ]);

  const autoresFiltrados = useMemo<AutorSeguido[]>(() => {
    const filtrados = autoresBase.filter((autor) => {
      if (filtro === "obras") {
        return false;
      }

      const textoAutor = normalizarTexto(
        [
          autor.nome,
          autor.obras.map((obra) => obra.titulo).join(" "),
          autor.obras.map((obra) => obra.genero).join(" "),
          autor.obras.map((obra) => formatarGeneroSeguindo(obra.genero)).join(" "),
          autor.obras.map((obra) => obra.tags.join(" ")).join(" "),
        ].join(" ")
      );

      const passaBusca = termoBusca ? textoAutor.includes(termoBusca) : true;

      const passaFiltro =
        filtro === "todos" ||
        filtro === "autores" ||
        (filtro === "em-leitura" && autor.totalEmLeitura > 0) ||
        (filtro === "favoritas" && autor.totalFavoritas > 0) ||
        (filtro === "concluidas" && autor.totalConcluidas > 0);

      return passaBusca && passaFiltro;
    });

    return [...filtrados].sort((autorA, autorB) => {
      if (ordenacao === "progresso") {
        return autorB.progressoMedio - autorA.progressoMedio;
      }

      if (ordenacao === "capitulos") {
        return autorB.totalCapitulos - autorA.totalCapitulos;
      }

      return autorA.nome.localeCompare(autorB.nome);
    });
  }, [autoresBase, termoBusca, filtro, ordenacao]);

  const totalSemFiltros = obrasSeguidasBase.length + autoresBase.length;

  const totalSeguindo = obrasFiltradas.length + autoresFiltrados.length;

  const totalLidosSeguidos = obrasFiltradas.reduce((total, obra) => {
    return total + obra.capitulos.filter((capitulo) => capitulo.lido).length;
  }, 0);

  const totalEmLeituraSeguidas = obrasFiltradas.filter((obra) =>
    obraEmLeitura(obra)
  ).length;

  const filtrosAtivos = Boolean(
    busca.trim() || filtro !== "todos" || ordenacao !== "recentes"
  );

  function limparFiltros() {
    setBusca("");
    setFiltro("todos");
    setOrdenacao("recentes");
  }

  function deixarDeSeguirObra(obra: ObraLocal) {
    const novasObrasSeguidas = removerObraDaLista(obra, obrasSeguidas);

    localStorage.setItem(
      FOLLOW_STORAGE_KEY,
      JSON.stringify(novasObrasSeguidas)
    );

    setObrasSeguidas(novasObrasSeguidas);
    void sincronizarObraUsuarioSupabase("seguindo_obras", obra.id, false);
  }

  function deixarDeSeguirAutor(autorChave: string) {
    const novosAutoresSeguidos = autoresSeguidos.filter(
      (autor) => autor !== autorChave
    );

    localStorage.setItem(
      AUTHOR_FOLLOW_STORAGE_KEY,
      JSON.stringify(novosAutoresSeguidos)
    );

    setAutoresSeguidos(novosAutoresSeguidos);
  }

  function alternarFavoritoObra(obra: ObraLocal) {
    const obraVaiFicarFavorita = !obraEstaNaLista(obra, obrasFavoritas);
    const novasObrasFavoritas = obraVaiFicarFavorita
      ? adicionarObraNaLista(obra, obrasFavoritas)
      : removerObraDaLista(obra, obrasFavoritas);

    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(novasObrasFavoritas)
    );

    setObrasFavoritas(novasObrasFavoritas);
    void sincronizarObraUsuarioSupabase(
      "favoritos",
      obra.id,
      obraVaiFicarFavorita
    );
  }

  function alternarConcluidoObra(obra: ObraLocal) {
    const obraVaiFicarConcluida = !obraEstaNaLista(obra, obrasConcluidas);
    const novasObrasConcluidas = obraVaiFicarConcluida
      ? adicionarObraNaLista(obra, obrasConcluidas)
      : removerObraDaLista(obra, obrasConcluidas);

    localStorage.setItem(
      COMPLETED_STORAGE_KEY,
      JSON.stringify(novasObrasConcluidas)
    );

    setObrasConcluidas(novasObrasConcluidas);
    void sincronizarObraUsuarioSupabase(
      "concluidas",
      obra.id,
      obraVaiFicarConcluida
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${seguindoPageCss}`}</style>

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
              SEGUINDO
            </span>
          </Link>
        </header>

        {totalSemFiltros > 0 && (
          <section style={isDesktop ? desktopFilterBoxStyle : filterBoxStyle}>
            <div style={isDesktop ? desktopFilterHeaderStyle : filterHeaderStyle}>
              <div style={filterHeaderTitleBoxStyle}>
                <span style={miniTitleStyle}>ORGANIZAR</span>

                <h2 style={filterTitleStyle}>Buscar e filtrar</h2>
              </div>

              <span style={filterResultBadgeStyle}>
                {totalSeguindo} de {totalSemFiltros}
              </span>
            </div>

            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar obra, autor, gênero, tag ou classificação..."
              style={isDesktop ? desktopSearchInputStyle : searchInputStyle}
              type="text"
            />

            <div style={isDesktop ? desktopQuickFiltersStyle : quickFiltersStyle}>
              <button
                type="button"
                onClick={() => setFiltro("todos")}
                style={filtro === "todos" ? quickFilterActiveStyle : quickFilterStyle}
              >
                Todos
              </button>

              <button
                type="button"
                onClick={() => setFiltro("obras")}
                style={filtro === "obras" ? quickFilterActiveStyle : quickFilterStyle}
              >
                Obras
              </button>

              <button
                type="button"
                onClick={() => setFiltro("autores")}
                style={filtro === "autores" ? quickFilterActiveStyle : quickFilterStyle}
              >
                Autores
              </button>

              <button
                type="button"
                onClick={() => setFiltro("em-leitura")}
                style={
                  filtro === "em-leitura" ? quickFilterActiveStyle : quickFilterStyle
                }
              >
                Em leitura
              </button>

              <button
                type="button"
                onClick={() => setFiltro("favoritas")}
                style={
                  filtro === "favoritas" ? quickFilterActiveStyle : quickFilterStyle
                }
              >
                Minha lista
              </button>

              <button
                type="button"
                onClick={() => setFiltro("concluidas")}
                style={
                  filtro === "concluidas" ? quickFilterActiveStyle : quickFilterStyle
                }
              >
                Concluídas
              </button>
            </div>

            <div style={isDesktop ? desktopFilterFooterStyle : filterFooterStyle}>
              <div style={fieldBoxStyle}>
                <select
                  value={ordenacao}
                  onChange={(event) =>
                    setOrdenacao(event.target.value as OrdenacaoSeguindo)
                  }
                  style={selectStyle}
                >
                  <option value="recentes">Mais recentes</option>
                  <option value="titulo">Título / Autor</option>
                  <option value="progresso">Maior progresso</option>
                  <option value="capitulos">Mais capítulos</option>
                </select>
              </div>

              {filtrosAtivos && (
                <button type="button" onClick={limparFiltros} style={isDesktop ? desktopClearFilterButtonStyle : clearFilterButtonStyle}>
                  Limpar filtros
                </button>
              )}
            </div>

            <section
              className="seguindo-summary-carousel"
              style={isDesktop ? desktopSummaryGridStyle : summaryGridStyle}
            >
              <div style={isDesktop ? desktopSummaryCardStyle : summaryCardStyle}>
                <strong style={isDesktop ? desktopSummaryNumberStyle : summaryNumberStyle}>{totalSeguindo}</strong>
                <span style={summaryLabelStyle}>seguindo</span>
              </div>

              <div style={isDesktop ? desktopSummaryCardStyle : summaryCardStyle}>
                <strong style={isDesktop ? desktopSummaryNumberStyle : summaryNumberStyle}>{obrasFiltradas.length}</strong>
                <span style={summaryLabelStyle}>
                  {obrasFiltradas.length === 1 ? "obra seguida" : "obras seguidas"}
                </span>
              </div>

              <div style={isDesktop ? desktopSummaryCardStyle : summaryCardStyle}>
                <strong style={isDesktop ? desktopSummaryNumberStyle : summaryNumberStyle}>{autoresFiltrados.length}</strong>
                <span style={summaryLabelStyle}>
                  {autoresFiltrados.length === 1
                    ? "autor seguido"
                    : "autores seguidos"}
                </span>
              </div>

              <div style={isDesktop ? desktopSummaryCardStyle : summaryCardStyle}>
                <strong style={isDesktop ? desktopSummaryNumberStyle : summaryNumberStyle}>{totalEmLeituraSeguidas}</strong>
                <span style={summaryLabelStyle}>em leitura</span>
              </div>

              <div style={isDesktop ? desktopSummaryCardStyle : summaryCardStyle}>
                <strong style={isDesktop ? desktopSummaryNumberStyle : summaryNumberStyle}>{totalLidosSeguidos}</strong>
                <span style={summaryLabelStyle}>capítulos lidos</span>
              </div>

              <div style={isDesktop ? desktopSummaryCardStyle : summaryCardStyle}>
                <strong style={isDesktop ? desktopSummaryNumberStyle : summaryNumberStyle}>{notificacoesNaoLidas}</strong>
                <span style={summaryLabelStyle}>avisos novos</span>
              </div>
            </section>
          </section>
        )}

        {totalSemFiltros === 0 ? (
          <div style={emptyBoxStyle}>
            <h2 style={emptyTitleStyle}>Você ainda não segue nada</h2>

            <p style={emptyTextStyle}>
              Entre em uma obra e clique em "Seguir obra", ou entre no perfil de
              um autor e clique em "Seguir autor".
            </p>

            <div style={emptyActionsStyle}>
              <Link href="/explorar" style={exploreButtonStyle}>
                Explorar obras
              </Link>
            </div>
          </div>
        ) : (
          <>
            {totalSeguindo === 0 && (
              <div style={emptyBoxStyle}>
                <h2 style={emptyTitleStyle}>Nada encontrado</h2>

                <p style={emptyTextStyle}>
                  Nenhuma obra ou autor seguido combina com a busca e os filtros atuais.
                </p>

                <button type="button" onClick={limparFiltros} style={exploreButtonStyle}>
                  Limpar filtros
                </button>
              </div>
            )}

            <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
              <div style={isDesktop ? desktopSectionHeaderStyle : sectionHeaderStyle}>
                <div style={sectionHeaderTextStyle}>
                  <h2 style={sectionTitleStyle}>OBRAS SEGUIDAS</h2>
                </div>

                <span style={sectionCounterStyle}>{obrasFiltradas.length}</span>
              </div>

              {obrasFiltradas.length === 0 ? (
                <div style={emptyMiniBoxStyle}>
                  Nenhuma obra seguida encontrada com os filtros atuais.
                </div>
              ) : (
                <div style={isDesktop ? desktopGridStyle : gridStyle}>
                  {obrasFiltradas.map((obra) => {
                    const obraHref = obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
                    const capituloParaContinuar =
                      encontrarCapituloParaContinuar(obra);
                    const primeiroCapitulo = obra.capitulos[0] || null;
                    const capituloDeLeitura =
                      capituloParaContinuar || primeiroCapitulo;
                    const leituraHref = capituloDeLeitura
                      ? `/ler-capitulo?obraId=${obra.id}&capituloId=${capituloDeLeitura.id}`
                      : "";

                    const progressoLeitura = calcularProgressoLeitura(
                      obra.capitulos
                    );

                    const obraFavorita = obraEstaNaLista(obra, obrasFavoritas);
                    const obraConcluida = obraEstaNaLista(obra, obrasConcluidas);

                    return (
                      <article key={obra.id} style={isDesktop ? desktopCardStyle : cardStyle}>
                        <div style={criarCoverStyle(obra.capa, isDesktop)}>
                          <div style={overlayStyle} />

                          <div style={coverContentStyle}>
                            <div style={coverTopBadgesStyle} />

                            <div style={coverBottomStyle}>
                              <strong style={chapterNumberStyle}>
                                {obra.capitulos.length}
                              </strong>

                              <span style={chapterTextStyle}>
                                {obra.capitulos.length === 1
                                  ? "capítulo"
                                  : "capítulos"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={isDesktop ? desktopContentStyle : contentStyle}>
                          <div style={badgeRowStyle}>
                            <span style={badgeStyleSmall}>
                              {obra.formato || "Obra"}
                            </span>

                            <span style={genreStyle}>
                              {formatarGeneroSeguindo(obra.genero)}
                            </span>

                            {mostrarClassificacao(obra) && (
                              <span style={classificationBadgeStyle}>
                                {obra.classificacaoIndicativa}
                              </span>
                            )}

                            {obraFavorita && (
                              <span style={favoriteBadgeStyle}>Na lista</span>
                            )}

                          </div>

                          <h3 style={cardTitleStyle}>{obra.titulo}</h3>

                          <Link
                            href={criarHrefPerfilAutorSeguindo(
                              obra.autor,
                              obra.autorId
                            )}
                            style={authorLinkStyle}
                          >
                            Por {obra.autor}
                          </Link>

                          {obra.capitulos.length > 0 && (
                            <div style={progressLineStyle}>
                              <div style={progressTrackStyle}>
                                <div
                                  style={{
                                    ...progressBarStyle,
                                    width: `${progressoLeitura}%`,
                                  }}
                                />
                              </div>

                              <span style={progressPercentStyle}>
                                {progressoLeitura}%
                              </span>
                            </div>
                          )}

                          <div style={actionsStyle}>
                            <div style={isDesktop ? desktopPrimaryActionsGridStyle : primaryActionsGridStyle}>
                              <Link href={obraHref} style={readButtonStyle}>
                                Abrir obra
                              </Link>

                              {capituloDeLeitura ? (
                                <Link
                                  href={leituraHref}
                                  style={continueButtonStyle}
                                >
                                  {capituloParaContinuar
                                    ? "Continuar leitura"
                                    : "Começar leitura"}
                                </Link>
                              ) : (
                                <span style={disabledActionStyle}>
                                  Sem capítulos
                                </span>
                              )}
                            </div>

                            <div style={isDesktop ? desktopSecondaryActionsRowStyle : secondaryActionsRowStyle}>
                              <button
                                type="button"
                                onClick={() => alternarFavoritoObra(obra)}
                                style={
                                  obraFavorita
                                    ? favoriteActionActiveStyle
                                    : favoriteActionStyle
                                }
                              >
                                {obraFavorita ? "Na lista" : "Adicionar"}
                              </button>

                              <button
                                type="button"
                                onClick={() => alternarConcluidoObra(obra)}
                                style={
                                  obraConcluida
                                    ? completedActionActiveStyle
                                    : completedActionStyle
                                }
                              >
                                {obraConcluida ? "Concluída" : "Concluir"}
                              </button>

                              <button
                                type="button"
                                onClick={() => deixarDeSeguirObra(obra)}
                                style={unfollowButtonStyle}
                              >
                                Deixar de seguir
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {autoresFiltrados.length > 0 && (
              <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
                <div style={isDesktop ? desktopSectionHeaderStyle : sectionHeaderStyle}>
                  <div style={sectionHeaderTextStyle}>
                    <h2 style={sectionTitleStyle}>AUTORES SEGUIDOS</h2>
                  </div>

                  <span style={sectionCounterStyle}>
                    {autoresFiltrados.length}
                  </span>
                </div>

                <div style={isDesktop ? desktopAuthorsGridStyle : authorsGridStyle}>
                  {autoresFiltrados.map((autor) => (
                    <article key={autor.chave} style={isDesktop ? desktopAuthorCardStyle : authorCardStyle}>
                      <div style={authorAvatarStyle}>
                        {autor.nome.slice(0, 1).toUpperCase()}
                      </div>

                      <div style={authorContentStyle}>
                        <div style={authorBadgeRowStyle}>
                          <span style={badgeStyleSmall}>
                            {autor.obras.length} {" "}
                            {autor.obras.length === 1 ? "obra" : "obras"}
                          </span>

                          {autor.totalEmLeitura > 0 && (
                            <span style={readingBadgeStyle}>
                              {autor.totalEmLeitura} em leitura
                            </span>
                          )}
                        </div>

                        <h3 style={authorNameStyle}>{autor.nome}</h3>

                        <div style={actionsStyle}>
                          <div style={isDesktop ? desktopAuthorActionsGridStyle : authorActionsGridStyle}>
                            <Link
                              href={criarHrefPerfilAutorSeguindo(
                                autor.nome,
                                autor.autorId
                              )}
                              style={readButtonStyle}
                            >
                              Abrir perfil
                            </Link>

                            <button
                              type="button"
                              onClick={() => deixarDeSeguirAutor(autor.chave)}
                              style={unfollowButtonStyle}
                            >
                              Deixar de seguir
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const seguindoPageCss = `
  .seguindo-summary-carousel {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .seguindo-summary-carousel::-webkit-scrollbar {
    display: none;
  }
`;

function criarDecoracaoTopoStyle(index: number): CSSProperties {
  const posicoes: CSSProperties[] = [
    { top: "8%", right: "8%", fontSize: "42px", transform: "rotate(-12deg)" },
    { top: "48%", right: "15%", fontSize: "28px", transform: "rotate(16deg)" },
    { bottom: "12%", right: "6%", fontSize: "34px", transform: "rotate(8deg)" },
    { top: "16%", left: "8%", fontSize: "22px", transform: "rotate(14deg)" },
  ];

  return {
    position: "absolute",
    color: "var(--historietas-accent, #FDBA74)",
    opacity: 0.13,
    lineHeight: 1,
    fontWeight: 950,
    filter: "drop-shadow(0 0 18px color-mix(in srgb, var(--historietas-accent, #F97316) 34%, transparent))",
    userSelect: "none",
    ...posicoes[index % posicoes.length],
  };
}

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
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(900px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "14px 0 calc(24px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1220px, calc(100% - 64px))",
  padding: "18px 0 40px",
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

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "16px",
};

const mobileTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "12px",
  padding: "0",
};

const topActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  flex: "0 0 auto",
};

const desktopTopActionsStyle: CSSProperties = {
  ...topActionsStyle,
  gap: "10px",
};

const soonTopButtonStyle: CSSProperties = {
  minHeight: "38px",
  padding: "0 13px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "-0.01em",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.055) 100%)",
  border: "1px solid rgba(255,255,255,0.13)",
  boxShadow: "none",
  whiteSpace: "nowrap",
};

const desktopSoonTopButtonStyle: CSSProperties = {
  ...soonTopButtonStyle,
  minHeight: "40px",
  padding: "0 16px",
  fontSize: "12px",
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
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #DDD6FE) 40%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow:
    "var(--historietas-logo-shadow, 0 0 28px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, transparent))",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const titleHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  flexWrap: "nowrap",
  marginBottom: "14px",
  padding: 0,
  minWidth: 0,
  textAlign: "center",
};

const titleHomeLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "23px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  width: "fit-content",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "visible",
  flex: "0 1 auto",
  ...safeTextStyle,
};

const titleLogoMarkStyle: CSSProperties = {
  width: "clamp(36px, 8vw, 48px)",
  height: "clamp(36px, 8vw, 48px)",
  borderRadius: "clamp(12px, 2.6vw, 16px)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "clamp(18px, 4.3vw, 24px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
  boxShadow: "none",
};

const desktopTitleLogoMarkStyle: CSSProperties = {
  ...titleLogoMarkStyle,
  width: "clamp(44px, 4.4vw, 58px)",
  height: "clamp(44px, 4.4vw, 58px)",
  borderRadius: "18px",
  fontSize: "clamp(22px, 2.2vw, 30px)",
};

const pageTitleTextStyle: CSSProperties = {
  display: "inline-block",
  margin: 0,
  marginLeft: 0,
  paddingRight: "0.2em",
  paddingBottom: "0.04em",
  whiteSpace: "nowrap",
  overflow: "visible",
  fontSize: "23px",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  wordSpacing: "0.11em",
  maxWidth: "100%",
  background: "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
  textAlign: "center",
  textShadow: "none",
  ...safeTextStyle,
};

const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  marginBottom: "18px",
};

const desktopTitleHomeLinkStyle: CSSProperties = {
  ...titleHomeLinkStyle,
};

const desktopPageTitleTextStyle: CSSProperties = {
  ...pageTitleTextStyle,
};

const heroStyle: CSSProperties = {
  position: "relative",
  borderRadius: "30px",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, rgba(255,255,255,0.08))",
  background:
    "radial-gradient(circle at 18% 0%, rgba(124,58,237,0.42), transparent 32%), radial-gradient(circle at 90% 45%, rgba(249,115,22,0.12), transparent 28%), linear-gradient(135deg, rgba(26,13,43,0.98) 0%, rgba(12,7,23,0.98) 100%)",
  padding: "18px",
  boxShadow:
    "var(--historietas-hero-shadow, 0 26px 70px rgba(0,0,0,0.36), 0 0 46px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, transparent), inset 0 1px 0 rgba(255,255,255,0.08))",
  minWidth: 0,
  overflow: "hidden",
};

const mobileHeroStyle: CSSProperties = {
  ...heroStyle,
  borderRadius: "28px",
};

const heroDecorationLayerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 0,
};


const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  padding: "20px 28px",
  borderRadius: "32px",
  minHeight: "138px",
  display: "grid",
  alignContent: "center",
};



const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
  gap: "6px",
  minWidth: 0,
};

const desktopHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  gap: "8px",
};

const titleStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: "0 auto",
  fontSize: "clamp(38px, 10vw, 56px)",
  lineHeight: 0.95,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  maxWidth: "100%",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #DDD6FE) 44%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textAlign: "center",
  ...safeTextStyle,
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  margin: "0 auto",
  fontSize: "clamp(46px, 4.7vw, 72px)",
  lineHeight: 0.94,
  maxWidth: "760px",
};

const descriptionStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: "8px auto 0",
  color: "var(--historietas-text-secondary, #E4E4E7)",
  fontSize: "13px",
  lineHeight: 1.55,
  fontWeight: 760,
  maxWidth: "620px",
  textAlign: "center",
  ...safeTextStyle,
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  margin: "10px auto 0",
  fontSize: "15px",
  lineHeight: 1.62,
  maxWidth: "680px",
};

const filterBoxStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gap: "11px",
  marginTop: "14px",
  padding: "13px",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(255,255,255,0.075)) 0%, var(--historietas-surface-strong, rgba(255,255,255,0.035)) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, var(--historietas-border-soft, rgba(255,255,255,0.08)))",
  boxShadow: "var(--historietas-card-shadow, none)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden"
};

const desktopFilterBoxStyle: CSSProperties = {
  ...filterBoxStyle,
  marginTop: "16px",
  padding: "16px",
  borderRadius: "26px",
  gap: "14px",
  overflow: "visible"
};

const filterHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
  minWidth: 0,
};

const desktopFilterHeaderStyle: CSSProperties = {
  ...filterHeaderStyle,
  alignItems: "center",
  flexWrap: "nowrap",
};

const filterHeaderTitleBoxStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
};

const filterTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "21px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

const filterResultBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "13px",
  right: "13px",
  width: "fit-content",
  maxWidth: "calc(100% - 26px)",
  padding: "8px 11px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent)",
  color: "color-mix(in srgb, var(--historietas-accent, #F97316) 65%, white)",
  fontSize: "12px",
  fontWeight: 950,
  boxSizing: "border-box",
  ...safeTextStyle,
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "43px",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, rgba(255,255,255,0.12))",
  background:
    "var(--historietas-input-bg, rgba(9,7,17,0.92))",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 15px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 800,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  boxShadow: "none",
  ...safeTextStyle
};

const desktopSearchInputStyle: CSSProperties = {
  ...searchInputStyle,
  minHeight: "42px",
};

const quickFiltersStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  minWidth: 0,
  maxWidth: "100%",
};

const desktopQuickFiltersStyle: CSSProperties = {
  ...quickFiltersStyle,
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
};

const quickFilterStyle: CSSProperties = {
  flex: "1 1 94px",
  minHeight: "36px",
  maxWidth: "100%",
  padding: "0 10px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background:
    "var(--historietas-secondary-surface, rgba(255,255,255,0.075))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle
};

const quickFilterActiveStyle: CSSProperties = {
  ...quickFilterStyle,
  background: "linear-gradient(135deg, var(--historietas-secondary, #7C3AED) 0%, var(--historietas-accent, #F97316) 100%)",
  border: "1px solid rgba(255,255,255,0.20)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  boxShadow: "none"
};

const filterFooterStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "10px",
  minWidth: 0,
};

const desktopFilterFooterStyle: CSSProperties = {
  ...filterFooterStyle,
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "end",
};

const fieldBoxStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const selectStyle: CSSProperties = {
  width: "100%",
  minHeight: "43px",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, rgba(255,255,255,0.12))",
  background:
    "var(--historietas-input-bg, rgba(9,7,17,0.92))",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 15px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 850,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  textAlign: "center",
  textAlignLast: "center",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)"
};

const clearFilterButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "50px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  fontSize: "14px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const desktopClearFilterButtonStyle: CSSProperties = {
  ...clearFilterButtonStyle,
  width: "auto",
  minHeight: "42px",
  padding: "0 16px",
  fontSize: "13px",
  whiteSpace: "nowrap",
};

const summaryGridStyle: CSSProperties = {
  display: "flex",
  gap: "7px",
  marginTop: "2px",
  marginLeft: "-13px",
  marginRight: "-13px",
  minWidth: 0,
  maxWidth: "calc(100% + 26px)",
  boxSizing: "border-box",
  overflowX: "auto",
  overflowY: "hidden",
  WebkitOverflowScrolling: "touch",
  padding: "0 13px",
};

const desktopSummaryGridStyle: CSSProperties = {
  ...summaryGridStyle,
  gap: "8px",
  marginTop: "2px",
  marginLeft: 0,
  marginRight: 0,
  maxWidth: "100%",
  padding: 0,
};

const summaryCardStyle: CSSProperties = {
  flex: "0 0 88px",
  minHeight: "46px",
  borderRadius: "14px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(255,255,255,0.075)) 0%, var(--historietas-surface-strong, rgba(255,255,255,0.032)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.075))",
  padding: "7px 6px",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  gap: "2px",
  minWidth: 0,
  overflow: "hidden",
  textAlign: "center",
  boxShadow: "none",
  boxSizing: "border-box",
};

const desktopSummaryCardStyle: CSSProperties = {
  ...summaryCardStyle,
  flexBasis: "100px",
  minHeight: "50px",
  padding: "7px 7px",
};

const summaryNumberStyle: CSSProperties = {
  color: "color-mix(in srgb, var(--historietas-accent, #F97316) 72%, white)",
  fontSize: "17px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  textShadow: "none",
  ...safeTextStyle
};

const desktopSummaryNumberStyle: CSSProperties = {
  ...summaryNumberStyle,
  fontSize: "18px",
};

const summaryLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  lineHeight: 1.08,
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const sectionStyle: CSSProperties = {
  marginTop: "18px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  width: "min(980px, 100%)",
  margin: "20px auto 0",
};

const sectionHeaderStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gridTemplateColumns: "auto auto",
  alignItems: "center",
  justifyContent: "center",
  columnGap: "11px",
  marginBottom: "10px",
  padding: "4px 0",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
  textAlign: "center"
};

const desktopSectionHeaderStyle: CSSProperties = {
  ...sectionHeaderStyle,
  width: "min(980px, 100%)",
  margin: "0 auto 12px",
  padding: "4px 0",
};

const miniTitleStyle: CSSProperties = {
  display: "inline-flex",
  color: "color-mix(in srgb, var(--historietas-accent, #F97316) 65%, white)",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  marginBottom: "6px",
  maxWidth: "100%",
  ...safeTextStyle,
};

const sectionHeaderTextStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "center",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "color-mix(in srgb, var(--historietas-accent, #F97316) 68%, white)",
  fontSize: "clamp(21px, 5.4vw, 25px)",
  lineHeight: 1.18,
  fontWeight: 950,
  letterSpacing: "0.035em",
  textAlign: "center",
  paddingBottom: "2px",
  maxWidth: "100%",
  textTransform: "uppercase",
  ...safeTextStyle
};

const sectionCounterStyle: CSSProperties = {
  position: "static",
  width: "42px",
  height: "42px",
  padding: 0,
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  boxShadow: "0 10px 22px color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)",
  zIndex: 2,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  minWidth: 0,
  maxWidth: "100%"
};

const desktopGridStyle: CSSProperties = {
  ...gridStyle,
  width: "min(980px, 100%)",
  margin: "0 auto",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px"
};

const authorsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  minWidth: 0,
  maxWidth: "100%"
};

const desktopAuthorsGridStyle: CSSProperties = {
  ...authorsGridStyle,
  width: "min(980px, 100%)",
  margin: "0 auto",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px"
};

const cardStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gridTemplateColumns: "minmax(112px, 0.38fr) minmax(0, 1fr)",
  alignItems: "start",
  gap: "10px",
  padding: "10px",
  borderRadius: "22px",
  overflow: "hidden",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(35,24,54,0.96)) 0%, var(--historietas-surface-strong, rgba(17,11,29,0.99)) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, var(--historietas-border-soft, rgba(255,255,255,0.08)))",
  boxShadow: "var(--historietas-card-shadow, none)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box"
};

const desktopCardStyle: CSSProperties = {
  ...cardStyle,
  display: "grid",
  gridTemplateColumns: "1fr",
  gridTemplateRows: "165px 1fr",
  gap: 0,
  padding: 0,
  borderRadius: "24px",
  boxShadow: "var(--historietas-card-shadow, none)"
};

const coverStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "176px",
  minHeight: "176px",
  maxWidth: "100%",
  alignSelf: "start",
  boxSizing: "border-box",
  borderRadius: "16px",
  background:
    "radial-gradient(circle at 24% 18%, color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent), transparent 34%), radial-gradient(circle at 78% 78%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, transparent), transparent 38%), linear-gradient(135deg, var(--historietas-surface, #211536) 0%, var(--historietas-surface-strong, #0F0B18) 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  overflow: "hidden",
  borderBottom: "none",
  minWidth: 0,
};

const desktopCoverStyle: CSSProperties = {
  ...coverStyle,
  height: "165px",
  minHeight: "165px",
  borderRadius: "24px 24px 0 0",
  borderBottom: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))"
};

const overlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.28) 100%)",
};

const coverContentStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: "9px",
  minWidth: 0,
  boxSizing: "border-box",
  pointerEvents: "none",
};

const coverTopBadgesStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "4px",
  minWidth: 0,
};

const genreStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, var(--historietas-surface, transparent))",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "9px",
  fontWeight: 900,
  ...safeTextStyle,
};

const coverBottomStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "center",
  gap: "6px",
  minWidth: 0,
};

const chapterNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
  fontSize: "34px",
  lineHeight: 0.9,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  flex: "0 0 auto",
  ...safeTextStyle,
};

const chapterTextStyle: CSSProperties = {
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
  fontSize: "10px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.055em",
  whiteSpace: "nowrap",
  overflowWrap: "normal",
  wordBreak: "normal",
};

const contentStyle: CSSProperties = {
  padding: 0,
  display: "grid",
  alignContent: "start",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box"
};

const desktopContentStyle: CSSProperties = {
  ...contentStyle,
  padding: "13px",
  gap: "9px"
};

const badgeRowStyle: CSSProperties = {
  display: "flex",
  gap: "4px",
  flexWrap: "wrap",
  alignItems: "center",
  minWidth: 0,
};

const badgeStyleSmall: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  color: "color-mix(in srgb, var(--historietas-accent, #F97316) 65%, white)",
  fontSize: "9px",
  fontWeight: 900,
  ...safeTextStyle,
};

const classificationBadgeStyle: CSSProperties = {
  ...genreStyle,
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 60%, rgba(255,255,255,0.08))",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 34%, rgba(255,255,255,0.10))",
};

const readingBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 32%, transparent)",
  color: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 40%, white)",
  fontSize: "9px",
  fontWeight: 950,
  ...safeTextStyle,
};

const favoriteBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 32%, transparent)",
  color: "color-mix(in srgb, var(--historietas-accent, #F97316) 65%, white)",
  fontSize: "9px",
  fontWeight: 950,
  ...safeTextStyle,
};

const cardTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "22px",
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textShadow: "0 0 22px rgba(255,255,255,0.08)",
  ...safeTextStyle
};

const authorLinkStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  margin: 0,
  color: "color-mix(in srgb, var(--historietas-accent, #F97316) 65%, white)",
  fontSize: "12px",
  fontWeight: 900,
  textDecoration: "none",
  borderBottom: "none",
  ...safeTextStyle,
};

const progressLineStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

const progressTrackStyle: CSSProperties = {
  width: "100%",
  height: "7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.09)",
  overflow: "hidden",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)"
};

const progressPercentStyle: CSSProperties = {
  color: "#86EFAC",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 950,
  whiteSpace: "nowrap",
  overflowWrap: "normal",
  wordBreak: "normal",
};

const progressBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(90deg, #22C55E 0%, var(--historietas-accent, #F97316) 58%, var(--historietas-secondary, #7C3AED) 100%)",
  boxShadow: "0 0 16px rgba(249,115,22,0.28)"
};

const actionsStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const primaryActionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopPrimaryActionsGridStyle: CSSProperties = {
  ...primaryActionsGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
};

const secondaryActionsRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "5px",
  alignItems: "stretch",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopSecondaryActionsRowStyle: CSSProperties = {
  ...secondaryActionsRowStyle,
  gap: "6px",
};

const readButtonStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, #FB923C 100%)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 9px",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle
};

const continueButtonStyle: CSSProperties = {
  ...readButtonStyle,
  background: "linear-gradient(135deg, var(--historietas-secondary, #7C3AED) 0%, #A78BFA 100%)",
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

const favoriteActionStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid rgba(251,191,36,0.24)",
  background: "color-mix(in srgb, #FBBF24 12%, var(--historietas-surface, transparent))",
  color: "color-mix(in srgb, #B45309 70%, var(--historietas-text-primary, #FFFFFF))",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  padding: "0 8px",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflowWrap: "normal",
  wordBreak: "normal",
  lineHeight: 1,
  ...safeTextStyle
};

const favoriteActionActiveStyle: CSSProperties = {
  ...favoriteActionStyle,
  background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)",
  border: "1px solid rgba(255,255,255,0.16)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  boxShadow: "0 10px 22px rgba(245,158,11,0.22)"
};

const completedActionStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, #22C55E 26%, var(--historietas-border-soft, transparent))",
  background: "color-mix(in srgb, #22C55E 12%, var(--historietas-surface, transparent))",
  color: "color-mix(in srgb, #166534 70%, var(--historietas-text-primary, #FFFFFF))",
  fontSize: "10px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  padding: "0 7px",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflowWrap: "normal",
  wordBreak: "normal",
};

const completedActionActiveStyle: CSSProperties = {
  ...completedActionStyle,
  background: "linear-gradient(135deg, #16A34A 0%, #22C55E 100%)",
  border: "1px solid rgba(255,255,255,0.16)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  boxShadow: "0 10px 22px rgba(34,197,94,0.22)"
};

const unfollowButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid rgba(251,113,133,0.28)",
  background: "var(--historietas-danger-surface, rgba(251,113,133,0.10))",
  color: "var(--historietas-danger-button-text, #FDA4AF)",
  fontSize: "10px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  padding: "0 7px",
  textAlign: "center",
  lineHeight: 1.12,
  ...safeTextStyle
};

const authorCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "80px minmax(0, 1fr)",
  alignItems: "center",
  gap: "10px",
  padding: "10px 12px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(32,22,49,0.96)) 0%, var(--historietas-surface-strong, rgba(17,11,29,0.99)) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, var(--historietas-border-soft, rgba(255,255,255,0.08)))",
  boxShadow: "var(--historietas-card-shadow, none)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden"
};

const desktopAuthorCardStyle: CSSProperties = {
  ...authorCardStyle,
  gridTemplateColumns: "84px minmax(0, 1fr)",
  padding: "12px 14px",
  borderRadius: "22px",
  boxShadow: "var(--historietas-card-shadow, none)"
};

const authorAvatarStyle: CSSProperties = {
  width: "80px",
  height: "80px",
  borderRadius: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, var(--historietas-secondary, #7C3AED) 0%, var(--historietas-accent, #F97316) 100%)",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
  fontSize: "32px",
  fontWeight: 950,
  boxShadow: "none",
  flex: "0 0 auto"
};

const authorContentStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  alignContent: "center",
  minWidth: 0,
  maxWidth: "100%",
};

const authorBadgeRowStyle: CSSProperties = {
  display: "flex",
  gap: "5px",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "flex-start",
  minWidth: 0,
  maxWidth: "100%",
};

const authorActionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopAuthorActionsGridStyle: CSSProperties = {
  ...authorActionsGridStyle,
  gap: "8px",
};

const authorNameStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "23px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.05em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const emptyBoxStyle: CSSProperties = {
  marginTop: "24px",
  borderRadius: "28px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.032) 100%)",
  border: "1px solid rgba(255,255,255,0.09)",
  padding: "24px",
  display: "grid",
  gap: "14px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "0 18px 44px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.06)"
};

const emptyMiniBoxStyle: CSSProperties = {
  padding: "16px",
  borderRadius: "20px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.032) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#D4D4D8",
  fontSize: "13px",
  fontWeight: 800,
  lineHeight: 1.45,
  boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
  ...safeTextStyle
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "30px",
  fontWeight: 950,
  letterSpacing: "-0.05em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  lineHeight: 1.7,
  fontSize: "14px",
  fontWeight: 600,
  maxWidth: "100%",
  ...safeTextStyle,
};

const emptyActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const exploreButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "52px",
  borderRadius: "999px",
  background: "linear-gradient(135deg, var(--historietas-secondary, #7C3AED) 0%, var(--historietas-accent, #F97316) 100%)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  border: "none",
  boxShadow: "0 14px 30px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, transparent)",
  ...safeTextStyle
};