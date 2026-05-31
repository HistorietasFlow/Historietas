"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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

type ObraSupabaseRow = {
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

type CapituloSupabaseRow = {
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

type RegistroObraId = {
  obra_id?: unknown;
};

type RegistroCapituloId = {
  capitulo_id?: unknown;
};

type RegistroComentarioCapitulo = {
  capitulo_id?: unknown;
  comentario?: unknown;
};

type RegistroProgressoLeitura = {
  capitulo_id?: unknown;
  lido?: unknown;
  progresso?: unknown;
};

type TamanhoFonte = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

type PreferenciasLeitura = {
  tamanhoFonte: TamanhoFonte;
  modoFoco: boolean;
  mostrarLinhaProgresso: boolean;
};

const FONT_SCALE_VALUES: TamanhoFonte[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const STORAGE_KEY = "historietas-obras";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const NOTIFICATIONS_STORAGE_KEY = "historietas-notificacoes";
const VIEWED_WORKS_STORAGE_KEY = "historietas-obras-visualizacoes";
const READER_PREFERENCES_STORAGE_KEY = "historietas-preferencias-leitura";

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

function normalizarCapitulo(
  capitulo: Partial<CapituloLocal>,
  index: number
): CapituloLocal {
  return {
    id:
      typeof capitulo.id === "string" && capitulo.id.trim()
        ? capitulo.id
        : `capitulo-${index + 1}`,
    titulo: capitulo.titulo || `Capítulo ${index + 1}`,
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

function marcarNotificacaoCapituloComoLida(obraId: string, capituloId: string) {
  try {
    const notificacoesTexto = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const notificacoesJson = notificacoesTexto
      ? JSON.parse(notificacoesTexto)
      : [];

    if (!Array.isArray(notificacoesJson)) {
      return;
    }

    const novasNotificacoes = notificacoesJson.map((notificacao) => {
      if (!notificacao || typeof notificacao !== "object") {
        return notificacao;
      }

      const notificacaoComObra = notificacao as {
        obraId?: unknown;
        capituloId?: unknown;
        lida?: unknown;
      };

      if (
        notificacaoComObra.obraId === obraId &&
        notificacaoComObra.capituloId === capituloId
      ) {
        return {
          ...notificacao,
          lida: true,
        };
      }

      return notificacao;
    });

    localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(novasNotificacoes)
    );
  } catch {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([]));
  }
}

function formatarData(dataIso: string) {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return "Data não informada";
  }

  return data.toLocaleDateString("pt-BR");
}

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}

function contarPalavras(texto: string) {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

function calcularTempoLeitura(texto: string) {
  const palavras = contarPalavras(texto);

  if (palavras <= 0) {
    return 0;
  }

  return Math.max(1, Math.ceil(palavras / 220));
}

function normalizarTamanhoFonte(valor: unknown): TamanhoFonte {
  const numero = Number(valor);

  if (FONT_SCALE_VALUES.includes(numero as TamanhoFonte)) {
    return numero as TamanhoFonte;
  }

  return 5;
}

function carregarPreferenciasLeitura(): PreferenciasLeitura {
  if (typeof window === "undefined") {
    return {
      tamanhoFonte: 5,
      modoFoco: false,
      mostrarLinhaProgresso: false,
    };
  }

  try {
    const preferenciasTexto = localStorage.getItem(READER_PREFERENCES_STORAGE_KEY);
    const preferenciasJson: unknown = preferenciasTexto
      ? JSON.parse(preferenciasTexto)
      : null;

    if (
      !preferenciasJson ||
      typeof preferenciasJson !== "object" ||
      Array.isArray(preferenciasJson)
    ) {
      return {
        tamanhoFonte: 5,
        modoFoco: false,
        mostrarLinhaProgresso: false,
      };
    }

    const preferencias = preferenciasJson as Partial<PreferenciasLeitura>;

    return {
      tamanhoFonte: normalizarTamanhoFonte(preferencias.tamanhoFonte),
      modoFoco: Boolean(preferencias.modoFoco),
      mostrarLinhaProgresso: Boolean(preferencias.mostrarLinhaProgresso),
    };
  } catch {
    return {
      tamanhoFonte: 5,
      modoFoco: false,
      mostrarLinhaProgresso: false,
    };
  }
}

function salvarPreferenciasLeitura(preferencias: PreferenciasLeitura) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      READER_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferencias)
    );
  } catch {
    // Preferências de leitura são um conforto extra. Não devem travar a leitura.
  }
}

function criarTextoLeituraStyle(tamanhoFonte: TamanhoFonte): CSSProperties {
  const fontSize = 12 + tamanhoFonte;
  const lineHeight = tamanhoFonte <= 3 ? 1.78 : tamanhoFonte <= 7 ? 1.9 : 1.98;

  return {
    ...chapterTextStyle,
    fontSize: `${fontSize}px`,
    lineHeight,
  };
}

function criarTextoLeituraDesktopStyle(tamanhoFonte: TamanhoFonte): CSSProperties {
  const fontSize = 14 + tamanhoFonte;
  const lineHeight = tamanhoFonte <= 3 ? 1.82 : tamanhoFonte <= 7 ? 1.94 : 2.02;

  return {
    ...desktopChapterTextStyle,
    fontSize: `${fontSize}px`,
    lineHeight,
  };
}

function normalizarListaIds(valor: unknown): string[] {
  return Array.isArray(valor)
    ? valor.filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
    : [];
}

function carregarListaIdsStorage(chave: string): string[] {
  try {
    const listaTexto = localStorage.getItem(chave);
    const listaJson: unknown = listaTexto ? JSON.parse(listaTexto) : [];
    const listaNormalizada = normalizarListaIds(listaJson);

    localStorage.setItem(chave, JSON.stringify(listaNormalizada));

    return listaNormalizada;
  } catch {
    localStorage.setItem(chave, JSON.stringify([]));
    return [];
  }
}

function obterNumeroSeguro(valor: unknown, fallback = 0) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return valor;
  }

  if (typeof valor === "string") {
    const numero = Number(valor);

    return Number.isFinite(numero) ? numero : fallback;
  }

  return fallback;
}

function idObraSupabaseValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id
  );
}

function incrementarVisualizacaoObraLocal(obra: Pick<ObraLocal, "id" | "slug" | "titulo">) {
  try {
    const chaveObra = obra.id || obra.slug || normalizarTexto(obra.titulo);

    if (!chaveObra) {
      return;
    }

    const visualizacoesTexto = localStorage.getItem(VIEWED_WORKS_STORAGE_KEY);
    const visualizacoesJson: unknown = visualizacoesTexto
      ? JSON.parse(visualizacoesTexto)
      : {};
    const visualizacoesPorObra =
      visualizacoesJson &&
      typeof visualizacoesJson === "object" &&
      !Array.isArray(visualizacoesJson)
        ? (visualizacoesJson as Record<string, unknown>)
        : {};
    const visualizacoesAtuais = obterNumeroSeguro(visualizacoesPorObra[chaveObra], 0);

    localStorage.setItem(
      VIEWED_WORKS_STORAGE_KEY,
      JSON.stringify({
        ...visualizacoesPorObra,
        [chaveObra]: visualizacoesAtuais + 1,
      })
    );
  } catch {
    // Visualização local é fallback e não deve travar a leitura.
  }
}

async function incrementarVisualizacaoObraSupabase(obraId: string) {
  if (!idObraSupabaseValido(obraId)) {
    return;
  }

  try {
    const { error: erroRpc } = await supabase.rpc(
      "incrementar_visualizacao_obra",
      { obra_id_param: obraId }
    );

    if (!erroRpc) {
      return;
    }

    const { data: obraAtual } = await supabase
      .from("obras")
      .select("visualizacoes")
      .eq("id", obraId)
      .maybeSingle();

    const visualizacoesAtuais = obterNumeroSeguro(
      (obraAtual as { visualizacoes?: unknown } | null)?.visualizacoes,
      0
    );

    await supabase
      .from("obras")
      .update({ visualizacoes: visualizacoesAtuais + 1 })
      .eq("id", obraId);
  } catch {
    // A leitura continua mesmo se a contagem remota falhar.
  }
}

function obterCategoriaArquivoSupabase(
  categoria: string | null | undefined
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

function criarArquivoObraDeSupabase(
  obra: ObraSupabaseRow,
  arquivoLocal?: ArquivoObraLocal | null
): ArquivoObraLocal | null {
  const conteudo = obra.arquivo_url?.trim() || arquivoLocal?.conteudo || "";
  const nome = obra.arquivo_nome?.trim() || arquivoLocal?.nome || "";

  if (!conteudo || !nome) {
    return arquivoLocal || null;
  }

  return {
    nome,
    tipo: obra.arquivo_tipo || arquivoLocal?.tipo || "",
    tamanho:
      typeof obra.arquivo_tamanho === "number" &&
      Number.isFinite(obra.arquivo_tamanho)
        ? obra.arquivo_tamanho
        : arquivoLocal?.tamanho || 0,
    conteudo,
    categoria: obterCategoriaArquivoSupabase(
      obra.arquivo_categoria || arquivoLocal?.categoria || "outro"
    ),
    criadoEm: obra.criada_em || arquivoLocal?.criadoEm || "",
  };
}

function mesclarCapituloSupabaseComLocal(
  capitulo: CapituloSupabaseRow,
  index: number,
  capituloLocal?: CapituloLocal
): CapituloLocal {
  return {
    id: capitulo.id,
    titulo:
      capitulo.titulo?.trim() ||
      capituloLocal?.titulo ||
      `Capítulo ${index + 1}`,
    texto:
      typeof capitulo.texto === "string" && capitulo.texto.trim()
        ? capitulo.texto
        : capituloLocal?.texto || "",
    curtiu: Boolean(capituloLocal?.curtiu),
    salvo: Boolean(capituloLocal?.salvo),
    comentario: capituloLocal?.comentario || "",
    criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
    lido: Boolean(capituloLocal?.lido),
    lidoEm: capituloLocal?.lidoEm || "",
  };
}

function mesclarObraSupabaseComLocal(
  obraSupabase: ObraSupabaseRow,
  capitulosSupabase: CapituloSupabaseRow[],
  obraLocal?: ObraLocal | null
): ObraLocal {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo])
  );

  const capitulosRemotos = capitulosSupabase.map((capitulo, index) =>
    mesclarCapituloSupabaseComLocal(
      capitulo,
      index,
      capitulosLocaisPorId.get(capitulo.id)
    )
  );

  const idsCapitulosRemotos = new Set(
    capitulosRemotos.map((capitulo) => capitulo.id)
  );
  const capitulosApenasLocais = (obraLocal?.capitulos || []).filter(
    (capitulo) => !idsCapitulosRemotos.has(capitulo.id)
  );
  const capitulosMesclados = [...capitulosRemotos, ...capitulosApenasLocais];
  const tagsSupabase = Array.isArray(obraSupabase.tags)
    ? obraSupabase.tags.filter(
        (tag): tag is string => typeof tag === "string" && Boolean(tag.trim())
      )
    : [];
  const tituloObra =
    obraSupabase.titulo?.trim() || obraLocal?.titulo || "Obra sem título";
  const slug =
    obraSupabase.slug?.trim() || obraLocal?.slug || criarSlugBase(tituloObra);

  const obraMesclada: ObraLocal = {
    id: obraSupabase.id,
    titulo: tituloObra,
    autor:
      obraSupabase.autor?.trim() || obraLocal?.autor || "Autor não informado",
    genero:
      obraSupabase.genero?.trim() || obraLocal?.genero || "Não informado",
    formato:
      obraSupabase.formato?.trim() || obraLocal?.formato || "Não informado",
    classificacaoIndicativa:
      obraSupabase.classificacao_indicativa?.trim() ||
      obraLocal?.classificacaoIndicativa ||
      "Não informada",
    sinopse:
      obraSupabase.sinopse?.trim() ||
      obraLocal?.sinopse ||
      "Nenhuma sinopse informada.",
    tags:
      tagsSupabase.length > 0
        ? tagsSupabase
        : obraLocal?.tags && obraLocal.tags.length > 0
        ? obraLocal.tags
        : ["sem tags"],
    capa: obraSupabase.capa_url?.trim() || obraLocal?.capa || "",
    capaNome: obraSupabase.capa_nome?.trim() || obraLocal?.capaNome || "",
    arquivoObra: criarArquivoObraDeSupabase(
      obraSupabase,
      obraLocal?.arquivoObra || null
    ),
    publicado: Boolean(obraSupabase.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obraSupabase.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    slug,
    link: obraSupabase.link?.trim() || obraLocal?.link || `/obra/${slug}`,
  };

  return normalizarObra(obraMesclada, 0);
}

function carregarObrasLocaisNormalizadas() {
  const obrasSalvasTexto = localStorage.getItem(STORAGE_KEY);
  const obrasSalvasJson: unknown = obrasSalvasTexto
    ? JSON.parse(obrasSalvasTexto)
    : [];

  const obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
    ? obrasSalvasJson.map((obra, index) =>
        normalizarObra(obra as Partial<ObraLocal>, index)
      )
    : [];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasNormalizadas));

  return obrasNormalizadas;
}

async function carregarObraSupabase(
  obraId: string,
  obraLocal?: ObraLocal | null
) {
  const { data: obraSupabase, error: erroObra } = await supabase
    .from("obras")
    .select("*")
    .eq("id", obraId)
    .maybeSingle();

  if (erroObra || !obraSupabase) {
    return null;
  }

  const { data: capitulosSupabase, error: erroCapitulos } = await supabase
    .from("capitulos")
    .select("*")
    .eq("obra_id", obraId)
    .order("ordem", { ascending: true });

  return mesclarObraSupabaseComLocal(
    obraSupabase as ObraSupabaseRow,
    erroCapitulos ? [] : ((capitulosSupabase || []) as CapituloSupabaseRow[]),
    obraLocal
  );
}

async function carregarIdsTabelaUsuario(
  tabela: "favoritos" | "concluidas",
  userId: string
) {
  const { data, error } = await supabase
    .from(tabela)
    .select("obra_id")
    .eq("user_id", userId);

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data
    .map((item) => {
      const registro = item as RegistroObraId;
      return typeof registro.obra_id === "string" ? registro.obra_id : "";
    })
    .filter(Boolean);
}

async function aplicarInteracoesCapitulosSupabase(
  obra: ObraLocal,
  userId: string
): Promise<ObraLocal> {
  const capituloIds = obra.capitulos.map((capitulo) => capitulo.id).filter(Boolean);

  if (capituloIds.length === 0) {
    return obra;
  }

  const [curtidasResposta, salvosResposta, comentariosResposta, progressoResposta] =
    await Promise.all([
      supabase
        .from("curtidas_capitulos")
        .select("capitulo_id")
        .eq("user_id", userId)
        .in("capitulo_id", capituloIds),
      supabase
        .from("salvos_capitulos")
        .select("capitulo_id")
        .eq("user_id", userId)
        .in("capitulo_id", capituloIds),
      supabase
        .from("comentarios_capitulos")
        .select("capitulo_id, comentario")
        .eq("user_id", userId)
        .in("capitulo_id", capituloIds),
      supabase
        .from("progresso_leitura")
        .select("capitulo_id, lido, progresso")
        .eq("user_id", userId)
        .eq("obra_id", obra.id),
    ]);

  const curtidas = new Set(
    Array.isArray(curtidasResposta.data)
      ? curtidasResposta.data
          .map((item: unknown) => (item as RegistroCapituloId).capitulo_id)
          .filter((id: unknown): id is string => typeof id === "string")
      : []
  );
  const salvos = new Set(
    Array.isArray(salvosResposta.data)
      ? salvosResposta.data
          .map((item: unknown) => (item as RegistroCapituloId).capitulo_id)
          .filter((id: unknown): id is string => typeof id === "string")
      : []
  );
  const comentarios = new Map<string, string>();

  if (Array.isArray(comentariosResposta.data)) {
    comentariosResposta.data.forEach((item: unknown) => {
      const registro = item as RegistroComentarioCapitulo;

      if (
        typeof registro.capitulo_id === "string" &&
        typeof registro.comentario === "string"
      ) {
        comentarios.set(registro.capitulo_id, registro.comentario);
      }
    });
  }

  const progressoRegistros = Array.isArray(progressoResposta.data)
    ? (progressoResposta.data as RegistroProgressoLeitura[])
    : [];
  const progressoAtual = progressoRegistros[0] || null;
  const capituloProgressoId =
    typeof progressoAtual?.capitulo_id === "string"
      ? progressoAtual.capitulo_id
      : "";
  const capituloProgressoLido = Boolean(progressoAtual?.lido);

  const capitulos = obra.capitulos.map((capitulo) => ({
    ...capitulo,
    curtiu: capitulo.curtiu || curtidas.has(capitulo.id),
    salvo: capitulo.salvo || salvos.has(capitulo.id),
    comentario: comentarios.has(capitulo.id)
      ? comentarios.get(capitulo.id) || ""
      : capitulo.comentario,
    lido:
      capitulo.lido ||
      (capituloProgressoId === capitulo.id && capituloProgressoLido),
  }));

  return {
    ...obra,
    capitulos,
    ultimoCapituloLidoId: obra.ultimoCapituloLidoId || capituloProgressoId,
    progressoLeitura: calcularProgressoLeitura(capitulos),
  };
}

async function salvarProgressoLeituraSupabase(
  obra: ObraLocal,
  capituloId: string,
  lido: boolean
) {
  try {
    const { data: dadosUsuario } = await supabase.auth.getUser();

    if (!dadosUsuario.user) {
      return;
    }

    await supabase.from("progresso_leitura").upsert(
      {
        user_id: dadosUsuario.user.id,
        obra_id: obra.id,
        capitulo_id: capituloId,
        progresso: calcularProgressoLeitura(obra.capitulos),
        lido,
        atualizado_em: new Date().toISOString(),
      },
      {
        onConflict: "user_id,obra_id",
      }
    );
  } catch {
    // Mantém localStorage como fallback.
  }
}

async function salvarRegistroCapituloSupabase(
  tabela: "curtidas_capitulos" | "salvos_capitulos",
  capituloId: string,
  ativo: boolean
) {
  try {
    const { data: dadosUsuario } = await supabase.auth.getUser();

    if (!dadosUsuario.user) {
      return;
    }

    if (!ativo) {
      await supabase
        .from(tabela)
        .delete()
        .eq("user_id", dadosUsuario.user.id)
        .eq("capitulo_id", capituloId);
      return;
    }

    await supabase.from(tabela).upsert(
      {
        user_id: dadosUsuario.user.id,
        capitulo_id: capituloId,
      },
      {
        onConflict: "user_id,capitulo_id",
      }
    );
  } catch {
    // Mantém localStorage como fallback.
  }
}

async function salvarComentarioCapituloSupabase(
  capituloId: string,
  comentario: string
) {
  try {
    const { data: dadosUsuario } = await supabase.auth.getUser();

    if (!dadosUsuario.user) {
      return;
    }

    if (!comentario.trim()) {
      await supabase
        .from("comentarios_capitulos")
        .delete()
        .eq("user_id", dadosUsuario.user.id)
        .eq("capitulo_id", capituloId);
      return;
    }

    await supabase.from("comentarios_capitulos").upsert(
      {
        user_id: dadosUsuario.user.id,
        capitulo_id: capituloId,
        comentario: comentario.trim(),
        atualizado_em: new Date().toISOString(),
      },
      {
        onConflict: "user_id,capitulo_id",
      }
    );
  } catch {
    // Mantém localStorage como fallback.
  }
}

async function salvarRegistroObraSupabase(
  tabela: "favoritos" | "concluidas",
  obraId: string,
  ativo: boolean
) {
  try {
    const { data: dadosUsuario } = await supabase.auth.getUser();

    if (!dadosUsuario.user) {
      return;
    }

    if (!ativo) {
      await supabase
        .from(tabela)
        .delete()
        .eq("user_id", dadosUsuario.user.id)
        .eq("obra_id", obraId);
      return;
    }

    await supabase.from(tabela).upsert(
      {
        user_id: dadosUsuario.user.id,
        obra_id: obraId,
      },
      {
        onConflict: "user_id,obra_id",
      }
    );
  } catch {
    // Mantém localStorage como fallback.
  }
}

export default function LerCapituloPage() {
  const [obraId, setObraId] = useState("");
  const [capituloId, setCapituloId] = useState("");
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [comentarioDigitado, setComentarioDigitado] = useState("");
  const [comentarioStatus, setComentarioStatus] = useState("");
  const [tamanhoFonte, setTamanhoFonte] = useState<TamanhoFonte>(5);
  const [modoFoco, setModoFoco] = useState(false);
  const [mostrarAjustes, setMostrarAjustes] = useState(false);
  const [mostrarLinhaProgresso, setMostrarLinhaProgresso] = useState(false);
  const [mostrarComentario, setMostrarComentario] = useState(false);
  const [progressoRolagem, setProgressoRolagem] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [preferenciasCarregadas, setPreferenciasCarregadas] = useState(false);
  const { temaVisual, pageThemeStyle, aplicarTemaVisual } = useHistorietasTheme(pageStyle);
  const visualizacaoObraRegistradaRef = useRef("");

  useEffect(() => {
    const preferencias = carregarPreferenciasLeitura();

    setTamanhoFonte(preferencias.tamanhoFonte);
    setModoFoco(preferencias.modoFoco);
    setMostrarLinhaProgresso(preferencias.mostrarLinhaProgresso);
    setPreferenciasCarregadas(true);
  }, []);

  useEffect(() => {
    if (!preferenciasCarregadas) {
      return;
    }

    salvarPreferenciasLeitura({
      tamanhoFonte,
      modoFoco,
      mostrarLinhaProgresso,
    });
  }, [preferenciasCarregadas, tamanhoFonte, modoFoco, mostrarLinhaProgresso]);

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
    document.body.dataset.historietasReaderFocus = modoFoco ? "true" : "false";

    if (modoFoco) {
      aplicarTemaVisual("foco");
    } else {
      aplicarTemaVisual(temaVisual);
    }

    return () => {
      delete document.body.dataset.historietasReaderFocus;
      aplicarTemaVisual(temaVisual);
    };
  }, [modoFoco, temaVisual]);

  useEffect(() => {
    let cancelado = false;

    async function carregarDados() {
      const params = new URLSearchParams(window.location.search);
      const obraIdParam = params.get("obraId") || "";
      const capituloIdParam = params.get("capituloId") || "";

      setObraId(obraIdParam);
      setCapituloId(capituloIdParam);

      try {
        const obrasLocais = carregarObrasLocaisNormalizadas();
        let obrasAtualizadas = obrasLocais;
        let obrasFavoritasNormalizadas = carregarListaIdsStorage(
          FAVORITES_STORAGE_KEY
        );
        let obrasConcluidasNormalizadas = carregarListaIdsStorage(
          COMPLETED_STORAGE_KEY
        );

        if (obraIdParam) {
          const obraLocal =
            obrasLocais.find((obra) => obra.id === obraIdParam) || null;
          const obraSupabase = await carregarObraSupabase(
            obraIdParam,
            obraLocal
          );

          if (obraSupabase) {
            obrasAtualizadas = [
              obraSupabase,
              ...obrasLocais.filter((obra) => obra.id !== obraSupabase.id),
            ];
          }
        }

        const { data: dadosUsuario } = await supabase.auth.getUser();

        if (dadosUsuario.user) {
          const [favoritasSupabase, concluidasSupabase] = await Promise.all([
            carregarIdsTabelaUsuario("favoritos", dadosUsuario.user.id),
            carregarIdsTabelaUsuario("concluidas", dadosUsuario.user.id),
          ]);

          obrasFavoritasNormalizadas = Array.from(
            new Set([...obrasFavoritasNormalizadas, ...favoritasSupabase])
          );
          obrasConcluidasNormalizadas = Array.from(
            new Set([...obrasConcluidasNormalizadas, ...concluidasSupabase])
          );

          const obraParaInteracoes = obrasAtualizadas.find(
            (obra) => obra.id === obraIdParam
          );

          if (obraParaInteracoes) {
            const obraComInteracoes = await aplicarInteracoesCapitulosSupabase(
              obraParaInteracoes,
              dadosUsuario.user.id
            );

            obrasAtualizadas = [
              obraComInteracoes,
              ...obrasAtualizadas.filter(
                (obra) => obra.id !== obraComInteracoes.id
              ),
            ];
          }
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasAtualizadas));
        localStorage.setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify(obrasFavoritasNormalizadas)
        );
        localStorage.setItem(
          COMPLETED_STORAGE_KEY,
          JSON.stringify(obrasConcluidasNormalizadas)
        );

        if (!cancelado) {
          setObras(obrasAtualizadas);
          setObrasFavoritas(obrasFavoritasNormalizadas);
          setObrasConcluidas(obrasConcluidasNormalizadas);
        }
      } catch {
        if (!cancelado) {
          setObras([]);
          setObrasFavoritas([]);
          setObrasConcluidas([]);
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    carregarDados();

    return () => {
      cancelado = true;
    };
  }, []);

  const obraAtual = useMemo(() => {
    return obras.find((obra) => obra.id === obraId) || null;
  }, [obras, obraId]);

  const capituloAtual = useMemo(() => {
    return (
      obraAtual?.capitulos.find((capitulo) => capitulo.id === capituloId) ||
      null
    );
  }, [obraAtual, capituloId]);

  const indiceCapitulo = useMemo(() => {
    if (!obraAtual || !capituloAtual) {
      return -1;
    }

    return obraAtual.capitulos.findIndex(
      (capitulo) => capitulo.id === capituloAtual.id
    );
  }, [obraAtual, capituloAtual]);

  const numeroCapitulo = indiceCapitulo >= 0 ? indiceCapitulo + 1 : 1;

  const capituloAnterior = useMemo(() => {
    if (!obraAtual || indiceCapitulo <= 0) {
      return null;
    }

    return obraAtual.capitulos[indiceCapitulo - 1];
  }, [obraAtual, indiceCapitulo]);

  const proximoCapitulo = useMemo(() => {
    if (!obraAtual || indiceCapitulo < 0) {
      return null;
    }

    return obraAtual.capitulos[indiceCapitulo + 1] || null;
  }, [obraAtual, indiceCapitulo]);

  const obraFavorita = obraAtual ? obrasFavoritas.includes(obraAtual.id) : false;
  const obraConcluida = obraAtual
    ? obrasConcluidas.includes(obraAtual.id)
    : false;
  const totalPalavras = capituloAtual ? contarPalavras(capituloAtual.texto) : 0;
  const tempoLeitura = capituloAtual ? calcularTempoLeitura(capituloAtual.texto) : 0;
  const progressoLeitura = obraAtual
    ? calcularProgressoLeitura(obraAtual.capitulos)
    : 0;

  useEffect(() => {
    if (!obraAtual) {
      return;
    }

    const chaveVisualizacao =
      obraAtual.id || obraAtual.slug || normalizarTexto(obraAtual.titulo);

    if (!chaveVisualizacao || visualizacaoObraRegistradaRef.current === chaveVisualizacao) {
      return;
    }

    visualizacaoObraRegistradaRef.current = chaveVisualizacao;
    incrementarVisualizacaoObraLocal(obraAtual);
    void incrementarVisualizacaoObraSupabase(obraAtual.id);
  }, [obraAtual?.id, obraAtual?.slug, obraAtual?.titulo]);

  useEffect(() => {
    setComentarioDigitado(capituloAtual?.comentario || "");
    setComentarioStatus("");
    setMostrarComentario(Boolean(capituloAtual?.comentario.trim()));
  }, [capituloAtual?.id]);

  useEffect(() => {
    function atualizarProgressoRolagem() {
      const alturaTotal = document.documentElement.scrollHeight - window.innerHeight;

      if (alturaTotal <= 0) {
        setProgressoRolagem(0);
        return;
      }

      const progressoAtual = Math.round((window.scrollY / alturaTotal) * 100);
      setProgressoRolagem(Math.min(100, Math.max(0, progressoAtual)));
    }

    atualizarProgressoRolagem();

    window.addEventListener("scroll", atualizarProgressoRolagem);
    window.addEventListener("resize", atualizarProgressoRolagem);

    return () => {
      window.removeEventListener("scroll", atualizarProgressoRolagem);
      window.removeEventListener("resize", atualizarProgressoRolagem);
    };
  }, [capituloAtual?.id]);

  useEffect(() => {
    if (!obraAtual || !capituloAtual) {
      return;
    }

    const agora = new Date().toISOString();
    let obraAtualizadaParaSupabase: ObraLocal | null = null;

    const novasObras = obras.map((obra, obraIndex) => {
      const obraNormalizada = normalizarObra(obra, obraIndex);

      if (obraNormalizada.id !== obraAtual.id) {
        return obraNormalizada;
      }

      const capitulosAtualizados = obraNormalizada.capitulos.map((capitulo) => {
        if (capitulo.id !== capituloAtual.id) {
          return capitulo;
        }

        return {
          ...capitulo,
          lido: true,
          lidoEm: capitulo.lidoEm || agora,
        };
      });

      obraAtualizadaParaSupabase = {
        ...obraNormalizada,
        capitulos: capitulosAtualizados,
        ultimoCapituloLidoId: capituloAtual.id,
        ultimaLeituraEm: agora,
        progressoLeitura: calcularProgressoLeitura(capitulosAtualizados),
      };

      return obraAtualizadaParaSupabase;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(novasObras));
    marcarNotificacaoCapituloComoLida(obraAtual.id, capituloAtual.id);
    setObras(novasObras);

    if (obraAtualizadaParaSupabase) {
      void salvarProgressoLeituraSupabase(
        obraAtualizadaParaSupabase,
        capituloAtual.id,
        true
      );
    }
  }, [obraAtual?.id, capituloAtual?.id]);

  function salvarObras(novasObras: ObraLocal[]) {
    const obrasNormalizadas = novasObras.map((obra, index) =>
      normalizarObra(obra, index)
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasNormalizadas));
    setObras(obrasNormalizadas);
  }

  function atualizarCapitulo(dados: Partial<CapituloLocal>) {
    if (!obraAtual || !capituloAtual) {
      return;
    }

    const novasObras = obras.map((obra, obraIndex) => {
      const obraNormalizada = normalizarObra(obra, obraIndex);

      if (obraNormalizada.id !== obraAtual.id) {
        return obraNormalizada;
      }

      const capitulosAtualizados = obraNormalizada.capitulos.map((capitulo) => {
        if (capitulo.id !== capituloAtual.id) {
          return capitulo;
        }

        return {
          ...capitulo,
          ...dados,
        };
      });

      return {
        ...obraNormalizada,
        capitulos: capitulosAtualizados,
        progressoLeitura: calcularProgressoLeitura(capitulosAtualizados),
      };
    });

    salvarObras(novasObras);
  }

  async function alternarCurtida() {
    if (!capituloAtual) {
      return;
    }

    const novoStatusCurtida = !capituloAtual.curtiu;

    atualizarCapitulo({
      curtiu: novoStatusCurtida,
    });

    await salvarRegistroCapituloSupabase(
      "curtidas_capitulos",
      capituloAtual.id,
      novoStatusCurtida
    );
  }

  async function alternarSalvo() {
    if (!capituloAtual) {
      return;
    }

    const novoStatusSalvo = !capituloAtual.salvo;

    atualizarCapitulo({
      salvo: novoStatusSalvo,
    });

    await salvarRegistroCapituloSupabase(
      "salvos_capitulos",
      capituloAtual.id,
      novoStatusSalvo
    );
  }

  async function alternarLidoManual() {
    if (!obraAtual || !capituloAtual) {
      return;
    }

    const novoStatusLido = !capituloAtual.lido;
    const capitulosAtualizados = obraAtual.capitulos.map((capitulo) => {
      if (capitulo.id !== capituloAtual.id) {
        return capitulo;
      }

      return {
        ...capitulo,
        lido: novoStatusLido,
        lidoEm: novoStatusLido ? new Date().toISOString() : "",
      };
    });
    const obraAtualizada = {
      ...obraAtual,
      capitulos: capitulosAtualizados,
      ultimoCapituloLidoId: novoStatusLido
        ? capituloAtual.id
        : obraAtual.ultimoCapituloLidoId,
      ultimaLeituraEm: novoStatusLido
        ? new Date().toISOString()
        : obraAtual.ultimaLeituraEm,
      progressoLeitura: calcularProgressoLeitura(capitulosAtualizados),
    };

    atualizarCapitulo({
      lido: novoStatusLido,
      lidoEm: novoStatusLido ? new Date().toISOString() : "",
    });

    await salvarProgressoLeituraSupabase(
      obraAtualizada,
      capituloAtual.id,
      novoStatusLido
    );
  }

  async function alternarFavorito() {
    if (!obraAtual) {
      return;
    }

    const novoStatusFavorito = !obraFavorita;
    const novasObrasFavoritas = obraFavorita
      ? obrasFavoritas.filter((id) => id !== obraAtual.id)
      : [...obrasFavoritas, obraAtual.id];

    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(novasObrasFavoritas)
    );

    setObrasFavoritas(novasObrasFavoritas);
    await salvarRegistroObraSupabase("favoritos", obraAtual.id, novoStatusFavorito);
  }

  async function alternarConcluido() {
    if (!obraAtual) {
      return;
    }

    const novoStatusConcluido = !obraConcluida;
    const novasObrasConcluidas = obraConcluida
      ? obrasConcluidas.filter((id) => id !== obraAtual.id)
      : [...obrasConcluidas, obraAtual.id];

    localStorage.setItem(
      COMPLETED_STORAGE_KEY,
      JSON.stringify(novasObrasConcluidas)
    );

    setObrasConcluidas(novasObrasConcluidas);
    await salvarRegistroObraSupabase("concluidas", obraAtual.id, novoStatusConcluido);
  }

  async function salvarComentario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const textoLimpo = comentarioDigitado.trim();

    atualizarCapitulo({
      comentario: textoLimpo,
    });

    if (capituloAtual) {
      await salvarComentarioCapituloSupabase(capituloAtual.id, textoLimpo);
    }

    setComentarioStatus(
      textoLimpo ? "Comentário salvo." : "Comentário removido."
    );
    setMostrarComentario(Boolean(textoLimpo));
  }

  async function apagarComentario() {
    if (!capituloAtual || !capituloAtual.comentario.trim()) {
      return;
    }

    const confirmar = window.confirm(
      "Tem certeza que deseja apagar seu comentário deste capítulo?"
    );

    if (!confirmar) {
      return;
    }

    atualizarCapitulo({
      comentario: "",
    });

    await salvarComentarioCapituloSupabase(capituloAtual.id, "");

    setComentarioDigitado("");
    setComentarioStatus("Comentário apagado.");
    setMostrarComentario(false);
  }

  function trocarCapitulo(novoCapituloId: string) {
    if (!obraAtual) {
      return;
    }

    setCapituloId(novoCapituloId);

    window.history.pushState(
      null,
      "",
      `/ler-capitulo?obraId=${obraAtual.id}&capituloId=${novoCapituloId}`
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  if (carregando) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${leitorPageCss}`}</style>
        <section style={isDesktop ? desktopContainerStyle : containerStyle} />
      </main>
    );
  }

  if (!obraAtual || !capituloAtual) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${leitorPageCss}`}</style>
        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <div style={emptyBoxStyle}>
            <h1 style={emptyTitleStyle}>Capítulo não encontrado</h1>

            <p style={emptyTextStyle}>
              Volte para a obra e clique novamente em Ler capítulo.
            </p>

            <Link href="/explorar" style={emptyButtonStyle}>
              Ir para Explorar
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const voltarHref = `/obra/${obraAtual.slug || criarSlugBase(obraAtual.titulo)}`;
  const editarHref = `/editar-capitulo?obraId=${obraAtual.id}&capituloId=${capituloAtual.id}`;
  const perfilAutorHref = `/perfil-autor?autor=${encodeURIComponent(obraAtual.autor)}`;
  const progressoCapitulo = Math.round(
    (numeroCapitulo / Math.max(obraAtual.capitulos.length, 1)) * 100
  );
  const statusLeituraTexto = capituloAtual.lido
    ? `Lido em ${formatarData(capituloAtual.lidoEm)}`
    : "Leitura em andamento";

  return (
    <main style={modoFoco ? focusPageStyle : pageThemeStyle}>
      {mostrarLinhaProgresso && (
        <div style={fixedReadingProgressOuterStyle}>
          <div
            style={{
              ...fixedReadingProgressInnerStyle,
              width: `${progressoRolagem}%`,
            }}
          />
        </div>
      )}

      <style>{`${historietasThemeCss}${leitorPageCss}`}</style>
      <style>{focusBottomNavigationCss}</style>

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTopStyle : topStyle}>
          <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
            <span style={logoMarkStyle}>H</span>
            <span className="historietas-theme-logo-text" style={logoTextStyle}>istorietas</span>
          </Link>

          <button
            type="button"
            onClick={() => setMostrarAjustes((valorAtual) => !valorAtual)}
            style={
              modoFoco
                ? isDesktop
                  ? desktopFocusSettingsButtonStyle
                  : focusTopSingleSettingsButtonStyle
                : isDesktop
                ? desktopSettingsButtonStyle
                : topSingleSettingsButtonStyle
            }
          >
            {mostrarAjustes ? "Fechar" : "Ajustes"}
          </button>
        </header>

        <section
          style={
            modoFoco
              ? isDesktop
                ? desktopFocusChapterHeaderStyle
                : focusChapterHeaderStyle
              : isDesktop
              ? desktopChapterHeaderStyle
              : chapterHeaderStyle
          }
        >
          <div style={chapterHeroTopStyle}>
            <span style={miniTitleStyle}>
              Capítulo {numeroCapitulo} de {obraAtual.capitulos.length}
            </span>

            <span style={readingProgressBadgeStyle}>
              {progressoCapitulo}% da obra
            </span>
          </div>

          <h1 className="historietas-theme-title" style={titleStyle}>{capituloAtual.titulo}</h1>

          <p style={metaStyle}>
            {obraAtual.titulo} • {tempoLeitura > 0 ? `${tempoLeitura} min` : "tempo não informado"} • {totalPalavras} palavras
          </p>

          <div style={statusRowStyle}>
            <span style={statusBadgeStyle}>{statusLeituraTexto}</span>

            <Link href={perfilAutorHref} style={statusLinkBadgeStyle}>
              Por {obraAtual.autor}
            </Link>
          </div>
        </section>

        {mostrarAjustes && (
          <section
            style={
              modoFoco
                ? isDesktop
                  ? desktopFocusSettingsPanelStyle
                  : focusSettingsPanelStyle
                : isDesktop
                ? desktopSettingsPanelStyle
                : settingsPanelStyle
            }
          >
            <div style={settingsHeaderStyle}>
              <h2 style={settingsTitleStyle}>Ajustes de leitura</h2>
            </div>

            <select
              value={capituloAtual.id}
              onChange={(event) => trocarCapitulo(event.target.value)}
              style={isDesktop ? desktopChapterSelectStyle : chapterSelectStyle}
            >
              {obraAtual.capitulos.map((capitulo, index) => (
                <option key={capitulo.id} value={capitulo.id}>
                  Capítulo {index + 1} - {capitulo.titulo}
                </option>
              ))}
            </select>

            <div style={modoFoco ? focusFontScaleBoxStyle : fontScaleBoxStyle}>
              <div style={fontScaleHeaderStyle}>
                <span style={fontScaleLabelStyle}>Tamanho da fonte</span>
                <span style={fontScaleValueStyle}>Fonte {tamanhoFonte}</span>
              </div>

              <div style={isDesktop ? desktopFontScaleGridStyle : fontScaleGridStyle}>
                {FONT_SCALE_VALUES.map((valorFonte) => (
                  <button
                    key={valorFonte}
                    type="button"
                    onClick={() => setTamanhoFonte(valorFonte)}
                    style={
                      tamanhoFonte === valorFonte
                        ? fontScaleButtonActiveStyle
                        : modoFoco
                        ? focusFontScaleButtonStyle
                        : fontScaleButtonStyle
                    }
                    aria-label={`Usar fonte ${valorFonte}`}
                  >
                    {valorFonte}
                  </button>
                ))}
              </div>
            </div>

            <div style={isDesktop ? desktopSettingsGridStyle : settingsGridStyle}>
              <button
                type="button"
                onClick={() => setModoFoco((valorAtual) => !valorAtual)}
                style={modoFoco ? focusActionActiveStyle : settingsActionStyle}
              >
                {modoFoco ? "Foco ativo" : "Modo foco"}
              </button>

              <button
                type="button"
                onClick={() => setMostrarLinhaProgresso((valorAtual) => !valorAtual)}
                style={
                  mostrarLinhaProgresso
                    ? settingsActionActiveStyle
                    : modoFoco
                    ? focusMutedSettingsActionStyle
                    : settingsActionStyle
                }
              >
                {mostrarLinhaProgresso ? "Barra ativa" : "Barra de progresso"}
              </button>

              <button
                type="button"
                onClick={alternarLidoManual}
                style={modoFoco ? focusMutedSettingsActionStyle : settingsActionStyle}
              >
                {capituloAtual.lido ? "Marcar não lido" : "Marcar lido"}
              </button>

              <Link href={editarHref} style={modoFoco ? focusSettingsLinkStyle : settingsLinkStyle}>
                Editar capítulo
              </Link>

              <button
                type="button"
                onClick={alternarFavorito}
                style={
                  obraFavorita
                    ? focusActionActiveStyle
                    : modoFoco
                    ? focusMutedSettingsActionStyle
                    : settingsActionStyle
                }
              >
                {obraFavorita ? "✓ Na lista" : "Adicionar à lista"}
              </button>

              <button
                type="button"
                onClick={alternarConcluido}
                style={
                  obraConcluida
                    ? settingsActionActiveStyle
                    : modoFoco
                    ? focusMutedSettingsActionStyle
                    : settingsActionStyle
                }
              >
                {obraConcluida ? "Concluída" : "Concluir"}
              </button>
            </div>
          </section>
        )}

        <article style={modoFoco ? (isDesktop ? desktopFocusTextCardStyle : focusTextCardStyle) : (isDesktop ? desktopTextCardStyle : textCardStyle)}>
          <p style={isDesktop ? criarTextoLeituraDesktopStyle(tamanhoFonte) : criarTextoLeituraStyle(tamanhoFonte)}>
            {capituloAtual.texto || "Este capítulo ainda não possui texto."}
          </p>
        </article>

        <section
          style={
            modoFoco
              ? isDesktop
                ? desktopFocusReaderActionsStyle
                : focusReaderActionsStyle
              : isDesktop
              ? desktopReaderActionsStyle
              : readerActionsStyle
          }
        >
          <button
            type="button"
            onClick={alternarCurtida}
            style={
              modoFoco
                ? capituloAtual.curtiu
                  ? focusActiveActionButtonStyle
                  : focusActionButtonStyle
                : capituloAtual.curtiu
                ? activeActionButtonStyle
                : actionButtonStyle
            }
          >
            {capituloAtual.curtiu ? "♥ Curtido" : "♡ Curtir"}
          </button>

          <button
            type="button"
            onClick={alternarSalvo}
            style={
              modoFoco
                ? capituloAtual.salvo
                  ? focusActiveSaveButtonStyle
                  : focusActionButtonStyle
                : capituloAtual.salvo
                ? activeSaveButtonStyle
                : actionButtonStyle
            }
          >
            {capituloAtual.salvo ? "✓ Salvo" : "Salvar capítulo"}
          </button>

          <button
            type="button"
            onClick={() => setMostrarComentario((valorAtual) => !valorAtual)}
            style={
              modoFoco
                ? mostrarComentario || capituloAtual.comentario.trim()
                  ? focusActiveCommentButtonStyle
                  : focusActionButtonStyle
                : mostrarComentario || capituloAtual.comentario.trim()
                ? activeCommentButtonStyle
                : actionButtonStyle
            }
          >
            {capituloAtual.comentario.trim() ? "💬 Comentado" : "Comentar"}
          </button>
        </section>

        {mostrarComentario && (
          <section
            style={
              modoFoco
                ? isDesktop
                  ? desktopFocusCommentBoxStyle
                  : focusCommentBoxStyle
                : isDesktop
                ? desktopCommentBoxStyle
                : commentBoxStyle
            }
          >
            <div style={commentHeaderStyle}>
              <h2 style={commentTitleStyle}>Comentário</h2>

              {capituloAtual.comentario.trim() && (
                <button
                  type="button"
                  onClick={apagarComentario}
                  style={deleteCommentButtonStyle}
                >
                  Apagar
                </button>
              )}
            </div>

            {comentarioStatus && (
              <p style={commentStatusStyle}>{comentarioStatus}</p>
            )}

            <form onSubmit={salvarComentario} style={commentFormStyle}>
              <textarea
                value={comentarioDigitado}
                onChange={(event) => setComentarioDigitado(event.target.value)}
                style={commentInputStyle}
                placeholder="Escreva um comentário curto sobre esse capítulo..."
              />

              <button type="submit" style={modoFoco ? focusCommentButtonStyle : commentButtonStyle}>
                {comentarioDigitado.trim() ? "Salvar comentário" : "Remover comentário"}
              </button>
            </form>
          </section>
        )}

        <section
          style={
            modoFoco
              ? isDesktop
                ? desktopFocusChapterNavigationStyle
                : focusChapterNavigationStyle
              : isDesktop
              ? desktopChapterNavigationStyle
              : chapterNavigationStyle
          }
        >
          {capituloAnterior ? (
            <button
              type="button"
              onClick={() => trocarCapitulo(capituloAnterior.id)}
              style={modoFoco ? focusChapterNavButtonStyle : chapterNavButtonStyle}
            >
              ← Capítulo anterior
            </button>
          ) : (
            <span style={modoFoco ? focusChapterNavDisabledStyle : chapterNavDisabledStyle}>← Sem anterior</span>
          )}

          {proximoCapitulo ? (
            <button
              type="button"
              onClick={() => trocarCapitulo(proximoCapitulo.id)}
              style={modoFoco ? focusChapterNavButtonPrimaryStyle : chapterNavButtonPrimaryStyle}
            >
              Próximo capítulo →
            </button>
          ) : (
            <Link href={voltarHref} style={modoFoco ? focusChapterNavButtonPrimaryStyle : chapterNavButtonPrimaryStyle}>
              Voltar para obra
            </Link>
          )}
        </section>
      </section>
    </main>
  );
}

const leitorPageCss = `
  html[data-historietas-tema-visual="branco"] button:disabled {
    opacity: 1 !important;
    background: #F1F3F4 !important;
    border-color: #DADCE0 !important;
    color: #5F6368 !important;
    cursor: not-allowed !important;
  }

  body[data-historietas-reader-focus="true"] {
    background: #050506 !important;
  }
`;

const focusBottomNavigationCss = `
  body[data-historietas-reader-focus="true"] {
    --historietas-accent: #A78BFA;
    --historietas-secondary: #7C3AED;
    --historietas-bg-start: #050506;
    --historietas-bg-mid: #030305;
    --historietas-bg-end: #020203;
    --historietas-glow-primary: rgba(124,58,237,0.08);
    --historietas-glow-secondary: rgba(255,255,255,0.045);
    --historietas-text-primary: #F4F4F5;
    --historietas-text-secondary: #D4D4D8;
    --historietas-surface: rgba(9,9,11,0.88);
    --historietas-surface-strong: rgba(3,3,6,0.96);
    --historietas-border-soft: rgba(255,255,255,0.075);
    --historietas-input-bg: #09090B;
    --historietas-input-text: #F4F4F5;
    --historietas-title-from: #FFFFFF;
    --historietas-title-mid: #E4E4E7;
    --historietas-title-to: #A78BFA;
    --historietas-secondary-surface: rgba(39,39,42,0.72);
    --historietas-secondary-button-text: #E4E4E7;
    --historietas-danger-surface: rgba(127,29,29,0.18);
    --historietas-danger-button-text: #FCA5A5;
    --historietas-logo-shadow: none;
    --historietas-card-shadow: none;
    --historietas-hero-shadow: none;
    --historietas-bottom-nav-bg: #050505;
    --historietas-bottom-nav-border: rgba(255,255,255,0.075);
    --historietas-bottom-nav-shadow: none;
    --historietas-bottom-nav-text: #D4D4D8;
    --historietas-bottom-nav-hover-bg: rgba(255,255,255,0.055);
    --historietas-bottom-nav-hover-text: #FFFFFF;
    --historietas-bottom-nav-icon-text: #A78BFA;
    --historietas-bottom-nav-icon-bg: rgba(255,255,255,0.045);
    --historietas-bottom-nav-icon-border: rgba(255,255,255,0.07);
    --historietas-bottom-nav-main-bg: linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%);
    --historietas-bottom-nav-main-border: rgba(167,139,250,0.34);
  }


  body[data-historietas-reader-focus="true"] article,
  body[data-historietas-reader-focus="true"] article p,
  body[data-historietas-reader-focus="true"] h1,
  body[data-historietas-reader-focus="true"] h2,
  body[data-historietas-reader-focus="true"] p {
    color: #F4F4F5 !important;
    -webkit-text-fill-color: #F4F4F5 !important;
    text-shadow: none !important;
  }

  body[data-historietas-reader-focus="true"] span,
  body[data-historietas-reader-focus="true"] label {
    color: #D4D4D8 !important;
    -webkit-text-fill-color: initial !important;
    text-shadow: none !important;
  }

  body[data-historietas-reader-focus="true"] .historietas-theme-logo-text,
  body[data-historietas-reader-focus="true"] .historietas-theme-title {
    background: none !important;
    color: #A78BFA !important;
    -webkit-text-fill-color: #A78BFA !important;
  }

  body[data-historietas-reader-focus="true"] nav,
  body[data-historietas-reader-focus="true"] [data-bottom-nav],
  body[data-historietas-reader-focus="true"] [data-mobile-nav],
  body[data-historietas-reader-focus="true"] nav[aria-label*="Navegação"],
  body[data-historietas-reader-focus="true"] nav[aria-label*="navegação"],
  body[data-historietas-reader-focus="true"] div:has(a[href="/publicar"]):has(a[href="/biblioteca"]) {
    background: #050505 !important;
    border-color: rgba(255,255,255,0.075) !important;
    box-shadow: none !important;
    color: #D4D4D8 !important;
  }

  body[data-historietas-reader-focus="true"] nav a,
  body[data-historietas-reader-focus="true"] [data-bottom-nav] a,
  body[data-historietas-reader-focus="true"] [data-mobile-nav] a,
  body[data-historietas-reader-focus="true"] nav button,
  body[data-historietas-reader-focus="true"] [data-bottom-nav] button,
  body[data-historietas-reader-focus="true"] [data-mobile-nav] button,
  body[data-historietas-reader-focus="true"] div:has(a[href="/publicar"]):has(a[href="/biblioteca"]) a,
  body[data-historietas-reader-focus="true"] div:has(a[href="/publicar"]):has(a[href="/biblioteca"]) button {
    color: #D4D4D8 !important;
    box-shadow: none !important;
  }

  body[data-historietas-reader-focus="true"] nav a[href="/publicar"],
  body[data-historietas-reader-focus="true"] [data-bottom-nav] a[href="/publicar"],
  body[data-historietas-reader-focus="true"] [data-mobile-nav] a[href="/publicar"],
  body[data-historietas-reader-focus="true"] div:has(a[href="/publicar"]):has(a[href="/biblioteca"]) a[href="/publicar"] {
    background: linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%) !important;
    border-color: rgba(167,139,250,0.34) !important;
    color: #FFFFFF !important;
  }

  body[data-historietas-reader-focus="true"] .historietas-bottom-nav-icon {
    background: rgba(255,255,255,0.045) !important;
    border-color: rgba(255,255,255,0.07) !important;
    color: #A78BFA !important;
  }
`;


const safeTextStyle: CSSProperties = {
  overflowWrap: "break-word",
  wordBreak: "normal",
};

const pageStyle: CSSProperties = {
  width: "100%",
  minHeight: "100svh",
  maxWidth: "100vw",
  overflowX: "hidden",
  background:
    "radial-gradient(circle at 18% 0%, var(--historietas-glow-primary, rgba(124,58,237,0.22)) 0%, transparent 32%), radial-gradient(circle at 82% 0%, var(--historietas-glow-secondary, rgba(249,115,22,0.14)) 0%, transparent 34%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 54%, var(--historietas-bg-end, #17101B) 100%)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  boxSizing: "border-box",
};

const focusPageStyle: CSSProperties = {
  ...pageStyle,
  background: "linear-gradient(180deg, #050506 0%, #030305 58%, #020203 100%)",
  color: "#F4F4F5",
};

const fixedReadingProgressOuterStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 50,
  height: "4px",
  background: "rgba(255,255,255,0.08)",
};

const fixedReadingProgressInnerStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  transition: "width 0.16s ease",
};

const containerStyle: CSSProperties = {
  width: "min(760px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "12px 0 calc(66px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "nowrap",
  marginBottom: "10px",
  minWidth: 0,
};

const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "23px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "calc(100% - 104px)",
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
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
  boxShadow: "none",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #F5F3FF) 0%, var(--historietas-title-mid, #F5F3FF) 44%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "var(--historietas-logo-shadow, 0 0 24px rgba(124,58,237,0.22))",
};

const topActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "6px",
  width: "100%",
  minWidth: 0,
};

const desktopTopActionsStyle: CSSProperties = {
  ...topActionsStyle,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  width: "auto",
  flex: "0 0 auto",
};

const topMiniButtonStyle: CSSProperties = {
  minHeight: "38px",
  padding: "0 13px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "1 1 112px",
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "center",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const backButtonStyle: CSSProperties = {
  minHeight: "38px",
  padding: "0 13px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.07))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "1 1 112px",
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "center",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const settingsButtonStyle: CSSProperties = {
  minHeight: "38px",
  padding: "0 13px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, var(--historietas-surface, transparent))",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 25%, var(--historietas-border-soft, transparent))",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  flex: "1 1 112px",
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "center",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const topSingleSettingsButtonStyle: CSSProperties = {
  ...settingsButtonStyle,
  flex: "0 0 auto",
  minWidth: "88px",
  maxWidth: "116px",
  minHeight: "34px",
  padding: "0 11px",
  fontSize: "11px",
};

const focusTopSingleSettingsButtonStyle: CSSProperties = {
  ...topSingleSettingsButtonStyle,
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#F4F4F5",
  boxShadow: "none",
};

const chapterHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  padding: "12px",
  borderRadius: "20px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(24,14,39,0.92)) 0%, var(--historietas-surface-strong, rgba(12,7,23,0.96)) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 12%, var(--historietas-border-soft, transparent))",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const focusChapterHeaderStyle: CSSProperties = {
  ...chapterHeaderStyle,
  background: "rgba(9,9,11,0.74)",
  border: "1px solid rgba(255,255,255,0.07)",
};

const miniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "9px",
  fontWeight: 950,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  textAlign: "center",
  ...safeTextStyle,
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(28px, 8vw, 42px)",
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  textAlign: "center",
  maxWidth: "100%",
  ...safeTextStyle,
};

const metaStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.35,
  fontWeight: 750,
  textAlign: "center",
  maxWidth: "100%",
  ...safeTextStyle,
};

const statusRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
};

const statusBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.07))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const statusLinkBadgeStyle: CSSProperties = {
  ...statusBadgeStyle,
  color: "var(--historietas-accent, #FDBA74)",
  textDecoration: "none",
};

const chapterHeroTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  flexWrap: "wrap",
  minWidth: 0,
  maxWidth: "100%",
};

const readingProgressBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent)",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  fontSize: "9px",
  fontWeight: 900,
  textAlign: "center",
  ...safeTextStyle,
};

const readingStatsStyle: CSSProperties = {
  marginTop: "10px",
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopReadingStatsStyle: CSSProperties = {
  ...readingStatsStyle,
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "10px",
  marginTop: "14px",
};

const readingStatCardStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  padding: "10px",
  borderRadius: "16px",
  background:
    "linear-gradient(135deg, var(--historietas-secondary-surface, rgba(255,255,255,0.058)) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 8%, var(--historietas-surface, transparent)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  boxShadow: "none",
  minWidth: 0,
  overflow: "hidden",
};

const readingStatNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "20px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

const readingStatLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  lineHeight: 1.2,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.055em",
  ...safeTextStyle,
};

const settingsPanelStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  marginTop: "10px",
  padding: "10px",
  borderRadius: "18px",
  background: "var(--historietas-surface, rgba(18,12,30,0.72))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.065))",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const focusSettingsPanelStyle: CSSProperties = {
  ...settingsPanelStyle,
  background: "rgba(9,9,11,0.78)",
  border: "1px solid rgba(255,255,255,0.07)",
};

const settingsHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "center",
};

const settingsTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  textAlign: "center",
  ...safeTextStyle,
};

const chapterSelectStyle: CSSProperties = {
  width: "100%",
  minHeight: "40px",
  borderRadius: "14px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-input-bg, #18181B)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 11px",
  outline: "none",
  fontSize: "12px",
  fontWeight: 850,
  fontFamily: "inherit",
  boxSizing: "border-box",
  textAlign: "center",
};

const fontScaleBoxStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  padding: "8px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.035)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.06))",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const focusFontScaleBoxStyle: CSSProperties = {
  ...fontScaleBoxStyle,
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.07)",
};

const fontScaleHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  minWidth: 0,
};

const fontScaleLabelStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #E4E4E7)",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const fontScaleValueStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  ...safeTextStyle,
};

const fontScaleGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "5px",
  minWidth: 0,
};

const desktopFontScaleGridStyle: CSSProperties = {
  ...fontScaleGridStyle,
  gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
};

const fontScaleButtonStyle: CSSProperties = {
  minHeight: "30px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "rgba(255,255,255,0.045)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxShadow: "none",
};

const focusFontScaleButtonStyle: CSSProperties = {
  ...fontScaleButtonStyle,
  background: "rgba(255,255,255,0.045)",
  color: "#D4D4D8",
};

const fontScaleButtonActiveStyle: CSSProperties = {
  ...fontScaleButtonStyle,
  background: "var(--historietas-accent, #F97316)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 38%, transparent)",
  color: "#FFFFFF",
};

const settingsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
};

const settingsActionStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "rgba(255,255,255,0.045)",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 8px",
  lineHeight: 1.05,
  boxShadow: "none",
  ...safeTextStyle,
};

const settingsActionActiveStyle: CSSProperties = {
  ...settingsActionStyle,
  background: "var(--historietas-accent, #F97316)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 38%, transparent)",
  color: "#FFFFFF",
};

const focusMutedSettingsActionStyle: CSSProperties = {
  ...settingsActionStyle,
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#D4D4D8",
};

const focusActionActiveStyle: CSSProperties = {
  ...settingsActionStyle,
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 34%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
};

const settingsLinkStyle: CSSProperties = {
  ...settingsActionStyle,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
};

const focusSettingsLinkStyle: CSSProperties = {
  ...settingsLinkStyle,
  background: "rgba(167,139,250,0.095)",
  border: "1px solid rgba(167,139,250,0.18)",
  color: "#DDD6FE",
};

const textCardStyle: CSSProperties = {
  marginTop: "10px",
  padding: "14px 12px",
  borderRadius: "18px",
  background: "var(--historietas-surface, rgba(18,12,30,0.54))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.055))",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const focusTextCardStyle: CSSProperties = {
  ...textCardStyle,
  background: "rgba(3,3,6,0.52)",
  border: "1px solid rgba(255,255,255,0.055)",
};

const chapterTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #F4F4F5)",
  fontSize: "17px",
  lineHeight: 1.9,
  fontWeight: 550,
  whiteSpace: "pre-wrap",
  overflowWrap: "break-word",
  wordBreak: "break-word",
  textAlign: "left",
};

const readerActionsStyle: CSSProperties = {
  marginTop: "10px",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const actionButtonStyle: CSSProperties = {
  minHeight: "38px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "rgba(255,255,255,0.045)",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  fontSize: "10.5px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 8px",
  lineHeight: 1.05,
  boxShadow: "none",
  ...safeTextStyle,
};

const activeActionButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 26%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
};

const activeSaveButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  background: "color-mix(in srgb, #22C55E 12%, transparent)",
  border: "1px solid color-mix(in srgb, #22C55E 24%, transparent)",
  color: "#86EFAC",
};

const activeCommentButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
};

const focusReaderActionsStyle: CSSProperties = {
  ...readerActionsStyle,
};

const focusActionButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#D4D4D8",
  boxShadow: "none",
};

const focusActiveActionButtonStyle: CSSProperties = {
  ...focusActionButtonStyle,
  background: "rgba(249,115,22,0.10)",
  border: "1px solid rgba(249,115,22,0.20)",
  color: "#FDBA74",
};

const focusActiveSaveButtonStyle: CSSProperties = {
  ...focusActionButtonStyle,
  background: "rgba(124,58,237,0.12)",
  border: "1px solid rgba(124,58,237,0.22)",
  color: "#C4B5FD",
};

const focusActiveCommentButtonStyle: CSSProperties = {
  ...focusActionButtonStyle,
  background: "rgba(34,197,94,0.08)",
  border: "1px solid rgba(34,197,94,0.18)",
  color: "#86EFAC",
};

const commentBoxStyle: CSSProperties = {
  marginTop: "10px",
  display: "grid",
  gap: "8px",
  padding: "10px",
  borderRadius: "18px",
  background: "var(--historietas-surface, rgba(18,12,30,0.66))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.06))",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const focusCommentBoxStyle: CSSProperties = {
  ...commentBoxStyle,
  background: "rgba(9,9,11,0.72)",
  border: "1px solid rgba(255,255,255,0.07)",
};

const commentHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

const commentTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  ...safeTextStyle,
};

const commentStatusStyle: CSSProperties = {
  margin: 0,
  color: "#86EFAC",
  fontSize: "11px",
  fontWeight: 850,
  ...safeTextStyle,
};

const commentFormStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const commentInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "92px",
  borderRadius: "14px",
  border: "1px solid var(--historietas-border-soft, #3F3F46)",
  background: "var(--historietas-input-bg, #18181B)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "10px",
  outline: "none",
  fontSize: "13px",
  lineHeight: 1.55,
  fontWeight: 650,
  resize: "vertical",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const commentButtonStyle: CSSProperties = {
  minHeight: "40px",
  borderRadius: "999px",
  border: "none",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
};

const focusCommentButtonStyle: CSSProperties = {
  ...commentButtonStyle,
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  border: "1px solid rgba(255,255,255,0.075)",
  color: "var(--historietas-text-primary, #E4E4E7)",
};

const deleteCommentButtonStyle: CSSProperties = {
  minHeight: "30px",
  padding: "0 9px",
  borderRadius: "999px",
  border: "1px solid rgba(239,68,68,0.16)",
  background: "rgba(239,68,68,0.06)",
  color: "var(--historietas-danger-button-text, #FCA5A5)",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  lineHeight: 1.15,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const chapterNavigationStyle: CSSProperties = {
  marginTop: "10px",
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
};

const chapterNavButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "rgba(255,255,255,0.045)",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  cursor: "pointer",
  fontFamily: "inherit",
  padding: "0 8px",
  boxSizing: "border-box",
  boxShadow: "none",
  ...safeTextStyle,
};

const chapterNavButtonPrimaryStyle: CSSProperties = {
  ...chapterNavButtonStyle,
  background: "var(--historietas-accent, #F97316)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 38%, transparent)",
  color: "#FFFFFF",
};

const chapterNavDisabledStyle: CSSProperties = {
  ...chapterNavButtonStyle,
  opacity: 0.55,
  cursor: "default",
};

const focusChapterNavigationStyle: CSSProperties = {
  ...chapterNavigationStyle,
};

const focusChapterNavButtonStyle: CSSProperties = {
  ...chapterNavButtonStyle,
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#D4D4D8",
  boxShadow: "none",
};

const focusChapterNavButtonPrimaryStyle: CSSProperties = {
  ...focusChapterNavButtonStyle,
  background: "rgba(249,115,22,0.12)",
  border: "1px solid rgba(249,115,22,0.24)",
  color: "#FDBA74",
};

const focusChapterNavDisabledStyle: CSSProperties = {
  ...focusChapterNavButtonStyle,
  color: "#52525B",
  background: "rgba(255,255,255,0.018)",
};

const readerFooterBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: "12px",
  borderRadius: "20px",
  background:
    "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 8%, rgba(18,12,30,0.78))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  display: "grid",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const readerFooterTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.5,
  fontWeight: 750,
  ...safeTextStyle,
};

const emptyBoxStyle: CSSProperties = {
  marginTop: "18px",
  borderRadius: "24px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 8%, var(--historietas-surface, rgba(18,12,30,0.82)))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  padding: "20px",
  display: "grid",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "30px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.06em",
  ...safeTextStyle,
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.5,
  fontWeight: 750,
  ...safeTextStyle,
};

const emptyButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "40px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
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
  ...safeTextStyle,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(980px, calc(100% - 64px))",
  padding: "22px 0 24px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  flexWrap: "nowrap",
  marginBottom: "14px",
};

const desktopBackButtonStyle: CSSProperties = {
  ...backButtonStyle,
  flex: "0 0 auto",
  minWidth: "126px",
  minHeight: "40px",
};

const desktopSettingsButtonStyle: CSSProperties = {
  ...settingsButtonStyle,
  flex: "0 0 auto",
  minWidth: "126px",
  minHeight: "40px",
};

const desktopFocusSettingsButtonStyle: CSSProperties = {
  ...desktopSettingsButtonStyle,
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  boxShadow: "none",
};

const desktopChapterHeaderStyle: CSSProperties = {
  ...chapterHeaderStyle,
  gap: "8px",
  padding: "16px 22px",
  borderRadius: "24px",
};

const desktopFocusChapterHeaderStyle: CSSProperties = {
  ...desktopChapterHeaderStyle,
  background: "rgba(9,9,11,0.76)",
  border: "1px solid rgba(255,255,255,0.07)",
};

const desktopSettingsPanelStyle: CSSProperties = {
  ...settingsPanelStyle,
  padding: "12px",
  borderRadius: "20px",
  gap: "9px",
};

const desktopFocusSettingsPanelStyle: CSSProperties = {
  ...desktopSettingsPanelStyle,
  background: "rgba(9,9,11,0.78)",
  border: "1px solid rgba(255,255,255,0.07)",
};

const desktopChapterSelectStyle: CSSProperties = {
  ...chapterSelectStyle,
  minHeight: "42px",
};

const desktopSettingsGridStyle: CSSProperties = {
  ...settingsGridStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "8px",
};

const desktopTextCardStyle: CSSProperties = {
  ...textCardStyle,
  marginTop: "12px",
  padding: "24px 28px",
  borderRadius: "22px",
};

const desktopFocusTextCardStyle: CSSProperties = {
  ...desktopTextCardStyle,
  background: "rgba(3,3,6,0.52)",
  border: "1px solid rgba(255,255,255,0.055)",
};

const desktopChapterTextStyle: CSSProperties = {
  ...chapterTextStyle,
  fontSize: "19px",
  lineHeight: 1.94,
};

const desktopReaderActionsStyle: CSSProperties = {
  ...readerActionsStyle,
  marginTop: "12px",
  gap: "8px",
};

const desktopFocusReaderActionsStyle: CSSProperties = {
  ...desktopReaderActionsStyle,
};

const desktopCommentBoxStyle: CSSProperties = {
  ...commentBoxStyle,
  marginTop: "12px",
  padding: "12px",
  borderRadius: "20px",
};

const desktopFocusCommentBoxStyle: CSSProperties = {
  ...desktopCommentBoxStyle,
  background: "rgba(9,9,11,0.72)",
  border: "1px solid rgba(255,255,255,0.07)",
};

const desktopChapterNavigationStyle: CSSProperties = {
  ...chapterNavigationStyle,
  marginTop: "12px",
  gap: "8px",
};

const desktopFocusChapterNavigationStyle: CSSProperties = {
  ...desktopChapterNavigationStyle,
};