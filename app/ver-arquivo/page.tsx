"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { supabase } from "../../lib/supabase/client";
import { criarSlugBase, formatarData, idObraSupabaseValido, normalizarTexto } from "../../lib/utils";
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
  visualizacoes: number;
  totalCurtidas: number;
  totalComentarios: number;
  totalSalvos: number;
  totalLidos: number;
  slug: string;
  link: string;
  arquivoObra?: ArquivoObraLocal | null;
};

type CapituloSalvo = Partial<CapituloLocal> & Record<string, unknown>;

type ObraSalva = Partial<ObraLocal> & {
  capitulos?: CapituloSalvo[];
  arquivoObra?: unknown;
} & Record<string, unknown>;

type ComentarioArquivoObra = {
  id: string;
  obraId: string;
  userId: string;
  nome: string;
  texto: string;
  criadoEm: string;
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
  visualizacoes: number | null;
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
const FILE_LIKES_STORAGE_KEY = "historietas-arquivos-obras-curtidas";
const FILE_SAVED_STORAGE_KEY = "historietas-arquivos-obras-salvos";
const FILE_COMMENTS_STORAGE_KEY = "historietas-arquivos-obras-comentarios";

type ArquivosObrasBackup = Record<string, ArquivoObraLocal>;


function ComentariosArquivoPortal({ children }: { children: ReactNode }) {
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const montarPortalTimer = window.setTimeout(() => {
      setMontado(true);
    }, 0);

    return () => {
      window.clearTimeout(montarPortalTimer);
    };
  }, []);

  if (!montado || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}


function criarStorageKeyUsuarioVerArquivo(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

function lerStorageUsuarioVerArquivo(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioVerArquivo(chave, userIdLimpo);

    return chaveStorage ? localStorage.getItem(chaveStorage) : null;
  } catch {
    return null;
  }
}

function salvarJsonStorageUsuarioVerArquivo(
  chave: string,
  userId: string,
  valor: unknown
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioVerArquivo(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // localStorage é fallback; a página continua com o estado em memória.
  }
}

function criarLoginHrefVerArquivo(
  obraId?: string,
  slug?: string
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

function normalizarNumeroVerArquivo(valor: unknown, fallback = 0) {
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
    visualizacoes: normalizarNumeroVerArquivo(
      obra.visualizacoes ??
        obra.views ??
        obra.visualizacoesTotal ??
        obra.totalVisualizacoes ??
        obra.total_visualizacoes
    ),
    totalCurtidas: normalizarNumeroVerArquivo(
      obra.totalCurtidas ?? obra.curtidas ?? obra.likes ?? obra.total_curtidas,
      capitulosNormalizados.filter((capitulo) => capitulo.curtiu).length
    ),
    totalComentarios: normalizarNumeroVerArquivo(
      obra.totalComentarios ?? obra.comentarios ?? obra.total_comentarios,
      capitulosNormalizados.filter((capitulo) => capitulo.comentario.trim()).length
    ),
    totalSalvos: normalizarNumeroVerArquivo(
      obra.totalSalvos ?? obra.salvos ?? obra.total_salvos,
      capitulosNormalizados.filter((capitulo) => capitulo.salvo).length
    ),
    totalLidos: normalizarNumeroVerArquivo(
      obra.totalLidos ?? obra.lidos ?? obra.total_lidos,
      capitulosNormalizados.filter((capitulo) => capitulo.lido).length
    ),
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
    const obrasTexto = lerStorageUsuarioVerArquivo(STORAGE_KEY, userIdLimpo);
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
    visualizacoes: normalizarNumeroVerArquivo(
      obra.visualizacoes,
      obraLocal?.visualizacoes || 0
    ),
    totalCurtidas: normalizarNumeroVerArquivo(
      obraLocal?.totalCurtidas,
      capitulosMesclados.filter((capitulo) => capitulo.curtiu).length
    ),
    totalComentarios: normalizarNumeroVerArquivo(
      obraLocal?.totalComentarios,
      capitulosMesclados.filter((capitulo) => capitulo.comentario.trim()).length
    ),
    totalSalvos: normalizarNumeroVerArquivo(
      obraLocal?.totalSalvos,
      capitulosMesclados.filter((capitulo) => capitulo.salvo).length
    ),
    totalLidos: normalizarNumeroVerArquivo(
      obraLocal?.totalLidos,
      capitulosMesclados.filter((capitulo) => capitulo.lido).length
    ),
    slug,
    link: obra.link?.trim() || obraLocal?.link || `/obra/${slug}`,
    arquivoObra: arquivoUrl
      ? {
          nome:
            obra.arquivo_nome?.trim() ||
            obraLocal?.arquivoObra?.nome ||
            "Arquivo",
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
            "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,visualizacoes,slug,link,criada_em,atualizado_em"
          )
          .eq("id", obraIdBusca)
          .limit(1)
      : await supabase
          .from("obras")
          .select(
            "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,visualizacoes,slug,link,criada_em,atualizado_em"
          )
          .eq("slug", slugBusca)
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

    const autorIdBanco = obraBanco.user_id?.trim() || "";
    const usuarioEhDono = Boolean(userId && autorIdBanco === userId);

    if (!obraBanco.publicado && !usuarioEhDono) {
      return obrasLocais;
    }

    let capitulosQuery = supabase
      .from("capitulos")
      .select("id,obra_id,user_id,titulo,texto,ordem,publicado,criado_em,atualizado_em")
      .eq("obra_id", obraBanco.id)
      .order("ordem", { ascending: true })
      .limit(300);

    if (!usuarioEhDono) {
      capitulosQuery = capitulosQuery.eq("publicado", true);
    }

    const { data: capitulosSupabase, error: erroCapitulos } =
      await capitulosQuery;

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

    const nomeProfileAutor = usuarioEhDono
      ? nomeAutorProfile.trim() ||
        (await buscarNomeProfileVerArquivo(autorIdBanco || userId))
      : await buscarNomeProfileVerArquivo(autorIdBanco);

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

function usuarioPodeAbrirArquivoObra(obra: ObraLocal, userId: string) {
  const autorId = obra.autorId?.trim() || "";

  return obra.publicado || !autorId || Boolean(userId && autorId === userId);
}

function criarComentarioArquivoId() {
  const cryptoGlobal =
    typeof globalThis !== "undefined" && "crypto" in globalThis
      ? globalThis.crypto
      : null;

  if (cryptoGlobal && typeof cryptoGlobal.randomUUID === "function") {
    return cryptoGlobal.randomUUID();
  }

  return `comentario-arquivo-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function carregarListaIdsStorageVerArquivo(chave: string, userId: string) {
  const texto = lerStorageUsuarioVerArquivo(chave, userId);

  try {
    const json: unknown = texto ? JSON.parse(texto) : [];

    return Array.isArray(json)
      ? json.filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
      : [];
  } catch {
    return [];
  }
}

function salvarListaIdsStorageVerArquivo(
  chave: string,
  userId: string,
  ids: string[]
) {
  salvarJsonStorageUsuarioVerArquivo(
    chave,
    userId,
    Array.from(new Set(ids.filter((id) => Boolean(id.trim()))))
  );
}

function carregarComentariosArquivoStorage(userId: string, obraId: string) {
  const obraIdLimpo = obraId.trim();
  const texto = lerStorageUsuarioVerArquivo(FILE_COMMENTS_STORAGE_KEY, userId);

  if (!obraIdLimpo) {
    return [] as ComentarioArquivoObra[];
  }

  try {
    const json: unknown = texto ? JSON.parse(texto) : {};
    const comentariosPorObra =
      json && typeof json === "object" && !Array.isArray(json)
        ? (json as Record<string, unknown>)
        : {};
    const comentarios = comentariosPorObra[obraIdLimpo];

    return Array.isArray(comentarios)
      ? comentarios
          .map((comentario): ComentarioArquivoObra | null => {
            if (
              !comentario ||
              typeof comentario !== "object" ||
              Array.isArray(comentario)
            ) {
              return null;
            }

            const registro = comentario as Partial<ComentarioArquivoObra>;

            if (
              typeof registro.id !== "string" ||
              typeof registro.texto !== "string" ||
              !registro.texto.trim()
            ) {
              return null;
            }

            return {
              id: registro.id,
              obraId: obraIdLimpo,
              userId:
                typeof registro.userId === "string" ? registro.userId.trim() : "",
              nome:
                typeof registro.nome === "string" && registro.nome.trim()
                  ? registro.nome.trim()
                  : "Leitor",
              texto: registro.texto.trim(),
              criadoEm:
                typeof registro.criadoEm === "string" && registro.criadoEm.trim()
                  ? registro.criadoEm
                  : new Date().toISOString(),
            };
          })
          .filter(
            (comentario): comentario is ComentarioArquivoObra =>
              Boolean(comentario)
          )
      : [];
  } catch {
    return [] as ComentarioArquivoObra[];
  }
}

function salvarComentariosArquivoStorage(
  userId: string,
  obraId: string,
  comentarios: ComentarioArquivoObra[]
) {
  const obraIdLimpo = obraId.trim();

  if (!obraIdLimpo) {
    return;
  }

  try {
    const texto = lerStorageUsuarioVerArquivo(FILE_COMMENTS_STORAGE_KEY, userId);
    const json: unknown = texto ? JSON.parse(texto) : {};
    const comentariosPorObra =
      json && typeof json === "object" && !Array.isArray(json)
        ? (json as Record<string, unknown>)
        : {};

    salvarJsonStorageUsuarioVerArquivo(FILE_COMMENTS_STORAGE_KEY, userId, {
      ...comentariosPorObra,
      [obraIdLimpo]: comentarios.slice(0, 120),
    });
  } catch {
    salvarJsonStorageUsuarioVerArquivo(FILE_COMMENTS_STORAGE_KEY, userId, {
      [obraIdLimpo]: comentarios.slice(0, 120),
    });
  }
}

async function contarCurtidasObraSupabase(obraId: string) {
  if (!idObraSupabaseValido(obraId)) {
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from("obra_curtidas")
      .select("obra_id", { count: "exact", head: true })
      .eq("obra_id", obraId);

    if (error) {
      return 0;
    }

    return Math.max(0, count ?? 0);
  } catch {
    return 0;
  }
}

async function usuarioCurtiuObraSupabase(obraId: string, userId: string) {
  if (!idObraSupabaseValido(obraId) || !userId.trim()) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from("obra_curtidas")
      .select("obra_id")
      .eq("obra_id", obraId)
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    return !error && Boolean(data);
  } catch {
    return false;
  }
}

async function salvarCurtidaObraSupabase(
  obraId: string,
  userId: string,
  ativo: boolean
) {
  if (!idObraSupabaseValido(obraId) || !userId.trim()) {
    return false;
  }

  try {
    const { error: erroDelete } = await supabase
      .from("obra_curtidas")
      .delete()
      .eq("obra_id", obraId)
      .eq("user_id", userId);

    if (erroDelete) {
      throw erroDelete;
    }

    if (!ativo) {
      return true;
    }

    const { error: erroComVisibilidade } = await supabase
      .from("obra_curtidas")
      .insert({
        obra_id: obraId,
        user_id: userId,
        visibilidade: "publico",
      });

    if (!erroComVisibilidade) {
      return true;
    }

    const { error: erroSemVisibilidade } = await supabase
      .from("obra_curtidas")
      .insert({
        obra_id: obraId,
        user_id: userId,
      });

    return !erroSemVisibilidade;
  } catch (error) {
    console.warn("Não consegui salvar a curtida do arquivo:", error);
    return false;
  }
}

async function usuarioSalvouObraSupabase(obraId: string, userId: string) {
  if (!idObraSupabaseValido(obraId) || !userId.trim()) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from("favoritos")
      .select("obra_id")
      .eq("obra_id", obraId)
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    return !error && Boolean(data);
  } catch {
    return false;
  }
}

async function salvarFavoritoObraSupabase(
  obraId: string,
  userId: string,
  ativo: boolean
) {
  if (!idObraSupabaseValido(obraId) || !userId.trim()) {
    return false;
  }

  try {
    const { error: erroDelete } = await supabase
      .from("favoritos")
      .delete()
      .eq("obra_id", obraId)
      .eq("user_id", userId);

    if (erroDelete) {
      throw erroDelete;
    }

    if (!ativo) {
      return true;
    }

    const { error: erroComVisibilidade } = await supabase
      .from("favoritos")
      .insert({
        obra_id: obraId,
        user_id: userId,
        visibilidade: "publico",
      });

    if (!erroComVisibilidade) {
      return true;
    }

    const { error: erroSemVisibilidade } = await supabase
      .from("favoritos")
      .insert({
        obra_id: obraId,
        user_id: userId,
      });

    return !erroSemVisibilidade;
  } catch (error) {
    console.warn("Não consegui salvar o arquivo na lista:", error);
    return false;
  }
}



export default function VerArquivoPage() {
  const router = useRouter();
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const { notificacoesNaoLidas } = useNotificacoes();
  const [redirecionandoLogin, setRedirecionandoLogin] = useState(false);
  const [obraIdBusca, setObraIdBusca] = useState("");
  const [slugBusca, setSlugBusca] = useState("");
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [curtidaAtiva, setCurtidaAtiva] = useState(false);
  const [salvoAtivo, setSalvoAtivo] = useState(false);
  const [totalCurtidasArquivo, setTotalCurtidasArquivo] = useState(0);
  const [comentariosArquivo, setComentariosArquivo] = useState<ComentarioArquivoObra[]>([]);
  const [comentarioTexto, setComentarioTexto] = useState("");
  const [comentarioStatus, setComentarioStatus] = useState("");
  const [mostrarComentariosArquivo, setMostrarComentariosArquivo] = useState(false);
  const [mensagemAcao, setMensagemAcao] = useState("");
  const [salvandoInteracao, setSalvandoInteracao] = useState(false);
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
      window.setTimeout(() => {
        if (!cancelado) {
          setObraIdBusca(obraIdParam);
          setSlugBusca(slugParam);
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
                criarLoginHrefVerArquivo(obraIdParam, slugParam)
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
          carregarObrasLocais(userId),
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
                obrasAtualizadas,
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
        const obraEncontrada =
          (obraIdBusca && obra.id === obraIdBusca) ||
          (slugBusca && slugObra === slugBusca);

        return obraEncontrada && usuarioPodeAbrirArquivoObra(obra, usuarioIdLogado);
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

  const perfilAutorHref = obraAtual
    ? criarPerfilAutorHrefVerArquivo(obraAtual.autor, obraAtual.autorId)
    : "/perfil-autor";
  const totalComentariosArquivo = comentariosArquivo.length;

  useEffect(() => {
    let cancelado = false;

    async function carregarInteracoesArquivo() {
      if (!obraAtual || !usuarioIdLogado) {
        setCurtidaAtiva(false);
        setSalvoAtivo(false);
        setTotalCurtidasArquivo(0);
        setComentariosArquivo([]);
        setComentarioTexto("");
        setComentarioStatus("");
        setMensagemAcao("");
        return;
      }

      const obraId = obraAtual.id.trim();
      const curtidasLocais = carregarListaIdsStorageVerArquivo(
        FILE_LIKES_STORAGE_KEY,
        usuarioIdLogado
      );
      const salvosLocais = carregarListaIdsStorageVerArquivo(
        FILE_SAVED_STORAGE_KEY,
        usuarioIdLogado
      );
      const comentariosLocais = carregarComentariosArquivoStorage(
        usuarioIdLogado,
        obraId
      );
      const curtiuLocal = curtidasLocais.includes(obraId);
      const salvoLocal = salvosLocais.includes(obraId);

      let curtiuFinal = curtiuLocal;
      let salvoFinal = salvoLocal;
      let totalCurtidasFinal = Math.max(
        obraAtual.totalCurtidas || 0,
        curtiuLocal ? 1 : 0
      );

      if (idObraSupabaseValido(obraId)) {
        const [totalCurtidasRemoto, curtiuRemoto, salvoRemoto] =
          await Promise.all([
            contarCurtidasObraSupabase(obraId),
            usuarioCurtiuObraSupabase(obraId, usuarioIdLogado),
            usuarioSalvouObraSupabase(obraId, usuarioIdLogado),
          ]);

        curtiuFinal = curtiuRemoto || curtiuLocal;
        salvoFinal = salvoRemoto || salvoLocal;
        totalCurtidasFinal = Math.max(
          totalCurtidasFinal,
          totalCurtidasRemoto,
          curtiuFinal ? 1 : 0
        );
      }

      if (cancelado) {
        return;
      }

      setCurtidaAtiva(curtiuFinal);
      setSalvoAtivo(salvoFinal);
      setTotalCurtidasArquivo(totalCurtidasFinal);
      setComentariosArquivo(comentariosLocais);
      setComentarioStatus("");
      setMensagemAcao("");
    }

    void carregarInteracoesArquivo();

    return () => {
      cancelado = true;
    };
  }, [obraAtual, usuarioIdLogado]);

  async function alternarCurtidaArquivo() {
    if (!obraAtual || salvandoInteracao) {
      return;
    }

    const obraId = obraAtual.id.trim();
    const novoStatus = !curtidaAtiva;
    const curtidasLocais = carregarListaIdsStorageVerArquivo(
      FILE_LIKES_STORAGE_KEY,
      usuarioIdLogado
    );
    const proximasCurtidasLocais = novoStatus
      ? Array.from(new Set([...curtidasLocais, obraId]))
      : curtidasLocais.filter((id) => id !== obraId);

    setSalvandoInteracao(true);
    setMensagemAcao("");
    setCurtidaAtiva(novoStatus);
    setTotalCurtidasArquivo((totalAtual) =>
      Math.max(0, totalAtual + (novoStatus ? 1 : -1))
    );
    salvarListaIdsStorageVerArquivo(
      FILE_LIKES_STORAGE_KEY,
      usuarioIdLogado,
      proximasCurtidasLocais
    );

    const sincronizado = await salvarCurtidaObraSupabase(
      obraId,
      usuarioIdLogado,
      novoStatus
    );

    if (!sincronizado && idObraSupabaseValido(obraId)) {
      setMensagemAcao("A curtida ficou salva neste aparelho, mas não sincronizou agora.");
    }

    setSalvandoInteracao(false);
  }

  async function alternarSalvoArquivo() {
    if (!obraAtual || salvandoInteracao) {
      return;
    }

    const obraId = obraAtual.id.trim();
    const novoStatus = !salvoAtivo;
    const salvosLocais = carregarListaIdsStorageVerArquivo(
      FILE_SAVED_STORAGE_KEY,
      usuarioIdLogado
    );
    const proximosSalvosLocais = novoStatus
      ? Array.from(new Set([...salvosLocais, obraId]))
      : salvosLocais.filter((id) => id !== obraId);

    setSalvandoInteracao(true);
    setMensagemAcao("");
    setSalvoAtivo(novoStatus);
    salvarListaIdsStorageVerArquivo(
      FILE_SAVED_STORAGE_KEY,
      usuarioIdLogado,
      proximosSalvosLocais
    );

    const sincronizado = await salvarFavoritoObraSupabase(
      obraId,
      usuarioIdLogado,
      novoStatus
    );

    if (!sincronizado && idObraSupabaseValido(obraId)) {
      setMensagemAcao("O salvamento ficou neste aparelho, mas não sincronizou agora.");
    }

    setSalvandoInteracao(false);
  }

  async function enviarComentarioArquivo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!obraAtual || salvandoInteracao) {
      return;
    }

    const textoComentario = comentarioTexto.trim();

    if (textoComentario.length < 2) {
      setComentarioStatus("Escreva um comentário antes de enviar.");
      return;
    }

    setSalvandoInteracao(true);
    setComentarioStatus("");
    setMensagemAcao("");

    const nomeProfile = await buscarNomeProfileVerArquivo(usuarioIdLogado);
    const novoComentario: ComentarioArquivoObra = {
      id: criarComentarioArquivoId(),
      obraId: obraAtual.id,
      userId: usuarioIdLogado,
      nome: nomeProfile || "Você",
      texto: textoComentario.slice(0, 600),
      criadoEm: new Date().toISOString(),
    };
    const proximosComentarios = [novoComentario, ...comentariosArquivo].slice(0, 120);

    setComentariosArquivo(proximosComentarios);
    setComentarioTexto("");
    salvarComentariosArquivoStorage(
      usuarioIdLogado,
      obraAtual.id,
      proximosComentarios
    );
    setSalvandoInteracao(false);
  }

  function abrirArquivoEmNovaAba() {
    const arquivoHref = arquivo?.conteudo?.trim() || "";

    if (!arquivoHref) {
      return;
    }

    const novaJanela = window.open(arquivoHref, "_blank", "noopener,noreferrer");

    if (!novaJanela) {
      window.location.href = arquivoHref;
    }
  }

  function inserirNoComentarioArquivo(valor: string) {
    setComentarioTexto((textoAtual) => `${textoAtual}${valor}`);
    setComentarioStatus("");
  }

  function responderComentarioArquivo(nomeAutor: string) {
    const nomeLimpo = nomeAutor.replace(/\s+/g, " ").trim();

    if (!nomeLimpo) {
      return;
    }

    setComentarioTexto(`@${nomeLimpo} `);
    setComentarioStatus("");
  }

  function removerComentarioArquivo(comentarioId: string) {
    if (!obraAtual || !usuarioIdLogado) {
      return;
    }

    const proximosComentarios = comentariosArquivo.filter(
      (comentario) => comentario.id !== comentarioId
    );

    setComentariosArquivo(proximosComentarios);
    salvarComentariosArquivoStorage(
      usuarioIdLogado,
      obraAtual.id,
      proximosComentarios
    );
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

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${verArquivoPageCss}`}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        {isDesktop ? (
          <header style={desktopTopStyle}>
            <span aria-hidden="true" />

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
          </header>
        ) : null}

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

            <div style={isDesktop ? desktopActionsGridStyle : actionsGridStyle}>
              <button
                type="button"
                onClick={abrirArquivoEmNovaAba}
                style={primaryActionButtonStyle}
              >
                Abrir arquivo
              </button>

              <a
                href={arquivo.conteudo}
                download={arquivo.nome}
                style={secondaryActionStyle}
              >
                Baixar
              </a>
            </div>

            <div style={isDesktop ? desktopSocialActionsStyle : socialActionsStyle}>
              <button
                type="button"
                onClick={alternarCurtidaArquivo}
                disabled={salvandoInteracao}
                style={curtidaAtiva ? activeSocialButtonStyle : socialButtonStyle}
              >
                ♥ {curtidaAtiva ? "Curtido" : "Curtir"} · {totalCurtidasArquivo}
              </button>

              <button
                type="button"
                onClick={() => setMostrarComentariosArquivo(true)}
                style={socialButtonStyle}
              >
                💬 Comentários · {totalComentariosArquivo}
              </button>

              <button
                type="button"
                onClick={alternarSalvoArquivo}
                disabled={salvandoInteracao}
                style={salvoAtivo ? activeSocialButtonStyle : socialButtonStyle}
              >
                {salvoAtivo ? "Salvo" : "Salvar"}
              </button>
            </div>

            {mensagemAcao ? (
              <span style={actionMessageStyle}>{mensagemAcao}</span>
            ) : null}
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
                  Abrir arquivo
                </button>

                <a
                  href={arquivo.conteudo}
                  download={arquivo.nome}
                  style={secondaryActionStyle}
                >
                  Baixar
                </a>
              </div>
            </section>
          )}
        </section>

        {mostrarComentariosArquivo ? (
          <ComentariosArquivoPortal>
            <section style={commentsSheetOverlayStyle} aria-label="Comentários">
              <button
                type="button"
                aria-label="Fechar comentários"
                onClick={() => setMostrarComentariosArquivo(false)}
                style={commentsSheetBackdropStyle}
              />

            <article style={isDesktop ? desktopCommentsSheetStyle : commentsSheetStyle}>
              <div style={commentsSheetHandleWrapStyle}>
                <div style={commentsSheetHandleStyle} />
              </div>

              <header style={commentsSheetHeaderStyle}>
                <span style={commentsSheetHeaderSpacerStyle} aria-hidden="true" />

                <strong style={commentsSheetTitleStyle}>
                  {totalComentariosArquivo === 1
                    ? "1 comentário"
                    : `${totalComentariosArquivo} comentários`}
                </strong>

                <button
                  type="button"
                  onClick={() => setMostrarComentariosArquivo(false)}
                  style={commentsSheetCloseStyle}
                >
                  ×
                </button>
              </header>

              <section style={commentsSheetListStyle}>
                {comentariosArquivo.length > 0 ? (
                  comentariosArquivo.map((comentario) => {
                    const podeRemoverComentario = Boolean(
                      usuarioIdLogado && comentario.userId === usuarioIdLogado
                    );

                    return (
                      <article key={comentario.id} style={commentSheetItemStyle}>
                        <Link
                          href={criarPerfilAutorHrefVerArquivo(comentario.nome, comentario.userId)}
                          aria-label={`Abrir perfil de ${comentario.nome}`}
                          style={commentSheetAvatarLinkStyle}
                        >
                          {comentario.nome.slice(0, 1).toUpperCase() || "L"}
                        </Link>

                        <div style={commentSheetContentStyle}>
                          <div style={commentSheetTopLineStyle}>
                            <Link
                              href={criarPerfilAutorHrefVerArquivo(comentario.nome, comentario.userId)}
                              style={commentSheetAuthorLinkStyle}
                            >
                              {comentario.nome}
                            </Link>

                            <span style={commentSheetTimeStyle}>
                              {formatarData(comentario.criadoEm)}
                            </span>
                          </div>

                          <p style={commentSheetTextStyle}>{comentario.texto}</p>

                          <div style={commentSheetActionsRowStyle}>
                            <button
                              type="button"
                              onClick={() => responderComentarioArquivo(comentario.nome)}
                              style={commentSheetReplyButtonStyle}
                            >
                              Responder
                            </button>

                            {podeRemoverComentario ? (
                              <button
                                type="button"
                                onClick={() => removerComentarioArquivo(comentario.id)}
                                style={commentSheetRemoveButtonStyle}
                              >
                                Remover
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <p style={emptyCommentsStyle}>Sem comentários ainda</p>
                )}
              </section>

              <section style={commentsToolsStyle}>
                <div style={commentsQuickReactionsStyle}>
                  {["💜", "🔥", "😂", "😮", "😭", "👏"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => inserirNoComentarioArquivo(emoji)}
                      style={commentsQuickReactionButtonStyle}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </section>

              <form onSubmit={enviarComentarioArquivo} style={commentsSheetFormStyle}>
                <div style={commentInputAvatarStyle}>
                  {(usuarioIdLogado ? "H" : "H").slice(0, 1).toUpperCase()}
                </div>

                <div style={commentsInputBoxStyle}>
                  <textarea
                    value={comentarioTexto}
                    onChange={(event) => {
                      setComentarioTexto(event.target.value);
                      setComentarioStatus("");
                    }}
                    style={commentsSheetInputStyle}
                    placeholder="Adicionar comentário..."
                    maxLength={600}
                    rows={1}
                    disabled={salvandoInteracao}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => inserirNoComentarioArquivo("@")}
                  disabled={salvandoInteracao}
                  style={commentsInputIconButtonStyle}
                >
                  @
                </button>

                <button
                  type="submit"
                  aria-label="Enviar comentário"
                  disabled={salvandoInteracao}
                  style={{
                    ...commentsSheetSendStyle,
                    opacity: salvandoInteracao ? 0.58 : 1,
                    cursor: salvandoInteracao ? "not-allowed" : "pointer",
                  }}
                >
                  {salvandoInteracao ? "..." : "↑"}
                </button>
              </form>

              {comentarioStatus ? (
                <span style={commentStatusStyle}>{comentarioStatus}</span>
              ) : null}
            </article>
          </section>
          </ComentariosArquivoPortal>
        ) : null}
      </section>
    </main>
  );
}

const socialActionsStyle: CSSProperties = {
marginTop: "10px",
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopSocialActionsStyle: CSSProperties = {
...socialActionsStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  maxWidth: "100%",
};

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const socialButtonStyle: CSSProperties = {
minHeight: "38px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#08030F",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 8px",
  fontSize: "10.5px",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
  boxSizing: "border-box",
  fontFamily: "inherit",
  textAlign: "center",
  lineHeight: 1.05,
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

const activeSocialButtonStyle: CSSProperties = {
...socialButtonStyle,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "#08030F",
  color: "#FFFFFF",
};

const actionMessageStyle: CSSProperties = {
display: "block",
  marginTop: "4px",
  color: "#86EFAC",
  fontSize: "11px",
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const commentsSheetOverlayStyle: CSSProperties = {
position: "fixed",
  inset: 0,
  zIndex: 2147483647,
  isolation: "isolate",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  background: "rgba(0, 0, 0, 0.46)",
  backdropFilter: "blur(8px)",
  pointerEvents: "auto",
};

const commentsSheetBackdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 0,
  border: 0,
  background: "transparent",
  padding: 0,
  cursor: "pointer",
};

const commentsSheetStyle: CSSProperties = {
position: "relative",
  zIndex: 2147483647,
  width: "100%",
  maxHeight: "82vh",
  borderTopLeftRadius: "28px",
  borderTopRightRadius: "28px",
  border: "1px solid rgba(255, 255, 255, 0.10)",
  borderBottom: 0,
  background: "linear-gradient(180deg, rgba(10, 3, 20, 0.99), rgba(5, 0, 12, 1))",
  boxShadow: "0 -28px 70px rgba(0, 0, 0, 0.84)",
  padding: "8px 12px calc(26px + env(safe-area-inset-bottom))",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  overflow: "hidden",
};

const desktopCommentsSheetStyle: CSSProperties = {
  ...commentsSheetStyle,
  width: "min(760px, calc(100% - 48px))",
  maxHeight: "76vh",
  borderRadius: "28px 28px 0 0",
  padding: "10px 18px 18px",
};

const commentsSheetHandleWrapStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  padding: "4px 0 2px",
};

const commentsSheetHandleStyle: CSSProperties = {
  width: "44px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(255, 255, 255, 0.22)",
};

const commentsSheetHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "40px 1fr 40px",
  alignItems: "center",
  gap: "8px",
};

const commentsSheetHeaderSpacerStyle: CSSProperties = {
  width: "40px",
  height: "40px",
};

const commentsSheetTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "16px",
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.02em",
};

const commentsSheetCloseStyle: CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "999px",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  background: "rgba(255, 255, 255, 0.06)",
  color: "#FFFFFF",
  fontSize: "24px",
  fontWeight: 900,
  cursor: "pointer",
};

const commentsSheetListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  minHeight: "120px",
  overflowY: "auto",
  padding: "2px 2px 4px",
};

const commentSheetItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "40px 1fr",
  gap: "10px",
  alignItems: "flex-start",
};

const commentSheetAvatarLinkStyle: CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "999px",
  border: "1px solid rgba(168, 85, 247, 0.24)",
  background: "rgba(255, 255, 255, 0.06)",
  color: "#FFFFFF",
  display: "grid",
  placeItems: "center",
  fontSize: "15px",
  fontWeight: 950,
  textDecoration: "none",
  overflow: "hidden",
};

const commentSheetContentStyle: CSSProperties = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const commentSheetTopLineStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
};

const commentSheetAuthorLinkStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  textDecoration: "none",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const commentSheetTimeStyle: CSSProperties = {
  color: "rgba(255, 255, 255, 0.42)",
  fontSize: "11px",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const commentSheetTextStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255, 255, 255, 0.88)",
  fontSize: "13px",
  lineHeight: 1.45,
  fontWeight: 650,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

const commentSheetActionsRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginTop: "2px",
};

const commentSheetReplyButtonStyle: CSSProperties = {
  border: 0,
  background: "transparent",
  color: "rgba(255, 255, 255, 0.56)",
  fontSize: "11px",
  fontWeight: 900,
  padding: 0,
  cursor: "pointer",
};

const commentSheetRemoveButtonStyle: CSSProperties = {
  ...commentSheetReplyButtonStyle,
  color: "rgba(248, 113, 113, 0.9)",
};

const commentsSheetFormStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px 1fr 34px 38px",
  gap: "8px",
  alignItems: "center",
  paddingTop: "8px",
  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
};

const commentsSheetInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "38px",
  maxHeight: "92px",
  border: 0,
  outline: "none",
  resize: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontSize: "13px",
  lineHeight: 1.35,
  fontWeight: 750,
  padding: "10px 12px",
  fontFamily: "inherit",
};

const commentsSheetSendStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "999px",
  border: "1px solid rgba(168, 85, 247, 0.42)",
  background: "rgba(88, 28, 135, 0.78)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

const commentsShellStyle: CSSProperties = {
  marginTop: "12px",
  display: "grid",
  gridTemplateRows: "auto minmax(0, auto) auto auto auto",
  gap: "7px",
  padding: "6px 12px calc(12px + env(safe-area-inset-bottom))",
  borderRadius: "26px",
  background: "#070212",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.14))",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const desktopCommentsShellStyle: CSSProperties = {
  ...commentsShellStyle,
  width: "min(680px, 100%)",
  margin: "14px auto 0",
  borderRadius: "28px",
  padding: "8px 14px 14px",
};

const commentsHeaderStyle: CSSProperties = {
  minHeight: "32px",
  display: "grid",
  gridTemplateColumns: "40px minmax(0, 1fr) 40px",
  alignItems: "center",
  gap: "6px",
  minWidth: 0,
};

const commentsHeaderSpacerStyle: CSSProperties = {
  width: "40px",
  height: "1px",
};

const commentsTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14.5px",
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.02em",
};

const commentsListStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: "10px",
  minHeight: 0,
  maxHeight: "min(44dvh, 420px)",
  overflowY: "auto",
  padding: "6px 2px 9px",
  WebkitOverflowScrolling: "touch",
};

const commentCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr)",
  gap: "10px",
  alignItems: "start",
  minWidth: 0,
};

const commentAvatarStyle: CSSProperties = {
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

const commentBodyStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  minWidth: 0,
};

const commentTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "6px",
  minWidth: 0,
};

const commentAuthorStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 950,
  ...safeTextStyle,
};

const commentDateStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  fontWeight: 750,
  flex: "0 0 auto",
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
  ...commentReplyButtonStyle,
  color: "var(--historietas-danger-button-text, #FCA5A5)",
  fontWeight: 950,
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

const commentFormStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "30px minmax(0, 1fr) 28px 38px",
  alignItems: "center",
  gap: "7px",
  padding: "7px 0 0",
  minWidth: 0,
  background: "transparent",
};

const commentInputAvatarStyle: CSSProperties = {
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

const commentsInputBoxStyle: CSSProperties = {
  minWidth: 0,
  minHeight: "38px",
  display: "flex",
  alignItems: "center",
};

const commentTextareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "38px",
  maxHeight: "82px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  background: "#04000A",
  color: "var(--historietas-text-primary, #FFFFFF)",
  padding: "9px 12px",
  fontSize: "12.5px",
  lineHeight: 1.32,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
  resize: "none",
  overflowY: "auto",
  ...safeTextStyle,
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

const commentSubmitButtonStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "999px",
  border: "none",
  background: "var(--historietas-accent, #6D28D9)",
  color: "#FFFFFF",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  fontFamily: "inherit",
  padding: 0,
};

const commentStatusStyle: CSSProperties = {
  color: "#FDE68A",
  fontSize: "11px",
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const emptyCommentsStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 800,
  textAlign: "center",
  ...safeTextStyle,
};

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






const heroStyle: CSSProperties = {
display: "grid",
  gap: "8px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};

const heroGlowStyle: CSSProperties = {
display: "none",
};

const heroContentStyle: CSSProperties = {
position: "relative",
  zIndex: 1,
  display: "grid",
  gap: "8px",
  justifyItems: "center",
  textAlign: "center",
  padding: 0,
  minWidth: 0,
  maxWidth: "100%",
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

const fileAuthorLinkStyle: CSSProperties = {
margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.35,
  fontWeight: 750,
  textAlign: "center",
  textDecoration: "none",
  maxWidth: "100%",
  ...safeTextStyle,
};


const actionsGridStyle: CSSProperties = {
marginTop: "10px",
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const primaryActionStyle: CSSProperties = {
minHeight: "38px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#08030F",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10.5px",
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

const primaryActionButtonStyle: CSSProperties = {
  ...primaryActionStyle,
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

const secondaryActionStyle: CSSProperties = {
minHeight: "38px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#08030F",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10.5px",
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


const viewerShellStyle: CSSProperties = {
marginTop: "10px",
  minWidth: 0,
  maxWidth: "100%",
};

const imageViewerStyle: CSSProperties = {
display: "grid",
  gap: "10px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};

const imageStyle: CSSProperties = {
width: "100%",
  height: "auto",
  maxWidth: "100%",
  display: "block",
  borderRadius: "16px",
  objectFit: "contain",
};

const textViewerStyle: CSSProperties = {
display: "grid",
  gap: "10px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};

const viewerHeaderStyle: CSSProperties = {
display: "grid",
  gap: "5px",
  minWidth: 0,
  textAlign: "center",
  justifyItems: "center",
};

const miniTitleStyle: CSSProperties = {
color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  textAlign: "center",
  maxWidth: "100%",
  ...safeTextStyle,
};

const viewerTitleStyle: CSSProperties = {
margin: 0,
  color: "#FFFFFF",
  fontSize: "clamp(22px, 6vw, 32px)",
  lineHeight: 1.05,
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
  fontSize: "17px",
  lineHeight: 1.9,
  fontWeight: 550,
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
  background: "transparent",
  border: "none",
  borderRadius: 0,
  padding: 0,
  minWidth: 0,
  maxWidth: "100%",
  overflowX: "auto",
  overflowWrap: "break-word",
  wordBreak: "break-word",
  textAlign: "left",
  ...safeTextStyle,
};

const pdfViewerStyle: CSSProperties = {
height: "min(78vh, 760px)",
  minHeight: "520px",
  borderRadius: "18px",
  background: "transparent",
  border: "none",
  boxShadow: "none",
  overflow: "hidden",
};

const pdfFrameStyle: CSSProperties = {
width: "100%",
  height: "100%",
  border: "none",
  display: "block",
  background: "#04000A",
};

const genericFileBoxStyle: CSSProperties = {
display: "grid",
  gap: "10px",
  padding: "10px 0",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};

const emptyBoxStyle: CSSProperties = {
display: "grid",
  gap: "10px",
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

const emptyTitleStyle: CSSProperties = {
margin: 0,
  color: "#FFFFFF",
  fontSize: "clamp(28px, 8vw, 42px)",
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
  textAlign: "center",
  ...safeTextStyle,
};

const primaryLinkButtonStyle: CSSProperties = {
minHeight: "38px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#08030F",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10.5px",
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
  borderRadius: "28px",
};

const desktopHeroContentStyle: CSSProperties = {
...heroContentStyle,
  gridTemplateColumns: "minmax(0, 1fr)",
  gridTemplateRows: "auto",
  alignItems: "center",
  gap: "8px",
  padding: 0,
};


const desktopTitleStyle: CSSProperties = {
...titleStyle,
  fontSize: "clamp(34px, 4vw, 48px)",
  lineHeight: 1.04,
  maxWidth: "780px",
  justifySelf: "center",
};

const desktopFileAuthorLinkStyle: CSSProperties = {
...fileAuthorLinkStyle,
  fontSize: "12px",
};


const desktopActionsGridStyle: CSSProperties = {
...actionsGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
};

const desktopViewerShellStyle: CSSProperties = {
  ...viewerShellStyle,
  marginTop: "14px",
};

const desktopImageViewerStyle: CSSProperties = {
...imageViewerStyle,
  padding: "18px",
  borderRadius: "24px",
};

const desktopImageStyle: CSSProperties = {
  ...imageStyle,
  maxHeight: "760px",
  objectFit: "contain",
};

const desktopTextViewerStyle: CSSProperties = {
...textViewerStyle,
  padding: "20px",
  borderRadius: "24px",
  gap: "12px",
};

const desktopTextContentStyle: CSSProperties = {
...textContentStyle,
  fontSize: "18px",
  lineHeight: 1.94,
  maxHeight: "760px",
};

const desktopPdfViewerStyle: CSSProperties = {
...pdfViewerStyle,
  height: "min(82vh, 900px)",
  minHeight: "650px",
  borderRadius: "24px",
};

const desktopPdfFrameStyle: CSSProperties = {
  ...pdfFrameStyle,
};

const desktopGenericFileBoxStyle: CSSProperties = {
...genericFileBoxStyle,
  padding: "22px",
  borderRadius: "24px",
};