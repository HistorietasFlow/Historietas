"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Children, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { supabase } from "../../lib/supabase/client";
import { criarSlugBase, normalizarTexto } from "../../lib/utils";
import {
  historietasThemeCss,
  TEMAS_VISUAIS_HISTORIETAS,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import type {
  TemaVisualHistorietas,
  TemaVisualHistorietasConfig,
} from "../../lib/historietasTheme";

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
  publicado?: boolean;
  totalCurtidas?: number;
  totalComentarios?: number;
  totalSalvos?: number;
  totalLidos?: number;
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
  visualizacoes?: number;
  totalCurtidas?: number;
  totalComentarios?: number;
  totalSalvos?: number;
  totalLidos?: number;
  totalFavoritos?: number;
  totalConcluidas?: number;
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
  visualizacoes?: number | null;
  views?: number | null;
  total_visualizacoes?: number | null;
};

type SupabaseCapituloRow = {
  id: string;
  obra_id: string;
  user_id: string;
  titulo: string | null;
  texto?: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

type SupabaseProgressoLeituraExplorarRow = {
  obra_id: string | null;
  capitulo_id: string | null;
  lido: boolean | null;
  atualizado_em: string | null;
};

type PerfilExplorarRow = {
  id?: string | null;
  user_id?: string | null;
  nome?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  sobre_bio?: string | null;
};

type ModoConteudoExplorar = "obras" | "autores";

type PerfilAutorExplorar = {
  nome: string;
  avatar: string;
  bio: string;
};

type PerfisAutoresExplorar = Record<string, PerfilAutorExplorar>;

type AvaliacaoAutorExplorar = {
  media: number;
  total: number;
};

type AvaliacoesAutoresExplorar = Record<string, AvaliacaoAutorExplorar>;

type AutorExplorar = {
  chave: string;
  nome: string;
  autorId: string;
  avatar: string;
  bio: string;
  totalObras: number;
  totalCurtidas: number;
  totalComentarios: number;
  generos: string[];
  href: string;
  avaliacao?: AvaliacaoAutorExplorar;
};

type AvaliacaoAutorExplorarRow = {
  autor_id?: string | null;
  nota?: number | null;
};

type OrdenacaoExplorar =
  | "relevancia"
  | "mais-curtidas"
  | "mais-salvas"
  | "mais-comentadas"
  | "mais-recentes"
  | "mais-capitulos";

type FiltroColecaoExplorar =
  | "todos"
  | "favoritas"
  | "concluidas"
  | "lendo"
  | "sem-leitura";

const STORAGE_KEY = "historietas-obras";
const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";

type ArquivosObrasBackup = Record<string, ArquivoObraLocal>;

const categorias = [
  "Ação",
  "Aventura",
  "Comédia",
  "Drama",
  "Fantasia",
  "Ficção",
  "Mistério",
  "Romance",
  "Suspense",
  "Terror",
  "Sobrenatural",
  "Histórico",
  "Biografia",
];

const TITULOS_CRIATIVOS_OBRAS_EXPLORAR: Record<string, string> = {
  acao: "Ação do começo ao fim",
  aventura: "Aventuras sem limites",
  comedia: "Para rir agora",
  drama: "Histórias que deixam marcas",
  fantasia: "Mundos além da imaginação",
  ficcao: "Além do que é possível",
  misterio: "Mistérios para desvendar",
  romance: "Amores que deixam marcas",
  suspense: "Tensão até a última página",
  terror: "Histórias para perder o sono",
  sobrenatural: "Entre este mundo e o outro",
  historico: "Viagens por outros tempos",
  biografia: "Vidas que merecem ser contadas",
  outros: "Descobertas fora do comum",
};

const TITULOS_CRIATIVOS_AUTORES_EXPLORAR: Record<string, string> = {
  acao: "Autores que aceleram o coração",
  aventura: "Autores de grandes jornadas",
  comedia: "Autores para arrancar risadas",
  drama: "Autores que tocam fundo",
  fantasia: "Criadores de mundos impossíveis",
  ficcao: "Autores que enxergam além",
  misterio: "Mestres dos enigmas",
  romance: "Autores que escrevem sentimentos",
  suspense: "Mestres da tensão",
  terror: "Autores que dominam o medo",
  sobrenatural: "Vozes do desconhecido",
  historico: "Autores que revivem o passado",
  biografia: "Autores de vidas reais",
  outros: "Novas vozes para descobrir",
};

function obterTituloCriativoObrasExplorar(genero: string) {
  return (
    TITULOS_CRIATIVOS_OBRAS_EXPLORAR[normalizarTexto(genero)] ||
    "Histórias para descobrir"
  );
}

function obterTituloCriativoAutoresExplorar(genero: string) {
  return (
    TITULOS_CRIATIVOS_AUTORES_EXPLORAR[normalizarTexto(genero)] ||
    "Autores para descobrir"
  );
}

function criarStorageKeyUsuarioExplorar(chave: string, userId: string) {
  const usuarioId = userId.trim();

  return usuarioId ? `${chave}:${usuarioId}` : "";
}

function lerStorageUsuarioExplorar(chave: string, userId = "") {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioExplorar(chave, userIdLimpo);

    return chaveStorage ? localStorage.getItem(chaveStorage) : null;
  } catch {
    return null;
  }
}

function salvarJsonStorageUsuarioExplorar(
  chave: string,
  userId: string,
  valor: unknown
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioExplorar(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // localStorage é apoio; a página continua com o estado em memória.
  }
}

function normalizarListaIdsExplorar(valor: unknown) {
  return Array.isArray(valor)
    ? valor
        .filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
        .map((id) => id.trim())
    : [];
}

function carregarListaIdsUsuarioExplorar(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return [] as string[];
  }

  try {
    const texto = lerStorageUsuarioExplorar(chave, userIdLimpo);
    const json: unknown = texto ? JSON.parse(texto) : [];

    return normalizarListaIdsExplorar(json);
  } catch {
    return [] as string[];
  }
}

function salvarListaIdsUsuarioExplorar(
  chave: string,
  userId: string,
  lista: string[]
) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return;
  }

  const listaNormalizada = Array.from(new Set(normalizarListaIdsExplorar(lista)));

  salvarJsonStorageUsuarioExplorar(chave, userIdLimpo, listaNormalizada);
}

function obterIdentificadoresObraExplorar(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">
) {
  return Array.from(
    new Set(
      [
        obra.id,
        obra.slug,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ].filter((valor): valor is string => typeof valor === "string" && Boolean(valor.trim()))
    )
  );
}

function colecaoTemObraExplorar(
  colecao: string[],
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">
) {
  const ids = new Set(normalizarListaIdsExplorar(colecao));

  return obterIdentificadoresObraExplorar(obra).some((identificador) =>
    ids.has(identificador)
  );
}

function criarLoginHrefExplorar() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/explorar";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/explorar";
  const params = new URLSearchParams({
    redirectTo: destinoSeguro,
  });

  return `/login?${params.toString()}`;
}

function criarPerfilAutorHrefExplorar(autor: string, autorId?: string) {
  const parametros = new URLSearchParams();
  const autorLimpo = autor.trim();
  const autorIdLimpo = autorId?.trim() || "";

  if (autorLimpo) {
    parametros.set("autor", autorLimpo);
  }

  if (autorIdLimpo) {
    parametros.set("autorId", autorIdLimpo);
    parametros.set("userId", autorIdLimpo);
  }

  const query = parametros.toString();

  return query ? `/perfil-autor?${query}` : "/perfil-autor";
}

function obterNomeProfileExplorar(profile: PerfilExplorarRow) {
  return typeof profile.nome === "string" && profile.nome.trim()
    ? profile.nome.trim()
    : "";
}

async function carregarNomesProfilesExplorar(userIds: string[]) {
  const idsUnicos = Array.from(
    new Set(userIds.map((id) => id.trim()).filter(Boolean))
  );
  const nomesPorUsuario = new Map<string, string>();

  if (idsUnicos.length === 0) {
    return nomesPorUsuario;
  }

  try {
    const filtroIds = idsUnicos.join(",");
    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, nome, avatar_url, bio, sobre_bio")
      .or(`user_id.in.(${filtroIds}),id.in.(${filtroIds})`)
      .limit(Math.max(idsUnicos.length * 2, 1));

    if (error) {
      console.warn("Não consegui carregar profiles no Explorar:", error.message);
      return nomesPorUsuario;
    }

    ((data || []) as PerfilExplorarRow[]).forEach((profile) => {
      const nome = obterNomeProfileExplorar(profile);

      if (!nome) {
        return;
      }

      [profile.user_id, profile.id].forEach((id) => {
        if (typeof id === "string" && id.trim()) {
          nomesPorUsuario.set(id.trim(), nome);
        }
      });
    });
  } catch (error) {
    console.warn("Não consegui acessar profiles no Explorar:", error);
  }

  return nomesPorUsuario;
}

function aplicarNomesProfilesEmObrasExplorar(
  obrasParaAtualizar: ObraLocal[],
  nomesPorUsuario: Map<string, string>
) {
  if (nomesPorUsuario.size === 0) {
    return obrasParaAtualizar;
  }

  return obrasParaAtualizar.map((obra) => {
    const autorId = obra.autorId?.trim() || "";
    const nomeProfile = autorId ? nomesPorUsuario.get(autorId) || "" : "";

    if (!nomeProfile) {
      return obra;
    }

    return {
      ...obra,
      autor: nomeProfile,
    };
  });
}

function criarIniciaisAutorExplorar(nome: string) {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) {
    return "H";
  }

  return partes
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

function criarBioAutorExplorar(nome: string, generos: string[]) {
  const generosValidos = generos.filter(Boolean).slice(0, 2);

  if (generosValidos.length === 0) {
    return `${nome} publica histórias na Historietas.`;
  }

  return `Autor de ${generosValidos.join(" e ").toLowerCase()} na Historietas.`;
}

function formatarMediaAvaliacaoAutorExplorar(
  avaliacao: AvaliacaoAutorExplorar | undefined
) {
  if (
    !avaliacao ||
    avaliacao.total <= 0 ||
    !Number.isFinite(avaliacao.media) ||
    avaliacao.media <= 0
  ) {
    return "—";
  }

  return avaliacao.media.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

async function carregarPerfisAutoresExplorar(
  userIds: string[]
): Promise<PerfisAutoresExplorar> {
  const idsUnicos = Array.from(
    new Set(userIds.map((id) => id.trim()).filter(Boolean))
  );
  const perfis: PerfisAutoresExplorar = {};

  if (idsUnicos.length === 0) {
    return perfis;
  }

  const linhas: PerfilExplorarRow[] = [];

  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, nome, avatar_url, bio, sobre_bio")
      .in("user_id", idsUnicos)
      .limit(1000);

    if (Array.isArray(data)) {
      linhas.push(...(data as PerfilExplorarRow[]));
    }
  } catch {
    // Tenta também pela coluna id abaixo.
  }

  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, nome, avatar_url, bio, sobre_bio")
      .in("id", idsUnicos)
      .limit(1000);

    if (Array.isArray(data)) {
      linhas.push(...(data as PerfilExplorarRow[]));
    }
  } catch {
    // Avatar e bio são complementares; os cards usam fallback.
  }

  linhas.forEach((perfil) => {
    const nome = typeof perfil.nome === "string" ? perfil.nome.trim() : "";
    const avatar =
      typeof perfil.avatar_url === "string" ? perfil.avatar_url.trim() : "";
    const bioBase =
      (typeof perfil.bio === "string" && perfil.bio.trim()) ||
      (typeof perfil.sobre_bio === "string" && perfil.sobre_bio.trim()) ||
      "";
    const perfilNormalizado: PerfilAutorExplorar = {
      nome,
      avatar,
      bio: bioBase.slice(0, 140),
    };

    [perfil.user_id, perfil.id].forEach((id) => {
      const idLimpo = typeof id === "string" ? id.trim() : "";

      if (idLimpo) {
        perfis[idLimpo] = perfilNormalizado;
      }
    });
  });

  return perfis;
}

async function carregarAvaliacoesAutoresExplorar(
  autorIds: string[]
): Promise<AvaliacoesAutoresExplorar> {
  const idsUnicos = Array.from(
    new Set(autorIds.map((id) => id.trim()).filter(Boolean))
  );
  const resultado: AvaliacoesAutoresExplorar = {};

  if (idsUnicos.length === 0) {
    return resultado;
  }

  try {
    const { data, error } = await supabase
      .from("autor_avaliacoes")
      .select("autor_id, nota")
      .in("autor_id", idsUnicos)
      .limit(5000);

    if (error || !Array.isArray(data)) {
      return resultado;
    }

    const acumulado = new Map<string, { soma: number; total: number }>();

    (data as AvaliacaoAutorExplorarRow[]).forEach((avaliacao) => {
      const autorId = avaliacao.autor_id?.trim() || "";
      const nota = Number(avaliacao.nota);

      if (!autorId || !Number.isFinite(nota) || nota < 0.5 || nota > 5) {
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
        resultado[autorId] = {
          media: valor.soma / valor.total,
          total: valor.total,
        };
      }
    });
  } catch {
    // Avaliação é complementar; o card continua com traço.
  }

  return resultado;
}

function categoriaCombinaComGenero(categoria: string, genero: string) {
  const categoriaNormalizada = normalizarTexto(categoria);
  const generoNormalizado = normalizarTexto(genero);

  if (!categoriaNormalizada || !generoNormalizado) {
    return false;
  }

  if (categoriaNormalizada === "ficcao") {
    return (
      generoNormalizado.includes("ficcao") ||
      generoNormalizado.includes("sci-fi") ||
      generoNormalizado.includes("sci fi")
    );
  }

  return generoNormalizado.includes(categoriaNormalizada);
}

function normalizarContadorExplorar(valor: unknown) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return Math.max(0, Math.round(valor));
  }

  if (typeof valor === "string" && valor.trim()) {
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));

    if (Number.isFinite(numero)) {
      return Math.max(0, Math.round(numero));
    }
  }

  return 0;
}

function totalCurtidasObra(obra: ObraLocal) {
  const totalUsuariosUnicos = normalizarContadorExplorar(obra.totalCurtidas);
  const totalLocal = obra.capitulos.filter((capitulo) => capitulo.curtiu).length;

  return Math.max(totalUsuariosUnicos, totalLocal);
}

function totalComentariosObra(obra: ObraLocal) {
  const totalUsuariosUnicos = normalizarContadorExplorar(
    obra.totalComentarios
  );
  const totalLocal = obra.capitulos.filter((capitulo) =>
    capitulo.comentario.trim()
  ).length;

  return Math.max(totalUsuariosUnicos, totalLocal);
}

function totalSalvosObra(obra: ObraLocal) {
  const totalUsuariosUnicos = normalizarContadorExplorar(obra.totalSalvos);
  const totalFavoritos = normalizarContadorExplorar(obra.totalFavoritos);
  const totalLocal = obra.capitulos.filter((capitulo) => capitulo.salvo).length;

  return Math.max(totalUsuariosUnicos, totalFavoritos, totalLocal);
}

function totalLidosObra(obra: ObraLocal) {
  const totalUsuariosUnicos = normalizarContadorExplorar(obra.totalLidos);
  const totalLocal = obra.capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.max(totalUsuariosUnicos, totalLocal);
}

function obraTemAtividadeLeitura(obra: ObraLocal) {
  return obra.capitulos.some((capitulo) => capitulo.lido);
}

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}

function encontrarCapituloParaContinuar(obra: ObraLocal) {
  const temCapituloLido = obra.capitulos.some((capitulo) => capitulo.lido);

  if (!temCapituloLido) {
    return null;
  }

  const indiceUltimoCapituloLido = obra.ultimoCapituloLidoId
    ? obra.capitulos.findIndex(
        (capitulo) => capitulo.id === obra.ultimoCapituloLidoId
      )
    : -1;

  if (indiceUltimoCapituloLido >= 0) {
    const proximoCapituloNaoLido = obra.capitulos
      .slice(indiceUltimoCapituloLido + 1)
      .find((capitulo) => !capitulo.lido);

    if (proximoCapituloNaoLido) {
      return proximoCapituloNaoLido;
    }
  }

  return obra.capitulos.find((capitulo) => !capitulo.lido) || null;
}

function dataCriacaoObra(obra: ObraLocal) {
  const data = new Date(obra.criadaEm).getTime();

  return Number.isNaN(data) ? 0 : data;
}

function dataUltimoCapituloObraExplorar(obra: ObraLocal) {
  return obra.capitulos.reduce((tempoMaisRecente, capitulo) => {
    const tempoCapitulo = new Date(capitulo.criadoEm).getTime();

    return Number.isNaN(tempoCapitulo)
      ? tempoMaisRecente
      : Math.max(tempoMaisRecente, tempoCapitulo);
  }, dataCriacaoObra(obra));
}

function pontuacaoRecomendacaoObraExplorar(obra: ObraLocal) {
  return (
    normalizarContadorExplorar(obra.visualizacoes) +
    totalCurtidasObra(obra) * 8 +
    totalComentariosObra(obra) * 5 +
    totalSalvosObra(obra) * 6 +
    totalLidosObra(obra) * 3 +
    obra.capitulos.length * 2
  );
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
    texto: typeof capitulo.texto === "string" ? capitulo.texto : "",
    curtiu: Boolean(capitulo.curtiu),
    salvo: Boolean(capitulo.salvo),
    comentario:
      typeof capitulo.comentario === "string" ? capitulo.comentario : "",
    criadoEm: typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
    lido: Boolean(capitulo.lido),
    lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
    publicado: capitulo.publicado !== false,
    totalCurtidas: normalizarContadorExplorar(capitulo.totalCurtidas),
    totalComentarios: normalizarContadorExplorar(capitulo.totalComentarios),
    totalSalvos: normalizarContadorExplorar(capitulo.totalSalvos),
    totalLidos: normalizarContadorExplorar(capitulo.totalLidos),
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

function obraTemArquivoAnexadoExplorar(
  obra: Pick<ObraLocal, "arquivoObra">
) {
  return Boolean(normalizarArquivoObra(obra.arquivoObra));
}

function obraTemConteudoPublicadoExplorar(
  obra: Pick<ObraLocal, "capitulos" | "arquivoObra">
) {
  return obra.capitulos.length > 0 || obraTemArquivoAnexadoExplorar(obra);
}

function carregarBackupArquivosObras(userId = ""): ArquivosObrasBackup {
  if (typeof window === "undefined" || !userId.trim()) {
    return {};
  }

  try {
    const backupTexto = lerStorageUsuarioExplorar(
      FILE_BACKUP_STORAGE_KEY,
      userId
    );
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
  slug: string,
  userId = ""
) {
  const arquivoAtual = normalizarArquivoObra(obra.arquivoObra);

  if (arquivoAtual) {
    return arquivoAtual;
  }

  const backupArquivos = carregarBackupArquivosObras(userId);
  const chaves = criarChavesBackupObra(obra, slug);

  for (const chave of chaves) {
    const arquivoBackup = normalizarArquivoObra(backupArquivos[chave]);

    if (arquivoBackup) {
      return arquivoBackup;
    }
  }

  return null;
}

function salvarBackupsArquivosObras(obrasParaSalvar: ObraLocal[], userId = "") {
  if (typeof window === "undefined" || !userId.trim()) {
    return;
  }

  const backupAtual = carregarBackupArquivosObras(userId);
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

  salvarJsonStorageUsuarioExplorar(
    FILE_BACKUP_STORAGE_KEY,
    userId,
    proximoBackup
  );
}

function normalizarObra(
  obra: Partial<ObraLocal> & Record<string, unknown>,
  index: number,
  userId = ""
): ObraLocal {
  const capitulosNormalizadosTodos: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapitulo(capitulo, capituloIndex)
      )
    : [];
  const capitulosNormalizados = capitulosNormalizadosTodos.filter(
    (capitulo) => capitulo.publicado !== false
  );

  const tagsNormalizadas = Array.isArray(obra.tags)
    ? obra.tags
        .filter((tag): tag is string => {
          return typeof tag === "string" && Boolean(tag.trim());
        })
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
    autorId:
      typeof obra.autorId === "string" && obra.autorId.trim()
        ? obra.autorId.trim()
        : typeof obra.user_id === "string" && obra.user_id.trim()
          ? obra.user_id.trim()
          : typeof obra.userId === "string" && obra.userId.trim()
            ? obra.userId.trim()
            : typeof obra.autor_id === "string" && obra.autor_id.trim()
              ? obra.autor_id.trim()
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
    arquivoObra: obterArquivoObraComBackup(obra, slug, userId),
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
    visualizacoes: normalizarContadorExplorar(obra.visualizacoes),
    totalCurtidas: normalizarContadorExplorar(obra.totalCurtidas),
    totalComentarios: normalizarContadorExplorar(
      obra.totalComentarios ?? obra.comentarios ?? obra.total_comentarios
    ),
    totalSalvos: normalizarContadorExplorar(
      obra.totalSalvos ?? obra.salvos ?? obra.total_salvos
    ),
    totalLidos: normalizarContadorExplorar(
      obra.totalLidos ?? obra.lidos ?? obra.total_lidos
    ),
    totalFavoritos: normalizarContadorExplorar(obra.totalFavoritos),
    totalConcluidas: normalizarContadorExplorar(obra.totalConcluidas),
    slug,
    link:
      typeof obra.link === "string" && obra.link.trim()
        ? obra.link
        : `/obra/${slug}`,
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

  const capitulosRemotos: CapituloLocal[] = capitulosSupabase.map(
    (capitulo, capituloIndex) => {
      const capituloLocal = capitulosLocaisPorId.get(capitulo.id);

      return {
        id: capitulo.id,
        titulo:
          capitulo.titulo?.trim() ||
          capituloLocal?.titulo ||
          `Capítulo ${capituloIndex + 1}`,
        texto: "",
        curtiu: Boolean(capituloLocal?.curtiu),
        salvo: Boolean(capituloLocal?.salvo),
        comentario: capituloLocal?.comentario || "",
        criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
        lido: Boolean(capituloLocal?.lido),
        lidoEm: capituloLocal?.lidoEm || "",
        publicado: true,
        totalCurtidas: normalizarContadorExplorar(capituloLocal?.totalCurtidas),
        totalComentarios: normalizarContadorExplorar(capituloLocal?.totalComentarios),
        totalSalvos: normalizarContadorExplorar(capituloLocal?.totalSalvos),
        totalLidos: normalizarContadorExplorar(capituloLocal?.totalLidos),
      };
    }
  );

  const capitulosMesclados = capitulosRemotos;
  const tituloObra = obra.titulo?.trim() || "Obra sem título";
  const slugObra =
    obra.slug?.trim() ||
    criarSlugBase(tituloObra || `obra-${index + 1}`);
  const arquivoUrl = obra.arquivo_url?.trim() || "";
  const arquivoCategoria = normalizarCategoriaArquivoSupabase(
    obra.arquivo_categoria
  );
  const arquivoTipo =
    obra.arquivo_tipo?.trim() ||
    (arquivoCategoria === "documento"
      ? "application/pdf"
      : arquivoCategoria === "imagem"
        ? "image/*"
        : arquivoCategoria === "texto"
          ? "text/plain"
          : "");

  return {
    id: obra.id || `obra-${index + 1}`,
    titulo: tituloObra,
    autor: obra.autor?.trim() || "Autor não informado",
    autorId: obra.user_id?.trim() || "",
    genero: obra.genero?.trim() || "Não informado",
    formato: obra.formato?.trim() || "Não informado",
    classificacaoIndicativa:
      obra.classificacao_indicativa?.trim() ||
      "Não informada",
    sinopse:
      obra.sinopse?.trim() ||
      "Nenhuma sinopse informada.",
    tags:
      Array.isArray(obra.tags) && obra.tags.length > 0
        ? obra.tags.filter((tag) => typeof tag === "string" && Boolean(tag.trim()))
        : ["sem tags"],
    capa: obra.capa_url?.trim() || "",
    capaNome: obra.capa_nome?.trim() || "",
    arquivoObra: arquivoUrl
      ? {
          nome:
            obra.arquivo_nome?.trim() ||
            "Arquivo da obra",
          tipo: arquivoTipo,
          tamanho:
            typeof obra.arquivo_tamanho === "number" &&
            Number.isFinite(obra.arquivo_tamanho)
              ? obra.arquivo_tamanho
              : 0,
          conteudo: arquivoUrl,
          categoria: arquivoCategoria,
          criadoEm: obra.criada_em || "",
        }
      : null,
    publicado: Boolean(obra.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obra.criada_em || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    visualizacoes: normalizarContadorExplorar(
      obra.visualizacoes ?? obra.views ?? obra.total_visualizacoes ?? obraLocal?.visualizacoes
    ),
    totalCurtidas: normalizarContadorExplorar(obraLocal?.totalCurtidas),
    totalComentarios: normalizarContadorExplorar(
      obraLocal?.totalComentarios
    ),
    totalSalvos: normalizarContadorExplorar(obraLocal?.totalSalvos),
    totalLidos: normalizarContadorExplorar(obraLocal?.totalLidos),
    totalFavoritos: normalizarContadorExplorar(obraLocal?.totalFavoritos),
    totalConcluidas: normalizarContadorExplorar(obraLocal?.totalConcluidas),
    slug: slugObra,
    link: `/obra/${slugObra}`,
  };
}

function mesclarObrasSemDuplicar(
  obrasLocais: ObraLocal[],
  obrasSupabase: ObraLocal[]
) {
  const obrasMescladas: ObraLocal[] = [];
  const chavesUsadas = new Set<string>();

  [...obrasSupabase, ...obrasLocais].forEach((obra) => {
    const slug = obra.slug || criarSlugBase(obra.titulo);
    const chaves = [obra.id, slug].filter((chave) => Boolean(chave.trim()));
    const jaExiste = chaves.some((chave) => chavesUsadas.has(chave));

    if (jaExiste) {
      return;
    }

    obrasMescladas.push(obra);
    chaves.forEach((chave) => chavesUsadas.add(chave));
  });

  return obrasMescladas;
}

async function carregarIdsColecaoUsuarioExplorar(
  tabela: "favoritos" | "concluidas",
  userId: string
) {
  if (!userId.trim()) {
    return [] as string[];
  }

  try {
    const { data, error } = await supabase
      .from(tabela)
      .select("obra_id")
      .eq("user_id", userId)
      .limit(1000);

    if (error || !Array.isArray(data)) {
      if (error) {
        console.warn(`Não consegui carregar ${tabela} no Explorar:`, error.message);
      }

      return [] as string[];
    }

    return data
      .map((registro) => {
        if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
          return "";
        }

        const obraId = (registro as Record<string, unknown>).obra_id;

        return typeof obraId === "string" ? obraId.trim() : "";
      })
      .filter(Boolean);
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} no Explorar:`, error);
    return [] as string[];
  }
}

async function carregarColecoesUsuarioExplorar(userId: string) {
  const [favoritas, concluidas] = await Promise.all([
    carregarIdsColecaoUsuarioExplorar("favoritos", userId),
    carregarIdsColecaoUsuarioExplorar("concluidas", userId),
  ]);

  return {
    favoritas,
    concluidas,
  };
}


function separarEmLotesExplorar<T>(itens: T[], tamanho = 400) {
  const lotes: T[][] = [];

  for (let indice = 0; indice < itens.length; indice += tamanho) {
    lotes.push(itens.slice(indice, indice + tamanho));
  }

  return lotes;
}

function adicionarUsuarioUnicoExplorar(
  usuariosPorChave: Map<string, Set<string>>,
  chave: string,
  userId: string
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

function combinarUsuariosPorChaveExplorar(
  ...fontes: Map<string, Set<string>>[]
) {
  const usuariosCombinados = new Map<string, Set<string>>();

  fontes.forEach((fonte) => {
    fonte.forEach((usuarios, chave) => {
      usuarios.forEach((userId) => {
        adicionarUsuarioUnicoExplorar(usuariosCombinados, chave, userId);
      });
    });
  });

  return usuariosCombinados;
}

function mapearUsuariosCapitulosParaObrasExplorar(
  usuariosPorCapitulo: Map<string, Set<string>>,
  obraIdPorCapitulo: Map<string, string>
) {
  const usuariosPorObra = new Map<string, Set<string>>();

  usuariosPorCapitulo.forEach((usuarios, capituloId) => {
    const obraId = obraIdPorCapitulo.get(capituloId)?.trim() || "";

    usuarios.forEach((userId) => {
      adicionarUsuarioUnicoExplorar(usuariosPorObra, obraId, userId);
    });
  });

  return usuariosPorObra;
}

function contarUsuariosUnicosExplorar(
  usuariosPorChave: Map<string, Set<string>>,
  chave: string
) {
  const chaveLimpa = chave.trim();

  return chaveLimpa ? usuariosPorChave.get(chaveLimpa)?.size || 0 : 0;
}

async function carregarUsuariosPorColunaExplorar(
  tabela: string,
  coluna: string,
  ids: string[]
) {
  const idsUnicos = Array.from(
    new Set(ids.map((id) => id.trim()).filter(Boolean))
  );
  const usuariosPorChave = new Map<string, Set<string>>();

  if (idsUnicos.length === 0) {
    return usuariosPorChave;
  }

  const tamanhoPagina = 1000;

  for (const loteIds of separarEmLotesExplorar(idsUnicos)) {
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
          if (
            !registro ||
            typeof registro !== "object" ||
            Array.isArray(registro)
          ) {
            return;
          }

          const linha = registro as Record<string, unknown>;
          const chave =
            typeof linha[coluna] === "string" ? linha[coluna].trim() : "";
          const userId =
            typeof linha.user_id === "string" ? linha.user_id.trim() : "";

          adicionarUsuarioUnicoExplorar(
            usuariosPorChave,
            chave,
            userId
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

async function aplicarTotaisReaisExplorar(obrasParaAtualizar: ObraLocal[]) {
  const obraIdPorCapitulo = new Map<string, string>();

  obrasParaAtualizar.forEach((obra) => {
    const obraId = obra.id.trim();

    obra.capitulos.forEach((capitulo) => {
      const capituloId = capitulo.id.trim();

      if (obraId && capituloId) {
        obraIdPorCapitulo.set(capituloId, obraId);
      }
    });
  });

  const capituloIds = Array.from(obraIdPorCapitulo.keys());
  const obraIds = Array.from(
    new Set(obrasParaAtualizar.map((obra) => obra.id.trim()).filter(Boolean))
  );

  if (capituloIds.length === 0 && obraIds.length === 0) {
    return obrasParaAtualizar;
  }

  const [
    usuariosCurtidasPorCapitulo,
    usuariosComentariosPorCapitulo,
    usuariosSalvosPorCapitulo,
    usuariosLidosPorCapitulo,
    usuariosCurtidasDiretasPorObra,
    usuariosComentariosDiretosPorObra,
    usuariosFavoritosPorObra,
    usuariosConcluidasPorObra,
  ] = await Promise.all([
    carregarUsuariosPorColunaExplorar(
      "curtidas_capitulos",
      "capitulo_id",
      capituloIds
    ),
    carregarUsuariosPorColunaExplorar(
      "comentarios_capitulos",
      "capitulo_id",
      capituloIds
    ),
    carregarUsuariosPorColunaExplorar(
      "salvos_capitulos",
      "capitulo_id",
      capituloIds
    ),
    carregarUsuariosPorColunaExplorar(
      "progresso_leitura",
      "capitulo_id",
      capituloIds
    ),
    carregarUsuariosPorColunaExplorar(
      "obra_curtidas",
      "obra_id",
      obraIds
    ),
    carregarUsuariosPorColunaExplorar(
      "comentarios_obras",
      "obra_id",
      obraIds
    ),
    carregarUsuariosPorColunaExplorar(
      "favoritos",
      "obra_id",
      obraIds
    ),
    carregarUsuariosPorColunaExplorar(
      "concluidas",
      "obra_id",
      obraIds
    ),
  ]);

  const usuariosCurtidasCapitulosPorObra =
    mapearUsuariosCapitulosParaObrasExplorar(
      usuariosCurtidasPorCapitulo,
      obraIdPorCapitulo
    );
  const usuariosComentariosCapitulosPorObra =
    mapearUsuariosCapitulosParaObrasExplorar(
      usuariosComentariosPorCapitulo,
      obraIdPorCapitulo
    );
  const usuariosSalvosCapitulosPorObra =
    mapearUsuariosCapitulosParaObrasExplorar(
      usuariosSalvosPorCapitulo,
      obraIdPorCapitulo
    );
  const usuariosLidosCapitulosPorObra =
    mapearUsuariosCapitulosParaObrasExplorar(
      usuariosLidosPorCapitulo,
      obraIdPorCapitulo
    );

  const usuariosCurtidasPorObra = combinarUsuariosPorChaveExplorar(
    usuariosCurtidasDiretasPorObra,
    usuariosCurtidasCapitulosPorObra
  );
  const usuariosComentariosPorObra = combinarUsuariosPorChaveExplorar(
    usuariosComentariosDiretosPorObra,
    usuariosComentariosCapitulosPorObra
  );
  const usuariosSalvosPorObra = combinarUsuariosPorChaveExplorar(
    usuariosFavoritosPorObra,
    usuariosSalvosCapitulosPorObra
  );

  return obrasParaAtualizar.map((obra) => ({
    ...obra,
    totalCurtidas: contarUsuariosUnicosExplorar(
      usuariosCurtidasPorObra,
      obra.id
    ),
    totalComentarios: contarUsuariosUnicosExplorar(
      usuariosComentariosPorObra,
      obra.id
    ),
    totalSalvos: contarUsuariosUnicosExplorar(
      usuariosSalvosPorObra,
      obra.id
    ),
    totalLidos: contarUsuariosUnicosExplorar(
      usuariosLidosCapitulosPorObra,
      obra.id
    ),
    totalFavoritos: contarUsuariosUnicosExplorar(
      usuariosFavoritosPorObra,
      obra.id
    ),
    totalConcluidas: contarUsuariosUnicosExplorar(
      usuariosConcluidasPorObra,
      obra.id
    ),
    capitulos: obra.capitulos.map((capitulo) => ({
      ...capitulo,
      totalCurtidas: contarUsuariosUnicosExplorar(
        usuariosCurtidasPorCapitulo,
        capitulo.id
      ),
      totalComentarios: contarUsuariosUnicosExplorar(
        usuariosComentariosPorCapitulo,
        capitulo.id
      ),
      totalSalvos: contarUsuariosUnicosExplorar(
        usuariosSalvosPorCapitulo,
        capitulo.id
      ),
      totalLidos: contarUsuariosUnicosExplorar(
        usuariosLidosPorCapitulo,
        capitulo.id
      ),
    })),
  }));
}

async function aplicarProgressoUsuarioExplorar(
  obrasParaAtualizar: ObraLocal[],
  userId: string
) {
  const userIdLimpo = userId.trim();
  const obraIdPorCapitulo = new Map<string, string>();

  obrasParaAtualizar.forEach((obra) => {
    obra.capitulos.forEach((capitulo) => {
      const obraId = obra.id.trim();
      const capituloId = capitulo.id.trim();

      if (obraId && capituloId) {
        obraIdPorCapitulo.set(capituloId, obraId);
      }
    });
  });

  const obraIds = Array.from(
    new Set(Array.from(obraIdPorCapitulo.values()))
  );

  if (!userIdLimpo || obraIds.length === 0) {
    return obrasParaAtualizar;
  }

  try {
    const { data, error } = await supabase
      .from("progresso_leitura")
      .select("obra_id,capitulo_id,lido,atualizado_em")
      .eq("user_id", userIdLimpo)
      .in("obra_id", obraIds)
      .order("atualizado_em", { ascending: false })
      .limit(5000);

    if (error || !Array.isArray(data)) {
      return obrasParaAtualizar;
    }

    const progressoPorCapitulo =
      new Map<string, SupabaseProgressoLeituraExplorarRow>();

    (data as unknown as SupabaseProgressoLeituraExplorarRow[]).forEach(
      (registro) => {
        const obraId = registro.obra_id?.trim() || "";
        const capituloId = registro.capitulo_id?.trim() || "";
        const obraDoCapitulo = obraIdPorCapitulo.get(capituloId) || "";

        if (
          obraId &&
          capituloId &&
          obraDoCapitulo === obraId &&
          !progressoPorCapitulo.has(capituloId)
        ) {
          progressoPorCapitulo.set(capituloId, registro);
        }
      }
    );

    return obrasParaAtualizar.map((obra) => {
      let ultimoCapituloLidoId = "";
      let ultimaLeituraEm = "";

      const capitulos = obra.capitulos.map((capitulo) => {
        const registro = progressoPorCapitulo.get(capitulo.id);
        const lido = registro?.lido === true;
        const lidoEm =
          lido && typeof registro?.atualizado_em === "string"
            ? registro.atualizado_em
            : "";

        if (lido) {
          const tempoAtual = new Date(lidoEm).getTime();
          const tempoUltimo = new Date(ultimaLeituraEm).getTime();
          const tempoAtualSeguro = Number.isNaN(tempoAtual) ? 0 : tempoAtual;
          const tempoUltimoSeguro = Number.isNaN(tempoUltimo) ? 0 : tempoUltimo;

          if (
            !ultimoCapituloLidoId ||
            tempoAtualSeguro >= tempoUltimoSeguro
          ) {
            ultimoCapituloLidoId = capitulo.id;
            ultimaLeituraEm = lidoEm;
          }
        }

        return {
          ...capitulo,
          lido,
          lidoEm,
        };
      });

      return {
        ...obra,
        capitulos,
        ultimoCapituloLidoId,
        ultimaLeituraEm,
        progressoLeitura: calcularProgressoLeitura(capitulos),
      };
    });
  } catch {
    return obrasParaAtualizar;
  }
}

async function carregarObrasPublicadasSupabase(obrasLocais: ObraLocal[], userId = "") {
  try {
    const { data: obrasBanco, error: erroObras } = await supabase
      .from("obras")
      .select(
        "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,visualizacoes,slug,link,criada_em,atualizado_em"
      )
      .eq("publicado", true)
      .order("criada_em", { ascending: false })
      .limit(80);

    if (erroObras) {
      console.warn(
        "Não consegui carregar obras publicadas do Supabase:",
        erroObras.message
      );
      const obrasComTotais = await aplicarTotaisReaisExplorar(obrasLocais);

      return aplicarProgressoUsuarioExplorar(obrasComTotais, userId);
    }

    const obrasSupabase = ((obrasBanco || []) as unknown as SupabaseObraRow[]).filter(
      (obra) => Boolean(obra.id)
    );

    const nomesProfiles = await carregarNomesProfilesExplorar([
      ...obrasLocais.map((obra) => obra.autorId || ""),
      ...obrasSupabase.map((obra) => obra.user_id || ""),
    ]);
    const obrasLocaisComProfiles = aplicarNomesProfilesEmObrasExplorar(
      obrasLocais,
      nomesProfiles
    );

    if (obrasSupabase.length === 0) {
      const obrasComTotais = await aplicarTotaisReaisExplorar(
        obrasLocaisComProfiles
      );

      return aplicarProgressoUsuarioExplorar(obrasComTotais, userId);
    }

    const idsObras = obrasSupabase.map((obra) => obra.id);
    const { data: capitulosBanco, error: erroCapitulos } = await supabase
      .from("capitulos")
      .select("id,obra_id,user_id,titulo,ordem,publicado,criado_em,atualizado_em")
      .in("obra_id", idsObras)
      .eq("publicado", true)
      .order("ordem", { ascending: true })
      .limit(600);

    if (erroCapitulos) {
      console.warn(
        "Não consegui carregar capítulos do Supabase no Explorar:",
        erroCapitulos.message
      );
    }

    const capitulosPorObra = new Map<string, SupabaseCapituloRow[]>();

    ((erroCapitulos ? [] : capitulosBanco || []) as unknown as SupabaseCapituloRow[]).forEach(
      (capitulo) => {
        const capitulosAtuais = capitulosPorObra.get(capitulo.obra_id) || [];
        capitulosAtuais.push(capitulo);
        capitulosPorObra.set(capitulo.obra_id, capitulosAtuais);
      }
    );

    const obrasSupabaseNormalizadas = obrasSupabase
      .map((obraBanco, index) => {
        const slugBanco = obraBanco.slug?.trim() || "";
        const obraLocal = obrasLocais.find((obraLocalAtual) => {
          const slugLocal =
            obraLocalAtual.slug || criarSlugBase(obraLocalAtual.titulo);

          return obraLocalAtual.id === obraBanco.id || slugLocal === slugBanco;
        });

        const obraNormalizada = normalizarObraSupabase(
          obraBanco,
          capitulosPorObra.get(obraBanco.id) || [],
          obraLocal,
          index
        );
        const nomeProfile =
          nomesProfiles.get(obraNormalizada.autorId || "") || "";

        return nomeProfile
          ? {
              ...obraNormalizada,
              autor: nomeProfile,
            }
          : obraNormalizada;
      })
      .filter((obra) => obraTemConteudoPublicadoExplorar(obra));

    const obrasMescladas = mesclarObrasSemDuplicar(
      obrasLocaisComProfiles,
      obrasSupabaseNormalizadas
    );
    const obrasComTotaisReais = await aplicarTotaisReaisExplorar(obrasMescladas);
    const obrasComProgresso = await aplicarProgressoUsuarioExplorar(
      obrasComTotaisReais,
      userId
    );

    salvarBackupsArquivosObras(obrasComProgresso, userId);
    salvarJsonStorageUsuarioExplorar(STORAGE_KEY, userId, obrasComProgresso);

    return obrasComProgresso;
  } catch (error) {
    console.warn("Não consegui acessar o Supabase no Explorar:", error);
    const obrasComTotais = await aplicarTotaisReaisExplorar(obrasLocais);

    return aplicarProgressoUsuarioExplorar(obrasComTotais, userId);
  }
}

function ordenarObrasLocais(lista: ObraLocal[], ordenacao: OrdenacaoExplorar) {
  const novaLista = [...lista];

  if (ordenacao === "mais-curtidas") {
    return novaLista.sort(
      (a, b) => totalCurtidasObra(b) - totalCurtidasObra(a)
    );
  }

  if (ordenacao === "mais-salvas") {
    return novaLista.sort((a, b) => totalSalvosObra(b) - totalSalvosObra(a));
  }

  if (ordenacao === "mais-comentadas") {
    return novaLista.sort(
      (a, b) => totalComentariosObra(b) - totalComentariosObra(a)
    );
  }

  if (ordenacao === "mais-recentes") {
    return novaLista.sort((a, b) => dataCriacaoObra(b) - dataCriacaoObra(a));
  }

  if (ordenacao === "mais-capitulos") {
    return novaLista.sort((a, b) => b.capitulos.length - a.capitulos.length);
  }

  return novaLista;
}

function criarPublishedCoverStyle(
  capa: string,
  tema?: ReturnType<typeof obterTemaCategoria>
): CSSProperties {
  const baseStyle = tema ? criarPublishedCoverTemaStyle(tema) : publishedCoverStyle;

  if (!capa) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "none",
    opacity: 1,
  };
}

type TemaCategoriaExplorar = {
  accent: string;
  secondary: string;
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  glowPrimary: string;
  glowSecondary: string;
  titleTo: string;
  activeSurface: string;
  secondarySurface: string;
  secondaryButtonText: string;
  pageBackground: string;
  heroBackground: string;
  activeBackground: string;
};

function criarTemaCategoriaExplorar(
  tema: Pick<
    TemaVisualHistorietasConfig,
    | "accent"
    | "secondary"
    | "bgStart"
    | "bgMid"
    | "bgEnd"
    | "glowPrimary"
    | "glowSecondary"
    | "titleTo"
    | "activeSurface"
    | "secondarySurface"
    | "secondaryButtonText"
    | "surfaceStrong"
  >,
  temaVisual: TemaVisualHistorietas = "original"
): TemaCategoriaExplorar {
  if (temaVisual === "foco") {
    return {
      accent: tema.accent,
      secondary: tema.secondary,
      bgStart: tema.bgStart,
      bgMid: tema.bgMid,
      bgEnd: tema.bgEnd,
      glowPrimary: tema.glowPrimary,
      glowSecondary: tema.glowSecondary,
      titleTo: tema.titleTo,
      activeSurface: tema.activeSurface,
      secondarySurface: tema.secondarySurface,
      secondaryButtonText: tema.secondaryButtonText,
      activeBackground: tema.surfaceStrong,
      pageBackground: tema.bgStart,
      heroBackground: tema.bgStart,
    };
  }

  return {
    accent: "#A78BFA",
    secondary: "#4C1D95",
    bgStart: "#070212",
    bgMid: "#070212",
    bgEnd: "#070212",
    glowPrimary: "transparent",
    glowSecondary: "transparent",
    titleTo: "#DDD6FE",
    activeSurface: "rgba(46, 16, 101, 0.54)",
    secondarySurface: "rgba(255,255,255,0.06)",
    secondaryButtonText: "#DDD6FE",
    activeBackground: "#08030F",
    pageBackground: "#070212",
    heroBackground: "#070212",
  };
}

function obterTemaCategoria(
  _categoria: string,
  temaVisual: TemaVisualHistorietas = "original"
) {
  return criarTemaCategoriaExplorar(
    TEMAS_VISUAIS_HISTORIETAS[temaVisual],
    temaVisual
  );
}

function criarTemaPaginaVisualExplorar(
  temaVisual: TemaVisualHistorietas
): TemaCategoriaExplorar {
  return criarTemaCategoriaExplorar(
    TEMAS_VISUAIS_HISTORIETAS[temaVisual],
    temaVisual
  );
}

function obterDecoracoesCategoria(categoria: string) {
  const categoriaNormalizada = normalizarTexto(categoria);

  if (categoriaNormalizada === "sobrenatural") {
    return ["☾", "✦", "👻", "✧", "◌"];
  }

  if (categoriaNormalizada === "terror") {
    return ["☾", "🕸", "✕", "◌", "✦"];
  }

  if (categoriaNormalizada === "fantasia") {
    return ["✦", "✧", "◇", "☾", "✶"];
  }

  if (categoriaNormalizada === "ficcao" || categoriaNormalizada === "sci-fi" || categoriaNormalizada === "sci fi") {
    return ["⌁", "◇", "＋", "◌", "⌬"];
  }

  if (categoriaNormalizada === "romance") {
    return ["✦", "♡", "✧", "◌", "❀"];
  }

  if (categoriaNormalizada === "acao") {
    return ["✦", "╱", "⚡", "✕", "╲"];
  }

  if (categoriaNormalizada === "drama") {
    return ["☾", "✧", "◌", "✦", "◇"];
  }

  if (categoriaNormalizada === "aventura") {
    return ["✦", "⌖", "◇", "☾", "✧"];
  }

  if (categoriaNormalizada === "comedia") {
    return ["✦", "☺", "✧", "☆", "◌"];
  }

  return ["✦", "◌", "✧"];
}

function criarDecoracaoTemaStyle(
  _index: number,
  _tema: ReturnType<typeof obterTemaCategoria>
): CSSProperties {
  return {
    display: "none",
  };
}

export default function ExplorarPage() {
  const router = useRouter();
  const { temaVisual, pageThemeStyle } = useHistorietasTheme(pageStyle);
  const [obrasLocais, setObrasLocais] = useState<ObraLocal[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [modoConteudo, setModoConteudo] =
    useState<ModoConteudoExplorar>("obras");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [perfisAutores, setPerfisAutores] =
    useState<PerfisAutoresExplorar>({});
  const [avaliacoesAutores, setAvaliacoesAutores] =
    useState<AvaliacoesAutoresExplorar>({});
  const [busca, setBusca] = useState("");
  const [buscaMobileAberta, setBuscaMobileAberta] = useState(false);
  const [filtroFormato, setFiltroFormato] = useState("todos");
  const [filtroClassificacao, setFiltroClassificacao] = useState("todos");
  const [filtroCapitulos, setFiltroCapitulos] = useState("todos");
  const [filtroColecao, setFiltroColecao] =
    useState<FiltroColecaoExplorar>("todos");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoExplorar>("relevancia");
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [mensagemLogin, setMensagemLogin] = useState("");

  useEffect(() => {
    let componenteAtivo = true;

    async function verificarUsuarioLogado() {
      try {
        const { data } = await supabase.auth.getUser();

        if (componenteAtivo) {
          const userId = data.user?.id || "";

          setUsuarioLogado(Boolean(userId));
          setUsuarioIdLogado(userId);
        }
      } catch {
        if (componenteAtivo) {
          setUsuarioLogado(false);
          setUsuarioIdLogado("");
        }
      }
    }

    void verificarUsuarioLogado();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id || "";

      setUsuarioLogado(Boolean(userId));
      setUsuarioIdLogado(userId);

      if (session?.user) {
        setMensagemLogin("");
        return;
      }

      setFiltroColecao("todos");
    });

    return () => {
      componenteAtivo = false;
      subscription.unsubscribe();
    };
  }, []);

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
    if (!mostrarFiltrosAvancados || typeof document === "undefined") {
      return;
    }

    const bodyOverflowAnterior = document.body.style.overflow;
    const htmlOverflowAnterior = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = bodyOverflowAnterior;
      document.documentElement.style.overflow = htmlOverflowAnterior;
    };
  }, [mostrarFiltrosAvancados]);

  useEffect(() => {
    let cancelado = false;

    async function carregarExplorar() {
      const params = new URLSearchParams(window.location.search);
      const categoriaParam = params.get("categoria") || "";
      const tipoParam = params.get("tipo") === "autores" ? "autores" : "obras";

      setModoConteudo(tipoParam);
      setCategoriaSelecionada(categoriaParam.trim());

      try {
        let userIdAtual = "";

        try {
          const { data } = await supabase.auth.getUser();
          userIdAtual = data.user?.id || "";
        } catch {
          userIdAtual = "";
        }

        if (!cancelado) {
          setUsuarioLogado(Boolean(userIdAtual));
          setUsuarioIdLogado(userIdAtual);
        }

        const obrasSalvasTexto = lerStorageUsuarioExplorar(
          STORAGE_KEY,
          userIdAtual
        );
        const obrasSalvasJson = obrasSalvasTexto
          ? JSON.parse(obrasSalvasTexto)
          : [];

        const obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
          ? obrasSalvasJson.map((obra, index) =>
              normalizarObra(obra, index, userIdAtual)
            )
          : [];

        salvarBackupsArquivosObras(obrasNormalizadas, userIdAtual);
        salvarJsonStorageUsuarioExplorar(STORAGE_KEY, userIdAtual, obrasNormalizadas);

        const favoritasGlobais: string[] = [];
        const favoritasDoUsuario = userIdAtual
          ? carregarListaIdsUsuarioExplorar(FAVORITES_STORAGE_KEY, userIdAtual)
          : [];

        const concluidasGlobais: string[] = [];
        const concluidasDoUsuario = userIdAtual
          ? carregarListaIdsUsuarioExplorar(COMPLETED_STORAGE_KEY, userIdAtual)
          : [];

        const colecoesSupabase = userIdAtual
          ? await carregarColecoesUsuarioExplorar(userIdAtual)
          : { favoritas: [] as string[], concluidas: [] as string[] };

        const obrasFavoritasNormalizadas = Array.from(
          new Set([
            ...favoritasGlobais,
            ...favoritasDoUsuario,
            ...colecoesSupabase.favoritas,
          ])
        );
        const obrasConcluidasNormalizadas = Array.from(
          new Set([
            ...concluidasGlobais,
            ...concluidasDoUsuario,
            ...colecoesSupabase.concluidas,
          ])
        );

        salvarListaIdsUsuarioExplorar(
          FAVORITES_STORAGE_KEY,
          userIdAtual,
          obrasFavoritasNormalizadas
        );
        salvarListaIdsUsuarioExplorar(
          COMPLETED_STORAGE_KEY,
          userIdAtual,
          obrasConcluidasNormalizadas
        );

        if (!cancelado) {
          setObrasLocais(obrasNormalizadas);
          setObrasFavoritas(obrasFavoritasNormalizadas);
          setObrasConcluidas(obrasConcluidasNormalizadas);
        }

        const obrasComSupabase = await carregarObrasPublicadasSupabase(
          obrasNormalizadas,
          userIdAtual
        );

        if (!cancelado) {
          setObrasLocais(obrasComSupabase);
        }
      } catch {
        if (!cancelado) {
          setObrasLocais([]);
          setObrasFavoritas([]);
          setObrasConcluidas([]);
        }
      }
    }

    carregarExplorar();

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    const autorIds = Array.from(
      new Set(
        obrasLocais
          .filter(
            (obra) =>
              obra.publicado && obraTemConteudoPublicadoExplorar(obra)
          )
          .map((obra) => obra.autorId?.trim() || "")
          .filter(Boolean)
      )
    );

    if (autorIds.length === 0) {
      setPerfisAutores({});
      setAvaliacoesAutores({});
      return;
    }

    let cancelado = false;

    async function carregarDadosAutores() {
      const [perfis, avaliacoes] = await Promise.all([
        carregarPerfisAutoresExplorar(autorIds),
        carregarAvaliacoesAutoresExplorar(autorIds),
      ]);

      if (!cancelado) {
        setPerfisAutores(perfis);
        setAvaliacoesAutores(avaliacoes);
      }
    }

    void carregarDadosAutores();

    return () => {
      cancelado = true;
    };
  }, [obrasLocais]);

  const termoBusca = normalizarTexto(busca);

  const obrasBaseFiltradas = useMemo(() => {
    const filtradas = obrasLocais.filter((obra) => {
      const passaFormato =
        filtroFormato === "todos" ? true : obra.formato === filtroFormato;

      const passaClassificacao =
        filtroClassificacao === "todos"
          ? true
          : obra.classificacaoIndicativa === filtroClassificacao;

      const passaPublicacao =
        obra.publicado && obraTemConteudoPublicadoExplorar(obra);

      const passaCapitulos =
        filtroCapitulos === "todos"
          ? true
          : filtroCapitulos === "com-capitulos"
            ? obra.capitulos.length > 0
            : obra.capitulos.length === 0;

      const passaColecao =
        !usuarioLogado || filtroColecao === "todos"
          ? true
          : filtroColecao === "favoritas"
            ? colecaoTemObraExplorar(obrasFavoritas, obra)
            : filtroColecao === "concluidas"
              ? colecaoTemObraExplorar(obrasConcluidas, obra)
              : filtroColecao === "lendo"
                ? obraTemAtividadeLeitura(obra)
                : !obraTemAtividadeLeitura(obra);

      return (
        passaFormato &&
        passaClassificacao &&
        passaPublicacao &&
        passaCapitulos &&
        passaColecao
      );
    });

    return ordenarObrasLocais(filtradas, ordenacao);
  }, [
    obrasLocais,
    filtroFormato,
    filtroClassificacao,
    filtroCapitulos,
    filtroColecao,
    usuarioLogado,
    ordenacao,
    obrasFavoritas,
    obrasConcluidas,
  ]);

  const obrasLocaisFiltradas = useMemo(() => {
    return obrasBaseFiltradas.filter((obra) => {
      const passaCategoria = categoriaSelecionada
        ? categoriaCombinaComGenero(categoriaSelecionada, obra.genero)
        : true;

      const textoBusca = normalizarTexto(
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
          obra.capitulos.map((capitulo) => capitulo.titulo).join(" "),
        ].join(" ")
      );

      const passaBusca = termoBusca ? textoBusca.includes(termoBusca) : true;

      return passaCategoria && passaBusca;
    });
  }, [obrasBaseFiltradas, categoriaSelecionada, termoBusca]);

  const autoresExplorar = useMemo(() => {
    type AutorAcumulado = {
      chave: string;
      nome: string;
      autorId: string;
      obrasIds: Set<string>;
      totalCurtidas: number;
      totalComentarios: number;
      generos: Set<string>;
    };

    const autores = new Map<string, AutorAcumulado>();

    obrasBaseFiltradas.forEach((obra) => {
      const autorId = obra.autorId?.trim() || "";
      const perfil = autorId ? perfisAutores[autorId] : undefined;
      const nome = perfil?.nome.trim() || obra.autor.trim() || "Autor não informado";
      const chave = autorId || normalizarTexto(nome);

      if (!chave) {
        return;
      }

      const atual = autores.get(chave) || {
        chave,
        nome,
        autorId,
        obrasIds: new Set<string>(),
        totalCurtidas: 0,
        totalComentarios: 0,
        generos: new Set<string>(),
      };

      atual.nome = perfil?.nome.trim() || atual.nome;
      atual.obrasIds.add(obra.id || obra.slug || criarSlugBase(obra.titulo));
      atual.totalCurtidas += totalCurtidasObra(obra);
      atual.totalComentarios += totalComentariosObra(obra);

      categorias.forEach((categoria) => {
        if (categoriaCombinaComGenero(categoria, obra.genero)) {
          atual.generos.add(categoria);
        }
      });

      autores.set(chave, atual);
    });

    return Array.from(autores.values())
      .map<AutorExplorar>((autor) => {
        const perfil = autor.autorId
          ? perfisAutores[autor.autorId]
          : undefined;
        const generos = Array.from(autor.generos);

        return {
          chave: autor.chave,
          nome: autor.nome,
          autorId: autor.autorId,
          avatar: perfil?.avatar || "",
          bio:
            perfil?.bio ||
            criarBioAutorExplorar(autor.nome, generos),
          totalObras: autor.obrasIds.size,
          totalCurtidas: autor.totalCurtidas,
          totalComentarios: autor.totalComentarios,
          generos,
          href: criarPerfilAutorHrefExplorar(autor.nome, autor.autorId),
          avaliacao: autor.autorId
            ? avaliacoesAutores[autor.autorId]
            : undefined,
        };
      })
      .sort(
        (autorA, autorB) =>
          autorB.totalObras - autorA.totalObras ||
          autorB.totalCurtidas - autorA.totalCurtidas ||
          autorA.nome.localeCompare(autorB.nome, "pt-BR")
      );
  }, [
    obrasBaseFiltradas,
    perfisAutores,
    avaliacoesAutores,
  ]);

  const autoresFiltrados = useMemo(() => {
    return autoresExplorar.filter((autor) => {
      const passaCategoria = categoriaSelecionada
        ? autor.generos.some(
            (genero) =>
              normalizarTexto(genero) === normalizarTexto(categoriaSelecionada)
          )
        : true;
      const passaBusca = termoBusca
        ? normalizarTexto(autor.nome).includes(termoBusca)
        : true;

      return passaCategoria && passaBusca;
    });
  }, [autoresExplorar, categoriaSelecionada, termoBusca]);

  const secoesCriativasObras = useMemo(() => {
    if (categoriaSelecionada || termoBusca) {
      return [] as Array<{ titulo: string; obras: ObraLocal[] }>;
    }

    const limitar = (lista: ObraLocal[]) => lista.slice(0, 12);
    const recomendacoes = limitar(
      [...obrasBaseFiltradas].sort(
        (obraA, obraB) =>
          pontuacaoRecomendacaoObraExplorar(obraB) -
            pontuacaoRecomendacaoObraExplorar(obraA) ||
          dataUltimoCapituloObraExplorar(obraB) -
            dataUltimoCapituloObraExplorar(obraA)
      )
    );
    const publicacoesRecentes = limitar(
      [...obrasBaseFiltradas]
        .filter((obra) => dataCriacaoObra(obra) > 0)
        .sort((obraA, obraB) => dataCriacaoObra(obraB) - dataCriacaoObra(obraA))
    );
    const novosCapitulos = limitar(
      [...obrasBaseFiltradas]
        .filter(
          (obra) =>
            obra.capitulos.length > 0 &&
            dataUltimoCapituloObraExplorar(obra) > 0
        )
        .sort(
          (obraA, obraB) =>
            dataUltimoCapituloObraExplorar(obraB) -
            dataUltimoCapituloObraExplorar(obraA)
        )
    );
    const maisCurtidas = limitar(
      [...obrasBaseFiltradas]
        .filter((obra) => totalCurtidasObra(obra) > 0)
        .sort(
          (obraA, obraB) =>
            totalCurtidasObra(obraB) - totalCurtidasObra(obraA)
        )
    );
    const maisComentadas = limitar(
      [...obrasBaseFiltradas]
        .filter((obra) => totalComentariosObra(obra) > 0)
        .sort(
          (obraA, obraB) =>
            totalComentariosObra(obraB) - totalComentariosObra(obraA)
        )
    );
    const paraLerAgora = limitar(
      [...obrasBaseFiltradas]
        .filter(
          (obra) =>
            obra.capitulos.length > 0 && obra.capitulos.length <= 3
        )
        .sort(
          (obraA, obraB) =>
            obraA.capitulos.length - obraB.capitulos.length ||
            pontuacaoRecomendacaoObraExplorar(obraB) -
              pontuacaoRecomendacaoObraExplorar(obraA)
        )
    );

    return [
      { titulo: "Recomendações para você", obras: recomendacoes },
      { titulo: "Publicações recentes", obras: publicacoesRecentes },
      { titulo: "Novos capítulos", obras: novosCapitulos },
      { titulo: "Mais curtidas", obras: maisCurtidas },
      { titulo: "Mais comentadas", obras: maisComentadas },
      { titulo: "Para ler agora", obras: paraLerAgora },
    ].filter((secao) => secao.obras.length > 0);
  }, [obrasBaseFiltradas, categoriaSelecionada, termoBusca]);

  const secoesCriativasAutores = useMemo(() => {
    if (categoriaSelecionada || termoBusca) {
      return [] as Array<{ titulo: string; autores: AutorExplorar[] }>;
    }

    const autoresParaConhecer = autoresExplorar.slice(0, 12);
    const autoresEmDestaque = [...autoresExplorar]
      .sort(
        (autorA, autorB) =>
          autorB.totalObras * 12 +
            autorB.totalCurtidas * 4 +
            autorB.totalComentarios * 3 -
          (autorA.totalObras * 12 +
            autorA.totalCurtidas * 4 +
            autorA.totalComentarios * 3)
      )
      .slice(0, 12);
    const maisBemAvaliados = [...autoresExplorar]
      .filter(
        (autor) =>
          Boolean(autor.avaliacao) &&
          (autor.avaliacao?.total || 0) > 0 &&
          (autor.avaliacao?.media || 0) > 0
      )
      .sort(
        (autorA, autorB) =>
          (autorB.avaliacao?.media || 0) -
            (autorA.avaliacao?.media || 0) ||
          (autorB.avaliacao?.total || 0) -
            (autorA.avaliacao?.total || 0)
      )
      .slice(0, 12);

    return [
      { titulo: "Autores para conhecer", autores: autoresParaConhecer },
      { titulo: "Autores em destaque", autores: autoresEmDestaque },
      { titulo: "Mais bem avaliados", autores: maisBemAvaliados },
    ].filter((secao) => secao.autores.length > 0);
  }, [autoresExplorar, categoriaSelecionada, termoBusca]);

  const secoesObrasPorGenero = useMemo(() => {
    if (categoriaSelecionada || termoBusca) {
      return [] as Array<{ genero: string; obras: ObraLocal[] }>;
    }

    const secoes = categorias
      .map((genero) => ({
        genero,
        obras: obrasBaseFiltradas.filter((obra) =>
          categoriaCombinaComGenero(genero, obra.genero)
        ),
      }))
      .filter((secao) => secao.obras.length > 0);
    const obrasCategorizadas = new Set(
      secoes.flatMap((secao) => secao.obras.map((obra) => obra.id))
    );
    const obrasOutros = obrasBaseFiltradas.filter(
      (obra) => !obrasCategorizadas.has(obra.id)
    );

    return obrasOutros.length > 0
      ? [...secoes, { genero: "Outros", obras: obrasOutros }]
      : secoes;
  }, [obrasBaseFiltradas, categoriaSelecionada, termoBusca]);

  const secoesAutoresPorGenero = useMemo(() => {
    if (categoriaSelecionada || termoBusca) {
      return [] as Array<{ genero: string; autores: AutorExplorar[] }>;
    }

    const secoes = categorias
      .map((genero) => ({
        genero,
        autores: autoresExplorar.filter((autor) =>
          autor.generos.some(
            (generoAutor) =>
              normalizarTexto(generoAutor) === normalizarTexto(genero)
          )
        ),
      }))
      .filter((secao) => secao.autores.length > 0);
    const autoresCategorizados = new Set(
      secoes.flatMap((secao) => secao.autores.map((autor) => autor.chave))
    );
    const autoresOutros = autoresExplorar.filter(
      (autor) => !autoresCategorizados.has(autor.chave)
    );

    return autoresOutros.length > 0
      ? [...secoes, { genero: "Outros", autores: autoresOutros }]
      : secoes;
  }, [autoresExplorar, categoriaSelecionada, termoBusca]);

  const totalResultados =
    modoConteudo === "autores"
      ? autoresFiltrados.length
      : obrasLocaisFiltradas.length;
  const possuiObrasPublicadas = obrasLocais.some((obra) => {
    return obra.publicado && obraTemConteudoPublicadoExplorar(obra);
  });

  const filtrosAtivos = Boolean(
    categoriaSelecionada ||
      termoBusca ||
      filtroFormato !== "todos" ||
      filtroClassificacao !== "todos" ||
      filtroCapitulos !== "todos" ||
      (usuarioLogado && filtroColecao !== "todos") ||
      ordenacao !== "relevancia"
  );

  const totalFiltrosAvancadosAtivos = [
    usuarioLogado && filtroColecao !== "todos",
    filtroFormato !== "todos",
    filtroClassificacao !== "todos",
    filtroCapitulos !== "todos",
    ordenacao !== "relevancia",
  ].filter(Boolean).length;

  const textoBotaoFiltrosAvancados =
    totalFiltrosAvancadosAtivos > 0
      ? `Explorar (${totalFiltrosAvancadosAtivos})`
      : "Explorar";

  const categoriaAtiva = categoriaSelecionada.trim().length > 0;
  const temaPagina = criarTemaPaginaVisualExplorar(temaVisual);

  function atualizarUrl(
    categoria: string,
    modo: ModoConteudoExplorar = modoConteudo
  ) {
    const params = new URLSearchParams();

    if (modo === "autores") {
      params.set("tipo", "autores");
    }

    if (categoria.trim()) {
      params.set("categoria", categoria.trim());
    }

    const query = params.toString();
    window.history.pushState(null, "", query ? `/explorar?${query}` : "/explorar");
  }

  function selecionarModoConteudo(modo: ModoConteudoExplorar) {
    setModoConteudo(modo);
    setCategoriaSelecionada("");
    setMensagemLogin("");
    setMostrarFiltrosAvancados(false);
    atualizarUrl("", modo);
  }

  function selecionarCategoria(categoria: string) {
    setCategoriaSelecionada(categoria);
    atualizarUrl(categoria, modoConteudo);
  }

  function selecionarFiltroColecao(filtro: FiltroColecaoExplorar) {
    if (filtro === "todos") {
      setMensagemLogin("");
      setFiltroColecao("todos");
      return;
    }

    if (!usuarioLogado) {
      setMensagemLogin("Entre na sua conta para usar filtros pessoais.");
      setFiltroColecao("todos");
      router.push(criarLoginHrefExplorar());
      return;
    }

    setMensagemLogin("");
    setFiltroColecao(filtro);
  }

  function limparFiltros() {
    setModoConteudo("obras");
    setCategoriaSelecionada("");
    setBusca("");
    setFiltroFormato("todos");
    setFiltroClassificacao("todos");
    setFiltroCapitulos("todos");
    setFiltroColecao("todos");
    setOrdenacao("relevancia");
    setMensagemLogin("");
    setMostrarFiltrosAvancados(false);
    window.history.pushState(null, "", "/explorar");
  }

  return (
    <main style={criarExplorarPageStyle(pageThemeStyle)}>
      <style>{`${themePageCss}${historietasThemeCss}`}</style>
      <style>{explorarBuscaToggleCss}</style>

      {isDesktop && (
        <div style={criarExplorarTopWaterFadeStyle(temaPagina, true)} aria-hidden="true" />
      )}

      {!isDesktop && (
        <div style={criarExplorarTopWaterFadeStyle(temaPagina, false)} aria-hidden="true" />
      )}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTitleHeaderStyle : titleHeaderStyle}>
          <button
            type="button"
            onClick={() => setMostrarFiltrosAvancados(true)}
            style={
              isDesktop
                ? desktopExplorarHeaderFilterButtonStyle
                : explorarHeaderFilterButtonStyle
            }
            aria-label="Abrir funções do Explorar"
          >
            <span>{textoBotaoFiltrosAvancados}</span>
            <span style={explorarHeaderFilterIconStyle} aria-hidden="true">
              +
            </span>
          </button>

          {buscaMobileAberta ? (
            <>
              <label
                style={
                  isDesktop
                    ? desktopExplorarHeaderSearchShellStyle
                    : explorarHeaderSearchShellStyle
                }
              >
                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder={
                    modoConteudo === "autores"
                      ? "Buscar autores..."
                      : "Buscar histórias..."
                  }
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={90}
                  style={explorarHeaderSearchInputStyle}
                  type="text"
                  autoFocus
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  setBusca("");
                  setBuscaMobileAberta(false);
                }}
                aria-label="Fechar busca"
                aria-expanded="true"
                style={mobileSearchToggleStyle}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle
                    cx="10.85"
                    cy="10.85"
                    r="6.65"
                    stroke="currentColor"
                    strokeWidth="2.15"
                  />
                  <path
                    d="M16.05 16.05L20.25 20.25"
                    stroke="currentColor"
                    strokeWidth="2.15"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setBuscaMobileAberta(true)}
              aria-label="Abrir busca"
              aria-expanded="false"
              style={mobileSearchToggleStyle}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle
                  cx="10.85"
                  cy="10.85"
                  r="6.65"
                  stroke="currentColor"
                  strokeWidth="2.15"
                />
                <path
                  d="M16.05 16.05L20.25 20.25"
                  stroke="currentColor"
                  strokeWidth="2.15"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </header>

        <section style={isDesktop ? criarDesktopSearchBoxStyle(temaPagina, categoriaAtiva) : criarSearchBoxStyle(temaPagina, categoriaAtiva)}>
          <section className="explorar-carousel" style={isDesktop ? desktopCategoriesStyle : categoriesStyle} aria-label="Categorias">
            <button
              type="button"
              onClick={() => selecionarModoConteudo("obras")}
              style={
                modoConteudo === "obras" && !categoriaSelecionada
                  ? criarActiveCategoryStyle(temaPagina)
                  : categoryStyle
              }
            >
              Tudo
            </button>

            <button
              type="button"
              onClick={() => selecionarModoConteudo("autores")}
              style={
                modoConteudo === "autores" && !categoriaSelecionada
                  ? criarActiveCategoryStyle(temaPagina)
                  : categoryStyle
              }
            >
              Autores
            </button>

            {categorias.map((categoria) => (
              <button
                key={categoria}
                type="button"
                onClick={() => selecionarCategoria(categoria)}
                style={
                  categoriaSelecionada === categoria
                    ? criarActiveCategoryStyle(temaPagina)
                    : categoryStyle
                }
              >
                {categoria}
              </button>
            ))}
          </section>

          {mensagemLogin && (
            <span style={loginNoticeStyle}>{mensagemLogin}</span>
          )}

        </section>

        {mostrarFiltrosAvancados && (
          <div
            style={explorarModalOverlayStyle}
            onClick={() => setMostrarFiltrosAvancados(false)}
          >
            <section
              style={isDesktop ? desktopExplorarModalSheetStyle : explorarModalSheetStyle}
              onClick={(event) => event.stopPropagation()}
              aria-label="EXPLORAR"
            >
              <span style={explorarModalHandleStyle} aria-hidden="true" />

              <h2 style={explorarModalTitleStyle}>EXPLORAR</h2>

              <div style={explorarModalContentStyle}>
                <p style={explorarModalSectionLabelStyle}>Mostrar</p>

                {[
                  ["todos", "Todas"],
                  ["lendo", "Lendo agora"],
                  ["favoritas", "Na lista"],
                  ["concluidas", "Concluídas"],
                  ["sem-leitura", "Sem leitura"],
                ].map(([valor, rotulo]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => selecionarFiltroColecao(valor as FiltroColecaoExplorar)}
                    style={criarExplorarModalOptionStyle(filtroColecao === valor)}
                  >
                    <span>{rotulo}</span>
                    <span style={criarExplorarModalRadioStyle(filtroColecao === valor)} />
                  </button>
                ))}

                <p style={explorarModalSectionLabelStyle}>Ordenar</p>

                {[
                  ["relevancia", "Relevância"],
                  ["mais-curtidas", "Mais curtidas"],
                  ["mais-recentes", "Mais recentes"],
                ].map(([valor, rotulo]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setOrdenacao(valor as OrdenacaoExplorar)}
                    style={criarExplorarModalOptionStyle(ordenacao === valor)}
                  >
                    <span>{rotulo}</span>
                    <span style={criarExplorarModalRadioStyle(ordenacao === valor)} />
                  </button>
                ))}

                {filtrosAtivos && (
                  <>
                    <span style={explorarModalClearDividerStyle} aria-hidden="true" />

                    <button
                      type="button"
                      onClick={limparFiltros}
                      style={explorarModalClearButtonStyle}
                    >
                      Limpar filtros
                    </button>
                  </>
                )}
              </div>
            </section>
          </div>
        )}

        {modoConteudo === "obras" &&
          !categoriaSelecionada &&
          !termoBusca &&
          secoesCriativasObras.map((secao) => (
            <section
              key={`obras-criativas-${normalizarTexto(secao.titulo)}`}
              style={isDesktop ? desktopSectionStyle : sectionStyle}
            >
              <SectionHeader
                title={secao.titulo}
                tema={temaPagina}
                isDesktop={isDesktop}
              />

              <ExplorarCarouselRow isDesktop={isDesktop} variant="obra">
                {secao.obras.map((obra) => (
                  <div
                    key={`${secao.titulo}-${obra.id}`}
                    style={
                      isDesktop
                        ? desktopExplorarObraCarouselItemStyle
                        : explorarObraCarouselItemStyle
                    }
                  >
                    <ObraPublicadaCard
                      obra={obra}
                      favorita={
                        usuarioLogado &&
                        colecaoTemObraExplorar(obrasFavoritas, obra)
                      }
                      concluida={
                        usuarioLogado &&
                        colecaoTemObraExplorar(obrasConcluidas, obra)
                      }
                      tema={temaPagina}
                      isDesktop={isDesktop}
                    />
                  </div>
                ))}
              </ExplorarCarouselRow>
            </section>
          ))}

        {modoConteudo === "obras" &&
          !categoriaSelecionada &&
          !termoBusca &&
          secoesObrasPorGenero.map((secao) => (
            <section
              key={`obras-${normalizarTexto(secao.genero)}`}
              style={isDesktop ? desktopSectionStyle : sectionStyle}
            >
              <SectionHeader
                title={obterTituloCriativoObrasExplorar(secao.genero)}
                tema={obterTemaCategoria(secao.genero, temaVisual)}
                isDesktop={isDesktop}
              />

              <ExplorarCarouselRow isDesktop={isDesktop} variant="obra">
                {secao.obras.map((obra) => (
                  <div
                    key={`${secao.genero}-${obra.id}`}
                    style={
                      isDesktop
                        ? desktopExplorarObraCarouselItemStyle
                        : explorarObraCarouselItemStyle
                    }
                  >
                    <ObraPublicadaCard
                      obra={obra}
                      favorita={
                        usuarioLogado &&
                        colecaoTemObraExplorar(obrasFavoritas, obra)
                      }
                      concluida={
                        usuarioLogado &&
                        colecaoTemObraExplorar(obrasConcluidas, obra)
                      }
                      tema={obterTemaCategoria(secao.genero, temaVisual)}
                      isDesktop={isDesktop}
                    />
                  </div>
                ))}
              </ExplorarCarouselRow>
            </section>
          ))}

        {modoConteudo === "obras" &&
          (Boolean(categoriaSelecionada) || Boolean(termoBusca)) &&
          obrasLocaisFiltradas.length > 0 && (
            <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
              <SectionHeader
                title={
                  categoriaSelecionada
                    ? `Publicações em ${categoriaSelecionada}`
                    : "Resultados da busca"
                }
                tema={temaPagina}
                isDesktop={isDesktop}
              />

              <div style={isDesktop ? desktopPublishedGridStyle : gridStyle}>
                {obrasLocaisFiltradas.map((obra) => (
                  <ObraPublicadaCard
                    key={obra.id}
                    obra={obra}
                    favorita={
                      usuarioLogado &&
                      colecaoTemObraExplorar(obrasFavoritas, obra)
                    }
                    concluida={
                      usuarioLogado &&
                      colecaoTemObraExplorar(obrasConcluidas, obra)
                    }
                    tema={temaPagina}
                    isDesktop={isDesktop}
                  />
                ))}
              </div>
            </section>
          )}

        {modoConteudo === "autores" &&
          !categoriaSelecionada &&
          !termoBusca &&
          secoesCriativasAutores.map((secao) => (
            <section
              key={`autores-criativos-${normalizarTexto(secao.titulo)}`}
              style={isDesktop ? desktopSectionStyle : sectionStyle}
            >
              <SectionHeader
                title={secao.titulo}
                tema={temaPagina}
                isDesktop={isDesktop}
              />

              <ExplorarCarouselRow isDesktop={isDesktop} variant="autor">
                {secao.autores.map((autor) => (
                  <AutorExplorarCard
                    key={`${secao.titulo}-${autor.chave}`}
                    autor={autor}
                    isDesktop={isDesktop}
                  />
                ))}
              </ExplorarCarouselRow>
            </section>
          ))}

        {modoConteudo === "autores" &&
          !categoriaSelecionada &&
          !termoBusca &&
          secoesAutoresPorGenero.map((secao) => (
            <section
              key={`autores-${normalizarTexto(secao.genero)}`}
              style={isDesktop ? desktopSectionStyle : sectionStyle}
            >
              <SectionHeader
                title={obterTituloCriativoAutoresExplorar(secao.genero)}
                tema={obterTemaCategoria(secao.genero, temaVisual)}
                isDesktop={isDesktop}
              />

              <ExplorarCarouselRow isDesktop={isDesktop} variant="autor">
                {secao.autores.map((autor) => (
                  <AutorExplorarCard
                    key={`${secao.genero}-${autor.chave}`}
                    autor={autor}
                    isDesktop={isDesktop}
                  />
                ))}
              </ExplorarCarouselRow>
            </section>
          ))}

        {modoConteudo === "autores" &&
          (Boolean(categoriaSelecionada) || Boolean(termoBusca)) &&
          autoresFiltrados.length > 0 && (
            <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
              <SectionHeader
                title={
                  categoriaSelecionada
                    ? `Autores de ${categoriaSelecionada}`
                    : "Autores encontrados"
                }
                tema={temaPagina}
                isDesktop={isDesktop}
              />

              <div
                style={
                  isDesktop
                    ? desktopAutoresExplorarGridStyle
                    : autoresExplorarGridStyle
                }
              >
                {autoresFiltrados.map((autor) => (
                  <AutorExplorarCard
                    key={autor.chave}
                    autor={autor}
                    isDesktop={isDesktop}
                    emGrade
                  />
                ))}
              </div>
            </section>
          )}

        {totalResultados === 0 && (
          <EstadoVazioExplorar
            possuiObrasPublicadas={possuiObrasPublicadas}
            modoConteudo={modoConteudo}
          />
        )}
      </section>
    </main>
  );
}

function EstadoVazioExplorar({
  possuiObrasPublicadas,
  modoConteudo,
}: {
  possuiObrasPublicadas: boolean;
  modoConteudo: ModoConteudoExplorar;
}) {
  const titulo =
    modoConteudo === "autores"
      ? "Nenhum autor encontrado"
      : possuiObrasPublicadas
        ? "Nenhuma obra encontrada"
        : "PUBLIQUE SUA HISTÓRIA";

  return (
    <p
      style={{
        margin: "10px 0 0",
        color: "#FFFFFF",
        fontSize: "12px",
        fontWeight: 800,
        textAlign: "center",
      }}
    >
      {titulo}
    </p>
  );
}

function SectionHeader({
  title,
  tema,
  isDesktop,
}: {
  title: string;
  tema: ReturnType<typeof obterTemaCategoria>;
  isDesktop?: boolean;
}) {
  const titleStyleTema: CSSProperties = {
    ...(isDesktop ? desktopSectionTitleStyle : sectionTitleStyle),
    background: "none",
    color: "#FFFFFF",
    textAlign: "center",
  };

  return (
    <div style={isDesktop ? desktopSectionHeaderStyle : sectionHeaderStyle}>
      <h2 style={titleStyleTema}>{title}</h2>
    </div>
  );
}

function AutorExplorarCard({
  autor,
  isDesktop,
  emGrade = false,
}: {
  autor: AutorExplorar;
  isDesktop?: boolean;
  emGrade?: boolean;
}) {
  const generos = autor.generos.length > 0 ? autor.generos : ["Historietas"];

  return (
    <Link
      href={autor.href}
      style={
        emGrade
          ? isDesktop
            ? desktopAutorExplorarGridCardStyle
            : autorExplorarGridCardStyle
          : isDesktop
            ? desktopAutorExplorarCardStyle
            : autorExplorarCardStyle
      }
      aria-label={`Abrir perfil do autor ${autor.nome}`}
    >
      <span style={autorExplorarCardGlowStyle} aria-hidden="true" />

      <div style={autorExplorarTopStyle}>
        <div style={autorExplorarAvatarShellStyle}>
          {autor.avatar ? (
            <img
              src={autor.avatar}
              alt={`Avatar de ${autor.nome}`}
              style={autorExplorarAvatarImageStyle}
            />
          ) : (
            <span style={autorExplorarAvatarInitialsStyle}>
              {criarIniciaisAutorExplorar(autor.nome)}
            </span>
          )}
        </div>

        <div style={autorExplorarIdentityStyle}>
          <h3 style={autorExplorarNameStyle}>{autor.nome}</h3>
          <p style={autorExplorarBioStyle}>{autor.bio}</p>
        </div>
      </div>

      <div style={autorExplorarMetaRowStyle}>
        <span
          style={autorExplorarMetaBadgeStyle}
          aria-label={`${autor.totalObras} ${
            autor.totalObras === 1 ? "obra publicada" : "obras publicadas"
          }`}
        >
          📚 {autor.totalObras}
        </span>

        <span
          style={autorExplorarMetaBadgeStyle}
          aria-label={
            autor.avaliacao && autor.avaliacao.total > 0
              ? `Avaliação média ${formatarMediaAvaliacaoAutorExplorar(
                  autor.avaliacao
                )} de 5, com ${autor.avaliacao.total} ${
                  autor.avaliacao.total === 1 ? "avaliação" : "avaliações"
                }`
              : "Autor ainda sem avaliações"
          }
        >
          <span style={autorExplorarRatingStarStyle} aria-hidden="true">
            ★
          </span>
          {formatarMediaAvaliacaoAutorExplorar(autor.avaliacao)}
        </span>

        {autor.totalCurtidas > 0 && (
          <span style={autorExplorarMetaBadgeStyle}>
            ❤️ {autor.totalCurtidas}
          </span>
        )}

        {autor.totalComentarios > 0 && (
          <span style={autorExplorarMetaBadgeStyle}>
            💬 {autor.totalComentarios}
          </span>
        )}
      </div>

      <div style={autorExplorarBottomStyle}>
        <div style={autorExplorarGenresStyle}>
          {generos.slice(0, 2).map((genero) => (
            <span
              key={`${autor.chave}-${genero}`}
              style={autorExplorarGenreBadgeStyle}
            >
              {genero}
            </span>
          ))}
        </div>

        <span style={autorExplorarProfileButtonStyle}>Ver perfil</span>
      </div>
    </Link>
  );
}

function ExplorarCarouselRow({
  children,
  isDesktop,
  variant,
}: {
  children: ReactNode;
  isDesktop: boolean;
  variant: "obra" | "autor";
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const totalItems = Children.count(children);
  const precisaSetas = isDesktop && totalItems > 3;
  const listStyle = isDesktop
    ? variant === "autor"
      ? desktopAutoresExplorarCarouselStyle
      : desktopObrasExplorarCarouselStyle
    : variant === "autor"
      ? autoresExplorarCarouselStyle
      : obrasExplorarCarouselStyle;

  useEffect(() => {
    const row = rowRef.current;

    if (!row) {
      return;
    }

    row.scrollLeft = 0;
  }, [isDesktop, totalItems, variant]);

  function rolar(direcao: -1 | 1) {
    rowRef.current?.scrollBy({
      left: direcao * 460,
      behavior: "smooth",
    });
  }

  if (!precisaSetas) {
    return (
      <div ref={rowRef} style={listStyle}>
        {children}
      </div>
    );
  }

  return (
    <div style={explorarCarouselShellStyle}>
      <button
        type="button"
        onClick={() => rolar(-1)}
        style={explorarCarouselArrowLeftStyle}
        aria-label="Rolar carrossel para a esquerda"
      >
        ‹
      </button>

      <div ref={rowRef} style={listStyle}>
        {children}
      </div>

      <button
        type="button"
        onClick={() => rolar(1)}
        style={explorarCarouselArrowRightStyle}
        aria-label="Rolar carrossel para a direita"
      >
        ›
      </button>
    </div>
  );
}

function ObraPublicadaCard({
  obra,
  favorita,
  concluida,
  tema,
  isDesktop,
}: {
  obra: ObraLocal;
  favorita: boolean;
  concluida: boolean;
  tema: ReturnType<typeof obterTemaCategoria>;
  isDesktop?: boolean;
}) {
  const totalCurtidas = totalCurtidasObra(obra);
  const totalComentarios = totalComentariosObra(obra);
  const totalVisualizacoes = normalizarContadorExplorar(obra.visualizacoes);
  const progressoLeitura = calcularProgressoLeitura(obra.capitulos);
  const paginaPublicaHref = `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
  const perfilAutorHref = criarPerfilAutorHrefExplorar(
    obra.autor,
    obra.autorId
  );

  return (
    <article style={isDesktop ? criarDesktopPublishedCardTemaStyle(tema) : criarPublishedCardTemaStyle(tema)}>
      <Link href={paginaPublicaHref} style={isDesktop ? criarDesktopPublishedCoverStyle(obra.capa, tema) : criarPublishedCoverStyle(obra.capa, tema)}>
        {!obra.capa && null}
      </Link>

      <div style={isDesktop ? desktopPublishedInfoStyle : publishedInfoStyle}>
        <div style={cardTopStyle}>
          <h3 style={isDesktop ? desktopPublishedTitleStyle : publishedTitleStyle}>{obra.titulo}</h3>

          <Link href={perfilAutorHref} style={authorLinkStyle}>
            Por {obra.autor}
          </Link>
        </div>

        <div style={statusRowStyle}>
          {!obra.publicado && <span style={draftStatusStyle}>Rascunho</span>}

          <span style={formatBadgeStyle}>{obra.formato}</span>

          <span style={classificationBadgeStyle}>
            {obra.classificacaoIndicativa}
          </span>
        </div>

        {isDesktop && (
          <p style={desktopPublishedSynopsisStyle}>{obra.sinopse}</p>
        )}

        <div style={statsStyle}>
          <span style={metricItemStyle}>
            <span style={metricIconStyle}>👁</span>
            {totalVisualizacoes}
          </span>

          <span style={metricItemStyle}>
            <span style={heartMetricIconStyle}>❤️</span>
            {totalCurtidas}
          </span>

          <span style={metricItemStyle}>
            <span style={metricIconStyle}>💬</span>
            {totalComentarios}
          </span>

          <span style={metricItemStyle}>
            <span style={metricIconStyle}>
              {obra.capitulos.length > 0 ? "📚" : obra.arquivoObra ? "📄" : "📚"}
            </span>
            {obra.capitulos.length > 0
              ? `${obra.capitulos.length}`
              : obra.arquivoObra
                ? "1"
                : "0"}
          </span>
        </div>

        {progressoLeitura > 0 && (
          <div style={progressCompactStyle}>
            <div style={criarProgressTrackStyle(tema)}>
              <div
                style={{
                  ...criarProgressBarStyle(tema),
                  width: `${progressoLeitura}%`,
                }}
              />
            </div>

            <span style={progressTextStyle}>{progressoLeitura}%</span>
          </div>
        )}

        <div style={isDesktop ? desktopCardActionRowStyle : cardActionRowStyle}>
          <span style={isDesktop ? desktopCardGenreBadgeStyle : cardGenreBadgeStyle}>
            {obra.genero}
          </span>

          <Link href={paginaPublicaHref} style={criarCardPrimaryActionStyle(tema, isDesktop)}>
            Ver obra
          </Link>
        </div>
      </div>
    </article>
  );
}

function criarActiveCategoryStyle(_tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...activeCategoryStyle,
    background: "#08030F",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#FFFFFF",
    boxShadow: "none",
  };
}

function criarSearchBoxStyle(
  _tema: ReturnType<typeof obterTemaCategoria>,
  _categoriaAtiva = false
): CSSProperties {
  return {
    ...searchBoxStyle,
    background: "rgba(4, 0, 10, 0.72)",
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "none",
  };
}

function criarDesktopSearchBoxStyle(
  tema: ReturnType<typeof obterTemaCategoria>,
  categoriaAtiva = false
): CSSProperties {
  return {
    ...criarSearchBoxStyle(tema, categoriaAtiva),
    gridTemplateColumns: "1fr",
    alignItems: "stretch",
    gap: "5px",
    marginTop: "12px",
    padding: "10px 12px",
    borderRadius: "22px",
    overflow: "hidden",
    boxShadow: "none",
  };
}

function criarSearchInputStyle(
  _tema: ReturnType<typeof obterTemaCategoria>,
  isDesktop: boolean,
  _categoriaAtiva: boolean
): CSSProperties {
  return isDesktop ? desktopSearchInputStyle : searchInputStyle;
}






function criarPublishedCardTemaStyle(_tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...publishedCardStyle,
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "none",
  };
}

function criarDesktopPublishedCardTemaStyle(_tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...desktopPublishedCardStyle,
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "none",
  };
}



function criarPublishedCoverTemaStyle(_tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...publishedCoverStyle,
    backgroundImage: "linear-gradient(135deg, #08030F 0%, #04000A 100%)",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarDesktopPublishedCoverStyle(
  capa: string,
  tema: ReturnType<typeof obterTemaCategoria>
): CSSProperties {
  const baseStyle = criarDesktopPublishedCoverTemaStyle(tema);

  if (!capa) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "none",
    opacity: 1,
  };
}

function criarDesktopPublishedCoverTemaStyle(_tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...desktopPublishedCoverStyle,
    backgroundImage: "linear-gradient(135deg, #08030F 0%, #04000A 100%)",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarProgressTrackStyle(_tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return progressTrackStyle;
}

function criarProgressBarStyle(_tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return progressBarStyle;
}

function criarReadStyle(_tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...readStyle,
    color: "#FFFFFF",
    background: "#08030F",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "none",
  };
}

function criarCardPrimaryActionStyle(
  tema: ReturnType<typeof obterTemaCategoria>,
  isDesktop?: boolean
): CSSProperties {
  return {
    ...criarReadStyle(tema),
    ...(isDesktop ? desktopCardPrimaryActionStyle : cardPrimaryActionStyle),
  };
}

const themePageCss = `
  html[data-historietas-tema-visual] body,
  html[data-historietas-tema-visual] main,
  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #070212 !important;
    color: var(--historietas-text-primary, #FFFFFF) !important;
  }

  html[data-historietas-tema-visual] main > div[aria-hidden="true"],
  html[data-historietas-tema-visual="original"] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  .explorar-carousel {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .explorar-carousel::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }

  html[data-historietas-tema-visual] nav,
  html[data-historietas-tema-visual] [data-bottom-nav],
  html[data-historietas-tema-visual] [data-mobile-nav],
  html[data-historietas-tema-visual] nav:has(a[href="/publicar"]),
  html[data-historietas-tema-visual] div:has(> a[href="/publicar"]):has(> a[href="/perfil-autor?aba=biblioteca"]) {
    background: var(--historietas-bottom-nav-bg, #04000A) !important;
    border-color: var(--historietas-bottom-nav-border, rgba(59, 7, 100, 0.52)) !important;
    box-shadow: var(--historietas-bottom-nav-shadow, none) !important;
    color: var(--historietas-bottom-nav-text, #9980D8) !important;
  }

  html[data-historietas-tema-visual] nav::before,
  html[data-historietas-tema-visual] [data-bottom-nav]::before,
  html[data-historietas-tema-visual] [data-mobile-nav]::before {
    background: var(--historietas-bottom-nav-shine, none) !important;
  }

  html[data-historietas-tema-visual] nav a,
  html[data-historietas-tema-visual] [data-bottom-nav] a,
  html[data-historietas-tema-visual] [data-mobile-nav] a,
  html[data-historietas-tema-visual] nav button,
  html[data-historietas-tema-visual] [data-bottom-nav] button,
  html[data-historietas-tema-visual] [data-mobile-nav] button {
    color: var(--historietas-bottom-nav-text, #9980D8) !important;
    box-shadow: none !important;
  }

  @media (hover: hover) and (pointer: fine) {
    html[data-historietas-tema-visual] nav a:hover,
    html[data-historietas-tema-visual] [data-bottom-nav] a:hover,
    html[data-historietas-tema-visual] [data-mobile-nav] a:hover,
    html[data-historietas-tema-visual] nav button:hover,
    html[data-historietas-tema-visual] [data-bottom-nav] button:hover,
    html[data-historietas-tema-visual] [data-mobile-nav] button:hover {
      background: var(--historietas-bottom-nav-hover-bg, rgba(59, 7, 100, 0.20)) !important;
      border-color: var(--historietas-bottom-nav-border, rgba(59, 7, 100, 0.52)) !important;
      color: var(--historietas-bottom-nav-hover-text, #FFFFFF) !important;
    }
  }

  html[data-historietas-tema-visual] nav a[href="/explorar"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/explorar"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/explorar"] {
    background: var(--historietas-bottom-nav-active-bg, rgba(59, 7, 100, 0.54)) !important;
    border-color: var(--historietas-bottom-nav-active-border, rgba(109, 40, 217, 0.48)) !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] nav a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) {
    background: transparent !important;
    border-color: transparent !important;
    box-shadow: none !important;
    color: var(--historietas-bottom-nav-text, #9980D8) !important;
  }

  html[data-historietas-tema-visual] nav .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-icon {
    color: var(--historietas-bottom-nav-icon-text, #AD95EA) !important;
    background: var(--historietas-bottom-nav-icon-bg, rgba(59, 7, 100, 0.28)) !important;
    border-color: var(--historietas-bottom-nav-icon-border, rgba(76, 29, 149, 0.34)) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/explorar"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/explorar"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/explorar"] .historietas-bottom-nav-icon {
    color: #FFFFFF !important;
    background: var(--historietas-bottom-nav-active-icon-bg, #3B0764) !important;
    border-color: var(--historietas-bottom-nav-active-icon-border, rgba(167, 139, 250, 0.46)) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) .historietas-bottom-nav-icon {
    color: var(--historietas-bottom-nav-icon-text, #AD95EA) !important;
    background: var(--historietas-bottom-nav-icon-bg, rgba(59, 7, 100, 0.28)) !important;
    border-color: var(--historietas-bottom-nav-icon-border, rgba(76, 29, 149, 0.34)) !important;
  }

  html[data-historietas-tema-visual] input::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  html[data-historietas-tema-visual] input,
  html[data-historietas-tema-visual] textarea,
  html[data-historietas-tema-visual] select {
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] button {
    color: inherit;
  }
`;

const explorarBuscaToggleCss = `
  button[aria-label="Abrir busca"],
  button[aria-label="Fechar busca"],
  button[aria-label="Abrir busca"]:hover,
  button[aria-label="Fechar busca"]:hover,
  button[aria-label="Abrir busca"]:active,
  button[aria-label="Fechar busca"]:active,
  button[aria-label="Abrir busca"]:focus,
  button[aria-label="Fechar busca"]:focus,
  button[aria-label="Abrir busca"]:focus-visible,
  button[aria-label="Fechar busca"]:focus-visible {
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
    outline: none !important;
    filter: none !important;
    backdrop-filter: none !important;
    -webkit-tap-highlight-color: transparent !important;
  }

  input[placeholder="Buscar histórias..."],
  input[placeholder="Buscar histórias..."]:hover,
  input[placeholder="Buscar histórias..."]:focus,
  input[placeholder="Buscar histórias..."]:focus-visible,
  input[placeholder="Buscar autores..."],
  input[placeholder="Buscar autores..."]:hover,
  input[placeholder="Buscar autores..."]:focus,
  input[placeholder="Buscar autores..."]:focus-visible {
    box-shadow: none !important;
    outline: none !important;
    filter: none !important;
    backdrop-filter: none !important;
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
  height: "min(340px, 48vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  opacity: 0,
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
  opacity: 0,
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background: "#070212",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

function criarExplorarPageStyle(
  pageThemeStyle: CSSProperties
): CSSProperties {
  return {
    ...pageThemeStyle,
    color: "var(--historietas-text-primary, #FFFFFF)",
  };
}

function criarExplorarTopWaterFadeStyle(
  _tema: ReturnType<typeof obterTemaCategoria>,
  desktop: boolean
): CSSProperties {
  return {
    ...(desktop ? desktopTopWaterFadeStyle : mobileTopWaterFadeStyle),
    background: "transparent",
    opacity: 0,
  };
}

const containerStyle: CSSProperties = {
  position: "relative",
  width: "min(900px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "8px 0 calc(24px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "18px",
  padding: "2px 0",
  minWidth: 0,
};

const mobileTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "12px",
  padding: "0",
};

const topActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  flex: "0 0 auto",
};

const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "23px",
  fontWeight: 950,
  letterSpacing: "-0.06em",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "calc(100% - 118px)",
  overflow: "hidden",
  ...safeTextStyle,
};

const logoMarkStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#04000A",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  border: "1px solid rgba(59, 7, 100, 0.58)",
  boxShadow: "none",
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #DDD6FE 44%, #A78BFA 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "none",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const backButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "40px",
  padding: "0 15px",
  borderRadius: "999px",
  background: "#04000A",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  textAlign: "center",
  boxShadow: "none",
  ...safeTextStyle,
};

const libraryButtonTopStyle: CSSProperties = {
  ...backButtonStyle,
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#DDD6FE",
};

const soonTopButtonStyle: CSSProperties = {
  ...backButtonStyle,
  minHeight: "38px",
  padding: "0 13px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#DDD6FE",
  boxShadow: "none",
};

const desktopSoonTopButtonStyle: CSSProperties = {
  ...soonTopButtonStyle,
  minHeight: "40px",
};

const titleHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "nowrap",
  marginBottom: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
};

const mobileSearchToggleStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "34px",
  height: "34px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "24px",
  lineHeight: 1,
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  padding: 0,
  boxShadow: "none",
  flex: "0 0 auto",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
};

const explorarHeaderFilterButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "8px",
  minWidth: 0,
  maxWidth: "46%",
  flex: "0 1 auto",
  fontSize: "16px",
  lineHeight: 1.15,
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "left",
  letterSpacing: "-0.04em",
  boxShadow: "none",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  ...safeTextStyle,
};

const desktopExplorarHeaderFilterButtonStyle: CSSProperties = {
  ...explorarHeaderFilterButtonStyle,
};

const explorarHeaderFilterIconStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1,
  fontWeight: 700,
  flex: "0 0 auto",
};

const desktopNotificationButtonStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  right: 0,
  transform: "translateY(-50%)",
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
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

const soonTitleButtonStyle: CSSProperties = {
  ...soonTopButtonStyle,
  justifySelf: "center",
  minHeight: "36px",
  padding: "0 16px",
  fontSize: "12px",
};

const desktopSoonTitleButtonStyle: CSSProperties = {
  ...desktopSoonTopButtonStyle,
  justifySelf: "center",
  minHeight: "40px",
  padding: "0 22px",
  fontSize: "13px",
};

const heroStyle: CSSProperties = {
  position: "relative",
  borderRadius: "30px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "linear-gradient(135deg, #070212 0%, #04000A 58%, #020006 100%)",
  padding: "18px",
  boxShadow: "none",
  minWidth: 0,
  overflow: "hidden",
};

const mobileHeroStyle: CSSProperties = {
  ...heroStyle,
  borderRadius: "28px",
};

const badgeStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "fit-content",
  maxWidth: "100%",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#DDD6FE",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.10em",
  boxShadow: "none",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const desktopBadgeStyle: CSSProperties = {
  ...badgeStyle,
  padding: "9px 13px",
  fontSize: "11px",
};

const heroDecorationLayerStyle: CSSProperties = {
  display: "none",
};

const titleStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: "12px 0 0",
  color: "var(--historietas-accent, #F97316)",
  fontSize: "32px",
  lineHeight: 0.98,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  textAlign: "center",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: "10px auto 0",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "14px",
  lineHeight: 1.55,
  fontWeight: 720,
  textAlign: "center",
  maxWidth: "680px",
  ...safeTextStyle,
};

const categoriesStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  overflowX: "auto",
  overflowY: "hidden",
  marginLeft: "-12px",
  marginRight: "-12px",
  padding: "2px 12px 5px",
  maxWidth: "calc(100% + 24px)",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  boxSizing: "border-box",
  scrollSnapType: "x proximity",
};

const categoryStyle: CSSProperties = {
  flex: "0 0 auto",
  maxWidth: "220px",
  padding: "9px 13px",
  borderRadius: "999px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxShadow: "none",
  ...safeTextStyle,
};

const activeCategoryStyle: CSSProperties = {
  ...categoryStyle,
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  boxShadow: "none",
};

const loginNoticeStyle: CSSProperties = {
  display: "block",
  margin: "-2px auto 0",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11.5px",
  fontWeight: 850,
  lineHeight: 1.35,
  textAlign: "center",
  ...safeTextStyle,
};

const searchBoxStyle: CSSProperties = {
  marginTop: "10px",
  display: "grid",
  gap: "5px",
  padding: "10px",
  borderRadius: "20px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  minWidth: 0,
  overflow: "hidden",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const explorarHeaderSearchShellStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  maxWidth: "calc(100% - 104px)",
  height: "36px",
  marginLeft: "auto",
  marginRight: "-6px",
  borderRadius: "999px",
  border: "none",
  background: "#000000",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  overflow: "hidden",
  padding: "0 0 0 13px",
  boxSizing: "border-box",
  boxShadow: "none",
  transformOrigin: "right center",
};

const desktopExplorarHeaderSearchShellStyle: CSSProperties = {
  ...explorarHeaderSearchShellStyle,
  flex: "0 1 480px",
  maxWidth: "min(480px, calc(100% - 118px))",
};

const explorarHeaderSearchInputStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  flex: "1 1 auto",
  width: "100%",
  minWidth: 0,
  height: "34px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "14px",
  fontWeight: 800,
  letterSpacing: "-0.025em",
  boxSizing: "border-box",
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  height: "44px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#04000A",
  color: "#FFFFFF",
  padding: "0 16px",
  outline: "none",
  fontSize: "14px",
  fontWeight: 720,
  textAlign: "center",
  boxSizing: "border-box",
  boxShadow: "none",
  minWidth: 0,
};

const desktopSearchInputStyle: CSSProperties = {
  ...searchInputStyle,
  textAlign: "left",
};





const explorarModalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  height: "100dvh",
  zIndex: 240,
  background: "rgba(0,0,0,0.68)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  padding: 0,
  boxSizing: "border-box",
  overflow: "hidden",
  overscrollBehavior: "none",
  touchAction: "none",
};

const explorarModalSheetStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 0,
  transform: "translateX(-50%)",
  zIndex: 241,
  width: "min(820px, 100%)",
  maxHeight: "calc(100dvh - 116px)",
  display: "grid",
  gap: "0",
  padding: "8px 0 calc(18px + env(safe-area-inset-bottom))",
  borderRadius: "24px 24px 0 0",
  background: "var(--historietas-bg-start, #070212)",
  border: "none",
  borderBottom: "0",
  overflowY: "auto",
  overflowX: "hidden",
  overscrollBehavior: "none",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.38)",
  boxSizing: "border-box",
  touchAction: "none",
};

const desktopExplorarModalSheetStyle: CSSProperties = {
  ...explorarModalSheetStyle,
  left: "50%",
  right: "auto",
  bottom: "24px",
  width: "min(560px, calc(100vw - 24px))",
  maxWidth: "560px",
  maxHeight: "82vh",
  transform: "translateX(-50%)",
  borderRadius: "24px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  margin: 0,
  paddingBottom: "18px",
};

const explorarModalHandleStyle: CSSProperties = {
  display: "block",
  justifySelf: "center",
  width: "72px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.62)",
  margin: "0 auto 14px",
};

const explorarModalTitleStyle: CSSProperties = {
  display: "block",
  margin: "0 0 12px",
  padding: 0,
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1.1,
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.04em",
  ...safeTextStyle,
};

const explorarModalContentStyle: CSSProperties = {
  display: "grid",
  gap: 0,
};

const explorarModalSectionLabelStyle: CSSProperties = {
  margin: 0,
  display: "block",
  padding: "11px 30px 5px",
  borderTop: "none",
  color: "rgba(244,244,245,0.56)",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

function criarExplorarModalOptionStyle(ativo: boolean): CSSProperties {
  return {
    appearance: "none",
    WebkitAppearance: "none",
    width: "100%",
    minHeight: "44px",
    border: "none",
    background: "transparent",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "0 30px",
    boxSizing: "border-box",
    fontSize: "18px",
    lineHeight: 1,
    fontWeight: ativo ? 900 : 650,
    letterSpacing: "-0.035em",
    fontFamily: "inherit",
    cursor: "pointer",
    textAlign: "left",
    ...safeTextStyle,
  };
}

function criarExplorarModalRadioStyle(ativo: boolean): CSSProperties {
  return {
    width: "23px",
    height: "23px",
    borderRadius: "999px",
    border: ativo
      ? "6.5px solid #FFFFFF"
      : "2.5px solid rgba(161,161,170,0.72)",
    background: "transparent",
    boxSizing: "border-box",
    flex: "0 0 auto",
  };
}

const explorarModalClearDividerStyle: CSSProperties = {
  display: "none",
};

const explorarModalClearButtonStyle: CSSProperties = {
  width: "calc(100% - 60px)",
  justifySelf: "center",
  minHeight: "46px",
  marginTop: "12px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "transparent",
  color: "#FFFFFF",
  fontSize: "15px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  ...safeTextStyle,
};


const sectionStyle: CSSProperties = {
  marginTop: "24px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
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

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "clamp(18px, 4.8vw, 23px)",
  lineHeight: 1.08,
  fontWeight: 900,
  letterSpacing: "-0.035em",
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

const obrasExplorarCarouselStyle: CSSProperties = {
  display: "flex",
  gap: "14px",
  width: "calc(100% + 24px)",
  maxWidth: "calc(100% + 24px)",
  minWidth: 0,
  boxSizing: "border-box",
  overflowX: "auto",
  overflowY: "hidden",
  padding: "2px 12px 8px",
  margin: "0 -12px",
  scrollSnapType: "x mandatory",
  scrollPaddingLeft: "12px",
  scrollPaddingRight: "12px",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
};

const desktopObrasExplorarCarouselStyle: CSSProperties = {
  ...obrasExplorarCarouselStyle,
  gap: "18px",
  width: "100%",
  maxWidth: "100%",
  padding: "6px 0 20px",
  margin: 0,
  scrollPaddingLeft: "0px",
  scrollPaddingRight: "0px",
};

const explorarObraCarouselItemStyle: CSSProperties = {
  flex: "0 0 min(350px, 90vw)",
  width: "min(350px, 90vw)",
  scrollSnapAlign: "start",
  minWidth: 0,
};

const desktopExplorarObraCarouselItemStyle: CSSProperties = {
  ...explorarObraCarouselItemStyle,
  flex: "0 0 410px",
  width: "410px",
  maxWidth: "410px",
};

const autoresExplorarCarouselStyle: CSSProperties = {
  ...obrasExplorarCarouselStyle,
  gap: "12px",
  padding: "2px 12px 8px",
};

const desktopAutoresExplorarCarouselStyle: CSSProperties = {
  ...autoresExplorarCarouselStyle,
  gap: "16px",
  width: "100%",
  maxWidth: "100%",
  padding: "6px 0 18px",
  margin: 0,
  scrollPaddingLeft: "0px",
  scrollPaddingRight: "0px",
};

const explorarCarouselShellStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  minWidth: 0,
};

const explorarCarouselArrowBaseStyle: CSSProperties = {
  position: "absolute",
  zIndex: 5,
  top: "50%",
  width: "42px",
  height: "42px",
  marginTop: "-21px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(4,0,10,0.92)",
  color: "#FFFFFF",
  fontSize: "28px",
  lineHeight: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
};

const explorarCarouselArrowLeftStyle: CSSProperties = {
  ...explorarCarouselArrowBaseStyle,
  left: "-12px",
};

const explorarCarouselArrowRightStyle: CSSProperties = {
  ...explorarCarouselArrowBaseStyle,
  right: "-12px",
};

const autoresExplorarGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "14px",
  minWidth: 0,
};

const desktopAutoresExplorarGridStyle: CSSProperties = {
  ...autoresExplorarGridStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "16px",
};

const autorExplorarCardStyle: CSSProperties = {
  position: "relative",
  flex: "0 0 min(318px, 84vw)",
  width: "min(318px, 84vw)",
  scrollSnapAlign: "start",
  padding: "12px",
  borderRadius: "24px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "grid",
  gap: "10px",
  boxShadow: "none",
  boxSizing: "border-box",
  overflow: "hidden",
};

const desktopAutorExplorarCardStyle: CSSProperties = {
  ...autorExplorarCardStyle,
  flex: "0 0 356px",
  width: "356px",
  maxWidth: "356px",
  padding: "14px",
  borderRadius: "26px",
};

const autorExplorarGridCardStyle: CSSProperties = {
  ...autorExplorarCardStyle,
  flex: "none",
  width: "100%",
  maxWidth: "100%",
};

const desktopAutorExplorarGridCardStyle: CSSProperties = {
  ...desktopAutorExplorarCardStyle,
  flex: "none",
  width: "100%",
  maxWidth: "100%",
};

const autorExplorarCardGlowStyle: CSSProperties = {
  display: "none",
};

const autorExplorarTopStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gridTemplateColumns: "68px minmax(0, 1fr)",
  gap: "11px",
  alignItems: "center",
  minWidth: 0,
};

const autorExplorarAvatarShellStyle: CSSProperties = {
  width: "68px",
  height: "68px",
  borderRadius: "21px",
  padding: "3px",
  background: "rgba(255,255,255,0.08)",
  boxShadow: "none",
  overflow: "hidden",
  flex: "0 0 auto",
};

const autorExplorarAvatarImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "cover",
  borderRadius: "18px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
};

const autorExplorarAvatarInitialsStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "18px",
  background: "#08030F",
  color: "#FFFFFF",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.06em",
};

const autorExplorarIdentityStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  alignContent: "center",
  minWidth: 0,
};

const autorExplorarNameStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "24px",
  lineHeight: 0.98,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const autorExplorarBioStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  lineHeight: 1.35,
  fontWeight: 750,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const autorExplorarMetaRowStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
};

const autorExplorarMetaBadgeStyle: CSSProperties = {
  width: "100%",
  minHeight: "32px",
  padding: "0 6px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #E4E4E7)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  ...safeTextStyle,
};

const autorExplorarRatingStarStyle: CSSProperties = {
  color: "#FACC15",
  fontSize: "13px",
  lineHeight: 1,
  marginRight: "3px",
  textShadow: "0 0 8px rgba(250,204,21,0.22)",
  flex: "0 0 auto",
};

const autorExplorarBottomStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "8px",
  minWidth: 0,
};

const autorExplorarGenresStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
};

const autorExplorarGenreBadgeStyle: CSSProperties = {
  width: "100%",
  minHeight: "30px",
  padding: "0 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  ...safeTextStyle,
};

const autorExplorarProfileButtonStyle: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  minHeight: "40px",
  padding: "0 12px",
  borderRadius: "999px",
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "14px",
  minWidth: 0,
};

const publishedCardStyle: CSSProperties = {
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
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
  boxShadow: "none",
};



const publishedCoverStyle: CSSProperties = {
  minHeight: "122px",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  backgroundImage: "linear-gradient(135deg, #08030F 0%, #04000A 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  minWidth: 0,
  textDecoration: "none",
  display: "block",
  boxSizing: "border-box",
};





const cardTopStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};


const publishedTitleStyle: CSSProperties = {
  margin: 0,
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
  gap: "5px",
  minWidth: 0,
};




const draftStatusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#D4D4D8",
  fontSize: "9px",
  fontWeight: 880,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const formatBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #E4E4E7)",
  fontSize: "9px",
  fontWeight: 880,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const classificationBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "9px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const fileStatusBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#DDD6FE",
  fontSize: "9px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const authorLinkStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  margin: 0,
  color: "var(--historietas-text-secondary, #D8C8FF)",
  fontSize: "12px",
  fontWeight: 820,
  textDecoration: "none",
  borderBottom: "0",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const publishedInfoStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  display: "grid",
  alignContent: "center",
  gap: "8px",
};

const desktopPublishedInfoStyle: CSSProperties = {
  ...publishedInfoStyle,
  alignContent: "space-between",
  alignItems: "start",
  gap: "7px",
};

const desktopPublishedSynopsisStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #C9C0D8)",
  fontSize: "12.5px",
  lineHeight: 1.45,
  fontWeight: 680,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  maxWidth: "100%",
  ...safeTextStyle,
};

const statsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.2,
  minWidth: 0,
};

const metricItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  whiteSpace: "nowrap",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  ...safeTextStyle,
};

const metricIconStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  lineHeight: 1,
};

const heartMetricIconStyle: CSSProperties = {
  ...metricIconStyle,
  color: "#BE123C",
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
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
};

const progressBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(90deg, #F97316 0%, #7C3AED 100%)",
};

const progressTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

const readStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  minHeight: "34px",
  marginTop: "2px",
  padding: "0 14px",
  borderRadius: "999px",
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1.15,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  boxShadow: "none",
  ...safeTextStyle,
};


const cardActionRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "4px",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
  boxSizing: "border-box",
};

const cardGenreBadgeStyle: CSSProperties = {
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
};

const cardPrimaryActionStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  marginTop: 0,
  padding: "0 12px",
};

const desktopCardActionRowStyle: CSSProperties = {
  ...cardActionRowStyle,
  overflow: "visible",
};

const desktopCardGenreBadgeStyle: CSSProperties = {
  ...cardGenreBadgeStyle,
  maxWidth: "46%",
};

const desktopCardPrimaryActionStyle: CSSProperties = {
  ...cardPrimaryActionStyle,
  justifyContent: "center",
  textAlign: "center",
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1220px, calc(100% - 64px))",
  padding: "12px 0 40px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "16px",
};

const desktopTopActionsStyle: CSSProperties = {
  ...topActionsStyle,
  gap: "10px",
};

const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  padding: "20px 28px",
  borderRadius: "32px",
  minHeight: "138px",
  display: "grid",
  alignContent: "center",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  margin: "0 auto",
  fontSize: "clamp(46px, 4.7vw, 72px)",
  lineHeight: 0.94,
  maxWidth: "760px",
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  margin: "10px auto 0",
  fontSize: "15px",
  lineHeight: 1.62,
  maxWidth: "680px",
};

const desktopCategoriesStyle: CSSProperties = {
  ...categoriesStyle,
  flexWrap: "wrap",
  overflowX: "visible",
  justifyContent: "center",
  marginLeft: 0,
  marginRight: 0,
  padding: "3px 0 8px",
  maxWidth: "100%",
};

const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  marginTop: "30px",
};

const desktopSectionHeaderStyle: CSSProperties = {
  ...sectionHeaderStyle,
};

const desktopSectionTitleStyle: CSSProperties = {
  ...sectionTitleStyle,
  fontSize: "24px",
};


const desktopPublishedGridStyle: CSSProperties = {
  ...gridStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  justifyContent: "stretch",
  alignItems: "stretch",
  gap: "16px",
};

const desktopPublishedCardStyle: CSSProperties = {
  ...publishedCardStyle,
  gridTemplateColumns: "126px minmax(0, 1fr)",
  gap: "17px",
  padding: "14px",
  borderRadius: "24px",
  alignItems: "stretch",
  minHeight: "178px",
  background: "rgba(4, 0, 10, 0.72)",
  boxShadow: "none",
};


const desktopPublishedCoverStyle: CSSProperties = {
  ...publishedCoverStyle,
  minHeight: "150px",
  borderRadius: "18px",
};



const desktopPublishedTitleStyle: CSSProperties = {
  ...publishedTitleStyle,
  fontSize: "22px",
  lineHeight: 1.08,
  letterSpacing: "-0.03em",
};


const emptyStatePrimaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  minHeight: "48px",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "#FFFFFF",
  color: "#070212",
  fontSize: "13px",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
  boxShadow: "none",
  whiteSpace: "nowrap",
};

const emptyStateSecondaryButtonStyle: CSSProperties = {
  ...emptyStatePrimaryButtonStyle,
  background: "rgba(255,255,255,0.06)",
  color: "#FFFFFF",
};