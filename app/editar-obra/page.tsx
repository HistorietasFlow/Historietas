"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, FormEvent } from "react";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";

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
  "Fanfic",
  "Mangá",
  "Webtoon",
  "Conto",
  "Crônica",
  "Roteiro",
  "História Original",
  "Poesia",
  "Novel",
  "Livro",
] as const;

const OPCOES_GENERO_OBRA = [
  "Ação",
  "Aventura",
  "Comédia",
  "Drama",
  "Fantasia",
  "Ficção",
  "Mistério",
  "Romance",
  "Suspense",
  "Terror",
  "Sobrenatural",
  "Histórico",
  "Biografia",
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
  "Infantil",
  "Juvenil",
  "Adulto",
] as const;

type ArquivosObrasBackup = Record<string, ArquivoObraLocal>;

function contarLetrasNumeros(texto: string) {
  return (texto.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]/g) || []).length;
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


function contarPalavras(texto: string) {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

function normalizarTexto(texto: string) {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

function criarSlugBase(titulo: string) {
  const slug = normalizarTexto(titulo)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "obra";
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

function formatarTamanhoArquivo(tamanho: number) {
  if (!Number.isFinite(tamanho) || tamanho <= 0) {
    return "0 KB";
  }

  if (tamanho >= 1024 * 1024) {
    return `${(tamanho / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(tamanho / 1024))} KB`;
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

    Object.entries(backupJson as Record<string, unknown>).forEach(([obraId, arquivo]) => {
      const arquivoNormalizado = normalizarArquivoObra(arquivo);

      if (obraId.trim() && arquivoNormalizado) {
        backupNormalizado[obraId] = arquivoNormalizado;
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

function salvarArquivoObraNoBackup(
  obraId: string,
  arquivo: ArquivoObraLocal | null
) {
  if (!obraId.trim() || typeof window === "undefined") {
    return;
  }

  try {
    const backupAtual = carregarBackupArquivosObras();

    if (arquivo) {
      backupAtual[obraId] = arquivo;
    } else {
      delete backupAtual[obraId];
    }

    localStorage.setItem(FILE_BACKUP_STORAGE_KEY, JSON.stringify(backupAtual));
  } catch {
    // Mantém o salvamento principal funcionando mesmo se o backup falhar.
  }
}

function sincronizarBackupArquivosObras(obras: ObraLocal[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const backupAtual = carregarBackupArquivosObras();

    obras.forEach((obra) => {
      if (obra.arquivoObra) {
        backupAtual[obra.id] = obra.arquivoObra;
      }
    });

    localStorage.setItem(FILE_BACKUP_STORAGE_KEY, JSON.stringify(backupAtual));
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

  const arquivoBackup = normalizarArquivoObra(backup[obra.id]);

  if (!arquivoBackup) {
    return obra;
  }

  return {
    ...obra,
    arquivoObra: arquivoBackup,
  };
}

function obterTipoArquivoTexto(arquivo: ArquivoObraLocal) {
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

function criarMiniCoverStyle(capa: string): CSSProperties {
  if (!capa) {
    return coverPlaceholderStyle;
  }

  return {
    ...coverPlaceholderStyle,
    border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
    background: "var(--historietas-input-bg, #18181B)",
    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.72) 100%), url(${capa})`,
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
    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.82) 100%), url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarDesktopPreviewCoverStyle(capa: string): CSSProperties {
  if (!capa) {
    return desktopPreviewCoverStyle;
  }

  return {
    ...desktopPreviewCoverStyle,
    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.82) 100%), url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

export default function EditarObraPage() {
  const [obraId, setObraId] = useState("");
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [obraEncontrada, setObraEncontrada] = useState(false);
  const [salvou, setSalvou] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
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

    function aplicarObraNoFormulario(obraAtual: ObraLocal) {
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
      setAutor(obraAtual.autor);
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

      setObraId(obraIdParam);

      let obrasNormalizadas: ObraLocal[] = [];

      try {
        const obrasSalvasTexto = localStorage.getItem(STORAGE_KEY);
        const obrasSalvasJson = obrasSalvasTexto
          ? JSON.parse(obrasSalvasTexto)
          : [];

        const backupArquivosObras = carregarBackupArquivosObras();

        obrasNormalizadas = Array.isArray(obrasSalvasJson)
          ? obrasSalvasJson
              .map((obra, index) =>
                normalizarObra(obra as Partial<ObraLocal>, index)
              )
              .map((obra) =>
                restaurarArquivoObraComBackup(obra, backupArquivosObras)
              )
          : [];

        sincronizarBackupArquivosObras(obrasNormalizadas);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasNormalizadas));

        const obraLocal = obrasNormalizadas.find(
          (obra) => obra.id === obraIdParam
        );

        if (!cancelado) {
          setObras(obrasNormalizadas);

          if (obraLocal) {
            aplicarObraNoFormulario(obraLocal);
          }
        }
      } catch {
        obrasNormalizadas = [];

        if (!cancelado) {
          setObras([]);
        }
      }

      try {
        const { data: dadosUsuario, error: erroUsuario } =
          await supabase.auth.getUser();

        if (erroUsuario || !dadosUsuario.user || !obraIdParam) {
          return;
        }

        const { data: obraSupabase, error: erroObraSupabase } = await supabase
          .from("obras")
          .select("*")
          .eq("id", obraIdParam)
          .eq("user_id", dadosUsuario.user.id)
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
            .select("*")
            .eq("obra_id", obraIdParam)
            .order("ordem", { ascending: true });

        if (erroCapitulosSupabase) {
          console.warn(
            "Não consegui carregar capítulos da obra no Supabase:",
            erroCapitulosSupabase.message
          );
        }

        const obraLocal = obrasNormalizadas.find(
          (obra) => obra.id === obraIdParam
        );
        const obraNormalizadaSupabase = normalizarObraSupabase(
          obraSupabase as ObraSupabaseRow,
          Array.isArray(capitulosSupabase)
            ? (capitulosSupabase as CapituloSupabaseRow[])
            : [],
          obraLocal,
          0
        );

        const obrasAtualizadas = [
          obraNormalizadaSupabase,
          ...obrasNormalizadas.filter((obra) => obra.id !== obraIdParam),
        ];

        sincronizarBackupArquivosObras(obrasAtualizadas);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasAtualizadas));

        if (!cancelado) {
          setObras(obrasAtualizadas);
          aplicarObraNoFormulario(obraNormalizadaSupabase);
        }
      } catch (erroSupabase) {
        console.warn("Falha ao carregar dados do Supabase:", erroSupabase);
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    carregarObra();

    return () => {
      cancelado = true;
    };
  }, []);

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
  const totalTagsSelecionadas = tagsTratadas.length;
  const limiteTagsAtingido = totalTagsSelecionadas >= LIMITE_TAGS_OBRA;
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

  const totalPalavrasSinopse = useMemo(() => contarPalavras(sinopse), [sinopse]);
  const totalCaracteresSinopse = sinopse.length;
  const arquivoObraTipoTexto = arquivoObra
    ? obterTipoArquivoTexto(arquivoObra)
    : "Arquivo";
  const arquivoObraTamanhoTexto = arquivoObra
    ? formatarTamanhoArquivo(arquivoObra.tamanho)
    : "0 KB";

  const alteracoesPendentes = useMemo(() => {
    if (!obraAtual) {
      return false;
    }

    return (
      titulo !== obraAtual.titulo ||
      autor !== obraAtual.autor ||
      generoFinal !== obraAtual.genero ||
      formatoFinal !== obraAtual.formato ||
      classificacaoIndicativa !== obraAtual.classificacaoIndicativa ||
      sinopse !== obraAtual.sinopse ||
      tagsTratadas.join(", ") !== obraAtual.tags.slice(0, LIMITE_TAGS_OBRA).join(", ") ||
      capa !== obraAtual.capa ||
      capaNome !== obraAtual.capaNome ||
      JSON.stringify(arquivoObra || null) !==
        JSON.stringify(obraAtual.arquivoObra || null)
    );
  }, [
    obraAtual,
    titulo,
    autor,
    generoFinal,
    formatoFinal,
    classificacaoIndicativa,
    sinopse,
    tagsTratadas,
    capa,
    capaNome,
    arquivoObra,
  ]);

  const minhaObraHref = `/minha-obra?obraId=${obraId}`;
  const adicionarCapituloHref = `/adicionar-capitulo?obraId=${obraId}`;

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
    const autorLimpo = autor.trim();
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

  function tagEstaSelecionada(tag: string) {
    return tagsTratadas.some((tagAtual) => {
      return normalizarTexto(tagAtual) === normalizarTexto(tag);
    });
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

    if (tagEstaSelecionada(tag) || limiteTagsAtingido) {
      return;
    }

    setUsarTagPersonalizada(false);
    setTagPersonalizada("");
    setTags(tag);
    marcarAlteracao();
  }

  function removerTagSelecionada(tag: string) {
    const tagNormalizada = normalizarTexto(tag);
    const novasTags = tagsTratadas.filter((tagAtual) => {
      return normalizarTexto(tagAtual) !== tagNormalizada;
    });

    setTags(novasTags.join(", "));

    if (usarTagPersonalizada) {
      setUsarTagPersonalizada(false);
      setTagPersonalizada("");
    }

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

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    setProcessando(true);
    setErro("");

    const tituloFinal = titulo.trim();
    const autorFinal = autor.trim();
    const generoFinalSalvo = generoFinal;
    const formatoFinalSalvo = formatoFinal;
    const classificacaoFinal = classificacaoIndicativa.trim();
    const sinopseFinal = sinopse.trim();
    const tagsFinais = tagsTratadas.length > 0 ? tagsTratadas : ["sem tags"];
    const agora = new Date().toISOString();

    try {
      const backupArquivosObras = carregarBackupArquivosObras();
      const obraLocalAtual = obras.find((obra) => obra.id === obraId) || null;

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
        const { data: dadosUsuario, error: erroUsuario } =
          await supabase.auth.getUser();

        if (!erroUsuario && dadosUsuario.user && obraId) {
          const userId = dadosUsuario.user.id;

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

      localStorage.setItem(STORAGE_KEY, JSON.stringify(novasObras));

      if (arquivoObraRemovidoManualmente) {
        salvarArquivoObraNoBackup(obraId, null);
      } else {
        sincronizarBackupArquivosObras(novasObras);
      }

      setObras(novasObras);
      setCapa(capaFinal);
      setCapaNome(capaNomeFinal);
      setCapaArquivo(null);
      setArquivoObra(arquivoObraFinal);
      setArquivoObraArquivo(null);
      setArquivoObraRemovidoManualmente(false);
      setSalvou(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
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
        <section style={isDesktop ? desktopContainerStyle : containerStyle} />
      </main>
    );
  }

  if (!obraEncontrada) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${editarObraPageCss}`}</style>
        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <header style={isDesktop ? desktopTopStyle : topStyle}>
            <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
              <span style={logoMarkStyle}>H</span>
              <span className="historietas-theme-logo-text" style={logoTextStyle}>istorietas</span>
            </Link>

            <span style={pagePillStyle}>Editor da obra</span>
          </header>

          <div style={emptyBoxStyle}>
            <h1 style={emptyTitleStyle}>Obra não encontrada</h1>

            <p style={emptyTextStyle}>
              Não encontrei essa obra na sua biblioteca.
            </p>

            <Link href="/minhas-obras" style={emptyButtonStyle}>
              Voltar para Minhas Obras
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${editarObraPageCss}`}</style>
      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTopStyle : topStyle}>
          <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
            <span style={logoMarkStyle}>H</span>
            <span className="historietas-theme-logo-text" style={logoTextStyle}>istorietas</span>
          </Link>

          <span style={pagePillStyle}>Editor da obra</span>
        </header>

        <section style={isDesktop ? desktopHeroBoxStyle : heroBoxStyle}>
          <h1 className="historietas-theme-title" style={isDesktop ? desktopTitleStyle : titleStyle}>Editar obra</h1>

          <p style={isDesktop ? desktopDescriptionStyle : descriptionStyle}>
            {titulo.trim() || "Obra sem título"} • {obraAtual?.capitulos.length || 0} capítulos
          </p>

          <div style={isDesktop ? desktopProgressBoxStyle : progressBoxStyle}>
            <div style={progressTopStyle}>
              <span style={progressLabelStyle}>Progresso</span>

              <strong style={progressNumberStyle}>{progresso}%</strong>
            </div>

            <div style={progressTrackStyle}>
              <div style={{ ...progressFillStyle, width: `${progresso}%` }} />
            </div>
          </div>
        </section>

        {erro && (
          <section style={errorBoxStyle}>
            <h2 style={errorTitleStyle}>Não foi possível salvar</h2>

            <p style={errorTextStyle}>{erro}</p>
          </section>
        )}

        {salvou && (
          <section style={successBoxStyle}>
            <div style={{ minWidth: 0 }}>
              <h2 style={successTitleStyle}>✓ Obra atualizada</h2>

              <p style={successTextStyle}>
                As alterações foram salvas sem apagar os capítulos.
              </p>
            </div>

            <div style={successActionsStyle}>
              <Link href={minhaObraHref} style={successPrimaryButtonStyle}>
                Ver obra
              </Link>

              <Link href="/minhas-obras" style={successSecondaryButtonStyle}>
                Minhas Obras
              </Link>
            </div>
          </section>
        )}

        <section style={isDesktop ? desktopMainGridStyle : mainGridStyle}>
          <form onSubmit={salvarEdicao} style={isDesktop ? desktopFormStyle : formStyle}>
            <div style={isDesktop ? desktopFormHeaderStyle : formHeaderStyle}>
              <span style={formMiniTitleStyle}>
                {alteracoesPendentes ? "ALTERAÇÕES PENDENTES" : "DADOS DA OBRA"}
              </span>

              <h2 style={isDesktop ? desktopFormTitleStyle : formTitleStyle}>Informações principais</h2>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Capa da obra</label>

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
                    {capa && <div style={previewCoverGlowStyle} />}

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

                  {capaNome && <span style={fileNameStyle}>{capaNome}</span>}

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
                <div style={fileIconBoxStyle}>
                  {arquivoObra?.categoria === "imagem" ? (
                    <img
                      src={arquivoObra.conteudo}
                      alt={arquivoObra.nome}
                      style={filePreviewImageStyle}
                    />
                  ) : (
                    <span style={fileIconStyle}>▣</span>
                  )}
                </div>

                <div style={coverUploadContentStyle}>
                  <strong style={coverUploadTitleStyle}>
                    {arquivoObra ? "Arquivo atual da obra" : "Anexar arquivo da obra"}
                  </strong>

                  <span style={hintStyle}>
                    Opcional. Troque ou remova PDF, TXT, MD ou imagem. Máximo: 2 MB.
                  </span>

                  {arquivoObra && (
                    <span style={fileNameStyle}>
                      {arquivoObra.nome} • {arquivoObraTipoTexto} • {arquivoObraTamanhoTexto}
                    </span>
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

              {arquivoObra && (
                <div style={fieldStatsBoxStyle}>
                  <span style={fieldStatItemStyle}>{arquivoObraTipoTexto}</span>
                  <span style={fieldStatItemStyle}>{arquivoObraTamanhoTexto}</span>
                  <span style={fieldStatOkStyle}>arquivo anexado à obra</span>
                </div>
              )}
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
                value=""
                onChange={(event) => {
                  adicionarTagSelecionada(event.target.value);
                }}
                style={inputStyle}
                disabled={limiteTagsAtingido && !usarTagPersonalizada}
              >
                <option value="">
                  {limiteTagsAtingido ? "Tag escolhida" : "Escolha uma tag"}
                </option>

                {OPCOES_TAGS_OBRA.filter((tag) => !tagEstaSelecionada(tag)).map(
                  (tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  )
                )}

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

              {tagsTratadas.length > 0 && (
                <div style={tagPreviewBoxStyle}>
                  {tagsTratadas.map((tag, index) => (
                    <button
                      key={`edit-tag-${tag}-${index}`}
                      type="button"
                      onClick={() => removerTagSelecionada(tag)}
                      style={selectedTagButtonStyle}
                      aria-label={`Remover tag ${tag}`}
                    >
                      {tag} ×
                    </button>
                  ))}
                </div>
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

              <div style={fieldStatsBoxStyle}>
                <span style={fieldStatItemStyle}>
                  {totalCaracteresSinopse} caracteres
                </span>

                <span style={fieldStatItemStyle}>
                  {totalPalavrasSinopse} palavras
                </span>

                <span
                  style={
                    contarLetrasNumeros(sinopse.trim()) >= 20
                      ? fieldStatOkStyle
                      : fieldStatWarningStyle
                  }
                >
                  {contarLetrasNumeros(sinopse.trim()) >= 20
                    ? "Sinopse ok"
                    : "Sinopse curta"}
                </span>
              </div>
            </div>

            <div style={isDesktop ? desktopButtonAreaStyle : buttonAreaStyle}>
              <button
                type="submit"
                style={processando ? (isDesktop ? desktopDisabledButtonStyle : disabledButtonStyle) : (isDesktop ? desktopSaveButtonStyle : saveButtonStyle)}
                disabled={processando}
              >
                {processando ? "Salvando..." : "Salvar alterações"}
              </button>

              <Link href={minhaObraHref} style={isDesktop ? desktopSecondaryButtonStyle : secondaryButtonStyle}>
                Ver obra
              </Link>

              <Link href="/minhas-obras" style={isDesktop ? desktopCancelButtonStyle : cancelButtonStyle}>
                Cancelar
              </Link>
            </div>
          </form>

          <aside style={isDesktop ? desktopPreviewPanelStyle : previewPanelStyle}>
            <div style={previewHeaderStyle}>
              <span style={previewMiniTitleStyle}>PRÉVIA DA OBRA</span>

              <h2 style={previewTitleStyle}>Como vai aparecer</h2>
            </div>

            <div style={isDesktop ? desktopPreviewBodyStyle : previewBodyStyle}>
              <div style={isDesktop ? criarDesktopPreviewCoverStyle(capa) : criarPreviewCoverStyle(capa)}>
                <div style={previewCoverGlowStyle} />

                <span style={previewGenreStyle}>
                  {generoFinal || "Gênero"}
                </span>

                <div style={previewCoverBottomStyle}>
                  <strong style={previewCoverNumberStyle}>
                    {obraAtual?.capitulos.length || 0}
                  </strong>

                  <span style={previewCoverTextStyle}>
                    {(obraAtual?.capitulos.length || 0) === 1
                      ? "capítulo"
                      : "capítulos"}
                  </span>
                </div>
              </div>

              <div style={isDesktop ? desktopPreviewContentStyle : previewContentStyle}>
                <div style={previewBadgesStyle}>
                  <span style={previewBadgeStyle}>
                    {formatoFinal || "Formato"}
                  </span>

                  <span
                    style={
                      obraAtual?.publicado
                        ? previewPublishedBadgeStyle
                        : previewDraftBadgeStyle
                    }
                  >
                    {obraAtual?.publicado ? "Publicado" : "Rascunho"}
                  </span>

                  <span style={previewRatingBadgeStyle}>
                    {classificacaoIndicativa === "Não informada" ||
                    classificacaoIndicativa === "Não informado"
                      ? "Livre"
                      : classificacaoIndicativa || "Livre"}
                  </span>

                  {arquivoObra && (
                    <span style={previewFileBadgeStyle}>Arquivo anexado</span>
                  )}
                </div>

                <h3 style={previewObraTitleStyle}>
                  {titulo.trim() || "Obra sem título"}
                </h3>

                <p style={previewAuthorStyle}>
                  Por {autor.trim() || "Autor não informado"}
                </p>

                <p style={previewSinopseStyle}>
                  {sinopse.trim() || "Nenhuma sinopse informada."}
                </p>

                {arquivoObra && (
                  <div style={previewFileBoxStyle}>
                    <span style={previewFileMiniStyle}>ARQUIVO DA OBRA</span>

                    <strong style={previewFileTitleStyle}>{arquivoObra.nome}</strong>

                    <span style={previewFileTextStyle}>
                      {arquivoObraTipoTexto} • {arquivoObraTamanhoTexto}
                    </span>
                  </div>
                )}

                <div style={previewTagsStyle}>
                  {tagsPreview.slice(0, 1).map((tag, index) => (
                    <span key={`${tag}-${index}`} style={previewTagStyle}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}

const editarObraPageCss = `
  html[data-historietas-tema-visual] nav a[href="/minhas-obras"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/minhas-obras"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/minhas-obras"] {
    background: var(--historietas-bottom-nav-hover-bg, var(--historietas-active-surface, rgba(249,115,22,0.16))) !important;
    border-color: color-mix(in srgb, var(--historietas-accent, #F97316) 32%, transparent) !important;
    color: var(--historietas-accent, #F97316) !important;
  }

  html[data-historietas-tema-visual="branco"] button:disabled {
    opacity: 1 !important;
    background: #F1F3F4 !important;
    border-color: #DADCE0 !important;
    color: #5F6368 !important;
    cursor: not-allowed !important;
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
  width: "min(860px, calc(100% - 32px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "18px 0 calc(100px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  marginBottom: "14px",
  flexWrap: "wrap",
  minWidth: 0,
};

const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "24px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "min(100%, calc(100% - 162px))",
  overflow: "visible",
  ...safeTextStyle,
};

const logoMarkStyle: CSSProperties = {
  width: "31px",
  height: "31px",
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
  overflow: "visible",
  whiteSpace: "nowrap",
};

const pagePillStyle: CSSProperties = {
  minHeight: "36px",
  padding: "0 13px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 11%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, rgba(255,255,255,0.08))",
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

const heroBoxStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
  gap: "10px",
  padding: "18px 16px",
  borderRadius: "24px",
  background:
    "radial-gradient(circle at 14% 0%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)), transparent 34%), linear-gradient(135deg, var(--historietas-surface, rgba(12,7,23,0.98)) 0%, var(--historietas-surface-strong, rgba(12,7,23,0.99)) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 14%, var(--historietas-border-soft, transparent))",
  boxShadow: "var(--historietas-hero-shadow, none)",
  minWidth: 0,
  overflow: "hidden",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(34px, 9vw, 54px)",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.06em",
  maxWidth: "100%",
  paddingBottom: "2px",
  background: "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 45%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  lineHeight: 1.55,
  fontWeight: 750,
  maxWidth: "620px",
  textAlign: "center",
  ...safeTextStyle,
};

const progressBoxStyle: CSSProperties = {
  width: "100%",
  maxWidth: "520px",
  display: "grid",
  gap: "6px",
  padding: "8px",
  borderRadius: "15px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.048))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.075))",
  minWidth: 0,
  overflow: "hidden",
  boxSizing: "border-box",
};

const progressTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
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
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.1))",
};

const progressFillStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(90deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  transition: "width 0.2s ease",
};

const errorBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: "14px",
  borderRadius: "20px",
  background: "var(--historietas-danger-surface, rgba(239,68,68,0.12))",
  border: "1px solid color-mix(in srgb, #EF4444 30%, var(--historietas-border-soft, transparent))",
  display: "grid",
  gap: "7px",
  minWidth: 0,
  overflow: "hidden",
};

const errorTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-danger-button-text, #FCA5A5)",
  fontSize: "22px",
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

const errorTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-danger-button-text, #FECACA)",
  fontSize: "13px",
  lineHeight: 1.6,
  fontWeight: 750,
  ...safeTextStyle,
};

const successBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: "14px",
  borderRadius: "20px",
  background: "color-mix(in srgb, #22C55E 12%, var(--historietas-surface, transparent))",
  border: "1px solid color-mix(in srgb, #22C55E 28%, var(--historietas-border-soft, transparent))",
  display: "grid",
  gap: "12px",
  minWidth: 0,
  overflow: "hidden",
};

const successTitleStyle: CSSProperties = {
  margin: 0,
  color: "color-mix(in srgb, #166534 72%, var(--historietas-text-primary, #FFFFFF))",
  fontSize: "22px",
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

const successTextStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.6,
  fontWeight: 700,
  ...safeTextStyle,
};

const successActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "8px",
  minWidth: 0,
};

const successPrimaryButtonStyle: CSSProperties = {
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
  padding: "0 11px",
  boxShadow: "none",
  ...safeTextStyle,
};

const successSecondaryButtonStyle: CSSProperties = {
  minHeight: "44px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 11px",
  ...safeTextStyle,
};

const mainGridStyle: CSSProperties = {
  marginTop: "12px",
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  minWidth: 0,
};

const formStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: "12px",
  borderRadius: "22px",
  background: "var(--historietas-surface, rgba(18,12,30,0.86))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  boxShadow: "var(--historietas-card-shadow, none)",
  minWidth: 0,
  overflow: "hidden",
};

const formHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const formMiniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const formTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "26px",
  lineHeight: 1.14,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  paddingBottom: "1px",
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
  fontSize: "14px",
  fontWeight: 900,
  ...safeTextStyle,
};

const hiddenInputStyle: CSSProperties = {
  display: "none",
};

const coverUploadBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "80px minmax(0, 1fr)",
  gap: "10px",
  alignItems: "stretch",
  padding: "9px",
  borderRadius: "18px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.043))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.075))",
  minWidth: 0,
  overflow: "hidden",
};

const coverUploadPreviewStyle: CSSProperties = {
  minWidth: 0,
};

const fileUploadBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "80px minmax(0, 1fr)",
  gap: "10px",
  alignItems: "stretch",
  padding: "9px",
  borderRadius: "18px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, transparent) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 18%, rgba(255,255,255,0.08))",
  minWidth: 0,
  overflow: "hidden",
};

const fileIconBoxStyle: CSSProperties = {
  minHeight: "92px",
  borderRadius: "15px",
  position: "relative",
  overflow: "hidden",
  background:
    "radial-gradient(circle at top left, color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 46%, transparent), transparent 38%), linear-gradient(135deg, #18181B 0%, #0F0F0F 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 0,
};

const fileIconStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  fontWeight: 950,
};

const filePreviewImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const coverPlaceholderStyle: CSSProperties = {
  minHeight: "112px",
  borderRadius: "15px",
  position: "relative",
  background:
    "radial-gradient(circle at top left, color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 46%, transparent), transparent 38%), linear-gradient(135deg, #18181B 0%, #0F0F0F 100%)",
  border: "1px dashed rgba(255,255,255,0.16)",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  gap: "5px",
  minWidth: 0,
  overflow: "hidden",
};

const coverPlaceholderIconStyle: CSSProperties = {
  width: "32px",
  height: "32px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
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
  gap: "7px",
  minWidth: 0,
};

const coverUploadTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "16px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
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
  minHeight: "34px",
  padding: "0 11px",
  borderRadius: "999px",
  border: "none",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  ...safeTextStyle,
};

const removeCoverButtonStyle: CSSProperties = {
  minHeight: "34px",
  padding: "0 11px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  ...safeTextStyle,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "46px",
  borderRadius: "16px",
  border: "1px solid var(--historietas-border-soft, #3F3F46)",
  background: "var(--historietas-input-bg, #18181B)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 13px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 650,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  ...safeTextStyle,
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "118px",
  resize: "vertical",
  borderRadius: "18px",
  border: "1px solid var(--historietas-border-soft, #3F3F46)",
  background: "var(--historietas-input-bg, #18181B)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "13px",
  outline: "none",
  fontSize: "13px",
  lineHeight: 1.55,
  fontWeight: 650,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  ...safeTextStyle,
};

const hintStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  lineHeight: 1.45,
  fontWeight: 650,
  ...safeTextStyle,
};

const fieldStatsBoxStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  minWidth: 0,
};

const fieldStatItemStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 8px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.07))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 900,
  ...safeTextStyle,
};

const fieldStatOkStyle: CSSProperties = {
  ...fieldStatItemStyle,
  background: "color-mix(in srgb, #22C55E 12%, var(--historietas-surface, transparent))",
  border: "1px solid color-mix(in srgb, #22C55E 28%, var(--historietas-border-soft, transparent))",
  color: "color-mix(in srgb, #166534 72%, var(--historietas-text-primary, #FFFFFF))",
};

const fieldStatWarningStyle: CSSProperties = {
  ...fieldStatItemStyle,
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 25%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
};

const tagPreviewBoxStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
};

const selectedTagButtonStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  minHeight: "32px",
  padding: "0 10px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 58%, transparent)",
  color: "#FFFFFF",
  fontSize: "10.5px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "center",
  boxSizing: "border-box",
  ...safeTextStyle,
};


const buttonAreaStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "9px",
  marginTop: "2px",
  minWidth: 0,
};

const saveButtonStyle: CSSProperties = {
  minHeight: "48px",
  borderRadius: "999px",
  border: "none",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 12px",
  ...safeTextStyle,
};

const disabledButtonStyle: CSSProperties = {
  ...saveButtonStyle,
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  cursor: "not-allowed",
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: "46px",
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

const cancelButtonStyle: CSSProperties = {
  minHeight: "46px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 12px",
  ...safeTextStyle,
};

const previewPanelStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  background:
    "linear-gradient(180deg, var(--historietas-surface, rgba(25,13,43,0.94)) 0%, var(--historietas-surface-strong, rgba(12,7,22,0.96)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  borderRadius: "24px",
  padding: "14px",
  minWidth: 0,
  overflow: "hidden",
};

const previewHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  minWidth: 0,
  flexWrap: "wrap",
};

const previewMiniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const previewTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "24px",
  lineHeight: 1.18,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  paddingBottom: "1px",
  ...safeTextStyle,
};

const previewCoverStyle: CSSProperties = {
  minHeight: "226px",
  borderRadius: "20px",
  position: "relative",
  overflow: "hidden",
  background:
    "radial-gradient(circle at 18% 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent), transparent 34%), radial-gradient(circle at 100% 100%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 42%, transparent), transparent 42%), linear-gradient(145deg, #18111F 0%, #0B0614 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.11))",
  minWidth: 0,
  boxSizing: "border-box",
};

const previewCoverGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.72) 100%)",
};

const previewGenreStyle: CSSProperties = {
  position: "absolute",
  top: "10px",
  left: "10px",
  maxWidth: "calc(100% - 20px)",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "rgba(15,10,26,0.74)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 950,
  textAlign: "left",
  ...safeTextStyle,
};


const previewCoverBottomStyle: CSSProperties = {
  position: "absolute",
  left: "12px",
  right: "12px",
  bottom: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "9px",
  padding: "9px 10px",
  borderRadius: "16px",
  background: "rgba(8,5,14,0.68)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  minWidth: 0,
  boxSizing: "border-box",
};

const previewCoverNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "30px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.065em",
  ...safeTextStyle,
};

const previewCoverTextStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  textAlign: "right",
  ...safeTextStyle,
};

const previewBodyStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  minWidth: 0,
  maxWidth: "100%",
  padding: "10px",
  borderRadius: "22px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.045))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.085))",
  boxSizing: "border-box",
  overflow: "hidden",
};

const previewContentStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: "9px",
  minWidth: 0,
  maxWidth: "100%",
  padding: "2px",
  boxSizing: "border-box",
};

const previewBadgesStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  minWidth: 0,
  alignItems: "center",
};

const previewBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 8px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.065))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-primary, #E4E4E7)",
  fontSize: "10px",
  lineHeight: 1.1,
  fontWeight: 950,
  ...safeTextStyle,
};

const previewRatingBadgeStyle: CSSProperties = {
  ...previewBadgeStyle,
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 26%, transparent)",
  color: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 36%, #FFFFFF)",
};

const previewDraftBadgeStyle: CSSProperties = {
  ...previewBadgeStyle,
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
};

const previewPublishedBadgeStyle: CSSProperties = {
  ...previewBadgeStyle,
  background: "color-mix(in srgb, #22C55E 12%, var(--historietas-surface, transparent))",
  border: "1px solid color-mix(in srgb, #22C55E 28%, var(--historietas-border-soft, transparent))",
  color: "color-mix(in srgb, #166534 72%, var(--historietas-text-primary, #FFFFFF))",
};

const previewFileBadgeStyle: CSSProperties = {
  ...previewBadgeStyle,
  background: "color-mix(in srgb, #22C55E 12%, var(--historietas-surface, transparent))",
  border: "1px solid color-mix(in srgb, #22C55E 28%, var(--historietas-border-soft, transparent))",
  color: "color-mix(in srgb, #166534 72%, var(--historietas-text-primary, #FFFFFF))",
};

const previewObraTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(24px, 4.8vw, 34px)",
  lineHeight: 1.16,
  fontWeight: 950,
  letterSpacing: "-0.05em",
  maxWidth: "100%",
  paddingBottom: "2px",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 58%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  ...safeTextStyle,
};

const previewAuthorStyle: CSSProperties = {
  margin: "-3px 0 0",
  color: "var(--historietas-secondary-button-text, #C4B5FD)",
  fontSize: "12px",
  lineHeight: 1.4,
  fontWeight: 900,
  maxWidth: "100%",
  ...safeTextStyle,
};

const previewSinopseStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  lineHeight: 1.62,
  fontWeight: 650,
  whiteSpace: "pre-wrap",
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 4,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const previewFileBoxStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  padding: "9px 10px",
  borderRadius: "15px",
  background: "rgba(34,197,94,0.09)",
  border: "1px solid rgba(34,197,94,0.18)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
};

const previewFileMiniStyle: CSSProperties = {
  color: "color-mix(in srgb, #166534 72%, var(--historietas-text-primary, #FFFFFF))",
  fontSize: "9px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const previewFileTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14px",
  lineHeight: 1.2,
  fontWeight: 950,
  ...safeTextStyle,
};

const previewFileTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.35,
  fontWeight: 750,
  ...safeTextStyle,
};

const previewTagsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  marginTop: "1px",
};

const previewTagStyle: CSSProperties = {
  maxWidth: "100%",
  padding: "6px 8px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, transparent)",
  color: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 36%, #FFFFFF)",
  fontSize: "10px",
  fontWeight: 900,
  ...safeTextStyle,
};

const emptyBoxStyle: CSSProperties = {
  marginTop: "24px",
  borderRadius: "26px",
  background: "var(--historietas-surface, rgba(31,31,35,0.96))",
  border: "1px solid var(--historietas-border-soft, #2D2D32)",
  padding: "22px",
  display: "grid",
  gap: "12px",
  minWidth: 0,
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
  minHeight: "50px",
  borderRadius: "999px",
  background: "var(--historietas-secondary, #7C3AED)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 12px",
  ...safeTextStyle,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "22px 0 96px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  flexWrap: "nowrap",
  marginBottom: "16px",
};

const desktopHeroBoxStyle: CSSProperties = {
  ...heroBoxStyle,
  gap: "12px",
  padding: "24px 30px",
  borderRadius: "28px",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  fontSize: "clamp(42px, 4.5vw, 62px)",
  lineHeight: 1.08,
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  fontSize: "14px",
  lineHeight: 1.55,
};

const desktopProgressBoxStyle: CSSProperties = {
  ...progressBoxStyle,
  maxWidth: "560px",
  padding: "11px",
  borderRadius: "18px",
};

const desktopMainGridStyle: CSSProperties = {
  ...mainGridStyle,
  gridTemplateColumns: "1fr",
  alignItems: "stretch",
  gap: "16px",
  marginTop: "16px",
};

const desktopFormStyle: CSSProperties = {
  ...formStyle,
  padding: "16px",
  borderRadius: "24px",
  gap: "13px",
};

const desktopFormHeaderStyle: CSSProperties = {
  ...formHeaderStyle,
  gap: "5px",
};

const desktopFormTitleStyle: CSSProperties = {
  ...formTitleStyle,
  fontSize: "28px",
};

const desktopCoverUploadBoxStyle: CSSProperties = {
  ...coverUploadBoxStyle,
  gridTemplateColumns: "90px minmax(0, 1fr)",
  padding: "10px",
  gap: "12px",
};

const desktopFileUploadBoxStyle: CSSProperties = {
  ...fileUploadBoxStyle,
  gridTemplateColumns: "90px minmax(0, 1fr)",
  padding: "10px",
  gap: "12px",
};

const desktopDoubleFieldStyle: CSSProperties = {
  ...doubleFieldStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
};

const desktopTextareaStyle: CSSProperties = {
  ...textareaStyle,
  minHeight: "140px",
};

const desktopButtonAreaStyle: CSSProperties = {
  ...buttonAreaStyle,
  gridTemplateColumns: "190px 140px 130px",
  justifyContent: "start",
  gap: "10px",
};

const desktopSaveButtonStyle: CSSProperties = {
  ...saveButtonStyle,
  minHeight: "44px",
  fontSize: "12px",
};

const desktopDisabledButtonStyle: CSSProperties = {
  ...disabledButtonStyle,
  minHeight: "44px",
  fontSize: "12px",
};

const desktopSecondaryButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  minHeight: "44px",
  fontSize: "12px",
};

const desktopCancelButtonStyle: CSSProperties = {
  ...cancelButtonStyle,
  minHeight: "44px",
  fontSize: "12px",
};

const desktopPreviewPanelStyle: CSSProperties = {
  ...previewPanelStyle,
  width: "100%",
  margin: "0",
  padding: "16px",
  borderRadius: "24px",
  gap: "12px",
};

const desktopPreviewBodyStyle: CSSProperties = {
  ...previewBodyStyle,
  gridTemplateColumns: "176px minmax(0, 1fr)",
  gap: "16px",
  alignItems: "stretch",
  padding: "12px",
  borderRadius: "22px",
};

const desktopPreviewContentStyle: CSSProperties = {
  ...previewContentStyle,
  alignSelf: "stretch",
  alignContent: "center",
  gap: "9px",
  padding: "4px 6px 4px 0",
  boxSizing: "border-box",
};

const desktopPreviewCoverStyle: CSSProperties = {
  ...previewCoverStyle,
  width: "176px",
  minHeight: "244px",
  height: "244px",
  borderRadius: "20px",
};