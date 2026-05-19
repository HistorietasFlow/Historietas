"use client";

import Link from "next/link";
import { supabase } from "../../lib/supabase/client";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

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
  obraId: string;
  capituloId: string;
  link: string;
  titulo: string;
  mensagem: string;
  tipo: "novo-capitulo";
  lida: boolean;
  criadaEm: string;
};

type FiltroNotificacao = "todas" | "nao-lidas" | "lidas" | "com-obra" | "sem-obra";
type OrdenacaoNotificacao = "recentes" | "antigas" | "obra" | "capitulo";

const CHAVE_OBRAS = "historietas-obras";
const CHAVE_NOTIFICACOES = "historietas-notificacoes";
const CHAVE_OBRAS_SEGUIDAS = "historietas-obras-seguidas";

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

function formatarData(dataIso: string) {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return "Não registrada";
  }

  return data.toLocaleDateString("pt-BR");
}

function dataNotificacao(notificacao: NotificacaoLocal) {
  const data = new Date(notificacao.criadaEm).getTime();

  return Number.isNaN(data) ? 0 : data;
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

function normalizarNotificacao(
  notificacao: Partial<NotificacaoLocal>,
  index: number
): NotificacaoLocal {
  const notificacaoBruta = notificacao as Partial<NotificacaoLocal> &
    Record<string, unknown>;

  return {
    id:
      typeof notificacao.id === "string" && notificacao.id.trim()
        ? notificacao.id
        : `notificacao-${index + 1}`,
    obraId: typeof notificacao.obraId === "string" ? notificacao.obraId : "",
    capituloId:
      typeof notificacao.capituloId === "string" ? notificacao.capituloId : "",
    link:
      typeof notificacao.link === "string" && notificacao.link.trim()
        ? notificacao.link.trim()
        : "",
    titulo:
      typeof notificacao.titulo === "string" && notificacao.titulo.trim()
        ? notificacao.titulo
        : "Nova notificação",
    mensagem:
      typeof notificacao.mensagem === "string" && notificacao.mensagem.trim()
        ? notificacao.mensagem
        : "Uma obra recebeu uma atualização.",
    tipo: "novo-capitulo",
    lida: notificacaoBruta.lida === true,
    criadaEm:
      typeof notificacao.criadaEm === "string" && notificacao.criadaEm.trim()
        ? notificacao.criadaEm
        : new Date().toISOString(),
  };
}

function carregarObras(): ObraLocal[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const dados = localStorage.getItem(CHAVE_OBRAS);
    const obras = dados ? JSON.parse(dados) : [];

    if (!Array.isArray(obras)) {
      localStorage.setItem(CHAVE_OBRAS, JSON.stringify([]));
      return [];
    }

    const obrasNormalizadas = obras.map((obra, index) =>
      normalizarObra(obra, index)
    );

    localStorage.setItem(CHAVE_OBRAS, JSON.stringify(obrasNormalizadas));

    return obrasNormalizadas;
  } catch {
    localStorage.setItem(CHAVE_OBRAS, JSON.stringify([]));
    return [];
  }
}

function carregarNotificacoes(): NotificacaoLocal[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const dados = localStorage.getItem(CHAVE_NOTIFICACOES);
    const notificacoes = dados ? JSON.parse(dados) : [];

    if (!Array.isArray(notificacoes)) {
      localStorage.setItem(CHAVE_NOTIFICACOES, JSON.stringify([]));
      return [];
    }

    const notificacoesNormalizadas = notificacoes
      .map((notificacao, index) => normalizarNotificacao(notificacao, index))
      .sort((a, b) => dataNotificacao(b) - dataNotificacao(a));

    localStorage.setItem(
      CHAVE_NOTIFICACOES,
      JSON.stringify(notificacoesNormalizadas)
    );

    return notificacoesNormalizadas;
  } catch {
    localStorage.setItem(CHAVE_NOTIFICACOES, JSON.stringify([]));
    return [];
  }
}

function salvarNotificacoes(notificacoes: NotificacaoLocal[]) {
  localStorage.setItem(CHAVE_NOTIFICACOES, JSON.stringify(notificacoes));
}

function linkDiretoValido(link: string) {
  return link.startsWith("/") || link.startsWith("http://") || link.startsWith("https://");
}

function montarLinkNotificacao(notificacao: NotificacaoLocal) {
  const linkDireto = notificacao.link.trim();

  if (linkDireto && linkDiretoValido(linkDireto)) {
    return linkDireto;
  }

  if (notificacao.obraId && notificacao.capituloId) {
    return `/ler-capitulo?obraId=${encodeURIComponent(
      notificacao.obraId
    )}&capituloId=${encodeURIComponent(notificacao.capituloId)}`;
  }

  return "/biblioteca";
}


type SupabaseObraRow = Record<string, unknown>;
type SupabaseCapituloRow = Record<string, unknown>;

type EstadoSupabaseNotificacoes = {
  userId: string;
  obrasSeguidasIds: string[];
  notificacoesLidasIds: string[];
};

function pegarTexto(valor: unknown, fallback = "") {
  return typeof valor === "string" && valor.trim() ? valor.trim() : fallback;
}

function pegarBooleano(valor: unknown, fallback = false) {
  return typeof valor === "boolean" ? valor : fallback;
}

function pegarTagsSupabase(valor: unknown): string[] {
  if (Array.isArray(valor)) {
    const tags = valor
      .filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
      .map((tag) => tag.trim());

    return tags.length > 0 ? tags : ["sem tags"];
  }

  if (typeof valor === "string" && valor.trim()) {
    const tags = valor
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    return tags.length > 0 ? tags : ["sem tags"];
  }

  return ["sem tags"];
}

function normalizarObraSupabase(row: SupabaseObraRow, index: number): ObraLocal {
  const titulo = pegarTexto(row.titulo, `Obra ${index + 1}`);
  const slug = pegarTexto(row.slug, criarSlugBase(titulo));

  return {
    id: pegarTexto(row.id, `supabase-${index + 1}`),
    titulo,
    autor: pegarTexto(row.autor ?? row.nome_autor ?? row.autor_nome, "Autor não informado"),
    genero: pegarTexto(row.genero, "Não informado"),
    formato: pegarTexto(row.formato, "Não informado"),
    classificacaoIndicativa: pegarTexto(
      row.classificacao_indicativa ?? row.classificacaoIndicativa,
      "Não informada"
    ),
    sinopse: pegarTexto(row.sinopse, "Nenhuma sinopse informada."),
    tags: pegarTagsSupabase(row.tags),
    capa: pegarTexto(row.capa_url ?? row.capaUrl ?? row.capa, ""),
    capaNome: pegarTexto(row.capa_nome ?? row.capaNome, ""),
    publicado: pegarBooleano(row.publicado, false),
    capitulos: [],
    criadaEm: pegarTexto(row.created_at ?? row.criada_em ?? row.criadaEm, ""),
    ultimoCapituloLidoId: "",
    ultimaLeituraEm: "",
    progressoLeitura: 0,
    slug,
    link: `/obra/${slug}`,
  };
}

function normalizarCapituloSupabase(
  row: SupabaseCapituloRow,
  index: number
): CapituloLocal & { obraId: string } {
  return {
    id: pegarTexto(row.id, `capitulo-supabase-${index + 1}`),
    titulo: pegarTexto(row.titulo, `Capítulo ${index + 1}`),
    texto: pegarTexto(row.texto ?? row.conteudo, ""),
    curtiu: false,
    salvo: false,
    comentario: "",
    criadoEm: pegarTexto(row.created_at ?? row.criado_em ?? row.criadoEm, ""),
    lido: false,
    lidoEm: "",
    obraId: pegarTexto(row.obra_id ?? row.obraId, ""),
  };
}

function mesclarObrasPorIdSlug(obrasBase: ObraLocal[], obrasNovas: ObraLocal[]) {
  const mapa = new Map<string, ObraLocal>();

  [...obrasBase, ...obrasNovas].forEach((obra) => {
    const chave = obra.id || obra.slug || criarSlugBase(obra.titulo);
    const existente = mapa.get(chave);

    if (!existente) {
      mapa.set(chave, obra);
      return;
    }

    mapa.set(chave, {
      ...existente,
      ...obra,
      capitulos: obra.capitulos.length > 0 ? obra.capitulos : existente.capitulos,
      capa: obra.capa || existente.capa,
      capaNome: obra.capaNome || existente.capaNome,
      ultimoCapituloLidoId: obra.ultimoCapituloLidoId || existente.ultimoCapituloLidoId,
      ultimaLeituraEm: obra.ultimaLeituraEm || existente.ultimaLeituraEm,
      progressoLeitura:
        obra.capitulos.length > 0
          ? calcularProgressoLeitura(obra.capitulos)
          : existente.progressoLeitura,
    });
  });

  return Array.from(mapa.values());
}

function mesclarNotificacoes(
  notificacoesLocais: NotificacaoLocal[],
  notificacoesSupabase: NotificacaoLocal[]
) {
  const mapa = new Map<string, NotificacaoLocal>();

  notificacoesLocais.forEach((notificacao) => {
    mapa.set(notificacao.id, notificacao);
  });

  notificacoesSupabase.forEach((notificacao) => {
    const existente = mapa.get(notificacao.id);

    mapa.set(notificacao.id, {
      ...notificacao,
      lida: existente?.lida || notificacao.lida,
    });
  });

  return Array.from(mapa.values()).sort((a, b) => dataNotificacao(b) - dataNotificacao(a));
}

function lerIdsLocalStorage(chave: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const texto = localStorage.getItem(chave);
    const json = texto ? JSON.parse(texto) : [];

    return Array.isArray(json)
      ? json.filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
      : [];
  } catch {
    return [];
  }
}

async function carregarObrasPublicadasSupabase() {
  try {
    const { data: obrasData, error: obrasError } = await supabase
      .from("obras")
      .select("*")
      .eq("publicado", true)
      .order("criada_em", { ascending: false });

    if (obrasError || !Array.isArray(obrasData)) {
      return [];
    }

    const obrasSupabase = obrasData.map((obra, index) =>
      normalizarObraSupabase(obra as SupabaseObraRow, index)
    );

    const idsObras = obrasSupabase.map((obra) => obra.id).filter(Boolean);

    if (idsObras.length === 0) {
      return obrasSupabase;
    }

    try {
      const { data: capitulosData } = await supabase
        .from("capitulos")
        .select("*")
        .in("obra_id", idsObras)
        .order("ordem", { ascending: true });

      if (!Array.isArray(capitulosData)) {
        return obrasSupabase;
      }

      const capitulosPorObra = new Map<string, CapituloLocal[]>();

      capitulosData.forEach((capitulo, index) => {
        const capituloNormalizado = normalizarCapituloSupabase(
          capitulo as SupabaseCapituloRow,
          index
        );

        if (!capituloNormalizado.obraId) {
          return;
        }

        const capitulosAtuais = capitulosPorObra.get(capituloNormalizado.obraId) || [];
        const { obraId: _obraId, ...capituloSemObraId } = capituloNormalizado;
        void _obraId;

        capitulosPorObra.set(capituloNormalizado.obraId, [
          ...capitulosAtuais,
          capituloSemObraId,
        ]);
      });

      return obrasSupabase.map((obra) => {
        const capitulos = capitulosPorObra.get(obra.id) || [];

        return {
          ...obra,
          capitulos,
          progressoLeitura: calcularProgressoLeitura(capitulos),
        };
      });
    } catch {
      return obrasSupabase;
    }
  } catch {
    return [];
  }
}

async function carregarIdsTabelaUsuario(
  tabela: string,
  colunaId: string,
  userId: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from(tabela)
      .select(colunaId)
      .eq("user_id", userId);

    if (error || !Array.isArray(data)) {
      return [];
    }

    const ids: string[] = [];

    data.forEach((item: unknown) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return;
      }

      const registro = item as Record<string, unknown>;
      const id = pegarTexto(registro[colunaId]);

      if (id) {
        ids.push(id);
      }
    });

    return ids;
  } catch {
    return [];
  }
}

async function carregarNotificacoesLidasSupabase(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("notificacoes")
      .select("notificacao_id, id, lida")
      .eq("user_id", userId)
      .eq("lida", true);

    if (error || !Array.isArray(data)) {
      return [];
    }

    const ids: string[] = [];

    data.forEach((item: unknown) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return;
      }

      const registro = item as Record<string, unknown>;
      const id = pegarTexto(registro.notificacao_id ?? registro.id);

      if (id) {
        ids.push(id);
      }
    });

    return ids;
  } catch {
    return [];
  }
}

async function carregarEstadoSupabaseNotificacoes(): Promise<EstadoSupabaseNotificacoes | null> {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    if (!userId) {
      return null;
    }

    const [obrasSeguidasIds, notificacoesLidasIds] = await Promise.all([
      carregarIdsTabelaUsuario("seguindo_obras", "obra_id", userId),
      carregarNotificacoesLidasSupabase(userId),
    ]);

    return {
      userId,
      obrasSeguidasIds,
      notificacoesLidasIds,
    };
  } catch {
    return null;
  }
}

function criarChavesObraParaNotificacao(obra: ObraLocal) {
  return Array.from(
    new Set(
      [
        obra.id,
        obra.slug,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ].filter((chave) => Boolean(chave.trim()))
    )
  );
}

function obraEstaNaListaSeguida(obra: ObraLocal, idsSeguidos: Set<string>) {
  if (idsSeguidos.size === 0) {
    return true;
  }

  return criarChavesObraParaNotificacao(obra).some((chave) =>
    idsSeguidos.has(chave)
  );
}

function criarNotificacoesDeCapitulos(
  obrasParaCriar: ObraLocal[],
  obrasSeguidasIds: string[],
  notificacoesLidasIds: string[]
) {
  const idsSeguidos = new Set(
    obrasSeguidasIds
      .filter((id) => Boolean(id.trim()))
      .map((id) => id.trim())
  );
  const idsLidos = new Set(notificacoesLidasIds);
  const notificacoesCriadas: NotificacaoLocal[] = [];

  obrasParaCriar.forEach((obra) => {
    if (!obraEstaNaListaSeguida(obra, idsSeguidos)) {
      return;
    }

    obra.capitulos.forEach((capitulo) => {
      const id = `capitulo-${obra.id}-${capitulo.id}`;

      notificacoesCriadas.push({
        id,
        obraId: obra.id,
        capituloId: capitulo.id,
        link: `/ler-capitulo?obraId=${encodeURIComponent(obra.id)}&capituloId=${encodeURIComponent(
          capitulo.id
        )}`,
        titulo: "Novo capítulo publicado",
        mensagem: `${capitulo.titulo} chegou em ${obra.titulo}.`,
        tipo: "novo-capitulo",
        lida: idsLidos.has(id),
        criadaEm: capitulo.criadoEm || obra.criadaEm || new Date().toISOString(),
      });
    });
  });

  return notificacoesCriadas.sort((a, b) => dataNotificacao(b) - dataNotificacao(a));
}

async function sincronizarNotificacaoLidaSupabase(
  notificacao: NotificacaoLocal,
  lida: boolean
) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    if (!userId || !notificacao.id) {
      return;
    }

    await supabase.from("notificacoes").upsert(
      {
        user_id: userId,
        notificacao_id: notificacao.id,
        obra_id: notificacao.obraId || null,
        capitulo_id: notificacao.capituloId || null,
        titulo: notificacao.titulo,
        mensagem: notificacao.mensagem,
        link: montarLinkNotificacao(notificacao),
        tipo: notificacao.tipo,
        lida,
        created_at: notificacao.criadaEm,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,notificacao_id" }
    );
  } catch {
    // Se a tabela não existir ou a permissão falhar, o localStorage mantém funcionando.
  }
}

async function apagarNotificacaoSupabase(notificacao: NotificacaoLocal) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    if (!userId || !notificacao.id) {
      return;
    }

    await supabase
      .from("notificacoes")
      .delete()
      .eq("user_id", userId)
      .eq("notificacao_id", notificacao.id);
  } catch {
    // A remoção local continua funcionando se o Supabase falhar.
  }
}

export default function NotificacoesPage() {
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [notificacoes, setNotificacoes] = useState<NotificacaoLocal[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroNotificacao>("todas");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoNotificacao>("recentes");
  const [isDesktop, setIsDesktop] = useState(false);
  const [carregando, setCarregando] = useState(true);

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
    let componenteAtivo = true;

    async function carregarDados() {
      const obrasLocais = carregarObras();
      const notificacoesLocais = carregarNotificacoes();
      const obrasSupabase = await carregarObrasPublicadasSupabase();
      const estadoSupabase = await carregarEstadoSupabaseNotificacoes();
      const obrasMescladas = mesclarObrasPorIdSlug(obrasLocais, obrasSupabase);
      const obrasSeguidasLocais = lerIdsLocalStorage(CHAVE_OBRAS_SEGUIDAS);
      const obrasSeguidasIds = Array.from(
        new Set([
          ...obrasSeguidasLocais,
          ...(estadoSupabase?.obrasSeguidasIds || []),
        ])
      );
      const notificacoesSupabase = criarNotificacoesDeCapitulos(
        obrasMescladas,
        obrasSeguidasIds,
        estadoSupabase?.notificacoesLidasIds || []
      );
      const notificacoesMescladas = mesclarNotificacoes(
        notificacoesLocais,
        notificacoesSupabase
      );

      try {
        localStorage.setItem(CHAVE_OBRAS, JSON.stringify(obrasMescladas));
        salvarNotificacoes(notificacoesMescladas);
      } catch {
        // Se o navegador bloquear localStorage, a página continua com o estado em memória.
      }

      if (!componenteAtivo) {
        return;
      }

      setObras(obrasMescladas);
      setNotificacoes(notificacoesMescladas);
      setCarregando(false);
    }

    void carregarDados();

    return () => {
      componenteAtivo = false;
    };
  }, []);

  const obrasPorId = useMemo(() => {
    return new Map(obras.map((obra) => [obra.id, obra]));
  }, [obras]);

  const totalNotificacoes = notificacoes.length;

  const totalNaoLidas = useMemo(() => {
    return notificacoes.filter((notificacao) => !notificacao.lida).length;
  }, [notificacoes]);

  const totalLidas = Math.max(totalNotificacoes - totalNaoLidas, 0);
  const totalComObra = notificacoes.filter((notificacao) =>
    obrasPorId.has(notificacao.obraId)
  ).length;
  const totalSemObra = Math.max(totalNotificacoes - totalComObra, 0);
  const ultimaNotificacao = notificacoes[0]
    ? formatarData(notificacoes[0].criadaEm)
    : "Sem registros";
  const termoBusca = normalizarTexto(busca);

  const notificacoesFiltradas = useMemo(() => {
    const filtradas = notificacoes.filter((notificacao) => {
      const obra = obrasPorId.get(notificacao.obraId) || null;
      const capitulo =
        obra?.capitulos.find((item) => item.id === notificacao.capituloId) ||
        null;

      const passaFiltro =
        filtro === "todas" ||
        (filtro === "nao-lidas" && !notificacao.lida) ||
        (filtro === "lidas" && notificacao.lida) ||
        (filtro === "com-obra" && Boolean(obra)) ||
        (filtro === "sem-obra" && !obra);

      const textoBusca = normalizarTexto(
        [
          notificacao.titulo,
          notificacao.mensagem,
          notificacao.tipo,
          notificacao.link,
          obra?.titulo || "",
          obra?.autor || "",
          obra?.genero || "",
          obra?.formato || "",
          obra?.classificacaoIndicativa || "",
          capitulo?.titulo || "",
          formatarData(notificacao.criadaEm),
        ].join(" ")
      );

      const passaBusca = termoBusca ? textoBusca.includes(termoBusca) : true;

      return passaFiltro && passaBusca;
    });

    return [...filtradas].sort((notificacaoA, notificacaoB) => {
      const obraA = obrasPorId.get(notificacaoA.obraId) || null;
      const obraB = obrasPorId.get(notificacaoB.obraId) || null;
      const capituloA =
        obraA?.capitulos.find(
          (capitulo) => capitulo.id === notificacaoA.capituloId
        ) || null;
      const capituloB =
        obraB?.capitulos.find(
          (capitulo) => capitulo.id === notificacaoB.capituloId
        ) || null;

      if (ordenacao === "antigas") {
        return dataNotificacao(notificacaoA) - dataNotificacao(notificacaoB);
      }

      if (ordenacao === "obra") {
        return (obraA?.titulo || "zzz").localeCompare(obraB?.titulo || "zzz");
      }

      if (ordenacao === "capitulo") {
        return (capituloA?.titulo || "zzz").localeCompare(
          capituloB?.titulo || "zzz"
        );
      }

      return dataNotificacao(notificacaoB) - dataNotificacao(notificacaoA);
    });
  }, [notificacoes, obrasPorId, termoBusca, filtro, ordenacao]);

  const filtrosAtivos = Boolean(
    busca.trim() || filtro !== "todas" || ordenacao !== "recentes"
  );

  function encontrarObra(obraId: string) {
    return obrasPorId.get(obraId) || null;
  }

  function encontrarCapitulo(obraId: string, capituloId: string) {
    const obra = encontrarObra(obraId);

    if (!obra) {
      return null;
    }

    return obra.capitulos.find((capitulo) => capitulo.id === capituloId) || null;
  }

  function atualizarNotificacoes(novasNotificacoes: NotificacaoLocal[]) {
    setNotificacoes(novasNotificacoes);
    salvarNotificacoes(novasNotificacoes);
  }

  function marcarComoLida(id: string) {
    const notificacaoAtual = notificacoes.find((notificacao) => notificacao.id === id);
    const novasNotificacoes = notificacoes.map((notificacao) => {
      if (notificacao.id !== id) {
        return notificacao;
      }

      return {
        ...notificacao,
        lida: true,
      };
    });

    atualizarNotificacoes(novasNotificacoes);

    if (notificacaoAtual) {
      void sincronizarNotificacaoLidaSupabase(notificacaoAtual, true);
    }
  }

  function marcarComoNaoLida(id: string) {
    const notificacaoAtual = notificacoes.find((notificacao) => notificacao.id === id);
    const novasNotificacoes = notificacoes.map((notificacao) => {
      if (notificacao.id !== id) {
        return notificacao;
      }

      return {
        ...notificacao,
        lida: false,
      };
    });

    atualizarNotificacoes(novasNotificacoes);

    if (notificacaoAtual) {
      void sincronizarNotificacaoLidaSupabase(notificacaoAtual, false);
    }
  }

  function abrirNotificacao(id: string) {
    marcarComoLida(id);
  }

  function marcarTodasComoLidas() {
    const notificacoesParaSincronizar = notificacoes.filter(
      (notificacao) => !notificacao.lida
    );
    const novasNotificacoes = notificacoes.map((notificacao) => ({
      ...notificacao,
      lida: true,
    }));

    atualizarNotificacoes(novasNotificacoes);
    notificacoesParaSincronizar.forEach((notificacao) => {
      void sincronizarNotificacaoLidaSupabase(notificacao, true);
    });
  }

  function marcarFiltradasComoLidas() {
    const idsFiltrados = new Set(
      notificacoesFiltradas.map((notificacao) => notificacao.id)
    );
    const notificacoesParaSincronizar = notificacoes.filter((notificacao) => {
      return idsFiltrados.has(notificacao.id) && !notificacao.lida;
    });

    const novasNotificacoes = notificacoes.map((notificacao) => {
      if (!idsFiltrados.has(notificacao.id)) {
        return notificacao;
      }

      return {
        ...notificacao,
        lida: true,
      };
    });

    atualizarNotificacoes(novasNotificacoes);
    notificacoesParaSincronizar.forEach((notificacao) => {
      void sincronizarNotificacaoLidaSupabase(notificacao, true);
    });
  }

  function apagarNotificacao(id: string) {
    const notificacaoAtual = notificacoes.find((notificacao) => notificacao.id === id);
    const novasNotificacoes = notificacoes.filter((notificacao) => {
      return notificacao.id !== id;
    });

    atualizarNotificacoes(novasNotificacoes);

    if (notificacaoAtual) {
      void apagarNotificacaoSupabase(notificacaoAtual);
    }
  }

  function limparTodas() {
    const notificacoesParaApagar = [...notificacoes];

    atualizarNotificacoes([]);
    notificacoesParaApagar.forEach((notificacao) => {
      void apagarNotificacaoSupabase(notificacao);
    });
  }

  function limparLidas() {
    const notificacoesLidas = notificacoes.filter((notificacao) => notificacao.lida);
    const novasNotificacoes = notificacoes.filter(
      (notificacao) => !notificacao.lida
    );

    atualizarNotificacoes(novasNotificacoes);
    notificacoesLidas.forEach((notificacao) => {
      void apagarNotificacaoSupabase(notificacao);
    });
  }

  function limparFiltros() {
    setBusca("");
    setFiltro("todas");
    setOrdenacao("recentes");
  }

  if (carregando) {
    return (
      <main style={pageStyle}>
        <section style={isDesktop ? desktopContainerStyle : containerStyle} />
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTopStyle : topStyle}>
          <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
            <span style={logoMarkStyle}>H</span>
            <span style={logoTextStyle}>istorietas</span>
          </Link>

          <div style={topNotificationPillStyle} aria-label="Página de notificações">
            <span style={topNotificationIconStyle} aria-hidden="true">🔔</span>
            <span style={topNotificationTextStyle}>Notificações</span>
          </div>
        </header>

        <section style={isDesktop ? desktopHeroBoxStyle : heroBoxStyle}>
          <h1 style={isDesktop ? desktopTitleStyle : titleStyle}>Atualizações</h1>

          <p style={isDesktop ? desktopDescriptionStyle : descriptionStyle}>
            Acompanhe novos capítulos das obras seguidas e mantenha sua leitura organizada.
          </p>

          <div style={isDesktop ? desktopHeroMiniStatsStyle : heroMiniStatsStyle} aria-label="Status rápido das notificações">
            <span style={heroMiniStatHighlightStyle}>
              {totalNaoLidas} {totalNaoLidas === 1 ? "nova" : "novas"}
            </span>

            <span style={heroMiniStatStyle}>
              {totalLidas} {totalLidas === 1 ? "lida" : "lidas"}
            </span>
          </div>
        </section>

        <section style={isDesktop ? desktopStatsGridStyle : statsGridStyle} aria-label="Resumo das notificações">
          <div style={statCardStyle}>
            <span style={statLabelStyle}>Total</span>
            <strong style={statNumberStyle}>{totalNotificacoes}</strong>
          </div>

          <div style={unreadStatCardStyle}>
            <span style={statLabelStyle}>Não lidas</span>
            <strong style={statNumberStyle}>{totalNaoLidas}</strong>
          </div>

          <div style={readStatCardStyle}>
            <span style={statLabelStyle}>Lidas</span>
            <strong style={statNumberStyle}>{totalLidas}</strong>
          </div>

          <div style={statCardStyle}>
            <span style={statLabelStyle}>Com obra</span>
            <strong style={statNumberStyle}>{totalComObra}</strong>
          </div>

          <div style={statCardStyle}>
            <span style={statLabelStyle}>Sem obra</span>
            <strong style={statNumberStyle}>{totalSemObra}</strong>
          </div>

          <div style={statCardStyle}>
            <span style={statLabelStyle}>Última</span>
            <strong style={smallStatTextStyle}>{ultimaNotificacao}</strong>
          </div>
        </section>

        {totalNotificacoes > 0 && (
          <>
            <section style={isDesktop ? desktopFilterBoxStyle : filterBoxStyle}>
              <div style={isDesktop ? desktopFilterHeaderStyle : filterHeaderStyle}>
                <div style={{ minWidth: 0 }}>
                  <span style={miniTitleStyle}>ORGANIZAR</span>

                  <h2 style={filterTitleStyle}>Buscar e filtrar</h2>
                </div>

                <span style={filterResultBadgeStyle}>
                  {notificacoesFiltradas.length} de {totalNotificacoes}
                </span>
              </div>

              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por obra, capítulo ou mensagem..."
                style={isDesktop ? desktopSearchInputStyle : searchInputStyle}
                type="text"
              />

              <div style={isDesktop ? desktopQuickFiltersStyle : quickFiltersStyle}>
                <button
                  type="button"
                  onClick={() => setFiltro("todas")}
                  style={
                    filtro === "todas"
                      ? quickFilterActiveStyle
                      : quickFilterStyle
                  }
                >
                  Todas
                </button>

                <button
                  type="button"
                  onClick={() => setFiltro("nao-lidas")}
                  style={
                    filtro === "nao-lidas"
                      ? quickFilterActiveStyle
                      : quickFilterStyle
                  }
                >
                  Não lidas
                </button>

                <button
                  type="button"
                  onClick={() => setFiltro("lidas")}
                  style={
                    filtro === "lidas"
                      ? quickFilterActiveStyle
                      : quickFilterStyle
                  }
                >
                  Lidas
                </button>

                <button
                  type="button"
                  onClick={() => setFiltro("com-obra")}
                  style={
                    filtro === "com-obra"
                      ? quickFilterActiveStyle
                      : quickFilterStyle
                  }
                >
                  Com obra
                </button>

                <button
                  type="button"
                  onClick={() => setFiltro("sem-obra")}
                  style={
                    filtro === "sem-obra"
                      ? quickFilterActiveStyle
                      : quickFilterStyle
                  }
                >
                  Sem obra
                </button>
              </div>

              <div style={isDesktop ? desktopFilterFooterStyle : filterFooterStyle}>
                <label style={fieldLabelStyle}>Ordenar</label>

                <select
                  value={ordenacao}
                  onChange={(event) =>
                    setOrdenacao(event.target.value as OrdenacaoNotificacao)
                  }
                  style={selectStyle}
                >
                  <option value="recentes">Mais recentes</option>
                  <option value="antigas">Mais antigas</option>
                  <option value="obra">Nome da obra</option>
                  <option value="capitulo">Nome do capítulo</option>
                </select>

                {filtrosAtivos && (
                  <button
                    type="button"
                    onClick={limparFiltros}
                    style={secondaryButtonStyle}
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            </section>

            <section style={isDesktop ? desktopActionBarStyle : actionBarStyle} aria-label="Ações gerais">
              <button
                type="button"
                onClick={marcarTodasComoLidas}
                style={primaryButtonStyle}
                disabled={notificacoes.length === 0}
              >
                Marcar todas como lidas
              </button>

              <button
                type="button"
                onClick={marcarFiltradasComoLidas}
                style={secondaryButtonStyle}
                disabled={notificacoesFiltradas.length === 0}
              >
                Marcar filtradas
              </button>

              <button
                type="button"
                onClick={limparLidas}
                style={secondaryButtonStyle}
                disabled={totalLidas === 0}
              >
                Apagar lidas
              </button>

              <button
                type="button"
                onClick={limparTodas}
                style={dangerButtonStyle}
                disabled={notificacoes.length === 0}
              >
                Limpar todas
              </button>
            </section>
          </>
        )}

        {notificacoes.length === 0 ? (
          <section style={isDesktop ? desktopEmptyStyle : emptyStyle}>
            <span style={emptyIconStyle}>🔔</span>

            <h2 style={emptyTitleStyle}>Nenhuma notificação</h2>

            <p style={emptyTextStyle}>
              Quando uma obra seguida receber capítulo novo, o aviso aparece aqui.
            </p>

            <Link href="/seguindo" style={emptyButtonStyle}>
              Ver obras seguidas
            </Link>
          </section>
        ) : notificacoesFiltradas.length === 0 ? (
          <section style={isDesktop ? desktopEmptyStyle : emptyStyle}>
            <span style={emptyIconStyle}>⌕</span>

            <h2 style={emptyTitleStyle}>Nada encontrado</h2>

            <p style={emptyTextStyle}>
              Limpe a busca ou escolha outro filtro para ver suas notificações.
            </p>

            <button type="button" onClick={limparFiltros} style={emptyButtonStyle}>
              Limpar filtros
            </button>
          </section>
        ) : (
          <section style={isDesktop ? desktopListStyle : listStyle} aria-label="Lista de notificações">
            {notificacoesFiltradas.map((notificacao) => {
              const obra = encontrarObra(notificacao.obraId);
              const capitulo = encontrarCapitulo(
                notificacao.obraId,
                notificacao.capituloId
              );

              const tituloObra = obra?.titulo || "Obra não encontrada";
              const tituloCapitulo =
                capitulo?.titulo || "Capítulo não encontrado";

              const linkCapitulo = montarLinkNotificacao(notificacao);

              return (
                <article
                  key={notificacao.id}
                  style={
                    notificacao.lida
                      ? isDesktop
                        ? desktopReadCardStyle
                        : readCardStyle
                      : isDesktop
                        ? desktopCardStyle
                        : cardStyle
                  }
                >
                  <div style={cardHeaderStyle}>
                    <div
                      style={
                        notificacao.lida
                          ? readNotificationIconStyle
                          : notificationIconStyle
                      }
                      aria-hidden="true"
                    >
                      {notificacao.lida ? "✓" : "!"}
                    </div>

                    <div style={cardHeaderTextStyle}>
                      <span
                        style={
                          notificacao.lida ? readBadgeStyle : unreadBadgeStyle
                        }
                      >
                        {notificacao.lida ? "LIDA" : "NÃO LIDA"}
                      </span>

                      <h2 style={notificationTitleStyle}>
                        {notificacao.titulo}
                      </h2>

                      <p style={notificationMessageStyle}>
                        {notificacao.mensagem}
                      </p>
                    </div>
                  </div>

                  <div style={isDesktop ? desktopMetaGridStyle : metaGridStyle}>
                    <div style={metaBoxStyle}>
                      <span style={metaLabelStyle}>Obra</span>
                      <strong style={metaValueStyle}>{tituloObra}</strong>
                    </div>

                    <div style={metaBoxStyle}>
                      <span style={metaLabelStyle}>Capítulo</span>
                      <strong style={metaValueStyle}>{tituloCapitulo}</strong>
                    </div>

                    <div style={metaBoxStyle}>
                      <span style={metaLabelStyle}>Data</span>
                      <strong style={metaValueStyle}>
                        {formatarData(notificacao.criadaEm)}
                      </strong>
                    </div>
                  </div>

                  <div style={isDesktop ? desktopCardActionsStyle : cardActionsStyle}>
                    <Link
                      href={linkCapitulo}
                      style={openChapterLinkStyle}
                      onClick={() => abrirNotificacao(notificacao.id)}
                    >
                      Abrir capítulo
                    </Link>

                    {obra && (
                      <Link
                        href={`/obra/${obra.slug || criarSlugBase(obra.titulo)}`}
                        style={secondaryLinkButtonStyle}
                      >
                        Abrir obra
                      </Link>
                    )}

                    {notificacao.lida ? (
                      <button
                        type="button"
                        onClick={() => marcarComoNaoLida(notificacao.id)}
                        style={secondaryButtonStyle}
                      >
                        Marcar não lida
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => marcarComoLida(notificacao.id)}
                        style={secondaryButtonStyle}
                      >
                        Marcar como lida
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => apagarNotificacao(notificacao.id)}
                      style={dangerButtonStyle}
                    >
                      Apagar
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </section>
    </main>
  );
}

const safeTextStyle: CSSProperties = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background:
    "radial-gradient(circle at 12% 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent), transparent 31%), radial-gradient(circle at 88% 14%, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent), transparent 24%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 42%, var(--historietas-bg-end, #17101B) 100%)",
  color: "#FFFFFF",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  width: "min(860px, calc(100% - 32px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "18px 0 58px",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "nowrap",
  marginBottom: "12px",
  minWidth: 0,
  maxWidth: "100%",
};

const topActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "6px",
  width: "100%",
  minWidth: 0,
};

const desktopTopActionsStyle: CSSProperties = {
  ...topActionsStyle,
  display: "flex",
  width: "auto",
  justifyContent: "flex-end",
  flex: "0 0 auto",
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
  maxWidth: "calc(100% - 126px)",
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
  background: "linear-gradient(135deg, #F5F3FF 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 35%, #FFFFFF) 42%, var(--historietas-accent, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "0 0 26px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, transparent)",
};


const topNotificationPillStyle: CSSProperties = {
  minHeight: "34px",
  padding: "0 11px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  background: "rgba(255,255,255,0.075)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#F5F3FF",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "-0.01em",
  lineHeight: 1,
  flex: "0 0 auto",
  boxSizing: "border-box",
};

const topNotificationIconStyle: CSSProperties = {
  fontSize: "15px",
  lineHeight: 1,
};

const topNotificationTextStyle: CSSProperties = {
  display: "inline-block",
  maxWidth: "96px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const topButtonStyle: CSSProperties = {
  minHeight: "40px",
  padding: "0 14px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  ...safeTextStyle,
};

const heroBoxStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  textAlign: "center",
  gap: "7px",
  padding: "14px 14px 13px",
  borderRadius: "22px",
  background:
    "radial-gradient(circle at 14% 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent), transparent 34%), radial-gradient(circle at 88% 12%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent), transparent 38%), linear-gradient(135deg, rgba(31,16,52,0.96) 0%, rgba(12,7,23,0.99) 100%)",
  border: "1px solid rgba(251,191,36,0.18)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const badgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  display: "inline-flex",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const titleStyle: CSSProperties = {
  margin: 0,
  justifySelf: "center",
  textAlign: "center",
  fontSize: "clamp(34px, 9.4vw, 54px)",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.07em",
  maxWidth: "100%",
  paddingBottom: "2px",
  background: "linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 45%, var(--historietas-accent, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  justifySelf: "center",
  textAlign: "center",
  color: "#D4D4D8",
  fontSize: "12.5px",
  lineHeight: 1.48,
  fontWeight: 650,
  maxWidth: "330px",
  ...safeTextStyle,
};

const heroMiniStatsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  justifySelf: "center",
  gap: "8px",
  flexWrap: "wrap",
  minWidth: 0,
  maxWidth: "100%",
};

const heroMiniStatStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#E4E4E7",
  fontSize: "10.5px",
  fontWeight: 950,
  ...safeTextStyle,
};

const heroMiniStatHighlightStyle: CSSProperties = {
  ...heroMiniStatStyle,
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
};

const statsGridStyle: CSSProperties = {
  marginTop: "14px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const statCardStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  borderRadius: "18px",
  padding: "11px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.060), rgba(255,255,255,0.034))",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 14px 34px rgba(0,0,0,0.18)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const unreadStatCardStyle: CSSProperties = {
  ...statCardStyle,
  background:
    "radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 22%, transparent), transparent 55%), linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent), color-mix(in srgb, var(--historietas-secondary, #7C3AED) 6%, transparent))",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)",
  boxShadow: "0 16px 38px color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent), 0 14px 34px rgba(0,0,0,0.18)",
};

const readStatCardStyle: CSSProperties = {
  ...statCardStyle,
  background:
    "linear-gradient(135deg, rgba(34,197,94,0.075), rgba(255,255,255,0.034))",
  border: "1px solid rgba(34,197,94,0.12)",
};

const statLabelStyle: CSSProperties = {
  color: "#A1A1AA",
  fontSize: "10px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  ...safeTextStyle,
};

const statNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "24px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

const smallStatTextStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "14px",
  lineHeight: 1.15,
  fontWeight: 950,
  ...safeTextStyle,
};

const filterBoxStyle: CSSProperties = {
  marginTop: "12px",
  display: "grid",
  gap: "10px",
  padding: "12px",
  borderRadius: "22px",
  background:
    "radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, transparent), transparent 42%), rgba(18,12,30,0.82)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 14px 36px rgba(0,0,0,0.20)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const filterHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "wrap",
  minWidth: 0,
};

const miniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const filterTitleStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "#FFFFFF",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

const filterResultBadgeStyle: CSSProperties = {
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

const searchInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "#18181B",
  color: "#FFFFFF",
  padding: "0 13px",
  outline: "none",
  fontSize: "12px",
  fontWeight: 750,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
};

const quickFiltersStyle: CSSProperties = {
  display: "flex",
  gap: "6px",
  flexWrap: "wrap",
  minWidth: 0,
};

const quickFilterStyle: CSSProperties = {
  minHeight: "32px",
  padding: "0 9px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.065)",
  color: "#D4D4D8",
  fontSize: "10px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  ...safeTextStyle,
};

const quickFilterActiveStyle: CSSProperties = {
  ...quickFilterStyle,
  background: "var(--historietas-accent, #F97316)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 60%, transparent)",
  color: "#FFFFFF",
  boxShadow: "0 10px 24px color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent)",
};

const filterFooterStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const fieldLabelStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const selectStyle: CSSProperties = {
  width: "100%",
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "#18181B",
  color: "#FFFFFF",
  padding: "0 13px",
  outline: "none",
  fontSize: "12px",
  fontWeight: 850,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
};

const actionBarStyle: CSSProperties = {
  marginTop: "12px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 168px), 1fr))",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

const buttonBaseStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  padding: "0 12px",
  color: "#FFFFFF",
  fontWeight: 900,
  fontSize: "12px",
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  maxWidth: "100%",
  WebkitTapHighlightColor: "transparent",
  ...safeTextStyle,
};

const primaryButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  border: "none",
  background: "var(--historietas-accent, #F97316)",
  boxShadow: "0 10px 26px color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent)",
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.11)",
};

const secondaryLinkButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
};

const dangerButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  border: "1px solid rgba(239, 68, 68, 0.24)",
  background: "rgba(239, 68, 68, 0.13)",
  color: "#FCA5A5",
};

const listStyle: CSSProperties = {
  marginTop: "12px",
  display: "grid",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
};

const cardStyle: CSSProperties = {
  position: "relative",
  borderRadius: "22px",
  padding: "12px",
  background:
    "radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent), transparent 36%), linear-gradient(135deg, rgba(31,16,52,0.90), rgba(18,12,30,0.96))",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)",
  boxShadow: "0 18px 42px rgba(0,0,0,0.26), 0 0 24px color-mix(in srgb, var(--historietas-accent, #F97316) 6%, transparent)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const readCardStyle: CSSProperties = {
  ...cardStyle,
  background:
    "linear-gradient(135deg, rgba(31,16,52,0.64), rgba(18,12,30,0.78))",
  border: "1px solid rgba(34,197,94,0.12)",
  boxShadow: "0 10px 26px rgba(0,0,0,0.16)",
};

const cardHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr)",
  alignItems: "start",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
};

const notificationIconStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent), color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent))",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  color: "#FFFFFF",
  fontSize: "22px",
  fontWeight: 950,
  boxShadow: "0 12px 28px color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  flex: "0 0 auto",
};

const readNotificationIconStyle: CSSProperties = {
  ...notificationIconStyle,
  background: "rgba(34,197,94,0.12)",
  border: "1px solid rgba(34,197,94,0.18)",
  color: "#86EFAC",
  boxShadow: "none",
};

const cardHeaderTextStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
};

const notificationTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "22px",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.05em",
  ...safeTextStyle,
};

const notificationMessageStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  fontSize: "12px",
  lineHeight: 1.55,
  fontWeight: 650,
  ...safeTextStyle,
};

const unreadBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 32%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "9px",
  fontWeight: 950,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  boxShadow: "0 8px 18px color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)",
  ...safeTextStyle,
};

const readBadgeStyle: CSSProperties = {
  ...unreadBadgeStyle,
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(34, 197, 94, 0.24)",
  color: "#86EFAC",
};

const metaGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
  gap: "7px",
  marginTop: "10px",
  minWidth: 0,
  maxWidth: "100%",
};

const metaBoxStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  borderRadius: "15px",
  padding: "9px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.07)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const metaLabelStyle: CSSProperties = {
  color: "#A1A1AA",
  fontSize: "9px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  ...safeTextStyle,
};

const metaValueStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 900,
  ...safeTextStyle,
};

const cardActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
  gap: "7px",
  marginTop: "10px",
  minWidth: 0,
  maxWidth: "100%",
};

const openChapterLinkStyle: CSSProperties = {
  ...primaryButtonStyle,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
};

const emptyStyle: CSSProperties = {
  marginTop: "12px",
  borderRadius: "24px",
  padding: "24px 18px",
  background: "rgba(18,12,30,0.82)",
  border: "1px dashed rgba(255,255,255,0.14)",
  textAlign: "center",
  display: "grid",
  justifyItems: "center",
  gap: "9px",
  minWidth: 0,
  overflow: "hidden",
};

const emptyIconStyle: CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, transparent)",
  fontSize: "22px",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "28px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: "#A1A1AA",
  fontSize: "12px",
  lineHeight: 1.55,
  fontWeight: 700,
  maxWidth: "320px",
  ...safeTextStyle,
};

const emptyButtonStyle: CSSProperties = {
  minHeight: "42px",
  padding: "0 14px",
  borderRadius: "999px",
  border: "none",
  background: "var(--historietas-secondary, #7C3AED)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  ...safeTextStyle,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "24px 0 78px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "16px",
};

const desktopHeroBoxStyle: CSSProperties = {
  ...heroBoxStyle,
  justifyItems: "center",
  alignContent: "center",
  textAlign: "center",
  gap: "10px",
  padding: "28px 26px 26px",
  borderRadius: "30px",
  minHeight: "184px",
};

const desktopBadgeStyle: CSSProperties = {
  ...badgeStyle,
  justifySelf: "center",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  justifySelf: "center",
  textAlign: "center",
  fontSize: "clamp(50px, 5vw, 70px)",
  lineHeight: 1.06,
  maxWidth: "780px",
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  justifySelf: "center",
  textAlign: "center",
  maxWidth: "650px",
  fontSize: "14px",
  lineHeight: 1.6,
};

const desktopHeroMiniStatsStyle: CSSProperties = {
  ...heroMiniStatsStyle,
  justifyContent: "center",
  justifySelf: "center",
  gap: "10px",
  marginTop: "2px",
};

const desktopStatsGridStyle: CSSProperties = {
  ...statsGridStyle,
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: "12px",
  marginTop: "16px",
};

const desktopFilterBoxStyle: CSSProperties = {
  ...filterBoxStyle,
  padding: "16px",
  borderRadius: "24px",
  gap: "12px",
};

const desktopFilterHeaderStyle: CSSProperties = {
  ...filterHeaderStyle,
  flexWrap: "nowrap",
};

const desktopSearchInputStyle: CSSProperties = {
  ...searchInputStyle,
  minHeight: "44px",
  fontSize: "13px",
};

const desktopQuickFiltersStyle: CSSProperties = {
  ...quickFiltersStyle,
  gap: "8px",
};

const desktopFilterFooterStyle: CSSProperties = {
  ...filterFooterStyle,
  gridTemplateColumns: "auto minmax(220px, 280px) auto",
  alignItems: "center",
  justifyContent: "start",
  gap: "10px",
};

const desktopActionBarStyle: CSSProperties = {
  ...actionBarStyle,
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "10px",
};

const desktopListStyle: CSSProperties = {
  ...listStyle,
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 430px), 1fr))",
  gap: "14px",
  alignItems: "stretch",
};

const desktopCardStyle: CSSProperties = {
  ...cardStyle,
  padding: "14px",
  borderRadius: "24px",
};

const desktopReadCardStyle: CSSProperties = {
  ...readCardStyle,
  padding: "14px",
  borderRadius: "24px",
};

const desktopMetaGridStyle: CSSProperties = {
  ...metaGridStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "8px",
};

const desktopCardActionsStyle: CSSProperties = {
  ...cardActionsStyle,
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "8px",
};

const desktopEmptyStyle: CSSProperties = {
  ...emptyStyle,
  minHeight: "360px",
  padding: "34px",
};

