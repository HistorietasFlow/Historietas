"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
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

type FiltroMinhasObras =
  | "todas"
  | "publicadas"
  | "rascunhos"
  | "favoritas"
  | "concluidas"
  | "em-leitura";

type OrdenacaoMinhasObras =
  | "recentes"
  | "titulo"
  | "capitulos"
  | "progresso";

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

const STORAGE_KEY = "historietas-obras";
const FOLLOW_STORAGE_KEY = "historietas-obras-seguidas";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const NOTIFICATIONS_STORAGE_KEY = "historietas-notificacoes";

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

function contarNotificacoesNaoLidas() {
  try {
    const notificacoesTexto = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const notificacoesJson = notificacoesTexto
      ? JSON.parse(notificacoesTexto)
      : [];

    if (!Array.isArray(notificacoesJson)) {
      return 0;
    }

    return notificacoesJson.filter((notificacao) => {
      return notificacao && typeof notificacao === "object" && !notificacao.lida;
    }).length;
  } catch {
    return 0;
  }
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
    nome: arquivo.nome.trim(),
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
        : criarSlugBase(obra.titulo || `obra-${index + 1}`),
    link:
      typeof obra.link === "string" && obra.link.trim()
        ? obra.link
        : `/obra/${
            typeof obra.slug === "string" && obra.slug.trim()
              ? obra.slug
              : criarSlugBase(obra.titulo || `obra-${index + 1}`)
          }`,
  };
}

function carregarObrasLocais() {
  const obrasSalvasTexto = localStorage.getItem(STORAGE_KEY);
  const obrasSalvasJson = obrasSalvasTexto ? JSON.parse(obrasSalvasTexto) : [];

  const obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
    ? obrasSalvasJson.map((obra, index) => normalizarObra(obra, index))
    : [];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasNormalizadas));

  return obrasNormalizadas;
}

function carregarListaIdsStorage(chave: string) {
  const listaTexto = localStorage.getItem(chave);
  const listaJson = listaTexto ? JSON.parse(listaTexto) : [];

  const listaNormalizada: string[] = Array.isArray(listaJson)
    ? listaJson.filter((id): id is string => typeof id === "string")
    : [];

  localStorage.setItem(chave, JSON.stringify(listaNormalizada));

  return listaNormalizada;
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

  const capitulosRemotosIds = new Set(capitulosRemotos.map((capitulo) => capitulo.id));
  const capitulosApenasLocais = (obraLocal?.capitulos || []).filter(
    (capitulo) => !capitulosRemotosIds.has(capitulo.id)
  );
  const capitulosMesclados = [...capitulosRemotos, ...capitulosApenasLocais];
  const tituloObra = obra.titulo?.trim() || obraLocal?.titulo || "Obra sem título";
  const slug = obra.slug?.trim() || obraLocal?.slug || criarSlugBase(tituloObra || `obra-${index + 1}`);
  const arquivoUrl = obra.arquivo_url?.trim() || "";

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
    sinopse: obra.sinopse?.trim() || obraLocal?.sinopse || "Nenhuma sinopse informada.",
    tags: Array.isArray(obra.tags) && obra.tags.length > 0 ? obra.tags : obraLocal?.tags || ["sem tags"],
    capa: obra.capa_url?.trim() || obraLocal?.capa || "",
    capaNome: obra.capa_nome?.trim() || obraLocal?.capaNome || "",
    arquivoObra: arquivoUrl
      ? {
          nome: obra.arquivo_nome?.trim() || obraLocal?.arquivoObra?.nome || "Arquivo da obra",
          tipo: obra.arquivo_tipo?.trim() || obraLocal?.arquivoObra?.tipo || "",
          tamanho:
            typeof obra.arquivo_tamanho === "number" && Number.isFinite(obra.arquivo_tamanho)
              ? obra.arquivo_tamanho
              : obraLocal?.arquivoObra?.tamanho || 0,
          conteudo: arquivoUrl,
          categoria: normalizarCategoriaArquivoSupabase(obra.arquivo_categoria),
          criadoEm: obra.criada_em || obraLocal?.arquivoObra?.criadoEm || "",
        }
      : obraLocal?.arquivoObra || null,
    publicado: Boolean(obra.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obra.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    slug,
    link: obra.link?.trim() || obraLocal?.link || `/obra/${slug}`,
  };
}

function removerReferenciasDaObraExcluida(obraId: string) {
  try {
    const obrasSeguidasTexto = localStorage.getItem(FOLLOW_STORAGE_KEY);
    const obrasSeguidasJson = obrasSeguidasTexto
      ? JSON.parse(obrasSeguidasTexto)
      : [];

    const novasObrasSeguidas = Array.isArray(obrasSeguidasJson)
      ? obrasSeguidasJson.filter((id): id is string => {
          return typeof id === "string" && id !== obraId;
        })
      : [];

    localStorage.setItem(FOLLOW_STORAGE_KEY, JSON.stringify(novasObrasSeguidas));
  } catch {
    localStorage.setItem(FOLLOW_STORAGE_KEY, JSON.stringify([]));
  }

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

          const notificacaoComObra = notificacao as { obraId?: unknown };

          return notificacaoComObra.obraId !== obraId;
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

function criarCoverStyle(capa: string, isDesktop = false): CSSProperties {
  const baseStyle = isDesktop ? desktopCoverStyle : coverStyle;

  if (!capa) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    background: "#18181B",
    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.82) 100%), url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function mostrarClassificacao(obra: ObraLocal) {
  return (
    obra.classificacaoIndicativa &&
    obra.classificacaoIndicativa !== "Não informada"
  );
}

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}

function formatarData(dataIso: string) {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return "Não registrada";
  }

  return data.toLocaleDateString("pt-BR");
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

export default function MinhasObrasPage() {
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroMinhasObras>("todas");
  const [ordenacao, setOrdenacao] =
    useState<OrdenacaoMinhasObras>("recentes");
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [obraComLinkCopiado, setObraComLinkCopiado] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);

  const perfilAutorHref = useMemo(() => {
    const primeiraObraComAutor = obras.find((obra) => obra.autor.trim());

    if (!primeiraObraComAutor) {
      return "/perfil-autor";
    }

    return `/perfil-autor?autor=${encodeURIComponent(
      primeiraObraComAutor.autor
    )}`;
  }, [obras]);

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

    async function carregarObras() {
      try {
        const obrasLocais = carregarObrasLocais();
        const obrasFavoritasNormalizadas = carregarListaIdsStorage(
          FAVORITES_STORAGE_KEY
        );
        const obrasConcluidasNormalizadas = carregarListaIdsStorage(
          COMPLETED_STORAGE_KEY
        );

        if (!cancelado) {
          setObras(obrasLocais);
          setObrasFavoritas(obrasFavoritasNormalizadas);
          setObrasConcluidas(obrasConcluidasNormalizadas);
          setNotificacoesNaoLidas(contarNotificacoesNaoLidas());
        }

        const { data: dadosUsuario, error: erroUsuario } =
          await supabase.auth.getUser();

        if (erroUsuario || !dadosUsuario.user) {
          return;
        }

        const { data: obrasSupabase, error: erroObras } = await supabase
          .from("obras")
          .select("*")
          .eq("user_id", dadosUsuario.user.id)
          .order("criada_em", { ascending: false });

        if (erroObras) {
          console.warn("Não consegui carregar obras do Supabase:", erroObras.message);
          return;
        }

        const obrasBanco = (obrasSupabase || []) as SupabaseObraRow[];
        const obrasIds = obrasBanco.map((obra) => obra.id).filter(Boolean);
        let capitulosBanco: SupabaseCapituloRow[] = [];

        if (obrasIds.length > 0) {
          const { data: capitulosSupabase, error: erroCapitulos } =
            await supabase
              .from("capitulos")
              .select("*")
              .in("obra_id", obrasIds)
              .order("ordem", { ascending: true });

          if (erroCapitulos) {
            console.warn(
              "Não consegui carregar capítulos do Supabase:",
              erroCapitulos.message
            );
          } else {
            capitulosBanco = (capitulosSupabase || []) as SupabaseCapituloRow[];
          }
        }

        const obrasLocaisPorId = new Map(
          obrasLocais.map((obra) => [obra.id, obra])
        );

        const obrasBancoNormalizadas = obrasBanco.map((obra, index) => {
          const capitulosDaObra = capitulosBanco.filter(
            (capitulo) => capitulo.obra_id === obra.id
          );

          return normalizarObraSupabase(
            obra,
            capitulosDaObra,
            obrasLocaisPorId.get(obra.id),
            index
          );
        });

        const idsBanco = new Set(obrasBancoNormalizadas.map((obra) => obra.id));
        const obrasApenasLocais = obrasLocais.filter(
          (obra) => !idsBanco.has(obra.id)
        );
        const obrasMescladas = [...obrasBancoNormalizadas, ...obrasApenasLocais];

        localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasMescladas));

        if (!cancelado) {
          setObras(obrasMescladas);
        }
      } catch {
        if (!cancelado) {
          setObras([]);
          setObrasFavoritas([]);
          setObrasConcluidas([]);
          setNotificacoesNaoLidas(0);
        }
      }
    }

    carregarObras();

    return () => {
      cancelado = true;
    };
  }, []);

  const totais = useMemo(() => {
    const totalCapitulos = obras.reduce(
      (total, obra) => total + obra.capitulos.length,
      0
    );

    const totalCurtidas = obras.reduce((total, obra) => {
      return total + obra.capitulos.filter((capitulo) => capitulo.curtiu).length;
    }, 0);

    const totalComentarios = obras.reduce((total, obra) => {
      return (
        total +
        obra.capitulos.filter((capitulo) => capitulo.comentario.trim()).length
      );
    }, 0);

    const totalSalvos = obras.reduce((total, obra) => {
      return total + obra.capitulos.filter((capitulo) => capitulo.salvo).length;
    }, 0);

    const totalLidos = obras.reduce((total, obra) => {
      return total + obra.capitulos.filter((capitulo) => capitulo.lido).length;
    }, 0);

    const totalEmLeitura = obras.filter((obra) =>
      obra.capitulos.some(
        (capitulo) =>
          capitulo.lido ||
          capitulo.salvo ||
          capitulo.curtiu ||
          capitulo.comentario.trim()
      )
    ).length;

    const totalPublicadas = obras.filter((obra) => obra.publicado).length;
    const totalRascunhos = obras.filter((obra) => !obra.publicado).length;
    const totalFavoritas = obras.filter((obra) =>
      obrasFavoritas.includes(obra.id)
    ).length;
    const totalConcluidas = obras.filter((obra) =>
      obrasConcluidas.includes(obra.id)
    ).length;
    const totalComClassificacao = obras.filter((obra) =>
      mostrarClassificacao(obra)
    ).length;

    const totalComArquivo = obras.filter((obra) => Boolean(obra.arquivoObra))
      .length;

    return {
      totalCapitulos,
      totalCurtidas,
      totalComentarios,
      totalSalvos,
      totalLidos,
      totalEmLeitura,
      totalPublicadas,
      totalRascunhos,
      totalFavoritas,
      totalConcluidas,
      totalComClassificacao,
      totalComArquivo,
    };
  }, [obras, obrasFavoritas, obrasConcluidas]);


  const textoNotificacoes =
    notificacoesNaoLidas > 0
      ? `Notificações (${notificacoesNaoLidas})`
      : "Notificações";

  const obrasParaContinuar = useMemo(() => {
    return obras
      .filter((obra) => encontrarCapituloParaContinuar(obra))
      .sort((obraA, obraB) => {
        const dataA = new Date(obraA.ultimaLeituraEm || obraA.criadaEm).getTime();
        const dataB = new Date(obraB.ultimaLeituraEm || obraB.criadaEm).getTime();

        return (Number.isNaN(dataB) ? 0 : dataB) -
          (Number.isNaN(dataA) ? 0 : dataA);
      });
  }, [obras]);

  const obraRecomendada = useMemo(() => {
    const rascunhoComCapitulo = obras.find((obra) => {
      return !obra.publicado && obra.capitulos.length > 0;
    });

    if (rascunhoComCapitulo) {
      return rascunhoComCapitulo;
    }

    const rascunhoSemCapitulo = obras.find((obra) => !obra.publicado);

    if (rascunhoSemCapitulo) {
      return rascunhoSemCapitulo;
    }

    return obras[0] || null;
  }, [obras]);

  const obrasFiltradas = useMemo(() => {
    const termoBusca = normalizarTexto(busca);

    return obras
      .filter((obra) => {
        if (filtro === "publicadas" && !obra.publicado) {
          return false;
        }

        if (filtro === "rascunhos" && obra.publicado) {
          return false;
        }

        if (filtro === "favoritas" && !obrasFavoritas.includes(obra.id)) {
          return false;
        }

        if (filtro === "concluidas" && !obrasConcluidas.includes(obra.id)) {
          return false;
        }

        if (
          filtro === "em-leitura" &&
          !obra.capitulos.some((capitulo) => {
            return (
              capitulo.lido ||
              capitulo.salvo ||
              capitulo.curtiu ||
              Boolean(capitulo.comentario.trim())
            );
          })
        ) {
          return false;
        }

        if (!termoBusca) {
          return true;
        }

        const textoObra = normalizarTexto(
          [
            obra.titulo,
            obra.autor,
            obra.genero,
            obra.formato,
            obra.classificacaoIndicativa,
            obra.sinopse,
            obra.tags.join(" "),
            obra.capaNome,
            obra.arquivoObra?.nome || "",
          ].join(" ")
        );

        return textoObra.includes(termoBusca);
      })
      .sort((obraA, obraB) => {
        if (ordenacao === "titulo") {
          return obraA.titulo.localeCompare(obraB.titulo, "pt-BR");
        }

        if (ordenacao === "capitulos") {
          return obraB.capitulos.length - obraA.capitulos.length;
        }

        if (ordenacao === "progresso") {
          return obraB.progressoLeitura - obraA.progressoLeitura;
        }

        const dataA = new Date(obraA.criadaEm || obraA.ultimaLeituraEm).getTime();
        const dataB = new Date(obraB.criadaEm || obraB.ultimaLeituraEm).getTime();

        return (Number.isNaN(dataB) ? 0 : dataB) -
          (Number.isNaN(dataA) ? 0 : dataA);
      });
  }, [obras, obrasFavoritas, obrasConcluidas, busca, filtro, ordenacao]);

  function limparFiltros() {
    setBusca("");
    setFiltro("todas");
    setOrdenacao("recentes");
  }

  function salvarObras(novasObras: ObraLocal[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novasObras));
    setObras(novasObras);
  }

  async function publicarObra(obraId: string) {
    const novasObras = obras.map((obra) => {
      if (obra.id !== obraId) {
        return obra;
      }

      return {
        ...obra,
        publicado: true,
      };
    });

    salvarObras(novasObras);

    try {
      const { data: dadosUsuario } = await supabase.auth.getUser();

      if (!dadosUsuario.user) {
        return;
      }

      const { error } = await supabase
        .from("obras")
        .update({
          publicado: true,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", obraId)
        .eq("user_id", dadosUsuario.user.id);

      if (error) {
        console.warn("Não consegui publicar no Supabase:", error.message);
      }
    } catch {
      // O backup local já foi atualizado. O Supabase será sincronizado depois.
    }
  }

  function alternarFavoritoObra(obraId: string) {
    const novasObrasFavoritas = obrasFavoritas.includes(obraId)
      ? obrasFavoritas.filter((id) => id !== obraId)
      : [...obrasFavoritas, obraId];

    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(novasObrasFavoritas)
    );

    setObrasFavoritas(novasObrasFavoritas);
  }

  function alternarConcluidoObra(obraId: string) {
    const novasObrasConcluidas = obrasConcluidas.includes(obraId)
      ? obrasConcluidas.filter((id) => id !== obraId)
      : [...obrasConcluidas, obraId];

    localStorage.setItem(
      COMPLETED_STORAGE_KEY,
      JSON.stringify(novasObrasConcluidas)
    );

    setObrasConcluidas(novasObrasConcluidas);
  }

  async function copiarLinkObra(obra: ObraLocal) {
    const linkPublico =
      obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
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

      setObraComLinkCopiado(obra.id);

      window.setTimeout(() => {
        setObraComLinkCopiado((obraIdAtual) =>
          obraIdAtual === obra.id ? "" : obraIdAtual
        );
      }, 1800);
    } catch {
      setObraComLinkCopiado("");
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

  async function excluirObra(obraId: string, tituloObra: string) {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir a obra "${tituloObra}"? Todos os capítulos, curtidas, comentários e salvos dessa obra serão apagados. Essa ação não pode ser desfeita.`
    );

    if (!confirmar) {
      return;
    }

    const novasObras = obras.filter((obra) => obra.id !== obraId);
    const novasObrasFavoritas = obrasFavoritas.filter((id) => id !== obraId);
    const novasObrasConcluidas = obrasConcluidas.filter((id) => id !== obraId);

    removerReferenciasDaObraExcluida(obraId);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(novasObras));
    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(novasObrasFavoritas)
    );
    localStorage.setItem(
      COMPLETED_STORAGE_KEY,
      JSON.stringify(novasObrasConcluidas)
    );

    setObras(novasObras);
    setObrasFavoritas(novasObrasFavoritas);
    setObrasConcluidas(novasObrasConcluidas);

    try {
      const { data: dadosUsuario } = await supabase.auth.getUser();

      if (!dadosUsuario.user) {
        return;
      }

      const { error } = await supabase
        .from("obras")
        .delete()
        .eq("id", obraId)
        .eq("user_id", dadosUsuario.user.id);

      if (error) {
        console.warn("Não consegui excluir no Supabase:", error.message);
      }
    } catch {
      // A exclusão local já aconteceu. O banco será ajustado depois, se necessário.
    }
  }

  return (
    <main style={pageStyle}>
      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTopStyle : topStyle}>
          <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
            <span style={logoMarkStyle}>H</span>
            <span style={logoTextStyle}>istorietas</span>
          </Link>

          <span style={isDesktop ? desktopTopPageLabelStyle : topPageLabelStyle}>
            Minhas obras
          </span>
        </header>

        <section style={isDesktop ? desktopHeroStyle : heroStyle}>
          <div style={heroGlowStyle} />

          <div style={isDesktop ? desktopHeroContentStyle : heroContentStyle}>
            <h1 style={titleStyle}>Suas histórias</h1>

            <p style={descriptionStyle}>
              Acompanhe rascunhos, capítulos e publicações em um painel limpo
              para continuar criando.
            </p>

            <div style={heroActionsStyle}>
              <Link href="/publicar" style={heroPrimaryButtonStyle}>
                + Criar nova obra
              </Link>
            </div>
          </div>
        </section>

        <section style={isDesktop ? desktopStatsBoxStyle : statsBoxStyle}>
          <div style={isDesktop ? desktopStatCardStyle : statCardStyle}>
            <strong style={statNumberStyle}>{obras.length}</strong>
            <span style={statLabelStyle}>
              {obras.length === 1 ? "obra criada" : "obras criadas"}
            </span>
          </div>

          <div style={isDesktop ? desktopStatCardStyle : statCardStyle}>
            <strong style={statNumberStyle}>{totais.totalPublicadas}</strong>
            <span style={statLabelStyle}>
              {totais.totalPublicadas === 1 ? "publicada" : "publicadas"}
            </span>
          </div>

          <div style={isDesktop ? desktopStatCardStyle : statCardStyle}>
            <strong style={statNumberStyle}>{totais.totalRascunhos}</strong>
            <span style={statLabelStyle}>
              {totais.totalRascunhos === 1 ? "rascunho" : "rascunhos"}
            </span>
          </div>

          <div style={isDesktop ? desktopStatCardStyle : statCardStyle}>
            <strong style={statNumberStyle}>{totais.totalCapitulos}</strong>
            <span style={statLabelStyle}>
              {totais.totalCapitulos === 1 ? "capítulo" : "capítulos"}
            </span>
          </div>

          <div style={isDesktop ? desktopStatCardStyle : statCardStyle}>
            <strong style={statNumberStyle}>{totais.totalComArquivo}</strong>
            <span style={statLabelStyle}>
              {totais.totalComArquivo === 1 ? "arquivo anexado" : "arquivos anexados"}
            </span>
          </div>
        </section>

        {obras.length > 0 && (
          <section style={isDesktop ? desktopFilterBoxStyle : filterBoxStyle}>
            <div style={isDesktop ? desktopFilterGridStyle : filterGridStyle}>
              <label style={fieldBoxStyle}>
                <span style={filterLabelStyle}>Buscar obra</span>

                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Buscar por título, autor, gênero ou tag..."
                  style={searchInputStyle}
                />
              </label>

              <label style={fieldBoxStyle}>
                <span style={filterLabelStyle}>Filtrar</span>

                <select
                  value={filtro}
                  onChange={(event) =>
                    setFiltro(event.target.value as FiltroMinhasObras)
                  }
                  style={selectStyle}
                >
                  <option value="todas">Todas</option>
                  <option value="publicadas">Publicadas</option>
                  <option value="rascunhos">Rascunhos</option>
                  <option value="favoritas">Favoritas</option>
                  <option value="concluidas">Concluídas</option>
                  <option value="em-leitura">Em leitura</option>
                </select>
              </label>

              <label style={fieldBoxStyle}>
                <span style={filterLabelStyle}>Ordenar</span>

                <select
                  value={ordenacao}
                  onChange={(event) =>
                    setOrdenacao(event.target.value as OrdenacaoMinhasObras)
                  }
                  style={selectStyle}
                >
                  <option value="recentes">Mais recentes</option>
                  <option value="titulo">Título A-Z</option>
                  <option value="capitulos">Mais capítulos</option>
                  <option value="progresso">Maior progresso</option>
                </select>
              </label>
            </div>

            <div style={isDesktop ? desktopFilterFooterStyle : filterFooterStyle}>
              <span style={filterInfoStyle}>
                Mostrando {obrasFiltradas.length} de {obras.length} obras
              </span>

              <button
                type="button"
                onClick={limparFiltros}
                style={clearFilterButtonStyle}
              >
                Limpar filtros
              </button>
            </div>
          </section>
        )}

        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <div style={isDesktop ? desktopSectionHeaderStyle : sectionHeaderStyle}>
            <div style={{ minWidth: 0 }}>
              <span style={miniTitleStyle}>BIBLIOTECA</span>

              <h2 style={sectionTitleStyle}>Obras salvas</h2>
            </div>
          </div>

          {obras.length === 0 ? (
            <div style={emptyBoxStyle}>
              <h3 style={emptyTitleStyle}>Nenhuma obra criada ainda</h3>

              <p style={emptyTextStyle}>
                Crie sua primeira obra na página Publicar. Ela será salva no
                Supabase e também ficará com backup neste navegador.
              </p>

              <Link href="/publicar" style={emptyButtonStyle}>
                Criar minha primeira obra
              </Link>
            </div>
          ) : obrasFiltradas.length === 0 ? (
            <div style={emptyBoxStyle}>
              <h3 style={emptyTitleStyle}>Nenhuma obra encontrada</h3>

              <p style={emptyTextStyle}>
                Mude a busca, o filtro ou a ordenação para ver suas obras.
              </p>

              <button type="button" onClick={limparFiltros} style={emptyButtonStyle}>
                Limpar filtros
              </button>
            </div>
          ) : (
            <div style={isDesktop ? desktopListStyle : listStyle}>
              {obrasFiltradas.map((obra) => {
                const totalCurtidas = obra.capitulos.filter(
                  (capitulo) => capitulo.curtiu
                ).length;

                const totalComentarios = obra.capitulos.filter((capitulo) =>
                  capitulo.comentario.trim()
                ).length;

                const totalSalvos = obra.capitulos.filter(
                  (capitulo) => capitulo.salvo
                ).length;

                const totalLidos = obra.capitulos.filter(
                  (capitulo) => capitulo.lido
                ).length;

                const progressoLeitura = calcularProgressoLeitura(
                  obra.capitulos
                );

                const obraFavorita = obrasFavoritas.includes(obra.id);
                const obraConcluida = obrasConcluidas.includes(obra.id);

                const ultimoCapitulo =
                  obra.capitulos[obra.capitulos.length - 1] || null;

                const capituloParaContinuar =
                  encontrarCapituloParaContinuar(obra);

                const capituloDestaque = capituloParaContinuar || ultimoCapitulo;

                const capituloDestaqueIndex = capituloDestaque
                  ? obra.capitulos.findIndex(
                      (capitulo) => capitulo.id === capituloDestaque.id
                    ) + 1
                  : 0;

                const adicionarCapituloHref = `/adicionar-capitulo?obraId=${obra.id}`;
                const editarObraHref = `/editar-obra?obraId=${obra.id}`;
                const verObraHref = `/minha-obra?obraId=${obra.id}`;
                const verArquivoHref = `/ver-arquivo?obraId=${obra.id}`;
                const paginaPublicaHref =
                  obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
                const perfilAutorHref = `/perfil-autor?autor=${encodeURIComponent(
                  obra.autor
                )}`;

                const capituloDestaqueHref = capituloDestaque
                  ? `/ler-capitulo?obraId=${obra.id}&capituloId=${capituloDestaque.id}`
                  : "";

                return (
                  <article key={obra.id} style={isDesktop ? desktopObraCardStyle : obraCardStyle}>
                    <div style={criarCoverStyle(obra.capa, isDesktop)}>
                      <div style={coverGlowStyle} />

                      <span style={genreBadgeStyle}>{obra.genero}</span>

                      {!obra.capa && (
                        <span style={noCoverBadgeStyle}>Sem capa</span>
                      )}

                      {mostrarClassificacao(obra) && (
                        <span style={coverClassificationBadgeStyle}>
                          {obra.classificacaoIndicativa}
                        </span>
                      )}

                      {progressoLeitura > 0 && (
                        <span style={coverProgressBadgeStyle}>
                          {progressoLeitura}% lido
                        </span>
                      )}

                      <div style={coverBottomStyle}>
                        <strong style={coverTitleStyle}>
                          {obra.capitulos.length}
                        </strong>

                        <span style={coverSubtitleStyle}>
                          {obra.capitulos.length === 1
                            ? "capítulo"
                            : "capítulos"}
                        </span>
                      </div>
                    </div>

                    <div style={isDesktop ? desktopCardContentStyle : cardContentStyle}>
                      <div style={statusRowStyle}>
                        <span
                          style={
                            obra.publicado ? publishedStatusStyle : statusStyle
                          }
                        >
                          {obra.publicado ? "Publicado" : "Rascunho"}
                        </span>

                        <span style={formatBadgeStyle}>{obra.formato}</span>

                        {obra.arquivoObra && (
                          <span style={fileBadgeStyle}>Arquivo anexado</span>
                        )}

                        {obraFavorita && (
                          <span style={favoriteBadgeStyle}>★</span>
                        )}

                        {obraConcluida && (
                          <span style={completedBadgeStyle}>✓</span>
                        )}
                      </div>

                      <h3 style={isDesktop ? desktopCardTitleStyle : cardTitleStyle}>{obra.titulo}</h3>

                      <Link href={perfilAutorHref} style={authorLinkStyle}>
                        por {obra.autor}
                      </Link>

                      <p style={isDesktop ? desktopSinopseStyle : sinopseStyle}>{obra.sinopse}</p>

                      <div style={tagListStyle}>
                        {obra.tags.slice(0, 2).map((tag, index) => (
                          <span
                            key={`${obra.id}-${tag}-${index}`}
                            style={tagStyle}
                          >
                            {tag}
                          </span>
                        ))}

                        {obra.tags.length > 2 && (
                          <span style={tagStyle}>+{obra.tags.length - 2}</span>
                        )}
                      </div>

                      {obra.capitulos.length > 0 && (
                        <section style={isDesktop ? desktopProgressBoxStyle : progressBoxStyle}>
                          <div style={progressCompactLineStyle}>
                            <div style={progressTrackStyle}>
                              <div
                                style={{
                                  ...progressBarStyle,
                                  width: `${progressoLeitura}%`,
                                }}
                              />
                            </div>

                            <span style={progressPercentStyle}>
                              {progressoLeitura}%
                            </span>
                          </div>

                          <p style={progressTextStyle}>
                            {totalLidos} de {obra.capitulos.length} lidos
                          </p>
                        </section>
                      )}

                      {capituloDestaque ? (
                        <section style={isDesktop ? desktopLastChapterBoxStyle : lastChapterBoxStyle}>
                          <span style={lastChapterBadgeStyle}>
                            {capituloParaContinuar
                              ? "CONTINUAR LEITURA"
                              : "ÚLTIMO CAPÍTULO"}
                          </span>

                          <h4 style={lastChapterTitleStyle}>
                            Capítulo {capituloDestaqueIndex}: {capituloDestaque.titulo}
                          </h4>

                          <Link
                            href={capituloDestaqueHref}
                            style={lastChapterButtonStyle}
                          >
                            {capituloParaContinuar
                              ? "Continuar lendo"
                              : "Ler capítulo"}
                          </Link>
                        </section>
                      ) : (
                        <section style={isDesktop ? desktopLastChapterBoxStyle : lastChapterBoxStyle}>
                          <span style={lastChapterBadgeStyle}>
                            SEM CAPÍTULOS
                          </span>

                          <p style={lastChapterTextStyle}>
                            Essa obra ainda não possui capítulos. Adicione o
                            primeiro para começar a leitura.
                          </p>
                        </section>
                      )}

                      <div style={isDesktop ? desktopPrimaryActionsGridStyle : primaryActionsGridStyle}>
                        <Link href={verObraHref} style={orangeActionStyle}>
                          Ver obra
                        </Link>

                        <Link
                          href={paginaPublicaHref}
                          style={publicPageActionStyle}
                        >
                          Página pública
                        </Link>

                        {obra.arquivoObra && (
                          <Link href={verArquivoHref} style={fileActionStyle}>
                            Ver arquivo
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => copiarLinkObra(obra)}
                          style={
                            obraComLinkCopiado === obra.id
                              ? copiedLinkActionStyle
                              : copyLinkActionStyle
                          }
                        >
                          {obraComLinkCopiado === obra.id
                            ? "Link copiado!"
                            : "Copiar link"}
                        </button>

                        <Link
                          href={adicionarCapituloHref}
                          style={purpleActionStyle}
                        >
                          Adicionar capítulo
                        </Link>
                      </div>

                      <div style={isDesktop ? desktopSecondaryActionsGridStyle : secondaryActionsGridStyle}>
                        <Link href={editarObraHref} style={secondaryActionStyle}>
                          Editar
                        </Link>

                        <button
                          type="button"
                          onClick={() => alternarFavoritoObra(obra.id)}
                          style={
                            obraFavorita
                              ? favoriteActionActiveStyle
                              : favoriteActionStyle
                          }
                        >
                          {obraFavorita ? "Favorita" : "Favoritar"}
                        </button>

                        <button
                          type="button"
                          onClick={() => alternarConcluidoObra(obra.id)}
                          style={
                            obraConcluida
                              ? completedActionActiveStyle
                              : completedActionStyle
                          }
                        >
                          {obraConcluida ? "Concluída" : "Concluir"}
                        </button>

                        {!obra.publicado && (
                          <button
                            type="button"
                            onClick={() => publicarObra(obra.id)}
                            style={publishActionStyle}
                          >
                            Publicar
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => excluirObra(obra.id, obra.titulo)}
                          style={deleteActionStyle}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Bloco técnico removido do visual final. A sincronização com Supabase continua funcionando normalmente. */}
      </section>
    </main>
  );
}

const safeTextStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background:
    "radial-gradient(circle at 12% 0%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)), transparent 30%), radial-gradient(circle at 88% 14%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)), transparent 24%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 42%, var(--historietas-bg-end, #17101B) 100%)",
  color: "#FFFFFF",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
  boxSizing: "border-box",
};

const containerStyle: CSSProperties = {
  width: "min(840px, calc(100% - 28px))",
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
  gap: "10px",
  marginBottom: "14px",
  flexWrap: "wrap",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
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
  maxWidth: "min(100%, calc(100% - 138px))",
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
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background: "linear-gradient(135deg, #F5F3FF 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 28%, #FFFFFF) 42%, var(--historietas-accent, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "0 0 26px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, transparent)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const topPageLabelStyle: CSSProperties = {
  flex: "0 0 auto",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "36px",
  padding: "0 14px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 30%, rgba(255,255,255,0.06)) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 34%, rgba(255,255,255,0.07)) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 34%, rgba(255,255,255,0.12))",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.04em",
  boxShadow:
    "0 12px 28px rgba(0,0,0,0.22), 0 0 24px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, transparent)",
  ...safeTextStyle,
};

const desktopTopPageLabelStyle: CSSProperties = {
  ...topPageLabelStyle,
  minHeight: "40px",
  padding: "0 18px",
  fontSize: "12px",
};


const backButtonStyle: CSSProperties = {
  minHeight: "40px",
  padding: "0 14px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  ...safeTextStyle,
};





const heroStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
  maxWidth: "100%",
  boxSizing: "border-box",
  borderRadius: "28px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 26%, rgba(255,255,255,0.08))",
  background:
    "radial-gradient(circle at 15% 12%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent), transparent 34%), radial-gradient(circle at 88% 18%, color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent), transparent 26%), linear-gradient(135deg, color-mix(in srgb, var(--historietas-bg-mid, #12081F) 82%, #FFFFFF) 0%, color-mix(in srgb, var(--historietas-bg-start, #0B0614) 94%, #000000) 100%)",
  boxShadow:
    "0 18px 48px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 34px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 10%, transparent)",
  minWidth: 0,
};

const heroGlowStyle: CSSProperties = {
  position: "absolute",
  left: "-42px",
  top: "18px",
  width: "132px",
  height: "132px",
  borderRadius: "999px",
  background:
    "radial-gradient(circle, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 54%, transparent) 0%, transparent 68%)",
  filter: "blur(2px)",
  opacity: 0.82,
  pointerEvents: "none",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "18px 16px 16px",
  display: "grid",
  justifyItems: "center",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "center",
};

const badgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  display: "inline-flex",
  justifySelf: "center",
  padding: "7px 11px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 34%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(35px, 9.6vw, 50px)",
  lineHeight: 0.94,
  fontWeight: 950,
  letterSpacing: "-0.075em",
  maxWidth: "100%",
  background: "linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 42%, var(--historietas-accent, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: "0 auto",
  color: "#D4D4D8",
  fontSize: "13px",
  lineHeight: 1.55,
  fontWeight: 700,
  maxWidth: "540px",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const heroActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "8px",
  width: "min(250px, 100%)",
  margin: "2px auto 0",
  minWidth: 0,
};

const heroPrimaryButtonStyle: CSSProperties = {
  minHeight: "40px",
  borderRadius: "999px",
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 11px 26px color-mix(in srgb, var(--historietas-accent, #F97316) 22%, transparent)",
  textAlign: "center",
  padding: "0 12px",
  ...safeTextStyle,
};





const statsBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 116px), 1fr))",
  gap: "7px",
  marginTop: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const statCardStyle: CSSProperties = {
  borderRadius: "16px",
  background: "linear-gradient(135deg, rgba(31,22,48,0.54) 0%, rgba(18,12,30,0.70) 100%)",
  border: "1px solid rgba(255,255,255,0.06)",
  padding: "9px 10px",
  display: "grid",
  gap: "1px",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "0 7px 18px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.035)",
};

const statNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
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








const filterBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: "12px",
  borderRadius: "22px",
  background: "linear-gradient(135deg, rgba(31,22,48,0.74) 0%, rgba(18,12,30,0.88) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 16%, rgba(255,255,255,0.08))",
  display: "grid",
  gap: "9px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
  boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
};

const filterGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  minWidth: 0,
};

const fieldBoxStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const filterLabelStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  ...safeTextStyle,
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "41px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(11,6,20,0.82)",
  color: "#FFFFFF",
  padding: "0 14px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 700,
  boxSizing: "border-box",
  minWidth: 0,
};

const selectStyle: CSSProperties = {
  width: "100%",
  minHeight: "41px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(11,6,20,0.82)",
  color: "#FFFFFF",
  padding: "0 14px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 800,
  boxSizing: "border-box",
  minWidth: 0,
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

const clearFilterButtonStyle: CSSProperties = {
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

const sectionStyle: CSSProperties = {
  marginTop: "20px",
  minWidth: 0,
};

const sectionHeaderStyle: CSSProperties = {
  display: "block",
  marginBottom: "16px",
  minWidth: 0,
};

const miniTitleStyle: CSSProperties = {
  display: "inline-flex",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  marginBottom: "6px",
  ...safeTextStyle,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(28px, 8vw, 34px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.06em",
  ...safeTextStyle,
};

const emptyBoxStyle: CSSProperties = {
  borderRadius: "26px",
  background: "rgba(31,31,35,0.96)",
  border: "1px solid #2D2D32",
  padding: "22px",
  display: "grid",
  gap: "12px",
  minWidth: 0,
  overflow: "hidden",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "24px",
  fontWeight: 950,
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

const listStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const obraCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "9px",
  padding: "10px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, rgba(33,24,50,0.92) 0%, rgba(18,12,30,0.98) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 13%, rgba(255,255,255,0.07))",
  color: "#FFFFFF",
  boxShadow: "0 12px 30px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 22px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 6%, transparent)",
  boxSizing: "border-box",
  minWidth: 0,
  overflow: "hidden",
};

const coverStyle: CSSProperties = {
  minHeight: "118px",
  maxWidth: "100%",
  boxSizing: "border-box",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  background:
    "radial-gradient(circle at top left, color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 52%, transparent), transparent 38%), linear-gradient(135deg, #18181B 0%, #0F0F0F 100%)",
  minWidth: 0,
};

const coverGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.76) 100%)",
};

const genreBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "9px",
  left: "9px",
  width: "fit-content",
  maxWidth: "calc(100% - 18px)",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 78%, transparent)",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 950,
  textAlign: "center",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const noCoverBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "60px",
  left: "14px",
  width: "fit-content",
  maxWidth: "calc(100% - 28px)",
  padding: "8px 10px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "#D4D4D8",
  fontSize: "11px",
  fontWeight: 950,
  ...safeTextStyle,
};

const coverClassificationBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "9px",
  right: "9px",
  width: "fit-content",
  maxWidth: "calc(100% - 18px)",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 72%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 34%, transparent)",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 950,
  ...safeTextStyle,
};

const coverProgressBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "42px",
  right: "9px",
  width: "fit-content",
  maxWidth: "calc(100% - 18px)",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.72)",
  border: "1px solid rgba(34, 197, 94, 0.34)",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 950,
  ...safeTextStyle,
};


const coverBottomStyle: CSSProperties = {
  position: "absolute",
  left: "12px",
  right: "12px",
  bottom: "12px",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: "10px",
  minWidth: 0,
};

const coverTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "34px",
  lineHeight: 0.85,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  ...safeTextStyle,
};

const coverSubtitleStyle: CSSProperties = {
  color: "#E4E4E7",
  fontSize: "13px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  textAlign: "right",
  ...safeTextStyle,
};

const cardContentStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  display: "grid",
  alignContent: "start",
  gap: "6px",
};

const statusRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "5px",
  minWidth: 0,
};

const statusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const publishedStatusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.10)",
  border: "1px solid rgba(34, 197, 94, 0.22)",
  color: "#86EFAC",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const formatBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#D4D4D8",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const fileBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 26%, transparent)",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};


const favoriteBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 8px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const completedBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 8px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.10)",
  border: "1px solid rgba(34, 197, 94, 0.22)",
  color: "#86EFAC",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};



const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "26px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.06em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const authorLinkStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  margin: 0,
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "14px",
  fontWeight: 900,
  textDecoration: "none",
  borderBottom: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 38%, transparent)",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const sinopseStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  fontSize: "13px",
  lineHeight: 1.45,
  fontWeight: 600,
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const tagListStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
};

const tagStyle: CSSProperties = {
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, transparent)",
  color: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 34%, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const progressBoxStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  padding: "7px 8px",
  borderRadius: "13px",
  background: "rgba(15, 15, 15, 0.28)",
  border: "1px solid rgba(255,255,255,0.065)",
  minWidth: 0,
  overflow: "hidden",
};

const progressCompactLineStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
};



const progressPercentStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "0",
  borderRadius: "999px",
  background: "transparent",
  border: "none",
  color: "#86EFAC",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const progressTrackStyle: CSSProperties = {
  width: "100%",
  height: "6px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
};

const progressBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
};

const progressTextStyle: CSSProperties = {
  margin: 0,
  color: "#A1A1AA",
  fontSize: "10px",
  lineHeight: 1.25,
  fontWeight: 800,
  ...safeTextStyle,
};





const lastChapterBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "6px",
  padding: "9px",
  borderRadius: "15px",
  background: "rgba(255,255,255,0.032)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 12%, rgba(255,255,255,0.06))",
  minWidth: 0,
  overflow: "hidden",
};

const lastChapterBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.06em",
  ...safeTextStyle,
};

const lastChapterTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "15px",
  lineHeight: 1.2,
  fontWeight: 950,
  letterSpacing: "-0.025em",
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const lastChapterTextStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  fontSize: "13px",
  lineHeight: 1.7,
  fontWeight: 600,
  whiteSpace: "pre-wrap",
  maxHeight: "88px",
  overflow: "hidden",
  maxWidth: "100%",
  ...safeTextStyle,
};

const lastChapterButtonStyle: CSSProperties = {
  minHeight: "34px",
  width: "fit-content",
  maxWidth: "100%",
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
  padding: "0 11px",
  ...safeTextStyle,
};

const primaryActionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const secondaryActionsGridStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  paddingTop: "2px",
};

const publishActionStyle: CSSProperties = {
  minHeight: "28px",
  width: "fit-content",
  maxWidth: "100%",
  padding: "0 8px",
  borderRadius: "999px",
  border: "1px solid rgba(34,197,94,0.18)",
  background: "rgba(34,197,94,0.09)",
  color: "#86EFAC",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  ...safeTextStyle,
};

const favoriteActionStyle: CSSProperties = {
  minHeight: "28px",
  width: "fit-content",
  maxWidth: "100%",
  padding: "0 8px",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 8%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  ...safeTextStyle,
};

const favoriteActionActiveStyle: CSSProperties = {
  minHeight: "28px",
  width: "fit-content",
  maxWidth: "100%",
  padding: "0 8px",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, transparent)",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  ...safeTextStyle,
};

const completedActionStyle: CSSProperties = {
  minHeight: "28px",
  width: "fit-content",
  maxWidth: "100%",
  padding: "0 8px",
  borderRadius: "999px",
  border: "1px solid rgba(34,197,94,0.14)",
  background: "rgba(34,197,94,0.07)",
  color: "#86EFAC",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  ...safeTextStyle,
};

const completedActionActiveStyle: CSSProperties = {
  minHeight: "28px",
  width: "fit-content",
  maxWidth: "100%",
  padding: "0 8px",
  borderRadius: "999px",
  border: "1px solid rgba(34,197,94,0.22)",
  background: "rgba(34,197,94,0.12)",
  color: "#86EFAC",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  ...safeTextStyle,
};

const orangeActionStyle: CSSProperties = {
  minHeight: "36px",
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

const purpleActionStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  background: "var(--historietas-secondary, #7C3AED)",
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

const publicPageActionStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 26%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
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

const fileActionStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)",
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

const copyLinkActionStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#E4E4E7",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 10px",
  cursor: "pointer",
  fontFamily: "inherit",
  ...safeTextStyle,
};

const copiedLinkActionStyle: CSSProperties = {
  ...copyLinkActionStyle,
  background: "rgba(34, 197, 94, 0.14)",
  border: "1px solid rgba(34, 197, 94, 0.28)",
  color: "#86EFAC",
};

const savedActionStyle: CSSProperties = {
  minHeight: "44px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)",
  color: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 34%, #FFFFFF)",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 12px",
  ...safeTextStyle,
};

const secondaryActionStyle: CSSProperties = {
  minHeight: "28px",
  width: "fit-content",
  maxWidth: "100%",
  padding: "0 8px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.07)",
  background: "rgba(255,255,255,0.045)",
  color: "#A1A1AA",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  ...safeTextStyle,
};

const deleteActionStyle: CSSProperties = {
  minHeight: "28px",
  width: "fit-content",
  maxWidth: "100%",
  padding: "0 8px",
  borderRadius: "999px",
  border: "1px solid rgba(239,68,68,0.12)",
  background: "rgba(239,68,68,0.065)",
  color: "#FCA5A5",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  ...safeTextStyle,
};

const infoBoxStyle: CSSProperties = {
  marginTop: "24px",
  padding: "16px",
  borderRadius: "22px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 8%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const infoTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "18px",
  fontWeight: 950,
  letterSpacing: "-0.035em",
  ...safeTextStyle,
};

const infoTextStyle: CSSProperties = {
  margin: "8px 0 0",
  color: "#D4D4D8",
  fontSize: "13px",
  lineHeight: 1.6,
  fontWeight: 600,
  ...safeTextStyle,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "28px 0 84px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "20px",
  flexWrap: "nowrap",
};

const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  borderRadius: "32px",
  minHeight: "190px",
  display: "grid",
  alignItems: "center",
};

const desktopHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  padding: "30px 44px",
  textAlign: "center",
  justifyItems: "center",
  maxWidth: "760px",
  margin: "0 auto",
};

const desktopStatsBoxStyle: CSSProperties = {
  ...statsBoxStyle,
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "12px",
  marginTop: "16px",
};

const desktopStatCardStyle: CSSProperties = {
  ...statCardStyle,
  minHeight: "74px",
  padding: "12px 14px",
  borderRadius: "20px",
  alignContent: "center",
};

const desktopFilterBoxStyle: CSSProperties = {
  ...filterBoxStyle,
  marginTop: "18px",
  padding: "16px",
  borderRadius: "26px",
  gap: "14px",
};

const desktopFilterGridStyle: CSSProperties = {
  ...filterGridStyle,
  gridTemplateColumns: "minmax(360px, 1.45fr) minmax(190px, 0.72fr) minmax(210px, 0.78fr)",
  alignItems: "end",
  gap: "14px",
};

const desktopFilterFooterStyle: CSSProperties = {
  ...filterFooterStyle,
  justifyContent: "space-between",
  flexWrap: "nowrap",
};

const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  marginTop: "28px",
};

const desktopSectionHeaderStyle: CSSProperties = {
  ...sectionHeaderStyle,
  display: "flex",
  alignItems: "end",
  justifyContent: "space-between",
  marginBottom: "18px",
  width: "min(1120px, 100%)",
  marginLeft: "auto",
  marginRight: "auto",
};

const desktopListStyle: CSSProperties = {
  ...listStyle,
  gap: "16px",
};

const desktopObraCardStyle: CSSProperties = {
  ...obraCardStyle,
  gridTemplateColumns: "minmax(240px, 0.42fr) minmax(0, 1fr)",
  gap: "18px",
  padding: "14px",
  borderRadius: "28px",
  alignItems: "stretch",
};

const desktopCoverStyle: CSSProperties = {
  ...coverStyle,
  minHeight: "100%",
  height: "auto",
  borderRadius: "22px",
};

const desktopCardContentStyle: CSSProperties = {
  ...cardContentStyle,
  gap: "10px",
  alignContent: "start",
  padding: "4px 4px 4px 0",
};

const desktopCardTitleStyle: CSSProperties = {
  ...cardTitleStyle,
  fontSize: "32px",
  lineHeight: 0.96,
};

const desktopSinopseStyle: CSSProperties = {
  ...sinopseStyle,
  WebkitLineClamp: 3,
  fontSize: "14px",
  lineHeight: 1.55,
};

const desktopProgressBoxStyle: CSSProperties = {
  ...progressBoxStyle,
  padding: "10px 12px",
  borderRadius: "16px",
};

const desktopLastChapterBoxStyle: CSSProperties = {
  ...lastChapterBoxStyle,
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "8px 14px",
  padding: "11px 12px",
  borderRadius: "18px",
};

const desktopPrimaryActionsGridStyle: CSSProperties = {
  ...primaryActionsGridStyle,
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "8px",
};

const desktopSecondaryActionsGridStyle: CSSProperties = {
  ...secondaryActionsGridStyle,
  gap: "7px",
};

const desktopInfoBoxStyle: CSSProperties = {
  ...infoBoxStyle,
  marginTop: "30px",
  padding: "20px 22px",
  borderRadius: "26px",
};

