"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, TouchEvent } from "react";
import { supabase } from "../../lib/supabase/client";
import { criarSlugBase, normalizarTexto } from "../../lib/utils";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";

type CategoriaComunidade =
  | "Geral"
  | "Divulgação"
  | "Recomendações"
  | "Discussão"
  | "Dúvidas";

type TipoPublicacaoComunidade =
  | "Discussão"
  | "Teoria"
  | "Enquete"
  | "Pedido de indicação"
  | "Divulgação"
  | "Review"
  | "Aviso de capítulo"
  | "Dúvida";

type UsuarioComunidade = {
  id: string;
  nome: string;
  email: string;
  avatar: string;
};

type ComentarioComunidade = {
  id: string;
  autorId: string;
  autorNome: string;
  autorAvatar: string;
  texto: string;
  criadoEm: string;
  curtidas: string[];
};

type PostComunidade = {
  id: string;
  autorId: string;
  autorNome: string;
  autorAvatar: string;
  categoria: CategoriaComunidade;
  tipoPublicacao: TipoPublicacaoComunidade;
  temSpoiler: boolean;
  texto: string;
  obraRelacionada: string;
  criadoEm: string;
  fixado: boolean;
  fixadoEm: string;
  fixadoPor: string;
  curtidas: string[];
  comentarios: ComentarioComunidade[];
};

type ObraRelacionadaSugestao = {
  id: string;
  titulo: string;
  autor: string;
  autorId: string;
  slug: string;
  link: string;
};

type PerfilComunidadeRow = Record<string, unknown>;

type AlvoDenunciaComunidade = "post" | "comentario";

type ResultadoVotosEnquete = Record<string, Record<string, number>>;

type SupabaseEnqueteVotoRow = {
  post_id: string | null;
  user_id: string | null;
  opcao: string | null;
};

type OrdenacaoComunidade = "Recentes" | "Em alta" | "Mais comentadas";
type TipoPublicacaoFiltro = TipoPublicacaoComunidade | "Todos";

const CATEGORIAS_COMUNIDADE: CategoriaComunidade[] = [
  "Geral",
  "Divulgação",
  "Recomendações",
  "Discussão",
  "Dúvidas",
];

const ORDENACOES_COMUNIDADE: OrdenacaoComunidade[] = [
  "Recentes",
  "Em alta",
  "Mais comentadas",
];

const TIPOS_PUBLICACAO_COMUNIDADE: TipoPublicacaoComunidade[] = [
  "Discussão",
  "Teoria",
  "Enquete",
  "Pedido de indicação",
  "Divulgação",
  "Review",
  "Aviso de capítulo",
  "Dúvida",
];

const CHAVE_POSTS_SALVOS_COMUNIDADE = "historietas:comunidade:posts-salvos";
const CHAVE_VOTOS_ENQUETES_COMUNIDADE = "historietas:comunidade:votos-enquetes";
const POSTS_COMUNIDADE_POR_PAGINA = 50;

function criarStorageKeyUsuarioComunidade(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

function carregarJsonUsuarioComunidade(chave: string, userId = "") {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioComunidade(chave, userIdLimpo);

    if (!chaveStorage) {
      return null;
    }

    const texto = window.localStorage.getItem(chaveStorage);

    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

function salvarJsonUsuarioComunidade(
  chave: string,
  userId: string,
  valor: unknown
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioComunidade(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    window.localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // localStorage é fallback; a Comunidade continua em memória.
  }
}

function erroTabelaOpcionalComunidadeIgnoravel(erro: unknown) {
  if (!erro || typeof erro !== "object") {
    return false;
  }

  const supabaseErro = erro as { code?: string; message?: string };
  const codigo = supabaseErro.code || "";
  const mensagem = (supabaseErro.message || "").toLowerCase();

  return (
    codigo === "42P01" ||
    codigo === "42703" ||
    mensagem.includes("does not exist") ||
    mensagem.includes("schema cache") ||
    mensagem.includes("could not find")
  );
}

function extrairPostIdSalvoComunidade(registro: Record<string, unknown>) {
  const valor = registro.post_id ?? registro.publicacao_id ?? registro.comunidade_post_id;

  return typeof valor === "string" && valor.trim() ? valor.trim() : "";
}

async function carregarPostsSalvosSupabaseComunidade(userId: string) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return null as string[] | null;
  }

  const tabelas = ["comunidade_salvos", "comunidade_post_salvos"] as const;

  for (const tabela of tabelas) {
    try {
      const { data, error } = await supabase
        .from(tabela)
        .select("post_id")
        .eq("user_id", userIdLimpo)
        .limit(5000);

      if (error) {
        if (erroTabelaOpcionalComunidadeIgnoravel(error)) {
          continue;
        }

        return null;
      }

      if (!Array.isArray(data)) {
        return [] as string[];
      }

      return Array.from(
        new Set(
          (data as Record<string, unknown>[])
            .map((registro) => extrairPostIdSalvoComunidade(registro))
            .filter(Boolean)
        )
      );
    } catch {
      continue;
    }
  }

  return null;
}

async function salvarPostSalvoSupabaseComunidade(
  userId: string,
  postId: string,
  ativo: boolean
) {
  const userIdLimpo = userId.trim();
  const postIdLimpo = postId.trim();

  if (!userIdLimpo || !postIdLimpo) {
    return false;
  }

  const tabelas = ["comunidade_salvos", "comunidade_post_salvos"] as const;

  for (const tabela of tabelas) {
    try {
      const { error: erroDelete } = await supabase
        .from(tabela)
        .delete()
        .eq("user_id", userIdLimpo)
        .eq("post_id", postIdLimpo);

      if (erroDelete) {
        if (erroTabelaOpcionalComunidadeIgnoravel(erroDelete)) {
          continue;
        }

        return false;
      }

      if (!ativo) {
        return true;
      }

      const { error: erroInsert } = await supabase.from(tabela).insert({
        user_id: userIdLimpo,
        post_id: postIdLimpo,
      });

      if (!erroInsert) {
        return true;
      }

      if (!erroTabelaOpcionalComunidadeIgnoravel(erroInsert)) {
        return false;
      }
    } catch {
      continue;
    }
  }

  return false;
}

const DESAFIO_SEMANA_COMUNIDADE = {
  titulo: "Primeiros leitores",
  pergunta: "Que tipo de história você quer encontrar no HISTORIETAS?",
};

const MIN_OPCOES_ENQUETE = 2;
const MAX_OPCOES_ENQUETE = 4;
const MODELO_ENQUETE_COMUNIDADE =
  "Enquete: qual opção você escolheria?\nOpção 1:\nOpção 2:";

function obterNomeUsuario(email: string, nomeProfile = "") {
  const nomeLimpo = nomeProfile.trim();

  if (nomeLimpo) {
    return nomeLimpo;
  }

  const nomeEmail = email.trim().split("@")[0];

  return nomeEmail || "Usuário";
}

function obterTextoProfileComunidade(
  profile: PerfilComunidadeRow | undefined,
  chave: string
) {
  if (!profile) {
    return "";
  }

  const valor = profile[chave];

  if (typeof valor === "string") {
    return valor.trim();
  }

  if (typeof valor === "number" || typeof valor === "boolean") {
    return String(valor);
  }

  return "";
}

function obterNomeProfileComunidade(profile: PerfilComunidadeRow | undefined) {
  return (
    obterTextoProfileComunidade(profile, "nome") ||
    obterTextoProfileComunidade(profile, "nome_usuario") ||
    obterTextoProfileComunidade(profile, "username") ||
    obterTextoProfileComunidade(profile, "display_name") ||
    obterTextoProfileComunidade(profile, "apelido")
  );
}

function obterAvatarProfileComunidade(profile: PerfilComunidadeRow | undefined) {
  return (
    obterTextoProfileComunidade(profile, "avatar_url") ||
    obterTextoProfileComunidade(profile, "avatar") ||
    obterTextoProfileComunidade(profile, "foto_url") ||
    obterTextoProfileComunidade(profile, "imagem_url") ||
    obterTextoProfileComunidade(profile, "photo_url")
  );
}

function criarAvatarComunidadeStyle(
  estiloBase: CSSProperties,
  avatar: string
): CSSProperties {
  const avatarLimpo = avatar.trim();

  if (!avatarLimpo) {
    return estiloBase;
  }

  return {
    ...estiloBase,
    backgroundImage: `url(${avatarLimpo})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "transparent",
    WebkitTextFillColor: "transparent",
  };
}

function criarLoginHrefComunidade() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/comunidade";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/comunidade";
  const params = new URLSearchParams({
    redirectTo: destinoSeguro,
  });

  return `/login?${params.toString()}`;
}

function criarPerfilHrefComunidade(userId: string, nomeUsuario: string) {
  const params = new URLSearchParams();
  const userIdLimpo = userId.trim();
  const nomeLimpo = nomeUsuario.trim();

  if (userIdLimpo) {
    params.set("userId", userIdLimpo);
    params.set("autorId", userIdLimpo);
  }

  if (nomeLimpo) {
    params.set("autor", nomeLimpo);
  }

  const query = params.toString();

  return query ? `/perfil-autor?${query}` : "/perfil-autor";
}


async function obterNomeSeguroUsuarioComunidade(usuario: UsuarioComunidade) {
  try {
    const profilesPorUsuario = await carregarProfilesComunidadePorUsuarios([
      usuario.id,
    ]);
    const profile = profilesPorUsuario.get(usuario.id);
    const nomeProfile = obterNomeProfileComunidade(profile);

    return obterNomeUsuario(usuario.email, nomeProfile || usuario.nome).slice(
      0,
      80
    );
  } catch {
    return obterNomeUsuario(usuario.email, usuario.nome).slice(0, 80);
  }
}

function formatarDataComunidade(dataIso: string) {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return "Agora";
  }

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function normalizarCategoria(valor: unknown): CategoriaComunidade {
  return CATEGORIAS_COMUNIDADE.includes(valor as CategoriaComunidade)
    ? (valor as CategoriaComunidade)
    : "Geral";
}

function normalizarTipoPublicacao(valor: unknown): TipoPublicacaoComunidade {
  return TIPOS_PUBLICACAO_COMUNIDADE.includes(valor as TipoPublicacaoComunidade)
    ? (valor as TipoPublicacaoComunidade)
    : "Discussão";
}

function criarLinkObraRelacionada(
  titulo: string,
  sugestoesObras: ObraRelacionadaSugestao[] = []
) {
  const tituloNormalizado = normalizarTexto(titulo);
  const obraRelacionada = sugestoesObras.find((obra) => {
    return normalizarTexto(obra.titulo) === tituloNormalizado;
  });

  if (obraRelacionada?.link?.trim()) {
    return obraRelacionada.link.trim();
  }

  if (obraRelacionada?.slug?.trim()) {
    return `/obra/${obraRelacionada.slug.trim()}`;
  }

  return `/obra/${criarSlugBase(titulo)}`;
}

function obterTipoPublicacaoPorParametro(valor: string) {
  const valorNormalizado = normalizarTexto(valor);

  if (!valorNormalizado) {
    return null;
  }

  return (
    TIPOS_PUBLICACAO_COMUNIDADE.find(
      (tipo) => normalizarTexto(tipo) === valorNormalizado
    ) || null
  );
}

function normalizarSugestaoObraLocal(valor: unknown, index: number) {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return null;
  }

  const obra = valor as Record<string, unknown>;
  const titulo =
    typeof obra.titulo === "string" && obra.titulo.trim()
      ? obra.titulo.trim()
      : "";

  if (!titulo || obra.publicado !== true) {
    return null;
  }

  const autor =
    typeof obra.autor === "string" && obra.autor.trim()
      ? obra.autor.trim()
      : "Autor não informado";

  const id =
    typeof obra.id === "string" && obra.id.trim()
      ? obra.id.trim()
      : `obra-local-${index}`;

  const autorId =
    typeof obra.autorId === "string" && obra.autorId.trim()
      ? obra.autorId.trim()
      : typeof obra.user_id === "string" && obra.user_id.trim()
        ? obra.user_id.trim()
        : "";

  const slug =
    typeof obra.slug === "string" && obra.slug.trim()
      ? obra.slug.trim()
      : criarSlugBase(titulo);

  const link =
    typeof obra.link === "string" && obra.link.trim()
      ? obra.link.trim()
      : `/obra/${slug}`;

  return {
    id,
    titulo,
    autor,
    autorId,
    slug,
    link,
  } satisfies ObraRelacionadaSugestao;
}

function carregarSugestoesObrasLocais(userId = "") {
  try {
    const obrasJson: unknown =
      carregarJsonUsuarioComunidade("historietas-obras", userId) || [];

    if (!Array.isArray(obrasJson)) {
      return [];
    }

    return obrasJson
      .map((obra, index) => normalizarSugestaoObraLocal(obra, index))
      .filter((obra): obra is ObraRelacionadaSugestao => Boolean(obra));
  } catch {
    return [];
  }
}

function removerSugestoesObrasDuplicadas(obrasBase: ObraRelacionadaSugestao[]) {
  const titulosRegistrados = new Set<string>();

  return obrasBase.filter((obra) => {
    const chaveTitulo = normalizarTexto(obra.titulo);

    if (!chaveTitulo || titulosRegistrados.has(chaveTitulo)) {
      return false;
    }

    titulosRegistrados.add(chaveTitulo);
    return true;
  });
}

function obterLinhasTexto(texto: string) {
  return texto
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean);
}

function obterTodasOpcoesEnquete(texto: string) {
  return obterLinhasTexto(texto)
    .map((linha) => {
      const match = /^(?:opção|opcao|alternativa)\s*\d*\s*[:\-]\s*(.+)$/i.exec(linha);

      return match?.[1]?.trim() || "";
    })
    .filter(Boolean);
}

function postEhEnquete(post: Pick<PostComunidade, "texto">) {
  const linhas = obterLinhasTexto(post.texto);
  const primeiraLinha = linhas[0] || "";
  const totalOpcoes = obterTodasOpcoesEnquete(post.texto).length;

  return (
    /^enquete\s*[:\-]/i.test(primeiraLinha) &&
    totalOpcoes >= MIN_OPCOES_ENQUETE
  );
}

function obterTipoVisualPublicacao(
  post: Pick<PostComunidade, "texto" | "tipoPublicacao">
): TipoPublicacaoComunidade {
  return postEhEnquete(post) ? "Enquete" : post.tipoPublicacao;
}

function obterPerguntaEnquete(texto: string) {
  const linhas = obterLinhasTexto(texto);
  const primeiraLinha = linhas[0] || "Enquete da comunidade";

  return (
    primeiraLinha.replace(/^enquete\s*[:\-]\s*/i, "").trim() ||
    "Enquete da comunidade"
  );
}

function obterOpcoesEnquete(texto: string) {
  const opcoes = obterTodasOpcoesEnquete(texto).slice(0, MAX_OPCOES_ENQUETE);

  return opcoes.length >= MIN_OPCOES_ENQUETE ? opcoes : [];
}

function carregarVotosEnquetesLocais(userId = "") {
  if (typeof window === "undefined" || !userId.trim()) {
    return {} as Record<string, string>;
  }

  try {
    const json: unknown =
      carregarJsonUsuarioComunidade(CHAVE_VOTOS_ENQUETES_COMUNIDADE, userId) ||
      {};

    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return {} as Record<string, string>;
    }

    return Object.fromEntries(
      Object.entries(json).filter((entrada): entrada is [string, string] => {
        return typeof entrada[0] === "string" && typeof entrada[1] === "string";
      })
    );
  } catch {
    return {} as Record<string, string>;
  }
}

function salvarVotosEnquetesLocais(votos: Record<string, string>, userId = "") {
  salvarJsonUsuarioComunidade(
    CHAVE_VOTOS_ENQUETES_COMUNIDADE,
    userId,
    votos
  );
}

function calcularTotalVotosEnquete(
  resultados: ResultadoVotosEnquete,
  postId: string
) {
  return Object.values(resultados[postId] || {}).reduce((total, quantidade) => {
    return total + quantidade;
  }, 0);
}

function calcularPorcentagemOpcaoEnquete(
  resultados: ResultadoVotosEnquete,
  postId: string,
  opcao: string
) {
  const total = calcularTotalVotosEnquete(resultados, postId);

  if (total <= 0) {
    return 0;
  }

  const quantidade = resultados[postId]?.[opcao] || 0;

  return Math.round((quantidade / total) * 100);
}

async function carregarVotosEnquetesSupabase(
  postIds: string[],
  usuarioId: string
) {
  const postIdsUnicos = Array.from(
    new Set(postIds.map((postId) => postId.trim()).filter(Boolean))
  );
  const usuarioIdLimpo = usuarioId.trim();

  if (postIdsUnicos.length === 0 || !usuarioIdLimpo) {
    return null;
  }

  try {
    const { data: meusVotosData, error: meusVotosError } = await supabase
      .from("comunidade_enquete_votos")
      .select("post_id, user_id, opcao")
      .in("post_id", postIdsUnicos)
      .eq("user_id", usuarioIdLimpo)
      .limit(5000);

    if (meusVotosError || !Array.isArray(meusVotosData)) {
      return null;
    }

    const meusVotos: Record<string, string> = {};

    (meusVotosData as unknown as SupabaseEnqueteVotoRow[]).forEach((voto) => {
      const postId = typeof voto.post_id === "string" ? voto.post_id : "";
      const opcao = typeof voto.opcao === "string" ? voto.opcao : "";

      if (postId && opcao) {
        meusVotos[postId] = opcao;
      }
    });

    const postIdsJaVotados = Object.keys(meusVotos);

    if (postIdsJaVotados.length === 0) {
      return {
        resultados: {},
        meusVotos,
      };
    }

    const { data, error } = await supabase
      .from("comunidade_enquete_votos")
      .select("post_id, user_id, opcao")
      .in("post_id", postIdsJaVotados)
      .limit(5000);

    if (error || !Array.isArray(data)) {
      return {
        resultados: {},
        meusVotos,
      };
    }

    const resultados: ResultadoVotosEnquete = {};

    (data as unknown as SupabaseEnqueteVotoRow[]).forEach((voto) => {
      const postId = typeof voto.post_id === "string" ? voto.post_id : "";
      const opcao = typeof voto.opcao === "string" ? voto.opcao : "";

      if (!postId || !opcao || !postIdsJaVotados.includes(postId)) {
        return;
      }

      resultados[postId] = {
        ...(resultados[postId] || {}),
        [opcao]: (resultados[postId]?.[opcao] || 0) + 1,
      };
    });

    return {
      resultados,
      meusVotos,
    };
  } catch {
    return null;
  }
}

function contarCurtidasUnicasPostComunidade(post: PostComunidade) {
  return new Set(
    post.curtidas.map((userId) => userId.trim()).filter(Boolean)
  ).size;
}

function contarComentaristasUnicosPostComunidade(post: PostComunidade) {
  return new Set(
    post.comentarios
      .map((comentario) => comentario.autorId.trim())
      .filter(Boolean)
  ).size;
}

function obterPontuacaoPost(post: PostComunidade) {
  return (
    contarCurtidasUnicasPostComunidade(post) * 2 +
    contarComentaristasUnicosPostComunidade(post) * 3
  );
}

function obterLinkPublicacaoComunidade(postId: string) {
  if (typeof window === "undefined") {
    return `/comunidade?post=${encodeURIComponent(postId)}`;
  }

  const url = new URL(window.location.href);
  url.pathname = "/comunidade";
  url.search = `?post=${encodeURIComponent(postId)}`;
  url.hash = "";

  return url.toString();
}

async function criarNotificacaoComunidadeSupabase({
  destinatarioId,
  tipo,
  titulo,
  mensagem,
  link,
  notificacaoId,
}: {
  destinatarioId: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  link: string;
  notificacaoId: string;
}) {
  const destinatarioIdLimpo = destinatarioId.trim();
  const tipoLimpo = tipo.trim();
  const tituloLimpo = titulo.trim();
  const mensagemLimpa = mensagem.trim();
  const linkLimpo = link.trim();
  const notificacaoIdLimpo = notificacaoId.trim();

  if (
    !idSupabaseValidoComunidade(destinatarioIdLimpo) ||
    !tipoLimpo ||
    !tituloLimpo ||
    !mensagemLimpa ||
    !linkLimpo ||
    !notificacaoIdLimpo
  ) {
    return false;
  }

  try {
    const { error } = await supabase.rpc("criar_notificacao_social", {
      p_user_id: destinatarioIdLimpo,
      p_tipo: tipoLimpo,
      p_titulo: tituloLimpo,
      p_mensagem: mensagemLimpa,
      p_link: linkLimpo,
      p_notificacao_id: notificacaoIdLimpo,
      p_obra_id: null,
      p_capitulo_id: null,
    });

    return !error;
  } catch {
    return false;
  }
}

async function copiarTextoComFallback(texto: string) {
  try {
    if (
      window.isSecureContext &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // Continua para o fallback abaixo.
  }

  let campoTemporario: HTMLTextAreaElement | null = null;

  try {
    campoTemporario = document.createElement("textarea");
    campoTemporario.value = texto;
    campoTemporario.setAttribute("readonly", "true");
    campoTemporario.style.position = "fixed";
    campoTemporario.style.top = "-9999px";
    campoTemporario.style.left = "-9999px";
    campoTemporario.style.width = "1px";
    campoTemporario.style.height = "1px";
    campoTemporario.style.opacity = "0";

    document.body.appendChild(campoTemporario);
    campoTemporario.focus();
    campoTemporario.select();
    campoTemporario.setSelectionRange(0, campoTemporario.value.length);

    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    if (campoTemporario?.parentNode) {
      campoTemporario.parentNode.removeChild(campoTemporario);
    }
  }
}

type SupabaseObraPublicaRow = {
  id: string;
  user_id: string | null;
  titulo: string | null;
  autor: string | null;
  publicado: boolean | null;
  slug: string | null;
  link: string | null;
};

type SupabasePostRow = {
  id: string;
  autor_id: string;
  autor_nome: string;
  categoria: string;
  tipo_publicacao: string | null;
  tem_spoiler: boolean | null;
  texto: string;
  obra_relacionada: string | null;
  criado_em: string;
  fixado: boolean | null;
  fixado_em: string | null;
  fixado_por: string | null;
};

type SupabaseComentarioRow = {
  id: string;
  post_id: string;
  autor_id: string;
  autor_nome: string;
  texto: string;
  criado_em: string;
};

type SupabaseCurtidaRow = {
  post_id: string;
  usuario_id: string;
};

type SupabaseComentarioCurtidaRow = {
  comentario_id: string;
  usuario_id: string;
};

function mapearComentarioSupabase(
  comentario: SupabaseComentarioRow,
  curtidasPorComentario: Map<string, string[]>,
  profilesPorUsuario = new Map<string, PerfilComunidadeRow>()
): ComentarioComunidade {
  const profile = profilesPorUsuario.get(comentario.autor_id);
  const autorNome =
    obterNomeProfileComunidade(profile) || comentario.autor_nome?.trim() || "Usuário";

  return {
    id: comentario.id,
    autorId: comentario.autor_id,
    autorNome,
    autorAvatar: obterAvatarProfileComunidade(profile),
    texto: comentario.texto.trim().slice(0, 420),
    criadoEm: comentario.criado_em,
    curtidas: curtidasPorComentario.get(comentario.id) || [],
  };
}

function mapearPostSupabase(
  post: SupabasePostRow,
  comentariosPorPost: Map<string, ComentarioComunidade[]>,
  curtidasPorPost: Map<string, string[]>,
  profilesPorUsuario = new Map<string, PerfilComunidadeRow>()
): PostComunidade {
  const profile = profilesPorUsuario.get(post.autor_id);
  const autorNome =
    obterNomeProfileComunidade(profile) || post.autor_nome?.trim() || "Usuário";

  return {
    id: post.id,
    autorId: post.autor_id,
    autorNome,
    autorAvatar: obterAvatarProfileComunidade(profile),
    categoria: normalizarCategoria(post.categoria),
    tipoPublicacao: normalizarTipoPublicacao(post.tipo_publicacao),
    temSpoiler: Boolean(post.tem_spoiler),
    texto: post.texto.trim().slice(0, 700),
    obraRelacionada: (post.obra_relacionada || "").trim().slice(0, 90),
    criadoEm: post.criado_em,
    fixado: Boolean(post.fixado),
    fixadoEm: post.fixado_em || "",
    fixadoPor: post.fixado_por || "",
    curtidas: curtidasPorPost.get(post.id) || [],
    comentarios: comentariosPorPost.get(post.id) || [],
  };
}

function mapearPostsSupabase(
  postsSupabase: SupabasePostRow[],
  comentariosSupabase: SupabaseComentarioRow[],
  curtidasSupabase: SupabaseCurtidaRow[],
  comentarioCurtidasSupabase: SupabaseComentarioCurtidaRow[],
  profilesPorUsuario = new Map<string, PerfilComunidadeRow>()
) {
  const comentariosPorPost = new Map<string, ComentarioComunidade[]>();
  const curtidasPorPost = new Map<string, string[]>();
  const curtidasPorComentario = new Map<string, string[]>();

  comentarioCurtidasSupabase.forEach((curtida) => {
    const curtidasAtuais = curtidasPorComentario.get(curtida.comentario_id) || [];

    if (!curtidasAtuais.includes(curtida.usuario_id)) {
      curtidasPorComentario.set(curtida.comentario_id, [
        ...curtidasAtuais,
        curtida.usuario_id,
      ]);
    }
  });

  comentariosSupabase.forEach((comentarioSupabase) => {
    const comentario = mapearComentarioSupabase(
      comentarioSupabase,
      curtidasPorComentario,
      profilesPorUsuario
    );
    const comentariosAtuais =
      comentariosPorPost.get(comentarioSupabase.post_id) || [];

    comentariosPorPost.set(comentarioSupabase.post_id, [
      ...comentariosAtuais,
      comentario,
    ]);
  });

  curtidasSupabase.forEach((curtida) => {
    const curtidasAtuais = curtidasPorPost.get(curtida.post_id) || [];

    if (!curtidasAtuais.includes(curtida.usuario_id)) {
      curtidasPorPost.set(curtida.post_id, [
        ...curtidasAtuais,
        curtida.usuario_id,
      ]);
    }
  });

  return postsSupabase.map((post) =>
    mapearPostSupabase(post, comentariosPorPost, curtidasPorPost, profilesPorUsuario)
  );
}

function formatarErroSupabase(acao: string, erro: unknown) {
  if (!erro || typeof erro !== "object") {
    return `${acao}: erro desconhecido.`;
  }

  const supabaseErro = erro as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };

  const detalhes = [
    supabaseErro.message,
    supabaseErro.code ? `código ${supabaseErro.code}` : "",
    supabaseErro.details,
    supabaseErro.hint,
  ]
    .filter(Boolean)
    .join(" · ");

  return detalhes ? `${acao}: ${detalhes}` : `${acao}: erro desconhecido.`;
}


function erroEhSessaoAusenteComunidade(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const erro = error as {
    name?: unknown;
    message?: unknown;
  };

  const nome = typeof erro.name === "string" ? erro.name : "";
  const mensagem = typeof erro.message === "string" ? erro.message : "";

  return (
    nome === "AuthSessionMissingError" ||
    mensagem.toLowerCase().includes("auth session missing")
  );
}

function idSupabaseValidoComunidade(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id.trim()
  );
}

async function carregarProfilesComunidadePorUsuarios(userIds: string[]) {
  const idsValidos = Array.from(
    new Set(
      userIds
        .map((id) => id.trim())
        .filter((id) => idSupabaseValidoComunidade(id))
    )
  );
  const profilesPorUsuario = new Map<string, PerfilComunidadeRow>();

  if (idsValidos.length === 0) {
    return profilesPorUsuario;
  }

  try {
    const { data } = await supabase
      .from("profiles")
      .select("id,user_id,nome,avatar_url")
      .in("user_id", idsValidos)
      .limit(1000);

    if (Array.isArray(data)) {
      (data as unknown as PerfilComunidadeRow[]).forEach((profile) => {
        const profileUserId = obterTextoProfileComunidade(profile, "user_id");

        if (profileUserId) {
          profilesPorUsuario.set(profileUserId, profile);
        }
      });
    }
  } catch {
    // Algumas bases antigas usam id no lugar de user_id. O fallback vem abaixo.
  }

  const idsSemProfile = idsValidos.filter(
    (userId) => !profilesPorUsuario.has(userId)
  );

  if (idsSemProfile.length > 0) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id,user_id,nome,avatar_url")
        .in("id", idsSemProfile)
        .limit(1000);

      if (Array.isArray(data)) {
        (data as unknown as PerfilComunidadeRow[]).forEach((profile) => {
          const profileUserId =
            obterTextoProfileComunidade(profile, "user_id") ||
            obterTextoProfileComunidade(profile, "id");

          if (profileUserId) {
            profilesPorUsuario.set(profileUserId, profile);
          }
        });
      }
    } catch {
      // Profiles é complementar; a Comunidade segue com o nome salvo no post.
    }
  }

  return profilesPorUsuario;
}

function obterObraRelacionadaParaDiario(
  titulo: string,
  sugestoesObras: ObraRelacionadaSugestao[]
) {
  const tituloNormalizado = normalizarTexto(titulo);

  if (!tituloNormalizado) {
    return null;
  }

  return (
    sugestoesObras.find((obra) => {
      return normalizarTexto(obra.titulo) === tituloNormalizado;
    }) || null
  );
}

async function removerReviewComunidadeDoDiario({
  userId,
  postId,
}: {
  userId: string;
  postId: string;
}) {
  const userIdLimpo = userId.trim();
  const postIdLimpo = postId.trim();

  if (!userIdLimpo || !postIdLimpo) {
    return;
  }

  try {
    const { error } = await supabase
      .from("diario_atividades")
      .delete()
      .eq("user_id", userIdLimpo)
      .eq("tipo", "publicou_review")
      .contains("metadata", { post_id: postIdLimpo });

    if (!error) {
      return;
    }

    const { error: erroFallback } = await supabase
      .from("diario_atividades")
      .delete()
      .eq("user_id", userIdLimpo)
      .eq("tipo", "publicou_review")
      .eq("metadata->>post_id", postIdLimpo);

    if (erroFallback) {
      console.warn(
        "Não consegui remover a review do Diário:",
        erroFallback.message
      );
    }
  } catch (error) {
    console.warn("Não consegui acessar o Diário para remover a review:", error);
  }
}

async function registrarReviewComunidadeNoDiario({
  userId,
  texto,
  obraRelacionada,
  postId,
  sugestoesObras,
}: {
  userId: string;
  texto: string;
  obraRelacionada: string;
  postId: string;
  sugestoesObras: ObraRelacionadaSugestao[];
}) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo || !postId.trim()) {
    return;
  }

  try {
    await removerReviewComunidadeDoDiario({
      userId: userIdLimpo,
      postId,
    });

    const obraDiario = obterObraRelacionadaParaDiario(
      obraRelacionada,
      sugestoesObras
    );
    const obraId = obraDiario?.id?.trim() || "";
    const registroDiario: {
      user_id: string;
      tipo: "publicou_review";
      texto: string;
      visibilidade: "publico";
      metadata: {
        post_id: string;
        obra_relacionada: string;
        origem: "comunidade";
      };
      obra_id?: string;
    } = {
      user_id: userIdLimpo,
      tipo: "publicou_review",
      texto: texto.trim().slice(0, 420),
      visibilidade: "publico",
      metadata: {
        post_id: postId,
        obra_relacionada: obraRelacionada.trim().slice(0, 90),
        origem: "comunidade",
      },
    };

    if (obraId && idSupabaseValidoComunidade(obraId)) {
      registroDiario.obra_id = obraId;
    }

    await supabase.from("diario_atividades").insert(registroDiario);
  } catch {
    // A publicação na Comunidade não deve falhar se o Diário não registrar.
  }
}

type ComentariosSheetProps = {
  post: PostComunidade | null;
  podeComentar: boolean;
  usuarioId: string;
  usuarioNome: string;
  usuarioAvatar: string;
  erroInteracao: string;
  onFechar: () => void;
  onEnviar: (postId: string, texto: string) => boolean | Promise<boolean>;
  onCurtirComentario: (postId: string, comentarioId: string) => void | Promise<void>;
  onRemoverComentario: (postId: string, comentarioId: string) => void | Promise<void>;
  onDenunciarComentario: (comentarioId: string) => void | Promise<void>;
};

const ComentariosSheet = memo(function ComentariosSheet({
  post,
  podeComentar,
  usuarioId,
  usuarioNome,
  usuarioAvatar,
  erroInteracao,
  onFechar,
  onEnviar,
  onCurtirComentario,
  onRemoverComentario,
  onDenunciarComentario,
}: ComentariosSheetProps) {
  const comentarioRef = useRef<HTMLTextAreaElement | null>(null);
  const sheetRef = useRef<HTMLElement | null>(null);
  const dragStartYRef = useRef(0);
  const dragOffsetYRef = useRef(0);
  const [sheetExpandido, setSheetExpandido] = useState(false);
  const [comentarioEnviando, setComentarioEnviando] = useState(false);
  const [comentarioCurtindoId, setComentarioCurtindoId] = useState<string | null>(null);
  const [comentarioRemovendoId, setComentarioRemovendoId] = useState<
    string | null
  >(null);
  const [comentarioDenunciandoId, setComentarioDenunciandoId] = useState<
    string | null
  >(null);
  const comentarioAcoesRef = useRef<Set<string>>(new Set<string>());


  function inserirNoComentario(valor: string) {
    if (!podeComentar || !comentarioRef.current) {
      return;
    }

    const campo = comentarioRef.current;
    const inicio = campo.selectionStart ?? campo.value.length;
    const fim = campo.selectionEnd ?? campo.value.length;
    const textoAtual = campo.value;

    campo.value = `${textoAtual.slice(0, inicio)}${valor}${textoAtual.slice(fim)}`;
    campo.focus();

    const novaPosicao = inicio + valor.length;
    campo.setSelectionRange(novaPosicao, novaPosicao);
  }

  function iniciarAcaoComentario(chave: string) {
    if (comentarioAcoesRef.current.has(chave)) {
      return false;
    }

    comentarioAcoesRef.current.add(chave);
    return true;
  }

  function finalizarAcaoComentario(chave: string) {
    comentarioAcoesRef.current.delete(chave);
  }

  async function curtirComentarioSeguro(postId: string, comentarioId: string) {
    const chaveAcao = `curtir-comentario:${comentarioId}`;

    if (!iniciarAcaoComentario(chaveAcao)) {
      return;
    }

    setComentarioCurtindoId(comentarioId);

    try {
      await onCurtirComentario(postId, comentarioId);
    } finally {
      finalizarAcaoComentario(chaveAcao);
      setComentarioCurtindoId((comentarioAtualId) =>
        comentarioAtualId === comentarioId ? null : comentarioAtualId
      );
    }
  }

  async function removerComentarioSeguro(postId: string, comentarioId: string) {
    const chaveAcao = `remover-comentario:${comentarioId}`;

    if (!iniciarAcaoComentario(chaveAcao)) {
      return;
    }

    setComentarioRemovendoId(comentarioId);

    try {
      await onRemoverComentario(postId, comentarioId);
    } finally {
      finalizarAcaoComentario(chaveAcao);
      setComentarioRemovendoId((comentarioAtualId) =>
        comentarioAtualId === comentarioId ? null : comentarioAtualId
      );
    }
  }

  async function denunciarComentarioSeguro(comentarioId: string) {
    const chaveAcao = `denunciar-comentario:${comentarioId}`;

    if (!iniciarAcaoComentario(chaveAcao)) {
      return;
    }

    setComentarioDenunciandoId(comentarioId);

    try {
      await onDenunciarComentario(comentarioId);
    } finally {
      finalizarAcaoComentario(chaveAcao);
      setComentarioDenunciandoId((comentarioAtualId) =>
        comentarioAtualId === comentarioId ? null : comentarioAtualId
      );
    }
  }

  function responderComentario(nomeAutor: string) {
    if (!podeComentar) {
      return;
    }

    const mencao = `@${nomeAutor.replace(/\s+/g, " ").trim()} `;

    window.setTimeout(() => {
      if (!comentarioRef.current) {
        return;
      }

      comentarioRef.current.value = mencao;
      comentarioRef.current.focus();
      comentarioRef.current.setSelectionRange(mencao.length, mencao.length);
    }, 0);
  }

  function iniciarArraste(event: TouchEvent<HTMLDivElement>) {
    dragStartYRef.current = event.touches[0]?.clientY || 0;
    dragOffsetYRef.current = 0;

    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  }

  function moverArraste(event: TouchEvent<HTMLDivElement>) {
    const posicaoAtual = event.touches[0]?.clientY || dragStartYRef.current;
    const limiteSuperior = sheetExpandido ? -46 : -58;
    const limiteInferior = sheetExpandido ? 112 : 132;
    const deslocamento = Math.max(
      limiteSuperior,
      Math.min(limiteInferior, posicaoAtual - dragStartYRef.current)
    );

    dragOffsetYRef.current = deslocamento;

    if (sheetRef.current) {
      const handle = sheetRef.current.querySelector(
        "[data-comments-sheet-handle='true']"
      ) as HTMLElement | null;

      if (handle) {
        handle.style.transform = `translate3d(0, ${deslocamento}px, 0)`;
      }
    }
  }

  function finalizarArraste() {
    const deslocamento = dragOffsetYRef.current;

    if (sheetRef.current) {
      const handle = sheetRef.current.querySelector(
        "[data-comments-sheet-handle='true']"
      ) as HTMLElement | null;

      if (handle) {
        handle.style.transition = "transform 160ms ease";
        handle.style.transform = "";
      }
    }

    if (deslocamento < -34) {
      setSheetExpandido(true);
      return;
    }

    if (deslocamento > 52 && sheetExpandido) {
      setSheetExpandido(false);
      return;
    }

    if (deslocamento > 118 && !sheetExpandido) {
      onFechar();
    }
  }

  if (!post) {
    return null;
  }

  async function enviarComentario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!post) {
      return;
    }

    const chaveAcao = `enviar-comentario:${post.id}`;

    if (!iniciarAcaoComentario(chaveAcao)) {
      return;
    }

    setComentarioEnviando(true);

    try {
      const conteudoComentario = comentarioRef.current?.value || "";
      const enviado = await onEnviar(post.id, conteudoComentario);

      if (enviado && comentarioRef.current) {
        comentarioRef.current.value = "";
      }
    } finally {
      finalizarAcaoComentario(chaveAcao);
      setComentarioEnviando(false);
    }
  }

  return (
    <section style={commentsSheetOverlayStyle} aria-label="Comentários">
      <button
        type="button"
        aria-label="Fechar comentários"
        onClick={onFechar}
        style={commentsSheetBackdropStyle}
      />

      <article
        ref={sheetRef}
        style={{
          ...commentsSheetStyle,
          ...(sheetExpandido
            ? commentsSheetExpandedStyle
            : commentsSheetCompactStyle),
        }}
      >
        <div
          data-comments-sheet-handle="true"
          style={commentsSheetHandleWrapStyle}
          onTouchStart={iniciarArraste}
          onTouchMove={moverArraste}
          onTouchEnd={finalizarArraste}
          onTouchCancel={finalizarArraste}
        >
          <div style={commentsSheetHandleStyle} />
        </div>

        <header style={commentsSheetHeaderStyle}>
          <span style={commentsSheetHeaderSpacerStyle} aria-hidden="true" />

          <strong style={commentsSheetTitleStyle}>
            {post.comentarios.length === 1
              ? "1 comentário"
              : `${post.comentarios.length} comentários`}
          </strong>

          <button type="button" onClick={onFechar} style={commentsSheetCloseStyle}>
            ×
          </button>
        </header>

        <section style={commentsSheetListStyle}>
          {post.comentarios.length > 0 ? (
            post.comentarios.map((comentario) => {
              const usuarioCurtiuComentario = Boolean(
                usuarioId && comentario.curtidas.includes(usuarioId)
              );
              const podeRemoverComentario = Boolean(
                usuarioId && comentario.autorId === usuarioId
              );
              const podeDenunciarComentario = Boolean(
                usuarioId && comentario.autorId !== usuarioId
              );
              const comentarioCurtindo = comentarioCurtindoId === comentario.id;
              const comentarioRemovendo = comentarioRemovendoId === comentario.id;
              const comentarioDenunciando =
                comentarioDenunciandoId === comentario.id;

              return (
              <article key={comentario.id} style={commentItemStyle}>
                <Link
                  href={criarPerfilHrefComunidade(
                    comentario.autorId,
                    comentario.autorNome
                  )}
                  aria-label={`Abrir perfil de ${comentario.autorNome}`}
                  style={criarAvatarComunidadeStyle(
                    commentAvatarLinkStyle,
                    comentario.autorAvatar
                  )}
                >
                  {!comentario.autorAvatar && comentario.autorNome.slice(0, 1).toUpperCase()}
                </Link>

                <div style={commentContentStyle}>
                  <div style={commentTopLineStyle}>
                    <Link
                      href={criarPerfilHrefComunidade(
                        comentario.autorId,
                        comentario.autorNome
                      )}
                      style={commentAuthorLinkStyle}
                    >
                      {comentario.autorNome}
                    </Link>
                    <span style={commentTimeStyle}>agora</span>
                  </div>

                  <p style={commentTextStyle}>{comentario.texto}</p>

                  <div style={commentActionsRowStyle}>
                    <button
                      type="button"
                      onClick={() => responderComentario(comentario.autorNome)}
                      disabled={!podeComentar}
                      style={{
                        ...commentReplyButtonStyle,
                        opacity: podeComentar ? 1 : 0.52,
                        cursor: podeComentar ? "pointer" : "not-allowed",
                      }}
                    >
                      Responder
                    </button>

                    {podeRemoverComentario && (
                      <button
                        type="button"
                        onClick={() => removerComentarioSeguro(post.id, comentario.id)}
                        disabled={comentarioRemovendo}
                        style={{
                          ...commentRemoveButtonStyle,
                          opacity: comentarioRemovendo ? 0.58 : 1,
                          cursor: comentarioRemovendo ? "not-allowed" : "pointer",
                        }}
                      >
                        {comentarioRemovendo ? "Removendo..." : "Remover"}
                      </button>
                    )}

                    {podeDenunciarComentario && (
                      <button
                        type="button"
                        onClick={() => denunciarComentarioSeguro(comentario.id)}
                        disabled={comentarioDenunciando}
                        style={{
                          ...commentReportButtonStyle,
                          opacity: comentarioDenunciando ? 0.58 : 1,
                          cursor: comentarioDenunciando ? "not-allowed" : "pointer",
                        }}
                      >
                        {comentarioDenunciando ? "Enviando..." : "Denunciar"}
                      </button>
                    )}
                  </div>
                </div>

                <div style={commentLikeWrapStyle}>
                  <button
                    type="button"
                    aria-label={
                      usuarioCurtiuComentario
                        ? "Remover curtida do comentário"
                        : "Curtir comentário"
                    }
                    onClick={() => curtirComentarioSeguro(post.id, comentario.id)}
                    disabled={!podeComentar || comentarioCurtindo}
                    style={{
                      ...commentLikeButtonStyle,
                      opacity: podeComentar && !comentarioCurtindo ? 1 : 0.58,
                      cursor:
                        podeComentar && !comentarioCurtindo
                          ? "pointer"
                          : "not-allowed",
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      style={commentHeartIconStyle}
                    >
                      <path
                        d="M20.7 5.3c-1.8-1.9-4.7-1.9-6.5 0L12 7.6 9.8 5.3c-1.8-1.9-4.7-1.9-6.5 0-1.8 1.9-1.8 5 0 6.9L12 21l8.7-8.8c1.8-1.9 1.8-5 0-6.9Z"
                        fill={usuarioCurtiuComentario ? "#F43F5E" : "none"}
                        stroke={
                          usuarioCurtiuComentario
                            ? "#F43F5E"
                            : "var(--historietas-text-secondary, #D4D4D8)"
                        }
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
            })
          ) : (
            <p
              style={{
                margin: "10px 0 0",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 800,
                textAlign: "center",
              }}
            >
              Sem comentários ainda
            </p>
          )}
        </section>

        {erroInteracao && (
          <span style={commentsSheetErrorStyle}>{erroInteracao}</span>
        )}

        <section style={commentsToolsStyle}>
          <div style={commentsQuickReactionsStyle}>
            {["💜", "🔥", "😂", "😮", "😭", "👏"].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => inserirNoComentario(emoji)}
                disabled={!podeComentar}
                style={commentsQuickReactionButtonStyle}
              >
                {emoji}
              </button>
            ))}
          </div>
        </section>

        <form onSubmit={enviarComentario} style={commentsSheetFormStyle}>
          <div
            style={criarAvatarComunidadeStyle(
              commentsInputAvatarStyle,
              podeComentar ? usuarioAvatar : ""
            )}
          >
            {!(podeComentar && usuarioAvatar) &&
              (podeComentar ? usuarioNome : "H").slice(0, 1).toUpperCase()}
          </div>

          <div style={commentsInputBoxStyle}>
            <textarea
              ref={comentarioRef}
              placeholder={
                podeComentar ? "Adicionar comentário..." : "Entre para comentar."
              }
              disabled={!podeComentar || comentarioEnviando}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              enterKeyHint="send"
              maxLength={420}
              rows={1}
              style={commentsSheetInputStyle}
            />
          </div>

          <button
            type="button"
            onClick={() => inserirNoComentario("@")}
            disabled={!podeComentar}
            style={commentsInputIconButtonStyle}
          >
            @
          </button>

          <button
            type="submit"
            aria-label="Enviar comentário"
            disabled={!podeComentar || comentarioEnviando}
            style={{
              ...commentsSheetSendStyle,
              opacity: podeComentar && !comentarioEnviando ? 1 : 0.58,
              cursor:
                podeComentar && !comentarioEnviando ? "pointer" : "not-allowed",
            }}
          >
            {comentarioEnviando ? "..." : "↑"}
          </button>
        </form>
      </article>
    </section>
  );
});

export default function ComunidadePage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioComunidade | null>(null);
  const [usuarioEhAdmin, setUsuarioEhAdmin] = useState(false);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);
  const [posts, setPosts] = useState<PostComunidade[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaComunidade | "Todos">(
    "Todos"
  );
  const [tipoPublicacaoAtiva, setTipoPublicacaoAtiva] =
    useState<TipoPublicacaoFiltro>("Todos");
  const [categoriaPost, setCategoriaPost] =
    useState<CategoriaComunidade>("Geral");
  const [tipoPublicacaoPost, setTipoPublicacaoPost] =
    useState<TipoPublicacaoComunidade>("Discussão");
  const [temSpoilerPost, setTemSpoilerPost] = useState(false);
  const [spoilersReveladosIds, setSpoilersReveladosIds] = useState<string[]>([]);
  const [termoBusca, setTermoBusca] = useState("");
  const termoBuscaAdiado = useDeferredValue(termoBusca);
  const [ordenacaoAtiva, setOrdenacaoAtiva] =
    useState<OrdenacaoComunidade>("Recentes");
  const [mostrarApenasSalvos, setMostrarApenasSalvos] = useState(false);
  const [postsSalvosIds, setPostsSalvosIds] = useState<string[]>([]);
  const [votosEnquetes, setVotosEnquetes] = useState<Record<string, string>>({});
  const [resultadosEnquetes, setResultadosEnquetes] =
    useState<ResultadoVotosEnquete>({});
  const [votandoEnqueteId, setVotandoEnqueteId] = useState<string | null>(null);
  const [feedbackAcao, setFeedbackAcao] = useState("");
  const [publicandoPost, setPublicandoPost] = useState(false);
  const [postCurtindoId, setPostCurtindoId] = useState<string | null>(null);
  const [postSalvandoId, setPostSalvandoId] = useState<string | null>(null);
  const [postCompartilhandoId, setPostCompartilhandoId] = useState<
    string | null
  >(null);
  const [postRemovendoId, setPostRemovendoId] = useState<string | null>(null);
  const [postFixandoId, setPostFixandoId] = useState<string | null>(null);
  const [postMenuAbertoId, setPostMenuAbertoId] = useState<string | null>(null);
  const [denunciaEnviandoId, setDenunciaEnviandoId] = useState<string | null>(
    null
  );
  const [carregandoFeed, setCarregandoFeed] = useState(true);
  const [paginaFeedComunidade, setPaginaFeedComunidade] = useState(0);
  const [temMaisPostsComunidade, setTemMaisPostsComunidade] = useState(false);
  const [carregandoMaisPostsComunidade, setCarregandoMaisPostsComunidade] = useState(false);
  const [erro, setErro] = useState("");
  const [comentariosPostId, setComentariosPostId] = useState<string | null>(null);
  const [obraRelacionadaBusca, setObraRelacionadaBusca] = useState("");
  const [obrasRelacionadasSugestoes, setObrasRelacionadasSugestoes] = useState<
    ObraRelacionadaSugestao[]
  >([]);
  const [sugestoesObrasAbertas, setSugestoesObrasAbertas] = useState(false);
  const textoPostRef = useRef<HTMLTextAreaElement | null>(null);
  const obraRelacionadaRef = useRef<HTMLInputElement | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const acoesComunidadeRef = useRef<Set<string>>(new Set<string>());
  const parametrosComunidadeAplicadosRef = useRef(false);
  const comentarioUrlAplicadoRef = useRef(false);
  const [composerAberto, setComposerAberto] = useState(false);
  const [menuAcoesRapidasComunidadeAberto, setMenuAcoesRapidasComunidadeAberto] =
    useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const atualizarModoDesktop = () => {
      setIsDesktop(mediaQuery.matches);
    };

    const atualizarModoDesktopTimer = window.setTimeout(
      atualizarModoDesktop,
      0
    );

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", atualizarModoDesktop);

      return () => {
        window.clearTimeout(atualizarModoDesktopTimer);
        mediaQuery.removeEventListener("change", atualizarModoDesktop);
      };
    }

    mediaQuery.addListener(atualizarModoDesktop);

    return () => {
      window.clearTimeout(atualizarModoDesktopTimer);
      mediaQuery.removeListener(atualizarModoDesktop);
    };
  }, []);

  useEffect(() => {
    const userId = usuario?.id || "";
    let cancelado = false;

    const carregarLocaisTimer = window.setTimeout(() => {
      try {
        const postsSalvosParseados =
          carregarJsonUsuarioComunidade(CHAVE_POSTS_SALVOS_COMUNIDADE, userId) ||
          [];

        if (Array.isArray(postsSalvosParseados)) {
          setPostsSalvosIds(
            postsSalvosParseados.filter(
              (postId): postId is string => typeof postId === "string"
            )
          );
        } else {
          setPostsSalvosIds([]);
        }
      } catch {
        setPostsSalvosIds([]);
      }

      setVotosEnquetes(carregarVotosEnquetesLocais(userId));

      if (!userId) {
        return;
      }

      void carregarPostsSalvosSupabaseComunidade(userId).then((postsSalvosReais) => {
        if (cancelado || !postsSalvosReais) {
          return;
        }

        setPostsSalvosIds(postsSalvosReais);
        salvarJsonUsuarioComunidade(
          CHAVE_POSTS_SALVOS_COMUNIDADE,
          userId,
          postsSalvosReais
        );
      });
    }, 0);

    return () => {
      cancelado = true;
      window.clearTimeout(carregarLocaisTimer);
    };
  }, [usuario?.id]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregarVotosReaisEnquetes() {
      const postsEnqueteIds = posts
        .filter((post) => postEhEnquete(post))
        .map((post) => post.id)
        .filter(Boolean);

      if (postsEnqueteIds.length === 0) {
        window.setTimeout(() => {
          if (!cancelado) {
            setResultadosEnquetes({});
          }
        }, 0);
        return;
      }

      const votosLocais = carregarVotosEnquetesLocais(usuario?.id || "");

      window.setTimeout(() => {
        if (!cancelado) {
          setVotosEnquetes((votosAtuais) => ({
            ...votosLocais,
            ...votosAtuais,
          }));
        }
      }, 0);

      if (!usuario?.id) {
        return;
      }

      const votosReais = await carregarVotosEnquetesSupabase(
        postsEnqueteIds,
        usuario.id
      );

      if (cancelado || !votosReais) {
        return;
      }

      window.setTimeout(() => {
        if (cancelado) {
          return;
        }

        setResultadosEnquetes(votosReais.resultados);

        setVotosEnquetes((votosAtuais) => {
          const votosAtualizados = {
            ...votosAtuais,
            ...votosReais.meusVotos,
          };

          salvarVotosEnquetesLocais(votosAtualizados, usuario.id);

          return votosAtualizados;
        });
      }, 0);
    }

    void carregarVotosReaisEnquetes();

    return () => {
      cancelado = true;
    };
  }, [posts, usuario?.id]);

  useEffect(() => {
    let cancelado = false;

    async function carregarUsuario() {
      window.setTimeout(() => {
        if (!cancelado) {
          setCarregandoUsuario(true);
        }
      }, 0);

      try {
        const { data, error: usuarioErro } = await supabase.auth.getUser();

        if (usuarioErro) {
          if (!erroEhSessaoAusenteComunidade(usuarioErro)) {
            console.warn(
              "Não consegui carregar usuário da Comunidade:",
              usuarioErro.message
            );
          }

          window.setTimeout(() => {
            if (!cancelado) {
              setUsuario(null);
              setUsuarioEhAdmin(false);
            }
          }, 0);

          return;
        }

        const user = data.user || null;

        if (!user) {
          window.setTimeout(() => {
            if (!cancelado) {
              setUsuario(null);
              setUsuarioEhAdmin(false);
            }
          }, 0);

          return;
        }

        let nomeProfile = "";
        let avatarProfile = "";
        let usuarioAdmin = false;

        try {
          const profilesPorUsuario = await carregarProfilesComunidadePorUsuarios([
            user.id,
          ]);
          const profile = profilesPorUsuario.get(user.id);

          nomeProfile = obterNomeProfileComunidade(profile);
          avatarProfile = obterAvatarProfileComunidade(profile);
        } catch {
          nomeProfile = "";
          avatarProfile = "";
        }

        try {
          const { data: adminData } = await supabase.rpc("usuario_e_admin");
          usuarioAdmin = adminData === true;
        } catch {
          usuarioAdmin = false;
        }

        window.setTimeout(() => {
          if (!cancelado) {
            setUsuarioEhAdmin(usuarioAdmin);
            setUsuario({
              id: user.id,
              email: user.email || "",
              nome: obterNomeUsuario(user.email || "", nomeProfile),
              avatar: avatarProfile,
            });
          }
        }, 0);
      } catch (error) {
        if (!erroEhSessaoAusenteComunidade(error)) {
          console.warn("Não consegui iniciar usuário da Comunidade:", error);
        }

        window.setTimeout(() => {
          if (!cancelado) {
            setUsuario(null);
            setUsuarioEhAdmin(false);
          }
        }, 0);
      } finally {
        window.setTimeout(() => {
          if (!cancelado) {
            setCarregandoUsuario(false);
          }
        }, 0);
      }
    }

    void carregarUsuario();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void carregarUsuario();
    });

    return () => {
      cancelado = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregarObrasRelacionadas() {
      const obrasLocais = carregarSugestoesObrasLocais(usuario?.id || "");

      try {
        const { data, error } = await supabase
          .from("obras")
          .select("id, user_id, titulo, autor, publicado, slug, link")
          .eq("publicado", true)
          .order("criada_em", { ascending: false })
          .limit(120);

        if (error) {
          throw error;
        }

        const obrasSupabase = ((data || []) as unknown as SupabaseObraPublicaRow[])
          .map((obra, index) => {
            const titulo = obra.titulo?.trim() || "";

            if (!titulo) {
              return null;
            }

            const slug = obra.slug?.trim() || criarSlugBase(titulo);

            return {
              id: obra.id || `obra-supabase-${index}`,
              titulo,
              autor: obra.autor?.trim() || "Autor não informado",
              autorId: obra.user_id?.trim() || "",
              slug,
              link: obra.link?.trim() || `/obra/${slug}`,
            } satisfies ObraRelacionadaSugestao;
          })
          .filter((obra): obra is ObraRelacionadaSugestao => Boolean(obra));

        if (!cancelado) {
          setObrasRelacionadasSugestoes(
            removerSugestoesObrasDuplicadas([...obrasSupabase, ...obrasLocais])
          );
        }
      } catch {
        if (!cancelado) {
          setObrasRelacionadasSugestoes(
            removerSugestoesObrasDuplicadas(obrasLocais)
          );
        }
      }
    }

    void carregarObrasRelacionadas();

    return () => {
      cancelado = true;
    };
  }, [usuario?.id]);

  useEffect(() => {
    if (composerAberto) {
      return;
    }

    const fecharSugestoesTimer = window.setTimeout(() => {
      setSugestoesObrasAbertas(false);
      setObraRelacionadaBusca("");
    }, 0);

    return () => {
      window.clearTimeout(fecharSugestoesTimer);
    };
  }, [composerAberto]);

  useEffect(() => {
    if (!menuAcoesRapidasComunidadeAberto && !postMenuAbertoId) {
      return;
    }

    const overflowAnterior = document.body.style.getPropertyValue("overflow");
    const overscrollAnterior = document.documentElement.style.getPropertyValue(
      "overscroll-behavior"
    );

    document.body.style.setProperty("overflow", "hidden");
    document.documentElement.style.setProperty("overscroll-behavior", "none");

    return () => {
      if (overflowAnterior) {
        document.body.style.setProperty("overflow", overflowAnterior);
      } else {
        document.body.style.removeProperty("overflow");
      }

      if (overscrollAnterior) {
        document.documentElement.style.setProperty(
          "overscroll-behavior",
          overscrollAnterior
        );
      } else {
        document.documentElement.style.removeProperty("overscroll-behavior");
      }
    };
  }, [menuAcoesRapidasComunidadeAberto, postMenuAbertoId]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    const carregarFeedTimer = window.setTimeout(() => {
      void carregarPostsComunidade(true);
    }, 0);

    return () => {
      window.clearTimeout(carregarFeedTimer);
    };
  }, []);

  useEffect(() => {
    if (parametrosComunidadeAplicadosRef.current) {
      return;
    }

    parametrosComunidadeAplicadosRef.current = true;

    const parametrosUrl = new URLSearchParams(window.location.search);
    const buscaUrl = (parametrosUrl.get("busca") || "").trim();
    const tipoUrl = obterTipoPublicacaoPorParametro(
      parametrosUrl.get("tipo") || ""
    );

    if (!buscaUrl && !tipoUrl) {
      return;
    }

    const aplicarParametrosTimer = window.setTimeout(() => {
      if (buscaUrl) {
        setTermoBusca(buscaUrl.slice(0, 90));
      }

      if (tipoUrl) {
        setTipoPublicacaoAtiva(tipoUrl);
        setMenuAcoesRapidasComunidadeAberto(true);
      }

      setMostrarApenasSalvos(false);
      setOrdenacaoAtiva("Recentes");
    }, 0);

    return () => {
      window.clearTimeout(aplicarParametrosTimer);
    };
  }, []);

  useEffect(() => {
    if (comentarioUrlAplicadoRef.current || comentariosPostId || posts.length === 0) {
      return;
    }

    const postIdUrl = new URLSearchParams(window.location.search).get("post");

    if (postIdUrl && posts.some((post) => post.id === postIdUrl)) {
      comentarioUrlAplicadoRef.current = true;

      const abrirComentariosTimer = window.setTimeout(() => {
        setComentariosPostId(postIdUrl);
      }, 0);

      return () => {
        window.clearTimeout(abrirComentariosTimer);
      };
    }
  }, [comentariosPostId, posts]);

  const termoBuscaNormalizado = useMemo(
    () => normalizarTexto(termoBuscaAdiado),
    [termoBuscaAdiado]
  );

  const postsVisiveis = useMemo(() => {
    const postsFiltrados = posts.filter((post) => {
      const categoriaCombina =
        categoriaAtiva === "Todos" || post.categoria === categoriaAtiva;
      const tipoVisualPublicacao = obterTipoVisualPublicacao(post);
      const tipoPublicacaoCombina =
        tipoPublicacaoAtiva === "Todos" ||
        tipoVisualPublicacao === tipoPublicacaoAtiva;

      if (!categoriaCombina || !tipoPublicacaoCombina) {
        return false;
      }

      if (mostrarApenasSalvos && !postsSalvosIds.includes(post.id)) {
        return false;
      }

      if (!termoBuscaNormalizado) {
        return true;
      }

      const textoBuscaPost = normalizarTexto(
        [
          post.texto,
          post.autorNome,
          post.categoria,
          obterTipoVisualPublicacao(post),
          post.obraRelacionada,
        ]
          .filter(Boolean)
          .join(" ")
      );

      return textoBuscaPost.includes(termoBuscaNormalizado);
    });

    return [...postsFiltrados].sort((postA, postB) => {
      const dataA = new Date(postA.criadoEm).getTime();
      const dataB = new Date(postB.criadoEm).getTime();
      const dataOrdenacaoA = Number.isNaN(dataA) ? 0 : dataA;
      const dataOrdenacaoB = Number.isNaN(dataB) ? 0 : dataB;

      if (postA.fixado !== postB.fixado) {
        return postA.fixado ? -1 : 1;
      }

      if (postA.fixado && postB.fixado) {
        const fixadoA = new Date(postA.fixadoEm || postA.criadoEm).getTime();
        const fixadoB = new Date(postB.fixadoEm || postB.criadoEm).getTime();
        const fixadoOrdenacaoA = Number.isNaN(fixadoA) ? dataOrdenacaoA : fixadoA;
        const fixadoOrdenacaoB = Number.isNaN(fixadoB) ? dataOrdenacaoB : fixadoB;

        return fixadoOrdenacaoB - fixadoOrdenacaoA;
      }

      if (ordenacaoAtiva === "Mais comentadas") {
        const diferencaComentarios =
          contarComentaristasUnicosPostComunidade(postB) -
          contarComentaristasUnicosPostComunidade(postA);

        return diferencaComentarios || dataOrdenacaoB - dataOrdenacaoA;
      }

      if (ordenacaoAtiva === "Em alta") {
        const pontuacaoA = obterPontuacaoPost(postA);
        const pontuacaoB = obterPontuacaoPost(postB);

        return pontuacaoB - pontuacaoA || dataOrdenacaoB - dataOrdenacaoA;
      }

      return dataOrdenacaoB - dataOrdenacaoA;
    });
  }, [
    categoriaAtiva,
    tipoPublicacaoAtiva,
    mostrarApenasSalvos,
    ordenacaoAtiva,
    posts,
    postsSalvosIds,
    termoBuscaNormalizado,
  ]);

  const postComentariosAberto = useMemo(() => {
    if (!comentariosPostId) {
      return null;
    }

    return posts.find((post) => post.id === comentariosPostId) || null;
  }, [comentariosPostId, posts]);

  const sugestoesObrasRelacionadasVisiveis = useMemo(() => {
    const buscaNormalizada = normalizarTexto(obraRelacionadaBusca);

    if (!buscaNormalizada) {
      return [];
    }

    return obrasRelacionadasSugestoes
      .filter((obra) => {
        const tituloObra = normalizarTexto(obra.titulo);

        return tituloObra.startsWith(buscaNormalizada);
      })
      .slice(0, 8);
  }, [obraRelacionadaBusca, obrasRelacionadasSugestoes]);

  useEffect(() => {
    if (!comentariosPostId) {
      return;
    }

    const overflowAnterior = document.body.style.getPropertyValue("overflow");
    const overscrollAnterior = document.documentElement.style.getPropertyValue(
      "overscroll-behavior"
    );

    document.body.style.setProperty("overflow", "hidden");
    document.documentElement.style.setProperty("overscroll-behavior", "none");

    return () => {
      if (overflowAnterior) {
        document.body.style.setProperty("overflow", overflowAnterior);
      } else {
        document.body.style.removeProperty("overflow");
      }

      if (overscrollAnterior) {
        document.documentElement.style.setProperty(
          "overscroll-behavior",
          overscrollAnterior
        );
      } else {
        document.documentElement.style.removeProperty("overscroll-behavior");
      }
    };
  }, [comentariosPostId]);

  useEffect(() => {
    if (!composerAberto) {
      return;
    }

    const overflowAnterior = document.body.style.getPropertyValue("overflow");
    const overscrollAnterior = document.documentElement.style.getPropertyValue(
      "overscroll-behavior"
    );

    document.body.style.setProperty("overflow", "hidden");
    document.documentElement.style.setProperty("overscroll-behavior", "none");

    const focoTimer = window.setTimeout(() => {
      textoPostRef.current?.focus();
    }, 80);

    return () => {
      window.clearTimeout(focoTimer);

      if (overflowAnterior) {
        document.body.style.setProperty("overflow", overflowAnterior);
      } else {
        document.body.style.removeProperty("overflow");
      }

      if (overscrollAnterior) {
        document.documentElement.style.setProperty(
          "overscroll-behavior",
          overscrollAnterior
        );
      } else {
        document.documentElement.style.removeProperty("overscroll-behavior");
      }
    };
  }, [composerAberto]);

  const filtrosAtivos =
    categoriaAtiva !== "Todos" ||
    tipoPublicacaoAtiva !== "Todos" ||
    Boolean(termoBuscaNormalizado) ||
    mostrarApenasSalvos ||
    ordenacaoAtiva !== "Recentes";
  const textoBotaoFiltrosAvancadosComunidade = "Comunidade";

  function iniciarAcaoComunidade(chave: string) {
    if (acoesComunidadeRef.current.has(chave)) {
      return false;
    }

    acoesComunidadeRef.current.add(chave);
    return true;
  }

  function finalizarAcaoComunidade(chave: string) {
    acoesComunidadeRef.current.delete(chave);
  }

  function obterChaveDenuncia(alvoTipo: AlvoDenunciaComunidade, alvoId: string) {
    return `denunciar-${alvoTipo}:${alvoId}`;
  }

  function limparFiltrosComunidade() {
    setCategoriaAtiva("Todos");
    setTipoPublicacaoAtiva("Todos");
    setTermoBusca("");
    setOrdenacaoAtiva("Recentes");
    setMostrarApenasSalvos(false);
  }

  function emitirFeedbackAcao(mensagem: string) {
    setFeedbackAcao(mensagem);

    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }

    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedbackAcao("");
      feedbackTimerRef.current = null;
    }, 2600);
  }


  function prepararEnqueteComunidade() {
    if (!exigirLogin()) {
      return;
    }

    setErro("");
    setCategoriaPost("Discussão");
    setTipoPublicacaoPost("Enquete");
    setTemSpoilerPost(false);
    setComposerAberto(true);

    window.setTimeout(() => {
      if (!textoPostRef.current) {
        return;
      }

      textoPostRef.current.value = MODELO_ENQUETE_COMUNIDADE;
      textoPostRef.current.focus();
      textoPostRef.current.setSelectionRange(
        textoPostRef.current.value.length,
        textoPostRef.current.value.length
      );
    }, 0);
  }

  function selecionarTipoPublicacaoPost(tipo: TipoPublicacaoComunidade) {
    setTipoPublicacaoPost(tipo);

    if (tipo !== "Enquete") {
      return;
    }

    window.setTimeout(() => {
      if (!textoPostRef.current) {
        return;
      }

      const textoAtual = textoPostRef.current.value.trim();

      if (textoAtual && !/^enquete\s*[:\-]/i.test(textoAtual)) {
        return;
      }

      textoPostRef.current.value = MODELO_ENQUETE_COMUNIDADE;
      textoPostRef.current.focus();
      textoPostRef.current.setSelectionRange(
        textoPostRef.current.value.length,
        textoPostRef.current.value.length
      );
    }, 0);
  }

  async function votarEnquete(postId: string, opcao: string) {
    if (votandoEnqueteId === postId) {
      return;
    }

    if (votosEnquetes[postId]) {
      emitirFeedbackAcao("Você já votou nesta enquete.");
      return;
    }

    if (!exigirLogin() || !usuario) {
      return;
    }

    setVotandoEnqueteId(postId);
    setErro("");

    try {
      const { error } = await supabase.from("comunidade_enquete_votos").insert({
        post_id: postId,
        user_id: usuario.id,
        opcao,
      });

      if (error) {
        const codigoErro = (error as { code?: string }).code;

        if (codigoErro === "23505") {
          emitirFeedbackAcao("Você já votou nesta enquete.");

          const votosReais = await carregarVotosEnquetesSupabase(
            [postId],
            usuario.id
          );

          if (votosReais) {
            setResultadosEnquetes((resultadosAtuais) => ({
              ...resultadosAtuais,
              ...votosReais.resultados,
            }));

            setVotosEnquetes((votosAtuais) => {
              const votosAtualizados = {
                ...votosAtuais,
                ...votosReais.meusVotos,
              };

              salvarVotosEnquetesLocais(votosAtualizados, usuario.id);

              return votosAtualizados;
            });
          }

          return;
        }

        setErro(formatarErroSupabase("Erro ao votar na enquete", error));
        return;
      }

      setVotosEnquetes((votosAtuais) => {
        const votosAtualizados = {
          ...votosAtuais,
          [postId]: opcao,
        };

        salvarVotosEnquetesLocais(votosAtualizados, usuario.id);

        return votosAtualizados;
      });

      const votosReais = await carregarVotosEnquetesSupabase(
        [postId],
        usuario.id
      );

      if (votosReais) {
        setResultadosEnquetes((resultadosAtuais) => ({
          ...resultadosAtuais,
          ...votosReais.resultados,
        }));

        setVotosEnquetes((votosAtuais) => {
          const votosAtualizados = {
            ...votosAtuais,
            ...votosReais.meusVotos,
          };

          salvarVotosEnquetesLocais(votosAtualizados, usuario.id);

          return votosAtualizados;
        });
      } else {
        setResultadosEnquetes((resultadosAtuais) => ({
          ...resultadosAtuais,
          [postId]: {
            ...(resultadosAtuais[postId] || {}),
            [opcao]: (resultadosAtuais[postId]?.[opcao] || 0) + 1,
          },
        }));
      }

      emitirFeedbackAcao("Voto registrado.");
    } finally {
      setVotandoEnqueteId((postAtualId) =>
        postAtualId === postId ? null : postAtualId
      );
    }
  }

  function alternarSpoilerRevelado(postId: string) {
    setSpoilersReveladosIds((idsAtuais) =>
      idsAtuais.includes(postId)
        ? idsAtuais.filter((id) => id !== postId)
        : [...idsAtuais, postId]
    );
  }

  function responderDesafioSemana() {
    if (!exigirLogin()) {
      return;
    }

    setErro("");
    setCategoriaPost("Recomendações");
    setTipoPublicacaoPost("Pedido de indicação");
    setTemSpoilerPost(false);
    setComposerAberto(true);

    window.setTimeout(() => {
      if (!textoPostRef.current) {
        return;
      }

      textoPostRef.current.value = `${DESAFIO_SEMANA_COMUNIDADE.pergunta} — Eu gostaria de ver: `;
      textoPostRef.current.focus();
    }, 0);
  }

  function abrirPublicacaoRapidaComunidade() {
    setMenuAcoesRapidasComunidadeAberto(false);

    if (carregandoUsuario || !exigirLogin()) {
      return;
    }

    setErro("");
    setComposerAberto(true);
  }

  function abrirDesafioRapidoComunidade() {
    setMenuAcoesRapidasComunidadeAberto(false);
    responderDesafioSemana();
  }

  async function alternarPostSalvo(postId: string) {
    const chaveAcao = `salvar-post:${postId}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      setPostSalvandoId(postId);

      const postJaSalvo = postsSalvosIds.includes(postId);
      const postsSalvosAtualizados = postJaSalvo
        ? postsSalvosIds.filter((postSalvoId) => postSalvoId !== postId)
        : [...postsSalvosIds, postId];

      setPostsSalvosIds(postsSalvosAtualizados);
      salvarJsonUsuarioComunidade(
        CHAVE_POSTS_SALVOS_COMUNIDADE,
        usuario.id,
        postsSalvosAtualizados
      );

      const salvouNoSupabase = await salvarPostSalvoSupabaseComunidade(
        usuario.id,
        postId,
        !postJaSalvo
      );

      if (salvouNoSupabase) {
        const postsSalvosReais = await carregarPostsSalvosSupabaseComunidade(
          usuario.id
        );

        if (postsSalvosReais) {
          setPostsSalvosIds(postsSalvosReais);
          salvarJsonUsuarioComunidade(
            CHAVE_POSTS_SALVOS_COMUNIDADE,
            usuario.id,
            postsSalvosReais
          );
        }
      }

      emitirFeedbackAcao(
        postJaSalvo
          ? "Publicação removida dos salvos."
          : salvouNoSupabase
            ? "Publicação salva."
            : "Publicação salva neste navegador."
      );
    } finally {
      finalizarAcaoComunidade(chaveAcao);
      setPostSalvandoId((postAtualId) =>
        postAtualId === postId ? null : postAtualId
      );
    }
  }

  async function compartilharPublicacao(post: PostComunidade) {
    const chaveAcao = `compartilhar-post:${post.id}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setPostCompartilhandoId(post.id);

    try {
      const linkPublicacao = obterLinkPublicacaoComunidade(post.id);
      const navegador = navigator as Navigator & {
        share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
      };

      if (typeof navegador.share === "function") {
        try {
          await navegador.share({
            title: "Comunidade Historietas",
            text: post.texto.slice(0, 120),
            url: linkPublicacao,
          });
          emitirFeedbackAcao("Publicação pronta para compartilhar.");
          return;
        } catch {
          // Se o compartilhamento nativo falhar ou for cancelado, tenta copiar.
        }
      }

      const linkCopiado = await copiarTextoComFallback(linkPublicacao);

      if (linkCopiado) {
        emitirFeedbackAcao("Link da publicação copiado.");
        return;
      }

      setErro(`Não foi possível copiar automaticamente. Link: ${linkPublicacao}`);
    } finally {
      finalizarAcaoComunidade(chaveAcao);
      setPostCompartilhandoId((postAtualId) =>
        postAtualId === post.id ? null : postAtualId
      );
    }
  }

  async function carregarPostsComunidade(
    mostrarCarregamento = false,
    pagina = 0
  ) {
    const carregandoPaginaInicial = mostrarCarregamento;
    const carregandoPaginaSeguinte = pagina > 0;

    if (carregandoPaginaInicial) {
      setCarregandoFeed(true);
    }

    if (carregandoPaginaSeguinte) {
      setCarregandoMaisPostsComunidade(true);
    }

    const inicio = pagina * POSTS_COMUNIDADE_POR_PAGINA;
    const fim = inicio + POSTS_COMUNIDADE_POR_PAGINA - 1;

    try {
      const postsResposta = await supabase
        .from("comunidade_posts")
        .select(
          "id, autor_id, autor_nome, categoria, tipo_publicacao, tem_spoiler, texto, obra_relacionada, criado_em, fixado, fixado_em, fixado_por"
        )
        .order("criado_em", { ascending: false })
        .range(inicio, fim);

      if (postsResposta.error) {
        throw postsResposta.error;
      }

      const postsPagina = (postsResposta.data || []) as unknown as SupabasePostRow[];
      const postIds = postsPagina
        .map((post) => post.id)
        .filter((postId): postId is string => Boolean(postId));

      if (postIds.length === 0) {
        if (pagina === 0) {
          setPosts([]);
        }

        setTemMaisPostsComunidade(false);
        setPaginaFeedComunidade(pagina);
        return;
      }

      const [comentariosResposta, curtidasResposta] = await Promise.all([
        supabase
          .from("comunidade_comentarios")
          .select("id, post_id, autor_id, autor_nome, texto, criado_em")
          .in("post_id", postIds)
          .order("criado_em", { ascending: true })
          .limit(2500),
        supabase
          .from("comunidade_curtidas")
          .select("post_id, usuario_id")
          .in("post_id", postIds)
          .limit(5000),
      ]);

      if (comentariosResposta.error) {
        throw comentariosResposta.error;
      }

      if (curtidasResposta.error) {
        throw curtidasResposta.error;
      }

      const comentariosSupabase =
        (comentariosResposta.data || []) as unknown as SupabaseComentarioRow[];
      const comentarioIds = comentariosSupabase
        .map((comentario) => comentario.id)
        .filter((comentarioId): comentarioId is string => Boolean(comentarioId));

      const comentarioCurtidasResposta =
        comentarioIds.length > 0
          ? await supabase
              .from("comunidade_comentario_curtidas")
              .select("comentario_id, usuario_id")
              .in("comentario_id", comentarioIds)
              .limit(5000)
          : { data: [], error: null };

      if (comentarioCurtidasResposta.error) {
        throw comentarioCurtidasResposta.error;
      }

      const autoresIdsComunidade = Array.from(
        new Set(
          [
            ...postsPagina.map((post) => post.autor_id),
            ...comentariosSupabase.map((comentario) => comentario.autor_id),
          ].filter((id): id is string => idSupabaseValidoComunidade(id || ""))
        )
      );
      const profilesPorUsuario = await carregarProfilesComunidadePorUsuarios(
        autoresIdsComunidade
      );

      const postsSupabase = mapearPostsSupabase(
        postsPagina,
        comentariosSupabase,
        (curtidasResposta.data || []) as unknown as SupabaseCurtidaRow[],
        (comentarioCurtidasResposta.data || []) as unknown as SupabaseComentarioCurtidaRow[],
        profilesPorUsuario
      );

      setPosts((postsAtuais) => {
        if (pagina === 0) {
          return postsSupabase;
        }

        const postsPorId = new Map(
          postsAtuais.map((postAtual) => [postAtual.id, postAtual])
        );

        postsSupabase.forEach((post) => {
          postsPorId.set(post.id, post);
        });

        return Array.from(postsPorId.values());
      });

      setTemMaisPostsComunidade(
        postsPagina.length === POSTS_COMUNIDADE_POR_PAGINA
      );
      setPaginaFeedComunidade(pagina);
    } catch (error) {
      setErro(formatarErroSupabase("Erro ao carregar Comunidade", error));

      if (pagina === 0) {
        setPosts([]);
        setTemMaisPostsComunidade(false);
      }
    } finally {
      if (carregandoPaginaInicial) {
        setCarregandoFeed(false);
      }

      if (carregandoPaginaSeguinte) {
        setCarregandoMaisPostsComunidade(false);
      }
    }
  }

  async function carregarMaisPostsComunidade() {
    if (carregandoFeed || carregandoMaisPostsComunidade || !temMaisPostsComunidade) {
      return;
    }

    await carregarPostsComunidade(false, paginaFeedComunidade + 1);
  }


  function exigirLogin() {
    if (usuario) {
      return true;
    }

    setErro("Entre na sua conta para participar da Comunidade.");
    router.push(criarLoginHrefComunidade());
    return false;
  }

  function selecionarObraRelacionada(titulo: string) {
    setObraRelacionadaBusca(titulo);
    setSugestoesObrasAbertas(false);

    if (obraRelacionadaRef.current) {
      obraRelacionadaRef.current.value = titulo;
      obraRelacionadaRef.current.focus();
    }
  }

  async function publicarPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const chaveAcao = "publicar-post";

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setPublicandoPost(true);
    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      const textoLimpo = textoPostRef.current?.value.trim() || "";
      const obraLimpa = obraRelacionadaRef.current?.value.trim() || "";

      if (textoLimpo.length < 8) {
        setErro("Escreva uma publicação com pelo menos 8 caracteres.");
        return;
      }

      const linhasPost = obterLinhasTexto(textoLimpo);
      const primeiraLinhaPost = linhasPost[0] || "";
      const publicacaoEhEnquete =
        tipoPublicacaoPost === "Enquete" || /^enquete\s*[:\-]/i.test(primeiraLinhaPost);

      if (publicacaoEhEnquete) {
        const perguntaEnquete = obterPerguntaEnquete(textoLimpo);
        const opcoesEnquete = obterTodasOpcoesEnquete(textoLimpo);

        if (!/^enquete\s*[:\-]/i.test(primeiraLinhaPost) || !perguntaEnquete.trim()) {
          setErro("Escreva a pergunta da enquete na primeira linha.");
          return;
        }

        if (opcoesEnquete.length < MIN_OPCOES_ENQUETE) {
          setErro("A enquete precisa ter pelo menos 2 opções preenchidas.");
          return;
        }

        if (opcoesEnquete.length > MAX_OPCOES_ENQUETE) {
          setErro("A enquete pode ter no máximo 4 opções.");
          return;
        }
      }

      const autorNomeSeguro = await obterNomeSeguroUsuarioComunidade(usuario);

      const { data, error } = await supabase
        .from("comunidade_posts")
        .insert({
          autor_id: usuario.id,
          autor_nome: autorNomeSeguro,
          categoria: categoriaPost,
          tipo_publicacao: publicacaoEhEnquete ? "Discussão" : tipoPublicacaoPost,
          tem_spoiler: temSpoilerPost,
          texto: textoLimpo.slice(0, 700),
          obra_relacionada: obraLimpa.slice(0, 90),
        })
        .select(
          "id, autor_id, autor_nome, categoria, tipo_publicacao, tem_spoiler, texto, obra_relacionada, criado_em, fixado, fixado_em, fixado_por"
        )
        .single();

      if (error || !data) {
        setErro(
          error
            ? formatarErroSupabase("Erro ao publicar", error)
            : "Erro ao publicar: o Supabase não retornou a publicação criada."
        );
        return;
      }

      const profilesPostNovo = new Map<string, PerfilComunidadeRow>([
        [
          usuario.id,
          {
            nome: autorNomeSeguro,
            avatar_url: usuario.avatar,
          },
        ],
      ]);
      const novoPost = mapearPostSupabase(
        data as SupabasePostRow,
        new Map<string, ComentarioComunidade[]>(),
        new Map<string, string[]>(),
        profilesPostNovo
      );

      setPosts((postsAtuais) => [novoPost, ...postsAtuais]);

      if (!publicacaoEhEnquete && tipoPublicacaoPost === "Review") {
        void registrarReviewComunidadeNoDiario({
          userId: usuario.id,
          texto: textoLimpo,
          obraRelacionada: obraLimpa,
          postId: novoPost.id,
          sugestoesObras: obrasRelacionadasSugestoes,
        });
      }

      if (textoPostRef.current) {
        textoPostRef.current.value = "";
      }

      if (obraRelacionadaRef.current) {
        obraRelacionadaRef.current.value = "";
      }

      setObraRelacionadaBusca("");
      setSugestoesObrasAbertas(false);
      setCategoriaPost("Geral");
      setTipoPublicacaoPost("Discussão");
      setTemSpoilerPost(false);
      setComposerAberto(false);
      emitirFeedbackAcao("Publicação enviada para a Comunidade.");
    } finally {
      finalizarAcaoComunidade(chaveAcao);
      setPublicandoPost(false);
    }
  }

  async function alternarCurtida(postId: string) {
    const chaveAcao = `curtir-post:${postId}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setPostCurtindoId(postId);
    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      const postAtual = posts.find((post) => post.id === postId);
      const jaCurtiu = Boolean(postAtual?.curtidas.includes(usuario.id));

      const { error: erroLimparCurtida } = await supabase
        .from("comunidade_curtidas")
        .delete()
        .eq("post_id", postId)
        .eq("usuario_id", usuario.id);

      if (erroLimparCurtida) {
        setErro(formatarErroSupabase("Erro ao atualizar curtida", erroLimparCurtida));
        return;
      }

      if (!jaCurtiu) {
        const { error: erroInserirCurtida } = await supabase
          .from("comunidade_curtidas")
          .insert({
            post_id: postId,
            usuario_id: usuario.id,
          });

        if (erroInserirCurtida) {
          setErro(formatarErroSupabase("Erro ao curtir", erroInserirCurtida));
          return;
        }

        if (postAtual?.autorId) {
          await criarNotificacaoComunidadeSupabase({
            destinatarioId: postAtual.autorId,
            tipo: "comunidade-curtida-post",
            titulo: "Nova curtida na Comunidade",
            mensagem: `${usuario.nome} curtiu sua publicação.`,
            link: `/comunidade?post=${encodeURIComponent(postId)}`,
            notificacaoId: `comunidade-curtida-post:${postId}:${usuario.id}`,
          });
        }
      }

      setPosts((postsAtuais) => {
        return postsAtuais.map((post) => {
          if (post.id !== postId) {
            return post;
          }

          return {
            ...post,
            curtidas: jaCurtiu
              ? post.curtidas.filter((curtidaId) => curtidaId !== usuario.id)
              : Array.from(new Set([...post.curtidas, usuario.id])),
          };
        });
      });

      emitirFeedbackAcao(jaCurtiu ? "Curtida removida." : "Publicação curtida.");
    } finally {
      finalizarAcaoComunidade(chaveAcao);
      setPostCurtindoId((postAtualId) =>
        postAtualId === postId ? null : postAtualId
      );
    }
  }

  function abrirComentarios(postId: string) {
    setErro("");
    comentarioUrlAplicadoRef.current = true;
    setComentariosPostId(postId);

    try {
      const url = new URL(window.location.href);
      url.pathname = "/comunidade";
      url.search = `?post=${encodeURIComponent(postId)}`;
      url.hash = "";
      window.history.replaceState(null, "", url.toString());
    } catch {
      // Se o navegador bloquear a URL, os comentários continuam abrindo em estado local.
    }
  }

  function fecharComentarios() {
    setComentariosPostId(null);
  }

  async function comentarPost(postId: string, textoRecebido: string) {
    const chaveAcao = `comentar-post:${postId}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return false;
    }

    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return false;
      }

      const textoComentario = textoRecebido.trim();

      if (textoComentario.length < 1) {
        setErro("Escreva um comentário antes de enviar.");
        return false;
      }

      const autorNomeSeguro = await obterNomeSeguroUsuarioComunidade(usuario);
      const postAtual = posts.find((post) => post.id === postId) || null;

      const { data, error } = await supabase
        .from("comunidade_comentarios")
        .insert({
          post_id: postId,
          autor_id: usuario.id,
          autor_nome: autorNomeSeguro,
          texto: textoComentario.slice(0, 420),
        })
        .select("id, post_id, autor_id, autor_nome, texto, criado_em")
        .single();

      if (error || !data) {
        setErro(
          error
            ? formatarErroSupabase("Erro ao comentar", error)
            : "Erro ao comentar: o Supabase não retornou o comentário criado."
        );
        return false;
      }

      const profilesComentarioNovo = new Map<string, PerfilComunidadeRow>([
        [
          usuario.id,
          {
            nome: autorNomeSeguro,
            avatar_url: usuario.avatar,
          },
        ],
      ]);
      const novoComentario = mapearComentarioSupabase(
        data as SupabaseComentarioRow,
        new Map<string, string[]>(),
        profilesComentarioNovo
      );

      if (postAtual?.autorId) {
        await criarNotificacaoComunidadeSupabase({
          destinatarioId: postAtual.autorId,
          tipo: "comunidade-comentario-post",
          titulo: "Novo comentário na Comunidade",
          mensagem: `${autorNomeSeguro} comentou na sua publicação.`,
          link: `/comunidade?post=${encodeURIComponent(postId)}`,
          notificacaoId: `comunidade-comentario-post:${postId}:${novoComentario.id}`,
        });
      }

      setPosts((postsAtuais) =>
        postsAtuais.map((post) =>
          post.id === postId
            ? {
                ...post,
                comentarios: [...post.comentarios, novoComentario],
              }
            : post
        )
      );

      emitirFeedbackAcao("Comentário enviado.");
      return true;
    } finally {
      finalizarAcaoComunidade(chaveAcao);
    }
  }

  async function denunciarConteudo(
    alvoTipo: AlvoDenunciaComunidade,
    alvoId: string
  ) {
    const chaveAcao = obterChaveDenuncia(alvoTipo, alvoId);

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setDenunciaEnviandoId(chaveAcao);
    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      const { error } = await supabase.from("comunidade_denuncias").insert({
        alvo_tipo: alvoTipo,
        alvo_id: alvoId,
        denunciante_id: usuario.id,
        motivo: "Conteúdo inadequado",
        detalhe: "",
      });

      if (error) {
        const codigoErro = (error as { code?: string }).code;

        if (codigoErro === "23505") {
          setErro("Você já denunciou este conteúdo.");
          return;
        }

        setErro(formatarErroSupabase("Erro ao denunciar", error));
        return;
      }

      setErro("");
      emitirFeedbackAcao("Denúncia enviada para análise.");
    } finally {
      finalizarAcaoComunidade(chaveAcao);
      setDenunciaEnviandoId((denunciaAtualId) =>
        denunciaAtualId === chaveAcao ? null : denunciaAtualId
      );
    }
  }

  async function removerComentario(postId: string, comentarioId: string) {
    const chaveAcao = `remover-comentario:${comentarioId}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      const comentarioAtual = posts
        .find((post) => post.id === postId)
        ?.comentarios.find((comentario) => comentario.id === comentarioId);

      if (!comentarioAtual || comentarioAtual.autorId !== usuario.id) {
        setErro("Você só pode remover seus próprios comentários.");
        return;
      }

      if (!window.confirm("Remover este comentário?")) {
        return;
      }

      const { error } = await supabase
        .from("comunidade_comentarios")
        .delete()
        .eq("id", comentarioId)
        .eq("autor_id", usuario.id);

      if (error) {
        setErro(formatarErroSupabase("Erro ao remover comentário", error));
        return;
      }

      setPosts((postsAtuais) =>
        postsAtuais.map((post) =>
          post.id === postId
            ? {
                ...post,
                comentarios: post.comentarios.filter(
                  (comentario) => comentario.id !== comentarioId
                ),
              }
            : post
        )
      );

      emitirFeedbackAcao("Comentário removido.");
    } finally {
      finalizarAcaoComunidade(chaveAcao);
    }
  }

  async function alternarCurtidaComentario(postId: string, comentarioId: string) {
    const chaveAcao = `curtir-comentario:${comentarioId}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      const postAtual = posts.find((post) => post.id === postId);
      const comentarioAtual = postAtual?.comentarios.find(
        (comentario) => comentario.id === comentarioId
      );
      const jaCurtiu = Boolean(comentarioAtual?.curtidas.includes(usuario.id));

      const { error: erroLimparCurtida } = await supabase
        .from("comunidade_comentario_curtidas")
        .delete()
        .eq("comentario_id", comentarioId)
        .eq("usuario_id", usuario.id);

      if (erroLimparCurtida) {
        setErro(
          formatarErroSupabase(
            "Erro ao atualizar curtida do comentário",
            erroLimparCurtida
          )
        );
        return;
      }

      if (!jaCurtiu) {
        const { error: erroInserirCurtida } = await supabase
          .from("comunidade_comentario_curtidas")
          .insert({
            comentario_id: comentarioId,
            usuario_id: usuario.id,
          });

        if (erroInserirCurtida) {
          setErro(formatarErroSupabase("Erro ao curtir comentário", erroInserirCurtida));
          return;
        }

        if (comentarioAtual?.autorId) {
          await criarNotificacaoComunidadeSupabase({
            destinatarioId: comentarioAtual.autorId,
            tipo: "comunidade-curtida-comentario",
            titulo: "Nova curtida no seu comentário",
            mensagem: `${usuario.nome} curtiu seu comentário na Comunidade.`,
            link: `/comunidade?post=${encodeURIComponent(postId)}`,
            notificacaoId: `comunidade-curtida-comentario:${comentarioId}:${usuario.id}`,
          });
        }
      }

      setPosts((postsAtuais) =>
        postsAtuais.map((post) => {
          if (post.id !== postId) {
            return post;
          }

          return {
            ...post,
            comentarios: post.comentarios.map((comentario) => {
              if (comentario.id !== comentarioId) {
                return comentario;
              }

              return {
                ...comentario,
                curtidas: jaCurtiu
                  ? comentario.curtidas.filter((curtidaId) => curtidaId !== usuario.id)
                  : Array.from(new Set([...comentario.curtidas, usuario.id])),
              };
            }),
          };
        })
      );

      emitirFeedbackAcao(
        jaCurtiu ? "Curtida do comentário removida." : "Comentário curtido."
      );
      await carregarPostsComunidade();
    } finally {
      finalizarAcaoComunidade(chaveAcao);
    }
  }

  async function alternarFixadoPost(post: PostComunidade) {
    if (!usuarioEhAdmin) {
      setErro("Apenas administradores podem fixar publicações.");
      return;
    }

    if (postFixandoId === post.id) {
      return;
    }

    setPostFixandoId(post.id);
    setErro("");

    try {
      const novoEstadoFixado = !post.fixado;

      const { data, error } = await supabase
        .from("comunidade_posts")
        .update({ fixado: novoEstadoFixado })
        .eq("id", post.id)
        .select("fixado, fixado_em, fixado_por")
        .single();

      if (error) {
        setErro(formatarErroSupabase("Erro ao atualizar fixado", error));
        return;
      }

      const dadosFixado = data as {
        fixado?: boolean | null;
        fixado_em?: string | null;
        fixado_por?: string | null;
      } | null;

      setPosts((postsAtuais) =>
        postsAtuais.map((postAtual) => {
          if (postAtual.id !== post.id) {
            return postAtual;
          }

          return {
            ...postAtual,
            fixado: Boolean(dadosFixado?.fixado),
            fixadoEm: dadosFixado?.fixado_em || "",
            fixadoPor: dadosFixado?.fixado_por || "",
          };
        })
      );

      emitirFeedbackAcao(
        novoEstadoFixado
          ? "Publicação fixada no topo."
          : "Publicação desafixada."
      );
    } finally {
      setPostFixandoId((postAtualId) =>
        postAtualId === post.id ? null : postAtualId
      );
    }
  }

  async function removerPost(postId: string) {
    const chaveAcao = `remover-post:${postId}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setPostRemovendoId(postId);
    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      if (!window.confirm("Remover esta publicação?")) {
        return;
      }

      const postParaRemover =
        posts.find((post) => post.id === postId) || null;

      let removerPostQuery = supabase
        .from("comunidade_posts")
        .delete()
        .eq("id", postId);

      if (!usuarioEhAdmin) {
        removerPostQuery = removerPostQuery.eq("autor_id", usuario.id);
      }

      const { error } = await removerPostQuery;

      if (error) {
        setErro(formatarErroSupabase("Erro ao remover publicação", error));
        return;
      }

      if (postParaRemover?.tipoPublicacao === "Review") {
        await removerReviewComunidadeDoDiario({
          userId: postParaRemover.autorId || usuario.id,
          postId,
        });
      }

      setPosts((postsAtuais) =>
        postsAtuais.filter((post) => post.id !== postId)
      );

      const postsSalvosAtualizados = postsSalvosIds.filter(
        (postSalvoId) => postSalvoId !== postId
      );

      setPostsSalvosIds(postsSalvosAtualizados);

      salvarJsonUsuarioComunidade(
        CHAVE_POSTS_SALVOS_COMUNIDADE,
        usuario.id,
        postsSalvosAtualizados
      );

      emitirFeedbackAcao("Publicação removida.");
    } finally {
      finalizarAcaoComunidade(chaveAcao);
      setPostRemovendoId((postAtualId) =>
        postAtualId === postId ? null : postAtualId
      );
    }
  }

  return (
    <main style={pageThemeStyle}>
      <style>{historietasThemeCss}</style>

      {isDesktop ? (
        <div style={desktopTopWaterFadeStyle} aria-hidden="true" />
      ) : (
        <div style={mobileTopWaterFadeStyle} aria-hidden="true" />
      )}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <section style={isDesktop ? desktopLayoutStyle : layoutStyle}>
          <section style={feedColumnStyle}>
            {usuario && erro && !composerAberto && (
              <span style={communityErrorNoticeStyle}>{erro}</span>
            )}

            <section
              style={
                isDesktop
                  ? desktopExploreLikeFilterBoxStyle
                  : exploreLikeFilterBoxStyle
              }
            >
              <div style={communityFilterControlsRowStyle}>
                <button
                  type="button"
                  aria-label="Abrir filtros, ordenação e ações da comunidade"
                  aria-expanded={menuAcoesRapidasComunidadeAberto}
                  onClick={() =>
                    setMenuAcoesRapidasComunidadeAberto((aberto) => !aberto)
                  }
                  style={communityFilterLabelButtonStyle}
                >
                  <span>{textoBotaoFiltrosAvancadosComunidade}</span>
                </button>

                <button
                  type="button"
                  aria-label="Abrir filtros, ordenação e ações da comunidade"
                  aria-expanded={menuAcoesRapidasComunidadeAberto}
                  onClick={() =>
                    setMenuAcoesRapidasComunidadeAberto((aberto) => !aberto)
                  }
                  style={communityQuickActionsInlinePlusButtonStyle}
                >
                  <span style={communityFilterActionIconStyle}>+</span>
                </button>

                <label style={communitySearchShellStyle}>
                  <span style={communitySearchIconStyle}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <circle
                        cx="10.85"
                        cy="10.85"
                        r="6.65"
                        stroke="currentColor"
                        strokeWidth="2.15"
                      />
                      <path
                        d="M16.05 16.05L20.25 20.25"
                        stroke="currentColor"
                        strokeWidth="2.15"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>

                  <input
                    value={termoBusca}
                    onChange={(event) => setTermoBusca(event.target.value)}
                    placeholder="Buscar"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={90}
                    style={communitySearchInputStyle}
                  />
                </label>
              </div>

              {filtrosAtivos && (
                <button
                  type="button"
                  onClick={limparFiltrosComunidade}
                  style={exploreLikeClearFilterButtonStyle}
                >
                  Limpar filtros
                </button>
              )}
            </section>


            {menuAcoesRapidasComunidadeAberto && (
              <section
                style={communityFiltersSheetOverlayStyle}
                aria-label="Filtros, ordenação e ações da comunidade"
              >
                <button
                  type="button"
                  aria-label="Fechar filtros e ações da comunidade"
                  onClick={() => setMenuAcoesRapidasComunidadeAberto(false)}
                  style={communityFiltersSheetBackdropStyle}
                />

                <article style={communityActionsSheetStyle}>
                  <div style={communityFiltersSheetHandleStyle} />

                  <strong style={communityFiltersSheetTitleStyle}>
                    Filtrar e ordenar
                  </strong>

                  <span style={communityFiltersSheetSectionLabelStyle}>
                    Ações
                  </span>

                  <button
                    type="button"
                    onClick={abrirPublicacaoRapidaComunidade}
                    style={communityActionsSheetItemStyle}
                  >
                    Publicar
                  </button>

                  <button
                    type="button"
                    onClick={abrirDesafioRapidoComunidade}
                    style={communityActionsSheetItemStyle}
                  >
                    Pedir recomendações
                  </button>

                  <span style={communityFiltersSheetSectionLabelStyle}>
                    Mostrar
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      limparFiltrosComunidade();
                      setMenuAcoesRapidasComunidadeAberto(false);
                    }}
                    style={
                      !filtrosAtivos
                        ? communityFiltersSheetOptionActiveStyle
                        : communityFiltersSheetOptionStyle
                    }
                  >
                    <span>Todas</span>
                    <span
                      style={
                        !filtrosAtivos
                          ? communityFiltersSheetRadioActiveStyle
                          : communityFiltersSheetRadioStyle
                      }
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMostrarApenasSalvos(true);
                      setMenuAcoesRapidasComunidadeAberto(false);
                    }}
                    style={
                      mostrarApenasSalvos
                        ? communityFiltersSheetOptionActiveStyle
                        : communityFiltersSheetOptionStyle
                    }
                  >
                    <span>Posts salvos</span>
                    <span
                      style={
                        mostrarApenasSalvos
                          ? communityFiltersSheetRadioActiveStyle
                          : communityFiltersSheetRadioStyle
                      }
                    />
                  </button>

                  <span style={communityFiltersSheetSectionLabelStyle}>
                    Ordenar
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setOrdenacaoAtiva("Recentes");
                      setMostrarApenasSalvos(false);
                      setMenuAcoesRapidasComunidadeAberto(false);
                    }}
                    style={
                      ordenacaoAtiva === "Recentes" && !mostrarApenasSalvos
                        ? communityFiltersSheetOptionActiveStyle
                        : communityFiltersSheetOptionStyle
                    }
                  >
                    <span>Recentes</span>
                    <span
                      style={
                        ordenacaoAtiva === "Recentes" && !mostrarApenasSalvos
                          ? communityFiltersSheetRadioActiveStyle
                          : communityFiltersSheetRadioStyle
                      }
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOrdenacaoAtiva("Em alta");
                      setMostrarApenasSalvos(false);
                      setMenuAcoesRapidasComunidadeAberto(false);
                    }}
                    style={
                      ordenacaoAtiva === "Em alta" && !mostrarApenasSalvos
                        ? communityFiltersSheetOptionActiveStyle
                        : communityFiltersSheetOptionStyle
                    }
                  >
                    <span>Em alta</span>
                    <span
                      style={
                        ordenacaoAtiva === "Em alta" && !mostrarApenasSalvos
                          ? communityFiltersSheetRadioActiveStyle
                          : communityFiltersSheetRadioStyle
                      }
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOrdenacaoAtiva("Mais comentadas");
                      setMostrarApenasSalvos(false);
                      setMenuAcoesRapidasComunidadeAberto(false);
                    }}
                    style={
                      ordenacaoAtiva === "Mais comentadas" && !mostrarApenasSalvos
                        ? communityFiltersSheetOptionActiveStyle
                        : communityFiltersSheetOptionStyle
                    }
                  >
                    <span>Mais comentadas</span>
                    <span
                      style={
                        ordenacaoAtiva === "Mais comentadas" && !mostrarApenasSalvos
                          ? communityFiltersSheetRadioActiveStyle
                          : communityFiltersSheetRadioStyle
                      }
                    />
                  </button>

                  {filtrosAtivos && (
                    <button
                      type="button"
                      onClick={() => {
                        limparFiltrosComunidade();
                        setMenuAcoesRapidasComunidadeAberto(false);
                      }}
                      style={communityFiltersSheetClearButtonStyle}
                    >
                      Limpar filtros
                    </button>
                  )}

                </article>
              </section>
            )}

            <section style={postsListStyle}>
              {!carregandoFeed && (
                postsVisiveis.length > 0 ? (
                postsVisiveis.map((post) => {
                  const usuarioCurtiu = Boolean(
                    usuario && post.curtidas.includes(usuario.id)
                  );
                  const postSalvo = postsSalvosIds.includes(post.id);
                  const podeRemover = Boolean(
                    usuario && (post.autorId === usuario.id || usuarioEhAdmin)
                  );
                  const podeDenunciarPost = Boolean(
                    usuario && post.autorId !== usuario.id
                  );
                  const postCurtindo = postCurtindoId === post.id;
                  const postSalvando = postSalvandoId === post.id;
                  const postCompartilhando = postCompartilhandoId === post.id;
                  const postRemovendo = postRemovendoId === post.id;
                  const postFixando = postFixandoId === post.id;
                  const postDenunciando =
                    denunciaEnviandoId === obterChaveDenuncia("post", post.id);
                  const spoilerRevelado = spoilersReveladosIds.includes(post.id);
                  const ocultarTextoSpoiler = post.temSpoiler && !spoilerRevelado;
                  const opcoesPublicacao = (
                    <div style={postOptionsWrapStyle}>
                      <button
                        type="button"
                        aria-label="Abrir opções da publicação"
                        aria-haspopup="menu"
                        aria-expanded={postMenuAbertoId === post.id}
                        onClick={() =>
                          setPostMenuAbertoId((postIdAtual) =>
                            postIdAtual === post.id ? null : post.id
                          )
                        }
                        style={postMenuAbertoId ? postOptionsButtonActiveStyle : postOptionsButtonStyle}
                      >
                        ⋮
                      </button>

                      {postMenuAbertoId === post.id && typeof document !== "undefined"
                        ? createPortal(
                        <section
                          style={communityFiltersSheetOverlayStyle}
                          aria-label="Ações da publicação"
                        >
                          <button
                            type="button"
                            aria-label="Fechar ações da publicação"
                            onClick={() => setPostMenuAbertoId(null)}
                            style={communityFiltersSheetBackdropStyle}
                          />

                          <article role="menu" style={communityActionsSheetStyle}>
                            <div style={communityFiltersSheetHandleStyle} />

                            <strong style={communityFiltersSheetTitleStyle}>
                              Ações da publicação
                            </strong>

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setPostMenuAbertoId(null);
                                alternarPostSalvo(post.id);
                              }}
                              disabled={postSalvando}
                              style={{
                                ...communityActionsSheetItemStyle,
                                opacity: postSalvando ? 0.58 : 1,
                                cursor: postSalvando ? "not-allowed" : "pointer",
                              }}
                            >
                              {postSalvando
                                ? "Salvando..."
                                : postSalvo
                                  ? "Remover dos salvos"
                                  : "Salvar publicação"}
                            </button>

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setPostMenuAbertoId(null);
                                compartilharPublicacao(post);
                              }}
                              disabled={postCompartilhando}
                              style={{
                                ...communityActionsSheetItemStyle,
                                opacity: postCompartilhando ? 0.58 : 1,
                                cursor: postCompartilhando ? "not-allowed" : "pointer",
                              }}
                            >
                              {postCompartilhando ? "Copiando..." : "Copiar link"}
                            </button>

                            {usuarioEhAdmin && (
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setPostMenuAbertoId(null);
                                  alternarFixadoPost(post);
                                }}
                                disabled={postFixando}
                                style={{
                                  ...communityActionsSheetItemStyle,
                                  opacity: postFixando ? 0.58 : 1,
                                  cursor: postFixando ? "not-allowed" : "pointer",
                                }}
                              >
                                {postFixando
                                  ? "Atualizando..."
                                  : post.fixado
                                    ? "Desfixar publicação"
                                    : "Fixar publicação"}
                              </button>
                            )}

                            {podeRemover && (
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setPostMenuAbertoId(null);
                                  removerPost(post.id);
                                }}
                                disabled={postRemovendo}
                                style={{
                                  ...communityActionsSheetDangerItemStyle,
                                  opacity: postRemovendo ? 0.58 : 1,
                                  cursor: postRemovendo ? "not-allowed" : "pointer",
                                }}
                              >
                                {postRemovendo ? "Removendo..." : "Remover publicação"}
                              </button>
                            )}

                            {podeDenunciarPost && (
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setPostMenuAbertoId(null);
                                  denunciarConteudo("post", post.id);
                                }}
                                disabled={postDenunciando}
                                style={{
                                  ...communityActionsSheetDangerItemStyle,
                                  opacity: postDenunciando ? 0.58 : 1,
                                  cursor: postDenunciando ? "not-allowed" : "pointer",
                                }}
                              >
                                {postDenunciando ? "Enviando..." : "Denunciar"}
                              </button>
                            )}
                          </article>
                        </section>,
                            document.body
                          )
                        : null}
                    </div>
                  );

                  return (
                    <article key={post.id} style={isDesktop ? postCardDesktopStyle : postCardStyle}>
                      <div style={postHeaderStyle}>
                        <Link
                          href={criarPerfilHrefComunidade(
                            post.autorId,
                            post.autorNome
                          )}
                          aria-label={`Abrir perfil de ${post.autorNome}`}
                          style={criarAvatarComunidadeStyle(
                            authorAvatarLinkStyle,
                            post.autorAvatar
                          )}
                        >
                          {!post.autorAvatar && post.autorNome.slice(0, 1).toUpperCase()}
                        </Link>

                        <div style={postMetaStyle}>
                          <Link
                            href={criarPerfilHrefComunidade(
                              post.autorId,
                              post.autorNome
                            )}
                            style={postAuthorLinkStyle}
                          >
                            {post.autorNome}
                          </Link>
                          <span style={postSubMetaStyle}>
                            {formatarDataComunidade(post.criadoEm)}
                            {post.fixado && (
                              <>
                                {" "}
                                <span style={postBadgeSeparatorStyle}>·</span>
                                {" "}
                                <span style={pinnedPostBadgeStyle}>Fixado</span>
                              </>
                            )}
                          </span>
                        </div>

                        {opcoesPublicacao}
                      </div>

                      <div style={postBadgesRowStyle}>
                        {post.obraRelacionada && (
                          <>
                            <Link
                              href={criarLinkObraRelacionada(
                                post.obraRelacionada,
                                obrasRelacionadasSugestoes
                              )}
                              style={obraBadgeStyle}
                            >
                              {post.obraRelacionada}
                            </Link>

                            <span style={postBadgeSeparatorStyle}>·</span>
                          </>
                        )}

                        <span
                          style={
                            postEhEnquete(post)
                              ? pollPostInlineQuestionStyle
                              : postTypeBadgeStyle
                          }
                        >
                          {postEhEnquete(post)
                            ? obterPerguntaEnquete(post.texto)
                            : obterTipoVisualPublicacao(post)}
                        </span>
                      </div>

                      {ocultarTextoSpoiler ? (
                        <strong style={spoilerHiddenTitleStyle}>
                          Conteúdo com spoiler oculto
                        </strong>
                      ) : (
                        <>
                          {postEhEnquete(post) ? (
                            <div style={pollPostBoxStyle}>
                              <div style={pollPostOptionsStyle}>
                                {obterOpcoesEnquete(post.texto).map((opcao) => {
                                  const votoAtual = votosEnquetes[post.id] || "";
                                  const selecionada = votoAtual === opcao;
                                  const usuarioVotouNaEnquete = Boolean(votoAtual);
                                  const totalVotos = usuarioVotouNaEnquete
                                    ? calcularTotalVotosEnquete(
                                        resultadosEnquetes,
                                        post.id
                                      )
                                    : 0;
                                  const porcentagem = usuarioVotouNaEnquete
                                    ? calcularPorcentagemOpcaoEnquete(
                                        resultadosEnquetes,
                                        post.id,
                                        opcao
                                      )
                                    : 0;
                                  const larguraResultado =
                                    usuarioVotouNaEnquete && totalVotos > 0
                                      ? `${porcentagem}%`
                                      : usuarioVotouNaEnquete && selecionada
                                        ? "100%"
                                        : "0%";

                                  return (
                                    <button
                                      key={opcao}
                                      type="button"
                                      onClick={() => votarEnquete(post.id, opcao)}
                                      disabled={Boolean(votoAtual) || votandoEnqueteId === post.id}
                                      style={
                                        selecionada
                                          ? pollPostOptionSelectedStyle
                                          : pollPostOptionStyle
                                      }
                                    >
                                      <span
                                        style={{
                                          ...pollPostResultBarStyle,
                                          width: larguraResultado,
                                          opacity: usuarioVotouNaEnquete ? 1 : 0,
                                        }}
                                      />

                                      <span
                                        style={{
                                          ...pollPostOptionTextStyle,
                                          color: "#FFFFFF",
                                          WebkitTextFillColor: "#FFFFFF",
                                        }}
                                      >
                                        {opcao}
                                      </span>

                                      <span
                                        style={{
                                          ...pollPostStatusStyle,
                                          color: "#FFFFFF",
                                          WebkitTextFillColor: "#FFFFFF",
                                        }}
                                      >
                                        {usuarioVotouNaEnquete
                                          ? selecionada
                                            ? `${totalVotos > 0 ? porcentagem : 100}%`
                                            : `${porcentagem}%`
                                          : votandoEnqueteId === post.id
                                            ? "..."
                                            : "Votar"}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <p style={postTextStyle}>{post.texto}</p>
                          )}
                        </>
                      )}

                      <div style={isDesktop ? postActionsDesktopStyle : postActionsStyle}>
                        <button
                          type="button"
                          onClick={() => alternarCurtida(post.id)}
                          disabled={postCurtindo}
                          style={{
                            ...(usuarioCurtiu
                              ? likedActionButtonStyle
                              : actionButtonStyle),
                            opacity: postCurtindo ? 0.58 : 1,
                            cursor: postCurtindo ? "not-allowed" : "pointer",
                          }}
                        >
                          {postCurtindo
                        ? "♥ ..."
                        : `♥ ${contarCurtidasUnicasPostComunidade(post)}`}
                        </button>

                        <button
                          type="button"
                          onClick={() => abrirComentarios(post.id)}
                          style={actionButtonStyle}
                        >
                          💬 {contarComentaristasUnicosPostComunidade(post)}
                        </button>

                        {post.temSpoiler && (
                          <button
                            type="button"
                            onClick={() => alternarSpoilerRevelado(post.id)}
                            style={actionButtonStyle}
                          >
                            {ocultarTextoSpoiler ? "REVELAR" : "OCULTAR"}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })
              ) : (
                <p
                  style={{
                    margin: "10px 0 0",
                    color: "#FFFFFF",
                    fontSize: "12px",
                    fontWeight: 800,
                    textAlign: "center",
                  }}
                >
                  {mostrarApenasSalvos
                    ? "Nenhuma publicação salva"
                    : filtrosAtivos
                      ? "Nenhuma publicação encontrada"
                      : "Nenhuma publicação ainda"}
                </p>
              )
              )}
            </section>

            {!carregandoFeed && postsVisiveis.length > 0 && temMaisPostsComunidade && (
              <section style={loadMorePostsWrapStyle}>
                <button
                  type="button"
                  onClick={carregarMaisPostsComunidade}
                  disabled={carregandoMaisPostsComunidade}
                  style={{
                    ...loadMorePostsButtonStyle,
                    opacity: carregandoMaisPostsComunidade ? 0.58 : 1,
                    cursor: carregandoMaisPostsComunidade
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {carregandoMaisPostsComunidade
                    ? "Carregando..."
                    : "Carregar mais publicações"}
                </button>
              </section>
            )}

          </section>

        </section>
      </section>

      {composerAberto && usuario && (
        <section style={postComposerOverlayStyle} aria-label="Criar publicação">
          <button
            type="button"
            aria-label="Fechar publicação"
            onClick={() => {
              if (!publicandoPost) {
                setErro("");
                setComposerAberto(false);
              }
            }}
            style={postComposerBackdropStyle}
          />

          <article style={isDesktop ? postComposerDesktopSheetStyle : postComposerSheetStyle}>
            <header style={postComposerHeaderStyle}>
              <strong style={postComposerTitleStyle}>Nova publicação</strong>
            </header>

            <form onSubmit={publicarPost} style={postComposerFormStyle}>
              <div
                style={
                  isDesktop
                    ? postComposerFieldsGridStyle
                    : postComposerFieldsStackStyle
                }
              >
                <label style={fieldStyle}>
                  <span style={labelStyle}>Categoria</span>

                  <select
                    disabled={publicandoPost}
                    value={categoriaPost}
                    onChange={(event) =>
                      setCategoriaPost(event.target.value as CategoriaComunidade)
                    }
                    style={selectStyle}
                  >
                    {CATEGORIAS_COMUNIDADE.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={fieldStyle}>
                  <span style={labelStyle}>Tipo</span>

                  <select
                    disabled={publicandoPost}
                    value={tipoPublicacaoPost}
                    onChange={(event) =>
                      selecionarTipoPublicacaoPost(
                        event.target.value as TipoPublicacaoComunidade
                      )
                    }
                    style={selectStyle}
                  >
                    {TIPOS_PUBLICACAO_COMUNIDADE.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={fieldStyle}>
                  <span style={labelStyle}>Obra relacionada</span>

                  <div style={relatedWorkSearchWrapStyle}>
                    <input
                      ref={obraRelacionadaRef}
                      disabled={publicandoPost}
                      value={obraRelacionadaBusca}
                      onChange={(event) => {
                        const valorDigitado = event.target.value;

                        setObraRelacionadaBusca(valorDigitado);
                        setSugestoesObrasAbertas(Boolean(valorDigitado.trim()));
                      }}
                      onFocus={() => {
                        setSugestoesObrasAbertas(
                          Boolean(obraRelacionadaBusca.trim())
                        );
                      }}
                      onBlur={() => {
                        window.setTimeout(() => {
                          setSugestoesObrasAbertas(false);
                        }, 120);
                      }}
                      placeholder="Opcional: nome da obra"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      maxLength={90}
                      style={inputStyle}
                    />

                    {sugestoesObrasAbertas &&
                      sugestoesObrasRelacionadasVisiveis.length > 0 && (
                        <div style={relatedWorkSuggestionsStyle}>
                          {sugestoesObrasRelacionadasVisiveis.map((obra) => (
                            <button
                              key={obra.id}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                selecionarObraRelacionada(obra.titulo);
                              }}
                              style={relatedWorkSuggestionButtonStyle}
                            >
                              <span style={relatedWorkSuggestionContentStyle}>
                                <strong style={relatedWorkSuggestionTitleStyle}>
                                  {obra.titulo}
                                </strong>

                                <span style={relatedWorkSuggestionAuthorStyle}>
                                  {obra.autor}
                                </span>
                              </span>

                              <span style={relatedWorkSuggestionBadgeStyle}>
                                OBRA
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                </label>
              </div>

              <label style={fieldStyle}>
                <div style={postComposerPublicationHeaderStyle}>
                  <span style={labelStyle}>Publicação</span>

                  <div style={postComposerHeaderToolsStyle}>
                    <button
                      type="button"
                      disabled={publicandoPost}
                      onClick={prepararEnqueteComunidade}
                      style={{
                        ...pollTemplateButtonStyle,
                        opacity: publicandoPost ? 0.58 : 1,
                        cursor: publicandoPost ? "not-allowed" : "pointer",
                      }}
                    >
                      Modelo de enquete
                    </button>

                    <span style={charCountStyle}>máx. 700</span>
                  </div>
                </div>

                <textarea
                  ref={textoPostRef}
                  disabled={publicandoPost}
                  placeholder="Abra uma conversa, peça indicação ou divulgue uma obra real publicada..."
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={700}
                  rows={3}
                  style={postComposerTextareaStyle}
                />
              </label>

              {erro && <span style={errorStyle}>{erro}</span>}

              <div style={postComposerActionRowStyle}>
                <button
                  type="button"
                  disabled={publicandoPost}
                  onClick={() => setTemSpoilerPost((valorAtual) => !valorAtual)}
                  style={{
                    ...(temSpoilerPost
                      ? spoilerComposerActiveStyle
                      : spoilerComposerStyle),
                    opacity: publicandoPost ? 0.58 : 1,
                    cursor: publicandoPost ? "not-allowed" : "pointer",
                  }}
                >
                  <span style={spoilerComposerLabelStyle}>
                    Este post contém spoiler
                  </span>

                  <span
                    aria-hidden="true"
                    style={
                      temSpoilerPost
                        ? spoilerComposerCheckActiveStyle
                        : spoilerComposerCheckStyle
                    }
                  >
                    {temSpoilerPost ? "✓" : ""}
                  </span>
                </button>

                <button
                  type="submit"
                  disabled={publicandoPost}
                  style={{
                    ...primaryButtonStyle,
                    opacity: publicandoPost ? 0.64 : 1,
                    cursor: publicandoPost ? "not-allowed" : "pointer",
                  }}
                >
                  {publicandoPost ? "Publicando..." : "Publicar"}
                </button>
              </div>
            </form>
          </article>
        </section>
      )}

      <ComentariosSheet
        post={postComentariosAberto}
        podeComentar={Boolean(usuario)}
        usuarioId={usuario?.id || ""}
        usuarioNome={usuario?.nome || "Usuário"}
        usuarioAvatar={usuario?.avatar || ""}
        erroInteracao={erro}
        onFechar={fecharComentarios}
        onEnviar={comentarPost}
        onCurtirComentario={alternarCurtidaComentario}
        onRemoverComentario={removerComentario}
        onDenunciarComentario={(comentarioId) =>
          denunciarConteudo("comentario", comentarioId)
        }
      />

      {feedbackAcao && (
        <div role="status" aria-live="polite" style={actionFeedbackToastStyle}>
          {feedbackAcao}
        </div>
      )}
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
  background: "#070212",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  width: "min(1120px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "4px 0 calc(20px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "18px 0 44px",
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  marginBottom: "8px",
  minWidth: 0,
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "18px",
};


const mobileNavStyle: CSSProperties = {
  position: "relative",
  zIndex: 2,
  width: "100%",
  background: "#070212",
  borderBottom: "0",
  boxShadow: "none",
};

const desktopNavStyle: CSSProperties = {
  ...mobileNavStyle,
  background: "#070212",
  borderBottom: "0",
  boxShadow: "none",
};

const navInnerStyle: CSSProperties = {
  width: "min(820px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  padding: "14px 0 8px",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopNavInnerStyle: CSSProperties = {
  ...navInnerStyle,
  width: "min(1240px, calc(100% - 64px))",
  gridTemplateColumns: "1fr",
  gridTemplateAreas: '"top"',
  alignItems: "center",
  gap: "10px",
  padding: "12px 0 8px",
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

const desktopNavTopRowStyle: CSSProperties = {
  ...navTopRowStyle,
  gridArea: "top",
  flexWrap: "nowrap",
};

const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(520px, 72vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
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
  opacity: 0,
};













const titleUserAreaStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginTop: "10px",
  minWidth: 0,
};

const titleUserChipStyle: CSSProperties = {
  maxWidth: "min(280px, 100%)",
  minHeight: "36px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "4px 13px 4px 5px",
  borderRadius: "999px",
  background: "var(--historietas-active-surface, rgba(124,58,237,0.22))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 950,
  overflow: "hidden",
};

const titleUserIconStyle: CSSProperties = {
  width: "27px",
  height: "27px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  lineHeight: 1,
};

const titleUserNameStyle: CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const titleLoginButtonStyle: CSSProperties = {
  minHeight: "34px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 14px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  border: "none",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
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
  background: "#04000A",
  color: "#FFFFFF",
  fontSize: "19px",
  fontWeight: 950,
  letterSpacing: 0,
  flex: "0 0 auto",
  border: "1px solid rgba(59, 7, 100, 0.58)",
  boxShadow: "none",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background: "linear-gradient(135deg, #FFFFFF 0%, #DDD6FE 44%, #A78BFA 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "none",
};

const topActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  minWidth: 0,
};

const topLinkStyle: CSSProperties = {
  minHeight: "34px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 11px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 950,
  whiteSpace: "nowrap",
};


const userBadgeStyle: CSSProperties = {
  minHeight: "34px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 12px",
  borderRadius: "999px",
  background: "var(--historietas-active-surface, rgba(124,58,237,0.22))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 950,
  maxWidth: "112px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const heroStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#04000A",
  boxShadow: "none",
  minWidth: 0,
};

const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  borderRadius: "32px",
};

const heroGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(0,0,0,0.18) 100%)",
  pointerEvents: "none",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "11px",
  display: "grid",
  gap: "6px",
  minWidth: 0,
};

const desktopHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  gridTemplateColumns: "minmax(0, 1fr) 260px",
  alignItems: "center",
  padding: "28px",
  gap: "24px",
};

const introStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const miniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.095em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(34px, 8vw, 72px)",
  lineHeight: 0.98,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  maxWidth: "760px",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 48%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  paddingBottom: "4px",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "14px",
  lineHeight: 1.6,
  fontWeight: 700,
  maxWidth: "680px",
  ...safeTextStyle,
};

const mobileTitleStyle: CSSProperties = {
  ...titleStyle,
  fontSize: "clamp(27px, 8.3vw, 38px)",
  lineHeight: 0.98,
  letterSpacing: "-0.07em",
  paddingBottom: "2px",
};

const mobileDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  fontSize: "12px",
  lineHeight: 1.34,
};

const heroPillsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px",
  marginTop: "2px",
};

const heroPillStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 10px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.065))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.095))",
  color: "var(--historietas-text-primary, #E4E4E7)",
  fontSize: "11px",
  fontWeight: 900,
  ...safeTextStyle,
};

const heroPanelStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  padding: "16px",
  borderRadius: "22px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  minWidth: 0,
};

const desktopHeroPanelStyle: CSSProperties = {
  ...heroPanelStyle,
  alignSelf: "stretch",
  alignContent: "center",
  justifyItems: "center",
  textAlign: "center",
};

const panelNumberStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "48px",
  lineHeight: 0.95,
  fontWeight: 950,
  letterSpacing: "-0.08em",
};

const panelLabelStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  fontWeight: 950,
};

const panelMetaStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  fontWeight: 800,
};

const layoutStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  marginTop: "6px",
};

const desktopLayoutStyle: CSSProperties = {
  ...layoutStyle,
  gridTemplateColumns: "minmax(0, 1fr)",
  justifyItems: "center",
  gap: "18px",
  marginTop: "18px",
};

const feedColumnStyle: CSSProperties = {
  width: "min(880px, 100%)",
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

const focusedPostStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  marginBottom: "14px",
  padding: "12px",
  borderRadius: "24px",
  background: "#04000A",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const desktopFocusedPostStyle: CSSProperties = {
  ...focusedPostStyle,
  padding: "14px",
  borderRadius: "26px",
};

const focusedPostHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "wrap",
  minWidth: 0,
};

const focusedPostTitleBoxStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  minWidth: 0,
};

const focusedPostTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "21px",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.052em",
  ...safeTextStyle,
};

const focusedPostCloseButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.075))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  padding: "0 12px",
  fontSize: "11px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  boxShadow: "none",
};

const focusedPostCardStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  padding: "13px",
  borderRadius: "20px",
  background: "var(--historietas-surface, rgba(12,7,23,0.72))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.085))",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const focusedPostAuthorRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  minWidth: 0,
};

const focusedPostAvatarStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, var(--historietas-secondary, #7C3AED), var(--historietas-accent, #F97316))",
  color: "#FFFFFF",
  fontSize: "15px",
  fontWeight: 950,
  flex: "0 0 auto",
};

const focusedPostAuthorInfoStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  minWidth: 0,
};

const focusedPostAuthorNameStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  fontWeight: 950,
  ...safeTextStyle,
};

const focusedPostMetaStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 760,
  ...safeTextStyle,
};

const focusedPostWorkLinkStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 900,
  ...safeTextStyle,
};

const focusedPostTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14px",
  lineHeight: 1.55,
  fontWeight: 720,
  whiteSpace: "pre-wrap",
  ...safeTextStyle,
};

const focusedSpoilerBoxStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "9px 13px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, rgba(127,29,29,0.18), rgba(0,0,0,0.16))",
  border: "1px solid rgba(248,113,113,0.22)",
  minWidth: 0,
  boxShadow: "none",
};


const focusedPostStatsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  flexWrap: "wrap",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 850,
  ...safeTextStyle,
};

const focusedPostActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "7px",
  minWidth: 0,
};

const focusedPostPrimaryButtonStyle: CSSProperties = {
  minHeight: "38px",
  borderRadius: "999px",
  border: "none",
  background: "linear-gradient(135deg, var(--historietas-secondary, #7C3AED), var(--historietas-accent, #F97316))",
  color: "#FFFFFF",
  padding: "0 11px",
  fontSize: "11px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "center",
  boxShadow: "none",
  ...safeTextStyle,
};

const focusedPostSecondaryButtonStyle: CSSProperties = {
  ...focusedPostPrimaryButtonStyle,
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.075))",
};

const focusedPostPinnedButtonStyle: CSSProperties = {
  ...focusedPostSecondaryButtonStyle,
  color: "var(--historietas-accent, #FDBA74)",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
};

const focusedPostDangerButtonStyle: CSSProperties = {
  ...focusedPostSecondaryButtonStyle,
  color: "#FCA5A5",
  border: "1px solid rgba(248,113,113,0.26)",
  background: "rgba(127,29,29,0.18)",
};

const compactComposerActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
};

const postComposerHeaderToolsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  flexWrap: "wrap",
  minWidth: 0,
};

const pollTemplateButtonStyle: CSSProperties = {
  minHeight: "auto",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  padding: 0,
  fontSize: "10px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  boxShadow: "none",
  ...safeTextStyle,
};

const pollPostBoxStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  marginTop: "2px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};

const pollPostQuestionStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.35,
  fontWeight: 950,
  ...safeTextStyle,
};

const pollPostOptionsStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
};

const pollPostOptionStyle: CSSProperties = {
  position: "relative",
  minHeight: "36px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  padding: "0 10px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "rgba(255,255,255,0.045)",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  opacity: 1,
  fontSize: "11px",
  fontWeight: 900,
  fontFamily: "inherit",
  cursor: "pointer",
  overflow: "hidden",
  boxShadow: "none",
};

const pollPostOptionSelectedStyle: CSSProperties = {
  ...pollPostOptionStyle,
  border: "1px solid rgba(56,189,248,0.62)",
  background: "linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  opacity: 1,
};

const pollPostResultBarStyle: CSSProperties = {
  position: "absolute",
  inset: "0 auto 0 0",
  background: "rgba(56,189,248,0.22)",
  pointerEvents: "none",
};

const pollPostOptionTextStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minWidth: 0,
  textAlign: "left",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  opacity: 1,
  textShadow: "0 1px 2px rgba(0,0,0,0.38)",
  ...safeTextStyle,
};

const pollPostStatusStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  opacity: 1,
  textShadow: "0 1px 2px rgba(0,0,0,0.38)",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const focusedPollBoxStyle: CSSProperties = {
  ...pollPostBoxStyle,
  gap: "9px",
  padding: 0,
  borderRadius: 0,
};

const focusedPollQuestionStyle: CSSProperties = {
  ...pollPostQuestionStyle,
  fontSize: "14px",
};

const focusedPollOptionsStyle: CSSProperties = {
  ...pollPostOptionsStyle,
  gap: "7px",
};

const focusedPollOptionStyle: CSSProperties = {
  ...pollPostOptionStyle,
  minHeight: "39px",
  fontSize: "11.5px",
};

const focusedPollOptionSelectedStyle: CSSProperties = {
  ...focusedPollOptionStyle,
  border: "1px solid rgba(56,189,248,0.62)",
  background: "linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)",
  color: "#FFFFFF",
};

const focusedPollResultBarStyle: CSSProperties = {
  ...pollPostResultBarStyle,
};

const focusedPollOptionTextStyle: CSSProperties = {
  ...pollPostOptionTextStyle,
};

const focusedPollStatusStyle: CSSProperties = {
  ...pollPostStatusStyle,
};

const composerHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "start",
  justifyContent: "center",
  gap: "12px",
  minWidth: 0,
  textAlign: "center",
};

const composerTitleWrapStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
};

const sectionTitleStyle: CSSProperties = {
  margin: "3px 0 0",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "18px",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

const publishTitleStyle: CSSProperties = {
  ...sectionTitleStyle,
  width: "100%",
  color: "var(--historietas-accent, #FDBA74)",
  textAlign: "center",
};

const composerFormStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const composerFieldsStackStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const composerFieldsGridStyle: CSSProperties = {
  ...composerFieldsStackStyle,
  gridTemplateColumns: "150px 190px minmax(0, 1fr)",
};

const composerFooterStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
};

const charCountStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 850,
};

const compactComposerStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const compactComposerButtonStyle: CSSProperties = {
  width: "fit-content",
  minWidth: "164px",
  maxWidth: "100%",
  minHeight: "38px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "#08030F",
  color: "#FFFFFF",
  fontSize: "11.5px",
  fontWeight: 950,
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 15px",
  cursor: "pointer",
  boxShadow: "none",
  ...safeTextStyle,
};

const visitorComposerStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  minWidth: 0,
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  minWidth: 0,
};

const labelStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 950,
  ...safeTextStyle,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "38px",
  borderRadius: "15px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#04000A",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 12px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 750,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
};

const relatedWorkSearchWrapStyle: CSSProperties = {
  position: "relative",
  minWidth: 0,
  zIndex: 4,
};

const relatedWorkSuggestionsStyle: CSSProperties = {
  position: "relative",
  top: "auto",
  left: "auto",
  right: "auto",
  zIndex: 1,
  display: "grid",
  gap: 0,
  marginTop: "8px",
  padding: "0 8px",
  borderRadius: 0,
  border: "none",
  background: "transparent",
  boxShadow: "none",
  maxHeight: "260px",
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  boxSizing: "border-box",
};

const relatedWorkSuggestionButtonStyle: CSSProperties = {
  minHeight: "58px",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  padding: "12px 0",
  borderRadius: 0,
  border: "none",
  borderBottom: "1px solid rgba(255,255,255,0.10)",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "left",
  minWidth: 0,
  boxSizing: "border-box",
};

const relatedWorkSuggestionContentStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  minWidth: 0,
};

const relatedWorkSuggestionTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.15,
  fontWeight: 950,
  ...safeTextStyle,
};

const relatedWorkSuggestionAuthorStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.25,
  fontWeight: 750,
  ...safeTextStyle,
};

const relatedWorkSuggestionBadgeStyle: CSSProperties = {
  flex: "0 0 auto",
  borderRadius: 0,
  border: "none",
  color: "#D4D4D8",
  background: "transparent",
  padding: 0,
  fontSize: "10px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  whiteSpace: "nowrap",
};

const selectStyle: CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: "82px",
  borderRadius: "17px",
  padding: "10px 12px",
  resize: "vertical",
  lineHeight: 1.45,
};

const postComposerOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  height: "100dvh",
  zIndex: 92,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  pointerEvents: "none",
};

const postComposerBackdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  border: "none",
  background: "rgba(3, 2, 8, 0.30)",
  pointerEvents: "auto",
  cursor: "pointer",
};

const postComposerSheetStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(680px, 100%)",
  maxWidth: "100%",
  maxHeight: "calc(92dvh - env(safe-area-inset-top))",
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  gap: "0",
  padding: "10px 12px calc(12px + env(safe-area-inset-bottom))",
  borderRadius: "24px 24px 0 0",
  background:
    "linear-gradient(180deg, var(--historietas-surface-strong, rgba(12,7,23,0.98)) 0%, var(--historietas-bg-mid, rgba(18,8,31,0.98)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  borderBottom: "none",
  boxShadow: "none",
  pointerEvents: "auto",
  boxSizing: "border-box",
  overflow: "hidden",
  contain: "layout paint",
  isolation: "isolate",
};

const postComposerDesktopSheetStyle: CSSProperties = {
  ...postComposerSheetStyle,
  width: "min(760px, calc(100% - 48px))",
  maxHeight: "min(760px, calc(100dvh - 56px))",
  alignSelf: "center",
  borderRadius: "28px",
  borderBottom: "none",
};

const postComposerHeaderStyle: CSSProperties = {
  minHeight: "36px",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  alignItems: "center",
  justifyItems: "center",
  gap: "8px",
  borderBottom: "none",
  paddingBottom: "8px",
  minWidth: 0,
  textAlign: "center",
};

const postComposerTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.02em",
  ...safeTextStyle,
};

const postComposerFormStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  minWidth: 0,
  overflowY: "auto",
  overscrollBehavior: "contain",
  padding: "4px 2px 0",
  WebkitOverflowScrolling: "touch",
};

const postComposerFieldsStackStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const postComposerFieldsGridStyle: CSSProperties = {
  ...postComposerFieldsStackStyle,
  gridTemplateColumns: "150px 190px minmax(0, 1fr)",
};

const postComposerTextareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: "66px",
  maxHeight: "130px",
  borderRadius: "17px",
  padding: "10px 12px",
  resize: "none",
  lineHeight: 1.45,
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
};

const postComposerPublicationHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  minWidth: 0,
};

const postComposerActionRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
};

const spoilerComposerStyle: CSSProperties = {
  minHeight: "39px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  padding: "0 10px 0 12px",
  borderRadius: "999px",
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 900,
  fontFamily: "inherit",
  cursor: "pointer",
  width: "100%",
  maxWidth: "100%",
  textAlign: "center",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const spoilerComposerActiveStyle: CSSProperties = {
  ...spoilerComposerStyle,
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#FFFFFF",
};

const spoilerComposerLabelStyle: CSSProperties = {
  minWidth: 0,
  flex: "1 1 auto",
  textAlign: "center",
  ...safeTextStyle,
};

const spoilerComposerCheckStyle: CSSProperties = {
  width: "17px",
  height: "17px",
  borderRadius: "5px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.18))",
  background: "rgba(255,255,255,0.035)",
  color: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  fontSize: "13px",
  lineHeight: 1,
  fontWeight: 950,
};

const spoilerComposerCheckActiveStyle: CSSProperties = {
  ...spoilerComposerCheckStyle,
  border: "1px solid rgba(34,197,94,0.70)",
  background: "rgba(34,197,94,0.10)",
  color: "#22C55E",
};

const primaryButtonStyle: CSSProperties = {
  minHeight: "39px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "#08030F",
  color: "#FFFFFF",
  fontSize: "12.5px",
  fontWeight: 950,
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 14px",
  boxShadow: "none",
  cursor: "pointer",
  ...safeTextStyle,
};

const primaryLinkButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  width: "fit-content",
  minWidth: "176px",
  maxWidth: "100%",
  justifySelf: "center",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: "39px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: "0 12px",
  cursor: "pointer",
  boxShadow: "none",
};

const errorStyle: CSSProperties = {
  display: "block",
  padding: "9px 11px",
  borderRadius: "15px",
  background: "var(--historietas-danger-surface, rgba(239,68,68,0.12))",
  border:
    "1px solid rgba(248,113,113,0.24)",
  color: "var(--historietas-danger-button-text, #FCA5A5)",
  fontSize: "12px",
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const authLoadingStyle: CSSProperties = {
  minHeight: "34px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "17px",
  background: "var(--historietas-input-bg, #18181B)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  fontWeight: 850,
  textAlign: "center",
};


const communityErrorNoticeStyle: CSSProperties = {
  display: "block",
  padding: "10px 12px",
  borderRadius: "16px",
  background: "var(--historietas-danger-surface, rgba(239,68,68,0.12))",
  border:
    "1px solid rgba(248,113,113,0.24)",
  color: "var(--historietas-danger-button-text, #FCA5A5)",
  fontSize: "12px",
  fontWeight: 850,
  ...safeTextStyle,
};

const weeklyChallengeStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  padding: "13px",
  borderRadius: "23px",
  background: "#04000A",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "none",
  minWidth: 0,
};

const weeklyChallengeDesktopStyle: CSSProperties = {
  ...weeklyChallengeStyle,
  gridTemplateColumns: "minmax(0, 1fr)",
  alignItems: "center",
  justifyItems: "center",
  padding: "16px",
  borderRadius: "27px",
  textAlign: "center",
};

const weeklyChallengeTextStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "5px",
  minWidth: 0,
  textAlign: "center",
};

const weeklyChallengeKickerStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  textAlign: "center",
  ...safeTextStyle,
};

const weeklyChallengeTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(12px, 3.35vw, 15px)",
  lineHeight: 1.18,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
};

const weeklyChallengeButtonStyle: CSSProperties = {
  minHeight: "38px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "#08030F",
  color: "#FFFFFF",
  fontSize: "11.5px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  padding: "0 13px",
  boxShadow: "none",
};

const weeklyChallengeButtonDesktopStyle: CSSProperties = {
  ...weeklyChallengeButtonStyle,
  minWidth: "150px",
  justifySelf: "center",
};


const communityQuickActionsInlinePlusButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "36px",
  height: "44px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  padding: 0,
  boxShadow: "none",
};

const communityQuickActionsPanelStyle: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 10px)",
  right: 0,
  width: "min(260px, calc(100vw - 48px))",
  display: "grid",
  gap: "8px",
  padding: "8px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#15191C",
  boxShadow: "0 18px 42px rgba(0,0,0,0.34)",
  zIndex: 30,
};

const communityQuickActionsItemStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "48px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.035)",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "15px",
  fontWeight: 900,
  textAlign: "center",
  cursor: "pointer",
  ...safeTextStyle,
};

const publishChallengeStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
};

const publishChallengeDesktopStyle: CSSProperties = {
  ...publishChallengeStyle,
  gap: "14px",
};

const publishChallengeComposerAreaStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  minWidth: 0,
};

const mergedWeeklyChallengeStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  minWidth: 0,
  justifyItems: "center",
};

const mergedWeeklyChallengeDesktopStyle: CSSProperties = {
  ...mergedWeeklyChallengeStyle,
  gap: "11px",
};


const exploreLikeFilterBoxStyle: CSSProperties = {
  marginTop: "0",
  display: "grid",
  gap: "5px",
  padding: "0",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
  overflow: "visible",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const desktopExploreLikeFilterBoxStyle: CSSProperties = {
  ...exploreLikeFilterBoxStyle,
  gridTemplateColumns: "1fr",
  alignItems: "stretch",
  gap: "10px",
  padding: "0",
  borderRadius: 0,
};

const exploreLikeSearchInputStyle: CSSProperties = {
  width: "100%",
  height: "50px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(39, 39, 42, 0.86)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 18px",
  outline: "none",
  fontSize: "14px",
  fontWeight: 820,
  textAlign: "left",
  boxSizing: "border-box",
  boxShadow: "none",
  minWidth: 0,
};

const desktopExploreLikeSearchInputStyle: CSSProperties = {
  ...exploreLikeSearchInputStyle,
  height: "48px",
  fontSize: "14px",
  padding: "0 18px",
};

const communitySearchShellStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  minHeight: "44px",
  borderRadius: "999px",
  border: "1px solid transparent",
  background: "#04000A",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "0 14px",
  boxSizing: "border-box",
  boxShadow: "none",
  outline: "none",
};

const communitySearchIconStyle: CSSProperties = {
  color: "rgba(255,255,255,0.72)",
  width: "22px",
  height: "22px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  flex: "0 0 auto",
};

const communitySearchInputStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minWidth: 0,
  height: "44px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "14px",
  fontWeight: 700,
  letterSpacing: 0,
  boxSizing: "border-box",
};

const communityFilterControlsRowStyle: CSSProperties = {
  minHeight: "44px",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "8px",
  width: "100%",
  minWidth: 0,
};

const communityFilterLabelButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  flex: "0 0 auto",
  minHeight: "44px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "15px",
  lineHeight: 1.15,
  fontWeight: 950,
  letterSpacing: "-0.04em",
  textAlign: "left",
  padding: "0 2px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const exploreLikeClearFilterButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 12px",
  ...safeTextStyle,
};

const communityFilterActionButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "38px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "15px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "left",
  padding: "4px 0",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  ...safeTextStyle,
};

const communityFilterActionIconStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1,
  fontWeight: 700,
  flex: "0 0 auto",
};

const communityFiltersSheetOverlayStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  height: "100dvh",
  zIndex: 240,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  background: "rgba(0,0,0,0.68)",
  padding: 0,
  boxSizing: "border-box",
  overscrollBehavior: "none",
  touchAction: "none",
};

const communityFiltersSheetBackdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
};

const communityFiltersSheetStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 0,
  transform: "translateX(-50%)",
  zIndex: 241,
  width: "min(820px, calc(100% - 4px))",
  maxHeight: "calc(100dvh - 116px)",
  display: "grid",
  gap: "0",
  padding: "8px 0 calc(104px + env(safe-area-inset-bottom))",
  borderRadius: "24px 24px 0 0",
  background: "#070212",
  border: "1px solid rgba(255,255,255,0.06)",
  borderBottom: "none",
  overflowY: "auto",
  overflowX: "hidden",
  overscrollBehavior: "none",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.38)",
  boxSizing: "border-box",
  touchAction: "none",
};

const communityFiltersSheetHandleStyle: CSSProperties = {
  justifySelf: "center",
  width: "72px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.62)",
  margin: "0 auto 14px",
};

const communityFiltersSheetTitleStyle: CSSProperties = {
  display: "block",
  margin: "0 0 12px",
  padding: 0,
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1.1,
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.04em",
  ...safeTextStyle,
};

const communityFiltersSheetSectionLabelStyle: CSSProperties = {
  display: "block",
  padding: "11px 30px 5px",
  color: "rgba(244,244,245,0.56)",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const communityFiltersSheetOptionStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "44px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 650,
  letterSpacing: "-0.035em",
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  padding: "0 30px",
  textAlign: "left",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const communityFiltersSheetOptionActiveStyle: CSSProperties = {
  ...communityFiltersSheetOptionStyle,
  fontWeight: 900,
  background: "transparent",
};

const communityFiltersSheetRadioStyle: CSSProperties = {
  width: "23px",
  height: "23px",
  borderRadius: "999px",
  border: "2.5px solid rgba(161,161,170,0.72)",
  background: "transparent",
  flex: "0 0 auto",
  boxSizing: "border-box",
};

const communityFiltersSheetRadioActiveStyle: CSSProperties = {
  ...communityFiltersSheetRadioStyle,
  border: "6.5px solid #FFFFFF",
};

const communityFiltersSheetClearButtonStyle: CSSProperties = {
  width: "calc(100% - 60px)",
  justifySelf: "center",
  minHeight: "46px",
  marginTop: "12px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "transparent",
  color: "#FFFFFF",
  fontSize: "15px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  ...safeTextStyle,
};

const communityActionsSheetStyle: CSSProperties = {
  ...communityFiltersSheetStyle,
  maxHeight: "calc(100dvh - 190px)",
  padding: "8px 0 calc(18px + env(safe-area-inset-bottom))",
};

const communityActionsSheetItemStyle: CSSProperties = {
  ...communityFiltersSheetOptionStyle,
  minHeight: "48px",
  fontSize: "18px",
  fontWeight: 900,
};

const communityActionsSheetDangerItemStyle: CSSProperties = {
  ...communityActionsSheetItemStyle,
  color: "#FB7185",
};

const communityToolsStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  padding: "12px",
  borderRadius: "22px",
  background: "#04000A",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "none",
  minWidth: 0,
};

const communityToolsDesktopStyle: CSSProperties = {
  ...communityToolsStyle,
  gridTemplateColumns: "minmax(0, 1fr) minmax(310px, auto)",
  alignItems: "end",
  padding: "14px",
  gap: "14px",
};

const searchFieldStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "7px",
  width: "100%",
  minWidth: 0,
  textAlign: "center",
};

const searchLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  height: "44px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#04000A",
  color: "var(--historietas-text-primary, #FFFFFF)",
  outline: "none",
  padding: "0 14px",
  fontSize: "13px",
  fontWeight: 820,
  boxSizing: "border-box",
};

const advancedCommunityFiltersPanelStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  justifyItems: "center",
  gap: "10px",
  padding: "12px",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(18,12,30,0.82)) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.94)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  boxShadow: "var(--historietas-card-shadow, none)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  textAlign: "center",
};

const desktopAdvancedCommunityFiltersPanelStyle: CSSProperties = {
  ...advancedCommunityFiltersPanelStyle,
  padding: "16px",
  borderRadius: "26px",
  gap: "12px",
};

const advancedCommunityFiltersHeaderStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  justifyItems: "center",
  gap: "8px",
  minWidth: 0,
  textAlign: "center",
};

const advancedCommunityFiltersTitleBoxStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "4px",
  minWidth: 0,
  textAlign: "center",
};

const advancedCommunityFiltersTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  textAlign: "center",
  ...safeTextStyle,
};

const filterResultBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  minHeight: "28px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 10px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const advancedCommunitySearchRowStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "7px",
  width: "100%",
  minWidth: 0,
  textAlign: "center",
};

const quickFiltersGridStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "center",
  gap: "7px",
  flexWrap: "wrap",
  minWidth: 0,
};

const quickFilterButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: "0 11px",
  whiteSpace: "nowrap",
  cursor: "pointer",
  ...safeTextStyle,
};

const quickFilterActiveStyle: CSSProperties = {
  ...quickFilterButtonStyle,
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "#FFFFFF",
};

const advancedToggleRowStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "center",
  minWidth: 0,
};

const advancedToggleButtonStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  padding: "0 14px",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  ...safeTextStyle,
};

const advancedFiltersGridStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "10px",
  minWidth: 0,
  paddingTop: "2px",
};

const desktopAdvancedFiltersGridStyle: CSSProperties = {
  ...advancedFiltersGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
};

const communityFilterFieldStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "6px",
  minWidth: 0,
  padding: "9px",
  borderRadius: "16px",
  background: "var(--historietas-surface, rgba(255,255,255,0.03))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.06))",
  textAlign: "center",
};

const communityFilterSelectStyle: CSSProperties = {
  width: "100%",
  height: "40px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.11))",
  background: "var(--historietas-input-bg, #120B1F)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 12px",
  outline: "none",
  fontSize: "11.5px",
  fontWeight: 820,
  boxSizing: "border-box",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  textAlign: "center",
};

const compactClearFiltersStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  width: "100%",
  marginTop: "2px",
};

const sortBoxStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "7px",
  width: "100%",
  minWidth: 0,
  textAlign: "center",
};

const sortLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const sortButtonsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  overflowX: "auto",
  maxWidth: "100%",
  paddingBottom: "1px",
  WebkitOverflowScrolling: "touch",
};

const sortButtonStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  padding: "0 12px",
  fontSize: "11px",
  fontWeight: 950,
  whiteSpace: "nowrap",
  cursor: "pointer",
  fontFamily: "inherit",
};

const sortButtonActiveStyle: CSSProperties = {
  ...sortButtonStyle,
  background: "var(--historietas-active-surface, rgba(124,58,237,0.25))",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const feedSummaryStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "4px",
  padding: "0 2px 0",
  minWidth: 0,
  textAlign: "center",
};


const feedSummaryTitleRowStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  minWidth: 0,
  textAlign: "center",
  paddingRight: 0,
};

const feedSummaryTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(18px, 5vw, 26px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  textAlign: "center",
  ...safeTextStyle,
};

const feedSummaryMiniTitleLargeStyle: CSSProperties = {
  ...miniTitleStyle,
  fontSize: "clamp(18px, 5vw, 26px)",
  lineHeight: 1,
  letterSpacing: "-0.045em",
  textAlign: "center",
};

const feedSummaryCountSmallStyle: CSSProperties = {
  ...feedSummaryTitleStyle,
  fontSize: "10px",
  lineHeight: 1.2,
  letterSpacing: "0.095em",
};

const feedSummaryTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 750,
  lineHeight: 1.35,
  ...safeTextStyle,
};

const clearFiltersButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  padding: "0 11px",
  fontSize: "11px",
  fontWeight: 950,
  whiteSpace: "nowrap",
  cursor: "pointer",
};

const feedLoadingLineLargeStyle: CSSProperties = {
  display: "block",
  width: "64%",
  height: "14px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
};

const typeFilterPanelStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  padding: "11px",
  borderRadius: "22px",
  background: "#04000A",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "none",
  minWidth: 0,
};

const typeFilterHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  minWidth: 0,
};

const typeFilterTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const typeFilterHintStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 850,
  textAlign: "right",
  ...safeTextStyle,
};

const typeFiltersStyle: CSSProperties = {
  display: "flex",
  gap: "7px",
  overflowX: "auto",
  paddingBottom: "2px",
  scrollbarWidth: "none",
  WebkitOverflowScrolling: "touch",
};

const typeFilterButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: "0 11px",
  whiteSpace: "nowrap",
  cursor: "pointer",
  flex: "0 0 auto",
};

const typeFilterButtonActiveStyle: CSSProperties = {
  ...typeFilterButtonStyle,
  background: "var(--historietas-active-surface, rgba(124,58,237,0.25))",
  border:
    "1px solid rgba(255,255,255,0.14)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const filtersStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  overflowX: "auto",
  padding: "0 28px 5px 2px",
  margin: "0 -2px",
  scrollbarWidth: "none",
  WebkitOverflowScrolling: "touch",
};

const filterButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  fontSize: "11.5px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: "0 12px",
  whiteSpace: "nowrap",
  cursor: "pointer",
  flex: "0 0 auto",
};

const activeFilterButtonStyle: CSSProperties = {
  ...filterButtonStyle,
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "#FFFFFF",
};


const savedFilterStyle: CSSProperties = {
  ...filterButtonStyle,
  marginLeft: "auto",
};

const savedFilterActiveStyle: CSSProperties = {
  ...savedFilterStyle,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "var(--historietas-accent, #FDBA74)",
};

const postsListStyle: CSSProperties = {
  display: "grid",
  gap: 0,
  minWidth: 0,
};

const loadMorePostsWrapStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  margin: "2px 0 4px",
  minWidth: 0,
};

const loadMorePostsButtonStyle: CSSProperties = {
  minHeight: "38px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 16px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "#08030F",
  color: "#FFFFFF",
  fontSize: "11.5px",
  fontWeight: 950,
  fontFamily: "inherit",
  textAlign: "center",
  boxShadow: "none",
  ...safeTextStyle,
};

const postCardStyle: CSSProperties = {
  display: "grid",
  gap: "11px",
  padding: "14px 0",
  borderRadius: 0,
  background: "transparent",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "none",
  minWidth: 0,
  overflow: "visible",
};

const postCardDesktopStyle: CSSProperties = {
  ...postCardStyle,
  gap: "12px",
  padding: "16px 0",
  borderRadius: 0,
};

const postHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "38px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
  overflow: "visible",
};

const authorAvatarStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#04000A",
  border: "1px solid rgba(59, 7, 100, 0.58)",
  color: "#FFFFFF",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  boxShadow: "none",
};

const authorAvatarLinkStyle: CSSProperties = {
  ...authorAvatarStyle,
  textDecoration: "none",
  cursor: "pointer",
};


const postMetaStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

const postAuthorStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14px",
  fontWeight: 950,
  ...safeTextStyle,
};

const postAuthorLinkStyle: CSSProperties = {
  ...postAuthorStyle,
  textDecoration: "none",
  cursor: "pointer",
};


const postSubMetaStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 800,
  ...safeTextStyle,
};

const removeButtonStyle: CSSProperties = {
  minHeight: "30px",
  borderRadius: "999px",
  border: "1px solid rgba(248,113,113,0.24)",
  background: "var(--historietas-danger-surface, rgba(239,68,68,0.11))",
  color: "var(--historietas-danger-button-text, #FCA5A5)",
  fontSize: "10px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: "0 9px",
  cursor: "pointer",
};

const obraBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 900,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  minWidth: 0,
  ...safeTextStyle,
};

const postBadgesRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  flexWrap: "wrap",
  minWidth: 0,
};

const postBadgeSeparatorStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 900,
  lineHeight: 1,
};

const postTypeBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 950,
  ...safeTextStyle,
};

const pollPostInlineQuestionStyle: CSSProperties = {
  ...postTypeBadgeStyle,
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const pinnedPostBadgeStyle: CSSProperties = {
  ...postTypeBadgeStyle,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontWeight: 800,
};


const spoilerHiddenBoxStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 12px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, rgba(127,29,29,0.18), rgba(0,0,0,0.16))",
  border: "1px solid rgba(248,113,113,0.22)",
  minWidth: 0,
  boxShadow: "none",
};

const spoilerHiddenTitleStyle: CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  maxWidth: "100%",
  margin: 0,
  color: "#FCA5A5",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1.35,
  ...safeTextStyle,
};


const postTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #F4F4F5)",
  fontSize: "13.5px",
  lineHeight: 1.55,
  fontWeight: 720,
  whiteSpace: "pre-wrap",
  ...safeTextStyle,
};

const postOptionsWrapStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  flex: "0 0 24px",
  width: "24px",
  minWidth: "24px",
  overflow: "visible",
  zIndex: 40,
};

const postOptionsButtonStyle: CSSProperties = {
  width: "24px",
  height: "30px",
  borderRadius: 0,
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  fontWeight: 950,
  letterSpacing: 0,
  lineHeight: 1,
  fontFamily: "inherit",
  cursor: "pointer",
  padding: 0,
  position: "relative",
  zIndex: 2,
  boxShadow: "none",
};

const postOptionsButtonActiveStyle: CSSProperties = {
  ...postOptionsButtonStyle,
  opacity: 0,
  pointerEvents: "none",
};

const postOptionsBackdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  border: "none",
  background: "transparent",
  padding: 0,
  cursor: "default",
  zIndex: 41,
};

const postOptionsMenuStyle: CSSProperties = {
  position: "absolute",
  top: "34px",
  left: "auto",
  right: 0,
  transform: "translateX(-10px)",
  width: "196px",
  maxWidth: "calc(100vw - 36px)",
  boxSizing: "border-box",
  display: "grid",
  gap: "1px",
  padding: "5px",
  borderRadius: "13px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "rgba(12,8,20,0.98)",
  overflow: "visible",
  zIndex: 45,
  boxShadow: "none",
};

const postOptionsMenuItemStyle: CSSProperties = {
  minHeight: "30px",
  width: "100%",
  border: "none",
  borderRadius: "9px",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  textAlign: "left",
  fontFamily: "inherit",
  fontSize: "11.5px",
  fontWeight: 850,
  padding: "0 9px",
  whiteSpace: "nowrap",
  overflow: "visible",
  overflowWrap: "normal",
  wordBreak: "normal",
  textOverflow: "clip",
  cursor: "pointer",
  boxShadow: "none",
};

const postOptionsMenuDangerItemStyle: CSSProperties = {
  ...postOptionsMenuItemStyle,
  color: "#FB7185",
};

const postActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  gap: "8px",
  flexWrap: "wrap",
  minWidth: 0,
};

const postActionsDesktopStyle: CSSProperties = {
  ...postActionsStyle,
  alignItems: "center",
};

const postActionsOptionsWrapStyle: CSSProperties = {
  marginLeft: "auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  minWidth: "24px",
};

const actionButtonStyle: CSSProperties = {
  minHeight: "26px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "0",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: "0 4px",
  cursor: "pointer",
  minWidth: "0",
  textAlign: "center",
  whiteSpace: "nowrap",
  boxShadow: "none",
};

const likedActionButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  color: "var(--historietas-accent, #FDBA74)",
};

const commentsBoxStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
};

const commentsSheetOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 90,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  pointerEvents: "none",
};

const commentsSheetBackdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  border: "none",
  background: "rgba(3, 2, 8, 0.28)",
  pointerEvents: "auto",
  cursor: "pointer",
};

const commentsSheetStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(680px, 100%)",
  maxHeight: "calc(100dvh - env(safe-area-inset-top) - 10px)",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr) auto auto",
  gap: "7px",
  padding: "5px 12px calc(10px + env(safe-area-inset-bottom))",
  borderRadius: "28px 28px 0 0",
  background: "#070212",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.14))",
  borderBottom: "none",
  pointerEvents: "auto",
  overflow: "hidden",
  willChange: "height",
};

const commentsSheetCompactStyle: CSSProperties = {
  height: "min(64dvh, 540px)",
};

const commentsSheetExpandedStyle: CSSProperties = {
  height: "min(90dvh, 760px)",
};

const commentsSheetHandleWrapStyle: CSSProperties = {
  minHeight: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  touchAction: "none",
  cursor: "grab",
  willChange: "transform",
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

const commentsSheetCloseStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  justifySelf: "end",
  borderRadius: "999px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "27px",
  lineHeight: 1,
  fontWeight: 500,
  fontFamily: "inherit",
  padding: 0,
  cursor: "pointer",
};

const commentsSheetListStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: "10px",
  minHeight: 0,
  overflowY: "auto",
  padding: "6px 2px 9px",
  WebkitOverflowScrolling: "touch",
};

const commentItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr) 26px",
  gap: "10px",
  alignItems: "start",
  minWidth: 0,
};

const commentAvatarStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#04000A",
  border: "1px solid rgba(59, 7, 100, 0.58)",
  color: "#FFFFFF",
  fontSize: "19px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  boxShadow: "none",
  flex: "0 0 auto",
};

const commentAvatarLinkStyle: CSSProperties = {
  ...commentAvatarStyle,
  textDecoration: "none",
  cursor: "pointer",
};


const commentContentStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  minWidth: 0,
};

const commentTopLineStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "6px",
  minWidth: 0,
};

const commentAuthorStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 950,
};

const commentAuthorLinkStyle: CSSProperties = {
  ...commentAuthorStyle,
  textDecoration: "none",
  cursor: "pointer",
};


const commentTimeStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  fontWeight: 750,
};

const commentTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12.5px",
  lineHeight: 1.38,
  fontWeight: 750,
  ...safeTextStyle,
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
  width: "fit-content",
  border: "none",
  background: "transparent",
  color: "var(--historietas-danger-button-text, #FCA5A5)",
  fontSize: "10.5px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: "1px 0 0",
  cursor: "pointer",
};

const commentReportButtonStyle: CSSProperties = {
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
};

const commentsSheetErrorStyle: CSSProperties = {
  display: "block",
  padding: "8px 10px",
  borderRadius: "14px",
  background: "var(--historietas-danger-surface, rgba(239,68,68,0.12))",
  border:
    "1px solid rgba(248,113,113,0.24)",
  color: "var(--historietas-danger-button-text, #FCA5A5)",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.35,
  textAlign: "center",
  ...safeTextStyle,
};

const commentsToolsStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  padding: "5px 0 0",
  borderTop: "none",
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
  background: "transparent",
};

const commentsInputBoxStyle: CSSProperties = {
  minWidth: 0,
  minHeight: "38px",
  display: "flex",
  alignItems: "center",
};




const commentsInputAvatarStyle: CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "999px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#04000A",
  border: "1px solid rgba(59, 7, 100, 0.58)",
  color: "#FFFFFF",
  fontSize: "11.5px",
  fontWeight: 950,
  boxShadow: "none",
};

const commentsSheetInputStyle: CSSProperties = {
  ...inputStyle,
  minHeight: "38px",
  maxHeight: "82px",
  borderRadius: "999px",
  padding: "9px 12px",
  fontSize: "12.5px",
  lineHeight: 1.32,
  resize: "none",
  overflowY: "auto",
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
  border: "none",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  fontFamily: "inherit",
  padding: 0,
};

const commentStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  padding: "9px",
  borderRadius: "16px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.04))",
};

const commentButtonStyle: CSSProperties = {
  minHeight: "38px",
  borderRadius: "999px",
  border: "none",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: "0 12px",
};

const sidebarStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  minWidth: 0,
};

const desktopSidebarStyle: CSSProperties = {
  ...sidebarStyle,
  position: "sticky",
  top: "18px",
};

const sideCardStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  padding: "15px",
  borderRadius: "24px",
  background: "#04000A",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "none",
};

const rulesListStyle: CSSProperties = {
  margin: 0,
  paddingLeft: "18px",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  lineHeight: 1.55,
  fontWeight: 750,
};

const categoryListStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px",
};

const sideCategoryButtonStyle: CSSProperties = {
  ...filterButtonStyle,
  minHeight: "32px",
  fontSize: "11px",
  padding: "0 10px",
};


const sideCategoryButtonActiveStyle: CSSProperties = {
  ...sideCategoryButtonStyle,
  background: "var(--historietas-active-surface, rgba(124,58,237,0.24))",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const sideCardHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  minWidth: 0,
};

const sideMiniButtonStyle: CSSProperties = {
  minHeight: "28px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: "0 9px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const sideTrendsListStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const sideTrendButtonStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gap: "6px",
  textAlign: "left",
  padding: "10px",
  borderRadius: "15px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  cursor: "pointer",
  minWidth: 0,
};

const sideTrendTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 900,
  lineHeight: 1.35,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const sideTrendMetaStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 850,
};

const sideStatsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "7px",
  minWidth: 0,
};

const sideStatItemStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  justifyItems: "center",
  padding: "10px 6px",
  borderRadius: "15px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  minWidth: 0,
};

const sideStatNumberStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "20px",
  fontWeight: 950,
  lineHeight: 1,
};

const sideStatLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const sideTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  lineHeight: 1.55,
  fontWeight: 750,
  ...safeTextStyle,
};
const actionFeedbackToastStyle: CSSProperties = {
  position: "fixed",
  right: "max(14px, env(safe-area-inset-right))",
  bottom: "calc(16px + env(safe-area-inset-bottom))",
  zIndex: 80,
  maxWidth: "min(360px, calc(100vw - 28px))",
  padding: "12px 14px",
  borderRadius: "18px",
  background: "var(--historietas-surface-strong, rgba(12,7,23,0.98))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 900,
  boxShadow: "none",
  ...safeTextStyle,
};