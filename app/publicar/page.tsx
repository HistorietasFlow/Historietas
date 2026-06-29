"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties } from "react";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { criarSlugBase, formatarTamanhoArquivo, normalizarTexto } from "../../lib/utils";
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

type CapituloSalvo = Partial<CapituloLocal> & Record<string, unknown>;

type ObraSalva = Partial<ObraLocal> & {
  capitulos?: CapituloSalvo[];
} & Record<string, unknown>;

const STORAGE_KEY = "historietas-obras";
const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";
const TAMANHO_MAXIMO_CAPA = 2 * 1024 * 1024;
const TAMANHO_MAXIMO_ARQUIVO_TEXTO = 900 * 1024;
const TAMANHO_MAXIMO_ARQUIVO_OBRA = 5 * 1024 * 1024;

const OUTRO_FORMATO_VALUE = "__outro_formato__";
const OUTRO_GENERO_VALUE = "__outro_genero__";
const OUTRA_TAG_VALUE = "__outra_tag__";
const LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO = 14;
const LIMITE_CARACTERES_TAG_PERSONALIZADA = 10;

const LIMITE_TAGS_OBRA = 1;
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

const CLASSIFICACOES_INDICATIVAS_OBRA = [
  "Livre",
  "10+",
  "12+",
  "14+",
  "16+",
  "18+",
] as const;

function criarStorageKeyUsuarioPublicar(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : chave;
}

function lerStorageUsuarioPublicar(chave: string, userId: string) {
  if (typeof window === "undefined" || !userId.trim()) {
    return null;
  }

  try {
    return localStorage.getItem(criarStorageKeyUsuarioPublicar(chave, userId));
  } catch {
    return null;
  }
}

function salvarJsonStorageUsuarioPublicar(
  chave: string,
  userId: string,
  valor: unknown
) {
  if (typeof window === "undefined" || !userId.trim()) {
    return;
  }

  try {
    localStorage.setItem(
      criarStorageKeyUsuarioPublicar(chave, userId),
      JSON.stringify(valor)
    );
  } catch {
    // localStorage é fallback; a publicação principal fica no Supabase.
  }
}

function normalizarClassificacaoIndicativaPublicar(valor: string) {
  const valorLimpo = valor.trim();
  const valorNormalizado = normalizarTexto(valorLimpo);

  if (valorNormalizado === "livre" || valorNormalizado === "l") {
    return "Livre";
  }

  const classificacaoEncontrada = CLASSIFICACOES_INDICATIVAS_OBRA.find(
    (classificacao) =>
      normalizarTexto(classificacao) === valorNormalizado ||
      normalizarTexto(classificacao.replace("+", "")) === valorNormalizado,
  );

  return classificacaoEncontrada || "";
}


function gerarUuidFallback() {
  const bytes = new Uint8Array(16);
  const cryptoGlobal =
    typeof globalThis !== "undefined" && "crypto" in globalThis
      ? globalThis.crypto
      : null;

  if (cryptoGlobal && typeof cryptoGlobal.getRandomValues === "function") {
    cryptoGlobal.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));

  return `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-${hex[4]}${hex[5]}-${hex[6]}${hex[7]}-${hex[8]}${hex[9]}-${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`;
}

function criarUuidSeguro() {
  const cryptoGlobal =
    typeof globalThis !== "undefined" && "crypto" in globalThis
      ? globalThis.crypto
      : null;

  if (cryptoGlobal && typeof cryptoGlobal.randomUUID === "function") {
    return cryptoGlobal.randomUUID();
  }

  return gerarUuidFallback();
}

function criarId() {
  return criarUuidSeguro();
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
  const caminho = `${userId}/${Date.now()}-${criarId()}-${limparNomeArquivoStorage(
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

async function criarSlugUnicoSupabase(
  titulo: string,
  obrasExistentes: ObraLocal[]
) {
  const slugLocal = criarSlugUnico(titulo, obrasExistentes);
  const slugBase = criarSlugBase(slugLocal);
  let contador = 1;

  while (contador <= 20) {
    const slugAtual = contador === 1 ? slugBase : `${slugBase}-${contador}`;

    const { data, error } = await supabase
      .from("obras")
      .select("id")
      .eq("slug", slugAtual)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Não consegui preparar o endereço da obra: ${error.message}`);
    }

    if (!data) {
      return slugAtual;
    }

    contador += 1;
  }

  return `${slugBase}-${Date.now().toString(36)}`;
}

function criarLoginHrefPublicar() {
  const params = new URLSearchParams({
    redirectTo: "/publicar",
  });

  return `/login?${params.toString()}`;
}

function obterNomeMetadataPublicar(usuario: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}) {
  const metadata = usuario.user_metadata || {};
  const nomesPossiveis = [
    metadata.nome,
    metadata.name,
    metadata.full_name,
    metadata.username,
    metadata.user_name,
    metadata.preferred_username,
  ];

  const nomeMetadata = nomesPossiveis.find((valor): valor is string => {
    return typeof valor === "string" && Boolean(valor.trim());
  });

  if (nomeMetadata?.trim()) {
    return nomeMetadata.trim();
  }

  const email = typeof usuario.email === "string" ? usuario.email.trim() : "";

  return email ? email.split("@")[0] || "" : "";
}

async function carregarNomePerfilPublicar(userId: string, fallback = "") {
  const fallbackLimpo = fallback.trim();

  if (!userId.trim()) {
    return fallbackLimpo;
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("nome")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    const nome = typeof data?.nome === "string" ? data.nome.trim() : "";

    if (!error && nome) {
      return nome;
    }
  } catch {
    // O nome manual/metadata continua disponível se profiles falhar.
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("nome")
      .eq("id", userId)
      .limit(1)
      .maybeSingle();

    const nome = typeof data?.nome === "string" ? data.nome.trim() : "";

    if (!error && nome) {
      return nome;
    }
  } catch {
    // Alguns bancos usam user_id no profiles; esse fallback cobre tabelas antigas.
  }

  return fallbackLimpo;
}

function criarSlugUnico(titulo: string, obrasExistentes: ObraLocal[]) {
  const slugBase = criarSlugBase(titulo);
  const slugsUsados = new Set(
    obrasExistentes
      .map((obra) => obra.slug || criarSlugBase(obra.titulo))
      .filter(Boolean)
  );

  if (!slugsUsados.has(slugBase)) {
    return slugBase;
  }

  let contador = 2;
  let slugFinal = `${slugBase}-${contador}`;

  while (slugsUsados.has(slugFinal)) {
    contador += 1;
    slugFinal = `${slugBase}-${contador}`;
  }

  return slugFinal;
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

function normalizarObraSalva(obra: ObraSalva, obraIndex: number): ObraLocal {
  const capitulosNormalizados: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) => ({
        ...capitulo,
        id:
          typeof capitulo.id === "string" && capitulo.id.trim()
            ? capitulo.id
            : `capitulo-${obraIndex + 1}-${capituloIndex + 1}`,
        titulo:
          typeof capitulo.titulo === "string" && capitulo.titulo.trim()
            ? capitulo.titulo
            : "Capítulo sem título",
        texto: typeof capitulo.texto === "string" ? capitulo.texto : "",
        curtiu: Boolean(capitulo.curtiu),
        salvo: Boolean(capitulo.salvo),
        comentario:
          typeof capitulo.comentario === "string" ? capitulo.comentario : "",
        criadoEm:
          typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
        lido: Boolean(capitulo.lido),
        lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
      }))
    : [];

  return {
    id:
      typeof obra.id === "string" && obra.id.trim()
        ? obra.id
        : `obra-${obraIndex + 1}`,
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
    tags: Array.isArray(obra.tags)
      ? obra.tags.filter((tag): tag is string => typeof tag === "string")
      : ["sem tags"],
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
              : `obra-${obraIndex + 1}`
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
                    : `obra-${obraIndex + 1}`
                )
          }`,
  };
}


function ehDataUrl(valor: string) {
  return valor.startsWith("data:");
}

function prepararObraParaLocalStorage(obra: ObraLocal): ObraLocal {
  return {
    ...obra,
    capa: ehDataUrl(obra.capa) ? "" : obra.capa,
    arquivoObra: obra.arquivoObra
      ? {
          ...obra.arquivoObra,
          conteudo: ehDataUrl(obra.arquivoObra.conteudo)
            ? ""
            : obra.arquivoObra.conteudo,
        }
      : null,
  };
}

function criarStorageUsuarioPublicarKey(userId: string) {
  return criarStorageKeyUsuarioPublicar(STORAGE_KEY, userId);
}

function obterAutorIdObraPublicar(obra: Pick<ObraLocal, "autorId">) {
  return typeof obra.autorId === "string" ? obra.autorId.trim() : "";
}

function obraPertenceAoUsuarioPublicar(
  obra: Pick<ObraLocal, "autorId">,
  userId: string,
) {
  const userIdLimpo = userId.trim();

  return Boolean(userIdLimpo && obterAutorIdObraPublicar(obra) === userIdLimpo);
}

function obterChavesBackupArquivoPublicar(
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

function carregarBackupArquivosPublicar(userId = "") {
  if (!userId.trim()) {
    return {} as Record<string, ArquivoObraLocal>;
  }

  try {
    const backupTexto = lerStorageUsuarioPublicar(
      FILE_BACKUP_STORAGE_KEY,
      userId
    );
    const backupJson: unknown = backupTexto ? JSON.parse(backupTexto) : {};

    if (!backupJson || typeof backupJson !== "object" || Array.isArray(backupJson)) {
      return {} as Record<string, ArquivoObraLocal>;
    }

    return Object.entries(backupJson as Record<string, unknown>).reduce<
      Record<string, ArquivoObraLocal>
    >((backup, [chave, arquivo]) => {
      const arquivoNormalizado = normalizarArquivoObra(arquivo);

      if (chave.trim() && arquivoNormalizado) {
        backup[chave] = arquivoNormalizado;
      }

      return backup;
    }, {});
  } catch {
    return {} as Record<string, ArquivoObraLocal>;
  }
}

function sincronizarBackupArquivoPublicar(
  obrasParaSalvar: ObraLocal[],
  userId = ""
) {
  if (!userId.trim()) {
    return;
  }

  try {
    const backupAtual = carregarBackupArquivosPublicar(userId);

    obrasParaSalvar.forEach((obra) => {
      const arquivo = normalizarArquivoObra(obra.arquivoObra);

      if (!arquivo) {
        return;
      }

      obterChavesBackupArquivoPublicar(obra).forEach((chave) => {
        backupAtual[chave] = arquivo;
      });
    });

    salvarJsonStorageUsuarioPublicar(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupAtual
    );
  } catch {
    // Backup local é camada de proteção. Não bloqueia a publicação.
  }
}

function salvarObrasLocalmente(obrasParaSalvar: ObraLocal[], userId = "") {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return;
  }

  const obrasSemArquivosPesados = obrasParaSalvar.map(prepararObraParaLocalStorage);
  const obrasParaStorage = userIdLimpo
    ? obrasSemArquivosPesados.filter((obra) =>
        obraPertenceAoUsuarioPublicar(obra, userIdLimpo),
      )
    : obrasSemArquivosPesados;

  salvarJsonStorageUsuarioPublicar(
    STORAGE_KEY,
    userIdLimpo,
    obrasParaStorage
  );

  sincronizarBackupArquivoPublicar(obrasParaSalvar, userIdLimpo);
}

async function registrarDiarioPublicacao({
  userId,
  obraId,
  capituloId = null,
  tipo,
  tituloObra,
  tituloCapitulo = "",
  criadaEm,
}: {
  userId: string;
  obraId: string;
  capituloId?: string | null;
  tipo: "publicou_obra" | "publicou_capitulo";
  tituloObra: string;
  tituloCapitulo?: string;
  criadaEm: string;
}) {
  try {
    const payload = {
      user_id: userId,
      tipo,
      obra_id: obraId,
      capitulo_id: capituloId,
      texto: "",
      visibilidade: "publico",
      metadata: {
        obra_titulo: tituloObra,
        titulo_obra: tituloObra,
        capitulo_titulo: tituloCapitulo,
      },
      criado_em: criadaEm,
      atualizado_em: criadaEm,
    };

    const { error } = await supabase.from("diario_atividades").insert(payload);

    if (!error) {
      return;
    }

    await supabase.from("diario_atividades").insert({
      user_id: userId,
      tipo,
      obra_id: obraId,
      capitulo_id: capituloId,
      texto: "",
      visibilidade: "publico",
      criado_em: criadaEm,
    });
  } catch (error) {
    console.warn("Não consegui registrar a publicação no Diário:", error);
  }
}

function contarCaracteresValidos(texto: string) {
  return texto.match(/[\p{L}\p{N}]/gu)?.length || 0;
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

  if (contarCaracteresValidos(textoLimpo) < minimo) {
    return false;
  }

  return /^[\p{L}\p{N}][\p{L}\p{N}\s-]*$/u.test(textoLimpo);
}


function campoValido(texto: string, minimo: number) {
  return contarCaracteresValidos(texto.trim()) >= minimo;
}

function contarPalavras(texto: string) {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

function calcularMinutosLeitura(texto: string) {
  const palavras = contarPalavras(texto);

  return palavras > 0 ? Math.max(1, Math.ceil(palavras / 220)) : 0;
}

function nomeArquivoParaTitulo(nomeArquivo: string) {
  return nomeArquivo
    .replace(/\.(txt|md)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function arquivoTextoAceito(arquivo: File) {
  const nome = arquivo.name.toLowerCase();

  return (
    nome.endsWith(".txt") ||
    nome.endsWith(".md") ||
    arquivo.type === "text/plain" ||
    arquivo.type === "text/markdown" ||
    arquivo.type === "text/x-markdown"
  );
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

function criarCoverUploadIconBoxStyle(capaAtual: string): CSSProperties {
  if (!capaAtual) {
    return chapterImportIconBoxStyle;
  }

  return {
    ...chapterImportIconBoxStyle,
    background: "#04000A",
    backgroundImage: `url(${capaAtual})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarDecoracaoPaginaStyle(_index: number): CSSProperties {
  return {
    display: "none",
  };
}

function criarDecoracaoPublicarStyle(_index: number): CSSProperties {
  return {
    display: "none",
  };
}

export default function PublicarPage() {
  const router = useRouter();

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
  const [arquivoCapituloNome, setArquivoCapituloNome] = useState("");
  const [arquivoCapituloTitulo, setArquivoCapituloTitulo] = useState("");
  const [arquivoCapituloTexto, setArquivoCapituloTexto] = useState("");
  const [arquivoCapituloErro, setArquivoCapituloErro] = useState("");
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [verificandoAutenticacao, setVerificandoAutenticacao] = useState(true);
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { notificacoesNaoLidas } = useNotificacoes();

  useEffect(() => {
    let cancelado = false;

    async function verificarAutenticacaoPublicacao() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (cancelado) {
          return;
        }

        if (error || !data.user) {
          window.setTimeout(() => {
            if (!cancelado) {
              setUsuarioIdLogado("");
            }
          }, 0);
          router.replace(criarLoginHrefPublicar());
          return;
        }

        window.setTimeout(() => {
          if (!cancelado) {
            setUsuarioIdLogado(data.user.id);
          }
        }, 0);

        const nomeFallback = obterNomeMetadataPublicar({
          email: data.user.email || "",
          user_metadata: data.user.user_metadata || {},
        });
        const nomePerfil = await carregarNomePerfilPublicar(
          data.user.id,
          nomeFallback
        );

        if (cancelado) {
          return;
        }

        window.setTimeout(() => {
          if (!cancelado) {
            if (nomePerfil) {
              setAutor((autorAtual) =>
                autorAtual.trim() ? autorAtual : nomePerfil
              );
            }

            setVerificandoAutenticacao(false);
          }
        }, 0);
      } catch {
        if (!cancelado) {
          router.replace(criarLoginHrefPublicar());
        }
      }
    }

    void verificarAutenticacaoPublicacao();

    return () => {
      cancelado = true;
    };
  }, [router]);

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

  const jaSalvouRef = useRef(false);
  const capaInputRef = useRef<HTMLInputElement | null>(null);
  const arquivoObraInputRef = useRef<HTMLInputElement | null>(null);
  const arquivoCapituloInputRef = useRef<HTMLInputElement | null>(null);

  const tagsDaObra = useMemo(() => {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, LIMITE_TAGS_OBRA);
  }, [tags]);

  const tagsPreview = tagsDaObra.length > 0 ? tagsDaObra : ["sem tags"];
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

  const tituloValido = campoValido(titulo, 3);
  const autorValido = campoValido(autor, 2);
  const generoValido = Boolean(generoFinal) && generoPersonalizadoValido;
  const formatoValido = Boolean(formatoFinal) && formatoPersonalizadoValido;
  const classificacaoFinal = normalizarClassificacaoIndicativaPublicar(
    classificacaoIndicativa,
  );
  const classificacaoValida = Boolean(classificacaoFinal);
  const sinopseValida = campoValido(sinopse, 20);

  const sinopseCaracteresValidos = contarCaracteresValidos(sinopse);
  const sinopsePalavras = contarPalavras(sinopse);
  const temArquivoObra = Boolean(arquivoObra);
  const arquivoObraTamanhoTexto = arquivoObra
    ? formatarTamanhoArquivo(arquivoObra.tamanho)
    : "";
  const arquivoObraTipoTexto = arquivoObra
    ? arquivoObra.categoria === "imagem"
      ? "Imagem"
      : arquivoObra.categoria === "documento"
      ? "PDF"
      : arquivoObra.categoria === "texto"
      ? "Texto"
      : "Arquivo"
    : "";
  const temCapituloImportado = Boolean(arquivoCapituloTexto.trim());
  const arquivoCapituloPalavras = contarPalavras(arquivoCapituloTexto);
  const arquivoCapituloMinutos = calcularMinutosLeitura(arquivoCapituloTexto);
  const arquivoCapituloCaracteresValidos = contarCaracteresValidos(
    arquivoCapituloTexto
  );
  const arquivoCapituloValido =
    !temCapituloImportado || arquivoCapituloCaracteresValidos >= 20;

  const progresso = useMemo(() => {
    const camposValidos = [
      tituloValido,
      autorValido,
      generoValido,
      formatoValido,
      classificacaoValida,
      sinopseValida,
    ].filter(Boolean).length;

    return Math.round((camposValidos / 6) * 100);
  }, [
    tituloValido,
    autorValido,
    generoValido,
    formatoValido,
    classificacaoValida,
    sinopseValida,
  ]);

  const previewTemConteudo = Boolean(
    titulo.trim() ||
      autor.trim() ||
      generoFinal ||
      formatoFinal ||
      classificacaoIndicativa.trim() ||
      sinopse.trim() ||
      tags.trim() ||
      capa ||
      temArquivoObra ||
      temCapituloImportado
  );

  function validarFormulario() {
    if (!tituloValido) {
      return "O título precisa ter pelo menos 3 letras ou números. Não pode ser só ponto.";
    }

    if (!autorValido) {
      return "O nome do autor precisa ter pelo menos 2 letras ou números.";
    }

    if (!formatoValido) {
      return formatoEhPersonalizado
        ? "O formato personalizado precisa ter 3 a 14 caracteres, sem vírgula, emoji ou símbolo estranho."
        : "Escolha o formato da obra.";
    }

    if (!generoValido) {
      return generoEhPersonalizado
        ? "O gênero personalizado precisa ter 3 a 14 caracteres, sem vírgula, emoji ou símbolo estranho."
        : "Escolha o gênero principal da obra.";
    }

    if (!tagPersonalizadaValida) {
      return "A tag personalizada precisa ter 2 a 10 caracteres, sem vírgula, emoji ou símbolo estranho, e não pode repetir gênero ou formato.";
    }

    if (!classificacaoValida) {
      return "Escolha a classificação indicativa da obra.";
    }

    if (!sinopseValida) {
      return "A sinopse precisa ter pelo menos 20 letras ou números.";
    }

    if (temCapituloImportado && !arquivoCapituloValido) {
      return "O arquivo importado precisa ter pelo menos 20 letras ou números para virar o primeiro capítulo.";
    }

    return "";
  }

  function selecionarCapa(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];

    setCapaErro("");
    setErro("");

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

    if (capaInputRef.current) {
      capaInputRef.current.value = "";
    }
  }

  function selecionarArquivoObra(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];

    setArquivoObraErro("");
    setErro("");

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
        "O arquivo completo precisa ter no máximo 5 MB."
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
    setArquivoObraErro("");

    if (arquivoObraInputRef.current) {
      arquivoObraInputRef.current.value = "";
    }
  }

  function selecionarArquivoCapitulo(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];

    setArquivoCapituloErro("");
    setErro("");

    if (!arquivo) {
      return;
    }

    if (!arquivoTextoAceito(arquivo)) {
      setArquivoCapituloErro("Escolha um arquivo .txt ou .md válido.");
      event.target.value = "";
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO_TEXTO) {
      setArquivoCapituloErro("O arquivo precisa ter no máximo 900 KB.");
      event.target.value = "";
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      const resultado = typeof leitor.result === "string" ? leitor.result : "";
      const textoImportado = resultado.replace(/\r\n/g, "\n").trim();

      if (contarCaracteresValidos(textoImportado) < 20) {
        setArquivoCapituloErro(
          "Esse arquivo tem pouco texto para virar um capítulo."
        );
        event.target.value = "";
        return;
      }

      setArquivoCapituloNome(arquivo.name);
      setArquivoCapituloTitulo(nomeArquivoParaTitulo(arquivo.name));
      setArquivoCapituloTexto(textoImportado);
    };

    leitor.onerror = () => {
      setArquivoCapituloErro("Não consegui ler esse arquivo.");
    };

    leitor.readAsText(arquivo, "UTF-8");
  }

  function removerArquivoCapitulo() {
    setArquivoCapituloNome("");
    setArquivoCapituloTitulo("");
    setArquivoCapituloTexto("");
    setArquivoCapituloErro("");

    if (arquivoCapituloInputRef.current) {
      arquivoCapituloInputRef.current.value = "";
    }
  }

  function tagEstaSelecionada(tag: string) {
    return tagsDaObra.some((tagAtual) => {
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
    setErro("");
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
      setErro("");
      return;
    }

    if (tagEstaSelecionada(tag)) {
      return;
    }

    setUsarTagPersonalizada(false);
    setTagPersonalizada("");
    setTags(tag);
    setErro("");
  }

  async function salvarObra(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const mensagemErro = validarFormulario();

    if (mensagemErro) {
      setErro(mensagemErro);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (jaSalvouRef.current) {
      return;
    }

    setErro("");
    jaSalvouRef.current = true;
    setProcessando(true);

    try {
      const { data: dadosUsuario, error: erroUsuario } =
        await supabase.auth.getUser();

      if (erroUsuario || !dadosUsuario.user) {
        throw new Error("Entre na sua conta antes de publicar uma obra.");
      }

      const userId = dadosUsuario.user.id;
      const autorFallbackPublicacao =
        autor.trim() ||
        obterNomeMetadataPublicar({
          email: dadosUsuario.user.email || "",
          user_metadata: dadosUsuario.user.user_metadata || {},
        });
      const autorFinalPublicacao = await carregarNomePerfilPublicar(
        userId,
        autorFallbackPublicacao
      );

      if (!campoValido(autorFinalPublicacao, 2)) {
        throw new Error(
          "Não consegui encontrar um nome de autor válido no seu perfil. Atualize seu perfil ou preencha o nome do autor."
        );
      }

      setAutor(autorFinalPublicacao);

      const obrasSalvasTexto = lerStorageUsuarioPublicar(STORAGE_KEY, userId);
      const obrasSalvasJson = obrasSalvasTexto
        ? JSON.parse(obrasSalvasTexto)
        : [];

      const obrasSalvas: ObraLocal[] = Array.isArray(obrasSalvasJson)
        ? (obrasSalvasJson as ObraSalva[]).map((obra, index) =>
            normalizarObraSalva(obra, index)
          )
        : [];

      const obraId = criarUuidSeguro();
      const slug = await criarSlugUnicoSupabase(titulo.trim(), obrasSalvas);
      const criadaEm = new Date().toISOString();
      const capituloId = temCapituloImportado ? criarUuidSeguro() : "";
      const capitulosIniciais: CapituloLocal[] = temCapituloImportado
        ? [
            {
              id: capituloId,
              titulo: arquivoCapituloTitulo.trim() || "Capítulo 1",
              texto: arquivoCapituloTexto.trim(),
              curtiu: false,
              salvo: false,
              comentario: "",
              criadoEm: criadaEm,
              lido: false,
              lidoEm: "",
            },
          ]
        : [];

      const capaUrlSupabase = capaArquivo
        ? await enviarArquivoStorage("capas-obras", userId, capaArquivo)
        : "";

      const arquivoObraUrlSupabase =
        arquivoObra && arquivoObraArquivo
          ? await enviarArquivoStorage(
              "arquivos-obras",
              userId,
              arquivoObraArquivo
            )
          : "";

      const link = `/obra/${slug}`;

      const { error: erroObra } = await supabase.from("obras").insert({
        id: obraId,
        user_id: userId,
        titulo: titulo.trim(),
        autor: autorFinalPublicacao,
        genero: generoFinal,
        formato: formatoFinal,
        classificacao_indicativa: classificacaoFinal,
        sinopse: sinopse.trim(),
        tags: tagsDaObra.length > 0 ? tagsDaObra : ["sem tags"],
        capa_url: capaUrlSupabase,
        capa_nome: capaNome,
        arquivo_url: arquivoObraUrlSupabase,
        arquivo_nome: arquivoObra?.nome || "",
        arquivo_tipo: arquivoObra?.tipo || "",
        arquivo_tamanho: arquivoObra?.tamanho || 0,
        arquivo_categoria: arquivoObra?.categoria || "outro",
        publicado: true,
        slug,
        link,
        criada_em: criadaEm,
        atualizado_em: criadaEm,
      });

      if (erroObra) {
        throw new Error(`Não consegui salvar a obra agora: ${erroObra.message}`);
      }

      if (capitulosIniciais.length > 0) {
        const { error: erroCapitulo } = await supabase.from("capitulos").insert(
          capitulosIniciais.map((capitulo, index) => ({
            id: capitulo.id,
            obra_id: obraId,
            user_id: userId,
            titulo: capitulo.titulo,
            texto: capitulo.texto,
            ordem: index + 1,
            publicado: true,
            criado_em: criadaEm,
            atualizado_em: criadaEm,
          }))
        );

        if (erroCapitulo) {
          throw new Error(
            `A obra foi criada, mas o capítulo inicial não foi salvo: ${erroCapitulo.message}`
          );
        }
      }

      const novaObra: ObraLocal = {
        id: obraId,
        titulo: titulo.trim(),
        autor: autorFinalPublicacao,
        autorId: userId,
        genero: generoFinal,
        formato: formatoFinal,
        classificacaoIndicativa: classificacaoFinal,
        sinopse: sinopse.trim(),
        tags: tagsDaObra.length > 0 ? tagsDaObra : ["sem tags"],
        capa: capaUrlSupabase,
        capaNome,
        arquivoObra: arquivoObra
          ? {
              ...arquivoObra,
              conteudo: arquivoObraUrlSupabase,
              criadoEm: criadaEm,
            }
          : null,
        publicado: true,
        capitulos: capitulosIniciais,
        criadaEm,
        ultimoCapituloLidoId: "",
        ultimaLeituraEm: "",
        progressoLeitura: calcularProgressoLeitura(capitulosIniciais),
        slug,
        link,
      };

      await registrarDiarioPublicacao({
        userId,
        obraId,
        tipo: "publicou_obra",
        tituloObra: novaObra.titulo,
        criadaEm,
      });

      if (capituloId) {
        await registrarDiarioPublicacao({
          userId,
          obraId,
          capituloId,
          tipo: "publicou_capitulo",
          tituloObra: novaObra.titulo,
          tituloCapitulo: capitulosIniciais[0]?.titulo || "Capítulo 1",
          criadaEm,
        });
      }

      const obrasSalvasDoUsuario = obrasSalvas.filter((obra) =>
        obraPertenceAoUsuarioPublicar(obra, userId),
      );
      const novasObrasDoUsuario = [
        novaObra,
        ...obrasSalvasDoUsuario.filter((obra) => obra.id !== novaObra.id),
      ];

      salvarObrasLocalmente(novasObrasDoUsuario, userId);

      router.replace("/painel-autor");
      router.refresh();
    } catch (erroDesconhecido) {
      jaSalvouRef.current = false;
      setProcessando(false);

      const mensagem =
        erroDesconhecido instanceof Error &&
        erroDesconhecido.name === "QuotaExceededError"
          ? "O navegador recusou salvar dados locais porque o armazenamento está cheio. A capa e o arquivo já foram enviados; limpe obras antigas salvas localmente e tente novamente."
          : erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não consegui salvar a obra agora. Tente novamente.";

      setErro(mensagem);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  if (verificandoAutenticacao) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${publicarPageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <section style={authLoadingCardStyle}>
            <strong style={authLoadingTitleStyle}>Verificando acesso...</strong>
            <span style={authLoadingTextStyle}>
              Conferindo sua conta antes de abrir a publicação.
            </span>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${publicarPageCss}`}</style>

      <div style={pageDecorationLayerStyle} aria-hidden="true">
        {["✦", "◇", "+"].map((decoracao, index) => (
          <span key={`${decoracao}-${index}`} style={criarDecoracaoPaginaStyle(index)}>
            {decoracao}
          </span>
        ))}
      </div>

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
              NOVA OBRA
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

        <section style={isDesktop ? desktopMainGridSingleStyle : mainGridStyle}>
          <form onSubmit={salvarObra} style={isDesktop ? desktopFormPanelStyle : formPanelStyle}>
            {erro && (
              <div style={isDesktop ? desktopFullWidthErrorBoxStyle : errorBoxStyle}>
                <strong style={safeTextStyle}>Ajuste necessário:</strong>
                <span style={safeTextStyle}>{erro}</span>
              </div>
            )}


            <div style={isDesktop ? desktopHalfFieldStyle : fieldGroupStyle}>
              <input
                ref={capaInputRef}
                type="file"
                accept="image/*"
                onChange={selecionarCapa}
                style={hiddenInputStyle}
              />

              <div style={isDesktop ? desktopChapterImportBoxStyle : chapterImportBoxStyle}>
                <div style={criarCoverUploadIconBoxStyle(capa)}>
                  {!capa && <span style={chapterImportIconStyle}>+</span>}
                </div>

                <div style={isDesktop ? desktopChapterImportContentStyle : chapterImportContentStyle}>
                  <strong style={chapterImportTitleStyle}>
                    {capa ? "Capa selecionada" : "Adicionar capa"}
                  </strong>

                  <span style={hintStyle}>
                    Imagem vertical. Tamanho máximo: 2 MB.
                  </span>

                  {capaNome && <span style={fileNameStyle}>{capaNome}</span>}

                  {capaErro && <span style={coverErrorStyle}>{capaErro}</span>}

                  <div style={isDesktop ? desktopCoverButtonsStyle : coverButtonsStyle}>
                    <button
                      type="button"
                      onClick={() => capaInputRef.current?.click()}
                      style={isDesktop ? desktopCoverButtonStyle : coverButtonStyle}
                    >
                      Escolher imagem
                    </button>

                    {capa && (
                      <button
                        type="button"
                        onClick={removerCapa}
                        style={isDesktop ? desktopRemoveCoverButtonStyle : removeCoverButtonStyle}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>


            <div style={isDesktop ? desktopHalfFieldStyle : fieldGroupStyle}>
              <label style={labelStyle}>Título da obra</label>

              <input
                value={titulo}
                onChange={(event) => {
                  setTitulo(event.target.value);
                  setErro("");
                }}
                style={inputStyle}
                placeholder="Ex: Shadow Eclipse"
                type="text"
              />

              <span style={hintStyle}>Mínimo 3 letras ou números.</span>
            </div>

            <div style={isDesktop ? desktopHalfFieldStyle : fieldGroupStyle}>
              <label style={labelStyle}>Nome do autor</label>

              <input
                value={autor}
                onChange={(event) => {
                  setAutor(event.target.value);
                  setErro("");
                }}
                style={inputStyle}
                placeholder="Ex: Historietas Studio"
                type="text"
              />

              <span style={hintStyle}>Pode ser nome, nickname ou estúdio.</span>
            </div>

            <div style={isDesktop ? desktopFullWidthDoubleFieldStyle : doubleFieldStyle}>
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

                    setErro("");
                  }}
                  style={inputStyle}
                >
                  <option value="">Escolha o formato</option>
                  <option>Webnovel</option>
                  <option>Light novel</option>
                  <option>Romance</option>
                  <option>Conto</option>
                  <option>Poesia</option>
                  <option>HQ/Mangá</option>
                  <option>Fanfic</option>
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
                      setErro("");
                    }}
                    style={inputStyle}
                    placeholder="Digite o formato"
                    maxLength={LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO}
                    type="text"
                  />
                )}
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Gênero principal</label>

                <select
                  value={genero}
                  onChange={(event) => {
                    const novoGenero = event.target.value;

                    setGenero(novoGenero);

                    if (novoGenero !== OUTRO_GENERO_VALUE) {
                      setGeneroPersonalizado("");
                    }

                    setErro("");
                  }}
                  style={inputStyle}
                >
                  <option value="">Escolha um gênero</option>
                  <option>Fantasia</option>
                  <option>Terror</option>
                  <option>Ficção</option>
                  <option>Romance</option>
                  <option>Drama</option>
                  <option>Ação</option>
                  <option>Mistério</option>
                  <option>Suspense</option>
                  <option>Aventura</option>
                  <option>Comédia</option>
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
                      setErro("");
                    }}
                    style={inputStyle}
                    placeholder="Digite o gênero"
                    maxLength={LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO}
                    type="text"
                  />
                )}
              </div>
            </div>

            <div style={isDesktop ? desktopFullWidthFieldStyle : fieldGroupStyle}>
              <label style={labelStyle}>Tag</label>

              <select
                value={usarTagPersonalizada ? OUTRA_TAG_VALUE : tagsDaObra[0] || ""}
                onChange={(event) => {
                  const novaTag = event.target.value;

                  if (!novaTag) {
                    setUsarTagPersonalizada(false);
                    setTagPersonalizada("");
                    setTags("");
                    setErro("");
                    return;
                  }

                  adicionarTagSelecionada(novaTag);
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

            <div style={isDesktop ? desktopFullWidthFieldStyle : fieldGroupStyle}>
              <label style={labelStyle}>Classificação indicativa</label>

              <select
                value={classificacaoIndicativa}
                onChange={(event) => {
                  setClassificacaoIndicativa(event.target.value);
                  setErro("");
                }}
                style={inputStyle}
              >
                <option value="">Escolha a classificação</option>
                <option value="Livre">Livre</option>
                <option>10+</option>
                <option>12+</option>
                <option>14+</option>
                <option>16+</option>
                <option>18+</option>
              </select>
            </div>

            <div style={isDesktop ? desktopFullWidthFieldStyle : fieldGroupStyle}>
              <div style={labelRowStyle}>
                <label style={labelStyle}>Sinopse</label>

                <span
                  style={
                    sinopseValida ? miniCounterOkStyle : miniCounterWarningStyle
                  }
                >
                  {sinopseCaracteresValidos}/20
                </span>
              </div>

              <textarea
                value={sinopse}
                onChange={(event) => {
                  setSinopse(event.target.value);
                  setErro("");
                }}
                style={textareaStyle}
                placeholder={`Escreva um resumo chamativo de sua história...\nMínimo 20 letras ou números. ${sinopsePalavras} palavras.`}
              />
            </div>


            <div style={isDesktop ? desktopFullWidthFieldStyle : fieldGroupStyle}>
              <div style={fileUploadLabelRowStyle}>
                <label style={labelStyle}>Arquivo completo da obra</label>
                <span style={fileOptionalBadgeStyle}>Opcional</span>
              </div>

              <input
                ref={arquivoObraInputRef}
                type="file"
                accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp,.gif,application/pdf,text/plain,text/markdown,image/*"
                onChange={selecionarArquivoObra}
                style={hiddenInputStyle}
              />

              <div style={isDesktop ? desktopFullWidthArquivoObraBoxStyle : chapterImportBoxStyle}>
                <div style={chapterImportIconBoxStyle}>
                  <span style={chapterImportIconStyle}>▣</span>
                </div>

                <div style={isDesktop ? desktopFullWidthArquivoObraContentStyle : chapterImportContentStyle}>
                  <strong style={chapterImportTitleStyle}>
                    {arquivoObra ? "Arquivo da obra anexado" : "Enviar PDF, texto ou imagem"}
                  </strong>

                  <span style={hintStyle}>
                    Opcional. Anexe PDF, texto, imagem ou página de mangá. Tamanho máximo: 5 MB.
                  </span>

                  {arquivoObra && (
                    <span style={fileNameStyle}>
                      {arquivoObra.nome} • {arquivoObraTipoTexto} • {arquivoObraTamanhoTexto}
                    </span>
                  )}

                  {arquivoObraErro && (
                    <span style={coverErrorStyle}>{arquivoObraErro}</span>
                  )}

                  <div style={isDesktop ? desktopCoverButtonsStyle : coverButtonsStyle}>
                    <button
                      type="button"
                      onClick={() => arquivoObraInputRef.current?.click()}
                      style={isDesktop ? desktopCoverButtonStyle : coverButtonStyle}
                    >
                      {arquivoObra ? "Trocar arquivo" : "Escolher arquivo"}
                    </button>

                    {arquivoObra && (
                      <button
                        type="button"
                        onClick={removerArquivoObra}
                        style={isDesktop ? desktopRemoveCoverButtonStyle : removeCoverButtonStyle}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {arquivoObra && (
                <div style={chapterImportStatsStyle}>
                  <span style={inlineStatStyle}>{arquivoObraTipoTexto}</span>
                  <span style={inlineStatStyle}>{arquivoObraTamanhoTexto}</span>
                  <span style={inlineStatStyle}>anexado à obra</span>
                </div>
              )}
            </div>

            <div style={isDesktop ? desktopHalfFieldStyle : fieldGroupStyle}>
              <label style={labelStyle}>Primeiro capítulo por arquivo</label>

              <input
                ref={arquivoCapituloInputRef}
                type="file"
                accept=".txt,.md,text/plain,text/markdown"
                onChange={selecionarArquivoCapitulo}
                style={hiddenInputStyle}
              />

              <div style={isDesktop ? desktopChapterImportBoxStyle : chapterImportBoxStyle}>
                <div style={chapterImportIconBoxStyle}>
                  <span style={chapterImportIconStyle}>⇧</span>
                </div>

                <div style={isDesktop ? desktopChapterImportContentStyle : chapterImportContentStyle}>
                  <strong style={chapterImportTitleStyle}>
                    {arquivoCapituloNome
                      ? "Capítulo importado"
                      : "Importar .txt/.md"}
                  </strong>

                  <span style={hintStyle}>
                    Opcional. Um .txt ou .md pode virar o primeiro capítulo.
                  </span>

                  {arquivoCapituloNome && (
                    <span style={fileNameStyle}>{arquivoCapituloNome}</span>
                  )}

                  {arquivoCapituloErro && (
                    <span style={coverErrorStyle}>{arquivoCapituloErro}</span>
                  )}

                  <div style={isDesktop ? desktopCoverButtonsStyle : coverButtonsStyle}>
                    <button
                      type="button"
                      onClick={() => arquivoCapituloInputRef.current?.click()}
                      style={isDesktop ? desktopCoverButtonStyle : coverButtonStyle}
                    >
                      {arquivoCapituloNome ? "Trocar arquivo" : "Escolher arquivo"}
                    </button>

                    {arquivoCapituloNome && (
                      <button
                        type="button"
                        onClick={removerArquivoCapitulo}
                        style={isDesktop ? desktopRemoveCoverButtonStyle : removeCoverButtonStyle}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {temCapituloImportado && (
                <div style={chapterImportStatsStyle}>
                  <span style={inlineStatStyle}>
                    Título: {arquivoCapituloTitulo || "Capítulo 1"}
                  </span>
                  <span style={inlineStatStyle}>
                    {arquivoCapituloPalavras} palavras
                  </span>
                  <span style={inlineStatStyle}>
                    {arquivoCapituloMinutos} min
                  </span>
                </div>
              )}
            </div>

            <div style={isDesktop ? desktopButtonAreaStyle : buttonAreaStyle}>
              <Link href="/" style={secondaryButtonStyle}>
                Cancelar
              </Link>

              <button
                type="submit"
                style={processando ? disabledButtonStyle : primaryButtonStyle}
                disabled={processando}
              >
                {processando ? "Salvando..." : "Criar obra"}
              </button>
            </div>

            <div
              style={
                isDesktop
                  ? { ...desktopProgressBoxStyle, gridColumn: "1 / -1", width: "100%" }
                  : { ...progressBoxStyle, width: "100%" }
              }
            >
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

            {previewTemConteudo ? (
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
                        {classificacaoFinal || "Classificação"}
                      </span>
                    </div>
                  </div>

                  <p style={previewAuthorStyle}>
                    Por {autor.trim() || "Autor não informado"}
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
                        {temCapituloImportado ? "1 cap." : "0 cap."}
                      </span>
                    </span>
                  </div>

                  <div style={previewProgressCompactStyle}>
                    <div style={previewProgressTrackStyle}>
                      <div
                        style={{
                          ...previewProgressFillStyle,
                          width: temCapituloImportado ? "100%" : "0%",
                        }}
                      />
                    </div>

                    <span style={previewProgressTextStyle}>
                      {temCapituloImportado ? "1 cap. pronto" : "sem capítulo"}
                    </span>
                  </div>

                  {sinopse.trim() && (
                    <p style={previewSinopseStyle}>
                      {sinopse.trim()}
                    </p>
                  )}

                  {temCapituloImportado && (
                    <div style={previewImportedChapterStyle}>
                      <span style={previewImportedMiniStyle}>
                        PRIMEIRO CAPÍTULO
                      </span>

                      <strong style={previewImportedTitleStyle}>
                        {arquivoCapituloTitulo || "Capítulo 1"}
                      </strong>

                      <span style={previewImportedTextStyle}>
                        {arquivoCapituloPalavras} palavras • {arquivoCapituloMinutos} min de leitura
                      </span>
                    </div>
                  )}

                  <div style={previewActionRowStyle}>
                    <span style={previewGenreBadgeStyle}>
                      {generoFinal || "Gênero"}
                    </span>

                    <span style={previewActionBadgeStyle}>
                      Prévia
                    </span>
                  </div>
                </div>
              </article>
            ) : (
              <div style={emptyPreviewBoxStyle}>
                <div style={emptyPreviewCoverStyle}>
                  <span style={emptyPreviewIconStyle}>+</span>
                </div>

                <div style={emptyPreviewContentStyle}>
                  <strong style={emptyPreviewTitleStyle}>
                    A prévia aparece aqui
                  </strong>

                  <span style={emptyPreviewTextStyle}>
                    Preencha título, autor, gênero e capa para ver como a obra vai ficar.
                  </span>
                </div>
              </div>
            )}
          </aside>
        </section>
      </section>
    </main>
  );
}

const publicarPageCss = `
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

  html[data-historietas-tema-visual] nav a[href="/publicar"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"] {
    background: var(--historietas-bottom-nav-active-bg, rgba(59, 7, 100, 0.54)) !important;
    border-color: var(--historietas-bottom-nav-active-border, rgba(109, 40, 217, 0.48)) !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual] nav a[href="/publicar"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"] .historietas-bottom-nav-icon {
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

const authLoadingCardStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(560px, 100%)",
  margin: "40px auto 0",
  display: "grid",
  justifyItems: "center",
  gap: "8px",
  padding: "24px 16px",
  borderRadius: "24px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  textAlign: "center",
  boxSizing: "border-box",
  boxShadow: "none",
};

const authLoadingTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "18px",
  fontWeight: 950,
  ...safeTextStyle,
};

const authLoadingTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.5,
  fontWeight: 750,
  ...safeTextStyle,
};

const pageDecorationLayerStyle: CSSProperties = {
  display: "none",
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

const heroDecorationLayerStyle: CSSProperties = {
  display: "none",
};

const heroPremiumShineStyle: CSSProperties = {
  display: "none",
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
  flex: "0 0 auto",
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
  color: "#FFFFFF",
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
  background:
    "linear-gradient(90deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  transition: "width 0.2s ease",
};

const previewProgressBoxStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  padding: "8px",
  borderRadius: "16px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  boxShadow: "none",
};

const desktopPreviewProgressBoxStyle: CSSProperties = {
  ...previewProgressBoxStyle,
  padding: "9px 12px",
  borderRadius: "17px",
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

const errorBoxStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  padding: "11px",
  borderRadius: "16px",
  background: "rgba(239,68,68,0.075)",
  border: "1px solid rgba(239,68,68,0.18)",
  color: "#FCA5A5",
  fontSize: "12px",
  fontWeight: 850,
  minWidth: 0,
  ...safeTextStyle,
};

const formSectionHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "4px",
  padding: "4px 0 2px",
  textAlign: "center",
  minWidth: 0,
};


const formSectionTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #F97316)",
  fontSize: "18px",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  textAlign: "center",
  ...safeTextStyle,
};

const formSectionTitleStandaloneStyle: CSSProperties = {
  ...formSectionTitleStyle,
  display: "block",
  width: "100%",
  padding: 0,
  background: "transparent",
  border: "0",
  borderRadius: 0,
  boxShadow: "none",
};

const desktopFormSectionTitleStandaloneStyle: CSSProperties = {
  ...formSectionTitleStandaloneStyle,
  gridColumn: "1 / -1",
};

const formSectionTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.45,
  fontWeight: 700,
  textAlign: "center",
  maxWidth: "520px",
  ...safeTextStyle,
};


const fieldGroupStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
};

const doubleFieldStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  minWidth: 0,
  maxWidth: "100%",
};

const labelRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  flexWrap: "wrap",
};

const fileUploadLabelRowStyle: CSSProperties = {
  ...labelRowStyle,
  alignItems: "center",
};

const fileOptionalBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "0",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  ...safeTextStyle,
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
  gridTemplateColumns: "minmax(86px, 96px) minmax(0, 1fr)",
  gap: "12px",
  alignItems: "stretch",
  padding: "10px",
  borderRadius: "21px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "none",
};

const coverUploadPreviewStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
};

const coverPlaceholderStyle: CSSProperties = {
  minHeight: "138px",
  borderRadius: "18px",
  background: "#04000A",
  backgroundImage: "linear-gradient(135deg, #08030F 0%, #04000A 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "none",
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
};

const coverPlaceholderTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 900,
  textAlign: "center",
  ...safeTextStyle,
};

const coverUploadContentStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
};

const coverUploadTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "17px",
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
  color: "#FCA5A5",
  fontSize: "11px",
  fontWeight: 850,
  ...safeTextStyle,
};

const coverButtonsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "stretch",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
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
  flex: "1 1 94px",
  minHeight: "34px",
  maxWidth: "100%",
  padding: "0 11px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
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
  gridTemplateColumns: "repeat(auto-fit, minmax(138px, 1fr))",
  gap: "9px",
  marginTop: "2px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const primaryButtonStyle: CSSProperties = {
  minHeight: "50px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#08030F",
  color: "#FFFFFF",
  fontSize: "14px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "none",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 14px",
  lineHeight: 1.15,
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
  ...primaryButtonStyle,
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const chapterImportBoxStyle: CSSProperties = {
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

const chapterImportIconBoxStyle: CSSProperties = {
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

const chapterImportIconStyle: CSSProperties = {
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
  fontWeight: 950,
  lineHeight: 1,
  background: "transparent",
  boxShadow: "none",
};

const chapterImportContentStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
};

const chapterImportTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "16px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  ...safeTextStyle,
};

const chapterImportStatsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
};

const inlineStatStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 900,
  ...safeTextStyle,
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

const emptyPreviewBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "80px minmax(0, 1fr)",
  gap: "13px",
  alignItems: "center",
  padding: "13px",
  borderRadius: "21px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "none",
};

const emptyPreviewCoverStyle: CSSProperties = {
  minHeight: "104px",
  borderRadius: "18px",
  background: "#04000A",
  backgroundImage: "linear-gradient(135deg, #08030F 0%, #04000A 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "none",
};

const emptyPreviewIconStyle: CSSProperties = {
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  fontWeight: 950,
  lineHeight: 1,
  background: "transparent",
};

const emptyPreviewContentStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
};

const emptyPreviewTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "16px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  ...safeTextStyle,
};

const emptyPreviewTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  lineHeight: 1.45,
  fontWeight: 700,
  ...safeTextStyle,
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

const previewCoverGlowStyle: CSSProperties = {
  display: "none",
};


const previewCoverBottomStyle: CSSProperties = {
  position: "absolute",
  left: "9px",
  right: "9px",
  bottom: "9px",
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  alignItems: "end",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
};

const previewCoverNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "30px",
  lineHeight: 0.88,
  fontWeight: 950,
  letterSpacing: "-0.07em",
  textShadow: "0 1px 10px rgba(0,0,0,0.34)",
  ...safeTextStyle,
};

const previewCoverTextStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "8.5px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "0.055em",
  textAlign: "left",
  textTransform: "uppercase",
  textShadow: "0 1px 10px rgba(0,0,0,0.34)",
  ...safeTextStyle,
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
  color: "#FFFFFF",
};


const previewImportedBadgeStyle: CSSProperties = {
  ...previewBadgeStyle,
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(34, 197, 94, 0.22)",
  color: "#86EFAC",
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

const previewSinopseStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.32,
  fontWeight: 700,
  whiteSpace: "pre-wrap",
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  overflowWrap: "break-word",
  wordBreak: "break-word",
  ...safeTextStyle,
};

const previewImportedChapterStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  padding: "7px",
  borderRadius: "13px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxShadow: "none",
};

const previewImportedMiniStyle: CSSProperties = {
  color: "#86EFAC",
  fontSize: "8px",
  fontWeight: 950,
  letterSpacing: "0.055em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const previewImportedTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14px",
  lineHeight: 1.2,
  fontWeight: 950,
  ...safeTextStyle,
};

const previewImportedTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.35,
  fontWeight: 750,
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


const tagPreviewListStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  minWidth: 0,
};

const previewTagStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 6px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  fontWeight: 950,
  ...safeTextStyle,
};

const miniCounterOkStyle: CSSProperties = {
  width: "fit-content",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "0",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 900,
  ...safeTextStyle,
};

const miniCounterWarningStyle: CSSProperties = {
  ...miniCounterOkStyle,
  color: "#FFFFFF",
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
};


const desktopMainGridSingleStyle: CSSProperties = {
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

const desktopHalfFieldStyle: CSSProperties = {
  ...fieldGroupStyle,
  minWidth: 0,
};

const desktopFullWidthFieldStyle: CSSProperties = {
  ...fieldGroupStyle,
  gridColumn: "1 / -1",
};

const desktopFullWidthErrorBoxStyle: CSSProperties = {
  ...errorBoxStyle,
  gridColumn: "1 / -1",
};

const desktopFormSectionHeaderStyle: CSSProperties = {
  ...formSectionHeaderStyle,
  gridColumn: "1 / -1",
  padding: "8px 0 4px",
};


const desktopDoubleFieldStyle: CSSProperties = {
  ...doubleFieldStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
};

const desktopFullWidthDoubleFieldStyle: CSSProperties = {
  ...desktopDoubleFieldStyle,
  gridColumn: "1 / -1",
};


const desktopCoverUploadBoxStyle: CSSProperties = {
  ...coverUploadBoxStyle,
  gridTemplateColumns: "116px minmax(0, 1fr)",
  gap: "16px",
  padding: "12px",
  borderRadius: "22px",
};


const desktopCoverUploadContentStyle: CSSProperties = {
  ...coverUploadContentStyle,
  alignContent: "center",
  gap: "8px",
};

const desktopCoverButtonsStyle: CSSProperties = {
  ...coverButtonsStyle,
  justifyContent: "flex-start",
  gap: "8px",
};

const desktopCoverButtonStyle: CSSProperties = {
  ...coverButtonStyle,
  flex: "0 0 auto",
  width: "auto",
  minWidth: "126px",
  maxWidth: "180px",
  padding: "0 16px",
  whiteSpace: "nowrap",
};

const desktopRemoveCoverButtonStyle: CSSProperties = {
  ...removeCoverButtonStyle,
  flex: "0 0 auto",
  width: "auto",
  minWidth: "104px",
  maxWidth: "160px",
  padding: "0 15px",
  whiteSpace: "nowrap",
};

const desktopChapterImportBoxStyle: CSSProperties = {
  ...chapterImportBoxStyle,
  gridTemplateColumns: "64px minmax(0, 1fr)",
  gap: "14px",
  padding: 0,
  borderRadius: 0,
};

const desktopFullWidthArquivoObraBoxStyle: CSSProperties = {
  ...desktopChapterImportBoxStyle,
  gridTemplateColumns: "76px minmax(0, 1fr)",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "0",
  boxShadow: "none",
};

const desktopChapterImportContentStyle: CSSProperties = {
  ...chapterImportContentStyle,
  alignContent: "center",
  gap: "8px",
};

const desktopFullWidthArquivoObraContentStyle: CSSProperties = {
  ...desktopChapterImportContentStyle,
  gridTemplateColumns: "minmax(0, 1fr)",
  maxWidth: "100%",
};

const desktopButtonAreaStyle: CSSProperties = {
  ...buttonAreaStyle,
  gridColumn: "1 / -1",
  gridTemplateColumns: "minmax(150px, 190px) minmax(190px, 260px)",
  justifyContent: "start",
  gap: "10px",
};

const desktopPreviewPanelStyle: CSSProperties = {
  ...previewPanelStyle,
  position: "sticky",
  top: "24px",
  alignSelf: "start",
};


const desktopPreviewCardStyle: CSSProperties = {
  ...previewCardStyle,
  gridTemplateColumns: "112px minmax(0, 1fr)",
  gap: "15px",
  padding: "13px",
  borderRadius: "24px",
};