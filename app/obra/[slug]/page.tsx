"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { obras } from "../../data/obras";
import { supabase } from "../../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../../lib/historietasTheme";

const SAVED_RELEASES_STORAGE_KEY = "historietas-lancamentos-salvos";
const FOLLOWED_WORKS_STORAGE_KEY = "historietas-obras-seguidas";
const LIKED_WORKS_STORAGE_KEY = "historietas-obras-curtidas";
const VIEWED_WORKS_STORAGE_KEY = "historietas-obras-visualizacoes";
const RATED_WORKS_STORAGE_KEY = "historietas-obras-avaliacoes";
const LOCAL_WORKS_STORAGE_KEY = "historietas-obras";
const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";

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

  sincronizarBackupArquivosObras(obrasNormalizadas);

  localStorage.setItem(
    LOCAL_WORKS_STORAGE_KEY,
    JSON.stringify(obrasNormalizadas)
  );

  return obrasNormalizadas;
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

    localStorage.setItem(
      LOCAL_WORKS_STORAGE_KEY,
      JSON.stringify(obrasAtualizadas)
    );
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
        ? `/ler-capitulo?obraId=${obra.id}&capituloId=${capitulo.id}`
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
      salvando: true,
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
    salvando: true,
  };
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
  const [avisoAtivado, setAvisoAtivado] = useState(false);
  const [obraSeguida, setObraSeguida] = useState(false);
  const [metricasObra, setMetricasObra] =
    useState<MetricasObraPublica>(metricasObraVazias);
  const [metricasComunidadeObra, setMetricasComunidadeObra] =
    useState<MetricasComunidadeObra>(metricasComunidadeObraVazias);
  const [avaliacaoObra, setAvaliacaoObra] =
    useState<AvaliacaoObraPublica>(avaliacaoObraVazia);
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

  const obraNormalizada = obra ? normalizarTexto(obra.titulo) : "";
  const generoObraFormatado = obra
    ? formatarGeneroObraPublica(obra.genero)
    : "Não informado";
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
      const lancamentosTexto = localStorage.getItem(SAVED_RELEASES_STORAGE_KEY);
      const lancamentosJson: unknown = lancamentosTexto
        ? JSON.parse(lancamentosTexto)
        : [];

      const obrasSeguidasTexto = localStorage.getItem(FOLLOWED_WORKS_STORAGE_KEY);
      const obrasSeguidasJson: unknown = obrasSeguidasTexto
        ? JSON.parse(obrasSeguidasTexto)
        : [];

      const lancamentosSalvos = Array.isArray(lancamentosJson)
        ? lancamentosJson.filter(
            (titulo): titulo is string =>
              typeof titulo === "string" && Boolean(titulo.trim())
          )
        : [];

      const obrasSeguidas = Array.isArray(obrasSeguidasJson)
        ? obrasSeguidasJson.filter(
            (titulo): titulo is string =>
              typeof titulo === "string" && Boolean(titulo.trim())
          )
        : [];

      setAvisoAtivado(lancamentosSalvos.includes(obraNormalizada));
      setObraSeguida(obrasSeguidas.includes(obraNormalizada));
    } catch {
      setAvisoAtivado(false);
      setObraSeguida(false);
    }
  }, [obraNormalizada]);

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

  function alternarAviso() {
    if (!obraNormalizada) {
      return;
    }

    try {
      const lancamentosTexto = localStorage.getItem(SAVED_RELEASES_STORAGE_KEY);
      const lancamentosJson: unknown = lancamentosTexto
        ? JSON.parse(lancamentosTexto)
        : [];

      const lancamentosSalvos = Array.isArray(lancamentosJson)
        ? lancamentosJson.filter(
            (titulo): titulo is string =>
              typeof titulo === "string" && Boolean(titulo.trim())
          )
        : [];

      const novosLancamentos = lancamentosSalvos.includes(obraNormalizada)
        ? lancamentosSalvos.filter((titulo) => titulo !== obraNormalizada)
        : Array.from(new Set([...lancamentosSalvos, obraNormalizada]));

      localStorage.setItem(
        SAVED_RELEASES_STORAGE_KEY,
        JSON.stringify(novosLancamentos)
      );

      const ativado = novosLancamentos.includes(obraNormalizada);

      setAvisoAtivado(ativado);
      setMensagemAcao(
        ativado
          ? "Aviso ativado para novidades da obra."
          : "Aviso removido."
      );
    } catch {
      setMensagemAcao("Não foi possível salvar agora.");
    }
  }

  async function alternarSeguirObra() {
    if (!obraNormalizada) {
      return;
    }

    const seguindo = !obraSeguida;

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

      const novasObrasSeguidas = seguindo
        ? Array.from(new Set([...obrasSeguidas, obraNormalizada]))
        : obrasSeguidas.filter((titulo) => titulo !== obraNormalizada);

      localStorage.setItem(
        FOLLOWED_WORKS_STORAGE_KEY,
        JSON.stringify(novasObrasSeguidas)
      );

      setObraSeguida(seguindo);
      setMetricasObra((metricasAtuais) => ({
        ...metricasAtuais,
        seguidores: Math.max(
          0,
          metricasAtuais.seguidores + (seguindo ? 1 : -1)
        ),
      }));
      setMensagemAcao("");

      if (!obra || obra.origem !== "local" || !obra.id || !idObraSupabaseValido(obra.id)) {
        return;
      }

      const obraId = obra.id;
      const { data: usuarioData } = await supabase.auth.getUser();
      const userId = usuarioData.user?.id || "";

      if (!userId) {
        return;
      }

      const resposta = seguindo
        ? await supabase.from("seguindo_obras").upsert(
            {
              obra_id: obraId,
              user_id: userId,
            },
            { onConflict: "obra_id,user_id" }
          )
        : await supabase
            .from("seguindo_obras")
            .delete()
            .eq("obra_id", obraId)
            .eq("user_id", userId);

      if (resposta.error) {
        throw resposta.error;
      }
    } catch {
      setObraSeguida(!seguindo);
      setMetricasObra((metricasAtuais) => ({
        ...metricasAtuais,
        seguidores: Math.max(
          0,
          metricasAtuais.seguidores + (seguindo ? -1 : 1)
        ),
      }));
      setMensagemAcao("Não foi possível salvar agora.");
    }
  }

  async function alternarCurtidaObra() {
    if (!obraNormalizada) {
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
      const { data: usuarioData } = await supabase.auth.getUser();
      const userId = usuarioData.user?.id || "";

      if (!userId) {
        setMetricasObra((metricasAtuais) => ({
          ...metricasAtuais,
          curtidaAtiva: !proximaCurtidaAtiva,
          curtidas: Math.max(
            0,
            metricasAtuais.curtidas + (proximaCurtidaAtiva ? -1 : 1)
          ),
        }));
        setMensagemAcao("Entre na sua conta para curtir esta obra.");
        return;
      }

      const resposta = proximaCurtidaAtiva
        ? await supabase.from("obra_curtidas").upsert(
            {
              obra_id: obraId,
              user_id: userId,
            },
            { onConflict: "obra_id,user_id" }
          )
        : await supabase
            .from("obra_curtidas")
            .delete()
            .eq("obra_id", obraId)
            .eq("user_id", userId);

      if (resposta.error) {
        throw resposta.error;
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

  async function avaliarObra(nota: number) {
    if (!obra || nota < 0 || nota > 5) {
      return;
    }

    const notaNormalizada = nota <= 0 ? 0 : Math.round(nota * 2) / 2;

    const avaliacaoAnterior = avaliacaoObra;
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
      const { data: usuarioData } = await supabase.auth.getUser();
      const userId = usuarioData.user?.id || "";

      if (!userId) {
        setAvaliacaoObra((avaliacaoAtual) => ({
          ...avaliacaoAtual,
          salvando: false,
        }));
        return;
      }

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

      setAvaliacaoObra((avaliacaoAtual) => ({
        ...avaliacaoAtual,
        salvando: false,
      }));
      setMensagemAcao("");
    } catch {
      setAvaliacaoObra({
        ...avaliacaoAnterior,
        carregado: true,
        salvando: false,
      });
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
        <section style={isDesktop ? desktopContainerStyle : containerStyle} />
      </main>
    );
  }

  if (!obra) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${obraPageCss}`}</style>
        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <header style={isDesktop ? desktopTopStyle : topStyle}>
            <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
              <span style={logoMarkStyle}>H</span>
              <span className="historietas-theme-logo-text" style={logoTextStyle}>istorietas</span>
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
        <section style={isDesktop ? desktopContainerStyle : containerStyle} />
      </main>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${obraPageCss}`}</style>
      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTopStyle : topStyle}>
          <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
            <span style={logoMarkStyle}>H</span>
            <span className="historietas-theme-logo-text" style={logoTextStyle}>istorietas</span>
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
              <span style={authorInlineStyle}>Por {obra.autor}</span>
            </div>

            <p style={isDesktop ? desktopDescriptionStyle : descriptionStyle}>{obra.sinopse}</p>

            <div style={isDesktop ? desktopHeroActionsStyle : heroActionsStyle}>
              {obraDisponivel ? (
                <Link href="#capitulos" style={primaryLinkButtonStyle}>
                  Começar leitura
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={alternarAviso}
                  style={avisoAtivado ? savedButtonStyle : primaryButtonStyle}
                >
                  {avisoAtivado ? "✓ Aviso ativo" : "Avisar lançamento"}
                </button>
              )}

              <button
                type="button"
                onClick={alternarSeguirObra}
                style={obraSeguida ? followedButtonStyle : secondaryButtonStyle}
              >
                {obraSeguida ? "✓ Seguindo" : "Seguir obra"}
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
              rotulo="interações"
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
                  onClick={() => avaliarObra(proximaNota)}
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

          <h2 style={fileTitleStyle}>Material anexado</h2>
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
            {tipoArquivo} • {tamanhoArquivo} • Enviado em {dataArquivo}
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
  html[data-historietas-tema-visual] nav a[href="/explorar"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/explorar"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/explorar"] {
    background: var(--historietas-bottom-nav-hover-bg, var(--historietas-active-surface, rgba(249,115,22,0.16))) !important;
    border-color: color-mix(in srgb, var(--historietas-accent, #F97316) 32%, transparent) !important;
    color: var(--historietas-accent, #F97316) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/publicar"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"] {
    background: var(--historietas-bottom-nav-main-bg, linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)) !important;
    border-color: var(--historietas-bottom-nav-main-border, color-mix(in srgb, var(--historietas-accent, #F97316) 55%, transparent)) !important;
    color: #FFFFFF !important;
    box-shadow: var(--historietas-bottom-nav-main-shadow, none) !important;
  }
`;

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background:
    "radial-gradient(circle at 12% 0%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)), transparent 31%), radial-gradient(circle at 88% 14%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)), transparent 24%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 42%, var(--historietas-bg-end, #17101B) 100%)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
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
  padding: "22px 0 22px",
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
  fontSize: "23px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "calc(100% - 108px)",
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
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #F5F3FF) 0%, var(--historietas-title-mid, #F5F3FF) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "var(--historietas-logo-shadow, 0 0 26px rgba(139,92,246,0.24))",
};








const heroStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: "22px",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 14%, var(--historietas-border-soft, transparent))",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(31,16,52,0.94)) 0%, var(--historietas-surface-strong, rgba(12,7,23,0.98)) 100%)",
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
  background:
    "radial-gradient(circle at top left, color-mix(in srgb, var(--historietas-accent, #F97316) 34%, transparent), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 56%, transparent), transparent 38%), linear-gradient(135deg, #18181B 0%, #0F0F0F 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
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
  background:
    "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 86%, transparent)",
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
  right: "8px",
  bottom: "8px",
  maxWidth: "calc(100% - 16px)",
  padding: "5px 7px",
  borderRadius: "999px",
  background:
    "color-mix(in srgb, var(--historietas-accent, #F97316) 86%, transparent)",
  color: "#FFFFFF",
  fontSize: "9px",
  fontWeight: 950,
  lineHeight: 1.1,
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
  padding: "4px 7px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  color: "var(--historietas-text-primary, #E4E4E7)",
  fontSize: "8.8px",
  lineHeight: 1.1,
  fontWeight: 900,
  ...safeTextStyle,
};

const authorInlineStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "var(--historietas-accent, #FDBA74)",
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
  background:
    "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, var(--historietas-surface, transparent))",
  border:
    "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 28%, var(--historietas-border-soft, transparent))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
};

const tagBadgeStyle: CSSProperties = {
  ...infoBadgeStyle,
  background:
    "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 12%, var(--historietas-surface, transparent))",
  border:
    "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, var(--historietas-border-soft, transparent))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
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
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 48%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
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
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 82%, #111827) 100%)",
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
  textDecoration: "none",
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border:
    "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, transparent)",
  background: "var(--historietas-secondary, #7C3AED)",
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


const copyLinkButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  background:
    "color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
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

const copiedLinkButtonStyle: CSSProperties = {
  ...copyLinkButtonStyle,
  background: "color-mix(in srgb, #22C55E 12%, var(--historietas-surface, transparent))",
  border: "1px solid color-mix(in srgb, #22C55E 28%, var(--historietas-border-soft, transparent))",
  color: "color-mix(in srgb, #166534 72%, var(--historietas-text-primary, #FFFFFF))",
  boxShadow: "0 12px 30px rgba(34, 197, 94, 0.12)",
};

const savedButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  border: "1px solid rgba(34, 197, 94, 0.30)",
  background:
    "linear-gradient(135deg, rgba(34,197,94,0.22) 0%, rgba(22,163,74,0.16) 100%)",
  color: "#86EFAC",
  boxShadow: "0 14px 34px rgba(34, 197, 94, 0.14)",
};

const followedButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  border: "1px solid rgba(34, 197, 94, 0.28)",
  background: "rgba(34, 197, 94, 0.14)",
  color: "#86EFAC",
  boxShadow: "0 14px 34px rgba(34, 197, 94, 0.12)",
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
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.04))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.055))",
  padding: "7px 5px",
  display: "grid",
  gap: "3px",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "none",
  textAlign: "center",
};

const activeStatCardStyle: CSSProperties = {
  ...statCardStyle,
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(34, 197, 94, 0.26)",
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
  fontSize: "clamp(22px, 6.5vw, 31px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

const accentSectionTitleStyle: CSSProperties = {
  ...sectionTitleStyle,
  color: "var(--historietas-accent, #FDBA74)",
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
    "linear-gradient(135deg, var(--historietas-surface, rgba(33,24,50,0.82)) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.94)) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 16%, var(--historietas-border-soft, rgba(255,255,255,0.08)))",
  display: "grid",
  gap: "11px",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "var(--historietas-card-shadow, none)",
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
  color: "var(--historietas-text-primary, #FFFFFF)",
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
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
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
  boxShadow:
    "0 12px 28px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, transparent)",
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
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 10px",
  ...safeTextStyle,
};

const fileSecondaryButtonStyle: CSSProperties = {
  ...filePrimaryButtonStyle,
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.07))",
  border: "1px solid rgba(255,255,255,0.11)",
  color: "var(--historietas-text-primary, #FFFFFF)",
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
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  color: "rgba(251, 191, 36, 0.34)",
  fontSize: "22px",
  fontWeight: 950,
  lineHeight: 1,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const workRatingStarActiveStyle: CSSProperties = {
  ...workRatingStarButtonStyle,
  border: "1px solid rgba(251, 191, 36, 0.38)",
  background: "rgba(251, 191, 36, 0.12)",
  color: "#FBBF24",
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
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.04))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.055))",
  display: "grid",
  gap: "3px",
  justifyItems: "center",
  textAlign: "center",
  minWidth: 0,
  color: "inherit",
  textDecoration: "none",
  cursor: "pointer",
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
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.04))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.055))",
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
  color: "var(--historietas-accent, #FDBA74)",
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
    "linear-gradient(135deg, var(--historietas-surface, rgba(33,24,50,0.74)) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.88)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.06))",
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
  background:
    "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
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
  padding: "5px 7px",
  borderRadius: "999px",
  background:
    "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "9px",
  fontWeight: 950,
  ...safeTextStyle,
};

const chapterStatusBadgeStyle: CSSProperties = {
  ...chapterOrderBadgeStyle,
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-secondary-button-text, #E4E4E7)",
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
  gridColumn: "1",
  gridRow: "1 / span 5",
  minHeight: "304px",
  height: "304px",
  borderRadius: "21px",
};

const desktopBadgeRowStyle: CSSProperties = {
  ...badgeRowStyle,
  gridColumn: "2",
  justifyContent: "flex-start",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  gridColumn: "2",
  fontSize: "clamp(44px, 5vw, 66px)",
  lineHeight: 0.94,
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
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "8px",
  marginTop: "10px",
};



const desktopFileBoxStyle: CSSProperties = {
  ...fileBoxStyle,
  padding: "22px",
  borderRadius: "26px",
  marginTop: "14px",
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
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 10%, rgba(33,24,50,0.82)) 0%, rgba(18,12,30,0.94) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  minWidth: 0,
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(34px, 10vw, 58px)",
  lineHeight: 0.95,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  ...safeTextStyle,
};
