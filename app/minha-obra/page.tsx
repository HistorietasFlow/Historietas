"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
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

type AvaliacoesObras = {
  [obraId: string]: number;
};

type ReviewObra = {
  id: string;
  texto: string;
  nota: number;
  criadoEm: string;
};

type ReviewsObras = {
  [obraId: string]: ReviewObra[];
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

type OrdemCapitulos = "crescente" | "decrescente";

type FiltroCapitulos =
  | "todos"
  | "nao-lidos"
  | "lidos"
  | "salvos"
  | "curtidos"
  | "comentados";

const STORAGE_KEY = "historietas-obras";
const FOLLOW_STORAGE_KEY = "historietas-obras-seguidas";
const RATING_STORAGE_KEY = "historietas-avaliacoes-obras";
const REVIEW_STORAGE_KEY = "historietas-reviews-obras";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const NOTIFICATIONS_STORAGE_KEY = "historietas-notificacoes";
const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";

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

function normalizarCapitulo(
  capitulo: Partial<CapituloLocal>,
  index: number
): CapituloLocal {
  return {
    id:
      typeof capitulo.id === "string" && capitulo.id.trim()
        ? capitulo.id
        : `capitulo-${index + 1}`,
    titulo: capitulo.titulo || `Capítulo ${index + 1}`,
    texto: capitulo.texto || "Nenhum texto foi escrito ainda.",
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

function formatarTamanhoArquivo(tamanho: number) {
  if (!Number.isFinite(tamanho) || tamanho <= 0) {
    return "0 KB";
  }

  if (tamanho >= 1024 * 1024) {
    return `${(tamanho / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(tamanho / 1024))} KB`;
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
    titulo: obra.titulo || "Obra sem título",
    autor: obra.autor || "Autor não informado",
    genero: obra.genero || "Não informado",
    formato: obra.formato || "Não informado",
    classificacaoIndicativa:
      typeof obra.classificacaoIndicativa === "string" &&
      obra.classificacaoIndicativa.trim()
        ? obra.classificacaoIndicativa
        : "Não informada",
    sinopse: obra.sinopse || "Nenhuma sinopse informada.",
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

function removerNotificacoesDoCapituloExcluido(
  obraId: string,
  capituloId: string
) {
  try {
    const notificacoesTexto = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const notificacoesJson = notificacoesTexto
      ? JSON.parse(notificacoesTexto)
      : [];

    const novasNotificacoes = Array.isArray(notificacoesJson)
      ? notificacoesJson.filter((notificacao) => {
          if (!notificacao || typeof notificacao !== "object") {
            return false;
          }

          const notificacaoComCapitulo = notificacao as {
            obraId?: unknown;
            capituloId?: unknown;
          };

          return !(
            notificacaoComCapitulo.obraId === obraId &&
            notificacaoComCapitulo.capituloId === capituloId
          );
        })
      : [];

    localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(novasNotificacoes)
    );
  } catch {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([]));
  }
}

function criarCoverStyle(capa: string): CSSProperties {
  if (!capa) {
    return coverStyle;
  }

  return {
    ...coverStyle,
    background: "var(--historietas-input-bg, #18181B)",
    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.82) 100%), url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarDesktopCoverStyle(capa: string): CSSProperties {
  if (!capa) {
    return desktopCoverStyle;
  }

  return {
    ...desktopCoverStyle,
    background: "var(--historietas-input-bg, #18181B)",
    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.82) 100%), url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function formatarData(dataIso: string) {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return "Data não informada";
  }

  return data.toLocaleDateString("pt-BR");
}

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}

function encontrarCapituloParaContinuar(obra: ObraLocal) {
  const capituloRegistrado = obra.ultimoCapituloLidoId
    ? obra.capitulos.find(
        (capitulo) => capitulo.id === obra.ultimoCapituloLidoId
      )
    : null;

  if (capituloRegistrado) {
    return capituloRegistrado;
  }

  const capitulosAtivos = obra.capitulos.filter((capitulo) => {
    return (
      capitulo.lido ||
      capitulo.salvo ||
      capitulo.curtiu ||
      Boolean(capitulo.comentario.trim())
    );
  });

  return capitulosAtivos[capitulosAtivos.length - 1] || null;
}

function contarPalavrasTexto(texto: string) {
  const palavras = texto.trim().split(/\s+/).filter(Boolean);

  return palavras.length;
}

function calcularTempoLeituraMinutos(totalPalavras: number) {
  if (totalPalavras <= 0) {
    return 0;
  }

  return Math.max(1, Math.ceil(totalPalavras / 220));
}

function formatarNota(nota: number) {
  if (!nota) {
    return "0";
  }

  return Number.isInteger(nota)
    ? String(nota)
    : nota.toFixed(1).replace(".", ",");
}

function obterPreenchimentoEstrela(notaAtual: number, estrela: number) {
  if (notaAtual >= estrela) {
    return 100;
  }

  if (notaAtual >= estrela - 0.5) {
    return 50;
  }

  return 0;
}

function normalizarListaIds(valor: unknown): string[] {
  return Array.isArray(valor)
    ? Array.from(
        new Set(
          valor
            .filter(
              (id): id is string =>
                typeof id === "string" && Boolean(id.trim())
            )
            .map((id) => id.trim())
        )
      )
    : [];
}

function obterChavesObra(obra: Pick<ObraLocal, "id" | "slug" | "titulo">) {
  return Array.from(
    new Set(
      [obra.id, obra.slug, criarSlugBase(obra.titulo), normalizarTexto(obra.titulo)]
        .filter((chave): chave is string =>
          typeof chave === "string" && Boolean(chave.trim())
        )
        .map((chave) => chave.trim())
    )
  );
}

function listaIncluiObra(lista: string[], obra: Pick<ObraLocal, "id" | "slug" | "titulo">) {
  const valores = new Set(lista.map((item) => item.trim()).filter(Boolean));

  return obterChavesObra(obra).some((chave) => valores.has(chave));
}

function adicionarObraNaLista(
  lista: string[],
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">
) {
  return Array.from(new Set([...lista, ...obterChavesObra(obra)]));
}

function removerObraDaLista(
  lista: string[],
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">
) {
  const chaves = new Set(obterChavesObra(obra));

  return lista.filter((item) => !chaves.has(item));
}

function carregarBackupArquivosObras() {
  if (typeof window === "undefined") {
    return {} as Record<string, ArquivoObraLocal>;
  }

  try {
    const backupTexto = localStorage.getItem(FILE_BACKUP_STORAGE_KEY);
    const backupJson: unknown = backupTexto ? JSON.parse(backupTexto) : {};

    if (!backupJson || typeof backupJson !== "object" || Array.isArray(backupJson)) {
      return {};
    }

    const backupNormalizado: Record<string, ArquivoObraLocal> = {};

    Object.entries(backupJson as Record<string, unknown>).forEach(([chave, arquivo]) => {
      const arquivoNormalizado = normalizarArquivoObra(arquivo);

      if (chave.trim() && arquivoNormalizado) {
        backupNormalizado[chave] = arquivoNormalizado;
      }
    });

    localStorage.setItem(FILE_BACKUP_STORAGE_KEY, JSON.stringify(backupNormalizado));

    return backupNormalizado;
  } catch {
    return {};
  }
}

function restaurarArquivoObraComBackup(
  obra: ObraLocal,
  backup: Record<string, ArquivoObraLocal>
) {
  if (obra.arquivoObra) {
    return obra;
  }

  const arquivoBackup = obterChavesObra(obra)
    .map((chave) => normalizarArquivoObra(backup[chave]))
    .find((arquivo): arquivo is ArquivoObraLocal => Boolean(arquivo));

  return arquivoBackup ? { ...obra, arquivoObra: arquivoBackup } : obra;
}

function sincronizarBackupArquivosObras(obrasParaBackup: ObraLocal[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const backupAtual = carregarBackupArquivosObras();

    obrasParaBackup.forEach((obra) => {
      if (!obra.arquivoObra) {
        return;
      }

      obterChavesObra(obra).forEach((chave) => {
        backupAtual[chave] = obra.arquivoObra as ArquivoObraLocal;
      });
    });

    localStorage.setItem(FILE_BACKUP_STORAGE_KEY, JSON.stringify(backupAtual));
  } catch {
    // O backup é apenas proteção extra. Não deve travar a página.
  }
}

function obterCategoriaArquivoSupabase(
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
    categoria: obterCategoriaArquivoSupabase(
      obra.arquivo_categoria || arquivoLocal?.categoria || "outro"
    ),
    criadoEm: obra.criada_em || arquivoLocal?.criadoEm || "",
  };
}

function mesclarCapituloSupabaseComLocal(
  capitulo: CapituloSupabaseRow,
  index: number,
  capituloLocal?: CapituloLocal
): CapituloLocal {
  return {
    id: capitulo.id,
    titulo:
      capitulo.titulo?.trim() || capituloLocal?.titulo || `Capítulo ${index + 1}`,
    texto:
      typeof capitulo.texto === "string" && capitulo.texto.trim()
        ? capitulo.texto
        : capituloLocal?.texto || "Nenhum texto foi escrito ainda.",
    curtiu: Boolean(capituloLocal?.curtiu),
    salvo: Boolean(capituloLocal?.salvo),
    comentario: capituloLocal?.comentario || "",
    criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
    lido: Boolean(capituloLocal?.lido),
    lidoEm: capituloLocal?.lidoEm || "",
  };
}

function mesclarObraSupabaseComLocal(
  obraSupabase: ObraSupabaseRow,
  capitulosSupabase: CapituloSupabaseRow[],
  obraLocal?: ObraLocal | null
): ObraLocal {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo])
  );

  const capitulosMesclados =
    capitulosSupabase.length > 0
      ? capitulosSupabase.map((capitulo, index) =>
          mesclarCapituloSupabaseComLocal(
            capitulo,
            index,
            capitulosLocaisPorId.get(capitulo.id)
          )
        )
      : obraLocal?.capitulos || [];

  const tagsSupabase = Array.isArray(obraSupabase.tags)
    ? obraSupabase.tags.filter(
        (tag): tag is string => typeof tag === "string" && Boolean(tag.trim())
      )
    : [];

  const obraMesclada: ObraLocal = {
    id: obraSupabase.id,
    titulo: obraSupabase.titulo?.trim() || obraLocal?.titulo || "Obra sem título",
    autor: obraSupabase.autor?.trim() || obraLocal?.autor || "Autor não informado",
    genero: obraSupabase.genero?.trim() || obraLocal?.genero || "Não informado",
    formato: obraSupabase.formato?.trim() || obraLocal?.formato || "Não informado",
    classificacaoIndicativa:
      obraSupabase.classificacao_indicativa?.trim() ||
      obraLocal?.classificacaoIndicativa ||
      "Não informada",
    sinopse:
      obraSupabase.sinopse?.trim() ||
      obraLocal?.sinopse ||
      "Nenhuma sinopse informada.",
    tags:
      tagsSupabase.length > 0
        ? tagsSupabase
        : obraLocal?.tags && obraLocal.tags.length > 0
        ? obraLocal.tags
        : ["sem tags"],
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
    slug:
      obraSupabase.slug?.trim() ||
      obraLocal?.slug ||
      criarSlugBase(obraSupabase.titulo || obraLocal?.titulo || "obra"),
    link:
      obraSupabase.link?.trim() ||
      obraLocal?.link ||
      `/obra/${
        obraSupabase.slug?.trim() ||
        obraLocal?.slug ||
        criarSlugBase(obraSupabase.titulo || obraLocal?.titulo || "obra")
      }`,
  };

  return normalizarObra(obraMesclada, 0);
}

async function carregarObraSupabase(
  obraId: string,
  obraLocal?: ObraLocal | null
) {
  const { data: obraSupabase, error: erroObra } = await supabase
    .from("obras")
    .select("*")
    .eq("id", obraId)
    .maybeSingle();

  if (erroObra || !obraSupabase) {
    return null;
  }

  const { data: capitulosSupabase, error: erroCapitulos } = await supabase
    .from("capitulos")
    .select("*")
    .eq("obra_id", obraId)
    .order("ordem", { ascending: true });

  if (erroCapitulos) {
    return mesclarObraSupabaseComLocal(
      obraSupabase as ObraSupabaseRow,
      [],
      obraLocal
    );
  }

  return mesclarObraSupabaseComLocal(
    obraSupabase as ObraSupabaseRow,
    (capitulosSupabase || []) as CapituloSupabaseRow[],
    obraLocal
  );
}

async function carregarIdsTabelaUsuario(
  tabela: "seguindo_obras" | "favoritos" | "concluidas",
  userId: string
) {
  const { data, error } = await supabase
    .from(tabela)
    .select("obra_id")
    .eq("user_id", userId);

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data
    .map((item) => {
      if (!item || typeof item !== "object" || !("obra_id" in item)) {
        return "";
      }

      return typeof item.obra_id === "string" ? item.obra_id : "";
    })
    .filter(Boolean);
}

export default function MinhaObraPage() {
  const [obraId, setObraId] = useState("");
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [obrasSeguidas, setObrasSeguidas] = useState<string[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [avaliacoesObras, setAvaliacoesObras] = useState<AvaliacoesObras>({});
  const [reviewsObras, setReviewsObras] = useState<ReviewsObras>({});
  const [reviewTexto, setReviewTexto] = useState("");
  const [reviewNota, setReviewNota] = useState(0);
  const [buscaCapitulo, setBuscaCapitulo] = useState("");
  const [ordemCapitulos, setOrdemCapitulos] =
    useState<OrdemCapitulos>("crescente");
  const [filtroCapitulos, setFiltroCapitulos] =
    useState<FiltroCapitulos>("todos");
  const [carregando, setCarregando] = useState(true);
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

    async function carregarDadosDaObra() {
      const params = new URLSearchParams(window.location.search);
      const obraIdParam = params.get("obraId") || "";

      setObraId(obraIdParam);

      try {
        const obrasSalvasTexto = localStorage.getItem(STORAGE_KEY);
        const obrasSalvasJson = obrasSalvasTexto
          ? JSON.parse(obrasSalvasTexto)
          : [];

        const backupArquivosObras = carregarBackupArquivosObras();
        let obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
          ? obrasSalvasJson
              .map((obra, index) => normalizarObra(obra, index))
              .map((obra) =>
                restaurarArquivoObraComBackup(obra, backupArquivosObras)
              )
          : [];

        const obrasSeguidasTexto = localStorage.getItem(FOLLOW_STORAGE_KEY);
        const obrasSeguidasJson = obrasSeguidasTexto
          ? JSON.parse(obrasSeguidasTexto)
          : [];

        let obrasSeguidasNormalizadas = normalizarListaIds(obrasSeguidasJson);

        const obrasFavoritasTexto = localStorage.getItem(FAVORITES_STORAGE_KEY);
        const obrasFavoritasJson = obrasFavoritasTexto
          ? JSON.parse(obrasFavoritasTexto)
          : [];

        let obrasFavoritasNormalizadas = normalizarListaIds(obrasFavoritasJson);

        const obrasConcluidasTexto = localStorage.getItem(COMPLETED_STORAGE_KEY);
        const obrasConcluidasJson = obrasConcluidasTexto
          ? JSON.parse(obrasConcluidasTexto)
          : [];

        let obrasConcluidasNormalizadas = normalizarListaIds(obrasConcluidasJson);

        const avaliacoesTexto = localStorage.getItem(RATING_STORAGE_KEY);
        const avaliacoesJson = avaliacoesTexto ? JSON.parse(avaliacoesTexto) : {};

        const avaliacoesNormalizadas: AvaliacoesObras =
          avaliacoesJson &&
          typeof avaliacoesJson === "object" &&
          !Array.isArray(avaliacoesJson)
            ? Object.entries(avaliacoesJson).reduce<AvaliacoesObras>(
                (resultado, [id, nota]) => {
                  if (
                    typeof id === "string" &&
                    typeof nota === "number" &&
                    nota >= 0.5 &&
                    nota <= 5
                  ) {
                    resultado[id] = nota;
                  }

                  return resultado;
                },
                {}
              )
            : {};

        const reviewsTexto = localStorage.getItem(REVIEW_STORAGE_KEY);
        const reviewsJson = reviewsTexto ? JSON.parse(reviewsTexto) : {};

        const reviewsNormalizadas: ReviewsObras =
          reviewsJson &&
          typeof reviewsJson === "object" &&
          !Array.isArray(reviewsJson)
            ? Object.entries(reviewsJson).reduce<ReviewsObras>(
                (resultado, [idObra, reviews]) => {
                  if (typeof idObra !== "string" || !Array.isArray(reviews)) {
                    return resultado;
                  }

                  const reviewsValidas = reviews
                    .filter((review): review is ReviewObra => {
                      return (
                        review &&
                        typeof review === "object" &&
                        typeof review.id === "string" &&
                        typeof review.texto === "string" &&
                        typeof review.nota === "number" &&
                        review.nota >= 0.5 &&
                        review.nota <= 5 &&
                        typeof review.criadoEm === "string"
                      );
                    })
                    .map((review) => ({
                      id: review.id,
                      texto: review.texto,
                      nota: review.nota,
                      criadoEm: review.criadoEm,
                    }));

                  resultado[idObra] = reviewsValidas;

                  return resultado;
                },
                {}
              )
            : {};

        if (obraIdParam) {
          const obraLocal =
            obrasNormalizadas.find((obra) => obra.id === obraIdParam) || null;
          const obraSupabase = await carregarObraSupabase(obraIdParam, obraLocal);

          if (obraSupabase) {
            obrasNormalizadas = [
              obraSupabase,
              ...obrasNormalizadas.filter((obra) => obra.id !== obraSupabase.id),
            ];
          }
        }

        const { data: dadosUsuario } = await supabase.auth.getUser();

        if (dadosUsuario.user) {
          const [seguidasSupabase, favoritasSupabase, concluidasSupabase] =
            await Promise.all([
              carregarIdsTabelaUsuario("seguindo_obras", dadosUsuario.user.id),
              carregarIdsTabelaUsuario("favoritos", dadosUsuario.user.id),
              carregarIdsTabelaUsuario("concluidas", dadosUsuario.user.id),
            ]);

          obrasSeguidasNormalizadas = Array.from(
            new Set([...obrasSeguidasNormalizadas, ...seguidasSupabase])
          );
          obrasFavoritasNormalizadas = Array.from(
            new Set([...obrasFavoritasNormalizadas, ...favoritasSupabase])
          );
          obrasConcluidasNormalizadas = Array.from(
            new Set([...obrasConcluidasNormalizadas, ...concluidasSupabase])
          );
        }

        sincronizarBackupArquivosObras(obrasNormalizadas);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasNormalizadas));
        localStorage.setItem(
          FOLLOW_STORAGE_KEY,
          JSON.stringify(obrasSeguidasNormalizadas)
        );
        localStorage.setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify(obrasFavoritasNormalizadas)
        );
        localStorage.setItem(
          COMPLETED_STORAGE_KEY,
          JSON.stringify(obrasConcluidasNormalizadas)
        );

        if (cancelado) {
          return;
        }

        setObras(obrasNormalizadas);
        setObrasSeguidas(obrasSeguidasNormalizadas);
        setObrasFavoritas(obrasFavoritasNormalizadas);
        setObrasConcluidas(obrasConcluidasNormalizadas);
        setAvaliacoesObras(avaliacoesNormalizadas);
        setReviewsObras(reviewsNormalizadas);
      } catch {
        if (cancelado) {
          return;
        }

        setObras([]);
        setObrasSeguidas([]);
        setObrasFavoritas([]);
        setObrasConcluidas([]);
        setAvaliacoesObras({});
        setReviewsObras({});
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    carregarDadosDaObra();

    return () => {
      cancelado = true;
    };
  }, []);

  const obraAtual = useMemo(() => {
    return obras.find((obra) => obra.id === obraId) || null;
  }, [obras, obraId]);

  const seguindoObra = obraAtual ? listaIncluiObra(obrasSeguidas, obraAtual) : false;
  const obraFavorita = obraAtual ? listaIncluiObra(obrasFavoritas, obraAtual) : false;
  const obraConcluida = obraAtual
    ? listaIncluiObra(obrasConcluidas, obraAtual)
    : false;
  const notaUsuario = obraAtual ? avaliacoesObras[obraAtual.id] || 0 : 0;
  const reviewsDaObra = obraAtual ? reviewsObras[obraAtual.id] || [] : [];
  const notaMediaReviews =
    reviewsDaObra.length > 0
      ? Number(
          (
            reviewsDaObra.reduce((total, review) => total + review.nota, 0) /
            reviewsDaObra.length
          ).toFixed(1)
        )
      : 0;
  const notaMedia = notaMediaReviews || notaUsuario;
  const classificacaoIndicativa =
    obraAtual?.classificacaoIndicativa?.trim() || "Não informada";
  const arquivoObra = obraAtual?.arquivoObra || null;
  const arquivoObraTipoTexto = arquivoObra
    ? obterTipoArquivoTexto(arquivoObra)
    : "";
  const arquivoObraTamanhoTexto = arquivoObra
    ? formatarTamanhoArquivo(arquivoObra.tamanho)
    : "";

  useEffect(() => {
    if (!obraAtual) {
      return;
    }

    setReviewNota(notaUsuario);
  }, [obraAtual?.id, notaUsuario]);

  const totais = useMemo(() => {
    if (!obraAtual) {
      return {
        totalCurtidas: 0,
        totalComentarios: 0,
        totalSalvos: 0,
        totalLidos: 0,
        totalPalavras: 0,
        tempoLeituraMinutos: 0,
      };
    }

    const totalPalavras = obraAtual.capitulos.reduce((total, capitulo) => {
      return total + contarPalavrasTexto(capitulo.texto);
    }, 0);

    return {
      totalCurtidas: obraAtual.capitulos.filter((capitulo) => capitulo.curtiu)
        .length,
      totalComentarios: obraAtual.capitulos.filter((capitulo) =>
        capitulo.comentario.trim()
      ).length,
      totalSalvos: obraAtual.capitulos.filter((capitulo) => capitulo.salvo)
        .length,
      totalLidos: obraAtual.capitulos.filter((capitulo) => capitulo.lido)
        .length,
      totalPalavras,
      tempoLeituraMinutos: calcularTempoLeituraMinutos(totalPalavras),
    };
  }, [obraAtual]);

  const primeiroCapitulo = useMemo(() => {
    if (!obraAtual || obraAtual.capitulos.length === 0) {
      return null;
    }

    return obraAtual.capitulos[0];
  }, [obraAtual]);

  const ultimoCapitulo = useMemo(() => {
    if (!obraAtual || obraAtual.capitulos.length === 0) {
      return null;
    }

    return obraAtual.capitulos[obraAtual.capitulos.length - 1];
  }, [obraAtual]);

  const capituloParaContinuar = obraAtual
    ? encontrarCapituloParaContinuar(obraAtual)
    : null;

  const progressoLeitura = obraAtual
    ? calcularProgressoLeitura(obraAtual.capitulos)
    : 0;

  const filtrosCapitulos = useMemo(() => {
    if (!obraAtual) {
      return [];
    }

    return [
      {
        id: "todos" as const,
        titulo: "Todos",
        total: obraAtual.capitulos.length,
      },
      {
        id: "nao-lidos" as const,
        titulo: "Não lidos",
        total: obraAtual.capitulos.filter((capitulo) => !capitulo.lido).length,
      },
      {
        id: "lidos" as const,
        titulo: "Lidos",
        total: obraAtual.capitulos.filter((capitulo) => capitulo.lido).length,
      },
      {
        id: "salvos" as const,
        titulo: "Salvos",
        total: obraAtual.capitulos.filter((capitulo) => capitulo.salvo).length,
      },
      {
        id: "curtidos" as const,
        titulo: "Curtidos",
        total: obraAtual.capitulos.filter((capitulo) => capitulo.curtiu).length,
      },
      {
        id: "comentados" as const,
        titulo: "Comentados",
        total: obraAtual.capitulos.filter((capitulo) =>
          capitulo.comentario.trim()
        ).length,
      },
    ];
  }, [obraAtual]);

  const capitulosFiltrados = useMemo(() => {
    if (!obraAtual) {
      return [];
    }

    const termo = buscaCapitulo.trim().toLowerCase();

    const capitulosComIndice = obraAtual.capitulos.map((capitulo, index) => ({
      capitulo,
      index,
    }));

    const capitulosPorFiltro = capitulosComIndice.filter(({ capitulo }) => {
      if (filtroCapitulos === "nao-lidos") {
        return !capitulo.lido;
      }

      if (filtroCapitulos === "lidos") {
        return capitulo.lido;
      }

      if (filtroCapitulos === "salvos") {
        return capitulo.salvo;
      }

      if (filtroCapitulos === "curtidos") {
        return capitulo.curtiu;
      }

      if (filtroCapitulos === "comentados") {
        return Boolean(capitulo.comentario.trim());
      }

      return true;
    });

    const capitulosEncontrados = termo
      ? capitulosPorFiltro.filter(({ capitulo, index }) => {
          return (
            capitulo.titulo.toLowerCase().includes(termo) ||
            capitulo.texto.toLowerCase().includes(termo) ||
            capitulo.comentario.toLowerCase().includes(termo) ||
            String(index + 1).includes(termo)
          );
        })
      : capitulosPorFiltro;

    if (ordemCapitulos === "decrescente") {
      return [...capitulosEncontrados].reverse();
    }

    return capitulosEncontrados;
  }, [obraAtual, buscaCapitulo, ordemCapitulos, filtroCapitulos]);

  function salvarObras(novasObras: ObraLocal[]) {
    const obrasNormalizadas = novasObras.map((obra, index) =>
      normalizarObra(obra, index)
    );

    sincronizarBackupArquivosObras(obrasNormalizadas);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasNormalizadas));
    setObras(obrasNormalizadas);
  }

  async function alternarSeguirObra() {
    if (!obraAtual) return;

    const novasObrasSeguidas = seguindoObra
      ? removerObraDaLista(obrasSeguidas, obraAtual)
      : adicionarObraNaLista(obrasSeguidas, obraAtual);

    localStorage.setItem(
      FOLLOW_STORAGE_KEY,
      JSON.stringify(novasObrasSeguidas)
    );

    setObrasSeguidas(novasObrasSeguidas);

    try {
      const { data: dadosUsuario } = await supabase.auth.getUser();

      if (!dadosUsuario.user) {
        return;
      }

      if (seguindoObra) {
        await supabase
          .from("seguindo_obras")
          .delete()
          .eq("user_id", dadosUsuario.user.id)
          .eq("obra_id", obraAtual.id);
        return;
      }

      await supabase.from("seguindo_obras").upsert(
        {
          user_id: dadosUsuario.user.id,
          obra_id: obraAtual.id,
        },
        {
          onConflict: "user_id,obra_id",
        }
      );
    } catch {
      // Mantém o localStorage como fallback nesta fase da migração.
    }
  }

  async function alternarFavorito() {
    if (!obraAtual) return;

    const novasObrasFavoritas = obraFavorita
      ? removerObraDaLista(obrasFavoritas, obraAtual)
      : adicionarObraNaLista(obrasFavoritas, obraAtual);

    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(novasObrasFavoritas)
    );

    setObrasFavoritas(novasObrasFavoritas);

    try {
      const { data: dadosUsuario } = await supabase.auth.getUser();

      if (!dadosUsuario.user) {
        return;
      }

      if (obraFavorita) {
        await supabase
          .from("favoritos")
          .delete()
          .eq("user_id", dadosUsuario.user.id)
          .eq("obra_id", obraAtual.id);
        return;
      }

      await supabase.from("favoritos").upsert(
        {
          user_id: dadosUsuario.user.id,
          obra_id: obraAtual.id,
        },
        {
          onConflict: "user_id,obra_id",
        }
      );
    } catch {
      // Mantém o localStorage como fallback nesta fase da migração.
    }
  }

  async function alternarConcluido() {
    if (!obraAtual) return;

    const novasObrasConcluidas = obraConcluida
      ? removerObraDaLista(obrasConcluidas, obraAtual)
      : adicionarObraNaLista(obrasConcluidas, obraAtual);

    localStorage.setItem(
      COMPLETED_STORAGE_KEY,
      JSON.stringify(novasObrasConcluidas)
    );

    setObrasConcluidas(novasObrasConcluidas);

    try {
      const { data: dadosUsuario } = await supabase.auth.getUser();

      if (!dadosUsuario.user) {
        return;
      }

      if (obraConcluida) {
        await supabase
          .from("concluidas")
          .delete()
          .eq("user_id", dadosUsuario.user.id)
          .eq("obra_id", obraAtual.id);
        return;
      }

      await supabase.from("concluidas").upsert(
        {
          user_id: dadosUsuario.user.id,
          obra_id: obraAtual.id,
        },
        {
          onConflict: "user_id,obra_id",
        }
      );
    } catch {
      // Mantém o localStorage como fallback nesta fase da migração.
    }
  }

  async function copiarLinkPublico() {
    if (!obraAtual) return;

    const linkPublico =
      obraAtual.link || `/obra/${obraAtual.slug || criarSlugBase(obraAtual.titulo)}`;
    const linkAbsoluto = linkPublico.startsWith("http")
      ? linkPublico
      : `${window.location.origin}${
          linkPublico.startsWith("/") ? linkPublico : `/${linkPublico}`
        }`;

    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(linkAbsoluto);
        } catch {
          copiarTextoComFallback(linkAbsoluto);
        }
      } else {
        copiarTextoComFallback(linkAbsoluto);
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

  function alternarNotaPorEstrela(estrela: number) {
    const meiaEstrela = estrela - 0.5;
    const estrelaCompleta = estrela;

    if (reviewNota === 0) {
      setReviewNota(meiaEstrela);
      return;
    }

    if (reviewNota === meiaEstrela) {
      setReviewNota(estrelaCompleta);
      return;
    }

    if (reviewNota === estrelaCompleta) {
      setReviewNota(0);
      return;
    }

    setReviewNota(meiaEstrela);
  }

  function salvarAvaliacaoOuReview() {
    if (!obraAtual) return;

    const textoLimpo = reviewTexto.trim();

    if (reviewNota < 0.5 || reviewNota > 5) {
      window.alert("Escolha uma nota de 0,5 a 5 estrelas.");
      return;
    }

    if (textoLimpo.length > 0 && textoLimpo.length < 3) {
      window.alert("Escreva uma review com pelo menos 3 caracteres ou deixe o comentário vazio para salvar só a nota.");
      return;
    }

    const novasAvaliacoes = {
      ...avaliacoesObras,
      [obraAtual.id]: reviewNota,
    };

    localStorage.setItem(RATING_STORAGE_KEY, JSON.stringify(novasAvaliacoes));
    setAvaliacoesObras(novasAvaliacoes);

    if (!textoLimpo) {
      return;
    }

    const novaReview: ReviewObra = {
      id: `review-${Date.now()}`,
      texto: textoLimpo,
      nota: reviewNota,
      criadoEm: new Date().toISOString(),
    };

    const novasReviews = {
      ...reviewsObras,
      [obraAtual.id]: [novaReview, ...reviewsDaObra],
    };

    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(novasReviews));
    setReviewsObras(novasReviews);
    setReviewTexto("");
  }

  function excluirReview(reviewId: string) {
    if (!obraAtual) return;

    const confirmar = window.confirm(
      "Tem certeza que deseja excluir esta review?"
    );

    if (!confirmar) return;

    const novasReviewsDaObra = reviewsDaObra.filter(
      (review) => review.id !== reviewId
    );

    const novasReviews = {
      ...reviewsObras,
      [obraAtual.id]: novasReviewsDaObra,
    };

    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(novasReviews));
    setReviewsObras(novasReviews);
  }

  async function excluirCapitulo(capituloId: string, tituloCapitulo: string) {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir o capítulo "${tituloCapitulo}"? Essa ação não pode ser desfeita.`
    );

    if (!confirmar) return;

    try {
      const { data: dadosUsuario } = await supabase.auth.getUser();

      if (dadosUsuario.user) {
        const { error } = await supabase
          .from("capitulos")
          .delete()
          .eq("id", capituloId)
          .eq("obra_id", obraId)
          .eq("user_id", dadosUsuario.user.id);

        if (error) {
          window.alert(
            `Não consegui excluir o capítulo no Supabase: ${error.message}`
          );
          return;
        }
      }
    } catch {
      window.alert("Não consegui excluir o capítulo agora. Tente novamente.");
      return;
    }

    const novasObras = obras.map((obra, obraIndex) => {
      const obraNormalizada = normalizarObra(obra, obraIndex);

      if (obraNormalizada.id !== obraId) {
        return obraNormalizada;
      }

      const capitulosRestantes = obraNormalizada.capitulos.filter(
        (capitulo) => capitulo.id !== capituloId
      );

      const ultimoCapituloLidoRestante = [...capitulosRestantes]
        .reverse()
        .find((capitulo) => capitulo.lido && capitulo.lidoEm);

      const capituloExcluidoEraUltimaLeitura =
        obraNormalizada.ultimoCapituloLidoId === capituloId;

      return {
        ...obraNormalizada,
        capitulos: capitulosRestantes,
        ultimoCapituloLidoId: capituloExcluidoEraUltimaLeitura
          ? ultimoCapituloLidoRestante?.id || ""
          : obraNormalizada.ultimoCapituloLidoId,
        ultimaLeituraEm: capituloExcluidoEraUltimaLeitura
          ? ultimoCapituloLidoRestante?.lidoEm || ""
          : obraNormalizada.ultimaLeituraEm,
        progressoLeitura: calcularProgressoLeitura(capitulosRestantes),
      };
    });

    removerNotificacoesDoCapituloExcluido(obraId, capituloId);
    salvarObras(novasObras);
  }

  if (carregando) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${minhaObraPageCss}`}</style>
        <section style={isDesktop ? desktopContainerStyle : containerStyle} />
      </main>
    );
  }

  if (!obraAtual) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${minhaObraPageCss}`}</style>
        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <header style={isDesktop ? desktopTopStyle : topStyle}>
            <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
              <span style={logoMarkStyle}>H</span>
              <span className="historietas-theme-logo-text" style={logoTextStyle}>istorietas</span>
            </Link>

            <span style={pagePillStyle}>Minha obra</span>
          </header>

          <div style={emptyBoxStyle}>
            <h1 style={emptyTitleStyle}>Obra não encontrada</h1>

            <p style={emptyTextStyle}>
              Volte para Minhas Obras e clique novamente em Ver obra.
            </p>

            <Link href="/minhas-obras" style={emptyButtonStyle}>
              Ir para Minhas Obras
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const adicionarCapituloHref = `/adicionar-capitulo?obraId=${obraAtual.id}`;
  const editarObraHref = `/editar-obra?obraId=${obraAtual.id}`;
  const paginaPublicaHref =
    obraAtual.link || `/obra/${obraAtual.slug || criarSlugBase(obraAtual.titulo)}`;
  const perfilAutorHref = `/perfil-autor?autor=${encodeURIComponent(
    obraAtual.autor
  )}`;

  const primeiroCapituloHref = primeiroCapitulo
    ? `/ler-capitulo?obraId=${obraAtual.id}&capituloId=${primeiroCapitulo.id}`
    : "";

  const capituloPrincipal =
    capituloParaContinuar ||
    obraAtual.capitulos.find((capitulo) => !capitulo.lido) ||
    primeiroCapitulo;

  const leituraPrincipalHref = capituloPrincipal
    ? `/ler-capitulo?obraId=${obraAtual.id}&capituloId=${capituloPrincipal.id}`
    : "";
  const verArquivoHref = `/ver-arquivo?obraId=${encodeURIComponent(obraAtual.id)}`;

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${minhaObraPageCss}`}</style>
      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTopStyle : topStyle}>
          <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
            <span style={logoMarkStyle}>H</span>
            <span className="historietas-theme-logo-text" style={logoTextStyle}>istorietas</span>
          </Link>

          <span style={pagePillStyle}>Minha obra</span>
        </header>

        <section style={isDesktop ? desktopHeroStyle : heroStyle}>
          <div style={isDesktop ? criarDesktopCoverStyle(obraAtual.capa) : criarCoverStyle(obraAtual.capa)}>
            <div style={coverGlowStyle} />

            <span style={coverGenreStyle}>{obraAtual.genero}</span>

            <div style={coverInfoStyle}>
              <strong style={coverNumberStyle}>
                {obraAtual.capitulos.length}
              </strong>

              <span style={coverTextStyle}>
                {obraAtual.capitulos.length === 1 ? "capítulo" : "capítulos"}
              </span>
            </div>
          </div>

          <div style={isDesktop ? desktopContentStyle : contentStyle}>
            <div style={isDesktop ? desktopTopBadgesStyle : topBadgesStyle}>
              <span style={badgeStyle}>{obraAtual.formato}</span>

              <span style={classificationBadgeStyle}>
                {classificacaoIndicativa}
              </span>

              <span
                style={
                  obraAtual.publicado ? publishedBadgeStyle : draftBadgeStyle
                }
              >
                {obraAtual.publicado ? "Publicado" : "Rascunho"}
              </span>

              {seguindoObra && <span style={followingBadgeStyle}>Seguindo</span>}

              {obraFavorita && (
                <span style={favoriteBadgeStyle}>★ Favorita</span>
              )}

              {obraConcluida && (
                <span style={completedBadgeStyle}>✓ Concluída</span>
              )}

              {arquivoObra && (
                <span style={fileBadgeStyle}>Arquivo anexado</span>
              )}
            </div>

            <h1 style={isDesktop ? desktopTitleStyle : titleStyle}>{obraAtual.titulo}</h1>

            <Link href={perfilAutorHref} style={authorLinkStyle}>
              por {obraAtual.autor}
            </Link>

            <p style={isDesktop ? desktopSinopseStyle : sinopseStyle}>{obraAtual.sinopse}</p>

            <div style={tagListStyle}>
              {obraAtual.tags.slice(0, 6).map((tag, index) => (
                <span key={`${obraAtual.id}-${tag}-${index}`} style={tagStyle}>
                  {tag}
                </span>
              ))}
            </div>

            {progressoLeitura > 0 && (
              <div style={progressTrackStyle}>
                <div
                  style={{
                    ...progressBarStyle,
                    width: `${progressoLeitura}%`,
                  }}
                />
              </div>
            )}

            <div style={isDesktop ? desktopHeroActionsGridStyle : heroActionsGridStyle}>
              {capituloPrincipal ? (
                <Link href={leituraPrincipalHref} style={orangeActionStyle}>
                  {capituloParaContinuar ? "Continuar leitura" : "Começar leitura"}
                </Link>
              ) : (
                <Link href={adicionarCapituloHref} style={orangeActionStyle}>
                  + Primeiro capítulo
                </Link>
              )}

              <button
                type="button"
                onClick={alternarSeguirObra}
                style={seguindoObra ? followingActionStyle : followActionStyle}
              >
                {seguindoObra ? "✓ Seguindo" : "+ Seguir"}
              </button>

              <button
                type="button"
                onClick={alternarFavorito}
                style={
                  obraFavorita ? favoriteActionActiveStyle : favoriteActionStyle
                }
              >
                {obraFavorita ? "★ Favorita" : "Favoritar"}
              </button>

              <button
                type="button"
                onClick={alternarConcluido}
                style={
                  obraConcluida
                    ? completedActionActiveStyle
                    : completedActionStyle
                }
              >
                {obraConcluida ? "✓ Concluída" : "Concluir"}
              </button>
            </div>

            <div style={isDesktop ? desktopAuthorActionsStyle : authorActionsStyle}>
              <Link href={editarObraHref} style={secondaryActionStyle}>
                Editar obra
              </Link>

              <Link href={paginaPublicaHref} style={publicPageActionStyle}>
                Ver página pública
              </Link>

              <button
                type="button"
                onClick={copiarLinkPublico}
                style={linkCopiado ? copiedLinkActionStyle : copyLinkActionStyle}
              >
                {linkCopiado ? "Link copiado!" : "Copiar link"}
              </button>

              <Link href={adicionarCapituloHref} style={primaryActionStyle}>
                + Capítulo
              </Link>
            </div>
          </div>
        </section>

        <section style={isDesktop ? desktopStatsGridStyle : statsGridStyle}>
          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{obraAtual.capitulos.length}</strong>
            <span style={statLabelStyle}>capítulos</span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totais.totalCurtidas}</strong>
            <span style={statLabelStyle}>curtidas</span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totais.totalComentarios}</strong>
            <span style={statLabelStyle}>comentários</span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totais.totalSalvos}</strong>
            <span style={statLabelStyle}>salvos</span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totais.totalLidos}</strong>
            <span style={statLabelStyle}>lidos</span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>
              {notaMedia > 0 ? `${formatarNota(notaMedia)}/5` : "—"}
            </strong>
            <span style={statLabelStyle}>avaliação</span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totais.totalPalavras}</strong>
            <span style={statLabelStyle}>palavras</span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>
              {totais.tempoLeituraMinutos > 0
                ? `${totais.tempoLeituraMinutos} min`
                : "—"}
            </strong>
            <span style={statLabelStyle}>leitura</span>
          </div>
        </section>

        <section style={isDesktop ? desktopReadingPlanBoxStyle : readingPlanBoxStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <span style={sectionMiniTitleStyle}>PRÓXIMA AÇÃO</span>
              <h2 style={sectionTitleStyle}>Leitura da obra</h2>
            </div>

            <span style={readingPlanBadgeStyle}>{progressoLeitura}% lido</span>
          </div>

          <p style={readingPlanTextStyle}>
            {capituloPrincipal
              ? `Próximo foco: ${capituloPrincipal.titulo}.`
              : "Essa obra ainda não tem capítulos. Comece criando o primeiro capítulo."}
            {ultimoCapitulo ? ` Último capítulo cadastrado: ${ultimoCapitulo.titulo}.` : ""}
          </p>

          <div style={isDesktop ? desktopReadingPlanActionsStyle : readingPlanActionsStyle}>
            {capituloPrincipal ? (
              <Link href={leituraPrincipalHref} style={primaryActionStyle}>
                {capituloParaContinuar ? "Continuar leitura" : "Começar leitura"}
              </Link>
            ) : (
              <Link href={adicionarCapituloHref} style={primaryActionStyle}>
                Criar primeiro capítulo
              </Link>
            )}

            {primeiroCapituloHref && (
              <Link href={primeiroCapituloHref} style={secondaryActionStyle}>
                Abrir capítulo 1
              </Link>
            )}
          </div>
        </section>

        {arquivoObra && (
          <section style={isDesktop ? desktopArquivoObraBoxStyle : arquivoObraBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <span style={sectionMiniTitleStyle}>ARQUIVO DA OBRA</span>
                <h2 style={sectionTitleStyle}>Material anexado</h2>
              </div>

              <span style={arquivoObraTypeBadgeStyle}>
                {arquivoObraTipoTexto}
              </span>
            </div>

            <div style={isDesktop ? desktopArquivoObraCardStyle : arquivoObraCardStyle}>
              <div style={isDesktop ? desktopArquivoObraTopLineStyle : arquivoObraTopLineStyle}>
                {arquivoObra.categoria === "imagem" ? (
                  <Link
                    href={verArquivoHref}
                    style={arquivoObraPreviewButtonStyle}
                    aria-label={`Ver arquivo ${arquivoObra.nome}`}
                  >
                    <img
                      src={arquivoObra.conteudo}
                      alt={arquivoObra.nome}
                      style={arquivoObraImageStyle}
                    />
                  </Link>
                ) : (
                  <div style={arquivoObraIconStyle}>
                    {arquivoObra.categoria === "documento"
                      ? "PDF"
                      : arquivoObra.categoria === "texto"
                      ? "TXT"
                      : "ARQ"}
                  </div>
                )}

                <div style={arquivoObraContentStyle}>
                  <strong style={arquivoObraTitleStyle}>
                    {arquivoObra.nome}
                  </strong>

                  <p style={arquivoObraTextStyle}>
                    {arquivoObraTipoTexto} • {arquivoObraTamanhoTexto}
                    {arquivoObra.criadoEm ? ` • enviado em ${formatarData(arquivoObra.criadoEm)}` : ""}
                  </p>
                </div>
              </div>

              <div style={isDesktop ? desktopArquivoObraActionsStyle : arquivoObraActionsStyle}>
                <Link href={verArquivoHref} style={arquivoObraOpenButtonStyle}>
                  Abrir arquivo
                </Link>

                <a
                  href={arquivoObra.conteudo}
                  download={arquivoObra.nome}
                  style={arquivoObraDownloadButtonStyle}
                >
                  Baixar
                </a>
              </div>
            </div>
          </section>
        )}

        <section style={isDesktop ? desktopInfoObraBoxStyle : infoObraBoxStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <span style={sectionMiniTitleStyle}>DETALHES</span>
              <h2 style={sectionTitleStyle}>Informações principais</h2>
            </div>
          </div>

          <div style={isDesktop ? desktopInfoObraGridStyle : infoObraGridStyle}>
            <div style={infoObraCardStyle}>
              <strong style={infoObraValueStyle}>{classificacaoIndicativa}</strong>
              <span style={infoObraLabelStyle}>classificação</span>
            </div>

            <div style={infoObraCardStyle}>
              <strong style={infoObraValueStyle}>{obraAtual.genero}</strong>
              <span style={infoObraLabelStyle}>gênero</span>
            </div>

            <div style={infoObraCardStyle}>
              <strong style={infoObraValueStyle}>{obraAtual.formato}</strong>
              <span style={infoObraLabelStyle}>formato</span>
            </div>

            <div style={infoObraCardStyle}>
              <strong style={infoObraValueStyle}>
                {obraAtual.publicado ? "Publicado" : "Rascunho"}
              </strong>
              <span style={infoObraLabelStyle}>status</span>
            </div>
          </div>
        </section>

        <section style={isDesktop ? desktopReviewBoxStyle : reviewBoxStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <span style={sectionMiniTitleStyle}>AVALIAÇÃO E REVIEWS</span>
              <h2 style={sectionTitleStyle}>Avalie ou escreva uma review</h2>
            </div>

            <span style={ratingBadgeStyle}>
              {notaMedia > 0 ? `${formatarNota(notaMedia)}/5` : "Sem nota"} • {reviewsDaObra.length} {reviewsDaObra.length === 1 ? "review" : "reviews"}
            </span>
          </div>

          <div style={isDesktop ? desktopReviewInfoRowStyle : reviewInfoRowStyle}>
            <p style={reviewHelpTextStyle}>
              Toque uma vez na estrela para meia nota, toque de novo para completar. O comentário é opcional.
            </p>

            <span style={userRatingBadgeStyle}>
              Sua nota: {reviewNota > 0 ? `${formatarNota(reviewNota)}/5` : "sem nota"}
            </span>
          </div>

          <div style={starsRowStyle}>
            {[1, 2, 3, 4, 5].map((estrela) => {
              const preenchimento = obterPreenchimentoEstrela(
                reviewNota,
                estrela
              );

              return (
                <button
                  key={estrela}
                  type="button"
                  onClick={() => alternarNotaPorEstrela(estrela)}
                  style={
                    preenchimento > 0
                      ? starButtonActiveStyle
                      : starButtonStyle
                  }
                  aria-label={`Selecionar ${formatarNota(
                    preenchimento === 100 ? estrela : estrela - 0.5
                  )} estrela${estrela === 1 ? "" : "s"}`}
                >
                  <span style={starIconBoxStyle}>
                    <span style={starEmptyIconStyle}>★</span>
                    <span
                      style={{
                        ...starFilledIconStyle,
                        width: `${preenchimento}%`,
                      }}
                    >
                      ★
                    </span>
                  </span>
                </button>
              );
            })}

            {reviewNota > 0 && (
              <button
                type="button"
                onClick={() => setReviewNota(0)}
                style={clearRatingButtonStyle}
              >
                Limpar nota
              </button>
            )}
          </div>

          <textarea
            value={reviewTexto}
            onChange={(event) => setReviewTexto(event.target.value)}
            placeholder="Comentário opcional. Pode deixar vazio para salvar só sua nota..."
            style={isDesktop ? desktopReviewTextareaStyle : reviewTextareaStyle}
          />

          <button
            type="button"
            onClick={salvarAvaliacaoOuReview}
            style={isDesktop ? desktopReviewButtonStyle : reviewButtonStyle}
          >
            {reviewTexto.trim() ? "Salvar review" : "Salvar avaliação"}
          </button>

          {reviewsDaObra.length > 0 && (
            <div style={reviewsListStyle}>
              {reviewsDaObra.map((review) => (
                <article key={review.id} style={reviewCardStyle}>
                  <div style={reviewTopStyle}>
                    <span style={reviewBadgeStyle}>⭐ {formatarNota(review.nota)}/5</span>

                    <span style={reviewDateStyle}>
                      {formatarData(review.criadoEm)}
                    </span>
                  </div>

                  <p style={reviewTextStyle}>{review.texto}</p>

                  <button
                    type="button"
                    onClick={() => excluirReview(review.id)}
                    style={reviewDeleteButtonStyle}
                  >
                    Excluir
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <span style={sectionMiniTitleStyle}>CAPÍTULOS</span>
              <h2 style={sectionTitleStyle}>Lista de capítulos</h2>
            </div>

            <Link href={adicionarCapituloHref} style={smallHeaderButtonStyle}>
              + Capítulo
            </Link>
          </div>

          {obraAtual.capitulos.length > 0 && (
            <div style={isDesktop ? desktopChapterToolsStyle : chapterToolsStyle}>
              <input
                value={buscaCapitulo}
                onChange={(event) => setBuscaCapitulo(event.target.value)}
                placeholder="Buscar capítulo..."
                style={isDesktop ? desktopChapterSearchInputStyle : chapterSearchInputStyle}
              />

              <div style={isDesktop ? desktopChapterOrderGridStyle : chapterOrderGridStyle}>
                <button
                  type="button"
                  onClick={() => setOrdemCapitulos("crescente")}
                  style={
                    ordemCapitulos === "crescente"
                      ? chapterOrderButtonActiveStyle
                      : chapterOrderButtonStyle
                  }
                >
                  1 → último
                </button>

                <button
                  type="button"
                  onClick={() => setOrdemCapitulos("decrescente")}
                  style={
                    ordemCapitulos === "decrescente"
                      ? chapterOrderButtonActiveStyle
                      : chapterOrderButtonStyle
                  }
                >
                  Último → 1
                </button>
              </div>

              <div style={isDesktop ? desktopChapterFilterGridStyle : chapterFilterGridStyle}>
                {filtrosCapitulos.map((filtro) => {
                  const filtroAtivo = filtroCapitulos === filtro.id;

                  return (
                    <button
                      key={filtro.id}
                      type="button"
                      onClick={() => setFiltroCapitulos(filtro.id)}
                      style={
                        filtroAtivo
                          ? chapterFilterButtonActiveStyle
                          : chapterFilterButtonStyle
                      }
                    >
                      {filtro.titulo} ({filtro.total})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {obraAtual.capitulos.length > 0 ? (
            capitulosFiltrados.length > 0 ? (
              <div style={isDesktop ? desktopChapterListStyle : chapterListStyle}>
                {capitulosFiltrados.map(({ capitulo, index }) => {
                  const lerCapituloHref = `/ler-capitulo?obraId=${obraAtual.id}&capituloId=${capitulo.id}`;
                  const editarCapituloHref = `/editar-capitulo?obraId=${obraAtual.id}&capituloId=${capitulo.id}`;

                  const totalPalavrasCapitulo = contarPalavrasTexto(capitulo.texto);
                  const tempoCapituloMinutos = calcularTempoLeituraMinutos(
                    totalPalavrasCapitulo
                  );

                  return (
                    <article key={capitulo.id} style={chapterCardStyle}>
                      <div style={chapterTopStyle}>
                        <span style={chapterBadgeStyle}>
                          Capítulo {index + 1}
                        </span>

                        {capitulo.lido && (
                          <span style={chapterReadStatusStyle}>✓ Lido</span>
                        )}

                        {capitulo.salvo && (
                          <span style={chapterMetaBadgeStyle}>Salvo</span>
                        )}
                      </div>

                      <h3 style={chapterTitleStyle}>{capitulo.titulo}</h3>

                      <div style={chapterStatsStyle}>
                        <span>{totalPalavrasCapitulo} palavras</span>
                        <span>{tempoCapituloMinutos} min</span>
                        <span>{capitulo.curtiu ? "♥ curtido" : "sem curtida"}</span>
                        <span>{capitulo.comentario.trim() ? "comentado" : "sem comentário"}</span>
                      </div>

                      <p style={chapterTextStyle}>{capitulo.texto}</p>

                      {capitulo.comentario.trim() && (
                        <p style={commentTextStyle}>
                          Comentário: {capitulo.comentario}
                        </p>
                      )}

                      <div style={chapterActionsStyle}>
                        <Link href={lerCapituloHref} style={readButtonStyle}>
                          {capitulo.lido ? "Reler" : "Ler capítulo"}
                        </Link>

                        <Link href={editarCapituloHref} style={editButtonStyle}>
                          Editar
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            excluirCapitulo(capitulo.id, capitulo.titulo)
                          }
                          style={deleteButtonStyle}
                        >
                          Excluir
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div style={emptyBoxStyle}>
                <h3 style={emptyTitleStyle}>Nenhum capítulo encontrado</h3>

                <p style={emptyTextStyle}>
                  Tente buscar por outro título, número ou palavra do capítulo.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setBuscaCapitulo("");
                    setFiltroCapitulos("todos");
                  }}
                  style={clearSearchButtonStyle}
                >
                  Limpar busca
                </button>
              </div>
            )
          ) : (
            <div style={emptyBoxStyle}>
              <h3 style={emptyTitleStyle}>Nenhum capítulo ainda</h3>

              <p style={emptyTextStyle}>
                Clique em Adicionar capítulo para começar essa obra.
              </p>

              <Link href={adicionarCapituloHref} style={emptyButtonStyle}>
                Adicionar primeiro capítulo
              </Link>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

const minhaObraPageCss = `
  html[data-historietas-tema-visual] nav a[href="/minhas-obras"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/minhas-obras"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/minhas-obras"] {
    background: var(--historietas-bottom-nav-hover-bg, var(--historietas-active-surface, rgba(249,115,22,0.16))) !important;
    border-color: color-mix(in srgb, var(--historietas-accent, #F97316) 32%, transparent) !important;
    color: var(--historietas-accent, #F97316) !important;
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
    "radial-gradient(circle at 12% 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent), transparent 30%), radial-gradient(circle at 88% 14%, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent), transparent 24%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 42%, var(--historietas-bg-end, #17101B) 100%)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  width: "min(860px, calc(100% - 32px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "18px 0 64px",
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
  maxWidth: "100%",
  overflow: "visible",
  flex: "0 1 auto",
  ...safeTextStyle,
};

const logoMarkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background: "linear-gradient(135deg, #F5F3FF 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 45%, white) 42%, var(--historietas-accent, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "0 0 26px color-mix(in srgb, var(--historietas-secondary, #8B5CF6) 24%, transparent)",
};

const pagePillStyle: CSSProperties = {
  flex: "0 0 auto",
  maxWidth: "48%",
  minHeight: "34px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 12px",
  borderRadius: "999px",
  background: "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, transparent)",
  color: "#F5F3FF",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  textAlign: "center",
  boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
  ...safeTextStyle,
};




const heroStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "14px",
  padding: "14px",
  borderRadius: "28px",
  background:
    "radial-gradient(circle at 82% 8%, color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent), transparent 34%), radial-gradient(circle at 8% 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 26%, transparent), transparent 38%), linear-gradient(135deg, color-mix(in srgb, var(--historietas-bg-mid, #12081F) 82%, var(--historietas-secondary, #7C3AED) 18%) 0%, color-mix(in srgb, var(--historietas-bg-start, #0B0614) 88%, black 12%) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #FBBF24) 20%, transparent)",
  boxShadow: "0 18px 48px rgba(0,0,0,0.30), 0 0 34px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 11%, transparent), inset 0 1px 0 rgba(255,255,255,0.06)",
  minWidth: 0,
  overflow: "hidden",
  boxSizing: "border-box",
};

const coverStyle: CSSProperties = {
  minHeight: "212px",
  borderRadius: "22px",
  position: "relative",
  overflow: "hidden",
  background:
    "radial-gradient(circle at top left, color-mix(in srgb, var(--historietas-accent, #F97316) 38%, transparent), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 58%, transparent), transparent 40%), linear-gradient(135deg, #18181B 0%, #0F0F0F 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  boxShadow: "0 14px 34px rgba(0,0,0,0.28)",
  minWidth: 0,
};

const coverGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.78) 100%)",
};

const coverGenreStyle: CSSProperties = {
  position: "absolute",
  top: "10px",
  left: "10px",
  maxWidth: "calc(100% - 20px)",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 88%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "9px",
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const coverInfoStyle: CSSProperties = {
  position: "absolute",
  left: "12px",
  right: "12px",
  bottom: "12px",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: "9px",
  minWidth: 0,
};

const coverNumberStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "46px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.08em",
};

const coverTextStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #E4E4E7)",
  fontSize: "10px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  textAlign: "right",
  ...safeTextStyle,
};

const contentStyle: CSSProperties = {
  display: "grid",
  gap: "11px",
  minWidth: 0,
  maxWidth: "100%",
};

const topBadgesStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "5px",
  minWidth: 0,
};

const badgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "9px",
  fontWeight: 950,
  ...safeTextStyle,
};

const publishedBadgeStyle: CSSProperties = {
  ...badgeStyle,
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(34, 197, 94, 0.26)",
  color: "#86EFAC",
};

const draftBadgeStyle: CSSProperties = {
  ...badgeStyle,
  background: "rgba(255,255,255,0.07)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

const classificationBadgeStyle: CSSProperties = {
  ...badgeStyle,
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #8B5CF6) 26%, transparent)",
  color: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 42%, white)",
};

const followingBadgeStyle: CSSProperties = {
  ...badgeStyle,
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(34, 197, 94, 0.26)",
  color: "#86EFAC",
};

const favoriteBadgeStyle: CSSProperties = {
  ...badgeStyle,
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 26%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
};

const completedBadgeStyle: CSSProperties = {
  ...badgeStyle,
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(34, 197, 94, 0.26)",
  color: "#86EFAC",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(36px, 10vw, 58px)",
  lineHeight: 1.14,
  paddingBottom: "0.10em",
  fontWeight: 950,
  letterSpacing: "-0.075em",
  maxWidth: "100%",
  background: "linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 42%, var(--historietas-accent, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  ...safeTextStyle,
};

const authorLinkStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  margin: 0,
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "13px",
  fontWeight: 950,
  textDecoration: "none",
  borderBottom: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 34%, transparent)",
  ...safeTextStyle,
};

const sinopseStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.55,
  fontWeight: 650,
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 4,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const tagListStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
};

const tagStyle: CSSProperties = {
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #8B5CF6) 22%, transparent)",
  color: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 42%, white)",
  fontSize: "10px",
  fontWeight: 900,
  ...safeTextStyle,
};

const progressTrackStyle: CSSProperties = {
  width: "100%",
  height: "5px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  overflow: "hidden",
};

const progressBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
};

const heroActionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
  minWidth: 0,
};

const authorActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
  minWidth: 0,
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(112px, 1fr))",
  gap: "8px",
  marginTop: "12px",
  minWidth: 0,
};

const statCardStyle: CSSProperties = {
  borderRadius: "17px",
  background: "linear-gradient(135deg, rgba(31,22,48,0.68) 0%, rgba(18,12,30,0.82) 100%)",
  border: "1px solid rgba(255,255,255,0.075)",
  padding: "10px 11px",
  display: "grid",
  gap: "2px",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "0 8px 22px rgba(0,0,0,0.13), inset 0 1px 0 rgba(255,255,255,0.045)",
};

const statNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "19px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

const statLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  lineHeight: 1.18,
  fontWeight: 850,
  ...safeTextStyle,
};

const readingPlanBoxStyle: CSSProperties = {
  marginTop: "14px",
  display: "grid",
  gap: "10px",
  padding: "14px",
  borderRadius: "23px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 10%, rgba(18,12,30,0.90)) 0%, rgba(12,7,23,0.96) 100%)",
  border: "1px solid rgba(255,255,255,0.085)",
  boxShadow: "0 12px 30px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04)",
  minWidth: 0,
  overflow: "hidden",
};

const readingPlanBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 10px",
  borderRadius: "999px",
  background:
    "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 950,
  ...safeTextStyle,
};

const readingPlanTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.58,
  fontWeight: 700,
  ...safeTextStyle,
};

const readingPlanActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))",
  gap: "8px",
  minWidth: 0,
};

const sectionStyle: CSSProperties = {
  marginTop: "14px",
  minWidth: 0,
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "wrap",
  marginBottom: "10px",
  minWidth: 0,
};

const sectionMiniTitleStyle: CSSProperties = {
  display: "inline-flex",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  marginBottom: "5px",
  maxWidth: "100%",
  ...safeTextStyle,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "24px",
  lineHeight: 1.18,
  paddingBottom: "0.08em",
  fontWeight: 950,
  letterSpacing: "-0.05em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const smallHeaderButtonStyle: CSSProperties = {
  minHeight: "34px",
  padding: "0 11px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  ...safeTextStyle,
};

const infoObraBoxStyle: CSSProperties = {
  marginTop: "14px",
  display: "grid",
  gap: "10px",
  padding: "14px",
  borderRadius: "23px",
  background: "linear-gradient(135deg, color-mix(in srgb, var(--historietas-bg-mid, #12081F) 88%, transparent) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 12%, var(--historietas-bg-mid, #12081F)) 100%)",
  border: "1px solid rgba(255,255,255,0.085)",
  boxShadow: "0 12px 30px rgba(0,0,0,0.16)",
  minWidth: 0,
  overflow: "hidden",
};

const infoObraGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "7px",
  minWidth: 0,
};

const infoObraCardStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  padding: "8px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.07))",
  minWidth: 0,
  overflow: "hidden",
};

const infoObraValueStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "14px",
  lineHeight: 1.05,
  fontWeight: 950,
  ...safeTextStyle,
};

const infoObraLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  fontWeight: 850,
  ...safeTextStyle,
};

const reviewBoxStyle: CSSProperties = {
  marginTop: "14px",
  display: "grid",
  gap: "10px",
  padding: "14px",
  borderRadius: "23px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-bg-mid, #12081F) 88%, transparent) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, var(--historietas-bg-mid, #12081F)) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  boxShadow: "0 12px 30px rgba(0,0,0,0.16)",
  minWidth: 0,
  overflow: "hidden",
};

const ratingBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  ...safeTextStyle,
};

const starsRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  minWidth: 0,
};

const starButtonStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "12px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  cursor: "pointer",
  fontSize: "17px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};

const starButtonActiveStyle: CSSProperties = {
  ...starButtonStyle,
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 34%, transparent)",
};

const starIconBoxStyle: CSSProperties = {
  position: "relative",
  width: "22px",
  height: "22px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const starEmptyIconStyle: CSSProperties = {
  color: "rgba(255,255,255,0.22)",
  fontSize: "21px",
  lineHeight: 1,
};

const starFilledIconStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  height: "100%",
  overflow: "hidden",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "21px",
  lineHeight: 1,
  whiteSpace: "nowrap",
};

const clearRatingButtonStyle: CSSProperties = {
  minHeight: "36px",
  padding: "0 10px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "rgba(255,255,255,0.05)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  ...safeTextStyle,
};

const reviewHelpTextStyle: CSSProperties = {
  margin: "-2px 0 0",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  lineHeight: 1.45,
  fontWeight: 750,
  maxWidth: "100%",
  ...safeTextStyle,
};

const reviewInfoRowStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
};

const userRatingBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #8B5CF6) 28%, transparent)",
  color: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 42%, white)",
  fontSize: "10px",
  fontWeight: 950,
  ...safeTextStyle,
};

const reviewTextareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "96px",
  resize: "vertical",
  borderRadius: "16px",
  border: "1px solid var(--historietas-border-soft, #3F3F46)",
  background: "var(--historietas-input-bg, #18181B)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  padding: "12px",
  outline: "none",
  fontSize: "13px",
  lineHeight: 1.5,
  fontWeight: 700,
  fontFamily: "inherit",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const reviewButtonStyle: CSSProperties = {
  minHeight: "38px",
  borderRadius: "999px",
  border: "none",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 12px",
  ...safeTextStyle,
};

const reviewsListStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const reviewCardStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  padding: "9px",
  borderRadius: "16px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.045))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.07))",
  minWidth: 0,
  overflow: "hidden",
};

const reviewTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "8px",
  flexWrap: "wrap",
  minWidth: 0,
};

const reviewBadgeStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  ...safeTextStyle,
};

const reviewDateStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 850,
  ...safeTextStyle,
};

const reviewTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #E4E4E7)",
  fontSize: "12px",
  lineHeight: 1.5,
  fontWeight: 700,
  ...safeTextStyle,
};

const reviewDeleteButtonStyle: CSSProperties = {
  width: "fit-content",
  minHeight: "28px",
  padding: "0 9px",
  borderRadius: "999px",
  border: "1px solid rgba(239,68,68,0.16)",
  background: "rgba(239,68,68,0.06)",
  color: "#FCA5A5",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  ...safeTextStyle,
};

const chapterToolsStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  marginBottom: "9px",
  padding: "8px",
  borderRadius: "16px",
  background: "color-mix(in srgb, var(--historietas-bg-mid, #12081F) 58%, transparent)",
  border: "1px solid rgba(255,255,255,0.055)",
  minWidth: 0,
};

const chapterSearchInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, #3F3F46)",
  background: "var(--historietas-input-bg, #18181B)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  padding: "0 11px",
  outline: "none",
  fontSize: "11px",
  fontWeight: 800,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
};

const chapterOrderGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "5px",
  minWidth: 0,
};

const chapterFilterGridStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "4px",
  minWidth: 0,
};

const chapterOrderButtonStyle: CSSProperties = {
  minHeight: "29px",
  padding: "0 8px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.045))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  ...safeTextStyle,
};

const chapterOrderButtonActiveStyle: CSSProperties = {
  ...chapterOrderButtonStyle,
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
};

const chapterFilterButtonStyle: CSSProperties = {
  minHeight: "26px",
  padding: "0 7px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "rgba(255,255,255,0.04)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  fontWeight: 850,
  cursor: "pointer",
  fontFamily: "inherit",
  ...safeTextStyle,
};

const chapterFilterButtonActiveStyle: CSSProperties = {
  ...chapterFilterButtonStyle,
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #8B5CF6) 34%, transparent)",
  color: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 42%, white)",
};

const chapterListStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const chapterCardStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "11px",
  borderRadius: "19px",
  background:
    "linear-gradient(135deg, rgba(33,24,50,0.92) 0%, rgba(18,12,30,0.98) 100%)",
  border: "1px solid rgba(255,255,255,0.075)",
  boxShadow: "0 9px 24px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.035)",
  minWidth: 0,
  overflow: "hidden",
};

const chapterTopStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "4px",
  minWidth: 0,
};

const chapterBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "3px 6px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 11%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "8px",
  fontWeight: 950,
  ...safeTextStyle,
};

const chapterReadStatusStyle: CSSProperties = {
  ...chapterBadgeStyle,
  background: "rgba(34,197,94,0.12)",
  border: "1px solid rgba(34,197,94,0.24)",
  color: "#86EFAC",
};

const chapterMetaBadgeStyle: CSSProperties = {
  ...chapterBadgeStyle,
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

const chapterTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "19px",
  lineHeight: 1.12,
  paddingBottom: "0.04em",
  fontWeight: 950,
  letterSpacing: "-0.05em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const chapterStatsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "4px",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  lineHeight: 1.25,
  fontWeight: 850,
  minWidth: 0,
  ...safeTextStyle,
};

const chapterTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.35,
  fontWeight: 650,
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const commentTextStyle: CSSProperties = {
  margin: 0,
  color: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 45%, white)",
  fontSize: "10px",
  lineHeight: 1.3,
  fontWeight: 750,
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const chapterActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.3fr) repeat(2, minmax(0, 0.85fr))",
  gap: "6px",
  minWidth: 0,
};

const readButtonStyle: CSSProperties = {
  minHeight: "32px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 6px",
  ...safeTextStyle,
};

const editButtonStyle: CSSProperties = {
  minHeight: "32px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #8B5CF6) 22%, transparent)",
  color: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 42%, white)",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 6px",
  ...safeTextStyle,
};

const deleteButtonStyle: CSSProperties = {
  minHeight: "32px",
  borderRadius: "999px",
  border: "1px solid rgba(239,68,68,0.16)",
  background: "rgba(239,68,68,0.06)",
  color: "#FCA5A5",
  fontSize: "10px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 6px",
  ...safeTextStyle,
};

const orangeActionStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 42%, var(--historietas-accent, #F97316)) 100%)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 11px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  cursor: "pointer",
  fontFamily: "inherit",
  ...safeTextStyle,
};

const followActionStyle: CSSProperties = {
  ...orangeActionStyle,
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(34, 197, 94, 0.24)",
  color: "#86EFAC",
};

const followingActionStyle: CSSProperties = {
  ...followActionStyle,
  background: "rgba(34, 197, 94, 0.18)",
};

const favoriteActionStyle: CSSProperties = {
  ...orangeActionStyle,
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 8%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
};

const favoriteActionActiveStyle: CSSProperties = {
  ...favoriteActionStyle,
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent)",
};

const completedActionStyle: CSSProperties = {
  ...orangeActionStyle,
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

const completedActionActiveStyle: CSSProperties = {
  ...completedActionStyle,
  background: "rgba(34,197,94,0.14)",
  border: "1px solid rgba(34,197,94,0.24)",
  color: "#86EFAC",
};

const primaryActionStyle: CSSProperties = {
  ...orangeActionStyle,
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
};

const secondaryActionStyle: CSSProperties = {
  ...orangeActionStyle,
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #8B5CF6) 24%, transparent)",
  color: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 42%, white)",
};

const publicPageActionStyle: CSSProperties = {
  ...orangeActionStyle,
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
};

const copyLinkActionStyle: CSSProperties = {
  ...orangeActionStyle,
  background: "rgba(255,255,255,0.07)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-text-primary, #E4E4E7)",
};

const copiedLinkActionStyle: CSSProperties = {
  ...copyLinkActionStyle,
  background: "rgba(34,197,94,0.14)",
  border: "1px solid rgba(34,197,94,0.28)",
  color: "#86EFAC",
};

const fileBadgeStyle: CSSProperties = {
  ...badgeStyle,
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #8B5CF6) 30%, transparent)",
  color: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 42%, white)",
};

const arquivoObraBoxStyle: CSSProperties = {
  marginTop: "14px",
  display: "grid",
  gap: "10px",
  padding: "12px",
  borderRadius: "21px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, var(--historietas-bg-mid, #12081F)) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, var(--historietas-bg-mid, #12081F)) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)",
  boxShadow: "0 14px 34px rgba(0,0,0,0.20)",
  minWidth: 0,
  overflow: "hidden",
};

const arquivoObraTypeBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 26%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  ...safeTextStyle,
};

const arquivoObraCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "10px",
  padding: "10px",
  borderRadius: "18px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.045))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const arquivoObraTopLineStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "72px minmax(0, 1fr)",
  gap: "10px",
  alignItems: "center",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const arquivoObraIconStyle: CSSProperties = {
  width: "72px",
  height: "72px",
  minHeight: "72px",
  borderRadius: "15px",
  background:
    "radial-gradient(circle at top left, color-mix(in srgb, var(--historietas-accent, #F97316) 32%, transparent), transparent 36%), linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent), rgba(18,12,30,0.88))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14px",
  fontWeight: 950,
  letterSpacing: "-0.03em",
  boxSizing: "border-box",
  overflow: "hidden",
  ...safeTextStyle,
};

const arquivoObraPreviewButtonStyle: CSSProperties = {
  width: "72px",
  height: "72px",
  minHeight: "72px",
  borderRadius: "15px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-input-bg, #18181B)",
  padding: 0,
  overflow: "hidden",
  cursor: "pointer",
  display: "block",
  boxSizing: "border-box",
  flex: "0 0 auto",
};

const arquivoObraImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "cover",
};

const arquivoObraContentStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
};

const arquivoObraTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14px",
  lineHeight: 1.12,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const arquivoObraTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  lineHeight: 1.35,
  fontWeight: 750,
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const arquivoObraActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const arquivoObraOpenButtonStyle: CSSProperties = {
  minHeight: "38px",
  borderRadius: "999px",
  border: "none",
  background: "var(--historietas-accent, #F97316)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const arquivoObraDownloadButtonStyle: CSSProperties = {
  minHeight: "38px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #8B5CF6) 24%, transparent)",
  color: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 42%, white)",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 10px",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const clearSearchButtonStyle: CSSProperties = {
  ...orangeActionStyle,
  width: "100%",
};

const emptyBoxStyle: CSSProperties = {
  marginTop: "18px",
  borderRadius: "24px",
  background: "rgba(31,31,35,0.96)",
  border: "1px solid var(--historietas-border-soft, #2D2D32)",
  padding: "20px",
  display: "grid",
  gap: "12px",
  minWidth: 0,
  overflow: "hidden",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "26px",
  lineHeight: 1.12,
  paddingBottom: "0.04em",
  fontWeight: 950,
  letterSpacing: "-0.05em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.6,
  fontWeight: 650,
  maxWidth: "100%",
  ...safeTextStyle,
};

const emptyButtonStyle: CSSProperties = {
  ...orangeActionStyle,
  textDecoration: "none",
};


const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "22px 0 78px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "18px",
};



const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  gridTemplateColumns: "minmax(230px, 300px) minmax(0, 1fr)",
  gap: "20px",
  padding: "18px",
  borderRadius: "30px",
  alignItems: "center",
};

const desktopCoverStyle: CSSProperties = {
  ...coverStyle,
  minHeight: "330px",
  height: "100%",
  borderRadius: "24px",
};

const desktopContentStyle: CSSProperties = {
  ...contentStyle,
  alignContent: "center",
  gap: "12px",
  padding: "8px 4px 8px 0",
};

const desktopTopBadgesStyle: CSSProperties = {
  ...topBadgesStyle,
  gap: "7px",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  fontSize: "clamp(44px, 4.8vw, 68px)",
  lineHeight: 1.14,
  maxWidth: "760px",
};

const desktopSinopseStyle: CSSProperties = {
  ...sinopseStyle,
  fontSize: "14px",
  lineHeight: 1.6,
  WebkitLineClamp: 3,
  maxWidth: "760px",
};

const desktopHeroActionsGridStyle: CSSProperties = {
  ...heroActionsGridStyle,
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "8px",
};

const desktopAuthorActionsStyle: CSSProperties = {
  ...authorActionsStyle,
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "8px",
};

const desktopStatsGridStyle: CSSProperties = {
  ...statsGridStyle,
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "10px",
  marginTop: "12px",
};

const desktopArquivoObraBoxStyle: CSSProperties = {
  ...arquivoObraBoxStyle,
  marginTop: "16px",
  padding: "16px",
  borderRadius: "24px",
};

const desktopArquivoObraCardStyle: CSSProperties = {
  ...arquivoObraCardStyle,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 260px",
  gap: "14px",
  alignItems: "center",
};

const desktopArquivoObraTopLineStyle: CSSProperties = {
  ...arquivoObraTopLineStyle,
  alignItems: "center",
};

const desktopArquivoObraActionsStyle: CSSProperties = {
  ...arquivoObraActionsStyle,
  gridTemplateColumns: "1fr 1fr",
  alignSelf: "center",
};

const desktopInfoObraBoxStyle: CSSProperties = {
  ...infoObraBoxStyle,
  marginTop: "16px",
  padding: "16px",
  borderRadius: "24px",
};

const desktopInfoObraGridStyle: CSSProperties = {
  ...infoObraGridStyle,
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "10px",
};

const desktopReviewBoxStyle: CSSProperties = {
  ...reviewBoxStyle,
  marginTop: "16px",
  padding: "16px",
  borderRadius: "24px",
};

const desktopReviewInfoRowStyle: CSSProperties = {
  ...reviewInfoRowStyle,
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
};

const desktopReviewTextareaStyle: CSSProperties = {
  ...reviewTextareaStyle,
  minHeight: "110px",
};

const desktopReviewButtonStyle: CSSProperties = {
  ...reviewButtonStyle,
  width: "220px",
  justifySelf: "start",
};

const desktopReadingPlanBoxStyle: CSSProperties = {
  ...readingPlanBoxStyle,
  padding: "16px",
  borderRadius: "24px",
};

const desktopReadingPlanActionsStyle: CSSProperties = {
  ...readingPlanActionsStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 220px))",
  justifyContent: "start",
  gap: "10px",
};

const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  marginTop: "18px",
};

const desktopChapterToolsStyle: CSSProperties = {
  ...chapterToolsStyle,
  gridTemplateColumns: "minmax(260px, 1fr) 230px",
  gap: "10px",
  alignItems: "start",
};

const desktopChapterSearchInputStyle: CSSProperties = {
  ...chapterSearchInputStyle,
  minHeight: "42px",
};

const desktopChapterOrderGridStyle: CSSProperties = {
  ...chapterOrderGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
};

const desktopChapterFilterGridStyle: CSSProperties = {
  ...chapterFilterGridStyle,
  display: "grid",
  gridColumn: "1 / -1",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
};

const desktopChapterListStyle: CSSProperties = {
  ...chapterListStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
};

