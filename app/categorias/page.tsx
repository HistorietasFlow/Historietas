"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { obras } from "../data/obras";
import { supabase } from "../../lib/supabase/client";

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
  publicado: boolean | null;
  slug: string | null;
  link: string | null;
  criada_em: string | null;
  atualizado_em: string | null;
};

type SupabaseCapituloRow = {
  id: string;
  obra_id: string;
  user_id: string | null;
  titulo: string | null;
  texto: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

type Categoria = {
  nome: string;
  descricao: string;
};

type FiltroCategorias =
  | "todas"
  | "com-obras"
  | "em-leitura"
  | "com-classificacao"
  | "em-breve";

const STORAGE_KEY = "historietas-obras";
const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";

type ArquivosObrasBackup = Record<string, ArquivoObraLocal>;

const categorias: Categoria[] = [
  {
    nome: "Fantasia",
    descricao: "Magia, poderes ocultos, mundos sombrios e aventuras épicas.",
  },
  {
    nome: "Romance",
    descricao:
      "Casais, drama emocional, relações intensas e histórias envolventes.",
  },
  {
    nome: "Terror",
    descricao: "Mistério, medo, criaturas, suspense e atmosferas sombrias.",
  },
  {
    nome: "Ação",
    descricao: "Lutas, rivalidades, poderes, guerras e personagens fortes.",
  },
  {
    nome: "Sci-fi",
    descricao:
      "Tecnologia, futuros distantes, códigos, máquinas e universos alternativos.",
  },
  {
    nome: "Drama",
    descricao:
      "Conflitos pessoais, escolhas difíceis e histórias mais emocionais.",
  },
  {
    nome: "Aventura",
    descricao: "Jornadas, descobertas, perigos e mundos para explorar.",
  },
  {
    nome: "Sobrenatural",
    descricao:
      "Sombras, espíritos, maldições, poderes e fenômenos inexplicáveis.",
  },
];

const filtrosCategorias: { id: FiltroCategorias; titulo: string }[] = [
  { id: "todas", titulo: "Todas" },
  { id: "com-obras", titulo: "Com obras" },
  { id: "em-leitura", titulo: "Em leitura" },
  { id: "com-classificacao", titulo: "Classificadas" },
  { id: "em-breve", titulo: "Em breve" },
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

function categoriaCombinaComGenero(categoria: string, genero: string) {
  const categoriaNormalizada = normalizarTexto(categoria);
  const generoNormalizado = normalizarTexto(genero);

  if (!categoriaNormalizada || !generoNormalizado) {
    return false;
  }

  return generoNormalizado.includes(categoriaNormalizada);
}

function criarLinkCategoria(categoria: string) {
  return `/explorar?categoria=${encodeURIComponent(categoria)}`;
}

function criarLinkEmBreve() {
  return "/em-breve";
}

function mostrarClassificacao(classificacao: string) {
  return Boolean(classificacao && classificacao !== "Não informada");
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

function carregarBackupArquivosObras(): ArquivosObrasBackup {
  try {
    const backupTexto = localStorage.getItem(FILE_BACKUP_STORAGE_KEY);
    const backupJson: unknown = backupTexto ? JSON.parse(backupTexto) : {};

    if (!backupJson || typeof backupJson !== "object" || Array.isArray(backupJson)) {
      return {};
    }

    const backupNormalizado: ArquivosObrasBackup = {};

    Object.entries(backupJson as Record<string, unknown>).forEach(
      ([chave, arquivo]) => {
        const arquivoNormalizado = normalizarArquivoObra(arquivo);

        if (chave.trim() && arquivoNormalizado) {
          backupNormalizado[chave] = arquivoNormalizado;
        }
      }
    );

    return backupNormalizado;
  } catch {
    return {};
  }
}

function criarChavesBackupObra(
  obra: Partial<ObraLocal> & Record<string, unknown>,
  slug: string
) {
  const chaves = new Set<string>();
  const id = typeof obra.id === "string" ? obra.id.trim() : "";
  const titulo = typeof obra.titulo === "string" ? obra.titulo.trim() : "";
  const link = typeof obra.link === "string" ? obra.link.trim() : "";

  if (id) {
    chaves.add(`id:${id}`);
  }

  if (slug) {
    chaves.add(`slug:${slug}`);
  }

  if (titulo) {
    chaves.add(`titulo:${normalizarTexto(titulo)}`);
  }

  if (link) {
    chaves.add(`link:${link}`);
  }

  return Array.from(chaves);
}

function obterArquivoObraComBackup(
  obra: Partial<ObraLocal> & Record<string, unknown>,
  slug: string
) {
  const arquivoAtual = normalizarArquivoObra(obra.arquivoObra);

  if (arquivoAtual) {
    return arquivoAtual;
  }

  const backupArquivos = carregarBackupArquivosObras();
  const chaves = criarChavesBackupObra(obra, slug);

  for (const chave of chaves) {
    const arquivoBackup = normalizarArquivoObra(backupArquivos[chave]);

    if (arquivoBackup) {
      return arquivoBackup;
    }
  }

  return null;
}

function salvarBackupsArquivosObras(obrasParaSalvar: ObraLocal[]) {
  const backupAtual = carregarBackupArquivosObras();
  const proximoBackup: ArquivosObrasBackup = { ...backupAtual };

  obrasParaSalvar.forEach((obra) => {
    const arquivo = normalizarArquivoObra(obra.arquivoObra);

    if (!arquivo) {
      return;
    }

    criarChavesBackupObra(obra, obra.slug).forEach((chave) => {
      proximoBackup[chave] = arquivo;
    });
  });

  localStorage.setItem(FILE_BACKUP_STORAGE_KEY, JSON.stringify(proximoBackup));
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
    titulo: capitulo.titulo || "Capítulo sem título",
    texto: capitulo.texto || "",
    curtiu: Boolean(capitulo.curtiu),
    salvo: Boolean(capitulo.salvo),
    comentario:
      typeof capitulo.comentario === "string" ? capitulo.comentario : "",
    criadoEm: typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
    lido: Boolean(capitulo.lido),
    lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
  };
}

function normalizarObra(
  obra: Partial<ObraLocal> & Record<string, unknown>,
  index: number
): ObraLocal {
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

  const titulo =
    typeof obra.titulo === "string" && obra.titulo.trim()
      ? obra.titulo.trim()
      : "Obra sem título";

  const slug =
    typeof obra.slug === "string" && obra.slug.trim()
      ? obra.slug.trim()
      : criarSlugBase(titulo || `obra-${index + 1}`);

  const link =
    typeof obra.link === "string" && obra.link.trim()
      ? obra.link.trim()
      : `/obra/${slug}`;

  return {
    id:
      typeof obra.id === "string" && obra.id.trim()
        ? obra.id
        : `obra-${index + 1}`,
    titulo,
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
    arquivoObra: obterArquivoObraComBackup(obra, slug),
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
    link,
  };
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

  const tituloObra =
    obra.titulo?.trim() || obraLocal?.titulo || "Obra sem título";
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
    id: obra.id || obraLocal?.id || `obra-supabase-${index + 1}`,
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
        ? obra.tags
            .filter((tag) => typeof tag === "string" && Boolean(tag.trim()))
            .map((tag) => tag.trim())
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

async function carregarObrasPublicadasSupabase(
  obrasLocais: ObraLocal[]
): Promise<ObraLocal[]> {
  try {
    const { data: obrasBanco, error: erroObras } = await supabase
      .from("obras")
      .select("*")
      .eq("publicado", true)
      .order("criada_em", { ascending: false });

    if (erroObras) {
      console.warn(
        "Não consegui carregar categorias pelo Supabase:",
        erroObras.message
      );
      return obrasLocais;
    }

    const obrasSupabase = (obrasBanco || []) as SupabaseObraRow[];

    if (obrasSupabase.length === 0) {
      return obrasLocais;
    }

    const obrasIds = obrasSupabase
      .map((obra) => obra.id)
      .filter((id): id is string => Boolean(id));

    let capitulosSupabase: SupabaseCapituloRow[] = [];

    if (obrasIds.length > 0) {
      const { data: capitulosBanco, error: erroCapitulos } = await supabase
        .from("capitulos")
        .select("*")
        .in("obra_id", obrasIds)
        .order("ordem", { ascending: true });

      if (erroCapitulos) {
        console.warn(
          "Não consegui carregar capítulos para categorias:",
          erroCapitulos.message
        );
      } else {
        capitulosSupabase = (capitulosBanco || []) as SupabaseCapituloRow[];
      }
    }

    const capitulosPorObra = new Map<string, SupabaseCapituloRow[]>();

    capitulosSupabase.forEach((capitulo) => {
      const lista = capitulosPorObra.get(capitulo.obra_id) || [];
      lista.push(capitulo);
      capitulosPorObra.set(capitulo.obra_id, lista);
    });

    const obrasRemotasNormalizadas = obrasSupabase.map((obra, index) => {
      const obraLocal = obrasLocais.find((obraLocalAtual) => {
        const slugLocal =
          obraLocalAtual.slug || criarSlugBase(obraLocalAtual.titulo);
        const slugRemoto = obra.slug?.trim() || "";

        return (
          obraLocalAtual.id === obra.id ||
          (slugLocal && slugRemoto && slugLocal === slugRemoto)
        );
      });

      return normalizarObraSupabase(
        obra,
        capitulosPorObra.get(obra.id) || [],
        obraLocal,
        index
      );
    });

    const obrasMescladas = [...obrasLocais];

    obrasRemotasNormalizadas.forEach((obraRemota) => {
      const indiceExistente = obrasMescladas.findIndex((obraLocalAtual) => {
        const slugLocal =
          obraLocalAtual.slug || criarSlugBase(obraLocalAtual.titulo);
        const slugRemoto =
          obraRemota.slug || criarSlugBase(obraRemota.titulo);

        return obraLocalAtual.id === obraRemota.id || slugLocal === slugRemoto;
      });

      if (indiceExistente >= 0) {
        obrasMescladas[indiceExistente] = obraRemota;
      } else {
        obrasMescladas.unshift(obraRemota);
      }
    });

    salvarBackupsArquivosObras(obrasMescladas);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasMescladas));

    return obrasMescladas;
  } catch (error) {
    console.warn("Não consegui acessar o Supabase em Categorias:", error);
    return obrasLocais;
  }
}

function contarCapitulosLidos(obra: ObraLocal) {
  return obra.capitulos.filter((capitulo) => capitulo.lido).length;
}

function obraTemLeitura(obra: ObraLocal) {
  return (
    obra.progressoLeitura > 0 ||
    contarCapitulosLidos(obra) > 0 ||
    Boolean(obra.ultimoCapituloLidoId) ||
    Boolean(obra.ultimaLeituraEm)
  );
}

export default function CategoriasPage() {
  const [obrasLocais, setObrasLocais] = useState<ObraLocal[]>([]);
  const [buscaCategoria, setBuscaCategoria] = useState("");
  const [filtroCategorias, setFiltroCategorias] =
    useState<FiltroCategorias>("todas");
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

    async function carregarObrasCategorias() {
      try {
        const obrasSalvasTexto = localStorage.getItem(STORAGE_KEY);
        const obrasSalvasJson = obrasSalvasTexto
          ? JSON.parse(obrasSalvasTexto)
          : [];

        const obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
          ? obrasSalvasJson.map((obra, index) =>
              normalizarObra(
                obra as Partial<ObraLocal> & Record<string, unknown>,
                index
              )
            )
          : [];

        salvarBackupsArquivosObras(obrasNormalizadas);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasNormalizadas));

        if (!cancelado) {
          setObrasLocais(obrasNormalizadas);
        }

        const obrasComSupabase = await carregarObrasPublicadasSupabase(
          obrasNormalizadas
        );

        if (!cancelado) {
          setObrasLocais(obrasComSupabase);
        }
      } catch {
        if (!cancelado) {
          setObrasLocais([]);
        }
      }
    }

    carregarObrasCategorias();

    return () => {
      cancelado = true;
    };
  }, []);

  const obrasLocaisPublicadas = useMemo(() => {
    return obrasLocais.filter((obra) => obra.publicado);
  }, [obrasLocais]);

  const totalObrasDisponiveis =
    obras.filter((obra) => obra.disponivel).length +
    obrasLocaisPublicadas.length;

  const totalObrasEmBreve = obras.filter((obra) => !obra.disponivel).length;

  const totalComClassificacao =
    obras.filter((obra) => mostrarClassificacao(obra.classificacaoIndicativa))
      .length +
    obrasLocaisPublicadas.filter((obra) =>
      mostrarClassificacao(obra.classificacaoIndicativa)
    ).length;

  const totalCapitulosLidos = obrasLocaisPublicadas.reduce((total, obra) => {
    return total + contarCapitulosLidos(obra);
  }, 0);

  const totalObrasEmLeitura = obrasLocaisPublicadas.filter((obra) =>
    obraTemLeitura(obra)
  ).length;

  const progressoMedioLeitura = totalObrasEmLeitura
    ? Math.round(
        obrasLocaisPublicadas
          .filter((obra) => obraTemLeitura(obra))
          .reduce((total, obra) => total + obra.progressoLeitura, 0) /
          totalObrasEmLeitura
      )
    : 0;

  const categoriasComTotais = useMemo(() => {
    return categorias.map((categoria) => {
      const obrasFixasDaCategoria = obras.filter((obra) =>
        categoriaCombinaComGenero(categoria.nome, obra.genero)
      );

      const totalFixasDisponiveis = obrasFixasDaCategoria.filter(
        (obra) => obra.disponivel
      ).length;

      const totalFixasEmBreve = obrasFixasDaCategoria.filter(
        (obra) => !obra.disponivel
      ).length;

      const obrasLocaisDaCategoria = obrasLocaisPublicadas.filter((obra) =>
        categoriaCombinaComGenero(categoria.nome, obra.genero)
      );

      const totalLocais = obrasLocaisDaCategoria.length;

      const totalComClassificacaoCategoria =
        obrasFixasDaCategoria.filter((obra) =>
          mostrarClassificacao(obra.classificacaoIndicativa)
        ).length +
        obrasLocaisDaCategoria.filter((obra) =>
          mostrarClassificacao(obra.classificacaoIndicativa)
        ).length;

      const totalCapitulosLocais = obrasLocaisDaCategoria.reduce(
        (total, obra) => total + obra.capitulos.length,
        0
      );

      const totalLidos = obrasLocaisDaCategoria.reduce((total, obra) => {
        return total + contarCapitulosLidos(obra);
      }, 0);

      const totalEmLeitura = obrasLocaisDaCategoria.filter((obra) =>
        obraTemLeitura(obra)
      ).length;

      const progressoMedio = totalEmLeitura
        ? Math.round(
            obrasLocaisDaCategoria
              .filter((obra) => obraTemLeitura(obra))
              .reduce((total, obra) => total + obra.progressoLeitura, 0) /
              totalEmLeitura
          )
        : 0;

      return {
        ...categoria,
        totalObras: totalFixasDisponiveis + totalLocais,
        totalEmBreve: totalFixasEmBreve,
        totalGeral: totalFixasDisponiveis + totalLocais + totalFixasEmBreve,
        totalComClassificacao: totalComClassificacaoCategoria,
        totalCapitulosLocais,
        totalLidos,
        totalEmLeitura,
        progressoMedio,
      };
    });
  }, [obrasLocaisPublicadas]);

  const categoriasEmDestaque = categoriasComTotais
    .filter((categoria) => categoria.totalGeral > 0)
    .sort(
      (categoriaA, categoriaB) => categoriaB.totalGeral - categoriaA.totalGeral
    )
    .slice(0, 4);

  const termoBuscaCategoria = normalizarTexto(buscaCategoria);

  const categoriasFiltradas = useMemo(() => {
    return categoriasComTotais.filter((categoria) => {
      const textoCategoria = normalizarTexto(
        [
          categoria.nome,
          categoria.descricao,
          `${categoria.totalObras} disponíveis`,
          `${categoria.totalEmBreve} em breve`,
          `${categoria.totalComClassificacao} classificadas`,
          `${categoria.totalLidos} lidos`,
          `${categoria.totalEmLeitura} em leitura`,
        ].join(" ")
      );

      const passaBusca = termoBuscaCategoria
        ? textoCategoria.includes(termoBuscaCategoria)
        : true;

      const passaFiltro =
        filtroCategorias === "todas"
          ? true
          : filtroCategorias === "com-obras"
          ? categoria.totalObras > 0
          : filtroCategorias === "em-leitura"
          ? categoria.totalEmLeitura > 0
          : filtroCategorias === "com-classificacao"
          ? categoria.totalComClassificacao > 0
          : categoria.totalEmBreve > 0;

      return passaBusca && passaFiltro;
    });
  }, [categoriasComTotais, termoBuscaCategoria, filtroCategorias]);

  const melhorCategoria = categoriasEmDestaque[0] || null;

  const filtrosAtivos = Boolean(
    buscaCategoria.trim() || filtroCategorias !== "todas"
  );

  function limparFiltrosCategorias() {
    setBuscaCategoria("");
    setFiltroCategorias("todas");
  }

  return (
    <main style={pageStyle}>
      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTopStyle : topStyle}>
          <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
            <span style={logoMarkStyle}>H</span>
            <span style={logoTextStyle}>istorietas</span>
          </Link>

          <span style={badgeStyle}>CATEGORIAS</span>
        </header>

        <section style={isDesktop ? desktopHeroStyle : heroStyle}>
          <h1 style={isDesktop ? desktopTitleStyle : titleStyle}>Escolha um universo para explorar</h1>

          <p style={isDesktop ? desktopDescriptionStyle : descriptionStyle}>
            Categorias é a vitrine de gêneros da Historietas. Escolha fantasia,
            romance, terror, ação, sci-fi ou outro caminho e abra o Explorar já
            filtrado com obras daquele tipo.
          </p>

        </section>

        <section style={isDesktop ? desktopStatsBoxStyle : statsBoxStyle}>
          <div style={isDesktop ? desktopStatCardStyle : statCardStyle}>
            <strong style={statNumberStyle}>{categorias.length}</strong>
            <span style={statLabelStyle}>categorias</span>
          </div>

          <div style={isDesktop ? desktopStatCardStyle : statCardStyle}>
            <strong style={statNumberStyle}>{totalObrasDisponiveis}</strong>
            <span style={statLabelStyle}>
              {totalObrasDisponiveis === 1
                ? "obra disponível"
                : "obras disponíveis"}
            </span>
          </div>

          <div style={isDesktop ? desktopStatCardStyle : statCardStyle}>
            <strong style={classificationStatNumberStyle}>
              {totalComClassificacao}
            </strong>
            <span style={statLabelStyle}>com classificação</span>
          </div>

          <div style={isDesktop ? desktopStatCardStyle : statCardStyle}>
            <strong style={readingStatNumberStyle}>{totalCapitulosLidos}</strong>
            <span style={statLabelStyle}>capítulos lidos</span>
          </div>

          <div style={isDesktop ? desktopStatCardStyle : statCardStyle}>
            <strong style={readingStatNumberStyle}>{totalObrasEmLeitura}</strong>
            <span style={statLabelStyle}>obras em leitura</span>
          </div>

          <div style={isDesktop ? desktopStatCardStyle : statCardStyle}>
            <strong style={classificationStatNumberStyle}>
              {progressoMedioLeitura}%
            </strong>
            <span style={statLabelStyle}>progresso médio</span>
          </div>

          <Link
            href={criarLinkEmBreve()}
            style={isDesktop ? desktopStatCardLinkStyle : statCardLinkStyle}
            aria-label="Abrir página Em breve"
          >
            <strong style={statNumberStyle}>{totalObrasEmBreve}</strong>
            <span style={statLabelStyle}>obras em breve</span>
          </Link>
        </section>

        {melhorCategoria && (
          <section style={isDesktop ? desktopFeaturedCategoryBoxStyle : featuredCategoryBoxStyle}>
            <div style={featuredCategoryContentStyle}>
              <span style={featuredCategoryBadgeStyle}>CATEGORIA EM DESTAQUE</span>

              <h2 style={featuredCategoryTitleStyle}>{melhorCategoria.nome}</h2>

              <p style={featuredCategoryTextStyle}>
                {melhorCategoria.descricao}
              </p>

              <div style={featuredCategoryStatsStyle}>
                <span style={categoryCountStyle}>
                  {melhorCategoria.totalObras} disponíveis
                </span>

                {melhorCategoria.totalComClassificacao > 0 && (
                  <span style={classificationCountStyle}>
                    {melhorCategoria.totalComClassificacao} classificadas
                  </span>
                )}

                {melhorCategoria.totalLidos > 0 && (
                  <span style={readingCountStyle}>
                    {melhorCategoria.totalLidos} lidos
                  </span>
                )}
              </div>
            </div>

            <Link
              href={criarLinkCategoria(melhorCategoria.nome)}
              style={featuredCategoryButtonStyle}
            >
              Abrir destaque
            </Link>
          </section>
        )}

        <section style={isDesktop ? desktopFilterBoxStyle : filterBoxStyle}>
          <div style={isDesktop ? desktopFieldBoxStyle : fieldBoxStyle}>
            <label style={searchLabelStyle}>Buscar categoria</label>

            <input
              value={buscaCategoria}
              onChange={(event) => setBuscaCategoria(event.target.value)}
              placeholder="Buscar por fantasia, romance, leitura, classificação..."
              style={searchInputStyle}
              type="text"
            />
          </div>

          <div style={isDesktop ? desktopFilterButtonsStyle : filterButtonsStyle}>
            {filtrosCategorias.map((filtro) => (
              <button
                key={filtro.id}
                type="button"
                onClick={() => setFiltroCategorias(filtro.id)}
                style={
                  filtroCategorias === filtro.id
                    ? filterButtonActiveStyle
                    : filterButtonStyle
                }
              >
                {filtro.titulo}
              </button>
            ))}
          </div>

          <div style={isDesktop ? desktopFilterFooterStyle : filterFooterStyle}>
            <span style={filterInfoStyle}>
              {categoriasFiltradas.length} de {categorias.length} categorias
            </span>

            {filtrosAtivos && (
              <button
                type="button"
                onClick={limparFiltrosCategorias}
                style={isDesktop ? desktopClearButtonStyle : clearButtonStyle}
              >
                Limpar filtros
              </button>
            )}
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={isDesktop ? desktopSectionHeaderStyle : sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>Gêneros disponíveis</h2>

            <span style={smallTextStyle}>
              Toque em uma categoria para abrir o Explorar filtrado.
            </span>
          </div>

          {categoriasFiltradas.length === 0 ? (
            <div style={emptyBoxStyle}>
              <h3 style={emptyTitleStyle}>Nenhuma categoria encontrada</h3>

              <p style={emptyTextStyle}>
                Tente limpar a busca ou escolher outro filtro rápido.
              </p>

              <button
                type="button"
                onClick={limparFiltrosCategorias}
                style={emptyButtonStyle}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div style={isDesktop ? desktopGridStyle : gridStyle}>
              {categoriasFiltradas.map((categoria) => (
              <Link
                key={categoria.nome}
                href={criarLinkCategoria(categoria.nome)}
                style={isDesktop ? desktopCategoryCardStyle : categoryCardStyle}
              >
                <div style={categoryIconStyle}>
                  <span style={categoryIconTextStyle}>
                    {categoria.nome.slice(0, 1)}
                  </span>
                </div>

                <div style={categoryContentStyle}>
                  <div style={categoryHeaderStyle}>
                    <h3 style={categoryTitleStyle}>{categoria.nome}</h3>

                    <div style={categoryBadgesStyle}>
                      <span style={categoryCountStyle}>
                        {categoria.totalObras}{" "}
                        {categoria.totalObras === 1
                          ? "disponível"
                          : "disponíveis"}
                      </span>

                      {categoria.totalComClassificacao > 0 && (
                        <span style={classificationCountStyle}>
                          {categoria.totalComClassificacao} classificadas
                        </span>
                      )}

                      {categoria.totalLidos > 0 && (
                        <span style={readingCountStyle}>
                          {categoria.totalLidos} lidos
                        </span>
                      )}

                      {categoria.progressoMedio > 0 && categoria.totalLidos === 0 && (
                        <span style={progressCountStyle}>
                          {categoria.progressoMedio}% lido
                        </span>
                      )}

                      {categoria.totalEmBreve > 0 && (
                        <span style={soonCountStyle}>
                          {categoria.totalEmBreve} em breve
                        </span>
                      )}
                    </div>
                  </div>

                  <p style={categoryDescriptionStyle}>
                    {categoria.descricao}
                  </p>

                  {categoria.totalLidos > 0 && (
                    <div style={progressCompactLineStyle}>
                      <div style={progressTrackStyle}>
                        <div
                          style={{
                            ...progressBarStyle,
                            width: `${categoria.progressoMedio}%`,
                          }}
                        />
                      </div>

                      <span style={progressTextStyle}>
                        {categoria.progressoMedio}% lido
                      </span>
                    </div>
                  )}

                  <span style={openCategoryStyle}>Ver categoria →</span>
                </div>
              </Link>
              ))}
            </div>
          )}
        </section>

        {categoriasEmDestaque.length > 0 && (
          <section style={isDesktop ? desktopPopularBoxStyle : popularBoxStyle}>
            <h2 style={popularTitleStyle}>Categorias em destaque</h2>

            <p style={popularTextStyle}>
              Gêneros com obras disponíveis, obras em breve, classificação
              indicativa e progresso de leitura conectado ao catálogo.
            </p>

            <div style={popularListStyle}>
              {categoriasEmDestaque.map((categoria) => (
                <Link
                  key={categoria.nome}
                  href={criarLinkCategoria(categoria.nome)}
                  style={popularTagStyle}
                >
                  {categoria.nome} • {categoria.totalGeral}
                  {categoria.totalLidos > 0
                    ? ` • ${categoria.totalLidos} lidos`
                    : ""}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section style={isDesktop ? desktopInfoBoxStyle : infoBoxStyle}>
          <h2 style={infoTitleStyle}>Como usar categorias</h2>

          <p style={infoTextStyle}>
            Esta página funciona como uma vitrine de gêneros. Ao tocar em uma
            categoria, o Explorar abre filtrado pelo gênero escolhido. Assim,
            Categorias ajuda o leitor a escolher o tipo de história primeiro,
            enquanto Explorar mostra as obras diretamente.
          </p>
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
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  isolation: "isolate",
  background:
    "radial-gradient(circle at 10% -6%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 38%, transparent), transparent 31%), radial-gradient(circle at 92% 8%, color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent), transparent 25%), radial-gradient(circle at 50% 100%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent), transparent 34%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 30%, var(--historietas-bg-end, #180B2D) 62%, #12091F 84%, #0B0614 100%)",
  color: "#FFFFFF",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(820px, calc(100% - 32px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "14px 0 72px",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  marginBottom: "9px",
  minWidth: 0,
  padding: "4px 0",
};

const logoStyle: CSSProperties = {
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "24px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "calc(100% - 130px)",
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
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background: "linear-gradient(135deg, #F5F3FF 0%, var(--historietas-secondary, #C4B5FD) 42%, var(--historietas-accent, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "0 0 26px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, transparent)",
};

const backButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "40px",
  padding: "0 14px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.055) 100%)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 950,
  textAlign: "center",
  boxShadow: "0 10px 26px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.08)",
  backdropFilter: "blur(14px)",
  ...safeTextStyle,
};

const heroStyle: CSSProperties = {
  position: "relative",
  borderRadius: "30px",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 26%, rgba(255,255,255,0.08))",
  background:
    "radial-gradient(circle at 8% 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 22%, transparent), transparent 30%), radial-gradient(circle at 22% 55%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 52%, transparent), transparent 42%), radial-gradient(circle at 92% 35%, color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent), transparent 30%), linear-gradient(135deg, rgba(38,19,61,0.98) 0%, rgba(13,7,25,0.99) 58%, rgba(8,6,18,0.99) 100%)",
  padding: "18px 15px",
  boxShadow:
    "0 24px 70px rgba(0,0,0,0.38), 0 0 46px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 17%, transparent), inset 0 1px 0 rgba(255,255,255,0.09)",
  minWidth: 0,
  overflow: "hidden",
  textAlign: "center",
};

const badgeStyle: CSSProperties = {
  display: "inline-flex",
  maxWidth: "100%",
  padding: "8px 12px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, transparent) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 40%, rgba(255,255,255,0.08))",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.095em",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

const titleStyle: CSSProperties = {
  margin: "0 auto",
  fontSize: "clamp(31px, 8.2vw, 48px)",
  lineHeight: 1.12,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  maxWidth: "650px",
  padding: "3px 0 4px",
  textAlign: "center",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 34%, var(--historietas-accent, #FDBA74) 68%, var(--historietas-secondary, #C4B5FD) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "0 0 34px color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: "7px auto 0",
  color: "#E4E4E7",
  fontSize: "12.5px",
  lineHeight: 1.5,
  fontWeight: 720,
  maxWidth: "590px",
  textAlign: "center",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const heroActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
  margin: "10px auto 0",
  width: "min(340px, 100%)",
  minWidth: 0,
};

const primaryButtonStyle: CSSProperties = {
  minHeight: "39px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, #FB923C 100%)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 12px",
  boxShadow:
    "0 13px 30px color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent), inset 0 1px 0 rgba(255,255,255,0.18)",
  ...safeTextStyle,
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: "39px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 28%, transparent) 0%, rgba(255,255,255,0.055) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 36%, rgba(255,255,255,0.08))",
  color: "#DDD6FE",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 12px",
  boxShadow:
    "0 12px 28px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, transparent), inset 0 1px 0 rgba(255,255,255,0.08)",
  ...safeTextStyle,
};

const statsBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(116px, 1fr))",
  gap: "8px",
  marginTop: "12px",
  minWidth: 0,
};

const statCardStyle: CSSProperties = {
  position: "relative",
  borderRadius: "18px",
  background:
    "radial-gradient(circle at 18% 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 13%, transparent), transparent 38%), linear-gradient(135deg, rgba(39,27,58,0.72) 0%, rgba(18,12,30,0.82) 100%)",
  border: "1px solid rgba(255,255,255,0.075)",
  padding: "10px 10px",
  display: "grid",
  gap: "3px",
  minWidth: 0,
  overflow: "hidden",
  boxShadow:
    "0 10px 26px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.05)",
};

const statCardLinkStyle: CSSProperties = {
  ...statCardStyle,
  color: "#FFFFFF",
  textDecoration: "none",
  cursor: "pointer",
};

const statNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "19px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

const classificationStatNumberStyle: CSSProperties = {
  color: "var(--historietas-secondary, #C4B5FD)",
  fontSize: "19px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

const readingStatNumberStyle: CSSProperties = {
  color: "#86EFAC",
  fontSize: "19px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

const statLabelStyle: CSSProperties = {
  color: "#A1A1AA",
  fontSize: "10px",
  lineHeight: 1.18,
  fontWeight: 850,
  ...safeTextStyle,
};

const sectionStyle: CSSProperties = {
  marginTop: "24px",
  minWidth: 0,
};

const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  marginBottom: "14px",
  padding: "13px 14px",
  borderRadius: "22px",
  background:
    "radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent), transparent 34%), linear-gradient(135deg, rgba(44,28,62,0.88) 0%, rgba(18,12,30,0.94) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 20%, rgba(255,255,255,0.08))",
  boxShadow: "0 14px 34px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.06)",
  minWidth: 0,
  overflow: "hidden",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "30px",
  lineHeight: 1.1,
  fontWeight: 950,
  letterSpacing: "-0.05em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const smallTextStyle: CSSProperties = {
  color: "#A1A1AA",
  fontSize: "14px",
  fontWeight: 800,
  maxWidth: "100%",
  ...safeTextStyle,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "11px",
  minWidth: 0,
};

const categoryCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "58px minmax(0, 1fr)",
  gap: "12px",
  alignItems: "center",
  padding: "13px",
  borderRadius: "24px",
  background:
    "radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent), transparent 30%), radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent), transparent 32%), linear-gradient(135deg, rgba(37,25,55,0.97) 0%, rgba(18,12,30,0.99) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 14%, rgba(255,255,255,0.08))",
  color: "#FFFFFF",
  textDecoration: "none",
  boxShadow:
    "0 16px 38px rgba(0,0,0,0.30), 0 0 30px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 9%, transparent), inset 0 1px 0 rgba(255,255,255,0.055)",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
};

const categoryIconStyle: CSSProperties = {
  width: "58px",
  height: "58px",
  borderRadius: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "radial-gradient(circle at 28% 18%, rgba(255,255,255,0.28), transparent 24%), radial-gradient(circle at top left, color-mix(in srgb, var(--historietas-accent, #F97316) 58%, transparent), transparent 38%), linear-gradient(135deg, var(--historietas-secondary, #7C3AED) 0%, #18181B 100%)",
  color: "#FFFFFF",
  fontSize: "25px",
  fontWeight: 950,
  overflow: "hidden",
  minWidth: 0,
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.16), 0 13px 26px rgba(0,0,0,0.24), 0 0 26px color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
};

const categoryIconTextStyle: CSSProperties = {
  maxWidth: "100%",
  ...safeTextStyle,
};

const categoryContentStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  display: "grid",
  gap: "5px",
};

const categoryHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const categoryTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "20px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.05em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const categoryBadgesStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "5px",
  minWidth: 0,
  maxHeight: "50px",
  overflow: "hidden",
};

const categoryCountStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const classificationCountStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)",
  color: "var(--historietas-secondary, #DDD6FE)",
  fontSize: "11px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const soonCountStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "rgba(113, 113, 122, 0.18)",
  border: "1px solid rgba(161, 161, 170, 0.22)",
  color: "#D4D4D8",
  fontSize: "11px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const readingCountStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.16)",
  border: "1px solid rgba(34, 197, 94, 0.32)",
  color: "#86EFAC",
  fontSize: "11px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const progressCountStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 26%, transparent)",
  color: "var(--historietas-secondary, #DDD6FE)",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const categoryDescriptionStyle: CSSProperties = {
  margin: 0,
  color: "#B3B3B3",
  fontSize: "12px",
  lineHeight: 1.42,
  fontWeight: 650,
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const progressCompactLineStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
};

const progressBoxStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  padding: "7px 8px",
  borderRadius: "14px",
  background: "rgba(34, 197, 94, 0.1)",
  border: "1px solid rgba(34, 197, 94, 0.22)",
  minWidth: 0,
  overflow: "hidden",
};

const progressHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  minWidth: 0,
};

const progressLabelStyle: CSSProperties = {
  color: "#86EFAC",
  fontSize: "11px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  ...safeTextStyle,
};

const progressPercentStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  flex: "0 0 auto",
  ...safeTextStyle,
};

const progressTrackStyle: CSSProperties = {
  width: "100%",
  height: "6px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.09)",
  overflow: "hidden",
};

const progressBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(90deg, #22C55E 0%, var(--historietas-accent, #F97316) 100%)",
};

const progressTextStyle: CSSProperties = {
  color: "#86EFAC",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const openCategoryStyle: CSSProperties = {
  color: "var(--historietas-accent, #F97316)",
  fontSize: "13px",
  fontWeight: 950,
  maxWidth: "100%",
  ...safeTextStyle,
};

const popularBoxStyle: CSSProperties = {
  marginTop: "18px",
  padding: "14px",
  borderRadius: "24px",
  background:
    "radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 20%, transparent), transparent 36%), linear-gradient(135deg, rgba(35,23,53,0.93) 0%, rgba(18,12,30,0.94) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 26%, rgba(255,255,255,0.08))",
  boxShadow: "0 15px 38px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.055)",
  minWidth: 0,
  overflow: "hidden",
};

const popularTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "22px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const popularTextStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#D4D4D8",
  fontSize: "12px",
  lineHeight: 1.45,
  fontWeight: 600,
  maxWidth: "100%",
  ...safeTextStyle,
};

const popularListStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  marginTop: "14px",
  minWidth: 0,
};

const popularTagStyle: CSSProperties = {
  maxWidth: "100%",
  padding: "10px 13px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, transparent) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 32%, rgba(255,255,255,0.08))",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  fontWeight: 950,
  textDecoration: "none",
  whiteSpace: "normal",
  boxShadow: "0 9px 22px rgba(0,0,0,0.16)",
  ...safeTextStyle,
};

const featuredCategoryBoxStyle: CSSProperties = {
  marginTop: "14px",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "11px",
  padding: "15px",
  borderRadius: "26px",
  background:
    "radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 22%, transparent), transparent 36%), radial-gradient(circle at 100% 20%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 28%, transparent), transparent 38%), linear-gradient(135deg, rgba(39,25,58,0.98) 0%, rgba(18,12,30,0.99) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 32%, rgba(255,255,255,0.08))",
  boxShadow:
    "0 20px 50px rgba(0,0,0,0.32), 0 0 34px color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent), inset 0 1px 0 rgba(255,255,255,0.08)",
  minWidth: 0,
  overflow: "hidden",
};

const featuredCategoryContentStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const featuredCategoryBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 10px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const featuredCategoryTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "25px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

const featuredCategoryTextStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  fontSize: "13px",
  lineHeight: 1.45,
  fontWeight: 650,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const featuredCategoryStatsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "5px",
  minWidth: 0,
};

const featuredCategoryButtonStyle: CSSProperties = {
  minHeight: "39px",
  width: "fit-content",
  maxWidth: "100%",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, #FB923C 100%)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 14px",
  boxShadow:
    "0 12px 28px color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent), inset 0 1px 0 rgba(255,255,255,0.16)",
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const filterBoxStyle: CSSProperties = {
  marginTop: "12px",
  display: "grid",
  gap: "8px",
  padding: "11px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, rgba(26,17,41,0.86) 0%, rgba(18,12,30,0.90) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, rgba(255,255,255,0.08))",
  boxShadow:
    "0 16px 40px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.05)",
  minWidth: 0,
  overflow: "hidden",
};

const fieldBoxStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  minWidth: 0,
};

const searchLabelStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  ...safeTextStyle,
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "39px",
  borderRadius: "999px",
  border:
    "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, #3F3F46)",
  background:
    "linear-gradient(135deg, rgba(24,24,27,0.98) 0%, rgba(17,12,27,0.98) 100%)",
  color: "#FFFFFF",
  padding: "0 13px",
  outline: "none",
  fontSize: "12px",
  fontWeight: 800,
  boxSizing: "border-box",
  minWidth: 0,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.045)",
};

const filterButtonsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  minWidth: 0,
};

const filterButtonStyle: CSSProperties = {
  minHeight: "34px",
  padding: "0 11px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.13)",
  background: "rgba(255,255,255,0.075)",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
  ...safeTextStyle,
};

const filterButtonActiveStyle: CSSProperties = {
  ...filterButtonStyle,
  background:
    "linear-gradient(135deg, var(--historietas-secondary, #7C3AED) 0%, var(--historietas-accent, #F97316) 100%)",
  border: "1px solid rgba(255,255,255,0.22)",
  boxShadow:
    "0 14px 34px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 25%, transparent), inset 0 1px 0 rgba(255,255,255,0.16)",
};

const filterFooterStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "wrap",
  minWidth: 0,
};

const filterInfoStyle: CSSProperties = {
  color: "#A1A1AA",
  fontSize: "13px",
  fontWeight: 850,
  ...safeTextStyle,
};

const clearButtonStyle: CSSProperties = {
  minHeight: "40px",
  padding: "0 14px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  ...safeTextStyle,
};

const emptyBoxStyle: CSSProperties = {
  padding: "22px",
  borderRadius: "24px",
  background: "rgba(31,31,35,0.96)",
  border: "1px solid #2D2D32",
  display: "grid",
  gap: "12px",
  minWidth: 0,
  overflow: "hidden",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "22px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  ...safeTextStyle,
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  fontSize: "14px",
  lineHeight: 1.7,
  fontWeight: 650,
  ...safeTextStyle,
};

const emptyButtonStyle: CSSProperties = {
  minHeight: "46px",
  borderRadius: "999px",
  border: "none",
  background: "var(--historietas-secondary, #7C3AED)",
  color: "#FFFFFF",
  fontSize: "14px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 12px",
  ...safeTextStyle,
};

const infoBoxStyle: CSSProperties = {
  marginTop: "18px",
  padding: "14px",
  borderRadius: "24px",
  background:
    "radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 13%, transparent), transparent 34%), linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 9%, transparent) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 10%, transparent) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, rgba(255,255,255,0.08))",
  boxShadow: "0 13px 34px rgba(0,0,0,0.18)",
  minWidth: 0,
  overflow: "hidden",
};

const infoTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "22px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const infoTextStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#D4D4D8",
  fontSize: "12px",
  lineHeight: 1.48,
  fontWeight: 600,
  maxWidth: "100%",
  ...safeTextStyle,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 56px))",
  padding: "22px 0 86px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "12px",
};

const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  minHeight: "202px",
  padding: "30px 42px",
  textAlign: "center",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  borderRadius: "34px",
  boxShadow:
    "0 24px 64px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.10)",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  margin: "0 auto",
  maxWidth: "760px",
  textAlign: "center",
  fontSize: "clamp(44px, 4.9vw, 66px)",
  lineHeight: 1.12,
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  margin: "12px auto 0",
  maxWidth: "720px",
  textAlign: "center",
  fontSize: "15px",
  WebkitLineClamp: 2,
};

const desktopHeroActionsStyle: CSSProperties = {
  ...heroActionsStyle,
  margin: "20px 0 0",
  width: "min(390px, 100%)",
};

const desktopPrimaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  minHeight: "44px",
  fontSize: "13px",
};

const desktopSecondaryButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  minHeight: "44px",
  fontSize: "13px",
};

const desktopStatsBoxStyle: CSSProperties = {
  ...statsBoxStyle,
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: "10px",
  marginTop: "16px",
};

const desktopStatCardStyle: CSSProperties = {
  ...statCardStyle,
  minHeight: "76px",
  padding: "13px 12px",
  alignContent: "center",
  borderRadius: "20px",
};

const desktopStatCardLinkStyle: CSSProperties = {
  ...desktopStatCardStyle,
  color: "#FFFFFF",
  textDecoration: "none",
  cursor: "pointer",
};

const desktopFeaturedCategoryBoxStyle: CSSProperties = {
  ...featuredCategoryBoxStyle,
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  padding: "20px 22px",
  marginTop: "16px",
  borderRadius: "30px",
};

const desktopFilterBoxStyle: CSSProperties = {
  ...filterBoxStyle,
  gridTemplateColumns: "minmax(250px, 0.95fr) minmax(0, 1.25fr) auto",
  alignItems: "end",
  gap: "14px",
  padding: "14px",
  marginTop: "16px",
  borderRadius: "26px",
};

const desktopFieldBoxStyle: CSSProperties = {
  ...fieldBoxStyle,
  minWidth: 0,
};

const desktopFilterButtonsStyle: CSSProperties = {
  ...filterButtonsStyle,
  alignItems: "center",
  gap: "7px",
};

const desktopFilterFooterStyle: CSSProperties = {
  ...filterFooterStyle,
  alignItems: "center",
  justifyContent: "flex-end",
  flexWrap: "nowrap",
};

const desktopClearButtonStyle: CSSProperties = {
  ...clearButtonStyle,
  minHeight: "34px",
  padding: "0 11px",
  fontSize: "12px",
  whiteSpace: "nowrap",
};

const desktopSectionHeaderStyle: CSSProperties = {
  ...sectionHeaderStyle,
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "end",
  padding: "16px 18px",
};

const desktopGridStyle: CSSProperties = {
  ...gridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
};

const desktopCategoryCardStyle: CSSProperties = {
  ...categoryCardStyle,
  minHeight: "178px",
  alignItems: "start",
  padding: "17px",
  borderRadius: "28px",
  gridTemplateColumns: "66px minmax(0, 1fr)",
};

const desktopPopularBoxStyle: CSSProperties = {
  ...popularBoxStyle,
  padding: "20px 22px",
  marginTop: "20px",
  borderRadius: "28px",
};

const desktopInfoBoxStyle: CSSProperties = {
  ...infoBoxStyle,
  padding: "18px 20px",
  marginTop: "20px",
  borderRadius: "28px",
};
