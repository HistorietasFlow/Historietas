"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "../../lib/supabase/client";
import { criarSlugBase, formatarData, formatarTamanhoArquivo, normalizarTexto } from "../../lib/utils";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { useNotificacoes } from "../../components/NotificacoesProvider";

type ArquivoObraCategoria = "texto" | "documento" | "imagem" | "outro";

type ArquivoObraLocal = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: ArquivoObraCategoria;
  criadoEm: string;
};

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
  arquivoObra?: ArquivoObraLocal | null;
};

type CapituloSalvo = Partial<CapituloLocal> & Record<string, unknown>;

type ObraSalva = Partial<ObraLocal> & {
  capitulos?: CapituloSalvo[];
  arquivoObra?: unknown;
} & Record<string, unknown>;


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

type PerfilAutorArquivoRow = {
  id?: string | null;
  user_id?: string | null;
  nome?: string | null;
  username?: string | null;
  display_name?: string | null;
  apelido?: string | null;
};

const STORAGE_KEY = "historietas-obras";
const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";

type ArquivosObrasBackup = Record<string, ArquivoObraLocal>;

function criarStorageKeyUsuarioVerArquivo(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : chave;
}

function lerStorageUsuarioVerArquivo(chave: string, userId: string) {
  if (typeof window === "undefined" || !userId.trim()) {
    return null;
  }

  try {
    return localStorage.getItem(criarStorageKeyUsuarioVerArquivo(chave, userId));
  } catch {
    return null;
  }
}

function salvarJsonStorageUsuarioVerArquivo(
  chave: string,
  userId: string,
  valor: unknown
) {
  if (typeof window === "undefined" || !userId.trim()) {
    return;
  }

  try {
    localStorage.setItem(
      criarStorageKeyUsuarioVerArquivo(chave, userId),
      JSON.stringify(valor)
    );
  } catch {
    // localStorage é fallback; a página continua com o estado em memória.
  }
}

function criarLoginHrefVerArquivo(
  obraId?: string,
  slug?: string,
  telaCheia = false
) {
  const obraIdLimpo = obraId?.trim() || "";
  const slugLimpo = slug?.trim() || "";
  const paramsArquivo = new URLSearchParams();

  if (obraIdLimpo) {
    paramsArquivo.set("obraId", obraIdLimpo);
  }

  if (slugLimpo) {
    paramsArquivo.set("slug", slugLimpo);
  }

  if (telaCheia) {
    paramsArquivo.set("tela", "cheia");
  }

  const queryArquivo = paramsArquivo.toString();
  const redirectTo = queryArquivo ? `/ver-arquivo?${queryArquivo}` : "/ver-arquivo";
  const paramsLogin = new URLSearchParams({
    redirectTo,
  });

  return `/login?${paramsLogin.toString()}`;
}

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}

function normalizarCapitulo(
  capitulo: CapituloSalvo,
  capituloIndex: number,
  obraIndex: number
): CapituloLocal {
  return {
    id:
      typeof capitulo.id === "string" && capitulo.id.trim()
        ? capitulo.id
        : `capitulo-${obraIndex + 1}-${capituloIndex + 1}`,
    titulo:
      typeof capitulo.titulo === "string" && capitulo.titulo.trim()
        ? capitulo.titulo
        : `Capítulo ${capituloIndex + 1}`,
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

function identificarCategoriaPorArquivo(
  nomeArquivo: string,
  tipoArquivo: string,
  conteudoArquivo = ""
): ArquivoObraCategoria {
  const nome = nomeArquivo.toLowerCase();
  const tipo = tipoArquivo.toLowerCase();
  const conteudo = conteudoArquivo.toLowerCase();

  if (
    tipo.startsWith("image/") ||
    conteudo.startsWith("data:image/") ||
    /\.(png|jpe?g|jpg|webp|gif|bmp|avif|svg)$/i.test(nome)
  ) {
    return "imagem";
  }

  if (
    tipo === "application/pdf" ||
    conteudo.startsWith("data:application/pdf") ||
    nome.endsWith(".pdf")
  ) {
    return "documento";
  }

  if (
    tipo.startsWith("text/") ||
    conteudo.startsWith("data:text/") ||
    nome.endsWith(".txt") ||
    nome.endsWith(".md") ||
    nome.endsWith(".markdown")
  ) {
    return "texto";
  }

  return "outro";
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

  const nome = arquivo.nome.trim();
  const tipo = typeof arquivo.tipo === "string" ? arquivo.tipo : "";
  const conteudo = arquivo.conteudo.trim();
  const categoriaRecebida = arquivo.categoria;
  const categoriaDetectada = identificarCategoriaPorArquivo(nome, tipo, conteudo);
  const categoriaValida: ArquivoObraCategoria =
    categoriaDetectada !== "outro"
      ? categoriaDetectada
      : categoriaRecebida === "texto" ||
        categoriaRecebida === "documento" ||
        categoriaRecebida === "imagem" ||
        categoriaRecebida === "outro"
      ? categoriaRecebida
      : "outro";

  return {
    nome,
    tipo,
    tamanho:
      typeof arquivo.tamanho === "number" && Number.isFinite(arquivo.tamanho)
        ? arquivo.tamanho
        : 0,
    conteudo,
    categoria: categoriaValida,
    criadoEm: typeof arquivo.criadoEm === "string" ? arquivo.criadoEm : "",
  };
}

function normalizarObra(obra: ObraSalva, obraIndex: number): ObraLocal {
  const capitulosNormalizados: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapitulo(capitulo, capituloIndex, obraIndex)
      )
    : [];

  const titulo =
    typeof obra.titulo === "string" && obra.titulo.trim()
      ? obra.titulo.trim()
      : "Obra sem título";

  const slug =
    typeof obra.slug === "string" && obra.slug.trim()
      ? obra.slug.trim()
      : criarSlugBase(titulo || `obra-${obraIndex + 1}`);

  const tagsNormalizadas = Array.isArray(obra.tags)
    ? obra.tags
        .filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
        .map((tag) => tag.trim())
    : [];

  return {
    id:
      typeof obra.id === "string" && obra.id.trim()
        ? obra.id
        : `obra-${obraIndex + 1}`,
    titulo,
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
    slug,
    link:
      typeof obra.link === "string" && obra.link.trim()
        ? obra.link
        : `/obra/${slug}`,
    arquivoObra: normalizarArquivoObra(obra.arquivoObra),
  };
}


function carregarBackupArquivosObras(userId = ""): ArquivosObrasBackup {
  if (typeof window === "undefined" || !userId.trim()) {
    return {};
  }

  try {
    const backupTexto = lerStorageUsuarioVerArquivo(
      FILE_BACKUP_STORAGE_KEY,
      userId
    );
    const backupJson: unknown = backupTexto ? JSON.parse(backupTexto) : {};

    if (!backupJson || typeof backupJson !== "object" || Array.isArray(backupJson)) {
      return {};
    }

    const backupNormalizado: ArquivosObrasBackup = {};

    Object.entries(backupJson as Record<string, unknown>).forEach(([chave, valor]) => {
      const arquivoNormalizado = normalizarArquivoObra(valor);

      if (chave.trim() && arquivoNormalizado) {
        backupNormalizado[chave] = arquivoNormalizado;
      }
    });

    salvarJsonStorageUsuarioVerArquivo(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupNormalizado
    );

    return backupNormalizado;
  } catch {
    salvarJsonStorageUsuarioVerArquivo(FILE_BACKUP_STORAGE_KEY, userId, {});
    return {};
  }
}

function criarStorageUsuarioVerArquivoKey(userId: string) {
  return criarStorageKeyUsuarioVerArquivo(STORAGE_KEY, userId);
}

function obterChavesBackupObra(obra: Pick<ObraLocal, "id" | "slug" | "titulo" | "link">) {
  const slugSeguro = obra.slug || criarSlugBase(obra.titulo);

  return Array.from(
    new Set(
      [
        obra.id,
        obra.slug,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
        `id:${obra.id}`,
        `slug:${slugSeguro}`,
        `titulo:${normalizarTexto(obra.titulo)}`,
        obra.link ? `link:${obra.link}` : "",
      ]
        .filter((chave): chave is string => typeof chave === "string" && Boolean(chave.trim()))
        .map((chave) => chave.trim())
    )
  );
}

function restaurarArquivoObraComBackup(
  obra: ObraLocal,
  backupArquivos: ArquivosObrasBackup
): ObraLocal {
  if (obra.arquivoObra) {
    return obra;
  }

  const arquivoBackup = obterChavesBackupObra(obra)
    .map((chave) => normalizarArquivoObra(backupArquivos[chave]))
    .find((arquivo): arquivo is ArquivoObraLocal => Boolean(arquivo));

  if (!arquivoBackup) {
    return obra;
  }

  return {
    ...obra,
    arquivoObra: arquivoBackup,
  };
}

function sincronizarBackupArquivosObras(
  obrasParaSincronizar: ObraLocal[],
  userId = ""
) {
  if (typeof window === "undefined" || !userId.trim()) {
    return;
  }

  try {
    const backupAtual = carregarBackupArquivosObras(userId);

    obrasParaSincronizar.forEach((obra) => {
      if (!obra.arquivoObra) {
        return;
      }

      obterChavesBackupObra(obra).forEach((chave) => {
        backupAtual[chave] = obra.arquivoObra as ArquivoObraLocal;
      });
    });

    salvarJsonStorageUsuarioVerArquivo(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupAtual
    );
  } catch {
    // O backup é uma camada extra. A página continua funcionando sem ele.
  }
}

function obraPertenceAoUsuarioLogado(obra: ObraLocal, userId: string) {
  const autorId = obra.autorId?.trim() || "";

  return !autorId || autorId === userId;
}

function criarChaveObraLocal(obra: Pick<ObraLocal, "id" | "slug" | "titulo">) {
  return obra.id || obra.slug || criarSlugBase(obra.titulo);
}

function mesclarObrasVerArquivo(...listas: ObraLocal[][]) {
  const obrasMescladas: ObraLocal[] = [];
  const chavesUsadas = new Set<string>();

  listas.forEach((lista) => {
    lista.forEach((obra) => {
      const chave = criarChaveObraLocal(obra);

      if (!chave || chavesUsadas.has(chave)) {
        return;
      }

      chavesUsadas.add(chave);
      obrasMescladas.push(obra);
    });
  });

  return obrasMescladas;
}

function carregarObrasLocais(userId = "") {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [] as ObraLocal[];
  }

  const backupArquivos = carregarBackupArquivosObras(userIdLimpo);

  function normalizarLista(valor: unknown) {
    return Array.isArray(valor)
      ? (valor as ObraSalva[])
          .map((obra, index) => normalizarObra(obra, index))
          .map((obra) => restaurarArquivoObraComBackup(obra, backupArquivos))
      : [];
  }

  let obrasNormalizadas: ObraLocal[] = [];

  try {
    const obrasTexto = userIdLimpo
      ? lerStorageUsuarioVerArquivo(STORAGE_KEY, userIdLimpo)
      : lerStorageUsuarioVerArquivo(STORAGE_KEY, "");
    const obrasJson: unknown = obrasTexto ? JSON.parse(obrasTexto) : [];

    obrasNormalizadas = normalizarLista(obrasJson);
  } catch {
    obrasNormalizadas = [];
  }

  if (userIdLimpo) {
    obrasNormalizadas = obrasNormalizadas
      .filter((obra) => obraPertenceAoUsuarioLogado(obra, userIdLimpo))
      .map((obra) => ({
        ...obra,
        autorId: obra.autorId?.trim() || userIdLimpo,
      }));
  }

  sincronizarBackupArquivosObras(obrasNormalizadas, userIdLimpo);
  salvarJsonStorageUsuarioVerArquivo(STORAGE_KEY, userIdLimpo, obrasNormalizadas);

  return obrasNormalizadas;
}

function salvarObrasLocaisPreservandoOutrasContas(
  obrasDoUsuarioAtual: ObraLocal[],
  userId: string
) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [] as ObraLocal[];
  }
  const obrasDoUsuario = obrasDoUsuarioAtual
    .filter((obra) => obraPertenceAoUsuarioLogado(obra, userIdLimpo))
    .map((obra) => ({
      ...obra,
      autorId: obra.autorId?.trim() || userIdLimpo,
    }));

  sincronizarBackupArquivosObras(obrasDoUsuario, userIdLimpo);
  salvarJsonStorageUsuarioVerArquivo(STORAGE_KEY, userIdLimpo, obrasDoUsuario);

  return obrasDoUsuario;
}

function obterNomeProfileVerArquivo(profile: PerfilAutorArquivoRow | null) {
  const nomesPossiveis = [
    profile?.nome,
    profile?.display_name,
    profile?.username,
    profile?.apelido,
  ];

  const nomeEncontrado = nomesPossiveis.find(
    (nome) => typeof nome === "string" && Boolean(nome.trim())
  );

  return typeof nomeEncontrado === "string" ? nomeEncontrado.trim() : "";
}

async function buscarNomeProfileVerArquivo(userId: string) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return "";
  }

  try {
    const { data: profilePorUserId, error: erroUserId } = await supabase
      .from("profiles")
      .select("id, user_id, nome, username, display_name, apelido")
      .eq("user_id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (!erroUserId) {
      const nome = obterNomeProfileVerArquivo(
        (profilePorUserId || null) as PerfilAutorArquivoRow | null
      );

      if (nome) {
        return nome;
      }
    }
  } catch {
    // Continua no fallback por id.
  }

  try {
    const { data: profilePorId, error: erroId } = await supabase
      .from("profiles")
      .select("id, user_id, nome, username, display_name, apelido")
      .eq("id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (!erroId) {
      return obterNomeProfileVerArquivo(
        (profilePorId || null) as PerfilAutorArquivoRow | null
      );
    }
  } catch {
    return "";
  }

  return "";
}

function aplicarNomeProfileVerArquivo(obrasParaAtualizar: ObraLocal[], userId: string, nomeProfile: string) {
  const nomeLimpo = nomeProfile.trim();

  if (!nomeLimpo) {
    return obrasParaAtualizar;
  }

  return obrasParaAtualizar.map((obra) => {
    const autorId = obra.autorId?.trim() || "";

    if (autorId && autorId !== userId) {
      return obra;
    }

    return {
      ...obra,
      autor: nomeLimpo,
      autorId: autorId || userId,
    };
  });
}

function criarPerfilAutorHrefVerArquivo(autor: string, autorId?: string) {
  const params = new URLSearchParams();
  const autorLimpo = autor.trim();
  const autorIdLimpo = autorId?.trim() || "";

  params.set("autor", autorLimpo || "Autor não informado");

  if (autorIdLimpo) {
    params.set("autorId", autorIdLimpo);
    params.set("userId", autorIdLimpo);
  }

  return `/perfil-autor?${params.toString()}`;
}

function normalizarCategoriaArquivoSupabase(
  categoria: string | null
): ArquivoObraCategoria {
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

  const capitulosRemotosIds = new Set(
    capitulosRemotos.map((capitulo) => capitulo.id)
  );
  const capitulosApenasLocais = (obraLocal?.capitulos || []).filter(
    (capitulo) => !capitulosRemotosIds.has(capitulo.id)
  );
  const capitulosMesclados = [...capitulosRemotos, ...capitulosApenasLocais];
  const tituloObra = obra.titulo?.trim() || obraLocal?.titulo || "Obra sem título";
  const slug = obra.slug?.trim() || obraLocal?.slug || criarSlugBase(tituloObra || `obra-${index + 1}`);
  const arquivoUrl = obra.arquivo_url?.trim() || "";
  const arquivoCategoria = normalizarCategoriaArquivoSupabase(
    obra.arquivo_categoria
  );
  const arquivoTipo =
    obra.arquivo_tipo?.trim() ||
    obraLocal?.arquivoObra?.tipo ||
    (arquivoCategoria === "documento"
      ? "application/pdf"
      : arquivoCategoria === "imagem"
      ? "image/*"
      : arquivoCategoria === "texto"
      ? "text/plain"
      : "");

  return {
    id: obra.id || obraLocal?.id || `obra-${index + 1}`,
    titulo: tituloObra,
    autor: nomeAutorProfile.trim() || obra.autor?.trim() || obraLocal?.autor || "Autor não informado",
    autorId: obra.user_id?.trim() || obraLocal?.autorId || "",
    genero: obra.genero?.trim() || obraLocal?.genero || "Não informado",
    formato: obra.formato?.trim() || obraLocal?.formato || "Não informado",
    classificacaoIndicativa:
      obra.classificacao_indicativa?.trim() ||
      obraLocal?.classificacaoIndicativa ||
      "Não informada",
    sinopse: obra.sinopse?.trim() || obraLocal?.sinopse || "Nenhuma sinopse informada.",
    tags:
      Array.isArray(obra.tags) && obra.tags.length > 0
        ? obra.tags
        : obraLocal?.tags || ["sem tags"],
    capa: obra.capa_url?.trim() || obraLocal?.capa || "",
    capaNome: obra.capa_nome?.trim() || obraLocal?.capaNome || "",
    publicado: Boolean(obra.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obra.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    slug,
    link: obra.link?.trim() || obraLocal?.link || `/obra/${slug}`,
    arquivoObra: arquivoUrl
      ? {
          nome:
            obra.arquivo_nome?.trim() ||
            obraLocal?.arquivoObra?.nome ||
            "Arquivo da obra",
          tipo: arquivoTipo,
          tamanho:
            typeof obra.arquivo_tamanho === "number" &&
            Number.isFinite(obra.arquivo_tamanho)
              ? obra.arquivo_tamanho
              : obraLocal?.arquivoObra?.tamanho || 0,
          conteudo: arquivoUrl,
          categoria: arquivoCategoria,
          criadoEm: obra.criada_em || obraLocal?.arquivoObra?.criadoEm || "",
        }
      : obraLocal?.arquivoObra || null,
  };
}

async function carregarObraSupabaseComFallback(
  obraIdBusca: string,
  slugBusca: string,
  obrasLocais: ObraLocal[],
  userId: string,
  nomeAutorProfile = ""
) {
  if ((!obraIdBusca && !slugBusca) || !userId) {
    return obrasLocais;
  }

  try {
    const resultadoObra = obraIdBusca
      ? await supabase
          .from("obras")
          .select(
            "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,slug,link,criada_em,atualizado_em"
          )
          .eq("id", obraIdBusca)
          .eq("user_id", userId)
          .limit(1)
      : await supabase
          .from("obras")
          .select(
            "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,slug,link,criada_em,atualizado_em"
          )
          .eq("slug", slugBusca)
          .eq("user_id", userId)
          .limit(1);

    if (resultadoObra.error) {
      console.warn(
        "Não consegui carregar o arquivo da obra no Supabase:",
        resultadoObra.error.message
      );
      return obrasLocais;
    }

    const obrasBanco = (resultadoObra.data || []) as unknown as SupabaseObraRow[];
    const obraBanco = obrasBanco[0] || null;

    if (!obraBanco) {
      return obrasLocais;
    }

    const { data: capitulosSupabase, error: erroCapitulos } = await supabase
      .from("capitulos")
      .select("id,obra_id,user_id,titulo,texto,ordem,publicado,criado_em,atualizado_em")
      .eq("obra_id", obraBanco.id)
      .eq("user_id", userId)
      .order("ordem", { ascending: true })
      .limit(300);

    const capitulosBanco = erroCapitulos
      ? []
      : ((capitulosSupabase || []) as unknown as SupabaseCapituloRow[]);

    if (erroCapitulos) {
      console.warn(
        "Não consegui carregar capítulos da obra no Supabase:",
        erroCapitulos.message
      );
    }

    const obraLocal = obrasLocais.find((obra) => {
      const slugLocal = obra.slug || criarSlugBase(obra.titulo);
      const slugBanco = obraBanco.slug?.trim() || criarSlugBase(obraBanco.titulo || "");

      return obra.id === obraBanco.id || slugLocal === slugBanco;
    });

    const nomeProfileAutor =
      nomeAutorProfile.trim() ||
      (await buscarNomeProfileVerArquivo(obraBanco.user_id || userId));

    const obraNormalizada = normalizarObraSupabase(
      obraBanco,
      capitulosBanco,
      obraLocal,
      0,
      nomeProfileAutor
    );

    const obraJaExiste = obrasLocais.some((obra) => obra.id === obraNormalizada.id);
    const obrasAtualizadas = obraJaExiste
      ? obrasLocais.map((obra) =>
          obra.id === obraNormalizada.id ? obraNormalizada : obra
        )
      : [obraNormalizada, ...obrasLocais];

    salvarObrasLocaisPreservandoOutrasContas(obrasAtualizadas, userId);

    return obrasAtualizadas;
  } catch (error) {
    console.warn("Não consegui acessar o Supabase agora:", error);
    return obrasLocais;
  }
}

function obterTipoVisualArquivo(arquivo: ArquivoObraLocal) {
  if (arquivo.categoria === "imagem") {
    return "Imagem";
  }

  if (arquivo.categoria === "documento") {
    return "PDF";
  }

  if (arquivo.categoria === "texto") {
    return "Texto";
  }

  return "Arquivo";
}

function extrairTextoDeDataUrl(conteudo: string) {
  if (!conteudo.startsWith("data:")) {
    return conteudo;
  }

  const partes = conteudo.split(",");
  const cabecalho = partes[0] || "";
  const corpo = partes.slice(1).join(",");

  if (!corpo) {
    return "Não foi possível ler o texto desse arquivo.";
  }

  try {
    if (cabecalho.includes(";base64")) {
      const binario = window.atob(corpo);
      const bytes = new Uint8Array(binario.length);

      for (let index = 0; index < binario.length; index += 1) {
        bytes[index] = binario.charCodeAt(index);
      }

      return new TextDecoder("utf-8").decode(bytes);
    }

    return decodeURIComponent(corpo);
  } catch {
    return "Não foi possível ler o texto desse arquivo.";
  }
}


export default function VerArquivoPage() {
  const router = useRouter();
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const { notificacoesNaoLidas } = useNotificacoes();
  const [redirecionandoLogin, setRedirecionandoLogin] = useState(false);
  const [obraIdBusca, setObraIdBusca] = useState("");
  const [slugBusca, setSlugBusca] = useState("");
  const [telaCheia, setTelaCheia] = useState(false);
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [urlBusca, setUrlBusca] = useState(() =>
    typeof window === "undefined" ? "" : window.location.search
  );
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
    const atualizarUrlBusca = () => {
      const buscaAtual = window.location.search;
      const params = new URLSearchParams(buscaAtual);

      setObraIdBusca(params.get("obraId") || "");
      setSlugBusca(params.get("slug") || "");
      setTelaCheia(params.get("tela") === "cheia");
      setUrlBusca(buscaAtual);
    };

    const atualizarUrlBuscaTimer = window.setTimeout(
      atualizarUrlBusca,
      0
    );

    window.addEventListener("popstate", atualizarUrlBusca);
    window.addEventListener("pageshow", atualizarUrlBusca);

    return () => {
      window.clearTimeout(atualizarUrlBuscaTimer);
      window.removeEventListener("popstate", atualizarUrlBusca);
      window.removeEventListener("pageshow", atualizarUrlBusca);
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregarArquivoDaObra() {
      window.setTimeout(() => {
        if (!cancelado) {
          setCarregando(true);
        }
      }, 0);

      const params = new URLSearchParams(urlBusca);
      const obraIdParam = params.get("obraId") || "";
      const slugParam = params.get("slug") || "";
      const telaCheiaParam = params.get("tela") === "cheia";

      window.setTimeout(() => {
        if (!cancelado) {
          setObraIdBusca(obraIdParam);
          setSlugBusca(slugParam);
          setTelaCheia(telaCheiaParam);
        }
      }, 0);

      try {
        const { data: dadosUsuario, error: erroUsuario } =
          await supabase.auth.getUser();

        if (erroUsuario || !dadosUsuario.user) {
          window.setTimeout(() => {
            if (!cancelado) {
              setRedirecionandoLogin(true);
              router.replace(
                criarLoginHrefVerArquivo(obraIdParam, slugParam, telaCheiaParam)
              );
            }
          }, 0);

          return;
        }

        const userId = dadosUsuario.user.id;

        window.setTimeout(() => {
          if (!cancelado) {
            setUsuarioIdLogado(userId);
            setRedirecionandoLogin(false);
          }
        }, 0);

        const nomeProfileAutor = await buscarNomeProfileVerArquivo(userId);
        const obrasLocais = aplicarNomeProfileVerArquivo(
          carregarObrasLocais(userId).filter((obra) => {
            return obraPertenceAoUsuarioLogado(obra, userId);
          }),
          userId,
          nomeProfileAutor
        );

        window.setTimeout(() => {
          if (!cancelado) {
            setObras(obrasLocais);
          }
        }, 0);

        const obrasAtualizadas = await carregarObraSupabaseComFallback(
          obraIdParam,
          slugParam,
          obrasLocais,
          userId,
          nomeProfileAutor
        );

        window.setTimeout(() => {
          if (!cancelado) {
            setObras(
              aplicarNomeProfileVerArquivo(
                obrasAtualizadas.filter((obra) => {
                  return obraPertenceAoUsuarioLogado(obra, userId);
                }),
                userId,
                nomeProfileAutor
              )
            );
          }
        }, 0);
      } catch {
        window.setTimeout(() => {
          if (!cancelado) {
            setObras((obrasAtuais) => obrasAtuais);
          }
        }, 0);
      } finally {
        window.setTimeout(() => {
          if (!cancelado) {
            setCarregando(false);
          }
        }, 0);
      }
    }

    void carregarArquivoDaObra();

    return () => {
      cancelado = true;
    };
  }, [router, urlBusca]);

  const obraAtual = useMemo(() => {
    if (!obraIdBusca && !slugBusca) {
      return null;
    }

    return (
      obras.find((obra) => {
        const slugObra = obra.slug || criarSlugBase(obra.titulo);
        const obraPertenceAoUsuario = obraPertenceAoUsuarioLogado(
          obra,
          usuarioIdLogado
        );

        return (
          obraPertenceAoUsuario &&
          ((obraIdBusca && obra.id === obraIdBusca) ||
            (slugBusca && slugObra === slugBusca))
        );
      }) || null
    );
  }, [obras, obraIdBusca, slugBusca, usuarioIdLogado]);

  const arquivo = obraAtual?.arquivoObra || null;

  const textoArquivo = useMemo(() => {
    if (!arquivo || arquivo.categoria !== "texto") {
      return "";
    }

    return extrairTextoDeDataUrl(arquivo.conteudo);
  }, [arquivo]);

  const voltarHref = obraAtual
    ? obraIdBusca
      ? "/painel-autor"
      : obraAtual.link || `/obra/${obraAtual.slug || criarSlugBase(obraAtual.titulo)}`
    : "/painel-autor";
  const obraPublicaHref = obraAtual
    ? obraAtual.link || `/obra/${obraAtual.slug || criarSlugBase(obraAtual.titulo)}`
    : "/explorar";
  const perfilAutorHref = obraAtual
    ? criarPerfilAutorHrefVerArquivo(obraAtual.autor, obraAtual.autorId)
    : "/perfil-autor";
  const arquivoTipoVisual = arquivo ? obterTipoVisualArquivo(arquivo) : "Arquivo";

  function abrirArquivoEmNovaAba() {
    if (!arquivo || !obraAtual) {
      return;
    }

    const parametros = new URLSearchParams();
    const slugObra = obraAtual.slug || criarSlugBase(obraAtual.titulo);

    if (obraIdBusca) {
      parametros.set("obraId", obraAtual.id);
    } else {
      parametros.set("slug", slugObra);
    }

    parametros.set("tela", "cheia");

    const urlTelaCheia = `/ver-arquivo?${parametros.toString()}`;

    if (!isDesktop) {
      window.history.pushState(null, "", urlTelaCheia);
      setTelaCheia(true);
      setUrlBusca(window.location.search);
      return;
    }

    const novaJanela = window.open(urlTelaCheia, "_blank", "noopener,noreferrer");

    if (!novaJanela) {
      window.location.href = urlTelaCheia;
    }
  }

  if (carregando || redirecionandoLogin) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${verArquivoPageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      </main>
    );
  }

  if (!obraAtual) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${verArquivoPageCss}`}</style>

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

  if (!arquivo) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${verArquivoPageCss}`}</style>

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
            Sem arquivo anexado
          </p>
        </section>
      </main>
    );
  }

  if (telaCheia) {
    return (
      <main style={fullPageStyle}>
        <section style={fullContainerStyle}>
          <section style={fullViewerStyle}>
            {arquivo.categoria === "imagem" && (
              <img
                src={arquivo.conteudo}
                alt={`Arquivo da obra ${obraAtual.titulo}`}
                style={fullImageStyle}
              />
            )}

            {arquivo.categoria === "texto" && (
              <pre style={fullTextContentStyle}>{textoArquivo}</pre>
            )}

            {arquivo.categoria === "documento" && (
              <iframe
                src={arquivo.conteudo}
                title={`PDF da obra ${obraAtual.titulo}`}
                style={fullPdfFrameStyle}
              />
            )}

            {arquivo.categoria === "outro" && (
              <section style={isDesktop ? desktopGenericFileBoxStyle : genericFileBoxStyle}>
                <span style={miniTitleStyle}>ARQUIVO ANEXADO</span>
                <h2 style={viewerTitleStyle}>Prévia indisponível para este formato</h2>
                <p style={emptyTextStyle}>
                  Esse tipo de arquivo não tem prévia direta no navegador.
                </p>
              </section>
            )}
          </section>
        </section>
      </main>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${verArquivoPageCss}`}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTopStyle : topStyle}>
          <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
            <span style={logoMarkStyle}>H</span>
            <span className="historietas-theme-logo-text" style={logoTextStyle}>istorietas</span>
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

        <section style={isDesktop ? desktopHeroStyle : heroStyle}>
          <div style={heroGlowStyle} />

          <div style={isDesktop ? desktopHeroContentStyle : heroContentStyle}>
            <h1 className="historietas-theme-title" style={isDesktop ? desktopTitleStyle : titleStyle}>{obraAtual.titulo}</h1>

            <Link
              href={perfilAutorHref}
              style={isDesktop ? desktopFileAuthorLinkStyle : fileAuthorLinkStyle}
            >
              Por {obraAtual.autor}
            </Link>

            <div style={isDesktop ? desktopFileInfoBoxStyle : fileInfoBoxStyle}>
              <div style={fileInfoContentStyle}>
                <div style={fileMetaGridStyle}>
                  <span style={fileMetaBadgeStyle}>{arquivoTipoVisual}</span>
                  <span style={fileMetaBadgeStyle}>{formatarTamanhoArquivo(arquivo.tamanho)}</span>
                  <span style={fileMetaBadgeStyle}>{formatarData(arquivo.criadoEm)}</span>
                </div>
              </div>
            </div>

            <div style={isDesktop ? desktopActionsGridStyle : actionsGridStyle}>
              <button
                type="button"
                onClick={abrirArquivoEmNovaAba}
                style={primaryActionButtonStyle}
              >
                Abrir em nova aba
              </button>

              <a
                href={arquivo.conteudo}
                download={arquivo.nome}
                style={secondaryActionStyle}
              >
                Baixar arquivo
              </a>

              <Link href={obraPublicaHref} style={ghostActionStyle}>
                Abrir obra
              </Link>
            </div>
          </div>
        </section>

        <section style={isDesktop ? desktopViewerShellStyle : viewerShellStyle}>
          {arquivo.categoria === "imagem" && (
            <div style={isDesktop ? desktopImageViewerStyle : imageViewerStyle}>
              <img
                src={arquivo.conteudo}
                alt={`Arquivo da obra ${obraAtual.titulo}`}
                style={isDesktop ? desktopImageStyle : imageStyle}
              />
            </div>
          )}

          {arquivo.categoria === "texto" && (
            <article style={isDesktop ? desktopTextViewerStyle : textViewerStyle}>
              <div style={viewerHeaderStyle}>
                <span style={miniTitleStyle}>LEITURA EM TEXTO</span>
                <h2 style={viewerTitleStyle}>{arquivo.nome}</h2>
              </div>

              <pre style={isDesktop ? desktopTextContentStyle : textContentStyle}>{textoArquivo}</pre>
            </article>
          )}

          {arquivo.categoria === "documento" && (
            <div style={isDesktop ? desktopPdfViewerStyle : pdfViewerStyle}>
              <iframe
                src={arquivo.conteudo}
                title={`PDF da obra ${obraAtual.titulo}`}
                style={isDesktop ? desktopPdfFrameStyle : pdfFrameStyle}
              />
            </div>
          )}

          {arquivo.categoria === "outro" && (
            <section style={isDesktop ? desktopGenericFileBoxStyle : genericFileBoxStyle}>
              <span style={miniTitleStyle}>ARQUIVO ANEXADO</span>
              <h2 style={viewerTitleStyle}>Prévia indisponível para este formato</h2>
              <p style={emptyTextStyle}>
                Esse tipo de arquivo pode ser aberto em outra aba ou baixado no
                dispositivo para visualização.
              </p>

              <div style={isDesktop ? desktopActionsGridStyle : actionsGridStyle}>
                <button
                  type="button"
                  onClick={abrirArquivoEmNovaAba}
                  style={primaryActionButtonStyle}
                >
                  Abrir em nova aba
                </button>

                <a
                  href={arquivo.conteudo}
                  download={arquivo.nome}
                  style={secondaryActionStyle}
                >
                  Baixar arquivo
                </a>
              </div>
            </section>
          )}
        </section>
      </section>
    </main>
  );
}

const verArquivoPageCss = `  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #070212 !important;
  }

  html[data-historietas-tema-visual="original"] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  html[data-historietas-tema-visual="original"] iframe {
    background: #04000A;
  }`;

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

const fullPageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background: "#070212",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const fullContainerStyle: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  minHeight: "100dvh",
  margin: 0,
  padding: "10px 10px calc(18px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  display: "grid",
  gridTemplateRows: "minmax(0, 1fr)",
  gap: 0,
  minWidth: 0,
};


const fullViewerStyle: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  minHeight: 0,
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  boxSizing: "border-box",
};

const fullImageStyle: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  maxHeight: "calc(100dvh - 36px - env(safe-area-inset-bottom))",
  height: "auto",
  objectFit: "contain",
  display: "block",
  borderRadius: "14px",
};

const fullTextContentStyle: CSSProperties = {
  width: "100%",
  maxHeight: "calc(100dvh - 36px - env(safe-area-inset-bottom))",
  margin: 0,
  whiteSpace: "pre-wrap",
  overflow: "auto",
  color: "var(--historietas-text-primary, #F4F4F5)",
  fontSize: "15px",
  lineHeight: 1.75,
  fontFamily: "Georgia, 'Times New Roman', serif",
  background: "#05020A",
  border: "none",
  borderRadius: 0,
  padding: "14px",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const fullPdfFrameStyle: CSSProperties = {
  width: "100%",
  height: "calc(100dvh - 36px - env(safe-area-inset-bottom))",
  minHeight: "calc(100dvh - 36px - env(safe-area-inset-bottom))",
  border: "none",
  borderRadius: "14px",
  background: "#111111",
};


const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "var(--historietas-bg-start, #070212)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(900px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "14px 0 calc(18px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  marginBottom: "12px",
  minWidth: 0,
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


const heroStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: "22px",
  border: "1px solid rgba(255,255,255,0.075)",
  background: "linear-gradient(135deg, #070212 0%, #04000A 58%, #020006 100%)",
  boxShadow: "none",
  minWidth: 0,
};

const heroGlowStyle: CSSProperties = {
  display: "none",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "10px 11px",
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
  gap: "5px",
  minWidth: 0,
};


const titleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "clamp(28px, 7.5vw, 42px)",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  maxWidth: "100%",
  textAlign: "center",
  padding: "2px 0",
  overflow: "visible",
  ...safeTextStyle,
};

const fileAuthorLinkStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12.5px",
  lineHeight: 1.1,
  fontWeight: 950,
  textDecoration: "none",
  textAlign: "center",
  justifySelf: "center",
  ...safeTextStyle,
};


const fileInfoBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "6px",
  alignItems: "center",
  justifyItems: "center",
  textAlign: "center",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
};


const fileInfoContentStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
  gap: "3px",
  minWidth: 0,
  maxWidth: "100%",
};


const fileMetaGridStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "4px",
  minWidth: 0,
};

const fileMetaBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9.5px",
  fontWeight: 900,
  ...safeTextStyle,
};

const actionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "5px",
  marginTop: "2px",
  width: "100%",
  minWidth: 0,
};

const primaryActionStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "9.5px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 6px",
  boxShadow: "none",
  lineHeight: 1.08,
  ...safeTextStyle,
};

const primaryActionButtonStyle: CSSProperties = {
  ...primaryActionStyle,
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

const secondaryActionStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  background: "var(--historietas-secondary, #7C3AED)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "9.5px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 6px",
  boxShadow: "none",
  lineHeight: 1.08,
  ...safeTextStyle,
};

const ghostActionStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.045)",
  border: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "9.5px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 6px",
  lineHeight: 1.08,
  ...safeTextStyle,
};

const viewerShellStyle: CSSProperties = {
  marginTop: "10px",
  minWidth: 0,
  maxWidth: "100%",
};

const imageViewerStyle: CSSProperties = {
  padding: "10px",
  borderRadius: "24px",
  background: "linear-gradient(135deg, rgba(18,12,30,0.90) 0%, rgba(12,7,23,0.96) 100%)",
  border: "1px solid rgba(255,255,255,0.075)",
  boxShadow: "none",
  overflow: "hidden",
};

const imageStyle: CSSProperties = {
  width: "100%",
  height: "auto",
  maxWidth: "100%",
  display: "block",
  borderRadius: "18px",
  objectFit: "contain",
};

const textViewerStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  padding: "14px",
  borderRadius: "24px",
  background: "linear-gradient(135deg, rgba(18,12,30,0.90) 0%, rgba(12,7,23,0.96) 100%)",
  border: "1px solid rgba(255,255,255,0.075)",
  boxShadow: "none",
  minWidth: 0,
  overflow: "hidden",
};

const viewerHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  minWidth: 0,
  textAlign: "center",
  justifyItems: "center",
};

const miniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const viewerTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "24px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

const textContentStyle: CSSProperties = {
  margin: 0,
  whiteSpace: "pre-wrap",
  color: "var(--historietas-text-primary, #F4F4F5)",
  fontSize: "15px",
  lineHeight: 1.78,
  fontFamily: "Georgia, 'Times New Roman', serif",
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.065)",
  borderRadius: "18px",
  padding: "14px",
  minWidth: 0,
  maxWidth: "100%",
  overflowX: "auto",
  ...safeTextStyle,
};

const pdfViewerStyle: CSSProperties = {
  height: "min(78vh, 760px)",
  minHeight: "520px",
  borderRadius: "24px",
  background: "#04000A",
  border: "1px solid rgba(255,255,255,0.075)",
  boxShadow: "none",
  overflow: "hidden",
};

const pdfFrameStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  border: "none",
  display: "block",
  background: "#111111",
};

const genericFileBoxStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  padding: "16px",
  borderRadius: "24px",
  background: "linear-gradient(135deg, rgba(18,12,30,0.90) 0%, rgba(12,7,23,0.96) 100%)",
  border: "1px solid rgba(255,255,255,0.075)",
  boxShadow: "none",
  minWidth: 0,
  overflow: "hidden",
  textAlign: "center",
  justifyItems: "center",
};

const emptyBoxStyle: CSSProperties = {
  minHeight: "60vh",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  textAlign: "center",
  gap: "12px",
  padding: "18px",
  borderRadius: "26px",
  background: "linear-gradient(135deg, rgba(18,12,30,0.90) 0%, rgba(12,7,23,0.96) 100%)",
  border: "1px solid rgba(255,255,255,0.075)",
  minWidth: 0,
  overflow: "hidden",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "clamp(30px, 8vw, 46px)",
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  textAlign: "center",
  ...safeTextStyle,
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.6,
  fontWeight: 700,
  ...safeTextStyle,
};

const primaryLinkButtonStyle: CSSProperties = {
  minHeight: "44px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
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
  width: "min(1180px, calc(100% - 64px))",
  padding: "22px 0 32px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  position: "relative",
  marginBottom: "14px",
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

const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  borderRadius: "26px",
};

const desktopHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  gridTemplateColumns: "minmax(0, 1fr) 330px",
  gridTemplateRows: "auto auto auto",
  alignItems: "center",
  gap: "6px 22px",
  padding: "14px 18px",
};


const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  gridColumn: "1",
  fontSize: "clamp(36px, 4vw, 54px)",
  lineHeight: 1.08,
  maxWidth: "680px",
  justifySelf: "center",
};

const desktopFileAuthorLinkStyle: CSSProperties = {
  ...fileAuthorLinkStyle,
  gridColumn: "1",
  gridRow: "2",
  fontSize: "13.5px",
};


const desktopFileInfoBoxStyle: CSSProperties = {
  ...fileInfoBoxStyle,
  gridColumn: "2",
  gridRow: "1 / span 2",
  gridTemplateColumns: "minmax(0, 1fr)",
  padding: 0,
  borderRadius: 0,
  alignSelf: "center",
};


const desktopActionsGridStyle: CSSProperties = {
  ...actionsGridStyle,
  gridColumn: "1 / -1",
  gridRow: "3",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  alignSelf: "start",
  gap: "8px",
};

const desktopViewerShellStyle: CSSProperties = {
  ...viewerShellStyle,
  marginTop: "14px",
};

const desktopImageViewerStyle: CSSProperties = {
  ...imageViewerStyle,
  padding: "14px",
  borderRadius: "28px",
};

const desktopImageStyle: CSSProperties = {
  ...imageStyle,
  maxHeight: "760px",
  objectFit: "contain",
};

const desktopTextViewerStyle: CSSProperties = {
  ...textViewerStyle,
  padding: "18px",
  borderRadius: "28px",
  gap: "12px",
};

const desktopTextContentStyle: CSSProperties = {
  ...textContentStyle,
  padding: "20px",
  fontSize: "16px",
  lineHeight: 1.82,
  maxHeight: "760px",
};

const desktopPdfViewerStyle: CSSProperties = {
  ...pdfViewerStyle,
  height: "min(82vh, 900px)",
  minHeight: "650px",
  borderRadius: "28px",
};

const desktopPdfFrameStyle: CSSProperties = {
  ...pdfFrameStyle,
};

const desktopGenericFileBoxStyle: CSSProperties = {
  ...genericFileBoxStyle,
  padding: "22px",
  borderRadius: "28px",
};