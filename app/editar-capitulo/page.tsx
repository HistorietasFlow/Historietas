"use client";

import Link from "next/link";
import { supabase } from "../../lib/supabase/client";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ChangeEvent, FormEvent } from "react";

type CapituloLocal = {
  id: string;
  titulo: string;
  texto: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  criadoEm: string;
  lido?: boolean;
  lidoEm?: string;
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
  ultimoCapituloLidoId?: string;
  ultimaLeituraEm?: string;
  progressoLeitura?: number;
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
const NOTIFICATIONS_STORAGE_KEY = "historietas-notificacoes";
const MAX_TEXT_FILE_SIZE_BYTES = 700 * 1024;

function contarLetrasNumeros(texto: string) {
  return (texto.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]/g) || []).length;
}

function contarPalavras(texto: string) {
  return texto.trim().split(/\s+/).filter(Boolean).length;
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

function criarChavesObra(obra: Pick<ObraLocal, "id" | "titulo" | "slug">) {
  const chaves = [
    obra.id,
    obra.slug,
    criarSlugBase(obra.titulo),
    normalizarTexto(obra.titulo),
  ];

  return Array.from(
    new Set(
      chaves
        .filter((chave): chave is string =>
          typeof chave === "string" && Boolean(chave.trim())
        )
        .map((chave) => chave.trim())
    )
  );
}

function calcularEstatisticasCapitulo(
  titulo: string,
  texto: string,
  numeroCapitulo: number
) {
  const tituloFinal = titulo.trim() || `Capítulo ${numeroCapitulo}`;
  const textoLimpo = texto.trim();
  const palavras = contarPalavras(textoLimpo);
  const caracteres = texto.length;
  const caracteresValidos = contarLetrasNumeros(textoLimpo);
  const minutosLeitura =
    palavras > 0 ? Math.max(1, Math.ceil(palavras / 220)) : 0;
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
    prontoParaSalvar: tituloValido && textoValido,
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
        criarChavesObra(obra).forEach((chave) => {
          backupAtual[chave] = arquivoNormalizado;
        });
      }
    });

    localStorage.setItem(FILE_BACKUP_STORAGE_KEY, JSON.stringify(backupAtual));
  } catch {
    // Se o backup falhar, a edição do capítulo continua funcionando normalmente.
  }
}

function restaurarArquivoObraComBackup(
  obra: ObraLocal,
  backup: ArquivosObrasBackup
): ObraLocal {
  if (obra.arquivoObra) {
    return obra;
  }

  const arquivoBackup =
    criarChavesObra(obra)
      .map((chave) => normalizarArquivoObra(backup[chave]))
      .find((arquivo): arquivo is ArquivoObraLocal => Boolean(arquivo)) || null;

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

function normalizarTagsSupabase(tags: unknown) {
  if (!Array.isArray(tags)) {
    return ["sem tags"];
  }

  const tagsValidas = tags
    .filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
    .map((tag) => tag.trim());

  return tagsValidas.length > 0 ? tagsValidas : ["sem tags"];
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

function mapearCapituloSupabase(
  capitulo: CapituloSupabaseRow,
  index: number,
  capituloLocal?: CapituloLocal
): CapituloLocal {
  return {
    id: capitulo.id,
    titulo: capitulo.titulo?.trim() || capituloLocal?.titulo || `Capítulo ${index + 1}`,
    texto: typeof capitulo.texto === "string" ? capitulo.texto : capituloLocal?.texto || "",
    curtiu: Boolean(capituloLocal?.curtiu),
    salvo: Boolean(capituloLocal?.salvo),
    comentario:
      typeof capituloLocal?.comentario === "string"
        ? capituloLocal.comentario
        : "",
    criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
    lido: Boolean(capituloLocal?.lido),
    lidoEm: typeof capituloLocal?.lidoEm === "string" ? capituloLocal.lidoEm : "",
  };
}

function mapearObraSupabase(
  obra: ObraSupabaseRow,
  capitulosSupabase: CapituloSupabaseRow[],
  obraLocal?: ObraLocal
): ObraLocal {
  const capitulosLocais = obraLocal?.capitulos || [];
  const capitulosMapeados = capitulosSupabase.map((capitulo, index) => {
    const capituloLocal = capitulosLocais.find(
      (capituloAtual) => capituloAtual.id === capitulo.id
    );

    return mapearCapituloSupabase(capitulo, index, capituloLocal);
  });

  const idsCapitulosSupabase = new Set(
    capitulosMapeados.map((capitulo) => capitulo.id)
  );

  const capitulosLocaisExtras = capitulosLocais.filter(
    (capitulo) => !idsCapitulosSupabase.has(capitulo.id)
  );

  const capitulos = [...capitulosMapeados, ...capitulosLocaisExtras];
  const titulo = obra.titulo?.trim() || obraLocal?.titulo || "Obra sem título";
  const slug = obra.slug?.trim() || obraLocal?.slug || criarSlugBase(titulo);
  const arquivoObra = obra.arquivo_url
    ? {
        nome: obra.arquivo_nome?.trim() || obraLocal?.arquivoObra?.nome || "Arquivo da obra",
        tipo: obra.arquivo_tipo || obraLocal?.arquivoObra?.tipo || "",
        tamanho:
          typeof obra.arquivo_tamanho === "number" &&
          Number.isFinite(obra.arquivo_tamanho)
            ? obra.arquivo_tamanho
            : obraLocal?.arquivoObra?.tamanho || 0,
        conteudo: obra.arquivo_url,
        categoria: normalizarCategoriaArquivoSupabase(obra.arquivo_categoria),
        criadoEm: obra.criada_em || obraLocal?.arquivoObra?.criadoEm || "",
      }
    : obraLocal?.arquivoObra || null;

  return {
    id: obra.id,
    titulo,
    autor: obra.autor?.trim() || obraLocal?.autor || "Autor não informado",
    genero: obra.genero?.trim() || obraLocal?.genero || "Não informado",
    formato: obra.formato?.trim() || obraLocal?.formato || "Não informado",
    classificacaoIndicativa:
      obra.classificacao_indicativa?.trim() ||
      obraLocal?.classificacaoIndicativa ||
      "Não informada",
    sinopse: obra.sinopse?.trim() || obraLocal?.sinopse || "Nenhuma sinopse informada.",
    tags: normalizarTagsSupabase(obra.tags || obraLocal?.tags),
    capa: obra.capa_url || obraLocal?.capa || "",
    capaNome: obra.capa_nome || obraLocal?.capaNome || "",
    arquivoObra,
    publicado: Boolean(obra.publicado),
    capitulos,
    criadaEm: obra.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulos),
    slug,
    link: obra.link?.trim() || obraLocal?.link || `/obra/${slug}`,
  };
}

function carregarObrasLocaisNormalizadas() {
  const obrasSalvasTexto = localStorage.getItem(STORAGE_KEY);
  const obrasSalvasJson = obrasSalvasTexto ? JSON.parse(obrasSalvasTexto) : [];
  const backupArquivos = carregarBackupArquivosObras();

  const obrasNormalizadasBase: ObraLocal[] = Array.isArray(obrasSalvasJson)
    ? obrasSalvasJson.map((obra, index) =>
        normalizarObra(obra as Partial<ObraLocal>, index)
      )
    : [];

  const obrasNormalizadas = obrasNormalizadasBase.map((obra) =>
    restaurarArquivoObraComBackup(obra, backupArquivos)
  );

  sincronizarBackupArquivosObras(obrasNormalizadas);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasNormalizadas));

  return obrasNormalizadas;
}

function atualizarNotificacoesDoCapituloEditado(
  obra: ObraLocal,
  capituloId: string,
  tituloCapitulo: string
) {
  try {
    const notificacoesTexto = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const notificacoesJson: unknown = notificacoesTexto
      ? JSON.parse(notificacoesTexto)
      : [];

    if (!Array.isArray(notificacoesJson)) {
      return;
    }

    const notificacoesAtualizadas = notificacoesJson.map((notificacao) => {
      if (!notificacao || typeof notificacao !== "object" || Array.isArray(notificacao)) {
        return notificacao;
      }

      const registro = notificacao as Record<string, unknown>;
      const notificacaoObraId =
        typeof registro.obraId === "string"
          ? registro.obraId
          : typeof registro.obra_id === "string"
            ? registro.obra_id
            : "";
      const notificacaoCapituloId =
        typeof registro.capituloId === "string"
          ? registro.capituloId
          : typeof registro.capitulo_id === "string"
            ? registro.capitulo_id
            : "";

      if (notificacaoObraId !== obra.id || notificacaoCapituloId !== capituloId) {
        return notificacao;
      }

      return {
        ...registro,
        obraTitulo: obra.titulo,
        autor: obra.autor,
        capituloTitulo: `Capítulo: ${tituloCapitulo}`,
        mensagem: `${tituloCapitulo} foi atualizado em ${obra.titulo}.`,
        link: `/ler-capitulo?obraId=${encodeURIComponent(obra.id)}&capituloId=${encodeURIComponent(capituloId)}`,
        href: `/ler-capitulo?obraId=${encodeURIComponent(obra.id)}&capituloId=${encodeURIComponent(capituloId)}`,
      };
    });

    localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(notificacoesAtualizadas)
    );
  } catch {
    // Notificações são apoio visual. A edição do capítulo continua funcionando.
  }
}

export default function EditarCapituloPage() {
  const [obraId, setObraId] = useState("");
  const [capituloId, setCapituloId] = useState("");
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvou, setSalvou] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [arquivoImportadoNome, setArquivoImportadoNome] = useState("");
  const [arquivoImportadoErro, setArquivoImportadoErro] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);

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

    async function carregarCapitulo() {
      const params = new URLSearchParams(window.location.search);
      const obraIdParam = params.get("obraId") || "";
      const capituloIdParam = params.get("capituloId") || "";

      setObraId(obraIdParam);
      setCapituloId(capituloIdParam);

      try {
        const obrasLocais = carregarObrasLocaisNormalizadas();
        let obrasAtualizadas = obrasLocais;
        const obraLocal = obrasLocais.find((obra) => obra.id === obraIdParam);
        const capituloLocal =
          obraLocal?.capitulos.find(
            (capitulo) => capitulo.id === capituloIdParam
          ) || null;

        if (capituloLocal) {
          setTitulo(capituloLocal.titulo);
          setTexto(capituloLocal.texto);
        }

        if (obraIdParam) {
          const { data: obraSupabase, error: erroObraSupabase } =
            await supabase
              .from("obras")
              .select("*")
              .eq("id", obraIdParam)
              .maybeSingle();

          if (erroObraSupabase) {
            console.warn("Não consegui buscar a obra no Supabase:", erroObraSupabase.message);
          }

          if (obraSupabase) {
            const { data: capitulosSupabase, error: erroCapitulosSupabase } =
              await supabase
                .from("capitulos")
                .select("*")
                .eq("obra_id", obraIdParam)
                .order("ordem", { ascending: true });

            if (erroCapitulosSupabase) {
              console.warn(
                "Não consegui buscar capítulos no Supabase:",
                erroCapitulosSupabase.message
              );
            }

            const obraNormalizadaSupabase = mapearObraSupabase(
              obraSupabase as ObraSupabaseRow,
              Array.isArray(capitulosSupabase)
                ? (capitulosSupabase as CapituloSupabaseRow[])
                : [],
              obraLocal
            );

            obrasAtualizadas = [
              obraNormalizadaSupabase,
              ...obrasLocais.filter((obra) => obra.id !== obraIdParam),
            ];

            sincronizarBackupArquivosObras(obrasAtualizadas);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasAtualizadas));

            const capituloSupabase =
              obraNormalizadaSupabase.capitulos.find(
                (capitulo) => capitulo.id === capituloIdParam
              ) || null;

            if (capituloSupabase) {
              setTitulo(capituloSupabase.titulo);
              setTexto(capituloSupabase.texto);
            }
          }
        }

        if (!cancelado) {
          setObras(obrasAtualizadas);
        }
      } catch {
        if (!cancelado) {
          setObras([]);
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    carregarCapitulo();

    return () => {
      cancelado = true;
    };
  }, []);

  const obraAtual = useMemo(() => {
    return obras.find((obra) => obra.id === obraId) || null;
  }, [obras, obraId]);

  const capituloAtual = useMemo(() => {
    if (!obraAtual) {
      return null;
    }

    return (
      obraAtual.capitulos.find((capitulo) => capitulo.id === capituloId) || null
    );
  }, [obraAtual, capituloId]);

  const numeroCapitulo = useMemo(() => {
    if (!obraAtual || !capituloAtual) {
      return 0;
    }

    return (
      obraAtual.capitulos.findIndex(
        (capitulo) => capitulo.id === capituloAtual.id
      ) + 1
    );
  }, [obraAtual, capituloAtual]);

  const minhaObraHref = obraAtual
    ? `/minha-obra?obraId=${obraAtual.id}`
    : "/minhas-obras";

  const lerCapituloHref =
    obraAtual && capituloAtual
      ? `/ler-capitulo?obraId=${obraAtual.id}&capituloId=${capituloAtual.id}`
      : "/minhas-obras";

  const bibliotecaHref = "/biblioteca";
  const notificacoesHref = "/notificacoes";
  const paginaPublicaHref = obraAtual
    ? obraAtual.link || `/obra/${obraAtual.slug || criarSlugBase(obraAtual.titulo)}`
    : "/explorar";

  const estatisticasCapitulo = useMemo(() => {
    return calcularEstatisticasCapitulo(titulo, texto, numeroCapitulo || 1);
  }, [titulo, texto, numeroCapitulo]);

  const progresso = useMemo(() => {
    const campos = [titulo, texto];
    const preenchidos = campos.filter((campo) => campo.trim()).length;

    return Math.round((preenchidos / campos.length) * 100);
  }, [titulo, texto]);

  const tituloPreview =
    titulo.trim() || `Capítulo ${numeroCapitulo || ""}`.trim();

  const textoPreview =
    texto.trim() || "O texto do capítulo vai aparecer aqui enquanto você edita.";

  function marcarAlteracao() {
    if (salvou) {
      setSalvou(false);
    }

    if (erro) {
      setErro("");
    }

    if (arquivoImportadoErro) {
      setArquivoImportadoErro("");
    }
  }

  async function importarArquivoTexto(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0] || null;
    event.target.value = "";

    if (!arquivo) {
      return;
    }

    marcarAlteracao();
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
        "Esse arquivo é grande demais para o modo local. Use um arquivo de até 700 KB."
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
        numeroCapitulo || 1
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
    const tituloFinal = titulo.trim() || `Capítulo ${numeroCapitulo}`;
    const textoLimpo = texto.trim();

    if (contarLetrasNumeros(tituloFinal) < 3) {
      return "O título do capítulo precisa ter pelo menos 3 letras ou números. Se quiser usar o título automático, deixe o campo vazio.";
    }

    if (contarLetrasNumeros(textoLimpo) < 20) {
      return "O texto do capítulo precisa ter pelo menos 20 letras ou números.";
    }

    return "";
  }

  async function salvarEdicao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (processando || !obraAtual || !capituloAtual) {
      return;
    }

    const erroValidacao = validarCapitulo();

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

    const tituloFinal = titulo.trim() || `Capítulo ${numeroCapitulo}`;
    const textoFinal = texto.trim();

    try {
      const novasObras = obras.map((obra, obraIndex) => {
        const obraNormalizada = normalizarObra(obra, obraIndex);

        if (obraNormalizada.id !== obraId) {
          return obraNormalizada;
        }

        const capitulosAtualizados = obraNormalizada.capitulos.map((capitulo) => {
          if (capitulo.id !== capituloId) {
            return capitulo;
          }

          return {
            ...capitulo,
            titulo: tituloFinal,
            texto: textoFinal,
          };
        });

        return {
          ...obraNormalizada,
          capitulos: capitulosAtualizados,
          progressoLeitura: calcularProgressoLeitura(capitulosAtualizados),
        };
      });

      const backupArquivos = carregarBackupArquivosObras();
      const novasObrasComBackup = novasObras.map((obra, index) =>
        restaurarArquivoObraComBackup(normalizarObra(obra, index), backupArquivos)
      );

      sincronizarBackupArquivosObras(novasObrasComBackup);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novasObrasComBackup));
      setObras(novasObrasComBackup);

      atualizarNotificacoesDoCapituloEditado(
        obraAtual,
        capituloId,
        tituloFinal
      );

      try {
        const { data: dadosUsuario } = await supabase.auth.getUser();
        let atualizarCapituloQuery = supabase
          .from("capitulos")
          .update({
            titulo: tituloFinal,
            texto: textoFinal,
            atualizado_em: new Date().toISOString(),
          })
          .eq("id", capituloId)
          .eq("obra_id", obraId);

        if (dadosUsuario.user?.id) {
          atualizarCapituloQuery = atualizarCapituloQuery.eq(
            "user_id",
            dadosUsuario.user.id
          );
        }

        const { error: erroSupabase } = await atualizarCapituloQuery;

        if (erroSupabase) {
          console.warn(
            "O capítulo foi salvo no navegador, mas não atualizou no Supabase:",
            erroSupabase.message
          );
        }
      } catch (erroSupabase) {
        console.warn(
          "O capítulo foi salvo no navegador, mas houve falha no Supabase:",
          erroSupabase
        );
      }

      setSalvou(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch {
      alert(
        "Não consegui salvar as alterações. Tente atualizar a página e salvar novamente."
      );
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) {
    return null;
  }

  if (!obraAtual || !capituloAtual) {
    return (
      <main style={pageStyle}>
        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <div style={emptyBoxStyle}>
            <h1 style={emptyTitleStyle}>Capítulo não encontrado</h1>

            <p style={emptyTextStyle}>
              Volte para Minhas Obras e abra o capítulo novamente.
            </p>

            <Link href="/minhas-obras" style={emptyButtonStyle}>
              Ir para Minhas Obras
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <section style={isDesktop ? desktopHeroBoxStyle : heroBoxStyle}>
          <span style={isDesktop ? desktopBadgeStyle : badgeStyle}>EDITAR CAPÍTULO {numeroCapitulo}</span>

          <h1 style={isDesktop ? desktopTitleStyle : titleStyle}>Editar capítulo</h1>

          <p style={isDesktop ? desktopDescriptionStyle : descriptionStyle}>
            {obraAtual.titulo} • Capítulo {numeroCapitulo}
          </p>

          <div style={isDesktop ? desktopHeroStatsStyle : heroStatsStyle}>
            <span style={heroStatStyle}>{estatisticasCapitulo.palavras} palavras</span>
            <span style={heroStatStyle}>{estatisticasCapitulo.minutosLeitura} min</span>
            <span
              style={
                estatisticasCapitulo.prontoParaSalvar
                  ? heroStatReadyStyle
                  : heroStatWarningStyle
              }
            >
              {estatisticasCapitulo.prontoParaSalvar
                ? "Pronto para salvar"
                : "Revisão pendente"}
            </span>
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
              <h2 style={successTitleStyle}>✓ Capítulo atualizado</h2>

              <p style={successTextStyle}>
                As alterações foram salvas sem apagar curtida, comentário, salvo ou arquivo anexado da obra.
              </p>
            </div>

            <div style={successActionsStyle}>
              <Link href={lerCapituloHref} style={successPrimaryButtonStyle}>
                Ler capítulo
              </Link>

              <Link href={minhaObraHref} style={successSecondaryButtonStyle}>
                Ver obra
              </Link>
            </div>
          </section>
        )}

        <section style={isDesktop ? desktopMainGridStyle : mainGridStyle}>
          <form onSubmit={salvarEdicao} style={isDesktop ? desktopFormStyle : formStyle}>
            <div style={isDesktop ? desktopFormHeaderStyle : formHeaderStyle}>
              <span style={formMiniTitleStyle}>CONTEÚDO DO CAPÍTULO</span>

              <h2 style={isDesktop ? desktopFormTitleStyle : formTitleStyle}>Editar texto</h2>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Título do capítulo</label>

              <input
                value={titulo}
                onChange={(event) => {
                  setTitulo(event.target.value);
                  marcarAlteracao();
                }}
                placeholder={`Ex: Capítulo ${numeroCapitulo}`}
                style={inputStyle}
                type="text"
              />

              <span style={hintStyle}>
                Opcional. Se deixar vazio, o sistema usa Capítulo{" "}
                {numeroCapitulo}.
              </span>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Texto do capítulo</label>

              <div style={isDesktop ? desktopImportBoxStyle : importBoxStyle}>
                <div style={importInfoStyle}>
                  <strong style={importTitleStyle}>Importar nova versão</strong>

                  <span style={isDesktop ? desktopImportTextStyle : importTextStyle}>
                    Envie um arquivo .txt ou .md para substituir o texto atual.
                    Você ainda pode revisar tudo antes de salvar.
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
                  marcarAlteracao();
                }}
                placeholder="Escreva o texto do capítulo"
                style={isDesktop ? desktopTextareaStyle : textareaStyle}
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
                    ? "Texto ok"
                    : `${Math.max(
                        20 - estatisticasCapitulo.caracteresValidos,
                        0
                      )} faltando`}
                </span>
              </div>
            </div>

            <div style={isDesktop ? desktopButtonAreaStyle : buttonAreaStyle}>
              <button
                type="submit"
                style={
                  processando
                    ? isDesktop
                      ? desktopDisabledButtonStyle
                      : disabledButtonStyle
                    : isDesktop
                    ? desktopSaveButtonStyle
                    : saveButtonStyle
                }
                disabled={processando}
              >
                {processando ? "Salvando..." : "Salvar alterações"}
              </button>

              <Link href={lerCapituloHref} style={isDesktop ? desktopSecondaryButtonStyle : secondaryButtonStyle}>
                Ler capítulo
              </Link>

              <Link href={minhaObraHref} style={isDesktop ? desktopCancelButtonStyle : cancelButtonStyle}>
                Cancelar
              </Link>
            </div>
          </form>

          <aside style={isDesktop ? desktopPreviewPanelStyle : previewPanelStyle}>
            <div style={previewHeaderStyle}>
              <span style={previewMiniTitleStyle}>PRÉVIA</span>

              <h2 style={previewTitleStyle}>Como vai aparecer</h2>
            </div>

            <article style={isDesktop ? desktopPreviewChapterCardStyle : previewChapterCardStyle}>
              <div style={previewChapterTopStyle}>
                <span style={previewChapterBadgeStyle}>
                  CAPÍTULO {numeroCapitulo}
                </span>

                <span style={previewChapterStatusStyle}>Editando</span>
              </div>

              <h3 style={isDesktop ? desktopPreviewChapterTitleStyle : previewChapterTitleStyle}>{tituloPreview}</h3>

              <p style={isDesktop ? desktopPreviewChapterTextStyle : previewChapterTextStyle}>{textoPreview}</p>

              <div style={previewStatsStyle}>
                <span style={safeTextStyle}>
                  {estatisticasCapitulo.palavras} palavras
                </span>

                <span style={safeTextStyle}>
                  {estatisticasCapitulo.minutosLeitura} min
                </span>
              </div>

              {capituloAtual.comentario.trim() && (
                <div style={commentBoxStyle}>
                  <span style={commentBadgeStyle}>COMENTÁRIO SALVO</span>

                  <p style={commentTextStyle}>{capituloAtual.comentario}</p>
                </div>
              )}
            </article>
          </aside>
        </section>
      </section>
    </main>
  );
}

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
  color: "#FFFFFF",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  width: "min(860px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "16px 0 56px",
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

const topActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  flexWrap: "wrap",
  minWidth: 0,
  maxWidth: "100%",
};

const backLinkStyle: CSSProperties = {
  minHeight: "40px",
  padding: "0 13px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "center",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const topButtonStyle: CSSProperties = {
  minHeight: "40px",
  padding: "0 13px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const heroBoxStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "14px",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, rgba(12,7,23,0.98)) 0%, rgba(12,7,23,0.99) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  boxShadow: "0 14px 38px rgba(0,0,0,0.26), 0 0 28px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 8%, transparent)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const badgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  display: "inline-flex",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 11%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "9px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(35px, 10vw, 56px)",
  lineHeight: 0.94,
  fontWeight: 950,
  letterSpacing: "-0.075em",
  maxWidth: "100%",
  background: "linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 45%, var(--historietas-accent, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  fontSize: "12px",
  lineHeight: 1.45,
  fontWeight: 750,
  maxWidth: "100%",
  ...safeTextStyle,
};

const heroStatsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

const heroStatStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 10px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#E4E4E7",
  fontSize: "11px",
  fontWeight: 950,
  ...safeTextStyle,
};

const heroStatReadyStyle: CSSProperties = {
  ...heroStatStyle,
  background: "rgba(34, 197, 94, 0.14)",
  border: "1px solid rgba(34, 197, 94, 0.28)",
  color: "#86EFAC",
};

const heroStatWarningStyle: CSSProperties = {
  ...heroStatStyle,
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
};

const progressBoxStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  padding: "8px",
  borderRadius: "15px",
  background: "rgba(255,255,255,0.048)",
  border: "1px solid rgba(255,255,255,0.075)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
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
  color: "#D4D4D8",
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
  background: "rgba(255,255,255,0.1)",
  maxWidth: "100%",
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
  background: "rgba(239, 68, 68, 0.12)",
  border: "1px solid rgba(239, 68, 68, 0.30)",
  display: "grid",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const errorTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FCA5A5",
  fontSize: "22px",
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

const errorTextStyle: CSSProperties = {
  margin: 0,
  color: "#FECACA",
  fontSize: "13px",
  lineHeight: 1.6,
  fontWeight: 750,
  ...safeTextStyle,
};

const successBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: "14px",
  borderRadius: "20px",
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(34, 197, 94, 0.28)",
  display: "grid",
  gap: "12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const successTitleStyle: CSSProperties = {
  margin: 0,
  color: "#86EFAC",
  fontSize: "22px",
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

const successTextStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#D4D4D8",
  fontSize: "13px",
  lineHeight: 1.6,
  fontWeight: 700,
  ...safeTextStyle,
};

const successActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(138px, 1fr))",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const successPrimaryButtonStyle: CSSProperties = {
  minHeight: "44px",
  borderRadius: "999px",
  background: "#22C55E",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 11px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const successSecondaryButtonStyle: CSSProperties = {
  minHeight: "44px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 11px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const mainGridStyle: CSSProperties = {
  marginTop: "12px",
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const formStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: "12px",
  borderRadius: "22px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 10%, rgba(18,12,30,0.86))",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 14px 38px rgba(0,0,0,0.22)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
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
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.06em",
  ...safeTextStyle,
};

const fieldGroupStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
};

const labelStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "14px",
  fontWeight: 900,
  ...safeTextStyle,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "46px",
  borderRadius: "16px",
  border: "1px solid #3F3F46",
  background: "#18181B",
  color: "#FFFFFF",
  padding: "0 13px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 650,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  ...safeTextStyle,
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "260px",
  resize: "vertical",
  borderRadius: "18px",
  border: "1px solid #3F3F46",
  background: "#18181B",
  color: "#FFFFFF",
  padding: "13px",
  outline: "none",
  fontSize: "14px",
  lineHeight: 1.7,
  fontWeight: 650,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  ...safeTextStyle,
};

const hintStyle: CSSProperties = {
  color: "#A1A1AA",
  fontSize: "12px",
  lineHeight: 1.5,
  fontWeight: 650,
  ...safeTextStyle,
};


const importBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "10px",
  padding: "12px",
  borderRadius: "18px",
  background:
    "radial-gradient(circle at 92% 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent), transparent 34%), linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, transparent), rgba(255,255,255,0.045))",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const importInfoStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
};

const importTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "14px",
  fontWeight: 950,
  letterSpacing: "-0.02em",
  ...safeTextStyle,
};

const importTextStyle: CSSProperties = {
  color: "#D4D4D8",
  fontSize: "12px",
  lineHeight: 1.5,
  fontWeight: 700,
  ...safeTextStyle,
};

const importSuccessStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 9px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.13)",
  border: "1px solid rgba(34, 197, 94, 0.28)",
  color: "#86EFAC",
  fontSize: "11px",
  fontWeight: 900,
  ...safeTextStyle,
};

const importErrorStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 9px",
  borderRadius: "999px",
  background: "rgba(239, 68, 68, 0.13)",
  border: "1px solid rgba(239, 68, 68, 0.28)",
  color: "#FCA5A5",
  fontSize: "11px",
  fontWeight: 900,
  ...safeTextStyle,
};

const importButtonStyle: CSSProperties = {
  minHeight: "42px",
  width: "100%",
  borderRadius: "999px",
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  cursor: "pointer",
  boxShadow: "0 12px 28px color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const hiddenFileInputStyle: CSSProperties = {
  display: "none",
};

const inlineStatsBoxStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

const inlineStatsItemStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 10px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#D4D4D8",
  fontSize: "11px",
  fontWeight: 900,
  ...safeTextStyle,
};

const inlineStatsReadyStyle: CSSProperties = {
  ...inlineStatsItemStyle,
  background: "rgba(34, 197, 94, 0.14)",
  border: "1px solid rgba(34, 197, 94, 0.3)",
  color: "#86EFAC",
};

const inlineStatsWarningStyle: CSSProperties = {
  ...inlineStatsItemStyle,
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
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

const saveButtonStyle: CSSProperties = {
  minHeight: "48px",
  borderRadius: "999px",
  border: "none",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 12px 32px color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 12px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const disabledButtonStyle: CSSProperties = {
  ...saveButtonStyle,
  background: "rgba(255,255,255,0.08)",
  color: "#A1A1AA",
  boxShadow: "none",
  cursor: "not-allowed",
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: "46px",
  borderRadius: "999px",
  background: "var(--historietas-secondary, #7C3AED)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 950,
  boxShadow: "0 12px 32px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 25%, transparent)",
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

const cancelButtonStyle: CSSProperties = {
  minHeight: "46px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "13px",
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

const previewPanelStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 10%, rgba(18,12,30,0.80))",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "22px",
  padding: "12px",
  boxShadow: "0 14px 36px rgba(0,0,0,0.20)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const previewHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  minWidth: 0,
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
  fontSize: "23px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

const previewChapterCardStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  padding: "14px",
  borderRadius: "20px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 8%, rgba(31,31,35,0.92))",
  border: "1px solid rgba(255,255,255,0.07)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const previewChapterTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  flexWrap: "wrap",
  minWidth: 0,
  maxWidth: "100%",
};

const previewChapterBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 8px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const previewChapterStatusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#E4E4E7",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const previewChapterTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "26px",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const previewChapterTextStyle: CSSProperties = {
  margin: 0,
  color: "#E4E4E7",
  fontSize: "13px",
  lineHeight: 1.65,
  fontWeight: 600,
  whiteSpace: "pre-wrap",
  maxHeight: "210px",
  overflow: "hidden",
  maxWidth: "100%",
  overflowWrap: "break-word",
  wordBreak: "break-word",
  ...safeTextStyle,
};

const previewStatsStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  color: "#A1A1AA",
  fontSize: "11px",
  fontWeight: 850,
  minWidth: 0,
  maxWidth: "100%",
};

const commentBoxStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  padding: "10px",
  borderRadius: "14px",
  background: "rgba(15,15,15,0.42)",
  border: "1px solid rgba(255,255,255,0.08)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const commentBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "9px",
  fontWeight: 950,
  letterSpacing: "0.06em",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const commentTextStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  fontSize: "12px",
  lineHeight: 1.6,
  fontWeight: 600,
  whiteSpace: "pre-wrap",
  maxWidth: "100%",
  overflowWrap: "break-word",
  wordBreak: "break-word",
  ...safeTextStyle,
};

const emptyBoxStyle: CSSProperties = {
  marginTop: "24px",
  borderRadius: "26px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 8%, rgba(31,31,35,0.96))",
  border: "1px solid #2D2D32",
  padding: "22px",
  display: "grid",
  gap: "12px",
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
  color: "#D4D4D8",
  fontSize: "14px",
  lineHeight: 1.7,
  fontWeight: 600,
  ...safeTextStyle,
};

const emptyButtonStyle: CSSProperties = {
  width: "100%",
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
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1120px, calc(100% - 64px))",
  padding: "22px 0 76px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  flexWrap: "nowrap",
  marginBottom: "16px",
};

const desktopTopActionsStyle: CSSProperties = {
  ...topActionsStyle,
  flexWrap: "nowrap",
};

const desktopHeroBoxStyle: CSSProperties = {
  ...heroBoxStyle,
  gridTemplateColumns: "minmax(0, 1fr) 210px",
  gap: "10px 22px",
  padding: "18px 26px",
  borderRadius: "26px",
  alignItems: "center",
};

const desktopBadgeStyle: CSSProperties = {
  ...badgeStyle,
  gridColumn: "1",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  gridColumn: "1",
  fontSize: "clamp(38px, 4.1vw, 56px)",
  letterSpacing: "-0.075em",
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  gridColumn: "1",
  fontSize: "13px",
  lineHeight: 1.45,
};

const desktopHeroStatsStyle: CSSProperties = {
  ...heroStatsStyle,
  gridColumn: "1",
};

const desktopProgressBoxStyle: CSSProperties = {
  ...progressBoxStyle,
  gridColumn: "2",
  gridRow: "1 / span 3",
  alignSelf: "center",
  padding: "9px 10px",
  borderRadius: "16px",
};

const desktopMainGridStyle: CSSProperties = {
  ...mainGridStyle,
  width: "min(1040px, 100%)",
  margin: "12px auto 0",
  gap: "12px",
};

const desktopFormStyle: CSSProperties = {
  ...formStyle,
  padding: "16px",
  borderRadius: "24px",
  gap: "12px",
};

const desktopFormHeaderStyle: CSSProperties = {
  ...formHeaderStyle,
  gap: "5px",
};

const desktopFormTitleStyle: CSSProperties = {
  ...formTitleStyle,
  fontSize: "28px",
};

const desktopImportBoxStyle: CSSProperties = {
  ...importBoxStyle,
  gridTemplateColumns: "minmax(0, 1fr) 150px",
  alignItems: "center",
  gap: "10px",
  padding: "9px 11px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const desktopImportTextStyle: CSSProperties = {
  ...importTextStyle,
  display: "none",
};

const desktopImportButtonStyle: CSSProperties = {
  ...importButtonStyle,
  width: "150px",
  minHeight: "34px",
  padding: "0 12px",
  fontSize: "10px",
  boxShadow: "none",
};

const desktopTextareaStyle: CSSProperties = {
  ...textareaStyle,
  minHeight: "300px",
  fontSize: "14px",
  lineHeight: 1.68,
};

const desktopButtonAreaStyle: CSSProperties = {
  ...buttonAreaStyle,
  gridTemplateColumns: "170px 140px 130px",
  justifyContent: "start",
  gap: "10px",
  marginTop: "2px",
};

const desktopSaveButtonStyle: CSSProperties = {
  ...saveButtonStyle,
  minHeight: "44px",
  fontSize: "13px",
  boxShadow: "0 12px 28px color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent)",
};

const desktopDisabledButtonStyle: CSSProperties = {
  ...disabledButtonStyle,
  minHeight: "44px",
  fontSize: "13px",
};

const desktopSecondaryButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  minHeight: "44px",
  fontSize: "13px",
};

const desktopCancelButtonStyle: CSSProperties = {
  ...cancelButtonStyle,
  minHeight: "44px",
  fontSize: "13px",
};

const desktopPreviewPanelStyle: CSSProperties = {
  ...previewPanelStyle,
  padding: "14px",
  borderRadius: "24px",
};

const desktopPreviewChapterCardStyle: CSSProperties = {
  ...previewChapterCardStyle,
  padding: "14px",
  borderRadius: "20px",
};

const desktopPreviewChapterTitleStyle: CSSProperties = {
  ...previewChapterTitleStyle,
  fontSize: "28px",
};

const desktopPreviewChapterTextStyle: CSSProperties = {
  ...previewChapterTextStyle,
  maxHeight: "240px",
  fontSize: "13px",
  lineHeight: 1.68,
};

