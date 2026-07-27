"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "../../lib/supabase/client";
import { criarSlugBase, normalizarTexto } from "../../lib/utils";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import {
  carregarPermissoesAbasPerfil,
  carregarPreferenciasPrivacidade,
  type PermissoesAbasPerfil,
} from "../../lib/historietasPrivacy";

type ModoLista = "perfil" | "obras" | "autores";
type OrigemPerfil = "diario" | "biblioteca";
type CategoriaPerfil =
  | "tudo"
  | "lendo"
  | "quero-ler"
  | "favoritas"
  | "concluidas"
  | "avaliacoes"
  | "historico";
type OrdenacaoLista = "recentes" | "titulo" | "avaliacao" | "popularidade";

type CapituloLista = {
  id: string;
  obraId: string;
  titulo: string;
  ordem: number;
  criadoEm: string;
};

type ObraLista = {
  id: string;
  autorId: string;
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  capa: string;
  slug: string;
  link: string;
  publicadaEm: string;
  visualizacoes: number;
  totalCurtidas: number;
  totalComentarios: number;
  capitulos: CapituloLista[];
  notaMedia: number;
  totalAvaliacoes: number;
};

type PerfilLista = {
  userId: string;
  nome: string;
  username: string;
  avatar: string;
  bio: string;
};

type ItemObraLista = {
  chave: string;
  obra: ObraLista;
  categorias: CategoriaPerfil[];
  data: string;
  nota: number;
  progresso: number;
  capituloAtual: string;
};

type AutorLista = {
  id: string;
  nome: string;
  username: string;
  avatar: string;
  bio: string;
  totalObras: number;
  totalCurtidas: number;
  totalComentarios: number;
  notaMedia: number;
  totalAvaliacoes: number;
  generos: string[];
  criadaEm: string;
};

type ListasPerfilEstado = Record<CategoriaPerfil, ItemObraLista[]>;

type RegistroGenerico = Record<string, unknown>;

const LISTAS_PERFIL_VAZIAS: ListasPerfilEstado = {
  tudo: [],
  lendo: [],
  "quero-ler": [],
  favoritas: [],
  concluidas: [],
  avaliacoes: [],
  historico: [],
};

const PERMISSOES_PROPRIO_PERFIL: PermissoesAbasPerfil = {
  obras: true,
  sobre: true,
  diario: true,
  comunidade: true,
  biblioteca: true,
  atividades: true,
};

const CATEGORIAS_PERFIL: Array<{
  valor: CategoriaPerfil;
  rotulo: string;
}> = [
  { valor: "tudo", rotulo: "Tudo" },
  { valor: "lendo", rotulo: "Lendo" },
  { valor: "quero-ler", rotulo: "Quero ler" },
  { valor: "favoritas", rotulo: "Favoritas" },
  { valor: "concluidas", rotulo: "Concluídas" },
  { valor: "avaliacoes", rotulo: "Avaliações" },
  { valor: "historico", rotulo: "Histórico" },
];

const LIBRARY_FOLLOW_STORAGE_KEY = "historietas-obras-seguidas";

const CAMPOS_OBRAS =
  "id,user_id,titulo,autor,genero,formato,capa_url,publicado,visualizacoes,slug,criada_em";

function pegarTexto(valor: unknown, fallback = "") {
  return typeof valor === "string" && valor.trim() ? valor.trim() : fallback;
}

function pegarNumero(valor: unknown, fallback = 0) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return valor;
  }

  if (typeof valor === "string" && valor.trim()) {
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));

    if (Number.isFinite(numero)) {
      return numero;
    }
  }

  return fallback;
}

function idUsuarioValido(valor: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    valor.trim(),
  );
}

function criarStorageKeyUsuarioListas(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

function normalizarListaIdsListas(valor: unknown) {
  return Array.isArray(valor)
    ? valor.filter(
        (id): id is string => typeof id === "string" && Boolean(id.trim()),
      )
    : [];
}

function carregarListaIdsListas(chave: string, userId = "") {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return [] as string[];
  }

  try {
    const chaveParaLer = criarStorageKeyUsuarioListas(chave, userIdLimpo);
    const listaTexto = localStorage.getItem(chaveParaLer);
    const lista = normalizarListaIdsListas(
      listaTexto ? JSON.parse(listaTexto) : [],
    );

    return Array.from(new Set(lista));
  } catch {
    return [] as string[];
  }
}

function salvarListaIdsListas(
  chave: string,
  userId: string,
  lista: string[],
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    localStorage.setItem(
      criarStorageKeyUsuarioListas(chave, userIdLimpo),
      JSON.stringify(Array.from(new Set(normalizarListaIdsListas(lista)))),
    );
  } catch {
    // O estado em memória continua funcionando caso o navegador bloqueie o storage.
  }
}

function obterIdentificadoresObraListas(
  obra: Pick<ObraLista, "id" | "slug" | "titulo">,
) {
  return Array.from(
    new Set(
      [
        obra.id,
        obra.slug,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ].filter(
        (valor): valor is string =>
          typeof valor === "string" && Boolean(valor.trim()),
      ),
    ),
  );
}

function colecaoTemObraListas(
  colecao: string[],
  obra: Pick<ObraLista, "id" | "slug" | "titulo">,
) {
  const idsColecao = new Set(
    colecao.filter((id): id is string => typeof id === "string"),
  );

  return obterIdentificadoresObraListas(obra).some((identificador) =>
    idsColecao.has(identificador),
  );
}

function removerObraDaColecaoListas(
  colecao: string[],
  obra: Pick<ObraLista, "id" | "slug" | "titulo">,
) {
  const identificadores = new Set(obterIdentificadoresObraListas(obra));

  return colecao.filter((id) => !identificadores.has(id));
}

function criarLoginHrefListas() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/listas";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/listas";

  return `/login?${new URLSearchParams({ redirectTo: destinoSeguro }).toString()}`;
}

async function sincronizarQueroLerListas(
  userId: string,
  obraId: string,
  ativo: boolean,
) {
  try {
    if (!userId.trim() || !obraId.trim()) {
      return;
    }

    const { error: erroDelete } = await supabase
      .from("seguindo_obras")
      .delete()
      .eq("user_id", userId)
      .eq("obra_id", obraId);

    if (erroDelete) {
      throw erroDelete;
    }

    if (!ativo) {
      return;
    }

    const payloadBase = {
      user_id: userId,
      obra_id: obraId,
    };

    const { error: erroComVisibilidade } = await supabase
      .from("seguindo_obras")
      .insert({
        ...payloadBase,
        visibilidade: "publico",
      });

    if (!erroComVisibilidade) {
      return;
    }

    const { error: erroSemVisibilidade } = await supabase
      .from("seguindo_obras")
      .insert(payloadBase);

    if (erroSemVisibilidade) {
      throw erroSemVisibilidade;
    }
  } catch (error) {
    console.warn("Não consegui sincronizar Quero ler na Lista Page:", error);
    // Assim como no perfil, a ação local permanece funcionando.
  }
}

function normalizarModoLista(valor: string | null): ModoLista {
  return valor === "perfil" || valor === "autores" ? valor : "obras";
}

function normalizarOrigemPerfil(valor: string | null): OrigemPerfil {
  return valor === "biblioteca" ? "biblioteca" : "diario";
}

function normalizarCategoriaPerfil(valor: string | null): CategoriaPerfil {
  return valor === "lendo" ||
    valor === "quero-ler" ||
    valor === "favoritas" ||
    valor === "concluidas" ||
    valor === "avaliacoes" ||
    valor === "historico" ||
    valor === "tudo"
    ? valor
    : "tudo";
}

function normalizarOrdenacao(valor: string | null): OrdenacaoLista {
  return valor === "titulo" ||
    valor === "avaliacao" ||
    valor === "popularidade"
    ? valor
    : "recentes";
}

function timestampData(data: string) {
  const timestamp = new Date(data).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatarDataCurta(data: string) {
  const timestamp = timestampData(data);

  if (!timestamp) {
    return "Data não informada";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(timestamp))
    .replace(" de ", " ")
    .replace(" de ", " ");
}

function formatarMesAno(data: string) {
  const timestamp = timestampData(data);

  if (!timestamp) {
    return "SEM DATA";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  })
    .format(new Date(timestamp))
    .toLocaleUpperCase("pt-BR");
}

function compactarNumero(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: valor >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(Math.max(0, valor));
}

function criarObraLista(row: RegistroGenerico, index: number): ObraLista {
  const titulo = pegarTexto(row.titulo, `Obra ${index + 1}`);
  const slug = pegarTexto(row.slug, criarSlugBase(titulo));

  return {
    id: pegarTexto(row.id, `obra-${index + 1}`),
    autorId: pegarTexto(row.user_id ?? row.autor_id),
    titulo,
    autor: pegarTexto(row.autor, "Autor não informado"),
    genero: pegarTexto(row.genero, "Não informado"),
    formato: pegarTexto(row.formato, "Não informado"),
    capa: pegarTexto(row.capa_url ?? row.capa),
    slug,
    link: `/obra/${slug}`,
    publicadaEm: pegarTexto(row.criada_em ?? row.created_at),
    visualizacoes: Math.max(0, Math.round(pegarNumero(row.visualizacoes))),
    totalCurtidas: 0,
    totalComentarios: 0,
    capitulos: [],
    notaMedia: 0,
    totalAvaliacoes: 0,
  };
}

function criarPerfilLista(
  row: RegistroGenerico | null,
  userId: string,
  nomeFallback: string,
): PerfilLista {
  return {
    userId,
    nome:
      pegarTexto(row?.nome) ||
      pegarTexto(row?.display_name) ||
      nomeFallback.trim() ||
      "Usuário",
    username: pegarTexto(row?.username).replace(/^@+/, ""),
    avatar: pegarTexto(row?.avatar_url ?? row?.avatar),
    bio: pegarTexto(row?.bio ?? row?.sobre_bio, "Perfil no Historietas."),
  };
}

async function carregarPerfil(userId: string, nomeFallback = "") {
  if (!idUsuarioValido(userId)) {
    return criarPerfilLista(null, userId, nomeFallback);
  }

  const selecoes = [
    "id,user_id,nome,username,avatar_url,bio,sobre_bio",
    "id,user_id,nome,avatar_url,bio,sobre_bio",
    "id,user_id,nome,avatar_url,bio",
  ];

  for (const campo of ["user_id", "id"] as const) {
    for (const selecao of selecoes) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(selecao)
          .eq(campo, userId)
          .limit(1)
          .maybeSingle();

        if (!error && data && typeof data === "object" && !Array.isArray(data)) {
          return criarPerfilLista(
            data as unknown as RegistroGenerico,
            userId,
            nomeFallback,
          );
        }
      } catch {
        // Tenta uma seleção compatível com versões anteriores da tabela.
      }
    }
  }

  return criarPerfilLista(null, userId, nomeFallback);
}

async function carregarCapitulosDasObras(obras: ObraLista[]) {
  const ids = Array.from(new Set(obras.map((obra) => obra.id).filter(Boolean)));

  if (ids.length === 0) {
    return obras;
  }

  const capitulosPorObra = new Map<string, CapituloLista[]>();
  const tamanhoChunk = 100;

  for (let inicio = 0; inicio < ids.length; inicio += tamanhoChunk) {
    const chunk = ids.slice(inicio, inicio + tamanhoChunk);

    try {
      const { data, error } = await supabase
        .from("capitulos")
        .select("id,obra_id,titulo,ordem,publicado,criado_em")
        .in("obra_id", chunk)
        .eq("publicado", true)
        .order("ordem", { ascending: true })
        .limit(Math.max(chunk.length * 80, 100));

      if (error || !Array.isArray(data)) {
        continue;
      }

      data.forEach((registro, index) => {
        if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
          return;
        }

        const row = registro as RegistroGenerico;
        const obraId = pegarTexto(row.obra_id);

        if (!obraId) {
          return;
        }

        const atuais = capitulosPorObra.get(obraId) || [];
        atuais.push({
          id: pegarTexto(row.id, `capitulo-${obraId}-${index + 1}`),
          obraId,
          titulo: pegarTexto(row.titulo, `Capítulo ${index + 1}`),
          ordem: Math.max(1, Math.round(pegarNumero(row.ordem, index + 1))),
          criadoEm: pegarTexto(row.criado_em ?? row.created_at),
        });
        capitulosPorObra.set(obraId, atuais);
      });
    } catch {
      // A lista continua funcionando mesmo sem os capítulos.
    }
  }

  return obras.map((obra) => ({
    ...obra,
    capitulos: capitulosPorObra.get(obra.id) || [],
  }));
}

function separarEmLotes<T>(itens: T[], tamanho = 400) {
  const lotes: T[][] = [];

  for (let indice = 0; indice < itens.length; indice += tamanho) {
    lotes.push(itens.slice(indice, indice + tamanho));
  }

  return lotes;
}

function adicionarUsuarioUnico(
  usuariosPorChave: Map<string, Set<string>>,
  chave: string,
  userId: string,
) {
  const chaveLimpa = chave.trim();
  const userIdLimpo = userId.trim();

  if (!chaveLimpa || !userIdLimpo) {
    return;
  }

  const usuarios = usuariosPorChave.get(chaveLimpa) || new Set<string>();
  usuarios.add(userIdLimpo);
  usuariosPorChave.set(chaveLimpa, usuarios);
}

function combinarUsuariosPorChave(
  ...fontes: Map<string, Set<string>>[]
) {
  const usuariosCombinados = new Map<string, Set<string>>();

  fontes.forEach((fonte) => {
    fonte.forEach((usuarios, chave) => {
      usuarios.forEach((userId) =>
        adicionarUsuarioUnico(usuariosCombinados, chave, userId),
      );
    });
  });

  return usuariosCombinados;
}

function mapearUsuariosCapitulosParaObras(
  usuariosPorCapitulo: Map<string, Set<string>>,
  obraIdPorCapitulo: Map<string, string>,
) {
  const usuariosPorObra = new Map<string, Set<string>>();

  usuariosPorCapitulo.forEach((usuarios, capituloId) => {
    const obraId = obraIdPorCapitulo.get(capituloId)?.trim() || "";

    usuarios.forEach((userId) =>
      adicionarUsuarioUnico(usuariosPorObra, obraId, userId),
    );
  });

  return usuariosPorObra;
}

async function carregarUsuariosPorColuna(
  tabela: string,
  coluna: string,
  ids: string[],
) {
  const idsUnicos = Array.from(
    new Set(ids.map((id) => id.trim()).filter(Boolean)),
  );
  const usuariosPorChave = new Map<string, Set<string>>();

  if (idsUnicos.length === 0) {
    return usuariosPorChave;
  }

  const tamanhoPagina = 1000;

  for (const loteIds of separarEmLotes(idsUnicos)) {
    let inicio = 0;

    while (inicio < 20000) {
      try {
        const { data, error } = await supabase
          .from(tabela)
          .select(`${coluna},user_id`)
          .in(coluna, loteIds)
          .range(inicio, inicio + tamanhoPagina - 1);

        if (error || !Array.isArray(data) || data.length === 0) {
          break;
        }

        data.forEach((registro) => {
          if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
            return;
          }

          const row = registro as RegistroGenerico;
          adicionarUsuarioUnico(
            usuariosPorChave,
            pegarTexto(row[coluna]),
            pegarTexto(row.user_id),
          );
        });

        if (data.length < tamanhoPagina) {
          break;
        }

        inicio += tamanhoPagina;
      } catch {
        break;
      }
    }
  }

  return usuariosPorChave;
}

async function aplicarTotaisInteracoesPublicas(obras: ObraLista[]) {
  const obraIdPorCapitulo = new Map<string, string>();

  obras.forEach((obra) => {
    obra.capitulos.forEach((capitulo) => {
      if (obra.id.trim() && capitulo.id.trim()) {
        obraIdPorCapitulo.set(capitulo.id.trim(), obra.id.trim());
      }
    });
  });

  const obraIds = obras.map((obra) => obra.id.trim()).filter(Boolean);
  const capituloIds = Array.from(obraIdPorCapitulo.keys());

  const [
    curtidasDiretasPorObra,
    curtidasPorCapitulo,
    comentariosDiretosPorObra,
    comentariosPorCapitulo,
  ] = await Promise.all([
    carregarUsuariosPorColuna("obra_curtidas", "obra_id", obraIds),
    carregarUsuariosPorColuna("curtidas_capitulos", "capitulo_id", capituloIds),
    carregarUsuariosPorColuna("comentarios_obras", "obra_id", obraIds),
    carregarUsuariosPorColuna("comentarios_capitulos", "capitulo_id", capituloIds),
  ]);

  const curtidasPorObra = combinarUsuariosPorChave(
    curtidasDiretasPorObra,
    mapearUsuariosCapitulosParaObras(curtidasPorCapitulo, obraIdPorCapitulo),
  );
  const comentariosPorObra = combinarUsuariosPorChave(
    comentariosDiretosPorObra,
    mapearUsuariosCapitulosParaObras(comentariosPorCapitulo, obraIdPorCapitulo),
  );

  return obras.map((obra) => ({
    ...obra,
    totalCurtidas: curtidasPorObra.get(obra.id)?.size || 0,
    totalComentarios: comentariosPorObra.get(obra.id)?.size || 0,
  }));
}

async function carregarResumoAvaliacoes(obras: ObraLista[]) {
  const ids = Array.from(new Set(obras.map((obra) => obra.id).filter(Boolean)));

  if (ids.length === 0) {
    return obras;
  }

  const notasPorObra = new Map<string, number[]>();
  const tamanhoChunk = 100;

  for (let inicio = 0; inicio < ids.length; inicio += tamanhoChunk) {
    const chunk = ids.slice(inicio, inicio + tamanhoChunk);

    try {
      const { data, error } = await supabase
        .from("obra_avaliacoes")
        .select("obra_id,nota")
        .in("obra_id", chunk)
        .limit(Math.max(chunk.length * 100, 100));

      if (error || !Array.isArray(data)) {
        continue;
      }

      data.forEach((registro) => {
        if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
          return;
        }

        const row = registro as RegistroGenerico;
        const obraId = pegarTexto(row.obra_id);
        const nota = pegarNumero(row.nota);

        if (!obraId || nota <= 0 || nota > 5) {
          return;
        }

        const atuais = notasPorObra.get(obraId) || [];
        atuais.push(nota);
        notasPorObra.set(obraId, atuais);
      });
    } catch {
      // Avaliações são informação complementar.
    }
  }

  return obras.map((obra) => {
    const notas = notasPorObra.get(obra.id) || [];
    const notaMedia = notas.length
      ? notas.reduce((total, nota) => total + nota, 0) / notas.length
      : 0;

    return {
      ...obra,
      notaMedia,
      totalAvaliacoes: notas.length,
    };
  });
}

async function carregarObrasPublicadas(idsEspecificos: string[] = []) {
  try {
    let consulta = supabase
      .from("obras")
      .select(CAMPOS_OBRAS)
      .eq("publicado", true)
      .order("criada_em", { ascending: false });

    if (idsEspecificos.length > 0) {
      consulta = consulta.in(
        "id",
        Array.from(new Set(idsEspecificos.map((id) => id.trim()).filter(Boolean))),
      );
    }

    const { data, error } = await consulta.limit(
      idsEspecificos.length > 0 ? Math.max(idsEspecificos.length, 1) : 500,
    );

    if (error || !Array.isArray(data)) {
      return [] as ObraLista[];
    }

    let obras = data.map((registro, index) =>
      criarObraLista(registro as unknown as RegistroGenerico, index),
    );

    obras = await carregarCapitulosDasObras(obras);
    obras = await Promise.all([
      carregarResumoAvaliacoes(obras),
      aplicarTotaisInteracoesPublicas(obras),
    ]).then(([obrasAvaliadas, obrasComInteracoes]) => {
      const interacoesPorId = new Map(
        obrasComInteracoes.map((obra) => [obra.id, obra]),
      );

      return obrasAvaliadas.map((obra) => ({
        ...obra,
        totalCurtidas: interacoesPorId.get(obra.id)?.totalCurtidas || 0,
        totalComentarios: interacoesPorId.get(obra.id)?.totalComentarios || 0,
      }));
    });

    return obras;
  } catch {
    return [] as ObraLista[];
  }
}

async function carregarRegistrosUsuario(
  tabela: string,
  campos: string,
  userId: string,
) {
  if (!idUsuarioValido(userId)) {
    return [] as RegistroGenerico[];
  }

  try {
    const { data, error } = await supabase
      .from(tabela)
      .select(campos)
      .eq("user_id", userId)
      .limit(2000);

    if (error || !Array.isArray(data)) {
      return [] as RegistroGenerico[];
    }

    return data
      .filter(
        (registro) =>
          Boolean(
            registro &&
              typeof registro === "object" &&
              !Array.isArray(registro),
          ),
      )
      .map((registro) => registro as unknown as RegistroGenerico);
  } catch {
    return [] as RegistroGenerico[];
  }
}

function dataRegistro(registro: RegistroGenerico) {
  return pegarTexto(
    registro.atualizado_em ??
      registro.updated_at ??
      registro.criado_em ??
      registro.created_at,
  );
}

function registroPermitido(registro: RegistroGenerico, proprioPerfil: boolean) {
  if (proprioPerfil) {
    return true;
  }

  const visibilidade = pegarTexto(registro.visibilidade);
  return visibilidade !== "privado";
}

function criarItemPerfil(
  categoria: CategoriaPerfil,
  obra: ObraLista,
  registro: RegistroGenerico,
  extras: Partial<ItemObraLista> = {},
): ItemObraLista {
  return {
    chave: `${categoria}-${obra.id}-${dataRegistro(registro) || obra.publicadaEm}`,
    obra,
    categorias: [categoria],
    data: dataRegistro(registro) || obra.publicadaEm,
    nota: 0,
    progresso: 0,
    capituloAtual: "",
    ...extras,
  };
}

function ordenarPorData(itens: ItemObraLista[]) {
  return [...itens].sort((a, b) => timestampData(b.data) - timestampData(a.data));
}

function mesclarTudoPerfil(fontes: ItemObraLista[][]) {
  const mapa = new Map<string, ItemObraLista>();

  fontes.flat().forEach((item) => {
    const chave = item.obra.id || item.obra.slug;
    const atual = mapa.get(chave);

    if (!atual) {
      mapa.set(chave, {
        ...item,
        chave: `tudo-${chave}`,
        categorias: Array.from(new Set(item.categorias)),
      });
      return;
    }

    const itemMaisRecente = timestampData(item.data) > timestampData(atual.data);

    mapa.set(chave, {
      ...(itemMaisRecente ? item : atual),
      chave: `tudo-${chave}`,
      categorias: Array.from(
        new Set([...atual.categorias, ...item.categorias]),
      ),
      nota: Math.max(atual.nota, item.nota),
      progresso: Math.max(atual.progresso, item.progresso),
      capituloAtual: item.capituloAtual || atual.capituloAtual,
    });
  });

  return ordenarPorData(Array.from(mapa.values()));
}

async function carregarListasDoPerfil(
  userId: string,
  proprioPerfil: boolean,
) {
  const [seguindo, favoritas, concluidas, avaliacoes, progresso] =
    await Promise.all([
      carregarRegistrosUsuario(
        "seguindo_obras",
        "obra_id,visibilidade,criado_em,atualizado_em",
        userId,
      ),
      carregarRegistrosUsuario(
        "favoritos",
        "obra_id,visibilidade,criado_em,atualizado_em",
        userId,
      ),
      carregarRegistrosUsuario(
        "concluidas",
        "obra_id,visibilidade,criado_em,atualizado_em",
        userId,
      ),
      carregarRegistrosUsuario(
        "obra_avaliacoes",
        "obra_id,nota,criado_em,atualizado_em",
        userId,
      ),
      carregarRegistrosUsuario(
        "progresso_leitura",
        "obra_id,capitulo_id,lido,progresso,criado_em,atualizado_em",
        userId,
      ),
    ]);

  const registrosVisiveis = [
    ...seguindo,
    ...favoritas,
    ...concluidas,
    ...avaliacoes,
    ...progresso,
  ].filter((registro) => registroPermitido(registro, proprioPerfil));

  const idsObras = Array.from(
    new Set(
      registrosVisiveis
        .map((registro) => pegarTexto(registro.obra_id))
        .filter(Boolean),
    ),
  );
  const obras = await carregarObrasPublicadas(idsObras);
  const obrasPorId = new Map(obras.map((obra) => [obra.id, obra]));
  const concluidasIds = new Set(
    concluidas
      .filter((registro) => registroPermitido(registro, proprioPerfil))
      .map((registro) => pegarTexto(registro.obra_id))
      .filter(Boolean),
  );

  const queroLer = ordenarPorData(
    seguindo
      .filter((registro) => registroPermitido(registro, proprioPerfil))
      .map((registro) => {
        const obraId = pegarTexto(registro.obra_id);
        const obra = obrasPorId.get(obraId);

        if (!obra || concluidasIds.has(obraId)) {
          return null;
        }

        return criarItemPerfil("quero-ler", obra, registro);
      })
      .filter((item): item is ItemObraLista => Boolean(item)),
  );

  const itensFavoritas = ordenarPorData(
    favoritas
      .filter((registro) => registroPermitido(registro, proprioPerfil))
      .map((registro) => {
        const obra = obrasPorId.get(pegarTexto(registro.obra_id));
        return obra ? criarItemPerfil("favoritas", obra, registro) : null;
      })
      .filter((item): item is ItemObraLista => Boolean(item)),
  );

  const itensConcluidas = ordenarPorData(
    concluidas
      .filter((registro) => registroPermitido(registro, proprioPerfil))
      .map((registro) => {
        const obra = obrasPorId.get(pegarTexto(registro.obra_id));
        return obra ? criarItemPerfil("concluidas", obra, registro) : null;
      })
      .filter((item): item is ItemObraLista => Boolean(item)),
  );

  const itensAvaliacoes = ordenarPorData(
    avaliacoes
      .filter((registro) => registroPermitido(registro, proprioPerfil))
      .map((registro) => {
        const obra = obrasPorId.get(pegarTexto(registro.obra_id));
        const nota = pegarNumero(registro.nota);

        if (!obra || nota <= 0) {
          return null;
        }

        return criarItemPerfil("avaliacoes", obra, registro, { nota });
      })
      .filter((item): item is ItemObraLista => Boolean(item)),
  );

  const progressoPorObra = new Map<
    string,
    {
      registros: RegistroGenerico[];
      capitulosLidos: Set<string>;
      progressoInformado: number;
      data: string;
      capituloAtual: string;
    }
  >();

  progresso
    .filter((registro) => registroPermitido(registro, proprioPerfil))
    .forEach((registro) => {
      const obraId = pegarTexto(registro.obra_id);
      const capituloId = pegarTexto(registro.capitulo_id);
      const lido = typeof registro.lido === "boolean" ? registro.lido : true;

      if (!obraId || !lido) {
        return;
      }

      const atual = progressoPorObra.get(obraId) || {
        registros: [],
        capitulosLidos: new Set<string>(),
        progressoInformado: 0,
        data: "",
        capituloAtual: "",
      };
      atual.registros.push(registro);

      if (capituloId) {
        atual.capitulosLidos.add(capituloId);
      }

      atual.progressoInformado = Math.max(
        atual.progressoInformado,
        pegarNumero(registro.progresso),
      );

      if (timestampData(dataRegistro(registro)) >= timestampData(atual.data)) {
        atual.data = dataRegistro(registro);
        atual.capituloAtual = capituloId;
      }

      progressoPorObra.set(obraId, atual);
    });

  const lendo: ItemObraLista[] = [];
  const historico: ItemObraLista[] = [];

  progressoPorObra.forEach((grupo, obraId) => {
    const obra = obrasPorId.get(obraId);

    if (!obra) {
      return;
    }

    const totalCapitulos = obra.capitulos.length;
    const progressoCalculado = totalCapitulos
      ? Math.round((grupo.capitulosLidos.size / totalCapitulos) * 100)
      : 0;
    const progressoFinal = Math.max(
      0,
      Math.min(100, Math.round(Math.max(grupo.progressoInformado, progressoCalculado))),
    );
    const capitulo = obra.capitulos.find(
      (itemCapitulo) => itemCapitulo.id === grupo.capituloAtual,
    );
    const registroBase = grupo.registros[0] || {};
    const extras = {
      data: grupo.data || obra.publicadaEm,
      progresso: progressoFinal,
      capituloAtual: capitulo?.titulo || "",
    };

    historico.push(
      criarItemPerfil("historico", obra, registroBase, extras),
    );

    if (progressoFinal > 0 && progressoFinal < 100 && !concluidasIds.has(obraId)) {
      lendo.push(criarItemPerfil("lendo", obra, registroBase, extras));
    }
  });

  const estado: ListasPerfilEstado = {
    tudo: [],
    lendo: ordenarPorData(lendo),
    "quero-ler": queroLer,
    favoritas: itensFavoritas,
    concluidas: itensConcluidas,
    avaliacoes: itensAvaliacoes,
    historico: ordenarPorData(historico),
  };

  estado.tudo = mesclarTudoPerfil([
    estado.lendo,
    estado["quero-ler"],
    estado.favoritas,
    estado.concluidas,
    estado.avaliacoes,
    estado.historico,
  ]);

  return estado;
}

async function carregarIdsInteracoesUsuario(userId: string) {
  if (!idUsuarioValido(userId)) {
    return [] as string[];
  }

  const [favoritas, seguindo, concluidas] = await Promise.all([
    carregarRegistrosUsuario("favoritos", "obra_id", userId),
    carregarRegistrosUsuario("seguindo_obras", "obra_id", userId),
    carregarRegistrosUsuario("concluidas", "obra_id", userId),
  ]);

  return Array.from(
    new Set(
      [...favoritas, ...seguindo, ...concluidas]
        .map((registro) => pegarTexto(registro.obra_id))
        .filter(Boolean),
    ),
  );
}

function dataUltimoCapitulo(obra: ObraLista) {
  return obra.capitulos.reduce((maisRecente, capitulo) => {
    return Math.max(maisRecente, timestampData(capitulo.criadoEm));
  }, timestampData(obra.publicadaEm));
}

function pontuacaoPopularidadeObra(obra: ObraLista) {
  return (
    obra.visualizacoes +
    obra.totalCurtidas * 8 +
    obra.totalComentarios * 5 +
    obra.capitulos.length * 2
  );
}

function ordenarObrasDaSecao(obras: ObraLista[], secao: string) {
  const lista = [...obras];

  if (secao === "novos-capitulos") {
    return lista
      .filter((obra) => obra.capitulos.length > 0 && dataUltimoCapitulo(obra) > 0)
      .sort(
        (a, b) =>
          dataUltimoCapitulo(b) - dataUltimoCapitulo(a) ||
          timestampData(b.publicadaEm) - timestampData(a.publicadaEm),
      );
  }

  if (secao === "mais-curtidas") {
    return lista
      .filter((obra) => obra.totalCurtidas > 0)
      .sort(
        (a, b) =>
          b.totalCurtidas - a.totalCurtidas ||
          pontuacaoPopularidadeObra(b) - pontuacaoPopularidadeObra(a),
      );
  }

  if (secao === "mais-comentadas") {
    return lista
      .filter((obra) => obra.totalComentarios > 0)
      .sort(
        (a, b) =>
          b.totalComentarios - a.totalComentarios ||
          pontuacaoPopularidadeObra(b) - pontuacaoPopularidadeObra(a),
      );
  }

  if (secao === "para-ler-agora") {
    return lista
      .filter((obra) => obra.capitulos.length > 0 && obra.capitulos.length <= 3)
      .sort(
        (a, b) =>
          a.capitulos.length - b.capitulos.length ||
          pontuacaoPopularidadeObra(b) - pontuacaoPopularidadeObra(a),
      );
  }

  if (secao === "em-alta") {
    return lista.sort(
      (a, b) =>
        pontuacaoPopularidadeObra(b) - pontuacaoPopularidadeObra(a) ||
        b.notaMedia - a.notaMedia ||
        timestampData(b.publicadaEm) - timestampData(a.publicadaEm),
    );
  }

  return lista.sort(
    (a, b) => timestampData(b.publicadaEm) - timestampData(a.publicadaEm),
  );
}

function ordenarRecomendacoes(obras: ObraLista[], idsInteracoes: string[]) {
  const idsSet = new Set(idsInteracoes);
  const generosPreferidos = new Map<string, number>();

  obras.forEach((obra) => {
    if (!idsSet.has(obra.id)) {
      return;
    }

    const genero = normalizarTexto(obra.genero);
    generosPreferidos.set(genero, (generosPreferidos.get(genero) || 0) + 1);
  });

  return [...obras]
    .filter((obra) => !idsSet.has(obra.id))
    .sort((a, b) => {
      const pontuacao = (obra: ObraLista) => {
        const afinidade = generosPreferidos.get(normalizarTexto(obra.genero)) || 0;
        const nota = obra.notaMedia * 2;
        const popularidade = Math.min(
          8,
          pontuacaoPopularidadeObra(obra) / 1000,
        );
        const recencia = timestampData(obra.publicadaEm) / 1_000_000_000_000;
        return afinidade * 8 + nota + popularidade + recencia;
      };

      return pontuacao(b) - pontuacao(a);
    });
}

async function carregarAvaliacoesAutoresPublicos(autorIds: string[]) {
  const idsUnicos = Array.from(
    new Set(autorIds.map((id) => id.trim()).filter(idUsuarioValido)),
  );
  const avaliacoes = new Map<string, { media: number; total: number }>();

  if (idsUnicos.length === 0) {
    return avaliacoes;
  }

  try {
    const { data, error } = await supabase
      .from("autor_avaliacoes")
      .select("autor_id,nota")
      .in("autor_id", idsUnicos)
      .limit(5000);

    if (error || !Array.isArray(data)) {
      return avaliacoes;
    }

    const acumulado = new Map<string, { soma: number; total: number }>();

    data.forEach((registro) => {
      if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
        return;
      }

      const row = registro as RegistroGenerico;
      const autorId = pegarTexto(row.autor_id);
      const nota = pegarNumero(row.nota);

      if (!autorId || nota < 0.5 || nota > 5) {
        return;
      }

      const atual = acumulado.get(autorId) || { soma: 0, total: 0 };
      acumulado.set(autorId, {
        soma: atual.soma + nota,
        total: atual.total + 1,
      });
    });

    acumulado.forEach((valor, autorId) => {
      if (valor.total > 0) {
        avaliacoes.set(autorId, {
          media: valor.soma / valor.total,
          total: valor.total,
        });
      }
    });
  } catch {
    // A lista de autores continua funcionando sem avaliações.
  }

  return avaliacoes;
}

async function carregarAutoresPublicos(obras: ObraLista[]) {
  const idsAutores = Array.from(
    new Set(obras.map((obra) => obra.autorId).filter(idUsuarioValido)),
  );
  const perfisPorId = new Map<string, PerfilLista>();
  const avaliacoesPorAutor = await carregarAvaliacoesAutoresPublicos(idsAutores);
  const tamanhoChunk = 100;

  for (let inicio = 0; inicio < idsAutores.length; inicio += tamanhoChunk) {
    const chunk = idsAutores.slice(inicio, inicio + tamanhoChunk);

    for (const campo of ["user_id", "id"] as const) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id,user_id,nome,username,avatar_url,bio,sobre_bio,criado_em")
          .in(campo, chunk)
          .limit(Math.max(chunk.length, 1));

        if (error || !Array.isArray(data)) {
          continue;
        }

        data.forEach((registro) => {
          if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
            return;
          }

          const row = registro as RegistroGenerico;
          const userId = pegarTexto(row.user_id ?? row.id);

          if (userId) {
            perfisPorId.set(userId, criarPerfilLista(row, userId, "Usuário"));
          }
        });
      } catch {
        // Os dados das próprias obras servem como fallback.
      }
    }
  }

  const agrupados = new Map<string, ObraLista[]>();

  obras.forEach((obra) => {
    const chave = obra.autorId || normalizarTexto(obra.autor);
    const atuais = agrupados.get(chave) || [];
    atuais.push(obra);
    agrupados.set(chave, atuais);
  });

  return Array.from(agrupados.entries())
    .map(([chave, obrasAutor]): AutorLista => {
      const primeiraObra = obrasAutor[0];
      const perfil = primeiraObra.autorId
        ? perfisPorId.get(primeiraObra.autorId)
        : undefined;
      const generos = Array.from(
        new Set(obrasAutor.map((obra) => obra.genero).filter(Boolean)),
      ).slice(0, 3);

      const avaliacao = primeiraObra.autorId
        ? avaliacoesPorAutor.get(primeiraObra.autorId)
        : undefined;

      return {
        id: perfil?.userId || primeiraObra.autorId || chave,
        nome: perfil?.nome || primeiraObra.autor,
        username: perfil?.username || "",
        avatar: perfil?.avatar || "",
        bio: perfil?.bio || "Autor no Historietas.",
        totalObras: obrasAutor.length,
        totalCurtidas: obrasAutor.reduce(
          (total, obra) => total + obra.totalCurtidas,
          0,
        ),
        totalComentarios: obrasAutor.reduce(
          (total, obra) => total + obra.totalComentarios,
          0,
        ),
        notaMedia: avaliacao?.media || 0,
        totalAvaliacoes: avaliacao?.total || 0,
        generos,
        criadaEm: obrasAutor
          .map((obra) => obra.publicadaEm)
          .sort((a, b) => timestampData(b) - timestampData(a))[0] || "",
      };
    })
    .sort((a, b) => b.totalObras - a.totalObras || a.nome.localeCompare(b.nome));
}

function tituloSecaoPublica(secao: string, genero: string) {
  if (genero) {
    return genero;
  }

  if (secao === "recomendacoes") {
    return "Recomendações para você";
  }

  if (secao === "em-alta") {
    return "Em alta";
  }

  if (secao === "recentes") {
    return "Publicações recentes";
  }

  if (secao === "novos-capitulos") {
    return "Novos capítulos";
  }

  if (secao === "mais-curtidas") {
    return "Mais curtidas";
  }

  if (secao === "mais-comentadas") {
    return "Mais comentadas";
  }

  if (secao === "para-ler-agora") {
    return "Para ler agora";
  }

  if (secao === "autores") {
    return "Autores para conhecer";
  }

  return "Todas as obras";
}

function rotuloCategoria(categoria: CategoriaPerfil) {
  return CATEGORIAS_PERFIL.find((item) => item.valor === categoria)?.rotulo || "Tudo";
}

function textoCategorias(categorias: CategoriaPerfil[]) {
  const ordem: CategoriaPerfil[] = [
    "lendo",
    "quero-ler",
    "favoritas",
    "concluidas",
    "avaliacoes",
    "historico",
  ];

  return ordem
    .filter((categoria) => categorias.includes(categoria))
    .map(rotuloCategoria)
    .join(" • ");
}

function renderizarEstrelasAvaliacao(nota: number, data: string) {
  const notaNormalizada = Math.max(
    0,
    Math.min(5, Math.round(nota * 2) / 2),
  );

  return (
    <span
      style={ratingDetailStyle}
      aria-label={`${notaNormalizada.toFixed(1).replace(".", ",")} de 5 estrelas`}
    >
      <span style={ratingStarsStyle} aria-hidden="true">
        {Array.from({ length: 5 }, (_, indice) => {
          const preenchimento = Math.max(
            0,
            Math.min(1, notaNormalizada - indice),
          );

          return (
            <span key={indice} style={ratingStarSlotStyle}>
              <span style={ratingStarEmptyStyle}>★</span>

              {preenchimento > 0 && (
                <span
                  style={{
                    ...ratingStarFillClipStyle,
                    width: `${preenchimento * 100}%`,
                  }}
                >
                  <span style={ratingStarFilledStyle}>★</span>
                </span>
              )}
            </span>
          );
        })}
      </span>

      <span>
        {notaNormalizada.toFixed(1).replace(".", ",")} • {formatarDataCurta(data)}
      </span>
    </span>
  );
}

function textoSecundarioItem(
  item: ItemObraLista,
  categoria: CategoriaPerfil,
) {
  if (categoria === "lendo") {
    return `${item.progresso}% concluído${
      item.capituloAtual ? ` • ${item.capituloAtual}` : ""
    }`;
  }

  if (categoria === "historico") {
    return `Última leitura em ${formatarDataCurta(item.data)}${
      item.progresso ? ` • ${item.progresso}%` : ""
    }`;
  }

  if (categoria === "quero-ler") {
    return `Adicionada em ${formatarDataCurta(item.data)}`;
  }

  if (categoria === "favoritas") {
    return `Favoritada em ${formatarDataCurta(item.data)}`;
  }

  if (categoria === "concluidas") {
    return `Concluída em ${formatarDataCurta(item.data)}`;
  }

  return textoCategorias(item.categorias) || `${item.obra.genero} • ${item.obra.formato}`;
}

function textoSecundarioObraPublica(obra: ObraLista, secao: string) {
  const totalCapitulos = obra.capitulos.length;
  const textoCapitulos = `${totalCapitulos} ${
    totalCapitulos === 1 ? "capítulo" : "capítulos"
  }`;

  if (secao === "novos-capitulos") {
    return `${textoCapitulos} • atualizado em ${formatarDataCurta(
      new Date(dataUltimoCapitulo(obra)).toISOString(),
    )}`;
  }

  if (secao === "mais-curtidas") {
    return `${compactarNumero(obra.totalCurtidas)} ${
      obra.totalCurtidas === 1 ? "curtida" : "curtidas"
    } • ${textoCapitulos}`;
  }

  if (secao === "mais-comentadas") {
    return `${compactarNumero(obra.totalComentarios)} ${
      obra.totalComentarios === 1 ? "comentário" : "comentários"
    } • ${textoCapitulos}`;
  }

  if (secao === "para-ler-agora") {
    return `${textoCapitulos} • leitura rápida`;
  }

  return `${totalCapitulos > 0 ? textoCapitulos : obra.formato}${
    obra.visualizacoes > 0
      ? ` • ${compactarNumero(obra.visualizacoes)} visualizações`
      : ""
  }`;
}

function criarCapaStyle(capa: string): CSSProperties {
  return capa
    ? {
        ...coverStyle,
        backgroundImage: `url(${capa})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : coverEmptyStyle;
}

function criarAvatarStyle(avatar: string): CSSProperties {
  return avatar
    ? {
        ...authorAvatarStyle,
        backgroundImage: `url(${avatar})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : authorAvatarEmptyStyle;
}

function ListasUniversaisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const queryAtual = searchParams.toString();

  const modo = normalizarModoLista(searchParams.get("modo"));
  const origemPerfil = normalizarOrigemPerfil(searchParams.get("origem"));
  const categoriaUrl = normalizarCategoriaPerfil(searchParams.get("categoria"));
  const userIdUrl =
    searchParams.get("usuario") ||
    searchParams.get("userId") ||
    searchParams.get("autorId") ||
    "";
  const secao = pegarTexto(searchParams.get("secao"), "catalogo");
  const genero = pegarTexto(searchParams.get("genero"));
  const tituloPersonalizado = pegarTexto(searchParams.get("titulo"));

  const [usuarioAtualId, setUsuarioAtualId] = useState("");
  const [perfil, setPerfil] = useState<PerfilLista | null>(null);
  const [listasPerfil, setListasPerfil] =
    useState<ListasPerfilEstado>(LISTAS_PERFIL_VAZIAS);
  const [obrasPublicas, setObrasPublicas] = useState<ObraLista[]>([]);
  const [autores, setAutores] = useState<AutorLista[]>([]);
  const [categoria, setCategoria] = useState<CategoriaPerfil>(categoriaUrl);
  const busca = "";
  const ordenacao = normalizarOrdenacao(searchParams.get("ordem"));
  const [quantidadeVisivel, setQuantidadeVisivel] = useState(40);
  const [carregando, setCarregando] = useState(true);
  const [bloqueado, setBloqueado] = useState(false);
  const [erro, setErro] = useState("");
  const [obraMenuAberta, setObraMenuAberta] = useState<ObraLista | null>(null);
  const [salvandoQueroLer, setSalvandoQueroLer] = useState(false);
  const [obraMenuNoQueroLer, setObraMenuNoQueroLer] = useState(false);

  useEffect(() => {
    setCategoria(categoriaUrl);
  }, [categoriaUrl]);

  useEffect(() => {
    setQuantidadeVisivel(40);
  }, [categoria, busca, ordenacao, modo, secao, genero]);

  useEffect(() => {
    if (!obraMenuAberta) {
      return;
    }

    const overflowAnterior = document.body.style.overflow;
    const aoPressionarTecla = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setObraMenuAberta(null);
        setObraMenuNoQueroLer(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", aoPressionarTecla);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", aoPressionarTecla);
    };
  }, [obraMenuAberta]);

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      setCarregando(true);
      setBloqueado(false);
      setErro("");

      try {
        const { data: authData } = await supabase.auth.getUser();
        const usuarioLogadoId = authData.user?.id || "";

        if (cancelado) {
          return;
        }

        setUsuarioAtualId(usuarioLogadoId);

        if (modo === "perfil") {
          const perfilUserId = userIdUrl.trim() || usuarioLogadoId;

          if (!perfilUserId || !idUsuarioValido(perfilUserId)) {
            setPerfil(null);
            setListasPerfil(LISTAS_PERFIL_VAZIAS);
            setErro("Não foi possível identificar o perfil desta lista.");
            return;
          }

          const proprioPerfil = perfilUserId === usuarioLogadoId;
          const [perfilCarregado, preferencias] = await Promise.all([
            carregarPerfil(
              perfilUserId,
              proprioPerfil
                ? pegarTexto(authData.user?.user_metadata?.nome) ||
                    pegarTexto(authData.user?.email)
                : "",
            ),
            carregarPreferenciasPrivacidade(perfilUserId, {
              usarFallbackLocal: proprioPerfil,
            }),
          ]);
          const permissoes = proprioPerfil
            ? PERMISSOES_PROPRIO_PERFIL
            : await carregarPermissoesAbasPerfil(perfilUserId, preferencias);
          const permitido =
            origemPerfil === "biblioteca"
              ? permissoes.biblioteca
              : permissoes.diario;

          if (cancelado) {
            return;
          }

          setPerfil(perfilCarregado);

          if (!permitido) {
            setBloqueado(true);
            setListasPerfil(LISTAS_PERFIL_VAZIAS);
            return;
          }

          const listas = await carregarListasDoPerfil(perfilUserId, proprioPerfil);

          if (!cancelado) {
            setListasPerfil(listas);
          }

          return;
        }

        const catalogo = await carregarObrasPublicadas();

        if (cancelado) {
          return;
        }

        let obrasPreparadas = [...catalogo];

        if (genero) {
          const generoNormalizado = normalizarTexto(genero);
          obrasPreparadas = obrasPreparadas.filter((obra) =>
            normalizarTexto(obra.genero).includes(generoNormalizado),
          );
        }

        if (secao === "recomendacoes") {
          const idsInteracoes = await carregarIdsInteracoesUsuario(usuarioLogadoId);
          obrasPreparadas = ordenarRecomendacoes(obrasPreparadas, idsInteracoes);
        } else {
          obrasPreparadas = ordenarObrasDaSecao(obrasPreparadas, secao);
        }

        setObrasPublicas(obrasPreparadas);

        if (modo === "autores") {
          const autoresCarregados = await carregarAutoresPublicos(obrasPreparadas);

          if (!cancelado) {
            setAutores(autoresCarregados);
          }
        }
      } catch (error) {
        if (!cancelado) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar esta lista agora.",
          );
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    void iniciar();

    return () => {
      cancelado = true;
    };
  }, [modo, origemPerfil, userIdUrl, secao, genero]);

  const itensPerfilFiltrados = useMemo(() => {
    const buscaNormalizada = normalizarTexto(busca);
    let itens = [...listasPerfil[categoria]];

    if (buscaNormalizada) {
      itens = itens.filter((item) =>
        normalizarTexto(
          [
            item.obra.titulo,
            item.obra.autor,
            item.obra.genero,
            item.obra.formato,
            textoCategorias(item.categorias),
          ].join(" "),
        ).includes(buscaNormalizada),
      );
    }

    itens.sort((a, b) => {
      if (ordenacao === "titulo") {
        return a.obra.titulo.localeCompare(b.obra.titulo, "pt-BR");
      }

      if (ordenacao === "avaliacao") {
        return (
          (b.nota || b.obra.notaMedia) - (a.nota || a.obra.notaMedia) ||
          timestampData(b.data) - timestampData(a.data)
        );
      }

      if (ordenacao === "popularidade") {
        return b.obra.visualizacoes - a.obra.visualizacoes;
      }

      return timestampData(b.data) - timestampData(a.data);
    });

    return itens;
  }, [busca, categoria, listasPerfil, ordenacao]);

  const obrasFiltradas = useMemo(() => {
    const buscaNormalizada = normalizarTexto(busca);
    let obras = [...obrasPublicas];

    if (buscaNormalizada) {
      obras = obras.filter((obra) =>
        normalizarTexto(
          [obra.titulo, obra.autor, obra.genero, obra.formato].join(" "),
        ).includes(buscaNormalizada),
      );
    }

    obras.sort((a, b) => {
      if (ordenacao === "titulo") {
        return a.titulo.localeCompare(b.titulo, "pt-BR");
      }

      if (ordenacao === "avaliacao") {
        return b.notaMedia - a.notaMedia || b.totalAvaliacoes - a.totalAvaliacoes;
      }

      if (secao === "novos-capitulos") {
        return dataUltimoCapitulo(b) - dataUltimoCapitulo(a);
      }

      if (secao === "mais-curtidas") {
        return b.totalCurtidas - a.totalCurtidas;
      }

      if (secao === "mais-comentadas") {
        return b.totalComentarios - a.totalComentarios;
      }

      if (secao === "para-ler-agora") {
        return (
          a.capitulos.length - b.capitulos.length ||
          pontuacaoPopularidadeObra(b) - pontuacaoPopularidadeObra(a)
        );
      }

      if (ordenacao === "popularidade") {
        return pontuacaoPopularidadeObra(b) - pontuacaoPopularidadeObra(a);
      }

      return timestampData(b.publicadaEm) - timestampData(a.publicadaEm);
    });

    return obras;
  }, [busca, obrasPublicas, ordenacao, secao]);

  const autoresFiltrados = useMemo(() => {
    const buscaNormalizada = normalizarTexto(busca);
    let lista = [...autores];

    if (buscaNormalizada) {
      lista = lista.filter((autor) =>
        normalizarTexto(
          [autor.nome, autor.username, autor.bio, ...autor.generos].join(" "),
        ).includes(buscaNormalizada),
      );
    }

    lista.sort((a, b) => {
      if (ordenacao === "titulo") {
        return a.nome.localeCompare(b.nome, "pt-BR");
      }

      if (ordenacao === "avaliacao") {
        return (
          b.notaMedia - a.notaMedia ||
          b.totalAvaliacoes - a.totalAvaliacoes ||
          b.totalObras - a.totalObras
        );
      }

      if (ordenacao === "popularidade") {
        const pontuacao = (autor: AutorLista) =>
          autor.totalObras * 12 +
          autor.totalCurtidas * 4 +
          autor.totalComentarios * 3;

        return pontuacao(b) - pontuacao(a) || b.totalObras - a.totalObras;
      }

      if (ordenacao === "recentes") {
        return timestampData(b.criadaEm) - timestampData(a.criadaEm);
      }

      return b.totalObras - a.totalObras || a.nome.localeCompare(b.nome, "pt-BR");
    });

    return lista;
  }, [autores, busca, ordenacao]);

  const totalResultados =
    modo === "perfil"
      ? itensPerfilFiltrados.length
      : modo === "autores"
        ? autoresFiltrados.length
        : obrasFiltradas.length;
  const tituloPagina =
    tituloPersonalizado ||
    (modo === "perfil"
      ? `${origemPerfil === "biblioteca" ? "Biblioteca" : "Leituras"} de ${
          perfil?.nome || "usuário"
        }`
      : modo === "autores"
        ? "Autores para conhecer"
        : tituloSecaoPublica(secao, genero));
  const agruparPorMes =
    modo === "perfil" && (categoria === "avaliacoes" || categoria === "historico");
  const itensPerfilVisiveis = itensPerfilFiltrados.slice(0, quantidadeVisivel);
  const obrasVisiveis = obrasFiltradas.slice(0, quantidadeVisivel);
  const autoresVisiveis = autoresFiltrados.slice(0, quantidadeVisivel);

  const gruposPerfil = useMemo(() => {
    const grupos = new Map<string, ItemObraLista[]>();

    itensPerfilVisiveis.forEach((item) => {
      const chave = formatarMesAno(item.data);
      const atuais = grupos.get(chave) || [];
      atuais.push(item);
      grupos.set(chave, atuais);
    });

    return Array.from(grupos.entries());
  }, [itensPerfilVisiveis]);

  function trocarCategoria(novaCategoria: CategoriaPerfil) {
    setCategoria(novaCategoria);
    const params = new URLSearchParams(queryAtual);
    params.set("categoria", novaCategoria);
    router.replace(`/listas?${params.toString()}`, { scroll: false });
  }

  async function abrirMenuObra(obra: ObraLista) {
    setObraMenuAberta(obra);
    setObraMenuNoQueroLer(false);

    try {
      const userId =
        usuarioAtualId ||
        (await supabase.auth.getUser()).data.user?.id ||
        "";

      if (!userId) {
        return;
      }

      const listaLocal = carregarListaIdsListas(
        LIBRARY_FOLLOW_STORAGE_KEY,
        userId,
      );
      const salvoLocalmente = colecaoTemObraListas(listaLocal, obra);

      setObraMenuNoQueroLer(salvoLocalmente);

      const { data, error } = await supabase
        .from("seguindo_obras")
        .select("obra_id")
        .eq("user_id", userId)
        .eq("obra_id", obra.id)
        .limit(1);

      if (error) {
        return;
      }

      const salvoRemotamente = Array.isArray(data) && data.length > 0;
      const salvo = salvoLocalmente || salvoRemotamente;

      setObraMenuNoQueroLer(salvo);

      if (salvoRemotamente && !salvoLocalmente) {
        salvarListaIdsListas(
          LIBRARY_FOLLOW_STORAGE_KEY,
          userId,
          Array.from(new Set([...listaLocal, obra.id])),
        );
      }
    } catch {
      // O estado local continua disponível mesmo sem resposta do Supabase.
    }
  }

  function fecharMenuObra() {
    if (salvandoQueroLer) {
      return;
    }

    setObraMenuAberta(null);
    setObraMenuNoQueroLer(false);
  }

  async function alternarObraNoQueroLer() {
    if (!obraMenuAberta || salvandoQueroLer) {
      return;
    }

    const obra = obraMenuAberta;
    setSalvandoQueroLer(true);

    try {
      const userId =
        usuarioAtualId ||
        (await supabase.auth.getUser()).data.user?.id ||
        "";

      if (!userId) {
        setObraMenuAberta(null);
        router.push(criarLoginHrefListas());
        return;
      }

      const listaAtual = carregarListaIdsListas(
        LIBRARY_FOLLOW_STORAGE_KEY,
        userId,
      );
      const jaEstaSalva =
        obraMenuNoQueroLer || colecaoTemObraListas(listaAtual, obra);
      const proximoEstado = !jaEstaSalva;
      const listaAtualizada = proximoEstado
        ? Array.from(new Set([...listaAtual, obra.id]))
        : removerObraDaColecaoListas(listaAtual, obra);

      salvarListaIdsListas(
        LIBRARY_FOLLOW_STORAGE_KEY,
        userId,
        listaAtualizada,
      );
      setObraMenuNoQueroLer(proximoEstado);
      setObraMenuAberta(null);

      await sincronizarQueroLerListas(userId, obra.id, proximoEstado);
    } finally {
      setSalvandoQueroLer(false);
    }
  }

  function copiarTextoComFallback(texto: string) {
    const campo = document.createElement("textarea");
    campo.value = texto;
    campo.setAttribute("readonly", "true");
    campo.style.position = "fixed";
    campo.style.left = "-9999px";
    document.body.appendChild(campo);
    campo.select();

    let copiado = false;

    try {
      copiado = document.execCommand("copy");
    } catch {
      copiado = false;
    }

    document.body.removeChild(campo);
    return copiado;
  }

  async function compartilharObraDoMenu() {
    if (!obraMenuAberta) {
      return;
    }

    const link = new URL(obraMenuAberta.link, window.location.origin).toString();
    const dados: ShareData = {
      title: `${obraMenuAberta.titulo} no HISTORIETAS`,
      text: `Confira ${obraMenuAberta.titulo} de ${obraMenuAberta.autor} no HISTORIETAS.`,
      url: link,
    };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(dados);
        fecharMenuObra();
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      let copiado = false;

      if (
        window.isSecureContext &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        try {
          await navigator.clipboard.writeText(link);
          copiado = true;
        } catch {
          copiado = copiarTextoComFallback(link);
        }
      } else {
        copiado = copiarTextoComFallback(link);
      }

      if (!copiado) {
        throw new Error("Não foi possível copiar o link.");
      }

      fecharMenuObra();
    } catch {
      // Mantém a ação silenciosa quando o compartilhamento não estiver disponível.
    }
  }

  function renderizarItemObra(item: ItemObraLista, categoriaAtual: CategoriaPerfil) {
    const obra = item.obra;

    return (
      <article key={item.chave} className="historietas-list-row">
        <Link href={obra.link} style={rowMainLinkStyle}>
          <span style={criarCapaStyle(obra.capa)} aria-hidden="true" />

          <span style={rowTextStyle}>
            <strong data-historietas-user-content="true" style={rowTitleStyle}>
              {obra.titulo}
            </strong>
            <span data-historietas-user-content="true" style={rowMetaStyle}>
              {obra.autor} • {obra.genero}
            </span>
            <span style={rowDetailStyle}>
              {categoriaAtual === "avaliacoes"
                ? renderizarEstrelasAvaliacao(item.nota, item.data)
                : textoSecundarioItem(item, categoriaAtual)}
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => void abrirMenuObra(obra)}
          style={rowOptionsButtonStyle}
          aria-label={`Abrir opções de ${obra.titulo}`}
        >
          <span aria-hidden="true" style={moreOptionsStyle}>
            <span style={moreDotStyle} />
            <span style={moreDotStyle} />
            <span style={moreDotStyle} />
          </span>
        </button>
      </article>
    );
  }

  function renderizarObraPublica(obra: ObraLista) {
    return (
      <article key={obra.id} className="historietas-list-row">
        <Link href={obra.link} style={rowMainLinkStyle}>
          <span style={criarCapaStyle(obra.capa)} aria-hidden="true" />

          <span style={rowTextStyle}>
            <strong data-historietas-user-content="true" style={rowTitleStyle}>
              {obra.titulo}
            </strong>
            <span data-historietas-user-content="true" style={rowMetaStyle}>
              {obra.genero}
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => void abrirMenuObra(obra)}
          style={rowOptionsButtonStyle}
          aria-label={`Abrir opções de ${obra.titulo}`}
        >
          <span aria-hidden="true" style={moreOptionsStyle}>
            <span style={moreDotStyle} />
            <span style={moreDotStyle} />
            <span style={moreDotStyle} />
          </span>
        </button>
      </article>
    );
  }

  function renderizarAutor(autor: AutorLista) {
    const href = idUsuarioValido(autor.id)
      ? `/perfil-autor?autorId=${encodeURIComponent(autor.id)}`
      : `/perfil-autor?autor=${encodeURIComponent(autor.nome)}`;

    return (
      <article key={autor.id || autor.nome} className="historietas-list-row">
        <Link href={href} style={rowAuthorLinkStyle}>
          <span style={criarAvatarStyle(autor.avatar)} aria-hidden="true">
            {!autor.avatar ? autor.nome.slice(0, 1).toLocaleUpperCase("pt-BR") : ""}
          </span>

          <span style={rowTextStyle}>
            <strong data-historietas-user-content="true" style={rowTitleStyle}>
              {autor.nome}
            </strong>
            <span data-historietas-user-content="true" style={rowMetaStyle}>
              {autor.username ? `@${autor.username} • ` : ""}
              {autor.totalObras} {autor.totalObras === 1 ? "obra" : "obras"}
            </span>
          </span>
        </Link>
      </article>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${listasPageCss}`}</style>


      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <h1 data-historietas-user-content="true" style={pageTitleStyle}>
            {tituloPagina}
          </h1>
        </div>
      </header>

      {modo === "perfil" && !bloqueado && (
        <section style={controlsStyle}>
          <div style={tabsStyle} aria-label="Categorias da lista">
            {CATEGORIAS_PERFIL.map((item) => (
              <button
                key={item.valor}
                type="button"
                onClick={() => trocarCategoria(item.valor)}
                style={
                  categoria === item.valor ? tabActiveStyle : tabStyle
                }
              >
                {item.rotulo}
                <span style={tabCountStyle}>{listasPerfil[item.valor].length}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section style={listSectionStyle} aria-live="polite">
        {carregando && (
          <div style={stateStyle}>
            <span className="historietas-list-spinner" aria-hidden="true" />
            <strong>Organizando a lista...</strong>
          </div>
        )}

        {!carregando && bloqueado && (
          <div style={stateStyle}>
            <span style={stateIconStyle}>🔒</span>
            <strong>Esta lista é privada</strong>
            <span style={stateTextStyle}>
              O dono do perfil escolheu quem pode visualizar esta seção.
            </span>
            <Link href="/perfil-autor" style={stateLinkStyle}>
              Voltar ao perfil
            </Link>
          </div>
        )}

        {!carregando && erro && !bloqueado && (
          <div style={stateStyle}>
            <span style={stateIconStyle}>!</span>
            <strong>Não foi possível abrir a lista</strong>
            <span style={stateTextStyle}>{erro}</span>
          </div>
        )}

        {!carregando && !bloqueado && !erro && totalResultados === 0 && (
          <div style={stateStyle}>
            <span style={stateIconStyle}>⌕</span>
            <strong>Nenhum item encontrado</strong>
          </div>
        )}

        {!carregando && !bloqueado && !erro && totalResultados > 0 && (
          <>
            {modo === "perfil" &&
              (agruparPorMes
                ? gruposPerfil.map(([mes, itens]) => (
                    <section key={mes} style={monthGroupStyle}>
                      <h2 style={monthTitleStyle}>{mes}</h2>
                      <div style={rowsStyle}>
                        {itens.map((item) => renderizarItemObra(item, categoria))}
                      </div>
                    </section>
                  ))
                : (
                    <div style={rowsStyle}>
                      {itensPerfilVisiveis.map((item) =>
                        renderizarItemObra(item, categoria),
                      )}
                    </div>
                  ))}

            {modo === "obras" && (
              <div style={rowsStyle}>
                {obrasVisiveis.map(renderizarObraPublica)}
              </div>
            )}

            {modo === "autores" && (
              <div style={rowsStyle}>
                {autoresVisiveis.map(renderizarAutor)}
              </div>
            )}

            {quantidadeVisivel < totalResultados && (
              <button
                type="button"
                onClick={() =>
                  setQuantidadeVisivel((quantidade) => quantidade + 40)
                }
                style={loadMoreButtonStyle}
              >
                Carregar mais
              </button>
            )}
          </>
        )}
      </section>

      <footer style={footerStyle}>
        <span>Historietas</span>
      </footer>

      {obraMenuAberta && (
        <div
          style={actionSheetOverlayStyle}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              fecharMenuObra();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`Opções de ${obraMenuAberta.titulo}`}
            style={actionSheetStyle}
            onClick={(event) => event.stopPropagation()}
          >
            <span style={actionSheetHandleStyle} aria-hidden="true" />

            <div style={actionSheetHeaderStyle}>
              <strong data-historietas-user-content="true" style={actionSheetTitleStyle}>
                {obraMenuAberta.titulo}
              </strong>
              <span data-historietas-user-content="true" style={actionSheetMetaStyle}>
                {obraMenuAberta.autor} • {obraMenuAberta.genero}
              </span>
            </div>

            <div style={actionSheetActionsStyle}>
              <button
                type="button"
                onClick={() => void alternarObraNoQueroLer()}
                disabled={salvandoQueroLer}
                style={{
                  ...actionSheetButtonStyle,
                  ...(salvandoQueroLer ? actionSheetButtonDisabledStyle : {}),
                }}
              >
                <span>
                  {obraMenuNoQueroLer
                    ? "Remover do Quero ler"
                    : "Quero ler mais tarde"}
                </span>
                <span
                  aria-hidden="true"
                  style={
                    obraMenuNoQueroLer
                      ? actionSheetSelectionDotActiveStyle
                      : actionSheetSelectionDotStyle
                  }
                >
                  {obraMenuNoQueroLer ? "✓" : ""}
                </span>
              </button>

              <button
                type="button"
                onClick={() => void compartilharObraDoMenu()}
                style={actionSheetButtonStyle}
              >
                <span>Compartilhar</span>
                <span aria-hidden="true" style={actionSheetButtonIconStyle}>↗</span>
              </button>
            </div>
          </section>
        </div>
      )}

    </main>
  );
}

export default function ListasUniversaisPage() {
  return (
    <Suspense
      fallback={
        <main style={pageStyle}>
          <div style={stateStyle}>Carregando lista...</div>
        </main>
      }
    >
      <ListasUniversaisContent />
    </Suspense>
  );
}

const listasPageCss = `
  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main,
  html[data-historietas-tema-visual="foco"] body,
  html[data-historietas-tema-visual="foco"] main {
    background: #000000 !important;
    color: #FFFFFF !important;
  }

  .historietas-list-row {
    min-width: 0;
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40px;
    align-items: stretch;
  }

  .historietas-list-row::after {
    content: "";
    position: absolute;
    left: 82px;
    right: 4px;
    bottom: 0;
    height: 1px;
    background: rgba(255,255,255,0.10);
    pointer-events: none;
  }

  .historietas-list-row:last-child::after {
    display: none;
  }

  .historietas-list-row a:hover {
    background: rgba(255,255,255,0.035);
  }

  .historietas-list-spinner {
    width: 23px;
    height: 23px;
    border: 3px solid rgba(255,255,255,0.16);
    border-top-color: #FFFFFF;
    border-radius: 999px;
    animation: historietas-list-spin 0.75s linear infinite;
  }

  @keyframes historietas-list-spin {
    to { transform: rotate(360deg); }
  }

  @media (min-width: 760px) {
    .historietas-list-row a {
      min-height: 108px !important;
      padding: 10px 0 10px 18px !important;
    }

    .historietas-list-row > button {
      margin-right: 12px !important;
    }

    .historietas-list-row::after {
      left: 98px;
      right: 18px;
    }
  }
`;

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#000000",
  color: "#FFFFFF",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  paddingBottom: "48px",
};


const headerStyle: CSSProperties = {
  background: "#000000",
};

const headerInnerStyle: CSSProperties = {
  width: "min(100%, 920px)",
  minHeight: "72px",
  margin: "0 auto",
  padding: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

const pageTitleStyle: CSSProperties = {
  width: "100%",
  margin: 0,
  color: "#FFFFFF",
  fontSize: "clamp(20px, 4vw, 30px)",
  fontWeight: 900,
  letterSpacing: "-0.035em",
  lineHeight: 1.08,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textAlign: "center",
};

const controlsStyle: CSSProperties = {
  width: "min(100%, 920px)",
  margin: "0 auto",
  padding: "12px 14px 8px",
  display: "grid",
  gap: "10px",
  boxSizing: "border-box",
};

const tabsStyle: CSSProperties = {
  display: "flex",
  gap: "7px",
  overflowX: "auto",
  scrollbarWidth: "none",
  paddingBottom: "2px",
};

const tabStyle: CSSProperties = {
  flex: "0 0 auto",
  minHeight: "38px",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "999px",
  background: "#000000",
  color: "rgba(255,255,255,0.68)",
  padding: "0 12px",
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  fontSize: "12px",
  fontWeight: 850,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const tabActiveStyle: CSSProperties = {
  ...tabStyle,
  background: "#FFFFFF",
  color: "#090909",
  border: "1px solid #FFFFFF",
};

const tabCountStyle: CSSProperties = {
  minWidth: "19px",
  height: "19px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 5px",
  background: "rgba(127,127,127,0.22)",
  fontSize: "10px",
  fontWeight: 950,
};






const listSectionStyle: CSSProperties = {
  width: "min(100%, 920px)",
  margin: "0 auto",
  padding: "0 14px",
  boxSizing: "border-box",
};

const rowsStyle: CSSProperties = {};

const rowMainLinkStyle: CSSProperties = {
  minHeight: "104px",
  padding: "9px 0 9px 4px",
  display: "grid",
  gridTemplateColumns: "62px minmax(0, 1fr)",
  alignItems: "center",
  gap: "12px",
  color: "#FFFFFF",
  textDecoration: "none",
  boxSizing: "border-box",
  transition: "background 120ms ease",
};

const rowAuthorLinkStyle: CSSProperties = {
  ...rowMainLinkStyle,
  gridColumn: "1 / -1",
  paddingRight: "4px",
};

const coverStyle: CSSProperties = {
  width: "62px",
  height: "86px",
  borderRadius: "9px",
  overflow: "hidden",
  background: "#111111",
};

const coverEmptyStyle: CSSProperties = {
  ...coverStyle,
  background:
    "linear-gradient(145deg, rgba(124,58,237,0.28), rgba(249,115,22,0.14)), #111111",
};

const authorAvatarStyle: CSSProperties = {
  width: "62px",
  height: "62px",
  borderRadius: "999px",
  overflow: "hidden",
  background: "#111111",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  fontSize: "24px",
  fontWeight: 950,
};

const authorAvatarEmptyStyle: CSSProperties = {
  ...authorAvatarStyle,
  background:
    "linear-gradient(145deg, rgba(124,58,237,0.34), rgba(249,115,22,0.18)), #111111",
};

const rowTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "5px",
};

const rowTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "clamp(16px, 3.3vw, 18px)",
  fontWeight: 500,
  letterSpacing: "-0.01em",
  lineHeight: 1.2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
};

const rowMetaStyle: CSSProperties = {
  color: "rgba(255,255,255,0.52)",
  fontSize: "14px",
  fontWeight: 450,
  lineHeight: 1.25,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const rowDetailStyle: CSSProperties = {
  color: "rgba(255,255,255,0.72)",
  fontSize: "12px",
  fontWeight: 750,
  lineHeight: 1.3,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const ratingDetailStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  maxWidth: "100%",
};

const ratingStarsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "1px",
  flex: "0 0 auto",
  fontSize: "14px",
  lineHeight: 1,
};

const ratingStarSlotStyle: CSSProperties = {
  position: "relative",
  display: "inline-block",
  width: "1em",
  height: "1em",
  lineHeight: 1,
};

const ratingStarEmptyStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  color: "rgba(255,255,255,0.22)",
  lineHeight: 1,
};

const ratingStarFillClipStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  height: "100%",
  overflow: "hidden",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

const ratingStarFilledStyle: CSSProperties = {
  display: "block",
  width: "1em",
  color: "#F6C453",
  lineHeight: 1,
};

const rowOptionsButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "40px",
  minHeight: "44px",
  alignSelf: "center",
  justifySelf: "stretch",
  margin: 0,
  padding: 0,
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  color: "#FFFFFF",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  position: "relative",
  zIndex: 2,
};

const moreOptionsStyle: CSSProperties = {
  minHeight: "20px",
  minWidth: "10px",
  display: "inline-flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "2.5px",
};

const moreDotStyle: CSSProperties = {
  width: "3px",
  height: "3px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.92)",
  display: "block",
};

const actionSheetOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9998,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  background: "rgba(0,0,0,0.68)",
  overscrollBehavior: "none",
};

const actionSheetStyle: CSSProperties = {
  width: "min(820px, 100%)",
  maxHeight: "calc(100dvh - 90px)",
  overflowY: "auto",
  borderRadius: "24px 24px 0 0",
  background: "#070212",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.42)",
  padding: "8px 0 calc(14px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
};

const actionSheetHandleStyle: CSSProperties = {
  width: "68px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.58)",
  display: "block",
  margin: "0 auto 15px",
};

const actionSheetHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "5px",
  padding: "0 28px 18px",
  textAlign: "center",
};

const actionSheetTitleStyle: CSSProperties = {
  maxWidth: "100%",
  color: "#FFFFFF",
  fontSize: "20px",
  fontWeight: 850,
  lineHeight: 1.15,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const actionSheetMetaStyle: CSSProperties = {
  maxWidth: "100%",
  color: "rgba(255,255,255,0.52)",
  fontSize: "13px",
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const actionSheetActionsStyle: CSSProperties = {
  display: "grid",
};

const actionSheetButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "54px",
  padding: "0 30px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "18px",
  fontSize: "18px",
  fontWeight: 650,
  fontFamily: "inherit",
  textAlign: "left",
  cursor: "pointer",
};

const actionSheetButtonDisabledStyle: CSSProperties = {
  opacity: 0.58,
  cursor: "default",
};

const actionSheetButtonIconStyle: CSSProperties = {
  minWidth: "24px",
  color: "rgba(255,255,255,0.72)",
  fontSize: "22px",
  lineHeight: 1,
  textAlign: "center",
};

const actionSheetSelectionDotStyle: CSSProperties = {
  width: "20px",
  height: "20px",
  borderRadius: "999px",
  border: "2.25px solid rgba(161,161,170,0.72)",
  background: "transparent",
  color: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  boxSizing: "border-box",
  fontSize: "13px",
  lineHeight: 1,
  fontWeight: 900,
};

const actionSheetSelectionDotActiveStyle: CSSProperties = {
  ...actionSheetSelectionDotStyle,
  border: "2px solid #FFFFFF",
  background: "#FFFFFF",
  color: "#111111",
};


const monthGroupStyle: CSSProperties = {
  marginBottom: "12px",
};

const monthTitleStyle: CSSProperties = {
  margin: "14px 0 7px",
  color: "rgba(255,255,255,0.48)",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.08em",
};

const stateStyle: CSSProperties = {
  minHeight: "300px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "9px",
  color: "#FFFFFF",
  textAlign: "center",
  padding: "30px 18px",
};

const stateIconStyle: CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "999px",
  background: "#151515",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  fontWeight: 950,
};

const stateTextStyle: CSSProperties = {
  maxWidth: "430px",
  color: "rgba(255,255,255,0.58)",
  fontSize: "13px",
  fontWeight: 650,
  lineHeight: 1.45,
};

const stateLinkStyle: CSSProperties = {
  marginTop: "5px",
  minHeight: "38px",
  padding: "0 15px",
  borderRadius: "999px",
  background: "#FFFFFF",
  color: "#090909",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 900,
};

const loadMoreButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "48px",
  marginTop: "14px",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "14px",
  background: "#0B0B0B",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 900,
  cursor: "pointer",
};

const footerStyle: CSSProperties = {
  width: "min(100%, 920px)",
  margin: "28px auto 0",
  padding: "0 14px",
  color: "rgba(255,255,255,0.32)",
  fontSize: "10px",
  fontWeight: 750,
  textAlign: "center",
  boxSizing: "border-box",
};