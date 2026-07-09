"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { supabase } from "../../../lib/supabase/client";
import { useNotificacoes } from "../../../components/NotificacoesProvider";
import { historietasThemeCss, useHistorietasTheme } from "../../../lib/historietasTheme";
import { criarSlugBase, formatarData, formatarNumeroCompacto, formatarTamanhoArquivo, idObraSupabaseValido, normalizarTexto, obterNumeroSeguro } from "../../../lib/utils";

const FOLLOWED_WORKS_STORAGE_KEY = "historietas-obras-seguidas";
const LIKED_WORKS_STORAGE_KEY = "historietas-obras-curtidas";
const VIEWED_WORKS_STORAGE_KEY = "historietas-obras-visualizacoes";
const RATED_WORKS_STORAGE_KEY = "historietas-obras-avaliacoes";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const LOCAL_WORKS_STORAGE_KEY = "historietas-obras";
const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";
const VERSAO_INTERACOES_OBRA_PUBLICA = "fix-interacoes-obra-2026-06-16-0022";

function criarStorageKeyUsuarioObraPublica(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

function lerStorageUsuarioObraPublica(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioObraPublica(chave, userIdLimpo);

    return chaveStorage ? localStorage.getItem(chaveStorage) : null;
  } catch {
    return null;
  }
}

function salvarStorageUsuarioObraPublica(
  chave: string,
  userId: string,
  valor: unknown
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioObraPublica(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // localStorage é fallback; a página continua com o estado em memória.
  }
}

type CapituloLocal = {
  id: string;
  titulo: string;
  texto: string;
  publicado?: boolean;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
  totalCurtidas?: number;
  totalComentarios?: number;
  totalSalvos?: number;
  totalLidos?: number;
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
  totalFavoritos?: number;
  totalConcluidas?: number;
  slug: string;
  link: string;
};

type SupabaseObraRow = {
  id: string;
  user_id: string | null;
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
  visualizacoes: number | null;
  views?: number | null;
  total_visualizacoes?: number | null;
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
  texto?: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

type SupabaseComunidadePostRow = {
  id: string;
  tipo_publicacao: string | null;
  obra_relacionada: string | null;
};

type CapituloDinamico = {
  id: string;
  numero: string;
  titulo: string;
  descricao: string;
  href: string;
  disponivel: boolean;
};

type ObraDinamica = {
  id: string;
  origem: "local";
  titulo: string;
  autor: string;
  autorId?: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  status: string;
  views: string;
  likes: string;
  comentarios: string;
  disponivel: boolean;
  slug: string;
  link: string;
  sinopse: string;
  tags: string[];
  capa: string;
  arquivoObra: ArquivoObraLocal | null;
  capitulos: CapituloDinamico[];
};

type PerfilPublicoObra = {
  userId: string;
  nome: string;
  avatar: string;
  bio: string;
};

type MetricasObraPublica = {
  visualizacoes: number;
  curtidas: number;
  comentarios: number;
  seguidores: number;
  curtidaAtiva: boolean;
  carregado: boolean;
};

type MetricasComunidadeObra = {
  teorias: number;
  reviews: number;
  interacoes: number;
  carregado: boolean;
};

type AvaliacaoObraPublica = {
  media: number;
  total: number;
  minhaNota: number;
  carregado: boolean;
  salvando: boolean;
};

const NOTAS_AVALIACAO_OBRA = [1, 2, 3, 4, 5] as const;

const metricasObraVazias: MetricasObraPublica = {
  visualizacoes: 0,
  curtidas: 0,
  comentarios: 0,
  seguidores: 0,
  curtidaAtiva: false,
  carregado: false,
};

const metricasComunidadeObraVazias: MetricasComunidadeObra = {
  teorias: 0,
  reviews: 0,
  interacoes: 0,
  carregado: false,
};

const avaliacaoObraVazia: AvaliacaoObraPublica = {
  media: 0,
  total: 0,
  minhaNota: 0,
  carregado: false,
  salvando: false,
};


async function criarLoginHrefObraPublica() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/obra";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/obra";
  const params = new URLSearchParams({
    redirectTo: destinoSeguro,
  });

  return `/login?${params.toString()}`;
}

function formatarGeneroObraPublica(genero: string) {
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

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
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
    const backupTexto = lerStorageUsuarioObraPublica(FILE_BACKUP_STORAGE_KEY, userId);
    const backupJson: unknown = backupTexto ? JSON.parse(backupTexto) : {};

    if (!backupJson || typeof backupJson !== "object" || Array.isArray(backupJson)) {
      return {};
    }

    const backupNormalizado: ArquivosObrasBackup = {};

    Object.entries(backupJson as Record<string, unknown>).forEach(([chave, arquivo]) => {
      const arquivoNormalizado = normalizarArquivoObra(arquivo);

      if (chave.trim() && arquivoNormalizado) {
        backupNormalizado[chave] = arquivoNormalizado;
      }
    });

    salvarStorageUsuarioObraPublica(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupNormalizado
    );

    return backupNormalizado;
  } catch {
    return {};
  }
}

function obterChavesBackupObra(obra: Pick<ObraLocal, "id" | "slug" | "titulo">) {
  return Array.from(
    new Set(
      [obra.id, obra.slug, criarSlugBase(obra.titulo)].filter((chave) =>
        Boolean(chave.trim())
      )
    )
  );
}

function sincronizarBackupArquivosObras(obrasLocais: ObraLocal[], userId = "") {
  if (typeof window === "undefined" || !userId.trim()) {
    return;
  }

  try {
    const backupAtual = carregarBackupArquivosObras(userId);

    obrasLocais.forEach((obraLocal) => {
      if (!obraLocal.arquivoObra) {
        return;
      }

      obterChavesBackupObra(obraLocal).forEach((chave) => {
        backupAtual[chave] = obraLocal.arquivoObra as ArquivoObraLocal;
      });
    });

    salvarStorageUsuarioObraPublica(FILE_BACKUP_STORAGE_KEY, userId, backupAtual);
  } catch {
    // Backup é apenas proteção extra. Não deve travar a página pública.
  }
}

function restaurarArquivoObraComBackup(
  obraLocal: ObraLocal,
  backup: ArquivosObrasBackup
): ObraLocal {
  if (obraLocal.arquivoObra) {
    return obraLocal;
  }

  const arquivoBackup = obterChavesBackupObra(obraLocal)
    .map((chave) => normalizarArquivoObra(backup[chave]))
    .find((arquivo): arquivo is ArquivoObraLocal => Boolean(arquivo));

  if (!arquivoBackup) {
    return obraLocal;
  }

  return {
    ...obraLocal,
    arquivoObra: arquivoBackup,
  };
}

function normalizarCapituloLocal(
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
    publicado: capitulo.publicado !== false,
    curtiu: Boolean(capitulo.curtiu),
    salvo: Boolean(capitulo.salvo),
    comentario:
      typeof capitulo.comentario === "string" ? capitulo.comentario : "",
    criadoEm: typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
    lido: Boolean(capitulo.lido),
    lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
    totalCurtidas: normalizarContadorObraPublica(
      (capitulo as Record<string, unknown>).totalCurtidas ??
        (capitulo as Record<string, unknown>).total_curtidas
    ),
    totalComentarios: normalizarContadorObraPublica(
      (capitulo as Record<string, unknown>).totalComentarios ??
        (capitulo as Record<string, unknown>).total_comentarios
    ),
    totalSalvos: normalizarContadorObraPublica(
      (capitulo as Record<string, unknown>).totalSalvos ??
        (capitulo as Record<string, unknown>).total_salvos
    ),
    totalLidos: normalizarContadorObraPublica(
      (capitulo as Record<string, unknown>).totalLidos ??
        (capitulo as Record<string, unknown>).total_lidos
    ),
  };
}

function normalizarObraLocal(
  obra: Partial<ObraLocal> & Record<string, unknown>,
  index: number
): ObraLocal {
  const capitulosNormalizadosTodos: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapituloLocal(
          capitulo as Partial<CapituloLocal>,
          capituloIndex
        )
      )
    : [];
  const capitulosNormalizados = capitulosNormalizadosTodos.filter(
    (capitulo) => capitulo.publicado !== false
  );

  const titulo =
    typeof obra.titulo === "string" && obra.titulo.trim()
      ? obra.titulo.trim()
      : "Obra sem título";

  const slug =
    typeof obra.slug === "string" && obra.slug.trim()
      ? obra.slug.trim()
      : criarSlugBase(titulo || `obra-${index + 1}`);

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
    titulo,
    autor:
      typeof obra.autor === "string" && obra.autor.trim()
        ? obra.autor
        : "Autor não informado",
    autorId:
      typeof obra.autorId === "string" && obra.autorId.trim()
        ? obra.autorId.trim()
        : typeof obra.user_id === "string" && obra.user_id.trim()
          ? obra.user_id.trim()
          : typeof obra.userId === "string" && obra.userId.trim()
            ? obra.userId.trim()
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
    visualizacoes: normalizarContadorObraPublica(
      obra.visualizacoes ??
        obra.views ??
        obra.visualizacoesTotal ??
        obra.totalVisualizacoes ??
        obra.total_visualizacoes
    ),
    totalCurtidas: normalizarContadorObraPublica(
      obra.totalCurtidas ?? obra.total_curtidas
    ),
    totalFavoritos: normalizarContadorObraPublica(
      obra.totalFavoritos ?? obra.total_favoritos
    ),
    totalConcluidas: normalizarContadorObraPublica(
      obra.totalConcluidas ?? obra.total_concluidas
    ),
    slug,
    link:
      typeof obra.link === "string" && obra.link.trim()
        ? obra.link
        : `/obra/${slug}`,
  };
}

function carregarObrasLocaisComBackup(userId = "") {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [];
  }

  const obrasLocaisTexto = lerStorageUsuarioObraPublica(
    LOCAL_WORKS_STORAGE_KEY,
    userIdLimpo
  );
  const obrasLocaisJson: unknown = obrasLocaisTexto
    ? JSON.parse(obrasLocaisTexto)
    : [];

  const backupArquivosObras = carregarBackupArquivosObras(userIdLimpo);

  const obrasNormalizadas = Array.isArray(obrasLocaisJson)
    ? obrasLocaisJson
        .map((obra, index) =>
          normalizarObraLocal(
            obra as Partial<ObraLocal> & Record<string, unknown>,
            index
          )
        )
        .map((obraLocal) =>
          restaurarArquivoObraComBackup(obraLocal, backupArquivosObras)
        )
    : [];

  const obrasPublicasLocais = obrasNormalizadas.filter((obraLocal) => {
    return obraLocal.publicado && obraLocal.capitulos.length > 0;
  });

  sincronizarBackupArquivosObras(obrasNormalizadas, userIdLimpo);

  return obrasPublicasLocais;
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
      texto: "",
      curtiu: Boolean(capituloLocal?.curtiu),
      salvo: Boolean(capituloLocal?.salvo),
      comentario: capituloLocal?.comentario || "",
      criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
      lido: Boolean(capituloLocal?.lido),
      lidoEm: capituloLocal?.lidoEm || "",
      totalCurtidas: normalizarContadorObraPublica(capituloLocal?.totalCurtidas),
      totalComentarios: normalizarContadorObraPublica(capituloLocal?.totalComentarios),
      totalSalvos: normalizarContadorObraPublica(capituloLocal?.totalSalvos),
      totalLidos: normalizarContadorObraPublica(capituloLocal?.totalLidos),
    } satisfies CapituloLocal;
  });

  const capitulosMesclados = capitulosRemotos;
  const tituloObra = obra.titulo?.trim() || obraLocal?.titulo || "Obra sem título";
  const slugObra =
    obra.slug?.trim() ||
    obraLocal?.slug ||
    criarSlugBase(tituloObra || `obra-${index + 1}`);
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
    autor: obra.autor?.trim() || obraLocal?.autor || "Autor não informado",
    autorId: obra.user_id?.trim() || obraLocal?.autorId || "",
    genero: obra.genero?.trim() || obraLocal?.genero || "Não informado",
    formato: obra.formato?.trim() || obraLocal?.formato || "Não informado",
    classificacaoIndicativa:
      obra.classificacao_indicativa?.trim() ||
      obraLocal?.classificacaoIndicativa ||
      "Não informada",
    sinopse:
      obra.sinopse?.trim() ||
      obraLocal?.sinopse ||
      "Nenhuma sinopse informada.",
    tags:
      Array.isArray(obra.tags) && obra.tags.length > 0
        ? obra.tags.filter((tag) => typeof tag === "string" && Boolean(tag.trim()))
        : obraLocal?.tags || ["sem tags"],
    capa: obra.capa_url?.trim() || obraLocal?.capa || "",
    capaNome: obra.capa_nome?.trim() || obraLocal?.capaNome || "",
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
    publicado: Boolean(obra.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obra.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    visualizacoes: normalizarContadorObraPublica(
      obra.visualizacoes ?? obra.views ?? obra.total_visualizacoes ?? obraLocal?.visualizacoes
    ),
    totalCurtidas: normalizarContadorObraPublica(obraLocal?.totalCurtidas),
    totalFavoritos: normalizarContadorObraPublica(obraLocal?.totalFavoritos),
    totalConcluidas: normalizarContadorObraPublica(obraLocal?.totalConcluidas),
    slug: slugObra,
    link: obra.link?.trim() || obraLocal?.link || `/obra/${slugObra}`,
  };
}

async function carregarObraSupabasePorSlug(
  slugBusca: string,
  obrasLocais: ObraLocal[],
  userId = ""
) {
  const slugLimpo = slugBusca.trim();

  if (!slugLimpo) {
    return obrasLocais;
  }

  try {
    const { data: obrasBanco, error: erroObra } = await supabase
      .from("obras")
      .select(
        "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,visualizacoes,publicado,slug,link,criada_em,atualizado_em"
      )
      .eq("slug", slugLimpo)
      .eq("publicado", true)
      .limit(1);

    if (erroObra) {
      console.warn(
        "Não consegui carregar a obra pública no Supabase:",
        erroObra.message
      );
      return obrasLocais;
    }

    const obraBanco = ((obrasBanco || []) as unknown as SupabaseObraRow[])[0] || null;

    if (!obraBanco) {
      return obrasLocais;
    }

    const { data: capitulosBanco, error: erroCapitulos } = await supabase
      .from("capitulos")
      .select("id,obra_id,user_id,titulo,ordem,publicado,criado_em,atualizado_em")
      .eq("obra_id", obraBanco.id)
      .eq("publicado", true)
      .order("ordem", { ascending: true })
      .limit(200);

    if (erroCapitulos) {
      console.warn(
        "Não consegui carregar capítulos da obra pública no Supabase:",
        erroCapitulos.message
      );
    }

    const obraLocal = obrasLocais.find((obraLocalAtual) => {
      const slugLocal = obraLocalAtual.slug || criarSlugBase(obraLocalAtual.titulo);

      return obraLocalAtual.id === obraBanco.id || slugLocal === slugLimpo;
    });

    const obraNormalizadaSemTotais = normalizarObraSupabase(
      obraBanco,
      erroCapitulos ? [] : ((capitulosBanco || []) as unknown as SupabaseCapituloRow[]),
      obraLocal,
      0
    );
    const [obraNormalizada] = await aplicarTotaisReaisObraPublica([
      obraNormalizadaSemTotais,
    ]);

    const obraJaExiste = obrasLocais.some(
      (obraLocalAtual) => obraLocalAtual.id === obraNormalizada.id
    );

    const obrasAtualizadas = obraJaExiste
      ? obrasLocais.map((obraLocalAtual) =>
          obraLocalAtual.id === obraNormalizada.id
            ? obraNormalizada
            : obraLocalAtual
        )
      : [obraNormalizada, ...obrasLocais];

    sincronizarBackupArquivosObras(obrasAtualizadas, userId);

    return obrasAtualizadas;
  } catch (error) {
    console.warn("Não consegui acessar o Supabase agora:", error);
    return obrasLocais;
  }
}


function normalizarContadorObraPublica(valor: unknown) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return Math.max(0, Math.round(valor));
  }

  if (typeof valor === "string" && valor.trim()) {
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));

    if (Number.isFinite(numero)) {
      return Math.max(0, Math.round(numero));
    }
  }

  return 0;
}

function incrementarContagemObraPublica(
  mapa: Map<string, number>,
  chave: string,
) {
  const chaveLimpa = chave.trim();

  if (!chaveLimpa) {
    return;
  }

  mapa.set(chaveLimpa, (mapa.get(chaveLimpa) || 0) + 1);
}

async function contarRegistrosPorColunaObraPublica(
  tabela: string,
  coluna: string,
  ids: string[],
) {
  const idsUnicos = Array.from(
    new Set(ids.map((id) => id.trim()).filter(Boolean)),
  );
  const contagens = new Map<string, number>();
  const tamanhoPagina = 1000;

  if (idsUnicos.length === 0) {
    return contagens;
  }

  for (let inicioIds = 0; inicioIds < idsUnicos.length; inicioIds += 80) {
    const loteIds = idsUnicos.slice(inicioIds, inicioIds + 80);
    let inicio = 0;

    while (true) {
      try {
        const { data, error } = await supabase
          .from(tabela)
          .select(coluna)
          .in(coluna, loteIds)
          .range(inicio, inicio + tamanhoPagina - 1);

        if (error || !Array.isArray(data) || data.length === 0) {
          break;
        }

        data.forEach((registro) => {
          if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
            return;
          }

          const valor = (registro as Record<string, unknown>)[coluna];

          if (typeof valor === "string") {
            incrementarContagemObraPublica(contagens, valor);
          }
        });

        if (data.length < tamanhoPagina) {
          break;
        }

        inicio += tamanhoPagina;
      } catch {
        break;
      }
    }
  }

  return contagens;
}

function totalCurtidasObraPublica(obra: ObraLocal) {
  const totalCapitulos = obra.capitulos.reduce(
    (total, capitulo) => total + normalizarContadorObraPublica(capitulo.totalCurtidas),
    0,
  );
  const totalObra = normalizarContadorObraPublica(obra.totalCurtidas);
  const totalLocal = obra.capitulos.filter((capitulo) => capitulo.curtiu).length;

  return Math.max(totalCapitulos + totalObra, totalLocal);
}

function totalComentariosObraPublica(obra: ObraLocal) {
  const totalCapitulos = obra.capitulos.reduce(
    (total, capitulo) => total + normalizarContadorObraPublica(capitulo.totalComentarios),
    0,
  );
  const totalLocal = obra.capitulos.filter((capitulo) => capitulo.comentario.trim()).length;

  return Math.max(totalCapitulos, totalLocal);
}

function totalVisualizacoesObraPublica(obra: ObraLocal) {
  const totalObra = normalizarContadorObraPublica(obra.visualizacoes);
  const totalLidosCapitulos = obra.capitulos.reduce(
    (total, capitulo) => total + normalizarContadorObraPublica(capitulo.totalLidos),
    0,
  );
  const totalLocal = obra.capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.max(totalObra, totalLidosCapitulos, totalLocal);
}

async function aplicarTotaisReaisObraPublica(obrasParaAtualizar: ObraLocal[]) {
  const capituloIds = Array.from(
    new Set(
      obrasParaAtualizar.flatMap((obra) =>
        obra.capitulos.map((capitulo) => capitulo.id.trim()).filter(Boolean),
      ),
    ),
  );
  const obraIds = Array.from(
    new Set(obrasParaAtualizar.map((obra) => obra.id.trim()).filter(Boolean)),
  );

  if (capituloIds.length === 0 && obraIds.length === 0) {
    return obrasParaAtualizar;
  }

  const [
    curtidasPorCapitulo,
    comentariosPorCapitulo,
    salvosPorCapitulo,
    lidosPorCapitulo,
    curtidasPorObra,
    favoritosPorObra,
    concluidasPorObra,
  ] = await Promise.all([
    contarRegistrosPorColunaObraPublica("curtidas_capitulos", "capitulo_id", capituloIds),
    contarRegistrosPorColunaObraPublica("comentarios_capitulos", "capitulo_id", capituloIds),
    contarRegistrosPorColunaObraPublica("salvos_capitulos", "capitulo_id", capituloIds),
    contarRegistrosPorColunaObraPublica("progresso_leitura", "capitulo_id", capituloIds),
    contarRegistrosPorColunaObraPublica("obra_curtidas", "obra_id", obraIds),
    contarRegistrosPorColunaObraPublica("favoritos", "obra_id", obraIds),
    contarRegistrosPorColunaObraPublica("concluidas", "obra_id", obraIds),
  ]);

  return obrasParaAtualizar.map((obra) => ({
    ...obra,
    totalCurtidas: curtidasPorObra.get(obra.id) || 0,
    totalFavoritos: favoritosPorObra.get(obra.id) || 0,
    totalConcluidas: concluidasPorObra.get(obra.id) || 0,
    capitulos: obra.capitulos.map((capitulo) => ({
      ...capitulo,
      totalCurtidas: curtidasPorCapitulo.get(capitulo.id) || 0,
      totalComentarios: comentariosPorCapitulo.get(capitulo.id) || 0,
      totalSalvos: salvosPorCapitulo.get(capitulo.id) || 0,
      totalLidos: lidosPorCapitulo.get(capitulo.id) || 0,
    })),
  }));
}


function converterObraLocalParaDinamica(obra: ObraLocal): ObraDinamica {
  const obraDisponivel = obra.publicado && (obra.capitulos.length > 0 || Boolean(obra.arquivoObra));

  return {
    id: obra.id,
    origem: "local",
    titulo: obra.titulo,
    autor: obra.autor,
    autorId: obra.autorId || "",
    genero: obra.genero,
    formato: obra.formato,
    classificacaoIndicativa: obra.classificacaoIndicativa,
    status: obra.publicado ? "Publicado" : "Rascunho",
    views: String(totalVisualizacoesObraPublica(obra)),
    likes: String(totalCurtidasObraPublica(obra)),
    comentarios: String(totalComentariosObraPublica(obra)),
    disponivel: obraDisponivel,
    slug: obra.slug,
    link: obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`,
    sinopse: obra.sinopse,
    tags: obra.tags,
    capa: obra.capa,
    arquivoObra: obra.arquivoObra || null,
    capitulos: obra.capitulos.map((capitulo, index) => ({
      id: capitulo.id,
      numero: String(index + 1).padStart(2, "0"),
      titulo: capitulo.titulo,
      descricao: "",
      href: `/obra/${encodeURIComponent(
        obra.slug || criarSlugBase(obra.titulo)
      )}/capitulo/${index + 1}`,
      disponivel: obraDisponivel,
    })),
  };
}

function criarCoverArtStyle(capa: string): CSSProperties {
  if (!capa) {
    return coverArtStyle;
  }

  return {
    ...coverArtStyle,
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center top",
  };
}

function criarDesktopCoverArtStyle(capa: string): CSSProperties {
  if (!capa) {
    return desktopCoverArtStyle;
  }

  return {
    ...desktopCoverArtStyle,
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}


function criarLinkPerfilAutor(autor: string, autorId?: string) {
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

function obterTextoPerfilObra(registro: Record<string, unknown>, chave: string) {
  const valor = registro[chave];

  return typeof valor === "string" && valor.trim() ? valor.trim() : "";
}

function obterNomePerfilObra(profile: Record<string, unknown> | null, fallback: string) {
  if (!profile) {
    return fallback.trim() || "Autor não informado";
  }

  return (
    obterTextoPerfilObra(profile, "nome") ||
    obterTextoPerfilObra(profile, "nome_usuario") ||
    obterTextoPerfilObra(profile, "username") ||
    obterTextoPerfilObra(profile, "display_name") ||
    obterTextoPerfilObra(profile, "apelido") ||
    fallback.trim() ||
    "Autor não informado"
  );
}

function obterAvatarPerfilObra(profile: Record<string, unknown> | null) {
  if (!profile) {
    return "";
  }

  return (
    obterTextoPerfilObra(profile, "avatar_url") ||
    obterTextoPerfilObra(profile, "avatar") ||
    obterTextoPerfilObra(profile, "foto_url") ||
    obterTextoPerfilObra(profile, "imagem_url") ||
    obterTextoPerfilObra(profile, "photo_url")
  );
}

function obterBioPerfilObra(profile: Record<string, unknown> | null) {
  if (!profile) {
    return "";
  }

  return (
    obterTextoPerfilObra(profile, "bio") ||
    obterTextoPerfilObra(profile, "sobre_bio") ||
    obterTextoPerfilObra(profile, "sobre") ||
    obterTextoPerfilObra(profile, "descricao")
  );
}

function normalizarPerfilPublicoObra(
  profile: Record<string, unknown> | null,
  userIdFallback: string,
  nomeFallback: string
): PerfilPublicoObra {
  return {
    userId:
      obterTextoPerfilObra(profile || {}, "user_id") ||
      obterTextoPerfilObra(profile || {}, "id") ||
      userIdFallback.trim(),
    nome: obterNomePerfilObra(profile, nomeFallback).slice(0, 80),
    avatar: obterAvatarPerfilObra(profile),
    bio: obterBioPerfilObra(profile).slice(0, 160),
  };
}

async function carregarPerfilPublicoObra(
  userId: string,
  nomeFallback: string
): Promise<PerfilPublicoObra | null> {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo || !idObraSupabaseValido(userIdLimpo)) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,user_id,nome,nome_usuario,username,display_name,apelido,avatar_url,avatar,foto_url,imagem_url,photo_url,bio,sobre_bio,sobre,descricao")
      .eq("user_id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (!error && data && typeof data === "object" && !Array.isArray(data)) {
      return normalizarPerfilPublicoObra(
        data as Record<string, unknown>,
        userIdLimpo,
        nomeFallback
      );
    }
  } catch {
    // Bases antigas podem usar id no lugar de user_id.
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,user_id,nome,nome_usuario,username,display_name,apelido,avatar_url,avatar,foto_url,imagem_url,photo_url,bio,sobre_bio,sobre,descricao")
      .eq("id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (!error && data && typeof data === "object" && !Array.isArray(data)) {
      return normalizarPerfilPublicoObra(
        data as Record<string, unknown>,
        userIdLimpo,
        nomeFallback
      );
    }
  } catch {
    // Profiles é camada social complementar; a página deve continuar abrindo.
  }

  return normalizarPerfilPublicoObra(null, userIdLimpo, nomeFallback);
}

function criarLinkComunidadeObra(titulo: string, tipo?: "Teoria" | "Review") {
  const params = new URLSearchParams();

  params.set("busca", titulo);

  if (tipo) {
    params.set("tipo", tipo);
  }

  return `/comunidade?${params.toString()}`;
}

function normalizarObraRelacionadaComunidade(valor: string) {
  return normalizarTexto(valor).replace(/\s+/g, " ");
}

function postComunidadePertenceAObra(post: SupabaseComunidadePostRow, titulo: string) {
  const obraPost = normalizarObraRelacionadaComunidade(post.obra_relacionada || "");
  const obraTitulo = normalizarObraRelacionadaComunidade(titulo);

  if (!obraPost || !obraTitulo) {
    return false;
  }

  return (
    obraPost === obraTitulo ||
    obraPost.includes(obraTitulo) ||
    obraTitulo.includes(obraPost)
  );
}

function obterNumeroMetrica(valor: string) {
  const valorNormalizado = valor.trim().toLowerCase().replace(",", ".");

  if (!valorNormalizado) {
    return 0;
  }

  const multiplicador = valorNormalizado.endsWith("k") ? 1000 : 1;
  const numero = Number.parseFloat(valorNormalizado.replace(/[^0-9.]/g, ""));

  return Number.isFinite(numero) ? Math.round(numero * multiplicador) : 0;
}

function criarMetricasBaseObra(obra: ObraDinamica | null): MetricasObraPublica {
  if (!obra) {
    return metricasObraVazias;
  }

  return {
    visualizacoes: obterNumeroMetrica(obra.views),
    curtidas: obterNumeroMetrica(obra.likes),
    comentarios: obterNumeroMetrica(obra.comentarios),
    seguidores: 0,
    curtidaAtiva: false,
    carregado: false,
  };
}

function obterChaveAvaliacaoObra(obra: ObraDinamica) {
  return obra.id || obra.slug || normalizarTexto(obra.titulo);
}

function obterChavesInteracaoObraPublica(obra: ObraDinamica) {
  return Array.from(
    new Set(
      [
        obra.id,
        obra.slug,
        obra.link,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ]
        .map((chave) => chave.trim())
        .filter(Boolean)
    )
  );
}

function carregarListaLocalObraPublica(chaveStorage: string, userId = "") {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [] as string[];
  }

  try {
    const texto = lerStorageUsuarioObraPublica(chaveStorage, userIdLimpo);
    const json: unknown = texto ? JSON.parse(texto) : [];

    return Array.isArray(json)
      ? json.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      : [];
  } catch {
    return [] as string[];
  }
}

function obraEstaEmListaLocalObraPublica(
  obra: ObraDinamica,
  chaveStorage: string,
  userId = ""
) {
  const chavesObra = new Set(obterChavesInteracaoObraPublica(obra));

  return carregarListaLocalObraPublica(chaveStorage, userId).some((item) =>
    chavesObra.has(item.trim())
  );
}

function salvarListaLocalObraPublica(
  obra: ObraDinamica,
  chaveStorage: string,
  ativo: boolean,
  userId = ""
) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [] as string[];
  }

  const listaAtual = carregarListaLocalObraPublica(chaveStorage, userIdLimpo);
  const chavesObra = obterChavesInteracaoObraPublica(obra);
  const chavesSet = new Set(chavesObra);
  const listaSemObra = listaAtual.filter((item) => !chavesSet.has(item.trim()));
  const proximaLista = ativo
    ? Array.from(new Set([...listaSemObra, ...chavesObra]))
    : listaSemObra;

  salvarStorageUsuarioObraPublica(chaveStorage, userIdLimpo, proximaLista);

  return proximaLista;
}

async function salvarRegistroObraPublicaSupabase(
  tabela: "favoritos" | "concluidas",
  userId: string,
  obraId: string,
  ativo: boolean
) {
  if (!userId || !obraId || !idObraSupabaseValido(obraId)) {
    return;
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
    return;
  }

  const { error: erroInsert } = await supabase.from(tabela).insert({
    user_id: userId,
    obra_id: obraId,
    visibilidade: "publico",
  });

  if (erroInsert) {
    throw erroInsert;
  }
}

async function salvarCurtidaObraPublicaSupabase(
  userId: string,
  obraId: string,
  ativo: boolean
) {
  if (!userId || !obraId || !idObraSupabaseValido(obraId)) {
    return;
  }

  const { error: erroDelete } = await supabase
    .from("obra_curtidas")
    .delete()
    .eq("obra_id", obraId)
    .eq("user_id", userId);

  if (erroDelete) {
    throw erroDelete;
  }

  if (!ativo) {
    return;
  }

  const tentativas: Array<Record<string, string>> = [
    {
      obra_id: obraId,
      user_id: userId,
      visibilidade: "publico",
    },
    {
      obra_id: obraId,
      user_id: userId,
    },
  ];

  let ultimoErro: unknown = null;

  for (const payload of tentativas) {
    const { error } = await supabase.from("obra_curtidas").insert(payload);

    if (!error) {
      return;
    }

    ultimoErro = error;
  }

  throw ultimoErro || new Error("Não foi possível salvar a curtida da obra.");
}

function carregarAvaliacoesLocais(userId = "") {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return {};
  }

  try {
    const avaliacoesTexto = lerStorageUsuarioObraPublica(
      RATED_WORKS_STORAGE_KEY,
      userIdLimpo
    );
    const avaliacoesJson: unknown = avaliacoesTexto
      ? JSON.parse(avaliacoesTexto)
      : {};

    if (
      !avaliacoesJson ||
      typeof avaliacoesJson !== "object" ||
      Array.isArray(avaliacoesJson)
    ) {
      return {};
    }

    return avaliacoesJson as Record<string, unknown>;
  } catch {
    return {};
  }
}

function obterAvaliacaoLocal(obra: ObraDinamica, userId = "") {
  const chaveAvaliacao = obterChaveAvaliacaoObra(obra);
  const avaliacoesLocais = carregarAvaliacoesLocais(userId);
  const nota = Number(avaliacoesLocais[chaveAvaliacao]);

  return Number.isFinite(nota) && nota >= 0.5 && nota <= 5
    ? Math.round(nota * 2) / 2
    : 0;
}

function salvarAvaliacaoLocal(obra: ObraDinamica, nota: number, userId = "") {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return;
  }

  try {
    const chaveAvaliacao = obterChaveAvaliacaoObra(obra);

    if (!chaveAvaliacao) {
      return;
    }

    const avaliacoesLocais = carregarAvaliacoesLocais(userIdLimpo);

    if (nota <= 0) {
      delete avaliacoesLocais[chaveAvaliacao];
    } else {
      avaliacoesLocais[chaveAvaliacao] = nota;
    }

    salvarStorageUsuarioObraPublica(
      RATED_WORKS_STORAGE_KEY,
      userIdLimpo,
      avaliacoesLocais
    );
  } catch {
    // Avaliação local é fallback e não deve travar a página.
  }
}

function formatarMediaAvaliacao(media: number) {
  if (!Number.isFinite(media) || media <= 0) {
    return "0.0";
  }

  return media.toFixed(1);
}

function formatarTotalAvaliacoes(total: number) {
  if (total <= 0) {
    return "avaliações";
  }

  return total === 1 ? "1 avaliação" : `${total} avaliações`;
}

function obterProximaNotaAvaliacao(estrela: number, notaAtual: number) {
  const meiaNota = estrela - 0.5;
  const notaNormalizada = Math.round(notaAtual * 2) / 2;

  if (notaNormalizada === meiaNota) {
    return estrela;
  }

  if (notaNormalizada === estrela) {
    return 0;
  }

  return meiaNota;
}

function obterPreenchimentoEstrela(estrela: number, notaAtual: number) {
  const notaNormalizada = Math.max(0, Math.min(5, Math.round(notaAtual * 2) / 2));

  if (notaNormalizada >= estrela) {
    return "100%";
  }

  if (notaNormalizada >= estrela - 0.5) {
    return "50%";
  }

  return "0%";
}

function calcularProximaAvaliacao(
  avaliacaoAtual: AvaliacaoObraPublica,
  novaNota: number
): AvaliacaoObraPublica {
  const notaAnterior = avaliacaoAtual.minhaNota;
  const totalAtual = avaliacaoAtual.total;
  const somaAtual = avaliacaoAtual.media * totalAtual;

  if (novaNota <= 0) {
    const totalNovo = notaAnterior > 0 ? Math.max(0, totalAtual - 1) : totalAtual;
    const somaNova = notaAnterior > 0 ? somaAtual - notaAnterior : somaAtual;

    return {
      ...avaliacaoAtual,
      media: totalNovo > 0 ? somaNova / totalNovo : 0,
      total: totalNovo,
      minhaNota: 0,
      carregado: true,
      salvando: false,
    };
  }

  const totalNovo = notaAnterior > 0 ? totalAtual : totalAtual + 1;
  const somaNova =
    notaAnterior > 0 ? somaAtual - notaAnterior + novaNota : somaAtual + novaNota;

  return {
    ...avaliacaoAtual,
    media: totalNovo > 0 ? somaNova / totalNovo : 0,
    total: totalNovo,
    minhaNota: novaNota,
    carregado: true,
    salvando: false,
  };
}

type DiarioAtividadeObraTipo =
  | "salvou_obra"
  | "favoritou_obra"
  | "concluiu_obra"
  | "avaliou_obra";

type DiarioAtividadeObraVisibilidade = "publico" | "parcial" | "privado";

async function removerAtividadeDiarioObra({
  userId,
  obra,
  tipo,
}: {
  userId: string;
  obra: ObraDinamica;
  tipo: DiarioAtividadeObraTipo;
}) {
  if (!userId || !obra.id || !idObraSupabaseValido(obra.id)) {
    return;
  }

  try {
    const { error } = await supabase
      .from("diario_atividades")
      .delete()
      .eq("user_id", userId)
      .eq("obra_id", obra.id)
      .eq("tipo", tipo);

    if (error) {
      console.warn("Não consegui remover atividade do Diário da obra:", error.message);
    }
  } catch (error) {
    console.warn("Não consegui acessar diario_atividades na obra:", error);
  }
}

async function registrarAtividadeDiarioObra({
  userId,
  obra,
  tipo,
  nota,
  texto,
  visibilidade,
}: {
  userId: string;
  obra: ObraDinamica;
  tipo: DiarioAtividadeObraTipo;
  nota?: number;
  texto?: string;
  visibilidade: DiarioAtividadeObraVisibilidade;
}) {
  if (!userId || !obra.id || !idObraSupabaseValido(obra.id)) {
    return;
  }

  const notaNormalizada =
    typeof nota === "number" && Number.isFinite(nota) && nota > 0
      ? Math.round(nota * 2) / 2
      : null;
  const payloadBase = {
    user_id: userId,
    tipo,
    obra_id: obra.id,
    texto: texto?.trim() || null,
    visibilidade,
    metadata: {
      origem: "obra_publica",
      titulo: obra.titulo,
      slug: obra.slug,
      autor: obra.autor,
      genero: obra.genero,
      formato: obra.formato,
    },
  };

  try {
    await removerAtividadeDiarioObra({
      userId,
      obra,
      tipo,
    });

    const { error } = await supabase.from("diario_atividades").insert({
      ...payloadBase,
      nota: notaNormalizada,
    });

    if (!error) {
      return;
    }

    const { error: erroFallback } = await supabase
      .from("diario_atividades")
      .insert(payloadBase);

    if (erroFallback) {
      console.warn("Não consegui registrar atividade do Diário da obra:", erroFallback.message);
    }
  } catch (error) {
    console.warn("Não consegui acessar diario_atividades na obra:", error);
  }
}

export default function ObraDinamicaPage() {
  const router = useRouter();
  const params = useParams<{ slug?: string | string[] }>();

  const slug = useMemo(() => {
    const parametro = params?.slug;

    if (Array.isArray(parametro)) {
      return parametro[0] || "";
    }

    return parametro || "";
  }, [params]);

  const [obrasLocais, setObrasLocais] = useState<ObraLocal[]>([]);
  const [carregandoObras, setCarregandoObras] = useState(true);
  const [obraSeguida, setObraSeguida] = useState(false);
  const [obraFavoritada, setObraFavoritada] = useState(false);
  const [obraConcluida, setObraConcluida] = useState(false);
  const [metricasObra, setMetricasObra] =
    useState<MetricasObraPublica>(metricasObraVazias);
  const [metricasComunidadeObra, setMetricasComunidadeObra] =
    useState<MetricasComunidadeObra>(metricasComunidadeObraVazias);
  const [avaliacaoObra, setAvaliacaoObra] =
    useState<AvaliacaoObraPublica>(avaliacaoObraVazia);
  const [perfilAutorObra, setPerfilAutorObra] =
    useState<PerfilPublicoObra | null>(null);
  const [mensagemAcao, setMensagemAcao] = useState("");
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [acoesObraAbertas, setAcoesObraAbertas] = useState(false);
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { notificacoesNaoLidas } = useNotificacoes();
  const visualizacaoRegistradaRef = useRef("");

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

    async function carregarObraPublica() {
      window.setTimeout(() => {
        if (!cancelado) {
          setCarregandoObras(true);
        }
      }, 0);

      try {
        const obrasNormalizadas = carregarObrasLocaisComBackup(usuarioIdLogado);

        window.setTimeout(() => {
          if (!cancelado) {
            setObrasLocais(obrasNormalizadas);
          }
        }, 0);

        const obrasComSupabase = await carregarObraSupabasePorSlug(
          slug,
          obrasNormalizadas,
          usuarioIdLogado
        );

        window.setTimeout(() => {
          if (!cancelado) {
            setObrasLocais(obrasComSupabase);
          }
        }, 0);
      } catch {
        window.setTimeout(() => {
          if (!cancelado) {
            setObrasLocais([]);
          }
        }, 0);
      } finally {
        window.setTimeout(() => {
          if (!cancelado) {
            setCarregandoObras(false);
          }
        }, 0);
      }
    }

    void carregarObraPublica();

    return () => {
      cancelado = true;
    };
  }, [slug, usuarioIdLogado]);

  const obra = useMemo<ObraDinamica | null>(() => {
    const obraLocal = obrasLocais.find((item) => {
      return item.slug === slug || criarSlugBase(item.titulo) === slug;
    });

    if (obraLocal) {
      return converterObraLocalParaDinamica(obraLocal);
    }

    return null;
  }, [slug, obrasLocais]);

  useEffect(() => {
    let cancelado = false;

    async function carregarPerfilAutorDaObra() {
      if (!obra?.autorId) {
        window.setTimeout(() => {
          if (!cancelado) {
            setPerfilAutorObra(null);
          }
        }, 0);
        return;
      }

      const perfilAutor = await carregarPerfilPublicoObra(
        obra.autorId,
        obra.autor
      );

      window.setTimeout(() => {
        if (!cancelado) {
          setPerfilAutorObra(perfilAutor);
        }
      }, 0);
    }

    void carregarPerfilAutorDaObra();

    return () => {
      cancelado = true;
    };
  }, [obra?.autorId, obra?.autor]);

  const obraNormalizada = obra ? normalizarTexto(obra.titulo) : ""; 
  const generoObraFormatado = obra
    ? formatarGeneroObraPublica(obra.genero)
    : "Não informado";
  const autorObraNome = perfilAutorObra?.nome || obra?.autor || "Autor não informado";
  const autorObraId = perfilAutorObra?.userId || obra?.autorId || "";
  const obraDisponivel = Boolean(obra?.disponivel);
  const sinopseObraMenu =
    obra &&
    obra.sinopse.trim() &&
    normalizarTexto(obra.sinopse) !== "nenhuma sinopse informada"
      ? obra.sinopse.trim()
      : "";

  const capitulosDaObra = useMemo<CapituloDinamico[]>(() => {
    if (!obra) {
      return [];
    }

    if (obra.capitulos.length > 0) {
      return obra.capitulos;
    }

    return [];
  }, [obra]);

  useEffect(() => {
    if (!obraNormalizada) {
      return;
    }

    try {
      const obrasSeguidasTexto = lerStorageUsuarioObraPublica(
        FOLLOWED_WORKS_STORAGE_KEY,
        usuarioIdLogado
      );
      const obrasSeguidasJson: unknown = obrasSeguidasTexto
        ? JSON.parse(obrasSeguidasTexto)
        : [];

      const obrasSeguidas = Array.isArray(obrasSeguidasJson)
        ? obrasSeguidasJson.filter(
            (titulo): titulo is string =>
              typeof titulo === "string" && Boolean(titulo.trim())
          )
        : [];
      const seguida = obrasSeguidas.includes(obraNormalizada);

      window.setTimeout(() => {
        setObraSeguida(seguida);
      }, 0);
    } catch {
      window.setTimeout(() => {
        setObraSeguida(false);
      }, 0);
    }
  }, [obraNormalizada, usuarioIdLogado]);

  useEffect(() => {
    if (!obra) {
      const resetColecoesTimer = window.setTimeout(() => {
        setObraFavoritada(false);
        setObraConcluida(false);
      }, 0);

      return () => {
        window.clearTimeout(resetColecoesTimer);
      };
    }

    let cancelado = false;
    const obraAtual = obra;
    const estadoFavoritadaLocal = obraEstaEmListaLocalObraPublica(
      obraAtual,
      FAVORITES_STORAGE_KEY,
      usuarioIdLogado
    );
    const estadoConcluidaLocal = obraEstaEmListaLocalObraPublica(
      obraAtual,
      COMPLETED_STORAGE_KEY,
      usuarioIdLogado
    );

    const aplicarEstadoColecoesTimer = window.setTimeout(() => {
      if (!cancelado) {
        setObraFavoritada(estadoFavoritadaLocal);
        setObraConcluida(estadoConcluidaLocal);
      }
    }, 0);

    if (!obraAtual.id || !idObraSupabaseValido(obraAtual.id)) {
      return () => {
        cancelado = true;
        window.clearTimeout(aplicarEstadoColecoesTimer);
      };
    }

    async function carregarEstadoSocialObra() {
      try {
        const { data: usuarioData } = await supabase.auth.getUser();
        const userId = usuarioData.user?.id || "";

        if (!userId) {
          return;
        }

        const [{ data: favoritoData }, { data: concluidaData }] = await Promise.all([
          supabase
            .from("favoritos")
            .select("obra_id")
            .eq("user_id", userId)
            .eq("obra_id", obraAtual.id)
            .limit(1)
            .maybeSingle(),
          supabase
            .from("concluidas")
            .select("obra_id")
            .eq("user_id", userId)
            .eq("obra_id", obraAtual.id)
            .limit(1)
            .maybeSingle(),
        ]);

        if (cancelado) {
          return;
        }

        setObraFavoritada(Boolean(favoritoData));
        setObraConcluida(Boolean(concluidaData));
      } catch {
        // Mantém o estado local como fallback.
      }
    }

    void carregarEstadoSocialObra();

    return () => {
      cancelado = true;
      window.clearTimeout(aplicarEstadoColecoesTimer);
    };
  }, [obra?.id, obra?.slug, obraNormalizada, usuarioIdLogado]);

  useEffect(() => {
    if (!obra) {
      const resetMetricasTimer = window.setTimeout(() => {
        setMetricasObra(metricasObraVazias);
      }, 0);

      return () => {
        window.clearTimeout(resetMetricasTimer);
      };
    }

    const obraAtual = obra;
    const obraId = obraAtual.id;
    const metricasBase = criarMetricasBaseObra(obraAtual);
    const chaveMetricaObra =
      obraId || obraAtual.slug || obraNormalizada || normalizarTexto(obraAtual.titulo);
    let visualizacoesLocais = metricasBase.visualizacoes;
    let curtidaLocalAtiva = false;
    let seguindoLocalAtivo = false;

    try {
      const visualizacoesTexto = lerStorageUsuarioObraPublica(
        VIEWED_WORKS_STORAGE_KEY,
        usuarioIdLogado
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
      const visualizacoesAtuais = obterNumeroSeguro(
        visualizacoesPorObra[chaveMetricaObra],
        metricasBase.visualizacoes
      );
      const jaRegistrouVisualizacao =
        visualizacaoRegistradaRef.current === chaveMetricaObra;
      const proximasVisualizacoes = jaRegistrouVisualizacao
        ? visualizacoesAtuais
        : visualizacoesAtuais + 1;

      if (!jaRegistrouVisualizacao) {
        salvarStorageUsuarioObraPublica(
          VIEWED_WORKS_STORAGE_KEY,
          usuarioIdLogado,
          {
            ...visualizacoesPorObra,
            [chaveMetricaObra]: proximasVisualizacoes,
          }
        );
        visualizacaoRegistradaRef.current = chaveMetricaObra;
      }

      visualizacoesLocais = Math.max(
        metricasBase.visualizacoes,
        proximasVisualizacoes
      );
    } catch {
      visualizacoesLocais = metricasBase.visualizacoes;
    }

    try {
      const curtidasTexto = lerStorageUsuarioObraPublica(
        LIKED_WORKS_STORAGE_KEY,
        usuarioIdLogado
      );
      const curtidasJson: unknown = curtidasTexto ? JSON.parse(curtidasTexto) : [];
      const obrasCurtidas = Array.isArray(curtidasJson)
        ? curtidasJson.filter(
            (titulo): titulo is string =>
              typeof titulo === "string" && Boolean(titulo.trim())
          )
        : [];

      curtidaLocalAtiva = obrasCurtidas.includes(obraNormalizada);
    } catch {
      curtidaLocalAtiva = false;
    }

    try {
      const seguidasTexto = lerStorageUsuarioObraPublica(
        FOLLOWED_WORKS_STORAGE_KEY,
        usuarioIdLogado
      );
      const seguidasJson: unknown = seguidasTexto ? JSON.parse(seguidasTexto) : [];
      const obrasSeguidas = Array.isArray(seguidasJson)
        ? seguidasJson.filter(
            (titulo): titulo is string =>
              typeof titulo === "string" && Boolean(titulo.trim())
          )
        : [];

      seguindoLocalAtivo = obrasSeguidas.includes(obraNormalizada);
    } catch {
      seguindoLocalAtivo = false;
    }

    const aplicarMetricasLocaisTimer = window.setTimeout(() => {
      setObraSeguida(seguindoLocalAtivo);
      setMetricasObra({
        ...metricasBase,
        visualizacoes: visualizacoesLocais,
        curtidaAtiva: curtidaLocalAtiva,
        curtidas: metricasBase.curtidas + (curtidaLocalAtiva ? 1 : 0),
        seguidores: seguindoLocalAtivo ? 1 : metricasBase.seguidores,
        carregado: true,
      });
    }, 0);

    if (obraAtual.origem !== "local" || !obraId || !idObraSupabaseValido(obraId)) {
      return () => {
        window.clearTimeout(aplicarMetricasLocaisTimer);
      };
    }

    let cancelado = false;

    async function carregarMetricasReaisObra() {
      try {
        const { data: usuarioData } = await supabase.auth.getUser();
        const userId = usuarioData.user?.id || "";

        const { data: obraMetricas } = await supabase
          .from("obras")
          .select("visualizacoes")
          .eq("id", obraId)
          .limit(1)
          .maybeSingle();

        let visualizacoes = obterNumeroSeguro(
          (obraMetricas as { visualizacoes?: number } | null)?.visualizacoes,
          metricasBase.visualizacoes
        );

        const chaveVisualizacao = `supabase-${obraId}`;
        const jaContouVisualizacao =
          visualizacaoRegistradaRef.current === chaveVisualizacao;

        if (!jaContouVisualizacao) {
          const proximaVisualizacao = visualizacoes + 1;

          const { error: erroRpc } = await supabase.rpc(
            "incrementar_visualizacao_obra",
            { obra_id_param: obraId }
          );

          if (erroRpc) {
            await supabase
              .from("obras")
              .update({ visualizacoes: proximaVisualizacao })
              .eq("id", obraId);
          }

          visualizacaoRegistradaRef.current = chaveVisualizacao;
          visualizacoes = proximaVisualizacao;
        }

        const [{ count: totalCurtidasObra }, { count: totalSeguidores }] =
          await Promise.all([
            supabase
              .from("obra_curtidas")
              .select("id", { count: "exact", head: true })
              .eq("obra_id", obraId),
            supabase
              .from("seguindo_obras")
              .select("id", { count: "exact", head: true })
              .eq("obra_id", obraId),
          ]);

        let totalCurtidasCapitulos = 0;
        let totalComentarios = metricasBase.comentarios;
        const idsCapitulos = capitulosDaObra
          .map((capitulo) => capitulo.id)
          .filter(Boolean);

        if (idsCapitulos.length > 0) {
          const [{ count: curtidasCapitulosCount }, { count: comentariosCount }] =
            await Promise.all([
              supabase
                .from("curtidas_capitulos")
                .select("id", { count: "exact", head: true })
                .in("capitulo_id", idsCapitulos),
              supabase
                .from("comentarios_capitulos")
                .select("id", { count: "exact", head: true })
                .in("capitulo_id", idsCapitulos),
            ]);

          totalCurtidasCapitulos = curtidasCapitulosCount ?? 0;
          totalComentarios = comentariosCount ?? totalComentarios;
        }

        const totalCurtidas =
          (totalCurtidasObra ?? 0) + totalCurtidasCapitulos;

        let curtidaAtiva = false;
        let seguindoAtivo = false;

        try {
          const obrasSeguidasTexto = lerStorageUsuarioObraPublica(
            FOLLOWED_WORKS_STORAGE_KEY,
            usuarioIdLogado
          );
          const obrasSeguidasJson: unknown = obrasSeguidasTexto
            ? JSON.parse(obrasSeguidasTexto)
            : [];
          const obrasSeguidas = Array.isArray(obrasSeguidasJson)
            ? obrasSeguidasJson.filter(
                (titulo): titulo is string =>
                  typeof titulo === "string" && Boolean(titulo.trim())
              )
            : [];

          seguindoAtivo = obrasSeguidas.includes(obraNormalizada);
        } catch {
          seguindoAtivo = false;
        }

        if (userId) {
          const [{ data: curtidaUsuario }, { data: seguidorUsuario }] =
            await Promise.all([
              supabase
                .from("obra_curtidas")
                .select("id")
                .eq("obra_id", obraId)
                .eq("user_id", userId)
                .limit(1)
                .maybeSingle(),
              supabase
                .from("seguindo_obras")
                .select("id")
                .eq("obra_id", obraId)
                .eq("user_id", userId)
                .limit(1)
                .maybeSingle(),
            ]);

          curtidaAtiva = Boolean(curtidaUsuario);
          seguindoAtivo = Boolean(seguidorUsuario) || seguindoAtivo;
        }

        if (cancelado) {
          return;
        }

        setObraSeguida(seguindoAtivo);
        setMetricasObra({
          visualizacoes,
          curtidas: totalCurtidas ?? metricasBase.curtidas,
          comentarios: totalComentarios,
          seguidores: totalSeguidores ?? metricasBase.seguidores,
          curtidaAtiva,
          carregado: true,
        });
      } catch {
        if (!cancelado) {
          setMetricasObra((metricasAtuais) => ({
            ...metricasAtuais,
            carregado: true,
          }));
        }
      }
    }

    void carregarMetricasReaisObra();

    return () => {
      cancelado = true;
      window.clearTimeout(aplicarMetricasLocaisTimer);
    };
  }, [obra, capitulosDaObra, obraNormalizada, usuarioIdLogado]);

  useEffect(() => {
    if (!obra) {
      const resetComunidadeTimer = window.setTimeout(() => {
        setMetricasComunidadeObra(metricasComunidadeObraVazias);
      }, 0);

      return () => {
        window.clearTimeout(resetComunidadeTimer);
      };
    }

    let cancelado = false;
    const tituloObra = obra.titulo;

    async function carregarMetricasComunidadeObra() {
      try {
        const { data: postsData, error: erroPosts } = await supabase
          .from("comunidade_posts")
          .select("id, tipo_publicacao, obra_relacionada")
          .not("obra_relacionada", "is", null)
          .limit(200);

        if (erroPosts || !Array.isArray(postsData)) {
          throw erroPosts;
        }

        const postsRelacionados = (
          postsData as unknown as SupabaseComunidadePostRow[]
        ).filter((post) => postComunidadePertenceAObra(post, tituloObra));
        const postIds = postsRelacionados.map((post) => post.id).filter(Boolean);

        let totalComentariosComunidade = 0;
        let totalCurtidasComunidade = 0;

        if (postIds.length > 0) {
          const [{ count: comentariosCount }, { count: curtidasCount }] =
            await Promise.all([
              supabase
                .from("comunidade_comentarios")
                .select("id", { count: "exact", head: true })
                .in("post_id", postIds),
              supabase
                .from("comunidade_curtidas")
                .select("post_id", { count: "exact", head: true })
                .in("post_id", postIds),
            ]);

          totalComentariosComunidade = comentariosCount ?? 0;
          totalCurtidasComunidade = curtidasCount ?? 0;
        }

        if (cancelado) {
          return;
        }

        setMetricasComunidadeObra({
          teorias: postsRelacionados.filter(
            (post) => post.tipo_publicacao === "Teoria"
          ).length,
          reviews: postsRelacionados.filter(
            (post) => post.tipo_publicacao === "Review"
          ).length,
          interacoes:
            postsRelacionados.length +
            totalComentariosComunidade +
            totalCurtidasComunidade,
          carregado: true,
        });
      } catch {
        if (!cancelado) {
          setMetricasComunidadeObra({
            ...metricasComunidadeObraVazias,
            carregado: true,
          });
        }
      }
    }

    void carregarMetricasComunidadeObra();

    return () => {
      cancelado = true;
    };
  }, [obra?.titulo]);

  useEffect(() => {
    if (!obra) {
      const resetAvaliacaoTimer = window.setTimeout(() => {
        setAvaliacaoObra(avaliacaoObraVazia);
      }, 0);

      return () => {
        window.clearTimeout(resetAvaliacaoTimer);
      };
    }

    const obraAtual = obra;
    const notaLocal = obterAvaliacaoLocal(obraAtual, usuarioIdLogado);

    const aplicarAvaliacaoLocalTimer = window.setTimeout(() => {
      setAvaliacaoObra({
        media: notaLocal > 0 ? notaLocal : 0,
        total: notaLocal > 0 ? 1 : 0,
        minhaNota: notaLocal,
        carregado: true,
        salvando: false,
      });
    }, 0);

    if (!obraAtual.id || !idObraSupabaseValido(obraAtual.id)) {
      return () => {
        window.clearTimeout(aplicarAvaliacaoLocalTimer);
      };
    }

    let cancelado = false;

    async function carregarAvaliacaoRealObra() {
      try {
        const { data: usuarioData } = await supabase.auth.getUser();
        const userId = usuarioData.user?.id || "";

        const { data: avaliacoesData, error: erroAvaliacoes } = await supabase
          .from("obra_avaliacoes")
          .select("nota")
          .eq("obra_id", obraAtual.id)
          .limit(1000);

        if (erroAvaliacoes || !Array.isArray(avaliacoesData)) {
          return;
        }

        const notas = avaliacoesData
          .map((avaliacao) => Number((avaliacao as { nota?: unknown }).nota))
          .filter((nota) => Number.isFinite(nota) && nota >= 0.5 && nota <= 5);
        const total = notas.length;
        const media =
          total > 0
            ? notas.reduce((soma, nota) => soma + nota, 0) / total
            : 0;
        let minhaNota = notaLocal;

        if (userId) {
          const { data: minhaAvaliacao } = await supabase
            .from("obra_avaliacoes")
            .select("nota")
            .eq("obra_id", obraAtual.id)
            .eq("user_id", userId)
            .limit(1)
            .maybeSingle();

          const notaUsuario = Number(
            (minhaAvaliacao as { nota?: unknown } | null)?.nota
          );

          if (Number.isFinite(notaUsuario) && notaUsuario >= 0.5 && notaUsuario <= 5) {
            minhaNota = Math.round(notaUsuario * 2) / 2;
          }
        }

        if (cancelado) {
          return;
        }

        setAvaliacaoObra({
          media,
          total,
          minhaNota,
          carregado: true,
          salvando: false,
        });
      } catch {
        if (!cancelado) {
          setAvaliacaoObra((avaliacaoAtual) => ({
            ...avaliacaoAtual,
            carregado: true,
            salvando: false,
          }));
        }
      }
    }

    void carregarAvaliacaoRealObra();

    return () => {
      cancelado = true;
      window.clearTimeout(aplicarAvaliacaoLocalTimer);
    };
  }, [obra?.id, obra?.slug, obraNormalizada, usuarioIdLogado]);

  async function obterUsuarioLogadoParaAcao(mensagem: string) {
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id || "";

      if (!userId) {
        setMensagemAcao(mensagem);
        router.push(await criarLoginHrefObraPublica());
        return "";
      }

      return userId;
    } catch {
      setMensagemAcao(mensagem);
      router.push(await criarLoginHrefObraPublica());
      return "";
    }
  }

  async function alternarSeguirObra() {
    if (!obraNormalizada) {
      return;
    }

    const userId = await obterUsuarioLogadoParaAcao(
      "Entre na sua conta para seguir esta obra."
    );

    if (!userId) {
      return;
    }

    const seguindo = !obraSeguida;
    const obraAtual = obra;
    const seguidoresDelta = seguindo ? 1 : -1;

    try {
      const obrasSeguidasTexto = lerStorageUsuarioObraPublica(
        FOLLOWED_WORKS_STORAGE_KEY,
        userId
      );
      const obrasSeguidasJson: unknown = obrasSeguidasTexto
        ? JSON.parse(obrasSeguidasTexto)
        : [];

      const obrasSeguidas = Array.isArray(obrasSeguidasJson)
        ? obrasSeguidasJson.filter(
            (titulo): titulo is string =>
              typeof titulo === "string" && Boolean(titulo.trim())
          )
        : [];

      const chavesObraAtual = Array.from(
        new Set(
          [
            obraNormalizada,
            obraAtual?.id || "",
            obraAtual?.slug || "",
            obraAtual?.link || "",
          ].filter((chave) => Boolean(chave.trim()))
        )
      );

      const novasObrasSeguidas = seguindo
        ? Array.from(new Set([...obrasSeguidas, ...chavesObraAtual]))
        : obrasSeguidas.filter((titulo) => !chavesObraAtual.includes(titulo));

      salvarStorageUsuarioObraPublica(
        FOLLOWED_WORKS_STORAGE_KEY,
        userId,
        novasObrasSeguidas
      );

      setObraSeguida(seguindo);
      setMetricasObra((metricasAtuais) => ({
        ...metricasAtuais,
        seguidores: Math.max(0, metricasAtuais.seguidores + seguidoresDelta),
      }));
      setMensagemAcao("");

      if (
        !obraAtual ||
        obraAtual.origem !== "local" ||
        !obraAtual.id ||
        !idObraSupabaseValido(obraAtual.id)
      ) {
        return;
      }

      const obraId = obraAtual.id;

      const removerResposta = await supabase
        .from("seguindo_obras")
        .delete()
        .eq("obra_id", obraId)
        .eq("user_id", userId);

      if (removerResposta.error) {
        throw removerResposta.error;
      }

      if (seguindo) {
        const inserirResposta = await supabase.from("seguindo_obras").insert({
          obra_id: obraId,
          user_id: userId,
          visibilidade: "publico",
        });

        if (inserirResposta.error) {
          throw inserirResposta.error;
        }

        await registrarAtividadeDiarioObra({
          userId,
          obra: obraAtual,
          tipo: "salvou_obra",
          visibilidade: "publico",
          texto: `Adicionou ${obraAtual.titulo} para acompanhar.`,
        });
      } else {
        await removerAtividadeDiarioObra({
          userId,
          obra: obraAtual,
          tipo: "salvou_obra",
        });
      }
    } catch (error) {
      console.warn("Não consegui salvar seguimento da obra no Supabase:", error);
      setMensagemAcao(
        seguindo
          ? "Obra salva no navegador. Verifique o Supabase/RLS se não sincronizar online."
          : "Obra removida da lista no navegador. Verifique o Supabase/RLS se voltar depois."
      );
    }
  }

  async function alternarCurtidaObra() {
    if (!obraNormalizada) {
      return;
    }

    const userId = await obterUsuarioLogadoParaAcao(
      "Entre na sua conta para curtir esta obra."
    );

    if (!userId) {
      return;
    }

    const proximaCurtidaAtiva = !metricasObra.curtidaAtiva;

    setMetricasObra((metricasAtuais) => ({
      ...metricasAtuais,
      curtidaAtiva: proximaCurtidaAtiva,
      curtidas: Math.max(
        0,
        metricasAtuais.curtidas + (proximaCurtidaAtiva ? 1 : -1)
      ),
    }));
    setMensagemAcao("");

    if (!obra || obra.origem !== "local" || !obra.id || !idObraSupabaseValido(obra.id)) {
      try {
        const curtidasTexto = lerStorageUsuarioObraPublica(
        LIKED_WORKS_STORAGE_KEY,
        usuarioIdLogado
      );
        const curtidasJson: unknown = curtidasTexto ? JSON.parse(curtidasTexto) : [];
        const obrasCurtidas = Array.isArray(curtidasJson)
          ? curtidasJson.filter(
              (titulo): titulo is string =>
                typeof titulo === "string" && Boolean(titulo.trim())
            )
          : [];

        const novasObrasCurtidas = proximaCurtidaAtiva
          ? Array.from(new Set([...obrasCurtidas, obraNormalizada]))
          : obrasCurtidas.filter((titulo) => titulo !== obraNormalizada);

        salvarStorageUsuarioObraPublica(
          LIKED_WORKS_STORAGE_KEY,
          userId,
          novasObrasCurtidas
        );
      } catch {
        setMetricasObra((metricasAtuais) => ({
          ...metricasAtuais,
          curtidaAtiva: !proximaCurtidaAtiva,
          curtidas: Math.max(
            0,
            metricasAtuais.curtidas + (proximaCurtidaAtiva ? -1 : 1)
          ),
        }));
        setMensagemAcao("Não foi possível salvar a curtida agora.");
      }

      return;
    }

    const obraId = obra.id;

    try {
      await salvarCurtidaObraPublicaSupabase(
        userId,
        obraId,
        proximaCurtidaAtiva
      );

      setMensagemAcao("");
    } catch {
      setMetricasObra((metricasAtuais) => ({
        ...metricasAtuais,
        curtidaAtiva: !proximaCurtidaAtiva,
        curtidas: Math.max(
          0,
          metricasAtuais.curtidas + (proximaCurtidaAtiva ? -1 : 1)
        ),
      }));
      setMensagemAcao("Não foi possível salvar a curtida agora.");
    }
  }

  async function alternarFavoritoObra() {
    if (!obra) {
      return;
    }

    const userId = await obterUsuarioLogadoParaAcao(
      "Entre na sua conta para salvar esta obra."
    );

    if (!userId) {
      return;
    }

    const proximoFavorito = !obraFavoritada;
    const favoritoAnterior = obraFavoritada;

    setObraFavoritada(proximoFavorito);
    salvarListaLocalObraPublica(
      obra,
      FAVORITES_STORAGE_KEY,
      proximoFavorito,
      userId
    );
    setMensagemAcao("");

    try {
      if (obra.id && idObraSupabaseValido(obra.id)) {
        await salvarRegistroObraPublicaSupabase(
          "favoritos",
          userId,
          obra.id,
          proximoFavorito
        );
      }

      if (proximoFavorito) {
        await registrarAtividadeDiarioObra({
          userId,
          obra,
          tipo: "favoritou_obra",
          visibilidade: "parcial",
          texto: `Adicionou ${obra.titulo} à lista.`,
        });
      } else {
        await removerAtividadeDiarioObra({
          userId,
          obra,
          tipo: "favoritou_obra",
        });
      }

      setMensagemAcao(
        proximoFavorito ? "" : "Obra removida da lista."
      );
    } catch (error) {
      console.warn("Não consegui salvar favorito da obra:", error);
      setObraFavoritada(favoritoAnterior);
      salvarListaLocalObraPublica(
        obra,
        FAVORITES_STORAGE_KEY,
        favoritoAnterior,
        userId
      );
      setMensagemAcao("Não foi possível salvar na lista agora.");
    }
  }

  async function alternarConcluirObra() {
    if (!obra) {
      return;
    }

    const userId = await obterUsuarioLogadoParaAcao(
      "Entre na sua conta para marcar esta obra como concluída."
    );

    if (!userId) {
      return;
    }

    const proximaConcluida = !obraConcluida;
    const concluidaAnterior = obraConcluida;

    setObraConcluida(proximaConcluida);
    salvarListaLocalObraPublica(
      obra,
      COMPLETED_STORAGE_KEY,
      proximaConcluida,
      userId
    );
    setMensagemAcao("");

    try {
      if (obra.id && idObraSupabaseValido(obra.id)) {
        await salvarRegistroObraPublicaSupabase(
          "concluidas",
          userId,
          obra.id,
          proximaConcluida
        );
      }

      if (proximaConcluida) {
        await registrarAtividadeDiarioObra({
          userId,
          obra,
          tipo: "concluiu_obra",
          visibilidade: "parcial",
          texto: `Concluiu ${obra.titulo}.`,
        });
      } else {
        await removerAtividadeDiarioObra({
          userId,
          obra,
          tipo: "concluiu_obra",
        });
      }

      setMensagemAcao(
        proximaConcluida ? "Obra marcada como concluída." : "Obra removida das concluídas."
      );
    } catch (error) {
      console.warn("Não consegui salvar conclusão da obra:", error);
      setObraConcluida(concluidaAnterior);
      salvarListaLocalObraPublica(
        obra,
        COMPLETED_STORAGE_KEY,
        concluidaAnterior,
        userId
      );
      setMensagemAcao("Não foi possível marcar como concluída agora.");
    }
  }

  async function avaliarObra(nota: number) {
    if (!obra || nota < 0 || nota > 5) {
      return;
    }

    const userId = await obterUsuarioLogadoParaAcao(
      "Entre na sua conta para avaliar esta obra."
    );

    if (!userId) {
      return;
    }

    const notaNormalizada = nota <= 0 ? 0 : Math.round(nota * 2) / 2;

    const proximaAvaliacao = calcularProximaAvaliacao(
      avaliacaoObra,
      notaNormalizada
    );

    setAvaliacaoObra(proximaAvaliacao);
    setMensagemAcao("");
    salvarAvaliacaoLocal(obra, notaNormalizada, userId);

    if (!obra.id || !idObraSupabaseValido(obra.id)) {
      setAvaliacaoObra((avaliacaoAtual) => ({
        ...avaliacaoAtual,
        salvando: false,
      }));
      return;
    }

    try {
      const resposta =
        notaNormalizada > 0
          ? await supabase.from("obra_avaliacoes").upsert(
              {
                obra_id: obra.id,
                user_id: userId,
                nota: notaNormalizada,
                atualizado_em: new Date().toISOString(),
              },
              { onConflict: "obra_id,user_id" }
            )
          : await supabase
              .from("obra_avaliacoes")
              .delete()
              .eq("obra_id", obra.id)
              .eq("user_id", userId);

      if (resposta.error) {
        throw resposta.error;
      }

      if (notaNormalizada > 0) {
        await registrarAtividadeDiarioObra({
          userId,
          obra,
          tipo: "avaliou_obra",
          nota: notaNormalizada,
          visibilidade: "publico",
          texto: `Avaliou ${obra.titulo} com ${notaNormalizada.toFixed(1).replace(".", ",")} estrelas.`,
        });
      } else {
        await removerAtividadeDiarioObra({
          userId,
          obra,
          tipo: "avaliou_obra",
        });
      }

      setAvaliacaoObra((avaliacaoAtual) => ({
        ...avaliacaoAtual,
        salvando: false,
      }));
      setMensagemAcao("");
    } catch {
      setAvaliacaoObra((avaliacaoAtual) => ({
        ...avaliacaoAtual,
        carregado: true,
        salvando: false,
      }));
      setMensagemAcao("");
    }
  }

  async function copiarLinkAtual() {
    const linkAtual = window.location.href;

    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(linkAtual);
        } catch {
          copiarTextoComFallback(linkAtual);
        }
      } else {
        copiarTextoComFallback(linkAtual);
      }

      setLinkCopiado(true);

      window.setTimeout(() => {
        setLinkCopiado(false);
      }, 1800);
    } catch {
      setLinkCopiado(false);
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

  const hrefPrincipalObra = obra
    ? capitulosDaObra.find((capitulo) => capitulo.disponivel)?.href ||
      obra.link ||
      `/obra/${obra.slug}`
    : "/explorar";

  const resumoAvaliacaoCabecalho = (
    <div style={ratingSummaryStyle}>
      <strong style={ratingNumberStyle}>
        {formatarMediaAvaliacao(avaliacaoObra.media)}
      </strong>
      <span
        style={ratingStarsStyle}
        aria-label={`Média ${formatarMediaAvaliacao(
          avaliacaoObra.media
        )} de 5`}
      >
        {NOTAS_AVALIACAO_OBRA.map((estrela) => (
          <span
            key={`media-obra-${estrela}`}
            style={ratingTopStarVisualStyle}
            aria-hidden="true"
          >
            <span style={ratingTopStarBaseStyle}>★</span>
            <span
              style={{
                ...ratingTopStarFillStyle,
                width: obterPreenchimentoEstrela(
                  estrela,
                  avaliacaoObra.media
                ),
              }}
            >
              ★
            </span>
          </span>
        ))}
      </span>
      <span style={ratingTotalStyle}>
        {formatarTotalAvaliacoes(avaliacaoObra.total)}
      </span>
    </div>
  );

  if (carregandoObras && !obra) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${obraPageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      </main>
    );
  }

  if (!obra) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${obraPageCss}`}</style>

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

  if (!obraDisponivel) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${obraPageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      </main>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${obraPageCss}`}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <section style={isDesktop ? desktopHeroStyle : heroStyle}>
          <header
            style={isDesktop ? desktopHeroTopOverlayStyle : heroTopOverlayStyle}
          >
            <Link href="/" style={heroLogoStyle} aria-label="Historietas">
              <span style={logoMarkStyle}>H</span>
            </Link>

            {isDesktop ? (
              <div style={desktopHeaderRightStyle}>
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

                {resumoAvaliacaoCabecalho}
              </div>
            ) : (
              resumoAvaliacaoCabecalho
            )}
          </header>

          <div style={heroGlowStyle} />

          <div style={isDesktop ? desktopHeroContentStyle : heroContentStyle}>
            <Link
              href={hrefPrincipalObra}
              style={isDesktop ? desktopHeroCoverLinkStyle : heroCoverLinkStyle}
              aria-label={`Abrir ${obra.titulo}`}
            >
              <div
                style={
                  isDesktop
                    ? criarDesktopCoverArtStyle(obra.capa)
                    : criarCoverArtStyle(obra.capa)
                }
                aria-hidden="true"
              >
                {!obra.capa && (
                  <strong style={coverTitleStyle}>
                    {obra.titulo
                      .split(" ")
                      .map((parte) => parte[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </strong>
                )}
              </div>
            </Link>

            <div
              style={
                isDesktop
                  ? desktopHeroOverlayContentStyle
                  : heroOverlayContentStyle
              }
            >
              <h1
                className="historietas-theme-title"
                style={isDesktop ? desktopTitleStyle : titleStyle}
              >
                {obra.titulo}
              </h1>


              <div
                style={
                  isDesktop ? desktopHeroBottomMetaBarStyle : heroBottomMetaBarStyle
                }
              >
                <Link
                  href={criarLinkPerfilAutor(autorObraNome, autorObraId)}
                  style={heroBottomAuthorLinkStyle}
                  aria-label={`Abrir perfil do autor ${autorObraNome}`}
                  title={perfilAutorObra?.bio || undefined}
                >
                  Por {autorObraNome}
                </Link>

                <div style={heroBottomMetricsStyle}>
                  <span style={heroBottomMetricStyle}>
                    📚 {capitulosDaObra.length}
                  </span>
                  <span style={heroBottomMetricStyle}>
                    👁 {formatarNumeroCompacto(metricasObra.visualizacoes)}
                  </span>
                  <span style={heroBottomLikeMetricStyle}>
                    <span style={metricHeartIconStyle}>♥</span>{" "}
                    <span style={metricWhiteNumberStyle}>
                      {formatarNumeroCompacto(metricasObra.curtidas)}
                    </span>
                  </span>
                  <span style={heroBottomMetricStyle}>
                    💬 {formatarNumeroCompacto(metricasObra.comentarios)}
                  </span>
                </div>
              </div>

              <div style={isDesktop ? desktopHeroActionsStyle : heroActionsStyle}>
                <button
                  type="button"
                  onClick={alternarSeguirObra}
                  style={obraSeguida ? followedButtonStyle : secondaryButtonStyle}
                >
                  {obraSeguida ? "✓ Seguindo" : "Seguir obra"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAcoesObraAbertas((menuAberto) => !menuAberto)
                  }
                  style={obraAddButtonStyle}
                  aria-label="Abrir ações da obra"
                  aria-expanded={acoesObraAbertas}
                  aria-haspopup="dialog"
                >
                  +
                </button>
              </div>
            </div>
          </div>

        </section>

        {acoesObraAbertas && (
          <div
            style={obraActionSheetOverlayStyle}
            role="presentation"
            onClick={() => setAcoesObraAbertas(false)}
          >
            <section
              style={isDesktop ? desktopObraActionsMenuStyle : obraActionsMenuStyle}
              role="dialog"
              aria-label={`Ações da obra ${obra.titulo}`}
              onClick={(event) => event.stopPropagation()}
            >
              <div style={obraActionSheetHandleStyle} aria-hidden="true" />

              <div style={obraMenuHeaderStyle}>
                <strong style={obraMenuTitleStyle}>{obra.titulo}</strong>

                <div style={obraMenuAuthorMetricsRowStyle}>
                  <Link
                    href={criarLinkPerfilAutor(autorObraNome, autorObraId)}
                    style={obraMenuAuthorLinkStyle}
                    aria-label={`Abrir perfil do autor ${autorObraNome}`}
                    title={perfilAutorObra?.bio || undefined}
                  >
                    Por {autorObraNome}
                  </Link>
                </div>

                <div style={obraMenuTagsStyle}>
                  {[
                    obra.formato,
                    generoObraFormatado,
                    ...obra.tags,
                    obra.classificacaoIndicativa,
                    obra.arquivoObra ? "Arquivo anexado" : "",
                  ]
                    .filter((tag) => tag.trim())
                    .slice(0, 10)
                    .map((tag, index) => (
                      <span
                        key={`${obra.id}-menu-tag-${tag}-${index}`}
                        style={obraMenuTagStyle}
                      >
                        {index > 0 ? (
                          <span style={obraMenuTagSeparatorStyle}>•</span>
                        ) : null}
                        {tag}
                      </span>
                    ))}
                </div>

                <div style={obraMenuMetricsStyle}>
                  <span style={obraMenuMetricStyle}>
                    📚 {capitulosDaObra.length}
                  </span>
                  <span style={obraMenuMetricStyle}>
                    👁 {formatarNumeroCompacto(metricasObra.visualizacoes)}
                  </span>
                  <span style={obraMenuLikeMetricStyle}>
                    <span style={metricHeartIconStyle}>♥</span>{" "}
                    <span style={metricWhiteNumberStyle}>
                      {formatarNumeroCompacto(metricasObra.curtidas)}
                    </span>
                  </span>
                  <span style={obraMenuMetricStyle}>
                    💬 {formatarNumeroCompacto(metricasObra.comentarios)}
                  </span>
                </div>
              </div>

              <span style={obraMenuSectionLabelStyle}>Ações</span>

              <div style={obraMenuActionsStyle}>
                <button
                  type="button"
                  onClick={() => {
                    setAcoesObraAbertas(false);
                    void alternarFavoritoObra();
                  }}
                  style={
                    obraFavoritada
                      ? obraMenuItemActiveStyle
                      : obraMenuItemButtonStyle
                  }
                >
                  <span>{obraFavoritada ? "Na lista" : "Salvar"}</span>
                  <span
                    style={
                      obraFavoritada
                        ? obraMenuItemDotActiveStyle
                        : obraMenuItemDotStyle
                    }
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAcoesObraAbertas(false);
                    void alternarConcluirObra();
                  }}
                  style={
                    obraConcluida
                      ? obraMenuItemActiveStyle
                      : obraMenuItemButtonStyle
                  }
                >
                  <span>{obraConcluida ? "Concluída" : "Concluir"}</span>
                  <span
                    style={
                      obraConcluida
                        ? obraMenuItemDotActiveStyle
                        : obraMenuItemDotStyle
                    }
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAcoesObraAbertas(false);
                    void copiarLinkAtual();
                  }}
                  style={
                    linkCopiado
                      ? obraMenuItemCopiedStyle
                      : obraMenuItemButtonStyle
                  }
                >
                  <span>{linkCopiado ? "Link copiado!" : "Copiar link"}</span>
                  <span
                    style={
                      linkCopiado
                        ? obraMenuItemDotActiveStyle
                        : obraMenuItemDotStyle
                    }
                  />
                </button>

                {sinopseObraMenu ? (
                  <div style={obraMenuSynopsisStyle}>
                    <span style={obraMenuSynopsisLabelStyle}>Sinopse</span>
                    <p style={obraMenuSynopsisTextStyle}>{sinopseObraMenu}</p>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        )}

        <section style={isDesktop ? desktopWorkRatingBoxStyle : workRatingBoxStyle}>
          <div style={workRatingHeaderStyle}>
            <span style={workRatingTitleStyle}>AVALIE ESTA OBRA</span>
          </div>

          <div style={workRatingStarsRowStyle}>
            {NOTAS_AVALIACAO_OBRA.map((estrela) => {
              const preenchimentoEstrela = obterPreenchimentoEstrela(
                estrela,
                avaliacaoObra.minhaNota
              );
              const proximaNota = obterProximaNotaAvaliacao(
                estrela,
                avaliacaoObra.minhaNota
              );

              return (
                <button
                  key={`avaliacao-obra-${estrela}`}
                  type="button"
                  onClick={() => void avaliarObra(proximaNota)}
                  disabled={avaliacaoObra.salvando}
                  style={
                    preenchimentoEstrela === "0%"
                      ? workRatingStarButtonStyle
                      : workRatingStarActiveStyle
                  }
                  aria-label={`Avaliar com ${proximaNota
                    .toString()
                    .replace(".", ",")} estrela${proximaNota === 1 ? "" : "s"}`}
                >
                  <span style={workRatingStarVisualStyle} aria-hidden="true">
                    <span style={workRatingStarBaseStyle}>★</span>
                    <span
                      style={{
                        ...workRatingStarFillStyle,
                        width: preenchimentoEstrela,
                      }}
                    >
                      ★
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section style={isDesktop ? desktopCommunityBoxStyle : communityBoxStyle}>
          <div style={communityHeaderStyle}>
            <h2 style={communityTitleStyle}>COMUNIDADE</h2>

          </div>

          <div style={communityGridStyle}>
            <CommunityItem
              numero={formatarNumeroCompacto(metricasComunidadeObra.teorias)}
              rotulo="teorias"
              href={criarLinkComunidadeObra(obra.titulo, "Teoria")}
            />
            <CommunityItem
              numero={formatarNumeroCompacto(metricasComunidadeObra.reviews)}
              rotulo="reviews"
              href={criarLinkComunidadeObra(obra.titulo, "Review")}
            />
            <CommunityItem
              numero={formatarNumeroCompacto(metricasComunidadeObra.interacoes)}
              rotulo="posts"
              href={criarLinkComunidadeObra(obra.titulo)}
            />
          </div>
        </section>

        <section style={isDesktop ? desktopStatsGridStyle : statsGridStyle}>
          <MetricCard
            numero={formatarNumeroCompacto(metricasObra.visualizacoes)}
            rotulo="visualizações"
          />
          <MetricCard
            numero={formatarNumeroCompacto(metricasObra.curtidas)}
            rotulo="curtidas"
            ativo={metricasObra.curtidaAtiva}
            onClick={alternarCurtidaObra}
          />
          <MetricCard
            numero={formatarNumeroCompacto(metricasObra.comentarios)}
            rotulo="comentários"
          />
          <MetricCard
            numero={formatarNumeroCompacto(metricasObra.seguidores)}
            rotulo="seguidores"
          />
        </section>

        {capitulosDaObra.length > 0 && (
          <section id="capitulos" style={chaptersSectionStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={accentSectionTitleStyle}>CAPÍTULOS</h2>

              <span style={chapterCountBadgeStyle}>
                {obraDisponivel
                  ? `${capitulosDaObra.length} disponíveis`
                  : `${capitulosDaObra.length} em breve`}
              </span>
            </div>

            <div style={isDesktop ? desktopChaptersListStyle : chaptersListStyle}>
              {capitulosDaObra.map((capitulo, index) => (
                <article key={capitulo.id || capitulo.numero} style={isDesktop ? desktopChapterCardStyle : chapterCardStyle}>
                  <div style={chapterNumberStyle}>{capitulo.numero}</div>

                  <div style={chapterContentStyle}>
                    <h3 style={chapterTitleStyle}>{capitulo.titulo}</h3>

                    {capitulo.descricao ? (
                      <p style={chapterMetaStyle}>{capitulo.descricao}</p>
                    ) : null}
                  </div>

                  {obraDisponivel && capitulo.disponivel ? (
                    <Link href={capitulo.href} style={isDesktop ? desktopChapterButtonStyle : chapterButtonStyle}>
                      Ler capítulo
                    </Link>
                  ) : (
                    <Link
                      href={capitulo.href || `/obra/${encodeURIComponent(obra.slug)}`}
                      style={isDesktop ? desktopChapterButtonStyle : chapterButtonStyle}
                    >
                      Indisponível
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}


        {obra.arquivoObra && (
          <ArquivoObraPublico arquivo={obra.arquivoObra} isDesktop={isDesktop} />
        )}


      </section>
    </main>
  );
}

function ArquivoObraPublico({
  arquivo,
  isDesktop,
}: {
  arquivo: ArquivoObraLocal;
  isDesktop: boolean;
}) {
  const tamanhoArquivo = formatarTamanhoArquivo(arquivo.tamanho);
  const dataArquivo = formatarData(arquivo.criadoEm);
  const arquivoHref = arquivo.conteudo;
  const nomeArquivoDownload = arquivo.nome?.trim() || "arquivo-da-obra";

  async function baixarArquivo() {
    if (!arquivoHref) {
      return;
    }

    try {
      const resposta = await fetch(arquivoHref);

      if (!resposta.ok) {
        throw new Error("Não foi possível baixar o arquivo.");
      }

      const arquivoBlob = await resposta.blob();
      const arquivoUrlTemporaria = window.URL.createObjectURL(arquivoBlob);
      const linkDownload = document.createElement("a");

      linkDownload.href = arquivoUrlTemporaria;
      linkDownload.download = nomeArquivoDownload;
      document.body.appendChild(linkDownload);
      linkDownload.click();
      linkDownload.remove();
      window.setTimeout(() => {
        window.URL.revokeObjectURL(arquivoUrlTemporaria);
      }, 1000);
    } catch {
      const linkDownload = document.createElement("a");

      linkDownload.href = arquivoHref;
      linkDownload.download = nomeArquivoDownload;
      linkDownload.rel = "noopener noreferrer";
      document.body.appendChild(linkDownload);
      linkDownload.click();
      linkDownload.remove();
    }
  }

  return (
    <section style={isDesktop ? desktopFileBoxStyle : fileBoxStyle}>
      <div style={isDesktop ? desktopFileInfoCardStyle : fileInfoCardStyle}>
        <a
          href={arquivoHref}
          target="_blank"
          rel="noopener noreferrer"
          style={filePreviewLinkStyle}
          aria-label={`Abrir arquivo ${arquivo.nome}`}
        >
          {arquivo.categoria === "imagem" ? (
            <img
              src={arquivo.conteudo}
              alt={`Prévia do arquivo ${arquivo.nome}`}
              style={fileImagePreviewStyle}
            />
          ) : (
            <span style={fileIconBoxStyle}>
              {arquivo.categoria === "documento"
                ? "PDF"
                : arquivo.categoria === "texto"
                ? "TXT"
                : "ARQ"}
            </span>
          )}
        </a>

        <div style={fileInfoTextStyle}>
          <span style={fileMetaStyle}>
            Arquivo anexado • {tamanhoArquivo} • {dataArquivo}
          </span>

          <div style={isDesktop ? desktopFileActionsStyle : fileActionsStyle}>
            <a
              href={arquivoHref}
              target="_blank"
              rel="noopener noreferrer"
              style={filePrimaryButtonStyle}
            >
              Abrir arquivo
            </a>

            <button
              type="button"
              onClick={baixarArquivo}
              style={fileSecondaryButtonStyle}
            >
              Baixar arquivo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  numero,
  rotulo,
  ativo = false,
  onClick,
}: {
  numero: string;
  rotulo: string;
  ativo?: boolean;
  onClick?: () => void;
}) {
  const cardStyle = ativo ? activeStatCardStyle : statCardStyle;

  if (!onClick) {
    return (
      <div style={cardStyle}>
        <strong style={statNumberStyle}>{numero}</strong>
        <span style={statLabelStyle}>{rotulo}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={ativo ? activeStatButtonStyle : statButtonStyle}
    >
      <strong style={statNumberStyle}>{numero}</strong>
      <span style={statLabelStyle}>{rotulo}</span>
    </button>
  );
}

function CommunityItem({
  numero,
  rotulo,
  href,
}: {
  numero: string;
  rotulo: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={communityItemStyle}
      aria-label={`Abrir ${rotulo} desta obra na Comunidade`}
    >
      <strong style={communityNumberStyle}>{numero}</strong>
      <span style={communityLabelStyle}>{rotulo}</span>
    </Link>
  );
}

const obraPageCss = `
  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #070212 !important;
  }

  html[data-historietas-tema-visual="original"] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  html[data-historietas-tema-visual="branco"] .historietas-home-logo-text,
  html[data-historietas-tema-visual="branco"] .historietas-theme-title {
    background: none !important;
    color: #1A73E8 !important;
    -webkit-text-fill-color: #1A73E8 !important;
    text-shadow: none !important;
  }
`;

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const heroTitleOutlineStyle: CSSProperties = {
  textShadow:
    "-1px -1px 0 rgba(0,0,0,0.86), 1px -1px 0 rgba(0,0,0,0.86), -1px 1px 0 rgba(0,0,0,0.86), 1px 1px 0 rgba(0,0,0,0.86)",
};

const heroTextOutlineStyle: CSSProperties = {
  textShadow:
    "-1px -1px 0 rgba(0,0,0,0.78), 1px -1px 0 rgba(0,0,0,0.78), -1px 1px 0 rgba(0,0,0,0.78), 1px 1px 0 rgba(0,0,0,0.78)",
};

const heroSmallTextOutlineStyle: CSSProperties = {
  textShadow:
    "-1px -1px 0 rgba(0,0,0,0.74), 1px -1px 0 rgba(0,0,0,0.74), -1px 1px 0 rgba(0,0,0,0.74), 1px 1px 0 rgba(0,0,0,0.74)",
};

const heroIconOutlineStyle: CSSProperties = {
  textShadow:
    "-1px -1px 0 rgba(0,0,0,0.72), 1px -1px 0 rgba(0,0,0,0.72), -1px 1px 0 rgba(0,0,0,0.72), 1px 1px 0 rgba(0,0,0,0.72)",
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
  overflowX: "clip",
  boxSizing: "border-box",
  background: "var(--historietas-bg-start, #070212)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  width: "min(860px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "0 0 calc(52px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "22px 0 24px",
};


const heroTopOverlayStyle: CSSProperties = {
  position: "absolute",
  top: "16px",
  left: "18px",
  right: "18px",
  zIndex: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  minWidth: 0,
  maxWidth: "calc(100vw - 36px)",
  marginBottom: 0,
  pointerEvents: "auto",
};

const desktopHeroTopOverlayStyle: CSSProperties = {
  ...heroTopOverlayStyle,
  top: "22px",
  left: "24px",
  right: "24px",
  maxWidth: "calc(100% - 48px)",
};

const desktopHeaderRightStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "12px",
  flex: "0 0 auto",
  minWidth: 0,
};

const desktopNotificationButtonStyle: CSSProperties = {
  position: "relative",
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
  flex: "0 0 auto",
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

const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "25px",
  fontWeight: 950,
  letterSpacing: 0,
  display: "flex",
  alignItems: "center",
  gap: 0,
  minWidth: 0,
  maxWidth: "fit-content",
  ...safeTextStyle,
};

const heroLogoStyle: CSSProperties = {
  ...logoStyle,
  transform: "translate(4px, -5px)",
};

const logoMarkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(4, 0, 10, 0.96)",
  color: "#FFFFFF",
  fontSize: "19px",
  fontWeight: 950,
  letterSpacing: 0,
  flex: "0 0 auto",
  border: "1px solid rgba(124, 58, 237, 0.72)",
  boxShadow:
    "0 0 0 1px rgba(59, 7, 100, 0.48), 0 0 14px rgba(124, 58, 237, 0.22)",
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
  width: "100vw",
  marginLeft: "calc(50% - 50vw)",
  marginRight: "calc(50% - 50vw)",
  borderRadius: 0,
  border: "none",
  background: "transparent",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100vw",
  boxSizing: "border-box",
};

const heroGlowStyle: CSSProperties = {
  display: "none",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minHeight: "min(460px, 68vh)",
  display: "block",
  padding: 0,
  overflow: "hidden",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  borderBottomLeftRadius: "28px",
  borderBottomRightRadius: "28px",
};

const coverArtStyle: CSSProperties = {
  width: "100%",
  minHeight: "min(460px, 68vh)",
  height: "100%",
  borderRadius: "0 0 28px 28px",
  position: "relative",
  overflow: "hidden",
  backgroundImage: "linear-gradient(145deg, #08030F 0%, #04000A 58%, #020006 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center top",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const heroCoverLinkStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 1,
  display: "block",
  color: "inherit",
  textDecoration: "none",
  minWidth: 0,
  borderRadius: "0 0 28px 28px",
  overflow: "hidden",
};

const heroOverlayContentStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: "0px",
  zIndex: 2,
  padding: "0 16px 4px",
  display: "grid",
  justifyItems: "center",
  gap: "8px",
  background: "transparent",
  minWidth: 0,
  boxSizing: "border-box",
  textAlign: "center",
};

const coverTitleStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  fontSize: "68px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.12em",
  ...heroTitleOutlineStyle,
  ...safeTextStyle,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(36px, 9.6vw, 58px)",
  lineHeight: 0.94,
  fontWeight: 950,
  letterSpacing: "-0.085em",
  maxWidth: "100%",
  textAlign: "center",
  background: "none",
  WebkitBackgroundClip: "initial",
  backgroundClip: "initial",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow:
    "0 1px 0 rgba(0,0,0,0.34), 0 2px 12px rgba(0,0,0,0.34)",
  transform: "translateY(6px)",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  fontSize: "15.4px",
  lineHeight: 1.35,
  fontWeight: 850,
  maxWidth: "620px",
  textAlign: "center",
  display: "block",
  overflow: "visible",
  opacity: 1,
  textShadow:
    "0 1px 0 rgba(0,0,0,0.32), 0 2px 10px rgba(0,0,0,0.30)",
  transform: "translateY(6px)",
  ...safeTextStyle,
};

const heroActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 50px",
  gap: "12px",
  marginTop: "10px",
  minWidth: 0,
  width: "100%",
  maxWidth: "428px",
};

const metricHeartIconStyle: CSSProperties = {
  color: "#FB7185",
};

const metricWhiteNumberStyle: CSSProperties = {
  color: "#FFFFFF",
};

const metricStarIconStyle: CSSProperties = {
  color: "#FBBF24",
};

const metricStarValueStyle: CSSProperties = {
  color: "#FBBF24",
};

const heroBottomMetaBarStyle: CSSProperties = {
  position: "relative",
  zIndex: 3,
  width: "100%",
  maxWidth: "380px",
  marginTop: "6px",
  padding: 0,
  borderRadius: 0,
  border: "none",
  background: "transparent",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  minWidth: 0,
  boxSizing: "border-box",
  transform: "translateY(6px)",
};

const heroBottomAuthorLinkStyle: CSSProperties = {
  minWidth: 0,
  color: "rgba(255,255,255,0.95)",
  textDecoration: "none",
  fontSize: "14.1px",
  lineHeight: 1.15,
  fontWeight: 950,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  textShadow: "0 1px 0 rgba(0,0,0,0.28)",
  ...safeTextStyle,
};

const heroBottomMetricsStyle: CSSProperties = {
  flex: "0 0 auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "11px",
  minWidth: 0,
};

const heroBottomMetricStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "13.5px",
  lineHeight: 1.15,
  fontWeight: 950,
  whiteSpace: "nowrap",
  textShadow: "0 1px 0 rgba(0,0,0,0.28)",
  ...safeTextStyle,
};

const heroBottomLikeMetricStyle: CSSProperties = {
  ...heroBottomMetricStyle,
  color: "#FFFFFF",
};


const primaryButtonStyle: CSSProperties = {
  gridColumn: "1 / -1",
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10.5px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 8px",
  boxShadow: "none",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: "50px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0, 0, 0, 0.54)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 22px",
  boxShadow: "none",
  boxSizing: "border-box",
  textShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
  ...safeTextStyle,
};


const copyLinkButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  background: "#04000A",
  border: "1px solid rgba(255,255,255,0.28)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 8px",
  boxShadow: "none",
  boxSizing: "border-box",
  textShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
  ...safeTextStyle,
};

const followedButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0, 0, 0, 0.54)",
  color: "#FFFFFF",
  boxShadow: "none",
};

const obraAddButtonStyle: CSSProperties = {
  ...copyLinkButtonStyle,
  width: "50px",
  minHeight: "50px",
  height: "50px",
  padding: 0,
  borderRadius: "999px",
  background: "rgba(0, 0, 0, 0.54)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#FFFFFF",
  fontSize: "26px",
  lineHeight: 1,
  fontWeight: 900,
};

const obraActionSheetOverlayStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  height: "100dvh",
  zIndex: 9998,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  background: "rgba(0,0,0,0.68)",
  padding: 0,
  boxSizing: "border-box",
  overscrollBehavior: "none",
  touchAction: "none",
};

const obraActionSheetHandleStyle: CSSProperties = {
  width: "72px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.62)",
  justifySelf: "center",
  margin: "0 auto 14px",
};

const obraMenuActionsStyle: CSSProperties = {
  display: "grid",
  gap: 0,
  borderRadius: 0,
  border: "none",
  borderTop: "none",
  background: "transparent",
  overflow: "hidden",
};


const obraActionsMenuStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 0,
  transform: "translateX(-50%)",
  width: "min(820px, calc(100% - 4px))",
  maxHeight: "calc(100dvh - 116px)",
  overflowX: "hidden",
  overflowY: "auto",
  overscrollBehavior: "none",
  borderRadius: "24px 24px 0 0",
  background: "#070212",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.38)",
  padding: "8px 0 calc(104px + env(safe-area-inset-bottom))",
  display: "grid",
  gap: 0,
  boxSizing: "border-box",
  touchAction: "none",
  zIndex: 9999,
};

const obraMenuHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "stretch",
  gap: "8px",
  minWidth: 0,
  padding: "0 30px 10px",
  boxSizing: "border-box",
  borderBottom: "none",
};

const obraMenuTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1.1,
  fontWeight: 950,
  letterSpacing: "-0.04em",
  textAlign: "center",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: "100%",
  ...safeTextStyle,
};

const obraMenuAuthorMetricsRowStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
};

const obraMenuAuthorLinkStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textDecoration: "none",
  textAlign: "center",
  fontSize: "12px",
  lineHeight: 1.15,
  fontWeight: 850,
  ...safeTextStyle,
};

const obraMenuMetricsStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "7px",
  color: "#FFFFFF",
  fontSize: "10.5px",
  lineHeight: 1.1,
  fontWeight: 900,
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const obraMenuMetricStyle: CSSProperties = {
  color: "#FFFFFF",
};

const obraMenuLikeMetricStyle: CSSProperties = {
  ...obraMenuMetricStyle,
  color: "#FFFFFF",
};

const obraMenuStarMetricStyle: CSSProperties = {
  ...obraMenuMetricStyle,
  color: "#FFFFFF",
};

const obraMenuTagsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "nowrap",
  justifyContent: "center",
  gap: 0,
  minWidth: 0,
  maxWidth: "100%",
  color: "#FFFFFF",
  overflowX: "auto",
  overflowY: "hidden",
  whiteSpace: "nowrap",
  scrollbarWidth: "none",
};

const obraMenuTagStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "none",
  flex: "0 0 auto",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 800,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const obraMenuTagSeparatorStyle: CSSProperties = {
  display: "inline-block",
  margin: "0 4px",
  color: "rgba(255,255,255,0.34)",
};

const obraMenuSectionLabelStyle: CSSProperties = {
  display: "block",
  padding: "11px 30px 5px",
  color: "rgba(244,244,245,0.56)",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const obraMenuItemButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "44px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  border: "none",
  borderBottom: "none",
  borderRadius: 0,
  background: "transparent",
  color: "#FFFFFF",
  textDecoration: "none",
  padding: "0 30px",
  fontSize: "18px",
  fontWeight: 650,
  lineHeight: 1,
  letterSpacing: "-0.035em",
  fontFamily: "inherit",
  textAlign: "left",
  cursor: "pointer",
  boxSizing: "border-box",
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const obraMenuItemActiveStyle: CSSProperties = {
  ...obraMenuItemButtonStyle,
  fontWeight: 900,
  background: "transparent",
  color: "#FFFFFF",
};

const obraMenuItemCopiedStyle: CSSProperties = {
  ...obraMenuItemButtonStyle,
  fontWeight: 900,
  background: "transparent",
  color: "#FFFFFF",
};

const obraMenuItemDotStyle: CSSProperties = {
  width: "20px",
  height: "20px",
  borderRadius: "999px",
  border: "2.25px solid rgba(161,161,170,0.72)",
  background: "transparent",
  flex: "0 0 auto",
  boxSizing: "border-box",
};

const obraMenuItemDotActiveStyle: CSSProperties = {
  ...obraMenuItemDotStyle,
  border: "5.8px solid #FFFFFF",
};

const obraMenuSynopsisStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gap: "5px",
  padding: "4px 30px 11px",
  boxSizing: "border-box",
  color: "#FFFFFF",
  textAlign: "left",
  ...safeTextStyle,
};

const obraMenuSynopsisLabelStyle: CSSProperties = {
  color: "rgba(244,244,245,0.58)",
  fontSize: "10.5px",
  lineHeight: 1,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const obraMenuSynopsisTextStyle: CSSProperties = {
  margin: 0,
  maxHeight: "96px",
  overflowX: "hidden",
  overflowY: "auto",
  overscrollBehavior: "contain",
  paddingRight: "4px",
  color: "rgba(255,255,255,0.82)",
  fontSize: "12px",
  lineHeight: 1.38,
  fontWeight: 650,
  whiteSpace: "normal",
  wordBreak: "break-word",
  scrollbarWidth: "thin",
  WebkitOverflowScrolling: "touch",
  ...safeTextStyle,
};

const actionMessageStyle: CSSProperties = {
  gridColumn: "1 / -1",
  justifySelf: "center",
  color: "#FFFFFF",
  fontSize: "10.5px",
  fontWeight: 850,
  ...heroSmallTextOutlineStyle,
  ...safeTextStyle,
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "6px",
  marginTop: "8px",
  minWidth: 0,
};

const statCardStyle: CSSProperties = {
  borderRadius: "14px",
  background: "#04000A",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: "7px 5px",
  display: "grid",
  gap: "3px",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "none",
  textAlign: "center",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const activeStatCardStyle: CSSProperties = {
  ...statCardStyle,
  background: "#04000A",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const statButtonStyle: CSSProperties = {
  ...statCardStyle,
  cursor: "pointer",
  fontFamily: "inherit",
  color: "inherit",
};

const activeStatButtonStyle: CSSProperties = {
  ...activeStatCardStyle,
  cursor: "pointer",
  fontFamily: "inherit",
  color: "inherit",
};

const statNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "clamp(16px, 4.6vw, 21px)",
  fontWeight: 950,
  lineHeight: 1,
  ...safeTextStyle,
};

const statLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7.8px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.025em",
  lineHeight: 1.1,
  whiteSpace: "nowrap",
  ...safeTextStyle,
};


const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "clamp(24px, 4vw, 30px)",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

const accentSectionTitleStyle: CSSProperties = {
  ...sectionTitleStyle,
  color: "#FFFFFF",
  textTransform: "uppercase",
};


const fileBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: "15px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, #08030F 0%, #04000A 58%, #020006 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "grid",
  gap: "11px",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "none",
};

const fileInfoCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "74px minmax(0, 1fr)",
  gap: "12px",
  alignItems: "center",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const filePreviewLinkStyle: CSSProperties = {
  width: "74px",
  height: "74px",
  borderRadius: "18px",
  background: "rgba(0,0,0,0.24)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  flex: "0 0 auto",
};

const fileImagePreviewStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const fileIconBoxStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  borderRadius: "18px",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "none",
};

const fileInfoTextStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
};

const fileMetaStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "11px",
  lineHeight: 1.35,
  fontWeight: 900,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const fileActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

const filePrimaryButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 10px",
  boxShadow: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  WebkitAppearance: "none",
  appearance: "none",
  WebkitTapHighlightColor: "transparent",
  ...safeTextStyle,
};

const fileSecondaryButtonStyle: CSSProperties = {
  ...filePrimaryButtonStyle,
  color: "#FFFFFF",
};

const workRatingBoxStyle: CSSProperties = {
  marginTop: "10px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  display: "grid",
  gap: "8px",
  minWidth: 0,
  boxSizing: "border-box",
};

const desktopWorkRatingBoxStyle: CSSProperties = {
  ...workRatingBoxStyle,
  marginTop: "12px",
};

const workRatingHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "4px",
  minWidth: 0,
  textAlign: "center",
};

const workRatingTitleStyle: CSSProperties = {
  margin: 0,
  width: "100%",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  fontSize: "clamp(22px, 6.5vw, 31px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  textTransform: "uppercase",
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

const workRatingStarsRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
};

const workRatingStarButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "none",
  background: "transparent",
  color: "rgba(251, 191, 36, 0.34)",
  fontSize: "22px",
  fontWeight: 950,
  lineHeight: 1,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const workRatingStarActiveStyle: CSSProperties = {
  ...workRatingStarButtonStyle,
  border: "none",
  background: "transparent",
  color: "#FBBF24",
  boxShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const workRatingStarVisualStyle: CSSProperties = {
  position: "relative",
  width: "1em",
  height: "1em",
  display: "inline-block",
  lineHeight: 1,
};

const workRatingStarBaseStyle: CSSProperties = {
  color: "rgba(251, 191, 36, 0.34)",
  position: "absolute",
  inset: 0,
  lineHeight: 1,
};

const workRatingStarFillStyle: CSSProperties = {
  color: "#FBBF24",
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

const communityBoxStyle: CSSProperties = {
  marginTop: "8px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  display: "grid",
  gap: "8px",
  minWidth: 0,
  overflow: "visible",
  boxShadow: "none",
};

const communityHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "center",
};

const communityTitleStyle: CSSProperties = {
  margin: 0,
  width: "100%",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  fontSize: "clamp(22px, 6.5vw, 31px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  textTransform: "uppercase",
  textAlign: "center",
  ...safeTextStyle,
};


const communityGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
};

const communityItemStyle: CSSProperties = {
  padding: "8px 6px",
  borderRadius: "14px",
  background: "#04000A",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "grid",
  gap: "3px",
  justifyItems: "center",
  textAlign: "center",
  minWidth: 0,
  color: "inherit",
  textDecoration: "none",
  cursor: "pointer",
  boxShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const communityNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

const communityLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "8.5px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.035em",
  ...safeTextStyle,
};

const reviewBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  display: "grid",
  gap: "10px",
  minWidth: 0,
  overflow: "visible",
  boxShadow: "none",
};

const reviewTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  flexWrap: "wrap",
  minWidth: 0,
  textAlign: "center",
};

const ratingSummaryStyle: CSSProperties = {
  flex: "0 0 auto",
  width: "fit-content",
  maxWidth: "132px",
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  rowGap: "1px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  boxSizing: "border-box",
  textAlign: "center",
};

const ratingNumberStyle: CSSProperties = {
  color: "#FF9C2B",
  fontSize: "28px",
  lineHeight: 1,
  fontWeight: 950,
  textShadow: "0 1px 0 rgba(0,0,0,0.28), 0 2px 10px rgba(0,0,0,0.22)",
  ...safeTextStyle,
};

const ratingStarsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  color: "#FBBF24",
  fontSize: "12px",
  lineHeight: 1,
  letterSpacing: "-0.02em",
  marginTop: "-4px",
  marginBottom: "1px",
  textShadow: "0 1px 0 rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.2)",
  ...safeTextStyle,
};

const ratingTopStarVisualStyle: CSSProperties = {
  position: "relative",
  width: "1em",
  height: "1em",
  display: "inline-block",
  lineHeight: 1,
  flex: "0 0 auto",
};

const ratingTopStarBaseStyle: CSSProperties = {
  color: "rgba(251, 191, 36, 0.34)",
  position: "absolute",
  inset: 0,
  lineHeight: 1,
};

const ratingTopStarFillStyle: CSSProperties = {
  color: "#FBBF24",
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

const ratingTotalStyle: CSSProperties = {
  color: "rgba(255,255,255,0.95)",
  fontSize: "10px",
  lineHeight: 1.1,
  fontWeight: 900,
  textTransform: "uppercase",
  textAlign: "center",
  textShadow: "0 1px 0 rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.2)",
  ...safeTextStyle,
};


const commentsGridStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const commentCardStyle: CSSProperties = {
  padding: "9px",
  borderRadius: "15px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.07)",
  display: "grid",
  gap: "5px",
  minWidth: 0,
  boxShadow: "none",
};

const commentAuthorStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  fontWeight: 950,
  ...safeTextStyle,
};

const commentTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  lineHeight: 1.5,
  fontWeight: 650,
  ...safeTextStyle,
};

const chaptersSectionStyle: CSSProperties = {
  marginTop: "14px",
  minWidth: 0,
};

const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  alignItems: "center",
  justifyItems: "center",
  textAlign: "center",
  minWidth: 0,
  marginBottom: "9px",
};

const chapterCountBadgeStyle: CSSProperties = {
  width: "fit-content",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const chaptersListStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const chapterCardStyle: CSSProperties = {
  padding: "9px",
  borderRadius: "17px",
  background:
    "linear-gradient(135deg, #08030F 0%, #04000A 100%)",
  border: "1px solid rgba(255,255,255,0.07)",
  display: "grid",
  gridTemplateColumns: "38px minmax(0, 1fr)",
  gap: "8px",
  alignItems: "center",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "none",
};

const chapterNumberStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "13px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "15px",
  fontWeight: 950,
  boxShadow: "none",
  ...safeTextStyle,
};

const chapterContentStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
};

const chapterTopLineStyle: CSSProperties = {
  display: "flex",
  gap: "6px",
  flexWrap: "wrap",
  minWidth: 0,
};

const chapterOrderBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  fontWeight: 950,
  ...safeTextStyle,
};

const chapterStatusBadgeStyle: CSSProperties = {
  ...chapterOrderBadgeStyle,
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

const chapterTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "17px",
  lineHeight: 1.12,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

const chapterMetaStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11.5px",
  lineHeight: 1.42,
  fontWeight: 650,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const chapterButtonStyle: CSSProperties = {
  gridColumn: "1 / -1",
  minHeight: "38px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 10px",
  boxShadow: "none",
  boxSizing: "border-box",
  ...safeTextStyle,
};


const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  width: "100%",
  maxWidth: "100%",
  marginLeft: 0,
  marginRight: 0,
  borderRadius: "30px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "#04000A",
};

const desktopHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  minHeight: "560px",
};

const desktopCoverArtStyle: CSSProperties = {
  ...coverArtStyle,
  minHeight: "560px",
  height: "100%",
  borderRadius: "26px",
  backgroundPosition: "center",
};

const desktopHeroCoverLinkStyle: CSSProperties = {
  ...heroCoverLinkStyle,
  inset: "8px",
  borderRadius: "26px",
};

const desktopHeroOverlayContentStyle: CSSProperties = {
  ...heroOverlayContentStyle,
  bottom: "8px",
  alignItems: "end",
  justifyItems: "start",
  padding: "0 30px 10px",
  gap: "10px",
  textAlign: "left",
};

const desktopHeroBottomMetaBarStyle: CSSProperties = {
  ...heroBottomMetaBarStyle,
  maxWidth: "320px",
  padding: 0,
  borderRadius: 0,
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  fontSize: "clamp(48px, 6vw, 82px)",
  lineHeight: 0.92,
  letterSpacing: "-0.085em",
  textAlign: "left",
  maxWidth: "900px",
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  maxWidth: "760px",
  fontSize: "15px",
  lineHeight: 1.55,
  textAlign: "left",
};

const desktopHeroActionsStyle: CSSProperties = {
  ...heroActionsStyle,
  gridTemplateColumns: "minmax(0, 280px) 50px",
  maxWidth: "364px",
};

const desktopObraActionsMenuStyle: CSSProperties = {
  ...obraActionsMenuStyle,
  width: "min(820px, calc(100% - 24px))",
};

const desktopStatsGridStyle: CSSProperties = {
  ...statsGridStyle,
  gap: "10px",
  marginTop: "14px",
};


const desktopFileBoxStyle: CSSProperties = {
  ...fileBoxStyle,
  padding: "20px",
  borderRadius: "26px",
  marginTop: "18px",
};

const desktopFileInfoCardStyle: CSSProperties = {
  ...fileInfoCardStyle,
  gridTemplateColumns: "96px minmax(0, 1fr)",
  padding: "14px",
};

const desktopFileActionsStyle: CSSProperties = {
  ...fileActionsStyle,
  gridTemplateColumns: "180px 180px",
  justifyContent: "start",
};

const desktopCommunityBoxStyle: CSSProperties = {
  ...communityBoxStyle,
  marginTop: "12px",
  padding: 0,
  borderRadius: 0,
  gap: "10px",
};

const desktopReviewBoxStyle: CSSProperties = {
  ...reviewBoxStyle,
  marginTop: "14px",
  padding: 0,
  borderRadius: 0,
  gap: "12px",
};

const desktopCommentsGridStyle: CSSProperties = {
  ...commentsGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
};

const desktopChaptersListStyle: CSSProperties = {
  ...chaptersListStyle,
  gap: "9px",
};

const desktopChapterCardStyle: CSSProperties = {
  ...chapterCardStyle,
  gridTemplateColumns: "50px minmax(0, 1fr) 126px",
  padding: "10px",
  gap: "10px",
};

const desktopChapterButtonStyle: CSSProperties = {
  ...chapterButtonStyle,
  gridColumn: "auto",
  minHeight: "37px",
};


const emptyTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "clamp(34px, 10vw, 58px)",
  lineHeight: 0.95,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  ...safeTextStyle,
};