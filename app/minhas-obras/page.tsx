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

type FiltroMinhasObras =
  | "todas"
  | "publicadas"
  | "rascunhos"
  | "favoritas"
  | "concluidas"
  | "em-leitura";

type OrdenacaoMinhasObras =
  | "recentes"
  | "titulo"
  | "capitulos"
  | "progresso";

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

function criarLoginHrefMinhasObras() {
  const params = new URLSearchParams({
    redirectTo: "/minhas-obras",
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

function criarPerfilAutorHref(autor: string, autorId?: string) {
  const params = new URLSearchParams();
  const autorLimpo = autor.trim() || "Autor não informado";
  const autorIdLimpo = autorId?.trim() || "";

  params.set("autor", autorLimpo);

  if (autorIdLimpo) {
    params.set("autorId", autorIdLimpo);
    params.set("userId", autorIdLimpo);
  }

  return `/perfil-autor?${params.toString()}`;
}

function pegarTextoPerfilMinhasObras(valor: unknown, fallback = "") {
  return typeof valor === "string" && valor.trim() ? valor.trim() : fallback;
}

function obterNomeAuthMinhasObras({
  email,
  metadata,
}: {
  email: string;
  metadata: Record<string, unknown>;
}) {
  return (
    pegarTextoPerfilMinhasObras(metadata.name) ||
    pegarTextoPerfilMinhasObras(metadata.full_name) ||
    pegarTextoPerfilMinhasObras(metadata.nome) ||
    email.trim().split("@")[0] ||
    "Usuário"
  ).slice(0, 80);
}

function obterNomeProfileMinhasObras(
  row: Record<string, unknown> | null,
  fallback: string
) {
  return (
    pegarTextoPerfilMinhasObras(row?.nome) ||
    pegarTextoPerfilMinhasObras(row?.nome_usuario) ||
    pegarTextoPerfilMinhasObras(row?.username) ||
    pegarTextoPerfilMinhasObras(row?.display_name) ||
    pegarTextoPerfilMinhasObras(row?.apelido) ||
    fallback.trim() ||
    "Usuário"
  ).slice(0, 80);
}

async function carregarNomeProfileMinhasObras(
  userId: string,
  nomeFallback: string
) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return nomeFallback.trim() || "Usuário";
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userIdLimpo)
      .maybeSingle();

    if (!error && data && typeof data === "object" && !Array.isArray(data)) {
      return obterNomeProfileMinhasObras(
        data as Record<string, unknown>,
        nomeFallback
      );
    }
  } catch {
    // Se a coluna user_id não existir, tenta buscar pelo id abaixo.
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userIdLimpo)
      .maybeSingle();

    if (!error && data && typeof data === "object" && !Array.isArray(data)) {
      return obterNomeProfileMinhasObras(
        data as Record<string, unknown>,
        nomeFallback
      );
    }
  } catch {
    // Profiles é complementar; Minhas Obras continua com fallback.
  }

  return nomeFallback.trim() || "Usuário";
}

function aplicarAutorProfileMinhasObras(
  obra: ObraLocal,
  userId: string,
  nomeAutorProfile: string
): ObraLocal {
  const autorProfile = nomeAutorProfile.trim();

  if (!autorProfile) {
    return {
      ...obra,
      autorId: obra.autorId || userId,
    };
  }

  return {
    ...obra,
    autor: autorProfile,
    autorId: obra.autorId || userId,
  };
}

function formatarGeneroMinhasObras(genero: string) {
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
    texto: capitulo.texto || "Nenhum texto foi escrito ainda.",
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
    titulo: obra.titulo || "Obra sem título",
    autor: obra.autor || "Autor não informado",
    autorId:
      typeof obra.autorId === "string" && obra.autorId.trim()
        ? obra.autorId.trim()
        : "",
    genero: obra.genero || "Não informado",
    formato: obra.formato || "Não informado",
    classificacaoIndicativa:
      typeof obra.classificacaoIndicativa === "string" &&
      obra.classificacaoIndicativa.trim()
        ? obra.classificacaoIndicativa
        : "Não informada",
    sinopse: obra.sinopse || "Nenhuma sinopse informada.",
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
    slug:
      typeof obra.slug === "string" && obra.slug.trim()
        ? obra.slug
        : criarSlugBase(obra.titulo || `obra-${index + 1}`),
    link:
      typeof obra.link === "string" && obra.link.trim()
        ? obra.link
        : `/obra/${
            typeof obra.slug === "string" && obra.slug.trim()
              ? obra.slug
              : criarSlugBase(obra.titulo || `obra-${index + 1}`)
          }`,
  };
}

function carregarObrasLocais() {
  const obrasSalvasTexto = localStorage.getItem(STORAGE_KEY);
  const obrasSalvasJson = obrasSalvasTexto ? JSON.parse(obrasSalvasTexto) : [];

  const obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
    ? obrasSalvasJson.map((obra, index) => normalizarObra(obra, index))
    : [];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasNormalizadas));

  return obrasNormalizadas;
}

function normalizarUsuarioId(userId: string) {
  return userId.trim().toLowerCase();
}

function obraPertenceAoUsuario(obra: ObraLocal, userId: string) {
  const usuarioIdNormalizado = normalizarUsuarioId(userId);
  const autorIdNormalizado = normalizarUsuarioId(obra.autorId || "");

  return Boolean(usuarioIdNormalizado && autorIdNormalizado === usuarioIdNormalizado);
}

function filtrarObrasDoUsuario(obrasParaFiltrar: ObraLocal[], userId: string) {
  return obrasParaFiltrar.filter((obra) => obraPertenceAoUsuario(obra, userId));
}

function atualizarObrasLocaisDoUsuario(
  obrasLocaisAtuais: ObraLocal[],
  obrasDoUsuario: ObraLocal[],
  userId: string
) {
  const idsObrasDoUsuario = new Set(obrasDoUsuario.map((obra) => obra.id));
  const outrasObrasLocais = obrasLocaisAtuais.filter((obra) => {
    if (idsObrasDoUsuario.has(obra.id)) {
      return false;
    }

    return !obraPertenceAoUsuario(obra, userId);
  });

  return [...obrasDoUsuario, ...outrasObrasLocais];
}

function criarStorageKeyUsuarioMinhasObras(chave: string, userId: string) {
  const usuarioId = userId.trim();

  return usuarioId ? `${chave}:${usuarioId}` : chave;
}

function normalizarListaIdsMinhasObras(valor: unknown) {
  return Array.isArray(valor)
    ? valor
        .filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
        .map((id) => id.trim())
    : [];
}

function lerListaIdsStorageMinhasObras(chave: string) {
  try {
    const listaTexto = localStorage.getItem(chave);
    const listaJson: unknown = listaTexto ? JSON.parse(listaTexto) : [];

    return normalizarListaIdsMinhasObras(listaJson);
  } catch {
    return [] as string[];
  }
}

function carregarListaIdsStorage(chave: string, userId = "") {
  const chaveUsuario = criarStorageKeyUsuarioMinhasObras(chave, userId);
  const listaGlobal = lerListaIdsStorageMinhasObras(chave);
  const listaUsuario = userId ? lerListaIdsStorageMinhasObras(chaveUsuario) : [];
  const listaNormalizada = Array.from(new Set([...listaGlobal, ...listaUsuario]));

  localStorage.setItem(chaveUsuario, JSON.stringify(listaNormalizada));

  if (!userId) {
    localStorage.setItem(chave, JSON.stringify(listaNormalizada));
  }

  return listaNormalizada;
}

function salvarListaIdsStorage(chave: string, userId: string, lista: string[]) {
  const listaNormalizada = Array.from(new Set(normalizarListaIdsMinhasObras(lista)));
  const chaveUsuario = criarStorageKeyUsuarioMinhasObras(chave, userId);

  localStorage.setItem(chaveUsuario, JSON.stringify(listaNormalizada));

  if (!userId) {
    localStorage.setItem(chave, JSON.stringify(listaNormalizada));
  }
}

function obterIdentificadoresObraMinhasObras(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">
) {
  return Array.from(
    new Set(
      [obra.id, obra.slug, criarSlugBase(obra.titulo), normalizarTexto(obra.titulo)]
        .map((identificador) => identificador.trim())
        .filter(Boolean)
    )
  );
}

function colecaoTemObraMinhasObras(
  colecao: string[],
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">
) {
  const idsColecao = new Set(
    colecao.map((id) => id.trim()).filter(Boolean)
  );

  return obterIdentificadoresObraMinhasObras(obra).some((identificador) =>
    idsColecao.has(identificador)
  );
}

function removerObraDaColecaoMinhasObras(
  colecao: string[],
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">
) {
  const identificadoresObra = new Set(obterIdentificadoresObraMinhasObras(obra));

  return colecao.filter((id) => !identificadoresObra.has(id.trim()));
}

async function carregarIdsColecaoSupabaseMinhasObras(
  tabela: "favoritos" | "concluidas",
  userId: string
) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [] as string[];
  }

  try {
    const { data, error } = await supabase
      .from(tabela)
      .select("obra_id")
      .eq("user_id", userIdLimpo);

    if (error || !Array.isArray(data)) {
      return [] as string[];
    }

    return data
      .map((registro) => {
        if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
          return "";
        }

        const obraId = (registro as Record<string, unknown>).obra_id;

        return typeof obraId === "string" ? obraId.trim() : "";
      })
      .filter(Boolean);
  } catch {
    return [] as string[];
  }
}

async function removerReferenciasSupabaseDaObraExcluida(
  userId: string,
  obraId: string,
  capituloIds: string[]
) {
  const usuarioId = userId.trim();
  const obraIdLimpo = obraId.trim();
  const capitulosValidos = capituloIds.map((id) => id.trim()).filter(Boolean);

  if (!usuarioId || !obraIdLimpo) {
    return;
  }

  try {
    await Promise.allSettled([
      supabase.from("favoritos").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("concluidas").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("seguindo_obras").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("obra_curtidas").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("obra_avaliacoes").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("progresso_leitura").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("diario_atividades").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
    ]);

    if (capitulosValidos.length > 0) {
      await Promise.allSettled([
        supabase.from("curtidas_capitulos").delete().eq("user_id", usuarioId).in("capitulo_id", capitulosValidos),
        supabase.from("salvos_capitulos").delete().eq("user_id", usuarioId).in("capitulo_id", capitulosValidos),
        supabase.from("comentarios_capitulos").delete().eq("user_id", usuarioId).in("capitulo_id", capitulosValidos),
      ]);
    }
  } catch {
    // A exclusão principal da obra continua; essas referências são limpeza complementar.
  }
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
  index: number,
  nomeAutorProfile = ""
): ObraLocal {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo])
  );

  const capitulosRemotos = capitulosSupabase.map((capitulo, capituloIndex) => {
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

  const capitulosRemotosIds = new Set(capitulosRemotos.map((capitulo) => capitulo.id));
  const capitulosApenasLocais = (obraLocal?.capitulos || []).filter(
    (capitulo) => !capitulosRemotosIds.has(capitulo.id)
  );
  const capitulosMesclados = [...capitulosRemotos, ...capitulosApenasLocais];
  const tituloObra = obra.titulo?.trim() || obraLocal?.titulo || "Obra sem título";
  const slug = obra.slug?.trim() || obraLocal?.slug || criarSlugBase(tituloObra || `obra-${index + 1}`);
  const arquivoUrl = obra.arquivo_url?.trim() || "";

  return {
    id: obra.id || obraLocal?.id || `obra-${index + 1}`,
    titulo: tituloObra,
    autor:
      nomeAutorProfile.trim() ||
      obra.autor?.trim() ||
      obraLocal?.autor ||
      "Autor não informado",
    autorId: obra.user_id?.trim() || obraLocal?.autorId || "",
    genero: obra.genero?.trim() || obraLocal?.genero || "Não informado",
    formato: obra.formato?.trim() || obraLocal?.formato || "Não informado",
    classificacaoIndicativa:
      obra.classificacao_indicativa?.trim() ||
      obraLocal?.classificacaoIndicativa ||
      "Não informada",
    sinopse: obra.sinopse?.trim() || obraLocal?.sinopse || "Nenhuma sinopse informada.",
    tags: Array.isArray(obra.tags) && obra.tags.length > 0 ? obra.tags : obraLocal?.tags || ["sem tags"],
    capa: obra.capa_url?.trim() || obraLocal?.capa || "",
    capaNome: obra.capa_nome?.trim() || obraLocal?.capaNome || "",
    arquivoObra: arquivoUrl
      ? {
          nome: obra.arquivo_nome?.trim() || obraLocal?.arquivoObra?.nome || "Arquivo da obra",
          tipo: obra.arquivo_tipo?.trim() || obraLocal?.arquivoObra?.tipo || "",
          tamanho:
            typeof obra.arquivo_tamanho === "number" && Number.isFinite(obra.arquivo_tamanho)
              ? obra.arquivo_tamanho
              : obraLocal?.arquivoObra?.tamanho || 0,
          conteudo: arquivoUrl,
          categoria: normalizarCategoriaArquivoSupabase(obra.arquivo_categoria),
          criadoEm: obra.criada_em || obraLocal?.arquivoObra?.criadoEm || "",
        }
      : obraLocal?.arquivoObra || null,
    publicado: Boolean(obra.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obra.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    slug,
    link: obra.link?.trim() || obraLocal?.link || `/obra/${slug}`,
  };
}

function removerReferenciasDaObraExcluida(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">,
  userId = ""
) {
  const limparColecao = (chave: string) => {
    try {
      const listaGlobal = removerObraDaColecaoMinhasObras(
        lerListaIdsStorageMinhasObras(chave),
        obra
      );
      const chaveUsuario = criarStorageKeyUsuarioMinhasObras(chave, userId);
      const listaUsuario = removerObraDaColecaoMinhasObras(
        lerListaIdsStorageMinhasObras(chaveUsuario),
        obra
      );

      localStorage.setItem(chave, JSON.stringify(listaGlobal));
      localStorage.setItem(chaveUsuario, JSON.stringify(listaUsuario));
    } catch {
      localStorage.setItem(chave, JSON.stringify([]));
    }
  };

  limparColecao(FOLLOW_STORAGE_KEY);
  limparColecao(FAVORITES_STORAGE_KEY);
  limparColecao(COMPLETED_STORAGE_KEY);

  try {
    const notificacoesTexto = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const notificacoesJson = notificacoesTexto
      ? JSON.parse(notificacoesTexto)
      : [];
    const identificadoresObra = new Set(obterIdentificadoresObraMinhasObras(obra));

    const novasNotificacoes = Array.isArray(notificacoesJson)
      ? notificacoesJson.filter((notificacao) => {
          if (!notificacao || typeof notificacao !== "object") {
            return false;
          }

          const notificacaoComObra = notificacao as { obraId?: unknown };
          const obraIdNotificacao =
            typeof notificacaoComObra.obraId === "string"
              ? notificacaoComObra.obraId.trim()
              : "";

          return !identificadoresObra.has(obraIdNotificacao);
        })
      : [];

    localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(novasNotificacoes)
    );
  } catch {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([]));
  }
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


function criarDecoracaoPaginaStyle(_index: number): CSSProperties {
  return {
    display: "none",
  };
}

function criarDecoracaoMinhasObrasStyle(_index: number): CSSProperties {
  return {
    display: "none",
  };
}

export default function MinhasObrasPage() {
  const router = useRouter();

  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroMinhasObras>("todas");
  const [ordenacao, setOrdenacao] =
    useState<OrdenacaoMinhasObras>("recentes");
  const [obraComLinkCopiado, setObraComLinkCopiado] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(false);
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
        const { data, error } = await supabase.auth.getUser();

        if (cancelado) {
          return;
        }

        if (error || !data.user) {
          setUsuarioAutenticado(false);
          setVerificandoAcesso(false);
          router.replace(criarLoginHrefMinhasObras());
          return;
        }

        setUsuarioAutenticado(true);
        setVerificandoAcesso(false);
      } catch {
        if (!cancelado) {
          setUsuarioAutenticado(false);
          setVerificandoAcesso(false);
          router.replace(criarLoginHrefMinhasObras());
        }
      }
    }

    void verificarAcesso();

    return () => {
      cancelado = true;
    };
  }, [router]);

  useEffect(() => {
    if (!usuarioAutenticado) {
      return;
    }

    let cancelado = false;

    async function carregarObras() {
      try {
        const { data: dadosUsuario, error: erroUsuario } =
          await supabase.auth.getUser();

        if (erroUsuario || !dadosUsuario.user) {
          return;
        }

        const userId = dadosUsuario.user.id;
        const nomeAutorProfile = await carregarNomeProfileMinhasObras(
          userId,
          obterNomeAuthMinhasObras({
            email: dadosUsuario.user.email || "",
            metadata:
              dadosUsuario.user.user_metadata &&
              typeof dadosUsuario.user.user_metadata === "object" &&
              !Array.isArray(dadosUsuario.user.user_metadata)
                ? (dadosUsuario.user.user_metadata as Record<string, unknown>)
                : {},
          })
        );
        const obrasLocaisTodas = carregarObrasLocais();
        const obrasLocaisDoUsuario = filtrarObrasDoUsuario(
          obrasLocaisTodas,
          userId
        ).map((obra) =>
          aplicarAutorProfileMinhasObras(obra, userId, nomeAutorProfile)
        );
        const [favoritosSupabase, concluidasSupabase] = await Promise.all([
          carregarIdsColecaoSupabaseMinhasObras("favoritos", userId),
          carregarIdsColecaoSupabaseMinhasObras("concluidas", userId),
        ]);
        const obrasFavoritasNormalizadas = Array.from(
          new Set([
            ...carregarListaIdsStorage(FAVORITES_STORAGE_KEY, userId),
            ...favoritosSupabase,
          ])
        );
        const obrasConcluidasNormalizadas = Array.from(
          new Set([
            ...carregarListaIdsStorage(COMPLETED_STORAGE_KEY, userId),
            ...concluidasSupabase,
          ])
        );

        salvarListaIdsStorage(
          FAVORITES_STORAGE_KEY,
          userId,
          obrasFavoritasNormalizadas
        );
        salvarListaIdsStorage(
          COMPLETED_STORAGE_KEY,
          userId,
          obrasConcluidasNormalizadas
        );

        if (!cancelado) {
          setObras(obrasLocaisDoUsuario);
          setObrasFavoritas(obrasFavoritasNormalizadas);
          setObrasConcluidas(obrasConcluidasNormalizadas);
        }

        const { data: obrasSupabase, error: erroObras } = await supabase
          .from("obras")
          .select("*")
          .eq("user_id", userId)
          .order("criada_em", { ascending: false });

        if (erroObras) {
          console.warn("Não consegui carregar obras remotas:", erroObras.message);
          return;
        }

        const obrasBanco = (obrasSupabase || []) as SupabaseObraRow[];
        const obrasIds = obrasBanco.map((obra) => obra.id).filter(Boolean);
        let capitulosBanco: SupabaseCapituloRow[] = [];

        if (obrasIds.length > 0) {
          const { data: capitulosSupabase, error: erroCapitulos } =
            await supabase
              .from("capitulos")
              .select("*")
              .in("obra_id", obrasIds)
              .order("ordem", { ascending: true });

          if (erroCapitulos) {
            console.warn(
              "Não consegui carregar capítulos remotos:",
              erroCapitulos.message
            );
          } else {
            capitulosBanco = (capitulosSupabase || []) as SupabaseCapituloRow[];
          }
        }

        const obrasLocaisPorId = new Map(
          obrasLocaisDoUsuario.map((obra) => [obra.id, obra])
        );

        const obrasBancoNormalizadas = obrasBanco.map((obra, index) => {
          const capitulosDaObra = capitulosBanco.filter(
            (capitulo) => capitulo.obra_id === obra.id
          );

          return normalizarObraSupabase(
            obra,
            capitulosDaObra,
            obrasLocaisPorId.get(obra.id),
            index,
            nomeAutorProfile
          );
        });

        const idsBanco = new Set(obrasBancoNormalizadas.map((obra) => obra.id));
        const obrasApenasLocaisDoUsuario = obrasLocaisDoUsuario.filter(
          (obra) => !idsBanco.has(obra.id)
        );
        const obrasMescladasDoUsuario = [
          ...obrasBancoNormalizadas,
          ...obrasApenasLocaisDoUsuario,
        ];
        const obrasLocaisAtualizadas = atualizarObrasLocaisDoUsuario(
          obrasLocaisTodas,
          obrasMescladasDoUsuario,
          userId
        );

        localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasLocaisAtualizadas));

        if (!cancelado) {
          setObras(obrasMescladasDoUsuario);
        }
      } catch {
        if (!cancelado) {
          setObras([]);
          setObrasFavoritas([]);
          setObrasConcluidas([]);
        }
      }
    }

    carregarObras();

    return () => {
      cancelado = true;
    };
  }, [usuarioAutenticado]);

  const totais = useMemo(() => {
    const totalCapitulos = obras.reduce(
      (total, obra) => total + obra.capitulos.length,
      0
    );

    const totalCurtidas = obras.reduce((total, obra) => {
      return total + obra.capitulos.filter((capitulo) => capitulo.curtiu).length;
    }, 0);

    const totalComentarios = obras.reduce((total, obra) => {
      return (
        total +
        obra.capitulos.filter((capitulo) => capitulo.comentario.trim()).length
      );
    }, 0);

    const totalSalvos = obras.reduce((total, obra) => {
      return total + obra.capitulos.filter((capitulo) => capitulo.salvo).length;
    }, 0);

    const totalLidos = obras.reduce((total, obra) => {
      return total + obra.capitulos.filter((capitulo) => capitulo.lido).length;
    }, 0);

    const totalEmLeitura = obras.filter((obra) =>
      obra.capitulos.some(
        (capitulo) =>
          capitulo.lido ||
          capitulo.salvo ||
          capitulo.curtiu ||
          capitulo.comentario.trim()
      )
    ).length;

    const totalPublicadas = obras.filter((obra) => obra.publicado).length;
    const totalRascunhos = obras.filter((obra) => !obra.publicado).length;
    const totalFavoritas = obras.filter((obra) =>
      colecaoTemObraMinhasObras(obrasFavoritas, obra)
    ).length;
    const totalConcluidas = obras.filter((obra) =>
      colecaoTemObraMinhasObras(obrasConcluidas, obra)
    ).length;
    const totalComClassificacao = obras.filter((obra) =>
      mostrarClassificacao(obra)
    ).length;

    const totalComArquivo = obras.filter((obra) => Boolean(obra.arquivoObra))
      .length;

    return {
      totalCapitulos,
      totalCurtidas,
      totalComentarios,
      totalSalvos,
      totalLidos,
      totalEmLeitura,
      totalPublicadas,
      totalRascunhos,
      totalFavoritas,
      totalConcluidas,
      totalComClassificacao,
      totalComArquivo,
    };
  }, [obras, obrasFavoritas, obrasConcluidas]);




  const obrasFiltradas = useMemo(() => {
    const termoBusca = normalizarTexto(busca);

    return obras
      .filter((obra) => {
        if (filtro === "publicadas" && !obra.publicado) {
          return false;
        }

        if (filtro === "rascunhos" && obra.publicado) {
          return false;
        }

        if (filtro === "favoritas" && !colecaoTemObraMinhasObras(obrasFavoritas, obra)) {
          return false;
        }

        if (filtro === "concluidas" && !colecaoTemObraMinhasObras(obrasConcluidas, obra)) {
          return false;
        }

        if (
          filtro === "em-leitura" &&
          !obra.capitulos.some((capitulo) => {
            return (
              capitulo.lido ||
              capitulo.salvo ||
              capitulo.curtiu ||
              Boolean(capitulo.comentario.trim())
            );
          })
        ) {
          return false;
        }

        if (!termoBusca) {
          return true;
        }

        const textoObra = normalizarTexto(
          [
            obra.titulo,
            obra.autor,
            obra.genero,
            formatarGeneroMinhasObras(obra.genero),
            obra.formato,
            obra.classificacaoIndicativa,
            obra.sinopse,
            obra.tags.join(" "),
            obra.capaNome,
            obra.arquivoObra?.nome || "",
          ].join(" ")
        );

        return textoObra.includes(termoBusca);
      })
      .sort((obraA, obraB) => {
        if (ordenacao === "titulo") {
          return obraA.titulo.localeCompare(obraB.titulo, "pt-BR");
        }

        if (ordenacao === "capitulos") {
          return obraB.capitulos.length - obraA.capitulos.length;
        }

        if (ordenacao === "progresso") {
          return obraB.progressoLeitura - obraA.progressoLeitura;
        }

        const dataA = new Date(obraA.criadaEm || obraA.ultimaLeituraEm).getTime();
        const dataB = new Date(obraB.criadaEm || obraB.ultimaLeituraEm).getTime();

        return (Number.isNaN(dataB) ? 0 : dataB) -
          (Number.isNaN(dataA) ? 0 : dataA);
      });
  }, [obras, obrasFavoritas, obrasConcluidas, busca, filtro, ordenacao]);

  async function copiarLinkObra(obra: ObraLocal) {
    const linkPublico =
      obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
    const linkAbsoluto = linkPublico.startsWith("http")
      ? linkPublico
      : `${window.location.origin}${
          linkPublico.startsWith("/") ? linkPublico : `/${linkPublico}`
        }`;

    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(linkAbsoluto);
        } catch {
          copiarTextoComFallback(linkAbsoluto);
        }
      } else {
        copiarTextoComFallback(linkAbsoluto);
      }

      setObraComLinkCopiado(obra.id);

      window.setTimeout(() => {
        setObraComLinkCopiado((obraIdAtual) =>
          obraIdAtual === obra.id ? "" : obraIdAtual
        );
      }, 1800);
    } catch {
      setObraComLinkCopiado("");
    }
  }

  function copiarTextoComFallback(texto: string) {
    const campoTemporario = document.createElement("textarea");
    campoTemporario.value = texto;
    campoTemporario.setAttribute("readonly", "true");
    campoTemporario.style.position = "fixed";
    campoTemporario.style.left = "-9999px";
    document.body.appendChild(campoTemporario);
    campoTemporario.select();
    document.execCommand("copy");
    document.body.removeChild(campoTemporario);
  }

  async function excluirObra(obraId: string, tituloObra: string) {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir a obra "${tituloObra}"? Todos os capítulos, curtidas, comentários e itens salvos dessa obra serão apagados. Essa ação não pode ser desfeita.`
    );

    if (!confirmar) {
      return;
    }

    try {
      const { data: dadosUsuario } = await supabase.auth.getUser();

      if (!dadosUsuario.user) {
        router.replace(criarLoginHrefMinhasObras());
        return;
      }

      const userId = dadosUsuario.user.id;
      const obraExcluida = obras.find((obra) => obra.id === obraId) || {
        id: obraId,
        slug: criarSlugBase(tituloObra),
        titulo: tituloObra,
        capitulos: [] as CapituloLocal[],
      };
      const novasObras = obras.filter((obra) => obra.id !== obraId);
      const novasObrasFavoritas = removerObraDaColecaoMinhasObras(
        obrasFavoritas,
        obraExcluida
      );
      const novasObrasConcluidas = removerObraDaColecaoMinhasObras(
        obrasConcluidas,
        obraExcluida
      );
      const obrasLocaisTodas = carregarObrasLocais().filter(
        (obra) => !colecaoTemObraMinhasObras([obraId], obra)
      );
      const obrasLocaisAtualizadas = atualizarObrasLocaisDoUsuario(
        obrasLocaisTodas,
        novasObras,
        userId
      );

      removerReferenciasDaObraExcluida(obraExcluida, userId);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasLocaisAtualizadas));
      salvarListaIdsStorage(FAVORITES_STORAGE_KEY, userId, novasObrasFavoritas);
      salvarListaIdsStorage(COMPLETED_STORAGE_KEY, userId, novasObrasConcluidas);

      setObras(novasObras);
      setObrasFavoritas(novasObrasFavoritas);
      setObrasConcluidas(novasObrasConcluidas);

      await removerReferenciasSupabaseDaObraExcluida(
        userId,
        obraId,
        obraExcluida.capitulos.map((capitulo) => capitulo.id)
      );

      const { error } = await supabase
        .from("obras")
        .delete()
        .eq("id", obraId)
        .eq("user_id", dadosUsuario.user.id);

      if (error) {
        console.warn("Não consegui concluir a exclusão remota:", error.message);
      }
    } catch {
      router.replace(criarLoginHrefMinhasObras());
    }
  }

  if (verificandoAcesso || !usuarioAutenticado) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${minhasObrasPageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <section style={emptyBoxStyle}>
            <h3 style={emptyTitleStyle}>Verificando acesso...</h3>

            <p style={emptyTextStyle}>
              Conferindo sua sessão antes de carregar suas obras.
            </p>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${minhasObrasPageCss}`}</style>

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
              MINHAS OBRAS
            </span>
          </Link>
        </header>

        {obras.length > 0 && (
          <section style={isDesktop ? desktopFilterBoxStyle : filterBoxStyle}>
            <div style={isDesktop ? desktopFilterGridStyle : filterGridStyle}>
              <label style={fieldBoxStyle}>
                <span style={filterLabelStyle}>Buscar obra</span>

                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Buscar por título, autor, gênero ou tag..."
                  style={searchInputStyle}
                />
              </label>

              <label style={fieldBoxStyle}>
                <span style={filterLabelStyle}>Filtrar</span>

                <select
                  value={filtro}
                  onChange={(event) =>
                    setFiltro(event.target.value as FiltroMinhasObras)
                  }
                  style={selectStyle}
                >
                  <option value="todas">Todas</option>
                  <option value="publicadas">Publicadas</option>
                  <option value="rascunhos">Rascunhos</option>
                  <option value="favoritas">Na lista</option>
                  <option value="concluidas">Concluídas</option>
                  <option value="em-leitura">Em leitura</option>
                </select>
              </label>

              <label style={fieldBoxStyle}>
                <span style={filterLabelStyle}>Ordenar</span>

                <select
                  value={ordenacao}
                  onChange={(event) =>
                    setOrdenacao(event.target.value as OrdenacaoMinhasObras)
                  }
                  style={selectStyle}
                >
                  <option value="recentes">Mais recentes</option>
                  <option value="titulo">Título A-Z</option>
                  <option value="capitulos">Mais capítulos</option>
                  <option value="progresso">Maior progresso</option>
                </select>
              </label>
            </div>

            <div style={isDesktop ? desktopFilterFooterStyle : filterFooterStyle}>
              <span style={filterInfoStyle}>
                Mostrando {obrasFiltradas.length} de {obras.length} obras
              </span>

            </div>
          </section>
        )}

        {obras.length > 0 && (
          <section style={isDesktop ? desktopStatsBoxStyle : statsBoxStyle}>
            <div style={isDesktop ? desktopStatCardStyle : statCardStyle}>
              <strong style={statNumberStyle}>{obras.length}</strong>
              <span style={statLabelStyle}>
                {obras.length === 1 ? "obra criada" : "obras criadas"}
              </span>
            </div>

            <div style={isDesktop ? desktopStatCardStyle : statCardStyle}>
              <strong style={statNumberStyle}>{totais.totalPublicadas}</strong>
              <span style={statLabelStyle}>
                {totais.totalPublicadas === 1 ? "publicada" : "publicadas"}
              </span>
            </div>

            <div style={isDesktop ? desktopStatCardStyle : statCardStyle}>
              <strong style={statNumberStyle}>{totais.totalRascunhos}</strong>
              <span style={statLabelStyle}>
                {totais.totalRascunhos === 1 ? "rascunho" : "rascunhos"}
              </span>
            </div>

            <div style={isDesktop ? desktopStatCardStyle : statCardStyle}>
              <strong style={statNumberStyle}>{totais.totalCapitulos}</strong>
              <span style={statLabelStyle}>
                {totais.totalCapitulos === 1 ? "capítulo" : "capítulos"}
              </span>
            </div>

            <div style={isDesktop ? desktopStatCardStyle : wideStatCardStyle}>
              <strong style={statNumberStyle}>{totais.totalComArquivo}</strong>
              <span style={statLabelStyle}>
                {totais.totalComArquivo === 1 ? "arquivo anexado" : "arquivos anexados"}
              </span>
            </div>
          </section>
        )}

        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <div style={isDesktop ? desktopSectionHeaderStyle : sectionHeaderStyle}>
            <div style={{ width: "100%", minWidth: 0 }}>
              <h2 style={{ ...sectionTitleStyle, textAlign: "center" }}>
                OBRAS CRIADAS
              </h2>
            </div>
          </div>

          {obras.length === 0 ? (
            <div style={emptyBoxStyle}>
              <h3 style={emptyTitleStyle}>Nenhuma obra criada ainda</h3>

              <p style={emptyTextStyle}>
                Publique sua primeira obra pela página Publicar. Ela aparecerá
                aqui para edição, capítulos e acompanhamento.
              </p>

              <Link href="/publicar" style={emptyButtonStyle}>
                Criar minha primeira obra
              </Link>
            </div>
          ) : obrasFiltradas.length === 0 ? (
            <div style={emptyBoxStyle}>
              <h3 style={emptyTitleStyle}>Nenhuma obra encontrada</h3>

              <p style={emptyTextStyle}>
                Mude a busca, o filtro ou a ordenação para ver suas obras.
              </p>

            </div>
          ) : (
            <div style={isDesktop ? desktopListStyle : listStyle}>
              {obrasFiltradas.map((obra) => {
                const progressoLeitura = calcularProgressoLeitura(
                  obra.capitulos
                );

                const obraFavorita = colecaoTemObraMinhasObras(obrasFavoritas, obra);
                const obraConcluida = colecaoTemObraMinhasObras(obrasConcluidas, obra);

                const ultimoCapitulo =
                  obra.capitulos[obra.capitulos.length - 1] || null;

                const capituloParaContinuar =
                  encontrarCapituloParaContinuar(obra);

                const capituloDestaque = capituloParaContinuar || ultimoCapitulo;

                const adicionarCapituloHref = `/adicionar-capitulo?obraId=${obra.id}`;
                const editarObraHref = `/editar-obra?obraId=${obra.id}`;
                const verObraHref = `/minha-obra?obraId=${obra.id}`;
                const verArquivoHref = `/ver-arquivo?obraId=${obra.id}`;
                const paginaPublicaHref =
                  obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
                const perfilAutorHref = criarPerfilAutorHref(
                  obra.autor,
                  obra.autorId
                );

                const indiceCapituloDestaque = capituloDestaque
                  ? obra.capitulos.findIndex(
                      (capitulo) => capitulo.id === capituloDestaque.id
                    )
                  : -1;
                const numeroCapituloDestaque =
                  indiceCapituloDestaque >= 0 ? indiceCapituloDestaque + 1 : 1;
                const capituloDestaqueHref = capituloDestaque
                  ? criarHrefLeituraCapitulo(
                      obra,
                      capituloDestaque,
                      numeroCapituloDestaque
                    )
                  : "";

                return (
                  <article key={obra.id} style={isDesktop ? desktopObraCardStyle : obraCardStyle}>
                    <div style={criarCoverStyle(obra.capa, isDesktop)}>
                      <div style={coverGlowStyle} />


                      {mostrarClassificacao(obra) && (
                        <span style={coverClassificationBadgeStyle}>
                          {obra.classificacaoIndicativa}
                        </span>
                      )}

                      <div style={coverBottomStyle}>
                        <strong style={coverTitleStyle}>
                          {obra.capitulos.length}
                        </strong>

                        <span style={coverSubtitleStyle}>
                          {obra.capitulos.length === 1
                            ? "capítulo"
                            : "capítulos"}
                        </span>
                      </div>
                    </div>

                    <div style={isDesktop ? desktopCardContentStyle : cardContentStyle}>
                      <div style={statusRowStyle}>
                        <span style={formatBadgeStyle}>{obra.formato}</span>

                        {obra.tags.slice(0, 1).map((tag, index) => (
                          <span
                            key={`${obra.id}-status-tag-${tag}-${index}`}
                            style={tagStyle}
                          >
                            {tag}
                          </span>
                        ))}

                        <span style={genreInlineBadgeStyle}>
                          {formatarGeneroMinhasObras(obra.genero)}
                        </span>

                        {obraFavorita && (
                          <span style={favoriteBadgeStyle}>★</span>
                        )}

                        {obraConcluida && (
                          <span style={completedBadgeStyle}>✓</span>
                        )}
                      </div>

                      <h3 style={isDesktop ? desktopCardTitleStyle : cardTitleStyle}>{obra.titulo}</h3>

                      <Link href={perfilAutorHref} style={authorLinkStyle}>
                        Por {obra.autor}
                      </Link>

                      {obra.capitulos.length > 0 && (
                        <section style={isDesktop ? desktopProgressBoxStyle : progressBoxStyle}>
                          <div style={progressCompactLineStyle}>
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

                        </section>
                      )}

                      {obra.arquivoObra && !capituloDestaque ? (
                        <div
                          style={
                            isDesktop
                              ? desktopFilePublicationActionsGridStyle
                              : filePublicationActionsGridStyle
                          }
                        >
                          <div style={filePublicationColumnStyle}>
                            <Link href={verArquivoHref} style={fileActionStyle}>
                              Ver arquivo
                            </Link>

                            <Link
                              href={paginaPublicaHref}
                              style={publicPageActionStyle}
                            >
                              Página pública
                            </Link>
                          </div>

                          <div style={filePublicationColumnStyle}>
                            <Link href={verObraHref} style={orangeActionStyle}>
                              Ver obra
                            </Link>

                            <Link
                              href={adicionarCapituloHref}
                              style={purpleActionStyle}
                            >
                              Adicionar capítulo
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <>
                          {capituloDestaque ? (
                            <section style={isDesktop ? desktopLastChapterBoxStyle : lastChapterBoxStyle}>
                              <div style={lastChapterActionsRowStyle}>
                                <Link
                                  href={capituloDestaqueHref}
                                  style={lastChapterButtonStyle}
                                >
                                  {capituloParaContinuar
                                    ? "Continuar lendo"
                                    : "Ler capítulo"}
                                </Link>

                                <Link href={verObraHref} style={orangeActionStyle}>
                                  Ver obra
                                </Link>
                              </div>
                            </section>
                          ) : (
                            <section style={isDesktop ? desktopLastChapterBoxStyle : lastChapterBoxStyle}>
                              <div style={singleLastChapterActionRowStyle}>
                                <Link href={verObraHref} style={orangeActionStyle}>
                                  Ver obra
                                </Link>
                              </div>
                            </section>
                          )}

                          <div
                            style={
                              obra.arquivoObra
                                ? isDesktop
                                  ? desktopPrimaryActionsWithFileGridStyle
                                  : primaryActionsWithFileGridStyle
                                : isDesktop
                                ? desktopPrimaryActionsGridStyle
                                : primaryActionsGridStyle
                            }
                          >
                            <Link
                              href={paginaPublicaHref}
                              style={publicPageActionStyle}
                            >
                              Página pública
                            </Link>

                            <Link
                              href={adicionarCapituloHref}
                              style={purpleActionStyle}
                            >
                              Adicionar capítulo
                            </Link>

                            {obra.arquivoObra && (
                              <Link href={verArquivoHref} style={fileActionStyle}>
                                Ver arquivo
                              </Link>
                            )}
                          </div>
                        </>
                      )}

                    </div>

                    <div style={isDesktop ? desktopSecondaryActionsGridStyle : secondaryActionsGridStyle}>
                      <Link href={editarObraHref} style={secondaryActionStyle}>
                        Editar
                      </Link>

                      <button
                        type="button"
                        onClick={() => copiarLinkObra(obra)}
                        style={
                          obraComLinkCopiado === obra.id
                            ? copiedLinkSmallActionStyle
                            : copyLinkSmallActionStyle
                        }
                      >
                        {obraComLinkCopiado === obra.id
                          ? "Copiado!"
                          : "Copiar link"}
                      </button>

                      <button
                        type="button"
                        onClick={() => excluirObra(obra.id, obra.titulo)}
                        style={deleteActionStyle}
                      >
                        Excluir
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

      </section>
    </main>
  );
}

const minhasObrasPageCss = `
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

  html[data-historietas-tema-visual] nav a[href="/minhas-obras"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/minhas-obras"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/minhas-obras"] {
    background: var(--historietas-bottom-nav-active-bg, rgba(59, 7, 100, 0.54)) !important;
    border-color: var(--historietas-bottom-nav-active-border, rgba(109, 40, 217, 0.48)) !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] nav a[href="/minhas-obras"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/minhas-obras"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/minhas-obras"] .historietas-bottom-nav-icon {
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
  maxWidth: "100%",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const pageDecorationLayerStyle: CSSProperties = {
  display: "none",
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
  width: "min(840px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "14px 0 20px",
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
  marginTop: 0,
  marginBottom: "14px",
  padding: 0,
  textAlign: "center",
};

const titleHomeLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  width: "fit-content",
  minWidth: 0,
  maxWidth: "100%",
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
  fontSize: "19px",
  fontWeight: 950,
  border: "1px solid rgba(59, 7, 100, 0.58)",
  boxShadow: "none",
  flex: "0 0 auto",
};

const desktopTitleLogoMarkStyle: CSSProperties = {
  ...titleLogoMarkStyle,
  width: "42px",
  height: "42px",
  borderRadius: "15px",
  fontSize: "23px",
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
  marginTop: 0,
  marginBottom: "18px",
};

const desktopTitleHomeLinkStyle: CSSProperties = {
  ...titleHomeLinkStyle,
  gap: "1px",
};

const desktopPageTitleTextStyle: CSSProperties = {
  ...pageTitleTextStyle,
  fontSize: "34px",
  letterSpacing: "-0.068em",
};

const topCreateActionStyle: CSSProperties = {
  minHeight: "38px",
  padding: "0 13px",
  borderRadius: "999px",
  background: "#04000A",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#DDD6FE",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  boxShadow: "none",
  ...safeTextStyle,
};

const desktopTopCreateActionStyle: CSSProperties = {
  ...topCreateActionStyle,
  minHeight: "40px",
  padding: "0 15px",
};

const heroStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: "30px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "linear-gradient(135deg, #070212 0%, #04000A 58%, #020006 100%)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const heroDecorationLayerStyle: CSSProperties = {
  display: "none",
};

const heroPremiumShineStyle: CSSProperties = {
  display: "none",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "24px 16px",
  display: "grid",
  justifyItems: "center",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "center",
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "clamp(36px, 9.4vw, 58px)",
  lineHeight: 1.04,
  fontWeight: 950,
  letterSpacing: "-0.072em",
  maxWidth: "100%",
  paddingBottom: "3px",
  textShadow: "none",
  ...safeTextStyle,
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  fontSize: "56px",
  lineHeight: 0.96,
};

const descriptionStyle: CSSProperties = {
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
  fontSize: "15px",
  maxWidth: "720px",
};

const heroActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "8px",
  width: "min(250px, 100%)",
  margin: "2px auto 0",
  minWidth: 0,
};

const heroPrimaryButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 15px",
  boxShadow: "none",
  ...safeTextStyle,
};





const statsBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "6px",
  marginTop: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const statCardStyle: CSSProperties = {
  borderRadius: "16px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  padding: "8px 4px",
  minHeight: "62px",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  gap: "3px",
  textAlign: "center",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "none",
};

const wideStatCardStyle: CSSProperties = {
  ...statCardStyle,
};

const statNumberStyle: CSSProperties = {
  color: "#DDD6FE",
  fontSize: "17px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const statLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "8px",
  lineHeight: 1.05,
  fontWeight: 950,
  textAlign: "center",
  textTransform: "uppercase",
  letterSpacing: "0.02em",
  ...safeTextStyle,
};








const filterBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: "12px",
  borderRadius: "22px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "grid",
  gap: "9px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
  boxShadow: "none",
};

const filterGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  minWidth: 0,
};

const fieldBoxStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  width: "100%",
  minWidth: 0,
  padding: "8px",
  borderRadius: "15px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const filterLabelStyle: CSSProperties = {
  color: "var(--historietas-accent, #F97316)",
  fontSize: "12px",
  fontWeight: 950,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  textAlign: "center",
  ...safeTextStyle,
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  height: "46px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#04000A",
  color: "#FFFFFF",
  padding: "0 16px",
  outline: "none",
  fontSize: "14px",
  fontWeight: 720,
  textAlign: "center",
  boxSizing: "border-box",
  boxShadow: "none",
  minWidth: 0,
};

const selectStyle: CSSProperties = {
  width: "100%",
  height: "40px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#04000A",
  color: "#FFFFFF",
  padding: "0 12px",
  outline: "none",
  fontSize: "11.5px",
  fontWeight: 820,
  textAlign: "center",
  boxSizing: "border-box",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  boxShadow: "none",
};

const filterFooterStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  flexWrap: "wrap",
  minWidth: 0,
  textAlign: "center",
};

const filterInfoStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};


const sectionStyle: CSSProperties = {
  marginTop: "20px",
  minWidth: 0,
};

const sectionHeaderStyle: CSSProperties = {
  display: "block",
  marginBottom: "16px",
  minWidth: 0,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "clamp(28px, 8vw, 34px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.065em",
  textAlign: "center",
  textTransform: "none",
  ...safeTextStyle,
};

const emptyBoxStyle: CSSProperties = {
  borderRadius: "24px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  padding: "22px",
  display: "grid",
  gap: "12px",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "none",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "28px",
  fontWeight: 950,
  letterSpacing: "-0.05em",
  textAlign: "center",
  ...safeTextStyle,
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "14px",
  lineHeight: 1.65,
  fontWeight: 650,
  textAlign: "center",
  ...safeTextStyle,
};

const emptyButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 14px",
  boxShadow: "none",
  ...safeTextStyle,
};

const listStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const obraCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(112px, 0.38fr) minmax(0, 1fr)",
  alignItems: "start",
  gap: "10px",
  padding: "10px",
  borderRadius: "22px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  boxShadow: "none",
  boxSizing: "border-box",
  minWidth: 0,
  overflow: "hidden",
};

const coverStyle: CSSProperties = {
  width: "100%",
  minHeight: "180px",
  height: "180px",
  maxHeight: "180px",
  maxWidth: "100%",
  alignSelf: "start",
  boxSizing: "border-box",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  background: "#04000A",
  backgroundImage: "linear-gradient(135deg, #08030F 0%, #04000A 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  border: "1px solid rgba(255,255,255,0.08)",
  minWidth: 0,
  flex: "0 0 auto",
  boxShadow: "none",
};

const coverGlowStyle: CSSProperties = {
  display: "none",
};

const noCoverBadgeStyle: CSSProperties = {
  display: "none",
};

const coverClassificationBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "9px",
  right: "9px",
  width: "fit-content",
  maxWidth: "calc(100% - 18px)",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 950,
  ...safeTextStyle,
};

const coverBottomStyle: CSSProperties = {
  position: "absolute",
  left: "10px",
  right: "10px",
  bottom: "12px",
  display: "flex",
  alignItems: "baseline",
  justifyContent: "center",
  gap: "7px",
  minWidth: 0,
};

const coverTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "18px",
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: "-0.04em",
  textAlign: "center",
  ...safeTextStyle,
};

const coverSubtitleStyle: CSSProperties = {
  color: "rgba(255,255,255,0.72)",
  fontSize: "10px",
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const cardContentStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  display: "grid",
  alignContent: "start",
  gap: "6px",
};

const statusRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "5px",
  rowGap: "5px",
  marginTop: "4px",
  minWidth: 0,
};

const formatBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};



const favoriteBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#DDD6FE",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const completedBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 8px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(34, 197, 94, 0.22)",
  color: "#86EFAC",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};



const cardTitleStyle: CSSProperties = {
  margin: "0",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "24px",
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: "-0.06em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const authorLinkStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  margin: "-2px 0 1px",
  color: "var(--historietas-text-secondary, #D8C8FF)",
  fontSize: "13px",
  fontWeight: 820,
  textDecoration: "none",
  borderBottom: "0",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const tagStyle: CSSProperties = {
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const genreInlineBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const progressBoxStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  padding: "0",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
  overflow: "hidden",
};

const progressCompactLineStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
};



const progressPercentStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "0",
  borderRadius: "999px",
  background: "transparent",
  border: "none",
  color: "#86EFAC",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const progressTrackStyle: CSSProperties = {
  width: "100%",
  height: "7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
};

const progressBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background:
    "linear-gradient(90deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
};






const lastChapterBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "7px",
  padding: "0",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
  overflow: "hidden",
};


const lastChapterActionsRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const singleLastChapterActionRowStyle: CSSProperties = {
  ...lastChapterActionsRowStyle,
  gridTemplateColumns: "1fr",
};

const filePublicationActionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  marginTop: "1px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const filePublicationColumnStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  alignContent: "start",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
};

const desktopFilePublicationActionsGridStyle: CSSProperties = {
  ...filePublicationActionsGridStyle,
  gap: "9px",
};

const lastChapterButtonStyle: CSSProperties = {
  minHeight: "34px",
  width: "100%",
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
  padding: "0 8px",
  boxShadow: "none",
  ...safeTextStyle,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const primaryActionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const primaryActionsWithFileGridStyle: CSSProperties = {
  ...primaryActionsGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "7px",
};

const secondaryActionsGridStyle: CSSProperties = {
  gridColumn: "1 / -1",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  alignItems: "stretch",
  gap: "6px",
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  paddingTop: "2px",
};






const orangeActionStyle: CSSProperties = {
  minHeight: "34px",
  width: "100%",
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
  padding: "0 8px",
  boxShadow: "none",
  ...safeTextStyle,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const purpleActionStyle: CSSProperties = {
  ...orangeActionStyle,
};

const publicPageActionStyle: CSSProperties = {
  minHeight: "34px",
  width: "100%",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  textDecoration: "none",
  fontSize: "10.5px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 6px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  boxShadow: "none",
  ...safeTextStyle,
};

const fileActionStyle: CSSProperties = {
  ...publicPageActionStyle,
};

const copyLinkSmallActionStyle: CSSProperties = {
  minHeight: "28px",
  width: "100%",
  maxWidth: "100%",
  padding: "0 8px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  ...safeTextStyle,
};

const copiedLinkSmallActionStyle: CSSProperties = {
  ...copyLinkSmallActionStyle,
  background: "rgba(34,197,94,0.12)",
  border: "1px solid rgba(34,197,94,0.22)",
  color: "#86EFAC",
};

const secondaryActionStyle: CSSProperties = {
  minHeight: "28px",
  width: "100%",
  maxWidth: "100%",
  padding: "0 8px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  ...safeTextStyle,
};

const deleteActionStyle: CSSProperties = {
  minHeight: "28px",
  width: "100%",
  maxWidth: "100%",
  padding: "0 8px",
  borderRadius: "999px",
  border: "1px solid rgba(239,68,68,0.18)",
  background: "rgba(239,68,68,0.075)",
  color: "#FCA5A5",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  ...safeTextStyle,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "26px 0 32px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "16px",
};

const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  borderRadius: "30px",
};

const desktopHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  padding: "30px 40px",
  textAlign: "center",
  justifyItems: "center",
  maxWidth: "760px",
  margin: "0 auto",
  gap: "10px",
};

const desktopStatsBoxStyle: CSSProperties = {
  ...statsBoxStyle,
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "12px",
  marginTop: "16px",
};

const desktopStatCardStyle: CSSProperties = {
  ...statCardStyle,
  minHeight: "68px",
};

const desktopFilterBoxStyle: CSSProperties = {
  ...filterBoxStyle,
  padding: "14px",
  borderRadius: "22px",
};

const desktopFilterGridStyle: CSSProperties = {
  ...filterGridStyle,
  gridTemplateColumns: "minmax(360px, 1.45fr) minmax(190px, 0.72fr) minmax(210px, 0.78fr)",
  alignItems: "end",
  gap: "14px",
};

const desktopFilterFooterStyle: CSSProperties = {
  ...filterFooterStyle,
  justifyContent: "center",
  flexWrap: "wrap",
};

const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
};

const desktopSectionHeaderStyle: CSSProperties = {
  ...sectionHeaderStyle,
  display: "flex",
  alignItems: "end",
  justifyContent: "space-between",
  marginBottom: "18px",
  width: "min(1120px, 100%)",
  marginLeft: "auto",
  marginRight: "auto",
};

const desktopListStyle: CSSProperties = {
  ...listStyle,
  gap: "16px",
};

const desktopObraCardStyle: CSSProperties = {
  ...obraCardStyle,
  gridTemplateColumns: "150px minmax(0, 1fr)",
  gap: "17px",
  padding: "14px",
  borderRadius: "24px",
  minHeight: "178px",
};

const desktopCoverStyle: CSSProperties = {
  ...coverStyle,
  minHeight: "190px",
  height: "190px",
  maxHeight: "190px",
  borderRadius: "16px",
};

const desktopCardContentStyle: CSSProperties = {
  ...cardContentStyle,
  gap: "7px",
};

const desktopCardTitleStyle: CSSProperties = {
  ...cardTitleStyle,
  fontSize: "32px",
  lineHeight: 0.96,
};

const desktopProgressBoxStyle: CSSProperties = {
  ...progressBoxStyle,
};

const desktopLastChapterBoxStyle: CSSProperties = {
  ...lastChapterBoxStyle,
};

const desktopPrimaryActionsGridStyle: CSSProperties = {
  ...primaryActionsGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "9px",
};

const desktopPrimaryActionsWithFileGridStyle: CSSProperties = {
  ...primaryActionsWithFileGridStyle,
  gap: "8px",
};

const desktopSecondaryActionsGridStyle: CSSProperties = {
  ...secondaryActionsGridStyle,
  gap: "8px",
};