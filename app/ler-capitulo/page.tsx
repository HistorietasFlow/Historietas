"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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
  curtidas: string[];
};

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

type TamanhoFonte = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

type PreferenciasLeitura = {
  tamanhoFonte: TamanhoFonte;
  modoFoco: boolean;
  mostrarLinhaProgresso: boolean;
};

type MetricasCapituloLeitor = {
  totalCurtidas: number;
  totalSalvos: number;
  totalComentarios: number;
  curtiu: boolean;
  salvo: boolean;
  carregado: boolean;
};

const metricasCapituloVazias: MetricasCapituloLeitor = {
  totalCurtidas: 0,
  totalSalvos: 0,
  totalComentarios: 0,
  curtiu: false,
  salvo: false,
  carregado: false,
};

const FONT_SCALE_VALUES: TamanhoFonte[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const STORAGE_KEY = "historietas-obras";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const VIEWED_WORKS_STORAGE_KEY = "historietas-obras-visualizacoes";
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
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [];
  }

  try {
    const listaTexto = lerStorageUsuarioLeitor(chave, userIdLimpo);
    const listaJson: unknown = listaTexto ? JSON.parse(listaTexto) : [];
    const listaNormalizada = normalizarListaIds(listaJson);

    salvarJsonStorageUsuarioLeitor(chave, userIdLimpo, listaNormalizada);

    return listaNormalizada;
  } catch {
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
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return;
  }

  try {
    const chaveObra = obra.id || obra.slug || normalizarTexto(obra.titulo);

    if (!chaveObra) {
      return;
    }

    const visualizacoesTexto = lerStorageUsuarioLeitor(
      VIEWED_WORKS_STORAGE_KEY,
      userIdLimpo
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
      userIdLimpo,
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
    publicado: Boolean(capitulo.publicado),
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
    obraLocal,
    usuarioEhDono
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


function criarMetricasCapituloLocais(
  capitulo: CapituloLocal | null,
  totalComentarios = 0
): MetricasCapituloLeitor {
  if (!capitulo) {
    return metricasCapituloVazias;
  }

  return {
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
) {
  try {
    const { count, error } = await supabase
      .from(tabela)
      .select("capitulo_id", { count: "exact", head: true })
      .eq("capitulo_id", capituloId);

    if (error) {
      return 0;
    }

    return Math.max(0, count ?? 0);
  } catch {
    return 0;
  }
}

async function usuarioTemRegistroCapituloLeitor(
  tabela: "curtidas_capitulos" | "salvos_capitulos",
  capituloId: string,
  userId: string
) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return false;
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
      return false;
    }

    return Boolean(data);
  } catch {
    return false;
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
    totalCurtidas,
    totalSalvos,
    totalComentarios,
    curtiu,
    salvo,
  ] = await Promise.all([
    contarRegistrosCapituloLeitor("curtidas_capitulos", capituloId),
    contarRegistrosCapituloLeitor("salvos_capitulos", capituloId),
    contarRegistrosCapituloLeitor("comentarios_capitulos", capituloId),
    usuarioTemRegistroCapituloLeitor("curtidas_capitulos", capituloId, userId),
    usuarioTemRegistroCapituloLeitor("salvos_capitulos", capituloId, userId),
  ]);

  return {
    totalCurtidas: Math.max(totalCurtidas, capitulo.curtiu ? 1 : 0),
    totalSalvos: Math.max(totalSalvos, capitulo.salvo ? 1 : 0),
    totalComentarios: Math.max(totalComentarios, totalComentariosFallback),
    curtiu: curtiu || capitulo.curtiu,
    salvo: salvo || capitulo.salvo,
    carregado: true,
  };
}

function formatarContadorCapituloLeitor(valor: number) {
  return Math.max(0, Math.round(valor)).toLocaleString("pt-BR");
}

async function salvarComentarioCapituloSupabase(
  capituloId: string,
  comentario: string
): Promise<Record<string, unknown> | null> {
  try {
    const { data: dadosUsuario } = await supabase.auth.getUser();
    const userId = dadosUsuario.user?.id || "";
    const capituloIdLimpo = capituloId.trim();
    const comentarioLimpo = comentario.trim();
    const agora = new Date().toISOString();

    if (!userId || !capituloIdLimpo || !comentarioLimpo) {
      return null;
    }

    const payloadBase = {
      user_id: userId,
      capitulo_id: capituloIdLimpo,
      comentario: comentarioLimpo.slice(0, 420),
    };

    const { data: comentarioComAtualizacao, error: erroComAtualizacao } =
      await supabase
        .from("comentarios_capitulos")
        .insert({
          ...payloadBase,
          atualizado_em: agora,
        })
        .select("id,user_id,comentario,atualizado_em,criado_em")
        .single();

    if (!erroComAtualizacao && comentarioComAtualizacao) {
      return comentarioComAtualizacao as Record<string, unknown>;
    }

    const { data: comentarioSemAtualizacao, error: erroSemAtualizacao } =
      await supabase
        .from("comentarios_capitulos")
        .insert(payloadBase)
        .select("id,user_id,comentario,criado_em")
        .single();

    if (!erroSemAtualizacao && comentarioSemAtualizacao) {
      return comentarioSemAtualizacao as Record<string, unknown>;
    }

    throw erroSemAtualizacao || erroComAtualizacao;
  } catch (error) {
    console.warn("Não consegui salvar comentário do capítulo no Supabase:", error);
    return null;
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

    const comentariosComAtualizacao = await supabase
      .from("comentarios_capitulos")
      .select("id,user_id,comentario,atualizado_em,criado_em")
      .eq("capitulo_id", capituloIdLimpo)
      .order("atualizado_em", { ascending: true })
      .limit(500);

    data = Array.isArray(comentariosComAtualizacao.data)
      ? (comentariosComAtualizacao.data as Record<string, unknown>[])
      : null;
    error = comentariosComAtualizacao.error;

    if (error || !Array.isArray(data)) {
      const comentariosSemAtualizacao = await supabase
        .from("comentarios_capitulos")
        .select("id,user_id,comentario,criado_em")
        .eq("capitulo_id", capituloIdLimpo)
        .order("criado_em", { ascending: true })
        .limit(500);

      data = Array.isArray(comentariosSemAtualizacao.data)
        ? (comentariosSemAtualizacao.data as Record<string, unknown>[])
        : null;
      error = comentariosSemAtualizacao.error;
    }

    if (error || !Array.isArray(data)) {
      return [];
    }

    const registros = (data as Record<string, unknown>[]).filter(
      (registro) => Boolean(obterTextoRegistroLeitor(registro, "comentario"))
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
        const texto = obterTextoRegistroLeitor(registro, "comentario");

        if (!userId || !texto) {
          return null;
        }

        return {
          id: idComentario,
          userId,
          nome: nome.slice(0, 80),
          avatar: obterAvatarProfileLeitor(profile) || avatarUsuarioLogado,
          texto: texto.slice(0, 420),
          criadoEm:
            obterTextoRegistroLeitor(registro, "atualizado_em") ||
            obterTextoRegistroLeitor(registro, "criado_em"),
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


type ComentariosCapituloSheetProps = {
  post: ComentariosCapituloPost | null;
  podeComentar: boolean;
  usuarioId: string;
  usuarioNome: string;
  usuarioAvatar: string;
  onFechar: () => void;
  onEnviar: (postId: string, texto: string) => boolean | Promise<boolean>;
  onCurtirComentario: (postId: string, comentarioId: string) => void | Promise<void>;
  onRemoverComentario: (postId: string, comentarioId: string) => void | Promise<void>;
  onDenunciarComentario: (comentarioId: string) => void | Promise<void>;
};

function ComentariosCapituloSheet({
  post,
  podeComentar,
  usuarioId,
  usuarioNome,
  usuarioAvatar,
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
                usuarioId && comentario.userId === usuarioId
              );
              const podeDenunciarComentario = Boolean(
                usuarioId && comentario.userId !== usuarioId
              );
              const comentarioCurtindo = comentarioCurtindoId === comentario.id;
              const comentarioRemovendo = comentarioRemovendoId === comentario.id;
              const comentarioDenunciando =
                comentarioDenunciandoId === comentario.id;

              return (
                <article key={comentario.id} style={commentSheetItemStyle}>
                  <Link
                    href={criarHrefPerfilUsuarioLeitor(
                      comentario.userId,
                      comentario.nome
                    )}
                    aria-label={`Abrir perfil de ${comentario.nome}`}
                    style={criarAvatarComentarioBaseStyle(
                      commentSheetAvatarLinkStyle,
                      comentario.avatar
                    )}
                  >
                    {!comentario.avatar && comentario.nome.slice(0, 1).toUpperCase()}
                  </Link>

                  <div style={commentSheetContentStyle}>
                    <div style={commentSheetTopLineStyle}>
                      <Link
                        href={criarHrefPerfilUsuarioLeitor(
                          comentario.userId,
                          comentario.nome
                        )}
                        style={commentSheetAuthorLinkStyle}
                      >
                        {comentario.nome}
                      </Link>
                      <span style={commentSheetTimeStyle}>agora</span>
                    </div>

                    <p style={commentSheetTextStyle}>{comentario.texto}</p>

                    <div style={commentSheetActionsRowStyle}>
                      <button
                        type="button"
                        onClick={() => responderComentario(comentario.nome)}
                        disabled={!podeComentar}
                        style={{
                          ...commentSheetReplyButtonStyle,
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
                            ...commentSheetRemoveButtonStyle,
                            opacity: comentarioRemovendo ? 0.58 : 1,
                            cursor: comentarioRemovendo ? "not-allowed" : "pointer",
                          }}
                        >
                          Remover
                        </button>
                      )}

                      {podeDenunciarComentario && (
                        <button
                          type="button"
                          onClick={() => denunciarComentarioSeguro(comentario.id)}
                          disabled={comentarioDenunciando}
                          style={{
                            ...commentSheetReportButtonStyle,
                            opacity: comentarioDenunciando ? 0.58 : 1,
                            cursor: comentarioDenunciando ? "not-allowed" : "pointer",
                          }}
                        >
                          Denunciar
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={commentSheetLikeWrapStyle}>
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
                        ...commentSheetLikeButtonStyle,
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
                        style={commentSheetHeartIconStyle}
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

                    <span style={commentSheetLikeCountStyle}>
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
}

export default function LerCapituloPage() {
  const router = useRouter();
  const [obraId, setObraId] = useState("");
  const [capituloId, setCapituloId] = useState("");
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [, setComentarioDigitado] = useState("");
  const [, setComentarioStatus] = useState("");
  const [comentariosCapitulo, setComentariosCapitulo] = useState<ComentarioCapituloPublico[]>([]);
  const [metricasCapitulo, setMetricasCapitulo] =
    useState<MetricasCapituloLeitor>(metricasCapituloVazias);
  const [comentariosCarregando, setComentariosCarregando] = useState(false);
  const [perfilComentarioLeitor, setPerfilComentarioLeitor] =
    useState<PerfilComentarioLeitor>({
      userId: "",
      nome: "Usuário",
      avatar: "",
    });
  const [mensagemAcao, setMensagemAcao] = useState("");
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const { notificacoesNaoLidas } = useNotificacoes();
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
  const acoesComentariosCapituloRef = useRef<Set<string>>(new Set<string>());

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
          } else if (
            idObraSupabaseValido(obraIdParam) &&
            !Boolean(obraLocal && userId && obterAutorIdSeguro(obraLocal) === userId)
          ) {
            obrasAtualizadas = obrasLocais.filter((obra) => obra.id !== obraIdParam);
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
            setComentariosCarregando(false);
          }
        }, 0);
        return;
      }

      setComentariosCarregando(true);

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

  useEffect(() => {
    let cancelado = false;

    async function carregarMetricasCapituloAtual() {
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

      setMetricasCapitulo(metricasReais);

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

  const obraFavorita = obraAtual ? obrasFavoritas.includes(obraAtual.id) : false;
  const obraConcluida = obraAtual
    ? obrasConcluidas.includes(obraAtual.id)
    : false;
  const totalPalavras = capituloAtual ? contarPalavras(capituloAtual.texto) : 0;
  const tempoLeitura = capituloAtual ? calcularTempoLeitura(capituloAtual.texto) : 0;
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
      setComentariosCarregando(false);
      setMetricasCapitulo(metricasCapituloVazias);
      return;
    }

    setComentariosCarregando(true);

    const comentarios = await carregarComentariosCapituloSupabase(
      capituloAtual.id,
      usuarioIdLogado,
    );

    setComentariosCapitulo(comentarios);
    setComentariosCarregando(false);

    const metricas = await carregarMetricasCapituloSupabase(
      capituloAtual,
      usuarioIdLogado,
      comentarios.length
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

  async function recarregarMetricasCapituloAtual() {
    if (!capituloAtual) {
      setMetricasCapitulo(metricasCapituloVazias);
      return;
    }

    const metricas = await carregarMetricasCapituloSupabase(
      capituloAtual,
      usuarioIdLogado,
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
    if (!capituloAtual) {
      return;
    }

    if (!(await exigirLogin("Entre na sua conta para curtir este capítulo."))) {
      return;
    }

    const userIdAtual = usuarioIdLogado || (await obterUsuarioLogadoIdAtual());
    const perfilAtual = userIdAtual
      ? await carregarPerfilComentarioLeitor(userIdAtual)
      : null;
    const novoStatusCurtida = !metricasCapitulo.curtiu;

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

    if (curtidaSalva) {
      void recarregarMetricasCapituloAtual();
    }

    if (curtidaSalva && novoStatusCurtida && obraAtual) {
      void registrarNotificacaoInteracaoCapituloSupabase({
        tipo: "curtida-capitulo",
        obra: obraAtual,
        capitulo: capituloAtual,
        titulo: "Nova curtida no capítulo",
        mensagem: `${perfilAtual?.nome || "Um leitor"} curtiu ${capituloAtual.titulo}.`,
        link: criarHrefLeituraCapituloLeitor(obraAtual, capituloAtual.id),
      });
    }
  }

  async function alternarSalvo() {
    if (!capituloAtual) {
      return;
    }

    if (!(await exigirLogin("Entre na sua conta para salvar este capítulo."))) {
      return;
    }

    const novoStatusSalvo = !metricasCapitulo.salvo;

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

    if (salvoSincronizado) {
      void recarregarMetricasCapituloAtual();
    }

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

  async function enviarComentarioCapitulo(postId: string, textoRecebido: string) {
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

      const comentarioSalvo = await salvarComentarioCapituloSupabase(
        postId,
        textoLimpo
      );
      const agora = new Date().toISOString();
      const comentarioId = obterTextoRegistroLeitor(comentarioSalvo, "id");

      if (!comentarioId) {
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
        meuComentario: true,
        curtidas: [],
      };

      atualizarCapitulo({
        comentario: textoLimpo,
      });
      setComentarioDigitado(textoLimpo);
      setComentariosCapitulo((comentariosAtuais) => [
        ...comentariosAtuais,
        novoComentario,
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

      void recarregarComentariosCapituloAtual();
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


      atualizarCapitulo({
        comentario: "",
      });
      setComentarioDigitado("");

      const { error } = await supabase
        .from("comentarios_capitulos")
        .delete()
        .eq("id", comentarioId)
        .eq("user_id", userIdAtual);

      if (error) {
        const comentarioSincronizado = await salvarComentarioCapituloSupabase(
          postId,
          ""
        );

        if (!comentarioSincronizado) {
          setComentarioStatus(
            "Comentário apagado do aparelho, mas não sincronizado agora."
          );
          return;
        }
      }

      setComentariosCapitulo((comentariosAtuais) =>
        comentariosAtuais.filter((comentario) => comentario.id !== comentarioId)
      );
      setMetricasCapitulo((metricasAtuais) => ({
        ...metricasAtuais,
        totalComentarios: Math.max(0, metricasAtuais.totalComentarios - 1),
        carregado: true,
      }));
      await recarregarComentariosCapituloAtual();
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
        await recarregarComentariosCapituloAtual();
      } catch (error) {
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
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${leitorPageCss}`}</style>
        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
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

          <h1 style={titleStyle}>{capituloAtual.titulo}</h1>

          <p style={metaStyle}>
            {obraAtual.titulo}{" "}
            <Link href={perfilAutorHref} style={metaAuthorLinkStyle}>
              Por {obraAtual.autor}
            </Link>
          </p>

          <p style={statusMetaLineStyle}>
            <span style={statusBadgeStyle}>{statusLeituraTexto}</span>{" "}
            <span style={metaReadingStatsStyle}>
              {tempoLeitura > 0 ? `${tempoLeitura}min` : "tempo não informado"} {totalPalavras} palavras
            </span>
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
                ? metricasCapitulo.curtiu
                  ? focusActiveActionButtonStyle
                  : focusActionButtonStyle
                : metricasCapitulo.curtiu
                ? activeActionButtonStyle
                : actionButtonStyle
            }
          >
            {metricasCapitulo.curtiu ? "♥ Curtido" : "♡ Curtir"}{" "}
            {formatarContadorCapituloLeitor(metricasCapitulo.totalCurtidas)}
          </button>

          <button
            type="button"
            onClick={alternarSalvo}
            style={
              modoFoco
                ? metricasCapitulo.salvo
                  ? focusActiveSaveButtonStyle
                  : focusActionButtonStyle
                : metricasCapitulo.salvo
                ? activeSaveButtonStyle
                : actionButtonStyle
            }
          >
            {metricasCapitulo.salvo ? "✓ Salvo" : "Salvar capítulo"}{" "}
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
        post={mostrarComentario ? postComentariosCapitulo : null}
        podeComentar={Boolean(usuarioIdLogado)}
        usuarioId={usuarioIdLogado}
        usuarioNome={perfilComentarioLeitor.nome}
        usuarioAvatar={perfilComentarioLeitor.avatar}
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
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#08030F",
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
  background: "#08030F",
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
  background: "#08030F",
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
  background: "#08030F",
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
  color: "var(--historietas-text-secondary, #D4D4D8)",
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
  background: "none",
  WebkitBackgroundClip: "initial",
  backgroundClip: "initial",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
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

const statusLinkBadgeStyle: CSSProperties = {
  ...statusBadgeStyle,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  textDecoration: "none",
};

const metaAuthorLinkStyle: CSSProperties = {
  ...statusLinkBadgeStyle,
  fontSize: "11px",
  lineHeight: 1.35,
  fontWeight: 750,
};

const statusMetaLineStyle: CSSProperties = {
  ...statusRowStyle,
  margin: 0,
  gap: "4px",
};

const metaReadingStatsStyle: CSSProperties = {
  ...metaStyle,
  fontSize: "9px",
  fontWeight: 850,
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
  color: "var(--historietas-text-secondary, #D4D4D8)",
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
  background: "#08030F",
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
  background: "#08030F",
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

const settingsLinkStyle: CSSProperties = {
  ...settingsActionStyle,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
};

const focusSettingsLinkStyle: CSSProperties = {
  ...settingsLinkStyle,
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
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#08030F",
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
  color: "#86EFAC",
  fontSize: "11px",
  fontWeight: 850,
  ...safeTextStyle,
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

const commentSheetItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr) 26px",
  gap: "10px",
  alignItems: "start",
  minWidth: 0,
};

const commentSheetAvatarStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#04000A",
  color: "#FFFFFF",
  fontSize: "12.5px",
  fontWeight: 950,
  flex: "0 0 auto",
  border: "1px solid rgba(59, 7, 100, 0.58)",
  boxShadow: "none",
};

const commentSheetAvatarLinkStyle: CSSProperties = {
  ...commentSheetAvatarStyle,
  textDecoration: "none",
  cursor: "pointer",
};

const commentSheetContentStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  minWidth: 0,
};

const commentSheetTopLineStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "6px",
  minWidth: 0,
};

const commentSheetAuthorStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 950,
};

const commentSheetAuthorLinkStyle: CSSProperties = {
  ...commentSheetAuthorStyle,
  textDecoration: "none",
  cursor: "pointer",
};

const commentSheetTimeStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  fontWeight: 750,
};

const commentSheetTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12.5px",
  lineHeight: 1.38,
  fontWeight: 750,
  ...safeTextStyle,
};

const commentSheetActionsRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const commentSheetReplyButtonStyle: CSSProperties = {
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

const commentSheetRemoveButtonStyle: CSSProperties = {
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

const commentSheetReportButtonStyle: CSSProperties = {
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

const commentSheetLikeWrapStyle: CSSProperties = {
  minWidth: "28px",
  display: "grid",
  justifyItems: "center",
  alignContent: "start",
  gap: "2px",
};

const commentSheetLikeButtonStyle: CSSProperties = {
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

const commentSheetLikeCountStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  lineHeight: 1,
  minHeight: "10px",
  textAlign: "center",
};

const commentSheetHeartIconStyle: CSSProperties = {
  width: "19px",
  height: "19px",
  display: "block",
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
  borderRadius: "11px",
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
  ...commentInputStyle,
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
  background: "#08030F",
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

const desktopChapterNavigationStyle: CSSProperties = {
  ...chapterNavigationStyle,
  marginTop: "12px",
  gap: "8px",
};

const desktopFocusChapterNavigationStyle: CSSProperties = {
  ...desktopChapterNavigationStyle,
};