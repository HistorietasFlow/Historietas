"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, TouchEvent } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabase/client";
import { criarSlugBase, normalizarTexto } from "../../lib/utils";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { ehClassificacao18 } from "../../lib/historietasAdultContent";
import {
  carregarEstadoRelacionamentoPerfil,
  carregarPermissoesAbasPerfil,
  carregarPreferenciasPrivacidade,
  preferenciasPrivacidadePadrao,
  type EstadoRelacionamentoPerfil,
  type PermissoesAbasPerfil,
  type PreferenciasPrivacidadeHistorietas,
} from "../../lib/historietasPrivacy";
import DenunciaModal, {
  type TipoAlvoDenuncia,
} from "../../components/DenunciaModal";

type ModoLista = "perfil" | "obras" | "autores";
type OrigemPerfil = "diario" | "biblioteca";
type CategoriaPerfil =
  | "tudo"
  | "lendo"
  | "quero-ler"
  | "favoritas"
  | "concluidas"
  | "avaliacoes"
  | "historico";
type OrdenacaoLista = "recentes" | "titulo" | "avaliacao" | "popularidade";
type VisibilidadeAnotacaoListas = "publico" | "parcial" | "privado";
type QuemPodeComentarAnotacaoListas =
  | "herdar"
  | "todos"
  | "seguidores"
  | "ninguem";
type VisibilidadeComentariosAnotacaoListas =
  | "herdar"
  | "publico"
  | "seguidores"
  | "somente_eu";
type OrdenacaoComentariosDiarioListas = "relevantes" | "recentes";
type QuemPodeAvaliarDiarioListas = "todos" | "seguidores" | "ninguem";
type TipoDiarioListas =
  | "lendo"
  | "quero_ler"
  | "favorita"
  | "concluida"
  | "avaliacao"
  | "review"
  | "atividade";

type CapituloLista = {
  id: string;
  obraId: string;
  titulo: string;
  ordem: number;
  criadoEm: string;
};

type ObraLista = {
  id: string;
  autorId: string;
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  capa: string;
  slug: string;
  link: string;
  publicadaEm: string;
  visualizacoes: number;
  totalCurtidas: number;
  totalComentarios: number;
  capitulos: CapituloLista[];
  notaMedia: number;
  totalAvaliacoes: number;
};

type PerfilLista = {
  userId: string;
  nome: string;
  username: string;
  avatar: string;
  bio: string;
};

type ItemObraLista = {
  chave: string;
  obra: ObraLista;
  categorias: CategoriaPerfil[];
  data: string;
  ultimaLeituraEm?: string;
  nota: number;
  progresso: number;
  capituloAtual: string;
  capituloAtualId: string;
  capitulosLidosIds: string[];
  anotacao?: string;
  anotacaoId?: string;
  anotacaoTipo?: TipoDiarioListas;
  anotacaoVisibilidade?: VisibilidadeAnotacaoListas;
  anotacaoQuemPodeComentar?: QuemPodeComentarAnotacaoListas;
  anotacaoVisibilidadeComentarios?: VisibilidadeComentariosAnotacaoListas;
  anotacaoPermitirCurtidas?: boolean;
  anotacaoSpoiler?: boolean;
};

type AutorLista = {
  id: string;
  nome: string;
  username: string;
  avatar: string;
  bio: string;
  totalObras: number;
  totalCurtidas: number;
  totalComentarios: number;
  notaMedia: number;
  totalAvaliacoes: number;
  generos: string[];
  criadaEm: string;
};

type ListasPerfilEstado = Record<CategoriaPerfil, ItemObraLista[]>;

type RegistroGenerico = Record<string, unknown>;

type AnotacaoObraListas = {
  id: string;
  obraId: string;
  tipo: TipoDiarioListas;
  texto: string;
  visibilidade: VisibilidadeAnotacaoListas;
  quemPodeComentar: QuemPodeComentarAnotacaoListas;
  visibilidadeComentarios: VisibilidadeComentariosAnotacaoListas;
  permitirCurtidas: boolean;
  contemSpoiler: boolean;
  atualizadoEm: string;
};

type EditorAnotacaoListasEstado = {
  aberto: boolean;
  obraId: string;
  anotacaoId: string;
  tipo: TipoDiarioListas;
  texto: string;
  visibilidade: VisibilidadeAnotacaoListas;
  quemPodeComentar: QuemPodeComentarAnotacaoListas;
  visibilidadeComentarios: VisibilidadeComentariosAnotacaoListas;
  permitirCurtidas: boolean;
  contemSpoiler: boolean;
  salvando: boolean;
  erro: string;
};

type PerfilComentarioDiarioListas = {
  nome: string;
  username: string;
  avatar: string;
};

type ComentarioAnotacaoListas = {
  id: string;
  anotacaoId: string;
  userId: string;
  autorNome: string;
  autorUsername: string;
  autorAvatar: string;
  texto: string;
  criadoEm: string;
  atualizadoEm: string;
  parentId: string;
  curtidas: string[];
};

type InteracaoAnotacaoListas = {
  carregando: boolean;
  totalCurtidas: number;
  curtiu: boolean;
  comentarios: ComentarioAnotacaoListas[];
  novoComentario: string;
  respondendoComentarioId: string;
  respondendoAutorNome: string;
  ordenacaoComentarios: OrdenacaoComentariosDiarioListas;
  salvandoCurtida: boolean;
  enviandoComentario: boolean;
  erro: string;
};

type AvaliacaoDiarioListasEstado = {
  carregando: boolean;
  visivel: boolean;
  mostrar: boolean;
  permitir: boolean;
  quemPodeAvaliar: QuemPodeAvaliarDiarioListas;
  podeAvaliar: boolean;
  media: number;
  total: number;
  minhaNota: number;
  salvando: boolean;
  salvandoConfiguracoes: boolean;
  configuracoesAbertas: boolean;
  erro: string;
};

type InteracoesAnotacoesListasEstado = Record<string, InteracaoAnotacaoListas>;

type AlvoDenunciaDiarioListas = {
  tipo: Extract<
    TipoAlvoDenuncia,
    "diario_anotacao" | "comentario_diario"
  >;
  id: string;
  titulo: string;
};

const LISTAS_PERFIL_VAZIAS: ListasPerfilEstado = {
  tudo: [],
  lendo: [],
  "quero-ler": [],
  favoritas: [],
  concluidas: [],
  avaliacoes: [],
  historico: [],
};

const PERMISSOES_PROPRIO_PERFIL: PermissoesAbasPerfil = {
  obras: true,
  sobre: true,
  diario: true,
  comunidade: true,
  biblioteca: true,
  atividades: true,
};

const CATEGORIAS_PERFIL: Array<{
  valor: CategoriaPerfil;
  rotulo: string;
}> = [
  { valor: "tudo", rotulo: "Tudo" },
  { valor: "lendo", rotulo: "Lendo" },
  { valor: "quero-ler", rotulo: "Quero ler" },
  { valor: "favoritas", rotulo: "Favoritas" },
  { valor: "concluidas", rotulo: "Concluídas" },
  { valor: "avaliacoes", rotulo: "Avaliações" },
  { valor: "historico", rotulo: "Histórico" },
];

const OBRAS_STORAGE_KEY = "historietas-obras";
const LIBRARY_FOLLOW_STORAGE_KEY = "historietas-obras-seguidas";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const DIARIO_ANOTACOES_STORAGE_KEY = "historietas-diario-anotacoes";
const DIARIO_ANOTACAO_MAX_LENGTH = 700;
const DIARIO_COMENTARIO_MAX_LENGTH = 700;
const NOTAS_AVALIACAO_LISTAS = [1, 2, 3, 4, 5] as const;

const EDITOR_ANOTACAO_LISTAS_VAZIO: EditorAnotacaoListasEstado = {
  aberto: false,
  obraId: "",
  anotacaoId: "",
  tipo: "atividade",
  texto: "",
  visibilidade: "privado",
  quemPodeComentar: "herdar",
  visibilidadeComentarios: "herdar",
  permitirCurtidas: true,
  contemSpoiler: false,
  salvando: false,
  erro: "",
};

const AVALIACAO_DIARIO_LISTAS_VAZIA: AvaliacaoDiarioListasEstado = {
  carregando: false,
  visivel: false,
  mostrar: true,
  permitir: true,
  quemPodeAvaliar: "todos",
  podeAvaliar: false,
  media: 0,
  total: 0,
  minhaNota: 0,
  salvando: false,
  salvandoConfiguracoes: false,
  configuracoesAbertas: false,
  erro: "",
};

function criarInteracaoAnotacaoListasVazia(
  carregando = false,
): InteracaoAnotacaoListas {
  return {
    carregando,
    totalCurtidas: 0,
    curtiu: false,
    comentarios: [],
    novoComentario: "",
    respondendoComentarioId: "",
    respondendoAutorNome: "",
    ordenacaoComentarios: "relevantes",
    salvandoCurtida: false,
    enviandoComentario: false,
    erro: "",
  };
}

const CAMPOS_OBRAS =
  "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,capa_url,publicado,visualizacoes,slug,criada_em";

function pegarTexto(valor: unknown, fallback = "") {
  return typeof valor === "string" && valor.trim() ? valor.trim() : fallback;
}

function pegarNumero(valor: unknown, fallback = 0) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return valor;
  }

  if (typeof valor === "string" && valor.trim()) {
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));

    if (Number.isFinite(numero)) {
      return numero;
    }
  }

  return fallback;
}

function pegarBooleanoListas(valor: unknown, fallback = false) {
  if (typeof valor === "boolean") {
    return valor;
  }

  if (typeof valor === "number") {
    return valor === 1;
  }

  if (typeof valor === "string") {
    const normalizado = valor.trim().toLowerCase();

    if (normalizado === "true" || normalizado === "1") {
      return true;
    }

    if (normalizado === "false" || normalizado === "0") {
      return false;
    }
  }

  return fallback;
}

function erroRelacionadoAoCampoSpoilerListas(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const registro = error as Record<string, unknown>;
  const textoErro = [
    registro.message,
    registro.details,
    registro.hint,
    registro.code,
  ]
    .filter((valor): valor is string => typeof valor === "string")
    .join(" ")
    .toLowerCase();

  return (
    textoErro.includes("contem_spoiler") &&
    (textoErro.includes("column") ||
      textoErro.includes("campo") ||
      textoErro.includes("schema") ||
      textoErro.includes("cache"))
  );
}

function idUsuarioValido(valor: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    valor.trim(),
  );
}

function criarStorageKeyUsuarioListas(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

function normalizarListaIdsListas(valor: unknown) {
  return Array.isArray(valor)
    ? valor.filter(
        (id): id is string => typeof id === "string" && Boolean(id.trim()),
      )
    : [];
}

function carregarListaIdsListas(chave: string, userId = "") {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return [] as string[];
  }

  try {
    const chaveParaLer = criarStorageKeyUsuarioListas(chave, userIdLimpo);
    const listaTexto = localStorage.getItem(chaveParaLer);
    const lista = normalizarListaIdsListas(
      listaTexto ? JSON.parse(listaTexto) : [],
    );

    return Array.from(new Set(lista));
  } catch {
    return [] as string[];
  }
}

function carregarObrasLocaisListas(userId: string) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return [] as RegistroGenerico[];
  }

  try {
    const texto = localStorage.getItem(
      criarStorageKeyUsuarioListas(OBRAS_STORAGE_KEY, userIdLimpo),
    );
    const valor = texto ? JSON.parse(texto) : [];

    return Array.isArray(valor)
      ? valor.filter(
          (item): item is RegistroGenerico =>
            Boolean(item) && typeof item === "object" && !Array.isArray(item),
        )
      : [];
  } catch {
    return [] as RegistroGenerico[];
  }
}

function obterProgressoObraLocalListas(registro: RegistroGenerico) {
  const capitulos = Array.isArray(registro.capitulos)
    ? registro.capitulos.filter(
        (item): item is RegistroGenerico =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item),
      )
    : [];
  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido === true);
  const progressoCalculado = capitulos.length
    ? Math.round((capitulosLidos.length / capitulos.length) * 100)
    : 0;
  const progressoInformado = pegarNumero(
    registro.progressoLeitura ??
      registro.progresso_leitura ??
      registro.progresso,
  );
  const progresso = Math.max(
    0,
    Math.min(100, Math.round(Math.max(progressoCalculado, progressoInformado))),
  );
  const capituloMaisRecente = [...capitulosLidos].sort(
    (a, b) =>
      timestampData(
        pegarTexto(b.lidoEm ?? b.lido_em ?? b.atualizado_em ?? b.criado_em),
      ) -
      timestampData(
        pegarTexto(a.lidoEm ?? a.lido_em ?? a.atualizado_em ?? a.criado_em),
      ),
  )[0];

  return {
    progresso,
    data:
      pegarTexto(
        registro.ultimaLeituraEm ??
          registro.ultima_leitura_em ??
          capituloMaisRecente?.lidoEm ??
          capituloMaisRecente?.lido_em ??
          capituloMaisRecente?.atualizado_em ??
          capituloMaisRecente?.criado_em,
      ) || pegarTexto(registro.criadaEm ?? registro.criada_em),
    capituloId:
      pegarTexto(
        registro.ultimoCapituloLidoId ?? registro.ultimo_capitulo_lido_id,
      ) || pegarTexto(capituloMaisRecente?.id),
  };
}

function salvarListaIdsListas(
  chave: string,
  userId: string,
  lista: string[],
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    localStorage.setItem(
      criarStorageKeyUsuarioListas(chave, userIdLimpo),
      JSON.stringify(Array.from(new Set(normalizarListaIdsListas(lista)))),
    );
  } catch {
    // O estado em memória continua funcionando caso o navegador bloqueie o storage.
  }
}

function obterIdentificadoresObraListas(
  obra: Pick<ObraLista, "id" | "slug" | "titulo">,
) {
  return Array.from(
    new Set(
      [
        obra.id,
        obra.slug,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ].filter(
        (valor): valor is string =>
          typeof valor === "string" && Boolean(valor.trim()),
      ),
    ),
  );
}

function colecaoTemObraListas(
  colecao: string[],
  obra: Pick<ObraLista, "id" | "slug" | "titulo">,
) {
  const idsColecao = new Set(
    colecao.filter((id): id is string => typeof id === "string"),
  );

  return obterIdentificadoresObraListas(obra).some((identificador) =>
    idsColecao.has(identificador),
  );
}

function removerObraDaColecaoListas(
  colecao: string[],
  obra: Pick<ObraLista, "id" | "slug" | "titulo">,
) {
  const identificadores = new Set(obterIdentificadoresObraListas(obra));

  return colecao.filter((id) => !identificadores.has(id));
}

function criarLoginHrefListas() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/listas";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/listas";

  return `/login?${new URLSearchParams({ redirectTo: destinoSeguro }).toString()}`;
}

async function sincronizarQueroLerListas(
  userId: string,
  obraId: string,
  ativo: boolean,
) {
  try {
    if (!userId.trim() || !obraId.trim()) {
      return;
    }

    const { error: erroDelete } = await supabase
      .from("seguindo_obras")
      .delete()
      .eq("user_id", userId)
      .eq("obra_id", obraId);

    if (erroDelete) {
      throw erroDelete;
    }

    if (!ativo) {
      return;
    }

    const payloadBase = {
      user_id: userId,
      obra_id: obraId,
    };

    const { error: erroComVisibilidade } = await supabase
      .from("seguindo_obras")
      .insert({
        ...payloadBase,
        visibilidade: "publico",
      });

    if (!erroComVisibilidade) {
      return;
    }

    const { error: erroSemVisibilidade } = await supabase
      .from("seguindo_obras")
      .insert(payloadBase);

    if (erroSemVisibilidade) {
      throw erroSemVisibilidade;
    }
  } catch (error) {
    console.warn("Não consegui sincronizar Quero ler na Lista Page:", error);
    // Assim como no perfil, a ação local permanece funcionando.
  }
}

function normalizarModoLista(valor: string | null): ModoLista {
  return valor === "perfil" || valor === "autores" ? valor : "obras";
}

function normalizarOrigemPerfil(valor: string | null): OrigemPerfil {
  return valor === "biblioteca" ? "biblioteca" : "diario";
}

function normalizarCategoriaPerfil(valor: string | null): CategoriaPerfil {
  return valor === "lendo" ||
    valor === "quero-ler" ||
    valor === "favoritas" ||
    valor === "concluidas" ||
    valor === "avaliacoes" ||
    valor === "historico" ||
    valor === "tudo"
    ? valor
    : "tudo";
}

function normalizarOrdenacao(valor: string | null): OrdenacaoLista {
  return valor === "titulo" ||
    valor === "avaliacao" ||
    valor === "popularidade"
    ? valor
    : "recentes";
}

function normalizarQuemPodeComentarAnotacaoListas(
  valor: unknown,
  fallback: QuemPodeComentarAnotacaoListas = "herdar",
): QuemPodeComentarAnotacaoListas {
  return valor === "todos" ||
    valor === "seguidores" ||
    valor === "ninguem" ||
    valor === "herdar"
    ? valor
    : fallback;
}

function normalizarVisibilidadeComentariosAnotacaoListas(
  valor: unknown,
  fallback: VisibilidadeComentariosAnotacaoListas = "herdar",
): VisibilidadeComentariosAnotacaoListas {
  return valor === "publico" ||
    valor === "seguidores" ||
    valor === "somente_eu" ||
    valor === "herdar"
    ? valor
    : fallback;
}

function normalizarQuemPodeAvaliarDiarioListas(
  valor: unknown,
): QuemPodeAvaliarDiarioListas {
  return valor === "seguidores" || valor === "ninguem" || valor === "todos"
    ? valor
    : "todos";
}

function obterMensagemErroListas(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const mensagem = (error as { message?: unknown }).message;

    if (typeof mensagem === "string" && mensagem.trim()) {
      return mensagem.trim();
    }
  }

  return fallback;
}

function normalizarAvaliacaoDiarioListas(
  valor: unknown,
  estadoAnterior: AvaliacaoDiarioListasEstado = AVALIACAO_DIARIO_LISTAS_VAZIA,
): AvaliacaoDiarioListasEstado {
  const registro =
    valor && typeof valor === "object" && !Array.isArray(valor)
      ? (valor as RegistroGenerico)
      : {};

  return {
    ...estadoAnterior,
    carregando: false,
    visivel: pegarBooleanoListas(registro.visivel, false),
    mostrar: pegarBooleanoListas(registro.mostrar, true),
    permitir: pegarBooleanoListas(registro.permitir, true),
    quemPodeAvaliar: normalizarQuemPodeAvaliarDiarioListas(
      registro.quem_pode_avaliar ?? registro.quemPodeAvaliar,
    ),
    podeAvaliar: pegarBooleanoListas(
      registro.pode_avaliar ?? registro.podeAvaliar,
      false,
    ),
    media: Math.max(0, Math.min(5, pegarNumero(registro.media, 0))),
    total: Math.max(0, Math.trunc(pegarNumero(registro.total, 0))),
    minhaNota: Math.max(
      0,
      Math.min(
        5,
        Math.round(
          pegarNumero(registro.minha_nota ?? registro.minhaNota, 0) * 2,
        ) / 2,
      ),
    ),
    salvando: false,
    salvandoConfiguracoes: false,
    erro: "",
  };
}

async function carregarAvaliacaoDiarioListas(
  perfilUserId: string,
): Promise<AvaliacaoDiarioListasEstado> {
  const userId = perfilUserId.trim();

  if (!idUsuarioValido(userId)) {
    return { ...AVALIACAO_DIARIO_LISTAS_VAZIA };
  }

  const { data, error } = await supabase.rpc("carregar_avaliacao_diario", {
    p_diario_user_id: userId,
  });

  if (error) {
    throw error;
  }

  return normalizarAvaliacaoDiarioListas(data);
}

function timestampData(data: string) {
  const timestamp = new Date(data).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatarDataCurta(data: string) {
  const timestamp = timestampData(data);

  if (!timestamp) {
    return "Data não informada";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(timestamp))
    .replace(" de ", " ")
    .replace(" de ", " ");
}

function formatarMesAno(data: string) {
  const timestamp = timestampData(data);

  if (!timestamp) {
    return "SEM DATA";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  })
    .format(new Date(timestamp))
    .toLocaleUpperCase("pt-BR");
}

function formatarLeituraMesAno(data: string) {
  const timestamp = timestampData(data);

  if (!timestamp) {
    return "";
  }

  const mesAno = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(timestamp));

  return `Lido em ${mesAno}`;
}

function compactarNumero(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: valor >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(Math.max(0, valor));
}

function formatarNotaListas(nota: number) {
  if (!Number.isFinite(nota) || nota <= 0) {
    return "0";
  }

  const notaArredondada = Math.round(nota * 10) / 10;

  return Number.isInteger(notaArredondada)
    ? String(notaArredondada)
    : notaArredondada.toFixed(1).replace(".", ",");
}

function criarObraLista(row: RegistroGenerico, index: number): ObraLista {
  const titulo = pegarTexto(row.titulo, `Obra ${index + 1}`);
  const slug = pegarTexto(row.slug, criarSlugBase(titulo));

  return {
    id: pegarTexto(row.id, `obra-${index + 1}`),
    autorId: pegarTexto(row.user_id ?? row.autor_id),
    titulo,
    autor: pegarTexto(row.autor, "Autor não informado"),
    genero: pegarTexto(row.genero, "Não informado"),
    formato: pegarTexto(row.formato, "Não informado"),
    classificacaoIndicativa: pegarTexto(row.classificacao_indicativa),
    capa: pegarTexto(row.capa_url ?? row.capa),
    slug,
    link: `/obra/${slug}`,
    publicadaEm: pegarTexto(row.criada_em ?? row.created_at),
    visualizacoes: Math.max(0, Math.round(pegarNumero(row.visualizacoes))),
    totalCurtidas: 0,
    totalComentarios: 0,
    capitulos: [],
    notaMedia: 0,
    totalAvaliacoes: 0,
  };
}

function criarPerfilLista(
  row: RegistroGenerico | null,
  userId: string,
  nomeFallback: string,
): PerfilLista {
  return {
    userId: pegarTexto(row?.user_id ?? row?.id, userId),
    nome:
      pegarTexto(row?.nome) ||
      nomeFallback.trim() ||
      "Usuário",
    username: pegarTexto(row?.username).replace(/^@+/, ""),
    avatar: pegarTexto(row?.avatar_url),
    bio: pegarTexto(row?.bio ?? row?.sobre_bio, "Perfil no Historietas."),
  };
}

async function carregarPerfil(userId: string, nomeFallback = "") {
  if (!idUsuarioValido(userId)) {
    return criarPerfilLista(null, userId, nomeFallback);
  }

  for (const campo of ["user_id", "id"] as const) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,user_id,nome,username,avatar_url,bio,sobre_bio")
        .eq(campo, userId)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return criarPerfilLista(data, userId, nomeFallback);
      }
    } catch {
      // Tenta buscar pelo identificador alternativo.
    }
  }

  return criarPerfilLista(null, userId, nomeFallback);
}

async function carregarCapitulosDasObras(obras: ObraLista[]) {
  const ids = Array.from(new Set(obras.map((obra) => obra.id).filter(Boolean)));

  if (ids.length === 0) {
    return obras;
  }

  const capitulosPorObra = new Map<string, CapituloLista[]>();
  const tamanhoChunk = 100;

  for (let inicio = 0; inicio < ids.length; inicio += tamanhoChunk) {
    const chunk = ids.slice(inicio, inicio + tamanhoChunk);

    try {
      const { data, error } = await supabase
        .from("capitulos")
        .select("id,obra_id,titulo,ordem,publicado,criado_em")
        .in("obra_id", chunk)
        .eq("publicado", true)
        .order("ordem", { ascending: true })
        .limit(Math.max(chunk.length * 80, 100));

      if (error || !Array.isArray(data)) {
        continue;
      }

      data.forEach((registro, index) => {
        if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
          return;
        }

        const row = registro as RegistroGenerico;
        const obraId = pegarTexto(row.obra_id);

        if (!obraId) {
          return;
        }

        const atuais = capitulosPorObra.get(obraId) || [];
        atuais.push({
          id: pegarTexto(row.id, `capitulo-${obraId}-${index + 1}`),
          obraId,
          titulo: pegarTexto(row.titulo, `Capítulo ${index + 1}`),
          ordem: Math.max(1, Math.round(pegarNumero(row.ordem, index + 1))),
          criadoEm: pegarTexto(row.criado_em ?? row.created_at),
        });
        capitulosPorObra.set(obraId, atuais);
      });
    } catch {
      // A lista continua funcionando mesmo sem os capítulos.
    }
  }

  return obras.map((obra) => ({
    ...obra,
    capitulos: capitulosPorObra.get(obra.id) || [],
  }));
}

function separarEmLotes<T>(itens: T[], tamanho = 400) {
  const lotes: T[][] = [];

  for (let indice = 0; indice < itens.length; indice += tamanho) {
    lotes.push(itens.slice(indice, indice + tamanho));
  }

  return lotes;
}

function adicionarUsuarioUnico(
  usuariosPorChave: Map<string, Set<string>>,
  chave: string,
  userId: string,
) {
  const chaveLimpa = chave.trim();
  const userIdLimpo = userId.trim();

  if (!chaveLimpa || !userIdLimpo) {
    return;
  }

  const usuarios = usuariosPorChave.get(chaveLimpa) || new Set<string>();
  usuarios.add(userIdLimpo);
  usuariosPorChave.set(chaveLimpa, usuarios);
}

function combinarUsuariosPorChave(
  ...fontes: Map<string, Set<string>>[]
) {
  const usuariosCombinados = new Map<string, Set<string>>();

  fontes.forEach((fonte) => {
    fonte.forEach((usuarios, chave) => {
      usuarios.forEach((userId) =>
        adicionarUsuarioUnico(usuariosCombinados, chave, userId),
      );
    });
  });

  return usuariosCombinados;
}

function mapearUsuariosCapitulosParaObras(
  usuariosPorCapitulo: Map<string, Set<string>>,
  obraIdPorCapitulo: Map<string, string>,
) {
  const usuariosPorObra = new Map<string, Set<string>>();

  usuariosPorCapitulo.forEach((usuarios, capituloId) => {
    const obraId = obraIdPorCapitulo.get(capituloId)?.trim() || "";

    usuarios.forEach((userId) =>
      adicionarUsuarioUnico(usuariosPorObra, obraId, userId),
    );
  });

  return usuariosPorObra;
}

async function carregarUsuariosPorColuna(
  tabela: string,
  coluna: string,
  ids: string[],
) {
  const idsUnicos = Array.from(
    new Set(ids.map((id) => id.trim()).filter(Boolean)),
  );
  const usuariosPorChave = new Map<string, Set<string>>();

  if (idsUnicos.length === 0) {
    return usuariosPorChave;
  }

  const tamanhoPagina = 1000;

  for (const loteIds of separarEmLotes(idsUnicos)) {
    let inicio = 0;

    while (inicio < 20000) {
      try {
        const { data, error } = await supabase
          .from(tabela)
          .select(`${coluna},user_id`)
          .in(coluna, loteIds)
          .range(inicio, inicio + tamanhoPagina - 1);

        if (error || !Array.isArray(data) || data.length === 0) {
          break;
        }

        data.forEach((registro) => {
          if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
            return;
          }

          const row = registro as RegistroGenerico;
          adicionarUsuarioUnico(
            usuariosPorChave,
            pegarTexto(row[coluna]),
            pegarTexto(row.user_id),
          );
        });

        if (data.length < tamanhoPagina) {
          break;
        }

        inicio += tamanhoPagina;
      } catch {
        break;
      }
    }
  }

  return usuariosPorChave;
}

async function aplicarTotaisInteracoesPublicas(obras: ObraLista[]) {
  const obraIdPorCapitulo = new Map<string, string>();

  obras.forEach((obra) => {
    obra.capitulos.forEach((capitulo) => {
      if (obra.id.trim() && capitulo.id.trim()) {
        obraIdPorCapitulo.set(capitulo.id.trim(), obra.id.trim());
      }
    });
  });

  const obraIds = obras.map((obra) => obra.id.trim()).filter(Boolean);
  const capituloIds = Array.from(obraIdPorCapitulo.keys());

  const [
    curtidasDiretasPorObra,
    curtidasPorCapitulo,
    comentariosDiretosPorObra,
    comentariosPorCapitulo,
  ] = await Promise.all([
    carregarUsuariosPorColuna("obra_curtidas", "obra_id", obraIds),
    carregarUsuariosPorColuna("curtidas_capitulos", "capitulo_id", capituloIds),
    carregarUsuariosPorColuna("comentarios_obras", "obra_id", obraIds),
    carregarUsuariosPorColuna("comentarios_capitulos", "capitulo_id", capituloIds),
  ]);

  const curtidasPorObra = combinarUsuariosPorChave(
    curtidasDiretasPorObra,
    mapearUsuariosCapitulosParaObras(curtidasPorCapitulo, obraIdPorCapitulo),
  );
  const comentariosPorObra = combinarUsuariosPorChave(
    comentariosDiretosPorObra,
    mapearUsuariosCapitulosParaObras(comentariosPorCapitulo, obraIdPorCapitulo),
  );

  return obras.map((obra) => ({
    ...obra,
    totalCurtidas: curtidasPorObra.get(obra.id)?.size || 0,
    totalComentarios: comentariosPorObra.get(obra.id)?.size || 0,
  }));
}

async function carregarResumoAvaliacoes(obras: ObraLista[]) {
  const ids = Array.from(new Set(obras.map((obra) => obra.id).filter(Boolean)));

  if (ids.length === 0) {
    return obras;
  }

  const autorIdPorObra = new Map(
    obras.map((obra) => [obra.id, obra.autorId.trim()]),
  );
  const notasPorObra = new Map<string, number[]>();
  const tamanhoChunk = 100;

  for (let inicio = 0; inicio < ids.length; inicio += tamanhoChunk) {
    const chunk = ids.slice(inicio, inicio + tamanhoChunk);

    try {
      const { data, error } = await supabase
        .from("obra_avaliacoes")
        .select("obra_id,user_id,nota")
        .in("obra_id", chunk)
        .limit(Math.max(chunk.length * 100, 100));

      if (error || !Array.isArray(data)) {
        continue;
      }

      data.forEach((registro) => {
        if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
          return;
        }

        const row = registro as RegistroGenerico;
        const obraId = pegarTexto(row.obra_id);
        const avaliadorId = pegarTexto(row.user_id);
        const autorId = autorIdPorObra.get(obraId) || "";
        const nota = pegarNumero(row.nota);

        if (
          !obraId ||
          nota <= 0 ||
          nota > 5 ||
          (autorId && avaliadorId === autorId)
        ) {
          return;
        }

        const atuais = notasPorObra.get(obraId) || [];
        atuais.push(nota);
        notasPorObra.set(obraId, atuais);
      });
    } catch {
      // Avaliações são informação complementar.
    }
  }

  return obras.map((obra) => {
    const notas = notasPorObra.get(obra.id) || [];
    const notaMedia = notas.length
      ? notas.reduce((total, nota) => total + nota, 0) / notas.length
      : 0;

    return {
      ...obra,
      notaMedia,
      totalAvaliacoes: notas.length,
    };
  });
}

async function carregarObrasPublicadas(idsEspecificos: string[] = []) {
  try {
    let consulta = supabase
      .from("obras")
      .select(CAMPOS_OBRAS)
      .eq("publicado", true)
      .order("criada_em", { ascending: false });

    if (idsEspecificos.length > 0) {
      consulta = consulta.in(
        "id",
        Array.from(new Set(idsEspecificos.map((id) => id.trim()).filter(Boolean))),
      );
    }

    const { data, error } = await consulta.limit(
      idsEspecificos.length > 0 ? Math.max(idsEspecificos.length, 1) : 500,
    );

    if (error || !Array.isArray(data)) {
      return [] as ObraLista[];
    }

    let obras = data.map((registro, index) =>
      criarObraLista(registro, index),
    );

    obras = await carregarCapitulosDasObras(obras);
    obras = await Promise.all([
      carregarResumoAvaliacoes(obras),
      aplicarTotaisInteracoesPublicas(obras),
    ]).then(([obrasAvaliadas, obrasComInteracoes]) => {
      const interacoesPorId = new Map(
        obrasComInteracoes.map((obra) => [obra.id, obra]),
      );

      return obrasAvaliadas.map((obra) => ({
        ...obra,
        totalCurtidas: interacoesPorId.get(obra.id)?.totalCurtidas || 0,
        totalComentarios: interacoesPorId.get(obra.id)?.totalComentarios || 0,
      }));
    });

    return obras;
  } catch {
    return [] as ObraLista[];
  }
}

async function carregarRegistrosUsuario(
  tabela: string,
  campos: string,
  userId: string,
) {
  if (!idUsuarioValido(userId)) {
    return [] as RegistroGenerico[];
  }

  try {
    const { data, error } = await supabase
      .from(tabela)
      .select(campos)
      .eq("user_id", userId)
      .limit(2000);

    if (error) {
      console.warn(`Nao consegui carregar ${tabela} na pagina Listas:`, error.message);
      return [] as RegistroGenerico[];
    }

    if (!Array.isArray(data)) {
      return [] as RegistroGenerico[];
    }

    return data
      .filter(
        (registro) =>
          Boolean(
            registro &&
              typeof registro === "object" &&
              !Array.isArray(registro),
          ),
      )
      .map((registro) => registro as unknown as RegistroGenerico);
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha desconhecida";
    console.warn(`Nao consegui carregar ${tabela} na pagina Listas:`, mensagem);
    return [] as RegistroGenerico[];
  }
}

function dataRegistro(registro: RegistroGenerico) {
  return pegarTexto(
    registro.atualizado_em ??
      registro.updated_at ??
      registro.criado_em ??
      registro.created_at,
  );
}

function registroPermitido(registro: RegistroGenerico, proprioPerfil: boolean) {
  if (proprioPerfil) {
    return true;
  }

  const visibilidade = pegarTexto(registro.visibilidade);
  return visibilidade !== "privado";
}


function normalizarVisibilidadeAnotacaoListas(
  valor: unknown,
  fallback: VisibilidadeAnotacaoListas = "privado",
): VisibilidadeAnotacaoListas {
  return valor === "publico" || valor === "parcial" || valor === "privado"
    ? valor
    : fallback;
}

function normalizarTipoDiarioListas(valor: unknown): TipoDiarioListas | "" {
  return valor === "lendo" ||
    valor === "quero_ler" ||
    valor === "favorita" ||
    valor === "concluida" ||
    valor === "avaliacao" ||
    valor === "review" ||
    valor === "atividade"
    ? valor
    : "";
}

function obterTipoDiarioDoItemListas(
  categoria: CategoriaPerfil,
  item?: ItemObraLista | null,
): TipoDiarioListas {
  const categoriaEfetiva =
    categoria === "tudo"
      ? ([
          "lendo",
          "quero-ler",
          "favoritas",
          "concluidas",
          "avaliacoes",
          "historico",
        ] as CategoriaPerfil[]).find((valor) => item?.categorias.includes(valor)) ||
        "historico"
      : categoria;

  if (categoriaEfetiva === "lendo") return "lendo";
  if (categoriaEfetiva === "quero-ler") return "quero_ler";
  if (categoriaEfetiva === "favoritas") return "favorita";
  if (categoriaEfetiva === "concluidas") return "concluida";
  if (categoriaEfetiva === "avaliacoes") return "avaliacao";
  return "atividade";
}

function criarChaveStorageAnotacoesListas(userId: string) {
  return `${DIARIO_ANOTACOES_STORAGE_KEY}:${userId.trim().toLowerCase()}`;
}

function carregarAnotacoesLocaisListas(userId: string) {
  if (typeof window === "undefined" || !userId.trim()) {
    return [] as RegistroGenerico[];
  }

  try {
    const salvo = window.localStorage.getItem(
      criarChaveStorageAnotacoesListas(userId),
    );
    const registros = salvo ? JSON.parse(salvo) : [];

    return Array.isArray(registros)
      ? registros.filter(
          (registro): registro is RegistroGenerico =>
            Boolean(registro) &&
            typeof registro === "object" &&
            !Array.isArray(registro),
        )
      : [];
  } catch {
    return [] as RegistroGenerico[];
  }
}

function salvarAnotacaoLocalListas(
  userId: string,
  registro: RegistroGenerico,
) {
  if (typeof window === "undefined" || !userId.trim()) {
    return;
  }

  try {
    const obraId = pegarTexto(registro.obra_id ?? registro.obraId);

    if (!obraId) {
      return;
    }

    const registros = carregarAnotacoesLocaisListas(userId).filter(
      (item) => pegarTexto(item.obra_id ?? item.obraId) !== obraId,
    );

    registros.push(registro);
    window.localStorage.setItem(
      criarChaveStorageAnotacoesListas(userId),
      JSON.stringify(registros),
    );
  } catch {
    // O Supabase continua sendo a fonte principal.
  }
}

function removerAnotacaoLocalListas(userId: string, obraId: string) {
  if (typeof window === "undefined" || !userId.trim()) {
    return;
  }

  try {
    const obraIdLimpo = obraId.trim();
    const registros = carregarAnotacoesLocaisListas(userId).filter(
      (item) => pegarTexto(item.obra_id ?? item.obraId) !== obraIdLimpo,
    );

    window.localStorage.setItem(
      criarChaveStorageAnotacoesListas(userId),
      JSON.stringify(registros),
    );
  } catch {
    // Ignora somente a cópia local.
  }
}

function anotacaoPodeAparecerListas(
  _registro: RegistroGenerico,
  _proprioPerfil: boolean,
) {
  // A visibilidade é controlada pela configuração geral da aba Diário.
  // Esta função só é chamada depois que o acesso ao Diário foi autorizado.
  return true;
}

function montarMapaAnotacoesPorObraListas(
  registros: RegistroGenerico[],
  proprioPerfil: boolean,
) {
  const mapa = new Map<string, AnotacaoObraListas>();

  registros.forEach((registro) => {
    if (!anotacaoPodeAparecerListas(registro, proprioPerfil)) {
      return;
    }

    const obraId = pegarTexto(registro.obra_id ?? registro.obraId);
    const tipo = normalizarTipoDiarioListas(registro.tipo);
    const textoAnotacao = pegarTexto(registro.texto);
    const atualizadoEm = dataRegistro(registro);

    if (!obraId || !tipo || !textoAnotacao) {
      return;
    }

    const chave = obraId.toLowerCase();
    const existente = mapa.get(chave);

    if (
      existente &&
      timestampData(existente.atualizadoEm) >= timestampData(atualizadoEm)
    ) {
      return;
    }

    mapa.set(chave, {
      id: pegarTexto(registro.id),
      obraId,
      tipo,
      texto: textoAnotacao,
      visibilidade: normalizarVisibilidadeAnotacaoListas(
        registro.visibilidade,
        "publico",
      ),
      quemPodeComentar: normalizarQuemPodeComentarAnotacaoListas(
        registro.quem_pode_comentar ?? registro.quemPodeComentar,
      ),
      visibilidadeComentarios: normalizarVisibilidadeComentariosAnotacaoListas(
        registro.visibilidade_comentarios ?? registro.visibilidadeComentarios,
      ),
      permitirCurtidas: pegarBooleanoListas(
        registro.permitir_curtidas ?? registro.permitirCurtidas,
        true,
      ),
      contemSpoiler: pegarBooleanoListas(
        registro.contem_spoiler ?? registro.contemSpoiler,
      ),
      atualizadoEm,
    });
  });

  return mapa;
}

function aplicarAnotacoesAosItensListas(
  itens: ItemObraLista[],
  anotacoesPorObra: Map<string, AnotacaoObraListas>,
) {
  return itens.map((item) => {
    const anotacao = anotacoesPorObra.get(item.obra.id.toLowerCase());

    if (!anotacao) {
      return item;
    }

    return {
      ...item,
      anotacao: anotacao.texto,
      anotacaoId: anotacao.id,
      anotacaoTipo: anotacao.tipo,
      anotacaoVisibilidade: anotacao.visibilidade,
      anotacaoQuemPodeComentar: anotacao.quemPodeComentar,
      anotacaoVisibilidadeComentarios: anotacao.visibilidadeComentarios,
      anotacaoPermitirCurtidas: anotacao.permitirCurtidas,
      anotacaoSpoiler: anotacao.contemSpoiler,
    };
  });
}

function obterProximaNotaAvaliacaoListas(estrela: number, notaAtual: number) {
  const meiaNota = estrela - 0.5;
  const notaNormalizada = Math.round(notaAtual * 2) / 2;

  if (notaNormalizada === meiaNota) {
    return estrela;
  }

  if (notaNormalizada === estrela) {
    return 0;
  }

  return meiaNota;
}

function calcularProximaAvaliacaoDiarioListas(
  avaliacaoAtual: AvaliacaoDiarioListasEstado,
  novaNota: number,
): AvaliacaoDiarioListasEstado {
  const notaAnterior = avaliacaoAtual.minhaNota;
  const totalAtual = avaliacaoAtual.total;
  const somaAtual = avaliacaoAtual.media * totalAtual;

  if (novaNota <= 0) {
    const totalNovo = notaAnterior > 0 ? Math.max(0, totalAtual - 1) : totalAtual;
    const somaNova = notaAnterior > 0 ? somaAtual - notaAnterior : somaAtual;

    return {
      ...avaliacaoAtual,
      media: totalNovo > 0 ? somaNova / totalNovo : 0,
      total: totalNovo,
      minhaNota: 0,
      salvando: true,
      erro: "",
    };
  }

  const totalNovo = notaAnterior > 0 ? totalAtual : totalAtual + 1;
  const somaNova =
    notaAnterior > 0
      ? somaAtual - notaAnterior + novaNota
      : somaAtual + novaNota;

  return {
    ...avaliacaoAtual,
    media: totalNovo > 0 ? somaNova / totalNovo : 0,
    total: totalNovo,
    minhaNota: novaNota,
    salvando: true,
    erro: "",
  };
}

function obterPreenchimentoEstrelaListas(estrela: number, notaAtual: number) {
  const notaNormalizada = Math.max(
    0,
    Math.min(5, Math.round(notaAtual * 2) / 2),
  );

  if (notaNormalizada >= estrela) return "100%";
  if (notaNormalizada >= estrela - 0.5) return "50%";
  return "0%";
}

async function salvarAvaliacaoRemotaListas({
  obraId,
  userId,
  nota,
}: {
  obraId: string;
  userId: string;
  nota: number;
}) {
  const { error: erroRemocao } = await supabase
    .from("obra_avaliacoes")
    .delete()
    .eq("obra_id", obraId)
    .eq("user_id", userId);

  if (erroRemocao) {
    throw erroRemocao;
  }

  if (nota <= 0) {
    return;
  }

  const { error: erroInsercao } = await supabase
    .from("obra_avaliacoes")
    .insert({ obra_id: obraId, user_id: userId, nota });

  if (erroInsercao) {
    throw erroInsercao;
  }

  const { data, error: erroVerificacao } = await supabase
    .from("obra_avaliacoes")
    .select("nota")
    .eq("obra_id", obraId)
    .eq("user_id", userId)
    .limit(10);

  if (erroVerificacao) {
    throw erroVerificacao;
  }

  const confirmado = Array.isArray(data)
    ? data.some((registro) => {
        const valor = pegarNumero((registro as RegistroGenerico).nota);
        return Math.round(valor * 2) / 2 === nota;
      })
    : false;

  if (!confirmado) {
    throw new Error("A avaliação não foi confirmada pelo banco de dados.");
  }
}

async function sincronizarAtividadeAvaliacaoListas(
  userId: string,
  obra: ObraLista,
  nota: number,
) {
  try {
    await supabase
      .from("diario_atividades")
      .delete()
      .eq("user_id", userId)
      .eq("obra_id", obra.id)
      .eq("tipo", "avaliou_obra");

    if (nota <= 0) {
      return;
    }

    const payloadBase = {
      user_id: userId,
      obra_id: obra.id,
      tipo: "avaliou_obra",
      texto: `Avaliou ${obra.titulo} com ${formatarNotaListas(nota)} estrelas.`,
      visibilidade: "publico",
      metadata: {
        origem: "listas",
        titulo: obra.titulo,
        slug: obra.slug,
        autor: obra.autor,
        genero: obra.genero,
        formato: obra.formato,
      },
    };
    const { error } = await supabase.from("diario_atividades").insert({
      ...payloadBase,
      nota,
    });

    if (error) {
      await supabase.from("diario_atividades").insert(payloadBase);
    }
  } catch (error) {
    console.warn("Não consegui sincronizar a atividade da avaliação:", error);
  }
}

async function carregarPerfisComentariosAnotacoesListas(userIds: string[]) {
  const ids = Array.from(new Set(userIds.map((id) => id.trim()).filter(Boolean)));
  const perfis = new Map<string, PerfilComentarioDiarioListas>();

  if (ids.length === 0) {
    return perfis;
  }

  const selecoes = [
    "id,user_id,nome,nome_usuario,username,display_name,apelido,avatar_url,avatar",
    "id,user_id,nome,username,display_name,avatar_url",
    "id,user_id,nome,username,avatar_url",
    "id,user_id,nome,avatar_url",
    "id,user_id,nome",
  ];

  for (const coluna of ["user_id", "id"] as const) {
    for (const selecao of selecoes) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(selecao)
          .in(coluna, ids)
          .limit(Math.max(ids.length, 1));

        if (error || !Array.isArray(data)) {
          continue;
        }

        data.forEach((item) => {
          const registro = item as unknown as RegistroGenerico;
          const perfil: PerfilComentarioDiarioListas = {
            nome:
              pegarTexto(registro.nome) ||
              pegarTexto(registro.display_name) ||
              pegarTexto(registro.apelido) ||
              pegarTexto(registro.nome_usuario) ||
              pegarTexto(registro.username) ||
              "Leitor",
            username:
              pegarTexto(registro.username) ||
              pegarTexto(registro.nome_usuario),
            avatar:
              pegarTexto(registro.avatar_url) || pegarTexto(registro.avatar),
          };
          const userId = pegarTexto(registro.user_id);
          const id = pegarTexto(registro.id);

          if (userId) perfis.set(userId, perfil);
          if (id) perfis.set(id, perfil);
        });

        break;
      } catch {
        // Tenta a próxima seleção compatível.
      }
    }
  }

  return perfis;
}

async function carregarInteracoesAnotacoesListas(
  anotacaoIds: string[],
  usuarioAtualId: string,
): Promise<InteracoesAnotacoesListasEstado> {
  const ids = Array.from(
    new Set(anotacaoIds.map((id) => id.trim()).filter(Boolean)),
  );
  const resultado = ids.reduce<InteracoesAnotacoesListasEstado>(
    (estado, id) => {
      estado[id] = criarInteracaoAnotacaoListasVazia();
      return estado;
    },
    {},
  );

  if (ids.length === 0) {
    return resultado;
  }

  const [curtidasResposta, comentariosResposta] = await Promise.all([
    supabase
      .from("diario_anotacao_curtidas")
      .select("id,anotacao_id,user_id")
      .in("anotacao_id", ids)
      .limit(2000),
    supabase
      .from("diario_anotacao_comentarios")
      .select(
        "id,anotacao_id,user_id,texto,parent_id,criado_em,atualizado_em",
      )
      .in("anotacao_id", ids)
      .order("criado_em", { ascending: true })
      .limit(2000),
  ]);

  if (Array.isArray(curtidasResposta.data)) {
    curtidasResposta.data.forEach((item) => {
      const registro = item;
      const anotacaoId = pegarTexto(registro.anotacao_id);
      const interacao = resultado[anotacaoId];

      if (!interacao) return;
      interacao.totalCurtidas += 1;
      if (pegarTexto(registro.user_id) === usuarioAtualId) {
        interacao.curtiu = true;
      }
    });
  }

  const comentarios = Array.isArray(comentariosResposta.data)
    ? comentariosResposta.data
    : [];
  const comentarioIds = comentarios
    .map((registro) => pegarTexto(registro.id))
    .filter(Boolean);
  const [perfis, curtidasComentariosResposta] = await Promise.all([
    carregarPerfisComentariosAnotacoesListas(
      comentarios
        .map((registro) => pegarTexto(registro.user_id))
        .filter(Boolean),
    ),
    comentarioIds.length > 0
      ? supabase
          .from("diario_comentario_curtidas")
          .select("comentario_id,user_id")
          .in("comentario_id", comentarioIds)
          .limit(4000)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const curtidasPorComentario = new Map<string, string[]>();

  if (Array.isArray(curtidasComentariosResposta.data)) {
    curtidasComentariosResposta.data.forEach((item) => {
      const registro = item;
      const comentarioId = pegarTexto(registro.comentario_id);
      const userId = pegarTexto(registro.user_id);

      if (!comentarioId || !userId) return;
      const atuais = curtidasPorComentario.get(comentarioId) || [];
      atuais.push(userId);
      curtidasPorComentario.set(comentarioId, atuais);
    });
  }

  comentarios.forEach((registro) => {
    const anotacaoId = pegarTexto(registro.anotacao_id);
    const interacao = resultado[anotacaoId];
    const id = pegarTexto(registro.id);
    const textoComentario = pegarTexto(registro.texto);
    const userId = pegarTexto(registro.user_id);
    const perfil = perfis.get(userId);

    if (!interacao || !id || !textoComentario) return;

    interacao.comentarios.push({
      id,
      anotacaoId,
      userId,
      autorNome: perfil?.nome || "Leitor",
      autorUsername: perfil?.username || "",
      autorAvatar: perfil?.avatar || "",
      texto: textoComentario,
      criadoEm: pegarTexto(registro.criado_em ?? registro.atualizado_em),
      atualizadoEm: pegarTexto(registro.atualizado_em ?? registro.criado_em),
      parentId: pegarTexto(registro.parent_id),
      curtidas: curtidasPorComentario.get(id) || [],
    });
  });

  return resultado;
}

function ordenarComentariosRaizDiarioListas(
  comentarios: ComentarioAnotacaoListas[],
  ordenacao: OrdenacaoComentariosDiarioListas,
) {
  const respostasPorPai = new Map<string, number>();

  comentarios.forEach((comentario) => {
    if (!comentario.parentId) return;
    respostasPorPai.set(
      comentario.parentId,
      (respostasPorPai.get(comentario.parentId) || 0) + 1,
    );
  });

  return comentarios
    .filter((comentario) => !comentario.parentId)
    .sort((a, b) => {
      if (ordenacao === "recentes") {
        return timestampData(b.criadoEm) - timestampData(a.criadoEm);
      }

      const relevanciaA =
        a.curtidas.length * 3 + (respostasPorPai.get(a.id) || 0) * 2;
      const relevanciaB =
        b.curtidas.length * 3 + (respostasPorPai.get(b.id) || 0) * 2;

      return (
        relevanciaB - relevanciaA ||
        timestampData(b.criadoEm) - timestampData(a.criadoEm)
      );
    });
}

function obterRespostasComentarioDiarioListas(
  comentarios: ComentarioAnotacaoListas[],
  comentarioId: string,
) {
  return comentarios
    .filter((comentario) => comentario.parentId === comentarioId)
    .sort((a, b) => timestampData(a.criadoEm) - timestampData(b.criadoEm));
}

function obterHrefContinuarLeituraListas(item: ItemObraLista) {
  const obra = item.obra;
  const capitulosLidos = new Set(item.capitulosLidosIds);
  const indiceAtual = obra.capitulos.findIndex(
    (capitulo) => capitulo.id === item.capituloAtualId,
  );
  const proximoAposAtual =
    indiceAtual >= 0
      ? obra.capitulos
          .slice(indiceAtual + 1)
          .find((capitulo) => !capitulosLidos.has(capitulo.id))
      : null;
  const capitulo =
    proximoAposAtual ||
    obra.capitulos.find((itemCapitulo) => !capitulosLidos.has(itemCapitulo.id)) ||
    obra.capitulos.find((itemCapitulo) => itemCapitulo.id === item.capituloAtualId) ||
    null;

  if (!capitulo) {
    return obra.link;
  }

  const indice = obra.capitulos.findIndex((itemCapitulo) => itemCapitulo.id === capitulo.id);
  const numero = capitulo.ordem > 0 ? capitulo.ordem : indice + 1;

  return `/obra/${encodeURIComponent(obra.slug)}/capitulo/${Math.max(1, numero)}`;
}

function criarItemPerfil(
  categoria: CategoriaPerfil,
  obra: ObraLista,
  registro: RegistroGenerico,
  extras: Partial<ItemObraLista> = {},
): ItemObraLista {
  return {
    chave: `${categoria}-${obra.id}-${dataRegistro(registro) || obra.publicadaEm}`,
    obra,
    categorias: [categoria],
    data: dataRegistro(registro) || obra.publicadaEm,
    nota: 0,
    progresso: 0,
    capituloAtual: "",
    capituloAtualId: "",
    capitulosLidosIds: [],
    ...extras,
  };
}

function ordenarPorData(itens: ItemObraLista[]) {
  return [...itens].sort((a, b) => timestampData(b.data) - timestampData(a.data));
}

function mesclarTudoPerfil(fontes: ItemObraLista[][]) {
  const mapa = new Map<string, ItemObraLista>();

  fontes.flat().forEach((item) => {
    const chave = item.obra.id || item.obra.slug;
    const atual = mapa.get(chave);

    if (!atual) {
      mapa.set(chave, {
        ...item,
        chave: `tudo-${chave}`,
        categorias: Array.from(new Set(item.categorias)),
      });
      return;
    }

    const itemMaisRecente = timestampData(item.data) > timestampData(atual.data);

    mapa.set(chave, {
      ...(itemMaisRecente ? item : atual),
      chave: `tudo-${chave}`,
      categorias: Array.from(
        new Set([...atual.categorias, ...item.categorias]),
      ),
      nota: Math.max(atual.nota, item.nota),
      progresso: Math.max(atual.progresso, item.progresso),
      capituloAtual: item.capituloAtual || atual.capituloAtual,
      capituloAtualId: item.capituloAtualId || atual.capituloAtualId,
      capitulosLidosIds: Array.from(
        new Set([...atual.capitulosLidosIds, ...item.capitulosLidosIds]),
      ),
      ultimaLeituraEm:
        timestampData(item.ultimaLeituraEm || "") >
        timestampData(atual.ultimaLeituraEm || "")
          ? item.ultimaLeituraEm
          : atual.ultimaLeituraEm,
    });
  });

  return ordenarPorData(Array.from(mapa.values()));
}

function normalizarIdentificadorColecaoListas(valor: string) {
  return valor.trim().toLowerCase();
}

function criarMapaObrasPorIdentificadorListas(obras: ObraLista[]) {
  const mapa = new Map<string, ObraLista>();

  obras.forEach((obra) => {
    obterIdentificadoresObraListas(obra).forEach((identificador) => {
      const chave = normalizarIdentificadorColecaoListas(identificador);

      if (chave && !mapa.has(chave)) {
        mapa.set(chave, obra);
      }
    });
  });

  return mapa;
}

function encontrarObraColecaoLocalListas(
  identificador: string,
  obrasPorIdentificador: Map<string, ObraLista>,
) {
  return (
    obrasPorIdentificador.get(
      normalizarIdentificadorColecaoListas(identificador),
    ) || null
  );
}

function mesclarItensLocaisCategoriaPerfil(
  categoria: CategoriaPerfil,
  itensRemotos: ItemObraLista[],
  idsLocais: string[],
  obrasPorIdentificador: Map<string, ObraLista>,
  obrasExcluidasIds: Set<string> = new Set<string>(),
) {
  const itensPorObra = new Map<string, ItemObraLista>();

  itensRemotos.forEach((item) => {
    const chave = item.obra.id || item.obra.slug;

    if (chave) {
      itensPorObra.set(chave, item);
    }
  });

  idsLocais.forEach((identificador) => {
    const obra = encontrarObraColecaoLocalListas(
      identificador,
      obrasPorIdentificador,
    );

    if (!obra || obrasExcluidasIds.has(obra.id)) {
      return;
    }

    const chave = obra.id || obra.slug;

    if (!chave || itensPorObra.has(chave)) {
      return;
    }

    itensPorObra.set(
      chave,
      criarItemPerfil(
        categoria,
        obra,
        {
          obra_id: obra.id,
          criado_em: obra.publicadaEm,
          origem_local: true,
        },
      ),
    );
  });

  return ordenarPorData(Array.from(itensPorObra.values()));
}

async function carregarListasDoPerfil(
  userId: string,
  proprioPerfil: boolean,
) {
  const [seguindo, favoritas, concluidas, avaliacoes, progresso, anotacoes] =
    await Promise.all([
      carregarRegistrosUsuario(
        "seguindo_obras",
        "obra_id,visibilidade,criado_em",
        userId,
      ),
      carregarRegistrosUsuario(
        "favoritos",
        "obra_id,visibilidade,criado_em",
        userId,
      ),
      carregarRegistrosUsuario(
        "concluidas",
        "obra_id,visibilidade,criado_em",
        userId,
      ),
      carregarRegistrosUsuario(
        "obra_avaliacoes",
        "obra_id,nota,criado_em,atualizado_em",
        userId,
      ),
      carregarRegistrosUsuario(
        "progresso_leitura",
        "obra_id,capitulo_id,lido,progresso,criado_em,atualizado_em",
        userId,
      ),
      carregarRegistrosUsuario(
        "diario_anotacoes",
        "id,obra_id,tipo,texto,visibilidade,quem_pode_comentar,visibilidade_comentarios,permitir_curtidas,contem_spoiler,criado_em,atualizado_em",
        userId,
      ),
    ]);

  const capituloIdsSemObra = Array.from(
    new Set(
      progresso
        .filter((registro) => !pegarTexto(registro.obra_id))
        .map((registro) => pegarTexto(registro.capitulo_id))
        .filter(Boolean),
    ),
  );
  let obraIdPorCapituloSemObra = new Map<string, string>();

  if (capituloIdsSemObra.length > 0) {
    try {
      const { data, error } = await supabase
        .from("capitulos")
        .select("id,obra_id")
        .in("id", capituloIdsSemObra)
        .limit(capituloIdsSemObra.length);

      if (!error && Array.isArray(data)) {
        const paresCapituloObra: Array<[string, string]> = [];

        for (const registro of data) {
          const capituloId = pegarTexto(registro?.id);
          const obraId = pegarTexto(registro?.obra_id);

          if (capituloId && obraId) {
            paresCapituloObra.push([capituloId, obraId]);
          }
        }

        obraIdPorCapituloSemObra = new Map<string, string>(
          paresCapituloObra,
        );
      }
    } catch {
      // Mantém os registros originais caso não seja possível resolver o capítulo.
    }
  }

  const progressoCompleto = progresso.map((registro) => {
    if (pegarTexto(registro.obra_id)) {
      return registro;
    }

    const obraIdResolvido = obraIdPorCapituloSemObra.get(
      pegarTexto(registro.capitulo_id),
    );

    return obraIdResolvido
      ? { ...registro, obra_id: obraIdResolvido }
      : registro;
  });

  const seguindoLocais = proprioPerfil
    ? carregarListaIdsListas(LIBRARY_FOLLOW_STORAGE_KEY, userId)
    : [];
  const favoritasLocais = proprioPerfil
    ? carregarListaIdsListas(FAVORITES_STORAGE_KEY, userId)
    : [];
  const concluidasLocais = proprioPerfil
    ? carregarListaIdsListas(COMPLETED_STORAGE_KEY, userId)
    : [];
  const obrasLocais = proprioPerfil ? carregarObrasLocaisListas(userId) : [];
  const anotacoesLocais = proprioPerfil
    ? carregarAnotacoesLocaisListas(userId)
    : [];
  const anotacoesVisiveis = [...anotacoesLocais, ...anotacoes].filter(
    (registro) => anotacaoPodeAparecerListas(registro, proprioPerfil),
  );

  const registrosVisiveis = [
    ...seguindo,
    ...favoritas,
    ...concluidas,
    ...avaliacoes,
    ...progressoCompleto,
    ...anotacoesVisiveis,
  ].filter((registro) =>
    anotacoesVisiveis.includes(registro)
      ? true
      : registroPermitido(registro, proprioPerfil),
  );

  const idsObrasRemotos = Array.from(
    new Set(
      registrosVisiveis
        .map((registro) => pegarTexto(registro.obra_id))
        .filter(Boolean),
    ),
  );
  const obras = idsObrasRemotos.length > 0
    ? await carregarObrasPublicadas(idsObrasRemotos)
    : await carregarObrasPublicadas([]);
  const obrasPorId = new Map(obras.map((obra) => [obra.id, obra]));
  const obrasPorCapituloId = new Map<string, ObraLista>();

  obras.forEach((obra) => {
    obra.capitulos.forEach((capitulo) => {
      if (capitulo.id && !obrasPorCapituloId.has(capitulo.id)) {
        obrasPorCapituloId.set(capitulo.id, obra);
      }
    });
  });

  const obrasPorIdentificador = criarMapaObrasPorIdentificadorListas(obras);
  const concluidasIds = new Set(
    concluidas
      .filter((registro) => registroPermitido(registro, proprioPerfil))
      .map((registro) => pegarTexto(registro.obra_id))
      .filter(Boolean),
  );

  concluidasLocais.forEach((identificador) => {
    const obra = encontrarObraColecaoLocalListas(
      identificador,
      obrasPorIdentificador,
    );

    if (obra?.id) {
      concluidasIds.add(obra.id);
    }
  });

  const queroLerRemoto = ordenarPorData(
    seguindo
      .filter((registro) => registroPermitido(registro, proprioPerfil))
      .map((registro) => {
        const obraId = pegarTexto(registro.obra_id);
        const obra = obrasPorId.get(obraId);

        if (!obra || concluidasIds.has(obraId)) {
          return null;
        }

        return criarItemPerfil("quero-ler", obra, registro);
      })
      .filter((item): item is ItemObraLista => Boolean(item)),
  );
  const queroLer = mesclarItensLocaisCategoriaPerfil(
    "quero-ler",
    queroLerRemoto,
    seguindoLocais,
    obrasPorIdentificador,
    concluidasIds,
  );

  const favoritasRemotas = ordenarPorData(
    favoritas
      .filter((registro) => registroPermitido(registro, proprioPerfil))
      .map((registro) => {
        const obra = obrasPorId.get(pegarTexto(registro.obra_id));
        return obra ? criarItemPerfil("favoritas", obra, registro) : null;
      })
      .filter((item): item is ItemObraLista => Boolean(item)),
  );
  const itensFavoritas = mesclarItensLocaisCategoriaPerfil(
    "favoritas",
    favoritasRemotas,
    favoritasLocais,
    obrasPorIdentificador,
  );

  const concluidasRemotas = ordenarPorData(
    concluidas
      .filter((registro) => registroPermitido(registro, proprioPerfil))
      .map((registro) => {
        const obra = obrasPorId.get(pegarTexto(registro.obra_id));
        return obra ? criarItemPerfil("concluidas", obra, registro) : null;
      })
      .filter((item): item is ItemObraLista => Boolean(item)),
  );
  const itensConcluidas = mesclarItensLocaisCategoriaPerfil(
    "concluidas",
    concluidasRemotas,
    concluidasLocais,
    obrasPorIdentificador,
  );

  const itensAvaliacoes = ordenarPorData(
    avaliacoes
      .filter((registro) => registroPermitido(registro, proprioPerfil))
      .map((registro) => {
        const obra = obrasPorId.get(pegarTexto(registro.obra_id));
        const nota = pegarNumero(registro.nota);

        if (
          !obra ||
          nota <= 0 ||
          (obra.autorId && obra.autorId === userId)
        ) {
          return null;
        }

        return criarItemPerfil("avaliacoes", obra, registro, { nota });
      })
      .filter((item): item is ItemObraLista => Boolean(item)),
  );

  const progressoPorObra = new Map<
    string,
    {
      registros: RegistroGenerico[];
      capitulosLidos: Set<string>;
      progressoInformado: number;
      data: string;
      capituloAtual: string;
    }
  >();

  progressoCompleto
    .filter((registro) => registroPermitido(registro, proprioPerfil))
    .forEach((registro) => {
      const obraIdRegistro = pegarTexto(registro.obra_id);
      const capituloId = pegarTexto(registro.capitulo_id);
      const obraResolvida =
        obrasPorId.get(obraIdRegistro) ||
        obrasPorCapituloId.get(capituloId) ||
        null;
      const obraId = obraResolvida?.id || obraIdRegistro;
      const lido = typeof registro.lido === "boolean" ? registro.lido : true;

      if (!obraId || !obraResolvida || !lido) {
        return;
      }

      const atual = progressoPorObra.get(obraId) || {
        registros: [],
        capitulosLidos: new Set<string>(),
        progressoInformado: 0,
        data: "",
        capituloAtual: "",
      };
      atual.registros.push(registro);

      if (capituloId) {
        atual.capitulosLidos.add(capituloId);
      }

      atual.progressoInformado = Math.max(
        atual.progressoInformado,
        pegarNumero(registro.progresso),
      );

      if (timestampData(dataRegistro(registro)) >= timestampData(atual.data)) {
        atual.data = dataRegistro(registro);
        atual.capituloAtual = capituloId;
      }

      progressoPorObra.set(obraId, atual);
    });

  obrasLocais.forEach((registro) => {
    const identificadores = [
      pegarTexto(registro.id),
      pegarTexto(registro.slug),
      pegarTexto(registro.titulo),
    ].filter(Boolean);
    const obra = identificadores
      .map((identificador) =>
        encontrarObraColecaoLocalListas(identificador, obrasPorIdentificador),
      )
      .find(Boolean);

    if (!obra || concluidasIds.has(obra.id)) {
      return;
    }

    const progressoLocal = obterProgressoObraLocalListas(registro);

    if (progressoLocal.progresso <= 0) {
      return;
    }

    const atual = progressoPorObra.get(obra.id) || {
      registros: [],
      capitulosLidos: new Set<string>(),
      progressoInformado: 0,
      data: "",
      capituloAtual: "",
    };

    atual.progressoInformado = Math.max(
      atual.progressoInformado,
      progressoLocal.progresso,
    );

    if (progressoLocal.capituloId) {
      atual.capitulosLidos.add(progressoLocal.capituloId);
    }

    if (
      timestampData(progressoLocal.data) >= timestampData(atual.data)
    ) {
      atual.data = progressoLocal.data;
      atual.capituloAtual = progressoLocal.capituloId;
    }

    progressoPorObra.set(obra.id, atual);
  });

  const lendo: ItemObraLista[] = [];
  const historico: ItemObraLista[] = [];

  progressoPorObra.forEach((grupo, obraId) => {
    const obra = obrasPorId.get(obraId);

    if (!obra) {
      return;
    }

    const totalCapitulos = obra.capitulos.length;
    const capitulosLidosValidos = obra.capitulos.filter((capitulo) =>
      grupo.capitulosLidos.has(capitulo.id),
    ).length;
    const progressoCalculado = totalCapitulos
      ? Math.round((capitulosLidosValidos / totalCapitulos) * 100)
      : 0;

    // Em progresso_leitura, "progresso: 100" pode significar que apenas
    // o capítulo atual foi concluído. Quando há capítulos registrados,
    // calculamos o progresso da obra pela quantidade de capítulos lidos,
    // igual ao Diário do perfil. O valor informado fica apenas como
    // fallback para leituras mantidas localmente.
    const progressoFinal =
      capitulosLidosValidos > 0
        ? progressoCalculado
        : Math.min(
            99,
            Math.max(1, Math.round(grupo.progressoInformado)),
          );
    const capitulo = obra.capitulos.find(
      (itemCapitulo) => itemCapitulo.id === grupo.capituloAtual,
    );
    const registroBase = grupo.registros[0] || {
      obra_id: obra.id,
      atualizado_em: grupo.data,
      origem_local: true,
    };
    const extras = {
      data: grupo.data || obra.publicadaEm,
      ultimaLeituraEm: grupo.data || obra.publicadaEm,
      progresso: progressoFinal,
      capituloAtual: capitulo?.titulo || "",
      capituloAtualId: grupo.capituloAtual,
      capitulosLidosIds: Array.from(grupo.capitulosLidos),
    };

    historico.push(
      criarItemPerfil("historico", obra, registroBase, extras),
    );

    if (progressoFinal > 0 && !concluidasIds.has(obraId)) {
      lendo.push(criarItemPerfil("lendo", obra, registroBase, extras));
    }
  });

  const estado: ListasPerfilEstado = {
    tudo: [],
    lendo: ordenarPorData(lendo),
    "quero-ler": queroLer,
    favoritas: itensFavoritas,
    concluidas: itensConcluidas,
    avaliacoes: itensAvaliacoes,
    historico: ordenarPorData(historico),
  };

  estado.tudo = mesclarTudoPerfil([
    estado.lendo,
    estado["quero-ler"],
    estado.favoritas,
    estado.concluidas,
    estado.avaliacoes,
    estado.historico,
  ]);

  const anotacoesPorObra = montarMapaAnotacoesPorObraListas(
    anotacoesVisiveis,
    proprioPerfil,
  );
  const notasPorObra = new Map<string, number>();

  avaliacoes
    .filter((registro) => registroPermitido(registro, proprioPerfil))
    .forEach((registro) => {
      const obraId = pegarTexto(registro.obra_id);
      const nota = Math.max(0, Math.min(5, pegarNumero(registro.nota)));

      if (obraId && nota > 0) {
        notasPorObra.set(obraId, Math.round(nota * 2) / 2);
      }
    });

  (Object.keys(estado) as CategoriaPerfil[]).forEach((categoriaEstado) => {
    estado[categoriaEstado] = aplicarAnotacoesAosItensListas(
      estado[categoriaEstado].map((item) => ({
        ...item,
        nota: notasPorObra.get(item.obra.id) || item.nota,
      })),
      anotacoesPorObra,
    );
  });

  return estado;
}

async function carregarIdsInteracoesUsuario(userId: string) {
  if (!idUsuarioValido(userId)) {
    return [] as string[];
  }

  const [favoritas, seguindo, concluidas] = await Promise.all([
    carregarRegistrosUsuario("favoritos", "obra_id", userId),
    carregarRegistrosUsuario("seguindo_obras", "obra_id", userId),
    carregarRegistrosUsuario("concluidas", "obra_id", userId),
  ]);

  return Array.from(
    new Set(
      [...favoritas, ...seguindo, ...concluidas]
        .map((registro) => pegarTexto(registro.obra_id))
        .filter(Boolean),
    ),
  );
}

function dataUltimoCapitulo(obra: ObraLista) {
  return obra.capitulos.reduce((maisRecente, capitulo) => {
    return Math.max(maisRecente, timestampData(capitulo.criadoEm));
  }, timestampData(obra.publicadaEm));
}

function pontuacaoPopularidadeObra(obra: ObraLista) {
  return (
    obra.visualizacoes +
    obra.totalCurtidas * 8 +
    obra.totalComentarios * 5 +
    obra.capitulos.length * 2
  );
}

function ordenarObrasDaSecao(obras: ObraLista[], secao: string) {
  const lista = [...obras];

  if (secao === "novos-capitulos") {
    return lista
      .filter((obra) => obra.capitulos.length > 0 && dataUltimoCapitulo(obra) > 0)
      .sort(
        (a, b) =>
          dataUltimoCapitulo(b) - dataUltimoCapitulo(a) ||
          timestampData(b.publicadaEm) - timestampData(a.publicadaEm),
      );
  }

  if (secao === "mais-curtidas") {
    return lista
      .filter((obra) => obra.totalCurtidas > 0)
      .sort(
        (a, b) =>
          b.totalCurtidas - a.totalCurtidas ||
          pontuacaoPopularidadeObra(b) - pontuacaoPopularidadeObra(a),
      );
  }

  if (secao === "mais-comentadas") {
    return lista
      .filter((obra) => obra.totalComentarios > 0)
      .sort(
        (a, b) =>
          b.totalComentarios - a.totalComentarios ||
          pontuacaoPopularidadeObra(b) - pontuacaoPopularidadeObra(a),
      );
  }

  if (secao === "para-ler-agora") {
    return lista
      .filter((obra) => obra.capitulos.length > 0 && obra.capitulos.length <= 3)
      .sort(
        (a, b) =>
          a.capitulos.length - b.capitulos.length ||
          pontuacaoPopularidadeObra(b) - pontuacaoPopularidadeObra(a),
      );
  }

  if (secao === "em-alta") {
    return lista.sort(
      (a, b) =>
        pontuacaoPopularidadeObra(b) - pontuacaoPopularidadeObra(a) ||
        b.notaMedia - a.notaMedia ||
        timestampData(b.publicadaEm) - timestampData(a.publicadaEm),
    );
  }

  return lista.sort(
    (a, b) => timestampData(b.publicadaEm) - timestampData(a.publicadaEm),
  );
}

function ordenarRecomendacoes(obras: ObraLista[], idsInteracoes: string[]) {
  const idsSet = new Set(idsInteracoes);
  const generosPreferidos = new Map<string, number>();

  obras.forEach((obra) => {
    if (!idsSet.has(obra.id)) {
      return;
    }

    const genero = normalizarTexto(obra.genero);
    generosPreferidos.set(genero, (generosPreferidos.get(genero) || 0) + 1);
  });

  return [...obras]
    .filter((obra) => !idsSet.has(obra.id))
    .sort((a, b) => {
      const pontuacao = (obra: ObraLista) => {
        const afinidade = generosPreferidos.get(normalizarTexto(obra.genero)) || 0;
        const nota = obra.notaMedia * 2;
        const popularidade = Math.min(
          8,
          pontuacaoPopularidadeObra(obra) / 1000,
        );
        const recencia = timestampData(obra.publicadaEm) / 1_000_000_000_000;
        return afinidade * 8 + nota + popularidade + recencia;
      };

      return pontuacao(b) - pontuacao(a);
    });
}

async function carregarAvaliacoesAutoresPublicos(autorIds: string[]) {
  const idsUnicos = Array.from(
    new Set(autorIds.map((id) => id.trim()).filter(idUsuarioValido)),
  );
  const avaliacoes = new Map<string, { media: number; total: number }>();

  if (idsUnicos.length === 0) {
    return avaliacoes;
  }

  try {
    const { data, error } = await supabase
      .from("autor_avaliacoes")
      .select("autor_id,nota")
      .in("autor_id", idsUnicos)
      .limit(5000);

    if (error || !Array.isArray(data)) {
      return avaliacoes;
    }

    const acumulado = new Map<string, { soma: number; total: number }>();

    data.forEach((registro) => {
      if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
        return;
      }

      const row = registro as RegistroGenerico;
      const autorId = pegarTexto(row.autor_id);
      const nota = pegarNumero(row.nota);

      if (!autorId || nota < 0.5 || nota > 5) {
        return;
      }

      const atual = acumulado.get(autorId) || { soma: 0, total: 0 };
      acumulado.set(autorId, {
        soma: atual.soma + nota,
        total: atual.total + 1,
      });
    });

    acumulado.forEach((valor, autorId) => {
      if (valor.total > 0) {
        avaliacoes.set(autorId, {
          media: valor.soma / valor.total,
          total: valor.total,
        });
      }
    });
  } catch {
    // A lista de autores continua funcionando sem avaliações.
  }

  return avaliacoes;
}

async function carregarAutoresPublicos(obras: ObraLista[]) {
  const idsAutores = Array.from(
    new Set(obras.map((obra) => obra.autorId).filter(idUsuarioValido)),
  );
  const perfisPorId = new Map<string, PerfilLista>();
  const avaliacoesPorAutor = await carregarAvaliacoesAutoresPublicos(idsAutores);
  const tamanhoChunk = 100;

  for (let inicio = 0; inicio < idsAutores.length; inicio += tamanhoChunk) {
    const chunk = idsAutores.slice(inicio, inicio + tamanhoChunk);

    for (const campo of ["user_id", "id"] as const) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id,user_id,nome,username,avatar_url,bio,sobre_bio,criado_em")
          .in(campo, chunk)
          .limit(Math.max(chunk.length, 1));

        if (error || !Array.isArray(data)) {
          continue;
        }

        data.forEach((registro) => {
          if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
            return;
          }

          const row = registro as RegistroGenerico;
          const userId = pegarTexto(row.user_id ?? row.id);

          if (userId) {
            perfisPorId.set(userId, criarPerfilLista(row, userId, "Usuário"));
          }
        });
      } catch {
        // Os dados das próprias obras servem como fallback.
      }
    }
  }

  const agrupados = new Map<string, ObraLista[]>();

  obras.forEach((obra) => {
    const chave = obra.autorId || normalizarTexto(obra.autor);
    const atuais = agrupados.get(chave) || [];
    atuais.push(obra);
    agrupados.set(chave, atuais);
  });

  return Array.from(agrupados.entries())
    .map(([chave, obrasAutor]): AutorLista => {
      const primeiraObra = obrasAutor[0];
      const perfil = primeiraObra.autorId
        ? perfisPorId.get(primeiraObra.autorId)
        : undefined;
      const generos = Array.from(
        new Set(obrasAutor.map((obra) => obra.genero).filter(Boolean)),
      ).slice(0, 3);

      const avaliacao = primeiraObra.autorId
        ? avaliacoesPorAutor.get(primeiraObra.autorId)
        : undefined;

      return {
        id: perfil?.userId || primeiraObra.autorId || chave,
        nome: perfil?.nome || primeiraObra.autor,
        username: perfil?.username || "",
        avatar: perfil?.avatar || "",
        bio: perfil?.bio || "Autor no Historietas.",
        totalObras: obrasAutor.length,
        totalCurtidas: obrasAutor.reduce(
          (total, obra) => total + obra.totalCurtidas,
          0,
        ),
        totalComentarios: obrasAutor.reduce(
          (total, obra) => total + obra.totalComentarios,
          0,
        ),
        notaMedia: avaliacao?.media || 0,
        totalAvaliacoes: avaliacao?.total || 0,
        generos,
        criadaEm: obrasAutor
          .map((obra) => obra.publicadaEm)
          .sort((a, b) => timestampData(b) - timestampData(a))[0] || "",
      };
    })
    .sort((a, b) => b.totalObras - a.totalObras || a.nome.localeCompare(b.nome));
}

function tituloSecaoPublica(secao: string, genero: string) {
  if (genero) {
    return genero;
  }

  if (secao === "recomendacoes") {
    return "Recomendações para você";
  }

  if (secao === "em-alta") {
    return "Em alta";
  }

  if (secao === "recentes") {
    return "Publicações recentes";
  }

  if (secao === "novos-capitulos") {
    return "Novos capítulos";
  }

  if (secao === "mais-curtidas") {
    return "Mais curtidas";
  }

  if (secao === "mais-comentadas") {
    return "Mais comentadas";
  }

  if (secao === "para-ler-agora") {
    return "Para ler agora";
  }

  if (secao === "autores") {
    return "Autores para conhecer";
  }

  return "Todas as obras";
}

function rotuloCategoria(categoria: CategoriaPerfil) {
  return CATEGORIAS_PERFIL.find((item) => item.valor === categoria)?.rotulo || "Tudo";
}

function textoCategorias(categorias: CategoriaPerfil[]) {
  const ordem: CategoriaPerfil[] = [
    "lendo",
    "quero-ler",
    "favoritas",
    "concluidas",
    "avaliacoes",
    "historico",
  ];

  return ordem
    .filter((categoria) => categorias.includes(categoria))
    .map(rotuloCategoria)
    .join(" • ");
}

function renderizarEstrelasAvaliacao(nota: number, data: string) {
  const notaNormalizada = Math.max(
    0,
    Math.min(5, Math.round(nota * 2) / 2),
  );

  return (
    <span
      style={ratingDetailStyle}
      aria-label={`${formatarNotaListas(notaNormalizada)} de 5 estrelas`}
    >
      <span style={ratingStarsStyle} aria-hidden="true">
        {Array.from({ length: 5 }, (_, indice) => {
          const preenchimento = Math.max(
            0,
            Math.min(1, notaNormalizada - indice),
          );

          return (
            <span key={indice} style={ratingStarSlotStyle}>
              <span style={ratingStarEmptyStyle}>★</span>

              {preenchimento > 0 && (
                <span
                  style={{
                    ...ratingStarFillClipStyle,
                    width: `${preenchimento * 100}%`,
                  }}
                >
                  <span style={ratingStarFilledStyle}>★</span>
                </span>
              )}
            </span>
          );
        })}
      </span>

      <span>
        {formatarNotaListas(notaNormalizada)} • {formatarDataCurta(data)}
      </span>
    </span>
  );
}

function textoSecundarioItem(
  item: ItemObraLista,
  categoria: CategoriaPerfil,
) {
  if (categoria === "lendo") {
    return `${item.progresso}% concluído${
      item.capituloAtual ? ` • ${item.capituloAtual}` : ""
    }`;
  }

  if (categoria === "historico") {
    return `Última leitura em ${formatarDataCurta(item.data)}${
      item.progresso ? ` • ${item.progresso}%` : ""
    }`;
  }

  if (categoria === "quero-ler") {
    return `Adicionada em ${formatarDataCurta(item.data)}`;
  }

  if (categoria === "favoritas") {
    return `Favoritada em ${formatarDataCurta(item.data)}`;
  }

  if (categoria === "concluidas") {
    return `Concluída em ${formatarDataCurta(item.data)}`;
  }

  return textoCategorias(item.categorias) || `${item.obra.genero} • ${item.obra.formato}`;
}

function textoSecundarioObraPublica(obra: ObraLista, secao: string) {
  const totalCapitulos = obra.capitulos.length;
  const textoCapitulos = `${totalCapitulos} ${
    totalCapitulos === 1 ? "capítulo" : "capítulos"
  }`;

  if (secao === "novos-capitulos") {
    return `${textoCapitulos} • atualizado em ${formatarDataCurta(
      new Date(dataUltimoCapitulo(obra)).toISOString(),
    )}`;
  }

  if (secao === "mais-curtidas") {
    return `${compactarNumero(obra.totalCurtidas)} ${
      obra.totalCurtidas === 1 ? "curtida" : "curtidas"
    } • ${textoCapitulos}`;
  }

  if (secao === "mais-comentadas") {
    return `${compactarNumero(obra.totalComentarios)} ${
      obra.totalComentarios === 1 ? "comentário" : "comentários"
    } • ${textoCapitulos}`;
  }

  if (secao === "para-ler-agora") {
    return `${textoCapitulos} • leitura rápida`;
  }

  return `${totalCapitulos > 0 ? textoCapitulos : obra.formato}${
    obra.visualizacoes > 0
      ? ` • ${compactarNumero(obra.visualizacoes)} visualizações`
      : ""
  }`;
}

function criarCapaStyle(capa: string): CSSProperties {
  return capa
    ? {
        ...coverStyle,
        backgroundImage: `url(${capa})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : coverEmptyStyle;
}

function criarAvatarStyle(avatar: string): CSSProperties {
  return avatar
    ? {
        ...authorAvatarStyle,
        backgroundImage: `url(${avatar})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : authorAvatarEmptyStyle;
}

function criarAvatarPerfilDiarioListasStyle(avatar: string): CSSProperties {
  const avatarLimpo = avatar.trim();

  return avatarLimpo
    ? {
        ...listDiaryProfileAvatarStyle,
        backgroundImage: `url(${avatarLimpo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "transparent",
      }
    : listDiaryProfileAvatarStyle;
}

function criarAvatarComentarioDiarioListasStyle(
  estiloBase: CSSProperties,
  avatar: string,
): CSSProperties {
  const avatarLimpo = avatar.trim();

  return avatarLimpo
    ? {
        ...estiloBase,
        backgroundImage: `url(${avatarLimpo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "transparent",
      }
    : estiloBase;
}

function ListasUniversaisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const queryAtual = searchParams.toString();

  const modo = normalizarModoLista(searchParams.get("modo"));
  const origemPerfil = normalizarOrigemPerfil(searchParams.get("origem"));
  const categoriaUrl = normalizarCategoriaPerfil(searchParams.get("categoria"));
  const userIdUrl =
    searchParams.get("usuario") ||
    searchParams.get("userId") ||
    searchParams.get("autorId") ||
    "";
  const secao = pegarTexto(searchParams.get("secao"), "catalogo");
  const genero = pegarTexto(searchParams.get("genero"));
  const tituloPersonalizado = pegarTexto(searchParams.get("titulo"));
  const obraAlvoId = pegarTexto(
    searchParams.get("obra") || searchParams.get("obraId"),
  );

  const [usuarioAtualId, setUsuarioAtualId] = useState("");
  const [usuarioAtualPerfil, setUsuarioAtualPerfil] =
    useState<PerfilLista | null>(null);
  const [perfil, setPerfil] = useState<PerfilLista | null>(null);
  const [listasPerfil, setListasPerfil] =
    useState<ListasPerfilEstado>(LISTAS_PERFIL_VAZIAS);
  const [obrasPublicas, setObrasPublicas] = useState<ObraLista[]>([]);
  const [autores, setAutores] = useState<AutorLista[]>([]);
  const [categoria, setCategoria] = useState<CategoriaPerfil>(categoriaUrl);
  const busca = "";
  const ordenacao = normalizarOrdenacao(searchParams.get("ordem"));
  const [quantidadeVisivel, setQuantidadeVisivel] = useState(40);
  const [carregando, setCarregando] = useState(true);
  const [bloqueado, setBloqueado] = useState(false);
  const [erro, setErro] = useState("");
  const [obraMenuAberta, setObraMenuAberta] = useState<ObraLista | null>(null);
  const [itemPerfilMenuAberto, setItemPerfilMenuAberto] =
    useState<ItemObraLista | null>(null);
  const [categoriaMenuAberta, setCategoriaMenuAberta] =
    useState<CategoriaPerfil>("tudo");
  const [salvandoQueroLer, setSalvandoQueroLer] = useState(false);
  const [obraMenuNoQueroLer, setObraMenuNoQueroLer] = useState(false);
  const [editorAnotacao, setEditorAnotacao] =
    useState<EditorAnotacaoListasEstado>(EDITOR_ANOTACAO_LISTAS_VAZIO);
  const [interacoesAnotacoes, setInteracoesAnotacoes] =
    useState<InteracoesAnotacoesListasEstado>({});
  const [anotacoesAbertas, setAnotacoesAbertas] =
    useState<Record<string, boolean>>({});
  const [anotacoesSpoilerReveladas, setAnotacoesSpoilerReveladas] =
    useState<Record<string, boolean>>({});
  const [preferenciasPerfil, setPreferenciasPerfil] =
    useState<PreferenciasPrivacidadeHistorietas>(preferenciasPrivacidadePadrao);
  const [relacionamentoPerfil, setRelacionamentoPerfil] =
    useState<EstadoRelacionamentoPerfil>("nenhum");
  const [avaliacaoSalvando, setAvaliacaoSalvando] = useState(false);
  const [avaliacaoErro, setAvaliacaoErro] = useState("");
  const [avaliacaoDiario, setAvaliacaoDiario] =
    useState<AvaliacaoDiarioListasEstado>(AVALIACAO_DIARIO_LISTAS_VAZIA);
  const [comentarioCurtindoId, setComentarioCurtindoId] = useState("");
  const [comentarioRemovendoId, setComentarioRemovendoId] = useState("");
  const [mensagemAcao, setMensagemAcao] = useState("");
  const [alvoDenunciaDiario, setAlvoDenunciaDiario] =
    useState<AlvoDenunciaDiarioListas | null>(null);
  const [comentariosDiarioItem, setComentariosDiarioItem] =
    useState<ItemObraLista | null>(null);
  const [comentariosDiarioExpandido, setComentariosDiarioExpandido] =
    useState(false);
  const [menuOrdenacaoComentariosDiarioAberto, setMenuOrdenacaoComentariosDiarioAberto] =
    useState(false);
  const [respostasVisiveisComentariosDiario, setRespostasVisiveisComentariosDiario] =
    useState<Record<string, number>>({});
  const comentariosSheetRef = useRef<HTMLElement | null>(null);
  const comentariosDragStartYRef = useRef(0);
  const comentariosDragOffsetYRef = useRef(0);
  const comentariosDragIgnorarCliqueRef = useRef(false);
  const comentariosDragResetTimerRef = useRef<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [obraDestacadaId, setObraDestacadaId] = useState("");

  useEffect(() => {
    setCategoria(categoriaUrl);
  }, [categoriaUrl]);

  useEffect(() => {
    setQuantidadeVisivel(40);
  }, [categoria, busca, ordenacao, modo, secao, genero]);

  useEffect(() => {
    if (!obraMenuAberta) {
      return;
    }

    const overflowAnterior = document.body.style.overflow;
    const aoPressionarTecla = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setObraMenuAberta(null);
        setItemPerfilMenuAberto(null);
        setObraMenuNoQueroLer(false);
        setEditorAnotacao(EDITOR_ANOTACAO_LISTAS_VAZIO);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", aoPressionarTecla);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", aoPressionarTecla);
    };
  }, [obraMenuAberta]);

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      setCarregando(true);
      setBloqueado(false);
      setErro("");
      setAvaliacaoDiario((atual) => ({
        ...AVALIACAO_DIARIO_LISTAS_VAZIA,
        carregando: modo === "perfil" && origemPerfil === "diario",
        configuracoesAbertas: atual.configuracoesAbertas,
      }));

      try {
        const { data: authData } = await supabase.auth.getUser();
        const usuarioLogadoId = authData.user?.id || "";

        if (cancelado) {
          return;
        }

        setUsuarioAtualId(usuarioLogadoId);

        if (usuarioLogadoId) {
          try {
            const perfilUsuarioAtual = await carregarPerfil(
              usuarioLogadoId,
              pegarTexto(authData.user?.user_metadata?.nome) ||
                pegarTexto(authData.user?.email) ||
                "Usuário",
            );

            if (!cancelado) {
              setUsuarioAtualPerfil(perfilUsuarioAtual);
            }
          } catch {
            if (!cancelado) {
              setUsuarioAtualPerfil({
                userId: usuarioLogadoId,
                nome:
                  pegarTexto(authData.user?.user_metadata?.nome) ||
                  pegarTexto(authData.user?.email) ||
                  "Usuário",
                username: pegarTexto(
                  authData.user?.user_metadata?.username,
                ).replace(/^@/, ""),
                avatar: pegarTexto(
                  authData.user?.user_metadata?.avatar_url ??
                    authData.user?.user_metadata?.avatar,
                ),
                bio: "",
              });
            }
          }
        } else {
          setUsuarioAtualPerfil(null);
        }

        if (modo === "perfil") {
          const perfilIdRecebido = userIdUrl.trim() || usuarioLogadoId;

          if (!perfilIdRecebido || !idUsuarioValido(perfilIdRecebido)) {
            setPerfil(null);
            setListasPerfil(LISTAS_PERFIL_VAZIAS);
            setErro("Não foi possível identificar o perfil desta lista.");
            return;
          }

          const perfilInicialmenteProprio =
            perfilIdRecebido === usuarioLogadoId;
          const perfilCarregado = await carregarPerfil(
            perfilIdRecebido,
            perfilInicialmenteProprio
              ? pegarTexto(authData.user?.user_metadata?.nome) ||
                  pegarTexto(authData.user?.email)
              : "",
          );
          const perfilUserId =
            perfilCarregado.userId.trim() || perfilIdRecebido;
          const proprioPerfil =
            Boolean(usuarioLogadoId) &&
            (perfilUserId === usuarioLogadoId ||
              perfilIdRecebido === usuarioLogadoId);
          const preferencias = await carregarPreferenciasPrivacidade(
            perfilUserId,
            {
              usarFallbackLocal: proprioPerfil,
            },
          );
          const permissoes = proprioPerfil
            ? PERMISSOES_PROPRIO_PERFIL
            : await carregarPermissoesAbasPerfil(perfilUserId, preferencias);
          const permitido =
            origemPerfil === "biblioteca"
              ? permissoes.biblioteca
              : permissoes.diario;
          const relacionamento = proprioPerfil
            ? "proprio_perfil"
            : await carregarEstadoRelacionamentoPerfil(
                perfilUserId,
                usuarioLogadoId,
              );

          if (cancelado) {
            return;
          }

          setPerfil(perfilCarregado);
          setPreferenciasPerfil(preferencias);
          setRelacionamentoPerfil(relacionamento);

          if (origemPerfil === "diario") {
            try {
              const avaliacaoCarregada = await carregarAvaliacaoDiarioListas(
                perfilUserId,
              );

              if (!cancelado) {
                setAvaliacaoDiario(avaliacaoCarregada);
              }
            } catch (error) {
              if (!cancelado) {
                setAvaliacaoDiario((atual) => ({
                  ...atual,
                  carregando: false,
                  erro: obterMensagemErroListas(
                    error,
                    "Não foi possível carregar a Avaliação do Diário.",
                  ),
                }));
              }
            }
          }

          if (!permitido) {
            setBloqueado(true);
            setListasPerfil(LISTAS_PERFIL_VAZIAS);
            return;
          }

          const listas = await carregarListasDoPerfil(perfilUserId, proprioPerfil);

          if (!cancelado) {
            setListasPerfil(listas);
          }

          return;
        }

        const catalogo = await carregarObrasPublicadas();

        if (cancelado) {
          return;
        }

        let obrasPreparadas = catalogo.filter(
          (obra) => !ehClassificacao18(obra.classificacaoIndicativa),
        );

        if (genero) {
          const generoNormalizado = normalizarTexto(genero);
          obrasPreparadas = obrasPreparadas.filter((obra) =>
            normalizarTexto(obra.genero).includes(generoNormalizado),
          );
        }

        if (secao === "recomendacoes") {
          const idsInteracoes = await carregarIdsInteracoesUsuario(usuarioLogadoId);
          obrasPreparadas = ordenarRecomendacoes(obrasPreparadas, idsInteracoes);
        } else {
          obrasPreparadas = ordenarObrasDaSecao(obrasPreparadas, secao);
        }

        setObrasPublicas(obrasPreparadas);

        if (modo === "autores") {
          const autoresCarregados = await carregarAutoresPublicos(obrasPreparadas);

          if (!cancelado) {
            setAutores(autoresCarregados);
          }
        }
      } catch (error) {
        if (!cancelado) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar esta lista agora.",
          );
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    void iniciar();

    return () => {
      cancelado = true;
    };
  }, [modo, origemPerfil, userIdUrl, secao, genero]);


  useEffect(() => {
    if (!mensagemAcao) {
      return;
    }

    const timer = window.setTimeout(() => setMensagemAcao(""), 2600);
    return () => window.clearTimeout(timer);
  }, [mensagemAcao]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const atualizarModoDesktop = () => {
      setIsDesktop(mediaQuery.matches);
    };

    const timer = window.setTimeout(atualizarModoDesktop, 0);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", atualizarModoDesktop);

      return () => {
        window.clearTimeout(timer);
        mediaQuery.removeEventListener("change", atualizarModoDesktop);
      };
    }

    mediaQuery.addListener(atualizarModoDesktop);

    return () => {
      window.clearTimeout(timer);
      mediaQuery.removeListener(atualizarModoDesktop);
    };
  }, []);

  useEffect(() => {
    if (!comentariosDiarioItem) {
      return;
    }

    const overflowAnterior = document.body.style.overflow;
    const aoPressionarTecla = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setComentariosDiarioItem(null);
        setComentariosDiarioExpandido(false);
        setMenuOrdenacaoComentariosDiarioAberto(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", aoPressionarTecla);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", aoPressionarTecla);
    };
  }, [comentariosDiarioItem]);

  useEffect(() => {
    let cancelado = false;

    if (modo !== "perfil") {
      setInteracoesAnotacoes({});
      return;
    }

    const anotacaoIds = Array.from(
      new Set(
        (Object.values(listasPerfil) as ItemObraLista[][])
          .flat()
          .map((item) => item.anotacaoId?.trim() || "")
          .filter(Boolean),
      ),
    );

    void carregarInteracoesAnotacoesListas(
      anotacaoIds,
      usuarioAtualId,
    ).then((carregadas) => {
      if (cancelado) return;

      setInteracoesAnotacoes((atuais) => {
        const proximo: InteracoesAnotacoesListasEstado = {};

        Object.entries(carregadas).forEach(([id, interacao]) => {
          proximo[id] = {
            ...interacao,
            novoComentario: atuais[id]?.novoComentario || "",
            respondendoComentarioId:
              atuais[id]?.respondendoComentarioId || "",
            respondendoAutorNome: atuais[id]?.respondendoAutorNome || "",
            ordenacaoComentarios:
              atuais[id]?.ordenacaoComentarios || "relevantes",
          };
        });

        return proximo;
      });
    });

    return () => {
      cancelado = true;
    };
  }, [listasPerfil, modo, usuarioAtualId]);

  useEffect(() => {
    if (modo !== "perfil" || carregando || !obraAlvoId) {
      return;
    }

    const obraEstaNaCategoriaAtual = listasPerfil[categoria].some(
      (item) => item.obra.id === obraAlvoId,
    );
    const obraEstaEmTudo = listasPerfil.tudo.some(
      (item) => item.obra.id === obraAlvoId,
    );

    if (!obraEstaNaCategoriaAtual && obraEstaEmTudo && categoria !== "tudo") {
      const params = new URLSearchParams(queryAtual);
      params.set("categoria", "tudo");
      setCategoria("tudo");
      router.replace(`/listas?${params.toString()}`, { scroll: false });
      return;
    }

    const timer = window.setTimeout(() => {
      const elemento = document.getElementById(`lista-obra-${obraAlvoId}`);

      if (!elemento) return;
      setObraDestacadaId(obraAlvoId);
      elemento.scrollIntoView({ behavior: "smooth", block: "center" });

      window.setTimeout(() => {
        setObraDestacadaId((atual) => (atual === obraAlvoId ? "" : atual));
      }, 2400);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [
    obraAlvoId,
    carregando,
    categoria,
    listasPerfil,
    modo,
    queryAtual,
    router,
  ]);

  const itensPerfilFiltrados = useMemo(() => {
    const buscaNormalizada = normalizarTexto(busca);
    let itens = [...listasPerfil[categoria]];

    if (buscaNormalizada) {
      itens = itens.filter((item) =>
        normalizarTexto(
          [
            item.obra.titulo,
            item.obra.autor,
            item.obra.genero,
            item.obra.formato,
            textoCategorias(item.categorias),
          ].join(" "),
        ).includes(buscaNormalizada),
      );
    }

    itens.sort((a, b) => {
      if (ordenacao === "titulo") {
        return a.obra.titulo.localeCompare(b.obra.titulo, "pt-BR");
      }

      if (ordenacao === "avaliacao") {
        return (
          (b.nota || b.obra.notaMedia) - (a.nota || a.obra.notaMedia) ||
          timestampData(b.data) - timestampData(a.data)
        );
      }

      if (ordenacao === "popularidade") {
        return b.obra.visualizacoes - a.obra.visualizacoes;
      }

      return timestampData(b.data) - timestampData(a.data);
    });

    return itens;
  }, [busca, categoria, listasPerfil, ordenacao]);

  const obrasFiltradas = useMemo(() => {
    const buscaNormalizada = normalizarTexto(busca);
    let obras = [...obrasPublicas];

    if (buscaNormalizada) {
      obras = obras.filter((obra) =>
        normalizarTexto(
          [obra.titulo, obra.autor, obra.genero, obra.formato].join(" "),
        ).includes(buscaNormalizada),
      );
    }

    obras.sort((a, b) => {
      if (ordenacao === "titulo") {
        return a.titulo.localeCompare(b.titulo, "pt-BR");
      }

      if (ordenacao === "avaliacao") {
        return b.notaMedia - a.notaMedia || b.totalAvaliacoes - a.totalAvaliacoes;
      }

      if (secao === "novos-capitulos") {
        return dataUltimoCapitulo(b) - dataUltimoCapitulo(a);
      }

      if (secao === "mais-curtidas") {
        return b.totalCurtidas - a.totalCurtidas;
      }

      if (secao === "mais-comentadas") {
        return b.totalComentarios - a.totalComentarios;
      }

      if (secao === "para-ler-agora") {
        return (
          a.capitulos.length - b.capitulos.length ||
          pontuacaoPopularidadeObra(b) - pontuacaoPopularidadeObra(a)
        );
      }

      if (ordenacao === "popularidade") {
        return pontuacaoPopularidadeObra(b) - pontuacaoPopularidadeObra(a);
      }

      return timestampData(b.publicadaEm) - timestampData(a.publicadaEm);
    });

    return obras;
  }, [busca, obrasPublicas, ordenacao, secao]);

  const autoresFiltrados = useMemo(() => {
    const buscaNormalizada = normalizarTexto(busca);
    let lista = [...autores];

    if (buscaNormalizada) {
      lista = lista.filter((autor) =>
        normalizarTexto(
          [autor.nome, autor.username, autor.bio, ...autor.generos].join(" "),
        ).includes(buscaNormalizada),
      );
    }

    lista.sort((a, b) => {
      if (ordenacao === "titulo") {
        return a.nome.localeCompare(b.nome, "pt-BR");
      }

      if (ordenacao === "avaliacao") {
        return (
          b.notaMedia - a.notaMedia ||
          b.totalAvaliacoes - a.totalAvaliacoes ||
          b.totalObras - a.totalObras
        );
      }

      if (ordenacao === "popularidade") {
        const pontuacao = (autor: AutorLista) =>
          autor.totalObras * 12 +
          autor.totalCurtidas * 4 +
          autor.totalComentarios * 3;

        return pontuacao(b) - pontuacao(a) || b.totalObras - a.totalObras;
      }

      if (ordenacao === "recentes") {
        return timestampData(b.criadaEm) - timestampData(a.criadaEm);
      }

      return b.totalObras - a.totalObras || a.nome.localeCompare(b.nome, "pt-BR");
    });

    return lista;
  }, [autores, busca, ordenacao]);

  const totalResultados =
    modo === "perfil"
      ? itensPerfilFiltrados.length
      : modo === "autores"
        ? autoresFiltrados.length
        : obrasFiltradas.length;
  const tituloPagina =
    tituloPersonalizado ||
    (modo === "perfil"
      ? `${origemPerfil === "biblioteca" ? "Biblioteca" : "Diário"} de ${
          perfil?.nome || "usuário"
        }`
      : modo === "autores"
        ? "Autores para conhecer"
        : tituloSecaoPublica(secao, genero));
  const agruparPorMes =
    modo === "perfil" && (categoria === "avaliacoes" || categoria === "historico");
  const itensPerfilVisiveis = itensPerfilFiltrados.slice(0, quantidadeVisivel);
  const obrasVisiveis = obrasFiltradas.slice(0, quantidadeVisivel);
  const autoresVisiveis = autoresFiltrados.slice(0, quantidadeVisivel);

  const gruposPerfil = useMemo(() => {
    const grupos = new Map<string, ItemObraLista[]>();

    itensPerfilVisiveis.forEach((item) => {
      const chave = formatarMesAno(item.data);
      const atuais = grupos.get(chave) || [];
      atuais.push(item);
      grupos.set(chave, atuais);
    });

    return Array.from(grupos.entries());
  }, [itensPerfilVisiveis]);

  function trocarCategoria(novaCategoria: CategoriaPerfil) {
    setCategoria(novaCategoria);
    const params = new URLSearchParams(queryAtual);
    params.set("categoria", novaCategoria);
    router.replace(`/listas?${params.toString()}`, { scroll: false });
  }

  async function abrirMenuObra(
    obra: ObraLista,
    item: ItemObraLista | null = null,
    categoriaAtual: CategoriaPerfil = "tudo",
  ) {
    setObraMenuAberta(obra);
    setItemPerfilMenuAberto(item);
    setCategoriaMenuAberta(categoriaAtual);
    setObraMenuNoQueroLer(false);
    setEditorAnotacao(EDITOR_ANOTACAO_LISTAS_VAZIO);
    setAvaliacaoErro("");

    try {
      const userId =
        usuarioAtualId ||
        (await supabase.auth.getUser()).data.user?.id ||
        "";

      if (!userId) {
        return;
      }

      const listaLocal = carregarListaIdsListas(
        LIBRARY_FOLLOW_STORAGE_KEY,
        userId,
      );
      const salvoLocalmente = colecaoTemObraListas(listaLocal, obra);

      setObraMenuNoQueroLer(salvoLocalmente);

      const { data, error } = await supabase
        .from("seguindo_obras")
        .select("obra_id")
        .eq("user_id", userId)
        .eq("obra_id", obra.id)
        .limit(1);

      if (error) {
        return;
      }

      const salvoRemotamente = Array.isArray(data) && data.length > 0;
      const salvo = salvoLocalmente || salvoRemotamente;

      setObraMenuNoQueroLer(salvo);

      if (salvoRemotamente && !salvoLocalmente) {
        salvarListaIdsListas(
          LIBRARY_FOLLOW_STORAGE_KEY,
          userId,
          Array.from(new Set([...listaLocal, obra.id])),
        );
      }
    } catch {
      // O estado local continua disponível mesmo sem resposta do Supabase.
    }
  }

  function fecharMenuObra() {
    if (salvandoQueroLer || editorAnotacao.salvando || avaliacaoSalvando) {
      return;
    }

    setObraMenuAberta(null);
    setItemPerfilMenuAberto(null);
    setObraMenuNoQueroLer(false);
    setEditorAnotacao(EDITOR_ANOTACAO_LISTAS_VAZIO);
    setAvaliacaoErro("");
  }

  async function alternarObraNoQueroLer() {
    if (!obraMenuAberta || salvandoQueroLer) {
      return;
    }

    const obra = obraMenuAberta;
    setSalvandoQueroLer(true);

    try {
      const userId =
        usuarioAtualId ||
        (await supabase.auth.getUser()).data.user?.id ||
        "";

      if (!userId) {
        setObraMenuAberta(null);
        router.push(criarLoginHrefListas());
        return;
      }

      const listaAtual = carregarListaIdsListas(
        LIBRARY_FOLLOW_STORAGE_KEY,
        userId,
      );
      const jaEstaSalva =
        obraMenuNoQueroLer || colecaoTemObraListas(listaAtual, obra);
      const proximoEstado = !jaEstaSalva;
      const listaAtualizada = proximoEstado
        ? Array.from(new Set([...listaAtual, obra.id]))
        : removerObraDaColecaoListas(listaAtual, obra);

      salvarListaIdsListas(
        LIBRARY_FOLLOW_STORAGE_KEY,
        userId,
        listaAtualizada,
      );
      setObraMenuNoQueroLer(proximoEstado);
      setObraMenuAberta(null);
      setItemPerfilMenuAberto(null);

      await sincronizarQueroLerListas(userId, obra.id, proximoEstado);
    } finally {
      setSalvandoQueroLer(false);
    }
  }

  function copiarTextoComFallback(texto: string) {
    const campo = document.createElement("textarea");
    campo.value = texto;
    campo.setAttribute("readonly", "true");
    campo.style.position = "fixed";
    campo.style.left = "-9999px";
    document.body.appendChild(campo);
    campo.select();

    let copiado = false;

    try {
      copiado = document.execCommand("copy");
    } catch {
      copiado = false;
    }

    document.body.removeChild(campo);
    return copiado;
  }

  async function compartilharObraDoMenu() {
    if (!obraMenuAberta) {
      return;
    }

    const link = new URL(obraMenuAberta.link, window.location.origin).toString();
    const dados: ShareData = {
      title: `${obraMenuAberta.titulo} no HISTORIETAS`,
      text: `Confira ${obraMenuAberta.titulo} de ${obraMenuAberta.autor} no HISTORIETAS.`,
      url: link,
    };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(dados);
        fecharMenuObra();
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      let copiado = false;

      if (
        window.isSecureContext &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        try {
          await navigator.clipboard.writeText(link);
          copiado = true;
        } catch {
          copiado = copiarTextoComFallback(link);
        }
      } else {
        copiado = copiarTextoComFallback(link);
      }

      if (!copiado) {
        throw new Error("Não foi possível copiar o link.");
      }

      fecharMenuObra();
    } catch {
      // Mantém a ação silenciosa quando o compartilhamento não estiver disponível.
    }
  }


  const perfilEhProprio = Boolean(
    modo === "perfil" &&
      usuarioAtualId &&
      perfil?.userId &&
      usuarioAtualId === perfil.userId,
  );
  function obterPermissoesAnotacaoListas(item: ItemObraLista) {
    const visibilidadeComentarios =
      item.anotacaoVisibilidadeComentarios || "herdar";
    const quemPodeComentar = item.anotacaoQuemPodeComentar || "herdar";
    const seguidor = relacionamentoPerfil === "seguindo";
    const podeVerComentarios =
      perfilEhProprio ||
      visibilidadeComentarios === "publico" ||
      visibilidadeComentarios === "herdar" ||
      (visibilidadeComentarios === "seguidores" && seguidor);
    const regraComentarioEfetiva =
      quemPodeComentar === "herdar"
        ? preferenciasPerfil.quemPodeComentarDiario
        : quemPodeComentar;
    const podeComentar =
      podeVerComentarios &&
      (perfilEhProprio ||
        regraComentarioEfetiva === "todos" ||
        (regraComentarioEfetiva === "seguidores" && seguidor));

    return {
      podeVerComentarios,
      podeComentar,
      podeCurtirAnotacao: item.anotacaoPermitirCurtidas !== false,
    };
  }

  async function salvarAvaliacaoDiarioPerfil(novaNota: number) {
    const perfilUserId = perfil?.userId.trim() || "";

    if (!perfilUserId || avaliacaoDiario.salvando || perfilEhProprio) {
      return;
    }

    if (!usuarioAtualId) {
      router.push(criarLoginHrefListas());
      return;
    }

    if (!avaliacaoDiario.visivel || !avaliacaoDiario.podeAvaliar) {
      return;
    }

    const nota =
      novaNota <= 0
        ? 0
        : Math.max(0.5, Math.min(5, Math.round(novaNota * 2) / 2));
    const avaliacaoAnterior = avaliacaoDiario;
    const avaliacaoOtimista = calcularProximaAvaliacaoDiarioListas(
      avaliacaoDiario,
      nota,
    );

    setAvaliacaoDiario(avaliacaoOtimista);
    setMensagemAcao("");

    try {
      const nomeRpc =
        nota > 0 ? "salvar_avaliacao_diario" : "remover_avaliacao_diario";
      const parametros =
        nota > 0
          ? { p_diario_user_id: perfilUserId, p_nota: nota }
          : { p_diario_user_id: perfilUserId };
      const { data, error } = await supabase.rpc(nomeRpc, parametros);

      if (error) {
        throw error;
      }

      if (data && typeof data === "object") {
        setAvaliacaoDiario((atual) =>
          normalizarAvaliacaoDiarioListas(data, atual),
        );
      } else {
        const avaliacaoAtualizada = await carregarAvaliacaoDiarioListas(
          perfilUserId,
        );
        setAvaliacaoDiario(avaliacaoAtualizada);
      }
    } catch (error) {
      setAvaliacaoDiario({
        ...avaliacaoAnterior,
        salvando: false,
        erro: obterMensagemErroListas(
          error,
          "Não foi possível salvar a Avaliação do Diário.",
        ),
      });
    }
  }

  async function salvarConfiguracoesAvaliacaoDiario() {
    const perfilUserId = perfil?.userId.trim() || "";

    if (
      !perfilEhProprio ||
      !perfilUserId ||
      avaliacaoDiario.salvandoConfiguracoes
    ) {
      return;
    }

    setAvaliacaoDiario((atual) => ({
      ...atual,
      salvandoConfiguracoes: true,
      erro: "",
    }));

    try {
      const { error } = await supabase
        .from("preferencias_privacidade")
        .upsert(
          {
            user_id: perfilUserId,
            mostrar_avaliacao_diario: avaliacaoDiario.mostrar,
            permitir_avaliacao_diario: avaliacaoDiario.permitir,
            quem_pode_avaliar_diario: avaliacaoDiario.quemPodeAvaliar,
          },
          { onConflict: "user_id" },
        );

      if (error) throw error;
      const avaliacaoAtualizada = await carregarAvaliacaoDiarioListas(
        perfilUserId,
      );
      setAvaliacaoDiario({
        ...avaliacaoAtualizada,
        configuracoesAbertas: false,
      });
      setMensagemAcao("Privacidade da Avaliação do Diário atualizada.");
    } catch (error) {
      setAvaliacaoDiario((atual) => ({
        ...atual,
        salvandoConfiguracoes: false,
        erro: obterMensagemErroListas(
          error,
          "Não foi possível salvar as configurações da avaliação.",
        ),
      }));
    }
  }

  function atualizarAnotacaoNosItensListas(
    obraId: string,
    atualizacao: Pick<
      ItemObraLista,
      | "anotacao"
      | "anotacaoId"
      | "anotacaoTipo"
      | "anotacaoVisibilidade"
      | "anotacaoQuemPodeComentar"
      | "anotacaoVisibilidadeComentarios"
      | "anotacaoPermitirCurtidas"
      | "anotacaoSpoiler"
    >,
  ) {
    setListasPerfil((estadoAtual) => {
      const proximo = { ...estadoAtual };

      (Object.keys(proximo) as CategoriaPerfil[]).forEach((categoriaEstado) => {
        proximo[categoriaEstado] = proximo[categoriaEstado].map((item) =>
          item.obra.id === obraId ? { ...item, ...atualizacao } : item,
        );
      });

      return proximo;
    });

    setItemPerfilMenuAberto((itemAtual) =>
      itemAtual?.obra.id === obraId
        ? { ...itemAtual, ...atualizacao }
        : itemAtual,
    );
  }

  function abrirEditorAnotacaoListas() {
    const item = itemPerfilMenuAberto;
    const obra = obraMenuAberta;

    if (!item || !obra || !perfilEhProprio || !idUsuarioValido(obra.id)) {
      setMensagemAcao("Você só pode editar anotações da sua própria lista.");
      return;
    }

    setEditorAnotacao({
      aberto: true,
      obraId: obra.id,
      anotacaoId: item.anotacaoId?.trim() || "",
      tipo:
        item.anotacaoTipo ||
        obterTipoDiarioDoItemListas(categoriaMenuAberta, item),
      texto: item.anotacao || "",
      visibilidade:
        item.anotacaoVisibilidade ||
        (preferenciasPerfil.anotacoesPrivadasPorPadrao
          ? "privado"
          : preferenciasPerfil.visibilidadeDiario === "publico"
            ? "publico"
            : "parcial"),
      quemPodeComentar: item.anotacaoQuemPodeComentar || "herdar",
      visibilidadeComentarios:
        item.anotacaoVisibilidadeComentarios || "herdar",
      permitirCurtidas: item.anotacaoPermitirCurtidas !== false,
      contemSpoiler: Boolean(item.anotacaoSpoiler),
      salvando: false,
      erro: "",
    });
  }

  async function salvarAnotacaoListas() {
    const userId = usuarioAtualId.trim();
    const obraId = editorAnotacao.obraId.trim();
    const textoAnotacao = editorAnotacao.texto.trim();

    if (!perfilEhProprio || !userId || !idUsuarioValido(userId)) {
      setEditorAnotacao((atual) => ({
        ...atual,
        erro: "Entre na sua conta para salvar a anotação.",
      }));
      return;
    }

    if (!obraId || !idUsuarioValido(obraId)) {
      setEditorAnotacao((atual) => ({
        ...atual,
        erro: "A obra ainda não possui um ID válido no Supabase.",
      }));
      return;
    }

    if (!textoAnotacao) {
      setEditorAnotacao((atual) => ({
        ...atual,
        erro: "Escreva uma anotação antes de salvar.",
      }));
      return;
    }

    setEditorAnotacao((atual) => ({ ...atual, salvando: true, erro: "" }));

    try {
      const atualizadoEm = new Date().toISOString();
      const visibilidadeHerdada: VisibilidadeAnotacaoListas =
        editorAnotacao.visibilidade;
      const payload = {
        user_id: userId,
        obra_id: obraId,
        tipo: editorAnotacao.tipo,
        texto: textoAnotacao.slice(0, DIARIO_ANOTACAO_MAX_LENGTH),
        visibilidade: visibilidadeHerdada,
        quem_pode_comentar: editorAnotacao.quemPodeComentar,
        visibilidade_comentarios: editorAnotacao.visibilidadeComentarios,
        permitir_curtidas: editorAnotacao.permitirCurtidas,
        contem_spoiler: editorAnotacao.contemSpoiler,
        atualizado_em: atualizadoEm,
      };
      const camposComSpoiler =
        "id,obra_id,tipo,texto,visibilidade,quem_pode_comentar,visibilidade_comentarios,permitir_curtidas,contem_spoiler,atualizado_em";
      const camposCompatibilidade =
        "id,obra_id,tipo,texto,visibilidade,atualizado_em";

      async function atualizarRegistroAnotacao(id: string) {
        const respostaComSpoiler = await supabase
          .from("diario_anotacoes")
          .update({
            texto: payload.texto,
            visibilidade: payload.visibilidade,
            quem_pode_comentar: payload.quem_pode_comentar,
            visibilidade_comentarios: payload.visibilidade_comentarios,
            permitir_curtidas: payload.permitir_curtidas,
            contem_spoiler: payload.contem_spoiler,
            atualizado_em: payload.atualizado_em,
          })
          .eq("id", id)
          .eq("user_id", userId)
          .select(camposComSpoiler)
          .maybeSingle();

        if (!respostaComSpoiler.error) {
          return respostaComSpoiler.data
            ? (respostaComSpoiler.data as unknown as RegistroGenerico)
            : null;
        }

        if (
          !erroRelacionadoAoCampoSpoilerListas(respostaComSpoiler.error)
        ) {
          throw respostaComSpoiler.error;
        }

        const respostaCompatibilidade = await supabase
          .from("diario_anotacoes")
          .update({
            texto: payload.texto,
            visibilidade: payload.visibilidade,
            atualizado_em: payload.atualizado_em,
          })
          .eq("id", id)
          .eq("user_id", userId)
          .select(camposCompatibilidade)
          .maybeSingle();

        if (respostaCompatibilidade.error || !respostaCompatibilidade.data) {
          throw (
            respostaCompatibilidade.error ||
            respostaComSpoiler.error ||
            new Error("O banco não confirmou a anotação atualizada.")
          );
        }

        return {
          ...(respostaCompatibilidade.data as unknown as RegistroGenerico),
          contem_spoiler: payload.contem_spoiler,
        };
      }

      async function buscarRegistroAnotacaoExistente() {
        const respostaComSpoiler = await supabase
          .from("diario_anotacoes")
          .select(camposComSpoiler)
          .eq("user_id", userId)
          .eq("obra_id", obraId)
          .order("atualizado_em", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!respostaComSpoiler.error) {
          return respostaComSpoiler.data
            ? (respostaComSpoiler.data as unknown as RegistroGenerico)
            : null;
        }

        if (
          !erroRelacionadoAoCampoSpoilerListas(respostaComSpoiler.error)
        ) {
          throw respostaComSpoiler.error;
        }

        const respostaCompatibilidade = await supabase
          .from("diario_anotacoes")
          .select(camposCompatibilidade)
          .eq("user_id", userId)
          .eq("obra_id", obraId)
          .order("atualizado_em", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (respostaCompatibilidade.error) {
          throw respostaCompatibilidade.error;
        }

        return respostaCompatibilidade.data
          ? ({
              ...(respostaCompatibilidade.data as unknown as RegistroGenerico),
              contem_spoiler: false,
            } as RegistroGenerico)
          : null;
      }

      async function inserirRegistroAnotacao() {
        const respostaComSpoiler = await supabase
          .from("diario_anotacoes")
          .insert(payload)
          .select(camposComSpoiler)
          .single();

        if (!respostaComSpoiler.error) {
          if (!respostaComSpoiler.data) {
            throw new Error("O banco não confirmou a anotação salva.");
          }

          return respostaComSpoiler.data as unknown as RegistroGenerico;
        }

        if (
          !erroRelacionadoAoCampoSpoilerListas(respostaComSpoiler.error)
        ) {
          throw respostaComSpoiler.error;
        }

        const payloadCompatibilidade = {
          user_id: payload.user_id,
          obra_id: payload.obra_id,
          tipo: payload.tipo,
          texto: payload.texto,
          visibilidade: payload.visibilidade,
          atualizado_em: payload.atualizado_em,
        };
        const respostaCompatibilidade = await supabase
          .from("diario_anotacoes")
          .insert(payloadCompatibilidade)
          .select(camposCompatibilidade)
          .single();

        if (respostaCompatibilidade.error || !respostaCompatibilidade.data) {
          throw (
            respostaCompatibilidade.error ||
            respostaComSpoiler.error ||
            new Error("O banco não confirmou a anotação salva.")
          );
        }

        return {
          ...(respostaCompatibilidade.data as unknown as RegistroGenerico),
          contem_spoiler: payload.contem_spoiler,
        };
      }

      let registroSalvo: RegistroGenerico | null = null;

      if (editorAnotacao.anotacaoId) {
        registroSalvo = await atualizarRegistroAnotacao(
          editorAnotacao.anotacaoId,
        );
      }

      if (!registroSalvo) {
        const anotacaoExistente = await buscarRegistroAnotacaoExistente();
        const idExistente = pegarTexto(anotacaoExistente?.id);

        registroSalvo = idExistente
          ? await atualizarRegistroAnotacao(idExistente)
          : await inserirRegistroAnotacao();
      }

      if (!registroSalvo) {
        throw new Error("O banco não confirmou a anotação salva.");
      }

      const anotacaoId = pegarTexto(registroSalvo.id);
      const tipoSalvo =
        normalizarTipoDiarioListas(registroSalvo.tipo) || editorAnotacao.tipo;
      const visibilidadeSalva = normalizarVisibilidadeAnotacaoListas(
        registroSalvo.visibilidade,
        visibilidadeHerdada,
      );
      const textoSalvo = pegarTexto(registroSalvo.texto, payload.texto);
      const quemPodeComentarSalvo = normalizarQuemPodeComentarAnotacaoListas(
        registroSalvo.quem_pode_comentar ?? registroSalvo.quemPodeComentar,
        editorAnotacao.quemPodeComentar,
      );
      const visibilidadeComentariosSalva =
        normalizarVisibilidadeComentariosAnotacaoListas(
          registroSalvo.visibilidade_comentarios ??
            registroSalvo.visibilidadeComentarios,
          editorAnotacao.visibilidadeComentarios,
        );
      const permitirCurtidasSalvo = pegarBooleanoListas(
        registroSalvo.permitir_curtidas ?? registroSalvo.permitirCurtidas,
        editorAnotacao.permitirCurtidas,
      );
      const contemSpoilerSalvo = pegarBooleanoListas(
        registroSalvo.contem_spoiler ?? registroSalvo.contemSpoiler,
        editorAnotacao.contemSpoiler,
      );

      if (anotacaoId) {
        const { error: erroDuplicadas } = await supabase
          .from("diario_anotacoes")
          .delete()
          .eq("user_id", userId)
          .eq("obra_id", obraId)
          .neq("id", anotacaoId);

        if (erroDuplicadas) {
          console.warn(
            "Não consegui remover anotações duplicadas:",
            erroDuplicadas.message,
          );
        }
      }

      salvarAnotacaoLocalListas(userId, {
        id: anotacaoId,
        user_id: userId,
        obra_id: obraId,
        tipo: tipoSalvo,
        texto: textoSalvo,
        visibilidade: visibilidadeSalva,
        quem_pode_comentar: quemPodeComentarSalvo,
        visibilidade_comentarios: visibilidadeComentariosSalva,
        permitir_curtidas: permitirCurtidasSalvo,
        contem_spoiler: contemSpoilerSalvo,
        atualizado_em: pegarTexto(registroSalvo.atualizado_em, atualizadoEm),
      });

      atualizarAnotacaoNosItensListas(obraId, {
        anotacao: textoSalvo,
        anotacaoId,
        anotacaoTipo: tipoSalvo,
        anotacaoVisibilidade: visibilidadeSalva,
        anotacaoQuemPodeComentar: quemPodeComentarSalvo,
        anotacaoVisibilidadeComentarios: visibilidadeComentariosSalva,
        anotacaoPermitirCurtidas: permitirCurtidasSalvo,
        anotacaoSpoiler: contemSpoilerSalvo,
      });

      const chaveAnotacaoSalva = anotacaoId || obraId;
      setAnotacoesAbertas((atuais) => ({
        ...atuais,
        [chaveAnotacaoSalva]: false,
      }));
      setAnotacoesSpoilerReveladas((atuais) => ({
        ...atuais,
        [chaveAnotacaoSalva]: false,
      }));

      if (anotacaoId && !interacoesAnotacoes[anotacaoId]) {
        setInteracoesAnotacoes((atual) => ({
          ...atual,
          [anotacaoId]: criarInteracaoAnotacaoListasVazia(),
        }));
      }

      setEditorAnotacao(EDITOR_ANOTACAO_LISTAS_VAZIO);
      setMensagemAcao("Anotação salva.");
    } catch (error) {
      setEditorAnotacao((atual) => ({
        ...atual,
        salvando: false,
        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar a anotação.",
      }));
    }
  }

  async function removerAnotacaoListas() {
    const userId = usuarioAtualId.trim();
    const obraId = editorAnotacao.obraId.trim();

    if (
      !perfilEhProprio ||
      !userId ||
      !obraId ||
      !window.confirm("Remover esta anotação?")
    ) {
      return;
    }

    setEditorAnotacao((atual) => ({ ...atual, salvando: true, erro: "" }));

    try {
      const { error } = await supabase
        .from("diario_anotacoes")
        .delete()
        .eq("user_id", userId)
        .eq("obra_id", obraId);

      if (error) throw error;

      removerAnotacaoLocalListas(userId, obraId);
      atualizarAnotacaoNosItensListas(obraId, {
        anotacao: undefined,
        anotacaoId: undefined,
        anotacaoTipo: undefined,
        anotacaoVisibilidade: undefined,
        anotacaoQuemPodeComentar: undefined,
        anotacaoVisibilidadeComentarios: undefined,
        anotacaoPermitirCurtidas: undefined,
        anotacaoSpoiler: undefined,
      });
      const chaveAnotacaoRemovida =
        editorAnotacao.anotacaoId || obraId;
      setAnotacoesAbertas((atuais) => {
        const proximo = { ...atuais };
        delete proximo[chaveAnotacaoRemovida];
        return proximo;
      });
      setAnotacoesSpoilerReveladas((atuais) => {
        const proximo = { ...atuais };
        delete proximo[chaveAnotacaoRemovida];
        return proximo;
      });
      setEditorAnotacao(EDITOR_ANOTACAO_LISTAS_VAZIO);
      setMensagemAcao("Anotação removida.");
    } catch (error) {
      setEditorAnotacao((atual) => ({
        ...atual,
        salvando: false,
        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível remover a anotação.",
      }));
    }
  }

  function abrirDenunciaDiario(
    tipo: AlvoDenunciaDiarioListas["tipo"],
    id: string,
    titulo: string,
    autorId: string,
  ) {
    const alvoId = id.trim();
    const autorIdLimpo = autorId.trim();

    if (!alvoId || !idUsuarioValido(alvoId)) {
      setMensagemAcao("Não foi possível identificar este conteúdo.");
      return;
    }

    if (
      autorIdLimpo &&
      usuarioAtualId.trim() &&
      autorIdLimpo === usuarioAtualId.trim()
    ) {
      setMensagemAcao("Você não pode denunciar seu próprio conteúdo.");
      return;
    }

    if (tipo === "comentario_diario") {
      fecharComentariosDiario();
    }

    setAlvoDenunciaDiario({
      tipo,
      id: alvoId,
      titulo: titulo.trim() || "Conteúdo do Diário",
    });
  }

  function atualizarInteracaoAnotacaoListas(
    anotacaoId: string,
    atualizar: (estado: InteracaoAnotacaoListas) => InteracaoAnotacaoListas,
  ) {
    setInteracoesAnotacoes((estadoAtual) => ({
      ...estadoAtual,
      [anotacaoId]: atualizar(
        estadoAtual[anotacaoId] || criarInteracaoAnotacaoListasVazia(),
      ),
    }));
  }

  async function alternarCurtidaAnotacaoListas(item: ItemObraLista) {
    const anotacaoId = item.anotacaoId?.trim() || "";
    const userId = usuarioAtualId.trim();

    if (!anotacaoId) return;

    const permissoes = obterPermissoesAnotacaoListas(item);

    if (!permissoes.podeCurtirAnotacao) {
      setMensagemAcao("As curtidas estão desativadas nesta anotação.");
      return;
    }

    if (!userId) {
      router.push(criarLoginHrefListas());
      return;
    }

    const interacao =
      interacoesAnotacoes[anotacaoId] || criarInteracaoAnotacaoListasVazia();

    if (interacao.salvandoCurtida) return;

    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      salvandoCurtida: true,
      erro: "",
    }));

    try {
      if (interacao.curtiu) {
        const { error } = await supabase
          .from("diario_anotacao_curtidas")
          .delete()
          .eq("anotacao_id", anotacaoId)
          .eq("user_id", userId);
        if (error) throw error;

        atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
          ...atual,
          curtiu: false,
          totalCurtidas: Math.max(0, atual.totalCurtidas - 1),
          salvandoCurtida: false,
        }));
      } else {
        const { error } = await supabase
          .from("diario_anotacao_curtidas")
          .insert({ anotacao_id: anotacaoId, user_id: userId });
        if (error) throw error;

        atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
          ...atual,
          curtiu: true,
          totalCurtidas: atual.totalCurtidas + 1,
          salvandoCurtida: false,
        }));
      }
    } catch (error) {
      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        salvandoCurtida: false,
        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar a curtida.",
      }));
    }
  }

  function atualizarComentarioAnotacaoListas(anotacaoId: string, texto: string) {
    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      novoComentario: texto.slice(0, DIARIO_COMENTARIO_MAX_LENGTH),
      erro: "",
    }));
  }

  function iniciarRespostaComentarioAnotacaoListas(
    anotacaoId: string,
    comentario: ComentarioAnotacaoListas,
  ) {
    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      respondendoComentarioId: comentario.parentId || comentario.id,
      respondendoAutorNome: comentario.autorNome,
      erro: "",
    }));
  }

  function cancelarRespostaComentarioAnotacaoListas(anotacaoId: string) {
    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      respondendoComentarioId: "",
      respondendoAutorNome: "",
    }));
  }

  function alterarOrdenacaoComentariosAnotacaoListas(
    anotacaoId: string,
    ordenacao: OrdenacaoComentariosDiarioListas,
  ) {
    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      ordenacaoComentarios: ordenacao,
    }));
  }

  async function alternarCurtidaComentarioAnotacaoListas(
    anotacaoId: string,
    comentario: ComentarioAnotacaoListas,
  ) {
    const userId = usuarioAtualId.trim();

    if (!userId) {
      router.push(criarLoginHrefListas());
      return;
    }

    if (!comentario.id || comentarioCurtindoId) return;
    const curtiu = comentario.curtidas.includes(userId);
    setComentarioCurtindoId(comentario.id);

    try {
      if (curtiu) {
        const { error } = await supabase
          .from("diario_comentario_curtidas")
          .delete()
          .eq("comentario_id", comentario.id)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("diario_comentario_curtidas")
          .insert({ comentario_id: comentario.id, user_id: userId });
        if (error) throw error;
      }

      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        comentarios: atual.comentarios.map((itemComentario) =>
          itemComentario.id === comentario.id
            ? {
                ...itemComentario,
                curtidas: curtiu
                  ? itemComentario.curtidas.filter((id) => id !== userId)
                  : Array.from(new Set([...itemComentario.curtidas, userId])),
              }
            : itemComentario,
        ),
        erro: "",
      }));
    } catch (error) {
      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        erro: obterMensagemErroListas(
          error,
          "Não foi possível atualizar a curtida do comentário.",
        ),
      }));
    } finally {
      setComentarioCurtindoId("");
    }
  }

  async function enviarComentarioAnotacaoListas(item: ItemObraLista) {
    const anotacaoId = item.anotacaoId?.trim() || "";
    const userId = usuarioAtualId.trim();

    if (!anotacaoId) return;

    const permissoes = obterPermissoesAnotacaoListas(item);

    if (!permissoes.podeComentar) {
      setMensagemAcao("Você não tem permissão para comentar nesta anotação.");
      return;
    }

    if (!userId) {
      router.push(criarLoginHrefListas());
      return;
    }

    const interacao =
      interacoesAnotacoes[anotacaoId] || criarInteracaoAnotacaoListasVazia();
    const textoComentario = interacao.novoComentario.trim();

    if (!textoComentario) {
      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        erro: "Escreva um comentário antes de enviar.",
      }));
      return;
    }

    if (interacao.enviandoComentario) return;

    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      enviandoComentario: true,
      erro: "",
    }));

    try {
      const { data, error } = await supabase
        .from("diario_anotacao_comentarios")
        .insert({
          anotacao_id: anotacaoId,
          user_id: userId,
          texto: textoComentario.slice(0, DIARIO_COMENTARIO_MAX_LENGTH),
          parent_id: interacao.respondendoComentarioId || null,
        })
        .select(
          "id,anotacao_id,user_id,texto,parent_id,criado_em,atualizado_em",
        )
        .maybeSingle();

      if (error) throw error;

      const registro = data as unknown as RegistroGenerico | null;
      const comentario: ComentarioAnotacaoListas = {
        id: pegarTexto(registro?.id),
        anotacaoId,
        userId,
        autorNome: usuarioAtualPerfil?.nome || "Você",
        autorUsername: usuarioAtualPerfil?.username || "",
        autorAvatar: usuarioAtualPerfil?.avatar || "",
        texto: pegarTexto(registro?.texto, textoComentario),
        criadoEm: pegarTexto(registro?.criado_em, new Date().toISOString()),
        atualizadoEm: pegarTexto(
          registro?.atualizado_em ?? registro?.criado_em,
          new Date().toISOString(),
        ),
        parentId: pegarTexto(
          registro?.parent_id,
          interacao.respondendoComentarioId,
        ),
        curtidas: [],
      };

      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        comentarios: comentario.id
          ? [...atual.comentarios, comentario]
          : atual.comentarios,
        novoComentario: "",
        respondendoComentarioId: "",
        respondendoAutorNome: "",
        enviandoComentario: false,
      }));

      if (comentario.parentId) {
        setRespostasVisiveisComentariosDiario((atuais) => ({
          ...atuais,
          [comentario.parentId]: Math.max(
            5,
            atuais[comentario.parentId] || 0,
          ),
        }));
      }
    } catch (error) {
      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        enviandoComentario: false,
        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível enviar o comentário.",
      }));
    }
  }

  async function removerComentarioAnotacaoListas(
    item: ItemObraLista,
    comentario: ComentarioAnotacaoListas,
  ) {
    const anotacaoId = item.anotacaoId?.trim() || "";

    if (
      !anotacaoId ||
      !comentario.id ||
      comentario.userId !== usuarioAtualId ||
      !window.confirm("Remover este comentário?")
    ) {
      return;
    }

    setComentarioRemovendoId(comentario.id);

    try {
      const { error } = await supabase
        .from("diario_anotacao_comentarios")
        .delete()
        .eq("id", comentario.id)
        .eq("user_id", usuarioAtualId);

      if (error) throw error;

      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        comentarios: atual.comentarios.filter(
          (itemComentario) =>
            itemComentario.id !== comentario.id &&
            itemComentario.parentId !== comentario.id,
        ),
        respondendoComentarioId:
          atual.respondendoComentarioId === comentario.id
            ? ""
            : atual.respondendoComentarioId,
        respondendoAutorNome:
          atual.respondendoComentarioId === comentario.id
            ? ""
            : atual.respondendoAutorNome,
        erro: "",
      }));
    } catch (error) {
      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        erro: obterMensagemErroListas(
          error,
          "Não foi possível remover o comentário.",
        ),
      }));
    } finally {
      setComentarioRemovendoId("");
    }
  }

  function atualizarAvaliacaoNosItensListas(
    obra: ObraLista,
    nota: number,
    data: string,
  ) {
    setListasPerfil((estadoAtual) => {
      const categoriasSemTudo = [
        "lendo",
        "quero-ler",
        "favoritas",
        "concluidas",
        "historico",
      ] as CategoriaPerfil[];
      const proximo = { ...estadoAtual };

      categoriasSemTudo.forEach((categoriaEstado) => {
        proximo[categoriaEstado] = proximo[categoriaEstado].map((item) =>
          item.obra.id === obra.id ? { ...item, nota } : item,
        );
      });

      const avaliacaoExistente = estadoAtual.avaliacoes.find(
        (item) => item.obra.id === obra.id,
      );
      proximo.avaliacoes = nota > 0
        ? ordenarPorData([
            ...estadoAtual.avaliacoes.filter((item) => item.obra.id !== obra.id),
            {
              ...(avaliacaoExistente ||
                criarItemPerfil("avaliacoes", obra, {
                  obra_id: obra.id,
                  atualizado_em: data,
                })),
              nota,
              data,
            },
          ])
        : estadoAtual.avaliacoes.filter((item) => item.obra.id !== obra.id);
      proximo.tudo = mesclarTudoPerfil([
        proximo.lendo,
        proximo["quero-ler"],
        proximo.favoritas,
        proximo.concluidas,
        proximo.avaliacoes,
        proximo.historico,
      ]).map((item) => (item.obra.id === obra.id ? { ...item, nota } : item));

      return proximo;
    });

    setItemPerfilMenuAberto((itemAtual) =>
      itemAtual?.obra.id === obra.id ? { ...itemAtual, nota, data } : itemAtual,
    );
  }

  async function salvarAvaliacaoListas(novaNota: number) {
    const obra = obraMenuAberta;
    const userId = usuarioAtualId.trim();

    const autorId = obra?.autorId.trim() || "";

    if (
      !obra ||
      !perfilEhProprio ||
      !userId ||
      avaliacaoSalvando ||
      (autorId && autorId === userId)
    ) {
      return;
    }

    const nota =
      novaNota <= 0
        ? 0
        : Math.max(0.5, Math.min(5, Math.round(novaNota * 2) / 2));
    setAvaliacaoSalvando(true);
    setAvaliacaoErro("");

    try {
      await salvarAvaliacaoRemotaListas({ obraId: obra.id, userId, nota });
      await sincronizarAtividadeAvaliacaoListas(userId, obra, nota);
      const data = new Date().toISOString();
      atualizarAvaliacaoNosItensListas(obra, nota, data);
      setMensagemAcao(nota > 0 ? "Avaliação salva." : "Avaliação removida.");
    } catch (error) {
      setAvaliacaoErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a avaliação.",
      );
    } finally {
      setAvaliacaoSalvando(false);
    }
  }

  function abrirComentariosDiario(item: ItemObraLista) {
    const anotacaoId = item.anotacaoId?.trim() || "";

    if (!anotacaoId) {
      return;
    }

    const permissoes = obterPermissoesAnotacaoListas(item);

    if (!permissoes.podeVerComentarios) {
      setMensagemAcao("Os comentários desta anotação não estão disponíveis.");
      return;
    }

    comentariosDragOffsetYRef.current = 0;
    comentariosDragIgnorarCliqueRef.current = false;
    setComentariosDiarioItem(item);
    setComentariosDiarioExpandido(false);
    setMenuOrdenacaoComentariosDiarioAberto(false);
    setRespostasVisiveisComentariosDiario({});
  }

  function fecharComentariosDiario() {
    setComentariosDiarioItem(null);
    setComentariosDiarioExpandido(false);
    setMenuOrdenacaoComentariosDiarioAberto(false);
    comentariosDragOffsetYRef.current = 0;
  }

  function iniciarArrasteComentariosDiario(
    event: TouchEvent<HTMLDivElement>,
  ) {
    if (isDesktop) {
      return;
    }

    comentariosDragStartYRef.current = event.touches[0]?.clientY || 0;
    comentariosDragOffsetYRef.current = 0;
    comentariosDragIgnorarCliqueRef.current = false;

    if (comentariosDragResetTimerRef.current !== null) {
      window.clearTimeout(comentariosDragResetTimerRef.current);
      comentariosDragResetTimerRef.current = null;
    }

    if (comentariosSheetRef.current) {
      comentariosSheetRef.current.style.transition = "none";
    }
  }

  function moverArrasteComentariosDiario(
    event: TouchEvent<HTMLDivElement>,
  ) {
    if (isDesktop) {
      return;
    }

    const posicaoAtual =
      event.touches[0]?.clientY || comentariosDragStartYRef.current;
    const limiteSuperior = comentariosDiarioExpandido ? -46 : -58;
    const limiteInferior = comentariosDiarioExpandido ? 112 : 132;
    const deslocamento = Math.max(
      limiteSuperior,
      Math.min(
        limiteInferior,
        posicaoAtual - comentariosDragStartYRef.current,
      ),
    );

    comentariosDragOffsetYRef.current = deslocamento;

    if (Math.abs(deslocamento) > 6) {
      comentariosDragIgnorarCliqueRef.current = true;
    }

    const handle = comentariosSheetRef.current?.querySelector(
      "[data-comments-sheet-handle='true']",
    ) as HTMLElement | null;

    if (handle) {
      handle.style.transform = `translate3d(0, ${deslocamento}px, 0)`;
    }
  }

  function finalizarArrasteComentariosDiario() {
    if (isDesktop) {
      return;
    }

    const deslocamento = comentariosDragOffsetYRef.current;

    if (comentariosSheetRef.current) {
      comentariosSheetRef.current.style.transition = "height 220ms ease";
    }

    const handle = comentariosSheetRef.current?.querySelector(
      "[data-comments-sheet-handle='true']",
    ) as HTMLElement | null;

    if (handle) {
      handle.style.transition = "transform 160ms ease";
      handle.style.transform = "";
    }

    if (comentariosDragIgnorarCliqueRef.current) {
      comentariosDragResetTimerRef.current = window.setTimeout(() => {
        comentariosDragIgnorarCliqueRef.current = false;
        comentariosDragResetTimerRef.current = null;
      }, 350);
    }

    if (deslocamento < -34) {
      setComentariosDiarioExpandido(true);
      return;
    }

    if (deslocamento > 52 && comentariosDiarioExpandido) {
      setComentariosDiarioExpandido(false);
      return;
    }

    if (deslocamento > 118 && !comentariosDiarioExpandido) {
      fecharComentariosDiario();
    }
  }

  function alternarExpansaoComentariosDiario() {
    if (isDesktop || comentariosDragIgnorarCliqueRef.current) {
      return;
    }

    setComentariosDiarioExpandido((expandido) => !expandido);
  }

  function inserirNoComentarioDiario(texto: string) {
    const anotacaoId = comentariosDiarioItem?.anotacaoId?.trim() || "";

    if (!anotacaoId) {
      return;
    }

    const interacao =
      interacoesAnotacoes[anotacaoId] || criarInteracaoAnotacaoListasVazia();
    const separador = interacao.novoComentario && texto !== "@" ? " " : "";

    atualizarComentarioAnotacaoListas(
      anotacaoId,
      `${interacao.novoComentario}${separador}${texto}`,
    );
  }

  function renderizarItemObra(
    item: ItemObraLista,
    categoriaAtual: CategoriaPerfil,
  ) {
    const obra = item.obra;
    const detalheVisivel =
      categoriaAtual === "avaliacoes"
        ? renderizarEstrelasAvaliacao(item.nota, item.data)
        : categoriaAtual === "tudo"
          ? formatarLeituraMesAno(item.ultimaLeituraEm || "")
          : textoSecundarioItem(item, categoriaAtual);
    const anotacaoId = item.anotacaoId?.trim() || "";
    const chaveAnotacao = anotacaoId || obra.id;
    const anotacaoAberta = Boolean(anotacoesAbertas[chaveAnotacao]);
    const spoilerRevelado = Boolean(
      anotacoesSpoilerReveladas[chaveAnotacao],
    );

    function alternarExibicaoAnotacao() {
      const proximoEstado = !anotacaoAberta;

      setAnotacoesAbertas((atuais) => ({
        ...atuais,
        [chaveAnotacao]: proximoEstado,
      }));

      if (!proximoEstado) {
        setAnotacoesSpoilerReveladas((atuais) => ({
          ...atuais,
          [chaveAnotacao]: false,
        }));
      }
    }
    const interacao = anotacaoId
      ? interacoesAnotacoes[anotacaoId] ||
        criarInteracaoAnotacaoListasVazia()
      : criarInteracaoAnotacaoListasVazia();
    const permissoesAnotacao = obterPermissoesAnotacaoListas(item);
    return (
      <article
        key={item.chave}
        id={`lista-obra-${obra.id}`}
        className={`historietas-list-row${
          obraDestacadaId === obra.id ? " historietas-list-row-highlight" : ""
        }`}
      >
        <Link href={obra.link} style={rowMainLinkStyle}>
          <span style={criarCapaStyle(obra.capa)} aria-hidden="true" />

          <span style={rowTextStyle}>
            <strong data-historietas-user-content="true" style={rowTitleStyle}>
              {obra.titulo}
            </strong>
            <span data-historietas-user-content="true" style={rowMetaStyle}>
              {obra.autor} • {obra.genero}
            </span>

            {detalheVisivel && (
              <span style={rowDetailStyle}>{detalheVisivel}</span>
            )}

            {(item.anotacao ||
              (item.nota > 0 && categoriaAtual !== "avaliacoes")) && (
              <span style={rowSignalsStyle}>
                {item.nota > 0 && categoriaAtual !== "avaliacoes" && (
                  <span style={rowRatingSignalStyle}>
                    <span style={rowRatingSignalStarStyle} aria-hidden="true">
                      ★
                    </span>
                    <span>{formatarNotaListas(item.nota)}</span>
                  </span>
                )}
                {item.anotacao && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-expanded={anotacaoAberta}
                    aria-controls={`anotacao-${obra.id}`}
                    aria-label={
                      anotacaoAberta
                        ? `Ocultar anotação de ${obra.titulo}`
                        : `Mostrar anotação de ${obra.titulo}`
                    }
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      alternarExibicaoAnotacao();
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") {
                        return;
                      }

                      event.preventDefault();
                      event.stopPropagation();
                      alternarExibicaoAnotacao();
                    }}
                    style={{
                      ...rowSignalAnnotationToggleStyle,
                      background: anotacaoAberta
                        ? "rgba(255,255,255,0.16)"
                        : rowSignalStyle.background,
                      color: anotacaoAberta
                        ? "#FFFFFF"
                        : rowSignalStyle.color,
                    }}
                  >
                    ✎ Anotação
                  </span>
                )}
              </span>
            )}
          </span>
        </Link>

        <button
          type="button"
          onClick={() => void abrirMenuObra(obra, item, categoriaAtual)}
          style={rowOptionsButtonStyle}
          aria-label={`Abrir opções de ${obra.titulo}`}
        >
          <span aria-hidden="true" style={moreOptionsStyle}>
            <span style={moreDotStyle} />
            <span style={moreDotStyle} />
            <span style={moreDotStyle} />
          </span>
        </button>

        {item.anotacao && anotacaoAberta && (
          <div
            id={`anotacao-${obra.id}`}
            className="historietas-list-annotation"
            style={listDiaryCardAnnotationStyle}
          >
            <div style={listDiaryCardAnnotationHeaderStyle}>
              <div style={listDiaryCardAnnotationTitleGroupStyle}>
                <strong style={listDiaryCardAnnotationTitleStyle}>
                  Anotação de {perfil?.nome || "usuário"}
                </strong>
              </div>

              <div style={listDiaryCardAnnotationHeaderActionsStyle}>
                {anotacaoId && permissoesAnotacao.podeCurtirAnotacao && (
                  <button
                    type="button"
                    onClick={() => void alternarCurtidaAnotacaoListas(item)}
                    disabled={interacao.salvandoCurtida}
                    style={{
                      ...listDiaryCardAnnotationLikeButtonStyle,
                      opacity: interacao.salvandoCurtida ? 0.58 : 1,
                      cursor: interacao.salvandoCurtida
                        ? "not-allowed"
                        : "pointer",
                    }}
                    aria-label={`${
                      interacao.curtiu
                        ? "Remover curtida da anotação"
                        : "Curtir anotação"
                    }. ${compactarNumero(interacao.totalCurtidas)} ${
                      interacao.totalCurtidas === 1 ? "curtida" : "curtidas"
                    }`}
                    aria-pressed={interacao.curtiu}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      style={{
                        ...listDiaryCardAnnotationLikeIconStyle,
                        animation: interacao.curtiu
                          ? "historietas-list-heart-pop 260ms ease-out"
                          : "none",
                      }}
                    >
                      <path
                        d="M20.7 5.3c-1.8-1.9-4.7-1.9-6.5 0L12 7.6 9.8 5.3c-1.8-1.9-4.7-1.9-6.5 0-1.8 1.9-1.8 5 0 6.9L12 21l8.7-8.8c1.8-1.9 1.8-5 0-6.9Z"
                        fill={
                          interacao.curtiu
                            ? "var(--historietas-list-like-active, #EF4444)"
                            : "none"
                        }
                        stroke={
                          interacao.curtiu
                            ? "var(--historietas-list-like-active, #EF4444)"
                            : "#FFFFFF"
                        }
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span style={listDiaryCardAnnotationLikeCountStyle}>
                      {compactarNumero(interacao.totalCurtidas)}
                    </span>
                  </button>
                )}

                {anotacaoId && permissoesAnotacao.podeVerComentarios && (
                  <button
                    type="button"
                    onClick={() => abrirComentariosDiario(item)}
                    style={listDiaryCardAnnotationCommentButtonStyle}
                    aria-label={`Abrir ${interacao.comentarios.length} ${
                      interacao.comentarios.length === 1
                        ? "comentário"
                        : "comentários"
                    } da anotação`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      style={listDiaryCardAnnotationCommentIconStyle}
                    >
                      <path
                        d="M5 5.75h14a2.25 2.25 0 0 1 2.25 2.25v6A2.25 2.25 0 0 1 19 16.25h-6.2L8 20v-3.75H5A2.25 2.25 0 0 1 2.75 14V8A2.25 2.25 0 0 1 5 5.75Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span style={listDiaryCardAnnotationCommentCountStyle}>
                      {compactarNumero(interacao.comentarios.length)}
                    </span>
                  </button>
                )}

              </div>
            </div>

            {item.anotacaoSpoiler && !spoilerRevelado ? (
              <div style={listDiaryCardSpoilerStyle}>
                <span style={listDiaryCardSpoilerTextStyle}>
                  Esta anotação contém spoiler
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setAnotacoesSpoilerReveladas((atuais) => ({
                      ...atuais,
                      [chaveAnotacao]: true,
                    }))
                  }
                  style={listDiaryCardSpoilerButtonStyle}
                >
                  Revelar
                </button>
              </div>
            ) : (
              <>
                <p
                  data-historietas-user-content="true"
                  style={listDiaryCardAnnotationTextStyle}
                >
                  {item.anotacao}
                </p>

                {item.anotacaoSpoiler && (
                  <button
                    type="button"
                    onClick={() =>
                      setAnotacoesSpoilerReveladas((atuais) => ({
                        ...atuais,
                        [chaveAnotacao]: false,
                      }))
                    }
                    style={listDiaryCardSpoilerButtonStyle}
                  >
                    Ocultar
                  </button>
                )}
              </>
            )}

          </div>
        )}
      </article>
    );
  }


  function renderizarComentariosDiarioSheet() {
    const item = comentariosDiarioItem;

    if (!item || typeof document === "undefined") {
      return null;
    }

    const itemSelecionado = item;
    const anotacaoId = itemSelecionado.anotacaoId?.trim() || "";

    if (!anotacaoId) {
      return null;
    }

    const interacao =
      interacoesAnotacoes[anotacaoId] || criarInteracaoAnotacaoListasVazia();
    const permissoes = obterPermissoesAnotacaoListas(itemSelecionado);
    const comentariosRaiz = ordenarComentariosRaizDiarioListas(
      interacao.comentarios,
      interacao.ordenacaoComentarios,
    );

    function renderizarComentarioSheet(
      comentario: ComentarioAnotacaoListas,
      resposta = false,
    ) {
      const comentarioEhProprio =
        Boolean(usuarioAtualId) && comentario.userId === usuarioAtualId;
      const comentarioCurtiu = Boolean(
        usuarioAtualId && comentario.curtidas.includes(usuarioAtualId),
      );
      const hrefPerfil = idUsuarioValido(comentario.userId)
        ? `/perfil-autor?autorId=${encodeURIComponent(comentario.userId)}`
        : "/perfil-autor";
      const carregandoCurtida = comentarioCurtindoId === comentario.id;
      const removendoComentario = comentarioRemovendoId === comentario.id;
      const avatarStyle = resposta
        ? commentReplyAvatarLinkStyle
        : commentAvatarLinkStyle;

      return (
        <article
          key={comentario.id}
          style={resposta ? commentReplyItemStyle : commentItemStyle}
        >
          <Link
            href={hrefPerfil}
            aria-label={`Abrir perfil de ${comentario.autorNome}`}
            style={criarAvatarComentarioDiarioListasStyle(
              avatarStyle,
              comentario.autorAvatar,
            )}
          >
            {!comentario.autorAvatar &&
              (comentario.autorNome.slice(0, 1).toUpperCase() || "U")}
          </Link>

          <div style={commentContentStyle}>
            <div style={commentTopLineStyle}>
              <Link href={hrefPerfil} style={commentAuthorLinkStyle}>
                <span data-historietas-i18n-ignore="true">
                  {comentario.autorNome}
                </span>
              </Link>
              <span style={commentTimeStyle}>
                {formatarDataCurta(comentario.criadoEm)}
              </span>
            </div>

            <p data-historietas-user-content="true" style={commentTextStyle}>
              {comentario.texto}
            </p>

            <div style={commentActionsRowStyle}>
              <button
                type="button"
                onClick={() =>
                  iniciarRespostaComentarioAnotacaoListas(
                    anotacaoId,
                    comentario,
                  )
                }
                disabled={!permissoes.podeComentar}
                style={{
                  ...commentReplyButtonStyle,
                  opacity: permissoes.podeComentar ? 1 : 0.52,
                  cursor: permissoes.podeComentar
                    ? "pointer"
                    : "not-allowed",
                }}
              >
                Responder
              </button>

              {comentarioEhProprio ? (
                <button
                  type="button"
                  onClick={() =>
                    void removerComentarioAnotacaoListas(itemSelecionado, comentario)
                  }
                  disabled={removendoComentario}
                  style={{
                    ...commentRemoveButtonStyle,
                    opacity: removendoComentario ? 0.58 : 1,
                    cursor: removendoComentario ? "not-allowed" : "pointer",
                  }}
                >
                  {removendoComentario ? "Removendo..." : "Remover"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    abrirDenunciaDiario(
                      "comentario_diario",
                      comentario.id,
                      `Comentário de ${comentario.autorNome} em ${itemSelecionado.obra.titulo}`,
                      comentario.userId,
                    )
                  }
                  style={commentReportButtonStyle}
                >
                  Denunciar
                </button>
              )}
            </div>
          </div>

          <div style={commentLikeWrapStyle}>
            <button
              type="button"
              aria-pressed={comentarioCurtiu}
              aria-label={`${
                comentarioCurtiu
                  ? "Remover curtida do comentário"
                  : "Curtir comentário"
              }. ${comentario.curtidas.length} ${
                comentario.curtidas.length === 1 ? "curtida" : "curtidas"
              }`}
              onClick={() =>
                void alternarCurtidaComentarioAnotacaoListas(
                  anotacaoId,
                  comentario,
                )
              }
              disabled={carregandoCurtida}
              style={{
                ...commentLikeButtonStyle,
                opacity: carregandoCurtida ? 0.58 : 1,
                cursor: carregandoCurtida ? "not-allowed" : "pointer",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{
                  ...commentHeartIconStyle,
                  animation: comentarioCurtiu
                    ? "historietas-list-heart-pop 260ms ease-out"
                    : "none",
                }}
              >
                <path
                  d="M20.7 5.3c-1.8-1.9-4.7-1.9-6.5 0L12 7.6 9.8 5.3c-1.8-1.9-4.7-1.9-6.5 0-1.8 1.9-1.8 5 0 6.9L12 21l8.7-8.8c1.8-1.9 1.8-5 0-6.9Z"
                  fill={comentarioCurtiu ? "#EF4444" : "none"}
                  stroke={comentarioCurtiu ? "#EF4444" : "#FFFFFF"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <span style={commentLikeCountStyle}>
              {comentario.curtidas.length}
            </span>
          </div>
        </article>
      );
    }

    return createPortal(
      <section style={commentsSheetOverlayStyle} aria-label="Comentários">
        <button
          type="button"
          aria-label="Fechar comentários"
          onClick={fecharComentariosDiario}
          style={commentsSheetBackdropStyle}
        />

        <article
          ref={comentariosSheetRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Comentários de ${itemSelecionado.obra.titulo}`}
          style={
            isDesktop
              ? desktopCommentsSheetStyle
              : {
                  ...commentsSheetStyle,
                  ...(comentariosDiarioExpandido
                    ? commentsSheetExpandedStyle
                    : commentsSheetCompactStyle),
                }
          }
        >
          <div
            data-comments-sheet-handle="true"
            style={commentsSheetHandleWrapStyle}
            onClick={alternarExpansaoComentariosDiario}
            onTouchStart={iniciarArrasteComentariosDiario}
            onTouchMove={moverArrasteComentariosDiario}
            onTouchEnd={finalizarArrasteComentariosDiario}
            onTouchCancel={finalizarArrasteComentariosDiario}
            role="button"
            tabIndex={0}
            aria-label={
              comentariosDiarioExpandido
                ? "Recolher comentários"
                : "Expandir comentários"
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                alternarExpansaoComentariosDiario();
              }
            }}
          >
            <div style={commentsSheetHandleStyle} />
          </div>

          <header style={commentsSheetHeaderStyle}>
            <span style={commentsSheetHeaderSpacerStyle} aria-hidden="true" />

            <strong style={commentsSheetTitleStyle}>
              {interacao.comentarios.length === 1
                ? "1 comentário"
                : `${interacao.comentarios.length} comentários`}
            </strong>

            <div style={commentsSortMenuWrapStyle}>
              <button
                type="button"
                onClick={() =>
                  setMenuOrdenacaoComentariosDiarioAberto((aberto) => !aberto)
                }
                style={commentsSortMenuTriggerStyle}
                aria-label="Ordenar comentários"
                aria-haspopup="menu"
                aria-expanded={menuOrdenacaoComentariosDiarioAberto}
              >
                +
              </button>

              {menuOrdenacaoComentariosDiarioAberto ? (
                <div style={commentsSortMenuStyle} role="menu">
                  <button
                    type="button"
                    onClick={() => {
                      alterarOrdenacaoComentariosAnotacaoListas(
                        anotacaoId,
                        "relevantes",
                      );
                      setMenuOrdenacaoComentariosDiarioAberto(false);
                    }}
                    style={
                      interacao.ordenacaoComentarios === "relevantes"
                        ? commentsSortMenuItemActiveStyle
                        : commentsSortMenuItemStyle
                    }
                    role="menuitem"
                  >
                    Relevantes
                  </button>

                  <div style={commentsSortMenuDividerStyle} aria-hidden="true" />

                  <button
                    type="button"
                    onClick={() => {
                      alterarOrdenacaoComentariosAnotacaoListas(
                        anotacaoId,
                        "recentes",
                      );
                      setMenuOrdenacaoComentariosDiarioAberto(false);
                    }}
                    style={
                      interacao.ordenacaoComentarios === "recentes"
                        ? commentsSortMenuItemActiveStyle
                        : commentsSortMenuItemStyle
                    }
                    role="menuitem"
                  >
                    Recentes
                  </button>
                </div>
              ) : null}
            </div>
          </header>

          <section style={commentsSheetListStyle}>
            {comentariosRaiz.length > 0 ? (
              comentariosRaiz.map((comentario) => {
                const respostas = obterRespostasComentarioDiarioListas(
                  interacao.comentarios,
                  comentario.id,
                );
                const quantidadeVisivel = Math.min(
                  respostas.length,
                  respostasVisiveisComentariosDiario[comentario.id] || 0,
                );
                const respostasVisiveis = respostas.slice(0, quantidadeVisivel);
                const respostasOcultas = Math.max(
                  0,
                  respostas.length - quantidadeVisivel,
                );
                const respostasExpandidas = quantidadeVisivel > 0;

                return (
                  <section key={comentario.id} style={commentThreadStyle}>
                    {renderizarComentarioSheet(comentario)}

                    {respostasVisiveis.length > 0 ? (
                      <div style={commentRepliesListStyle}>
                        {respostasVisiveis.map((resposta) =>
                          renderizarComentarioSheet(resposta, true),
                        )}
                      </div>
                    ) : null}

                    {respostas.length > 0 && !respostasExpandidas ? (
                      <button
                        type="button"
                        onClick={() =>
                          setRespostasVisiveisComentariosDiario((atuais) => ({
                            ...atuais,
                            [comentario.id]: Math.min(5, respostas.length),
                          }))
                        }
                        style={commentRepliesToggleStyle}
                      >
                        <span style={commentRepliesLineStyle} />
                        {`Ver ${respostas.length} ${
                          respostas.length === 1 ? "resposta" : "respostas"
                        }`}
                      </button>
                    ) : null}

                    {respostasExpandidas ? (
                      <div style={commentRepliesControlsStyle}>
                        {respostasOcultas > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setRespostasVisiveisComentariosDiario((atuais) => ({
                                ...atuais,
                                [comentario.id]: Math.min(
                                  respostas.length,
                                  (atuais[comentario.id] || 0) + 5,
                                ),
                              }))
                            }
                            style={commentRepliesToggleStyle}
                          >
                            <span style={commentRepliesLineStyle} />
                            {`Ver mais ${respostasOcultas} ${
                              respostasOcultas === 1 ? "resposta" : "respostas"
                            }`}
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() =>
                            setRespostasVisiveisComentariosDiario((atuais) => ({
                              ...atuais,
                              [comentario.id]: 0,
                            }))
                          }
                          style={commentRepliesHideButtonStyle}
                        >
                          Ocultar respostas
                        </button>
                      </div>
                    ) : null}
                  </section>
                );
              })
            ) : interacao.carregando ? (
              <div style={commentsLoadingStyle}>Carregando comentários...</div>
            ) : (
              <p style={emptyCommentsStyle}>Sem comentários ainda</p>
            )}
          </section>

          {interacao.erro ? (
            <span style={commentsSheetErrorStyle}>{interacao.erro}</span>
          ) : null}

          {interacao.respondendoComentarioId ? (
            <div style={commentsReplyingBannerStyle}>
              <span>
                Respondendo a {interacao.respondendoAutorNome || "usuário"}
              </span>
              <button
                type="button"
                onClick={() =>
                  cancelarRespostaComentarioAnotacaoListas(anotacaoId)
                }
                style={commentsReplyingCancelStyle}
              >
                Cancelar
              </button>
            </div>
          ) : null}

          <section style={commentsToolsStyle}>
            <div style={commentsQuickReactionsStyle}>
              {["💜", "🔥", "😂", "😮", "😭", "👏"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => inserirNoComentarioDiario(emoji)}
                  disabled={!permissoes.podeComentar}
                  style={commentsQuickReactionButtonStyle}
                  aria-label={`Adicionar ${emoji} ao comentário`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </section>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void enviarComentarioAnotacaoListas(itemSelecionado);
            }}
            style={commentsSheetFormStyle}
          >
            <div
              style={criarAvatarComentarioDiarioListasStyle(
                commentsInputAvatarStyle,
                permissoes.podeComentar
                  ? usuarioAtualPerfil?.avatar || ""
                  : "",
              )}
            >
              {!(permissoes.podeComentar && usuarioAtualPerfil?.avatar) &&
                (permissoes.podeComentar
                  ? usuarioAtualPerfil?.nome || "U"
                  : "H"
                )
                  .slice(0, 1)
                  .toUpperCase()}
            </div>

            <div style={commentsInputBoxStyle}>
              <textarea
                aria-label={
                  permissoes.podeComentar
                    ? interacao.respondendoComentarioId
                      ? "Adicionar resposta"
                      : "Adicionar comentário"
                    : "Comentários limitados pelo dono do Diário"
                }
                value={interacao.novoComentario}
                onChange={(event) =>
                  atualizarComentarioAnotacaoListas(
                    anotacaoId,
                    event.target.value,
                  )
                }
                placeholder={
                  permissoes.podeComentar
                    ? interacao.respondendoComentarioId
                      ? "Adicionar resposta..."
                      : "Adicionar comentário..."
                    : "Comentários limitados pelo dono do Diário."
                }
                disabled={!permissoes.podeComentar || interacao.enviandoComentario}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                inputMode="text"
                enterKeyHint="send"
                maxLength={DIARIO_COMENTARIO_MAX_LENGTH}
                rows={1}
                style={commentsSheetInputStyle}
              />
            </div>

            <button
              type="button"
              onClick={() => inserirNoComentarioDiario("@")}
              disabled={!permissoes.podeComentar}
              style={commentsInputIconButtonStyle}
              aria-label="Adicionar menção"
            >
              @
            </button>

            <button
              type="submit"
              aria-label="Enviar comentário"
              disabled={
                !permissoes.podeComentar ||
                interacao.enviandoComentario ||
                !interacao.novoComentario.trim()
              }
              style={{
                ...commentsSheetSendStyle,
                opacity:
                  permissoes.podeComentar &&
                  !interacao.enviandoComentario &&
                  interacao.novoComentario.trim()
                    ? 1
                    : 0.58,
                cursor:
                  permissoes.podeComentar &&
                  !interacao.enviandoComentario &&
                  interacao.novoComentario.trim()
                    ? "pointer"
                    : "not-allowed",
              }}
            >
              {interacao.enviandoComentario ? "…" : "↑"}
            </button>
          </form>
        </article>
      </section>,
      document.body,
    );
  }

  function renderizarObraPublica(obra: ObraLista) {
    return (
      <article key={obra.id} className="historietas-list-row">
        <Link href={obra.link} style={rowMainLinkStyle}>
          <span style={criarCapaStyle(obra.capa)} aria-hidden="true" />

          <span style={rowTextStyle}>
            <strong data-historietas-user-content="true" style={rowTitleStyle}>
              {obra.titulo}
            </strong>
            <span data-historietas-user-content="true" style={rowMetaStyle}>
              {obra.genero}
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => void abrirMenuObra(obra, null, "tudo")}
          style={rowOptionsButtonStyle}
          aria-label={`Abrir opções de ${obra.titulo}`}
        >
          <span aria-hidden="true" style={moreOptionsStyle}>
            <span style={moreDotStyle} />
            <span style={moreDotStyle} />
            <span style={moreDotStyle} />
          </span>
        </button>
      </article>
    );
  }

  function renderizarAutor(autor: AutorLista) {
    const href = idUsuarioValido(autor.id)
      ? `/perfil-autor?autorId=${encodeURIComponent(autor.id)}`
      : `/perfil-autor?autor=${encodeURIComponent(autor.nome)}`;

    return (
      <article key={autor.id || autor.nome} className="historietas-list-row">
        <Link href={href} style={rowAuthorLinkStyle}>
          <span style={criarAvatarStyle(autor.avatar)} aria-hidden="true">
            {!autor.avatar ? autor.nome.slice(0, 1).toLocaleUpperCase("pt-BR") : ""}
          </span>

          <span style={rowTextStyle}>
            <strong data-historietas-user-content="true" style={rowTitleStyle}>
              {autor.nome}
            </strong>
            <span data-historietas-user-content="true" style={rowMetaStyle}>
              {autor.username ? `@${autor.username} • ` : ""}
              {autor.totalObras} {autor.totalObras === 1 ? "obra" : "obras"}
            </span>
          </span>
        </Link>
      </article>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${listasPageCss}`}</style>


      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          {modo === "perfil" && origemPerfil === "diario" && perfil ? (
            <div style={listDiaryProfileHeaderStyle}>
              <div style={listDiaryProfileHeaderTopStyle}>
                <span
                  aria-hidden="true"
                  style={criarAvatarPerfilDiarioListasStyle(perfil.avatar)}
                >
                  {!perfil.avatar
                    ? perfil.nome.slice(0, 1).toLocaleUpperCase("pt-BR") || "U"
                    : ""}
                </span>

                <div style={listDiaryProfileTitleAreaStyle}>
                  <h1
                    data-historietas-user-content="true"
                    style={listDiaryProfileTitleStyle}
                  >
                    {tituloPagina}
                  </h1>
                </div>

                {(perfilEhProprio || avaliacaoDiario.visivel) && (
                  <div style={listDiaryRatingSummaryStyle}>
                    <strong style={listDiaryRatingNumberStyle}>
                      {formatarNotaListas(avaliacaoDiario.media)}
                    </strong>
                    <span
                      style={listDiaryRatingSummaryStarsStyle}
                      aria-label={`Média ${formatarNotaListas(
                        avaliacaoDiario.media,
                      )} de 5`}
                    >
                      {NOTAS_AVALIACAO_LISTAS.map((estrela) => (
                        <span
                          key={`media-diario-${estrela}`}
                          style={listDiaryRatingSummaryStarVisualStyle}
                          aria-hidden="true"
                        >
                          <span style={listDiaryRatingSummaryStarBaseStyle}>
                            ★
                          </span>
                          <span
                            style={{
                              ...listDiaryRatingSummaryStarFillStyle,
                              width: obterPreenchimentoEstrelaListas(
                                estrela,
                                avaliacaoDiario.media,
                              ),
                            }}
                          >
                            ★
                          </span>
                        </span>
                      ))}
                    </span>
                    <span style={listDiaryRatingTotalStyle}>
                      {avaliacaoDiario.total} Av. Diário
                    </span>
                  </div>
                )}
              </div>

              {!perfilEhProprio &&
                avaliacaoDiario.visivel &&
                avaliacaoDiario.podeAvaliar && (
                  <div
                    style={listDiaryHeaderRatingBoxStyle}
                    aria-label="Avaliar este Diário"
                  >
                    <div style={listDiaryHeaderRatingStarsRowStyle}>
                      {NOTAS_AVALIACAO_LISTAS.map((estrela) => {
                        const preenchimento = obterPreenchimentoEstrelaListas(
                          estrela,
                          avaliacaoDiario.minhaNota,
                        );
                        const interativa = !avaliacaoDiario.salvando;
                        const proximaNota = obterProximaNotaAvaliacaoListas(
                          estrela,
                          avaliacaoDiario.minhaNota,
                        );

                        return (
                          <button
                            key={`avaliacao-diario-cabecalho-${estrela}`}
                            type="button"
                            onClick={() => {
                              if (!interativa) {
                                return;
                              }

                              void salvarAvaliacaoDiarioPerfil(proximaNota);
                            }}
                            disabled={!interativa}
                            style={{
                              ...(preenchimento === "0%"
                                ? listDiaryHeaderRatingStarButtonStyle
                                : listDiaryHeaderRatingStarActiveStyle),
                              cursor: interativa ? "pointer" : "default",
                              opacity: avaliacaoDiario.salvando ? 0.58 : 1,
                            }}
                            aria-label={`Avaliar Diário com ${proximaNota
                              .toString()
                              .replace(".", ",")} estrela${
                              proximaNota === 1 ? "" : "s"
                            }`}
                          >
                            <span
                              style={listDiaryHeaderRatingStarVisualStyle}
                              aria-hidden="true"
                            >
                              <span style={listDiaryHeaderRatingStarBaseStyle}>
                                ★
                              </span>
                              <span
                                style={{
                                  ...listDiaryHeaderRatingStarFillStyle,
                                  width: preenchimento,
                                }}
                              >
                                ★
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <h1 data-historietas-user-content="true" style={pageTitleStyle}>
              {tituloPagina}
            </h1>
          )}
        </div>
      </header>

      {mensagemAcao && (
        <div role="status" style={actionMessageStyle}>
          {mensagemAcao}
        </div>
      )}

      {modo === "perfil" && !bloqueado && (
        <section
          style={
            isDesktop
              ? origemPerfil === "diario"
                ? desktopListDiaryControlsStyle
                : desktopControlsStyle
              : origemPerfil === "diario"
                ? listDiaryControlsStyle
                : controlsStyle
          }
        >
          <div
            style={isDesktop ? desktopTabsStyle : tabsStyle}
            aria-label="Categorias da lista"
          >
            {CATEGORIAS_PERFIL.map((item) => (
              <button
                key={item.valor}
                type="button"
                onClick={() => trocarCategoria(item.valor)}
                style={
                  categoria === item.valor ? tabActiveStyle : tabStyle
                }
              >
                {item.rotulo}
                <span style={tabCountStyle}>{listasPerfil[item.valor].length}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section
        style={isDesktop ? desktopListSectionStyle : listSectionStyle}
        aria-live="polite"
      >
        {carregando && (
          <div style={stateStyle}>
            <span className="historietas-list-spinner" aria-hidden="true" />
            <strong>Organizando a lista...</strong>
          </div>
        )}

        {!carregando && bloqueado && (
          <div style={stateStyle}>
            <span style={stateIconStyle}>🔒</span>
            <strong>Esta lista é privada</strong>
            <span style={stateTextStyle}>
              O dono do perfil escolheu quem pode visualizar esta seção.
            </span>
            <Link href="/perfil-autor" style={stateLinkStyle}>
              Voltar ao perfil
            </Link>
          </div>
        )}

        {!carregando && erro && !bloqueado && (
          <div style={stateStyle}>
            <span style={stateIconStyle}>!</span>
            <strong>Não foi possível abrir a lista</strong>
            <span style={stateTextStyle}>{erro}</span>
          </div>
        )}

        {!carregando && !bloqueado && !erro && totalResultados === 0 && (
          <div style={stateStyle}>
            <span style={stateIconStyle}>⌕</span>
            <strong>Nenhum item encontrado</strong>
          </div>
        )}

        {!carregando && !bloqueado && !erro && totalResultados > 0 && (
          <>
            {modo === "perfil" &&
              (agruparPorMes
                ? gruposPerfil.map(([mes, itens]) => (
                    <section key={mes} style={monthGroupStyle}>
                      <h2 style={monthTitleStyle}>{mes}</h2>
                      <div
                        style={isDesktop ? desktopWorksRowsStyle : rowsStyle}
                      >
                        {itens.map((item) => renderizarItemObra(item, categoria))}
                      </div>
                    </section>
                  ))
                : (
                    <div
                      style={isDesktop ? desktopWorksRowsStyle : rowsStyle}
                    >
                      {itensPerfilVisiveis.map((item) =>
                        renderizarItemObra(item, categoria),
                      )}
                    </div>
                  ))}

            {modo === "obras" && (
              <div style={isDesktop ? desktopWorksRowsStyle : rowsStyle}>
                {obrasVisiveis.map(renderizarObraPublica)}
              </div>
            )}

            {modo === "autores" && (
              <div style={rowsStyle}>
                {autoresVisiveis.map(renderizarAutor)}
              </div>
            )}

            {quantidadeVisivel < totalResultados && (
              <button
                type="button"
                onClick={() =>
                  setQuantidadeVisivel((quantidade) => quantidade + 40)
                }
                style={loadMoreButtonStyle}
              >
                Carregar mais
              </button>
            )}
          </>
        )}
      </section>

      <footer style={footerStyle}>
        <span>Historietas</span>
      </footer>

      <DenunciaModal
        aberto={Boolean(alvoDenunciaDiario)}
        alvoTipo={alvoDenunciaDiario?.tipo || "diario_anotacao"}
        alvoId={alvoDenunciaDiario?.id || ""}
        alvoTitulo={alvoDenunciaDiario?.titulo || "Conteúdo do Diário"}
        onFechar={() => setAlvoDenunciaDiario(null)}
        onEnviada={() => {
          setAlvoDenunciaDiario(null);
          setMensagemAcao("Denúncia enviada para análise.");
        }}
      />

      {obraMenuAberta &&
        (() => {
          const obra = obraMenuAberta;
          const item = itemPerfilMenuAberto;
          const hrefPrincipal = item
            ? obterHrefContinuarLeituraListas(item)
            : obra.link;
          const podeContinuar = Boolean(item && item.progresso > 0);
          const detalheMenu = item
            ? textoSecundarioItem(item, categoriaMenuAberta)
            : "";

          return (
            <div
              style={actionSheetOverlayStyle}
              onClick={(event) => {
                if (event.target === event.currentTarget) fecharMenuObra();
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-label={`Opções de ${obra.titulo}`}
                style={actionSheetStyle}
                onClick={(event) => event.stopPropagation()}
              >
                <span style={actionSheetHandleStyle} aria-hidden="true" />

                <div style={actionSheetHeaderStyle}>
                  <strong
                    data-historietas-user-content="true"
                    style={actionSheetTitleStyle}
                  >
                    {obra.titulo}
                  </strong>
                  <span
                    data-historietas-user-content="true"
                    style={actionSheetMetaStyle}
                  >
                    {obra.autor} • {obra.genero}
                  </span>

                  {detalheMenu && (
                    <span style={actionSheetDetailStyle}>{detalheMenu}</span>
                  )}
                </div>

                <div style={actionSheetActionsStyle}>
                  <Link
                    href={hrefPrincipal}
                    onClick={() => fecharMenuObra()}
                    style={actionSheetButtonStyle}
                  >
                    <span>{podeContinuar ? "Continuar leitura" : "Ver obra"}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => void alternarObraNoQueroLer()}
                    disabled={salvandoQueroLer}
                    style={{
                      ...actionSheetButtonStyle,
                      ...(salvandoQueroLer ? actionSheetButtonDisabledStyle : {}),
                    }}
                  >
                    <span>
                      {obraMenuNoQueroLer
                        ? "Remover do Quero ler"
                        : "Quero ler mais tarde"}
                    </span>
                    <span
                      aria-hidden="true"
                      style={
                        obraMenuNoQueroLer
                          ? actionSheetSelectionDotActiveStyle
                          : actionSheetSelectionDotStyle
                      }
                    >
                      {obraMenuNoQueroLer ? "✓" : ""}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void compartilharObraDoMenu()}
                    style={actionSheetButtonStyle}
                  >
                    <span>Compartilhar</span>
                  </button>

                  {item?.anotacaoId && !perfilEhProprio && (
                    <button
                      type="button"
                      onClick={() => {
                        const anotacaoId = item.anotacaoId?.trim() || "";

                        if (!anotacaoId) {
                          return;
                        }

                        setObraMenuAberta(null);
                        setItemPerfilMenuAberto(null);
                        setObraMenuNoQueroLer(false);
                        abrirDenunciaDiario(
                          "diario_anotacao",
                          anotacaoId,
                          `Anotação de ${perfil?.nome || "usuário"} em ${obra.titulo}`,
                          perfil?.userId || "",
                        );
                      }}
                      style={listDiaryActionSheetReportStyle}
                    >
                      <span>Denunciar anotação</span>
                    </button>
                  )}

                  {item && perfilEhProprio && (
                    <button
                      type="button"
                      onClick={abrirEditorAnotacaoListas}
                      style={actionSheetButtonStyle}
                    >
                      <span>
                        {item.anotacao
                          ? "Editar anotação"
                          : "Criar anotação"}
                      </span>
                      <span aria-hidden="true" style={actionSheetButtonIconStyle}>
                        ✎
                      </span>
                    </button>
                  )}
                </div>

                {editorAnotacao.aberto && (
                  <div style={listDiaryActionSheetEditorStyle}>
                    <div style={listDiaryAnnotationTextareaWrapStyle}>
                      <textarea
                        aria-label="Anotação da leitura"
                        value={editorAnotacao.texto}
                        onChange={(event) =>
                          setEditorAnotacao((estadoAtual) => ({
                            ...estadoAtual,
                            texto: event.target.value.slice(
                              0,
                              DIARIO_ANOTACAO_MAX_LENGTH,
                            ),
                            erro: "",
                          }))
                        }
                        placeholder="Escreva o que achou desta leitura..."
                        maxLength={DIARIO_ANOTACAO_MAX_LENGTH}
                        rows={4}
                        style={listDiaryAnnotationTextareaStyle}
                        disabled={editorAnotacao.salvando}
                      />

                      <span style={listDiaryAnnotationCounterStyle}>
                        {editorAnotacao.texto.length}/
                        {DIARIO_ANOTACAO_MAX_LENGTH}
                      </span>
                    </div>

                    <div style={listDiaryAnnotationEditorMetaStyle}>
                      <label style={listDiaryAnnotationSpoilerLabelStyle}>
                        <span>Contém spoiler</span>
                        <input
                          type="checkbox"
                          checked={editorAnotacao.contemSpoiler}
                          onChange={(event) =>
                            setEditorAnotacao((estadoAtual) => ({
                              ...estadoAtual,
                              contemSpoiler: event.target.checked,
                              erro: "",
                            }))
                          }
                          style={listDiaryAnnotationSpoilerCheckboxStyle}
                          disabled={editorAnotacao.salvando}
                        />
                      </label>

                      {item?.anotacao && (
                        <button
                          type="button"
                          onClick={() => void removerAnotacaoListas()}
                          disabled={editorAnotacao.salvando}
                          style={listDiaryAnnotationRemoveStyle}
                        >
                          Remover
                        </button>
                      )}

                      <div style={listDiaryAnnotationMetaActionsStyle}>
                        <button
                          type="button"
                          onClick={() =>
                            setEditorAnotacao(EDITOR_ANOTACAO_LISTAS_VAZIO)
                          }
                          disabled={editorAnotacao.salvando}
                          style={listDiaryAnnotationCancelStyle}
                        >
                          Cancelar
                        </button>

                        <button
                          type="button"
                          onClick={() => void salvarAnotacaoListas()}
                          disabled={editorAnotacao.salvando}
                          style={listDiaryAnnotationSaveStyle}
                        >
                          {editorAnotacao.salvando ? "Salvando..." : "Salvar"}
                        </button>
                      </div>
                    </div>

                    {editorAnotacao.erro && (
                      <span style={listDiaryAnnotationErrorStyle}>
                        {editorAnotacao.erro}
                      </span>
                    )}
                  </div>
                )}

              </section>
            </div>
          );
        })()}

      {renderizarComentariosDiarioSheet()}
    </main>
  );
}

export default function ListasUniversaisPage() {
  return (
    <Suspense
      fallback={
        <main style={pageStyle}>
          <div style={stateStyle}>Carregando lista...</div>
        </main>
      }
    >
      <ListasUniversaisContent />
    </Suspense>
  );
}

const listasPageCss = `
  html {
    --historietas-list-like-active: #EF4444;
    --historietas-list-diary-rating: var(--historietas-accent, #F97316);
    --historietas-list-diary-rating-muted: color-mix(
      in srgb,
      var(--historietas-list-diary-rating) 34%,
      transparent
    );
    --historietas-list-comments-send-text: #FFFFFF;
  }

  html[data-historietas-tema-visual="foco"] {
    --historietas-list-like-active: #FFFFFF;
    --historietas-list-diary-rating: #FFFFFF;
    --historietas-list-diary-rating-muted: rgba(255,255,255,0.30);
    --historietas-list-comments-send-text: #000000;
  }

  @keyframes historietas-list-heart-pop {
    0% { transform: scale(1); }
    45% { transform: scale(1.28); }
    100% { transform: scale(1); }
  }

  @keyframes historietas-list-comments-sheet-up {
    from { transform: translateY(100%); opacity: 0.75; }
    to { transform: translateY(0); opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    .historietas-list-annotation svg {
      animation-duration: 1ms !important;
    }
  }

  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main,
  html[data-historietas-tema-visual="foco"] body,
  html[data-historietas-tema-visual="foco"] main {
    background: #000000 !important;
    color: #FFFFFF !important;
  }

  .historietas-list-row {
    min-width: 0;
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40px;
    align-items: stretch;
  }

  .historietas-list-annotation {
    grid-column: 1 / -1;
    padding: 0 44px 13px 4px;
  }

  .historietas-list-row::after {
    content: "";
    position: absolute;
    left: 82px;
    right: 4px;
    bottom: 0;
    height: 1px;
    background: rgba(255,255,255,0.10);
    pointer-events: none;
  }

  .historietas-list-row:last-child::after {
    display: none;
  }

  .historietas-list-row-highlight {
    border-radius: 14px;
    background: rgba(255,255,255,0.10);
    box-shadow: 0 0 0 2px rgba(255,255,255,0.72);
    animation: historietas-list-highlight 2.4s ease both;
  }

  @keyframes historietas-list-highlight {
    0%, 100% { background: rgba(255,255,255,0.04); }
    25%, 70% { background: rgba(255,255,255,0.14); }
  }

  .historietas-list-spinner {
    width: 23px;
    height: 23px;
    border: 3px solid rgba(255,255,255,0.16);
    border-top-color: #FFFFFF;
    border-radius: 999px;
    animation: historietas-list-spin 0.75s linear infinite;
  }

  @keyframes historietas-list-spin {
    to { transform: rotate(360deg); }
  }

  @media (min-width: 760px) {
    .historietas-list-row a {
      min-height: 108px !important;
      padding: 10px 0 10px 18px !important;
    }

    .historietas-list-row > button {
      margin-right: 12px !important;
    }

    .historietas-list-annotation {
      padding-left: 18px;
      padding-right: 58px;
    }

    .historietas-list-row::after {
      left: 98px;
      right: 18px;
    }
  }
`;

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#000000",
  color: "#FFFFFF",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  paddingBottom: "48px",
};


const headerStyle: CSSProperties = {
  background: "#000000",
};

const headerInnerStyle: CSSProperties = {
  width: "min(100%, 920px)",
  minHeight: "72px",
  margin: "0 auto",
  padding: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

const pageTitleStyle: CSSProperties = {
  width: "100%",
  margin: 0,
  color: "#FFFFFF",
  fontSize: "clamp(20px, 4vw, 30px)",
  fontWeight: 900,
  letterSpacing: "-0.035em",
  lineHeight: 1.08,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textAlign: "center",
};

const controlsStyle: CSSProperties = {
  width: "min(100%, 920px)",
  margin: "0 auto",
  padding: "12px 14px 8px",
  display: "grid",
  gap: "10px",
  boxSizing: "border-box",
};

const listDiaryControlsStyle: CSSProperties = {
  ...controlsStyle,
  padding: "5px 14px 8px",
};

const desktopControlsStyle: CSSProperties = {
  ...controlsStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "12px 0 10px",
};

const desktopListDiaryControlsStyle: CSSProperties = {
  ...desktopControlsStyle,
  padding: "6px 0 10px",
};

const tabsStyle: CSSProperties = {
  display: "flex",
  gap: "7px",
  overflowX: "auto",
  scrollbarWidth: "none",
  paddingBottom: "2px",
};

const desktopTabsStyle: CSSProperties = {
  ...tabsStyle,
  width: "100%",
  justifyContent: "center",
  alignItems: "center",
  flexWrap: "wrap",
  overflowX: "visible",
  paddingBottom: "2px",
};

const tabStyle: CSSProperties = {
  flex: "0 0 auto",
  minHeight: "38px",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "999px",
  background: "#000000",
  color: "rgba(255,255,255,0.68)",
  padding: "0 12px",
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  fontSize: "12px",
  fontWeight: 850,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const tabActiveStyle: CSSProperties = {
  ...tabStyle,
  background: "#FFFFFF",
  color: "#090909",
  border: "1px solid #FFFFFF",
};

const tabCountStyle: CSSProperties = {
  minWidth: "19px",
  height: "19px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 5px",
  background: "rgba(127,127,127,0.22)",
  fontSize: "10px",
  fontWeight: 950,
};






const listSectionStyle: CSSProperties = {
  width: "min(100%, 920px)",
  margin: "0 auto",
  padding: "0 14px",
  boxSizing: "border-box",
};

const desktopListSectionStyle: CSSProperties = {
  ...listSectionStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: 0,
};

const rowsStyle: CSSProperties = {};

const desktopWorksRowsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  columnGap: "22px",
  rowGap: "8px",
  alignItems: "start",
  minWidth: 0,
};

const rowMainLinkStyle: CSSProperties = {
  minHeight: "104px",
  padding: "9px 0 9px 4px",
  display: "grid",
  gridTemplateColumns: "62px minmax(0, 1fr)",
  alignItems: "center",
  gap: "12px",
  color: "#FFFFFF",
  textDecoration: "none",
  boxSizing: "border-box",
  transition: "background 120ms ease",
};

const rowAuthorLinkStyle: CSSProperties = {
  ...rowMainLinkStyle,
  gridColumn: "1 / -1",
  paddingRight: "4px",
};

const coverStyle: CSSProperties = {
  width: "62px",
  height: "86px",
  borderRadius: "9px",
  overflow: "hidden",
  background: "#111111",
};

const coverEmptyStyle: CSSProperties = {
  ...coverStyle,
  background:
    "linear-gradient(145deg, rgba(124,58,237,0.28), rgba(249,115,22,0.14)), #111111",
};

const authorAvatarStyle: CSSProperties = {
  width: "62px",
  height: "62px",
  borderRadius: "999px",
  overflow: "hidden",
  background: "#111111",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  fontSize: "24px",
  fontWeight: 950,
};

const authorAvatarEmptyStyle: CSSProperties = {
  ...authorAvatarStyle,
  background:
    "linear-gradient(145deg, rgba(124,58,237,0.34), rgba(249,115,22,0.18)), #111111",
};

const rowTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "5px",
};

const rowTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "clamp(16px, 3.3vw, 18px)",
  fontWeight: 500,
  letterSpacing: "-0.01em",
  lineHeight: 1.2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
};

const rowMetaStyle: CSSProperties = {
  color: "rgba(255,255,255,0.52)",
  fontSize: "14px",
  fontWeight: 450,
  lineHeight: 1.25,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const rowDetailStyle: CSSProperties = {
  color: "rgba(255,255,255,0.72)",
  fontSize: "12px",
  fontWeight: 750,
  lineHeight: 1.3,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const ratingDetailStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  maxWidth: "100%",
};

const ratingStarsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "1px",
  flex: "0 0 auto",
  fontSize: "14px",
  lineHeight: 1,
};

const ratingStarSlotStyle: CSSProperties = {
  position: "relative",
  display: "inline-block",
  width: "1em",
  height: "1em",
  lineHeight: 1,
};

const ratingStarEmptyStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  color: "rgba(255,255,255,0.22)",
  lineHeight: 1,
};

const ratingStarFillClipStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  height: "100%",
  overflow: "hidden",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

const ratingStarFilledStyle: CSSProperties = {
  display: "block",
  width: "1em",
  color: "#F6C453",
  lineHeight: 1,
};

const rowOptionsButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "40px",
  minHeight: "44px",
  alignSelf: "center",
  justifySelf: "stretch",
  margin: 0,
  padding: 0,
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  color: "#FFFFFF",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  position: "relative",
  zIndex: 2,
};

const moreOptionsStyle: CSSProperties = {
  minHeight: "20px",
  minWidth: "10px",
  display: "inline-flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "2.5px",
};

const moreDotStyle: CSSProperties = {
  width: "3px",
  height: "3px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.92)",
  display: "block",
};

const actionSheetOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9998,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  background: "rgba(0,0,0,0.68)",
  overscrollBehavior: "none",
};

const actionSheetStyle: CSSProperties = {
  width: "min(820px, 100%)",
  maxHeight: "calc(100dvh - 72px)",
  overflowY: "auto",
  borderRadius: "24px 24px 0 0",
  background: "#070212",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.42)",
  padding: "8px 0 calc(14px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
};

const actionSheetHandleStyle: CSSProperties = {
  width: "68px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.58)",
  display: "block",
  margin: "0 auto 15px",
};

const actionSheetHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "5px",
  padding: "0 28px 18px",
  textAlign: "center",
};

const actionSheetTitleStyle: CSSProperties = {
  maxWidth: "100%",
  color: "#FFFFFF",
  fontSize: "20px",
  fontWeight: 850,
  lineHeight: 1.15,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const actionSheetMetaStyle: CSSProperties = {
  maxWidth: "100%",
  color: "rgba(255,255,255,0.52)",
  fontSize: "13px",
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const actionSheetDetailStyle: CSSProperties = {
  maxWidth: "100%",
  color: "rgba(255,255,255,0.72)",
  fontSize: "11px",
  fontWeight: 750,
  lineHeight: 1.3,
  textAlign: "center",
  overflowWrap: "anywhere",
};

const actionSheetActionsStyle: CSSProperties = {
  display: "grid",
};

const actionSheetButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "54px",
  padding: "0 30px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "18px",
  fontSize: "18px",
  fontWeight: 650,
  fontFamily: "inherit",
  textAlign: "left",
  textDecoration: "none",
  cursor: "pointer",
};

const actionSheetButtonDisabledStyle: CSSProperties = {
  opacity: 0.58,
  cursor: "default",
};

const actionSheetButtonIconStyle: CSSProperties = {
  minWidth: "24px",
  color: "rgba(255,255,255,0.72)",
  fontSize: "22px",
  lineHeight: 1,
  textAlign: "center",
};

const actionSheetSelectionDotStyle: CSSProperties = {
  width: "20px",
  height: "20px",
  borderRadius: "999px",
  border: "2.25px solid rgba(161,161,170,0.72)",
  background: "transparent",
  color: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  boxSizing: "border-box",
  fontSize: "13px",
  lineHeight: 1,
  fontWeight: 900,
};

const actionSheetSelectionDotActiveStyle: CSSProperties = {
  ...actionSheetSelectionDotStyle,
  border: "2px solid #FFFFFF",
  background: "#FFFFFF",
  color: "#111111",
};


const monthGroupStyle: CSSProperties = {
  marginBottom: "12px",
};

const monthTitleStyle: CSSProperties = {
  margin: "14px 0 7px",
  color: "rgba(255,255,255,0.48)",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.08em",
};

const stateStyle: CSSProperties = {
  minHeight: "300px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "9px",
  color: "#FFFFFF",
  textAlign: "center",
  padding: "30px 18px",
};

const stateIconStyle: CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "999px",
  background: "#151515",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  fontWeight: 950,
};

const stateTextStyle: CSSProperties = {
  maxWidth: "430px",
  color: "rgba(255,255,255,0.58)",
  fontSize: "13px",
  fontWeight: 650,
  lineHeight: 1.45,
};

const stateLinkStyle: CSSProperties = {
  marginTop: "5px",
  minHeight: "38px",
  padding: "0 15px",
  borderRadius: "999px",
  background: "#FFFFFF",
  color: "#090909",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 900,
};

const loadMoreButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "48px",
  marginTop: "14px",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "14px",
  background: "#0B0B0B",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 900,
  cursor: "pointer",
};


const actionMessageStyle: CSSProperties = {
  position: "sticky",
  top: "10px",
  zIndex: 40,
  width: "fit-content",
  maxWidth: "calc(100% - 28px)",
  margin: "8px auto 0",
  padding: "10px 14px",
  borderRadius: "999px",
  background: "#FFFFFF",
  color: "#090909",
  fontSize: "12px",
  fontWeight: 900,
  boxShadow: "0 10px 30px rgba(0,0,0,0.32)",
};

const rowSignalsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "nowrap",
  gap: "5px",
  marginTop: "3px",
  minWidth: 0,
};

const rowSignalStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "18px",
  padding: "2px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.09)",
  color: "rgba(255,255,255,0.78)",
  fontSize: "9px",
  fontWeight: 850,
  lineHeight: 1,
};

const rowRatingSignalStyle: CSSProperties = {
  ...rowSignalStyle,
  gap: "3px",
  position: "relative",
  top: 0,
  flex: "0 0 auto",
};

const rowRatingSignalStarStyle: CSSProperties = {
  display: "inline-block",
  lineHeight: 1,
  transform: "translateY(-0.5px)",
};

const rowSignalAnnotationToggleStyle: CSSProperties = {
  ...rowSignalStyle,
  cursor: "pointer",
  userSelect: "none",
  WebkitUserSelect: "none",
  WebkitTapHighlightColor: "transparent",
};

const listDiaryActionSheetReportStyle: CSSProperties = {
  ...actionSheetButtonStyle,
  color: "var(--historietas-danger-button-text, #FCA5A5)",
};

const listDiaryActionSheetEditorStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  padding: "4px 18px 14px",
  borderBottom: "0",
  boxSizing: "border-box",
};

const listDiaryEvaluationCardStyle: CSSProperties = {
  width: "min(calc(100% - 28px), 892px)",
  margin: "0 auto 10px",
  padding: "16px",
  display: "grid",
  gap: "12px",
  border: "1px solid rgba(255,255,255,0.11)",
  borderRadius: "18px",
  background:
    "linear-gradient(145deg, rgba(124,58,237,0.13), rgba(249,115,22,0.055)), rgba(255,255,255,0.025)",
  boxSizing: "border-box",
};

const listDiaryEvaluationHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
};

const listDiaryEvaluationTitleGroupStyle: CSSProperties = {
  minWidth: 0,
  display: "flex",
  alignItems: "baseline",
  gap: "8px",
  flexWrap: "wrap",
};

const listDiaryEvaluationEyebrowStyle: CSSProperties = {
  color: "rgba(255,255,255,0.72)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
};

const listDiaryEvaluationScoreStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "25px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.04em",
};

const listDiaryEvaluationTotalStyle: CSSProperties = {
  color: "rgba(255,255,255,0.48)",
  fontSize: "10px",
  fontWeight: 800,
};

const listDiaryEvaluationSettingsButtonStyle: CSSProperties = {
  minHeight: "30px",
  padding: "0 10px",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.05)",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "9px",
  fontWeight: 900,
  cursor: "pointer",
};

const listDiaryEvaluationStarsRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "3px",
};

const listDiaryEvaluationStarButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  position: "relative",
  width: "32px",
  height: "32px",
  padding: 0,
  border: "none",
  background: "transparent",
  fontSize: "30px",
  lineHeight: 1,
  fontFamily: "inherit",
};

const listDiaryEvaluationStarBaseStyle: CSSProperties = {
  color: "rgba(255,255,255,0.16)",
};

const listDiaryEvaluationStarFillStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  color: "#FBBF24",
  whiteSpace: "nowrap",
  pointerEvents: "none",
};

const listDiaryEvaluationDescriptionStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.58)",
  fontSize: "10.5px",
  lineHeight: 1.45,
  fontWeight: 700,
};

const listDiaryEvaluationSettingsPanelStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  paddingTop: "12px",
  borderTop: "1px solid rgba(255,255,255,0.08)",
};

const listDiaryEvaluationToggleRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "14px",
  padding: "9px 10px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.035)",
  color: "#FFFFFF",
  fontSize: "10px",
  lineHeight: 1.35,
};

const listDiaryEvaluationCheckboxStyle: CSSProperties = {
  width: "16px",
  height: "16px",
  margin: 0,
  accentColor: "#F97316",
  flex: "0 0 auto",
};

const listDiaryEvaluationFieldStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  color: "rgba(255,255,255,0.64)",
  fontSize: "9px",
  fontWeight: 850,
};

const listDiaryEvaluationSelectStyle: CSSProperties = {
  width: "100%",
  minHeight: "36px",
  padding: "0 10px",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "11px",
  background: "#080808",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "10px",
  fontWeight: 800,
};

const listDiaryEvaluationSettingsActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
};

const listDiaryEvaluationCancelButtonStyle: CSSProperties = {
  minHeight: "32px",
  padding: "0 11px",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "999px",
  background: "transparent",
  color: "rgba(255,255,255,0.70)",
  fontFamily: "inherit",
  fontSize: "9px",
  fontWeight: 900,
  cursor: "pointer",
};

const listDiaryEvaluationSaveButtonStyle: CSSProperties = {
  ...listDiaryEvaluationCancelButtonStyle,
  border: "none",
  background: "#FFFFFF",
  color: "#050505",
};

const listDiaryEvaluationErrorStyle: CSSProperties = {
  color: "#FDA4AF",
  fontSize: "9px",
  lineHeight: 1.4,
  fontWeight: 800,
};

const listDiaryAnnotationPrivacyGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "8px",
  padding: "10px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.035)",
};

const listDiaryAnnotationFieldStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "5px",
  color: "rgba(255,255,255,0.60)",
  fontSize: "8px",
  fontWeight: 850,
};

const listDiaryAnnotationPrivacySelectStyle: CSSProperties = {
  width: "100%",
  minHeight: "32px",
  padding: "0 8px",
  border: "1px solid rgba(255,255,255,0.11)",
  borderRadius: "9px",
  background: "#090909",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "8.5px",
  fontWeight: 800,
};

const listDiaryAnnotationToggleFieldStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  color: "rgba(255,255,255,0.74)",
  fontSize: "8px",
  lineHeight: 1.35,
};

const listDiaryAnnotationTextareaWrapStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  minWidth: 0,
  paddingTop: "13px",
};

const listDiaryAnnotationTextareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "78px",
  resize: "vertical",
  padding: "8px 48px 8px 9px",
  borderRadius: "11px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  background: "rgba(255,255,255,0.05)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "9px",
  lineHeight: 1.4,
  fontWeight: 700,
  outline: "none",
  boxSizing: "border-box",
};

const listDiaryAnnotationEditorMetaStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "8px",
  minWidth: 0,
};

const listDiaryAnnotationMetaActionsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: "5px",
  marginLeft: "auto",
};

const listDiaryAnnotationSpoilerLabelStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  minHeight: "27px",
  color: "rgba(255,255,255,0.72)",
  fontSize: "8px",
  fontWeight: 850,
  lineHeight: 1,
  whiteSpace: "nowrap",
  cursor: "pointer",
};

const listDiaryAnnotationSpoilerCheckboxStyle: CSSProperties = {
  width: "13px",
  height: "13px",
  margin: 0,
  accentColor:
    "var(--historietas-accent, var(--historietas-perfil-accent, #F97316))",
  cursor: "pointer",
  flex: "0 0 auto",
};

const listDiaryAnnotationCounterStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  right: "10px",
  zIndex: 1,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7.5px",
  lineHeight: 1,
  fontWeight: 800,
  whiteSpace: "nowrap",
  pointerEvents: "none",
};

const listDiaryAnnotationErrorStyle: CSSProperties = {
  color: "var(--historietas-perfil-rose-soft, #FDA4AF)",
  fontSize: "8px",
  lineHeight: 1.3,
  fontWeight: 800,
  overflowWrap: "anywhere",
};

const listDiaryAnnotationSaveStyle: CSSProperties = {
  minHeight: "27px",
  padding: "5px 9px",
  borderRadius: "999px",
  border: "none",
  background:
    "var(--historietas-accent, var(--historietas-perfil-accent, #F97316))",
  color: "#000000",
  fontSize: "7.8px",
  lineHeight: 1,
  fontWeight: 950,
  cursor: "pointer",
};

const listDiaryAnnotationCancelStyle: CSSProperties = {
  ...listDiaryAnnotationSaveStyle,
  background: "rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

const listDiaryAnnotationRemoveStyle: CSSProperties = {
  ...listDiaryAnnotationSaveStyle,
  background:
    "var(--historietas-perfil-rose-dark-14, rgba(190,18,60,0.14))",
  color: "var(--historietas-perfil-rose-soft, #FDA4AF)",
};

const listDiaryCardAnnotationStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
  boxSizing: "border-box",
};

const listDiaryCardAnnotationHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  minWidth: 0,
};

const listDiaryCardAnnotationTitleStyle: CSSProperties = {
  minWidth: 0,
  color: "rgba(255,255,255,0.82)",
  fontSize: "11px",
  fontWeight: 900,
  lineHeight: 1.25,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const listDiaryCardAnnotationHeaderActionsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  flex: "0 0 auto",
  transform: "translateX(33px)",
};

const listDiaryCardAnnotationLikeButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "5px",
  minHeight: "26px",
  padding: "0 2px",
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  lineHeight: 1,
  flex: "0 0 auto",
};

const listDiaryCardAnnotationLikeIconStyle: CSSProperties = {
  width: "18px",
  height: "18px",
  display: "block",
  flex: "0 0 auto",
  transformOrigin: "center",
};

const listDiaryCardAnnotationLikeCountStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 850,
  lineHeight: 1,
};

const listDiaryCardAnnotationTextStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.88)",
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: 1.5,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

const listDiaryCardSpoilerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "8px",
  minWidth: 0,
  padding: "8px 10px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.05)",
};

const listDiaryCardSpoilerTextStyle: CSSProperties = {
  color: "rgba(255,255,255,0.64)",
  fontSize: "10px",
  fontWeight: 750,
  lineHeight: 1.35,
};

const listDiaryCardSpoilerButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "fit-content",
  minHeight: "26px",
  padding: "4px 8px",
  border: "none",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  fontSize: "9px",
  fontWeight: 900,
  lineHeight: 1,
  cursor: "pointer",
};

const listDiaryCardAnnotationTitleGroupStyle: CSSProperties = {
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  gap: "7px",
};

const listDiaryCommentsModernHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "wrap",
};

const listDiaryCommentsSortStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "3px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.04)",
};

const listDiaryCommentsSortButtonStyle: CSSProperties = {
  minHeight: "25px",
  padding: "0 8px",
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  color: "rgba(255,255,255,0.48)",
  fontFamily: "inherit",
  fontSize: "8px",
  fontWeight: 900,
  cursor: "pointer",
};

const listDiaryCommentsSortActiveStyle: CSSProperties = {
  ...listDiaryCommentsSortButtonStyle,
  background: "rgba(255,255,255,0.12)",
  color: "#FFFFFF",
};

const listDiaryCommentsModernListStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
};

const listDiaryCommentThreadStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const listDiaryCommentModernRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr) 28px",
  gap: "9px",
  alignItems: "start",
  minWidth: 0,
};

const listDiaryCommentReplyRowStyle: CSSProperties = {
  ...listDiaryCommentModernRowStyle,
  gridTemplateColumns: "28px minmax(0, 1fr) 28px",
  gap: "8px",
};

const listDiaryCommentRepliesStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  marginLeft: "34px",
  paddingLeft: "10px",
  borderLeft: "1px solid rgba(255,255,255,0.08)",
};

const listDiaryCommentAvatarStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  border: "1px solid rgba(124,58,237,0.38)",
  background: "#08040D",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
};

const listDiaryCommentReplyAvatarStyle: CSSProperties = {
  ...listDiaryCommentAvatarStyle,
  width: "28px",
  height: "28px",
  borderRadius: "10px",
  fontSize: "10px",
};

const listDiaryCommentModernContentStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "3px",
};

const listDiaryCommentModernTopLineStyle: CSSProperties = {
  minWidth: 0,
  display: "flex",
  alignItems: "baseline",
  gap: "6px",
  flexWrap: "wrap",
};

const listDiaryCommentModernAuthorStyle: CSSProperties = {
  minWidth: 0,
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 950,
};

const listDiaryCommentUsernameStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "150px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: "rgba(255,255,255,0.38)",
  fontSize: "8.5px",
  fontWeight: 750,
};

const listDiaryCommentModernDateStyle: CSSProperties = {
  color: "rgba(255,255,255,0.34)",
  fontSize: "8px",
  fontWeight: 700,
};

const listDiaryCommentModernTextStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.78)",
  fontSize: "11px",
  lineHeight: 1.45,
  fontWeight: 650,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

const listDiaryCommentModernActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const listDiaryCommentTextActionStyle: CSSProperties = {
  width: "fit-content",
  padding: "1px 0",
  border: "none",
  background: "transparent",
  color: "rgba(255,255,255,0.45)",
  fontFamily: "inherit",
  fontSize: "8.5px",
  fontWeight: 900,
  cursor: "pointer",
};

const listDiaryCommentRemoveTextActionStyle: CSSProperties = {
  ...listDiaryCommentTextActionStyle,
  color: "#FDA4AF",
};

const listDiaryCommentLikeWrapStyle: CSSProperties = {
  minWidth: "28px",
  display: "grid",
  justifyItems: "center",
  alignContent: "start",
  gap: "2px",
};

const listDiaryCommentLikeButtonStyle: CSSProperties = {
  width: "28px",
  height: "28px",
  padding: 0,
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const listDiaryCommentHeartStyle: CSSProperties = {
  width: "18px",
  height: "18px",
};

const listDiaryCommentLikeCountStyle: CSSProperties = {
  color: "rgba(255,255,255,0.42)",
  fontSize: "8px",
  fontWeight: 900,
};

const listDiaryEmptyCommentsModernStyle: CSSProperties = {
  color: "rgba(255,255,255,0.42)",
  fontSize: "9px",
  lineHeight: 1.4,
};

const listDiaryReplyingBannerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  padding: "7px 9px",
  borderRadius: "10px",
  background: "rgba(124,58,237,0.11)",
  color: "rgba(255,255,255,0.70)",
  fontSize: "8.5px",
  fontWeight: 800,
};

const listDiaryReplyingCancelStyle: CSSProperties = {
  padding: 0,
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "8px",
  fontWeight: 900,
  cursor: "pointer",
};

const listDiaryComposerModernBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 34px",
  alignItems: "end",
  gap: "7px",
  padding: "7px",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "13px",
  background: "rgba(255,255,255,0.035)",
};

const listDiaryCommentTextareaModernStyle: CSSProperties = {
  width: "100%",
  minHeight: "44px",
  maxHeight: "130px",
  resize: "vertical",
  padding: "7px 8px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "10px",
  lineHeight: 1.4,
  outline: "none",
  boxSizing: "border-box",
};

const listDiaryCommentSendModernStyle: CSSProperties = {
  width: "32px",
  height: "32px",
  padding: 0,
  border: "none",
  borderRadius: "999px",
  background: "#FFFFFF",
  color: "#050505",
  fontSize: "13px",
  fontWeight: 950,
  cursor: "pointer",
};

const listDiaryCommentsPermissionStyle: CSSProperties = {
  color: "rgba(255,255,255,0.40)",
  fontSize: "8.5px",
  lineHeight: 1.4,
  fontWeight: 750,
};

const listDiaryCommentsSectionStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  minWidth: 0,
  paddingTop: "9px",
  borderTop: "1px solid rgba(255,255,255,0.075)",
};

const listDiaryCommentRowStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  minWidth: 0,
  padding: "8px 9px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.035)",
};

const listDiaryCommentAuthorStyle: CSSProperties = {
  minWidth: 0,
  color: "rgba(255,255,255,0.82)",
  fontSize: "10px",
  fontWeight: 900,
  lineHeight: 1.2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const listDiaryCommentDateStyle: CSSProperties = {
  color: "rgba(255,255,255,0.38)",
  fontSize: "8px",
  fontWeight: 700,
  lineHeight: 1.2,
  flex: "0 0 auto",
};

const listDiaryCommentActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
};

const listDiaryCommentRemoveButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  minHeight: "26px",
  padding: "4px 8px",
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  color: "var(--historietas-perfil-rose-soft, #FDA4AF)",
  fontFamily: "inherit",
  fontSize: "9px",
  fontWeight: 850,
  lineHeight: 1,
  cursor: "pointer",
};

const listDiaryCommentComposerFooterStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
};

const listDiaryCommentCounterStyle: CSSProperties = {
  color: "rgba(255,255,255,0.34)",
  fontSize: "8px",
  fontWeight: 700,
};

const listDiaryCommentSubmitStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  minHeight: "28px",
  padding: "5px 10px",
  border: "none",
  borderRadius: "999px",
  background:
    "var(--historietas-accent, var(--historietas-perfil-accent, #F97316))",
  color: "#000000",
  fontFamily: "inherit",
  fontSize: "9px",
  fontWeight: 950,
  cursor: "pointer",
};

const listDiaryCommentSubmitDisabledStyle: CSSProperties = {
  ...listDiaryCommentSubmitStyle,
  opacity: 0.55,
  cursor: "wait",
};

const listDiaryCommentErrorStyle: CSSProperties = {
  color: "var(--historietas-perfil-rose-soft, #FDA4AF)",
  fontSize: "9px",
  fontWeight: 750,
  lineHeight: 1.35,
};

const listDiaryPanelStyle: CSSProperties = {
  display: "grid",
  gap: "11px",
  margin: "8px 16px 0",
  padding: "14px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.11)",
  background: "rgba(255,255,255,0.035)",
};

const listDiarySectionHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
};

const listDiarySectionTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
};

const listDiaryRatingValueStyle: CSSProperties = {
  color: "rgba(255,255,255,0.62)",
  fontSize: "11px",
  fontWeight: 800,
};

const listDiaryStarsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
};

const listDiaryStarButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  position: "relative",
  width: "31px",
  height: "31px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  border: 0,
  background: "transparent",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "29px",
  lineHeight: 1,
};

const listDiaryStarBaseStyle: CSSProperties = {
  color: "rgba(255,255,255,0.18)",
};

const listDiaryStarFillStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  height: "100%",
  overflow: "hidden",
  color: "#FBBF24",
  whiteSpace: "nowrap",
  pointerEvents: "none",
};

const listDiaryTextButtonStyle: CSSProperties = {
  width: "fit-content",
  padding: 0,
  border: 0,
  background: "transparent",
  color: "rgba(255,255,255,0.58)",
  fontSize: "11px",
  fontWeight: 800,
  cursor: "pointer",
};

const listDiaryTextareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "112px",
  resize: "vertical",
  boxSizing: "border-box",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: "12px",
  background: "#050505",
  color: "#FFFFFF",
  padding: "11px",
  fontFamily: "inherit",
  fontSize: "13px",
  lineHeight: 1.5,
  outline: "none",
};

const listDiaryCounterStyle: CSSProperties = {
  justifySelf: "end",
  marginTop: "-7px",
  color: "rgba(255,255,255,0.42)",
  fontSize: "10px",
  fontWeight: 750,
};

const listDiaryEditorControlsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "10px",
};

const listDiarySelectStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "#090909",
  color: "#FFFFFF",
  padding: "0 10px",
  fontFamily: "inherit",
  fontSize: "12px",
  fontWeight: 800,
};

const listDiaryEditorButtonsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const listDiarySecondaryButtonStyle: CSSProperties = {
  minHeight: "36px",
  padding: "0 12px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "transparent",
  color: "rgba(255,255,255,0.72)",
  fontFamily: "inherit",
  fontSize: "12px",
  fontWeight: 850,
  cursor: "pointer",
};

const listDiaryPrimaryButtonStyle: CSSProperties = {
  minHeight: "36px",
  padding: "0 14px",
  borderRadius: "10px",
  border: 0,
  background: "#FFFFFF",
  color: "#070707",
  fontFamily: "inherit",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
};

const listDiaryRemoveButtonStyle: CSSProperties = {
  ...listDiaryTextButtonStyle,
  color: "#FB7185",
};

const listDiaryErrorStyle: CSSProperties = {
  display: "block",
  color: "#FCA5A5",
  fontSize: "11px",
  fontWeight: 750,
  lineHeight: 1.4,
};

const listDiaryAnnotationTitleWrapStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const listDiaryVisibilityStyle: CSSProperties = {
  padding: "3px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.54)",
  fontSize: "9px",
  fontWeight: 850,
  textTransform: "uppercase",
};

const listDiaryLikeButtonStyle: CSSProperties = {
  minHeight: "32px",
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  padding: "0 9px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.11)",
  background: "rgba(255,255,255,0.05)",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "11px",
  fontWeight: 900,
  cursor: "pointer",
};

const listDiaryAnnotationTextStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.86)",
  fontSize: "13px",
  lineHeight: 1.58,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

const listDiaryCommentsStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  paddingTop: "3px",
};

const listDiaryCommentsTitleStyle: CSSProperties = {
  color: "rgba(255,255,255,0.78)",
  fontSize: "11px",
  fontWeight: 900,
};

const listDiaryCommentsListStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
};

const listDiaryCommentStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  padding: "10px",
  borderRadius: "11px",
  background: "rgba(0,0,0,0.28)",
};

const listDiaryCommentHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  color: "rgba(255,255,255,0.55)",
  fontSize: "9px",
};

const listDiaryCommentTextStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.80)",
  fontSize: "12px",
  lineHeight: 1.45,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

const listDiaryCommentRemoveStyle: CSSProperties = {
  ...listDiaryTextButtonStyle,
  color: "#FB7185",
};

const listDiaryEmptyCommentsStyle: CSSProperties = {
  color: "rgba(255,255,255,0.46)",
  fontSize: "11px",
  lineHeight: 1.4,
};

const listDiaryCommentComposerStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
};

const listDiaryCommentTextareaStyle: CSSProperties = {
  ...listDiaryTextareaStyle,
  minHeight: "76px",
};

const footerStyle: CSSProperties = {
  width: "min(100%, 920px)",
  margin: "28px auto 0",
  padding: "0 14px",
  color: "rgba(255,255,255,0.32)",
  fontSize: "10px",
  fontWeight: 750,
  textAlign: "center",
  boxSizing: "border-box",
};
const listDiaryProfileHeaderStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gap: "8px",
  minWidth: 0,
  boxSizing: "border-box",
};

const listDiaryProfileHeaderTopStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "9px",
  minWidth: 0,
  boxSizing: "border-box",
};

const listDiaryProfileAvatarStyle: CSSProperties = {
  width: "42px",
  maxWidth: "42px",
  height: "42px",
  borderRadius: "11px",
  border: "none",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-input-bg, #18181B)",
  color: "#FFFFFF",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 950,
  overflow: "hidden",
  boxSizing: "border-box",
  flex: "0 0 auto",
};

const listDiaryProfileTitleAreaStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  justifyItems: "start",
  gap: "7px",
  minWidth: 0,
};

const listDiaryProfileTitleStyle: CSSProperties = {
  ...rowTitleStyle,
  width: "100%",
  minWidth: 0,
  margin: 0,
  color: "#FFFFFF",
  fontSize: "clamp(15px, 3vw, 17px)",
  fontWeight: 500,
  letterSpacing: "-0.01em",
  lineHeight: 1.2,
  textAlign: "left",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  display: "block",
  WebkitLineClamp: "unset",
  WebkitBoxOrient: "initial",
};

const listDiaryHeaderRatingBoxStyle: CSSProperties = {
  width: "min(420px, 100%)",
  margin: "0 auto",
  padding: 0,
  display: "grid",
  gap: "8px",
  minWidth: 0,
  boxSizing: "border-box",
};

const listDiaryHeaderRatingStarsRowStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  alignItems: "center",
  gap: "6px",
  minWidth: 0,
  background: "transparent",
  boxShadow: "none",
};

const listDiaryHeaderRatingStarButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-list-diary-rating-muted, rgba(249, 115, 22, 0.34))",
  fontSize: "22px",
  fontWeight: 950,
  lineHeight: 1,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const listDiaryHeaderRatingStarActiveStyle: CSSProperties = {
  ...listDiaryHeaderRatingStarButtonStyle,
  color: "var(--historietas-list-diary-rating, #F97316)",
};

const listDiaryHeaderRatingStarVisualStyle: CSSProperties = {
  position: "relative",
  width: "1em",
  height: "1em",
  display: "inline-block",
  lineHeight: 1,
};

const listDiaryHeaderRatingStarBaseStyle: CSSProperties = {
  color: "var(--historietas-list-diary-rating-muted, rgba(249, 115, 22, 0.34))",
  position: "absolute",
  inset: 0,
  lineHeight: 1,
};

const listDiaryHeaderRatingStarFillStyle: CSSProperties = {
  color: "var(--historietas-list-diary-rating, #F97316)",
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

const listDiaryRatingSummaryStyle: CSSProperties = {
  flex: "0 0 auto",
  width: "fit-content",
  maxWidth: "118px",
  minHeight: "39px",
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  gap: "3px",
  padding: "4px 2px",
  background: "transparent",
  border: "none",
  boxShadow: "none",
  boxSizing: "border-box",
  textAlign: "center",
};

const listDiaryRatingNumberStyle: CSSProperties = {
  color: "var(--historietas-list-diary-rating, #F97316)",
  fontSize: "18.5px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
};

const listDiaryRatingSummaryStarsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  color: "var(--historietas-list-diary-rating, #F97316)",
  fontSize: "10px",
  lineHeight: 1,
  letterSpacing: "-0.02em",
};

const listDiaryRatingSummaryStarVisualStyle: CSSProperties = {
  position: "relative",
  width: "1em",
  height: "1em",
  display: "inline-block",
  lineHeight: 1,
  flex: "0 0 auto",
};

const listDiaryRatingSummaryStarBaseStyle: CSSProperties = {
  color: "var(--historietas-list-diary-rating-muted, rgba(249, 115, 22, 0.34))",
  position: "absolute",
  inset: 0,
  lineHeight: 1,
};

const listDiaryRatingSummaryStarFillStyle: CSSProperties = {
  color: "var(--historietas-list-diary-rating, #F97316)",
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

const listDiaryRatingTotalStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7.8px",
  lineHeight: 1.1,
  fontWeight: 850,
  textTransform: "none",
  letterSpacing: 0,
  textAlign: "center",
  whiteSpace: "nowrap",
};

const listDiaryCardAnnotationCommentButtonStyle: CSSProperties = {
  minWidth: "44px",
  height: "34px",
  borderRadius: "999px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  padding: "0 4px",
  fontFamily: "inherit",
  cursor: "pointer",
};

const listDiaryCardAnnotationCommentIconStyle: CSSProperties = {
  width: "20px",
  height: "20px",
  display: "block",
  flex: "0 0 auto",
};

const listDiaryCardAnnotationCommentCountStyle: CSSProperties = {
  minWidth: "12px",
  color: "rgba(255,255,255,0.92)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  textAlign: "center",
};

const commentsSheetOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 2147483647,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  pointerEvents: "none",
  isolation: "isolate",
};

const commentsSheetBackdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 0,
  border: "none",
  background:
    "color-mix(in srgb, var(--historietas-page-background, #070212) 66%, transparent)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  pointerEvents: "auto",
  cursor: "pointer",
  padding: 0,
};

const commentsSheetStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(720px, 100%)",
  maxHeight: "calc(100dvh - env(safe-area-inset-top) - 10px)",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr) auto auto auto auto",
  gap: "7px",
  padding: "5px 12px calc(10px + env(safe-area-inset-bottom))",
  borderRadius: "28px 28px 0 0",
  background: "var(--historietas-page-background, #070212)",
  border: "none",
  borderBottom: "none",
  boxShadow: "0 -24px 70px rgba(0,0,0,0.72)",
  pointerEvents: "auto",
  overflow: "hidden",
  boxSizing: "border-box",
  willChange: "height",
  transition: "height 220ms ease",
};

const commentsSheetCompactStyle: CSSProperties = {
  height: "min(64dvh, 540px)",
};

const commentsSheetExpandedStyle: CSSProperties = {
  height: "min(90dvh, 760px)",
};

const desktopCommentsSheetStyle: CSSProperties = {
  ...commentsSheetStyle,
  width: "min(800px, calc(100% - 40px))",
  height: "min(76dvh, 720px)",
};

const commentsSheetHandleWrapStyle: CSSProperties = {
  minHeight: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  touchAction: "none",
  cursor: "grab",
  willChange: "transform",
  outline: "none",
};

const commentsSheetHandleStyle: CSSProperties = {
  width: "44px",
  height: "5px",
  borderRadius: "999px",
  background: "var(--historietas-border-soft, rgba(255,255,255,0.34))",
};

const commentsSheetHeaderStyle: CSSProperties = {
  minHeight: "32px",
  display: "grid",
  gridTemplateColumns: "40px minmax(0, 1fr) 40px",
  alignItems: "center",
  gap: "6px",
  minWidth: 0,
};

const commentsSheetHeaderSpacerStyle: CSSProperties = {
  width: "40px",
  height: "1px",
};

const commentsSheetTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14.5px",
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.02em",
};

const commentsSortMenuWrapStyle: CSSProperties = {
  position: "relative",
  width: "40px",
  height: "34px",
  justifySelf: "end",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
};

const commentsSortMenuTriggerStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "27px",
  lineHeight: 1,
  fontWeight: 500,
  fontFamily: "inherit",
  padding: "0 0 2px",
  cursor: "pointer",
};

const commentsSortMenuStyle: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  right: 0,
  zIndex: 12,
  width: "132px",
  maxWidth: "calc(100vw - 24px)",
  display: "grid",
  gap: 0,
  padding: "4px 8px",
  boxSizing: "border-box",
  borderRadius: "12px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  background:
    "var(--historietas-surface-strong, rgba(18, 12, 30, 0.98))",
  boxShadow: "0 16px 36px rgba(0,0,0,0.48)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
};

const commentsSortMenuItemStyle: CSSProperties = {
  width: "100%",
  minHeight: "36px",
  border: "none",
  borderRadius: 0,
  background: "transparent",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  padding: "0 4px",
  textAlign: "center",
  fontSize: "11.5px",
  fontWeight: 850,
  fontFamily: "inherit",
  cursor: "pointer",
};

const commentsSortMenuItemActiveStyle: CSSProperties = {
  ...commentsSortMenuItemStyle,
  color: "#FFFFFF",
};

const commentsSortMenuDividerStyle: CSSProperties = {
  width: "100%",
  height: "1px",
  background: "var(--historietas-border-soft, rgba(255,255,255,0.12))",
};

const commentsSheetListStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: "12px",
  minHeight: 0,
  overflowY: "auto",
  padding: "6px 2px 9px",
  WebkitOverflowScrolling: "touch",
};

const commentThreadStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const commentItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr) 28px",
  gap: "10px",
  alignItems: "start",
  minWidth: 0,
};

const commentRepliesListStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  marginLeft: "34px",
  paddingLeft: "10px",
  borderLeft:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  minWidth: 0,
};

const commentReplyItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "28px minmax(0, 1fr) 28px",
  gap: "8px",
  alignItems: "start",
  minWidth: 0,
};

const commentRepliesToggleStyle: CSSProperties = {
  width: "fit-content",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  marginLeft: "44px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0",
  cursor: "pointer",
};

const commentRepliesControlsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  minWidth: 0,
};

const commentRepliesHideButtonStyle: CSSProperties = {
  width: "fit-content",
  marginLeft: "44px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0",
  cursor: "pointer",
};

const commentRepliesLineStyle: CSSProperties = {
  width: "22px",
  height: "1px",
  background: "var(--historietas-border-soft, rgba(255,255,255,0.22))",
};

const commentAvatarLinkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-page-background, #070212)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent)",
  color: "#FFFFFF",
  fontSize: "12.5px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  textDecoration: "none",
  boxShadow: "none",
  flex: "0 0 auto",
  overflow: "hidden",
  boxSizing: "border-box",
  cursor: "pointer",
};

const commentReplyAvatarLinkStyle: CSSProperties = {
  ...commentAvatarLinkStyle,
  width: "28px",
  height: "28px",
  borderRadius: "10px",
  fontSize: "10.5px",
};

const commentContentStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

const commentTopLineStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "6px",
  minWidth: 0,
};

const commentAuthorLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const commentTimeStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  fontWeight: 750,
  whiteSpace: "nowrap",
};

const commentTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12.5px",
  lineHeight: 1.38,
  fontWeight: 750,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

const commentActionsRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const commentReplyButtonStyle: CSSProperties = {
  width: "fit-content",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0 0",
  cursor: "pointer",
};

const commentRemoveButtonStyle: CSSProperties = {
  ...commentReplyButtonStyle,
  color: "var(--historietas-danger-button-text, #FCA5A5)",
};

const commentReportButtonStyle: CSSProperties = {
  ...commentReplyButtonStyle,
};

const commentLikeWrapStyle: CSSProperties = {
  minWidth: "28px",
  display: "grid",
  justifyItems: "center",
  alignContent: "start",
  gap: "2px",
};

const commentLikeButtonStyle: CSSProperties = {
  width: "28px",
  height: "28px",
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  cursor: "pointer",
};

const commentLikeCountStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  lineHeight: 1,
  minHeight: "10px",
  textAlign: "center",
};

const commentHeartIconStyle: CSSProperties = {
  width: "19px",
  height: "19px",
  display: "block",
  flex: "0 0 auto",
  transformOrigin: "center",
};

const commentsLoadingStyle: CSSProperties = {
  width: "100%",
  minHeight: "58px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 850,
  boxSizing: "border-box",
};

const emptyCommentsStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 800,
  textAlign: "center",
};

const commentsSheetErrorStyle: CSSProperties = {
  display: "block",
  padding: "8px 10px",
  borderRadius: "14px",
  background: "rgba(239,68,68,0.12)",
  border: "1px solid rgba(248,113,113,0.24)",
  color: "#FCA5A5",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.35,
  textAlign: "center",
};

const commentsReplyingBannerStyle: CSSProperties = {
  minHeight: "30px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  padding: "5px 8px",
  borderRadius: "12px",
  background:
    "var(--historietas-secondary-surface, rgba(255,255,255,0.05))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10.5px",
  fontWeight: 800,
};

const commentsReplyingCancelStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontSize: "10.5px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "2px 0",
  cursor: "pointer",
};

const commentsToolsStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  padding: "5px 0 0",
};

const commentsQuickReactionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "6px",
  width: "100%",
  overflowX: "auto",
  padding: "0 1px",
  scrollbarWidth: "none",
  WebkitOverflowScrolling: "touch",
};

const commentsQuickReactionButtonStyle: CSSProperties = {
  width: "30px",
  height: "28px",
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  fontSize: "18px",
  lineHeight: 1,
  padding: 0,
  cursor: "pointer",
  flex: "0 0 auto",
};

const commentsSheetFormStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "30px minmax(0, 1fr) 28px 38px",
  alignItems: "center",
  gap: "7px",
  padding: "7px 0 0",
  minWidth: 0,
};

const commentsInputAvatarStyle: CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "11px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-page-background, #070212)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent)",
  color: "#FFFFFF",
  fontSize: "11.5px",
  fontWeight: 950,
  overflow: "hidden",
};

const commentsInputBoxStyle: CSSProperties = {
  minWidth: 0,
  minHeight: "38px",
  display: "flex",
  alignItems: "center",
};

const commentsSheetInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "38px",
  maxHeight: "82px",
  borderRadius: "999px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-page-background, #070212)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "9px 12px",
  outline: "none",
  fontSize: "12.5px",
  lineHeight: 1.32,
  fontWeight: 650,
  resize: "none",
  overflowY: "auto",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const commentsInputIconButtonStyle: CSSProperties = {
  width: "26px",
  height: "30px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "16px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: 0,
  cursor: "pointer",
};

const commentsSheetSendStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "999px",
  border:
    "1px solid var(--historietas-bottom-nav-publish-border, color-mix(in srgb, var(--historietas-accent, #F97316) 38%, transparent))",
  background:
    "var(--historietas-bottom-nav-publish-bg, var(--historietas-accent, #F97316))",
  color: "var(--historietas-list-comments-send-text, #FFFFFF)",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  fontFamily: "inherit",
  padding: 0,
};