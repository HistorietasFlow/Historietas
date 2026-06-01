"use client";

import Link from "next/link";
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
    | "comentario-comunidade"
    | "denuncia-comunidade"
    | "moderacao-comunidade";
  lida: boolean;
  criadaEm: string;
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
    valor === "comentario-comunidade" ||
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

function montarLinkNotificacao(notificacao: NotificacaoLocal) {
  const linkDireto = notificacao.link.trim();

  if (linkDireto && linkDiretoValido(linkDireto)) {
    return linkDireto;
  }

  if (notificacao.obraId && notificacao.capituloId) {
    return `/ler-capitulo?obraId=${encodeURIComponent(
      notificacao.obraId
    )}&capituloId=${encodeURIComponent(notificacao.capituloId)}`;
  }

  return notificacao.tipo === "novo-capitulo" ? "/biblioteca" : "/comunidade";
}

function notificacaoEhComunidade(notificacao: NotificacaoLocal) {
  return notificacao.tipo !== "novo-capitulo";
}

function obterDetalheNotificacao(notificacao: NotificacaoLocal) {
  if (notificacao.tipo === "comentario-comunidade") {
    return "Comentário em publicação";
  }

  if (notificacao.tipo === "denuncia-comunidade") {
    return "Denúncia analisada";
  }

  if (notificacao.tipo === "moderacao-comunidade") {
    return "Moderação";
  }

  return "Capítulo";
}

function obterAcaoPrincipalNotificacao(notificacao: NotificacaoLocal) {
  return notificacaoEhComunidade(notificacao) ? "Ver comunidade" : "Ver capítulo";
}

function obterIconeNotificacao(notificacao: NotificacaoLocal, lida: boolean) {
  if (lida) {
    return "✓";
  }

  if (notificacao.tipo === "comentario-comunidade") {
    return "💬";
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


type SupabaseObraRow = Record<string, unknown>;
type SupabaseCapituloRow = Record<string, unknown>;

type EstadoSupabaseNotificacoes = {
  userId: string;
  obrasSeguidasIds: string[];
  notificacoesLidasIds: string[];
};

function pegarTexto(valor: unknown, fallback = "") {
  return typeof valor === "string" && valor.trim() ? valor.trim() : fallback;
}

function pegarBooleano(valor: unknown, fallback = false) {
  return typeof valor === "boolean" ? valor : fallback;
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

    const [obrasSeguidasIds, notificacoesLidasIds] = await Promise.all([
      carregarIdsTabelaUsuario("seguindo_obras", "obra_id", userId),
      carregarNotificacoesLidasSupabase(userId),
    ]);

    return {
      userId,
      obrasSeguidasIds,
      notificacoesLidasIds,
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
    return true;
  }

  return criarChavesObraParaNotificacao(obra).some((chave) =>
    idsSeguidos.has(chave)
  );
}

function criarNotificacoesDeCapitulos(
  obrasParaCriar: ObraLocal[],
  obrasSeguidasIds: string[],
  notificacoesLidasIds: string[]
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

    obra.capitulos.forEach((capitulo) => {
      const id = `capitulo-${obra.id}-${capitulo.id}`;

      notificacoesCriadas.push({
        id,
        obraId: obra.id,
        capituloId: capitulo.id,
        link: `/ler-capitulo?obraId=${encodeURIComponent(obra.id)}&capituloId=${encodeURIComponent(
          capitulo.id
        )}`,
        titulo: "Novo capítulo publicado",
        mensagem: `${capitulo.titulo} chegou em ${obra.titulo}.`,
        tipo: "novo-capitulo",
        lida: idsLidos.has(id),
        criadaEm: capitulo.criadoEm || obra.criadaEm || new Date().toISOString(),
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
  const notificacoesComunidade: NotificacaoLocal[] = [];

  try {
    const { data: postsData } = await supabase
      .from("comunidade_posts")
      .select("id, texto, autor_id, autor_nome, criado_em")
      .eq("autor_id", userId);

    const posts = Array.isArray(postsData) ? postsData : [];
    const postIds = posts
      .map((post) => pegarTexto((post as Record<string, unknown>).id))
      .filter(Boolean);

    const postsPorId = new Map(
      posts.map((post) => {
        const registro = post as Record<string, unknown>;

        return [
          pegarTexto(registro.id),
          {
            texto: pegarTexto(registro.texto, "sua publicação"),
            autorNome: pegarTexto(registro.autor_nome, "Você"),
          },
        ];
      })
    );

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
          const comentarioId = pegarTexto(registro.id);
          const postId = pegarTexto(registro.post_id);

          if (!comentarioId || !postId) {
            return;
          }

          const id = `comunidade-comentario-${comentarioId}`;
          const autorNome = pegarTexto(registro.autor_nome, "Alguém");
          const textoComentario = pegarTexto(registro.texto);
          const post = postsPorId.get(postId);
          const trechoPost = post?.texto
            ? post.texto.slice(0, 90)
            : "uma publicação sua";

          notificacoesComunidade.push({
            id,
            obraId: "",
            capituloId: "",
            link: `/comunidade?post=${encodeURIComponent(postId)}`,
            titulo: "Novo comentário na Comunidade",
            mensagem: `${autorNome} comentou em "${trechoPost}${
              trechoPost.length >= 90 ? "..." : ""
            }"${textoComentario ? `: ${textoComentario.slice(0, 90)}` : "."}`,
            tipo: "comentario-comunidade",
            lida: idsLidos.has(id),
            criadaEm: pegarTexto(registro.criado_em, new Date().toISOString()),
          });
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
        const registro = denuncia as Record<string, unknown>;
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

        notificacoesComunidade.push({
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
        });
      });
    }
  } catch {
    // Denúncias continuam opcionais para não bloquear as notificações.
  }

  return notificacoesComunidade.sort(
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

    await supabase.from("notificacoes").upsert(
      {
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
      },
      { onConflict: "user_id,notificacao_id" }
    );
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
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [notificacoes, setNotificacoes] = useState<NotificacaoLocal[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroNotificacao>("todas");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoNotificacao>("recentes");
  const [isDesktop, setIsDesktop] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [usuarioNotificacoesId, setUsuarioNotificacoesId] = useState("anon");
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
      const obrasLocais = carregarObras();
      const notificacoesLocais = carregarNotificacoes();
      const obrasSupabase = await carregarObrasPublicadasSupabase();
      const estadoSupabase = await carregarEstadoSupabaseNotificacoes();
      const usuarioAtualId = estadoSupabase?.userId || "anon";
      const idsNotificacoesApagadas = carregarIdsNotificacoesApagadas(usuarioAtualId);
      const notificacoesLocaisFiltradas = notificacoesLocais.filter(
        (notificacao) => !notificacaoEhComunidade(notificacao)
      );
      const obrasMescladas = mesclarObrasPorIdSlug(obrasLocais, obrasSupabase);
      const obrasSeguidasLocais = lerIdsLocalStorage(CHAVE_OBRAS_SEGUIDAS);
      const obrasSeguidasIds = Array.from(
        new Set([
          ...obrasSeguidasLocais,
          ...(estadoSupabase?.obrasSeguidasIds || []),
        ])
      );
      const notificacoesCapitulosSupabase = criarNotificacoesDeCapitulos(
        obrasMescladas,
        obrasSeguidasIds,
        estadoSupabase?.notificacoesLidasIds || []
      );
      const notificacoesComunidadeSupabase = estadoSupabase?.userId
        ? await carregarNotificacoesComunidadeSupabase(
            estadoSupabase.userId,
            estadoSupabase.notificacoesLidasIds
          )
        : [];
      const notificacoesMescladas = filtrarNotificacoesApagadas(
        mesclarNotificacoes(notificacoesLocaisFiltradas, [
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
      setCarregando(false);
    }

    void carregarDados();

    return () => {
      componenteAtivo = false;
    };
  }, []);

  const obrasPorId = useMemo(() => {
    return new Map(obras.map((obra) => [obra.id, obra]));
  }, [obras]);

  const totalNotificacoes = notificacoes.length;

  const totalNaoLidas = useMemo(() => {
    return notificacoes.filter((notificacao) => !notificacao.lida).length;
  }, [notificacoes]);

  const totalLidas = Math.max(totalNotificacoes - totalNaoLidas, 0);
  const totalCapitulos = notificacoes.filter(
    (notificacao) => notificacao.tipo === "novo-capitulo"
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
        (filtro === "capitulos" && notificacao.tipo === "novo-capitulo") ||
        (filtro === "comunidade" && notificacaoEhComunidade(notificacao));

      const textoBusca = normalizarTexto(
        [
          notificacao.titulo,
          notificacao.mensagem,
          notificacao.tipo,
          notificacao.link,
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

  function limparFiltros() {
    setBusca("");
    setFiltro("todas");
    setOrdenacao("recentes");
  }

  if (carregando) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${notificacoesPageCss}`}</style>
        <section style={isDesktop ? desktopContainerStyle : containerStyle} />
      </main>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${notificacoesPageCss}`}</style>

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTopStyle : topStyle}>
          <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
            <span style={logoMarkStyle}>H</span>
            <span className="historietas-theme-logo-text" style={logoTextStyle}>istorietas</span>
          </Link>

        </header>

        <section style={isDesktop ? desktopHeroBoxStyle : heroBoxStyle}>
          <h1 className="historietas-theme-title" style={isDesktop ? desktopTitleStyle : titleStyle}>Notificações</h1>

          <p style={isDesktop ? desktopDescriptionStyle : descriptionStyle}>
            Acompanhe novos capítulos, comentários da Comunidade e atualizações de moderação.
          </p>

        </section>

        <section style={isDesktop ? desktopStatsGridStyle : statsGridStyle} aria-label="Resumo das notificações">
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

        {totalNotificacoes > 0 && (
          <>
            <section style={isDesktop ? desktopFilterBoxStyle : filterBoxStyle}>
              <div style={isDesktop ? desktopFilterHeaderStyle : filterHeaderStyle}>
                <div style={isDesktop ? desktopFilterHeaderTitleBoxStyle : filterHeaderTitleBoxStyle}>
                  <span style={miniTitleStyle}>ORGANIZAR</span>

                  <h2 style={filterTitleStyle}>Buscar e filtrar</h2>
                </div>

                <span style={filterResultBadgeStyle}>
                  {notificacoesFiltradas.length} de {totalNotificacoes}
                </span>
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

            <section style={isDesktop ? desktopActionBarStyle : actionBarStyle} aria-label="Ações gerais">
              <button
                type="button"
                onClick={marcarTodasComoLidas}
                style={primaryButtonStyle}
                disabled={notificacoes.length === 0}
              >
                Marcar todas como lidas
              </button>

              <button
                type="button"
                onClick={marcarFiltradasComoLidas}
                style={secondaryButtonStyle}
                disabled={notificacoesFiltradas.length === 0}
              >
                Marcar seleção
              </button>

              <button
                type="button"
                onClick={limparLidas}
                style={secondaryButtonStyle}
                disabled={totalLidas === 0}
              >
                Apagar lidas
              </button>

              <button
                type="button"
                onClick={limparTodas}
                style={dangerButtonStyle}
                disabled={notificacoes.length === 0}
              >
                Limpar todas
              </button>
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

              const linkCapitulo = montarLinkNotificacao(notificacao);
              const labelAcaoPrincipal = obterAcaoPrincipalNotificacao(notificacao);

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
                  : notificationIconStyle;

              return (
                <article key={notificacao.id} style={cardVisualStyle}>
                  <div style={cardHeaderStyle}>
                    <div style={iconVisualStyle} aria-hidden="true">
                      {obterIconeNotificacao(notificacao, notificacao.lida)}
                    </div>

                    <div style={cardHeaderTextStyle}>
                      <h2 style={notificationTitleStyle}>
                        {tituloExibicao}
                      </h2>

                      {ehComunidade && (
                        <span style={communityDateTextStyle}>
                          DATA: {formatarData(notificacao.criadaEm)}
                        </span>
                      )}

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
                        <span style={metaLabelStyle}>
                          {notificacao.tipo === "comentario-comunidade"
                            ? `Comentário de ${autorComentarioComunidade}`
                            : "Atualização"}
                        </span>

                        {notificacao.tipo !== "comentario-comunidade" && (
                          <strong style={metaValueStyle}>
                            {obterDetalheNotificacao(notificacao)}
                          </strong>
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
                          <span style={metaLabelStyle}>Data</span>
                          <strong style={metaValueStyle}>
                            {formatarData(notificacao.criadaEm)}
                          </strong>
                        </div>

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

                  <div
                    style={
                      ehComunidade
                        ? isDesktop
                          ? desktopCommunityCardActionsStyle
                          : communityCardActionsStyle
                        : isDesktop
                          ? desktopCardActionsStyle
                          : cardActionsStyle
                    }
                  >
                    <Link
                      href={linkCapitulo}
                      style={openChapterLinkStyle}
                      onClick={() => abrirNotificacao(notificacao.id)}
                    >
                      {labelAcaoPrincipal}
                    </Link>

                    {obra && !ehComunidade && (
                      <Link
                        href={`/obra/${obra.slug || criarSlugBase(obra.titulo)}`}
                        style={secondaryLinkButtonStyle}
                      >
                        Abrir obra
                      </Link>
                    )}

                    {notificacao.lida ? (
                      <button
                        type="button"
                        onClick={() => marcarComoNaoLida(notificacao.id)}
                        style={secondaryButtonStyle}
                      >
                        Marcar como nova
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => marcarComoLida(notificacao.id)}
                        style={secondaryButtonStyle}
                      >
                        Marcar como lida
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => apagarNotificacao(notificacao.id)}
                      style={dangerButtonStyle}
                    >
                      Apagar
                    </button>
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
  html[data-historietas-tema-visual] nav a[href="/notificacoes"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/notificacoes"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/notificacoes"] {
    background: var(--historietas-bottom-nav-hover-bg, var(--historietas-active-surface, rgba(249,115,22,0.16))) !important;
    border-color: color-mix(in srgb, var(--historietas-accent, #F97316) 32%, transparent) !important;
    color: var(--historietas-accent, #F97316) !important;
  }

  html[data-historietas-tema-visual="branco"] button:disabled {
    opacity: 1 !important;
    background: #F1F3F4 !important;
    border-color: #DADCE0 !important;
    color: #5F6368 !important;
    cursor: not-allowed !important;
  }
`;

const safeTextStyle: CSSProperties = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background:
    "radial-gradient(circle at 12% 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent), transparent 31%), radial-gradient(circle at 88% 14%, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent), transparent 24%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 42%, var(--historietas-bg-end, #17101B) 100%)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  width: "min(860px, calc(100% - 32px))",
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
  gap: "10px",
  flexWrap: "nowrap",
  marginBottom: "12px",
  minWidth: 0,
  maxWidth: "100%",
};

const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "24px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "calc(100% - 126px)",
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

const heroBoxStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  textAlign: "center",
  gap: "7px",
  padding: "14px 14px 13px",
  borderRadius: "22px",
  background:
    "radial-gradient(circle at 14% 0%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)), transparent 34%), radial-gradient(circle at 88% 12%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)), transparent 38%), linear-gradient(135deg, var(--historietas-surface, rgba(31,16,52,0.96)) 0%, var(--historietas-surface-strong, rgba(12,7,23,0.99)) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 20%, var(--historietas-border-soft, rgba(251,191,36,0.18)))",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const titleStyle: CSSProperties = {
  margin: 0,
  justifySelf: "center",
  textAlign: "center",
  fontSize: "clamp(34px, 9.4vw, 54px)",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.07em",
  maxWidth: "100%",
  paddingBottom: "2px",
  background: "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 45%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  justifySelf: "center",
  textAlign: "center",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12.5px",
  lineHeight: 1.48,
  fontWeight: 650,
  maxWidth: "330px",
  ...safeTextStyle,
};

const statsGridStyle: CSSProperties = {
  marginTop: "12px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const statCardStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  textAlign: "center",
  gap: "3px",
  borderRadius: "16px",
  padding: "8px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(255,255,255,0.060)), var(--historietas-surface-strong, rgba(255,255,255,0.034)))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  boxShadow: "var(--historietas-card-shadow, none)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const unreadStatCardStyle: CSSProperties = {
  ...statCardStyle,
  background: "var(--historietas-surface, rgba(255,255,255,0.060))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  boxShadow: "none",
};

const readStatCardStyle: CSSProperties = {
  ...statCardStyle,
  background: "var(--historietas-surface, rgba(255,255,255,0.060))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  boxShadow: "none",
};

const chapterStatCardStyle: CSSProperties = {
  ...statCardStyle,
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, var(--historietas-surface, rgba(255,255,255,0.060))), var(--historietas-surface-strong, rgba(255,255,255,0.034)))",
};

const communityStatCardStyle: CSSProperties = {
  ...statCardStyle,
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, var(--historietas-surface, rgba(255,255,255,0.060))), var(--historietas-surface-strong, rgba(255,255,255,0.034)))",
};

const statLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  ...safeTextStyle,
};

const statNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "21px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

const smallStatTextStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  lineHeight: 1.12,
  fontWeight: 950,
  ...safeTextStyle,
};

const filterBoxStyle: CSSProperties = {
  position: "relative",
  marginTop: "12px",
  display: "grid",
  gap: "10px",
  padding: "12px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(18,12,30,0.82)) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.92)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  boxShadow: "var(--historietas-card-shadow, none)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const filterHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
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
  minWidth: 0,
  display: "grid",
  justifyItems: "start",
  textAlign: "left",
};

const miniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const filterTitleStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

const filterResultBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "12px",
  right: "12px",
  width: "fit-content",
  maxWidth: "calc(100% - 24px)",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  ...safeTextStyle,
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  background: "var(--historietas-input-bg, #18181B)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 13px",
  outline: "none",
  fontSize: "12px",
  fontWeight: 750,
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  minWidth: 0,
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
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.065))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  ...safeTextStyle,
};

const quickFilterActiveStyle: CSSProperties = {
  ...quickFilterStyle,
  background: "var(--historietas-accent, #F97316)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 60%, transparent)",
  color: "#FFFFFF",
  boxShadow: "none",
};

const communityQuickFilterActiveStyle: CSSProperties = {
  ...quickFilterStyle,
  background: "var(--historietas-secondary, #7C3AED)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 62%, transparent)",
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
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  background: "var(--historietas-input-bg, #18181B)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 13px",
  outline: "none",
  fontSize: "12px",
  fontWeight: 850,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  textAlign: "center",
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
  minHeight: "40px",
  borderRadius: "999px",
  padding: "0 12px",
  color: "#FFFFFF",
  fontWeight: 900,
  fontSize: "12px",
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  maxWidth: "100%",
  WebkitTapHighlightColor: "transparent",
  ...safeTextStyle,
};

const primaryButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  border: "none",
  background: "var(--historietas-accent, #F97316)",
  boxShadow: "none",
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.07))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.11))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
};

const secondaryLinkButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
};

const dangerButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  border: "1px solid color-mix(in srgb, var(--historietas-danger-button-text, #FCA5A5) 28%, var(--historietas-border-soft, transparent))",
  background: "var(--historietas-danger-surface, rgba(239,68,68,0.13))",
  color: "var(--historietas-danger-button-text, #FCA5A5)",
};

const listStyle: CSSProperties = {
  marginTop: "12px",
  display: "grid",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
};

const cardStyle: CSSProperties = {
  position: "relative",
  borderRadius: "22px",
  padding: "10px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(31,16,52,0.90)), var(--historietas-surface-strong, rgba(18,12,30,0.96)))",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 18%, var(--historietas-border-soft, transparent))",
  boxShadow: "var(--historietas-card-shadow, none)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const readCardStyle: CSSProperties = {
  ...cardStyle,
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(31,16,52,0.64)), var(--historietas-surface-strong, rgba(18,12,30,0.78)))",
  border: "1px solid rgba(34,197,94,0.12)",
  boxShadow: "var(--historietas-card-shadow, none)",
};

const communityCardStyle: CSSProperties = {
  ...cardStyle,
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 15%, var(--historietas-surface, rgba(31,16,52,0.90))), var(--historietas-surface-strong, rgba(18,12,30,0.96)))",
  border:
    "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 28%, var(--historietas-border-soft, transparent))",
};

const readCommunityCardStyle: CSSProperties = {
  ...communityCardStyle,
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 9%, var(--historietas-surface, rgba(31,16,52,0.66))), var(--historietas-surface-strong, rgba(18,12,30,0.78)))",
  border: "1px solid rgba(34,197,94,0.12)",
};

const cardHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "52px minmax(0, 1fr)",
  alignItems: "start",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
};

const notificationIconStyle: CSSProperties = {
  width: "52px",
  height: "52px",
  borderRadius: "18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent), color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent))",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  color: "#FFFFFF",
  fontSize: "25px",
  fontWeight: 950,
  boxShadow: "none",
  flex: "0 0 auto",
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
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 34%, transparent), color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent))",
  border:
    "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 34%, transparent)",
};

const cardHeaderTextStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  paddingTop: "6px",
  minWidth: 0,
  maxWidth: "100%",
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
  color: "var(--historietas-accent, #FDBA74)",
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
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  fontWeight: 900,
  ...safeTextStyle,
};

const notificationTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "clamp(14px, 4.3vw, 18px)",
  lineHeight: 1.12,
  fontWeight: 950,
  letterSpacing: "0.055em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const communityDateTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "0.045em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const notificationMessageStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11.5px",
  lineHeight: 1.48,
  fontWeight: 650,
  ...safeTextStyle,
};

const metaGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "6px",
  marginTop: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

const communityMetaGridStyle: CSSProperties = {
  ...metaGridStyle,
  gridTemplateColumns: "1fr",
};

const metaBoxStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  borderRadius: "15px",
  padding: "8px",
  background: "color-mix(in srgb, var(--historietas-surface, rgba(255,255,255,0.045)) 92%, var(--historietas-bg-end, transparent))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.07))",
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

const metaValueStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 900,
  ...safeTextStyle,
};

const communityCommentBoxStyle: CSSProperties = {
  ...metaBoxStyle,
  gap: "4px",
};

const communityCommentTextStyle: CSSProperties = {
  margin: "1px 0 0",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11.5px",
  lineHeight: 1.42,
  fontWeight: 720,
  ...safeTextStyle,
};

const cardActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
  gap: "6px",
  marginTop: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

const communityCardActionsStyle: CSSProperties = {
  ...cardActionsStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
};

const openChapterLinkStyle: CSSProperties = {
  ...primaryButtonStyle,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
};

const emptyStyle: CSSProperties = {
  marginTop: "12px",
  borderRadius: "24px",
  padding: "24px 18px",
  background: "var(--historietas-surface, rgba(18,12,30,0.82))",
  border: "1px dashed var(--historietas-border-soft, rgba(255,255,255,0.14))",
  textAlign: "center",
  display: "grid",
  justifyItems: "center",
  gap: "9px",
  minWidth: 0,
  overflow: "hidden",
};

const emptyIconStyle: CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, transparent)",
  fontSize: "22px",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "28px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  lineHeight: 1.55,
  fontWeight: 700,
  maxWidth: "320px",
  ...safeTextStyle,
};

const emptyButtonStyle: CSSProperties = {
  minHeight: "42px",
  padding: "0 14px",
  borderRadius: "999px",
  border: "none",
  background: "var(--historietas-secondary, #7C3AED)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  ...safeTextStyle,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "24px 0 36px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "16px",
};

const desktopHeroBoxStyle: CSSProperties = {
  ...heroBoxStyle,
  justifyItems: "center",
  alignContent: "center",
  textAlign: "center",
  gap: "10px",
  padding: "28px 26px 26px",
  borderRadius: "30px",
  minHeight: "184px",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  justifySelf: "center",
  textAlign: "center",
  fontSize: "clamp(50px, 5vw, 70px)",
  lineHeight: 1.06,
  maxWidth: "780px",
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  justifySelf: "center",
  textAlign: "center",
  maxWidth: "650px",
  fontSize: "14px",
  lineHeight: 1.6,
};

const desktopStatsGridStyle: CSSProperties = {
  ...statsGridStyle,
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: "12px",
  marginTop: "16px",
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
  gap: "14px",
  alignItems: "stretch",
};

const desktopCardStyle: CSSProperties = {
  ...cardStyle,
  padding: "14px",
  borderRadius: "24px",
};

const desktopReadCardStyle: CSSProperties = {
  ...readCardStyle,
  padding: "14px",
  borderRadius: "24px",
};

const desktopCommunityCardStyle: CSSProperties = {
  ...communityCardStyle,
  padding: "14px",
  borderRadius: "24px",
};

const desktopReadCommunityCardStyle: CSSProperties = {
  ...readCommunityCardStyle,
  padding: "14px",
  borderRadius: "24px",
};

const desktopMetaGridStyle: CSSProperties = {
  ...metaGridStyle,
  gridTemplateColumns: "1fr",
  gap: "8px",
};

const desktopCommunityMetaGridStyle: CSSProperties = {
  ...communityMetaGridStyle,
  gridTemplateColumns: "1fr",
  gap: "8px",
};

const desktopCardActionsStyle: CSSProperties = {
  ...cardActionsStyle,
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "8px",
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