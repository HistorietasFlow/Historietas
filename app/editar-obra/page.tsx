"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, FormEvent } from "react";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { useNotificacoes } from "../../components/NotificacoesProvider";
import { criarSlugBase, normalizarTexto } from "../../lib/utils";

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
  visualizacoes?: number;
  totalCurtidas?: number;
  totalComentarios?: number;
  totalSalvos?: number;
  totalLidos?: number;
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
  visualizacoes?: number | null;
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

const STORAGE_KEY = "historietas-obras";
const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";
const TAMANHO_MAXIMO_CAPA = 2 * 1024 * 1024;
const TAMANHO_MAXIMO_ARQUIVO_OBRA = 2 * 1024 * 1024;
const LIMITE_TAGS_OBRA = 1;
const OUTRO_FORMATO_VALUE = "__outro_formato__";
const OUTRO_GENERO_VALUE = "__outro_genero__";
const OUTRA_TAG_VALUE = "__outra_tag__";
const LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO = 14;
const LIMITE_CARACTERES_TAG_PERSONALIZADA = 10;

const OPCOES_FORMATO_OBRA = [
  "Webnovel",
  "Light novel",
  "Romance",
  "Conto",
  "Poesia",
  "HQ/Mangá",
  "Fanfic",
] as const;

const OPCOES_GENERO_OBRA = [
  "Fantasia",
  "Terror",
  "Ficção",
  "Romance",
  "Drama",
  "Ação",
  "Mistério",
  "Suspense",
  "Aventura",
  "Comédia",
] as const;

const OPCOES_TAGS_OBRA = [
  "Sombria",
  "Psicológico",
  "Sci-fi",
  "Cyberpunk",
  "Espacial",
  "Isekai",
  "Distopia",
  "Apocalipse",
  "Escolar",
  "Máfia",
  "Investigação",
  "Religioso",
  "Mitologia",
  "Folclore",
  "Vampiro",
  "Lobisomem",
  "Zumbi",
  "Super-herói",
  "Magia",
  "Guerra",
  "Família",
  "Amizade",
  "Traição",
  "Vingança",
  "Sobrevivência",
] as const;

type ArquivosObrasBackup = Record<string, ArquivoObraLocal>;

function criarStorageKeyUsuarioEditarObra(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : chave;
}

function lerStorageUsuarioEditarObra(chave: string, userId: string) {
  if (typeof window === "undefined" || !userId.trim()) {
    return null;
  }

  try {
    return localStorage.getItem(criarStorageKeyUsuarioEditarObra(chave, userId));
  } catch {
    return null;
  }
}

function salvarJsonStorageUsuarioEditarObra(
  chave: string,
  userId: string,
  valor: unknown
) {
  if (typeof window === "undefined" || !userId.trim()) {
    return;
  }

  try {
    localStorage.setItem(
      criarStorageKeyUsuarioEditarObra(chave, userId),
      JSON.stringify(valor)
    );
  } catch {
    // localStorage é fallback; a edição continua com o estado em memória.
  }
}

function contarLetrasNumeros(texto: string) {
  return (texto.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]/g) || []).length;
}

function normalizarContadorEdicaoObra(valor: unknown, fallback = 0) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return Math.max(0, Math.round(valor));
  }

  if (typeof valor === "string" && valor.trim()) {
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));

    if (Number.isFinite(numero)) {
      return Math.max(0, Math.round(numero));
    }
  }

  return Math.max(0, Math.round(fallback));
}

function opcaoExiste(opcoes: readonly string[], valor: string) {
  return opcoes.some((opcao) => normalizarTexto(opcao) === normalizarTexto(valor));
}

function limparTextoPersonalizado(texto: string, limite: number) {
  return texto
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, limite);
}

function textoPersonalizadoValido(texto: string, minimo: number, limite: number) {
  const textoLimpo = texto.trim().replace(/\s+/g, " ");

  if (textoLimpo.length > limite) {
    return false;
  }

  if (contarLetrasNumeros(textoLimpo) < minimo) {
    return false;
  }

  return /^[\p{L}\p{N}][\p{L}\p{N}\s-]*$/u.test(textoLimpo);
}

function prepararValorEditavel(
  valor: string,
  opcoes: readonly string[],
  outroValue: string,
  limite: number
) {
  const valorLimpo = valor.trim();

  if (!valorLimpo || valorLimpo === "Não informado" || valorLimpo === "Não informada") {
    return {
      selecionado: "",
      personalizado: "",
    };
  }

  if (opcaoExiste(opcoes, valorLimpo)) {
    return {
      selecionado: valorLimpo,
      personalizado: "",
    };
  }

  return {
    selecionado: outroValue,
    personalizado: limparTextoPersonalizado(valorLimpo, limite).trim(),
  };
}

function formatarGeneroEdicaoObra(genero: string) {
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

function criarLoginHrefEditarObra(obraId?: string) {
  const obraIdLimpo = obraId?.trim() || "";
  const redirectTo = obraIdLimpo
    ? `/editar-obra?obraId=${encodeURIComponent(obraIdLimpo)}`
    : "/editar-obra";
  const params = new URLSearchParams({
    redirectTo,
  });

  return `/login?${params.toString()}`;
}

function obterTextoMetadataUsuarioEdicaoObra(
  metadata: Record<string, unknown> | null | undefined,
  chave: string
) {
  const valor = metadata?.[chave];

  return typeof valor === "string" ? valor.trim() : "";
}

function obterNomeProfileEdicaoObra(registro: unknown) {
  if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
    return "";
  }

  const profile = registro as Record<string, unknown>;
  const nome = profile.nome;

  return typeof nome === "string" ? nome.trim() : "";
}

async function carregarNomeAutorProfileEdicaoObra(
  userId: string,
  fallback = ""
) {
  const userIdLimpo = userId.trim();
  const fallbackLimpo = fallback.trim();

  if (!userIdLimpo) {
    return fallbackLimpo;
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("nome")
      .eq("user_id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (!error) {
      const nomeProfile = obterNomeProfileEdicaoObra(data);

      if (nomeProfile) {
        return nomeProfile;
      }
    }
  } catch {
    // Mantém fallback se a tabela profiles não estiver disponível.
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("nome")
      .eq("id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (!error) {
      const nomeProfile = obterNomeProfileEdicaoObra(data);

      if (nomeProfile) {
        return nomeProfile;
      }
    }
  } catch {
    // Mantém fallback se o projeto não usa id em profiles.
  }

  return fallbackLimpo;
}


function limparNomeArquivoStorage(nomeArquivo: string) {
  const partes = nomeArquivo.split(".");
  const extensao =
    partes.length > 1 ? `.${partes[partes.length - 1].toLowerCase()}` : "";
  const nomeBase = partes
    .slice(0, partes.length > 1 ? -1 : partes.length)
    .join(".")
    .trim();

  const nomeSeguro =
    normalizarTexto(nomeBase)
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "arquivo";

  return `${nomeSeguro}${extensao}`;
}

async function enviarArquivoStorage(
  bucket: "capas-obras" | "arquivos-obras",
  userId: string,
  arquivo: File
) {
  const idSeguro =
    typeof window !== "undefined" &&
    window.crypto &&
    typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const caminho = `${userId}/${Date.now()}-${idSeguro}-${limparNomeArquivoStorage(
    arquivo.name
  )}`;

  const { error } = await supabase.storage.from(bucket).upload(caminho, arquivo, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(`Erro ao enviar ${arquivo.name}: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(caminho);

  return data.publicUrl;
}

function normalizarCategoriaArquivoSupabase(
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
    categoria: normalizarCategoriaArquivoSupabase(
      obra.arquivo_categoria || arquivoLocal?.categoria || "outro"
    ),
    criadoEm: obra.criada_em || arquivoLocal?.criadoEm || "",
  };
}

function normalizarObraSupabase(
  obraSupabase: ObraSupabaseRow,
  capitulosSupabase: CapituloSupabaseRow[],
  obraLocal: ObraLocal | undefined,
  index: number
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

  const capitulosRemotosIds = new Set(
    capitulosRemotos.map((capitulo) => capitulo.id)
  );
  const capitulosApenasLocais = (obraLocal?.capitulos || []).filter(
    (capitulo) => !capitulosRemotosIds.has(capitulo.id)
  );
  const capitulosMesclados = [...capitulosRemotos, ...capitulosApenasLocais];
  const tituloObra =
    obraSupabase.titulo?.trim() || obraLocal?.titulo || "Obra sem título";
  const slug =
    obraSupabase.slug?.trim() ||
    obraLocal?.slug ||
    criarSlugBase(tituloObra || `obra-${index + 1}`);

  return {
    id: obraSupabase.id || obraLocal?.id || `obra-${index + 1}`,
    titulo: tituloObra,
    autor: obraSupabase.autor?.trim() || obraLocal?.autor || "Autor não informado",
    autorId: obraSupabase.user_id?.trim() || obraLocal?.autorId || "",
    genero: obraSupabase.genero?.trim() || obraLocal?.genero || "Não informado",
    formato: obraSupabase.formato?.trim() || obraLocal?.formato || "Não informado",
    classificacaoIndicativa:
      obraSupabase.classificacao_indicativa?.trim() ||
      obraLocal?.classificacaoIndicativa ||
      "Livre",
    sinopse:
      obraSupabase.sinopse?.trim() ||
      obraLocal?.sinopse ||
      "Nenhuma sinopse informada.",
    tags:
      Array.isArray(obraSupabase.tags) && obraSupabase.tags.length > 0
        ? obraSupabase.tags
        : obraLocal?.tags || ["sem tags"],
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
    visualizacoes: normalizarContadorEdicaoObra(
      obraSupabase.visualizacoes,
      obraLocal?.visualizacoes || 0
    ),
    totalCurtidas: normalizarContadorEdicaoObra(
      obraLocal?.totalCurtidas,
      capitulosMesclados.filter((capitulo) => capitulo.curtiu).length
    ),
    totalComentarios: normalizarContadorEdicaoObra(
      obraLocal?.totalComentarios,
      capitulosMesclados.filter((capitulo) => capitulo.comentario.trim()).length
    ),
    totalSalvos: normalizarContadorEdicaoObra(
      obraLocal?.totalSalvos,
      capitulosMesclados.filter((capitulo) => capitulo.salvo).length
    ),
    totalLidos: normalizarContadorEdicaoObra(
      obraLocal?.totalLidos,
      capitulosMesclados.filter((capitulo) => capitulo.lido).length
    ),
    slug,
    link: obraSupabase.link?.trim() || obraLocal?.link || `/obra/${slug}`,
  };
}

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}

function identificarCategoriaArquivo(arquivo: File): ArquivoObraLocal["categoria"] {
  const nome = arquivo.name.toLowerCase();

  if (arquivo.type.startsWith("image/")) {
    return "imagem";
  }

  if (
    nome.endsWith(".txt") ||
    nome.endsWith(".md") ||
    arquivo.type.startsWith("text/")
  ) {
    return "texto";
  }

  if (nome.endsWith(".pdf") || arquivo.type === "application/pdf") {
    return "documento";
  }

  return "outro";
}

function arquivoObraAceito(arquivo: File) {
  const nome = arquivo.name.toLowerCase();

  return (
    nome.endsWith(".pdf") ||
    nome.endsWith(".txt") ||
    nome.endsWith(".md") ||
    nome.endsWith(".png") ||
    nome.endsWith(".jpg") ||
    nome.endsWith(".jpeg") ||
    nome.endsWith(".webp") ||
    nome.endsWith(".gif") ||
    arquivo.type === "application/pdf" ||
    arquivo.type.startsWith("text/") ||
    arquivo.type.startsWith("image/")
  );
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
    nome: arquivo.nome,
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

function carregarBackupArquivosObras(userId = ""): ArquivosObrasBackup {
  if (typeof window === "undefined" || !userId.trim()) {
    return {};
  }

  try {
    const backupTexto = lerStorageUsuarioEditarObra(
      FILE_BACKUP_STORAGE_KEY,
      userId
    );
    const backupJson: unknown = backupTexto ? JSON.parse(backupTexto) : {};

    if (!backupJson || typeof backupJson !== "object" || Array.isArray(backupJson)) {
      return {};
    }

    const backupNormalizado: ArquivosObrasBackup = {};

    Object.entries(backupJson as Record<string, unknown>).forEach(([obraId, arquivo]) => {
      const arquivoNormalizado = normalizarArquivoObra(arquivo);

      if (obraId.trim() && arquivoNormalizado) {
        backupNormalizado[obraId] = arquivoNormalizado;
      }
    });

    salvarJsonStorageUsuarioEditarObra(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupNormalizado
    );

    return backupNormalizado;
  } catch {
    return {};
  }
}

function salvarArquivoObraNoBackup(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo" | "link">,
  arquivo: ArquivoObraLocal | null,
  userId = ""
) {
  if (!obra.id.trim() || typeof window === "undefined" || !userId.trim()) {
    return;
  }

  try {
    const backupAtual = carregarBackupArquivosObras(userId);

    obterChavesBackupArquivoEdicaoObra(obra).forEach((chave) => {
      if (arquivo) {
        backupAtual[chave] = arquivo;
      } else {
        delete backupAtual[chave];
      }
    });

    salvarJsonStorageUsuarioEditarObra(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupAtual
    );
  } catch {
    // Mantém o salvamento principal funcionando mesmo se o backup falhar.
  }
}

function sincronizarBackupArquivosObras(obras: ObraLocal[], userId = "") {
  if (typeof window === "undefined" || !userId.trim()) {
    return;
  }

  try {
    const backupAtual = carregarBackupArquivosObras(userId);

    obras.forEach((obra) => {
      if (obra.arquivoObra) {
        obterChavesBackupArquivoEdicaoObra(obra).forEach((chave) => {
          backupAtual[chave] = obra.arquivoObra as ArquivoObraLocal;
        });
      }
    });

    salvarJsonStorageUsuarioEditarObra(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupAtual
    );
  } catch {
    // Backup é uma proteção extra. Não deve travar a página.
  }
}

function restaurarArquivoObraComBackup(
  obra: ObraLocal,
  backup: ArquivosObrasBackup
): ObraLocal {
  if (obra.arquivoObra) {
    return obra;
  }

  const arquivoBackup = obterChavesBackupArquivoEdicaoObra(obra)
    .map((chave) => normalizarArquivoObra(backup[chave]))
    .find((arquivo): arquivo is ArquivoObraLocal => Boolean(arquivo));

  if (!arquivoBackup) {
    return obra;
  }

  return {
    ...obra,
    arquivoObra: arquivoBackup,
  };
}

function normalizarIdUsuario(valor: string) {
  return valor.trim().toLowerCase();
}

function usuarioPodeEditarObraLocal(obra: ObraLocal, userId: string) {
  const usuarioAtual = normalizarIdUsuario(userId);
  const autorIdObra = normalizarIdUsuario(obra.autorId || "");

  return Boolean(usuarioAtual) && (!autorIdObra || autorIdObra === usuarioAtual);
}


function salvarObrasDoUsuarioPreservandoOutrasContas(
  obrasDoUsuario: ObraLocal[],
  userId: string
) {
  if (typeof window === "undefined") {
    return obrasDoUsuario;
  }

  const usuarioId = userId.trim();
  const obrasDoUsuarioComDono = obrasDoUsuario.map((obra, index) =>
    normalizarObra(
      {
        ...obra,
        autorId: obra.autorId || usuarioId,
      },
      index
    )
  );

  salvarJsonStorageUsuarioEditarObra(
    STORAGE_KEY,
    usuarioId,
    obrasDoUsuarioComDono
  );
  sincronizarBackupArquivosObras(obrasDoUsuarioComDono, usuarioId);

  return obrasDoUsuarioComDono;
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
        : `Capítulo ${index + 1}`,
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
      obra.classificacaoIndicativa.trim() &&
      obra.classificacaoIndicativa.trim() !== "Não informada" &&
      obra.classificacaoIndicativa.trim() !== "Não informado"
        ? obra.classificacaoIndicativa.trim()
        : "Livre",
    sinopse:
      typeof obra.sinopse === "string" && obra.sinopse.trim()
        ? obra.sinopse
        : "Nenhuma sinopse informada.",
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
    visualizacoes: normalizarContadorEdicaoObra(obra.visualizacoes, 0),
    totalCurtidas: normalizarContadorEdicaoObra(
      obra.totalCurtidas,
      capitulosNormalizados.filter((capitulo) => capitulo.curtiu).length
    ),
    totalComentarios: normalizarContadorEdicaoObra(
      obra.totalComentarios,
      capitulosNormalizados.filter((capitulo) => capitulo.comentario.trim()).length
    ),
    totalSalvos: normalizarContadorEdicaoObra(
      obra.totalSalvos,
      capitulosNormalizados.filter((capitulo) => capitulo.salvo).length
    ),
    totalLidos: normalizarContadorEdicaoObra(
      obra.totalLidos,
      capitulosNormalizados.filter((capitulo) => capitulo.lido).length
    ),
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


function obterChavesBackupArquivoEdicaoObra(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo" | "link">,
) {
  return Array.from(
    new Set(
      [
        `id:${obra.id}`,
        `slug:${obra.slug || criarSlugBase(obra.titulo)}`,
        `titulo:${normalizarTexto(obra.titulo)}`,
        obra.link ? `link:${obra.link}` : "",
      ].filter((chave) => Boolean(chave.trim())),
    ),
  );
}


function carregarObrasLocalStorageEdicaoObra(userId: string) {
  if (typeof window === "undefined") {
    return [] as ObraLocal[];
  }

  const usuarioId = userId.trim();
  const backupArquivosObras = carregarBackupArquivosObras(usuarioId);

  function normalizarLista(valor: unknown) {
    return Array.isArray(valor)
      ? valor
          .map((obra, index) => normalizarObra(obra as Partial<ObraLocal>, index))
          .map((obra) => restaurarArquivoObraComBackup(obra, backupArquivosObras))
      : [];
  }

  let obrasDoUsuario: ObraLocal[] = [];

  try {
    const obrasUsuarioTexto = lerStorageUsuarioEditarObra(STORAGE_KEY, usuarioId);
    const obrasUsuarioJson: unknown = obrasUsuarioTexto
      ? JSON.parse(obrasUsuarioTexto)
      : [];

    obrasDoUsuario = normalizarLista(obrasUsuarioJson)
      .map((obra) => ({
        ...obra,
        autorId: obra.autorId?.trim() || usuarioId,
      }))
      .filter((obra) => usuarioPodeEditarObraLocal(obra, usuarioId));
  } catch {
    obrasDoUsuario = [];
  }

  salvarJsonStorageUsuarioEditarObra(STORAGE_KEY, usuarioId, obrasDoUsuario);
  sincronizarBackupArquivosObras(obrasDoUsuario, usuarioId);

  return obrasDoUsuario;
}

async function registrarDiarioEdicaoObra({
  userId,
  obra,
  visibilidade,
  atualizadoEm,
}: {
  userId: string;
  obra: ObraLocal;
  visibilidade: "publico" | "privado";
  atualizadoEm: string;
}) {
  try {
    const payload = {
      user_id: userId,
      tipo: "editou_obra",
      obra_id: obra.id,
      texto: "",
      visibilidade,
      metadata: {
        obra_titulo: obra.titulo,
        titulo_obra: obra.titulo,
        formato: obra.formato,
        genero: obra.genero,
        href: obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`,
      },
      criado_em: atualizadoEm,
      atualizado_em: atualizadoEm,
    };

    const { error } = await supabase.from("diario_atividades").insert(payload);

    if (!error) {
      return;
    }

    await supabase.from("diario_atividades").insert({
      user_id: userId,
      tipo: "editou_obra",
      obra_id: obra.id,
      texto: "",
      visibilidade,
      criado_em: atualizadoEm,
    });
  } catch (error) {
    console.warn("Não consegui registrar a edição da obra no Diário:", error);
  }
}

function criarMiniCoverStyle(capa: string): CSSProperties {
  if (!capa) {
    return coverPlaceholderStyle;
  }

  return {
    ...coverPlaceholderStyle,
    border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
    background: "#0B0714",
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarPreviewCoverStyle(capa: string): CSSProperties {
  if (!capa) {
    return previewCoverStyle;
  }

  return {
    ...previewCoverStyle,
    background: "#04000A",
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}


export default function EditarObraPage() {
  const router = useRouter();
  const [obraId, setObraId] = useState("");
  const [, setUsuarioIdLogado] = useState("");
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [obraEncontrada, setObraEncontrada] = useState(false);
  const [salvou, setSalvou] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [nomeAutorProfile, setNomeAutorProfile] = useState("");
  const [genero, setGenero] = useState("");
  const [generoPersonalizado, setGeneroPersonalizado] = useState("");
  const [formato, setFormato] = useState("");
  const [formatoPersonalizado, setFormatoPersonalizado] = useState("");
  const [classificacaoIndicativa, setClassificacaoIndicativa] = useState("");
  const [sinopse, setSinopse] = useState("");
  const [tags, setTags] = useState("");
  const [tagPersonalizada, setTagPersonalizada] = useState("");
  const [usarTagPersonalizada, setUsarTagPersonalizada] = useState(false);
  const [capa, setCapa] = useState("");
  const [capaNome, setCapaNome] = useState("");
  const [capaArquivo, setCapaArquivo] = useState<File | null>(null);
  const [capaErro, setCapaErro] = useState("");
  const [arquivoObra, setArquivoObra] = useState<ArquivoObraLocal | null>(null);
  const [arquivoObraArquivo, setArquivoObraArquivo] = useState<File | null>(null);
  const [arquivoObraErro, setArquivoObraErro] = useState("");
  const [arquivoObraRemovidoManualmente, setArquivoObraRemovidoManualmente] =
    useState(false);

  const capaInputRef = useRef<HTMLInputElement | null>(null);
  const arquivoObraInputRef = useRef<HTMLInputElement | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { notificacoesNaoLidas } = useNotificacoes();


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
    let cancelado = false;

    function aplicarObraNoFormulario(
      obraAtual: ObraLocal,
      nomeAutorProfileAtual = ""
    ) {
      const autorProfile = nomeAutorProfileAtual.trim();
      const formatoEditavel = prepararValorEditavel(
        obraAtual.formato,
        OPCOES_FORMATO_OBRA,
        OUTRO_FORMATO_VALUE,
        LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO
      );
      const generoEditavel = prepararValorEditavel(
        formatarGeneroEdicaoObra(obraAtual.genero),
        OPCOES_GENERO_OBRA,
        OUTRO_GENERO_VALUE,
        LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO
      );
      const primeiraTag = obraAtual.tags.find((tag) => tag.trim() && tag !== "sem tags") || "";
      const tagEhPersonalizada = Boolean(primeiraTag) && !opcaoExiste(OPCOES_TAGS_OBRA, primeiraTag);

      setObraEncontrada(true);
      setTitulo(obraAtual.titulo);
      setAutor(autorProfile || obraAtual.autor);
      setGenero(generoEditavel.selecionado);
      setGeneroPersonalizado(generoEditavel.personalizado);
      setFormato(formatoEditavel.selecionado);
      setFormatoPersonalizado(formatoEditavel.personalizado);
      setClassificacaoIndicativa(
        obraAtual.classificacaoIndicativa === "Não informada" ||
          obraAtual.classificacaoIndicativa === "Não informado"
          ? "Livre"
          : obraAtual.classificacaoIndicativa
      );
      setSinopse(obraAtual.sinopse);
      setUsarTagPersonalizada(tagEhPersonalizada);
      setTagPersonalizada(
        tagEhPersonalizada
          ? limparTextoPersonalizado(primeiraTag, LIMITE_CARACTERES_TAG_PERSONALIZADA).trim()
          : ""
      );
      setTags(primeiraTag || "");
      setCapa(obraAtual.capa);
      setCapaNome(obraAtual.capaNome);
      setCapaArquivo(null);
      setArquivoObra(obraAtual.arquivoObra || null);
      setArquivoObraArquivo(null);
      setArquivoObraRemovidoManualmente(false);
    }

    async function carregarObra() {
      const params = new URLSearchParams(window.location.search);
      const obraIdParam = params.get("obraId") || "";

      window.setTimeout(() => {
        if (!cancelado) {
          setObraId(obraIdParam);
        }
      }, 0);

      let obrasNormalizadas: ObraLocal[] = [];

      try {
        const { data: dadosUsuario, error: erroUsuario } =
          await supabase.auth.getUser();

        const userId = dadosUsuario.user?.id || "";

        if (erroUsuario || !userId) {
          if (!cancelado) {
            setUsuarioIdLogado("");
            router.replace(criarLoginHrefEditarObra(obraIdParam));
          }

          return;
        }

        if (!cancelado) {
          setUsuarioIdLogado(userId);
        }

        const metadataUsuario = dadosUsuario.user?.user_metadata as
          | Record<string, unknown>
          | undefined;
        const nomeMetadataUsuario =
          obterTextoMetadataUsuarioEdicaoObra(metadataUsuario, "nome") ||
          obterTextoMetadataUsuarioEdicaoObra(metadataUsuario, "name") ||
          obterTextoMetadataUsuarioEdicaoObra(metadataUsuario, "full_name");
        const nomeProfileUsuario = await carregarNomeAutorProfileEdicaoObra(
          userId,
          nomeMetadataUsuario
        );

        if (!cancelado) {
          setNomeAutorProfile(nomeProfileUsuario);
        }

        if (!obraIdParam) {
          return;
        }

        try {
          obrasNormalizadas = carregarObrasLocalStorageEdicaoObra(userId);

          const obrasAutorizadas = obrasNormalizadas.filter((obra) =>
            usuarioPodeEditarObraLocal(obra, userId)
          );

          const obraLocal = obrasAutorizadas.find(
            (obra) => obra.id === obraIdParam
          );

          if (!cancelado) {
            setObras(obrasAutorizadas);

            if (obraLocal) {
              aplicarObraNoFormulario(obraLocal, nomeProfileUsuario);
            }
          }
        } catch {
          obrasNormalizadas = [];

          if (!cancelado) {
            setObras([]);
          }
        }

        const { data: obraSupabase, error: erroObraSupabase } = await supabase
          .from("obras")
          .select(
            "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,visualizacoes,slug,link,criada_em,atualizado_em"
          )
          .eq("id", obraIdParam)
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();

        if (erroObraSupabase) {
          console.warn(
            "Não consegui carregar a obra no Supabase:",
            erroObraSupabase.message
          );
          return;
        }

        if (!obraSupabase) {
          return;
        }

        const { data: capitulosSupabase, error: erroCapitulosSupabase } =
          await supabase
            .from("capitulos")
            .select("id,obra_id,user_id,titulo,texto,ordem,publicado,criado_em,atualizado_em")
            .eq("obra_id", obraIdParam)
            .eq("user_id", userId)
            .order("ordem", { ascending: true })
            .limit(300);

        if (erroCapitulosSupabase) {
          console.warn(
            "Não consegui carregar capítulos da obra no Supabase:",
            erroCapitulosSupabase.message
          );
        }

        const obrasAutorizadas = obrasNormalizadas.filter((obra) =>
          usuarioPodeEditarObraLocal(obra, userId)
        );

        const obraLocal = obrasAutorizadas.find(
          (obra) => obra.id === obraIdParam
        );
        const obraNormalizadaSupabase = normalizarObraSupabase(
          obraSupabase as unknown as ObraSupabaseRow,
          Array.isArray(capitulosSupabase)
            ? (capitulosSupabase as unknown as CapituloSupabaseRow[])
            : [],
          obraLocal,
          0
        );
        const obraSupabaseComAutorProfile = nomeProfileUsuario
          ? normalizarObra(
              {
                ...obraNormalizadaSupabase,
                autor: nomeProfileUsuario,
                autorId: obraNormalizadaSupabase.autorId || userId,
              },
              0
            )
          : obraNormalizadaSupabase;

        const obrasAtualizadas = [
          obraSupabaseComAutorProfile,
          ...obrasAutorizadas.filter((obra) => obra.id !== obraIdParam),
        ];

        const obrasAtualizadasDoUsuario =
          salvarObrasDoUsuarioPreservandoOutrasContas(obrasAtualizadas, userId);

        sincronizarBackupArquivosObras(obrasAtualizadasDoUsuario, userId);

        if (!cancelado) {
          setObras(obrasAtualizadasDoUsuario);
          aplicarObraNoFormulario(obraSupabaseComAutorProfile, nomeProfileUsuario);
        }
      } catch (erroSupabase) {
        console.warn("Falha ao carregar dados do Supabase:", erroSupabase);
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    void carregarObra();

    return () => {
      cancelado = true;
    };
  }, [router]);

  const obraAtual = useMemo(() => {
    return obras.find((obra) => obra.id === obraId) || null;
  }, [obras, obraId]);

  const tagsTratadas = useMemo(() => {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, LIMITE_TAGS_OBRA);
  }, [tags]);

  const tagsPreview = tagsTratadas.length > 0 ? tagsTratadas : ["sem tags"];
  const formatoEhPersonalizado = formato === OUTRO_FORMATO_VALUE;
  const generoEhPersonalizado = genero === OUTRO_GENERO_VALUE;
  const formatoFinal = formatoEhPersonalizado
    ? formatoPersonalizado.trim().replace(/\s+/g, " ")
    : formato.trim();
  const generoFinal = generoEhPersonalizado
    ? generoPersonalizado.trim().replace(/\s+/g, " ")
    : genero.trim();
  const tagPersonalizadaFinal = tagPersonalizada.trim().replace(/\s+/g, " ");
  const formatoPersonalizadoValido =
    !formatoEhPersonalizado ||
    textoPersonalizadoValido(
      formatoPersonalizado,
      3,
      LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO
    );
  const generoPersonalizadoValido =
    !generoEhPersonalizado ||
    textoPersonalizadoValido(
      generoPersonalizado,
      3,
      LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO
    );
  const tagPersonalizadaValida =
    !usarTagPersonalizada ||
    (textoPersonalizadoValido(
      tagPersonalizada,
      2,
      LIMITE_CARACTERES_TAG_PERSONALIZADA
    ) &&
      normalizarTexto(tagPersonalizadaFinal) !== normalizarTexto(formatoFinal) &&
      normalizarTexto(tagPersonalizadaFinal) !== normalizarTexto(generoFinal));

  const progresso = useMemo(() => {
    const camposValidos = [
      contarLetrasNumeros(titulo.trim()) >= 3,
      contarLetrasNumeros(autor.trim()) >= 2,
      Boolean(generoFinal) && generoPersonalizadoValido,
      Boolean(formatoFinal) && formatoPersonalizadoValido,
      Boolean(classificacaoIndicativa.trim()) &&
        classificacaoIndicativa.trim() !== "Não informado" &&
        classificacaoIndicativa.trim() !== "Não informada",
      contarLetrasNumeros(sinopse.trim()) >= 20,
    ].filter(Boolean).length;

    return Math.round((camposValidos / 6) * 100);
  }, [
    titulo,
    autor,
    generoFinal,
    generoPersonalizadoValido,
    formatoFinal,
    formatoPersonalizadoValido,
    classificacaoIndicativa,
    sinopse,
  ]);

  const obraPublicaHref =
    obraAtual?.link ||
    (obraAtual?.slug
      ? `/obra/${obraAtual.slug}`
      : titulo.trim()
        ? `/obra/${criarSlugBase(titulo.trim())}`
        : "/painel-autor");
  const minhaObraHref = obraAtual?.publicado ? obraPublicaHref : "/painel-autor";
  const autorProfileAtivo = nomeAutorProfile.trim();
  const autorPreview = autorProfileAtivo || autor.trim();
  function marcarAlteracao() {
    if (salvou) {
      setSalvou(false);
    }

    if (erro) {
      setErro("");
    }
  }

  function validarFormulario() {
    const tituloLimpo = titulo.trim();
    const autorLimpo = autorProfileAtivo || autor.trim();
    const generoLimpo = generoFinal;
    const formatoLimpo = formatoFinal;
    const classificacaoLimpa = classificacaoIndicativa.trim();
    const sinopseLimpa = sinopse.trim();

    if (contarLetrasNumeros(tituloLimpo) < 3) {
      return "O título precisa ter pelo menos 3 letras ou números.";
    }

    if (contarLetrasNumeros(autorLimpo) < 2) {
      return "O autor precisa ter pelo menos 2 letras ou números.";
    }

    if (!formatoLimpo || formatoLimpo === "Não informado" || !formatoPersonalizadoValido) {
      return formatoEhPersonalizado
        ? "O formato personalizado precisa ter 3 a 14 caracteres, sem vírgula, emoji ou símbolo estranho."
        : "Escolha um formato para a obra.";
    }

    if (!generoLimpo || generoLimpo === "Não informado" || !generoPersonalizadoValido) {
      return generoEhPersonalizado
        ? "O gênero personalizado precisa ter 3 a 14 caracteres, sem vírgula, emoji ou símbolo estranho."
        : "Escolha um gênero para a obra.";
    }

    if (!tagPersonalizadaValida) {
      return "A tag personalizada precisa ter 2 a 10 caracteres, sem vírgula, emoji ou símbolo estranho, e não pode repetir gênero ou formato.";
    }

    if (
      !classificacaoLimpa ||
      classificacaoLimpa === "Não informado" ||
      classificacaoLimpa === "Não informada"
    ) {
      return "Escolha a classificação indicativa da obra.";
    }

    if (contarLetrasNumeros(sinopseLimpa) < 20) {
      return "A sinopse precisa ter pelo menos 20 letras ou números.";
    }

    return "";
  }

  function selecionarCapa(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];

    setCapaErro("");
    marcarAlteracao();

    if (!arquivo) {
      return;
    }

    if (!arquivo.type.startsWith("image/")) {
      setCapaErro("Escolha um arquivo de imagem válido.");
      event.target.value = "";
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_CAPA) {
      setCapaErro("A capa precisa ter no máximo 2 MB.");
      event.target.value = "";
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      const resultado = typeof leitor.result === "string" ? leitor.result : "";

      if (!resultado) {
        setCapaErro("Não consegui carregar essa imagem.");
        return;
      }

      setCapa(resultado);
      setCapaNome(arquivo.name);
      setCapaArquivo(arquivo);
    };

    leitor.onerror = () => {
      setCapaErro("Não consegui carregar essa imagem.");
    };

    leitor.readAsDataURL(arquivo);
  }

  function removerCapa() {
    setCapa("");
    setCapaNome("");
    setCapaArquivo(null);
    setCapaErro("");
    marcarAlteracao();

    if (capaInputRef.current) {
      capaInputRef.current.value = "";
    }
  }

  function selecionarArquivoObra(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];

    setArquivoObraErro("");
    marcarAlteracao();

    if (!arquivo) {
      return;
    }

    if (!arquivoObraAceito(arquivo)) {
      setArquivoObraErro(
        "Escolha PDF, TXT, MD ou imagem em PNG, JPG, WEBP ou GIF."
      );
      event.target.value = "";
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO_OBRA) {
      setArquivoObraErro(
        "O arquivo completo precisa ter no máximo 2 MB."
      );
      event.target.value = "";
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      const resultado = typeof leitor.result === "string" ? leitor.result : "";

      if (!resultado) {
        setArquivoObraErro("Não consegui carregar esse arquivo.");
        return;
      }

      setArquivoObraRemovidoManualmente(false);
      setArquivoObra({
        nome: arquivo.name,
        tipo: arquivo.type || "application/octet-stream",
        tamanho: arquivo.size,
        conteudo: resultado,
        categoria: identificarCategoriaArquivo(arquivo),
        criadoEm: new Date().toISOString(),
      });
      setArquivoObraArquivo(arquivo);
    };

    leitor.onerror = () => {
      setArquivoObraErro("Não consegui carregar esse arquivo.");
    };

    leitor.readAsDataURL(arquivo);
  }

  function removerArquivoObra() {
    setArquivoObra(null);
    setArquivoObraArquivo(null);
    setArquivoObraRemovidoManualmente(true);
    setArquivoObraErro("");
    marcarAlteracao();

    if (arquivoObraInputRef.current) {
      arquivoObraInputRef.current.value = "";
    }
  }

  function atualizarTagPersonalizada(valor: string) {
    const textoLimpo = limparTextoPersonalizado(
      valor,
      LIMITE_CARACTERES_TAG_PERSONALIZADA
    );

    setTagPersonalizada(textoLimpo);
    setTags(
      textoPersonalizadoValido(
        textoLimpo,
        2,
        LIMITE_CARACTERES_TAG_PERSONALIZADA
      )
        ? textoLimpo.trim().replace(/\s+/g, " ")
        : ""
    );
    marcarAlteracao();
  }

  function adicionarTagSelecionada(tag: string) {
    if (!tag) {
      setUsarTagPersonalizada(false);
      setTagPersonalizada("");
      setTags("");
      marcarAlteracao();
      return;
    }

    if (tag === OUTRA_TAG_VALUE) {
      setUsarTagPersonalizada(true);
      setTags(
        textoPersonalizadoValido(
          tagPersonalizada,
          2,
          LIMITE_CARACTERES_TAG_PERSONALIZADA
        )
          ? tagPersonalizada.trim().replace(/\s+/g, " ")
          : ""
      );
      marcarAlteracao();
      return;
    }

    setUsarTagPersonalizada(false);
    setTagPersonalizada("");
    setTags(tag);
    marcarAlteracao();
  }

  async function salvarEdicao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (processando) {
      return;
    }

    const erroValidacao = validarFormulario();

    if (erroValidacao) {
      setErro(erroValidacao);
      setSalvou(false);

      return;
    }

    setProcessando(true);
    setErro("");

    const tituloFinal = titulo.trim();
    const autorFormularioFinal = autor.trim();
    let autorFinal = autorProfileAtivo || autorFormularioFinal;
    const generoFinalSalvo = generoFinal;
    const formatoFinalSalvo = formatoFinal;
    const classificacaoFinal = classificacaoIndicativa.trim();
    const sinopseFinal = sinopse.trim();
    const tagsFinais = tagsTratadas.length > 0 ? tagsTratadas : ["sem tags"];
    const agora = new Date().toISOString();

    try {
      const { data: dadosUsuario, error: erroUsuario } =
        await supabase.auth.getUser();

      const userId = dadosUsuario.user?.id || "";

      if (erroUsuario || !userId || !obraId) {
        setErro("Entre na sua conta antes de editar a obra.");
        router.replace(criarLoginHrefEditarObra(obraId));
        return;
      }

      const metadataUsuario = dadosUsuario.user?.user_metadata as
        | Record<string, unknown>
        | undefined;
      const nomeMetadataUsuario =
        obterTextoMetadataUsuarioEdicaoObra(metadataUsuario, "nome") ||
        obterTextoMetadataUsuarioEdicaoObra(metadataUsuario, "name") ||
        obterTextoMetadataUsuarioEdicaoObra(metadataUsuario, "full_name");
      const nomeProfileAtualizado = await carregarNomeAutorProfileEdicaoObra(
        userId,
        nomeMetadataUsuario || autorFormularioFinal
      );
      autorFinal = nomeProfileAtualizado || autorFinal;
      setNomeAutorProfile(nomeProfileAtualizado);

      const backupArquivosObras = carregarBackupArquivosObras(userId);
      const obraLocalAtual = obras.find((obra) => obra.id === obraId) || null;

      if (obraLocalAtual?.autorId && obraLocalAtual.autorId !== userId) {
        setErro("Você não tem permissão para editar esta obra.");
        setSalvou(false);
        return;
      }

      let capaFinal = capa;
      let capaNomeFinal = capaNome;
      let arquivoObraFinal: ArquivoObraLocal | null = arquivoObra
        ? {
            ...arquivoObra,
            categoria: arquivoObra.categoria || "outro",
          }
        : arquivoObraRemovidoManualmente
          ? null
          : normalizarArquivoObra(backupArquivosObras[obraId]) ||
            obraLocalAtual?.arquivoObra ||
            null;

      try {
        if (capaArquivo) {
          capaFinal = await enviarArquivoStorage("capas-obras", userId, capaArquivo);
          capaNomeFinal = capaArquivo.name;
        }

        if (arquivoObraArquivo && arquivoObra) {
          const arquivoUrl = await enviarArquivoStorage(
            "arquivos-obras",
            userId,
            arquivoObraArquivo
          );

          arquivoObraFinal = {
            ...arquivoObra,
            nome: arquivoObraArquivo.name,
            tipo: arquivoObraArquivo.type || arquivoObra.tipo,
            tamanho: arquivoObraArquivo.size,
            conteudo: arquivoUrl,
            categoria: identificarCategoriaArquivo(arquivoObraArquivo),
            criadoEm: arquivoObra.criadoEm || agora,
          };
        }

        const { error: erroAtualizarObra } = await supabase
          .from("obras")
          .update({
            titulo: tituloFinal,
            autor: autorFinal,
            genero: generoFinalSalvo,
            formato: formatoFinalSalvo,
            classificacao_indicativa: classificacaoFinal,
            sinopse: sinopseFinal,
            tags: tagsFinais,
            capa_url: capaFinal,
            capa_nome: capaNomeFinal,
            arquivo_url: arquivoObraFinal?.conteudo || "",
            arquivo_nome: arquivoObraFinal?.nome || "",
            arquivo_tipo: arquivoObraFinal?.tipo || "",
            arquivo_tamanho: arquivoObraFinal?.tamanho || 0,
            arquivo_categoria: arquivoObraFinal?.categoria || "outro",
            atualizado_em: agora,
          })
          .eq("id", obraId)
          .eq("user_id", userId);

        if (erroAtualizarObra) {
          console.warn(
            "A obra foi salva no navegador, mas não atualizou no Supabase:",
            erroAtualizarObra.message
          );
        }
      } catch (erroSupabase) {
        console.warn(
          "A obra foi salva no navegador, mas houve falha no Supabase:",
          erroSupabase
        );
      }

      const novasObras = obras.map((obra, index) => {
        const obraNormalizada = normalizarObra(obra, index);

        if (obraNormalizada.id !== obraId) {
          return obraNormalizada;
        }

        return normalizarObra(
          {
            ...obraNormalizada,
            titulo: tituloFinal,
            autor: autorFinal,
            genero: generoFinalSalvo,
            formato: formatoFinalSalvo,
            classificacaoIndicativa: classificacaoFinal,
            sinopse: sinopseFinal,
            tags: tagsFinais,
            capa: capaFinal,
            capaNome: capaNomeFinal,
            arquivoObra: arquivoObraFinal,
          },
          index
        );
      });

      const novasObrasDoUsuario =
        salvarObrasDoUsuarioPreservandoOutrasContas(novasObras, userId);

      if (arquivoObraRemovidoManualmente) {
        salvarArquivoObraNoBackup(
          {
            id: obraId,
            slug: obraLocalAtual?.slug || criarSlugBase(tituloFinal),
            titulo: tituloFinal,
            link: obraLocalAtual?.link || `/obra/${obraLocalAtual?.slug || criarSlugBase(tituloFinal)}`,
          },
          null,
          userId
        );
      } else {
        sincronizarBackupArquivosObras(novasObrasDoUsuario, userId);
      }

      const obraAtualizadaDiario = novasObrasDoUsuario.find((obra) => obra.id === obraId);

      if (obraAtualizadaDiario) {
        await registrarDiarioEdicaoObra({
          userId,
          obra: obraAtualizadaDiario,
          visibilidade: obraAtualizadaDiario.publicado ? "publico" : "privado",
          atualizadoEm: agora,
        });
      }

      setObras(novasObrasDoUsuario);
      setAutor(autorFinal);
      setCapa(capaFinal);
      setCapaNome(capaNomeFinal);
      setCapaArquivo(null);
      setArquivoObra(arquivoObraFinal);
      setArquivoObraArquivo(null);
      setArquivoObraRemovidoManualmente(false);
      setSalvou(true);


    } catch {
      alert(
        "Não consegui salvar as alterações. Tente usar uma capa/arquivo menor ou atualizar a página e salvar novamente."
      );
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${editarObraPageCss}`}</style>
        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      </main>
    );
  }

  if (!obraEncontrada) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${editarObraPageCss}`}</style>
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
            Obra não encontrada
          </p>
        </section>
      </main>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${editarObraPageCss}`}</style>
        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTitleHeaderStyle : titleHeaderStyle}>
          <Link
            href="/"
            style={isDesktop ? desktopHeaderTitleLinkStyle : headerTitleLinkStyle}
            aria-label="Voltar para a Home"
          >
            <span
              className="historietas-theme-title"
              style={isDesktop ? desktopHeaderTitleTextStyle : headerTitleTextStyle}
            >
              EDITAR OBRA
            </span>
          </Link>

          {isDesktop ? (
            <Link
              href="/notificacoes"
              style={desktopNotificationButtonStyle}
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
        </header>

        {erro && (
          <section style={errorBoxStyle}>
            <h2 style={errorTitleStyle}>Não foi possível salvar</h2>

            <p style={errorTextStyle}>{erro}</p>
          </section>
        )}


        <section style={isDesktop ? desktopMainGridStyle : mainGridStyle}>
          <form onSubmit={salvarEdicao} style={isDesktop ? desktopFormStyle : formStyle}>
            <div style={fieldGroupStyle}>
              <input
                ref={capaInputRef}
                type="file"
                accept="image/*"
                onChange={selecionarCapa}
                style={hiddenInputStyle}
              />

              <div style={isDesktop ? desktopCoverUploadBoxStyle : coverUploadBoxStyle}>
                <div style={coverUploadPreviewStyle}>
                  <div style={criarMiniCoverStyle(capa)}>

                    {!capa && (
                      <>
                        <span style={coverPlaceholderIconStyle}>+</span>
                        <span style={coverPlaceholderTextStyle}>Adicionar capa</span>
                      </>
                    )}
                  </div>
                </div>

                <div style={coverUploadContentStyle}>
                  <strong style={coverUploadTitleStyle}>
                    {capa ? "Capa atual" : "Adicionar capa"}
                  </strong>

                  <span style={hintStyle}>Imagem vertical. Máximo: 2 MB.</span>


                  {capaErro && <span style={coverErrorStyle}>{capaErro}</span>}

                  <div style={coverButtonsStyle}>
                    <button
                      type="button"
                      onClick={() => capaInputRef.current?.click()}
                      style={coverButtonStyle}
                    >
                      {capa ? "Trocar" : "Escolher"}
                    </button>

                    {capa && (
                      <button
                        type="button"
                        onClick={removerCapa}
                        style={removeCoverButtonStyle}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Arquivo completo da obra</label>

              <input
                ref={arquivoObraInputRef}
                type="file"
                accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp,.gif,application/pdf,text/plain,text/markdown,image/*"
                onChange={selecionarArquivoObra}
                style={hiddenInputStyle}
              />

              <div style={isDesktop ? desktopFileUploadBoxStyle : fileUploadBoxStyle}>
                <div style={fileUploadIconBoxStyle}>
                  <span style={fileUploadIconStyle}>▣</span>
                </div>

                <div style={fileUploadContentStyle}>
                  <strong style={coverUploadTitleStyle}>
                    {arquivoObra ? "Arquivo atual" : "Enviar PDF, texto ou imagem"}
                  </strong>

                  <span style={hintStyle}>
                    Opcional. Anexe PDF, texto, imagem ou página de mangá.
                  </span>

                  {arquivoObra && (
                    <span style={fileNameStyle}>{arquivoObra.nome}</span>
                  )}

                  {arquivoObraErro && (
                    <span style={coverErrorStyle}>{arquivoObraErro}</span>
                  )}

                  <div style={coverButtonsStyle}>
                    <button
                      type="button"
                      onClick={() => arquivoObraInputRef.current?.click()}
                      style={coverButtonStyle}
                    >
                      {arquivoObra ? "Trocar arquivo" : "Escolher arquivo"}
                    </button>

                    {arquivoObra && (
                      <button
                        type="button"
                        onClick={removerArquivoObra}
                        style={removeCoverButtonStyle}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Título da obra</label>

              <input
                value={titulo}
                onChange={(event) => {
                  setTitulo(event.target.value);
                  marcarAlteracao();
                }}
                placeholder="Digite o título"
                style={inputStyle}
                type="text"
              />

              <span style={hintStyle}>Mínimo: 3 letras ou números.</span>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Autor</label>

              <input
                value={autor}
                onChange={(event) => {
                  setAutor(event.target.value);
                  marcarAlteracao();
                }}
                placeholder="Nome do autor"
                style={inputStyle}
                type="text"
              />

              <span style={hintStyle}>Mínimo: 2 letras ou números.</span>
            </div>

            <div style={isDesktop ? desktopDoubleFieldStyle : doubleFieldStyle}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Formato</label>

                <select
                  value={formato}
                  onChange={(event) => {
                    const novoFormato = event.target.value;

                    setFormato(novoFormato);

                    if (novoFormato !== OUTRO_FORMATO_VALUE) {
                      setFormatoPersonalizado("");
                    }

                    marcarAlteracao();
                  }}
                  style={inputStyle}
                >
                  <option value="">Escolha um formato</option>
                  {OPCOES_FORMATO_OBRA.map((opcao) => (
                    <option key={opcao}>{opcao}</option>
                  ))}
                  <option value={OUTRO_FORMATO_VALUE}>Outro formato</option>
                </select>

                {formatoEhPersonalizado && (
                  <input
                    value={formatoPersonalizado}
                    onChange={(event) => {
                      setFormatoPersonalizado(
                        limparTextoPersonalizado(
                          event.target.value,
                          LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO
                        )
                      );
                      marcarAlteracao();
                    }}
                    style={inputStyle}
                    placeholder="Digite o formato"
                    maxLength={LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO}
                    type="text"
                  />
                )}
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Gênero</label>

                <select
                  value={genero}
                  onChange={(event) => {
                    const novoGenero = event.target.value;

                    setGenero(novoGenero);

                    if (novoGenero !== OUTRO_GENERO_VALUE) {
                      setGeneroPersonalizado("");
                    }

                    marcarAlteracao();
                  }}
                  style={inputStyle}
                >
                  <option value="">Escolha um gênero</option>
                  {OPCOES_GENERO_OBRA.map((opcao) => (
                    <option key={opcao}>{opcao}</option>
                  ))}
                  <option value={OUTRO_GENERO_VALUE}>Outro gênero</option>
                </select>

                {generoEhPersonalizado && (
                  <input
                    value={generoPersonalizado}
                    onChange={(event) => {
                      setGeneroPersonalizado(
                        limparTextoPersonalizado(
                          event.target.value,
                          LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO
                        )
                      );
                      marcarAlteracao();
                    }}
                    style={inputStyle}
                    placeholder="Digite o gênero"
                    maxLength={LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO}
                    type="text"
                  />
                )}
              </div>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Tag</label>

              <select
                value={usarTagPersonalizada ? OUTRA_TAG_VALUE : tagsTratadas[0] || ""}
                onChange={(event) => {
                  adicionarTagSelecionada(event.target.value);
                }}
                style={inputStyle}
              >
                <option value="">Escolha uma tag</option>

                {OPCOES_TAGS_OBRA.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}

                <option value={OUTRA_TAG_VALUE}>Outra tag</option>
              </select>

              {usarTagPersonalizada && (
                <input
                  value={tagPersonalizada}
                  onChange={(event) => atualizarTagPersonalizada(event.target.value)}
                  style={inputStyle}
                  placeholder="Digite a tag"
                  maxLength={LIMITE_CARACTERES_TAG_PERSONALIZADA}
                  type="text"
                />
              )}

            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Classificação indicativa</label>

              <select
                value={classificacaoIndicativa}
                onChange={(event) => {
                  setClassificacaoIndicativa(event.target.value);
                  marcarAlteracao();
                }}
                style={inputStyle}
              >
                <option value="">Escolha a classificação</option>
                <option>Livre</option>
                <option>10+</option>
                <option>12+</option>
                <option>14+</option>
                <option>16+</option>
                <option>18+</option>
              </select>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Sinopse</label>

              <textarea
                value={sinopse}
                onChange={(event) => {
                  setSinopse(event.target.value);
                  marcarAlteracao();
                }}
                placeholder="Escreva a sinopse da obra"
                style={isDesktop ? desktopTextareaStyle : textareaStyle}
              />
            </div>

            <div style={isDesktop ? desktopButtonAreaStyle : buttonAreaStyle}>
              <button
                type="submit"
                style={{
                  ...(processando
                    ? isDesktop
                      ? desktopDisabledButtonStyle
                      : disabledButtonStyle
                    : isDesktop
                      ? desktopSaveButtonStyle
                      : saveButtonStyle),
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                }}
                disabled={processando}
              >
                {processando ? (
                  "Salvando..."
                ) : salvou ? (
                  <>
                    <span>Atualizada</span>
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      style={{ width: 17, height: 17, flex: "0 0 auto" }}
                    >
                      <path
                        d="M20 6 9 17l-5-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                ) : (
                  "Salvar alterações"
                )}
              </button>

              <Link href={minhaObraHref} style={isDesktop ? desktopSecondaryButtonStyle : secondaryButtonStyle}>
                Ver obra
              </Link>

              <Link href="/painel-autor" style={isDesktop ? desktopCancelButtonStyle : cancelButtonStyle}>
                Cancelar
              </Link>
            </div>

            <div style={isDesktop ? desktopProgressBoxStyle : progressBoxStyle}>
              <div style={progressTopStyle}>
                <span style={progressLabelStyle}>Progresso</span>

                <strong style={progressNumberStyle}>{progresso}%</strong>
              </div>

              <div style={progressTrackStyle}>
                <div style={{ ...progressFillStyle, width: `${progresso}%` }} />
              </div>
            </div>
          </form>

          <aside style={isDesktop ? desktopPreviewPanelStyle : previewPanelStyle}>
            <div style={previewHeaderStyle}>
              <span style={previewMiniTitleStyle}>PRÉVIA DA OBRA</span>
            </div>

            <article style={isDesktop ? desktopPreviewCardStyle : previewCardStyle}>
              <div style={criarPreviewCoverStyle(capa)}>
                <div style={previewCoverGlowStyle} />
              </div>

              <div style={previewContentStyle}>
                <div style={previewTopRowStyle}>
                  <h3 style={previewObraTitleStyle}>
                    {titulo.trim() || "Obra sem título"}
                  </h3>

                  <div style={previewBadgesStyle}>
                    <span style={previewBadgeStyle}>
                      {formatoFinal || "Formato"}
                    </span>

                    <span style={previewRatingBadgeStyle}>
                      {classificacaoIndicativa === "Não informada" ||
                      classificacaoIndicativa === "Não informado"
                        ? "Livre"
                        : classificacaoIndicativa || "Livre"}
                    </span>
                  </div>
                </div>

                <p style={previewAuthorStyle}>
                  Por {autorPreview || "Autor não informado"}
                </p>

                <div style={previewStatsStyle}>
                  <span style={previewStatItemStyle}>
                    <span style={previewStatIconStyle}>👁</span>
                    <span style={previewStatValueStyle}>0</span>
                  </span>

                  <span style={previewStatItemStyle}>
                    <span style={previewStatHeartIconStyle}>♥</span>
                    <span style={previewStatValueStyle}>0</span>
                  </span>

                  <span style={previewStatItemStyle}>
                    <span style={previewStatIconStyle}>💬</span>
                    <span style={previewStatValueStyle}>0</span>
                  </span>

                  <span style={previewStatItemStyle}>
                    <span style={previewStatIconStyle}>📚</span>
                    <span style={previewStatValueStyle}>
                      {(obraAtual?.capitulos.length || 0) === 1
                        ? "1 cap."
                        : `${obraAtual?.capitulos.length || 0} cap.`}
                    </span>
                  </span>
                </div>

                <div style={previewProgressCompactStyle}>
                  <div style={previewProgressTrackStyle}>
                    <div
                      style={{
                        ...previewProgressFillStyle,
                        width: `${progresso}%`,
                      }}
                    />
                  </div>

                  <span style={previewProgressTextStyle}>
                    {progresso}% pronto
                  </span>
                </div>

                <div style={previewActionRowStyle}>
                  <span style={previewGenreBadgeStyle}>
                    {generoFinal || "Gênero"}
                  </span>

                  <span style={previewActionBadgeStyle}>
                    {obraAtual?.publicado ? "Publicado" : "Rascunho"}
                  </span>
                </div>
              </div>
            </article>
          </aside>
        </section>
      </section>
    </main>
  );
}

const editarObraPageCss = `
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

  html[data-historietas-tema-visual] nav a[href="/painel-autor"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/painel-autor"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/painel-autor"] {
    background: var(--historietas-bottom-nav-active-bg, rgba(59, 7, 100, 0.54)) !important;
    border-color: var(--historietas-bottom-nav-active-border, rgba(109, 40, 217, 0.48)) !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual] nav a[href="/painel-autor"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon {
    color: #FFFFFF !important;
    background: var(--historietas-bottom-nav-active-icon-bg, #3B0764) !important;
    border-color: var(--historietas-bottom-nav-active-icon-border, rgba(167, 139, 250, 0.46)) !important;
  }

  html[data-historietas-tema-visual] input::placeholder,
  html[data-historietas-tema-visual] textarea::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  html[data-historietas-tema-visual] input,
  html[data-historietas-tema-visual] textarea,
  html[data-historietas-tema-visual] select {
    color: #FFFFFF !important;
  }
`;

const safeTextStyle: CSSProperties = {
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
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(900px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "14px 0 18px",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "14px",
  minWidth: 0,
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

const pagePillStyle: CSSProperties = {
  minHeight: "36px",
  padding: "0 13px",
  borderRadius: "999px",
  background: "rgba(249,115,22,0.11)",
  border: "1px solid rgba(249,115,22,0.24)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  maxWidth: "100%",
  ...safeTextStyle,
};

const titleHeaderStyle: CSSProperties = {
  ...topStyle,
  justifyContent: "center",
  flexWrap: "nowrap",
  marginTop: 0,
  marginBottom: "14px",
  textAlign: "center",
};

const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  position: "relative",
  marginBottom: "18px",
};

const desktopNotificationButtonStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  right: 0,
  transform: "translateY(-50%)",
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-surface-strong, #04000A)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 950,
  boxShadow: "none",
  zIndex: 2,
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

const headerTitleLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "25px",
  fontWeight: 950,
  letterSpacing: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  flex: "0 1 auto",
  ...safeTextStyle,
};

const desktopHeaderTitleLinkStyle: CSSProperties = {
  ...headerTitleLinkStyle,
};

const headerTitleMarkStyle: CSSProperties = {
  display: "none",
};

const desktopHeaderTitleMarkStyle: CSSProperties = {
  ...headerTitleMarkStyle,
};

const headerTitleTextStyle: CSSProperties = {
  display: "inline-block",
  marginLeft: "-1px",
  paddingRight: "0.2em",
  paddingBottom: "0.04em",
  whiteSpace: "nowrap",
  overflow: "visible",
  fontSize: "25px",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: 0,
  wordSpacing: "normal",
  background: "none",
  WebkitBackgroundClip: "initial",
  backgroundClip: "initial",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
};

const desktopHeaderTitleTextStyle: CSSProperties = {
  ...headerTitleTextStyle,
};


const heroBoxStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
  gap: "10px",
  padding: "24px 16px",
  borderRadius: "30px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "linear-gradient(135deg, #070212 0%, #04000A 58%, #020006 100%)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const titleStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  WebkitTextFillColor: "var(--historietas-accent, #F97316)",
  fontSize: "clamp(30px, 8vw, 46px)",
  lineHeight: 1.12,
  fontWeight: 950,
  letterSpacing: "-0.052em",
  maxWidth: "100%",
  textAlign: "center",
  textShadow: "none",
  overflow: "visible",
  wordBreak: "normal",
  overflowWrap: "normal",
};

const descriptionStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.55,
  fontWeight: 720,
  maxWidth: "720px",
  textAlign: "center",
  ...safeTextStyle,
};

const progressBoxStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gap: "8px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "0",
  minWidth: 0,
  width: "min(450px, 100%)",
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "none",
};

const progressTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "wrap",
  minWidth: 0,
};

const progressLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 900,
  ...safeTextStyle,
};

const progressNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "13px",
  fontWeight: 950,
  ...safeTextStyle,
};

const progressTrackStyle: CSSProperties = {
  height: "7px",
  overflow: "hidden",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  maxWidth: "100%",
};

const progressFillStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(90deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  transition: "width 0.2s ease",
};

const errorBoxStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  marginTop: "12px",
  padding: "11px",
  borderRadius: "16px",
  background: "rgba(239,68,68,0.075)",
  border: "1px solid rgba(239,68,68,0.18)",
  color: "#FCA5A5",
  minWidth: 0,
  boxSizing: "border-box",
  overflow: "hidden",
};

const errorTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FCA5A5",
  fontSize: "18px",
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

const errorTextStyle: CSSProperties = {
  margin: 0,
  color: "#FECACA",
  fontSize: "12px",
  lineHeight: 1.55,
  fontWeight: 850,
  ...safeTextStyle,
};

const mainGridStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  minWidth: 0,
  maxWidth: "100%",
};

const formStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  background: "transparent",
  border: "0",
  borderRadius: 0,
  padding: 0,
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};

const formHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "4px",
  minWidth: 0,
  textAlign: "center",
};

const formMiniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};


const fieldGroupStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const doubleFieldStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  minWidth: 0,
};

const labelStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 950,
  letterSpacing: "-0.01em",
  ...safeTextStyle,
};

const hiddenInputStyle: CSSProperties = {
  display: "none",
};

const coverUploadBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(70px, 82px) minmax(0, 1fr)",
  gap: "10px",
  alignItems: "stretch",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "0",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
  boxShadow: "none",
};

const coverUploadPreviewStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
};

const fileUploadBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(56px, 64px) minmax(0, 1fr)",
  gap: "12px",
  alignItems: "stretch",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "0",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
  boxShadow: "none",
};

const fileUploadIconBoxStyle: CSSProperties = {
  minHeight: "82px",
  borderRadius: "18px",
  background: "#04000A",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  boxShadow: "none",
};

const fileUploadIconStyle: CSSProperties = {
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  fontWeight: 950,
  lineHeight: 1,
  boxShadow: "none",
};

const fileUploadContentStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
};

const coverPlaceholderStyle: CSSProperties = {
  minHeight: "96px",
  borderRadius: "16px",
  background: "#04000A",
  backgroundImage: "linear-gradient(135deg, #08030F 0%, #04000A 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "none",
};

const coverPlaceholderIconStyle: CSSProperties = {
  width: "26px",
  height: "26px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  fontWeight: 950,
  position: "relative",
  zIndex: 1,
};

const coverPlaceholderTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 900,
  textAlign: "center",
  position: "relative",
  zIndex: 1,
  ...safeTextStyle,
};

const coverUploadContentStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: "5px",
  minWidth: 0,
};

const coverUploadTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "15px",
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

const fileNameStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 850,
  ...safeTextStyle,
};

const coverErrorStyle: CSSProperties = {
  color: "var(--historietas-danger-button-text, #FCA5A5)",
  fontSize: "11px",
  fontWeight: 850,
  ...safeTextStyle,
};

const coverButtonsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px",
  minWidth: 0,
};

const coverButtonStyle: CSSProperties = {
  flex: "1 1 94px",
  minHeight: "36px",
  maxWidth: "100%",
  padding: "0 12px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#08030F",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

const removeCoverButtonStyle: CSSProperties = {
  ...coverButtonStyle,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "46px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#04000A",
  color: "#FFFFFF",
  padding: "0 14px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 700,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  boxShadow: "none",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "90px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#04000A",
  color: "#FFFFFF",
  padding: "14px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 700,
  lineHeight: 1.58,
  resize: "vertical",
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  boxShadow: "none",
  ...safeTextStyle,
};

const hintStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  lineHeight: 1.45,
  fontWeight: 650,
  ...safeTextStyle,
};

const buttonAreaStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "6px",
  marginTop: "2px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const saveButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#08030F",
  color: "#FFFFFF",
  fontSize: "11.5px",
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

const disabledButtonStyle: CSSProperties = {
  ...saveButtonStyle,
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  boxShadow: "none",
  cursor: "not-allowed",
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#08030F",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "11.5px",
  fontWeight: 950,
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

const cancelButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
};

const previewPanelStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: 0,
  background: "transparent",
  border: "none",
  borderRadius: 0,
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const previewHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  justifyItems: "center",
  textAlign: "center",
  minWidth: 0,
};

const previewMiniTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  fontSize: "19px",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  textAlign: "center",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const previewCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(88px, 98px) minmax(0, 1fr)",
  alignItems: "stretch",
  gap: "14px",
  padding: "11px",
  borderRadius: "22px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const desktopPreviewCardStyle: CSSProperties = {
  ...previewCardStyle,
  gridTemplateColumns: "112px minmax(0, 1fr)",
  gap: "15px",
  padding: "13px",
  borderRadius: "24px",
};

const previewCoverGlowStyle: CSSProperties = {
  display: "none",
};

const previewCoverStyle: CSSProperties = {
  width: "100%",
  minHeight: "116px",
  height: "100%",
  maxHeight: "none",
  maxWidth: "100%",
  alignSelf: "stretch",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  background: "#04000A",
  backgroundImage: "linear-gradient(135deg, #08030F 0%, #04000A 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  border: "1px solid rgba(255,255,255,0.08)",
  minWidth: 0,
  boxSizing: "border-box",
  flex: "0 0 auto",
  boxShadow: "none",
};





const previewContentStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const previewBadgesStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  rowGap: "5px",
  minWidth: 0,
  maxWidth: "100%",
};

const previewBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const previewRatingBadgeStyle: CSSProperties = {
  ...previewBadgeStyle,
  color: "var(--historietas-text-primary, #FFFFFF)",
};




const previewObraTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "20px",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textDecoration: "none",
  borderBottom: "none",
  ...safeTextStyle,
};

const previewAuthorStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  margin: 0,
  color: "var(--historietas-text-secondary, #D8C8FF)",
  fontSize: "12px",
  fontWeight: 800,
  textDecoration: "none",
  borderBottom: "none",
  ...safeTextStyle,
};


const previewTopRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

const previewStatsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 850,
  maxWidth: "100%",
  minWidth: 0,
};

const previewStatItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  whiteSpace: "nowrap",
  lineHeight: 1,
};

const previewStatIconStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  flex: "0 0 auto",
};

const previewStatHeartIconStyle: CSSProperties = {
  ...previewStatIconStyle,
  color: "#E11D48",
};

const previewStatValueStyle: CSSProperties = {
  display: "inline-block",
  lineHeight: 1,
  whiteSpace: "nowrap",
};

const previewProgressCompactStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "8px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const previewProgressTrackStyle: CSSProperties = {
  width: "100%",
  height: "7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
  boxSizing: "border-box",
};

const previewProgressFillStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background:
    "linear-gradient(90deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
};

const previewProgressTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

const previewActionRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "2px",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
  boxSizing: "border-box",
};

const previewGenreBadgeStyle: CSSProperties = {
  flex: "0 1 42%",
  maxWidth: "42%",
  minHeight: "34px",
  padding: "0 10px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 900,
  lineHeight: 1.12,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const previewActionBadgeStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  maxWidth: "100%",
  minHeight: "34px",
  padding: "0 12px",
  borderRadius: "999px",
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1.15,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  textAlign: "center",
  ...safeTextStyle,
};

const emptyBoxStyle: CSSProperties = {
  marginTop: "24px",
  borderRadius: "24px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  padding: "24px 16px",
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "none",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "22px",
  fontWeight: 950,
  letterSpacing: "-0.045em",
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
  minHeight: "46px",
  width: "min(280px, 100%)",
  borderRadius: "999px",
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 12px",
  boxShadow: "none",
  ...safeTextStyle,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1120px, calc(100% - 48px))",
  padding: "24px 0 64px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "14px",
};

const desktopHeroBoxStyle: CSSProperties = {
  ...heroBoxStyle,
  padding: "30px 24px",
  borderRadius: "30px",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  fontSize: "clamp(38px, 4.4vw, 58px)",
  maxWidth: "760px",
  margin: "0 auto",
  textAlign: "center",
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  margin: "10px auto 0",
  maxWidth: "620px",
  textAlign: "center",
  fontSize: "14px",
};

const desktopProgressBoxStyle: CSSProperties = {
  ...progressBoxStyle,
  width: "min(520px, 100%)",
  padding: 0,
  gridColumn: "1 / -1",
};

const desktopMainGridStyle: CSSProperties = {
  ...mainGridStyle,
  gridTemplateColumns: "minmax(0, 1.52fr) minmax(340px, 0.88fr)",
  alignItems: "start",
  gap: "18px",
};

const desktopFormStyle: CSSProperties = {
  ...formStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  alignItems: "start",
  padding: 0,
  borderRadius: 0,
  gap: "16px",
  overflow: "visible",
};

const desktopFormHeaderStyle: CSSProperties = {
  ...formHeaderStyle,
  gap: "5px",
};

const desktopCoverUploadBoxStyle: CSSProperties = {
  ...coverUploadBoxStyle,
  gridTemplateColumns: "84px minmax(0, 1fr)",
  gap: "12px",
};

const desktopFileUploadBoxStyle: CSSProperties = {
  ...fileUploadBoxStyle,
  gridTemplateColumns: "76px minmax(0, 1fr)",
  gap: "14px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "0",
  boxShadow: "none",
};

const desktopDoubleFieldStyle: CSSProperties = {
  ...doubleFieldStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
  gridColumn: "1 / -1",
};

const desktopTextareaStyle: CSSProperties = {
  ...textareaStyle,
  minHeight: "90px",
};

const desktopButtonAreaStyle: CSSProperties = {
  ...buttonAreaStyle,
  gridColumn: "1 / -1",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  justifyContent: "stretch",
  gap: "8px",
};

const desktopSaveButtonStyle: CSSProperties = {
  ...saveButtonStyle,
  minHeight: "46px",
  fontSize: "13px",
};

const desktopDisabledButtonStyle: CSSProperties = {
  ...disabledButtonStyle,
  minHeight: "50px",
  fontSize: "14px",
};

const desktopSecondaryButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  minHeight: "46px",
  fontSize: "13px",
};

const desktopCancelButtonStyle: CSSProperties = {
  ...cancelButtonStyle,
  minHeight: "46px",
  fontSize: "13px",
};

const desktopPreviewPanelStyle: CSSProperties = {
  ...previewPanelStyle,
  position: "sticky",
  top: "24px",
  alignSelf: "start",
};