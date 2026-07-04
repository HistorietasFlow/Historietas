"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ChangeEvent, FormEvent } from "react";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { criarSlugBase, idObraSupabaseValido, normalizarTexto } from "../../lib/utils";
import { useNotificacoes } from "../../components/NotificacoesProvider";

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

type ArquivosObrasBackup = Record<string, ArquivoObraLocal>;

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

type NotificacaoLocal = {
  id: string;
  tipo: "novo-capitulo";
  titulo: string;
  mensagem: string;
  obraId: string;
  obraTitulo: string;
  autor: string;
  capituloId: string;
  capituloTitulo: string;
  href: string;
  lida: boolean;
  criadaEm: string;
  obraPublicada: boolean;
  capa: string;
  classificacaoIndicativa: string;
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
  visualizacoes?: number | null;
  views?: number | null;
  total_visualizacoes?: number | null;
  total_curtidas?: number | null;
  total_comentarios?: number | null;
  total_salvos?: number | null;
  total_lidos?: number | null;
  slug: string | null;
  link: string | null;
  criada_em: string | null;
  atualizado_em: string | null;
  capitulos?: SupabaseCapituloRow[] | null;
};

const STORAGE_KEY = "historietas-obras";
const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";
const MAX_TEXT_FILE_SIZE_BYTES = 700 * 1024;

function criarStorageKeyUsuarioAdicionarCapitulo(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : chave;
}

function lerStorageUsuarioAdicionarCapitulo(chave: string, userId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(
      criarStorageKeyUsuarioAdicionarCapitulo(chave, userId)
    );
  } catch {
    return null;
  }
}

function salvarJsonStorageUsuarioAdicionarCapitulo(
  chave: string,
  userId: string,
  valor: unknown
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      criarStorageKeyUsuarioAdicionarCapitulo(chave, userId),
      JSON.stringify(valor)
    );
  } catch {
    // localStorage é fallback; a criação do capítulo continua em memória.
  }
}

function criarId() {
  if (
    typeof window !== "undefined" &&
    window.crypto &&
    typeof window.crypto.randomUUID === "function"
  ) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function contarLetrasNumeros(texto: string) {
  return (texto.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]/g) || []).length;
}

function criarTituloPorNomeArquivo(nomeArquivo: string) {
  return nomeArquivo
    .replace(/\.(txt|md)$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function criarLoginHrefAdicionarCapitulo(obraId?: string) {
  const obraIdLimpo = obraId?.trim() || "";
  const redirectTo = obraIdLimpo
    ? `/adicionar-capitulo?obraId=${encodeURIComponent(obraIdLimpo)}`
    : "/adicionar-capitulo";
  const params = new URLSearchParams({
    redirectTo,
  });

  return `/login?${params.toString()}`;
}

function obterTextoProfileAdicionarCapitulo(valor: unknown) {
  return typeof valor === "string" && valor.trim() ? valor.trim() : "";
}

async function carregarNomeProfileAdicionarCapitulo(userId: string) {
  const usuarioId = userId.trim();

  if (!usuarioId) {
    return "";
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, nome")
      .eq("user_id", usuarioId)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const profile = data as Record<string, unknown>;
      const nome = obterTextoProfileAdicionarCapitulo(profile.nome);

      if (nome) {
        return nome;
      }
    }
  } catch {
    // O perfil é complemento social. A criação do capítulo não deve depender dele.
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, nome")
      .eq("id", usuarioId)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const profile = data as Record<string, unknown>;
      const nome = obterTextoProfileAdicionarCapitulo(profile.nome);

      if (nome) {
        return nome;
      }
    }
  } catch {
    // Compatibilidade com bases onde profiles.id é o próprio auth.users.id.
  }

  return "";
}

function aplicarAutorProfileAdicionarCapitulo(
  obrasParaAtualizar: ObraLocal[],
  userId: string,
  nomeProfile: string
) {
  const nomeAutor = nomeProfile.trim();
  const usuarioId = userId.trim();

  if (!nomeAutor || !usuarioId) {
    return obrasParaAtualizar;
  }

  return obrasParaAtualizar.map((obra) => {
    const autorId = obra.autorId?.trim() || usuarioId;

    if (autorId !== usuarioId) {
      return obra;
    }

    return {
      ...obra,
      autor: nomeAutor,
      autorId,
    };
  });
}

async function sincronizarAutorObraProfileAdicionarCapitulo(
  obraId: string,
  userId: string,
  nomeProfile: string
) {
  const obraIdLimpo = obraId.trim();
  const usuarioId = userId.trim();
  const nomeAutor = nomeProfile.trim();

  if (!obraIdLimpo || !usuarioId || !nomeAutor) {
    return;
  }

  try {
    await supabase
      .from("obras")
      .update({
        autor: nomeAutor,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", obraIdLimpo)
      .eq("user_id", usuarioId);
  } catch {
    // Se a atualização do nome falhar, o capítulo e o backup local continuam funcionando.
  }
}

function criarHrefLeituraCapitulo(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo" | "publicado">,
  capitulo: Pick<CapituloLocal, "id">,
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

function calcularEstatisticasCapitulo(
  titulo: string,
  texto: string,
  numeroCapitulo: number
) {
  const tituloFinal = titulo.trim() || `Capítulo ${numeroCapitulo}`;
  const textoLimpo = texto.trim();
  const palavras = textoLimpo ? textoLimpo.split(/\s+/).filter(Boolean).length : 0;
  const caracteres = texto.length;
  const caracteresValidos = contarLetrasNumeros(textoLimpo);
  const minutosLeitura = palavras > 0 ? Math.max(1, Math.ceil(palavras / 220)) : 0;
  const tituloValido = contarLetrasNumeros(tituloFinal) >= 3;
  const textoValido = caracteresValidos >= 20;

  return {
    tituloFinal,
    palavras,
    caracteres,
    caracteresValidos,
    minutosLeitura,
    tituloValido,
    textoValido,
    prontoParaCriar: tituloValido && textoValido,
  };
}

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
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
  try {
    const backupTexto = lerStorageUsuarioAdicionarCapitulo(
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

    salvarJsonStorageUsuarioAdicionarCapitulo(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupNormalizado
    );

    return backupNormalizado;
  } catch {
    salvarJsonStorageUsuarioAdicionarCapitulo(FILE_BACKUP_STORAGE_KEY, userId, {});
    return {};
  }
}

function obterChavesBackupArquivoAdicionarCapitulo(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo" | "link">
) {
  return Array.from(
    new Set(
      [
        `id:${obra.id}`,
        obra.id,
        `slug:${obra.slug || criarSlugBase(obra.titulo)}`,
        `titulo:${normalizarTexto(obra.titulo)}`,
        obra.link ? `link:${obra.link}` : "",
      ].filter((chave) => Boolean(chave.trim()))
    )
  );
}

function sincronizarBackupArquivosObras(obras: ObraLocal[], userId = "") {
  try {
    const backupAtual = carregarBackupArquivosObras(userId);

    obras.forEach((obra) => {
      const arquivoNormalizado = normalizarArquivoObra(obra.arquivoObra);

      if (arquivoNormalizado) {
        obterChavesBackupArquivoAdicionarCapitulo(obra).forEach((chave) => {
          backupAtual[chave] = arquivoNormalizado;
        });
      }
    });

    salvarJsonStorageUsuarioAdicionarCapitulo(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupAtual
    );
  } catch {
    // Se o backup falhar, a criação do capítulo continua funcionando normalmente.
  }
}

function restaurarArquivoObraComBackup(
  obra: ObraLocal,
  backup: ArquivosObrasBackup
): ObraLocal {
  if (obra.arquivoObra) {
    return obra;
  }

  const arquivoBackup = obterChavesBackupArquivoAdicionarCapitulo(obra)
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

function normalizarNumeroAdicionarCapitulo(valor: unknown, fallback = 0) {
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

function obterCampoNumericoObraAdicionarCapitulo(
  obra: Partial<ObraLocal> & Record<string, unknown>,
  campos: string[],
  fallback = 0
) {
  const valorEncontrado = campos
    .map((campo) => obra[campo])
    .find((valor) => {
      return (
        (typeof valor === "number" && Number.isFinite(valor)) ||
        (typeof valor === "string" && Boolean(valor.trim()))
      );
    });

  return normalizarNumeroAdicionarCapitulo(valorEncontrado, fallback);
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
  const obraComMetricas = obra as Partial<ObraLocal> & Record<string, unknown>;
  const totalCurtidasLocal = capitulosNormalizados.filter((capitulo) => capitulo.curtiu).length;
  const totalComentariosLocal = capitulosNormalizados.filter((capitulo) =>
    capitulo.comentario.trim()
  ).length;
  const totalSalvosLocal = capitulosNormalizados.filter((capitulo) => capitulo.salvo).length;
  const totalLidosLocal = capitulosNormalizados.filter((capitulo) => capitulo.lido).length;

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
        : typeof (obra as Record<string, unknown>).user_id === "string" &&
          ((obra as Record<string, unknown>).user_id as string).trim()
          ? ((obra as Record<string, unknown>).user_id as string).trim()
          : typeof (obra as Record<string, unknown>).userId === "string" &&
            ((obra as Record<string, unknown>).userId as string).trim()
            ? ((obra as Record<string, unknown>).userId as string).trim()
            : typeof (obra as Record<string, unknown>).autor_id === "string" &&
              ((obra as Record<string, unknown>).autor_id as string).trim()
              ? ((obra as Record<string, unknown>).autor_id as string).trim()
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
    visualizacoes: obterCampoNumericoObraAdicionarCapitulo(
      obraComMetricas,
      [
        "visualizacoes",
        "views",
        "visualizacoesTotal",
        "totalVisualizacoes",
        "total_visualizacoes",
      ]
    ),
    totalCurtidas: obterCampoNumericoObraAdicionarCapitulo(
      obraComMetricas,
      ["totalCurtidas", "curtidas", "likes", "totalLikes", "total_curtidas"],
      totalCurtidasLocal
    ),
    totalComentarios: obterCampoNumericoObraAdicionarCapitulo(
      obraComMetricas,
      [
        "totalComentarios",
        "comentarios",
        "comments",
        "totalComments",
        "total_comentarios",
      ],
      totalComentariosLocal
    ),
    totalSalvos: obterCampoNumericoObraAdicionarCapitulo(
      obraComMetricas,
      ["totalSalvos", "salvos", "favoritos", "totalFavoritos", "total_salvos"],
      totalSalvosLocal
    ),
    totalLidos: obterCampoNumericoObraAdicionarCapitulo(
      obraComMetricas,
      ["totalLidos", "lidos", "leituras", "totalLeituras", "total_lidos"],
      totalLidosLocal
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

function normalizarCategoriaSupabase(
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

function normalizarCapituloSupabase(
  capitulo: SupabaseCapituloRow,
  index: number,
  capituloLocal?: CapituloLocal
): CapituloLocal {
  return {
    id: capitulo.id,
    titulo: capitulo.titulo?.trim() || `Capítulo ${index + 1}`,
    texto: capitulo.texto || "",
    curtiu: Boolean(capituloLocal?.curtiu),
    salvo: Boolean(capituloLocal?.salvo),
    comentario: capituloLocal?.comentario || "",
    criadoEm: capitulo.criado_em || "",
    lido: Boolean(capituloLocal?.lido),
    lidoEm: capituloLocal?.lidoEm || "",
  };
}

function normalizarObraSupabase(
  obra: SupabaseObraRow,
  index: number,
  obraLocal?: ObraLocal,
  autorProfile = ""
): ObraLocal {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo])
  );

  const capitulosSupabase = Array.isArray(obra.capitulos)
    ? [...obra.capitulos].sort((capituloA, capituloB) => {
        const ordemA =
          typeof capituloA.ordem === "number" ? capituloA.ordem : 999999;
        const ordemB =
          typeof capituloB.ordem === "number" ? capituloB.ordem : 999999;

        return ordemA - ordemB;
      })
    : [];

  const capitulosNormalizados = capitulosSupabase.map((capitulo, capituloIndex) =>
    normalizarCapituloSupabase(
      capitulo,
      capituloIndex,
      capitulosLocaisPorId.get(capitulo.id)
    )
  );

  const arquivoObraSupabase: ArquivoObraLocal | null = obra.arquivo_url
    ? {
        nome: obra.arquivo_nome?.trim() || "Arquivo da obra",
        tipo: obra.arquivo_tipo || "",
        tamanho:
          typeof obra.arquivo_tamanho === "number"
            ? obra.arquivo_tamanho
            : 0,
        conteudo: obra.arquivo_url,
        categoria: normalizarCategoriaSupabase(obra.arquivo_categoria),
        criadoEm: obra.criada_em || "",
      }
    : null;

  const titulo = obra.titulo?.trim() || "Obra sem título";
  const slug = obra.slug?.trim() || criarSlugBase(titulo || `obra-${index + 1}`);
  const totalCurtidasLocal = capitulosNormalizados.filter((capitulo) => capitulo.curtiu).length;
  const totalComentariosLocal = capitulosNormalizados.filter((capitulo) =>
    capitulo.comentario.trim()
  ).length;
  const totalSalvosLocal = capitulosNormalizados.filter((capitulo) => capitulo.salvo).length;
  const totalLidosLocal = capitulosNormalizados.filter((capitulo) => capitulo.lido).length;

  return {
    id: obra.id,
    titulo,
    autor:
      autorProfile.trim() ||
      obra.autor?.trim() ||
      obraLocal?.autor ||
      "Autor não informado",
    autorId: obra.user_id || obraLocal?.autorId || "",
    genero: obra.genero?.trim() || "Não informado",
    formato: obra.formato?.trim() || "Não informado",
    classificacaoIndicativa:
      obra.classificacao_indicativa?.trim() || "Não informada",
    sinopse: obra.sinopse?.trim() || "Nenhuma sinopse informada.",
    tags:
      Array.isArray(obra.tags) && obra.tags.length > 0
        ? obra.tags.filter((tag) => typeof tag === "string" && Boolean(tag.trim()))
        : ["sem tags"],
    capa: obra.capa_url || obraLocal?.capa || "",
    capaNome: obra.capa_nome || obraLocal?.capaNome || "",
    arquivoObra: arquivoObraSupabase || obraLocal?.arquivoObra || null,
    publicado: Boolean(obra.publicado),
    capitulos: capitulosNormalizados,
    criadaEm: obra.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulosNormalizados),
    visualizacoes: normalizarNumeroAdicionarCapitulo(
      obra.visualizacoes ?? obra.views ?? obra.total_visualizacoes,
      obraLocal?.visualizacoes || 0
    ),
    totalCurtidas: normalizarNumeroAdicionarCapitulo(
      obra.total_curtidas,
      Math.max(obraLocal?.totalCurtidas || 0, totalCurtidasLocal)
    ),
    totalComentarios: normalizarNumeroAdicionarCapitulo(
      obra.total_comentarios,
      Math.max(obraLocal?.totalComentarios || 0, totalComentariosLocal)
    ),
    totalSalvos: normalizarNumeroAdicionarCapitulo(
      obra.total_salvos,
      Math.max(obraLocal?.totalSalvos || 0, totalSalvosLocal)
    ),
    totalLidos: normalizarNumeroAdicionarCapitulo(
      obra.total_lidos,
      Math.max(obraLocal?.totalLidos || 0, totalLidosLocal)
    ),
    slug,
    link: obra.link?.trim() || `/obra/${slug}`,
  };
}

function mesclarObrasComSupabase(
  obrasLocais: ObraLocal[],
  obrasSupabase: ObraLocal[]
) {
  const obrasLocaisPorId = new Map(obrasLocais.map((obra) => [obra.id, obra]));
  const obrasSupabaseIds = new Set(obrasSupabase.map((obra) => obra.id));

  const obrasMescladas = obrasSupabase.map((obraSupabase) => {
    const obraLocal = obrasLocaisPorId.get(obraSupabase.id);

    if (!obraLocal) {
      return obraSupabase;
    }

    return {
      ...obraSupabase,
      capitulos: obraSupabase.capitulos.map((capituloSupabase) => {
        const capituloLocal = obraLocal.capitulos.find(
          (capitulo) => capitulo.id === capituloSupabase.id
        );

        return capituloLocal
          ? {
              ...capituloSupabase,
              curtiu: capituloLocal.curtiu,
              salvo: capituloLocal.salvo,
              comentario: capituloLocal.comentario,
              lido: capituloLocal.lido,
              lidoEm: capituloLocal.lidoEm,
            }
          : capituloSupabase;
      }),
      ultimoCapituloLidoId: obraLocal.ultimoCapituloLidoId,
      ultimaLeituraEm: obraLocal.ultimaLeituraEm,
      progressoLeitura: calcularProgressoLeitura(obraSupabase.capitulos),
      visualizacoes: Math.max(
        obraSupabase.visualizacoes || 0,
        obraLocal.visualizacoes || 0
      ),
      totalCurtidas: Math.max(
        obraSupabase.totalCurtidas || 0,
        obraLocal.totalCurtidas || 0
      ),
      totalComentarios: Math.max(
        obraSupabase.totalComentarios || 0,
        obraLocal.totalComentarios || 0
      ),
      totalSalvos: Math.max(
        obraSupabase.totalSalvos || 0,
        obraLocal.totalSalvos || 0
      ),
      totalLidos: Math.max(
        obraSupabase.totalLidos || 0,
        obraLocal.totalLidos || 0
      ),
    };
  });

  const obrasSomenteLocais = obrasLocais.filter(
    (obraLocal) => !obrasSupabaseIds.has(obraLocal.id)
  );

  return [...obrasMescladas, ...obrasSomenteLocais];
}

function carregarObrasLocais(userId = "") {
  const userIdLimpo = userId.trim();
  const obrasSalvasTexto = lerStorageUsuarioAdicionarCapitulo(
    STORAGE_KEY,
    userIdLimpo
  );
  const obrasSalvasJson = obrasSalvasTexto ? JSON.parse(obrasSalvasTexto) : [];
  const backupArquivosObras = carregarBackupArquivosObras(userIdLimpo);

  const obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
    ? obrasSalvasJson.map((obra, index) =>
        restaurarArquivoObraComBackup(
          normalizarObra(obra as Partial<ObraLocal>, index),
          backupArquivosObras
        )
      )
    : [];

  const obrasComAutorCorrigido = userIdLimpo
    ? obrasNormalizadas.map((obra) => ({
        ...obra,
        autorId: obra.autorId?.trim() || userIdLimpo,
      }))
    : obrasNormalizadas;

  const obrasDoUsuario = userIdLimpo
    ? obrasComAutorCorrigido.filter((obra) =>
        obraPertenceAoUsuario(obra, userIdLimpo)
      )
    : obrasComAutorCorrigido;

  sincronizarBackupArquivosObras(obrasDoUsuario, userIdLimpo);
  salvarJsonStorageUsuarioAdicionarCapitulo(
    STORAGE_KEY,
    userIdLimpo,
    obrasDoUsuario.map(prepararObraAdicionarCapituloParaStorage)
  );

  return obrasDoUsuario;
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

function criarNotificacaoNovoCapitulo(
  obra: ObraLocal,
  capitulo: CapituloLocal,
  numeroCapitulo: number,
  criadaEm: string
): NotificacaoLocal {
  return {
    id: criarId(),
    tipo: "novo-capitulo",
    titulo: obra.publicado
      ? "Novo capítulo publicado"
      : "Novo capítulo salvo em rascunho",
    mensagem: `${capitulo.titulo} foi adicionado em ${obra.titulo}.`,
    obraId: obra.id,
    obraTitulo: obra.titulo,
    autor: obra.autor,
    capituloId: capitulo.id,
    capituloTitulo: `Capítulo ${numeroCapitulo}: ${capitulo.titulo}`,
    href: criarHrefLeituraCapitulo(obra, capitulo, numeroCapitulo),
    lida: false,
    criadaEm,
    obraPublicada: obra.publicado,
    capa: obra.capa,
    classificacaoIndicativa: obra.classificacaoIndicativa,
  };
}

function ehDataUrlAdicionarCapitulo(valor: string) {
  return valor.startsWith("data:");
}

function prepararObraAdicionarCapituloParaStorage(obra: ObraLocal): ObraLocal {
  return {
    ...obra,
    capa: ehDataUrlAdicionarCapitulo(obra.capa) ? "" : obra.capa,
    arquivoObra: obra.arquivoObra
      ? {
          ...obra.arquivoObra,
          conteudo: ehDataUrlAdicionarCapitulo(obra.arquivoObra.conteudo)
            ? ""
            : obra.arquivoObra.conteudo,
        }
      : null,
  };
}

function salvarObrasAdicionarCapituloStorage(
  obrasParaSalvar: ObraLocal[],
  userId = ""
) {
  const userIdLimpo = userId.trim();
  const obrasSemArquivosPesados = obrasParaSalvar.map(
    prepararObraAdicionarCapituloParaStorage
  );

  const obrasParaStorage = userIdLimpo
    ? obrasSemArquivosPesados.filter((obra) =>
        obraPertenceAoUsuario(obra, userIdLimpo)
      )
    : obrasSemArquivosPesados;

  salvarJsonStorageUsuarioAdicionarCapitulo(
    STORAGE_KEY,
    userIdLimpo,
    obrasParaStorage
  );

  sincronizarBackupArquivosObras(obrasParaSalvar, userIdLimpo);
}

async function registrarDiarioNovoCapitulo({
  userId,
  obra,
  capitulo,
  numeroCapitulo,
  criadoEm,
}: {
  userId: string;
  obra: ObraLocal;
  capitulo: CapituloLocal;
  numeroCapitulo: number;
  criadoEm: string;
}) {
  try {
    const payload = {
      user_id: userId,
      tipo: "publicou_capitulo",
      obra_id: obra.id,
      capitulo_id: capitulo.id,
      texto: "",
      visibilidade: "publico",
      metadata: {
        obra_titulo: obra.titulo,
        titulo_obra: obra.titulo,
        capitulo_titulo: capitulo.titulo,
        numero_capitulo: numeroCapitulo,
        href: criarHrefLeituraCapitulo(obra, capitulo, numeroCapitulo),
      },
      criado_em: criadoEm,
      atualizado_em: criadoEm,
    };

    const { error } = await supabase.from("diario_atividades").insert(payload);

    if (!error) {
      return;
    }

    await supabase.from("diario_atividades").insert({
      user_id: userId,
      tipo: "publicou_capitulo",
      obra_id: obra.id,
      capitulo_id: capitulo.id,
      texto: "",
      visibilidade: "publico",
      criado_em: criadoEm,
    });
  } catch (error) {
    console.warn("Não consegui registrar o capítulo no Diário:", error);
  }
}

async function registrarNotificacoesNovoCapituloSupabase({
  userId,
  obra,
  capitulo,
  numeroCapitulo,
  criadoEm,
}: {
  userId: string;
  obra: ObraLocal;
  capitulo: CapituloLocal;
  numeroCapitulo: number;
  criadoEm: string;
}) {
  if (!obra.publicado) {
    return;
  }

  try {
    const { data, error } = await supabase
      .from("seguindo_obras")
      .select("user_id")
      .eq("obra_id", obra.id)
      .limit(1000);

    if (error || !Array.isArray(data)) {
      return;
    }

    const usuariosNotificar = Array.from(
      new Set(
        data
          .map((registro) => {
            if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
              return "";
            }

            const usuarioNotificado = (registro as Record<string, unknown>).user_id;

            return typeof usuarioNotificado === "string"
              ? usuarioNotificado.trim()
              : "";
          })
          .filter((usuarioNotificado) =>
            Boolean(usuarioNotificado && usuarioNotificado !== userId)
          )
      )
    );

    if (usuariosNotificar.length === 0) {
      return;
    }

    const href = criarHrefLeituraCapitulo(obra, capitulo, numeroCapitulo);
    const tituloNotificacao = "Novo capítulo publicado";
    const mensagemNotificacao = `${capitulo.titulo} foi adicionado em ${obra.titulo}.`;
    const payloadCompleto = usuariosNotificar.map((usuarioNotificado) => ({
      user_id: usuarioNotificado,
      tipo: "novo-capitulo",
      titulo: tituloNotificacao,
      mensagem: mensagemNotificacao,
      obra_id: obra.id,
      capitulo_id: capitulo.id,
      href,
      lida: false,
      metadata: {
        obra_titulo: obra.titulo,
        capitulo_titulo: capitulo.titulo,
        numero_capitulo: numeroCapitulo,
        autor: obra.autor,
        capa: obra.capa,
      },
      criada_em: criadoEm,
    }));

    const { error: erroCompleto } = await supabase
      .from("notificacoes")
      .insert(payloadCompleto);

    if (!erroCompleto) {
      return;
    }

    const payloadBasico = usuariosNotificar.map((usuarioNotificado) => ({
      user_id: usuarioNotificado,
      tipo: "novo-capitulo",
      titulo: tituloNotificacao,
      mensagem: mensagemNotificacao,
      href,
      lida: false,
      criada_em: criadoEm,
    }));

    await supabase.from("notificacoes").insert(payloadBasico);
  } catch (error) {
    console.warn("Não consegui notificar seguidores do novo capítulo:", error);
  }
}

function registrarNotificacaoNovoCapituloLocal(
  notificacao: NotificacaoLocal
) {
  return notificacao;
}

export default function AdicionarCapituloPage() {
  const router = useRouter();

  const [obraId, setObraId] = useState("");
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [capituloCriado, setCapituloCriado] = useState<CapituloLocal | null>(
    null
  );
  const [notificacaoCriada, setNotificacaoCriada] =
    useState<NotificacaoLocal | null>(null);
  const [arquivoImportadoNome, setArquivoImportadoNome] = useState("");
  const [arquivoImportadoErro, setArquivoImportadoErro] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { notificacoesNaoLidas } = useNotificacoes();

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

    const params = new URLSearchParams(window.location.search);
    const obraIdParam = params.get("obraId") || "";
    const atualizarObraIdTimer = window.setTimeout(() => {
      if (!cancelado) {
        setObraId(obraIdParam);
      }
    }, 0);

    async function carregarDados() {
      try {
        const {
          data: { user },
          error: erroUsuario,
        } = await supabase.auth.getUser();

        if (cancelado) {
          return;
        }

        if (erroUsuario || !user) {
          setUsuarioIdLogado("");
          setCarregando(false);
          router.replace(criarLoginHrefAdicionarCapitulo(obraIdParam));
          return;
        }

        setUsuarioIdLogado(user.id);

        const nomeProfileAutor = await carregarNomeProfileAdicionarCapitulo(user.id);

        let todasObrasLocais: ObraLocal[] = [];
        let obrasLocais: ObraLocal[] = [];

        try {
          todasObrasLocais = carregarObrasLocais(user.id);
          obrasLocais = aplicarAutorProfileAdicionarCapitulo(
            filtrarObrasDoUsuario(todasObrasLocais, user.id),
            user.id,
            nomeProfileAutor
          );
        } catch {
          todasObrasLocais = [];
          obrasLocais = [];
        }

        let obrasFinais = obrasLocais;

        try {
          const { data, error } = await supabase
            .from("obras")
            .select(
              "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,visualizacoes,slug,link,criada_em,atualizado_em,capitulos(id,obra_id,user_id,titulo,texto,ordem,publicado,criado_em,atualizado_em)"
            )
            .eq("user_id", user.id)
            .order("criada_em", { ascending: false })
            .limit(80);

          if (!error && Array.isArray(data)) {
            const obrasLocaisPorId = new Map(
              obrasLocais.map((obra) => [obra.id, obra])
            );

            const obrasSupabase = data.map((obra, index) =>
              normalizarObraSupabase(
                obra as unknown as SupabaseObraRow,
                index,
                obrasLocaisPorId.get((obra as unknown as SupabaseObraRow).id),
                nomeProfileAutor
              )
            );

            obrasFinais = aplicarAutorProfileAdicionarCapitulo(
              mesclarObrasComSupabase(obrasLocais, obrasSupabase),
              user.id,
              nomeProfileAutor
            );
            const obrasLocaisAtualizadas = atualizarObrasLocaisDoUsuario(
              todasObrasLocais,
              obrasFinais,
              user.id
            );

            salvarObrasAdicionarCapituloStorage(obrasLocaisAtualizadas, user.id);
          }
        } catch {
          // Se o Supabase falhar, mantém somente as obras locais do usuário logado.
        }

        if (cancelado) {
          return;
        }

        setObras(obrasFinais);
        setCarregando(false);
      } catch {
        if (cancelado) {
          return;
        }

        setUsuarioIdLogado("");
        setObras([]);
        setCarregando(false);
        router.replace(criarLoginHrefAdicionarCapitulo(obraIdParam));
      }
    }

    carregarDados();

    return () => {
      cancelado = true;
      window.clearTimeout(atualizarObraIdTimer);
    };
  }, [router]);

  const obraAtual = useMemo(() => {
    return obras.find((obra) => obra.id === obraId) || null;
  }, [obras, obraId]);

  const numeroNovoCapitulo = obraAtual ? obraAtual.capitulos.length + 1 : 1;

  const tituloPreview = titulo.trim() || `Capítulo ${numeroNovoCapitulo}`;

  const textoPreview = texto.trim();




  function salvarObras(novasObras: ObraLocal[]) {
    const backupArquivosObras = carregarBackupArquivosObras(usuarioIdLogado);
    const obrasNormalizadas = novasObras.map((obra, index) =>
      restaurarArquivoObraComBackup(
        normalizarObra(obra, index),
        backupArquivosObras
      )
    );

    if (!usuarioIdLogado) {
      setObras(obrasNormalizadas);
      return;
    }

    let todasObrasLocaisAtuais: ObraLocal[] = [];

    try {
      todasObrasLocaisAtuais = carregarObrasLocais(usuarioIdLogado);
    } catch {
      todasObrasLocaisAtuais = [];
    }

    const obrasLocaisAtualizadas = atualizarObrasLocaisDoUsuario(
      todasObrasLocaisAtuais,
      obrasNormalizadas,
      usuarioIdLogado
    );

    salvarObrasAdicionarCapituloStorage(obrasLocaisAtualizadas, usuarioIdLogado);
    setObras(obrasNormalizadas);
  }

  function limparFeedback() {
    if (erro) {
      setErro("");
    }

    if (capituloCriado) {
      setCapituloCriado(null);
    }

    if (notificacaoCriada) {
      setNotificacaoCriada(null);
    }
  }

  async function importarArquivoTexto(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const arquivo = event.target.files?.[0] || null;
    event.target.value = "";

    if (!arquivo) {
      return;
    }

    limparFeedback();
    setArquivoImportadoNome("");
    setArquivoImportadoErro("");

    const nomeMinusculo = arquivo.name.toLowerCase();
    const extensaoValida =
      nomeMinusculo.endsWith(".txt") || nomeMinusculo.endsWith(".md");

    if (!extensaoValida) {
      setArquivoImportadoErro(
        "Envie um arquivo .txt ou .md para importar o texto do capítulo."
      );
      return;
    }

    if (arquivo.size > MAX_TEXT_FILE_SIZE_BYTES) {
      setArquivoImportadoErro(
        "Esse arquivo é grande demais. Use um arquivo de até 700 KB."
      );
      return;
    }

    try {
      const conteudoArquivo = await arquivo.text();
      const textoImportado = conteudoArquivo.replace(/\r\n/g, "\n").trim();

      if (contarLetrasNumeros(textoImportado) < 20) {
        setArquivoImportadoErro(
          "O arquivo foi lido, mas não tem texto suficiente para formar um capítulo."
        );
        return;
      }

      const tituloArquivo = criarTituloPorNomeArquivo(arquivo.name);
      const estatisticasImportadas = calcularEstatisticasCapitulo(
        tituloArquivo || titulo,
        textoImportado,
        numeroNovoCapitulo
      );

      setTexto(textoImportado);

      if (!titulo.trim() && tituloArquivo) {
        setTitulo(tituloArquivo);
      }

      setArquivoImportadoNome(
        `${arquivo.name} • ${estatisticasImportadas.palavras} palavras • ${estatisticasImportadas.minutosLeitura} min`
      );
    } catch {
      setArquivoImportadoErro(
        "Não consegui ler esse arquivo. Tente salvar como .txt ou .md e importar novamente."
      );
    }
  }

  function validarCapitulo() {
    const tituloFinal = titulo.trim() || `Capítulo ${numeroNovoCapitulo}`;
    const textoLimpo = texto.trim();

    if (contarLetrasNumeros(tituloFinal) < 3) {
      return "O título do capítulo precisa ter pelo menos 3 letras ou números. Se quiser usar o título automático, deixe o campo vazio.";
    }

    if (contarLetrasNumeros(textoLimpo) < 20) {
      return "O texto do capítulo precisa ter pelo menos 20 letras ou números.";
    }

    return "";
  }

  async function criarCapitulo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!obraAtual || processando) {
      return;
    }

    const erroValidacao = validarCapitulo();

    if (erroValidacao) {
      setErro(erroValidacao);
      setCapituloCriado(null);
      setNotificacaoCriada(null);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    setProcessando(true);
    setErro("");

    try {
      const {
        data: { user },
        error: erroUsuario,
      } = await supabase.auth.getUser();

      if (erroUsuario || !user) {
        setProcessando(false);
        router.replace(criarLoginHrefAdicionarCapitulo(obraAtual.id || obraId));
        return;
      }

      if (obraAtual.autorId && obraAtual.autorId !== user.id) {
        setProcessando(false);
        setErro("Você não tem permissão para adicionar capítulo nesta obra.");

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      const nomeProfileAutor = await carregarNomeProfileAdicionarCapitulo(user.id);
      const obraAtualComAutorProfile: ObraLocal = {
        ...obraAtual,
        autor: nomeProfileAutor || obraAtual.autor,
        autorId: obraAtual.autorId || user.id,
      };

      void sincronizarAutorObraProfileAdicionarCapitulo(
        obraAtualComAutorProfile.id,
        user.id,
        nomeProfileAutor
      );

      const criadoEm = new Date().toISOString();
      const tituloFinal =
        titulo.trim() || `Capítulo ${obraAtual.capitulos.length + 1}`;
      const textoFinal = texto.trim();

      let novoCapitulo: CapituloLocal = {
        id: criarId(),
        titulo: tituloFinal,
        texto: textoFinal,
        curtiu: false,
        salvo: false,
        comentario: "",
        criadoEm,
        lido: false,
        lidoEm: "",
      };

      try {
        const { data, error } = await supabase
          .from("capitulos")
          .insert({
            obra_id: obraAtual.id,
            user_id: user.id,
            titulo: tituloFinal,
            texto: textoFinal,
            ordem: obraAtual.capitulos.length + 1,
            publicado: true,
          })
          .select("id, criado_em")
          .single();

        if (error) {
          console.warn("Não consegui salvar capítulo no Supabase:", error.message);
        } else if (data?.id) {
          novoCapitulo = {
            ...novoCapitulo,
            id: data.id,
            criadoEm:
              typeof data.criado_em === "string" ? data.criado_em : criadoEm,
          };
        }
      } catch {
        // Se o Supabase falhar, mantém o salvamento local como backup do autor logado.
      }

      const novaNotificacao = criarNotificacaoNovoCapitulo(
        obraAtualComAutorProfile,
        novoCapitulo,
        obraAtual.capitulos.length + 1,
        novoCapitulo.criadoEm || criadoEm
      );

      const novasObras = obras.map((obra) => {
        if (obra.id !== obraAtual.id) {
          return obra;
        }

        const capitulosAtualizados = [...obra.capitulos, novoCapitulo];

        return {
          ...obra,
          autor: nomeProfileAutor || obra.autor,
          autorId: obra.autorId || usuarioIdLogado || user.id,
          capitulos: capitulosAtualizados,
          progressoLeitura: calcularProgressoLeitura(capitulosAtualizados),
        };
      });

      salvarObras(novasObras);

      void registrarDiarioNovoCapitulo({
        userId: user.id,
        obra: obraAtualComAutorProfile,
        capitulo: novoCapitulo,
        numeroCapitulo: obraAtual.capitulos.length + 1,
        criadoEm: novoCapitulo.criadoEm || criadoEm,
      });

      void registrarNotificacoesNovoCapituloSupabase({
        userId: user.id,
        obra: obraAtualComAutorProfile,
        capitulo: novoCapitulo,
        numeroCapitulo: obraAtual.capitulos.length + 1,
        criadoEm: novoCapitulo.criadoEm || criadoEm,
      });

      setNotificacaoCriada(
        registrarNotificacaoNovoCapituloLocal(novaNotificacao)
      );

      setCapituloCriado(novoCapitulo);
      setTitulo("");
      setTexto("");
      setArquivoImportadoNome("");
      setArquivoImportadoErro("");
      setProcessando(false);
    } catch {
      setProcessando(false);

      alert(
        "Não consegui salvar esse capítulo. Tente atualizar a página e criar novamente."
      );
    }
  }

  if (carregando) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${adicionarCapituloPageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      </main>
    );
  }

  if (!obraAtual) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${adicionarCapituloPageCss}`}</style>

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

  const minhaObraHref = "/painel-autor";
  const capituloCriadoHref = capituloCriado
    ? criarHrefLeituraCapitulo(
        obraAtual,
        capituloCriado,
        obraAtual.capitulos.length
      )
    : "";


  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${adicionarCapituloPageCss}`}</style>

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
              ADICIONAR CAPÍTULO
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
            <h2 style={errorTitleStyle}>Não foi possível criar</h2>

            <p style={errorTextStyle}>{erro}</p>
          </section>
        )}

        <section style={isDesktop ? desktopMainGridSoloStyle : mainGridStyle}>
          <form onSubmit={criarCapitulo} style={isDesktop ? desktopFormPanelStyle : formPanelStyle}>
            <div
              style={
                isDesktop
                  ? { ...desktopFormHeaderStyle, gridColumn: "1 / -1" }
                  : formHeaderStyle
              }
            >
              <span style={formMiniTitleStyle}>Capítulo {String(numeroNovoCapitulo || 1).padStart(2, "0")}</span>

              <h2 style={isDesktop ? desktopFormTitleStyle : formTitleStyle}>
                {obraAtual.titulo}
              </h2>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Título do capítulo</label>

              <input
                value={titulo}
                onChange={(event) => {
                  setTitulo(event.target.value);
                  limparFeedback();
                  setArquivoImportadoErro("");
                }}
                style={inputStyle}
                placeholder={`Ex: Capítulo ${numeroNovoCapitulo}`}
                type="text"
              />

              <span style={hintStyle}>
                Opcional. Se deixar vazio, o sistema usa Capítulo{" "}
                {numeroNovoCapitulo}.
              </span>
            </div>

            <div
              style={
                isDesktop
                  ? { ...fieldGroupStyle, gridColumn: "1 / -1" }
                  : fieldGroupStyle
              }
            >
              <label style={labelStyle}>Texto do capítulo</label>

              <div style={isDesktop ? desktopImportBoxStyle : importBoxStyle}>
                <div style={importIconBoxStyle}>
                  <span style={importIconStyle}>TXT</span>
                </div>

                <div style={importInfoStyle}>
                  <strong style={importTitleStyle}>Importar versão revisada</strong>

                  <span style={hintStyle}>
                    Opcional. Importe um arquivo .txt ou .md.
                  </span>

                  {arquivoImportadoNome && (
                    <span style={importSuccessStyle}>
                      Arquivo importado: {arquivoImportadoNome}
                    </span>
                  )}

                  {arquivoImportadoErro && (
                    <span style={importErrorStyle}>{arquivoImportadoErro}</span>
                  )}

                  <label style={isDesktop ? desktopImportButtonStyle : importButtonStyle}>
                    Importar .txt/.md
                    <input
                      type="file"
                      accept=".txt,.md,text/plain,text/markdown"
                      onChange={importarArquivoTexto}
                      style={hiddenFileInputStyle}
                    />
                  </label>
                </div>
              </div>

              <textarea
                value={texto}
                onChange={(event) => {
                  setTexto(event.target.value);
                  limparFeedback();
                  setArquivoImportadoErro("");
                }}
                style={isDesktop ? desktopTextareaStyle : textareaStyle}
                placeholder="Escreva o texto do capítulo aqui..."
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
                      ? desktopPrimaryButtonStyle
                      : primaryButtonStyle),
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                }}
                disabled={processando}
              >
                {processando ? (
                  "Salvando..."
                ) : capituloCriado ? (
                  <>
                    <span>Criado</span>
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
                  "Criar capítulo"
                )}
              </button>

              <Link href={capituloCriadoHref || minhaObraHref} style={isDesktop ? desktopSecondaryButtonStyle : secondaryButtonStyle}>
                {capituloCriado ? "Ler capítulo" : "Ver obra"}
              </Link>

              <Link href={minhaObraHref} style={isDesktop ? desktopCancelButtonStyle : cancelButtonStyle}>
                Cancelar
              </Link>
            </div>

          </form>

          <aside style={isDesktop ? desktopPreviewPanelStyle : previewPanelStyle}>
            <div style={previewHeaderStyle}>
              <span style={previewMiniTitleStyle}>PRÉVIA DO CAPÍTULO</span>
            </div>

            <article style={isDesktop ? desktopPreviewChapterCardStyle : previewChapterCardStyle}>
              <div style={previewTopRowStyle}>
                <h3 style={isDesktop ? desktopPreviewChapterTitleStyle : previewChapterTitleStyle}>
                  {tituloPreview}
                </h3>
              </div>

              <p style={isDesktop ? desktopPreviewChapterTextStyle : previewChapterTextStyle}>
                {textoPreview}
              </p>
            </article>
          </aside>
        </section>
      </section>
    </main>
  );
}

const adicionarCapituloPageCss = `
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

  html[data-historietas-tema-visual] input::placeholder,
  html[data-historietas-tema-visual] textarea::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  html[data-historietas-tema-visual] input,
  html[data-historietas-tema-visual] textarea {
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] nav a[href="/painel-autor"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/painel-autor"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/painel-autor"] {
    background: var(--historietas-bottom-nav-active-bg, rgba(59, 7, 100, 0.54)) !important;
    border-color: var(--historietas-bottom-nav-active-border, rgba(109, 40, 217, 0.48)) !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
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
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "#070212",
  color: "#FFFFFF",
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
  gap: "10px",
  marginBottom: "10px",
  flexWrap: "nowrap",
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
  maxWidth: "100%",
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
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  flexWrap: "nowrap",
  marginTop: "4px",
  marginBottom: "18px",
  minWidth: 0,
  padding: 0,
  textAlign: "center",
};

const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  position: "relative",
  marginTop: "6px",
  marginBottom: "22px",
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
  fontSize: "23px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  flex: "0 1 auto",
  ...safeTextStyle,
};

const desktopHeaderTitleLinkStyle: CSSProperties = {
  ...headerTitleLinkStyle,
};

const headerTitleTextStyle: CSSProperties = {
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
  textAlign: "center",
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
  gap: "8px",
  padding: "18px",
  borderRadius: "30px",
  background: "linear-gradient(135deg, #070212 0%, #04000A 58%, #020006 100%)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};


const titleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  WebkitTextFillColor: "var(--historietas-accent, #F97316)",
  fontSize: "clamp(28px, 7.4vw, 40px)",
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: "-0.048em",
  maxWidth: "100%",
  textAlign: "center",
  textShadow: "none",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: "0 auto",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11.5px",
  lineHeight: 1.35,
  fontWeight: 750,
  maxWidth: "560px",
  textAlign: "center",
  ...safeTextStyle,
};

const progressBoxStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  width: "100%",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};

const progressTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "nowrap",
  minWidth: 0,
};

const progressLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 900,
  ...safeTextStyle,
};

const progressNumberStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  fontWeight: 950,
  ...safeTextStyle,
};

const progressTrackStyle: CSSProperties = {
  height: "5px",
  overflow: "hidden",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.10)",
  maxWidth: "100%",
};

const progressFillStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(90deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  transition: "width 0.2s ease",
};

const errorBoxStyle: CSSProperties = {
  marginTop: "18px",
  padding: "18px",
  borderRadius: "24px",
  background: "rgba(127,29,29,0.18)",
  border: "1px solid rgba(239,68,68,0.26)",
  display: "grid",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const errorTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-danger-button-text, #FCA5A5)",
  fontSize: "24px",
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

const errorTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-danger-button-text, #FECACA)",
  fontSize: "14px",
  lineHeight: 1.7,
  fontWeight: 750,
  ...safeTextStyle,
};


const inlineStatsBoxStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
};

const inlineStatsItemStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 900,
  ...safeTextStyle,
};

const inlineStatsReadyStyle: CSSProperties = {
  ...inlineStatsItemStyle,
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

const inlineStatsWarningStyle: CSSProperties = {
  ...inlineStatsItemStyle,
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

const mainGridStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  minWidth: 0,
  maxWidth: "100%",
};

const formPanelStyle: CSSProperties = {
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
  gap: "4px",
  minWidth: 0,
  textAlign: "center",
  justifyItems: "center",
};

const formMiniTitleStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const formTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "26px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.065em",
  textAlign: "center",
  ...safeTextStyle,
};

const fieldGroupStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const labelStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 950,
  letterSpacing: "-0.01em",
  ...safeTextStyle,
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
  minHeight: "78px",
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

const importBoxStyle: CSSProperties = {
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

const importInfoStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
};

const importIconStyle: CSSProperties = {
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1,
  letterSpacing: "-0.04em",
  boxShadow: "none",
};

const importIconBoxStyle: CSSProperties = {
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

const importTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "15px",
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

const importTextStyle: CSSProperties = {
  display: "none",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.35,
  fontWeight: 700,
  textAlign: "center",
  ...safeTextStyle,
};

const desktopImportTextStyle: CSSProperties = {
  ...importTextStyle,
  display: "none",
};

const importSuccessStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 9px",
  borderRadius: "999px",
  background: "rgba(34,197,94,0.12)",
  border: "1px solid rgba(34,197,94,0.28)",
  color: "#86EFAC",
  fontSize: "11px",
  fontWeight: 900,
  ...safeTextStyle,
};

const importErrorStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 9px",
  borderRadius: "999px",
  background: "var(--historietas-danger-surface, rgba(239,68,68,0.13))",
  border: "1px solid rgba(239,68,68,0.28)",
  color: "var(--historietas-danger-button-text, #FCA5A5)",
  fontSize: "11px",
  fontWeight: 900,
  ...safeTextStyle,
};

const importButtonStyle: CSSProperties = {
  width: "fit-content",
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
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  boxShadow: "none",
  minWidth: 0,
  boxSizing: "border-box",
  ...safeTextStyle,
};

const hiddenFileInputStyle: CSSProperties = {
  display: "none",
};

const successBoxStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  padding: "16px",
  borderRadius: "22px",
  background: "rgba(34,197,94,0.10)",
  border: "1px solid rgba(34,197,94,0.24)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const successTitleStyle: CSSProperties = {
  color: "#86EFAC",
  fontSize: "16px",
  fontWeight: 950,
  ...safeTextStyle,
};

const successTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.6,
  fontWeight: 650,
  ...safeTextStyle,
};

const notificationCreatedStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "13px",
  lineHeight: 1.6,
  fontWeight: 900,
  padding: "10px 12px",
  borderRadius: "16px",
  background: "rgba(249,115,22,0.12)",
  border: "1px solid rgba(249,115,22,0.28)",
  maxWidth: "100%",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const createdActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(138px, 1fr))",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const successPrimaryButtonStyle: CSSProperties = {
  minHeight: "48px",
  borderRadius: "999px",
  background: "#04000A",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 12px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const successSecondaryButtonStyle: CSSProperties = {
  minHeight: "48px",
  borderRadius: "999px",
  background: "#04000A",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 12px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
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

const primaryButtonStyle: CSSProperties = {
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
  ...primaryButtonStyle,
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

const desktopCancelButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  minHeight: "46px",
  fontSize: "13px",
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

const previewTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  textAlign: "center",
  ...safeTextStyle,
};

const previewChapterCardStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
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

const previewChapterTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "wrap",
  minWidth: 0,
  maxWidth: "100%",
};

const previewChapterBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 10px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const previewChapterStatusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 10px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#E4E4E7",
  fontSize: "11px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const previewChapterTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "19px",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  textAlign: "center",
  ...safeTextStyle,
};

const previewChapterTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.45,
  fontWeight: 650,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textAlign: "left",
  ...safeTextStyle,
};

const desktopPreviewChapterTextStyle: CSSProperties = {
  ...previewChapterTextStyle,
  fontSize: "11.5px",
  lineHeight: 1.45,
  WebkitLineClamp: 2,
};

const desktopPreviewChapterTitleStyle: CSSProperties = {
  ...previewChapterTitleStyle,
  fontSize: "23px",
};

const previewTopRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "6px",
  justifyItems: "center",
  textAlign: "center",
  minWidth: 0,
  maxWidth: "100%",
};

const previewStatsStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "13px",
  fontWeight: 850,
  minWidth: 0,
  maxWidth: "100%",
};

const recentBoxStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
  boxShadow: "none",
};

const recentMiniTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "9.5px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  textAlign: "center",
  ...safeTextStyle,
};

const recentListStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
};

const recentItemStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  padding: "8px",
  borderRadius: "14px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  textAlign: "center",
};

const recentNumberStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 950,
  ...safeTextStyle,
};

const recentTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14px",
  fontWeight: 900,
  maxWidth: "100%",
  ...safeTextStyle,
};

const emptyBoxStyle: CSSProperties = {
  marginTop: "24px",
  display: "grid",
  gap: "12px",
  padding: "22px",
  borderRadius: "26px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "28px",
  fontWeight: 950,
  letterSpacing: "-0.05em",
  ...safeTextStyle,
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "14px",
  lineHeight: 1.7,
  fontWeight: 600,
  ...safeTextStyle,
};

const emptyButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "50px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "14px",
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
  width: "min(1120px, calc(100% - 48px))",
  padding: "24px 0 64px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "14px",
  flexWrap: "nowrap",
};

const desktopHeroBoxStyle: CSSProperties = {
  ...heroBoxStyle,
  width: "100%",
  maxWidth: "100%",
  margin: "0",
  gridTemplateColumns: "1fr",
  justifyItems: "center",
  textAlign: "center",
  gap: "8px",
  padding: "16px 24px",
  borderRadius: "24px",
  alignItems: "center",
  overflow: "hidden",
  boxShadow: "none",
};


const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  fontSize: "clamp(38px, 4.4vw, 58px)",
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  fontSize: "13px",
  maxWidth: "760px",
};

const desktopProgressBoxStyle: CSSProperties = {
  ...progressBoxStyle,
  width: "100%",
  padding: 0,
};

const desktopMainGridSoloStyle: CSSProperties = {
  ...mainGridStyle,
  gridTemplateColumns: "minmax(0, 1.52fr) minmax(340px, 0.88fr)",
  alignItems: "start",
  gap: "18px",
};


const desktopFormPanelStyle: CSSProperties = {
  ...formPanelStyle,
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
  justifyItems: "center",
  textAlign: "center",
};

const desktopFormTitleStyle: CSSProperties = {
  ...formTitleStyle,
  fontSize: "30px",
};

const desktopImportBoxStyle: CSSProperties = {
  ...importBoxStyle,
  gridTemplateColumns: "minmax(64px, 72px) minmax(0, 1fr)",
  alignItems: "stretch",
  padding: 0,
  gap: "12px",
  borderRadius: 0,
  background: "transparent",
  border: "none",
};

const desktopImportButtonStyle: CSSProperties = {
  ...importButtonStyle,
  minHeight: "36px",
  fontSize: "11px",
  padding: "0 12px",
};

const desktopTextareaStyle: CSSProperties = {
  ...textareaStyle,
  minHeight: "126px",
};

const desktopButtonAreaStyle: CSSProperties = {
  ...buttonAreaStyle,
  gridColumn: "1 / -1",
};

const desktopPrimaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
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

const desktopPreviewPanelStyle: CSSProperties = {
  ...previewPanelStyle,
  position: "sticky",
  top: "24px",
  alignSelf: "start",
};

const desktopPreviewChapterCardStyle: CSSProperties = {
  ...previewChapterCardStyle,
  padding: "11px",
  borderRadius: "22px",
};