"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { obras } from "../../data/obras";
import { supabase } from "../../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../../lib/historietasTheme";

const FOLLOWED_WORKS_STORAGE_KEY = "historietas-obras-seguidas";
const LIKED_WORKS_STORAGE_KEY = "historietas-obras-curtidas";
const VIEWED_WORKS_STORAGE_KEY = "historietas-obras-visualizacoes";
const RATED_WORKS_STORAGE_KEY = "historietas-obras-avaliacoes";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const LOCAL_WORKS_STORAGE_KEY = "historietas-obras";
const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";
const VERSAO_INTERACOES_OBRA_PUBLICA = "fix-interacoes-obra-2026-06-16-0022";

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
  origem: "catalogo" | "local";
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

type CapituloModelo = {
  numero: string;
  titulo: string;
  descricao: string;
};

const capitulosModelo: CapituloModelo[] = [
  {
    numero: "01",
    titulo: "Capítulo inicial",
    descricao: "Primeiro contato com o universo da obra.",
  },
  {
    numero: "02",
    titulo: "Continuação da trama",
    descricao: "Novos conflitos, revelações e evolução dos personagens.",
  },
  {
    numero: "03",
    titulo: "Próximo passo",
    descricao: "A história avança para uma nova fase.",
  },
];

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

function criarLoginHrefObraPublica() {
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

function formatarTamanhoArquivo(tamanho: number) {
  if (!Number.isFinite(tamanho) || tamanho <= 0) {
    return "0 KB";
  }

  if (tamanho >= 1024 * 1024) {
    return `${(tamanho / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(tamanho / 1024))} KB`;
}

function formatarDataArquivo(dataIso: string) {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return "Data não informada";
  }

  return data.toLocaleDateString("pt-BR");
}

function obterRotuloCategoriaArquivo(categoria: ArquivoObraLocal["categoria"]) {
  if (categoria === "imagem") {
    return "Imagem";
  }

  if (categoria === "documento") {
    return "PDF";
  }

  if (categoria === "texto") {
    return "Texto";
  }

  return "Arquivo";
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

function carregarBackupArquivosObras(): ArquivosObrasBackup {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const backupTexto = localStorage.getItem(FILE_BACKUP_STORAGE_KEY);
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

    localStorage.setItem(
      FILE_BACKUP_STORAGE_KEY,
      JSON.stringify(backupNormalizado)
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

function sincronizarBackupArquivosObras(obrasLocais: ObraLocal[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const backupAtual = carregarBackupArquivosObras();

    obrasLocais.forEach((obraLocal) => {
      if (!obraLocal.arquivoObra) {
        return;
      }

      obterChavesBackupObra(obraLocal).forEach((chave) => {
        backupAtual[chave] = obraLocal.arquivoObra as ArquivoObraLocal;
      });
    });

    localStorage.setItem(FILE_BACKUP_STORAGE_KEY, JSON.stringify(backupAtual));
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
    curtiu: Boolean(capitulo.curtiu),
    salvo: Boolean(capitulo.salvo),
    comentario:
      typeof capitulo.comentario === "string" ? capitulo.comentario : "",
    criadoEm: typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
    lido: Boolean(capitulo.lido),
    lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
  };
}

function normalizarObraLocal(
  obra: Partial<ObraLocal> & Record<string, unknown>,
  index: number
): ObraLocal {
  const capitulosNormalizados: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapituloLocal(
          capitulo as Partial<CapituloLocal>,
          capituloIndex
        )
      )
    : [];

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
    slug,
    link:
      typeof obra.link === "string" && obra.link.trim()
        ? obra.link
        : `/obra/${slug}`,
  };
}

function criarResumoCapitulo(texto: string) {
  const textoLimpo = texto.trim().replace(/\s+/g, " ");

  if (!textoLimpo) {
    return "Capítulo publicado na obra.";
  }

  return textoLimpo.length > 120 ? `${textoLimpo.slice(0, 120)}...` : textoLimpo;
}

function carregarObrasLocaisComBackup() {
  const obrasLocaisTexto = localStorage.getItem(LOCAL_WORKS_STORAGE_KEY);
  const obrasLocaisJson: unknown = obrasLocaisTexto
    ? JSON.parse(obrasLocaisTexto)
    : [];

  const backupArquivosObras = carregarBackupArquivosObras();

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

  sincronizarBackupArquivosObras(obrasNormalizadas);

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
    slug: slugObra,
    link: obra.link?.trim() || obraLocal?.link || `/obra/${slugObra}`,
  };
}

async function carregarObraSupabasePorSlug(
  slugBusca: string,
  obrasLocais: ObraLocal[]
) {
  const slugLimpo = slugBusca.trim();

  if (!slugLimpo) {
    return obrasLocais;
  }

  try {
    const { data: obrasBanco, error: erroObra } = await supabase
      .from("obras")
      .select("*")
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

    const obraBanco = ((obrasBanco || []) as SupabaseObraRow[])[0] || null;

    if (!obraBanco) {
      return obrasLocais;
    }

    const { data: capitulosBanco, error: erroCapitulos } = await supabase
      .from("capitulos")
      .select("*")
      .eq("obra_id", obraBanco.id)
      .eq("publicado", true)
      .order("ordem", { ascending: true });

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

    const obraNormalizada = normalizarObraSupabase(
      obraBanco,
      erroCapitulos ? [] : ((capitulosBanco || []) as SupabaseCapituloRow[]),
      obraLocal,
      0
    );

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

    sincronizarBackupArquivosObras(obrasAtualizadas);

    return obrasAtualizadas;
  } catch (error) {
    console.warn("Não consegui acessar o Supabase agora:", error);
    return obrasLocais;
  }
}

function converterObraCatalogoParaDinamica(
  obra: (typeof obras)[number]
): ObraDinamica {
  return {
    id: `catalogo-${obra.slug}`,
    origem: "catalogo",
    titulo: obra.titulo,
    autor: obra.autor,
    autorId: "",
    genero: obra.genero,
    formato: obra.formato,
    classificacaoIndicativa: obra.classificacaoIndicativa,
    status: obra.status,
    views: obra.views,
    likes: obra.likes,
    comentarios: obra.comentarios,
    disponivel: obra.disponivel,
    slug: obra.slug,
    link: obra.disponivel ? obra.link : criarLinkAviso(obra.titulo),
    sinopse: obra.sinopse,
    tags: obra.tags,
    capa: "",
    arquivoObra: null,
    capitulos: capitulosModelo.map((capitulo, index) => ({
      id: `modelo-${index + 1}`,
      numero: capitulo.numero,
      titulo: capitulo.titulo,
      descricao: capitulo.descricao,
      href: criarLinkAviso(obra.titulo, capitulo.titulo),
      disponivel: obra.disponivel,
    })),
  };
}

function converterObraLocalParaDinamica(obra: ObraLocal): ObraDinamica {
  const obraDisponivel = obra.publicado && obra.capitulos.length > 0;

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
    views: String(obra.capitulos.filter((capitulo) => capitulo.lido).length),
    likes: String(obra.capitulos.filter((capitulo) => capitulo.curtiu).length),
    comentarios: String(
      obra.capitulos.filter((capitulo) => capitulo.comentario.trim()).length
    ),
    disponivel: obraDisponivel,
    slug: obra.slug,
    link: obraDisponivel ? obra.link : criarLinkAviso(obra.titulo),
    sinopse: obra.sinopse,
    tags: obra.tags,
    capa: obra.capa,
    arquivoObra: obra.arquivoObra || null,
    capitulos: obra.capitulos.map((capitulo, index) => ({
      id: capitulo.id,
      numero: String(index + 1).padStart(2, "0"),
      titulo: capitulo.titulo,
      descricao: criarResumoCapitulo(capitulo.texto),
      href: obraDisponivel
        ? `/obra/${encodeURIComponent(
            obra.slug || criarSlugBase(obra.titulo)
          )}/capitulo/${index + 1}`
        : criarLinkAviso(obra.titulo, capitulo.titulo),
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
    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.22) 100%), url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center 24%",
  };
}

function criarDesktopCoverArtStyle(capa: string): CSSProperties {
  if (!capa) {
    return desktopCoverArtStyle;
  }

  return {
    ...desktopCoverArtStyle,
    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.24) 100%), url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center 24%",
  };
}

function criarLinkAviso(titulo: string, capitulo?: string) {
  const obra = encodeURIComponent(titulo);

  if (capitulo) {
    return `/em-breve?obra=${obra}&capitulo=${encodeURIComponent(capitulo)}`;
  }

  return `/em-breve?obra=${obra}`;
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
      .select("*")
      .eq("user_id", userIdLimpo)
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
      .select("*")
      .eq("id", userIdLimpo)
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

function obterNumeroSeguro(valor: unknown, fallback = 0) {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : fallback;
}

function idObraSupabaseValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

function formatarNumeroCompacto(valor: number) {
  if (!Number.isFinite(valor) || valor <= 0) {
    return "0";
  }

  if (valor >= 1000) {
    const valorCompacto = valor / 1000;
    const texto =
      valorCompacto >= 10
        ? Math.round(valorCompacto).toString()
        : valorCompacto.toFixed(1).replace(".0", "");

    return `${texto}K`;
  }

  return String(valor);
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

function carregarListaLocalObraPublica(chaveStorage: string) {
  try {
    const texto = localStorage.getItem(chaveStorage);
    const json: unknown = texto ? JSON.parse(texto) : [];

    return Array.isArray(json)
      ? json.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      : [];
  } catch {
    return [] as string[];
  }
}

function obraEstaEmListaLocalObraPublica(obra: ObraDinamica, chaveStorage: string) {
  const chavesObra = new Set(obterChavesInteracaoObraPublica(obra));

  return carregarListaLocalObraPublica(chaveStorage).some((item) =>
    chavesObra.has(item.trim())
  );
}

function salvarListaLocalObraPublica(
  obra: ObraDinamica,
  chaveStorage: string,
  ativo: boolean
) {
  const listaAtual = carregarListaLocalObraPublica(chaveStorage);
  const chavesObra = obterChavesInteracaoObraPublica(obra);
  const chavesSet = new Set(chavesObra);
  const listaSemObra = listaAtual.filter((item) => !chavesSet.has(item.trim()));
  const proximaLista = ativo
    ? Array.from(new Set([...listaSemObra, ...chavesObra]))
    : listaSemObra;

  localStorage.setItem(chaveStorage, JSON.stringify(proximaLista));

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

function carregarAvaliacoesLocais() {
  try {
    const avaliacoesTexto = localStorage.getItem(RATED_WORKS_STORAGE_KEY);
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

function obterAvaliacaoLocal(obra: ObraDinamica) {
  const chaveAvaliacao = obterChaveAvaliacaoObra(obra);
  const avaliacoesLocais = carregarAvaliacoesLocais();
  const nota = Number(avaliacoesLocais[chaveAvaliacao]);

  return Number.isFinite(nota) && nota >= 0.5 && nota <= 5
    ? Math.round(nota * 2) / 2
    : 0;
}

function salvarAvaliacaoLocal(obra: ObraDinamica, nota: number) {
  try {
    const chaveAvaliacao = obterChaveAvaliacaoObra(obra);

    if (!chaveAvaliacao) {
      return;
    }

    const avaliacoesLocais = carregarAvaliacoesLocais();

    if (nota <= 0) {
      delete avaliacoesLocais[chaveAvaliacao];
    } else {
      avaliacoesLocais[chaveAvaliacao] = nota;
    }

    localStorage.setItem(
      RATED_WORKS_STORAGE_KEY,
      JSON.stringify(avaliacoesLocais)
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
  const [isDesktop, setIsDesktop] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const visualizacaoRegistradaRef = useRef("");

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

    async function carregarObraPublica() {
      setCarregandoObras(true);

      try {
        const obrasNormalizadas = carregarObrasLocaisComBackup();

        if (!cancelado) {
          setObrasLocais(obrasNormalizadas);
        }

        const obrasComSupabase = await carregarObraSupabasePorSlug(
          slug,
          obrasNormalizadas
        );

        if (!cancelado) {
          setObrasLocais(obrasComSupabase);
        }
      } catch {
        if (!cancelado) {
          setObrasLocais([]);
        }
      } finally {
        if (!cancelado) {
          setCarregandoObras(false);
        }
      }
    }

    carregarObraPublica();

    return () => {
      cancelado = true;
    };
  }, [slug]);

  const obra = useMemo<ObraDinamica | null>(() => {
    const obraLocal = obrasLocais.find((item) => {
      return item.slug === slug || criarSlugBase(item.titulo) === slug;
    });

    if (obraLocal) {
      return converterObraLocalParaDinamica(obraLocal);
    }

    const obraCatalogo = obras.find((item) => item.slug === slug);

    return obraCatalogo ? converterObraCatalogoParaDinamica(obraCatalogo) : null;
  }, [slug, obrasLocais]);

  useEffect(() => {
    let cancelado = false;

    async function carregarPerfilAutorDaObra() {
      if (!obra?.autorId) {
        setPerfilAutorObra(null);
        return;
      }

      const perfilAutor = await carregarPerfilPublicoObra(
        obra.autorId,
        obra.autor
      );

      if (!cancelado) {
        setPerfilAutorObra(perfilAutor);
      }
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

  useEffect(() => {
    if (!obra || obraDisponivel || carregandoObras) {
      return;
    }

    router.replace(criarLinkAviso(obra.titulo));
  }, [obra, obraDisponivel, carregandoObras, router]);

  const capitulosDaObra = useMemo<CapituloDinamico[]>(() => {
    if (!obra) {
      return [];
    }

    if (obra.capitulos.length > 0) {
      return obra.capitulos;
    }

    return capitulosModelo.map((capitulo, index) => ({
      id: `modelo-${index + 1}`,
      numero: capitulo.numero,
      titulo: capitulo.titulo,
      descricao: capitulo.descricao,
      href: criarLinkAviso(obra.titulo, capitulo.titulo),
      disponivel: obraDisponivel,
    }));
  }, [obra, obraDisponivel]);

  useEffect(() => {
    if (!obraNormalizada) {
      return;
    }

    try {
      const obrasSeguidasTexto = localStorage.getItem(FOLLOWED_WORKS_STORAGE_KEY);
      const obrasSeguidasJson: unknown = obrasSeguidasTexto
        ? JSON.parse(obrasSeguidasTexto)
        : [];

      const obrasSeguidas = Array.isArray(obrasSeguidasJson)
        ? obrasSeguidasJson.filter(
            (titulo): titulo is string =>
              typeof titulo === "string" && Boolean(titulo.trim())
          )
        : [];

      setObraSeguida(obrasSeguidas.includes(obraNormalizada));
    } catch {
      setObraSeguida(false);
    }
  }, [obraNormalizada]);

  useEffect(() => {
    if (!obra) {
      setObraFavoritada(false);
      setObraConcluida(false);
      return;
    }

    let cancelado = false;
    const obraAtual = obra;

    setObraFavoritada(obraEstaEmListaLocalObraPublica(obraAtual, FAVORITES_STORAGE_KEY));
    setObraConcluida(obraEstaEmListaLocalObraPublica(obraAtual, COMPLETED_STORAGE_KEY));

    if (!obraAtual.id || !idObraSupabaseValido(obraAtual.id)) {
      return;
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
            .maybeSingle(),
          supabase
            .from("concluidas")
            .select("obra_id")
            .eq("user_id", userId)
            .eq("obra_id", obraAtual.id)
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
    };
  }, [obra?.id, obra?.slug, obraNormalizada]);

  useEffect(() => {
    if (!obra) {
      setMetricasObra(metricasObraVazias);
      return;
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
      const visualizacoesTexto = localStorage.getItem(VIEWED_WORKS_STORAGE_KEY);
      const visualizacoesJson: unknown = visualizacoesTexto
        ? JSON.parse(visualizacoesTexto)
        : {};
      const visualizacoesPorObra =
        visualizacoesJson && typeof visualizacoesJson === "object" && !Array.isArray(visualizacoesJson)
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
        localStorage.setItem(
          VIEWED_WORKS_STORAGE_KEY,
          JSON.stringify({
            ...visualizacoesPorObra,
            [chaveMetricaObra]: proximasVisualizacoes,
          })
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
      const curtidasTexto = localStorage.getItem(LIKED_WORKS_STORAGE_KEY);
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
      const seguidasTexto = localStorage.getItem(FOLLOWED_WORKS_STORAGE_KEY);
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

    setObraSeguida(seguindoLocalAtivo);
    setMetricasObra({
      ...metricasBase,
      visualizacoes: visualizacoesLocais,
      curtidaAtiva: curtidaLocalAtiva,
      curtidas: metricasBase.curtidas + (curtidaLocalAtiva ? 1 : 0),
      seguidores: seguindoLocalAtivo ? 1 : metricasBase.seguidores,
      carregado: true,
    });

    if (obraAtual.origem !== "local" || !obraId || !idObraSupabaseValido(obraId)) {
      return;
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

        const [{ count: totalCurtidas }, { count: totalSeguidores }] =
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

        let totalComentarios = metricasBase.comentarios;
        const idsCapitulos = capitulosDaObra
          .map((capitulo) => capitulo.id)
          .filter((capituloId) => capituloId && !capituloId.startsWith("modelo-"));

        if (idsCapitulos.length > 0) {
          const { count: comentariosCount } = await supabase
            .from("comentarios_capitulos")
            .select("id", { count: "exact", head: true })
            .in("capitulo_id", idsCapitulos);

          totalComentarios = comentariosCount ?? totalComentarios;
        }

        let curtidaAtiva = false;
        let seguindoAtivo = false;

        try {
          const obrasSeguidasTexto = localStorage.getItem(FOLLOWED_WORKS_STORAGE_KEY);
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
                .maybeSingle(),
              supabase
                .from("seguindo_obras")
                .select("id")
                .eq("obra_id", obraId)
                .eq("user_id", userId)
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
    };
  }, [obra, capitulosDaObra, obraNormalizada]);

  useEffect(() => {
    if (!obra) {
      setMetricasComunidadeObra(metricasComunidadeObraVazias);
      return;
    }

    let cancelado = false;
    const tituloObra = obra.titulo;

    async function carregarMetricasComunidadeObra() {
      try {
        const { data: postsData, error: erroPosts } = await supabase
          .from("comunidade_posts")
          .select("id, tipo_publicacao, obra_relacionada")
          .not("obra_relacionada", "is", null);

        if (erroPosts || !Array.isArray(postsData)) {
          throw erroPosts;
        }

        const postsRelacionados = (postsData as SupabaseComunidadePostRow[]).filter(
          (post) => postComunidadePertenceAObra(post, tituloObra)
        );
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
      setAvaliacaoObra(avaliacaoObraVazia);
      return;
    }

    const obraAtual = obra;
    const notaLocal = obterAvaliacaoLocal(obraAtual);

    setAvaliacaoObra({
      media: notaLocal > 0 ? notaLocal : 0,
      total: notaLocal > 0 ? 1 : 0,
      minhaNota: notaLocal,
      carregado: true,
      salvando: false,
    });

    if (!obraAtual.id || !idObraSupabaseValido(obraAtual.id)) {
      return;
    }

    let cancelado = false;

    async function carregarAvaliacaoRealObra() {
      try {
        const { data: usuarioData } = await supabase.auth.getUser();
        const userId = usuarioData.user?.id || "";

        const { data: avaliacoesData, error: erroAvaliacoes } = await supabase
          .from("obra_avaliacoes")
          .select("nota")
          .eq("obra_id", obraAtual.id);

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
    };
  }, [obra?.id, obra?.slug, obraNormalizada]);

  async function obterUsuarioLogadoParaAcao(mensagem: string) {
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id || "";

      if (!userId) {
        setMensagemAcao(mensagem);
        router.push(criarLoginHrefObraPublica());
        return "";
      }

      return userId;
    } catch {
      setMensagemAcao(mensagem);
      router.push(criarLoginHrefObraPublica());
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
      const obrasSeguidasTexto = localStorage.getItem(FOLLOWED_WORKS_STORAGE_KEY);
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

      localStorage.setItem(
        FOLLOWED_WORKS_STORAGE_KEY,
        JSON.stringify(novasObrasSeguidas)
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
        });

        if (inserirResposta.error) {
          throw inserirResposta.error;
        }

        await registrarAtividadeDiarioObra({
          userId,
          obra: obraAtual,
          tipo: "salvou_obra",
          visibilidade: "privado",
          texto: `Adicionou ${obraAtual.titulo} para acompanhar.`,
        });
      }
    } catch (error) {
      console.warn("Não consegui salvar seguimento da obra:", error);

      try {
        const obrasSeguidasTexto = localStorage.getItem(FOLLOWED_WORKS_STORAGE_KEY);
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

        const obrasSeguidasRestauradas = seguindo
          ? obrasSeguidas.filter((titulo) => !chavesObraAtual.includes(titulo))
          : Array.from(new Set([...obrasSeguidas, ...chavesObraAtual]));

        localStorage.setItem(
          FOLLOWED_WORKS_STORAGE_KEY,
          JSON.stringify(obrasSeguidasRestauradas)
        );
      } catch {
        // O rollback local não deve travar a mensagem de erro.
      }

      setObraSeguida(!seguindo);
      setMetricasObra((metricasAtuais) => ({
        ...metricasAtuais,
        seguidores: Math.max(0, metricasAtuais.seguidores - seguidoresDelta),
      }));
      setMensagemAcao("Não foi possível salvar agora.");
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
        const curtidasTexto = localStorage.getItem(LIKED_WORKS_STORAGE_KEY);
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

        localStorage.setItem(
          LIKED_WORKS_STORAGE_KEY,
          JSON.stringify(novasObrasCurtidas)
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

      if (proximaCurtidaAtiva) {
        await registrarAtividadeDiarioObra({
          userId,
          obra,
          tipo: "favoritou_obra",
          visibilidade: "parcial",
          texto: `Curtiu ${obra.titulo}.`,
        });
      }

      setMensagemAcao(
        proximaCurtidaAtiva ? "Obra curtida." : "Curtida removida."
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
    salvarListaLocalObraPublica(obra, FAVORITES_STORAGE_KEY, proximoFavorito);
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
      }

      setMensagemAcao(
        proximoFavorito ? "Obra salva na lista." : "Obra removida da lista."
      );
    } catch (error) {
      console.warn("Não consegui salvar favorito da obra:", error);
      setObraFavoritada(favoritoAnterior);
      salvarListaLocalObraPublica(obra, FAVORITES_STORAGE_KEY, favoritoAnterior);
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
    salvarListaLocalObraPublica(obra, COMPLETED_STORAGE_KEY, proximaConcluida);
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
      }

      setMensagemAcao(
        proximaConcluida ? "Obra marcada como concluída." : "Obra removida das concluídas."
      );
    } catch (error) {
      console.warn("Não consegui salvar conclusão da obra:", error);
      setObraConcluida(concluidaAnterior);
      salvarListaLocalObraPublica(obra, COMPLETED_STORAGE_KEY, concluidaAnterior);
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
    salvarAvaliacaoLocal(obra, notaNormalizada);

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

  if (carregandoObras && !obra) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${obraPageCss}`}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
        <section style={isDesktop ? desktopContainerStyle : containerStyle} />
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
          <header style={isDesktop ? desktopTopStyle : topStyle}>
            <Link href="/" style={logoStyle} aria-label="Historietas">
              <span style={logoMarkStyle}>H</span>
              <span className="historietas-home-logo-text" style={logoTextStyle}>istorietas</span>
            </Link>
          </header>

          <section style={emptyBoxStyle}>
            <span style={miniTitleStyle}>OBRA NÃO ENCONTRADA</span>

            <h1 style={emptyTitleStyle}>Essa obra não existe no catálogo.</h1>

            <p style={textStyle}>
              Volte para explorar e escolha uma obra disponível na plataforma.
            </p>

            <Link href="/explorar" style={primaryLinkButtonStyle}>
              Voltar para Explorar
            </Link>
          </section>
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
        <section style={isDesktop ? desktopContainerStyle : containerStyle} />
      </main>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${obraPageCss}`}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTopStyle : topStyle}>
          <Link href="/" style={logoStyle} aria-label="Historietas">
            <span style={logoMarkStyle}>H</span>
            <span className="historietas-home-logo-text" style={logoTextStyle}>istorietas</span>
          </Link>

          <div style={ratingSummaryStyle}>
            <strong style={ratingNumberStyle}>
              {formatarMediaAvaliacao(avaliacaoObra.media)}
            </strong>
            <span
              style={ratingStarsStyle}
              aria-label={`Média ${formatarMediaAvaliacao(avaliacaoObra.media)} de 5`}
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
        </header>

        <section style={isDesktop ? desktopHeroStyle : heroStyle}>
          <div style={heroGlowStyle} />

          <div style={isDesktop ? desktopHeroContentStyle : heroContentStyle}>
            <div style={isDesktop ? criarDesktopCoverArtStyle(obra.capa) : criarCoverArtStyle(obra.capa)} aria-hidden="true">
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

            <div style={isDesktop ? desktopBadgeRowStyle : badgeRowStyle}>
              <span style={infoBadgeStyle}>{generoObraFormatado}</span>
              <span style={infoBadgeStyle}>{obra.formato}</span>
              <span style={ratingBadgeStyle}>{obra.classificacaoIndicativa}</span>
              <span style={statusBadgeStyle}>
                {obraDisponivel ? obra.status : "Em breve"}
              </span>

              {obra.tags.slice(0, 1).map((tag, index) => (
                <span key={`${obra.id}-public-tag-${tag}-${index}`} style={tagBadgeStyle}>
                  {tag}
                </span>
              ))}

              {obra.arquivoObra && (
                <span style={fileAttachedBadgeStyle}>Arquivo anexado</span>
              )}
            </div>

            <h1 className="historietas-theme-title" style={isDesktop ? desktopTitleStyle : titleStyle}>{obra.titulo}</h1>

            <div style={isDesktop ? desktopInfoRowStyle : infoRowStyle}>
              <Link
                href={criarLinkPerfilAutor(autorObraNome, autorObraId)}
                style={authorInlineStyle}
                aria-label={`Abrir perfil do autor ${autorObraNome}`}
                title={perfilAutorObra?.bio || undefined}
              >
                Por {autorObraNome}
              </Link>
            </div>

            <p style={isDesktop ? desktopDescriptionStyle : descriptionStyle}>{obra.sinopse}</p>

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
                onClick={alternarFavoritoObra}
                style={obraFavoritada ? followedButtonStyle : secondaryButtonStyle}
              >
                {obraFavoritada ? "✓ Na lista" : "Salvar"}
              </button>

              <button
                type="button"
                onClick={alternarConcluirObra}
                style={obraConcluida ? followedButtonStyle : copyLinkButtonStyle}
              >
                {obraConcluida ? "✓ Concluída" : "Concluir"}
              </button>

              <button
                type="button"
                onClick={copiarLinkAtual}
                style={linkCopiado ? copiedLinkButtonStyle : copyLinkButtonStyle}
              >
                {linkCopiado ? "Link copiado!" : "Copiar link"}
              </button>

            </div>

            {mensagemAcao && <span style={actionMessageStyle}>{mensagemAcao}</span>}
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
                  <div style={chapterTopLineStyle}>
                    <span style={chapterOrderBadgeStyle}>
                      Capítulo {index + 1}
                    </span>

                    <span style={chapterStatusBadgeStyle}>
                      {obraDisponivel ? "Disponível" : "Em breve"}
                    </span>
                  </div>

                  <h3 style={chapterTitleStyle}>{capitulo.titulo}</h3>

                  <p style={chapterMetaStyle}>
                    {obraDisponivel
                      ? capitulo.descricao
                      : "Capítulo previsto para lançamento."}
                  </p>
                </div>

                {obraDisponivel && capitulo.disponivel ? (
                  <Link href={capitulo.href} style={isDesktop ? desktopChapterButtonStyle : chapterButtonStyle}>
                    Ler capítulo
                  </Link>
                ) : (
                  <Link
                    href={capitulo.href || criarLinkAviso(obra.titulo, capitulo.titulo)}
                    style={isDesktop ? desktopChapterButtonStyle : chapterButtonStyle}
                  >
                    Avisar
                  </Link>
                )}
              </article>
            ))}
          </div>
        </section>



        {obra.arquivoObra && (
          <ArquivoObraPublico arquivo={obra.arquivoObra} slug={obra.slug} isDesktop={isDesktop} />
        )}



      </section>
    </main>
  );
}

function ArquivoObraPublico({
  arquivo,
  slug,
  isDesktop,
}: {
  arquivo: ArquivoObraLocal;
  slug: string;
  isDesktop: boolean;
}) {
  const tipoArquivo = obterRotuloCategoriaArquivo(arquivo.categoria);
  const tamanhoArquivo = formatarTamanhoArquivo(arquivo.tamanho);
  const dataArquivo = formatarDataArquivo(arquivo.criadoEm);
  const verArquivoHref = `/ver-arquivo?slug=${encodeURIComponent(slug)}`;

  return (
    <section style={isDesktop ? desktopFileBoxStyle : fileBoxStyle}>
      <div style={fileHeaderStyle}>
        <div style={{ minWidth: 0 }}>
          <span style={miniTitleStyle}>ARQUIVO DA OBRA</span>

          <h2 style={fileTitleStyle}>Arquivo anexado</h2>
        </div>

        <span style={fileTypeBadgeStyle}>{tipoArquivo}</span>
      </div>

      <div style={isDesktop ? desktopFileInfoCardStyle : fileInfoCardStyle}>
        <Link
          href={verArquivoHref}
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
        </Link>

        <div style={fileInfoTextStyle}>
          <strong style={fileNameTitleStyle}>{arquivo.nome}</strong>

          <span style={fileMetaStyle}>
            {tipoArquivo} • {tamanhoArquivo} • Adicionado em {dataArquivo}
          </span>
        </div>
      </div>

      <div style={isDesktop ? desktopFileActionsStyle : fileActionsStyle}>
        <Link href={verArquivoHref} style={filePrimaryButtonStyle}>
          Abrir arquivo
        </Link>

        <a
          href={arquivo.conteudo}
          download={arquivo.nome || "arquivo-da-obra"}
          style={fileSecondaryButtonStyle}
        >
          Baixar arquivo
        </a>
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
  zIndex: 1,
  width: "min(860px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "14px 0 calc(52px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "22px 0 24px",
};


const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  marginBottom: "10px",
  minWidth: 0,
  maxWidth: "100%",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  flexWrap: "nowrap",
  marginBottom: "14px",
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
  border: "1px solid rgba(255,255,255,0.08)",
  background:
    "linear-gradient(135deg, #08030F 0%, #04000A 58%, #020006 100%)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const heroGlowStyle: CSSProperties = {
  display: "none",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "10px",
  display: "grid",
  gridTemplateColumns: "minmax(112px, 0.38fr) minmax(0, 1fr)",
  gap: "6px 10px",
  alignItems: "start",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const coverArtStyle: CSSProperties = {
  gridColumn: "1",
  gridRow: "1 / span 5",
  width: "100%",
  minHeight: "198px",
  height: "198px",
  alignSelf: "start",
  borderRadius: "17px",
  position: "relative",
  overflow: "hidden",
  backgroundImage: "linear-gradient(145deg, #08030F 0%, #04000A 58%, #020006 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const coverTopBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "8px",
  left: "8px",
  maxWidth: "calc(100% - 16px)",
  padding: "5px 7px",
  borderRadius: "999px",
  background: "rgba(59, 7, 100, 0.78)",
  color: "#FFFFFF",
  fontSize: "8.8px",
  fontWeight: 950,
  lineHeight: 1.1,
  textAlign: "center",
  ...safeTextStyle,
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
  textShadow: "0 18px 38px rgba(0,0,0,0.42)",
  ...safeTextStyle,
};

const coverBottomBadgeStyle: CSSProperties = {
  position: "absolute",
  left: "8px",
  right: "8px",
  bottom: "8px",
  padding: "7px 8px",
  borderRadius: "14px",
  background: "rgba(4, 0, 10, 0.82)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  display: "grid",
  gap: "2px",
  textAlign: "center",
  ...safeTextStyle,
};

const badgeRowStyle: CSSProperties = {
  gridColumn: "2",
  display: "flex",
  flexWrap: "wrap",
  gap: "5px",
  minWidth: 0,
  justifyContent: "flex-start",
  alignItems: "center",
};

const infoBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "8.8px",
  fontWeight: 950,
  lineHeight: 1.1,
  ...safeTextStyle,
};

const authorInlineStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  textDecoration: "none",
  cursor: "pointer",
  fontSize: "10.5px",
  lineHeight: 1.15,
  fontWeight: 950,
  textAlign: "left",
  ...safeTextStyle,
};


const statusBadgeStyle: CSSProperties = {
  ...infoBadgeStyle,
  background: "rgba(34, 197, 94, 0.14)",
  border: "1px solid rgba(34, 197, 94, 0.28)",
  color: "#86EFAC",
};

const ratingBadgeStyle: CSSProperties = {
  ...infoBadgeStyle,
  background: "rgba(124, 58, 237, 0.14)",
  border: "1px solid rgba(124, 58, 237, 0.26)",
  color: "#DDD6FE",
};

const tagBadgeStyle: CSSProperties = {
  ...infoBadgeStyle,
  background: "rgba(124, 58, 237, 0.12)",
  border: "1px solid rgba(124, 58, 237, 0.22)",
  color: "#DDD6FE",
};

const titleStyle: CSSProperties = {
  gridColumn: "2",
  margin: 0,
  fontSize: "clamp(28px, 7.6vw, 42px)",
  lineHeight: 0.98,
  fontWeight: 950,
  letterSpacing: "-0.07em",
  maxWidth: "100%",
  textAlign: "left",
  background: "none",
  WebkitBackgroundClip: "initial",
  backgroundClip: "initial",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  gridColumn: "2",
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11.2px",
  lineHeight: 1.38,
  fontWeight: 650,
  maxWidth: "100%",
  textAlign: "left",
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const infoRowStyle: CSSProperties = {
  gridColumn: "2",
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-start",
  gap: "4px",
  minWidth: 0,
};

const heroActionsStyle: CSSProperties = {
  gridColumn: "2",
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "5px",
  marginTop: "2px",
  minWidth: 0,
  maxWidth: "100%",
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

const primaryLinkButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  minHeight: "42px",
  border: "1px solid rgba(249,115,22,0.30)",
  background: "#04000A",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 900,
  textDecoration: "none",
  textShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-secondary, #7C3AED)",
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

const copiedLinkButtonStyle: CSSProperties = {
  ...copyLinkButtonStyle,
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(34, 197, 94, 0.28)",
  color: "#86EFAC",
  boxShadow: "none",
};

const followedButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  border: "1px solid rgba(34, 197, 94, 0.28)",
  background: "rgba(34, 197, 94, 0.14)",
  color: "#86EFAC",
  boxShadow: "none",
};

const actionMessageStyle: CSSProperties = {
  gridColumn: "2",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  lineHeight: 1.25,
  fontWeight: 800,
  textAlign: "left",
  marginTop: 0,
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
  background: "#04140A",
  border: "1px solid rgba(34, 197, 94, 0.28)",
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
  color: "var(--historietas-accent, #FDBA74)",
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


const miniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "9.5px",
  fontWeight: 950,
  letterSpacing: "0.075em",
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
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
  color: "var(--historietas-accent, #F97316)",
  textTransform: "uppercase",
};

const textStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12.5px",
  lineHeight: 1.55,
  fontWeight: 650,
  textAlign: "center",
  ...safeTextStyle,
};







const fileAttachedBadgeStyle: CSSProperties = {
  ...infoBadgeStyle,
  background: "rgba(34, 197, 94, 0.14)",
  border: "1px solid rgba(34, 197, 94, 0.28)",
  color: "#86EFAC",
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

const fileHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "wrap",
  minWidth: 0,
};

const fileTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "clamp(24px, 7vw, 30px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

const fileTypeBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 9px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.14)",
  border: "1px solid rgba(34, 197, 94, 0.28)",
  color: "#86EFAC",
  fontSize: "10px",
  fontWeight: 950,
  ...safeTextStyle,
};

const fileInfoCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "74px minmax(0, 1fr)",
  gap: "12px",
  alignItems: "center",
  padding: "10px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
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
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
};

const fileNameTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "16px",
  lineHeight: 1.12,
  fontWeight: 950,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const fileMetaStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  lineHeight: 1.35,
  fontWeight: 850,
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
  background: "var(--historietas-accent, #F97316)",
  border: "1px solid rgba(255,255,255,0.10)",
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
  ...safeTextStyle,
};

const fileSecondaryButtonStyle: CSSProperties = {
  ...filePrimaryButtonStyle,
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#DDD6FE",
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
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.075em",
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
  marginTop: "10px",
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
  color: "var(--historietas-accent, #FDBA74)",
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
  color: "var(--historietas-accent, #FDBA74)",
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
};

const ratingNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "28px",
  lineHeight: 1,
  fontWeight: 950,
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
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  lineHeight: 1.1,
  fontWeight: 900,
  textTransform: "uppercase",
  textAlign: "right",
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
  background: "rgba(249, 115, 22, 0.12)",
  border: "1px solid rgba(249, 115, 22, 0.24)",
  color: "var(--historietas-accent, #F97316)",
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
  background: "var(--historietas-accent, #F97316)",
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
  ...safeTextStyle,
};







const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  borderRadius: "26px",
};

const desktopHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  gridTemplateColumns: "236px minmax(0, 1fr)",
  gap: "8px 20px",
  padding: "15px",
  alignItems: "start",
};

const desktopCoverArtStyle: CSSProperties = {
  ...coverArtStyle,
  minHeight: "396px",
  height: "100%",
  borderRadius: "22px",
  gridColumn: "auto",
  gridRow: "auto",
};

const desktopBadgeRowStyle: CSSProperties = {
  ...badgeRowStyle,
  gridColumn: "2",
  justifyContent: "flex-start",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  gridColumn: "auto",
  fontSize: "clamp(46px, 5.8vw, 78px)",
  lineHeight: 0.92,
  letterSpacing: "-0.085em",
  textAlign: "left",
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  gridColumn: "2",
  maxWidth: "760px",
  fontSize: "13px",
  lineHeight: 1.55,
  textAlign: "left",
};

const desktopInfoRowStyle: CSSProperties = {
  ...infoRowStyle,
  gridColumn: "2",
  justifyContent: "flex-start",
};

const desktopHeroActionsStyle: CSSProperties = {
  ...heroActionsStyle,
  gridColumn: "2",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  maxWidth: "520px",
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



const emptyBoxStyle: CSSProperties = {
  minHeight: "60vh",
  display: "grid",
  alignContent: "center",
  gap: "12px",
  padding: "18px",
  borderRadius: "26px",
  background:
    "linear-gradient(135deg, #08030F 0%, #04000A 58%, #020006 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  minWidth: 0,
  boxShadow: "none",
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