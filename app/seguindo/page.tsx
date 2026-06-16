"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

type UsuarioSeguido = {
  id: string;
  nome: string;
  handle: string;
  bio: string;
  avatar: string;
  criadoEm: string;
};

type AtividadeSeguindo = {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioHandle: string;
  usuarioAvatar: string;
  tipo: string;
  tipoRotulo: string;
  titulo: string;
  descricao: string;
  data: string;
  href: string;
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
  | "usuarios"
  | "em-leitura"
  | "favoritas"
  | "concluidas";

type AbaSeguimentoPagina = "seguidores" | "seguindo";

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

function criarLoginHrefSeguindo() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/seguindo";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/seguindo";
  const params = new URLSearchParams({
    redirectTo: destinoSeguro,
  });

  return `/login?${params.toString()}`;
}

function obterParametrosSociaisSeguindoUrl(userIdLogado: string) {
  if (typeof window === "undefined") {
    return {
      aba: "seguindo" as AbaSeguimentoPagina,
      perfilId: "",
      perfilNome: "",
    };
  }

  const params = new URLSearchParams(window.location.search);
  const abaParam = params.get("aba") === "seguidores" ? "seguidores" : "seguindo";
  const perfilIdParam = (params.get("userId") || params.get("autorId") || "").trim();
  const perfilNomeParam = (params.get("autor") || params.get("nome") || "").trim();
  const perfilIdSeguro = idUsuarioSupabaseValido(perfilIdParam)
    ? perfilIdParam
    : abaParam === "seguidores"
      ? userIdLogado
      : "";

  return {
    aba: abaParam as AbaSeguimentoPagina,
    perfilId: perfilIdSeguro,
    perfilNome: perfilNomeParam,
  };
}

function idObraSupabaseValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

function criarHrefLeituraCapitulo(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo" | "publicado">,
  capitulo: CapituloLocal,
  numeroCapitulo: number
) {
  const slugSeguro = obra.slug?.trim() || criarSlugBase(obra.titulo);

  if (
    obra.publicado &&
    idObraSupabaseValido(obra.id) &&
    slugSeguro &&
    Number.isInteger(numeroCapitulo) &&
    numeroCapitulo > 0
  ) {
    return `/obra/${encodeURIComponent(slugSeguro)}/capitulo/${numeroCapitulo}`;
  }

  return `/ler-capitulo?obraId=${encodeURIComponent(
    obra.id
  )}&capituloId=${encodeURIComponent(capitulo.id)}`;
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

function idUsuarioSupabaseValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

function criarHrefPerfilUsuarioSeguindo(usuario: UsuarioSeguido) {
  const params = new URLSearchParams();

  params.set("userId", usuario.id);
  params.set("autorId", usuario.id);
  params.set("autor", usuario.nome.trim() || "Usuário");

  return `/perfil-autor?${params.toString()}`;
}

function obterAvatarProfileSeguindo(profile: RegistroSupabaseGenerico | undefined) {
  if (!profile) {
    return "";
  }

  return (
    obterTextoRegistro(profile, "avatar_url") ||
    obterTextoRegistro(profile, "avatar") ||
    obterTextoRegistro(profile, "foto_url") ||
    obterTextoRegistro(profile, "imagem_url") ||
    obterTextoRegistro(profile, "photo_url")
  );
}

function obterNomeProfileSeguindo(profile: RegistroSupabaseGenerico | undefined) {
  if (!profile) {
    return "";
  }

  return (
    obterTextoRegistro(profile, "nome") ||
    obterTextoRegistro(profile, "nome_usuario") ||
    obterTextoRegistro(profile, "username") ||
    obterTextoRegistro(profile, "display_name") ||
    obterTextoRegistro(profile, "apelido")
  );
}

function obterBioProfileSeguindo(profile: RegistroSupabaseGenerico | undefined) {
  if (!profile) {
    return "";
  }

  return (
    obterTextoRegistro(profile, "bio") ||
    obterTextoRegistro(profile, "sobre_bio") ||
    obterTextoRegistro(profile, "sobre") ||
    obterTextoRegistro(profile, "descricao")
  );
}

function criarAvatarUsuarioSeguindoStyle(avatar: string): CSSProperties {
  const avatarLimpo = avatar.trim();

  if (!avatarLimpo) {
    return {
      ...authorAvatarStyle,
      textDecoration: "none",
    };
  }

  return {
    ...authorAvatarStyle,
    textDecoration: "none",
    backgroundImage: `url(${avatarLimpo})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "transparent",
    WebkitTextFillColor: "transparent",
  };
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
    return {
      ...baseStyle,
      background: "#04000A",
      backgroundImage: "linear-gradient(135deg, #08030F 0%, #04000A 100%)",
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  return {
    ...baseStyle,
    background: "#04000A",
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

async function carregarUsuariosSeguidosSupabase(userId: string) {
  if (!userId) {
    return [] as UsuarioSeguido[];
  }

  try {
    const { data: seguindoData, error: seguindoError } = await supabase
      .from("seguindo_usuarios")
      .select("seguido_id, criado_em")
      .eq("seguidor_id", userId)
      .order("criado_em", { ascending: false });

    if (seguindoError || !Array.isArray(seguindoData)) {
      return [] as UsuarioSeguido[];
    }

    const registrosSeguindo: RegistroSupabaseGenerico[] = seguindoData
      .map((registro) => registro as RegistroSupabaseGenerico)
      .filter((registro) =>
        Boolean(registro) && typeof registro === "object" && !Array.isArray(registro)
      );
    const usuariosIds = Array.from(
      new Set(
        registrosSeguindo
          .map((registro) => obterTextoRegistro(registro, "seguido_id"))
          .filter((id) => idUsuarioSupabaseValido(id) && id !== userId)
      )
    );

    if (usuariosIds.length === 0) {
      return [] as UsuarioSeguido[];
    }

    const profilesPorUsuario = new Map<string, RegistroSupabaseGenerico>();

    try {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", usuariosIds);

      if (Array.isArray(profilesData)) {
        (profilesData as RegistroSupabaseGenerico[]).forEach((profile) => {
          const profileUserId = obterTextoRegistro(profile, "user_id");

          if (profileUserId) {
            profilesPorUsuario.set(profileUserId, profile);
          }
        });
      }
    } catch {
      // Algumas bases antigas usam id no lugar de user_id. O fallback vem abaixo.
    }

    const usuariosSemProfile = usuariosIds.filter(
      (usuarioId) => !profilesPorUsuario.has(usuarioId)
    );

    if (usuariosSemProfile.length > 0) {
      try {
        const { data: profilesDataPorId } = await supabase
          .from("profiles")
          .select("*")
          .in("id", usuariosSemProfile);

        if (Array.isArray(profilesDataPorId)) {
          (profilesDataPorId as RegistroSupabaseGenerico[]).forEach((profile) => {
            const profileUserId =
              obterTextoRegistro(profile, "user_id") || obterTextoRegistro(profile, "id");

            if (profileUserId) {
              profilesPorUsuario.set(profileUserId, profile);
            }
          });
        }
      } catch {
        // Profiles é complementar; a página segue com nome padrão se falhar.
      }
    }

    return registrosSeguindo
      .map((registro) => {
        const seguidoId = obterTextoRegistro(registro, "seguido_id");

        if (!idUsuarioSupabaseValido(seguidoId)) {
          return null;
        }

        const profile = profilesPorUsuario.get(seguidoId);
        const nome = obterNomeProfileSeguindo(profile) || "Usuário";
        const handleBase = normalizarTexto(nome)
          .replace(/[^a-z0-9]+/g, ".")
          .replace(/\.+/g, ".")
          .replace(/^\.|\.$/g, "");
        const handle = handleBase ? `@${handleBase}` : `@usuario.${seguidoId.slice(0, 4)}`;
        const bio = obterBioProfileSeguindo(profile) || "Perfil de leitor no Historietas.";
        const avatar = obterAvatarProfileSeguindo(profile);

        return {
          id: seguidoId,
          nome: nome.slice(0, 80),
          handle,
          bio: bio.slice(0, 140),
          avatar,
          criadoEm: obterTextoRegistro(registro, "criado_em"),
        } satisfies UsuarioSeguido;
      })
      .filter((usuario): usuario is UsuarioSeguido => Boolean(usuario));
  } catch (error) {
    console.warn("Não consegui carregar usuários seguidos:", error);
    return [] as UsuarioSeguido[];
  }
}


async function carregarUsuariosSeguidoresSupabase(userId: string) {
  if (!userId) {
    return [] as UsuarioSeguido[];
  }

  try {
    const { data: seguidoresData, error: seguidoresError } = await supabase
      .from("seguindo_usuarios")
      .select("seguidor_id, criado_em")
      .eq("seguido_id", userId)
      .order("criado_em", { ascending: false });

    if (seguidoresError || !Array.isArray(seguidoresData)) {
      return [] as UsuarioSeguido[];
    }

    const registrosSeguidores: RegistroSupabaseGenerico[] = seguidoresData
      .map((registro) => registro as RegistroSupabaseGenerico)
      .filter((registro) =>
        Boolean(registro) && typeof registro === "object" && !Array.isArray(registro)
      );
    const usuariosIds = Array.from(
      new Set(
        registrosSeguidores
          .map((registro) => obterTextoRegistro(registro, "seguidor_id"))
          .filter((id) => idUsuarioSupabaseValido(id) && id !== userId)
      )
    );

    if (usuariosIds.length === 0) {
      return [] as UsuarioSeguido[];
    }

    const profilesPorUsuario = new Map<string, RegistroSupabaseGenerico>();

    try {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", usuariosIds);

      if (Array.isArray(profilesData)) {
        (profilesData as RegistroSupabaseGenerico[]).forEach((profile) => {
          const profileUserId = obterTextoRegistro(profile, "user_id");

          if (profileUserId) {
            profilesPorUsuario.set(profileUserId, profile);
          }
        });
      }
    } catch {
      // Algumas bases antigas usam id no lugar de user_id. O fallback vem abaixo.
    }

    const usuariosSemProfile = usuariosIds.filter(
      (usuarioId) => !profilesPorUsuario.has(usuarioId)
    );

    if (usuariosSemProfile.length > 0) {
      try {
        const { data: profilesDataPorId } = await supabase
          .from("profiles")
          .select("*")
          .in("id", usuariosSemProfile);

        if (Array.isArray(profilesDataPorId)) {
          (profilesDataPorId as RegistroSupabaseGenerico[]).forEach((profile) => {
            const profileUserId =
              obterTextoRegistro(profile, "user_id") || obterTextoRegistro(profile, "id");

            if (profileUserId) {
              profilesPorUsuario.set(profileUserId, profile);
            }
          });
        }
      } catch {
        // Profiles é complementar; a página segue com nome padrão se falhar.
      }
    }

    return registrosSeguidores
      .map((registro) => {
        const seguidorId = obterTextoRegistro(registro, "seguidor_id");

        if (!idUsuarioSupabaseValido(seguidorId)) {
          return null;
        }

        const profile = profilesPorUsuario.get(seguidorId);
        const nome = obterNomeProfileSeguindo(profile) || "Usuário";
        const handleBase = normalizarTexto(nome)
          .replace(/[^a-z0-9]+/g, ".")
          .replace(/\.+/g, ".")
          .replace(/^\.|\.$/g, "");
        const handle = handleBase ? `@${handleBase}` : `@usuario.${seguidorId.slice(0, 4)}`;
        const bio = obterBioProfileSeguindo(profile) || "Perfil de leitor no Historietas.";
        const avatar = obterAvatarProfileSeguindo(profile);

        return {
          id: seguidorId,
          nome: nome.slice(0, 80),
          handle,
          bio: bio.slice(0, 140),
          avatar,
          criadoEm: obterTextoRegistro(registro, "criado_em"),
        } satisfies UsuarioSeguido;
      })
      .filter((usuario): usuario is UsuarioSeguido => Boolean(usuario));
  } catch (error) {
    console.warn("Não consegui carregar seguidores:", error);
    return [] as UsuarioSeguido[];
  }
}


function obterMetadataAtividadeSeguindo(valor: unknown) {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return {} as RegistroSupabaseGenerico;
  }

  return valor as RegistroSupabaseGenerico;
}

function formatarDataAtividadeSeguindo(dataIso: string) {
  if (!dataIso) {
    return "Data não informada";
  }

  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return "Data não informada";
  }

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function obterRotuloAtividadeSeguindo(tipo: string) {
  if (tipo === "leu_capitulo") {
    return "Leitura";
  }

  if (tipo === "comecou_ler") {
    return "Começou";
  }

  if (tipo === "concluiu_obra") {
    return "Concluiu";
  }

  if (tipo === "avaliou_obra") {
    return "Avaliou";
  }

  if (tipo === "favoritou_obra") {
    return "Favoritou";
  }

  if (tipo === "salvou_obra") {
    return "Salvou";
  }

  if (tipo === "publicou_review") {
    return "Review";
  }

  if (tipo === "criou_lista") {
    return "Lista";
  }

  return "Diário";
}

function montarTextoAtividadeSeguindo({
  tipo,
  tituloObra,
  nota,
}: {
  tipo: string;
  tituloObra: string;
  nota: number;
}) {
  if (tipo === "leu_capitulo") {
    return `leu um capítulo de ${tituloObra}`;
  }

  if (tipo === "comecou_ler") {
    return `começou a ler ${tituloObra}`;
  }

  if (tipo === "concluiu_obra") {
    return `concluiu ${tituloObra}`;
  }

  if (tipo === "avaliou_obra") {
    const notaTexto = Number.isFinite(nota) && nota > 0
      ? ` com ${nota.toFixed(1).replace(".", ",")} estrelas`
      : "";

    return `avaliou ${tituloObra}${notaTexto}`;
  }

  if (tipo === "favoritou_obra") {
    return `favoritou ${tituloObra}`;
  }

  if (tipo === "salvou_obra") {
    return `salvou ${tituloObra}`;
  }

  if (tipo === "publicou_review") {
    return `publicou uma review${tituloObra ? ` sobre ${tituloObra}` : ""}`;
  }

  if (tipo === "criou_lista") {
    return "criou uma lista de leitura";
  }

  return tituloObra ? `interagiu com ${tituloObra}` : "registrou uma atividade no Diário";
}

function obterDataRegistroAtividadeSeguindo(registro: RegistroSupabaseGenerico) {
  return (
    obterTextoRegistro(registro, "criado_em") ||
    obterTextoRegistro(registro, "created_at") ||
    obterTextoRegistro(registro, "atualizado_em") ||
    obterTextoRegistro(registro, "updated_at")
  );
}

function obterVisibilidadeAtividadeSeguindo(
  registro: RegistroSupabaseGenerico,
  fallback: "publico" | "parcial" | "privado",
) {
  const visibilidade = obterTextoRegistro(registro, "visibilidade") || fallback;

  if (
    visibilidade === "publico" ||
    visibilidade === "parcial" ||
    visibilidade === "privado"
  ) {
    return visibilidade;
  }

  return fallback;
}

function registroAtividadeSeguindoPodeAparecer(
  registro: RegistroSupabaseGenerico,
  fallback: "publico" | "parcial" | "privado",
) {
  const visibilidade = obterVisibilidadeAtividadeSeguindo(registro, fallback);

  return visibilidade === "publico" || visibilidade === "parcial";
}

function criarAtividadeSeguindoPorDados({
  id,
  usuario,
  tipo,
  tituloObra,
  nota,
  data,
  href,
}: {
  id: string;
  usuario: UsuarioSeguido;
  tipo: string;
  tituloObra: string;
  nota: number;
  data: string;
  href: string;
}): AtividadeSeguindo {
  return {
    id,
    usuarioId: usuario.id,
    usuarioNome: usuario.nome,
    usuarioHandle: usuario.handle,
    usuarioAvatar: usuario.avatar,
    tipo,
    tipoRotulo: obterRotuloAtividadeSeguindo(tipo),
    titulo: tituloObra,
    descricao: montarTextoAtividadeSeguindo({
      tipo,
      tituloObra,
      nota,
    }),
    data,
    href,
  };
}

function criarAtividadeSeguindoDoDiario({
  registro,
  usuariosPorId,
  obrasPorId,
}: {
  registro: RegistroSupabaseGenerico;
  usuariosPorId: Map<string, UsuarioSeguido>;
  obrasPorId: Map<string, ObraLocal>;
}) {
  if (!registroAtividadeSeguindoPodeAparecer(registro, "privado")) {
    return null;
  }

  const atividadeId = obterTextoRegistro(registro, "id");
  const usuarioId = obterTextoRegistro(registro, "user_id");
  const usuario = usuariosPorId.get(usuarioId);

  if (!atividadeId || !usuario) {
    return null;
  }

  const metadata = obterMetadataAtividadeSeguindo(registro.metadata);
  const tipo = obterTextoRegistro(registro, "tipo") || "diario";
  const obraId = obterTextoRegistro(registro, "obra_id");
  const obra = obraId ? obrasPorId.get(obraId) || null : null;
  const tituloObra =
    obra?.titulo ||
    obterTextoRegistro(metadata, "obra_titulo") ||
    obterTextoRegistro(metadata, "titulo_obra") ||
    obterTextoRegistro(metadata, "obra_relacionada") ||
    "atividade de leitura";
  const nota = Number(registro.nota ?? metadata.nota ?? metadata.rating ?? 0);
  const postId = obterTextoRegistro(metadata, "post_id");
  const href =
    obra?.link ||
    (obra?.slug
      ? `/obra/${obra.slug}`
      : postId
        ? `/comunidade?post=${encodeURIComponent(postId)}`
        : criarHrefPerfilUsuarioSeguindo(usuario));

  return criarAtividadeSeguindoPorDados({
    id: `diario-${atividadeId}`,
    usuario,
    tipo,
    tituloObra,
    nota,
    data: obterDataRegistroAtividadeSeguindo(registro),
    href,
  });
}

function criarAtividadeSeguindoDeObra({
  registro,
  usuariosPorId,
  obrasPorId,
  tipo,
  fallbackVisibilidade,
}: {
  registro: RegistroSupabaseGenerico;
  usuariosPorId: Map<string, UsuarioSeguido>;
  obrasPorId: Map<string, ObraLocal>;
  tipo: "favoritou_obra" | "concluiu_obra" | "avaliou_obra";
  fallbackVisibilidade: "publico" | "parcial" | "privado";
}) {
  if (!registroAtividadeSeguindoPodeAparecer(registro, fallbackVisibilidade)) {
    return null;
  }

  const usuarioId = obterTextoRegistro(registro, "user_id");
  const usuario = usuariosPorId.get(usuarioId);
  const obraId = obterIdObraRegistro(registro);
  const obra = obraId ? obrasPorId.get(obraId) || null : null;

  if (!usuario || !obra) {
    return null;
  }

  const nota = Number(registro.nota ?? registro.rating ?? registro.avaliacao ?? 0);
  const data = obterDataRegistroAtividadeSeguindo(registro) || obra.criadaEm;
  const registroId = obterTextoRegistro(registro, "id") || `${usuarioId}-${tipo}-${obraId}`;

  return criarAtividadeSeguindoPorDados({
    id: `${tipo}-${registroId}`,
    usuario,
    tipo,
    tituloObra: obra.titulo,
    nota,
    data,
    href: obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`,
  });
}

async function carregarRegistrosAtividadesTabelaSeguindo(
  tabela: "diario_atividades" | "favoritos" | "concluidas" | "obra_avaliacoes",
  usuariosIds: string[],
) {
  try {
    const { data, error } = await supabase
      .from(tabela)
      .select("*")
      .in("user_id", usuariosIds);

    if (error || !Array.isArray(data)) {
      return [] as RegistroSupabaseGenerico[];
    }

    return data.filter(
      (registro): registro is RegistroSupabaseGenerico =>
        Boolean(registro) && typeof registro === "object" && !Array.isArray(registro),
    );
  } catch (error) {
    console.warn(`Não consegui carregar ${tabela} no feed Seguindo:`, error);
    return [] as RegistroSupabaseGenerico[];
  }
}

function ordenarAtividadesSeguindo(itens: AtividadeSeguindo[]) {
  return [...itens].sort(
    (atividadeA, atividadeB) =>
      new Date(atividadeB.data).getTime() - new Date(atividadeA.data).getTime(),
  );
}

function deduplicarAtividadesSeguindo(itens: AtividadeSeguindo[]) {
  const atividadesPorChave = new Map<string, AtividadeSeguindo>();

  ordenarAtividadesSeguindo(itens).forEach((atividade) => {
    const chave = [
      atividade.usuarioId,
      atividade.tipo,
      normalizarTexto(atividade.titulo),
      atividade.href,
    ].join("|");

    if (!atividadesPorChave.has(chave)) {
      atividadesPorChave.set(chave, atividade);
    }
  });

  return ordenarAtividadesSeguindo(Array.from(atividadesPorChave.values()));
}

async function carregarAtividadesSeguindoSupabase(
  usuariosSeguidosBase: UsuarioSeguido[],
  obrasDisponiveis: ObraLocal[],
  usuarioLogadoId: string,
) {
  const usuariosIds = usuariosSeguidosBase
    .map((usuarioSeguido) => usuarioSeguido.id)
    .filter((id) => idUsuarioSupabaseValido(id) && id !== usuarioLogadoId);

  if (usuariosIds.length === 0) {
    return [] as AtividadeSeguindo[];
  }

  const usuariosPorId = new Map(
    usuariosSeguidosBase.map((usuarioSeguido) => [usuarioSeguido.id, usuarioSeguido])
  );
  const obrasPorId = new Map(
    obrasDisponiveis
      .filter((obra) => Boolean(obra.id))
      .map((obra) => [obra.id, obra])
  );

  const [diarioAtividades, favoritos, concluidas, avaliacoes] = await Promise.all([
    carregarRegistrosAtividadesTabelaSeguindo("diario_atividades", usuariosIds),
    carregarRegistrosAtividadesTabelaSeguindo("favoritos", usuariosIds),
    carregarRegistrosAtividadesTabelaSeguindo("concluidas", usuariosIds),
    carregarRegistrosAtividadesTabelaSeguindo("obra_avaliacoes", usuariosIds),
  ]);

  const atividadesDiario = diarioAtividades
    .map((registro) =>
      criarAtividadeSeguindoDoDiario({
        registro,
        usuariosPorId,
        obrasPorId,
      }),
    )
    .filter((atividade): atividade is AtividadeSeguindo => Boolean(atividade));

  const atividadesFavoritos = favoritos
    .map((registro) =>
      criarAtividadeSeguindoDeObra({
        registro,
        usuariosPorId,
        obrasPorId,
        tipo: "favoritou_obra",
        fallbackVisibilidade: "parcial",
      }),
    )
    .filter((atividade): atividade is AtividadeSeguindo => Boolean(atividade));

  const atividadesConcluidas = concluidas
    .map((registro) =>
      criarAtividadeSeguindoDeObra({
        registro,
        usuariosPorId,
        obrasPorId,
        tipo: "concluiu_obra",
        fallbackVisibilidade: "parcial",
      }),
    )
    .filter((atividade): atividade is AtividadeSeguindo => Boolean(atividade));

  const atividadesAvaliacoes = avaliacoes
    .map((registro) =>
      criarAtividadeSeguindoDeObra({
        registro,
        usuariosPorId,
        obrasPorId,
        tipo: "avaliou_obra",
        fallbackVisibilidade: "publico",
      }),
    )
    .filter((atividade): atividade is AtividadeSeguindo => Boolean(atividade));

  return deduplicarAtividadesSeguindo([
    ...atividadesDiario,
    ...atividadesFavoritos,
    ...atividadesConcluidas,
    ...atividadesAvaliacoes,
  ]).slice(0, 30);
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
      const visibilidade = tabela === "seguindo_obras" ? "privado" : "parcial";
      const payloadBase = {
        user_id: userId,
        obra_id: obraId,
      };
      const { error: erroComVisibilidade } = await supabase.from(tabela).insert({
        ...payloadBase,
        visibilidade,
      });

      if (!erroComVisibilidade) {
        return;
      }

      const { error: erroSemVisibilidade } = await supabase
        .from(tabela)
        .insert(payloadBase);

      if (erroSemVisibilidade) {
        throw erroSemVisibilidade;
      }
    }
  } catch (error) {
    console.warn(`Não consegui sincronizar ${tabela} no Supabase:`, error);
  }
}

export default function SeguindoPage() {
  const router = useRouter();
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [obrasSeguidas, setObrasSeguidas] = useState<string[]>([]);
  const [autoresSeguidos, setAutoresSeguidos] = useState<string[]>([]);
  const [usuariosSeguidos, setUsuariosSeguidos] = useState<UsuarioSeguido[]>([]);
  const [usuariosSeguidores, setUsuariosSeguidores] = useState<UsuarioSeguido[]>([]);
  const [atividadesSeguindo, setAtividadesSeguindo] = useState<AtividadeSeguindo[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [, setCarregando] = useState(false);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroSeguindo>("todos");
  const [ordenacao, setOrdenacao] =
    useState<OrdenacaoSeguindo>("recentes");
  const [isDesktop, setIsDesktop] = useState(false);
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [usuarioLogadoId, setUsuarioLogadoId] = useState("");
  const [abaSeguimento, setAbaSeguimento] =
    useState<AbaSeguimentoPagina>("seguindo");
  const [perfilSocialId, setPerfilSocialId] = useState("");
  const [perfilSocialNome, setPerfilSocialNome] = useState("");
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
    let cancelado = false;

    async function verificarAcesso() {
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id || "";

        if (!userId) {
          router.replace(criarLoginHrefSeguindo());
          return;
        }

        const parametrosSociais = obterParametrosSociaisSeguindoUrl(userId);

        if (!cancelado) {
          setUsuarioLogadoId(userId);
          setAbaSeguimento(parametrosSociais.aba);
          setPerfilSocialId(parametrosSociais.perfilId);
          setPerfilSocialNome(parametrosSociais.perfilNome);
          setVerificandoAcesso(false);
        }
      } catch {
        if (!cancelado) {
          router.replace(criarLoginHrefSeguindo());
        }
      }
    }

    void verificarAcesso();

    return () => {
      cancelado = true;
    };
  }, [router]);

  useEffect(() => {
    if (!usuarioLogadoId) {
      return;
    }

    void carregarDadosSeguindo();
  }, [usuarioLogadoId, perfilSocialId]);

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

    const perfilIdParaListaSocial = perfilSocialId || usuarioLogadoId;
    const [
      dadosSupabase,
      usuariosSeguidosSupabase,
      usuariosSeguidoresSupabase,
    ] = await Promise.all([
      carregarSeguindoSupabase(
        obrasNormalizadas,
        seguindoNormalizado,
        favoritasNormalizadas,
        concluidasNormalizadas
      ),
      carregarUsuariosSeguidosSupabase(perfilIdParaListaSocial),
      carregarUsuariosSeguidoresSupabase(perfilIdParaListaSocial),
    ]);

    obrasNormalizadas = dadosSupabase.obras.map((obra, index) =>
      normalizarObraSalva(obra as ObraSalva, index)
    );
    const atividadesSeguindoSupabase = await carregarAtividadesSeguindoSupabase(
      usuariosSeguidosSupabase,
      obrasNormalizadas,
      usuarioLogadoId
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
    setUsuariosSeguidos(usuariosSeguidosSupabase);
    setUsuariosSeguidores(usuariosSeguidoresSupabase);
    setAtividadesSeguindo(atividadesSeguindoSupabase);
    setObrasFavoritas(favoritasNormalizadas);
    setObrasConcluidas(concluidasNormalizadas);
    setNotificacoesNaoLidas(totalNotificacoesNaoLidas);
    setCarregando(false);
  }

  const termoBusca = normalizarTexto(busca);
  const visualizandoListaSocialDoPerfil = Boolean(perfilSocialId);
  const usuariosBaseSocial =
    visualizandoListaSocialDoPerfil && abaSeguimento === "seguidores"
      ? usuariosSeguidores
      : usuariosSeguidos;
  const tituloListaSocial =
    abaSeguimento === "seguidores" ? "SEGUIDORES" : "SEGUINDO";
  const descricaoListaSocial = perfilSocialNome.trim()
    ? `${tituloListaSocial.toLowerCase()} de ${perfilSocialNome.trim()}`
    : tituloListaSocial.toLowerCase();
  const podeRemoverUsuariosDaLista =
    !visualizandoListaSocialDoPerfil && abaSeguimento === "seguindo";

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
    if (visualizandoListaSocialDoPerfil) {
      return [] as ObraLocal[];
    }

    const filtradas = obrasSeguidasBase.filter((obra) => {
      if (filtro === "autores" || filtro === "usuarios") {
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
    visualizandoListaSocialDoPerfil,
  ]);

  const autoresFiltrados = useMemo<AutorSeguido[]>(() => {
    if (visualizandoListaSocialDoPerfil) {
      return [] as AutorSeguido[];
    }

    const filtrados = autoresBase.filter((autor) => {
      if (filtro === "obras" || filtro === "usuarios") {
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

  const usuariosFiltrados = useMemo<UsuarioSeguido[]>(() => {
    const filtrados = usuariosBaseSocial.filter((usuarioSeguido) => {
      if (
        !visualizandoListaSocialDoPerfil &&
        filtro !== "todos" &&
        filtro !== "usuarios"
      ) {
        return false;
      }

      const textoUsuario = normalizarTexto(
        [usuarioSeguido.nome, usuarioSeguido.handle, usuarioSeguido.bio].join(" ")
      );

      return termoBusca ? textoUsuario.includes(termoBusca) : true;
    });

    return [...filtrados].sort((usuarioA, usuarioB) => {
      if (ordenacao === "titulo") {
        return usuarioA.nome.localeCompare(usuarioB.nome);
      }

      return (
        new Date(usuarioB.criadoEm).getTime() - new Date(usuarioA.criadoEm).getTime()
      );
    });
  }, [usuariosSeguidos, termoBusca, filtro, ordenacao]);

  const atividadesFiltradas = useMemo<AtividadeSeguindo[]>(() => {
    if (visualizandoListaSocialDoPerfil) {
      return [] as AtividadeSeguindo[];
    }

    const filtradas = atividadesSeguindo.filter((atividade) => {
      if (filtro !== "todos" && filtro !== "usuarios") {
        return false;
      }

      const textoAtividade = normalizarTexto(
        [
          atividade.usuarioNome,
          atividade.usuarioHandle,
          atividade.tipoRotulo,
          atividade.titulo,
          atividade.descricao,
        ].join(" ")
      );

      return termoBusca ? textoAtividade.includes(termoBusca) : true;
    });

    return [...filtradas].sort((atividadeA, atividadeB) => {
      return (
        new Date(atividadeB.data).getTime() - new Date(atividadeA.data).getTime()
      );
    });
  }, [atividadesSeguindo, termoBusca, filtro]);

  const totalSemFiltros = visualizandoListaSocialDoPerfil
    ? usuariosBaseSocial.length
    : obrasSeguidasBase.length + autoresBase.length + usuariosSeguidos.length;

  const totalSeguindo = visualizandoListaSocialDoPerfil
    ? usuariosFiltrados.length
    : obrasFiltradas.length + autoresFiltrados.length + usuariosFiltrados.length;

  const totalLidosSeguidos = obrasFiltradas.reduce((total, obra) => {
    return total + obra.capitulos.filter((capitulo) => capitulo.lido).length;
  }, 0);

  const totalEmLeituraSeguidas = obrasFiltradas.filter((obra) =>
    obraEmLeitura(obra)
  ).length;

  const filtrosAtivos = Boolean(
    busca.trim() ||
      (!visualizandoListaSocialDoPerfil && filtro !== "todos") ||
      ordenacao !== "recentes"
  );

  function trocarAbaSeguimento(novaAba: AbaSeguimentoPagina) {
    setAbaSeguimento(novaAba);
    setBusca("");
    setFiltro("usuarios");

    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const perfilIdParaUrl = perfilSocialId || usuarioLogadoId;

    params.set("aba", novaAba);

    if (perfilIdParaUrl) {
      params.set("userId", perfilIdParaUrl);
      params.set("autorId", perfilIdParaUrl);
    }

    if (perfilSocialNome.trim()) {
      params.set("autor", perfilSocialNome.trim());
    }

    window.history.replaceState(null, "", `/seguindo?${params.toString()}`);
  }

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

  function deixarDeSeguirUsuario(usuarioId: string) {
    const usuarioIdLimpo = usuarioId.trim();

    if (!usuarioIdLimpo) {
      return;
    }

    setUsuariosSeguidos((usuariosAtuais) =>
      usuariosAtuais.filter((usuarioSeguido) => usuarioSeguido.id !== usuarioIdLimpo)
    );
    setAtividadesSeguindo((atividadesAtuais) =>
      atividadesAtuais.filter((atividade) => atividade.usuarioId !== usuarioIdLimpo)
    );

    if (!usuarioLogadoId) {
      return;
    }

    void supabase
      .from("seguindo_usuarios")
      .delete()
      .eq("seguidor_id", usuarioLogadoId)
      .eq("seguido_id", usuarioIdLimpo);
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

  if (verificandoAcesso) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${seguindoPageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}

        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <div style={emptyBoxStyle}>
            <h2 style={emptyTitleStyle}>Verificando acesso...</h2>

            <p style={emptyTextStyle}>
              Aguarde enquanto confirmamos sua sessão.
            </p>
          </div>
        </section>
      </main>
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
              placeholder={
                visualizandoListaSocialDoPerfil
                  ? `Buscar em ${descricaoListaSocial}...`
                  : "Buscar obra, autor, pessoa, gênero, tag ou classificação..."
              }
              style={isDesktop ? desktopSearchInputStyle : searchInputStyle}
              type="text"
            />

            {visualizandoListaSocialDoPerfil && (
              <div style={isDesktop ? desktopQuickFiltersStyle : quickFiltersStyle}>
                <button
                  type="button"
                  onClick={() => trocarAbaSeguimento("seguidores")}
                  style={
                    abaSeguimento === "seguidores"
                      ? quickFilterActiveStyle
                      : quickFilterStyle
                  }
                >
                  Seguidores
                </button>

                <button
                  type="button"
                  onClick={() => trocarAbaSeguimento("seguindo")}
                  style={
                    abaSeguimento === "seguindo"
                      ? quickFilterActiveStyle
                      : quickFilterStyle
                  }
                >
                  Seguindo
                </button>
              </div>
            )}

            {!visualizandoListaSocialDoPerfil && (
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
                onClick={() => setFiltro("usuarios")}
                style={filtro === "usuarios" ? quickFilterActiveStyle : quickFilterStyle}
              >
                Pessoas
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
            )}

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
                <span style={summaryLabelStyle}>
                  {visualizandoListaSocialDoPerfil
                    ? abaSeguimento === "seguidores"
                      ? "seguidores"
                      : "seguindo"
                    : "seguindo"}
                </span>
              </div>

              {!visualizandoListaSocialDoPerfil && (
              <div style={isDesktop ? desktopSummaryCardStyle : summaryCardStyle}>
                <strong style={isDesktop ? desktopSummaryNumberStyle : summaryNumberStyle}>{obrasFiltradas.length}</strong>
                <span style={summaryLabelStyle}>
                  {obrasFiltradas.length === 1 ? "obra seguida" : "obras seguidas"}
                </span>
              </div>
              )}

              <div style={isDesktop ? desktopSummaryCardStyle : summaryCardStyle}>
                <strong style={isDesktop ? desktopSummaryNumberStyle : summaryNumberStyle}>{autoresFiltrados.length}</strong>
                <span style={summaryLabelStyle}>
                  {autoresFiltrados.length === 1
                    ? "autor seguido"
                    : "autores seguidos"}
                </span>
              </div>

              <div style={isDesktop ? desktopSummaryCardStyle : summaryCardStyle}>
                <strong style={isDesktop ? desktopSummaryNumberStyle : summaryNumberStyle}>{usuariosFiltrados.length}</strong>
                <span style={summaryLabelStyle}>
                  {usuariosFiltrados.length === 1
                    ? "pessoa seguida"
                    : "pessoas seguidas"}
                </span>
              </div>

              <div style={isDesktop ? desktopSummaryCardStyle : summaryCardStyle}>
                <strong style={isDesktop ? desktopSummaryNumberStyle : summaryNumberStyle}>{atividadesFiltradas.length}</strong>
                <span style={summaryLabelStyle}>atividades</span>
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
            <h2 style={emptyTitleStyle}>
              {visualizandoListaSocialDoPerfil
                ? abaSeguimento === "seguidores"
                  ? "Nenhum seguidor ainda"
                  : "Nenhum perfil seguido ainda"
                : "Você ainda não segue nada"}
            </h2>

            <p style={emptyTextStyle}>
              {visualizandoListaSocialDoPerfil
                ? abaSeguimento === "seguidores"
                  ? "Quando alguém seguir este perfil, aparecerá aqui."
                  : "Quando este perfil seguir outras pessoas, elas aparecerão aqui."
                : 'Entre em uma obra e clique em "Seguir obra", ou entre no perfil de uma pessoa e clique em "Seguir".'}
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
                  {visualizandoListaSocialDoPerfil
                    ? `Nenhum perfil encontrado em ${descricaoListaSocial}.`
                    : "Nenhuma obra, autor ou pessoa seguida combina com a busca e os filtros atuais."}
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
                    const indiceCapituloDeLeitura = capituloDeLeitura
                      ? obra.capitulos.findIndex(
                          (capitulo) => capitulo.id === capituloDeLeitura.id
                        )
                      : -1;
                    const numeroCapituloDeLeitura =
                      indiceCapituloDeLeitura >= 0
                        ? indiceCapituloDeLeitura + 1
                        : 1;
                    const leituraHref = capituloDeLeitura
                      ? criarHrefLeituraCapitulo(
                          obra,
                          capituloDeLeitura,
                          numeroCapituloDeLeitura
                        )
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

            {atividadesFiltradas.length > 0 && (
              <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
                <div style={isDesktop ? desktopSectionHeaderStyle : sectionHeaderStyle}>
                  <div style={sectionHeaderTextStyle}>
                    <h2 style={sectionTitleStyle}>ATIVIDADES RECENTES</h2>
                  </div>

                  <span style={sectionCounterStyle}>
                    {atividadesFiltradas.length}
                  </span>
                </div>

                <div style={isDesktop ? desktopAuthorsGridStyle : authorsGridStyle}>
                  {atividadesFiltradas.slice(0, 12).map((atividade) => {
                    const perfilUsuario = usuariosSeguidos.find(
                      (usuarioSeguido) => usuarioSeguido.id === atividade.usuarioId
                    );
                    const perfilHref = perfilUsuario
                      ? criarHrefPerfilUsuarioSeguindo(perfilUsuario)
                      : "/perfil-autor";

                    return (
                      <article key={atividade.id} style={isDesktop ? desktopAuthorCardStyle : authorCardStyle}>
                        <Link
                          href={perfilHref}
                          style={criarAvatarUsuarioSeguindoStyle(atividade.usuarioAvatar)}
                          aria-label={`Abrir perfil de ${atividade.usuarioNome}`}
                        >
                          {!atividade.usuarioAvatar && atividade.usuarioNome.slice(0, 1).toUpperCase()}
                        </Link>

                        <div style={authorContentStyle}>
                          <div style={authorBadgeRowStyle}>
                            <span style={badgeStyleSmall}>{atividade.tipoRotulo}</span>

                            <span style={readingBadgeStyle}>Diário</span>
                          </div>

                          <h3 style={authorNameStyle}>{atividade.usuarioNome}</h3>

                          <span style={authorLinkStyle}>{atividade.descricao}</span>
                          <span style={summaryLabelStyle}>
                            {formatarDataAtividadeSeguindo(atividade.data)}
                          </span>

                          <div style={actionsStyle}>
                            <div style={isDesktop ? desktopAuthorActionsGridStyle : authorActionsGridStyle}>
                              <Link href={atividade.href} style={readButtonStyle}>
                                Abrir atividade
                              </Link>

                              <Link href={perfilHref} style={continueButtonStyle}>
                                Ver perfil
                              </Link>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {usuariosFiltrados.length > 0 && (
              <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
                <div style={isDesktop ? desktopSectionHeaderStyle : sectionHeaderStyle}>
                  <div style={sectionHeaderTextStyle}>
                    <h2 style={sectionTitleStyle}>
                      {visualizandoListaSocialDoPerfil
                        ? tituloListaSocial
                        : "PESSOAS SEGUIDAS"}
                    </h2>
                  </div>

                  <span style={sectionCounterStyle}>
                    {usuariosFiltrados.length}
                  </span>
                </div>

                <div style={isDesktop ? desktopAuthorsGridStyle : authorsGridStyle}>
                  {usuariosFiltrados.map((usuarioSeguido) => (
                    <article key={usuarioSeguido.id} style={isDesktop ? desktopAuthorCardStyle : authorCardStyle}>
                      <Link
                        href={criarHrefPerfilUsuarioSeguindo(usuarioSeguido)}
                        style={criarAvatarUsuarioSeguindoStyle(usuarioSeguido.avatar)}
                        aria-label={`Abrir perfil de ${usuarioSeguido.nome}`}
                      >
                        {!usuarioSeguido.avatar && usuarioSeguido.nome.slice(0, 1).toUpperCase()}
                      </Link>

                      <div style={authorContentStyle}>
                        <div style={authorBadgeRowStyle}>
                          <span style={badgeStyleSmall}>Perfil</span>

                          <span style={readingBadgeStyle}>Diário</span>
                        </div>

                        <h3 style={authorNameStyle}>{usuarioSeguido.nome}</h3>

                        <span style={authorLinkStyle}>{usuarioSeguido.handle}</span>

                        <p style={authorBioStyle}>{usuarioSeguido.bio}</p>

                        <div style={actionsStyle}>
                          <div style={isDesktop ? desktopAuthorActionsGridStyle : authorActionsGridStyle}>
                            <Link
                              href={criarHrefPerfilUsuarioSeguindo(usuarioSeguido)}
                              style={readButtonStyle}
                            >
                              Abrir perfil
                            </Link>

                            {podeRemoverUsuariosDaLista && (
                              <button
                                type="button"
                                onClick={() => deixarDeSeguirUsuario(usuarioSeguido.id)}
                                style={unfollowButtonStyle}
                              >
                                Deixar de seguir
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

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
  html[data-historietas-tema-visual] body,
  html[data-historietas-tema-visual] main,
  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #070212 !important;
  }

  html[data-historietas-tema-visual] main > div[aria-hidden="true"],
  html[data-historietas-tema-visual="original"] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  html[data-historietas-tema-visual] nav,
  html[data-historietas-tema-visual] [data-bottom-nav],
  html[data-historietas-tema-visual] [data-mobile-nav] {
    background: var(--historietas-bottom-nav-bg, #04000A) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/seguindo"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/seguindo"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/seguindo"] {
    background: var(--historietas-bottom-nav-active-bg, rgba(59, 7, 100, 0.54)) !important;
    border-color: var(--historietas-bottom-nav-active-border, rgba(109, 40, 217, 0.48)) !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] nav a[href="/seguindo"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/seguindo"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/seguindo"] .historietas-bottom-nav-icon {
    color: #FFFFFF !important;
    background: var(--historietas-bottom-nav-active-icon-bg, #3B0764) !important;
    border-color: var(--historietas-bottom-nav-active-icon-border, rgba(167, 139, 250, 0.46)) !important;
  }

  html[data-historietas-tema-visual] input::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  html[data-historietas-tema-visual] input,
  html[data-historietas-tema-visual] textarea,
  html[data-historietas-tema-visual] select {
    color: #FFFFFF !important;
  }

  .seguindo-summary-carousel {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .seguindo-summary-carousel::-webkit-scrollbar {
    display: none;
  }
`;

function criarDecoracaoTopoStyle(_index: number): CSSProperties {
  return {
    display: "none",
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
  background: "transparent",
  WebkitMaskImage: "none",
  maskImage: "none",
  opacity: 0,
};

const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  WebkitMaskImage: "none",
  maskImage: "none",
  opacity: 0,
};


const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background: "#070212",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
  isolation: "isolate",
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
  minHeight: "36px",
  padding: "0 12px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#04000A",
  color: "#DDD6FE",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  boxShadow: "none",
  ...safeTextStyle,
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
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#04000A",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
  border: "1px solid rgba(59, 7, 100, 0.58)",
  boxShadow: "none",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #DDD6FE 44%, #A78BFA 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "none",
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
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#04000A",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  border: "1px solid rgba(59, 7, 100, 0.58)",
  boxShadow: "none",
  flex: "0 0 auto",
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
  color: "var(--historietas-accent, #F97316)",
  WebkitTextFillColor: "var(--historietas-accent, #F97316)",
  textAlign: "center",
  textShadow: "none",
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
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
  gap: "12px",
  borderRadius: "30px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "linear-gradient(135deg, #070212 0%, #04000A 58%, #020006 100%)",
  padding: "18px",
  boxShadow: "none",
  minWidth: 0,
  overflow: "hidden",
};

const mobileHeroStyle: CSSProperties = {
  ...heroStyle,
  borderRadius: "28px",
};

const heroDecorationLayerStyle: CSSProperties = {
  display: "none",
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
  color: "var(--historietas-accent, #F97316)",
  textAlign: "center",
  textShadow: "none",
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
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "14px",
  lineHeight: 1.55,
  fontWeight: 720,
  maxWidth: "680px",
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
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
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
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#DDD6FE",
  fontSize: "12px",
  fontWeight: 950,
  boxSizing: "border-box",
  ...safeTextStyle,
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "43px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#04000A",
  color: "#FFFFFF",
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
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
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
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
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
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#04000A",
  color: "#FFFFFF",
  padding: "0 15px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 850,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  textAlign: "center",
  textAlignLast: "center",
  boxShadow: "none"
};

const clearFilterButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "50px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
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
  boxShadow: "none",
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
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
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
  color: "#DDD6FE",
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
  color: "var(--historietas-accent, #F97316)",
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
  color: "var(--historietas-accent, #F97316)",
  fontSize: "clamp(24px, 6vw, 30px)",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  textAlign: "center",
  paddingBottom: "2px",
  maxWidth: "100%",
  textTransform: "none",
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
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  boxShadow: "none",
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
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
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
  boxShadow: "none"
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
  background: "#04000A",
  backgroundImage: "linear-gradient(135deg, #08030F 0%, #04000A 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.08)",
  borderBottom: "none",
  minWidth: 0,
  boxShadow: "none",
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
  background: "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.26) 100%)",
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
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.08)",
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
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  fontWeight: 900,
  ...safeTextStyle,
};

const classificationBadgeStyle: CSSProperties = {
  ...genreStyle,
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const readingBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  fontWeight: 950,
  ...safeTextStyle,
};

const favoriteBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#DDD6FE",
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
  textShadow: "none",
  ...safeTextStyle
};

const authorLinkStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  margin: 0,
  color: "var(--historietas-text-secondary, #D8C8FF)",
  fontSize: "12px",
  fontWeight: 900,
  textDecoration: "none",
  borderBottom: "none",
  ...safeTextStyle,
};

const authorBioStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.72)",
  fontSize: "12px",
  lineHeight: 1.35,
  fontWeight: 750,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
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
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
  boxShadow: "none"
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
  background:
    "linear-gradient(90deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  boxShadow: "none"
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
  background: "#08030F",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 9px",
  border: "1px solid rgba(255,255,255,0.10)",
  cursor: "pointer",
  fontFamily: "inherit",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle
};

const continueButtonStyle: CSSProperties = {
  ...readButtonStyle,
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
};

const disabledActionStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
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
  boxShadow: "none",
  ...safeTextStyle,
};

const favoriteActionStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
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
  boxShadow: "none",
  ...safeTextStyle
};

const favoriteActionActiveStyle: CSSProperties = {
  ...favoriteActionStyle,
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  boxShadow: "none"
};

const completedActionStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid rgba(34,197,94,0.20)",
  background: "rgba(34,197,94,0.085)",
  color: "#86EFAC",
  fontSize: "10px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  padding: "0 7px",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflowWrap: "normal",
  wordBreak: "normal",
  boxShadow: "none",
};

const completedActionActiveStyle: CSSProperties = {
  ...completedActionStyle,
  background: "rgba(34,197,94,0.14)",
  border: "1px solid rgba(34,197,94,0.28)",
  color: "#BBF7D0",
  boxShadow: "none"
};

const unfollowButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid rgba(239,68,68,0.18)",
  background: "rgba(239,68,68,0.075)",
  color: "#FCA5A5",
  fontSize: "10px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  padding: "0 7px",
  textAlign: "center",
  lineHeight: 1.12,
  boxShadow: "none",
  ...safeTextStyle
};

const authorCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "80px minmax(0, 1fr)",
  alignItems: "center",
  gap: "10px",
  padding: "10px 12px",
  borderRadius: "22px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
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
  boxShadow: "none"
};

const authorAvatarStyle: CSSProperties = {
  width: "80px",
  height: "80px",
  borderRadius: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#04000A",
  border: "1px solid rgba(255,255,255,0.08)",
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
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  padding: "24px",
  display: "grid",
  gap: "14px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "none"
};

const emptyMiniBoxStyle: CSSProperties = {
  padding: "16px",
  borderRadius: "20px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "#D4D4D8",
  fontSize: "13px",
  fontWeight: 800,
  lineHeight: 1.45,
  boxShadow: "none",
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
  background: "#08030F",
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
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "none",
  ...safeTextStyle
};