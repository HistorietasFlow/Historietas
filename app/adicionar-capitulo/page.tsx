"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ChangeEvent, FormEvent } from "react";
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
  slug: string | null;
  link: string | null;
  criada_em: string | null;
  atualizado_em: string | null;
  capitulos?: SupabaseCapituloRow[] | null;
};

const STORAGE_KEY = "historietas-obras";
const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";
const NOTIFICATIONS_STORAGE_KEY = "historietas-notificacoes";
const MAX_TEXT_FILE_SIZE_BYTES = 700 * 1024;

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

function carregarBackupArquivosObras(): ArquivosObrasBackup {
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
    localStorage.setItem(FILE_BACKUP_STORAGE_KEY, JSON.stringify({}));
    return {};
  }
}

function sincronizarBackupArquivosObras(obras: ObraLocal[]) {
  try {
    const backupAtual = carregarBackupArquivosObras();

    obras.forEach((obra) => {
      const arquivoNormalizado = normalizarArquivoObra(obra.arquivoObra);

      if (arquivoNormalizado) {
        backupAtual[obra.id] = arquivoNormalizado;
      }
    });

    localStorage.setItem(FILE_BACKUP_STORAGE_KEY, JSON.stringify(backupAtual));
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

  const arquivoBackup = normalizarArquivoObra(backup[obra.id]);

  if (!arquivoBackup) {
    return obra;
  }

  return {
    ...obra,
    arquivoObra: arquivoBackup,
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
    autorId:
      typeof obra.autorId === "string" && obra.autorId.trim()
        ? obra.autorId
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
  obraLocal?: ObraLocal
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

  return {
    id: obra.id,
    titulo,
    autor: obra.autor?.trim() || "Autor não informado",
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
    };
  });

  const obrasSomenteLocais = obrasLocais.filter(
    (obraLocal) => !obrasSupabaseIds.has(obraLocal.id)
  );

  return [...obrasMescladas, ...obrasSomenteLocais];
}

function carregarObrasLocais() {
  const obrasSalvasTexto = localStorage.getItem(STORAGE_KEY);
  const obrasSalvasJson = obrasSalvasTexto ? JSON.parse(obrasSalvasTexto) : [];
  const backupArquivosObras = carregarBackupArquivosObras();

  const obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
    ? obrasSalvasJson.map((obra, index) =>
        restaurarArquivoObraComBackup(
          normalizarObra(obra as Partial<ObraLocal>, index),
          backupArquivosObras
        )
      )
    : [];

  sincronizarBackupArquivosObras(obrasNormalizadas);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasNormalizadas));

  return obrasNormalizadas;
}

function normalizarNotificacao(
  notificacao: Partial<NotificacaoLocal>
): NotificacaoLocal {
  const obraId = typeof notificacao.obraId === "string" ? notificacao.obraId : "";
  const capituloId =
    typeof notificacao.capituloId === "string" ? notificacao.capituloId : "";

  return {
    id:
      typeof notificacao.id === "string" && notificacao.id.trim()
        ? notificacao.id
        : criarId(),
    tipo: "novo-capitulo",
    titulo:
      typeof notificacao.titulo === "string" && notificacao.titulo.trim()
        ? notificacao.titulo
        : "Novo capítulo publicado",
    mensagem:
      typeof notificacao.mensagem === "string" && notificacao.mensagem.trim()
        ? notificacao.mensagem
        : "Uma obra recebeu um novo capítulo.",
    obraId,
    obraTitulo:
      typeof notificacao.obraTitulo === "string" && notificacao.obraTitulo.trim()
        ? notificacao.obraTitulo
        : "Obra não informada",
    autor:
      typeof notificacao.autor === "string" && notificacao.autor.trim()
        ? notificacao.autor
        : "Autor não informado",
    capituloId,
    capituloTitulo:
      typeof notificacao.capituloTitulo === "string" &&
      notificacao.capituloTitulo.trim()
        ? notificacao.capituloTitulo
        : "Capítulo não informado",
    href:
      typeof notificacao.href === "string" && notificacao.href.trim()
        ? notificacao.href
        : obraId && capituloId
          ? `/ler-capitulo?obraId=${obraId}&capituloId=${capituloId}`
          : "/notificacoes",
    lida: Boolean(notificacao.lida),
    criadaEm:
      typeof notificacao.criadaEm === "string" && notificacao.criadaEm.trim()
        ? notificacao.criadaEm
        : new Date().toISOString(),
    obraPublicada: Boolean(notificacao.obraPublicada),
    capa: typeof notificacao.capa === "string" ? notificacao.capa : "",
    classificacaoIndicativa:
      typeof notificacao.classificacaoIndicativa === "string" &&
      notificacao.classificacaoIndicativa.trim()
        ? notificacao.classificacaoIndicativa
        : "Não informada",
  };
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
    href: `/ler-capitulo?obraId=${obra.id}&capituloId=${capitulo.id}`,
    lida: false,
    criadaEm,
    obraPublicada: obra.publicado,
    capa: obra.capa,
    classificacaoIndicativa: obra.classificacaoIndicativa,
  };
}

function carregarNotificacoesAtuais() {
  try {
    const notificacoesTexto = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const notificacoesJson = notificacoesTexto
      ? JSON.parse(notificacoesTexto)
      : [];

    return Array.isArray(notificacoesJson)
      ? notificacoesJson.map((notificacao) =>
          normalizarNotificacao(notificacao as Partial<NotificacaoLocal>)
        )
      : [];
  } catch {
    return [];
  }
}

function salvarNotificacaoInterna(notificacao: NotificacaoLocal) {
  const notificacoesAtuais = carregarNotificacoesAtuais();
  const notificacaoNormalizada = normalizarNotificacao(notificacao);
  const notificacoesAtualizadas = [
    notificacaoNormalizada,
    ...notificacoesAtuais,
  ].slice(0, 100);

  localStorage.setItem(
    NOTIFICATIONS_STORAGE_KEY,
    JSON.stringify(notificacoesAtualizadas)
  );
}

export default function AdicionarCapituloPage() {
  const [obraId, setObraId] = useState("");
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
    const params = new URLSearchParams(window.location.search);
    const obraIdParam = params.get("obraId") || "";

    setObraId(obraIdParam);

    async function carregarDados() {
      let obrasLocais: ObraLocal[] = [];

      try {
        obrasLocais = carregarObrasLocais();
      } catch {
        obrasLocais = [];
      }

      let obrasFinais = obrasLocais;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from("obras")
            .select("*, capitulos (*)")
            .eq("user_id", user.id)
            .order("criada_em", { ascending: false });

          if (!error && Array.isArray(data)) {
            const obrasLocaisPorId = new Map(
              obrasLocais.map((obra) => [obra.id, obra])
            );

            const obrasSupabase = data.map((obra, index) =>
              normalizarObraSupabase(
                obra as SupabaseObraRow,
                index,
                obrasLocaisPorId.get((obra as SupabaseObraRow).id)
              )
            );

            obrasFinais = mesclarObrasComSupabase(obrasLocais, obrasSupabase);
            sincronizarBackupArquivosObras(obrasFinais);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasFinais));
          }
        }
      } catch {
        // Se o Supabase falhar, mantém o backup local funcionando.
      }

      setObras(obrasFinais);
      setCarregando(false);
    }

    carregarDados();
  }, []);

  const obraAtual = useMemo(() => {
    return obras.find((obra) => obra.id === obraId) || null;
  }, [obras, obraId]);

  const numeroNovoCapitulo = obraAtual ? obraAtual.capitulos.length + 1 : 1;

  const tituloPreview = titulo.trim() || `Capítulo ${numeroNovoCapitulo}`;

  const textoPreview =
    texto.trim() ||
    "O texto do capítulo vai aparecer aqui enquanto você escreve.";

  const mostrarPreviaCapitulo = Boolean(titulo.trim() || texto.trim());

  const estatisticasCapitulo = useMemo(() => {
    return calcularEstatisticasCapitulo(titulo, texto, numeroNovoCapitulo);
  }, [titulo, texto, numeroNovoCapitulo]);

  const progresso = useMemo(() => {
    const campos = [titulo, texto];
    const preenchidos = campos.filter((campo) => campo.trim()).length;

    return Math.round((preenchidos / campos.length) * 100);
  }, [titulo, texto]);

  function salvarObras(novasObras: ObraLocal[]) {
    const backupArquivosObras = carregarBackupArquivosObras();
    const obrasNormalizadas = novasObras.map((obra, index) =>
      restaurarArquivoObraComBackup(
        normalizarObra(obra, index),
        backupArquivosObras
      )
    );

    sincronizarBackupArquivosObras(obrasNormalizadas);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasNormalizadas));
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

    const criadoEm = new Date().toISOString();
    const tituloFinal = titulo.trim() || `Capítulo ${obraAtual.capitulos.length + 1}`;
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
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
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

          if (!error && data?.id) {
            novoCapitulo = {
              ...novoCapitulo,
              id: data.id,
              criadoEm:
                typeof data.criado_em === "string" ? data.criado_em : criadoEm,
            };
          }
        }
      } catch {
        // Se o Supabase falhar, mantém o salvamento local como backup.
      }

      const novaNotificacao = criarNotificacaoNovoCapitulo(
        obraAtual,
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
          capitulos: capitulosAtualizados,
          progressoLeitura: calcularProgressoLeitura(capitulosAtualizados),
        };
      });

      salvarObras(novasObras);

      try {
        salvarNotificacaoInterna(novaNotificacao);
        setNotificacaoCriada(novaNotificacao);
      } catch {
        setNotificacaoCriada(null);
      }

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
    return null;
  }

  if (!obraAtual) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${adicionarCapituloPageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <div style={emptyBoxStyle}>
            <h1 style={emptyTitleStyle}>Obra não encontrada</h1>

            <p style={emptyTextStyle}>
              Volte para Minhas Obras e clique novamente em Adicionar capítulo.
            </p>

            <Link href="/minhas-obras" style={emptyButtonStyle}>
              Ir para Minhas Obras
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const minhaObraHref = `/minha-obra?obraId=${obraAtual.id}`;
  const capituloCriadoHref = capituloCriado
    ? `/ler-capitulo?obraId=${obraAtual.id}&capituloId=${capituloCriado.id}`
    : "";

  const mostrarPainelLateral =
    mostrarPreviaCapitulo || obraAtual.capitulos.length > 0;

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
        </header>

        {erro && (
          <section style={errorBoxStyle}>
            <h2 style={errorTitleStyle}>Não foi possível criar</h2>

            <p style={errorTextStyle}>{erro}</p>
          </section>
        )}

        <section style={isDesktop ? desktopMainGridSoloStyle : mainGridStyle}>
          <form onSubmit={criarCapitulo} style={isDesktop ? desktopFormPanelStyle : formPanelStyle}>
            <div style={isDesktop ? desktopFormHeaderStyle : formHeaderStyle}>
              <span style={formMiniTitleStyle}>CAPÍTULO {numeroNovoCapitulo}</span>

              <h2 style={isDesktop ? desktopFormTitleStyle : formTitleStyle}>Título do capítulo</h2>
            </div>

            <div style={fieldGroupStyle}>
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

            <div style={fieldGroupStyle}>
              <label style={isDesktop ? desktopFormTitleStyle : formTitleStyle}>Texto do capítulo</label>

              <div style={isDesktop ? desktopImportBoxStyle : importBoxStyle}>
                <div style={importInfoStyle}>
                  <strong style={importTitleStyle}>Importar capítulo pronto</strong>

                  <span style={isDesktop ? desktopImportTextStyle : importTextStyle}>
                    Envie um arquivo .txt ou .md. O conteúdo entra direto no
                    editor e você ainda pode revisar antes de salvar.
                  </span>

                  {arquivoImportadoNome && (
                    <span style={importSuccessStyle}>
                      Arquivo importado: {arquivoImportadoNome}
                    </span>
                  )}

                  {arquivoImportadoErro && (
                    <span style={importErrorStyle}>{arquivoImportadoErro}</span>
                  )}
                </div>

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

              <div style={inlineStatsBoxStyle}>
                <span style={inlineStatsItemStyle}>
                  {estatisticasCapitulo.palavras} palavras
                </span>

                <span style={inlineStatsItemStyle}>
                  {estatisticasCapitulo.caracteres} caracteres
                </span>

                <span style={inlineStatsItemStyle}>
                  {estatisticasCapitulo.minutosLeitura} min
                </span>

                <span
                  style={
                    estatisticasCapitulo.textoValido
                      ? inlineStatsReadyStyle
                      : inlineStatsWarningStyle
                  }
                >
                  {estatisticasCapitulo.textoValido
                    ? "Texto pronto"
                    : `${Math.max(
                        20 - estatisticasCapitulo.caracteresValidos,
                        0
                      )} faltando`}
                </span>
              </div>
            </div>

            {capituloCriado && (
              <div style={successBoxStyle}>
                <strong style={successTitleStyle}>
                  {capituloCriado.titulo} criado com sucesso!
                </strong>

                <span style={successTextStyle}>
                  O capítulo foi salvo sem apagar os capítulos anteriores.
                </span>

                {notificacaoCriada && (
                  <span style={notificationCreatedStyle}>
                    Notificação criada.
                  </span>
                )}

                <div style={createdActionsStyle}>
                  <Link
                    href={capituloCriadoHref}
                    style={successPrimaryButtonStyle}
                  >
                    Ler capítulo criado
                  </Link>

                  <Link href={minhaObraHref} style={successSecondaryButtonStyle}>
                    Ver obra
                  </Link>
                </div>
              </div>
            )}

            <div style={isDesktop ? desktopButtonAreaStyle : buttonAreaStyle}>
              <Link href={minhaObraHref} style={isDesktop ? desktopSecondaryButtonStyle : secondaryButtonStyle}>
                Cancelar
              </Link>

              <button
                type="submit"
                style={processando ? (isDesktop ? desktopDisabledButtonStyle : disabledButtonStyle) : (isDesktop ? desktopPrimaryButtonStyle : primaryButtonStyle)}
                disabled={processando}
              >
                {processando ? "Salvando..." : "Criar capítulo"}
              </button>
            </div>

            <div style={isDesktop ? desktopProgressBoxStyle : progressBoxStyle}>
              <div style={progressTopStyle}>
                <span style={progressLabelStyle}>Progresso</span>

                <strong style={progressNumberStyle}>{progresso}%</strong>
              </div>

              <div style={progressTrackStyle}>
                <div style={{ ...progressFillStyle, width: `${progresso}%` }} />
              </div>
            </div>
          </form>

          {mostrarPainelLateral && (
            <aside style={isDesktop ? desktopPreviewPanelStyle : previewPanelStyle}>
              {mostrarPreviaCapitulo ? (
                <>
                  <div style={previewHeaderStyle}>
                    <span style={previewMiniTitleStyle}>PRÉVIA DO CAPÍTULO</span>

                    <h2 style={previewTitleStyle}>Como o capítulo vai aparecer</h2>
                  </div>

                  <article style={isDesktop ? desktopPreviewChapterCardStyle : previewChapterCardStyle}>
                    <div style={previewChapterTopStyle}>
                      <span style={previewChapterBadgeStyle}>
                        CAPÍTULO {numeroNovoCapitulo}
                      </span>

                      <span style={previewChapterStatusStyle}>Rascunho</span>
                    </div>

                    <h3 style={previewChapterTitleStyle}>{tituloPreview}</h3>

                    <p style={previewChapterTextStyle}>{textoPreview}</p>

                    <div style={previewStatsStyle}>
                      <span style={safeTextStyle}>
                        {estatisticasCapitulo.palavras} palavras
                      </span>
                      <span style={safeTextStyle}>
                        {estatisticasCapitulo.minutosLeitura} min
                      </span>
                    </div>
                  </article>
                </>
              ) : null}

              {obraAtual.capitulos.length > 0 && (
                <section style={recentBoxStyle}>
                  <span style={recentMiniTitleStyle}>CAPÍTULOS DA OBRA</span>

                  <div style={recentListStyle}>
                    {obraAtual.capitulos.slice(-3).map((capitulo, index) => {
                      const numeroReal =
                        obraAtual.capitulos.length -
                        obraAtual.capitulos.slice(-3).length +
                        index +
                        1;

                      return (
                        <article key={capitulo.id} style={recentItemStyle}>
                          <span style={recentNumberStyle}>
                            Capítulo {numeroReal}
                          </span>

                          <strong style={recentTitleStyle}>
                            {capitulo.titulo}
                          </strong>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}
            </aside>
          )}
        </section>
      </section>
    </main>
  );
}

const adicionarCapituloPageCss = `
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

const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(520px, 72vh)",
  pointerEvents: "none",
  zIndex: 0,
  background:
    "linear-gradient(180deg, var(--historietas-bg-start, rgba(10,6,18,0.98)) 0%, var(--historietas-bg-mid, rgba(14,7,25,0.94)) 42%, transparent 100%), radial-gradient(ellipse 72% 82% at 18% 44%, var(--historietas-glow-primary, rgba(124,58,237,0.24)) 0%, transparent 76%), radial-gradient(ellipse 48% 62% at 88% 32%, var(--historietas-glow-secondary, rgba(249,115,22,0.10)) 0%, transparent 78%)",
  WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 76%, transparent 100%)",
  maskImage: "linear-gradient(180deg, #000 0%, #000 76%, transparent 100%)",
};

const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background:
    "linear-gradient(180deg, var(--historietas-bg-start, rgba(10,6,18,0.98)) 0%, var(--historietas-bg-mid, rgba(14,7,25,0.96)) 34%, transparent 100%), radial-gradient(ellipse 62% 86% at 19% 52%, var(--historietas-glow-primary, rgba(124,58,237,0.32)) 0%, transparent 76%), radial-gradient(ellipse 38% 62% at 91% 54%, var(--historietas-glow-secondary, rgba(249,115,22,0.10)) 0%, transparent 76%)",
  WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 78%, transparent 100%)",
  maskImage: "linear-gradient(180deg, #000 0%, #000 78%, transparent 100%)",
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background:
    "radial-gradient(circle at 12% 0%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)), transparent 28%), radial-gradient(circle at 88% 14%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)), transparent 22%), radial-gradient(circle at 50% 100%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)), transparent 30%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 38%, var(--historietas-bg-end, #17101B) 100%)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(860px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "14px 0 calc(82px + env(safe-area-inset-bottom))",
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
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
  boxShadow: "none",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background: "linear-gradient(135deg, var(--historietas-title-from, #F5F3FF) 0%, var(--historietas-title-mid, #F5F3FF) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "var(--historietas-logo-shadow, 0 0 26px rgba(139,92,246,0.24))",
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
  marginBottom: "14px",
  minWidth: 0,
  padding: 0,
  textAlign: "center",
};

const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  marginBottom: "18px",
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
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
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
  gap: "7px",
  padding: "13px 12px",
  borderRadius: "21px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(18,12,30,0.90)) 0%, var(--historietas-surface-strong, rgba(12,7,23,0.96)) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 16%, rgba(255,255,255,0.07))",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};


const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(28px, 7.4vw, 40px)",
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: "-0.048em",
  maxWidth: "100%",
  textAlign: "center",
  background: "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 45%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
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
  gap: "5px",
  width: "min(360px, 100%)",
  padding: "6px 7px",
  borderRadius: "13px",
  background: "rgba(255,255,255,0.035)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.06))",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
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
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  fontWeight: 950,
  ...safeTextStyle,
};

const progressTrackStyle: CSSProperties = {
  height: "5px",
  overflow: "hidden",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.10))",
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
  background: "var(--historietas-danger-surface, rgba(239,68,68,0.12))",
  border: "1px solid color-mix(in srgb, #EF4444 30%, var(--historietas-border-soft, transparent))",
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
  padding: "6px 8px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 900,
  ...safeTextStyle,
};

const inlineStatsReadyStyle: CSSProperties = {
  ...inlineStatsItemStyle,
  background: "color-mix(in srgb, #22C55E 12%, var(--historietas-surface, transparent))",
  border: "1px solid color-mix(in srgb, #22C55E 28%, var(--historietas-border-soft, transparent))",
  color: "color-mix(in srgb, #166534 72%, var(--historietas-text-primary, #FFFFFF))",
};

const inlineStatsWarningStyle: CSSProperties = {
  ...inlineStatsItemStyle,
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
};

const mainGridStyle: CSSProperties = {
  marginTop: "10px",
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const formPanelStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  background: "linear-gradient(135deg, var(--historietas-surface, rgba(18,12,30,0.90)) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.96)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.075))",
  borderRadius: "20px",
  padding: "10px",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const formHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  minWidth: 0,
  textAlign: "center",
  justifyItems: "center",
};

const formMiniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "9.5px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const formTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "24px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.06em",
  textAlign: "center",
  ...safeTextStyle,
};

const fieldGroupStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
};

const labelStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  fontWeight: 900,
  textAlign: "center",
  ...safeTextStyle,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "42px",
  borderRadius: "15px",
  border: "1px solid var(--historietas-border-soft, #3F3F46)",
  background: "var(--historietas-input-bg, #18181B)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 12px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 650,
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  ...safeTextStyle,
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "210px",
  borderRadius: "17px",
  border: "1px solid var(--historietas-border-soft, #3F3F46)",
  background: "var(--historietas-input-bg, #18181B)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "12px",
  outline: "none",
  fontSize: "14px",
  fontWeight: 650,
  lineHeight: 1.65,
  resize: "vertical",
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  ...safeTextStyle,
};

const hintStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  lineHeight: 1.4,
  fontWeight: 650,
  textAlign: "center",
  ...safeTextStyle,
};

const importBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "7px",
  padding: "9px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.035)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.065))",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const importInfoStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "center",
  justifyItems: "center",
};

const importTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  fontWeight: 950,
  letterSpacing: "-0.02em",
  textAlign: "center",
  ...safeTextStyle,
};

const importTextStyle: CSSProperties = {
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
  background: "color-mix(in srgb, #22C55E 12%, var(--historietas-surface, transparent))",
  border: "1px solid color-mix(in srgb, #22C55E 28%, var(--historietas-border-soft, transparent))",
  color: "color-mix(in srgb, #166534 72%, var(--historietas-text-primary, #FFFFFF))",
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
  border: "1px solid color-mix(in srgb, #EF4444 28%, var(--historietas-border-soft, transparent))",
  color: "var(--historietas-danger-button-text, #FCA5A5)",
  fontSize: "11px",
  fontWeight: 900,
  ...safeTextStyle,
};

const importButtonStyle: CSSProperties = {
  minHeight: "38px",
  width: "100%",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 70%, transparent)",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  cursor: "pointer",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
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
  background: "color-mix(in srgb, #22C55E 12%, var(--historietas-surface, transparent))",
  border: "1px solid color-mix(in srgb, #22C55E 28%, var(--historietas-border-soft, transparent))",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const successTitleStyle: CSSProperties = {
  color: "color-mix(in srgb, #166534 72%, var(--historietas-text-primary, #FFFFFF))",
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
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
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
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
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
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
  marginTop: "2px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const primaryButtonStyle: CSSProperties = {
  minHeight: "46px",
  borderRadius: "999px",
  border: "none",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "none",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 10px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const disabledButtonStyle: CSSProperties = {
  minHeight: "46px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "13px",
  fontWeight: 950,
  cursor: "not-allowed",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 10px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: "46px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.07))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 10px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const previewPanelStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  background: "transparent",
  border: "none",
  borderRadius: 0,
  padding: 0,
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};

const previewHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  minWidth: 0,
  justifyItems: "center",
  textAlign: "center",
};

const previewMiniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "9.5px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const previewTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  textAlign: "center",
  ...safeTextStyle,
};

const previewChapterCardStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "11px",
  borderRadius: "18px",
  background: "var(--historietas-surface, rgba(31,31,35,0.86))",
  border: "1px solid var(--historietas-border-soft, #2D2D32)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
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
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
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
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-text-primary, #E4E4E7)",
  fontSize: "11px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const previewChapterTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "22px",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  textAlign: "center",
  ...safeTextStyle,
};

const previewChapterTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  lineHeight: 1.55,
  fontWeight: 650,
  display: "-webkit-box",
  WebkitLineClamp: 4,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textAlign: "center",
  ...safeTextStyle,
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
  padding: "12px",
  borderRadius: "20px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, rgba(18,12,30,0.78)) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, rgba(18,12,30,0.86)) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 14%, var(--historietas-border-soft, rgba(255,255,255,0.07)))",
  minWidth: 0,
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "none",
};

const recentMiniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
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
  background: "rgba(15,15,15,0.24)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.055))",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  textAlign: "center",
};

const recentNumberStyle: CSSProperties = {
  color: "var(--historietas-secondary, #C4B5FD)",
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
  background: "var(--historietas-surface, rgba(31,31,35,0.96))",
  border: "1px solid var(--historietas-border-soft, #2D2D32)",
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
  width: "min(1180px, calc(100% - 64px))",
  padding: "26px 0 34px",
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
  width: "min(360px, 100%)",
  padding: "6px 8px",
};

const desktopMainGridSoloStyle: CSSProperties = {
  ...mainGridStyle,
  width: "100%",
  maxWidth: "100%",
  margin: "14px 0 0",
  gap: "12px",
};


const desktopFormPanelStyle: CSSProperties = {
  ...formPanelStyle,
  width: "100%",
  padding: "14px",
  borderRadius: "22px",
  gap: "10px",
};

const desktopFormHeaderStyle: CSSProperties = {
  ...formHeaderStyle,
  justifyItems: "center",
  textAlign: "center",
};

const desktopFormTitleStyle: CSSProperties = {
  ...formTitleStyle,
  fontSize: "30px",
  textAlign: "center",
};

const desktopImportBoxStyle: CSSProperties = {
  ...importBoxStyle,
  gridTemplateColumns: "minmax(0, 1fr) 128px",
  alignItems: "center",
  padding: "7px 9px",
  gap: "8px",
  borderRadius: "14px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.035))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.07))",
};

const desktopImportButtonStyle: CSSProperties = {
  ...importButtonStyle,
  minHeight: "36px",
  fontSize: "10.5px",
  padding: "0 8px",
};

const desktopTextareaStyle: CSSProperties = {
  ...textareaStyle,
  minHeight: "250px",
  fontSize: "14px",
  lineHeight: 1.65,
};

const desktopButtonAreaStyle: CSSProperties = {
  ...buttonAreaStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "10px",
  marginTop: "2px",
};

const desktopPrimaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  minHeight: "48px",
  fontSize: "14px",
};

const desktopDisabledButtonStyle: CSSProperties = {
  ...disabledButtonStyle,
  minHeight: "48px",
  fontSize: "14px",
};

const desktopSecondaryButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  minHeight: "48px",
  fontSize: "14px",
};

const desktopPreviewPanelStyle: CSSProperties = {
  ...previewPanelStyle,
  width: "100%",
  padding: 0,
  borderRadius: 0,
  gap: "12px",
};

const desktopPreviewChapterCardStyle: CSSProperties = {
  ...previewChapterCardStyle,
  padding: "12px",
  borderRadius: "18px",
};