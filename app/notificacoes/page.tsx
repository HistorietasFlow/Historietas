"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

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

type NotificacaoLocal = {
  id: string;
  obraId: string;
  capituloId: string;
  link: string;
  titulo: string;
  mensagem: string;
  tipo:
    | "novo-capitulo"
    | "comentario-capitulo"
    | "comentario-comunidade"
    | "review-comunidade"
    | "atividade-comunidade"
    | "novo-seguidor"
    | "denuncia-comunidade"
    | "moderacao-comunidade";
  lida: boolean;
  criadaEm: string;
  autorId?: string;
  autorNome?: string;
  autorAvatar?: string;
};

type FiltroNotificacao = "todas" | "nao-lidas" | "lidas" | "capitulos" | "comunidade";
type OrdenacaoNotificacao = "recentes" | "antigas" | "obra" | "capitulo";

const CHAVE_OBRAS = "historietas-obras";
const CHAVE_NOTIFICACOES = "historietas-notificacoes";
const CHAVE_OBRAS_SEGUIDAS = "historietas-obras-seguidas";
const CHAVE_NOTIFICACOES_APAGADAS = "historietas-notificacoes-apagadas";

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

function criarLoginHrefNotificacoes() {
  const params = new URLSearchParams({
    redirectTo: "/notificacoes",
  });

  return `/login?${params.toString()}`;
}

function idObraSupabaseValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

function criarHrefLeituraCapitulo(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo" | "publicado">,
  capituloId: string,
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
  )}&capituloId=${encodeURIComponent(capituloId)}`;
}

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}

function formatarData(dataIso: string) {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return "Não registrada";
  }

  return data.toLocaleDateString("pt-BR");
}

function dataNotificacao(notificacao: NotificacaoLocal) {
  const data = new Date(notificacao.criadaEm).getTime();

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
        ? obra.autorId
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

function normalizarTipoNotificacao(valor: unknown): NotificacaoLocal["tipo"] {
  if (
    valor === "novo-capitulo" ||
    valor === "comentario-capitulo" ||
    valor === "comentario-comunidade" ||
    valor === "review-comunidade" ||
    valor === "atividade-comunidade" ||
    valor === "novo-seguidor" ||
    valor === "denuncia-comunidade" ||
    valor === "moderacao-comunidade"
  ) {
    return valor;
  }

  return "novo-capitulo";
}

function normalizarNotificacao(
  notificacao: Partial<NotificacaoLocal>,
  index: number
): NotificacaoLocal {
  const notificacaoBruta = notificacao as Partial<NotificacaoLocal> &
    Record<string, unknown>;

  return {
    id:
      typeof notificacao.id === "string" && notificacao.id.trim()
        ? notificacao.id
        : `notificacao-${index + 1}`,
    obraId: typeof notificacao.obraId === "string" ? notificacao.obraId : "",
    capituloId:
      typeof notificacao.capituloId === "string" ? notificacao.capituloId : "",
    link:
      typeof notificacao.link === "string" && notificacao.link.trim()
        ? notificacao.link.trim()
        : "",
    titulo:
      typeof notificacao.titulo === "string" && notificacao.titulo.trim()
        ? notificacao.titulo
        : "Nova notificação",
    mensagem:
      typeof notificacao.mensagem === "string" && notificacao.mensagem.trim()
        ? notificacao.mensagem
        : "Uma obra recebeu uma atualização.",
    tipo: normalizarTipoNotificacao(notificacaoBruta.tipo),
    lida: notificacaoBruta.lida === true,
    criadaEm:
      typeof notificacao.criadaEm === "string" && notificacao.criadaEm.trim()
        ? notificacao.criadaEm
        : new Date().toISOString(),
    autorId:
      typeof notificacaoBruta.autorId === "string"
        ? notificacaoBruta.autorId.trim()
        : "",
    autorNome:
      typeof notificacaoBruta.autorNome === "string"
        ? notificacaoBruta.autorNome.trim()
        : "",
    autorAvatar:
      typeof notificacaoBruta.autorAvatar === "string"
        ? notificacaoBruta.autorAvatar.trim()
        : "",
  };
}

function carregarObras(): ObraLocal[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const dados = localStorage.getItem(CHAVE_OBRAS);
    const obras = dados ? JSON.parse(dados) : [];

    if (!Array.isArray(obras)) {
      localStorage.setItem(CHAVE_OBRAS, JSON.stringify([]));
      return [];
    }

    const obrasNormalizadas = obras.map((obra, index) =>
      normalizarObra(obra, index)
    );

    localStorage.setItem(CHAVE_OBRAS, JSON.stringify(obrasNormalizadas));

    return obrasNormalizadas;
  } catch {
    localStorage.setItem(CHAVE_OBRAS, JSON.stringify([]));
    return [];
  }
}

function carregarNotificacoes(): NotificacaoLocal[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const dados = localStorage.getItem(CHAVE_NOTIFICACOES);
    const notificacoes = dados ? JSON.parse(dados) : [];

    if (!Array.isArray(notificacoes)) {
      localStorage.setItem(CHAVE_NOTIFICACOES, JSON.stringify([]));
      return [];
    }

    const notificacoesNormalizadas = notificacoes
      .map((notificacao, index) => normalizarNotificacao(notificacao, index))
      .sort((a, b) => dataNotificacao(b) - dataNotificacao(a));

    localStorage.setItem(
      CHAVE_NOTIFICACOES,
      JSON.stringify(notificacoesNormalizadas)
    );

    return notificacoesNormalizadas;
  } catch {
    localStorage.setItem(CHAVE_NOTIFICACOES, JSON.stringify([]));
    return [];
  }
}

function salvarNotificacoes(notificacoes: NotificacaoLocal[]) {
  localStorage.setItem(CHAVE_NOTIFICACOES, JSON.stringify(notificacoes));
}

function criarChaveNotificacoesApagadas(usuarioId: string) {
  return `${CHAVE_NOTIFICACOES_APAGADAS}-${usuarioId || "anon"}`;
}

function carregarIdsNotificacoesApagadas(usuarioId: string) {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const texto = localStorage.getItem(criarChaveNotificacoesApagadas(usuarioId));
    const json: unknown = texto ? JSON.parse(texto) : [];

    if (!Array.isArray(json)) {
      return new Set<string>();
    }

    return new Set(
      json.filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
    );
  } catch {
    return new Set<string>();
  }
}

function registrarNotificacoesApagadas(usuarioId: string, ids: string[]) {
  if (typeof window === "undefined" || ids.length === 0) {
    return;
  }

  const chave = criarChaveNotificacoesApagadas(usuarioId);
  const idsAtuais = carregarIdsNotificacoesApagadas(usuarioId);

  ids.forEach((id) => {
    if (id.trim()) {
      idsAtuais.add(id);
    }
  });

  localStorage.setItem(chave, JSON.stringify(Array.from(idsAtuais).slice(-500)));
}

function filtrarNotificacoesApagadas(
  notificacoesParaFiltrar: NotificacaoLocal[],
  idsApagados: Set<string>
) {
  if (idsApagados.size === 0) {
    return notificacoesParaFiltrar;
  }

  return notificacoesParaFiltrar.filter(
    (notificacao) => !idsApagados.has(notificacao.id)
  );
}

function linkDiretoValido(link: string) {
  return link.startsWith("/") || link.startsWith("http://") || link.startsWith("https://");
}

function criarPerfilHrefNotificacao(userId: string, nomeUsuario: string) {
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

function montarLinkNotificacao(
  notificacao: NotificacaoLocal,
  obra?: ObraLocal | null
) {
  if (notificacao.tipo === "novo-seguidor" && notificacao.autorId) {
    return criarPerfilHrefNotificacao(notificacao.autorId, notificacao.autorNome || "Usuário");
  }

  if (
    notificacaoEhCapitulo(notificacao) &&
    obra &&
    notificacao.obraId &&
    notificacao.capituloId
  ) {
    const indiceCapitulo = obra.capitulos.findIndex(
      (capitulo) => capitulo.id === notificacao.capituloId
    );
    const numeroCapitulo = indiceCapitulo >= 0 ? indiceCapitulo + 1 : 1;

    return criarHrefLeituraCapitulo(
      obra,
      notificacao.capituloId,
      numeroCapitulo
    );
  }

  const linkDireto = notificacao.link.trim();

  if (linkDireto && linkDiretoValido(linkDireto)) {
    return linkDireto;
  }

  if (notificacao.obraId && notificacao.capituloId) {
    return `/ler-capitulo?obraId=${encodeURIComponent(
      notificacao.obraId
    )}&capituloId=${encodeURIComponent(notificacao.capituloId)}`;
  }

  return notificacaoEhCapitulo(notificacao) ? "/biblioteca" : "/comunidade";
}

function notificacaoEhCapitulo(notificacao: NotificacaoLocal) {
  return (
    notificacao.tipo === "novo-capitulo" ||
    notificacao.tipo === "comentario-capitulo"
  );
}

function notificacaoEhComunidade(notificacao: NotificacaoLocal) {
  return !notificacaoEhCapitulo(notificacao);
}

function obterDetalheNotificacao(notificacao: NotificacaoLocal) {
  if (notificacao.tipo === "comentario-comunidade") {
    return "Comentário em publicação";
  }

  if (notificacao.tipo === "review-comunidade") {
    return "Review publicada";
  }

  if (notificacao.tipo === "novo-seguidor") {
    return "Novo seguidor";
  }

  if (notificacao.tipo === "atividade-comunidade") {
    return "Atividade da comunidade";
  }

  if (notificacao.tipo === "denuncia-comunidade") {
    return "Denúncia analisada";
  }

  if (notificacao.tipo === "moderacao-comunidade") {
    return "Moderação";
  }

  if (notificacao.tipo === "comentario-capitulo") {
    return "Comentário em capítulo";
  }

  return "Capítulo";
}

function obterAcaoPrincipalNotificacao(notificacao: NotificacaoLocal) {
  if (notificacao.tipo === "novo-seguidor") {
    return "Ver perfil";
  }

  if (notificacaoEhComunidade(notificacao)) {
    return "Ver comunidade";
  }

  return notificacao.tipo === "comentario-capitulo"
    ? "Ver comentário"
    : "Ver capítulo";
}

function obterIconeNotificacao(notificacao: NotificacaoLocal, lida: boolean) {
  if (lida) {
    return "✓";
  }

  if (notificacao.tipo === "comentario-comunidade") {
    return "💬";
  }

  if (notificacao.tipo === "comentario-capitulo") {
    return "💬";
  }

  if (notificacao.tipo === "review-comunidade") {
    return "★";
  }

  if (notificacao.tipo === "novo-seguidor") {
    return "+";
  }

  if (
    notificacao.tipo === "denuncia-comunidade" ||
    notificacao.tipo === "moderacao-comunidade"
  ) {
    return "N";
  }

  return "!";
}

function obterTituloExibicaoNotificacao(notificacao: NotificacaoLocal) {
  if (!notificacaoEhComunidade(notificacao)) {
    return notificacao.titulo;
  }

  const tituloSemNovo =
    notificacao.titulo.replace(/^Novo\s+/i, "").trim() || notificacao.titulo;

  if (notificacao.tipo === "comentario-comunidade") {
    return tituloSemNovo.replace(/\bna publicação\b/i, "da publicação");
  }

  return tituloSemNovo;
}

function extrairAutorComentarioComunidade(notificacao: NotificacaoLocal) {
  if (notificacao.autorNome?.trim()) {
    return notificacao.autorNome.trim();
  }

  if (notificacao.tipo !== "comentario-comunidade") {
    return "Comunidade";
  }

  const match = /^(.+?)\s+comentou\b/i.exec(notificacao.mensagem.trim());

  return match?.[1]?.trim() || "Leitor";
}

function extrairTextoComentarioComunidade(notificacao: NotificacaoLocal) {
  if (notificacao.tipo !== "comentario-comunidade") {
    return notificacao.mensagem;
  }

  const mensagem = notificacao.mensagem.trim();
  const marcadorComentario = '": ';
  const indiceMarcador = mensagem.indexOf(marcadorComentario);

  if (indiceMarcador >= 0) {
    const comentario = mensagem.slice(indiceMarcador + marcadorComentario.length).trim();

    return comentario || "Comentou na sua publicação.";
  }

  const indiceDoisPontos = mensagem.indexOf(": ");

  if (indiceDoisPontos >= 0) {
    const comentario = mensagem.slice(indiceDoisPontos + 2).trim();

    return comentario || "Comentou na sua publicação.";
  }

  return "Comentou na sua publicação.";
}

function obterNomeAutorNotificacao(notificacao: NotificacaoLocal) {
  return (
    notificacao.autorNome?.trim() ||
    (notificacao.tipo === "comentario-comunidade"
      ? extrairAutorComentarioComunidade(notificacao)
      : "Usuário")
  );
}

function obterInicialNotificacao(notificacao: NotificacaoLocal) {
  const nome = obterNomeAutorNotificacao(notificacao);

  return nome.slice(0, 1).toUpperCase() || obterIconeNotificacao(notificacao, notificacao.lida);
}

function criarAvatarNotificacaoStyle(
  notificacao: NotificacaoLocal,
  fallbackStyle: CSSProperties
): CSSProperties {
  const avatar = notificacao.autorAvatar?.trim() || "";

  if (!avatar) {
    return fallbackStyle;
  }

  return {
    ...fallbackStyle,
    backgroundImage: `url(${avatar})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "transparent",
    overflow: "hidden",
  };
}


type SupabaseObraRow = Record<string, unknown>;
type SupabaseCapituloRow = Record<string, unknown>;

type EstadoSupabaseNotificacoes = {
  userId: string;
  obrasSeguidasIds: string[];
  notificacoesLidasIds: string[];
  notificacoesDiretas: NotificacaoLocal[];
};

function pegarTexto(valor: unknown, fallback = "") {
  return typeof valor === "string" && valor.trim() ? valor.trim() : fallback;
}

function pegarBooleano(valor: unknown, fallback = false) {
  return typeof valor === "boolean" ? valor : fallback;
}

function obterNumeroSeguro(valor: unknown, fallback = 0) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return valor;
  }

  if (typeof valor === "string" && valor.trim()) {
    const numero = Number(valor);

    return Number.isFinite(numero) ? numero : fallback;
  }

  return fallback;
}

type PerfilNotificacao = {
  userId: string;
  nome: string;
  avatar: string;
};

function normalizarPerfilNotificacao(
  row: Record<string, unknown>,
  userIdFallback: string,
  nomeFallback: string
): PerfilNotificacao {
  const userId =
    pegarTexto(row.user_id) || pegarTexto(row.id) || userIdFallback.trim();
  const nome =
    pegarTexto(row.nome) ||
    pegarTexto(row.nome_usuario) ||
    pegarTexto(row.username) ||
    pegarTexto(row.display_name) ||
    pegarTexto(row.apelido) ||
    nomeFallback.trim() ||
    "Usuário";
  const avatar =
    pegarTexto(row.avatar_url) ||
    pegarTexto(row.avatar) ||
    pegarTexto(row.foto_url) ||
    pegarTexto(row.imagem_url) ||
    pegarTexto(row.photo_url);

  return {
    userId,
    nome: nome.slice(0, 80),
    avatar,
  };
}

async function carregarPerfisNotificacoes(userIds: string[]) {
  const ids = Array.from(
    new Set(userIds.map((id) => id.trim()).filter(Boolean))
  );
  const perfis = new Map<string, PerfilNotificacao>();

  if (ids.length === 0) {
    return perfis;
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .in("user_id", ids);

    if (!error && Array.isArray(data)) {
      data.forEach((item) => {
        const row = item as Record<string, unknown>;
        const perfil = normalizarPerfilNotificacao(row, "", "Usuário");

        if (perfil.userId) {
          perfis.set(perfil.userId, perfil);
        }
      });
    }
  } catch {
    // Se user_id não existir no schema antigo, tenta pelo id abaixo.
  }

  const idsFaltantes = ids.filter((id) => !perfis.has(id));

  if (idsFaltantes.length > 0) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", idsFaltantes);

      if (!error && Array.isArray(data)) {
        data.forEach((item) => {
          const row = item as Record<string, unknown>;
          const perfil = normalizarPerfilNotificacao(row, "", "Usuário");

          if (perfil.userId) {
            perfis.set(perfil.userId, perfil);
          }
        });
      }
    } catch {
      // Profiles é complementar; as notificações continuam com nome salvo no registro.
    }
  }

  return perfis;
}

function obterPerfilNotificacao(
  perfis: Map<string, PerfilNotificacao>,
  userId: string,
  nomeFallback: string
) {
  const userIdLimpo = userId.trim();
  const perfil = userIdLimpo ? perfis.get(userIdLimpo) : null;

  return (
    perfil || {
      userId: userIdLimpo,
      nome: nomeFallback.trim() || "Usuário",
      avatar: "",
    }
  );
}

function pegarTagsSupabase(valor: unknown): string[] {
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

function normalizarObraSupabase(row: SupabaseObraRow, index: number): ObraLocal {
  const titulo = pegarTexto(row.titulo, `Obra ${index + 1}`);
  const slug = pegarTexto(row.slug, criarSlugBase(titulo));

  return {
    id: pegarTexto(row.id, `supabase-${index + 1}`),
    titulo,
    autor: pegarTexto(row.autor ?? row.nome_autor ?? row.autor_nome, "Autor não informado"),
    autorId: pegarTexto(row.user_id ?? row.userId ?? row.autor_id ?? row.autorId, ""),
    genero: pegarTexto(row.genero, "Não informado"),
    formato: pegarTexto(row.formato, "Não informado"),
    classificacaoIndicativa: pegarTexto(
      row.classificacao_indicativa ?? row.classificacaoIndicativa,
      "Não informada"
    ),
    sinopse: pegarTexto(row.sinopse, "Nenhuma sinopse informada."),
    tags: pegarTagsSupabase(row.tags),
    capa: pegarTexto(row.capa_url ?? row.capaUrl ?? row.capa, ""),
    capaNome: pegarTexto(row.capa_nome ?? row.capaNome, ""),
    publicado: pegarBooleano(row.publicado, false),
    capitulos: [],
    criadaEm: pegarTexto(row.created_at ?? row.criada_em ?? row.criadaEm, ""),
    ultimoCapituloLidoId: "",
    ultimaLeituraEm: "",
    progressoLeitura: 0,
    slug,
    link: `/obra/${slug}`,
  };
}

function normalizarCapituloSupabase(
  row: SupabaseCapituloRow,
  index: number
): CapituloLocal & { obraId: string } {
  return {
    id: pegarTexto(row.id, `capitulo-supabase-${index + 1}`),
    titulo: pegarTexto(row.titulo, `Capítulo ${index + 1}`),
    texto: pegarTexto(row.texto ?? row.conteudo, ""),
    curtiu: false,
    salvo: false,
    comentario: "",
    criadoEm: pegarTexto(row.created_at ?? row.criado_em ?? row.criadoEm, ""),
    lido: false,
    lidoEm: "",
    obraId: pegarTexto(row.obra_id ?? row.obraId, ""),
  };
}

function mesclarObrasPorIdSlug(obrasBase: ObraLocal[], obrasNovas: ObraLocal[]) {
  const mapa = new Map<string, ObraLocal>();

  [...obrasBase, ...obrasNovas].forEach((obra) => {
    const chave = obra.id || obra.slug || criarSlugBase(obra.titulo);
    const existente = mapa.get(chave);

    if (!existente) {
      mapa.set(chave, obra);
      return;
    }

    mapa.set(chave, {
      ...existente,
      ...obra,
      autorId: obra.autorId || existente.autorId || "",
      capitulos: obra.capitulos.length > 0 ? obra.capitulos : existente.capitulos,
      capa: obra.capa || existente.capa,
      capaNome: obra.capaNome || existente.capaNome,
      ultimoCapituloLidoId: obra.ultimoCapituloLidoId || existente.ultimoCapituloLidoId,
      ultimaLeituraEm: obra.ultimaLeituraEm || existente.ultimaLeituraEm,
      progressoLeitura:
        obra.capitulos.length > 0
          ? calcularProgressoLeitura(obra.capitulos)
          : existente.progressoLeitura,
    });
  });

  return Array.from(mapa.values());
}

function mesclarNotificacoes(
  notificacoesLocais: NotificacaoLocal[],
  notificacoesSupabase: NotificacaoLocal[]
) {
  const mapa = new Map<string, NotificacaoLocal>();

  notificacoesLocais.forEach((notificacao) => {
    mapa.set(notificacao.id, notificacao);
  });

  notificacoesSupabase.forEach((notificacao) => {
    const existente = mapa.get(notificacao.id);

    mapa.set(notificacao.id, {
      ...notificacao,
      lida: existente?.lida || notificacao.lida,
    });
  });

  return Array.from(mapa.values()).sort((a, b) => dataNotificacao(b) - dataNotificacao(a));
}

function lerIdsLocalStorage(chave: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const texto = localStorage.getItem(chave);
    const json = texto ? JSON.parse(texto) : [];

    return Array.isArray(json)
      ? json.filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
      : [];
  } catch {
    return [];
  }
}

async function carregarObrasPublicadasSupabase() {
  try {
    const { data: obrasData, error: obrasError } = await supabase
      .from("obras")
      .select("*")
      .eq("publicado", true)
      .order("criada_em", { ascending: false });

    if (obrasError || !Array.isArray(obrasData)) {
      return [];
    }

    const obrasSupabase = obrasData.map((obra, index) =>
      normalizarObraSupabase(obra as SupabaseObraRow, index)
    );

    const idsObras = obrasSupabase.map((obra) => obra.id).filter(Boolean);

    if (idsObras.length === 0) {
      return obrasSupabase;
    }

    try {
      const { data: capitulosData } = await supabase
        .from("capitulos")
        .select("*")
        .in("obra_id", idsObras)
        .order("ordem", { ascending: true });

      if (!Array.isArray(capitulosData)) {
        return obrasSupabase;
      }

      const capitulosPorObra = new Map<string, CapituloLocal[]>();

      capitulosData.forEach((capitulo, index) => {
        const capituloNormalizado = normalizarCapituloSupabase(
          capitulo as SupabaseCapituloRow,
          index
        );

        if (!capituloNormalizado.obraId) {
          return;
        }

        const capitulosAtuais = capitulosPorObra.get(capituloNormalizado.obraId) || [];
        const { obraId: _obraId, ...capituloSemObraId } = capituloNormalizado;
        void _obraId;

        capitulosPorObra.set(capituloNormalizado.obraId, [
          ...capitulosAtuais,
          capituloSemObraId,
        ]);
      });

      return obrasSupabase.map((obra) => {
        const capitulos = capitulosPorObra.get(obra.id) || [];

        return {
          ...obra,
          capitulos,
          progressoLeitura: calcularProgressoLeitura(capitulos),
        };
      });
    } catch {
      return obrasSupabase;
    }
  } catch {
    return [];
  }
}

async function carregarIdsTabelaUsuario(
  tabela: string,
  colunaId: string,
  userId: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from(tabela)
      .select(colunaId)
      .eq("user_id", userId);

    if (error || !Array.isArray(data)) {
      return [];
    }

    const ids: string[] = [];

    data.forEach((item: unknown) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return;
      }

      const registro = item as Record<string, unknown>;
      const id = pegarTexto(registro[colunaId]);

      if (id) {
        ids.push(id);
      }
    });

    return ids;
  } catch {
    return [];
  }
}

function normalizarNotificacaoSupabase(
  registro: Record<string, unknown>,
  index: number
): NotificacaoLocal | null {
  const id =
    pegarTexto(registro.notificacao_id) ||
    pegarTexto(registro.id) ||
    `notificacao-supabase-${index + 1}`;

  if (!id.trim()) {
    return null;
  }

  const criadaEm =
    pegarTexto(
      registro.criado_em ??
        registro.criada_em ??
        registro.created_at ??
        registro.updated_at ??
        registro.atualizado_em
    ) || new Date().toISOString();
  const tipo = normalizarTipoNotificacao(registro.tipo);
  const titulo = pegarTexto(registro.titulo, obterDetalheNotificacao({
    id,
    obraId: "",
    capituloId: "",
    link: "",
    titulo: "Nova notificação",
    mensagem: "Você recebeu uma nova notificação.",
    tipo,
    lida: false,
    criadaEm,
  }));
  const mensagem = pegarTexto(
    registro.mensagem ?? registro.texto ?? registro.descricao,
    "Você recebeu uma nova notificação."
  );

  return normalizarNotificacao(
    {
      id,
      obraId: pegarTexto(registro.obra_id ?? registro.obraId),
      capituloId: pegarTexto(registro.capitulo_id ?? registro.capituloId),
      link: pegarTexto(registro.link ?? registro.href),
      titulo,
      mensagem,
      tipo,
      lida: registro.lida === true,
      criadaEm,
      autorId: pegarTexto(
        registro.autor_id ?? registro.autorId ?? registro.remetente_id
      ),
      autorNome: pegarTexto(
        registro.autor_nome ?? registro.autorNome ?? registro.remetente_nome
      ),
      autorAvatar: pegarTexto(
        registro.autor_avatar ?? registro.autorAvatar ?? registro.remetente_avatar
      ),
    },
    index
  );
}

async function carregarNotificacoesDiretasSupabase(
  userId: string
): Promise<NotificacaoLocal[]> {
  if (!userId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("notificacoes")
      .select("*")
      .eq("user_id", userId)
      .limit(120);

    if (error || !Array.isArray(data)) {
      return [];
    }

    return data
      .map((item, index) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          return null;
        }

        return normalizarNotificacaoSupabase(
          item as Record<string, unknown>,
          index
        );
      })
      .filter(
        (notificacao): notificacao is NotificacaoLocal => Boolean(notificacao)
      )
      .sort((a, b) => dataNotificacao(b) - dataNotificacao(a));
  } catch {
    return [];
  }
}

async function carregarNotificacoesLidasSupabase(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("notificacoes")
      .select("notificacao_id, id, lida")
      .eq("user_id", userId)
      .eq("lida", true);

    if (error || !Array.isArray(data)) {
      return [];
    }

    const ids: string[] = [];

    data.forEach((item: unknown) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return;
      }

      const registro = item as Record<string, unknown>;
      const id = pegarTexto(registro.notificacao_id ?? registro.id);

      if (id) {
        ids.push(id);
      }
    });

    return ids;
  } catch {
    return [];
  }
}

async function carregarEstadoSupabaseNotificacoes(): Promise<EstadoSupabaseNotificacoes | null> {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    if (!userId) {
      return null;
    }

    const [
      obrasSeguidasIds,
      notificacoesLidasIds,
      notificacoesDiretas,
    ] = await Promise.all([
      carregarIdsTabelaUsuario("seguindo_obras", "obra_id", userId),
      carregarNotificacoesLidasSupabase(userId),
      carregarNotificacoesDiretasSupabase(userId),
    ]);

    return {
      userId,
      obrasSeguidasIds,
      notificacoesLidasIds,
      notificacoesDiretas,
    };
  } catch {
    return null;
  }
}

function criarChavesObraParaNotificacao(obra: ObraLocal) {
  return Array.from(
    new Set(
      [
        obra.id,
        obra.slug,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ].filter((chave) => Boolean(chave.trim()))
    )
  );
}

function obraEstaNaListaSeguida(obra: ObraLocal, idsSeguidos: Set<string>) {
  if (idsSeguidos.size === 0) {
    return false;
  }

  return criarChavesObraParaNotificacao(obra).some((chave) =>
    idsSeguidos.has(chave)
  );
}

function notificacaoCapituloPertenceAObraSeguida(
  notificacao: NotificacaoLocal,
  obrasPorId: Map<string, ObraLocal>,
  idsSeguidos: Set<string>,
  usuarioAtualId: string
) {
  if (!notificacaoEhCapitulo(notificacao)) {
    return true;
  }

  if (idsSeguidos.size === 0) {
    return false;
  }

  const obra = obrasPorId.get(notificacao.obraId) || null;

  if (!obra) {
    return idsSeguidos.has(notificacao.obraId);
  }

  if (usuarioAtualId && obra.autorId && obra.autorId === usuarioAtualId) {
    return false;
  }

  return obraEstaNaListaSeguida(obra, idsSeguidos);
}

function criarNotificacoesDeCapitulos(
  obrasParaCriar: ObraLocal[],
  obrasSeguidasIds: string[],
  notificacoesLidasIds: string[],
  usuarioAtualId: string
) {
  const idsSeguidos = new Set(
    obrasSeguidasIds
      .filter((id) => Boolean(id.trim()))
      .map((id) => id.trim())
  );
  const idsLidos = new Set(notificacoesLidasIds);
  const notificacoesCriadas: NotificacaoLocal[] = [];

  obrasParaCriar.forEach((obra) => {
    if (!obraEstaNaListaSeguida(obra, idsSeguidos)) {
      return;
    }

    if (usuarioAtualId && obra.autorId && obra.autorId === usuarioAtualId) {
      return;
    }

    obra.capitulos.forEach((capitulo, index) => {
      const id = `capitulo-${obra.id}-${capitulo.id}`;

      notificacoesCriadas.push({
        id,
        obraId: obra.id,
        capituloId: capitulo.id,
        link: criarHrefLeituraCapitulo(obra, capitulo.id, index + 1),
        titulo: "Novo capítulo publicado",
        mensagem: `${capitulo.titulo} chegou em ${obra.titulo}.`,
        tipo: "novo-capitulo",
        lida: idsLidos.has(id),
        criadaEm: capitulo.criadoEm || obra.criadaEm || new Date().toISOString(),
        autorId: obra.autorId || "",
        autorNome: obra.autor,
        autorAvatar: "",
      });
    });
  });

  return notificacoesCriadas.sort((a, b) => dataNotificacao(b) - dataNotificacao(a));
}

async function carregarNotificacoesComunidadeSupabase(
  userId: string,
  notificacoesLidasIds: string[]
): Promise<NotificacaoLocal[]> {
  const idsLidos = new Set(notificacoesLidasIds);
  const notificacoesSociais: NotificacaoLocal[] = [];
  const userIdsParaProfiles = new Set<string>();
  const postsPorId = new Map<string, { texto: string; autorNome: string }>();
  const comentariosComunidade: Record<string, unknown>[] = [];
  const denunciasComunidade: Record<string, unknown>[] = [];
  const seguidoresPerfil: Record<string, unknown>[] = [];
  const comentariosCapitulos: Record<string, unknown>[] = [];
  const reviewsComunidade: Record<string, unknown>[] = [];
  const obrasAutor = new Map<
    string,
    Pick<ObraLocal, "id" | "titulo" | "slug" | "publicado">
  >();
  const capitulosAutor = new Map<
    string,
    {
      id: string;
      titulo: string;
      obraId: string;
      obraTitulo: string;
      obraSlug: string;
      obraPublicada: boolean;
      numero: number;
    }
  >();

  try {
    const { data: postsData } = await supabase
      .from("comunidade_posts")
      .select("id, texto, autor_id, autor_nome, criado_em")
      .eq("autor_id", userId);

    const posts = Array.isArray(postsData) ? postsData : [];
    const postIds = posts
      .map((post) => pegarTexto((post as Record<string, unknown>).id))
      .filter(Boolean);

    posts.forEach((post) => {
      const registro = post as Record<string, unknown>;
      const postId = pegarTexto(registro.id);

      if (!postId) {
        return;
      }

      postsPorId.set(postId, {
        texto: pegarTexto(registro.texto, "sua publicação"),
        autorNome: pegarTexto(registro.autor_nome, "Você"),
      });
    });

    if (postIds.length > 0) {
      const { data: comentariosData } = await supabase
        .from("comunidade_comentarios")
        .select("id, post_id, autor_id, autor_nome, texto, criado_em")
        .in("post_id", postIds)
        .neq("autor_id", userId)
        .order("criado_em", { ascending: false });

      if (Array.isArray(comentariosData)) {
        comentariosData.forEach((comentario) => {
          const registro = comentario as Record<string, unknown>;
          const autorId = pegarTexto(registro.autor_id);

          comentariosComunidade.push(registro);

          if (autorId) {
            userIdsParaProfiles.add(autorId);
          }
        });
      }
    }
  } catch {
    // A página continua com notificações locais e de capítulos se a Comunidade falhar.
  }

  try {
    const { data: denunciasData } = await supabase
      .from("comunidade_denuncias")
      .select(
        "id, alvo_tipo, alvo_id, status, observacao_admin, analisado_em, criado_em"
      )
      .eq("denunciante_id", userId)
      .in("status", ["em_analise", "resolvida", "rejeitada"])
      .order("criado_em", { ascending: false });

    if (Array.isArray(denunciasData)) {
      denunciasData.forEach((denuncia) => {
        denunciasComunidade.push(denuncia as Record<string, unknown>);
      });
    }
  } catch {
    // Denúncias continuam opcionais para não bloquear as notificações.
  }

  try {
    const { data: seguidoresData } = await supabase
      .from("seguindo_usuarios")
      .select("id, seguidor_id, seguido_id, criado_em")
      .eq("seguido_id", userId)
      .order("criado_em", { ascending: false })
      .limit(60);

    if (Array.isArray(seguidoresData)) {
      seguidoresData.forEach((seguidor) => {
        const registro = seguidor as Record<string, unknown>;
        const seguidorId = pegarTexto(registro.seguidor_id);

        seguidoresPerfil.push(registro);

        if (seguidorId) {
          userIdsParaProfiles.add(seguidorId);
        }
      });
    }
  } catch {
    // Seguir usuário é social; se falhar, as outras notificações continuam.
  }

  try {
    const { data: obrasAutorData } = await supabase
      .from("obras")
      .select("id, titulo, slug, publicado, user_id")
      .eq("user_id", userId);

    const obrasAutorRows = Array.isArray(obrasAutorData)
      ? (obrasAutorData as Record<string, unknown>[])
      : [];

    obrasAutorRows.forEach((obra, index) => {
      const obraId = pegarTexto(obra.id, `obra-autor-${index + 1}`);
      const titulo = pegarTexto(obra.titulo, "Obra sem título");
      const slug = pegarTexto(obra.slug, criarSlugBase(titulo));

      if (!obraId) {
        return;
      }

      obrasAutor.set(obraId, {
        id: obraId,
        titulo,
        slug,
        publicado: pegarBooleano(obra.publicado, true),
      });
    });

    const obraIds = Array.from(obrasAutor.keys());

    if (obraIds.length > 0) {
      const { data: capitulosData } = await supabase
        .from("capitulos")
        .select("id, obra_id, titulo, ordem, publicado, criado_em")
        .in("obra_id", obraIds)
        .order("ordem", { ascending: true });

      if (Array.isArray(capitulosData)) {
        capitulosData.forEach((capitulo, index) => {
          const registro = capitulo as Record<string, unknown>;
          const capituloId = pegarTexto(registro.id);
          const obraId = pegarTexto(registro.obra_id);
          const obra = obrasAutor.get(obraId);

          if (!capituloId || !obra) {
            return;
          }

          capitulosAutor.set(capituloId, {
            id: capituloId,
            titulo: pegarTexto(registro.titulo, `Capítulo ${index + 1}`),
            obraId,
            obraTitulo: obra.titulo,
            obraSlug: obra.slug,
            obraPublicada: obra.publicado,
            numero: obterNumeroSeguro(registro.ordem, index + 1),
          });
        });
      }

      const capituloIds = Array.from(capitulosAutor.keys());

      if (capituloIds.length > 0) {
        const { data: comentariosCapitulosData } = await supabase
          .from("comentarios_capitulos")
          .select("*")
          .in("capitulo_id", capituloIds)
          .neq("user_id", userId)
          .order("atualizado_em", { ascending: false });

        if (Array.isArray(comentariosCapitulosData)) {
          comentariosCapitulosData.forEach((comentario) => {
            const registro = comentario as Record<string, unknown>;
            const autorId = pegarTexto(registro.user_id);

            comentariosCapitulos.push(registro);

            if (autorId) {
              userIdsParaProfiles.add(autorId);
            }
          });
        }
      }

      const { data: reviewsData } = await supabase
        .from("comunidade_posts")
        .select("id, autor_id, autor_nome, texto, obra_relacionada, tipo_publicacao, criado_em")
        .eq("tipo_publicacao", "Review")
        .neq("autor_id", userId)
        .order("criado_em", { ascending: false })
        .limit(80);

      if (Array.isArray(reviewsData)) {
        reviewsData.forEach((review) => {
          const registro = review as Record<string, unknown>;
          const obraRelacionada = normalizarTexto(
            pegarTexto(registro.obra_relacionada)
          );
          const pertenceAoAutor = Array.from(obrasAutor.values()).some((obra) => {
            const tituloNormalizado = normalizarTexto(obra.titulo);

            return (
              obraRelacionada &&
              tituloNormalizado &&
              (obraRelacionada === tituloNormalizado ||
                obraRelacionada.includes(tituloNormalizado) ||
                tituloNormalizado.includes(obraRelacionada))
            );
          });

          if (!pertenceAoAutor) {
            return;
          }

          const autorId = pegarTexto(registro.autor_id);
          reviewsComunidade.push(registro);

          if (autorId) {
            userIdsParaProfiles.add(autorId);
          }
        });
      }
    }
  } catch {
    // Comentários de capítulo/reviews são extras; não bloqueiam a página.
  }

  const perfis = await carregarPerfisNotificacoes(Array.from(userIdsParaProfiles));

  comentariosComunidade.forEach((registro) => {
    const comentarioId = pegarTexto(registro.id);
    const postId = pegarTexto(registro.post_id);

    if (!comentarioId || !postId) {
      return;
    }

    const autorId = pegarTexto(registro.autor_id);
    const perfilAutor = obterPerfilNotificacao(
      perfis,
      autorId,
      pegarTexto(registro.autor_nome, "Alguém")
    );
    const id = `comunidade-comentario-${comentarioId}`;
    const textoComentario = pegarTexto(registro.texto);
    const post = postsPorId.get(postId);
    const trechoPost = post?.texto
      ? post.texto.slice(0, 90)
      : "uma publicação sua";

    notificacoesSociais.push({
      id,
      obraId: "",
      capituloId: "",
      link: `/comunidade?post=${encodeURIComponent(postId)}`,
      titulo: "Novo comentário na Comunidade",
      mensagem: `${perfilAutor.nome} comentou em "${trechoPost}${
        trechoPost.length >= 90 ? "..." : ""
      }"${textoComentario ? `: ${textoComentario.slice(0, 90)}` : "."}`,
      tipo: "comentario-comunidade",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(registro.criado_em, new Date().toISOString()),
      autorId,
      autorNome: perfilAutor.nome,
      autorAvatar: perfilAutor.avatar,
    });
  });

  seguidoresPerfil.forEach((registro) => {
    const seguidorId = pegarTexto(registro.seguidor_id);

    if (!seguidorId) {
      return;
    }

    const perfilSeguidor = obterPerfilNotificacao(perfis, seguidorId, "Usuário");
    const id = `novo-seguidor-${pegarTexto(registro.id, seguidorId)}`;

    notificacoesSociais.push({
      id,
      obraId: "",
      capituloId: "",
      link: criarPerfilHrefNotificacao(seguidorId, perfilSeguidor.nome),
      titulo: "Novo seguidor",
      mensagem: `${perfilSeguidor.nome} começou a seguir seu perfil.`,
      tipo: "novo-seguidor",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(registro.criado_em, new Date().toISOString()),
      autorId: seguidorId,
      autorNome: perfilSeguidor.nome,
      autorAvatar: perfilSeguidor.avatar,
    });
  });

  comentariosCapitulos.forEach((registro) => {
    const capituloId = pegarTexto(registro.capitulo_id);
    const capitulo = capitulosAutor.get(capituloId);

    if (!capitulo) {
      return;
    }

    const autorId = pegarTexto(registro.user_id);
    const perfilAutor = obterPerfilNotificacao(perfis, autorId, "Leitor");
    const comentarioId =
      pegarTexto(registro.id) ||
      `${capituloId}-${autorId}-${pegarTexto(registro.atualizado_em ?? registro.criado_em)}`;
    const id = `capitulo-comentario-${comentarioId}`;
    const textoComentario = pegarTexto(registro.comentario ?? registro.texto);

    notificacoesSociais.push({
      id,
      obraId: capitulo.obraId,
      capituloId,
      link: criarHrefLeituraCapitulo(
        {
          id: capitulo.obraId,
          slug: capitulo.obraSlug,
          titulo: capitulo.obraTitulo,
          publicado: capitulo.obraPublicada,
        },
        capituloId,
        capitulo.numero
      ),
      titulo: "Novo comentário no capítulo",
      mensagem: `${perfilAutor.nome} comentou em ${capitulo.titulo}${
        textoComentario ? `: ${textoComentario.slice(0, 90)}` : "."
      }`,
      tipo: "comentario-capitulo",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(
        registro.criado_em ?? registro.atualizado_em,
        new Date().toISOString()
      ),
      autorId,
      autorNome: perfilAutor.nome,
      autorAvatar: perfilAutor.avatar,
    });
  });

  reviewsComunidade.forEach((registro) => {
    const postId = pegarTexto(registro.id);

    if (!postId) {
      return;
    }

    const autorId = pegarTexto(registro.autor_id);
    const perfilAutor = obterPerfilNotificacao(
      perfis,
      autorId,
      pegarTexto(registro.autor_nome, "Leitor")
    );
    const obraRelacionada = pegarTexto(registro.obra_relacionada, "sua obra");
    const textoReview = pegarTexto(registro.texto);
    const id = `comunidade-review-${postId}`;

    notificacoesSociais.push({
      id,
      obraId: "",
      capituloId: "",
      link: `/comunidade?post=${encodeURIComponent(postId)}`,
      titulo: "Nova review publicada",
      mensagem: `${perfilAutor.nome} publicou uma review sobre ${obraRelacionada}${
        textoReview ? `: ${textoReview.slice(0, 90)}` : "."
      }`,
      tipo: "review-comunidade",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(registro.criado_em, new Date().toISOString()),
      autorId,
      autorNome: perfilAutor.nome,
      autorAvatar: perfilAutor.avatar,
    });
  });

  denunciasComunidade.forEach((registro) => {
    const denunciaId = pegarTexto(registro.id);
    const status = pegarTexto(registro.status, "em_analise");

    if (!denunciaId) {
      return;
    }

    const id = `comunidade-denuncia-${denunciaId}-${status}`;
    const statusTexto =
      status === "resolvida"
        ? "resolvida"
        : status === "rejeitada"
          ? "rejeitada"
          : "em análise";
    const alvoTipo = pegarTexto(registro.alvo_tipo, "conteúdo");
    const alvoId = pegarTexto(registro.alvo_id);
    const observacaoAdmin = pegarTexto(registro.observacao_admin);
    const link =
      alvoTipo === "post" && alvoId
        ? `/comunidade?post=${encodeURIComponent(alvoId)}`
        : "/comunidade";

    notificacoesSociais.push({
      id,
      obraId: "",
      capituloId: "",
      link,
      titulo: `Denúncia ${statusTexto}`,
      mensagem: observacaoAdmin
        ? `A moderação atualizou sua denúncia: ${observacaoAdmin}`
        : `A moderação marcou sua denúncia como ${statusTexto}.`,
      tipo: "denuncia-comunidade",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(
        registro.analisado_em ?? registro.criado_em,
        new Date().toISOString()
      ),
      autorId: "",
      autorNome: "Moderação",
      autorAvatar: "",
    });
  });

  return notificacoesSociais.sort(
    (a, b) => dataNotificacao(b) - dataNotificacao(a)
  );
}


async function sincronizarNotificacaoLidaSupabase(
  notificacao: NotificacaoLocal,
  lida: boolean
) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    if (!userId || !notificacao.id) {
      return;
    }

    const payloadCompleto = {
      user_id: userId,
      notificacao_id: notificacao.id,
      obra_id: notificacao.obraId || null,
      capitulo_id: notificacao.capituloId || null,
      titulo: notificacao.titulo,
      mensagem: notificacao.mensagem,
      link: montarLinkNotificacao(notificacao),
      tipo: notificacao.tipo,
      lida,
      created_at: notificacao.criadaEm,
      updated_at: new Date().toISOString(),
    };

    const { error: erroUpsert } = await supabase
      .from("notificacoes")
      .upsert(payloadCompleto, { onConflict: "user_id,notificacao_id" });

    if (!erroUpsert) {
      return;
    }

    await supabase
      .from("notificacoes")
      .delete()
      .eq("user_id", userId)
      .eq("notificacao_id", notificacao.id);

    const { error: erroInsertCompleto } = await supabase
      .from("notificacoes")
      .insert(payloadCompleto);

    if (!erroInsertCompleto) {
      return;
    }

    await supabase.from("notificacoes").insert({
      user_id: userId,
      notificacao_id: notificacao.id,
      titulo: notificacao.titulo,
      mensagem: notificacao.mensagem,
      link: montarLinkNotificacao(notificacao),
      tipo: notificacao.tipo,
      lida,
    });
  } catch {
    // Se a tabela não existir ou a permissão falhar, o localStorage mantém funcionando.
  }
}

async function apagarNotificacaoSupabase(notificacao: NotificacaoLocal) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    if (!userId || !notificacao.id) {
      return;
    }

    await supabase
      .from("notificacoes")
      .delete()
      .eq("user_id", userId)
      .eq("notificacao_id", notificacao.id);
  } catch {
    // A remoção local continua funcionando se o Supabase falhar.
  }
}

export default function NotificacoesPage() {
  const router = useRouter();
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [notificacoes, setNotificacoes] = useState<NotificacaoLocal[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroNotificacao>("todas");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoNotificacao>("recentes");
  const [isDesktop, setIsDesktop] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [usuarioNotificacoesId, setUsuarioNotificacoesId] = useState("anon");
  const [menuNotificacaoAbertoId, setMenuNotificacaoAbertoId] = useState("");
  const [menuAcoesGeraisAberto, setMenuAcoesGeraisAberto] = useState(false);
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
    let componenteAtivo = true;

    async function carregarDados() {
      let manterCarregando = false;

      try {
        const { data: dadosUsuario, error: erroUsuario } =
          await supabase.auth.getUser();

        if (!componenteAtivo) {
          return;
        }

        if (erroUsuario || !dadosUsuario.user) {
          manterCarregando = true;
          router.replace(criarLoginHrefNotificacoes());
          return;
        }

        const usuarioAtualId = dadosUsuario.user.id;
        const obrasLocais = carregarObras();
        const notificacoesLocais = carregarNotificacoes();
        const obrasSupabase = await carregarObrasPublicadasSupabase();
        const estadoSupabase = await carregarEstadoSupabaseNotificacoes();
        const idsNotificacoesApagadas =
          carregarIdsNotificacoesApagadas(usuarioAtualId);
        const obrasMescladas = mesclarObrasPorIdSlug(obrasLocais, obrasSupabase);
        const obrasSeguidasLocais = lerIdsLocalStorage(CHAVE_OBRAS_SEGUIDAS);
        const obrasSeguidasIds = Array.from(
          new Set([
            ...obrasSeguidasLocais,
            ...(estadoSupabase?.obrasSeguidasIds || []),
          ])
        );
        const idsSeguidos = new Set(
          obrasSeguidasIds
            .map((id) => id.trim())
            .filter((id) => Boolean(id))
        );
        const obrasPorIdMescladas = new Map(
          obrasMescladas.map((obra) => [obra.id, obra])
        );
        const notificacoesLocaisFiltradas = notificacoesLocais
          .filter((notificacao) => !notificacaoEhComunidade(notificacao))
          .filter((notificacao) =>
            notificacaoCapituloPertenceAObraSeguida(
              notificacao,
              obrasPorIdMescladas,
              idsSeguidos,
              usuarioAtualId
            )
          );
        const notificacoesLidasIds = estadoSupabase?.notificacoesLidasIds || [];
        const notificacoesDiretasSupabase = estadoSupabase?.notificacoesDiretas || [];
        const notificacoesCapitulosSupabase = criarNotificacoesDeCapitulos(
          obrasMescladas,
          obrasSeguidasIds,
          notificacoesLidasIds,
          usuarioAtualId
        );
        const notificacoesComunidadeSupabase =
          await carregarNotificacoesComunidadeSupabase(
            usuarioAtualId,
            notificacoesLidasIds
          );
        const notificacoesMescladas = filtrarNotificacoesApagadas(
          mesclarNotificacoes(notificacoesLocaisFiltradas, [
            ...notificacoesDiretasSupabase,
            ...notificacoesCapitulosSupabase,
            ...notificacoesComunidadeSupabase,
          ]),
          idsNotificacoesApagadas
        );

        try {
          localStorage.setItem(CHAVE_OBRAS, JSON.stringify(obrasMescladas));
          salvarNotificacoes(notificacoesMescladas);
        } catch {
          // Se o navegador bloquear localStorage, a página continua com o estado em memória.
        }

        if (!componenteAtivo) {
          return;
        }

        setUsuarioNotificacoesId(usuarioAtualId);
        setObras(obrasMescladas);
        setNotificacoes(notificacoesMescladas);
      } catch {
        if (componenteAtivo) {
          manterCarregando = true;
          router.replace(criarLoginHrefNotificacoes());
        }
      } finally {
        if (componenteAtivo && !manterCarregando) {
          setCarregando(false);
        }
      }
    }

    void carregarDados();

    return () => {
      componenteAtivo = false;
    };
  }, [router]);

  useEffect(() => {
    setMenuNotificacaoAbertoId("");
    setMenuAcoesGeraisAberto(false);
  }, [busca, filtro, ordenacao]);

  const obrasPorId = useMemo(() => {
    return new Map(obras.map((obra) => [obra.id, obra]));
  }, [obras]);

  const totalNotificacoes = notificacoes.length;

  const totalNaoLidas = useMemo(() => {
    return notificacoes.filter((notificacao) => !notificacao.lida).length;
  }, [notificacoes]);

  const totalLidas = Math.max(totalNotificacoes - totalNaoLidas, 0);
  const totalCapitulos = notificacoes.filter((notificacao) =>
    notificacaoEhCapitulo(notificacao)
  ).length;
  const totalComunidade = notificacoes.filter((notificacao) =>
    notificacaoEhComunidade(notificacao)
  ).length;
  const ultimaNotificacao = notificacoes[0]
    ? formatarData(notificacoes[0].criadaEm)
    : "Sem registros";
  const termoBusca = normalizarTexto(busca);

  const notificacoesFiltradas = useMemo(() => {
    const filtradas = notificacoes.filter((notificacao) => {
      const obra = obrasPorId.get(notificacao.obraId) || null;
      const capitulo =
        obra?.capitulos.find((item) => item.id === notificacao.capituloId) ||
        null;

      const passaFiltro =
        filtro === "todas" ||
        (filtro === "nao-lidas" && !notificacao.lida) ||
        (filtro === "lidas" && notificacao.lida) ||
        (filtro === "capitulos" && notificacaoEhCapitulo(notificacao)) ||
        (filtro === "comunidade" && notificacaoEhComunidade(notificacao));

      const textoBusca = normalizarTexto(
        [
          notificacao.titulo,
          notificacao.mensagem,
          notificacao.tipo,
          notificacao.link,
          notificacao.autorNome || "",
          obra?.titulo || "",
          obra?.autor || "",
          obra?.genero || "",
          obra?.formato || "",
          obra?.classificacaoIndicativa || "",
          capitulo?.titulo || "",
          formatarData(notificacao.criadaEm),
        ].join(" ")
      );

      const passaBusca = termoBusca ? textoBusca.includes(termoBusca) : true;

      return passaFiltro && passaBusca;
    });

    return [...filtradas].sort((notificacaoA, notificacaoB) => {
      const obraA = obrasPorId.get(notificacaoA.obraId) || null;
      const obraB = obrasPorId.get(notificacaoB.obraId) || null;
      const capituloA =
        obraA?.capitulos.find(
          (capitulo) => capitulo.id === notificacaoA.capituloId
        ) || null;
      const capituloB =
        obraB?.capitulos.find(
          (capitulo) => capitulo.id === notificacaoB.capituloId
        ) || null;

      if (ordenacao === "antigas") {
        return dataNotificacao(notificacaoA) - dataNotificacao(notificacaoB);
      }

      if (ordenacao === "obra") {
        return (obraA?.titulo || "zzz").localeCompare(obraB?.titulo || "zzz");
      }

      if (ordenacao === "capitulo") {
        return (capituloA?.titulo || "zzz").localeCompare(
          capituloB?.titulo || "zzz"
        );
      }

      return dataNotificacao(notificacaoB) - dataNotificacao(notificacaoA);
    });
  }, [notificacoes, obrasPorId, termoBusca, filtro, ordenacao]);

  const filtrosAtivos = Boolean(
    busca.trim() || filtro !== "todas" || ordenacao !== "recentes"
  );

  function encontrarObra(obraId: string) {
    return obrasPorId.get(obraId) || null;
  }

  function encontrarCapitulo(obraId: string, capituloId: string) {
    const obra = encontrarObra(obraId);

    if (!obra) {
      return null;
    }

    return obra.capitulos.find((capitulo) => capitulo.id === capituloId) || null;
  }

  function atualizarNotificacoes(novasNotificacoes: NotificacaoLocal[]) {
    setNotificacoes(novasNotificacoes);
    salvarNotificacoes(novasNotificacoes);
  }

  function marcarComoLida(id: string) {
    const notificacaoAtual = notificacoes.find((notificacao) => notificacao.id === id);
    const novasNotificacoes = notificacoes.map((notificacao) => {
      if (notificacao.id !== id) {
        return notificacao;
      }

      return {
        ...notificacao,
        lida: true,
      };
    });

    atualizarNotificacoes(novasNotificacoes);

    if (notificacaoAtual) {
      void sincronizarNotificacaoLidaSupabase(notificacaoAtual, true);
    }
  }

  function marcarComoNaoLida(id: string) {
    const notificacaoAtual = notificacoes.find((notificacao) => notificacao.id === id);
    const novasNotificacoes = notificacoes.map((notificacao) => {
      if (notificacao.id !== id) {
        return notificacao;
      }

      return {
        ...notificacao,
        lida: false,
      };
    });

    atualizarNotificacoes(novasNotificacoes);

    if (notificacaoAtual) {
      void sincronizarNotificacaoLidaSupabase(notificacaoAtual, false);
    }
  }

  function abrirNotificacao(id: string) {
    marcarComoLida(id);
  }

  function marcarTodasComoLidas() {
    const notificacoesParaSincronizar = notificacoes.filter(
      (notificacao) => !notificacao.lida
    );
    const novasNotificacoes = notificacoes.map((notificacao) => ({
      ...notificacao,
      lida: true,
    }));

    atualizarNotificacoes(novasNotificacoes);
    notificacoesParaSincronizar.forEach((notificacao) => {
      void sincronizarNotificacaoLidaSupabase(notificacao, true);
    });
  }

  function marcarFiltradasComoLidas() {
    const idsFiltrados = new Set(
      notificacoesFiltradas.map((notificacao) => notificacao.id)
    );
    const notificacoesParaSincronizar = notificacoes.filter((notificacao) => {
      return idsFiltrados.has(notificacao.id) && !notificacao.lida;
    });

    const novasNotificacoes = notificacoes.map((notificacao) => {
      if (!idsFiltrados.has(notificacao.id)) {
        return notificacao;
      }

      return {
        ...notificacao,
        lida: true,
      };
    });

    atualizarNotificacoes(novasNotificacoes);
    notificacoesParaSincronizar.forEach((notificacao) => {
      void sincronizarNotificacaoLidaSupabase(notificacao, true);
    });
  }

  function apagarNotificacao(id: string) {
    const notificacaoAtual = notificacoes.find((notificacao) => notificacao.id === id);
    const novasNotificacoes = notificacoes.filter((notificacao) => {
      return notificacao.id !== id;
    });

    if (notificacaoAtual) {
      registrarNotificacoesApagadas(usuarioNotificacoesId, [notificacaoAtual.id]);
    }

    atualizarNotificacoes(novasNotificacoes);

    if (notificacaoAtual) {
      void apagarNotificacaoSupabase(notificacaoAtual);
    }
  }

  function limparTodas() {
    const notificacoesParaApagar = [...notificacoes];

    registrarNotificacoesApagadas(
      usuarioNotificacoesId,
      notificacoesParaApagar.map((notificacao) => notificacao.id)
    );
    atualizarNotificacoes([]);
    notificacoesParaApagar.forEach((notificacao) => {
      void apagarNotificacaoSupabase(notificacao);
    });
  }

  function limparLidas() {
    const notificacoesLidas = notificacoes.filter((notificacao) => notificacao.lida);
    const novasNotificacoes = notificacoes.filter(
      (notificacao) => !notificacao.lida
    );

    registrarNotificacoesApagadas(
      usuarioNotificacoesId,
      notificacoesLidas.map((notificacao) => notificacao.id)
    );
    atualizarNotificacoes(novasNotificacoes);
    notificacoesLidas.forEach((notificacao) => {
      void apagarNotificacaoSupabase(notificacao);
    });
  }

  function alternarMenuNotificacao(id: string) {
    setMenuAcoesGeraisAberto(false);
    setMenuNotificacaoAbertoId((idAtual) => (idAtual === id ? "" : id));
  }

  function fecharMenuNotificacao() {
    setMenuNotificacaoAbertoId("");
  }

  function alternarMenuAcoesGerais() {
    setMenuNotificacaoAbertoId("");
    setMenuAcoesGeraisAberto((abertoAtual) => !abertoAtual);
  }

  function fecharMenuAcoesGerais() {
    setMenuAcoesGeraisAberto(false);
  }

  function limparFiltros() {
    setBusca("");
    setFiltro("todas");
    setOrdenacao("recentes");
  }

  if (carregando) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${notificacoesPageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <section style={isDesktop ? desktopEmptyStyle : emptyStyle}>
            <span style={emptyIconStyle}>N</span>

            <h2 style={emptyTitleStyle}>Verificando acesso...</h2>

            <p style={emptyTextStyle}>
              Aguarde enquanto confirmamos sua sessão.
            </p>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${notificacoesPageCss}`}</style>

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
              NOTIFICAÇÕES
            </span>
          </Link>
        </header>

        {totalNotificacoes > 0 && (
          <>
            <section style={isDesktop ? desktopFilterBoxStyle : filterBoxStyle}>
              <div style={isDesktop ? desktopFilterHeaderStyle : filterHeaderStyle}>
                <span style={filterResultBadgeStyle}>
                  {notificacoesFiltradas.length} de {totalNotificacoes}
                </span>

                <div style={isDesktop ? desktopFilterHeaderTitleBoxStyle : filterHeaderTitleBoxStyle}>
                  <span style={miniTitleStyle}>ORGANIZAR</span>
                </div>

                <div style={filterActionsMenuWrapperStyle}>
                  <button
                    type="button"
                    aria-label="Abrir ações gerais das notificações"
                    aria-expanded={menuAcoesGeraisAberto}
                    onClick={alternarMenuAcoesGerais}
                    style={filterActionsMenuButtonStyle}
                  >
                    ⋮
                  </button>

                  {menuAcoesGeraisAberto && (
                    <div style={filterActionsMenuDropdownStyle}>
                      <button
                        type="button"
                        onClick={() => {
                          marcarTodasComoLidas();
                          fecharMenuAcoesGerais();
                        }}
                        style={
                          notificacoes.length === 0
                            ? filterActionsMenuItemDisabledStyle
                            : cardMenuItemStyle
                        }
                        disabled={notificacoes.length === 0}
                      >
                        Marcar todas como lidas
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          marcarFiltradasComoLidas();
                          fecharMenuAcoesGerais();
                        }}
                        style={
                          notificacoesFiltradas.length === 0
                            ? filterActionsMenuItemDisabledStyle
                            : cardMenuItemStyle
                        }
                        disabled={notificacoesFiltradas.length === 0}
                      >
                        Marcar seleção
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          limparLidas();
                          fecharMenuAcoesGerais();
                        }}
                        style={
                          totalLidas === 0
                            ? filterActionsMenuItemDisabledStyle
                            : cardMenuItemStyle
                        }
                        disabled={totalLidas === 0}
                      >
                        Apagar lidas
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          limparTodas();
                          fecharMenuAcoesGerais();
                        }}
                        style={
                          notificacoes.length === 0
                            ? filterActionsMenuDangerItemDisabledStyle
                            : cardMenuDangerItemStyle
                        }
                        disabled={notificacoes.length === 0}
                      >
                        Limpar todos
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por obra, capítulo, comunidade ou mensagem..."
                style={isDesktop ? desktopSearchInputStyle : searchInputStyle}
                type="text"
              />

              <div style={isDesktop ? desktopQuickFiltersStyle : quickFiltersStyle}>
                <button
                  type="button"
                  onClick={() => setFiltro("todas")}
                  style={
                    filtro === "todas"
                      ? quickFilterActiveStyle
                      : quickFilterStyle
                  }
                >
                  Todas
                </button>

                <button
                  type="button"
                  onClick={() => setFiltro("nao-lidas")}
                  style={
                    filtro === "nao-lidas"
                      ? quickFilterActiveStyle
                      : quickFilterStyle
                  }
                >
                  Novas
                </button>

                <button
                  type="button"
                  onClick={() => setFiltro("lidas")}
                  style={
                    filtro === "lidas"
                      ? quickFilterActiveStyle
                      : quickFilterStyle
                  }
                >
                  Lidas
                </button>

                <button
                  type="button"
                  onClick={() => setFiltro("capitulos")}
                  style={
                    filtro === "capitulos"
                      ? quickFilterActiveStyle
                      : quickFilterStyle
                  }
                >
                  Capítulos
                </button>

                <button
                  type="button"
                  onClick={() => setFiltro("comunidade")}
                  style={
                    filtro === "comunidade"
                      ? communityQuickFilterActiveStyle
                      : quickFilterStyle
                  }
                >
                  Comunidade
                </button>
              </div>

              <div style={isDesktop ? desktopFilterFooterStyle : filterFooterStyle}>
                <select
                  value={ordenacao}
                  onChange={(event) =>
                    setOrdenacao(event.target.value as OrdenacaoNotificacao)
                  }
                  style={selectStyle}
                >
                  <option value="recentes">Mais recentes</option>
                  <option value="antigas">Mais antigas</option>
                  <option value="obra">Nome da obra</option>
                  <option value="capitulo">Nome do capítulo</option>
                </select>

                {filtrosAtivos && (
                  <button
                    type="button"
                    onClick={limparFiltros}
                    style={secondaryButtonStyle}
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            </section>

        <section
              className="notificacoes-stats-carousel"
              style={isDesktop ? desktopStatsGridStyle : statsGridStyle}
              aria-label="Resumo das notificações"
            >
          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totalNotificacoes}</strong>
            <span style={statLabelStyle}>Total</span>
          </div>

          <div style={unreadStatCardStyle}>
            <strong style={statNumberStyle}>{totalNaoLidas}</strong>
            <span style={statLabelStyle}>Novas</span>
          </div>

          <div style={readStatCardStyle}>
            <strong style={statNumberStyle}>{totalLidas}</strong>
            <span style={statLabelStyle}>Lidas</span>
          </div>

          <div style={chapterStatCardStyle}>
            <strong style={statNumberStyle}>{totalCapitulos}</strong>
            <span style={statLabelStyle}>Capítulos</span>
          </div>

          <div style={communityStatCardStyle}>
            <strong style={statNumberStyle}>{totalComunidade}</strong>
            <span style={statLabelStyle}>Comunidade</span>
          </div>

          <div style={statCardStyle}>
            <strong style={smallStatTextStyle}>{ultimaNotificacao}</strong>
            <span style={statLabelStyle}>Última</span>
          </div>
        </section>

          </>
        )}

        {notificacoes.length === 0 ? (
          <section style={isDesktop ? desktopEmptyStyle : emptyStyle}>
            <span style={emptyIconStyle}>N</span>

            <h2 style={emptyTitleStyle}>Nenhuma notificação</h2>

            <p style={emptyTextStyle}>
              Quando uma obra seguida receber capítulo novo ou a Comunidade tiver novidades para você, o aviso aparece aqui.
            </p>

            <Link href="/seguindo" style={emptyButtonStyle}>
              Ver obras seguidas
            </Link>
          </section>
        ) : notificacoesFiltradas.length === 0 ? (
          <section style={isDesktop ? desktopEmptyStyle : emptyStyle}>
            <span style={emptyIconStyle}>N</span>

            <h2 style={emptyTitleStyle}>Nada encontrado</h2>

            <p style={emptyTextStyle}>
              Limpe a busca ou escolha outro filtro para ver suas notificações.
            </p>

            <button type="button" onClick={limparFiltros} style={emptyButtonStyle}>
              Limpar filtros
            </button>
          </section>
        ) : (
          <section style={isDesktop ? desktopListStyle : listStyle} aria-label="Lista de notificações">
            {notificacoesFiltradas.map((notificacao) => {
              const obra = encontrarObra(notificacao.obraId);
              const capitulo = encontrarCapitulo(
                notificacao.obraId,
                notificacao.capituloId
              );

              const ehComunidade = notificacaoEhComunidade(notificacao);
              const tituloObra = obra?.titulo || "Obra não encontrada";
              const tituloCapitulo = capitulo?.titulo || "Capítulo não encontrado";
              const tituloExibicao = obterTituloExibicaoNotificacao(notificacao);
              const autorComentarioComunidade =
                extrairAutorComentarioComunidade(notificacao);
              const textoComentarioComunidade =
                extrairTextoComentarioComunidade(notificacao);
              const autorNotificacaoNome = obterNomeAutorNotificacao(notificacao);
              const autorNotificacaoHref = criarPerfilHrefNotificacao(
                notificacao.autorId || "",
                autorNotificacaoNome
              );

              const linkCapitulo = montarLinkNotificacao(notificacao, obra);
              const labelAcaoPrincipal = obterAcaoPrincipalNotificacao(notificacao);
              const menuEstaAberto = menuNotificacaoAbertoId === notificacao.id;

              const cardVisualStyle = notificacao.lida
                ? ehComunidade
                  ? isDesktop
                    ? desktopReadCommunityCardStyle
                    : readCommunityCardStyle
                  : isDesktop
                    ? desktopReadCardStyle
                    : readCardStyle
                : ehComunidade
                  ? isDesktop
                    ? desktopCommunityCardStyle
                    : communityCardStyle
                  : isDesktop
                    ? desktopCardStyle
                    : cardStyle;

              const iconVisualStyle = notificacao.lida
                ? readNotificationIconStyle
                : ehComunidade
                  ? communityNotificationIconStyle
                  : unreadNotificationIconStyle;
              const avatarVisualStyle = criarAvatarNotificacaoStyle(
                notificacao,
                iconVisualStyle
              );

              return (
                <article key={notificacao.id} style={cardVisualStyle}>
                  <div style={cardHeaderStyle}>
                    {notificacao.autorId ? (
                      <Link
                        href={autorNotificacaoHref}
                        aria-label={`Abrir perfil de ${autorNotificacaoNome}`}
                        style={avatarVisualStyle}
                      >
                        {notificacao.autorAvatar?.trim()
                          ? ""
                          : obterInicialNotificacao(notificacao)}
                      </Link>
                    ) : (
                      <div style={iconVisualStyle} aria-hidden="true">
                        {obterIconeNotificacao(notificacao, notificacao.lida)}
                      </div>
                    )}

                    <div style={cardHeaderTextStyle}>
                      <div style={notificationTitleRowStyle}>
                        <h2 style={notificationTitleStyle}>
                          {tituloExibicao}
                        </h2>

                        <div style={cardMenuWrapperStyle}>
                          <button
                            type="button"
                            aria-label={`Abrir ações de ${tituloExibicao}`}
                            aria-expanded={menuEstaAberto}
                            onClick={() => alternarMenuNotificacao(notificacao.id)}
                            style={cardMenuButtonStyle}
                          >
                            ⋮
                          </button>

                          {menuEstaAberto && (
                            <div style={cardMenuDropdownStyle}>
                              <Link
                                href={linkCapitulo}
                                style={cardMenuItemStyle}
                                onClick={() => {
                                  abrirNotificacao(notificacao.id);
                                  fecharMenuNotificacao();
                                }}
                              >
                                {labelAcaoPrincipal}
                              </Link>

                              {notificacao.autorId && (
                                <Link
                                  href={autorNotificacaoHref}
                                  style={cardMenuItemStyle}
                                  onClick={fecharMenuNotificacao}
                                >
                                  Abrir perfil
                                </Link>
                              )}

                              {notificacao.lida ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    marcarComoNaoLida(notificacao.id);
                                    fecharMenuNotificacao();
                                  }}
                                  style={cardMenuItemStyle}
                                >
                                  Marcar como nova
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    marcarComoLida(notificacao.id);
                                    fecharMenuNotificacao();
                                  }}
                                  style={cardMenuItemStyle}
                                >
                                  Marcar como lida
                                </button>
                              )}

                              {obra && !ehComunidade && (
                                <Link
                                  href={`/obra/${obra.slug || criarSlugBase(obra.titulo)}`}
                                  style={cardMenuItemStyle}
                                  onClick={fecharMenuNotificacao}
                                >
                                  Abrir obra
                                </Link>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  apagarNotificacao(notificacao.id);
                                  fecharMenuNotificacao();
                                }}
                                style={cardMenuDangerItemStyle}
                              >
                                Apagar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <span style={communityDateTextStyle}>
                        DATA: {formatarData(notificacao.criadaEm)}
                      </span>

                      {!ehComunidade && (
                        <p style={notificationMessageStyle}>
                          {notificacao.mensagem}
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    style={
                      ehComunidade
                        ? isDesktop
                          ? desktopCommunityMetaGridStyle
                          : communityMetaGridStyle
                        : isDesktop
                          ? desktopMetaGridStyle
                          : metaGridStyle
                    }
                  >
                    {ehComunidade ? (
                      <div style={communityCommentBoxStyle}>
                        {notificacao.tipo === "comentario-comunidade" ? (
                          notificacao.autorId ? (
                            <Link
                              href={autorNotificacaoHref}
                              style={notificationAuthorInlineLinkStyle}
                            >
                              Comentário de {autorComentarioComunidade}
                            </Link>
                          ) : (
                            <span style={metaLabelStyle}>
                              Comentário de {autorComentarioComunidade}
                            </span>
                          )
                        ) : (
                          <span style={communityInlineStatusStyle}>
                            <span>Atualização</span>
                            <span style={communityInlineStatusDotStyle}>•</span>
                            <span>{obterDetalheNotificacao(notificacao)}</span>
                          </span>
                        )}

                        <p style={communityCommentTextStyle}>
                          {notificacao.tipo === "comentario-comunidade"
                            ? textoComentarioComunidade
                            : notificacao.mensagem}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div style={metaBoxStyle}>
                          <span style={metaLabelStyle}>Obra</span>
                          <strong style={metaValueStyle}>{tituloObra}</strong>
                        </div>

                        <div style={metaBoxStyle}>
                          <span style={metaLabelStyle}>Capítulo</span>
                          <strong style={metaValueStyle}>{tituloCapitulo}</strong>
                        </div>
                      </>
                    )}
                  </div>

                </article>
              );
            })}
          </section>
        )}
      </section>
    </main>
  );
}

const notificacoesPageCss = `
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

  html[data-historietas-tema-visual] nav a[href="/notificacoes"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/notificacoes"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/notificacoes"] {
    background: var(--historietas-bottom-nav-active-bg, rgba(59, 7, 100, 0.54)) !important;
    border-color: var(--historietas-bottom-nav-active-border, rgba(109, 40, 217, 0.48)) !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] nav a[href="/notificacoes"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/notificacoes"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/notificacoes"] .historietas-bottom-nav-icon {
    color: #FFFFFF !important;
    background: var(--historietas-bottom-nav-active-icon-bg, #3B0764) !important;
    border-color: var(--historietas-bottom-nav-active-icon-border, rgba(167, 139, 250, 0.46)) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) {
    background: transparent !important;
    border-color: transparent !important;
    color: var(--historietas-bottom-nav-text, #9980D8) !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual] input::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  html[data-historietas-tema-visual] input,
  html[data-historietas-tema-visual] textarea,
  html[data-historietas-tema-visual] select {
    color: #FFFFFF !important;
  }
`;

const safeTextStyle: CSSProperties = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};


const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(340px, 48vh)",
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

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "#070212",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(900px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "18px 0 calc(24px + env(safe-area-inset-bottom))",
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

const mobileTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "12px",
  padding: "0",
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
  background: "#04000A",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  border: "1px solid rgba(59, 7, 100, 0.58)",
  boxShadow: "none",
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #DDD6FE 44%, #A78BFA 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "none",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const titleHeaderStyle: CSSProperties = {
  ...topStyle,
  justifyContent: "center",
  gap: "12px",
  flexWrap: "nowrap",
  marginTop: "4px",
  marginBottom: "14px",
  padding: 0,
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

const pageTitleTextStyle: CSSProperties = {
  display: "inline-block",
  margin: 0,
  paddingRight: "0.2em",
  paddingBottom: "0.04em",
  whiteSpace: "nowrap",
  overflow: "visible",
  fontSize: "23px",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  wordSpacing: "0.11em",
  color: "var(--historietas-accent, #F97316)",
  WebkitTextFillColor: "var(--historietas-accent, #F97316)",
  textAlign: "center",
  textShadow: "none",
  ...safeTextStyle,
};

const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  marginTop: "6px",
  marginBottom: "18px",
};

const desktopTitleHomeLinkStyle: CSSProperties = {
  ...titleHomeLinkStyle,
};

const desktopPageTitleTextStyle: CSSProperties = {
  ...pageTitleTextStyle,
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
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 13px",
  borderRadius: "999px",
  background: "#04000A",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#DDD6FE",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  textAlign: "center",
  boxShadow: "none",
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const desktopSoonTopButtonStyle: CSSProperties = {
  ...soonTopButtonStyle,
  minHeight: "42px",
  padding: "0 18px",
};

const heroStyle: CSSProperties = {
  position: "relative",
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

const heroSparkTopStyle: CSSProperties = {
  display: "none",
};

const heroSparkMiddleStyle: CSSProperties = {
  display: "none",
};

const heroSparkBottomStyle: CSSProperties = {
  display: "none",
};

const titleStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: "8px auto 0",
  fontSize: "clamp(34px, 10vw, 60px)",
  lineHeight: 0.92,
  fontWeight: 950,
  letterSpacing: "-0.085em",
  maxWidth: "100%",
  textAlign: "center",
  color: "var(--historietas-accent, #F97316)",
  textShadow: "none",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: "10px auto 0",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.55,
  fontWeight: 720,
  maxWidth: "680px",
  textAlign: "center",
  ...safeTextStyle,
};

const statsGridStyle: CSSProperties = {
  marginTop: "10px",
  display: "flex",
  alignItems: "stretch",
  gap: "7px",
  minWidth: 0,
  width: "calc(100% + 28px)",
  maxWidth: "calc(100% + 28px)",
  marginLeft: "-14px",
  marginRight: "-14px",
  overflowX: "auto",
  overflowY: "hidden",
  padding: "0 14px",
  boxSizing: "border-box",
  scrollSnapType: "x proximity",
};

const statCardStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  textAlign: "center",
  gap: "2px",
  borderRadius: "14px",
  padding: "6px 7px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  flex: "0 0 86px",
  minWidth: "86px",
  minHeight: "50px",
  maxWidth: "86px",
  overflow: "hidden",
  boxSizing: "border-box",
};

const unreadStatCardStyle: CSSProperties = {
  ...statCardStyle,
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "none",
};

const readStatCardStyle: CSSProperties = {
  ...statCardStyle,
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
};

const chapterStatCardStyle: CSSProperties = {
  ...statCardStyle,
  background: "rgba(4, 0, 10, 0.72)",
  boxShadow: "none",
};

const communityStatCardStyle: CSSProperties = {
  ...statCardStyle,
  background: "rgba(4, 0, 10, 0.72)",
  boxShadow: "none",
};

const statLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7.5px",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "0.02em",
  textTransform: "uppercase",
  textAlign: "center",
  ...safeTextStyle,
};

const statNumberStyle: CSSProperties = {
  color: "#DDD6FE",
  fontSize: "17px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const smallStatTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "8px",
  lineHeight: 1,
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const filterBoxStyle: CSSProperties = {
  position: "relative",
  marginTop: "12px",
  display: "grid",
  gap: "10px",
  padding: "12px",
  borderRadius: "22px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  boxSizing: "border-box",
};

const filterHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  flexWrap: "wrap",
  minWidth: 0,
  padding: "0 58px",
};

const filterHeaderTitleBoxStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
};

const desktopFilterHeaderTitleBoxStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
};

const miniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #F97316)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  textAlign: "center",
  ...safeTextStyle,
};

const filterTitleStyle: CSSProperties = {
  display: "none",
};

const filterResultBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "12px",
  left: "12px",
  width: "fit-content",
  maxWidth: "calc(100% - 24px)",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 950,
  ...safeTextStyle,
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#04000A",
  color: "#FFFFFF",
  padding: "0 13px",
  outline: "none",
  fontSize: "12px",
  fontWeight: 750,
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  minWidth: 0,
  boxShadow: "none",
};

const quickFiltersStyle: CSSProperties = {
  display: "flex",
  gap: "6px",
  flexWrap: "wrap",
  justifyContent: "center",
  minWidth: 0,
};

const quickFilterStyle: CSSProperties = {
  minHeight: "32px",
  padding: "0 9px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  ...safeTextStyle,
};

const quickFilterActiveStyle: CSSProperties = {
  ...quickFilterStyle,
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  boxShadow: "none",
};

const communityQuickFilterActiveStyle: CSSProperties = {
  ...quickFilterStyle,
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  boxShadow: "none",
};

const filterFooterStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const selectStyle: CSSProperties = {
  width: "100%",
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#04000A",
  color: "#FFFFFF",
  padding: "0 13px",
  outline: "none",
  fontSize: "12px",
  fontWeight: 850,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  textAlign: "center",
  boxShadow: "none",
};

const actionBarStyle: CSSProperties = {
  marginTop: "12px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 168px), 1fr))",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

const buttonBaseStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  padding: "0 6px",
  color: "#FFFFFF",
  fontWeight: 900,
  fontSize: "10.5px",
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  maxWidth: "100%",
  WebkitTapHighlightColor: "transparent",
  boxShadow: "none",
  ...safeTextStyle,
};

const primaryButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#08030F",
  boxShadow: "none",
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

const secondaryLinkButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const fullWidthSecondaryLinkButtonStyle: CSSProperties = {
  ...secondaryLinkButtonStyle,
  gridColumn: "1 / -1",
  minHeight: "32px",
};

const dangerButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  border: "1px solid rgba(239,68,68,0.18)",
  background: "rgba(239,68,68,0.075)",
  color: "#FCA5A5",
};

const listStyle: CSSProperties = {
  marginTop: "9px",
  display: "grid",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
};

const cardStyle: CSSProperties = {
  position: "relative",
  borderRadius: "18px",
  padding: "6px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  boxSizing: "border-box",
};

const readCardStyle: CSSProperties = {
  ...cardStyle,
  background: "rgba(4, 0, 10, 0.52)",
  border: "1px solid rgba(255,255,255,0.05)",
  boxShadow: "none",
};

const communityCardStyle: CSSProperties = {
  ...cardStyle,
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
};

const readCommunityCardStyle: CSSProperties = {
  ...communityCardStyle,
  background: "rgba(4, 0, 10, 0.52)",
  border: "1px solid rgba(255,255,255,0.05)",
  boxShadow: "none",
};

const cardHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "38px minmax(0, 1fr)",
  alignItems: "start",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
};

const notificationIconStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "18px",
  fontWeight: 950,
  boxShadow: "none",
  flex: "0 0 auto",
};

const unreadNotificationIconStyle: CSSProperties = {
  ...notificationIconStyle,
  background: "rgba(127,29,29,0.24)",
  border: "1px solid rgba(248,113,113,0.36)",
  color: "#FCA5A5",
  boxShadow: "none",
};

const readNotificationIconStyle: CSSProperties = {
  ...notificationIconStyle,
  background: "rgba(34,197,94,0.12)",
  border: "1px solid rgba(34,197,94,0.18)",
  color: "#86EFAC",
  boxShadow: "none",
};

const communityNotificationIconStyle: CSSProperties = {
  ...notificationIconStyle,
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#DDD6FE",
};

const cardHeaderTextStyle: CSSProperties = {
  display: "grid",
  gap: "1px",
  paddingTop: "0",
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "left",
  justifyItems: "stretch",
};

const notificationOriginRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  flexWrap: "wrap",
  minWidth: 0,
};

const chapterOriginBadgeStyle: CSSProperties = {
  minHeight: "22px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 8px",
  borderRadius: "999px",
  background: "rgba(249,115,22,0.12)",
  border: "1px solid rgba(249,115,22,0.20)",
  color: "var(--historietas-accent, #F97316)",
  fontSize: "9px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.055em",
};

const communityOriginBadgeStyle: CSSProperties = {
  ...chapterOriginBadgeStyle,
  background: "rgba(124,58,237,0.16)",
  border: "1px solid rgba(124,58,237,0.26)",
  color: "#DDD6FE",
};

const notificationKindBadgeStyle: CSSProperties = {
  minHeight: "22px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  fontWeight: 900,
  ...safeTextStyle,
};

const notificationTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "16px",
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

const notificationTitleRowStyle: CSSProperties = {
  position: "relative",
  display: "block",
  paddingRight: "28px",
  minWidth: 0,
  maxWidth: "100%",
};

const cardMenuWrapperStyle: CSSProperties = {
  position: "absolute",
  top: "-3px",
  right: 0,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "flex-end",
  minWidth: 0,
  zIndex: 20,
};

const cardMenuButtonStyle: CSSProperties = {
  width: "22px",
  height: "22px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  color: "#FFFFFF",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  WebkitTapHighlightColor: "transparent",
};

const cardMenuDropdownStyle: CSSProperties = {
  position: "absolute",
  top: "24px",
  right: 0,
  width: "196px",
  maxWidth: "calc(100vw - 44px)",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  alignItems: "stretch",
  justifyItems: "stretch",
  rowGap: "6px",
  padding: "7px",
  borderRadius: "15px",
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 14px 34px rgba(0,0,0,0.34)",
  zIndex: 80,
  boxSizing: "border-box",
  overflow: "hidden",
};

const cardMenuItemStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  minHeight: "34px",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  padding: "0 12px",
  margin: 0,
  borderRadius: "11px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.055)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "12px",
  lineHeight: 1.1,
  fontWeight: 900,
  fontFamily: "inherit",
  textAlign: "left",
  cursor: "pointer",
  boxSizing: "border-box",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  wordBreak: "normal",
  appearance: "none",
  WebkitAppearance: "none",
};

const cardMenuDangerItemStyle: CSSProperties = {
  ...cardMenuItemStyle,
  color: "#FCA5A5",
  background: "rgba(239,68,68,0.075)",
  border: "1px solid rgba(239,68,68,0.14)",
};

const filterActionsMenuWrapperStyle: CSSProperties = {
  position: "absolute",
  top: "8px",
  right: "10px",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "flex-end",
  minWidth: 0,
  zIndex: 120,
};

const filterActionsMenuButtonStyle: CSSProperties = {
  ...cardMenuButtonStyle,
  width: "26px",
  height: "26px",
};

const filterActionsMenuDropdownStyle: CSSProperties = {
  ...cardMenuDropdownStyle,
  top: "30px",
  right: 0,
  width: "min(224px, calc(100vw - 56px))",
  maxWidth: "calc(100vw - 56px)",
  zIndex: 130,
};

const filterActionsMenuItemDisabledStyle: CSSProperties = {
  ...cardMenuItemStyle,
  opacity: 0.45,
  cursor: "not-allowed",
};

const filterActionsMenuDangerItemDisabledStyle: CSSProperties = {
  ...cardMenuDangerItemStyle,
  opacity: 0.45,
  cursor: "not-allowed",
};

const communityDateTextStyle: CSSProperties = {
  display: "block",
  width: "100%",
  margin: "0",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9.5px",
  lineHeight: 1.12,
  fontWeight: 850,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  textAlign: "left",
  justifySelf: "stretch",
  ...safeTextStyle,
};

const notificationMessageStyle: CSSProperties = {
  width: "100%",
  margin: "1px 0 0",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.28,
  fontWeight: 700,
  textAlign: "left",
  justifySelf: "stretch",
  ...safeTextStyle,
};

const metaGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "4px",
  marginTop: "4px",
  minWidth: 0,
  maxWidth: "100%",
};

const communityMetaGridStyle: CSSProperties = {
  ...metaGridStyle,
  gridTemplateColumns: "1fr",
};

const metaBoxStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  borderRadius: "12px",
  padding: "6px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const metaLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  ...safeTextStyle,
};

const notificationAuthorInlineLinkStyle: CSSProperties = {
  ...metaLabelStyle,
  color: "#DDD6FE",
  textDecoration: "none",
};

const metaValueStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 900,
  ...safeTextStyle,
};

const communityCommentBoxStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  borderRadius: "12px",
  padding: "6px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
  textAlign: "left",
};

const communityInlineStatusStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "6px",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 900,
  lineHeight: 1.2,
  textAlign: "left",
  whiteSpace: "nowrap",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const communityInlineStatusDotStyle: CSSProperties = {
  color: "rgba(255,255,255,0.62)",
  fontSize: "10px",
  lineHeight: 1,
  flex: "0 0 auto",
};

const communityCommentTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.3,
  fontWeight: 720,
  textAlign: "left",
  ...safeTextStyle,
};

const cardActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "5px",
  marginTop: "7px",
  minWidth: 0,
  maxWidth: "100%",
};

const communityCardActionsStyle: CSSProperties = {
  ...cardActionsStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
};

const openChapterLinkStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10.5px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 6px",
  boxSizing: "border-box",
  boxShadow: "none",
  ...safeTextStyle,
};

const emptyStyle: CSSProperties = {
  marginTop: "12px",
  borderRadius: "24px",
  padding: "24px 18px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  textAlign: "center",
  display: "grid",
  justifyItems: "center",
  gap: "9px",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "none",
};

const emptyIconStyle: CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "22px",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "26px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  textAlign: "center",
  ...safeTextStyle,
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.55,
  fontWeight: 700,
  textAlign: "center",
  ...safeTextStyle,
};

const emptyButtonStyle: CSSProperties = {
  minHeight: "42px",
  padding: "0 14px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#08030F",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "none",
  ...safeTextStyle,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1220px, calc(100% - 64px))",
  padding: "26px 0 40px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "16px",
};

const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  padding: "20px 28px",
  borderRadius: "32px",
  minHeight: "138px",
  display: "grid",
  alignContent: "center",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  margin: "0 auto",
  fontSize: "clamp(46px, 4.7vw, 72px)",
  lineHeight: 0.94,
  maxWidth: "760px",
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  margin: "10px auto 0",
  fontSize: "15px",
  lineHeight: 1.62,
  maxWidth: "680px",
};

const desktopStatsGridStyle: CSSProperties = {
  ...statsGridStyle,
  gap: "8px",
  marginTop: "12px",
  width: "100%",
  maxWidth: "100%",
  marginLeft: 0,
  marginRight: 0,
  padding: 0,
};

const desktopFilterBoxStyle: CSSProperties = {
  ...filterBoxStyle,
  padding: "16px",
  borderRadius: "24px",
  gap: "12px",
};

const desktopFilterHeaderStyle: CSSProperties = {
  ...filterHeaderStyle,
  flexWrap: "nowrap",
};

const desktopSearchInputStyle: CSSProperties = {
  ...searchInputStyle,
  minHeight: "44px",
  fontSize: "13px",
};

const desktopQuickFiltersStyle: CSSProperties = {
  ...quickFiltersStyle,
  gap: "8px",
};

const desktopFilterFooterStyle: CSSProperties = {
  ...filterFooterStyle,
  gridTemplateColumns: "minmax(220px, 280px) auto",
  alignItems: "center",
  justifyContent: "start",
  gap: "10px",
};

const desktopActionBarStyle: CSSProperties = {
  ...actionBarStyle,
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "10px",
};

const desktopListStyle: CSSProperties = {
  ...listStyle,
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 430px), 1fr))",
  gap: "12px",
  alignItems: "stretch",
};

const desktopCardStyle: CSSProperties = {
  ...cardStyle,
  padding: "8px",
  borderRadius: "20px",
};

const desktopReadCardStyle: CSSProperties = {
  ...readCardStyle,
  padding: "8px",
  borderRadius: "20px",
};

const desktopCommunityCardStyle: CSSProperties = {
  ...communityCardStyle,
  padding: "8px",
  borderRadius: "20px",
};

const desktopReadCommunityCardStyle: CSSProperties = {
  ...readCommunityCardStyle,
  padding: "8px",
  borderRadius: "20px",
};

const desktopMetaGridStyle: CSSProperties = {
  ...metaGridStyle,
  gridTemplateColumns: "1fr",
  gap: "6px",
};

const desktopCommunityMetaGridStyle: CSSProperties = {
  ...communityMetaGridStyle,
  gridTemplateColumns: "1fr",
  gap: "6px",
};

const desktopCardActionsStyle: CSSProperties = {
  ...cardActionsStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "6px",
};

const desktopCommunityCardActionsStyle: CSSProperties = {
  ...desktopCardActionsStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
};

const desktopEmptyStyle: CSSProperties = {
  ...emptyStyle,
  minHeight: "360px",
  padding: "34px",
};