"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, memo, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties, TouchEvent } from "react";
import { supabase } from "../../lib/supabase/client";
import { useNotificacoes } from "../../components/NotificacoesProvider";
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
  publicado?: boolean;
  visualizacoes?: number;
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
  visualizacoes: number | null;
  criado_em: string | null;
  atualizado_em: string | null;
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
  atualizado_em?: unknown;
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
  comentarioPaiId: string;
  meuComentario: boolean;
  curtidas: string[];
};

type RespostaComentarioCapitulo = {
  comentarioPaiId: string;
  autorId: string;
  autorNome: string;
};

type OrdenacaoComentariosCapitulo = "relevantes" | "recentes";

type ComentariosCapituloPost = {
  id: string;
  comentarios: ComentarioCapituloPublico[];
};

type ComentarioCapituloCurtidaRow = {
  comentario_id: string;
  usuario_id: string;
};

type TipoNotificacaoInteracaoCapitulo =
  | "curtida-capitulo"
  | "comentario-capitulo"
  | "curtida-comentario-capitulo";

type TamanhoFonte = 1 | 2 | 3 | 4 | 5;

type PreferenciasLeitura = {
  tamanhoFonte: TamanhoFonte;
  modoFoco: boolean;
  mostrarLinhaProgresso: boolean;
  versaoTamanhoFonte: 2;
};

type MetricasCapituloLeitor = {
  totalVisualizacoes: number;
  totalCurtidas: number;
  totalSalvos: number;
  totalComentarios: number;
  curtiu: boolean;
  salvo: boolean;
  carregado: boolean;
};

const metricasCapituloVazias: MetricasCapituloLeitor = {
  totalVisualizacoes: 0,
  totalCurtidas: 0,
  totalSalvos: 0,
  totalComentarios: 0,
  curtiu: false,
  salvo: false,
  carregado: false,
};

const FONT_SCALE_VALUES: TamanhoFonte[] = [1, 2, 3, 4, 5];
const FONT_SCALE_LEGACY_VALUES: Record<TamanhoFonte, 1 | 3 | 5 | 7 | 10> = {
  1: 1,
  2: 3,
  3: 5,
  4: 7,
  5: 10,
};

const STORAGE_KEY = "historietas-obras";
const READER_PREFERENCES_STORAGE_KEY = "historietas-preferencias-leitura";
const TABELA_COMENTARIOS_CAPITULOS_CURTIDAS = "comentarios_capitulos_curtidas";
const CURTIDAS_COMENTARIOS_CAPITULOS_STORAGE_KEY = "historietas-comentarios-capitulos-curtidas";

function criarStorageKeyUsuarioLeitor(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

function lerStorageUsuarioLeitor(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioLeitor(chave, userIdLimpo);

    return chaveStorage ? localStorage.getItem(chaveStorage) : null;
  } catch {
    return null;
  }
}

function salvarJsonStorageUsuarioLeitor(
  chave: string,
  userId: string,
  valor: unknown
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioLeitor(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // localStorage é fallback; a leitura continua com estado em memória.
  }
}

function carregarCurtidasComentariosCapitulosLocais(
  userId: string
): Record<string, boolean> {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return {};
  }

  try {
    const texto = lerStorageUsuarioLeitor(
      CURTIDAS_COMENTARIOS_CAPITULOS_STORAGE_KEY,
      userIdLimpo
    );
    const json: unknown = texto ? JSON.parse(texto) : {};

    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(json as Record<string, unknown>).filter(
        (entrada): entrada is [string, boolean] =>
          typeof entrada[0] === "string" && typeof entrada[1] === "boolean"
      )
    );
  } catch {
    return {};
  }
}

function salvarCurtidaComentarioCapituloLocal(
  userId: string,
  comentarioId: string,
  ativo: boolean
) {
  const userIdLimpo = userId.trim();
  const comentarioIdLimpo = comentarioId.trim();

  if (!userIdLimpo || !comentarioIdLimpo) {
    return;
  }

  const curtidasLocais = carregarCurtidasComentariosCapitulosLocais(userIdLimpo);

  salvarJsonStorageUsuarioLeitor(
    CURTIDAS_COMENTARIOS_CAPITULOS_STORAGE_KEY,
    userIdLimpo,
    {
      ...curtidasLocais,
      [comentarioIdLimpo]: ativo,
    }
  );
}

function aplicarCurtidasComentariosCapitulosLocais(
  comentarios: ComentarioCapituloPublico[],
  userId: string
) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return comentarios;
  }

  const curtidasLocais = carregarCurtidasComentariosCapitulosLocais(userIdLimpo);

  return comentarios.map((comentario) => {
    const estadoLocal = curtidasLocais[comentario.id];

    if (estadoLocal === true) {
      return {
        ...comentario,
        curtidas: Array.from(new Set([...comentario.curtidas, userIdLimpo])),
      };
    }

    if (estadoLocal === false) {
      return {
        ...comentario,
        curtidas: comentario.curtidas.filter(
          (curtidaId) => curtidaId !== userIdLimpo
        ),
      };
    }

    return comentario;
  });
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

async function registrarNotificacaoInteracaoCapituloSupabase({
  tipo,
  obra,
  capitulo,
  comentarioId,
  titulo,
  mensagem,
  link,
}: {
  tipo: TipoNotificacaoInteracaoCapitulo;
  obra: ObraLocal | null;
  capitulo: CapituloLocal | null;
  comentarioId?: string;
  titulo: string;
  mensagem: string;
  link: string;
}) {
  const obraId = obra?.id?.trim() || "";
  const capituloId = capitulo?.id?.trim() || "";
  const comentarioIdLimpo = comentarioId?.trim() || null;
  const tituloLimpo = titulo.trim();
  const mensagemLimpa = mensagem.trim();
  const linkLimpo = link.trim();

  if (!idObraSupabaseValido(obraId) || !idObraSupabaseValido(capituloId)) {
    return false;
  }

  try {
    const { error } = await supabase.rpc(
      "criar_notificacao_interacao_capitulo",
      {
        p_capitulo_id: capituloId,
        p_comentario_id: comentarioIdLimpo,
        p_tipo: tipo,
        p_titulo: tituloLimpo,
        p_mensagem: mensagemLimpa,
        p_link: linkLimpo || (obra ? criarHrefLeituraCapituloLeitor(obra, capituloId) : "/notificacoes"),
      }
    );

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.warn("Não consegui criar notificação da interação do capítulo:", error);
    return false;
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
    publicado:
      typeof (capitulo as Record<string, unknown>).publicado === "boolean"
        ? Boolean((capitulo as Record<string, unknown>).publicado)
        : undefined,
    visualizacoes: Math.max(
      0,
      obterNumeroSeguro(
        (capitulo as Record<string, unknown>).visualizacoes,
        0
      )
    ),
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

function normalizarTamanhoFonte(
  valor: unknown,
  versaoAtual = false
): TamanhoFonte {
  const numero = Number(valor);

  if (
    versaoAtual &&
    FONT_SCALE_VALUES.includes(numero as TamanhoFonte)
  ) {
    return numero as TamanhoFonte;
  }

  if (!Number.isFinite(numero)) {
    return 3;
  }

  if (numero <= 1) {
    return 1;
  }

  if (numero <= 3) {
    return 2;
  }

  if (numero <= 5) {
    return 3;
  }

  if (numero <= 8) {
    return 4;
  }

  return 5;
}

function carregarPreferenciasLeitura(userId = ""): PreferenciasLeitura {
  if (typeof window === "undefined" || !userId.trim()) {
    return {
      tamanhoFonte: 3,
      modoFoco: false,
      mostrarLinhaProgresso: false,
      versaoTamanhoFonte: 2,
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
        tamanhoFonte: 3,
        modoFoco: false,
        mostrarLinhaProgresso: false,
        versaoTamanhoFonte: 2,
      };
    }

    const preferencias = preferenciasJson as Partial<PreferenciasLeitura>;

    return {
      tamanhoFonte: normalizarTamanhoFonte(
        preferencias.tamanhoFonte,
        preferencias.versaoTamanhoFonte === 2
      ),
      modoFoco: Boolean(preferencias.modoFoco),
      mostrarLinhaProgresso: Boolean(preferencias.mostrarLinhaProgresso),
      versaoTamanhoFonte: 2,
    };
  } catch {
    return {
      tamanhoFonte: 3,
      modoFoco: false,
      mostrarLinhaProgresso: false,
      versaoTamanhoFonte: 2,
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
  const tamanhoLegado = FONT_SCALE_LEGACY_VALUES[tamanhoFonte];
  const fontSize = 12 + tamanhoLegado;
  const lineHeight =
    tamanhoLegado <= 3 ? 1.78 : tamanhoLegado <= 7 ? 1.9 : 1.98;

  return {
    ...chapterTextStyle,
    fontSize: `${fontSize}px`,
    lineHeight,
  };
}

function criarTextoLeituraDesktopStyle(tamanhoFonte: TamanhoFonte): CSSProperties {
  const tamanhoLegado = FONT_SCALE_LEGACY_VALUES[tamanhoFonte];
  const fontSize = 14 + tamanhoLegado;
  const lineHeight =
    tamanhoLegado <= 3 ? 1.82 : tamanhoLegado <= 7 ? 1.94 : 2.02;

  return {
    ...desktopChapterTextStyle,
    fontSize: `${fontSize}px`,
    lineHeight,
  };
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

async function incrementarVisualizacaoCapituloSupabase(
  capituloId: string
): Promise<number | null> {
  const capituloIdLimpo = capituloId.trim();

  if (!idObraSupabaseValido(capituloIdLimpo)) {
    return null;
  }

  try {
    const { data, error } = await supabase.rpc(
      "incrementar_visualizacao_capitulo",
      {
        capitulo_id_param: capituloIdLimpo,
      }
    );

    if (error) {
      console.warn(
        "Não consegui registrar a visualização protegida do capítulo:",
        error.message
      );
      return null;
    }

    return Math.max(0, obterNumeroSeguro(data, 0));
  } catch {
    // A leitura continua mesmo se a contagem remota falhar.
    return null;
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
    publicado: Boolean(capitulo.publicado),
    visualizacoes: Math.max(
      0,
      obterNumeroSeguro(capitulo.visualizacoes, capituloLocal?.visualizacoes || 0)
    ),
  };
}

function mesclarObraSupabaseComLocal(
  obraSupabase: ObraSupabaseRow,
  capitulosSupabase: CapituloSupabaseRow[],
  obraLocal?: ObraLocal | null,
  incluirCapitulosApenasLocais = false
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
  const capitulosApenasLocais = incluirCapitulosApenasLocais
    ? (obraLocal?.capitulos || []).filter(
        (capitulo) => !idsCapitulosRemotos.has(capitulo.id)
      )
    : [];
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
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [] as ObraLocal[];
  }

  const obrasSalvasTexto = lerStorageUsuarioLeitor(STORAGE_KEY, userIdLimpo);
  const obrasSalvasJson: unknown = obrasSalvasTexto
    ? JSON.parse(obrasSalvasTexto)
    : [];

  const obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
    ? obrasSalvasJson.map((obra, index) =>
        normalizarObra(obra as Partial<ObraLocal>, index)
      )
    : [];

  salvarJsonStorageUsuarioLeitor(STORAGE_KEY, userIdLimpo, obrasNormalizadas);

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

    if (!userIdLimpo) {
      return;
    }

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
    .select("id,obra_id,user_id,titulo,texto,ordem,publicado,visualizacoes,criado_em,atualizado_em")
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
    obraLocal,
    usuarioEhDono
  );
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
        .select("capitulo_id, lido, progresso, atualizado_em")
        .eq("user_id", userId)
        .eq("obra_id", obra.id)
        .in("capitulo_id", capituloIds)
        .order("atualizado_em", { ascending: false })
        .limit(1000),
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

  const progressoCarregado =
    !progressoResposta.error && Array.isArray(progressoResposta.data);
  const progressoRegistros = progressoCarregado
    ? (progressoResposta.data as RegistroProgressoLeitura[])
    : [];
  const progressoPorCapitulo = new Map<string, RegistroProgressoLeitura>();

  progressoRegistros.forEach((registro) => {
    const capituloIdRegistro =
      typeof registro.capitulo_id === "string"
        ? registro.capitulo_id.trim()
        : "";

    if (capituloIdRegistro && !progressoPorCapitulo.has(capituloIdRegistro)) {
      progressoPorCapitulo.set(capituloIdRegistro, registro);
    }
  });

  const ultimoProgressoLido =
    progressoRegistros.find((registro) => {
      return (
        Boolean(registro.lido) &&
        typeof registro.capitulo_id === "string" &&
        Boolean(registro.capitulo_id.trim())
      );
    }) || null;
  const ultimoCapituloLidoId =
    typeof ultimoProgressoLido?.capitulo_id === "string"
      ? ultimoProgressoLido.capitulo_id.trim()
      : "";
  const ultimaLeituraEm =
    typeof ultimoProgressoLido?.atualizado_em === "string"
      ? ultimoProgressoLido.atualizado_em
      : "";

  const capitulos = obra.capitulos.map((capitulo) => {
    const progressoCapitulo = progressoPorCapitulo.get(capitulo.id);
    const lidoRemoto = Boolean(progressoCapitulo?.lido);
    const lidoEmRemoto =
      typeof progressoCapitulo?.atualizado_em === "string"
        ? progressoCapitulo.atualizado_em
        : "";

    return {
      ...capitulo,
      curtiu: capitulo.curtiu || curtidas.has(capitulo.id),
      salvo: capitulo.salvo || salvos.has(capitulo.id),
      comentario: comentarios.has(capitulo.id)
        ? comentarios.get(capitulo.id) || ""
        : capitulo.comentario,
      lido: progressoCarregado ? lidoRemoto : capitulo.lido,
      lidoEm: progressoCarregado
        ? lidoRemoto
          ? lidoEmRemoto || capitulo.lidoEm
          : ""
        : capitulo.lidoEm,
    };
  });

  return {
    ...obra,
    capitulos,
    ultimoCapituloLidoId: progressoCarregado
      ? ultimoCapituloLidoId
      : obra.ultimoCapituloLidoId,
    ultimaLeituraEm: progressoCarregado
      ? ultimaLeituraEm
      : obra.ultimaLeituraEm,
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
    const capituloIdLimpo = capituloId.trim();

    if (
      !userId ||
      !idObraSupabaseValido(obra.id) ||
      !capituloIdLimpo
    ) {
      return false;
    }

    if (!lido) {
      const { error: erroDelete } = await supabase
        .from("progresso_leitura")
        .delete()
        .eq("user_id", userId)
        .eq("obra_id", obra.id)
        .eq("capitulo_id", capituloIdLimpo);

      if (erroDelete) {
        throw erroDelete;
      }

      return true;
    }

    const payload = {
      user_id: userId,
      obra_id: obra.id,
      capitulo_id: capituloIdLimpo,
      progresso: calcularProgressoLeitura(obra.capitulos),
      lido: true,
      atualizado_em: new Date().toISOString(),
    };

    const { error: erroUpsert } = await supabase
      .from("progresso_leitura")
      .upsert(payload, {
        onConflict: "user_id,obra_id,capitulo_id",
      });

    if (erroUpsert) {
      throw erroUpsert;
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


function criarMetricasCapituloLocais(
  capitulo: CapituloLocal | null,
  totalComentarios = 0
): MetricasCapituloLeitor {
  if (!capitulo) {
    return metricasCapituloVazias;
  }

  return {
    totalVisualizacoes: Math.max(0, capitulo.visualizacoes || 0),
    totalCurtidas: capitulo.curtiu ? 1 : 0,
    totalSalvos: capitulo.salvo ? 1 : 0,
    totalComentarios,
    curtiu: capitulo.curtiu,
    salvo: capitulo.salvo,
    carregado: false,
  };
}

async function contarRegistrosCapituloLeitor(
  tabela: "curtidas_capitulos" | "salvos_capitulos" | "comentarios_capitulos",
  capituloId: string
): Promise<number | null> {
  try {
    const { count, error } = await supabase
      .from(tabela)
      .select("capitulo_id", { count: "exact", head: true })
      .eq("capitulo_id", capituloId);

    if (error) {
      return null;
    }

    return Math.max(0, count ?? 0);
  } catch {
    return null;
  }
}

async function usuarioTemRegistroCapituloLeitor(
  tabela: "curtidas_capitulos" | "salvos_capitulos",
  capituloId: string,
  userId: string
): Promise<boolean | null> {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(tabela)
      .select("capitulo_id")
      .eq("capitulo_id", capituloId)
      .eq("user_id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (error) {
      return null;
    }

    return Boolean(data);
  } catch {
    return null;
  }
}

async function carregarVisualizacoesCapituloLeitor(
  capituloId: string
): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from("capitulos")
      .select("visualizacoes")
      .eq("id", capituloId)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return Math.max(
      0,
      obterNumeroSeguro(
        (data as { visualizacoes?: number | null }).visualizacoes,
        0
      )
    );
  } catch {
    return null;
  }
}

async function carregarMetricasCapituloSupabase(
  capitulo: CapituloLocal,
  userId: string,
  totalComentariosFallback: number
): Promise<MetricasCapituloLeitor> {
  const capituloId = capitulo.id.trim();

  if (!capituloId) {
    return criarMetricasCapituloLocais(capitulo, totalComentariosFallback);
  }

  const [
    totalVisualizacoes,
    totalCurtidas,
    totalSalvos,
    totalComentarios,
    curtiu,
    salvo,
  ] = await Promise.all([
    carregarVisualizacoesCapituloLeitor(capituloId),
    contarRegistrosCapituloLeitor("curtidas_capitulos", capituloId),
    contarRegistrosCapituloLeitor("salvos_capitulos", capituloId),
    contarRegistrosCapituloLeitor("comentarios_capitulos", capituloId),
    usuarioTemRegistroCapituloLeitor("curtidas_capitulos", capituloId, userId),
    usuarioTemRegistroCapituloLeitor("salvos_capitulos", capituloId, userId),
  ]);

  return {
    totalVisualizacoes:
      totalVisualizacoes === null
        ? Math.max(0, capitulo.visualizacoes || 0)
        : totalVisualizacoes,
    totalCurtidas:
      totalCurtidas === null ? (capitulo.curtiu ? 1 : 0) : totalCurtidas,
    totalSalvos:
      totalSalvos === null ? (capitulo.salvo ? 1 : 0) : totalSalvos,
    totalComentarios: Math.max(
      totalComentarios === null ? 0 : totalComentarios,
      totalComentariosFallback
    ),
    curtiu: curtiu === null ? capitulo.curtiu : curtiu,
    salvo: salvo === null ? capitulo.salvo : salvo,
    carregado: true,
  };
}

function formatarContadorCapituloLeitor(valor: number) {
  return Math.max(0, Math.round(valor)).toLocaleString("pt-BR");
}

async function salvarComentarioCapituloSupabase(
  capituloId: string,
  comentario: string,
  comentarioPaiId = ""
): Promise<Record<string, unknown> | null> {
  try {
    const { data: dadosUsuario } = await supabase.auth.getUser();
    const userId = dadosUsuario.user?.id || "";
    const capituloIdLimpo = capituloId.trim();
    const comentarioLimpo = comentario.trim();
    const comentarioPaiIdLimpo = comentarioPaiId.trim();
    const agora = new Date().toISOString();

    if (!userId || !capituloIdLimpo || !comentarioLimpo) {
      return null;
    }

    const payloadBase = {
      user_id: userId,
      capitulo_id: capituloIdLimpo,
      comentario: comentarioLimpo.slice(0, 420),
    };
    const payloadComResposta = {
      ...payloadBase,
      comentario_pai_id: comentarioPaiIdLimpo || null,
    };

    const { data: comentarioComAtualizacao, error: erroComAtualizacao } =
      await supabase
        .from("comentarios_capitulos")
        .insert({
          ...payloadComResposta,
          atualizado_em: agora,
        })
        .select(
          "id,user_id,comentario,comentario_pai_id,atualizado_em,criado_em"
        )
        .single();

    if (!erroComAtualizacao && comentarioComAtualizacao) {
      return comentarioComAtualizacao as Record<string, unknown>;
    }

    const { data: comentarioSemAtualizacao, error: erroSemAtualizacao } =
      await supabase
        .from("comentarios_capitulos")
        .insert(payloadComResposta)
        .select("id,user_id,comentario,comentario_pai_id,criado_em")
        .single();

    if (!erroSemAtualizacao && comentarioSemAtualizacao) {
      return comentarioSemAtualizacao as Record<string, unknown>;
    }

    if (comentarioPaiIdLimpo) {
      throw erroSemAtualizacao || erroComAtualizacao;
    }

    const { data: comentarioLegado, error: erroLegado } = await supabase
      .from("comentarios_capitulos")
      .insert(payloadBase)
      .select("id,user_id,comentario,criado_em")
      .single();

    if (!erroLegado && comentarioLegado) {
      return comentarioLegado as Record<string, unknown>;
    }

    throw erroLegado || erroSemAtualizacao || erroComAtualizacao;
  } catch (error) {
    console.warn("Não consegui salvar comentário do capítulo no Supabase:", error);
    return null;
  }
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

function obterMetadataUsuarioLeitor(metadata: unknown) {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? (metadata as Record<string, unknown>)
    : {};
}

function obterNomeMetadataUsuarioLeitor(metadata: Record<string, unknown>) {
  return (
    obterTextoRegistroLeitor(metadata, "nome") ||
    obterTextoRegistroLeitor(metadata, "nome_usuario") ||
    obterTextoRegistroLeitor(metadata, "username") ||
    obterTextoRegistroLeitor(metadata, "display_name") ||
    obterTextoRegistroLeitor(metadata, "apelido") ||
    obterTextoRegistroLeitor(metadata, "name") ||
    obterTextoRegistroLeitor(metadata, "full_name")
  );
}

function obterAvatarMetadataUsuarioLeitor(metadata: Record<string, unknown>) {
  return (
    obterTextoRegistroLeitor(metadata, "avatar_url") ||
    obterTextoRegistroLeitor(metadata, "avatar") ||
    obterTextoRegistroLeitor(metadata, "foto_url") ||
    obterTextoRegistroLeitor(metadata, "imagem_url") ||
    obterTextoRegistroLeitor(metadata, "photo_url") ||
    obterTextoRegistroLeitor(metadata, "picture")
  );
}

function obterNomePorEmailLeitor(email: string) {
  const nomeEmail = email.trim().split("@")[0];

  return nomeEmail || "Usuário";
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

function criarAvatarComentarioBaseStyle(
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
      .select("id,user_id,nome,avatar_url")
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
        .select("id,user_id,nome,avatar_url")
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
  let nome = obterNomeProfileLeitor(profile);
  let avatar = obterAvatarProfileLeitor(profile);

  try {
    const { data } = await supabase.auth.getUser();
    const usuario = data.user;

    if (usuario?.id === userIdLimpo) {
      const metadata = obterMetadataUsuarioLeitor(usuario.user_metadata);

      nome =
        nome ||
        obterNomeMetadataUsuarioLeitor(metadata) ||
        obterNomePorEmailLeitor(usuario.email || "");
      avatar = avatar || obterAvatarMetadataUsuarioLeitor(metadata);
    }
  } catch {
    // O fallback de autenticação não deve travar os comentários.
  }

  return {
    userId: userIdLimpo,
    nome: (nome || "Usuário").slice(0, 80),
    avatar,
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
    let data: Record<string, unknown>[] | null = null;
    let error: unknown = null;

    const consultasComentarios = [
      () =>
        supabase
          .from("comentarios_capitulos")
          .select(
            "id,user_id,comentario,comentario_pai_id,atualizado_em,criado_em"
          )
          .eq("capitulo_id", capituloIdLimpo)
          .order("atualizado_em", { ascending: true })
          .limit(500),
      () =>
        supabase
          .from("comentarios_capitulos")
          .select("id,user_id,comentario,comentario_pai_id,criado_em")
          .eq("capitulo_id", capituloIdLimpo)
          .order("criado_em", { ascending: true })
          .limit(500),
      () =>
        supabase
          .from("comentarios_capitulos")
          .select("id,user_id,comentario,atualizado_em,criado_em")
          .eq("capitulo_id", capituloIdLimpo)
          .order("atualizado_em", { ascending: true })
          .limit(500),
      () =>
        supabase
          .from("comentarios_capitulos")
          .select("id,user_id,comentario,criado_em")
          .eq("capitulo_id", capituloIdLimpo)
          .order("criado_em", { ascending: true })
          .limit(500),
    ];

    for (const consultar of consultasComentarios) {
      const resposta = await consultar();

      if (!resposta.error && Array.isArray(resposta.data)) {
        data = resposta.data as Record<string, unknown>[];
        error = null;
        break;
      }

      error = resposta.error;
    }

    if (error || !Array.isArray(data)) {
      return [];
    }

    const registros = data.filter((registro) =>
      Boolean(obterTextoRegistroLeitor(registro, "comentario"))
    );
    const comentarioIds = registros
      .map((registro) => obterTextoRegistroLeitor(registro, "id"))
      .filter(Boolean);
    const usuariosIds = registros
      .map((registro) => obterTextoRegistroLeitor(registro, "user_id"))
      .filter(Boolean);
    const profilesPorUsuario = await carregarProfilesPorUsuariosLeitor(usuariosIds);
    const perfilUsuarioLogado = usuarioLogadoId.trim()
      ? await carregarPerfilComentarioLeitor(usuarioLogadoId)
      : null;
    const curtidasPorComentario = new Map<string, string[]>();

    if (comentarioIds.length > 0) {
      const { data: curtidasData, error: erroCurtidas } = await supabase
        .from(TABELA_COMENTARIOS_CAPITULOS_CURTIDAS)
        .select("comentario_id,usuario_id")
        .in("comentario_id", comentarioIds)
        .limit(5000);

      if (!erroCurtidas && Array.isArray(curtidasData)) {
        (curtidasData as unknown as ComentarioCapituloCurtidaRow[]).forEach(
          (curtida) => {
            const comentarioId = curtida.comentario_id;
            const usuarioId = curtida.usuario_id;

            if (!comentarioId || !usuarioId) {
              return;
            }

            const curtidasAtuais = curtidasPorComentario.get(comentarioId) || [];

            if (!curtidasAtuais.includes(usuarioId)) {
              curtidasPorComentario.set(comentarioId, [
                ...curtidasAtuais,
                usuarioId,
              ]);
            }
          }
        );
      }
    }

    const comentariosMapeados = registros
      .map((registro, index) => {
        const idComentario =
          obterTextoRegistroLeitor(registro, "id") ||
          `${capituloIdLimpo}-${index}`;
        const userId = obterTextoRegistroLeitor(registro, "user_id");
        const profile = profilesPorUsuario.get(userId);
        const nomeProfile = obterNomeProfileLeitor(profile);
        const nomeUsuarioLogado =
          perfilUsuarioLogado?.userId === userId ? perfilUsuarioLogado.nome : "";
        const avatarUsuarioLogado =
          perfilUsuarioLogado?.userId === userId ? perfilUsuarioLogado.avatar : "";
        const nome = nomeProfile || nomeUsuarioLogado || "Usuário";
        const textoComentario = obterTextoRegistroLeitor(registro, "comentario");

        if (!userId || !textoComentario) {
          return null;
        }

        return {
          id: idComentario,
          userId,
          nome: nome.slice(0, 80),
          avatar: obterAvatarProfileLeitor(profile) || avatarUsuarioLogado,
          texto: textoComentario.slice(0, 420),
          criadoEm:
            obterTextoRegistroLeitor(registro, "atualizado_em") ||
            obterTextoRegistroLeitor(registro, "criado_em"),
          comentarioPaiId: obterTextoRegistroLeitor(
            registro,
            "comentario_pai_id"
          ),
          meuComentario: Boolean(usuarioLogadoId && usuarioLogadoId === userId),
          curtidas: curtidasPorComentario.get(idComentario) || [],
        } satisfies ComentarioCapituloPublico;
      })
      .filter(
        (comentario): comentario is ComentarioCapituloPublico =>
          Boolean(comentario)
      );

    return aplicarCurtidasComentariosCapitulosLocais(
      comentariosMapeados,
      usuarioLogadoId
    );
  } catch {
    return [];
  }
}

function dataComentarioCapitulo(comentario: ComentarioCapituloPublico) {
  const data = new Date(comentario.criadoEm).getTime();

  return Number.isNaN(data) ? 0 : data;
}

function formatarTempoRelativoComentarioCapitulo(
  criadaEm: string,
  agora = Date.now()
) {
  const dataComentario = new Date(criadaEm).getTime();

  if (Number.isNaN(dataComentario)) {
    return "agora";
  }

  const segundos = Math.max(0, Math.floor((agora - dataComentario) / 1000));

  if (segundos < 5) {
    return "agora";
  }

  if (segundos < 60) {
    return `há ${segundos} ${segundos === 1 ? "segundo" : "segundos"}`;
  }

  const minutos = Math.floor(segundos / 60);

  if (minutos < 60) {
    return `há ${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
  }

  const horas = Math.floor(minutos / 60);

  if (horas < 24) {
    return `há ${horas} ${horas === 1 ? "hora" : "horas"}`;
  }

  const dias = Math.floor(horas / 24);

  return `há ${dias} ${dias === 1 ? "dia" : "dias"}`;
}

function criarEstruturaComentariosCapitulo(
  comentarios: ComentarioCapituloPublico[],
  ordenacao: OrdenacaoComentariosCapitulo
) {
  const comentariosPorId = new Map(
    comentarios.map((comentario) => [comentario.id, comentario])
  );
  const respostasPorRaiz = new Map<string, ComentarioCapituloPublico[]>();
  const comentariosRaiz: ComentarioCapituloPublico[] = [];

  function obterRaiz(comentario: ComentarioCapituloPublico) {
    let atual = comentario;
    const visitados = new Set<string>([comentario.id]);

    while (atual.comentarioPaiId) {
      const pai = comentariosPorId.get(atual.comentarioPaiId);

      if (!pai || visitados.has(pai.id)) {
        break;
      }

      visitados.add(pai.id);
      atual = pai;
    }

    return atual;
  }

  comentarios.forEach((comentario) => {
    const paiExiste = Boolean(
      comentario.comentarioPaiId &&
        comentariosPorId.has(comentario.comentarioPaiId)
    );

    if (!paiExiste) {
      comentariosRaiz.push(comentario);
      return;
    }

    const raiz = obterRaiz(comentario);
    const respostasAtuais = respostasPorRaiz.get(raiz.id) || [];

    respostasPorRaiz.set(raiz.id, [...respostasAtuais, comentario]);
  });

  respostasPorRaiz.forEach((respostas, raizId) => {
    respostasPorRaiz.set(
      raizId,
      [...respostas].sort(
        (a, b) => dataComentarioCapitulo(a) - dataComentarioCapitulo(b)
      )
    );
  });

  comentariosRaiz.sort((a, b) => {
    if (ordenacao === "recentes") {
      return dataComentarioCapitulo(b) - dataComentarioCapitulo(a);
    }

    const relevanciaA =
      a.curtidas.length * 3 + (respostasPorRaiz.get(a.id)?.length || 0);
    const relevanciaB =
      b.curtidas.length * 3 + (respostasPorRaiz.get(b.id)?.length || 0);

    return (
      relevanciaB - relevanciaA ||
      dataComentarioCapitulo(b) - dataComentarioCapitulo(a)
    );
  });

  return {
    comentariosRaiz,
    respostasPorRaiz,
  };
}

function obterIdsComentarioCapituloComRespostas(
  comentarios: ComentarioCapituloPublico[],
  comentarioId: string
) {
  const ids = new Set<string>([comentarioId]);
  let encontrouNovos = true;

  while (encontrouNovos) {
    encontrouNovos = false;

    comentarios.forEach((comentario) => {
      if (
        comentario.comentarioPaiId &&
        ids.has(comentario.comentarioPaiId) &&
        !ids.has(comentario.id)
      ) {
        ids.add(comentario.id);
        encontrouNovos = true;
      }
    });
  }

  return ids;
}


type ComentariosCapituloSheetProps = {
  post: ComentariosCapituloPost | null;
  podeComentar: boolean;
  usuarioId: string;
  usuarioNome: string;
  usuarioAvatar: string;
  erroInteracao: string;
  carregando: boolean;
  isDesktop: boolean;
  onFechar: () => void;
  onEnviar: (
    postId: string,
    texto: string,
    comentarioPaiId: string
  ) => boolean | Promise<boolean>;
  onCurtirComentario: (postId: string, comentarioId: string) => void | Promise<void>;
  onRemoverComentario: (postId: string, comentarioId: string) => void | Promise<void>;
  onDenunciarComentario: (comentarioId: string) => void | Promise<void>;
};

const ComentariosCapituloSheet = memo(function ComentariosCapituloSheet({
  post,
  podeComentar,
  usuarioId,
  usuarioNome,
  usuarioAvatar,
  erroInteracao,
  carregando,
  isDesktop,
  onFechar,
  onEnviar,
  onCurtirComentario,
  onRemoverComentario,
  onDenunciarComentario,
}: ComentariosCapituloSheetProps) {
  const comentarioRef = useRef<HTMLTextAreaElement | null>(null);
  const sheetRef = useRef<HTMLElement | null>(null);
  const dragStartYRef = useRef(0);
  const dragOffsetYRef = useRef(0);
  const dragIgnorarCliqueRef = useRef(false);
  const dragResetTimerRef = useRef<number | null>(null);
  const [sheetExpandido, setSheetExpandido] = useState(false);
  const [comentarioEnviando, setComentarioEnviando] = useState(false);
  const [comentarioCurtindoId, setComentarioCurtindoId] = useState<string | null>(null);
  const [comentarioRemovendoId, setComentarioRemovendoId] = useState<string | null>(null);
  const [comentarioDenunciandoId, setComentarioDenunciandoId] = useState<string | null>(null);
  const [respostaComentario, setRespostaComentario] =
    useState<RespostaComentarioCapitulo | null>(null);
  const [respostasVisiveisPorComentario, setRespostasVisiveisPorComentario] =
    useState<Record<string, number>>({});
  const [ordenacaoComentarios, setOrdenacaoComentarios] =
    useState<OrdenacaoComentariosCapitulo>("relevantes");
  const [menuOrdenacaoAberto, setMenuOrdenacaoAberto] = useState(false);
  const [agoraComentarios, setAgoraComentarios] = useState(() => Date.now());
  const comentarioAcoesRef = useRef<Set<string>>(new Set<string>());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAgoraComentarios(Date.now());
    }, 30000);

    return () => {
      window.clearInterval(timer);

      if (dragResetTimerRef.current !== null) {
        window.clearTimeout(dragResetTimerRef.current);
      }
    };
  }, []);

  const estruturaComentarios = useMemo(
    () =>
      criarEstruturaComentariosCapitulo(
        post?.comentarios || [],
        ordenacaoComentarios
      ),
    [ordenacaoComentarios, post?.comentarios]
  );

  function fecharComentarios() {
    setSheetExpandido(false);
    setMenuOrdenacaoAberto(false);
    setRespostaComentario(null);
    dragOffsetYRef.current = 0;
    onFechar();
  }

  function inserirNoComentario(valor: string) {
    if (!podeComentar || !comentarioRef.current) {
      return;
    }

    const campo = comentarioRef.current;
    const inicio = campo.selectionStart ?? campo.value.length;
    const fim = campo.selectionEnd ?? campo.value.length;
    const textoAtual = campo.value;

    campo.value = `${textoAtual.slice(0, inicio)}${valor}${textoAtual.slice(fim)}`.slice(
      0,
      420
    );
    campo.focus();

    const novaPosicao = Math.min(inicio + valor.length, campo.value.length);
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

  function responderComentario(
    comentario: ComentarioCapituloPublico,
    comentarioRaizId: string
  ) {
    if (!podeComentar) {
      return;
    }

    const nomeLimpo = comentario.nome.replace(/\s+/g, " ").trim();
    const raizIdLimpo = comentarioRaizId.trim();

    if (!nomeLimpo || !raizIdLimpo) {
      return;
    }

    setRespostaComentario({
      comentarioPaiId: raizIdLimpo,
      autorId: comentario.userId,
      autorNome: nomeLimpo,
    });

    window.setTimeout(() => {
      if (!comentarioRef.current) {
        return;
      }

      const mencao = `@${nomeLimpo} `;
      comentarioRef.current.value = mencao;
      comentarioRef.current.focus();
      comentarioRef.current.setSelectionRange(mencao.length, mencao.length);
    }, 0);
  }

  function iniciarArraste(event: TouchEvent<HTMLDivElement>) {
    if (isDesktop) {
      return;
    }

    dragStartYRef.current = event.touches[0]?.clientY || 0;
    dragOffsetYRef.current = 0;
    dragIgnorarCliqueRef.current = false;

    if (dragResetTimerRef.current !== null) {
      window.clearTimeout(dragResetTimerRef.current);
      dragResetTimerRef.current = null;
    }

    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  }

  function moverArraste(event: TouchEvent<HTMLDivElement>) {
    if (isDesktop) {
      return;
    }

    const posicaoAtual = event.touches[0]?.clientY || dragStartYRef.current;
    const limiteSuperior = sheetExpandido ? -46 : -58;
    const limiteInferior = sheetExpandido ? 112 : 132;
    const deslocamento = Math.max(
      limiteSuperior,
      Math.min(limiteInferior, posicaoAtual - dragStartYRef.current)
    );

    dragOffsetYRef.current = deslocamento;

    if (Math.abs(deslocamento) > 6) {
      dragIgnorarCliqueRef.current = true;
    }

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
    if (isDesktop) {
      return;
    }

    const deslocamento = dragOffsetYRef.current;

    if (sheetRef.current) {
      sheetRef.current.style.transition = "height 220ms ease";

      const handle = sheetRef.current.querySelector(
        "[data-comments-sheet-handle='true']"
      ) as HTMLElement | null;

      if (handle) {
        handle.style.transition = "transform 160ms ease";
        handle.style.transform = "";
      }
    }

    if (dragIgnorarCliqueRef.current) {
      dragResetTimerRef.current = window.setTimeout(() => {
        dragIgnorarCliqueRef.current = false;
        dragResetTimerRef.current = null;
      }, 350);
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
      fecharComentarios();
    }
  }

  function alternarExpansaoComentarios() {
    if (isDesktop || dragIgnorarCliqueRef.current) {
      return;
    }

    setSheetExpandido((expandidoAtual) => !expandidoAtual);
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
      const respostaAnterior = respostaComentario;
      const enviado = await onEnviar(
        post.id,
        conteudoComentario,
        respostaAnterior?.comentarioPaiId || ""
      );

      if (enviado && comentarioRef.current) {
        comentarioRef.current.value = "";
        setRespostaComentario(null);

        if (respostaAnterior?.comentarioPaiId) {
          setRespostasVisiveisPorComentario((estadoAtual) => ({
            ...estadoAtual,
            [respostaAnterior.comentarioPaiId]: Math.max(
              5,
              estadoAtual[respostaAnterior.comentarioPaiId] || 0
            ),
          }));
        }
      }
    } finally {
      finalizarAcaoComentario(chaveAcao);
      setComentarioEnviando(false);
    }
  }

  function renderizarComentario(
    comentario: ComentarioCapituloPublico,
    comentarioRaizId: string,
    resposta = false
  ) {
    const usuarioCurtiuComentario = Boolean(
      usuarioId && comentario.curtidas.includes(usuarioId)
    );
    const podeRemoverComentario = Boolean(
      usuarioId && comentario.userId === usuarioId
    );
    const podeDenunciarComentario = Boolean(
      usuarioId && comentario.userId !== usuarioId
    );
    const comentarioCurtindo = comentarioCurtindoId === comentario.id;
    const comentarioRemovendo = comentarioRemovendoId === comentario.id;
    const comentarioDenunciando = comentarioDenunciandoId === comentario.id;
    const avatarBaseStyle = resposta
      ? commentReplyAvatarLinkStyle
      : commentAvatarLinkStyle;

    return (
      <article
        key={comentario.id}
        style={resposta ? commentReplyItemStyle : commentItemStyle}
      >
        <Link
          href={criarHrefPerfilUsuarioLeitor(
            comentario.userId,
            comentario.nome
          )}
          aria-label={`Abrir perfil de ${comentario.nome}`}
          style={criarAvatarComentarioBaseStyle(
            avatarBaseStyle,
            comentario.avatar
          )}
        >
          {!comentario.avatar &&
            (comentario.nome.slice(0, 1).toUpperCase() || "U")}
        </Link>

        <div style={commentContentStyle}>
          <div style={commentTopLineStyle}>
            <Link
              href={criarHrefPerfilUsuarioLeitor(
                comentario.userId,
                comentario.nome
              )}
              style={commentAuthorLinkStyle}
            >
              {comentario.nome}
            </Link>

            <span style={commentTimeStyle}>
              {formatarTempoRelativoComentarioCapitulo(
                comentario.criadoEm,
                agoraComentarios
              )}
            </span>
          </div>

          <p style={commentTextStyle}>{comentario.texto}</p>

          <div style={commentActionsRowStyle}>
            <button
              type="button"
              onClick={() =>
                responderComentario(comentario, comentarioRaizId)
              }
              disabled={!podeComentar}
              style={{
                ...commentReplyButtonStyle,
                opacity: podeComentar ? 1 : 0.52,
                cursor: podeComentar ? "pointer" : "not-allowed",
              }}
            >
              Responder
            </button>

            {podeRemoverComentario ? (
              <button
                type="button"
                onClick={() =>
                  removerComentarioSeguro(post?.id || "", comentario.id)
                }
                disabled={comentarioRemovendo}
                style={{
                  ...commentRemoveButtonStyle,
                  opacity: comentarioRemovendo ? 0.58 : 1,
                  cursor: comentarioRemovendo ? "not-allowed" : "pointer",
                }}
              >
                {comentarioRemovendo ? "Removendo..." : "Remover"}
              </button>
            ) : null}

            {podeDenunciarComentario ? (
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
            ) : null}
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
            onClick={() =>
              curtirComentarioSeguro(post?.id || "", comentario.id)
            }
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
                fill={usuarioCurtiuComentario ? "var(--historietas-reader-heart, #F43F5E)" : "none"}
                stroke={
                  usuarioCurtiuComentario
                    ? "var(--historietas-reader-heart, #F43F5E)"
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
  }

  if (!post || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <section style={commentsSheetOverlayStyle} aria-label="Comentários">
      <button
        type="button"
        aria-label="Fechar comentários"
        onClick={fecharComentarios}
        style={commentsSheetBackdropStyle}
      />

      <article
        ref={sheetRef}
        style={
          isDesktop
            ? desktopCommentsSheetStyle
            : {
                ...commentsSheetStyle,
                ...(sheetExpandido
                  ? commentsSheetExpandedStyle
                  : commentsSheetCompactStyle),
              }
        }
      >
        <div
          data-comments-sheet-handle="true"
          style={commentsSheetHandleWrapStyle}
          onClick={alternarExpansaoComentarios}
          onTouchStart={iniciarArraste}
          onTouchMove={moverArraste}
          onTouchEnd={finalizarArraste}
          onTouchCancel={finalizarArraste}
          role="button"
          tabIndex={0}
          aria-label={
            sheetExpandido ? "Recolher comentários" : "Expandir comentários"
          }
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              alternarExpansaoComentarios();
            }
          }}
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

          <div style={commentsSortMenuWrapStyle}>
            <button
              type="button"
              onClick={() => setMenuOrdenacaoAberto((aberto) => !aberto)}
              style={commentsSortMenuTriggerStyle}
              aria-label="Ordenar comentários"
              aria-haspopup="menu"
              aria-expanded={menuOrdenacaoAberto}
            >
              +
            </button>

            {menuOrdenacaoAberto ? (
              <div style={commentsSortMenuStyle} role="menu">
                <button
                  type="button"
                  onClick={() => {
                    setOrdenacaoComentarios("relevantes");
                    setMenuOrdenacaoAberto(false);
                  }}
                  style={
                    ordenacaoComentarios === "relevantes"
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
                    setOrdenacaoComentarios("recentes");
                    setMenuOrdenacaoAberto(false);
                  }}
                  style={
                    ordenacaoComentarios === "recentes"
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
          {estruturaComentarios.comentariosRaiz.length > 0 ? (
            estruturaComentarios.comentariosRaiz.map((comentario) => {
              const respostas =
                estruturaComentarios.respostasPorRaiz.get(comentario.id) || [];
              const quantidadeVisivel = Math.min(
                respostas.length,
                respostasVisiveisPorComentario[comentario.id] || 0
              );
              const respostasVisiveis = respostas.slice(0, quantidadeVisivel);
              const respostasOcultas = Math.max(
                0,
                respostas.length - quantidadeVisivel
              );
              const respostasExpandidas = quantidadeVisivel > 0;

              return (
                <section key={comentario.id} style={commentThreadStyle}>
                  {renderizarComentario(comentario, comentario.id)}

                  {respostasVisiveis.length > 0 ? (
                    <div style={commentRepliesListStyle}>
                      {respostasVisiveis.map((resposta) =>
                        renderizarComentario(resposta, comentario.id, true)
                      )}
                    </div>
                  ) : null}

                  {respostas.length > 0 && !respostasExpandidas ? (
                    <button
                      type="button"
                      onClick={() =>
                        setRespostasVisiveisPorComentario((estadoAtual) => ({
                          ...estadoAtual,
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
                            setRespostasVisiveisPorComentario((estadoAtual) => ({
                              ...estadoAtual,
                              [comentario.id]: Math.min(
                                respostas.length,
                                (estadoAtual[comentario.id] || 0) + 5
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
                          setRespostasVisiveisPorComentario((estadoAtual) => ({
                            ...estadoAtual,
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
          ) : carregando ? (
            <div style={commentsLoadingStyle}>
              <LoadingSpinner
                compacto
                label="Carregando comentários"
              />
            </div>
          ) : (
            <p style={emptyCommentsStyle}>Sem comentários ainda</p>
          )}
        </section>

        {erroInteracao ? (
          <span style={commentsSheetErrorStyle}>{erroInteracao}</span>
        ) : null}

        <section style={commentsToolsStyle}>
          <div style={commentsQuickReactionsStyle}>
            {["💜", "🔥", "😂", "😮", "😭", "👏"].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => inserirNoComentario(emoji)}
                disabled={!podeComentar}
                style={commentsQuickReactionButtonStyle}
                aria-label={`Adicionar ${emoji} ao comentário`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </section>

        <form onSubmit={enviarComentario} style={commentsSheetFormStyle}>
          <div
            style={criarAvatarComentarioBaseStyle(
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
            aria-label="Adicionar menção"
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
                podeComentar && !comentarioEnviando
                  ? "pointer"
                  : "not-allowed",
            }}
          >
            {comentarioEnviando ? (
              <LoadingSpinner
                compacto
                label="Enviando comentário"
              />
            ) : (
              "↑"
            )}
          </button>
        </form>
      </article>
    </section>,
    document.body
  );
});

function LoadingSpinner({
  label = "Carregando",
  compacto = false,
}: {
  label?: string;
  compacto?: boolean;
}) {
  if (compacto) {
    return (
      <span
        role="status"
        aria-live="polite"
        aria-label={label}
        style={loadingInlineStyle}
      >
        <span
          className="historietas-loading-spinner"
          style={loadingSpinnerCompactStyle}
          aria-hidden="true"
        />
      </span>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      style={loadingPageStyle}
    >
      <span
        className="historietas-loading-spinner"
        style={loadingSpinnerStyle}
        aria-hidden="true"
      />
    </div>
  );
}

export default function LerCapituloPage() {
  const router = useRouter();
  const [obraId, setObraId] = useState("");
  const [capituloId, setCapituloId] = useState("");
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [, setComentarioDigitado] = useState("");
  const [comentarioStatus, setComentarioStatus] = useState("");
  const [comentariosCapitulo, setComentariosCapitulo] = useState<ComentarioCapituloPublico[]>([]);
  const [metricasCapitulo, setMetricasCapitulo] =
    useState<MetricasCapituloLeitor>(metricasCapituloVazias);
  const [curtidaCapituloSalvando, setCurtidaCapituloSalvando] = useState(false);
  const [salvoCapituloSalvando, setSalvoCapituloSalvando] = useState(false);
  const [lidoCapituloSalvando, setLidoCapituloSalvando] = useState(false);
  const [comentariosCarregando, setComentariosCarregando] = useState(false);
  const comentariosCapituloCarregadoIdRef = useRef("");
  const [perfilComentarioLeitor, setPerfilComentarioLeitor] =
    useState<PerfilComentarioLeitor>({
      userId: "",
      nome: "Usuário",
      avatar: "",
    });
  const [mensagemAcao, setMensagemAcao] = useState("");
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const { notificacoesNaoLidas } = useNotificacoes();
  const [tamanhoFonte, setTamanhoFonte] = useState<TamanhoFonte>(3);
  const [modoFoco, setModoFoco] = useState(false);
  const [mostrarAjustes, setMostrarAjustes] = useState(false);
  const [mostrarLinhaProgresso, setMostrarLinhaProgresso] = useState(false);
  const [mostrarComentario, setMostrarComentario] = useState(false);
  const [progressoRolagem, setProgressoRolagem] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [preferenciasCarregadas, setPreferenciasCarregadas] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const visualizacaoCapituloRegistradaRef = useRef("");
  const atividadeDiarioRegistradaRef = useRef("");
  const curtidaCapituloSalvandoRef = useRef(false);
  const salvoCapituloSalvandoRef = useRef(false);
  const lidoCapituloSalvandoRef = useRef(false);
  const acoesComentariosCapituloRef = useRef<Set<string>>(new Set<string>());

  useEffect(() => {
    if (!mostrarComentario) {
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
  }, [mostrarComentario]);

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
        versaoTamanhoFonte: 2,
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

    return () => {
      delete document.body.dataset.historietasReaderFocus;
    };
  }, [modoFoco]);

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
        const obrasLocais = obrasLocaisTodas
          .filter((obra) => usuarioPodeAbrirObraNoLeitor(obra, userId))
          .map((obra) => {
            const autorId = obterAutorIdSeguro(obra);
            const usuarioEhDono = Boolean(userId && autorId === userId);

            if (usuarioEhDono) {
              return obra;
            }

            return {
              ...obra,
              capitulos: obra.capitulos.filter(
                (capitulo) => capitulo.publicado !== false
              ),
            };
          });
        let obrasAtualizadas = obrasLocais;

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
          } else if (
            idObraSupabaseValido(obraIdParam) &&
            !Boolean(obraLocal && userId && obterAutorIdSeguro(obraLocal) === userId)
          ) {
            obrasAtualizadas = obrasLocais.filter((obra) => obra.id !== obraIdParam);
          }
        }

        if (dadosUsuario.user) {
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

        if (!cancelado) {
          setObras(obrasAtualizadas);
        }
      } catch {
        if (!cancelado) {
          setObras([]);
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
            setComentariosCarregando(false);
          }
        }, 0);
        return;
      }

      const deveExibirCarregamentoInicial =
        comentariosCapituloCarregadoIdRef.current !== capituloAtual.id;

      if (deveExibirCarregamentoInicial) {
        setComentariosCarregando(true);
      }

      const comentarios = await carregarComentariosCapituloSupabase(
        capituloAtual.id,
        usuarioIdLogado,
      );

      if (!cancelado) {
        comentariosCapituloCarregadoIdRef.current = capituloAtual.id;
        setComentariosCapitulo(comentarios);
        setComentariosCarregando(false);
      }
    }

    void carregarComentariosCapitulo();

    return () => {
      cancelado = true;
    };
  }, [capituloAtual?.id, usuarioIdLogado]);

  useEffect(() => {
    let cancelado = false;

    async function carregarMetricasCapituloAtual() {
      if (
        curtidaCapituloSalvandoRef.current ||
        salvoCapituloSalvandoRef.current
      ) {
        return;
      }

      if (!capituloAtual) {
        setMetricasCapitulo(metricasCapituloVazias);
        return;
      }

      const metricasLocais = criarMetricasCapituloLocais(
        capituloAtual,
        comentariosCapitulo.length
      );

      setMetricasCapitulo(metricasLocais);

      const metricasReais = await carregarMetricasCapituloSupabase(
        capituloAtual,
        usuarioIdLogado,
        comentariosCapitulo.length
      );

      if (cancelado) {
        return;
      }

      setMetricasCapitulo((metricasAtuais) => ({
        ...metricasReais,
        totalVisualizacoes: Math.max(
          metricasAtuais.totalVisualizacoes,
          metricasReais.totalVisualizacoes
        ),
      }));

      if (
        metricasReais.curtiu !== capituloAtual.curtiu ||
        metricasReais.salvo !== capituloAtual.salvo
      ) {
        atualizarCapitulo({
          curtiu: metricasReais.curtiu,
          salvo: metricasReais.salvo,
        });
      }
    }

    void carregarMetricasCapituloAtual();

    return () => {
      cancelado = true;
    };
  }, [
    capituloAtual?.id,
    capituloAtual?.curtiu,
    capituloAtual?.salvo,
    comentariosCapitulo.length,
    usuarioIdLogado,
  ]);

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

  const totalPalavras = capituloAtual ? contarPalavras(capituloAtual.texto) : 0;
  const progressoLeitura = obraAtual
    ? calcularProgressoLeitura(obraAtual.capitulos)
    : 0;
  const postComentariosCapitulo: ComentariosCapituloPost | null = capituloAtual
    ? {
        id: capituloAtual.id,
        comentarios: comentariosCapitulo,
      }
    : null;

  useEffect(() => {
    if (!capituloAtual || !idObraSupabaseValido(capituloAtual.id)) {
      return;
    }

    const capituloIdAtual = capituloAtual.id;

    if (visualizacaoCapituloRegistradaRef.current === capituloIdAtual) {
      return;
    }

    visualizacaoCapituloRegistradaRef.current = capituloIdAtual;

    async function registrarVisualizacaoCapituloAtual() {
      const totalVisualizacoes =
        await incrementarVisualizacaoCapituloSupabase(capituloIdAtual);

      if (totalVisualizacoes === null) {
        return;
      }

      setMetricasCapitulo((metricasAtuais) => ({
        ...metricasAtuais,
        totalVisualizacoes: Math.max(
          metricasAtuais.totalVisualizacoes,
          totalVisualizacoes
        ),
      }));
    }

    void registrarVisualizacaoCapituloAtual();
  }, [capituloAtual?.id]);

  useEffect(() => {
    const atualizarComentarioTimer = window.setTimeout(() => {
      setComentarioDigitado(capituloAtual?.comentario || "");
      setComentarioStatus("");
      setMensagemAcao("");
      setMostrarComentario(false);
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

    void marcarNotificacaoCapituloComoLidaSupabase(
      usuarioIdLogado,
      obraAtual.id,
      capituloAtual.id
    );

    const obraJaIniciada =
      obraAtual.progressoLeitura > 0 ||
      Boolean(obraAtual.ultimoCapituloLidoId) ||
      obraAtual.capitulos.some((capitulo) => capitulo.lido);

    if (obraJaIniciada) {
      return;
    }

    void registrarAtividadeDiarioLeitor({
      userId: usuarioIdLogado,
      tipo: "comecou_ler",
      obra: obraAtual,
      capituloId: capituloAtual.id,
      visibilidade: "privado",
      texto: `Começou a ler ${obraAtual.titulo}`,
      metadata: {
        capitulo_titulo: capituloAtual.titulo,
        capitulo_numero: numeroCapitulo,
        progresso_obra: obraAtual.progressoLeitura,
        origem: "abertura_capitulo",
      },
    });
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

  async function recarregarMetricasCapituloAtual(userId = usuarioIdLogado) {
    if (!capituloAtual) {
      setMetricasCapitulo(metricasCapituloVazias);
      return;
    }

    const metricas = await carregarMetricasCapituloSupabase(
      capituloAtual,
      userId,
      comentariosCapitulo.length
    );

    setMetricasCapitulo(metricas);

    if (
      metricas.curtiu !== capituloAtual.curtiu ||
      metricas.salvo !== capituloAtual.salvo
    ) {
      atualizarCapitulo({
        curtiu: metricas.curtiu,
        salvo: metricas.salvo,
      });
    }
  }

  async function alternarComentarioVisivel() {
    setComentarioStatus("");
    setMostrarComentario((valorAtual) => !valorAtual);
  }

  function fecharComentariosCapitulo() {
    setMostrarComentario(false);
  }

  function iniciarAcaoComentariosCapitulo(chave: string) {
    if (acoesComentariosCapituloRef.current.has(chave)) {
      return false;
    }

    acoesComentariosCapituloRef.current.add(chave);
    return true;
  }

  function finalizarAcaoComentariosCapitulo(chave: string) {
    acoesComentariosCapituloRef.current.delete(chave);
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
    if (!capituloAtual || curtidaCapituloSalvandoRef.current) {
      return;
    }

    if (!(await exigirLogin("Entre na sua conta para curtir este capítulo."))) {
      return;
    }

    const userIdAtual = usuarioIdLogado || (await obterUsuarioLogadoIdAtual());

    if (!userIdAtual) {
      return;
    }

    const estadoAnteriorCurtida = metricasCapitulo.curtiu;
    const totalAnteriorCurtidas = metricasCapitulo.totalCurtidas;
    const novoStatusCurtida = !estadoAnteriorCurtida;

    curtidaCapituloSalvandoRef.current = true;
    setCurtidaCapituloSalvando(true);
    setMensagemAcao("");

    atualizarCapitulo({
      curtiu: novoStatusCurtida,
    });
    setMetricasCapitulo((metricasAtuais) => ({
      ...metricasAtuais,
      curtiu: novoStatusCurtida,
      totalCurtidas: Math.max(
        0,
        metricasAtuais.totalCurtidas + (novoStatusCurtida ? 1 : -1)
      ),
      carregado: true,
    }));

    try {
      const curtidaSalva = await salvarRegistroCapituloSupabase(
        "curtidas_capitulos",
        capituloAtual.id,
        novoStatusCurtida
      );

      if (!curtidaSalva) {
        atualizarCapitulo({
          curtiu: estadoAnteriorCurtida,
        });
        setMetricasCapitulo((metricasAtuais) => ({
          ...metricasAtuais,
          curtiu: estadoAnteriorCurtida,
          totalCurtidas: totalAnteriorCurtidas,
          carregado: true,
        }));
        setMensagemAcao("Não foi possível atualizar a curtida agora.");
        return;
      }

      await recarregarMetricasCapituloAtual(userIdAtual);
      setMensagemAcao("");

      if (novoStatusCurtida && obraAtual) {
        const perfilAtual = await carregarPerfilComentarioLeitor(userIdAtual);

        void registrarNotificacaoInteracaoCapituloSupabase({
          tipo: "curtida-capitulo",
          obra: obraAtual,
          capitulo: capituloAtual,
          titulo: "Nova curtida no capítulo",
          mensagem: `${perfilAtual.nome || "Um leitor"} curtiu ${capituloAtual.titulo}.`,
          link: criarHrefLeituraCapituloLeitor(obraAtual, capituloAtual.id),
        });
      }
    } finally {
      curtidaCapituloSalvandoRef.current = false;
      setCurtidaCapituloSalvando(false);
    }
  }

  async function alternarSalvo() {
    if (!capituloAtual || salvoCapituloSalvandoRef.current) {
      return;
    }

    if (!(await exigirLogin("Entre na sua conta para salvar este capítulo."))) {
      return;
    }

    const userIdAtual = usuarioIdLogado || (await obterUsuarioLogadoIdAtual());

    if (!userIdAtual) {
      return;
    }

    const estadoAnteriorSalvo = metricasCapitulo.salvo;
    const totalAnteriorSalvos = metricasCapitulo.totalSalvos;
    const novoStatusSalvo = !estadoAnteriorSalvo;

    salvoCapituloSalvandoRef.current = true;
    setSalvoCapituloSalvando(true);
    setMensagemAcao("");

    atualizarCapitulo({
      salvo: novoStatusSalvo,
    });
    setMetricasCapitulo((metricasAtuais) => ({
      ...metricasAtuais,
      salvo: novoStatusSalvo,
      totalSalvos: Math.max(
        0,
        metricasAtuais.totalSalvos + (novoStatusSalvo ? 1 : -1)
      ),
      carregado: true,
    }));

    try {
      const salvoSincronizado = await salvarRegistroCapituloSupabase(
        "salvos_capitulos",
        capituloAtual.id,
        novoStatusSalvo
      );

      if (!salvoSincronizado) {
        atualizarCapitulo({
          salvo: estadoAnteriorSalvo,
        });
        setMetricasCapitulo((metricasAtuais) => ({
          ...metricasAtuais,
          salvo: estadoAnteriorSalvo,
          totalSalvos: totalAnteriorSalvos,
          carregado: true,
        }));
        setMensagemAcao("Não foi possível atualizar o capítulo salvo agora.");
        return;
      }

      await recarregarMetricasCapituloAtual(userIdAtual);
      setMensagemAcao("");

      if (novoStatusSalvo && obraAtual) {
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
    } finally {
      salvoCapituloSalvandoRef.current = false;
      setSalvoCapituloSalvando(false);
    }
  }

  async function alternarLido() {
    if (
      !obraAtual ||
      !capituloAtual ||
      lidoCapituloSalvandoRef.current
    ) {
      return;
    }

    if (!(await exigirLogin("Entre na sua conta para marcar este capítulo como lido."))) {
      return;
    }

    const userIdAtual = usuarioIdLogado || (await obterUsuarioLogadoIdAtual());

    if (!userIdAtual) {
      return;
    }

    const obrasAnteriores = obras;
    const novoStatusLido = !capituloAtual.lido;
    const novaDataLeitura = novoStatusLido ? new Date().toISOString() : "";
    let obraAtualizadaParaSupabase: ObraLocal | null = null;

    lidoCapituloSalvandoRef.current = true;
    setLidoCapituloSalvando(true);
    setMensagemAcao("");

    const novasObras = obras.map((obra, obraIndex) => {
      const obraNormalizada = normalizarObra(obra, obraIndex);

      if (obraNormalizada.id !== obraAtual.id) {
        return obraNormalizada;
      }

      const capitulosAtualizados = obraNormalizada.capitulos.map((capitulo) =>
        capitulo.id === capituloAtual.id
          ? {
              ...capitulo,
              lido: novoStatusLido,
              lidoEm: novaDataLeitura,
            }
          : capitulo
      );

      const outroUltimoCapituloLido = [...capitulosAtualizados]
        .reverse()
        .find((capitulo) => capitulo.lido) || null;
      const ultimoCapituloLido = novoStatusLido
        ? capitulosAtualizados.find(
            (capitulo) => capitulo.id === capituloAtual.id
          ) || null
        : outroUltimoCapituloLido;

      obraAtualizadaParaSupabase = {
        ...obraNormalizada,
        capitulos: capitulosAtualizados,
        ultimoCapituloLidoId: ultimoCapituloLido?.id || "",
        ultimaLeituraEm: ultimoCapituloLido?.lidoEm || "",
        progressoLeitura: calcularProgressoLeitura(capitulosAtualizados),
      };

      return obraAtualizadaParaSupabase;
    });

    const obraAtualizada = obraAtualizadaParaSupabase as ObraLocal | null;

    if (!obraAtualizada) {
      lidoCapituloSalvandoRef.current = false;
      setLidoCapituloSalvando(false);
      return;
    }

    salvarObras(novasObras);

    try {
      const progressoSincronizado = await salvarProgressoLeituraSupabase(
        obraAtualizada,
        capituloAtual.id,
        novoStatusLido
      );

      if (!progressoSincronizado) {
        salvarObras(obrasAnteriores);
        setMensagemAcao("Não foi possível atualizar o status de leitura agora.");
        return;
      }

      setMensagemAcao("");

      if (novoStatusLido) {
        void marcarNotificacaoCapituloComoLidaSupabase(
          userIdAtual,
          obraAtual.id,
          capituloAtual.id
        );

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
            progresso_obra: obraAtualizada.progressoLeitura,
            origem: "botao_lido",
          },
        });
      }
    } finally {
      lidoCapituloSalvandoRef.current = false;
      setLidoCapituloSalvando(false);
    }
  }

  async function enviarComentarioCapitulo(
    postId: string,
    textoRecebido: string,
    comentarioPaiId = ""
  ) {
    const chaveAcao = `enviar-comentario-capitulo:${postId}`;

    if (!iniciarAcaoComentariosCapitulo(chaveAcao)) {
      return false;
    }

    setComentarioStatus("");

    try {
      const userIdAtual = await obterUsuarioLogadoIdAtual();

      if (!userIdAtual) {
        setMensagemAcao("Entre na sua conta para comentar este capítulo.");
        router.push(criarLoginHrefLeitor(obraId, capituloId));
        return false;
      }

      const textoLimpo = textoRecebido.trim();

      if (!textoLimpo) {
        setComentarioStatus("Escreva um comentário antes de enviar.");
        return false;
      }

      const perfilAtual = await carregarPerfilComentarioLeitor(userIdAtual);
      setPerfilComentarioLeitor(perfilAtual);

      const comentarioPaiIdLimpo = comentarioPaiId.trim();
      const comentarioSalvo = await salvarComentarioCapituloSupabase(
        postId,
        textoLimpo,
        comentarioPaiIdLimpo
      );
      const agora = new Date().toISOString();
      const comentarioId = obterTextoRegistroLeitor(comentarioSalvo, "id");

      if (!comentarioId) {
        setComentarioStatus(
          comentarioPaiIdLimpo
            ? "Não foi possível enviar a resposta agora."
            : "Não foi possível enviar o comentário agora."
        );
        return false;
      }

      const criadoEm =
        obterTextoRegistroLeitor(comentarioSalvo, "atualizado_em") ||
        obterTextoRegistroLeitor(comentarioSalvo, "criado_em") ||
        agora;
      const novoComentario: ComentarioCapituloPublico = {
        id: comentarioId,
        userId: userIdAtual,
        nome: perfilAtual.nome || "Usuário",
        avatar: perfilAtual.avatar,
        texto: textoLimpo.slice(0, 420),
        criadoEm,
        comentarioPaiId:
          obterTextoRegistroLeitor(comentarioSalvo, "comentario_pai_id") ||
          comentarioPaiIdLimpo,
        meuComentario: true,
        curtidas: [],
      };

      atualizarCapitulo({
        comentario: textoLimpo,
      });
      setComentarioDigitado(textoLimpo);
      setComentariosCapitulo((comentariosAtuais) => [
        novoComentario,
        ...comentariosAtuais,
      ]);
      setMetricasCapitulo((metricasAtuais) => ({
        ...metricasAtuais,
        totalComentarios: metricasAtuais.totalComentarios + 1,
        carregado: true,
      }));
      setMostrarComentario(true);

      if (obraAtual && capituloAtual) {
        void registrarNotificacaoInteracaoCapituloSupabase({
          tipo: "comentario-capitulo",
          obra: obraAtual,
          capitulo: capituloAtual,
          comentarioId,
          titulo: "Novo comentário no capítulo",
          mensagem: `${perfilAtual.nome || "Um leitor"} comentou em ${capituloAtual.titulo}: ${textoLimpo.slice(0, 120)}`,
          link: criarHrefLeituraCapituloLeitor(obraAtual, capituloAtual.id),
        });
      }

      return true;
    } finally {
      finalizarAcaoComentariosCapitulo(chaveAcao);
    }
  }


  async function removerComentarioCapitulo(postId: string, comentarioId: string) {
    const chaveAcao = `remover-comentario-capitulo:${comentarioId}`;

    if (!iniciarAcaoComentariosCapitulo(chaveAcao)) {
      return;
    }

    setComentarioStatus("");

    try {
      const userIdAtual = await obterUsuarioLogadoIdAtual();

      if (!userIdAtual) {
        setMensagemAcao("Entre na sua conta para apagar seu comentário.");
        router.push(criarLoginHrefLeitor(obraId, capituloId));
        return;
      }

      const comentarioAtual = comentariosCapitulo.find(
        (comentario) => comentario.id === comentarioId
      );

      if (!comentarioAtual || comentarioAtual.userId !== userIdAtual) {
        setComentarioStatus("Você só pode remover seus próprios comentários.");
        return;
      }

      const idsParaRemover = obterIdsComentarioCapituloComRespostas(
        comentariosCapitulo,
        comentarioId
      );
      const { error } = await supabase
        .from("comentarios_capitulos")
        .delete()
        .eq("id", comentarioId)
        .eq("user_id", userIdAtual);

      if (error) {
        setComentarioStatus("Não foi possível remover o comentário agora.");
        return;
      }

      if (!comentarioAtual.comentarioPaiId) {
        atualizarCapitulo({
          comentario: "",
        });
        setComentarioDigitado("");
      }

      setComentariosCapitulo((comentariosAtuais) =>
        comentariosAtuais.filter(
          (comentario) => !idsParaRemover.has(comentario.id)
        )
      );
      setMetricasCapitulo((metricasAtuais) => ({
        ...metricasAtuais,
        totalComentarios: Math.max(
          0,
          metricasAtuais.totalComentarios - idsParaRemover.size
        ),
        carregado: true,
      }));
      void postId;
    } finally {
      finalizarAcaoComentariosCapitulo(chaveAcao);
    }
  }

  async function alternarCurtidaComentarioCapitulo(
    postId: string,
    comentarioId: string
  ) {
    const chaveAcao = `curtir-comentario-capitulo:${comentarioId}`;

    if (!iniciarAcaoComentariosCapitulo(chaveAcao)) {
      return;
    }

    setComentarioStatus("");

    try {
      const userIdAtual = await obterUsuarioLogadoIdAtual();

      if (!userIdAtual) {
        setMensagemAcao("Entre na sua conta para curtir comentários.");
        router.push(criarLoginHrefLeitor(obraId, capituloId));
        return;
      }

      const comentarioAtual = comentariosCapitulo.find(
        (comentario) => comentario.id === comentarioId
      );
      const jaCurtiu = Boolean(comentarioAtual?.curtidas.includes(userIdAtual));

      setComentariosCapitulo((comentariosAtuais) =>
        comentariosAtuais.map((comentario) => {
          if (comentario.id !== comentarioId) {
            return comentario;
          }

          return {
            ...comentario,
            curtidas: jaCurtiu
              ? comentario.curtidas.filter((curtidaId) => curtidaId !== userIdAtual)
              : Array.from(new Set([...comentario.curtidas, userIdAtual])),
          };
        })
      );
      salvarCurtidaComentarioCapituloLocal(userIdAtual, comentarioId, !jaCurtiu);

      try {
        const { error: erroLimparCurtida } = await supabase
          .from(TABELA_COMENTARIOS_CAPITULOS_CURTIDAS)
          .delete()
          .eq("comentario_id", comentarioId)
          .eq("usuario_id", userIdAtual);

        if (erroLimparCurtida) {
          throw erroLimparCurtida;
        }

        if (!jaCurtiu) {
          const { error: erroInserirCurtida } = await supabase
            .from(TABELA_COMENTARIOS_CAPITULOS_CURTIDAS)
            .insert({
              comentario_id: comentarioId,
              usuario_id: userIdAtual,
            });

          if (erroInserirCurtida) {
            throw erroInserirCurtida;
          }

          if (obraAtual && capituloAtual && comentarioAtual) {
            const perfilAtual = await carregarPerfilComentarioLeitor(userIdAtual);

            void registrarNotificacaoInteracaoCapituloSupabase({
              tipo: "curtida-comentario-capitulo",
              obra: obraAtual,
              capitulo: capituloAtual,
              comentarioId,
              titulo: "Nova curtida no comentário",
              mensagem: `${perfilAtual.nome || "Um leitor"} curtiu seu comentário em ${capituloAtual.titulo}.`,
              link: criarHrefLeituraCapituloLeitor(obraAtual, capituloAtual.id),
            });
          }
        }
      } catch (error) {
        setComentariosCapitulo((comentariosAtuais) =>
          comentariosAtuais.map((comentario) => {
            if (comentario.id !== comentarioId) {
              return comentario;
            }

            return {
              ...comentario,
              curtidas: jaCurtiu
                ? Array.from(new Set([...comentario.curtidas, userIdAtual]))
                : comentario.curtidas.filter(
                    (curtidaId) => curtidaId !== userIdAtual
                  ),
            };
          })
        );
        salvarCurtidaComentarioCapituloLocal(
          userIdAtual,
          comentarioId,
          jaCurtiu
        );
        setComentarioStatus(
          "Não foi possível atualizar a curtida do comentário agora."
        );
        console.warn("Não consegui sincronizar a curtida do comentário:", error);
      }

      void postId;
    } finally {
      finalizarAcaoComentariosCapitulo(chaveAcao);
    }
  }


  async function denunciarComentarioCapitulo(comentarioId: string) {
    const chaveAcao = `denunciar-comentario-capitulo:${comentarioId}`;

    if (!iniciarAcaoComentariosCapitulo(chaveAcao)) {
      return;
    }

    setComentarioStatus("");

    try {
      const userIdAtual = await obterUsuarioLogadoIdAtual();

      if (!userIdAtual) {
        setMensagemAcao("Entre na sua conta para denunciar comentários.");
        router.push(criarLoginHrefLeitor(obraId, capituloId));
        return;
      }

      const { error } = await supabase.from("comunidade_denuncias").insert({
        alvo_tipo: "comentario_capitulo",
        alvo_id: comentarioId,
        denunciante_id: userIdAtual,
        motivo: "Conteúdo inadequado",
        detalhe: "Comentário em capítulo",
      });

      if (error) {
        const codigoErro = (error as { code?: string }).code;

        if (codigoErro === "23505") {
          setComentarioStatus("Você já denunciou este conteúdo.");
          return;
        }

        setComentarioStatus("Não consegui enviar a denúncia agora.");
        return;
      }

    } finally {
      finalizarAcaoComentariosCapitulo(chaveAcao);
    }
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
      <main style={pageThemeStyle} aria-busy="true">
        <style>{`${historietasThemeCss}${leitorPageCss}`}</style>
        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
        <LoadingSpinner label="Carregando capítulo" />
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
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Capítulo não encontrado
          </p>
        </section>
      </main>
    );
  }

  const voltarHref = `/obra/${obraAtual.slug || criarSlugBase(obraAtual.titulo)}`;
  const statusLeituraTexto = capituloAtual.lido
    ? capituloAtual.lidoEm
      ? `Lido em ${formatarData(capituloAtual.lidoEm)}`
      : "Lido"
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
          <h1 style={titleStyle}>{capituloAtual.titulo}</h1>
          <p style={chapterViewsStyle}>
            <span aria-hidden="true">👁</span>{" "}
            {formatarContadorCapituloLeitor(
              metricasCapitulo.totalVisualizacoes
            )}{" "}
            {metricasCapitulo.totalVisualizacoes === 1
              ? "visualização"
              : "visualizações"}
          </p>
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
            <div style={settingsInfoStyle}>
              <p style={settingsInfoPrimaryStyle}>
                {obraAtual.titulo} · {obraAtual.autor}
              </p>

              <p style={settingsInfoSecondaryStyle}>
                {statusLeituraTexto} · {totalPalavras}{" "}
                {totalPalavras === 1 ? "palavra" : "palavras"}
              </p>
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
            onClick={() => void alternarCurtida()}
            disabled={curtidaCapituloSalvando}
            aria-pressed={metricasCapitulo.curtiu}
            aria-label={
              metricasCapitulo.curtiu
                ? "Remover curtida do capítulo"
                : "Curtir capítulo"
            }
            style={{
              ...(modoFoco
                ? metricasCapitulo.curtiu
                  ? focusActiveActionButtonStyle
                  : focusActionButtonStyle
                : metricasCapitulo.curtiu
                ? activeActionButtonStyle
                : actionButtonStyle),
              opacity: curtidaCapituloSalvando ? 0.72 : 1,
              cursor: curtidaCapituloSalvando ? "wait" : "pointer",
            }}
          >
            {metricasCapitulo.curtiu ? "❤️" : "🤍"}{" "}
            {formatarContadorCapituloLeitor(metricasCapitulo.totalCurtidas)}
          </button>

          <button
            type="button"
            onClick={() => void alternarSalvo()}
            disabled={salvoCapituloSalvando}
            aria-pressed={metricasCapitulo.salvo}
            aria-label={
              metricasCapitulo.salvo
                ? "Remover capítulo dos salvos"
                : "Salvar capítulo"
            }
            style={{
              ...(modoFoco
                ? metricasCapitulo.salvo
                  ? focusActiveSaveButtonStyle
                  : focusActionButtonStyle
                : metricasCapitulo.salvo
                ? activeSaveButtonStyle
                : actionButtonStyle),
              opacity: salvoCapituloSalvando ? 0.72 : 1,
              cursor: salvoCapituloSalvando ? "wait" : "pointer",
            }}
          >
            {metricasCapitulo.salvo ? "Salvo ✓" : "Salvar"}{" "}
            {formatarContadorCapituloLeitor(metricasCapitulo.totalSalvos)}
          </button>

          <button
            type="button"
            onClick={() => void alternarComentarioVisivel()}
            style={
              modoFoco
                ? mostrarComentario || metricasCapitulo.totalComentarios > 0
                  ? focusActiveCommentButtonStyle
                  : focusActionButtonStyle
                : mostrarComentario || metricasCapitulo.totalComentarios > 0
                ? activeCommentButtonStyle
                : actionButtonStyle
            }
          >
            💬 {formatarContadorCapituloLeitor(metricasCapitulo.totalComentarios)}
          </button>

          <button
            type="button"
            onClick={() => void alternarLido()}
            disabled={lidoCapituloSalvando}
            aria-pressed={capituloAtual.lido}
            aria-label={
              capituloAtual.lido
                ? "Marcar capítulo como não lido"
                : "Marcar capítulo como lido"
            }
            style={{
              ...(modoFoco
                ? capituloAtual.lido
                  ? focusActiveActionButtonStyle
                  : focusActionButtonStyle
                : capituloAtual.lido
                ? activeActionButtonStyle
                : actionButtonStyle),
              opacity: lidoCapituloSalvando ? 0.72 : 1,
              cursor: lidoCapituloSalvando ? "wait" : "pointer",
            }}
          >
            {lidoCapituloSalvando
              ? "Salvando..."
              : capituloAtual.lido
              ? "Lido ✓"
              : "Lido"}
          </button>
        </section>

        {mensagemAcao && <p style={commentStatusStyle}>{mensagemAcao}</p>}


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

      <ComentariosCapituloSheet
        key={mostrarComentario ? postComentariosCapitulo?.id || "comentarios-fechados" : "comentarios-fechados"}
        post={mostrarComentario ? postComentariosCapitulo : null}
        podeComentar={Boolean(usuarioIdLogado)}
        usuarioId={usuarioIdLogado}
        usuarioNome={perfilComentarioLeitor.nome}
        usuarioAvatar={perfilComentarioLeitor.avatar}
        erroInteracao={comentarioStatus}
        carregando={comentariosCarregando}
        isDesktop={isDesktop}
        onFechar={fecharComentariosCapitulo}
        onEnviar={enviarComentarioCapitulo}
        onCurtirComentario={alternarCurtidaComentarioCapitulo}
        onRemoverComentario={removerComentarioCapitulo}
        onDenunciarComentario={denunciarComentarioCapitulo}
      />

    </main>
  );
}

const leitorPageCss = `
  @keyframes historietas-loading-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .historietas-loading-spinner {
      animation-duration: 1.4s !important;
    }
  }

  html {
    --historietas-reader-bg-page: #070212;
    --historietas-reader-bg-deep: #04000A;
    --historietas-reader-surface: #08030F;
    --historietas-reader-bg-end: #020006;
    --historietas-reader-progress: #4C1D95;
    --historietas-reader-danger: #EF4444;
    --historietas-reader-heart: #F43F5E;
    --historietas-reader-logo-mid: #DDD6FE;
    --historietas-reader-logo-end: #A78BFA;
    --historietas-reader-secondary: #7C3AED;
    --historietas-reader-accent: #FDBA74;
    --historietas-reader-success: #86EFAC;
    --historietas-reader-danger-text: #FCA5A5;
    --historietas-reader-purple-border: rgba(59, 7, 100, 0.58);
    --historietas-reader-panel: rgba(4, 0, 10, 0.72);
    --historietas-reader-menu: rgba(18, 9, 35, 0.98);
    --historietas-reader-highlight-border: rgba(167, 139, 250, 0.34);
    --historietas-reader-publish-bg: rgba(59, 7, 100, 0.72);
    --historietas-reader-danger-surface: rgba(127,29,29,0.18);
    --historietas-reader-danger-bg: rgba(239,68,68,0.12);
    --historietas-reader-danger-border: rgba(248,113,113,0.24);
  }

  html[data-historietas-tema-visual="foco"] {
    --historietas-reader-bg-page: #000000;
    --historietas-reader-bg-deep: #000000;
    --historietas-reader-surface: #050505;
    --historietas-reader-bg-end: #000000;
    --historietas-reader-progress: #FFFFFF;
    --historietas-reader-danger: #FFFFFF;
    --historietas-reader-heart: #FFFFFF;
    --historietas-reader-logo-mid: #FFFFFF;
    --historietas-reader-logo-end: #FFFFFF;
    --historietas-reader-secondary: #A1A1AA;
    --historietas-reader-accent: #FFFFFF;
    --historietas-reader-success: #FFFFFF;
    --historietas-reader-danger-text: #FFFFFF;
    --historietas-reader-purple-border: rgba(255,255,255,0.18);
    --historietas-reader-panel: rgba(5,5,5,0.92);
    --historietas-reader-menu: #000000;
    --historietas-reader-highlight-border: rgba(255,255,255,0.26);
    --historietas-reader-publish-bg: #000000;
    --historietas-reader-danger-surface: rgba(255,255,255,0.08);
    --historietas-reader-danger-bg: rgba(255,255,255,0.06);
    --historietas-reader-danger-border: rgba(255,255,255,0.18);
  }

  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #070212 !important;
  }

  html[data-historietas-tema-visual="foco"] body,
  html[data-historietas-tema-visual="foco"] main {
    background: #000000 !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] main > div[aria-hidden="true"] {
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

  body[data-historietas-reader-focus="true"] {
    background: #000000 !important;
    --historietas-reader-bg-page: #000000;
    --historietas-reader-bg-deep: #000000;
    --historietas-reader-surface: #050505;
    --historietas-reader-bg-end: #000000;
    --historietas-reader-progress: #FFFFFF;
    --historietas-reader-danger: #FFFFFF;
    --historietas-reader-heart: #FFFFFF;
    --historietas-reader-logo-mid: #FFFFFF;
    --historietas-reader-logo-end: #FFFFFF;
    --historietas-reader-secondary: #A1A1AA;
    --historietas-reader-accent: #FFFFFF;
    --historietas-reader-success: #FFFFFF;
    --historietas-reader-danger-text: #FFFFFF;
    --historietas-reader-purple-border: rgba(255,255,255,0.18);
    --historietas-reader-panel: rgba(5,5,5,0.92);
    --historietas-reader-menu: #000000;
    --historietas-reader-highlight-border: rgba(255,255,255,0.26);
    --historietas-reader-publish-bg: #000000;
    --historietas-reader-danger-surface: rgba(255,255,255,0.08);
    --historietas-reader-danger-bg: rgba(255,255,255,0.06);
    --historietas-reader-danger-border: rgba(255,255,255,0.18);
  }
`;

const focusBottomNavigationCss = `
  body[data-historietas-reader-focus="true"] {
    --historietas-accent: #FFFFFF;
    --historietas-secondary: #A1A1AA;
    --historietas-bg-start: #000000;
    --historietas-bg-mid: #000000;
    --historietas-bg-end: #000000;
    --historietas-glow-primary: transparent;
    --historietas-glow-secondary: transparent;
    --historietas-text-primary: #FFFFFF;
    --historietas-text-secondary: #D4D4D8;
    --historietas-surface: #050505;
    --historietas-surface-strong: #000000;
    --historietas-border-soft: rgba(255,255,255,0.12);
    --historietas-input-bg: #000000;
    --historietas-input-text: #FFFFFF;
    --historietas-title-from: #FFFFFF;
    --historietas-title-mid: #FFFFFF;
    --historietas-title-to: #FFFFFF;
    --historietas-secondary-surface: rgba(255,255,255,0.06);
    --historietas-secondary-button-text: #FFFFFF;
    --historietas-danger-surface: rgba(255,255,255,0.08);
    --historietas-danger-button-text: #FFFFFF;
    --historietas-logo-shadow: none;
    --historietas-card-shadow: none;
    --historietas-hero-shadow: none;
    --historietas-bottom-nav-bg: #000000;
    --historietas-bottom-nav-border: rgba(255,255,255,0.18);
    --historietas-bottom-nav-shadow: none;
    --historietas-bottom-nav-text: #A1A1AA;
    --historietas-bottom-nav-hover-bg: rgba(255,255,255,0.08);
    --historietas-bottom-nav-hover-text: #FFFFFF;
    --historietas-bottom-nav-icon-text: #FFFFFF;
    --historietas-bottom-nav-icon-bg: #050505;
    --historietas-bottom-nav-icon-border: rgba(255,255,255,0.18);
    --historietas-bottom-nav-main-bg: #000000;
    --historietas-bottom-nav-main-border: #FFFFFF;
  }

  body[data-historietas-reader-focus="true"] article,
  body[data-historietas-reader-focus="true"] article p,
  body[data-historietas-reader-focus="true"] h1,
  body[data-historietas-reader-focus="true"] h2,
  body[data-historietas-reader-focus="true"] p {
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
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
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
  }

  body[data-historietas-reader-focus="true"] nav,
  body[data-historietas-reader-focus="true"] [data-bottom-nav],
  body[data-historietas-reader-focus="true"] [data-mobile-nav],
  body[data-historietas-reader-focus="true"] nav[aria-label*="Navegação"],
  body[data-historietas-reader-focus="true"] nav[aria-label*="navegação"],
  body[data-historietas-reader-focus="true"] div:has(a[href="/publicar"]):has(a[href="/perfil-autor?aba=biblioteca"]) {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.18) !important;
    box-shadow: none !important;
    color: #A1A1AA !important;
  }

  body[data-historietas-reader-focus="true"] nav a,
  body[data-historietas-reader-focus="true"] [data-bottom-nav] a,
  body[data-historietas-reader-focus="true"] [data-mobile-nav] a,
  body[data-historietas-reader-focus="true"] nav button,
  body[data-historietas-reader-focus="true"] [data-bottom-nav] button,
  body[data-historietas-reader-focus="true"] [data-mobile-nav] button,
  body[data-historietas-reader-focus="true"] div:has(a[href="/publicar"]):has(a[href="/perfil-autor?aba=biblioteca"]) a,
  body[data-historietas-reader-focus="true"] div:has(a[href="/publicar"]):has(a[href="/perfil-autor?aba=biblioteca"]) button {
    color: #A1A1AA !important;
    box-shadow: none !important;
  }

  body[data-historietas-reader-focus="true"] nav a[href="/publicar"],
  body[data-historietas-reader-focus="true"] [data-bottom-nav] a[href="/publicar"],
  body[data-historietas-reader-focus="true"] [data-mobile-nav] a[href="/publicar"],
  body[data-historietas-reader-focus="true"] div:has(a[href="/publicar"]):has(a[href="/perfil-autor?aba=biblioteca"]) a[href="/publicar"] {
    background: #000000 !important;
    border-color: #FFFFFF !important;
    color: #FFFFFF !important;
  }

  body[data-historietas-reader-focus="true"] .historietas-bottom-nav-icon {
    background: #050505 !important;
    border-color: rgba(255,255,255,0.18) !important;
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

const loadingPageStyle: CSSProperties = {
  position: "relative",
  zIndex: 2,
  width: "100%",
  minHeight: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

const loadingInlineStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "18px",
  height: "18px",
  lineHeight: 1,
  verticalAlign: "middle",
  boxSizing: "border-box",
};

const loadingSpinnerStyle: CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "999px",
  border: "3px solid rgba(255,255,255,0.20)",
  borderTopColor: "#FFFFFF",
  boxSizing: "border-box",
  animation: "historietas-loading-spin 0.78s linear infinite",
  flex: "0 0 auto",
};

const loadingSpinnerCompactStyle: CSSProperties = {
  ...loadingSpinnerStyle,
  width: "18px",
  height: "18px",
  borderWidth: "2px",
};

const pageStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  minHeight: "100vh",
  maxWidth: "100vw",
  overflowX: "hidden",
  background: "var(--historietas-reader-bg-page, #070212)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  boxSizing: "border-box",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const focusPageStyle: CSSProperties = {
  ...pageStyle,
  background: "#000000",
  color: "#FFFFFF",
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
  background: "var(--historietas-reader-progress, #4C1D95)",
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
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-reader-surface, #08030F)",
  color: "#FFFFFF",
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
  border: "2px solid var(--historietas-bg-start, var(--historietas-reader-bg-page, #070212))",
  background: "var(--historietas-reader-danger, #EF4444)",
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
  background: "var(--historietas-reader-bg-deep, #04000A)",
  color: "#FFFFFF",
  fontSize: "19px",
  fontWeight: 950,
  letterSpacing: 0,
  flex: "0 0 auto",
  border: "1px solid var(--historietas-reader-purple-border, rgba(59, 7, 100, 0.58))",
  boxShadow: "none",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, var(--historietas-reader-logo-mid, #DDD6FE) 44%, var(--historietas-reader-logo-end, #A78BFA) 100%)",
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
  background: "var(--historietas-reader-surface, #08030F)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
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
  background: "var(--historietas-reader-surface, #08030F)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
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
  background: "var(--historietas-reader-surface, #08030F)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
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
};

const chapterHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "14px",
  borderRadius: "28px",
  background: "linear-gradient(135deg, var(--historietas-reader-bg-page, #070212) 0%, var(--historietas-reader-bg-deep, #04000A) 58%, var(--historietas-reader-bg-end, #020006) 100%)",
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

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(28px, 8vw, 42px)",
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  textAlign: "center",
  maxWidth: "100%",
  background: "none",
  WebkitBackgroundClip: "initial",
  backgroundClip: "initial",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
  ...safeTextStyle,
};

const chapterViewsStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.4,
  fontWeight: 800,
  letterSpacing: "0.01em",
  textAlign: "center",
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
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  fontWeight: 850,
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
  background: "var(--historietas-reader-panel, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  minWidth: 0,
  overflow: "hidden",
};

const readingStatNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, var(--historietas-reader-accent, #FDBA74))",
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
  background: "var(--historietas-reader-panel, rgba(4, 0, 10, 0.72))",
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

const settingsInfoStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  margin: "0 2px 2px",
  minWidth: 0,
  textAlign: "center",
};

const settingsInfoPrimaryStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "11px",
  lineHeight: 1.35,
  fontWeight: 900,
  ...safeTextStyle,
};

const settingsInfoSecondaryStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  lineHeight: 1.35,
  fontWeight: 800,
  ...safeTextStyle,
};

const chapterSelectStyle: CSSProperties = {
  width: "100%",
  minHeight: "40px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-reader-bg-deep, #04000A)",
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
  color: "#FFFFFF",
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
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-reader-surface, #08030F)",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxShadow: "none",
};

const focusFontScaleButtonStyle: CSSProperties = {
  ...fontScaleButtonStyle,
};

const fontScaleButtonActiveStyle: CSSProperties = {
  ...fontScaleButtonStyle,
  border: "1px solid rgba(255,255,255,0.18)",
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
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-reader-surface, #08030F)",
  color: "#FFFFFF",
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
  border: "1px solid rgba(255,255,255,0.18)",
};

const focusMutedSettingsActionStyle: CSSProperties = {
  ...settingsActionStyle,
};

const focusActionActiveStyle: CSSProperties = {
  ...settingsActionStyle,
  border: "1px solid rgba(255,255,255,0.18)",
};

const textCardStyle: CSSProperties = {
  marginTop: "10px",
  padding: "14px 12px",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};

const focusTextCardStyle: CSSProperties = {
  ...textCardStyle,
  background: "transparent",
  border: "none",
};

const chapterTextStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
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
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const actionButtonStyle: CSSProperties = {
  minHeight: "38px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-reader-surface, #08030F)",
  color: "#FFFFFF",
  fontSize: "10.5px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "none",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 8px",
  lineHeight: 1.05,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const activeActionButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  border: "1px solid rgba(255,255,255,0.18)",
};

const activeSaveButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  border: "1px solid rgba(255,255,255,0.18)",
};

const activeCommentButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  border: "1px solid rgba(255,255,255,0.18)",
};

const focusReaderActionsStyle: CSSProperties = {
  ...readerActionsStyle,
};

const focusActionButtonStyle: CSSProperties = {
  ...actionButtonStyle,
};

const focusActiveActionButtonStyle: CSSProperties = {
  ...focusActionButtonStyle,
  border: "1px solid rgba(255,255,255,0.18)",
};

const focusActiveSaveButtonStyle: CSSProperties = {
  ...focusActionButtonStyle,
  border: "1px solid rgba(255,255,255,0.18)",
};

const focusActiveCommentButtonStyle: CSSProperties = {
  ...focusActionButtonStyle,
  border: "1px solid rgba(255,255,255,0.18)",
};

const commentStatusStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-reader-success, #86EFAC)",
  fontSize: "11px",
  fontWeight: 850,
  ...safeTextStyle,
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
  background: "rgba(3, 2, 8, 0.42)",
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
  gridTemplateRows: "auto auto minmax(0, 1fr) auto auto auto",
  gap: "7px",
  padding: "5px 12px calc(10px + env(safe-area-inset-bottom))",
  borderRadius: "28px 28px 0 0",
  background: "var(--historietas-reader-bg-page, #070212)",
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
  border: "1px solid rgba(255,255,255,0.12)",
  background: "var(--historietas-reader-menu, rgba(18, 9, 35, 0.98))",
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
  background: "rgba(255,255,255,0.12)",
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
  borderLeft: "1px solid rgba(255,255,255,0.08)",
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
  background: "rgba(255,255,255,0.22)",
};

const commentAvatarStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-reader-bg-deep, #04000A)",
  border: "1px solid var(--historietas-reader-purple-border, rgba(59, 7, 100, 0.58))",
  color: "#FFFFFF",
  fontSize: "12.5px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  boxShadow: "none",
  flex: "0 0 auto",
  overflow: "hidden",
  boxSizing: "border-box",
};

const commentAvatarLinkStyle: CSSProperties = {
  ...commentAvatarStyle,
  textDecoration: "none",
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

const commentAuthorStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 950,
};

const commentAuthorLinkStyle: CSSProperties = {
  ...commentAuthorStyle,
  textDecoration: "none",
  cursor: "pointer",
  ...safeTextStyle,
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
  color: "var(--historietas-danger-button-text, var(--historietas-reader-danger-text, #FCA5A5))",
  fontSize: "10.5px",
  fontWeight: 900,
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

const commentsLoadingStyle: CSSProperties = {
  width: "100%",
  minHeight: "58px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

const emptyCommentsStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 800,
  textAlign: "center",
};

const commentsSheetErrorStyle: CSSProperties = {
  display: "block",
  padding: "8px 10px",
  borderRadius: "14px",
  background: "var(--historietas-danger-surface, var(--historietas-reader-danger-bg, rgba(239,68,68,0.12)))",
  border: "1px solid var(--historietas-reader-danger-border, rgba(248,113,113,0.24))",
  color: "var(--historietas-danger-button-text, var(--historietas-reader-danger-text, #FCA5A5))",
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
  background: "var(--historietas-reader-bg-deep, #04000A)",
  border: "1px solid var(--historietas-reader-purple-border, rgba(59, 7, 100, 0.58))",
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
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-reader-bg-deep, #04000A)",
  color: "#FFFFFF",
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
    "1px solid var(--historietas-bottom-nav-publish-border, var(--historietas-reader-highlight-border, rgba(167, 139, 250, 0.34)))",
  background:
    "var(--historietas-bottom-nav-publish-bg, var(--historietas-reader-publish-bg, rgba(59, 7, 100, 0.72)))",
  color: "#FFFFFF",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  fontFamily: "inherit",
  padding: 0,
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
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-reader-surface, #08030F)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 8px",
  lineHeight: 1.05,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

const chapterNavButtonPrimaryStyle: CSSProperties = {
  ...chapterNavButtonStyle,
  border: "1px solid rgba(255,255,255,0.18)",
};

const returnToWorkButtonStyle: CSSProperties = {
  ...chapterNavButtonStyle,
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
};

const focusChapterNavButtonPrimaryStyle: CSSProperties = {
  ...focusChapterNavButtonStyle,
  border: "1px solid rgba(255,255,255,0.18)",
};

const focusReturnToWorkButtonStyle: CSSProperties = {
  ...focusChapterNavButtonStyle,
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
  background: "var(--historietas-reader-panel, rgba(4, 0, 10, 0.72))",
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
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
};

const desktopTextCardStyle: CSSProperties = {
  ...textCardStyle,
  marginTop: "12px",
  padding: "24px 28px",
  borderRadius: 0,
};

const desktopFocusTextCardStyle: CSSProperties = {
  ...desktopTextCardStyle,
  background: "transparent",
  border: "none",
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

const desktopChapterNavigationStyle: CSSProperties = {
  ...chapterNavigationStyle,
  marginTop: "12px",
  gap: "8px",
};

const desktopFocusChapterNavigationStyle: CSSProperties = {
  ...desktopChapterNavigationStyle,
};