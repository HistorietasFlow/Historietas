"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

function criarLoginHrefMinhasObras() {
  const params = new URLSearchParams({
    redirectTo: "/minhas-obras",
  });

  return `/login?${params.toString()}`;
}

function idObraSupabaseValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

function criarHrefLeituraCapitulo(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo" | "publicado">,
  capitulo: CapituloLocal,
  numeroCapitulo: number
) {
  const slugSeguro = obra.slug?.trim() || criarSlugBase(obra.titulo);

  if (
    obra.publicado &&
    idObraSupabaseValido(obra.id) &&
    slugSeguro &&
    Number.isInteger(numeroCapitulo) &&
    numeroCapitulo > 0
  ) {
    return `/obra/${encodeURIComponent(slugSeguro)}/capitulo/${numeroCapitulo}`;
  }

  return `/ler-capitulo?obraId=${encodeURIComponent(
    obra.id
  )}&capituloId=${encodeURIComponent(capitulo.id)}`;
}

function criarPerfilAutorHref(autor: string, autorId?: string) {
  const params = new URLSearchParams();
  const autorLimpo = autor.trim() || "Autor não informado";
  const autorIdLimpo = autorId?.trim() || "";

  params.set("autor", autorLimpo);

  if (autorIdLimpo) {
    params.set("autorId", autorIdLimpo);
  }

  return `/perfil-autor?${params.toString()}`;
}

function formatarGeneroMinhasObras(genero: string) {
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
    autorId:
      typeof obra.autorId === "string" && obra.autorId.trim()
        ? obra.autorId.trim()
        : "",
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
    autorId: obra.user_id?.trim() || obraLocal?.autorId || "",
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
    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.22) 100%), url(${capa})`,
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


function criarDecoracaoPaginaStyle(index: number): CSSProperties {
  const posicoes: CSSProperties[] = [
    { top: "32%", right: "-18px", fontSize: "72px", transform: "rotate(-14deg)" },
    { top: "64%", left: "-16px", fontSize: "58px", transform: "rotate(12deg)" },
    { bottom: "8%", right: "10%", fontSize: "52px", transform: "rotate(8deg)" },
  ];

  return {
    position: "absolute",
    color: "var(--historietas-accent, #FDBA74)",
    opacity: 0.045,
    lineHeight: 1,
    fontWeight: 950,
    filter: "blur(0.2px) drop-shadow(0 0 24px color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent))",
    userSelect: "none",
    ...posicoes[index % posicoes.length],
  };
}

function criarDecoracaoMinhasObrasStyle(index: number): CSSProperties {
  const posicoes: CSSProperties[] = [
    { top: "8%", right: "8%", fontSize: "42px", transform: "rotate(-12deg)" },
    { top: "45%", right: "14%", fontSize: "28px", transform: "rotate(16deg)" },
    { bottom: "12%", right: "7%", fontSize: "34px", transform: "rotate(8deg)" },
    { top: "18%", left: "8%", fontSize: "22px", transform: "rotate(14deg)" },
  ];

  return {
    position: "absolute",
    color: "var(--historietas-accent, #FDBA74)",
    opacity: 0.105,
    lineHeight: 1,
    fontWeight: 950,
    filter: "drop-shadow(0 0 18px color-mix(in srgb, var(--historietas-accent, #F97316) 26%, transparent))",
    userSelect: "none",
    ...posicoes[index % posicoes.length],
  };
}

export default function MinhasObrasPage() {
  const router = useRouter();

  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroMinhasObras>("todas");
  const [ordenacao, setOrdenacao] =
    useState<OrdenacaoMinhasObras>("recentes");
  const [obraComLinkCopiado, setObraComLinkCopiado] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(false);
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

    async function verificarAcesso() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (cancelado) {
          return;
        }

        if (error || !data.user) {
          setUsuarioAutenticado(false);
          setVerificandoAcesso(false);
          router.replace(criarLoginHrefMinhasObras());
          return;
        }

        setUsuarioAutenticado(true);
        setVerificandoAcesso(false);
      } catch {
        if (!cancelado) {
          setUsuarioAutenticado(false);
          setVerificandoAcesso(false);
          router.replace(criarLoginHrefMinhasObras());
        }
      }
    }

    void verificarAcesso();

    return () => {
      cancelado = true;
    };
  }, [router]);

  useEffect(() => {
    if (!usuarioAutenticado) {
      return;
    }

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
          console.warn("Não consegui carregar obras remotas:", erroObras.message);
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
              "Não consegui carregar capítulos remotos:",
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
        }
      }
    }

    carregarObras();

    return () => {
      cancelado = true;
    };
  }, [usuarioAutenticado]);

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
            formatarGeneroMinhasObras(obra.genero),
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
      `Tem certeza que deseja excluir a obra "${tituloObra}"? Todos os capítulos, curtidas, comentários e itens salvos dessa obra serão apagados. Essa ação não pode ser desfeita.`
    );

    if (!confirmar) {
      return;
    }

    try {
      const { data: dadosUsuario } = await supabase.auth.getUser();

      if (!dadosUsuario.user) {
        router.replace(criarLoginHrefMinhasObras());
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

      const { error } = await supabase
        .from("obras")
        .delete()
        .eq("id", obraId)
        .eq("user_id", dadosUsuario.user.id);

      if (error) {
        console.warn("Não consegui concluir a exclusão remota:", error.message);
      }
    } catch {
      router.replace(criarLoginHrefMinhasObras());
    }
  }

  if (verificandoAcesso || !usuarioAutenticado) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${minhasObrasPageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <section style={emptyBoxStyle}>
            <h3 style={emptyTitleStyle}>Verificando acesso...</h3>

            <p style={emptyTextStyle}>
              Conferindo sua sessão antes de carregar suas obras.
            </p>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${minhasObrasPageCss}`}</style>

      <div style={pageDecorationLayerStyle} aria-hidden="true">
        {["✦", "◇", "▣"].map((decoracao, index) => (
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
            style={isDesktop ? desktopTitleHomeLinkStyle : titleHomeLinkStyle}
            aria-label="Voltar para a Home"
          >
            <span
              className="historietas-theme-title"
              style={isDesktop ? desktopPageTitleTextStyle : pageTitleTextStyle}
            >
              MINHAS OBRAS
            </span>
          </Link>
        </header>

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
                  <option value="favoritas">Na lista</option>
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

            </div>
          </section>
        )}

        {obras.length > 0 && (
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

            <div style={isDesktop ? desktopStatCardStyle : wideStatCardStyle}>
              <strong style={statNumberStyle}>{totais.totalComArquivo}</strong>
              <span style={statLabelStyle}>
                {totais.totalComArquivo === 1 ? "arquivo anexado" : "arquivos anexados"}
              </span>
            </div>
          </section>
        )}

        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <div style={isDesktop ? desktopSectionHeaderStyle : sectionHeaderStyle}>
            <div style={{ width: "100%", minWidth: 0 }}>
              <h2 style={{ ...sectionTitleStyle, textAlign: "center" }}>
                OBRAS CRIADAS
              </h2>
            </div>
          </div>

          {obras.length === 0 ? (
            <div style={emptyBoxStyle}>
              <h3 style={emptyTitleStyle}>Nenhuma obra criada ainda</h3>

              <p style={emptyTextStyle}>
                Publique sua primeira obra pela página Publicar. Ela aparecerá
                aqui para edição, capítulos e acompanhamento.
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

            </div>
          ) : (
            <div style={isDesktop ? desktopListStyle : listStyle}>
              {obrasFiltradas.map((obra) => {
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

                const adicionarCapituloHref = `/adicionar-capitulo?obraId=${obra.id}`;
                const editarObraHref = `/editar-obra?obraId=${obra.id}`;
                const verObraHref = `/minha-obra?obraId=${obra.id}`;
                const verArquivoHref = `/ver-arquivo?obraId=${obra.id}`;
                const paginaPublicaHref =
                  obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
                const perfilAutorHref = criarPerfilAutorHref(
                  obra.autor,
                  obra.autorId
                );

                const indiceCapituloDestaque = capituloDestaque
                  ? obra.capitulos.findIndex(
                      (capitulo) => capitulo.id === capituloDestaque.id
                    )
                  : -1;
                const numeroCapituloDestaque =
                  indiceCapituloDestaque >= 0 ? indiceCapituloDestaque + 1 : 1;
                const capituloDestaqueHref = capituloDestaque
                  ? criarHrefLeituraCapitulo(
                      obra,
                      capituloDestaque,
                      numeroCapituloDestaque
                    )
                  : "";

                return (
                  <article key={obra.id} style={isDesktop ? desktopObraCardStyle : obraCardStyle}>
                    <div style={criarCoverStyle(obra.capa, isDesktop)}>
                      <div style={coverGlowStyle} />


                      {mostrarClassificacao(obra) && (
                        <span style={coverClassificationBadgeStyle}>
                          {obra.classificacaoIndicativa}
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
                        <span style={formatBadgeStyle}>{obra.formato}</span>

                        {obra.tags.slice(0, 1).map((tag, index) => (
                          <span
                            key={`${obra.id}-status-tag-${tag}-${index}`}
                            style={tagStyle}
                          >
                            {tag}
                          </span>
                        ))}

                        <span style={genreInlineBadgeStyle}>
                          {formatarGeneroMinhasObras(obra.genero)}
                        </span>

                        {obraFavorita && (
                          <span style={favoriteBadgeStyle}>★</span>
                        )}

                        {obraConcluida && (
                          <span style={completedBadgeStyle}>✓</span>
                        )}
                      </div>

                      <h3 style={isDesktop ? desktopCardTitleStyle : cardTitleStyle}>{obra.titulo}</h3>

                      <Link href={perfilAutorHref} style={authorLinkStyle}>
                        Por {obra.autor}
                      </Link>

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

                        </section>
                      )}

                      {obra.arquivoObra && !capituloDestaque ? (
                        <div
                          style={
                            isDesktop
                              ? desktopFilePublicationActionsGridStyle
                              : filePublicationActionsGridStyle
                          }
                        >
                          <div style={filePublicationColumnStyle}>
                            <Link href={verArquivoHref} style={fileActionStyle}>
                              Ver arquivo
                            </Link>

                            <Link
                              href={paginaPublicaHref}
                              style={publicPageActionStyle}
                            >
                              Página pública
                            </Link>
                          </div>

                          <div style={filePublicationColumnStyle}>
                            <Link href={verObraHref} style={orangeActionStyle}>
                              Ver obra
                            </Link>

                            <Link
                              href={adicionarCapituloHref}
                              style={purpleActionStyle}
                            >
                              Adicionar capítulo
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <>
                          {capituloDestaque ? (
                            <section style={isDesktop ? desktopLastChapterBoxStyle : lastChapterBoxStyle}>
                              <div style={lastChapterActionsRowStyle}>
                                <Link
                                  href={capituloDestaqueHref}
                                  style={lastChapterButtonStyle}
                                >
                                  {capituloParaContinuar
                                    ? "Continuar lendo"
                                    : "Ler capítulo"}
                                </Link>

                                <Link href={verObraHref} style={orangeActionStyle}>
                                  Ver obra
                                </Link>
                              </div>
                            </section>
                          ) : (
                            <section style={isDesktop ? desktopLastChapterBoxStyle : lastChapterBoxStyle}>
                              <div style={singleLastChapterActionRowStyle}>
                                <Link href={verObraHref} style={orangeActionStyle}>
                                  Ver obra
                                </Link>
                              </div>
                            </section>
                          )}

                          <div
                            style={
                              obra.arquivoObra
                                ? isDesktop
                                  ? desktopPrimaryActionsWithFileGridStyle
                                  : primaryActionsWithFileGridStyle
                                : isDesktop
                                ? desktopPrimaryActionsGridStyle
                                : primaryActionsGridStyle
                            }
                          >
                            <Link
                              href={paginaPublicaHref}
                              style={publicPageActionStyle}
                            >
                              Página pública
                            </Link>

                            <Link
                              href={adicionarCapituloHref}
                              style={purpleActionStyle}
                            >
                              Adicionar capítulo
                            </Link>

                            {obra.arquivoObra && (
                              <Link href={verArquivoHref} style={fileActionStyle}>
                                Ver arquivo
                              </Link>
                            )}
                          </div>
                        </>
                      )}

                    </div>

                    <div style={isDesktop ? desktopSecondaryActionsGridStyle : secondaryActionsGridStyle}>
                      <Link href={editarObraHref} style={secondaryActionStyle}>
                        Editar
                      </Link>

                      <button
                        type="button"
                        onClick={() => copiarLinkObra(obra)}
                        style={
                          obraComLinkCopiado === obra.id
                            ? copiedLinkSmallActionStyle
                            : copyLinkSmallActionStyle
                        }
                      >
                        {obraComLinkCopiado === obra.id
                          ? "Copiado!"
                          : "Copiar link"}
                      </button>

                      <button
                        type="button"
                        onClick={() => excluirObra(obra.id, obra.titulo)}
                        style={deleteActionStyle}
                      >
                        Excluir
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

      </section>
    </main>
  );
}

const minhasObrasPageCss = `
  html[data-historietas-tema-visual] nav a[href="/minhas-obras"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/minhas-obras"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/minhas-obras"] {
    background: var(--historietas-bottom-nav-hover-bg, var(--historietas-active-surface, rgba(249,115,22,0.16))) !important;
    border-color: color-mix(in srgb, var(--historietas-accent, #F97316) 32%, transparent) !important;
    color: var(--historietas-accent, #F97316) !important;
  }
`;

const safeTextStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const pageDecorationLayerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 0,
};

const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(340px, 48vh)",
  pointerEvents: "none",
  zIndex: 0,
  background:
    "radial-gradient(ellipse at 8% 74%, var(--historietas-glow-primary, rgba(42,20,76,0.54)) 0%, transparent 62%), radial-gradient(ellipse at 76% 68%, var(--historietas-glow-secondary, rgba(32,13,58,0.36)) 0%, transparent 64%), linear-gradient(180deg, var(--historietas-bg-start, rgba(10,6,18,0.98)) 0%, var(--historietas-bg-mid, rgba(18,8,31,0.96)) 42%, transparent 100%)",
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
  background:
    "radial-gradient(circle at 12% 0%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)), transparent 28%), radial-gradient(circle at 88% 14%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)), transparent 22%), radial-gradient(circle at 50% 100%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)), transparent 30%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 38%, var(--historietas-bg-end, #17101B) 100%)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
  isolation: "isolate",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(840px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "14px 0 20px",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "nowrap",
  marginBottom: "14px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  backdropFilter: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
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
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background: "linear-gradient(135deg, var(--historietas-title-from, #F5F3FF) 0%, var(--historietas-title-mid, #F5F3FF) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "var(--historietas-logo-shadow, 0 0 26px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, transparent))",
};

const titleHeaderStyle: CSSProperties = {
  ...topStyle,
  justifyContent: "center",
  marginTop: 0,
  marginBottom: "14px",
  padding: 0,
  textAlign: "center",
};

const titleHomeLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  width: "fit-content",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  flex: "0 1 auto",
  ...safeTextStyle,
};

const titleLogoMarkStyle: CSSProperties = {
  width: "clamp(36px, 8vw, 48px)",
  height: "clamp(36px, 8vw, 48px)",
  borderRadius: "clamp(12px, 2.6vw, 16px)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "clamp(18px, 4.3vw, 24px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
  boxShadow: "none",
};

const desktopTitleLogoMarkStyle: CSSProperties = {
  ...titleLogoMarkStyle,
  width: "clamp(44px, 4.4vw, 58px)",
  height: "clamp(44px, 4.4vw, 58px)",
  borderRadius: "18px",
  fontSize: "clamp(22px, 2.2vw, 30px)",
};

const pageTitleTextStyle: CSSProperties = {
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
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
  textShadow: "none",
  textAlign: "center",
  ...safeTextStyle,
};

const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  marginTop: 0,
  marginBottom: "18px",
};

const desktopTitleHomeLinkStyle: CSSProperties = {
  ...titleHomeLinkStyle,
  gap: "1px",
};

const desktopPageTitleTextStyle: CSSProperties = {
  ...pageTitleTextStyle,
  fontSize: "23px",
  lineHeight: 1.08,
  letterSpacing: "-0.055em",
  maxWidth: "100%",
};

const topCreateActionStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  marginTop: "-6px",
  marginBottom: "12px",
  minWidth: 0,
};

const desktopTopCreateActionStyle: CSSProperties = {
  ...topCreateActionStyle,
  marginTop: "-8px",
  marginBottom: "14px",
};

const heroStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: "30px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent)",
  background:
    "radial-gradient(circle at 12% -4%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 26%, transparent)), transparent 30%), radial-gradient(circle at 18% 42%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 52%, transparent)), transparent 35%), linear-gradient(135deg, var(--historietas-surface, rgba(31,16,52,0.99)) 0%, var(--historietas-surface-strong, rgba(12,7,23,0.99)) 100%)",
  boxShadow: "var(--historietas-hero-shadow, none)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const heroDecorationLayerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 0,
};

const heroPremiumShineStyle: CSSProperties = {
  position: "absolute",
  left: "12%",
  right: "12%",
  top: "14px",
  height: "1px",
  background:
    "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 42%, transparent) 45%, color-mix(in srgb, var(--historietas-secondary, #C4B5FD) 28%, transparent) 70%, transparent 100%)",
  filter: "none",
  zIndex: 0,
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "24px 16px",
  display: "grid",
  justifyItems: "center",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "center",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(36px, 9.4vw, 58px)",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.072em",
  maxWidth: "100%",
  paddingBottom: "3px",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "none",
  ...safeTextStyle,
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  fontSize: "46px",
  lineHeight: 1.08,
  letterSpacing: "-0.065em",
  paddingBottom: "4px",
  textAlign: "center",
};

const descriptionStyle: CSSProperties = {
  margin: "0 auto",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.55,
  fontWeight: 700,
  maxWidth: "560px",
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  margin: "0 auto",
  maxWidth: "610px",
  fontSize: "14px",
  lineHeight: 1.55,
  textAlign: "center",
  WebkitLineClamp: 2,
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
  boxShadow: "none",
  textAlign: "center",
  padding: "0 12px",
  ...safeTextStyle,
};





const statsBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "6px",
  marginTop: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const statCardStyle: CSSProperties = {
  borderRadius: "16px",
  background: "linear-gradient(135deg, var(--historietas-surface, rgba(31,22,48,0.54)) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.70)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.06))",
  padding: "8px 4px",
  minHeight: "62px",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  gap: "3px",
  textAlign: "center",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "var(--historietas-card-shadow, none)",
};

const wideStatCardStyle: CSSProperties = {
  ...statCardStyle,
};

const statNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "20px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const statLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  lineHeight: 1.12,
  fontWeight: 850,
  textAlign: "center",
  overflowWrap: "normal",
  wordBreak: "normal",
  ...safeTextStyle,
};








const filterBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: "12px",
  borderRadius: "22px",
  background: "linear-gradient(135deg, var(--historietas-surface, rgba(31,22,48,0.74)) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.88)) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 16%, var(--historietas-border-soft, rgba(255,255,255,0.08)))",
  display: "grid",
  gap: "9px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
  boxShadow: "var(--historietas-card-shadow, none)",
};

const filterGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  minWidth: 0,
};

const fieldBoxStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "8px",
  minWidth: 0,
  textAlign: "center",
};

const filterLabelStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "13px",
  fontWeight: 950,
  letterSpacing: "0.04em",
  textAlign: "center",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "41px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-input-bg, rgba(11,6,20,0.82))",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 14px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 700,
  textAlign: "center",
  boxSizing: "border-box",
  minWidth: 0,
};

const selectStyle: CSSProperties = {
  width: "100%",
  minHeight: "41px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-input-bg, rgba(11,6,20,0.82))",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 14px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 800,
  textAlign: "center",
  boxSizing: "border-box",
  minWidth: 0,
};

const filterFooterStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  flexWrap: "wrap",
  minWidth: 0,
  textAlign: "center",
};

const filterInfoStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "13px",
  fontWeight: 850,
  textAlign: "center",
  width: "100%",
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

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "clamp(28px, 8vw, 34px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "0.035em",
  textAlign: "center",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const emptyBoxStyle: CSSProperties = {
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
  fontSize: "24px",
  fontWeight: 950,
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
  gridTemplateColumns: "minmax(112px, 0.38fr) minmax(0, 1fr)",
  alignItems: "start",
  gap: "10px",
  padding: "10px",
  borderRadius: "21px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(33,24,50,0.92)) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.98)) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 13%, var(--historietas-border-soft, rgba(255,255,255,0.07)))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  boxShadow: "var(--historietas-card-shadow, none)",
  boxSizing: "border-box",
  minWidth: 0,
  overflow: "hidden",
};

const coverStyle: CSSProperties = {
  width: "100%",
  minHeight: "180px",
  height: "180px",
  maxHeight: "180px",
  maxWidth: "100%",
  alignSelf: "start",
  boxSizing: "border-box",
  borderRadius: "15px",
  position: "relative",
  overflow: "hidden",
  background:
    "radial-gradient(circle at top left, color-mix(in srgb, var(--historietas-accent, #F97316) 22%, transparent), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 28%, transparent), transparent 38%), linear-gradient(135deg, var(--historietas-surface, #18181B) 0%, var(--historietas-surface-strong, #0F0F0F) 100%)",
  minWidth: 0,
  flex: "0 0 auto",
};

const coverGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.18) 100%)",
  pointerEvents: "none",
};

const noCoverBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "48px",
  left: "14px",
  width: "fit-content",
  maxWidth: "calc(100% - 28px)",
  padding: "8px 10px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.1))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.14))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
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

const coverBottomStyle: CSSProperties = {
  position: "absolute",
  left: "10px",
  right: "10px",
  bottom: "12px",
  display: "flex",
  alignItems: "baseline",
  justifyContent: "center",
  gap: "7px",
  minWidth: 0,
};

const coverTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
  fontSize: "34px",
  lineHeight: 0.85,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  flex: "0 0 auto",
  ...safeTextStyle,
};

const coverSubtitleStyle: CSSProperties = {
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
  fontSize: "12px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.055em",
  textAlign: "left",
  whiteSpace: "nowrap",
  overflowWrap: "normal",
  wordBreak: "normal",
  flex: "0 1 auto",
  minWidth: 0,
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
  rowGap: "5px",
  marginTop: "4px",
  minWidth: 0,
};

const formatBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, var(--historietas-surface, rgba(255,255,255,0.055)))",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, var(--historietas-border-soft, rgba(255,255,255,0.08)))",
  color: "var(--historietas-text-primary, #FFFFFF)",
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
  margin: "0",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "24px",
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: "-0.06em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const authorLinkStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  margin: "-2px 0 1px",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "13px",
  fontWeight: 900,
  textDecoration: "none",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const tagStyle: CSSProperties = {
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, var(--historietas-surface, transparent))",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 28%, var(--historietas-border-soft, transparent))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const genreInlineBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, var(--historietas-surface, transparent))",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 32%, var(--historietas-border-soft, transparent))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const progressBoxStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  padding: "0",
  borderRadius: 0,
  background: "transparent",
  border: "none",
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
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  overflow: "hidden",
};

const progressBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
};






const lastChapterBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "7px",
  padding: "0",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
  overflow: "hidden",
};


const lastChapterActionsRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const singleLastChapterActionRowStyle: CSSProperties = {
  ...lastChapterActionsRowStyle,
  gridTemplateColumns: "1fr",
};

const filePublicationActionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  marginTop: "1px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const filePublicationColumnStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  alignContent: "start",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
};

const desktopFilePublicationActionsGridStyle: CSSProperties = {
  ...filePublicationActionsGridStyle,
  gap: "9px",
};

const lastChapterButtonStyle: CSSProperties = {
  minHeight: "34px",
  width: "100%",
  maxWidth: "100%",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10.5px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 8px",
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const primaryActionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const primaryActionsWithFileGridStyle: CSSProperties = {
  ...primaryActionsGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "7px",
};

const secondaryActionsGridStyle: CSSProperties = {
  gridColumn: "1 / -1",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  alignItems: "stretch",
  gap: "6px",
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  paddingTop: "2px",
};






const orangeActionStyle: CSSProperties = {
  minHeight: "34px",
  width: "100%",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10.5px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 8px",
  ...safeTextStyle,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const purpleActionStyle: CSSProperties = {
  minHeight: "34px",
  width: "100%",
  borderRadius: "999px",
  background: "var(--historietas-secondary, #7C3AED)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10.5px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 6px",
  ...safeTextStyle,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const publicPageActionStyle: CSSProperties = {
  minHeight: "34px",
  width: "100%",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 26%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  textDecoration: "none",
  fontSize: "10.5px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 6px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  ...safeTextStyle,
};

const fileActionStyle: CSSProperties = {
  minHeight: "34px",
  width: "100%",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10.5px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 6px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  ...safeTextStyle,
};

const copyLinkSmallActionStyle: CSSProperties = {
  minHeight: "28px",
  width: "100%",
  maxWidth: "100%",
  padding: "0 8px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  color: "var(--historietas-text-primary, #E4E4E7)",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  ...safeTextStyle,
};

const copiedLinkSmallActionStyle: CSSProperties = {
  ...copyLinkSmallActionStyle,
  border: "1px solid rgba(34,197,94,0.22)",
  background: "rgba(34,197,94,0.12)",
  color: "#86EFAC",
};

const secondaryActionStyle: CSSProperties = {
  minHeight: "28px",
  width: "100%",
  maxWidth: "100%",
  padding: "0 8px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.07))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.045))",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 900,
  display: "flex",
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
  width: "100%",
  maxWidth: "100%",
  padding: "0 8px",
  borderRadius: "999px",
  border: "1px solid rgba(239,68,68,0.12)",
  background: "rgba(239,68,68,0.065)",
  color: "#FCA5A5",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  ...safeTextStyle,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "26px 0 32px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "16px",
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
  padding: "30px 40px",
  textAlign: "center",
  justifyItems: "center",
  maxWidth: "760px",
  margin: "0 auto",
  gap: "10px",
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
  justifyContent: "center",
  flexWrap: "wrap",
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
  gridTemplateColumns: "176px minmax(0, 1fr)",
  gap: "14px",
  padding: "12px",
  borderRadius: "24px",
};

const desktopCoverStyle: CSSProperties = {
  ...coverStyle,
  minHeight: "210px",
  height: "210px",
  maxHeight: "210px",
  borderRadius: "18px",
};

const desktopCardContentStyle: CSSProperties = {
  ...cardContentStyle,
  gap: "7px",
};

const desktopCardTitleStyle: CSSProperties = {
  ...cardTitleStyle,
  fontSize: "32px",
  lineHeight: 0.96,
};

const desktopProgressBoxStyle: CSSProperties = {
  ...progressBoxStyle,
  padding: "0",
  borderRadius: 0,
};

const desktopLastChapterBoxStyle: CSSProperties = {
  ...lastChapterBoxStyle,
  gridTemplateColumns: "1fr",
  alignItems: "start",
  gap: "7px",
  padding: "0",
  borderRadius: 0,
};

const desktopPrimaryActionsGridStyle: CSSProperties = {
  ...primaryActionsGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "9px",
};

const desktopPrimaryActionsWithFileGridStyle: CSSProperties = {
  ...primaryActionsWithFileGridStyle,
  gap: "8px",
};

const desktopSecondaryActionsGridStyle: CSSProperties = {
  ...secondaryActionsGridStyle,
  gap: "8px",
};