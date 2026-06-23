"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { criarSlugBase, formatarData, idObraSupabaseValido, normalizarTexto, obterNumeroSeguro } from "../../lib/utils";

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

type PerfilComentarioLeitor = {
  userId: string;
  nome: string;
  avatar: string;
};

type ComentarioCapituloPublico = {
  id: string;
  userId: string;
  nome: string;
  avatar: string;
  texto: string;
  criadoEm: string;
  meuComentario: boolean;
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
const VIEWED_WORKS_STORAGE_KEY = "historietas-obras-visualizacoes";
const READER_PREFERENCES_STORAGE_KEY = "historietas-preferencias-leitura";

function criarStorageKeyUsuarioLeitor(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : chave;
}

function lerStorageUsuarioLeitor(chave: string, userId: string) {
  if (typeof window === "undefined" || !userId.trim()) {
    return null;
  }

  try {
    return localStorage.getItem(criarStorageKeyUsuarioLeitor(chave, userId));
  } catch {
    return null;
  }
}

function salvarJsonStorageUsuarioLeitor(
  chave: string,
  userId: string,
  valor: unknown
) {
  if (typeof window === "undefined" || !userId.trim()) {
    return;
  }

  try {
    localStorage.setItem(
      criarStorageKeyUsuarioLeitor(chave, userId),
      JSON.stringify(valor)
    );
  } catch {
    // localStorage é fallback; a leitura continua com estado em memória.
  }
}

async function marcarNotificacaoCapituloComoLidaSupabase(
  userId: string,
  obraId: string,
  capituloId: string
) {
  const userIdLimpo = userId.trim();
  const obraIdLimpo = obraId.trim();
  const capituloIdLimpo = capituloId.trim();

  if (!userIdLimpo || !obraIdLimpo || !capituloIdLimpo) {
    return;
  }

  try {
    await supabase
      .from("notificacoes")
      .update({
        lida: true,
      })
      .eq("user_id", userIdLimpo)
      .eq("obra_id", obraIdLimpo)
      .eq("capitulo_id", capituloIdLimpo);
  } catch {
    // A leitura continua mesmo se a notificação remota não atualizar.
  }
}

function criarLoginHrefLeitor(obraId?: string, capituloId?: string) {
  const obraIdLimpo = obraId?.trim() || "";
  const capituloIdLimpo = capituloId?.trim() || "";
  const paramsLeitor = new URLSearchParams();

  if (obraIdLimpo) {
    paramsLeitor.set("obraId", obraIdLimpo);
  }

  if (capituloIdLimpo) {
    paramsLeitor.set("capituloId", capituloIdLimpo);
  }

  const queryLeitor = paramsLeitor.toString();
  const redirectTo = queryLeitor ? `/ler-capitulo?${queryLeitor}` : "/ler-capitulo";
  const paramsLogin = new URLSearchParams({
    redirectTo,
  });

  return `/login?${paramsLogin.toString()}`;
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

function carregarPreferenciasLeitura(userId = ""): PreferenciasLeitura {
  if (typeof window === "undefined" || !userId.trim()) {
    return {
      tamanhoFonte: 5,
      modoFoco: false,
      mostrarLinhaProgresso: false,
    };
  }

  try {
    const preferenciasTexto = lerStorageUsuarioLeitor(
      READER_PREFERENCES_STORAGE_KEY,
      userId
    );
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

function salvarPreferenciasLeitura(
  preferencias: PreferenciasLeitura,
  userId = ""
) {
  salvarJsonStorageUsuarioLeitor(
    READER_PREFERENCES_STORAGE_KEY,
    userId,
    preferencias
  );
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

function carregarListaIdsStorage(chave: string, userId = ""): string[] {
  try {
    const listaTexto = lerStorageUsuarioLeitor(chave, userId);
    const listaJson: unknown = listaTexto ? JSON.parse(listaTexto) : [];
    const listaNormalizada = normalizarListaIds(listaJson);

    salvarJsonStorageUsuarioLeitor(chave, userId, listaNormalizada);

    return listaNormalizada;
  } catch {
    salvarJsonStorageUsuarioLeitor(chave, userId, []);
    return [];
  }
}

function criarHrefLeituraCapituloLeitor(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo" | "publicado" | "capitulos">,
  capituloId: string
) {
  const indiceCapitulo = obra.capitulos.findIndex(
    (capitulo) => capitulo.id === capituloId
  );
  const numeroCapitulo = indiceCapitulo >= 0 ? indiceCapitulo + 1 : 1;
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

function incrementarVisualizacaoObraLocal(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">,
  userId = ""
) {
  try {
    const chaveObra = obra.id || obra.slug || normalizarTexto(obra.titulo);

    if (!chaveObra) {
      return;
    }

    const visualizacoesTexto = lerStorageUsuarioLeitor(
      VIEWED_WORKS_STORAGE_KEY,
      userId
    );
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

    salvarJsonStorageUsuarioLeitor(
      VIEWED_WORKS_STORAGE_KEY,
      userId,
      {
        ...visualizacoesPorObra,
        [chaveObra]: visualizacoesAtuais + 1,
      }
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
      .limit(1)
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
    autorId: obraSupabase.user_id || obraLocal?.autorId || "",
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

function carregarObrasLocaisNormalizadas(userId = "") {
  const obrasSalvasTexto = lerStorageUsuarioLeitor(STORAGE_KEY, userId);
  const obrasSalvasJson: unknown = obrasSalvasTexto
    ? JSON.parse(obrasSalvasTexto)
    : [];

  const obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
    ? obrasSalvasJson.map((obra, index) =>
        normalizarObra(obra as Partial<ObraLocal>, index)
      )
    : [];

  salvarJsonStorageUsuarioLeitor(STORAGE_KEY, userId, obrasNormalizadas);

  return obrasNormalizadas;
}

function obterAutorIdSeguro(obra: Pick<ObraLocal, "autorId">) {
  return typeof obra.autorId === "string" ? obra.autorId.trim() : "";
}

function usuarioPodeAbrirObraNoLeitor(obra: ObraLocal, userId: string) {
  const autorId = obterAutorIdSeguro(obra);

  return obra.publicado || !autorId || Boolean(userId && autorId === userId);
}

function usuarioPodePersistirObraNoStorage(obra: ObraLocal, userId: string) {
  const autorId = obterAutorIdSeguro(obra);

  return !autorId || Boolean(userId && autorId === userId);
}

function salvarObrasPreservandoContas(
  obrasAtualizadas: ObraLocal[],
  userId: string
) {
  try {
    const userIdLimpo = userId.trim();
    const obrasAtuais = carregarObrasLocaisNormalizadas(userIdLimpo);
    const obrasAtualizadasPorId = new Map(
      obrasAtualizadas.map((obra, index) => [
        obra.id,
        normalizarObra(obra, index),
      ])
    );
    const idsPersistidos = new Set<string>();

    const obrasMescladas = obrasAtuais.map((obraAtual, index) => {
      const obraNormalizada = normalizarObra(obraAtual, index);
      const obraAtualizada = obrasAtualizadasPorId.get(obraNormalizada.id);

      idsPersistidos.add(obraNormalizada.id);

      if (!obraAtualizada) {
        return obraNormalizada;
      }

      return usuarioPodePersistirObraNoStorage(obraAtualizada, userIdLimpo)
        ? obraAtualizada
        : obraNormalizada;
    });

    obrasAtualizadas.forEach((obra, index) => {
      const obraNormalizada = normalizarObra(obra, index);

      if (
        idsPersistidos.has(obraNormalizada.id) ||
        !usuarioPodePersistirObraNoStorage(obraNormalizada, userIdLimpo)
      ) {
        return;
      }

      obrasMescladas.unshift(obraNormalizada);
      idsPersistidos.add(obraNormalizada.id);
    });

    salvarJsonStorageUsuarioLeitor(STORAGE_KEY, userIdLimpo, obrasMescladas);
  } catch {
    // A leitura deve continuar mesmo se o armazenamento local estiver indisponível.
  }
}

async function carregarObraSupabase(
  obraId: string,
  obraLocal?: ObraLocal | null,
  userId = ""
) {
  const { data: obraSupabase, error: erroObra } = await supabase
    .from("obras")
    .select(
      "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,slug,link,criada_em,atualizado_em"
    )
    .eq("id", obraId)
    .limit(1)
    .maybeSingle();

  if (erroObra || !obraSupabase) {
    return null;
  }

  const obraBanco = obraSupabase as unknown as ObraSupabaseRow;
  const autorId = obraBanco.user_id?.trim() || "";
  const usuarioEhDono = Boolean(userId && autorId === userId);

  if (!obraBanco.publicado && !usuarioEhDono) {
    return null;
  }

  let capitulosQuery = supabase
    .from("capitulos")
    .select("id,obra_id,user_id,titulo,texto,ordem,publicado,criado_em,atualizado_em")
    .eq("obra_id", obraId)
    .order("ordem", { ascending: true })
    .limit(300);

  if (!usuarioEhDono) {
    capitulosQuery = capitulosQuery.eq("publicado", true);
  }

  const { data: capitulosSupabase, error: erroCapitulos } =
    await capitulosQuery;

  return mesclarObraSupabaseComLocal(
    obraBanco,
    erroCapitulos
      ? []
      : ((capitulosSupabase || []) as unknown as CapituloSupabaseRow[]),
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
    .eq("user_id", userId)
    .limit(1000);

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
        .in("capitulo_id", capituloIds)
        .limit(1000),
      supabase
        .from("salvos_capitulos")
        .select("capitulo_id")
        .eq("user_id", userId)
        .in("capitulo_id", capituloIds)
        .limit(1000),
      supabase
        .from("comentarios_capitulos")
        .select("capitulo_id, comentario")
        .eq("user_id", userId)
        .in("capitulo_id", capituloIds)
        .limit(1000),
      supabase
        .from("progresso_leitura")
        .select("capitulo_id, lido, progresso")
        .eq("user_id", userId)
        .eq("obra_id", obra.id)
        .limit(1),
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
    const userId = dadosUsuario.user?.id || "";

    if (!userId || !idObraSupabaseValido(obra.id)) {
      return false;
    }

    const payload = {
      user_id: userId,
      obra_id: obra.id,
      capitulo_id: capituloId,
      progresso: calcularProgressoLeitura(obra.capitulos),
      lido,
      atualizado_em: new Date().toISOString(),
    };

    const { error: erroUpsert } = await supabase
      .from("progresso_leitura")
      .upsert(payload, {
        onConflict: "user_id,obra_id",
      });

    if (!erroUpsert) {
      return true;
    }

    const { error: erroDelete } = await supabase
      .from("progresso_leitura")
      .delete()
      .eq("user_id", userId)
      .eq("obra_id", obra.id);

    if (erroDelete) {
      throw erroDelete;
    }

    const { error: erroInsert } = await supabase
      .from("progresso_leitura")
      .insert(payload);

    if (erroInsert) {
      throw erroInsert;
    }

    return true;
  } catch (error) {
    console.warn("Não consegui salvar progresso de leitura no Supabase:", error);
    return false;
  }
}


type TipoAtividadeDiarioLeitor =
  | "comecou_ler"
  | "leu_capitulo"
  | "concluiu_obra"
  | "favoritou_obra"
  | "salvou_obra";

type VisibilidadeDiarioLeitor = "publico" | "parcial" | "privado";

async function registrarAtividadeDiarioLeitor({
  userId,
  tipo,
  obra,
  capituloId,
  visibilidade,
  texto,
  metadata = {},
}: {
  userId: string;
  tipo: TipoAtividadeDiarioLeitor;
  obra: ObraLocal;
  capituloId?: string;
  visibilidade: VisibilidadeDiarioLeitor;
  texto?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!userId || !idObraSupabaseValido(obra.id)) {
    return false;
  }

  const capituloIdSeguro =
    capituloId && idObraSupabaseValido(capituloId) ? capituloId : null;

  try {
    const { error } = await supabase.from("diario_atividades").insert({
      user_id: userId,
      tipo,
      obra_id: obra.id,
      capitulo_id: capituloIdSeguro,
      texto: texto?.trim() || null,
      visibilidade,
      metadata: {
        obra_titulo: obra.titulo,
        obra_slug: obra.slug,
        autor: obra.autor,
        capitulo_id_original: capituloId || "",
        ...metadata,
      },
    });

    return !error;
  } catch {
    // O Diário é camada social. A leitura nunca deve travar se o log falhar.
    return false;
  }
}


async function salvarRegistroCapituloSupabase(
  tabela: "curtidas_capitulos" | "salvos_capitulos",
  capituloId: string,
  ativo: boolean
) {
  try {
    const { data: dadosUsuario } = await supabase.auth.getUser();
    const userId = dadosUsuario.user?.id || "";

    if (!userId || !capituloId.trim()) {
      return false;
    }

    const { error: erroDelete } = await supabase
      .from(tabela)
      .delete()
      .eq("user_id", userId)
      .eq("capitulo_id", capituloId);

    if (erroDelete) {
      throw erroDelete;
    }

    if (!ativo) {
      return true;
    }

    const payloadBase = {
      user_id: userId,
      capitulo_id: capituloId,
    };

    const { error: erroComVisibilidade } = await supabase.from(tabela).insert({
      ...payloadBase,
      visibilidade: "publico",
    });

    if (!erroComVisibilidade) {
      return true;
    }

    const { error: erroSemVisibilidade } = await supabase
      .from(tabela)
      .insert(payloadBase);

    if (erroSemVisibilidade) {
      throw erroSemVisibilidade;
    }

    return true;
  } catch (error) {
    console.warn(`Não consegui salvar registro em ${tabela}:`, error);
    return false;
  }
}


async function salvarComentarioCapituloSupabase(
  capituloId: string,
  comentario: string
) {
  try {
    const { data: dadosUsuario } = await supabase.auth.getUser();
    const userId = dadosUsuario.user?.id || "";
    const comentarioLimpo = comentario.trim();

    if (!userId || !capituloId.trim()) {
      return false;
    }

    const { error: erroDelete } = await supabase
      .from("comentarios_capitulos")
      .delete()
      .eq("user_id", userId)
      .eq("capitulo_id", capituloId);

    if (erroDelete) {
      throw erroDelete;
    }

    if (!comentarioLimpo) {
      return true;
    }

    const payloadBase = {
      user_id: userId,
      capitulo_id: capituloId,
      comentario: comentarioLimpo,
    };

    const { error: erroComAtualizacao } = await supabase
      .from("comentarios_capitulos")
      .insert({
        ...payloadBase,
        atualizado_em: new Date().toISOString(),
      });

    if (!erroComAtualizacao) {
      return true;
    }

    const { error: erroSemAtualizacao } = await supabase
      .from("comentarios_capitulos")
      .insert(payloadBase);

    if (erroSemAtualizacao) {
      throw erroSemAtualizacao;
    }

    return true;
  } catch (error) {
    console.warn("Não consegui salvar comentário do capítulo no Supabase:", error);
    return false;
  }
}


async function salvarRegistroObraSupabase(
  tabela: "favoritos" | "concluidas",
  obraId: string,
  ativo: boolean
) {
  try {
    const { data: dadosUsuario } = await supabase.auth.getUser();
    const userId = dadosUsuario.user?.id || "";

    if (!userId || !idObraSupabaseValido(obraId)) {
      return false;
    }

    const { error: erroDelete } = await supabase
      .from(tabela)
      .delete()
      .eq("user_id", userId)
      .eq("obra_id", obraId);

    if (erroDelete) {
      throw erroDelete;
    }

    if (!ativo) {
      return true;
    }

    const payloadBase = {
      user_id: userId,
      obra_id: obraId,
    };

    const { error: erroComVisibilidade } = await supabase.from(tabela).insert({
      ...payloadBase,
      visibilidade: "publico",
    });

    if (!erroComVisibilidade) {
      return true;
    }

    const { error: erroSemVisibilidade } = await supabase
      .from(tabela)
      .insert(payloadBase);

    if (erroSemVisibilidade) {
      throw erroSemVisibilidade;
    }

    return true;
  } catch (error) {
    console.warn(`Não consegui salvar registro em ${tabela}:`, error);
    return false;
  }
}

function criarPerfilAutorHref(autor: string, autorId?: string) {
  const autorLimpo = autor.trim() || "Autor não informado";
  const autorIdLimpo = typeof autorId === "string" ? autorId.trim() : "";
  const params = new URLSearchParams({
    autor: autorLimpo,
  });

  if (autorIdLimpo) {
    params.set("autorId", autorIdLimpo);
  }

  return `/perfil-autor?${params.toString()}`;
}

function obterTextoRegistroLeitor(
  registro: Record<string, unknown> | null | undefined,
  chave: string,
) {
  const valor = registro?.[chave];

  if (typeof valor === "string") {
    return valor.trim();
  }

  if (typeof valor === "number" || typeof valor === "boolean") {
    return String(valor);
  }

  return "";
}

function obterNomeProfileLeitor(profile: Record<string, unknown> | undefined) {
  if (!profile) {
    return "";
  }

  return (
    obterTextoRegistroLeitor(profile, "nome") ||
    obterTextoRegistroLeitor(profile, "nome_usuario") ||
    obterTextoRegistroLeitor(profile, "username") ||
    obterTextoRegistroLeitor(profile, "display_name") ||
    obterTextoRegistroLeitor(profile, "apelido")
  );
}

function obterAvatarProfileLeitor(profile: Record<string, unknown> | undefined) {
  if (!profile) {
    return "";
  }

  return (
    obterTextoRegistroLeitor(profile, "avatar_url") ||
    obterTextoRegistroLeitor(profile, "avatar") ||
    obterTextoRegistroLeitor(profile, "foto_url") ||
    obterTextoRegistroLeitor(profile, "imagem_url") ||
    obterTextoRegistroLeitor(profile, "photo_url")
  );
}

function criarHrefPerfilUsuarioLeitor(userId: string, nome: string) {
  const params = new URLSearchParams();
  const userIdLimpo = userId.trim();
  const nomeLimpo = nome.trim() || "Usuário";

  if (userIdLimpo) {
    params.set("userId", userIdLimpo);
    params.set("autorId", userIdLimpo);
  }

  params.set("autor", nomeLimpo);

  return `/perfil-autor?${params.toString()}`;
}

function criarAvatarComentarioStyle(avatar: string): CSSProperties {
  const avatarLimpo = avatar.trim();

  if (!avatarLimpo) {
    return commentProfileAvatarStyle;
  }

  return {
    ...commentProfileAvatarStyle,
    backgroundImage: `url(${avatarLimpo})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "transparent",
    WebkitTextFillColor: "transparent",
  };
}

async function carregarProfilesPorUsuariosLeitor(userIds: string[]) {
  const idsValidos = Array.from(
    new Set(
      userIds
        .map((userId) => userId.trim())
        .filter((userId) => Boolean(userId))
    )
  );
  const profilesPorUsuario = new Map<string, Record<string, unknown>>();

  if (idsValidos.length === 0) {
    return profilesPorUsuario;
  }

  try {
    const { data } = await supabase
      .from("profiles")
      .select("id,user_id,nome,nome_usuario,username,display_name,apelido,avatar_url,avatar,foto_url,imagem_url,photo_url")
      .in("user_id", idsValidos)
      .limit(1000);

    if (Array.isArray(data)) {
      (data as Record<string, unknown>[]).forEach((profile) => {
        const profileUserId = obterTextoRegistroLeitor(profile, "user_id");

        if (profileUserId) {
          profilesPorUsuario.set(profileUserId, profile);
        }
      });
    }
  } catch {
    // Bases antigas podem usar id como chave do profile. O fallback vem abaixo.
  }

  const idsSemProfile = idsValidos.filter(
    (userId) => !profilesPorUsuario.has(userId)
  );

  if (idsSemProfile.length > 0) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id,user_id,nome,nome_usuario,username,display_name,apelido,avatar_url,avatar,foto_url,imagem_url,photo_url")
        .in("id", idsSemProfile)
        .limit(1000);

      if (Array.isArray(data)) {
        (data as Record<string, unknown>[]).forEach((profile) => {
          const profileUserId =
            obterTextoRegistroLeitor(profile, "user_id") ||
            obterTextoRegistroLeitor(profile, "id");

          if (profileUserId) {
            profilesPorUsuario.set(profileUserId, profile);
          }
        });
      }
    } catch {
      // Profiles é complementar; comentários continuam com fallback.
    }
  }

  return profilesPorUsuario;
}

async function carregarPerfilComentarioLeitor(userId: string) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return { userId: "", nome: "Usuário", avatar: "" } satisfies PerfilComentarioLeitor;
  }

  const profilesPorUsuario = await carregarProfilesPorUsuariosLeitor([userIdLimpo]);
  const profile = profilesPorUsuario.get(userIdLimpo);
  const nome = obterNomeProfileLeitor(profile) || "Usuário";

  return {
    userId: userIdLimpo,
    nome: nome.slice(0, 80),
    avatar: obterAvatarProfileLeitor(profile),
  } satisfies PerfilComentarioLeitor;
}

async function carregarComentariosCapituloSupabase(
  capituloId: string,
  usuarioLogadoId: string,
): Promise<ComentarioCapituloPublico[]> {
  const capituloIdLimpo = capituloId.trim();

  if (!capituloIdLimpo) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("comentarios_capitulos")
      .select("id,user_id,comentario,atualizado_em,created_at,criado_em")
      .eq("capitulo_id", capituloIdLimpo)
      .order("atualizado_em", { ascending: false })
      .limit(100);

    if (error || !Array.isArray(data)) {
      return [];
    }

    const registros = (data as Record<string, unknown>[]).filter(
      (registro) => Boolean(obterTextoRegistroLeitor(registro, "comentario"))
    );
    const usuariosIds = registros
      .map((registro) => obterTextoRegistroLeitor(registro, "user_id"))
      .filter(Boolean);
    const profilesPorUsuario = await carregarProfilesPorUsuariosLeitor(usuariosIds);

    return registros
      .map((registro, index) => {
        const userId = obterTextoRegistroLeitor(registro, "user_id");
        const profile = profilesPorUsuario.get(userId);
        const nome = obterNomeProfileLeitor(profile) || "Usuário";
        const texto = obterTextoRegistroLeitor(registro, "comentario");

        if (!userId || !texto) {
          return null;
        }

        return {
          id:
            obterTextoRegistroLeitor(registro, "id") ||
            `${capituloIdLimpo}-${userId}-${index}`,
          userId,
          nome: nome.slice(0, 80),
          avatar: obterAvatarProfileLeitor(profile),
          texto: texto.slice(0, 420),
          criadoEm:
            obterTextoRegistroLeitor(registro, "atualizado_em") ||
            obterTextoRegistroLeitor(registro, "created_at") ||
            obterTextoRegistroLeitor(registro, "criado_em"),
          meuComentario: Boolean(usuarioLogadoId && usuarioLogadoId === userId),
        } satisfies ComentarioCapituloPublico;
      })
      .filter(
        (comentario): comentario is ComentarioCapituloPublico =>
          Boolean(comentario)
      );
  } catch {
    return [];
  }
}

export default function LerCapituloPage() {
  const router = useRouter();
  const [obraId, setObraId] = useState("");
  const [capituloId, setCapituloId] = useState("");
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [comentarioDigitado, setComentarioDigitado] = useState("");
  const [comentarioStatus, setComentarioStatus] = useState("");
  const [comentariosCapitulo, setComentariosCapitulo] = useState<ComentarioCapituloPublico[]>([]);
  const [comentariosCarregando, setComentariosCarregando] = useState(false);
  const [perfilComentarioLeitor, setPerfilComentarioLeitor] =
    useState<PerfilComentarioLeitor>({
      userId: "",
      nome: "Usuário",
      avatar: "",
    });
  const [mensagemAcao, setMensagemAcao] = useState("");
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const notificacoesNaoLidas = 0;
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
  const atividadeDiarioRegistradaRef = useRef("");

  useEffect(() => {
    let cancelado = false;

    async function carregarUsuarioLogado() {
      try {
        const { data } = await supabase.auth.getUser();

        if (!cancelado) {
          setUsuarioIdLogado(data.user?.id || "");
        }
      } catch {
        if (!cancelado) {
          setUsuarioIdLogado("");
        }
      }
    }

    void carregarUsuarioLogado();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelado) {
        setUsuarioIdLogado(session?.user?.id || "");
      }
    });

    return () => {
      cancelado = true;
      subscription.unsubscribe();
    };
  }, []);


  useEffect(() => {
    let cancelado = false;

    async function carregarPerfilComentario() {
      if (!usuarioIdLogado) {
        window.setTimeout(() => {
          if (!cancelado) {
            setPerfilComentarioLeitor({
              userId: "",
              nome: "Usuário",
              avatar: "",
            });
          }
        }, 0);
        return;
      }

      const perfil = await carregarPerfilComentarioLeitor(usuarioIdLogado);

      if (!cancelado) {
        setPerfilComentarioLeitor(perfil);
      }
    }

    void carregarPerfilComentario();

    return () => {
      cancelado = true;
    };
  }, [usuarioIdLogado]);

  useEffect(() => {
    if (!usuarioIdLogado.trim()) {
      return;
    }

    const carregarPreferenciasTimer = window.setTimeout(() => {
      const preferencias = carregarPreferenciasLeitura(usuarioIdLogado);

      setTamanhoFonte(preferencias.tamanhoFonte);
      setModoFoco(preferencias.modoFoco);
      setMostrarLinhaProgresso(preferencias.mostrarLinhaProgresso);
      setPreferenciasCarregadas(true);
    }, 0);

    return () => {
      window.clearTimeout(carregarPreferenciasTimer);
    };
  }, [usuarioIdLogado]);

  useEffect(() => {
    if (!preferenciasCarregadas) {
      return;
    }

    salvarPreferenciasLeitura(
      {
        tamanhoFonte,
        modoFoco,
        mostrarLinhaProgresso,
      },
      usuarioIdLogado
    );
  }, [preferenciasCarregadas, tamanhoFonte, modoFoco, mostrarLinhaProgresso]);

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

      window.setTimeout(() => {
        if (!cancelado) {
          setObraId(obraIdParam);
          setCapituloId(capituloIdParam);
        }
      }, 0);

      try {
        const { data: dadosUsuario } = await supabase.auth.getUser();
        const userId = dadosUsuario.user?.id || "";
        const obrasLocaisTodas = carregarObrasLocaisNormalizadas(userId);
        const obrasLocais = obrasLocaisTodas.filter((obra) =>
          usuarioPodeAbrirObraNoLeitor(obra, userId)
        );
        let obrasAtualizadas = obrasLocais;
        let obrasFavoritasNormalizadas = carregarListaIdsStorage(
          FAVORITES_STORAGE_KEY,
          userId
        );
        let obrasConcluidasNormalizadas = carregarListaIdsStorage(
          COMPLETED_STORAGE_KEY,
          userId
        );

        if (obraIdParam) {
          const obraLocal =
            obrasLocais.find((obra) => obra.id === obraIdParam) || null;
          const obraSupabase = await carregarObraSupabase(
            obraIdParam,
            obraLocal,
            userId
          );

          if (obraSupabase && usuarioPodeAbrirObraNoLeitor(obraSupabase, userId)) {
            obrasAtualizadas = [
              obraSupabase,
              ...obrasLocais.filter((obra) => obra.id !== obraSupabase.id),
            ];
          }
        }

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

        salvarObrasPreservandoContas(obrasAtualizadas, userId);
        salvarJsonStorageUsuarioLeitor(
          FAVORITES_STORAGE_KEY,
          userId,
          obrasFavoritasNormalizadas
        );
        salvarJsonStorageUsuarioLeitor(
          COMPLETED_STORAGE_KEY,
          userId,
          obrasConcluidasNormalizadas
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

    void carregarDados();

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


  useEffect(() => {
    let cancelado = false;

    async function carregarComentariosCapitulo() {
      if (!capituloAtual?.id) {
        window.setTimeout(() => {
          if (!cancelado) {
            setComentariosCapitulo([]);
          }
        }, 0);
        return;
      }

      window.setTimeout(() => {
        if (!cancelado) {
          setComentariosCarregando(true);
        }
      }, 0);
      const comentarios = await carregarComentariosCapituloSupabase(
        capituloAtual.id,
        usuarioIdLogado,
      );

      if (!cancelado) {
        setComentariosCapitulo(comentarios);
        setComentariosCarregando(false);
      }
    }

    void carregarComentariosCapitulo();

    return () => {
      cancelado = true;
    };
  }, [capituloAtual?.id, usuarioIdLogado]);

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
    incrementarVisualizacaoObraLocal(obraAtual, usuarioIdLogado);
    void incrementarVisualizacaoObraSupabase(obraAtual.id);
  }, [obraAtual?.id, obraAtual?.slug, obraAtual?.titulo, usuarioIdLogado]);

  useEffect(() => {
    const atualizarComentarioTimer = window.setTimeout(() => {
      setComentarioDigitado(capituloAtual?.comentario || "");
      setComentarioStatus("");
      setMensagemAcao("");
      setMostrarComentario(
        Boolean(usuarioIdLogado && capituloAtual?.comentario.trim())
      );
    }, 0);

    return () => {
      window.clearTimeout(atualizarComentarioTimer);
    };
  }, [capituloAtual?.id, usuarioIdLogado]);

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

    const atualizarProgressoTimer = window.setTimeout(
      atualizarProgressoRolagem,
      0
    );

    window.addEventListener("scroll", atualizarProgressoRolagem);
    window.addEventListener("resize", atualizarProgressoRolagem);

    return () => {
      window.clearTimeout(atualizarProgressoTimer);
      window.removeEventListener("scroll", atualizarProgressoRolagem);
      window.removeEventListener("resize", atualizarProgressoRolagem);
    };
  }, [capituloAtual?.id]);

  useEffect(() => {
    if (!usuarioIdLogado || !obraAtual || !capituloAtual) {
      return;
    }

    const chaveAtividade = `${usuarioIdLogado}:${obraAtual.id}:${capituloAtual.id}`;

    if (atividadeDiarioRegistradaRef.current === chaveAtividade) {
      return;
    }

    atividadeDiarioRegistradaRef.current = chaveAtividade;

    const agora = new Date().toISOString();
    const capituloJaLido = capituloAtual.lido;
    const obraJaIniciada =
      obraAtual.progressoLeitura > 0 ||
      Boolean(obraAtual.ultimoCapituloLidoId) ||
      obraAtual.capitulos.some((capitulo) => capitulo.lido);
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

    salvarObrasPreservandoContas(novasObras, usuarioIdLogado);
    void marcarNotificacaoCapituloComoLidaSupabase(
      usuarioIdLogado,
      obraAtual.id,
      capituloAtual.id
    );
    window.setTimeout(() => {
      setObras(novasObras);
    }, 0);

    if (!obraAtualizadaParaSupabase) {
      return;
    }

    const obraAtualizadaDiario = obraAtualizadaParaSupabase as ObraLocal;

    void salvarProgressoLeituraSupabase(
      obraAtualizadaDiario,
      capituloAtual.id,
      true
    );

    if (!capituloJaLido) {
      void (async () => {
        if (!obraJaIniciada) {
          await registrarAtividadeDiarioLeitor({
            userId: usuarioIdLogado,
            tipo: "comecou_ler",
            obra: obraAtualizadaDiario,
            capituloId: capituloAtual.id,
            visibilidade: "privado",
            texto: `Começou a ler ${obraAtualizadaDiario.titulo}`,
            metadata: {
              capitulo_titulo: capituloAtual.titulo,
              capitulo_numero: numeroCapitulo,
              progresso_obra: obraAtualizadaDiario.progressoLeitura,
              origem: "primeira_abertura_capitulo",
            },
          });
        }

        await registrarAtividadeDiarioLeitor({
          userId: usuarioIdLogado,
          tipo: "leu_capitulo",
          obra: obraAtualizadaDiario,
          capituloId: capituloAtual.id,
          visibilidade: "privado",
          texto: `Leu ${capituloAtual.titulo}`,
          metadata: {
            capitulo_titulo: capituloAtual.titulo,
            capitulo_numero: numeroCapitulo,
            progresso_obra: obraAtualizadaDiario.progressoLeitura,
            origem: "abertura_capitulo",
          },
        });
      })();
    }
  }, [usuarioIdLogado, obraAtual?.id, capituloAtual?.id]);

  async function obterUsuarioLogadoIdAtual() {
    if (usuarioIdLogado) {
      return usuarioIdLogado;
    }

    try {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id || "";

      setUsuarioIdLogado(userId);

      return userId;
    } catch {
      setUsuarioIdLogado("");
      return "";
    }
  }

  async function exigirLogin(mensagem: string) {
    const userId = await obterUsuarioLogadoIdAtual();

    if (userId) {
      setMensagemAcao("");
      return true;
    }

    setMensagemAcao(mensagem);
    router.push(criarLoginHrefLeitor(obraId, capituloId));
    return false;
  }

  async function recarregarComentariosCapituloAtual() {
    if (!capituloAtual?.id) {
      setComentariosCapitulo([]);
      return;
    }

    setComentariosCarregando(true);
    const comentarios = await carregarComentariosCapituloSupabase(
      capituloAtual.id,
      usuarioIdLogado,
    );

    setComentariosCapitulo(comentarios);
    setComentariosCarregando(false);
  }

  async function alternarComentarioVisivel() {
    if (mostrarComentario) {
      setMostrarComentario(false);
      return;
    }

    if (!(await exigirLogin("Entre na sua conta para comentar este capítulo."))) {
      return;
    }

    setMostrarComentario(true);
  }

  function salvarObras(novasObras: ObraLocal[]) {
    const obrasNormalizadas = novasObras.map((obra, index) =>
      normalizarObra(obra, index)
    );

    salvarObrasPreservandoContas(obrasNormalizadas, usuarioIdLogado);
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

    if (!(await exigirLogin("Entre na sua conta para curtir este capítulo."))) {
      return;
    }

    const novoStatusCurtida = !capituloAtual.curtiu;

    atualizarCapitulo({
      curtiu: novoStatusCurtida,
    });

    const curtidaSalva = await salvarRegistroCapituloSupabase(
      "curtidas_capitulos",
      capituloAtual.id,
      novoStatusCurtida
    );

    setMensagemAcao(
      curtidaSalva
        ? ""
        : "A curtida ficou salva no aparelho, mas não foi sincronizada agora."
    );
  }

  async function alternarSalvo() {
    if (!capituloAtual) {
      return;
    }

    if (!(await exigirLogin("Entre na sua conta para salvar este capítulo."))) {
      return;
    }

    const novoStatusSalvo = !capituloAtual.salvo;

    atualizarCapitulo({
      salvo: novoStatusSalvo,
    });

    const salvoSincronizado = await salvarRegistroCapituloSupabase(
      "salvos_capitulos",
      capituloAtual.id,
      novoStatusSalvo
    );

    setMensagemAcao(
      salvoSincronizado
        ? ""
        : "O capítulo ficou salvo no aparelho, mas não foi sincronizado agora."
    );

    const userIdAtual = usuarioIdLogado || (await obterUsuarioLogadoIdAtual());

    if (novoStatusSalvo && obraAtual && userIdAtual) {
      void registrarAtividadeDiarioLeitor({
        userId: userIdAtual,
        tipo: "salvou_obra",
        obra: obraAtual,
        capituloId: capituloAtual.id,
        visibilidade: "privado",
        texto: `Salvou ${capituloAtual.titulo}`,
        metadata: {
          capitulo_titulo: capituloAtual.titulo,
          capitulo_numero: numeroCapitulo,
          origem: "salvar_capitulo",
        },
      });
    }
  }

  async function alternarLidoManual() {
    if (!obraAtual || !capituloAtual) {
      return;
    }

    if (!(await exigirLogin("Entre na sua conta para marcar progresso de leitura."))) {
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

    const progressoSincronizado = await salvarProgressoLeituraSupabase(
      obraAtualizada,
      capituloAtual.id,
      novoStatusLido
    );

    setMensagemAcao(
      progressoSincronizado
        ? ""
        : "O progresso ficou salvo no aparelho, mas não foi sincronizado agora."
    );

    const userIdAtual = usuarioIdLogado || (await obterUsuarioLogadoIdAtual());

    if (novoStatusLido && userIdAtual) {
      void registrarAtividadeDiarioLeitor({
        userId: userIdAtual,
        tipo: "leu_capitulo",
        obra: obraAtualizada,
        capituloId: capituloAtual.id,
        visibilidade: "privado",
        texto: `Leu ${capituloAtual.titulo}`,
        metadata: {
          capitulo_titulo: capituloAtual.titulo,
          capitulo_numero: numeroCapitulo,
          progresso_obra: calcularProgressoLeitura(obraAtualizada.capitulos),
          origem: "marcar_lido_manual",
        },
      });
    }
  }

  async function alternarFavorito() {
    if (!obraAtual) {
      return;
    }

    if (!(await exigirLogin("Entre na sua conta para adicionar esta obra à lista."))) {
      return;
    }

    const userIdAtual = usuarioIdLogado || (await obterUsuarioLogadoIdAtual());

    if (!userIdAtual) {
      return;
    }

    const novoStatusFavorito = !obraFavorita;
    const novasObrasFavoritas = obraFavorita
      ? obrasFavoritas.filter((id) => id !== obraAtual.id)
      : [...obrasFavoritas, obraAtual.id];

    salvarJsonStorageUsuarioLeitor(
      FAVORITES_STORAGE_KEY,
      userIdAtual,
      novasObrasFavoritas
    );

    setObrasFavoritas(novasObrasFavoritas);
    const favoritoSincronizado = await salvarRegistroObraSupabase(
      "favoritos",
      obraAtual.id,
      novoStatusFavorito
    );

    setMensagemAcao(
      favoritoSincronizado
        ? ""
        : "A lista ficou salva no aparelho, mas não foi sincronizada agora."
    );

    if (novoStatusFavorito) {
      void registrarAtividadeDiarioLeitor({
        userId: userIdAtual,
        tipo: "favoritou_obra",
        obra: obraAtual,
        visibilidade: "parcial",
        texto: `Adicionou ${obraAtual.titulo} à lista`,
        metadata: {
          origem: "adicionar_lista_leitor",
        },
      });
    }
  }

  async function alternarConcluido() {
    if (!obraAtual) {
      return;
    }

    if (!(await exigirLogin("Entre na sua conta para marcar esta obra como concluída."))) {
      return;
    }

    const userIdAtual = usuarioIdLogado || (await obterUsuarioLogadoIdAtual());

    if (!userIdAtual) {
      return;
    }

    const novoStatusConcluido = !obraConcluida;
    const agora = new Date().toISOString();
    const ultimoCapitulo =
      obraAtual.capitulos[obraAtual.capitulos.length - 1] || null;
    const obraAtualizada: ObraLocal = novoStatusConcluido
      ? {
          ...obraAtual,
          capitulos: obraAtual.capitulos.map((capitulo) => ({
            ...capitulo,
            lido: true,
            lidoEm: capitulo.lidoEm || agora,
          })),
          ultimoCapituloLidoId:
            ultimoCapitulo?.id || obraAtual.ultimoCapituloLidoId,
          ultimaLeituraEm: agora,
          progressoLeitura: obraAtual.capitulos.length > 0 ? 100 : 0,
        }
      : obraAtual;
    const novasObrasConcluidas = obraConcluida
      ? obrasConcluidas.filter((id) => id !== obraAtual.id)
      : [...obrasConcluidas, obraAtual.id];

    if (novoStatusConcluido) {
      salvarObras(
        obras.map((obra) =>
          obra.id === obraAtual.id ? obraAtualizada : obra
        )
      );
    }

    salvarJsonStorageUsuarioLeitor(
      COMPLETED_STORAGE_KEY,
      userIdAtual,
      novasObrasConcluidas
    );

    setObrasConcluidas(novasObrasConcluidas);

    const concluidoSincronizado = await salvarRegistroObraSupabase(
      "concluidas",
      obraAtual.id,
      novoStatusConcluido
    );

    let progressoSincronizado = true;

    if (novoStatusConcluido && ultimoCapitulo) {
      progressoSincronizado = await salvarProgressoLeituraSupabase(
        obraAtualizada,
        ultimoCapitulo.id,
        true
      );
    }

    setMensagemAcao(
      concluidoSincronizado && progressoSincronizado
        ? ""
        : "A conclusão ficou salva no aparelho, mas não foi sincronizada agora."
    );

    if (novoStatusConcluido) {
      void registrarAtividadeDiarioLeitor({
        userId: userIdAtual,
        tipo: "concluiu_obra",
        obra: obraAtualizada,
        capituloId: ultimoCapitulo?.id,
        visibilidade: "parcial",
        texto: `Concluiu ${obraAtualizada.titulo}`,
        metadata: {
          total_capitulos: obraAtualizada.capitulos.length,
          progresso_obra: obraAtualizada.progressoLeitura,
          origem: "concluir_obra_leitor",
        },
      });
    }
  }

  async function salvarComentario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!(await exigirLogin("Entre na sua conta para comentar este capítulo."))) {
      return;
    }

    const textoLimpo = comentarioDigitado.trim();

    atualizarCapitulo({
      comentario: textoLimpo,
    });

    let comentarioSincronizado = true;

    if (capituloAtual) {
      comentarioSincronizado = await salvarComentarioCapituloSupabase(
        capituloAtual.id,
        textoLimpo
      );
      await recarregarComentariosCapituloAtual();
    }

    setComentarioStatus(
      textoLimpo
        ? comentarioSincronizado
          ? "Comentário salvo."
          : "Comentário salvo no aparelho, mas não sincronizado agora."
        : comentarioSincronizado
          ? "Comentário removido."
          : "Comentário removido do aparelho, mas não sincronizado agora."
    );
    setMostrarComentario(Boolean(textoLimpo));
  }

  async function apagarComentario() {
    if (!capituloAtual || !capituloAtual.comentario.trim()) {
      return;
    }

    if (!(await exigirLogin("Entre na sua conta para apagar seu comentário."))) {
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

    const comentarioSincronizado = await salvarComentarioCapituloSupabase(
      capituloAtual.id,
      ""
    );
    await recarregarComentariosCapituloAtual();

    setComentarioDigitado("");
    setComentarioStatus(
      comentarioSincronizado
        ? "Comentário apagado."
        : "Comentário apagado do aparelho, mas não sincronizado agora."
    );
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
      criarHrefLeituraCapituloLeitor(obraAtual, novoCapituloId)
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
        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
        <section style={isDesktop ? desktopContainerStyle : containerStyle} />
      </main>
    );
  }

  if (!obraAtual || !capituloAtual) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${leitorPageCss}`}</style>
        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
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
  const perfilAutorHref = criarPerfilAutorHref(obraAtual.autor, obraAtual.autorId);
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

      {!modoFoco && isDesktop && (
        <div style={desktopTopWaterFadeStyle} aria-hidden="true" />
      )}
      {!modoFoco && !isDesktop && (
        <div style={mobileTopWaterFadeStyle} aria-hidden="true" />
      )}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTopStyle : topStyle}>
          <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
            <span style={logoMarkStyle}>H</span>
            <span className="historietas-theme-logo-text" style={logoTextStyle}>istorietas</span>
          </Link>

          <div
            style={
              isDesktop
                ? desktopHeaderActionsStyle
                : headerActionsStyle
            }
          >
            {isDesktop ? (
              <Link
                href="/notificacoes"
                style={
                  modoFoco
                    ? desktopFocusNotificationButtonStyle
                    : desktopNotificationButtonStyle
                }
                aria-label={
                  notificacoesNaoLidas > 0
                    ? `Notificações: ${notificacoesNaoLidas} não lidas`
                    : "Notificações"
                }
              >
                N

                {notificacoesNaoLidas > 0 ? (
                  <span style={desktopNotificationBadgeStyle}>
                    {notificacoesNaoLidas > 99
                      ? "99+"
                      : notificacoesNaoLidas}
                  </span>
                ) : null}
              </Link>
            ) : null}

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
          </div>
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
            onClick={() => void alternarComentarioVisivel()}
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

        {mensagemAcao && <p style={commentStatusStyle}>{mensagemAcao}</p>}

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

            <div style={commentProfileRowStyle}>
              <Link
                href={criarHrefPerfilUsuarioLeitor(
                  perfilComentarioLeitor.userId || usuarioIdLogado,
                  perfilComentarioLeitor.nome,
                )}
                style={criarAvatarComentarioStyle(perfilComentarioLeitor.avatar)}
                aria-label={`Abrir perfil de ${perfilComentarioLeitor.nome}`}
              >
                {perfilComentarioLeitor.nome.slice(0, 1).toUpperCase()}
              </Link>

              <div style={commentProfileTextStyle}>
                <Link
                  href={criarHrefPerfilUsuarioLeitor(
                    perfilComentarioLeitor.userId || usuarioIdLogado,
                    perfilComentarioLeitor.nome,
                  )}
                  style={commentProfileNameStyle}
                >
                  {perfilComentarioLeitor.nome}
                </Link>
                <span style={commentProfileCaptionStyle}>Comentando com seu perfil público</span>
              </div>
            </div>

            {comentariosCapitulo.length > 0 && (
              <section style={commentListStyle} aria-label="Comentários do capítulo">
                <div style={commentListHeaderStyle}>
                  <strong style={commentListTitleStyle}>Comentários do capítulo</strong>
                  <span style={commentListCountStyle}>{comentariosCapitulo.length}</span>
                </div>

                {comentariosCapitulo.slice(0, 6).map((comentarioPublico) => (
                  <article key={comentarioPublico.id} style={commentPublicItemStyle}>
                    <Link
                      href={criarHrefPerfilUsuarioLeitor(
                        comentarioPublico.userId,
                        comentarioPublico.nome,
                      )}
                      style={criarAvatarComentarioStyle(comentarioPublico.avatar)}
                      aria-label={`Abrir perfil de ${comentarioPublico.nome}`}
                    >
                      {comentarioPublico.nome.slice(0, 1).toUpperCase()}
                    </Link>

                    <div style={commentPublicContentStyle}>
                      <div style={commentPublicTopStyle}>
                        <Link
                          href={criarHrefPerfilUsuarioLeitor(
                            comentarioPublico.userId,
                            comentarioPublico.nome,
                          )}
                          style={commentPublicNameStyle}
                        >
                          {comentarioPublico.nome}
                        </Link>
                        {comentarioPublico.meuComentario && (
                          <span style={commentMineBadgeStyle}>Seu comentário</span>
                        )}
                      </div>

                      <p style={commentPublicTextStyle}>{comentarioPublico.texto}</p>
                    </div>
                  </article>
                ))}
              </section>
            )}

            {comentariosCarregando && (
              <p style={commentStatusStyle}>Carregando comentários...</p>
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
            <Link href={voltarHref} style={modoFoco ? focusReturnToWorkButtonStyle : returnToWorkButtonStyle}>
              Voltar para obra
            </Link>
          )}
        </section>
      </section>
    </main>
  );
}

const leitorPageCss = `
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

  html[data-historietas-tema-visual] input::placeholder,
  html[data-historietas-tema-visual] textarea::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  html[data-historietas-tema-visual] select,
  html[data-historietas-tema-visual] textarea {
    color: #FFFFFF !important;
  }

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
  body[data-historietas-reader-focus="true"] div:has(a[href="/publicar"]):has(a[href="/perfil-autor?aba=biblioteca"]) {
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
  body[data-historietas-reader-focus="true"] div:has(a[href="/publicar"]):has(a[href="/perfil-autor?aba=biblioteca"]) a,
  body[data-historietas-reader-focus="true"] div:has(a[href="/publicar"]):has(a[href="/perfil-autor?aba=biblioteca"]) button {
    color: #D4D4D8 !important;
    box-shadow: none !important;
  }

  body[data-historietas-reader-focus="true"] nav a[href="/publicar"],
  body[data-historietas-reader-focus="true"] [data-bottom-nav] a[href="/publicar"],
  body[data-historietas-reader-focus="true"] [data-mobile-nav] a[href="/publicar"],
  body[data-historietas-reader-focus="true"] div:has(a[href="/publicar"]):has(a[href="/perfil-autor?aba=biblioteca"]) a[href="/publicar"] {
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
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
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

const pageStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  minHeight: "100vh",
  maxWidth: "100vw",
  overflowX: "hidden",
  background: "#070212",
  color: "var(--historietas-text-primary, #FFFFFF)",
  boxSizing: "border-box",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const focusPageStyle: CSSProperties = {
  ...pageStyle,
  background: "#050506",
  color: "#F4F4F5",
};

const fixedReadingProgressOuterStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 50,
  height: "4px",
  background: "rgba(255,255,255,0.06)",
};

const fixedReadingProgressInnerStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  transition: "width 0.16s ease",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(900px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "18px 0 calc(28px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "nowrap",
  marginBottom: "14px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const headerActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  flex: "0 0 auto",
  minWidth: 0,
};

const desktopHeaderActionsStyle: CSSProperties = {
  ...headerActionsStyle,
  gap: "10px",
};

const desktopNotificationButtonStyle: CSSProperties = {
  position: "relative",
  width: "40px",
  height: "40px",
  borderRadius: "999px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-surface-strong, #04000A)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 950,
  boxShadow: "none",
};

const desktopFocusNotificationButtonStyle: CSSProperties = {
  ...desktopNotificationButtonStyle,
  background: "#050506",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#F4F4F5",
};

const desktopNotificationBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "-7px",
  right: "-9px",
  minWidth: "18px",
  height: "18px",
  padding: "0 4px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px solid var(--historietas-bg-start, #070212)",
  background: "#EF4444",
  color: "#FFFFFF",
  fontSize: "9px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.38)",
  pointerEvents: "none",
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
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #DDD6FE 44%, #A78BFA 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "none",
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
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#DDD6FE",
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
  boxShadow: "none",
  ...safeTextStyle,
};

const backButtonStyle: CSSProperties = {
  minHeight: "38px",
  padding: "0 13px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#DDD6FE",
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
  boxShadow: "none",
  ...safeTextStyle,
};

const settingsButtonStyle: CSSProperties = {
  minHeight: "38px",
  padding: "0 13px",
  borderRadius: "999px",
  background: "#04000A",
  border: "1px solid rgba(249,115,22,0.30)",
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
  boxShadow: "none",
  textShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
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
  background: "#050506",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#F4F4F5",
  boxShadow: "none",
  textShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const chapterHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "14px",
  borderRadius: "28px",
  background: "linear-gradient(135deg, #070212 0%, #04000A 58%, #020006 100%)",
  border: "1px solid rgba(255,255,255,0.06)",
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
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  textAlign: "center",
  ...safeTextStyle,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(28px, 8vw, 42px)",
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  textAlign: "center",
  maxWidth: "100%",
  background: "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 48%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
  textShadow: "none",
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
  background: "rgba(4,0,10,0.72)",
  border: "1px solid rgba(255,255,255,0.08)",
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
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "#DDD6FE",
  fontSize: "9px",
  fontWeight: 900,
  textAlign: "center",
  boxShadow: "none",
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
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
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
  borderRadius: "20px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
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
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#04000A",
  color: "#FFFFFF",
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
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  boxShadow: "none",
};

const focusFontScaleBoxStyle: CSSProperties = {
  ...fontScaleBoxStyle,
  background: "transparent",
  border: "none",
  boxShadow: "none",
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
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  boxShadow: "none",
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
  border: "1px solid rgba(255,255,255,0.08)",
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
  background: "#04000A",
  border: "1px solid rgba(249,115,22,0.30)",
  color: "var(--historietas-accent, #FDBA74)",
  boxShadow: "none",
  textShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
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
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.045)",
  color: "#DDD6FE",
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
  border: "1px solid rgba(249,115,22,0.34)",
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
  background: "rgba(249,115,22,0.12)",
  border: "1px solid rgba(249,115,22,0.24)",
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
  borderRadius: "20px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
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
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.045)",
  color: "#DDD6FE",
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
  background: "rgba(249,115,22,0.12)",
  border: "1px solid rgba(249,115,22,0.24)",
  color: "var(--historietas-accent, #FDBA74)",
};

const activeSaveButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  background: "rgba(34,197,94,0.12)",
  border: "1px solid rgba(34,197,94,0.24)",
  color: "#86EFAC",
};

const activeCommentButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  background: "rgba(124,58,237,0.18)",
  border: "1px solid rgba(124,58,237,0.30)",
  color: "#DDD6FE",
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
  borderRadius: "20px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
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

const commentProfileRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  minWidth: 0,
};

const commentProfileAvatarStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  flex: "0 0 auto",
  display: "grid",
  placeItems: "center",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, rgba(249,115,22,0.92), rgba(124,58,237,0.82))",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  textDecoration: "none",
  boxShadow: "none",
};

const commentProfileTextStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  minWidth: 0,
};

const commentProfileNameStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  textDecoration: "none",
  ...safeTextStyle,
};

const commentProfileCaptionStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 750,
  ...safeTextStyle,
};

const commentListStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "9px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.055)",
  minWidth: 0,
};

const commentListHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
};

const commentListTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  ...safeTextStyle,
};

const commentListCountStyle: CSSProperties = {
  minWidth: "24px",
  height: "24px",
  display: "grid",
  placeItems: "center",
  borderRadius: "999px",
  background: "rgba(249,115,22,0.14)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 950,
};

const commentPublicItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr)",
  gap: "9px",
  minWidth: 0,
};

const commentPublicContentStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

const commentPublicTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  flexWrap: "wrap",
  minWidth: 0,
};

const commentPublicNameStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  textDecoration: "none",
  ...safeTextStyle,
};

const commentMineBadgeStyle: CSSProperties = {
  padding: "3px 7px",
  borderRadius: "999px",
  background: "rgba(34,197,94,0.09)",
  border: "1px solid rgba(34,197,94,0.13)",
  color: "#86EFAC",
  fontSize: "9px",
  fontWeight: 900,
  ...safeTextStyle,
};

const commentPublicTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  lineHeight: 1.45,
  fontWeight: 650,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
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
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#04000A",
  color: "#FFFFFF",
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
  border: "1px solid rgba(249,115,22,0.34)",
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
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.045)",
  color: "#DDD6FE",
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
  border: "1px solid rgba(249,115,22,0.34)",
  color: "#FFFFFF",
};

const returnToWorkButtonStyle: CSSProperties = {
  ...chapterNavButtonStyle,
  background: "#04000A",
  border: "1px solid rgba(249,115,22,0.30)",
  color: "var(--historietas-accent, #FDBA74)",
  boxShadow: "none",
  textShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
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

const focusReturnToWorkButtonStyle: CSSProperties = {
  ...focusChapterNavButtonStyle,
  background: "#050506",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#F4F4F5",
  boxShadow: "none",
  textShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
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
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "grid",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "none",
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
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  padding: "20px",
  display: "grid",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "none",
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
  boxShadow: "none",
  ...safeTextStyle,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(980px, calc(100% - 64px))",
  padding: "22px 0 34px",
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
  background: "#050506",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  boxShadow: "none",
  textShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const desktopChapterHeaderStyle: CSSProperties = {
  ...chapterHeaderStyle,
  gap: "8px",
  padding: "18px 22px",
  borderRadius: "30px",
};

const desktopFocusChapterHeaderStyle: CSSProperties = {
  ...desktopChapterHeaderStyle,
  background: "rgba(9,9,11,0.76)",
  border: "1px solid rgba(255,255,255,0.07)",
};

const desktopSettingsPanelStyle: CSSProperties = {
  ...settingsPanelStyle,
  padding: "12px",
  borderRadius: "22px",
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
  borderRadius: "22px",
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