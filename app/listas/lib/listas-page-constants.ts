import { type PermissoesAbasPerfil } from "../../../lib/historietasPrivacy";
import {
  type CategoriaPerfil,
  type EditorAnotacaoListasEstado,
  type ListasPerfilEstado,
} from "../types";

export const LISTAS_PERFIL_VAZIAS: ListasPerfilEstado = {
  tudo: [],
  lendo: [],
  "quero-ler": [],
  favoritas: [],
  concluidas: [],
  avaliacoes: [],
  historico: [],
};

export const PERMISSOES_PROPRIO_PERFIL: PermissoesAbasPerfil = {
  obras: true,
  sobre: true,
  diario: true,
  comunidade: true,
  biblioteca: true,
  atividades: true,
};

export const CATEGORIAS_PERFIL: Array<{
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

export const LIBRARY_FOLLOW_STORAGE_KEY = "historietas-obras-seguidas";
export const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
export const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
export const DIARIO_ANOTACAO_MAX_LENGTH = 700;
export const DIARIO_COMENTARIO_MAX_LENGTH = 700;
export const NOTAS_AVALIACAO_LISTAS = [1, 2, 3, 4, 5] as const;

export const EDITOR_ANOTACAO_LISTAS_VAZIO: EditorAnotacaoListasEstado = {
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
