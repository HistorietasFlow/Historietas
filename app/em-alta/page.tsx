"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "../../lib/supabase/client";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { useNotificacoes } from "../../components/NotificacoesProvider";
import {
  criarSlugBase,
  idObraSupabaseValido,
  normalizarTexto,
} from "../../lib/utils";

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
  tipo: "imagem" | "documento" | "texto" | "outro";
  tamanho: number;
  conteudo: string;
  enviadoEm: string;
};

type ObraLocal = {
  id: string;
  titulo: string;
  autor: string;
  autorId?: string;
  autorAvatarRanking?: string;
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
  arquivoObra: ArquivoObraLocal | null;
  totalCurtidasRanking?: number;
  totalComentariosRanking?: number;
  totalSalvosRanking?: number;
  totalViewsRanking?: number;
  totalSeguidoresRanking?: number;
  totalSeguidoresAutorRanking?: number;
  totalAvaliacoesRanking?: number;
  mediaAvaliacoesRanking?: number;
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
  visualizacoes: number | null;
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

type SupabaseInteracaoCapituloRow = {
  capitulo_id: string | null;
};

type SupabaseInteracaoObraRow = {
  obra_id: string | null;
};

type SupabaseAvaliacaoObraRow = {
  obra_id: string | null;
  nota: number | null;
};

type SupabaseProfileAutorRankingRow = {
  id: string | null;
  user_id: string | null;
  nome: string | null;
  avatar_url?: string | null;
  avatar?: string | null;
  foto_url?: string | null;
  imagem_url?: string | null;
  photo_url?: string | null;
} & Record<string, unknown>;

type AvaliacaoRankingObra = {
  total: number;
  media: number;
};

type ObraRanking = {
  id: string;
  storageId: string;
  tipo: "local";
  titulo: string;
  autor: string;
  autorId?: string;
  autorAvatar: string;
  seguidoresAutor: number;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  status: string;
  href: string;
  disponivel: boolean;
  capa: string;
  capaNome: string;
  capitulos: number;
  capitulosLidos: number;
  progressoLeitura: number;
  ultimoCapituloLidoTitulo: string;
  ultimoCapituloLidoHref: string;
  ultimaLeituraEm: string;
  curtidas: number;
  comentarios: number;
  salvos: number;
  views: number;
  avaliacoes: number;
  mediaAvaliacao: number;
  pontuacao: number;
  criadaEmTimestamp: number;
};

type AutorRanking = {
  id: string;
  nome: string;
  autorId: string;
  avatar: string;
  href: string;
  obras: number;
  capitulos: number;
  seguidores: number;
  seguidoresObras: number;
  views: number;
  curtidas: number;
  comentarios: number;
  avaliacoes: number;
  mediaAvaliacao: number;
  pontuacao: number;
};

type TipoRanking =
  | "geral"
  | "lidas"
  | "curtidas"
  | "comentadas"
  | "salvas"
  | "recentes"
  | "capitulos";

const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const VIEWED_WORKS_STORAGE_KEY = "historietas-obras-visualizacoes";
const RATED_WORKS_STORAGE_KEY = "historietas-obras-avaliacoes";
const AUTHOR_PROFILE_STORAGE_KEY = "historietas-perfis-autores";

function normalizarListaIdsEmAlta(valor: unknown) {
  return Array.isArray(valor)
    ? Array.from(
        new Set(
          valor
            .filter((id): id is string => typeof id === "string")
            .map((id) => id.trim())
            .filter(Boolean),
        ),
      )
    : [];
}

function criarStorageKeyUsuarioEmAlta(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : chave;
}

function normalizarChaveAutorEmAlta(valor: string) {
  return valor.trim().replace(/\s+/g, " ").toLowerCase();
}

function adicionarAvatarAutorLocalEmAlta(
  avataresPorAutor: Map<string, string>,
  chave: string,
  avatar: unknown,
) {
  const chaveLimpa = normalizarChaveAutorEmAlta(chave);
  const avatarLimpo = typeof avatar === "string" ? avatar.trim() : "";

  if (!chaveLimpa || !avatarLimpo) {
    return;
  }

  avataresPorAutor.set(chaveLimpa, avatarLimpo);
}

function carregarAvataresAutoresLocaisEmAlta(userIds: string[]) {
  const avataresPorAutor = new Map<string, string>();

  if (typeof window === "undefined") {
    return avataresPorAutor;
  }

  const chavesParaLer = Array.from(
    new Set([
      AUTHOR_PROFILE_STORAGE_KEY,
      ...userIds
        .map((userId) => userId.trim())
        .filter(Boolean)
        .map((userId) =>
          criarStorageKeyUsuarioEmAlta(AUTHOR_PROFILE_STORAGE_KEY, userId),
        ),
    ]),
  );

  chavesParaLer.forEach((chaveStorage) => {
    try {
      const texto = localStorage.getItem(chaveStorage);
      const perfis = texto ? JSON.parse(texto) : null;

      if (!perfis || typeof perfis !== "object" || Array.isArray(perfis)) {
        return;
      }

      Object.entries(perfis as Record<string, unknown>).forEach(
        ([chaveAutor, perfil]) => {
          if (!perfil || typeof perfil !== "object" || Array.isArray(perfil)) {
            return;
          }

          const registro = perfil as Record<string, unknown>;

          adicionarAvatarAutorLocalEmAlta(
            avataresPorAutor,
            chaveAutor,
            registro.avatar ??
              registro.avatar_url ??
              registro.foto_url ??
              registro.imagem_url ??
              registro.photo_url,
          );

          adicionarAvatarAutorLocalEmAlta(
            avataresPorAutor,
            typeof registro.nome === "string" ? registro.nome : "",
            registro.avatar ??
              registro.avatar_url ??
              registro.foto_url ??
              registro.imagem_url ??
              registro.photo_url,
          );
        },
      );
    } catch {
      // Avatar local é só fallback para os cards de autores.
    }
  });

  return avataresPorAutor;
}

function obterAvatarAutorLocalEmAlta(
  avataresPorAutor: Map<string, string>,
  nomeAutor: string,
  autorId: string,
) {
  const chaves = [autorId, nomeAutor, normalizarTexto(nomeAutor)]
    .map((chave) => normalizarChaveAutorEmAlta(chave))
    .filter(Boolean);

  for (const chave of chaves) {
    const avatar = avataresPorAutor.get(chave);

    if (avatar) {
      return avatar;
    }
  }

  return "";
}

function carregarListaIdsLocalEmAlta(chave: string, userId: string) {
  if (typeof window === "undefined" || !userId.trim()) {
    return [];
  }

  try {
    const textoLista = localStorage.getItem(
      criarStorageKeyUsuarioEmAlta(chave, userId),
    );
    const jsonLista: unknown = textoLista ? JSON.parse(textoLista) : [];

    return normalizarListaIdsEmAlta(jsonLista);
  } catch {
    return [];
  }
}

function salvarListaIdsLocalEmAlta(
  chave: string,
  userId: string,
  lista: string[],
) {
  if (typeof window === "undefined" || !userId.trim()) {
    return;
  }

  const listaNormalizada = normalizarListaIdsEmAlta(lista);

  localStorage.setItem(
    criarStorageKeyUsuarioEmAlta(chave, userId),
    JSON.stringify(listaNormalizada),
  );
}

async function carregarIdsColecaoUsuarioSupabaseEmAlta(
  tabela: "favoritos" | "concluidas",
  userId: string,
) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [] as string[];
  }

  try {
    const { data, error } = await supabase
      .from(tabela)
      .select("obra_id")
      .eq("user_id", userIdLimpo)
      .limit(1000);

    if (error || !Array.isArray(data)) {
      if (error) {
        console.warn(
          `Não consegui carregar ${tabela} no Em Alta:`,
          error.message,
        );
      }

      return [] as string[];
    }

    return normalizarListaIdsEmAlta(
      data.map((registro) => {
        if (
          !registro ||
          typeof registro !== "object" ||
          Array.isArray(registro)
        ) {
          return "";
        }

        const obraId = (registro as Record<string, unknown>).obra_id;

        return typeof obraId === "string" ? obraId : "";
      }),
    );
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} no Em Alta:`, error);
    return [] as string[];
  }
}

function obterIdentificadoresObraLocalEmAlta(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">,
) {
  return Array.from(
    new Set(
      [
        obra.id,
        obra.slug,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ]
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  );
}

function obterIdentificadoresRankingObra(
  obra: Pick<ObraRanking, "storageId" | "titulo" | "href">,
) {
  const hrefSlug = obra.href.startsWith("/obra/")
    ? decodeURIComponent(obra.href.replace("/obra/", "").split(/[?#]/)[0] || "")
    : "";

  return Array.from(
    new Set(
      [
        obra.storageId,
        hrefSlug,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ]
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  );
}

function listaTemRankingObra(
  obra: Pick<ObraRanking, "storageId" | "titulo" | "href">,
  lista: string[],
) {
  const listaNormalizada = new Set(
    lista.map((id) => id.trim()).filter(Boolean),
  );

  return obterIdentificadoresRankingObra(obra).some((id) =>
    listaNormalizada.has(id),
  );
}

function removerRankingObraDaLista(
  obra: Pick<ObraRanking, "storageId" | "titulo" | "href">,
  lista: string[],
) {
  const idsObra = new Set(obterIdentificadoresRankingObra(obra));

  return normalizarListaIdsEmAlta(lista).filter((id) => !idsObra.has(id));
}

function adicionarRankingObraNaLista(
  obra: Pick<ObraRanking, "storageId" | "titulo" | "href">,
  lista: string[],
) {
  return normalizarListaIdsEmAlta([
    ...removerRankingObraDaLista(obra, lista),
    obra.storageId,
  ]);
}

async function sincronizarColecaoRankingSupabase(
  tabela: "favoritos" | "concluidas",
  obra: Pick<ObraRanking, "storageId" | "titulo"> | null,
  ativo: boolean,
) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";
    const obraId = obra?.storageId?.trim() || "";

    if (!userId || !obraId || !idObraSupabaseValido(obraId)) {
      return;
    }

    await supabase
      .from(tabela)
      .delete()
      .eq("user_id", userId)
      .eq("obra_id", obraId);

    if (!ativo) {
      return;
    }

    const payloadBase = {
      user_id: userId,
      obra_id: obraId,
    };

    const { error } = await supabase.from(tabela).insert({
      ...payloadBase,
      visibilidade: "parcial",
    });

    if (error) {
      await supabase.from(tabela).insert(payloadBase);
    }
  } catch (error) {
    console.warn(`Não consegui sincronizar ${tabela} pelo Em Alta:`, error);
  }
}

async function registrarColecaoRankingNoDiario(
  tipo: "favoritou_obra" | "concluiu_obra",
  obra: Pick<ObraRanking, "storageId" | "titulo"> | null,
) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";
    const obraId = obra?.storageId?.trim() || "";

    if (!userId || !obraId || !idObraSupabaseValido(obraId)) {
      return;
    }

    const payload = {
      user_id: userId,
      obra_id: obraId,
      tipo,
      texto:
        tipo === "favoritou_obra"
          ? `adicionou ${obra?.titulo || "uma obra"} à lista`
          : `concluiu ${obra?.titulo || "uma obra"}`,
      visibilidade: "parcial",
      metadata: {
        obra_titulo: obra?.titulo || "",
        origem: "em-alta",
      },
    };

    const { error } = await supabase.from("diario_atividades").insert(payload);

    if (error) {
      await supabase.from("diario_atividades").insert({
        user_id: payload.user_id,
        obra_id: payload.obra_id,
        tipo: payload.tipo,
        texto: payload.texto,
        metadata: payload.metadata,
      });
    }
  } catch {
    // O ranking não deve falhar por causa do Diário.
  }
}

function criarLoginHrefEmAlta() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/em-alta";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/em-alta";
  const params = new URLSearchParams({
    redirectTo: destinoSeguro,
  });

  return `/login?${params.toString()}`;
}

function criarHrefLeituraCapitulo(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo" | "publicado">,
  capitulo: CapituloLocal,
  numeroCapitulo: number,
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
    obra.id,
  )}&capituloId=${encodeURIComponent(capitulo.id)}`;
}

function criarLinkPerfilAutorRanking(nomeAutor: string, autorId?: string) {
  const params = new URLSearchParams();
  const nomeAutorLimpo = nomeAutor.trim();

  if (nomeAutorLimpo) {
    params.set("autor", nomeAutorLimpo);
  }

  const autorIdLimpo = autorId?.trim();

  if (autorIdLimpo) {
    params.set("autorId", autorIdLimpo);
    params.set("userId", autorIdLimpo);
  }

  const query = params.toString();

  return query ? `/perfil-autor?${query}` : "/perfil-autor";
}

function obterNomeProfileAutorRanking(
  profile?: SupabaseProfileAutorRankingRow | null,
) {
  return typeof profile?.nome === "string" && profile.nome.trim()
    ? profile.nome.trim()
    : "";
}

function obterAvatarProfileAutorRanking(
  profile?: SupabaseProfileAutorRankingRow | null,
) {
  const candidatos = [
    profile?.avatar_url,
    profile?.avatar,
    profile?.foto_url,
    profile?.imagem_url,
    profile?.photo_url,
  ];

  const avatar = candidatos.find(
    (valor): valor is string =>
      typeof valor === "string" && Boolean(valor.trim()),
  );

  return avatar?.trim() || "";
}

function adicionarProfileAutorRankingNoMapa(
  mapa: Map<string, SupabaseProfileAutorRankingRow>,
  profile: SupabaseProfileAutorRankingRow,
) {
  const userId =
    typeof profile.user_id === "string" ? profile.user_id.trim() : "";
  const id = typeof profile.id === "string" ? profile.id.trim() : "";

  if (userId) {
    mapa.set(userId, profile);
  }

  if (id) {
    mapa.set(id, profile);
  }
}

async function carregarProfilesAutoresRanking(userIds: string[]) {
  const idsUnicos = Array.from(
    new Set(userIds.map((userId) => userId.trim()).filter(Boolean)),
  );
  const profilesPorUsuario = new Map<string, SupabaseProfileAutorRankingRow>();

  if (idsUnicos.length === 0) {
    return profilesPorUsuario;
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,user_id,nome,avatar_url")
      .in("user_id", idsUnicos)
      .limit(1000);

    if (error) {
      console.warn(
        "Não consegui carregar profiles por user_id no ranking:",
        error.message,
      );
    } else {
      ((data || []) as unknown as SupabaseProfileAutorRankingRow[]).forEach(
        (profile) => {
          adicionarProfileAutorRankingNoMapa(profilesPorUsuario, profile);
        },
      );
    }
  } catch (error) {
    console.warn(
      "Não consegui acessar profiles por user_id no ranking:",
      error,
    );
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,user_id,nome,avatar_url")
      .in("id", idsUnicos)
      .limit(1000);

    if (error) {
      console.warn(
        "Não consegui carregar profiles por id no ranking:",
        error.message,
      );
    } else {
      ((data || []) as unknown as SupabaseProfileAutorRankingRow[]).forEach(
        (profile) => {
          adicionarProfileAutorRankingNoMapa(profilesPorUsuario, profile);
        },
      );
    }
  } catch (error) {
    console.warn("Não consegui acessar profiles por id no ranking:", error);
  }

  return profilesPorUsuario;
}

async function buscarSeguidoresAutoresRanking(autorIds: string[]) {
  const idsUnicos = Array.from(
    new Set(autorIds.map((autorId) => autorId.trim()).filter(Boolean)),
  );

  if (idsUnicos.length === 0) {
    return {} as Record<string, number>;
  }

  try {
    const { data, error } = await supabase
      .from("seguindo_usuarios")
      .select("seguido_id")
      .in("seguido_id", idsUnicos)
      .limit(3000);

    if (error || !Array.isArray(data)) {
      if (error) {
        console.warn(
          "Não consegui carregar seguidores dos autores no ranking:",
          error.message,
        );
      }

      return {} as Record<string, number>;
    }

    return data.reduce<Record<string, number>>((contagem, registro) => {
      if (
        !registro ||
        typeof registro !== "object" ||
        Array.isArray(registro)
      ) {
        return contagem;
      }

      const seguidoId = (registro as Record<string, unknown>).seguido_id;
      const autorId = typeof seguidoId === "string" ? seguidoId.trim() : "";

      if (autorId) {
        contagem[autorId] = (contagem[autorId] || 0) + 1;
      }

      return contagem;
    }, {});
  } catch (error) {
    console.warn("Não consegui acessar seguindo_usuarios no ranking:", error);
    return {} as Record<string, number>;
  }
}

function formatarNumero(numero: number) {
  if (!Number.isFinite(numero)) {
    return "0";
  }

  return numero.toLocaleString("pt-BR");
}

function formatarMediaRanking(media: number) {
  if (!Number.isFinite(media) || media <= 0) {
    return "0.0";
  }

  return media.toFixed(1);
}

function normalizarVisualizacoesRanking(valor: unknown) {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return {};
  }

  return Object.entries(valor as Record<string, unknown>).reduce<
    Record<string, number>
  >((visualizacoesNormalizadas, [chave, total]) => {
    const chaveLimpa = chave.trim();
    const totalNumerico =
      typeof total === "number" && Number.isFinite(total) ? total : 0;

    if (chaveLimpa && totalNumerico > 0) {
      visualizacoesNormalizadas[chaveLimpa] = Math.round(totalNumerico);
    }

    return visualizacoesNormalizadas;
  }, {});
}

function obterVisualizacoesRegistradasObra(
  obra: ObraLocal,
  visualizacoesRegistradas: Record<string, number>,
) {
  const chavesObra = [
    obra.id,
    obra.slug,
    criarSlugBase(obra.titulo),
    normalizarTexto(obra.titulo),
  ];

  return chavesObra.reduce((maiorTotal, chave) => {
    const total = visualizacoesRegistradas[chave] || 0;

    return Math.max(maiorTotal, total);
  }, 0);
}

function normalizarAvaliacoesLocaisRanking(valor: unknown) {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return {};
  }

  return Object.entries(valor as Record<string, unknown>).reduce<
    Record<string, number>
  >((avaliacoesNormalizadas, [chave, nota]) => {
    const chaveLimpa = chave.trim();
    const notaNumerica =
      typeof nota === "number" && Number.isFinite(nota)
        ? Math.round(nota * 2) / 2
        : 0;

    if (chaveLimpa && notaNumerica >= 0.5 && notaNumerica <= 5) {
      avaliacoesNormalizadas[chaveLimpa] = notaNumerica;
    }

    return avaliacoesNormalizadas;
  }, {});
}

function obterAvaliacaoLocalRanking(
  obra: ObraLocal,
  avaliacoesLocais: Record<string, number>,
) {
  const chavesObra = [
    obra.id,
    obra.slug,
    criarSlugBase(obra.titulo),
    normalizarTexto(obra.titulo),
  ];

  return chavesObra.reduce((maiorNota, chave) => {
    const nota = avaliacoesLocais[chave] || 0;

    return Math.max(maiorNota, nota);
  }, 0);
}

function formatarDataRanking(timestamp: number) {
  if (!timestamp) {
    return "Sem data";
  }

  const data = new Date(timestamp);

  if (Number.isNaN(data.getTime())) {
    return "Sem data";
  }

  return data.toLocaleDateString("pt-BR");
}

function formatarGeneroCard(genero: string) {
  const generoLimpo = genero.trim();

  if (normalizarTexto(generoLimpo) === "fantasia sombria") {
    return "Fantasia";
  }

  return generoLimpo || "Não informado";
}

function calcularCapitulosLidos(capitulos: CapituloLocal[]) {
  return capitulos.filter((capitulo) => capitulo.lido).length;
}

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  return Math.round(
    (calcularCapitulosLidos(capitulos) / capitulos.length) * 100,
  );
}

function normalizarTipoArquivoSupabase(
  tipo: string | null,
): ArquivoObraLocal["tipo"] {
  if (
    tipo === "imagem" ||
    tipo === "documento" ||
    tipo === "texto" ||
    tipo === "outro"
  ) {
    return tipo;
  }

  return "outro";
}

function contarPorCapitulo(linhas: SupabaseInteracaoCapituloRow[]) {
  return linhas.reduce<Record<string, number>>((contagem, linha) => {
    const capituloId = linha.capitulo_id?.trim();

    if (!capituloId) {
      return contagem;
    }

    contagem[capituloId] = (contagem[capituloId] || 0) + 1;

    return contagem;
  }, {});
}

function contarPorObra(linhas: SupabaseInteracaoObraRow[]) {
  return linhas.reduce<Record<string, number>>((contagem, linha) => {
    const obraId = linha.obra_id?.trim();

    if (!obraId) {
      return contagem;
    }

    contagem[obraId] = (contagem[obraId] || 0) + 1;

    return contagem;
  }, {});
}

function calcularAvaliacoesPorObra(linhas: SupabaseAvaliacaoObraRow[]) {
  const somaPorObra: Record<string, number> = {};
  const totalPorObra: Record<string, number> = {};

  linhas.forEach((linha) => {
    const obraId = linha.obra_id?.trim();
    const nota =
      typeof linha.nota === "number" && Number.isFinite(linha.nota)
        ? linha.nota
        : 0;

    if (!obraId || nota <= 0) {
      return;
    }

    somaPorObra[obraId] = (somaPorObra[obraId] || 0) + nota;
    totalPorObra[obraId] = (totalPorObra[obraId] || 0) + 1;
  });

  return Object.entries(totalPorObra).reduce<
    Record<string, AvaliacaoRankingObra>
  >((avaliacoes, [obraId, total]) => {
    const soma = somaPorObra[obraId] || 0;

    avaliacoes[obraId] = {
      total,
      media: total > 0 ? soma / total : 0,
    };

    return avaliacoes;
  }, {});
}

async function buscarContagemInteracoesObras(
  tabela: "obra_curtidas" | "seguindo_obras" | "favoritos",
  obraIds: string[],
) {
  if (obraIds.length === 0) {
    return {};
  }

  try {
    const { data, error } = await supabase
      .from(tabela)
      .select("obra_id")
      .in("obra_id", obraIds)
      .limit(3000);

    if (error) {
      console.warn(`Não consegui carregar ${tabela}:`, error.message);
      return {};
    }

    return contarPorObra((data || []) as unknown as SupabaseInteracaoObraRow[]);
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} agora:`, error);
    return {};
  }
}

async function buscarAvaliacoesObras(obraIds: string[]) {
  if (obraIds.length === 0) {
    return {};
  }

  try {
    const { data, error } = await supabase
      .from("obra_avaliacoes")
      .select("obra_id, nota")
      .in("obra_id", obraIds)
      .limit(3000);

    if (error) {
      console.warn("Não consegui carregar obra_avaliacoes:", error.message);
      return {};
    }

    return calcularAvaliacoesPorObra(
      (data || []) as unknown as SupabaseAvaliacaoObraRow[],
    );
  } catch (error) {
    console.warn("Não consegui acessar obra_avaliacoes agora:", error);
    return {};
  }
}

async function buscarContagemInteracoesCapitulos(
  tabela: "curtidas_capitulos" | "salvos_capitulos" | "comentarios_capitulos",
  capituloIds: string[],
) {
  if (capituloIds.length === 0) {
    return {};
  }

  try {
    const { data, error } = await supabase
      .from(tabela)
      .select("capitulo_id")
      .in("capitulo_id", capituloIds)
      .limit(5000);

    if (error) {
      console.warn(`Não consegui carregar ${tabela}:`, error.message);
      return {};
    }

    return contarPorCapitulo(
      (data || []) as unknown as SupabaseInteracaoCapituloRow[],
    );
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} agora:`, error);
    return {};
  }
}

function somarContagensCapitulos(
  capitulos: SupabaseCapituloRow[],
  contagem: Record<string, number>,
) {
  return capitulos.reduce((total, capitulo) => {
    return total + (contagem[capitulo.id] || 0);
  }, 0);
}

function converterObraSupabaseParaLocal(
  obra: SupabaseObraRow,
  capitulos: SupabaseCapituloRow[],
  obraLocal: ObraLocal | undefined,
  index: number,
  curtidasPorCapitulo: Record<string, number>,
  salvosPorCapitulo: Record<string, number>,
  comentariosPorCapitulo: Record<string, number>,
  curtidasPorObra: Record<string, number>,
  seguidoresPorObra: Record<string, number>,
  favoritosPorObra: Record<string, number>,
  avaliacoesPorObra: Record<string, AvaliacaoRankingObra>,
  profilesAutores: Map<string, SupabaseProfileAutorRankingRow>,
  seguidoresAutores: Record<string, number>,
  avataresLocaisAutores: Map<string, string>,
): ObraLocal {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo]),
  );

  const capitulosNormalizados = capitulos.map((capitulo, capituloIndex) => {
    const capituloLocal = capitulosLocaisPorId.get(capitulo.id);
    const totalCurtidas = curtidasPorCapitulo[capitulo.id] || 0;
    const totalSalvos = salvosPorCapitulo[capitulo.id] || 0;
    const totalComentarios = comentariosPorCapitulo[capitulo.id] || 0;

    return {
      id: capitulo.id,
      titulo:
        capitulo.titulo?.trim() ||
        capituloLocal?.titulo ||
        `Capítulo ${capituloIndex + 1}`,
      texto: capituloLocal?.texto || "",
      curtiu: Boolean(capituloLocal?.curtiu) || totalCurtidas > 0,
      salvo: Boolean(capituloLocal?.salvo) || totalSalvos > 0,
      comentario:
        capituloLocal?.comentario ||
        (totalComentarios > 0 ? `${totalComentarios} comentário(s)` : ""),
      criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
      lido: Boolean(capituloLocal?.lido),
      lidoEm: capituloLocal?.lidoEm || "",
    } satisfies CapituloLocal;
  });

  const capitulosRemotosIds = new Set(
    capitulosNormalizados.map((capitulo) => capitulo.id),
  );
  const capitulosApenasLocais = (obraLocal?.capitulos || []).filter(
    (capitulo) => !capitulosRemotosIds.has(capitulo.id),
  );
  const capitulosMesclados = [
    ...capitulosNormalizados,
    ...capitulosApenasLocais,
  ];
  const titulo = obra.titulo?.trim() || obraLocal?.titulo || "Obra sem título";
  const slug =
    obra.slug?.trim() ||
    obraLocal?.slug ||
    criarSlugBase(titulo || `obra-${index + 1}`);
  const arquivoUrl = obra.arquivo_url?.trim() || "";
  const arquivoTipo = normalizarTipoArquivoSupabase(obra.arquivo_categoria);
  const totalCurtidasCapitulos = somarContagensCapitulos(
    capitulos,
    curtidasPorCapitulo,
  );
  const totalComentariosCapitulos = somarContagensCapitulos(
    capitulos,
    comentariosPorCapitulo,
  );
  const totalSalvosCapitulos = somarContagensCapitulos(
    capitulos,
    salvosPorCapitulo,
  );
  const totalCurtidasObra = curtidasPorObra[obra.id] || 0;
  const totalSeguidoresObra = seguidoresPorObra[obra.id] || 0;
  const totalFavoritosObra = favoritosPorObra[obra.id] || 0;
  const avaliacaoObra = avaliacoesPorObra[obra.id] || { total: 0, media: 0 };
  const autorId = obra.user_id?.trim() || obraLocal?.autorId || "";
  const profileAutor = autorId ? profilesAutores.get(autorId) || null : null;
  const nomeAutorProfile = obterNomeProfileAutorRanking(profileAutor);
  const nomeAutorObra = obra.autor?.trim() || obraLocal?.autor || "";
  const nomeAutor = nomeAutorProfile || nomeAutorObra || "Autor não informado";
  const avatarAutor =
    obterAvatarProfileAutorRanking(profileAutor) ||
    obterAvatarAutorLocalEmAlta(avataresLocaisAutores, nomeAutor, autorId) ||
    obterAvatarAutorLocalEmAlta(
      avataresLocaisAutores,
      nomeAutorObra,
      autorId,
    ) ||
    obraLocal?.autorAvatarRanking ||
    "";
  const totalSeguidoresAutor = autorId
    ? seguidoresAutores[autorId] || obraLocal?.totalSeguidoresAutorRanking || 0
    : obraLocal?.totalSeguidoresAutorRanking || 0;

  return {
    id: obra.id || obraLocal?.id || `obra-${index + 1}`,
    titulo,
    autor: nomeAutor,
    autorId,
    autorAvatarRanking: avatarAutor,
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
        ? obra.tags.filter(
            (tag) => typeof tag === "string" && Boolean(tag.trim()),
          )
        : obraLocal?.tags || ["sem tags"],
    capa: obra.capa_url?.trim() || obraLocal?.capa || "",
    capaNome: obra.capa_nome?.trim() || obraLocal?.capaNome || "",
    publicado: Boolean(obra.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obra.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    slug,
    link: obra.link?.trim() || obraLocal?.link || `/obra/${slug}`,
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
          enviadoEm: obra.criada_em || obraLocal?.arquivoObra?.enviadoEm || "",
        }
      : obraLocal?.arquivoObra || null,
    totalCurtidasRanking: Math.max(
      obraLocal?.totalCurtidasRanking || 0,
      totalCurtidasObra + totalCurtidasCapitulos,
    ),
    totalComentariosRanking: Math.max(
      obraLocal?.totalComentariosRanking || 0,
      totalComentariosCapitulos,
    ),
    totalSalvosRanking: Math.max(
      obraLocal?.totalSalvosRanking || 0,
      totalSalvosCapitulos + totalSeguidoresObra + totalFavoritosObra,
    ),
    totalViewsRanking: Math.max(
      obraLocal?.totalViewsRanking || 0,
      typeof obra.visualizacoes === "number" &&
        Number.isFinite(obra.visualizacoes)
        ? obra.visualizacoes
        : 0,
    ),
    totalSeguidoresRanking: Math.max(
      obraLocal?.totalSeguidoresRanking || 0,
      totalSeguidoresObra,
    ),
    totalSeguidoresAutorRanking: Math.max(
      obraLocal?.totalSeguidoresAutorRanking || 0,
      totalSeguidoresAutor,
    ),
    totalAvaliacoesRanking: Math.max(
      obraLocal?.totalAvaliacoesRanking || 0,
      avaliacaoObra.total,
    ),
    mediaAvaliacoesRanking: Math.max(
      obraLocal?.mediaAvaliacoesRanking || 0,
      avaliacaoObra.media,
    ),
  };
}

async function carregarObrasSupabasePublicadas(obrasLocais: ObraLocal[]) {
  try {
    const { data: obrasBanco, error: erroObras } = await supabase
      .from("obras")
      .select(
        "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,visualizacoes,publicado,slug,link,criada_em,atualizado_em",
      )
      .eq("publicado", true)
      .order("criada_em", { ascending: false })
      .limit(80);

    if (erroObras) {
      console.warn(
        "Não consegui carregar obras publicadas do Supabase:",
        erroObras.message,
      );
      return [] as ObraLocal[];
    }

    const obrasSupabase = (obrasBanco || []) as unknown as SupabaseObraRow[];

    if (obrasSupabase.length === 0) {
      return [] as ObraLocal[];
    }

    const obraIds = obrasSupabase.map((obra) => obra.id).filter(Boolean);
    const autorIds = obrasSupabase
      .map((obra) => obra.user_id?.trim() || "")
      .filter(Boolean);
    const avataresLocaisAutores = carregarAvataresAutoresLocaisEmAlta(autorIds);

    const { data: capitulosBanco, error: erroCapitulos } = await supabase
      .from("capitulos")
      .select(
        "id,obra_id,user_id,titulo,ordem,publicado,criado_em,atualizado_em",
      )
      .in("obra_id", obraIds)
      .eq("publicado", true)
      .order("ordem", { ascending: true })
      .limit(600);

    if (erroCapitulos) {
      console.warn(
        "Não consegui carregar capítulos publicados do ranking:",
        erroCapitulos.message,
      );
    }

    const capitulosSupabase = erroCapitulos
      ? []
      : ((capitulosBanco || []) as unknown as SupabaseCapituloRow[]);
    const capituloIds = capitulosSupabase
      .map((capitulo) => capitulo.id)
      .filter(Boolean);

    const [
      curtidasPorCapitulo,
      salvosPorCapitulo,
      comentariosPorCapitulo,
      curtidasPorObra,
      seguidoresPorObra,
      favoritosPorObra,
      avaliacoesPorObra,
      profilesAutores,
      seguidoresAutores,
    ] = await Promise.all([
      buscarContagemInteracoesCapitulos("curtidas_capitulos", capituloIds),
      buscarContagemInteracoesCapitulos("salvos_capitulos", capituloIds),
      buscarContagemInteracoesCapitulos("comentarios_capitulos", capituloIds),
      buscarContagemInteracoesObras("obra_curtidas", obraIds),
      buscarContagemInteracoesObras("seguindo_obras", obraIds),
      buscarContagemInteracoesObras("favoritos", obraIds),
      buscarAvaliacoesObras(obraIds),
      carregarProfilesAutoresRanking(autorIds),
      buscarSeguidoresAutoresRanking(autorIds),
    ]);

    const capitulosPorObra = capitulosSupabase.reduce<
      Record<string, SupabaseCapituloRow[]>
    >((grupos, capitulo) => {
      if (!grupos[capitulo.obra_id]) {
        grupos[capitulo.obra_id] = [];
      }

      grupos[capitulo.obra_id].push(capitulo);

      return grupos;
    }, {});

    const obrasLocaisPorId = new Map(
      obrasLocais.map((obra) => [obra.id, obra]),
    );
    const obrasLocaisPorSlug = new Map(
      obrasLocais.map((obra) => [obra.slug, obra]),
    );

    return obrasSupabase.map((obra, index) => {
      const slug =
        obra.slug?.trim() || criarSlugBase(obra.titulo || `obra-${index + 1}`);
      const obraLocal =
        obrasLocaisPorId.get(obra.id) || obrasLocaisPorSlug.get(slug);

      return converterObraSupabaseParaLocal(
        obra,
        capitulosPorObra[obra.id] || [],
        obraLocal,
        index,
        curtidasPorCapitulo,
        salvosPorCapitulo,
        comentariosPorCapitulo,
        curtidasPorObra,
        seguidoresPorObra,
        favoritosPorObra,
        avaliacoesPorObra,
        profilesAutores,
        seguidoresAutores,
        avataresLocaisAutores,
      );
    });
  } catch (error) {
    console.warn("Não consegui acessar o Supabase no Em Alta agora:", error);
    return [] as ObraLocal[];
  }
}

function encontrarCapituloParaContinuar(obra: ObraLocal) {
  const capituloRegistrado = obra.ultimoCapituloLidoId
    ? obra.capitulos.find(
        (capitulo) => capitulo.id === obra.ultimoCapituloLidoId,
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

function criarRankingCoverStyle(
  capa: string,
  isDesktop = false,
  _posicao = 5,
): CSSProperties {
  const baseStyle = isDesktop ? desktopCoverStyle : coverStyle;

  if (!capa) {
    return {
      ...baseStyle,
      backgroundColor: "#04000A",
      backgroundImage: "linear-gradient(135deg, #08030F 0%, #04000A 100%)",
      border: "none",
    };
  }

  return {
    ...baseStyle,
    backgroundColor: "#04000A",
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    border: "none",
  };
}

function ordenarRanking(lista: ObraRanking[], tipo: TipoRanking) {
  const novaLista = [...lista];

  if (tipo === "geral") {
    return novaLista.sort((obraA, obraB) => obraB.pontuacao - obraA.pontuacao);
  }

  if (tipo === "lidas") {
    return novaLista.sort((obraA, obraB) => obraB.views - obraA.views);
  }

  if (tipo === "curtidas") {
    return novaLista.sort((obraA, obraB) => obraB.curtidas - obraA.curtidas);
  }

  if (tipo === "comentadas") {
    return novaLista.sort(
      (obraA, obraB) => obraB.comentarios - obraA.comentarios,
    );
  }

  if (tipo === "salvas") {
    return novaLista.sort((obraA, obraB) => obraB.salvos - obraA.salvos);
  }

  if (tipo === "recentes") {
    return novaLista.sort(
      (obraA, obraB) => obraB.criadaEmTimestamp - obraA.criadaEmTimestamp,
    );
  }

  if (tipo === "capitulos") {
    return novaLista.sort((obraA, obraB) => obraB.capitulos - obraA.capitulos);
  }

  return novaLista;
}

function pegarTopRanking(lista: ObraRanking[], tipo: TipoRanking) {
  return ordenarRanking(lista, tipo).slice(0, 5);
}

function rankingTemInteracaoReal(obra: ObraRanking) {
  return (
    obra.views > 0 ||
    obra.curtidas > 0 ||
    obra.comentarios > 0 ||
    obra.salvos > 0 ||
    obra.avaliacoes > 0 ||
    obra.mediaAvaliacao > 0
  );
}

function criarDecoracaoPaginaStyle(index: number): CSSProperties {
  const posicoes: CSSProperties[] = [
    {
      top: "32%",
      right: "-18px",
      fontSize: "72px",
      transform: "rotate(-14deg)",
    },
    { top: "64%", left: "-16px", fontSize: "58px", transform: "rotate(12deg)" },
  ];

  return {
    position: "absolute",
    color: "rgba(139, 92, 246, 0.18)",
    opacity: 0.035,
    lineHeight: 1,
    fontWeight: 950,
    filter: "none",
    userSelect: "none",
    ...posicoes[index % posicoes.length],
  };
}

export default function EmAltaPage() {
  const router = useRouter();
  const [obrasLocais, setObrasLocais] = useState<ObraLocal[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [visualizacoesRegistradas, setVisualizacoesRegistradas] = useState<
    Record<string, number>
  >({});
  const [avaliacoesLocaisRegistradas, setAvaliacoesLocaisRegistradas] =
    useState<Record<string, number>>({});
  const [isDesktop, setIsDesktop] = useState(false);
  const [carregandoRanking, setCarregandoRanking] = useState(true);
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [usuarioLogadoId, setUsuarioLogadoId] = useState("");
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { notificacoesNaoLidas } = useNotificacoes();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const atualizarModoDesktop = () => {
      setIsDesktop(mediaQuery.matches);
    };

    const atualizarModoDesktopTimer = window.setTimeout(
      atualizarModoDesktop,
      0,
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
  }, [usuarioLogadoId]);

  useEffect(() => {
    let ativo = true;

    async function verificarUsuarioLogado() {
      try {
        const { data } = await supabase.auth.getUser();

        window.setTimeout(() => {
          if (ativo) {
            setUsuarioLogado(Boolean(data.user));
            setUsuarioLogadoId(data.user?.id || "");
          }
        }, 0);
      } catch {
        window.setTimeout(() => {
          if (ativo) {
            setUsuarioLogado(false);
            setUsuarioLogadoId("");
          }
        }, 0);
      }
    }

    void verificarUsuarioLogado();

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregarRanking() {
      window.setTimeout(() => {
        if (!cancelado) {
          setCarregandoRanking(true);
        }
      }, 0);

      try {
        const obrasNormalizadas: ObraLocal[] = [];
        let userIdAtual = usuarioLogadoId;

        if (!userIdAtual) {
          try {
            const { data } = await supabase.auth.getUser();
            userIdAtual = data.user?.id || "";
          } catch {
            userIdAtual = "";
          }
        }

        const [favoritosSupabase, concluidasSupabase] = await Promise.all([
          carregarIdsColecaoUsuarioSupabaseEmAlta("favoritos", userIdAtual),
          carregarIdsColecaoUsuarioSupabaseEmAlta("concluidas", userIdAtual),
        ]);

        const obrasFavoritasNormalizadas = normalizarListaIdsEmAlta([
          ...carregarListaIdsLocalEmAlta(FAVORITES_STORAGE_KEY, userIdAtual),
          ...favoritosSupabase,
        ]);

        const obrasConcluidasNormalizadas = normalizarListaIdsEmAlta([
          ...carregarListaIdsLocalEmAlta(COMPLETED_STORAGE_KEY, userIdAtual),
          ...concluidasSupabase,
        ]);

        salvarListaIdsLocalEmAlta(
          FAVORITES_STORAGE_KEY,
          userIdAtual,
          obrasFavoritasNormalizadas,
        );
        salvarListaIdsLocalEmAlta(
          COMPLETED_STORAGE_KEY,
          userIdAtual,
          obrasConcluidasNormalizadas,
        );

        const visualizacoesTexto = localStorage.getItem(
          criarStorageKeyUsuarioEmAlta(VIEWED_WORKS_STORAGE_KEY, userIdAtual),
        );
        const visualizacoesJson = visualizacoesTexto
          ? JSON.parse(visualizacoesTexto)
          : {};
        const visualizacoesNormalizadas =
          normalizarVisualizacoesRanking(visualizacoesJson);

        const avaliacoesLocaisTexto = localStorage.getItem(
          criarStorageKeyUsuarioEmAlta(RATED_WORKS_STORAGE_KEY, userIdAtual),
        );
        const avaliacoesLocaisJson = avaliacoesLocaisTexto
          ? JSON.parse(avaliacoesLocaisTexto)
          : {};
        const avaliacoesLocaisNormalizadas =
          normalizarAvaliacoesLocaisRanking(avaliacoesLocaisJson);

        window.setTimeout(() => {
          if (!cancelado) {
            setUsuarioLogado(Boolean(userIdAtual));
            setUsuarioLogadoId(userIdAtual);
            setObrasLocais(obrasNormalizadas);
            setObrasFavoritas(obrasFavoritasNormalizadas);
            setObrasConcluidas(obrasConcluidasNormalizadas);
            setVisualizacoesRegistradas(visualizacoesNormalizadas);
            setAvaliacoesLocaisRegistradas(avaliacoesLocaisNormalizadas);
          }
        }, 0);

        const obrasComSupabase =
          await carregarObrasSupabasePublicadas(obrasNormalizadas);

        window.setTimeout(() => {
          if (!cancelado) {
            setObrasLocais(obrasComSupabase);
          }
        }, 0);
      } catch {
        window.setTimeout(() => {
          if (!cancelado) {
            setObrasLocais([]);
            setObrasFavoritas([]);
            setObrasConcluidas([]);
            setVisualizacoesRegistradas({});
            setAvaliacoesLocaisRegistradas({});
          }
        }, 0);
      } finally {
        window.setTimeout(() => {
          if (!cancelado) {
            setCarregandoRanking(false);
          }
        }, 0);
      }
    }

    void carregarRanking();

    return () => {
      cancelado = true;
    };
  }, []);

  const ranking = useMemo<ObraRanking[]>(() => {
    return obrasLocais
      .filter((obra) => obra.publicado)
      .map((obra) => {
        const totalCurtidasLocais = obra.capitulos.filter(
          (capitulo) => capitulo.curtiu,
        ).length;

        const totalComentariosLocais = obra.capitulos.filter((capitulo) =>
          capitulo.comentario.trim(),
        ).length;

        const totalSalvosLocais = obra.capitulos.filter(
          (capitulo) => capitulo.salvo,
        ).length;

        const totalCurtidas = Math.max(
          totalCurtidasLocais,
          obra.totalCurtidasRanking || 0,
        );
        const totalComentarios = Math.max(
          totalComentariosLocais,
          obra.totalComentariosRanking || 0,
        );
        const totalSalvos = Math.max(
          totalSalvosLocais,
          obra.totalSalvosRanking || 0,
          obra.totalSeguidoresRanking || 0,
        );
        const avaliacaoLocalObra = obterAvaliacaoLocalRanking(
          obra,
          avaliacoesLocaisRegistradas,
        );
        const totalAvaliacoes = Math.max(
          0,
          obra.totalAvaliacoesRanking || 0,
          avaliacaoLocalObra > 0 ? 1 : 0,
        );
        const mediaAvaliacoes = Math.max(
          0,
          Math.min(
            5,
            Math.max(obra.mediaAvaliacoesRanking || 0, avaliacaoLocalObra),
          ),
        );

        const visualizacoesRegistradasObra = obterVisualizacoesRegistradasObra(
          obra,
          visualizacoesRegistradas,
        );
        const capitulosLidos = Math.max(
          calcularCapitulosLidos(obra.capitulos),
          obra.totalViewsRanking || 0,
          visualizacoesRegistradasObra,
        );
        const progressoLeitura = calcularProgressoLeitura(obra.capitulos);
        const capituloParaContinuar = encontrarCapituloParaContinuar(obra);
        const ultimoCapituloLidoTitulo = capituloParaContinuar
          ? capituloParaContinuar.titulo
          : "";
        const indiceCapituloParaContinuar = capituloParaContinuar
          ? obra.capitulos.findIndex(
              (capitulo) => capitulo.id === capituloParaContinuar.id,
            )
          : -1;
        const numeroCapituloParaContinuar =
          indiceCapituloParaContinuar >= 0
            ? indiceCapituloParaContinuar + 1
            : 1;
        const ultimoCapituloLidoHref = capituloParaContinuar
          ? criarHrefLeituraCapitulo(
              obra,
              capituloParaContinuar,
              numeroCapituloParaContinuar,
            )
          : "";
        const ultimaLeituraEm =
          obra.ultimaLeituraEm || capituloParaContinuar?.lidoEm || "";

        const criadaEmTimestamp = new Date(obra.criadaEm).getTime();
        const dataValida = Number.isNaN(criadaEmTimestamp)
          ? 0
          : criadaEmTimestamp;

        const pontuacao =
          obra.capitulos.length * 1 +
          totalCurtidas * 2 +
          totalComentarios * 3 +
          totalSalvos * 4 +
          capitulosLidos * 1 +
          totalAvaliacoes * 4 +
          Math.round(mediaAvaliacoes * 4);

        return {
          id: `local-${obra.id}`,
          storageId: obra.id,
          tipo: "local",
          titulo: obra.titulo,
          autor: obra.autor,
          autorId: obra.autorId || "",
          autorAvatar: obra.autorAvatarRanking || "",
          seguidoresAutor: obra.totalSeguidoresAutorRanking || 0,
          genero: obra.genero,
          formato: obra.formato,
          classificacaoIndicativa: obra.classificacaoIndicativa,
          status: "Publicado",
          href: obra.link || `/obra/${obra.slug}`,
          disponivel: true,
          capa: obra.capa,
          capaNome: obra.capaNome,
          capitulos: obra.capitulos.length,
          capitulosLidos,
          progressoLeitura,
          ultimoCapituloLidoTitulo,
          ultimoCapituloLidoHref,
          ultimaLeituraEm,
          curtidas: totalCurtidas,
          comentarios: totalComentarios,
          salvos: totalSalvos,
          views: capitulosLidos,
          avaliacoes: totalAvaliacoes,
          mediaAvaliacao: mediaAvaliacoes,
          pontuacao,
          criadaEmTimestamp: dataValida,
        } satisfies ObraRanking;
      });
  }, [avaliacoesLocaisRegistradas, obrasLocais, visualizacoesRegistradas]);

  const rankingAutores = useMemo<AutorRanking[]>(() => {
    type AutorRankingAcumulado = AutorRanking & {
      somaNotas: number;
      pesoNotas: number;
    };

    const autoresPorChave = new Map<string, AutorRankingAcumulado>();

    ranking.forEach((obra) => {
      const nome = obra.autor.trim();
      const nomeNormalizado = normalizarTexto(nome);

      if (!nome || nomeNormalizado === "autor nao informado") {
        return;
      }

      const autorId = obra.autorId?.trim() || "";
      const chave = autorId || `nome:${nomeNormalizado}`;
      const pesoNota =
        obra.avaliacoes > 0 ? obra.avaliacoes : obra.mediaAvaliacao > 0 ? 1 : 0;
      const existente = autoresPorChave.get(chave);

      if (!existente) {
        autoresPorChave.set(chave, {
          id: chave,
          nome,
          autorId,
          avatar: obra.autorAvatar,
          href: criarLinkPerfilAutorRanking(nome, autorId),
          obras: 1,
          capitulos: obra.capitulos,
          seguidores: obra.seguidoresAutor,
          seguidoresObras: obra.salvos,
          views: obra.views,
          curtidas: obra.curtidas,
          comentarios: obra.comentarios,
          avaliacoes: obra.avaliacoes,
          mediaAvaliacao: 0,
          pontuacao: 0,
          somaNotas: obra.mediaAvaliacao * pesoNota,
          pesoNotas: pesoNota,
        });

        return;
      }

      existente.obras += 1;
      existente.capitulos += obra.capitulos;
      existente.seguidores = Math.max(
        existente.seguidores,
        obra.seguidoresAutor,
      );
      existente.seguidoresObras += obra.salvos;
      existente.views += obra.views;
      existente.curtidas += obra.curtidas;
      existente.comentarios += obra.comentarios;
      existente.avaliacoes += obra.avaliacoes;
      existente.somaNotas += obra.mediaAvaliacao * pesoNota;
      existente.pesoNotas += pesoNota;

      if (!existente.avatar && obra.autorAvatar) {
        existente.avatar = obra.autorAvatar;
      }

      if (!existente.autorId && autorId) {
        existente.autorId = autorId;
        existente.href = criarLinkPerfilAutorRanking(existente.nome, autorId);
      }
    });

    return Array.from(autoresPorChave.values())
      .map((autor) => {
        const mediaAvaliacao =
          autor.pesoNotas > 0 ? autor.somaNotas / autor.pesoNotas : 0;
        const pontuacao =
          autor.obras * 1 +
          autor.capitulos * 1 +
          autor.seguidores * 4 +
          autor.seguidoresObras * 4 +
          autor.views * 1 +
          autor.curtidas * 2 +
          autor.comentarios * 3 +
          autor.avaliacoes * 4 +
          Math.round(mediaAvaliacao * 4);

        const {
          somaNotas: _somaNotas,
          pesoNotas: _pesoNotas,
          ...autorFinal
        } = autor;
        void _somaNotas;
        void _pesoNotas;

        return {
          ...autorFinal,
          mediaAvaliacao,
          pontuacao,
        };
      })
      .sort((autorA, autorB) => {
        if (autorB.pontuacao !== autorA.pontuacao) {
          return autorB.pontuacao - autorA.pontuacao;
        }

        if (autorB.views !== autorA.views) {
          return autorB.views - autorA.views;
        }

        return autorA.nome.localeCompare(autorB.nome, "pt-BR");
      })
      .slice(0, 5);
  }, [ranking]);

  const obrasFavoritasProtegidas = usuarioLogado ? obrasFavoritas : [];
  const obrasConcluidasProtegidas = usuarioLogado ? obrasConcluidas : [];

  const rankingGeral = useMemo(
    () => pegarTopRanking(ranking, "geral"),
    [ranking],
  );

  const rankingMaisLidas = useMemo(
    () => pegarTopRanking(ranking, "lidas"),
    [ranking],
  );

  const rankingMaisCurtidas = useMemo(
    () => pegarTopRanking(ranking, "curtidas"),
    [ranking],
  );

  const rankingMaisComentadas = useMemo(
    () => pegarTopRanking(ranking, "comentadas"),
    [ranking],
  );

  const rankingMaisSalvas = useMemo(
    () => pegarTopRanking(ranking, "salvas"),
    [ranking],
  );

  const rankingMaisRecentes = useMemo(
    () => pegarTopRanking(ranking, "recentes"),
    [ranking],
  );

  const rankingMaisCapitulos = useMemo(
    () => pegarTopRanking(ranking, "capitulos"),
    [ranking],
  );

  const rankingTemAtividadeReal = useMemo(() => {
    return ranking.some((obra) => rankingTemInteracaoReal(obra));
  }, [ranking]);

  const rankingParaCatalogoInicial = useMemo(() => {
    return rankingMaisRecentes.length > 0 ? rankingMaisRecentes : rankingGeral;
  }, [rankingGeral, rankingMaisRecentes]);

  const tituloCabecalho = carregandoRanking
    ? "ISTORIETAS"
    : rankingTemAtividadeReal
      ? "ISTORIETAS POPULARES"
      : "ISTORIETAS PUBLICADAS";

  function avisarLoginRanking() {
    router.push(criarLoginHrefEmAlta());
  }

  async function usuarioTemSessaoAtiva() {
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id || "";
      const logado = Boolean(userId);

      setUsuarioLogado(logado);
      setUsuarioLogadoId(userId);

      return logado;
    } catch {
      setUsuarioLogado(false);
      setUsuarioLogadoId("");

      return false;
    }
  }

  async function alternarFavorito(obraId: string) {
    const logado = await usuarioTemSessaoAtiva();

    if (!logado) {
      avisarLoginRanking();
      return;
    }

    const obraRanking =
      ranking.find((obra) => {
        return obra.storageId === obraId || obra.id === obraId;
      }) || null;

    const obraVaiFicarFavorita = obraRanking
      ? !listaTemRankingObra(obraRanking, obrasFavoritas)
      : !obrasFavoritas.includes(obraId);

    const novasObrasFavoritas = obraRanking
      ? obraVaiFicarFavorita
        ? adicionarRankingObraNaLista(obraRanking, obrasFavoritas)
        : removerRankingObraDaLista(obraRanking, obrasFavoritas)
      : obraVaiFicarFavorita
        ? normalizarListaIdsEmAlta([...obrasFavoritas, obraId])
        : obrasFavoritas.filter((id) => id !== obraId);

    salvarListaIdsLocalEmAlta(
      FAVORITES_STORAGE_KEY,
      usuarioLogadoId,
      novasObrasFavoritas,
    );

    setObrasFavoritas(novasObrasFavoritas);

    void sincronizarColecaoRankingSupabase(
      "favoritos",
      obraRanking,
      obraVaiFicarFavorita,
    );

    if (obraVaiFicarFavorita) {
      void registrarColecaoRankingNoDiario("favoritou_obra", obraRanking);
    }
  }

  async function alternarConcluido(obraId: string) {
    const logado = await usuarioTemSessaoAtiva();

    if (!logado) {
      avisarLoginRanking();
      return;
    }

    const obraRanking =
      ranking.find((obra) => {
        return obra.storageId === obraId || obra.id === obraId;
      }) || null;

    const obraVaiFicarConcluida = obraRanking
      ? !listaTemRankingObra(obraRanking, obrasConcluidas)
      : !obrasConcluidas.includes(obraId);

    const novasObrasConcluidas = obraRanking
      ? obraVaiFicarConcluida
        ? adicionarRankingObraNaLista(obraRanking, obrasConcluidas)
        : removerRankingObraDaLista(obraRanking, obrasConcluidas)
      : obraVaiFicarConcluida
        ? normalizarListaIdsEmAlta([...obrasConcluidas, obraId])
        : obrasConcluidas.filter((id) => id !== obraId);

    salvarListaIdsLocalEmAlta(
      COMPLETED_STORAGE_KEY,
      usuarioLogadoId,
      novasObrasConcluidas,
    );

    setObrasConcluidas(novasObrasConcluidas);

    void sincronizarColecaoRankingSupabase(
      "concluidas",
      obraRanking,
      obraVaiFicarConcluida,
    );

    if (obraVaiFicarConcluida) {
      void registrarColecaoRankingNoDiario("concluiu_obra", obraRanking);
    }
  }

  return (
    <main className="historietas-em-alta-page" style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${emAltaPageCss}`}</style>

      <div style={pageDecorationLayerStyle} aria-hidden="true">
        {["#", "★"].map((decoracao, index) => (
          <span
            key={`${decoracao}-${index}`}
            style={criarDecoracaoPaginaStyle(index)}
          >
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
            style={
              isDesktop ? desktopHeaderTitleLinkStyle : headerTitleLinkStyle
            }
            aria-label="Voltar para a Home"
          >
            <span
              style={
                isDesktop ? desktopHeaderTitleMarkStyle : headerTitleMarkStyle
              }
            >
              H
            </span>
            <span
              className="historietas-em-alta-hero-title"
              style={
                isDesktop ? desktopHeaderTitleTextStyle : headerTitleTextStyle
              }
            >
              {tituloCabecalho}
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
              {usuarioLogado && notificacoesNaoLidas > 0 ? (
                <span style={desktopNotificationBadgeStyle}>
                  {notificacoesNaoLidas > 99 ? "99+" : notificacoesNaoLidas}
                </span>
              ) : null}
            </Link>
          ) : null}
        </header>

        {false && carregandoRanking && (
          <p
            aria-live="polite"
            aria-busy="true"
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Carregando rankings
          </p>
        )}

        {!carregandoRanking && ranking.length > 0 && rankingTemAtividadeReal && (
          <>
            <AutoresEmAltaSection
              autores={rankingAutores}
              isDesktop={isDesktop}
            />

            <RankingSection
              titulo="Ranking Mestre"
              descricao=""
              obras={rankingGeral}
              tipo="geral"
              obrasFavoritas={obrasFavoritasProtegidas}
              obrasConcluidas={obrasConcluidasProtegidas}
              onAlternarFavorito={alternarFavorito}
              onAlternarConcluido={alternarConcluido}
              isDesktop={isDesktop}
            />

            <RankingSection
              titulo="Alcance Dominante"
              descricao="As histórias que mais chamaram atenção dos leitores."
              obras={rankingMaisLidas}
              tipo="lidas"
              obrasFavoritas={obrasFavoritasProtegidas}
              obrasConcluidas={obrasConcluidasProtegidas}
              onAlternarFavorito={alternarFavorito}
              onAlternarConcluido={alternarConcluido}
              isDesktop={isDesktop}
            />

            <RankingSection
              titulo="Preferidas do Público"
              descricao="As obras que mais receberam curtidas e reações positivas."
              obras={rankingMaisCurtidas}
              tipo="curtidas"
              obrasFavoritas={obrasFavoritasProtegidas}
              obrasConcluidas={obrasConcluidasProtegidas}
              onAlternarFavorito={alternarFavorito}
              onAlternarConcluido={alternarConcluido}
              isDesktop={isDesktop}
            />

            <RankingSection
              titulo="Mais Comentadas"
              descricao="As histórias que mais puxaram conversa entre os leitores."
              obras={rankingMaisComentadas}
              tipo="comentadas"
              obrasFavoritas={obrasFavoritasProtegidas}
              obrasConcluidas={obrasConcluidasProtegidas}
              onAlternarFavorito={alternarFavorito}
              onAlternarConcluido={alternarConcluido}
              isDesktop={isDesktop}
            />

            <RankingSection
              titulo="Mais Seguidas"
              descricao="Obras que mais leitores decidiram acompanhar."
              obras={rankingMaisSalvas}
              tipo="salvas"
              obrasFavoritas={obrasFavoritasProtegidas}
              obrasConcluidas={obrasConcluidasProtegidas}
              onAlternarFavorito={alternarFavorito}
              onAlternarConcluido={alternarConcluido}
              isDesktop={isDesktop}
            />

            <RankingSection
              titulo="Novas Promessas"
              descricao="Publicações recentes começando a aparecer no radar."
              obras={rankingMaisRecentes}
              tipo="recentes"
              obrasFavoritas={obrasFavoritasProtegidas}
              obrasConcluidas={obrasConcluidasProtegidas}
              onAlternarFavorito={alternarFavorito}
              onAlternarConcluido={alternarConcluido}
              isDesktop={isDesktop}
            />

            <RankingSection
              titulo="Grandes Jornadas"
              descricao="Histórias com mais capítulos e conteúdo publicado."
              obras={rankingMaisCapitulos}
              tipo="capitulos"
              obrasFavoritas={obrasFavoritasProtegidas}
              obrasConcluidas={obrasConcluidasProtegidas}
              onAlternarFavorito={alternarFavorito}
              onAlternarConcluido={alternarConcluido}
              isDesktop={isDesktop}
            />
          </>
        )}

        {!carregandoRanking && ranking.length > 0 && !rankingTemAtividadeReal && (
          <>
            <p
              style={{
                margin: "10px 0 18px",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 800,
                textAlign: "center",
              }}
            >
              Catálogo em formação
            </p>

            <RankingSection
              titulo="Obras publicadas"
              descricao="Catálogo inicial com obras publicadas no HISTORIETAS."
              obras={rankingParaCatalogoInicial}
              tipo="recentes"
              obrasFavoritas={obrasFavoritasProtegidas}
              obrasConcluidas={obrasConcluidasProtegidas}
              onAlternarFavorito={alternarFavorito}
              onAlternarConcluido={alternarConcluido}
              isDesktop={isDesktop}
            />
          </>
        )}

        {!carregandoRanking && ranking.length === 0 && (
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Ainda não há obras publicadas
          </p>
        )}
      </section>
    </main>
  );
}

function obterTemaRanking(tipo: TipoRanking) {
  if (tipo === "geral") {
    return {
      icone: "👑",
      label: "Ranking Mestre",
      titleColor: "var(--historietas-accent, #FDBA74)",
      accent: "var(--historietas-accent, #FDBA74)",
      border:
        "color-mix(in srgb, var(--historietas-accent, #F97316) 42%, transparent)",
      borderStrong:
        "color-mix(in srgb, var(--historietas-accent, #F97316) 58%, transparent)",
      glow: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
      background:
        "linear-gradient(135deg, rgba(41,27,53,0.82) 0%, rgba(18,12,30,0.92) 100%)",
    };
  }

  if (tipo === "lidas") {
    return {
      icone: "👁",
      label: "Alcance",
      titleColor: "#FFFFFF",
      accent: "#38BDF8",
      border: "rgba(56,189,248,0.42)",
      borderStrong: "rgba(56,189,248,0.58)",
      glow: "rgba(56,189,248,0.12)",
      background:
        "linear-gradient(135deg, rgba(18,36,54,0.82) 0%, rgba(11,17,32,0.92) 100%)",
    };
  }

  if (tipo === "curtidas") {
    return {
      icone: "❤",
      label: "Reação",
      titleColor: "#FFFFFF",
      accent: "#FB7185",
      border: "rgba(251,113,133,0.42)",
      borderStrong: "rgba(251,113,133,0.58)",
      glow: "rgba(251,113,133,0.12)",
      background:
        "linear-gradient(135deg, rgba(54,20,38,0.82) 0%, rgba(29,13,27,0.92) 100%)",
    };
  }

  if (tipo === "comentadas") {
    return {
      icone: "💬",
      label: "Discussão",
      titleColor: "#FFFFFF",
      accent: "#C084FC",
      border: "rgba(192,132,252,0.42)",
      borderStrong: "rgba(192,132,252,0.58)",
      glow: "rgba(192,132,252,0.12)",
      background:
        "linear-gradient(135deg, rgba(40,25,62,0.82) 0%, rgba(20,12,34,0.92) 100%)",
    };
  }

  if (tipo === "salvas") {
    return {
      icone: "👥",
      label: "Seguidores",
      titleColor: "#FFFFFF",
      accent: "#34D399",
      border: "rgba(52,211,153,0.42)",
      borderStrong: "rgba(52,211,153,0.58)",
      glow: "rgba(52,211,153,0.11)",
      background:
        "linear-gradient(135deg, rgba(17,48,39,0.82) 0%, rgba(10,29,25,0.92) 100%)",
    };
  }

  if (tipo === "recentes") {
    return {
      icone: "✨",
      label: "Novidade",
      titleColor: "#FFFFFF",
      accent: "#F472B6",
      border: "rgba(244,114,182,0.42)",
      borderStrong: "rgba(244,114,182,0.58)",
      glow: "rgba(244,114,182,0.11)",
      background:
        "linear-gradient(135deg, rgba(54,22,45,0.82) 0%, rgba(30,13,31,0.92) 100%)",
    };
  }

  return {
    icone: "📚",
    label: "Conteúdo",
    titleColor: "#FFFFFF",
    accent: "#A78BFA",
    border: "rgba(167,139,250,0.42)",
    borderStrong: "rgba(167,139,250,0.58)",
    glow: "rgba(167,139,250,0.12)",
    background:
      "linear-gradient(135deg, rgba(37,27,60,0.82) 0%, rgba(18,12,34,0.92) 100%)",
  };
}
function criarSectionHeaderTemaStyle(
  _tema: ReturnType<typeof obterTemaRanking>,
): CSSProperties {
  void _tema;

  return {
    ...sectionHeaderStyle,
    background: "transparent",
    border: "none",
    boxShadow: "none",
  };
}

function criarDesktopSectionHeaderTemaStyle(
  _tema: ReturnType<typeof obterTemaRanking>,
): CSSProperties {
  void _tema;

  return {
    ...desktopSectionHeaderStyle,
    background: "transparent",
    border: "none",
    boxShadow: "none",
  };
}

function criarSectionIconStyle(
  tema: ReturnType<typeof obterTemaRanking>,
): CSSProperties {
  return {
    width: "auto",
    height: "auto",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    color: tema.accent,
    fontSize: "28px",
    lineHeight: 1,
    flex: "0 0 auto",
    boxShadow: "none",
  };
}

function RankingSection({
  titulo,
  obras,
  tipo,
  obrasFavoritas,
  obrasConcluidas,
  onAlternarFavorito: _onAlternarFavorito,
  onAlternarConcluido: _onAlternarConcluido,
  isDesktop,
}: {
  titulo: string;
  descricao: string;
  obras: ObraRanking[];
  tipo: TipoRanking;
  obrasFavoritas: string[];
  obrasConcluidas: string[];
  onAlternarFavorito: (obraId: string) => void;
  onAlternarConcluido: (obraId: string) => void;
  isDesktop: boolean;
}) {
  void _onAlternarFavorito;
  void _onAlternarConcluido;

  const tema = obterTemaRanking(tipo);
  const carrosselRef = useRef<HTMLDivElement | null>(null);
  const obrasComPosicao = obras.map((obra, index) => ({
    obra,
    posicao: index + 1,
  }));
  const obrasEmOrdem = [...obrasComPosicao].reverse();

  function rolarCarrossel(direcao: "esquerda" | "direita") {
    const carrossel = carrosselRef.current;

    if (!carrossel) {
      return;
    }

    const distancia = Math.max(320, Math.floor(carrossel.clientWidth * 0.82));

    carrossel.scrollBy({
      left: direcao === "direita" ? distancia : -distancia,
      behavior: "smooth",
    });
  }

  return (
    <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
      <div
        style={
          isDesktop
            ? criarDesktopSectionHeaderTemaStyle(tema)
            : criarSectionHeaderTemaStyle(tema)
        }
      >
        <div
          style={
            isDesktop
              ? desktopSectionHeaderContentStyle
              : sectionHeaderContentStyle
          }
        >
          <span style={criarSectionIconStyle(tema)}>{tema.icone}</span>

          <div
            style={
              isDesktop ? desktopSectionTextBlockStyle : sectionTextBlockStyle
            }
          >
            <h2
              style={
                isDesktop
                  ? {
                      ...sectionTitleStyle,
                      color: "#FFFFFF",
                      textAlign: "center",
                    }
                  : { ...sectionTitleStyle, color: "#FFFFFF" }
              }
            >
              {titulo}
            </h2>
          </div>
        </div>
      </div>

      {obras.length > 0 ? (
        <div style={isDesktop ? desktopCarouselShellStyle : carouselShellStyle}>
          {isDesktop && (
            <button
              type="button"
              aria-label={`Voltar carrossel ${titulo}`}
              onClick={(event) => {
                event.stopPropagation();
                rolarCarrossel("esquerda");
              }}
              style={carouselArrowLeftStyle}
            >
              <span style={carouselArrowIconStyle}>‹</span>
            </button>
          )}

          <div
            ref={carrosselRef}
            style={isDesktop ? desktopCarouselStyle : carouselStyle}
            aria-label={`${titulo} em carrossel`}
          >
            {obrasEmOrdem.map(({ obra, posicao }) => (
              <RankingCard
                key={`${tipo}-${obra.id}`}
                obra={obra}
                posicao={posicao}
                tipo={tipo}
                favorita={listaTemRankingObra(obra, obrasFavoritas)}
                concluida={listaTemRankingObra(obra, obrasConcluidas)}
                isDesktop={isDesktop}
              />
            ))}
          </div>

          {isDesktop && (
            <button
              type="button"
              aria-label={`Avançar carrossel ${titulo}`}
              onClick={(event) => {
                event.stopPropagation();
                rolarCarrossel("direita");
              }}
              style={carouselArrowRightStyle}
            >
              <span style={carouselArrowIconStyle}>›</span>
            </button>
          )}
        </div>
      ) : (
        <p
          style={{
            margin: "10px 0 0",
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          Nada para mostrar neste ranking
        </p>
      )}
    </section>
  );
}
function AutoresEmAltaSection({
  autores,
  isDesktop,
}: {
  autores: AutorRanking[];
  isDesktop: boolean;
}) {
  const tema = obterTemaRanking("geral");
  const carrosselRef = useRef<HTMLDivElement | null>(null);
  const autoresComPosicao = autores.map((autor, index) => ({
    autor,
    posicao: index + 1,
  }));
  const autoresEmOrdem = [...autoresComPosicao].reverse();

  function rolarCarrossel(direcao: "esquerda" | "direita") {
    const carrossel = carrosselRef.current;

    if (!carrossel) {
      return;
    }

    const distancia = Math.max(320, Math.floor(carrossel.clientWidth * 0.82));

    carrossel.scrollBy({
      left: direcao === "direita" ? distancia : -distancia,
      behavior: "smooth",
    });
  }

  if (autores.length === 0) {
    return null;
  }

  return (
    <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
      <div
        style={
          isDesktop
            ? criarDesktopSectionHeaderTemaStyle(tema)
            : criarSectionHeaderTemaStyle(tema)
        }
      >
        <div
          style={
            isDesktop
              ? desktopSectionHeaderContentStyle
              : sectionHeaderContentStyle
          }
        >
          <span style={criarSectionIconStyle(tema)}>👤</span>

          <div
            style={
              isDesktop ? desktopSectionTextBlockStyle : sectionTextBlockStyle
            }
          >
            <h2
              style={
                isDesktop
                  ? {
                      ...sectionTitleStyle,
                      color: "#FFFFFF",
                      textAlign: "center",
                    }
                  : { ...sectionTitleStyle, color: "#FFFFFF" }
              }
            >
              Autores em Alta
            </h2>
          </div>
        </div>
      </div>

      <div style={isDesktop ? desktopCarouselShellStyle : carouselShellStyle}>
        {isDesktop && (
          <button
            type="button"
            aria-label="Voltar carrossel Autores em Alta"
            onClick={(event) => {
              event.stopPropagation();
              rolarCarrossel("esquerda");
            }}
            style={carouselArrowLeftStyle}
          >
            <span style={carouselArrowIconStyle}>‹</span>
          </button>
        )}

        <div
          ref={carrosselRef}
          style={isDesktop ? desktopCarouselStyle : carouselStyle}
          aria-label="Autores em Alta em carrossel"
        >
          {autoresEmOrdem.map(({ autor, posicao }) => (
            <AutorRankingCard
              key={`autor-ranking-${autor.id}`}
              autor={autor}
              posicao={posicao}
              isDesktop={isDesktop}
            />
          ))}
        </div>

        {isDesktop && (
          <button
            type="button"
            aria-label="Avançar carrossel Autores em Alta"
            onClick={(event) => {
              event.stopPropagation();
              rolarCarrossel("direita");
            }}
            style={carouselArrowRightStyle}
          >
            <span style={carouselArrowIconStyle}>›</span>
          </button>
        )}
      </div>
    </section>
  );
}

function AutorRankingCard({
  autor,
  posicao,
  isDesktop,
}: {
  autor: AutorRanking;
  posicao: number;
  isDesktop: boolean;
}) {
  const router = useRouter();
  const inicialAutor = autor.nome.trim().charAt(0).toUpperCase() || "A";
  const temaPosicao = obterTemaPosicao(posicao);
  const avatarAutor = autor.avatar.trim();

  function abrirPerfil() {
    router.push(autor.href);
  }

  return (
    <article
      style={criarCardRankingStyle(posicao, true, "geral", isDesktop)}
      role="link"
      tabIndex={0}
      aria-label={`Abrir perfil de ${autor.nome}`}
      onClick={abrirPerfil}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          abrirPerfil();
        }
      }}
    >
      <div
        style={criarAutorAvatarRankingStyle(avatarAutor, posicao, isDesktop)}
      >
        {!avatarAutor && (
          <span style={authorRankingAvatarInitialStyle}>{inicialAutor}</span>
        )}
      </div>

      <div style={isDesktop ? desktopCardContentStyle : cardContentStyle}>
        <div style={authorRankingTitleAreaStyle}>
          <h3 style={criarAutorCardTitleRankingStyle(posicao)}>{autor.nome}</h3>
        </div>

        <div style={authorRankingMetaStackStyle}>
          <span style={authorRankingWorksBadgeStyle}>
            {formatarNumero(autor.obras)}{" "}
            {autor.obras === 1 ? "Obra Publicada" : "Obras Publicadas"}
          </span>
        </div>

        <div style={statsStyle}>
          <span style={statsItemStyle}>
            <span style={metricIconStyle} aria-hidden="true">
              💬
            </span>
            <span style={metricValueStyle}>
              {formatarNumero(autor.comentarios)}
            </span>
          </span>

          <span style={statsItemStyle}>
            <span style={metricIconStyle} aria-hidden="true">
              👥
            </span>
            <span style={metricValueStyle}>
              {formatarNumero(autor.seguidores)}
            </span>
          </span>

          <span style={statsItemStyle}>
            <span style={metricIconStyle} aria-hidden="true">
              📚
            </span>
            <span style={metricValueStyle}>
              {formatarNumero(autor.capitulos)}
            </span>
          </span>
        </div>

        <div style={statsStyle}>
          <span style={statsItemStyle}>
            <span style={metricIconStyle} aria-hidden="true">
              👁
            </span>
            <span style={metricValueStyle}>{formatarNumero(autor.views)}</span>
          </span>

          <span style={statsItemStyle}>
            <span style={heartMetricIconStyle} aria-hidden="true">
              ♥
            </span>
            <span style={metricValueStyle}>
              {formatarNumero(autor.curtidas)}
            </span>
          </span>

          <span style={statsItemStyle}>
            <span style={starMetricIconStyle} aria-hidden="true">
              ★
            </span>
            <span style={metricValueStyle}>
              {formatarMediaRanking(autor.mediaAvaliacao)}
            </span>
          </span>
        </div>

        <div style={authorRankingScoreRowStyle}>
          <span style={criarAutorPointsBadgeStyle(posicao)}>
            {formatarNumero(autor.pontuacao)} pts
          </span>

          <span
            style={criarAutorTierInlineBadgeStyle(posicao)}
            aria-label={`Posição ${posicao}º — ${temaPosicao.nome}`}
          >
            <span style={coroaNumberStyle}>{posicao}º</span>
            <span style={coroaNumberStyle}>{temaPosicao.nome}</span>
          </span>
        </div>
      </div>
    </article>
  );
}

function RankingCard({
  obra,
  posicao,
  tipo,
  favorita,
  concluida,
  isDesktop,
}: {
  obra: ObraRanking;
  posicao: number;
  tipo: TipoRanking;
  favorita: boolean;
  concluida: boolean;
  isDesktop: boolean;
}) {
  void favorita;
  void concluida;

  const router = useRouter();
  const mostrarClassificacao =
    obra.classificacaoIndicativa &&
    obra.classificacaoIndicativa !== "Não informada";
  const temaPosicao = obterTemaPosicao(posicao);
  const generoCard = formatarGeneroCard(obra.genero);
  const formatoCard = obra.formato.trim() || "História";
  const mostrarGeneroRanking = Boolean(
    generoCard && normalizarTexto(generoCard) !== "nao informado",
  );
  const mostrarFormatoRanking = Boolean(
    formatoCard && normalizarTexto(formatoCard) !== "nao informado",
  );
  const mostrarStatusRanking = normalizarTexto(obra.status) !== "publicado";
  const mostrarFormatoNoTopoRankingMestre =
    tipo === "geral" && mostrarFormatoRanking;
  const destaque =
    tipo === "geral"
      ? `${formatarNumero(obra.pontuacao)} pts`
      : tipo === "lidas"
        ? `${formatarNumero(obra.views)} visualizações`
        : tipo === "curtidas"
          ? `${formatarNumero(obra.curtidas)} curtidas`
          : tipo === "comentadas"
            ? `${formatarNumero(obra.comentarios)} comentários`
            : tipo === "salvas"
              ? `${formatarNumero(obra.salvos)} seguidores`
              : tipo === "recentes"
                ? formatarDataRanking(obra.criadaEmTimestamp)
                : `${formatarNumero(obra.capitulos)} capítulos`;

  function abrirObra() {
    router.push(obra.href);
  }

  return (
    <article
      style={criarCardRankingStyle(posicao, obra.disponivel, tipo, isDesktop)}
      role="link"
      tabIndex={0}
      aria-label={`Abrir página da obra ${obra.titulo}`}
      onClick={abrirObra}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          abrirObra();
        }
      }}
    >
      <div style={criarRankingCoverStyle(obra.capa, isDesktop, posicao)}>
        {null}
      </div>

      <div style={isDesktop ? desktopCardContentStyle : cardContentStyle}>
        <div style={cardTopStyle}>
          <h3 style={criarObraCardTitleRankingStyle(posicao)}>{obra.titulo}</h3>
        </div>

        <Link
          href={criarLinkPerfilAutorRanking(obra.autor, obra.autorId)}
          style={authorLinkStyle}
          aria-label={`Abrir perfil de ${obra.autor}`}
          onClick={(event) => {
            event.stopPropagation();
          }}
          onKeyDown={(event) => {
            event.stopPropagation();
          }}
        >
          Por {obra.autor}
        </Link>

        {(mostrarFormatoNoTopoRankingMestre ||
          mostrarGeneroRanking ||
          mostrarClassificacao) && (
          <div style={cardMetaRowStyle}>
            {mostrarFormatoNoTopoRankingMestre && (
              <span style={formatBadgeStyle}>{formatoCard}</span>
            )}

            {mostrarGeneroRanking && (
              <span style={formatBadgeStyle}>{generoCard}</span>
            )}

            {mostrarClassificacao && (
              <span style={classificationBadgeStyle}>
                {obra.classificacaoIndicativa}
              </span>
            )}
          </div>
        )}

        {mostrarStatusRanking && (
          <div style={statusRowStyle}>
            <span
              style={obra.tipo === "local" ? publishedStatusStyle : statusStyle}
            >
              {obra.status}
            </span>
          </div>
        )}

        <div style={statsStyle}>
          <span style={statsItemStyle}>
            <span style={metricIconStyle} aria-hidden="true">
              💬
            </span>
            <span style={metricValueStyle}>
              {formatarNumero(obra.comentarios)}
            </span>
          </span>

          <span style={statsItemStyle}>
            <span style={metricIconStyle} aria-hidden="true">
              👥
            </span>
            <span style={metricValueStyle}>{formatarNumero(obra.salvos)}</span>
          </span>

          <span style={statsItemStyle}>
            <span style={metricIconStyle} aria-hidden="true">
              📚
            </span>
            <span style={metricValueStyle}>
              {formatarNumero(obra.capitulos)}
            </span>
          </span>
        </div>

        <div style={statsStyle}>
          <span style={statsItemStyle}>
            <span style={metricIconStyle} aria-hidden="true">
              👁
            </span>
            <span style={metricValueStyle}>{formatarNumero(obra.views)}</span>
          </span>

          <span style={statsItemStyle}>
            <span style={heartMetricIconStyle} aria-hidden="true">
              ♥
            </span>
            <span style={metricValueStyle}>
              {formatarNumero(obra.curtidas)}
            </span>
          </span>

          <span style={statsItemStyle}>
            <span style={starMetricIconStyle} aria-hidden="true">
              ★
            </span>
            <span style={metricValueStyle}>
              {formatarMediaRanking(obra.mediaAvaliacao)}
            </span>
          </span>
        </div>

        <div
          style={
            isDesktop
              ? desktopRankingCardActionRowStyle
              : rankingCardActionRowStyle
          }
        >
          <span
            style={
              isDesktop ? desktopRankingThemeBadgeStyle : rankingThemeBadgeStyle
            }
          >
            {tipo === "geral"
              ? destaque
              : mostrarFormatoRanking
                ? formatoCard
                : "História"}
          </span>

          <span
            style={criarRankingTierInlineBadgeStyle(posicao)}
            aria-label={`Posição ${posicao}º — ${temaPosicao.nome}`}
          >
            <span style={coroaNumberStyle}>{posicao}º</span>
            <span style={coroaNumberStyle}>{temaPosicao.nome}</span>
          </span>
        </div>
      </div>
    </article>
  );
}

function obterTemaPosicao(posicao: number) {
  if (posicao === 1) {
    return {
      nome: "Diamante",
      simbolo: "◆",
      accent: "#7DD3FC",
      accentSoft: "#E0F2FE",
      deep: "#061523",
      border: "rgba(125,211,252,0.78)",
      cardBackground: "#2486C2",
      coverBackground:
        "radial-gradient(circle at 28% 18%, rgba(224,242,254,0.22), transparent 26%), radial-gradient(circle at 80% 92%, rgba(56,189,248,0.22), transparent 32%), linear-gradient(145deg, #0B2235 0%, #111C33 52%, #090A18 100%)",
      coverOverlay:
        "linear-gradient(180deg, rgba(224,242,254,0.06) 0%, rgba(6,21,35,0.76) 100%), radial-gradient(circle at 18% 12%, rgba(125,211,252,0.22), transparent 34%)",
      rankBackground:
        "linear-gradient(135deg, #ECFEFF 0%, #7DD3FC 46%, #A78BFA 100%)",
      rankText: "#061523",
      tierBackground:
        "linear-gradient(135deg, rgba(236,254,255,0.96) 0%, rgba(125,211,252,0.96) 52%, rgba(167,139,250,0.96) 100%)",
      tierText: "#FFFFFF",
      badgeBackground: "rgba(125,211,252,0.16)",
      badgeBorder: "rgba(125,211,252,0.42)",
      badgeText: "#BAE6FD",
      readColor: "#7DD3FC",
      shadow:
        "0 18px 38px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.08)",
    };
  }

  if (posicao === 2) {
    return {
      nome: "Rubi",
      simbolo: "◆",
      accent: "#FB7185",
      accentSoft: "#FFE4E6",
      deep: "#2A0716",
      border: "rgba(251,113,133,0.74)",
      cardBackground: "#A32A4B",
      coverBackground:
        "radial-gradient(circle at 28% 18%, rgba(255,228,230,0.16), transparent 28%), radial-gradient(circle at 80% 92%, rgba(251,113,133,0.24), transparent 34%), linear-gradient(145deg, #3A1020 0%, #28101F 52%, #0D0917 100%)",
      coverOverlay:
        "linear-gradient(180deg, rgba(255,228,230,0.05) 0%, rgba(42,7,22,0.78) 100%), radial-gradient(circle at 18% 12%, rgba(251,113,133,0.24), transparent 34%)",
      rankBackground:
        "linear-gradient(135deg, #FFE4E6 0%, #FB7185 48%, #BE123C 100%)",
      rankText: "#FFFFFF",
      tierBackground:
        "linear-gradient(135deg, #FFE4E6 0%, #FB7185 50%, #BE123C 100%)",
      tierText: "#FFFFFF",
      badgeBackground: "rgba(251,113,133,0.16)",
      badgeBorder: "rgba(251,113,133,0.44)",
      badgeText: "#FDA4AF",
      readColor: "#FB7185",
      shadow:
        "0 18px 38px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.075)",
    };
  }

  if (posicao === 3) {
    return {
      nome: "Ouro",
      simbolo: "◆",
      accent: "#FBBF24",
      accentSoft: "#FEF3C7",
      deep: "#271504",
      border: "rgba(251,191,36,0.72)",
      cardBackground: "#B57D22",
      coverBackground:
        "radial-gradient(circle at 28% 18%, rgba(254,243,199,0.18), transparent 28%), radial-gradient(circle at 80% 92%, rgba(251,191,36,0.24), transparent 34%), linear-gradient(145deg, #3A2508 0%, #271808 52%, #100A14 100%)",
      coverOverlay:
        "linear-gradient(180deg, rgba(254,243,199,0.05) 0%, rgba(39,21,4,0.78) 100%), radial-gradient(circle at 18% 12%, rgba(251,191,36,0.24), transparent 34%)",
      rankBackground:
        "linear-gradient(135deg, #FEF3C7 0%, #FBBF24 48%, #D97706 100%)",
      rankText: "#2B1407",
      tierBackground:
        "linear-gradient(135deg, #FEF3C7 0%, #FBBF24 52%, #D97706 100%)",
      tierText: "#FFFFFF",
      badgeBackground: "rgba(251,191,36,0.16)",
      badgeBorder: "rgba(251,191,36,0.44)",
      badgeText: "#FCD34D",
      readColor: "#FBBF24",
      shadow:
        "0 18px 38px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.075)",
    };
  }

  if (posicao === 4) {
    return {
      nome: "Prata",
      simbolo: "◆",
      accent: "#CBD5E1",
      accentSoft: "#F8FAFC",
      deep: "#101722",
      border: "rgba(203,213,225,0.68)",
      cardBackground: "#7B8AA3",
      coverBackground:
        "radial-gradient(circle at 28% 18%, rgba(248,250,252,0.14), transparent 28%), radial-gradient(circle at 80% 92%, rgba(148,163,184,0.18), transparent 34%), linear-gradient(145deg, #26303D 0%, #1A202B 52%, #0D0B16 100%)",
      coverOverlay:
        "linear-gradient(180deg, rgba(248,250,252,0.04) 0%, rgba(16,23,34,0.78) 100%), radial-gradient(circle at 18% 12%, rgba(203,213,225,0.18), transparent 34%)",
      rankBackground:
        "linear-gradient(135deg, #F8FAFC 0%, #CBD5E1 52%, #64748B 100%)",
      rankText: "#111827",
      tierBackground:
        "linear-gradient(135deg, #F8FAFC 0%, #CBD5E1 52%, #64748B 100%)",
      tierText: "#FFFFFF",
      badgeBackground: "rgba(203,213,225,0.13)",
      badgeBorder: "rgba(203,213,225,0.38)",
      badgeText: "#E2E8F0",
      readColor: "#CBD5E1",
      shadow:
        "0 18px 38px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.07)",
    };
  }

  return {
    nome: "Bronze",
    simbolo: "◆",
    accent: "#FB923C",
    accentSoft: "#FED7AA",
    deep: "#241006",
    border: "rgba(251,146,60,0.70)",
    cardBackground: "#9A6535",
    coverBackground:
      "radial-gradient(circle at 28% 18%, rgba(254,215,170,0.14), transparent 28%), radial-gradient(circle at 80% 92%, rgba(251,146,60,0.22), transparent 34%), linear-gradient(145deg, #351D0E 0%, #24140B 52%, #100A14 100%)",
    coverOverlay:
      "linear-gradient(180deg, rgba(254,215,170,0.04) 0%, rgba(36,16,6,0.78) 100%), radial-gradient(circle at 18% 12%, rgba(251,146,60,0.20), transparent 34%)",
    rankBackground:
      "linear-gradient(135deg, #FED7AA 0%, #FB923C 48%, #9A3412 100%)",
    rankText: "#FFFFFF",
    tierBackground:
      "linear-gradient(135deg, #FED7AA 0%, #FB923C 50%, #9A3412 100%)",
    tierText: "#FFFFFF",
    badgeBackground: "rgba(251,146,60,0.15)",
    badgeBorder: "rgba(251,146,60,0.40)",
    badgeText: "#FDBA74",
    readColor: "#FB923C",
    shadow:
      "0 18px 38px rgba(0,0,0,0.33), inset 0 1px 0 rgba(255,255,255,0.07)",
  };
}
function criarCardRankingStyle(
  posicao: number,
  disponivel: boolean,
  _tipo: TipoRanking,
  isDesktop = false,
): CSSProperties {
  const temaPosicao = obterTemaPosicao(posicao);

  return {
    ...(disponivel
      ? isDesktop
        ? desktopCardStyle
        : cardStyle
      : isDesktop
        ? desktopCardSoonStyle
        : cardSoonStyle),
    background: temaPosicao.cardBackground,
    backgroundColor: temaPosicao.cardBackground,
    border: `1px solid ${temaPosicao.border}`,
    outline: "none",
    boxShadow: temaPosicao.shadow,
  };
}
function criarTierBadgeStyle(posicao: number): CSSProperties {
  const temaPosicao = obterTemaPosicao(posicao);

  return {
    position: "absolute",
    left: "8px",
    right: "8px",
    bottom: "8px",
    zIndex: 5,
    minHeight: "30px",
    maxWidth: "calc(100% - 16px)",
    padding: "0 8px",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "nowrap",
    gap: "5px",
    background: temaPosicao.badgeBackground,
    border: `1px solid ${temaPosicao.badgeBorder}`,
    color: "#FFFFFF",
    fontSize: "10px",
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: "0.055em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    overflowWrap: "normal",
    wordBreak: "normal",
    overflow: "hidden",
    boxShadow:
      "0 8px 16px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.22)",
    pointerEvents: "none",
  };
}

function criarRankingTierInlineBadgeStyle(posicao: number): CSSProperties {
  const temaPosicao = obterTemaPosicao(posicao);

  return {
    ...highlightBadgeStyle,
    ...rankingHighlightBadgeInlineStyle,
    position: "static",
    minHeight: "34px",
    marginTop: 0,
    padding: "0 12px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    background: temaPosicao.badgeBackground,
    border: `1px solid ${temaPosicao.badgeBorder}`,
    color: "#FFFFFF",
    fontSize: "10px",
    fontWeight: 950,
    letterSpacing: "0.055em",
    lineHeight: 1,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    boxShadow: "none",
  };
}

function criarCardTitleRankingStyle(_posicao: number): CSSProperties {
  return {
    ...cardTitleStyle,
    color: "#FFFFFF",
  };
}
function criarObraCardTitleRankingStyle(_posicao: number): CSSProperties {
  return {
    ...cardTitleStyle,
    color: "#FFFFFF",
  };
}
function criarReadRankingStyle(
  posicao: number,
  disponivel: boolean,
): CSSProperties {
  const temaPosicao = obterTemaPosicao(posicao);

  return {
    ...(disponivel ? readStyle : soonReadStyle),
    color: temaPosicao.readColor,
  };
}

function criarAutorCardRankingStyle(
  posicao: number,
  isDesktop: boolean,
): CSSProperties {
  const temaPosicao = obterTemaPosicao(posicao);

  return {
    ...(isDesktop ? desktopAuthorRankingCardStyle : authorRankingCardStyle),
    background: temaPosicao.cardBackground,
    backgroundColor: temaPosicao.cardBackground,
    border: `1px solid ${temaPosicao.border}`,
    outline: "none",
    boxShadow: temaPosicao.shadow,
  };
}
function criarAutorAvatarRankingStyle(
  avatar: string,
  posicao: number,
  isDesktop: boolean,
): CSSProperties {
  const temaPosicao = obterTemaPosicao(posicao);
  const baseStyle = isDesktop ? desktopCoverStyle : coverStyle;

  return {
    ...baseStyle,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: temaPosicao.deep,
    backgroundImage: avatar
      ? `linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.24)), url(${avatar})`
      : temaPosicao.coverBackground,
    backgroundSize: "cover",
    backgroundPosition: "center",
    border: "none",
    outline: "none",
    boxShadow: "none",
  };
}

function criarAutorTierInlineBadgeStyle(posicao: number): CSSProperties {
  const temaPosicao = obterTemaPosicao(posicao);

  return {
    ...authorRankingTierBadgeStyle,
    position: "static",
    left: "auto",
    right: "auto",
    bottom: "auto",
    minHeight: "34px",
    padding: "0 16px",
    width: "fit-content",
    maxWidth: "100%",
    flex: "0 0 auto",
    background: temaPosicao.badgeBackground,
    border: `1px solid ${temaPosicao.badgeBorder}`,
    color: "#FFFFFF",
    boxSizing: "border-box",
  };
}

function criarAutorPointsBadgeStyle(_posicao: number): CSSProperties {
  return {
    ...highlightBadgeStyle,
    marginTop: 0,
    minHeight: "34px",
    padding: "0 16px",
    color: "#FFFFFF",
    flex: "0 0 auto",
  };
}

function criarAutorCardTitleRankingStyle(_posicao: number): CSSProperties {
  return {
    ...authorRankingCardTitleStyle,
    color: "#FFFFFF",
  };
}

const emAltaPageCss = `
  html[data-historietas-tema-visual] body,
  html[data-historietas-tema-visual] main {
    background: #070212 !important;
  }

  .historietas-em-alta-page,
  .historietas-em-alta-page *,
  .historietas-em-alta-page *::before,
  .historietas-em-alta-page *::after {
    -webkit-tap-highlight-color: transparent !important;
  }

  .historietas-em-alta-page a,
  .historietas-em-alta-page button,
  .historietas-em-alta-page [role="link"],
  .historietas-em-alta-page [role="button"] {
    -webkit-tap-highlight-color: transparent !important;
    -webkit-touch-callout: none;
    touch-action: manipulation;
  }

  .historietas-em-alta-page a:active,
  .historietas-em-alta-page button:active,
  .historietas-em-alta-page [role="link"]:active,
  .historietas-em-alta-page [role="button"]:active,
  .historietas-em-alta-page a:focus,
  .historietas-em-alta-page button:focus,
  .historietas-em-alta-page [role="link"]:focus,
  .historietas-em-alta-page [role="button"]:focus {
    outline: none !important;
  }

  .historietas-em-alta-page a:focus-visible,
  .historietas-em-alta-page button:focus-visible,
  .historietas-em-alta-page [role="link"]:focus-visible,
  .historietas-em-alta-page [role="button"]:focus-visible {
    outline: none !important;
  }

  html[data-historietas-tema-visual] nav a[href="/em-alta"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/em-alta"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/em-alta"] {
    background: var(--historietas-bottom-nav-active-bg, rgba(59, 7, 100, 0.54)) !important;
    border-color: var(--historietas-bottom-nav-active-border, rgba(109, 40, 217, 0.48)) !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] nav a[href="/em-alta"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/em-alta"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/em-alta"] .historietas-bottom-nav-icon {
    color: #FFFFFF !important;
    background: var(--historietas-bottom-nav-active-icon-bg, #3B0764) !important;
    border-color: var(--historietas-bottom-nav-active-icon-border, rgba(167, 139, 250, 0.46)) !important;
  }

  html[data-historietas-tema-visual="branco"] input::placeholder {
    color: #80868B !important;
  }

  html[data-historietas-tema-visual="branco"] input,
  html[data-historietas-tema-visual="branco"] textarea,
  html[data-historietas-tema-visual="branco"] select {
    color: #202124 !important;
  }
`;

const safeTextStyle: CSSProperties = {
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
  background: "transparent",
  WebkitMaskImage: "none",
  maskImage: "none",
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
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  backgroundColor: "#070212",
  background: "#070212",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(820px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "14px 0 116px",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "18px 0 84px",
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "14px",
  minWidth: 0,
};

const titleStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: 0,
  fontSize: "clamp(30px, 8vw, 46px)",
  lineHeight: 1.04,
  fontWeight: 950,
  letterSpacing: "-0.074em",
  maxWidth: "100%",
  textAlign: "center",
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
  fontSize: "clamp(38px, 4.4vw, 58px)",
  maxWidth: "760px",
  margin: "0 auto",
  textAlign: "center",
};

const titleHeaderStyle: CSSProperties = {
  ...topStyle,
  justifyContent: "center",
  marginTop: "4px",
  marginBottom: "18px",
  textAlign: "center",
};

const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  position: "relative",
  marginTop: "6px",
  marginBottom: "22px",
};

const desktopNotificationButtonStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  right: 0,
  transform: "translateY(-50%)",
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
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
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "3px",
  width: "100%",
  maxWidth: "100%",
  margin: "0 auto",
  minWidth: 0,
  textAlign: "center",
};

const desktopHeaderTitleLinkStyle: CSSProperties = {
  ...headerTitleLinkStyle,
  gap: "4px",
};

const headerTitleMarkStyle: CSSProperties = {
  width: "clamp(36px, 8vw, 48px)",
  height: "clamp(36px, 8vw, 48px)",
  borderRadius: "clamp(12px, 2.6vw, 16px)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#04000A",
  color: "#FFFFFF",
  fontSize: "clamp(18px, 4.3vw, 24px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
  border: "1px solid rgba(59, 7, 100, 0.58)",
  boxShadow: "none",
};

const desktopHeaderTitleMarkStyle: CSSProperties = {
  ...headerTitleMarkStyle,
  width: "50px",
  height: "50px",
  borderRadius: "17px",
  fontSize: "25px",
};

const headerTitleTextStyle: CSSProperties = {
  ...titleStyle,
  margin: 0,
  fontSize: "clamp(26px, 6.8vw, 40px)",
  maxWidth: "calc(100vw - 86px)",
  textAlign: "center",
  background: "none",
  WebkitBackgroundClip: "initial",
  backgroundClip: "initial",
  color: "#FFFFFF",
  textShadow: "none",
  textTransform: "uppercase",
  wordSpacing: "0.1em",
  whiteSpace: "nowrap",
};

const desktopHeaderTitleTextStyle: CSSProperties = {
  ...headerTitleTextStyle,
  fontSize: "clamp(34px, 3.6vw, 44px)",
  maxWidth: "760px",
};

const sectionStyle: CSSProperties = {
  marginTop: "32px",
  paddingBottom: "14px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  marginTop: "40px",
  paddingBottom: "18px",
};

const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  justifyItems: "center",
  gap: "6px",
  marginBottom: "14px",
  maxWidth: "100%",
  minWidth: 0,
  textAlign: "center",
};

const desktopSectionHeaderStyle: CSSProperties = {
  ...sectionHeaderStyle,
  padding: "8px 0 12px",
  borderRadius: 0,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "clamp(24px, 4vw, 30px)",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  maxWidth: "100%",
  textAlign: "center",
  textShadow: "none",
  ...safeTextStyle,
};

const carouselShellStyle: CSSProperties = {
  position: "relative",
  minWidth: 0,
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};

const desktopCarouselShellStyle: CSSProperties = {
  ...carouselShellStyle,
  width: "100%",
  maxWidth: "100%",
  marginLeft: 0,
  marginRight: 0,
  overflow: "visible",
  marginTop: "0",
};

const carouselArrowButtonStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  zIndex: 8,
  width: "38px",
  height: "38px",
  borderRadius: "999px",
  border: "none",
  background: "#04000A",
  color: "#DDD6FE",
  display: "none",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "none",
  transform: "translateY(-50%)",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
};

const carouselArrowIconStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  transform: "translateY(-1px)",
};

const carouselArrowLeftStyle: CSSProperties = {
  ...carouselArrowButtonStyle,
  left: "7px",
};

const carouselArrowRightStyle: CSSProperties = {
  ...carouselArrowButtonStyle,
  right: "7px",
};

const carouselStyle: CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  gap: "16px",
  width: "calc(100% + 24px)",
  maxWidth: "calc(100% + 24px)",
  minWidth: 0,
  boxSizing: "border-box",
  overflowX: "auto",
  overflowY: "hidden",
  padding: "4px 12px 22px",
  margin: "0 -12px",
  scrollSnapType: "x mandatory",
  scrollPaddingLeft: "12px",
  scrollPaddingRight: "12px",
  scrollbarWidth: "none",
  overscrollBehaviorX: "contain",
};

const desktopCarouselStyle: CSSProperties = {
  ...carouselStyle,
  gap: "22px",
  width: "100%",
  maxWidth: "100%",
  padding: "8px 0 30px",
  margin: 0,
  scrollPaddingLeft: "0px",
  scrollPaddingRight: "0px",
};

const sectionHeaderContentStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  minWidth: 0,
  textAlign: "center",
};

const desktopSectionHeaderContentStyle: CSSProperties = {
  ...sectionHeaderContentStyle,
  justifyContent: "center",
  textAlign: "center",
};

const sectionTextBlockStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
};

const desktopSectionTextBlockStyle: CSSProperties = {
  ...sectionTextBlockStyle,
  maxWidth: "760px",
  textAlign: "center",
};

const cardStyle: CSSProperties = {
  position: "relative",
  flex: "0 0 min(360px, 88vw)",
  width: "min(360px, 88vw)",
  scrollSnapAlign: "start",
  scrollSnapStop: "always",
  display: "grid",
  gridTemplateColumns: "minmax(88px, 98px) minmax(0, 1fr)",
  gap: "14px",
  alignItems: "stretch",
  padding: "11px",
  borderRadius: "22px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  minWidth: 0,
  maxWidth: "88vw",
  overflow: "hidden",
  boxShadow: "none",
  boxSizing: "border-box",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
  userSelect: "none",
};

const desktopCardStyle: CSSProperties = {
  ...cardStyle,
  flex: "0 0 410px",
  width: "410px",
  maxWidth: "100%",
  gridTemplateColumns: "112px minmax(0, 1fr)",
  gap: "15px",
  padding: "13px",
  borderRadius: "24px",
  boxShadow: "none",
};

const cardSoonStyle: CSSProperties = {
  ...cardStyle,
  opacity: 0.9,
};

const desktopCardSoonStyle: CSSProperties = {
  ...desktopCardStyle,
  opacity: 0.9,
};

const coroaNumberStyle: CSSProperties = {
  fontSize: "11px",
  fontWeight: 950,
  lineHeight: 1,
  color: "#FFFFFF",
  textShadow: "0 1px 4px rgba(0,0,0,0.28)",
};

const coverStyle: CSSProperties = {
  minHeight: "122px",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  backgroundImage: "linear-gradient(135deg, #08030F 0%, #04000A 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
  border: "none",
  outline: "none",
  boxShadow: "none",
  transform: "scaleX(1.125) scaleY(1.095)",
  transformOrigin: "center",
};

const desktopCoverStyle: CSSProperties = {
  ...coverStyle,
  minHeight: "142px",
  borderRadius: "18px",
};

const cardContentStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  display: "grid",
  alignContent: "center",
  gap: "7px",
};

const desktopCardContentStyle: CSSProperties = {
  ...cardContentStyle,
  gap: "7px",
  alignContent: "center",
};

const cardTopStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "8px",
  minWidth: 0,
};

const cardTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "20px",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const statusRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  minWidth: 0,
};

const cardMetaRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  maxWidth: "100%",
  minWidth: 0,
};

const rankingCardActionRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "2px",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
  boxSizing: "border-box",
};

const desktopRankingCardActionRowStyle: CSSProperties = {
  ...rankingCardActionRowStyle,
  overflow: "visible",
};

const rankingThemeBadgeStyle: CSSProperties = {
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

const desktopRankingThemeBadgeStyle: CSSProperties = {
  ...rankingThemeBadgeStyle,
  flex: "0 1 46%",
  maxWidth: "46%",
  padding: "0 8px",
  textAlign: "center",
  whiteSpace: "normal",
  overflow: "visible",
  textOverflow: "clip",
};

const rankingHighlightBadgeInlineStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  marginTop: 0,
  padding: "0 12px",
  textAlign: "center",
};

const statusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background:
    "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 850,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const publishedStatusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.14)",
  border: "1px solid rgba(34, 197, 94, 0.3)",
  color: "#86EFAC",
  fontSize: "11px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const formatBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const classificationBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const highlightBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  minHeight: "34px",
  padding: "0 10px",
  marginTop: "4px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 900,
  lineHeight: 1.12,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "5px",
  boxSizing: "border-box",
  whiteSpace: "normal",
  overflow: "hidden",
  textOverflow: "ellipsis",
  ...safeTextStyle,
};

const authorStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D8C8FF)",
  fontSize: "12px",
  fontWeight: 750,
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const authorLinkStyle: CSSProperties = {
  ...authorStyle,
  textDecoration: "none",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
};

const statsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 800,
  maxWidth: "100%",
  minWidth: 0,
};

const statsItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  whiteSpace: "nowrap",
  lineHeight: 1,
};

const metricIconStyle: CSSProperties = {
  width: "14px",
  minWidth: "14px",
  height: "17px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  fontSize: "13px",
};

const metricValueStyle: CSSProperties = {
  display: "inline-block",
  lineHeight: 1,
  whiteSpace: "nowrap",
  color: "#FFFFFF",
};

const heartMetricIconStyle: CSSProperties = {
  ...metricIconStyle,
  color: "#BE123C",
};

const starMetricIconStyle: CSSProperties = {
  ...metricIconStyle,
  color: "#FBBF24",
};

const progressCompactStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
};

const progressTrackStyle: CSSProperties = {
  width: "100%",
  height: "7px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.1))",
  overflow: "hidden",
};

const progressBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
};

const progressTextStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

const readStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  marginTop: "2px",
  color: "var(--historietas-accent, #F97316)",
  fontSize: "14px",
  fontWeight: 950,
  ...safeTextStyle,
};

const soonReadStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  marginTop: "4px",
  color: "#A1A1AA",
  fontSize: "14px",
  fontWeight: 950,
  ...safeTextStyle,
};

const authorRankingSectionStyle: CSSProperties = {
  ...sectionStyle,
  marginTop: "38px",
};

const desktopAuthorRankingSectionStyle: CSSProperties = {
  ...desktopSectionStyle,
  marginTop: "44px",
};

const authorRankingSectionIconStyle: CSSProperties = {
  width: "auto",
  height: "auto",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FBBF24",
  fontSize: "28px",
  lineHeight: 1,
  fontWeight: 950,
};

const authorRankingSectionTitleStyle: CSSProperties = {
  ...sectionTitleStyle,
  color: "#FBBF24",
  textAlign: "center",
};

const authorRankingDescriptionStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  lineHeight: 1.35,
  fontWeight: 750,
  textAlign: "center",
  maxWidth: "560px",
  ...safeTextStyle,
};

const authorRankingCarouselStyle: CSSProperties = {
  ...carouselStyle,
  gridAutoColumns: "minmax(278px, calc(100vw - 52px))",
};

const desktopAuthorRankingCarouselStyle: CSSProperties = {
  ...desktopCarouselStyle,
  gridAutoColumns: "minmax(340px, 370px)",
};

const authorRankingCardStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gridTemplateColumns: "88px minmax(0, 1fr)",
  alignItems: "center",
  gap: "12px",
  minHeight: "154px",
  padding: "12px",
  paddingRight: "50px",
  borderRadius: "24px",
  color: "var(--historietas-text-primary, #FFFFFF)",
  cursor: "pointer",
  scrollSnapAlign: "start",
  minWidth: 0,
  overflow: "hidden",
  boxSizing: "border-box",
  boxShadow: "none",
};

const desktopAuthorRankingCardStyle: CSSProperties = {
  ...authorRankingCardStyle,
  gridTemplateColumns: "96px minmax(0, 1fr)",
  minHeight: "164px",
  padding: "14px",
  paddingRight: "54px",
  borderRadius: "26px",
};

const authorRankingAvatarStyle: CSSProperties = {
  position: "relative",
  width: "88px",
  height: "112px",
  borderRadius: "22px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  flex: "0 0 auto",
};

const desktopAuthorRankingAvatarStyle: CSSProperties = {
  ...authorRankingAvatarStyle,
  width: "96px",
  height: "124px",
  borderRadius: "24px",
};

const authorRankingAvatarInitialStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "34px",
  lineHeight: 1,
  fontWeight: 950,
  textShadow: "0 4px 12px rgba(0,0,0,0.42)",
};

const authorRankingTierBadgeStyle: CSSProperties = {
  position: "absolute",
  left: "6px",
  right: "6px",
  bottom: "6px",
  zIndex: 3,
  minHeight: "24px",
  padding: "0 7px",
  borderRadius: "999px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  fontSize: "8px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "0.055em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  boxShadow: "0 6px 12px rgba(0,0,0,0.22)",
  ...safeTextStyle,
};

const authorRankingContentStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: "7px",
  minWidth: 0,
};

const authorRankingCardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "19px",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const authorRankingWorksStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #C4B5FD)",
  fontSize: "11px",
  lineHeight: 1.15,
  fontWeight: 850,
  ...safeTextStyle,
};

const authorRankingStatsStyle: CSSProperties = {
  ...statsStyle,
  columnGap: "7px",
  fontSize: "11px",
};

const authorRankingTitleAreaStyle: CSSProperties = {
  ...cardTopStyle,
  minHeight: "21px",
  paddingRight: "2px",
};

const authorRankingMetaStackStyle: CSSProperties = {
  display: "grid",
  justifyItems: "start",
  alignItems: "start",
  gap: "5px",
  width: "100%",
  minWidth: 0,
};

const authorRankingWorksBadgeStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D8C8FF)",
  fontSize: "12px",
  lineHeight: 1.2,
  fontWeight: 750,
  width: "fit-content",
  maxWidth: "100%",
  background: "transparent",
  border: "none",
  padding: 0,
  borderRadius: 0,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const authorRankingScoreRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  marginTop: "4px",
  maxWidth: "100%",
  minWidth: 0,
};

const emptyButtonStyle: CSSProperties = {
  width: "fit-content",
  minHeight: "40px",
  margin: "0 auto",
  padding: "0 15px",
  borderRadius: "999px",
  background: "#08030F",
  color: "#FFFFFF",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "13px",
  fontWeight: 950,
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "none",
};