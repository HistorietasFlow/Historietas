"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { obras } from "../../data/obras";
import { supabase } from "../../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../../lib/historietasTheme";

const SAVED_RELEASES_STORAGE_KEY = "historietas-lancamentos-salvos";
const FOLLOWED_WORKS_STORAGE_KEY = "historietas-obras-seguidas";
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

const comentariosModelo = [
  {
    autor: "Luna",
    texto: "A premissa chamou atenção. Quero acompanhar os próximos capítulos.",
  },
  {
    autor: "Kai",
    texto: "Gostei da proposta e da vibe dessa obra.",
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
  const [mensagemAcao, setMensagemAcao] = useState("");
  const [linkCopiado, setLinkCopiado] = useState(false);
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

  function alternarSeguirObra() {
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

      const novasObrasSeguidas = obrasSeguidas.includes(obraNormalizada)
        ? obrasSeguidas.filter((titulo) => titulo !== obraNormalizada)
        : Array.from(new Set([...obrasSeguidas, obraNormalizada]));

      localStorage.setItem(
        FOLLOWED_WORKS_STORAGE_KEY,
        JSON.stringify(novasObrasSeguidas)
      );

      const seguindo = novasObrasSeguidas.includes(obraNormalizada);

      setObraSeguida(seguindo);
      setMensagemAcao(
        seguindo ? "Obra adicionada aos seguidos." : "Obra removida dos seguidos."
      );
    } catch {
      setMensagemAcao("Não foi possível salvar agora.");
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
        </header>

        <section style={isDesktop ? desktopHeroStyle : heroStyle}>
          <div style={heroGlowStyle} />

          <div style={isDesktop ? desktopHeroContentStyle : heroContentStyle}>
            <div style={isDesktop ? criarDesktopCoverArtStyle(obra.capa) : criarCoverArtStyle(obra.capa)} aria-hidden="true">
              <span style={coverTopBadgeStyle}>{obra.formato}</span>

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

              <span style={coverBottomBadgeStyle}>
                {obra.classificacaoIndicativa}
              </span>
            </div>

            <div style={isDesktop ? desktopBadgeRowStyle : badgeRowStyle}>
              <span style={badgeStyle}>
                {obra.origem === "local" ? "OBRA DO AUTOR" : "OBRA DO CATÁLOGO"}
              </span>
              <span style={ratingBadgeStyle}>{obra.classificacaoIndicativa}</span>
              <span style={statusBadgeStyle}>
                {obraDisponivel ? obra.status : "Em breve"}
              </span>

              {obra.arquivoObra && (
                <span style={fileAttachedBadgeStyle}>Arquivo anexado</span>
              )}
            </div>

            <h1 className="historietas-theme-title" style={isDesktop ? desktopTitleStyle : titleStyle}>{obra.titulo}</h1>

            <p style={isDesktop ? desktopDescriptionStyle : descriptionStyle}>{obra.sinopse}</p>

            <div style={isDesktop ? desktopInfoRowStyle : infoRowStyle}>
              <span style={infoBadgeStyle}>{obra.genero}</span>
              <span style={infoBadgeStyle}>{obra.formato}</span>
              <span style={infoBadgeStyle}>por {obra.autor}</span>
            </div>

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

              <Link href="#capitulos" style={ghostButtonStyle}>
                {obraDisponivel ? "Ver capítulos" : "Capítulos"}
              </Link>
            </div>

            {mensagemAcao && <span style={actionMessageStyle}>{mensagemAcao}</span>}
          </div>
        </section>

        <section style={isDesktop ? desktopStatsGridStyle : statsGridStyle}>
          <MetricCard numero={obra.views} rotulo="visualizações" />
          <MetricCard numero={obra.likes} rotulo="curtidas" />
          <MetricCard numero={obra.comentarios} rotulo="comentários" />
          <MetricCard
            numero={obraDisponivel ? "890" : "Novo"}
            rotulo={obraDisponivel ? "seguidores" : "lançamento"}
          />
        </section>

        <section style={isDesktop ? desktopAboutBoxStyle : aboutBoxStyle}>
          <span style={miniTitleStyle}>SOBRE A OBRA</span>

          <h2 style={sectionTitleStyle}>Sobre a história</h2>

          <p style={textStyle}>{obra.sinopse}</p>

          <div style={isDesktop ? desktopHighlightListStyle : highlightListStyle}>
            <div style={highlightItemStyle}>
              <span style={highlightIconStyle}>✓</span>
              <span style={highlightTextStyle}>
                Gênero principal: {obra.genero}
              </span>
            </div>

            <div style={highlightItemStyle}>
              <span style={highlightIconStyle}>✓</span>
              <span style={highlightTextStyle}>Formato: {obra.formato}</span>
            </div>

            <div style={highlightItemStyle}>
              <span style={highlightIconStyle}>✓</span>
              <span style={highlightTextStyle}>
                Status: {obraDisponivel ? obra.status : "Em breve"}
              </span>
            </div>
          </div>

          <div style={tagsStyle}>
            {obra.tags.map((tag) => (
              <span key={tag} style={tagStyle}>
                {tag}
              </span>
            ))}
          </div>
        </section>

        {obra.arquivoObra && (
          <ArquivoObraPublico arquivo={obra.arquivoObra} slug={obra.slug} isDesktop={isDesktop} />
        )}

        <section style={isDesktop ? desktopCommunityBoxStyle : communityBoxStyle}>
          <div style={communityHeaderStyle}>
            <div style={{ minWidth: 0 }}>
              <span style={miniTitleStyle}>COMUNIDADE</span>

              <h2 style={communityTitleStyle}>Comunidade</h2>
            </div>

            <span style={communityBadgeStyle}>
              {obraDisponivel ? "em andamento" : "pré-lançamento"}
            </span>
          </div>

          <div style={communityGridStyle}>
            <CommunityItem numero="27" rotulo="teorias" />
            <CommunityItem numero="64" rotulo="reviews" />
            <CommunityItem numero="1.1K" rotulo="favoritos" />
          </div>
        </section>

        <section style={isDesktop ? desktopReviewBoxStyle : reviewBoxStyle}>
          <div style={reviewTopStyle}>
            <div style={{ minWidth: 0 }}>
              <span style={miniTitleStyle}>
                {obraDisponivel ? "AVALIAÇÃO" : "EXPECTATIVA"}
              </span>

              <h2 style={sectionTitleStyle}>
                {obraDisponivel
                  ? "Opinião dos leitores"
                  : "Leitores aguardando"}
              </h2>
            </div>

            <div style={ratingSummaryStyle}>
              <strong style={ratingNumberStyle}>4.8</strong>
              <span style={ratingStarsStyle}>★★★★★</span>
              <span style={ratingTotalStyle}>
                {obraDisponivel ? "126 avaliações" : "126 interações"}
              </span>
            </div>
          </div>

          <div style={isDesktop ? desktopCommentsGridStyle : commentsGridStyle}>
            {comentariosModelo.map((comentario) => (
              <article key={comentario.autor} style={commentCardStyle}>
                <strong style={commentAuthorStyle}>{comentario.autor}</strong>
                <p style={commentTextStyle}>{comentario.texto}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="capitulos" style={chaptersSectionStyle}>
          <div style={sectionHeaderStyle}>
            <div style={{ minWidth: 0 }}>
              <span style={miniTitleStyle}>CAPÍTULOS</span>

              <h2 style={sectionTitleStyle}>
                {obraDisponivel ? "Capítulos" : "Capítulos em breve"}
              </h2>
            </div>

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

function MetricCard({ numero, rotulo }: { numero: string; rotulo: string }) {
  return (
    <div style={statCardStyle}>
      <strong style={statNumberStyle}>{numero}</strong>
      <span style={statLabelStyle}>{rotulo}</span>
    </div>
  );
}

function CommunityItem({ numero, rotulo }: { numero: string; rotulo: string }) {
  return (
    <div style={communityItemStyle}>
      <strong style={communityNumberStyle}>{numero}</strong>
      <span style={communityLabelStyle}>{rotulo}</span>
    </div>
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
  width: "min(860px, calc(100% - 32px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "18px 0 calc(100px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "22px 0 96px",
};


const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  marginBottom: "14px",
  minWidth: 0,
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  flexWrap: "nowrap",
  marginBottom: "18px",
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
  maxWidth: "calc(100% - 158px)",
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
  borderRadius: "26px",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 16%, var(--historietas-border-soft, transparent))",
  background:
    "radial-gradient(circle at 16% 18%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent)), transparent 30%), radial-gradient(circle at 82% 12%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 50%, transparent)), transparent 38%), linear-gradient(135deg, var(--historietas-surface, rgba(31,16,52,0.98)) 0%, var(--historietas-surface-strong, rgba(12,7,23,0.99)) 100%)",
  boxShadow: "var(--historietas-hero-shadow, none)",
  minWidth: 0,
};

const heroGlowStyle: CSSProperties = {
  display: "none",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "15px",
  display: "grid",
  gap: "11px",
  minWidth: 0,
};

const coverArtStyle: CSSProperties = {
  minHeight: "162px",
  borderRadius: "22px",
  position: "relative",
  overflow: "hidden",
  background:
    "radial-gradient(circle at top left, color-mix(in srgb, var(--historietas-accent, #F97316) 44%, transparent), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 70%, transparent), transparent 38%), linear-gradient(135deg, #18181B 0%, #0F0F0F 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  boxShadow: "none",
  minWidth: 0,
};

const coverTopBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "10px",
  left: "10px",
  padding: "7px 10px",
  borderRadius: "999px",
  background:
    "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 90%, transparent)",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 950,
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
  right: "10px",
  bottom: "10px",
  padding: "7px 10px",
  borderRadius: "999px",
  background:
    "color-mix(in srgb, var(--historietas-accent, #F97316) 88%, transparent)",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const badgeRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  minWidth: 0,
};

const infoBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.07))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-primary, #E4E4E7)",
  fontSize: "10px",
  fontWeight: 900,
  ...safeTextStyle,
};

const badgeStyle: CSSProperties = {
  ...infoBadgeStyle,
  background:
    "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  letterSpacing: "0.08em",
};

const statusBadgeStyle: CSSProperties = {
  ...infoBadgeStyle,
  background:
    "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
};

const ratingBadgeStyle: CSSProperties = {
  ...infoBadgeStyle,
  background:
    "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, var(--historietas-surface, transparent))",
  border:
    "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 28%, var(--historietas-border-soft, transparent))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(38px, 10vw, 68px)",
  lineHeight: 0.92,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  maxWidth: "100%",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 48%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.58,
  fontWeight: 650,
  maxWidth: "760px",
  ...safeTextStyle,
};

const infoRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px",
  minWidth: 0,
};

const heroActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
  marginTop: "2px",
  minWidth: 0,
};

const primaryButtonStyle: CSSProperties = {
  minHeight: "44px",
  borderRadius: "999px",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 82%, #111827) 100%)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 12px",
  boxShadow: "none",
  ...safeTextStyle,
};

const primaryLinkButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  textDecoration: "none",
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: "44px",
  borderRadius: "999px",
  border:
    "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, transparent)",
  background: "var(--historietas-secondary, #7C3AED)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 12px",
  boxShadow: "none",
  ...safeTextStyle,
};

const ghostButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.05))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  color: "var(--historietas-secondary-button-text, #E4E4E7)",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 12px",
  ...safeTextStyle,
};

const copyLinkButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  background:
    "color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 12px",
  boxShadow: "none",
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
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  lineHeight: 1.4,
  fontWeight: 800,
  textAlign: "center",
  gridColumn: "1 / -1",
  ...safeTextStyle,
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "7px",
  marginTop: "10px",
  minWidth: 0,
};

const statCardStyle: CSSProperties = {
  borderRadius: "16px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.045))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.065))",
  padding: "9px 7px",
  display: "grid",
  gap: "4px",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "none",
  textAlign: "center",
};

const statNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "clamp(17px, 5vw, 22px)",
  fontWeight: 950,
  lineHeight: 1,
  ...safeTextStyle,
};

const statLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "8.5px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  lineHeight: 1.15,
  ...safeTextStyle,
};

const aboutBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: "14px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(33,24,50,0.78)) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.92)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.065))",
  display: "grid",
  gap: "10px",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "var(--historietas-card-shadow, none)",
};

const miniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(23px, 7vw, 32px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const textStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.62,
  fontWeight: 650,
  ...safeTextStyle,
};

const highlightListStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const highlightItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "24px minmax(0, 1fr)",
  gap: "8px",
  alignItems: "center",
  padding: "8px",
  borderRadius: "14px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.045))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.065))",
  minWidth: 0,
};

const highlightIconStyle: CSSProperties = {
  width: "24px",
  height: "24px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(34, 197, 94, 0.24)",
  color: "#86EFAC",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const highlightTextStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #E4E4E7)",
  fontSize: "12px",
  fontWeight: 800,
  lineHeight: 1.45,
  ...safeTextStyle,
};

const tagsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px",
  minWidth: 0,
};

const tagStyle: CSSProperties = {
  maxWidth: "100%",
  padding: "7px 9px",
  borderRadius: "999px",
  background:
    "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, transparent)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 28%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 900,
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

const communityBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: "13px",
  borderRadius: "20px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(255,255,255,0.045)) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.78)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.06))",
  display: "grid",
  gap: "10px",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "var(--historietas-card-shadow, none)",
};

const communityHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "wrap",
  minWidth: 0,
};

const communityTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(22px, 6vw, 28px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.052em",
  ...safeTextStyle,
};

const communityBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 9px",
  borderRadius: "999px",
  background:
    "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  ...safeTextStyle,
};

const communityGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "8px",
  minWidth: 0,
};

const communityItemStyle: CSSProperties = {
  padding: "9px",
  borderRadius: "14px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.045))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.06))",
  display: "grid",
  gap: "3px",
  minWidth: 0,
  textAlign: "center",
};

const communityNumberStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "18px",
  fontWeight: 950,
  lineHeight: 1,
  ...safeTextStyle,
};

const communityLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  ...safeTextStyle,
};

const reviewBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: "13px",
  borderRadius: "20px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(33,24,50,0.80)) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.92)) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 8%, var(--historietas-border-soft, rgba(255,255,255,0.06)))",
  display: "grid",
  gap: "10px",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "var(--historietas-card-shadow, none)",
};

const reviewTopStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: "10px",
  alignItems: "start",
  minWidth: 0,
};

const ratingSummaryStyle: CSSProperties = {
  display: "grid",
  justifyItems: "end",
  gap: "2px",
  minWidth: 0,
};

const ratingNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "28px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

const ratingStarsStyle: CSSProperties = {
  color: "#FBBF24",
  fontSize: "12px",
  letterSpacing: "-0.02em",
  ...safeTextStyle,
};

const ratingTotalStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  fontWeight: 900,
  textTransform: "uppercase",
  textAlign: "right",
  ...safeTextStyle,
};

const commentsGridStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const commentCardStyle: CSSProperties = {
  padding: "9px",
  borderRadius: "14px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.045))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.06))",
  display: "grid",
  gap: "4px",
  minWidth: 0,
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
  marginTop: "16px",
  minWidth: 0,
};

const sectionHeaderStyle: CSSProperties = {
  marginBottom: "10px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "10px",
  flexWrap: "wrap",
  minWidth: 0,
};

const chapterCountBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 9px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-secondary-button-text, #E4E4E7)",
  fontSize: "11px",
  fontWeight: 900,
  ...safeTextStyle,
};

const chaptersListStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  minWidth: 0,
};

const chapterCardStyle: CSSProperties = {
  padding: "10px",
  borderRadius: "18px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(33,24,50,0.78)) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.92)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.065))",
  display: "grid",
  gridTemplateColumns: "40px minmax(0, 1fr)",
  gap: "9px",
  alignItems: "center",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "var(--historietas-card-shadow, none)",
};

const chapterNumberStyle: CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "13px",
  background:
    "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, var(--historietas-surface, transparent))",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, var(--historietas-border-soft, transparent))",
  color: "var(--historietas-accent, #F97316)",
  fontSize: "14px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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
  fontWeight: 950,
  lineHeight: 1.08,
  letterSpacing: "-0.04em",
  ...safeTextStyle,
};

const chapterMetaStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 800,
  lineHeight: 1.45,
  ...safeTextStyle,
};

const chapterButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 82%, #111827) 100%)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 10px",
  gridColumn: "1 / -1",
  boxShadow: "none",
  ...safeTextStyle,
};







const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  borderRadius: "30px",
};

const desktopHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  gridTemplateColumns: "280px minmax(0, 1fr)",
  gap: "12px 26px",
  padding: "26px",
  alignItems: "center",
};

const desktopCoverArtStyle: CSSProperties = {
  ...coverArtStyle,
  gridColumn: "1",
  gridRow: "1 / span 7",
  minHeight: "392px",
  borderRadius: "26px",
};

const desktopBadgeRowStyle: CSSProperties = {
  ...badgeRowStyle,
  gridColumn: "2",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  gridColumn: "2",
  fontSize: "clamp(52px, 5.4vw, 78px)",
  maxWidth: "780px",
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  gridColumn: "2",
  maxWidth: "760px",
  fontSize: "14px",
  lineHeight: 1.68,
};

const desktopInfoRowStyle: CSSProperties = {
  ...infoRowStyle,
  gridColumn: "2",
};

const desktopHeroActionsStyle: CSSProperties = {
  ...heroActionsStyle,
  gridColumn: "2",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  maxWidth: "780px",
};

const desktopStatsGridStyle: CSSProperties = {
  ...statsGridStyle,
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "8px",
  marginTop: "12px",
};

const desktopAboutBoxStyle: CSSProperties = {
  ...aboutBoxStyle,
  padding: "18px",
  borderRadius: "24px",
  marginTop: "12px",
};

const desktopHighlightListStyle: CSSProperties = {
  ...highlightListStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "8px",
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
  padding: "16px",
  borderRadius: "24px",
  marginTop: "12px",
};

const desktopReviewBoxStyle: CSSProperties = {
  ...reviewBoxStyle,
  padding: "16px",
  borderRadius: "24px",
  marginTop: "12px",
};

const desktopCommentsGridStyle: CSSProperties = {
  ...commentsGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
};

const desktopChaptersListStyle: CSSProperties = {
  ...chaptersListStyle,
  gap: "10px",
};

const desktopChapterCardStyle: CSSProperties = {
  ...chapterCardStyle,
  gridTemplateColumns: "54px minmax(0, 1fr) 132px",
  padding: "12px",
  gap: "12px",
};

const desktopChapterButtonStyle: CSSProperties = {
  ...chapterButtonStyle,
  gridColumn: "auto",
  minHeight: "38px",
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
