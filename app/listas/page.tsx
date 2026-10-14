"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, TouchEvent } from "react";
import { useListasActionMessage } from "./hooks/use-listas-action-message";
import { useListasDesktopMode } from "./hooks/use-listas-desktop-mode";
import ListasRatingDetail from "./components/listas-rating-detail";
import { ListasPageHeader } from "./components/listas-page-header";
import { ListasProfileCategoryControls } from "./components/listas-profile-category-controls";
import { ListasResultsSection } from "./components/listas-results-section";
import { ListasDiaryReportModal } from "./components/listas-diary-report-modal";
import { ListasWorkActionSheet } from "./components/listas-work-action-sheet";
import { ListasAuthorRow } from "./components/listas-author-row";
import { ListasDiaryAnnotationCard } from "./components/listas-diary-annotation-card";
import { ListasProfileWorkRow } from "./components/listas-profile-work-row";
import { ListasPublicWorkRow } from "./components/listas-public-work-row";
import {
  ListasDiaryComment,
  type ListasDiaryCommentStyles,
} from "./components/listas-diary-comment";
import {
  ListasDiaryCommentThread,
  type ListasDiaryCommentThreadStyles,
} from "./components/listas-diary-comment-thread";
import {
  ListasDiaryCommentsSheet,
  type ListasDiaryCommentsSheetStyles,
} from "./components/listas-diary-comments-sheet";
import {
  compactarNumero,
  formatarDataCurta,
  formatarLeituraMesAno,
  formatarMesAno,
  formatarNotaListas,
  timestampData,
} from "./lib/listas-format-utils";
import { listasPageCss } from "./lib/listas-page-css";
import { criarAvatarStyle, criarCapaStyle } from "./lib/listas-row-media-utils";
import {
  carregarAnotacoesLocaisListas,
  removerAnotacaoLocalListas,
  salvarAnotacaoLocalListas,
} from "./lib/listas-diary-annotation-utils";
import {
  criarInteracaoAnotacaoListasVazia,
  obterRespostasComentarioDiarioListas,
  ordenarComentariosRaizDiarioListas,
  type ComentarioAnotacaoListas,
  type InteracaoAnotacaoListas,
} from "./lib/listas-diary-comment-utils";
import {
  colecaoTemObraListas,
  carregarObrasLocaisListas,
  removerObraDaColecaoListas,
} from "./lib/listas-local-work-utils";
import {
  obterHrefContinuarLeituraListas,
} from "./lib/listas-profile-items-utils";
import {
  criarObraLista,
  criarPerfilLista,
  montarListasPerfilEstado,
  registroPermitido,
} from "./lib/listas-profile-state-utils";
import {
  dataUltimoCapitulo,
  ordenarObrasDaSecao,
  ordenarRecomendacoes,
  pontuacaoPopularidadeObra,
} from "./lib/listas-public-catalog-utils";
import {
  textoCategorias,
  textoSecundarioItem,
  tituloSecaoPublica,
} from "./lib/listas-profile-text-utils";
import {
  normalizarQuemPodeComentarAnotacaoListas,
  normalizarTipoDiarioListas,
  normalizarVisibilidadeAnotacaoListas,
  normalizarVisibilidadeComentariosAnotacaoListas,
  obterTipoDiarioDoItemListas,
} from "./lib/listas-diary-normalizer-utils";
import {
  AVALIACAO_DIARIO_LISTAS_VAZIA,
  calcularProximaAvaliacaoDiarioListas,
  normalizarAvaliacaoDiarioListas,
  obterPreenchimentoEstrelaListas,
  obterProximaNotaAvaliacaoListas,
  type AvaliacaoDiarioListasEstado,
} from "./lib/listas-diary-rating-utils";
import {
  carregarListaIdsListas,
  criarLoginHrefListas,
  salvarListaIdsListas,
} from "./lib/listas-storage-utils";
import {
  idUsuarioValido,
  obterMensagemErroListas,
  pegarBooleanoListas,
  pegarNumero,
  pegarTexto,
} from "./lib/listas-value-utils";
import {
  normalizarCategoriaPerfil,
  normalizarModoLista,
  normalizarOrdenacao,
  normalizarOrigemPerfil,
} from "./lib/listas-route-utils";
import { supabase } from "../../lib/supabase/client";
import { normalizarTexto } from "../../lib/utils";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { ehClassificacao18 } from "../../lib/historietasAdultContent";
import { carregarMetricasConteudos } from "../../lib/metricas";
import {
  carregarEstadoRelacionamentoPerfil,
  carregarPermissoesAbasPerfil,
  carregarPreferenciasPrivacidade,
  preferenciasPrivacidadePadrao,
  type EstadoRelacionamentoPerfil,
  type PermissoesAbasPerfil,
  type PreferenciasPrivacidadeHistorietas,
} from "../../lib/historietasPrivacy";
import { type TipoAlvoDenuncia } from "../../components/DenunciaModal";

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
type VisibilidadeAnotacaoListas = "publico" | "parcial" | "privado";
type QuemPodeComentarAnotacaoListas =
  | "herdar"
  | "todos"
  | "seguidores"
  | "ninguem";
type VisibilidadeComentariosAnotacaoListas =
  | "herdar"
  | "publico"
  | "seguidores"
  | "somente_eu";
type OrdenacaoComentariosDiarioListas = "relevantes" | "recentes";
type TipoDiarioListas =
  | "lendo"
  | "quero_ler"
  | "favorita"
  | "concluida"
  | "avaliacao"
  | "review"
  | "atividade";

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
  classificacaoIndicativa: string;
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
  ultimaLeituraEm?: string;
  nota: number;
  progresso: number;
  capituloAtual: string;
  capituloAtualId: string;
  capitulosLidosIds: string[];
  anotacao?: string;
  anotacaoId?: string;
  anotacaoTipo?: TipoDiarioListas;
  anotacaoVisibilidade?: VisibilidadeAnotacaoListas;
  anotacaoQuemPodeComentar?: QuemPodeComentarAnotacaoListas;
  anotacaoVisibilidadeComentarios?: VisibilidadeComentariosAnotacaoListas;
  anotacaoPermitirCurtidas?: boolean;
  anotacaoSpoiler?: boolean;
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

type EditorAnotacaoListasEstado = {
  aberto: boolean;
  obraId: string;
  anotacaoId: string;
  tipo: TipoDiarioListas;
  texto: string;
  visibilidade: VisibilidadeAnotacaoListas;
  quemPodeComentar: QuemPodeComentarAnotacaoListas;
  visibilidadeComentarios: VisibilidadeComentariosAnotacaoListas;
  permitirCurtidas: boolean;
  contemSpoiler: boolean;
  salvando: boolean;
  erro: string;
};

type PerfilComentarioDiarioListas = {
  nome: string;
  username: string;
  avatar: string;
};

type InteracoesAnotacoesListasEstado = Record<string, InteracaoAnotacaoListas>;

type AlvoDenunciaDiarioListas = {
  tipo: Extract<
    TipoAlvoDenuncia,
    "diario_anotacao" | "comentario_diario"
  >;
  id: string;
  titulo: string;
};

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
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const DIARIO_ANOTACAO_MAX_LENGTH = 700;
const DIARIO_COMENTARIO_MAX_LENGTH = 700;
const NOTAS_AVALIACAO_LISTAS = [1, 2, 3, 4, 5] as const;

const EDITOR_ANOTACAO_LISTAS_VAZIO: EditorAnotacaoListasEstado = {
  aberto: false,
  obraId: "",
  anotacaoId: "",
  tipo: "atividade",
  texto: "",
  visibilidade: "privado",
  quemPodeComentar: "herdar",
  visibilidadeComentarios: "herdar",
  permitirCurtidas: true,
  contemSpoiler: false,
  salvando: false,
  erro: "",
};

const CAMPOS_OBRAS =
  "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,capa_url,publicado,visualizacoes,slug,criada_em";











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





async function carregarAvaliacaoDiarioListas(
  perfilUserId: string,
): Promise<AvaliacaoDiarioListasEstado> {
  const userId = perfilUserId.trim();

  if (!idUsuarioValido(userId)) {
    return { ...AVALIACAO_DIARIO_LISTAS_VAZIA };
  }

  const { data, error } = await supabase.rpc("carregar_avaliacao_diario", {
    p_diario_user_id: userId,
  });

  if (error) {
    throw error;
  }

  return normalizarAvaliacaoDiarioListas(data);
}

async function carregarPerfil(userId: string, nomeFallback = "") {
  if (!idUsuarioValido(userId)) {
    return criarPerfilLista(null, userId, nomeFallback);
  }

  for (const campo of ["user_id", "id"] as const) {
    try {
      const { data, error } = await supabase
        .from("profiles_publicos")
        .select("id,user_id,nome,username,avatar_url,bio,sobre_bio")
        .eq(campo, userId)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return criarPerfilLista(data, userId, nomeFallback);
      }
    } catch {
      // Tenta buscar pelo identificador alternativo.
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

        const row = registro;
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
          criadoEm: pegarTexto(row.criado_em),
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

async function aplicarMetricasObrasListas(obras: ObraLista[]) {
  const obraIds = Array.from(
    new Set(obras.map((obra) => obra.id.trim()).filter(Boolean)),
  );

  if (obraIds.length === 0) {
    return obras;
  }

  const metricas = await carregarMetricasConteudos({ obraIds });

  if (!metricas.carregado) {
    return obras;
  }

  return obras.map((obra) => {
    const metrica = metricas.obras.get(obra.id);

    if (!metrica) {
      return obra;
    }

    return {
      ...obra,
      totalCurtidas: metrica.audiencia.curtidoresUnicos,
      totalComentarios: metrica.audiencia.comentaristasUnicos,
      notaMedia: metrica.avaliacao.media,
      totalAvaliacoes: metrica.avaliacao.total,
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
      criarObraLista(registro, index),
    );

    obras = await carregarCapitulosDasObras(obras);
    obras = await aplicarMetricasObrasListas(obras);

    return obras;
  } catch {
    return [] as ObraLista[];
  }
}

type TabelaRegistrosUsuarioListas =
  | "seguindo_obras"
  | "favoritos"
  | "concluidas"
  | "obra_avaliacoes"
  | "progresso_leitura"
  | "diario_anotacoes";

async function carregarRegistrosUsuario(
  tabela: TabelaRegistrosUsuarioListas,
  userId: string,
) {
  if (!idUsuarioValido(userId)) {
    return [];
  }

  try {
    const consultas = {
      seguindo_obras: () =>
        supabase
          .from("seguindo_obras")
          .select("obra_id,visibilidade,criado_em")
          .eq("user_id", userId)
          .limit(2000),
      favoritos: () =>
        supabase
          .from("favoritos")
          .select("obra_id,visibilidade,criado_em")
          .eq("user_id", userId)
          .limit(2000),
      concluidas: () =>
        supabase
          .from("concluidas")
          .select("obra_id,visibilidade,criado_em")
          .eq("user_id", userId)
          .limit(2000),
      obra_avaliacoes: () =>
        supabase
          .from("obra_avaliacoes")
          .select("obra_id,nota,criado_em,atualizado_em")
          .eq("user_id", userId)
          .limit(2000),
      progresso_leitura: () =>
        supabase
          .from("progresso_leitura")
          .select(
            "obra_id,capitulo_id,lido,progresso,criado_em,atualizado_em",
          )
          .eq("user_id", userId)
          .limit(2000),
      diario_anotacoes: () =>
        supabase
          .from("diario_anotacoes")
          .select(
            "id,obra_id,tipo,texto,visibilidade,quem_pode_comentar,visibilidade_comentarios,permitir_curtidas,contem_spoiler,criado_em,atualizado_em",
          )
          .eq("user_id", userId)
          .limit(2000),
    } satisfies Record<
      TabelaRegistrosUsuarioListas,
      () => PromiseLike<unknown>
    >;

    const { data, error } = await consultas[tabela]();

    if (error) {
      console.warn(`Nao consegui carregar ${tabela} na pagina Listas:`, error.message);
      return [];
    }

    if (!Array.isArray(data)) {
      return [];
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
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha desconhecida";
    console.warn(`Nao consegui carregar ${tabela} na pagina Listas:`, mensagem);
    return [];
  }
}







async function carregarPerfisComentariosAnotacoesListas(userIds: string[]) {
  const ids = Array.from(new Set(userIds.map((id) => id.trim()).filter(Boolean)));
  const perfis = new Map<string, PerfilComentarioDiarioListas>();

  if (ids.length === 0) {
    return perfis;
  }

  for (const coluna of ["user_id", "id"] as const) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,user_id,nome,username,avatar_url")
        .in(coluna, ids)
        .limit(Math.max(ids.length, 1));

      if (error || !Array.isArray(data)) {
        continue;
      }

      data.forEach((registro) => {
        const perfil: PerfilComentarioDiarioListas = {
          nome:
            pegarTexto(registro.nome) ||
            pegarTexto(registro.username) ||
            "Leitor",
          username: pegarTexto(registro.username),
          avatar: pegarTexto(registro.avatar_url),
        };
        const userId = pegarTexto(registro.user_id);
        const id = pegarTexto(registro.id);

        if (userId) perfis.set(userId, perfil);
        if (id) perfis.set(id, perfil);
      });
    } catch {
      // Tenta buscar pelo identificador alternativo.
    }
  }

  return perfis;
}

async function carregarInteracoesAnotacoesListas(
  anotacaoIds: string[],
  usuarioAtualId: string,
): Promise<InteracoesAnotacoesListasEstado> {
  const ids = Array.from(
    new Set(anotacaoIds.map((id) => id.trim()).filter(Boolean)),
  );
  const resultado = ids.reduce<InteracoesAnotacoesListasEstado>(
    (estado, id) => {
      estado[id] = criarInteracaoAnotacaoListasVazia();
      return estado;
    },
    {},
  );

  if (ids.length === 0) {
    return resultado;
  }

  const [curtidasResposta, comentariosResposta] = await Promise.all([
    supabase
      .from("diario_anotacao_curtidas")
      .select("id,anotacao_id,user_id")
      .in("anotacao_id", ids)
      .limit(2000),
    supabase
      .from("diario_anotacao_comentarios")
      .select(
        "id,anotacao_id,user_id,texto,parent_id,criado_em,atualizado_em",
      )
      .in("anotacao_id", ids)
      .order("criado_em", { ascending: true })
      .limit(2000),
  ]);

  if (Array.isArray(curtidasResposta.data)) {
    curtidasResposta.data.forEach((item) => {
      const registro = item;
      const anotacaoId = pegarTexto(registro.anotacao_id);
      const interacao = resultado[anotacaoId];

      if (!interacao) return;
      interacao.totalCurtidas += 1;
      if (pegarTexto(registro.user_id) === usuarioAtualId) {
        interacao.curtiu = true;
      }
    });
  }

  const comentarios = Array.isArray(comentariosResposta.data)
    ? comentariosResposta.data
    : [];
  const comentarioIds = comentarios
    .map((registro) => pegarTexto(registro.id))
    .filter(Boolean);
  const [perfis, curtidasComentariosResposta] = await Promise.all([
    carregarPerfisComentariosAnotacoesListas(
      comentarios
        .map((registro) => pegarTexto(registro.user_id))
        .filter(Boolean),
    ),
    comentarioIds.length > 0
      ? supabase
          .from("diario_comentario_curtidas")
          .select("comentario_id,user_id")
          .in("comentario_id", comentarioIds)
          .limit(4000)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const curtidasPorComentario = new Map<string, string[]>();

  if (Array.isArray(curtidasComentariosResposta.data)) {
    curtidasComentariosResposta.data.forEach((item) => {
      const registro = item;
      const comentarioId = pegarTexto(registro.comentario_id);
      const userId = pegarTexto(registro.user_id);

      if (!comentarioId || !userId) return;
      const atuais = curtidasPorComentario.get(comentarioId) || [];
      atuais.push(userId);
      curtidasPorComentario.set(comentarioId, atuais);
    });
  }

  comentarios.forEach((registro) => {
    const anotacaoId = pegarTexto(registro.anotacao_id);
    const interacao = resultado[anotacaoId];
    const id = pegarTexto(registro.id);
    const textoComentario = pegarTexto(registro.texto);
    const userId = pegarTexto(registro.user_id);
    const perfil = perfis.get(userId);

    if (!interacao || !id || !textoComentario) return;

    interacao.comentarios.push({
      id,
      anotacaoId,
      userId,
      autorNome: perfil?.nome || "Leitor",
      autorUsername: perfil?.username || "",
      autorAvatar: perfil?.avatar || "",
      texto: textoComentario,
      criadoEm: pegarTexto(registro.criado_em ?? registro.atualizado_em),
      atualizadoEm: pegarTexto(registro.atualizado_em ?? registro.criado_em),
      parentId: pegarTexto(registro.parent_id),
      curtidas: curtidasPorComentario.get(id) || [],
    });
  });

  return resultado;
}

async function carregarListasDoPerfil(
  userId: string,
  proprioPerfil: boolean,
) {
  const [seguindo, favoritas, concluidas, avaliacoes, progresso, anotacoes] =
    await Promise.all([
      carregarRegistrosUsuario(
        "seguindo_obras",
        userId,
      ),
      carregarRegistrosUsuario(
        "favoritos",
        userId,
      ),
      carregarRegistrosUsuario(
        "concluidas",
        userId,
      ),
      carregarRegistrosUsuario(
        "obra_avaliacoes",
        userId,
      ),
      carregarRegistrosUsuario(
        "progresso_leitura",
        userId,
      ),
      carregarRegistrosUsuario(
        "diario_anotacoes",
        userId,
      ),
    ]);

  const capituloIdsSemObra = Array.from(
    new Set(
      progresso
        .filter((registro) => !pegarTexto(registro.obra_id))
        .map((registro) => pegarTexto(registro.capitulo_id))
        .filter(Boolean),
    ),
  );
  let obraIdPorCapituloSemObra = new Map<string, string>();

  if (capituloIdsSemObra.length > 0) {
    try {
      const { data, error } = await supabase
        .from("capitulos")
        .select("id,obra_id")
        .in("id", capituloIdsSemObra)
        .limit(capituloIdsSemObra.length);

      if (!error && Array.isArray(data)) {
        const paresCapituloObra: Array<[string, string]> = [];

        for (const registro of data) {
          const capituloId = pegarTexto(registro?.id);
          const obraId = pegarTexto(registro?.obra_id);

          if (capituloId && obraId) {
            paresCapituloObra.push([capituloId, obraId]);
          }
        }

        obraIdPorCapituloSemObra = new Map<string, string>(
          paresCapituloObra,
        );
      }
    } catch {
      // Mantém os registros originais caso não seja possível resolver o capítulo.
    }
  }

  const progressoCompleto = progresso.map((registro) => {
    if (pegarTexto(registro.obra_id)) {
      return registro;
    }

    const obraIdResolvido = obraIdPorCapituloSemObra.get(
      pegarTexto(registro.capitulo_id),
    );

    return obraIdResolvido
      ? { ...registro, obra_id: obraIdResolvido }
      : registro;
  });

  const seguindoLocais = proprioPerfil
    ? carregarListaIdsListas(LIBRARY_FOLLOW_STORAGE_KEY, userId)
    : [];
  const favoritasLocais = proprioPerfil
    ? carregarListaIdsListas(FAVORITES_STORAGE_KEY, userId)
    : [];
  const concluidasLocais = proprioPerfil
    ? carregarListaIdsListas(COMPLETED_STORAGE_KEY, userId)
    : [];
  const obrasLocais = proprioPerfil ? carregarObrasLocaisListas(userId) : [];
  const anotacoesLocais = proprioPerfil
    ? carregarAnotacoesLocaisListas(userId)
    : [];
  const anotacoesVisiveis = [...anotacoesLocais, ...anotacoes];

  const registrosVisiveis = [
    ...seguindo,
    ...favoritas,
    ...concluidas,
    ...avaliacoes,
    ...progressoCompleto,
    ...anotacoesVisiveis,
  ].filter((registro) =>
    anotacoesVisiveis.includes(registro)
      ? true
      : registroPermitido(registro, proprioPerfil),
  );

  const idsObrasRemotos = Array.from(
    new Set(
      registrosVisiveis
        .map((registro) => pegarTexto(registro.obra_id))
        .filter(Boolean),
    ),
  );
  const obras = idsObrasRemotos.length > 0
    ? await carregarObrasPublicadas(idsObrasRemotos)
    : await carregarObrasPublicadas([]);
  return montarListasPerfilEstado<
    ObraLista,
    CategoriaPerfil,
    ItemObraLista
  >({
    userId,
    proprioPerfil,
    seguindo,
    favoritas,
    concluidas,
    avaliacoes,
    progressoCompleto,
    anotacoesVisiveis,
    seguindoLocais,
    favoritasLocais,
    concluidasLocais,
    obrasLocais,
    obras,
  });
}

async function carregarIdsInteracoesUsuario(userId: string) {
  if (!idUsuarioValido(userId)) {
    return [] as string[];
  }

  const carregarIds = async (
    tabela: "favoritos" | "seguindo_obras" | "concluidas",
  ) => {
    const consultas = {
      favoritos: () =>
        supabase
          .from("favoritos")
          .select("obra_id")
          .eq("user_id", userId),
      seguindo_obras: () =>
        supabase
          .from("seguindo_obras")
          .select("obra_id")
          .eq("user_id", userId),
      concluidas: () =>
        supabase
          .from("concluidas")
          .select("obra_id")
          .eq("user_id", userId),
    };
    const { data, error } = await consultas[tabela]();

    if (error || !Array.isArray(data)) {
      return [];
    }

    return data.map(({ obra_id }) => ({ obra_id }));
  };

  const [favoritas, seguindo, concluidas] = await Promise.all([
    carregarIds("favoritos"),
    carregarIds("seguindo_obras"),
    carregarIds("concluidas"),
  ]);

  return Array.from(
    new Set(
      [...favoritas, ...seguindo, ...concluidas]
        .map((registro) => pegarTexto(registro.obra_id))
        .filter(Boolean),
    ),
  );
}

async function carregarAvaliacoesAutoresPublicos(autorIds: string[]) {
  const idsUnicos = Array.from(
    new Set(autorIds.map((id) => id.trim()).filter(idUsuarioValido)),
  );
  const avaliacoes = new Map<string, { media: number; total: number }>();

  if (idsUnicos.length === 0) {
    return avaliacoes;
  }

  const metricas = await carregarMetricasConteudos({ autorIds: idsUnicos });

  if (!metricas.carregado) {
    return avaliacoes;
  }

  metricas.autores.forEach((metrica) => {
    avaliacoes.set(metrica.id, {
      media: metrica.avaliacao.media,
      total: metrica.avaliacao.total,
    });
  });

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
          .from("profiles_publicos")
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

          const row = registro;
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

function criarAvatarPerfilDiarioListasStyle(avatar: string): CSSProperties {
  const avatarLimpo = avatar.trim();

  return avatarLimpo
    ? {
        ...listDiaryProfileAvatarStyle,
        backgroundImage: `url(${avatarLimpo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "transparent",
      }
    : listDiaryProfileAvatarStyle;
}

function criarAvatarComentarioDiarioListasStyle(
  estiloBase: CSSProperties,
  avatar: string,
): CSSProperties {
  const avatarLimpo = avatar.trim();

  return avatarLimpo
    ? {
        ...estiloBase,
        backgroundImage: `url(${avatarLimpo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "transparent",
      }
    : estiloBase;
}

function ListasUniversaisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const queryAtual = searchParams.toString();

  const modo: ModoLista = normalizarModoLista(searchParams.get("modo"));
  const origemPerfil: OrigemPerfil = normalizarOrigemPerfil(
    searchParams.get("origem"),
  );
  const categoriaUrl = normalizarCategoriaPerfil(searchParams.get("categoria"));
  const userIdUrl =
    searchParams.get("usuario") ||
    searchParams.get("userId") ||
    searchParams.get("autorId") ||
    "";
  const secao = pegarTexto(searchParams.get("secao"), "catalogo");
  const genero = pegarTexto(searchParams.get("genero"));
  const tituloPersonalizado = pegarTexto(searchParams.get("titulo"));
  const obraAlvoId = pegarTexto(
    searchParams.get("obra") || searchParams.get("obraId"),
  );

  const [usuarioAtualId, setUsuarioAtualId] = useState("");
  const [usuarioAtualPerfil, setUsuarioAtualPerfil] =
    useState<PerfilLista | null>(null);
  const [perfil, setPerfil] = useState<PerfilLista | null>(null);
  const [listasPerfil, setListasPerfil] =
    useState<ListasPerfilEstado>(LISTAS_PERFIL_VAZIAS);
  const [obrasPublicas, setObrasPublicas] = useState<ObraLista[]>([]);
  const [autores, setAutores] = useState<AutorLista[]>([]);
  const [categoria, setCategoria] = useState<CategoriaPerfil>(categoriaUrl);
  const busca = "";
  const ordenacao: OrdenacaoLista = normalizarOrdenacao(
    searchParams.get("ordem"),
  );
  const [quantidadeVisivel, setQuantidadeVisivel] = useState(40);
  const [carregando, setCarregando] = useState(true);
  const [bloqueado, setBloqueado] = useState(false);
  const [erro, setErro] = useState("");
  const [obraMenuAberta, setObraMenuAberta] = useState<ObraLista | null>(null);
  const [itemPerfilMenuAberto, setItemPerfilMenuAberto] =
    useState<ItemObraLista | null>(null);
  const [categoriaMenuAberta, setCategoriaMenuAberta] =
    useState<CategoriaPerfil>("tudo");
  const [salvandoQueroLer, setSalvandoQueroLer] = useState(false);
  const [obraMenuNoQueroLer, setObraMenuNoQueroLer] = useState(false);
  const [editorAnotacao, setEditorAnotacao] =
    useState<EditorAnotacaoListasEstado>(EDITOR_ANOTACAO_LISTAS_VAZIO);
  const [interacoesAnotacoes, setInteracoesAnotacoes] =
    useState<InteracoesAnotacoesListasEstado>({});
  const [anotacoesAbertas, setAnotacoesAbertas] =
    useState<Record<string, boolean>>({});
  const [anotacoesSpoilerReveladas, setAnotacoesSpoilerReveladas] =
    useState<Record<string, boolean>>({});
  const [preferenciasPerfil, setPreferenciasPerfil] =
    useState<PreferenciasPrivacidadeHistorietas>(preferenciasPrivacidadePadrao);
  const [relacionamentoPerfil, setRelacionamentoPerfil] =
    useState<EstadoRelacionamentoPerfil>("nenhum");
  const [avaliacaoDiario, setAvaliacaoDiario] =
    useState<AvaliacaoDiarioListasEstado>(AVALIACAO_DIARIO_LISTAS_VAZIA);
  const [comentarioCurtindoId, setComentarioCurtindoId] = useState("");
  const [comentarioRemovendoId, setComentarioRemovendoId] = useState("");
  const { mensagemAcao, setMensagemAcao } = useListasActionMessage();
  const [alvoDenunciaDiario, setAlvoDenunciaDiario] =
    useState<AlvoDenunciaDiarioListas | null>(null);
  const [comentariosDiarioItem, setComentariosDiarioItem] =
    useState<ItemObraLista | null>(null);
  const [comentariosDiarioExpandido, setComentariosDiarioExpandido] =
    useState(false);
  const [menuOrdenacaoComentariosDiarioAberto, setMenuOrdenacaoComentariosDiarioAberto] =
    useState(false);
  const [respostasVisiveisComentariosDiario, setRespostasVisiveisComentariosDiario] =
    useState<Record<string, number>>({});
  const comentariosSheetRef = useRef<HTMLElement | null>(null);
  const comentariosDragStartYRef = useRef(0);
  const comentariosDragOffsetYRef = useRef(0);
  const comentariosDragIgnorarCliqueRef = useRef(false);
  const comentariosDragResetTimerRef = useRef<number | null>(null);
  const isDesktop = useListasDesktopMode();
  const [obraDestacadaId, setObraDestacadaId] = useState("");

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
        setItemPerfilMenuAberto(null);
        setObraMenuNoQueroLer(false);
        setEditorAnotacao(EDITOR_ANOTACAO_LISTAS_VAZIO);
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
      setAvaliacaoDiario((atual) => ({
        ...AVALIACAO_DIARIO_LISTAS_VAZIA,
        carregando: modo === "perfil" && origemPerfil === "diario",
        configuracoesAbertas: atual.configuracoesAbertas,
      }));

      try {
        const { data: authData } = await supabase.auth.getUser();
        const usuarioLogadoId = authData.user?.id || "";

        if (cancelado) {
          return;
        }

        setUsuarioAtualId(usuarioLogadoId);

        if (usuarioLogadoId) {
          try {
            const perfilUsuarioAtual = await carregarPerfil(
              usuarioLogadoId,
              pegarTexto(authData.user?.user_metadata?.nome) ||
                pegarTexto(authData.user?.email) ||
                "Usuário",
            );

            if (!cancelado) {
              setUsuarioAtualPerfil(perfilUsuarioAtual);
            }
          } catch {
            if (!cancelado) {
              setUsuarioAtualPerfil({
                userId: usuarioLogadoId,
                nome:
                  pegarTexto(authData.user?.user_metadata?.nome) ||
                  pegarTexto(authData.user?.email) ||
                  "Usuário",
                username: pegarTexto(
                  authData.user?.user_metadata?.username,
                ).replace(/^@/, ""),
                avatar: pegarTexto(
                  authData.user?.user_metadata?.avatar_url ??
                    authData.user?.user_metadata?.avatar,
                ),
                bio: "",
              });
            }
          }
        } else {
          setUsuarioAtualPerfil(null);
        }

        if (modo === "perfil") {
          const perfilIdRecebido = userIdUrl.trim() || usuarioLogadoId;

          if (!perfilIdRecebido || !idUsuarioValido(perfilIdRecebido)) {
            setPerfil(null);
            setListasPerfil(LISTAS_PERFIL_VAZIAS);
            setErro("Não foi possível identificar o perfil desta lista.");
            return;
          }

          const perfilInicialmenteProprio =
            perfilIdRecebido === usuarioLogadoId;
          const perfilCarregado = await carregarPerfil(
            perfilIdRecebido,
            perfilInicialmenteProprio
              ? pegarTexto(authData.user?.user_metadata?.nome) ||
                  pegarTexto(authData.user?.email)
              : "",
          );
          const perfilUserId =
            perfilCarregado.userId.trim() || perfilIdRecebido;
          const proprioPerfil =
            Boolean(usuarioLogadoId) &&
            (perfilUserId === usuarioLogadoId ||
              perfilIdRecebido === usuarioLogadoId);
          const preferencias = await carregarPreferenciasPrivacidade(
            perfilUserId,
            {
              usarFallbackLocal: proprioPerfil,
            },
          );
          const permissoes = proprioPerfil
            ? PERMISSOES_PROPRIO_PERFIL
            : await carregarPermissoesAbasPerfil(perfilUserId, preferencias);
          const permitido =
            origemPerfil === "biblioteca"
              ? permissoes.biblioteca
              : permissoes.diario;
          const relacionamento = proprioPerfil
            ? "proprio_perfil"
            : await carregarEstadoRelacionamentoPerfil(
                perfilUserId,
                usuarioLogadoId,
              );

          if (cancelado) {
            return;
          }

          setPerfil(perfilCarregado);
          setPreferenciasPerfil(preferencias);
          setRelacionamentoPerfil(relacionamento);

          if (origemPerfil === "diario") {
            try {
              const avaliacaoCarregada = await carregarAvaliacaoDiarioListas(
                perfilUserId,
              );

              if (!cancelado) {
                setAvaliacaoDiario(avaliacaoCarregada);
              }
            } catch (error) {
              if (!cancelado) {
                setAvaliacaoDiario((atual) => ({
                  ...atual,
                  carregando: false,
                  erro: obterMensagemErroListas(
                    error,
                    "Não foi possível carregar a Avaliação do Diário.",
                  ),
                }));
              }
            }
          }

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

        let obrasPreparadas = catalogo.filter(
          (obra) => !ehClassificacao18(obra.classificacaoIndicativa),
        );

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

  useEffect(() => {
    if (!comentariosDiarioItem) {
      return;
    }

    const overflowAnterior = document.body.style.overflow;
    const aoPressionarTecla = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setComentariosDiarioItem(null);
        setComentariosDiarioExpandido(false);
        setMenuOrdenacaoComentariosDiarioAberto(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", aoPressionarTecla);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", aoPressionarTecla);
    };
  }, [comentariosDiarioItem]);

  useEffect(() => {
    let cancelado = false;

    if (modo !== "perfil") {
      setInteracoesAnotacoes({});
      return;
    }

    const anotacaoIds = Array.from(
      new Set(
        (Object.values(listasPerfil) as ItemObraLista[][])
          .flat()
          .map((item) => item.anotacaoId?.trim() || "")
          .filter(Boolean),
      ),
    );

    void carregarInteracoesAnotacoesListas(
      anotacaoIds,
      usuarioAtualId,
    ).then((carregadas) => {
      if (cancelado) return;

      setInteracoesAnotacoes((atuais) => {
        const proximo: InteracoesAnotacoesListasEstado = {};

        Object.entries(carregadas).forEach(([id, interacao]) => {
          proximo[id] = {
            ...interacao,
            novoComentario: atuais[id]?.novoComentario || "",
            respondendoComentarioId:
              atuais[id]?.respondendoComentarioId || "",
            respondendoAutorNome: atuais[id]?.respondendoAutorNome || "",
            ordenacaoComentarios:
              atuais[id]?.ordenacaoComentarios || "relevantes",
          };
        });

        return proximo;
      });
    });

    return () => {
      cancelado = true;
    };
  }, [listasPerfil, modo, usuarioAtualId]);

  useEffect(() => {
    if (modo !== "perfil" || carregando || !obraAlvoId) {
      return;
    }

    const obraEstaNaCategoriaAtual = listasPerfil[categoria].some(
      (item) => item.obra.id === obraAlvoId,
    );
    const obraEstaEmTudo = listasPerfil.tudo.some(
      (item) => item.obra.id === obraAlvoId,
    );

    if (!obraEstaNaCategoriaAtual && obraEstaEmTudo && categoria !== "tudo") {
      const params = new URLSearchParams(queryAtual);
      params.set("categoria", "tudo");
      setCategoria("tudo");
      router.replace(`/listas?${params.toString()}`, { scroll: false });
      return;
    }

    const timer = window.setTimeout(() => {
      const elemento = document.getElementById(`lista-obra-${obraAlvoId}`);

      if (!elemento) return;
      setObraDestacadaId(obraAlvoId);
      elemento.scrollIntoView({ behavior: "smooth", block: "center" });

      window.setTimeout(() => {
        setObraDestacadaId((atual) => (atual === obraAlvoId ? "" : atual));
      }, 2400);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [
    obraAlvoId,
    carregando,
    categoria,
    listasPerfil,
    modo,
    queryAtual,
    router,
  ]);

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
      ? `${origemPerfil === "biblioteca" ? "Biblioteca" : "Diário"} de ${
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

  const controlesCategoriasPerfilAtualStyle = isDesktop
    ? origemPerfil === "diario"
      ? desktopListDiaryControlsStyle
      : desktopControlsStyle
    : origemPerfil === "diario"
      ? listDiaryControlsStyle
      : controlsStyle;
  const abasCategoriasPerfilAtualStyle = isDesktop ? desktopTabsStyle : tabsStyle;
  const secaoResultadosAtualStyle = isDesktop
    ? desktopListSectionStyle
    : listSectionStyle;
  const linhasObrasAtualStyle = isDesktop ? desktopWorksRowsStyle : rowsStyle;

  function trocarCategoria(novaCategoria: CategoriaPerfil) {
    setCategoria(novaCategoria);
    const params = new URLSearchParams(queryAtual);
    params.set("categoria", novaCategoria);
    router.replace(`/listas?${params.toString()}`, { scroll: false });
  }

  async function abrirMenuObra(
    obra: ObraLista,
    item: ItemObraLista | null = null,
    categoriaAtual: CategoriaPerfil = "tudo",
  ) {
    setObraMenuAberta(obra);
    setItemPerfilMenuAberto(item);
    setCategoriaMenuAberta(categoriaAtual);
    setObraMenuNoQueroLer(false);
    setEditorAnotacao(EDITOR_ANOTACAO_LISTAS_VAZIO);

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
    if (salvandoQueroLer || editorAnotacao.salvando) {
      return;
    }

    setObraMenuAberta(null);
    setItemPerfilMenuAberto(null);
    setObraMenuNoQueroLer(false);
    setEditorAnotacao(EDITOR_ANOTACAO_LISTAS_VAZIO);
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
      setItemPerfilMenuAberto(null);

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


  const perfilEhProprio = Boolean(
    modo === "perfil" &&
      usuarioAtualId &&
      perfil?.userId &&
      usuarioAtualId === perfil.userId,
  );
  function obterPermissoesAnotacaoListas(item: ItemObraLista) {
    const visibilidadeComentarios =
      item.anotacaoVisibilidadeComentarios || "herdar";
    const quemPodeComentar = item.anotacaoQuemPodeComentar || "herdar";
    const seguidor = relacionamentoPerfil === "seguindo";
    const podeVerComentarios =
      perfilEhProprio ||
      visibilidadeComentarios === "publico" ||
      visibilidadeComentarios === "herdar" ||
      (visibilidadeComentarios === "seguidores" && seguidor);
    const regraComentarioEfetiva =
      quemPodeComentar === "herdar"
        ? preferenciasPerfil.quemPodeComentarDiario
        : quemPodeComentar;
    const podeComentar =
      podeVerComentarios &&
      (perfilEhProprio ||
        regraComentarioEfetiva === "todos" ||
        (regraComentarioEfetiva === "seguidores" && seguidor));

    return {
      podeVerComentarios,
      podeComentar,
      podeCurtirAnotacao: item.anotacaoPermitirCurtidas !== false,
    };
  }

  async function salvarAvaliacaoDiarioPerfil(novaNota: number) {
    const perfilUserId = perfil?.userId.trim() || "";

    if (!perfilUserId || avaliacaoDiario.salvando || perfilEhProprio) {
      return;
    }

    if (!usuarioAtualId) {
      router.push(criarLoginHrefListas());
      return;
    }

    if (!avaliacaoDiario.visivel || !avaliacaoDiario.podeAvaliar) {
      return;
    }

    const nota =
      novaNota <= 0
        ? 0
        : Math.max(0.5, Math.min(5, Math.round(novaNota * 2) / 2));
    const avaliacaoAnterior = avaliacaoDiario;
    const avaliacaoOtimista = calcularProximaAvaliacaoDiarioListas(
      avaliacaoDiario,
      nota,
    );

    setAvaliacaoDiario(avaliacaoOtimista);
    setMensagemAcao("");

    try {
      const nomeRpc =
        nota > 0 ? "salvar_avaliacao_diario" : "remover_avaliacao_diario";
      const parametros =
        nota > 0
          ? { p_diario_user_id: perfilUserId, p_nota: nota }
          : { p_diario_user_id: perfilUserId };
      const { data, error } = await supabase.rpc(nomeRpc, parametros);

      if (error) {
        throw error;
      }

      if (data && typeof data === "object") {
        setAvaliacaoDiario((atual) =>
          normalizarAvaliacaoDiarioListas(data, atual),
        );
      } else {
        const avaliacaoAtualizada = await carregarAvaliacaoDiarioListas(
          perfilUserId,
        );
        setAvaliacaoDiario(avaliacaoAtualizada);
      }
    } catch (error) {
      setAvaliacaoDiario({
        ...avaliacaoAnterior,
        salvando: false,
        erro: obterMensagemErroListas(
          error,
          "Não foi possível salvar a Avaliação do Diário.",
        ),
      });
    }
  }


  function atualizarAnotacaoNosItensListas(
    obraId: string,
    atualizacao: Pick<
      ItemObraLista,
      | "anotacao"
      | "anotacaoId"
      | "anotacaoTipo"
      | "anotacaoVisibilidade"
      | "anotacaoQuemPodeComentar"
      | "anotacaoVisibilidadeComentarios"
      | "anotacaoPermitirCurtidas"
      | "anotacaoSpoiler"
    >,
  ) {
    setListasPerfil((estadoAtual) => {
      const proximo = { ...estadoAtual };

      (Object.keys(proximo) as CategoriaPerfil[]).forEach((categoriaEstado) => {
        proximo[categoriaEstado] = proximo[categoriaEstado].map((item) =>
          item.obra.id === obraId ? { ...item, ...atualizacao } : item,
        );
      });

      return proximo;
    });

    setItemPerfilMenuAberto((itemAtual) =>
      itemAtual?.obra.id === obraId
        ? { ...itemAtual, ...atualizacao }
        : itemAtual,
    );
  }

  function abrirEditorAnotacaoListas() {
    const item = itemPerfilMenuAberto;
    const obra = obraMenuAberta;

    if (!item || !obra || !perfilEhProprio || !idUsuarioValido(obra.id)) {
      setMensagemAcao("Você só pode editar anotações da sua própria lista.");
      return;
    }

    setEditorAnotacao({
      aberto: true,
      obraId: obra.id,
      anotacaoId: item.anotacaoId?.trim() || "",
      tipo:
        item.anotacaoTipo ||
        obterTipoDiarioDoItemListas(categoriaMenuAberta, item),
      texto: item.anotacao || "",
      visibilidade:
        item.anotacaoVisibilidade ||
        (preferenciasPerfil.anotacoesPrivadasPorPadrao
          ? "privado"
          : preferenciasPerfil.visibilidadeDiario === "publico"
            ? "publico"
            : "parcial"),
      quemPodeComentar: item.anotacaoQuemPodeComentar || "herdar",
      visibilidadeComentarios:
        item.anotacaoVisibilidadeComentarios || "herdar",
      permitirCurtidas: item.anotacaoPermitirCurtidas !== false,
      contemSpoiler: Boolean(item.anotacaoSpoiler),
      salvando: false,
      erro: "",
    });
  }

  async function salvarAnotacaoListas() {
    const userId = usuarioAtualId.trim();
    const obraId = editorAnotacao.obraId.trim();
    const textoAnotacao = editorAnotacao.texto.trim();

    if (!perfilEhProprio || !userId || !idUsuarioValido(userId)) {
      setEditorAnotacao((atual) => ({
        ...atual,
        erro: "Entre na sua conta para salvar a anotação.",
      }));
      return;
    }

    if (!obraId || !idUsuarioValido(obraId)) {
      setEditorAnotacao((atual) => ({
        ...atual,
        erro: "A obra ainda não possui um ID válido no Supabase.",
      }));
      return;
    }

    if (!textoAnotacao) {
      setEditorAnotacao((atual) => ({
        ...atual,
        erro: "Escreva uma anotação antes de salvar.",
      }));
      return;
    }

    setEditorAnotacao((atual) => ({ ...atual, salvando: true, erro: "" }));

    try {
      const atualizadoEm = new Date().toISOString();
      const visibilidadeHerdada: VisibilidadeAnotacaoListas =
        editorAnotacao.visibilidade;
      const payload = {
        user_id: userId,
        obra_id: obraId,
        tipo: editorAnotacao.tipo,
        texto: textoAnotacao.slice(0, DIARIO_ANOTACAO_MAX_LENGTH),
        visibilidade: visibilidadeHerdada,
        quem_pode_comentar: editorAnotacao.quemPodeComentar,
        visibilidade_comentarios: editorAnotacao.visibilidadeComentarios,
        permitir_curtidas: editorAnotacao.permitirCurtidas,
        contem_spoiler: editorAnotacao.contemSpoiler,
        atualizado_em: atualizadoEm,
      };
      const camposComSpoiler =
        "id,obra_id,tipo,texto,visibilidade,quem_pode_comentar,visibilidade_comentarios,permitir_curtidas,contem_spoiler,atualizado_em";

      async function atualizarRegistroAnotacao(id: string) {
    const resposta = await supabase
      .from("diario_anotacoes")
      .update({
        texto: payload.texto,
        visibilidade: payload.visibilidade,
        quem_pode_comentar: payload.quem_pode_comentar,
        visibilidade_comentarios: payload.visibilidade_comentarios,
        permitir_curtidas: payload.permitir_curtidas,
        contem_spoiler: payload.contem_spoiler,
        atualizado_em: payload.atualizado_em,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select(camposComSpoiler)
      .maybeSingle();

    if (resposta.error) {
      throw resposta.error;
    }

    return resposta.data
      ? resposta.data
      : null;
  }

  async function buscarRegistroAnotacaoExistente() {
    const resposta = await supabase
      .from("diario_anotacoes")
      .select(camposComSpoiler)
      .eq("user_id", userId)
      .eq("obra_id", obraId)
      .order("atualizado_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (resposta.error) {
      throw resposta.error;
    }

    return resposta.data
      ? resposta.data
      : null;
  }

  async function inserirRegistroAnotacao() {
    const resposta = await supabase
      .from("diario_anotacoes")
      .insert(payload)
      .select(camposComSpoiler)
      .single();

    if (resposta.error || !resposta.data) {
      throw (
        resposta.error ||
        new Error("O banco nao confirmou a anotacao salva.")
      );
    }

    return resposta.data;
  }

  let registroSalvo: RegistroGenerico | null = null;

      if (editorAnotacao.anotacaoId) {
        registroSalvo = await atualizarRegistroAnotacao(
          editorAnotacao.anotacaoId,
        );
      }

      if (!registroSalvo) {
        const anotacaoExistente = await buscarRegistroAnotacaoExistente();
        const idExistente = pegarTexto(anotacaoExistente?.id);

        registroSalvo = idExistente
          ? await atualizarRegistroAnotacao(idExistente)
          : await inserirRegistroAnotacao();
      }

      if (!registroSalvo) {
        throw new Error("O banco não confirmou a anotação salva.");
      }

      const anotacaoId = pegarTexto(registroSalvo.id);
      const tipoSalvo =
        normalizarTipoDiarioListas(registroSalvo.tipo) || editorAnotacao.tipo;
      const visibilidadeSalva = normalizarVisibilidadeAnotacaoListas(
        registroSalvo.visibilidade,
        visibilidadeHerdada,
      );
      const textoSalvo = pegarTexto(registroSalvo.texto, payload.texto);
      const quemPodeComentarSalvo = normalizarQuemPodeComentarAnotacaoListas(
        registroSalvo.quem_pode_comentar ?? registroSalvo.quemPodeComentar,
        editorAnotacao.quemPodeComentar,
      );
      const visibilidadeComentariosSalva =
        normalizarVisibilidadeComentariosAnotacaoListas(
          registroSalvo.visibilidade_comentarios ??
            registroSalvo.visibilidadeComentarios,
          editorAnotacao.visibilidadeComentarios,
        );
      const permitirCurtidasSalvo = pegarBooleanoListas(
        registroSalvo.permitir_curtidas ?? registroSalvo.permitirCurtidas,
        editorAnotacao.permitirCurtidas,
      );
      const contemSpoilerSalvo = pegarBooleanoListas(
        registroSalvo.contem_spoiler ?? registroSalvo.contemSpoiler,
        editorAnotacao.contemSpoiler,
      );

      if (anotacaoId) {
        const { error: erroDuplicadas } = await supabase
          .from("diario_anotacoes")
          .delete()
          .eq("user_id", userId)
          .eq("obra_id", obraId)
          .neq("id", anotacaoId);

        if (erroDuplicadas) {
          console.warn(
            "Não consegui remover anotações duplicadas:",
            erroDuplicadas.message,
          );
        }
      }

      salvarAnotacaoLocalListas(userId, {
        id: anotacaoId,
        user_id: userId,
        obra_id: obraId,
        tipo: tipoSalvo,
        texto: textoSalvo,
        visibilidade: visibilidadeSalva,
        quem_pode_comentar: quemPodeComentarSalvo,
        visibilidade_comentarios: visibilidadeComentariosSalva,
        permitir_curtidas: permitirCurtidasSalvo,
        contem_spoiler: contemSpoilerSalvo,
        atualizado_em: pegarTexto(registroSalvo.atualizado_em, atualizadoEm),
      });

      atualizarAnotacaoNosItensListas(obraId, {
        anotacao: textoSalvo,
        anotacaoId,
        anotacaoTipo: tipoSalvo,
        anotacaoVisibilidade: visibilidadeSalva,
        anotacaoQuemPodeComentar: quemPodeComentarSalvo,
        anotacaoVisibilidadeComentarios: visibilidadeComentariosSalva,
        anotacaoPermitirCurtidas: permitirCurtidasSalvo,
        anotacaoSpoiler: contemSpoilerSalvo,
      });

      const chaveAnotacaoSalva = anotacaoId || obraId;
      setAnotacoesAbertas((atuais) => ({
        ...atuais,
        [chaveAnotacaoSalva]: false,
      }));
      setAnotacoesSpoilerReveladas((atuais) => ({
        ...atuais,
        [chaveAnotacaoSalva]: false,
      }));

      if (anotacaoId && !interacoesAnotacoes[anotacaoId]) {
        setInteracoesAnotacoes((atual) => ({
          ...atual,
          [anotacaoId]: criarInteracaoAnotacaoListasVazia(),
        }));
      }

      setEditorAnotacao(EDITOR_ANOTACAO_LISTAS_VAZIO);
      setMensagemAcao("Anotação salva.");
    } catch (error) {
      setEditorAnotacao((atual) => ({
        ...atual,
        salvando: false,
        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar a anotação.",
      }));
    }
  }

  async function removerAnotacaoListas() {
    const userId = usuarioAtualId.trim();
    const obraId = editorAnotacao.obraId.trim();

    if (
      !perfilEhProprio ||
      !userId ||
      !obraId ||
      !window.confirm("Remover esta anotação?")
    ) {
      return;
    }

    setEditorAnotacao((atual) => ({ ...atual, salvando: true, erro: "" }));

    try {
      const { error } = await supabase
        .from("diario_anotacoes")
        .delete()
        .eq("user_id", userId)
        .eq("obra_id", obraId);

      if (error) throw error;

      removerAnotacaoLocalListas(userId, obraId);
      atualizarAnotacaoNosItensListas(obraId, {
        anotacao: undefined,
        anotacaoId: undefined,
        anotacaoTipo: undefined,
        anotacaoVisibilidade: undefined,
        anotacaoQuemPodeComentar: undefined,
        anotacaoVisibilidadeComentarios: undefined,
        anotacaoPermitirCurtidas: undefined,
        anotacaoSpoiler: undefined,
      });
      const chaveAnotacaoRemovida =
        editorAnotacao.anotacaoId || obraId;
      setAnotacoesAbertas((atuais) => {
        const proximo = { ...atuais };
        delete proximo[chaveAnotacaoRemovida];
        return proximo;
      });
      setAnotacoesSpoilerReveladas((atuais) => {
        const proximo = { ...atuais };
        delete proximo[chaveAnotacaoRemovida];
        return proximo;
      });
      setEditorAnotacao(EDITOR_ANOTACAO_LISTAS_VAZIO);
      setMensagemAcao("Anotação removida.");
    } catch (error) {
      setEditorAnotacao((atual) => ({
        ...atual,
        salvando: false,
        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível remover a anotação.",
      }));
    }
  }

  function abrirDenunciaDiario(
    tipo: AlvoDenunciaDiarioListas["tipo"],
    id: string,
    titulo: string,
    autorId: string,
  ) {
    const alvoId = id.trim();
    const autorIdLimpo = autorId.trim();

    if (!alvoId || !idUsuarioValido(alvoId)) {
      setMensagemAcao("Não foi possível identificar este conteúdo.");
      return;
    }

    if (
      autorIdLimpo &&
      usuarioAtualId.trim() &&
      autorIdLimpo === usuarioAtualId.trim()
    ) {
      setMensagemAcao("Você não pode denunciar seu próprio conteúdo.");
      return;
    }

    if (tipo === "comentario_diario") {
      fecharComentariosDiario();
    }

    setAlvoDenunciaDiario({
      tipo,
      id: alvoId,
      titulo: titulo.trim() || "Conteúdo do Diário",
    });
  }

  function atualizarInteracaoAnotacaoListas(
    anotacaoId: string,
    atualizar: (estado: InteracaoAnotacaoListas) => InteracaoAnotacaoListas,
  ) {
    setInteracoesAnotacoes((estadoAtual) => ({
      ...estadoAtual,
      [anotacaoId]: atualizar(
        estadoAtual[anotacaoId] || criarInteracaoAnotacaoListasVazia(),
      ),
    }));
  }

  async function alternarCurtidaAnotacaoListas(item: ItemObraLista) {
    const anotacaoId = item.anotacaoId?.trim() || "";
    const userId = usuarioAtualId.trim();

    if (!anotacaoId) return;

    const permissoes = obterPermissoesAnotacaoListas(item);

    if (!permissoes.podeCurtirAnotacao) {
      setMensagemAcao("As curtidas estão desativadas nesta anotação.");
      return;
    }

    if (!userId) {
      router.push(criarLoginHrefListas());
      return;
    }

    const interacao =
      interacoesAnotacoes[anotacaoId] || criarInteracaoAnotacaoListasVazia();

    if (interacao.salvandoCurtida) return;

    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      salvandoCurtida: true,
      erro: "",
    }));

    try {
      if (interacao.curtiu) {
        const { error } = await supabase
          .from("diario_anotacao_curtidas")
          .delete()
          .eq("anotacao_id", anotacaoId)
          .eq("user_id", userId);
        if (error) throw error;

        atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
          ...atual,
          curtiu: false,
          totalCurtidas: Math.max(0, atual.totalCurtidas - 1),
          salvandoCurtida: false,
        }));
      } else {
        const { error } = await supabase
          .from("diario_anotacao_curtidas")
          .insert({ anotacao_id: anotacaoId, user_id: userId });
        if (error) throw error;

        atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
          ...atual,
          curtiu: true,
          totalCurtidas: atual.totalCurtidas + 1,
          salvandoCurtida: false,
        }));
      }
    } catch (error) {
      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        salvandoCurtida: false,
        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar a curtida.",
      }));
    }
  }

  function atualizarComentarioAnotacaoListas(anotacaoId: string, texto: string) {
    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      novoComentario: texto.slice(0, DIARIO_COMENTARIO_MAX_LENGTH),
      erro: "",
    }));
  }

  function iniciarRespostaComentarioAnotacaoListas(
    anotacaoId: string,
    comentario: ComentarioAnotacaoListas,
  ) {
    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      respondendoComentarioId: comentario.parentId || comentario.id,
      respondendoAutorNome: comentario.autorNome,
      erro: "",
    }));
  }

  function cancelarRespostaComentarioAnotacaoListas(anotacaoId: string) {
    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      respondendoComentarioId: "",
      respondendoAutorNome: "",
    }));
  }

  function alterarOrdenacaoComentariosAnotacaoListas(
    anotacaoId: string,
    ordenacao: OrdenacaoComentariosDiarioListas,
  ) {
    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      ordenacaoComentarios: ordenacao,
    }));
  }

  async function alternarCurtidaComentarioAnotacaoListas(
    anotacaoId: string,
    comentario: ComentarioAnotacaoListas,
  ) {
    const userId = usuarioAtualId.trim();

    if (!userId) {
      router.push(criarLoginHrefListas());
      return;
    }

    if (!comentario.id || comentarioCurtindoId) return;
    const curtiu = comentario.curtidas.includes(userId);
    setComentarioCurtindoId(comentario.id);

    try {
      if (curtiu) {
        const { error } = await supabase
          .from("diario_comentario_curtidas")
          .delete()
          .eq("comentario_id", comentario.id)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("diario_comentario_curtidas")
          .insert({ comentario_id: comentario.id, user_id: userId });
        if (error) throw error;
      }

      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        comentarios: atual.comentarios.map((itemComentario) =>
          itemComentario.id === comentario.id
            ? {
                ...itemComentario,
                curtidas: curtiu
                  ? itemComentario.curtidas.filter((id) => id !== userId)
                  : Array.from(new Set([...itemComentario.curtidas, userId])),
              }
            : itemComentario,
        ),
        erro: "",
      }));
    } catch (error) {
      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        erro: obterMensagemErroListas(
          error,
          "Não foi possível atualizar a curtida do comentário.",
        ),
      }));
    } finally {
      setComentarioCurtindoId("");
    }
  }

  async function enviarComentarioAnotacaoListas(item: ItemObraLista) {
    const anotacaoId = item.anotacaoId?.trim() || "";
    const userId = usuarioAtualId.trim();

    if (!anotacaoId) return;

    const permissoes = obterPermissoesAnotacaoListas(item);

    if (!permissoes.podeComentar) {
      setMensagemAcao("Você não tem permissão para comentar nesta anotação.");
      return;
    }

    if (!userId) {
      router.push(criarLoginHrefListas());
      return;
    }

    const interacao =
      interacoesAnotacoes[anotacaoId] || criarInteracaoAnotacaoListasVazia();
    const textoComentario = interacao.novoComentario.trim();

    if (!textoComentario) {
      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        erro: "Escreva um comentário antes de enviar.",
      }));
      return;
    }

    if (interacao.enviandoComentario) return;

    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      enviandoComentario: true,
      erro: "",
    }));

    try {
      const { data, error } = await supabase
        .from("diario_anotacao_comentarios")
        .insert({
          anotacao_id: anotacaoId,
          user_id: userId,
          texto: textoComentario.slice(0, DIARIO_COMENTARIO_MAX_LENGTH),
          parent_id: interacao.respondendoComentarioId || null,
        })
        .select(
          "id,anotacao_id,user_id,texto,parent_id,criado_em,atualizado_em",
        )
        .maybeSingle();

      if (error) throw error;

      const registro = data;
      const comentario: ComentarioAnotacaoListas = {
        id: pegarTexto(registro?.id),
        anotacaoId,
        userId,
        autorNome: usuarioAtualPerfil?.nome || "Você",
        autorUsername: usuarioAtualPerfil?.username || "",
        autorAvatar: usuarioAtualPerfil?.avatar || "",
        texto: pegarTexto(registro?.texto, textoComentario),
        criadoEm: pegarTexto(registro?.criado_em, new Date().toISOString()),
        atualizadoEm: pegarTexto(
          registro?.atualizado_em ?? registro?.criado_em,
          new Date().toISOString(),
        ),
        parentId: pegarTexto(
          registro?.parent_id,
          interacao.respondendoComentarioId,
        ),
        curtidas: [],
      };

      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        comentarios: comentario.id
          ? [...atual.comentarios, comentario]
          : atual.comentarios,
        novoComentario: "",
        respondendoComentarioId: "",
        respondendoAutorNome: "",
        enviandoComentario: false,
      }));

      if (comentario.parentId) {
        setRespostasVisiveisComentariosDiario((atuais) => ({
          ...atuais,
          [comentario.parentId]: Math.max(
            5,
            atuais[comentario.parentId] || 0,
          ),
        }));
      }
    } catch (error) {
      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        enviandoComentario: false,
        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível enviar o comentário.",
      }));
    }
  }

  async function removerComentarioAnotacaoListas(
    item: ItemObraLista,
    comentario: ComentarioAnotacaoListas,
  ) {
    const anotacaoId = item.anotacaoId?.trim() || "";

    if (
      !anotacaoId ||
      !comentario.id ||
      comentario.userId !== usuarioAtualId ||
      !window.confirm("Remover este comentário?")
    ) {
      return;
    }

    setComentarioRemovendoId(comentario.id);

    try {
      const { error } = await supabase
        .from("diario_anotacao_comentarios")
        .delete()
        .eq("id", comentario.id)
        .eq("user_id", usuarioAtualId);

      if (error) throw error;

      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        comentarios: atual.comentarios.filter(
          (itemComentario) =>
            itemComentario.id !== comentario.id &&
            itemComentario.parentId !== comentario.id,
        ),
        respondendoComentarioId:
          atual.respondendoComentarioId === comentario.id
            ? ""
            : atual.respondendoComentarioId,
        respondendoAutorNome:
          atual.respondendoComentarioId === comentario.id
            ? ""
            : atual.respondendoAutorNome,
        erro: "",
      }));
    } catch (error) {
      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        erro: obterMensagemErroListas(
          error,
          "Não foi possível remover o comentário.",
        ),
      }));
    } finally {
      setComentarioRemovendoId("");
    }
  }



  function abrirComentariosDiario(item: ItemObraLista) {
    const anotacaoId = item.anotacaoId?.trim() || "";

    if (!anotacaoId) {
      return;
    }

    const permissoes = obterPermissoesAnotacaoListas(item);

    if (!permissoes.podeVerComentarios) {
      setMensagemAcao("Os comentários desta anotação não estão disponíveis.");
      return;
    }

    comentariosDragOffsetYRef.current = 0;
    comentariosDragIgnorarCliqueRef.current = false;
    setComentariosDiarioItem(item);
    setComentariosDiarioExpandido(false);
    setMenuOrdenacaoComentariosDiarioAberto(false);
    setRespostasVisiveisComentariosDiario({});
  }

  function fecharComentariosDiario() {
    setComentariosDiarioItem(null);
    setComentariosDiarioExpandido(false);
    setMenuOrdenacaoComentariosDiarioAberto(false);
    comentariosDragOffsetYRef.current = 0;
  }

  function iniciarArrasteComentariosDiario(
    event: TouchEvent<HTMLDivElement>,
  ) {
    if (isDesktop) {
      return;
    }

    comentariosDragStartYRef.current = event.touches[0]?.clientY || 0;
    comentariosDragOffsetYRef.current = 0;
    comentariosDragIgnorarCliqueRef.current = false;

    if (comentariosDragResetTimerRef.current !== null) {
      window.clearTimeout(comentariosDragResetTimerRef.current);
      comentariosDragResetTimerRef.current = null;
    }

    if (comentariosSheetRef.current) {
      comentariosSheetRef.current.style.transition = "none";
    }
  }

  function moverArrasteComentariosDiario(
    event: TouchEvent<HTMLDivElement>,
  ) {
    if (isDesktop) {
      return;
    }

    const posicaoAtual =
      event.touches[0]?.clientY || comentariosDragStartYRef.current;
    const limiteSuperior = comentariosDiarioExpandido ? -46 : -58;
    const limiteInferior = comentariosDiarioExpandido ? 112 : 132;
    const deslocamento = Math.max(
      limiteSuperior,
      Math.min(
        limiteInferior,
        posicaoAtual - comentariosDragStartYRef.current,
      ),
    );

    comentariosDragOffsetYRef.current = deslocamento;

    if (Math.abs(deslocamento) > 6) {
      comentariosDragIgnorarCliqueRef.current = true;
    }

    const handle = comentariosSheetRef.current?.querySelector(
      "[data-comments-sheet-handle='true']",
    ) as HTMLElement | null;

    if (handle) {
      handle.style.transform = `translate3d(0, ${deslocamento}px, 0)`;
    }
  }

  function finalizarArrasteComentariosDiario() {
    if (isDesktop) {
      return;
    }

    const deslocamento = comentariosDragOffsetYRef.current;

    if (comentariosSheetRef.current) {
      comentariosSheetRef.current.style.transition = "height 220ms ease";
    }

    const handle = comentariosSheetRef.current?.querySelector(
      "[data-comments-sheet-handle='true']",
    ) as HTMLElement | null;

    if (handle) {
      handle.style.transition = "transform 160ms ease";
      handle.style.transform = "";
    }

    if (comentariosDragIgnorarCliqueRef.current) {
      comentariosDragResetTimerRef.current = window.setTimeout(() => {
        comentariosDragIgnorarCliqueRef.current = false;
        comentariosDragResetTimerRef.current = null;
      }, 350);
    }

    if (deslocamento < -34) {
      setComentariosDiarioExpandido(true);
      return;
    }

    if (deslocamento > 52 && comentariosDiarioExpandido) {
      setComentariosDiarioExpandido(false);
      return;
    }

    if (deslocamento > 118 && !comentariosDiarioExpandido) {
      fecharComentariosDiario();
    }
  }

  function alternarExpansaoComentariosDiario() {
    if (isDesktop || comentariosDragIgnorarCliqueRef.current) {
      return;
    }

    setComentariosDiarioExpandido((expandido) => !expandido);
  }

  function inserirNoComentarioDiario(texto: string) {
    const anotacaoId = comentariosDiarioItem?.anotacaoId?.trim() || "";

    if (!anotacaoId) {
      return;
    }

    const interacao =
      interacoesAnotacoes[anotacaoId] || criarInteracaoAnotacaoListasVazia();
    const separador = interacao.novoComentario && texto !== "@" ? " " : "";

    atualizarComentarioAnotacaoListas(
      anotacaoId,
      `${interacao.novoComentario}${separador}${texto}`,
    );
  }

  function renderizarItemObra(
    item: ItemObraLista,
    categoriaAtual: CategoriaPerfil,
  ) {
    const obra = item.obra;
    const detalheVisivel =
      categoriaAtual === "avaliacoes"
        ? <ListasRatingDetail nota={item.nota} data={item.data} />
        : categoriaAtual === "tudo"
          ? formatarLeituraMesAno(item.ultimaLeituraEm || "")
          : textoSecundarioItem(item, categoriaAtual);
    const anotacaoId = item.anotacaoId?.trim() || "";
    const chaveAnotacao = anotacaoId || obra.id;
    const anotacaoAberta = Boolean(anotacoesAbertas[chaveAnotacao]);
    const spoilerRevelado = Boolean(
      anotacoesSpoilerReveladas[chaveAnotacao],
    );

    function alternarExibicaoAnotacao() {
      const proximoEstado = !anotacaoAberta;

      setAnotacoesAbertas((atuais) => ({
        ...atuais,
        [chaveAnotacao]: proximoEstado,
      }));

      if (!proximoEstado) {
        setAnotacoesSpoilerReveladas((atuais) => ({
          ...atuais,
          [chaveAnotacao]: false,
        }));
      }
    }
    const interacao = anotacaoId
      ? interacoesAnotacoes[anotacaoId] ||
        criarInteracaoAnotacaoListasVazia()
      : criarInteracaoAnotacaoListasVazia();
    const permissoesAnotacao = obterPermissoesAnotacaoListas(item);
    return (
      <ListasProfileWorkRow
        key={item.chave}
        annotation={
          item.anotacao && anotacaoAberta ? (
            <ListasDiaryAnnotationCard
                annotation={item.anotacao}
                annotationId={anotacaoId}
                authorName={perfil?.nome || "usuário"}
                canLike={permissoesAnotacao.podeCurtirAnotacao}
                canSeeComments={permissoesAnotacao.podeVerComentarios}
                commentAriaLabel={`Abrir ${interacao.comentarios.length} ${
                  interacao.comentarios.length === 1
                    ? "comentário"
                    : "comentários"
                } da anotação`}
                commentCount={compactarNumero(interacao.comentarios.length)}
                containsSpoiler={Boolean(item.anotacaoSpoiler)}
                isLiked={interacao.curtiu}
                isSavingLike={interacao.salvandoCurtida}
                likeAriaLabel={`${
                  interacao.curtiu
                    ? "Remover curtida da anotação"
                    : "Curtir anotação"
                }. ${compactarNumero(interacao.totalCurtidas)} ${
                  interacao.totalCurtidas === 1 ? "curtida" : "curtidas"
                }`}
                likeCount={compactarNumero(interacao.totalCurtidas)}
                onLike={() => void alternarCurtidaAnotacaoListas(item)}
                onOpenComments={() => abrirComentariosDiario(item)}
                onSetSpoilerRevealed={(revelado) =>
                  setAnotacoesSpoilerReveladas((atuais) => ({
                    ...atuais,
                    [chaveAnotacao]: revelado,
                  }))
                }
                spoilerRevealed={spoilerRevelado}
                styles={{
                  annotation: listDiaryCardAnnotationStyle,
                  annotationCommentButton: listDiaryCardAnnotationCommentButtonStyle,
                  annotationCommentCount: listDiaryCardAnnotationCommentCountStyle,
                  annotationCommentIcon: listDiaryCardAnnotationCommentIconStyle,
                  annotationHeader: listDiaryCardAnnotationHeaderStyle,
                  annotationHeaderActions: listDiaryCardAnnotationHeaderActionsStyle,
                  annotationLikeButton: listDiaryCardAnnotationLikeButtonStyle,
                  annotationLikeCount: listDiaryCardAnnotationLikeCountStyle,
                  annotationLikeIcon: listDiaryCardAnnotationLikeIconStyle,
                  annotationText: listDiaryCardAnnotationTextStyle,
                  annotationTitle: listDiaryCardAnnotationTitleStyle,
                  annotationTitleGroup: listDiaryCardAnnotationTitleGroupStyle,
                  spoiler: listDiaryCardSpoilerStyle,
                  spoilerButton: listDiaryCardSpoilerButtonStyle,
                  spoilerText: listDiaryCardSpoilerTextStyle,
                }}
              workId={obra.id}
            />
          ) : null
        }
        annotationOpen={anotacaoAberta}
        autor={obra.autor}
        className={`historietas-list-row${
          obraDestacadaId === obra.id
            ? " historietas-list-row-highlight"
            : ""
        }`}
        coverStyle={criarCapaStyle(obra.capa)}
        detalhe={detalheVisivel}
        genero={obra.genero}
        hasAnnotation={Boolean(item.anotacao)}
        href={obra.link}
        notaFormatada={formatarNotaListas(item.nota)}
        onOpenOptions={() => void abrirMenuObra(obra, item, categoriaAtual)}
        onToggleAnnotation={alternarExibicaoAnotacao}
        showRating={item.nota > 0 && categoriaAtual !== "avaliacoes"}
        styles={{
          detail: rowDetailStyle,
          mainLink: rowMainLinkStyle,
          meta: rowMetaStyle,
          moreDot: moreDotStyle,
          moreOptions: moreOptionsStyle,
          optionsButton: rowOptionsButtonStyle,
          ratingSignal: rowRatingSignalStyle,
          ratingSignalStar: rowRatingSignalStarStyle,
          signal: rowSignalStyle,
          signalAnnotationToggle: rowSignalAnnotationToggleStyle,
          signals: rowSignalsStyle,
          text: rowTextStyle,
          title: rowTitleStyle,
        }}
        titulo={obra.titulo}
        workId={obra.id}
      />
    );
  }


  function renderizarComentariosDiarioSheet() {
    const item = comentariosDiarioItem;

    if (!item || typeof document === "undefined") {
      return null;
    }

    const itemSelecionado = item;
    const anotacaoId = itemSelecionado.anotacaoId?.trim() || "";

    if (!anotacaoId) {
      return null;
    }

    const interacao =
      interacoesAnotacoes[anotacaoId] || criarInteracaoAnotacaoListasVazia();
    const permissoes = obterPermissoesAnotacaoListas(itemSelecionado);
    const comentariosRaiz = ordenarComentariosRaizDiarioListas(
      interacao.comentarios,
      interacao.ordenacaoComentarios,
    );

    const commentStyles: ListasDiaryCommentStyles = {
      actionsRow: commentActionsRowStyle,
      authorLink: commentAuthorLinkStyle,
      content: commentContentStyle,
      heartIcon: commentHeartIconStyle,
      item: commentItemStyle,
      likeButton: commentLikeButtonStyle,
      likeCount: commentLikeCountStyle,
      likeWrap: commentLikeWrapStyle,
      removeButton: commentRemoveButtonStyle,
      replyButton: commentReplyButtonStyle,
      replyItem: commentReplyItemStyle,
      reportButton: commentReportButtonStyle,
      text: commentTextStyle,
      time: commentTimeStyle,
      topLine: commentTopLineStyle,
    };
    const threadStyles: ListasDiaryCommentThreadStyles = {
      controls: commentRepliesControlsStyle,
      hideButton: commentRepliesHideButtonStyle,
      line: commentRepliesLineStyle,
      repliesList: commentRepliesListStyle,
      thread: commentThreadStyle,
      toggle: commentRepliesToggleStyle,
    };
    const sheetStyles: ListasDiaryCommentsSheetStyles = {
      backdrop: commentsSheetBackdropStyle,
      compact: commentsSheetCompactStyle,
      desktop: desktopCommentsSheetStyle,
      empty: emptyCommentsStyle,
      error: commentsSheetErrorStyle,
      expanded: commentsSheetExpandedStyle,
      form: commentsSheetFormStyle,
      handle: commentsSheetHandleStyle,
      handleWrap: commentsSheetHandleWrapStyle,
      header: commentsSheetHeaderStyle,
      headerSpacer: commentsSheetHeaderSpacerStyle,
      input: commentsSheetInputStyle,
      inputBox: commentsInputBoxStyle,
      inputIconButton: commentsInputIconButtonStyle,
      list: commentsSheetListStyle,
      loading: commentsLoadingStyle,
      overlay: commentsSheetOverlayStyle,
      panel: commentsSheetStyle,
      quickReactionButton: commentsQuickReactionButtonStyle,
      quickReactions: commentsQuickReactionsStyle,
      replyingBanner: commentsReplyingBannerStyle,
      replyingCancel: commentsReplyingCancelStyle,
      send: commentsSheetSendStyle,
      sortMenu: commentsSortMenuStyle,
      sortMenuDivider: commentsSortMenuDividerStyle,
      sortMenuItem: commentsSortMenuItemStyle,
      sortMenuItemActive: commentsSortMenuItemActiveStyle,
      sortMenuTrigger: commentsSortMenuTriggerStyle,
      sortMenuWrap: commentsSortMenuWrapStyle,
      title: commentsSheetTitleStyle,
      tools: commentsToolsStyle,
    };

    function renderizarComentarioSheet(
      comentario: ComentarioAnotacaoListas,
      resposta = false,
    ) {
      const comentarioEhProprio =
        Boolean(usuarioAtualId) && comentario.userId === usuarioAtualId;
      const comentarioCurtiu = Boolean(
        usuarioAtualId && comentario.curtidas.includes(usuarioAtualId),
      );
      const hrefPerfil = idUsuarioValido(comentario.userId)
        ? `/perfil-autor?autorId=${encodeURIComponent(comentario.userId)}`
        : "/perfil-autor";
      const carregandoCurtida = comentarioCurtindoId === comentario.id;
      const removendoComentario = comentarioRemovendoId === comentario.id;
      const avatarBaseStyle = resposta
        ? commentReplyAvatarLinkStyle
        : commentAvatarLinkStyle;

      return (
        <ListasDiaryComment
          key={comentario.id}
          avatarContent={
            !comentario.autorAvatar &&
            (comentario.autorNome.slice(0, 1).toUpperCase() || "U")
          }
          avatarStyle={criarAvatarComentarioDiarioListasStyle(
            avatarBaseStyle,
            comentario.autorAvatar,
          )}
          carregandoCurtida={carregandoCurtida}
          comentario={comentario}
          comentarioCurtiu={comentarioCurtiu}
          comentarioEhProprio={comentarioEhProprio}
          formatarData={formatarDataCurta}
          hrefPerfil={hrefPerfil}
          onLike={() =>
            void alternarCurtidaComentarioAnotacaoListas(
              anotacaoId,
              comentario,
            )
          }
          onRemove={() =>
            void removerComentarioAnotacaoListas(itemSelecionado, comentario)
          }
          onReply={() =>
            iniciarRespostaComentarioAnotacaoListas(anotacaoId, comentario)
          }
          onReport={() =>
            abrirDenunciaDiario(
              "comentario_diario",
              comentario.id,
              `Comentário de ${comentario.autorNome} em ${itemSelecionado.obra.titulo}`,
              comentario.userId,
            )
          }
          podeResponder={permissoes.podeComentar}
          removendoComentario={removendoComentario}
          resposta={resposta}
          styles={commentStyles}
        />
      );
    }

    function renderizarThreadComentarioSheet(
      comentario: ComentarioAnotacaoListas,
    ) {
      const respostas = obterRespostasComentarioDiarioListas(
        interacao.comentarios,
        comentario.id,
      );
      const quantidadeVisivel = Math.min(
        respostas.length,
        respostasVisiveisComentariosDiario[comentario.id] || 0,
      );
      const respostasVisiveis = respostas.slice(0, quantidadeVisivel);
      const respostasOcultas = Math.max(
        0,
        respostas.length - quantidadeVisivel,
      );
      const respostasExpandidas = quantidadeVisivel > 0;

      return (
        <ListasDiaryCommentThread
          key={comentario.id}
          comentario={renderizarComentarioSheet(comentario)}
          onCollapseReplies={() =>
            setRespostasVisiveisComentariosDiario((atuais) => ({
              ...atuais,
              [comentario.id]: 0,
            }))
          }
          onExpandReplies={() =>
            setRespostasVisiveisComentariosDiario((atuais) => ({
              ...atuais,
              [comentario.id]: Math.min(5, respostas.length),
            }))
          }
          onShowMoreReplies={() =>
            setRespostasVisiveisComentariosDiario((atuais) => ({
              ...atuais,
              [comentario.id]: Math.min(
                respostas.length,
                (atuais[comentario.id] || 0) + 5,
              ),
            }))
          }
          quantidadeRespostas={respostas.length}
          quantidadeRespostasOcultas={respostasOcultas}
          respostas={respostasVisiveis.map((resposta) =>
            renderizarComentarioSheet(resposta, true),
          )}
          respostasExpandidas={respostasExpandidas}
          styles={threadStyles}
        />
      );
    }

    return (
      <ListasDiaryCommentsSheet
        ariaLabelTextarea={
          permissoes.podeComentar
            ? interacao.respondendoComentarioId
              ? "Adicionar resposta"
              : "Adicionar comentário"
            : "Comentários limitados pelo dono do Diário"
        }
        avatar={
          <div
            style={criarAvatarComentarioDiarioListasStyle(
              commentsInputAvatarStyle,
              permissoes.podeComentar ? usuarioAtualPerfil?.avatar || "" : "",
            )}
          >
            {!(permissoes.podeComentar && usuarioAtualPerfil?.avatar) &&
              (permissoes.podeComentar
                ? usuarioAtualPerfil?.nome || "U"
                : "H"
              )
                .slice(0, 1)
                .toUpperCase()}
          </div>
        }
        comentario={interacao.novoComentario}
        comentarioEmEnvio={interacao.enviandoComentario}
        comentarios={comentariosRaiz.map(renderizarThreadComentarioSheet)}
        comentariosCarregando={interacao.carregando}
        comentariosErro={interacao.erro}
        comentariosExpandido={comentariosDiarioExpandido}
        comentariosTemPermissao={permissoes.podeComentar}
        comentariosTemRaiz={comentariosRaiz.length > 0}
        comentariosTotal={interacao.comentarios.length}
        isDesktop={isDesktop}
        maxLength={DIARIO_COMENTARIO_MAX_LENGTH}
        menuOrdenacaoAberto={menuOrdenacaoComentariosDiarioAberto}
        onCancelReply={() =>
          cancelarRespostaComentarioAnotacaoListas(anotacaoId)
        }
        onChangeComentario={(texto) =>
          atualizarComentarioAnotacaoListas(anotacaoId, texto)
        }
        onClose={fecharComentariosDiario}
        onHandleKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            alternarExpansaoComentariosDiario();
          }
        }}
        onHandleTouchCancel={finalizarArrasteComentariosDiario}
        onHandleTouchEnd={finalizarArrasteComentariosDiario}
        onHandleTouchMove={moverArrasteComentariosDiario}
        onHandleTouchStart={iniciarArrasteComentariosDiario}
        onInsertReaction={inserirNoComentarioDiario}
        onSelectOrdenacao={(ordenacao) => {
          alterarOrdenacaoComentariosAnotacaoListas(anotacaoId, ordenacao);
          setMenuOrdenacaoComentariosDiarioAberto(false);
        }}
        onSubmit={(event) => {
          event.preventDefault();
          void enviarComentarioAnotacaoListas(itemSelecionado);
        }}
        onToggleExpand={alternarExpansaoComentariosDiario}
        onToggleOrdenacao={() =>
          setMenuOrdenacaoComentariosDiarioAberto((aberto) => !aberto)
        }
        ordenacao={interacao.ordenacaoComentarios}
        placeholderTextarea={
          permissoes.podeComentar
            ? interacao.respondendoComentarioId
              ? "Adicionar resposta..."
              : "Adicionar comentário..."
            : "Comentários limitados pelo dono do Diário."
        }
        quickReactions={["💜", "🔥", "😂", "😮", "😭", "👏"]}
        respondendoAutorNome={interacao.respondendoAutorNome}
        respondendoComentarioId={interacao.respondendoComentarioId}
        sheetRef={comentariosSheetRef}
        styles={sheetStyles}
        tituloObra={itemSelecionado.obra.titulo}
      />
    );
  }


  function renderizarObraPublica(obra: ObraLista) {
    return (
      <ListasPublicWorkRow
        key={obra.id}
        coverStyle={criarCapaStyle(obra.capa)}
        genero={obra.genero}
        href={obra.link}
        onOpenOptions={() => void abrirMenuObra(obra, null, "tudo")}
        styles={{
          mainLink: rowMainLinkStyle,
          meta: rowMetaStyle,
          moreDot: moreDotStyle,
          moreOptions: moreOptionsStyle,
          optionsButton: rowOptionsButtonStyle,
          text: rowTextStyle,
          title: rowTitleStyle,
        }}
        titulo={obra.titulo}
      />
    );
  }

  function renderizarAutor(autor: AutorLista) {
    const href = idUsuarioValido(autor.id)
      ? `/perfil-autor?autorId=${encodeURIComponent(autor.id)}`
      : `/perfil-autor?autor=${encodeURIComponent(autor.nome)}`;

    return (
      <ListasAuthorRow
        key={autor.id || autor.nome}
        avatar={autor.avatar}
        avatarStyle={criarAvatarStyle(autor.avatar)}
        href={href}
        nome={autor.nome}
        styles={{
          authorLink: rowAuthorLinkStyle,
          meta: rowMetaStyle,
          text: rowTextStyle,
          title: rowTitleStyle,
        }}
        totalObras={autor.totalObras}
        username={autor.username}
      />
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${listasPageCss}`}</style>


      <ListasPageHeader
        avaliacaoDiario={avaliacaoDiario}
        criarAvatarStyle={criarAvatarPerfilDiarioListasStyle}
        formatarNota={formatarNotaListas}
        headerInnerStyle={headerInnerStyle}
        headerStyle={headerStyle}
        isDiaryProfile={modo === "perfil" && origemPerfil === "diario"}
        listDiaryHeaderRatingBoxStyle={listDiaryHeaderRatingBoxStyle}
        listDiaryHeaderRatingStarActiveStyle={listDiaryHeaderRatingStarActiveStyle}
        listDiaryHeaderRatingStarBaseStyle={listDiaryHeaderRatingStarBaseStyle}
        listDiaryHeaderRatingStarButtonStyle={listDiaryHeaderRatingStarButtonStyle}
        listDiaryHeaderRatingStarFillStyle={listDiaryHeaderRatingStarFillStyle}
        listDiaryHeaderRatingStarVisualStyle={listDiaryHeaderRatingStarVisualStyle}
        listDiaryHeaderRatingStarsRowStyle={listDiaryHeaderRatingStarsRowStyle}
        listDiaryProfileHeaderStyle={listDiaryProfileHeaderStyle}
        listDiaryProfileHeaderTopStyle={listDiaryProfileHeaderTopStyle}
        listDiaryProfileTitleAreaStyle={listDiaryProfileTitleAreaStyle}
        listDiaryProfileTitleStyle={listDiaryProfileTitleStyle}
        listDiaryRatingNumberStyle={listDiaryRatingNumberStyle}
        listDiaryRatingSummaryStarBaseStyle={listDiaryRatingSummaryStarBaseStyle}
        listDiaryRatingSummaryStarFillStyle={listDiaryRatingSummaryStarFillStyle}
        listDiaryRatingSummaryStarVisualStyle={listDiaryRatingSummaryStarVisualStyle}
        listDiaryRatingSummaryStarsStyle={listDiaryRatingSummaryStarsStyle}
        listDiaryRatingSummaryStyle={listDiaryRatingSummaryStyle}
        listDiaryRatingTotalStyle={listDiaryRatingTotalStyle}
        notasAvaliacao={NOTAS_AVALIACAO_LISTAS}
        obterPreenchimentoEstrela={obterPreenchimentoEstrelaListas}
        obterProximaNota={obterProximaNotaAvaliacaoListas}
        onAvaliarDiario={(nota) => void salvarAvaliacaoDiarioPerfil(nota)}
        pageTitleStyle={pageTitleStyle}
        perfil={perfil}
        perfilEhProprio={perfilEhProprio}
        tituloPagina={tituloPagina}
      />

      {mensagemAcao && (
        <div role="status" style={actionMessageStyle}>
          {mensagemAcao}
        </div>
      )}

      <ListasProfileCategoryControls
        bloqueado={bloqueado}
        categoriaAtiva={categoria}
        categorias={CATEGORIAS_PERFIL}
        contagens={listasPerfil}
        controlsStyle={controlesCategoriasPerfilAtualStyle}
        modo={modo}
        onTrocarCategoria={trocarCategoria}
        tabActiveStyle={tabActiveStyle}
        tabCountStyle={tabCountStyle}
        tabStyle={tabStyle}
        tabsStyle={abasCategoriasPerfilAtualStyle}
      />

      <ListasResultsSection
        agruparPorMes={agruparPorMes}
        autoresVisiveis={autoresVisiveis}
        bloqueado={bloqueado}
        erro={erro}
        gruposPerfil={gruposPerfil}
        hasMore={quantidadeVisivel < totalResultados}
        itensPerfilVisiveis={itensPerfilVisiveis}
        listSectionStyle={secaoResultadosAtualStyle}
        loadMoreButtonStyle={loadMoreButtonStyle}
        carregando={carregando}
        modo={modo}
        monthGroupStyle={monthGroupStyle}
        monthTitleStyle={monthTitleStyle}
        obrasVisiveis={obrasVisiveis}
        onCarregarMais={() =>
          setQuantidadeVisivel((quantidade) => quantidade + 40)
        }
        renderizarAutor={renderizarAutor}
        renderizarItemPerfil={(item) => renderizarItemObra(item, categoria)}
        renderizarObraPublica={renderizarObraPublica}
        rowsStyle={rowsStyle}
        stateIconStyle={stateIconStyle}
        stateLinkStyle={stateLinkStyle}
        stateStyle={stateStyle}
        stateTextStyle={stateTextStyle}
        totalResultados={totalResultados}
        worksRowsStyle={linhasObrasAtualStyle}
      />

      <footer style={footerStyle}>
        <span>Historietas</span>
      </footer>

      <ListasDiaryReportModal
        alvo={alvoDenunciaDiario}
        onClose={() => setAlvoDenunciaDiario(null)}
        onSent={() => {
          setAlvoDenunciaDiario(null);
          setMensagemAcao("Denúncia enviada para análise.");
        }}
      />

      {obraMenuAberta && (
        <ListasWorkActionSheet
          detalhe={
            itemPerfilMenuAberto
              ? textoSecundarioItem(itemPerfilMenuAberto, categoriaMenuAberta)
              : ""
          }
          editor={editorAnotacao}
          editorStyles={{
            cancel: listDiaryAnnotationCancelStyle,
            counter: listDiaryAnnotationCounterStyle,
            editor: listDiaryActionSheetEditorStyle,
            editorMeta: listDiaryAnnotationEditorMetaStyle,
            error: listDiaryAnnotationErrorStyle,
            metaActions: listDiaryAnnotationMetaActionsStyle,
            remove: listDiaryAnnotationRemoveStyle,
            save: listDiaryAnnotationSaveStyle,
            spoilerCheckbox: listDiaryAnnotationSpoilerCheckboxStyle,
            spoilerLabel: listDiaryAnnotationSpoilerLabelStyle,
            textarea: listDiaryAnnotationTextareaStyle,
            textareaWrap: listDiaryAnnotationTextareaWrapStyle,
          }}
          hrefPrincipal={
            itemPerfilMenuAberto
              ? obterHrefContinuarLeituraListas(itemPerfilMenuAberto)
              : obraMenuAberta.link
          }
          item={itemPerfilMenuAberto}
          maxAnnotationLength={DIARIO_ANOTACAO_MAX_LENGTH}
          onCancelAnnotation={() => setEditorAnotacao(EDITOR_ANOTACAO_LISTAS_VAZIO)}
          onClose={fecharMenuObra}
          onEditAnnotation={abrirEditorAnotacaoListas}
          onRemoveAnnotation={() => void removerAnotacaoListas()}
          onReportAnnotation={() => {
            const anotacaoId = itemPerfilMenuAberto?.anotacaoId?.trim() || "";

            if (!anotacaoId) {
              return;
            }

            setObraMenuAberta(null);
            setItemPerfilMenuAberto(null);
            setObraMenuNoQueroLer(false);
            abrirDenunciaDiario(
              "diario_anotacao",
              anotacaoId,
              `Anotação de ${perfil?.nome || "usuário"} em ${obraMenuAberta.titulo}`,
              perfil?.userId || "",
            );
          }}
          onSaveAnnotation={() => void salvarAnotacaoListas()}
          onShare={() => void compartilharObraDoMenu()}
          onToggleWantToRead={() => void alternarObraNoQueroLer()}
          obra={obraMenuAberta}
          perfilEhProprio={perfilEhProprio}
          podeContinuar={Boolean(
            itemPerfilMenuAberto && itemPerfilMenuAberto.progresso > 0,
          )}
          queroLer={obraMenuNoQueroLer}
          salvandoQueroLer={salvandoQueroLer}
          setEditor={setEditorAnotacao}
          styles={{
            actions: actionSheetActionsStyle,
            button: actionSheetButtonStyle,
            buttonDisabled: actionSheetButtonDisabledStyle,
            buttonIcon: actionSheetButtonIconStyle,
            detail: actionSheetDetailStyle,
            handle: actionSheetHandleStyle,
            header: actionSheetHeaderStyle,
            meta: actionSheetMetaStyle,
            overlay: actionSheetOverlayStyle,
            panel: actionSheetStyle,
            report: listDiaryActionSheetReportStyle,
            selection: actionSheetSelectionDotStyle,
            selectionActive: actionSheetSelectionDotActiveStyle,
            title: actionSheetTitleStyle,
          }}
        />
      )}

      {renderizarComentariosDiarioSheet()}
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

const listDiaryControlsStyle: CSSProperties = {
  ...controlsStyle,
  padding: "5px 14px 8px",
};

const desktopControlsStyle: CSSProperties = {
  ...controlsStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "12px 0 10px",
};

const desktopListDiaryControlsStyle: CSSProperties = {
  ...desktopControlsStyle,
  padding: "6px 0 10px",
};

const tabsStyle: CSSProperties = {
  display: "flex",
  gap: "7px",
  overflowX: "auto",
  scrollbarWidth: "none",
  paddingBottom: "2px",
};

const desktopTabsStyle: CSSProperties = {
  ...tabsStyle,
  width: "100%",
  justifyContent: "center",
  alignItems: "center",
  flexWrap: "wrap",
  overflowX: "visible",
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

const desktopListSectionStyle: CSSProperties = {
  ...listSectionStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: 0,
};

const rowsStyle: CSSProperties = {};

const desktopWorksRowsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  columnGap: "22px",
  rowGap: "8px",
  alignItems: "start",
  minWidth: 0,
};

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
  maxHeight: "calc(100dvh - 72px)",
  overflowY: "auto",
  borderRadius: "24px 24px 0 0",
  background: "#000000",
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

const actionSheetDetailStyle: CSSProperties = {
  maxWidth: "100%",
  color: "rgba(255,255,255,0.72)",
  fontSize: "11px",
  fontWeight: 750,
  lineHeight: 1.3,
  textAlign: "center",
  overflowWrap: "anywhere",
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
  textDecoration: "none",
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


const actionMessageStyle: CSSProperties = {
  position: "sticky",
  top: "10px",
  zIndex: 40,
  width: "fit-content",
  maxWidth: "calc(100% - 28px)",
  margin: "8px auto 0",
  padding: "10px 14px",
  borderRadius: "999px",
  background: "#FFFFFF",
  color: "#090909",
  fontSize: "12px",
  fontWeight: 900,
  boxShadow: "0 10px 30px rgba(0,0,0,0.32)",
};

const rowSignalsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "nowrap",
  gap: "5px",
  marginTop: "3px",
  minWidth: 0,
};

const rowSignalStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "18px",
  padding: "2px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.09)",
  color: "rgba(255,255,255,0.78)",
  fontSize: "9px",
  fontWeight: 850,
  lineHeight: 1,
};

const rowRatingSignalStyle: CSSProperties = {
  ...rowSignalStyle,
  gap: "3px",
  position: "relative",
  top: 0,
  flex: "0 0 auto",
};

const rowRatingSignalStarStyle: CSSProperties = {
  display: "inline-block",
  lineHeight: 1,
  transform: "translateY(-0.5px)",
};

const rowSignalAnnotationToggleStyle: CSSProperties = {
  ...rowSignalStyle,
  cursor: "pointer",
  userSelect: "none",
  WebkitUserSelect: "none",
  WebkitTapHighlightColor: "transparent",
};

const listDiaryActionSheetReportStyle: CSSProperties = {
  ...actionSheetButtonStyle,
  color: "var(--historietas-danger-button-text, #FCA5A5)",
};

const listDiaryActionSheetEditorStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  padding: "4px 18px 14px",
  borderBottom: "0",
  boxSizing: "border-box",
};


























const listDiaryAnnotationTextareaWrapStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  minWidth: 0,
  paddingTop: "13px",
};

const listDiaryAnnotationTextareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "78px",
  resize: "vertical",
  padding: "8px 48px 8px 9px",
  borderRadius: "11px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  background: "rgba(255,255,255,0.05)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "9px",
  lineHeight: 1.4,
  fontWeight: 700,
  outline: "none",
  boxSizing: "border-box",
};

const listDiaryAnnotationEditorMetaStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "8px",
  minWidth: 0,
};

const listDiaryAnnotationMetaActionsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: "5px",
  marginLeft: "auto",
};

const listDiaryAnnotationSpoilerLabelStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  minHeight: "27px",
  color: "rgba(255,255,255,0.72)",
  fontSize: "8px",
  fontWeight: 850,
  lineHeight: 1,
  whiteSpace: "nowrap",
  cursor: "pointer",
};

const listDiaryAnnotationSpoilerCheckboxStyle: CSSProperties = {
  width: "13px",
  height: "13px",
  margin: 0,
  accentColor:
    "var(--historietas-accent, var(--historietas-perfil-accent, #FFFFFF))",
  cursor: "pointer",
  flex: "0 0 auto",
};

const listDiaryAnnotationCounterStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  right: "10px",
  zIndex: 1,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7.5px",
  lineHeight: 1,
  fontWeight: 800,
  whiteSpace: "nowrap",
  pointerEvents: "none",
};

const listDiaryAnnotationErrorStyle: CSSProperties = {
  color: "var(--historietas-perfil-rose-soft, #FDA4AF)",
  fontSize: "8px",
  lineHeight: 1.3,
  fontWeight: 800,
  overflowWrap: "anywhere",
};

const listDiaryAnnotationSaveStyle: CSSProperties = {
  minHeight: "27px",
  padding: "5px 9px",
  borderRadius: "999px",
  border: "none",
  background:
    "var(--historietas-accent, var(--historietas-perfil-accent, #FFFFFF))",
  color: "#000000",
  fontSize: "7.8px",
  lineHeight: 1,
  fontWeight: 950,
  cursor: "pointer",
};

const listDiaryAnnotationCancelStyle: CSSProperties = {
  ...listDiaryAnnotationSaveStyle,
  background: "rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

const listDiaryAnnotationRemoveStyle: CSSProperties = {
  ...listDiaryAnnotationSaveStyle,
  background:
    "var(--historietas-perfil-rose-dark-14, rgba(190,18,60,0.14))",
  color: "var(--historietas-perfil-rose-soft, #FDA4AF)",
};

const listDiaryCardAnnotationStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
  boxSizing: "border-box",
};

const listDiaryCardAnnotationHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  minWidth: 0,
};

const listDiaryCardAnnotationTitleStyle: CSSProperties = {
  minWidth: 0,
  color: "rgba(255,255,255,0.82)",
  fontSize: "11px",
  fontWeight: 900,
  lineHeight: 1.25,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const listDiaryCardAnnotationHeaderActionsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  flex: "0 0 auto",
  transform: "translateX(33px)",
};

const listDiaryCardAnnotationLikeButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "5px",
  minHeight: "26px",
  padding: "0 2px",
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  lineHeight: 1,
  flex: "0 0 auto",
};

const listDiaryCardAnnotationLikeIconStyle: CSSProperties = {
  width: "18px",
  height: "18px",
  display: "block",
  flex: "0 0 auto",
  transformOrigin: "center",
};

const listDiaryCardAnnotationLikeCountStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 850,
  lineHeight: 1,
};

const listDiaryCardAnnotationTextStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.88)",
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: 1.5,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

const listDiaryCardSpoilerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "8px",
  minWidth: 0,
  padding: "8px 10px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.05)",
};

const listDiaryCardSpoilerTextStyle: CSSProperties = {
  color: "rgba(255,255,255,0.64)",
  fontSize: "10px",
  fontWeight: 750,
  lineHeight: 1.35,
};

const listDiaryCardSpoilerButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "fit-content",
  minHeight: "26px",
  padding: "4px 8px",
  border: "none",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  fontSize: "9px",
  fontWeight: 900,
  lineHeight: 1,
  cursor: "pointer",
};

const listDiaryCardAnnotationTitleGroupStyle: CSSProperties = {
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  gap: "7px",
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
const listDiaryProfileHeaderStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gap: "8px",
  minWidth: 0,
  boxSizing: "border-box",
};

const listDiaryProfileHeaderTopStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "9px",
  minWidth: 0,
  boxSizing: "border-box",
};

const listDiaryProfileAvatarStyle: CSSProperties = {
  width: "42px",
  maxWidth: "42px",
  height: "42px",
  borderRadius: "11px",
  border: "none",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-input-bg, #18181B)",
  color: "#FFFFFF",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 950,
  overflow: "hidden",
  boxSizing: "border-box",
  flex: "0 0 auto",
};

const listDiaryProfileTitleAreaStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  justifyItems: "start",
  gap: "7px",
  minWidth: 0,
};

const listDiaryProfileTitleStyle: CSSProperties = {
  ...rowTitleStyle,
  width: "100%",
  minWidth: 0,
  margin: 0,
  color: "#FFFFFF",
  fontSize: "clamp(15px, 3vw, 17px)",
  fontWeight: 500,
  letterSpacing: "-0.01em",
  lineHeight: 1.2,
  textAlign: "left",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  display: "block",
  WebkitLineClamp: "unset",
  WebkitBoxOrient: "initial",
};

const listDiaryHeaderRatingBoxStyle: CSSProperties = {
  width: "min(420px, 100%)",
  margin: "0 auto",
  padding: 0,
  display: "grid",
  gap: "8px",
  minWidth: 0,
  boxSizing: "border-box",
};

const listDiaryHeaderRatingStarsRowStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  alignItems: "center",
  gap: "6px",
  minWidth: 0,
  background: "transparent",
  boxShadow: "none",
};

const listDiaryHeaderRatingStarButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-list-diary-rating-muted, rgba(249, 115, 22, 0.34))",
  fontSize: "22px",
  fontWeight: 950,
  lineHeight: 1,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const listDiaryHeaderRatingStarActiveStyle: CSSProperties = {
  ...listDiaryHeaderRatingStarButtonStyle,
  color: "var(--historietas-list-diary-rating, #FFFFFF)",
};

const listDiaryHeaderRatingStarVisualStyle: CSSProperties = {
  position: "relative",
  width: "1em",
  height: "1em",
  display: "inline-block",
  lineHeight: 1,
};

const listDiaryHeaderRatingStarBaseStyle: CSSProperties = {
  color: "var(--historietas-list-diary-rating-muted, rgba(249, 115, 22, 0.34))",
  position: "absolute",
  inset: 0,
  lineHeight: 1,
};

const listDiaryHeaderRatingStarFillStyle: CSSProperties = {
  color: "var(--historietas-list-diary-rating, #FFFFFF)",
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

const listDiaryRatingSummaryStyle: CSSProperties = {
  flex: "0 0 auto",
  width: "fit-content",
  maxWidth: "118px",
  minHeight: "39px",
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  gap: "3px",
  padding: "4px 2px",
  background: "transparent",
  border: "none",
  boxShadow: "none",
  boxSizing: "border-box",
  textAlign: "center",
};

const listDiaryRatingNumberStyle: CSSProperties = {
  color: "var(--historietas-list-diary-rating, #FFFFFF)",
  fontSize: "18.5px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
};

const listDiaryRatingSummaryStarsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  color: "var(--historietas-list-diary-rating, #FFFFFF)",
  fontSize: "10px",
  lineHeight: 1,
  letterSpacing: "-0.02em",
};

const listDiaryRatingSummaryStarVisualStyle: CSSProperties = {
  position: "relative",
  width: "1em",
  height: "1em",
  display: "inline-block",
  lineHeight: 1,
  flex: "0 0 auto",
};

const listDiaryRatingSummaryStarBaseStyle: CSSProperties = {
  color: "var(--historietas-list-diary-rating-muted, rgba(249, 115, 22, 0.34))",
  position: "absolute",
  inset: 0,
  lineHeight: 1,
};

const listDiaryRatingSummaryStarFillStyle: CSSProperties = {
  color: "var(--historietas-list-diary-rating, #FFFFFF)",
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

const listDiaryRatingTotalStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7.8px",
  lineHeight: 1.1,
  fontWeight: 850,
  textTransform: "none",
  letterSpacing: 0,
  textAlign: "center",
  whiteSpace: "nowrap",
};

const listDiaryCardAnnotationCommentButtonStyle: CSSProperties = {
  minWidth: "44px",
  height: "34px",
  borderRadius: "999px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  padding: "0 4px",
  fontFamily: "inherit",
  cursor: "pointer",
};

const listDiaryCardAnnotationCommentIconStyle: CSSProperties = {
  width: "20px",
  height: "20px",
  display: "block",
  flex: "0 0 auto",
};

const listDiaryCardAnnotationCommentCountStyle: CSSProperties = {
  minWidth: "12px",
  color: "rgba(255,255,255,0.92)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  textAlign: "center",
};

const commentsSheetOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 2147483647,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  pointerEvents: "none",
  isolation: "isolate",
};

const commentsSheetBackdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 0,
  border: "none",
  background:
    "color-mix(in srgb, var(--historietas-page-background, #000000) 66%, transparent)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  pointerEvents: "auto",
  cursor: "pointer",
  padding: 0,
};

const commentsSheetStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(720px, 100%)",
  maxHeight: "calc(100dvh - env(safe-area-inset-top) - 10px)",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr) auto auto auto auto",
  gap: "7px",
  padding: "5px 12px calc(10px + env(safe-area-inset-bottom))",
  borderRadius: "28px 28px 0 0",
  background: "var(--historietas-page-background, #000000)",
  border: "none",
  borderBottom: "none",
  boxShadow: "0 -24px 70px rgba(0,0,0,0.72)",
  pointerEvents: "auto",
  overflow: "hidden",
  boxSizing: "border-box",
  willChange: "height",
  transition: "height 220ms ease",
};

const commentsSheetCompactStyle: CSSProperties = {
  height: "min(64dvh, 540px)",
};

const commentsSheetExpandedStyle: CSSProperties = {
  height: "min(90dvh, 760px)",
};

const desktopCommentsSheetStyle: CSSProperties = {
  ...commentsSheetStyle,
  width: "min(800px, calc(100% - 40px))",
  height: "min(76dvh, 720px)",
};

const commentsSheetHandleWrapStyle: CSSProperties = {
  minHeight: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  touchAction: "none",
  cursor: "grab",
  willChange: "transform",
  outline: "none",
};

const commentsSheetHandleStyle: CSSProperties = {
  width: "44px",
  height: "5px",
  borderRadius: "999px",
  background: "var(--historietas-border-soft, rgba(255,255,255,0.34))",
};

const commentsSheetHeaderStyle: CSSProperties = {
  minHeight: "32px",
  display: "grid",
  gridTemplateColumns: "40px minmax(0, 1fr) 40px",
  alignItems: "center",
  gap: "6px",
  minWidth: 0,
};

const commentsSheetHeaderSpacerStyle: CSSProperties = {
  width: "40px",
  height: "1px",
};

const commentsSheetTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14.5px",
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.02em",
};

const commentsSortMenuWrapStyle: CSSProperties = {
  position: "relative",
  width: "40px",
  height: "34px",
  justifySelf: "end",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
};

const commentsSortMenuTriggerStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "27px",
  lineHeight: 1,
  fontWeight: 500,
  fontFamily: "inherit",
  padding: "0 0 2px",
  cursor: "pointer",
};

const commentsSortMenuStyle: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  right: 0,
  zIndex: 12,
  width: "132px",
  maxWidth: "calc(100vw - 24px)",
  display: "grid",
  gap: 0,
  padding: "4px 8px",
  boxSizing: "border-box",
  borderRadius: "12px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  background:
    "var(--historietas-surface-strong, rgba(18, 12, 30, 0.98))",
  boxShadow: "0 16px 36px rgba(0,0,0,0.48)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
};

const commentsSortMenuItemStyle: CSSProperties = {
  width: "100%",
  minHeight: "36px",
  border: "none",
  borderRadius: 0,
  background: "transparent",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  padding: "0 4px",
  textAlign: "center",
  fontSize: "11.5px",
  fontWeight: 850,
  fontFamily: "inherit",
  cursor: "pointer",
};

const commentsSortMenuItemActiveStyle: CSSProperties = {
  ...commentsSortMenuItemStyle,
  color: "#FFFFFF",
};

const commentsSortMenuDividerStyle: CSSProperties = {
  width: "100%",
  height: "1px",
  background: "var(--historietas-border-soft, rgba(255,255,255,0.12))",
};

const commentsSheetListStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: "12px",
  minHeight: 0,
  overflowY: "auto",
  padding: "6px 2px 9px",
  WebkitOverflowScrolling: "touch",
};

const commentThreadStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const commentItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr) 28px",
  gap: "10px",
  alignItems: "start",
  minWidth: 0,
};

const commentRepliesListStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  marginLeft: "34px",
  paddingLeft: "10px",
  borderLeft:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  minWidth: 0,
};

const commentReplyItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "28px minmax(0, 1fr) 28px",
  gap: "8px",
  alignItems: "start",
  minWidth: 0,
};

const commentRepliesToggleStyle: CSSProperties = {
  width: "fit-content",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  marginLeft: "44px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0",
  cursor: "pointer",
};

const commentRepliesControlsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  minWidth: 0,
};

const commentRepliesHideButtonStyle: CSSProperties = {
  width: "fit-content",
  marginLeft: "44px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0",
  cursor: "pointer",
};

const commentRepliesLineStyle: CSSProperties = {
  width: "22px",
  height: "1px",
  background: "var(--historietas-border-soft, rgba(255,255,255,0.22))",
};

const commentAvatarLinkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-page-background, #000000)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #FFFFFF) 30%, transparent)",
  color: "#FFFFFF",
  fontSize: "12.5px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  textDecoration: "none",
  boxShadow: "none",
  flex: "0 0 auto",
  overflow: "hidden",
  boxSizing: "border-box",
  cursor: "pointer",
};

const commentReplyAvatarLinkStyle: CSSProperties = {
  ...commentAvatarLinkStyle,
  width: "28px",
  height: "28px",
  borderRadius: "10px",
  fontSize: "10.5px",
};

const commentContentStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

const commentTopLineStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "6px",
  minWidth: 0,
};

const commentAuthorLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const commentTimeStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  fontWeight: 750,
  whiteSpace: "nowrap",
};

const commentTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12.5px",
  lineHeight: 1.38,
  fontWeight: 750,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

const commentActionsRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const commentReplyButtonStyle: CSSProperties = {
  width: "fit-content",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0 0",
  cursor: "pointer",
};

const commentRemoveButtonStyle: CSSProperties = {
  ...commentReplyButtonStyle,
  color: "var(--historietas-danger-button-text, #FCA5A5)",
};

const commentReportButtonStyle: CSSProperties = {
  ...commentReplyButtonStyle,
};

const commentLikeWrapStyle: CSSProperties = {
  minWidth: "28px",
  display: "grid",
  justifyItems: "center",
  alignContent: "start",
  gap: "2px",
};

const commentLikeButtonStyle: CSSProperties = {
  width: "28px",
  height: "28px",
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  cursor: "pointer",
};

const commentLikeCountStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  lineHeight: 1,
  minHeight: "10px",
  textAlign: "center",
};

const commentHeartIconStyle: CSSProperties = {
  width: "19px",
  height: "19px",
  display: "block",
  flex: "0 0 auto",
  transformOrigin: "center",
};

const commentsLoadingStyle: CSSProperties = {
  width: "100%",
  minHeight: "58px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 850,
  boxSizing: "border-box",
};

const emptyCommentsStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 800,
  textAlign: "center",
};

const commentsSheetErrorStyle: CSSProperties = {
  display: "block",
  padding: "8px 10px",
  borderRadius: "14px",
  background: "rgba(239,68,68,0.12)",
  border: "1px solid rgba(248,113,113,0.24)",
  color: "#FCA5A5",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.35,
  textAlign: "center",
};

const commentsReplyingBannerStyle: CSSProperties = {
  minHeight: "30px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  padding: "5px 8px",
  borderRadius: "12px",
  background:
    "var(--historietas-secondary-surface, rgba(255,255,255,0.05))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10.5px",
  fontWeight: 800,
};

const commentsReplyingCancelStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontSize: "10.5px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "2px 0",
  cursor: "pointer",
};

const commentsToolsStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  padding: "5px 0 0",
};

const commentsQuickReactionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "6px",
  width: "100%",
  overflowX: "auto",
  padding: "0 1px",
  scrollbarWidth: "none",
  WebkitOverflowScrolling: "touch",
};

const commentsQuickReactionButtonStyle: CSSProperties = {
  width: "30px",
  height: "28px",
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  fontSize: "18px",
  lineHeight: 1,
  padding: 0,
  cursor: "pointer",
  flex: "0 0 auto",
};

const commentsSheetFormStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "30px minmax(0, 1fr) 28px 38px",
  alignItems: "center",
  gap: "7px",
  padding: "7px 0 0",
  minWidth: 0,
};

const commentsInputAvatarStyle: CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "11px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-page-background, #000000)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #FFFFFF) 30%, transparent)",
  color: "#FFFFFF",
  fontSize: "11.5px",
  fontWeight: 950,
  overflow: "hidden",
};

const commentsInputBoxStyle: CSSProperties = {
  minWidth: 0,
  minHeight: "38px",
  display: "flex",
  alignItems: "center",
};

const commentsSheetInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "38px",
  maxHeight: "82px",
  borderRadius: "999px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-page-background, #000000)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "9px 12px",
  outline: "none",
  fontSize: "12.5px",
  lineHeight: 1.32,
  fontWeight: 650,
  resize: "none",
  overflowY: "auto",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const commentsInputIconButtonStyle: CSSProperties = {
  width: "26px",
  height: "30px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "16px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: 0,
  cursor: "pointer",
};

const commentsSheetSendStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "999px",
  border:
    "1px solid var(--historietas-bottom-nav-publish-border, color-mix(in srgb, var(--historietas-accent, #FFFFFF) 38%, transparent))",
  background:
    "var(--historietas-bottom-nav-publish-bg, var(--historietas-accent, #FFFFFF))",
  color: "var(--historietas-list-comments-send-text, #FFFFFF)",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  fontFamily: "inherit",
  padding: 0,
};
